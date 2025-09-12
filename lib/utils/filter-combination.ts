// ============================================================================
// FILTER COMBINATION UTILITIES
// ============================================================================

import { FilterCriteria } from '@/types/portfolio.types';
import {
    DashboardFilterState,
    SourcedFilterCriteria,
    FilterSource,
    ChartType,
    ChartDataPoint
} from '@/types/chart-interactions.types';

/**
 * Creates an initial dashboard filter state
 */
export const createInitialFilterState = (): DashboardFilterState => {
    return {
        analyticsFilters: {},
        manualFilters: {},
        searchFilters: {},
        combinedFilters: {},
        activeChartSelections: {} as Record<ChartType, ChartDataPoint[]>,
        filterHistory: []
    };
};

/**
 * Updates the dashboard filter state with new filters from a specific source
 */
export const updateFilterState = (
    currentState: DashboardFilterState,
    newFilters: Partial<FilterCriteria>,
    source: FilterSource,
    sourceDetails?: {
        chartType?: ChartType;
        clickData?: ChartDataPoint;
    }
): DashboardFilterState => {
    const updatedState = { ...currentState };

    // Update the appropriate filter source
    switch (source) {
        case 'analytics':
            updatedState.analyticsFilters = {
                ...currentState.analyticsFilters,
                ...newFilters
            };

            // Update active chart selections if from analytics
            if (sourceDetails?.chartType && sourceDetails?.clickData) {
                const chartType = sourceDetails.chartType;
                const existingSelections = currentState.activeChartSelections[chartType] || [];

                // Check if this selection already exists
                const existingIndex = existingSelections.findIndex(
                    selection => selection.label === sourceDetails.clickData!.label
                );

                if (existingIndex >= 0) {
                    // Remove existing selection (toggle off)
                    updatedState.activeChartSelections[chartType] = existingSelections.filter(
                        (_, index) => index !== existingIndex
                    );
                } else {
                    // Add new selection
                    updatedState.activeChartSelections[chartType] = [
                        ...existingSelections,
                        sourceDetails.clickData
                    ];
                }
            }
            break;

        case 'manual':
            updatedState.manualFilters = {
                ...currentState.manualFilters,
                ...newFilters
            };
            break;

        case 'search':
            updatedState.searchFilters = {
                ...currentState.searchFilters,
                ...newFilters
            };
            break;
    }

    // Recalculate combined filters
    updatedState.combinedFilters = combineAllFilters(
        updatedState.analyticsFilters,
        updatedState.manualFilters,
        updatedState.searchFilters
    );

    // Add to filter history
    const sourcedFilter: SourcedFilterCriteria = {
        ...newFilters,
        source,
        sourceDetails: {
            ...sourceDetails,
            timestamp: Date.now()
        }
    };

    updatedState.filterHistory = [
        ...currentState.filterHistory.slice(-9), // Keep last 10 entries
        sourcedFilter
    ];

    return updatedState;
};

/**
 * Removes filters from a specific source
 */
export const removeFiltersFromSource = (
    currentState: DashboardFilterState,
    filtersToRemove: Partial<FilterCriteria>,
    source: FilterSource
): DashboardFilterState => {
    const updatedState = { ...currentState };

    switch (source) {
        case 'analytics':
            updatedState.analyticsFilters = removeSpecificFilters(
                currentState.analyticsFilters,
                filtersToRemove
            );
            break;

        case 'manual':
            updatedState.manualFilters = removeSpecificFilters(
                currentState.manualFilters,
                filtersToRemove
            );
            break;

        case 'search':
            updatedState.searchFilters = removeSpecificFilters(
                currentState.searchFilters,
                filtersToRemove
            );
            break;
    }

    // Recalculate combined filters
    updatedState.combinedFilters = combineAllFilters(
        updatedState.analyticsFilters,
        updatedState.manualFilters,
        updatedState.searchFilters
    );

    return updatedState;
};

/**
 * Clears all filters from a specific source
 */
export const clearFiltersFromSource = (
    currentState: DashboardFilterState,
    source: FilterSource
): DashboardFilterState => {
    const updatedState = { ...currentState };

    switch (source) {
        case 'analytics':
            updatedState.analyticsFilters = {};
            updatedState.activeChartSelections = {} as Record<ChartType, ChartDataPoint[]>;
            break;

        case 'manual':
            updatedState.manualFilters = {};
            break;

        case 'search':
            updatedState.searchFilters = {};
            break;
    }

    // Recalculate combined filters
    updatedState.combinedFilters = combineAllFilters(
        updatedState.analyticsFilters,
        updatedState.manualFilters,
        updatedState.searchFilters
    );

    return updatedState;
};

/**
 * Clears all filters from all sources
 */
export const clearAllFilters = (
    currentState: DashboardFilterState
): DashboardFilterState => {
    return {
        analyticsFilters: {},
        manualFilters: {},
        searchFilters: {},
        combinedFilters: {},
        activeChartSelections: {} as Record<ChartType, ChartDataPoint[]>,
        filterHistory: []
    };
};

/**
 * Combines filters from all sources with proper precedence and conflict resolution
 */
