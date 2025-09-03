import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface RetryConfig {
    max_retries: number;
    retry_delay: number; // seconds
    backoff_multiplier: number;
    retry_conditions: string[];
}

interface RetryAttempt {
    attempt_number: number;
    started_at: string;
    completed_at?: string;
    status: 'running' | 'completed' | 'failed';
    error_message?: string;
    next_retry_at?: string;
}

interface RetryState {
    is_retryable: boolean;
    current_attempt: number;
    max_attempts: number;
    retry_config: RetryConfig;
    retry_history: RetryAttempt[];
    next_retry_at?: string;
    is_retrying: boolean;
    can_manual_retry: boolean;
    estimated_success_rate: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
    max_retries: 3,
    retry_delay: 30,
    backoff_multiplier: 2,
    retry_conditions: [
        'TEMPORARY_ERROR',
        'TIMEOUT_ERROR',
        'RATE_LIMIT_ERROR',
        'NETWORK_ERROR',
        'EXTRACTION_FAILED',
        'ANALYSIS_TIMEOUT'
    ]
};

function calculateSuccessRate(retryHistory: RetryAttempt[], errorType: string): number {
    // Base success rates by error type
    const baseRates = {
        'NETWORK_ERROR': 85,
        'TIMEOUT_ERROR': 70,
        'RATE_LIMIT_ERROR': 90,
        'EXTRACTION_FAILED': 60,
        'ANALYSIS_TIMEOUT': 55,
        'SYSTEM_ERROR': 40,
        'VALIDATION_ERROR': 10,
        'INSUFFICIENT_DATA': 5
    };

    let baseRate = baseRates[errorType as keyof typeof baseRates] || 30;

    // Adjust based on retry history
    const failedAttempts = retryHistory.filter(attempt => attempt.status === 'failed').length;
    const successfulAttempts = retryHistory.filter(attempt => attempt.status === 'completed').length;

    if (retryHistory.length > 0) {
        const historicalRate = (successfulAttempts / retryHistory.length) * 100;
        // Weight historical data more heavily as we get more attempts
        const weight = Math.min(retryHistory.length / 5, 0.7);
        baseRate = baseRate * (1 - weight) + historicalRate * weight;
    }

    // Decrease success rate with each failed attempt
    baseRate = Math.max(5, baseRate - (failedAttempts * 15));

    return Math.round(baseRate);
}

function calculateNextRetryTime(retryCount: number, config: RetryConfig): Date {
    const delay = config.retry_delay * Math.pow(config.backoff_multiplier, retryCount);
    return new Date(Date.now() + delay * 1000);
}

