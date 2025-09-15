// Deep Research Job Status API
// Get status and cancel individual research jobs

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { DeepResearchService } from '@/lib/services/deep-research.service'

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

        // Get job status
        const researchService = new DeepResearchService()
        const result = await researchService.getResearchJobStatus(user.id, jobId)

        if (!result) {
            return NextResponse.json(
                { error: 'Research job not found' },
                { status: 404 }
            )
        }

        // Calculate estimated completion time
        let estimatedCompletion: string | undefined
        if (result.job.status === 'running' && result.job.progress && result.job.progress < 100) {
            const remainingProgress = 100 - result.job.progress
            const estimatedMinutes = Math.ceil(remainingProgress / 10) // Rough estimate
            const completionTime = new Date(Date.now() + estimatedMinutes * 60000)
            estimatedCompletion = completionTime.toISOString()
        }

        return NextResponse.json({
            success: true,
            job: result.job,
            findings: result.findings,
            estimated_completion: estimatedCompletion
        })

    } catch (error) {
        console.error('Error getting research job status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

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

        // Cancel job
        const researchService = new DeepResearchService()
        const success = await researchService.cancelResearchJob(user.id, jobId)

        if (!success) {
            return NextResponse.json(
                { error: 'Failed to cancel research job or job not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            message: 'Research job cancelled successfully'
        })

    } catch (error) {
        console.error('Error cancelling research job:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}