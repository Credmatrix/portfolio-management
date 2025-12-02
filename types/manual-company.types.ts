// Enhanced Add Company Workflow - Manual Entry Types
// Supports new non-corporate financial statement format (FY 2024-25)

import { Database } from './database.types'

// Entity Types for Indian Business Entities
export type EntityType =
    | 'private_limited'
    | 'public_limited'
    | 'llp'
    | 'partnership_registered'
    | 'partnership_unregistered'
    | 'proprietorship'
    | 'huf'
    | 'trust_private'
    | 'trust_public'
    | 'society'

export type DataSource = 'manual' | 'api' | 'excel' | 'hybrid'

export type ProcessingStatus = 'draft' | 'submitted' | 'processing' | 'completed' | 'failed'

// ============================================================================
// MAIN MANUAL COMPANY ENTRY INTERFACE
// ============================================================================

export interface ManualCompanyEntry {
    id: string
    request_id: string
    entity_type: EntityType
    data_source: DataSource
    basic_details: BasicCompanyDetails
    ownership_structure?: OwnershipStructure
    financial_data?: NonCorporateFinancialData
    compliance_data?: ComplianceData
    data_completeness_score: number
    data_quality_indicators: DataQualityIndicators
    processing_status: ProcessingStatus
    processing_notes?: string
    created_at: string
    updated_at: string
    created_by: string
    updated_by?: string
}

// ============================================================================
// BASIC COMPANY DETAILS
// ============================================================================

export interface BasicCompanyDetails {
    // Core identification
    legal_name: string
    trade_name?: string
    entity_type: EntityType

    // Registration details
    registration_number?: string
    registration_date?: string
    registration_authority?: string

    // Address information
    registered_address: Address
    business_address?: Address
    correspondence_address?: Address

    // Contact details
    contact_details: ContactDetails

    // Business classification
    industry_classification: IndustryClassification
    business_description?: string
    business_activities?: string[]

    // Additional identifiers
    pan?: string
    tan?: string
    cin?: string
    llpin?: string

    // Operational details
    date_of_commencement?: string
    financial_year_end?: string
    accounting_standards?: 'AS' | 'Ind_AS' | 'IFRS'
}

export interface Address {
    address_line_1: string
    address_line_2?: string
    city: string
    state: string
    pincode: string
    country: string
    landmark?: string
}

export interface ContactDetails {
    primary_phone?: string
    secondary_phone?: string
    primary_email?: string
    secondary_email?: string
    website?: string
    fax?: string
}

export interface IndustryClassification {
    primary_activity: string
    secondary_activities?: string[]
    nic_code?: string
    industry_sector: string
    business_segment?: string
}

// ============================================================================
// OWNERSHIP STRUCTURE (Entity-Specific)
// ============================================================================

export interface OwnershipStructure {
    entity_type: EntityType
    directors?: Director[]
    partners?: Partner[]
    owners?: Owner[]
    trustees?: Trustee[]
    members?: Member[]
    shareholding?: ShareholdingPattern[]
    management_structure?: ManagementStructure
}

export interface Director {
    id: string
    name: string
    designation: string
    din?: string
    pan?: string
    date_of_appointment: string
    date_of_cessation?: string
    address: Address
    qualification?: string
    experience?: string
    other_directorships?: string[]
    shareholding?: DirectorShareholding
}

export interface Partner {
    id: string
    name: string
    partner_type: 'active' | 'sleeping' | 'limited' | 'nominal'
    pan?: string
    capital_contribution: number
    profit_sharing_ratio: number
    date_of_admission: string
    date_of_retirement?: string
    address: Address
    qualification?: string
    experience?: string
}

export interface Owner {
    id: string
    name: string
    relationship?: string // For HUF
    pan?: string
    ownership_percentage?: number
    capital_contribution?: number
    address: Address
    date_of_birth?: string
}

export interface Trustee {
    id: string
    name: string
    trustee_type: 'managing' | 'ordinary'
    pan?: string
    date_of_appointment: string
    date_of_cessation?: string
    address: Address
    qualification?: string
}

