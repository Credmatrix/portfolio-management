import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { awsApiService } from '@/lib/services/aws-api.service'

export async function POST(
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

    //     // Get the existing request
    //     const { data: existingRequest, error: fetchError } = await supabase
    //         .from('document_processing_requests')
    //         .select('*')
    //         .eq('request_id', requestId)
    //         .eq('user_id', user.id)
    //         .single()

    //     if (fetchError || !existingRequest) {
    //         return NextResponse.json({
    //             error: 'Processing request not found'
    //         }, { status: 404 })
    //     }

    //     // Only allow retry for failed requests
    //     if (existingRequest.status !== 'failed') {
    //         return NextResponse.json({
    //             error: 'Can only retry failed processing requests'
    //         }, { status: 400 })
    //     }

    //     // Check retry limit (max 3 retries)
    //     if (existingRequest.retry_count >= 3) {
    //         return NextResponse.json({
    //             error: 'Maximum retry limit reached (3 attempts)'
    //         }, { status: 400 })
    //     }

    //     try {
    //         // Call AWS API to retry processing
    //         const retryResult = await awsApiService.retryProcessing(requestId)

    //         if (!retryResult.success) {
    //             throw new Error(retryResult.message || 'AWS API retry failed')
    //         }

    //         // Update the request to retry
    //         const { data: updatedRequest, error: updateError } = await supabase
    //             .from('document_processing_requests')
    //             .update({
    //                 status: 'processing',
    //                 retry_count: existingRequest.retry_count + 1,
    //                 error_message: null,
    //                 processing_started_at: new Date().toISOString(),
    //                 completed_at: null,
    //                 updated_at: new Date().toISOString()
    //             })
    //             .eq('id', existingRequest.id)
    //             .select()
    //             .single()

    //         if (updateError) {
    //             console.error('Database error:', updateError)
    //             return NextResponse.json({
    //                 error: 'Failed to update retry status'
    //             }, { status: 500 })
    //         }

    //         // Log the retry for audit purposes
    //         try {
    //             await supabase
    //                 .from('audit_logs')
    //                 .insert({
    //                     user_id: user.id,
    //                     action: 'portfolio_document_retry',
    //                     resource_type: 'document_processing_request',
    //                     resource_id: existingRequest.id,
    //                     details: {
    //                         request_id: requestId,
    //                         company_name: existingRequest.company_name,
    //                         retry_count: updatedRequest.retry_count,
    //                         previous_error: existingRequest.error_message,
    //                         aws_response: retryResult
    //                     },
    //                     ip_address: request.headers.get('x-forwarded-for') || null,
    //                     user_agent: request.headers.get('user-agent') || null
    //                 })
    //         } catch (auditError: any) {
    //             console.warn('Audit log failed:', auditError)
    //         }

    //         return NextResponse.json({
    //             success: true,
    //             message: 'Processing retry initiated successfully',
    //             data: {
    //                 id: updatedRequest.id,
    //                 request_id: requestId,
    //                 status: updatedRequest.status,
    //                 retry_count: updatedRequest.retry_count,
    //                 processing_started_at: updatedRequest.processing_started_at,
    //                 estimated_completion: new Date(Date.now() + 10 * 60 * 1000).toISOString()
    //             },
    //             aws_response: retryResult
    //         })

    //     } catch (awsError) {
    //         console.error('AWS API retry error:', awsError)

    //         // Update database with retry failure
    //         await supabase
    //             .from('document_processing_requests')
    //             .update({
    //                 retry_count: existingRequest.retry_count + 1,
    //                 error_message: `Retry failed: ${awsError instanceof Error ? awsError.message : 'Unknown error'}`,
    //                 updated_at: new Date().toISOString()
    //             })
    //             .eq('id', existingRequest.id)

    //         return NextResponse.json({
    //             error: 'Failed to retry processing with AWS API',
    //             details: awsError instanceof Error ? awsError.message : 'Unknown error'
    //         }, { status: 500 })
    //     }

    //     return NextResponse.json({
    //         success: true,
    //         message: 'Processing request queued for retry',
    //         data: {
    //             id: updatedRequest.id,
    //             request_id: requestId,
    //             status: updatedRequest.status,
    //             retry_count: updatedRequest.retry_count,
    //             submitted_at: updatedRequest.submitted_at
    //         }
    //     })

    // } catch (error) {
    //     console.error('Retry processing error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error during retry'
    //     }, { status: 500 })
    // }
}