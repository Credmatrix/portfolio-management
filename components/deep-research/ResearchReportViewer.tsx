'use client'

import { useState, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Alert } from '@/components/ui/Alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
    FileText,
    Download,
    Eye,
    Trash2,
    AlertTriangle,
    CheckCircle,
    Building2,
    Shield,
    Users,
    Scale,
    Activity,
    BookOpen,
    ArrowLeft,
    Target,
    Zap,
    BarChart3,
    Info,
    Calendar,
    FileCheck,
    Sparkles,
    Brain,
    TrendingUp
} from 'lucide-react'
import { DeepResearchReport, FindingsSummary } from '@/types/deep-research.types'
import { PDFExportHandler } from '@/lib/utils/pdf-export-handler'

interface ResearchReportViewerProps {
    requestId: string
}

interface EnhancedReport extends DeepResearchReport {
    auto_generated?: boolean
    comprehensive_analysis?: boolean
    company_info?: {
        name: string
        industry: string
        location: string
        cin?: string
        pan?: string
    }
    research_completion_date?: string
    critical_findings?: number
    high_risk_findings?: number
    medium_risk_findings?: number
    data_quality_score?: number
    risk_score?: number
    credit_recommendation?: string
    key_risk_factors?: string[]
    mitigating_factors?: string[]
}

interface ComprehensiveReportGenerationStatus {
    is_ready: boolean
    total_completed_jobs: number
    completed_research_types: string[]
    missing_core_types: string[]
    existing_reports: any[]
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
    const [activeSection, setActiveSection] = useState('recommendations')
    const [generationStatus, setGenerationStatus] = useState<ComprehensiveReportGenerationStatus | null>(null)
    const [isGenerating, setIsGenerating] = useState(false)
    const [showGenerationOptions, setShowGenerationOptions] = useState(false)
    const [exportingReports, setExportingReports] = useState<Set<string>>(new Set())

