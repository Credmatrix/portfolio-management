'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { FilterState, FilterAction, FilterConflict } from '@/types/filter.types';
import { filterReducer, initialFilterState } from '@/lib/reducers/filterReducer';
import { FilterValidator } from '@/lib/utils/filter-validator';
import { FilterConflictResolver } from '@/lib/utils/filter-conflict-resolver';
import { FilterPersistence } from '@/lib/utils/filter-persistence';

interface FilterStateContextType {
    state: FilterState;
    dispatch: React.Dispatch<FilterAction>;
    updateFilter: (filterType: string, value: any) => void;
    clearFilter: (filterType: string) => void;
    clearAllFilters: () => void;
    validateFilters: () => FilterConflict[];
    resolveConflicts: (conflicts: FilterConflict[]) => void;
    getActiveFilterCount: () => number;
    isFilterActive: (filterType: string) => boolean;
}

const FilterStateContext = createContext<FilterStateContextType | undefined>(undefined);

interface FilterStateProviderProps {
    children: React.ReactNode;
    persistenceKey?: string;
    enableUrlSync?: boolean;
}

export function FilterStateProvider({
    children,
    persistenceKey = 'portfolio-filters',
    enableUrlSync = true
}: FilterStateProviderProps) {
    const [state, dispatch] = useReducer(filterReducer, initialFilterState);
    const validator = new FilterValidator();
    const conflictResolver = new FilterConflictResolver();
    const persistence = new FilterPersistence(persistenceKey, enableUrlSync);

    // Load persisted state on mount
    useEffect(() => {
        const persistedState = persistence.loadState();
        if (persistedState) {
            dispatch({ type: 'LOAD_STATE', payload: persistedState });
        }
    }, []);

    // Persist state changes
    useEffect(() => {
        persistence.saveState(state);
    }, [state]);

    const updateFilter = useCallback((filterType: string, value: any) => {
        // Validate the filter value
        const validationResult = validator.validateFilter(filterType, value);
        if (!validationResult.isValid) {
            console.warn(`Invalid filter value for ${filterType}:`, validationResult.errors);
            return;
        }

        // Sanitize the value
        const sanitizedValue = validator.sanitizeFilter(filterType, value);

        dispatch({
            type: 'UPDATE_FILTER',
            payload: { filterType, value: sanitizedValue }
        });
    }, [validator]);

    const clearFilter = useCallback((filterType: string) => {
        dispatch({
            type: 'CLEAR_FILTER',
            payload: { filterType }
        });
    }, []);

    const clearAllFilters = useCallback(() => {
        dispatch({ type: 'CLEAR_ALL_FILTERS' });
    }, []);

    const validateFilters = useCallback(() => {
        return validator.validateFilterCombination(state);
    }, [state, validator]);

    const resolveConflicts = useCallback((conflicts: FilterConflict[]) => {
        const resolvedState = conflictResolver.resolveConflicts(state, conflicts);
        dispatch({ type: 'LOAD_STATE', payload: resolvedState });
    }, [state, conflictResolver]);

    const getActiveFilterCount = useCallback(() => {
        return Object.values(state.filters).filter(filter =>
            filter !== null &&
            filter !== undefined &&
            filter !== '' &&
            !(Array.isArray(filter) && filter.length === 0)
        ).length;
    }, [state.filters]);

    const isFilterActive = useCallback((filterType: string) => {
        const filter = state.filters[filterType];
        return filter !== null &&
            filter !== undefined &&
            filter !== '' &&
            !(Array.isArray(filter) && filter.length === 0);
    }, [state.filters]);

    const contextValue: FilterStateContextType = {
        state,
        dispatch,
        updateFilter,
        clearFilter,
        clearAllFilters,
        validateFilters,
        resolveConflicts,
        getActiveFilterCount,
        isFilterActive
    };

    return (
        <FilterStateContext.Provider value={contextValue}>
            {children}
        </FilterStateContext.Provider>
    );
}

export function useFilterState() {
    const context = useContext(FilterStateContext);
    if (context === undefined) {
        throw new Error('useFilterState must be used within a FilterStateProvider');
    }
    return context;
}