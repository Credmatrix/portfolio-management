'use client'

import React from 'react'
import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge, BadgeVariant } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    AlertTriangle,
    Target,
    Activity,
    LineChart,
    Minus,
    CheckCircle2,
    AlertCircle,
    Info,
    ArrowUpRight,
    ArrowDownRight,
    IndianRupee,
    Calendar,
    Shield,
    Zap,
    TrendingUpDownIcon
} from 'lucide-react'
import { calculateGrowthRate, calculateCAGR } from '@/lib/utils'

interface RiskTrendAnalysisProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

export function RiskTrendAnalysis({ company, industryBenchmarks }: RiskTrendAnalysisProps) {
    const financialData = company.extracted_data?.["Standalone Financial Data"]
    const riskAnalysis = company.risk_analysis

    if (!financialData || !riskAnalysis) {
        return (
            <Card className="border-0 shadow-md bg-gradient-to-br from-slate-50 to-gray-100">
                <CardHeader className="pb-4">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-100">
                            <Activity className="w-5 h-5 text-blue-600" />
                        </div>
                        Risk Trend Analysis
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-12 text-gray-500">
                        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-gray-100 flex items-center justify-center">
                            <AlertTriangle className="w-8 h-8 text-gray-400" />
                        </div>
                        <h4 className="text-lg font-medium text-gray-700 mb-2">Insufficient Data</h4>
                        <p className="text-sm text-gray-500">Financial and risk data required for trend analysis</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = riskAnalysis.years || financialData.years || []
    const latestYear = years[years.length - 1]
    const ratios = financialData.ratios

    // Helper function to get value for a specific year from financial data
    const getYearValue = (data: any, year: string) => {
        if (!data || !year) return 0
        return data[year] || 0
    }

    // Calculate overall risk score from allScores
    const calculateOverallRiskScore = () => {
        if (!riskAnalysis.financialResult || !riskAnalysis.businessResult || !riskAnalysis.hygieneResult || !riskAnalysis.bankingResult) {
            return 0
        }

        const totalScore = (riskAnalysis.financialResult.score || 0) +
            (riskAnalysis.businessResult.score || 0) +
            (riskAnalysis.hygieneResult.score || 0) +
            (riskAnalysis.bankingResult.score || 0)
        const totalMaxScore = riskAnalysis.totalMaxScore || 500

        return (totalScore / totalMaxScore) * 100
    }

    const currentRiskScore = calculateOverallRiskScore()

    // Calculate multi-year trends (last 5 years) - CORRECTED DATA ACCESS
    const trendYears = years.slice(-5)

    const financialTrends = trendYears.map(year => {
        const revenue = getYearValue(financialData.profit_loss?.revenue?.net_revenue, year)
        const totalAssets = getYearValue(financialData.balance_sheet?.totals?.total_assets, year)
        const totalEquity = getYearValue(financialData.balance_sheet?.totals?.total_equity, year)

        // CORRECTED: Use the right paths from ratios analysis
        const ebitdaMargin = ratios?.profitability_ratios?.['ebitda_margin_()']?.[year] || 0
        const netMargin = ratios?.profitability_ratios?.['net_margin_()']?.[year] || 0
        const roe = ratios?.profitability_ratios?.['return_on_equity_()']?.[year] || 0
        const roce = ratios?.profitability_ratios?.['return_on_capital_employed_()']?.[year] || 0
        const currentRatio = ratios?.liquidity_ratios?.current_ratio?.[year] || 0
        const quickRatio = ratios?.liquidity_ratios?.quick_ratio?.[year] || 0
        const debtEquity = ratios?.leverage_ratios?.debt_equity?.[year] || 0
        const interestCoverage = ratios?.leverage_ratios?.interest_coverage_ratio?.[year] || 0

        // Calculate comprehensive financial risk score
        const profitabilityScore = Math.min(25, (ebitdaMargin * 1.5) + (netMargin * 2) + (roe * 0.8) + (roce * 0.7))
        const liquidityScore = Math.min(25, (currentRatio * 8) + (quickRatio * 12))
        const leverageScore = Math.min(25, Math.max(0, 25 - (debtEquity * 8) + (interestCoverage * 2)))
        const stabilityScore = Math.min(25, (revenue > 0 ? 15 : 0) + (totalAssets > 0 ? 10 : 0))

        const financialRiskScore = profitabilityScore + liquidityScore + leverageScore + stabilityScore

        return {
            year,
            revenue,
            totalAssets,
            totalEquity,
            ebitdaMargin,
            netMargin,
            roe,
            roce,
            currentRatio,
            quickRatio,
            debtEquity,
            interestCoverage,
            financialRiskScore
        }
    })

    // Calculate growth rates and trends
    const calculateTrendMetrics = (data: number[]) => {
        if (data.length < 2) return { growth: null, cagr: null, trend: 'stable' as const, volatility: 0 }

        const validData = data.filter(d => d !== null && d !== undefined && !isNaN(d))
        if (validData.length < 2) return { growth: null, cagr: null, trend: 'stable' as const, volatility: 0 }

        const latestValue = validData[validData.length - 1]
        const previousValue = validData[validData.length - 2]
        const firstValue = validData[0]

        const growth = calculateGrowthRate(latestValue, previousValue)
        const cagr = validData.length >= 3 && firstValue > 0 ? calculateCAGR(firstValue, latestValue, validData.length - 1) : null

        // Calculate volatility (coefficient of variation)
        const mean = validData.reduce((sum, val) => sum + val, 0) / validData.length
        const variance = validData.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / validData.length
        const volatility = mean > 0 ? (Math.sqrt(variance) / mean) * 100 : 0

        // Determine trend direction
        let increasingCount = 0
        let decreasingCount = 0

        for (let i = 1; i < validData.length; i++) {
            if (validData[i] > validData[i - 1]) increasingCount++
            else if (validData[i] < validData[i - 1]) decreasingCount++
        }

        const trend = increasingCount > decreasingCount ? 'increasing' :
            decreasingCount > increasingCount ? 'decreasing' : 'stable'

        return { growth, cagr, trend, volatility }
    }

    // Analyze trends for key metrics
    const revenueMetrics = calculateTrendMetrics(financialTrends.map(t => t.revenue))
    const ebitdaMarginMetrics = calculateTrendMetrics(financialTrends.map(t => t.ebitdaMargin))
    const roeMetrics = calculateTrendMetrics(financialTrends.map(t => t.roe))
    const riskScoreMetrics = calculateTrendMetrics(financialTrends.map(t => t.financialRiskScore))
    const liquidityMetrics = calculateTrendMetrics(financialTrends.map(t => t.currentRatio))
    const leverageMetrics = calculateTrendMetrics(financialTrends.map(t => t.debtEquity))

    // Extract key risk factors from allScores
    const getRiskFactors = () => {
        if (!riskAnalysis.allScores) return []

        return riskAnalysis.allScores
            .filter(score => score.available && score.score <= 2)
            .sort((a, b) => (a.score - b.score) || (b.weightage - a.weightage))
            .slice(0, 6)
    }

    const keyRiskFactors = getRiskFactors()

    // Extract positive factors from allScores
    const getPositiveFactors = () => {
        if (!riskAnalysis.allScores) return []

        return riskAnalysis.allScores
            .filter(score => score.available && score.score >= 4)
            .sort((a, b) => (b.score - a.score) || (b.weightage - a.weightage))
            .slice(0, 6)
    }

    const positiveFactors = getPositiveFactors()

    // Enhanced risk trajectory assessment
    const getRiskTrajectory = () => {
        const trend = riskScoreMetrics.trend
        const volatility = riskScoreMetrics.volatility
        const recentScore = financialTrends[financialTrends.length - 1]?.financialRiskScore || 0

        if (recentScore >= 80 && trend === 'increasing' && volatility < 10) {
            return {
                status: 'excellent',
                color: 'text-green-700',
                bgColor: 'bg-gradient-to-br from-green-50 to-emerald-100',
                borderColor: 'border-green-300',
                icon: CheckCircle2,
                description: 'Outstanding financial health with strong improving trajectory',
                confidence: 'high'
            }
        } else if (recentScore >= 70 && trend === 'increasing') {
            return {
                status: 'improving',
                color: 'text-blue-700',
                bgColor: 'bg-gradient-to-br from-blue-50 to-indigo-100',
                borderColor: 'border-blue-300',
                icon: TrendingUp,
                description: 'Strong financial position with positive momentum',
                confidence: 'high'
            }
        } else if (recentScore >= 60 && (trend === 'stable' || volatility < 15)) {
            return {
                status: 'stable',
                color: 'text-indigo-700',
                bgColor: 'bg-gradient-to-br from-indigo-50 to-purple-100',
                borderColor: 'border-indigo-300',
                icon: TrendingUpDownIcon,
                description: 'Stable financial profile with manageable risk levels',
                confidence: 'medium'
            }
        } else if (recentScore >= 50 && trend !== 'decreasing') {
            return {
                status: 'monitoring',
                color: 'text-amber-700',
                bgColor: 'bg-gradient-to-br from-amber-50 to-yellow-100',
                borderColor: 'border-amber-300',
                icon: AlertCircle,
                description: 'Moderate risk profile requiring active monitoring',
                confidence: 'medium'
            }
        } else {
            return {
                status: 'attention_required',
                color: 'text-red-700',
                bgColor: 'bg-gradient-to-br from-red-50 to-rose-100',
                borderColor: 'border-red-300',
                icon: AlertTriangle,
                description: 'Elevated risk levels requiring immediate attention',
                confidence: trend === 'decreasing' ? 'high' : 'medium'
            }
        }
    }

    const riskTrajectory = getRiskTrajectory()
    const TrajectoryIcon = riskTrajectory.icon

    const formatTrend = (trend: string, growth: number | null, value?: number) => {
        if (growth === null) return (
            <div className="flex items-center gap-1 text-gray-500">
                <Minus className="w-3 h-3" />
                <span className="text-xs">N/A</span>
            </div>
        )

        const icon = trend === 'increasing' ? TrendingUp :
            trend === 'decreasing' ? TrendingDown : TrendingUpDownIcon
        const color = trend === 'increasing' ? 'text-emerald-600' :
            trend === 'decreasing' ? 'text-red-600' : 'text-blue-600'

        return (
            <div className={`flex items-center gap-1 ${color}`}>
                {React.createElement(icon, { className: 'w-3 h-3' })}
                <span className="text-xs font-medium">{Math.abs(growth).toFixed(1)}%</span>
            </div>
        )
    }

    const getHealthColor = (percentage: number) => {
        if (percentage >= 80) return 'from-green-500 to-emerald-600'
        if (percentage >= 60) return 'from-blue-500 to-indigo-600'
        if (percentage >= 40) return 'from-amber-500 to-yellow-600'
        return 'from-red-500 to-rose-600'
    }

    const getHealthLabel = (percentage: number) => {
        if (percentage >= 80) return { label: 'Excellent', textColor: 'text-green-700' }
        if (percentage >= 60) return { label: 'Good', textColor: 'text-blue-700' }
        if (percentage >= 40) return { label: 'Fair', textColor: 'text-amber-700' }
        return { label: 'Poor', textColor: 'text-red-700' }
    }

    return (
        <Card className="border-0 shadow-lg bg-white">
            <CardHeader className="p-6">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        Risk Trend Analysis
                    </h3>
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-white/80 border-gray-300 text-gray-700 font-medium">
                            {trendYears.length} Year Analysis
                        </Badge>
                        <Badge variant="outline" className="bg-white/80 border-gray-300 text-gray-700">
                            <Calendar className="w-3 h-3 mr-1" />
                            FY {latestYear}
                        </Badge>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-6">
                <Tabs defaultValue="overview" className="space-y-8">
                    <TabsList className="grid w-full grid-cols-4 bg-gray-100/80 rounded-xl">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            Overview
                        </TabsTrigger>
                        <TabsTrigger value="financial-trends" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            Financial Trends
                        </TabsTrigger>
                        <TabsTrigger value="risk-factors" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            Risk Factors
                        </TabsTrigger>
                        <TabsTrigger value="projections" className="data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg">
                            Projections
                        </TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-8">
                        {/* Risk Trajectory Summary */}
                        <div className={`p-8 rounded-2xl border-2 ${riskTrajectory.borderColor} ${riskTrajectory.bgColor} shadow-sm`}>
                            <div className="flex items-start gap-4 mb-6">
                                <div className={`p-3 rounded-xl shadow-md bg-white/80`}>
                                    <TrajectoryIcon className={`w-7 h-7 ${riskTrajectory.color}`} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-2">
                                        <h4 className={`text-xl font-bold ${riskTrajectory.color} capitalize`}>
                                            {riskTrajectory.status.replace('_', ' ')} Trajectory
                                        </h4>
                                        <Badge className={`${riskTrajectory.color} bg-white/60 border-0 text-xs px-2 py-1`}>
                                            {riskTrajectory.confidence} confidence
                                        </Badge>
                                    </div>
                                    <p className={`text-base ${riskTrajectory.color.replace('-700', '-600')} leading-relaxed`}>
                                        {riskTrajectory.description}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <div className="text-3xl font-bold text-gray-900 mb-1">
                                        {currentRiskScore.toFixed(0)}%
                                    </div>
                                    <div className="text-sm text-gray-600">Risk Score</div>
                                </div>
                            </div>

                            {/* Health Status Indicators */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                {[
                                    {
                                        label: 'Financial Health',
                                        value: riskAnalysis.financialResult?.percentage || 0,
                                        icon: LineChart,
                                        color: 'blue'
                                    },
                                    {
                                        label: 'Business Quality',
                                        value: riskAnalysis.businessResult?.percentage || 0,
                                        icon: Target,
                                        color: 'purple'
                                    },
                                    {
                                        label: 'Compliance Status',
                                        value: riskAnalysis.hygieneResult?.percentage || 0,
                                        icon: Shield,
                                        color: 'green'
                                    },
                                    {
                                        label: 'Banking Relations',
                                        value: riskAnalysis.bankingResult?.percentage || 0,
                                        icon: IndianRupee,
                                        color: 'orange'
                                    }
                                ].map((item, index) => {
                                    const HealthIcon = item.icon
                                    const health = getHealthLabel(item.value)

                                    return (
                                        <div key={index} className="bg-white/60 backdrop-blur-sm p-5 rounded-xl border border-white/50 shadow-sm">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className={`p-2 rounded-lg bg-${item.color}-100`}>
                                                    <HealthIcon className={`w-4 h-4 text-${item.color}-600`} />
                                                </div>
                                                <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                            </div>
                                            <div className={`text-lg font-bold mb-3 ${health.textColor}`}>
                                                {health.label}
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2.5">
                                                <div
                                                    className={`h-2.5 rounded-full bg-gradient-to-r ${getHealthColor(item.value)} shadow-sm`}
                                                    style={{ width: `${Math.min(100, item.value)}%` }}
                                                ></div>
                                            </div>
                                            <div className="text-xs text-gray-600 mt-2 font-medium">
                                                {item.value.toFixed(0)}% Score
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>

                        {/* Performance Dashboard */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Financial Performance Snapshot */}
                            <div className="p-6 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 rounded-2xl border border-blue-200/50 shadow-sm">
                                <h5 className="font-semibold text-blue-900 mb-6 flex items-center gap-3 text-lg">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <LineChart className="w-5 h-5 text-blue-600" />
                                    </div>
                                    Financial Performance
                                </h5>
                                <div className="space-y-5">
                                    {[
                                        {
                                            metric: 'Revenue Growth',
                                            trend: revenueMetrics.trend,
                                            value: revenueMetrics.cagr ? `${revenueMetrics.cagr.toFixed(1)}% CAGR` : 'N/A',
                                            latest: `₹${(financialTrends[financialTrends.length - 1]?.revenue || 0).toFixed(0)}Cr`,
                                            growth: revenueMetrics.growth
                                        },
                                        {
                                            metric: 'Profitability Margin',
                                            trend: ebitdaMarginMetrics.trend,
                                            value: `${financialTrends[financialTrends.length - 1]?.ebitdaMargin?.toFixed(1) || 0}% EBITDA`,
                                            latest: `${financialTrends[financialTrends.length - 1]?.netMargin?.toFixed(1) || 0}% Net`,
                                            growth: ebitdaMarginMetrics.growth
                                        },
                                        {
                                            metric: 'Return Metrics',
                                            trend: roeMetrics.trend,
                                            value: `${financialTrends[financialTrends.length - 1]?.roe?.toFixed(1) || 0}% ROE`,
                                            latest: `${financialTrends[financialTrends.length - 1]?.roce?.toFixed(1) || 0}% ROCE`,
                                            growth: roeMetrics.growth
                                        }
                                    ].map((item, index) => (
                                        <div key={index} className="flex items-center justify-between p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${item.trend === 'increasing' ? 'bg-gradient-to-r from-green-400 to-emerald-500 shadow-green-200 shadow-md' :
                                                    item.trend === 'decreasing' ? 'bg-gradient-to-r from-red-400 to-rose-500 shadow-red-200 shadow-md' :
                                                        'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-blue-200 shadow-md'
                                                    }`}></div>
                                                <div>
                                                    <div className="font-semibold text-blue-900 text-sm">{item.metric}</div>
                                                    <div className="text-xs text-blue-600">{item.latest}</div>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-3">
                                                <div>
                                                    <div className="font-bold text-blue-900 text-sm">{item.value}</div>
                                                    <div className="flex justify-end">
                                                        {formatTrend(item.trend, item.growth)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Risk Stability Assessment */}
                            <div className="p-6 bg-gradient-to-br from-purple-50 via-pink-50 to-rose-50 rounded-2xl border border-purple-200/50 shadow-sm">
                                <h5 className="font-semibold text-purple-900 mb-6 flex items-center gap-3 text-lg">
                                    <div className="p-2 rounded-lg bg-purple-100">
                                        <Activity className="w-5 h-5 text-purple-600" />
                                    </div>
                                    Risk Stability Assessment
                                </h5>
                                <div className="space-y-5">
                                    {[
                                        {
                                            factor: 'Revenue Consistency',
                                            stability: revenueMetrics.volatility < 15 ? 'excellent' :
                                                revenueMetrics.volatility < 30 ? 'good' :
                                                    revenueMetrics.volatility < 50 ? 'moderate' : 'volatile',
                                            description: revenueMetrics.volatility < 15 ? 'Highly predictable revenue streams' :
                                                revenueMetrics.volatility < 30 ? 'Stable revenue with minor fluctuations' :
                                                    revenueMetrics.volatility < 50 ? 'Moderate revenue variability' : 'High revenue unpredictability',
                                            volatility: revenueMetrics.volatility
                                        },
                                        {
                                            factor: 'Margin Stability',
                                            stability: ebitdaMarginMetrics.volatility < 10 ? 'excellent' :
                                                ebitdaMarginMetrics.volatility < 25 ? 'good' :
                                                    ebitdaMarginMetrics.volatility < 40 ? 'moderate' : 'volatile',
                                            description: ebitdaMarginMetrics.volatility < 10 ? 'Consistent operational profitability' :
                                                ebitdaMarginMetrics.volatility < 25 ? 'Stable margin performance' :
                                                    ebitdaMarginMetrics.volatility < 40 ? 'Some margin fluctuation' : 'Unpredictable margin performance',
                                            volatility: ebitdaMarginMetrics.volatility
                                        },
                                        {
                                            factor: 'Overall Risk Trend',
                                            stability: riskScoreMetrics.volatility < 8 ? 'excellent' :
                                                riskScoreMetrics.volatility < 15 ? 'good' :
                                                    riskScoreMetrics.volatility < 25 ? 'moderate' : 'volatile',
                                            description: riskScoreMetrics.trend === 'increasing' ? 'Strengthening risk profile over time' :
                                                riskScoreMetrics.trend === 'decreasing' ? 'Deteriorating risk metrics require attention' :
                                                    'Stable risk profile with consistent performance',
                                            volatility: riskScoreMetrics.volatility
                                        }
                                    ].map((item, index) => {
                                        const stabilityConfig = {
                                            excellent: {
                                                color: 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 border-green-300',
                                                icon: CheckCircle2,
                                                iconColor: 'text-green-600'
                                            },
                                            good: {
                                                color: 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 border-blue-300',
                                                icon: Info,
                                                iconColor: 'text-blue-600'
                                            },
                                            moderate: {
                                                color: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-800 border-amber-300',
                                                icon: AlertCircle,
                                                iconColor: 'text-amber-600'
                                            },
                                            volatile: {
                                                color: 'bg-gradient-to-r from-red-100 to-rose-100 text-red-800 border-red-300',
                                                icon: AlertTriangle,
                                                iconColor: 'text-red-600'
                                            }
                                        }

                                        const config = stabilityConfig[item.stability]
                                        const StabilityIcon = config.icon

                                        return (
                                            <div key={index} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="font-semibold text-purple-900 text-sm">{item.factor}</span>
                                                    <Badge className={`text-xs border-2 ${config.color} flex items-center gap-1`}>
                                                        <StabilityIcon className={`w-3 h-3 ${config.iconColor}`} />
                                                        {item.stability}
                                                    </Badge>
                                                </div>
                                                <div className="text-xs text-purple-600 mb-3 leading-relaxed">{item.description}</div>
                                                <div className="w-full bg-purple-200 rounded-full h-1.5">
                                                    <div
                                                        className={`h-1.5 rounded-full ${item.stability === 'excellent' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                            item.stability === 'good' ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                                item.stability === 'moderate' ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                                                                    'bg-gradient-to-r from-red-400 to-rose-500'
                                                            } shadow-sm`}
                                                        style={{
                                                            width: `${Math.max(10, Math.min(100, 100 - (item.volatility || 0)))}%`
                                                        }}
                                                    ></div>
                                                </div>
                                                <div className="text-xs text-purple-500 mt-1 text-right">
                                                    Volatility: {(item.volatility || 0).toFixed(1)}%
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Quick Insights */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200/50 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-green-100">
                                        <Target className="w-5 h-5 text-green-600" />
                                    </div>
                                    <span className="font-semibold text-green-900 text-lg">Key Strengths</span>
                                </div>
                                <div className="text-3xl font-bold text-green-800 mb-2">
                                    {positiveFactors.length}
                                </div>
                                <div className="text-sm text-green-700 leading-relaxed">
                                    Areas performing above benchmarks with strong competitive positioning
                                </div>
                                {positiveFactors.length > 0 && (
                                    <div className="mt-4 flex items-center text-xs text-green-600 font-medium">
                                        <ArrowUpRight className="w-3 h-3 mr-1" />
                                        View detailed analysis →
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gradient-to-br from-amber-50 to-orange-100 rounded-2xl border border-amber-200/50 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-amber-100">
                                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                                    </div>
                                    <span className="font-semibold text-amber-900 text-lg">Watch Areas</span>
                                </div>
                                <div className="text-3xl font-bold text-amber-800 mb-2">
                                    {keyRiskFactors.length}
                                </div>
                                <div className="text-sm text-amber-700 leading-relaxed">
                                    Factors requiring active monitoring and potential intervention
                                </div>
                                {keyRiskFactors.length > 0 && (
                                    <div className="mt-4 flex items-center text-xs text-amber-600 font-medium">
                                        <AlertCircle className="w-3 h-3 mr-1" />
                                        Requires attention →
                                    </div>
                                )}
                            </div>

                            <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-2xl border border-blue-200/50 shadow-sm">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 rounded-lg bg-blue-100">
                                        <BarChart3 className="w-5 h-5 text-blue-600" />
                                    </div>
                                    <span className="font-semibold text-blue-900 text-lg">Analysis Depth</span>
                                </div>
                                <div className="text-3xl font-bold text-blue-800 mb-2">
                                    {trendYears.length}
                                </div>
                                <div className="text-sm text-blue-700 leading-relaxed">
                                    Years of comprehensive financial and risk data analyzed
                                </div>
                                <div className="mt-4 flex items-center text-xs text-blue-600 font-medium">
                                    <Info className="w-3 h-3 mr-1" />
                                    {new Date(trendYears[0]).getFullYear()} - {new Date(latestYear).getFullYear()}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Financial Trends Tab */}
                    <TabsContent value="financial-trends" className="space-y-8">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-semibold text-gray-900">Financial Performance Evolution</h4>
                                <Badge variant="outline" className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200 text-blue-700">
                                    {trendYears.length}-Year Timeline
                                </Badge>
                            </div>

                            {/* Visual Timeline */}
                            <div className="relative">
                                <div className="absolute left-8 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-200 via-indigo-300 to-purple-400 rounded-full shadow-sm"></div>
                                <div className="space-y-8">
                                    {financialTrends.map((data, index) => {
                                        const prevData = index > 0 ? financialTrends[index - 1] : null
                                        const revenueGrowth = prevData ? calculateGrowthRate(data.revenue, prevData.revenue) : null
                                        const isLatest = index === financialTrends.length - 1

                                        const performanceLevel =
                                            (data.ebitdaMargin > 15 && data.roe > 15 && data.currentRatio > 1.5) ? 'excellent' :
                                                (data.ebitdaMargin > 10 && data.roe > 10 && data.currentRatio > 1.2) ? 'good' :
                                                    (data.ebitdaMargin > 5 && data.roe > 5 && data.currentRatio > 1) ? 'average' : 'below-average'

                                        const performanceConfig = {
                                            excellent: {
                                                dotColor: 'bg-gradient-to-br from-green-400 to-emerald-600 border-green-600 shadow-green-200',
                                                cardColor: 'bg-gradient-to-br from-green-50 to-emerald-100 border-green-200',
                                                textColor: 'text-green-900',
                                                badge: 'success'
                                            },
                                            good: {
                                                dotColor: 'bg-gradient-to-br from-blue-400 to-indigo-600 border-blue-600 shadow-blue-200',
                                                cardColor: 'bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200',
                                                textColor: 'text-blue-900',
                                                badge: 'info'
                                            },
                                            average: {
                                                dotColor: 'bg-gradient-to-br from-amber-400 to-yellow-600 border-amber-600 shadow-amber-200',
                                                cardColor: 'bg-gradient-to-br from-amber-50 to-yellow-100 border-amber-200',
                                                textColor: 'text-amber-900',
                                                badge: 'warning'
                                            },
                                            'below-average': {
                                                dotColor: 'bg-gradient-to-br from-red-400 to-rose-600 border-red-600 shadow-red-200',
                                                cardColor: 'bg-gradient-to-br from-red-50 to-rose-100 border-red-200',
                                                textColor: 'text-red-900',
                                                badge: 'destructive'
                                            }
                                        }

                                        const config = performanceConfig[performanceLevel]

                                        return (
                                            <div key={data.year} className="relative flex items-start gap-8">
                                                {/* Timeline dot */}
                                                <div className={`relative z-10 w-6 h-6 rounded-full border-3 ${config.dotColor} shadow-lg ${isLatest ? 'ring-4 ring-opacity-30 ring-current animate-pulse' : ''}`}>
                                                    {isLatest && (
                                                        <div className="absolute inset-0 rounded-full bg-white/30"></div>
                                                    )}
                                                </div>

                                                {/* Year and performance card */}
                                                <div className={`flex-1 p-6 rounded-2xl border-2 ${config.cardColor} shadow-lg ${isLatest ? 'shadow-xl transform scale-[1.02]' : ''} transition-all duration-300 hover:shadow-xl hover:scale-[1.01]`}>
                                                    <div className="flex items-center justify-between mb-4">
                                                        <div className="flex items-center gap-4">
                                                            <h6 className={`font-bold text-2xl ${config.textColor}`}>
                                                                {new Date(data.year).getFullYear()}
                                                            </h6>
                                                            {isLatest && (
                                                                <Badge variant="outline" className="bg-white/80 border-2 border-current text-xs px-3 py-1 font-semibold">
                                                                    <Zap className="w-3 h-3 mr-1" />
                                                                    Current
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Badge variant={config.badge as BadgeVariant} className="text-sm px-3 py-1 font-semibold capitalize shadow-sm">
                                                            {performanceLevel.replace('-', ' ')}
                                                        </Badge>
                                                    </div>

                                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                                                        {/* Revenue */}
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Revenue</div>
                                                            <div className={`font-bold text-lg ${config.textColor}`}>₹{data.revenue.toFixed(0)}Cr</div>
                                                            {revenueGrowth !== null && (
                                                                <div className={`text-xs flex items-center gap-1 font-medium ${revenueGrowth >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                                                                    {revenueGrowth >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                                                    {Math.abs(revenueGrowth).toFixed(1)}%
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Profitability */}
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">EBITDA Margin</div>
                                                            <div className={`font-bold text-lg ${config.textColor}`}>{data.ebitdaMargin?.toFixed(1) || 'N/A'}%</div>
                                                            <div className="w-full bg-white/50 rounded-full h-2 shadow-inner">
                                                                <div
                                                                    className={`h-2 rounded-full shadow-sm ${(data.ebitdaMargin || 0) > 15 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                                        (data.ebitdaMargin || 0) > 10 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                                            (data.ebitdaMargin || 0) > 5 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-rose-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(100, Math.max(5, (data.ebitdaMargin || 0) * 4))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>

                                                        {/* Returns */}
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">ROE</div>
                                                            <div className={`font-bold text-lg ${config.textColor}`}>{data.roe?.toFixed(1) || 'N/A'}%</div>
                                                            <div className="w-full bg-white/50 rounded-full h-2 shadow-inner">
                                                                <div
                                                                    className={`h-2 rounded-full shadow-sm ${(data.roe || 0) > 20 ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                                        (data.roe || 0) > 15 ? 'bg-gradient-to-r from-blue-400 to-indigo-500' :
                                                                            (data.roe || 0) > 10 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' : 'bg-gradient-to-r from-red-400 to-rose-500'
                                                                        }`}
                                                                    style={{ width: `${Math.min(100, Math.max(5, (data.roe || 0) * 3))}%` }}
                                                                ></div>
                                                            </div>
                                                        </div>

                                                        {/* Risk Level */}
                                                        <div className="space-y-2">
                                                            <div className="text-xs font-medium text-gray-600 uppercase tracking-wide">Risk Level</div>
                                                            <div className={`font-bold text-lg ${data.financialRiskScore >= 70 ? 'text-green-700' :
                                                                data.financialRiskScore >= 50 ? 'text-blue-700' :
                                                                    data.financialRiskScore >= 30 ? 'text-amber-700' : 'text-red-700'
                                                                }`}>
                                                                {data.financialRiskScore >= 70 ? 'Low' :
                                                                    data.financialRiskScore >= 50 ? 'Moderate' :
                                                                        data.financialRiskScore >= 30 ? 'Medium' : 'High'}
                                                            </div>
                                                            <div className="flex gap-1">
                                                                {[1, 2, 3, 4, 5].map(level => (
                                                                    <div
                                                                        key={level}
                                                                        className={`w-2.5 h-2.5 rounded-full shadow-sm ${level <= (data.financialRiskScore / 20) ?
                                                                            (data.financialRiskScore >= 70 ? 'bg-gradient-to-br from-green-400 to-emerald-500' :
                                                                                data.financialRiskScore >= 50 ? 'bg-gradient-to-br from-blue-400 to-indigo-500' :
                                                                                    data.financialRiskScore >= 30 ? 'bg-gradient-to-br from-amber-400 to-yellow-500' : 'bg-gradient-to-br from-red-400 to-rose-500') :
                                                                            'bg-white border-2 border-gray-300'
                                                                            }`}
                                                                    ></div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Trend Insights Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="p-6 bg-gradient-to-br from-blue-50 to-cyan-100 rounded-2xl border border-blue-200 shadow-lg">
                                    <h5 className="font-semibold text-blue-900 mb-6 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-blue-100 shadow-sm">
                                            <TrendingUp className="w-5 h-5 text-blue-600" />
                                        </div>
                                        Growth Trajectory
                                    </h5>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-blue-700 text-sm font-medium">Revenue CAGR</span>
                                            <span className={`font-bold text-lg ${(revenueMetrics.cagr || 0) > 15 ? 'text-green-600' :
                                                (revenueMetrics.cagr || 0) > 5 ? 'text-blue-600' : (revenueMetrics.cagr || 0) < 0 ? 'text-red-600' : 'text-gray-600'
                                                }`}>
                                                {revenueMetrics.cagr ? `${revenueMetrics.cagr.toFixed(1)}%` : 'N/A'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-blue-700 leading-relaxed">
                                            {revenueMetrics.trend === 'increasing' ? 'Sustained growth trajectory with expanding market presence' :
                                                revenueMetrics.trend === 'decreasing' ? 'Revenue headwinds requiring strategic intervention' :
                                                    'Stable revenue foundation with consistent performance'}
                                        </div>
                                        <div className="w-full bg-blue-200 rounded-full h-3 shadow-inner">
                                            <div
                                                className="h-3 rounded-full bg-gradient-to-r from-blue-400 to-indigo-500 shadow-sm"
                                                style={{ width: `${Math.min(100, Math.max(10, Math.abs(revenueMetrics.cagr || 0) * 4))}%` }}
                                            ></div>
                                        </div>
                                        <div className="text-xs text-blue-600 text-right font-medium">
                                            Volatility: {revenueMetrics.volatility.toFixed(1)}%
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-100 rounded-2xl border border-purple-200 shadow-lg">
                                    <h5 className="font-semibold text-purple-900 mb-6 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-purple-100 shadow-sm">
                                            <BarChart3 className="w-5 h-5 text-purple-600" />
                                        </div>
                                        Profitability Evolution
                                    </h5>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-purple-700 text-sm font-medium">Margin Trend</span>
                                            <span className={`font-bold text-lg capitalize ${ebitdaMarginMetrics.trend === 'increasing' ? 'text-green-600' :
                                                ebitdaMarginMetrics.trend === 'decreasing' ? 'text-red-600' : 'text-blue-600'
                                                }`}>
                                                {ebitdaMarginMetrics.trend}
                                            </span>
                                        </div>
                                        <div className="text-xs text-purple-700 leading-relaxed">
                                            {ebitdaMarginMetrics.volatility < 10 ? 'Consistent operational efficiency with stable margins' :
                                                ebitdaMarginMetrics.volatility < 25 ? 'Moderate margin variation requiring monitoring' :
                                                    'High profitability volatility indicates operational challenges'}
                                        </div>
                                        <div className="flex gap-1">
                                            {financialTrends.slice(-5).map((trend, index) => (
                                                <div
                                                    key={index}
                                                    className={`flex-1 h-8 rounded-lg shadow-sm ${(trend.ebitdaMargin || 0) > 15 ? 'bg-gradient-to-t from-green-400 to-emerald-500' :
                                                        (trend.ebitdaMargin || 0) > 10 ? 'bg-gradient-to-t from-blue-400 to-indigo-500' :
                                                            (trend.ebitdaMargin || 0) > 5 ? 'bg-gradient-to-t from-amber-400 to-yellow-500' : 'bg-gradient-to-t from-red-400 to-rose-500'
                                                        }`}
                                                    title={`${new Date(trend.year).getFullYear()}: ${trend.ebitdaMargin?.toFixed(1)}%`}
                                                    style={{ height: `${Math.max(20, Math.min(100, (trend.ebitdaMargin || 0) * 2))}%` }}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-purple-600 text-right font-medium">
                                            Current: {financialTrends[financialTrends.length - 1]?.ebitdaMargin?.toFixed(1) || 0}%
                                        </div>
                                    </div>
                                </div>

                                <div className="p-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-2xl border border-green-200 shadow-lg">
                                    <h5 className="font-semibold text-green-900 mb-6 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-green-100 shadow-sm">
                                            <Target className="w-5 h-5 text-green-600" />
                                        </div>
                                        Risk Consistency
                                    </h5>
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-green-700 text-sm font-medium">Stability</span>
                                            <span className={`font-bold text-lg ${riskScoreMetrics.volatility < 10 ? 'text-green-600' :
                                                riskScoreMetrics.volatility < 20 ? 'text-amber-600' : 'text-red-600'
                                                }`}>
                                                {riskScoreMetrics.volatility < 10 ? 'High' :
                                                    riskScoreMetrics.volatility < 20 ? 'Medium' : 'Low'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-green-700 leading-relaxed">
                                            {riskScoreMetrics.trend === 'increasing' ? 'Financial risk profile strengthening over time' :
                                                riskScoreMetrics.trend === 'decreasing' ? 'Risk profile deteriorating, requires intervention' :
                                                    'Stable risk characteristics with predictable patterns'}
                                        </div>
                                        <div className="grid grid-cols-5 gap-1">
                                            {financialTrends.slice(-5).map((trend, index) => (
                                                <div
                                                    key={index}
                                                    className={`h-6 rounded-lg shadow-sm ${trend.financialRiskScore >= 70 ? 'bg-gradient-to-t from-green-400 to-emerald-500' :
                                                        trend.financialRiskScore >= 50 ? 'bg-gradient-to-t from-blue-400 to-indigo-500' :
                                                            trend.financialRiskScore >= 30 ? 'bg-gradient-to-t from-amber-400 to-yellow-500' : 'bg-gradient-to-t from-red-400 to-rose-500'
                                                        }`}
                                                    title={`${new Date(trend.year).getFullYear()}: ${trend.financialRiskScore.toFixed(1)}`}
                                                ></div>
                                            ))}
                                        </div>
                                        <div className="text-xs text-green-600 text-right font-medium">
                                            Score: {financialTrends[financialTrends.length - 1]?.financialRiskScore?.toFixed(0) || 0}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Risk Factors Tab */}
                    <TabsContent value="risk-factors" className="space-y-8">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-semibold text-gray-900">Comprehensive Risk Factor Analysis</h4>
                                <Badge variant="outline" className="bg-gradient-to-r from-red-50 to-orange-50 border-red-200 text-red-700">
                                    {riskAnalysis.allScores?.filter(score => score.available).length || 0} Factors Analyzed
                                </Badge>
                            </div>

                            {/* Risk Heatmap Overview */}

                            {/* Critical Areas and Strengths */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Critical Areas */}
                                <div className="space-y-6">
                                    <h5 className="font-semibold text-red-900 mb-4 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-red-100 shadow-sm">
                                            <AlertTriangle className="w-5 h-5 text-red-600" />
                                        </div>
                                        Areas Requiring Immediate Attention
                                    </h5>
                                    {keyRiskFactors.slice(0, 5).map((factor, index) => {
                                        const riskLevel = factor.score <= 1 ? 'critical' :
                                            factor.score <= 2 ? 'high' : 'medium'

                                        const riskConfig = {
                                            critical: {
                                                border: 'border-l-red-600',
                                                bg: 'bg-gradient-to-r from-red-50 to-rose-100',
                                                text: 'text-red-900',
                                                badge: 'destructive'
                                            },
                                            high: {
                                                border: 'border-l-orange-500',
                                                bg: 'bg-gradient-to-r from-orange-50 to-red-50',
                                                text: 'text-orange-900',
                                                badge: 'warning'
                                            },
                                            medium: {
                                                border: 'border-l-amber-500',
                                                bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
                                                text: 'text-amber-900',
                                                badge: 'warning'
                                            },
                                            minimal: {
                                                border: 'border-l-amber-500',
                                                bg: 'bg-gradient-to-r from-amber-50 to-yellow-50',
                                                text: 'text-amber-900',
                                                badge: 'warning'
                                            }
                                        }

                                        const config = riskConfig[riskLevel]

                                        return (
                                            <div key={index} className={`p-5 border-l-4 ${config.border} ${config.bg} rounded-r-xl shadow-md hover:shadow-lg transition-shadow`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <h6 className={`font-semibold ${config.text} text-sm leading-tight flex-1 mr-3`}>
                                                        {factor.parameter}
                                                    </h6>
                                                    <Badge variant={config.badge as BadgeVariant} size="sm" className="flex-shrink-0 shadow-sm">
                                                        {factor.benchmark}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className={`${config.text.replace('-900', '-600')}`}>Current Value:</span>
                                                        <span className={`font-bold ${config.text}`}>{factor.value}</span>
                                                    </div>
                                                    <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                                                        <div
                                                            className={`h-3 rounded-full shadow-sm ${riskLevel === 'critical' ? 'bg-gradient-to-r from-red-500 to-rose-600' :
                                                                riskLevel === 'high' ? 'bg-gradient-to-r from-orange-500 to-red-500' :
                                                                    'bg-gradient-to-r from-amber-500 to-yellow-500'
                                                                }`}
                                                            style={{ width: `${Math.max(15, (factor.score / factor.maxScore) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    {/* <div className="flex items-center justify-between text-xs">
                                                        <span className={config.text.replace('-900', '-600')}>Risk Score:</span>
                                                        <span className={`font-bold ${config.text}`}>{factor.score}/{factor.maxScore}</span>
                                                    </div> */}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>

                                {/* Strength Areas */}
                                <div className="space-y-6">
                                    <h5 className="font-semibold text-green-900 mb-4 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-green-100 shadow-sm">
                                            <Target className="w-5 h-5 text-green-600" />
                                        </div>
                                        Key Competitive Strengths
                                    </h5>
                                    {positiveFactors.slice(0, 5).map((factor, index) => {
                                        const strengthLevel = factor.score >= 5 ? 'excellent' :
                                            factor.score >= 4 ? 'good' : 'average'

                                        const strengthConfig = {
                                            excellent: {
                                                border: 'border-l-green-600',
                                                bg: 'bg-gradient-to-r from-green-50 to-emerald-100',
                                                text: 'text-green-900',
                                                badge: 'success'
                                            },
                                            good: {
                                                border: 'border-l-blue-500',
                                                bg: 'bg-gradient-to-r from-blue-50 to-indigo-50',
                                                text: 'text-blue-900',
                                                badge: 'info'
                                            },
                                            average: {
                                                border: 'border-l-gray-500',
                                                bg: 'bg-gradient-to-r from-gray-50 to-slate-100',
                                                text: 'text-gray-900',
                                                badge: 'secondary'
                                            }
                                        }

                                        const config = strengthConfig[strengthLevel]

                                        return (
                                            <div key={index} className={`p-5 border-l-4 ${config.border} ${config.bg} rounded-r-xl shadow-md hover:shadow-lg transition-shadow`}>
                                                <div className="flex items-start justify-between mb-3">
                                                    <h6 className={`font-semibold ${config.text} text-sm leading-tight flex-1 mr-3`}>
                                                        {factor.parameter}
                                                    </h6>
                                                    <Badge variant={config.badge as BadgeVariant} size="sm" className="flex-shrink-0 shadow-sm">
                                                        {factor.benchmark}
                                                    </Badge>
                                                </div>
                                                <div className="space-y-3">
                                                    <div className="flex items-center justify-between text-sm">
                                                        <span className={`${config.text.replace('-900', '-600')}`}>Current Value:</span>
                                                        <span className={`font-bold ${config.text}`}>{factor.value}</span>
                                                    </div>
                                                    <div className="w-full bg-white/60 rounded-full h-3 shadow-inner">
                                                        <div
                                                            className={`h-3 rounded-full shadow-sm ${strengthLevel === 'excellent' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                                                strengthLevel === 'good' ? 'bg-gradient-to-r from-blue-500 to-indigo-600' :
                                                                    'bg-gradient-to-r from-gray-500 to-slate-600'
                                                                }`}
                                                            style={{ width: `${Math.min(100, (factor.score / factor.maxScore) * 100)}%` }}
                                                        ></div>
                                                    </div>
                                                    {/* <div className="flex items-center justify-between text-xs">
                                                        <span className={config.text.replace('-900', '-600')}>Performance Score:</span>
                                                        <span className={`font-bold ${config.text}`}>{factor.score}/{factor.maxScore}</span>
                                                    </div> */}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Risk Category Breakdown */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {[
                                    {
                                        category: 'Financial Health',
                                        icon: LineChart,
                                        factors: riskAnalysis.allScores?.filter(s => s.available && (
                                            s.parameter.toLowerCase().includes('ebitda') ||
                                            s.parameter.toLowerCase().includes('revenue') ||
                                            s.parameter.toLowerCase().includes('profit') ||
                                            s.parameter.toLowerCase().includes('margin')
                                        )) || [],
                                        color: 'blue'
                                    },
                                    {
                                        category: 'Liquidity & Solvency',
                                        icon: Activity,
                                        factors: riskAnalysis.allScores?.filter(s => s.available && (
                                            s.parameter.toLowerCase().includes('current') ||
                                            s.parameter.toLowerCase().includes('debt') ||
                                            s.parameter.toLowerCase().includes('cash') ||
                                            s.parameter.toLowerCase().includes('working capital')
                                        )) || [],
                                        color: 'purple'
                                    },
                                    {
                                        category: 'Operational Efficiency',
                                        icon: Target,
                                        factors: riskAnalysis.allScores?.filter(s => s.available && (
                                            s.parameter.toLowerCase().includes('turnover') ||
                                            s.parameter.toLowerCase().includes('days') ||
                                            s.parameter.toLowerCase().includes('inventory') ||
                                            s.parameter.toLowerCase().includes('debtors')
                                        )) || [],
                                        color: 'green'
                                    },
                                    {
                                        category: 'Business Quality',
                                        icon: BarChart3,
                                        factors: riskAnalysis.allScores?.filter(s => s.available && (
                                            s.parameter.toLowerCase().includes('growth') ||
                                            s.parameter.toLowerCase().includes('trend') ||
                                            s.parameter.toLowerCase().includes('stability') ||
                                            s.parameter.toLowerCase().includes('quality')
                                        )) || [],
                                        color: 'orange'
                                    }
                                ].map((category, index) => {
                                    const CategoryIcon = category.icon
                                    const avgRisk = category.factors.length > 0 ?
                                        category.factors.reduce((sum, f) => sum + f.score, 0) / category.factors.length : 0

                                    const riskStatus = avgRisk <= 2 ? 'high' : avgRisk <= 3 ? 'medium' : 'low'

                                    const statusConfig = {
                                        high: {
                                            color: 'text-red-700 bg-gradient-to-br from-red-100 to-rose-200 border-red-300',
                                            label: 'Needs Attention'
                                        },
                                        medium: {
                                            color: 'text-amber-700 bg-gradient-to-br from-amber-100 to-yellow-200 border-amber-300',
                                            label: 'Monitor Closely'
                                        },
                                        low: {
                                            color: 'text-green-700 bg-gradient-to-br from-green-100 to-emerald-200 border-green-300',
                                            label: 'Performing Well'
                                        }
                                    }

                                    const config = statusConfig[riskStatus]

                                    return (
                                        <div key={index} className="p-6 bg-white border-2 border-gray-200 rounded-2xl hover:shadow-lg transition-shadow shadow-md">
                                            <div className="flex items-center gap-4 mb-4">
                                                <div className={`p-3 rounded-xl bg-${category.color}-100 shadow-sm`}>
                                                    <CategoryIcon className={`w-5 h-5 text-${category.color}-600`} />
                                                </div>
                                                <div className="flex-1">
                                                    <h6 className="font-semibold text-gray-900 text-sm">{category.category}</h6>
                                                    <div className={`text-xs px-3 py-1 rounded-full border ${config.color} font-medium mt-1`}>
                                                        {config.label}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-sm text-gray-600 mb-4">
                                                {category.factors.length} factors analyzed
                                            </div>
                                            <div className="flex gap-1">
                                                {category.factors.slice(0, 8).map((factor, fIndex) => (
                                                    <div
                                                        key={fIndex}
                                                        className={`h-2 flex-1 rounded-full shadow-sm ${factor.score <= 2 ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                                            factor.score <= 3 ? 'bg-gradient-to-r from-amber-400 to-yellow-500' :
                                                                'bg-gradient-to-r from-green-400 to-emerald-500'
                                                            }`}
                                                        title={factor.parameter}
                                                    ></div>
                                                ))}
                                            </div>
                                            <div className="text-xs text-gray-500 mt-2 font-medium">
                                                Avg Score: {avgRisk.toFixed(1)}/5
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Projections Tab */}
                    <TabsContent value="projections" className="space-y-8">
                        <div className="space-y-8">
                            <div className="flex items-center justify-between">
                                <h4 className="text-xl font-semibold text-gray-900">Strategic Outlook & Recommendations</h4>
                                <Badge variant="outline" className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 text-indigo-700">
                                    12-Month Horizon
                                </Badge>
                            </div>

                            {/* Risk Trajectory Forecast */}
                            <div className="p-8 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 rounded-2xl border border-indigo-200 shadow-lg">
                                <h5 className="font-semibold text-indigo-900 mb-6 flex items-center gap-3 text-lg">
                                    <div className="p-2 rounded-lg bg-indigo-100 shadow-sm">
                                        <Activity className="w-5 h-5 text-indigo-600" />
                                    </div>
                                    12-Month Risk Trajectory Forecast
                                </h5>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                    {/* Trajectory Visualization */}
                                    <div className={`p-6 rounded-2xl border-2 ${riskTrajectory.borderColor} ${riskTrajectory.bgColor} shadow-md`}>
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="p-3 rounded-xl bg-white/80 shadow-sm">
                                                <TrajectoryIcon className={`w-6 h-6 ${riskTrajectory.color}`} />
                                            </div>
                                            <div className="flex-1">
                                                <h6 className={`font-bold ${riskTrajectory.color} capitalize text-lg`}>
                                                    {riskTrajectory.status.replace('_', ' ')} Trajectory
                                                </h6>
                                                <p className={`text-sm ${riskTrajectory.color.replace('-700', '-600')}`}>
                                                    {riskTrajectory.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className={riskTrajectory.color}>Confidence Level:</span>
                                                <Badge className={`${riskTrajectory.color} bg-white/60 border-0 text-xs px-3 py-1 font-semibold`}>
                                                    {riskScoreMetrics.volatility < 10 ? 'High' :
                                                        riskScoreMetrics.volatility < 20 ? 'Medium' : 'Low'}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <span className={riskTrajectory.color}>Expected Direction:</span>
                                                <div className="flex items-center gap-2">
                                                    {riskScoreMetrics.trend === 'increasing' ?
                                                        <TrendingUp className="w-4 h-4 text-green-600" /> :
                                                        riskScoreMetrics.trend === 'decreasing' ?
                                                            <TrendingDown className="w-4 h-4 text-red-600" /> :
                                                            <TrendingUpDownIcon className="w-4 h-4 text-blue-600" />
                                                    }
                                                    <span className="font-semibold text-gray-900 capitalize">
                                                        {riskScoreMetrics.trend}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="w-full bg-white/50 rounded-full h-3 shadow-inner">
                                                <div
                                                    className={`h-3 rounded-full shadow-sm ${riskScoreMetrics.trend === 'increasing' ? 'bg-gradient-to-r from-green-400 to-emerald-500' :
                                                        riskScoreMetrics.trend === 'decreasing' ? 'bg-gradient-to-r from-red-400 to-rose-500' :
                                                            'bg-gradient-to-r from-blue-400 to-indigo-500'
                                                        }`}
                                                    style={{ width: `${Math.max(20, Math.min(100, 100 - riskScoreMetrics.volatility))}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Key Trajectory Drivers */}
                                    <div className="space-y-4">
                                        <h6 className="font-semibold text-indigo-900 text-lg">Key Trajectory Drivers</h6>
                                        <div className="space-y-4">
                                            {[
                                                {
                                                    driver: 'Revenue Performance',
                                                    impact: revenueMetrics.trend === 'increasing' ? 'positive' :
                                                        revenueMetrics.trend === 'decreasing' ? 'negative' : 'neutral',
                                                    description: revenueMetrics.trend === 'increasing' ? 'Revenue growth supporting overall stability' :
                                                        revenueMetrics.trend === 'decreasing' ? 'Revenue decline creating operational pressure' :
                                                            'Stable revenue foundation maintaining current position',
                                                    strength: revenueMetrics.volatility < 15 ? 'strong' : revenueMetrics.volatility < 30 ? 'moderate' : 'weak'
                                                },
                                                {
                                                    driver: 'Profitability Trends',
                                                    impact: ebitdaMarginMetrics.trend === 'increasing' ? 'positive' :
                                                        ebitdaMarginMetrics.trend === 'decreasing' ? 'negative' : 'neutral',
                                                    description: ebitdaMarginMetrics.trend === 'increasing' ? 'Margin expansion improving financial resilience' :
                                                        ebitdaMarginMetrics.trend === 'decreasing' ? 'Margin compression indicating cost pressures' :
                                                            'Stable profitability maintaining operational efficiency',
                                                    strength: ebitdaMarginMetrics.volatility < 10 ? 'strong' : ebitdaMarginMetrics.volatility < 25 ? 'moderate' : 'weak'
                                                },
                                                {
                                                    driver: 'Risk Factor Evolution',
                                                    impact: keyRiskFactors.length < 3 ? 'positive' :
                                                        keyRiskFactors.length > 5 ? 'negative' : 'neutral',
                                                    description: keyRiskFactors.length < 3 ? 'Minimal risk concentration enables growth focus' :
                                                        keyRiskFactors.length > 5 ? 'Multiple risk areas requiring management attention' :
                                                            'Balanced risk profile with manageable exposure',
                                                    strength: positiveFactors.length > keyRiskFactors.length ? 'strong' :
                                                        positiveFactors.length === keyRiskFactors.length ? 'moderate' : 'weak'
                                                },
                                                {
                                                    driver: 'Financial Stability',
                                                    impact: liquidityMetrics.trend === 'increasing' && leverageMetrics.trend !== 'increasing' ? 'positive' :
                                                        liquidityMetrics.trend === 'decreasing' || leverageMetrics.trend === 'increasing' ? 'negative' : 'neutral',
                                                    description: liquidityMetrics.trend === 'increasing' ? 'Strengthening liquidity supporting operational flexibility' :
                                                        liquidityMetrics.trend === 'decreasing' ? 'Liquidity pressures may constrain strategic options' :
                                                            'Stable financial structure maintaining operational capacity',
                                                    strength: liquidityMetrics.volatility < 15 ? 'strong' : liquidityMetrics.volatility < 30 ? 'moderate' : 'weak'
                                                }
                                            ].map((item, index) => {
                                                const impactConfig = {
                                                    positive: {
                                                        color: 'text-green-700 bg-gradient-to-r from-green-100 to-emerald-200 border-green-300',
                                                        badge: 'success'
                                                    },
                                                    negative: {
                                                        color: 'text-red-700 bg-gradient-to-r from-red-100 to-rose-200 border-red-300',
                                                        badge: 'destructive'
                                                    },
                                                    neutral: {
                                                        color: 'text-blue-700 bg-gradient-to-r from-blue-100 to-indigo-200 border-blue-300',
                                                        badge: 'info'
                                                    }
                                                }

                                                const config = impactConfig[item.impact]

                                                return (
                                                    <div key={index} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border border-white/60 shadow-sm">
                                                        <div className="flex items-center justify-between mb-2">
                                                            <span className="font-semibold text-indigo-900 text-sm">{item.driver}</span>
                                                            <div className="flex items-center gap-2">
                                                                <Badge variant={config.badge} size="sm" className="shadow-sm">
                                                                    {item.impact}
                                                                </Badge>
                                                                <Badge variant="outline" size="sm" className={`${config.color} border-2`}>
                                                                    {item.strength}
                                                                </Badge>
                                                            </div>
                                                        </div>
                                                        <div className="text-xs text-indigo-600 leading-relaxed">{item.description}</div>
                                                    </div>
                                                )
                                            })}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Strategic Recommendations */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                {/* Immediate Actions */}
                                <div className="p-6 bg-gradient-to-br from-orange-50 to-red-100 rounded-2xl border border-orange-200 shadow-lg">
                                    <h5 className="font-semibold text-orange-900 mb-6 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-orange-100 shadow-sm">
                                            <AlertTriangle className="w-5 h-5 text-orange-600" />
                                        </div>
                                        Immediate Priority Actions
                                    </h5>
                                    <div className="space-y-4">
                                        {currentRiskScore < 40 && (
                                            <div className="p-4 bg-red-100 border-l-4 border-red-500 rounded-r-lg shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <AlertTriangle className="w-4 h-4 text-red-600" />
                                                    <div className="font-semibold text-red-900 text-sm">Critical Risk Alert</div>
                                                </div>
                                                <div className="text-xs text-red-700 leading-relaxed">
                                                    Comprehensive risk management review required immediately
                                                </div>
                                            </div>
                                        )}

                                        {keyRiskFactors.slice(0, 3).map((factor, index) => (
                                            <div key={index} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-l-4 border-orange-400 shadow-sm">
                                                <div className="font-semibold text-orange-900 text-sm mb-2">
                                                    Address {factor.parameter.split(' ').slice(0, 4).join(' ')}
                                                </div>
                                                <div className="text-xs text-orange-700 mb-2">
                                                    Current: {factor.value} | Target: {factor.benchmark}
                                                </div>
                                                <div className="text-xs text-orange-600 font-medium">
                                                    Priority Level: {factor.score <= 1 ? 'Critical' : factor.score <= 2 ? 'High' : 'Medium'}
                                                </div>
                                            </div>
                                        ))}

                                        {revenueMetrics.volatility > 30 && (
                                            <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-l-4 border-yellow-400 shadow-sm">
                                                <div className="font-semibold text-yellow-900 text-sm mb-1">Stabilize Revenue Streams</div>
                                                <div className="text-xs text-yellow-700">High volatility ({revenueMetrics.volatility.toFixed(1)}%) requires diversification strategy</div>
                                            </div>
                                        )}

                                        {ebitdaMarginMetrics.trend === 'decreasing' && (
                                            <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-l-4 border-red-400 shadow-sm">
                                                <div className="font-semibold text-red-900 text-sm mb-1">Operational Efficiency Focus</div>
                                                <div className="text-xs text-red-700">Declining margins demand immediate cost optimization</div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Strategic Opportunities */}
                                <div className="p-6 bg-gradient-to-br from-green-50 to-blue-100 rounded-2xl border border-green-200 shadow-lg">
                                    <h5 className="font-semibold text-green-900 mb-6 flex items-center gap-3 text-lg">
                                        <div className="p-2 rounded-lg bg-green-100 shadow-sm">
                                            <Target className="w-5 h-5 text-green-600" />
                                        </div>
                                        Strategic Growth Opportunities
                                    </h5>
                                    <div className="space-y-4">
                                        {currentRiskScore >= 70 && (
                                            <div className="p-4 bg-green-100 border-l-4 border-green-500 rounded-r-lg shadow-sm">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                                                    <div className="font-semibold text-green-900 text-sm">Strong Credit Profile</div>
                                                </div>
                                                <div className="text-xs text-green-700 leading-relaxed">
                                                    Excellent position for credit facility expansion and preferential terms
                                                </div>
                                            </div>
                                        )}

                                        {positiveFactors.slice(0, 3).map((factor, index) => (
                                            <div key={index} className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-l-4 border-green-400 shadow-sm">
                                                <div className="font-semibold text-green-900 text-sm mb-2">
                                                    Leverage {factor.parameter.split(' ').slice(0, 4).join(' ')}
                                                </div>
                                                <div className="text-xs text-green-700 mb-2">
                                                    Performance: {factor.value} | Rating: {factor.benchmark}
                                                </div>
                                                <div className="text-xs text-green-600 font-medium">
                                                    Competitive Advantage: {factor.score >= 5 ? 'Strong' : 'Moderate'}
                                                </div>
                                            </div>
                                        ))}

                                        {revenueMetrics.trend === 'increasing' && (
                                            <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-l-4 border-blue-400 shadow-sm">
                                                <div className="font-semibold text-blue-900 text-sm mb-1">Growth Momentum Capitalization</div>
                                                <div className="text-xs text-blue-700">Strong revenue trends ({revenueMetrics.cagr?.toFixed(1)}% CAGR) support expansion financing</div>
                                            </div>
                                        )}

                                        {riskScoreMetrics.volatility < 10 && (
                                            <div className="p-4 bg-white/70 backdrop-blur-sm rounded-xl border-l-4 border-indigo-400 shadow-sm">
                                                <div className="font-semibold text-indigo-900 text-sm mb-1">Predictable Risk Profile</div>
                                                <div className="text-xs text-indigo-700">Low volatility ({riskScoreMetrics.volatility.toFixed(1)}%) enables long-term strategic planning</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Monitoring Framework */}
                            <div className="p-8 bg-gradient-to-r from-gray-50 to-slate-100 rounded-2xl border border-gray-200 shadow-lg">
                                <h5 className="font-semibold text-gray-900 mb-6 flex items-center gap-3 text-lg">
                                    <div className="p-2 rounded-lg bg-gray-100 shadow-sm">
                                        <BarChart3 className="w-5 h-5 text-gray-600" />
                                    </div>
                                    Comprehensive Monitoring Framework
                                </h5>

                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {[
                                        {
                                            frequency: 'Monthly',
                                            focus: 'Cash Flow & Liquidity',
                                            metrics: ['Working Capital Management', 'Cash Position Analysis', 'Debt Service Coverage'],
                                            priority: currentRiskScore < 50 ? 'critical' : currentRiskScore < 70 ? 'high' : 'standard',
                                            color: 'red'
                                        },
                                        {
                                            frequency: 'Quarterly',
                                            focus: 'Financial Performance',
                                            metrics: ['Revenue Growth Tracking', 'Margin Trend Analysis', 'Profitability Assessment'],
                                            priority: 'high',
                                            color: 'blue'
                                        },
                                        {
                                            frequency: 'Semi-Annual',
                                            focus: 'Strategic Risk Review',
                                            metrics: ['Overall Risk Score Update', 'Industry Benchmark Comparison', 'Compliance Status Review'],
                                            priority: currentRiskScore >= 70 ? 'standard' : 'high',
                                            color: 'purple'
                                        }
                                    ].map((framework, index) => {
                                        const priorityConfig = {
                                            critical: {
                                                color: 'bg-gradient-to-br from-red-100 to-rose-200 border-red-300 text-red-800',
                                                badge: 'destructive',
                                                icon: AlertTriangle
                                            },
                                            high: {
                                                color: 'bg-gradient-to-br from-amber-100 to-yellow-200 border-amber-300 text-amber-800',
                                                badge: 'warning',
                                                icon: AlertCircle
                                            },
                                            standard: {
                                                color: 'bg-gradient-to-br from-green-100 to-emerald-200 border-green-300 text-green-800',
                                                badge: 'success',
                                                icon: CheckCircle2
                                            }
                                        }

                                        const config = priorityConfig[framework.priority]
                                        const PriorityIcon = config.icon

                                        return (
                                            <div key={index} className="p-6 bg-white rounded-2xl border-2 border-gray-200 shadow-md hover:shadow-lg transition-shadow">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h6 className="font-bold text-gray-900 text-lg">{framework.frequency}</h6>
                                                    <Badge variant={config.badge} className="flex items-center gap-1 shadow-sm">
                                                        <PriorityIcon className="w-3 h-3" />
                                                        {framework.priority}
                                                    </Badge>
                                                </div>
                                                <div className="text-base font-semibold text-gray-800 mb-4">{framework.focus}</div>
                                                <div className="space-y-2">
                                                    {framework.metrics.map((metric, mIndex) => (
                                                        <div key={mIndex} className="text-sm text-gray-600 flex items-center gap-2">
                                                            <div className={`w-2 h-2 bg-${framework.color}-400 rounded-full`}></div>
                                                            {metric}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className={`mt-4 p-3 rounded-lg border ${config.color}`}>
                                                    <div className="text-xs font-medium">
                                                        {framework.priority === 'critical' ? 'Immediate attention required for all metrics' :
                                                            framework.priority === 'high' ? 'Close monitoring with monthly updates' :
                                                                'Standard review cycle with exception reporting'}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                </Tabs>
            </CardContent>
        </Card>
    )
}
