'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
    FileText,
    Download,
    Eye,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Clock,
    Building2,
    TrendingUp,
    Shield,
    Users,
    Scale,
    Activity,
    BookOpen,
    ArrowLeft,
    ExternalLink,
    Target,
    Zap,
    BarChart3,
    PieChart,
    AlertCircle,
    Info,
    ChevronRight,
    Calendar,
    FileCheck
} from 'lucide-react'
import { DeepResearchReport } from '@/types/deep-research.types'

interface ResearchReportViewerProps {
    requestId: string
}

interface EnhancedReport extends DeepResearchReport {
    auto_generated?: boolean
    company_info?: {
        name: string
        industry: string
        location: string
    }
    research_completion_date?: string
    critical_findings?: number
    high_risk_findings?: number
    medium_risk_findings?: number,
    data_quality_score: number
}

/**
 * Client-side React component that fetches and displays deep research (due diligence) reports for a given request.
 *
 * Renders either a reports list or a detailed report viewer:
 * - Reports list: shows report cards with metadata, risk summary, and actions to view, export (PDF), or delete a report.
 * - Detailed report view: shows an enhanced header, a business-intelligence risk dashboard, a left navigation of dynamic sections (executive summary, processed report sections, recommendations), and formatted section content.
 *
 * The component manages loading and error states, fetches data from the backend, and provides the following interactions:
 * - fetches reports from GET /api/deep-research/reports?request_id={requestId}
 * - loads a single report from GET /api/deep-research/reports/{reportId}
 * - deletes a report via DELETE /api/deep-research/reports/{reportId} (user confirmation required)
 * - exports a report PDF from GET /api/deep-research/reports/{reportId}/export?format=pdf and triggers a browser download
 *
 * The UI transforms raw report sections into navigable items, maps risk levels to visual variants/colors, and formats markdown-like content into headings, lists, and paragraphs.
 *
 * @param requestId - The identifier of the research request whose reports should be listed and viewed.
 * @returns A React element rendering the reports list or the selected report viewer.
 */
