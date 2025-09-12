'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useFilterState } from '@/lib/contexts/FilterStateContext';
import { FilterConflict, FilterPreset, FilterImpact } from '@/types/filter.types';

export function useFilterSystem() {
    const {
        state,
        updateFilter,
        clearFilter,
        clearAllFilters,
        validateFilters,
        resolveConflicts,
        getActiveFilterCount,
        isFilterActive
    } = useFilterState();

    const [conflicts, setConflicts] = useState<FilterConflict[]>([]);
    const [impact, setImpact] = useState<FilterImpact | null>(null);

    // Validate filters whenever state changes
    useEffect(() => {
        const newConflicts = validateFilters();
        setConflicts(newConflicts);
    }, [state, validateFilters]);

    // Debounced filter update to prevent excessive API calls
    const debouncedUpdateFilter = useCallback(
        debounce((filterType: string, value: any) => {
            updateFilter(filterType, value);
        }, 300),
        [updateFilter]
    );

    // Batch filter updates for better performance
    const updateMultipleFilters = useCallback((updates: Array<{ filterType: string; value: any }>) => {
        updates.forEach(({ filterType, value }) => {
            updateFilter(filterType, value);
        });
    }, [updateFilter]);

    // Smart filter suggestions based on current state
    const getFilterSuggestions = useCallback(() => {
        const suggestions: FilterSuggestion[] = [];
        const { filters } = state;

        // Suggest related filters based on current selection
        if (filters.riskGrades.length > 0) {
            const hasHighRisk = filters.riskGrades.some(grade => ['D', 'E'].includes(grade));
            if (hasHighRisk && filters.complianceStatus.gst.length === 0) {
                suggestions.push({
                    type: 'related',
                    message: 'Consider filtering by GST compliance for high-risk companies',
                    filterType: 'complianceStatus.gst',
                    suggestedValue: ['non-compliant', 'unknown']
                });
            }
        }

        if (filters.industries.length > 0 && filters.regions.length === 0) {
            suggestions.push({
                type: 'enhancement',
                message: 'Add regional filters to analyze geographic distribution within selected industries',
                filterType: 'regions',
                suggestedValue: []
            });
        }

        // Suggest financial metrics based on risk grades
        if (filters.riskGrades.length > 0 && Object.keys(filters.financialMetrics.ebitdaMargin).length === 0) {
            const avgRiskLevel = calculateAverageRiskLevel(filters.riskGrades);
            if (avgRiskLevel > 6) { // High risk
                suggestions.push({
                    type: 'optimization',
                    message: 'Consider setting EBITDA margin filters for better risk assessment',
                    filterType: 'financialMetrics.ebitdaMargin',
                    suggestedValue: { min: 5, max: 25 }
                });
            }
        }

        return suggestions;
    }, [state]);

    // Calculate filter impact on dataset
    const calculateFilterImpact = useCallback(async (): Promise<FilterImpact | null> => {
        try {
            // This would typically make an API call to get impact statistics
            // For now, we'll simulate the calculation
            const activeFilters = getActiveFilterCount();
            const estimatedImpact = Math.max(10, 100 - (activeFilters * 15));

            const mockImpact: FilterImpact = {
                totalCompanies: 1000,
                filteredCompanies: estimatedImpact,
                impactPercentage: (estimatedImpact / 1000) * 100,
                affectedMetrics: {
                    averageRiskScore: {
                        before: 6.5,
                        after: 5.2,
                        change: -1.3
                    },
                    industryDiversity: {
                        before: 15,
                        after: Math.max(1, 15 - activeFilters),
                        change: -Math.min(14, activeFilters)
                    }
                }
            };

            setImpact(mockImpact);
            return mockImpact;
        } catch (error) {
            console.error('Failed to calculate filter impact:', error);
            return null;
        }
    }, [getActiveFilterCount]);

    // Auto-resolve conflicts with user confirmation
    const autoResolveConflicts = useCallback(async (conflictIds?: string[]) => {
        const conflictsToResolve = conflictIds
            ? conflicts.filter(c => conflictIds.includes(c.id))
            : conflicts.filter(c => c.autoResolvable);

        if (conflictsToResolve.length > 0) {
            resolveConflicts(conflictsToResolve);
        }
    }, [conflicts, resolveConflicts]);

    // Create filter preset from current state
    const createPreset = useCallback((name: string, description: string): FilterPreset => {
        return {
            id: `preset_${Date.now()}`,
            name,
            description,
            filters: state.filters,
            category: 'custom',
            isDefault: false,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
    }, [state.filters]);

    // Apply filter preset
    const applyPreset = useCallback((preset: FilterPreset) => {
        Object.entries(preset.filters).forEach(([filterType, value]) => {
            if (value !== null && value !== undefined) {
                updateFilter(filterType, value);
            }
        });
    }, [updateFilter]);

    // Get filter summary for display
    const getFilterSummary = useCallback(() => {
        const { filters } = state;
        const summary: FilterSummaryItem[] = [];

        if (filters.riskGrades.length > 0) {
            summary.push({
                type: 'riskGrades',
                label: 'Risk Grades',
                value: filters.riskGrades.join(', '),
                count: filters.riskGrades.length
            });
        }

        if (filters.industries.length > 0) {
            summary.push({
                type: 'industries',
                label: 'Industries',
                value: filters.industries.length > 3
                    ? `${filters.industries.slice(0, 3).join(', ')} +${filters.industries.length - 3} more`
                    : filters.industries.join(', '),
                count: filters.industries.length
            });
        }

        if (filters.regions.length > 0) {
            summary.push({
                type: 'regions',
                label: 'Regions',
                value: filters.regions.join(', '),
                count: filters.regions.length
            });
        }

        // Financial metrics summary
        const financialSummary = [];
        // if (Object.keys(filters.financialMetrics.ebitdaMargin).length > 0) {
        //     const range = filters.financialMetrics.ebitdaMargin;
        //     financialSummary.push(`EBITDA: ${formatRange(range)}`);
        // }
        // if (Object.keys(filters.financialMetrics.debtEquityRatio).length > 0) {
        //     const range = filters.financialMetrics.debtEquityRatio;
        //     financialSummary.push(`D/E: ${formatRange(range)}`);
        // }

        if (financialSummary.length > 0) {
            summary.push({
                type: 'financialMetrics',
                label: 'Financial Metrics',
                value: financialSummary.join(', '),
                count: financialSummary.length
            });
        }

        if (filters.searchQuery) {
            summary.push({
                type: 'searchQuery',
                label: 'Search',
                value: `"${filters.searchQuery}"`,
                count: 1
            });
        }

        return summary;
    }, [state.filters]);

    // Memoized computed values
    const computedValues = useMemo(() => ({
        hasActiveFilters: getActiveFilterCount() > 0,
        hasConflicts: conflicts.length > 0,
        hasHighSeverityConflicts: conflicts.some(c => c.severity === 'high'),
        filterSuggestions: getFilterSuggestions(),
        filterSummary: getFilterSummary()
    }), [getActiveFilterCount, conflicts, getFilterSuggestions, getFilterSummary]);

    return {
        // State
        state,
        conflicts,
        impact,

        // Actions
        updateFilter: debouncedUpdateFilter,
        updateMultipleFilters,
        clearFilter,
        clearAllFilters,

        // Utilities
        isFilterActive,
        getActiveFilterCount,
        calculateFilterImpact,
        autoResolveConflicts,

        // Presets
        createPreset,
        applyPreset,

        // Computed values
        ...computedValues
    };
}

// Helper functions
function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

function calculateAverageRiskLevel(riskGrades: string[]): number {
    const gradeValues: Record<string, number> = {
        'A+': 1, 'A': 2, 'A-': 3,
        'B+': 4, 'B': 5, 'B-': 6,
        'C+': 7, 'C': 8, 'C-': 9,
        'D': 10, 'E': 11
    };

    const total = riskGrades.reduce((sum, grade) => sum + (gradeValues[grade] || 6), 0);
    return total / riskGrades.length;
}

function formatRange(range: { min?: number; max?: number }): string {
    if (range.min !== undefined && range.max !== undefined) {
        return `${range.min}-${range.max}`;
    }
    if (range.min !== undefined) {
        return `≥${range.min}`;
    }
    if (range.max !== undefined) {
        return `≤${range.max}`;
    }
    return '';
}

// Types
interface FilterSuggestion {
    type: 'related' | 'enhancement' | 'optimization';
    message: string;
    filterType: string;
    suggestedValue: any;
}

interface FilterSummaryItem {
    type: string;
    label: string;
    value: string;
    count: number;
}