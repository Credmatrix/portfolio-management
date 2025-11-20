'use client'

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert } from '@/components/ui/Alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
    Shield,
    Users,
    Scale,
    AlertTriangle,
    FileText,
    Play,
    Pause,
    CheckCircle,
    XCircle,
    Clock,
    Sparkles,
    Eye,
    Activity,
    BookOpen,
    Target,
    AlertCircle,
    ChevronRight,
    Zap,
    TrendingUp
} from 'lucide-react'
import {
    DeepResearchJob,
    ResearchJobType,
    RESEARCH_PRESETS,
    ResearchPreset
} from '@/types/deep-research.types'
import { ResearchReportViewer } from './ResearchReportViewer'
import { DetailedFindingsDisplay } from './DetailedFindingsDisplay'

interface DeepResearchInterfaceProps {
    requestId: string
    companyName: string
}

interface EnhancedJobStatus extends DeepResearchJob {
    requires_attention?: boolean
    critical_alerts?: number
    estimated_completion?: string
}

/**
 * Renders the DeepResearchInterface UI for managing and viewing an advanced due-diligence workflow.
 *
 * Displays research presets, active and completed job lists, progress indicators, and a Reports view.
 * Manages fetching and polling of research jobs, detects auto-generated comprehensive reports, and
 * exposes controls to start or cancel individual research jobs (which invoke the corresponding API endpoints).
 *
 * @param requestId - The external request identifier used to scope API queries and actions for this workflow.
 * @param companyName - Display name of the company under analysis (used in headers and contextual text).
 * @returns A React element containing the full deep-research interface.
 */
