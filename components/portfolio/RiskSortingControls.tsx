// components/portfolio/RiskSortingControls.tsx
'use client'

import { useState } from 'react'
import { ChevronDown, ArrowUpDown, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { SortCriteria } from '@/types/portfolio.types'

interface RiskSortingControlsProps {
    sortCriteria: SortCriteria
    onSortChange: (criteria: SortCriteria) => void
    className?: string
}

export function RiskSortingControls({ sortCriteria, onSortChange, className = '' }: RiskSortingControlsProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    const sortOptions = [
        // Risk-based sorting
        {
            value: 'risk_score',
            label: 'Risk Score',
            category: 'Risk Assessment',
            description: 'Overall risk percentage score'
        },
        {
            value: 'risk_grade',
            label: 'Risk Grade',
            category: 'Risk Assessment',
            description: 'CM1-CM5 risk grade classification'
        },
        {
            value: 'overall_grade_category',
            label: 'Grade Category',
            category: 'Risk Assessment',
            description: 'Numerical grade category (1-5)'
        },

        // Category scores
        {
            value: 'financial_score',
            label: 'Financial Score',
            category: 'Category Scores',
            description: 'Financial parameter performance'
        },
        {
            value: 'business_score',
            label: 'Business Score',
            category: 'Category Scores',
            description: 'Business parameter performance'
        },
        {
            value: 'hygiene_score',
            label: 'Hygiene Score',
            category: 'Category Scores',
            description: 'Hygiene parameter performance'
        },
        {
            value: 'banking_score',
            label: 'Banking Score',
            category: 'Category Scores',
            description: 'Banking parameter performance'
        },

        // Credit eligibility
        {
            value: 'recommended_limit',
            label: 'Recommended Limit',
            category: 'Credit Assessment',
            description: 'Recommended credit limit amount'
        },
        {
            value: 'final_eligibility',
            label: 'Final Eligibility',
            category: 'Credit Assessment',
            description: 'Risk-adjusted eligibility amount'
        },
        {
            value: 'risk_multiplier',
            label: 'Risk Multiplier',
            category: 'Credit Assessment',
            description: 'Risk adjustment multiplier'
        },

        // Company attributes
        {
            value: 'company_name',
            label: 'Company Name',
            category: 'Company Info',
            description: 'Alphabetical by company name'
        },
        {
            value: 'industry',
            label: 'Industry',
            category: 'Company Info',
            description: 'Alphabetical by industry'
        },
        {
            value: 'completed_at',
            label: 'Processing Date',
            category: 'Processing',
            description: 'Date of completion'
        },
        {
            value: 'total_parameters',
            label: 'Parameter Count',
            category: 'Processing',
            description: 'Total number of parameters'
        },
        {
            value: 'available_parameters',
            label: 'Available Parameters',
            category: 'Processing',
            description: 'Number of available parameters'
        }
    ]

    const handleSortFieldChange = (field: string) => {
        onSortChange({
            field,
            direction: sortCriteria.field === field && sortCriteria.direction === 'desc' ? 'asc' : 'desc'
        })
    }

    const toggleSortDirection = () => {
        onSortChange({
            ...sortCriteria,
            direction: sortCriteria.direction === 'asc' ? 'desc' : 'asc'
        })
    }

    const getCurrentSortOption = () => {
        return sortOptions.find(option => option.value === sortCriteria.field)
    }

    const groupedOptions = sortOptions.reduce((groups, option) => {
        const category = option.category
        if (!groups[category]) {
            groups[category] = []
        }
        groups[category].push(option)
        return groups
    }, {} as Record<string, typeof sortOptions>)

    const currentOption = getCurrentSortOption()

    return (
        <div className={`flex items-center gap-3 ${className}`}>
            {/* Quick Sort Buttons */}
            <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-70">Sort by:</span>

                {/* Risk Score Quick Sort */}
                <Button
                    variant={sortCriteria.field === 'risk_score' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSortFieldChange('risk_score')}
                    className="flex items-center gap-1"
                >
                    <TrendingUp className="w-4 h-4" />
                    Risk Score
                    {sortCriteria.field === 'risk_score' && (
                        sortCriteria.direction === 'desc' ?
                            <TrendingDown className="w-3 h-3" /> :
                            <TrendingUp className="w-3 h-3" />
                    )}
                </Button>

                {/* Risk Grade Quick Sort */}
                <Button
                    variant={sortCriteria.field === 'risk_grade' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSortFieldChange('risk_grade')}
                    className="flex items-center gap-1"
                >
                    Grade
                    {sortCriteria.field === 'risk_grade' && (
                        sortCriteria.direction === 'desc' ?
                            <TrendingDown className="w-3 h-3" /> :
                            <TrendingUp className="w-3 h-3" />
                    )}
                </Button>

                {/* Recommended Limit Quick Sort */}
                <Button
                    variant={sortCriteria.field === 'recommended_limit' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => handleSortFieldChange('recommended_limit')}
                    className="flex items-center gap-1"
                >
                    Limit
                    {sortCriteria.field === 'recommended_limit' && (
                        sortCriteria.direction === 'desc' ?
                            <TrendingDown className="w-3 h-3" /> :
                            <TrendingUp className="w-3 h-3" />
                    )}
                </Button>
            </div>

            {/* Advanced Sort Dropdown */}
            <div className="relative">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="flex items-center gap-2"
                >
                    <ArrowUpDown className="w-4 h-4" />
                    More Options
                    <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </Button>

                {isExpanded && (
                    <div className="absolute top-full right-0 mt-1 bg-white border border-neutral-30 rounded-lg shadow-lg z-50 min-w-80">
                        <div className="p-4">
                            <div className="flex items-center justify-between mb-3">
                                <h4 className="font-medium text-neutral-90">Advanced Sorting</h4>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsExpanded(false)}
                                >
                                    Close
                                </Button>
                            </div>

                            {/* Current Selection */}
                            {currentOption && (
                                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="font-medium text-blue-900">{currentOption.label}</span>
                                        <Badge variant="primary" className="text-xs">
                                            {sortCriteria.direction === 'asc' ? 'Ascending' : 'Descending'}
                                        </Badge>
                                    </div>
                                    <p className="text-sm text-blue-700">{currentOption.description}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={toggleSortDirection}
                                        className="mt-2 text-xs"
                                    >
                                        Switch to {sortCriteria.direction === 'asc' ? 'Descending' : 'Ascending'}
                                    </Button>
                                </div>
                            )}

                            {/* Sort Options by Category */}
                            <div className="space-y-4 max-h-80 overflow-y-auto">
                                {Object.entries(groupedOptions).map(([category, options]) => (
                                    <div key={category}>
                                        <h5 className="font-medium text-neutral-70 mb-2 text-sm">{category}</h5>
                                        <div className="space-y-1">
                                            {options.map(option => (
                                                <button
                                                    key={option.value}
                                                    onClick={() => {
                                                        handleSortFieldChange(option.value)
                                                        setIsExpanded(false)
                                                    }}
                                                    className={`
                            w-full text-left p-2 rounded-lg transition-colors
                            ${sortCriteria.field === option.value
                                                            ? 'bg-blue-50 border border-blue-200'
                                                            : 'hover:bg-neutral-10'
                                                        }
                          `}
                                                >
                                                    <div className="flex items-center justify-between">
                                                        <span className="font-medium text-sm">{option.label}</span>
                                                        {sortCriteria.field === option.value && (
                                                            <Badge variant="primary" className="text-xs">
                                                                {sortCriteria.direction === 'asc' ? '↑' : '↓'}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-neutral-60 mt-1">{option.description}</p>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Current Sort Display */}
            {currentOption && (
                <div className="flex items-center gap-2 text-sm text-neutral-60">
                    <span>Sorted by</span>
                    <Badge variant="secondary" className="text-xs">
                        {currentOption.label} {sortCriteria.direction === 'asc' ? '↑' : '↓'}
                    </Badge>
                </div>
            )}
        </div>
    )
}