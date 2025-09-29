import { z } from 'zod'

// Address schema (reused across compliance forms)
const addressSchema = z.object({
    address_line_1: z.string().min(1, 'Address line 1 is required'),
    address_line_2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    country: z.string().default('India'),
    landmark: z.string().optional()
})

// GST Registration Schema
const gstRegistrationSchema = z.object({
    gstin: z.string()
        .regex(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/, 'Invalid GSTIN format')
        .optional()
        .or(z.literal('')),
    registration_date: z.string().optional(),
    registration_status: z.enum(['active', 'cancelled', 'suspended']).default('active'),
    business_nature: z.string().optional(),
    state_code: z.string().optional(),
    legal_name: z.string().optional(),
    trade_name: z.string().optional(),
    address: addressSchema.optional()
})

// Filing History Schema
const filingHistorySchema = z.object({
    return_period: z.string(),
    return_type: z.string(),
    due_date: z.string(),
    filing_date: z.string().optional(),
    status: z.enum(['filed', 'pending', 'late']),
    delay_days: z.number().min(0).optional()
})

// Filing Compliance Details Schema
const filingComplianceDetailsSchema = z.object({
    total_returns_due: z.number().min(0).default(0),
    returns_filed: z.number().min(0).default(0),
    returns_pending: z.number().min(0).default(0),
    compliance_percentage: z.number().min(0).max(100).default(0),
    last_filing_date: z.string().optional(),
    filing_history: z.array(filingHistorySchema).default([])
})

// GST Filing Compliance Schema
const gstFilingComplianceSchema = z.object({
    gstr1_compliance: filingComplianceDetailsSchema,
    gstr3b_compliance: filingComplianceDetailsSchema,
    annual_return_compliance: filingComplianceDetailsSchema.optional()
})

// GST Turnover Details Schema
const gstTurnoverDetailsSchema = z.object({
    annual_turnover: z.record(z.string(), z.number().nullable()).default({}),
    taxable_turnover: z.record(z.string(), z.number().nullable()).default({}),
    exempt_turnover: z.record(z.string(), z.number().nullable()).default({}),
    export_turnover: z.record(z.string(), z.number().nullable()).default({})
})

// Input Tax Credit Details Schema
const inputTaxCreditDetailsSchema = z.object({
    itc_availed: z.record(z.string(), z.number().nullable()).default({}),
    itc_reversed: z.record(z.string(), z.number().nullable()).default({}),
    itc_utilized: z.record(z.string(), z.number().nullable()).default({})
})

// GST Compliance Data Schema
const gstComplianceDataSchema = z.object({
    registrations: z.array(gstRegistrationSchema).default([]),
    filing_compliance: gstFilingComplianceSchema.optional(),
    turnover_details: gstTurnoverDetailsSchema.optional(),
    input_tax_credit: inputTaxCreditDetailsSchema.optional()
})

// EPFO Establishment Schema
const epfoEstablishmentSchema = z.object({
    establishment_code: z.string().optional(),
    establishment_name: z.string().optional(),
    registration_date: z.string().optional(),
    registration_status: z.enum(['active', 'inactive']).default('active'),
    address: addressSchema.optional(),
    employee_count: z.number().min(0).default(0),
    active_members: z.number().min(0).default(0),
    monthly_contribution: z.number().min(0).default(0)
})

// Contribution History Schema
const contributionHistorySchema = z.object({
    month_year: z.string(),
    employees_covered: z.number().min(0),
    contribution_amount: z.number().min(0),
    contribution_status: z.enum(['paid', 'pending', 'defaulted']),
    due_date: z.string(),
    payment_date: z.string().optional()
})

// EPFO Compliance Summary Schema
const epfoComplianceSummarySchema = z.object({
    total_establishments: z.number().min(0).default(0),
    active_establishments: z.number().min(0).default(0),
    total_employees: z.number().min(0).default(0),
    compliance_percentage: z.number().min(0).max(100).default(0),
    contribution_history: z.array(contributionHistorySchema).default([])
})