function isRetryableError(errorMessage: string, config: RetryConfig): boolean {
    return config.retry_conditions.some(condition =>
        errorMessage.toUpperCase().includes(condition.replace('_', ' '))
    );
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

    //     // Get retry configuration (could be customized per user/organization)
    //     const retryConfig = DEFAULT_RETRY_CONFIG;

    //     // Get retry history from audit logs
    //     const { data: auditLogs } = await supabase
    //         .from('audit_logs')
    //         .select('*')
    //         .eq('resource_id', processingRequest.id)
    //         .eq('action', 'portfolio_document_retry')
    //         .order('created_at', { ascending: true });

    //     const retryHistory: RetryAttempt[] = [];

    //     // Add original attempt
    //     retryHistory.push({
    //         attempt_number: 1,
    //         started_at: processingRequest.submitted_at,
    //         completed_at: processingRequest.completed_at,
    //         status: processingRequest.status === 'completed' ? 'completed' :
    //             processingRequest.status === 'failed' ? 'failed' : 'running',
    //         error_message: processingRequest.error_message
    //     });

    //     // Add retry attempts from audit logs
    //     if (auditLogs) {
    //         auditLogs.forEach((log, index) => {
    //             retryHistory.push({
    //                 attempt_number: index + 2,
    //                 started_at: log.created_at,
    //                 completed_at: processingRequest.completed_at,
    //                 status: processingRequest.status === 'completed' ? 'completed' :
    //                     processingRequest.status === 'failed' ? 'failed' : 'running',
    //                 error_message: processingRequest.error_message
    //             });
    //         });
    //     }

    //     const currentAttempt = processingRequest.retry_count ? processingRequest.retry_count + 1 : 1;
    //     const maxAttempts = retryConfig.max_retries + 1; // +1 for original attempt

    //     // Determine if the error is retryable
    //     const isRetryable = processingRequest.error_message ?
    //         isRetryableError(processingRequest.error_message, retryConfig) : false;

    //     // Check if we can retry (within limits and retryable error)
    //     const canRetry = isRetryable &&
    //         currentAttempt <= maxAttempts &&
    //         processingRequest.status === 'failed';

    //     // Calculate next retry time if applicable
    //     let nextRetryAt: string | undefined;
    //     if (canRetry && processingRequest.status === 'failed') {
    //         nextRetryAt = calculateNextRetryTime(currentAttempt - 1, retryConfig).toISOString();
    //     }

    //     // Determine if currently retrying
    //     const isRetrying = processingRequest.status === 'processing' ||
    //         processingRequest.status === 'submitted';

    //     // Calculate estimated success rate
    //     const errorType = processingRequest.error_message ?
    //         processingRequest.error_message.split(':')[0].toUpperCase().replace(' ', '_') :
    //         'UNKNOWN_ERROR';
    //     const estimatedSuccessRate = calculateSuccessRate(retryHistory, errorType);

    //     const retryState: RetryState = {
    //         is_retryable: isRetryable,
    //         current_attempt: currentAttempt,
    //         max_attempts: maxAttempts,
    //         retry_config: retryConfig,
    //         retry_history: retryHistory,
    //         next_retry_at: nextRetryAt,
    //         is_retrying: isRetrying,
    //         can_manual_retry: canRetry && !isRetrying,
    //         estimated_success_rate: estimatedSuccessRate
    //     };

    //     return NextResponse.json(retryState)

    // } catch (error) {
    //     console.error('Retry status fetch error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}

// export async function PUT(
//     request: NextRequest,
//     { params }: { params: Promise<{ requestId: string }> }
// ) {
//     try {
//         const supabase = await createServerSupabaseClient()

//         const { data: { user }, error: authError } = await supabase.auth.getUser()
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//         }

//         const { requestId } = await params
//         const body = await request.json()
//         const newConfig: RetryConfig = body

//         // Validate the new configuration
//         if (newConfig.max_retries < 1 || newConfig.max_retries > 10) {
//             return NextResponse.json({
//                 error: 'Max retries must be between 1 and 10'
//             }, { status: 400 })
//         }

//         if (newConfig.retry_delay < 10 || newConfig.retry_delay > 3600) {
//             return NextResponse.json({
//                 error: 'Retry delay must be between 10 and 3600 seconds'
//             }, { status: 400 })
//         }

//         // In a real implementation, you would save this configuration
//         // For now, we'll just return success
//         // await saveRetryConfig(user.id, requestId, newConfig)

//         return NextResponse.json({
//             success: true,
//             message: 'Retry configuration updated',
//             config: newConfig
//         })

//     } catch (error) {
//         console.error('Retry config update error:', error)
//         return NextResponse.json({
//             error: 'Internal server error'
//         }, { status: 500 })
//     }
// }

// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: Promise<{ requestId: string }> }
// ) {
//     try {
//         const supabase = await createServerSupabaseClient()

//         const { data: { user }, error: authError } = await supabase.auth.getUser()
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//         }

//         const { requestId } = await params

//         // Get the processing request
//         const { data: processingRequest, error: fetchError } = await supabase
//             .from('document_processing_requests')
//             .select('*')
//             .eq('request_id', requestId)
//             .eq('user_id', user.id)
//             .single()

//         if (fetchError || !processingRequest) {
//             return NextResponse.json({
//                 error: 'Processing request not found'
//             }, { status: 404 })
//         }

//         // Only allow cancellation if currently processing or queued for retry
//         if (processingRequest.status !== 'processing' && processingRequest.status !== 'submitted') {
//             return NextResponse.json({
//                 error: 'Cannot cancel retry - request is not currently processing'
//             }, { status: 400 })
//         }

//         // Update status to failed to cancel the retry
//         const { error: updateError } = await supabase
//             .from('document_processing_requests')
//             .update({
//                 status: 'failed',
//                 error_message: 'Processing cancelled by user',
//                 completed_at: new Date().toISOString()
//             })
//             .eq('id', processingRequest.id)

//         if (updateError) {
//             return NextResponse.json({
//                 error: 'Failed to cancel retry'
//             }, { status: 500 })
//         }

//         // Log the cancellation
//         try {
//             await supabase
//                 .from('audit_logs')
//                 .insert({
//                     user_id: user.id,
//                     action: 'portfolio_document_retry_cancelled',
//                     resource_type: 'document_processing_request',
//                     resource_id: processingRequest.id,
//                     details: {
//                         request_id: requestId,
//                         company_name: processingRequest.company_name,
//                         cancelled_at: new Date().toISOString()
//                     },
//                     ip_address: request.headers.get('x-forwarded-for') || null,
//                     user_agent: request.headers.get('user-agent') || null
//                 })
//         } catch (auditError) {
//             console.warn('Audit log failed:', auditError)
//         }

//         return NextResponse.json({
//             success: true,
//             message: 'Retry cancelled successfully'
//         })

//     } catch (error) {
//         console.error('Retry cancellation error:', error)
//         return NextResponse.json({
//             error: 'Internal server error'
//         }, { status: 500 })
//     }
// }