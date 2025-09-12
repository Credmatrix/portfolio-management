// ============================================================================
// CHART FILTER MAPPING UTILITIES
// ============================================================================

import { FilterCriteria } from '@/types/portfolio.types';
import {
    ChartType,
    ChartClickEvent,
    ChartDataPoint,
    RiskDistributionClickData,
    IndustryBreakdownClickData,
    ComplianceClickData,
    RatingDistributionClickData,
    MetricsCardClickData,
    SourcedFilterCriteria,
    FilterSource,
    DashboardFilterState,
    FilterConflict,
    FilterValidationResult
} from '@/types/chart-interactions.types';

/**
 * Maps chart click events to FilterCriteria objects
 */
export const mapChartClickToFilter = (
    chartType: ChartType,
    clickData: ChartDataPoint
): Partial<FilterCriteria> => {
    switch (chartType) {
        case 'risk-distribution':
            return mapRiskDistributionClick(clickData as RiskDistributionClickData);

        case 'industry-breakdown':
            return mapIndustryBreakdownClick(clickData as IndustryBreakdownClickData);

        case 'compliance-heatmap':
            return mapComplianceClick(clickData as ComplianceClickData);

        case 'rating-distribution':
            return mapRatingDistributionClick(clickData as RatingDistributionClickData);

        case 'metrics-card':
            return mapMetricsCardClick(clickData as MetricsCardClickData);

        case 'eligibility-matrix':
            return mapEligibilityMatrixClick(clickData);

        case 'parameter-correlation':
            return mapParameterCorrelationClick(clickData);

        default:
            console.warn(`Unsupported chart type: ${chartType}`);
            return {};
    }
};

/**
 * Maps risk distribution chart clicks to filter criteria
 */
const mapRiskDistributionClick = (data: RiskDistributionClickData): Partial<FilterCriteria> => {
    if (data.riskGrade === 'ungraded') {
        return {
            risk_grades: ['ungraded']
        };
    }

    return {
        risk_grades: [data.riskGrade]
    };
};

/**
 * Maps industry breakdown chart clicks to filter criteria
 */
const mapIndustryBreakdownClick = (data: IndustryBreakdownClickData): Partial<FilterCriteria> => {
    return {
        industries: [data.industry]
    };
};

/**
 * Maps compliance heatmap clicks to filter criteria
 */
const mapComplianceClick = (data: ComplianceClickData): Partial<FilterCriteria> => {
    // Map frontend compliance status to backend database values based on the migration script
    const mapComplianceStatus = (status: string, type: 'gst' | 'epfo' | 'audit'): string => {
        switch (type) {
            case 'gst':
                switch (status) {
                    case 'Compliant': return 'Regular';
                    case 'Non-Compliant': return 'Irregular';
                    case 'Unknown': return 'Unknown';
                    default: return status;
                }
            case 'epfo':
                switch (status) {
                    case 'Compliant': return 'Regular';
                    case 'Non-Compliant': return 'Not Registered';
                    case 'Unknown': return 'Unknown';
                    default: return status;
                }
            case 'audit':
                switch (status) {
                    case 'Compliant': return 'Qualified';
                    case 'Non-Compliant': return 'Unqualified';
                    case 'Unknown': return 'Unknown';
                    default: return status;
                }
            default:
                return status;
        }
    };

    switch (data.complianceType) {
        case 'gst':
            return {
                gst_compliance_status: [mapComplianceStatus(data.status, 'gst')]
            };
        case 'epfo':
            return {
                epfo_compliance_status: [mapComplianceStatus(data.status, 'epfo')]
            };
        case 'audit':
            return {
                audit_qualification_status: [mapComplianceStatus(data.status, 'audit')]
            };
        default:
            return {};
    }
};

/**
 * Maps rating distribution clicks to filter criteria
 */
const mapRatingDistributionClick = (data: RatingDistributionClickData): Partial<FilterCriteria> => {
    // Use credit_ratings field directly since it's now available in FilterCriteria
    return {
        credit_ratings: [data.rating]
    };
};

/**
 * Maps metrics card clicks to filter criteria
 */
