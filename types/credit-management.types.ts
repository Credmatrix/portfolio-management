export interface CreditManagement {
    id: string
    request_id: string

    // Credit Approval Details
    actual_credit_limit_approved?: number
    actual_credit_limit_approved_validity?: string
    payment_terms?: string
    security_requirements?: string
    ad_hoc_limit?: number
    ad_hoc_limit_validity_date?: string
    limit_validity_date?: string
    credit_type?: string

    // Insurance and Coverage
    insurance_cover?: number
    insurance_coverage_requested_amount?: number
    insurance_validity?: string
    insurance_remarks?: string

    // Repayment and LPI
    repayment?: string
    lpi?: boolean
    lpi_received?: string

    // Collection Feedback
    collection_feedback?: string
    collection_remarks?: string

    // Case Specific Notes
    case_notes?: string
    general_remarks?: string

    // ERP Integration Fields (manual entry for now)
    ar_values?: number
    dpd_behavior?: string
    ar_remarks?: string
    dpd_remarks?: string

    // Audit fields
    created_at: string
    updated_at: string
    created_by?: string
    updated_by?: string
}

export interface CreditManagementFormData {
    actual_credit_limit_approved?: number
    actual_credit_limit_approved_validity?: string
    payment_terms?: string
    security_requirements?: string
    ad_hoc_limit?: number
    ad_hoc_limit_validity_date?: string
    limit_validity_date?: string
    credit_type?: string
    insurance_cover?: number
    insurance_coverage_requested_amount?: number
    insurance_validity?: string
    insurance_remarks?: string
    repayment?: string
    lpi?: boolean
    lpi_received?: string
    collection_feedback?: string
    collection_remarks?: string
    case_notes?: string
    general_remarks?: string
    ar_values?: number
    dpd_behavior?: string
    ar_remarks?: string
    dpd_remarks?: string
}