const combineAllFilters = (
    analyticsFilters: FilterCriteria,
    manualFilters: FilterCriteria,
    searchFilters: FilterCriteria
): FilterCriteria => {
    const combined: FilterCriteria = {};

    // Define filter precedence: search > manual > analytics
    const filterSources = [
        { filters: analyticsFilters, priority: 1 },
        { filters: manualFilters, priority: 2 },
        { filters: searchFilters, priority: 3 }
    ];

    // Combine array-based filters (union within same priority, intersection across priorities)
    const arrayFields: (keyof FilterCriteria)[] = [
        'risk_grades',
        'industries',
        'regions',
        'gst_compliance_status',
        'epfo_compliance_status',
        'audit_qualification_status',
        'listing_status',
        'company_status',
        'model_type',
        'processing_status',
        'overall_grade_categories'
    ];

    arrayFields.forEach(field => {
        const allValues: any[] = [];

        filterSources.forEach(({ filters }) => {
            const values = filters[field] as any[] || [];
            if (values.length > 0) {
                allValues.push(...values);
            }
        });

        if (allValues.length > 0) {
            // Remove duplicates
            (combined as any)[field] = [...new Set(allValues)];
        }
    });

    // Combine range-based filters (intersection - most restrictive wins)
    const rangeFields: (keyof FilterCriteria)[] = [
        'risk_score_range',
        'revenue_range',
        'employee_range',
        'net_worth_range',
        'ebitda_margin_range',
        'debt_equity_range',
        'current_ratio_range',
        'roce_range',
        'interest_coverage_range',
        'eligibility_range',
        'recommended_limit_range'
    ];

    rangeFields.forEach(field => {
        const ranges: [number, number][] = [];

        filterSources.forEach(({ filters }) => {
            const range = filters[field] as [number, number];
            if (range) {
                ranges.push(range);
            }
        });

        if (ranges.length > 0) {
            // Find intersection of all ranges
            const minValue = Math.max(...ranges.map(r => r[0]));
            const maxValue = Math.min(...ranges.map(r => r[1]));

            if (minValue <= maxValue) {
                (combined as any)[field] = [minValue, maxValue];
            }
        }
    });

    // Combine date range (intersection)
    const dateRanges: [Date, Date][] = [];
    filterSources.forEach(({ filters }) => {
        if (filters.date_range) {
            dateRanges.push(filters.date_range);
        }
    });

    if (dateRanges.length > 0) {
        const startDate = new Date(Math.max(...dateRanges.map(r => r[0].getTime())));
        const endDate = new Date(Math.min(...dateRanges.map(r => r[1].getTime())));

        if (startDate <= endDate) {
            combined.date_range = [startDate, endDate];
        }
    }

    // Combine search query (highest priority wins, or concatenate)
    const searchQueries: string[] = [];
    filterSources
        .sort((a, b) => b.priority - a.priority) // Highest priority first
        .forEach(({ filters }) => {
            if (filters.search_query) {
                searchQueries.push(filters.search_query);
            }
        });

    if (searchQueries.length > 0) {
        // Use the highest priority search query, or combine if from same priority
        combined.search_query = searchQueries[0];
    }

    return combined;
};

/**
 * Removes specific filters from a filter criteria object
 */
const removeSpecificFilters = (
    existingFilters: FilterCriteria,
    filtersToRemove: Partial<FilterCriteria>
): FilterCriteria => {
    const updated = { ...existingFilters };

    Object.entries(filtersToRemove).forEach(([key, value]) => {
        const filterKey = key as keyof FilterCriteria;

        if (Array.isArray(value) && Array.isArray(updated[filterKey])) {
            // Remove specific values from array
            const existingArray = updated[filterKey] as any[];
            const filteredArray = existingArray.filter(item => !value.includes(item));

            if (filteredArray.length === 0) {
                delete updated[filterKey];
            } else {
                (updated as any)[filterKey] = filteredArray;
            }
        } else {
            // Remove the entire filter
            delete updated[filterKey];
        }
    });

    return updated;
};



/**
 * Gets a summary of active filters by source
 */
export const getFilterSummary = (
    filterState: DashboardFilterState
): {
    analytics: string[];
    manual: string[];
    search: string[];
    total: number;
} => {
    const getFilterLabels = (filters: FilterCriteria): string[] => {
        const labels: string[] = [];

        Object.entries(filters).forEach(([key, value]) => {
            if (Array.isArray(value) && value.length > 0) {
                labels.push(`${key}: ${value.length} selected`);
            } else if (value && !Array.isArray(value)) {
                labels.push(key);
            }
        });

        return labels;
    };

    const analytics = getFilterLabels(filterState.analyticsFilters);
    const manual = getFilterLabels(filterState.manualFilters);
    const search = getFilterLabels(filterState.searchFilters);

    return {
        analytics,
        manual,
        search,
        total: analytics.length + manual.length + search.length
    };
};

/**
 * Checks if a specific chart selection is active
 */
export const isChartSelectionActive = (
    filterState: DashboardFilterState,
    chartType: ChartType,
    dataPoint: ChartDataPoint
): boolean => {
    const selections = filterState.activeChartSelections[chartType] || [];
    return selections.some(selection => selection.label === dataPoint.label);
};

/**
 * Gets all active chart selections for visual feedback
 */
// export const getActiveChartSelections = (
//     filterState: DashboardFilterState
// ): Record<ChartType, ChartDataPoint[]> => {
//     return filterState.activeChartSelections;
// };