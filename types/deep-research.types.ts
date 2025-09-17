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
        id: 'quick_directors',
        name: 'Directors Background Check',
        description: 'Quick background verification of key directors and shareholders',
        job_type: 'directors_research',
        research_scope: {
            include_directors: true,
            time_period_months: 36,
            focus_areas: ['criminal_charges', 'regulatory_sanctions', 'bankruptcy']
        },
        estimated_duration_minutes: 3,
        budget_tokens: 8000
    },
    {
        id: 'legal_compliance',
        name: 'Legal & Regulatory Review',
        description: 'Comprehensive legal cases and regulatory compliance check',
        job_type: 'legal_research',
        research_scope: {
            include_legal_cases: true,
            include_regulatory_issues: true,
            time_period_months: 60,
            focus_areas: ['court_cases', 'regulatory_violations', 'tax_disputes']
        },
        estimated_duration_minutes: 4,
        budget_tokens: 12000
    },
    {
        id: 'negative_media',
        name: 'Negative News Monitoring',
        description: 'Recent negative news, incidents, and media coverage analysis',
        job_type: 'negative_news',
        research_scope: {
            include_negative_news: true,
            time_period_months: 24,
            focus_areas: ['project_failures', 'customer_complaints', 'safety_incidents']
        },
        estimated_duration_minutes: 3,
        budget_tokens: 10000
    },
    {
        id: 'related_entities',
        name: 'Related Companies Analysis',
        description: 'Deep dive into group structure and related entity risks',
        job_type: 'related_companies',
        research_scope: {
            include_related_companies: true,
            time_period_months: 36,
            focus_areas: ['subsidiary_risks', 'group_exposure', 'cross_guarantees']
        },
        estimated_duration_minutes: 5,
        budget_tokens: 15000
    },
    {
        id: 'regulatory_research',
        name: 'Regulatory Research',
        description: 'Regulatory compliance and enforcement action analysis',
        job_type: 'regulatory_research',
        research_scope: {
            include_related_companies: true,
            time_period_months: 36,
            focus_areas: ['SEBI actions', 'Tax disputes', 'Environmental violations', 'Industry compliance']
        },
        estimated_duration_minutes: 5,
        budget_tokens: 15000
    },
    {
        id: 'comprehensive',
        name: 'Full Due Diligence',
        description: 'Complete comprehensive due diligence across all areas',
        job_type: 'full_due_diligence',
        research_scope: {
            include_directors: true,
            include_legal_cases: true,
            include_negative_news: true,
            include_regulatory_issues: true,
            include_related_companies: true,
            include_financial_distress: true,
            time_period_months: 60
        },
        estimated_duration_minutes: 15,
        budget_tokens: 25000
    }
]

// Utility Types
export interface ResearchProgress {
    job_id: string
    current_step: string
    progress_percentage: number
    estimated_remaining_minutes: number
    last_update: string
}

export interface ResearchError {
    job_id: string
    error_type: 'api_error' | 'timeout' | 'rate_limit' | 'invalid_data'
    error_message: string
    retry_possible: boolean
    occurred_at: string
}