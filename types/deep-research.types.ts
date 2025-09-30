// Deep Research Types
// Types for JINA AI deep research functionality

export interface DeepResearchJob {
    id: string
    request_id: string
    user_id: string
    job_type: ResearchJobType
    status: ResearchJobStatus
    progress: number

    // Configuration
    research_scope: ResearchScope
    budget_tokens: number
    max_attempts: number

    // Multi-iteration support
    max_iterations?: number
    current_iteration?: number
    iteration_strategy?: 'single' | 'multi' | 'adaptive'
    consolidation_required?: boolean
    auto_consolidate?: boolean

    // Results
    findings: ResearchFindings
    risk_assessment: RiskAssessment
    recommendations: string[]

    // Metadata
    started_at?: string
    completed_at?: string
    error_message?: string
    tokens_used: number
    api_calls_made: number

    created_at: string
    updated_at: string
}

export interface DeepResearchFinding {
    id: string
    job_id: string
    research_type: string
    query_text: string

    // Results
    success: boolean
    content?: string
    tokens_used: number

    // Metadata
    started_at: string
    completed_at?: string
    error_message?: string
    created_at: string
}

export interface DeepResearchReport {
    id: string
    request_id: string
    user_id: string

    // Report Details
    report_type: string
    title: string
    executive_summary?: string

    // Content
    sections: ReportSections
    findings_summary: FindingsSummary
    risk_level?: 'LOW' | 'MEDIUM' | 'HIGH'
    recommendations: string[]

    // Export Options
    pdf_url?: string
    export_formats: string[]

    // Metadata
    generated_at: string
    expires_at: string
    created_at: string
    updated_at: string
}

export type ResearchJobType =
    | 'full_due_diligence'
    | 'directors_research'
    | 'legal_research'
    | 'negative_news'
    | 'regulatory_research'
    | 'related_companies'

export type ResearchJobStatus =
    | 'pending'
    | 'running'
    | 'completed'
    | 'failed'
    | 'cancelled'

export interface ResearchScope {
    include_directors?: boolean
    include_legal_cases?: boolean
    include_negative_news?: boolean
    include_regulatory_issues?: boolean
    include_related_companies?: boolean
    include_financial_distress?: boolean
    time_period_months?: number
    focus_areas?: string[]
    budget_tokens?: number
    unlimited_budget?: boolean
    comprehensive_analysis?: boolean
    exhaustive_search?: boolean
}

export interface ResearchFindings {
    legitimacy_research?: JinaResearchResult
    directors_research?: JinaResearchResult
    negative_news_research?: JinaResearchResult
    legal_regulatory_research?: JinaResearchResult
    related_companies_research?: JinaResearchResult
    risk_score: number
    credit_recommendation: string
    confidence_level: string
    key_risk_factors: string[]
    data_completeness: number
    findings: any
}

export interface JinaResearchResult {
    success: boolean
    content?: string
    tokens_used: number
    query: string
    error?: string
    iteration?: number
    search_depth?: 'standard' | 'exhaustive' | 'reduced'
    citations?: string[]
    confidence_score?: number

    // Enhanced unlimited budget features
    search_results_count?: number
    entity_analysis?: EntityAnalysis[]
    source_verification?: SourceVerification[]
    comprehensive_coverage?: boolean
    fallback_mode?: boolean
    fallback_attempted?: boolean
}

// Supporting interfaces for enhanced JINA integration
export interface EntityAnalysis {
    entity_name: string
    entity_type: 'company' | 'person' | 'organization'
    relevance_score: number
    findings_count: number
    risk_indicators: string[]
}

export interface SourceVerification {
    source_url: string
    source_type: 'regulatory' | 'news' | 'court' | 'official' | 'other'
    credibility_score: number
    last_updated: string
    verification_status: 'verified' | 'unverified' | 'disputed'
}

export interface RiskAssessment {
    overall_risk_level: 'LOW' | 'MEDIUM' | 'HIGH'
    risk_breakdown: {
        HIGH: string[]
        MEDIUM: string[]
        LOW: string[]
    }
    total_issues: number
    assessment_confidence: 'Low' | 'Medium' | 'High'
}

