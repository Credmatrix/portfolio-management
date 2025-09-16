'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Calculator,
    AlertTriangle,
    BarChart3
} from 'lucide-react'

interface PortfolioCompany {
    extracted_data: {
        [key: string]: any
    }
}

interface ProfitLossChartProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

// Helper function to calculate growth rate
const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

export function ProfitLossChart({ company, industryBenchmarks }: ProfitLossChartProps) {
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!financialData?.profit_loss) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Profit & Loss Analysis
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-600">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Profit & Loss data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = financialData.years || []
    const latestYear = years[years.length - 1]
    const previousYear = years[years.length - 2]
    const profitLoss = financialData.profit_loss
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

    // P&L data - corrected paths
    const revenue = getLatestValue(profitLoss.revenue?.net_revenue)
    const otherIncome = getLatestValue(profitLoss.revenue?.other_income)
    const totalIncome = revenue + otherIncome
    const totalOperatingCost = getLatestValue(profitLoss.operating_costs?.total_operating_cost)
    const ebitda = getLatestValue(profitLoss.profitability?.['operating_profit_(_ebitda_)'])
    const depreciation = getLatestValue(profitLoss.operating_costs?.depreciation_and_amortization_expense)
    const ebit = getLatestValue(profitLoss.profitability?.profit_before_interest_and_tax)
    const interestExpense = getLatestValue(profitLoss.finance_costs?.finance_costs)
    const pbt = getLatestValue(profitLoss.profitability?.profit_before_tax)
    const tax = getLatestValue(profitLoss.tax?.income_tax)
    const pat = getLatestValue(profitLoss.profitability?.profit_for_the_period)

    // Operating cost breakdown
    const employeeCost = getLatestValue(profitLoss.operating_costs?.employee_benefit_expense)
    const materialCost = getLatestValue(profitLoss.operating_costs?.cost_of_materials_consumed)
    const purchasesStock = getLatestValue(profitLoss.operating_costs?.purchases_of_stockintrade)
    const otherExpenses = getLatestValue(profitLoss.operating_costs?.other_expenses)

    // Growth calculations
    const revenueGrowth = calculateGrowth(profitLoss.revenue?.net_revenue)
    const ebitdaGrowth = calculateGrowth(profitLoss.profitability?.['operating_profit_(_ebitda_)'])
    const patGrowth = calculateGrowth(profitLoss.profitability?.profit_for_the_period)

    // Margin calculations using ratios section for accuracy
    const ebitdaMargin = getLatestValue(ratios?.profitability_ratios?.['ebitda_margin_()'])
    const netMargin = getLatestValue(ratios?.profitability_ratios?.['net_margin_()'])
    const grossMargin = getLatestValue(ratios?.profitability_ratios?.['gross_profit_margin_()'])

    // Calculate margins manually as backup
    const calcEbitdaMargin = revenue > 0 ? (ebitda / revenue) * 100 : 0
    const calcEbitMargin = revenue > 0 ? (ebit / revenue) * 100 : 0
    const calcNetMargin = revenue > 0 ? (pat / revenue) * 100 : 0
    const taxRate = pbt > 0 ? (tax / pbt) * 100 : 0

    // Use ratio data if available, otherwise use calculated values
    const finalEbitdaMargin = ebitdaMargin || calcEbitdaMargin
    const finalNetMargin = netMargin || calcNetMargin

    // Multi-year trend data (last 5 years)
    const trendYears = years.slice(-5)
    const profitabilityTrend = trendYears.map(year => ({
        year,
        revenue: profitLoss.revenue?.net_revenue?.[year] || 0,
        ebitda: profitLoss.profitability?.['operating_profit_(_ebitda_)']?.[year] || 0,
        ebit: profitLoss.profitability?.profit_before_interest_and_tax?.[year] || 0,
        pat: profitLoss.profitability?.profit_for_the_period?.[year] || 0,
        ebitdaMargin: ratios?.profitability_ratios?.['ebitda_margin_()']?.[year] || 0,
        netMargin: ratios?.profitability_ratios?.['net_margin_()']?.[year] || 0
    }))

    // Expense breakdown
    const expenseBreakdown = [
        { name: 'Employee Benefits', value: employeeCost, color: 'bg-red-500' },
        { name: 'Material Costs', value: materialCost, color: 'bg-orange-500' },
        { name: 'Stock Purchases', value: purchasesStock, color: 'bg-yellow-500' },
        { name: 'Other Expenses', value: otherExpenses, color: 'bg-purple-500' },
        { name: 'Depreciation', value: depreciation, color: 'bg-gray-500' },
        { name: 'Interest', value: interestExpense, color: 'bg-pink-500' },
        { name: 'Tax', value: tax, color: 'bg-indigo-500' }
    ].filter(item => item.value > 0)

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

    const getBenchmarkStatus = (value: number, benchmark?: number) => {
        if (!benchmark) return { status: 'unknown', color: 'text-gray-500' }
        if (value >= benchmark * 1.1) return { status: 'above', color: 'text-green-600' }
        if (value >= benchmark * 0.9) return { status: 'inline', color: 'text-blue-600' }
        return { status: 'below', color: 'text-red-600' }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5" />
                        Profit & Loss Analysis
                    </h3>
                    <Badge variant="outline" className="text-sm">
                        FY {latestYear}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="profitability">Profitability</TabsTrigger>
                        <TabsTrigger value="expenses">Expenses</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="risk-correlation">Risk Correlation</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <IndianRupee className="w-5 h-5 text-blue-600" />
                                    <div className="text-right">
                                        {formatGrowth(revenueGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-900 mb-1">
                                    ₹{revenue.toFixed(1)} Cr
                                </div>
                                <div className="text-sm text-blue-700">Revenue</div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    <div className="text-right">
                                        {formatGrowth(ebitdaGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-green-900 mb-1">
                                    ₹{ebitda.toFixed(1)} Cr
                                </div>
                                <div className="text-sm text-green-700">EBITDA</div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Calculator className="w-5 h-5 text-purple-600" />
                                    <div className="text-right">
                                        {formatGrowth(patGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-purple-900 mb-1">
                                    ₹{pat.toFixed(1)} Cr
                                </div>
                                <div className="text-sm text-purple-700">Net Profit</div>
                            </div>
                        </div>

                        {/* P&L Waterfall */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-4">Profit & Loss Waterfall (₹ Crores)</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                                    <span className="font-medium text-blue-900">Revenue</span>
                                    <span className="font-bold text-blue-900">₹{revenue.toFixed(1)} Cr</span>
                                </div>

                                {otherIncome > 0 && (
                                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded">
                                        <span className="text-blue-700">Add: Other Income</span>
                                        <span className="font-semibold text-blue-700">+₹{otherIncome.toFixed(1)} Cr</span>
                                    </div>
                                )}

                                <div className="flex items-center justify-between p-3 bg-red-50 rounded">
                                    <span className="text-red-700">Less: Operating Costs</span>
                                    <span className="font-semibold text-red-700">-₹{totalOperatingCost.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-green-50 rounded">
                                    <span className="font-medium text-green-900">EBITDA</span>
                                    <span className="font-bold text-green-900">₹{ebitda.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-orange-50 rounded">
                                    <span className="text-orange-700">Less: Depreciation</span>
                                    <span className="font-semibold text-orange-700">-₹{depreciation.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-indigo-50 rounded">
                                    <span className="font-medium text-indigo-900">EBIT</span>
                                    <span className="font-bold text-indigo-900">₹{ebit.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-yellow-50 rounded">
                                    <span className="text-yellow-700">Less: Interest Expense</span>
                                    <span className="font-semibold text-yellow-700">-₹{interestExpense.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                    <span className="font-medium text-gray-900">PBT</span>
                                    <span className="font-bold text-gray-900">₹{pbt.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-purple-50 rounded">
                                    <span className="text-purple-700">Less: Tax</span>
                                    <span className="font-semibold text-purple-700">-₹{tax.toFixed(1)} Cr</span>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-emerald-50 rounded border-2 border-emerald-200">
                                    <span className="font-bold text-emerald-900">Net Profit (PAT)</span>
                                    <span className="font-bold text-emerald-900 text-lg">₹{pat.toFixed(1)} Cr</span>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Profitability Tab */}
                    <TabsContent value="profitability" className="space-y-6">
                        {/* Margin Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {grossMargin.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 mb-2">Gross Margin</div>
                                {industryBenchmarks?.median_gross_margin && (
                                    <div className={`text-xs ${getBenchmarkStatus(grossMargin, industryBenchmarks.median_gross_margin).color}`}>
                                        vs Industry: {industryBenchmarks.median_gross_margin.toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {finalEbitdaMargin.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 mb-2">EBITDA Margin</div>
                                {industryBenchmarks?.median_ebitda_margin && (
                                    <div className={`text-xs ${getBenchmarkStatus(finalEbitdaMargin, industryBenchmarks.median_ebitda_margin).color}`}>
                                        vs Industry: {industryBenchmarks.median_ebitda_margin.toFixed(1)}%
                                    </div>
                                )}
                            </div>

                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {calcEbitMargin.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 mb-2">EBIT Margin</div>
                            </div>

                            <div className="text-center p-4 bg-gray-50 rounded-lg">
                                <div className="text-2xl font-bold text-gray-900 mb-1">
                                    {finalNetMargin.toFixed(1)}%
                                </div>
                                <div className="text-sm text-gray-600 mb-2">Net Margin</div>
                            </div>
                        </div>

                        {/* Profitability Metrics */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-lg font-semibold text-gray-900 mb-1">
                                    {getLatestValue(ratios?.profitability_ratios?.['return_on_equity_()'])?.toFixed(1) || 'N/A'}%
                                </div>
                                <div className="text-xs text-gray-600">Return on Equity</div>
                            </div>

                            <div className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-lg font-semibold text-gray-900 mb-1">
                                    {getLatestValue(ratios?.profitability_ratios?.['return_on_capital_employed_()'])?.toFixed(1) || 'N/A'}%
                                </div>
                                <div className="text-xs text-gray-600">ROCE</div>
                            </div>

                            <div className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-lg font-semibold text-gray-900 mb-1">
                                    {taxRate.toFixed(1)}%
                                </div>
                                <div className="text-xs text-gray-600">Effective Tax Rate</div>
                            </div>

                            <div className="text-center p-3 bg-gray-50 rounded">
                                <div className="text-lg font-semibold text-gray-900 mb-1">
                                    {interestExpense > 0 && ebit > 0 ? (ebit / interestExpense).toFixed(1) : 'N/A'}
                                </div>
                                <div className="text-xs text-gray-600">Interest Coverage</div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Expenses Tab */}
                    <TabsContent value="expenses" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Expense Breakdown */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Expense Breakdown</h4>
                                <div className="space-y-3">
                                    {expenseBreakdown.map((expense, index) => {
                                        const percentage = revenue > 0 ? (expense.value / revenue) * 100 : 0
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${expense.color}`} />
                                                    <span className="text-gray-900">{expense.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900">₹{expense.value.toFixed(1)} Cr</div>
                                                    <div className="text-xs text-gray-600">{percentage.toFixed(1)}% of Revenue</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            {/* Cost Structure */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Cost Structure Analysis</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-600">Operating Leverage</span>
                                            <span className="font-semibold text-gray-900">
                                                {revenue > 0 ? ((revenue - totalOperatingCost) / revenue * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Contribution margin after operating costs
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-600">Fixed Cost Ratio</span>
                                            <span className="font-semibold text-gray-900">
                                                {revenue > 0 ? ((depreciation + interestExpense) / revenue * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Depreciation + Interest as % of Revenue
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-600">Variable Cost Ratio</span>
                                            <span className="font-semibold text-gray-900">
                                                {revenue > 0 ? ((materialCost + purchasesStock) / revenue * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Material + Stock costs as % of Revenue
                                        </div>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-gray-600">Employee Cost Ratio</span>
                                            <span className="font-semibold text-gray-900">
                                                {revenue > 0 ? (employeeCost / revenue * 100).toFixed(1) : 0}%
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            Employee costs as % of Revenue
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">5-Year Profitability Trends</h4>

                            {/* Profitability Trend Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 text-gray-600">Year</th>
                                            <th className="text-right py-2 text-gray-600">Revenue (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">EBITDA (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">PAT (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">EBITDA %</th>
                                            <th className="text-right py-2 text-gray-600">Net %</th>
                                            <th className="text-right py-2 text-gray-600">Revenue Growth</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {profitabilityTrend.map((data, index) => {
                                            const prevYear = index > 0 ? profitabilityTrend[index - 1] : null
                                            const revenueGrowthYoY = prevYear ? calculateGrowthRate(data.revenue, prevYear.revenue) : null

                                            return (
                                                <tr key={data.year} className="border-b border-gray-100">
                                                    <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.revenue.toFixed(1)}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.ebitda.toFixed(1)}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.pat.toFixed(1)}</td>
                                                    <td className="text-right py-2 text-gray-900">{data.ebitdaMargin.toFixed(1)}%</td>
                                                    <td className="text-right py-2 text-gray-900">{data.netMargin.toFixed(1)}%</td>
                                                    <td className="text-right py-2">
                                                        {revenueGrowthYoY !== null ? (
                                                            <span className={revenueGrowthYoY >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                {revenueGrowthYoY.toFixed(1)}%
                                                            </span>
                                                        ) : (
                                                            <span className="text-gray-400">-</span>
                                                        )}
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            {/* Performance Summary */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-blue-900 mb-3">Performance Summary</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                    <div>
                                        <div className="text-blue-600 mb-1">Revenue CAGR (5Y)</div>
                                        <div className="font-semibold text-blue-900">
                                            {profitabilityTrend.length >= 2 ?
                                                ((Math.pow(
                                                    profitabilityTrend[profitabilityTrend.length - 1].revenue / profitabilityTrend[0].revenue,
                                                    1 / (profitabilityTrend.length - 1)
                                                ) - 1) * 100).toFixed(3) + '%' : 'N/A'
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-blue-600 mb-1">Avg EBITDA Margin</div>
                                        <div className="font-semibold text-blue-900">
                                            {(profitabilityTrend.reduce((sum, data) => sum + data.ebitdaMargin, 0) / profitabilityTrend.length).toFixed(1)}%
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-blue-600 mb-1">Avg Net Margin</div>
                                        <div className="font-semibold text-blue-900">
                                            {(profitabilityTrend.reduce((sum, data) => sum + data.netMargin, 0) / profitabilityTrend.length).toFixed(1)}%
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Risk Correlation Tab */}
                    <TabsContent value="risk-correlation" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">Profitability Risk Correlation Analysis</h4>

                            {/* Profitability Risk Indicators */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-gray-700">Earnings Quality Risk</h5>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">EBITDA Margin Risk</span>
                                                <span className={`font-semibold ${finalEbitdaMargin >= 15 ? 'text-green-600' : finalEbitdaMargin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {finalEbitdaMargin >= 15 ? 'Low' : finalEbitdaMargin >= 10 ? 'Medium' : 'High'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {finalEbitdaMargin >= 15
                                                    ? "Strong operating margins provide earnings stability"
                                                    : finalEbitdaMargin >= 10
                                                        ? "Moderate margins with some earnings volatility risk"
                                                        : "Low margins indicate high earnings volatility risk"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Net Margin Stability</span>
                                                <span className={`font-semibold ${finalNetMargin >= 10 ? 'text-green-600' : finalNetMargin >= 5 ? 'text-yellow-600' : 'text-red-600'}`}>
                                                    {finalNetMargin >= 10 ? 'Stable' : finalNetMargin >= 5 ? 'Moderate' : 'Volatile'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Net margin consistency indicates earnings predictability
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Operating Leverage</span>
                                                <span className={`font-semibold ${revenue > 0 && (totalOperatingCost / revenue) <= 0.7 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {revenue > 0 ? ((totalOperatingCost / revenue) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Operating costs as % of revenue
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-gray-700">Financial Risk Indicators</h5>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Interest Coverage Risk</span>
                                                <span className={`font-semibold ${interestExpense > 0 && ebit > 0 && (ebit / interestExpense) >= 3 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {interestExpense > 0 && ebit > 0 ?
                                                        ((ebit / interestExpense) >= 3 ? 'Low' : 'High') : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {interestExpense > 0 && ebit > 0 && (ebit / interestExpense) >= 3
                                                    ? "Strong ability to service debt obligations"
                                                    : "Potential difficulty in servicing debt"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Tax Efficiency</span>
                                                <span className={`font-semibold ${taxRate <= 30 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {taxRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Effective tax rate indicates tax management efficiency
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Earnings Growth Risk</span>
                                                <span className={`font-semibold ${patGrowth !== null && patGrowth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {patGrowth !== null ?
                                                        (patGrowth >= 0 ? 'Low' : 'High') : 'N/A'
                                                    }
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {patGrowth !== null && patGrowth >= 0
                                                    ? "Positive earnings growth reduces credit risk"
                                                    : "Declining earnings increases credit risk"
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Correlation Matrix */}
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h5 className="font-medium text-purple-900 mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Profitability-Risk Correlation Matrix
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <div className="text-purple-600 mb-2">Revenue Stability Impact</div>
                                        <div className="text-purple-700">
                                            {revenueGrowth !== null && revenueGrowth >= 10
                                                ? "Strong revenue growth (>10%) significantly reduces credit risk and supports higher credit limits."
                                                : revenueGrowth !== null && revenueGrowth >= 0
                                                    ? "Stable revenue growth provides moderate risk mitigation."
                                                    : "Declining revenue increases credit risk and may require limit reductions."
                                            }
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-purple-600 mb-2">Margin Quality Impact</div>
                                        <div className="text-purple-700">
                                            {finalEbitdaMargin >= 15 && finalNetMargin >= 10
                                                ? "High-quality margins (EBITDA >15%, Net >10%) indicate strong operational efficiency and low business risk."
                                                : finalEbitdaMargin >= 10 && finalNetMargin >= 5
                                                    ? "Moderate margin quality provides adequate risk coverage."
                                                    : "Low margins indicate operational challenges and elevated business risk."
                                            }
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk-Adjusted Performance Score */}
                            <div className="p-4 bg-gray-50 rounded-lg">
                                <h5 className="font-medium text-gray-900 mb-3">Risk-Adjusted Performance Score</h5>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {(() => {
                                                let score = 0
                                                if (finalEbitdaMargin >= 15) score += 30
                                                else if (finalEbitdaMargin >= 10) score += 20
                                                else if (finalEbitdaMargin >= 5) score += 10

                                                if (finalNetMargin >= 10) score += 25
                                                else if (finalNetMargin >= 5) score += 15
                                                else if (finalNetMargin >= 2) score += 5

                                                if (revenueGrowth !== null && revenueGrowth >= 10) score += 25
                                                else if (revenueGrowth !== null && revenueGrowth >= 0) score += 15

                                                if (interestExpense > 0 && ebit > 0 && (ebit / interestExpense) >= 3) score += 20
                                                else if (interestExpense > 0 && ebit > 0 && (ebit / interestExpense) >= 1.5) score += 10

                                                return Math.min(100, score)
                                            })()}
                                        </div>
                                        <div className="text-gray-600">Overall Score</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${finalEbitdaMargin >= 15 && finalNetMargin >= 10 ? 'text-green-600' :
                                            finalEbitdaMargin >= 10 && finalNetMargin >= 5 ? 'text-blue-600' :
                                                'text-red-600'
                                            }`}>
                                            {finalEbitdaMargin >= 15 && finalNetMargin >= 10 ? 'A' :
                                                finalEbitdaMargin >= 10 && finalNetMargin >= 5 ? 'B' :
                                                    finalEbitdaMargin >= 5 && finalNetMargin >= 2 ? 'C' : 'D'}
                                        </div>
                                        <div className="text-gray-600">Risk Grade</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${(revenueGrowth !== null && revenueGrowth >= 0) && finalEbitdaMargin >= 10 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {(revenueGrowth !== null && revenueGrowth >= 0) && finalEbitdaMargin >= 10 ? 'Stable' : 'Volatile'}
                                        </div>
                                        <div className="text-gray-600">Outlook</div>
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