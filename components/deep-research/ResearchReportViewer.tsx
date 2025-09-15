'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import {
    FileText,
    Download,
    Eye,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Building2
} from 'lucide-react'
import { DeepResearchReport } from '@/types/deep-research.types'

interface ResearchReportViewerProps {
    requestId: string
}

export function ResearchReportViewer({ requestId }: ResearchReportViewerProps) {
    const [reports, setReports] = useState<DeepResearchReport[]>([])
    const [selectedReport, setSelectedReport] = useState<DeepResearchReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchReports()
    }, [requestId])

    const fetchReports = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/deep-research/reports?request_id=${requestId}`)

            if (!response.ok) throw new Error('Failed to fetch reports')

            const data = await response.json()
            if (data.success) {
                setReports(data.reports)
            }
        } catch (error) {
            setError('Failed to load research reports')
            console.error('Error fetching reports:', error)
        } finally {
            setLoading(false)
        }
    }

    const viewReport = async (reportId: string) => {
        try {
            const response = await fetch(`/api/deep-research/reports/${reportId}`)

            if (!response.ok) throw new Error('Failed to fetch report details')

            const data = await response.json()
            if (data.success) {
                setSelectedReport(data.report)
            }
        } catch (error) {
            setError('Failed to load report details')
            console.error('Error fetching report details:', error)
        }
    }

    const deleteReport = async (reportId: string) => {
        if (!confirm('Are you sure you want to delete this report?')) return

        try {
            const response = await fetch(`/api/deep-research/reports/${reportId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                await fetchReports()
                if (selectedReport?.id === reportId) {
                    setSelectedReport(null)
                }
            }
        } catch (error) {
            setError('Failed to delete report')
            console.error('Error deleting report:', error)
        }
    }

    const getRiskBadgeVariant = (riskLevel?: string) => {
        switch (riskLevel) {
            case 'HIGH': return 'error'
            case 'MEDIUM': return 'warning'
            case 'LOW': return 'success'
            default: return 'secondary'
        }
    }

    const formatReportSection = (content: string) => {
        // Convert markdown-like content to HTML-like structure
        return content
            .split('\n')
            .map((line, index) => {
                if (line.startsWith('# ')) {
                    return <h1 key={index} className="text-2xl font-bold text-neutral-90 mb-4">{line.substring(2)}</h1>
                } else if (line.startsWith('## ')) {
                    return <h2 key={index} className="text-xl font-semibold text-neutral-90 mb-3 mt-6">{line.substring(3)}</h2>
                } else if (line.startsWith('### ')) {
                    return <h3 key={index} className="text-lg font-medium text-neutral-90 mb-2 mt-4">{line.substring(4)}</h3>
                } else if (line.startsWith('- ')) {
                    return <li key={index} className="text-neutral-70 ml-4">{line.substring(2)}</li>
                } else if (line.trim() === '') {
                    return <br key={index} />
                } else {
                    return <p key={index} className="text-neutral-70 mb-2">{line}</p>
                }
            })
    }

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="animate-pulse">
                    <div className="h-6 bg-neutral-20 rounded w-1/3 mb-4"></div>
                    <div className="space-y-3">
                        <div className="h-4 bg-neutral-20 rounded"></div>
                        <div className="h-4 bg-neutral-20 rounded w-5/6"></div>
                        <div className="h-4 bg-neutral-20 rounded w-4/6"></div>
                    </div>
                </div>
            </div>
        )
    }

    if (selectedReport) {
        return (
            <div className="space-y-6">
                {/* Report Header */}
                <div className="flex items-center justify-between">
                    <Button
                        variant="ghost"
                        onClick={() => setSelectedReport(null)}
                        className="flex items-center gap-2"
                    >
                        ← Back to Reports
                    </Button>

                    <div className="flex items-center gap-2">
                        <Badge variant={getRiskBadgeVariant(selectedReport.risk_level)}>
                            {selectedReport.risk_level || 'UNKNOWN'} RISK
                        </Badge>
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-1" />
                            Export PDF
                        </Button>
                    </div>
                </div>

                {/* Report Content */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <FileText className="w-5 h-5 text-blue-600" />
                            <h2 className="text-xl font-bold text-neutral-90">{selectedReport.title}</h2>
                        </div>
                        <p className="text-sm text-neutral-60">
                            Generated on {new Date(selectedReport.generated_at).toLocaleString()}
                        </p>
                    </CardHeader>

                    <CardContent className="space-y-6">
                        {/* Executive Summary */}
                        {selectedReport.executive_summary && (
                            <div>
                                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Executive Summary</h3>
                                <div className="prose prose-sm max-w-none">
                                    {formatReportSection(selectedReport.executive_summary)}
                                </div>
                            </div>
                        )}

                        {/* Report Sections */}
                        {Object.entries(selectedReport.sections).map(([sectionKey, sectionContent]) => (
                            <div key={sectionKey} className="border-t border-neutral-20 pt-6">
                                <div className="prose prose-sm max-w-none">
                                    {formatReportSection(sectionContent as string)}
                                </div>
                            </div>
                        ))}

                        {/* Recommendations */}
                        {selectedReport.recommendations && selectedReport.recommendations.length > 0 && (
                            <div className="border-t border-neutral-20 pt-6">
                                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Recommendations</h3>
                                <ul className="space-y-2">
                                    {selectedReport.recommendations.map((recommendation, index) => (
                                        <li key={index} className="flex items-start gap-2">
                                            <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                                            <span className="text-neutral-70">{recommendation}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Findings Summary */}
                        {selectedReport.findings_summary && (
                            <div className="border-t border-neutral-20 pt-6">
                                <h3 className="text-lg font-semibold text-neutral-90 mb-3">Research Summary</h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    <div className="text-center p-3 bg-neutral-5 rounded-lg">
                                        <div className="text-2xl font-bold text-neutral-90">
                                            {selectedReport.findings_summary.total_findings}
                                        </div>
                                        <div className="text-sm text-neutral-60">Total Research Areas</div>
                                    </div>
                                    <div className="text-center p-3 bg-red-50 rounded-lg">
                                        <div className="text-2xl font-bold text-red-600">
                                            {selectedReport.findings_summary.high_risk_findings}
                                        </div>
                                        <div className="text-sm text-red-600">High Risk</div>
                                    </div>
                                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                                        <div className="text-2xl font-bold text-yellow-600">
                                            {selectedReport.findings_summary.medium_risk_findings}
                                        </div>
                                        <div className="text-sm text-yellow-600">Medium Risk</div>
                                    </div>
                                    <div className="text-center p-3 bg-green-50 rounded-lg">
                                        <div className="text-2xl font-bold text-green-600">
                                            {selectedReport.findings_summary.low_risk_findings}
                                        </div>
                                        <div className="text-sm text-green-600">Low Risk</div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-90">Research Reports</h3>
            </div>

            {error && (
                <Alert variant="error">
                    <AlertTriangle className="w-4 h-4" />
                    <p>{error}</p>
                </Alert>
            )}

            {reports.length === 0 ? (
                <Card>
                    <CardContent className="p-8 text-center">
                        <FileText className="w-12 h-12 text-neutral-40 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                            No Research Reports
                        </h3>
                        <p className="text-neutral-60">
                            Complete research jobs and generate reports to view them here.
                        </p>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {reports.map((report) => (
                        <Card key={report.id} className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-start justify-between mb-3">
                                    <div className="flex items-center gap-2">
                                        <FileText className="w-5 h-5 text-blue-600" />
                                        <h4 className="font-semibold text-neutral-90 line-clamp-1">
                                            {report.title}
                                        </h4>
                                    </div>

                                    {report.risk_level && (
                                        <Badge variant={getRiskBadgeVariant(report.risk_level)} size="sm">
                                            {report.risk_level}
                                        </Badge>
                                    )}
                                </div>

                                <div className="space-y-2 mb-4">
                                    <div className="flex items-center gap-2 text-sm text-neutral-60">
                                        <Building2 className="w-4 h-4" />
                                        <span>{(report as any).portfolio_requests?.company_name}</span>
                                    </div>

                                    <div className="flex items-center gap-2 text-sm text-neutral-60">
                                        <Clock className="w-4 h-4" />
                                        <span>Generated {new Date(report.generated_at).toLocaleDateString()}</span>
                                    </div>
                                </div>

                                {report.findings_summary && (
                                    <div className="flex items-center justify-between text-xs text-neutral-50 mb-4">
                                        <span>{report.findings_summary.total_findings} research areas</span>
                                        <span>{report.recommendations?.length || 0} recommendations</span>
                                    </div>
                                )}

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => viewReport(report.id)}
                                        className="flex-1"
                                    >
                                        <Eye className="w-3 h-3 mr-1" />
                                        View Report
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => deleteReport(report.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}