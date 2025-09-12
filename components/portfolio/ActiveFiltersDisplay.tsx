"use client";

import React from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterCriteria } from '@/types/portfolio.types';
import {
    DashboardFilterState,
    FilterSource,
    ChartType
} from '@/types/chart-interactions.types';
import { cn } from '@/lib/utils';
import {
    X,
    Filter,
    Search,
    BarChart3,
    Trash2,
    AlertCircle,
    ChevronDown,
    ChevronUp
} from 'lucide-react';

interface ActiveFiltersDisplayProps {
    filterState: DashboardFilterState;
    onRemoveFilter: (source: FilterSource, filterKey: string, value?: any) => void;
    onClearSource: (source: FilterSource) => void;
    onClearAll: () => void;
    className?: string;
    showSourceDetails?: boolean;
    collapsible?: boolean;
}

interface FilterItem {
    key: string;
    label: string;
    value: any;
    displayValue: string;
    source: FilterSource;
    sourceDetails?: {
        chartType?: ChartType;
        timestamp?: number;
    };
}

export function ActiveFiltersDisplay({
    filterState,
    onRemoveFilter,
    onClearSource,
    onClearAll,
    className = '',
    showSourceDetails = true,
    collapsible = false
}: ActiveFiltersDisplayProps) {
    const [isCollapsed, setIsCollapsed] = React.useState(false);

    // Convert filter criteria to display items
    const getFilterItems = React.useCallback((
        filters: FilterCriteria,
        source: FilterSource
    ): FilterItem[] => {
        const items: FilterItem[] = [];

        Object.entries(filters).forEach(([key, value]) => {
            if (!value) return;

            const filterKey = key as keyof FilterCriteria;

            if (Array.isArray(value) && value.length > 0) {
                // Handle array filters (risk_grades, industries, etc.)
                value.forEach(item => {
                    items.push({
                        key: filterKey,
                        label: getFilterLabel(filterKey),
                        value: item,
                        displayValue: getDisplayValue(filterKey, item),
                        source,
                        sourceDetails: getSourceDetails(source, filterKey, item)
                    });
                });
            } else if (Array.isArray(value) && value.length === 2 && typeof value[0] === 'number') {
                // Handle range filters
                const [min, max] = value as [number, number];
                items.push({
                    key: filterKey,
                    label: getFilterLabel(filterKey),
                    value,
                    displayValue: `${min} - ${max}`,
                    source,
                    sourceDetails: getSourceDetails(source, filterKey, value)
                });
            } else if (value instanceof Date || (Array.isArray(value) && value[0] instanceof Date)) {
                // Handle date range filters
                const [startDate, endDate] = value as [Date, Date];
                items.push({
                    key: filterKey,
                    label: getFilterLabel(filterKey),
                    value,
                    displayValue: `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`,
                    source,
                    sourceDetails: getSourceDetails(source, filterKey, value)
                });
            } else if (typeof value === 'string') {
                // Handle string filters (search_query)
                items.push({
                    key: filterKey,
                    label: getFilterLabel(filterKey),
                    value,
                    displayValue: value,
                    source,
                    sourceDetails: getSourceDetails(source, filterKey, value)
                });
            }
        });

        return items;
    }, []);

    // Get source details for analytics filters
    const getSourceDetails = (
        source: FilterSource,
        filterKey: keyof FilterCriteria,
        value: any
    ) => {
        if (source !== 'analytics') return undefined;

        // Map filter keys to chart types
        const chartTypeMap: Record<string, ChartType> = {
            'risk_grades': 'risk-distribution',
            'industries': 'industry-breakdown',
            'gst_compliance_status': 'compliance-heatmap',
            'epfo_compliance_status': 'compliance-heatmap',
            'audit_qualification_status': 'compliance-heatmap',
            'risk_score_range': 'risk-distribution'
        };

        return {
            chartType: chartTypeMap[filterKey],
            timestamp: Date.now()
        };
    };

    // Get human-readable filter labels
    const getFilterLabel = (key: keyof FilterCriteria): string => {
        const labelMap: Record<string, string> = {
            'risk_grades': 'Risk Grade',
            'industries': 'Industry',
            'regions': 'Region',
            'gst_compliance_status': 'GST Status',
            'epfo_compliance_status': 'EPFO Status',
            'audit_qualification_status': 'Audit Status',
            'listing_status': 'Listing',
            'company_status': 'Status',
            'model_type': 'Model',
            'processing_status': 'Processing',
            'overall_grade_categories': 'Grade Category',
            'risk_score_range': 'Risk Score',
            'revenue_range': 'Revenue',
            'employee_range': 'Employees',
            'net_worth_range': 'Net Worth',
            'ebitda_margin_range': 'EBITDA Margin',
            'debt_equity_range': 'Debt/Equity',
            'current_ratio_range': 'Current Ratio',
            'roce_range': 'ROCE',
            'interest_coverage_range': 'Interest Coverage',
            'eligibility_range': 'Eligibility',
            'recommended_limit_range': 'Recommended Limit',
            'date_range': 'Date Range',
            'search_query': 'Search'
        };

        return labelMap[key] || key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    };

    // Get display value for filter items
    const getDisplayValue = (key: keyof FilterCriteria, value: any): string => {
        // Handle specific formatting for different filter types
        switch (key) {
            case 'risk_grades':
                return value.toUpperCase();
            case 'industries':
                return value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            case 'gst_compliance_status':
            case 'epfo_compliance_status':
            case 'audit_qualification_status':
                return value === 'compliant' ? 'Compliant' :
                    value === 'non_compliant' ? 'Non-Compliant' :
                        value.replace(/_/g, ' ').replace(/\b\w/g, (l: string) => l.toUpperCase());
            default:
                return String(value);
        }
    };

    // Get source icon and styling
    const getSourceConfig = (source: FilterSource) => {
        switch (source) {
            case 'analytics':
                return {
                    icon: BarChart3,
                    label: 'Chart',
                    badgeVariant: 'info' as const,
                    color: 'text-blue-600'
                };
            case 'manual':
                return {
                    icon: Filter,
                    label: 'Filter',
                    badgeVariant: 'primary' as const,
                    color: 'text-purple-600'
                };
            case 'search':
                return {
                    icon: Search,
                    label: 'Search',
                    badgeVariant: 'success' as const,
                    color: 'text-green-600'
                };
        }
    };

    // Collect all filter items
    const allFilterItems = React.useMemo(() => {
        const analyticsItems = getFilterItems(filterState.analyticsFilters, 'analytics');
        const manualItems = getFilterItems(filterState.manualFilters, 'manual');
        const searchItems = getFilterItems(filterState.searchFilters, 'search');

        return [...analyticsItems, ...manualItems, ...searchItems];
    }, [filterState, getFilterItems]);

    // Group items by source
    const filtersBySource = React.useMemo(() => {
        const grouped: Record<FilterSource, FilterItem[]> = {
            analytics: [],
            manual: [],
            search: []
        };

        allFilterItems.forEach(item => {
            grouped[item.source].push(item);
        });

        return grouped;
    }, [allFilterItems]);

    // Calculate totals
    const totalFilters = allFilterItems.length;
    const sourceCount = Object.values(filtersBySource).filter(items => items.length > 0).length;

    // Handle filter removal
    const handleRemoveFilter = (item: FilterItem) => {
        onRemoveFilter(item.source, item.key, item.value);
    };

    // Don't render if no filters
    if (totalFilters === 0) {
        return null;
    }

    return (
        <Card className={cn("border-l-4 border-l-blue-500", className)} padding="md">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <Filter className="w-4 h-4 text-blue-600" />
                    <h3 className="font-medium text-neutral-90">
                        Active Filters
                    </h3>
                    <Badge variant="outline" size="sm">
                        {totalFilters}
                    </Badge>
                    {sourceCount > 1 && (
                        <Badge variant="secondary" size="sm">
                            {sourceCount} sources
                        </Badge>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {collapsible && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsCollapsed(!isCollapsed)}
                            className="p-1"
                        >
                            {isCollapsed ? (
                                <ChevronDown className="w-4 h-4" />
                            ) : (
                                <ChevronUp className="w-4 h-4" />
                            )}
                        </Button>
                    )}
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClearAll}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 focus:ring-2 focus:ring-red-500"
                        aria-label="Clear all active filters"
                    >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Clear All
                    </Button>
                </div>
            </div>

            {/* Filter Content */}
            {!isCollapsed && (
                <div className="space-y-4">
                    {/* Filter Items by Source */}
                    {Object.entries(filtersBySource).map(([source, items]) => {
                        if (items.length === 0) return null;

                        const sourceConfig = getSourceConfig(source as FilterSource);
                        const SourceIcon = sourceConfig.icon;

                        return (
                            <div key={source} className="space-y-2">
                                {/* Source Header */}
                                {showSourceDetails && sourceCount > 1 && (
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <SourceIcon className={cn("w-4 h-4", sourceConfig.color)} />
                                            <span className="text-sm font-medium text-neutral-70">
                                                {sourceConfig.label} Filters
                                            </span>
                                            <Badge variant={sourceConfig.badgeVariant} size="sm">
                                                {items.length}
                                            </Badge>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => onClearSource(source as FilterSource)}
                                            className="text-xs text-neutral-60 hover:text-red-600"
                                        >
                                            Clear {sourceConfig.label}
                                        </Button>
                                    </div>
                                )}

                                {/* Filter Items */}
                                <div className="flex flex-wrap gap-1 sm:gap-2">
                                    {items.map((item, index) => (
                                        <div
                                            key={`${item.source}-${item.key}-${index}`}
                                            className="flex items-center gap-1 bg-neutral-10 border border-neutral-30 rounded-md px-2 py-1 text-xs sm:text-sm group hover:bg-neutral-20 transition-colors"
                                        >
                                            {/* Source indicator (small icon) */}
                                            {!showSourceDetails && (
                                                <SourceIcon className={cn("w-3 h-3", sourceConfig.color)} />
                                            )}

                                            {/* Filter content */}
                                            <span className="text-neutral-60 text-xs hidden sm:inline">
                                                {item.label}:
                                            </span>
                                            <span className="text-neutral-90 font-medium text-xs sm:text-sm truncate max-w-[120px] sm:max-w-none">
                                                {item.displayValue}
                                            </span>

                                            {/* Remove button */}
                                            <button
                                                onClick={() => handleRemoveFilter(item)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        handleRemoveFilter(item);
                                                    }
                                                }}
                                                className="ml-1 p-0.5 rounded-sm hover:bg-red-100 text-neutral-50 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                                                title={`Remove ${item.label} filter`}
                                                aria-label={`Remove ${item.label}: ${item.displayValue} filter`}
                                                tabIndex={0}
                                            >
                                                <X className="w-3 h-3" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        );
                    })}

                    {/* Filter Conflicts Warning */}
                    {totalFilters > 5 && (
                        <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                            <AlertCircle className="w-4 h-4 text-yellow-600" />
                            <span className="text-sm text-yellow-700">
                                Many filters applied - results may be limited
                            </span>
                        </div>
                    )}

                    {/* Quick Actions */}
                    {sourceCount > 1 && (
                        <div className="flex items-center gap-2 pt-2 border-t border-neutral-20">
                            <span className="text-xs text-neutral-60">Quick clear:</span>
                            {Object.entries(filtersBySource).map(([source, items]) => {
                                if (items.length === 0) return null;
                                const sourceConfig = getSourceConfig(source as FilterSource);
                                return (
                                    <Button
                                        key={source}
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onClearSource(source as FilterSource)}
                                        className="text-xs h-6 px-2"
                                    >
                                        {sourceConfig.label} ({items.length})
                                    </Button>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}