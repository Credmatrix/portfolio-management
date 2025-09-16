'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/Tabs'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    ArrowRightLeft,
    TrendingUp,
    TrendingDown,
    IndianRupee,
    Filter,
    Download,
    Eye,
    Users,
    Building2
} from 'lucide-react'

interface RelatedPartyTransactionsMatrixProps {
    company: PortfolioCompany
}

interface Transaction {
    amount: string
    entity_name: string
    entity_type: string
    relationship: string
    transaction_type: string
    financial_year_ending_on: string
}

interface TransactionSummary {
    entity_name: string
    entity_type: string
    relationship: string
    total_revenue: number
    total_expense: number
    total_others: number
    net_amount: number
    transaction_count: number
}

export function RelatedPartyTransactionsMatrix({ company }: RelatedPartyTransactionsMatrixProps) {
    const [selectedYear, setSelectedYear] = useState<string>('31 Mar, 2024')
    const [selectedEntityType, setSelectedEntityType] = useState<string>('all')
    const [selectedTransactionType, setSelectedTransactionType] = useState<string>('all')
    const [viewMode, setViewMode] = useState<'summary' | 'detailed'>('summary')

    // Extract transactions data
    const transactionsData = useMemo(() => {
        const data = company.extracted_data?.["Related Party Transactions"]?.data || []
        return data.map(item => ({
            amount: item.amount || "0",
            entity_name: item.entity_name || "",
            entity_type: item.entity_type || "",
            relationship: item.relationship || "",
            transaction_type: item.transaction_type || "",
            financial_year_ending_on: item.financial_year_ending_on || ""
        })) as Transaction[]
    }, [company.extracted_data])

    // Get available years
    const availableYears = useMemo(() => {
        const years = [...new Set(transactionsData.map(t => t.financial_year_ending_on))]
        return years.sort().reverse()
    }, [transactionsData])

    // Filter transactions
    const filteredTransactions = useMemo(() => {
        return transactionsData.filter(transaction => {
            if (selectedYear !== 'all' && transaction.financial_year_ending_on !== selectedYear) return false
            if (selectedEntityType !== 'all' && transaction.entity_type !== selectedEntityType) return false
            if (selectedTransactionType !== 'all' && transaction.transaction_type !== selectedTransactionType) return false
            return true
        })
    }, [transactionsData, selectedYear, selectedEntityType, selectedTransactionType])

    // Create transaction summary
    const transactionSummary = useMemo(() => {
        const summaryMap = new Map<string, TransactionSummary>()

        filteredTransactions.forEach(transaction => {
            const key = transaction.entity_name
            const amount = parseFloat(transaction.amount.replace(/[^\d.-]/g, '')) || 0

            if (!summaryMap.has(key)) {
                summaryMap.set(key, {
                    entity_name: transaction.entity_name,
                    entity_type: transaction.entity_type,
                    relationship: transaction.relationship,
                    total_revenue: 0,
                    total_expense: 0,
                    total_others: 0,
                    net_amount: 0,
                    transaction_count: 0
                })
            }

            const summary = summaryMap.get(key)!
            summary.transaction_count++

            switch (transaction.transaction_type.toLowerCase()) {
                case 'revenue':
                    summary.total_revenue += amount
                    break
                case 'expense':
                    summary.total_expense += amount
                    break
                default:
                    summary.total_others += amount
            }

            summary.net_amount = summary.total_revenue - summary.total_expense + summary.total_others
        })

        return Array.from(summaryMap.values()).sort((a, b) => Math.abs(b.net_amount) - Math.abs(a.net_amount))
    }, [filteredTransactions])

    // Get entity types and transaction types for filters
    const entityTypes = useMemo(() => {
        return [...new Set(transactionsData.map(t => t.entity_type))].sort()
    }, [transactionsData])

    const transactionTypes = useMemo(() => {
        return [...new Set(transactionsData.map(t => t.transaction_type))].sort()
    }, [transactionsData])

    const formatAmount = (amount: number) => {
        if (amount === 0) return '₹0'
        if (Math.abs(amount) >= 10000000) return `₹${(amount / 10000000).toFixed(2)}Cr`
        if (Math.abs(amount) >= 100000) return `₹${(amount / 100000).toFixed(2)}L`
        return `₹${amount.toFixed(2)}`
    }

    const getEntityIcon = (entityType: string) => {
        switch (entityType.toLowerCase()) {
            case 'company': return <Building2 className="w-4 h-4" />
            case 'individuals': return <Users className="w-4 h-4" />
            default: return <IndianRupee className="w-4 h-4" />
        }
    }

    const getRelationshipColor = (relationship: string) => {
        if (relationship.toLowerCase().includes('subsidiary')) return 'bg-purple-100 text-purple-800'
        if (relationship.toLowerCase().includes('associate')) return 'bg-orange-100 text-orange-800'
        if (relationship.toLowerCase().includes('joint venture')) return 'bg-teal-100 text-teal-800'
        if (relationship.toLowerCase().includes('key management')) return 'bg-blue-100 text-blue-800'
        return 'bg-neutral-100 text-neutral-800'
    }

    // Calculate totals
    const totals = useMemo(() => {
        return transactionSummary.reduce((acc, summary) => {
            acc.revenue += summary.total_revenue
            acc.expense += summary.total_expense
            acc.others += summary.total_others
            acc.net += summary.net_amount
            return acc
        }, { revenue: 0, expense: 0, others: 0, net: 0 })
    }, [transactionSummary])

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <ArrowRightLeft className="w-5 h-5 text-green-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">
                            Related Party Transactions
                        </h3>
                    </div>
                    {/* <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm">
                            <Download className="w-4 h-4 mr-2" />
                            Export
                        </Button>
                    </div> */}
                </div>

                {/* Filters */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            Financial Year
                        </label>
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="all">All Years</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            Entity Type
                        </label>
                        <select
                            value={selectedEntityType}
                            onChange={(e) => setSelectedEntityType(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="all">All Types</option>
                            {entityTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            Transaction Type
                        </label>
                        <select
                            value={selectedTransactionType}
                            onChange={(e) => setSelectedTransactionType(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="all">All Transactions</option>
                            {transactionTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            View Mode
                        </label>
                        <select
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as 'summary' | 'detailed')}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="summary">Summary View</option>
                            <option value="detailed">Detailed View</option>
                        </select>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Revenue</span>
                        </div>
                        <div className="text-lg font-bold text-green-800">
                            {formatAmount(totals.revenue)}
                        </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingDown className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Expense</span>
                        </div>
                        <div className="text-lg font-bold text-red-800">
                            {formatAmount(totals.expense)}
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <IndianRupee className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">Others</span>
                        </div>
                        <div className="text-lg font-bold text-blue-800">
                            {formatAmount(totals.others)}
                        </div>
                    </div>

                    <div className="p-3 bg-neutral-10 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <ArrowRightLeft className="w-4 h-4 text-neutral-600" />
                            <span className="text-sm font-medium text-neutral-70">Net Amount</span>
                        </div>
                        <div className={`text-lg font-bold ${totals.net >= 0 ? 'text-green-800' : 'text-red-800'}`}>
                            {formatAmount(totals.net)}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {viewMode === 'summary' ? (
                    <div className="space-y-3">
                        {transactionSummary.length > 0 ? (
                            transactionSummary.map((summary, index) => (
                                <div
                                    key={index}
                                    className="p-4 border border-neutral-20 rounded-lg hover:bg-neutral-5 transition-colors"
                                >
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-start gap-3">
                                            <div className="p-2 bg-neutral-10 rounded-lg">
                                                {getEntityIcon(summary.entity_type)}
                                            </div>
                                            <div>
                                                <h4 className="font-medium text-neutral-90 mb-1">
                                                    {summary.entity_name}
                                                </h4>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Badge
                                                        variant="secondary"
                                                        size="sm"
                                                        className={getRelationshipColor(summary.relationship)}
                                                    >
                                                        {summary.relationship}
                                                    </Badge>
                                                    <Badge variant="outline" size="sm">
                                                        {summary.entity_type}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-lg font-bold ${summary.net_amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {formatAmount(summary.net_amount)}
                                            </div>
                                            <div className="text-xs text-neutral-60">
                                                {summary.transaction_count} transactions
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span className="text-neutral-60">Revenue: </span>
                                            <span className="font-medium text-green-600">
                                                {formatAmount(summary.total_revenue)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-60">Expense: </span>
                                            <span className="font-medium text-red-600">
                                                {formatAmount(summary.total_expense)}
                                            </span>
                                        </div>
                                        <div>
                                            <span className="text-neutral-60">Others: </span>
                                            <span className="font-medium text-blue-600">
                                                {formatAmount(summary.total_others)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-neutral-60">
                                <ArrowRightLeft className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                                <p>No related party transactions found for the selected filters</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-neutral-20">
                                    <th className="text-left p-3 font-medium text-neutral-70">Entity</th>
                                    <th className="text-left p-3 font-medium text-neutral-70">Type</th>
                                    <th className="text-left p-3 font-medium text-neutral-70">Relationship</th>
                                    <th className="text-left p-3 font-medium text-neutral-70">Transaction</th>
                                    <th className="text-right p-3 font-medium text-neutral-70">Amount</th>
                                    <th className="text-left p-3 font-medium text-neutral-70">Year</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.map((transaction, index) => (
                                    <tr key={index} className="border-b border-neutral-10 hover:bg-neutral-5">
                                        <td className="p-3">
                                            <div className="flex items-center gap-2">
                                                {getEntityIcon(transaction.entity_type)}
                                                <span className="font-medium">{transaction.entity_name}</span>
                                            </div>
                                        </td>
                                        <td className="p-3">
                                            <Badge variant="outline" size="sm">
                                                {transaction.entity_type}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            <Badge
                                                variant="secondary"
                                                size="sm"
                                                className={getRelationshipColor(transaction.relationship)}
                                            >
                                                {transaction.relationship}
                                            </Badge>
                                        </td>
                                        <td className="p-3">
                                            <Badge
                                                variant={
                                                    transaction.transaction_type === 'Revenue' ? 'success' :
                                                        transaction.transaction_type === 'Expense' ? 'error' : 'info'
                                                }
                                                size="sm"
                                            >
                                                {transaction.transaction_type}
                                            </Badge>
                                        </td>
                                        <td className="p-3 text-right font-medium">
                                            {transaction.amount === '****' ? '****' : formatAmount(parseFloat(transaction.amount.replace(/[^\d.-]/g, '')) || 0)}
                                        </td>
                                        <td className="p-3 text-neutral-60">
                                            {transaction.financial_year_ending_on}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}