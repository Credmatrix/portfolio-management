'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    FileCheck,
    AlertTriangle,
    CheckCircle,
    XCircle,
    TrendingUp,
    TrendingDown,
    Calendar,
    User,
    FileText,
    Shield,
    Info,
    Award,
    Clock,
    BarChart3,
    Eye,
    ChevronDown,
    ChevronUp
} from 'lucide-react'

interface AuditorsCommentsSectionProps {
    company: PortfolioCompany
}

export function AuditorsCommentsSection({ company }: AuditorsCommentsSectionProps) {
    const [expandedYear, setExpandedYear] = useState<string | null>(null)
    const [showAllComments, setShowAllComments] = useState(false)

    const auditData = company.extracted_data?.["Auditors' Comments-Standalone"]

    // Process audit qualification data
    const auditAnalysis = useMemo(() => {
        if (!auditData?.qualification_summary) {
            return {
                years: [],
                qualifications: {},
                auditors: {},
                totalYears: 0,
                qualifiedYears: 0,
                unqualifiedYears: 0,
                trend: 'stable',
                riskLevel: 'low',
                auditScore: 100
            }
        }

        const { years = [], qualifications = {}, auditors = {} } = auditData.qualification_summary
        const qualifiedYears = years.filter((year: string) => qualifications[year]?.is_qualified).length
        const unqualifiedYears = years.length - qualifiedYears
        const auditScore = years.length > 0 ? (unqualifiedYears / years.length) * 100 : 100

        // Determine trend
        let trend = 'stable'
        if (years.length >= 3) {
            const recentYears = years.slice(-3)
            const recentQualifications = recentYears.filter((year: string) => qualifications[year]?.is_qualified).length
            const olderYears = years.slice(0, -3)
            const olderQualifications = olderYears.filter((year: string) => qualifications[year]?.is_qualified).length

            const recentRate = recentQualifications / recentYears.length
            const olderRate = olderYears.length > 0 ? olderQualifications / olderYears.length : 0

            if (recentRate > olderRate) trend = 'deteriorating'
            else if (recentRate < olderRate) trend = 'improving'
        }

        const riskLevel = qualifiedYears === 0 ? 'low' :
            qualifiedYears <= 1 ? 'medium' : 'high'

        return {
            years,
            qualifications,
            auditors,
            totalYears: years.length,
            qualifiedYears,
            unqualifiedYears,
            trend,
            riskLevel,
            auditScore: Math.round(auditScore)
        }
    }, [auditData])

    // Process detailed comments
    const detailedComments = useMemo(() => {
        if (!auditData?.detailed_comments) return []

        return auditData.detailed_comments.comments || []
    }, [auditData])

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'improving':
                return <TrendingUp className="w-4 h-4 text-green-500" />
            case 'deteriorating':
                return <TrendingDown className="w-4 h-4 text-red-500" />
            default:
                return <BarChart3 className="w-4 h-4 text-blue-500" />
        }
    }

    const getRiskColor = (riskLevel: string) => {
        switch (riskLevel) {
            case 'high':
                return 'text-red-600 bg-red-50 border-red-200'
            case 'medium':
                return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'low':
                return 'text-green-600 bg-green-50 border-green-200'
            default:
                return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    const getQualificationIcon = (isQualified: boolean) => {
        return isQualified ?
            <XCircle className="w-4 h-4 text-red-500" /> :
            <CheckCircle className="w-4 h-4 text-green-500" />
    }

    const getQualificationBadge = (isQualified: boolean) => {
        return isQualified ?
            <Badge variant="error" size="sm">Qualified</Badge> :
            <Badge variant="success" size="sm">Clean</Badge>
    }

    return (
        <div className="space-y-6">
            {/* Audit Quality Overview */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <FileCheck className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-neutral-90">Audit Quality Assessment</h3>
                        </div>
                        <div className={`px-3 py-1 rounded-full border text-sm font-medium ${getRiskColor(auditAnalysis.riskLevel)}`}>
                            {auditAnalysis.riskLevel.charAt(0).toUpperCase() + auditAnalysis.riskLevel.slice(1)} Risk
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="text-center p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="text-2xl font-bold text-blue-900">{auditAnalysis.totalYears}</div>
                            <div className="text-sm text-blue-600">Years Analyzed</div>
                        </div>
                        <div className="text-center p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="text-2xl font-bold text-green-900">{auditAnalysis.unqualifiedYears}</div>
                            <div className="text-sm text-green-600">Clean Audits</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 border border-red-200 rounded-lg">
                            <div className="text-2xl font-bold text-red-900">{auditAnalysis.qualifiedYears}</div>
                            <div className="text-sm text-red-600">Qualified Audits</div>
                        </div>
                        <div className="text-center p-4 bg-purple-50 border border-purple-200 rounded-lg">
                            <div className="text-2xl font-bold text-purple-900">{auditAnalysis.auditScore}%</div>
                            <div className="text-sm text-purple-600">Audit Score</div>
                        </div>
                    </div>

                    {/* Audit Score Visualization */}
                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-neutral-70">Audit Quality Score</span>
                            <span className="text-sm text-neutral-60">{auditAnalysis.auditScore}%</span>
                        </div>
                        <div className="w-full bg-neutral-20 rounded-full h-3">
                            <div
                                className={`h-3 rounded-full transition-all duration-500 ${auditAnalysis.auditScore >= 90 ? 'bg-green-500' :
                                        auditAnalysis.auditScore >= 70 ? 'bg-yellow-500' : 'bg-red-500'
                                    }`}
                                style={{ width: `${auditAnalysis.auditScore}%` }}
                            />
                        </div>
                    </div>

                    {/* Trend Analysis */}
                    <div className="flex items-center justify-between p-4 bg-neutral-10 rounded-lg">
                        <div className="flex items-center gap-3">
                            {getTrendIcon(auditAnalysis.trend)}
                            <div>
                                <div className="font-medium text-neutral-90">Audit Quality Trend</div>
                                <div className="text-sm text-neutral-60">
                                    {auditAnalysis.trend === 'improving' && 'Audit quality is improving over time'}
                                    {auditAnalysis.trend === 'deteriorating' && 'Audit quality shows concerning decline'}
                                    {auditAnalysis.trend === 'stable' && 'Consistent audit quality maintained'}
                                </div>
                            </div>
                        </div>
                        <Badge
                            variant={
                                auditAnalysis.trend === 'improving' ? 'success' :
                                    auditAnalysis.trend === 'deteriorating' ? 'error' : 'secondary'
                            }
                        >
                            {auditAnalysis.trend.charAt(0).toUpperCase() + auditAnalysis.trend.slice(1)}
                        </Badge>
                    </div>
                </CardContent>
            </Card>

            {/* Year-wise Audit History */}
            {auditAnalysis.years.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-green-600" />
                            <h3 className="text-lg font-semibold text-neutral-90">Audit History by Year</h3>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {auditAnalysis.years.map((year: string) => {
                                const qualification = auditAnalysis.qualifications[year]
                                const auditor = auditAnalysis.auditors[year]
                                const isExpanded = expandedYear === year

                                return (
                                    <div key={year} className="border border-neutral-20 rounded-lg overflow-hidden">
                                        <div
                                            className="p-4 cursor-pointer hover:bg-neutral-10 transition-colors"
                                            onClick={() => setExpandedYear(isExpanded ? null : year)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    {getQualificationIcon(!qualification?.is_qualified)}
                                                    <div>
                                                        <div className="font-medium text-neutral-90">Financial Year {year}</div>
                                                        <div className="text-sm text-neutral-60">
                                                            {auditor && auditor !== '-' ? `Audited by: ${auditor}` : 'Auditor information not available'}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {getQualificationBadge(!qualification?.is_qualified)}
                                                    {isExpanded ?
                                                        <ChevronUp className="w-4 h-4 text-neutral-60" /> :
                                                        <ChevronDown className="w-4 h-4 text-neutral-60" />
                                                    }
                                                </div>
                                            </div>
                                        </div>

                                        {isExpanded && (
                                            <div className="px-4 pb-4 border-t border-neutral-20 bg-neutral-5">
                                                <div className="pt-4 space-y-3">
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                        <div>
                                                            <span className="text-sm font-medium text-neutral-70">Audit Status:</span>
                                                            <p className="text-sm text-neutral-90">
                                                                {qualification?.is_qualified ? 'Qualified Opinion' : 'Unqualified (Clean) Opinion'}
                                                            </p>
                                                        </div>
                                                        <div>
                                                            <span className="text-sm font-medium text-neutral-70">Auditor:</span>
                                                            <p className="text-sm text-neutral-90">
                                                                {auditor && auditor !== '-' ? auditor : 'Not specified'}
                                                            </p>
                                                        </div>
                                                    </div>

                                                    {qualification?.is_qualified && (
                                                        <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                                                <span className="font-medium text-red-900">Audit Qualification</span>
                                                            </div>
                                                            <p className="text-sm text-red-700">
                                                                This audit report contains qualifications that may indicate issues with financial reporting,
                                                                internal controls, or compliance matters that require attention.
                                                            </p>
                                                        </div>
                                                    )}

                                                    {!qualification?.is_qualified && (
                                                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                                <span className="font-medium text-green-900">Clean Audit Opinion</span>
                                                            </div>
                                                            <p className="text-sm text-green-700">
                                                                The auditors provided an unqualified opinion, indicating that the financial statements
                                                                present a true and fair view of the company's financial position.
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Detailed Auditors' Comments */}
            {detailedComments.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <FileText className="w-5 h-5 text-purple-600" />
                                <h3 className="text-lg font-semibold text-neutral-90">Detailed Auditors' Comments</h3>
                            </div>
                            {detailedComments.length > 3 && (
                                <button
                                    onClick={() => setShowAllComments(!showAllComments)}
                                    className="flex items-center gap-2 px-3 py-1 text-sm bg-purple-50 text-purple-600 rounded-md hover:bg-purple-100 transition-colors"
                                >
                                    <Eye className="w-4 h-4" />
                                    {showAllComments ? 'Show Less' : `Show All (${detailedComments.length})`}
                                </button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {(showAllComments ? detailedComments : detailedComments.slice(0, 3)).map((comment, index) => (
                                <div key={index} className="p-4 border border-neutral-20 rounded-lg bg-neutral-5">
                                    <div className="flex items-start gap-3">
                                        <FileText className="w-5 h-5 text-neutral-60 mt-0.5 flex-shrink-0" />
                                        <div className="flex-1">
                                            <p className="text-sm text-neutral-90 leading-relaxed">
                                                {comment.auditors_comments || 'No specific comments available.'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Audit Risk Assessment */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">Audit Risk Assessment</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* Overall Assessment */}
                        <div className={`p-4 rounded-lg border ${getRiskColor(auditAnalysis.riskLevel)}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Award className="w-4 h-4" />
                                <span className="font-medium">Overall Audit Quality Assessment</span>
                            </div>
                            <p className="text-sm mb-3">
                                {auditAnalysis.riskLevel === 'low' &&
                                    'Excellent audit quality with consistent clean opinions. Strong financial reporting standards and internal controls.'}
                                {auditAnalysis.riskLevel === 'medium' &&
                                    'Good audit quality with minor qualifications. Some areas may require attention but overall financial reporting is reliable.'}
                                {auditAnalysis.riskLevel === 'high' &&
                                    'Audit quality concerns with multiple qualifications. Significant attention required for financial reporting and internal controls.'}
                            </p>
                            <div className="text-xs opacity-75">
                                Based on {auditAnalysis.totalYears} years of audit history with {auditAnalysis.auditScore}% clean audit rate.
                            </div>
                        </div>

                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <BarChart3 className="w-4 h-4 text-blue-600" />
                                    <span className="text-sm font-medium text-blue-900">Audit Consistency</span>
                                </div>
                                <p className="text-xs text-blue-700">
                                    {auditAnalysis.unqualifiedYears}/{auditAnalysis.totalYears} years with clean opinions
                                </p>
                            </div>

                            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <TrendingUp className="w-4 h-4 text-green-600" />
                                    <span className="text-sm font-medium text-green-900">Quality Trend</span>
                                </div>
                                <p className="text-xs text-green-700">
                                    {auditAnalysis.trend === 'improving' ? 'Improving over time' :
                                        auditAnalysis.trend === 'deteriorating' ? 'Declining trend' : 'Stable performance'}
                                </p>
                            </div>

                            <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                                <div className="flex items-center gap-2 mb-1">
                                    <Clock className="w-4 h-4 text-purple-600" />
                                    <span className="text-sm font-medium text-purple-900">Recent Performance</span>
                                </div>
                                <p className="text-xs text-purple-700">
                                    {auditAnalysis.years.length > 0 ?
                                        `Latest: ${auditAnalysis.qualifications[auditAnalysis.years[auditAnalysis.years.length - 1]]?.is_qualified ? 'Qualified' : 'Clean'}` :
                                        'No recent data'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Recommendations */}
                        <div className="p-4 bg-neutral-10 border border-neutral-20 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Info className="w-4 h-4 text-neutral-600" />
                                <span className="font-medium text-neutral-90">Recommendations</span>
                            </div>
                            <ul className="text-sm text-neutral-70 space-y-1">
                                {auditAnalysis.riskLevel === 'low' && (
                                    <>
                                        <li>• Continue maintaining high audit quality standards</li>
                                        <li>• Regular review of internal controls and processes</li>
                                        <li>• Ensure timely compliance with audit requirements</li>
                                    </>
                                )}
                                {auditAnalysis.riskLevel === 'medium' && (
                                    <>
                                        <li>• Address any audit qualifications promptly</li>
                                        <li>• Strengthen internal control systems</li>
                                        <li>• Enhance financial reporting processes</li>
                                        <li>• Regular monitoring of audit quality metrics</li>
                                    </>
                                )}
                                {auditAnalysis.riskLevel === 'high' && (
                                    <>
                                        <li>• Immediate attention to audit qualifications</li>
                                        <li>• Comprehensive review of financial controls</li>
                                        <li>• Consider engaging audit committee for oversight</li>
                                        <li>• Implement robust financial reporting framework</li>
                                    </>
                                )}
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}