// EPFO Compliance Data Schema
const epfoComplianceDataSchema = z.object({
    establishments: z.array(epfoEstablishmentSchema).default([]),
    compliance_summary: epfoComplianceSummarySchema.optional()
})

// Legal Case Schema
const legalCaseSchema = z.object({
    case_number: z.string().optional(),
    case_type: z.enum(['civil', 'criminal', 'tax', 'labor', 'regulatory', 'other']).default('civil'),
    court_name: z.string().optional(),
    filing_date: z.string().optional(),
    case_status: z.enum(['pending', 'disposed', 'settled', 'withdrawn']).default('pending'),
    case_description: z.string().optional(),
    amount_involved: z.number().min(0).optional(),
    outcome: z.string().optional(),
    impact_assessment: z.enum(['low', 'medium', 'high']).default('low')
})

// Regulatory Action Schema
const regulatoryActionSchema = z.object({
    action_type: z.string(),
    regulatory_body: z.string(),
    action_date: z.string(),
    description: z.string(),
    penalty_amount: z.number().min(0).optional(),
    compliance_status: z.enum(['complied', 'pending', 'disputed'])
})

// License Permit Schema
const licensePermitSchema = z.object({
    license_type: z.string(),
    license_number: z.string(),
    issuing_authority: z.string(),
    issue_date: z.string(),
    expiry_date: z.string().optional(),
    renewal_status: z.enum(['current', 'expired', 'renewal_pending']),
    compliance_status: z.enum(['compliant', 'non_compliant'])
})

// Legal Compliance Data Schema
const legalComplianceDataSchema = z.object({
    legal_cases: z.array(legalCaseSchema).default([]),
    regulatory_actions: z.array(regulatoryActionSchema).default([]),
    licenses_permits: z.array(licensePermitSchema).default([])
})

// Statutory Audit Details Schema
const statutoryAuditDetailsSchema = z.object({
    auditor_name: z.string().optional(),
    auditor_firm: z.string().optional(),
    audit_period: z.string().optional(),
    audit_opinion: z.enum(['unqualified', 'qualified', 'adverse', 'disclaimer']).default('unqualified'),
    key_audit_matters: z.array(z.string()).default([]),
    management_letter_points: z.array(z.string()).default([]),
    compliance_certificate: z.boolean().default(false)
})

// Internal Audit Details Schema
const internalAuditDetailsSchema = z.object({
    internal_auditor: z.string(),
    audit_frequency: z.string(),
    last_audit_date: z.string(),
    audit_scope: z.array(z.string()),
    key_findings: z.array(z.string()).optional()
})

// Tax Audit Details Schema
const taxAuditDetailsSchema = z.object({
    tax_auditor: z.string(),
    audit_period: z.string(),
    audit_report_date: z.string(),
    key_observations: z.array(z.string()).optional(),
    tax_compliance_certificate: z.boolean().default(false)
})

// Other Audit Details Schema
const otherAuditDetailsSchema = z.object({
    audit_type: z.string(),
    auditor_name: z.string(),
    audit_date: z.string(),
    audit_findings: z.array(z.string()).optional()
})

// Audit Compliance Data Schema
const auditComplianceDataSchema = z.object({
    statutory_audit: statutoryAuditDetailsSchema.optional(),
    internal_audit: internalAuditDetailsSchema.optional(),
    tax_audit: taxAuditDetailsSchema.optional(),
    other_audits: z.array(otherAuditDetailsSchema).default([])
})

// ROC Compliance Details Schema
const rocComplianceDetailsSchema = z.object({
    annual_filing_status: z.enum(['current', 'delayed', 'defaulted']),
    last_filing_date: z.string().optional(),
    pending_filings: z.array(z.string()).default([]),
    compliance_score: z.number().min(0).max(100)
})

// FEMA Compliance Details Schema
const femaComplianceDetailsSchema = z.object({
    fema_registrations: z.array(z.string()).default([]),
    compliance_status: z.enum(['compliant', 'non_compliant']),
    pending_approvals: z.array(z.string()).default([])
})

