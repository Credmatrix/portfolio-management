// ============================================================================
// PORTFOLIO CORE TYPES
// ============================================================================

import { AuditorComment, AuditQualification, ChargesInfo, CompanyInfo, Director, DirectorShareholding, EPFORecords, FinancialData, GSTRecords, LegalCase, MSMEPayments, PeerAnalysis, ShareholdingStructure } from "./company.types"
import { Database } from "./database.types"

export type ProcessingStatus = 'submitted' | 'processing' | 'completed' | 'failed'
export type ModelType = 'with_banking' | 'without_banking'
export type IndustryType = Database["public"]["Enums"]["industry_type"] // Will be expanded based on actual industry classifications

// ============================================================================
// MAIN PORTFOLIO COMPANY INTERFACE
// ============================================================================

export interface PortfolioCompany {
    // Core Document Processing Fields
    id: string
    request_id: string
    user_id: string | null
    organization_id: string | null
    original_filename: string
    company_name: string | null
    industry: Database["public"]["Enums"]["industry_type"]
    risk_score: number | null
    risk_grade: string | null
    recommended_limit: number | null
    currency: string | null

    // Processing Status
    status: ProcessingStatus | null
    submitted_at: string | null
    processing_started_at: string | null
    completed_at: string | null

    // File Information
    file_size: number | null
    file_extension: string
    s3_upload_key: string
    s3_folder_path: string
    pdf_filename: string | null
    pdf_s3_key: string | null
    pdf_file_size: number | null

    // Model Information
    model_type: ModelType | null

    // Parameter Counts
    total_parameters: number | null
    available_parameters: number | null
    financial_parameters: number | null
    business_parameters: number | null
    hygiene_parameters: number | null
    banking_parameters: number | null

    // Error Handling
    error_message: string | null
    retry_count: number | null

    // Comprehensive Extracted Data
    extracted_data: any | null

    // Comprehensive Risk Analysis Results
    risk_analysis: RiskAnalysis | null

    // Processing Summary
    processing_summary: any | null

    // Timestamps
    created_at: string | null
    updated_at: string | null

    // ERP Integration Data (Future)
    erp_data?: ERPData,
}

// ============================================================================
// EXTRACTED DATA STRUCTURE
// ============================================================================

export interface ExtractedData {
    // Company Information
    about_company: CompanyInfo

    // Directors Information
    directors: Director[]
    director_shareholding: DirectorShareholding[]

    // Financial Statements (11 years of data)
    financial_data: FinancialData

    // Shareholding Structure
    shareholding: ShareholdingStructure

    // Charges and Legal
    charges: ChargesInfo

    // Compliance Records
    gst_records: GSTRecords
    epfo_records: EPFORecords

    // Legal History
    legal_cases: LegalCase[]

    // Auditor Information
    auditor_comments: AuditorComment[]
    audit_qualifications: AuditQualification[]

    // Peer Comparison
    peer_analysis: PeerAnalysis

    // MSME Supplier Payments
    msme_payments: MSMEPayments
}

// ============================================================================
// RISK ANALYSIS STRUCTURE
// ============================================================================

export interface RiskAnalysis {
    // Overall Risk Assessment
    totalWeightedScore: number
    totalMaxScore: number
    overallPercentage: number
    overallGrade: OverallGrade

    // Model Information
    industryModel: string
    modelVersion: string
    modelId: string
    modelType: string

    // Category-wise Results
    categories: any[]
    financialResult: CategoryResult
    businessResult: CategoryResult
    hygieneResult: CategoryResult
    bankingResult: CategoryResult

    // Detailed Parameter Scores
    allScores: ParameterScore[]
    financialScores: ParameterScore[]
    businessScores: ParameterScore[]
    hygieneScores: ParameterScore[]
    bankingScores: ParameterScore[]

    // Credit Eligibility Assessment
    eligibility: EligibilityAssessment,
    companyData: CompanyInfo,
    years: any
    financialData: any
    latestYear: any
}

// ============================================================================
// SUPPORTING INTERFACES
// ============================================================================

export interface OverallGrade {
    grade: string // e.g., "CM4"
    category: number
    multiplier: any
    color: string
    description: string
}

export interface CategoryResult {
    score: number
    maxScore: number
    weightage: number
    percentage: number
    availableCount: number
    totalCount: number
}

export interface ParameterScore {
    parameter: string
    value: string
    score: number
    maxScore: number
    weightage: number
    available: boolean
    benchmark: string // "Excellent", "Good", "Average", "Poor", "Critical Risk"
    details: any
}

export interface EligibilityAssessment {
    turnoverCr: number
    netWorthCr: number
    baseEligibility: number
    riskScore: number
    riskGrade: string
    riskMultiplier: number
    finalEligibility: number
    existingExposure: number
    incrementalEligibility: number
}

// ============================================================================
// FILTER AND SEARCH INTERFACES
// ============================================================================

export interface FilterCriteria {
    // Risk-based Filters
    risk_grades?: string[] // CM1, CM2, CM3, CM4, CM5, etc.
    risk_score_range?: [number, number] // 0-100 percentage
    overall_grade_categories?: number[] // 1, 2, 3, 4, 5

