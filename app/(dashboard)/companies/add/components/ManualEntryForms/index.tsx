'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert } from '@/components/ui/Alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
    EntityType,
    CompanySearchResult,
    ValidationError
} from '@/types/manual-company.types'
import {
    Database,
    Building2,
    Users,
    FileText,
    Shield,
    CheckCircle,
    AlertTriangle,
    Info,
    Save,
    Loader2
} from 'lucide-react'

// Import form sections (to be created)
import { BasicDetailsForm } from './BasicDetailsForm'
import { OwnershipStructureForm } from './OwnershipStructureForm'
import { FinancialDataForm } from './FinancialDataForm'
import { ComplianceDataForm } from './ComplianceDataForm'

interface ManualEntryFormsProps {
    entityType: EntityType
    selectedCompany: CompanySearchResult | null
    formData: {
        basicDetails: any
        ownership: any
        financial: any
        compliance: any
    }
    onFormDataUpdate: (section: string, data: any) => void
    onValidationUpdate: (errors: ValidationError[], warnings?: ValidationError[]) => void
    onSubmissionComplete: (requestId: string) => void
    onSubmissionError: (error: string) => void
}

interface FormSection {
    id: string
    name: string
    icon: React.ComponentType<any>
    required: boolean
    description: string
    completeness: number
}

