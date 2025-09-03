'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    TrendingUp,
    TrendingDown,
    BarChart3,
    PieChart,
    Calculator,
    AlertTriangle,
    DollarSign,
    Percent,
    Calendar
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

// Import financial analysis components
import { BalanceSheetChart } from './financial/BalanceSheetChart'
import { ProfitLossChart } from './financial/ProfitLossChart'
import { RatiosAnalysis } from './financial/RatiosAnalysis'
import { CashFlowAnalysis } from './financial/CashFlowAnalysis'
import { BenchmarkComparison } from './financial/BenchmarkComparison'
import { RiskTrendAnalysis } from './financial/RiskTrendAnalysis'

interface FinancialDataSectionProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

export function FinancialDataSection({ company, industryBenchmarks }: FinancialDataSectionProps) {
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!financialData) {
        return (
            <Card>
                <CardHeader>
                    <h2 className="text-xl font-semibold text-neutral-90 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Financial Analysis
                    </h2>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Financial data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = financialData.years || []
    const latestYear = years[years.length - 1]
    const previousYear = years[years.length - 2]

    // Helper function to get latest value
    const getLatestValue = (data: any) => {
        if (!data || !latestYear) return 0
        return data[latestYear] || 0
    }

    // Helper function to calculate growth
    const calculateGrowth = (data: any) => {
        if (!data || !latestYear || !previousYear) return null
        const current = data[latestYear] || 0
        const previous = data[previousYear] || 0
        if (previous === 0) return null
        return ((current - previous) / previous) * 100
    }

    // Helper function to format growth
    const formatGrowth = (growth: number | null) => {
        if (growth === null) return 'N/A'
        const isPositive = growth >= 0
        return (
            <span className={`flex items-center gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {Math.abs(growth).toFixed(1)}%
            </span>
        )
    }

    // Key financial metrics
    const revenue = getLatestValue(financialData.profit_loss?.revenue)
    const ebitda = getLatestValue(financialData.profit_loss?.ebitda)
    const pat = getLatestValue(financialData.profit_loss?.pat)
    const totalAssets = getLatestValue(financialData.balance_sheet?.assets?.total_assets)
    const totalEquity = getLatestValue(financialData.balance_sheet?.equity?.total_equity)
    const totalLiabilities = getLatestValue(financialData.balance_sheet?.liabilities?.total_liabilities)

    // Growth calculations
    const revenueGrowth = calculateGrowth(financialData.profit_loss?.revenue)
    const ebitdaGrowth = calculateGrowth(financialData.profit_loss?.ebitda)
    const patGrowth = calculateGrowth(financialData.profit_loss?.pat)

    // Ratios
    const ebitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0
    const netMargin = revenue > 0 ? (pat / revenue) * 100 : 0
    const roe = totalEquity > 0 ? (pat / totalEquity) * 100 : 0
    const debtEquity = getLatestValue(financialData.ratios?.leverage?.debt_equity) || 0
    const currentRatio = getLatestValue(financialData.ratios?.liquidity?.current_ratio) || 0

    return (
        <div className="space-y-8">
            {/* Risk Trend Analysis */}
            <RiskTrendAnalysis
                company={company}
                industryBenchmarks={industryBenchmarks}
            />
            {/* Balance Sheet Analysis */}
            <BalanceSheetChart
                company={company}
                industryBenchmarks={industryBenchmarks}
            />

            {/* Profit & Loss Analysis */}
            <ProfitLossChart
                company={company}
                industryBenchmarks={industryBenchmarks}
            />

            {/* Financial Ratios Analysis */}
            <RatiosAnalysis
                company={company}
                industryBenchmarks={industryBenchmarks}
            />

            {/* Cash Flow Analysis */}
            <CashFlowAnalysis
                company={company}
                industryBenchmarks={industryBenchmarks}
            />

            {/* Benchmark Comparison */}
            <BenchmarkComparison
                company={company}
                industryBenchmarks={industryBenchmarks}
            />

        </div>
    )
}