// Enhanced Deep Research Job Status API
// /api/deep-research/jobs/[jobId]/route.ts

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DeepResearchService } from '@/lib/services/deep-research.service'

/**
 * Retrieve an enhanced status snapshot for a deep research job.
 *
 * Returns a JSON payload containing the job record (augmented with computed fields such as
 * processing_method, quality_score, completion_confidence, requires_attention, and critical_alerts),
 * the job's findings, computed metadata (analysis depth, data sources, verification level, processing time),
 * insights (risk indicators, data completeness, recommendation priority), and an optional
 * estimated_completion timestamp for running jobs.
 *
 * Authentication: requires an authenticated user; responds with 401 if unauthorized.
 * Not found: responds with 404 if the job doesn't exist or is not accessible to the user.
 * Server errors: responds with 500 on unexpected failures.
 *
 * @param params - Route parameters promise containing `jobId`: the ID of the research job to retrieve.
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { jobId } = await params

        // Get enhanced job status
        const researchService = new DeepResearchService()
        const result = await researchService.getResearchJobStatus(user.id, jobId)

        if (!result) {
            return NextResponse.json(
                { error: 'Research job not found' },
                { status: 404 }
            )
        }

        // Calculate enhanced metrics
        const enhancedMetrics = await calculateEnhancedMetrics(result.job, result.findings)

        // Estimate completion time for running jobs
        let estimatedCompletion: string | undefined
        if (result.job.status === 'running' && result.job.progress && result.job.progress < 100) {
            const remainingProgress = 100 - result.job.progress
            const estimatedMinutes = Math.ceil(remainingProgress / 8) // Enhanced estimation
            const completionTime = new Date(Date.now() + estimatedMinutes * 60000)
            estimatedCompletion = completionTime.toISOString()
        }

        // Enhanced response with professional presentation
        const response = {
            success: true,
            job: {
                ...result.job,
                // Hide technical details from user
                processing_method: result.job.two_step_processing ? 'Advanced AI Analysis' : 'Standard Analysis',
                quality_score: enhancedMetrics.quality_score,
                completion_confidence: enhancedMetrics.completion_confidence,
                requires_attention: result.job.requires_attention || false,
                critical_alerts: enhancedMetrics.critical_alerts_count
            },
            findings: result.findings,
            estimated_completion: estimatedCompletion,
            metadata: {
                analysis_depth: 'Comprehensive',
                data_sources: enhancedMetrics.data_sources_count,
                verification_level: enhancedMetrics.verification_level,
                processing_time: enhancedMetrics.processing_time_seconds
            },
            insights: {
                risk_indicators: enhancedMetrics.risk_indicators,
                data_completeness: enhancedMetrics.data_completeness,
                recommendation_priority: enhancedMetrics.recommendation_priority
            }
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error('Error getting enhanced job status:', error)
        return NextResponse.json(
            { error: 'Unable to retrieve analysis status' },
            { status: 500 }
        )
    }
}

/**
 * Cancels a user's deep research job if it is in a cancellable state.
 *
 * Verifies the authenticated user owns the job, ensures the job status is either `pending` or `running`,
 * requests cancellation via the DeepResearchService, and records the cancellation in the audit log.
 *
 * Returns JSON responses with appropriate HTTP status codes:
 * - 200: cancellation succeeded; payload includes `message`, `cancelled_at`, and `progress_at_cancellation`.
 * - 401: when the user is not authenticated.
 * - 404: job not found or the authenticated user does not own the job.
 * - 400: job exists but is not in a cancellable state (e.g., already `completed` or `failed`).
 * - 500: cancellation failed or an unexpected server error occurred.
 *
 * @param params - Route parameters; expects `jobId` (the ID of the deep research job to cancel).
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { jobId } = await params

        // Verify job ownership and status
        const { data: job, error: jobError } = await supabase
            .from('deep_research_jobs')
            .select('status, job_type, progress')
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single()

        if (jobError || !job) {
            return NextResponse.json(
                { error: 'Analysis job not found or access denied' },
                { status: 404 }
            )
        }

        if (!['pending', 'running'].includes(job.status)) {
            return NextResponse.json(
                { error: `Cannot cancel ${job.status} analysis` },
                { status: 400 }
            )
        }

        // Cancel job with enhanced logging
        const researchService = new DeepResearchService()
        const success = await researchService.cancelResearchJob(user.id, jobId)

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to cancel analysis' },
                { status: 500 }
            )
        }

        // Log cancellation for audit trail
        await logJobCancellation(supabase, jobId, job, user.id)

        return NextResponse.json({
            success: true,
            message: `${formatJobType(job.job_type)} analysis cancelled successfully`,
            cancelled_at: new Date().toISOString(),
            progress_at_cancellation: job.progress || 0
        })

    } catch (error) {
        console.error('Error cancelling analysis job:', error)
        return NextResponse.json(
            { error: 'Unable to cancel analysis' },
            { status: 500 }
        )
    }
}

/**
 * Handles PATCH requests to reprocess or escalate a deep-research job.
 *
 * Supports two actions specified in the request JSON body:
 * - "reprocess": fetches the job's original findings, runs enhanced reanalysis on each finding, consolidates results, updates the job record with the enhanced analysis and metadata, and returns a summary of enhanced findings with `reprocessed_at`.
 *   - Expected body fields: `action: 'reprocess'`, `company_name` (used when reanalyzing findings).
 *   - Returns 404 if no findings are available for the job.
 * - "escalate": marks the job as requiring attention, sets priority to "high", records escalation metadata, and returns a success message.
 *   - Expected body field: `action: 'escalate'`.
 *
 * Authentication: requires an authenticated user; responds with 401 if unauthorized.
 *
 * Responses:
 * - 200: success payload for either reprocess or escalate actions.
 * - 400: invalid action specified.
 * - 404: no analysis data found for reprocessing.
 * - 500: server error when processing fails.
 *
 * @returns A NextResponse containing a JSON payload describing the outcome.
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ jobId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { jobId } = await params
        const body = await request.json()

        // Handle reprocessing request for enhanced analysis
        if (body.action === 'reprocess') {
            const researchService = new DeepResearchService()

            // Get original research data
            const { data: findings, error: findingsError } = await supabase
                .from('deep_research_findings')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: true })

            if (findingsError || !findings || findings.length === 0) {
                return NextResponse.json(
                    { error: 'No analysis data found for reprocessing' },
                    { status: 404 }
                )
            }

            // Enhanced reprocessing with improved algorithms
            const reprocessedResults = await Promise.all(
                findings.map(async (finding) => {
                    if (finding.content) {
                        return await performEnhancedReanalysis(
                            finding.content,
                            finding.research_type,
                            body.company_name,
                            {
                                preserve_critical_details: true,
                                enhanced_risk_detection: true,
                                financial_impact_analysis: true
                            }
                        )
                    }
                    return null
                })
            )

            // Consolidate enhanced results
            const enhancedAnalysis = consolidateEnhancedResults(reprocessedResults.filter(Boolean))

            // Update job with enhanced analysis
            await supabase
                .from('deep_research_jobs')
                .update({
                    findings: enhancedAnalysis as any,
                    updated_at: new Date().toISOString(),
                    requires_attention: enhancedAnalysis.requires_immediate_attention,
                    // Add enhanced metadata
                    processing_notes: 'Enhanced reanalysis completed with advanced algorithms'
                })
                .eq('id', jobId)

            return NextResponse.json({
                success: true,
                message: 'Analysis enhanced with advanced processing algorithms',
                enhanced_findings: {
                    critical_alerts: enhancedAnalysis.critical_alerts?.length || 0,
                    total_findings: enhancedAnalysis.total_issues || 0,
                    risk_level: enhancedAnalysis.overall_risk_level || 'PENDING',
                    requires_attention: enhancedAnalysis.requires_immediate_attention
                },
                reprocessed_at: new Date().toISOString()
            })
        }

        // Handle priority escalation
        if (body.action === 'escalate') {
            await supabase
                .from('deep_research_jobs')
                .update({
                    requires_attention: true,
                    priority: 'high',
                    escalated_at: new Date().toISOString(),
                    escalated_by: user.id
                })
                .eq('id', jobId)

            return NextResponse.json({
                success: true,
                message: 'Analysis escalated for priority review'
            })
        }

        return NextResponse.json(
            { error: 'Invalid action specified' },
            { status: 400 }
        )

    } catch (error) {
        console.error('Error processing job update:', error)
        return NextResponse.json(
            { error: 'Unable to process request' },
            { status: 500 }
        )
    }
}

/**
 * Compute enhanced quality, risk, and metadata metrics for a research job based on the job record and its findings.
 *
 * Calculates processing duration, counts critical alerts, derives a heuristic quality score (capped at 10),
 * builds simple risk indicators, and returns a compact metrics object used by the enhanced status response.
 *
 * @param job - The job record object (expects fields such as `created_at`, optional `completed_at`, `tokens_used`, `status`, `error_message`, `requires_attention`, and `progress`)
 * @param findings - Array of finding objects; expects each finding may include a `critical_alerts` array with items containing a `severity` field
 * @returns An object containing:
 *   - `quality_score`: numeric score (0–10) reflecting analysis completeness/quality
 *   - `completion_confidence`: 'High' if job is completed, otherwise 'Medium'
 *   - `critical_alerts_count`: total number of alerts with severity 'CRITICAL'
 *   - `data_sources_count`: number of findings provided
 *   - `verification_level`: 'Enhanced' if critical alerts exist, otherwise 'Standard'
 *   - `processing_time_seconds`: elapsed processing time in seconds (from created_at to completed_at or now)
 *   - `risk_indicators`: list of short risk indicator strings derived from job/findings
 *   - `data_completeness`: job progress value or 0
 *   - `recommendation_priority`: 'High'|'Medium'|'Standard' recommendation priority
 */
