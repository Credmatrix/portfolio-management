// ============================================================================
// FILTER CONFLICT RESOLUTION UTILITIES
// ============================================================================

import { FilterCriteria } from '@/types/portfolio.types';
import {
    FilterConflict,
    FilterValidationResult,
    DashboardFilterState
} from '@/types/chart-interactions.types';

/**
 * Validates filter combinations and detects conflicts
 */
export const validateFilterCombination = (
    filterState: DashboardFilterState
): FilterValidationResult => {
    const conflicts: FilterConflict[] = [];
    const warnings: string[] = [];
    const { combinedFilters } = filterState;

    // Check for range conflicts
    const rangeConflicts = detectRangeConflicts(combinedFilters);
    conflicts.push(...rangeConflicts);

    // Check for logical conflicts
    const logicalConflicts = detectLogicalConflicts(combinedFilters);
    conflicts.push(...logicalConflicts);

    // Check for potentially empty results
    const emptyResultWarnings = detectPotentiallyEmptyResults(combinedFilters);
    warnings.push(...emptyResultWarnings);

    // Check for redundant filters
    const redundantConflicts = detectRedundantFilters(combinedFilters);
    conflicts.push(...redundantConflicts);

    return {
        isValid: conflicts.length === 0,
        conflicts,
        warnings,
        estimatedResultCount: estimateResultCount(combinedFilters)
    };
};

/**
 * Detects range-based conflicts (min > max)
 */
const detectRangeConflicts = (filters: FilterCriteria): FilterConflict[] => {
    const conflicts: FilterConflict[] = [];

    const rangeFields: Array<{
        key: keyof FilterCriteria;
        label: string;
    }> = [
            { key: 'risk_score_range', label: 'Risk Score' },
            { key: 'revenue_range', label: 'Revenue' },
            { key: 'employee_range', label: 'Employee Count' },
            { key: 'net_worth_range', label: 'Net Worth' },
            { key: 'ebitda_margin_range', label: 'EBITDA Margin' },
            { key: 'debt_equity_range', label: 'Debt to Equity' },
            { key: 'current_ratio_range', label: 'Current Ratio' },
            { key: 'roce_range', label: 'ROCE' },
            { key: 'interest_coverage_range', label: 'Interest Coverage' },
            { key: 'eligibility_range', label: 'Eligibility' },
            { key: 'recommended_limit_range', label: 'Recommended Limit' }
        ];

    rangeFields.forEach(({ key, label }) => {
        const range = filters[key] as [number, number];
        if (range && range[0] > range[1]) {
            conflicts.push({
                type: 'incompatible',
                message: `${label} minimum (${range[0]}) is greater than maximum (${range[1]})`,
                conflictingFilters: [key],
                suggestions: [
                    `Adjust the ${label} range values`,
                    `Clear the ${label} filter to remove the conflict`
                ]
            });
        }
    });

    // Check date range conflicts
    if (filters.date_range && filters.date_range[0] > filters.date_range[1]) {
        conflicts.push({
            type: 'incompatible',
            message: 'Start date is after end date',
            conflictingFilters: ['date_range'],
            suggestions: [
                'Adjust the date range values',
                'Clear the date filter to remove the conflict'
            ]
        });
    }

    return conflicts;
};

/**
 * Detects logical conflicts (mutually exclusive values)
 */
const detectLogicalConflicts = (filters: FilterCriteria): FilterConflict[] => {
    const conflicts: FilterConflict[] = [];

    // Check for conflicting compliance statuses
    if (filters.gst_compliance_status?.includes('Compliant') &&
        filters.gst_compliance_status?.includes('Non-Compliant')) {
        conflicts.push({
            type: 'incompatible',
            message: 'Cannot filter for both compliant and non-compliant GST status',
            conflictingFilters: ['gst_compliance_status'],
            suggestions: [
                'Choose either compliant or non-compliant GST status',
                'Remove GST compliance filter to see all companies'
            ]
        });
    }

    if (filters.epfo_compliance_status?.includes('Compliant') &&
        filters.epfo_compliance_status?.includes('Non-Compliant')) {
        conflicts.push({
            type: 'incompatible',
            message: 'Cannot filter for both compliant and non-compliant EPFO status',
            conflictingFilters: ['epfo_compliance_status'],
            suggestions: [
                'Choose either compliant or non-compliant EPFO status',
                'Remove EPFO compliance filter to see all companies'
            ]
        });
    }

    // Check for conflicting company statuses
    if (filters.company_status?.includes('Active') &&
        filters.company_status?.includes('Inactive')) {
        conflicts.push({
            type: 'incompatible',
            message: 'Cannot filter for both active and inactive companies',
            conflictingFilters: ['company_status'],
            suggestions: [
                'Choose either active or inactive companies',
                'Remove company status filter to see all companies'
            ]
        });
    }

    // Check for conflicting listing statuses
    if (filters.listing_status?.includes('Listed') &&
        filters.listing_status?.includes('Unlisted')) {
        conflicts.push({
            type: 'incompatible',
            message: 'Cannot filter for both listed and unlisted companies',
            conflictingFilters: ['listing_status'],
            suggestions: [
                'Choose either listed or unlisted companies',
                'Remove listing status filter to see all companies'
            ]
        });
    }

    return conflicts;
};

/**
 * Detects potentially empty results
 */
