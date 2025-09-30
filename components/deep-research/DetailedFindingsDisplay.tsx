'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Alert } from '@/components/ui/Alert'
import {
    Eye,
    AlertTriangle,
    CheckCircle,
    Target,
    TrendingUp,
    Shield,
    DollarSign,
    Clock,
    AlertCircle,
    ChevronRight,
    ChevronDown,
    Filter,
    Search,
    BarChart3,
    Activity,
    Zap
} from 'lucide-react'
import {
    StructuredFinding,
    BusinessImpact,
    DeepResearchJob,
    ConsolidatedFindings
} from '@/types/deep-research.types'

interface DetailedFindingsDisplayProps {
    jobs: DeepResearchJob[]
    consolidatedFindings?: ConsolidatedFindings
}

interface FindingWithMetadata extends StructuredFinding {
    jobType: string
    jobName: string
    iterationNumber?: number
    confidenceScore?: number
}

export function DetailedFindingsDisplay({ jobs, consolidatedFindings }: DetailedFindingsDisplayProps) {
    const [selectedSeverity, setSelectedSeverity] = useState<string>('all')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [searchTerm, setSearchTerm] = useState('')
    const [expandedFindings, setExpandedFindings] = useState<Set<string>>(new Set())
    const [sortBy, setSortBy] = useState<'severity' | 'date' | 'confidence' | 'impact'>('severity')

    // Extract all findings from completed jobs
    const allFindings: FindingWithMetadata[] = jobs
        .filter(job => job.status === 'completed' && job.findings?.findings)
        .flatMap(job =>
            (job.findings.findings || []).map((finding: any) => ({
                ...finding,
                jobType: job.job_type,
                jobName: getJobDisplayName(job.job_type),
                iterationNumber: job.current_iteration,
                confidenceScore: job.findings?.confidence_level === 'High' ? 90 :
                    job.findings?.confidence_level === 'Medium' ? 70 : 50
            }))
        )

    // Filter and sort findings
    const filteredFindings = allFindings
        .filter(finding => {
            if (selectedSeverity !== 'all' && finding.severity !== selectedSeverity) return false
            if (selectedCategory !== 'all' && finding.category !== selectedCategory) return false
            if (searchTerm && !finding.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
                !finding.description.toLowerCase().includes(searchTerm.toLowerCase())) return false
            return true
        })
        .sort((a, b) => {
            switch (sortBy) {
                case 'severity':
                    const severityOrder = { 'CRITICAL': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1, 'INFO': 0 }
                    return (severityOrder[b.severity as keyof typeof severityOrder] || 0) -
                        (severityOrder[a.severity as keyof typeof severityOrder] || 0)
                case 'date':
                    return new Date(b.date || '').getTime() - new Date(a.date || '').getTime()
                case 'confidence':
                    return (b.confidenceScore || 0) - (a.confidenceScore || 0)
                case 'impact':
                    const impactScore = (finding: FindingWithMetadata) => {
                        if (!finding.business_impact) return 0
                        const risks = [
                            finding.business_impact.financial_risk,
                            finding.business_impact.operational_risk,
                            finding.business_impact.reputational_risk,
                            finding.business_impact.regulatory_risk
                        ]
                        return risks.filter(risk => risk === 'High').length * 3 +
                            risks.filter(risk => risk === 'Medium').length * 2 +
                            risks.filter(risk => risk === 'Low').length * 1
                    }
                    return impactScore(b) - impactScore(a)
                default:
                    return 0
            }
        })

    // Get unique categories and severities for filters
    const categories = [...new Set(allFindings.map(f => f.category))].filter(Boolean)
    const severities = [...new Set(allFindings.map(f => f.severity))].filter(Boolean)

    // Calculate summary statistics
    const summaryStats = {
        total: allFindings.length,
        critical: allFindings.filter(f => f.severity === 'CRITICAL').length,
        high: allFindings.filter(f => f.severity === 'HIGH').length,
        medium: allFindings.filter(f => f.severity === 'MEDIUM').length,
        low: allFindings.filter(f => f.severity === 'LOW').length,
        actionRequired: allFindings.filter(f => f.action_required).length,
        highConfidence: allFindings.filter(f => f.verification_level === 'High').length
    }

    const toggleFindingExpansion = (findingId: string) => {
        const newExpanded = new Set(expandedFindings)
        if (newExpanded.has(findingId)) {
            newExpanded.delete(findingId)
        } else {
            newExpanded.add(findingId)
        }
        setExpandedFindings(newExpanded)
    }

    function getJobDisplayName(jobType: string): string {
        const names: Record<string, string> = {
            'directors_research': 'Directors Research',
            'legal_research': 'Legal Research',
            'negative_news': 'Negative News Analysis',
            'regulatory_research': 'Regulatory Research',
            'full_due_diligence': 'Full Due Diligence'
        }
        return names[jobType] || jobType
    }

    function getSeverityColor(severity: string): string {
        switch (severity) {
            case 'CRITICAL': return 'text-red-600 bg-red-50 border-red-200'
            case 'HIGH': return 'text-orange-600 bg-orange-50 border-orange-200'
            case 'MEDIUM': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
            case 'LOW': return 'text-blue-600 bg-blue-50 border-blue-200'
            default: return 'text-gray-600 bg-gray-50 border-gray-200'
        }
    }

    function getVerificationColor(level: string): string {
        switch (level) {
            case 'High': return 'text-emerald-600 bg-emerald-50'
            case 'Medium': return 'text-yellow-600 bg-yellow-50'
            case 'Low': return 'text-red-600 bg-red-50'
            default: return 'text-gray-600 bg-gray-50'
        }
    }

    function getRiskColor(risk: string) {
        switch (risk) {
            case 'High': return 'error'
            case 'Medium': return 'warning'
            case 'Low': return 'secondary'
            default: return 'secondary'
        }
    }

    return (
        <div className="space-y-6">
            {/* Summary Dashboard */}
            <Card className="bg-gradient-to-r from-slate-50 to-blue-50 border-slate-200">
                <CardHeader>
                    <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Findings Summary Dashboard
                    </h3>
                    <p className="text-slate-600 text-sm">
                        Comprehensive overview of all research findings with business impact analysis
                    </p>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-slate-900">{summaryStats.total}</div>
                            <div className="text-xs text-slate-600">Total Findings</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-red-600">{summaryStats.critical}</div>
                            <div className="text-xs text-slate-600">Critical</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-orange-600">{summaryStats.high}</div>
                            <div className="text-xs text-slate-600">High Risk</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-yellow-600">{summaryStats.medium}</div>
                            <div className="text-xs text-slate-600">Medium Risk</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{summaryStats.low}</div>
                            <div className="text-xs text-slate-600">Low Risk</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-amber-600">{summaryStats.actionRequired}</div>
                            <div className="text-xs text-slate-600">Action Required</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-emerald-600">{summaryStats.highConfidence}</div>
                            <div className="text-xs text-slate-600">High Confidence</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Filters and Controls */}
            <Card className="bg-white/80 backdrop-blur-sm">
                <CardContent className="p-4">
                    <div className="flex flex-wrap items-center gap-4">
                        {/* Search */}
                        <div className="flex items-center gap-2 flex-1 min-w-64">
                            <Search className="w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search findings..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Severity Filter */}
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400" />
                            <select
                                value={selectedSeverity}
                                onChange={(e) => setSelectedSeverity(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Severities</option>
                                {severities.map(severity => (
                                    <option key={severity} value={severity}>{severity}</option>
                                ))}
                            </select>
                        </div>

                        {/* Category Filter */}
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedCategory}
                                onChange={(e) => setSelectedCategory(e.target.value)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>{category}</option>
                                ))}
                            </select>
                        </div>

                        {/* Sort By */}
                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as any)}
                                className="px-3 py-2 border border-slate-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="severity">Sort by Severity</option>
                                <option value="date">Sort by Date</option>
                                <option value="confidence">Sort by Confidence</option>
                                <option value="impact">Sort by Impact</option>
                            </select>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Findings List */}
            <div className="space-y-4">
                {filteredFindings.length === 0 ? (
                    <Card className="bg-slate-50">
                        <CardContent className="p-12 text-center">
                            <Eye className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-slate-900 mb-2">No Findings Found</h3>
                            <p className="text-slate-600">
                                {allFindings.length === 0
                                    ? "Complete research analysis to view detailed findings here."
                                    : "Try adjusting your filters to see more results."
                                }
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    filteredFindings.map((finding, index) => {
                        const isExpanded = expandedFindings.has(finding.id)

                        return (
                            <Card key={`${finding.id}-${index}`} className="bg-white/90 backdrop-blur-sm hover:shadow-md transition-shadow">
                                <CardContent className="p-6">
                                    {/* Finding Header */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="flex items-start gap-4 flex-1">
                                            <Badge
                                                className={`${getSeverityColor(finding.severity)} font-medium`}
                                            >
                                                {finding.severity}
                                            </Badge>
                                            <div className="flex-1">
                                                <h4 className="font-semibold text-slate-900 mb-1">
                                                    {finding.title}
                                                </h4>
                                                <p className="text-sm text-slate-600 mb-2">
                                                    {finding.description}
                                                </p>
                                                <div className="flex items-center gap-4 text-xs text-slate-500">
                                                    <span className="flex items-center gap-1">
                                                        <Target className="w-3 h-3" />
                                                        {finding.jobName}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Activity className="w-3 h-3" />
                                                        {finding.category}
                                                    </span>
                                                    {finding.date && (
                                                        <span className="flex items-center gap-1">
                                                            <Clock className="w-3 h-3" />
                                                            {new Date(finding.date).toLocaleDateString()}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3">
                                            {/* Verification Level */}
                                            <Badge
                                                className={`${getVerificationColor(finding.verification_level)} text-xs`}
                                            >
                                                <Zap className="w-3 h-3 mr-1" />
                                                {finding.verification_level} Confidence
                                            </Badge>

                                            {/* Expand/Collapse Button */}
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => toggleFindingExpansion(finding.id)}
                                            >
                                                {isExpanded ? (
                                                    <ChevronDown className="w-4 h-4" />
                                                ) : (
                                                    <ChevronRight className="w-4 h-4" />
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Quick Info Row */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4 text-xs">
                                        <div>
                                            <span className="text-slate-500">Status:</span>
                                            <div className="font-medium text-slate-900">{finding.status || 'Unknown'}</div>
                                        </div>
                                        {finding.amount && (
                                            <div>
                                                <span className="text-slate-500">Amount:</span>
                                                <div className="font-medium text-slate-900">{finding.amount}</div>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-slate-500">Timeline:</span>
                                            <div className="font-medium text-slate-900">{finding.timeline_impact}</div>
                                        </div>
                                        {finding.action_required && (
                                            <div className="flex items-center gap-1">
                                                <AlertCircle className="w-3 h-3 text-amber-600" />
                                                <span className="text-amber-700 font-medium">Action Required</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Expanded Details */}
                                    {isExpanded && (
                                        <div className="space-y-4 pt-4 border-t border-slate-100">
                                            {/* Detailed Description */}
                                            {finding.details && (
                                                <div>
                                                    <h5 className="font-medium text-slate-900 mb-2">Detailed Information</h5>
                                                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                                                        {finding.details}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Business Impact Analysis */}
                                            {finding.business_impact && (
                                                <div>
                                                    <h5 className="font-medium text-slate-900 mb-3 flex items-center gap-2">
                                                        <TrendingUp className="w-4 h-4" />
                                                        Business Impact Analysis
                                                    </h5>
                                                    <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                                            <div>
                                                                <span className="text-slate-600 text-xs block mb-1">Financial Risk</span>
                                                                <Badge variant={getRiskColor(finding.business_impact.financial_risk)}>
                                                                    {finding.business_impact.financial_risk}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600 text-xs block mb-1">Operational Risk</span>
                                                                <Badge variant={getRiskColor(finding.business_impact.operational_risk)}>
                                                                    {finding.business_impact.operational_risk}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600 text-xs block mb-1">Reputational Risk</span>
                                                                <Badge variant={getRiskColor(finding.business_impact.reputational_risk)}>
                                                                    {finding.business_impact.reputational_risk}
                                                                </Badge>
                                                            </div>
                                                            <div>
                                                                <span className="text-slate-600 text-xs block mb-1">Regulatory Risk</span>
                                                                <Badge variant={getRiskColor(finding.business_impact.regulatory_risk || 'Low')}>
                                                                    {finding.business_impact.regulatory_risk || 'Low'}
                                                                </Badge>
                                                            </div>
                                                        </div>

                                                        {finding.business_impact.probability_of_occurrence && (
                                                            <div className="mb-3">
                                                                <div className="flex items-center justify-between text-sm mb-1">
                                                                    <span className="text-slate-600">Probability of Occurrence</span>
                                                                    <span className="font-medium">{finding.business_impact.probability_of_occurrence}%</span>
                                                                </div>
                                                                <Progress
                                                                    value={finding.business_impact.probability_of_occurrence}
                                                                    className="h-2"
                                                                />
                                                            </div>
                                                        )}

                                                        {finding.business_impact.estimated_financial_exposure && (
                                                            <div className="flex items-center gap-2 text-sm">
                                                                <DollarSign className="w-4 h-4 text-green-600" />
                                                                <span className="text-slate-600">Estimated Financial Exposure:</span>
                                                                <span className="font-medium text-slate-900">
                                                                    ${finding.business_impact.estimated_financial_exposure.toLocaleString()}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Regulatory Implications */}
                                            {finding.regulatory_implications && (
                                                <div>
                                                    <h5 className="font-medium text-slate-900 mb-2 flex items-center gap-2">
                                                        <Shield className="w-4 h-4" />
                                                        Regulatory Implications
                                                    </h5>
                                                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                                        <p className="text-amber-800 text-sm">{finding.regulatory_implications}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Stakeholder Impact */}
                                            {finding.stakeholder_impact && (
                                                <div>
                                                    <h5 className="font-medium text-slate-900 mb-2">Stakeholder Impact</h5>
                                                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg p-3">
                                                        {finding.stakeholder_impact}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Related Findings */}
                                            {finding.related_findings && finding.related_findings.length > 0 && (
                                                <div>
                                                    <h5 className="font-medium text-slate-900 mb-2">Related Findings</h5>
                                                    <div className="flex flex-wrap gap-2">
                                                        {finding.related_findings.map((relatedId, idx) => (
                                                            <Badge key={idx} variant="secondary" className="text-xs">
                                                                Finding #{relatedId}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        )
                    })
                )}
            </div>
        </div>
    )
}