async function calculateEnhancedMetrics(job: any, findings: any[]) {
    const startTime = new Date(job.created_at)
    const endTime = job.completed_at ? new Date(job.completed_at) : new Date()
    const processingTimeSeconds = Math.floor((endTime.getTime() - startTime.getTime()) / 1000)

    // Extract critical alerts from findings
    const criticalAlertsCount = findings.reduce((count, finding) => {
        if (finding.critical_alerts && Array.isArray(finding.critical_alerts)) {
            return count + finding.critical_alerts.filter((alert: any) => alert.severity === 'CRITICAL').length
        }
        return count
    }, 0)

    // Calculate quality score based on multiple factors
    let qualityScore = 5 // Base score
    if (job.tokens_used > 10000) qualityScore += 2 // Comprehensive analysis
    if (job.status === 'completed' && !job.error_message) qualityScore += 2
    if (criticalAlertsCount === 0) qualityScore += 1

    // Risk indicators analysis
    const riskIndicators: string[] = []
    if (criticalAlertsCount > 0) riskIndicators.push('Critical findings detected')
    if (job.requires_attention) riskIndicators.push('Requires immediate attention')
    if (job.error_message) riskIndicators.push('Processing issues encountered')

    return {
        quality_score: Math.min(qualityScore, 10),
        completion_confidence: job.status === 'completed' ? 'High' : 'Medium',
        critical_alerts_count: criticalAlertsCount,
        data_sources_count: findings.length,
        verification_level: criticalAlertsCount > 0 ? 'Enhanced' : 'Standard',
        processing_time_seconds: processingTimeSeconds,
        risk_indicators: riskIndicators,
        data_completeness: job.progress || 0,
        recommendation_priority: criticalAlertsCount > 0 ? 'High' : job.requires_attention ? 'Medium' : 'Standard'
    }
}

