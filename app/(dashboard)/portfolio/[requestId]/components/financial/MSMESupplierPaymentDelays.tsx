'use client'

import { PortfolioCompany } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import {
    Clock,
    AlertTriangle,
    TrendingUp,
    Users,
    IndianRupee,
    Calendar,
    Building2,
    Info,
    FileText
} from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

interface MSMESupplierPaymentDelaysProps {
    company: PortfolioCompany
}

interface SupplierDelay {
    pan: string
    _row_index: number
    supplier_name: string
    amount_due_(_rs_inr_): number
    'amount_due_(_rs_inr_)_formatted': string
}

interface PaymentAnalysis {
    payment_trends: Record<string, any>
    risk_assessment: {
        compliance_concern: boolean
        high_amount_suppliers: number
        long_overdue_suppliers: number
        total_high_risk_amount: number
    }
    delay_distribution: {
        '0-30_days': number
        '180+_days': number
        '31-60_days': number
        '61-90_days': number
        '91-180_days': number
    }
    summary_statistics: {
        max_amount_due: number
        min_amount_due: number
        total_suppliers: number
        total_amount_due: number
        median_amount_due: number
        average_amount_due: number
    }
    top_overdue_suppliers: Array<{
        amount_due: number
        days_overdue: number
        supplier_name: string
    }>
}

interface MSMEData {
    sheet_info: {
        note: string
        dimensions: number[]
        sheet_name: string
        processor_type: string
        structure_type: string
        non_empty_cells: number
    }
    period_info: {
        period_to: string
        period_from: string
        report_title: string
        period_description: string
    }
    processor_used: string
    supplier_delays: SupplierDelay[]
    payment_analysis: PaymentAnalysis
    processing_timestamp: string
    total_amount_summary: {
        currency: string
        formatted_amount: string
        total_amount_due: number
    }
}

