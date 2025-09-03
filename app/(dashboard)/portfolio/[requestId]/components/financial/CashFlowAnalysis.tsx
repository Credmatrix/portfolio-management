'use client'

import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    TrendingUp,
    TrendingDown,
    DollarSign,
    ArrowUpDown,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,
    Droplets
} from 'lucide-react'

interface PortfolioCompany {
    extracted_data: {
        [key: string]: any
    }
}

interface CashFlowAnalysisProps {
    company: PortfolioCompany
    industryBenchmarks?: any
}

// Helper function to calculate growth rate
const calculateGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0
    return ((current - previous) / previous) * 100
}

export function CashFlowAnalysis({ company }: CashFlowAnalysisProps) {
    const financialData = company.extracted_data["Standalone Financial Data"]

    if (!financialData?.cash_flow) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Droplets className="w-5 h-5" />
                        Cash Flow Analysis
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-gray-600">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                        <p>Cash flow data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const years = financialData.years || []
    const latestYear = years[years.length - 1]
    const previousYear = years[years.length - 2]
    const cashFlow = financialData.cash_flow

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

    // Cash Flow data - corrected paths
    const operatingCashFlow = getLatestValue(cashFlow.operating_activities?.['net_cash_flows_from_(_used_in_)_operating_activities'])
    
    // Calculate investing cash flow from components
    const incomeFromAssets = getLatestValue(cashFlow.investing_activities?.income_from_assets)
    const cashInflowFromSaleAssets = getLatestValue(cashFlow.investing_activities?.cash_inflow_from_sale_of_assets)
    const cashOutflowPurchaseAssets = getLatestValue(cashFlow.investing_activities?.cash_outflow_from_purchase_of_assets)
    const investingCashFlow = incomeFromAssets + cashInflowFromSaleAssets - cashOutflowPurchaseAssets

    // Calculate financing cash flow from components
    const interestDividendsPaid = getLatestValue(cashFlow.financing_activities?.interest_and_dividends_paid)
    const cashInflowRaisingCapital = getLatestValue(cashFlow.financing_activities?.cash_inflow_from_raising_capital_and_borrowings)
    const cashOutflowRepayment = getLatestValue(cashFlow.financing_activities?.cash_outflow_from_repayment_of_capital_and_borrowings)
    const financingCashFlow = cashInflowRaisingCapital - cashOutflowRepayment - interestDividendsPaid

    // Net cash flow
    const netCashFlow = operatingCashFlow + investingCashFlow + financingCashFlow

    // Get cash positions from balance sheet
    const closingCash = getLatestValue(financialData.balance_sheet?.assets?.current_assets?.cash_and_bank_balances)
    const openingCash = previousYear ? (financialData.balance_sheet?.assets?.current_assets?.cash_and_bank_balances?.[previousYear] || 0) : 0

    // Growth calculations
    const operatingCashFlowGrowth = calculateGrowth(cashFlow.operating_activities?.['net_cash_flows_from_(_used_in_)_operating_activities'])
    const netCashFlowGrowth = netCashFlow !== 0 && previousYear ? 
        calculateGrowthRate(netCashFlow, 
            (cashFlow.operating_activities?.['net_cash_flows_from_(_used_in_)_operating_activities']?.[previousYear] || 0) +
            ((cashFlow.investing_activities?.income_from_assets?.[previousYear] || 0) + 
             (cashFlow.investing_activities?.cash_inflow_from_sale_of_assets?.[previousYear] || 0) - 
             (cashFlow.investing_activities?.cash_outflow_from_purchase_of_assets?.[previousYear] || 0)) +
            ((cashFlow.financing_activities?.cash_inflow_from_raising_capital_and_borrowings?.[previousYear] || 0) - 
             (cashFlow.financing_activities?.cash_outflow_from_repayment_of_capital_and_borrowings?.[previousYear] || 0) - 
             (cashFlow.financing_activities?.interest_and_dividends_paid?.[previousYear] || 0))
        ) : null

    // Get revenue and net income for ratios
    const revenue = getLatestValue(financialData.profit_loss?.revenue?.net_revenue)
    const netIncome = getLatestValue(financialData.profit_loss?.profitability?.profit_for_the_period)

    // Cash flow ratios
    const operatingCashFlowMargin = revenue > 0 ? (operatingCashFlow / revenue) * 100 : 0
    const cashFlowToNetIncome = netIncome > 0 ? operatingCashFlow / netIncome : 0
    const freeCashFlow = operatingCashFlow + investingCashFlow
    const freeCashFlowMargin = revenue > 0 ? (freeCashFlow / revenue) * 100 : 0

    // Multi-year trend data (last 5 years)
    const trendYears = years.slice(-5)
    const cashFlowTrend = trendYears.map(year => {
        const yearOperating = cashFlow.operating_activities?.['net_cash_flows_from_(_used_in_)_operating_activities']?.[year] || 0
        const yearInvesting = (cashFlow.investing_activities?.income_from_assets?.[year] || 0) + 
                             (cashFlow.investing_activities?.cash_inflow_from_sale_of_assets?.[year] || 0) - 
                             (cashFlow.investing_activities?.cash_outflow_from_purchase_of_assets?.[year] || 0)
        const yearFinancing = (cashFlow.financing_activities?.cash_inflow_from_raising_capital_and_borrowings?.[year] || 0) - 
                             (cashFlow.financing_activities?.cash_outflow_from_repayment_of_capital_and_borrowings?.[year] || 0) - 
                             (cashFlow.financing_activities?.interest_and_dividends_paid?.[year] || 0)
        const yearNet = yearOperating + yearInvesting + yearFinancing
        const yearClosing = financialData.balance_sheet?.assets?.current_assets?.cash_and_bank_balances?.[year] || 0

        return {
            year,
            operating: yearOperating,
            investing: yearInvesting,
            financing: yearFinancing,
            net: yearNet,
            closing: yearClosing
        }
    })

    // Cash flow quality assessment
    const getCashFlowQuality = () => {
        if (operatingCashFlow > 0 && operatingCashFlow > netIncome && freeCashFlow > 0) {
            return { status: 'excellent', color: 'text-green-600', icon: CheckCircle, description: 'Strong cash generation with positive free cash flow' }
        }
        if (operatingCashFlow > 0 && operatingCashFlow > netIncome * 0.8) {
            return { status: 'good', color: 'text-blue-600', icon: TrendingUp, description: 'Good cash conversion from earnings' }
        }
        if (operatingCashFlow > 0) {
            return { status: 'moderate', color: 'text-yellow-600', icon: ArrowUpDown, description: 'Positive operating cash flow but below earnings' }
        }
        return { status: 'poor', color: 'text-red-600', icon: XCircle, description: 'Negative operating cash flow indicates liquidity concerns' }
    }

    const cashFlowQuality = getCashFlowQuality()
    const QualityIcon = cashFlowQuality.icon

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

    const formatCashFlow = (amount: number) => {
        const isPositive = amount >= 0
        return (
            <span className={isPositive ? 'text-green-700' : 'text-red-700'}>
                {isPositive ? '+' : ''}₹{amount.toFixed(1)} Cr
            </span>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Droplets className="w-5 h-5" />
                        Cash Flow Analysis
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
                        <TabsTrigger value="components">Components</TabsTrigger>
                        <TabsTrigger value="ratios">Ratios</TabsTrigger>
                        <TabsTrigger value="trends">Trends</TabsTrigger>
                        <TabsTrigger value="risk-implications">Risk Implications</TabsTrigger>
                    </TabsList>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="space-y-6">
                        {/* Key Cash Flow Metrics */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <DollarSign className="w-5 h-5 text-blue-600" />
                                    <div className="text-right">
                                        {formatGrowth(operatingCashFlowGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-blue-900 mb-1">
                                    {formatCashFlow(operatingCashFlow)}
                                </div>
                                <div className="text-sm text-blue-700">Operating Cash Flow</div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <TrendingUp className="w-5 h-5 text-green-600" />
                                    <div className="text-right">
                                        <span className={freeCashFlow >= 0 ? 'text-green-600' : 'text-red-600'}>
                                            {freeCashFlow >= 0 ? 'Positive' : 'Negative'}
                                        </span>
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-green-900 mb-1">
                                    {formatCashFlow(freeCashFlow)}
                                </div>
                                <div className="text-sm text-green-700">Free Cash Flow</div>
                            </div>

                            <div className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg">
                                <div className="flex items-center justify-between mb-2">
                                    <ArrowUpDown className="w-5 h-5 text-purple-600" />
                                    <div className="text-right">
                                        {formatGrowth(netCashFlowGrowth)}
                                    </div>
                                </div>
                                <div className="text-2xl font-bold text-purple-900 mb-1">
                                    {formatCashFlow(netCashFlow)}
                                </div>
                                <div className="text-sm text-purple-700">Net Cash Flow</div>
                            </div>
                        </div>

                        {/* Cash Flow Statement Summary */}
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-gray-900 mb-4">Cash Flow Statement (₹ Crores)</h4>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-blue-500">
                                    <div>
                                        <span className="font-medium text-gray-900">Operating Activities</span>
                                        <div className="text-xs text-gray-600">Cash from core business operations</div>
                                    </div>
                                    <div className="text-right">
                                        {formatCashFlow(operatingCashFlow)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-orange-500">
                                    <div>
                                        <span className="font-medium text-gray-900">Investing Activities</span>
                                        <div className="text-xs text-gray-600">Capital expenditure and investments</div>
                                    </div>
                                    <div className="text-right">
                                        {formatCashFlow(investingCashFlow)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-white rounded border-l-4 border-purple-500">
                                    <div>
                                        <span className="font-medium text-gray-900">Financing Activities</span>
                                        <div className="text-xs text-gray-600">Debt, equity, and dividend transactions</div>
                                    </div>
                                    <div className="text-right">
                                        {formatCashFlow(financingCashFlow)}
                                    </div>
                                </div>

                                <div className="flex items-center justify-between p-3 bg-gray-100 rounded border-2 border-gray-300">
                                    <div>
                                        <span className="font-bold text-gray-900">Net Change in Cash</span>
                                        <div className="text-xs text-gray-600">Total cash flow for the period</div>
                                    </div>
                                    <div className="text-right">
                                        <span className="font-bold text-lg">{formatCashFlow(netCashFlow)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Cash Position */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-blue-900 mb-2">Opening Cash Position</h5>
                                <div className="text-xl font-bold text-blue-900">₹{openingCash.toFixed(1)} Cr</div>
                                <div className="text-sm text-blue-700">Beginning of {latestYear}</div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <h5 className="font-medium text-green-900 mb-2">Closing Cash Position</h5>
                                <div className="text-xl font-bold text-green-900">₹{closingCash.toFixed(1)} Cr</div>
                                <div className="text-sm text-green-700">End of {latestYear}</div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Components Tab */}
                    <TabsContent value="components" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Operating Cash Flow Details */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full" />
                                    Operating Activities
                                </h4>
                                <div className="p-4 bg-blue-50 rounded-lg">
                                    <div className="text-2xl font-bold text-blue-900 mb-2">
                                        {formatCashFlow(operatingCashFlow)}
                                    </div>
                                    <div className="text-sm text-blue-700 mb-3">
                                        Cash generated from core business operations
                                    </div>
                                    <div className="space-y-2 text-xs">
                                        <div className="flex justify-between">
                                            <span className="text-blue-600">vs Net Income:</span>
                                            <span className="font-medium text-blue-900">
                                                {cashFlowToNetIncome.toFixed(2)}x
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-blue-600">% of Revenue:</span>
                                            <span className="font-medium text-blue-900">
                                                {operatingCashFlowMargin.toFixed(1)}%
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Operating components breakdown */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                        <span className="text-blue-700">Profit Before Tax</span>
                                        <span className="text-blue-900">₹{getLatestValue(cashFlow.operating_activities?.profit_before_tax)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                                        <span className="text-blue-700">Adjustments</span>
                                        <span className="text-blue-900">₹{getLatestValue(cashFlow.operating_activities?.adjustment_for_finance_cost_and_depreciation)} Cr</span>
                                    </div>
                                </div>
                            </div>

                            {/* Investing Cash Flow Details */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-orange-500 rounded-full" />
                                    Investing Activities
                                </h4>
                                <div className="p-4 bg-orange-50 rounded-lg">
                                    <div className="text-2xl font-bold text-orange-900 mb-2">
                                        {formatCashFlow(investingCashFlow)}
                                    </div>
                                    <div className="text-sm text-orange-700 mb-3">
                                        Capital expenditure and asset investments
                                    </div>
                                    <div className="text-xs text-orange-600">
                                        {investingCashFlow < 0
                                            ? "Investing in growth and expansion"
                                            : "Asset sales or investment liquidation"
                                        }
                                    </div>
                                </div>

                                {/* Investing components breakdown */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                        <span className="text-orange-700">Asset Sales</span>
                                        <span className="text-orange-900">₹{cashInflowFromSaleAssets.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                        <span className="text-orange-700">Asset Purchases</span>
                                        <span className="text-orange-900">-₹{cashOutflowPurchaseAssets.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                                        <span className="text-orange-700">Income from Assets</span>
                                        <span className="text-orange-900">₹{incomeFromAssets.toFixed(1)} Cr</span>
                                    </div>
                                </div>
                            </div>

                            {/* Financing Cash Flow Details */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                                    <div className="w-3 h-3 bg-purple-500 rounded-full" />
                                    Financing Activities
                                </h4>
                                <div className="p-4 bg-purple-50 rounded-lg">
                                    <div className="text-2xl font-bold text-purple-900 mb-2">
                                        {formatCashFlow(financingCashFlow)}
                                    </div>
                                    <div className="text-sm text-purple-700 mb-3">
                                        Debt, equity, and dividend transactions
                                    </div>
                                    <div className="text-xs text-purple-600">
                                        {financingCashFlow > 0
                                            ? "Raising capital through debt or equity"
                                            : "Repaying debt or returning cash to shareholders"
                                        }
                                    </div>
                                </div>

                                {/* Financing components breakdown */}
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                        <span className="text-purple-700">Capital Raised</span>
                                        <span className="text-purple-900">₹{cashInflowRaisingCapital.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                        <span className="text-purple-700">Debt Repayment</span>
                                        <span className="text-purple-900">-₹{cashOutflowRepayment.toFixed(1)} Cr</span>
                                    </div>
                                    <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                                        <span className="text-purple-700">Interest & Dividends</span>
                                        <span className="text-purple-900">-₹{interestDividendsPaid.toFixed(1)} Cr</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Free Cash Flow Analysis */}
                        <div className="p-4 bg-green-50 rounded-lg">
                            <h4 className="font-medium text-green-900 mb-3 flex items-center gap-2">
                                <BarChart3 className="w-4 h-4" />
                                Free Cash Flow Analysis
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                                <div>
                                    <div className="text-green-600 mb-1">Free Cash Flow</div>
                                    <div className="font-bold text-green-900 text-lg">
                                        {formatCashFlow(freeCashFlow)}
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                        Operating CF + Investing CF
                                    </div>
                                </div>
                                <div>
                                    <div className="text-green-600 mb-1">FCF Margin</div>
                                    <div className="font-bold text-green-900 text-lg">
                                        {freeCashFlowMargin.toFixed(1)}%
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                        Free Cash Flow / Revenue
                                    </div>
                                </div>
                                <div>
                                    <div className="text-green-600 mb-1">Cash Conversion</div>
                                    <div className="font-bold text-green-900 text-lg">
                                        {cashFlowToNetIncome.toFixed(2)}x
                                    </div>
                                    <div className="text-xs text-green-600 mt-1">
                                        Operating CF / Net Income
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Ratios Tab */}
                    <TabsContent value="ratios" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Cash Flow Quality Metrics */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Cash Flow Quality</h4>
                                <div className="space-y-3">
                                    <div className="p-3 bg-gray-50 rounded flex items-center justify-between">
                                        <span className="text-gray-600">Operating CF Margin</span>
                                        <span className="font-semibold text-gray-900">{operatingCashFlowMargin.toFixed(1)}%</span>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded flex items-center justify-between">
                                        <span className="text-gray-600">Cash to Net Income</span>
                                        <span className="font-semibold text-gray-900">{cashFlowToNetIncome.toFixed(2)}x</span>
                                    </div>

                                    <div className="p-3 bg-gray-50 rounded flex items-center justify-between">
                                        <span className="text-gray-600">Free CF Margin</span>
                                        <span className="font-semibold text-gray-900">{freeCashFlowMargin.toFixed(1)}%</span>
                                    </div>
                                </div>
                            </div>

                            {/* Cash Flow Assessment */}
                            <div className="space-y-4">
                                <h4 className="font-medium text-gray-900">Quality Assessment</h4>
                                <div className={`p-4 rounded-lg ${cashFlowQuality.status === 'excellent' ? 'bg-green-50' :
                                    cashFlowQuality.status === 'good' ? 'bg-blue-50' :
                                        cashFlowQuality.status === 'moderate' ? 'bg-yellow-50' : 'bg-red-50'
                                    }`}>
                                    <div className="flex items-center gap-2 mb-2">
                                        <QualityIcon className={`w-5 h-5 ${cashFlowQuality.color}`} />
                                        <span className={`font-medium ${cashFlowQuality.color}`}>
                                            {cashFlowQuality.status.charAt(0).toUpperCase() + cashFlowQuality.status.slice(1)} Quality
                                        </span>
                                    </div>
                                    <div className={`text-sm ${cashFlowQuality.color}`}>
                                        {cashFlowQuality.description}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Liquidity Impact */}
                        <div className="p-4 bg-blue-50 rounded-lg">
                            <h4 className="font-medium text-blue-900 mb-3">Liquidity Impact</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                <div>
                                    <div className="text-blue-600 mb-1">Cash Generation Ability</div>
                                    <div className="text-blue-700">
                                        {operatingCashFlow > 0
                                            ? "Positive operating cash flow supports liquidity and reduces external financing needs."
                                            : "Negative operating cash flow may require external financing to maintain operations."
                                        }
                                    </div>
                                </div>
                                <div>
                                    <div className="text-blue-600 mb-1">Investment Capacity</div>
                                    <div className="text-blue-700">
                                        {freeCashFlow > 0
                                            ? "Positive free cash flow provides capacity for growth investments and debt reduction."
                                            : "Limited free cash flow may constrain growth investments and debt servicing ability."
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Trends Tab */}
                    <TabsContent value="trends" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">5-Year Cash Flow Trends</h4>

                            {/* Cash Flow Trend Table */}
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200">
                                            <th className="text-left py-2 text-gray-600">Year</th>
                                            <th className="text-right py-2 text-gray-600">Operating (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">Investing (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">Financing (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">Net CF (₹Cr)</th>
                                            <th className="text-right py-2 text-gray-600">Closing Cash (₹Cr)</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {cashFlowTrend.map((data) => (
                                            <tr key={data.year} className="border-b border-gray-100">
                                                <td className="py-2 font-medium text-gray-900">{data.year}</td>
                                                <td className="text-right py-2">
                                                    <span className={data.operating >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {data.operating.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="text-right py-2">
                                                    <span className={data.investing >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {data.investing.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="text-right py-2">
                                                    <span className={data.financing >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {data.financing.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="text-right py-2">
                                                    <span className={data.net >= 0 ? 'text-green-600' : 'text-red-600'}>
                                                        {data.net.toFixed(1)}
                                                    </span>
                                                </td>
                                                <td className="text-right py-2 text-gray-900">{data.closing.toFixed(1)}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Cash Flow Pattern Analysis */}
                            <div className="p-4 bg-purple-50 rounded-lg">
                                <h5 className="font-medium text-purple-900 mb-3">Cash Flow Pattern Analysis</h5>
                                <div className="text-sm text-purple-700">
                                    {cashFlowTrend.filter(d => d.operating > 0).length >= 4
                                        ? "Consistent positive operating cash flow demonstrates strong cash generation capability."
                                        : cashFlowTrend.filter(d => d.operating > 0).length >= 2
                                            ? "Mixed operating cash flow pattern - monitor for consistency improvements."
                                            : "Inconsistent operating cash flow indicates potential operational challenges."
                                    }
                                </div>

                                {/* Pattern Summary */}
                                <div className="mt-3 grid grid-cols-3 gap-3 text-xs">
                                    <div className="text-center p-2 bg-white rounded">
                                        <div className="font-semibold text-purple-900">
                                            {cashFlowTrend.filter(d => d.operating > 0).length}/5
                                        </div>
                                        <div className="text-purple-600">Positive OCF Years</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded">
                                        <div className="font-semibold text-purple-900">
                                            {cashFlowTrend.filter(d => d.operating + d.investing > 0).length}/5
                                        </div>
                                        <div className="text-purple-600">Positive FCF Years</div>
                                    </div>
                                    <div className="text-center p-2 bg-white rounded">
                                        <div className="font-semibold text-purple-900">
                                            {cashFlowTrend.filter(d => d.net > 0).length}/5
                                        </div>
                                        <div className="text-purple-600">Cash Increasing Years</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Risk Implications Tab */}
                    <TabsContent value="risk-implications" className="space-y-6">
                        <div className="space-y-6">
                            <h4 className="font-medium text-gray-900">Cash Flow Risk Assessment</h4>

                            {/* Liquidity Risk Analysis */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-gray-700">Liquidity Risk Indicators</h5>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Operating Cash Flow Risk</span>
                                                <span className={`font-semibold ${operatingCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {operatingCashFlow > 0 ? 'Low' : 'High'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {operatingCashFlow > 0
                                                    ? "Positive operating cash flow reduces liquidity risk"
                                                    : "Negative operating cash flow indicates liquidity stress"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Free Cash Flow Risk</span>
                                                <span className={`font-semibold ${freeCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                    {freeCashFlow > 0 ? 'Low' : 'High'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {freeCashFlow > 0
                                                    ? "Positive free cash flow supports debt servicing and growth"
                                                    : "Negative free cash flow may require external financing"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Cash Conversion Quality</span>
                                                <span className={`font-semibold ${cashFlowToNetIncome >= 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {cashFlowToNetIncome >= 1 ? 'High' : 'Moderate'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Operating CF to Net Income ratio: {cashFlowToNetIncome.toFixed(2)}x
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h5 className="text-sm font-medium text-gray-700">Financial Flexibility Risk</h5>
                                    <div className="space-y-3">
                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Investment Capacity</span>
                                                <span className={`font-semibold ${investingCashFlow < 0 && Math.abs(investingCashFlow) <= operatingCashFlow ? 'text-green-600' : 'text-red-600'}`}>
                                                    {investingCashFlow < 0 && Math.abs(investingCashFlow) <= operatingCashFlow ? 'Adequate' : 'Limited'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {investingCashFlow < 0 && Math.abs(investingCashFlow) <= operatingCashFlow
                                                    ? "Operating cash flow covers investment needs"
                                                    : "Investment requirements exceed operating cash generation"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Financing Dependency</span>
                                                <span className={`font-semibold ${financingCashFlow <= 0 ? 'text-green-600' : 'text-yellow-600'}`}>
                                                    {financingCashFlow <= 0 ? 'Low' : 'High'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                {financingCashFlow <= 0
                                                    ? "Self-sufficient or returning cash to stakeholders"
                                                    : "Dependent on external financing"
                                                }
                                            </div>
                                        </div>

                                        <div className="p-3 bg-gray-50 rounded-lg">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-gray-600">Cash Position Trend</span>
                                                <span className={`font-semibold ${closingCash > openingCash ? 'text-green-600' : 'text-red-600'}`}>
                                                    {closingCash > openingCash ? 'Improving' : 'Declining'}
                                                </span>
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Cash change: ₹{(closingCash - openingCash).toFixed(1)} Cr
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Cash Flow Risk Score */}
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h5 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
                                    <BarChart3 className="w-4 h-4" />
                                    Cash Flow Risk Score
                                </h5>
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                                    <div className="text-center">
                                        <div className={`text-2xl font-bold mb-1 ${operatingCashFlow > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {(() => {
                                                let score = 0
                                                if (operatingCashFlow > 0) score += 40
                                                if (freeCashFlow > 0) score += 30
                                                if (cashFlowToNetIncome >= 1) score += 20
                                                if (closingCash > openingCash) score += 10
                                                return score
                                            })()}
                                        </div>
                                        <div className="text-blue-600">Risk Score</div>
                                        <div className="text-xs text-blue-500 mt-1">Out of 100</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-bold mb-1 ${operatingCashFlowMargin >= 10 ? 'text-green-600' : 'text-red-600'}`}>
                                            {operatingCashFlowMargin.toFixed(1)}%
                                        </div>
                                        <div className="text-blue-600">OCF Margin</div>
                                        <div className="text-xs text-blue-500 mt-1">Operating CF / Revenue</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-bold mb-1 ${freeCashFlowMargin >= 5 ? 'text-green-600' : 'text-red-600'}`}>
                                            {freeCashFlowMargin.toFixed(1)}%
                                        </div>
                                        <div className="text-blue-600">FCF Margin</div>
                                        <div className="text-xs text-blue-500 mt-1">Free CF / Revenue</div>
                                    </div>
                                    <div className="text-center">
                                        <div className={`text-lg font-bold mb-1 ${cashFlowToNetIncome >= 1 ? 'text-green-600' : 'text-yellow-600'}`}>
                                            {cashFlowToNetIncome.toFixed(2)}x
                                        </div>
                                        <div className="text-blue-600">CF Quality</div>
                                        <div className="text-xs text-blue-500 mt-1">OCF / Net Income</div>
                                    </div>
                                </div>
                            </div>

                            {/* Risk Mitigation Recommendations */}
                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <h5 className="font-medium text-yellow-900 mb-3">Risk Mitigation Recommendations</h5>
                                <div className="space-y-2 text-sm text-yellow-700">
                                    {operatingCashFlow <= 0 && (
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span>Improve working capital management to enhance operating cash flow generation.</span>
                                        </div>
                                    )}
                                    {freeCashFlow <= 0 && (
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span>Consider optimizing capital expenditure timing to improve free cash flow.</span>
                                        </div>
                                    )}
                                    {cashFlowToNetIncome < 0.8 && (
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span>Focus on improving cash conversion from earnings through better receivables management.</span>
                                        </div>
                                    )}
                                    {financingCashFlow > operatingCashFlow && operatingCashFlow > 0 && (
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span>Reduce dependency on external financing by improving operational cash generation.</span>
                                        </div>
                                    )}
                                    {cashFlowTrend.filter(d => d.operating > 0).length < 3 && (
                                        <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                                            <span>Work on achieving consistent positive operating cash flow to reduce financial risk.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    )
}