'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { CreditManagement, CreditManagementFormData } from '@/types/credit-management.types'
import {
    CreditCard,
    Shield,
    Calendar,
    FileText,
    Phone,
    IndianRupee,
    Edit,
    Save,
    X,
    AlertCircle,
    CheckCircle,
    TrendingUp,
    Clock,
    Users
} from 'lucide-react'

interface CreditManagementSectionProps {
    requestId: string
}

export function CreditManagementSection({ requestId }: CreditManagementSectionProps) {
    const [creditData, setCreditData] = useState<CreditManagement | null>(null)
    const [isEditing, setIsEditing] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [formData, setFormData] = useState<CreditManagementFormData>({})

    useEffect(() => {
        fetchCreditData()
    }, [requestId])

    const fetchCreditData = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const response = await fetch(`/api/portfolio/${requestId}/credit-management`)
            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to fetch credit management data')
            }

            setCreditData(result.data)
            if (result.data) {
                setFormData(result.data)
            }
        } catch (err) {
            console.error('Error fetching credit data:', err)
            setError(err instanceof Error ? err.message : 'Failed to load credit data')
        } finally {
            setIsLoading(false)
        }
    }

    const handleSave = async () => {
        try {
            setIsSaving(true)
            setError(null)

            const response = await fetch(`/api/portfolio/${requestId}/credit-management`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(formData)
            })

            const result = await response.json()

            if (!response.ok) {
                throw new Error(result.error || 'Failed to save credit management data')
            }

            setCreditData(result.data)
            setIsEditing(false)
        } catch (err) {
            console.error('Error saving credit data:', err)
            setError(err instanceof Error ? err.message : 'Failed to save credit data')
        } finally {
            setIsSaving(false)
        }
    }

    const handleCancel = () => {
        if (creditData) {
            setFormData(creditData)
        } else {
            setFormData({})
        }
        setIsEditing(false)
        setError(null)
    }

    const formatCurrency = (amount?: number) => {
        if (!amount) return 'Not set'
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount)
    }

    const formatDate = (dateString?: string) => {
        if (!dateString) return 'Not set'
        return new Date(dateString).toLocaleDateString('en-IN')
    }

    if (isLoading) {
        return (
            <div className="relative backdrop-blur-xl bg-white/70 border border-gray-200/50 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30"></div>
                <div className="relative p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <h2 className="text-2xl font-semibold text-gray-900">Credit Management</h2>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="animate-pulse space-y-4">
                            <div className="h-4 bg-gray-200/70 rounded-full w-3/4"></div>
                            <div className="h-4 bg-gray-200/70 rounded-full w-1/2"></div>
                            <div className="h-4 bg-gray-200/70 rounded-full w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="relative backdrop-blur-xl bg-white/70 border border-gray-200/50 rounded-2xl shadow-2xl shadow-blue-500/10 overflow-hidden transition-all duration-300 hover:shadow-blue-500/15">
            {/* Background gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-purple-50/30"></div>

            {/* Content */}
            <div className="relative">
                {/* Header */}
                <div className="p-8 border-b border-gray-200/30 backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg transform hover:scale-105 transition-transform duration-200">
                                <CreditCard className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900 mb-1">Credit Management</h2>
                                <p className="text-sm text-gray-600">Comprehensive credit portfolio oversight</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            {!isEditing ? (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsEditing(true)}
                                    className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border-blue-200 hover:bg-blue-50/80 hover:border-blue-300 transition-all duration-200 rounded-xl"
                                >
                                    <Edit className="w-4 h-4" />
                                    {creditData ? 'Edit Details' : 'Add Details'}
                                </Button>
                            ) : (
                                <div className="flex items-center gap-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleCancel}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border-gray-200 hover:bg-gray-50/80 transition-all duration-200 rounded-xl"
                                    >
                                        <X className="w-4 h-4" />
                                        Cancel
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white transition-all duration-200 rounded-xl shadow-lg hover:shadow-xl"
                                    >
                                        <Save className="w-4 h-4" />
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>

                    {error && (
                        <div className="mt-4 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="w-5 h-5 text-red-500" />
                                <span className="text-red-700 font-medium">{error}</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Content Grid */}
                <div className="p-8 space-y-8">
                    {/* Credit Approval Details */}
                    <div className="backdrop-blur-sm bg-white/60 border border-gray-200/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg">
                                <IndianRupee className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Credit Approval Details</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Credit Type
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.credit_type || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            credit_type: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                    >
                                        <option value="">Select credit type</option>
                                        <option value="SECURED">Secured</option>
                                        <option value="UNSECURED">Unsecured</option>
                                        <option value="SECURED_UNSECURED">Secured + Unsecured</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-indigo-50/50 rounded-xl">
                                        <Badge className="bg-indigo-100 text-indigo-800 border-indigo-200">
                                            {creditData?.credit_type || 'Not set'}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Actual Credit Limit Approved
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={formData.actual_credit_limit_approved || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            actual_credit_limit_approved: e.target.value ? Number(e.target.value) : undefined
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        placeholder="Enter approved limit"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-green-50/50 rounded-xl">
                                        <TrendingUp className="w-4 h-4 text-green-600" />
                                        <span className="text-lg font-semibold text-green-800">
                                            {formatCurrency(creditData?.actual_credit_limit_approved)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Credit Limit Validity
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={formData.actual_credit_limit_approved_validity || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            actual_credit_limit_approved_validity: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-green-50/50 rounded-xl">
                                        <Calendar className="w-4 h-4 text-green-600" />
                                        <span className="font-medium text-green-800">
                                            {formatDate(creditData?.actual_credit_limit_approved_validity)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ad Hoc Limit
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={formData.ad_hoc_limit || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            ad_hoc_limit: e.target.value ? Number(e.target.value) : undefined
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        placeholder="Enter ad hoc limit"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl">
                                        <span className="text-lg font-semibold text-blue-800">
                                            {formatCurrency(creditData?.ad_hoc_limit)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Ad Hoc Limit Validity
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={formData.ad_hoc_limit_validity_date || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            ad_hoc_limit_validity_date: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-blue-50/50 rounded-xl">
                                        <Calendar className="w-4 h-4 text-blue-600" />
                                        <span className="font-medium text-blue-800">
                                            {formatDate(creditData?.ad_hoc_limit_validity_date)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Payment Terms
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.payment_terms || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            payment_terms: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        placeholder="e.g., Net 30 days"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-purple-50/50 rounded-xl">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        <span className="font-medium text-purple-800">
                                            {creditData?.payment_terms || 'Not set'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Repayment Type
                                </label>
                                {isEditing ? (
                                    <select
                                        value={formData.repayment || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            repayment: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                    >
                                        <option value="">Select repayment type</option>
                                        <option value="MONTHLY">Monthly</option>
                                        <option value="QUARTERLY">Quarterly</option>
                                        <option value="HALF_YEARLY">Half Yearly</option>
                                        <option value="YEARLY">Yearly</option>
                                        <option value="BULLET">Bullet Payment</option>
                                        <option value="ON_DEMAND">On Demand</option>
                                    </select>
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-orange-50/50 rounded-xl">
                                        <Badge className="bg-orange-100 text-orange-800 border-orange-200">
                                            {creditData?.repayment || 'Not set'}
                                        </Badge>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Limit Validity Date
                                </label>
                                {isEditing ? (
                                    <input
                                        type="date"
                                        value={formData.limit_validity_date || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            limit_validity_date: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                    />
                                ) : (
                                    <div className="flex items-center gap-2 p-3 bg-amber-50/50 rounded-xl">
                                        <Calendar className="w-4 h-4 text-amber-600" />
                                        <span className="font-medium text-amber-800">
                                            {formatDate(creditData?.limit_validity_date)}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-6 space-y-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Security Requirements
                            </label>
                            {isEditing ? (
                                <select
                                    value={formData.security_requirements || ''}
                                    onChange={(e) => setFormData({
                                        ...formData,
                                        security_requirements: e.target.value
                                    })}
                                    className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                >
                                    <option value="">Select security requirement</option>
                                    <option value="UNSECURED">Unsecured</option>
                                    <option value="PERSONAL_GUARANTEE">Personal Guarantee</option>
                                    <option value="CORPORATE_GUARANTEE">Corporate Guarantee</option>
                                    <option value="COLLATERAL_SECURITY">Collateral Security</option>
                                    <option value="HYPOTHECATION">Hypothecation</option>
                                    <option value="MORTGAGE">Mortgage</option>
                                    <option value="PLEDGE">Pledge</option>
                                    <option value="LIEN">Lien</option>
                                </select>
                            ) : (
                                <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200/40">
                                    <Badge className="bg-slate-100 text-slate-800 border-slate-200">
                                        {creditData?.security_requirements || 'No security requirements specified'}
                                    </Badge>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Two-column layout for remaining sections */}
                    <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
                        {/* Insurance Coverage */}
                        <div className="backdrop-blur-sm bg-white/60 border border-gray-200/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                                    <Shield className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Insurance Coverage</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Insurance Cover Amount
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={formData.insurance_cover || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                insurance_cover: e.target.value ? Number(e.target.value) : undefined
                                            })}
                                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                            placeholder="Enter insurance amount"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-xl">
                                            <span className="text-lg font-semibold text-emerald-800">
                                                {formatCurrency(creditData?.insurance_cover)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Insurance Coverage Requested
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="number"
                                            value={formData.insurance_coverage_requested_amount || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                insurance_coverage_requested_amount: e.target.value ? Number(e.target.value) : undefined
                                            })}
                                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                            placeholder="Enter requested amount"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-teal-50/50 rounded-xl">
                                            <span className="text-lg font-semibold text-teal-800">
                                                {formatCurrency(creditData?.insurance_coverage_requested_amount)}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Insurance Validity
                                    </label>
                                    {isEditing ? (
                                        <input
                                            type="date"
                                            value={formData.insurance_validity || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                insurance_validity: e.target.value
                                            })}
                                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 p-3 bg-emerald-50/50 rounded-xl">
                                            <Calendar className="w-4 h-4 text-emerald-600" />
                                            <span className="font-medium text-emerald-800">
                                                {formatDate(creditData?.insurance_validity)}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Insurance Remarks
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.insurance_remarks || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            insurance_remarks: e.target.value
                                        })}
                                        rows={3}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 resize-none"
                                        placeholder="Insurance coverage details and remarks..."
                                    />
                                ) : (
                                    <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200/40">
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {creditData?.insurance_remarks || 'No insurance remarks'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* LPI Management */}
                        <div className="backdrop-blur-sm bg-white/60 border border-gray-200/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                                    <FileText className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">LPI Management</h3>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        LPI Required
                                    </label>
                                    {isEditing ? (
                                        <div className="flex items-center gap-4">
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="lpi"
                                                    checked={formData.lpi === true}
                                                    onChange={() => setFormData({
                                                        ...formData,
                                                        lpi: true
                                                    })}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">Yes</span>
                                            </label>
                                            <label className="flex items-center gap-2">
                                                <input
                                                    type="radio"
                                                    name="lpi"
                                                    checked={formData.lpi === false}
                                                    onChange={() => setFormData({
                                                        ...formData,
                                                        lpi: false
                                                    })}
                                                    className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                                                />
                                                <span className="text-sm text-gray-700">No</span>
                                            </label>
                                        </div>
                                    ) : (
                                        <div className="p-3 bg-violet-50/50 rounded-xl">
                                            <Badge className={`${creditData?.lpi ? 'bg-green-100 text-green-800 border-green-200' : 'bg-gray-100 text-gray-800 border-gray-200'}`}>
                                                {creditData?.lpi ? 'Required' : 'Not Required'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        LPI Received Status
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.lpi_received || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                lpi_received: e.target.value
                                            })}
                                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        >
                                            <option value="NA">Not Applicable</option>
                                            <option value="Yes">Yes</option>
                                            <option value="No">No</option>
                                        </select>
                                    ) : (
                                        <div className="p-3 bg-purple-50/50 rounded-xl">
                                            <Badge className={`${creditData?.lpi_received === 'Yes' ? 'bg-green-100 text-green-800 border-green-200' :
                                                creditData?.lpi_received === 'No' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}>
                                                {creditData?.lpi_received || 'NA'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Collection Feedback */}
                        <div className="backdrop-blur-sm bg-white/60 border border-gray-200/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg">
                                    <Phone className="w-5 h-5 text-white" />
                                </div>
                                <h3 className="text-lg font-semibold text-gray-900">Collection Management</h3>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Collection Feedback
                                    </label>
                                    {isEditing ? (
                                        <select
                                            value={formData.collection_feedback || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                collection_feedback: e.target.value
                                            })}
                                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        >
                                            <option value="">Select feedback type</option>
                                            <option value="EXCELLENT">Excellent</option>
                                            <option value="GOOD">Good</option>
                                            <option value="AVERAGE">Average</option>
                                            <option value="POOR">Poor</option>
                                            <option value="DEFAULTER">Defaulter</option>
                                        </select>
                                    ) : (
                                        <div className="p-3 bg-orange-50/50 rounded-xl">
                                            <Badge className={`${creditData?.collection_feedback === 'Good' ? 'bg-green-100 text-green-800 border-green-200' :
                                                creditData?.collection_feedback === 'OK' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                    creditData?.collection_feedback === 'Bad' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                                                        creditData?.collection_feedback === 'No-Go' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                            creditData?.collection_feedback === 'Credit Call' ? 'bg-red-100 text-red-800 border-red-200' :
                                                                'bg-gray-100 text-gray-800 border-gray-200'
                                                }`}>
                                                {creditData?.collection_feedback || 'Not set'}
                                            </Badge>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Collection Remarks
                                    </label>
                                    {isEditing ? (
                                        <textarea
                                            value={formData.collection_remarks || ''}
                                            onChange={(e) => setFormData({
                                                ...formData,
                                                collection_remarks: e.target.value
                                            })}
                                            rows={2}
                                            className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 resize-none"
                                            placeholder="Additional collection remarks..."
                                        />
                                    ) : (
                                        <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200/40">
                                            <p className="text-gray-800 text-sm leading-relaxed">
                                                {creditData?.collection_remarks || 'No additional remarks'}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ERP Integration and Analytics */}
                    <div className="backdrop-blur-sm bg-white/60 border border-gray-200/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg">
                                <TrendingUp className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">ERP Analytics & Performance</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    AR Values
                                </label>
                                {isEditing ? (
                                    <input
                                        type="number"
                                        value={formData.ar_values || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            ar_values: e.target.value ? Number(e.target.value) : undefined
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        placeholder="Enter AR values"
                                    />
                                ) : (
                                    <div className="p-3 bg-indigo-50/50 rounded-xl">
                                        <span className="text-lg font-semibold text-indigo-800">
                                            {formatCurrency(creditData?.ar_values)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    DPD Behavior
                                </label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={formData.dpd_behavior || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            dpd_behavior: e.target.value
                                        })}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200"
                                        placeholder="e.g., 0-30 days"
                                    />
                                ) : (
                                    <div className="p-3 bg-purple-50/50 rounded-xl">
                                        {creditData?.dpd_behavior ? (
                                            <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                                                {creditData.dpd_behavior}
                                            </Badge>
                                        ) : (
                                            <span className="text-gray-600">Not set</span>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    AR Remarks
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.ar_remarks || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            ar_remarks: e.target.value
                                        })}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 resize-none"
                                        placeholder="AR related observations..."
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-200/40 min-h-[80px]">
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {creditData?.ar_remarks || 'No AR remarks'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    DPD Remarks
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.dpd_remarks || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            dpd_remarks: e.target.value
                                        })}
                                        rows={2}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 resize-none"
                                        placeholder="DPD performance notes..."
                                    />
                                ) : (
                                    <div className="p-3 bg-gray-50/60 rounded-xl border border-gray-200/40 min-h-[80px]">
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {creditData?.dpd_remarks || 'No DPD remarks'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Case Documentation */}
                    <div className="backdrop-blur-sm bg-white/60 border border-gray-200/40 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 bg-gradient-to-br from-slate-500 to-gray-600 rounded-lg">
                                <FileText className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">Case Documentation & Notes</h3>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    General Remarks
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.general_remarks || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            general_remarks: e.target.value
                                        })}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 resize-none"
                                        placeholder="General observations and remarks..."
                                    />
                                ) : (
                                    <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200/40 min-h-[120px]">
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {creditData?.general_remarks || 'No general remarks recorded'}
                                        </p>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label className="block text-sm font-medium text-gray-700">
                                    Case Specific Notes
                                </label>
                                {isEditing ? (
                                    <textarea
                                        value={formData.case_notes || ''}
                                        onChange={(e) => setFormData({
                                            ...formData,
                                            case_notes: e.target.value
                                        })}
                                        rows={4}
                                        className="w-full px-4 py-3 bg-white/80 backdrop-blur-sm border border-gray-200/60 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-300 transition-all duration-200 resize-none"
                                        placeholder="Detailed case notes and observations..."
                                    />
                                ) : (
                                    <div className="p-4 bg-gray-50/60 rounded-xl border border-gray-200/40 min-h-[120px]">
                                        <p className="text-gray-800 text-sm leading-relaxed">
                                            {creditData?.case_notes || 'No case notes recorded'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Last Updated Info */}
                    {creditData && (
                        <div className="flex items-center justify-between pt-6 border-t border-gray-200/30">
                            <div className="flex items-center gap-2 text-gray-600">
                                <Users className="w-4 h-4" />
                                <span className="text-sm">
                                    Last updated: {new Date(creditData.updated_at).toLocaleString('en-IN')}
                                </span>
                            </div>

                            {creditData.actual_credit_limit_approved && (
                                <div className="flex items-center gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                    <span className="text-sm text-green-700 font-medium">Credit Approved</span>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}