export interface ReportSections {
    executive_summary?: string
    company_overview?: string
    directors_analysis?: string
    legal_regulatory?: string
    negative_incidents?: string
    related_entities?: string
    risk_assessment?: string
    recommendations?: string
}

export interface FindingsSummary {
    total_findings: number
    high_risk_findings: number
    medium_risk_findings: number
    low_risk_findings: number
    critical_findings: number,
    categories: {
        [category: string]: number
    }
}

// API Request/Response Types
export interface StartResearchJobRequest {
    request_id: string
    job_type: ResearchJobType
    research_scope?: ResearchScope
    budget_tokens?: number
}

export interface StartResearchJobResponse {
    success: boolean
    job_id?: string
    message: string
    estimated_duration_minutes?: number
}

export interface ResearchJobStatusResponse {
    job: DeepResearchJob
    findings: DeepResearchFinding[]
    estimated_completion?: string
}

export interface GenerateReportRequest {
    request_id: string
    job_ids: string[]
    report_type?: string
    title?: string
    include_sections?: string[]
}

export interface GenerateReportResponse {
    success: boolean
    report_id?: string
    message: string
    pdf_url?: string
}

// Research Configuration Presets
export interface ResearchPreset {
    id: string
    name: string
    description: string
    job_type: ResearchJobType
    research_scope: ResearchScope
    estimated_duration_minutes: number
    budget_tokens: number
}

export const RESEARCH_PRESETS: ResearchPreset[] = [
    {
        id: 'comprehensive_directors',
        name: 'Comprehensive Directors Research',
        description: 'Exhaustive background verification of directors, management, and key personnel',
        job_type: 'directors_research',
        research_scope: {
            include_directors: true,
            time_period_months: 60,
            focus_areas: ['criminal_charges', 'regulatory_sanctions', 'bankruptcy', 'professional_history', 'cross_directorships', 'financial_conduct'],
            unlimited_budget: true,
            comprehensive_analysis: true
        },
        estimated_duration_minutes: 8,
        budget_tokens: 0 // Unlimited
    },
    {
        id: 'comprehensive_legal',
        name: 'Comprehensive Legal Research',
        description: 'Exhaustive legal cases, regulatory compliance, and enforcement action analysis',
        job_type: 'legal_research',
        research_scope: {
            include_legal_cases: true,
            include_regulatory_issues: true,
            time_period_months: 60,
            focus_areas: ['court_cases', 'regulatory_violations', 'tax_disputes', 'compliance_issues', 'enforcement_actions', 'insolvency_proceedings'],
            unlimited_budget: true,
            comprehensive_analysis: true
        },
        estimated_duration_minutes: 10,
        budget_tokens: 0 // Unlimited
    },
    {
        id: 'comprehensive_negative_news',
        name: 'Comprehensive Negative News Analysis',
        description: 'Exhaustive adverse media coverage, incidents, and reputational risk analysis',
        job_type: 'negative_news',
        research_scope: {
            include_negative_news: true,
            time_period_months: 36,
            focus_areas: ['project_failures', 'customer_complaints', 'safety_incidents', 'operational_disruptions', 'management_issues', 'financial_distress'],
            unlimited_budget: true,
            comprehensive_analysis: true
        },
        estimated_duration_minutes: 8,
        budget_tokens: 0 // Unlimited
    },
    {
        id: 'comprehensive_regulatory',
        name: 'Comprehensive Regulatory Research',
        description: 'Exhaustive regulatory compliance and enforcement action analysis across all authorities',
        job_type: 'regulatory_research',
        research_scope: {
            include_regulatory_issues: true,
            time_period_months: 60,
            focus_areas: ['SEBI_actions', 'RBI_enforcement', 'tax_disputes', 'environmental_violations', 'industry_compliance', 'sectoral_regulations'],
            unlimited_budget: true,
            comprehensive_analysis: true
        },
        estimated_duration_minutes: 12,
        budget_tokens: 0 // Unlimited
    },
    {
        id: 'comprehensive_due_diligence',
        name: 'Complete Due Diligence Suite',
        description: 'Comprehensive due diligence across all research areas with unlimited depth',
        job_type: 'full_due_diligence',
        research_scope: {
            include_directors: true,
            include_legal_cases: true,
            include_negative_news: true,
            include_regulatory_issues: true,
            include_related_companies: true,
            include_financial_distress: true,
            time_period_months: 60,
            unlimited_budget: true,
            comprehensive_analysis: true,
            exhaustive_search: true
        },
        estimated_duration_minutes: 25,
        budget_tokens: 0 // Unlimited
    }
]

