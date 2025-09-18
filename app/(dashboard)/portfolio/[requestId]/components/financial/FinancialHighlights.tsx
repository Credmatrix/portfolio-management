'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import {
    TrendingUp,
    TrendingDown,
    Building2,
    Calendar,
    IndianRupee,
    Users,
    FileText,
    Award,
    AlertTriangle,
    Info,
    Briefcase,
    History,
    DollarSign,
    Percent,
    Target,
    Clock
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'
import { MSMESupplierPaymentDelays } from "./MSMESupplierPaymentDelays"

interface FinancialHighlightsProps {
    company: PortfolioCompany
}

interface HighlightsData {
    metadata?: {
        reporting_dates?: string[]
        sections_detected?: string[]
    }
    sheet_info?: {
        note?: string
        dimensions?: number[]
        sheet_name?: string
        processor_type?: string
        structure_type?: string
        non_empty_cells?: number
    }
    name_history?: {
        previous_names?: Array<{
            name: string
            till_date: string
        }>
    }
    business_activities?: Array<{
        date?: string
        business_activity_code?: string
        percentage_of_turnover?: string
        main_activity_group_code?: string
        description_of_business_activity?: string
        description_of_main_activity_group?: string
    }>
    financial_parameters?: {
        parameters?: {
            proposed_dividend?: string
            gross_fixed_assets?: string
            number_of_employees?: string
            employee_benefits_expense?: string
            income_in_foreign_currency?: string
            prescribed_csr_expenditure?: string
            expense_in_foreign_currency?: string
            trade_receivables_exceding_six_months?: string
            total_amount_spent_on_csr_for_the_financial_year?: string
            gross_value_of_the_transaction_with_the_related_parties_as_per_as18?: string
        }
        reporting_date?: string
    }
}

interface AnnexureData {
    raw_data?: Array<Record<string, any>>
    sheet_info?: {
        dimensions?: number[]
        sheet_name?: string
        column_names?: any[]
        processor_type?: string
        non_empty_cells?: number
    }
    key_value_pairs?: Record<string, any>
}

