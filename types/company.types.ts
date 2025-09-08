// ============================================================================
// COMPANY INFORMATION TYPES
// ============================================================================

export interface CompanyInfo {
    legal_name: string
    cin: string
    pan: string
    company_status: string
    date_of_incorporation: string
    registered_address: Address
    business_address: Address
    industry: string
    segment: string
    website?: string
    email?: string
    phone?: string
    addresses: {
        registered_address: any
        business_address: any
    }
}

export interface Address {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    pincode: string
    country: string
}

// ============================================================================
// DIRECTORS AND SHAREHOLDING TYPES
// ============================================================================

export interface Director {
    name: string
    din: string
    designation: string
    appointment_date: string
    cessation_date?: string
    shareholding_percentage?: number
}

export interface DirectorShareholding {
    director_name: string
    din: string
    shares_held: number
    percentage: number
    share_type: string
}

export interface ShareholdingStructure {
    promoter_percentage: number
    public_percentage: number
    total_shareholders: number
    shareholding_more_than_5: ShareholdingRecord[]
}

export interface ShareholdingRecord {
    shareholder_name: string
    shares_held: number
    percentage: number
    category: 'Promoter' | 'Public' | 'Institution' | 'Foreign'
}

// ============================================================================
// FINANCIAL DATA TYPES
// ============================================================================

export interface FinancialData {
    balance_sheet: BalanceSheetData
    profit_loss: ProfitLossData
    cash_flow: CashFlowData
    ratios: FinancialRatios
    years: string[]
}

export interface YearlyData {
    [year: string]: number
}

export interface BalanceSheetData {
    equity: {
        share_capital: YearlyData
        reserves_and_surplus: YearlyData
        total_equity: YearlyData
    }
    liabilities: {
        long_term_borrowings: YearlyData
        short_term_borrowings: YearlyData
        trade_payables: YearlyData
        other_current_liabilities: YearlyData
        total_liabilities: YearlyData
    }
    assets: {
        tangible_assets: YearlyData
        intangible_assets: YearlyData
        current_assets: YearlyData
        trade_receivables: YearlyData
        cash_and_bank: YearlyData
        inventory: YearlyData
        total_assets: YearlyData
    }
}

export interface ProfitLossData {
    revenue: YearlyData
    operating_expenses: YearlyData
    ebitda: YearlyData
    depreciation: YearlyData
    ebit: YearlyData
    interest_expense: YearlyData
    pbt: YearlyData
    tax: YearlyData
    pat: YearlyData
}

export interface CashFlowData {
    operating_cash_flow: YearlyData
    investing_cash_flow: YearlyData
    financing_cash_flow: YearlyData
    net_cash_flow: YearlyData
    opening_cash: YearlyData
    closing_cash: YearlyData
}

export interface FinancialRatios {
    profitability: {
        ebitda_margin: YearlyData
        ebit_margin: YearlyData
        net_margin: YearlyData
        return_on_equity: YearlyData
        return_on_assets: YearlyData
        return_on_capital_employed: YearlyData
    }
    liquidity: {
        current_ratio: YearlyData
        quick_ratio: YearlyData
        cash_ratio: YearlyData
    }
    efficiency: {
        inventory_days: YearlyData
        debtor_days: YearlyData
        creditor_days: YearlyData
        cash_conversion_cycle: YearlyData
        asset_turnover: YearlyData
    }
    leverage: {
        debt_equity: YearlyData
        debt_to_total_capital: YearlyData
        interest_coverage: YearlyData
        debt_service_coverage: YearlyData
    }
    growth: {
        revenue_growth: YearlyData
        ebitda_growth: YearlyData
        pat_growth: YearlyData
        asset_growth: YearlyData
    }
}

// ============================================================================
// COMPLIANCE AND LEGAL TYPES
// ============================================================================

export interface GSTRecords {
    active_gstins: GSTRecord[]
    cancelled_gstins: GSTRecord[]
    filing_compliance: GSTFiling[]
}

export interface GSTRecord {
    gstin: string
    status: 'Active' | 'Cancelled' | 'Suspended'
    state: string
    registration_date: string
    latest_filing: string
    compliance_status: 'Regular' | 'Irregular' | 'Non-Filer'
    business_nature: string
    taxpayer_type: string
}

export interface GSTFiling {
    gstin: string
    return_period: string
    filing_date: string
    status: 'Filed' | 'Not Filed' | 'Late Filed'
    delay_days?: number
}

export interface EPFORecords {
    establishments: EPFOEstablishment[]
    total_employees: number
    latest_compliance: EPFOCompliance[]
}

export interface EPFOEstablishment {
    establishment_id: string
    establishment_name: string
    status: 'Active' | 'Inactive'
    employee_count: number
    latest_wage_month: string
    compliance_status: 'Regular' | 'Irregular' | 'Defaulter'
    address: Address
}

export interface EPFOCompliance {
    establishment_id: string
    wage_month: string
    filing_date: string
    status: 'Filed' | 'Not Filed' | 'Late Filed'
    employee_count: number
    wage_amount: number
}

export interface LegalCase {
    case_number: string
    case_type: string
    court: string
    filing_date: string
    status: 'Pending' | 'Disposed' | 'Withdrawn'
    amount_involved?: number
    description: string
}