export interface Member {
    id: string
    name: string
    membership_type: string
    membership_number?: string
    date_of_admission: string
    date_of_cessation?: string
    address: Address
}

export interface ShareholdingPattern {
    shareholder_name: string
    shareholder_type: 'individual' | 'corporate' | 'institutional'
    shares_held: number
    percentage: number
    share_class: string
    voting_rights?: number
}

export interface DirectorShareholding {
    shares_held: number
    percentage: number
    share_class: string
}

export interface ManagementStructure {
    key_management_personnel: KeyManagementPersonnel[]
    organizational_chart?: string
    reporting_structure?: ReportingStructure[]
}

export interface KeyManagementPersonnel {
    name: string
    designation: string
    pan?: string
    qualification?: string
    experience?: string
    date_of_appointment: string
}

export interface ReportingStructure {
    position: string
    reports_to: string
    department?: string
}

// ============================================================================
// NON-CORPORATE FINANCIAL DATA (New Format FY 2024-25)
// ============================================================================

export interface NonCorporateFinancialData {
    format_version: 'non_corporate_2024'
    currency: string
    financial_years: string[]

    // New vertical balance sheet format
    balance_sheet: VerticalBalanceSheet

    // New P&L format with partners' remuneration
    profit_loss: NonCorporateProfitLoss

    // Optional cash flow statement
    cash_flow?: CashFlowStatement

    // Calculated ratios
    ratios: CalculatedRatios

    // Financial notes and disclosures
    notes?: FinancialNotes[]

    // Validation and quality
    validation_status: 'pending' | 'validated' | 'errors'
    validation_errors: ValidationError[]
}

// New Vertical Balance Sheet Format (as per ICAI Guidance Note)
export interface VerticalBalanceSheet {
    owners_funds_and_liabilities: {
        owners_fund: {
            owners_capital_account: YearlyData
            owners_current_account: YearlyData
            reserves_and_surplus: YearlyData
        }
        non_current_liabilities: {
            long_term_borrowings: YearlyData
            deferred_tax_liabilities: YearlyData
            other_long_term_liabilities: YearlyData
            long_term_provisions: YearlyData
        }
        current_liabilities: {
            short_term_borrowings: YearlyData
            trade_payables: YearlyData
            other_current_liabilities: YearlyData
            short_term_provisions: YearlyData
        }
    }
    assets: {
        non_current_assets: {
            property_plant_equipment: YearlyData
            intangible_assets: YearlyData
            capital_work_in_progress: YearlyData
            intangible_assets_under_development: YearlyData
            non_current_investments: YearlyData
            deferred_tax_assets: YearlyData
            long_term_loans_and_advances: YearlyData
            other_non_current_assets: YearlyData
        }
        current_assets: {
            current_investments: YearlyData
            inventories: YearlyData
            trade_receivables: YearlyData
            cash_and_bank_balances: YearlyData
            short_term_loans_and_advances: YearlyData
            other_current_assets: YearlyData
        }
    }
}

// New P&L Format with Partners' Remuneration
export interface NonCorporateProfitLoss {
    revenue_from_operations: YearlyData
    other_income: YearlyData
    total_income: YearlyData

    expenses: {
        cost_of_materials_consumed: YearlyData
        purchases_of_stock_in_trade: YearlyData
        changes_in_inventories: YearlyData
        employee_benefits_expense: YearlyData
        depreciation_and_amortization: YearlyData
        finance_cost: YearlyData
        other_expenses: YearlyData
        total_expenses: YearlyData
    }

    profit_before_exceptional_extraordinary_partners_remuneration_tax: YearlyData
    exceptional_items: YearlyData
    profit_before_extraordinary_partners_remuneration_tax: YearlyData
    extraordinary_items: YearlyData
    profit_before_partners_remuneration_tax: YearlyData

    // Partners' remuneration (for partnerships)
    partners_remuneration?: YearlyData

