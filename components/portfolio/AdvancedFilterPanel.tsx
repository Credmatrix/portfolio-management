// components/portfolio/AdvancedFilterPanel.tsx
'use client'

import { useState } from 'react'
import { FilterCriteria } from '@/types/portfolio.types'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface AdvancedFilterPanelProps {
    filters: FilterCriteria
    onFilterChange: (filters: FilterCriteria) => void
    className?: string
}

export function AdvancedFilterPanel({ filters, onFilterChange, className = '' }: AdvancedFilterPanelProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const handleFilterUpdate = (key: keyof FilterCriteria, value: any) => {
        onFilterChange({ ...filters, [key]: value })
    }

    const handleMultiSelectUpdate = (key: keyof FilterCriteria, value: string, checked: boolean) => {
        const currentValues = (filters[key] as string[]) || []
        const newValues = checked
            ? [...currentValues, value]
            : currentValues.filter(v => v !== value)

        handleFilterUpdate(key, newValues.length > 0 ? newValues : undefined)
    }

    const clearBusinessFilters = () => {
        const clearedFilters = { ...filters }
        delete clearedFilters.industries
        delete clearedFilters.regions
        delete clearedFilters.revenue_range
        delete clearedFilters.employee_range
        delete clearedFilters.ebitda_margin_range
        delete clearedFilters.debt_equity_range
        delete clearedFilters.current_ratio_range
        delete clearedFilters.gst_compliance_status
        delete clearedFilters.epfo_compliance_status
        delete clearedFilters.audit_qualification_status
        delete clearedFilters.eligibility_range
        delete clearedFilters.recommended_limit_range
        delete clearedFilters.processing_status
        delete clearedFilters.date_range
        onFilterChange(clearedFilters)
    }

    const activeBusinessFilterCount = [
        filters.industries?.length || 0,
        filters.regions?.length || 0,
        filters.revenue_range ? 1 : 0,
        filters.employee_range ? 1 : 0,
        filters.ebitda_margin_range ? 1 : 0,
        filters.debt_equity_range ? 1 : 0,
        filters.current_ratio_range ? 1 : 0,
        filters.gst_compliance_status?.length || 0,
        filters.epfo_compliance_status?.length || 0,
        filters.audit_qualification_status?.length || 0,
        filters.eligibility_range ? 1 : 0,
        filters.recommended_limit_range ? 1 : 0,
        filters.processing_status?.length || 0,
        filters.date_range ? 1 : 0
    ].reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0)

    const industries = [
        'Manufacturing', 'Services', 'Technology', 'Construction', 'Trading',
        'Healthcare', 'Education', 'Real Estate', 'Agriculture', 'Financial Services',
        'Textiles', 'Pharmaceuticals', 'Automotive', 'Food & Beverages', 'Chemicals',
        'Energy', 'Transportation', 'Retail', 'Telecommunications', 'Mining'
    ]

    const regions = [
        'Maharashtra', 'Karnataka', 'Tamil Nadu', 'Gujarat', 'Delhi',
        'Uttar Pradesh', 'West Bengal', 'Rajasthan', 'Andhra Pradesh', 'Telangana',
        'Kerala', 'Punjab', 'Haryana', 'Madhya Pradesh', 'Bihar',
        'Odisha', 'Assam', 'Jharkhand', 'Chhattisgarh', 'Uttarakhand'
    ]

    return (
        <Card className={`p-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-90">Business Filters</h3>
                <div className="flex items-center gap-2">
                    {activeBusinessFilterCount > 0 && (
                        <Badge variant="secondary" className="text-xs">
                            {activeBusinessFilterCount} active
                        </Badge>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExpanded(!isExpanded)}
                    >
                        {isExpanded ? 'Collapse' : 'Expand'}
                    </Button>
                </div>
            </div>

            {/* Quick Business Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                    <label className="block text-sm font-medium text-neutral-70 mb-2">
                        Industry
                    </label>
                    <Select
                        value={filters.industries?.[0] || ''}
                        onChange={(value) => handleFilterUpdate('industries', value ? [value] : undefined)}
                        placeholder="Select industry"
                    >
                        <option value="">All Industries</option>
                        {industries.map(industry => (
                            <option key={industry} value={industry}>{industry}</option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-70 mb-2">
                        Region
                    </label>
                    <Select
                        value={filters.regions?.[0] || ''}
                        onChange={(value) => handleFilterUpdate('regions', value ? [value] : undefined)}
                        placeholder="Select region"
                    >
                        <option value="">All Regions</option>
                        {regions.map(region => (
                            <option key={region} value={region}>{region}</option>
                        ))}
                    </Select>
                </div>

                <div>
                    <label className="block text-sm font-medium text-neutral-70 mb-2">
                        Processing Status
                    </label>
                    <Select
                        value={filters.processing_status?.[0] || ''}
                        onChange={(value) => handleFilterUpdate('processing_status', value ? [value] : undefined)}
                        placeholder="Select status"
                    >
                        <option value="">All Status</option>
                        <option value="completed">Completed</option>
                        <option value="processing">Processing</option>
                        <option value="submitted">Submitted</option>
                        <option value="failed">Failed</option>
                    </Select>
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-6 border-t border-neutral-30 pt-4">
                    {/* Multiple Industry Selection */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Industries (Multiple Selection)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {industries.map(industry => (
                                <Checkbox
                                    key={industry}
                                    id={`industry-${industry}`}
                                    checked={filters.industries?.includes(industry) || false}
                                    onChange={(checked) => handleMultiSelectUpdate('industries', industry, checked)}
                                    label={industry}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Multiple Region Selection */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Regions (Multiple Selection)
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 max-h-40 overflow-y-auto">
                            {regions.map(region => (
                                <Checkbox
                                    key={region}
                                    id={`region-${region}`}
                                    checked={filters.regions?.includes(region) || false}
                                    onChange={(checked) => handleMultiSelectUpdate('regions', region, checked)}
                                    label={region}
                                />
                            ))}
                        </div>
                    </div>

                    {/* Financial Ranges */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Revenue Range (₹ Cr)
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    min="0"
                                    value={filters.revenue_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseFloat(e.target.value) : undefined
                                        const max = filters.revenue_range?.[1]
                                        handleFilterUpdate('revenue_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10000] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    min="0"
                                    value={filters.revenue_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseFloat(e.target.value) : undefined
                                        const min = filters.revenue_range?.[0]
                                        handleFilterUpdate('revenue_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10000] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Employee Range
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    min="0"
                                    value={filters.employee_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseInt(e.target.value) : undefined
                                        const max = filters.employee_range?.[1]
                                        handleFilterUpdate('employee_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10000] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    min="0"
                                    value={filters.employee_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseInt(e.target.value) : undefined
                                        const min = filters.employee_range?.[0]
                                        handleFilterUpdate('employee_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10000] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financial Ratios */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                EBITDA Margin Range (%)
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    value={filters.ebitda_margin_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseFloat(e.target.value) : undefined
                                        const max = filters.ebitda_margin_range?.[1]
                                        handleFilterUpdate('ebitda_margin_range',
                                            min !== undefined || max !== undefined ? [min || -50, max || 100] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    value={filters.ebitda_margin_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseFloat(e.target.value) : undefined
                                        const min = filters.ebitda_margin_range?.[0]
                                        handleFilterUpdate('ebitda_margin_range',
                                            min !== undefined || max !== undefined ? [min || -50, max || 100] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Debt-to-Equity Range
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    step="0.1"
                                    value={filters.debt_equity_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseFloat(e.target.value) : undefined
                                        const max = filters.debt_equity_range?.[1]
                                        handleFilterUpdate('debt_equity_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    step="0.1"
                                    value={filters.debt_equity_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseFloat(e.target.value) : undefined
                                        const min = filters.debt_equity_range?.[0]
                                        handleFilterUpdate('debt_equity_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Current Ratio Range
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    step="0.1"
                                    value={filters.current_ratio_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseFloat(e.target.value) : undefined
                                        const max = filters.current_ratio_range?.[1]
                                        handleFilterUpdate('current_ratio_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    step="0.1"
                                    value={filters.current_ratio_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseFloat(e.target.value) : undefined
                                        const min = filters.current_ratio_range?.[0]
                                        handleFilterUpdate('current_ratio_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 10] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Compliance Status */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                GST Compliance
                            </label>
                            <div className="space-y-2">
                                {['Regular', 'Irregular', 'Unknown'].map(status => (
                                    <Checkbox
                                        key={status}
                                        id={`gst-${status}`}
                                        checked={filters.gst_compliance_status?.includes(status) || false}
                                        onChange={(checked) => handleMultiSelectUpdate('gst_compliance_status', status, checked)}
                                        label={status}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                EPFO Compliance
                            </label>
                            <div className="space-y-2">
                                {['Regular', 'Irregular', 'Unknown'].map(status => (
                                    <Checkbox
                                        key={status}
                                        id={`epfo-${status}`}
                                        checked={filters.epfo_compliance_status?.includes(status) || false}
                                        onChange={(checked) => handleMultiSelectUpdate('epfo_compliance_status', status, checked)}
                                        label={status}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Audit Status
                            </label>
                            <div className="space-y-2">
                                {['Qualified', 'Unqualified', 'Unknown'].map(status => (
                                    <Checkbox
                                        key={status}
                                        id={`audit-${status}`}
                                        checked={filters.audit_qualification_status?.includes(status) || false}
                                        onChange={(checked) => handleMultiSelectUpdate('audit_qualification_status', status, checked)}
                                        label={status}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Credit Assessment */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Eligibility Range (₹ Cr)
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    min="0"
                                    value={filters.eligibility_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseFloat(e.target.value) : undefined
                                        const max = filters.eligibility_range?.[1]
                                        handleFilterUpdate('eligibility_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 1000] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    min="0"
                                    value={filters.eligibility_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseFloat(e.target.value) : undefined
                                        const min = filters.eligibility_range?.[0]
                                        handleFilterUpdate('eligibility_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 1000] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Recommended Limit Range (₹ Cr)
                            </label>
                            <div className="flex gap-2 items-center">
                                <Input
                                    type="number"
                                    placeholder="Min"
                                    min="0"
                                    value={filters.recommended_limit_range?.[0] || ''}
                                    onChange={(e) => {
                                        const min = e.target.value ? parseFloat(e.target.value) : undefined
                                        const max = filters.recommended_limit_range?.[1]
                                        handleFilterUpdate('recommended_limit_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 1000] : undefined
                                        )
                                    }}
                                />
                                <span className="text-neutral-60">to</span>
                                <Input
                                    type="number"
                                    placeholder="Max"
                                    min="0"
                                    value={filters.recommended_limit_range?.[1] || ''}
                                    onChange={(e) => {
                                        const max = e.target.value ? parseFloat(e.target.value) : undefined
                                        const min = filters.recommended_limit_range?.[0]
                                        handleFilterUpdate('recommended_limit_range',
                                            min !== undefined || max !== undefined ? [min || 0, max || 1000] : undefined
                                        )
                                    }}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Date Range */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Processing Date Range
                        </label>
                        <div className="flex gap-2 items-center">
                            <Input
                                type="date"
                                value={filters.date_range?.[0]?.toISOString().split('T')[0] || ''}
                                onChange={(e) => {
                                    const startDate = e.target.value ? new Date(e.target.value) : undefined
                                    const endDate = filters.date_range?.[1]
                                    handleFilterUpdate('date_range',
                                        startDate || endDate ? [startDate || new Date(), endDate || new Date()] : undefined
                                    )
                                }}
                            />
                            <span className="text-neutral-60">to</span>
                            <Input
                                type="date"
                                value={filters.date_range?.[1]?.toISOString().split('T')[0] || ''}
                                onChange={(e) => {
                                    const endDate = e.target.value ? new Date(e.target.value) : undefined
                                    const startDate = filters.date_range?.[0]
                                    handleFilterUpdate('date_range',
                                        startDate || endDate ? [startDate || new Date(), endDate || new Date()] : undefined
                                    )
                                }}
                            />
                        </div>
                    </div>

                    {/* Clear Business Filters */}
                    {activeBusinessFilterCount > 0 && (
                        <div className="pt-2">
                            <Button variant="outline" size="sm" onClick={clearBusinessFilters}>
                                Clear Business Filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}