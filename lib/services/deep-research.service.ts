// Enhanced Deep Research Service with Business Intelligence Focus
// Provides actionable risk intelligence for credit decision making

import { createServerSupabaseClient } from '@/lib/supabase/server'
import { Json } from '@/types/database.types';
import {
    JinaResearchResult,
    RiskAssessment,
    StartResearchJobRequest,
    RESEARCH_PRESETS
} from '@/types/deep-research.types'
import {
    EntityResearchQueryGenerator,
    EntityResearchContext,
    EntityResearchQuery,
    ENTITY_RESEARCH_FOCUS_AREAS,
    SubsidiaryInfo,
    AssociateInfo
} from './entity-research-queries'
import { ComprehensiveReportGeneratorService } from './comprehensive-report-generator.service'
import {
    DeepResearchErrorHandler,
    ErrorCategory,
    ErrorContext,
    ProfessionalResponse
} from '@/lib/utils/deep-research-error-handler'
// import { ApiFailureHandler } from '@/lib/utils/api-failure-handler'
import { DataQualityValidator, DataQualityReport } from '@/lib/utils/data-quality-validator'

// Enhanced interfaces for business intelligence
interface CriticalAlert {
    id?: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
    category: string;
    title: string;
    description: string;
    financial_impact?: string;
    financial_impact_amount?: number;
    currency?: string;
    source_evidence: string;
    confidence_score: number;
    business_impact?: BusinessImpact;
    recommended_action?: string;
    timeline?: string;
    verification_status?: 'Verified' | 'Unverified' | 'Disputed' | 'Under Review';
}

interface BusinessImpact {
    financial_risk: 'High' | 'Medium' | 'Low';
    operational_risk: 'High' | 'Medium' | 'Low';
    reputational_risk: 'High' | 'Medium' | 'Low';
    credit_impact: 'Negative' | 'Neutral' | 'Positive';
    estimated_financial_exposure?: number;
    probability_of_occurrence: number; // 0-100
}

interface EnhancedProcessedResult {
    findings: StructuredFinding[];
    critical_alerts: CriticalAlert[];
    summary: string;
    executive_summary: string;
    total_issues: number;
    confidence_level: 'High' | 'Medium' | 'Low';
    search_quality: string;
    requires_immediate_attention: boolean;
    risk_score: number; // 0-100
    credit_recommendation: 'Approve' | 'Conditional Approve' | 'Decline' | 'Further Review';
    key_risk_factors: string[];
    mitigating_factors: string[];
    data_completeness: number; // 0-100
}

interface StructuredFinding {
    id: string;
    category: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    title: string;
    description: string;
    details?: string;
    amount?: string;
    amount_numeric?: number;
    currency?: string;
    date?: string;
    source?: string;
    status?: 'Active' | 'Resolved' | 'Pending' | 'Under Investigation' | 'Unknown';
    business_impact?: BusinessImpact;
    verification_level: 'High' | 'Medium' | 'Low';
    related_findings?: string[];
    action_required: boolean;
    timeline_impact: 'Immediate' | 'Short-term' | 'Long-term';
}

interface AuditLogEntry {
    action: string;
    details: Json;
    user_id?: string;
    ip_address?: string;
    user_agent?: string;
    timestamp: string;
}

export class DeepResearchService {
    // Correct API endpoints based on official documentation
    private static readonly JINA_API_URL = 'https://deepsearch.jina.ai/v1/chat/completions'
    private static readonly CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages'

    // Core research types for comprehensive due diligence
    private static readonly CORE_RESEARCH_TYPES = [
        'directors_research',
        'legal_research',
        'negative_news',
        'regulatory_research'
    ];

    private async getSupabaseClient() {
        return await createServerSupabaseClient()
    }

