'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import { Button } from '@/components/ui/Button'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    Users,
    AlertTriangle,
    CheckCircle,
    Clock,
    TrendingUp,
    Calendar,
    Building2,
    MapPin,
    Activity,
    CreditCard,
    Info
} from 'lucide-react'

interface EpfoEstablishment {
    establishment_id: string
    establishment_name: string
    city: string
    state: string
    working_status: string
    no_of_employees: number
    principal_business_activities: string
    flags: string
}

interface EpfoPayment {
    establishment_id: string
    wage_month: string
    no_of_employees: number
    amount: number
    payment_due_date: string
    date_of_credit: string
    status: string
    delay_days: number
}

interface EpfoDetailsSectionProps {
    company: PortfolioCompany
}

export function EpfoDetailsSection({ company }: EpfoDetailsSectionProps) {
    const [establishments, setEstablishments] = useState<EpfoEstablishment[]>([])
    const [payments, setPayments] = useState<EpfoPayment[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [selectedEstablishment, setSelectedEstablishment] = useState<string>('all')

    useEffect(() => {
        processEpfoData()
    }, [company])

    const processEpfoData = () => {
        try {
            setLoading(true)
            setError(null)

            const extractedData = company.extracted_data
            if (!extractedData?.['EPFO Establishments'] || !extractedData?.['Annexure - EPFO Establishments']) {
                setError('EPFO data not available')
                return
            }

            const epfoData = extractedData['EPFO Establishments']
            const epfoAnnexureData = extractedData['Annexure - EPFO Establishments']

            if (!epfoData.raw_data || !epfoAnnexureData.raw_data) {
                setError('EPFO raw data not available')
                return
            }

            // Process establishments
            const establishmentsList: EpfoEstablishment[] = []
            epfoData.raw_data.forEach((item: any) => {
                if (item['WORKING STATUS'] === 'LIVE ESTABLISHMENT') {
                    establishmentsList.push({
                        establishment_id: item['ESTABLISHMENT ID'] || '',
                        establishment_name: item['ESTABLISHMENT NAME'] || '',
                        city: item['CITY'] || '',
                        state: item['STATE'] || '',
                        working_status: item['WORKING STATUS'] || '',
                        no_of_employees: parseInt(item['NO. OF EMPLOYEES']?.replace(/,/g, '') || '0') || 0,
                        principal_business_activities: item['PRINCIPAL BUSINESS ACTIVITIES'] || '',
                        flags: item['FLAGS'] || ''
                    })
                }
            })

            // Process payments with consolidation by wage month
            const paymentsByEstablishment: Record<string, Record<string, EpfoPayment>> = {}

            epfoAnnexureData.raw_data.forEach((item: any) => {
                const estId = item['ESTABLISHMENT ID'] || ''
                const wageMonth = item['WAGE MONTH'] || ''

                if (!estId || !wageMonth) return

                // Initialize establishment if not exists
                if (!paymentsByEstablishment[estId]) {
                    paymentsByEstablishment[estId] = {}
                }

                const paymentDate = item['DATE OF CREDIT'] || ''
                const dueDate = item['PAYMENT DUE DATE'] || ''
                const amount = parseFloat(item['AMOUNT (Rs. Crore)']) || 0
                const employees = parseInt(item['NO. OF EMPLOYEES'] ? `${item['NO. OF EMPLOYEES']}`?.replace(/,/g, '') : '0') || 0
                const status = item['STATUS'] || ''

                // Calculate delay days
                const delayDays = calculateDelayDays(paymentDate, dueDate)

                // Consolidate by wage month
                if (!paymentsByEstablishment[estId][wageMonth]) {
                    paymentsByEstablishment[estId][wageMonth] = {
                        establishment_id: estId,
                        wage_month: wageMonth,
                        no_of_employees: 0,
                        amount: 0,
                        payment_due_date: dueDate,
                        date_of_credit: paymentDate,
                        status: delayDays > 0 ? `${delayDays} Days delay` : 'Paid on Time',
                        delay_days: delayDays
                    }
                }

                // Aggregate data
                const existing = paymentsByEstablishment[estId][wageMonth]
                existing.amount += amount
                existing.no_of_employees += employees

                // Update delay if this payment has more delay
                if (delayDays > existing.delay_days) {
                    existing.delay_days = delayDays
                    existing.status = delayDays > 0 ? `${delayDays} Days delay` : 'Paid on Time'
                }
            })

            // Convert to flat array and sort
            const paymentsList: EpfoPayment[] = []
            Object.values(paymentsByEstablishment).forEach(establishmentPayments => {
                Object.values(establishmentPayments).forEach(payment => {
                    paymentsList.push(payment)
                })
            })

            // Sort by wage month (latest first)
            paymentsList.sort((a, b) => {
                const dateA = parseDate(a.wage_month)
                const dateB = parseDate(b.wage_month)
                if (!dateA || !dateB) return 0
                return dateB.getTime() - dateA.getTime()
            })

            setEstablishments(establishmentsList)
            setPayments(paymentsList)

        } catch (err) {
            console.error('Error processing EPFO data:', err)
            setError('Failed to process EPFO data')
        } finally {
            setLoading(false)
        }
    }

    const calculateDelayDays = (paymentDateStr: string, dueDateStr: string): number => {
        if (!paymentDateStr || !dueDateStr) return 0

        try {
            const paymentDate = parseDate(paymentDateStr)
            const dueDate = parseDate(dueDateStr)

            if (paymentDate && dueDate) {
                const diff = paymentDate.getTime() - dueDate.getTime()
                return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
            }
        } catch (error) {
            console.warn('Error calculating delay days:', error)
        }

        return 0
    }

    const parseDate = (dateStr: string): Date | null => {
        if (!dateStr) return null

        try {
            // Clean the date string
            const cleanDateStr = dateStr.trim()

            // Various date formats to try
            const formats = [
                /^(\d{1,2})\s+(\w{3}),?\s+(\d{4})$/,  // 11 Apr, 2025 or 11 Apr 2025
                /^(\d{1,2})-(\w{3})-(\d{4})$/,        // 11-Apr-2025
                /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,    // 11/04/2025
                /^(\d{4})-(\d{1,2})-(\d{1,2})$/,      // 2025-04-11
                /^(\d{1,2})-(\d{1,2})-(\d{4})$/,      // 11-04-2025
                /^(\d{1,2})\.(\d{1,2})\.(\d{4})$/,    // 11.04.2025
            ]

            const monthMap: Record<string, number> = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11,
                'January': 0, 'February': 1, 'March': 2, 'April': 3, 'June': 5,
                'July': 6, 'August': 7, 'September': 8, 'October': 9, 'November': 10, 'December': 11
            }

            // Try format: "11 Apr, 2025" or "11 Apr 2025"
            const match1 = cleanDateStr.match(formats[0])
            if (match1) {
                const day = parseInt(match1[1])
                const month = monthMap[match1[2]]
                const year = parseInt(match1[3])
                if (month !== undefined) {
                    return new Date(year, month, day)
                }
            }

            // Try other formats with direct parsing
            const directFormats = [
                "%d %b, %Y", "%d-%b-%Y", "%d/%m/%Y", "%Y-%m-%d", "%d-%m-%Y", "%d.%m.%Y"
            ]

            // Fallback to native Date parsing
            const nativeDate = new Date(cleanDateStr)
            if (!isNaN(nativeDate.getTime())) {
                return nativeDate
            }

        } catch (error) {
            console.warn('Error parsing date:', dateStr, error)
        }

        return null
    }

    const formatDateForDisplay = (dateStr: string): string => {
        const parsed = parseDate(dateStr)
        if (parsed) {
            return parsed.toLocaleDateString('en-IN', {
                day: '2-digit',
                month: 'short',
                year: 'numeric'
            })
        }
        return dateStr
    }

    const getEstablishmentSummary = () => {
        const totalEmployees = establishments.reduce((sum, est) => sum + est.no_of_employees, 0)
        const totalEstablishments = establishments.length
        const complianceIssues = establishments.filter(est =>
            est.flags.includes('Payment After Due Date')
        ).length

        return {
            totalEstablishments,
            totalEmployees,
            complianceIssues
        }
    }

    const getPaymentSummary = () => {
        const filteredPayments = selectedEstablishment === 'all'
            ? payments
            : payments.filter(p => p.establishment_id === selectedEstablishment)

        const recentPayments = filteredPayments.slice(0, 12) // Last 12 months

        const summary = {
            onTime: 0,
            minorDelay: 0, // 1-15 days
            moderateDelay: 0, // 16-30 days
            significantDelay: 0 // 30+ days
        }

        recentPayments.forEach(payment => {
            if (payment.delay_days === 0) {
                summary.onTime++
            } else if (payment.delay_days <= 15) {
                summary.minorDelay++
            } else if (payment.delay_days <= 30) {
                summary.moderateDelay++
            } else {
                summary.significantDelay++
            }
        })

        return summary
    }

    const getDelayBadgeVariant = (delayDays: number) => {
        if (delayDays === 0) return 'success'
        if (delayDays <= 15) return 'warning'
        if (delayDays <= 30) return 'error'
        return 'error'
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">EPFO Details</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <Skeleton className="w-full h-8" />
                        <Skeleton className="w-full h-32" />
                        <Skeleton className="w-full h-32" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">EPFO Details</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <Alert variant="warning">
                        <AlertTriangle className="w-4 h-4" />
                        <div>
                            <p className="font-medium">EPFO Data Unavailable</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </Alert>
                </CardContent>
            </Card>
        )
    }

    if (establishments.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5" />
                        <h3 className="text-lg font-semibold">EPFO Details</h3>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8">
                        <Users className="w-12 h-12 text-neutral-40 mx-auto mb-4" />
                        <p className="text-neutral-60">No active EPFO establishments found</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const summary = getEstablishmentSummary()
    const paymentSummary = getPaymentSummary()
    const filteredPayments = selectedEstablishment === 'all'
        ? payments.slice(0, 12)
        : payments.filter(p => p.establishment_id === selectedEstablishment).slice(0, 12)

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Users className="w-5 h-5 text-blue-600" />
                        <h3 className="text-lg font-semibold text-neutral-90">
                            EPFO Establishment Details
                        </h3>
                        <Badge variant="info" className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Last 12 Months
                        </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                        <select
                            value={selectedEstablishment}
                            onChange={(e) => setSelectedEstablishment(e.target.value)}
                            className="px-3 py-1 border border-neutral-200 rounded-md text-sm"
                        >
                            <option value="all">All Establishments</option>
                            {establishments.map(est => (
                                <option key={est.establishment_id} value={est.establishment_id}>
                                    {est.establishment_name || est.establishment_id}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-3">
                    <p className="text-sm text-neutral-60">
                        Employee provident fund compliance and payment analysis for active establishments
                    </p>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Building2 className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Establishments</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">{summary.totalEstablishments}</div>
                        <div className="text-xs text-blue-600">Active locations</div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Users className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Total Employees</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{summary.totalEmployees.toLocaleString()}</div>
                        <div className="text-xs text-green-600">Across all establishments</div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Compliance Issues</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-900">{summary.complianceIssues}</div>
                        <div className="text-xs text-yellow-600">Establishments with flags</div>
                    </div>

                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-purple-600" />
                            <span className="text-sm font-medium text-purple-800">On-Time Payments</span>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">{paymentSummary.onTime}</div>
                        <div className="text-xs text-purple-600">Last 12 months</div>
                    </div>
                </div>

                {/* Establishments Overview */}
                <div className="space-y-4">
                    <h4 className="text-md font-semibold text-neutral-90 flex items-center gap-2">
                        <Building2 className="w-4 h-4" />
                        Active Establishments
                    </h4>
                    <div className="overflow-x-auto">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-blue-50 border-b border-blue-200">
                                    <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                        Establishment Details
                                    </th>
                                    <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                        Location
                                    </th>
                                    <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                        Employees
                                    </th>
                                    <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                        Business Activity
                                    </th>
                                    <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                        Status
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {establishments.map((est, index) => (
                                    <tr key={est.establishment_id} className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-5'}>
                                        <td className="border border-neutral-200 p-3">
                                            <div className="font-medium text-neutral-90 mb-1">
                                                {est.establishment_name}
                                            </div>
                                            <div className="text-xs text-neutral-60">
                                                ID: {est.establishment_id}
                                            </div>
                                        </td>
                                        <td className="border border-neutral-200 p-3">
                                            <div className="flex items-center gap-1 text-sm">
                                                <MapPin className="w-3 h-3 text-neutral-50" />
                                                {est.city}, {est.state}
                                            </div>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            <Badge variant="info" size="sm">
                                                {est.no_of_employees.toLocaleString()}
                                            </Badge>
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-sm">
                                            {est.principal_business_activities}
                                        </td>
                                        <td className="border border-neutral-200 p-3 text-center">
                                            {est.flags.includes('Payment After Due Date') ? (
                                                <Badge variant="warning" size="sm">
                                                    <AlertTriangle className="w-3 h-3 mr-1" />
                                                    Delayed Payments
                                                </Badge>
                                            ) : (
                                                <Badge variant="success" size="sm">
                                                    <CheckCircle className="w-3 h-3 mr-1" />
                                                    Compliant
                                                </Badge>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Payment History */}
                <div className="space-y-4">
                    <h4 className="text-md font-semibold text-neutral-90 flex items-center gap-2">
                        <CreditCard className="w-4 h-4" />
                        Recent Payment History
                        {selectedEstablishment !== 'all' && (
                            <Badge variant="info" size="sm">
                                {establishments.find(e => e.establishment_id === selectedEstablishment)?.establishment_name || selectedEstablishment}
                            </Badge>
                        )}
                    </h4>

                    {filteredPayments.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-green-50 border-b border-green-200">
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Wage Month
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                            Employees
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                            Amount (₹ Crore)
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Due Date
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-left font-semibold text-neutral-90">
                                            Payment Date
                                        </th>
                                        <th className="border border-neutral-200 p-3 text-center font-semibold text-neutral-90">
                                            Status
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredPayments.map((payment, index) => (
                                        <tr key={`${payment.establishment_id}-${payment.wage_month}`}
                                            className={index % 2 === 0 ? 'bg-white' : 'bg-neutral-5'}>
                                            <td className="border border-neutral-200 p-3 font-medium">
                                                {payment.wage_month}
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-center">
                                                {payment.no_of_employees.toLocaleString()}
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-center">
                                                {payment.amount.toFixed(2)}
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-sm">
                                                {formatDateForDisplay(payment.payment_due_date)}
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-sm">
                                                {formatDateForDisplay(payment.date_of_credit)}
                                            </td>
                                            <td className="border border-neutral-200 p-3 text-center">
                                                <Badge
                                                    variant={getDelayBadgeVariant(payment.delay_days)}
                                                    size="sm"
                                                >
                                                    {payment.status}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <CreditCard className="w-12 h-12 text-neutral-40 mx-auto mb-4" />
                            <p className="text-neutral-60">No payment history available</p>
                        </div>
                    )}
                </div>

                {/* Payment Summary */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">On Time</span>
                        </div>
                        <div className="text-2xl font-bold text-green-900">{paymentSummary.onTime}</div>
                        <div className="text-xs text-green-600">Paid by due date</div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm font-medium text-yellow-800">Minor Delays</span>
                        </div>
                        <div className="text-2xl font-bold text-yellow-900">{paymentSummary.minorDelay}</div>
                        <div className="text-xs text-yellow-600">1-15 days late</div>
                    </div>

                    <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-4 h-4 text-orange-600" />
                            <span className="text-sm font-medium text-orange-800">Moderate Delays</span>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">{paymentSummary.moderateDelay}</div>
                        <div className="text-xs text-orange-600">16-30 days late</div>
                    </div>

                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-red-600" />
                            <span className="text-sm font-medium text-red-800">Significant Delays</span>
                        </div>
                        <div className="text-2xl font-bold text-red-900">{paymentSummary.significantDelay}</div>
                        <div className="text-xs text-red-600">30+ days late</div>
                    </div>
                </div>

                {/* Information Note */}
                <div className="p-3 bg-neutral-5 rounded-lg">
                    <p className="text-xs text-neutral-60">
                        <strong>Note:</strong> Payment analysis based on consolidated wage month data for last 12 months.
                        EPFO compliance is critical for employee welfare and regulatory adherence.
                        Delays in PF payments can result in penalties and impact employee trust.
                    </p>
                </div>
            </CardContent>
        </Card>
    )
}