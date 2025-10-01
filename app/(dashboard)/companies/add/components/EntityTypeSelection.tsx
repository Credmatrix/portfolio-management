'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { EntityType, CompanySearchResult, ProcessingMethod } from '@/types/manual-company.types'
import {
    Building2,
    Users,
    User,
    Home,
    Shield,
    Heart,
    Info,
    CheckCircle,
    Wifi,
    FileText,
    Database,
    Clock,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    Zap,
    Upload,
    Edit3
} from 'lucide-react'

interface EntityTypeSelectionProps {
    selectedEntityType: EntityType | null
    onEntityTypeSelect: (entityType: EntityType) => void
    preSelectedCompany?: CompanySearchResult | null
    onWorkflowPathChange?: (processingMethods: ProcessingMethod[]) => void
}

interface EntityTypeOption {
    type: EntityType
    name: string
    description: string
    icon: React.ComponentType<any>
    processingMethods: ProcessingMethodInfo[]
    examples: string[]
    isPopular?: boolean
    requirements: string[]
    complexity: 'simple' | 'moderate' | 'complex'
    estimatedTime: string
    dataCompleteness: number
    businessContext: string
    regulatoryNotes?: string[]
}

interface ProcessingMethodInfo {
    type: 'api' | 'excel' | 'manual'
    name: string
    icon: React.ComponentType<any>
    estimatedTime: string
    dataCompleteness: number
    requirements: string[]
    eligibilityReason: string
}

// Processing method definitions
const PROCESSING_METHODS: Record<string, ProcessingMethodInfo> = {
    api: {
        type: 'api',
        name: 'API Processing',
        icon: Zap,
        estimatedTime: '1-2 minutes',
        dataCompleteness: 95,
        requirements: ['Valid CIN/LLPIN', 'Active registration status'],
        eligibilityReason: 'Fastest processing using government databases'
    },
    excel: {
        type: 'excel',
        name: 'Excel Upload',
        icon: Upload,
        estimatedTime: '2-3 minutes',
        dataCompleteness: 90,
        requirements: ['Financial statements', 'Formatted Excel template'],
        eligibilityReason: 'Structured data upload with validation'
    },
    manual: {
        type: 'manual',
        name: 'Manual Entry',
        icon: Edit3,
        estimatedTime: '15-20 minutes',
        dataCompleteness: 80,
        requirements: ['Basic company information', 'Financial data (optional)'],
        eligibilityReason: 'Complete control over data entry and validation'
    }
}

