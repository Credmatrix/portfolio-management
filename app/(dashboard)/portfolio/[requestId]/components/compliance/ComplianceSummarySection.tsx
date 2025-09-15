'use client'

import React from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    Shield,
    CheckCircle,
    AlertTriangle,
    XCircle,
    FileText,
    Users,
    Calendar,
    TrendingUp,
    Activity,
    Info,
    Building
} from 'lucide-react'

interface ComplianceSummarySectionProps {
    company: PortfolioCompany
}

export function ComplianceSummarySection({ company }: ComplianceSummarySectionProps) {
    // Extract GST and PF data from allScores (same as ComplianceSection)
    const allScores = company.risk_analysis?.allScores || []
    const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)")
    const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)")

    // Extract audit and legal data from the new structure
    const auditData = company.extracted_data?.["Auditors' Comments-Standalone"]
    const legalData = company.extracted_data?.['Legal History']

    const getGstComplianceStatus = () => {
        try {
            const gstExtractedData = company.extracted_data?.GST
            const gstAnnexureData = company.extracted_data?.['Annexure - GST']

            if (!gstExtractedData?.raw_data || !gstAnnexureData?.raw_data) {
                return { status: 'unavailable', activeGstins: 0, totalFilings: 0, onTimeFilings: 0, complianceRate: 0 }
            }

            // Count active GSTINs
            const activeGstins = gstExtractedData.raw_data.filter((item: any) =>
                item['GSTIN STATUS'] === 'Active'
            ).length

            // Analyze filing compliance
            let totalFilings = 0
            let onTimeFilings = 0

            gstAnnexureData.raw_data.forEach((item: any) => {
                const returnType = item['RETURN TYPE']
                const dateOfFiling = item['DATE OF FILING']
                const dueDate = item['FILING DUE DATE']

                if (['GSTR3B', 'GSTR1'].includes(returnType) && dateOfFiling && dueDate &&
                    dateOfFiling !== '-' && dueDate !== '-') {
                    totalFilings++

                    // Simple check - if filed on or before due date (with 15-day grace period)
                    try {
                        const filingDate = new Date(dateOfFiling)
                        const dueDateObj = new Date(dueDate)
                        const graceDate = new Date(dueDateObj.getTime() + (15 * 24 * 60 * 60 * 1000)) // 15 days grace

                        if (filingDate <= graceDate) {
                            onTimeFilings++
                        }
                    } catch (error) {
                        // If date parsing fails, assume it's late
                        console.warn('Error parsing GST dates:', error)
                    }
                }
            })

            const complianceRate = totalFilings > 0 ? (onTimeFilings / totalFilings) * 100 : 0

            let status = 'good'
            if (complianceRate < 70) status = 'poor'
            else if (complianceRate < 90) status = 'moderate'

            return {
                status,
                activeGstins,
                totalFilings,
                onTimeFilings,
                complianceRate,
                lateFilings: totalFilings - onTimeFilings
            }
        } catch (error) {
            console.warn('Error processing GST compliance:', error)
            return { status: 'unavailable', activeGstins: 0, totalFilings: 0, onTimeFilings: 0, complianceRate: 0 }
        }
    }

    const getEpfoComplianceStatus = () => {
        try {
            const epfoExtractedData = company.extracted_data?.['EPFO Establishments']
            const epfoAnnexureData = company.extracted_data?.['Annexure - EPFO Establishments']

            if (!epfoExtractedData?.raw_data || !epfoAnnexureData?.raw_data) {
                return { status: 'unavailable', activeEstablishments: 0, totalEmployees: 0, complianceIssues: 0, complianceRate: 0 }
            }

            // Count active establishments and employees
            let activeEstablishments = 0
            let totalEmployees = 0
            let complianceIssues = 0

            epfoExtractedData.raw_data.forEach((item: any) => {
                if (item['WORKING STATUS'] === 'LIVE ESTABLISHMENT') {
                    activeEstablishments++
                    totalEmployees += parseInt(item['NO. OF EMPLOYEES']) || 0

                    if (item['FLAGS']?.includes('Payment After Due Date')) {
                        complianceIssues++
                    }
                }
            })

            // Analyze payment timeliness
            let totalPayments = 0
            let delayedPayments = 0

            epfoAnnexureData.raw_data.forEach((item: any) => {
                const paymentDate = item['DATE OF CREDIT']
                const dueDate = item['PAYMENT DUE DATE']

                if (paymentDate && dueDate && paymentDate !== '-' && dueDate !== '-') {
                    totalPayments++

                    try {
                        const paymentDateObj = new Date(paymentDate)
                        const dueDateObj = new Date(dueDate)
                        const graceDate = new Date(dueDateObj.getTime() + (30 * 24 * 60 * 60 * 1000)) // 30 days grace

                        if (paymentDateObj > graceDate) {
                            delayedPayments++
                        }
                    } catch (error) {
                        // If date parsing fails, check status field
                        if (item['STATUS']?.includes('Payment After Due Date')) {
                            delayedPayments++
                        }
                    }
                }
            })

            const complianceRate = totalPayments > 0 ? ((totalPayments - delayedPayments) / totalPayments) * 100 : 100

            let status = 'good'
            if (complianceRate < 70) status = 'poor'
            else if (complianceRate < 90) status = 'moderate'

            return {
                status,
                activeEstablishments,
                totalEmployees,
                complianceIssues,
                complianceRate,
                totalPayments,
                delayedPayments,
                originalComplianceRate: complianceRate // For now, same as compliance rate
            }
        } catch (error) {
            console.warn('Error processing EPFO compliance:', error)
            return { status: 'unavailable', activeEstablishments: 0, totalEmployees: 0, complianceIssues: 0, complianceRate: 0 }
        }
    }

    const getAuditComplianceStatus = () => {
        try {
            if (!auditData?.qualification_summary) {
                return { status: 'unavailable', cleanAudits: 0, totalAudits: 0, auditScore: 0 }
            }

            const years = auditData.qualification_summary.years || []
            const qualifications = auditData.qualification_summary.qualifications || {}

            let cleanAudits = 0
            let totalAudits = years.length

            years.forEach((year: string | number) => {
                const qualification = qualifications[year]
                if (qualification && !qualification.is_qualified) {
                    cleanAudits++
                }
            })

            const auditScore = totalAudits > 0 ? (cleanAudits / totalAudits) * 100 : 100

            let status = 'good'
            if (auditScore < 70) status = 'poor'
            else if (auditScore < 90) status = 'moderate'

            return { status, cleanAudits, totalAudits, auditScore }
        } catch (error) {
            return { status: 'unavailable', cleanAudits: 0, totalAudits: 0, auditScore: 0 }
        }
    }

    const getLegalComplianceStatus = () => {
        try {
            if (!legalData?.data) {
                return { status: 'good', pendingCases: 0, totalCases: 0, legalScore: 100 }
            }

            // Filter for pending cases in last year (same logic as ComplianceSection)
            const oneYearAgo = new Date('2024-08-30')
            const pendingCases = legalData.data.filter((case_: any) => {
                if (!case_.court || !case_.case_no) return false
                if (case_.case_status?.toLowerCase() !== 'pending') return false

                if (case_.date_of_last_hearing_judgement && case_.date_of_last_hearing_judgement !== '-') {
                    try {
                        const hearingDate = new Date(case_.date_of_last_hearing_judgement)
                        return hearingDate >= oneYearAgo
                    } catch (e) {
                        return true
                    }
                }
                return true
            }).length

            const totalCases = legalData.data.filter((case_: any) =>
                case_.court && case_.case_no && case_._row_index < 450
            ).length

            // Legal score: fewer pending cases is better
            const legalScore = pendingCases === 0 ? 100 : Math.max(0, 100 - (pendingCases * 10))

            let status = 'good'
            if (pendingCases > 5) status = 'poor'
            else if (pendingCases > 2) status = 'moderate'

            return { status, pendingCases, totalCases, legalScore }
        } catch (error) {
            return { status: 'good', pendingCases: 0, totalCases: 0, legalScore: 100 }
        }
    }

    const getOverallComplianceScore = () => {
        const gstStatus = getGstComplianceStatus()
        const epfoStatus = getEpfoComplianceStatus()
        const auditStatus = getAuditComplianceStatus()
        const legalStatus = getLegalComplianceStatus()

        let totalWeightedScore = 0
        let totalWeight = 0

        // GST compliance (weight: 3)
        if (gstStatus.status !== 'unavailable') {
            // Convert compliance rate to score (0-5 scale like risk_analysis)
            const gstComplianceScore = (gstStatus.complianceRate / 100) * 5
            const gstWeightedScore = gstComplianceScore * 3
            totalWeightedScore += gstWeightedScore
            totalWeight += 3
        } else if (gstData?.available) {
            // Fallback to risk_analysis data if available
            const gstScore = (gstData.score / gstData.maxScore) * (gstData.weightage || 3)
            totalWeightedScore += gstScore
            totalWeight += (gstData.weightage || 3)
        }

        // EPFO compliance (weight: 2)
        if (epfoStatus.status !== 'unavailable') {
            // Convert compliance rate to score (0-5 scale like risk_analysis)
            const epfoComplianceScore = (epfoStatus.complianceRate / 100) * 5
            const epfoWeightedScore = epfoComplianceScore * 2
            totalWeightedScore += epfoWeightedScore
            totalWeight += 2
        } else if (pfData?.available) {
            // Fallback to risk_analysis data if available
            const pfScore = (pfData.score / pfData.maxScore) * (pfData.weightage || 2)
            totalWeightedScore += pfScore
            totalWeight += (pfData.weightage || 2)
        }

        // Audit score (weight: 2)
        if (auditStatus.status !== 'unavailable') {
            const auditScore = (auditStatus.auditScore / 100) * 2
            totalWeightedScore += auditScore
            totalWeight += 2
        } else {
            totalWeightedScore += 2 // No audit issues
            totalWeight += 2
        }

        // Legal score (weight: 1)
        const legalScore = (legalStatus.legalScore / 100) * 1
        totalWeightedScore += legalScore
        totalWeight += 1

        const finalScore = totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0

        let grade = 'A'
        let status = 'excellent'

        if (finalScore < 40) {
            grade = 'D'
            status = 'poor'
        } else if (finalScore < 60) {
            grade = 'C'
            status = 'fair'
        } else if (finalScore < 80) {
            grade = 'B'
            status = 'good'
        }

        return {
            score: Math.round(finalScore) / 4,
            grade,
            status,
            gstScore: gstData?.score || Math.round((gstStatus.complianceRate / 100) * 5),
            pfScore: pfData?.score || Math.round((epfoStatus.complianceRate / 100) * 5),
            auditScore: auditStatus.auditScore,
            legalScore: legalStatus.legalScore
        }
    }

    const gstCompliance = getGstComplianceStatus()
    const epfoCompliance = getEpfoComplianceStatus()
    const auditCompliance = getAuditComplianceStatus()
    const legalCompliance = getLegalComplianceStatus()
    const overallCompliance = getOverallComplianceScore()

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'excellent':
            case 'good':
                return 'success'
            case 'moderate':
            case 'fair':
                return 'warning'
            case 'poor':
                return 'error'
            default:
                return 'secondary'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'excellent':
            case 'good':
                return <CheckCircle className="w-4 h-4" />
            case 'moderate':
            case 'fair':
                return <AlertTriangle className="w-4 h-4" />
            case 'poor':
                return <XCircle className="w-4 h-4" />
            default:
                return <Info className="w-4 h-4" />
        }
    }

    return (
        <div className="space-y-6">
            {/* Overall Compliance Score */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Shield className="w-5 h-5 text-blue-600" />
                            <h3 className="text-lg font-semibold text-neutral-90">
                                Overall Compliance Score
                            </h3>
                        </div>
                        <Badge
                            variant={getStatusBadgeVariant(overallCompliance.status)}
                            className="flex items-center gap-1"
                        >
                            {getStatusIcon(overallCompliance.status)}
                            Grade {overallCompliance.grade}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Score Display */}
                        <div className="text-center">
                            <div className="relative w-24 h-24 mx-auto mb-4">
                                <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 100 100">
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        className="text-neutral-20"
                                    />
                                    <circle
                                        cx="50"
                                        cy="50"
                                        r="40"
                                        stroke="currentColor"
                                        strokeWidth="8"
                                        fill="transparent"
                                        strokeDasharray={`${2 * Math.PI * 40}`}
                                        strokeDashoffset={`${2 * Math.PI * 40 * (1 - overallCompliance.score / 100)}`}
                                        className={
                                            overallCompliance.status === 'excellent' || overallCompliance.status === 'good'
                                                ? 'text-green-500'
                                                : overallCompliance.status === 'moderate' || overallCompliance.status === 'fair'
                                                    ? 'text-yellow-500'
                                                    : 'text-red-500'
                                        }
                                        strokeLinecap="round"
                                    />
                                </svg>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className="text-md font-bold text-neutral-90">
                                        {overallCompliance.score}%
                                    </span>
                                </div>
                            </div>
                            <p className="text-sm text-neutral-60">Compliance Score</p>
                        </div>

                        {/* GST Compliance */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-medium text-neutral-90">GST Compliance</span>
                                <Badge variant={getStatusBadgeVariant(gstCompliance.status)} size="sm">
                                    {gstCompliance.status === 'unavailable' ? 'N/A' :
                                        gstCompliance.status === 'good' ? 'Good' :
                                            gstCompliance.status === 'moderate' ? 'Moderate' : 'Poor'}
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-60">Active GSTINs:</span>
                                    <span className="font-medium">{gstCompliance.activeGstins}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-60">Total Filings:</span>
                                    <span className="font-medium">{gstCompliance.totalFilings}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-60">On-Time Filings:</span>
                                    <span className="font-medium">{gstCompliance.onTimeFilings}</span>
                                </div>
                                {gstCompliance.complianceRate !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-60">Compliance Rate:</span>
                                        <span className="font-medium">{gstCompliance.complianceRate.toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* EPFO Compliance */}
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-neutral-90">EPFO Compliance</span>
                                <Badge variant={getStatusBadgeVariant(epfoCompliance.status)} size="sm">
                                    {epfoCompliance.status === 'unavailable' ? 'N/A' :
                                        epfoCompliance.status === 'good' ? 'Good' :
                                            epfoCompliance.status === 'moderate' ? 'Moderate' : 'Poor'}
                                </Badge>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-neutral-60">Establishments:</span>
                                    <span className="font-medium">{epfoCompliance.activeEstablishments}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-60">Total Employees:</span>
                                    <span className="font-medium">{epfoCompliance.totalEmployees.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-neutral-60">Compliance Issues:</span>
                                    <span className="font-medium">{epfoCompliance.complianceIssues}</span>
                                </div>
                                {epfoCompliance.complianceRate !== undefined && (
                                    <div className="flex justify-between">
                                        <span className="text-neutral-60">Payment Timeliness:</span>
                                        <span className="font-medium">{epfoCompliance.complianceRate.toFixed(1)}%</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Key Compliance Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-blue-600" />
                        <span className="text-sm font-medium text-blue-800">GST Registrations</span>
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{gstCompliance.activeGstins}</div>
                    <div className="text-xs text-blue-600">Active across states</div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Users className="w-4 h-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">EPFO Employees</span>
                    </div>
                    <div className="text-2xl font-bold text-green-900">{epfoCompliance.totalEmployees.toLocaleString()}</div>
                    <div className="text-xs text-green-600">Covered under PF</div>
                </div>

                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-purple-600" />
                        <span className="text-sm font-medium text-purple-800">On-Time Filings</span>
                    </div>
                    <div className="text-2xl font-bold text-purple-900">{gstCompliance.onTimeFilings}</div>
                    <div className="text-xs text-purple-600">GST returns filed on time</div>
                </div>

                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <Activity className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800">Establishments</span>
                    </div>
                    <div className="text-2xl font-bold text-orange-900">{epfoCompliance.activeEstablishments}</div>
                    <div className="text-xs text-orange-600">Active EPFO locations</div>
                </div>

                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="w-4 h-4 text-indigo-600" />
                        <span className="text-sm font-medium text-indigo-800">Clean Audits</span>
                    </div>
                    <div className="text-2xl font-bold text-indigo-900">
                        {auditCompliance.status !== 'unavailable' ? `${auditCompliance.cleanAudits}/${auditCompliance.totalAudits}` : 'N/A'}
                    </div>
                    <div className="text-xs text-indigo-600">Unqualified audit reports</div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Pending Cases</span>
                    </div>
                    <div className="text-2xl font-bold text-yellow-900">{legalCompliance.pendingCases}</div>
                    <div className="text-xs text-yellow-600">Recent legal cases</div>
                </div>
            </div>

            {/* Compliance Insights */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">Compliance Insights</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {/* GST Insights */}
                        {gstCompliance.status !== 'unavailable' && (
                            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-blue-900">GST Compliance Analysis</span>
                                </div>
                                <div className="text-sm text-blue-700">
                                    {gstCompliance.status === 'good' && (
                                        <p>✅ Excellent GST compliance with {gstCompliance.complianceRate?.toFixed(1)}% on-time filing rate. The company maintains good standing with tax authorities.</p>
                                    )}
                                    {gstCompliance.status === 'moderate' && (
                                        <p>⚠️ Moderate GST compliance with {gstCompliance.complianceRate?.toFixed(1)}% on-time filing rate. Some improvements needed in filing timeliness.</p>
                                    )}
                                    {gstCompliance.status === 'poor' && (
                                        <p>❌ Poor GST compliance with {gstCompliance.complianceRate?.toFixed(1)}% on-time filing rate. Significant attention required to avoid penalties.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* EPFO Insights */}
                        {epfoCompliance.status !== 'unavailable' && (
                            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="w-4 h-4 text-green-600" />
                                    <span className="font-medium text-green-900">EPFO Compliance Analysis</span>
                                </div>
                                <div className="text-sm text-green-700">
                                    {epfoCompliance.status === 'good' && (
                                        <p>✅ Strong EPFO compliance with {epfoCompliance.complianceRate?.toFixed(1)}% timely payment rate across {epfoCompliance.activeEstablishments} establishments covering {epfoCompliance.totalEmployees.toLocaleString()} employees.</p>
                                    )}
                                    {epfoCompliance.status === 'moderate' && (
                                        <p>⚠️ Moderate EPFO compliance with {epfoCompliance.complianceRate?.toFixed(1)}% timely payment rate. {epfoCompliance.complianceIssues} establishment(s) have compliance flags.</p>
                                    )}
                                    {epfoCompliance.status === 'poor' && (
                                        <p>❌ Poor EPFO compliance with {epfoCompliance.complianceRate?.toFixed(1)}% timely payment rate. {epfoCompliance.complianceIssues} establishment(s) have significant compliance issues.</p>
                                    )}
                                    {epfoCompliance.originalComplianceRate && epfoCompliance.originalComplianceRate !== epfoCompliance.complianceRate && (
                                        <p className="mt-2 text-xs text-green-600">
                                            📊 Applied 10% employee threshold rule: Improved from {epfoCompliance.originalComplianceRate?.toFixed(1)}% to {epfoCompliance.complianceRate?.toFixed(1)}%
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Audit Insights */}
                        {auditCompliance.status !== 'unavailable' && (
                            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
                                <div className="flex items-center gap-2 mb-2">
                                    <CheckCircle className="w-4 h-4 text-purple-600" />
                                    <span className="font-medium text-purple-900">Audit Compliance Analysis</span>
                                </div>
                                <div className="text-sm text-purple-700">
                                    {auditCompliance.status === 'good' && (
                                        <p>✅ Excellent audit compliance with {auditCompliance.cleanAudits}/{auditCompliance.totalAudits} clean audit reports. Strong financial reporting standards.</p>
                                    )}
                                    {auditCompliance.status === 'moderate' && (
                                        <p>⚠️ Moderate audit compliance with {auditCompliance.cleanAudits}/{auditCompliance.totalAudits} clean audit reports. Some audit qualifications noted.</p>
                                    )}
                                    {auditCompliance.status === 'poor' && (
                                        <p>❌ Poor audit compliance with {auditCompliance.cleanAudits}/{auditCompliance.totalAudits} clean audit reports. Multiple audit qualifications require attention.</p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Legal Insights */}
                        <div className="p-4 bg-orange-50 border border-orange-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <AlertTriangle className="w-4 h-4 text-orange-600" />
                                <span className="font-medium text-orange-900">Legal Compliance Analysis</span>
                            </div>
                            <div className="text-sm text-orange-700">
                                {legalCompliance.status === 'good' && legalCompliance.pendingCases === 0 && (
                                    <p>✅ Clean legal record with no pending litigation cases. Low legal risk profile.</p>
                                )}
                                {legalCompliance.status === 'good' && legalCompliance.pendingCases > 0 && (
                                    <p>✅ Good legal standing with {legalCompliance.pendingCases} pending case(s) out of {legalCompliance.totalCases} total cases. Manageable legal exposure.</p>
                                )}
                                {legalCompliance.status === 'moderate' && (
                                    <p>⚠️ Moderate legal exposure with {legalCompliance.pendingCases} pending cases requiring monitoring. Legal risk management needed.</p>
                                )}
                                {legalCompliance.status === 'poor' && (
                                    <p>❌ High legal exposure with {legalCompliance.pendingCases} pending cases. Significant legal risk requiring immediate attention.</p>
                                )}
                            </div>
                        </div>

                        {/* Overall Recommendation */}
                        <div className="p-4 bg-neutral-10 border border-neutral-200 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Shield className="w-4 h-4 text-neutral-600" />
                                <span className="font-medium text-neutral-900">Overall Recommendation</span>
                            </div>
                            <div className="text-sm text-neutral-700 space-y-2">
                                {overallCompliance.status === 'excellent' && (
                                    <p>The company demonstrates excellent compliance across all regulatory areas. Continue maintaining current practices and monitor for any changes in regulations.</p>
                                )}
                                {overallCompliance.status === 'good' && (
                                    <p>Good overall compliance with room for minor improvements. Focus on maintaining consistency in filing and payment schedules.</p>
                                )}
                                {overallCompliance.status === 'fair' && (
                                    <p>Fair compliance status requires attention. Implement systematic processes to improve filing timeliness and reduce compliance gaps.</p>
                                )}
                                {overallCompliance.status === 'poor' && (
                                    <p>Poor compliance status poses significant risk. Immediate action required to address compliance gaps and avoid regulatory penalties.</p>
                                )}
                                {overallCompliance.status === 'unavailable' && (
                                    <p>Compliance data is not available for comprehensive analysis. Consider uploading relevant compliance documents for better assessment.</p>
                                )}

                                {/* Detailed scoring breakdown */}
                                <div className="mt-3 p-3 bg-white rounded-md border">
                                    <div className="text-xs font-medium text-neutral-800 mb-2">Compliance Score Breakdown:</div>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                                        <div>
                                            <span className="text-neutral-600">GST:</span>
                                            <span className="font-medium ml-1">
                                                {gstData?.available ? `${overallCompliance.gstScore}/${gstData.maxScore}` : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-600">EPFO:</span>
                                            <span className="font-medium ml-1">
                                                {pfData?.available ? `${overallCompliance.pfScore}/${pfData.maxScore}` : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-600">Audit:</span>
                                            <span className="font-medium ml-1">
                                                {auditCompliance.status !== 'unavailable' ? `${overallCompliance.auditScore.toFixed(0)}%` : 'N/A'}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-600">Legal:</span>
                                            <span className="font-medium ml-1">
                                                {overallCompliance.legalScore.toFixed(0)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Key action items */}
                                {(gstCompliance.status === 'poor' || epfoCompliance.status === 'poor' ||
                                    auditCompliance.status === 'poor' || legalCompliance.status === 'poor') && (
                                        <div className="mt-3 p-3 bg-red-50 rounded-md border border-red-200">
                                            <div className="text-xs font-medium text-red-800 mb-2">Priority Action Items:</div>
                                            <ul className="text-xs text-red-700 space-y-1">
                                                {gstCompliance.status === 'poor' && (
                                                    <li>• Improve GST filing timeliness - currently {gstCompliance.complianceRate?.toFixed(1)}% compliance</li>
                                                )}
                                                {epfoCompliance.status === 'poor' && (
                                                    <li>• Address EPFO payment delays - currently {epfoCompliance.complianceRate?.toFixed(1)}% compliance</li>
                                                )}
                                                {auditCompliance.status === 'poor' && (
                                                    <li>• Resolve audit qualifications - {auditCompliance.cleanAudits}/{auditCompliance.totalAudits} clean audits</li>
                                                )}
                                                {legalCompliance.status === 'poor' && (
                                                    <li>• Manage legal exposure - {legalCompliance.pendingCases} pending cases require attention</li>
                                                )}
                                            </ul>
                                        </div>
                                    )}
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}