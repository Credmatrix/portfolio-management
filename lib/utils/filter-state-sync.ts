// ============================================================================
// FILTER STATE SYNCHRONIZATION UTILITIES
// ============================================================================

import { FilterCriteria } from '@/types/portfolio.types';
import {
    DashboardFilterState,
    FilterSource,
    ChartType,
    ChartDataPoint
} from '@/types/chart-interactions.types';

/**
 * Synchronizes filter state between different components
 */
export class FilterStateSynchronizer {
    private listeners: Map<string, (state: DashboardFilterState) => void> = new Map();
    private currentState: DashboardFilterState;

    constructor(initialState: DashboardFilterState) {
        this.currentState = initialState;
    }

    /**
     * Subscribe to filter state changes
     */
    subscribe(id: string, callback: (state: DashboardFilterState) => void): () => void {
        this.listeners.set(id, callback);

        // Return unsubscribe function
        return () => {
            this.listeners.delete(id);
        };
    }

    /**
     * Update filter state and notify all listeners
     */
    updateState(newState: DashboardFilterState): void {
        this.currentState = newState;
        this.notifyListeners();
    }

    /**
     * Get current filter state
     */
    getState(): DashboardFilterState {
        return { ...this.currentState };
    }

    /**
     * Notify all listeners of state changes
     */
    private notifyListeners(): void {
        this.listeners.forEach(callback => {
            callback(this.currentState);
        });
    }

    /**
     * Batch multiple filter updates to prevent excessive notifications
     */
    batchUpdate(updates: Array<{
        filters: Partial<FilterCriteria>;
        source: FilterSource;
        sourceDetails?: {
            chartType?: ChartType;
            clickData?: ChartDataPoint;
        };
    }>): void {
        let updatedState = { ...this.currentState };

        updates.forEach(({ filters, source, sourceDetails }) => {
            updatedState = this.applyFilterUpdate(updatedState, filters, source, sourceDetails);
        });

        this.updateState(updatedState);
    }

    /**
     * Apply a single filter update to the state
     */
    private applyFilterUpdate(
        state: DashboardFilterState,
        filters: Partial<FilterCriteria>,
        source: FilterSource,
        sourceDetails?: {
            chartType?: ChartType;
            clickData?: ChartDataPoint;
        }
    ): DashboardFilterState {
        const updatedState = { ...state };

        // Update the appropriate filter source
        switch (source) {
            case 'analytics':
                updatedState.analyticsFilters = {
                    ...state.analyticsFilters,
                    ...filters
                };

                // Update active chart selections if from analytics
                if (sourceDetails?.chartType && sourceDetails?.clickData) {
                    const chartType = sourceDetails.chartType;
                    const existingSelections = state.activeChartSelections[chartType] || [];

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
                    ...state.manualFilters,
                    ...filters
                };
                break;

            case 'search':
                updatedState.searchFilters = {
                    ...state.searchFilters,
                    ...filters
                };
                break;
        }

        // Recalculate combined filters
        updatedState.combinedFilters = this.combineAllFilters(
            updatedState.analyticsFilters,
            updatedState.manualFilters,
            updatedState.searchFilters
        );

        return updatedState;
    }

    /**
     * Combine filters from all sources
     */
    private combineAllFilters(
        analyticsFilters: FilterCriteria,
        manualFilters: FilterCriteria,
        searchFilters: FilterCriteria
    ): FilterCriteria {
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

        // Combine search query (highest priority wins)
        const searchQueries: string[] = [];
        filterSources
            .sort((a, b) => b.priority - a.priority) // Highest priority first
            .forEach(({ filters }) => {
                if (filters.search_query) {
                    searchQueries.push(filters.search_query);
                }
            });

        if (searchQueries.length > 0) {
            combined.search_query = searchQueries[0];
        }

        return combined;
    }
}

/**
 * Creates a global filter state synchronizer instance
 */
let globalSynchronizer: FilterStateSynchronizer | null = null;

export const getGlobalFilterSynchronizer = (initialState?: DashboardFilterState): FilterStateSynchronizer => {
    if (!globalSynchronizer && initialState) {
        globalSynchronizer = new FilterStateSynchronizer(initialState);
    }

    if (!globalSynchronizer) {
        throw new Error('Filter synchronizer not initialized. Provide initial state.');
    }

    return globalSynchronizer;
};

/**
 * Hook for components to sync with global filter state
 */
export const useFilterStateSync = (
    componentId: string,
    initialState?: DashboardFilterState
) => {
    const synchronizer = getGlobalFilterSynchronizer(initialState);

    return {
        getState: () => synchronizer.getState(),
        updateState: (state: DashboardFilterState) => synchronizer.updateState(state),
        subscribe: (callback: (state: DashboardFilterState) => void) =>
            synchronizer.subscribe(componentId, callback),
        batchUpdate: (updates: Array<{
            filters: Partial<FilterCriteria>;
            source: FilterSource;
            sourceDetails?: {
                chartType?: ChartType;
                clickData?: ChartDataPoint;
            };
        }>) => synchronizer.batchUpdate(updates)
    };
};