'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Progress } from '@/components/ui/Progress'
import {
    EntityType,
    CompanySearchResult,
    ProcessingMethod
} from '@/types/manual-company.types'
import {
    Wifi,
    FileText,
    Database,
    Clock,
    CheckCircle,
    AlertTriangle,
    Zap,
    Upload,
    Edit3,
    Info,
    Star
} from 'lucide-react'

interface ProcessingMethodSelectorProps {
    entityType: EntityType
    selectedCompany: CompanySearchResult | null
    selectedMethod: ProcessingMethod | null
    onMethodSelect: (method: ProcessingMethod) => void
}

export function ProcessingMethodSelector({
    entityType,
    selectedCompany,
    selectedMethod,
    onMethodSelect
}: ProcessingMethodSelectorProps) {

    // Determine available processing methods based on entity type and company data
    const getAvailableMethods = (): ProcessingMethod[] => {
        const methods: ProcessingMethod[] = []

        // Corporate entities support API processing
        if (['private_limited', 'public_limited', 'llp'].includes(entityType)) {
            // API method
            if (selectedCompany?.registration_number) {
                methods.push({
                    type: 'api',
                    eligibility_reason: 'Valid CIN/LLPIN/PAN found - fastest processing with comprehensive data',
                    requirements: [
                        'Valid CIN/LLPIN/PAN',
                        'Active registration status',
                    ],
                    estimated_time: '1-2 minutes',
                    data_completeness_expected: 95
                })
            } else {
                methods.push({
                    type: 'api',
                    eligibility_reason: 'API processing available but requires valid CIN/LLPIN/PAN',
                    requirements: [
                        'Valid CIN/LLPIN/PAN (to be entered)',
                        'Active registration status',
                        'Internet connection for real-time data fetch'
                    ],
                    estimated_time: '1-2 minutes',
                    data_completeness_expected: 95
                })
            }

            // Excel upload method
            methods.push({
                type: 'excel',
                eligibility_reason: 'Corporate entity - Excel upload supported for financial statements',
                requirements: [
                    'Financial statements in Excel format',
                    'Company basic details',
                    'Properly formatted data sheets'
                ],
                estimated_time: '2-3 minutes',
                data_completeness_expected: 90
            })
        }

        // Manual entry (available for all entity types)
        methods.push({
            type: 'manual',
            eligibility_reason: `Manual entry available for all ${entityType.replace('_', ' ')} entities`,
            requirements: [
                'Basic company information',
                'Optional: Financial statements',
                'Optional: Compliance data (GST, EPFO)',
                'Optional: Legal and audit information'
            ],
            estimated_time: '15-20 minutes',
            data_completeness_expected: 80
        })

        return methods
    }

    const availableMethods = getAvailableMethods()

    const getMethodIcon = (type: string) => {
        switch (type) {
            case 'api':
                return Wifi
            case 'excel':
                return FileText
            case 'manual':
                return Database
            default:
                return Database
        }
    }

    const getMethodColor = (type: string) => {
        switch (type) {
            case 'api':
                return 'text-green-600 bg-green-100 border-green-200'
            case 'excel':
                return 'text-blue-600 bg-blue-100 border-blue-200'
            case 'manual':
                return 'text-orange-600 bg-orange-100 border-orange-200'
            default:
                return 'text-neutral-600 bg-neutral-100 border-neutral-200'
        }
    }

    const getMethodBadgeVariant = (type: string) => {
        switch (type) {
            case 'api':
                return 'success'
            case 'excel':
                return 'info'
            case 'manual':
                return 'secondary'
            default:
                return 'secondary'
        }
    }

    const getRecommendedMethod = () => {
        if (selectedCompany?.registration_number && ['private_limited', 'public_limited', 'llp'].includes(entityType)) {
            return 'api'
        }
        if (['private_limited', 'public_limited', 'llp'].includes(entityType)) {
            return 'excel'
        }
        return 'manual'
    }

    const recommendedMethod = getRecommendedMethod()

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                    <Zap className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90">
                    Choose Processing Method
                </h3>
                <p className="text-sm text-neutral-60 max-w-md mx-auto">
                    Select how you'd like to add your company data. Each method offers different levels of automation and data completeness.
                </p>
            </div>

            {/* Company Context */}
            {selectedCompany && (
                <Alert variant="info">
                    <Info className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Selected Company</p>
                        <p className="text-sm mt-1">
                            {selectedCompany.name} ({entityType.replace('_', ' ').toUpperCase()})
                            {selectedCompany.registration_number && ` - ${selectedCompany.registration_number}`}
                        </p>
                    </div>
                </Alert>
            )}

            {/* Processing Methods */}
            <div className="space-y-4">
                {availableMethods.map((method) => {
                    const Icon = getMethodIcon(method.type)
                    const isSelected = selectedMethod?.type === method.type
                    const isRecommended = method.type === recommendedMethod
                    const colorClasses = getMethodColor(method.type)

                    return (
                        <Card
                            key={method.type}
                            className={`cursor-pointer transition-all hover:shadow-md ${isSelected
                                ? 'ring-2 ring-blue-500 bg-blue-50'
                                : 'hover:bg-neutral-10'
                                }`}
                            onClick={() => onMethodSelect(method)}
                        >
                            <CardContent className="p-6">
                                <div className="space-y-4">
                                    {/* Method Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className={`
                        flex items-center justify-center w-12 h-12 rounded-lg border-2
                        ${isSelected ? 'bg-blue-100 text-blue-600 border-blue-200' : colorClasses}
                      `}>
                                                <Icon className="w-6 h-6" />
                                            </div>

                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-semibold text-neutral-90 text-lg">
                                                        {method.type === 'api' ? ('API') : method.type.charAt(0).toUpperCase() + method.type.slice(1)} Processing
                                                    </h4>

                                                    {isRecommended && (
                                                        <Badge variant="success" className="flex items-center gap-1">
                                                            <Star className="w-3 h-3" />
                                                            Recommended
                                                        </Badge>
                                                    )}

                                                    <Badge variant={getMethodBadgeVariant(method.type) as any}>
                                                        {method.estimated_time}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm text-neutral-600 mt-1">
                                                    {method.eligibility_reason}
                                                </p>
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                                        )}
                                    </div>

                                    {/* Data Completeness */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-neutral-700">
                                                Expected Data Completeness
                                            </span>
                                            <span className="text-sm font-semibold text-neutral-900">
                                                {method.data_completeness_expected}%
                                            </span>
                                        </div>
                                        <Progress
                                            value={method.data_completeness_expected}
                                            className="h-2"
                                        />
                                    </div>

                                    {/* Requirements */}
                                    <div className="space-y-2">
                                        <h5 className="text-sm font-medium text-neutral-700">Requirements:</h5>
                                        <ul className="space-y-1">
                                            {method.requirements.map((requirement, index) => (
                                                <li key={index} className="flex items-start gap-2 text-sm text-neutral-600">
                                                    <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                                                    {requirement}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>

                                    {/* Method-specific details */}
                                    {method.type === 'api' && (
                                        <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <Zap className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-green-800">
                                                    <p className="font-medium">Fastest & Most Comprehensive</p>
                                                    <p>Automatically fetches data from MCA, GST, and other government databases.
                                                        Includes financial statements, compliance records, and director information.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {method.type === 'excel' && (
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <Upload className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-blue-800">
                                                    <p className="font-medium">Upload Your Documents</p>
                                                    <p>Upload financial statements, compliance documents, and other company files.
                                                        System will extract and process the data automatically.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {method.type === 'manual' && (
                                        <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                                            <div className="flex items-start gap-2">
                                                <Edit3 className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                                                <div className="text-sm text-orange-800">
                                                    <p className="font-medium">Complete Control</p>
                                                    <p>Enter all company information manually. Perfect for entities not available
                                                        through API or when you want to control exactly what data is included.</p>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Selected Method Summary */}
            {selectedMethod && (
                <Alert variant="success">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Processing Method Selected</p>
                        <p className="text-sm mt-1">
                            {selectedMethod.type.charAt(0).toUpperCase() + selectedMethod.type.slice(1)} processing -
                            Estimated time: {selectedMethod.estimated_time},
                            Expected completeness: {selectedMethod.data_completeness_expected}%
                        </p>
                    </div>
                </Alert>
            )}

            {/* Comparison Table */}
            <Card>
                <CardContent className="p-4">
                    <h4 className="font-medium text-neutral-90 mb-4">Quick Comparison</h4>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-200">
                                    <th className="text-left py-2 text-neutral-600">Method</th>
                                    <th className="text-left py-2 text-neutral-600">Time</th>
                                    <th className="text-left py-2 text-neutral-600">Completeness</th>
                                    <th className="text-left py-2 text-neutral-600">Best For</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-neutral-100">
                                    <td className="py-2 flex items-center gap-2">
                                        <Wifi className="w-4 h-4 text-green-600" />
                                        API
                                    </td>
                                    <td className="py-2 text-green-600 font-medium">1-2 min</td>
                                    <td className="py-2 text-green-600 font-medium">95%</td>
                                    <td className="py-2 text-neutral-600">Corporate entities with CIN/LLPIN/PAN</td>
                                </tr>
                                <tr className="border-b border-neutral-100">
                                    <td className="py-2 flex items-center gap-2">
                                        <FileText className="w-4 h-4 text-blue-600" />
                                        Excel
                                    </td>
                                    <td className="py-2 text-blue-600 font-medium">2-3 min</td>
                                    <td className="py-2 text-blue-600 font-medium">90%</td>
                                    <td className="py-2 text-neutral-600">When you have financial documents</td>
                                </tr>
                                <tr>
                                    <td className="py-2 flex items-center gap-2">
                                        <Database className="w-4 h-4 text-orange-600" />
                                        Manual
                                    </td>
                                    <td className="py-2 text-orange-600 font-medium">15-20 min</td>
                                    <td className="py-2 text-orange-600 font-medium">80%</td>
                                    <td className="py-2 text-neutral-600">All entity types, complete control</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {/* Help Text */}
            <div className="text-center">
                <p className="text-xs text-neutral-500">
                    Don't worry - you can always enhance your company data later by adding more information
                    or switching to a different processing method.
                </p>
            </div>
        </div>
    )
}