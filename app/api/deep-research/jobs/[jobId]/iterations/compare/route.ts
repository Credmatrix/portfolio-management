import { NextRequest, NextResponse } from 'next/server'
import { DeepResearchService } from '@/lib/services/deep-research.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const deepResearchService = new DeepResearchService()

// POST /api/deep-research/jobs/[jobId]/iterations/compare - Compare two iterations
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
            iteration_1: z.number().min(1),
            iteration_2: z.number().min(1)
        })

        const { iteration_1, iteration_2 } = schema.parse(body)

        if (iteration_1 === iteration_2) {
            return NextResponse.json(
                { success: false, message: 'Cannot compare iteration with itself' },
                { status: 400 }
            )
        }

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

        // Use service to compare iterations
        const result = await deepResearchService.compareIterations(
            jobId,
            iteration_1,
            iteration_2,
            user.id
        )

        if (!result.success) {
            return NextResponse.json(result, { status: 400 })
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('Error comparing iterations:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to compare iterations'
            },
            { status: 500 }
        )
    }
}