    // Business Filters
    industries?: any[]
    regions?: string[]
    revenue_range?: [number, number]
    employee_range?: [number, number]
    net_worth_range?: [number, number]

    // Financial Performance Filters
    ebitda_margin_range?: [number, number]
    debt_equity_range?: [number, number]
    current_ratio_range?: [number, number]
    roce_range?: [number, number]
    interest_coverage_range?: [number, number]

    // Compliance Filters
    gst_compliance_status?: string[] // "Regular", "Irregular"
    epfo_compliance_status?: string[]
    audit_qualification_status?: string[] // "Qualified", "Unqualified"

    // Company Type Filters
    listing_status?: string[] // "Listed", "Unlisted"
    company_status?: string[] // "Active", "Inactive"
    model_type?: string[] // "with_banking", "without_banking"

    // Credit Assessment Filters
    eligibility_range?: [number, number]
    recommended_limit_range?: [number, number]

    // Processing Filters
    processing_status?: ProcessingStatus[]
    date_range?: [Date, Date]
    search_query?: string
}

export interface SortCriteria {
    field: string
    direction: 'asc' | 'desc'
}

export interface PaginationParams {
    page: number
    limit: number
    offset?: number
}

// ============================================================================
// PORTFOLIO METRICS AND ANALYTICS
// ============================================================================

export interface PortfolioMetrics {
    total_companies: number
    total_exposure: number
    average_risk_score: number
    risk_distribution: RiskDistribution
    industry_breakdown: IndustryBreakdown
    regional_distribution: RegionalDistribution
    performance_trends: PerformanceTrend[]
    compliance_summary: ComplianceSummary
    eligibility_summary: EligibilitySummary
}

export interface RiskDistribution {
    cm1_count: number
    cm2_count: number
    cm3_count: number
    cm4_count: number
    cm5_count: number
    ungraded_count: number
    total_count: number
    distribution_percentages: Record<string, number>
}

export interface IndustryBreakdown {
    industries: Array<{
        name: string
        count: number
        total_exposure: number
        average_risk_score: number
        risk_distribution: Record<string, number>
    }>
}

export interface RegionalDistribution {
    regions: Array<{
        state: string
        count: number
        total_exposure: number
        average_risk_score: number
        cities: Array<{
            name: string
            count: number
        }>
    }>
}

export interface PerformanceTrend {
    period: string
    metric: string
    value: number
    change_percentage: number
}

export interface ComplianceSummary {
    gst_compliance: {
        compliant: number
        non_compliant: number
        unknown: number
    }
    epfo_compliance: {
        compliant: number
        non_compliant: number
        unknown: number
    }
    audit_status: {
        qualified: number
        unqualified: number
        unknown: number
    }
}

export interface EligibilitySummary {
    total_eligible_amount: number
    average_eligibility: number
    eligibility_distribution: Record<string, number>
    risk_adjusted_exposure: number
}

// ============================================================================
// ERP INTEGRATION TYPES
// ============================================================================

export interface ERPData {
    planned_dso: number
    actual_dso: number
    dpd_aging: DPDAging[]
    external_score: number
    internal_score: number
    last_sync: Date
}

export interface DPDAging {
    bucket: string // "0-30", "31-60", "61-90", "90+"
    amount: number
    percentage: number
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

export interface PortfolioResponse {
    companies: PortfolioCompany[]
    total_count: number
    page: number
    limit: number
    has_next: boolean
    has_previous: boolean
    metrics?: PortfolioMetrics
}

export interface CompanyDetailResponse {
    company: PortfolioCompany
    related_companies?: PortfolioCompany[]
    industry_benchmarks?: IndustryBenchmarks
    credit_management?: any
}

export interface AnalyticsResponse {
    metrics: PortfolioMetrics
    charts_data: Record<string, any>
    generated_at: string
}

export interface IndustryBenchmarks {
    industry: string
    median_risk_score: number
    median_revenue: number
    median_ratios: Record<string, number>
    peer_count: number
}

// ============================================================================
// SEARCH AND EXPORT TYPES
// ============================================================================

export interface SearchResult {
    companies: PortfolioCompany[]
    total_matches: number
    search_time_ms: number
    facets?: SearchFacets
}

export interface SearchFacets {
    industries: Array<{ name: string; count: number }>
    risk_grades: Array<{ grade: string; count: number }>
    regions: Array<{ region: string; count: number }>
    compliance_status: Array<{ status: string; count: number }>
}

export interface ExportOptions {
    format: 'csv' | 'excel' | 'pdf'
    fields: string[]
    filters?: FilterCriteria
    include_analytics?: boolean
}

// ============================================================================
// REAL-TIME MONITORING TYPES
// ============================================================================

export interface PortfolioAlert {
    id: string
    type: 'risk_change' | 'compliance_issue' | 'processing_complete' | 'threshold_breach'
    company_id: string
    company_name: string
    message: string
    severity: 'low' | 'medium' | 'high' | 'critical'
    created_at: string
    acknowledged: boolean
}

export interface SystemHealth {
    status: 'healthy' | 'degraded' | 'down'
    processing_queue_size: number
    average_processing_time: number
    error_rate: number
    last_updated: string
}