export function DeepResearchInterface({ requestId, companyName }: DeepResearchInterfaceProps) {
    const [activeJobs, setActiveJobs] = useState<EnhancedJobStatus[]>([])
    const [completedJobs, setCompletedJobs] = useState<EnhancedJobStatus[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPreset, setSelectedPreset] = useState<ResearchPreset | null>(null)
    const [activeTab, setActiveTab] = useState('research')
    const [autoReportGenerated, setAutoReportGenerated] = useState(false)
    const [showAutoReportNotification, setShowAutoReportNotification] = useState(false)


    // Enhanced presets with Fluent design elements
    const enhancedPresets = useMemo(() => [
        {
            ...RESEARCH_PRESETS.find(p => p.job_type === 'directors_research')!,
            icon: Users,
            color: 'from-blue-500 to-blue-600',
            description: 'Background verification and risk assessment of key management personnel',
            keyAreas: ['Criminal records', 'Financial history', 'Professional sanctions', 'Regulatory issues']
        },
        {
            ...RESEARCH_PRESETS.find(p => p.job_type === 'legal_research')!,
            icon: Scale,
            color: 'from-purple-500 to-purple-600',
            description: 'Comprehensive legal compliance and litigation analysis',
            keyAreas: ['Active litigation', 'Regulatory penalties', 'Compliance violations', 'Court proceedings']
        },
        {
            ...RESEARCH_PRESETS.find(p => p.job_type === 'negative_news')!,
            icon: AlertTriangle,
            color: 'from-orange-500 to-orange-600',
            description: 'Adverse media and reputational risk monitoring',
            keyAreas: ['Operational issues', 'Financial distress', 'Regulatory actions', 'Market sentiment']
        },
        {
            ...RESEARCH_PRESETS.find(p => p.job_type === 'regulatory_research')!,
            icon: Shield,
            color: 'from-green-500 to-green-600',
            description: 'Regulatory compliance and enforcement action analysis',
            keyAreas: ['SEBI actions', 'Tax disputes', 'Environmental violations', 'Industry compliance']
        }
    ], [])

    useEffect(() => {
        fetchResearchJobs()
    }, [requestId])

    // Separate effect for polling - only when there are active jobs
    useEffect(() => {

        if (activeJobs.length === 0) return

        const interval = setInterval(() => {
            fetchResearchJobs()
        }, 15000)

        return () => clearInterval(interval)
    }, [activeJobs.length])

    // Check for auto-report generation
    useEffect(() => {
        checkForAutoReport()
    }, [completedJobs])



    const fetchResearchJobs = async () => {
        try {
            const response = await fetch(`/api/deep-research/jobs?request_id=${requestId}`)
            if (!response.ok) throw new Error('Failed to fetch research jobs')

            const data = await response.json()
            if (data.success) {
                const active = data.jobs.filter((job: EnhancedJobStatus) =>
                    ['pending', 'running'].includes(job.status)
                )
                const completed = data.jobs.filter((job: EnhancedJobStatus) =>
                    ['completed', 'failed', 'cancelled'].includes(job.status)
                )

                setActiveJobs(active)
                setCompletedJobs(completed)
            }
        } catch (error) {
            console.error('Error fetching research jobs:', error)
        }
    }

    const checkForAutoReport = async () => {
        try {
            const response = await fetch(`/api/deep-research/reports?request_id=${requestId}&auto_generated=true`)
            if (response.ok) {
                const data = await response.json()
                if (data.success && data.reports.length > 0 && !autoReportGenerated) {
                    setAutoReportGenerated(true)
                    setShowAutoReportNotification(true)
                    setTimeout(() => setShowAutoReportNotification(false), 10000)
                }
            }
        } catch (error) {
            console.error('Error checking for auto-report:', error)
        }
    }

    const startResearchJob = async (jobType: ResearchJobType, preset: ResearchPreset) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/deep-research/jobs', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    request_id: requestId,
                    job_type: jobType,
                    research_scope: {
                        ...preset.research_scope,
                        unlimited_budget: true,
                        comprehensive_analysis: true
                    },
                    budget_tokens: 0 // Unlimited budget
                })
            })

            const data = await response.json()

            if (!data.success) {
                setError(data.error || 'Failed to start research')
                return
            }

            await fetchResearchJobs()
            setActiveTab('active')
        } catch (error) {
            setError('Failed to start research')
        } finally {
            setLoading(false)
        }
    }

    const cancelJob = async (jobId: string) => {
        try {
            const response = await fetch(`/api/deep-research/jobs/${jobId}`, { method: 'DELETE' })
            if (response.ok) await fetchResearchJobs()
        } catch (error) {
            console.error('Error cancelling job:', error)
        }
    }

    const getStatusIcon = (status: string, requiresAttention?: boolean) => {
        if (requiresAttention) {
            return <AlertCircle className="w-4 h-4 text-red-600 animate-pulse" />
        }

        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-emerald-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'cancelled': return <XCircle className="w-4 h-4 text-gray-500" />
            case 'running': return <Activity className="w-4 h-4 text-blue-600 animate-pulse" />
            case 'pending': return <Clock className="w-4 h-4 text-amber-600" />
            default: return <Clock className="w-4 h-4 text-gray-500" />
        }
    }

    const getStatusBadgeVariant = (status: string, requiresAttention?: boolean) => {
        if (requiresAttention) return 'error'

        switch (status) {
            case 'completed': return 'success'
            case 'failed': return 'error'
            case 'cancelled': return 'secondary'
            case 'running': return 'info'
            case 'pending': return 'warning'
            default: return 'secondary'
        }
    }

    const completedJobsWithReports = completedJobs.filter(job => job.status === 'completed')
    const researchProgress = (completedJobsWithReports.length / enhancedPresets.length) * 100
    const hasAllResearchComplete = completedJobsWithReports.length === enhancedPresets.length

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
            {/* Auto-report notification */}
            {showAutoReportNotification && (
                <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-2">
                    <Alert className="bg-emerald-50 border-emerald-200 shadow-lg">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <div>
                            <h4 className="font-semibold text-emerald-900">Comprehensive Report Generated</h4>
                            <p className="text-sm text-emerald-700">
                                All research completed - comprehensive report available in Reports tab
                            </p>
                        </div>
                    </Alert>
                </div>
            )}

            <div className="space-y-6 p-6 max-w-7xl mx-auto">
                {/* Enhanced Header with Fluent Design */}
                <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg">
                                    <Sparkles className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-semibold text-slate-900">
                                        Advanced Due Diligence
                                    </h1>
                                    <p className="text-slate-600">
                                        Comprehensive risk assessment for {companyName}
                                    </p>
                                </div>
                            </div>

                            {/* Research Progress Indicator */}
                            <div className="flex items-center gap-4 mt-4">
                                <div className="flex-1 max-w-sm">
                                    <div className="flex items-center justify-between text-sm text-slate-600 mb-1">
                                        <span>Research Progress</span>
                                        <span>{Math.round(researchProgress)}% Complete</span>
                                    </div>
                                    <Progress
                                        value={researchProgress}
                                        className="h-2 bg-slate-200"
                                    />
                                </div>

                                {hasAllResearchComplete && (
                                    <Badge variant="success" className="flex items-center gap-1">
                                        <CheckCircle className="w-3 h-3" />
                                        All Research Complete
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {hasAllResearchComplete && (
                            <Button
                                onClick={() => setActiveTab('reports')}
                                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-lg"
                            >
                                <BookOpen className="w-4 h-4 mr-2" />
                                View Comprehensive Report
                            </Button>
                        )}
                    </div>
                </div>

                {error && (
                    <Alert variant="error" className="bg-red-50 border-red-200">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                            <h4 className="font-semibold">Research Error</h4>
                            <p className="text-sm">{error}</p>
                        </div>
                    </Alert>
                )}

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-5 bg-white/60 backdrop-blur-sm border border-white/20">
                        <TabsTrigger
                            value="research"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            <Target className="w-4 h-4 mr-2" />
                            Research Types
                        </TabsTrigger>
                        <TabsTrigger
                            value="active"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
                        >
                            <Activity className="w-4 h-4" />
                            Active Research
                            {activeJobs.length > 0 && (
                                <Badge variant="info" size="sm" className="ml-1">
                                    {activeJobs.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="completed"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" />
                            Completed
                            {completedJobs.length > 0 && (
                                <Badge variant="secondary" size="sm" className="ml-1">
                                    {completedJobs.length}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="findings"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm flex items-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Detailed Findings
                            {completedJobsWithReports.length > 0 && (
                                <Badge variant="info" size="sm" className="ml-1">
                                    {completedJobsWithReports.reduce((acc, job) => acc + (job.findings?.findings?.length || 0), 0)}
                                </Badge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger
                            value="reports"
                            className="data-[state=active]:bg-white data-[state=active]:shadow-sm"
                        >
                            <FileText className="w-4 h-4 mr-2" />
                            Reports
                            {autoReportGenerated && (
                                <Badge variant="success" size="sm" className="ml-1">
                                    New
                                </Badge>
                            )}
                        </TabsTrigger>
                    </TabsList>

                    {/* Research Types Tab - Enhanced Fluent Design */}
                    <TabsContent value="research" className="space-y-6 mt-6">

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {enhancedPresets.map((preset) => {
                                const Icon = preset.icon
                                const isRunning = activeJobs.some(job => job.job_type === preset.job_type)
                                const isCompleted = completedJobs.some(job =>
                                    job.job_type === preset.job_type && job.status === 'completed'
                                )

                                return (
                                    <Card
                                        key={preset.id}
                                        className={`group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-0 bg-white/80 backdrop-blur-sm ${selectedPreset?.id === preset.id
                                            ? 'ring-2 ring-blue-500 shadow-lg'
                                            : 'hover:bg-white'
                                            }`}
                                        onClick={() => setSelectedPreset(preset)}
                                    >
                                        <CardHeader className="pb-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-3 bg-gradient-to-r ${preset.color} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                                        <Icon className="w-6 h-6 text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="font-semibold text-slate-900 text-lg">
                                                            {preset.name}
                                                        </h3>
                                                        <p className="text-slate-600 text-sm mt-1">
                                                            {preset.description}
                                                        </p>
                                                    </div>
                                                </div>

                                                {isCompleted && (
                                                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                                                )}
                                                {isRunning && (
                                                    <Activity className="w-5 h-5 text-blue-500 animate-pulse" />
                                                )}
                                            </div>
                                        </CardHeader>

                                        <CardContent className="space-y-4">
                                            {/* Key Areas */}
                                            <div>
                                                <h4 className="text-sm font-medium text-slate-700 mb-2">
                                                    Key Analysis Areas
                                                </h4>
                                                <div className="grid grid-cols-2 gap-2">
                                                    {preset.keyAreas.map((area, index) => (
                                                        <div
                                                            key={index}
                                                            className="flex items-center gap-2 text-xs text-slate-600"
                                                        >
                                                            <div className="w-1.5 h-1.5 bg-slate-400 rounded-full"></div>
                                                            {area}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="w-3 h-3" />
                                                        ~{preset.estimated_duration_minutes} min
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Zap className="w-3 h-3" />
                                                        Advanced
                                                    </span>
                                                </div>

                                                <div className="flex gap-2">
                                                    <Button
                                                        size="sm"
                                                        variant={isCompleted ? "outline" : "info"}
                                                        onClick={(e) => {
                                                            e.stopPropagation()
                                                            if (!isRunning && !isCompleted) {
                                                                startResearchJob(preset.job_type, preset)
                                                            }
                                                        }}
                                                        disabled={loading || isRunning}
                                                        className={isCompleted ?
                                                            "text-emerald-600 border-emerald-200 hover:bg-emerald-50" :
                                                            `bg-gradient-to-r ${preset.color} hover:opacity-90 text-white border-0`
                                                        }
                                                    >
                                                        {isCompleted ? (
                                                            <>
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                Completed
                                                            </>
                                                        ) : isRunning ? (
                                                            <>
                                                                <Activity className="w-3 h-3 mr-1 animate-pulse" />
                                                                Running
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="w-3 h-3 mr-1" />
                                                                Start Analysis
                                                            </>
                                                        )}
                                                    </Button>


                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })}
                        </div>

                        {selectedPreset && (
                            <Card className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200">
                                <CardContent className="p-6">
                                    <h4 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
                                        <Eye className="w-4 h-4" />
                                        Analysis Scope - {selectedPreset.name}
                                    </h4>
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div>
                                            <span className="font-medium text-blue-800">Focus Areas:</span>
                                            <ul className="list-none mt-2 space-y-1">
                                                {selectedPreset.research_scope.focus_areas?.map((area, index) => (
                                                    <li key={index} className="flex items-center gap-2 text-blue-700">
                                                        <ChevronRight className="w-3 h-3" />
                                                        {area.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                        <div>
                                            <span className="font-medium text-blue-800">Analysis Period:</span>
                                            <p className="text-blue-700 mt-2">
                                                {selectedPreset.research_scope.time_period_months} months of historical data
                                            </p>

                                            <span className="font-medium text-blue-800 block mt-4">Expected Results:</span>
                                            <ul className="list-none mt-2 space-y-1">
                                                <li className="flex items-center gap-2 text-blue-700">
                                                    <ChevronRight className="w-3 h-3" />
                                                    Risk assessment and scoring
                                                </li>
                                                <li className="flex items-center gap-2 text-blue-700">
                                                    <ChevronRight className="w-3 h-3" />
                                                    Detailed findings report
                                                </li>
                                                <li className="flex items-center gap-2 text-blue-700">
                                                    <ChevronRight className="w-3 h-3" />
                                                    Actionable recommendations
                                                </li>
                                            </ul>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        )}
                    </TabsContent>



                    {/* Active Jobs Tab - Enhanced */}
                    <TabsContent value="active" className="space-y-4 mt-6">
                        {activeJobs.length === 0 ? (
                            <Card className="bg-gradient-to-r from-slate-50 to-blue-50">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Activity className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        No Active Research
                                    </h3>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        Start comprehensive due diligence analysis from the Research Types tab to begin your assessment.
                                    </p>
                                    <Button
                                        onClick={() => setActiveTab('research')}
                                        className="mt-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                                    >
                                        <Target className="w-4 h-4 mr-2" />
                                        Start Research
                                    </Button>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {activeJobs.map((job) => {
                                    const preset = enhancedPresets.find(p => p.job_type === job.job_type)
                                    const Icon = preset?.icon || FileText

                                    return (
                                        <Card key={job.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 bg-gradient-to-r ${preset?.color || 'from-gray-500 to-gray-600'} rounded-lg`}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900">
                                                                {preset?.name || job.job_type}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                Advanced analysis in progress

                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <Badge
                                                            variant={getStatusBadgeVariant(job.status, job.requires_attention)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {getStatusIcon(job.status, job.requires_attention)}
                                                            {job.requires_attention ? 'Requires Attention' : job.status}
                                                        </Badge>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => cancelJob(job.id)}
                                                            disabled={job.status === 'completed'}
                                                        >
                                                            <Pause className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className="text-slate-600">Analysis Progress</span>
                                                        <span className="font-medium text-slate-900">{job.progress}%</span>
                                                    </div>
                                                    <Progress
                                                        value={job.progress}
                                                        className="h-2 bg-slate-100"
                                                    />

                                                    {job.estimated_completion && (
                                                        <p className="text-xs text-slate-500">
                                                            Estimated completion: {new Date(job.estimated_completion).toLocaleTimeString()}
                                                        </p>
                                                    )}
                                                </div>

                                                {job.requires_attention && (
                                                    <Alert className="mt-4 bg-amber-50 border-amber-200">
                                                        <AlertCircle className="w-4 h-4 text-amber-600" />
                                                        <div>
                                                            <h4 className="font-semibold text-amber-900">Attention Required</h4>
                                                            <p className="text-sm text-amber-800">
                                                                Critical findings detected during analysis - enhanced review recommended
                                                            </p>
                                                        </div>
                                                    </Alert>
                                                )}

                                                {job.error_message && (
                                                    <Alert variant="error" className="mt-4">
                                                        <AlertTriangle className="w-4 h-4" />
                                                        <p className="text-sm">{job.error_message}</p>
                                                    </Alert>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>



                    {/* Completed Jobs Tab - Enhanced */}
                    <TabsContent value="completed" className="space-y-4 mt-6">
                        {completedJobs.length === 0 ? (
                            <Card className="bg-gradient-to-r from-slate-50 to-emerald-50">
                                <CardContent className="p-12 text-center">
                                    <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <CheckCircle className="w-8 h-8 text-white" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        No Completed Research
                                    </h3>
                                    <p className="text-slate-600 max-w-md mx-auto">
                                        Completed research analysis will appear here with detailed findings and risk assessments.
                                    </p>
                                </CardContent>
                            </Card>
                        ) : (
                            <div className="space-y-4">
                                {completedJobs.map((job) => {
                                    const preset = enhancedPresets.find(p => p.job_type === job.job_type)
                                    const Icon = preset?.icon || FileText

                                    return (
                                        <Card key={job.id} className="bg-white/80 backdrop-blur-sm border-0 shadow-sm hover:shadow-md transition-shadow">
                                            <CardContent className="p-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 bg-gradient-to-r ${preset?.color || 'from-gray-500 to-gray-600'} rounded-lg`}>
                                                            <Icon className="w-5 h-5 text-white" />
                                                        </div>
                                                        <div>
                                                            <h3 className="font-semibold text-slate-900">
                                                                {preset?.name || job.job_type}
                                                            </h3>
                                                            <p className="text-sm text-slate-600">
                                                                Professional analysis completed
                                                            </p>
                                                        </div>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        <Badge
                                                            variant={getStatusBadgeVariant(job.status, job.requires_attention)}
                                                            className="flex items-center gap-1"
                                                        >
                                                            {getStatusIcon(job.status, job.requires_attention)}
                                                            {job.status === 'completed' ? 'Analysis Complete' : job.status}
                                                        </Badge>
                                                    </div>
                                                </div>

                                                {job.status === 'completed' && job.findings && (
                                                    <div className="space-y-4">
                                                        {/* Enhanced Business Intelligence Summary */}
                                                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-xl p-4">
                                                            <div className="flex items-center justify-between mb-3">
                                                                <span className="text-sm font-medium text-slate-900 flex items-center gap-2">
                                                                    <TrendingUp className="w-4 h-4" />
                                                                    Due Diligence Summary
                                                                </span>
                                                                <div className="flex items-center gap-2">
                                                                    <Badge
                                                                        variant={
                                                                            job.findings.risk_score >= 80 ? 'error' :
                                                                                job.findings.risk_score >= 60 ? 'warning' :
                                                                                    job.findings.risk_score >= 40 ? 'info' : 'success'
                                                                        }
                                                                        className="font-medium text-xs"
                                                                    >
                                                                        Risk: {job.findings.risk_score}/100
                                                                    </Badge>
                                                                    {job.findings.credit_recommendation && (
                                                                        <Badge
                                                                            variant={
                                                                                job.findings.credit_recommendation === 'Decline' ? 'error' :
                                                                                    job.findings.credit_recommendation === 'Further Review' ? 'warning' :
                                                                                        job.findings.credit_recommendation === 'Conditional Approve' ? 'info' : 'success'
                                                                            }
                                                                            className="font-medium text-xs"
                                                                        >
                                                                            {job.findings.credit_recommendation}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            <div className="grid grid-cols-4 gap-3 text-sm mb-3">
                                                                <div>
                                                                    <span className="text-slate-600">Findings:</span>
                                                                    <span className="font-medium text-slate-900 ml-2">
                                                                        {job.findings.findings?.length || 0}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-600">Critical:</span>
                                                                    <span className="font-medium text-red-600 ml-2">
                                                                        {job.findings.findings?.filter((f: any) => f.severity === 'CRITICAL').length || 0}
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-600">Data Quality:</span>
                                                                    <span className="font-medium text-slate-900 ml-2">
                                                                        {job.findings.data_completeness || 0}%
                                                                    </span>
                                                                </div>
                                                                <div>
                                                                    <span className="text-slate-600">Confidence:</span>
                                                                    <span className="font-medium text-slate-900 ml-2">
                                                                        {job.findings.confidence_level}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            {/* Structured Findings Preview */}
                                                            {job.findings.findings && job.findings.findings.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                                    <div className="flex items-center justify-between mb-2">
                                                                        <span className="text-xs font-medium text-slate-700">Key Findings:</span>
                                                                        <Button
                                                                            size="sm"
                                                                            variant="ghost"
                                                                            onClick={() => {
                                                                                // Toggle detailed findings view
                                                                                setActiveTab('findings')
                                                                            }}
                                                                            className="text-xs text-blue-600 hover:text-blue-800"
                                                                        >
                                                                            <Eye className="w-3 h-3 mr-1" />
                                                                            View Details
                                                                        </Button>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {job.findings.findings.slice(0, 3).map((finding: any, index: number) => (
                                                                            <div key={index} className="flex items-start gap-2 text-xs">
                                                                                <Badge
                                                                                    variant={
                                                                                        finding.severity === 'CRITICAL' ? 'error' :
                                                                                            finding.severity === 'HIGH' ? 'warning' :
                                                                                                finding.severity === 'MEDIUM' ? 'info' : 'secondary'
                                                                                    }
                                                                                    size="sm"
                                                                                >
                                                                                    {finding.severity}
                                                                                </Badge>
                                                                                <div className="flex-1">
                                                                                    <div className="font-medium text-slate-900">
                                                                                        {finding.title?.substring(0, 60)}
                                                                                        {finding.title?.length > 60 ? '...' : ''}
                                                                                    </div>
                                                                                    <div className="text-slate-600 mt-1">
                                                                                        {finding.category} • {finding.verification_level} Confidence
                                                                                        {finding.amount && ` • ${finding.amount}`}
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        ))}
                                                                        {job.findings.findings.length > 3 && (
                                                                            <div className="text-xs text-slate-500 text-center pt-2">
                                                                                +{job.findings.findings.length - 3} more findings
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Risk Factors */}
                                                            {job.findings.key_risk_factors && job.findings.key_risk_factors.length > 0 && (
                                                                <div className="mt-3 pt-3 border-t border-slate-200">
                                                                    <span className="text-xs font-medium text-slate-700">Key Risk Factors:</span>
                                                                    <div className="mt-1 flex flex-wrap gap-1">
                                                                        {job.findings.key_risk_factors.slice(0, 3).map((factor, index) => (
                                                                            <Badge key={index} variant="secondary" size="sm" className="text-xs">
                                                                                {factor.length > 25 ? `${factor.substring(0, 25)}...` : factor}
                                                                            </Badge>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}

                                                <div className="flex items-center justify-between text-xs text-slate-500">
                                                    <span>
                                                        Completed: {job.completed_at ?
                                                            new Date(job.completed_at).toLocaleString() : 'Recently'}
                                                    </span>
                                                    <span>Processing: Advanced AI Analysis</span>
                                                </div>

                                                {job.requires_attention && (
                                                    <Alert className="mt-4 bg-red-50 border-red-200">
                                                        <AlertCircle className="w-4 h-4 text-red-600" />
                                                        <div>
                                                            <h4 className="font-semibold text-red-900">Critical Findings</h4>
                                                            <p className="text-sm text-red-800">
                                                                High-risk factors identified - immediate review recommended
                                                            </p>
                                                        </div>
                                                    </Alert>
                                                )}
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        )}
                    </TabsContent>

                    {/* Detailed Findings Tab - Enhanced with Business Impact */}
                    <TabsContent value="findings" className="space-y-6 mt-6">
                        <DetailedFindingsDisplay
                            jobs={[...activeJobs, ...completedJobs]}
                            consolidatedFindings={undefined}
                        />
                    </TabsContent>

                    {/* Reports Tab */}
                    <TabsContent value="reports" className="mt-6">
                        <div className="bg-white/60 backdrop-blur-sm border border-white/20 rounded-2xl p-6">
                            <ResearchReportViewer requestId={requestId} />
                        </div>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    )
}