    useEffect(() => {
        fetchReports()
        fetchGenerationStatus()
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

    const fetchGenerationStatus = async () => {
        try {
            const response = await fetch(`/api/deep-research/reports/${requestId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.success) {
                    setGenerationStatus(data.readiness_assessment)
                }
            }
        } catch (error) {
            console.error('Error fetching generation status:', error)
        }
    }

    const generateComprehensiveReport = async (options: {
        force_regenerate?: boolean
        title?: string
        include_executive_summary?: boolean
        include_detailed_findings?: boolean
        include_risk_assessment?: boolean
        include_recommendations?: boolean
    } = {}) => {
        try {
            setIsGenerating(true)
            setError(null)

            const response = await fetch('/api/deep-research/reports/generate-comprehensive', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: requestId,
                    force_regenerate: options.force_regenerate || false,
                    title: options.title,
                    include_executive_summary: options.include_executive_summary !== false,
                    include_detailed_findings: options.include_detailed_findings !== false,
                    include_risk_assessment: options.include_risk_assessment !== false,
                    include_recommendations: options.include_recommendations !== false
                })
            })

            const data = await response.json()

            if (data.success) {
                // Refresh reports list
                await fetchReports()
                await fetchGenerationStatus()
                setShowGenerationOptions(false)

                // Auto-select the new report
                if (data.report?.report_id) {
                    await viewReport(data.report.report_id)
                }
            } else {
                setError(data.message || 'Failed to generate comprehensive report')
            }
        } catch (error) {
            setError('Error generating comprehensive report')
            console.error('Error generating comprehensive report:', error)
        } finally {
            setIsGenerating(false)
        }
    }

    const triggerAutoReportGeneration = async () => {
        try {
            setIsGenerating(true)
            setError(null)

            const response = await fetch('/api/deep-research/reports/auto-generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: requestId,
                    force_generate: false
                })
            })

            const data = await response.json()

            if (data.success) {
                await fetchReports()
                await fetchGenerationStatus()

                if (data.report_id) {
                    await viewReport(data.report_id)
                }
            } else {
                setError(data.message || 'Auto-report generation failed')
            }
        } catch (error) {
            setError('Error triggering auto-report generation')
            console.error('Error triggering auto-report generation:', error)
        } finally {
            setIsGenerating(false)
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

    const exportToPDF = async (reportId: string, type: 'full' | 'summary' = 'full') => {
        // Check browser support
        if (!PDFExportHandler.isBrowserSupported()) {
            setError('PDF export is not supported in this browser')
            return
        }

        // Validate parameters
        try {
            PDFExportHandler.validateExportParams(reportId, type)
        } catch (validationError) {
            setError(PDFExportHandler.getErrorMessage(validationError))
            return
        }

        await PDFExportHandler.exportReport(reportId, {
            type,
            onStart: () => {
                setError(null)
                setExportingReports(prev => new Set(prev).add(`${reportId}-${type}`))
            },
            onSuccess: (filename) => {
                setExportingReports(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(`${reportId}-${type}`)
                    return newSet
                })
                // Could add a success toast here if you have a toast system
            },
            onError: (errorMessage) => {
                setExportingReports(prev => {
                    const newSet = new Set(prev)
                    newSet.delete(`${reportId}-${type}`)
                    return newSet
                })
                setError(PDFExportHandler.getErrorMessage(errorMessage))
            }
        })
    }

    // Enhanced report sections processing
    const processReportSections = (sections: any) => {
        if (!sections) return []

        return Object.entries(sections).filter(([key, content]) => content !== "").map(([key, content]) => ({
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

    // Enhanced markdown components for research reports
    const markdownComponents = {
        // Tables - Enhanced styling for better readability
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-slate-200 shadow-sm">
                <table className="min-w-full border-collapse bg-white text-sm">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }: any) => (
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                {children}
            </thead>
        ),
        tbody: ({ children }: any) => (
            <tbody className="bg-white divide-y divide-slate-200">
                {children}
            </tbody>
        ),
        tr: ({ children }: any) => (
            <tr className="hover:bg-slate-25 transition-colors duration-150">
                {children}
            </tr>
        ),
        th: ({ children }: any) => (
            <th className="px-4 py-3 text-left font-semibold text-slate-900 border-b border-slate-200 text-xs uppercase tracking-wider">
                {children}
            </th>
        ),
        td: ({ children }: any) => (
            <td className="px-4 py-3 text-slate-700 border-b border-slate-100 whitespace-nowrap">
                {children}
            </td>
        ),
        // Headers - Enhanced with better spacing and styling
        h1: ({ children }: any) => (
            <h1 className="text-2xl font-bold text-slate-900 mb-4 mt-6 first:mt-0 pb-2 border-b border-slate-200">
                {children}
            </h1>
        ),
        h2: ({ children }: any) => (
            <h2 className="text-xl font-bold text-slate-900 mb-3 mt-5 first:mt-0 pb-1 border-b border-slate-100">
                {children}
            </h2>
        ),
        h3: ({ children }: any) => (
            <h3 className="text-lg font-semibold text-slate-900 mb-2 mt-4 first:mt-0 text-blue-900">
                {children}
            </h3>
        ),
        h4: ({ children }: any) => (
            <h4 className="text-base font-semibold text-slate-800 mb-2 mt-3 first:mt-0 text-blue-800">
                {children}
            </h4>
        ),
        h5: ({ children }: any) => (
            <h5 className="text-sm font-semibold text-slate-800 mb-2 mt-3 first:mt-0 text-blue-700">
                {children}
            </h5>
        ),
        h6: ({ children }: any) => (
            <h6 className="text-sm font-medium text-slate-700 mb-2 mt-2 first:mt-0 text-blue-600">
                {children}
            </h6>
        ),
        // Paragraphs and text - Better spacing
        p: ({ children }: any) => (
            <p className="mb-3 text-slate-700 leading-relaxed text-sm">
                {children}
            </p>
        ),
        // Lists - Enhanced styling
        ul: ({ children }: any) => (
            <ul className="list-disc list-outside ml-4 mb-3 space-y-1 text-slate-700">
                {children}
            </ul>
        ),
        ol: ({ children }: any) => (
            <ol className="list-decimal list-outside ml-4 mb-3 space-y-1 text-slate-700">
                {children}
            </ol>
        ),
        li: ({ children }: any) => (
            <li className="text-slate-700 text-sm leading-relaxed">
                {children}
            </li>
        ),
        // Code - Enhanced styling
        code: ({ children, className }: any) => {
            const isInline = !className
            if (isInline) {
                return (
                    <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs font-mono border border-blue-200">
                        {children}
                    </code>
                )
            }
            return (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono mb-4 border border-gray-700">
                    <code>{children}</code>
                </pre>
            )
        },
        // Emphasis - Enhanced styling
        strong: ({ children }: any) => (
            <strong className="font-semibold text-slate-900 bg-yellow-100 px-1 rounded">
                {children}
            </strong>
        ),
        em: ({ children }: any) => (
            <em className="italic text-slate-700 font-medium">
                {children}
            </em>
        ),
        // Blockquotes - Enhanced styling for research findings
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-3 my-4 bg-gradient-to-r from-blue-50 to-blue-25 text-slate-700 italic rounded-r-lg">
                {children}
            </blockquote>
        ),
        // Horizontal rule - Enhanced styling
        hr: () => (
            <hr className="border-t-2 border-gradient-to-r from-transparent via-slate-300 to-transparent my-6" />
        ),
        // Links - Enhanced styling
        a: ({ children, href }: any) => (
            <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 hover:bg-blue-50 px-1 rounded transition-colors"
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        )
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

                                <div className="flex items-center gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportToPDF(selectedReport.id, 'full')}
                                        disabled={exportingReports.has(`${selectedReport.id}-full`)}
                                        className="hover:bg-white/60"
                                    >
                                        {exportingReports.has(`${selectedReport.id}-full`) ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Download className="w-4 h-4 mr-2" />
                                                Full Report
                                            </>
                                        )}
                                    </Button>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => exportToPDF(selectedReport.id, 'summary')}
                                        disabled={exportingReports.has(`${selectedReport.id}-summary`)}
                                        className="hover:bg-white/60"
                                    >
                                        {exportingReports.has(`${selectedReport.id}-summary`) ? (
                                            <>
                                                <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin mr-2" />
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <FileText className="w-4 h-4 mr-2" />
                                                Summary
                                            </>
                                        )}
                                    </Button>
                                </div>
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
                                    {/* <Button
                                        variant={activeSection === 'summary' ? 'info' : 'ghost'}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setActiveSection('summary')}
                                    >
                                        <Target className="w-4 h-4 mr-2" />
                                        Executive Summary
                                    </Button> */}

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

                                    {/* <Button
                                        variant={activeSection === 'recommendations' ? 'info' : 'ghost'}
                                        size="sm"
                                        className="w-full justify-start"
                                        onClick={() => setActiveSection('recommendations')}
                                    >
                                        <CheckCircle className="w-4 h-4 mr-2" />
                                        Recommendations
                                    </Button> */}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Main Content */}
                        <div className="lg:col-span-3">
                            <Card className="bg-white/80 backdrop-blur-sm border-0 shadow-sm">
                                <CardContent className="p-0">

                                    {/* Dynamic Section Content */}
                                    {reportSections.map((section) => (
                                        activeSection === section.id && (
                                            <div key={section.id} className="p-6">
                                                <div className="flex items-center gap-2 mb-4">
                                                    <section.icon className="w-5 h-5 text-blue-600" />
                                                    <h2 className="text-xl font-semibold text-slate-900">{section.title}</h2>
                                                </div>

                                                <div className="prose prose-slate max-w-none">
                                                    <ReactMarkdown
                                                        remarkPlugins={[remarkGfm]}
                                                        components={markdownComponents}
                                                    >
                                                        {section.content}
                                                    </ReactMarkdown>
                                                </div>
                                            </div>
                                        )
                                    ))}
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

                {/* Comprehensive Report Generation Section */}
                {generationStatus && (
                    <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                        <Brain className="w-6 h-6 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                                            AI-Powered Comprehensive Report
                                            <Sparkles className="w-4 h-4 text-purple-500" />
                                        </h3>
                                        <p className="text-slate-600 text-sm">
                                            Generate professional due diligence reports with Claude AI synthesis
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {generationStatus.is_ready ? (
                                        <Badge variant="success" className="flex items-center gap-1">
                                            <CheckCircle className="w-3 h-3" />
                                            Ready
                                        </Badge>
                                    ) : (
                                        <Badge variant="warning" className="flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" />
                                            Pending
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="bg-white/60 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {generationStatus.total_completed_jobs}
                                    </div>
                                    <div className="text-sm text-slate-600">Completed Research Jobs</div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-green-600">
                                        {generationStatus.completed_research_types.length}
                                    </div>
                                    <div className="text-sm text-slate-600">Research Types Done</div>
                                </div>
                                <div className="bg-white/60 rounded-lg p-3">
                                    <div className="text-2xl font-bold text-purple-600">
                                        {generationStatus.existing_reports && generationStatus.existing_reports.length}
                                    </div>
                                    <div className="text-sm text-slate-600">Existing Reports</div>
                                </div>
                            </div>

                            {generationStatus.missing_core_types.length > 0 && (
                                <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-amber-800 mb-2">
                                        <Info className="w-4 h-4" />
                                        <span className="font-medium">Missing Core Research</span>
                                    </div>
                                    <div className="text-sm text-amber-700">
                                        Complete these research types for optimal report quality: {generationStatus.missing_core_types.join(', ')}
                                    </div>
                                </div>
                            )}

                            <div className="mt-4 flex items-center gap-3">
                                {generationStatus.is_ready ? (
                                    <>
                                        <Button
                                            onClick={() => triggerAutoReportGeneration()}
                                            disabled={isGenerating}
                                            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                        >
                                            {isGenerating ? (
                                                <>
                                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                                                    Generating...
                                                </>
                                            ) : (
                                                <>
                                                    <Sparkles className="w-4 h-4 mr-2" />
                                                    Generate Comprehensive Report
                                                </>
                                            )}
                                        </Button>

                                        <Button
                                            variant="outline"
                                            onClick={() => setShowGenerationOptions(!showGenerationOptions)}
                                            disabled={isGenerating}
                                        >
                                            <Target className="w-4 h-4 mr-2" />
                                            Custom Options
                                        </Button>
                                    </>
                                ) : (
                                    <Button disabled className="bg-gray-400">
                                        <AlertTriangle className="w-4 h-4 mr-2" />
                                        Complete Research First
                                    </Button>
                                )}

                                {generationStatus.existing_reports && generationStatus.existing_reports.length > 0 && (
                                    <Button
                                        variant="outline"
                                        onClick={() => generateComprehensiveReport({ force_regenerate: true })}
                                        disabled={isGenerating}
                                        className="text-orange-600 border-orange-300 hover:bg-orange-50"
                                    >
                                        <TrendingUp className="w-4 h-4 mr-2" />
                                        Regenerate
                                    </Button>
                                )}
                            </div>

                            {showGenerationOptions && (
                                <div className="mt-4 p-4 bg-white/80 rounded-lg border border-blue-200">
                                    <h4 className="font-medium text-slate-900 mb-3">Custom Report Options</h4>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => generateComprehensiveReport({
                                                include_executive_summary: true,
                                                include_detailed_findings: true,
                                                include_risk_assessment: true,
                                                include_recommendations: true
                                            })}
                                            disabled={isGenerating}
                                        >
                                            <FileCheck className="w-4 h-4 mr-2" />
                                            Full Report
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => generateComprehensiveReport({
                                                include_executive_summary: true,
                                                include_risk_assessment: true,
                                                include_recommendations: true,
                                                include_detailed_findings: false
                                            })}
                                            disabled={isGenerating}
                                        >
                                            <BarChart3 className="w-4 h-4 mr-2" />
                                            Executive Summary
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
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

                                        <div className="flex items-center gap-2 flex-wrap">
                                            {report.auto_generated && (
                                                <Badge variant="secondary" size="sm" className="flex items-center gap-1">
                                                    <Zap className="w-3 h-3" />
                                                    Auto-Generated
                                                </Badge>
                                            )}
                                            {report.comprehensive_analysis && (
                                                <Badge variant="primary" size="sm" className="flex items-center gap-1 bg-gradient-to-r from-blue-500 to-purple-600">
                                                    <Brain className="w-3 h-3" />
                                                    AI-Enhanced
                                                </Badge>
                                            )}
                                            {report.report_type === 'comprehensive_due_diligence' && (
                                                <Badge variant="success" size="sm" className="flex items-center gap-1">
                                                    <Sparkles className="w-3 h-3" />
                                                    Comprehensive
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    {/* Risk Summary Dashboard */}
                                    {report.findings_summary && (
                                        <div className="bg-gradient-to-r from-slate-50 to-slate-100/50 rounded-lg p-3 mb-4">
                                            <div className="grid grid-cols-4 gap-2 text-center mb-3">
                                                <div>
                                                    <div className="text-lg font-bold text-red-600">
                                                        {report.findings_summary.critical_findings || report.findings_summary.high_risk_findings || 0}
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

                                            {/* Enhanced metrics for comprehensive reports */}
                                            {report.report_type === 'comprehensive_due_diligence' && (
                                                <div className="border-t border-slate-200 pt-3">
                                                    <div className="grid grid-cols-2 gap-3 text-center">
                                                        {report.risk_score && (
                                                            <div className="bg-white/60 rounded p-2">
                                                                <div className="text-sm font-bold text-purple-600">
                                                                    {report.risk_score}/100
                                                                </div>
                                                                <div className="text-xs text-slate-600">Risk Score</div>
                                                            </div>
                                                        )}
                                                        {report.data_quality_score && (
                                                            <div className="bg-white/60 rounded p-2">
                                                                <div className="text-sm font-bold text-green-600">
                                                                    {report.data_quality_score}%
                                                                </div>
                                                                <div className="text-xs text-slate-600">Data Quality</div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    {report.credit_recommendation && (
                                                        <div className="mt-2 text-center">
                                                            <Badge
                                                                variant={
                                                                    report.credit_recommendation === 'Approve' ? 'success' :
                                                                        report.credit_recommendation === 'Decline' ? 'error' :
                                                                            'warning'
                                                                }
                                                                size="sm"
                                                            >
                                                                {report.credit_recommendation}
                                                            </Badge>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
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

                                        <div className="flex items-center gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    exportToPDF(report.id, 'full')
                                                }}
                                                disabled={exportingReports.has(`${report.id}-full`)}
                                                className="hover:bg-white/60"
                                                title="Export Full Report"
                                            >
                                                {exportingReports.has(`${report.id}-full`) ? (
                                                    <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                                ) : (
                                                    <Download className="w-3 h-3" />
                                                )}
                                            </Button>

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    exportToPDF(report.id, 'summary')
                                                }}
                                                disabled={exportingReports.has(`${report.id}-summary`)}
                                                className="hover:bg-white/60"
                                                title="Export Summary"
                                            >
                                                {exportingReports.has(`${report.id}-summary`) ? (
                                                    <div className="w-3 h-3 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                                ) : (
                                                    <FileText className="w-3 h-3" />
                                                )}
                                            </Button>
                                        </div>

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