// ============================================================================
// CHARGES AND SECURITY TYPES
// ============================================================================

export interface ChargesInfo {
    open_charges: Charge[]
    satisfied_charges: Charge[]
    total_charge_amount: number
}

export interface Charge {
    charge_id: string
    holder_name: string
    amount: number
    property_type: string
    charge_type: string
    status: 'Open' | 'Satisfied' | 'Partially Satisfied'
    creation_date: string
    satisfaction_date?: string
    description: string
}

// ============================================================================
// AUDITOR AND AUDIT TYPES
// ============================================================================

export interface AuditorComment {
    year: string
    auditor_name: string
    comment_type: string
    comment: string
    severity: 'Low' | 'Medium' | 'High'
}

export interface AuditQualification {
    year: string
    qualification_type: 'Qualified' | 'Unqualified' | 'Adverse' | 'Disclaimer'
    reason: string
    financial_impact?: number
    auditor_name: string
}

// ============================================================================
// PEER ANALYSIS TYPES
// ============================================================================

export interface PeerAnalysis {
    industry_metrics: IndustryMetrics
    peer_companies: PeerCompany[]
    performance_vs_median: PerformanceComparison
}

export interface IndustryMetrics {
    industry: string
    total_companies: number
    median_revenue: number
    median_ebitda_margin: number
    median_debt_equity: number
    median_current_ratio: number
    median_roe: number
}

export interface PeerCompany {
    company_name: string
    revenue: number
    ebitda_margin: number
    debt_equity: number
    current_ratio: number
    roe: number
    risk_grade?: string
}

export interface PerformanceComparison {
    revenue_percentile: number
    ebitda_margin_percentile: number
    debt_equity_percentile: number
    current_ratio_percentile: number
    roe_percentile: number
    overall_percentile: number
}

// ============================================================================
// MSME PAYMENTS TYPES
// ============================================================================

export interface MSMEPayments {
    total_amount_due: number
    supplier_delays: MSMESupplierDelay[]
    payment_analysis: PaymentAnalysis
}

export interface MSMESupplierDelay {
    supplier_name: string
    amount_due: number
    days_delayed: number
    invoice_date: string
    due_date: string
    payment_status: 'Pending' | 'Paid' | 'Overdue'
}

export interface PaymentAnalysis {
    average_payment_days: number
    total_overdue_amount: number
    overdue_percentage: number
    compliance_score: number
}

// ============================================================================
// COMPANY PROFILE DISPLAY TYPES
// ============================================================================

export interface CompanyProfile {
    basic_info: CompanyInfo
    financial_summary: FinancialSummary
    risk_assessment: RiskSummary
    compliance_status: ComplianceStatus
    key_metrics: KeyMetrics
}

export interface FinancialSummary {
    latest_year: string
    revenue: number
    ebitda: number
    pat: number
    total_assets: number
    net_worth: number
    debt_equity_ratio: number
    current_ratio: number
    revenue_growth_3yr: number
    ebitda_growth_3yr: number
}

export interface RiskSummary {
    overall_grade: string
    risk_score: number
    risk_category: number
    risk_multiplier: number
    recommended_limit: number
    eligibility_amount: number
    key_risk_factors: string[]
}

export interface ComplianceStatus {
    gst_status: 'Compliant' | 'Non-Compliant' | 'Irregular'
    epfo_status: 'Compliant' | 'Non-Compliant' | 'Irregular'
    audit_status: 'Qualified' | 'Unqualified' | 'Adverse'
    legal_issues: number
    open_charges: number
    compliance_score: number
}

export interface KeyMetrics {
    parameter_scores: {
        financial: number
        business: number
        hygiene: number
        banking: number
    }
    benchmarks: {
        industry_rank: number
        peer_comparison: 'Above Average' | 'Average' | 'Below Average'
    }
    trends: {
        risk_trend: 'Improving' | 'Stable' | 'Deteriorating'
        financial_trend: 'Growing' | 'Stable' | 'Declining'
    }
}

// ============================================================================
// FORM AND INPUT TYPES
// ============================================================================

export interface CompanyFormData {
    company_name: string
    industry: string
    registered_address: Address
    business_address?: Address
    website?: string
    email?: string
    phone?: string
}

export interface CompanyUpdateData {
    company_name?: string
    industry?: string
    website?: string
    email?: string
    phone?: string
    notes?: string
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

export interface ValidationResult {
    isValid: boolean
    errors: ValidationError[]
    warnings?: ValidationWarning[]
}

export interface ValidationError {
    field: string
    message: string
    code: string
}

export interface ValidationWarning {
    field: string
    message: string
    suggestion?: string
}

export interface CompanySuggestion {
    suggestion: string;
    company_count: number;
    cin: string;
}

export interface CompanyDetails {
    cin: string;
    company_name: string;
    company_roc_code: string;
    company_category: string;
    company_sub_category: string;
    company_class: string;
    authorized_capital: number;
    paidup_capital: number;
    registration_date: string;
    registered_office_address: string;
    listing_status: string;
    company_status: string;
    company_state_code: string;
    company_type: string;
    nic_code: string;
    industrial_classification: string;
    formatted_capital: {
        authorized: string;
        paidup: string;
    };
    company_age: number;
    company_size: string;
    state_info: {
        code: string;
        name: string;
    };
}