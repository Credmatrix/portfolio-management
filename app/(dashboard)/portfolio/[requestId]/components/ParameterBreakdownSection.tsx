'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Target,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Info,
    Calculator,
    DollarSign,
    Building,
    Shield,
    CreditCard
} from 'lucide-react'

interface ParameterBreakdownSectionProps {
    company: PortfolioCompany
}

export function ParameterBreakdownSection({ company }: ParameterBreakdownSectionProps) {
    const riskAnalysis = company.risk_analysis

    if (!riskAnalysis) {
        return (
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Parameter Breakdown
                    </h2>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Parameter analysis data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getBenchmarkBadge = (benchmark: string) => {
        switch (benchmark?.toLowerCase()) {
            case 'excellent':
                return { variant: 'success' as const, icon: CheckCircle, color: 'text-green-600' }
            case 'good':
                return { variant: 'info' as const, icon: TrendingUp, color: 'text-blue-600' }
            case 'average':
                return { variant: 'warning' as const, icon: Target, color: 'text-yellow-600' }
            case 'poor':
                return { variant: 'error' as const, icon: TrendingDown, color: 'text-orange-600' }
            case 'critical risk':
                return { variant: 'error' as const, icon: XCircle, color: 'text-red-600' }
            default:
                return { variant: 'info' as const, icon: Info, color: 'text-gray-600' }
        }
    }

    const getScoreColor = (score: number, maxScore: number) => {
        const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0
        if (percentage >= 80) return 'text-green-600'
        if (percentage >= 60) return 'text-blue-600'
        if (percentage >= 40) return 'text-yellow-600'
        return 'text-red-600'
    }

    const categoryData = [
        {
            id: 'financial',
            name: 'Financial',
            icon: DollarSign,
            color: 'bg-blue-500',
            scores: riskAnalysis.financialScores || [],
            result: riskAnalysis.financialResult,
            description: 'Financial health, profitability, and stability metrics'
        },
        {
            id: 'business',
            name: 'Business',
            icon: Building,
            color: 'bg-green-500',
            scores: riskAnalysis.businessScores || [],
            result: riskAnalysis.businessResult,
            description: 'Business operations, market position, and growth metrics'
        },
        {
            id: 'hygiene',
            name: 'Hygiene',
            icon: Shield,
            color: 'bg-yellow-500',
            scores: riskAnalysis.hygieneScores || [],
            result: riskAnalysis.hygieneResult,
            description: 'Compliance, governance, and regulatory adherence'
        },
        {
            id: 'banking',
            name: 'Banking',
            icon: CreditCard,
            color: 'bg-purple-500',
            scores: riskAnalysis.bankingScores || [],
            result: riskAnalysis.bankingResult,
            description: 'Banking relationships, credit history, and payment behavior'
        }
    ]

    const renderParameterList = (parameters: any[]) => {
        if (!parameters.length) {
            return (
                <div className="text-center py-6 text-neutral-60">
                    <Info className="w-8 h-8 mx-auto mb-2 text-neutral-40" />
                    <p className="text-sm">No parameters available for this category</p>
                </div>
            )
        }

        return (
            <div className="space-y-3">
                {parameters.map((param, index) => {
                    const badge = getBenchmarkBadge(param.benchmark)
                    const BadgeIcon = badge.icon
                    const scorePercentage = param.maxScore > 0 ? (param.score / param.maxScore) * 100 : 0

                    return (
                        <div key={index} className="p-4 border border-neutral-20 rounded-lg hover:bg-neutral-5 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <div className="font-medium text-neutral-90 mb-1">
                                        {param.parameter}
                                    </div>
                                    <div className="text-sm text-neutral-60 mb-2">
                                        Value: <span className="font-mono text-neutral-90">{param.value}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <Badge variant={badge.variant} size="sm" className="flex items-center gap-1">
                                        <BadgeIcon className="w-3 h-3" />
                                        {param.benchmark}
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-neutral-60">Score</span>
                                    <span className={`font-semibold ${getScoreColor(param.score, param.maxScore)}`}>
                                        {param.score.toFixed(1)} / {param.maxScore} ({scorePercentage.toFixed(1)}%)
                                    </span>
                                </div>

                                <Progress value={scorePercentage} className="h-2" />

                                <div className="flex items-center justify-between text-xs text-neutral-50">
                                    <span>Weight: {parseFloat(param.weightage).toFixed(1)}%</span>
                                    <span className={param.available ? 'text-green-600' : 'text-red-600'}>
                                        {param.available ? 'Available' : 'Not Available'}
                                    </span>
                                </div>
                            </div>

                            {/* {param.details && typeof param.details === 'object' && (
                                <div className="mt-3 p-2 bg-neutral-5 rounded text-xs">
                                    <div className="text-neutral-60 mb-1">Details:</div>
                                    <pre className="text-neutral-90 whitespace-pre-wrap">
                                        {JSON.stringify(param.details, null, 2)}
                                    </pre>
                                </div>
                            )} */}
                        </div>
                    )
                })}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Parameter Breakdown
                    </h2>
                    <Badge variant="outline" className="text-sm">
                        {riskAnalysis.allScores?.length || 0} Total Parameters
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                {/* Category Overview */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                    {categoryData.map((category) => {
                        const CategoryIcon = category.icon
                        const result = category.result

                        if (!result) return null

                        return (
                            <div key={category.id} className="p-4 border border-neutral-20 rounded-lg text-center">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                    <div className={`w-3 h-3 rounded-full ${category.color}`} />
                                    <CategoryIcon className="w-4 h-4 text-neutral-60" />
                                </div>
                                <div className="text-lg font-semibold text-neutral-90 mb-1">
                                    {result.percentage.toFixed(1)}%
                                </div>
                                <div className="text-sm text-neutral-60 mb-2">{category.name}</div>
                                <div className="text-xs text-neutral-50">
                                    {result.availableCount}/{result.totalCount} params
                                </div>
                            </div>
                        )
                    })}
                </div>

                {/* Parameter Details by Category */}
                <Tabs defaultValue="financial" className="space-y-4">
                    <TabsList className="grid w-full grid-cols-4">
                        {categoryData.map((category) => (
                            <TabsTrigger key={category.id} value={category.id} className="flex items-center gap-2">
                                <category.icon className="w-4 h-4" />
                                {category.name}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    {categoryData.map((category) => (
                        <TabsContent key={category.id} value={category.id} className="space-y-4">
                            {/* Category Summary */}
                            {category.result && (
                                <div className="p-4 bg-gradient-to-r from-neutral-5 to-neutral-10 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${category.color.replace('bg-', 'bg-').replace('-500', '-100')}`}>
                                                <category.icon className={`w-5 h-5 ${category.color.replace('bg-', 'text-').replace('-500', '-600')}`} />
                                            </div>
                                            <div>
                                                <h3 className="font-semibold text-neutral-90">{category.name} Parameters</h3>
                                                <p className="text-sm text-neutral-60">{category.description}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-neutral-90">
                                                {category.result.percentage.toFixed(1)}%
                                            </div>
                                            <div className="text-sm text-neutral-60">Category Score</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                        <div>
                                            <div className="text-neutral-60">Score</div>
                                            <div className="font-semibold text-neutral-90">
                                                {category.result.score.toFixed(1)} / {category.result.maxScore}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-neutral-60">Weight</div>
                                            <div className="font-semibold text-neutral-90">
                                                {category.result.weightage.toFixed(1)}%
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-neutral-60">Available</div>
                                            <div className="font-semibold text-neutral-90">
                                                {category.result.availableCount}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-neutral-60">Total</div>
                                            <div className="font-semibold text-neutral-90">
                                                {category.result.totalCount}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Parameter List */}
                            {renderParameterList(category.scores)}
                        </TabsContent>
                    ))}
                </Tabs>

                {/* Overall Summary */}
                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                        <Calculator className="w-4 h-4 text-blue-600" />
                        <span className="font-medium text-blue-900">Parameter Analysis Summary</span>
                    </div>
                    <div className="text-sm text-blue-700 mb-3">
                        Comprehensive risk assessment based on {company.available_parameters} available parameters
                        out of {company.total_parameters} total parameters
                        ({((company.available_parameters || 0) / (company.total_parameters || 1) * 100).toFixed(1)}% coverage).
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                        <div>
                            <div className="text-blue-600">Overall Score</div>
                            <div className="font-medium text-blue-900">
                                {riskAnalysis.overallPercentage.toFixed(1)}%
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">Risk Grade</div>
                            <div className="font-medium text-blue-900">
                                {riskAnalysis.overallGrade.grade}
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">Model Type</div>
                            <div className="font-medium text-blue-900">
                                {riskAnalysis.modelType.replace('_', ' ').toUpperCase()}
                            </div>
                        </div>
                        <div>
                            <div className="text-blue-600">Industry Model</div>
                            <div className="font-medium text-blue-900">
                                {riskAnalysis.industryModel}
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}