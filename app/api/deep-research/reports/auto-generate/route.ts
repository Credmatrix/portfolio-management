// Auto-Generate Comprehensive Reports API
// Automatically generates comprehensive due diligence reports when all research completes

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ComprehensiveReportGeneratorService } from '@/lib/services/comprehensive-report-generator.service'
import { z } from 'zod'

const AutoGenerateReportSchema = z.object({
    request_id: z.string().min(1, 'Request ID is required'),
    force_generate: z.boolean().optional().default(false),
    include_executive_summary: z.boolean().optional().default(true),
    include_detailed_findings: z.boolean().optional().default(true),
    include_risk_assessment: z.boolean().optional().default(true),
    include_recommendations: z.boolean().optional().default(true)
})

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

        // Parse and validate request body
        const body = await request.json()
        const validatedData = AutoGenerateReportSchema.parse(body)

        // Verify user has access to the portfolio request
        const { data: portfolioRequest, error: portfolioError } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name, user_id')
            .eq('request_id', validatedData.request_id)
            .single()

        if (portfolioError || !portfolioRequest) {
            return NextResponse.json(
                { error: 'Portfolio request not found or access denied' },
                { status: 404 }
            )
        }

        // Initialize comprehensive report generator service
        const reportGenerator = new ComprehensiveReportGeneratorService()

        // Check if auto-report generation should be triggered
        if (!validatedData.force_generate) {
            const shouldGenerate = await reportGenerator.shouldTriggerAutoReportGeneration(
                validatedData.request_id,
                user.id
            )

            if (!shouldGenerate) {
                return NextResponse.json({
                    success: false,
                    message: 'Auto-report generation conditions not met. Not all core research types are completed.',
                    trigger_conditions: {
                        required_research_types: ['directors_research', 'legal_research', 'negative_news', 'regulatory_research'],
                        force_generate_available: true
                    }
                })
            }
        }

        // Check if comprehensive report already exists
        const { data: existingReport } = await supabase
            .from('deep_research_reports')
            .select('id, title, generated_at, auto_generated')
            .eq('request_id', validatedData.request_id)
            .eq('user_id', user.id)
            .eq('report_type', 'comprehensive_due_diligence')
            .eq('auto_generated', true)
            .order('generated_at', { ascending: false })
            .limit(1)
            .single()

        if (existingReport && !validatedData.force_generate) {
            return NextResponse.json({
                success: false,
                message: 'Comprehensive report already exists for this request',
                existing_report: {
                    report_id: existingReport.id,
                    title: existingReport.title,
                    generated_at: existingReport.generated_at
                },
                force_generate_available: true
            })
        }

        // Generate comprehensive report
        const reportConfig = {
            auto_generate: true,
            include_executive_summary: validatedData.include_executive_summary,
            include_detailed_findings: validatedData.include_detailed_findings,
            include_risk_assessment: validatedData.include_risk_assessment,
            include_recommendations: validatedData.include_recommendations,
            synthesis_model: 'claude-opus-4-1-20250805' as const,
            max_tokens: 8000,
            temperature: 0.1
        }

        const result = await reportGenerator.autoGenerateComprehensiveReport(
            validatedData.request_id,
            user.id,
            reportConfig
        )

        if (!result.success) {
            return NextResponse.json({
                success: false,
                message: result.message
            }, { status: 400 })
        }

        // Log successful auto-generation
        await supabase
            .from('deep_research_audit_log')
            .insert({
                action: 'auto_report_generated',
                details: {
                    request_id: validatedData.request_id,
                    report_id: result.report_id,
                    force_generate: validatedData.force_generate,
                    config: reportConfig
                } as any,
                user_id: user.id,
                ip_address: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
            })

        return NextResponse.json({
            success: true,
            message: result.message,
            report_id: result.report_id,
            company_name: portfolioRequest.company_name,
            auto_generated: true,
            report_url: `/api/deep-research/reports/${result.report_id}`,
            next_steps: [
                'Review the comprehensive report',
                'Validate key findings and risk assessment',
                'Use insights for credit decision making',
                'Export report for stakeholder distribution'
            ]
        })

    } catch (error) {
        console.error('Error in auto-generate comprehensive report:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: error.errors
                },
                { status: 400 }
            )
        }

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

        if (!requestId) {
            return NextResponse.json(
                { error: 'Request ID is required' },
                { status: 400 }
            )
        }

        // Initialize report generator service
        const reportGenerator = new ComprehensiveReportGeneratorService()

        // Check auto-report generation eligibility
        const shouldGenerate = await reportGenerator.shouldTriggerAutoReportGeneration(requestId, user.id)

        // Get existing comprehensive reports
        const { data: existingReports } = await supabase
            .from('deep_research_reports')
            .select(`
                id,
                title,
                generated_at,
                auto_generated,
                risk_level,
                findings_summary
            `)
            .eq('request_id', requestId)
            .eq('user_id', user.id)
            .eq('report_type', 'comprehensive_due_diligence')
            .order('generated_at', { ascending: false })

        // Get completed research jobs
        const { data: completedJobs } = await supabase
            .from('deep_research_jobs')
            .select('id, job_type, status, completed_at')
            .eq('request_id', requestId)
            .eq('user_id', user.id)
            .eq('status', 'completed')

        const coreResearchTypes = ['directors_research', 'legal_research', 'negative_news', 'regulatory_research']
        const completedTypes = completedJobs?.map(job => job.job_type) || []
        const missingTypes = coreResearchTypes.filter(type => !completedTypes.includes(type))

        return NextResponse.json({
            success: true,
            auto_generation_eligible: shouldGenerate,
            existing_reports: existingReports || [],
            research_status: {
                total_completed_jobs: completedJobs?.length || 0,
                completed_research_types: completedTypes,
                missing_research_types: missingTypes,
                core_research_complete: missingTypes.length === 0
            },
            recommendations: {
                can_auto_generate: shouldGenerate,
                should_force_generate: existingReports && existingReports.length > 0,
                next_action: shouldGenerate
                    ? 'Ready for auto-report generation'
                    : `Complete missing research: ${missingTypes.join(', ')}`
            }
        })

    } catch (error) {
        console.error('Error checking auto-report generation status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}