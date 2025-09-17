// Deep Research Jobs API
// Handles starting and managing research jobs

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DeepResearchService } from '@/lib/services/deep-research.service'
import { StartResearchJobRequest } from '@/types/deep-research.types'

/**
 * Starts a new deep research job for an authenticated user.
 *
 * Validates the request body (requires `request_id` and `job_type`), confirms the
 * authenticated user's access to the referenced portfolio request, prevents creation
 * of duplicate active jobs of the same type, and delegates job creation to
 * DeepResearchService (now including an audit `userContext` extracted from request headers).
 *
 * Responses:
 * - 401 Unauthorized if the caller is not authenticated.
 * - 400 Bad Request if `request_id` or `job_type` is missing.
 * - 404 Not Found if the referenced portfolio request is not found or inaccessible.
 * - 409 Conflict if an active job of the same type already exists (returns `existing_job_id`).
 * - 500 Internal Server Error if job creation fails or an unexpected error occurs.
 *
 * @returns A NextResponse containing success state and, on success, `job_id`, `message`, and `company_name`.
 */
export async function POST(request: NextRequest) {
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

        // Parse request body
        const body: StartResearchJobRequest = await request.json()

        // Validate required fields
        if (!body.request_id || !body.job_type) {
            return NextResponse.json(
                { error: 'Missing required fields: request_id, job_type' },
                { status: 400 }
            )
        }

        // Verify user has access to the portfolio request
        const { data: portfolioRequest, error: portfolioError } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name')
            .eq('request_id', body.request_id)
            .single()

        if (portfolioError || !portfolioRequest) {
            return NextResponse.json(
                { error: 'Portfolio request not found or access denied' },
                { status: 404 }
            )
        }

        // Check for existing active jobs of the same type
        const { data: existingJobs } = await supabase
            .from('deep_research_jobs')
            .select('id, status')
            .eq('request_id', body.request_id)
            .eq('job_type', body.job_type)
            .in('status', ['pending', 'running'])

        if (existingJobs && existingJobs.length > 0) {
            return NextResponse.json(
                {
                    error: 'A research job of this type is already running for this company',
                    existing_job_id: existingJobs[0].id
                },
                { status: 409 }
            )
        }

        // Extract user context for audit logging
        const userContext = {
            ip_address: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown',
            user_agent: request.headers.get('user-agent') || 'unknown'
        }

        // Start research job
        const researchService = new DeepResearchService()
        const result = await researchService.startResearchJob(user.id, body, userContext)

        if (!result.success) {
            return NextResponse.json(
                { error: result.message },
                { status: 500 }
            )
        }

        return NextResponse.json({
            success: true,
            job_id: result.job_id,
            message: result.message,
            company_name: portfolioRequest.company_name
        })

    } catch (error) {
        console.error('Error starting research job:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
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

        // Get query parameters
        const { searchParams } = new URL(request.url)
        const requestId = searchParams.get('request_id')
        const status = searchParams.get('status')

        // Build query
        let query = supabase
            .from('deep_research_jobs')
            .select(`
        *,
        document_processing_requests!inner(company_name)
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (requestId) {
            query = query.eq('request_id', requestId)
        }

        if (status) {
            query = query.eq('status', status)
        }

        const { data: jobs, error } = await query

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            jobs: jobs || []
        })

    } catch (error) {
        console.error('Error fetching research jobs:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}