const ENTITY_TYPES: EntityTypeOption[] = [
    {
        type: 'private_limited',
        name: 'Private Limited Company',
        description: 'Most common corporate structure for businesses in India',
        icon: Building2,
        processingMethods: [
            PROCESSING_METHODS.api,
            PROCESSING_METHODS.excel,
            PROCESSING_METHODS.manual
        ],
        examples: ['ABC Private Limited', 'XYZ Pvt Ltd'],
        isPopular: true,
        complexity: 'moderate',
        estimatedTime: '1-3 minutes',
        dataCompleteness: 95,
        businessContext: 'Ideal for small to medium businesses with limited liability protection',
        requirements: ['Valid CIN (21 characters)', 'ROC registration', 'Minimum 2 directors', 'Authorized capital details'],
        regulatoryNotes: ['Companies Act 2013 compliance', 'Annual ROC filings mandatory', 'Audit requirements based on turnover']
    },
    {
        type: 'public_limited',
        name: 'Public Limited Company',
        description: 'Companies that can raise capital from public',
        icon: Building2,
        processingMethods: [
            PROCESSING_METHODS.api,
            PROCESSING_METHODS.excel,
            PROCESSING_METHODS.manual
        ],
        examples: ['ABC Limited', 'XYZ Ltd'],
        complexity: 'complex',
        estimatedTime: '1-3 minutes',
        dataCompleteness: 95,
        businessContext: 'Large enterprises with public shareholding and stock exchange listings',
        requirements: ['Valid CIN (21 characters)', 'ROC registration', 'Minimum 3 directors', 'SEBI compliance (if listed)'],
        regulatoryNotes: ['Companies Act 2013 compliance', 'SEBI regulations (if listed)', 'Mandatory audit requirements']
    },
    {
        type: 'llp',
        name: 'Limited Liability Partnership',
        description: 'Partnership with limited liability protection',
        icon: Users,
        processingMethods: [
            PROCESSING_METHODS.api,
            PROCESSING_METHODS.excel,
            PROCESSING_METHODS.manual
        ],
        examples: ['ABC LLP', 'XYZ Partners LLP'],
        complexity: 'moderate',
        estimatedTime: '1-3 minutes',
        dataCompleteness: 90,
        businessContext: 'Professional services and partnerships with liability protection',
        requirements: ['Valid LLPIN (8 characters)', 'ROC registration', 'Minimum 2 partners', 'LLP Agreement'],
        regulatoryNotes: ['LLP Act 2008 compliance', 'Annual ROC filings', 'Audit based on contribution/turnover']
    },
    {
        type: 'partnership_registered',
        name: 'Registered Partnership',
        description: 'Partnership firm registered under Partnership Act',
        icon: Users,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['ABC & Associates', 'XYZ Partners'],
        complexity: 'moderate',
        estimatedTime: '15-20 minutes',
        dataCompleteness: 70,
        businessContext: 'Traditional business partnerships with formal registration',
        requirements: ['Partnership deed', 'Registration certificate', 'Partner details', 'Capital contribution details'],
        regulatoryNotes: ['Partnership Act 1932', 'State registration requirements', 'Tax audit if applicable']
    },
    {
        type: 'partnership_unregistered',
        name: 'Unregistered Partnership',
        description: 'Partnership firm without formal registration',
        icon: Users,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['ABC & Co', 'XYZ Trading'],
        complexity: 'simple',
        estimatedTime: '15-25 minutes',
        dataCompleteness: 60,
        businessContext: 'Informal business partnerships without legal registration',
        requirements: ['Partnership deed (recommended)', 'Partner details', 'Business proof documents'],
        regulatoryNotes: ['Limited legal protection', 'Tax compliance required', 'Consider registration for better legal standing']
    },
    {
        type: 'proprietorship',
        name: 'Sole Proprietorship',
        description: 'Business owned and operated by single individual',
        icon: User,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['John Doe Enterprises', 'ABC Trading'],
        isPopular: true,
        complexity: 'simple',
        estimatedTime: '15-20 minutes',
        dataCompleteness: 65,
        businessContext: 'Individual-owned businesses with unlimited liability',
        requirements: ['Owner PAN card', 'Business registration proof', 'Address proof', 'Bank account details'],
        regulatoryNotes: ['No separate legal entity', 'Owner personally liable', 'Simple tax compliance']
    },
    {
        type: 'huf',
        name: 'Hindu Undivided Family',
        description: 'Family business structure under Hindu law',
        icon: Home,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['ABC HUF', 'XYZ Family Business'],
        complexity: 'moderate',
        estimatedTime: '20-25 minutes',
        dataCompleteness: 65,
        businessContext: 'Family-owned business entity with tax benefits under Hindu law',
        requirements: ['HUF PAN card', 'Karta details', 'Family tree/lineage proof', 'HUF deed (if available)'],
        regulatoryNotes: ['Hindu Succession Act applicable', 'Tax benefits available', 'Karta has unlimited liability']
    },
    {
        type: 'trust_private',
        name: 'Private Trust',
        description: 'Trust for private purposes and beneficiaries',
        icon: Shield,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['ABC Family Trust', 'XYZ Investment Trust'],
        complexity: 'complex',
        estimatedTime: '25-35 minutes',
        dataCompleteness: 70,
        businessContext: 'Asset management and wealth preservation for specific beneficiaries',
        requirements: ['Trust deed', 'Trustee details', 'Beneficiary information', 'Registration proof', 'Trust PAN'],
        regulatoryNotes: ['Indian Trusts Act 1882', 'Income tax implications', 'Beneficiary tax obligations']
    },
    {
        type: 'trust_public',
        name: 'Public Trust',
        description: 'Trust for public charitable purposes',
        icon: Heart,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['ABC Welfare Trust', 'XYZ Education Trust'],
        complexity: 'complex',
        estimatedTime: '25-35 minutes',
        dataCompleteness: 75,
        businessContext: 'Charitable and public welfare activities with tax exemptions',
        requirements: ['Trust deed', 'Trustee details', '12A/80G registration', 'FCRA (if applicable)', 'Trust PAN'],
        regulatoryNotes: ['Income Tax Act exemptions', 'FCRA compliance', 'Annual compliance requirements']
    },
    {
        type: 'society',
        name: 'Society',
        description: 'Non-profit organization registered under Societies Act',
        icon: Users,
        processingMethods: [PROCESSING_METHODS.manual],
        examples: ['ABC Welfare Society', 'XYZ Cultural Society'],
        complexity: 'moderate',
        estimatedTime: '20-30 minutes',
        dataCompleteness: 70,
        businessContext: 'Non-profit organizations for social, cultural, or educational purposes',
        requirements: ['Society registration certificate', 'Memorandum & Articles', 'Member details', 'Governing body information'],
        regulatoryNotes: ['Societies Registration Act', '12A/80G for tax benefits', 'Annual compliance filings']
    }
]

