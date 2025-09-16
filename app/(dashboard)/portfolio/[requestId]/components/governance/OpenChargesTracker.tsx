'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    Shield,
    AlertTriangle,
    TrendingUp,
    Calendar,
    Building2,
    IndianRupee,
    Filter,
    Download,
    Clock
} from 'lucide-react'

interface OpenChargesTrackerProps {
    company: PortfolioCompany
}

interface Charge {
    charge_id: string
    date: string
    holder_name: string
    amount: string
    status: string
    parsed_date: Date
}

export function OpenChargesTracker({ company }: OpenChargesTrackerProps) {
    const [selectedStatus, setSelectedStatus] = useState<string>('all')
    const [selectedTimeframe, setSelectedTimeframe] = useState<string>('1year')

    // Parse charge date
    const parseChargeDate = (dateStr: string): Date => {
        try {
            // Handle format "DD MMM, YYYY"
            const cleanDate = dateStr.replace(/,/g, '')
            return new Date(cleanDate)
        } catch {
            return new Date(0) // fallback for invalid dates
        }
    }

    // Extract open charges data
    const chargesData = useMemo(() => {
        const data = company.extracted_data?.["Open Charges Sequence"]?.raw_data || []

        const charges = data
            .filter(item => item["STATUS"] === "Creation" || item["STATUS"] === "Modification")
            .map(item => ({
                charge_id: item["CHARGE ID"] || "",
                date: item["DATE"] || "",
                holder_name: item["HOLDER NAME"] || "",
                amount: item["CHARGE AMOUNT (Rs. Crore)"] || "0",
                status: item["STATUS"] || "",
                parsed_date: parseChargeDate(item["DATE"] || "")
            }))

        // Group by charge ID and keep only the latest charge for each ID
        const chargeMap = new Map<string, Charge>()
        charges.forEach(charge => {
            const existing = chargeMap.get(charge.charge_id)
            if (!existing || charge.parsed_date > existing.parsed_date) {
                chargeMap.set(charge.charge_id, charge)
            }
        })

        return Array.from(chargeMap.values()).sort((a, b) => b.parsed_date.getTime() - a.parsed_date.getTime())
    }, [company.extracted_data])

    // Filter charges based on timeframe
    const filteredCharges = useMemo(() => {
        const now = new Date()
        let cutoffDate = new Date(0)

        switch (selectedTimeframe) {
            case '6months':
                cutoffDate = new Date(now.getTime() - 6 * 30 * 24 * 60 * 60 * 1000)
                break
            case '1year':
                cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000)
                break
            case '2years':
                cutoffDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000)
                break
            case 'all':
                cutoffDate = new Date(0)
                break
        }

        return chargesData.filter(charge => {
            if (selectedStatus !== 'all' && charge.status !== selectedStatus) return false
            if (charge.parsed_date < cutoffDate) return false
            return true
        })
    }, [chargesData, selectedStatus, selectedTimeframe])

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalAmount = filteredCharges.reduce((sum, charge) => {
            const amount = charge.amount !== '-' ? parseFloat(charge.amount) : 0
            return sum + amount
        }, 0)

        const statusDistribution = filteredCharges.reduce((acc, charge) => {
            acc[charge.status] = (acc[charge.status] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const holderDistribution = filteredCharges.reduce((acc, charge) => {
            acc[charge.holder_name] = (acc[charge.holder_name] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const recentCharges = filteredCharges.filter(charge => {
            const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
            return charge.parsed_date >= thirtyDaysAgo
        }).length

        return {
            totalAmount,
            totalCount: filteredCharges.length,
            statusDistribution,
            holderDistribution,
            recentCharges
        }
    }, [filteredCharges])

    const formatAmount = (amount: string) => {
        const numAmount = amount !== '-' ? parseFloat(amount) : 0
        return `₹${numAmount.toFixed(2)} Cr`
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'creation': return 'bg-green-100 text-green-800'
            case 'modification': return 'bg-blue-100 text-blue-800'
            case 'satisfaction': return 'bg-purple-100 text-purple-800'
            default: return 'bg-neutral-100 text-neutral-800'
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'creation': return <TrendingUp className="w-4 h-4" />
            case 'modification': return <Shield className="w-4 h-4" />
            case 'satisfaction': return <Shield className="w-4 h-4" />
            default: return <AlertTriangle className="w-4 h-4" />
        }
    }

    const formatDate = (date: Date) => {
        if (date.getTime() === 0) return 'Invalid Date'
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const getRiskLevel = (amount: number) => {
        if (amount > 100) return { level: 'High', color: 'text-red-600', bg: 'bg-red-50' }
        if (amount > 50) return { level: 'Medium', color: 'text-orange-600', bg: 'bg-orange-50' }
        return { level: 'Low', color: 'text-green-600', bg: 'bg-green-50' }
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Shield className="w-5 h-5 text-orange-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">
                            Open Charges Tracker
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            Status
                        </label>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="all">All Status</option>
                            <option value="Creation">Creation</option>
                            <option value="Modification">Modification</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            Timeframe
                        </label>
                        <select
                            value={selectedTimeframe}
                            onChange={(e) => setSelectedTimeframe(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="6months">Last 6 Months</option>
                            <option value="1year">Last 1 Year</option>
                            <option value="2years">Last 2 Years</option>
                            <option value="all">All Time</option>
                        </select>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Shield className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-700">Total Charges</span>
                        </div>
                        <div className="text-lg font-bold text-orange-800">
                            {statistics.totalCount}
                        </div>
                    </div>

                    <div className="p-3 bg-red-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <IndianRupee className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-700">Total Amount</span>
                        </div>
                        <div className="text-lg font-bold text-red-800">
                            ₹{statistics.totalAmount.toFixed(2)} Cr
                        </div>
                    </div>

                    <div className="p-3 bg-blue-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <TrendingUp className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-700">Avg Amount</span>
                        </div>
                        <div className="text-lg font-bold text-blue-800">
                            ₹{statistics.totalCount > 0 ? (statistics.totalAmount / statistics.totalCount).toFixed(2) : '0'} Cr
                        </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Recent (30d)</span>
                        </div>
                        <div className="text-lg font-bold text-green-800">
                            {statistics.recentCharges}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {filteredCharges.length > 0 ? (
                    <div className="space-y-6">
                        {/* Charges List */}
                        <div className="space-y-3">
                            {filteredCharges.slice(0, 15).map((charge, index) => {
                                const amount = charge.amount !== '-' ? parseFloat(charge.amount) : 0
                                const risk = getRiskLevel(amount)

                                return (
                                    <div
                                        key={index}
                                        className="p-4 border border-neutral-20 rounded-lg hover:bg-neutral-5 transition-colors"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-start gap-3">
                                                <div className="p-2 bg-neutral-10 rounded-lg">
                                                    {getStatusIcon(charge.status)}
                                                </div>
                                                <div>
                                                    <h4 className="font-medium text-neutral-90 mb-1">
                                                        Charge ID: {charge.charge_id}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <Badge
                                                            variant="secondary"
                                                            size="sm"
                                                            className={getStatusColor(charge.status)}
                                                        >
                                                            {charge.status}
                                                        </Badge>
                                                        <Badge
                                                            variant="outline"
                                                            size="sm"
                                                            className={`${risk.color} ${risk.bg}`}
                                                        >
                                                            {risk.level} Risk
                                                        </Badge>
                                                    </div>
                                                    <div className="text-sm text-neutral-60">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <Building2 className="w-3 h-3" />
                                                            <span>{charge.holder_name}</span>
                                                        </div>
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>{charge.date}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <div className="text-lg font-bold text-red-600">
                                                    {formatAmount(charge.amount)}
                                                </div>
                                                <div className="text-xs text-neutral-60">
                                                    {formatDate(charge.parsed_date)}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}

                            {filteredCharges.length > 15 && (
                                <div className="text-center py-4">
                                    <Button variant="outline" size="sm">
                                        View All {filteredCharges.length} Charges
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* Distribution Analysis */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {/* Status Distribution */}
                            <div className="p-4 bg-neutral-5 rounded-lg">
                                <h4 className="font-medium text-neutral-90 mb-3">Status Distribution</h4>
                                <div className="space-y-2">
                                    {Object.entries(statistics.statusDistribution).map(([status, count]) => (
                                        <div key={status} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-orange-400 rounded"></div>
                                                <span className="text-sm">{status}</span>
                                            </div>
                                            <span className="text-sm font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Top Holders */}
                            <div className="p-4 bg-neutral-5 rounded-lg">
                                <h4 className="font-medium text-neutral-90 mb-3">Top Charge Holders</h4>
                                <div className="space-y-2">
                                    {Object.entries(statistics.holderDistribution)
                                        .sort(([, a], [, b]) => b - a)
                                        .slice(0, 5)
                                        .map(([holder, count]) => (
                                            <div key={holder} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-3 h-3 bg-red-400 rounded"></div>
                                                    <span className="text-sm truncate max-w-32">{holder}</span>
                                                </div>
                                                <span className="text-sm font-medium">{count}</span>
                                            </div>
                                        ))}
                                </div>
                            </div>
                        </div>

                        {/* Risk Assessment */}
                        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-yellow-800 mb-1">Risk Assessment</h4>
                                    <p className="text-sm text-yellow-700">
                                        Total secured debt exposure: <strong>₹{statistics.totalAmount.toFixed(2)} Crores</strong>
                                        {statistics.totalAmount > 100 && (
                                            <span className="block mt-1">
                                                ⚠️ High exposure detected. Monitor charge satisfaction and modifications closely.
                                            </span>
                                        )}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-neutral-60">
                        <Shield className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>No open charges data available for the selected filters</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}