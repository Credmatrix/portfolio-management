import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { v4 as uuidv4 } from 'uuid';

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

        const formData = await request.formData();
        const entityType = formData.get('entity_type') as string;
        const processingMethod = formData.get('processing_method') as string;
        const companyInfoStr = formData.get('company_info') as string;

        if (!entityType || !processingMethod) {
            return NextResponse.json(
                { success: false, error: 'Missing required fields: entity_type, processing_method' },
                { status: 400 }
            );
        }

        // Get uploaded files
        const files: File[] = [];
        let fileIndex = 0;
        while (true) {
            const file = formData.get(`files[${fileIndex}]`) as File;
            if (!file) break;
            files.push(file);
            fileIndex++;
        }

        if (files.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No files uploaded' },
                { status: 400 }
            );
        }

        // Parse company info if provided
        let companyInfo = null;
        if (companyInfoStr) {
            try {
                companyInfo = JSON.parse(companyInfoStr);
            } catch (error) {
                console.warn('Failed to parse company info:', error);
            }
        }

        // Generate request ID
        const requestId = uuidv4();

        // Validate file types and sizes
        const validFiles = files.filter(file => {
            const isExcel = file.type.includes('spreadsheet') ||
                file.name.endsWith('.xlsx') ||
                file.name.endsWith('.xls');
            const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
            return isExcel && isValidSize;
        });

        if (validFiles.length === 0) {
            return NextResponse.json(
                { success: false, error: 'No valid Excel files found' },
                { status: 400 }
            );
        }

        // Create document processing request record
        const { error: insertError } = await supabase
            .from('document_processing_requests')
            .insert({
                id: requestId,
                entity_type: entityType,
                processing_method: 'excel',
                status: 'processing',
                processing_started_at: new Date().toISOString(),
                user_id: user.id,
                file_count: validFiles.length,
                metadata: {
                    company_info: companyInfo,
                    file_names: validFiles.map(f => f.name),
                    file_sizes: validFiles.map(f => f.size)
                }
            });

        if (insertError) {
            console.error('Error creating processing request:', insertError);
            return NextResponse.json(
                { success: false, error: 'Failed to create processing request' },
                { status: 500 }
            );
        }

        // In a real implementation, you would:
        // 1. Upload files to S3 or similar storage
        // 2. Queue processing job for Excel parsing
        // 3. Extract financial data using libraries like xlsx or exceljs
        // 4. Validate and transform data according to the new format
        // 5. Store extracted data in manual_company_entries table

        // For now, simulate successful processing
        // const mockExtractedData = {
        //     company_info: {
        //         legal_name: companyInfo?.name || 'Extracted Company Name',
        //         entity_type: entityType,
        //         registration_number: companyInfo?.registration_number,
        //         financial_year_end: '2024-03-31'
        //     },
        //     financial: {
        //         format_version: 'non_corporate_2024',
        //         currency: 'INR',
        //         financial_years: ['2023-24', '2022-23', '2021-22'],
        //         balance_sheet: {
        //             owners_funds_and_liabilities: {
        //                 owners_fund: {
        //                     owners_capital_account: {
        //                         '2023-24': 500000,
        //                         '2022-23': 450000,
        //                         '2021-22': 400000
        //                     }
        //                 }
        //             }
        //         },
        //         validation_status: 'validated'
        //     }
        // };

        // Update processing request with extracted data
        await supabase
            .from('document_processing_requests')
            .update({
                status: 'completed',
                processing_completed_at: new Date().toISOString(),
                // extracted_data: mockExtractedData
            })
            .eq('id', requestId);

        return NextResponse.json({
            success: true,
            data: {
                request_id: requestId,
                status: 'completed',
                message: 'Excel files processed successfully',
                files_processed: validFiles.length,
                // extracted_data: mockExtractedData,
                processing_method: 'excel'
            }
        });

    } catch (error) {
        console.error('Excel processing error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}