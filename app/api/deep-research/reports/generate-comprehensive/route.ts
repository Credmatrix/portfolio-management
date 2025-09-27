// Generate Comprehensive Report API
// Manually generate comprehensive due diligence reports with Claude AI synthesis

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { ComprehensiveReportGeneratorService } from '@/lib/services/comprehensive-report-generator.service'
import { z } from 'zod'

const GenerateComprehensiveReportSchema = z.object({
    request_id: z.string().min(1, 'Request ID is required'),
    title: z.string().optional(),
    include_executive_summary: z.boolean().optional().default(true),
    include_detailed_findings: z.boolean().optional().default(true),
    include_risk_assessment: z.boolean().optional().default(true),
    include_recommendations: z.boolean().optional().default(true),
    synthesis_model: z.enum(['claude-opus-4-1-20250805']).optional().default('claude-opus-4-1-20250805'),
    max_tokens: z.number().min(1000).max(8000).optional().default(8000),
    temperature: z.number().min(0).max(1).optional().default(0.1),
    force_regenerate: z.boolean().optional().default(false)
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
        const validatedData = GenerateComprehensiveReportSchema.parse(body)

        // Verify user has access to the portfolio request
        const { data: portfolioRequest, error: portfolioError } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name, user_id, cin, pan, industry')
            .eq('request_id', validatedData.request_id)
            .single()

        if (portfolioError || !portfolioRequest) {
            return NextResponse.json(
                { error: 'Portfolio request not found or access denied' },
                { status: 404 }
            )
        }

        // Check if comprehensive report already exists
        if (!validatedData.force_regenerate) {
            const { data: existingReport } = await supabase
                .from('deep_research_reports')
                .select('id, title, generated_at, auto_generated, risk_level')
                .eq('request_id', validatedData.request_id)
                .eq('user_id', user.id)
                .eq('report_type', 'comprehensive_due_diligence')
                .order('generated_at', { ascending: false })
                .limit(1)
                .single()

            if (existingReport) {
                return NextResponse.json({
                    success: false,
                    message: 'Comprehensive report already exists for this request',
                    existing_report: {
                        report_id: existingReport.id,
                        title: existingReport.title,
                        generated_at: existingReport.generated_at,
                        auto_generated: existingReport.auto_generated,
                        risk_level: existingReport.risk_level
                    },
                    suggestion: 'Use force_regenerate: true to create a new report'
                })
            }
        }

        // Get completed research jobs to validate readiness
        const { data: completedJobs } = await supabase
            .from('deep_research_jobs')
            .select('id, job_type, status, completed_at, findings')
            .eq('request_id', validatedData.request_id)
            .eq('user_id', user.id)
            .eq('status', 'completed')

        if (!completedJobs || completedJobs.length === 0) {
            return NextResponse.json({
                success: false,
                message: 'No completed research jobs found for this request',
                recommendation: 'Complete at least one research job before generating a comprehensive report'
            }, { status: 400 })
        }

        // Initialize comprehensive report generator service
        const reportGenerator = new ComprehensiveReportGeneratorService()

        // Prepare report configuration
        const reportConfig = {
            auto_generate: false,
            include_executive_summary: validatedData.include_executive_summary,
            include_detailed_findings: validatedData.include_detailed_findings,
            include_risk_assessment: validatedData.include_risk_assessment,
            include_recommendations: validatedData.include_recommendations,
            synthesis_model: validatedData.synthesis_model,
            max_tokens: validatedData.max_tokens,
            temperature: validatedData.temperature
        }

        // Generate comprehensive report
        const result = await reportGenerator.autoGenerateComprehensiveReport(
            validatedData.request_id,
            user.id,
            reportConfig
        )

        if (!result.success) {
            return NextResponse.json({
                success: false,
                message: result.message,
                error_type: 'report_generation_failed'
            }, { status: 400 })
        }

        // Update report title if provided
        if (validatedData.title && result.report_id) {
            await supabase
                .from('deep_research_reports')
                .update({
                    title: validatedData.title,
                    auto_generated: false // Mark as manually generated
                })
                .eq('id', result.report_id)
        }

        // Log manual report generation
        await supabase
            .from('deep_research_audit_log')
            .insert({
                action: 'comprehensive_report_generated_manually',
                details: {
                    request_id: validatedData.request_id,
                    report_id: result.report_id,
                    config: reportConfig,
                    completed_jobs_count: completedJobs.length,
                    force_regenerate: validatedData.force_regenerate
                } as any,
                user_id: user.id,
                ip_address: request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    'unknown',
                user_agent: request.headers.get('user-agent') || 'unknown'
            })

        // Get the generated report details
        const { data: generatedReport } = await supabase
            .from('deep_research_reports')
            .select(`
                id,
                title,
                risk_level,
                generated_at,
                findings_summary,
                sections
            `)
            .eq('id', result.report_id!)
            .single()

        return NextResponse.json({
            success: true,
            message: result.message,
            report: {
                report_id: result.report_id,
                title: generatedReport?.title || `Comprehensive Due Diligence Report - ${portfolioRequest.company_name}`,
                risk_level: generatedReport?.risk_level,
                generated_at: generatedReport?.generated_at,
                sections_count: generatedReport?.sections ? Object.keys(generatedReport.sections).length : 0,
                findings_summary: generatedReport?.findings_summary
            },
            company_info: {
                name: portfolioRequest.company_name,
                cin: portfolioRequest.cin,
                pan: portfolioRequest.pan,
                industry: portfolioRequest.industry
            },
            research_coverage: {
                total_jobs: completedJobs.length,
                job_types: completedJobs.map(job => job.job_type)
            },
            next_steps: [
                'Review the comprehensive report sections',
                'Validate key findings and risk assessment',
                'Export report for stakeholder distribution',
                'Use insights for informed decision making'
            ],
            api_endpoints: {
                view_report: `/api/deep-research/reports/${result.report_id}`,
                download_pdf: `/api/deep-research/reports/${result.report_id}/pdf`,
                export_options: `/api/deep-research/reports/${result.report_id}/export`
            }
        })

    } catch (error) {
        console.error('Error generating comprehensive report:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                {
                    error: 'Invalid request data',
                    details: error.errors.map(err => ({
                        field: err.path.join('.'),
                        message: err.message
                    }))
                },
                { status: 400 }
            )
        }

        return NextResponse.json(
            {
                error: 'Internal server error',
                message: 'Failed to generate comprehensive report'
            },
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

        // Get portfolio request info
        const { data: portfolioRequest } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name, cin, pan, industry')
            .eq('request_id', requestId)
            .single()

        if (!portfolioRequest) {
            return NextResponse.json(
                { error: 'Portfolio request not found' },
                { status: 404 }
            )
        }

        // Get completed research jobs
        const { data: completedJobs } = await supabase
            .from('deep_research_jobs')
            .select('id, job_type, status, completed_at, findings, risk_assessment')
            .eq('request_id', requestId)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false })

        // Get existing comprehensive reports
        const { data: existingReports } = await supabase
            .from('deep_research_reports')
            .select(`
                id,
                title,
                risk_level,
                generated_at,
                auto_generated,
                findings_summary
            `)
            .eq('request_id', requestId)
            .eq('user_id', user.id)
            .eq('report_type', 'comprehensive_due_diligence')
            .order('generated_at', { ascending: false })

        // Check readiness for comprehensive report generation
        const coreResearchTypes = ['directors_research', 'legal_research', 'negative_news', 'regulatory_research']
        const completedTypes = completedJobs?.map(job => job.job_type) || []
        const missingTypes = coreResearchTypes.filter(type => !completedTypes.includes(type))
        const isReady = completedJobs && completedJobs.length > 0

        // Calculate overall risk indicators
        const riskLevels = completedJobs?.map(job => (job.risk_assessment as any)?.overall_risk_level).filter(Boolean) || []
        const hasHighRisk = riskLevels.includes('HIGH')
        const hasMediumRisk = riskLevels.includes('MEDIUM')

        return NextResponse.json({
            success: true,
            company_info: {
                name: portfolioRequest.company_name,
                cin: portfolioRequest.cin,
                pan: portfolioRequest.pan,
                industry: portfolioRequest.industry
            },
            readiness_assessment: {
                is_ready: isReady,
                total_completed_jobs: completedJobs?.length || 0,
                completed_research_types: completedTypes,
                missing_core_types: missingTypes,
                core_research_complete: missingTypes.length === 0,
                recommendation: isReady
                    ? 'Ready for comprehensive report generation'
                    : 'Complete at least one research job to generate a comprehensive report'
            },
            existing_reports: existingReports?.map(report => ({
                report_id: report.id,
                title: report.title,
                risk_level: report.risk_level,
                generated_at: report.generated_at,
                auto_generated: report.auto_generated,
                total_findings: (report.findings_summary as any)?.total_findings || 0,
                critical_findings: (report.findings_summary as any)?.critical_findings || 0
            })) || [],
            risk_preview: {
                has_high_risk: hasHighRisk,
                has_medium_risk: hasMediumRisk,
                overall_indication: hasHighRisk ? 'HIGH' : hasMediumRisk ? 'MEDIUM' : 'LOW'
            },
            generation_options: {
                can_generate: isReady,
                force_regenerate_available: existingReports && existingReports.length > 0,
                customization_options: {
                    include_executive_summary: true,
                    include_detailed_findings: true,
                    include_risk_assessment: true,
                    include_recommendations: true,
                    custom_title: true,
                    synthesis_model: 'claude-opus-4-1-20250805'
                }
            }
        })

    } catch (error) {
        console.error('Error getting comprehensive report generation info:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}