const detectPotentiallyEmptyResults = (filters: FilterCriteria): string[] => {
    const warnings: string[] = [];

    // Count active filters
    const activeFilterCount = Object.keys(filters).filter(key => {
        const value = filters[key as keyof FilterCriteria];
        return value !== undefined && value !== null &&
            (Array.isArray(value) ? value.length > 0 : true);
    }).length;

    if (activeFilterCount > 5) {
        warnings.push('Many filters applied - results may be very limited');
    }

    // Check for very restrictive ranges
    if (filters.risk_score_range) {
        const [min, max] = filters.risk_score_range;
        if (max - min < 10) {
            warnings.push('Very narrow risk score range may limit results significantly');
        }
    }

    // Check for very specific industry + region combinations
    if (filters.industries && filters.industries.length === 1 &&
        filters.regions && filters.regions.length === 1) {
        warnings.push('Specific industry and region combination may have limited results');
    }

    return warnings;
};

/**
 * Detects redundant filters
 */
const detectRedundantFilters = (filters: FilterCriteria): FilterConflict[] => {
    const conflicts: FilterConflict[] = [];

    // Check for redundant risk grade and score range combinations
    if (filters.risk_grades && filters.risk_grades.length === 1 && filters.risk_score_range) {
        const riskGrade = filters.risk_grades[0];
        const [minScore, maxScore] = filters.risk_score_range;

        // Define typical score ranges for risk grades
        const gradeRanges: Record<string, [number, number]> = {
            'CM1': [80, 100],
            'CM2': [60, 79],
            'CM3': [40, 59],
            'CM4': [20, 39],
            'CM5': [0, 19]
        };

        const expectedRange = gradeRanges[riskGrade];
        if (expectedRange && minScore >= expectedRange[0] && maxScore <= expectedRange[1]) {
            conflicts.push({
                type: 'redundant',
                message: `Risk score range is redundant with ${riskGrade} grade filter`,
                conflictingFilters: ['risk_grades', 'risk_score_range'],
                suggestions: [
                    'Remove the risk score range filter',
                    'Remove the risk grade filter and keep the score range'
                ]
            });
        }
    }

    return conflicts;
};

/**
 * Estimates the number of results based on filter criteria
 */
const estimateResultCount = (filters: FilterCriteria): number => {
    // This is a simplified estimation - in a real implementation,
    // you might query the database for actual counts
    let estimatedCount = 1000; // Base count

    // Reduce count based on filters
    if (filters.risk_grades) {
        estimatedCount *= (filters.risk_grades.length / 5); // Assuming 5 risk grades
    }

    if (filters.industries) {
        estimatedCount *= (filters.industries.length / 20); // Assuming 20 industries
    }

    if (filters.regions) {
        estimatedCount *= (filters.regions.length / 30); // Assuming 30 regions
    }

    if (filters.gst_compliance_status) {
        estimatedCount *= (filters.gst_compliance_status.length / 3); // 3 compliance states
    }

    // Apply range restrictions
    if (filters.risk_score_range) {
        const [min, max] = filters.risk_score_range;
        estimatedCount *= ((max - min) / 100); // Percentage of full range
    }

    return Math.max(1, Math.floor(estimatedCount));
};

/**
 * Resolves conflicts by suggesting filter modifications
 */
export const resolveFilterConflicts = (
    filterState: DashboardFilterState,
    conflicts: FilterConflict[]
): {
    resolvedFilters: FilterCriteria;
    resolutionActions: string[];
} => {
    let resolvedFilters = { ...filterState.combinedFilters };
    const resolutionActions: string[] = [];

    conflicts.forEach(conflict => {
        switch (conflict.type) {
            case 'incompatible':
                // Remove conflicting filters
                conflict.conflictingFilters.forEach(filterKey => {
                    if (resolvedFilters[filterKey as keyof FilterCriteria]) {
                        delete resolvedFilters[filterKey as keyof FilterCriteria];
                        resolutionActions.push(`Removed ${filterKey} filter due to conflict`);
                    }
                });
                break;

            case 'redundant':
                // Remove the less specific filter
                if (conflict.conflictingFilters.includes('risk_score_range') &&
                    conflict.conflictingFilters.includes('risk_grades')) {
                    delete resolvedFilters.risk_score_range;
                    resolutionActions.push('Removed redundant risk score range filter');
                }
                break;

            case 'empty_result':
                // Broaden the most restrictive filter
                if (resolvedFilters.risk_score_range) {
                    const [min, max] = resolvedFilters.risk_score_range;
                    if (max - min < 20) {
                        resolvedFilters.risk_score_range = [Math.max(0, min - 10), Math.min(100, max + 10)];
                        resolutionActions.push('Broadened risk score range to increase results');
                    }
                }
                break;
        }
    });

    return {
        resolvedFilters,
        resolutionActions
    };
};

/**
 * Suggests filter improvements for better results
 */
export const suggestFilterImprovements = (
    filterState: DashboardFilterState,
    resultCount: number
): string[] => {
    const suggestions: string[] = [];
    const { combinedFilters } = filterState;

    if (resultCount === 0) {
        suggestions.push('Try removing some filters to broaden your search');
        suggestions.push('Check if your filter combinations are too restrictive');
    } else if (resultCount < 5) {
        suggestions.push('Consider broadening your criteria to see more results');

        if (combinedFilters.risk_score_range) {
            suggestions.push('Try expanding the risk score range');
        }

        if (combinedFilters.industries && combinedFilters.industries.length === 1) {
            suggestions.push('Try selecting additional industries');
        }
    } else if (resultCount > 500) {
        suggestions.push('Consider adding more filters to narrow down results');

        if (!combinedFilters.risk_grades) {
            suggestions.push('Try filtering by risk grade');
        }

        if (!combinedFilters.industries) {
            suggestions.push('Try filtering by industry');
        }
    }

    return suggestions;
};