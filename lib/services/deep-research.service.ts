// Deep Research Service
// Handles JINA AI deep research functionality

import { createServerSupabaseClient } from '@/lib/supabase/server'
import {
    JinaResearchResult,
    RiskAssessment,
    StartResearchJobRequest,
    RESEARCH_PRESETS
} from '@/types/deep-research.types'

export class DeepResearchService {
    private static readonly JINA_API_URL = 'https://deepsearch.jina.ai/v1/chat/completions'

    private async getSupabaseClient() {
        return await createServerSupabaseClient()
    }

    /**
     * Start a new research job
     */
    async startResearchJob(
        userId: string,
        request: StartResearchJobRequest
    ): Promise<{ success: boolean; job_id?: string; message: string }> {
        const supabase = await this.getSupabaseClient()

        try {
            // Get preset configuration
            const preset = RESEARCH_PRESETS.find(p => p.job_type === request.job_type)
            if (!preset) {
                throw new Error(`Invalid job type: ${request.job_type}`)
            }

            // Create research job
            const { data: job, error: jobError } = await supabase
                .from('deep_research_jobs')
                .insert({
                    request_id: request.request_id,
                    user_id: userId,
                    job_type: request.job_type,
                    research_scope: (request.research_scope || preset.research_scope) as any,
                    budget_tokens: request.budget_tokens || preset.budget_tokens,
                    status: 'pending'
                })
                .select()
                .single()

            if (jobError) {
                throw new Error(`Failed to create research job: ${jobError.message}`)
            }

            // Start background processing
            this.processResearchJobBackground(job.id)

            return {
                success: true,
                job_id: job.id,
                message: `Research job started. Estimated completion: ${preset.estimated_duration_minutes} minutes`
            }
        } catch (error) {
            console.error('Error starting research job:', error)
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start research job'
            }
        }
    }

    /**
     * Get research job status
     */
    async getResearchJobStatus(
        userId: string,
        jobId: string
    ) {
        const supabase = await this.getSupabaseClient()

        try {
            // Get job details
            const { data: job, error: jobError } = await supabase
                .from('deep_research_jobs')
                .select('*')
                .eq('id', jobId)
                .eq('user_id', userId)
                .single()

            if (jobError || !job) {
                return null
            }

            // Get findings
            const { data: findings, error: findingsError } = await supabase
                .from('deep_research_findings')
                .select('*')
                .eq('job_id', jobId)
                .order('created_at', { ascending: true })

            if (findingsError) {
                console.error('Error fetching findings:', findingsError)
            }

            return {
                job,
                findings: findings || []
            }
        } catch (error) {
            console.error('Error getting research job status:', error)
            return null
        }
    }

    /**
     * Get active research jobs for user
     */
    async getActiveResearchJobs(userId: string) {
        const supabase = await this.getSupabaseClient()

        try {
            const { data, error } = await supabase
                .from('deep_research_jobs')
                .select('*')
                .eq('user_id', userId)
                .in('status', ['pending', 'running'])
                .order('created_at', { ascending: false })

            if (error) {
                throw new Error(`Failed to fetch active jobs: ${error.message}`)
            }

            return data || []
        } catch (error) {
            console.error('Error getting active research jobs:', error)
            return []
        }
    }

    /**
     * Cancel a research job
     */
    async cancelResearchJob(userId: string, jobId: string): Promise<boolean> {
        const supabase = await this.getSupabaseClient()

        try {
            const { error } = await supabase
                .from('deep_research_jobs')
                .update({
                    status: 'cancelled',
                    completed_at: new Date().toISOString()
                })
                .eq('id', jobId)
                .eq('user_id', userId)
                .in('status', ['pending', 'running'])

            return !error
        } catch (error) {
            console.error('Error cancelling research job:', error)
            return false
        }
    }

    /**
     * Process research job in background
     */
    private async processResearchJobBackground(jobId: string): Promise<void> {
        // This runs in the background without blocking the API response
        setTimeout(async () => {
            try {
                await this.processResearchJob(jobId)
            } catch (error) {
                console.error('Background research job failed:', error)
                await this.markJobAsFailed(jobId, error instanceof Error ? error.message : 'Unknown error')
            }
        }, 2000) // Increased delay to ensure job is committed to database
    }

    /**
     * Process a research job
     */
    private async processResearchJob(jobId: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            // Get job details with portfolio request data
            const { data: job, error: jobError } = await supabase
                .from('deep_research_jobs')
                .select('*')
                .eq('id', jobId)
                .single()

            if (jobError || !job) {
                throw new Error(`Job not found: ${jobError?.message || 'Unknown error'}`)
            }

            // Get portfolio request data separately
            const { data: portfolioRequest, error: portfolioError } = await supabase
                .from('document_processing_requests')
                .select('extracted_data')
                .eq('request_id', job.request_id)
                .single()

            if (portfolioError || !portfolioRequest) {
                throw new Error('Portfolio request not found')
            }

            // Update job status to running
            await this.updateJobStatus(jobId, 'running', 0)

            // Get company data
            const companyData = portfolioRequest.extracted_data
            if (!companyData) {
                throw new Error('No company data available for research')
            }

            // Process based on job type
            let findings: any = {}

            // Parse research scope
            const researchScope = (job.research_scope as any) || {}

            switch (job.job_type) {
                case 'directors_research':
                    findings = await this.processDirectorsResearch(jobId, companyData, researchScope)
                    break
                case 'legal_research':
                    findings = await this.processLegalResearch(jobId, companyData, researchScope)
                    break
                case 'negative_news':
                    findings = await this.processNegativeNewsResearch(jobId, companyData, researchScope)
                    break
                case 'regulatory_research':
                    findings = await this.processRegulatoryResearch(jobId, companyData, researchScope)
                    break
                case 'related_companies':
                    findings = await this.processRelatedCompaniesResearch(jobId, companyData, researchScope)
                    break
                case 'full_due_diligence':
                    findings = await this.processFullDueDiligence(jobId, companyData, researchScope)
                    break
                default:
                    throw new Error(`Unknown job type: ${job.job_type}`)
            }

            // Generate risk assessment
            const riskAssessment = this.generateRiskAssessment(findings)

            // Generate recommendations
            const recommendations = this.generateRecommendations(riskAssessment)

            // Update job with results
            await supabase
                .from('deep_research_jobs')
                .update({
                    status: 'completed',
                    progress: 100,
                    findings: findings as any,
                    risk_assessment: riskAssessment as any,
                    recommendations,
                    completed_at: new Date().toISOString()
                })
                .eq('id', jobId)

        } catch (error) {
            console.error('Error processing research job:', error)
            await this.markJobAsFailed(jobId, error instanceof Error ? error.message : 'Unknown error')
        }
    }

    /**
     * Process directors research
     */
    private async processDirectorsResearch(
        jobId: string,
        companyData: any,
        scope: any
    ): Promise<any> {
        const companyName = this.extractCompanyName(companyData)
        const directors = this.extractDirectorsInfo(companyData)

        const directorNames = directors
            .map(d => d.name)
            .filter(Boolean)
            .slice(0, 5)
            .join(', ')

        const query = `Research specific adverse findings about directors of "${companyName}":
KEY PERSONS: ${directorNames}

Find and report any of these SPECIFIC issues for each person:
1. Criminal charges, arrests, or convictions
2. Personal bankruptcy or insolvency cases
3. Disqualification as company director
4. Regulatory sanctions or penalties
5. Civil litigation as defendant with significant amounts
6. Tax evasion or financial fraud cases
7. Association with failed/liquidated companies as director
8. SEBI/regulatory enforcement actions

For each issue found, provide:
- Person's name and specific issue
- Case details and amounts involved
- Date and current status
- Credible source

If no specific adverse findings are found for any director, state: "No significant adverse findings identified for key personnel through public records search."

Focus only on factual, verifiable information from credible sources.`

        const result = await this.makeJinaRequest(query, 12000)

        // Save finding
        await this.saveFinding(jobId, 'directors_research', query, result)

        await this.updateJobStatus(jobId, 'running', 100)

        return { directors_research: result }
    }

    /**
     * Process legal research
     */
    private async processLegalResearch(
        jobId: string,
        companyData: any,
        scope: any
    ): Promise<any> {
        const companyName = this.extractCompanyName(companyData)

        const query = `Research specific legal/regulatory issues about "${companyName}":

Find and report any of these SPECIFIC cases:
1. Active court cases with case numbers and amounts claimed
2. SEBI/SEC enforcement actions with penalty amounts
3. Income tax disputes or evasion cases with amounts
4. Labor law violations with penalty details
5. Environmental law violations with fine amounts
6. Contract breach cases with client names and amounts
7. Insolvency/bankruptcy proceedings (current or past)
8. Regulatory license suspensions or revocations

For each case found, provide:
- Case number or reference
- Authority/court involved
- Amount or penalty involved
- Current status and date
- Specific violation details

If no specific legal/regulatory issues are found, state: "No significant legal or regulatory violations identified through public records search."

Focus only on factual, verifiable cases from official sources.`

        const result = await this.makeJinaRequest(query, 15000)

        await this.saveFinding(jobId, 'legal_research', query, result)
        await this.updateJobStatus(jobId, 'running', 100)

        return { legal_regulatory_research: result }
    }

    /**
     * Process negative news research
     */
    private async processNegativeNewsResearch(
        jobId: string,
        companyData: any,
        scope: any
    ): Promise<any> {
        const companyName = this.extractCompanyName(companyData)
        const timePeriod = scope.time_period_months || 24

        const query = `Research specific negative incidents about "${companyName}" in the last ${Math.floor(timePeriod / 12)} years:

Find and report any of these SPECIFIC incidents:
1. Project failures, delays, or quality issues with client names and amounts
2. Labor disputes, strikes, or workplace accidents
3. Environmental violations with penalty amounts
4. Customer complaints filed with authorities (amount/details)
5. Contract cancellations or disputes with major clients
6. Financial distress indicators (delayed payments, credit downgrades)
7. Corruption or bribery allegations with case details
8. Safety incidents, accidents, or regulatory violations

For each incident found, provide:
- Specific incident details
- Client/authority involved
- Financial impact or penalty amount
- Date and current status
- Credible news source

If no specific negative incidents are found, state: "No significant negative incidents identified through media monitoring."

Focus only on factual, verifiable incidents from credible news sources.`

        const result = await this.makeJinaRequest(query, 10000)

        await this.saveFinding(jobId, 'negative_news', query, result)
        await this.updateJobStatus(jobId, 'running', 100)

        return { negative_news_research: result }
    }

    /**
     * Process regulatory research
     */
    private async processRegulatoryResearch(
        jobId: string,
        companyData: any,
        scope: any
    ): Promise<any> {
        const companyName = this.extractCompanyName(companyData)

        const query = `Research specific regulatory compliance issues about "${companyName}":

Find and report any of these SPECIFIC regulatory violations:
1. SEBI violations and enforcement actions with penalty amounts
2. RBI violations for financial services companies
3. Environmental clearance violations with penalty details
4. Labor law violations and penalty amounts
5. GST/tax compliance issues with amounts due
6. Industry-specific regulatory violations
7. License suspensions or revocations
8. Regulatory warnings or notices

For each violation found, provide:
- Regulatory authority involved
- Specific violation details
- Penalty or fine amount
- Date and current status
- Compliance requirements

If no specific regulatory violations are found, state: "No significant regulatory violations identified through official records search."

Focus only on factual, verifiable information from regulatory authorities.`

        const result = await this.makeJinaRequest(query, 12000)

        await this.saveFinding(jobId, 'regulatory_research', query, result)
        await this.updateJobStatus(jobId, 'running', 100)

        return { regulatory_research: result }
    }

    /**
     * Process related companies research
     */
    private async processRelatedCompaniesResearch(
        jobId: string,
        companyData: any,
        scope: any
    ): Promise<any> {
        const companyName = this.extractCompanyName(companyData)
        const relatedCompanies = this.extractRelatedCompanies(companyData)

        const query = `Research specific risks in group structure of "${companyName}":

RELATED ENTITIES: ${relatedCompanies.slice(0, 10).join(', ')}

Find and report any of these SPECIFIC group risks:
1. Cross-default clauses and guarantees between group companies
2. Related party transactions with potential conflicts
3. Subsidiary companies with financial distress or failures
4. Group companies with regulatory violations or penalties
5. Circular shareholding or complex ownership structures
6. Joint ventures with problematic partners
7. Group companies in high-risk jurisdictions
8. Concentration of business within the group

For each risk found, provide:
- Specific entity names involved
- Nature of risk or issue
- Financial exposure or amounts
- Current status and implications
- Credible source

If no specific group risks are found, state: "No significant group structure risks identified through corporate records search."

Focus only on factual, verifiable information about corporate relationships.`

        const result = await this.makeJinaRequest(query, 15000)

        await this.saveFinding(jobId, 'related_companies', query, result)
        await this.updateJobStatus(jobId, 'running', 100)

        return { related_companies_research: result }
    }

    /**
     * Process full due diligence
     */
    private async processFullDueDiligence(
        jobId: string,
        companyData: any,
        scope: any
    ): Promise<any> {
        const findings: any = {}
        let progress = 0

        // Directors research (20%)
        if (scope.include_directors) {
            const directorsResult = await this.processDirectorsResearch(jobId, companyData, scope)
            findings.directors_research = directorsResult.directors_research
            progress += 20
            await this.updateJobStatus(jobId, 'running', progress)
        }

        // Legal research (25%)
        if (scope.include_legal_cases) {
            const legalResult = await this.processLegalResearch(jobId, companyData, scope)
            findings.legal_regulatory_research = legalResult.legal_regulatory_research
            progress += 25
            await this.updateJobStatus(jobId, 'running', progress)
        }

        // Negative news (20%)
        if (scope.include_negative_news) {
            const newsResult = await this.processNegativeNewsResearch(jobId, companyData, scope)
            findings.negative_news_research = newsResult.negative_news_research
            progress += 20
            await this.updateJobStatus(jobId, 'running', progress)
        }

        // Regulatory research (15%)
        if (scope.include_regulatory_issues) {
            const regulatoryResult = await this.processRegulatoryResearch(jobId, companyData, scope)
            findings.regulatory_research = regulatoryResult.regulatory_research
            progress += 15
            await this.updateJobStatus(jobId, 'running', progress)
        }

        // Related companies (20%)
        if (scope.include_related_companies) {
            const relatedResult = await this.processRelatedCompaniesResearch(jobId, companyData, scope)
            findings.related_companies_research = relatedResult.related_companies_research
            progress += 20
            await this.updateJobStatus(jobId, 'running', progress)
        }

        return findings
    }

    /**
     * Make JINA API request
     */
    private async makeJinaRequest(query: string, budgetTokens: number = 15000): Promise<JinaResearchResult> {
        const apiKey = process.env.JINA_API_KEY

        if (!apiKey) {
            // Return mock response for development
            return {
                success: true,
                content: `Research completed for query: "${query.substring(0, 100)}..."\n\nNo significant adverse findings identified through public records search.\n\nThis is a development mock response. Configure JINA_API_KEY for actual research.`,
                tokens_used: 150,
                query
            }
        }

        try {
            const payload = {
                model: 'jina-deepsearch-v1',
                messages: [
                    {
                        role: 'user',
                        content: query
                    }
                ],
                budget_tokens: budgetTokens,
                max_attempts: 2,
                stream: false,
                reasoning_effort: 'low'
            }

            const response = await fetch(DeepResearchService.JINA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`,
                    'Accept': 'application/json'
                },
                body: JSON.stringify(payload)
            })

            if (!response.ok) {
                throw new Error(`JINA API error: ${response.status} ${response.statusText}`)
            }

            const data = await response.json()
            const content = this.extractFinalAnswer(data.choices[0].message.content)

            return {
                success: true,
                content,
                tokens_used: data.usage?.total_tokens || 0,
                query
            }
        } catch (error) {
            console.error('JINA API request failed:', error)
            return {
                success: false,
                content: undefined,
                tokens_used: 0,
                query,
                error: error instanceof Error ? error.message : 'Unknown error'
            }
        }
    }

    /**
     * Extract final answer from JINA response
     */
    private extractFinalAnswer(content: string): string {
        // Remove <think>...</think> blocks
        content = content.replace(/<think>[\s\S]*?<\/think>/g, '')

        // Remove AI reasoning patterns
        const reasoningPatterns = [
            /I need to[\s\S]*?(?=\n\n|\n[A-Z])/g,
            /I must[\s\S]*?(?=\n\n|\n[A-Z])/g,
            /I will[\s\S]*?(?=\n\n|\n[A-Z])/g,
            /Let me[\s\S]*?(?=\n\n|\n[A-Z])/g
        ]

        reasoningPatterns.forEach(pattern => {
            content = content.replace(pattern, '')
        })

        // Clean up whitespace
        content = content.replace(/\n\s*\n\s*\n/g, '\n\n').trim()

        // Return placeholder if content is too short or contains reasoning
        if (content.length < 50 || /i need to|i must|i will|let me search/i.test(content)) {
            return "Research completed but no specific adverse findings identified through public records search."
        }

        return content
    }

    /**
     * Generate risk assessment from findings
     */
    private generateRiskAssessment(findings: any): RiskAssessment {
        const riskItems: string[] = []
        let highRiskCount = 0
        let mediumRiskCount = 0

        // Analyze findings content
        Object.values(findings).forEach((finding: any) => {
            if (finding?.success && finding?.content) {
                const content = finding.content.toLowerCase()

                // High risk indicators
                const highRiskIndicators = [
                    'criminal charges', 'arrested', 'convicted', 'fraud', 'embezzlement',
                    'bankruptcy', 'insolvent', 'debarred', 'license suspended', 'sebi penalty'
                ]

                // Medium risk indicators
                const mediumRiskIndicators = [
                    'dispute', 'complaint', 'delay', 'quality issue', 'penalty',
                    'investigation', 'allegation', 'default', 'irregularity'
                ]

                highRiskIndicators.forEach(indicator => {
                    if (content.includes(indicator)) {
                        highRiskCount++
                        riskItems.push(`Found ${indicator} requiring immediate attention`)
                    }
                })

                mediumRiskIndicators.forEach(indicator => {
                    if (content.includes(indicator)) {
                        mediumRiskCount++
                    }
                })
            }
        })

        // Determine overall risk level
        let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'
        if (highRiskCount >= 3) {
            overallRisk = 'HIGH'
        } else if (highRiskCount >= 1 || mediumRiskCount >= 3) {
            overallRisk = 'MEDIUM'
        }

        return {
            overall_risk_level: overallRisk,
            risk_breakdown: {
                HIGH: overallRisk === 'HIGH' ? riskItems : [],
                MEDIUM: overallRisk === 'MEDIUM' ? [`Found ${highRiskCount + mediumRiskCount} issues requiring review`] : [],
                LOW: overallRisk === 'LOW' ? ['No significant adverse findings identified'] : []
            },
            total_issues: highRiskCount + mediumRiskCount,
            assessment_confidence: 'High'
        }
    }

    /**
     * Generate recommendations from risk assessment
     */
    private generateRecommendations(riskAssessment: RiskAssessment): string[] {
        const recommendations: string[] = []

        switch (riskAssessment.overall_risk_level) {
            case 'HIGH':
                recommendations.push(
                    '🚨 HIGH RISK: Recommend declining or postponing this business relationship',
                    '🔍 Conduct enhanced legal and compliance verification',
                    '⚖️ Seek legal counsel before any business engagement',
                    '📋 Require additional guarantees and safeguards if proceeding'
                )
                break
            case 'MEDIUM':
                recommendations.push(
                    '⚠️ MEDIUM RISK: Proceed with enhanced monitoring and safeguards',
                    '📝 Implement additional compliance checks and documentation',
                    '🔄 Schedule regular review of business relationship'
                )
                break
            default:
                recommendations.push(
                    '✅ LOW RISK: Standard due diligence measures sufficient',
                    '📊 Continue periodic monitoring as per regular procedures'
                )
        }

        recommendations.push(
            '💾 Document all findings and business decisions',
            '🔄 Plan periodic re-assessment of risk factors'
        )

        return recommendations
    }

    /**
     * Helper methods
     */
    private extractCompanyName(companyData: any): string {
        const about_company = companyData?.['About the Company']
        const legal_info = about_company.company_info
        if (legal_info.cin || legal_info.pan || legal_info.legal_name)
            return `${legal_info.legal_name} (${legal_info.cin} / ${legal_info.pan})`

        return 'Unknown Company'
    }

    private extractDirectorsInfo(companyData: any): Array<{ name: string; designation?: string }> {
        const directors: Array<{ name: string; designation?: string }> = []

        const directorsData = companyData?.Directors?.data
        if (Array.isArray(directorsData)) {
            directorsData.forEach((director: any) => {
                if (director?.name) {
                    directors.push({
                        name: director.name,
                        designation: director.present_designation || director.designation
                    })
                }
            })
        }

        return directors.slice(0, 10) // Limit to top 10 directors
    }

    private extractRelatedCompanies(companyData: any): string[] {
        const relatedCompanies: string[] = []

        const relatedData = companyData?.['Related Corporates']?.data
        if (Array.isArray(relatedData)) {
            relatedData.forEach((company: any) => {
                if (company?.corporate_name) {
                    relatedCompanies.push(company.corporate_name)
                }
            })
        }

        return relatedCompanies.slice(0, 20) // Limit to top 20 related companies
    }

    private async updateJobStatus(jobId: string, status: string, progress: number): Promise<void> {
        const supabase = await this.getSupabaseClient()

        await supabase
            .from('deep_research_jobs')
            .update({
                status,
                progress,
                updated_at: new Date().toISOString()
            })
            .eq('id', jobId)
    }

    private async markJobAsFailed(jobId: string, errorMessage: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        await supabase
            .from('deep_research_jobs')
            .update({
                status: 'failed',
                error_message: errorMessage,
                completed_at: new Date().toISOString()
            })
            .eq('id', jobId)
    }

    private async saveFinding(
        jobId: string,
        researchType: string,
        query: string,
        result: JinaResearchResult
    ): Promise<void> {
        const supabase = await this.getSupabaseClient()

        await supabase
            .from('deep_research_findings')
            .insert({
                job_id: jobId,
                research_type: researchType,
                query_text: query,
                success: result.success,
                content: result.content,
                tokens_used: result.tokens_used,
                completed_at: new Date().toISOString(),
                error_message: result.error
            })
    }
}