const mapMetricsCardClick = (data: MetricsCardClickData): Partial<FilterCriteria> => {
    switch (data.metricType) {
        case 'total_companies':
            // Return all companies (no filter)
            return {};

        case 'average_risk_score':
            if (data.filterType === 'above_average') {
                return {
                    risk_score_range: [data.value as number, 100]
                };
            } else if (data.filterType === 'below_average') {
                return {
                    risk_score_range: [0, data.value as number]
                };
            }
            return {};

        case 'total_exposure':
            // Could filter by companies with exposure above certain threshold
            return {};

        case 'compliance_rate':
            return {
                gst_compliance_status: ['Compliant'],
                epfo_compliance_status: ['Compliant']
            };

        default:
            return {};
    }
};

/**
 * Maps eligibility matrix clicks to filter criteria
 */
const mapEligibilityMatrixClick = (data: ChartDataPoint): Partial<FilterCriteria> => {
    if (data.range) {
        return {
            eligibility_range: data.range as [number, number]
        };
    }
    return {};
};

/**
 * Maps parameter correlation clicks to filter criteria
 */
const mapParameterCorrelationClick = (data: ChartDataPoint): Partial<FilterCriteria> => {
    // This would depend on the specific parameter being clicked
    // Could filter by parameter score ranges or categories
    return {};
};

/**
 * Helper function to map ratings to risk grades
 */
const mapRatingToRiskGrade = (rating: string): string => {
    const ratingToGradeMap: Record<string, string> = {
        'AAA': 'CM1',
        'AA': 'CM1',
        'A': 'CM2',
        'BBB': 'CM2',
        'BB': 'CM3',
        'B': 'CM4',
        'C': 'CM5',
        'D': 'CM5',
        'Not Rated': 'ungraded'
    };

    return ratingToGradeMap[rating] || 'ungraded';
};

/**
 * Combines multiple filter sources into a single FilterCriteria object
 */
export const combineFilters = (
    analyticsFilters: FilterCriteria,
    manualFilters: FilterCriteria,
    searchFilters: FilterCriteria
): FilterCriteria => {
    const combined: FilterCriteria = {};

    // Combine array-based filters using union (OR logic within same field, AND logic between fields)
    const arrayFields: (keyof FilterCriteria)[] = [
        'risk_grades',
        'industries',
        'regions',
        'gst_compliance_status',
        'epfo_compliance_status',
        'audit_qualification_status',
        'processing_status'
    ];

    arrayFields.forEach(field => {
        const analyticsValues = (analyticsFilters[field] as string[]) || [];
        const manualValues = (manualFilters[field] as string[]) || [];
        const searchValues = (searchFilters[field] as string[]) || [];

        const combinedValues = [...new Set([...analyticsValues, ...manualValues, ...searchValues])];

        if (combinedValues.length > 0) {
            (combined as any)[field] = combinedValues;
        }
    });

    // Combine range-based filters using intersection (most restrictive range)
    const rangeFields: (keyof FilterCriteria)[] = [
        'risk_score_range',
        'revenue_range',
        'employee_range',
        'ebitda_margin_range',
        'debt_equity_range',
        'current_ratio_range',
        'eligibility_range',
        'recommended_limit_range'
    ];

    rangeFields.forEach(field => {
        const ranges = [
            analyticsFilters[field] as [number, number],
            manualFilters[field] as [number, number],
            searchFilters[field] as [number, number]
        ].filter(Boolean);

        if (ranges.length > 0) {
            // Find the intersection of all ranges (most restrictive)
            const minValue = Math.max(...ranges.map(r => r[0]));
            const maxValue = Math.min(...ranges.map(r => r[1]));

            if (minValue <= maxValue) {
                (combined as any)[field] = [minValue, maxValue];
            }
        }
    });

    // Combine date range (intersection)
    const dateRanges = [
        analyticsFilters.date_range,
        manualFilters.date_range,
        searchFilters.date_range
    ].filter(Boolean);

    if (dateRanges.length > 0) {
        const startDate = new Date(Math.max(...dateRanges.map(r => r![0].getTime())));
        const endDate = new Date(Math.min(...dateRanges.map(r => r![1].getTime())));

        if (startDate <= endDate) {
            combined.date_range = [startDate, endDate];
        }
    }

    // Combine search query (concatenate with spaces)
    const searchQueries = [
        analyticsFilters.search_query,
        manualFilters.search_query,
        searchFilters.search_query
    ].filter(Boolean);

    if (searchQueries.length > 0) {
        combined.search_query = searchQueries.join(' ');
    }

    return combined;
};