export function MSMESupplierPaymentDelays({ company }: MSMESupplierPaymentDelaysProps) {
    const msmeData: MSMEData | undefined = company.extracted_data?.["MSME Supplier Payment Delays"]

    if (!msmeData) {
        return (
            <Card>
                <CardHeader>
                    <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                        <Clock className="w-5 h-5" />
                        MSME Supplier Payment Delays
                    </h3>
                </CardHeader>
                <CardContent>
                    <div className="text-center py-8 text-neutral-60">
                        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-neutral-40" />
                        <p>MSME supplier payment delays data not available</p>
                    </div>
                </CardContent>
            </Card>
        )
    }

    const { supplier_delays, payment_analysis, total_amount_summary, period_info } = msmeData

    const getRiskLevel = (amount: number): { level: string; color: string } => {
        if (amount >= 1000000) return { level: 'High', color: 'bg-red-500' }
        if (amount >= 500000) return { level: 'Medium', color: 'bg-yellow-500' }
        return { level: 'Low', color: 'bg-green-500' }
    }

    const getComplianceStatus = (): { status: string; variant: 'success' | 'warning' | 'destructive' } => {
        if (payment_analysis.risk_assessment.compliance_concern) {
            return { status: 'Non-Compliant', variant: 'destructive' }
        }
        if (payment_analysis.risk_assessment.high_amount_suppliers > 5) {
            return { status: 'Attention Required', variant: 'warning' }
        }
        return { status: 'Compliant', variant: 'success' }
    }

    const complianceStatus = getComplianceStatus()

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                            <Clock className="w-5 h-5" />
                            MSME Supplier Payment Delays
                        </h3>
                        <div className="flex items-center gap-2">
                            <Badge variant={complianceStatus.variant}>
                                {complianceStatus.status}
                            </Badge>
                            {period_info.period_description && (
                                <Badge variant="outline">
                                    {period_info.period_description}
                                </Badge>
                            )}
                        </div>
                    </div>
                    {msmeData.sheet_info.note && (
                        <p className="text-sm text-neutral-60 mt-2">{msmeData.sheet_info.note}</p>
                    )}
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Summary Statistics */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card className="border-l-4 border-l-blue-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-60">Total Suppliers</p>
                                        <p className="text-2xl font-bold text-neutral-90">
                                            {payment_analysis.summary_statistics.total_suppliers}
                                        </p>
                                    </div>
                                    <Users className="w-8 h-8 text-blue-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-red-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-60">Total Amount Due</p>
                                        <p className="text-2xl font-bold text-neutral-90">
                                            {formatCurrency(payment_analysis.summary_statistics.total_amount_due)}
                                        </p>
                                    </div>
                                    <IndianRupee className="w-8 h-8 text-red-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-yellow-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-60">High Risk Suppliers</p>
                                        <p className="text-2xl font-bold text-neutral-90">
                                            {payment_analysis.risk_assessment.high_amount_suppliers}
                                        </p>
                                    </div>
                                    <AlertTriangle className="w-8 h-8 text-yellow-500" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="border-l-4 border-l-green-500">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm font-medium text-neutral-60">Average Amount</p>
                                        <p className="text-2xl font-bold text-neutral-90">
                                            {formatCurrency(payment_analysis.summary_statistics.average_amount_due)}
                                        </p>
                                    </div>
                                    <TrendingUp className="w-8 h-8 text-green-500" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Risk Assessment */}
                    <Card>
                        <CardHeader>
                            <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                <AlertTriangle className="w-4 h-4" />
                                Risk Assessment
                            </h4>
                        </CardHeader>
                        <CardContent>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="text-center p-4 bg-neutral-5 rounded-lg">
                                    <p className="text-sm text-neutral-60 mb-1">High Risk Amount</p>
                                    <p className="text-xl font-bold text-red-600">
                                        {formatCurrency(payment_analysis.risk_assessment.total_high_risk_amount)}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-neutral-5 rounded-lg">
                                    <p className="text-sm text-neutral-60 mb-1">Long Overdue</p>
                                    <p className="text-xl font-bold text-orange-600">
                                        {payment_analysis.risk_assessment.long_overdue_suppliers}
                                    </p>
                                </div>
                                <div className="text-center p-4 bg-neutral-5 rounded-lg">
                                    <p className="text-sm text-neutral-60 mb-1">Compliance Status</p>
                                    <Badge variant={complianceStatus.variant} className="text-sm">
                                        {complianceStatus.status}
                                    </Badge>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Overdue Suppliers */}
                    {payment_analysis.top_overdue_suppliers.length > 0 && (
                        <Card>
                            <CardHeader>
                                <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                    <Building2 className="w-4 h-4" />
                                    Top Overdue Suppliers
                                </h4>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {payment_analysis.top_overdue_suppliers.slice(0, 5).map((supplier, index) => {
                                        const risk = getRiskLevel(supplier.amount_due)
                                        return (
                                            <div key={index} className="flex items-center justify-between p-3 bg-neutral-5 rounded-lg">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-3 h-3 rounded-full ${risk.color}`}></div>
                                                    <div>
                                                        <p className="font-medium text-neutral-90">{supplier.supplier_name}</p>
                                                        <p className="text-sm text-neutral-60">Risk Level: {risk.level}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-neutral-90">
                                                        {formatCurrency(supplier.amount_due)}
                                                    </p>
                                                    {supplier.days_overdue > 0 && (
                                                        <p className="text-sm text-red-600">
                                                            {supplier.days_overdue} days overdue
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                </div>
                            </CardContent>
                        </Card>
                    )}

                    {/* Detailed Supplier List */}
                    <Card>
                        <CardHeader>
                            <h4 className="text-sm font-semibold text-neutral-70 flex items-center gap-2">
                                <FileText className="w-4 h-4" />
                                All Suppliers ({supplier_delays.length})
                            </h4>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left py-2 px-3 font-medium text-neutral-70">Supplier Name</th>
                                            <th className="text-left py-2 px-3 font-medium text-neutral-70">PAN</th>
                                            <th className="text-right py-2 px-3 font-medium text-neutral-70">Amount Due</th>
                                            <th className="text-center py-2 px-3 font-medium text-neutral-70">Risk Level</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {supplier_delays.slice(0, 10).map((supplier, index) => {
                                            const risk = getRiskLevel(supplier['amount_due_(_rs_inr_)'])
                                            return (
                                                <tr key={index} className="border-b border-neutral-10 hover:bg-neutral-5">
                                                    <td className="py-2 px-3 text-neutral-90 font-medium">
                                                        {supplier.supplier_name}
                                                    </td>
                                                    <td className="py-2 px-3 text-neutral-70 font-mono text-xs">
                                                        {supplier.pan}
                                                    </td>
                                                    <td className="py-2 px-3 text-right text-neutral-90 font-medium">
                                                        {formatCurrency(supplier['amount_due_(_rs_inr_)'])}
                                                    </td>
                                                    <td className="py-2 px-3 text-center">
                                                        <Badge
                                                            variant={risk.level === 'High' ? 'destructive' : risk.level === 'Medium' ? 'warning' : 'success'}
                                                            className="text-xs"
                                                        >
                                                            {risk.level}
                                                        </Badge>
                                                    </td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                            {supplier_delays.length > 10 && (
                                <div className="mt-4 text-center">
                                    <p className="text-sm text-neutral-60">
                                        Showing 10 of {supplier_delays.length} suppliers
                                    </p>
                                    <button className="text-sm text-blue-600 hover:text-blue-700 mt-1">
                                        View all suppliers
                                    </button>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Processing Information */}
                    <Card className="bg-neutral-5">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-xs text-neutral-60">
                                <Info className="w-3 h-3" />
                                <span>
                                    Processed on {new Date(msmeData.processing_timestamp).toLocaleDateString()}
                                </span>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    )
}