// Enhanced Types for Multi-Iteration Research
export interface ResearchIteration {
    iteration_id: string
    job_id: string
    iteration_number: number
    research_type: ResearchJobType
    started_at: string
    completed_at?: string
    findings: StructuredFinding[]
    confidence_score: number
    data_quality: number
    tokens_used: number
}

export interface StructuredFinding {
    id: string
    category: string
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO'
    title: string
    description: string
    details?: string
    amount?: string
    amount_numeric?: number
    currency?: string
    date?: string
    source?: string
    status?: 'Active' | 'Resolved' | 'Pending' | 'Under Investigation' | 'Unknown'
    business_impact?: BusinessImpact
    verification_level: 'High' | 'Medium' | 'Low'
    related_findings?: string[]
    action_required: boolean
    timeline_impact: 'Immediate' | 'Short-term' | 'Long-term'
    regulatory_implications?: string
    stakeholder_impact?: string
}

export interface BusinessImpact {
    financial_risk: 'High' | 'Medium' | 'Low'
    operational_risk: 'High' | 'Medium' | 'Low'
    reputational_risk: 'High' | 'Medium' | 'Low'
    regulatory_risk: 'High' | 'Medium' | 'Low'
    estimated_financial_exposure?: number
    probability_of_occurrence: number
    timeline_to_resolution?: 'Immediate' | 'Short-term' | 'Long-term' | 'Unknown'
}

export interface ConsolidatedFindings {
    primary_entity: EntityFindings
    directors: DirectorFindings[]
    subsidiaries: SubsidiaryFindings[]
    associates: AssociateFindings[]
    regulatory_history: RegulatoryFindings[]
    litigation_history: LitigationFindings[]
    overall_risk_assessment: ComprehensiveRiskAssessment
}

export interface EntityFindings {
    entity_id: string
    entity_name: string
    entity_type: 'company' | 'director' | 'subsidiary' | 'associate'
    findings: StructuredFinding[]
    risk_assessment: RiskAssessment
    verification_status: 'Verified' | 'Partial' | 'Limited'
    data_completeness: number
}

export interface DirectorFindings extends EntityFindings {
    director_name: string
    designation: string
    professional_background?: string
    other_directorships?: string[]
    regulatory_history?: RegulatoryAction[]
}

export interface SubsidiaryFindings extends EntityFindings {
    relationship_type: string
    ownership_percentage?: number
    operational_status: string
}

export interface AssociateFindings extends EntityFindings {
    relationship_type: string
    business_relationship: string
}

export interface RegulatoryFindings {
    authority: string
    action_type: string
    penalty_amount?: number
    status: string
    date: string
    description: string
}

export interface LitigationFindings {
    case_type: string
    court: string
    case_number?: string
    amount_involved?: number
    status: string
    date_filed: string
    description: string
}

export interface RegulatoryAction {
    authority: string
    action_date: string
    action_type: string
    penalty_amount?: number
    status: string
    description: string
}

export interface ComprehensiveRiskAssessment {
    overall_risk_level: 'Critical' | 'High' | 'Medium' | 'Low'
    primary_risk_factors: string[]
    mitigating_factors: string[]
    data_completeness: number
    confidence_level: 'High' | 'Medium' | 'Low'
    requires_immediate_attention: boolean
    follow_up_required: string[]
}

// Multi-Iteration Management
export interface MultiIterationConfig {
    max_iterations: number
    iteration_delay_seconds: number
    consolidation_strategy: 'merge' | 'latest' | 'comprehensive'
    quality_threshold: number
}

export interface IterationComparison {
    iteration_1: ResearchIteration
    iteration_2: ResearchIteration
    differences: FindingDifference[]
    confidence_improvement: number
    data_quality_improvement: number
}

export interface FindingDifference {
    type: 'new' | 'modified' | 'removed'
    finding_id: string
    description: string
    significance: 'High' | 'Medium' | 'Low'
}

