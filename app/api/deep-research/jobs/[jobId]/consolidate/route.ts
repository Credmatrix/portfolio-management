import { NextRequest, NextResponse } from 'next/server'
import { DeepResearchService } from '@/lib/services/deep-research.service'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { z } from 'zod'

const deepResearchService = new DeepResearchService()

// POST /api/deep-research/jobs/[jobId]/consolidate - Consolidate findings from multiple iterations
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
        const body = await request.json().catch(() => ({}))

        // Validate request body
        const schema = z.object({
            consolidation_strategy: z.enum(['merge', 'latest', 'comprehensive']).optional(),
            force_consolidate: z.boolean().optional()
        })

        const { consolidation_strategy = 'comprehensive', force_consolidate = false } = schema.parse(body)

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

        // Check if consolidation already exists
        const { data: existingConsolidation } = await supabase
            .from('research_findings_consolidation')
            .select('id, consolidated_at')
            .eq('job_id', jobId)
            .single()

        if (existingConsolidation && !force_consolidate) {
            return NextResponse.json(
                {
                    success: false,
                    message: `Consolidation already exists (created: ${existingConsolidation.consolidated_at}). Use force_consolidate=true to recreate.`
                },
                { status: 409 }
            )
        }

        // Check if there are completed iterations to consolidate
        const { data: completedIterations } = await supabase
            .from('deep_research_iterations')
            .select('id, iteration_number')
            .eq('job_id', jobId)
            .eq('status', 'completed')

        if (!completedIterations || completedIterations.length < 2) {
            return NextResponse.json(
                {
                    success: false,
                    message: 'At least 2 completed iterations are required for consolidation'
                },
                { status: 400 }
            )
        }

        // Delete existing consolidation if force_consolidate is true
        if (existingConsolidation && force_consolidate) {
            await supabase
                .from('research_findings_consolidation')
                .delete()
                .eq('id', existingConsolidation.id)
        }

        // Perform consolidation using service method
        try {
            // Get all completed iterations
            const { data: iterations } = await supabase
                .from('deep_research_iterations')
                .select('*')
                .eq('job_id', jobId)
                .eq('status', 'completed')
                .order('iteration_number')

            if (!iterations || iterations.length === 0) {
                throw new Error('No completed iterations found for consolidation')
            }

            // Use the service's consolidation logic
            const consolidatedFindings = deepResearchService['mergeIterationFindings'](iterations)
            const consolidatedAnalysis = deepResearchService['buildConsolidatedAnalysis'](iterations)
            const overallConfidence = deepResearchService['calculateOverallConfidence'](iterations)
            const dataCompleteness = deepResearchService['calculateOverallDataCompleteness'](iterations)

            // Create consolidation record
            const { data: consolidation, error: consolidationError } = await supabase
                .from('research_findings_consolidation')
                .insert({
                    job_id: jobId,
                    consolidation_strategy,
                    iterations_included: iterations.map(i => i.iteration_number),
                    consolidated_findings: consolidatedFindings,
                    primary_entity_analysis: consolidatedAnalysis.primary_entity,
                    directors_analysis: consolidatedAnalysis.directors,
                    subsidiaries_analysis: consolidatedAnalysis.subsidiaries,
                    regulatory_findings: consolidatedAnalysis.regulatory,
                    litigation_findings: consolidatedAnalysis.litigation,
                    overall_confidence_score: overallConfidence,
                    data_completeness_score: dataCompleteness,
                    verification_level: overallConfidence > 0.8 ? 'high' : overallConfidence > 0.6 ? 'medium' : 'low',
                    comprehensive_risk_assessment: consolidatedAnalysis.risk_assessment,
                    requires_immediate_attention: consolidatedAnalysis.requires_attention,
                    follow_up_required: consolidatedAnalysis.follow_up_actions
                })
                .select()
                .single()

            if (consolidationError) {
                throw new Error(`Failed to create consolidation: ${consolidationError.message}`)
            }

            // Update job with consolidated results
            await supabase
                .from('deep_research_jobs')
                .update({
                    findings: consolidatedFindings,
                    consolidation_required: false
                })
                .eq('id', jobId)

            return NextResponse.json({
                success: true,
                consolidation: {
                    id: consolidation.id,
                    strategy: consolidation_strategy,
                    iterations_consolidated: iterations.length,
                    overall_confidence: overallConfidence,
                    data_completeness: dataCompleteness,
                    verification_level: consolidation.verification_level,
                    requires_attention: consolidation.requires_immediate_attention,
                    consolidated_at: consolidation.consolidated_at
                },
                message: `Successfully consolidated ${iterations.length} iterations using ${consolidation_strategy} strategy`
            })

        } catch (consolidationError) {
            console.error('Consolidation process failed:', consolidationError)
            throw consolidationError
        }

    } catch (error) {
        console.error('Error consolidating findings:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to consolidate findings'
            },
            { status: 500 }
        )
    }
}

// GET /api/deep-research/jobs/[jobId]/consolidate - Get consolidation status
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
            .select('id, user_id, consolidation_required')
            .eq('id', jobId)
            .eq('user_id', user.id)
            .single()

        if (!job) {
            return NextResponse.json(
                { success: false, message: 'Job not found or access denied' },
                { status: 404 }
            )
        }

        // Get consolidation data
        const { data: consolidation } = await supabase
            .from('research_findings_consolidation')
            .select('*')
            .eq('job_id', jobId)
            .single()

        // Get completed iterations count
        const { data: completedIterations } = await supabase
            .from('deep_research_iterations')
            .select('id')
            .eq('job_id', jobId)
            .eq('status', 'completed')

        const status = consolidation ? 'completed' :
            job.consolidation_required ? 'required' : 'not_required'

        return NextResponse.json({
            success: true,
            consolidation_status: {
                status,
                consolidation_required: job.consolidation_required,
                completed_iterations_count: completedIterations?.length || 0,
                consolidation_data: consolidation,
                can_consolidate: (completedIterations?.length || 0) >= 2
            },
            message: 'Consolidation status retrieved successfully'
        })

    } catch (error) {
        console.error('Error getting consolidation status:', error)
        return NextResponse.json(
            {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to get consolidation status'
            },
            { status: 500 }
        )
    }
}