    profit_before_tax: YearlyData

    tax_expense: {
        current_tax: YearlyData
        deferred_tax: YearlyData
    }

    profit_from_continuing_operations: YearlyData
    profit_from_discontinuing_operations?: YearlyData
    tax_expense_discontinuing_operations?: YearlyData
    profit_from_discontinuing_operations_after_tax?: YearlyData
    profit_for_period: YearlyData
}

export interface CashFlowStatement {
    operating_activities: {
        profit_before_tax: YearlyData
        adjustments_for: {
            depreciation_amortization: YearlyData
            finance_costs: YearlyData
            investment_income: YearlyData
            other_adjustments: YearlyData
        }
        working_capital_changes: {
            trade_receivables: YearlyData
            inventories: YearlyData
            trade_payables: YearlyData
            other_working_capital: YearlyData
        }
        cash_generated_from_operations: YearlyData
        income_tax_paid: YearlyData
        net_cash_from_operating_activities: YearlyData
    }

    investing_activities: {
        purchase_of_fixed_assets: YearlyData
        sale_of_fixed_assets: YearlyData
        purchase_of_investments: YearlyData
        sale_of_investments: YearlyData
        interest_received: YearlyData
        dividend_received: YearlyData
        net_cash_from_investing_activities: YearlyData
    }

    financing_activities: {
        proceeds_from_borrowings: YearlyData
        repayment_of_borrowings: YearlyData
        interest_paid: YearlyData
        partners_capital_introduced?: YearlyData
        partners_drawings?: YearlyData
        net_cash_from_financing_activities: YearlyData
    }

    net_increase_in_cash: YearlyData
    cash_at_beginning: YearlyData
    cash_at_end: YearlyData
}

export interface CalculatedRatios {
    liquidity_ratios: {
        current_ratio: YearlyData
        quick_ratio: YearlyData
        cash_ratio: YearlyData
    }

    leverage_ratios: {
        debt_equity_ratio: YearlyData
        debt_ratio: YearlyData
        interest_coverage_ratio: YearlyData
    }

    efficiency_ratios: {
        inventory_turnover: YearlyData
        receivables_turnover: YearlyData
        payables_turnover: YearlyData
        asset_turnover: YearlyData
    }

    profitability_ratios: {
        gross_profit_margin: YearlyData
        net_profit_margin: YearlyData
        return_on_assets: YearlyData
        return_on_equity: YearlyData
    }
}

export interface YearlyData {
    [year: string]: number | null
}

export interface FinancialNotes {
    note_number: string
    title: string
    description: string
    amount?: YearlyData
    category: 'accounting_policy' | 'disclosure' | 'contingency' | 'commitment' | 'other'
}

// ============================================================================
// COMPLIANCE DATA
// ============================================================================

export interface ComplianceData {
    gst_data?: GSTComplianceData
    epfo_data?: EPFOComplianceData
    legal_data?: LegalComplianceData
    audit_data?: AuditComplianceData
    regulatory_data?: RegulatoryComplianceData
}

export interface GSTComplianceData {
    registrations: GSTRegistration[]
    filing_compliance: GSTFilingCompliance
    turnover_details?: GSTTurnoverDetails
    input_tax_credit?: InputTaxCreditDetails
}

export interface GSTRegistration {
    gstin: string
    registration_date: string
    registration_status: 'active' | 'cancelled' | 'suspended'
    business_nature: string
    state_code: string
    legal_name: string
    trade_name?: string
    address: Address
}

export interface GSTFilingCompliance {
    gstr1_compliance: FilingComplianceDetails
    gstr3b_compliance: FilingComplianceDetails
    annual_return_compliance?: FilingComplianceDetails
}

export interface FilingComplianceDetails {
    total_returns_due: number
    returns_filed: number
    returns_pending: number
    compliance_percentage: number
    last_filing_date?: string
    filing_history: FilingHistory[]
}

export interface FilingHistory {
    return_period: string
    return_type: string
    due_date: string
    filing_date?: string
    status: 'filed' | 'pending' | 'late'
    delay_days?: number
}

