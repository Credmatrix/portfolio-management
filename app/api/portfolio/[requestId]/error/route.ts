import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ProcessingError {
    id: string;
    request_id: string;
    company_name: string;
    error_type: 'validation' | 'extraction' | 'analysis' | 'system' | 'timeout';
    error_code: string;
    error_message: string;
    error_details?: any;
    stage: string;
    timestamp: string;
    retry_count: number;
    max_retries: number;
    is_retryable: boolean;
    suggested_actions: string[];
    technical_details?: {
        stack_trace?: string;
        file_info?: any;
        system_info?: any;
    };
}

const ERROR_CODE_MAPPING = {
    'FILE_TOO_LARGE': {
        type: 'validation' as const,
        retryable: false,
        actions: [
            'Reduce file size to under 50MB',
            'Compress images or remove unnecessary pages',
            'Split large files into smaller documents'
        ]
    },
    'INVALID_FILE_FORMAT': {
        type: 'validation' as const,
        retryable: false,
        actions: [
            'Ensure the file is in PDF, Excel (.xlsx, .xls), or CSV format',
            'Check that the file is not corrupted or password-protected',
            'Try converting the file to a different supported format'
        ]
    },
    'INSUFFICIENT_DATA': {
        type: 'extraction' as const,
        retryable: false,
        actions: [
            'Ensure the document contains complete financial statements',
            'Include balance sheet, P&L, and cash flow statements',
            'Verify all required company information is present'
        ]
    },
    'EXTRACTION_FAILED': {
        type: 'extraction' as const,
        retryable: true,
        actions: [
            'Check document quality and readability',
            'Ensure text is not in image format (use OCR if needed)',
            'Verify the document structure matches expected format'
        ]
    },
    'ANALYSIS_TIMEOUT': {
        type: 'analysis' as const,
        retryable: true,
        actions: [
            'The document may be too complex - try simplifying',
            'Retry processing during off-peak hours',
            'Contact support if the issue persists'
        ]
    },
    'NETWORK_ERROR': {
        type: 'system' as const,
        retryable: true,
        actions: [
            'Check your internet connection',
            'Retry the operation',
            'Contact support if the issue persists'
        ]
    },
    'RATE_LIMIT_ERROR': {
        type: 'system' as const,
        retryable: true,
        actions: [
            'Wait a few minutes before retrying',
            'Reduce the number of concurrent uploads',
            'Contact support to increase rate limits'
        ]
    },
    'PROCESSING_TIMEOUT': {
        type: 'timeout' as const,
        retryable: true,
        actions: [
            'The document processing took too long',
            'Try uploading during off-peak hours',
            'Contact support if the document is particularly complex'
        ]
    }
};

function parseErrorCode(errorMessage: string): string {
    // Extract error code from error message or classify based on content
    if (errorMessage.includes('file too large') || errorMessage.includes('size limit')) {
        return 'FILE_TOO_LARGE';
    }
    if (errorMessage.includes('invalid format') || errorMessage.includes('unsupported file')) {
        return 'INVALID_FILE_FORMAT';
    }
    if (errorMessage.includes('insufficient data') || errorMessage.includes('missing information')) {
        return 'INSUFFICIENT_DATA';
    }
    if (errorMessage.includes('extraction failed') || errorMessage.includes('parse error')) {
        return 'EXTRACTION_FAILED';
    }
    if (errorMessage.includes('timeout') || errorMessage.includes('time limit')) {
        return 'ANALYSIS_TIMEOUT';
    }
    if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        return 'NETWORK_ERROR';
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
        return 'RATE_LIMIT_ERROR';
    }

    return 'SYSTEM_ERROR';
}

function determineStage(errorMessage: string, status: string): string {
    if (errorMessage.includes('validation') || errorMessage.includes('format')) {
        return 'validation';
    }
    if (errorMessage.includes('extraction') || errorMessage.includes('parsing')) {
        return 'extraction';
    }
    if (errorMessage.includes('analysis') || errorMessage.includes('calculation')) {
        return 'analysis';
    }
    if (errorMessage.includes('benchmark') || errorMessage.includes('comparison')) {
        return 'benchmarking';
    }
    if (errorMessage.includes('report') || errorMessage.includes('generation')) {
        return 'reporting';
    }

    return 'unknown';
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    // try {
    //     const supabase = await createServerSupabaseClient()

    //     const { data: { user }, error: authError } = await supabase.auth.getUser()
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //     }

    //     const { requestId } = await params

    //     // Get the processing request
    //     const { data: processingRequest, error: fetchError } = await supabase
    //         .from('document_processing_requests')
    //         .select('*')
    //         .eq('request_id', requestId)
    //         .eq('user_id', user.id)
    //         .single()

    //     if (fetchError || !processingRequest) {
    //         return NextResponse.json({
    //             error: 'Processing request not found'
    //         }, { status: 404 })
    //     }

    //     // Only return error details if the request has failed
    //     if (processingRequest.status !== 'failed' || !processingRequest.error_message) {
    //         return NextResponse.json({
    //             error: 'No error found for this request'
    //         }, { status: 404 })
    //     }

    //     const errorCode = parseErrorCode(processingRequest.error_message);
    //     const errorConfig = ERROR_CODE_MAPPING[errorCode as keyof typeof ERROR_CODE_MAPPING] || {
    //         type: 'system' as const,
    //         retryable: false,
    //         actions: ['Contact support for assistance']
    //     };

    //     const stage = determineStage(processingRequest.error_message, processingRequest.status);
    //     const maxRetries = 3;
    //     const isRetryable = errorConfig.retryable && (processingRequest.retry_count || 0) < maxRetries;

    //     // Get additional error details from processing logs
    //     const { data: errorLogs } = await supabase
    //         .from('processing_logs')
    //         .select('*')
    //         .eq('request_id', requestId)
    //         .eq('level', 'error')
    //         .order('timestamp', { ascending: false })
    //         .limit(1);

    //     const technicalDetails: any = {};
    //     if (errorLogs && errorLogs.length > 0) {
    //         const errorLog = errorLogs[0];
    //         technicalDetails.stack_trace = errorLog.details?.stack_trace;
    //         technicalDetails.file_info = {
    //             filename: processingRequest.original_filename,
    //             size: processingRequest.file_size,
    //             extension: processingRequest.file_extension
    //         };
    //         technicalDetails.system_info = errorLog.details?.system_info;
    //     }

    //     const errorResponse: ProcessingError = {
    //         id: `error_${processingRequest.id}`,
    //         request_id: requestId,
    //         company_name: processingRequest.company_name || 'Unknown Company',
    //         error_type: errorConfig.type,
    //         error_code: errorCode,
    //         error_message: processingRequest.error_message,
    //         error_details: processingRequest.error_details,
    //         stage,
    //         timestamp: processingRequest.completed_at || processingRequest.submitted_at,
    //         retry_count: processingRequest.retry_count || 0,
    //         max_retries: maxRetries,
    //         is_retryable: isRetryable,
    //         suggested_actions: errorConfig.actions,
    //         technical_details: Object.keys(technicalDetails).length > 0 ? technicalDetails : undefined
    //     };

    //     return NextResponse.json(errorResponse)

    // } catch (error) {
    //     console.error('Error fetch error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}