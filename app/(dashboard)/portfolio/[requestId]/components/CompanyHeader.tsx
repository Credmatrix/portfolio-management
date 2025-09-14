'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Building2,
    MapPin,
    Calendar,
    Globe,
    Mail,
    Phone,
    TrendingUp,
    TrendingDown,
    Minus,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Star,
    Info,
    ChevronDown,
    ChevronUp,
    Maximize2,
    Minimize2
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'
import { Button } from '@/components/ui'

interface CompanyHeaderProps {
    company: PortfolioCompany
    industryBenchmarks?: any
    activeTab?: string
    isCollapsed?: boolean
    onToggleCollapse?: () => void
}

export function CompanyHeader({
    company,
    industryBenchmarks,
    activeTab = 'overview',
    isCollapsed = false,
    onToggleCollapse
}: CompanyHeaderProps) {
    // Helper function to extract rating details from Rating Type parameter
    const extractRatingDetails = (riskAnalysis: any) => {
        try {
            if (!riskAnalysis?.allScores) return null;

            const ratingTypeParam = riskAnalysis.allScores.find(
                (score: any) => score.parameter === 'Rating Type'
            );

            if (!ratingTypeParam || !ratingTypeParam.available || ratingTypeParam.value === 'Not Available') {
                return null;
            }

            return {
                rating_grade: ratingTypeParam.details?.rating_grade || null,
                rating_agency: ratingTypeParam.details?.rating_agency || null,
                rating_date: ratingTypeParam.details?.rating_date || null,
                rating_action: ratingTypeParam.details?.rating_action || null,
                rating_category: ratingTypeParam.details?.rating_category || null,
                instrument_type: ratingTypeParam.details?.instrument_type || null,
                score: ratingTypeParam.score || 0,
                benchmark: ratingTypeParam.benchmark || null
            };
        } catch (error) {
            console.error('Error extracting rating details:', error);
            return null;
        }
    }

    // Helper function to get enhanced rating badge styling
    const getEnhancedRatingBadge = (ratingDetails: any) => {
        if (!ratingDetails?.rating_grade) {
            return {
                variant: 'default' as const,
                label: 'Not Rated',
                color: 'bg-gray-100 text-gray-600 border-gray-200',
                category: 'No Rating',
                riskLevel: 'Unknown'
            }
        }

        const rating = ratingDetails.rating_grade;

        // Investment Grade ratings (high quality)
        const ratingConfig = {
            'AAA': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', category: 'Investment Grade', riskLevel: 'Extremely Low' },
            'AA+': { color: 'bg-emerald-100 text-emerald-800 border-emerald-200', category: 'Investment Grade', riskLevel: 'Very Low' },
            'AA': { color: 'bg-green-100 text-green-800 border-green-200', category: 'Investment Grade', riskLevel: 'Very Low' },
            'AA-': { color: 'bg-green-100 text-green-800 border-green-200', category: 'Investment Grade', riskLevel: 'Very Low' },
            'A+': { color: 'bg-blue-100 text-blue-800 border-blue-200', category: 'Investment Grade', riskLevel: 'Low' },
            'A': { color: 'bg-blue-100 text-blue-800 border-blue-200', category: 'Investment Grade', riskLevel: 'Low' },
            'A-': { color: 'bg-blue-100 text-blue-800 border-blue-200', category: 'Investment Grade', riskLevel: 'Low' },
            'BBB+': { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', category: 'Investment Grade', riskLevel: 'Moderate' },
            'BBB': { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', category: 'Investment Grade', riskLevel: 'Moderate' },
            'BBB-': { color: 'bg-cyan-100 text-cyan-800 border-cyan-200', category: 'Investment Grade', riskLevel: 'Moderate' },

            // Speculative Grade ratings (higher risk)
            'BB+': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', category: 'Speculative Grade', riskLevel: 'High' },
            'BB': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', category: 'Speculative Grade', riskLevel: 'High' },
            'BB-': { color: 'bg-yellow-100 text-yellow-800 border-yellow-200', category: 'Speculative Grade', riskLevel: 'High' },
            'B+': { color: 'bg-orange-100 text-orange-800 border-orange-200', category: 'Speculative Grade', riskLevel: 'Very High' },
            'B': { color: 'bg-orange-100 text-orange-800 border-orange-200', category: 'Speculative Grade', riskLevel: 'Very High' },
            'B-': { color: 'bg-orange-100 text-orange-800 border-orange-200', category: 'Speculative Grade', riskLevel: 'Very High' },
            'C+': { color: 'bg-red-100 text-red-800 border-red-200', category: 'Speculative Grade', riskLevel: 'Extremely High' },
            'C': { color: 'bg-red-100 text-red-800 border-red-200', category: 'Speculative Grade', riskLevel: 'Extremely High' },
            'C-': { color: 'bg-red-100 text-red-800 border-red-200', category: 'Speculative Grade', riskLevel: 'Extremely High' },
            'D': { color: 'bg-red-200 text-red-900 border-red-300', category: 'Default Grade', riskLevel: 'Default' }
        };

        const config = ratingConfig[rating as keyof typeof ratingConfig] || {
            color: 'bg-gray-100 text-gray-600 border-gray-200',
            category: 'Unknown Grade',
            riskLevel: 'Unknown'
        };

        return {
            variant: 'default' as const,
            label: rating,
            ...config
        }
    }

    const getRiskGradeBadge = (grade: string | null) => {
        if (!grade) return { variant: 'default' as const, label: 'N/A', color: 'text-gray-600' }

        switch (grade) {
            case 'CM1':
                return { variant: 'success' as const, label: 'CM1 - Excellent', color: 'text-green-700' }
            case 'CM2':
                return { variant: 'info' as const, label: 'CM2 - Good', color: 'text-blue-700' }
            case 'CM3':
                return { variant: 'warning' as const, label: 'CM3 - Average', color: 'text-yellow-700' }
            case 'CM4':
                return { variant: 'error' as const, label: 'CM4 - Poor', color: 'text-orange-700' }
            case 'CM5':
                return { variant: 'error' as const, label: 'CM5 - Critical Risk', color: 'text-red-700' }
            default:
                return { variant: 'default' as const, label: grade, color: 'text-gray-600' }
        }
    }

    const getStatusIcon = (status: string | null) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-5 h-5 text-green-500" />
            case 'processing':
                return <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            case 'failed':
                return <XCircle className="w-5 h-5 text-red-500" />
            case 'submitted':
                return <AlertTriangle className="w-5 h-5 text-yellow-500" />
            default:
                return <AlertTriangle className="w-5 h-5 text-gray-400" />
        }
    }

    const getTrendIcon = (value: number | null | undefined) => {
        if (!value) return <Minus className="w-4 h-4 text-gray-400" />
        if (value > 0) return <TrendingUp className="w-4 h-4 text-green-500" />
        if (value < 0) return <TrendingDown className="w-4 h-4 text-red-500" />
        return <Minus className="w-4 h-4 text-gray-400" />
    }

    const riskGradeBadge = getRiskGradeBadge(company.risk_grade)
    const aboutCompany = company.extracted_data['About the Company']
    const registeredAddress = aboutCompany?.addresses?.business_address
    const companyInfo = aboutCompany.company_info
    const riskAnalysis = company.risk_analysis

    // Extract rating details
    const ratingDetails = extractRatingDetails(company.risk_analysis)
    const ratingBadge = getEnhancedRatingBadge(ratingDetails)

    // Calculate some key metrics
    const overallScore = riskAnalysis?.overallPercentage || 0
    const parameterCoverage = company.total_parameters && company.available_parameters
        ? (company.available_parameters / company.total_parameters) * 100
        : 0

    // Determine if header should be auto-collapsed based on tab
    const shouldAutoCollapse = activeTab !== 'overview'
    const effectiveCollapsed = shouldAutoCollapse || isCollapsed

    return (
        <Card className="overflow-hidden transition-all duration-300 ease-in-out">
            <CardContent className="p-0">
                {/* Collapsed Header - Compact View */}
                {effectiveCollapsed && (
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-3 border-b border-neutral-20">
                        <div className="flex items-center justify-between">
                            {/* Compact Company Info */}
                            <div className="flex items-center gap-4">
                                <div className="p-2 bg-white rounded-lg shadow-sm border border-neutral-20">
                                    <Building2 className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                    <h1 className="text-lg font-bold text-neutral-90">
                                        {company.company_name || 'Unknown Company'}
                                    </h1>
                                    <div className="flex items-center gap-3 text-xs text-neutral-60">
                                        <span className="flex items-center gap-1">
                                            {getStatusIcon(company.status)}
                                            {company.status}
                                        </span>
                                        {registeredAddress?.industry && (
                                            <span>{registeredAddress.industry}</span>
                                        )}
                                        {registeredAddress?.state && (
                                            <span className="flex items-center gap-1">
                                                <MapPin className="w-3 h-3" />
                                                {registeredAddress.city}, {registeredAddress.state}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Compact Metrics */}
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <div className="text-sm font-bold text-neutral-90">
                                        {company.risk_score?.toFixed(1) || 'N/A'}%
                                    </div>
                                    <div className="text-xs text-neutral-60">Risk Score</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-sm font-bold text-green-700">
                                        ₹{company.recommended_limit?.toFixed(1) || 0}Cr
                                    </div>
                                    <div className="text-xs text-neutral-60">Credit Limit</div>
                                </div>
                                <div className="text-center">
                                    <span
                                        className={`px-3 py-1 rounded-full text-sm font-bold border ${ratingBadge.color}`}
                                    >
                                        {ratingBadge.label}
                                    </span>
                                </div>

                                {/* Expand Button */}
                                {onToggleCollapse && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onToggleCollapse}
                                        className="flex items-center gap-1 text-neutral-60 hover:text-neutral-90"
                                    >
                                        <Maximize2 className="w-4 h-4" />
                                        <span className="text-xs">Expand</span>
                                    </Button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Full Header - Expanded View */}
                {!effectiveCollapsed && (
                    <>
                        {/* Header Background */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 px-8 py-6 border-b border-neutral-20">
                            <div className="flex items-start justify-between">
                                {/* Company Info */}
                                <div className="flex items-start gap-6">
                                    {/* Company Icon */}
                                    <div className="p-4 bg-white rounded-xl shadow-sm border border-neutral-20">
                                        <Building2 className="w-8 h-8 text-blue-600" />
                                    </div>

                                    {/* Company Details */}
                                    <div className="space-y-3">
                                        <div>
                                            <h1 className="text-3xl font-bold text-neutral-90 mb-2">
                                                {company.company_name || 'Unknown Company'}
                                            </h1>
                                            <div className="flex items-center gap-4 text-sm text-neutral-60">
                                                <span className="font-mono bg-white px-2 py-1 rounded border">
                                                    ID: {company.request_id}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {getStatusIcon(company.status)}
                                                    Processing {company.status || 'unknown'}
                                                </span>
                                                {company.completed_at && (
                                                    <span className="flex items-center gap-1">
                                                        <Calendar className="w-4 h-4" />
                                                        Completed {formatDate(company.completed_at)}
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Company Basic Info */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                            {registeredAddress?.industry && (
                                                <div className="flex items-center gap-2">
                                                    <span className="text-neutral-60">Industry:</span>
                                                    <span className="font-small text-neutral-90">{registeredAddress.industry}</span>
                                                </div>
                                            )}

                                            {registeredAddress?.state && (
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="w-4 h-4 text-neutral-60" />
                                                    <span className="text-neutral-90">{registeredAddress.city}, {registeredAddress.state}</span>
                                                </div>
                                            )}

                                            {registeredAddress?.website && (
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-4 h-4 text-neutral-60" />
                                                    <a
                                                        href={registeredAddress.website}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-blue-600 hover:text-blue-700 hover:underline"
                                                    >
                                                        Website
                                                    </a>
                                                </div>
                                            )}

                                            {registeredAddress?.date_of_incorporation && (
                                                <div className="flex items-center gap-2">
                                                    <Calendar className="w-4 h-4 text-neutral-60" />
                                                    <span className="text-neutral-90">
                                                        Est. {new Date(registeredAddress.date_of_incorporation).getFullYear()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Credit Rating & Collapse Button */}
                                <div className="flex items-start gap-4">
                                    <div className="text-center">
                                        <div className="flex items-center justify-center gap-2 mb-2">
                                            {ratingBadge.label !== "Not Rated" && ratingDetails?.benchmark && ratingDetails.benchmark === 'Excellent' && <Star className="w-5 h-5 text-yellow-500" />}
                                            <div className="relative group">
                                                <div className="flex items-center gap-1">
                                                    <span
                                                        className={`px-4 py-2 rounded-full text-lg font-bold border-2 cursor-help ${ratingBadge.color}`}
                                                    >
                                                        {ratingBadge.label}
                                                    </span>
                                                    {ratingBadge.label !== "Not Rated" && ratingDetails?.benchmark && (
                                                        <span className={`text-xs px-2 py-1 rounded-full ${ratingDetails.benchmark === 'Excellent' ? 'bg-green-50 text-green-700' :
                                                            ratingDetails.benchmark === 'Good' ? 'bg-blue-50 text-blue-700' :
                                                                ratingDetails.benchmark === 'Average' ? 'bg-yellow-50 text-yellow-700' :
                                                                    ratingDetails.benchmark === 'Poor' ? 'bg-red-50 text-red-700' :
                                                                        'bg-gray-50 text-gray-700'
                                                            }`}>
                                                            {ratingDetails.benchmark}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Tooltip on hover */}
                                                {ratingDetails && (
                                                    <div className="absolute bottom-full top-1 left-1/4 transform -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                                        <div className="bg-neutral-900 text-white text-xs rounded-lg py-2 px-3 whitespace-nowrap shadow-lg">
                                                            <div className="font-semibold">{ratingDetails.instrument_type}</div>
                                                            <div>{ratingBadge.category} - {ratingBadge.riskLevel} Risk</div>
                                                            {/* Tooltip arrow */}
                                                            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-neutral-900"></div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Rating Details */}
                                        {ratingDetails && (
                                            <div className="space-y-1">
                                                <div className="text-sm font-medium text-neutral-90">
                                                    {ratingDetails.rating_agency}
                                                </div>
                                                {ratingDetails.rating_date && (
                                                    <div className="text-xs text-neutral-60">
                                                        {new Date(ratingDetails.rating_date).toLocaleDateString('en-IN', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </div>
                                                )}
                                                {ratingDetails.rating_action && (
                                                    <div className={`text-xs px-2 py-1 rounded-full inline-block ${ratingDetails.rating_action === 'Reaffirmed' ? 'bg-green-50 text-green-700 border border-green-200' :
                                                        ratingDetails.rating_action === 'Upgraded' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                            ratingDetails.rating_action === 'Downgraded' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                ratingDetails.rating_action === 'Assigned' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                                                                    'bg-gray-50 text-gray-700 border border-gray-200'
                                                        }`}>
                                                        {ratingDetails.rating_action}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {!ratingDetails && (
                                            <div className="space-y-1">
                                                <div className="text-sm text-neutral-60">Credit Rating</div>
                                                <div className="text-xs text-neutral-50">Not Available</div>
                                            </div>
                                        )}

                                        <div className="mt-2">
                                            <div className="text-sm text-neutral-60">Credit Rating</div>
                                        </div>
                                    </div>

                                    {/* Collapse Button */}
                                    {onToggleCollapse && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={onToggleCollapse}
                                            className="flex items-center gap-1 text-neutral-60 hover:text-neutral-90 mt-2"
                                        >
                                            <Minimize2 className="w-4 h-4" />
                                            <span className="text-xs">Collapse</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Key Metrics Row */}
                        <div className="px-8 py-6">
                            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3 gap-6">
                                {/* Risk Score */}
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-neutral-90 mb-1">
                                        {company.risk_score?.toFixed(1) || 'N/A'}%
                                    </div>
                                    <div className="text-sm text-neutral-60">Risk Score</div>
                                </div>

                                {/* Recommended Limit */}
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-green-700 mb-1">
                                        ₹{company.recommended_limit?.toFixed(1) || 0}Cr
                                    </div>
                                    <div className="text-sm text-neutral-60">Credit Limit</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-2xl font-bold text-neutral-90 mb-1">
                                        {company.risk_grade}
                                    </div>
                                    <div className="text-sm text-neutral-60">Risk Grade</div>
                                </div>
                            </div>
                        </div>

                        {/* Company Legal Info */}
                        {companyInfo && (
                            <div className="px-8 py-4 bg-neutral-5 border-t border-neutral-20">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                                    {companyInfo.cin && (
                                        <div>
                                            <span className="text-neutral-60">CIN:</span>
                                            <span className="ml-2 font-mono text-neutral-90">{companyInfo.cin}</span>
                                        </div>
                                    )}

                                    {companyInfo.pan && (
                                        <div>
                                            <span className="text-neutral-60">PAN:</span>
                                            <span className="ml-2 font-mono text-neutral-90">{companyInfo.pan}</span>
                                        </div>
                                    )}

                                    {companyInfo.company_status && (
                                        <div>
                                            <span className="text-neutral-60">Status:</span>
                                            <span className="ml-2 text-neutral-90">{companyInfo.company_status}</span>
                                        </div>
                                    )}

                                    {registeredAddress.segment && (
                                        <div>
                                            <span className="text-neutral-60">Segment:</span>
                                            <span className="ml-2 text-neutral-90">{registeredAddress.segment}</span>
                                        </div>
                                    )}
                                </div>

                                {/* Contact Information */}
                                {(registeredAddress.email || registeredAddress.phone) && (
                                    <div className="flex items-center gap-6 mt-3 pt-3 border-t border-neutral-20">
                                        {registeredAddress.email && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Mail className="w-4 h-4 text-neutral-60" />
                                                <a
                                                    href={`mailto:${registeredAddress.email}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    {registeredAddress.email}
                                                </a>
                                            </div>
                                        )}

                                        {registeredAddress.phone && (
                                            <div className="flex items-center gap-2 text-sm">
                                                <Phone className="w-4 h-4 text-neutral-60" />
                                                <a
                                                    href={`tel:${registeredAddress.phone}`}
                                                    className="text-blue-600 hover:text-blue-700 hover:underline"
                                                >
                                                    {registeredAddress.phone}
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </CardContent>
        </Card>
    )
}