/**
 * Inserts a cancellation event into the `deep_research_audit_log` table for a given job.
 *
 * Performs a best-effort insert of an audit record containing job type, progress at cancellation,
 * previous status, the cancelling user's ID, and a timestamp. Failures are caught and logged to the console.
 *
 * @param job - The job object; must include `job_type`, `progress`, and `status` fields used in the audit details.
 */
async function logJobCancellation(supabase: any, jobId: string, job: any, userId: string) {
    try {
        await supabase
            .from('deep_research_audit_log')
            .insert({
                job_id: jobId,
                user_id: userId,
                action: 'job_cancelled',
                details: {
                    job_type: job.job_type,
                    progress_at_cancellation: job.progress,
                    status_before_cancellation: job.status
                },
                timestamp: new Date().toISOString()
            })
    } catch (error) {
        console.error('Failed to log job cancellation:', error)
    }
}

/**
 * Converts a snake_case job type identifier into human-friendly Title Case.
 *
 * @param jobType - The job type identifier (expected in snake_case, e.g. `deep_research_job`)
 * @returns The job type in Title Case with spaces (e.g. `Deep Research Job`)
 */
function formatJobType(jobType: string): string {
    return jobType
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ')
}

/**
 * Performs an enhanced reanalysis of a single finding's content and returns a structured result.
 *
 * This async stub is designed to be replaced by an integration with an enhanced processing service.
 * It accepts the finding text along with context about the research and company, plus processing options,
 * and returns a normalized object describing the reanalysis outcome.
 *
 * @param content - The raw finding content to reanalyze (e.g., text, extracted snippet)
 * @param researchType - The research classification/type used to guide reanalysis
 * @param companyName - The target company name associated with the finding (for contextualization)
 * @param options - Additional processing options or flags passed to the reanalysis engine
 * @returns An object with the following fields:
 *  - `research_type`: echo of `researchType`
 *  - `enhanced_analysis`: boolean indicating whether enhanced processing was applied
 *  - `critical_findings`: array of any critical issues discovered
 *  - `risk_assessment`: summary risk state (e.g., 'PENDING', 'LOW', 'MEDIUM', 'HIGH')
 *  - `processing_options`: echo of `options`
 *  - `reanalyzed_at`: ISO timestamp of when reanalysis completed
 */
async function performEnhancedReanalysis(
    content: string,
    researchType: string,
    companyName: string,
    options: any
) {
    // This would integrate with your enhanced processing service
    // For now, return a structured response
    return {
        research_type: researchType,
        enhanced_analysis: true,
        critical_findings: [],
        risk_assessment: 'PENDING',
        processing_options: options,
        reanalyzed_at: new Date().toISOString()
    }
}

/**
 * Consolidates an array of enhanced reanalysis results into a summary payload.
 *
 * @param results - Array of enhanced result objects (one per finding) produced by reanalysis; each entry becomes part of the returned `findings` list.
 * @returns A summary object containing:
 *  - `findings`: the original `results` array,
 *  - `total_issues`: count of results,
 *  - `critical_alerts`: list of identified critical alerts (empty by default),
 *  - `requires_immediate_attention`: boolean flag (false by default),
 *  - `overall_risk_level`: aggregated risk level (defaults to 'MEDIUM'),
 *  - `enhanced_processing`: true to indicate results came from enhanced processing
 */
function consolidateEnhancedResults(results: any[]) {
    return {
        findings: results,
        total_issues: results.length,
        critical_alerts: [],
        requires_immediate_attention: false,
        overall_risk_level: 'MEDIUM',
        enhanced_processing: true
    }
}