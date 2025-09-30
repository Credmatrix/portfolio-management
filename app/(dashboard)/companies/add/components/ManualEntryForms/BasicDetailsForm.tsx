'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Textarea'
import { Select } from '@/components/ui/Select'
import { Card, CardContent } from '@/components/ui/Card'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { EntityType, CompanySearchResult, ValidationError, Address } from '@/types/manual-company.types'
import { useDebounce } from '@/lib/hooks/useDebounce'
import {
    Info,
    MapPin,
    Building2,
    Phone,
    Mail,
    Globe,
    AlertCircle,
    CheckCircle,
    Search,
    Copy,
    Loader2,
    AlertTriangle
} from 'lucide-react'

interface BasicDetailsFormProps {
    entityType: EntityType
    data: any
    onChange: (data: any) => void
    selectedCompany?: CompanySearchResult | null
    onValidationChange?: (errors: ValidationError[]) => void
}

interface AddressSuggestion {
    formatted_address: string
    components: {
        address_line_1: string
        address_line_2?: string
        city: string
        state: string
        pincode: string
        country: string
    }
}

interface IndustryOption {
    code: string
    name: string
    description: string
    category: string
}

export function BasicDetailsForm({
    entityType,
    data = {},
    onChange,
    selectedCompany,
    onValidationChange
}: BasicDetailsFormProps) {
    const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
    const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([])
    const [isLoadingAddressSuggestions, setIsLoadingAddressSuggestions] = useState(false)
    const [addressQuery, setAddressQuery] = useState('')
    const [showAddressSuggestions, setShowAddressSuggestions] = useState(false)
    const [industryOptions] = useState<IndustryOption[]>([
        { code: 'MFG', name: 'Manufacturing', description: 'Production and manufacturing activities', category: 'Primary' },
        { code: 'SVC', name: 'Services', description: 'Professional and business services', category: 'Tertiary' },
        { code: 'TRD', name: 'Trading', description: 'Wholesale and retail trading', category: 'Secondary' },
        { code: 'CON', name: 'Construction', description: 'Construction and infrastructure', category: 'Secondary' },
        { code: 'AGR', name: 'Agriculture', description: 'Agriculture and allied activities', category: 'Primary' },
        { code: 'TEC', name: 'Technology', description: 'IT and technology services', category: 'Tertiary' },
        { code: 'HLT', name: 'Healthcare', description: 'Healthcare and medical services', category: 'Tertiary' },
        { code: 'EDU', name: 'Education', description: 'Educational services and training', category: 'Tertiary' },
        { code: 'FIN', name: 'Finance', description: 'Financial services and banking', category: 'Tertiary' },
        { code: 'REA', name: 'Real Estate', description: 'Real estate and property development', category: 'Secondary' },
        { code: 'TRA', name: 'Transportation', description: 'Transportation and logistics', category: 'Tertiary' },
        { code: 'RET', name: 'Retail', description: 'Retail and consumer goods', category: 'Secondary' },
        { code: 'ENE', name: 'Energy', description: 'Energy and utilities', category: 'Primary' },
        { code: 'TEL', name: 'Telecommunications', description: 'Telecom and communication services', category: 'Tertiary' },
        { code: 'OTH', name: 'Other', description: 'Other business activities', category: 'Other' }
    ])

    const debouncedAddressQuery = useDebounce(addressQuery, 500)

    // Real-time validation
    useEffect(() => {
        const errors = validateFormData(data, entityType)
        setValidationErrors(errors)
        if (onValidationChange) {
            onValidationChange(errors)
        }
    }, [data, entityType, onValidationChange])

    // Address autocomplete
    useEffect(() => {
        if (debouncedAddressQuery.length >= 3) {
            fetchAddressSuggestions(debouncedAddressQuery)
        } else {
            setAddressSuggestions([])
            setShowAddressSuggestions(false)
        }
    }, [debouncedAddressQuery])

    const validateFormData = (formData: any, entityType: EntityType): ValidationError[] => {
        const errors: ValidationError[] = []

        // Required field validation
        if (!formData.legal_name?.trim()) {
            errors.push({
                field: 'legal_name',
                error_type: 'required',
                message: 'Legal name is required',
                severity: 'error',
                code: 'REQUIRED_FIELD'
            })
        }

        // Entity-specific validation
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                if (!formData.cin?.trim()) {
                    errors.push({
                        field: 'cin',
                        error_type: 'required',
                        message: 'CIN is required for companies',
                        severity: 'error',
                        code: 'REQUIRED_FIELD'
                    })
                } else if (!/^[A-Z]\d{5}[A-Z]{2}\d{4}[A-Z]{3}\d{6}$/.test(formData.cin)) {
                    errors.push({
                        field: 'cin',
                        error_type: 'format',
                        message: 'Invalid CIN format',
                        severity: 'error',
                        code: 'INVALID_FORMAT'
                    })
                }
                break

            case 'llp':
                if (!formData.llpin?.trim()) {
                    errors.push({
                        field: 'llpin',
                        error_type: 'required',
                        message: 'LLPIN is required for LLPs',
                        severity: 'error',
                        code: 'REQUIRED_FIELD'
                    })
                } else if (!/^[A-Z]{3}-\d{4}$/.test(formData.llpin)) {
                    errors.push({
                        field: 'llpin',
                        error_type: 'format',
                        message: 'Invalid LLPIN format (should be AAA-1234)',
                        severity: 'error',
                        code: 'INVALID_FORMAT'
                    })
                }
                break
        }

        // PAN validation
        if (formData.pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(formData.pan)) {
            errors.push({
                field: 'pan',
                error_type: 'format',
                message: 'Invalid PAN format',
                severity: 'error',
                code: 'INVALID_FORMAT'
            })
        }

        // Address validation
        if (!formData.registered_address?.address_line_1?.trim()) {
            errors.push({
                field: 'registered_address.address_line_1',
                error_type: 'required',
                message: 'Address line 1 is required',
                severity: 'error',
                code: 'REQUIRED_FIELD'
            })
        }

        if (!formData.registered_address?.city?.trim()) {
            errors.push({
                field: 'registered_address.city',
                error_type: 'required',
                message: 'City is required',
                severity: 'error',
                code: 'REQUIRED_FIELD'
            })
        }

        if (!formData.registered_address?.state?.trim()) {
            errors.push({
                field: 'registered_address.state',
                error_type: 'required',
                message: 'State is required',
                severity: 'error',
                code: 'REQUIRED_FIELD'
            })
        }

        if (!formData.registered_address?.pincode?.trim()) {
            errors.push({
                field: 'registered_address.pincode',
                error_type: 'required',
                message: 'PIN code is required',
                severity: 'error',
                code: 'REQUIRED_FIELD'
            })
        } else if (!/^\d{6}$/.test(formData.registered_address.pincode)) {
            errors.push({
                field: 'registered_address.pincode',
                error_type: 'format',
                message: 'PIN code must be 6 digits',
                severity: 'error',
                code: 'INVALID_FORMAT'
            })
        }

        // Email validation
        if (formData.contact_details?.primary_email &&
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_details.primary_email)) {
            errors.push({
                field: 'contact_details.primary_email',
                error_type: 'format',
                message: 'Invalid email format',
                severity: 'error',
                code: 'INVALID_FORMAT'
            })
        }

        // Phone validation
        if (formData.contact_details?.primary_phone &&
            !/^(\+91|91)?[6-9]\d{9}$/.test(formData.contact_details.primary_phone.replace(/\s|-/g, ''))) {
            errors.push({
                field: 'contact_details.primary_phone',
                error_type: 'format',
                message: 'Invalid phone number format',
                severity: 'warning',
                code: 'INVALID_FORMAT'
            })
        }

        return errors
    }

    const fetchAddressSuggestions = async (query: string) => {
        setIsLoadingAddressSuggestions(true)
        try {
            // Mock address suggestions - in real implementation, integrate with Google Places API or similar
            const mockSuggestions: AddressSuggestion[] = [
                {
                    formatted_address: `${query}, Mumbai, Maharashtra 400001`,
                    components: {
                        address_line_1: query,
                        city: 'Mumbai',
                        state: 'Maharashtra',
                        pincode: '400001',
                        country: 'India'
                    }
                },
                {
                    formatted_address: `${query}, Delhi, Delhi 110001`,
                    components: {
                        address_line_1: query,
                        city: 'Delhi',
                        state: 'Delhi',
                        pincode: '110001',
                        country: 'India'
                    }
                }
            ]

            setAddressSuggestions(mockSuggestions)
            setShowAddressSuggestions(true)
        } catch (error) {
            console.error('Error fetching address suggestions:', error)
        } finally {
            setIsLoadingAddressSuggestions(false)
        }
    }

    const handleChange = (field: string, value: any) => {
        onChange({
            ...data,
            [field]: value
        })
    }

    const handleAddressChange = (addressType: 'registered' | 'business', field: string, value: string) => {
        const currentAddress = data[`${addressType}_address`] || {}
        const updatedAddress = {
            ...currentAddress,
            [field]: value
        }

        onChange({
            ...data,
            [`${addressType}_address`]: updatedAddress
        })

        // Update address query for autocomplete
        if (addressType === 'registered' && field === 'address_line_1') {
            setAddressQuery(value)
        }
    }

    const handleAddressSuggestionSelect = (suggestion: AddressSuggestion) => {
        const updatedData = {
            ...data,
            registered_address: {
                ...data.registered_address,
                ...suggestion.components
            }
        }
        onChange(updatedData)
        setShowAddressSuggestions(false)
        setAddressQuery('')
    }

    const copyRegisteredToBusiness = () => {
        if (data.registered_address) {
            onChange({
                ...data,
                business_address: { ...data.registered_address }
            })
        }
    }

    const getFieldError = (fieldPath: string): ValidationError | undefined => {
        return validationErrors.find(error => error.field === fieldPath)
    }

    const getFieldVariant = (fieldPath: string): 'default' => {
        return 'default'
    }

    const getEntitySpecificFields = () => {
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    CIN *
                                    {getFieldError('cin') && (
                                        <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                    )}
                                </label>
                                <Input
                                    type="text"
                                    placeholder="L12345MH2020PTC123456"
                                    value={data.cin || ''}
                                    onChange={(e) => handleChange('cin', e.target.value.toUpperCase())}
                                    maxLength={21}
                                    variant={getFieldVariant('cin')}
                                />
                                {getFieldError('cin') ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {getFieldError('cin')?.message}
                                    </p>
                                ) : (
                                    <p className="text-xs text-neutral-500 mt-1">21-character Corporate Identity Number</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Date of Incorporation
                                </label>
                                <Input
                                    type="date"
                                    value={data.registration_date || ''}
                                    onChange={(e) => handleChange('registration_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Authorized Capital (₹)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="1000000"
                                    value={data.authorized_capital || ''}
                                    onChange={(e) => handleChange('authorized_capital', parseFloat(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Paid-up Capital (₹)
                                </label>
                                <Input
                                    type="number"
                                    placeholder="500000"
                                    value={data.paid_up_capital || ''}
                                    onChange={(e) => handleChange('paid_up_capital', parseFloat(e.target.value) || 0)}
                                    min="0"
                                />
                            </div>
                        </div>
                    </div>
                )

            case 'llp':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    LLPIN *
                                    {getFieldError('llpin') && (
                                        <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                    )}
                                </label>
                                <Input
                                    type="text"
                                    placeholder="AAB-1234"
                                    value={data.llpin || ''}
                                    onChange={(e) => handleChange('llpin', e.target.value.toUpperCase())}
                                    maxLength={8}
                                    variant={getFieldVariant('llpin')}
                                />
                                {getFieldError('llpin') ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {getFieldError('llpin')?.message}
                                    </p>
                                ) : (
                                    <p className="text-xs text-neutral-500 mt-1">Limited Liability Partnership Identification Number</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Date of Incorporation
                                </label>
                                <Input
                                    type="date"
                                    value={data.registration_date || ''}
                                    onChange={(e) => handleChange('registration_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Total Contribution (₹)
                            </label>
                            <Input
                                type="number"
                                placeholder="1000000"
                                value={data.total_contribution || ''}
                                onChange={(e) => handleChange('total_contribution', parseFloat(e.target.value) || 0)}
                                min="0"
                            />
                        </div>
                    </div>
                )

            case 'partnership_registered':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Registration Number
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Partnership registration number"
                                    value={data.registration_number || ''}
                                    onChange={(e) => handleChange('registration_number', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Registration Date
                                </label>
                                <Input
                                    type="date"
                                    value={data.registration_date || ''}
                                    onChange={(e) => handleChange('registration_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Partnership Deed Date
                            </label>
                            <Input
                                type="date"
                                value={data.partnership_deed_date || ''}
                                onChange={(e) => handleChange('partnership_deed_date', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                )

            case 'partnership_unregistered':
                return (
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Partnership Deed Date
                        </label>
                        <Input
                            type="date"
                            value={data.partnership_deed_date || ''}
                            onChange={(e) => handleChange('partnership_deed_date', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                        />
                        <p className="text-xs text-neutral-500 mt-1">Date when partnership deed was executed</p>
                    </div>
                )

            case 'proprietorship':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Proprietor Name
                            </label>
                            <Input
                                type="text"
                                placeholder="Full name of proprietor"
                                value={data.proprietor_name || ''}
                                onChange={(e) => handleChange('proprietor_name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Date of Commencement
                            </label>
                            <Input
                                type="date"
                                value={data.date_of_commencement || ''}
                                onChange={(e) => handleChange('date_of_commencement', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                )

            case 'huf':
                return (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Karta Name
                            </label>
                            <Input
                                type="text"
                                placeholder="Name of the Karta"
                                value={data.karta_name || ''}
                                onChange={(e) => handleChange('karta_name', e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                HUF Formation Date
                            </label>
                            <Input
                                type="date"
                                value={data.formation_date || ''}
                                onChange={(e) => handleChange('formation_date', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                )

            case 'trust_private':
            case 'trust_public':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Trust Registration Number
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Trust registration number"
                                    value={data.registration_number || ''}
                                    onChange={(e) => handleChange('registration_number', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Registration Date
                                </label>
                                <Input
                                    type="date"
                                    value={data.registration_date || ''}
                                    onChange={(e) => handleChange('registration_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Trust Deed Date
                            </label>
                            <Input
                                type="date"
                                value={data.trust_deed_date || ''}
                                onChange={(e) => handleChange('trust_deed_date', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                    </div>
                )

            case 'society':
                return (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Society Registration Number
                                </label>
                                <Input
                                    type="text"
                                    placeholder="Society registration number"
                                    value={data.registration_number || ''}
                                    onChange={(e) => handleChange('registration_number', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    Registration Date
                                </label>
                                <Input
                                    type="date"
                                    value={data.registration_date || ''}
                                    onChange={(e) => handleChange('registration_date', e.target.value)}
                                    max={new Date().toISOString().split('T')[0]}
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Society Type
                            </label>
                            <Select
                                value={data.society_type || ''}
                                onChange={(e) => handleChange('society_type', e.target.value)}
                            >
                                <option value="">Select Society Type</option>
                                <option value="charitable">Charitable Society</option>
                                <option value="educational">Educational Society</option>
                                <option value="religious">Religious Society</option>
                                <option value="cultural">Cultural Society</option>
                                <option value="sports">Sports Society</option>
                                <option value="other">Other</option>
                            </Select>
                        </div>
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <div className="space-y-6">
            {/* Pre-filled Company Info */}
            {selectedCompany && (
                <Alert variant="info">
                    <Info className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Pre-filled Information</p>
                        <p className="text-sm mt-1">
                            Some fields have been pre-filled based on your search. You can modify them as needed.
                        </p>
                    </div>
                </Alert>
            )}

            {/* Basic Company Information */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <h5 className="font-medium text-neutral-90">Company Information</h5>

                    <div className="grid grid-cols-1 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Legal Name *
                                {getFieldError('legal_name') && (
                                    <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                )}
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter the legal name of the company"
                                value={data.legal_name || selectedCompany?.name || ''}
                                onChange={(e) => handleChange('legal_name', e.target.value)}
                                variant={getFieldVariant('legal_name')}
                                required
                            />
                            {getFieldError('legal_name') && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {getFieldError('legal_name')?.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Trade Name
                            </label>
                            <Input
                                type="text"
                                placeholder="Trading or brand name (if different)"
                                value={data.trade_name || ''}
                                onChange={(e) => handleChange('trade_name', e.target.value)}
                            />
                        </div>

                        {/* Entity-specific fields */}
                        {getEntitySpecificFields()}

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    PAN *
                                    {getFieldError('pan') && (
                                        <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                    )}
                                </label>
                                <Input
                                    type="text"
                                    placeholder="ABCDE1234F"
                                    value={data.pan || ''}
                                    onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                                    maxLength={10}
                                    variant={getFieldVariant('pan')}
                                />
                                {getFieldError('pan') ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {getFieldError('pan')?.message}
                                    </p>
                                ) : (
                                    <p className="text-xs text-neutral-500 mt-1">10-character Permanent Account Number</p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    TAN
                                </label>
                                <Input
                                    type="text"
                                    placeholder="ABCD12345E"
                                    value={data.tan || ''}
                                    onChange={(e) => handleChange('tan', e.target.value.toUpperCase())}
                                    maxLength={10}
                                />
                                <p className="text-xs text-neutral-500 mt-1">Tax Deduction Account Number (optional)</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Registered Address */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="w-5 h-5 text-blue-600" />
                        <h5 className="font-medium text-neutral-90">Registered Address</h5>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Address Line 1 *
                                {getFieldError('registered_address.address_line_1') && (
                                    <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                )}
                            </label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    placeholder="Start typing address for suggestions..."
                                    value={data.registered_address?.address_line_1 || ''}
                                    onChange={(e) => handleAddressChange('registered', 'address_line_1', e.target.value)}
                                    variant={getFieldVariant('registered_address.address_line_1')}
                                />
                                {isLoadingAddressSuggestions && (
                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    </div>
                                )}
                            </div>

                            {/* Address Suggestions Dropdown */}
                            {showAddressSuggestions && addressSuggestions.length > 0 && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-neutral-200 rounded-md shadow-lg max-h-60 overflow-auto">
                                    {addressSuggestions.map((suggestion, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className="w-full px-4 py-2 text-left hover:bg-blue-50 focus:bg-blue-50 focus:outline-none border-b border-neutral-100 last:border-b-0"
                                            onClick={() => handleAddressSuggestionSelect(suggestion)}
                                        >
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-4 h-4 text-neutral-400" />
                                                <span className="text-sm text-neutral-900">{suggestion.formatted_address}</span>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}

                            {getFieldError('registered_address.address_line_1') && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {getFieldError('registered_address.address_line_1')?.message}
                                </p>
                            )}
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Address Line 2
                            </label>
                            <Input
                                type="text"
                                placeholder="Area, locality"
                                value={data.registered_address?.address_line_2 || ''}
                                onChange={(e) => handleAddressChange('registered', 'address_line_2', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    City *
                                    {getFieldError('registered_address.city') && (
                                        <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                    )}
                                </label>
                                <Input
                                    type="text"
                                    placeholder="City"
                                    value={data.registered_address?.city || ''}
                                    onChange={(e) => handleAddressChange('registered', 'city', e.target.value)}
                                    variant={getFieldVariant('registered_address.city')}
                                />
                                {getFieldError('registered_address.city') && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {getFieldError('registered_address.city')?.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    State *
                                    {getFieldError('registered_address.state') && (
                                        <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                    )}
                                </label>
                                <Select
                                    value={data.registered_address?.state || ''}
                                    onChange={(e) => handleAddressChange('registered', 'state', e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                    <option value="Assam">Assam</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Goa">Goa</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                                    <option value="Jharkhand">Jharkhand</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Manipur">Manipur</option>
                                    <option value="Meghalaya">Meghalaya</option>
                                    <option value="Mizoram">Mizoram</option>
                                    <option value="Nagaland">Nagaland</option>
                                    <option value="Odisha">Odisha</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Sikkim">Sikkim</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Tripura">Tripura</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Uttarakhand">Uttarakhand</option>
                                    <option value="West Bengal">West Bengal</option>
                                </Select>
                                {getFieldError('registered_address.state') && (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {getFieldError('registered_address.state')?.message}
                                    </p>
                                )}
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    PIN Code *
                                    {getFieldError('registered_address.pincode') && (
                                        <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                    )}
                                </label>
                                <Input
                                    type="text"
                                    placeholder="123456"
                                    value={data.registered_address?.pincode || ''}
                                    onChange={(e) => handleAddressChange('registered', 'pincode', e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                    variant={getFieldVariant('registered_address.pincode')}
                                />
                                {getFieldError('registered_address.pincode') ? (
                                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        {getFieldError('registered_address.pincode')?.message}
                                    </p>
                                ) : (
                                    <p className="text-xs text-neutral-500 mt-1">6-digit postal code</p>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business Address */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-green-600" />
                            <h5 className="font-medium text-neutral-90">Business Address</h5>
                            <Badge variant="secondary" size="sm">Optional</Badge>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={copyRegisteredToBusiness}
                            className="flex items-center gap-1"
                        >
                            <Copy className="w-3 h-3" />
                            Copy from Registered
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Address Line 1
                            </label>
                            <Input
                                type="text"
                                placeholder="Building name, street address"
                                value={data.business_address?.address_line_1 || ''}
                                onChange={(e) => handleAddressChange('business', 'address_line_1', e.target.value)}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Address Line 2
                            </label>
                            <Input
                                type="text"
                                placeholder="Area, locality"
                                value={data.business_address?.address_line_2 || ''}
                                onChange={(e) => handleAddressChange('business', 'address_line_2', e.target.value)}
                            />
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    City
                                </label>
                                <Input
                                    type="text"
                                    placeholder="City"
                                    value={data.business_address?.city || ''}
                                    onChange={(e) => handleAddressChange('business', 'city', e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    State
                                </label>
                                <Select
                                    value={data.business_address?.state || ''}
                                    onChange={(e) => handleAddressChange('business', 'state', e.target.value)}
                                >
                                    <option value="">Select State</option>
                                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                                    <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                                    <option value="Assam">Assam</option>
                                    <option value="Bihar">Bihar</option>
                                    <option value="Chhattisgarh">Chhattisgarh</option>
                                    <option value="Delhi">Delhi</option>
                                    <option value="Goa">Goa</option>
                                    <option value="Gujarat">Gujarat</option>
                                    <option value="Haryana">Haryana</option>
                                    <option value="Himachal Pradesh">Himachal Pradesh</option>
                                    <option value="Jharkhand">Jharkhand</option>
                                    <option value="Karnataka">Karnataka</option>
                                    <option value="Kerala">Kerala</option>
                                    <option value="Madhya Pradesh">Madhya Pradesh</option>
                                    <option value="Maharashtra">Maharashtra</option>
                                    <option value="Manipur">Manipur</option>
                                    <option value="Meghalaya">Meghalaya</option>
                                    <option value="Mizoram">Mizoram</option>
                                    <option value="Nagaland">Nagaland</option>
                                    <option value="Odisha">Odisha</option>
                                    <option value="Punjab">Punjab</option>
                                    <option value="Rajasthan">Rajasthan</option>
                                    <option value="Sikkim">Sikkim</option>
                                    <option value="Tamil Nadu">Tamil Nadu</option>
                                    <option value="Telangana">Telangana</option>
                                    <option value="Tripura">Tripura</option>
                                    <option value="Uttar Pradesh">Uttar Pradesh</option>
                                    <option value="Uttarakhand">Uttarakhand</option>
                                    <option value="West Bengal">West Bengal</option>
                                </Select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-700 mb-2">
                                    PIN Code
                                </label>
                                <Input
                                    type="text"
                                    placeholder="123456"
                                    value={data.business_address?.pincode || ''}
                                    onChange={(e) => handleAddressChange('business', 'pincode', e.target.value.replace(/\D/g, ''))}
                                    maxLength={6}
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Contact Information */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Phone className="w-5 h-5 text-purple-600" />
                        <h5 className="font-medium text-neutral-90">Contact Information</h5>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Primary Phone
                                {getFieldError('contact_details.primary_phone') && (
                                    <AlertCircle className="inline w-4 h-4 ml-1 text-yellow-500" />
                                )}
                            </label>
                            <Input
                                type="tel"
                                placeholder="+91 98765 43210"
                                value={data.contact_details?.primary_phone || ''}
                                onChange={(e) => handleChange('contact_details', {
                                    ...data.contact_details,
                                    primary_phone: e.target.value
                                })}
                                variant={getFieldVariant('contact_details.primary_phone')}
                            />
                            {getFieldError('contact_details.primary_phone') && (
                                <p className="text-xs text-yellow-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {getFieldError('contact_details.primary_phone')?.message}
                                </p>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Primary Email
                                {getFieldError('contact_details.primary_email') && (
                                    <AlertCircle className="inline w-4 h-4 ml-1 text-red-500" />
                                )}
                            </label>
                            <Input
                                type="email"
                                placeholder="contact@company.com"
                                value={data.contact_details?.primary_email || ''}
                                onChange={(e) => handleChange('contact_details', {
                                    ...data.contact_details,
                                    primary_email: e.target.value
                                })}
                                variant={getFieldVariant('contact_details.primary_email')}
                            />
                            {getFieldError('contact_details.primary_email') && (
                                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {getFieldError('contact_details.primary_email')?.message}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Secondary Phone
                            </label>
                            <Input
                                type="tel"
                                placeholder="+91 98765 43211"
                                value={data.contact_details?.secondary_phone || ''}
                                onChange={(e) => handleChange('contact_details', {
                                    ...data.contact_details,
                                    secondary_phone: e.target.value
                                })}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Website
                            </label>
                            <div className="relative">
                                <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
                                <Input
                                    type="url"
                                    placeholder="https://www.company.com"
                                    value={data.contact_details?.website || ''}
                                    onChange={(e) => handleChange('contact_details', {
                                        ...data.contact_details,
                                        website: e.target.value
                                    })}
                                    className="pl-10"
                                />
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Business Information */}
            <Card>
                <CardContent className="p-4 space-y-4">
                    <div className="flex items-center gap-2 mb-4">
                        <Building2 className="w-5 h-5 text-indigo-600" />
                        <h5 className="font-medium text-neutral-90">Business Information</h5>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Industry Sector
                            </label>
                            <Select
                                value={data.industry_classification?.industry_sector || ''}
                                onChange={(e) => {
                                    const selectedIndustry = industryOptions.find(opt => opt.name === e.target.value)
                                    handleChange('industry_classification', {
                                        ...data.industry_classification,
                                        industry_sector: e.target.value,
                                        industry_code: selectedIndustry?.code,
                                        industry_category: selectedIndustry?.category
                                    })
                                }}
                            >
                                <option value="">Select Industry</option>
                                {industryOptions.map((industry) => (
                                    <option key={industry.code} value={industry.name}>
                                        {industry.name} - {industry.description}
                                    </option>
                                ))}
                            </Select>
                            {data.industry_classification?.industry_sector && (
                                <div className="mt-2">
                                    <Badge variant="info" size="sm">
                                        {industryOptions.find(opt => opt.name === data.industry_classification?.industry_sector)?.category} Sector
                                    </Badge>
                                </div>
                            )}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                NIC Code
                            </label>
                            <Input
                                type="text"
                                placeholder="12345 (5-digit NIC code)"
                                value={data.industry_classification?.nic_code || ''}
                                onChange={(e) => handleChange('industry_classification', {
                                    ...data.industry_classification,
                                    nic_code: e.target.value
                                })}
                                maxLength={5}
                            />
                            <p className="text-xs text-neutral-500 mt-1">National Industrial Classification code</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Date of Commencement
                            </label>
                            <Input
                                type="date"
                                value={data.date_of_commencement || ''}
                                onChange={(e) => handleChange('date_of_commencement', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-neutral-700 mb-2">
                                Financial Year End
                            </label>
                            <Select
                                value={data.financial_year_end || ''}
                                onChange={(e) => handleChange('financial_year_end', e.target.value)}
                            >
                                <option value="">Select FY End</option>
                                <option value="31-03">March 31</option>
                                <option value="31-12">December 31</option>
                                <option value="30-06">June 30</option>
                                <option value="30-09">September 30</option>
                            </Select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Primary Business Activities
                        </label>
                        <Input
                            type="text"
                            placeholder="e.g., Manufacturing of textiles, Trading in electronics"
                            value={data.industry_classification?.primary_activity || ''}
                            onChange={(e) => handleChange('industry_classification', {
                                ...data.industry_classification,
                                primary_activity: e.target.value
                            })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-2">
                            Business Description
                        </label>
                        <Textarea
                            placeholder="Provide a detailed description of your business activities, products, and services..."
                            value={data.business_description || ''}
                            onChange={(e) => handleChange('business_description', e.target.value)}
                            rows={4}
                        />
                        <p className="text-xs text-neutral-500 mt-1">
                            {data.business_description?.length || 0}/500 characters
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Validation Summary */}
            {validationErrors.length > 0 && (
                <Alert variant="error">
                    <AlertTriangle className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Please fix the following issues:</p>
                        <ul className="text-sm mt-2 space-y-1">
                            {validationErrors.filter(error => error.severity === 'error').map((error, index) => (
                                <li key={index} className="flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    {error.message}
                                </li>
                            ))}
                        </ul>
                        {validationErrors.filter(error => error.severity === 'warning').length > 0 && (
                            <>
                                <p className="font-medium mt-3 text-yellow-700">Warnings:</p>
                                <ul className="text-sm mt-1 space-y-1 text-yellow-700">
                                    {validationErrors.filter(error => error.severity === 'warning').map((error, index) => (
                                        <li key={index} className="flex items-center gap-1">
                                            <AlertCircle className="w-3 h-3" />
                                            {error.message}
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>
                </Alert>
            )}

            {validationErrors.length === 0 && data.legal_name && (
                <Alert variant="success">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Basic details look good!</p>
                        <p className="text-sm mt-1">
                            All required information has been provided. You can proceed to the next section or submit the form.
                        </p>
                    </div>
                </Alert>
            )}
        </div>
    )
}