export interface GSTTurnoverDetails {
    annual_turnover: YearlyData
    taxable_turnover: YearlyData
    exempt_turnover: YearlyData
    export_turnover: YearlyData
}

export interface InputTaxCreditDetails {
    itc_availed: YearlyData
    itc_reversed: YearlyData
    itc_utilized: YearlyData
}

export interface EPFOComplianceData {
    establishments: EPFOEstablishment[]
    compliance_summary: EPFOComplianceSummary
}

export interface EPFOEstablishment {
    establishment_code: string
    establishment_name: string
    registration_date: string
    registration_status: 'active' | 'inactive'
    address: Address
    employee_count: number
    active_members: number
    monthly_contribution: number
}

export interface EPFOComplianceSummary {
    total_establishments: number
    active_establishments: number
    total_employees: number
    compliance_percentage: number
    contribution_history: ContributionHistory[]
}

export interface ContributionHistory {
    month_year: string
    employees_covered: number
    contribution_amount: number
    contribution_status: 'paid' | 'pending' | 'defaulted'
    due_date: string
    payment_date?: string
}

export interface LegalComplianceData {
    legal_cases: LegalCase[]
    regulatory_actions: RegulatoryAction[]
    licenses_permits: LicensePermit[]
}

export interface LegalCase {
    case_number: string
    case_type: 'civil' | 'criminal' | 'tax' | 'labor' | 'regulatory' | 'other'
    court_name: string
    filing_date: string
    case_status: 'pending' | 'disposed' | 'settled' | 'withdrawn'
    case_description: string
    amount_involved?: number
    outcome?: string
    impact_assessment: 'low' | 'medium' | 'high'
}

export interface RegulatoryAction {
    action_type: string
    regulatory_body: string
    action_date: string
    description: string
    penalty_amount?: number
    compliance_status: 'complied' | 'pending' | 'disputed'
}

export interface LicensePermit {
    license_type: string
    license_number: string
    issuing_authority: string
    issue_date: string
    expiry_date?: string
    renewal_status: 'current' | 'expired' | 'renewal_pending'
    compliance_status: 'compliant' | 'non_compliant'
}

export interface AuditComplianceData {
    statutory_audit: StatutoryAuditDetails
    internal_audit?: InternalAuditDetails
    tax_audit?: TaxAuditDetails
    other_audits?: OtherAuditDetails[]
}

export interface StatutoryAuditDetails {
    auditor_name: string
    auditor_firm: string
    audit_period: string
    audit_opinion: 'unqualified' | 'qualified' | 'adverse' | 'disclaimer'
    key_audit_matters?: string[]
    management_letter_points?: string[]
    compliance_certificate: boolean
}

export interface InternalAuditDetails {
    internal_auditor: string
    audit_frequency: string
    last_audit_date: string
    audit_scope: string[]
    key_findings?: string[]
}

export interface TaxAuditDetails {
    tax_auditor: string
    audit_period: string
    audit_report_date: string
    key_observations?: string[]
    tax_compliance_certificate: boolean
}

export interface OtherAuditDetails {
    audit_type: string
    auditor_name: string
    audit_date: string
    audit_findings?: string[]
}

export interface RegulatoryComplianceData {
    roc_compliance?: ROCComplianceDetails
    fema_compliance?: FEMAComplianceDetails
    labor_compliance?: LaborComplianceDetails
    environmental_compliance?: EnvironmentalComplianceDetails
}

export interface ROCComplianceDetails {
    annual_filing_status: 'current' | 'delayed' | 'defaulted'
    last_filing_date?: string
    pending_filings: string[]
    compliance_score: number
}

export interface FEMAComplianceDetails {
    fema_registrations: string[]
    compliance_status: 'compliant' | 'non_compliant'
    pending_approvals: string[]
}

export interface LaborComplianceDetails {
    labor_licenses: LicensePermit[]
    compliance_certificates: string[]
    pending_renewals: string[]
}

