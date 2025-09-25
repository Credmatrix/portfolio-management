import { NextRequest, NextResponse } from 'next/server'
import { DeepResearchService } from '@/lib/services/deep-research.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const deepResearchService = new DeepResearchService()

// GET /api/deep-research/jobs/[jobId]/iterations - Get all iterations for a job
export async function GET(
    request: NextRequest,
    { params }: { params: { jobId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get user from session
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const jobId = params.jobId

        // Verify user owns the job
        const { data: job } = await supabase
            .from('deep_research_jobs')
            .select('id, user_id')
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single()

        if (!job) {
            return NextResponse.json(
                { success: false, message: 'Job not found or access denied' },
                { status: 404 }
            )
        }

        // Get all iterations for the job
        const { data: iterations, error } = await supabase
            .from('deep_research_iterations')
            .select('*')
            .eq('job_id', jobId)
            .order('iteration_number')

        if (error) {
            throw new Error(`Failed to fetch iterations: ${error.message}`)
        }

        return NextResponse.json({
            success: true,
            iterations: iterations || [],
            message: 'Iterations retrieved successfully'
        })

    } catch (error) {
        console.error('Error fetching iterations:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to fetch iterations'
            },
            { status: 500 }
        )
    }
}

// POST /api/deep-research/jobs/[jobId]/iterations - Start a new iteration
export async function POST(
    request: NextRequest,
    { params }: { params: { jobId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get user from session
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { success: false, message: 'Unauthorized' },
                { status: 401 }
            )
        }

        const jobId = params.jobId
        const body = await request.json()

        // Validate request body
        const schema = z.object({
            iteration_number: z.number().min(1),
            research_focus: z.object({}).optional(),
            force_start: z.boolean().optional()
        })

        const { iteration_number, research_focus, force_start } = schema.parse(body)

        // Verify user owns the job
        const { data: job } = await supabase
            .from('deep_research_jobs')
            .select('*')
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single()

        if (!job) {
            return NextResponse.json(
                { success: false, message: 'Job not found or access denied' },
                { status: 404 }
            )
        }

        // Check if iteration already exists
        const { data: existingIteration } = await supabase
            .from('deep_research_iterations')
            .select('id, status')
            .eq('job_id', jobId)
            .eq('iteration_number', iteration_number)
            .single()

        if (existingIteration && !force_start) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Iteration ${iteration_number} already exists with status: ${existingIteration.status}`
                },
                { status: 409 }
            )
        }

        // Create new iteration
        const { data: iteration, error: iterationError } = await supabase
            .from('deep_research_iterations')
            .insert({
                job_id: jobId,
                iteration_number,
                research_type: job.job_type,
                research_focus: research_focus || {},
                status: 'pending'
            })
            .select()
            .single()

        if (iterationError) {
            throw new Error(`Failed to create iteration: ${iterationError.message}`)
        }

        // Update job current iteration if this is higher
        if (iteration_number > job.current_iteration) {
            await supabase
                .from('deep_research_jobs')
                .update({ current_iteration: iteration_number })
                .eq('id', jobId)
        }

        return NextResponse.json({
            success: true,
            iteration,
            message: `Iteration ${iteration_number} created successfully`
        })

    } catch (error) {
        console.error('Error creating iteration:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to create iteration'
            },
            { status: 500 }
        )
    }
}