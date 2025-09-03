// components/portfolio/RiskFilterPanel.tsx
'use client'

import { useState } from 'react'
import { FilterCriteria } from '@/types/portfolio.types'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'

interface RiskFilterPanelProps {
    filters: FilterCriteria
    onFilterChange: (filters: FilterCriteria) => void
    className?: string
}

export function RiskFilterPanel({ filters, onFilterChange, className = '' }: RiskFilterPanelProps) {
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

    const clearRiskFilters = () => {
        const clearedFilters = { ...filters }
        delete clearedFilters.risk_grades
        delete clearedFilters.risk_score_range
        delete clearedFilters.overall_grade_categories
        onFilterChange(clearedFilters)
    }

    const activeRiskFilterCount = [
        filters.risk_grades?.length || 0,
        filters.risk_score_range ? 1 : 0,
        filters.overall_grade_categories?.length || 0
    ].reduce((sum, count) => sum + (count > 0 ? 1 : 0), 0)

    const riskGrades = [
        { value: 'CM1', label: 'CM1 - Excellent', color: 'bg-green-100 text-green-800' },
        { value: 'CM2', label: 'CM2 - Good', color: 'bg-blue-100 text-blue-800' },
        { value: 'CM3', label: 'CM3 - Average', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'CM4', label: 'CM4 - Poor', color: 'bg-orange-100 text-orange-800' },
        { value: 'CM5', label: 'CM5 - Critical', color: 'bg-red-100 text-red-800' }
    ]

    const parameterBenchmarks = [
        'Excellent',
        'Good',
        'Average',
        'Poor',
        'Critical Risk'
    ]

    return (
        <Card className={`p-4 ${className}`}>
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-neutral-90">Risk Filters</h3>
                <div className="flex items-center gap-2">
                    {activeRiskFilterCount > 0 && (
                        <Badge variant="primary" className="text-xs">
                            {activeRiskFilterCount} active
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

            {/* Quick Risk Grade Filter */}
            <div className="mb-4">
                <label className="block text-sm font-medium text-neutral-70 mb-2">
                    Risk Grades
                </label>
                <div className="flex flex-wrap gap-2">
                    {riskGrades.map(grade => (
                        <label
                            key={grade.value}
                            className={`
                inline-flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors
                ${filters.risk_grades?.includes(grade.value)
                                    ? 'border-blue-500 bg-blue-50'
                                    : 'border-neutral-30 hover:border-neutral-40'
                                }
              `}
                        >
                            <Checkbox
                                id={`risk-grade-${grade.value}`}
                                checked={filters.risk_grades?.includes(grade.value) || false}
                                onChange={(checked) => handleMultiSelectUpdate('risk_grades', grade.value, checked)}
                                className="mr-2"
                            />
                            <span className={`text-xs px-2 py-1 rounded ${grade.color}`}>
                                {grade.value}
                            </span>
                            <span className="ml-2 text-sm text-neutral-70">
                                {grade.label.split(' - ')[1]}
                            </span>
                        </label>
                    ))}
                </div>
            </div>

            {isExpanded && (
                <div className="space-y-4 border-t border-neutral-30 pt-4">
                    {/* Risk Score Range */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Risk Score Range (%)
                        </label>
                        <div className="flex gap-2 items-center">
                            <input
                                type="number"
                                placeholder="Min"
                                min="0"
                                max="100"
                                className="flex-1 px-3 py-2 border border-neutral-30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filters.risk_score_range?.[0] || ''}
                                onChange={(e) => {
                                    const min = e.target.value ? parseInt(e.target.value) : undefined
                                    const max = filters.risk_score_range?.[1]
                                    handleFilterUpdate('risk_score_range',
                                        min !== undefined || max !== undefined ? [min || 0, max || 100] : undefined
                                    )
                                }}
                            />
                            <span className="text-neutral-60">to</span>
                            <input
                                type="number"
                                placeholder="Max"
                                min="0"
                                max="100"
                                className="flex-1 px-3 py-2 border border-neutral-30 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                value={filters.risk_score_range?.[1] || ''}
                                onChange={(e) => {
                                    const max = e.target.value ? parseInt(e.target.value) : undefined
                                    const min = filters.risk_score_range?.[0]
                                    handleFilterUpdate('risk_score_range',
                                        min !== undefined || max !== undefined ? [min || 0, max || 100] : undefined
                                    )
                                }}
                            />
                        </div>
                    </div>

                    {/* Overall Grade Categories */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Grade Categories
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map(category => (
                                <label
                                    key={category}
                                    className={`
                    flex items-center justify-center px-3 py-2 rounded-lg border cursor-pointer transition-colors
                    ${filters.overall_grade_categories?.includes(category)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-neutral-30 hover:border-neutral-40'
                                        }
                  `}
                                >
                                    <Checkbox
                                        id={`grade-category-${category}`}
                                        checked={filters.overall_grade_categories?.includes(category) || false}
                                        onChange={(checked) => handleMultiSelectUpdate('overall_grade_categories', category.toString(), checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm font-medium">Cat {category}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Parameter Benchmarks Filter */}
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Parameter Benchmarks
                        </label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {parameterBenchmarks.map(benchmark => (
                                <label
                                    key={benchmark}
                                    className={`
                    flex items-center px-3 py-2 rounded-lg border cursor-pointer transition-colors
                    ${filters.risk_grades?.includes(benchmark)
                                            ? 'border-blue-500 bg-blue-50'
                                            : 'border-neutral-30 hover:border-neutral-40'
                                        }
                  `}
                                >
                                    <Checkbox
                                        id={`benchmark-${benchmark}`}
                                        checked={filters.risk_grades?.includes(benchmark) || false}
                                        onChange={(checked) => handleMultiSelectUpdate('risk_grades', benchmark, checked)}
                                        className="mr-2"
                                    />
                                    <span className="text-sm">{benchmark}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Clear Risk Filters */}
                    {activeRiskFilterCount > 0 && (
                        <div className="pt-2">
                            <Button variant="outline" size="sm" onClick={clearRiskFilters}>
                                Clear Risk Filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    )
}