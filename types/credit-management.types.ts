export interface CreditManagement {
    id: string
    request_id: string

    // Credit Approval Details
    actual_credit_limit_approved?: number
    payment_terms?: string
    security_requirements?: string
    ad_hoc_limit?: number
    limit_validity_date?: string

    // Insurance and Remarks
    insurance_cover?: number
    insurance_remarks?: string
    general_remarks?: string

    // Collection Feedback
    collection_feedback?: string
    collection_remarks?: string

    // Case Specific Notes
    case_notes?: string

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
    payment_terms?: string
    security_requirements?: string
    ad_hoc_limit?: number
    limit_validity_date?: string
    insurance_cover?: number
    insurance_remarks?: string
    general_remarks?: string
    collection_feedback?: string
    collection_remarks?: string
    case_notes?: string
    ar_values?: number
    dpd_behavior?: string
    ar_remarks?: string
    dpd_remarks?: string
}