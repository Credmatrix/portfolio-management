'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    Calculator,
    TrendingUp,
    TrendingDown,
    Target,
    AlertTriangle,
    CheckCircle,
    BarChart3,
    DollarSign,
    Clock,
    Shield
} from 'lucide-react'

interface PortfolioCompany {
    extracted_data: {
        [key: string]: any
    }
}

interface RatiosAnalysisProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

// Helper function to calculate growth rate
const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

export function RatiosAnalysis({ company, industryBenchmarks }: RatiosAnalysisProps) {
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!financialData?.ratios) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Financial Ratios Analysis
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-600">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Financial ratios data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = financialData.years || []
    const latestYear = years[years.length - 1]
    const previousYear = years[years.length - 2]
    const ratios = financialData.ratios

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
        return calculateGrowthRate(current, previous)
    }

    // Profitability Ratios - corrected paths
    const ebitdaMargin = getLatestValue(ratios.profitability_ratios?.['ebitda_margin_()'])
    const netMargin = getLatestValue(ratios.profitability_ratios?.['net_margin_()'])
    const grossMargin = getLatestValue(ratios.profitability_ratios?.['gross_profit_margin_()'])
    const roe = getLatestValue(ratios.profitability_ratios?.['return_on_equity_()'])
    const roce = getLatestValue(ratios.profitability_ratios?.['return_on_capital_employed_()'])

    // Liquidity Ratios - corrected paths
    const currentRatio = getLatestValue(ratios.liquidity_ratios?.current_ratio)
    const quickRatio = getLatestValue(ratios.liquidity_ratios?.quick_ratio)

    // Efficiency Ratios - corrected paths
    const debtorDays = getLatestValue(ratios.efficiency_ratios?.['debtors_sales_(days)'])
    const creditorDays = getLatestValue(ratios.efficiency_ratios?.['payables_sales_(days)'])
    const inventoryDays = getLatestValue(ratios.efficiency_ratios?.['inventory_sales_(days)'])
    const cashConversionCycle = getLatestValue(ratios.efficiency_ratios?.['cash_conversion_cycle_(days)'])
    const assetTurnover = getLatestValue(ratios.efficiency_ratios?.sales_net_fixed_assets)

    // Leverage Ratios - corrected paths
    const debtRatio = getLatestValue(ratios.leverage_ratios?.debt_ratio)
    const debtEquity = getLatestValue(ratios.leverage_ratios?.debt_equity)
    const interestCoverage = getLatestValue(ratios.leverage_ratios?.interest_coverage_ratio)

    // Growth Ratios - corrected paths
    const revenueGrowth = getLatestValue(ratios.growth_ratios?.['revenue_growth_()'])

    // Calculate some additional metrics
    const debtToTotalCapital = debtRatio * 100 // Convert to percentage
    const cashRatio = 0 // Not available in provided data
    const roa = roe > 0 && debtEquity >= 0 ? roe / (1 + debtEquity) : 0 // Approximation
    const ebitMargin = ebitdaMargin // Approximation since EBIT margin not directly available

    // Benchmark comparison function
    const getBenchmarkStatus = (value: number, benchmark?: number, higherIsBetter: boolean = true) => {
        if (!benchmark) return { status: 'unknown', color: 'text-gray-500', icon: AlertTriangle }

        const threshold = 0.1 // 10% threshold
        const ratio = value / benchmark

        if (higherIsBetter) {
            if (ratio >= 1 + threshold) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle }
            if (ratio >= 1 - threshold) return { status: 'good', color: 'text-blue-600', icon: Target }
            return { status: 'poor', color: 'text-red-600', icon: TrendingDown }
        } else {
            if (ratio <= 1 - threshold) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle }
            if (ratio <= 1 + threshold) return { status: 'good', color: 'text-blue-600', icon: Target }
            return { status: 'poor', color: 'text-red-600', icon: TrendingUp }
        }
    }

    // Multi-year trend data (last 5 years)
    const trendYears = years.slice(-5)
    const ratioTrends = {
        profitability: trendYears.map(year => ({
            year,
            ebitdaMargin: ratios.profitability_ratios?.['ebitda_margin_()']?.[year] || 0,
            netMargin: ratios.profitability_ratios?.['net_margin_()']?.[year] || 0,
            roe: ratios.profitability_ratios?.['return_on_equity_()']?.[year] || 0,
            roce: ratios.profitability_ratios?.['return_on_capital_employed_()']?.[year] || 0
        })),
        liquidity: trendYears.map(year => ({
            year,
            currentRatio: ratios.liquidity_ratios?.current_ratio?.[year] || 0,
            quickRatio: ratios.liquidity_ratios?.quick_ratio?.[year] || 0
        })),
        leverage: trendYears.map(year => ({
            year,
            debtEquity: ratios.leverage_ratios?.debt_equity?.[year] || 0,
            interestCoverage: ratios.leverage_ratios?.interest_coverage_ratio?.[year] || 0,
            debtRatio: ratios.leverage_ratios?.debt_ratio?.[year] || 0
        })),
        efficiency: trendYears.map(year => ({
            year,
            debtorDays: ratios.efficiency_ratios?.['debtors_sales_(days)']?.[year] || 0,
            creditorDays: ratios.efficiency_ratios?.['payables_sales_(days)']?.[year] || 0,
            inventoryDays: ratios.efficiency_ratios?.['inventory_sales_(days)']?.[year] || 0,
            cashConversionCycle: ratios.efficiency_ratios?.['cash_conversion_cycle_(days)']?.[year] || 0
        }))
    }

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

    const RatioCard = ({
        title,
        value,
        unit = '',
        benchmark,
        higherIsBetter = true,
        description
    }: {
        title: string
        value: number
        unit?: string
        benchmark?: number
        higherIsBetter?: boolean
        description: string
    }) => {
        const status = getBenchmarkStatus(value, benchmark, higherIsBetter)
        const StatusIcon = status.icon

        return (
            <div className="p-4 border border-gray-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-gray-900">{title}</h5>
                    <StatusIcon className={`w-4 h-4 ${status.color}`} />
                </div>
                <div className="text-2xl font-bold text-gray-900 mb-1">
                    {value.toFixed(2)}{unit}
                </div>
                <div className="text-xs text-gray-600 mb-2">{description}</div>
                {benchmark && (
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Industry:</span>
                        <span className={status.color}>{benchmark.toFixed(2)}{unit}</span>
                    </div>
                )}
            </div>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Calculator className="w-5 h-5" />
                        Financial Ratios Analysis
                    </h3>
                    <Badge variant="outline" className="text-sm">
                        FY {latestYear}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="profitability" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="profitability">Profitability</TabsTrigger>
                        <TabsTrigger value="liquidity">Liquidity</TabsTrigger>
                        <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
                        <TabsTrigger value="leverage">Leverage</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                    </TabsList>

                    {/* Profitability Tab */}
                    <TabsContent value="profitability" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <RatioCard
                                title="Gross Margin"
                                value={grossMargin}
                                unit="%"
                                benchmark={industryBenchmarks?.median_gross_margin}
                                description="Gross profit as percentage of revenue"
                            />

                            <RatioCard
                                title="EBITDA Margin"
                                value={ebitdaMargin}
                                unit="%"
                                benchmark={industryBenchmarks?.median_ebitda_margin}
                                description="Operating profitability before interest, tax, depreciation"
                            />

                            <RatioCard
                                title="Net Margin"
                                value={netMargin}
                                unit="%"
                                benchmark={industryBenchmarks?.median_net_margin}
                                description="Bottom-line profitability after all expenses"
                            />

                            <RatioCard
                                title="Return on Equity"
                                value={roe}
                                unit="%"
                                benchmark={industryBenchmarks?.median_roe}
                                description="Returns generated on shareholders' equity"
                            />

                            <RatioCard
                                title="Return on Capital"
                                value={roce}
                                unit="%"
                                benchmark={industryBenchmarks?.median_roce}
                                description="Returns on total capital employed"
                            />

                            <RatioCard
                                title="Revenue Growth"
                                value={revenueGrowth}
                                unit="%"
                                benchmark={industryBenchmarks?.median_revenue_growth}
                                description="Year-over-year revenue growth rate"
                            />
                        </div>

                        {/* Profitability Analysis */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Profitability Analysis
                            </h4>
                            <div className="text-sm text-blue-700">
                                {ebitdaMargin >= 15 && netMargin >= 10 && roe >= 15
                                    ? "Strong profitability across all metrics with healthy margins and returns."
                                    : ebitdaMargin >= 10 && netMargin >= 5 && roe >= 10
                                        ? "Moderate profitability with room for improvement in operational efficiency."
                                        : "Below-average profitability requiring attention to cost management and operational efficiency."
                                }
                            </div>
                        </div>
                    </TabsContent>

                    {/* Liquidity Tab */}
                    <TabsContent value="liquidity" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RatioCard
                                title="Current Ratio"
                                value={currentRatio}
                                benchmark={industryBenchmarks?.median_current_ratio}
                                description="Ability to pay short-term obligations"
                            />

                            <RatioCard
                                title="Quick Ratio"
                                value={quickRatio}
                                benchmark={industryBenchmarks?.median_quick_ratio}
                                description="Liquidity excluding inventory"
                            />
                        </div>

                        {/* Liquidity Analysis */}
                        <div className="space-y-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                                <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                                    <DollarSign className="w-4 h-4" />
                                    Liquidity Assessment
                                </h4>
                                <div className="text-sm text-green-700">
                                    {currentRatio >= 2 && quickRatio >= 1
                                        ? "Excellent liquidity position with strong ability to meet short-term obligations."
                                        : currentRatio >= 1.5 && quickRatio >= 0.8
                                            ? "Good liquidity position with adequate working capital management."
                                            : currentRatio >= 1 && quickRatio >= 0.5
                                                ? "Moderate liquidity requiring careful cash flow management."
                                                : "Liquidity concerns - may face challenges meeting short-term obligations."
                                    }
                                </div>
                            </div>

                            {/* Liquidity Benchmarks */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div className="p-3 bg-gray-50 rounded">
                                    <div className="text-gray-600 mb-1">Current Ratio Status</div>
                                    <div className={`font-semibold ${currentRatio >= 2 ? 'text-green-600' :
                                            currentRatio >= 1.5 ? 'text-blue-600' :
                                                currentRatio >= 1 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {currentRatio >= 2 ? 'Excellent' :
                                            currentRatio >= 1.5 ? 'Good' :
                                                currentRatio >= 1 ? 'Adequate' : 'Poor'}
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <div className="text-gray-600 mb-1">Quick Ratio Status</div>
                                    <div className={`font-semibold ${quickRatio >= 1 ? 'text-green-600' :
                                            quickRatio >= 0.8 ? 'text-blue-600' :
                                                quickRatio >= 0.5 ? 'text-yellow-600' : 'text-red-600'
                                        }`}>
                                        {quickRatio >= 1 ? 'Excellent' :
                                            quickRatio >= 0.8 ? 'Good' :
                                                quickRatio >= 0.5 ? 'Adequate' : 'Poor'}
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded">
                                    <div className="text-gray-600 mb-1">Working Capital</div>
                                    <div className="font-semibold text-gray-900">
                                        {currentRatio > 1 ? 'Positive' : 'Negative'}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Efficiency Tab */}
                    <TabsContent value="efficiency" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <RatioCard
                                title="Debtor Days"
                                value={debtorDays}
                                unit=" days"
                                higherIsBetter={false}
                                description="Average collection period for receivables"
                            />

                            <RatioCard
                                title="Inventory Days"
                                value={inventoryDays}
                                unit=" days"
                                higherIsBetter={false}
                                description="Average inventory holding period"
                            />

                            <RatioCard
                                title="Creditor Days"
                                value={creditorDays}
                                unit=" days"
                                description="Average payment period to suppliers"
                            />

                            <RatioCard
                                title="Cash Conversion Cycle"
                                value={cashConversionCycle}
                                unit=" days"
                                higherIsBetter={false}
                                description="Time to convert investments into cash"
                            />

                            <RatioCard
                                title="Asset Turnover"
                                value={assetTurnover}
                                unit="x"
                                description="Sales efficiency per unit of fixed assets"
                            />
                        </div>

                        {/* Efficiency Analysis */}
                        <div className="p-4 bg-purple-50 rounded-lg">
                            <h4 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                                <Clock className="w-4 h-4" />
                                Working Capital Efficiency
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-purple-600 mb-1">Cash Conversion Analysis</div>
                                    <div className="text-purple-700">
                                        {cashConversionCycle <= 30
                                            ? "Excellent cash conversion with minimal working capital requirements."
                                            : cashConversionCycle <= 60
                                                ? "Good cash conversion cycle with efficient working capital management."
                                                : cashConversionCycle <= 90
                                                    ? "Moderate cash conversion - opportunities for improvement exist."
                                                    : "Long cash conversion cycle may strain liquidity and profitability."
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div className="text-purple-600 mb-1">Asset Utilization</div>
                                    <div className="text-purple-700">
                                        {assetTurnover >= 5
                                            ? "High asset efficiency with strong revenue generation per fixed asset."
                                            : assetTurnover >= 3
                                                ? "Moderate asset utilization with room for improvement."
                                                : "Low asset turnover suggests underutilized fixed assets."
                                        }
                                    </div>
                                </div>
                            </div>

                            {/* Working Capital Components */}
                            <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
                                <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-gray-900">{debtorDays}</div>
                                    <div className="text-xs text-gray-600">Collection Days</div>
                                </div>
                                <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-gray-900">{inventoryDays}</div>
                                    <div className="text-xs text-gray-600">Inventory Days</div>
                                </div>
                                <div className="text-center p-3 bg-white rounded">
                                    <div className="text-lg font-bold text-gray-900">{creditorDays}</div>
                                    <div className="text-xs text-gray-600">Payment Days</div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Leverage Tab */}
                    <TabsContent value="leverage" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <RatioCard
                                title="Debt-to-Equity"
                                value={debtEquity}
                                benchmark={industryBenchmarks?.median_debt_equity}
                                higherIsBetter={false}
                                description="Financial leverage and capital structure"
                            />

                            <RatioCard
                                title="Debt Ratio"
                                value={debtRatio}
                                benchmark={industryBenchmarks?.median_debt_ratio}
                                higherIsBetter={false}
                                description="Total debt as proportion of total assets"
                            />

                            <RatioCard
                                title="Interest Coverage"
                                value={interestCoverage}
                                unit="x"
                                description="Ability to service interest payments"
                            />
                        </div>

                        {/* Leverage Analysis */}
                        <div className="p-4 bg-red-50 rounded-lg">
                            <h4 className="font-medium text-red-900 mb-3 flex items-center gap-2">
                                <Shield className="w-4 h-4" />
                                Financial Risk Assessment
                            </h4>
                            <div className="text-sm text-red-700">
                                {debtEquity <= 0.5 && interestCoverage >= 5
                                    ? "Conservative capital structure with low financial risk and strong debt servicing ability."
                                    : debtEquity <= 1 && interestCoverage >= 3
                                        ? "Moderate leverage with adequate interest coverage - manageable financial risk."
                                        : debtEquity <= 2 && interestCoverage >= 2
                                            ? "Higher leverage requiring careful monitoring of debt servicing capabilities."
                                            : "High financial risk due to excessive leverage or weak interest coverage."
                                }
                            </div>

                            {/* Leverage Progress Bars */}
                            <div className="mt-4 space-y-3">
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Debt-to-Equity Risk Level</span>
                                        <span>{debtEquity.toFixed(2)}</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${debtEquity <= 0.5 ? 'bg-green-500' : debtEquity <= 1 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(100, (debtEquity / 2) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                                
                                <div>
                                    <div className="flex justify-between text-xs mb-1">
                                        <span>Interest Coverage Strength</span>
                                        <span>{interestCoverage.toFixed(1)}x</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full ${interestCoverage >= 5 ? 'bg-green-500' : interestCoverage >= 3 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${Math.min(100, (interestCoverage / 10) * 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">5-Year Ratio Trends</h4>

                            {/* Profitability Trends */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-700">Profitability Ratios (%)</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 text-gray-600">Year</th>
                                                <th className="text-right py-2 text-gray-600">Gross Margin</th>
                                                <th className="text-right py-2 text-gray-600">EBITDA Margin</th>
                                                <th className="text-right py-2 text-gray-600">Net Margin</th>
                                                <th className="text-right py-2 text-gray-600">ROE</th>
                                                <th className="text-right py-2 text-gray-600">ROCE</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ratioTrends.profitability.map((data) => (
                                                <tr key={data.year} className="border-b border-gray-100">
                                                    <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                    <td className="text-right py-2 text-gray-900">
                                                        {ratios.profitability_ratios?.['gross_profit_margin_()']?.[data.year]?.toFixed(1) || 'N/A'}%
                                                    </td>
                                                    <td className="text-right py-2 text-gray-900">{data.ebitdaMargin.toFixed(1)}%</td>
                                                    <td className="text-right py-2 text-gray-900">{data.netMargin.toFixed(1)}%</td>
                                                    <td className="text-right py-2 text-gray-900">{data.roe.toFixed(1)}%</td>
                                                    <td className="text-right py-2 text-gray-900">{data.roce.toFixed(1)}%</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Efficiency Trends */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-700">Efficiency Ratios (Days)</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 text-gray-600">Year</th>
                                                <th className="text-right py-2 text-gray-600">Debtor Days</th>
                                                <th className="text-right py-2 text-gray-600">Inventory Days</th>
                                                <th className="text-right py-2 text-gray-600">Creditor Days</th>
                                                <th className="text-right py-2 text-gray-600">Cash Cycle</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {ratioTrends.efficiency.map((data) => (
                                                <tr key={data.year} className="border-b border-gray-100">
                                                    <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.debtorDays.toFixed(0)}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.inventoryDays.toFixed(0)}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.creditorDays.toFixed(0)}</td>
                                                    <td className={`text-right py-2 ${data.cashConversionCycle <= 60 ? 'text-green-600' : data.cashConversionCycle <= 120 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                        {data.cashConversionCycle.toFixed(0)}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Liquidity & Leverage Trends */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <h5 className="text-sm font-medium text-gray-700">Liquidity Ratios</h5>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 text-gray-600">Year</th>
                                                    <th className="text-right py-2 text-gray-600">Current</th>
                                                    <th className="text-right py-2 text-gray-600">Quick</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ratioTrends.liquidity.map((data) => (
                                                    <tr key={data.year} className="border-b border-gray-100">
                                                        <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.currentRatio.toFixed(2)}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.quickRatio.toFixed(2)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                <div className="space-y-3">
                                    <h5 className="text-sm font-medium text-gray-700">Leverage Ratios</h5>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-sm">
                                            <thead>
                                                <tr className="border-b border-gray-200">
                                                    <th className="text-left py-2 text-gray-600">Year</th>
                                                    <th className="text-right py-2 text-gray-600">D/E</th>
                                                    <th className="text-right py-2 text-gray-600">Int. Cov.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {ratioTrends.leverage.map((data) => (
                                                    <tr key={data.year} className="border-b border-gray-100">
                                                        <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.debtEquity.toFixed(2)}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.interestCoverage.toFixed(1)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>

                            {/* Overall Performance Score */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-3">Overall Financial Health Score</h5>
                                <div className="grid grid-cols-4 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {(() => {
                                                let score = 0
                                                // Profitability (40% weight)
                                                if (ebitdaMargin >= 15) score += 15
                                                else if (ebitdaMargin >= 10) score += 10
                                                else if (ebitdaMargin >= 5) score += 5

                                                if (netMargin >= 10) score += 15
                                                else if (netMargin >= 5) score += 10
                                                else if (netMargin >= 2) score += 5

                                                if (roe >= 15) score += 10
                                                else if (roe >= 10) score += 7
                                                else if (roe >= 5) score += 3

                                                // Liquidity (20% weight)
                                                if (currentRatio >= 2) score += 10
                                                else if (currentRatio >= 1.5) score += 7
                                                else if (currentRatio >= 1) score += 3

                                                if (quickRatio >= 1) score += 10
                                                else if (quickRatio >= 0.8) score += 7
                                                else if (quickRatio >= 0.5) score += 3

                                                // Efficiency (20% weight)
                                                if (cashConversionCycle <= 60) score += 10
                                                else if (cashConversionCycle <= 120) score += 5

                                                if (assetTurnover >= 5) score += 10
                                                else if (assetTurnover >= 3) score += 5

                                                // Leverage (20% weight)
                                                if (debtEquity <= 0.5) score += 10
                                                else if (debtEquity <= 1) score += 7
                                                else if (debtEquity <= 2) score += 3

                                                if (interestCoverage >= 5) score += 10
                                                else if (interestCoverage >= 3) score += 7
                                                else if (interestCoverage >= 2) score += 3

                                                return Math.min(100, score)
                                            })()}
                                        </div>
                                        <div className="text-gray-600">Overall Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${ebitdaMargin >= 10 && netMargin >= 5 && roe >= 10 ? 'text-green-600' :
                                            ebitdaMargin >= 5 && netMargin >= 3 && roe >= 5 ? 'text-blue-600' :
                                                'text-red-600'
                                            }`}>
                                            {ebitdaMargin >= 10 && netMargin >= 5 && roe >= 10 ? 'A' :
                                                ebitdaMargin >= 5 && netMargin >= 3 && roe >= 5 ? 'B' :
                                                    ebitdaMargin >= 3 && netMargin >= 1 ? 'C' : 'D'}
                                        </div>
                                        <div className="text-gray-600">Profitability Grade</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${currentRatio >= 1.5 && quickRatio >= 1 ? 'text-green-600' :
                                            currentRatio >= 1 && quickRatio >= 0.8 ? 'text-blue-600' :
                                                'text-red-600'
                                            }`}>
                                            {currentRatio >= 1.5 && quickRatio >= 1 ? 'A' :
                                                currentRatio >= 1 && quickRatio >= 0.8 ? 'B' :
                                                    currentRatio >= 0.8 && quickRatio >= 0.5 ? 'C' : 'D'}
                                        </div>
                                        <div className="text-gray-600">Liquidity Grade</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${debtEquity <= 0.5 && interestCoverage >= 5 ? 'text-green-600' :
                                            debtEquity <= 1 && interestCoverage >= 3 ? 'text-blue-600' :
                                                'text-red-600'
                                            }`}>
                                            {debtEquity <= 0.5 && interestCoverage >= 5 ? 'A' :
                                                debtEquity <= 1 && interestCoverage >= 3 ? 'B' :
                                                    debtEquity <= 2 && interestCoverage >= 2 ? 'C' : 'D'}
                                        </div>
                                        <div className="text-gray-600">Leverage Grade</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}