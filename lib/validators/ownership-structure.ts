import { z } from 'zod'
import { EntityType } from '@/types/manual-company.types'

// Address validation schema
export const addressSchema = z.object({
    address_line_1: z.string().min(1, 'Address line 1 is required'),
    address_line_2: z.string().optional(),
    city: z.string().min(1, 'City is required'),
    state: z.string().min(1, 'State is required'),
    pincode: z.string().regex(/^[0-9]{6}$/, 'Pincode must be 6 digits'),
    country: z.string().min(1, 'Country is required'),
    landmark: z.string().optional()
})

// Director validation schema
export const directorSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Director name is required'),
    designation: z.string().min(1, 'Designation is required'),
    din: z.string().regex(/^[0-9]{8}$/, 'DIN must be 8 digits').optional(),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
    date_of_appointment: z.string().min(1, 'Date of appointment is required'),
    date_of_cessation: z.string().optional(),
    address: addressSchema,
    qualification: z.string().optional(),
    experience: z.string().optional(),
    other_directorships: z.array(z.string()).optional(),
    shareholding: z.object({
        shares_held: z.number().min(0),
        percentage: z.number().min(0).max(100),
        share_class: z.string()
    }).optional()
})

// Partner validation schema
export const partnerSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Partner name is required'),
    partner_type: z.enum(['active', 'sleeping', 'limited', 'nominal']),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
    capital_contribution: z.number().min(0, 'Capital contribution must be positive'),
    profit_sharing_ratio: z.number().min(0).max(100, 'Profit sharing ratio must be between 0-100'),
    date_of_admission: z.string().min(1, 'Date of admission is required'),
    date_of_retirement: z.string().optional(),
    address: addressSchema,
    qualification: z.string().optional(),
    experience: z.string().optional()
})

// Owner validation schema (for proprietorship and HUF)
export const ownerSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Owner name is required'),
    relationship: z.string().optional(),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
    ownership_percentage: z.number().min(0).max(100).optional(),
    capital_contribution: z.number().min(0).optional(),
    address: addressSchema,
    date_of_birth: z.string().optional()
})

// Trustee validation schema
export const trusteeSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Trustee name is required'),
    trustee_type: z.enum(['managing', 'ordinary']),
    pan: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Invalid PAN format').optional(),
    date_of_appointment: z.string().min(1, 'Date of appointment is required'),
    date_of_cessation: z.string().optional(),
    address: addressSchema,
    qualification: z.string().optional()
})

// Member validation schema (for societies)
export const memberSchema = z.object({
    id: z.string(),
    name: z.string().min(1, 'Member name is required'),
    membership_type: z.string().min(1, 'Membership type is required'),
    membership_number: z.string().optional(),
    date_of_admission: z.string().min(1, 'Date of admission is required'),
    date_of_cessation: z.string().optional(),
    address: addressSchema
})

// Shareholding pattern validation schema
export const shareholdingPatternSchema = z.object({
    shareholder_name: z.string().min(1, 'Shareholder name is required'),
    shareholder_type: z.enum(['individual', 'corporate', 'institutional']),
    shares_held: z.number().min(0, 'Shares held must be positive'),
    percentage: z.number().min(0).max(100, 'Percentage must be between 0-100'),
    share_class: z.string().min(1, 'Share class is required'),
    voting_rights: z.number().min(0).optional()
})

// Main ownership structure validation schema
export const ownershipStructureSchema = z.object({
    entity_type: z.enum([
        'private_limited',
        'public_limited',
        'llp',
        'partnership_registered',
        'partnership_unregistered',
        'proprietorship',
        'huf',
        'trust_private',
        'trust_public',
        'society'
    ]),
    directors: z.array(directorSchema).optional(),
    partners: z.array(partnerSchema).optional(),
    owners: z.array(ownerSchema).optional(),
    trustees: z.array(trusteeSchema).optional(),
    members: z.array(memberSchema).optional(),
    shareholding: z.array(shareholdingPatternSchema).optional()
})

