'use client'

import { PortfolioCompany, ParameterScore } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
    Calculator,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Info,
    Target,
    TrendingUp,
    TrendingDown
} from 'lucide-react'

interface ParameterDetailViewProps {
    company: PortfolioCompany
    parameter: ParameterScore
    categoryName: string
}

export function ParameterDetailView({ company, parameter, categoryName }: ParameterDetailViewProps) {
    const getBenchmarkBadge = (benchmark: string) => {
        switch (benchmark?.toLowerCase()) {
            case 'excellent':
                return { variant: 'success' as const, icon: CheckCircle, color: 'text-green-600', bgColor: 'bg-green-50' }
            case 'good':
                return { variant: 'info' as const, icon: TrendingUp, color: 'text-blue-600', bgColor: 'bg-blue-50' }
            case 'average':
                return { variant: 'warning' as const, icon: Target, color: 'text-yellow-600', bgColor: 'bg-yellow-50' }
            case 'poor':
                return { variant: 'error' as const, icon: TrendingDown, color: 'text-orange-600', bgColor: 'bg-orange-50' }
            case 'critical risk':
                return { variant: 'error' as const, icon: XCircle, color: 'text-red-600', bgColor: 'bg-red-50' }
            default:
                return { variant: 'default' as const, icon: Info, color: 'text-gray-600', bgColor: 'bg-gray-50' }
        }
    }

    const getScoreColor = (score: number, maxScore: number) => {
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
        if (percentage >= 80) return 'text-green-600'
        if (percentage >= 60) return 'text-blue-600'
        if (percentage >= 40) return 'text-yellow-600'
        return 'text-red-600'
    }

    const badge = getBenchmarkBadge(parameter.benchmark)
    const BadgeIcon = badge.icon
    const scorePercentage = parameter.maxScore > 0 ? (parameter.score / parameter.maxScore) * 100 : 0

    // Parse details if it's a JSON object
    const parseDetails = (details: any) => {
        if (!details) return null

        if (typeof details === 'string') {
            try {
                return JSON.parse(details)
            } catch {
                return details
            }
        }

        return details
    }

    const parsedDetails = parseDetails(parameter.details)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                            {parameter.parameter}
                        </h3>
                        <div className="flex items-center gap-2 text-sm text-neutral-60">
                            <span>Category: {categoryName}</span>
                            <span>•</span>
                            <span className={parameter.available ? 'text-green-600' : 'text-red-600'}>
                                {parameter.available ? 'Available' : 'Not Available'}
                            </span>
                        </div>
                    </div>

                    <Badge variant={badge.variant} className="flex items-center gap-1">
                        <BadgeIcon className="w-3 h-3" />
                        {parameter.benchmark}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Parameter Value */}
                <div className={`p-4 rounded-lg ${badge.bgColor}`}>
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-neutral-70">Parameter Value</span>
                        <Calculator className={`w-4 h-4 ${badge.color}`} />
                    </div>
                    <div className="text-2xl font-bold text-neutral-90 mb-1">
                        {parameter.value}
                    </div>
                    <div className="text-sm text-neutral-60">
                        Current assessed value for this parameter
                    </div>
                </div>

                {/* Scoring Details */}
                <div className="space-y-4">
                    <h4 className="font-medium text-neutral-90">Scoring Analysis</h4>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-3 bg-neutral-5 rounded-lg">
                            <div className="text-sm text-neutral-60 mb-1">Score Achieved</div>
                            <div className={`text-xl font-bold ${getScoreColor(parameter.score, parameter.maxScore)}`}>
                                {parameter.score.toFixed(1)} / {parameter.maxScore}
                            </div>
                            <div className="text-xs text-neutral-50 mt-1">
                                {scorePercentage.toFixed(1)}% of maximum possible
                            </div>
                        </div>

                        <div className="p-3 bg-neutral-5 rounded-lg">
                            <div className="text-sm text-neutral-60 mb-1">Parameter Weight</div>
                            <div className="text-xl font-bold text-neutral-90">
                                {(parameter.weightage * 100).toFixed(1)}%
                            </div>
                            <div className="text-xs text-neutral-50 mt-1">
                                Contribution to category score
                            </div>
                        </div>
                    </div>

                    {/* Score Progress Bar */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-neutral-60">Score Progress</span>
                            <span className={`font-medium ${getScoreColor(parameter.score, parameter.maxScore)}`}>
                                {scorePercentage.toFixed(1)}%
                            </span>
                        </div>
                        <Progress value={scorePercentage} className="h-3" />
                        <div className="flex justify-between text-xs text-neutral-50">
                            <span>0</span>
                            <span>Maximum: {parameter.maxScore}</span>
                        </div>
                    </div>
                </div>

                {/* Benchmark Analysis */}
                <div className="space-y-4">
                    <h4 className="font-medium text-neutral-90">Benchmark Analysis</h4>

                    <div className={`p-4 rounded-lg border-l-4 ${parameter.benchmark === 'Excellent' ? 'border-green-500 bg-green-50' :
                            parameter.benchmark === 'Good' ? 'border-blue-500 bg-blue-50' :
                                parameter.benchmark === 'Average' ? 'border-yellow-500 bg-yellow-50' :
                                    parameter.benchmark === 'Poor' ? 'border-orange-500 bg-orange-50' :
                                        parameter.benchmark === 'Critical Risk' ? 'border-red-500 bg-red-50' :
                                            'border-gray-500 bg-gray-50'
                        }`}>
                        <div className="flex items-center gap-2 mb-2">
                            <BadgeIcon className={`w-5 h-5 ${badge.color}`} />
                            <span className={`font-medium ${badge.color}`}>
                                {parameter.benchmark} Performance
                            </span>
                        </div>
                        <div className={`text-sm ${badge.color}`}>
                            {parameter.benchmark === 'Excellent' && "Outstanding performance significantly above industry standards."}
                            {parameter.benchmark === 'Good' && "Above-average performance meeting or exceeding industry benchmarks."}
                            {parameter.benchmark === 'Average' && "Performance in line with industry averages and acceptable standards."}
                            {parameter.benchmark === 'Poor' && "Below-average performance requiring attention and improvement."}
                            {parameter.benchmark === 'Critical Risk' && "Significantly poor performance posing substantial risk concerns."}
                            {!['Excellent', 'Good', 'Average', 'Poor', 'Critical Risk'].includes(parameter.benchmark) &&
                                "Performance assessment based on available data and industry standards."}
                        </div>
                    </div>
                </div>

                {/* Parameter Details */}
                {parsedDetails && (
                    <div className="space-y-4">
                        <h4 className="font-medium text-neutral-90">Parameter Details</h4>

                        <div className="p-4 bg-neutral-5 rounded-lg">
                            {typeof parsedDetails === 'object' && parsedDetails !== null ? (
                                <div className="space-y-3">
                                    {Object.entries(parsedDetails).map(([key, value], index) => (
                                        <div key={index} className="flex items-start justify-between">
                                            <span className="text-sm text-neutral-60 capitalize">
                                                {key.replace(/_/g, ' ')}:
                                            </span>
                                            <span className="text-sm text-neutral-90 font-medium ml-4 text-right">
                                                {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-sm text-neutral-90">
                                    {String(parsedDetails)}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Calculation Logic */}
                <div className="space-y-4">
                    <h4 className="font-medium text-neutral-90">Calculation Logic</h4>

                    <div className="p-4 bg-blue-50 rounded-lg">
                        <div className="space-y-3 text-sm">
                            <div className="flex items-center justify-between">
                                <span className="text-blue-600">Raw Score:</span>
                                <span className="font-medium text-blue-900">{parameter.score.toFixed(2)}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-blue-600">Maximum Possible:</span>
                                <span className="font-medium text-blue-900">{parameter.maxScore}</span>
                            </div>

                            <div className="flex items-center justify-between">
                                <span className="text-blue-600">Weight in Category:</span>
                                <span className="font-medium text-blue-900">{(parameter.weightage * 100).toFixed(1)}%</span>
                            </div>

                            <div className="border-t border-blue-200 pt-2 flex items-center justify-between">
                                <span className="text-blue-600 font-medium">Weighted Contribution:</span>
                                <span className="font-bold text-blue-900">
                                    {(parameter.score * parameter.weightage).toFixed(2)}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Risk Assessment */}
                <div className="space-y-4">
                    <h4 className="font-medium text-neutral-90">Risk Assessment</h4>

                    <div className="p-4 bg-gray-50 rounded-lg">
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${scorePercentage >= 80 ? 'bg-green-100' :
                                    scorePercentage >= 60 ? 'bg-blue-100' :
                                        scorePercentage >= 40 ? 'bg-yellow-100' : 'bg-red-100'
                                }`}>
                                {scorePercentage >= 80 ? (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                ) : scorePercentage >= 60 ? (
                                    <TrendingUp className="w-4 h-4 text-blue-600" />
                                ) : scorePercentage >= 40 ? (
                                    <AlertTriangle className="w-4 h-4 text-yellow-600" />
                                ) : (
                                    <XCircle className="w-4 h-4 text-red-600" />
                                )}
                            </div>

                            <div className="flex-1">
                                <div className="font-medium text-neutral-90 mb-1">
                                    {scorePercentage >= 80 ? 'Low Risk' :
                                        scorePercentage >= 60 ? 'Moderate Risk' :
                                            scorePercentage >= 40 ? 'Elevated Risk' : 'High Risk'}
                                </div>
                                <div className="text-sm text-neutral-60">
                                    {scorePercentage >= 80 && "This parameter shows strong performance with minimal risk contribution."}
                                    {scorePercentage >= 60 && scorePercentage < 80 && "Acceptable performance with moderate risk implications."}
                                    {scorePercentage >= 40 && scorePercentage < 60 && "Below-average performance contributing to elevated risk profile."}
                                    {scorePercentage < 40 && "Poor performance significantly impacting overall risk assessment."}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Improvement Recommendations */}
                {scorePercentage < 80 && (
                    <div className="space-y-4">
                        <h4 className="font-medium text-neutral-90">Improvement Opportunities</h4>

                        <div className="p-4 bg-yellow-50 rounded-lg border-l-4 border-yellow-500">
                            <div className="flex items-start gap-2">
                                <Target className="w-4 h-4 text-yellow-600 mt-0.5" />
                                <div className="text-sm text-yellow-700">
                                    {scorePercentage >= 60 && "Focus on incremental improvements to achieve excellent performance levels."}
                                    {scorePercentage >= 40 && scorePercentage < 60 && "Significant improvement needed to meet industry standards and reduce risk."}
                                    {scorePercentage < 40 && "Immediate attention required - this parameter poses substantial risk to overall assessment."}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}