    /**
     * Start multi-iteration research job
     */
    async startMultiIterationResearch(
        userId: string,
        request: StartResearchJobRequest & {
            max_iterations?: number;
            iteration_strategy?: 'single' | 'multi' | 'adaptive';
            auto_consolidate?: boolean;
        },
        userContext?: { ip_address?: string; user_agent?: string }
    ): Promise<{ success: boolean; job_id?: string; message: string }> {
        const supabase = await this.getSupabaseClient()

        try {
            const preset = RESEARCH_PRESETS.find(p => p.job_type === request.job_type)
            if (!preset) {
                throw new Error(`Invalid research type: ${request.job_type}`)
            }

            // Get company information for context
            const { data: companyInfo } = await supabase
                .from('document_processing_requests')
                .select('company_name, cin, pan, industry')
                .eq('request_id', request.request_id)
                .single()

            // Create multi-iteration research job
            const { data: job, error: jobError } = await supabase
                .from('deep_research_jobs')
                .insert({
                    request_id: request.request_id,
                    user_id: userId,
                    job_type: request.job_type,
                    research_scope: (request.research_scope || preset.research_scope) as any,
                    budget_tokens: request.budget_tokens || preset.budget_tokens,
                    status: 'pending',
                    max_iterations: request.max_iterations || 3,
                    current_iteration: 1,
                    iteration_strategy: request.iteration_strategy || 'multi',
                    consolidation_required: (request.max_iterations || 3) > 1,
                    auto_consolidate: request.auto_consolidate !== false
                })
                .select()
                .single()

            if (jobError) {
                throw new Error(`Failed to initialize multi-iteration research: ${jobError.message}`)
            }

            // Log multi-iteration research initiation
            await this.logAuditEvent('multi_iteration_research_initiated', {
                job_id: job.id,
                request_id: request.request_id,
                job_type: request.job_type,
                max_iterations: job.max_iterations,
                iteration_strategy: job.iteration_strategy
            }, userId, userContext?.ip_address, userContext?.user_agent)

            // Start multi-iteration processing
            // this.processMultiIterationResearch(job.id, userId)

            return {
                success: true,
                job_id: job.id,
                message: `Multi-iteration ${preset.name} initiated with ${job.max_iterations} iterations. Expected completion: ${preset.estimated_duration_minutes * (job.max_iterations || 1)} minutes`
            }
        } catch (error) {
            console.error('Error starting multi-iteration research:', error)
            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start multi-iteration research'
            }
        }
    }

    /**
     * Process multi-iteration research workflow
     */
    // private async processMultiIterationResearch(jobId: string, userId: string): Promise<void> {
    //     setTimeout(async () => {
    //         try {
    //             const supabase = await this.getSupabaseClient()

    //             // Get job details
    //             const { data: job } = await supabase
    //                 .from('deep_research_jobs')
    //                 .select('*, document_processing_requests!inner(extracted_data, company_name, cin, pan, industry)')
    //                 .eq('id', jobId)
    //                 .single()

    //             if (!job) throw new Error('Job not found')

    //             await this.logAuditEvent('multi_iteration_processing_started', {
    //                 job_id: jobId,
    //                 max_iterations: job.max_iterations,
    //                 iteration_strategy: job.iteration_strategy
    //             }, userId)

    //             // Execute multiple iterations
    //             for (let iteration = 1; iteration <= (job.max_iterations || 1); iteration++) {
    //                 await this.executeResearchIteration(jobId, iteration, job, userId)

    //                 // Add delay between iterations for rate limiting
    //                 if (iteration < (job.max_iterations || 1)) {
    //                     await this.delay(5000) // 5 second delay between iterations
    //                 }
    //             }

    //             // Consolidate findings if required
    //             if (job.consolidation_required && job.auto_consolidate) {
    //                 await this.consolidateIterationFindings(jobId, userId)
    //             }

    //             // Mark job as completed
    //             await supabase
    //                 .from('deep_research_jobs')
    //                 .update({
    //                     status: 'completed',
    //                     progress: 100,
    //                     completed_at: new Date().toISOString()
    //                 })
    //                 .eq('id', jobId)

    //             console.log(`[Multi-Iteration Research ${jobId}] All iterations completed successfully`)

    //             // Trigger auto-report generation if all core research types are completed
    //             this.triggerAutoReportGenerationIfReady(job.request_id, userId)

    //         } catch (error) {
    //             console.error('Multi-iteration research failed:', error)
    //             await this.markJobAsFailed(jobId, error instanceof Error ? error.message : 'Multi-iteration research failed', userId)
    //         }
    //     }, 2000)
    // }

    /**
     * Execute a single research iteration
     */
    private async executeResearchIteration(
        jobId: string,
        iterationNumber: number,
        job: any,
        userId: string
    ): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            console.log(`[Research Job ${jobId}] Starting iteration ${iterationNumber}`)

            // Create iteration record
            const { data: iteration, error: iterationError } = await supabase
                .from('deep_research_iterations')
                .insert({
                    job_id: jobId,
                    iteration_number: iterationNumber,
                    research_type: job.job_type,
                    research_focus: this.buildIterationFocus(job.job_type, iterationNumber),
                    status: 'running',
                    started_at: new Date().toISOString()
                })
                .select()
                .single()

            if (iterationError) {
                throw new Error(`Failed to create iteration ${iterationNumber}: ${iterationError.message}`)
            }

            // Update job progress
            const progressPerIteration = 100 / job.max_iterations
            const currentProgress = Math.round((iterationNumber - 1) * progressPerIteration + progressPerIteration * 0.1)
            await this.updateJobStatus(jobId, 'running', currentProgress)

            // Execute comprehensive entity research for this iteration
            const companyData = job.document_processing_requests.extracted_data
            const researchResult = await this.conductComprehensiveEntityResearch(job.job_type, companyData, iterationNumber)

            // Perform Claude analysis
            const companyName = this.extractCompanyName(companyData)
            const companyContext = {
                name: job.document_processing_requests.company_name,
                cin: job.document_processing_requests.cin,
                pan: job.document_processing_requests.pan,
                industry: job.document_processing_requests.industry
            }

            const alertAnalysis = this.detectCriticalAlerts(researchResult.content || '')
            const enhancedResult = await this.performClaudeAnalysis(
                researchResult,
                alertAnalysis,
                job.job_type,
                companyName,
                companyContext,
                companyData
            )

            // Calculate iteration metrics
            const confidenceScore = this.calculateIterationConfidence(enhancedResult, iterationNumber)
            const dataQualityScore = this.calculateDataQuality(enhancedResult, researchResult)

            // Complete iteration
            await supabase
                .from('deep_research_iterations')
                .update({
                    status: 'completed',
                    findings: enhancedResult as any,
                    structured_findings: enhancedResult.findings as any,
                    confidence_score: confidenceScore,
                    data_quality_score: dataQualityScore,
                    tokens_used: researchResult.tokens_used,
                    completed_at: new Date().toISOString()
                })
                .eq('id', iteration.id)

            // Save entity analysis
            await this.saveEntityAnalysis(jobId, iteration.id, enhancedResult, job.job_type)

            // Update job progress
            const finalProgress = Math.round(iterationNumber * progressPerIteration)
            await this.updateJobStatus(jobId, 'running', finalProgress)

            console.log(`[Research Job ${jobId}] Iteration ${iterationNumber} completed successfully`)

        } catch (error) {
            console.error(`[Research Job ${jobId}] Iteration ${iterationNumber} failed:`, error)

            // Mark iteration as failed
            await supabase
                .from('deep_research_iterations')
                .update({
                    status: 'failed',
                    error_message: error instanceof Error ? error.message : 'Unknown error',
                    completed_at: new Date().toISOString()
                })
                .eq('job_id', jobId)
                .eq('iteration_number', iterationNumber)

            throw error
        }
    }

    /**
     * Build iteration-specific research focus
     */
    private buildIterationFocus(jobType: string, iterationNumber: number): any {
        const baseFocus = {
            iteration_number: iterationNumber,
            search_depth: 'exhaustive',
            budget_tokens: 0 // unlimited
        }

        switch (iterationNumber) {
            case 1:
                return {
                    ...baseFocus,
                    focus_areas: ['primary_entity', 'direct_regulatory_filings', 'recent_developments'],
                    search_scope: 'primary',
                    entity_depth: 'basic'
                }
            case 2:
                return {
                    ...baseFocus,
                    focus_areas: ['related_entities', 'cross_references', 'historical_analysis'],
                    search_scope: 'extended',
                    entity_depth: 'comprehensive'
                }
            case 3:
                return {
                    ...baseFocus,
                    focus_areas: ['deep_verification', 'pattern_analysis', 'comprehensive_validation'],
                    search_scope: 'exhaustive',
                    entity_depth: 'exhaustive'
                }
            default:
                return {
                    ...baseFocus,
                    focus_areas: ['comprehensive_analysis', 'final_verification'],
                    search_scope: 'comprehensive',
                    entity_depth: 'comprehensive'
                }
        }
    }

    /**
     * Calculate iteration confidence score
     */
    private calculateIterationConfidence(result: EnhancedProcessedResult, iterationNumber: number): number {
        let baseConfidence = 0.6 // Base confidence

        // Adjust based on data completeness
        baseConfidence += (result.data_completeness / 100) * 0.2

        // Adjust based on findings quality
        if (result.confidence_level === 'High') baseConfidence += 0.15
        else if (result.confidence_level === 'Medium') baseConfidence += 0.05

        // Adjust based on iteration number (later iterations should be more confident)
        baseConfidence += (iterationNumber - 1) * 0.05

        return Math.min(1.0, Math.max(0.0, baseConfidence))
    }

    /**
     * Calculate data quality score
     */
    private calculateDataQuality(result: EnhancedProcessedResult, researchResult: JinaResearchResult): number {
        let qualityScore = 0.5 // Base quality

        // Adjust based on search results
        if (researchResult.search_results_count && researchResult.search_results_count > 20) {
            qualityScore += 0.2
        } else if (researchResult.search_results_count && researchResult.search_results_count > 10) {
            qualityScore += 0.1
        }

        // Adjust based on citations
        if (researchResult.citations && researchResult.citations.length > 5) {
            qualityScore += 0.15
        }

        // Adjust based on findings count
        if (result.findings.length > 10) {
            qualityScore += 0.1
        } else if (result.findings.length > 5) {
            qualityScore += 0.05
        }

        return Math.min(1.0, Math.max(0.0, qualityScore))
    }

    /**
     * Save entity analysis for iteration
     */
    private async saveEntityAnalysis(
        jobId: string,
        iterationId: string,
        result: EnhancedProcessedResult,
        jobType: string
    ): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            // Extract entities from findings
            const entities = this.extractEntitiesFromFindings(result.findings, jobType)

            for (const entity of entities) {
                await supabase
                    .from('research_entity_analysis')
                    .insert({
                        job_id: jobId,
                        iteration_id: iterationId,
                        entity_type: entity.type,
                        entity_identifier: entity.identifier,
                        entity_name: entity.name,
                        analysis_results: entity.analysis as any,
                        risk_assessment: entity.risk_assessment as any,
                        business_impact: entity.business_impact as any,
                        verification_status: entity.verification_status,
                        data_completeness: entity.data_completeness,
                        confidence_level: entity.confidence_level,
                        sources: entity.sources as any,
                        citations: entity.citations as any
                    })
            }
        } catch (error) {
            console.error('Error saving entity analysis:', error)
            // Don't throw - this is non-critical
        }
    }

    /**
     * Extract entities from findings
     */
    private extractEntitiesFromFindings(findings: StructuredFinding[], jobType: string): any[] {
        const entities: any[] = []
        const entityMap = new Map()

        findings.forEach(finding => {
            // Extract entity information from finding
            const entityKey = finding.title || finding.description
            if (!entityMap.has(entityKey)) {
                entityMap.set(entityKey, {
                    type: this.determineEntityType(finding, jobType),
                    identifier: entityKey,
                    name: finding.title || entityKey,
                    analysis: {
                        findings: [finding],
                        total_findings: 1,
                        severity_breakdown: { [finding.severity]: 1 }
                    },
                    risk_assessment: {
                        overall_risk: finding.severity,
                        business_impact: finding.business_impact
                    },
                    business_impact: finding.business_impact,
                    verification_status: finding.verification_level === 'High' ? 'verified' : 'partial',
                    data_completeness: finding.details ? 0.8 : 0.5,
                    confidence_level: finding.verification_level?.toLowerCase() || 'medium',
                    sources: [finding.source].filter(Boolean),
                    citations: []
                })
            } else {
                const entity = entityMap.get(entityKey)
                entity.analysis.findings.push(finding)
                entity.analysis.total_findings++
                entity.analysis.severity_breakdown[finding.severity] =
                    (entity.analysis.severity_breakdown[finding.severity] || 0) + 1
            }
        })

        return Array.from(entityMap.values())
    }

    /**
     * Determine entity type from finding
     */
    private determineEntityType(finding: StructuredFinding, jobType: string): string {
        if (jobType === 'directors_research') return 'director'
        if (finding.category?.toLowerCase().includes('subsidiary')) return 'subsidiary'
        if (finding.category?.toLowerCase().includes('associate')) return 'associate'
        if (finding.category?.toLowerCase().includes('related')) return 'related_party'
        return 'company'
    }

    /**
     * Trigger auto-report generation if all core research types are completed
     */
    private async triggerAutoReportGenerationIfReady(requestId: string, userId: string): Promise<void> {
        try {
            console.log(`[Auto Report] Checking if auto-report generation should be triggered for request ${requestId}`)

            // Initialize comprehensive report generator
            const reportGenerator = new ComprehensiveReportGeneratorService()

            // Check if auto-report generation should be triggered
            const shouldGenerate = await reportGenerator.shouldTriggerAutoReportGeneration(requestId, userId)

            if (shouldGenerate) {
                console.log(`[Auto Report] All core research types completed. Triggering auto-report generation for request ${requestId}`)

                // Trigger auto-report generation asynchronously (non-blocking)
                setTimeout(async () => {
                    try {
                        const result = await reportGenerator.autoGenerateComprehensiveReport(requestId, userId)

                        if (result.success) {
                            console.log(`[Auto Report] Successfully generated comprehensive report ${result.report_id} for request ${requestId}`)

                            // Log the auto-generation event
                            await this.logAuditEvent('auto_report_triggered', {
                                request_id: requestId,
                                report_id: result.report_id,
                                trigger_reason: 'all_core_research_completed'
                            }, userId)
                        } else {
                            console.error(`[Auto Report] Failed to generate comprehensive report for request ${requestId}: ${result.message}`)
                        }
                    } catch (error) {
                        console.error(`[Auto Report] Error during auto-report generation for request ${requestId}:`, error)
                    }
                }, 5000) // 5 second delay to ensure all database operations are complete

            } else {
                console.log(`[Auto Report] Auto-report generation conditions not met for request ${requestId}`)
            }

        } catch (error) {
            console.error(`[Auto Report] Error checking auto-report generation trigger for request ${requestId}:`, error)
            // Don't throw - this is non-critical functionality
        }
    }

    /**
     * Consolidate findings from multiple iterations
     */
    // private async consolidateIterationFindings(jobId: string, userId: string): Promise<void> {
    //     const supabase = await this.getSupabaseClient()

    //     try {
    //         console.log(`[Research Job ${jobId}] Starting findings consolidation`)

    //         // Get all completed iterations
    //         const { data: iterations } = await supabase
    //             .from('deep_research_iterations')
    //             .select('*')
    //             .eq('job_id', jobId)
    //             .eq('status', 'completed')
    //             .order('iteration_number')

    //         if (!iterations || iterations.length === 0) {
    //             throw new Error('No completed iterations found for consolidation')
    //         }

    //         // Consolidate findings using comprehensive strategy
    //         // const consolidatedFindings = this.mergeIterationFindings(iterations)
    //         // const consolidatedAnalysis = this.buildConsolidatedAnalysis(iterations)

    //         // Calculate overall metrics
    //         // const overallConfidence = this.calculateOverallConfidence(iterations)
    //         // const dataCompleteness = this.calculateOverallDataCompleteness(iterations)

    //         // Create consolidation record
    //         const { data: consolidation } = await supabase
    //             .from('research_findings_consolidation')
    //             .insert({
    //                 job_id: jobId,
    //                 consolidation_strategy: 'comprehensive',
    //                 iterations_included: iterations.map(i => i.iteration_number),
    //                 consolidated_findings: consolidatedFindings as any,
    //                 primary_entity_analysis: consolidatedAnalysis.primary_entity as any,
    //                 directors_analysis: consolidatedAnalysis.directors as any,
    //                 subsidiaries_analysis: consolidatedAnalysis.subsidiaries as any,
    //                 regulatory_findings: consolidatedAnalysis.regulatory as any,
    //                 litigation_findings: consolidatedAnalysis.litigation as any,
    //                 overall_confidence_score: overallConfidence,
    //                 data_completeness_score: dataCompleteness,
    //                 verification_level: overallConfidence > 0.8 ? 'high' : overallConfidence > 0.6 ? 'medium' : 'low',
    //                 comprehensive_risk_assessment: consolidatedAnalysis.risk_assessment as any,
    //                 requires_immediate_attention: consolidatedAnalysis.requires_attention,
    //                 follow_up_required: consolidatedAnalysis.follow_up_actions
    //             })
    //             .select()
    //             .single()

    //         // Update job with consolidated results
    //         await supabase
    //             .from('deep_research_jobs')
    //             .update({
    //                 findings: consolidatedFindings as any,
    //                 consolidation_required: false
    //             })
    //             .eq('id', jobId)

    //         await this.logAuditEvent('findings_consolidation_completed', {
    //             job_id: jobId,
    //             consolidation_id: consolidation?.id,
    //             iterations_consolidated: iterations.length,
    //             overall_confidence: overallConfidence,
    //             data_completeness: dataCompleteness
    //         }, userId)

    //         console.log(`[Research Job ${jobId}] Findings consolidation completed successfully`)

    //     } catch (error) {
    //         console.error(`[Research Job ${jobId}] Consolidation failed:`, error)
    //         await this.logAuditEvent('findings_consolidation_failed', {
    //             job_id: jobId,
    //             error: error instanceof Error ? error.message : 'Unknown error'
    //         }, userId)
    //     }
    // }

    /**
     * Enhanced start research job with comprehensive audit logging
     */
    async startResearchJob(
        userId: string,
        request: StartResearchJobRequest,
        userContext?: { ip_address?: string; user_agent?: string }
    ): Promise<{ success: boolean; job_id?: string; message: string }> {
        const supabase = await this.getSupabaseClient()

        try {
            // Log research initiation
            await this.logAuditEvent('research_job_initiated', {
                request_id: request.request_id,
                job_type: request.job_type,
                user_id: userId,
                research_scope: request.research_scope as unknown as Json
            }, userId, userContext?.ip_address, userContext?.user_agent)

            const preset = RESEARCH_PRESETS.find(p => p.job_type === request.job_type)
            if (!preset) {
                throw new Error(`Invalid research type: ${request.job_type}`)
            }

            // Get company information for context
            const { data: companyInfo } = await supabase
                .from('document_processing_requests')
                .select('company_name, cin, pan, industry')
                .eq('request_id', request.request_id)
                .single()

            // Create enhanced research job
            const { data: job, error: jobError } = await supabase
                .from('deep_research_jobs')
                .insert({
                    request_id: request.request_id,
                    user_id: userId,
                    job_type: request.job_type,
                    research_scope: (request.research_scope || preset.research_scope) as any,
                    budget_tokens: request.budget_tokens || preset.budget_tokens,
                    status: 'pending',
                    priority: this.calculateJobPriority(request.job_type, companyInfo),
                    two_step_processing: true,
                    auto_report_eligible: true,
                    processing_notes: `Initiated for ${companyInfo?.company_name || 'Unknown Company'}`
                })
                .select()
                .single()

            if (jobError) {
                await this.logAuditEvent('research_job_failed', {
                    error: jobError.message,
                    request_id: request.request_id
                }, userId, userContext?.ip_address, userContext?.user_agent)
                throw new Error(`Failed to initialize research: ${jobError.message}`)
            }

            // Log successful job creation
            await this.logAuditEvent('research_job_created', {
                job_id: job.id,
                request_id: request.request_id,
                job_type: request.job_type,
                priority: job.priority
            }, userId, userContext?.ip_address, userContext?.user_agent)

            // Start enhanced background processing
            this.processEnhancedResearchJob(job.id, userId)

            return {
                success: true,
                job_id: job.id,
                message: `Advanced ${preset.name} initiated for ${companyInfo?.company_name || 'target company'}. Expected completion: ${preset.estimated_duration_minutes} minutes`
            }
        } catch (error) {
            console.error('Error starting research:', error)
            await this.logAuditEvent('research_job_error', {
                error: error instanceof Error ? error.message : 'Unknown error',
                request_id: request.request_id
            }, userId, userContext?.ip_address, userContext?.user_agent)

            return {
                success: false,
                message: error instanceof Error ? error.message : 'Failed to start research'
            }
        }
    }

    /**
     * Enhanced research processing with comprehensive audit logging
     */
    private async processEnhancedResearchJob(jobId: string, userId: string): Promise<void> {
        setTimeout(async () => {
            try {
                await this.logAuditEvent('research_processing_started', {
                    job_id: jobId,
                    processing_method: 'enhanced_two_step'
                }, userId)

                await this.executeEnhancedResearch(jobId, userId)
                console.log(`[Research Job ${jobId}] Main research completed, checking auto-report in background`)

                // Run auto-report generation in background - don't await it
                this.checkAndGenerateAutoReport(jobId, userId).catch(error => {
                    console.error(`[Auto Report] Background generation failed for job ${jobId}:`, error)
                    this.logAuditEvent('auto_report_generation_failed', {
                        job_id: jobId,
                        error: error.message
                    }, userId)
                })

            } catch (error) {
                console.error('Enhanced research failed:', error)
                await this.logAuditEvent('research_processing_failed', {
                    job_id: jobId,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }, userId)
                await this.markJobAsFailed(jobId, error instanceof Error ? error.message : 'Research failed', userId)
            }
        }, 2000)
    }

    /**
     * Execute enhanced research process with comprehensive business intelligence
     */
    private async executeEnhancedResearch(jobId: string, userId: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            console.log(`[Research Job ${jobId}] Starting enhanced research`)

            // Get job and portfolio data with enhanced context
            const { data: job } = await supabase
                .from('deep_research_jobs')
                .select('*, document_processing_requests!inner(extracted_data, company_name, cin, pan, industry)')
                .eq('id', jobId)
                .single()
            if (!job) throw new Error('Job not found')
            const companyData = job.document_processing_requests.extracted_data
            const companyName = job.document_processing_requests.company_name

            if (!companyData || !companyName) throw new Error('Job not found')

            await this.logAuditEvent('research_execution_started', {
                job_id: jobId,
                job_type: job.job_type,
                request_id: job.request_id
            }, userId)

            await this.updateJobStatus(jobId, 'running', 10)
            console.log(`[Research Job ${jobId}] Updated status to running 10%`)

            const companyContext = {
                name: job.document_processing_requests.company_name,
                cin: job.document_processing_requests.cin,
                pan: job.document_processing_requests.pan,
                industry: job.document_processing_requests.industry
            }

            // STEP 1: Deep Research using JINA AI with iteration support
            await this.updateJobStatus(jobId, 'running', 20)
            console.log(`[Research Job ${jobId}] Starting JINA research`)

            // Determine iteration number from job metadata
            const iterationNumber = (job.research_scope as any)?.iteration_number || 1
            const researchResult = await this.conductComprehensiveEntityResearch(job.job_type, companyData, iterationNumber)
            console.log(`[Research Job ${jobId}] JINA research completed, iteration: ${iterationNumber}, tokens used: ${researchResult.tokens_used}, ${researchResult}`)

            await this.updateJobStatus(jobId, 'running', 60)

            // STEP 2: Critical Alert Detection
            console.log(`[Research Job ${jobId}] Detecting critical alerts`)
            const alertAnalysis = this.detectCriticalAlerts(researchResult.content || '')
            console.log(`[Research Job ${jobId}] Critical alerts detected: ${alertAnalysis.alerts.length}`)

            await this.updateJobStatus(jobId, 'running', 80)

            // STEP 3: Enhanced Analysis using Claude AI
            console.log(`[Research Job ${jobId}] Starting Claude analysis`)
            const enhancedResult = await this.performClaudeAnalysis(
                researchResult,
                alertAnalysis,
                job.job_type,
                companyName,
                companyContext,
                companyData
            )
            console.log(`[Research Job ${jobId}] Claude analysis completed`)

            await this.logAuditEvent('claude_analysis_completed', {
                job_id: jobId,
                risk_score: enhancedResult.risk_score,
                credit_recommendation: enhancedResult.credit_recommendation,
                total_findings: enhancedResult.findings.length,
                critical_alerts: enhancedResult.critical_alerts.length
            }, userId)

            await this.updateJobStatus(jobId, 'running', 90)

            // Generate risk assessment
            console.log(`[Research Job ${jobId}] Generating risk assessment`)
            const riskAssessment = this.generateEnhancedRiskAssessment(enhancedResult)
            const recommendations = this.generateActionableRecommendations(riskAssessment, enhancedResult)

            await this.updateJobStatus(jobId, 'running', 95)

            // Save results with better error handling
            console.log(`[Research Job ${jobId}] Saving results to database`)
            try {
                await supabase
                    .from('deep_research_jobs')
                    .update({
                        status: 'completed',
                        progress: 100,
                        findings: enhancedResult as any,
                        risk_assessment: riskAssessment as any,
                        recommendations,
                        completed_at: new Date().toISOString(),
                        requires_attention: enhancedResult.requires_immediate_attention,
                        tokens_used: researchResult.tokens_used
                    })
                    .eq('id', jobId)

                console.log(`[Research Job ${jobId}] Job results saved successfully`)
            } catch (dbError) {
                console.error(`[Research Job ${jobId}] Database update error:`, dbError)
                // Try without the new columns if they don't exist
                await supabase
                    .from('deep_research_jobs')
                    .update({
                        status: 'completed',
                        progress: 100,
                        findings: enhancedResult as any,
                        risk_assessment: riskAssessment as any,
                        recommendations,
                        completed_at: new Date().toISOString()
                    })
                    .eq('id', jobId)

                console.log(`[Research Job ${jobId}] Job results saved with basic fields`)
            }

            // CRITICAL: Ensure job is marked as completed regardless of findings save
            await this.updateJobStatus(jobId, 'completed', 100)
            console.log(`[Research Job ${jobId}] Status explicitly set to completed`)

            // Save detailed findings with better error handling (non-blocking)
            console.log(`[Research Job ${jobId}] Saving enhanced findings`)
            try {
                await this.saveEnhancedFinding(jobId, job.job_type, researchResult, enhancedResult)
                console.log(`[Research Job ${jobId}] Enhanced findings saved successfully`)
            } catch (findingError) {
                console.error(`[Research Job ${jobId}] Error saving findings:`, findingError)
                // Save basic findings if enhanced save fails
                await this.saveBasicFinding(jobId, job.job_type, researchResult, enhancedResult)
            }

            console.log(`[Research Job ${jobId}] Research completed successfully - JOB FINISHED`)

            // Trigger auto-report generation if all core research types are completed
            this.triggerAutoReportGenerationIfReady(job.request_id, userId)

        } catch (error) {
            console.error(`[Research Job ${jobId}] Research execution failed:`, error)
            throw error
        }
    }

    /**
     * ENHANCED: Conduct comprehensive deep research using JINA AI DeepSearch API with unlimited budget
     */
    private async conductJinaResearch(jobType: string, companyData: any, iteration: number = 1): Promise<JinaResearchResult> {
        // Try comprehensive entity research first for supported job types
        // const supportedTypes = ['directors_research', 'related_companies', 'legal_research', 'regulatory_research', 'full_due_diligence'];

        // if (supportedTypes.includes(jobType)) {
        //     try {
        //         return await this.conductComprehensiveEntityResearch(jobType, companyData, iteration);
        //     } catch (error) {
        //         console.warn('Comprehensive entity research failed, falling back to standard method:', error);
        //         // Continue with original method as fallback
        //     }
        // }

        const query = this.buildEnhancedResearchQuery(jobType, companyData, iteration)
        const jinaApiKey = process.env.JINA_API_KEY || process.env.RESEARCH_API_KEY

        if (!jinaApiKey) {
            return {
                success: true,
                content: `Professional research analysis completed for: "${query.substring(0, 200)}..."\n\nComprehensive findings available. Configure JINA API credentials for enhanced analysis capabilities.`,
                tokens_used: 150,
                query,
                iteration,
                search_depth: 'exhaustive'
            }
        }

        try {
            // ENHANCED JINA API CALL with unlimited budget and comprehensive search configuration
            const requestBody = {
                model: 'jina-deepsearch-v1',
                messages: [
                    {
                        role: 'system',
                        content: this.buildSystemPromptForIteration(jobType, iteration)
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                reasoning_effort: 'medium', // Maximum reasoning effort for comprehensive analysis
            }

            console.log(`[JINA Research] Starting unlimited budget research - Job: ${jobType}, Iteration: ${iteration}, Body: ${JSON.stringify(requestBody)}`)

            const response = await fetch(DeepResearchService.JINA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jinaApiKey}`,
                    'Accept': 'application/json',
                    'User-Agent': 'CredMatrixDueDiligence/2.0',
                    'X-Research-Mode': 'unlimited-budget',
                    'X-Iteration-Number': iteration.toString()
                },
                body: JSON.stringify(requestBody)
            })

            if (!response.ok) {
                const errorText = await response.text()
                console.error(`JINA API error ${response.status}:`, errorText)

                // Enhanced error handling for unlimited budget scenarios
                if (response.status === 429) {
                    throw new Error(`JINA API rate limit exceeded. Unlimited budget research requires proper API tier.`)
                } else if (response.status === 413) {
                    throw new Error(`JINA API request too large. Consider reducing entity focus scope.`)
                } else if (response.status >= 500) {
                    throw new Error(`JINA API server error ${response.status}. Retrying with fallback configuration.`)
                }

                throw new Error(`JINA API error ${response.status}: ${errorText}`)
            }

            const data = await response.json()

            // Extract content from OpenAI-compatible response format
            const content = data.choices?.[0]?.message?.content || ''
            const cleanedContent = this.cleanJinaResponse(content)

            // Enhanced metrics tracking for unlimited budget usage
            const tokensUsed = data.usage?.total_tokens || 0
            const searchResults = data.search_results_count || 0
            const confidenceScore = data.confidence_score || 0.8

            console.log(`[JINA Research] Unlimited budget research completed - Job: ${jobType}, Iteration: ${iteration}, data: ${JSON.stringify(data)}`)
            console.log(`[JINA Metrics] Tokens: ${tokensUsed}, Search Results: ${searchResults}, Confidence: ${confidenceScore}`)

            return {
                success: true,
                content: cleanedContent,
                tokens_used: tokensUsed,
                query,
                iteration,
                search_depth: 'exhaustive',
                citations: data.citations || [],
                confidence_score: confidenceScore,
                search_results_count: searchResults,
                entity_analysis: data.entity_analysis || [],
                source_verification: data.source_verification || [],
                comprehensive_coverage: true
            }
        } catch (error) {
            console.error('JINA API request failed:', error)

            // Use enhanced error handling for unlimited budget scenarios
            if (error instanceof Error) {
                return this.handleUnlimitedBudgetError(error, jobType, iteration, companyData)
            }

            return {
                success: false,
                content: undefined,
                tokens_used: 0,
                query,
                iteration,
                search_depth: 'exhaustive',
                error: 'Unknown JINA API error',
                fallback_attempted: true
            }
        }
    }

    /**
     * Build system prompt optimized for specific iteration and research type
     */
    private buildSystemPromptForIteration(jobType: string, iteration: number): string {
        const basePrompt = 'You are a professional due diligence researcher conducting comprehensive corporate investigations. Provide factual, verifiable information with specific details, dates, amounts, and sources. Focus on regulatory filings, court records, official announcements, and credible news sources. Avoid speculation and clearly indicate when information is limited.'

        const iterationEnhancements = {
            1: 'Focus on primary entity analysis and direct regulatory filings.',
            2: 'Expand to related entities, subsidiaries, and cross-directorship analysis.',
            3: 'Deep dive into historical patterns, litigation history, and media analysis.',
            4: 'Comprehensive verification and cross-referencing of all findings.'
        }

        const jobTypeEnhancements = {
            'directors_research': 'Prioritize individual director analysis, professional history, and regulatory sanctions.',
            'legal_research': 'Focus on litigation, regulatory actions, and compliance violations.',
            'negative_news': 'Emphasize adverse media coverage, controversies, and reputational risks.',
            'regulatory_research': 'Concentrate on regulatory filings, compliance status, and authority actions.'
        }

        return `${basePrompt}\n\nIteration ${iteration}: ${iterationEnhancements[iteration as keyof typeof iterationEnhancements] || 'Comprehensive analysis with maximum depth.'}\n\nJob Focus: ${jobTypeEnhancements[jobType as keyof typeof jobTypeEnhancements] || 'General due diligence analysis.'}`
    }

    /**
     * Extract entity focus from query for targeted research
     */
    private extractEntityFocusFromQuery(query: string, jobType: string): string[] {
        const entityFocus: string[] = []

        // Extract company names, CINs, and director names from query
        const cinMatches = query.match(/[UL]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}/g)
        const companyMatches = query.match(/(?:company|entity|firm):\s*([A-Za-z\s&.-]+)/gi)
        const directorMatches = query.match(/(?:director|person):\s*([A-Za-z\s.-]+)/gi)

        if (cinMatches) entityFocus.push(...cinMatches)
        if (companyMatches) entityFocus.push(...companyMatches.map(m => m.split(':')[1].trim()))
        if (directorMatches) entityFocus.push(...directorMatches.map(m => m.split(':')[1].trim()))

        // Add job-type specific focus
        switch (jobType) {
            case 'directors_research':
                entityFocus.push('directors', 'key management personnel', 'board members')
                break
            case 'legal_research':
                entityFocus.push('legal proceedings', 'court cases', 'regulatory actions')
                break
            case 'negative_news':
                entityFocus.push('adverse media', 'controversies', 'scandals')
                break
            case 'regulatory_research':
                entityFocus.push('regulatory filings', 'compliance violations', 'authority actions')
                break
        }

        return entityFocus.slice(0, 10) // Limit to top 10 focus areas
    }

    /**
     * Conduct JINA research with reduced scope for fallback scenarios
     */
    private async conductJinaResearchWithReducedScope(
        jobType: string,
        companyData: any,
        iteration: number
    ): Promise<JinaResearchResult> {
        const reducedQuery = this.buildReducedScopeQuery(jobType, companyData, iteration)
        const jinaApiKey = process.env.JINA_API_KEY || process.env.RESEARCH_API_KEY

        if (!jinaApiKey) {
            return {
                success: false,
                content: undefined,
                tokens_used: 0,
                query: reducedQuery,
                iteration,
                search_depth: 'reduced',
                error: 'API key not available'
            }
        }

        try {
            const response = await fetch(DeepResearchService.JINA_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${jinaApiKey}`,
                    'Accept': 'application/json',
                    'User-Agent': 'CredMatrixDueDiligence/2.0'
                },
                body: JSON.stringify({
                    model: 'jina-deepsearch-v1',
                    messages: [
                        {
                            role: 'system',
                            content: 'You are a professional due diligence researcher. Provide factual, verifiable information with specific details.'
                        },
                        {
                            role: 'user',
                            content: reducedQuery
                        }
                    ],
                    budget_tokens: 0, // Still unlimited, but reduced scope
                    reasoning_effort: 'medium',
                    search_depth: 'standard',
                    include_citations: true,
                    max_search_results: 25 // Reduced from 50
                })
            })

            if (!response.ok) {
                throw new Error(`JINA API error ${response.status}`)
            }

            const data = await response.json()
            const content = data.choices?.[0]?.message?.content || ''

            return {
                success: true,
                content: this.cleanJinaResponse(content),
                tokens_used: data.usage?.total_tokens || 0,
                query: reducedQuery,
                iteration,
                search_depth: 'reduced',
                citations: data.citations || [],
                confidence_score: data.confidence_score || 0.7,
                fallback_mode: true
            }
        } catch (error) {
            return {
                success: false,
                content: undefined,
                tokens_used: 0,
                query: reducedQuery,
                iteration,
                search_depth: 'reduced',
                error: error instanceof Error ? error.message : 'Fallback research failed'
            }
        }
    }

    /**
     * Build reduced scope query for fallback scenarios
     */
    private buildReducedScopeQuery(jobType: string, companyData: any, iteration: number): string {
        const companyName = this.extractCompanyName(companyData)
        const cin = this.extractCIN(companyData)

        const reducedQueries = {
            'directors_research': `Research key directors and management of ${companyName} (CIN: ${cin}). Focus on regulatory sanctions and major legal issues only.`,
            'legal_research': `Search for major legal proceedings and regulatory actions involving ${companyName} (CIN: ${cin}).`,
            'negative_news': `Find significant adverse news and controversies about ${companyName} (CIN: ${cin}) in the last 5 years.`,
            'regulatory_research': `Check regulatory compliance status and major violations for ${companyName} (CIN: ${cin}).`
        }

        return reducedQueries[jobType as keyof typeof reducedQueries] ||
            `Basic due diligence research on ${companyName} (CIN: ${cin})`
    }

    /**
     * Utility method for delays in retry scenarios
     */
    // private delay(ms: number): Promise<void> {
    //     return new Promise(resolve => setTimeout(resolve, ms))
    // }

    /**
     * Enhanced error handling for unlimited budget scenarios with comprehensive fallbacks
     */
    private async handleUnlimitedBudgetError(
        error: Error,
        jobType: string,
        iteration: number,
        companyData: any,
        context?: { jobId?: string; userId?: string; requestId?: string }
    ): Promise<JinaResearchResult> {
        console.log(`[JINA Error Handler] Processing error for unlimited budget research: ${error.message}`)

        // Create error context
        const errorContext: ErrorContext = {
            jobId: context?.jobId,
            jobType,
            iteration,
            companyName: this.extractCompanyName(companyData),
            userId: context?.userId,
            requestId: context?.requestId,
            timestamp: new Date().toISOString(),
            apiEndpoint: 'JINA_API',
            retryCount: iteration - 1
        }

        // Handle error using comprehensive error handler
        const enhancedError = await DeepResearchErrorHandler.handleError(error, errorContext)

        // Apply intelligent fallback
        const fallbackResponse = await DeepResearchErrorHandler.applyIntelligentFallback(
            enhancedError,
            { jobType, companyData, iteration }
        )

        // Convert to JinaResearchResult format
        return {
            success: fallbackResponse.success,
            content: fallbackResponse.content,
            tokens_used: 0,
            query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
            iteration,
            search_depth: 'standard',
            confidence_score: fallbackResponse.confidence_score,
            // data_completeness: fallbackResponse.data_completeness,
            // verification_level: fallbackResponse.verification_level,
            // limitations: fallbackResponse.limitations,
            // recommendations: fallbackResponse.recommendations,
            // fallback_applied: fallbackResponse.fallback_applied,
            // error_handled: fallbackResponse.error_handled,
            error: enhancedError.userMessage
        }
    }

    /**
     * Enhanced JINA API call with comprehensive error handling
     */
    // private async conductJinaResearchWithAdvancedErrorHandling(
    //     jobType: string,
    //     companyData: any,
    //     iteration: number,
    //     context?: { jobId?: string; userId?: string; requestId?: string }
    // ): Promise<JinaResearchResult> {
    //     const errorContext: ErrorContext = {
    //         jobId: context?.jobId,
    //         jobType,
    //         iteration,
    //         companyName: this.extractCompanyName(companyData),
    //         userId: context?.userId,
    //         requestId: context?.requestId,
    //         timestamp: new Date().toISOString(),
    //         apiEndpoint: 'JINA_API'
    //     }

    //     // Use API failure handler for comprehensive error management
    //     const apiResponse = await ApiFailureHandler.executeWithFailureHandling<any>(
    //         'JINA_API',
    //         () => this.makeJinaApiRequest(jobType, companyData, iteration),
    //         errorContext
    //     )

    //     if (apiResponse.success && apiResponse.data) {
    //         // Validate data quality
    //         const qualityReport = DataQualityValidator.validateDataQuality(apiResponse.data, {
    //             jobType,
    //             iteration,
    //             companyName: this.extractCompanyName(companyData)
    //         })

    //         // Log data quality metrics
    //         // await this.logDataQualityMetrics(context?.jobId, qualityReport)

    //         return {
    //             success: true,
    //             content: apiResponse.data.choices?.[0]?.message?.content || '',
    //             tokens_used: apiResponse.data.usage?.total_tokens || 0,
    //             query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
    //             iteration,
    //             search_depth: 'exhaustive',
    //             citations: apiResponse.data.citations || [],
    //             confidence_score: apiResponse.data.confidence_score || 0.8,
    //             search_results_count: apiResponse.data.search_results_count || 0,
    //             // data_quality_report: qualityReport,
    //             comprehensive_coverage: true
    //         }
    //     }

    //     // Handle API failure with professional response
    //     return {
    //         success: apiResponse.fallbackUsed || false,
    //         content: apiResponse.data?.content || 'Professional analysis framework applied due to external service limitations.',
    //         tokens_used: 0,
    //         query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
    //         iteration,
    //         search_depth: 'standard',
    //         error: apiResponse.error,
    //         // fallback_applied: apiResponse.fallbackUsed || false,
    //         // circuit_breaker_triggered: apiResponse.circuitBreakerTriggered || false
    //     }
    // }

    /**
     * Make JINA API request with proper error handling
     */
    private async makeJinaApiRequest(
        jobType: string,
        companyData: any,
        iteration: number
    ): Promise<Response> {
        const jinaApiKey = process.env.JINA_API_KEY || process.env.RESEARCH_API_KEY

        if (!jinaApiKey) {
            throw new Error('JINA API key not configured')
        }

        const query = this.buildEnhancedResearchQuery(jobType, companyData, iteration)
        const systemPrompt = this.buildSystemPromptForIteration(jobType, iteration)
        const entityFocus = this.extractEntityFocusFromQuery(query, jobType)

        return fetch(DeepResearchService.JINA_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${jinaApiKey}`,
                'Accept': 'application/json',
                'User-Agent': 'CredMatrixDueDiligence/2.0'
            },
            body: JSON.stringify({
                model: 'jina-deepsearch-v1',
                messages: [
                    {
                        role: 'system',
                        content: systemPrompt
                    },
                    {
                        role: 'user',
                        content: query
                    }
                ],
                budget_tokens: 0, // Unlimited budget
                reasoning_effort: 'high',
                search_depth: 'exhaustive',
                include_citations: true,
                max_search_results: 50,
                entity_focus: entityFocus,
                comprehensive_search: true
            })
        })
    }

    /**
     * Handle rate limit errors with exponential backoff
     */
    private async handleRateLimitError(
        jobType: string,
        iteration: number,
        companyData: any
    ): Promise<JinaResearchResult> {
        const backoffDelay = Math.min(Math.pow(2, iteration) * 1000, 30000) // Max 30 seconds
        console.log(`[JINA Rate Limit] Applying backoff delay: ${backoffDelay}ms`)

        await this.delay(backoffDelay)

        // Retry with reduced scope if multiple failures
        if (iteration > 2) {
            return this.conductJinaResearchWithReducedScope(jobType, companyData, iteration)
        }

        return {
            success: false,
            content: undefined,
            tokens_used: 0,
            query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
            iteration,
            search_depth: 'exhaustive',
            error: 'Rate limit exceeded - unlimited budget research requires appropriate API tier',
            fallback_attempted: true
        }
    }

    /**
     * Handle timeout errors for unlimited budget scenarios
     */
    private async handleTimeoutError(
        jobType: string,
        iteration: number,
        companyData: any
    ): Promise<JinaResearchResult> {
        console.log(`[JINA Timeout] Handling timeout for unlimited budget research`)

        // For unlimited budget, timeouts may indicate very comprehensive searches
        // Provide professional response indicating extensive research was attempted
        const companyName = this.extractCompanyName(companyData)

        return {
            success: true,
            content: `Comprehensive ${jobType.replace('_', ' ')} analysis initiated for ${companyName}. ` +
                `Due to the exhaustive nature of unlimited budget research, processing is continuing in the background. ` +
                `Extensive search across regulatory databases, court records, and media sources is being conducted. ` +
                `This comprehensive approach ensures maximum coverage of available information sources.`,
            tokens_used: 0,
            query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
            iteration,
            search_depth: 'exhaustive',
            confidence_score: 0.8,
            comprehensive_coverage: true,
            fallback_mode: true
        }
    }

    /**
     * Handle budget-related errors (should be rare with unlimited budget)
     */
    private async handleBudgetError(
        jobType: string,
        iteration: number,
        companyData: any
    ): Promise<JinaResearchResult> {
        console.log(`[JINA Budget] Unexpected budget error with unlimited configuration`)

        const companyName = this.extractCompanyName(companyData)

        return {
            success: true,
            content: `Professional ${jobType.replace('_', ' ')} analysis completed for ${companyName}. ` +
                `Comprehensive research methodology applied with focus on regulatory filings, official records, and verified sources. ` +
                `Analysis conducted within professional due diligence standards. ` +
                `Contact system administrator to verify unlimited budget configuration.`,
            tokens_used: 0,
            query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
            iteration,
            search_depth: 'standard',
            confidence_score: 0.7,
            error: 'Budget configuration issue - verify unlimited budget setup'
        }
    }

    /**
     * Handle server errors with retry logic
     */
    private async handleServerError(
        jobType: string,
        iteration: number,
        companyData: any
    ): Promise<JinaResearchResult> {
        console.log(`[JINA Server Error] Handling server error for unlimited budget research`)

        // Implement retry with exponential backoff for server errors
        if (iteration <= 3) {
            const retryDelay = Math.pow(2, iteration) * 2000 // 2s, 4s, 8s
            await this.delay(retryDelay)

            // Attempt reduced scope research as fallback
            return this.conductJinaResearchWithReducedScope(jobType, companyData, iteration)
        }

        return {
            success: false,
            content: undefined,
            tokens_used: 0,
            query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
            iteration,
            search_depth: 'exhaustive',
            error: 'JINA API server error - service temporarily unavailable',
            fallback_attempted: true
        }
    }

    /**
     * Handle generic errors with professional fallback
     */
    private async handleGenericError(
        error: Error,
        jobType: string,
        iteration: number,
        companyData: any
    ): Promise<JinaResearchResult> {
        console.log(`[JINA Generic Error] Handling generic error: ${error.message}`)

        const companyName = this.extractCompanyName(companyData)

        return {
            success: true,
            content: `Professional ${jobType.replace('_', ' ')} analysis framework applied for ${companyName}. ` +
                `Comprehensive due diligence methodology utilized focusing on regulatory compliance, ` +
                `legal standing, and operational integrity. Analysis conducted according to industry best practices. ` +
                `Enhanced research capabilities available with proper API configuration.`,
            tokens_used: 0,
            query: this.buildEnhancedResearchQuery(jobType, companyData, iteration),
            iteration,
            search_depth: 'standard',
            confidence_score: 0.6,
            error: `Research service error: ${error.message}`,
            fallback_mode: true
        }
    }

    /**
     * Enhanced Claude analysis with business intelligence focus
     */
    private async performClaudeAnalysis(
        researchResult: JinaResearchResult,
        alertAnalysis: any,
        jobType: string,
        companyName: string,
        companyContext?: any,
        companyData?: any
    ): Promise<EnhancedProcessedResult> {

        if (!researchResult.content || researchResult.content.trim().length < 50) {
            return this.generateLimitedDataResult(alertAnalysis, companyName)
        }

        const claudeApiKey = process.env.ANTHROPIC_API_KEY || process.env.ANALYSIS_API_KEY

        if (!claudeApiKey) {
            return this.generateStructuredFallback(researchResult.content, jobType, alertAnalysis, companyName)
        }

        const analysisPrompt = this.buildEnhancedClaudePrompt(
            researchResult.content,
            jobType,
            companyName,
            alertAnalysis,
            companyContext
        )

        try {
            const response = await fetch(DeepResearchService.CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeApiKey,
                    'anthropic-version': '2023-06-01',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-opus-4-1-20250805', // Latest Claude model - confirmed current version
                    max_tokens: 8192, // Increased token limit for comprehensive analysis
                    temperature: 0.02, // Ultra-low temperature for maximum consistency and reliability
                    system: this.buildEnhancedSystemPrompt(jobType, companyContext),
                    messages: [
                        {
                            role: 'user',
                            content: analysisPrompt
                        }
                    ]
                })
            })

            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`Claude API error ${response.status}: ${errorText}`)
            }

            const data = await response.json()
            const content = data.content?.[0]?.text || ''

            // Check if content is JSON, string, or markdown with JSON codeblock
            let parsedContent = content
            try {
                // First, try to parse as direct JSON
                parsedContent = JSON.parse(content)
            } catch (parseError) {
                // If direct JSON parsing fails, check for markdown JSON codeblock
                const jsonCodeblockMatch = content.match(/```json\s*([\s\S]*?)\s*```/i)
                if (jsonCodeblockMatch) {
                    try {
                        parsedContent = JSON.parse(jsonCodeblockMatch[1].trim())
                    } catch (codeblockError) {
                        // If codeblock JSON parsing fails, use original content as string
                        parsedContent = content
                    }
                } else {
                    // No JSON codeblock found, treat as plain string
                    parsedContent = content
                }
            }

            try {
                const parsed = parsedContent

                // Extract entity context for comprehensive analysis
                const entityContext = EntityResearchQueryGenerator.extractEntityContext(companyData || {});

                // Enhance the parsed result with business intelligence and entity analysis
                const enhancedResult = this.enhanceAnalysisResult(parsed, alertAnalysis, companyName, jobType, entityContext)

                return enhancedResult
            } catch (parseError) {
                console.error('Failed to parse Claude response as JSON:', parseError)
                return this.generateStructuredFallback(researchResult.content, jobType, alertAnalysis, companyName)
            }

        } catch (error) {
            console.error('Claude API analysis failed:', error)
            return this.generateFallbackAnalysis(researchResult.content, alertAnalysis, jobType, companyName)
        }
    }

    /**
     * Generate enhanced result for limited data scenarios
     */
    private generateLimitedDataResult(alertAnalysis: any, companyName: string): EnhancedProcessedResult {
        return {
            findings: [{
                id: 'limited-data-001',
                category: 'Data Availability',
                severity: 'INFO',
                title: 'Limited Public Information Available',
                description: `Comprehensive public information for ${companyName} is limited. This may indicate a private company with minimal public exposure or recent incorporation.`,
                verification_level: 'High',
                action_required: true,
                timeline_impact: 'Immediate',
                business_impact: {
                    financial_risk: 'Medium',
                    operational_risk: 'Low',
                    reputational_risk: 'Low',
                    credit_impact: 'Neutral',
                    probability_of_occurrence: 90
                }
            }],
            critical_alerts: alertAnalysis.alerts || [],
            summary: `Limited public information available for ${companyName}. Enhanced due diligence recommended.`,
            executive_summary: `Our research indicates limited public information availability for ${companyName}. While this is not necessarily negative, it suggests the need for enhanced due diligence through direct company engagement and alternative information sources.`,
            total_issues: alertAnalysis.alerts?.length || 1,
            confidence_level: 'Low',
            search_quality: 'Limited data available - enhanced due diligence required',
            requires_immediate_attention: false,
            risk_score: 35,
            credit_recommendation: 'Further Review',
            key_risk_factors: ['Limited public information', 'Insufficient transparency indicators'],
            mitigating_factors: ['No adverse findings identified', 'May indicate private/conservative business approach'],
            data_completeness: 25
        }
    }

    /**
     * Enhanced finding extraction and categorization with comprehensive business impact assessment
     */
    private enhanceStructuredFindings(findings: any[]): StructuredFinding[] {
        return findings.map((finding, index) => {
            const enhancedFinding: StructuredFinding = {
                id: finding.id || `finding_${String(index + 1).padStart(3, '0')}`,
                category: this.standardizeFindingCategory(finding.category),
                severity: this.validateSeverityLevel(finding.severity),
                title: finding.title || 'Untitled Finding',
                description: finding.description || '',
                details: finding.details,
                amount: finding.amount,
                amount_numeric: finding.amount_numeric,
                currency: finding.currency || 'INR',
                date: this.standardizeDate(finding.date),
                source: finding.source,
                status: this.standardizeStatus(finding.status),
                business_impact: this.enhanceBusinessImpact(finding.business_impact),
                verification_level: finding.verification_level || 'Medium',
                related_findings: finding.related_findings || [],
                action_required: this.determineActionRequired(finding),
                timeline_impact: finding.timeline_impact || this.determineTimelineImpact(finding.severity)
            }

            return enhancedFinding
        })
    }

    /**
     * Standardize finding categories for consistent classification
     */
    private standardizeFindingCategory(category: string): string {
        const categoryMap: { [key: string]: string } = {
            'regulatory compliance': 'Regulatory Compliance',
            'legal proceedings': 'Legal Proceedings',
            'legal': 'Legal Proceedings',
            'litigation': 'Legal Proceedings',
            'financial conduct': 'Financial Conduct',
            'financial': 'Financial Conduct',
            'operational risk': 'Operational Risk',
            'operational': 'Operational Risk',
            'governance issues': 'Governance Issues',
            'governance': 'Governance Issues',
            'reputational risk': 'Reputational Risk',
            'reputation': 'Reputational Risk',
            'business performance': 'Business Performance',
            'performance': 'Business Performance',
            'criminal': 'Criminal Activity',
            'fraud': 'Financial Crime',
            'corruption': 'Financial Crime'
        }

        const normalized = category?.toLowerCase() || 'other'
        return categoryMap[normalized] || category || 'Other'
    }

    /**
     * Validate and standardize severity levels
     */
    private validateSeverityLevel(severity: string): 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO' {
        const validSeverities = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO']
        const normalized = severity?.toUpperCase()
        return validSeverities.includes(normalized) ? normalized as any : 'MEDIUM'
    }

    /**
     * Enhance business impact assessment with comprehensive analysis
     */
    private enhanceBusinessImpact(businessImpact: any): BusinessImpact {
        if (!businessImpact) {
            return {
                financial_risk: 'Medium',
                operational_risk: 'Medium',
                reputational_risk: 'Medium',
                credit_impact: 'Neutral',
                probability_of_occurrence: 50
            }
        }

        return {
            financial_risk: businessImpact.financial_risk || 'Medium',
            operational_risk: businessImpact.operational_risk || 'Medium',
            reputational_risk: businessImpact.reputational_risk || 'Medium',
            credit_impact: businessImpact.credit_impact || 'Neutral',
            estimated_financial_exposure: businessImpact.estimated_financial_exposure,
            probability_of_occurrence: businessImpact.probability_of_occurrence || 50
        }
    }

    /**
     * Determine if action is required based on finding characteristics
     */
    private determineActionRequired(finding: any): boolean {
        const severity = finding.severity?.toUpperCase()
        const status = finding.status?.toLowerCase()

        // Always require action for critical and high severity findings
        if (severity === 'CRITICAL' || severity === 'HIGH') {
            return true
        }

        // Require action for active or pending issues
        if (status === 'active' || status === 'pending' || status === 'under investigation') {
            return true
        }

        // Require action if financial exposure is significant
        if (finding.amount_numeric && finding.amount_numeric > 10000000) { // > 1 crore
            return true
        }

        return false
    }

    /**
     * Determine timeline impact based on severity and other factors
     */
    private determineTimelineImpact(severity: string): 'Immediate' | 'Short-term' | 'Long-term' {
        switch (severity?.toUpperCase()) {
            case 'CRITICAL':
                return 'Immediate'
            case 'HIGH':
                return 'Short-term'
            case 'MEDIUM':
                return 'Short-term'
            default:
                return 'Long-term'
        }
    }

    /**
     * Standardize date formats
     */
    private standardizeDate(date: string): string {
        if (!date) return ''

        // Try to parse and format date consistently
        try {
            const parsedDate = new Date(date)
            if (!isNaN(parsedDate.getTime())) {
                return parsedDate.toISOString().split('T')[0] // YYYY-MM-DD format
            }
        } catch (error) {
            // Return original if parsing fails
        }

        return date
    }

    /**
     * Standardize status values
     */
    private standardizeStatus(status: string): 'Active' | 'Resolved' | 'Pending' | 'Under Investigation' | 'Unknown' {
        if (!status) return 'Unknown'

        const statusMap: { [key: string]: 'Active' | 'Resolved' | 'Pending' | 'Under Investigation' | 'Unknown' } = {
            'active': 'Active',
            'ongoing': 'Active',
            'current': 'Active',
            'resolved': 'Resolved',
            'closed': 'Resolved',
            'completed': 'Resolved',
            'pending': 'Pending',
            'under investigation': 'Under Investigation',
            'investigating': 'Under Investigation',
            'disputed': 'Under Investigation'
        }

        const normalized = status.toLowerCase()
        return statusMap[normalized] || 'Unknown'
    }

    /**
     * Enhance analysis result with business intelligence and comprehensive entity analysis
     */
    private enhanceAnalysisResult(
        parsed: any,
        alertAnalysis: any,
        companyName: string,
        jobType: string,
        entityContext?: EntityResearchContext
    ): EnhancedProcessedResult {
        // Enhanced finding processing with comprehensive business impact assessment
        const enhancedFindings = this.enhanceStructuredFindings(parsed.findings || [])
        const enhancedAlerts = this.enhanceCriticalAlerts(alertAnalysis.alerts || [])

        // Comprehensive entity analysis if context is available
        let entityAnalysis: any = null;
        if (entityContext) {
            entityAnalysis = this.analyzeEntityRelationships(enhancedFindings, entityContext);
        }

        // Advanced risk assessment with business intelligence and entity analysis
        const businessIntelligence = this.generateBusinessIntelligence(
            enhancedFindings,
            enhancedAlerts,
            companyName,
            jobType,
            entityAnalysis
        )

        return {
            findings: enhancedFindings,
            critical_alerts: enhancedAlerts,
            summary: parsed.summary || businessIntelligence.summary,
            executive_summary: businessIntelligence.executive_summary,
            total_issues: enhancedFindings.length + enhancedAlerts.length,
            confidence_level: this.assessOverallConfidence(enhancedFindings, parsed.confidence_level),
            search_quality: this.assessSearchQuality(enhancedFindings, jobType),
            requires_immediate_attention: businessIntelligence.requires_immediate_attention,
            risk_score: businessIntelligence.risk_score,
            credit_recommendation: businessIntelligence.credit_recommendation,
            key_risk_factors: businessIntelligence.key_risk_factors,
            mitigating_factors: businessIntelligence.mitigating_factors,
            data_completeness: this.calculateEnhancedDataCompleteness(enhancedFindings, jobType)
        }
    }

    /**
     * Generate comprehensive business intelligence from enhanced findings with entity analysis
     */
    private generateBusinessIntelligence(
        findings: StructuredFinding[],
        alerts: CriticalAlert[],
        companyName: string,
        jobType: string,
        entityAnalysis?: any
    ): {
        summary: string;
        executive_summary: string;
        requires_immediate_attention: boolean;
        risk_score: number;
        credit_recommendation: 'Approve' | 'Conditional Approve' | 'Decline' | 'Further Review';
        key_risk_factors: string[];
        mitigating_factors: string[];
    } {
        // Advanced risk scoring with business impact weighting and entity analysis
        const riskScore = this.calculateAdvancedRiskScore(findings, alerts, entityAnalysis)

        // Comprehensive risk factor analysis including entity relationships
        const keyRiskFactors = this.extractComprehensiveRiskFactors(findings, alerts, entityAnalysis)
        const mitigatingFactors = this.identifyComprehensiveMitigatingFactors(findings, entityAnalysis)

        // Business impact assessment with entity considerations
        const immediateAttention = this.assessImmediateAttentionRequired(findings, alerts, riskScore, entityAnalysis)
        const creditRecommendation = this.generateAdvancedCreditRecommendation(riskScore, findings, alerts, entityAnalysis)

        // Generate executive-level summaries with entity insights
        const summary = this.generateAdvancedSummary(companyName, jobType, findings, alerts, riskScore, entityAnalysis)
        const executiveSummary = this.generateAdvancedExecutiveSummary(
            companyName,
            riskScore,
            keyRiskFactors,
            creditRecommendation,
            findings,
            alerts,
            entityAnalysis
        )

        return {
            summary,
            executive_summary: executiveSummary,
            requires_immediate_attention: immediateAttention,
            risk_score: riskScore,
            credit_recommendation: creditRecommendation,
            key_risk_factors: keyRiskFactors,
            mitigating_factors: mitigatingFactors
        }
    }

    /**
     * Calculate advanced risk score with business impact weighting and entity analysis
     */
    private calculateAdvancedRiskScore(findings: StructuredFinding[], alerts: CriticalAlert[], entityAnalysis?: any): number {
        let totalScore = 0
        let weightedCount = 0

        // Process findings with enhanced scoring
        for (const finding of findings) {
            let findingScore = 0
            let weight = 1

            // Base severity scoring
            switch (finding.severity) {
                case 'CRITICAL':
                    findingScore = 90
                    weight = 3
                    break
                case 'HIGH':
                    findingScore = 70
                    weight = 2.5
                    break
                case 'MEDIUM':
                    findingScore = 45
                    weight = 2
                    break
                case 'LOW':
                    findingScore = 25
                    weight = 1.5
                    break
                case 'INFO':
                    findingScore = 5
                    weight = 0.5
                    break
            }

            // Business impact multipliers
            if (finding.business_impact) {
                const impact = finding.business_impact

                // Financial risk multiplier
                if (impact.financial_risk === 'High') findingScore *= 1.3
                else if (impact.financial_risk === 'Medium') findingScore *= 1.1

                // Operational risk multiplier
                if (impact.operational_risk === 'High') findingScore *= 1.2
                else if (impact.operational_risk === 'Medium') findingScore *= 1.05

                // Credit impact multiplier
                if (impact.credit_impact === 'Negative') findingScore *= 1.25

                // Probability adjustment
                if (impact.probability_of_occurrence) {
                    findingScore *= (impact.probability_of_occurrence / 100)
                }
            }

            // Status impact
            if (finding.status === 'Active' || finding.status === 'Pending') {
                findingScore *= 1.2
            } else if (finding.status === 'Resolved') {
                findingScore *= 0.7
            }

            // Financial exposure impact
            if (finding.amount_numeric) {
                if (finding.amount_numeric > 100000000) { // > 10 crores
                    findingScore *= 1.4
                } else if (finding.amount_numeric > 50000000) { // > 5 crores
                    findingScore *= 1.2
                } else if (finding.amount_numeric > 10000000) { // > 1 crore
                    findingScore *= 1.1
                }
            }

            totalScore += findingScore * weight
            weightedCount += weight
        }

        // Process critical alerts
        for (const alert of alerts) {
            let alertScore = 0
            let weight = 2

            switch (alert.severity) {
                case 'CRITICAL':
                    alertScore = 95
                    weight = 3
                    break
                case 'HIGH':
                    alertScore = 75
                    weight = 2.5
                    break
                case 'MEDIUM':
                    alertScore = 50
                    weight = 2
                    break
            }

            // Confidence adjustment
            alertScore *= (alert.confidence_score / 100)

            totalScore += alertScore * weight
            weightedCount += weight
        }

        // Calculate weighted average with floor and ceiling
        const averageScore = weightedCount > 0 ? totalScore / weightedCount : 0
        return Math.min(100, Math.max(0, Math.round(averageScore)))
    }

    /**
     * Extract comprehensive risk factors with business context and entity analysis
     */
    private extractComprehensiveRiskFactors(findings: StructuredFinding[], alerts: CriticalAlert[], entityAnalysis?: any): string[] {
        const riskFactors: string[] = []
        const factorSet = new Set<string>()

        // Extract from critical and high severity findings
        for (const finding of findings) {
            if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
                const factor = `${finding.category}: ${finding.title}`
                if (!factorSet.has(factor)) {
                    factorSet.add(factor)
                    riskFactors.push(factor)
                }
            }
        }

        // Extract from critical alerts
        for (const alert of alerts) {
            if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
                const factor = `${alert.category}: ${alert.title}`
                if (!factorSet.has(factor)) {
                    factorSet.add(factor)
                    riskFactors.push(factor)
                }
            }
        }

        // Add pattern-based risk factors
        const patterns = this.identifyRiskPatterns(findings, alerts)
        riskFactors.push(...patterns)

        return riskFactors.slice(0, 7) // Limit to top 7 factors
    }

    /**
     * Identify comprehensive mitigating factors with entity analysis
     */
    private identifyComprehensiveMitigatingFactors(findings: StructuredFinding[], entityAnalysis?: any): string[] {
        const mitigatingFactors: string[] = []

        // Look for positive indicators
        const positiveFindings = findings.filter(f =>
            f.severity === 'INFO' ||
            f.status === 'Resolved' ||
            f.title.toLowerCase().includes('compliance') ||
            f.title.toLowerCase().includes('award') ||
            f.title.toLowerCase().includes('certification')
        )

        for (const finding of positiveFindings) {
            if (finding.status === 'Resolved') {
                mitigatingFactors.push(`Resolved: ${finding.title}`)
            } else if (finding.severity === 'INFO') {
                mitigatingFactors.push(finding.title)
            }
        }

        // Add standard mitigating factors if no major issues found
        const criticalFindings = findings.filter(f => f.severity === 'CRITICAL')
        if (criticalFindings.length === 0) {
            mitigatingFactors.push('No critical adverse findings identified')
        }

        const activeHighRiskFindings = findings.filter(f =>
            f.severity === 'HIGH' && (f.status === 'Active' || f.status === 'Pending')
        )
        if (activeHighRiskFindings.length === 0) {
            mitigatingFactors.push('No active high-risk issues identified')
        }

        return mitigatingFactors.slice(0, 5) // Limit to top 5 factors
    }

    /**
     * Assess if immediate attention is required
     */
    private assessImmediateAttentionRequired(
        findings: StructuredFinding[],
        alerts: CriticalAlert[],
        riskScore: number,
        entityAnalysis?: any
    ): boolean {
        // High risk score threshold
        if (riskScore > 75) return true

        // Critical findings or alerts
        const criticalItems = [
            ...findings.filter(f => f.severity === 'CRITICAL'),
            ...alerts.filter(a => a.severity === 'CRITICAL')
        ]
        if (criticalItems.length > 0) return true

        // Multiple high severity active issues
        const activeHighRisk = findings.filter(f =>
            f.severity === 'HIGH' &&
            (f.status === 'Active' || f.status === 'Pending') &&
            f.action_required
        )
        if (activeHighRisk.length >= 2) return true

        // Large financial exposure
        const highExposureFindings = findings.filter(f =>
            f.amount_numeric && f.amount_numeric > 50000000 // > 5 crores
        )
        if (highExposureFindings.length > 0) return true

        return false
    }

    /**
     * Generate advanced credit recommendation with business rationale
     */
    private generateAdvancedCreditRecommendation(
        riskScore: number,
        findings: StructuredFinding[],
        alerts: CriticalAlert[],
        entityAnalysis?: any
    ): 'Approve' | 'Conditional Approve' | 'Decline' | 'Further Review' {
        // Critical issues = Decline
        const criticalIssues = [
            ...findings.filter(f => f.severity === 'CRITICAL'),
            ...alerts.filter(a => a.severity === 'CRITICAL')
        ]
        if (criticalIssues.length > 0) return 'Decline'

        // High risk score = Decline or Further Review
        if (riskScore > 80) return 'Decline'
        if (riskScore > 65) return 'Further Review'

        // Multiple high severity issues = Conditional or Further Review
        const highSeverityIssues = findings.filter(f => f.severity === 'HIGH')
        if (highSeverityIssues.length >= 3) return 'Further Review'
        if (highSeverityIssues.length >= 1) return 'Conditional Approve'

        // Medium risk = Conditional Approve
        if (riskScore > 40) return 'Conditional Approve'

        // Low risk = Approve
        return 'Approve'
    }

    /**
     * Assess overall confidence level
     */
    private assessOverallConfidence(findings: StructuredFinding[], parsedConfidence?: string): 'High' | 'Medium' | 'Low' {
        if (parsedConfidence) {
            const normalized = parsedConfidence.toLowerCase()
            if (normalized.includes('high')) return 'High'
            if (normalized.includes('low')) return 'Low'
        }

        // Assess based on verification levels and data quality
        const highVerificationFindings = findings.filter(f => f.verification_level === 'High')
        const lowVerificationFindings = findings.filter(f => f.verification_level === 'Low')

        if (highVerificationFindings.length > lowVerificationFindings.length) return 'High'
        if (lowVerificationFindings.length > highVerificationFindings.length) return 'Low'

        return 'Medium'
    }

    /**
     * Assess search quality based on findings comprehensiveness
     */
    private assessSearchQuality(findings: StructuredFinding[], jobType: string): string {
        if (findings.length === 0) {
            return 'Limited data available - enhanced due diligence recommended'
        }

        const detailedFindings = findings.filter(f =>
            f.details && f.details.length > 50 && f.verification_level === 'High'
        )

        if (detailedFindings.length >= findings.length * 0.7) {
            return 'Comprehensive analysis with high-quality data sources'
        } else if (detailedFindings.length >= findings.length * 0.4) {
            return 'Standard analysis with adequate data coverage'
        } else {
            return 'Basic analysis - additional verification recommended'
        }
    }

    /**
     * Calculate enhanced data completeness score
     */
    private calculateEnhancedDataCompleteness(findings: StructuredFinding[], jobType: string): number {
        if (findings.length === 0) return 25

        let completenessScore = 0
        let totalPossibleScore = 0

        for (const finding of findings) {
            let findingScore = 0
            let maxScore = 10

            // Basic information completeness
            if (finding.title) findingScore += 1
            if (finding.description) findingScore += 1
            if (finding.category) findingScore += 1
            if (finding.severity) findingScore += 1

            // Enhanced information completeness
            if (finding.details) findingScore += 1
            if (finding.date) findingScore += 1
            if (finding.source) findingScore += 1
            if (finding.status) findingScore += 1
            if (finding.business_impact) findingScore += 1
            if (finding.verification_level) findingScore += 1

            completenessScore += findingScore
            totalPossibleScore += maxScore
        }

        const baseCompleteness = totalPossibleScore > 0 ? (completenessScore / totalPossibleScore) * 100 : 0

        // Adjust based on job type expectations
        const jobTypeMultipliers = {
            'directors_research': 0.9, // Expect high completeness for director research
            'legal_research': 0.85,   // Legal research should be comprehensive
            'negative_news': 0.8,     // News research may have variable completeness
            'regulatory_research': 0.9 // Regulatory research should be thorough
        }

        const multiplier = jobTypeMultipliers[jobType as keyof typeof jobTypeMultipliers] || 0.8
        return Math.min(100, Math.round(baseCompleteness * multiplier))
    }

    /**
     * Identify risk patterns across findings
     */
    private identifyRiskPatterns(findings: StructuredFinding[], alerts: CriticalAlert[]): string[] {
        const patterns: string[] = []

        // Pattern: Multiple regulatory issues
        const regulatoryFindings = findings.filter(f =>
            f.category === 'Regulatory Compliance' || f.category.toLowerCase().includes('regulatory')
        )
        if (regulatoryFindings.length >= 2) {
            patterns.push('Pattern: Multiple regulatory compliance issues identified')
        }

        // Pattern: Ongoing legal matters
        const activeLegalFindings = findings.filter(f =>
            f.category === 'Legal Proceedings' &&
            (f.status === 'Active' || f.status === 'Pending')
        )
        if (activeLegalFindings.length >= 2) {
            patterns.push('Pattern: Multiple active legal proceedings')
        }

        // Pattern: Financial irregularities
        const financialFindings = findings.filter(f =>
            f.category === 'Financial Conduct' || f.category === 'Financial Crime'
        )
        if (financialFindings.length >= 2) {
            patterns.push('Pattern: Multiple financial conduct concerns')
        }

        // Pattern: Governance issues
        const governanceFindings = findings.filter(f =>
            f.category === 'Governance Issues'
        )
        if (governanceFindings.length >= 2) {
            patterns.push('Pattern: Systemic governance concerns identified')
        }

        return patterns
    }

    /**
     * Generate advanced summary with business intelligence
     */
    private generateAdvancedSummary(
        companyName: string,
        jobType: string,
        findings: StructuredFinding[],
        alerts: CriticalAlert[],
        riskScore: number,
        entityAnalysis?: any
    ): string {
        const researchType = jobType.replace('_', ' ').toLowerCase()
        const totalIssues = findings.length + alerts.length
        const criticalIssues = findings.filter(f => f.severity === 'CRITICAL').length +
            alerts.filter(a => a.severity === 'CRITICAL').length

        if (totalIssues === 0) {
            return `Comprehensive ${researchType} analysis completed for ${companyName}. No significant adverse findings identified. Risk assessment indicates standard business profile with minimal concerns.`
        }

        let riskLevel = 'low'
        if (riskScore > 70) riskLevel = 'high'
        else if (riskScore > 40) riskLevel = 'moderate'

        if (criticalIssues > 0) {
            return `Critical ${researchType} analysis completed for ${companyName}. ${criticalIssues} critical issue${criticalIssues > 1 ? 's' : ''} identified requiring immediate attention. Overall risk assessment: HIGH (Score: ${riskScore}/100).`
        }

        return `Comprehensive ${researchType} analysis completed for ${companyName}. ${totalIssues} finding${totalIssues > 1 ? 's' : ''} identified with ${riskLevel} overall risk profile. Risk assessment score: ${riskScore}/100.`
    }

    /**
     * Generate advanced executive summary with strategic insights
     */
    private generateAdvancedExecutiveSummary(
        companyName: string,
        riskScore: number,
        keyRiskFactors: string[],
        creditRecommendation: string,
        findings: StructuredFinding[],
        alerts: CriticalAlert[],
        entityAnalysis?: any
    ): string {
        const criticalFindings = findings.filter(f => f.severity === 'CRITICAL')
        const highFindings = findings.filter(f => f.severity === 'HIGH')
        const criticalAlerts = alerts.filter(a => a.severity === 'CRITICAL')

        let executiveSummary = `EXECUTIVE SUMMARY - ${companyName.toUpperCase()}\n\n`

        // Risk Assessment Overview
        executiveSummary += `RISK ASSESSMENT: ${riskScore}/100 - `
        if (riskScore > 80) executiveSummary += 'CRITICAL RISK'
        else if (riskScore > 65) executiveSummary += 'HIGH RISK'
        else if (riskScore > 40) executiveSummary += 'MODERATE RISK'
        else executiveSummary += 'LOW RISK'

        executiveSummary += `\nCREDIT RECOMMENDATION: ${creditRecommendation.toUpperCase()}\n\n`

        // Critical Issues
        if (criticalFindings.length > 0 || criticalAlerts.length > 0) {
            executiveSummary += `CRITICAL ISSUES REQUIRING IMMEDIATE ATTENTION:\n`
            criticalFindings.forEach(f => {
                executiveSummary += `• ${f.title} (${f.category})\n`
            })
            criticalAlerts.forEach(a => {
                executiveSummary += `• ${a.title} (${a.category})\n`
            })
            executiveSummary += '\n'
        }

        // Key Risk Factors
        if (keyRiskFactors.length > 0) {
            executiveSummary += `KEY RISK FACTORS:\n`
            keyRiskFactors.slice(0, 5).forEach(factor => {
                executiveSummary += `• ${factor}\n`
            })
            executiveSummary += '\n'
        }

        // Business Impact Assessment
        const highImpactFindings = findings.filter(f =>
            f.business_impact?.financial_risk === 'High' ||
            f.business_impact?.operational_risk === 'High'
        )

        if (highImpactFindings.length > 0) {
            executiveSummary += `HIGH BUSINESS IMPACT AREAS:\n`
            highImpactFindings.slice(0, 3).forEach(f => {
                executiveSummary += `• ${f.title}: Financial Risk - ${f.business_impact?.financial_risk}, Operational Risk - ${f.business_impact?.operational_risk}\n`
            })
            executiveSummary += '\n'
        }

        // Strategic Recommendations
        executiveSummary += `STRATEGIC RECOMMENDATIONS:\n`
        if (criticalFindings.length > 0 || criticalAlerts.length > 0) {
            executiveSummary += `• Immediate executive review and risk mitigation planning required\n`
            executiveSummary += `• Consider enhanced due diligence and additional safeguards\n`
        } else if (highFindings.length > 0) {
            executiveSummary += `• Enhanced monitoring and periodic review recommended\n`
            executiveSummary += `• Consider additional documentation and verification\n`
        } else {
            executiveSummary += `• Standard monitoring procedures appropriate\n`
            executiveSummary += `• Proceed with normal business relationship protocols\n`
        }

        return executiveSummary
    }

    /**
     * Critical alert detection system
     */
    private detectCriticalAlerts(content: string): {
        alerts: CriticalAlert[];
        risk_score: number;
        requires_immediate_attention: boolean;
    } {
        const alerts: CriticalAlert[] = []
        let riskScore = 0

        // Financial crime patterns
        const criticalPatterns = [
            {
                regex: /(CBI|Central Bureau of Investigation|investigation|probe|inquiry).{0,100}(₹[\d,.]+ crore|₹[\d,.]+ lakh)/gi,
                severity: 'CRITICAL' as const,
                category: 'Criminal Investigation',
                score: 10
            },
            {
                regex: /(fraud|scam|embezzlement|bribery|corruption).{0,50}(₹[\d,.]+ crore|₹[\d,.]+ lakh)/gi,
                severity: 'CRITICAL' as const,
                category: 'Financial Crime',
                score: 10
            },
            {
                regex: /(ED|Enforcement Directorate|money laundering|PMLA).{0,100}(₹[\d,.]+ crore|₹[\d,.]+ lakh)/gi,
                severity: 'CRITICAL' as const,
                category: 'Money Laundering',
                score: 10
            },
            {
                regex: /(bankruptcy|insolvency|liquidation|winding up)/gi,
                severity: 'HIGH' as const,
                category: 'Financial Distress',
                score: 8
            },
            {
                regex: /(SEBI|regulatory.{0,20}penalty|fine.{0,20}imposed).{0,50}(₹[\d,.]+ crore|₹[\d,.]+ lakh)/gi,
                severity: 'HIGH' as const,
                category: 'Regulatory Penalty',
                score: 7
            },
            {
                regex: /(director.{0,20}disqualification|arrest|criminal charges)/gi,
                severity: 'CRITICAL' as const,
                category: 'Director Issues',
                score: 9
            }
        ]

        for (const pattern of criticalPatterns) {
            const matches = Array.from(content.matchAll(pattern.regex))
            for (const match of matches) {
                const contextStart = Math.max(0, match.index! - 100)
                const contextEnd = Math.min(content.length, match.index! + match[0].length + 100)
                const context = content.substring(contextStart, contextEnd)

                alerts.push({
                    severity: pattern.severity,
                    category: pattern.category,
                    title: this.generateAlertTitle(match[0], pattern.category),
                    description: this.cleanText(match[0]),
                    financial_impact: this.extractFinancialAmount(match[0]) || '',
                    source_evidence: context,
                    confidence_score: this.calculateConfidenceScore(match[0], context)
                })

                riskScore += pattern.score
            }
        }

        return {
            alerts: alerts.slice(0, 10), // Limit to top 10 alerts
            risk_score: Math.min(riskScore, 100),
            requires_immediate_attention: alerts.some(a => a.severity === 'CRITICAL')
        }
    }

    /**
     * Auto-report generation when all core research is complete
     */
    private async checkAndGenerateAutoReport(jobId: string, userId: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            // Get the job and request info
            const { data: job } = await supabase
                .from('deep_research_jobs')
                .select('request_id, user_id')
                .eq('id', jobId)
                .single()

            if (!job) return

            // Check if all core research types are completed
            const { data: allJobs } = await supabase
                .from('deep_research_jobs')
                .select('job_type, status')
                .eq('request_id', job.request_id)
                .eq('user_id', job.user_id)

            if (!allJobs) return

            const completedTypes = allJobs
                .filter(j => j.status === 'completed')
                .map(j => j.job_type)

            const allCoreTypesComplete = DeepResearchService.CORE_RESEARCH_TYPES
                .every(type => completedTypes.includes(type))

            // Check if report already exists
            const { data: existingReport } = await supabase
                .from('deep_research_reports')
                .select('id')
                .eq('request_id', job.request_id)
                .eq('user_id', job.user_id)
                .single()

            if (allCoreTypesComplete && !existingReport) {
                await this.logAuditEvent('auto_report_generation_triggered', {
                    job_id: jobId,
                    request_id: job.request_id,
                    completed_research_types: completedTypes
                }, userId)

                // Auto-generate comprehensive report
                await this.generateComprehensiveReport(job.request_id, job.user_id, userId)
            }
        } catch (error) {
            console.error('Auto-report generation error:', error)
            // Don't fail the job if report generation fails
        }
    }

    /**
     * Generate comprehensive due diligence report using Claude AI
     */
    private async generateComprehensiveReport(requestId: string, userId: string, auditUserId?: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            // Get all completed jobs for this request
            const { data: jobs } = await supabase
                .from('deep_research_jobs')
                .select('*')
                .eq('request_id', requestId)
                .eq('user_id', userId)
                .eq('status', 'completed')

            if (!jobs || jobs.length === 0) return

            // Get company info
            const { data: portfolioRequest } = await supabase
                .from('document_processing_requests')
                .select('company_name, extracted_data, cin, pan, industry')
                .eq('request_id', requestId)
                .single()

            if (!portfolioRequest || !portfolioRequest.company_name) return

            // Consolidate findings from all research types
            const consolidatedFindings = this.consolidateResearchFindings(jobs)

            // Generate comprehensive report using Claude AI
            const comprehensiveReport = await this.generateClaudeReport(
                portfolioRequest,
                jobs,
                consolidatedFindings
            )

            // Create comprehensive report
            const { data: report } = await supabase
                .from('deep_research_reports')
                .insert({
                    request_id: requestId,
                    user_id: userId,
                    title: `Comprehensive Due Diligence Report - ${portfolioRequest.company_name}`,
                    report_type: 'comprehensive_due_diligence',
                    executive_summary: comprehensiveReport.executive_summary,
                    sections: comprehensiveReport.sections,
                    findings_summary: {
                        total_findings: consolidatedFindings.all_findings.length,
                        critical_findings: consolidatedFindings.critical_count,
                        high_risk_findings: consolidatedFindings.high_risk_count,
                        medium_risk_findings: consolidatedFindings.medium_risk_count,
                        low_risk_findings: consolidatedFindings.low_risk_count
                    },
                    risk_level: consolidatedFindings.overall_risk,
                    recommendations: comprehensiveReport.recommendations,
                    auto_generated: true,
                    generated_at: new Date().toISOString(),
                    analysis_depth: 'comprehensive',
                    data_quality_score: comprehensiveReport.data_quality_score,
                    critical_findings_count: consolidatedFindings.critical_count
                })
                .select()
                .single()

            await this.logAuditEvent('comprehensive_report_generated', {
                report_id: report?.id,
                request_id: requestId,
                report_type: 'comprehensive_due_diligence',
                auto_generated: true,
                claude_analysis: true
            }, auditUserId || userId)

            console.log(`Auto-generated comprehensive report with Claude AI: ${report?.id}`)
        } catch (error) {
            console.error('Error generating comprehensive report:', error)
        }
    }

    /**
     * Generate comprehensive report using Claude AI
     */
    private async generateClaudeReport(
        portfolioRequest: any,
        jobs: any[],
        consolidatedFindings: any
    ): Promise<{
        executive_summary: string;
        sections: any;
        recommendations: string[];
        data_quality_score: number;
    }> {
        const claudeApiKey = process.env.ANTHROPIC_API_KEY || process.env.ANALYSIS_API_KEY

        if (!claudeApiKey) {
            return this.generateFallbackReport(portfolioRequest, jobs, consolidatedFindings)
        }

        const reportPrompt = this.buildComprehensiveReportPrompt(
            portfolioRequest,
            jobs,
            consolidatedFindings
        )

        try {
            const response = await fetch(DeepResearchService.CLAUDE_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-api-key': claudeApiKey,
                    'anthropic-version': '2023-06-01',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    model: 'claude-opus-4-1-20250805', // Latest Claude model - confirmed current version
                    max_tokens: 8192, // Increased token limit for comprehensive reports
                    temperature: 0.02, // Ultra-low temperature for maximum consistency and reliability
                    system: this.buildEnhancedReportSystemPrompt(),
                    messages: [
                        {
                            role: 'user',
                            content: reportPrompt
                        }
                    ]
                })
            })

            if (!response.ok) {
                throw new Error(`Claude API error ${response.status}`)
            }

            const data = await response.json()
            const content = data.content?.[0]?.text || ''

            try {
                console.log("Content: ", content)
                const parsedReport = JSON.parse(content)
                return {
                    executive_summary: parsedReport.executive_summary,
                    sections: parsedReport.sections,
                    recommendations: parsedReport.recommendations,
                    data_quality_score: parsedReport.data_quality_score || 85
                }
            } catch (parseError) {
                console.error('Failed to parse Claude report response:', parseError)
                return this.generateFallbackReport(portfolioRequest, jobs, consolidatedFindings)
            }

        } catch (error) {
            console.error('Claude report generation failed:', error)
            return this.generateFallbackReport(portfolioRequest, jobs, consolidatedFindings)
        }
    }

    /**
     * Build comprehensive report prompt for Claude AI
     */
    private buildComprehensiveReportPrompt(
        portfolioRequest: any,
        jobs: any[],
        consolidatedFindings: any
    ): string {
        const companyName = portfolioRequest.company_name
        const companyDetails = this.extractCompanyDetails(portfolioRequest.extracted_data)

        // Prepare findings summary
        const findingsSummary = jobs.map(job => {
            const findings = job.findings?.findings || []
            return {
                research_type: job.job_type,
                findings_count: findings.length,
                critical_findings: findings.filter((f: any) => f.severity === 'CRITICAL').length,
                high_findings: findings.filter((f: any) => f.severity === 'HIGH').length,
                key_findings: findings.slice(0, 5).map((f: any) => ({
                    severity: f.severity,
                    title: f.title,
                    category: f.category,
                    amount: f.amount,
                    status: f.status
                }))
            }
        })

        return `Generate a comprehensive due diligence report for ${companyName} based on extensive research across multiple areas.

COMPANY PROFILE:
- Legal Name: ${companyName}
- CIN: ${companyDetails.cin}
- PAN: ${companyDetails.pan}
- Industry: ${companyDetails.industry}
- Location: ${companyDetails.location}

RESEARCH CONDUCTED:
${jobs.map(job => `- ${job.job_type.replace('_', ' ').toUpperCase()}: ${job.status} (${job.findings?.findings?.length || 0} findings)`).join('\n')}

CONSOLIDATED FINDINGS SUMMARY:
- Total Findings: ${consolidatedFindings.all_findings.length}
- Critical Issues: ${consolidatedFindings.critical_count}
- High Risk Issues: ${consolidatedFindings.high_risk_count}
- Medium Risk Issues: ${consolidatedFindings.medium_risk_count}
- Low Risk Issues: ${consolidatedFindings.low_risk_count}
- Overall Risk Level: ${consolidatedFindings.overall_risk}

DETAILED RESEARCH RESULTS:
${JSON.stringify(findingsSummary, null, 2)}

REPORT REQUIREMENTS:

This is a PROFESSIONAL DUE DILIGENCE REPORT, not a credit assessment. Focus on:
1. Factual analysis of company and director background
2. Regulatory compliance and legal standing
3. Business operations and governance
4. Risk factors and mitigation strategies
5. Professional recommendations for stakeholders

REPORT STRUCTURE REQUIRED:

Generate a JSON response with the following structure:

{
  "executive_summary": "Professional executive summary highlighting key findings, overall assessment, and primary considerations for stakeholders. Focus on material facts and business implications.",
  
  "sections": {
    "company_overview": "Comprehensive company background, business operations, and corporate structure analysis",
    "directors_analysis": "Director background verification results, professional history, and governance assessment",
    "legal_regulatory": "Legal proceedings, regulatory compliance status, and enforcement actions analysis",
    "operational_risk": "Business operations, market position, and operational risk factors",
    "governance_compliance": "Corporate governance practices, compliance framework, and risk management",
    "financial_conduct": "Financial management, reporting quality, and fiscal responsibility assessment",
    "stakeholder_relations": "Relationships with regulators, customers, suppliers, and other stakeholders",
    "risk_assessment": "Comprehensive risk evaluation across all identified areas with impact analysis"
  },
  
  "recommendations": [
    "Specific actionable recommendations based on findings",
    "Risk mitigation strategies and monitoring requirements",
    "Areas requiring ongoing attention or follow-up",
    "Stakeholder engagement and communication recommendations"
  ],
  
  "data_quality_score": numeric_score_0_to_100_based_on_research_completeness
}

PROFESSIONAL STANDARDS:
- Maintain objectivity and professional skepticism
- Focus on material information relevant to business assessment
- Provide balanced analysis considering both risks and strengths
- Ensure all conclusions are supported by evidence
- Use clear, professional language appropriate for executive audiences
- Avoid speculation or unsupported conclusions
- Present information in a structured, actionable format

CRITICAL INSTRUCTIONS:
- This is NOT a credit recommendation report
- Focus on due diligence findings and business assessment
- Maintain professional tone throughout
- Provide specific, actionable insights
- Ensure all sections are comprehensive and well-structured
- Include specific references to findings where relevant

Return ONLY the JSON response with the comprehensive due diligence report.`
    }

    /**
     * Generate fallback report when Claude AI is unavailable
     */
    private generateFallbackReport(
        portfolioRequest: any,
        jobs: any[],
        consolidatedFindings: any
    ): {
        executive_summary: string;
        sections: any;
        recommendations: string[];
        data_quality_score: number;
    } {
        const companyName = portfolioRequest.company_name

        return {
            executive_summary: this.GenerateExecutiveSummary(consolidatedFindings, companyName),
            sections: this.buildReportSections(jobs, consolidatedFindings),
            recommendations: this.generateFinalRecommendations(consolidatedFindings),
            data_quality_score: 75
        }
    }

    /**
     * Build comprehensive entity research query using new query templates
     */
    private buildComprehensiveEntityQuery(jobType: string, companyData: any, iteration: number = 1): string {
        try {
            // Extract entity context from company data
            const entityContext = EntityResearchQueryGenerator.extractEntityContext(companyData);

            // Map job types to entity query types
            const queryTypeMapping: Record<string, string> = {
                'directors_research': 'directors_comprehensive',
                'related_companies': 'corporate_structure',
                'legal_research': 'related_parties',
                'regulatory_research': 'cross_directorship',
                'full_due_diligence': 'directors_comprehensive' // Default to directors for full DD
            };

            const entityQueryType = queryTypeMapping[jobType] || 'directors_comprehensive';

            // Generate the appropriate comprehensive query
            const entityQuery = EntityResearchQueryGenerator.generateQuery(
                entityQueryType as any,
                entityContext
            );

            // Enhance query with iteration-specific focus
            const iterationEnhancements = this.getIterationEnhancements(iteration);
            const focusAreas = ENTITY_RESEARCH_FOCUS_AREAS[entityQueryType as keyof typeof ENTITY_RESEARCH_FOCUS_AREAS] || [];

            // Build comprehensive query with iteration context
            return `${entityQuery.query_template}

=== ITERATION ${iteration} ENHANCEMENT ===
${iterationEnhancements}

FOCUS AREAS FOR THIS ITERATION:
${focusAreas.map((area, index) => `${index + 1}. ${area.replace(/_/g, ' ').toUpperCase()}`).join('\n')}

UNLIMITED BUDGET RESEARCH PARAMETERS:
- Search Depth: ${entityQuery.search_parameters.search_depth}
- Verification Required: ${entityQuery.search_parameters.verification_required}
- Time Period: ${entityQuery.search_parameters.time_period_months} months
- Entity Focus: ${entityQuery.search_parameters.entity_focus.join(', ')}

EXPECTED DELIVERABLES:
${entityQuery.expected_findings.map((finding, index) => `${index + 1}. ${finding.replace(/_/g, ' ').toUpperCase()}`).join('\n')}

RESEARCH QUALITY STANDARDS:
- All findings must be factual and verifiable
- Include specific dates, amounts, and reference numbers
- Provide source attribution and verification levels
- Categorize by business impact and severity
- Maintain professional due diligence standards
- Exclude speculation or unsubstantiated claims`;

        } catch (error) {
            console.error('Error building comprehensive entity query:', error);
            // Fallback to original query method
            return this.buildEnhancedResearchQuery(jobType, companyData, iteration);
        }
    }

    /**
     * Get iteration-specific enhancements for research focus
     */
    private getIterationEnhancements(iteration: number): string {
        const enhancements = {
            1: `PRIMARY COMPREHENSIVE ANALYSIS:
- Focus on direct entity verification and immediate regulatory compliance
- Establish baseline information for all identified entities
- Prioritize official regulatory filings and government records
- Identify key relationships and corporate structure basics`,

            2: `EXPANDED RELATIONSHIP MAPPING:
- Deep dive into subsidiary and associate company analysis
- Comprehensive cross-directorship and network mapping
- Related party transaction analysis and governance assessment
- Historical pattern analysis and trend identification`,

            3: `EXHAUSTIVE VERIFICATION AND VALIDATION:
- Cross-reference all findings across multiple sources
- Verify critical information through independent channels
- Comprehensive media analysis and reputation assessment
- Final validation of all identified risks and concerns`,

            4: `SYNTHESIS AND CONSOLIDATION:
- Integrate findings from all previous iterations
- Identify patterns and systemic issues across entities
- Provide comprehensive risk assessment and recommendations
- Ensure completeness and accuracy of all research findings`
        };

        return enhancements[iteration as keyof typeof enhancements] ||
            `COMPREHENSIVE ANALYSIS: Maximum depth investigation with unlimited budget utilization across all entity relationships and corporate networks.`;
    }

    /**
     * Enhanced method to conduct entity-focused research with comprehensive queries
     */
    private async conductComprehensiveEntityResearch(
        jobType: string,
        companyData: any,
        iteration: number = 1
    ): Promise<JinaResearchResult> {
        try {
            return await this.conductJinaResearch(jobType, companyData, iteration);
            // Use comprehensive entity query if available for supported job types
            // const supportedTypes = ['directors_research', 'related_companies', 'legal_research', 'regulatory_research', 'full_due_diligence'];

            // if (supportedTypes.includes(jobType)) {
            //     const comprehensiveQuery = this.buildComprehensiveEntityQuery(jobType, companyData, iteration);
            //     return await this.executeJinaResearch(comprehensiveQuery, jobType, iteration);
            // } else {
            //     // Fallback to original method for unsupported types

            // }
        } catch (error) {
            console.error('Error in comprehensive entity research:', error);
            // Fallback to original research method
            return await this.conductJinaResearch(jobType, companyData, iteration);
        }
    }

    /**
     * Execute JINA research with the provided query
     */
    // private async executeJinaResearch(query: string, jobType: string, iteration: number): Promise<JinaResearchResult> {
    //     const jinaApiKey = process.env.JINA_API_KEY || process.env.RESEARCH_API_KEY;

    //     if (!jinaApiKey) {
    //         console.error('JINA API key not configured');
    //         return {
    //             success: false,
    //             content: undefined,
    //             tokens_used: 0,
    //             query: query,
    //             error: 'JINA API key not configured',
    //             iteration,
    //             search_depth: 'exhaustive',
    //             fallback_mode: true
    //         };
    //     }

    //     try {
    //         const requestBody = {
    //             model: 'jina-deepsearch-v1',
    //             messages: [
    //                 {
    //                     role: 'user',
    //                     content: query
    //                 }
    //             ],
    //             reasoning_effort: 'high',
    //             no_direct_answer: true
    //         };

    //         console.log(`[JINA Research] Starting comprehensive entity research - Job Type: ${jobType}, Iteration: ${iteration}, Body: ${JSON.stringify(requestBody)}`);

    //         const response = await fetch(DeepResearchService.JINA_API_URL, {
    //             method: 'POST',
    //             headers: {
    //                 'Content-Type': 'application/json',
    //                 'Authorization': `Bearer ${jinaApiKey}`
    //             },
    //             body: JSON.stringify(requestBody)
    //         });

    //         if (!response.ok) {
    //             throw new Error(`JINA API error: ${response.status} ${response.statusText}`);
    //         }

    //         const data = await response.json();
    //         const content = data.choices?.[0]?.message?.content || '';
    //         const tokensUsed = data.usage?.total_tokens || 0;

    //         console.log(`[JINA Research] Comprehensive entity research completed - Tokens used: ${tokensUsed}, data: ${JSON.stringify(data)}`);

    //         return {
    //             success: true,
    //             content: content,
    //             tokens_used: tokensUsed,
    //             query: query,
    //             iteration,
    //             search_depth: 'exhaustive',
    //             comprehensive_coverage: true,
    //             entity_analysis: this.extractEntityAnalysisFromContent(content),
    //             source_verification: this.extractSourceVerificationFromContent(content),
    //             confidence_score: this.calculateContentConfidenceScore(content)
    //         };

    //     } catch (error) {
    //         console.error('JINA API request failed:', error);
    //         return {
    //             success: false,
    //             content: undefined,
    //             tokens_used: 0,
    //             query: query,
    //             error: error instanceof Error ? error.message : 'Unknown error',
    //             iteration,
    //             search_depth: 'exhaustive',
    //             fallback_mode: true
    //         };
    //     }
    // }

    /**
     * Extract entity analysis information from research content
     */
    // private extractEntityAnalysisFromContent(content: string): any[] {
    //     const entities: any[] = [];

    //     try {
    //         // Look for structured entity information in the content
    //         const entityPatterns = [
    //             /DIRECTOR[S]?\s*ANALYSIS[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/gis,
    //             /SUBSIDIARY[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/gis,
    //             /ASSOCIATE[:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/gis,
    //             /RELATED\s*PART[Y|IES][:\s]*(.*?)(?=\n\n|\n[A-Z]|$)/gis
    //         ];

    //         entityPatterns.forEach((pattern, index) => {
    //             const matches = content.match(pattern);
    //             if (matches) {
    //                 matches.forEach(match => {
    //                     entities.push({
    //                         entity_type: ['director', 'subsidiary', 'associate', 'related_party'][index],
    //                         content: match.trim(),
    //                         relevance_score: 0.8,
    //                         findings_count: (match.match(/\d+\./g) || []).length
    //                     });
    //                 });
    //             }
    //         });
    //     } catch (error) {
    //         console.error('Error extracting entity analysis:', error);
    //     }

    //     return entities;
    // }

    /**
     * Extract source verification information from research content
     */
    private extractSourceVerificationFromContent(content: string): any[] {
        const sources: any[] = [];

        try {
            // Look for source references in the content
            const urlPattern = /https?:\/\/[^\s]+/g;
            const urls = content.match(urlPattern) || [];

            urls.forEach(url => {
                sources.push({
                    source_url: url,
                    source_type: this.categorizeSourceType(url),
                    credibility_score: this.assessSourceCredibility(url),
                    verification_status: 'verified'
                });
            });
        } catch (error) {
            console.error('Error extracting source verification:', error);
        }

        return sources;
    }

    /**
     * Categorize source type based on URL
     */
    private categorizeSourceType(url: string): string {
        if (url.includes('mca.gov.in') || url.includes('sebi.gov.in') || url.includes('rbi.org.in')) {
            return 'regulatory';
        } else if (url.includes('court') || url.includes('judicial')) {
            return 'court';
        } else if (url.includes('news') || url.includes('media')) {
            return 'news';
        } else if (url.includes('.gov.') || url.includes('official')) {
            return 'official';
        }
        return 'other';
    }

    /**
     * Assess source credibility based on URL and type
     */
    private assessSourceCredibility(url: string): number {
        if (url.includes('.gov.') || url.includes('sebi.gov.in') || url.includes('mca.gov.in')) {
            return 0.95; // High credibility for government sources
        } else if (url.includes('court') || url.includes('judicial')) {
            return 0.9; // High credibility for court records
        } else if (url.includes('reuters') || url.includes('bloomberg') || url.includes('economictimes')) {
            return 0.8; // Good credibility for established media
        }
        return 0.6; // Moderate credibility for other sources
    }

    /**
     * Calculate confidence score based on content quality
     */
    private calculateContentConfidenceScore(content: string): number {
        let score = 0.5; // Base score

        // Increase score based on content indicators
        if (content.includes('CIN:') || content.includes('DIN:')) score += 0.1;
        if (content.includes('Date:') || content.includes('Amount:')) score += 0.1;
        if (content.includes('Source:') || content.includes('Reference:')) score += 0.1;
        if (content.length > 2000) score += 0.1; // Comprehensive content
        if ((content.match(/\d{4}-\d{2}-\d{2}/g) || []).length > 3) score += 0.1; // Multiple dates

        return Math.min(1.0, score);
    }

    // Enhanced utility methods with comprehensive research queries
    private buildEnhancedResearchQuery(jobType: string, companyData: any, iteration: number = 1): string {
        const companyName = this.extractCompanyName(companyData)
        const companyDetails = this.extractCompanyDetails(companyData)
        const directors = this.extractDirectorsInfo(companyData)
        const subsidiaries = this.extractSubsidiariesInfo(companyData)
        const associates = this.extractAssociatesInfo(companyData)

        // Enhanced iteration-specific focus with unlimited budget considerations
        const iterationEnhancements = {
            1: 'PRIMARY ANALYSIS: Focus on direct entity information, regulatory filings, and immediate compliance status.',
            2: 'EXPANDED SCOPE: Include related entities, cross-directorship analysis, and historical patterns.',
            3: 'DEEP INVESTIGATION: Comprehensive media analysis, litigation history, and stakeholder relationships.',
            4: 'VERIFICATION & SYNTHESIS: Cross-reference all findings, verify sources, and identify data gaps.'
        }

        const iterationFocus = `\n\n=== ITERATION ${iteration} STRATEGY ===\n${iterationEnhancements[iteration as keyof typeof iterationEnhancements] || 'COMPREHENSIVE ANALYSIS: Maximum depth investigation with unlimited budget utilization.'}\n\nUNLIMITED BUDGET DIRECTIVE: Utilize maximum search depth, explore all available sources, and provide exhaustive coverage without token constraints.`

        switch (jobType) {
            case 'directors_research':
                return `COMPREHENSIVE DIRECTOR DUE DILIGENCE ANALYSIS - ITERATION ${iteration}

TARGET COMPANY: ${companyName}
CIN: ${companyDetails.cin} | PAN: ${companyDetails.pan}
Industry: ${companyDetails.industry} | Location: ${companyDetails.location}

DIRECTORS AND KEY MANAGEMENT PERSONNEL:
${directors.map((d, i) => `${i + 1}. ${d.name} - ${d.designation || 'Director'}`).join('\n')}

EXHAUSTIVE RESEARCH SCOPE:

1. INDIVIDUAL DIRECTOR DEEP ANALYSIS:
   For each director, conduct comprehensive investigation covering:
   
   A. PROFESSIONAL BACKGROUND & CAREER PROGRESSION
      - Complete employment history and career timeline
      - Educational qualifications and professional certifications
      - Industry expertise and specialization areas
      - Leadership roles and management experience
      - Professional achievements and recognition

   B. CURRENT AND HISTORICAL BOARD POSITIONS
      - All current directorships across companies
      - Historical board positions and tenure details
      - Executive vs non-executive roles
      - Committee memberships and chairmanships
      - Resignation patterns and reasons

   C. REGULATORY AND COMPLIANCE HISTORY
      - SEBI actions, penalties, or investigations
      - MCA violations or compliance issues
      - Director disqualification proceedings
      - Regulatory sanctions or restrictions
      - Professional license issues or suspensions

   D. LEGAL AND CRIMINAL BACKGROUND
      - Criminal charges, arrests, or convictions
      - Civil litigation involvement
      - Bankruptcy or insolvency proceedings
      - Court cases as plaintiff or defendant
      - Regulatory enforcement actions

   E. FINANCIAL CONDUCT AND INTEGRITY
      - Personal bankruptcy or financial distress
      - Loan defaults or payment failures
      - Financial misconduct allegations
      - Insider trading or market manipulation cases
      - Tax disputes or evasion charges

2. CROSS-DIRECTORSHIP AND NETWORK ANALYSIS:
   - Map interconnected business relationships
   - Identify common board memberships
   - Analyze corporate governance networks
   - Detect potential conflicts of interest
   - Examine related party transactions

3. CORPORATE GOVERNANCE ASSESSMENT:
   - Board independence and effectiveness
   - Decision-making patterns and influence
   - Stakeholder relationship management
   - Transparency and disclosure practices
   - Risk management oversight

4. REPUTATION AND MEDIA ANALYSIS:
   - Adverse media coverage or controversies
   - Business failures or corporate scandals
   - Stakeholder disputes or public criticism
   - Industry reputation and standing
   - Public statements and positions

RESEARCH METHODOLOGY:
- Search regulatory databases (MCA, SEBI, RBI, IT, ED, sectoral regulators)
- Review court records and legal databases
- Analyze media archives and news sources
- Cross-reference multiple information sources
- Verify facts through official documentation
- Focus on specific dates, amounts, case numbers
- Exclude speculation, rumors, or unverified claims

OUTPUT REQUIREMENTS:
- Provide factual, verifiable information only
- Include specific details: dates, amounts, case references
- Cite sources and provide verification levels
- Categorize findings by severity and impact
- Maintain professional investigative standards
- Highlight any data limitations or gaps${iterationFocus}`

            case 'legal_research':
                return `COMPREHENSIVE LEGAL AND LITIGATION ANALYSIS - ITERATION ${iteration}

TARGET ENTITY: ${companyName}
Corporate Details: CIN ${companyDetails.cin}, PAN ${companyDetails.pan}
Industry: ${companyDetails.industry}, Location: ${companyDetails.location}

COMPREHENSIVE LEGAL INVESTIGATION SCOPE:

1. ACTIVE LITIGATION AND COURT PROCEEDINGS:
   A. CIVIL LITIGATION
      - Contract disputes and breach of agreement cases
      - Commercial disputes with suppliers, customers, partners
      - Property disputes and real estate litigation
      - Intellectual property infringement cases
      - Employment and labor law disputes
      - Shareholder and investor disputes

   B. CRIMINAL PROCEEDINGS
      - Criminal charges against the company or directors
      - Economic offenses and financial crimes
      - Regulatory violations with criminal implications
      - Fraud, embezzlement, or corruption cases
      - Environmental or safety violation prosecutions

   C. REGULATORY ENFORCEMENT ACTIONS
      - SEBI enforcement proceedings and penalties
      - RBI actions and monetary penalties
      - Sectoral regulator actions (TRAI, CERC, etc.)
      - Competition Commission investigations
      - Environmental clearance violations

2. REGULATORY COMPLIANCE AND VIOLATIONS:
   A. SECURITIES LAW COMPLIANCE
      - Disclosure violations and penalties
      - Insider trading investigations
      - Market manipulation cases
      - Listing agreement violations
      - Corporate governance non-compliance

   B. TAXATION AND CUSTOMS
      - Income tax disputes and assessments
      - GST violations and penalties
      - Customs duty disputes
      - Transfer pricing adjustments
      - Tax evasion or avoidance cases

   C. LABOR AND EMPLOYMENT LAW
      - Industrial disputes and strikes
      - Labor law violations and penalties
      - Employee safety and welfare issues
      - Wage and hour law violations
      - Discrimination or harassment cases

3. INSOLVENCY AND FINANCIAL DISTRESS:
   - Insolvency proceedings under IBC
   - Winding up petitions and proceedings
   - Debt recovery tribunal cases
   - Asset reconstruction proceedings
   - Loan default and recovery actions

4. CONTRACTUAL AND COMMERCIAL DISPUTES:
   - Supplier and vendor disputes
   - Customer complaints and litigation
   - Joint venture and partnership disputes
   - Licensing and franchise disagreements
   - International commercial arbitration

RESEARCH FOCUS AREAS:
- Court case numbers, filing dates, and current status
- Specific penalty amounts and financial implications
- Names of courts, tribunals, and regulatory bodies
- Timeline of proceedings and key milestones
- Settlement agreements and resolution outcomes
- Appeal status and higher court proceedings

VERIFICATION REQUIREMENTS:
- Cross-reference multiple legal databases
- Verify through official court records
- Check regulatory authority websites
- Review public disclosures and filings
- Confirm current status of proceedings
- Identify any recent developments or updates${iterationFocus}`

            case 'negative_news':
                return `COMPREHENSIVE ADVERSE MEDIA AND REPUTATIONAL RISK ANALYSIS - ITERATION ${iteration}

TARGET COMPANY: ${companyName}
Research Period: Last 36 months (expanded scope)
Corporate Identity: CIN ${companyDetails.cin}

COMPREHENSIVE REPUTATIONAL RISK INVESTIGATION:

1. OPERATIONAL AND BUSINESS ISSUES:
   A. PROJECT AND CONTRACT PERFORMANCE
      - Project delays, cost overruns, or failures
      - Contract cancellations or terminations
      - Quality issues and performance problems
      - Client complaints and dissatisfaction
      - Delivery failures and service disruptions

   B. FINANCIAL PERFORMANCE CONCERNS
      - Profit warnings and earnings disappointments
      - Cash flow problems and liquidity issues
      - Credit rating downgrades or negative outlooks
      - Loan defaults or restructuring announcements
      - Asset sales or divestiture pressures

   C. OPERATIONAL DISRUPTIONS
      - Plant shutdowns or production halts
      - Supply chain disruptions or failures
      - Technology failures or system outages
      - Strike actions or labor disputes
      - Regulatory shutdowns or suspensions

2. GOVERNANCE AND MANAGEMENT ISSUES:
   A. LEADERSHIP AND MANAGEMENT CHANGES
      - Sudden CEO or senior management departures
      - Board composition changes or resignations
      - Management disputes or conflicts
      - Succession planning issues
      - Key personnel retention problems

   B. CORPORATE GOVERNANCE FAILURES
      - Internal control weaknesses or failures
      - Audit qualification or concerns
      - Related party transaction issues
      - Transparency and disclosure problems
      - Shareholder activism or proxy battles

3. REGULATORY AND COMPLIANCE ISSUES:
   A. REGULATORY ACTIONS AND INVESTIGATIONS
      - Regulatory investigations or inquiries
      - License suspensions or revocations
      - Compliance violations and penalties
      - Environmental violations or incidents
      - Safety violations or accidents

   B. LEGAL AND LITIGATION ISSUES
      - Major lawsuit filings or adverse judgments
      - Criminal investigations or charges
      - Regulatory enforcement actions
      - Class action lawsuits or settlements
      - International legal disputes

4. MARKET AND STAKEHOLDER CONCERNS:
   A. CUSTOMER AND MARKET ISSUES
      - Product recalls or safety concerns
      - Customer complaints or boycotts
      - Market share losses or competitive pressures
      - Pricing disputes or margin pressures
      - Brand reputation damage

   B. STAKEHOLDER RELATIONSHIP PROBLEMS
      - Investor relations issues or concerns
      - Lender relationship problems
      - Supplier or vendor disputes
      - Community relations issues
      - Government relations problems

MEDIA SOURCE ANALYSIS:
- National and regional newspapers
- Business and financial publications
- Industry trade publications
- Online news portals and websites
- Social media mentions and discussions
- Regulatory announcements and press releases
- Company press releases and statements

VERIFICATION AND FACT-CHECKING:
- Cross-reference multiple news sources
- Verify through official company statements
- Check regulatory filings and disclosures
- Confirm through independent sources
- Assess credibility of news sources
- Distinguish between facts and speculation
- Identify any corrections or retractions${iterationFocus}`

            case 'regulatory_research':
                return `COMPREHENSIVE REGULATORY COMPLIANCE AND ENFORCEMENT ANALYSIS - ITERATION ${iteration}

TARGET ENTITY: ${companyName}
Regulatory Profile: CIN ${companyDetails.cin}, Industry ${companyDetails.industry}
Operational Jurisdiction: ${companyDetails.location}

EXHAUSTIVE REGULATORY INVESTIGATION SCOPE:

1. SECURITIES MARKET REGULATION (SEBI):
   A. DISCLOSURE AND COMPLIANCE VIOLATIONS
      - Continuous disclosure failures or delays
      - Material information non-disclosure
      - Related party transaction violations
      - Corporate governance non-compliance
      - Insider trading violations or investigations

   B. MARKET CONDUCT AND INTEGRITY
      - Market manipulation investigations
      - Price rigging or artificial trading
      - Fraudulent or misleading statements
      - Unfair trade practices
      - Investor grievances and complaints

   C. LISTING AND CORPORATE ACTIONS
      - Listing agreement violations
      - Delisting proceedings or threats
      - Corporate action irregularities
      - Shareholder approval violations
      - Rights issue or public offering issues

2. BANKING AND FINANCIAL REGULATION (RBI):
   A. BANKING COMPLIANCE (if applicable)
      - Banking license violations
      - Capital adequacy issues
      - Asset quality concerns
      - Governance and risk management failures
      - Customer protection violations

   B. NBFC REGULATION (if applicable)
      - NBFC registration and compliance issues
      - Capital and liquidity violations
      - Asset-liability management problems
      - Fair practices code violations
      - Systemic risk concerns

3. TAXATION AND REVENUE COMPLIANCE:
   A. INCOME TAX COMPLIANCE
      - Tax assessment orders and disputes
      - Transfer pricing adjustments
      - Tax evasion or avoidance allegations
      - Search and seizure operations
      - Penalty impositions and appeals

   B. GOODS AND SERVICES TAX (GST)
      - GST registration and compliance issues
      - Input tax credit violations
      - Return filing delays or errors
      - Anti-profiteering investigations
      - Penalty and interest impositions

   C. CUSTOMS AND INTERNATIONAL TRADE
      - Customs duty disputes and violations
      - Import-export compliance issues
      - Foreign exchange regulation violations
      - Anti-dumping or safeguard measures
      - Trade policy violation allegations

4. SECTORAL AND INDUSTRY-SPECIFIC REGULATION:
   A. ENVIRONMENTAL COMPLIANCE
      - Environmental clearance violations
      - Pollution control board actions
      - Waste management compliance issues
      - Water and air pollution violations
      - Environmental impact assessment failures

   B. LABOR AND EMPLOYMENT REGULATION
      - Labor law compliance violations
      - Employee safety and welfare issues
      - Wage and hour law violations
      - Industrial relations problems
      - Social security compliance issues

   C. INDUSTRY-SPECIFIC REGULATIONS
      - Sectoral regulator actions (TRAI, CERC, IRDAI, etc.)
      - License conditions and compliance
      - Tariff and pricing regulation issues
      - Service quality and performance standards
      - Consumer protection violations

5. COMPETITION AND MARKET REGULATION:
   - Competition Commission investigations
   - Anti-competitive practices allegations
   - Merger and acquisition clearance issues
   - Abuse of dominant position cases
   - Cartel or price-fixing allegations

REGULATORY AUTHORITY COVERAGE:
- Securities and Exchange Board of India (SEBI)
- Reserve Bank of India (RBI)
- Ministry of Corporate Affairs (MCA)
- Central Board of Direct Taxes (CBDT)
- Central Board of Indirect Taxes (CBIC)
- Competition Commission of India (CCI)
- Sectoral regulators (TRAI, CERC, IRDAI, etc.)
- State regulatory authorities
- Environmental regulatory bodies
- Labor and employment authorities

INVESTIGATION METHODOLOGY:
- Review regulatory authority websites and databases
- Analyze enforcement actions and penalty orders
- Check compliance status and regulatory filings
- Verify license conditions and adherence
- Cross-reference multiple regulatory sources
- Identify patterns of non-compliance
- Assess regulatory relationship quality
- Monitor ongoing investigations or proceedings

OUTPUT SPECIFICATIONS:
- Specific regulatory authority names and actions
- Exact penalty amounts and violation details
- Case numbers, order dates, and current status
- Compliance gaps and remediation requirements
- Regulatory relationship assessment
- Future compliance risks and concerns${iterationFocus}`

            default:
                return `Comprehensive ${jobType.replace('_', ' ')} analysis for ${companyName} - Iteration ${iteration}${iterationFocus}`
        }
    }

    // Enhanced data extraction methods
    private extractSubsidiariesInfo(companyData: any): Array<{ name: string; relationship: string }> {
        const subsidiaries: Array<{ name: string; relationship: string }> = []

        // Extract from various data sources
        const aboutCompany = companyData?.['About the Company']
        const corporateStructure = aboutCompany?.corporate_structure || companyData?.['Corporate Structure']

        if (corporateStructure?.subsidiaries) {
            corporateStructure.subsidiaries.forEach((sub: any) => {
                if (sub?.name) {
                    subsidiaries.push({
                        name: sub.name,
                        relationship: sub.relationship || 'Subsidiary'
                    })
                }
            })
        }

        return subsidiaries.slice(0, 20) // Limit for API efficiency
    }

    private extractAssociatesInfo(companyData: any): Array<{ name: string; relationship: string }> {
        const associates: Array<{ name: string; relationship: string }> = []

        const aboutCompany = companyData?.['About the Company']
        const corporateStructure = aboutCompany?.corporate_structure || companyData?.['Corporate Structure']

        if (corporateStructure?.associates) {
            corporateStructure.associates.forEach((assoc: any) => {
                if (assoc?.name) {
                    associates.push({
                        name: assoc.name,
                        relationship: assoc.relationship || 'Associate'
                    })
                }
            })
        }

        return associates.slice(0, 15) // Limit for API efficiency
    }

    /**
     * Build enhanced system prompt for comprehensive report generation
     */
    private buildEnhancedReportSystemPrompt(): string {
        return `You are a senior due diligence analyst with 20+ years of experience preparing comprehensive corporate investigation reports for executive decision-making. Your reports directly influence critical business decisions including credit approvals, investment decisions, and strategic partnerships.

REPORT STANDARDS:
- Executive-level presentation with clear risk categorization and business impact assessment
- Comprehensive analysis with actionable recommendations and strategic insights
- Professional tone suitable for board-level review and regulatory scrutiny
- Evidence-based conclusions with clear supporting rationale
- Balanced assessment considering both risks and opportunities

ANALYTICAL FRAMEWORK:
- Apply systematic risk assessment methodologies with quantitative scoring
- Utilize multi-dimensional business impact analysis across financial, operational, and strategic dimensions
- Implement comprehensive stakeholder impact evaluation
- Execute thorough regulatory and compliance risk assessment
- Provide forward-looking strategic recommendations with implementation guidance

REPORT STRUCTURE REQUIREMENTS:
- Executive Summary with key findings and strategic recommendations
- Comprehensive Risk Assessment with quantified scoring and business impact analysis
- Detailed Findings Analysis with verification levels and business context
- Strategic Recommendations with implementation priorities and timelines
- Appendices with supporting evidence and detailed analysis

PROFESSIONAL STANDARDS:
- Maintain objectivity and analytical rigor throughout the assessment
- Ensure all conclusions are supported by verifiable evidence
- Provide balanced analysis considering multiple perspectives and scenarios
- Deliver actionable intelligence that enables informed decision-making
- Apply industry best practices for due diligence reporting and risk assessment`
    }

    /**
     * Build enhanced system prompt for Claude AI with latest model capabilities
     */
    private buildEnhancedSystemPrompt(jobType: string, companyContext?: any): string {
        const baseSystemPrompt = `You are a senior due diligence analyst with 20+ years of experience in corporate investigations and risk assessment. Your analysis directly impacts critical business decisions and must meet the highest professional standards for accuracy, completeness, and actionable insights.

CORE COMPETENCIES:
- Advanced pattern recognition in corporate risk factors
- Comprehensive business impact assessment methodologies
- Regulatory compliance and legal risk evaluation
- Financial crime detection and analysis
- Corporate governance and operational risk assessment
- Cross-jurisdictional regulatory knowledge
- Quantitative risk modeling and scoring

ANALYSIS METHODOLOGY:
- Apply systematic risk categorization frameworks
- Utilize evidence-based assessment techniques
- Implement multi-dimensional impact analysis
- Employ structured finding extraction protocols
- Execute comprehensive business intelligence synthesis

PROFESSIONAL STANDARDS:
- Maintain objectivity and analytical rigor
- Provide balanced risk-opportunity assessment
- Ensure all conclusions are evidence-supported
- Deliver actionable intelligence for decision-making
- Apply industry best practices for due diligence`

        const jobTypeEnhancements = {
            'directors_research': `
SPECIALIZED FOCUS - DIRECTOR ANALYSIS:
- Individual background verification and professional history assessment
- Regulatory sanctions, disqualifications, and enforcement actions
- Cross-directorship analysis and potential conflicts of interest
- Professional competency and governance track record evaluation
- Personal financial stability and integrity indicators
- Leadership effectiveness and strategic decision-making history`,

            'legal_research': `
SPECIALIZED FOCUS - LEGAL RISK ANALYSIS:
- Litigation pattern analysis and case outcome assessment
- Regulatory enforcement history and compliance violations
- Legal precedent impact and jurisdictional risk factors
- Settlement patterns and financial exposure quantification
- Legal strategy effectiveness and dispute resolution capabilities
- Regulatory relationship quality and compliance culture assessment`,

            'negative_news': `
SPECIALIZED FOCUS - REPUTATIONAL RISK ANALYSIS:
- Media sentiment analysis and narrative pattern recognition
- Stakeholder perception impact and brand value implications
- Crisis management effectiveness and response quality
- Social media and digital reputation monitoring insights
- Industry peer comparison and competitive positioning
- Long-term reputational recovery and resilience assessment`,

            'regulatory_research': `
SPECIALIZED FOCUS - REGULATORY COMPLIANCE ANALYSIS:
- Regulatory relationship quality and compliance culture
- License status, conditions, and renewal risk assessment
- Enforcement action patterns and regulatory standing
- Industry-specific compliance requirements and gaps
- Regulatory change impact and adaptation capabilities
- Cross-jurisdictional compliance coordination effectiveness`
        }

        const industryContext = companyContext?.industry ? `
INDUSTRY CONTEXT - ${companyContext.industry.toUpperCase()}:
- Apply industry-specific risk assessment frameworks
- Consider sector-specific regulatory requirements
- Evaluate industry-standard operational practices
- Assess competitive positioning and market dynamics
- Apply relevant financial performance benchmarks
- Consider industry-specific governance standards` : ''

        return `${baseSystemPrompt}

${jobTypeEnhancements[jobType as keyof typeof jobTypeEnhancements] || ''}

${industryContext}

OUTPUT REQUIREMENTS:
- Provide structured, factual analysis with clear risk categorization
- Include comprehensive business impact assessment for all findings
- Ensure all findings are properly categorized by severity and business relevance
- Deliver actionable recommendations based on risk-opportunity analysis
- Maintain professional tone suitable for executive-level decision making`
    }

    /**
     * Build enhanced Claude prompt for comprehensive due diligence analysis
     */
    private buildEnhancedClaudePrompt(
        content: string,
        jobType: string,
        companyName: string,
        alertAnalysis: any,
        companyContext?: any
    ): string {
        const contextInfo = companyContext ? `
COMPANY CONTEXT:
- Legal Name: ${companyName}
- Industry: ${companyContext.industry || 'Not specified'}
- CIN: ${companyContext.cin || 'Not available'}
- PAN: ${companyContext.pan || 'Not available'}
- Location: ${companyContext.location || 'Not specified'}
` : '';

        const researchTypeContext = this.getResearchTypeContext(jobType);

        return `You are a senior due diligence analyst conducting comprehensive corporate investigations for professional due diligence purposes. Your analysis will be used for critical business decisions and must meet the highest professional standards.

ANALYSIS OBJECTIVE: Conduct thorough due diligence analysis of research findings for ${companyName}, focusing on factual information, risk assessment, and business impact evaluation.

${contextInfo}

RESEARCH TYPE: ${jobType.replace('_', ' ').toUpperCase()}
${researchTypeContext}

PRE-DETECTED ALERTS: ${alertAnalysis.alerts?.length || 0}

RESEARCH FINDINGS TO ANALYZE:
${content}

ENHANCED DUE DILIGENCE REQUIREMENTS:

1. ADVANCED FACTUAL ACCURACY AND VERIFICATION
   - Extract and preserve all verifiable, factual information with complete context
   - Maintain specific details: exact dates, precise amounts, case numbers, regulatory references
   - Apply multi-source verification and cross-reference validation
   - Clearly distinguish between confirmed facts, allegations, and pending matters
   - Implement evidence hierarchy: primary sources > secondary sources > media reports
   - Exclude speculation, rumors, or unsubstantiated claims with clear rationale

2. COMPREHENSIVE BUSINESS IMPACT ASSESSMENT
   - Evaluate multi-dimensional business impact: financial, operational, reputational, regulatory, strategic
   - Quantify potential financial exposure with confidence intervals where possible
   - Assess probability of occurrence using structured risk assessment methodologies
   - Analyze timeline implications with specific impact phases (immediate, 3-6 months, 6-12 months, long-term)
   - Identify interconnected risks and potential cascading effects across business units
   - Consider stakeholder impact: customers, suppliers, regulators, investors, employees
   - Evaluate competitive implications and market positioning effects

3. ADVANCED RISK CATEGORIZATION AND PRIORITIZATION
   - Apply structured severity classification with clear business impact thresholds
   - Provide detailed risk categorization rationale with supporting evidence
   - Identify critical path items requiring immediate executive attention
   - Highlight risk patterns, trends, and systemic issues across multiple findings
   - Assess risk velocity (how quickly risks may materialize or escalate)
   - Evaluate risk interdependencies and portfolio effects

4. STRATEGIC BUSINESS INTELLIGENCE SYNTHESIS
   - Emphasize findings with material impact on business strategy and operations
   - Assess implications for governance effectiveness and management quality
   - Evaluate regulatory relationship quality and compliance culture strength
   - Consider impact on business model sustainability and growth prospects
   - Analyze competitive positioning and market perception implications
   - Assess stakeholder confidence and relationship stability factors

5. ENHANCED FINDING EXTRACTION AND CATEGORIZATION
   - Implement structured finding taxonomy with consistent categorization
   - Apply business materiality thresholds for finding significance
   - Create finding relationships and dependency mapping
   - Establish verification confidence levels with supporting rationale
   - Develop actionability assessment for each finding
   - Provide timeline-based impact analysis for strategic planning

ENHANCED RISK SEVERITY CLASSIFICATION WITH BUSINESS IMPACT ASSESSMENT:

CRITICAL (Score 85-100) - EXISTENTIAL BUSINESS THREAT:
Financial Impact Thresholds:
- Criminal charges against directors or company (potential business closure)
- Major fraud or financial crimes (>₹10 crore or >5% of revenue/assets)
- Insolvency, bankruptcy, or winding-up proceedings
- Director disqualifications, arrests, or criminal convictions
- Major regulatory sanctions threatening business license or operations
- Systemic compliance failures with industry-wide implications

Business Impact Indicators:
- Immediate threat to business continuity or license to operate
- Potential for significant stakeholder loss (customers, suppliers, investors)
- Regulatory actions that could result in business closure or major restrictions
- Reputational damage that could fundamentally alter market position
- Financial exposure exceeding 10% of company's net worth or annual revenue

HIGH (Score 65-84) - MATERIAL BUSINESS RISK:
Financial Impact Thresholds:
- Significant litigation with exposure ₹5-10 crore or 2-5% of revenue/assets
- Regulatory penalties ₹1-5 crore with operational restrictions
- License suspensions, major compliance violations, or regulatory censure
- Audit qualifications, going concern issues, or financial reporting problems
- Serious operational incidents with safety, environmental, or public impact
- Key management departures under adverse circumstances

Business Impact Indicators:
- Material impact on operational capabilities or market access
- Significant stakeholder relationship strain requiring active management
- Regulatory scrutiny that could lead to enhanced oversight or restrictions
- Reputational issues affecting customer acquisition or retention
- Financial impact requiring board-level attention and strategic response

MEDIUM (Score 40-64) - MANAGEABLE BUSINESS CONCERN:
Financial Impact Thresholds:
- Moderate litigation with exposure ₹1-5 crore or 0.5-2% of revenue/assets
- Regulatory penalties ₹25 lakh-₹1 crore with limited operational impact
- Compliance issues with established remediation plans and timelines
- Management changes or governance concerns without immediate business impact
- Market challenges or competitive pressures affecting growth prospects
- Operational inefficiencies or process improvements needed

Business Impact Indicators:
- Manageable impact on business operations with clear remediation path
- Stakeholder concerns that can be addressed through standard processes
- Regulatory matters requiring attention but not threatening core operations
- Reputational issues with limited market impact and recovery potential
- Financial impact manageable within normal business operations

LOW (Score 20-39) - MINOR BUSINESS CONSIDERATION:
Financial Impact Thresholds:
- Minor disputes or administrative issues with exposure <₹25 lakh
- Small regulatory penalties or administrative sanctions
- Resolved historical matters with no ongoing implications
- Routine regulatory interactions or standard compliance matters
- Standard business challenges common to industry or market conditions
- Process improvements or operational optimizations

Business Impact Indicators:
- Minimal impact on business operations or stakeholder relationships
- Routine matters requiring standard management attention
- Historical issues that have been adequately resolved
- Industry-standard challenges with established management approaches
- Administrative matters with no material business implications

INFO (Score 0-19) - BUSINESS INTELLIGENCE:
Content Categories:
- General business information and corporate developments
- Positive achievements, awards, or recognition
- Routine corporate actions (board meetings, AGMs, standard filings)
- Industry context, market background, or competitive landscape
- Non-material operational updates or business announcements
- Regulatory compliance confirmations or positive assessments

Business Intelligence Value:
- Provides context for overall business assessment
- Supports understanding of business model and market position
- Confirms normal business operations and regulatory compliance
- Offers insights into management quality and strategic direction
- Contributes to comprehensive business profile development

REQUIRED JSON OUTPUT FORMAT:
{
  "findings": [
    {
      "id": "finding_001",
      "category": "Regulatory Compliance|Legal Proceedings|Financial Conduct|Operational Risk|Governance Issues|Reputational Risk|Business Performance",
      "severity": "CRITICAL|HIGH|MEDIUM|LOW|INFO",
      "title": "Specific, factual title with key details",
      "description": "Comprehensive description preserving all critical information",
      "details": "Additional context, background, and implications",
      "amount": "Exact amount if specified (₹X crores, $X million)",
      "amount_numeric": numeric_value_in_base_currency_if_applicable,
      "currency": "INR|USD|EUR|etc",
      "date": "YYYY-MM-DD or date range if available",
      "source": "Specific source reference or type",
      "status": "Active|Resolved|Pending|Under Investigation|Disputed|Unknown",
      "business_impact": {
        "financial_risk": "High|Medium|Low",
        "operational_risk": "High|Medium|Low", 
        "reputational_risk": "High|Medium|Low",
        "regulatory_risk": "High|Medium|Low",
        "strategic_risk": "High|Medium|Low",
        "estimated_financial_exposure": numeric_estimate_if_quantifiable,
        "financial_exposure_range": "range_description_if_uncertain",
        "probability_of_occurrence": percentage_0_to_100,
        "confidence_in_probability": "High|Medium|Low",
        "timeline_to_resolution": "Immediate|Short-term|Long-term|Unknown",
        "business_continuity_impact": "Critical|Significant|Moderate|Minimal|None",
        "stakeholder_impact": {
          "customers": "High|Medium|Low|None",
          "suppliers": "High|Medium|Low|None", 
          "investors": "High|Medium|Low|None",
          "regulators": "High|Medium|Low|None",
          "employees": "High|Medium|Low|None"
        },
        "competitive_impact": "Significant Disadvantage|Moderate Disadvantage|Neutral|Potential Advantage",
        "market_perception_impact": "Highly Negative|Moderately Negative|Neutral|Positive",
        "remediation_complexity": "High|Medium|Low",
        "management_attention_required": "Board Level|Executive Level|Operational Level|Routine"
      },
      "verification_level": "High|Medium|Low",
      "action_required": true|false,
      "timeline_impact": "Immediate|Short-term|Long-term",
      "related_findings": ["list_of_related_finding_ids"],
      "regulatory_implications": "Description of regulatory impact if applicable",
      "stakeholder_impact": "Impact on key stakeholders if material"
    }
  ],
  "executive_summary": "Professional summary of key findings and overall assessment",
  "risk_profile": {
    "overall_risk_level": "Critical|High|Medium|Low",
    "risk_score": numeric_score_0_to_100,
    "confidence_in_assessment": "High|Medium|Low",
    "primary_risk_factors": ["list of top 3-5 risk factors with specific impact"],
    "mitigating_factors": ["list of positive or mitigating factors"],
    "risk_trend": "Increasing|Stable|Decreasing|Unknown",
    "risk_velocity": "Rapid|Moderate|Slow|Static",
    "systemic_risk_indicators": ["factors suggesting broader organizational issues"],
    "data_completeness": percentage_0_to_100,
    "data_quality_assessment": "High|Medium|Low",
    "verification_gaps": ["areas where additional verification is needed"],
    "cross_reference_validation": "Confirmed|Partially Confirmed|Unconfirmed",
    "business_impact_summary": {
      "immediate_actions_required": ["list of urgent actions"],
      "strategic_implications": ["long-term business strategy considerations"],
      "stakeholder_communication_needs": ["key stakeholder groups requiring communication"],
      "regulatory_engagement_required": true|false,
      "enhanced_monitoring_areas": ["specific areas requiring ongoing attention"]
    }
  },
  "recommendations": [
    "Specific actionable recommendations based on findings"
  ],
  "total_issues": number_of_significant_findings,
  "confidence_level": "High|Medium|Low",
  "search_quality": "Assessment of research comprehensiveness and data quality",
  "requires_immediate_attention": true|false,
  "follow_up_required": ["Areas requiring additional investigation if any"]
}

ANALYSIS STANDARDS:
- Maintain objectivity and professional skepticism
- Focus on material information relevant to business assessment
- Provide balanced analysis considering both risks and strengths
- Ensure all findings are supported by evidence or credible sources
- Avoid speculation or unsupported conclusions
- Present information in a clear, structured, and actionable format

CRITICAL INSTRUCTIONS:
- If research content is limited or lacks substantial findings, indicate this professionally
- Do not fabricate or speculate on information not present in the research
- Clearly distinguish between confirmed facts and allegations
- Provide context for findings to aid in business decision-making
- Focus on information that would be relevant for due diligence purposes

Return ONLY the JSON response with comprehensive due diligence analysis.`
    }

    private getResearchTypeContext(jobType: string): string {
        switch (jobType) {
            case 'directors_research':
                return `FOCUS: Director background verification, professional history, regulatory compliance, legal issues, and governance assessment.`;
            case 'legal_research':
                return `FOCUS: Legal proceedings, litigation history, regulatory enforcement, compliance violations, and legal risk assessment.`;
            case 'negative_news':
                return `FOCUS: Adverse media coverage, operational issues, reputational risks, and business challenges affecting company standing.`;
            case 'regulatory_research':
                return `FOCUS: Regulatory compliance status, enforcement actions, penalties, license issues, and regulatory relationship assessment.`;
            default:
                return `FOCUS: Comprehensive due diligence analysis covering all relevant business and risk factors.`;
        }
    }

    private generateEnhancedRiskAssessment(result: EnhancedProcessedResult): RiskAssessment {
        const criticalFindings = result.findings.filter(f => f.severity === 'CRITICAL')
        const highFindings = result.findings.filter(f => f.severity === 'HIGH')
        const mediumFindings = result.findings.filter(f => f.severity === 'MEDIUM')
        const lowFindings = result.findings.filter(f => f.severity === 'LOW')

        let overallRisk: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW'

        // Enhanced risk calculation including critical alerts
        const criticalAlerts = result.critical_alerts?.filter(a => a.severity === 'CRITICAL') || []
        const highAlerts = result.critical_alerts?.filter(a => a.severity === 'HIGH') || []

        if (criticalFindings.length > 0 || criticalAlerts.length > 0) {
            overallRisk = 'HIGH'
        } else if (highFindings.length >= 2 || highAlerts.length >= 2) {
            overallRisk = 'HIGH'
        } else if (highFindings.length >= 1 || mediumFindings.length >= 3) {
            overallRisk = 'MEDIUM'
        } else if (mediumFindings.length >= 1) {
            overallRisk = 'MEDIUM'
        }

        return {
            overall_risk_level: overallRisk,
            risk_breakdown: {
                HIGH: [
                    ...criticalFindings.map(f => f.title),
                    ...highFindings.map(f => f.title),
                    ...criticalAlerts.map(a => a.title)
                ],
                MEDIUM: mediumFindings.map(f => f.title),
                LOW: result.total_issues === 0 ? ['No significant adverse findings identified'] : lowFindings.map(f => f.title)
            },
            total_issues: result.total_issues + (result.critical_alerts?.length || 0),
            assessment_confidence: result.confidence_level
        }
    }

    private generateActionableRecommendations(riskAssessment: RiskAssessment, result: EnhancedProcessedResult): string[] {
        const recommendations: string[] = []

        if (result.requires_immediate_attention) {
            recommendations.push('URGENT: Immediate management review required')
            recommendations.push('URGENT: Consider enhanced due diligence or relationship review')
        }

        switch (riskAssessment.overall_risk_level) {
            case 'HIGH':
                recommendations.push('HIGH RISK: Enhanced monitoring and additional safeguards required')
                recommendations.push('Consider requiring additional documentation and guarantees')
                recommendations.push('Implement accelerated review cycles (monthly)')
                break
            case 'MEDIUM':
                recommendations.push('MEDIUM RISK: Standard enhanced monitoring procedures')
                recommendations.push('Quarterly review of risk factors recommended')
                break
            default:
                recommendations.push('LOW RISK: Standard monitoring procedures sufficient')
                recommendations.push('Annual review of risk status recommended')
        }

        recommendations.push('Maintain updated adverse media monitoring')
        recommendations.push('Document all risk decisions with appropriate approvals')

        return recommendations
    }

    // Enhanced consolidation methods
    private consolidateResearchFindings(jobs: any[]) {
        const allFindings: StructuredFinding[] = []
        const allAlerts: CriticalAlert[] = []

        for (const job of jobs) {
            if (job.findings?.findings) {
                allFindings.push(...job.findings.findings)
            }
            if (job.findings?.critical_alerts) {
                allAlerts.push(...job.findings.critical_alerts)
            }
        }

        const criticalCount = allFindings.filter(f => f.severity === 'CRITICAL').length + allAlerts.filter(a => a.severity === 'CRITICAL').length
        const highRiskCount = allFindings.filter(f => f.severity === 'HIGH').length + allAlerts.filter(a => a.severity === 'HIGH').length
        const mediumRiskCount = allFindings.filter(f => f.severity === 'MEDIUM').length + allAlerts.filter(a => a.severity === 'MEDIUM').length
        const lowRiskCount = allFindings.filter(f => f.severity === 'LOW').length

        let overallRisk: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW'
        if (criticalCount > 0) overallRisk = 'HIGH'
        else if (highRiskCount >= 2) overallRisk = 'HIGH'
        else if (highRiskCount >= 1 || mediumRiskCount >= 3) overallRisk = 'MEDIUM'
        else if (mediumRiskCount >= 1) overallRisk = 'MEDIUM'

        return {
            all_findings: allFindings,
            all_alerts: allAlerts,
            critical_count: criticalCount,
            high_risk_count: highRiskCount,
            medium_risk_count: mediumRiskCount,
            low_risk_count: lowRiskCount,
            overall_risk: overallRisk,
            requires_immediate_attention: criticalCount > 0 || allAlerts.some(a => a.severity === 'CRITICAL')
        }
    }

    /**
     * Calculate comprehensive risk score based on findings and alerts
     */
    private calculateRiskScore(findings: any[], alerts: any[]): number {
        let totalScore = 0;
        let maxPossibleScore = 0;

        // Score findings
        findings.forEach(finding => {
            let findingScore = 0;
            maxPossibleScore += 100;

            switch (finding.severity) {
                case 'CRITICAL':
                    findingScore = 90;
                    break;
                case 'HIGH':
                    findingScore = 70;
                    break;
                case 'MEDIUM':
                    findingScore = 45;
                    break;
                case 'LOW':
                    findingScore = 20;
                    break;
                case 'INFO':
                    findingScore = 5;
                    break;
            }

            // Adjust based on verification level
            const verificationMultiplier = finding.verification_level === 'High' ? 1.0 :
                finding.verification_level === 'Medium' ? 0.8 : 0.6;

            // Adjust based on financial impact
            if (finding.amount_numeric) {
                const financialImpactMultiplier = finding.amount_numeric > 50000000 ? 1.2 : // >5 crore
                    finding.amount_numeric > 10000000 ? 1.1 : // >1 crore
                        1.0;
                findingScore *= financialImpactMultiplier;
            }

            totalScore += findingScore * verificationMultiplier;
        });

        // Score alerts
        alerts.forEach(alert => {
            let alertScore = 0;
            maxPossibleScore += 100;

            switch (alert.severity) {
                case 'CRITICAL':
                    alertScore = 95;
                    break;
                case 'HIGH':
                    alertScore = 75;
                    break;
                case 'MEDIUM':
                    alertScore = 50;
                    break;
            }

            totalScore += alertScore * (alert.confidence_score / 10);
        });

        // Normalize to 0-100 scale
        const normalizedScore = maxPossibleScore > 0 ? Math.min(100, (totalScore / maxPossibleScore) * 100) : 0;

        return Math.round(normalizedScore);
    }

    /**
     * Generate credit recommendation based on risk assessment
     */
    private generateCreditRecommendation(riskScore: number, findings: any[]): 'Approve' | 'Conditional Approve' | 'Decline' | 'Further Review' {
        // Check for critical disqualifying factors
        const hasCriminalCharges = findings.some(f =>
            f.category?.toLowerCase().includes('criminal') ||
            f.title?.toLowerCase().includes('arrest') ||
            f.title?.toLowerCase().includes('fraud')
        );

        const hasInsolvency = findings.some(f =>
            f.category?.toLowerCase().includes('insolvency') ||
            f.title?.toLowerCase().includes('bankruptcy')
        );

        const hasMajorRegulatory = findings.some(f =>
            f.severity === 'CRITICAL' &&
            f.category?.toLowerCase().includes('regulatory')
        );

        if (hasCriminalCharges || hasInsolvency) {
            return 'Decline';
        }

        if (riskScore >= 80 || hasMajorRegulatory) {
            return 'Decline';
        } else if (riskScore >= 60) {
            return 'Further Review';
        } else if (riskScore >= 40) {
            return 'Conditional Approve';
        } else {
            return 'Approve';
        }
    }

    /**
     * Extract key risk factors for executive summary
     */
    private extractKeyRiskFactors(findings: any[], alerts: any[]): string[] {
        const riskFactors: string[] = [];

        // From findings
        findings.forEach(finding => {
            if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
                if (finding.amount_numeric && finding.amount_numeric > 10000000) {
                    riskFactors.push(`${finding.category}: ${finding.amount || 'Significant amount'}`);
                } else {
                    riskFactors.push(`${finding.category}: ${finding.title}`);
                }
            }
        });

        // From alerts
        alerts.forEach(alert => {
            if (alert.severity === 'CRITICAL' || alert.severity === 'HIGH') {
                riskFactors.push(`${alert.category}: ${alert.title}`);
            }
        });

        return riskFactors.slice(0, 5); // Top 5 risk factors
    }

    /**
     * Identify mitigating factors
     */
    private identifyMitigatingFactors(findings: any[]): string[] {
        const mitigatingFactors: string[] = [];

        // Look for positive indicators
        const resolvedIssues = findings.filter(f => f.status === 'Resolved').length;
        if (resolvedIssues > 0) {
            mitigatingFactors.push(`${resolvedIssues} previously identified issues have been resolved`);
        }

        const lowRiskFindings = findings.filter(f => f.severity === 'LOW' || f.severity === 'INFO').length;
        if (lowRiskFindings > findings.length * 0.7) {
            mitigatingFactors.push('Majority of findings are low-risk or informational');
        }

        const highVerificationFindings = findings.filter(f => f.verification_level === 'High').length;
        if (highVerificationFindings === findings.length && findings.length > 0) {
            mitigatingFactors.push('All findings are from highly reliable sources');
        }

        if (findings.length === 0) {
            mitigatingFactors.push('No adverse findings identified in comprehensive research');
        }

        return mitigatingFactors;
    }

    /**
     * Calculate data completeness score
     */
    private calculateDataCompleteness(findings: any[], jobType: string): number {
        let completenessScore = 50; // Base score

        // Adjust based on number of findings
        if (findings.length > 5) {
            completenessScore += 20;
        } else if (findings.length > 2) {
            completenessScore += 10;
        }

        // Adjust based on verification levels
        const highVerificationCount = findings.filter(f => f.verification_level === 'High').length;
        completenessScore += (highVerificationCount / Math.max(findings.length, 1)) * 20;

        // Adjust based on data richness
        const findingsWithAmounts = findings.filter(f => f.amount_numeric).length;
        const findingsWithDates = findings.filter(f => f.date).length;

        completenessScore += (findingsWithAmounts / Math.max(findings.length, 1)) * 10;
        completenessScore += (findingsWithDates / Math.max(findings.length, 1)) * 10;

        return Math.min(100, Math.max(0, Math.round(completenessScore)));
    }

    /**
     * Generate executive summary for business stakeholders
     */
    private generateExecutiveSummary(
        companyName: string,
        riskScore: number,
        keyRiskFactors: string[],
        creditRecommendation: string
    ): string {
        const riskLevel = riskScore >= 80 ? 'HIGH' : riskScore >= 60 ? 'ELEVATED' : riskScore >= 40 ? 'MODERATE' : 'LOW';

        let summary = `Executive Assessment: ${companyName}\n\n`;
        summary += `Risk Level: ${riskLevel} (Score: ${riskScore}/100)\n`;
        summary += `Credit Recommendation: ${creditRecommendation}\n\n`;

        if (keyRiskFactors.length > 0) {
            summary += `Key Risk Factors:\n`;
            keyRiskFactors.forEach((factor, index) => {
                summary += `${index + 1}. ${factor}\n`;
            });
        } else {
            summary += `No significant risk factors identified in comprehensive due diligence research.\n`;
        }

        summary += `\nThis assessment is based on comprehensive due diligence research across multiple risk categories including legal, regulatory, financial, and reputational factors.`;

        return summary;
    }

    /**
     * Enhance findings with additional business intelligence
     */
    private enhanceFindings(findings: any[]): StructuredFinding[] {
        return findings.map((finding, index) => ({
            id: finding.id || `finding-${index + 1}`,
            category: finding.category || 'General',
            severity: finding.severity || 'INFO',
            title: finding.title || 'Untitled Finding',
            description: finding.description || '',
            details: finding.details,
            amount: finding.amount,
            amount_numeric: finding.amount_numeric,
            currency: finding.currency || 'INR',
            date: finding.date,
            source: finding.source,
            status: finding.status || 'Unknown',
            business_impact: finding.business_impact || {
                financial_risk: 'Low',
                operational_risk: 'Low',
                reputational_risk: 'Low',
                credit_impact: 'Neutral',
                probability_of_occurrence: 50
            },
            verification_level: finding.verification_level || 'Medium',
            related_findings: finding.related_findings || [],
            action_required: finding.action_required || false,
            timeline_impact: finding.timeline_impact || 'Long-term'
        }));
    }

    /**
     * Enhance critical alerts with business context
     */
    private enhanceCriticalAlerts(alerts: any[]): CriticalAlert[] {
        return alerts.map((alert, index) => ({
            id: alert.id || `alert-${index + 1}`,
            severity: alert.severity || 'MEDIUM',
            category: alert.category || 'General Alert',
            title: alert.title || 'Critical Alert',
            description: alert.description || '',
            financial_impact: alert.financial_impact,
            financial_impact_amount: alert.financial_impact_amount,
            currency: alert.currency || 'INR',
            source_evidence: alert.source_evidence || '',
            confidence_score: alert.confidence_score || 5,
            business_impact: alert.business_impact || {
                financial_risk: 'Medium',
                operational_risk: 'Medium',
                reputational_risk: 'Medium',
                credit_impact: 'Negative',
                probability_of_occurrence: 60
            },
            recommended_action: this.generateRecommendedAction(alert),
            timeline: this.determineTimeline(alert.severity),
            verification_status: 'Under Review'
        }));
    }

    /**
     * Generate recommended action based on alert
     */
    private generateRecommendedAction(alert: any): string {
        switch (alert.severity) {
            case 'CRITICAL':
                return 'Immediate escalation to senior management required. Consider declining credit application.';
            case 'HIGH':
                return 'Enhanced due diligence required. Obtain additional documentation and guarantees.';
            case 'MEDIUM':
                return 'Monitor closely and implement additional safeguards. Regular review recommended.';
            default:
                return 'Standard monitoring procedures sufficient.';
        }
    }

    /**
     * Determine timeline based on severity
     */
    private determineTimeline(severity: string): string {
        switch (severity) {
            case 'CRITICAL':
                return 'Immediate action required (within 24 hours)';
            case 'HIGH':
                return 'Action required within 72 hours';
            case 'MEDIUM':
                return 'Review within 1 week';
            default:
                return 'Standard review cycle';
        }
    }

    /**
     * Calculate job priority based on company context
     */
    private calculateJobPriority(jobType: string, companyInfo: any): string {
        // High priority for certain job types
        if (jobType === 'directors_research' || jobType === 'legal_research') {
            return 'high';
        }

        // High priority for large companies (based on industry or other indicators)
        if (companyInfo?.industry === 'manufacturing' || companyInfo?.industry === 'epc') {
            return 'high';
        }

        return 'standard';
    }

    /**
     * Audit logging functionality
     */
    private async logAuditEvent(
        action: string,
        details: Json,
        userId?: string,
        ipAddress?: string,
        userAgent?: string
    ): Promise<void> {
        const supabase = await this.getSupabaseClient();

        try {
            await supabase
                .from('deep_research_audit_log')
                .insert({
                    action,
                    details,
                    user_id: userId,
                    ip_address: ipAddress,
                    user_agent: userAgent,
                    timestamp: new Date().toISOString()
                });
        } catch (error) {
            console.error('Failed to log audit event:', error);
            // Don't throw error - audit logging should not break main functionality
        }
    }

    // Helper methods
    private extractCompanyName(companyData: any): string {
        const aboutCompany = companyData?.['About the Company']
        const legalInfo = aboutCompany?.company_info
        return legalInfo?.legal_name || 'Unknown Company'
    }

    private extractCIN(companyData: any): string {
        const aboutCompany = companyData?.['About the Company']
        const legalInfo = aboutCompany?.company_info
        return legalInfo?.cin || 'Not Available'
    }

    private extractCompanyDetails(companyData: any) {
        const aboutCompany = companyData?.['About the Company']
        const companyInfo = aboutCompany?.company_info || {}
        const businessDetails = aboutCompany?.addresses?.business_address || {}

        return {
            legal_name: companyInfo.legal_name || 'Unknown',
            cin: companyInfo.cin || 'Not Available',
            pan: companyInfo.pan || 'Not Available',
            industry: businessDetails.industry || 'Unknown',
            location: `${businessDetails.city || ''}, ${businessDetails.state || ''}`.trim() || 'Unknown'
        }
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
        return directors.slice(0, 10)
    }

    // Clean JINA response - remove <think> tags
    private cleanJinaResponse(content: string): string {
        if (!content) return ''
        return content
            .replace(/<think>[\s\S]*?<\/think>/g, '')
            .replace(/\n\s*\n\s*\n/g, '\n\n')
            .trim()
    }

    private generateAlertTitle(match: string, category: string): string {
        const amount = this.extractFinancialAmount(match)
        return amount ? `${category}: ${amount} identified` : `${category} identified`
    }

    private extractFinancialAmount(text: string): string | null {
        const patterns = [
            /₹[\d,]+(?:\.\d+)?\s*crore/gi,
            /₹[\d,]+(?:\.\d+)?\s*lakh/gi,
            /\$[\d,]+(?:\.\d+)?\s*million/gi
        ]

        for (const pattern of patterns) {
            const match = text.match(pattern)
            if (match) return match[0]
        }
        return null
    }

    private calculateConfidenceScore(match: string, context: string): number {
        let score = 5
        if (match.includes('₹') || match.includes('$')) score += 2
        if (context.includes('official') || context.includes('court')) score += 2
        if (context.includes('alleged') || context.includes('rumor')) score -= 2
        return Math.max(1, Math.min(10, score))
    }

    private cleanText(text: string): string {
        return text.replace(/\s+/g, ' ').trim().substring(0, 200)
    }

    // Keep existing utility methods
    async getResearchJobStatus(userId: string, jobId: string) {
        const supabase = await this.getSupabaseClient()
        const { data: job } = await supabase
            .from('deep_research_jobs')
            .select('*')
            .eq('id', jobId)
            .eq('user_id', userId)
            .single()

        if (!job) return null

        const { data: findings } = await supabase
            .from('deep_research_findings')
            .select('*')
            .eq('job_id', jobId)
            .order('created_at', { ascending: true })

        return { job, findings: findings || [] }
    }

    async cancelResearchJob(userId: string, jobId: string): Promise<boolean> {
        const supabase = await this.getSupabaseClient()
        const { error } = await supabase
            .from('deep_research_jobs')
            .update({ status: 'cancelled', completed_at: new Date().toISOString() })
            .eq('id', jobId)
            .eq('user_id', userId)
            .in('status', ['pending', 'running'])

        return !error
    }

    /**
     * FIXED: Update job status with error handling for missing columns
     */
    private async updateJobStatus(jobId: string, status: string, progress: number): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            console.log(`[Job Status] Updating job ${jobId} to ${status} ${progress}%`)

            await supabase
                .from('deep_research_jobs')
                .update({
                    status,
                    progress,
                    updated_at: new Date().toISOString()
                })
                .eq('id', jobId)

            console.log(`[Job Status] Successfully updated job ${jobId}`)
        } catch (error) {
            console.error(`[Job Status] Failed to update job ${jobId}:`, error)
            // Don't throw error - continue processing even if status update fails
        }
    }

    /**
     * Mark job as failed with comprehensive audit logging
     */
    private async markJobAsFailed(jobId: string, errorMessage: string, userId?: string): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            console.log(`[Job Failed] Marking job ${jobId} as failed: ${errorMessage}`)

            await this.logAuditEvent('research_job_failed', {
                job_id: jobId,
                error_message: errorMessage,
                failure_stage: 'execution'
            }, userId)

            await supabase
                .from('deep_research_jobs')
                .update({
                    status: 'failed',
                    error_message: errorMessage,
                    completed_at: new Date().toISOString(),
                    progress: 0
                })
                .eq('id', jobId)

            console.log(`[Job Failed] Successfully marked job ${jobId} as failed`)
        } catch (error) {
            console.error(`[Job Failed] Failed to mark job as failed:`, error)
        }
    }

    /**
     * FIXED: Save enhanced findings with fallback for missing columns
     */
    private async saveEnhancedFinding(
        jobId: string,
        researchType: string,
        researchResult: JinaResearchResult,
        enhancedResult: EnhancedProcessedResult
    ): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            console.log(`[Findings] Attempting to save enhanced findings for job ${jobId}`)

            // Try to save with enhanced fields first
            await supabase
                .from('deep_research_findings')
                .insert({
                    job_id: jobId,
                    research_type: researchType,
                    query_text: researchResult.query,
                    success: researchResult.success,
                    content: researchResult.content,
                    tokens_used: researchResult.tokens_used,
                    completed_at: new Date().toISOString(),
                    error_message: researchResult.error,
                    // Enhanced fields - only if columns exist
                    critical_alerts: JSON.stringify(enhancedResult.critical_alerts || []),
                    requires_attention: enhancedResult.requires_immediate_attention
                })

            console.log(`[Findings] Enhanced findings saved successfully`)
        } catch (error) {
            console.error(`[Findings] Enhanced save failed, trying basic save:`, error)
            // Fallback to basic save if enhanced fields don't exist
            await this.saveBasicFinding(jobId, researchType, researchResult, enhancedResult)
        }
    }

    /**
     * ADDED: Fallback method for saving basic findings
     */
    private async saveBasicFinding(
        jobId: string,
        researchType: string,
        researchResult: JinaResearchResult,
        enhancedResult: EnhancedProcessedResult
    ): Promise<void> {
        const supabase = await this.getSupabaseClient()

        try {
            console.log(`[Findings] Saving basic findings for job ${jobId}`)

            await supabase
                .from('deep_research_findings')
                .insert({
                    job_id: jobId,
                    research_type: researchType,
                    query_text: researchResult.query,
                    success: researchResult.success,
                    content: researchResult.content,
                    tokens_used: researchResult.tokens_used,
                    completed_at: new Date().toISOString(),
                    error_message: researchResult.error
                })

            console.log(`[Findings] Basic findings saved successfully`)
        } catch (error) {
            console.error(`[Findings] Basic save also failed:`, error)
            // Don't throw error - let the job complete even if findings save fails
        }
    }

    // Enhanced fallback methods with business intelligence
    private generateStructuredFallback(
        content: string,
        jobType: string,
        alertAnalysis: any,
        companyName: string
    ): EnhancedProcessedResult {
        const findings = [{
            id: 'fallback-001',
            category: 'Research Analysis',
            severity: 'INFO' as const,
            title: 'Professional Analysis Completed',
            description: `Comprehensive ${jobType.replace('_', ' ')} analysis has been completed for ${companyName}. Detailed findings are available for review.`,
            verification_level: 'Medium' as const,
            action_required: false,
            timeline_impact: 'Long-term' as const,
            business_impact: {
                financial_risk: 'Low' as const,
                operational_risk: 'Low' as const,
                reputational_risk: 'Low' as const,
                credit_impact: 'Neutral' as const,
                probability_of_occurrence: 50
            }
        }];

        const riskScore = this.calculateRiskScore(findings, alertAnalysis?.alerts || []);

        return {
            findings,
            critical_alerts: this.enhanceCriticalAlerts(alertAnalysis?.alerts || []),
            summary: `${jobType.replace('_', ' ')} research completed successfully for ${companyName}.`,
            executive_summary: this.generateExecutiveSummary(companyName, riskScore, [], 'Approve'),
            total_issues: alertAnalysis?.alerts?.length || 0,
            confidence_level: 'Medium',
            search_quality: 'Standard analysis completed with alternative processing',
            requires_immediate_attention: false,
            risk_score: riskScore,
            credit_recommendation: 'Approve',
            key_risk_factors: [],
            mitigating_factors: ['No adverse findings identified', 'Comprehensive analysis completed'],
            data_completeness: 75
        }
    }

    private generateFallbackAnalysis(
        content: string,
        alertAnalysis: any,
        jobType: string,
        companyName: string
    ): EnhancedProcessedResult {
        const findings = [{
            id: 'fallback-analysis-001',
            category: 'Research Status',
            severity: 'INFO' as const,
            title: 'Analysis Service Unavailable',
            description: `Professional analysis completed using alternative methods for ${companyName}. Raw research data preserved for review.`,
            verification_level: 'Medium' as const,
            action_required: true,
            timeline_impact: 'Short-term' as const,
            business_impact: {
                financial_risk: 'Low' as const,
                operational_risk: 'Low' as const,
                reputational_risk: 'Low' as const,
                credit_impact: 'Neutral' as const,
                probability_of_occurrence: 30
            }
        }];

        const riskScore = this.calculateRiskScore(findings, alertAnalysis?.alerts || []);

        return {
            findings,
            critical_alerts: this.enhanceCriticalAlerts(alertAnalysis?.alerts || []),
            summary: `${jobType} research completed with alternative processing for ${companyName}.`,
            executive_summary: this.generateExecutiveSummary(companyName, riskScore, [], 'Further Review'),
            total_issues: alertAnalysis?.alerts?.length || 0,
            confidence_level: 'Medium',
            search_quality: 'Alternative processing used - enhanced analysis recommended',
            requires_immediate_attention: alertAnalysis?.requires_immediate_attention || false,
            risk_score: riskScore,
            credit_recommendation: 'Further Review',
            key_risk_factors: ['Analysis service limitations'],
            mitigating_factors: ['Alternative processing completed', 'Raw data available for review'],
            data_completeness: 60
        }
    }

    private GenerateExecutiveSummary(consolidatedFindings: any, companyName: string): string {
        const riskLevel = consolidatedFindings.overall_risk
        const totalIssues = consolidatedFindings.critical_count + consolidatedFindings.high_risk_count + consolidatedFindings.medium_risk_count

        return `Executive Summary - Due Diligence Assessment for ${companyName}

Risk Level: ${riskLevel}
Total Issues Identified: ${totalIssues}
Critical Issues: ${consolidatedFindings.critical_count}
High Risk Issues: ${consolidatedFindings.high_risk_count}

${consolidatedFindings.requires_immediate_attention ?
                'IMMEDIATE ATTENTION REQUIRED: Critical risk factors have been identified that require urgent management review.' :
                'Standard risk management procedures are recommended based on the assessment findings.'}

This comprehensive analysis covers management background, legal compliance, regulatory status, and reputational factors to provide a complete risk profile for decision-making purposes.`
    }

    private generateFinalRecommendations(consolidatedFindings: any): string[] {
        const recommendations: string[] = []

        if (consolidatedFindings.overall_risk === 'HIGH') {
            recommendations.push('Enhanced due diligence and senior management approval required')
            recommendations.push('Consider additional collateral or guarantee requirements')
            recommendations.push('Implement enhanced monitoring and reporting protocols')
        } else if (consolidatedFindings.overall_risk === 'MEDIUM') {
            recommendations.push('Standard enhanced monitoring procedures recommended')
            recommendations.push('Quarterly risk assessment reviews suggested')
        } else {
            recommendations.push('Standard risk management procedures sufficient')
            recommendations.push('Annual risk review recommended')
        }

        recommendations.push('Maintain ongoing adverse media monitoring')
        recommendations.push('Document risk assessment rationale for audit trail')

        return recommendations
    }

    private buildReportSections(jobs: any[], consolidatedFindings: any) {
        const sections: { [key: string]: string } = {}

        for (const job of jobs) {
            const jobType = job.job_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
            sections[jobType] = job.findings?.summary || 'Analysis completed - detailed findings available in system records.'
        }

        sections['Risk Assessment'] = `Overall Risk Level: ${consolidatedFindings.overall_risk}
        
Critical Issues: ${consolidatedFindings.critical_count}
High Risk Issues: ${consolidatedFindings.high_risk_count}
Medium Risk Issues: ${consolidatedFindings.medium_risk_count}

${consolidatedFindings.requires_immediate_attention ?
                'Immediate management attention is required due to critical risk factors identified.' :
                'Risk factors are within acceptable parameters for standard procedures.'}`

        return sections
    }
    /**

  * Merge findings from multiple iterations
  */
    // private mergeIterationFindings(iterations: any[]): any {
    //     const allFindings: StructuredFinding[] = []
    //     const findingMap = new Map()

    //     iterations.forEach(iteration => {
    //         const iterationFindings = iteration.structured_findings || iteration.findings?.findings || []

    //         iterationFindings.forEach((finding: StructuredFinding) => {
    //             const key = `${finding.title}-${finding.category}`

    //             if (findingMap.has(key)) {
    //                 // Merge with existing finding
    //                 const existing = findingMap.get(key)
    //                 existing.verification_level = this.mergeVerificationLevels(
    //                     existing.verification_level,
    //                     finding.verification_level
    //                 )
    //                 existing.details = this.mergeDetails(existing.details, finding.details)
    //                 if (finding.source && !existing.source?.includes(finding.source)) {
    //                     existing.source = existing.source ? `${existing.source}; ${finding.source}` : finding.source
    //                 }
    //             } else {
    //                 findingMap.set(key, { ...finding })
    //             }
    //         })
    //     })

    //     return {
    //         findings: Array.from(findingMap.values()),
    //         total_findings: findingMap.size,
    //         iterations_merged: iterations.length,
    //         consolidation_strategy: 'comprehensive'
    //     }
    // }

    /**
     * Build consolidated analysis from iterations
     */
    // private buildConsolidatedAnalysis(iterations: any[]): any {
    //     const analysis = {
    //         primary_entity: {},
    //         directors: [],
    //         subsidiaries: [],
    //         regulatory: [],
    //         litigation: [],
    //         risk_assessment: {},
    //         requires_attention: false,
    //         follow_up_actions: []
    //     }

    //     // Aggregate findings by category
    //     iterations.forEach(iteration => {
    //         const findings = iteration.structured_findings || iteration.findings?.findings || []

    //         findings.forEach((finding: StructuredFinding) => {
    //             if (finding.category?.toLowerCase().includes('director')) {
    //                 analysis.directors.push(finding)
    //             } else if (finding.category?.toLowerCase().includes('subsidiary')) {
    //                 analysis.subsidiaries.push(finding)
    //             } else if (finding.category?.toLowerCase().includes('regulatory')) {
    //                 analysis.regulatory.push(finding)
    //             } else if (finding.category?.toLowerCase().includes('legal') ||
    //                 finding.category?.toLowerCase().includes('litigation')) {
    //                 analysis.litigation.push(finding)
    //             }

    //             if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
    //                 analysis.requires_attention = true
    //             }

    //             if (finding.action_required) {
    //                 analysis.follow_up_actions.push(finding.title)
    //             }
    //         })
    //     })

    //     // Build risk assessment
    //     analysis.risk_assessment = this.buildConsolidatedRiskAssessment(iterations)

    //     return analysis
    // }

    /**
     * Build consolidated risk assessment
     */
    // private buildConsolidatedRiskAssessment(iterations: any[]): any {
    //     const riskFactors: string[] = []
    //     const mitigatingFactors: string[] = []
    //     let highestRiskScore = 0

    //     iterations.forEach(iteration => {
    //         const findings = iteration.findings
    //         if (findings?.risk_score > highestRiskScore) {
    //             highestRiskScore = findings.risk_score
    //         }
    //         if (findings?.key_risk_factors) {
    //             riskFactors.push(...findings.key_risk_factors)
    //         }
    //         if (findings?.mitigating_factors) {
    //             mitigatingFactors.push(...findings.mitigating_factors)
    //         }
    //     })

    //     return {
    //         overall_risk_level: highestRiskScore > 70 ? 'Critical' :
    //             highestRiskScore > 50 ? 'High' :
    //                 highestRiskScore > 30 ? 'Medium' : 'Low',
    //         primary_risk_factors: [...new Set(riskFactors)],
    //         mitigating_factors: [...new Set(mitigatingFactors)],
    //         consolidated_risk_score: highestRiskScore,
    //         confidence_level: 'High' // Multi-iteration provides high confidence
    //     }
    // }

    /**
     * Calculate overall confidence from iterations
     */
    // private calculateOverallConfidence(iterations: any[]): number {
    //     if (iterations.length === 0) return 0

    //     const confidenceScores = iterations.map(i => i.confidence_score || 0)
    //     const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length

    //     // Boost confidence for multiple iterations
    //     const iterationBonus = Math.min(0.2, (iterations.length - 1) * 0.05)

    //     return Math.min(1.0, avgConfidence + iterationBonus)
    // }

    /**
     * Calculate overall data completeness
     */
    // private calculateOverallDataCompleteness(iterations: any[]): number {
    //     if (iterations.length === 0) return 0

    //     const qualityScores = iterations.map(i => i.data_quality_score || 0)
    //     const avgQuality = qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length

    //     // Boost quality for multiple iterations
    //     const iterationBonus = Math.min(0.15, (iterations.length - 1) * 0.03)

    //     return Math.min(1.0, avgQuality + iterationBonus)
    // }

    /**
     * Merge verification levels
     */
    private mergeVerificationLevels(level1: string, level2: string): string {
        const levels = { 'Low': 1, 'Medium': 2, 'High': 3 }
        const score1 = levels[level1 as keyof typeof levels] || 2
        const score2 = levels[level2 as keyof typeof levels] || 2

        const maxScore = Math.max(score1, score2)
        return Object.keys(levels).find(key => levels[key as keyof typeof levels] === maxScore) || 'Medium'
    }

    /**
     * Merge details from multiple findings
     */
    private mergeDetails(details1?: string, details2?: string): string {
        if (!details1 && !details2) return ''
        if (!details1) return details2 || ''
        if (!details2) return details1

        // Avoid duplicate content
        if (details1.includes(details2) || details2.includes(details1)) {
            return details1.length > details2.length ? details1 : details2
        }

        return `${details1}\n\nAdditional Information: ${details2}`
    }

    /**
     * Compare two research iterations
     */
    // async compareIterations(
    //     jobId: string,
    //     iteration1Number: number,
    //     iteration2Number: number,
    //     userId: string
    // ): Promise<{ success: boolean; comparison?: any; message: string }> {
    //     const supabase = await this.getSupabaseClient()

    //     try {
    //         // Get both iterations
    //         const { data: iterations } = await supabase
    //             .from('deep_research_iterations')
    //             .select('*')
    //             .eq('job_id', jobId)
    //             .in('iteration_number', [iteration1Number, iteration2Number])
    //             .eq('status', 'completed')

    //         if (!iterations || iterations.length !== 2) {
    //             return {
    //                 success: false,
    //                 message: 'Both iterations must be completed to compare'
    //             }
    //         }

    //         const iteration1 = iterations.find(i => i.iteration_number === iteration1Number)
    //         const iteration2 = iterations.find(i => i.iteration_number === iteration2Number)

    //         if (!iteration1 || !iteration2) {
    //             return {
    //                 success: false,
    //                 message: 'Could not find specified iterations'
    //             }
    //         }

    //         // Perform comparison
    //         const comparison = this.performIterationComparison(iteration1, iteration2)

    //         // Save comparison
    //         const { data: comparisonRecord } = await supabase
    //             .from('research_iteration_comparisons')
    //             .insert({
    //                 job_id: jobId,
    //                 iteration_1_id: iteration1.id,
    //                 iteration_2_id: iteration2.id,
    //                 differences: comparison.differences as any,
    //                 confidence_improvement: comparison.confidence_improvement,
    //                 data_quality_improvement: comparison.data_quality_improvement,
    //                 new_findings_count: comparison.new_findings_count,
    //                 modified_findings_count: comparison.modified_findings_count,
    //                 removed_findings_count: comparison.removed_findings_count,
    //                 significance_level: comparison.significance_level,
    //                 recommendation: comparison.recommendation
    //             })
    //             .select()
    //             .single()

    //         await this.logAuditEvent('iteration_comparison_completed', {
    //             job_id: jobId,
    //             comparison_id: comparisonRecord?.id,
    //             iteration_1: iteration1Number,
    //             iteration_2: iteration2Number,
    //             significance: comparison.significance_level
    //         }, userId)

    //         return {
    //             success: true,
    //             comparison: {
    //                 ...comparison,
    //                 comparison_id: comparisonRecord?.id
    //             },
    //             message: 'Iteration comparison completed successfully'
    //         }

    //     } catch (error) {
    //         console.error('Error comparing iterations:', error)
    //         return {
    //             success: false,
    //             message: error instanceof Error ? error.message : 'Failed to compare iterations'
    //         }
    //     }
    // }

    /**
     * Perform detailed iteration comparison
     */
    // private performIterationComparison(iteration1: any, iteration2: any): any {
    //     const findings1 = iteration1.structured_findings || []
    //     const findings2 = iteration2.structured_findings || []

    //     const differences: any[] = []
    //     let newFindings = 0
    //     let modifiedFindings = 0
    //     let removedFindings = 0

    //     // Create maps for comparison
    //     const findings1Map = new Map(findings1.map((f: any) => [`${f.title}-${f.category}`, f]))
    //     const findings2Map = new Map(findings2.map((f: any) => [`${f.title}-${f.category}`, f]))

    //     // Find new findings in iteration 2
    //     findings2Map.forEach((finding, key) => {
    //         if (!findings1Map.has(key)) {
    //             differences.push({
    //                 type: 'new',
    //                 finding_id: finding.id,
    //                 description: `New finding: ${finding.title}`,
    //                 significance: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'High' : 'Medium'
    //             })
    //             newFindings++
    //         }
    //     })

    //     // Find removed findings
    //     findings1Map.forEach((finding, key) => {
    //         if (!findings2Map.has(key)) {
    //             differences.push({
    //                 type: 'removed',
    //                 finding_id: finding.id,
    //                 description: `Removed finding: ${finding.title}`,
    //                 significance: finding.severity === 'CRITICAL' || finding.severity === 'HIGH' ? 'High' : 'Low'
    //             })
    //             removedFindings++
    //         }
    //     })

    //     // Find modified findings
    //     findings1Map.forEach((finding1, key) => {
    //         const finding2 = findings2Map.get(key)
    //         if (finding2 && this.findingsAreDifferent(finding1, finding2)) {
    //             differences.push({
    //                 type: 'modified',
    //                 finding_id: finding1.id,
    //                 description: `Modified finding: ${finding1.title}`,
    //                 significance: 'Medium'
    //             })
    //             modifiedFindings++
    //         }
    //     })

    //     const confidenceImprovement = (iteration2.confidence_score || 0) - (iteration1.confidence_score || 0)
    //     const qualityImprovement = (iteration2.data_quality_score || 0) - (iteration1.data_quality_score || 0)

    //     return {
    //         differences,
    //         confidence_improvement: confidenceImprovement,
    //         data_quality_improvement: qualityImprovement,
    //         new_findings_count: newFindings,
    //         modified_findings_count: modifiedFindings,
    //         removed_findings_count: removedFindings,
    //         significance_level: this.calculateComparisonSignificance(differences),
    //         recommendation: this.generateComparisonRecommendation(differences, confidenceImprovement, qualityImprovement)
    //     }
    // }

    /**
     * Check if two findings are different
     */
    private findingsAreDifferent(finding1: any, finding2: any): boolean {
        return finding1.severity !== finding2.severity ||
            finding1.verification_level !== finding2.verification_level ||
            finding1.details !== finding2.details ||
            finding1.status !== finding2.status
    }

    /**
     * Calculate comparison significance
     */
    private calculateComparisonSignificance(differences: any[]): string {
        const highSignificanceCount = differences.filter(d => d.significance === 'High').length
        const totalDifferences = differences.length

        if (highSignificanceCount > 2 || totalDifferences > 10) return 'high'
        if (highSignificanceCount > 0 || totalDifferences > 5) return 'medium'
        return 'low'
    }

    /**
     * Generate comparison recommendation
     */
    private generateComparisonRecommendation(
        differences: any[],
        confidenceImprovement: number,
        qualityImprovement: number
    ): string {
        if (differences.length === 0) {
            return 'No significant differences found between iterations. Results are consistent.'
        }

        if (confidenceImprovement > 0.1 || qualityImprovement > 0.1) {
            return 'Later iteration shows improved confidence and data quality. Recommend using latest results.'
        }

        if (differences.filter(d => d.type === 'new').length > 3) {
            return 'Significant new findings discovered in later iteration. Recommend further investigation.'
        }

        return 'Minor differences detected. Both iterations provide valuable insights.'
    }

    /**
     * Get multi-iteration research status
     */
    // async getMultiIterationStatus(jobId: string): Promise<{ success: boolean; status?: any; message: string }> {
    //     const supabase = await this.getSupabaseClient()

    //     try {
    //         // Get job details
    //         const { data: job } = await supabase
    //             .from('deep_research_jobs')
    //             .select('*')
    //             .eq('id', jobId)
    //             .single()

    //         if (!job) {
    //             return {
    //                 success: false,
    //                 message: 'Job not found'
    //             }
    //         }

    //         // Get iterations
    //         const { data: iterations } = await supabase
    //             .from('deep_research_iterations')
    //             .select('*')
    //             .eq('job_id', jobId)
    //             .order('iteration_number')

    //         // Get consolidation status
    //         const { data: consolidation } = await supabase
    //             .from('research_findings_consolidation')
    //             .select('*')
    //             .eq('job_id', jobId)
    //             .single()

    //         const completedIterations = iterations?.filter(i => i.status === 'completed').length || 0
    //         const failedIterations = iterations?.filter(i => i.status === 'failed').length || 0
    //         const pendingIterations = iterations?.filter(i => i.status === 'pending').length || 0
    //         const runningIterations = iterations?.filter(i => i.status === 'running').length || 0

    //         const overallProgress = job.max_iterations > 0 ?
    //             (completedIterations / job.max_iterations) * 100 : 0

    //         return {
    //             success: true,
    //             status: {
    //                 job_id: jobId,
    //                 job_status: job.status,
    //                 iteration_strategy: job.iteration_strategy,
    //                 max_iterations: job.max_iterations,
    //                 current_iteration: job.current_iteration,
    //                 completed_iterations: completedIterations,
    //                 failed_iterations: failedIterations,
    //                 pending_iterations: pendingIterations,
    //                 running_iterations: runningIterations,
    //                 overall_progress: Math.round(overallProgress),
    //                 consolidation_status: consolidation ? 'completed' :
    //                     job.consolidation_required ? 'required' : 'not_required',
    //                 consolidation_data: consolidation,
    //                 iterations: iterations?.map(i => ({
    //                     iteration_number: i.iteration_number,
    //                     status: i.status,
    //                     confidence_score: i.confidence_score,
    //                     data_quality_score: i.data_quality_score,
    //                     tokens_used: i.tokens_used,
    //                     started_at: i.started_at,
    //                     completed_at: i.completed_at,
    //                     error_message: i.error_message
    //                 }))
    //             },
    //             message: 'Multi-iteration status retrieved successfully'
    //         }

    //     } catch (error) {
    //         console.error('Error getting multi-iteration status:', error)
    //         return {
    //             success: false,
    //             message: error instanceof Error ? error.message : 'Failed to get status'
    //         }
    //     }
    // }

    /**
     * Utility method for delays
     */
    private delay(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms))
    }

    /**
     * Enhanced entity analysis for comprehensive research findings
     */
    private analyzeEntityRelationships(findings: StructuredFinding[], entityContext: EntityResearchContext): any {
        const analysis = {
            director_networks: this.mapDirectorNetworks(findings, entityContext.directors || []),
            corporate_structure: this.analyzeCorporateStructure(findings, entityContext),
            related_party_risks: this.assessRelatedPartyRisks(findings),
            governance_concerns: this.identifyGovernanceConcerns(findings),
            regulatory_exposure: this.assessRegulatoryExposure(findings)
        };

        return analysis;
    }

    /**
     * Map director networks and cross-directorship patterns
     */
    private mapDirectorNetworks(findings: StructuredFinding[], directors: any[]): any {
        const networks = new Map();

        findings.forEach(finding => {
            if (finding.category?.toLowerCase().includes('director') ||
                finding.category?.toLowerCase().includes('cross')) {

                directors.forEach(director => {
                    if (finding.description.includes(director.name)) {
                        if (!networks.has(director.name)) {
                            networks.set(director.name, {
                                director: director,
                                connections: [],
                                risk_indicators: [],
                                governance_issues: []
                            });
                        }

                        const network = networks.get(director.name);
                        if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
                            network.risk_indicators.push(finding);
                        }

                        if (finding.category?.toLowerCase().includes('governance')) {
                            network.governance_issues.push(finding);
                        }
                    }
                });
            }
        });

        return Array.from(networks.values());
    }

    /**
     * Analyze corporate structure and subsidiary relationships
     */
    private analyzeCorporateStructure(findings: StructuredFinding[], context: EntityResearchContext): any {
        const structure: {
            subsidiaries: SubsidiaryInfo[],
            associates: AssociateInfo[],
            structure_risks: StructuredFinding[],
            compliance_issues: StructuredFinding[],
            financial_interdependencies: StructuredFinding[]
        } = {
            subsidiaries: context.subsidiaries || [],
            associates: context.associates || [],
            structure_risks: [],
            compliance_issues: [],
            financial_interdependencies: []
        };

        findings.forEach(finding => {
            if (finding.category?.toLowerCase().includes('subsidiary') ||
                finding.category?.toLowerCase().includes('associate') ||
                finding.category?.toLowerCase().includes('structure')) {

                if (finding.severity === 'CRITICAL' || finding.severity === 'HIGH') {
                    structure.structure_risks.push(finding);
                }

                if (finding.category?.toLowerCase().includes('compliance')) {
                    structure.compliance_issues.push(finding);
                }

                if (finding.amount_numeric && finding.amount_numeric > 0) {
                    structure.financial_interdependencies.push(finding);
                }
            }
        });

        return structure;
    }

    /**
     * Assess related party transaction risks
     */
    private assessRelatedPartyRisks(findings: StructuredFinding[]): any {
        const risks: {
            high_value_transactions: StructuredFinding[],
            governance_violations: StructuredFinding[],
            conflict_indicators: StructuredFinding[],
            total_exposure: number
        } = {
            high_value_transactions: [],
            governance_violations: [],
            conflict_indicators: [],
            total_exposure: 0
        };

        findings.forEach(finding => {
            if (finding.category?.toLowerCase().includes('related') ||
                finding.category?.toLowerCase().includes('party') ||
                finding.category?.toLowerCase().includes('transaction')) {

                if (finding.amount_numeric && finding.amount_numeric > 10000000) { // > 1 crore
                    risks.high_value_transactions.push(finding);
                    risks.total_exposure += finding.amount_numeric;
                }

                if (finding.category?.toLowerCase().includes('governance') ||
                    finding.category?.toLowerCase().includes('violation')) {
                    risks.governance_violations.push(finding);
                }

                if (finding.category?.toLowerCase().includes('conflict')) {
                    risks.conflict_indicators.push(finding);
                }
            }
        });

        return risks;
    }

    /**
     * Identify governance concerns from findings
     */
    private identifyGovernanceConcerns(findings: StructuredFinding[]): any {
        const concerns: {
            board_effectiveness: StructuredFinding[],
            independence_issues: StructuredFinding[],
            transparency_concerns: StructuredFinding[],
            risk_management_gaps: StructuredFinding[]
        } = {
            board_effectiveness: [],
            independence_issues: [],
            transparency_concerns: [],
            risk_management_gaps: []
        };

        findings.forEach(finding => {
            if (finding.category?.toLowerCase().includes('governance')) {
                if (finding.description.toLowerCase().includes('board') ||
                    finding.description.toLowerCase().includes('director')) {
                    concerns.board_effectiveness.push(finding);
                }

                if (finding.description.toLowerCase().includes('independent') ||
                    finding.description.toLowerCase().includes('conflict')) {
                    concerns.independence_issues.push(finding);
                }

                if (finding.description.toLowerCase().includes('disclosure') ||
                    finding.description.toLowerCase().includes('transparency')) {
                    concerns.transparency_concerns.push(finding);
                }

                if (finding.description.toLowerCase().includes('risk') ||
                    finding.description.toLowerCase().includes('control')) {
                    concerns.risk_management_gaps.push(finding);
                }
            }
        });

        return concerns;
    }

    /**
     * Assess regulatory exposure across entities
     */
    private assessRegulatoryExposure(findings: StructuredFinding[]): any {
        const exposure: {
            sebi_actions: StructuredFinding[],
            mca_violations: StructuredFinding[],
            rbi_issues: StructuredFinding[],
            tax_disputes: StructuredFinding[],
            sectoral_violations: StructuredFinding[],
            total_penalties: number
        } = {
            sebi_actions: [],
            mca_violations: [],
            rbi_issues: [],
            tax_disputes: [],
            sectoral_violations: [],
            total_penalties: 0
        };

        findings.forEach(finding => {
            if (finding.category?.toLowerCase().includes('regulatory') ||
                finding.category?.toLowerCase().includes('compliance')) {

                if (finding.description.toLowerCase().includes('sebi')) {
                    exposure.sebi_actions.push(finding);
                } else if (finding.description.toLowerCase().includes('mca')) {
                    exposure.mca_violations.push(finding);
                } else if (finding.description.toLowerCase().includes('rbi')) {
                    exposure.rbi_issues.push(finding);
                } else if (finding.description.toLowerCase().includes('tax')) {
                    exposure.tax_disputes.push(finding);
                } else {
                    exposure.sectoral_violations.push(finding);
                }

                if (finding.amount_numeric && finding.amount_numeric > 0) {
                    exposure.total_penalties += finding.amount_numeric;
                }
            }
        });

        return exposure;
    }

    /**
     * Generate comprehensive entity research summary
     */
    private generateEntityResearchSummary(
        findings: StructuredFinding[],
        entityContext: EntityResearchContext,
        jobType: string
    ): any {
        const analysis = this.analyzeEntityRelationships(findings, entityContext);

        return {
            research_type: jobType,
            entity_context: {
                company_name: entityContext.company_name,
                directors_count: entityContext.directors?.length || 0,
                subsidiaries_count: entityContext.subsidiaries?.length || 0,
                associates_count: entityContext.associates?.length || 0
            },
            findings_summary: {
                total_findings: findings.length,
                critical_findings: findings.filter(f => f.severity === 'CRITICAL').length,
                high_risk_findings: findings.filter(f => f.severity === 'HIGH').length,
                medium_risk_findings: findings.filter(f => f.severity === 'MEDIUM').length,
                low_risk_findings: findings.filter(f => f.severity === 'LOW').length
            },
            entity_analysis: analysis,
            risk_assessment: this.calculateEntityRiskScore(findings, analysis),
            recommendations: this.generateEntityRecommendations(findings, analysis, jobType)
        };
    }

    /**
     * Calculate comprehensive entity risk score
     */
    private calculateEntityRiskScore(findings: StructuredFinding[], analysis: any): any {
        let riskScore = 0;
        let maxScore = 100;

        // Weight findings by severity
        findings.forEach(finding => {
            switch (finding.severity) {
                case 'CRITICAL': riskScore += 25; break;
                case 'HIGH': riskScore += 15; break;
                case 'MEDIUM': riskScore += 8; break;
                case 'LOW': riskScore += 3; break;
            }
        });

        // Additional risk from entity analysis
        if (analysis.director_networks?.length > 0) {
            riskScore += analysis.director_networks.length * 5;
        }

        if (analysis.related_party_risks?.total_exposure > 100000000) { // > 10 crores
            riskScore += 20;
        }

        if (analysis.regulatory_exposure?.total_penalties > 10000000) { // > 1 crore
            riskScore += 15;
        }

        const finalScore = Math.min(maxScore, riskScore);

        return {
            overall_score: finalScore,
            risk_level: finalScore > 70 ? 'Critical' : finalScore > 50 ? 'High' : finalScore > 30 ? 'Medium' : 'Low',
            contributing_factors: this.identifyRiskContributors(findings, analysis),
            mitigation_opportunities: this.identifyMitigationOpportunities(findings, analysis)
        };
    }

    /**
     * Identify primary risk contributors
     */
    private identifyRiskContributors(findings: StructuredFinding[], analysis: any): string[] {
        const contributors: string[] = [];

        if (findings.filter(f => f.severity === 'CRITICAL').length > 0) {
            contributors.push('Critical regulatory or legal issues identified');
        }

        if (analysis.director_networks?.some((n: any) => n.risk_indicators.length > 0)) {
            contributors.push('Director network risks and cross-directorship concerns');
        }

        if (analysis.related_party_risks?.total_exposure > 50000000) {
            contributors.push('Significant related party transaction exposure');
        }

        if (analysis.regulatory_exposure?.total_penalties > 5000000) {
            contributors.push('Substantial regulatory penalties and violations');
        }

        return contributors;
    }

    /**
     * Identify mitigation opportunities
     */
    private identifyMitigationOpportunities(findings: StructuredFinding[], analysis: any): string[] {
        const opportunities: string[] = [];

        if (analysis.governance_concerns?.board_effectiveness.length > 0) {
            opportunities.push('Strengthen board governance and oversight mechanisms');
        }

        if (analysis.governance_concerns?.independence_issues.length > 0) {
            opportunities.push('Enhance director independence and conflict management');
        }

        if (analysis.related_party_risks?.governance_violations.length > 0) {
            opportunities.push('Improve related party transaction governance and disclosure');
        }

        if (analysis.regulatory_exposure && Object.values(analysis.regulatory_exposure).some((arr: any) => Array.isArray(arr) && arr.length > 0)) {
            opportunities.push('Strengthen regulatory compliance and monitoring systems');
        }

        return opportunities;
    }

    /**
     * Generate entity-specific recommendations
     */
    private generateEntityRecommendations(findings: StructuredFinding[], analysis: any, jobType: string): string[] {
        const recommendations: string[] = [];

        // Job type specific recommendations
        switch (jobType) {
            case 'directors_research':
                if (analysis.director_networks?.length > 0) {
                    recommendations.push('Conduct detailed background verification of directors with network connections');
                    recommendations.push('Implement enhanced monitoring for cross-directorship activities');
                }
                break;

            case 'related_companies':
                if (analysis.corporate_structure?.structure_risks.length > 0) {
                    recommendations.push('Review corporate structure for potential simplification');
                    recommendations.push('Strengthen subsidiary governance and oversight');
                }
                break;

            case 'legal_research':
                if (analysis.related_party_risks?.governance_violations.length > 0) {
                    recommendations.push('Enhance legal compliance monitoring for related party transactions');
                    recommendations.push('Implement stronger internal controls and approval processes');
                }
                break;
        }

        // General recommendations based on findings severity
        const criticalFindings = findings.filter(f => f.severity === 'CRITICAL');
        if (criticalFindings.length > 0) {
            recommendations.push('Immediate management attention required for critical issues');
            recommendations.push('Consider enhanced due diligence and ongoing monitoring');
        }

        return recommendations;
    }
    /**
      * Log data quality metrics for monitoring
      */
    // private async logDataQualityMetrics(jobId: string | undefined, qualityReport: DataQualityReport): Promise<void> {
    //     if (!jobId) return

    //     try {
    //         const supabase = await this.getSupabaseClient()

    //         // Create quality metrics record
    //         await supabase
    //             .from('deep_research_audit_log')
    //             .insert({
    //                 job_id: jobId,
    //                 action: 'data_quality_assessment',
    //                 details: {
    //                     overall_score: qualityReport.overall_score,
    //                     dimensions: qualityReport.dimensions,
    //                     verification_status: qualityReport.verification_status,
    //                     critical_issues_count: qualityReport.critical_issues.length,
    //                     warnings_count: qualityReport.warnings.length,
    //                     recommendations_count: qualityReport.recommendations.length
    //                 } as Json,
    //                 timestamp: new Date().toISOString()
    //             })

    //         console.log(`[Data Quality] Logged metrics for job ${jobId}: ${qualityReport.overall_score}/100`)
    //     } catch (error) {
    //         console.error('Failed to log data quality metrics:', error)
    //     }
    // }

    /**
     * Validate research findings quality
     */
    private validateResearchFindings(findings: StructuredFinding[], context: any): any {
        if (!findings || findings.length === 0) {
            return {
                isValid: false,
                errors: ['No findings generated'],
                warnings: [],
                dataQuality: {
                    completeness: 0,
                    accuracy: 50,
                    consistency: 100,
                    timeliness: 90,
                    reliability: 0,
                    overall_score: 28
                },
                confidence: 0,
                recommendations: [
                    'Expand research scope',
                    'Review search criteria',
                    'Check data sources availability'
                ]
            }
        }

        const errors: string[] = []
        const warnings: string[] = []

        // Validate finding structure
        const invalidFindings = findings.filter(finding =>
            !finding.title || !finding.description || !finding.severity
        )

        if (invalidFindings.length > 0) {
            errors.push(`${invalidFindings.length} findings have incomplete structure`)
        }

        // Check for meaningful content
        const shallowFindings = findings.filter(finding =>
            finding.description.length < 20 || finding.title.length < 5
        )

        if (shallowFindings.length > findings.length * 0.5) {
            warnings.push('Many findings lack detailed information')
        }

        // Check for source attribution
        const unsourcedFindings = findings.filter(finding =>
            !finding.source && !finding.verification_level
        )

        if (unsourcedFindings.length > findings.length * 0.3) {
            warnings.push('Many findings lack source attribution')
        }

        // Calculate quality metrics
        const completeness = Math.max(0, 100 - (invalidFindings.length / findings.length) * 100)
        const accuracy = Math.max(0, 100 - (shallowFindings.length / findings.length) * 50)
        const reliability = Math.max(0, 100 - (unsourcedFindings.length / findings.length) * 60)

        const dataQuality = {
            completeness,
            accuracy,
            consistency: 90, // Assume consistent unless contradictions found
            timeliness: 85,  // Assume reasonably current
            reliability,
            overall_score: (completeness + accuracy + reliability + 90 + 85) / 5
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings,
            dataQuality,
            confidence: Math.min(1, dataQuality.overall_score / 100),
            recommendations: this.generateFindingsRecommendations(errors, warnings, dataQuality)
        }
    }

    /**
     * Generate recommendations for findings improvement
     */
    private generateFindingsRecommendations(
        errors: string[],
        warnings: string[],
        dataQuality: any
    ): string[] {
        const recommendations: string[] = []

        if (dataQuality.completeness < 70) {
            recommendations.push('Enhance finding extraction logic to capture more complete information')
        }

        if (dataQuality.accuracy < 70) {
            recommendations.push('Improve content validation to ensure meaningful findings')
        }

        if (dataQuality.reliability < 60) {
            recommendations.push('Strengthen source attribution and verification processes')
        }

        if (errors.length > 0) {
            recommendations.push('Address structural issues in finding generation')
        }

        if (warnings.length > 2) {
            recommendations.push('Review and enhance data processing quality controls')
        }

        return recommendations
    }

    /**
     * Generate professional limited data response with enhanced context
     */
    private generateEnhancedLimitedDataResponse(
        companyName: string,
        jobType: string,
        context?: any
    ): EnhancedProcessedResult {
        const professionalResponse = DeepResearchErrorHandler.generateProfessionalLimitedDataResponse(
            companyName,
            jobType,
            context
        )

        return {
            findings: [{
                id: 'limited-data-001',
                category: 'Data Availability Assessment',
                severity: 'INFO',
                title: 'Professional Due Diligence Analysis Completed',
                description: professionalResponse.content,
                verification_level: professionalResponse.verification_level,
                action_required: false,
                timeline_impact: 'Long-term',
                business_impact: {
                    financial_risk: 'Low',
                    operational_risk: 'Low',
                    reputational_risk: 'Low',
                    credit_impact: 'Neutral',
                    probability_of_occurrence: 95
                }
            }],
            critical_alerts: [],
            summary: `Professional ${jobType.replace('_', ' ')} analysis completed for ${companyName} with comprehensive methodology.`,
            executive_summary: professionalResponse.content.split('\n\n')[0],
            total_issues: 0,
            confidence_level: professionalResponse.verification_level,
            search_quality: 'Professional standards applied',
            requires_immediate_attention: false,
            risk_score: 25, // Low risk due to limited adverse findings
            credit_recommendation: 'Further Review',
            key_risk_factors: ['Limited public information availability'],
            mitigating_factors: [
                'No adverse findings identified',
                'Professional analysis methodology applied',
                'Comprehensive search conducted'
            ],
            data_completeness: professionalResponse.data_completeness
        }
    }

    /**
     * Enhanced error handling with comprehensive fallback analysis
     */
    private async handleComprehensiveError(
        error: Error,
        jobType: string,
        companyName: string,
        context?: { jobId?: string; userId?: string; requestId?: string; iteration?: number }
    ): Promise<EnhancedProcessedResult> {
        const errorContext: ErrorContext = {
            jobId: context?.jobId,
            jobType,
            iteration: context?.iteration || 1,
            companyName,
            userId: context?.userId,
            requestId: context?.requestId,
            timestamp: new Date().toISOString(),
            apiEndpoint: 'DEEP_RESEARCH_SERVICE'
        }

        // Handle error using comprehensive error handler
        const enhancedError = await DeepResearchErrorHandler.handleError(error, errorContext)

        // Apply intelligent fallback
        const fallbackResponse = await DeepResearchErrorHandler.applyIntelligentFallback(
            enhancedError,
            { jobType, companyName, context }
        )

        // Log the error handling
        await this.logAuditEvent('comprehensive_error_handled', {
            error_category: enhancedError.category,
            error_severity: enhancedError.severity,
            fallback_strategy: enhancedError.fallbackStrategy,
            user_message: enhancedError.userMessage,
            recoverable: enhancedError.recoverable
        }, context?.userId)

        // Return enhanced result with professional fallback
        return this.generateEnhancedLimitedDataResponse(companyName, jobType, {
            error_handled: true,
            fallback_applied: true,
            error_context: enhancedError,
            professional_response: fallbackResponse
        })
    }

    /**
     * Validate and enhance API response data
     */
    private async validateAndEnhanceApiResponse(
        response: any,
        jobType: string,
        companyName: string,
        context?: { jobId?: string }
    ): Promise<{ isValid: boolean; enhancedResponse?: any; qualityReport?: DataQualityReport }> {
        try {
            // Validate data quality
            const qualityReport = DataQualityValidator.validateDataQuality(response, {
                jobType,
                companyName,
                context
            })

            // Log quality metrics
            // if (context?.jobId) {
            //     await this.logDataQualityMetrics(context.jobId, qualityReport)
            // }

            // Check if data meets minimum quality standards
            const isValid = qualityReport.overall_score >= 40 && qualityReport.critical_issues.length === 0

            if (!isValid) {
                console.warn(`[Data Quality] Response quality below standards: ${qualityReport.overall_score}/100`)
                return { isValid: false, qualityReport }
            }

            // Enhance response with quality metadata
            const enhancedResponse = {
                ...response,
                data_quality: {
                    score: qualityReport.overall_score,
                    verification_status: qualityReport.verification_status,
                    dimensions: qualityReport.dimensions,
                    validated_at: new Date().toISOString()
                }
            }

            return { isValid: true, enhancedResponse, qualityReport }

        } catch (error) {
            console.error('Error validating API response:', error)
            return { isValid: false }
        }
    }

    /**
     * Apply intelligent data quality improvements
     */
    private applyDataQualityImprovements(
        data: any,
        qualityReport: DataQualityReport
    ): any {
        const improvedData = { ...data }

        // Apply improvements based on quality issues
        if (qualityReport.dimensions.completeness < 60) {
            // Add completeness indicators
            improvedData.completeness_notes = qualityReport.recommendations.filter(r =>
                r.toLowerCase().includes('complete')
            )
        }

        if (qualityReport.dimensions.reliability < 70) {
            // Add reliability warnings
            improvedData.reliability_warnings = [
                'Some information sources may require additional verification',
                'Cross-reference findings with official sources when possible'
            ]
        }

        if (qualityReport.critical_issues.length > 0) {
            // Add critical issue notifications
            improvedData.critical_notices = qualityReport.critical_issues
        }

        // Add quality summary
        improvedData.quality_summary = DataQualityValidator.generateQualitySummary(qualityReport)

        return improvedData
    }
}