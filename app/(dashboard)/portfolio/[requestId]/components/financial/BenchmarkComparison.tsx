'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    Target,
    TrendingUp,
    TrendingDown,
    BarChart3,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Award,
    Users
} from 'lucide-react'

interface BenchmarkComparisonProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

export function BenchmarkComparison({ company, industryBenchmarks }: BenchmarkComparisonProps) {
    const riskAnalysis = company.risk_analysis
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!riskAnalysis && !industryBenchmarks) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Benchmark Comparison
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Benchmark data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    // Get latest financial data
    const years = financialData?.years || []
    const latestYear = years[years.length - 1]

    const getLatestValue = (data: any) => {
        if (!data || !latestYear) return 0
        return data[latestYear] || 0
    }

    // Company metrics
    const companyMetrics = {
        riskScore: company.risk_score || 0,
        riskGrade: company.risk_grade || 'N/A',
        recommendedLimit: company.recommended_limit || 0,
        ebitdaMargin: financialData?.ratios?.profitability?.ebitda_margin ? getLatestValue(financialData.ratios.profitability.ebitda_margin) : 0,
        netMargin: financialData?.ratios?.profitability?.net_margin ? getLatestValue(financialData.ratios.profitability.net_margin) : 0,
        roe: financialData?.ratios?.profitability?.return_on_equity ? getLatestValue(financialData.ratios.profitability.return_on_equity) : 0,
        currentRatio: financialData?.ratios?.liquidity?.current_ratio ? getLatestValue(financialData.ratios.liquidity.current_ratio) : 0,
        debtEquity: financialData?.ratios?.leverage?.debt_equity ? getLatestValue(financialData.ratios.leverage.debt_equity) : 0,
        revenue: financialData?.profit_loss?.revenue ? getLatestValue(financialData.profit_loss.revenue) : 0
    }

    // Industry benchmarks (mock data if not provided)
    const benchmarks = industryBenchmarks || {
        median_risk_score: 65,
        median_revenue: 150,
        median_ebitda_margin: 12,
        median_net_margin: 8,
        median_roe: 15,
        median_current_ratio: 1.5,
        median_debt_equity: 0.8,
        peer_count: 25,
        industry: company.industry || 'General'
    }

    // Performance thresholds with specific values
    const thresholds = {
        excellent: { min: 90, color: 'text-green-600', bgColor: 'bg-green-50', icon: Award, description: 'Outstanding Performance' },
        good: { min: 70, color: 'text-blue-600', bgColor: 'bg-blue-50', icon: CheckCircle, description: 'Above Average Performance' },
        average: { min: 50, color: 'text-yellow-600', bgColor: 'bg-yellow-50', icon: Target, description: 'Average Performance' },
        poor: { min: 0, color: 'text-red-600', bgColor: 'bg-red-50', icon: XCircle, description: 'Below Average Performance' }
    }

    // Specific benchmark thresholds for different metrics
    const benchmarkThresholds = {
        ebitda_margin: { excellent: 20, good: 15, average: 10, poor: 5 },
        net_margin: { excellent: 15, good: 10, average: 5, poor: 2 },
        roe: { excellent: 20, good: 15, average: 10, poor: 5 },
        current_ratio: { excellent: 2.5, good: 2.0, average: 1.5, poor: 1.0 },
        debt_equity: { excellent: 0.3, good: 0.5, average: 0.8, poor: 1.2 }, // Lower is better
        risk_score: { excellent: 85, good: 70, average: 55, poor: 40 }
    }

    const getPerformanceLevel = (value: number, benchmark: number, higherIsBetter: boolean = true) => {
        let percentile: number

        if (higherIsBetter) {
            percentile = benchmark > 0 ? (value / benchmark) * 100 : 0
        } else {
            percentile = value > 0 ? (benchmark / value) * 100 : 0
        }

        if (percentile >= 110) return { level: 'excellent', percentile, ...thresholds.excellent }
        if (percentile >= 90) return { level: 'good', percentile, ...thresholds.good }
        if (percentile >= 70) return { level: 'average', percentile, ...thresholds.average }
        return { level: 'poor', percentile, ...thresholds.poor }
    }

    // Risk parameter benchmarks
    const riskParameterBenchmarks = [
        {
            category: 'Financial',
            companyScore: riskAnalysis?.financialResult?.percentage || 0,
            industryAverage: 65,
            excellent: 85,
            good: 75,
            average: 60,
            poor: 45
        },
        {
            category: 'Business',
            companyScore: riskAnalysis?.businessResult?.percentage || 0,
            industryAverage: 70,
            excellent: 90,
            good: 80,
            average: 65,
            poor: 50
        },
        {
            category: 'Hygiene',
            companyScore: riskAnalysis?.hygieneResult?.percentage || 0,
            industryAverage: 75,
            excellent: 95,
            good: 85,
            average: 70,
            poor: 55
        },
        {
            category: 'Banking',
            companyScore: riskAnalysis?.bankingResult?.percentage || 0,
            industryAverage: 60,
            excellent: 80,
            good: 70,
            average: 55,
            poor: 40
        }
    ]

    // Financial metrics comparison
    const financialComparisons = [
        {
            metric: 'EBITDA Margin',
            company: companyMetrics.ebitdaMargin,
            industry: benchmarks.median_ebitda_margin,
            unit: '%',
            higherIsBetter: true
        },
        {
            metric: 'Net Margin',
            company: companyMetrics.netMargin,
            industry: benchmarks.median_net_margin,
            unit: '%',
            higherIsBetter: true
        },
        {
            metric: 'Return on Equity',
            company: companyMetrics.roe,
            industry: benchmarks.median_roe,
            unit: '%',
            higherIsBetter: true
        },
        {
            metric: 'Current Ratio',
            company: companyMetrics.currentRatio,
            industry: benchmarks.median_current_ratio,
            unit: '',
            higherIsBetter: true
        },
        {
            metric: 'Debt/Equity',
            company: companyMetrics.debtEquity,
            industry: benchmarks.median_debt_equity,
            unit: '',
            higherIsBetter: false
        }
    ]

    const MetricComparison = ({
        metric,
        company,
        industry,
        unit,
        higherIsBetter
    }: {
        metric: string
        company: number
        industry: number
        unit: string
        higherIsBetter: boolean
    }) => {
        const performance = getPerformanceLevel(company, industry, higherIsBetter)
        const PerformanceIcon = performance.icon

        return (
            <div className={`p-4 rounded-lg border-l-4 ${performance.level === 'excellent' ? 'border-green-500 bg-green-50' :
                performance.level === 'good' ? 'border-blue-500 bg-blue-50' :
                    performance.level === 'average' ? 'border-yellow-500 bg-yellow-50' :
                        'border-red-500 bg-red-50'
                }`}>
                <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-neutral-90">{metric}</h5>
                    <div className="flex items-center gap-2">
                        <PerformanceIcon className={`w-4 h-4 ${performance.color}`} />
                        <Badge variant={
                            performance.level === 'excellent' ? 'success' :
                                performance.level === 'good' ? 'info' :
                                    performance.level === 'average' ? 'warning' : 'error'
                        } size="sm">
                            {performance.level}
                        </Badge>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                    <div>
                        <div className="text-xs text-neutral-60 mb-1">Company</div>
                        <div className="text-lg font-bold text-neutral-90">
                            {company.toFixed(1)}{unit}
                        </div>
                    </div>
                    <div>
                        <div className="text-xs text-neutral-60 mb-1">Industry Median</div>
                        <div className="text-lg font-bold text-neutral-70">
                            {industry.toFixed(1)}{unit}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-neutral-60">vs Industry</span>
                        <span className={performance.color}>
                            {performance.percentile.toFixed(0)}th percentile
                        </span>
                    </div>
                    <Progress
                        value={Math.min(performance.percentile, 100)}
                        className="h-2"
                    />
                </div>
            </div>
        )
    }

    const RiskParameterChart = ({
        category,
        companyScore,
        industryAverage,
        excellent,
        good,
        average,
        poor
    }: {
        category: string
        companyScore: number
        industryAverage: number
        excellent: number
        good: number
        average: number
        poor: number
    }) => {
        const getScoreLevel = (score: number) => {
            if (score >= excellent) return 'excellent'
            if (score >= good) return 'good'
            if (score >= average) return 'average'
            return 'poor'
        }

        const level = getScoreLevel(companyScore)

        return (
            <div className="p-4 bg-neutral-5 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-neutral-90">{category}</h5>
                    <div className="text-right">
                        <div className="text-lg font-bold text-neutral-90">{companyScore.toFixed(1)}%</div>
                        <div className="text-xs text-neutral-60">vs {industryAverage}% avg</div>
                    </div>
                </div>

                <div className="space-y-2 mb-3">
                    <Progress value={companyScore} className="h-3" />
                    <div className="flex justify-between text-xs text-neutral-50">
                        <span>0%</span>
                        <span>100%</span>
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-1 text-xs">
                    <div className={`text-center p-1 rounded ${companyScore >= excellent ? 'bg-green-100 text-green-700' : 'text-neutral-50'}`}>
                        Excellent<br />{excellent}%+
                    </div>
                    <div className={`text-center p-1 rounded ${companyScore >= good && companyScore < excellent ? 'bg-blue-100 text-blue-700' : 'text-neutral-50'}`}>
                        Good<br />{good}%+
                    </div>
                    <div className={`text-center p-1 rounded ${companyScore >= average && companyScore < good ? 'bg-yellow-100 text-yellow-700' : 'text-neutral-50'}`}>
                        Average<br />{average}%+
                    </div>
                    <div className={`text-center p-1 rounded ${companyScore < average ? 'bg-red-100 text-red-700' : 'text-neutral-50'}`}>
                        Poor<br />&lt;{average}%
                    </div>
                </div>
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Target className="w-5 h-5" />
                        Benchmark Comparison
                    </h3>
                    <Badge variant="outline" className="text-sm flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {benchmarks.peer_count} Peers
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="risk-parameters" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="risk-parameters">Risk Parameters</TabsTrigger>
                        <TabsTrigger value="financial-metrics">Financial Metrics</TabsTrigger>
                        <TabsTrigger value="threshold-analysis">Threshold Analysis</TabsTrigger>
                        <TabsTrigger value="overall-ranking">Overall Ranking</TabsTrigger>
                    </TabsList>

                    {/* Risk Parameters Tab */}
                    <TabsContent value="risk-parameters" className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium text-neutral-90">Risk Parameter Performance</h4>
                                <div className="text-sm text-neutral-60">
                                    Industry: {benchmarks.industry}
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {riskParameterBenchmarks.map((param, index) => (
                                    <RiskParameterChart key={index} {...param} />
                                ))}
                            </div>
                        </div>

                        {/* Overall Risk Assessment */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Overall Risk Assessment
                            </h5>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-blue-600 mb-1">Company Risk Score</div>
                                    <div className="font-bold text-blue-900 text-lg">
                                        {companyMetrics.riskScore.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-blue-600">Grade: {companyMetrics.riskGrade}</div>
                                </div>
                                <div>
                                    <div className="text-blue-600 mb-1">Industry Average</div>
                                    <div className="font-bold text-blue-900 text-lg">
                                        {benchmarks.median_risk_score.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-blue-600">Median score</div>
                                </div>
                                <div>
                                    <div className="text-blue-600 mb-1">Performance vs Peers</div>
                                    <div className={`font-bold text-lg ${companyMetrics.riskScore > benchmarks.median_risk_score ? 'text-green-700' : 'text-red-700'
                                        }`}>
                                        {companyMetrics.riskScore > benchmarks.median_risk_score ? 'Above Average' : 'Below Average'}
                                    </div>
                                    <div className="text-xs text-blue-600">
                                        {((companyMetrics.riskScore / benchmarks.median_risk_score - 1) * 100).toFixed(1)}% difference
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Financial Metrics Tab */}
                    <TabsContent value="financial-metrics" className="space-y-6">
                        <div className="space-y-4">
                            <h4 className="font-medium text-neutral-90">Financial Performance vs Industry</h4>

                            <div className="grid grid-cols-1 gap-4">
                                {financialComparisons.map((comparison, index) => (
                                    <MetricComparison key={index} {...comparison} />
                                ))}
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h5 className="font-medium text-green-900 mb-3">Financial Performance Summary</h5>
                            <div className="text-sm text-green-700">
                                {financialComparisons.filter(c => {
                                    const perf = getPerformanceLevel(c.company, c.industry, c.higherIsBetter)
                                    return perf.level === 'excellent' || perf.level === 'good'
                                }).length >= 3
                                    ? "Strong financial performance across most metrics compared to industry peers."
                                    : financialComparisons.filter(c => {
                                        const perf = getPerformanceLevel(c.company, c.industry, c.higherIsBetter)
                                        return perf.level === 'excellent' || perf.level === 'good'
                                    }).length >= 2
                                        ? "Mixed financial performance with some metrics above industry average."
                                        : "Financial performance generally below industry benchmarks requiring improvement."
                                }
                            </div>
                        </div>
                    </TabsContent>

                    {/* Threshold Analysis Tab */}
                    <TabsContent value="threshold-analysis" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-neutral-90">Performance vs Benchmark Thresholds</h4>

                            {/* Threshold Performance Grid */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Financial Metrics Thresholds */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-neutral-70">Financial Metrics vs Thresholds</h5>

                                    {/* EBITDA Margin Threshold */}
                                    <div className="p-4 border border-neutral-20 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-neutral-90">EBITDA Margin</span>
                                            <span className="text-lg font-bold text-neutral-90">{companyMetrics.ebitdaMargin.toFixed(1)}%</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span>Poor (&lt;{benchmarkThresholds.ebitda_margin.poor}%)</span>
                                                <span>Excellent (&gt;{benchmarkThresholds.ebitda_margin.excellent}%)</span>
                                            </div>
                                            <div className="relative h-2 bg-gray-200 rounded-full">
                                                <div className="absolute inset-0 flex">
                                                    <div className="bg-red-400 h-full" style={{ width: '20%' }}></div>
                                                    <div className="bg-orange-400 h-full" style={{ width: '20%' }}></div>
                                                    <div className="bg-yellow-400 h-full" style={{ width: '30%' }}></div>
                                                    <div className="bg-green-400 h-full" style={{ width: '30%' }}></div>
                                                </div>
                                                <div
                                                    className="absolute top-0 w-1 h-full bg-blue-800 rounded-full"
                                                    style={{
                                                        left: `${Math.min(95, Math.max(2, (companyMetrics.ebitdaMargin / benchmarkThresholds.ebitda_margin.excellent) * 70 + 2))}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-center text-neutral-60">
                                                {companyMetrics.ebitdaMargin >= benchmarkThresholds.ebitda_margin.excellent ? 'Excellent' :
                                                    companyMetrics.ebitdaMargin >= benchmarkThresholds.ebitda_margin.good ? 'Good' :
                                                        companyMetrics.ebitdaMargin >= benchmarkThresholds.ebitda_margin.average ? 'Average' : 'Poor'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Ratio Threshold */}
                                    <div className="p-4 border border-neutral-20 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-neutral-90">Current Ratio</span>
                                            <span className="text-lg font-bold text-neutral-90">{companyMetrics.currentRatio.toFixed(2)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span>Poor (&lt;{benchmarkThresholds.current_ratio.poor})</span>
                                                <span>Excellent (&gt;{benchmarkThresholds.current_ratio.excellent})</span>
                                            </div>
                                            <div className="relative h-2 bg-gray-200 rounded-full">
                                                <div className="absolute inset-0 flex">
                                                    <div className="bg-red-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-orange-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-yellow-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-green-400 h-full" style={{ width: '25%' }}></div>
                                                </div>
                                                <div
                                                    className="absolute top-0 w-1 h-full bg-blue-800 rounded-full"
                                                    style={{
                                                        left: `${Math.min(95, Math.max(2, (companyMetrics.currentRatio / benchmarkThresholds.current_ratio.excellent) * 75 + 2))}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-center text-neutral-60">
                                                {companyMetrics.currentRatio >= benchmarkThresholds.current_ratio.excellent ? 'Excellent' :
                                                    companyMetrics.currentRatio >= benchmarkThresholds.current_ratio.good ? 'Good' :
                                                        companyMetrics.currentRatio >= benchmarkThresholds.current_ratio.average ? 'Average' : 'Poor'}
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Risk Metrics Thresholds */}
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-neutral-70">Risk Metrics vs Thresholds</h5>

                                    {/* Risk Score Threshold */}
                                    <div className="p-4 border border-neutral-20 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-neutral-90">Risk Score</span>
                                            <span className="text-lg font-bold text-neutral-90">{companyMetrics.riskScore.toFixed(1)}%</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span>Poor (&lt;{benchmarkThresholds.risk_score.poor}%)</span>
                                                <span>Excellent (&gt;{benchmarkThresholds.risk_score.excellent}%)</span>
                                            </div>
                                            <div className="relative h-2 bg-gray-200 rounded-full">
                                                <div className="absolute inset-0 flex">
                                                    <div className="bg-red-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-orange-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-yellow-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-green-400 h-full" style={{ width: '25%' }}></div>
                                                </div>
                                                <div
                                                    className="absolute top-0 w-1 h-full bg-blue-800 rounded-full"
                                                    style={{
                                                        left: `${Math.min(95, Math.max(2, (companyMetrics.riskScore / 100) * 95 + 2))}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-center text-neutral-60">
                                                {companyMetrics.riskScore >= benchmarkThresholds.risk_score.excellent ? 'Excellent' :
                                                    companyMetrics.riskScore >= benchmarkThresholds.risk_score.good ? 'Good' :
                                                        companyMetrics.riskScore >= benchmarkThresholds.risk_score.average ? 'Average' : 'Poor'}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Debt-to-Equity Threshold (Lower is better) */}
                                    <div className="p-4 border border-neutral-20 rounded-lg">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="font-medium text-neutral-90">Debt-to-Equity</span>
                                            <span className="text-lg font-bold text-neutral-90">{companyMetrics.debtEquity.toFixed(2)}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex justify-between text-xs">
                                                <span>Excellent (&lt;{benchmarkThresholds.debt_equity.excellent})</span>
                                                <span>Poor (&gt;{benchmarkThresholds.debt_equity.poor})</span>
                                            </div>
                                            <div className="relative h-2 bg-gray-200 rounded-full">
                                                <div className="absolute inset-0 flex">
                                                    <div className="bg-green-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-yellow-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-orange-400 h-full" style={{ width: '25%' }}></div>
                                                    <div className="bg-red-400 h-full" style={{ width: '25%' }}></div>
                                                </div>
                                                <div
                                                    className="absolute top-0 w-1 h-full bg-blue-800 rounded-full"
                                                    style={{
                                                        left: `${Math.min(95, Math.max(2, (companyMetrics.debtEquity / (benchmarkThresholds.debt_equity.poor * 1.5)) * 95 + 2))}%`
                                                    }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-center text-neutral-60">
                                                {companyMetrics.debtEquity <= benchmarkThresholds.debt_equity.excellent ? 'Excellent' :
                                                    companyMetrics.debtEquity <= benchmarkThresholds.debt_equity.good ? 'Good' :
                                                        companyMetrics.debtEquity <= benchmarkThresholds.debt_equity.average ? 'Average' : 'Poor'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Threshold Summary */}
                            <div className="p-4 bg-indigo-50 rounded-lg">
                                <h5 className="font-medium text-indigo-900 mb-3">Threshold Performance Summary</h5>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-green-600 mb-1">
                                            {[
                                                companyMetrics.ebitdaMargin >= benchmarkThresholds.ebitda_margin.excellent,
                                                companyMetrics.netMargin >= benchmarkThresholds.net_margin.excellent,
                                                companyMetrics.roe >= benchmarkThresholds.roe.excellent,
                                                companyMetrics.currentRatio >= benchmarkThresholds.current_ratio.excellent,
                                                companyMetrics.debtEquity <= benchmarkThresholds.debt_equity.excellent,
                                                companyMetrics.riskScore >= benchmarkThresholds.risk_score.excellent
                                            ].filter(Boolean).length}
                                        </div>
                                        <div className="text-indigo-600">Excellent</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-blue-600 mb-1">
                                            {[
                                                companyMetrics.ebitdaMargin >= benchmarkThresholds.ebitda_margin.good && companyMetrics.ebitdaMargin < benchmarkThresholds.ebitda_margin.excellent,
                                                companyMetrics.netMargin >= benchmarkThresholds.net_margin.good && companyMetrics.netMargin < benchmarkThresholds.net_margin.excellent,
                                                companyMetrics.roe >= benchmarkThresholds.roe.good && companyMetrics.roe < benchmarkThresholds.roe.excellent,
                                                companyMetrics.currentRatio >= benchmarkThresholds.current_ratio.good && companyMetrics.currentRatio < benchmarkThresholds.current_ratio.excellent,
                                                companyMetrics.debtEquity <= benchmarkThresholds.debt_equity.good && companyMetrics.debtEquity > benchmarkThresholds.debt_equity.excellent,
                                                companyMetrics.riskScore >= benchmarkThresholds.risk_score.good && companyMetrics.riskScore < benchmarkThresholds.risk_score.excellent
                                            ].filter(Boolean).length}
                                        </div>
                                        <div className="text-indigo-600">Good</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-yellow-600 mb-1">
                                            {[
                                                companyMetrics.ebitdaMargin >= benchmarkThresholds.ebitda_margin.average && companyMetrics.ebitdaMargin < benchmarkThresholds.ebitda_margin.good,
                                                companyMetrics.netMargin >= benchmarkThresholds.net_margin.average && companyMetrics.netMargin < benchmarkThresholds.net_margin.good,
                                                companyMetrics.roe >= benchmarkThresholds.roe.average && companyMetrics.roe < benchmarkThresholds.roe.good,
                                                companyMetrics.currentRatio >= benchmarkThresholds.current_ratio.average && companyMetrics.currentRatio < benchmarkThresholds.current_ratio.good,
                                                companyMetrics.debtEquity <= benchmarkThresholds.debt_equity.average && companyMetrics.debtEquity > benchmarkThresholds.debt_equity.good,
                                                companyMetrics.riskScore >= benchmarkThresholds.risk_score.average && companyMetrics.riskScore < benchmarkThresholds.risk_score.good
                                            ].filter(Boolean).length}
                                        </div>
                                        <div className="text-indigo-600">Average</div>
                                    </div>
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-red-600 mb-1">
                                            {[
                                                companyMetrics.ebitdaMargin < benchmarkThresholds.ebitda_margin.average,
                                                companyMetrics.netMargin < benchmarkThresholds.net_margin.average,
                                                companyMetrics.roe < benchmarkThresholds.roe.average,
                                                companyMetrics.currentRatio < benchmarkThresholds.current_ratio.average,
                                                companyMetrics.debtEquity > benchmarkThresholds.debt_equity.average,
                                                companyMetrics.riskScore < benchmarkThresholds.risk_score.average
                                            ].filter(Boolean).length}
                                        </div>
                                        <div className="text-indigo-600">Poor</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Overall Ranking Tab */}
                    <TabsContent value="overall-ranking" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-neutral-90">Peer Ranking Analysis</h4>

                            {/* Overall Score Card */}
                            <div className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg">
                                <div className="text-center">
                                    <div className="text-3xl font-bold text-blue-900 mb-2">
                                        {riskAnalysis?.overallPercentage?.toFixed(1) || 0}%
                                    </div>
                                    <div className="text-lg font-medium text-blue-700 mb-1">Overall Score</div>
                                    <div className="text-sm text-blue-600">
                                        Rank: Top {Math.round((1 - (companyMetrics.riskScore / 100)) * 100)}% in {benchmarks.industry}
                                    </div>
                                </div>
                            </div>

                            {/* Ranking Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="font-medium text-neutral-90">Strengths</h5>
                                    <div className="space-y-2">
                                        {[
                                            ...riskParameterBenchmarks.filter(p => p.companyScore >= p.good),
                                            ...financialComparisons.filter(c => {
                                                const perf = getPerformanceLevel(c.company, c.industry, c.higherIsBetter)
                                                return perf.level === 'excellent' || perf.level === 'good'
                                            })
                                        ].slice(0, 3).map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-green-50 rounded">
                                                <CheckCircle className="w-4 h-4 text-green-600" />
                                                <span className="text-sm text-green-700">
                                                    {'category' in item ? `${item.category} Parameters` : item.metric}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="font-medium text-neutral-90">Areas for Improvement</h5>
                                    <div className="space-y-2">
                                        {[
                                            ...riskParameterBenchmarks.filter(p => p.companyScore < p.average),
                                            ...financialComparisons.filter(c => {
                                                const perf = getPerformanceLevel(c.company, c.industry, c.higherIsBetter)
                                                return perf.level === 'poor' || perf.level === 'average'
                                            })
                                        ].slice(0, 3).map((item, index) => (
                                            <div key={index} className="flex items-center gap-2 p-2 bg-red-50 rounded">
                                                <AlertTriangle className="w-4 h-4 text-red-600" />
                                                <span className="text-sm text-red-700">
                                                    {'category' in item ? `${item.category} Parameters` : item.metric}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            {/* Competitive Position */}
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h5 className="font-medium text-purple-900 mb-3">Competitive Position</h5>
                                <div className="text-sm text-purple-700">
                                    Based on comprehensive analysis across {riskParameterBenchmarks.length} risk parameters and {financialComparisons.length} financial metrics,
                                    this company {companyMetrics.riskScore > benchmarks.median_risk_score ? 'outperforms' : 'underperforms'} the industry median.
                                    {companyMetrics.riskScore > benchmarks.median_risk_score
                                        ? " The strong performance indicates lower credit risk and better operational efficiency."
                                        : " Focus on improving underperforming areas could significantly enhance the overall risk profile."
                                    }
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}