export function ManualEntryForms({
    entityType,
    selectedCompany,
    formData,
    onFormDataUpdate,
    onValidationUpdate,
    onSubmissionComplete,
    onSubmissionError
}: ManualEntryFormsProps) {
    const [activeTab, setActiveTab] = useState('basic')
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error' | null>(null)

    // Define form sections based on entity type
    const getFormSections = (): FormSection[] => {
        const sections: FormSection[] = [
            {
                id: 'basic',
                name: 'Basic Details',
                icon: Building2,
                required: true,
                description: 'Company name, registration, address, and contact information',
                completeness: calculateCompleteness('basicDetails')
            },
            {
                id: 'ownership',
                name: getOwnershipSectionName(),
                icon: Users,
                required: false,
                description: getOwnershipDescription(),
                completeness: calculateCompleteness('ownership')
            },
            {
                id: 'financial',
                name: 'Financial Data',
                icon: FileText,
                required: false,
                description: 'Financial statements, ratios, and performance metrics',
                completeness: calculateCompleteness('financial')
            },
            {
                id: 'compliance',
                name: 'Compliance',
                icon: Shield,
                required: false,
                description: 'GST, EPFO, legal cases, and regulatory compliance',
                completeness: calculateCompleteness('compliance')
            }
        ]

        return sections
    }

    const getOwnershipSectionName = () => {
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                return 'Directors'
            case 'llp':
                return 'Partners'
            case 'partnership_registered':
            case 'partnership_unregistered':
                return 'Partners'
            case 'proprietorship':
                return 'Owner Details'
            case 'huf':
                return 'Family Members'
            case 'trust_private':
            case 'trust_public':
                return 'Trustees'
            case 'society':
                return 'Members'
            default:
                return 'Ownership'
        }
    }

    const getOwnershipDescription = () => {
        switch (entityType) {
            case 'private_limited':
            case 'public_limited':
                return 'Director details, shareholding pattern, and management structure'
            case 'llp':
                return 'Partner details, profit sharing, and management roles'
            case 'partnership_registered':
            case 'partnership_unregistered':
                return 'Partner information, capital contribution, and profit sharing'
            case 'proprietorship':
                return 'Owner/proprietor personal and business details'
            case 'huf':
                return 'Karta details, family members, and business structure'
            case 'trust_private':
            case 'trust_public':
                return 'Trustee information, beneficiaries, and trust structure'
            case 'society':
                return 'Member details, governing body, and organizational structure'
            default:
                return 'Ownership and management structure'
        }
    }

    const calculateCompleteness = (section: string): number => {
        const data = formData[section as keyof typeof formData]
        if (!data || Object.keys(data).length === 0) return 0

        // Simple completeness calculation - can be enhanced
        const totalFields = 10 // Approximate number of important fields per section
        const filledFields = Object.values(data).filter(value =>
            value !== null && value !== undefined && value !== ''
        ).length

        return Math.min(Math.round((filledFields / totalFields) * 100), 100)
    }

    const getOverallCompleteness = (): number => {
        const sections = getFormSections()
        const totalCompleteness = sections.reduce((sum, section) => sum + section.completeness, 0)
        return Math.round(totalCompleteness / sections.length)
    }

    const handleFormUpdate = (section: string, data: any) => {
        onFormDataUpdate(section, data)

        // Auto-save functionality
        setAutoSaveStatus('saving')
        setTimeout(() => {
            setAutoSaveStatus('saved')
            setTimeout(() => setAutoSaveStatus(null), 2000)
        }, 1000)
    }

    const handleSubmit = async () => {
        setIsSubmitting(true)

        try {
            // Validate all sections
            const errors: ValidationError[] = []

            // Basic validation - at least basic details should be filled
            if (!formData.basicDetails?.legal_name) {
                errors.push({
                    field: 'basic_details.legal_name',
                    error_type: 'required',
                    message: 'Company name is required',
                    severity: 'error',
                    code: 'REQUIRED_FIELD'
                })
            }

            if (errors.length > 0) {
                onValidationUpdate(errors)
                return
            }

            // Simulate submission process
            await new Promise(resolve => setTimeout(resolve, 2000))

            const requestId = `MANUAL_${Date.now()}`
            onSubmissionComplete(requestId)

        } catch (error) {
            console.error('Submission error:', error)
            onSubmissionError(error instanceof Error ? error.message : 'Submission failed')
        } finally {
            setIsSubmitting(false)
        }
    }

    const sections = getFormSections()
    const overallCompleteness = getOverallCompleteness()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-orange-600 mb-4">
                    <Database className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90">
                    Manual Data Entry
                </h3>
                <p className="text-sm text-neutral-60 max-w-md mx-auto">
                    Enter your company information manually. All sections except basic details are optional and can be completed later.
                </p>
            </div>

            {/* Progress Overview */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <span className="font-medium text-neutral-90">Overall Progress</span>
                        <div className="flex items-center gap-2">
                            {autoSaveStatus && (
                                <div className="flex items-center gap-1 text-xs">
                                    {autoSaveStatus === 'saving' && (
                                        <>
                                            <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
                                            <span className="text-blue-600">Saving...</span>
                                        </>
                                    )}
                                    {autoSaveStatus === 'saved' && (
                                        <>
                                            <CheckCircle className="w-3 h-3 text-green-600" />
                                            <span className="text-green-600">Saved</span>
                                        </>
                                    )}
                                </div>
                            )}
                            <span className="font-semibold text-neutral-900">{overallCompleteness}%</span>
                        </div>
                    </div>
                    <Progress value={overallCompleteness} className="h-2" />

                    <div className="grid grid-cols-4 gap-2 mt-3">
                        {sections.map((section) => (
                            <div key={section.id} className="text-center">
                                <div className="text-xs font-medium text-neutral-600">{section.name}</div>
                                <div className="text-xs text-neutral-500">{section.completeness}%</div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Form Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                    {sections.map((section) => {
                        const Icon = section.icon
                        return (
                            <TabsTrigger
                                key={section.id}
                                value={section.id}
                                className="flex items-center gap-2 relative"
                            >
                                <Icon className="w-4 h-4" />
                                <span className="hidden sm:inline">{section.name}</span>
                                {section.required && (
                                    <span className="text-red-500 text-xs">*</span>
                                )}
                                {section.completeness > 0 && (
                                    <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
                                )}
                            </TabsTrigger>
                        )
                    })}
                </TabsList>

                {/* Basic Details Tab */}
                <TabsContent value="basic" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                    <h4 className="font-semibold text-neutral-90">Basic Company Details</h4>
                                    <Badge variant="error" size="sm">Required</Badge>
                                </div>
                                <Badge variant="secondary" size="sm">
                                    {sections[0].completeness}% Complete
                                </Badge>
                            </div>
                            <p className="text-sm text-neutral-600">{sections[0].description}</p>
                        </CardHeader>
                        <CardContent>
                            <BasicDetailsForm
                                entityType={entityType}
                                data={formData.basicDetails}
                                onChange={(data) => handleFormUpdate('basicDetails', data)}
                                selectedCompany={selectedCompany}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Ownership Tab */}
                <TabsContent value="ownership" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Users className="w-5 h-5 text-purple-600" />
                                    <h4 className="font-semibold text-neutral-90">{sections[1].name}</h4>
                                    <Badge variant="info" size="sm">Optional</Badge>
                                </div>
                                <Badge variant="secondary" size="sm">
                                    {sections[1].completeness}% Complete
                                </Badge>
                            </div>
                            <p className="text-sm text-neutral-600">{sections[1].description}</p>
                        </CardHeader>
                        <CardContent>
                            <OwnershipStructureForm
                                entityType={entityType}
                                data={formData.ownership}
                                onChange={(data) => handleFormUpdate('ownership', data)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Financial Tab */}
                <TabsContent value="financial" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-green-600" />
                                    <h4 className="font-semibold text-neutral-90">Financial Information</h4>
                                    <Badge variant="info" size="sm">Optional</Badge>
                                </div>
                                <Badge variant="secondary" size="sm">
                                    {sections[2].completeness}% Complete
                                </Badge>
                            </div>
                            <p className="text-sm text-neutral-600">{sections[2].description}</p>
                        </CardHeader>
                        <CardContent>
                            <FinancialDataForm
                                entityType={entityType}
                                data={formData.financial}
                                onChange={(data) => handleFormUpdate('financial', data)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Compliance Tab */}
                <TabsContent value="compliance" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-orange-600" />
                                    <h4 className="font-semibold text-neutral-90">Compliance Information</h4>
                                    <Badge variant="info" size="sm">Optional</Badge>
                                </div>
                                <Badge variant="secondary" size="sm">
                                    {sections[3].completeness}% Complete
                                </Badge>
                            </div>
                            <p className="text-sm text-neutral-600">{sections[3].description}</p>
                        </CardHeader>
                        <CardContent>
                            <ComplianceDataForm
                                entityType={entityType}
                                data={formData.compliance}
                                onChange={(data) => handleFormUpdate('compliance', data)}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Submit Section */}
            <Card>
                <CardContent className="p-6">
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h4 className="font-semibold text-neutral-90">Ready to Submit?</h4>
                                <p className="text-sm text-neutral-600">
                                    You can submit with just basic details and add more information later.
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-bold text-neutral-90">{overallCompleteness}%</div>
                                <div className="text-xs text-neutral-500">Complete</div>
                            </div>
                        </div>

                        <Alert variant="info">
                            <Info className="w-4 h-4" />
                            <div>
                                <p className="font-medium">What happens next?</p>
                                <p className="text-sm mt-1">
                                    We'll create your company profile and you can enhance it later with additional data sources or manual updates.
                                </p>
                            </div>
                        </Alert>

                        <div className="flex justify-center">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !formData.basicDetails?.legal_name}
                                className="px-8"
                                size="lg"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Creating Company...
                                    </>
                                ) : (
                                    <>
                                        <Save className="w-4 h-4 mr-2" />
                                        Create Company Profile
                                    </>
                                )}
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}