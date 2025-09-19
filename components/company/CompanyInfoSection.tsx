'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Building2,
    MapPin,
    Calendar,
    Globe,
    Mail,
    Phone,
    FileText,
    CreditCard,
    Users,
    Factory,
    Banknote,
    Shield,
    ExternalLink,
    Info
} from 'lucide-react'
import { formatCurrency, formatDate } from '@/lib/utils'

interface CompanyInfoSectionProps {
    company: PortfolioCompany
}

export function CompanyInfoSection({ company }: CompanyInfoSectionProps) {
    const aboutCompany = company.extracted_data?.['About the Company']

    if (!aboutCompany) {
        return (
            <Card>
                <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 bg-neutral-10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Info className="w-8 h-8 text-neutral-50" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                        Company Information Unavailable
                    </h3>
                    <p className="text-neutral-60">
                        Company details are not available for this record.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const businessAddress = aboutCompany.addresses?.business_address
    const registeredAddress = aboutCompany.addresses?.registered_address
    const companyInfo = aboutCompany.company_info
    const contactInfo = aboutCompany.contact_info

    const formatCapital = (value: string | number) => {
        if (!value) return 'N/A'
        const numValue = typeof value === 'string' ? parseFloat(value) : value
        return `₹${numValue.toFixed(2)} Cr`
    }

    const getComplianceStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'active compliant':
                return 'bg-green-100 text-green-800 border-green-200'
            case 'active':
                return 'bg-blue-100 text-blue-800 border-blue-200'
            case 'inactive':
                return 'bg-red-100 text-red-800 border-red-200'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    const getListingStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'listed':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200'
            case 'unlisted':
                return 'bg-orange-100 text-orange-800 border-orange-200'
            default:
                return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    return (
        <div className="space-y-6">
            {/* Company Overview */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Building2 className="w-5 h-5" />
                        Company Overview
                    </h3>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* About the Company */}
                    {businessAddress?.about_the_company && (
                        <div>
                            <h4 className="text-sm font-medium text-neutral-70 mb-2">About the Company</h4>
                            <p className="text-sm text-neutral-80 leading-relaxed">
                                {businessAddress.about_the_company}
                            </p>
                        </div>
                    )}

                    {/* Eligibility Metrics */}
                    {company.risk_analysis?.eligibility && (
                        <div className="mb-6">
                            <h4 className="text-sm font-medium text-neutral-70 mb-4 flex items-center gap-2">
                                <CreditCard className="w-4 h-4" />
                                Credit Eligibility Metrics
                            </h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-900 mb-1">
                                        {company.risk_analysis.eligibility.riskScore !== undefined &&
                                            company.risk_analysis.eligibility.riskScore !== null
                                            ? `${Number(company.risk_analysis.eligibility.riskScore).toFixed(2)}%`
                                            : 'N/A'
                                        }
                                    </div>
                                    <div className="text-xs font-medium text-blue-700">Risk Score</div>
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-900 mb-1">
                                        {company.risk_analysis.eligibility.riskGrade || 'N/A'}
                                    </div>
                                    <div className="text-xs font-medium text-purple-700">Risk Grade</div>
                                </div>

                                <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-green-900 mb-1">
                                        ₹{company.risk_analysis.eligibility.turnoverCr || 'N/A'}Cr
                                    </div>
                                    <div className="text-xs font-medium text-green-700">Turnover</div>
                                </div>

                                <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-xl p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-900 mb-1">
                                        ₹{company.risk_analysis.eligibility.netWorthCr || 'N/A'}Cr
                                    </div>
                                    <div className="text-xs font-medium text-orange-700">Net Worth</div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Key Details Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Industry & Sector */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70 flex items-center gap-2">
                                <Factory className="w-4 h-4" />
                                Industry & Sector
                            </h4>
                            <div className="space-y-2">
                                {businessAddress?.industry && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Industry:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {businessAddress.industry}
                                        </Badge>
                                    </div>
                                )}
                                {businessAddress?.segment && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Segment:</span>
                                        <Badge variant="outline" className="text-xs">
                                            {businessAddress.segment}
                                        </Badge>
                                    </div>
                                )}
                                {businessAddress?.broad_industry_category && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Category:</span>
                                        <span className="text-sm text-neutral-90">
                                            {businessAddress.broad_industry_category}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Corporate Status */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Corporate Status
                            </h4>
                            <div className="space-y-2">
                                {companyInfo?.company_status && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Status:</span>
                                        <Badge className={`text-xs border ${getComplianceStatusBadge(companyInfo.company_status)}`}>
                                            {companyInfo.company_status}
                                        </Badge>
                                    </div>
                                )}
                                {companyInfo?.active_compliance && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Compliance:</span>
                                        <Badge className={`text-xs border ${getComplianceStatusBadge(companyInfo.active_compliance)}`}>
                                            {companyInfo.active_compliance}
                                        </Badge>
                                    </div>
                                )}
                                {businessAddress?.listing_status && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Listing:</span>
                                        <Badge className={`text-xs border ${getListingStatusBadge(businessAddress.listing_status)}`}>
                                            {businessAddress.listing_status}
                                        </Badge>
                                    </div>
                                )}
                                {businessAddress?.type_of_entity && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Entity Type:</span>
                                        <span className="text-xs text-neutral-90 text-right max-w-32">
                                            {businessAddress.type_of_entity}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Financial Overview */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70 flex items-center gap-2">
                                <Banknote className="w-4 h-4" />
                                Financial Overview
                            </h4>
                            <div className="space-y-2">
                                {companyInfo?.['paid_up_capital_(crore)'] && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Paid-up Capital:</span>
                                        <span className="text-sm font-medium text-neutral-90">
                                            {formatCapital(companyInfo['paid_up_capital_(crore)'])}
                                        </span>
                                    </div>
                                )}
                                {companyInfo?.['authorised_capital_(crore)'] && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Authorised Capital:</span>
                                        <span className="text-sm font-medium text-neutral-90">
                                            {formatCapital(companyInfo['authorised_capital_(crore)'])}
                                        </span>
                                    </div>
                                )}
                                {companyInfo?.['sum_of_charges_(crore)'] && (
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Sum of Charges:</span>
                                        <span className="text-sm font-medium text-neutral-90">
                                            {formatCapital(companyInfo['sum_of_charges_(crore)'])}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Legal & Registration Details */}
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <FileText className="w-5 h-5" />
                        Legal & Registration Details
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Corporate Identifiers */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70">Corporate Identifiers</h4>
                            <div className="space-y-2">
                                {companyInfo?.cin && (
                                    <div>
                                        <span className="text-xs text-neutral-60">CIN:</span>
                                        <div className="font-mono text-sm text-neutral-90 bg-neutral-5 px-2 py-1 rounded mt-1">
                                            {companyInfo.cin}
                                        </div>
                                    </div>
                                )}
                                {companyInfo?.pan && (
                                    <div>
                                        <span className="text-xs text-neutral-60">PAN:</span>
                                        <div className="font-mono text-sm text-neutral-90 bg-neutral-5 px-2 py-1 rounded mt-1">
                                            {companyInfo.pan}
                                        </div>
                                    </div>
                                )}
                                {businessAddress?.lei && (
                                    <div>
                                        <span className="text-xs text-neutral-60">LEI:</span>
                                        <div className="font-mono text-sm text-neutral-90 bg-neutral-5 px-2 py-1 rounded mt-1">
                                            {businessAddress.lei}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Important Dates */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70 flex items-center gap-2">
                                <Calendar className="w-4 h-4" />
                                Important Dates
                            </h4>
                            <div className="space-y-2">
                                {businessAddress?.date_of_incorporation && (
                                    <div>
                                        <span className="text-xs text-neutral-60">Incorporation:</span>
                                        <div className="text-sm text-neutral-90 mt-1">
                                            {businessAddress.date_of_incorporation}
                                        </div>
                                    </div>
                                )}
                                {businessAddress?.date_of_last_agm && (
                                    <div>
                                        <span className="text-xs text-neutral-60">Last AGM:</span>
                                        <div className="text-sm text-neutral-90 mt-1">
                                            {businessAddress.date_of_last_agm}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>



                        {/* Legal Name */}
                        <div className="space-y-3">
                            <h4 className="text-sm font-medium text-neutral-70">Legal Information</h4>
                            <div className="space-y-2">
                                {companyInfo?.legal_name && (
                                    <div>
                                        <span className="text-xs text-neutral-60">Legal Name:</span>
                                        <div className="text-sm text-neutral-90 mt-1 font-medium">
                                            {companyInfo.legal_name}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Address & Contact Information */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Business Address */}
                {businessAddress && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                <MapPin className="w-5 h-5" />
                                Business Address
                            </h3>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                {businessAddress.address_line_1 && (
                                    <div className="text-sm text-neutral-90">
                                        {businessAddress.address_line_1}
                                    </div>
                                )}
                                {businessAddress.address_line_2 && businessAddress.address_line_2 !== '-' && (
                                    <div className="text-sm text-neutral-90">
                                        {businessAddress.address_line_2}
                                    </div>
                                )}
                                <div className="text-sm text-neutral-90">
                                    {businessAddress.city && `${businessAddress.city}, `}
                                    {businessAddress.state}
                                    {businessAddress.pin_code && ` - ${businessAddress.pin_code}`}
                                </div>
                            </div>

                            {/* Contact Information */}
                            <div className="pt-4 border-t border-neutral-20 space-y-3">
                                {businessAddress.phone && (
                                    <div className="flex items-center gap-2">
                                        <Phone className="w-4 h-4 text-neutral-60" />
                                        <a
                                            href={`tel:${businessAddress.phone}`}
                                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            {businessAddress.phone}
                                        </a>
                                    </div>
                                )}
                                {businessAddress.email && (
                                    <div className="flex items-center gap-2">
                                        <Mail className="w-4 h-4 text-neutral-60" />
                                        <a
                                            href={`mailto:${businessAddress.email}`}
                                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline"
                                        >
                                            {businessAddress.email}
                                        </a>
                                    </div>
                                )}
                                {businessAddress.website && (
                                    <div className="flex items-center gap-2">
                                        <Globe className="w-4 h-4 text-neutral-60" />
                                        <a
                                            href={businessAddress.website}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-sm text-blue-600 hover:text-blue-700 hover:underline flex items-center gap-1"
                                        >
                                            Visit Website
                                            <ExternalLink className="w-3 h-3" />
                                        </a>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Registered Address */}
                {registeredAddress && (
                    <Card>
                        <CardHeader>
                            <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                <Building2 className="w-5 h-5" />
                                Registered Address
                            </h3>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {registeredAddress.address_line_1 && (
                                    <div className="text-sm text-neutral-90">
                                        {registeredAddress.address_line_1}
                                    </div>
                                )}
                                {registeredAddress.address_line_2 && registeredAddress.address_line_2 !== '-' && (
                                    <div className="text-sm text-neutral-90">
                                        {registeredAddress.address_line_2}
                                    </div>
                                )}
                                <div className="text-sm text-neutral-90">
                                    {registeredAddress.city && `${registeredAddress.city}, `}
                                    {registeredAddress.state}
                                    {registeredAddress.pin_code && ` - ${registeredAddress.pin_code}`}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    )
}