// Entity-specific validation functions
export const validateOwnershipStructure = (data: any, entityType: EntityType) => {
    try {
        // First validate the basic structure
        const validatedData = ownershipStructureSchema.parse(data)

        // Then apply entity-specific validation rules
        const errors: string[] = []

        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                // Must have at least one director
                if (!validatedData.directors || validatedData.directors.length === 0) {
                    errors.push('At least one director is required for companies')
                }

                // Validate shareholding percentages if provided
                if (validatedData.shareholding && validatedData.shareholding.length > 0) {
                    const totalPercentage = validatedData.shareholding.reduce(
                        (sum, sh) => sum + sh.percentage, 0
                    )
                    if (Math.abs(totalPercentage - 100) > 0.01) {
                        errors.push('Shareholding percentages must total 100%')
                    }
                }
                break

            case 'llp':
            case 'partnership_registered':
            case 'partnership_unregistered':
                // Must have at least two partners
                if (!validatedData.partners || validatedData.partners.length < 2) {
                    errors.push('At least two partners are required for partnerships/LLPs')
                }

                // Validate profit sharing ratios
                if (validatedData.partners && validatedData.partners.length > 0) {
                    const totalRatio = validatedData.partners.reduce(
                        (sum, partner) => sum + partner.profit_sharing_ratio, 0
                    )
                    if (Math.abs(totalRatio - 100) > 0.01) {
                        errors.push('Profit sharing ratios must total 100%')
                    }
                }
                break

            case 'proprietorship':
                // Must have exactly one owner
                if (!validatedData.owners || validatedData.owners.length !== 1) {
                    errors.push('Proprietorship must have exactly one owner')
                }
                break

            case 'huf':
                // Must have at least one owner (Karta)
                if (!validatedData.owners || validatedData.owners.length === 0) {
                    errors.push('HUF must have at least one member (Karta)')
                }
                break

            case 'trust_private':
            case 'trust_public':
                // Must have at least one trustee
                if (!validatedData.trustees || validatedData.trustees.length === 0) {
                    errors.push('Trust must have at least one trustee')
                }
                break

            case 'society':
                // Must have at least three members
                if (!validatedData.members || validatedData.members.length < 3) {
                    errors.push('Society must have at least three members')
                }
                break
        }

        return {
            success: errors.length === 0,
            data: validatedData,
            errors
        }

    } catch (error) {
        if (error instanceof z.ZodError) {
            return {
                success: false,
                data: null,
                errors: error.errors.map(err => `${err.path.join('.')}: ${err.message}`)
            }
        }

        return {
            success: false,
            data: null,
            errors: ['Unknown validation error']
        }
    }
}

// Utility functions for percentage calculations
export const calculateTotalPercentage = (items: any[], field: string): number => {
    return items.reduce((sum, item) => sum + (parseFloat(item[field]) || 0), 0)
}

export const validatePercentageTotal = (items: any[], field: string, tolerance = 0.01): boolean => {
    const total = calculateTotalPercentage(items, field)
    return Math.abs(total - 100) <= tolerance
}

// PAN validation utility
export const validatePAN = (pan: string): boolean => {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan)
}

// DIN validation utility
export const validateDIN = (din: string): boolean => {
    const dinRegex = /^[0-9]{8}$/
    return dinRegex.test(din)
}

// Date validation utilities
export const validateDateRange = (startDate: string, endDate?: string): boolean => {
    if (!endDate) return true
    return new Date(startDate) <= new Date(endDate)
}

export const validateMinimumAge = (dateOfBirth: string, minimumAge = 18): boolean => {
    const today = new Date()
    const birthDate = new Date(dateOfBirth)
    const age = today.getFullYear() - birthDate.getFullYear()
    const monthDiff = today.getMonth() - birthDate.getMonth()

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 >= minimumAge
    }

    return age >= minimumAge
}