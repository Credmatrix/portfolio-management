import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

/**
 * GET handler that returns audit logs from `deep_research_audit_log` for the authenticated user.
 *
 * Builds a Supabase query filtered by optional query parameters:
 * - `job_id`: restricts logs to a single job
 * - `request_id`: finds jobs for that request belonging to the user and restricts logs to those jobs
 * - `action`: filters logs by action
 * - `limit`: maximum number of logs to return (defaults to 50)
 *
 * If neither `job_id` nor `request_id` is provided, results are limited to logs for jobs owned by the authenticated user.
 * Responds with 401 when the request is unauthenticated, 500 on server or query errors, or 200 with `{ success: true, audit_logs: [...] }` on success.
 *
 * @returns A NextResponse JSON payload containing either an error message with an appropriate HTTP status, or `{ success: true, audit_logs: [...] }`.
 */
export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const jobId = searchParams.get('job_id')
        const requestId = searchParams.get('request_id')
        const action = searchParams.get('action')
        const limit = parseInt(searchParams.get('limit') || '50')

        let query = supabase
            .from('deep_research_audit_log')
            .select('*')
            .order('timestamp', { ascending: false })
            .limit(limit)

        if (jobId) {
            query = query.eq('job_id', jobId)
        }

        if (requestId) {
            // Get all jobs for this request first
            const { data: jobs } = await supabase
                .from('deep_research_jobs')
                .select('id')
                .eq('request_id', requestId)
                .eq('user_id', user.id)

            if (jobs && jobs.length > 0) {
                const jobIds = jobs.map(job => job.id)
                query = query.in('job_id', jobIds)
            }
        }

        if (action) {
            query = query.eq('action', action)
        }

        // Filter by user's jobs only
        if (!jobId && !requestId) {
            const { data: userJobs } = await supabase
                .from('deep_research_jobs')
                .select('id')
                .eq('user_id', user.id)

            if (userJobs && userJobs.length > 0) {
                const jobIds = userJobs.map(job => job.id)
                query = query.in('job_id', jobIds)
            }
        }

        const { data: auditLogs, error } = await query

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            audit_logs: auditLogs || []
        })

    } catch (error) {
        console.error('Error fetching audit logs:', error)
        return NextResponse.json({
            error: 'Failed to fetch audit logs'
        }, { status: 500 })
    }
}