// Multi-Iteration API Types
export interface StartMultiIterationResearchRequest extends StartResearchJobRequest {
    max_iterations?: number
    iteration_strategy?: 'single' | 'multi' | 'adaptive'
    auto_consolidate?: boolean
}

export interface MultiIterationStatusResponse {
    success: boolean
    status?: {
        job_id: string
        job_status: ResearchJobStatus
        iteration_strategy: string
        max_iterations: number
        current_iteration: number
        completed_iterations: number
        failed_iterations: number
        pending_iterations: number
        running_iterations: number
        overall_progress: number
        consolidation_status: 'required' | 'completed' | 'not_required'
        consolidation_data?: any
        iterations: IterationSummary[]
    }
    message: string
}

export interface IterationSummary {
    iteration_number: number
    status: 'pending' | 'running' | 'completed' | 'failed'
    confidence_score?: number
    data_quality_score?: number
    tokens_used?: number
    started_at?: string
    completed_at?: string
    error_message?: string
}

export interface IterationComparisonRequest {
    job_id: string
    iteration_1: number
    iteration_2: number
}

export interface IterationComparisonResponse {
    success: boolean
    comparison?: {
        comparison_id?: string
        differences: FindingDifference[]
        confidence_improvement: number
        data_quality_improvement: number
        new_findings_count: number
        modified_findings_count: number
        removed_findings_count: number
        significance_level: 'High' | 'Medium' | 'Low'
        recommendation: string
    }
    message: string
}

// Database Types for Multi-Iteration System
export interface DeepResearchIteration {
    id: string
    job_id: string
    iteration_number: number
    research_type: ResearchJobType
    research_focus: any
    budget_tokens: number
    search_depth: 'standard' | 'exhaustive' | 'reduced'
    findings: any
    structured_findings: StructuredFinding[]
    confidence_score: number
    data_quality_score: number
    tokens_used: number
    status: 'pending' | 'running' | 'completed' | 'failed'
    started_at?: string
    completed_at?: string
    error_message?: string
    created_at: string
    updated_at: string
}

export interface ResearchEntityAnalysis {
    id: string
    job_id: string
    iteration_id?: string
    entity_type: 'company' | 'director' | 'subsidiary' | 'associate' | 'related_party'
    entity_identifier: string
    entity_name: string
    analysis_results: any
    risk_assessment: any
    business_impact: any
    verification_status: 'verified' | 'partial' | 'unverified' | 'disputed'
    data_completeness: number
    confidence_level: 'high' | 'medium' | 'low'
    sources: string[]
    citations: string[]
    created_at: string
    updated_at: string
}

export interface ResearchFindingsConsolidation {
    id: string
    job_id: string
    consolidation_strategy: 'merge' | 'latest' | 'comprehensive'
    iterations_included: number[]
    consolidated_findings: any
    primary_entity_analysis: any
    directors_analysis: any[]
    subsidiaries_analysis: any[]
    regulatory_findings: any[]
    litigation_findings: any[]
    overall_confidence_score: number
    data_completeness_score: number
    verification_level: 'high' | 'medium' | 'low'
    comprehensive_risk_assessment: any
    requires_immediate_attention: boolean
    follow_up_required: string[]
    consolidated_at: string
    created_at: string
    updated_at: string
}

export interface ResearchIterationComparison {
    id: string
    job_id: string
    iteration_1_id: string
    iteration_2_id: string
    differences: FindingDifference[]
    confidence_improvement: number
    data_quality_improvement: number
    new_findings_count: number
    modified_findings_count: number
    removed_findings_count: number
    significance_level: 'high' | 'medium' | 'low'
    recommendation?: string
    compared_at: string
    created_at: string
}

// Utility Types
export interface ResearchProgress {
    job_id: string
    current_step: string
    progress_percentage: number
    estimated_remaining_minutes: number
    last_update: string
    current_iteration?: number
    total_iterations?: number
}

export interface ResearchError {
    job_id: string
    error_type: 'api_error' | 'timeout' | 'rate_limit' | 'invalid_data'
    error_message: string
    retry_possible: boolean
    occurred_at: string
    iteration_number?: number
}