import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';

const sqs = new SQSClient({
    region: process.env.AWS_REGION || 'ap-south-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
});

const QUEUE_URL = process.env.SQS_QUEUE_URL || 'https://sqs.ap-south-1.amazonaws.com/012509421224/credmatrix-probe-api-processing-dev';
const MOOLA_API_BASE_URL = process.env.MOOLA_API_BASE_URL || 'https://moola-axl0.credmatrix.ai/api/v1';

interface ProcessingRequest {
    cin?: string;
    pan?: string;
    company_name?: string;
    industry: 'manufacturing' | 'manufacturing-oem' | 'epc';
    model_type: 'with_banking' | 'without_banking';
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body: ProcessingRequest = await request.json();
        const { cin, pan, company_name, industry, model_type } = body;

        const identifier = cin || pan;
        const identifierType = cin ? 'CIN' : 'PAN';

        if (!identifier || !industry || !model_type) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: cin/pan, industry, model_type' },
                { status: 400 }
            );
        }

        // Get user's session token for API calls
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) {
            return NextResponse.json(
                { success: false, error: 'No valid session token' },
                { status: 401 }
            );
        }

        // Step 1: Check if company exists in our database with comprehensive_data
        const { data: existingCompany } = await supabase
            .from('companies')
            .select('id, cin, pan, comprehensive_data, comprehensive_data_cached_at')
            .or(`cin.eq.${identifier},pan.eq.${identifier}`)
            .single();

        let requestId = uuidv4();

        // Create document processing request record
        const { error: insertError } = await supabase
            .from('document_processing_requests')
            .insert({
                id: requestId,
                request_id: requestId,
                cin: cin,
                pan: pan,
                company_name: company_name,
                industry: industry,
                model_type: model_type,
                status: 'processing',
                processing_started_at: new Date().toISOString(),
                user_id: user.id,
            });

        if (insertError) {
            console.error('Error creating processing request:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create processing request' },
                { status: 500 }
            );
        }

        // Get the created request with updated request_id from trigger
        const { data: createdRequest, error: fetchError } = await supabase
            .from('document_processing_requests')
            .select('request_id')
            .eq('id', requestId)
            .single();

        if (fetchError || !createdRequest || !createdRequest.request_id) {
            console.error('Error fetching created request:', fetchError);
            return NextResponse.json(
                { success: false, error: 'Failed to retrieve processing request' },
                { status: 500 }
            );
        }
        const requestID = createdRequest.request_id;


        if (existingCompany?.comprehensive_data) {
            // Company data exists, send SQS message directly
            await sendSQSMessage({
                cin_or_pan: identifier,
                user_id: user.id,
                organization_id: user.id, // Using user_id as organization_id for now
                model_type: model_type,
                industry: industry,
                requested_at: new Date().toISOString(),
                source: 'api_processing',
                request_id: requestId,
            });

            return NextResponse.json({
                success: true,
                data: {
                    request_id: requestID,
                    status: 'processing',
                    message: 'Processing started with existing company data',
                    has_existing_data: true,
                },
            });
        } else {
            // Company data doesn't exist, need to fetch from API first
            try {
                // Step 2: Check data status
                const dataStatusResponse = await fetch(
                    `${MOOLA_API_BASE_URL}/companies/${identifier}/data-status?identifier_type=${identifierType}`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (!dataStatusResponse.ok) {
                    throw new Error(`Data status API failed: ${dataStatusResponse.status}`);
                }

                const dataStatusResult = await dataStatusResponse.json();
                const dataStatus = dataStatusResult.data?.data?.data_status;

                if (!dataStatus?.last_details_updated || !dataStatus?.last_filing_date) {
                    return NextResponse.json({
                        success: false,
                        error: 'Company data not available or incomplete',
                        details: 'Missing last_details_updated or last_filing_date',
                    }, { status: 400 });
                }

                // Step 3: Fetch comprehensive details
                const comprehensiveResponse = await fetch(
                    `${MOOLA_API_BASE_URL}/companies/${identifier}/comprehensive-details?identifier_type=${identifierType}&force_update=false`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (!comprehensiveResponse.ok) {
                    throw new Error(`Comprehensive details API failed: ${comprehensiveResponse.status}`);
                }

                // Step 5: Send SQS message for processing
                await sendSQSMessage({
                    cin_or_pan: identifier,
                    user_id: user.id,
                    organization_id: user.id,
                    model_type: model_type,
                    industry: industry,
                    requested_at: new Date().toISOString(),
                    source: 'api_processing',
                    request_id: requestId,
                });

                return NextResponse.json({
                    success: true,
                    data: {
                        request_id: requestID,
                        status: 'processing',
                        message: 'Company data fetched and processing started',
                        has_existing_data: false,
                    },
                });

            } catch (apiError) {
                console.error('API processing error:', apiError);

                // Update request status to failed
                await supabase
                    .from('document_processing_requests')
                    .update({
                        status: 'failed',
                        error_message: `API processing failed: ${apiError instanceof Error ? apiError.message : 'Unknown error'}`,
                    })
                    .eq('request_id', requestId);

                return NextResponse.json({
                    success: false,
                    error: 'Failed to fetch company data from external API',
                    details: apiError instanceof Error ? apiError.message : 'Unknown error',
                }, { status: 500 });
            }
        }

    } catch (error) {
        console.error('Processing error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

async function sendSQSMessage(messageBody: any) {
    const command = new SendMessageCommand({
        QueueUrl: QUEUE_URL,
        MessageBody: JSON.stringify(messageBody),
        MessageAttributes: {
            RequestType: {
                StringValue: 'API_PROCESSING',
                DataType: 'String',
            },
        },
    });

    try {
        await sqs.send(command);
    } catch (error) {
        console.error('SQS send error:', error);
        throw new Error('Failed to queue processing request');
    }
}