/**
 * Merges a new filter with existing analytics filters
 */
export const mergeAnalyticsFilters = (
    existingFilters: FilterCriteria,
    newFilter: Partial<FilterCriteria>,
    allowMultiSelect: boolean = true
): FilterCriteria => {
    const merged = { ...existingFilters };

    Object.entries(newFilter).forEach(([key, value]) => {
        const filterKey = key as keyof FilterCriteria;

        if (Array.isArray(value)) {
            if (allowMultiSelect && Array.isArray(merged[filterKey])) {
                // Add to existing array if not already present
                const existingArray = merged[filterKey] as any[];
                const newValues = value.filter(v => !existingArray.includes(v));
                (merged as any)[filterKey] = [...existingArray, ...newValues];
            } else {
                // Replace existing array
                (merged as any)[filterKey] = [...value];
            }
        } else {
            // Replace scalar values
            (merged as any)[filterKey] = value;
        }
    });

    return merged;
};

/**
 * Removes a specific filter from analytics filters
 */
export const removeAnalyticsFilter = (
    existingFilters: FilterCriteria,
    filterToRemove: Partial<FilterCriteria>
): FilterCriteria => {
    const updated = { ...existingFilters };

    Object.entries(filterToRemove).forEach(([key, value]) => {
        const filterKey = key as keyof FilterCriteria;

        if (Array.isArray(value) && Array.isArray(updated[filterKey])) {
            // Remove specific values from array
            const existingArray = updated[filterKey] as string[];
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
 * Validates filter combinations and detects conflicts
 */
export const validateFilterCombination = (
    filters: FilterCriteria
): FilterValidationResult => {
    const conflicts: FilterConflict[] = [];
    const warnings: string[] = [];

    // Check for range conflicts
    if (filters.risk_score_range) {
        const [min, max] = filters.risk_score_range;
        if (min > max) {
            conflicts.push({
                type: 'incompatible',
                message: 'Risk score minimum is greater than maximum',
                conflictingFilters: ['risk_score_range'],
                suggestions: ['Adjust the risk score range values']
            });
        }
    }

    // Check for empty result scenarios
    if (filters.risk_grades?.length === 0 && filters.industries?.length === 0) {
        warnings.push('No specific risk grades or industries selected - results may be very broad');
    }

    // Check for potentially conflicting compliance statuses
    if (filters.gst_compliance_status?.includes('Compliant') &&
        filters.gst_compliance_status?.includes('Non-Compliant')) {
        warnings.push('Both compliant and non-compliant GST statuses selected');
    }

    return {
        isValid: conflicts.length === 0,
        conflicts,
        warnings
    };
};

/**
 * Creates a chart click event object
 */
export const createChartClickEvent = (
    chartType: ChartType,
    dataPoint: ChartDataPoint
): ChartClickEvent => {
    return {
        chartType,
        dataPoint,
        filterMapping: mapChartClickToFilter(chartType, dataPoint),
        timestamp: Date.now()
    };
};

/**
 * Checks if two filter criteria are equivalent
 */
export const areFiltersEqual = (
    filters1: FilterCriteria,
    filters2: FilterCriteria
): boolean => {
    const keys1 = Object.keys(filters1).sort();
    const keys2 = Object.keys(filters2).sort();

    if (keys1.length !== keys2.length) return false;

    return keys1.every(key => {
        const value1 = (filters1 as any)[key];
        const value2 = (filters2 as any)[key];

        if (Array.isArray(value1) && Array.isArray(value2)) {
            return value1.length === value2.length &&
                value1.every(v => value2.includes(v));
        }

        return JSON.stringify(value1) === JSON.stringify(value2);
    });
};