export function FinancialHighlights({ company }: FinancialHighlightsProps) {
    const highlightsData: HighlightsData = company.extracted_data?.["Highlights"] || {}
    const annexureData: AnnexureData = company.extracted_data?.["Annexure - Financial Parameters"] || {}

    // Safe data extraction with fallbacks
    const getFinancialParameter = (key: string): string => {
        return highlightsData.financial_parameters?.parameters?.[key] || 'N/A'
    }

    const formatFinancialValue = (value: string): string => {
        if (!value || value === '-' || value === 'N/A') return 'N/A'

        // Check if it's a number
        const numValue = parseFloat(value)
        if (!isNaN(numValue)) {
            return formatCurrency(numValue * 10000000) // Convert crores to actual value
        }

        return value
    }

    const getLatestReportingDate = (): string => {
        return highlightsData.financial_parameters?.reporting_date ||
            highlightsData.metadata?.reporting_dates?.[0] ||
            'N/A'
    }

    const getBusinessActivity = () => {
        return highlightsData.business_activities?.[0] || null
    }

    const getNameHistory = () => {
        return highlightsData.name_history?.previous_names || []
    }

    // Get historical data from annexure
    const getHistoricalData = () => {
        if (!annexureData.raw_data || annexureData.raw_data.length === 0) return null

        const data = annexureData.raw_data
        const headers = data[0] || {}
        const years = Object.keys(headers).slice(1) // Skip first column (parameter names)

        return {
            headers,
            years,
            data: data.slice(1) // Skip header row
        }
    }

    const historicalData = getHistoricalData()

    if (!highlightsData.financial_parameters && !annexureData.raw_data) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Financial Highlights
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>Financial highlights data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Award className="w-5 h-5" />
                        Financial Highlights
                        <Badge variant="outline" className="ml-auto">
                            {getLatestReportingDate()}
                        </Badge>
                    </h3>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                            <TabsTrigger value="overview">Overview</TabsTrigger>
                            <TabsTrigger value="business">Business</TabsTrigger>
                            <TabsTrigger value="history">History</TabsTrigger>
                            <TabsTrigger value="trends">Trends</TabsTrigger>
                        </TabsList>

                        <TabsContent value="overview" className="space-y-6">
                            {/* Key Financial Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <Card className="border-l-4 border-l-blue-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-neutral-60">Gross Fixed Assets</p>
                                                <p className="text-2xl font-bold text-neutral-90">
                                                    {formatFinancialValue(getFinancialParameter('gross_fixed_assets'))}
                                                </p>
                                            </div>
                                            <Building2 className="w-8 h-8 text-blue-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-green-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-neutral-60">Employee Benefits</p>
                                                <p className="text-2xl font-bold text-neutral-90">
                                                    {formatFinancialValue(getFinancialParameter('employee_benefits_expense'))}
                                                </p>
                                            </div>
                                            <Users className="w-8 h-8 text-green-500" />
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="border-l-4 border-l-purple-500">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-neutral-60">CSR Expenditure</p>
                                                <p className="text-2xl font-bold text-neutral-90">
                                                    {formatFinancialValue(getFinancialParameter('prescribed_csr_expenditure'))}
                                                </p>
                                            </div>
                                            <Target className="w-8 h-8 text-purple-500" />
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Additional Metrics */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <Card>
                                    <CardHeader className="pb-3">
                                        <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                            <DollarSign className="w-4 h-4" />
                                            Foreign Currency Transactions
                                        </h4>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-60">Income</span>
                                            <span className="font-medium">
                                                {formatFinancialValue(getFinancialParameter('income_in_foreign_currency'))}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-60">Expense</span>
                                            <span className="font-medium">
                                                {formatFinancialValue(getFinancialParameter('expense_in_foreign_currency'))}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="pb-3">
                                        <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                            <Percent className="w-4 h-4" />
                                            Corporate Governance
                                        </h4>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-60">Proposed Dividend</span>
                                            <Badge variant={getFinancialParameter('proposed_dividend') === 'Yes' ? 'success' : 'secondary'}>
                                                {getFinancialParameter('proposed_dividend')}
                                            </Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-neutral-60">Related Party Transactions</span>
                                            <span className="font-medium">
                                                {formatFinancialValue(getFinancialParameter('gross_value_of_the_transaction_with_the_related_parties_as_per_as18'))}
                                            </span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>

                        <TabsContent value="business" className="space-y-4">
                            {getBusinessActivity() ? (
                                <Card>
                                    <CardHeader>
                                        <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                            <Briefcase className="w-4 h-4" />
                                            Principal Business Activities
                                        </h4>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div>
                                                <p className="text-sm text-neutral-60 mb-1">Activity Group</p>
                                                <p className="font-medium">{getBusinessActivity()?.description_of_main_activity_group || 'N/A'}</p>
                                                <Badge variant="outline" className="mt-1">
                                                    Code: {getBusinessActivity()?.main_activity_group_code || 'N/A'}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm text-neutral-60 mb-1">Turnover Percentage</p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {getBusinessActivity()?.percentage_of_turnover || 'N/A'}%
                                                </p>
                                            </div>
                                        </div>
                                        <div>
                                            <p className="text-sm text-neutral-60 mb-1">Business Description</p>
                                            <p className="text-sm leading-relaxed">
                                                {getBusinessActivity()?.description_of_business_activity || 'N/A'}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-neutral-50">
                                            <Calendar className="w-3 h-3" />
                                            As of {getBusinessActivity()?.date || 'N/A'}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="text-center py-8 text-neutral-60">
                                        <Info className="w-8 h-8 mx-auto mb-2 text-neutral-40" />
                                        <p>Business activity information not available</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="history" className="space-y-4">
                            {getNameHistory().length > 0 ? (
                                <Card>
                                    <CardHeader>
                                        <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                            <History className="w-4 h-4" />
                                            Company Name History
                                        </h4>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-3">
                                            {getNameHistory().map((nameEntry, index) => (
                                                <div key={index} className="flex items-center justify-between p-3 bg-neutral-5 rounded-lg">
                                                    <div>
                                                        <p className="font-medium text-neutral-90">{nameEntry.name}</p>
                                                        <p className="text-sm text-neutral-60">Previous name</p>
                                                    </div>
                                                    <Badge variant="outline">
                                                        Until {nameEntry.till_date}
                                                    </Badge>
                                                </div>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="text-center py-8 text-neutral-60">
                                        <Info className="w-8 h-8 mx-auto mb-2 text-neutral-40" />
                                        <p>No name history changes recorded</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                        <TabsContent value="trends" className="space-y-4">
                            {historicalData ? (
                                <Card>
                                    <CardHeader>
                                        <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                            <TrendingUp className="w-4 h-4" />
                                            Historical Financial Parameters
                                        </h4>
                                        <p className="text-xs text-neutral-50">
                                            Data spans {historicalData.years.length} years
                                        </p>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead>
                                                    <tr className="border-b">
                                                        <th className="text-left py-2 px-3 font-medium text-neutral-70">Parameter</th>
                                                        {historicalData.years.slice(-3).map((year) => (
                                                            <th key={year} className="text-right py-2 px-3 font-medium text-neutral-70">
                                                                {historicalData.headers[year]}
                                                            </th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {historicalData.data.map((row, index) => (
                                                        <tr key={index} className="border-b border-neutral-10">
                                                            <td className="py-2 px-3 text-neutral-90 font-medium">
                                                                {row['0'] || 'N/A'}
                                                            </td>
                                                            {historicalData.years.slice(-3).map((year) => (
                                                                <td key={year} className="py-2 px-3 text-right text-neutral-70">
                                                                    {row[year] || '-'}
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                        {/* {historicalData.data.length > 5 && (
                                            <p className="text-xs text-neutral-50 mt-3 text-center">
                                                Showing 5 of {historicalData.data.length} parameters
                                            </p>
                                        )} */}
                                    </CardContent>
                                </Card>
                            ) : (
                                <Card>
                                    <CardContent className="text-center py-8 text-neutral-60">
                                        <Info className="w-8 h-8 mx-auto mb-2 text-neutral-40" />
                                        <p>Historical trend data not available</p>
                                    </CardContent>
                                </Card>
                            )}
                        </TabsContent>

                    </Tabs>
                </CardContent>
            </Card>
        </div>
    )
}