// Labor Compliance Details Schema
const laborComplianceDetailsSchema = z.object({
    labor_licenses: z.array(licensePermitSchema).default([]),
    compliance_certificates: z.array(z.string()).default([]),
    pending_renewals: z.array(z.string()).default([])
})

// Environmental Compliance Details Schema
const environmentalComplianceDetailsSchema = z.object({
    environmental_clearances: z.array(z.string()).default([]),
    pollution_certificates: z.array(z.string()).default([]),
    compliance_status: z.enum(['compliant', 'non_compliant'])
})

// Regulatory Compliance Data Schema
const regulatoryComplianceDataSchema = z.object({
    roc_compliance: rocComplianceDetailsSchema.optional(),
    fema_compliance: femaComplianceDetailsSchema.optional(),
    labor_compliance: laborComplianceDetailsSchema.optional(),
    environmental_compliance: environmentalComplianceDetailsSchema.optional()
})

// Main Compliance Data Schema
export const complianceDataSchema = z.object({
    gst_data: gstComplianceDataSchema.optional(),
    epfo_data: epfoComplianceDataSchema.optional(),
    legal_data: legalComplianceDataSchema.optional(),
    audit_data: auditComplianceDataSchema.optional(),
    regulatory_data: regulatoryComplianceDataSchema.optional()
})

// Partial schema for form validation
export const partialComplianceDataSchema = complianceDataSchema.partial()

// Business rule validation functions
export const validateComplianceBusinessRules = (data: any, entityType: string): string[] => {
    const errors: string[] = []

    // GST validation
    if (data.gst_data?.registrations) {
        data.gst_data.registrations.forEach((registration: any, index: number) => {
            if (registration.gstin) {
                // Validate GSTIN format
                const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
                if (!gstinRegex.test(registration.gstin)) {
                    errors.push(`Invalid GSTIN format for registration ${index + 1}`)
                }

                // Validate state code consistency
                if (registration.state_code) {
                    const gstinStateCode = registration.gstin.substring(0, 2)
                    if (gstinStateCode !== registration.state_code) {
                        errors.push(`GSTIN state code doesn't match provided state code for registration ${index + 1}`)
                    }
                }
            }

            // Validate registration date
            if (registration.registration_date) {
                const regDate = new Date(registration.registration_date)
                const currentDate = new Date()
                if (regDate > currentDate) {
                    errors.push(`Registration date cannot be in the future for GST registration ${index + 1}`)
                }
            }
        })
    }

    // EPFO validation
    if (data.epfo_data?.establishments) {
        data.epfo_data.establishments.forEach((establishment: any, index: number) => {
            // Validate employee counts
            if (establishment.employee_count && establishment.active_members) {
                if (establishment.active_members > establishment.employee_count) {
                    errors.push(`Active members cannot exceed total employees for establishment ${index + 1}`)
                }
            }

            // Validate establishment code format (basic validation)
            if (establishment.establishment_code && establishment.establishment_code.length < 10) {
                errors.push(`Establishment code appears to be invalid for establishment ${index + 1}`)
            }
        })
    }

    // Legal cases validation
    if (data.legal_data?.legal_cases) {
        data.legal_data.legal_cases.forEach((legalCase: any, index: number) => {
            // Validate filing date
            if (legalCase.filing_date) {
                const filingDate = new Date(legalCase.filing_date)
                const currentDate = new Date()
                if (filingDate > currentDate) {
                    errors.push(`Case filing date cannot be in the future for case ${index + 1}`)
                }
            }

            // Validate amount involved
            if (legalCase.amount_involved && legalCase.amount_involved < 0) {
                errors.push(`Amount involved cannot be negative for case ${index + 1}`)
            }

            // Validate outcome requirement for closed cases
            if (['disposed', 'settled', 'withdrawn'].includes(legalCase.case_status) && !legalCase.outcome) {
                errors.push(`Outcome is required for closed case ${index + 1}`)
            }
        })
    }

    // Audit validation based on entity type
    const auditRequiredEntities = ['private_limited', 'public_limited', 'llp']
    if (auditRequiredEntities.includes(entityType)) {
        if (!data.audit_data?.statutory_audit?.auditor_name) {
            errors.push('Statutory audit details are required for this entity type')
        }
    }

    // Cross-validation between different compliance areas
    if (data.gst_data?.registrations?.length > 0 && data.epfo_data?.establishments?.length > 0) {
        // Check if business addresses are consistent
        const gstAddresses = data.gst_data.registrations
            .filter((reg: any) => reg.address)
            .map((reg: any) => `${reg.address.city}, ${reg.address.state}`)

        const epfoAddresses = data.epfo_data.establishments
            .filter((est: any) => est.address)
            .map((est: any) => `${est.address.city}, ${est.address.state}`)

        const hasCommonLocation = gstAddresses.some((gstAddr: string) =>
            epfoAddresses.some((epfoAddr: string) => gstAddr === epfoAddr)
        )

        if (!hasCommonLocation && gstAddresses.length > 0 && epfoAddresses.length > 0) {
            errors.push('GST and EPFO registrations should have at least one common business location')
        }
    }

    return errors
}

