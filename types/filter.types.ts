export interface FilterState {
    filters: {
        riskGrades: string[];
        industries: string[];
        regions: string[];
        states: string[];
        cities: string[];
        gst_compliance_status: string[],
        epfo_compliance_status: string[],
        complianceStatus: {
            gst: string[];
            epfo: string[];
            audit: string[];
        };
        financialMetrics: {
            ebitdaMargin: { min?: number; max?: number };
            debtEquityRatio: { min?: number; max?: number };
            currentRatio: { min?: number; max?: number };
            revenue: { min?: number; max?: number };
        };
        dateRange: {
            startDate?: string;
            endDate?: string;
        };
        searchQuery: string;
        creditLimits: { min?: number; max?: number };
        processingStatus: string[];
    };
    metadata: {
        lastUpdated: string;
        source: FilterSource;
        appliedAt: string;
        version: number;
    };
    ui: {
        isLoading: boolean;
        errors: FilterError[];
        conflicts: FilterConflict[];
    };
}

export type FilterSource = 'manual' | 'chart' | 'search' | 'preset' | 'url';

export interface FilterError {
    filterType: string;
    message: string;
    code: string;
    severity: 'warning' | 'error';
}

export interface FilterConflict {
    id: string;
    type: 'exclusion' | 'contradiction' | 'performance' | 'data_availability';
    filters: string[];
    message: string;
    severity: 'low' | 'medium' | 'high';
    autoResolvable: boolean;
    suggestedResolution?: {
        action: 'remove' | 'modify' | 'replace';
        filterType: string;
        newValue?: any;
    };
}

export interface FilterValidationResult {
    isValid: boolean;
    errors: FilterError[];
    warnings: FilterError[];
}

export interface FilterCombinationValidation {
    isValid: boolean;
    conflicts: FilterConflict[];
    suggestions: FilterSuggestion[];
}

export interface FilterSuggestion {
    type: 'optimization' | 'alternative' | 'expansion';
    message: string;
    action: {
        type: 'add' | 'remove' | 'modify';
        filterType: string;
        value: any;
    };
}

export type FilterAction =
    | { type: 'UPDATE_FILTER'; payload: { filterType: string; value: any; source?: FilterSource } }
    | { type: 'CLEAR_FILTER'; payload: { filterType: string } }
    | { type: 'CLEAR_ALL_FILTERS' }
    | { type: 'LOAD_STATE'; payload: FilterState }
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'ADD_ERROR'; payload: FilterError }
    | { type: 'CLEAR_ERRORS' }
    | { type: 'ADD_CONFLICT'; payload: FilterConflict }
    | { type: 'RESOLVE_CONFLICT'; payload: { conflictId: string } }
    | { type: 'MERGE_FILTERS'; payload: { filters: Partial<FilterState['filters']>; source: FilterSource } };

export interface FilterPreset {
    id: string;
    name: string;
    description: string;
    filters: Partial<FilterState['filters']>;
    category: 'risk' | 'compliance' | 'financial' | 'geographic' | 'custom';
    isDefault: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface FilterOption {
    value: string | number;
    label: string;
    count?: number;
    disabled?: boolean;
    description?: string;
}

export interface FilterPanelConfig {
    filterType: string;
    label: string;
    component: 'select' | 'multiselect' | 'range' | 'daterange' | 'search';
    options?: FilterOption[];
    validation?: {
        required?: boolean;
        min?: number;
        max?: number;
        pattern?: string;
    };
    dependencies?: string[];
    conflictsWith?: string[];
}

// Chart interaction types
export interface ChartFilterTrigger {
    chartType: string;
    segmentId: string;
    filterType: string;
    filterValue: any;
    action: 'add' | 'remove' | 'replace';
}

export interface FilterImpact {
    totalCompanies: number;
    filteredCompanies: number;
    impactPercentage: number;
    affectedMetrics: {
        [key: string]: {
            before: number;
            after: number;
            change: number;
        };
    };
}

// URL and persistence types
export interface FilterUrlParams {
    [key: string]: string | string[];
}

export interface FilterPersistenceConfig {
    enableSessionStorage: boolean;
    enableUrlSync: boolean;
    enableLocalStorage: boolean;
    storageKey: string;
    urlParamPrefix: string;
}