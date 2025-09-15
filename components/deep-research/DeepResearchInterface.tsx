'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert } from '@/components/ui/Alert'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import {
    Search,
    Users,
    Scale,
    AlertTriangle,
    Building2,
    FileText,
    Play,
    Pause,
    Download,
    RefreshCw,
    CheckCircle,
    XCircle,
    Clock,
    Sparkles
} from 'lucide-react'
import {
    DeepResearchJob,
    ResearchJobType,
    RESEARCH_PRESETS,
    ResearchPreset
} from '@/types/deep-research.types'

interface DeepResearchInterfaceProps {
    requestId: string
    companyName: string
}

export function DeepResearchInterface({ requestId, companyName }: DeepResearchInterfaceProps) {
    const [activeJobs, setActiveJobs] = useState<DeepResearchJob[]>([])
    const [completedJobs, setCompletedJobs] = useState<DeepResearchJob[]>([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [selectedPreset, setSelectedPreset] = useState<ResearchPreset | null>(null)
    const [activeTab, setActiveTab] = useState('presets')

    useEffect(() => {
        fetchResearchJobs()
        // Set up polling for active jobs
        const interval = setInterval(() => {
            if (activeJobs.length > 0) {
                fetchResearchJobs()
            }
        }, 5000) // Poll every 5 seconds

        return () => clearInterval(interval)
    }, [requestId])

    const fetchResearchJobs = async () => {
        try {
            const response = await fetch(`/api/deep-research/jobs?request_id=${requestId}`)
            if (!response.ok) throw new Error('Failed to fetch research jobs')

            const data = await response.json()
            if (data.success) {
                const active = data.jobs.filter((job: DeepResearchJob) =>
                    ['pending', 'running'].includes(job.status)
                )
                const completed = data.jobs.filter((job: DeepResearchJob) =>
                    ['completed', 'failed', 'cancelled'].includes(job.status)
                )

                setActiveJobs(active)
                setCompletedJobs(completed)
            }
        } catch (error) {
            console.error('Error fetching research jobs:', error)
        }
    }

    const startResearchJob = async (jobType: ResearchJobType, preset: ResearchPreset) => {
        setLoading(true)
        setError(null)

        try {
            const response = await fetch('/api/deep-research/jobs', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: requestId,
                    job_type: jobType,
                    research_scope: preset.research_scope,
                    budget_tokens: preset.budget_tokens
                })
            })

            const data = await response.json()

            if (data.success) {
                await fetchResearchJobs()
                setActiveTab('active')
            } else {
                setError(data.error || 'Failed to start research job')
            }
        } catch (error) {
            setError('Failed to start research job')
            console.error('Error starting research job:', error)
        } finally {
            setLoading(false)
        }
    }

    const cancelJob = async (jobId: string) => {
        try {
            const response = await fetch(`/api/deep-research/jobs/${jobId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                await fetchResearchJobs()
            }
        } catch (error) {
            console.error('Error cancelling job:', error)
        }
    }

    const generateReport = async () => {
        const completedJobIds = completedJobs
            .filter(job => job.status === 'completed')
            .map(job => job.id)

        if (completedJobIds.length === 0) {
            setError('No completed research jobs available for report generation')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/deep-research/reports', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    request_id: requestId,
                    job_ids: completedJobIds,
                    title: `Due Diligence Report - ${companyName}`
                })
            })

            const data = await response.json()

            if (data.success) {
                // Show success message or redirect to report view
                alert('Research report generated successfully!')
            } else {
                setError(data.error || 'Failed to generate report')
            }
        } catch (error) {
            setError('Failed to generate report')
            console.error('Error generating report:', error)
        } finally {
            setLoading(false)
        }
    }

    const getJobIcon = (jobType: ResearchJobType) => {
        switch (jobType) {
            case 'directors_research': return <Users className="w-4 h-4" />
            case 'legal_research': return <Scale className="w-4 h-4" />
            case 'negative_news': return <AlertTriangle className="w-4 h-4" />
            case 'regulatory_research': return <FileText className="w-4 h-4" />
            case 'related_companies': return <Building2 className="w-4 h-4" />
            case 'full_due_diligence': return <Search className="w-4 h-4" />
            default: return <Search className="w-4 h-4" />
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed': return <CheckCircle className="w-4 h-4 text-green-600" />
            case 'failed': return <XCircle className="w-4 h-4 text-red-600" />
            case 'cancelled': return <XCircle className="w-4 h-4 text-gray-600" />
            case 'running': return <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            case 'pending': return <Clock className="w-4 h-4 text-yellow-600" />
            default: return <Clock className="w-4 h-4 text-gray-600" />
        }
    }

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case 'completed': return 'success'
            case 'failed': return 'error'
            case 'cancelled': return 'secondary'
            case 'running': return 'info'
            case 'pending': return 'warning'
            default: return 'secondary'
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-neutral-90 flex items-center gap-2">
                        <Sparkles className="w-6 h-6 text-blue-600" />
                        Deep Research AI
                    </h2>
                    <p className="text-neutral-60 mt-1">
                        Comprehensive due diligence powered by JINA AI
                    </p>
                </div>

                {completedJobs.filter(job => job.status === 'completed').length > 0 && (
                    <Button
                        onClick={generateReport}
                        disabled={loading}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Generate Report
                    </Button>
                )}
            </div>

            {error && (
                <Alert variant="error">
                    <AlertTriangle className="w-4 h-4" />
                    <div>
                        <h4 className="font-semibold">Error</h4>
                        <p className="text-sm">{error}</p>
                    </div>
                </Alert>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="presets">Research Options</TabsTrigger>
                    <TabsTrigger value="active" className="flex items-center gap-2">
                        Active Jobs
                        {activeJobs.length > 0 && (
                            <Badge variant="info" size="sm">{activeJobs.length}</Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="completed" className="flex items-center gap-2">
                        Completed
                        {completedJobs.length > 0 && (
                            <Badge variant="secondary" size="sm">{completedJobs.length}</Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                {/* Research Presets Tab */}
                <TabsContent value="presets" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {RESEARCH_PRESETS.map((preset) => (
                            <Card
                                key={preset.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${selectedPreset?.id === preset.id ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                onClick={() => setSelectedPreset(preset)}
                            >
                                <CardHeader className="pb-3">
                                    <div className="flex items-center gap-2">
                                        {getJobIcon(preset.job_type)}
                                        <h3 className="font-semibold text-neutral-90">{preset.name}</h3>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <p className="text-sm text-neutral-60">{preset.description}</p>

                                    <div className="flex items-center justify-between text-xs text-neutral-50">
                                        <span>~{preset.estimated_duration_minutes} min</span>
                                        <span>{(preset.budget_tokens / 1000).toFixed(0)}K tokens</span>
                                    </div>

                                    <Button
                                        size="sm"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            startResearchJob(preset.job_type, preset)
                                        }}
                                        disabled={loading || activeJobs.some(job => job.job_type === preset.job_type)}
                                    >
                                        <Play className="w-3 h-3 mr-1" />
                                        Start Research
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {selectedPreset && (
                        <Card className="bg-blue-50 border-blue-200">
                            <CardContent className="p-4">
                                <h4 className="font-semibold text-blue-900 mb-2">Research Scope</h4>
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="font-medium">Focus Areas:</span>
                                        <ul className="list-disc list-inside text-blue-700 mt-1">
                                            {selectedPreset.research_scope.focus_areas?.map((area, index) => (
                                                <li key={index}>{area.replace(/_/g, ' ')}</li>
                                            ))}
                                        </ul>
                                    </div>
                                    <div>
                                        <span className="font-medium">Time Period:</span>
                                        <p className="text-blue-700 mt-1">
                                            {selectedPreset.research_scope.time_period_months} months
                                        </p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </TabsContent>

                {/* Active Jobs Tab */}
                <TabsContent value="active" className="space-y-4">
                    {activeJobs.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <Clock className="w-12 h-12 text-neutral-40 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                                    No Active Research Jobs
                                </h3>
                                <p className="text-neutral-60">
                                    Start a research job from the Research Options tab to begin due diligence.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {activeJobs.map((job) => (
                                <Card key={job.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {getJobIcon(job.job_type)}
                                                <h3 className="font-semibold text-neutral-90">
                                                    {RESEARCH_PRESETS.find(p => p.job_type === job.job_type)?.name || job.job_type}
                                                </h3>
                                                <Badge variant={getStatusBadgeVariant(job.status)} size="sm">
                                                    {job.status}
                                                </Badge>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(job.status)}
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => cancelJob(job.id)}
                                                    disabled={job.status === 'completed'}
                                                >
                                                    <Pause className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-neutral-60">Progress</span>
                                                <span className="text-neutral-90">{job.progress}%</span>
                                            </div>
                                            <Progress value={job.progress} className="h-2" />
                                        </div>

                                        <div className="flex items-center justify-between text-xs text-neutral-50 mt-3">
                                            <span>Started: {new Date(job.created_at).toLocaleTimeString()}</span>
                                            <span>Tokens: {job.tokens_used}</span>
                                        </div>

                                        {job.error_message && (
                                            <Alert variant="error" className="mt-3">
                                                <AlertTriangle className="w-4 h-4" />
                                                <p className="text-sm">{job.error_message}</p>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* Completed Jobs Tab */}
                <TabsContent value="completed" className="space-y-4">
                    {completedJobs.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <FileText className="w-12 h-12 text-neutral-40 mx-auto mb-4" />
                                <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                                    No Completed Research
                                </h3>
                                <p className="text-neutral-60">
                                    Completed research jobs will appear here once finished.
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-4">
                            {completedJobs.map((job) => (
                                <Card key={job.id}>
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <div className="flex items-center gap-2">
                                                {getJobIcon(job.job_type)}
                                                <h3 className="font-semibold text-neutral-90">
                                                    {RESEARCH_PRESETS.find(p => p.job_type === job.job_type)?.name || job.job_type}
                                                </h3>
                                                <Badge variant={getStatusBadgeVariant(job.status)} size="sm">
                                                    {job.status}
                                                </Badge>
                                            </div>

                                            {getStatusIcon(job.status)}
                                        </div>

                                        {job.status === 'completed' && job.risk_assessment && (
                                            <div className="bg-neutral-5 rounded-lg p-3 mb-3">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-sm font-medium text-neutral-90">Risk Assessment</span>
                                                    <Badge
                                                        variant={
                                                            job.risk_assessment.overall_risk_level === 'HIGH' ? 'error' :
                                                                job.risk_assessment.overall_risk_level === 'MEDIUM' ? 'warning' : 'success'
                                                        }
                                                        size="sm"
                                                    >
                                                        {job.risk_assessment.overall_risk_level} RISK
                                                    </Badge>
                                                </div>
                                                <p className="text-xs text-neutral-60">
                                                    {job.risk_assessment.total_issues} issues identified
                                                </p>
                                            </div>
                                        )}

                                        <div className="flex items-center justify-between text-xs text-neutral-50">
                                            <span>
                                                Completed: {job.completed_at ? new Date(job.completed_at).toLocaleString() : 'N/A'}
                                            </span>
                                            <span>Tokens: {job.tokens_used}</span>
                                        </div>

                                        {job.error_message && (
                                            <Alert variant="error" className="mt-3">
                                                <AlertTriangle className="w-4 h-4" />
                                                <p className="text-sm">{job.error_message}</p>
                                            </Alert>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}