export interface EnvironmentalComplianceDetails {
    environmental_clearances: string[]
    pollution_certificates: string[]
    compliance_status: 'compliant' | 'non_compliant'
}

// ============================================================================
// DATA QUALITY AND VALIDATION
// ============================================================================

export interface DataQualityIndicators {
    completeness_score: number
    accuracy_score: number
    consistency_score: number
    timeliness_score: number
    overall_quality_score: number

    quality_issues: QualityIssue[]
    improvement_suggestions: ImprovementSuggestion[]

    last_updated: string
    next_review_date?: string
}

export interface QualityIssue {
    category: 'missing_data' | 'inconsistent_data' | 'outdated_data' | 'invalid_format'
    severity: 'low' | 'medium' | 'high' | 'critical'
    field_path: string
    description: string
    suggested_action: string
}

export interface ImprovementSuggestion {
    type: 'api_enhancement' | 'excel_supplement' | 'manual_update' | 'validation_fix'
    priority: 'low' | 'medium' | 'high'
    description: string
    estimated_impact: string
    implementation_effort: 'low' | 'medium' | 'high'
}

export interface ValidationError {
    field: string
    error_type: 'required' | 'format' | 'range' | 'business_rule' | 'consistency'
    message: string
    severity: 'error' | 'warning' | 'info'
    code: string
}

// ============================================================================
// WORKFLOW AND PROCESSING TYPES
// ============================================================================

export interface ProcessingMethod {
    type: 'api' | 'excel' | 'manual'
    eligibility_reason: string
    requirements: string[]
    estimated_time: string
    data_completeness_expected: number
}

export interface WorkflowStep {
    step_number: number
    step_name: string
    step_type: 'search' | 'selection' | 'form' | 'upload' | 'review' | 'processing'
    is_completed: boolean
    is_current: boolean
    is_optional: boolean
    validation_errors: ValidationError[]
}

export interface CompanySearchResult {
    id: string
    name: string
    entity_type: EntityType
    registration_number?: string
    status: string
    data_sources: DataSource[]
    processing_eligibility: ProcessingMethod[]
    match_score: number
    match_reason: string
    additional_info?: {
        legal_name?: string
        trade_name?: string
        pan?: string
        cin?: string
        source?: string
        company_id?: string
        has_comprehensive_data?: boolean
        last_updated?: string
        bid?: string
        entity_category?: string
    }
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

export interface CreateManualEntryRequest {
    entity_type: EntityType
    basic_details: BasicCompanyDetails
    ownership_structure?: Partial<OwnershipStructure>
    financial_data?: Partial<NonCorporateFinancialData>
    compliance_data?: Partial<ComplianceData>
}

export interface UpdateManualEntryRequest {
    basic_details?: Partial<BasicCompanyDetails>
    ownership_structure?: Partial<OwnershipStructure>
    financial_data?: Partial<NonCorporateFinancialData>
    compliance_data?: Partial<ComplianceData>
}

export interface ManualEntryResponse {
    success: boolean
    data?: ManualCompanyEntry
    errors?: ValidationError[]
    warnings?: ValidationError[]
    processing_status?: ProcessingStatus
}

export interface DataEnhancementRequest {
    enhancement_type: 'api_overlay' | 'excel_supplement' | 'manual_update'
    data_source: string
    enhanced_data: any
    conflict_resolution?: 'keep_existing' | 'use_new' | 'merge' | 'manual_review'
}

export interface DataEnhancementResponse {
    success: boolean
    conflicts_detected: ConflictDetails[]
    quality_improvement: QualityImprovement
    enhanced_entry?: ManualCompanyEntry
}

export interface ConflictDetails {
    field_path: string
    existing_value: any
    new_value: any
    conflict_type: 'value_mismatch' | 'format_difference' | 'source_reliability'
    recommended_resolution: string
}

export interface QualityImprovement {
    quality_before: number
    quality_after: number
    improvements: string[]
    remaining_issues: QualityIssue[]
}