'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    Calendar,
    TrendingUp,
    IndianRupee,
    FileText,
    Clock,
    Filter,
    Download
} from 'lucide-react'

interface SecuritiesAllotmentTimelineProps {
    company: PortfolioCompany
}

interface Allotment {
    allotment_date: string
    allotment_type: string
    instrument: string
    amount: string
    parsed_date: Date
}

export function SecuritiesAllotmentTimeline({ company }: SecuritiesAllotmentTimelineProps) {
    const [selectedType, setSelectedType] = useState<string>('all')
    const [selectedInstrument, setSelectedInstrument] = useState<string>('all')

    // Parse allotment date
    const parseAllotmentDate = (dateStr: string): Date => {
        try {
            // Handle format "DD MMM, YYYY"
            const cleanDate = dateStr.replace(/,/g, '')
            return new Date(cleanDate)
        } catch {
            return new Date(0) // fallback for invalid dates
        }
    }

    // Extract securities allotment data
    const allotmentsData = useMemo(() => {
        const data = company.extracted_data?.["Securities Allotment"]?.raw_data || []

        return data.map(item => ({
            allotment_date: item["ALLOTMENT DATE"] || "",
            allotment_type: item["ALLOTMENT TYPE"] || "",
            instrument: item["INSTRUMENT"] || "",
            amount: item["AMOUNT (Rs. Crore)"] || "0",
            parsed_date: parseAllotmentDate(item["ALLOTMENT DATE"] || "")
        })).sort((a, b) => b.parsed_date.getTime() - a.parsed_date.getTime()) as Allotment[]
    }, [company.extracted_data])

    // Get unique types and instruments for filters
    const allotmentTypes = useMemo(() => {
        return [...new Set(allotmentsData.map(a => a.allotment_type))].filter(Boolean).sort()
    }, [allotmentsData])

    const instruments = useMemo(() => {
        return [...new Set(allotmentsData.map(a => a.instrument))].filter(Boolean).sort()
    }, [allotmentsData])

    // Filter allotments
    const filteredAllotments = useMemo(() => {
        return allotmentsData.filter(allotment => {
            if (selectedType !== 'all' && allotment.allotment_type !== selectedType) return false
            if (selectedInstrument !== 'all' && allotment.instrument !== selectedInstrument) return false
            return true
        })
    }, [allotmentsData, selectedType, selectedInstrument])

    // Calculate statistics
    const statistics = useMemo(() => {
        const totalAmount = filteredAllotments.reduce((sum, allotment) => {
            const amount = allotment.amount !== '-' ? parseFloat(allotment.amount) : 0
            return sum + amount
        }, 0)

        const typeDistribution = filteredAllotments.reduce((acc, allotment) => {
            acc[allotment.allotment_type] = (acc[allotment.allotment_type] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        const instrumentDistribution = filteredAllotments.reduce((acc, allotment) => {
            acc[allotment.instrument] = (acc[allotment.instrument] || 0) + 1
            return acc
        }, {} as Record<string, number>)

        return {
            totalAmount,
            totalCount: filteredAllotments.length,
            typeDistribution,
            instrumentDistribution
        }
    }, [filteredAllotments])

    const formatAmount = (amount: string) => {
        const numAmount = amount !== '-' ? parseFloat(amount) : 0
        return `₹${numAmount.toFixed(2)} Cr`
    }

    const getTypeColor = (type: string) => {
        const colors = {
            'Rights Issue': 'bg-blue-100 text-blue-800',
            'Bonus Issue': 'bg-green-100 text-green-800',
            'IPO': 'bg-purple-100 text-purple-800',
            'FPO': 'bg-orange-100 text-orange-800',
            'Private Placement': 'bg-teal-100 text-teal-800'
        }
        return colors[type as keyof typeof colors] || 'bg-neutral-10 text-neutral-800'
    }

    const getInstrumentIcon = (instrument: string) => {
        if (instrument.toLowerCase().includes('equity')) return <TrendingUp className="w-4 h-4" />
        if (instrument.toLowerCase().includes('debt')) return <IndianRupee className="w-4 h-4" />
        return <FileText className="w-4 h-4" />
    }

    const formatDate = (date: Date) => {
        if (date.getTime() === 0) return 'Invalid Date'
        return date.toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const getTimelinePosition = (date: Date, allDates: Date[]) => {
        if (allDates.length <= 1) return 50
        const minDate = Math.min(...allDates.map(d => d.getTime()))
        const maxDate = Math.max(...allDates.map(d => d.getTime()))
        const range = maxDate - minDate
        if (range === 0) return 50
        return ((date.getTime() - minDate) / range) * 100
    }

    const allDates = filteredAllotments.map(a => a.parsed_date).filter(d => d.getTime() > 0)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-5 h-5 text-purple-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">
                            Securities Allotment Timeline
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
                            Allotment Type
                        </label>
                        <select
                            value={selectedType}
                            onChange={(e) => setSelectedType(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="all">All Types</option>
                            {allotmentTypes.map(type => (
                                <option key={type} value={type}>{type}</option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="text-sm font-medium text-neutral-70 mb-1 block">
                            Instrument
                        </label>
                        <select
                            value={selectedInstrument}
                            onChange={(e) => setSelectedInstrument(e.target.value)}
                            className="w-full p-2 border border-neutral-20 rounded-lg text-sm"
                        >
                            <option value="all">All Instruments</option>
                            {instruments.map(instrument => (
                                <option key={instrument} value={instrument}>{instrument}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                    <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <FileText className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-700">Total Issues</span>
                        </div>
                        <div className="text-lg font-bold text-purple-800">
                            {statistics.totalCount}
                        </div>
                    </div>

                    <div className="p-3 bg-green-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-700">Total Amount</span>
                        </div>
                        <div className="text-lg font-bold text-green-800">
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

                    <div className="p-3 bg-orange-50 rounded-lg">
                        <div className="flex items-center gap-2 mb-1">
                            <Clock className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-700">Latest Issue</span>
                        </div>
                        <div className="text-sm font-bold text-orange-800">
                            {filteredAllotments.length > 0 ? formatDate(filteredAllotments[0].parsed_date) : 'N/A'}
                        </div>
                    </div>
                </div>
            </CardHeader>

            <CardContent>
                {filteredAllotments.length > 0 ? (
                    <div className="space-y-6">
                        {/* Timeline Visualization */}
                        <div className="relative">
                            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-neutral-200"></div>

                            <div className="space-y-6">
                                {filteredAllotments.map((allotment, index) => (
                                    <div key={index} className="relative flex items-start gap-4">
                                        {/* Timeline dot */}
                                        <div className="relative z-10 w-4 h-4 bg-purple-600 rounded-full border-2 border-white shadow-sm"></div>

                                        {/* Content */}
                                        <div className="flex-1 min-w-0">
                                            <div className="p-4 bg-white border border-neutral-20 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex items-start justify-between mb-3">
                                                    <div className="flex items-start gap-3">
                                                        <div className="p-2 bg-neutral-10 rounded-lg">
                                                            {getInstrumentIcon(allotment.instrument)}
                                                        </div>
                                                        <div>
                                                            <h4 className="font-medium text-neutral-90 mb-1">
                                                                {allotment.instrument}
                                                            </h4>
                                                            <div className="flex items-center gap-2 mb-2">
                                                                <Badge
                                                                    variant="secondary"
                                                                    size="sm"
                                                                    className={getTypeColor(allotment.allotment_type)}
                                                                >
                                                                    {allotment.allotment_type}
                                                                </Badge>
                                                                <span className="text-sm text-neutral-60">
                                                                    {allotment.allotment_date}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-lg font-bold text-green-600">
                                                            {formatAmount(allotment.amount)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-3 gap-4 text-sm text-neutral-60">
                                                    <div>
                                                        <span className="font-medium">Type: </span>
                                                        {allotment.allotment_type}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Instrument: </span>
                                                        {allotment.instrument}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium">Date: </span>
                                                        {allotment.allotment_date}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Distribution Charts */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                            {/* Type Distribution */}
                            <div className="p-4 bg-neutral-5 rounded-lg">
                                <h4 className="font-medium text-neutral-90 mb-3">Distribution by Type</h4>
                                <div className="space-y-2">
                                    {Object.entries(statistics.typeDistribution).map(([type, count]) => (
                                        <div key={type} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-purple-400 rounded"></div>
                                                <span className="text-sm">{type}</span>
                                            </div>
                                            <span className="text-sm font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Instrument Distribution */}
                            <div className="p-4 bg-neutral-5 rounded-lg">
                                <h4 className="font-medium text-neutral-90 mb-3">Distribution by Instrument</h4>
                                <div className="space-y-2">
                                    {Object.entries(statistics.instrumentDistribution).map(([instrument, count]) => (
                                        <div key={instrument} className="flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 bg-green-400 rounded"></div>
                                                <span className="text-sm">{instrument}</span>
                                            </div>
                                            <span className="text-sm font-medium">{count}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-8 text-neutral-60">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>No securities allotment data available for the selected filters</p>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}