// Utility functions for compliance scoring
export const calculateComplianceScore = (data: any): number => {
    let totalScore = 0
    let maxScore = 0

    // GST compliance scoring
    if (data.gst_data?.registrations?.length > 0) {
        maxScore += 25
        let gstScore = 0

        data.gst_data.registrations.forEach((registration: any) => {
            if (registration.gstin) gstScore += 5
            if (registration.registration_status === 'active') gstScore += 5
            if (registration.legal_name) gstScore += 3
            if (registration.address) gstScore += 2
        })

        if (data.gst_data.filing_compliance) {
            gstScore += Math.min(10, data.gst_data.filing_compliance.gstr3b_compliance?.compliance_percentage / 10 || 0)
        }

        totalScore += Math.min(25, gstScore)
    }

    // EPFO compliance scoring
    if (data.epfo_data?.establishments?.length > 0) {
        maxScore += 25
        let epfoScore = 0

        data.epfo_data.establishments.forEach((establishment: any) => {
            if (establishment.establishment_code) epfoScore += 5
            if (establishment.registration_status === 'active') epfoScore += 5
            if (establishment.employee_count > 0) epfoScore += 3
            if (establishment.address) epfoScore += 2
        })

        if (data.epfo_data.compliance_summary?.compliance_percentage) {
            epfoScore += Math.min(10, data.epfo_data.compliance_summary.compliance_percentage / 10)
        }

        totalScore += Math.min(25, epfoScore)
    }

    // Legal compliance scoring
    maxScore += 25
    let legalScore = 25 // Start with full score, deduct for issues

    if (data.legal_data?.legal_cases?.length > 0) {
        data.legal_data.legal_cases.forEach((legalCase: any) => {
            if (legalCase.impact_assessment === 'high') legalScore -= 10
            else if (legalCase.impact_assessment === 'medium') legalScore -= 5
            else if (legalCase.impact_assessment === 'low') legalScore -= 2

            if (legalCase.case_status === 'pending') legalScore -= 3
        })
    }

    totalScore += Math.max(0, legalScore)

    // Audit compliance scoring
    maxScore += 25
    let auditScore = 0

    if (data.audit_data?.statutory_audit) {
        const audit = data.audit_data.statutory_audit
        if (audit.auditor_name) auditScore += 5
        if (audit.audit_opinion === 'unqualified') auditScore += 10
        else if (audit.audit_opinion === 'qualified') auditScore += 5
        if (audit.compliance_certificate) auditScore += 5
        if (audit.key_audit_matters?.length === 0) auditScore += 5
    }

    totalScore += auditScore

    return maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0
}

// Export types
export type ComplianceData = z.infer<typeof complianceDataSchema>
export type PartialComplianceData = z.infer<typeof partialComplianceDataSchema>
export type GSTRegistration = z.infer<typeof gstRegistrationSchema>
export type EPFOEstablishment = z.infer<typeof epfoEstablishmentSchema>
export type LegalCase = z.infer<typeof legalCaseSchema>
export type StatutoryAuditDetails = z.infer<typeof statutoryAuditDetailsSchema>
export type Address = z.infer<typeof addressSchema>