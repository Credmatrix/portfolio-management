'use client'

import { Badge } from '@/components/ui/Badge'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    AlertTriangle,
    Building,
    CheckCircle,
    Clock,
    FileText,
    Shield,
    TrendingUp,
    Users,
    XCircle
} from 'lucide-react'

interface ComplianceSectionProps {
    company: PortfolioCompany
}

export function ComplianceSection({ company }: ComplianceSectionProps) {
    // Extract GST and PF data from allScores
    const allScores = company.risk_analysis?.allScores || []

    const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)")
    const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)")

    // Extract audit and legal data from the new structure
    const auditData = company.extracted_data["Auditors' Comments-Standalone"]
    const legalData = company.extracted_data['Legal History']

    // Process audit qualifications from the new structure
    const auditQualifications = auditData?.qualification_summary ?
        auditData.qualification_summary.years.map((year: string | number) => ({
            year: year,
            qualification_type: auditData.qualification_summary.qualifications[year]?.is_qualified ? 'qualified' : 'unqualified',
            auditor: auditData.qualification_summary.auditors[year] || '-',
            reason: null,
            financial_impact: null
        })) : []

    // Process legal cases from the new structure - filter for pending cases in last 1 year
    const oneYearAgo = new Date('2024-08-30') // One year before current date (2025-08-30)

    const legalCases = legalData?.data ? legalData.data.filter((case_: { court: any; case_no: any; case_status: string; date_of_last_hearing_judgement: string | number | Date }) => {
        // Filter out header rows and invalid entries
        if (!case_.court || !case_.case_no) return false

        // Only show pending cases
        if (case_.case_status?.toLowerCase() !== 'pending') return false

        // Filter by last hearing date within the last year
        if (case_.date_of_last_hearing_judgement && case_.date_of_last_hearing_judgement !== '-') {
            try {
                // Parse date in format "DD MMM, YYYY" (e.g., "3 Jul, 2025")
                const hearingDate = new Date(case_.date_of_last_hearing_judgement)
                if (hearingDate >= oneYearAgo) return true
            } catch (e) {
                // If date parsing fails, include the case if it's pending
                return true
            }
        }

        // Include pending cases without hearing dates (likely recent)
        return true
    }).map((case_: { court: any; case_no: any; litigant: any; case_type: any; case_status: any; case_category: any; date_of_last_hearing_judgement: any }) => ({
        court: case_.court,
        case_no: case_.case_no,
        litigant: case_.litigant,
        case_type: case_.case_type,
        status: case_.case_status,
        case_category: case_.case_category,
        date_of_last_hearing: case_.date_of_last_hearing_judgement,
        amount_involved: null // Not provided in current data structure
    })) : []

    const getComplianceStatus = (score: number, complianceRate: number) => {
        if (complianceRate >= 95) {
            return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Excellent' }
        } else if (complianceRate >= 85) {
            return { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Good' }
        } else if (complianceRate >= 70) {
            return { icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Fair' }
        } else {
            return { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Poor' }
        }
    }

    const getScoreBadge = (score: number) => {
        if (score >= 4) return { variant: 'success' as const, label: 'Excellent' }
        if (score >= 3) return { variant: 'info' as const, label: 'Good' }
        if (score >= 2) return { variant: 'warning' as const, label: 'Fair' }
        return { variant: 'error' as const, label: 'Poor' }
    }

    // Calculate overall compliance score based on available data
    const calculateOverallCompliance = () => {
        let totalWeightedScore = 0
        let totalWeight = 0

        if (gstData?.available) {
            totalWeightedScore += (gstData.score / gstData.maxScore) * (gstData.weightage || 3)
            totalWeight += (gstData.weightage || 3)
        }

        if (pfData?.available) {
            totalWeightedScore += (pfData.score / pfData.maxScore) * (pfData.weightage || 2)
            totalWeight += (pfData.weightage || 2)
        }

        // Add audit score - clean audits get full points
        if (auditQualifications?.length) {
            const unqualifiedCount = auditQualifications.filter(a =>
                a.qualification_type?.toLowerCase() === 'unqualified'
            ).length
            const auditScore = (unqualifiedCount / auditQualifications.length) * 2
            totalWeightedScore += auditScore
            totalWeight += 2
        } else {
            totalWeightedScore += 2 // No audit issues
            totalWeight += 2
        }

        // Add legal score - fewer cases is better
        if (!legalCases?.length) {
            totalWeightedScore += 1 // No legal cases
            totalWeight += 1
        } else {
            const disposedCases = legalCases.filter(c =>
                c.status?.toLowerCase() === 'disposed'
            ).length
            totalWeightedScore += (disposedCases / legalCases.length) * 1
            totalWeight += 1
        }

        return totalWeight > 0 ? (totalWeightedScore / totalWeight) * 100 : 0
    }

    const overallCompliance = calculateOverallCompliance()
    const overallBadge = getScoreBadge(overallCompliance / 20)

    // Get case statistics (all pending since we filtered for pending only)
    const pendingCases = legalCases.length
    const disposedCases = legalCases.filter((c: { status: string }) =>
        c.status?.toLowerCase() === 'disposed'
    ).length
    const totalCasesInData = legalData?.data?.filter((case_: { court: any; case_no: any; _row_index: number }) =>
        case_.court && case_.case_no && case_._row_index < 450
    ).length || 0

    // Group cases by category
    const casesByCategory = legalCases.reduce((acc: { [x: string]: any }, case_: { case_category: string }) => {
        const category = case_.case_category || 'Other'
        acc[category] = (acc[category] || 0) + 1
        return acc
    }, {} as Record<string, number>)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Compliance Status
                    </h3>
                    <Badge variant={overallBadge.variant} size="sm">
                        {overallCompliance.toFixed(0)}% {overallBadge.label}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-4">
                {/* GST Compliance */}
                {gstData?.available && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                            <FileText className="w-4 h-4" />
                            GST Compliance
                        </h4>

                        <div className={`p-4 rounded-lg ${getComplianceStatus(gstData.score, gstData.details.compliance_rate).bg}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className={`w-5 h-5 ${getComplianceStatus(gstData.score, gstData.details.compliance_rate).color}`} />
                                    <span className={`font-semibold ${getComplianceStatus(gstData.score, gstData.details.compliance_rate).color}`}>
                                        {gstData.details.compliance_rate}% Compliance
                                    </span>
                                </div>
                                <Badge variant={getScoreBadge(gstData.score).variant} size="sm">
                                    {gstData.benchmark}
                                </Badge>
                            </div>

                            <div className="text-sm text-neutral-70 mb-3">
                                {gstData.value}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* GSTR-1 Analysis */}
                                {gstData.details.gstr1_analysis && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-neutral-60 uppercase tracking-wide">
                                            GSTR-1 Returns
                                        </div>
                                        <div className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-60">On-time:</span>
                                                <span className="font-medium text-green-600">
                                                    {gstData.details.gstr1_analysis.on_time_filings}/{gstData.details.gstr1_analysis.total_filings}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-60">Rate:</span>
                                                <span className="font-medium">
                                                    {gstData.details.gstr1_analysis.compliance_rate}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* GSTR-3B Analysis */}
                                {gstData.details.gstr3b_analysis && (
                                    <div className="space-y-2">
                                        <div className="text-xs font-medium text-neutral-60 uppercase tracking-wide">
                                            GSTR-3B Returns
                                        </div>
                                        <div className="text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-neutral-60">On-time:</span>
                                                <span className="font-medium text-green-600">
                                                    {gstData.details.gstr3b_analysis.on_time_filings}/{gstData.details.gstr3b_analysis.total_filings}
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-neutral-60">Rate:</span>
                                                <span className="font-medium">
                                                    {gstData.details.gstr3b_analysis.compliance_rate}%
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* PF Compliance */}
                {pfData?.available && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                            <Users className="w-4 h-4" />
                            EPFO Compliance
                        </h4>

                        <div className={`p-4 rounded-lg ${getComplianceStatus(pfData.score, pfData.details.compliance_rate).bg}`}>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <CheckCircle className={`w-5 h-5 ${getComplianceStatus(pfData.score, pfData.details.compliance_rate).color}`} />
                                    <span className={`font-semibold ${getComplianceStatus(pfData.score, pfData.details.compliance_rate).color}`}>
                                        {pfData.details.compliance_rate}% Compliance
                                    </span>
                                </div>
                                <Badge variant={getScoreBadge(pfData.score).variant} size="sm">
                                    {pfData.benchmark}
                                </Badge>
                            </div>

                            <div className="text-sm text-neutral-70 mb-3">
                                {pfData.value}
                            </div>

                            {pfData.details.epfo_analysis && (
                                <div className="space-y-3">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <div className="text-neutral-60">Total Payments:</div>
                                            <div className="font-medium">{pfData.details.epfo_analysis.total_payments}</div>
                                        </div>
                                        <div>
                                            <div className="text-neutral-60">Effective Delays:</div>
                                            <div className="font-medium text-red-600">
                                                {pfData.details.epfo_analysis.effective_delayed_payments}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Threshold Rule Explanation */}
                                    {pfData.details.threshold_rule && (
                                        <div className="p-3 bg-blue-50 rounded-md">
                                            <div className="flex items-center gap-2 mb-2">
                                                <AlertTriangle className="w-4 h-4 text-blue-600" />
                                                <span className="text-xs font-medium text-blue-900 uppercase tracking-wide">
                                                    10% Threshold Rule Applied
                                                </span>
                                            </div>
                                            <div className="text-xs text-blue-700">
                                                {pfData.details.threshold_rule}
                                            </div>
                                            {pfData.details.threshold_analysis_summary && (
                                                <div className="mt-2 text-xs text-blue-600">
                                                    {pfData.details.threshold_analysis_summary.delayed_payments_ignored} of {pfData.details.threshold_analysis_summary.total_delayed_payments} delayed payments ignored (affecting &lt;10% employees)
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Improvement Indicator */}
                                    {pfData.details.original_compliance_rate && pfData.details.original_compliance_rate < pfData.details.compliance_rate && (
                                        <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
                                            <TrendingUp className="w-4 h-4 text-green-600" />
                                            <span className="text-sm text-green-700">
                                                Improved from {pfData.details.original_compliance_rate}% to {pfData.details.compliance_rate}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Audit Qualifications */}
                {auditQualifications && auditQualifications.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                            <Building className="w-4 h-4" />
                            Audit Status
                        </h4>

                        <div className="space-y-2">
                            {auditQualifications.slice(0, 3).map((audit, index) => {
                                const isClean = audit.qualification_type?.toLowerCase() === 'unqualified'

                                return (
                                    <div key={index} className={`p-3 rounded-lg ${isClean ? 'bg-green-50' : 'bg-red-50'}`}>
                                        <div className="flex items-center justify-between mb-2">
                                            <div className="text-sm font-medium text-neutral-90">
                                                FY {audit.year}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {isClean ? (
                                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                                ) : (
                                                    <XCircle className="w-4 h-4 text-red-600" />
                                                )}
                                                <span className={`text-sm font-medium ${isClean ? 'text-green-600' : 'text-red-600'}`}>
                                                    {isClean ? 'Clean' : 'Qualified'}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="text-xs text-neutral-60">
                                            Auditor: {audit.auditor}
                                        </div>
                                        {audit.reason && (
                                            <div className="text-xs text-neutral-60 mt-1">
                                                {audit.reason}
                                            </div>
                                        )}
                                    </div>
                                )
                            })}

                            {auditQualifications.length > 3 && (
                                <div className="text-xs text-neutral-60 text-center py-2">
                                    +{auditQualifications.length - 3} more audit records
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Legal Cases */}
                {legalCases && legalCases.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium text-neutral-90 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Legal Cases
                        </h4>

                        <div className="p-3 bg-yellow-50 rounded-lg">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-medium text-yellow-800">
                                    {pendingCases} Recent Pending Case(s)
                                </span>
                                <div className="flex-col gap-2">
                                    <Badge variant="warning" size="sm">
                                        Last 12 Months
                                    </Badge>
                                    <Badge variant="info" size="sm">
                                        {totalCasesInData} Total Cases
                                    </Badge>
                                </div>
                            </div>

                            {/* Case Categories Summary */}
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {Object.entries(casesByCategory).slice(0, 4).map(([category, count]) => (
                                    <div key={category} className="text-xs">
                                        <span className="text-yellow-600">{category}:</span>
                                        <span className="font-medium text-yellow-800 ml-1">{`${count}`}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Recent Cases */}
                            <div className="space-y-2">
                                <div className="text-xs font-medium text-yellow-800 uppercase tracking-wide mb-2">
                                    Recent Cases
                                </div>
                                {legalCases
                                    .filter(c => c.date_of_last_hearing && c.date_of_last_hearing !== '-')
                                    .sort((a, b) => new Date(b.date_of_last_hearing).getTime() - new Date(a.date_of_last_hearing).getTime())
                                    .slice(0, 3)
                                    .map((legalCase, index) => (
                                        <div key={index} className="text-xs text-yellow-700 p-2 bg-yellow-100 rounded">
                                            <div className="font-medium">{legalCase.case_category} - {legalCase.status}</div>
                                            <div className="text-yellow-600">
                                                {legalCase.litigant} • {legalCase.date_of_last_hearing}
                                            </div>
                                        </div>
                                    ))}
                            </div>

                            {legalCases.length > 3 && (
                                <div className="text-xs text-yellow-600 mt-2 text-center">
                                    +{legalCases.length - 3} more cases
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Compliance Summary Cards */}
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gstData?.available && (
                        <div className="p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="font-small text-blue-900">GST Summary</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Score:</span>
                                    <span className="font-semibold text-blue-900">
                                        {gstData.score}/{gstData.maxScore}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Total Filings:</span>
                                    <span className="font-medium text-blue-900">
                                        {gstData.details.total_records}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-blue-700">Late Filings:</span>
                                    <span className="font-medium text-blue-900">
                                        {gstData.details.late_filings}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {pfData?.available && (
                        <div className="p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                                <Users className="w-4 h-4 text-green-600" />
                                <span className="font-small text-green-900">PF Summary</span>
                            </div>
                            <div className="space-y-1 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-green-700">Score:</span>
                                    <span className="font-semibold text-green-900">
                                        {pfData.score}/{pfData.maxScore}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Total Payments:</span>
                                    <span className="font-medium text-green-900">
                                        {pfData.details.epfo_analysis?.total_payments || 0}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-green-700">Effective Delays:</span>
                                    <span className="font-medium text-green-900">
                                        {pfData.details.epfo_analysis?.effective_delayed_payments || 0}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}
                </div> */}

                {/* Legal Case Categories Breakdown */}
                {Object.keys(casesByCategory).length > 0 && (
                    <div className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-3">
                            <FileText className="w-4 h-4 text-gray-600" />
                            <span className="font-small text-gray-900">Case Categories</span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                            {Object.entries(casesByCategory).map(([category, count]) => (
                                <div key={category} className="flex justify-between">
                                    <span className="text-gray-600">{category}:</span>
                                    <span className="font-small text-gray-900">{`${count}`}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Overall Risk Assessment */}
                <div className="p-4 border-l-4 border-blue-400 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Risk Assessment</span>
                    </div>
                    <div className="text-sm text-blue-700">
                        {overallCompliance >= 80 && "Low compliance risk. Strong regulatory adherence across all monitored areas."}
                        {overallCompliance >= 60 && overallCompliance < 80 && "Moderate compliance risk. Generally compliant with some monitoring required."}
                        {overallCompliance >= 40 && overallCompliance < 60 && "Elevated compliance risk. Several areas require attention and improvement."}
                        {overallCompliance < 40 && "High compliance risk. Significant regulatory issues requiring immediate remediation."}
                    </div>

                    {/* Key Metrics */}
                    <div className="mt-3 grid grid-cols-4 gap-4 text-xs">
                        <div>
                            <div className="text-blue-600">GST</div>
                            <div className="font-medium text-blue-900">
                                {gstData?.available ? `${gstData.details.compliance_rate}%` : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">EPFO</div>
                            <div className="font-medium text-blue-900">
                                {pfData?.available ? `${pfData.details.effective_compliance_rate || pfData.details.compliance_rate}%` : 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">Audit</div>
                            <div className="font-medium text-blue-900">
                                {auditQualifications?.length ?
                                    `${auditQualifications.filter(a => a.qualification_type?.toLowerCase() === 'unqualified').length}/${auditQualifications.length} Clean` :
                                    'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">Legal</div>
                            <div className="font-medium text-blue-900">
                                {legalCases?.length ? `${pendingCases}P / ${disposedCases}D` : 'Clean'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Recent Activity Indicator */}
                {(gstData?.details.recent_activity || pfData?.details.recent_activity ||
                    legalCases.some(c => c.date_of_last_hearing && new Date(c.date_of_last_hearing) > new Date('2025-01-01'))) && (
                        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-md">
                            <Clock className="w-4 h-4 text-gray-600" />
                            <span className="text-sm text-gray-700">
                                Recent compliance activity detected
                            </span>
                        </div>
                    )}
            </CardContent>
        </Card>
    )
}