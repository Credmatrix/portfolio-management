// Deep Research Reports API
// Generate and manage comprehensive research reports

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GenerateReportRequest } from '@/types/deep-research.types'

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
        const body: GenerateReportRequest = await request.json()

        // Validate required fields
        if (!body.request_id || !body.job_ids || body.job_ids.length === 0) {
            return NextResponse.json(
                { error: 'Missing required fields: request_id, job_ids' },
                { status: 400 }
            )
        }

        // Verify user has access to the portfolio request
        const { data: portfolioRequest, error: portfolioError } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name, extracted_data')
            .eq('request_id', body.request_id)
            .single()

        if (portfolioError || !portfolioRequest || !portfolioRequest.company_name) {
            return NextResponse.json(
                { error: 'Portfolio request not found or access denied' },
                { status: 404 }
            )
        }

        // Get completed research jobs
        const { data: jobs, error: jobsError } = await supabase
            .from('deep_research_jobs')
            .select(`
        *,
        deep_research_findings(*)
      `)
            .eq('user_id', user.id)
            .eq('request_id', body.request_id)
            .in('id', body.job_ids)
            .eq('status', 'completed')

        if (jobsError || !jobs || jobs.length === 0) {
            return NextResponse.json(
                { error: 'No completed research jobs found' },
                { status: 404 }
            )
        }

        // Generate report sections
        const sections = await generateReportSections(jobs, portfolioRequest)

        // Calculate overall risk assessment
        const overallRisk = calculateOverallRisk(jobs)

        // Generate executive summary
        const executiveSummary = generateExecutiveSummary(
            portfolioRequest.company_name,
            jobs,
            overallRisk
        )

        // Compile recommendations
        const allRecommendations = jobs
            .flatMap(job => job.recommendations || [])
            .filter((rec, index, arr) => arr.indexOf(rec) === index) // Remove duplicates

        // Create report record
        const { data: report, error: reportError } = await supabase
            .from('deep_research_reports')
            .insert({
                request_id: body.request_id,
                user_id: user.id,
                report_type: body.report_type || 'comprehensive',
                title: body.title || `Due Diligence Report - ${portfolioRequest.company_name}`,
                executive_summary: executiveSummary,
                sections,
                findings_summary: generateFindingsSummary(jobs),
                risk_level: overallRisk,
                recommendations: allRecommendations
            })
            .select()
            .single()

        if (reportError) {
            throw reportError
        }

        return NextResponse.json({
            success: true,
            report_id: report.id,
            message: 'Research report generated successfully',
            report: {
                id: report.id,
                title: report.title,
                risk_level: report.risk_level,
                sections_count: Object.keys(sections).length,
                recommendations_count: allRecommendations.length
            }
        })

    } catch (error) {
        console.error('Error generating research report:', error)
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

        // Build query
        let query = supabase
            .from('deep_research_reports')
            .select(`
        *,
        document_processing_requests!inner(company_name)
      `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })

        if (requestId) {
            query = query.eq('request_id', requestId)
        }

        const { data: reports, error } = await query

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            reports: reports || []
        })

    } catch (error) {
        console.error('Error fetching research reports:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

// Helper functions
async function generateReportSections(jobs: any[], portfolioRequest: any) {
    const sections: any = {}

    // Company Overview
    sections.company_overview = generateCompanyOverview(portfolioRequest)

    // Process each job type
    jobs.forEach(job => {
        switch (job.job_type) {
            case 'directors_research':
                sections.directors_analysis = generateDirectorsSection(job)
                break
            case 'legal_research':
                sections.legal_regulatory = generateLegalSection(job)
                break
            case 'negative_news':
                sections.negative_incidents = generateNegativeNewsSection(job)
                break
            case 'regulatory_research':
                sections.regulatory_compliance = generateRegulatorySection(job)
                break
            case 'related_companies':
                sections.related_entities = generateRelatedEntitiesSection(job)
                break
            case 'full_due_diligence':
                // Full DD includes all sections
                if (job.findings.directors_research) {
                    sections.directors_analysis = generateDirectorsSection(job, 'directors_research')
                }
                if (job.findings.legal_regulatory_research) {
                    sections.legal_regulatory = generateLegalSection(job, 'legal_regulatory_research')
                }
                if (job.findings.negative_news_research) {
                    sections.negative_incidents = generateNegativeNewsSection(job, 'negative_news_research')
                }
                if (job.findings.regulatory_research) {
                    sections.regulatory_compliance = generateRegulatorySection(job, 'regulatory_research')
                }
                if (job.findings.related_companies_research) {
                    sections.related_entities = generateRelatedEntitiesSection(job, 'related_companies_research')
                }
                break
        }
    })

    // Risk Assessment Summary
    sections.risk_assessment = generateRiskAssessmentSection(jobs)

    return sections
}

function generateCompanyOverview(portfolioRequest: any): string {
    const companyName = portfolioRequest.company_name
    const extractedData = portfolioRequest.extracted_data

    let overview = `## Company Overview\n\n**Company Name:** ${companyName}\n\n`

    if (extractedData?.addresses?.business_address) {
        const address = extractedData.addresses.business_address
        if (address.industry) overview += `**Industry:** ${address.industry}\n\n`
        if (address.type_of_entity) overview += `**Entity Type:** ${address.type_of_entity}\n\n`
        if (address.date_of_incorporation) overview += `**Incorporation Date:** ${address.date_of_incorporation}\n\n`
    }

    overview += `This report presents the findings from comprehensive due diligence research conducted using advanced AI-powered search capabilities.\n\n`

    return overview
}

function generateDirectorsSection(job: any, findingKey?: string): string {
    const finding = findingKey ? job.findings[findingKey] : job.findings.directors_research || job.findings

    let section = `## Directors & Key Personnel Analysis\n\n`

    if (finding?.success && finding?.content) {
        section += `### Research Findings\n\n${finding.content}\n\n`
    } else {
        section += `### Research Status\n\nDirectors research could not be completed successfully.\n\n`
    }

    if (job.risk_assessment?.risk_breakdown) {
        const risks = job.risk_assessment.risk_breakdown
        if (risks.HIGH?.length > 0) {
            section += `### High Risk Indicators\n\n${risks.HIGH.map(risk => `- ${risk}`).join('\n')}\n\n`
        }
    }

    return section
}

function generateLegalSection(job: any, findingKey?: string): string {
    const finding = findingKey ? job.findings[findingKey] : job.findings.legal_regulatory_research || job.findings

    let section = `## Legal & Regulatory Analysis\n\n`

    if (finding?.success && finding?.content) {
        section += `### Research Findings\n\n${finding.content}\n\n`
    } else {
        section += `### Research Status\n\nLegal research could not be completed successfully.\n\n`
    }

    return section
}

function generateNegativeNewsSection(job: any, findingKey?: string): string {
    const finding = findingKey ? job.findings[findingKey] : job.findings.negative_news_research || job.findings

    let section = `## Negative News & Incidents Analysis\n\n`

    if (finding?.success && finding?.content) {
        section += `### Research Findings\n\n${finding.content}\n\n`
    } else {
        section += `### Research Status\n\nNegative news research could not be completed successfully.\n\n`
    }

    return section
}

function generateRegulatorySection(job: any, findingKey?: string): string {
    const finding = findingKey ? job.findings[findingKey] : job.findings.regulatory_research || job.findings

    let section = `## Regulatory Compliance Analysis\n\n`

    if (finding?.success && finding?.content) {
        section += `### Research Findings\n\n${finding.content}\n\n`
    } else {
        section += `### Research Status\n\nRegulatory research could not be completed successfully.\n\n`
    }

    return section
}

function generateRelatedEntitiesSection(job: any, findingKey?: string): string {
    const finding = findingKey ? job.findings[findingKey] : job.findings.related_companies_research || job.findings

    let section = `## Related Entities & Group Structure Analysis\n\n`

    if (finding?.success && finding?.content) {
        section += `### Research Findings\n\n${finding.content}\n\n`
    } else {
        section += `### Research Status\n\nRelated entities research could not be completed successfully.\n\n`
    }

    return section
}

function generateRiskAssessmentSection(jobs: any[]): string {
    let section = `## Overall Risk Assessment\n\n`

    const overallRisk = calculateOverallRisk(jobs)
    section += `**Overall Risk Level:** ${overallRisk}\n\n`

    // Aggregate risk factors
    const allRiskFactors = jobs
        .flatMap(job => job.risk_assessment?.risk_breakdown?.HIGH || [])
        .filter((factor, index, arr) => arr.indexOf(factor) === index)

    if (allRiskFactors.length > 0) {
        section += `### Key Risk Factors\n\n${allRiskFactors.map(factor => `- ${factor}`).join('\n')}\n\n`
    }

    // Research coverage
    const researchTypes = jobs.map(job => job.job_type).join(', ')
    section += `### Research Coverage\n\nThis assessment is based on research across: ${researchTypes}\n\n`

    return section
}

function calculateOverallRisk(jobs: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const riskLevels = jobs
        .map(job => job.risk_assessment?.overall_risk_level)
        .filter(Boolean)

    if (riskLevels.includes('HIGH')) return 'HIGH'
    if (riskLevels.includes('MEDIUM')) return 'MEDIUM'
    return 'LOW'
}

function generateExecutiveSummary(companyName = "Unknown Company", jobs: any[], overallRisk: string): string {
    const totalJobs = jobs.length
    const completedJobs = jobs.filter(job => job.status === 'completed').length

    let summary = `# Executive Summary\n\n`
    summary += `This comprehensive due diligence report for **${companyName}** is based on ${completedJobs} completed research modules using advanced AI-powered search capabilities.\n\n`
    summary += `**Overall Risk Assessment:** ${overallRisk}\n\n`

    if (overallRisk === 'HIGH') {
        summary += `⚠️ **Critical Findings:** Significant adverse findings have been identified that require immediate attention and may impact business decisions.\n\n`
    } else if (overallRisk === 'MEDIUM') {
        summary += `📋 **Moderate Concerns:** Some areas of concern have been identified that warrant enhanced monitoring and due diligence.\n\n`
    } else {
        summary += `✅ **Favorable Assessment:** No significant adverse findings identified through comprehensive research.\n\n`
    }

    return summary
}

function generateFindingsSummary(jobs: any[]) {
    const totalFindings = jobs.length
    const highRiskFindings = jobs.filter(job => job.risk_assessment?.overall_risk_level === 'HIGH').length
    const mediumRiskFindings = jobs.filter(job => job.risk_assessment?.overall_risk_level === 'MEDIUM').length
    const lowRiskFindings = jobs.filter(job => job.risk_assessment?.overall_risk_level === 'LOW').length

    const categories: { [key: string]: number } = {}
    jobs.forEach(job => {
        categories[job.job_type] = (categories[job.job_type] || 0) + 1
    })

    return {
        total_findings: totalFindings,
        high_risk_findings: highRiskFindings,
        medium_risk_findings: mediumRiskFindings,
        low_risk_findings: lowRiskFindings,
        categories
    }
}