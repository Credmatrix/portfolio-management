'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import {
    Shield,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Target,
    BarChart3
} from 'lucide-react'
import { cn } from "@/lib/utils";

interface RiskAssessmentSectionProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

export function RiskAssessmentSection({ company, industryBenchmarks }: RiskAssessmentSectionProps) {
    const riskAnalysis = company.risk_analysis

    if (!riskAnalysis) {
        return (
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Risk Assessment
                    </h2>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Risk analysis data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const getBenchmarkStatus = (score: number, benchmark?: any) => {
        if (!benchmark) return { status: 'unknown', color: 'text-gray-500', icon: AlertTriangle }

        if (score >= 80) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle }
        if (score >= 60) return { status: 'good', color: 'text-blue-600', icon: TrendingUp }
        if (score >= 40) return { status: 'average', color: 'text-yellow-600', icon: Target }
        return { status: 'poor', color: 'text-red-600', icon: TrendingDown }
    }

    const categoryResults = [
        {
            name: 'Financial',
            result: riskAnalysis.financialResult,
            color: 'bg-blue-500',
            description: 'Financial health and performance metrics'
        },
        {
            name: 'Business',
            result: riskAnalysis.businessResult,
            color: 'bg-green-500',
            description: 'Business operations and market position'
        },
        {
            name: 'Hygiene',
            result: riskAnalysis.hygieneResult,
            color: 'bg-yellow-500',
            description: 'Compliance and governance factors'
        },
        {
            name: 'Banking',
            result: riskAnalysis.bankingResult,
            color: 'bg-purple-500',
            description: 'Banking relationships and credit history'
        }
    ]

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <Shield className="w-5 h-5" />
                        Risk Assessment
                    </h2>
                    <Badge variant="outline" className="text-sm">
                        Model: {riskAnalysis.industryModel} v{riskAnalysis.modelVersion}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent className="space-y-6">
                {/* Overall Risk Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                    <div className="text-center">
                        <div className="text-3xl font-bold text-neutral-90 mb-2">
                            {riskAnalysis.overallPercentage.toFixed(1)}%
                        </div>
                        <div className="text-sm text-neutral-60 mb-1">Overall Score</div>
                        <div className="text-xs text-neutral-50">
                            {riskAnalysis.totalWeightedScore.toFixed(0)} / {riskAnalysis.totalMaxScore}
                        </div>
                    </div>

                    <div className="text-center">
                        <div className="text-3xl font-bold mb-2" style={{ color: riskAnalysis.overallGrade.color }}>
                            {riskAnalysis.overallGrade.grade}
                        </div>
                        <div className="text-sm text-neutral-60 mb-1">Risk Grade</div>
                        <div className="text-xs text-neutral-50">
                            Category {riskAnalysis.overallGrade.category}
                        </div>
                    </div>

                    {/* <div className="text-center">
                        <div className={cn("text-3xl font-bold text-neutral-90 mb-2", riskAnalysis.overallGrade.multiplier === "Reject" ? "text-red-90" : "text-neutral-90" )}>
                            {riskAnalysis.overallGrade.multiplier === "Reject" ? riskAnalysis.overallGrade.multiplier : parseFloat(riskAnalysis.overallGrade.multiplier).toFixed(2)}
                        </div>
                        <div className="text-sm text-neutral-60 mb-1">Risk Multiplier</div>
                        <div className="text-xs text-neutral-50">
                            {riskAnalysis.overallGrade.description}
                        </div>
                    </div> */}
                </div>

                {/* Category Breakdown */}
                {/* <div>
                    <h3 className="text-lg font-semibold text-neutral-90 mb-4 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Category Performance
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {categoryResults.map((category) => {
                            if (!category.result) return null

                            const benchmarkStatus = getBenchmarkStatus(category.result.percentage)
                            const StatusIcon = benchmarkStatus.icon

                            return (
                                <div key={category.name} className="p-4 border border-neutral-20 rounded-lg">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`w-3 h-3 rounded-full ${category.color}`} />
                                            <span className="font-medium text-neutral-90">{category.name}</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <StatusIcon className={`w-4 h-4 ${benchmarkStatus.color}`} />
                                            <span className="text-sm font-semibold text-neutral-90">
                                                {category.result.percentage.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>

                                    <Progress
                                        value={category.result.percentage}
                                        className="mb-2"
                                    />

                                    <div className="flex items-center justify-between text-xs text-neutral-60">
                                        <span>{category.description}</span>
                                        <span>
                                            {category.result.availableCount}/{category.result.totalCount} parameters
                                        </span>
                                    </div>

                                    <div className="mt-2 text-xs text-neutral-50">
                                        Score: {category.result.score.toFixed(1)} / {category.result.maxScore}
                                        (Weight: {(category.result.weightage * 100).toFixed(0)}%)
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div className="p-4 bg-neutral-5 rounded-lg">
                    <h4 className="font-medium text-neutral-90 mb-3">Parameter Coverage</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center">
                            <div className="text-lg font-semibold text-blue-700">
                                {riskAnalysis.financialResult?.availableCount || 0}
                            </div>
                            <div className="text-neutral-60">Financial</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-green-700">
                                {riskAnalysis.businessResult?.availableCount || 0}
                            </div>
                            <div className="text-neutral-60">Business</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-yellow-700">
                                {riskAnalysis.hygieneResult?.availableCount || 0}
                            </div>
                            <div className="text-neutral-60">Hygiene</div>
                        </div>
                        <div className="text-center">
                            <div className="text-lg font-semibold text-purple-700">
                                {riskAnalysis.bankingResult?.availableCount || 0}
                            </div>
                            <div className="text-neutral-60">Banking</div>
                        </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-neutral-20 text-center">
                        <span className="text-sm text-neutral-60">
                            Total Coverage: {company.available_parameters}/{company.total_parameters} parameters
                            ({((company.available_parameters || 0) / (company.total_parameters || 1) * 100).toFixed(1)}%)
                        </span>
                    </div>
                </div> */}

                {/* Industry Benchmarks */}
                {industryBenchmarks && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-neutral-90 mb-3 flex items-center gap-2">
                            <Target className="w-4 h-4" />
                            Industry Benchmarks
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                            <div>
                                <div className="text-neutral-60">Industry Median</div>
                                <div className="font-semibold text-neutral-90">
                                    {industryBenchmarks.median_risk_score?.toFixed(1) || 'N/A'}%
                                </div>
                            </div>
                            <div>
                                <div className="text-neutral-60">Peer Companies</div>
                                <div className="font-semibold text-neutral-90">
                                    {industryBenchmarks.peer_count || 0}
                                </div>
                            </div>
                            <div>
                                <div className="text-neutral-60">Performance vs Peers</div>
                                <div className={`font-semibold ${(company.risk_score || 0) > (industryBenchmarks.median_risk_score || 0)
                                    ? 'text-green-700' : 'text-red-700'
                                    }`}>
                                    {(company.risk_score || 0) > (industryBenchmarks.median_risk_score || 0)
                                        ? 'Above Average' : 'Below Average'}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
