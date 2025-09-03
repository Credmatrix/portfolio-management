'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    DollarSign,
    Building,
    AlertTriangle
} from 'lucide-react'

interface PortfolioCompany {
    extracted_data: {
        [key: string]: any
    }
}

interface BalanceSheetChartProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

// Helper function to calculate growth rate
const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

export function BalanceSheetChart({ company }: BalanceSheetChartProps) {
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!financialData?.balance_sheet) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Balance Sheet Analysis
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-600">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Balance sheet data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = financialData.years || []
    const latestYear = years[years.length - 1]
    const previousYear = years[years.length - 2]
    const balanceSheet = financialData.balance_sheet

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

    // Assets data - corrected paths
    const totalAssets = getLatestValue(balanceSheet.totals?.total_assets)
    const totalCurrentAssets = getLatestValue(balanceSheet.totals?.total_current_assets)
    const tangibleAssets = getLatestValue(balanceSheet.assets?.fixed_assets?.tangible_assets)
    const intangibleAssets = getLatestValue(balanceSheet.assets?.fixed_assets?.intangible_assets)
    const tradeReceivables = getLatestValue(balanceSheet.assets?.current_assets?.trade_receivables)
    const cashAndBank = getLatestValue(balanceSheet.assets?.current_assets?.cash_and_bank_balances)
    const inventories = getLatestValue(balanceSheet.assets?.current_assets?.inventories)

    // Liabilities and Equity data - corrected paths
    const totalEquity = getLatestValue(balanceSheet.totals?.total_equity)
    const shareCapital = getLatestValue(balanceSheet.equity?.share_capital)
    const reservesAndSurplus = getLatestValue(balanceSheet.equity?.reserves_and_surplus)
    const totalCurrentLiabilities = getLatestValue(balanceSheet.totals?.total_current_liabilities)
    const totalNonCurrentLiabilities = getLatestValue(balanceSheet.totals?.total_noncurrent_liabilities)
    const totalLiabilities = totalCurrentLiabilities + totalNonCurrentLiabilities
    const longTermBorrowings = getLatestValue(balanceSheet.liabilities?.non_current_liabilities?.long_term_borrowings)
    const shortTermBorrowings = getLatestValue(balanceSheet.liabilities?.current_liabilities?.short_term_borrowings)
    const tradePayables = getLatestValue(balanceSheet.liabilities?.current_liabilities?.trade_payables)

    // Growth calculations
    const assetsGrowth = calculateGrowth(balanceSheet.totals?.total_assets)
    const equityGrowth = calculateGrowth(balanceSheet.totals?.total_equity)
    const currentLiabilitiesGrowth = calculateGrowth(balanceSheet.totals?.total_current_liabilities)

    // Asset composition
    const assetComposition = [
        { name: 'Current Assets', value: totalCurrentAssets, color: 'bg-blue-500' },
        { name: 'Tangible Assets', value: tangibleAssets, color: 'bg-green-500' },
        { name: 'Intangible Assets', value: intangibleAssets, color: 'bg-purple-500' },
        { name: 'Other Assets', value: Math.max(0, totalAssets - totalCurrentAssets - tangibleAssets - intangibleAssets), color: 'bg-gray-500' }
    ].filter(item => item.value > 0)

    // Liability and Equity composition
    const liabilityEquityComposition = [
        { name: 'Equity', value: totalEquity, color: 'bg-green-500' },
        { name: 'Long-term Debt', value: longTermBorrowings, color: 'bg-red-500' },
        { name: 'Short-term Debt', value: shortTermBorrowings, color: 'bg-orange-500' },
        { name: 'Trade Payables', value: tradePayables, color: 'bg-yellow-500' },
        { name: 'Other Liabilities', value: Math.max(0, totalLiabilities - longTermBorrowings - shortTermBorrowings - tradePayables), color: 'bg-gray-500' }
    ].filter(item => item.value > 0)

    // Multi-year trend data (last 5 years)
    const trendYears = years.slice(-5)
    const assetsTrend = trendYears.map(year => ({
        year,
        totalAssets: balanceSheet.totals?.total_assets?.[year] || 0,
        currentAssets: balanceSheet.totals?.total_current_assets?.[year] || 0,
        tangibleAssets: balanceSheet.assets?.fixed_assets?.tangible_assets?.[year] || 0
    }))

    const equityLiabilityTrend = trendYears.map(year => ({
        year,
        totalEquity: balanceSheet.totals?.total_equity?.[year] || 0,
        totalCurrentLiabilities: balanceSheet.totals?.total_current_liabilities?.[year] || 0,
        totalNonCurrentLiabilities: balanceSheet.totals?.total_noncurrent_liabilities?.[year] || 0,
        longTermDebt: balanceSheet.liabilities?.non_current_liabilities?.long_term_borrowings?.[year] || 0
    }))

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

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <BarChart3 className="w-5 h-5" />
                        Balance Sheet Analysis
                    </h3>
                    <Badge variant="outline" className="text-sm">
                        As of {latestYear}
                    </Badge>
                </div>
            </CardHeader>

            <CardContent>
                <Tabs defaultValue="overview" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-5">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="assets">Assets</TabsTrigger>
                        <TabsTrigger value="liabilities">Liabilities</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="risk-correlation">Risk Correlation</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Key Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <Building className="w-5 h-5 text-blue-600" />
                                    <div className="text-right">
                                        {formatGrowth(assetsGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-900 mb-1">
                                    ₹{totalAssets.toFixed(1)} Cr
                                </div>
                                <div className="text-sm text-blue-700">Total Assets</div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <DollarSign className="w-5 h-5 text-green-600" />
                                    <div className="text-right">
                                        {formatGrowth(equityGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-green-900 mb-1">
                                    ₹{totalEquity.toFixed(1)} Cr
                                </div>
                                <div className="text-sm text-green-700">Total Equity</div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <AlertTriangle className="w-5 h-5 text-red-600" />
                                    <div className="text-right">
                                        {formatGrowth(currentLiabilitiesGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-red-900 mb-1">
                                    ₹{totalLiabilities.toFixed(1)} Cr
                                </div>
                                <div className="text-sm text-red-700">Total Liabilities</div>
                            </div>
                        </div>

                        {/* Balance Sheet Equation */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-3">Balance Sheet Equation</h4>
                            <div className="flex items-center justify-center text-sm">
                                <div className="text-center">
                                    <div className="font-semibold text-blue-700">Assets</div>
                                    <div className="text-2xl font-bold text-gray-900">₹{totalAssets.toFixed(1)} Cr</div>
                                </div>
                                <div className="mx-6 text-2xl font-bold text-gray-600">=</div>
                                <div className="text-center">
                                    <div className="font-semibold text-green-700">Equity</div>
                                    <div className="text-xl font-bold text-gray-900">₹{totalEquity.toFixed(1)} Cr</div>
                                </div>
                                <div className="mx-4 text-xl font-bold text-gray-600">+</div>
                                <div className="text-center">
                                    <div className="font-semibold text-red-700">Liabilities</div>
                                    <div className="text-xl font-bold text-gray-900">₹{totalLiabilities.toFixed(1)} Cr</div>
                                </div>
                            </div>
                            <div className="mt-3 text-center text-xs text-gray-600">
                                Difference: ₹{Math.abs(totalAssets - totalEquity - totalLiabilities).toFixed(2)} Cr
                            </div>
                        </div>
                    </TabsContent>

                    {/* Assets Tab */}
                    <TabsContent value="assets" className="space-y-6">
                        {/* Asset Breakdown */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Asset Composition</h4>
                                <div className="space-y-3">
                                    {assetComposition.map((asset, index) => {
                                        const percentage = totalAssets > 0 ? (asset.value / totalAssets) * 100 : 0
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${asset.color}`} />
                                                    <span className="text-gray-900">{asset.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900">₹{asset.value.toFixed(1)} Cr</div>
                                                    <div className="text-xs text-gray-600">{percentage.toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Current Assets Breakdown</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-gray-600">Trade Receivables</span>
                                        <span className="font-semibold text-gray-900">₹{tradeReceivables.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-gray-600">Cash & Bank</span>
                                        <span className="font-semibold text-gray-900">₹{cashAndBank.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-gray-600">Inventories</span>
                                        <span className="font-semibold text-gray-900">₹{inventories.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-gray-600">Other Current Assets</span>
                                        <span className="font-semibold text-gray-900">
                                            ₹{Math.max(0, totalCurrentAssets - tradeReceivables - cashAndBank - inventories).toFixed(1)} Cr
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Liabilities Tab */}
                    <TabsContent value="liabilities" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Equity Composition</h4>
                                <div className="space-y-3">
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-gray-600">Share Capital</span>
                                        <span className="font-semibold text-gray-900">₹{shareCapital.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                                        <span className="text-gray-600">Reserves & Surplus</span>
                                        <span className="font-semibold text-gray-900">₹{reservesAndSurplus.toFixed(1)} Cr</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Liabilities Breakdown</h4>
                                <div className="space-y-3">
                                    {liabilityEquityComposition.filter(item => item.name !== 'Equity').map((liability, index) => {
                                        const percentage = totalLiabilities > 0 ? (liability.value / totalLiabilities) * 100 : 0
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-3 h-3 rounded-full ${liability.color}`} />
                                                    <span className="text-gray-900">{liability.name}</span>
                                                </div>
                                                <div className="text-right">
                                                    <div className="font-semibold text-gray-900">₹{liability.value.toFixed(1)} Cr</div>
                                                    <div className="text-xs text-gray-600">{percentage.toFixed(1)}%</div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">5-Year Balance Sheet Trends</h4>

                            {/* Assets Trend Table */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-700">Assets Trend (₹ Crores)</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 text-gray-600">Year</th>
                                                <th className="text-right py-2 text-gray-600">Total Assets</th>
                                                <th className="text-right py-2 text-gray-600">Current Assets</th>
                                                <th className="text-right py-2 text-gray-600">Tangible Assets</th>
                                                <th className="text-right py-2 text-gray-600">Growth %</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {assetsTrend.map((data, index) => {
                                                const prevYear = index > 0 ? assetsTrend[index - 1] : null
                                                const growth = prevYear ? calculateGrowthRate(data.totalAssets, prevYear.totalAssets) : null

                                                return (
                                                    <tr key={data.year} className="border-b border-gray-100">
                                                        <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.totalAssets.toFixed(1)}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.currentAssets.toFixed(1)}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.tangibleAssets.toFixed(1)}</td>
                                                        <td className="text-right py-2">
                                                            {growth !== null ? (
                                                                <span className={growth >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                                    {growth.toFixed(1)}%
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
                            </div>

                            {/* Equity & Liabilities Trend Table */}
                            <div className="space-y-3">
                                <h5 className="text-sm font-medium text-gray-700">Equity & Liabilities Trend (₹ Crores)</h5>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-gray-200">
                                                <th className="text-left py-2 text-gray-600">Year</th>
                                                <th className="text-right py-2 text-gray-600">Total Equity</th>
                                                <th className="text-right py-2 text-gray-600">Current Liabilities</th>
                                                <th className="text-right py-2 text-gray-600">Long-term Debt</th>
                                                <th className="text-right py-2 text-gray-600">Debt/Equity</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {equityLiabilityTrend.map((data) => {
                                                const debtEquity = data.totalEquity > 0 ? data.longTermDebt / data.totalEquity : 0

                                                return (
                                                    <tr key={data.year} className="border-b border-gray-100">
                                                        <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.totalEquity.toFixed(1)}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.totalCurrentLiabilities.toFixed(1)}</td>
                                                        <td className="text-right py-2 text-gray-900">{data.longTermDebt.toFixed(1)}</td>
                                                        <td className="text-right py-2 text-gray-900">{debtEquity.toFixed(2)}</td>
                                                    </tr>
                                                )
                                            })}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Risk Correlation Tab */}
                    <TabsContent value="risk-correlation" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">Balance Sheet Risk Correlation Analysis</h4>

                            {/* Risk Parameter Correlation */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-gray-700">Asset Quality Risk Indicators</h5>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Current Assets Ratio</span>
                                                <span className={`font-semibold ${totalAssets > 0 && (totalCurrentAssets / totalAssets) >= 0.4 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalAssets > 0 ? ((totalCurrentAssets / totalAssets) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {totalAssets > 0 && (totalCurrentAssets / totalAssets) >= 0.4
                                                    ? "Good liquidity position reduces short-term risk"
                                                    : "Low current assets may indicate liquidity risk"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Tangible Asset Coverage</span>
                                                <span className={`font-semibold ${totalAssets > 0 && (tangibleAssets / totalAssets) >= 0.3 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {totalAssets > 0 ? ((tangibleAssets / totalAssets) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Higher tangible assets provide better collateral security
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Cash Position Strength</span>
                                                <span className={`font-semibold ${totalCurrentAssets > 0 && (cashAndBank / totalCurrentAssets) >= 0.15 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalCurrentAssets > 0 ? ((cashAndBank / totalCurrentAssets) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Cash as % of current assets indicates immediate liquidity
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-gray-700">Leverage Risk Indicators</h5>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Debt-to-Assets Ratio</span>
                                                <span className={`font-semibold ${totalAssets > 0 && (totalLiabilities / totalAssets) <= 0.6 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {totalAssets > 0 ? ((totalLiabilities / totalAssets) * 100).toFixed(1) : 0}%
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {totalAssets > 0 && (totalLiabilities / totalAssets) <= 0.6
                                                    ? "Conservative leverage reduces financial risk"
                                                    : "High leverage increases financial risk"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Equity Multiplier</span>
                                                <span className={`font-semibold ${totalEquity > 0 ? 'text-gray-900' : 'text-red-600'}`}>
                                                    {totalEquity > 0 ? (totalAssets / totalEquity).toFixed(2) : 'N/A'}x
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Measures financial leverage and risk amplification
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Working Capital</span>
                                                <span className={`font-semibold ${(totalCurrentAssets - totalCurrentLiabilities) > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    ₹{(totalCurrentAssets - totalCurrentLiabilities).toFixed(1)} Cr
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {(totalCurrentAssets - totalCurrentLiabilities) > 0
                                                    ? "Positive working capital supports operations"
                                                    : "Negative working capital indicates liquidity stress"
                                                }
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Assessment Summary */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    Balance Sheet Risk Assessment
                                </h5>
                                <div className="text-sm text-blue-700">
                                    {(() => {
                                        const debtToAssets = totalAssets > 0 ? (totalLiabilities / totalAssets) : 0
                                        const currentAssetsRatio = totalAssets > 0 ? (totalCurrentAssets / totalAssets) : 0
                                        const workingCapital = totalCurrentAssets - totalCurrentLiabilities

                                        if (debtToAssets <= 0.4 && currentAssetsRatio >= 0.4 && workingCapital > 0) {
                                            return "Strong balance sheet with conservative leverage, good liquidity, and positive working capital. Low financial risk profile."
                                        } else if (debtToAssets <= 0.6 && currentAssetsRatio >= 0.3 && workingCapital >= 0) {
                                            return "Moderate balance sheet strength with acceptable leverage and liquidity levels. Medium financial risk profile."
                                        } else {
                                            return "Balance sheet shows signs of financial stress with high leverage or liquidity concerns. Elevated financial risk profile requiring close monitoring."
                                        }
                                    })()}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}