export function ResearchReportViewer({ requestId }: ResearchReportViewerProps) {
    const [reports, setReports] = useState<EnhancedReport[]>([])
    const [selectedReport, setSelectedReport] = useState<EnhancedReport | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeSection, setActiveSection] = useState('summary')

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
            setError('Unable to load research reports')
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
            setError('Unable to load report details')
            console.error('Error fetching report details:', error)
        }
    }

    const deleteReport = async (reportId: string) => {
        if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) return

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

    const getRiskColor = (riskLevel?: string) => {
        switch (riskLevel) {
            case 'HIGH': return 'from-red-500 to-red-600'
            case 'MEDIUM': return 'from-amber-500 to-amber-600'
            case 'LOW': return 'from-emerald-500 to-emerald-600'
            default: return 'from-gray-500 to-gray-600'
        }
    }

    const exportToPDF = async (reportId: string) => {
        try {
            const response = await fetch(`/api/deep-research/reports/${reportId}/export?format=pdf`)
            if (response.ok) {
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `due-diligence-report-${reportId}.pdf`
                document.body.appendChild(a)
                a.click()
                window.URL.revokeObjectURL(url)
                document.body.removeChild(a)
            }
        } catch (error) {
            console.error('Export failed:', error)
        }
    }

    // Enhanced report sections processing
    const processReportSections = (sections: any) => {
        if (!sections) return []

        return Object.entries(sections).map(([key, content]) => ({
            id: key.toLowerCase().replace(/\s+/g, '-'),
            title: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
            content: content as string,
            icon: getSectionIcon(key)
        }))
    }

    const getSectionIcon = (sectionKey: string) => {
        const key = sectionKey.toLowerCase()
        if (key.includes('director')) return Users
        if (key.includes('legal')) return Scale
        if (key.includes('news') || key.includes('reputation')) return AlertTriangle
        if (key.includes('risk')) return Shield
        if (key.includes('regulatory')) return FileCheck
        return FileText
    }

    const formatReportContent = (content: string) => {
        return content.split('\n').map((line, index) => {
            line = line.trim()
            if (!line) return <br key={index} />

            if (line.startsWith('# ')) {
                return <h1 key={index} className="text-2xl font-bold text-slate-900 mb-4 mt-6">{line.substring(2)}</h1>
            } else if (line.startsWith('## ')) {
                return <h2 key={index} className="text-xl font-semibold text-slate-800 mb-3 mt-5">{line.substring(3)}</h2>
            } else if (line.startsWith('### ')) {
                return <h3 key={index} className="text-lg font-medium text-slate-800 mb-2 mt-4">{line.substring(4)}</h3>
            } else if (line.startsWith('- ')) {
                return (
                    <div key={index} className="flex items-start gap-2 mb-1">
                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-slate-700">{line.substring(2)}</span>
                    </div>
                )
            } else if (line.match(/^\d+\./)) {
                return (
                    <div key={index} className="flex items-start gap-2 mb-1">
                        <span className="text-blue-600 font-medium">{line.match(/^\d+\./)![0]}</span>
                        <span className="text-slate-700">{line.replace(/^\d+\.\s*/, '')}</span>
                    </div>
                )
            } else {
                return <p key={index} className="text-slate-700 mb-2 leading-relaxed">{line}</p>
            }
        })
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="space-y-4 animate-pulse">
                        <div className="h-8 bg-slate-200 rounded-lg w-1/3"></div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="h-48 bg-slate-200 rounded-xl"></div>
                            <div className="h-48 bg-slate-200 rounded-xl"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (selectedReport) {
        const reportSections = processReportSections(selectedReport.sections)
        const riskStats = selectedReport.findings_summary

        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
                <div className="max-w-7xl mx-auto p-6 space-y-6">
                    {/* Enhanced Report Header */}
                    <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-6">
                            <Button
                                variant="ghost"
                                onClick={() => setSelectedReport(null)}
                                className="flex items-center gap-2 hover:bg-white/60"
                            >
                                <ArrowLeft className="w-4 h-4" />
                                Back to Reports
                            </Button>

                            <div className="flex items-center gap-3">
                                <Badge
                                    variant={getRiskBadgeVariant(selectedReport.risk_level)}
                                    className="px-3 py-1 font-semibold"
                                >
                                    {selectedReport.risk_level || 'PENDING'} RISK
                                </Badge>

                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => exportToPDF(selectedReport.id)}
                                    className="hover:bg-white/60"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Export Report
                                </Button>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6">
                            <div className="md:col-span-2">
                                <div className="flex items-start gap-4">
                                    <div className={`p-3 bg-gradient-to-r ${getRiskColor(selectedReport.risk_level)} rounded-xl shadow-lg`}>
                                        <BookOpen className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-slate-900 mb-2">
                                            {selectedReport.title}
                                        </h1>
                                        <p className="text-slate-600 mb-4">
                                            Comprehensive due diligence assessment with advanced risk analysis
                                        </p>

                                        <div className="flex items-center gap-4 text-sm text-slate-500">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Generated {new Date(selectedReport.generated_at).toLocaleDateString()}
                                            </div>
                                            {selectedReport.auto_generated && (
                                                <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Auto-Generated
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Business Intelligence Dashboard */}
                            {riskStats && (
                                <div className="bg-gradient-to-br from-slate-50 to-white rounded-xl p-4 border border-slate-200/50">
                                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Business Intelligence Overview
                                    </h3>
                                    <div className="space-y-3">

                                        {/* Credit Recommendation */}


                                        {/* Risk Breakdown */}
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-center p-2 bg-red-50 rounded-lg">
                                                <div className="text-lg font-bold text-red-700">
                                                    {riskStats.critical_findings || 0}
                                                </div>
                                                <div className="text-xs text-red-600">Critical</div>
                                            </div>
                                            <div className="text-center p-2 bg-amber-50 rounded-lg">
                                                <div className="text-lg font-bold text-amber-700">
                                                    {riskStats.high_risk_findings || 0}
                                                </div>
                                                <div className="text-xs text-amber-600">High Risk</div>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                                                <div className="text-lg font-bold text-blue-700">
                                                    {riskStats.medium_risk_findings || 0}
                                                </div>
                                                <div className="text-xs text-blue-600">Medium Risk</div>
                                            </div>
                                            <div className="text-center p-2 bg-emerald-50 rounded-lg">
                                                <div className="text-lg font-bold text-emerald-700">
                                                    {riskStats.low_risk_findings || 0}
                                                </div>
                                                <div className="text-xs text-emerald-600">Low Risk</div>
                                            </div>
                                        </div>

                                        {/* Data Quality Indicator */}
                                        <div className="text-center p-2 bg-slate-50 rounded-lg">
                                            <div className="text-lg font-bold text-slate-700">
                                                {selectedReport.data_quality_score || 'N/A'}%
                                            </div>
                                            <div className="text-xs text-slate-600">Data Completeness</div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Enhanced Report Content */}
                    <div className="grid lg:grid-cols-4 gap-6">
                        {/* Navigation Sidebar */}
                        <div className="lg:col-span-1">
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm sticky top-6">
                                <CardHeader className="pb-3">
                                    <h3 className="font-semibold text-slate-900">Report Sections</h3>
                                </CardHeader>
                                <CardContent className="space-y-1">
                                    <Button
                                        variant={activeSection === 'summary' ? 'info' : 'ghost'}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setActiveSection('summary')}
                                    >
                                        <Target className="w-4 h-4 mr-2" />
                                        Executive Summary
                                    </Button>

                                    {reportSections.map((section) => {
                                        const Icon = section.icon
                                        return (
                                            <Button
                                                key={section.id}
                                                variant={activeSection === section.id ? 'info' : 'ghost'}
                                                size="sm"
                                                className="w-full justify-start"
                                                onClick={() => setActiveSection(section.id)}
                                            >
                                                <Icon className="w-4 h-4 mr-2" />
                                                {section.title}
                                            </Button>
                                        )
                                    })}

                                    <Button
                                        variant={activeSection === 'recommendations' ? 'info' : 'ghost'}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setActiveSection('recommendations')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Recommendations
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                                <CardContent className="p-0">
                                    {/* Executive Summary */}
                                    {activeSection === 'summary' && (
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <Target className="w-5 h-5 text-blue-600" />
                                                <h2 className="text-xl font-semibold text-slate-900">Executive Summary</h2>
                                            </div>

                                            {selectedReport.executive_summary ? (
                                                <div className="prose prose-slate max-w-none">
                                                    {formatReportContent(selectedReport.executive_summary)}
                                                </div>
                                            ) : (
                                                <Alert className="bg-blue-50 border-blue-200">
                                                    <Info className="w-4 h-4 text-blue-600" />
                                                    <div>
                                                        <h4 className="font-semibold text-blue-900">Report Summary</h4>
                                                        <p className="text-sm text-blue-800">
                                                            This comprehensive due diligence report provides detailed analysis across multiple risk categories. Navigate through the sections to review specific findings and recommendations.
                                                        </p>
                                                    </div>
                                                </Alert>
                                            )}
                                        </div>
                                    )}

                                    {/* Dynamic Section Content */}
                                    {reportSections.map((section) => (
                                        activeSection === section.id && (
                                            <div key={section.id} className="p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <section.icon className="w-5 h-5 text-blue-600" />
                                                    <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                                                </div>

                                                <div className="prose prose-slate max-w-none">
                                                    {formatReportContent(section.content)}
                                                </div>
                                            </div>
                                        )
                                    ))}

                                    {/* Recommendations Section */}
                                    {activeSection === 'recommendations' && (
                                        <div className="p-6">
                                            <div className="flex items-center gap-2 mb-4">
                                                <CheckCircle className="w-5 h-5 text-emerald-600" />
                                                <h2 className="text-xl font-semibold text-slate-900">Recommendations</h2>
                                            </div>

                                            {selectedReport.recommendations && selectedReport.recommendations.length > 0 ? (
                                                <div className="space-y-3">
                                                    {selectedReport.recommendations.map((recommendation, index) => (
                                                        <div key={index} className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                                                            <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                                                <span className="text-emerald-700 font-semibold text-sm">{index + 1}</span>
                                                            </div>
                                                            <p className="text-emerald-800 leading-relaxed">{recommendation}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <Alert className="bg-slate-50 border-slate-200">
                                                    <Info className="w-4 h-4 text-slate-600" />
                                                    <p className="text-slate-700">
                                                        Recommendations will be populated based on the specific findings and risk assessment results.
                                                    </p>
                                                </Alert>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    // Reports List View
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            <div className="max-w-7xl mx-auto p-6 space-y-6">
                {/* Enhanced Header */}
                <div className="bg-white/80 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                            <BookOpen className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-semibold text-slate-900">Due Diligence Reports</h1>
                            <p className="text-slate-600">
                                Comprehensive risk assessment and analysis reports
                            </p>
                        </div>
                    </div>
                </div>

                {error && (
                    <Alert variant="error" className="bg-red-50 border-red-200">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                            <h4 className="font-semibold">Error Loading Reports</h4>
                            <p className="text-sm">{error}</p>
                        </div>
                    </Alert>
                )}

                {reports.length === 0 ? (
                    <Card className="bg-gradient-to-r from-slate-50 to-blue-50">
                        <CardContent className="p-12 text-center">
                            <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <FileText className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-semibold text-slate-900 mb-3">
                                No Reports Available
                            </h3>
                            <p className="text-slate-600 max-w-lg mx-auto mb-6">
                                Comprehensive due diligence reports will automatically appear here once all research analysis is completed. Each report provides detailed risk assessment and actionable insights.
                            </p>

                            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 max-w-md mx-auto">
                                <Activity className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                                <p className="text-blue-800 font-medium text-sm">
                                    Reports are generated automatically when research completes
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                        {reports.map((report) => (
                            <Card
                                key={report.id}
                                className="group bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                                onClick={() => viewReport(report.id)}
                            >
                                <CardContent className="p-6">
                                    {/* Report Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 bg-gradient-to-r ${getRiskColor(report.risk_level)} rounded-lg shadow-md group-hover:scale-110 transition-transform duration-300`}>
                                                <FileText className="w-5 h-5 text-white" />
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-semibold text-slate-900 line-clamp-2 group-hover:text-blue-600 transition-colors">
                                                    {report.title}
                                                </h3>
                                            </div>
                                        </div>

                                        {report.risk_level && (
                                            <Badge
                                                variant={getRiskBadgeVariant(report.risk_level)}
                                                size="sm"
                                                className="ml-2 font-medium"
                                            >
                                                {report.risk_level}
                                            </Badge>
                                        )}
                                    </div>

                                    {/* Report Metadata */}
                                    <div className="space-y-3 mb-4">
                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Building2 className="w-4 h-4" />
                                            <span>{report.company_info?.name || 'Company Analysis'}</span>
                                        </div>

                                        <div className="flex items-center gap-2 text-sm text-slate-600">
                                            <Calendar className="w-4 h-4" />
                                            <span>Generated {new Date(report.generated_at).toLocaleDateString()}</span>
                                        </div>

                                        {report.auto_generated && (
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Auto-Generated
                                                </Badge>
                                            </div>
                                        )}
                                    </div>

                                    {/* Risk Summary Dashboard */}
                                    {report.findings_summary && (
                                        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg p-3 mb-4">
                                            <div className="grid grid-cols-4 gap-2 text-center">
                                                <div>
                                                    <div className="text-lg font-bold text-red-600">
                                                        {report.findings_summary.high_risk_findings || 0}
                                                    </div>
                                                    <div className="text-xs text-slate-600">Critical</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-amber-600">
                                                        {report.findings_summary.medium_risk_findings || 0}
                                                    </div>
                                                    <div className="text-xs text-slate-600">Medium</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-emerald-600">
                                                        {report.findings_summary.low_risk_findings || 0}
                                                    </div>
                                                    <div className="text-xs text-slate-600">Low</div>
                                                </div>
                                                <div>
                                                    <div className="text-lg font-bold text-blue-600">
                                                        {report.findings_summary.total_findings || 0}
                                                    </div>
                                                    <div className="text-xs text-slate-600">Total</div>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            className="flex-1 group-hover:bg-blue-600 transition-colors"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                viewReport(report.id)
                                            }}
                                        >
                                            <Eye className="w-3 h-3 mr-2" />
                                            View Report
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                exportToPDF(report.id)
                                            }}
                                            className="hover:bg-white/60"
                                        >
                                            <Download className="w-3 h-3" />
                                        </Button>

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                deleteReport(report.id)
                                            }}
                                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        </div>
    )
}