export function EntityTypeSelection({
    selectedEntityType,
    onEntityTypeSelect,
    preSelectedCompany,
    onWorkflowPathChange
}: EntityTypeSelectionProps) {
    const [hoveredEntityType, setHoveredEntityType] = useState<EntityType | null>(null)
    const [showDetailedView, setShowDetailedView] = useState(false)

    // Determine workflow path when entity type changes
    useEffect(() => {
        if (selectedEntityType && onWorkflowPathChange) {
            const selectedEntity = ENTITY_TYPES.find(e => e.type === selectedEntityType)
            if (selectedEntity) {
                const processingMethods: ProcessingMethod[] = selectedEntity.processingMethods.map(method => ({
                    type: method.type,
                    eligibility_reason: method.eligibilityReason,
                    requirements: method.requirements,
                    estimated_time: method.estimatedTime,
                    data_completeness_expected: method.dataCompleteness
                }))
                onWorkflowPathChange(processingMethods)
            }
        }
    }, [selectedEntityType, onWorkflowPathChange])

    const getComplexityColor = (complexity: string) => {
        switch (complexity) {
            case 'simple':
                return 'success'
            case 'moderate':
                return 'warning'
            case 'complex':
                return 'error'
            default:
                return 'secondary'
        }
    }

    const getComplexityIcon = (complexity: string) => {
        switch (complexity) {
            case 'simple':
                return <CheckCircle className="w-3 h-3" />
            case 'moderate':
                return <Clock className="w-3 h-3" />
            case 'complex':
                return <AlertTriangle className="w-3 h-3" />
            default:
                return <Info className="w-3 h-3" />
        }
    }

    const getProcessingMethodColor = (method: ProcessingMethodInfo) => {
        switch (method.type) {
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                    <Building2 className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90">
                    Select Entity Type
                </h3>
                <p className="text-sm text-neutral-60 max-w-md mx-auto">
                    Choose the type of business entity you want to add. This determines the available processing methods and required information.
                </p>
            </div>

            {/* Pre-selected Company Info */}
            {preSelectedCompany && (
                <Alert variant="info">
                    <Info className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Company Found</p>
                        <p className="text-sm mt-1">
                            {preSelectedCompany.name} is detected as a {preSelectedCompany.entity_type.replace('_', ' ')} entity.
                            You can change this if needed.
                        </p>
                    </div>
                </Alert>
            )}

            {/* View Toggle */}
            <div className="flex justify-center mb-4">
                <div className="flex items-center bg-neutral-20 rounded-lg p-1">
                    <button
                        onClick={() => setShowDetailedView(false)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${!showDetailedView
                            ? 'bg-white text-neutral-90 shadow-sm'
                            : 'text-neutral-60 hover:text-neutral-80'
                            }`}
                    >
                        Quick View
                    </button>
                    <button
                        onClick={() => setShowDetailedView(true)}
                        className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all ${showDetailedView
                            ? 'bg-white text-neutral-90 shadow-sm'
                            : 'text-neutral-60 hover:text-neutral-80'
                            }`}
                    >
                        Detailed View
                    </button>
                </div>
            </div>

            {/* Entity Type Grid */}
            <div className={`grid gap-4 ${showDetailedView ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
                {ENTITY_TYPES.map((entityType) => {
                    const Icon = entityType.icon
                    const isSelected = selectedEntityType === entityType.type
                    const isHovered = hoveredEntityType === entityType.type
                    const isRecommended = preSelectedCompany?.entity_type === entityType.type

                    return (
                        <Card
                            key={entityType.type}
                            className={`cursor-pointer transition-all duration-300 ease-out transform ${isSelected
                                ? 'ring-2 ring-primary-500 bg-primary-50 scale-[1.02] shadow-fluent-2'
                                : isHovered
                                    ? 'shadow-fluent-2 -translate-y-1 bg-neutral-10'
                                    : 'hover:shadow-fluent-1 hover:bg-neutral-10'
                                }`}
                            onClick={() => onEntityTypeSelect(entityType.type)}
                        >
                            <CardContent className="p-4">
                                <div className="space-y-4" onMouseEnter={() => setHoveredEntityType(entityType.type)}
                                    onMouseLeave={() => setHoveredEntityType(null)}>
                                    {/* Header */}
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className={`
                                                flex items-center justify-center w-12 h-12 rounded-xl transition-all duration-300
                                                ${isSelected
                                                    ? 'bg-primary-100 text-primary-600 shadow-fluent-1'
                                                    : isHovered
                                                        ? 'bg-neutral-20 text-neutral-70 shadow-sm'
                                                        : 'bg-neutral-10 text-neutral-60'}
                                            `}>
                                                <Icon className="w-6 h-6" />
                                            </div>

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h4 className="font-semibold text-neutral-90 text-base">
                                                        {entityType.name}
                                                    </h4>

                                                    {entityType.isPopular && (
                                                        <Badge variant="success" size="sm">
                                                            <TrendingUp className="w-3 h-3 mr-1" />
                                                            Popular
                                                        </Badge>
                                                    )}

                                                    {isRecommended && (
                                                        <Badge variant="info" size="sm">
                                                            <CheckCircle className="w-3 h-3 mr-1" />
                                                            Recommended
                                                        </Badge>
                                                    )}

                                                    <Badge
                                                        variant={getComplexityColor(entityType.complexity) as any}
                                                        size="sm"
                                                        className="flex items-center gap-1"
                                                    >
                                                        {getComplexityIcon(entityType.complexity)}
                                                        {entityType.complexity}
                                                    </Badge>
                                                </div>

                                                <p className="text-sm text-neutral-60 mt-1">
                                                    {entityType.description}
                                                </p>

                                                {showDetailedView && (
                                                    <p className="text-xs text-neutral-50 mt-2 italic">
                                                        {entityType.businessContext}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {isSelected && (
                                            <div className="flex-shrink-0 ml-2">
                                                <div className="w-8 h-8 bg-success-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-success-700" />
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* Processing Methods */}
                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-medium text-neutral-70">Processing Methods:</p>
                                            <span className="text-xs text-neutral-50">
                                                {entityType.estimatedTime}
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {entityType.processingMethods.map((method, index) => {
                                                const MethodIcon = method.icon
                                                return (
                                                    <Badge
                                                        key={index}
                                                        variant={getProcessingMethodColor(method) as any}
                                                        size="sm"
                                                        className="flex items-center gap-1.5 px-2.5 py-1"
                                                    >
                                                        <MethodIcon className="w-3 h-3" />
                                                        <span>{method.name}</span>
                                                        {showDetailedView && (
                                                            <span className="text-xs opacity-75">
                                                                ({method.estimatedTime})
                                                            </span>
                                                        )}
                                                    </Badge>
                                                )
                                            })}
                                        </div>
                                    </div>

                                    {/* Examples */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-neutral-70">Examples:</p>
                                        <div className="flex flex-wrap gap-1.5">
                                            {entityType.examples.map((example, index) => (
                                                <span
                                                    key={index}
                                                    className="text-xs text-neutral-60 bg-neutral-20 px-2.5 py-1 rounded-md"
                                                >
                                                    {example}
                                                </span>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Requirements Preview */}
                                    <div className="space-y-2">
                                        <p className="text-sm font-medium text-neutral-70">Key Requirements:</p>
                                        <ul className="text-sm text-neutral-60 space-y-1">
                                            {entityType.requirements.slice(0, showDetailedView ? entityType.requirements.length : 3).map((req, index) => (
                                                <li key={index} className="flex items-start gap-2">
                                                    <span className="w-1.5 h-1.5 bg-primary-400 rounded-full flex-shrink-0 mt-2" />
                                                    <span>{req}</span>
                                                </li>
                                            ))}
                                            {!showDetailedView && entityType.requirements.length > 3 && (
                                                <li className="text-neutral-40 text-xs ml-3.5">
                                                    +{entityType.requirements.length - 3} more requirements
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    {/* Detailed Information (only in detailed view) */}
                                    {showDetailedView && (
                                        <>
                                            {/* Data Completeness Indicator */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-medium text-neutral-70">Expected Data Completeness:</p>
                                                    <span className="text-sm font-semibold text-primary-600">
                                                        {entityType.dataCompleteness}%
                                                    </span>
                                                </div>
                                                <div className="w-full bg-neutral-20 rounded-full h-2">
                                                    <div
                                                        className="bg-primary-500 h-2 rounded-full transition-all duration-500"
                                                        style={{ width: `${entityType.dataCompleteness}%` }}
                                                    />
                                                </div>
                                            </div>

                                            {/* Regulatory Notes */}
                                            {entityType.regulatoryNotes && (
                                                <div className="space-y-2">
                                                    <p className="text-sm font-medium text-neutral-70">Regulatory Notes:</p>
                                                    <ul className="text-xs text-neutral-50 space-y-1">
                                                        {entityType.regulatoryNotes.map((note, index) => (
                                                            <li key={index} className="flex items-start gap-2">
                                                                <Info className="w-3 h-3 text-info-700 flex-shrink-0 mt-0.5" />
                                                                <span>{note}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Selection Indicator */}
                                    {isSelected && (
                                        <div className="flex items-center gap-2 pt-2 border-t border-primary-200">
                                            <ArrowRight className="w-4 h-4 text-primary-600" />
                                            <span className="text-sm font-medium text-primary-700">
                                                Ready to proceed with this entity type
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {/* Selected Entity Info */}
            {selectedEntityType && (
                <Alert variant="success">
                    <CheckCircle className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Entity Type Selected</p>
                        <p className="text-sm mt-1">
                            {ENTITY_TYPES.find(e => e.type === selectedEntityType)?.name} -
                            Ready to proceed with processing method selection
                        </p>
                    </div>
                </Alert>
            )}

            {/* Enhanced Help Text */}
            <div className="bg-gradient-to-r from-primary-50 to-info-50 border border-primary-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                    <Info className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
                    <div className="space-y-3">
                        <h4 className="font-medium text-primary-900">Processing Methods Explained</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                            {Object.values(PROCESSING_METHODS).map((method) => {
                                const MethodIcon = method.icon
                                return (
                                    <div key={method.type} className="bg-white/60 rounded-lg p-3 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <MethodIcon className="w-4 h-4 text-primary-600" />
                                            <span className="font-semibold text-primary-900">{method.name}</span>
                                        </div>
                                        <p className="text-xs text-primary-700">{method.eligibilityReason}</p>
                                        <div className="flex items-center justify-between text-xs">
                                            <span className="text-primary-600">Time: {method.estimatedTime}</span>
                                            <span className="text-primary-600">Quality: {method.dataCompleteness}%</span>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                        {/* Workflow Path Indicator */}
                        {selectedEntityType && (
                            <div className="mt-4 p-3 bg-white/80 rounded-lg border border-primary-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowRight className="w-4 h-4 text-success-600" />
                                    <span className="font-medium text-success-800">Next Steps Available</span>
                                </div>
                                <p className="text-sm text-success-700">
                                    You can now proceed to select your preferred processing method for{' '}
                                    <span className="font-semibold">
                                        {ENTITY_TYPES.find(e => e.type === selectedEntityType)?.name}
                                    </span>
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}