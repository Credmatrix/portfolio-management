import { useState, useCallback, useEffect } from 'react'
import {
    OwnershipStructure,
    EntityType,
    Director,
    Partner,
    Owner,
    Trustee,
    Member,
    ShareholdingPattern
} from '@/types/manual-company.types'
import {
    validateOwnershipStructure,
    calculateTotalPercentage,
    validatePercentageTotal
} from '@/lib/validators/ownership-structure'

interface UseOwnershipStructureProps {
    entityType: EntityType
    initialData?: OwnershipStructure
    onChange?: (data: OwnershipStructure) => void
}

interface ValidationErrors {
    [key: string]: string
}

interface PercentageValidation {
    field: string
    total: number
    isValid: boolean
    message: string
}

export function useOwnershipStructure({
    entityType,
    initialData,
    onChange
}: UseOwnershipStructureProps) {
    const [data, setData] = useState<OwnershipStructure>(
        initialData || { entity_type: entityType }
    )
    const [errors, setErrors] = useState<ValidationErrors>({})
    const [isValid, setIsValid] = useState(false)
    const [percentageValidations, setPercentageValidations] = useState<PercentageValidation[]>([])

    // Update data and trigger validation
    const updateData = useCallback((updates: Partial<OwnershipStructure>) => {
        const newData = { ...data, ...updates }
        setData(newData)

        // Validate the updated data
        const validation = validateOwnershipStructure(newData, entityType)

        // Set validation errors
        const newErrors: ValidationErrors = {}
        if (!validation.success) {
            validation.errors.forEach((error, index) => {
                newErrors[`validation_${index}`] = error
            })
        }

        // Check percentage validations
        const percentageChecks: PercentageValidation[] = []

        if (newData.partners && ['llp', 'partnership_registered', 'partnership_unregistered'].includes(entityType)) {
            const total = calculateTotalPercentage(newData.partners, 'profit_sharing_ratio')
            const isValid = validatePercentageTotal(newData.partners, 'profit_sharing_ratio')
            percentageChecks.push({
                field: 'profit_sharing_ratio',
                total,
                isValid,
                message: isValid ? 'Profit sharing ratios are balanced' : 'Profit sharing ratios must total 100%'
            })

            if (!isValid) {
                newErrors.partners_percentage = 'Profit sharing ratios must total 100%'
            }
        }

        if (newData.shareholding && ['private_limited', 'public_limited'].includes(entityType)) {
            const total = calculateTotalPercentage(newData.shareholding, 'percentage')
            const isValid = validatePercentageTotal(newData.shareholding, 'percentage')
            percentageChecks.push({
                field: 'shareholding_percentage',
                total,
                isValid,
                message: isValid ? 'Shareholding percentages are balanced' : 'Shareholding percentages must total 100%'
            })

            if (!isValid) {
                newErrors.shareholding_percentage = 'Shareholding percentages must total 100%'
            }
        }

        setPercentageValidations(percentageChecks)
        setErrors(newErrors)
        setIsValid(validation.success && Object.keys(newErrors).length === 0)

        // Notify parent component
        if (onChange) {
            onChange(newData)
        }
    }, [data, entityType, onChange])

    // Add director
    const addDirector = useCallback(() => {
        const newDirector: Director = {
            id: `dir_${Date.now()}`,
            name: '',
            designation: '',
            date_of_appointment: '',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }
        const directors = data.directors || []
        updateData({ directors: [...directors, newDirector] })
    }, [data.directors, updateData])

    // Update director
    const updateDirector = useCallback((index: number, updates: Partial<Director>) => {
        const directors = [...(data.directors || [])]
        directors[index] = { ...directors[index], ...updates }
        updateData({ directors })
    }, [data.directors, updateData])

    // Remove director
    const removeDirector = useCallback((index: number) => {
        const directors = (data.directors || []).filter((_, i) => i !== index)
        updateData({ directors })
    }, [data.directors, updateData])

    // Add partner
    const addPartner = useCallback(() => {
        const newPartner: Partner = {
            id: `partner_${Date.now()}`,
            name: '',
            partner_type: 'active',
            capital_contribution: 0,
            profit_sharing_ratio: 0,
            date_of_admission: '',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }
        const partners = data.partners || []
        updateData({ partners: [...partners, newPartner] })
    }, [data.partners, updateData])

    // Update partner
    const updatePartner = useCallback((index: number, updates: Partial<Partner>) => {
        const partners = [...(data.partners || [])]
        partners[index] = { ...partners[index], ...updates }
        updateData({ partners })
    }, [data.partners, updateData])

    // Remove partner
    const removePartner = useCallback((index: number) => {
        const partners = (data.partners || []).filter((_, i) => i !== index)
        updateData({ partners })
    }, [data.partners, updateData])

    // Add owner
    const addOwner = useCallback(() => {
        const newOwner: Owner = {
            id: `owner_${Date.now()}`,
            name: '',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }
        const owners = data.owners || []
        updateData({ owners: [...owners, newOwner] })
    }, [data.owners, updateData])

    // Update owner
    const updateOwner = useCallback((index: number, updates: Partial<Owner>) => {
        const owners = [...(data.owners || [])]
        owners[index] = { ...owners[index], ...updates }
        updateData({ owners })
    }, [data.owners, updateData])

    // Remove owner
    const removeOwner = useCallback((index: number) => {
        const owners = (data.owners || []).filter((_, i) => i !== index)
        updateData({ owners })
    }, [data.owners, updateData])

    // Add trustee
    const addTrustee = useCallback(() => {
        const newTrustee: Trustee = {
            id: `trustee_${Date.now()}`,
            name: '',
            trustee_type: 'ordinary',
            date_of_appointment: '',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }
        const trustees = data.trustees || []
        updateData({ trustees: [...trustees, newTrustee] })
    }, [data.trustees, updateData])

    // Update trustee
    const updateTrustee = useCallback((index: number, updates: Partial<Trustee>) => {
        const trustees = [...(data.trustees || [])]
        trustees[index] = { ...trustees[index], ...updates }
        updateData({ trustees })
    }, [data.trustees, updateData])

    // Remove trustee
    const removeTrustee = useCallback((index: number) => {
        const trustees = (data.trustees || []).filter((_, i) => i !== index)
        updateData({ trustees })
    }, [data.trustees, updateData])

    // Add member
    const addMember = useCallback(() => {
        const newMember: Member = {
            id: `member_${Date.now()}`,
            name: '',
            membership_type: '',
            date_of_admission: '',
            address: {
                address_line_1: '',
                city: '',
                state: '',
                pincode: '',
                country: 'India'
            }
        }
        const members = data.members || []
        updateData({ members: [...members, newMember] })
    }, [data.members, updateData])

    // Update member
    const updateMember = useCallback((index: number, updates: Partial<Member>) => {
        const members = [...(data.members || [])]
        members[index] = { ...members[index], ...updates }
        updateData({ members })
    }, [data.members, updateData])

    // Remove member
    const removeMember = useCallback((index: number) => {
        const members = (data.members || []).filter((_, i) => i !== index)
        updateData({ members })
    }, [data.members, updateData])

    // Add shareholder
    const addShareholder = useCallback(() => {
        const newShareholder: ShareholdingPattern = {
            shareholder_name: '',
            shareholder_type: 'individual',
            shares_held: 0,
            percentage: 0,
            share_class: 'Equity'
        }
        const shareholding = data.shareholding || []
        updateData({ shareholding: [...shareholding, newShareholder] })
    }, [data.shareholding, updateData])

    // Update shareholder
    const updateShareholder = useCallback((index: number, updates: Partial<ShareholdingPattern>) => {
        const shareholding = [...(data.shareholding || [])]
        shareholding[index] = { ...shareholding[index], ...updates }
        updateData({ shareholding })
    }, [data.shareholding, updateData])

    // Remove shareholder
    const removeShareholder = useCallback((index: number) => {
        const shareholding = (data.shareholding || []).filter((_, i) => i !== index)
        updateData({ shareholding })
    }, [data.shareholding, updateData])

    // Reset data
    const resetData = useCallback(() => {
        const resetData = { entity_type: entityType }
        setData(resetData)
        setErrors({})
        setIsValid(false)
        setPercentageValidations([])
        if (onChange) {
            onChange(resetData)
        }
    }, [entityType, onChange])

    // Get completion status
    const getCompletionStatus = useCallback(() => {
        let totalFields = 0
        let completedFields = 0

        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                totalFields = 2 // Directors and shareholding
                if (data.directors && data.directors.length > 0) completedFields++
                if (data.shareholding && data.shareholding.length > 0) completedFields++
                break

            case 'llp':
            case 'partnership_registered':
            case 'partnership_unregistered':
                totalFields = 1 // Partners
                if (data.partners && data.partners.length >= 2) completedFields++
                break

            case 'proprietorship':
                totalFields = 1 // Owner
                if (data.owners && data.owners.length === 1) completedFields++
                break

            case 'huf':
                totalFields = 1 // Owners (family members)
                if (data.owners && data.owners.length > 0) completedFields++
                break

            case 'trust_private':
            case 'trust_public':
                totalFields = 1 // Trustees
                if (data.trustees && data.trustees.length > 0) completedFields++
                break

            case 'society':
                totalFields = 1 // Members
                if (data.members && data.members.length >= 3) completedFields++
                break
        }

        return {
            totalFields,
            completedFields,
            percentage: totalFields > 0 ? (completedFields / totalFields) * 100 : 0,
            isComplete: completedFields === totalFields && isValid
        }
    }, [entityType, data, isValid])

    // Update entity type
    useEffect(() => {
        if (data.entity_type !== entityType) {
            updateData({ entity_type: entityType })
        }
    }, [entityType, data.entity_type, updateData])

    return {
        // Data
        data,
        errors,
        isValid,
        percentageValidations,

        // Actions
        updateData,
        resetData,

        // Director actions
        addDirector,
        updateDirector,
        removeDirector,

        // Partner actions
        addPartner,
        updatePartner,
        removePartner,

        // Owner actions
        addOwner,
        updateOwner,
        removeOwner,

        // Trustee actions
        addTrustee,
        updateTrustee,
        removeTrustee,

        // Member actions
        addMember,
        updateMember,
        removeMember,

        // Shareholder actions
        addShareholder,
        updateShareholder,
        removeShareholder,

        // Status
        completionStatus: getCompletionStatus()
    }
}