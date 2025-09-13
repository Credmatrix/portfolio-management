// Import exact enum types from database schema
import { Database } from './database.types'

export type CollectionFeedbackType = Database['public']['Enums']['collection_feedback_type']
export type SecurityRequirementType = Database['public']['Enums']['security_requirement_type']
export type CreditType = Database['public']['Enums']['credit_type']
export type RepaymentType = Database['public']['Enums']['repayment_type']
export type LpiReceivedType = Database['public']['Enums']['lpi_received_type']

export interface CreditManagement {
    id: string
    request_id: string

    // Credit Approval Details
    actual_credit_limit_approved?: number
    actual_credit_limit_approved_validity?: string
    payment_terms?: string
    security_requirements?: SecurityRequirementType
    ad_hoc_limit?: number
    ad_hoc_limit_validity_date?: string
    limit_validity_date?: string
    credit_type?: CreditType

    // Insurance and Coverage
    insurance_cover?: number
    insurance_coverage_requested_amount?: number
    insurance_validity?: string
    insurance_remarks?: string

    // Repayment and LPI
    repayment?: RepaymentType
    lpi?: boolean
    lpi_received?: LpiReceivedType

    // Collection Feedback
    collection_feedback?: CollectionFeedbackType
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
    security_requirements?: string // Allow string input from forms, will be validated in API
    ad_hoc_limit?: number
    ad_hoc_limit_validity_date?: string
    limit_validity_date?: string
    credit_type?: string // Allow string input from forms, will be validated in API
    insurance_cover?: number
    insurance_coverage_requested_amount?: number
    insurance_validity?: string
    insurance_remarks?: string
    repayment?: string // Allow string input from forms, will be validated in API
    lpi?: boolean
    lpi_received?: string // Allow string input from forms, will be validated in API
    collection_feedback?: string // Allow string input from forms, will be validated in API
    collection_remarks?: string
    case_notes?: string
    general_remarks?: string
    ar_values?: number
    dpd_behavior?: string
    ar_remarks?: string
    dpd_remarks?: string
}