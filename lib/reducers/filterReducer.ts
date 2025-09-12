import { FilterState, FilterAction, FilterSource } from '@/types/filter.types';

export const initialFilterState: FilterState = {
    filters: {
        riskGrades: [],
        industries: [],
        regions: [],
        states: [],
        cities: [],
        gst_compliance_status: [],
        epfo_compliance_status: [],
        complianceStatus: {
            gst: [],
            epfo: [],
            audit: []
        },
        financialMetrics: {
            ebitdaMargin: {},
            debtEquityRatio: {},
            currentRatio: {},
            revenue: {}
        },
        dateRange: {},
        searchQuery: '',
        creditLimits: {},
        processingStatus: []
    },
    metadata: {
        lastUpdated: new Date().toISOString(),
        source: 'manual',
        appliedAt: new Date().toISOString(),
        version: 1
    },
    ui: {
        isLoading: false,
        errors: [],
        conflicts: []
    }
};

export function filterReducer(state: FilterState, action: FilterAction): FilterState {
    switch (action.type) {
        case 'UPDATE_FILTER': {
            const { filterType, value, source = 'manual' } = action.payload;

            // Handle nested filter types
            if (filterType.includes('.')) {
                const [parentKey, childKey] = filterType.split('.');
                const parentFilter = state.filters[parentKey as keyof typeof state.filters];

                if (typeof parentFilter === 'object' && parentFilter !== null) {
                    return {
                        ...state,
                        filters: {
                            ...state.filters,
                            [parentKey]: {
                                ...parentFilter,
                                [childKey]: Array.isArray((parentFilter as any)[childKey]) ? [] :
                                    typeof (parentFilter as any)[childKey] === 'object' ? {} : ''
                            }
                        },
                        metadata: {
                            ...state.metadata,
                            lastUpdated: new Date().toISOString(),
                            version: state.metadata.version + 1
                        }
                    };
                }
            }

            return {
                ...state,
                filters: {
                    ...state.filters,
                    [filterType]: value
                },
                metadata: {
                    ...state.metadata,
                    lastUpdated: new Date().toISOString(),
                    source,
                    version: state.metadata.version + 1
                }
            };
        }

        case 'CLEAR_FILTER': {
            const { filterType } = action.payload;

            // Handle nested filter types
            if (filterType.includes('.')) {
                const [parentKey, childKey] = filterType.split('.');
                const parentFilter = state.filters[parentKey as keyof typeof state.filters];

                if (typeof parentFilter === 'object' && parentFilter !== null) {
                    return {
                        ...state,
                        filters: {
                            ...state.filters,
                            [parentKey]: {
                                ...parentFilter,
                                [childKey]: Array.isArray((parentFilter as any)[childKey]) ? [] :
                                    typeof (parentFilter as any)[childKey] === 'object' ? {} : ''
                            }
                        },
                        metadata: {
                            ...state.metadata,
                            lastUpdated: new Date().toISOString(),
                            version: state.metadata.version + 1
                        }
                    };
                }
            }

            // Get the default value for the filter type
            const defaultValue = getDefaultFilterValue(filterType);

            return {
                ...state,
                filters: {
                    ...state.filters,
                    [filterType]: defaultValue
                },
                metadata: {
                    ...state.metadata,
                    lastUpdated: new Date().toISOString(),
                    version: state.metadata.version + 1
                }
            };
        }

        case 'CLEAR_ALL_FILTERS':
            return {
                ...initialFilterState,
                metadata: {
                    ...initialFilterState.metadata,
                    lastUpdated: new Date().toISOString(),
                    version: state.metadata.version + 1
                }
            };

        case 'LOAD_STATE':
            return {
                ...action.payload,
                metadata: {
                    ...action.payload.metadata,
                    appliedAt: new Date().toISOString()
                }
            };

        case 'SET_LOADING':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    isLoading: action.payload
                }
            };

        case 'ADD_ERROR':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    errors: [...state.ui.errors, action.payload]
                }
            };

        case 'CLEAR_ERRORS':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    errors: []
                }
            };

        case 'ADD_CONFLICT':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    conflicts: [...state.ui.conflicts, action.payload]
                }
            };

        case 'RESOLVE_CONFLICT':
            return {
                ...state,
                ui: {
                    ...state.ui,
                    conflicts: state.ui.conflicts.filter(
                        conflict => conflict.id !== action.payload.conflictId
                    )
                }
            };

        case 'MERGE_FILTERS': {
            const { filters, source } = action.payload;

            return {
                ...state,
                filters: {
                    ...state.filters,
                    ...filters
                },
                metadata: {
                    ...state.metadata,
                    lastUpdated: new Date().toISOString(),
                    source,
                    version: state.metadata.version + 1
                }
            };
        }

        default:
            return state;
    }
}

function getDefaultFilterValue(filterType: string): any {
    const arrayFilters = ['riskGrades', 'industries', 'regions', 'states', 'cities', 'processingStatus'];
    const objectFilters = ['complianceStatus', 'financialMetrics', 'dateRange', 'creditLimits'];

    if (arrayFilters.includes(filterType)) {
        return [];
    }

    if (objectFilters.includes(filterType)) {
        if (filterType === 'complianceStatus') {
            return { gst: [], epfo: [], audit: [] };
        }
        return {};
    }

    if (filterType === 'searchQuery') {
        return '';
    }

    return null;
}