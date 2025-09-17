'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    Scale,
    AlertTriangle,
    CheckCircle,
    Clock,
    Building2,
    FileText,
    TrendingUp,
    Filter,
    Calendar,
    MapPin,
    Users,
    Gavel,
    XCircle,
    Info,
    ChevronDown,
    ChevronUp,
    Search,
    BarChart3
} from 'lucide-react'

interface LegalHistorySectionProps {
    company: PortfolioCompany
}

interface LegalCase {
    court: string
    case_no: string
    litigant: string
    case_type: string
    case_status: string
    case_category: string
    date_of_last_hearing_judgement: string
    _row_index: number
}

export function LegalHistorySection({ company }: LegalHistorySectionProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [selectedCaseType, setSelectedCaseType] = useState<string>('all') // New filter for filed by/against
    const [timeFilter, setTimeFilter] = useState<string>('last_year') // New time filter
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedCase, setExpandedCase] = useState<number | null>(null)
    const [showFilters, setShowFilters] = useState(false)

    const legalData = company.extracted_data?.['Legal History']?.data || []

    // Helper function to parse dates
    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr || dateStr === '-') return null
        try {
            // Handle various date formats
            const cleanDateStr = dateStr.trim()

            // Try different date formats
            const formats = [
                /^(\d{1,2})\s+(\w{3}),?\s+(\d{4})$/,  // 11 Apr, 2025
                /^(\d{1,2})-(\w{3})-(\d{4})$/,        // 11-Apr-2025
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,    // 11/04/2025
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/,      // 2025-04-11
            ]

            const monthMap: Record<string, number> = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            }

            // Try format: "11 Apr, 2025"
            const match1 = cleanDateStr.match(formats[0])
            if (match1) {
                const day = parseInt(match1[1])
                const month = monthMap[match1[2]]
                const year = parseInt(match1[3])
                if (month !== undefined) {
                    return new Date(year, month, day)
                }
            }

            // Fallback to native Date parsing
            const nativeDate = new Date(cleanDateStr)
            if (!isNaN(nativeDate.getTime())) {
                return nativeDate
            }
        } catch (error) {
            console.warn('Error parsing date:', dateStr, error)
        }
        return null
    }

    // Filter and process legal cases
    const processedCases = useMemo(() => {
        if (!Array.isArray(legalData)) return []

        const now = new Date()
        const oneYearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
        const twoYearsAgo = new Date(now.getFullYear() - 2, now.getMonth(), now.getDate())

        return legalData
            .filter((case_: LegalCase) => case_.court && case_.case_no && case_._row_index < 450)
            .filter((case_: LegalCase) => {
                // Time filter
                if (timeFilter !== 'all') {
                    const caseDate = parseDate(case_.date_of_last_hearing_judgement)
                    if (caseDate) {
                        if (timeFilter === 'last_year' && caseDate < oneYearAgo) return false
                        if (timeFilter === 'last_two_years' && caseDate < twoYearsAgo) return false
                    } else if (timeFilter !== 'all') {
                        // If no date and we're filtering by time, exclude unless it's pending
                        return case_.case_status === 'Pending'
                    }
                }

                // Category filter
                const matchesCategory = selectedCategory === 'all' || case_.case_category === selectedCategory

                // Status filter
                const matchesStatus = selectedStatus === 'all' || case_.case_status === selectedStatus

                // Case type filter (filed by vs against)
                const matchesCaseType = selectedCaseType === 'all' ||
                    (selectedCaseType === 'filed_by' && case_.case_type === 'Filed By this Corporate') ||
                    (selectedCaseType === 'filed_against' && case_.case_type === 'Filed Against this Corporate')

                // Search filter
                const matchesSearch = searchTerm === '' ||
                    case_.litigant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    case_.case_no?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    case_.court?.toLowerCase().includes(searchTerm.toLowerCase())

                return matchesCategory && matchesStatus && matchesCaseType && matchesSearch
            })
            .sort((a, b) => {
                // Sort by status (pending first), then by date
                if (a.case_status !== b.case_status) {
                    return a.case_status === 'Pending' ? -1 : 1
                }
                const dateA = parseDate(a.date_of_last_hearing_judgement)
                const dateB = parseDate(b.date_of_last_hearing_judgement)
                if (!dateA && !dateB) return 0
                if (!dateA) return 1
                if (!dateB) return -1
                return dateB.getTime() - dateA.getTime()
            })
    }, [legalData, selectedCategory, selectedStatus, selectedCaseType, timeFilter, searchTerm])

    // Analytics
    const analytics = useMemo(() => {
        const totalCases = processedCases.length
        const pendingCases = processedCases.filter(c => c.case_status === 'Pending').length
        const disposedCases = processedCases.filter(c => c.case_status === 'Disposed').length

        // Cases filed by vs against the corporate
        const filedByCorporate = processedCases.filter(c => c.case_type === 'Filed By this Corporate').length
        const filedAgainstCorporate = processedCases.filter(c => c.case_type === 'Filed Against this Corporate').length

        const categoryCounts = processedCases.reduce((acc, case_) => {
            acc[case_.case_category] = (acc[case_.case_category] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const courtCounts = processedCases.reduce((acc, case_) => {
            const courtType = case_.court?.includes('SUPREME COURT') ? 'Supreme Court' :
                case_.court?.includes('HIGH COURT') ? 'High Court' :
                    case_.court?.includes('TRIBUNAL') ? 'Tribunal' :
                        case_.court?.includes('DISTRICT') ? 'District Court' : 'Other'
            acc[courtType] = (acc[courtType] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        // Recent activity based on current time filter
        const now = new Date()
        const cutoffDate = timeFilter === 'last_year' ?
            new Date(now.getFullYear() - 1, now.getMonth(), now.getDate()) :
            timeFilter === 'last_two_years' ?
                new Date(now.getFullYear() - 2, now.getMonth(), now.getDate()) :
                new Date(now.getFullYear() - 10, now.getMonth(), now.getDate()) // For 'all'

        const recentActivity = processedCases.filter(case_ => {
            const caseDate = parseDate(case_.date_of_last_hearing_judgement)
            return caseDate && caseDate >= cutoffDate
        }).length

        // Risk assessment based on pending cases against the corporate
        const pendingAgainst = processedCases.filter(c =>
            c.case_status === 'Pending' && c.case_type === 'Filed Against this Corporate'
        ).length

        return {
            totalCases,
            pendingCases,
            disposedCases,
            filedByCorporate,
            filedAgainstCorporate,
            pendingAgainst,
            categoryCounts,
            courtCounts,
            recentActivity,
            riskScore: pendingAgainst > 5 ? 'High' : pendingAgainst > 2 ? 'Medium' : 'Low'
        }
    }, [processedCases, timeFilter])

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return <Clock className="w-4 h-4 text-orange-500" />
            case 'disposed':
                return <CheckCircle className="w-4 h-4 text-green-500" />
            default:
                return <Info className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status.toLowerCase()) {
            case 'pending':
                return 'warning'
            case 'disposed':
                return 'success'
            default:
                return 'secondary'
        }
    }

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'Insolvency':
                return <Building2 className="w-4 h-4" />
            case 'Arbitration Matters':
                return <Scale className="w-4 h-4" />
            case 'Civil Cases':
                return <FileText className="w-4 h-4" />
            case 'Criminal Appeals':
                return <AlertTriangle className="w-4 h-4" />
            case 'Taxation Matters':
                return <BarChart3 className="w-4 h-4" />
            default:
                return <Gavel className="w-4 h-4" />
        }
    }

    const getRiskColor = (riskScore: string) => {
        switch (riskScore) {
            case 'High':
                return 'text-red-600 bg-red-50 border-red-200'
            case 'Medium':
                return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'Low':
                return 'text-green-600 bg-green-50 border-green-200'
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const categories = [...new Set(legalData.map((case_: LegalCase) => case_.case_category).filter(Boolean))]
    const statuses = [...new Set(legalData.map((case_: LegalCase) => case_.case_status).filter(Boolean))]

    const formatDateForDisplay = (dateStr: string): string => {
        const parsed = parseDate(dateStr)
        if (parsed) {
            return parsed.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        }
        return dateStr || 'Not specified'
    }

    return (
        <div className="space-y-6">
            {/* Legal Risk Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Scale className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-neutral-90">Legal Risk Overview</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getRiskColor(analytics.riskScore)}`}>
                            {analytics.riskScore} Risk
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900">{analytics.totalCases}</div>
                            <div className="text-sm text-blue-600">Total Cases</div>
                            <div className="text-xs text-blue-500 mt-1">
                                {timeFilter === 'last_year' ? 'Last Year' :
                                    timeFilter === 'last_two_years' ? 'Last 2 Years' : 'All Time'}
                            </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="text-2xl font-bold text-orange-900">{analytics.pendingCases}</div>
                            <div className="text-sm text-orange-600">Pending Cases</div>
                            <div className="text-xs text-orange-500 mt-1">Active litigation</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-2xl font-bold text-green-900">{analytics.disposedCases}</div>
                            <div className="text-sm text-green-600">Disposed Cases</div>
                            <div className="text-xs text-green-500 mt-1">Resolved matters</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-2xl font-bold text-red-900">{analytics.filedAgainstCorporate}</div>
                            <div className="text-sm text-red-600">Filed Against</div>
                            <div className="text-xs text-red-500 mt-1">Defensive cases</div>
                        </div>
                        <div className="text-center p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div className="text-2xl font-bold text-indigo-900">{analytics.filedByCorporate}</div>
                            <div className="text-sm text-indigo-600">Filed By Company</div>
                            <div className="text-xs text-indigo-500 mt-1">Offensive cases</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="text-2xl font-bold text-purple-900">{analytics.recentActivity}</div>
                            <div className="text-sm text-purple-600">Recent Activity</div>
                            <div className="text-xs text-purple-500 mt-1">Active hearings</div>
                        </div>
                    </div>

                    {/* Court Distribution */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <h4 className="font-medium text-neutral-90 mb-3">Cases by Court Level</h4>
                            <div className="space-y-2">
                                {Object.entries(analytics.courtCounts).map(([court, count]) => (
                                    <div key={court} className="flex items-center justify-between p-2 bg-neutral-10 rounded">
                                        <span className="text-sm text-neutral-70">{court}</span>
                                        <span className="font-medium text-neutral-90">{`${count}`}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-medium text-neutral-90 mb-3">Cases by Category</h4>
                            <div className="space-y-2">
                                {Object.entries(analytics.categoryCounts)
                                    .sort(([, a], [, b]) => (b as number) - (a as number))
                                    .slice(0, 5)
                                    .map(([category, count]) => (
                                        <div key={category} className="flex items-center justify-between p-2 bg-neutral-10 rounded">
                                            <div className="flex items-center gap-2">
                                                {getCategoryIcon(category)}
                                                <span className="text-sm text-neutral-70">{category}</span>
                                            </div>
                                            <span className="font-medium text-neutral-90">{`${count}`}</span>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters and Search */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-90">Legal Cases ({processedCases.length})</h3>
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors"
                        >
                            <Filter className="w-4 h-4" />
                            Filters
                            {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                        </button>
                    </div>
                </CardHeader>
                {showFilters && (
                    <CardContent className="border-t">
                        <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-neutral-70 mb-1">Search</label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-50" />
                                    <input
                                        type="text"
                                        placeholder="Search cases..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="w-full pl-10 pr-3 py-2 border border-neutral-30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-70 mb-1">Time Period</label>
                                <select
                                    value={timeFilter}
                                    onChange={(e) => setTimeFilter(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="last_year">Last Year</option>
                                    <option value="last_two_years">Last 2 Years</option>
                                    <option value="all">All Time</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-70 mb-1">Case Type</label>
                                <select
                                    value={selectedCaseType}
                                    onChange={(e) => setSelectedCaseType(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Types</option>
                                    <option value="filed_against">Filed Against Company</option>
                                    <option value="filed_by">Filed By Company</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-70 mb-1">Category</label>
                                <select
                                    value={selectedCategory}
                                    onChange={(e) => setSelectedCategory(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Categories</option>
                                    {categories.map(category => (
                                        <option key={`${category}`} value={`${category}`}>{`${category}`}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-neutral-70 mb-1">Status</label>
                                <select
                                    value={selectedStatus}
                                    onChange={(e) => setSelectedStatus(e.target.value)}
                                    className="w-full px-3 py-2 border border-neutral-30 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="all">All Statuses</option>
                                    {statuses.map(status => (
                                        <option key={`${status}`} value={`${status}`}>{`${status}`}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="flex items-end">
                                <button
                                    onClick={() => {
                                        setSelectedCategory('all')
                                        setSelectedStatus('all')
                                        setSelectedCaseType('all')
                                        setTimeFilter('last_year')
                                        setSearchTerm('')
                                    }}
                                    className="px-4 py-2 text-sm bg-neutral-20 text-neutral-70 rounded-md hover:bg-neutral-30 transition-colors"
                                >
                                    Clear Filters
                                </button>
                            </div>
                        </div>
                    </CardContent>
                )}
            </Card>

            {/* Cases Table */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Gavel className="w-5 h-5 text-purple-600" />
                        <h4 className="text-lg font-semibold text-neutral-90">Legal Cases Details</h4>
                        <Badge variant="info" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {timeFilter === 'last_year' ? 'Last Year' :
                                timeFilter === 'last_two_years' ? 'Last 2 Years' : 'All Time'}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    {processedCases.length === 0 ? (
                        <div className="text-center py-8">
                            <Scale className="w-12 h-12 text-neutral-40 mx-auto mb-3" />
                            <p className="text-neutral-60">No legal cases found matching your criteria.</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-purple-50 border-b border-purple-200">
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Case Details
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Court & Category
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Litigant
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                            Case Type
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                            Status
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Last Activity
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {processedCases.map((case_, index) => (
                                        <tr key={`${case_.case_no}-${index}`}
                                            className={`${index % 2 === 0 ? 'bg-white' : 'bg-neutral-5'} hover:bg-blue-50 transition-colors`}>
                                            <td className="border border-neutral-200 p-3">
                                                <div className="font-medium text-neutral-90 mb-1">
                                                    {case_.case_no}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {getCategoryIcon(case_.case_category)}
                                                    <span className="text-xs text-neutral-60">{case_.case_category}</span>
                                                </div>
                                            </td>
                                            <td className="border border-neutral-200 p-3">
                                                <div className="text-sm font-medium text-neutral-90 mb-1">
                                                    {case_.court}
                                                </div>
                                                <Badge variant="secondary" size="sm">
                                                    {case_.case_category}
                                                </Badge>
                                            </td>
                                            <td className="border border-neutral-200 p-3">
                                                <div className="text-sm text-neutral-90">
                                                    {case_.litigant}
                                                </div>
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-center">
                                                <Badge
                                                    variant={case_.case_type === 'Filed By this Corporate' ? 'info' : 'warning'}
                                                    size="sm"
                                                    className="flex items-center gap-1 justify-center"
                                                >
                                                    {case_.case_type === 'Filed By this Corporate' ? (
                                                        <>
                                                            <TrendingUp className="w-3 h-3" />
                                                            Filed By
                                                        </>
                                                    ) : (
                                                        <>
                                                            <AlertTriangle className="w-3 h-3" />
                                                            Filed Against
                                                        </>
                                                    )}
                                                </Badge>
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-center">
                                                <Badge
                                                    variant={getStatusBadgeVariant(case_.case_status)}
                                                    size="sm"
                                                    className="flex items-center gap-1 justify-center"
                                                >
                                                    {getStatusIcon(case_.case_status)}
                                                    {case_.case_status}
                                                </Badge>
                                            </td>
                                            <td className="border border-neutral-200 p-3">
                                                <div className="text-sm text-neutral-90">
                                                    {formatDateForDisplay(case_.date_of_last_hearing_judgement)}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Legal Risk Insights */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">Legal Risk Analysis</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {analytics.pendingAgainst === 0 ? (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-900">Clean Legal Record</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    No pending litigation cases filed against the company. Clean legal standing with minimal defensive legal exposure.
                                    {analytics.filedByCorporate > 0 && ` Company has ${analytics.filedByCorporate} active case(s) filed by them.`}
                                </p>
                            </div>
                        ) : (
                            <div className={`p-4 rounded-lg border ${analytics.pendingAgainst > 5 ? 'bg-red-50 border-red-200' :
                                analytics.pendingAgainst > 2 ? 'bg-orange-50 border-orange-200' :
                                    'bg-yellow-50 border-yellow-200'
                                }`}>
                                <div className="flex items-center gap-2 mb-2">
                                    <AlertTriangle className={`w-4 h-4 ${analytics.pendingAgainst > 5 ? 'text-red-600' :
                                        analytics.pendingAgainst > 2 ? 'text-orange-600' :
                                            'text-yellow-600'
                                        }`} />
                                    <span className={`font-medium ${analytics.pendingAgainst > 5 ? 'text-red-900' :
                                        analytics.pendingAgainst > 2 ? 'text-orange-900' :
                                            'text-yellow-900'
                                        }`}>
                                        {analytics.riskScore} Legal Risk
                                    </span>
                                </div>
                                <p className={`text-sm ${analytics.pendingAgainst > 5 ? 'text-red-700' :
                                    analytics.pendingAgainst > 2 ? 'text-orange-700' :
                                        'text-yellow-700'
                                    }`}>
                                    {analytics.pendingAgainst} pending case(s) filed against the company require monitoring.
                                    {analytics.pendingAgainst > 5 && ' Significant defensive legal exposure requiring immediate attention.'}
                                    {analytics.pendingAgainst > 2 && analytics.pendingAgainst <= 5 && ' Moderate defensive legal risk requiring ongoing monitoring.'}
                                    {analytics.pendingAgainst <= 2 && ' Manageable defensive legal exposure with low risk profile.'}
                                    {analytics.filedByCorporate > 0 && ` Additionally, company has ${analytics.filedByCorporate} active offensive case(s).`}
                                </p>
                            </div>
                        )}

                        {/* Case Type Analysis */}
                        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Scale className="w-4 h-4 text-indigo-600" />
                                <span className="font-medium text-indigo-900">Case Type Distribution</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4 text-sm text-indigo-700">
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span>Defensive Cases (Filed Against):</span>
                                        <span className="font-medium">{analytics.filedAgainstCorporate}</span>
                                    </div>
                                    <div className="w-full bg-indigo-200 rounded-full h-2">
                                        <div
                                            className="bg-red-500 h-2 rounded-full"
                                            style={{
                                                width: `${analytics.totalCases > 0 ? (analytics.filedAgainstCorporate / analytics.totalCases) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <span>Offensive Cases (Filed By Company):</span>
                                        <span className="font-medium">{analytics.filedByCorporate}</span>
                                    </div>
                                    <div className="w-full bg-indigo-200 rounded-full h-2">
                                        <div
                                            className="bg-blue-500 h-2 rounded-full"
                                            style={{
                                                width: `${analytics.totalCases > 0 ? (analytics.filedByCorporate / analytics.totalCases) * 100 : 0}%`
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-indigo-600 mt-2">
                                {analytics.filedAgainstCorporate > analytics.filedByCorporate ?
                                    'Company is primarily in defensive position in litigation.' :
                                    analytics.filedByCorporate > analytics.filedAgainstCorporate ?
                                        'Company is actively pursuing legal remedies.' :
                                        'Balanced litigation portfolio between offensive and defensive cases.'
                                }
                            </p>
                        </div>

                        {/* Category Analysis */}
                        {Object.keys(analytics.categoryCounts).length > 0 && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">Case Distribution Analysis</span>
                                </div>
                                <p className="text-sm text-blue-700 mb-3">
                                    Most cases fall under {Object.entries(analytics.categoryCounts)
                                        .sort(([, a], [, b]) => (b as number) - (a as number))[0][0]}.
                                </p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                    {Object.entries(analytics.categoryCounts)
                                        .sort(([, a], [, b]) => (b as number) - (a as number))
                                        .map(([category, count]) => (
                                            <div key={category} className="text-xs bg-white rounded px-2 py-1">
                                                <span className="font-medium">{category}:</span> {`${count}`}
                                            </div>
                                        ))}
                                </div>
                            </div>
                        )}

                        {/* Recent Activity */}
                        <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-4 h-4 text-purple-600" />
                                <span className="font-medium text-purple-900">
                                    {timeFilter === 'last_year' ? 'Last Year' :
                                        timeFilter === 'last_two_years' ? 'Last 2 Years' : 'All Time'} Legal Activity
                                </span>
                            </div>
                            <p className="text-sm text-purple-700">
                                {analytics.recentActivity > 0 ? (
                                    <>
                                        {analytics.recentActivity} case(s) had activity in the selected time period, indicating
                                        {timeFilter === 'last_year' ? ' recent' : timeFilter === 'last_two_years' ? ' ongoing' : ' historical'} legal proceedings.
                                        {analytics.pendingCases > 0 && ` ${analytics.pendingCases} cases are still pending resolution.`}
                                    </>
                                ) : (
                                    `No legal activity recorded in the selected time period.`
                                )}
                            </p>
                        </div>

                        {/* Time-based Summary */}
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Calendar className="w-4 h-4 text-gray-600" />
                                <span className="font-medium text-gray-900">Period Summary</span>
                            </div>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                <div className="bg-white rounded px-2 py-1">
                                    <span className="text-gray-600">Total Cases:</span>
                                    <span className="font-medium ml-1">{analytics.totalCases}</span>
                                </div>
                                <div className="bg-white rounded px-2 py-1">
                                    <span className="text-gray-600">Pending:</span>
                                    <span className="font-medium ml-1">{analytics.pendingCases}</span>
                                </div>
                                <div className="bg-white rounded px-2 py-1">
                                    <span className="text-gray-600">Against Company:</span>
                                    <span className="font-medium ml-1">{analytics.filedAgainstCorporate}</span>
                                </div>
                                <div className="bg-white rounded px-2 py-1">
                                    <span className="text-gray-600">By Company:</span>
                                    <span className="font-medium ml-1">{analytics.filedByCorporate}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Information Note */}
            <Card>
                <CardContent className="p-4">
                    <div className="p-3 bg-neutral-5 rounded-lg">
                        <p className="text-xs text-neutral-60">
                            <strong>Note:</strong> Legal case analysis filtered by selected time period ({
                                timeFilter === 'last_year' ? 'Last Year' :
                                    timeFilter === 'last_two_years' ? 'Last 2 Years' : 'All Time'
                            }). Cases are categorized as "Filed By Company" (offensive litigation where company is the petitioner)
                            or "Filed Against Company" (defensive litigation where company is the respondent).
                            Risk assessment focuses on pending cases filed against the company as they represent potential liabilities.
                            Data includes cases from various court levels including Supreme Court, High Courts, Tribunals, and District Courts.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}