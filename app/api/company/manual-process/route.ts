import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { manualProcessingService } from '@/lib/services/manual-processing.service';
import { EntityType } from '@/types/manual-company.types';

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

        const body = await request.json();
        const {
            entity_type,
            basic_details,
            ownership_structure,
            financial_data,
            compliance_data
        } = body;

        // Validate required fields
        if (!entity_type || !basic_details) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: entity_type, basic_details' },
                { status: 400 }
            );
        }

        // Validate entity type
        const validEntityTypes: EntityType[] = [
            'private_limited', 'public_limited', 'llp', 'partnership_registered',
            'partnership_unregistered', 'proprietorship', 'huf', 'trust_private',
            'trust_public', 'society'
        ];

        if (!validEntityTypes.includes(entity_type)) {
            return NextResponse.json(
                { success: false, error: 'Invalid entity type' },
                { status: 400 }
            );
        }

        // Validate basic details structure
        if (!basic_details.legal_name) {
            return NextResponse.json(
                { success: false, error: 'Legal name is required in basic_details' },
                { status: 400 }
            );
        }

        // Process manual entry
        const processingRequest = {
            entity_type,
            basic_details,
            ownership_structure,
            financial_data,
            compliance_data,
            user_id: user.id
        };

        const result = await manualProcessingService.processManualEntry(processingRequest);

        return NextResponse.json({
            success: true,
            data: {
                request_id: result.request_id,
                status: result.status,
                processing_method: 'manual',
                data_completeness_score: result.data_completeness_score,
                data_quality_indicators: result.data_quality_indicators,
                risk_analysis: result.risk_analysis,
                processing_notes: result.processing_notes,
                message: 'Manual entry processed successfully'
            }
        });

    } catch (error) {
        console.error('Manual processing API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
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

        const { searchParams } = new URL(request.url);
        const requestId = searchParams.get('request_id');

        if (!requestId) {
            return NextResponse.json(
                { success: false, error: 'request_id parameter is required' },
                { status: 400 }
            );
        }

        // Get manual entry details
        const { data: manualEntry, error: entryError } = await supabase
            .from('manual_company_entries')
            .select('*')
            .eq('request_id', requestId)
            .eq('created_by', user.id)
            .single();

        if (entryError || !manualEntry) {
            return NextResponse.json(
                { success: false, error: 'Manual entry not found' },
                { status: 404 }
            );
        }

        // Get processing request details
        const { data: processingRequest, error: requestError } = await supabase
            .from('document_processing_requests')
            .select('*')
            .eq('id', requestId)
            .single();

        if (requestError || !processingRequest) {
            return NextResponse.json(
                { success: false, error: 'Processing request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                manual_entry: manualEntry,
                processing_request: processingRequest,
                combined_status: {
                    request_id: requestId,
                    status: processingRequest.status,
                    processing_method: 'manual',
                    data_completeness_score: manualEntry.data_completeness_score,
                    data_quality_indicators: manualEntry.data_quality_indicators,
                    processing_notes: manualEntry.processing_notes,
                    created_at: manualEntry.created_at,
                    updated_at: manualEntry.updated_at
                }
            }
        });

    } catch (error) {
        console.error('Manual processing GET API error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
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

        const body = await request.json();
        const {
            request_id,
            status,
            basic_details,
            ownership_structure,
            financial_data,
            compliance_data,
            processing_notes
        } = body;

        if (!request_id) {
            return NextResponse.json(
                { success: false, error: 'request_id is required' },
                { status: 400 }
            );
        }

        // Update manual entry
        const updateData: any = {
            updated_at: new Date().toISOString(),
            updated_by: user.id
        };

        if (basic_details) updateData.basic_details = basic_details;
        if (ownership_structure) updateData.ownership_structure = ownership_structure;
        if (financial_data) updateData.financial_data = financial_data;
        if (compliance_data) updateData.compliance_data = compliance_data;
        if (status) updateData.processing_status = status;
        if (processing_notes) updateData.processing_notes = processing_notes;

        // Recalculate data completeness if data is updated
        if (basic_details || ownership_structure || financial_data || compliance_data) {
            // This would require implementing the calculation logic here or calling the service
            // For now, we'll just update the timestamp
            updateData.data_quality_indicators = {
                ...updateData.data_quality_indicators,
                last_updated: new Date().toISOString()
            };
        }

        const { error: updateError } = await supabase
            .from('manual_company_entries')
            .update(updateData)
            .eq('request_id', request_id)
            .eq('created_by', user.id);

        if (updateError) {
            throw new Error(`Failed to update manual entry: ${updateError.message}`);
        }

        // Update processing request status if provided
        if (status) {
            await manualProcessingService.updateProcessingStatus(request_id, status, processing_notes);
        }

        return NextResponse.json({
            success: true,
            data: {
                request_id,
                message: 'Manual entry updated successfully',
                updated_at: updateData.updated_at
            }
        });

    } catch (error) {
        console.error('Manual processing PUT API error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Internal server error',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}