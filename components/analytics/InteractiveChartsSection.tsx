"use client";

import { useState, useCallback, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { IndustryBreakdown } from './IndustryBreakdown';
import { RiskDistribution } from '../portfolio/RiskDistribution';
import { ComplianceHeatmap } from './ComplianceHeatmap';
import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
import {
    IndustryBreakdownClickData,
    RiskDistributionClickData,
    ComplianceClickData,
    ChartType
} from '@/types/chart-interactions.types';
import {
    mapChartClickToFilter,
    createChartClickEvent,
    mergeAnalyticsFilters
} from '@/lib/utils/chart-filter-mapping';
import { FilterCriteria } from '@/types/portfolio.types';
import {
    IndustryBreakdownData,
    RiskDistributionData,
    ComplianceHeatmapData
} from '@/types/analytics.types';

interface InteractiveChartsSectionProps {
    industryData?: IndustryBreakdownData;
    riskData?: RiskDistributionData;
    complianceData?: ComplianceHeatmapData;
    onFiltersChange?: (filters: FilterCriteria) => void;
    isLoading?: boolean;
    className?: string;
}

export function InteractiveChartsSection({
    industryData,
    riskData,
    complianceData,
    onFiltersChange,
    isLoading = false,
    className = ""
}: InteractiveChartsSectionProps) {
    const {
        state,
        updateFilter,
        clearAllFilters,
        isFilterActive
    } = useFilterSystem();

    // Get current filters from state
    const currentFilters = state.filters;

    const [chartInteractions, setChartInteractions] = useState<{
        lastClickedChart: ChartType | null;
        clickHistory: any[];
    }>({
        lastClickedChart: null,
        clickHistory: []
    });

    // Get active selections for visual feedback
    const activeSelections = {
        selectedIndustries: currentFilters.industries || [],
        selectedRiskGrades: currentFilters.riskGrades || [],
        selectedGSTStatuses: currentFilters.gst_compliance_status || [],
        selectedEPFOStatuses: currentFilters.epfo_compliance_status || []
    };

    // Handle industry chart clicks
    const handleIndustryClick = useCallback((data: IndustryBreakdownClickData) => {
        const chartEvent = createChartClickEvent('industry-breakdown', data);
        const newFilter = mapChartClickToFilter('industry-breakdown', data);

        // Merge with existing filters
        const updatedFilters = mergeAnalyticsFilters(currentFilters, newFilter, true);

        // Update individual filters
        Object.entries(updatedFilters).forEach(([key, value]) => {
            updateFilter(key, value);
        });

        // Track interaction
        setChartInteractions(prev => ({
            lastClickedChart: 'industry-breakdown',
            clickHistory: [...prev.clickHistory.slice(-9), chartEvent] // Keep last 10 interactions
        }));

        // Notify parent component
        onFiltersChange?.(updatedFilters);
    }, [currentFilters, updateFilter, onFiltersChange]);

    // Handle risk distribution chart clicks
    const handleRiskGradeClick = useCallback((data: RiskDistributionClickData) => {
        const chartEvent = createChartClickEvent('risk-distribution', data);
        const newFilter = mapChartClickToFilter('risk-distribution', data);

        const updatedFilters = mergeAnalyticsFilters(currentFilters, newFilter, true);

        // Update individual filters
        Object.entries(updatedFilters).forEach(([key, value]) => {
            updateFilter(key, value);
        });

        setChartInteractions(prev => ({
            lastClickedChart: 'risk-distribution',
            clickHistory: [...prev.clickHistory.slice(-9), chartEvent]
        }));

        onFiltersChange?.(updatedFilters);
    }, [currentFilters, updateFilter, onFiltersChange]);

    // Handle risk score range clicks
    const handleRiskScoreRangeClick = useCallback((range: [number, number]) => {
        const newFilter: Partial<FilterCriteria> = {
            risk_score_range: range
        };

        const updatedFilters = mergeAnalyticsFilters(currentFilters, newFilter, false);

        // Update individual filters
        Object.entries(updatedFilters).forEach(([key, value]) => {
            updateFilter(key, value);
        });

        onFiltersChange?.(updatedFilters);
    }, [mergeAnalyticsFilters, onFiltersChange]);

    // Handle compliance chart clicks
    const handleComplianceClick = useCallback((data: ComplianceClickData) => {
        const chartEvent = createChartClickEvent('compliance-heatmap', data);
        const newFilter = mapChartClickToFilter('compliance-heatmap', data);

        const updatedFilters = mergeAnalyticsFilters(currentFilters, newFilter, true);

        // Update individual filters
        Object.entries(updatedFilters).forEach(([key, value]) => {
            updateFilter(key, value);
        });

        setChartInteractions(prev => ({
            lastClickedChart: 'compliance-heatmap',
            clickHistory: [...prev.clickHistory.slice(-9), chartEvent]
        }));

        onFiltersChange?.(updatedFilters);
    }, [currentFilters, updateFilter, onFiltersChange]);

    // Clear all analytics filters
    const handleClearFilters = useCallback(() => {
        clearAllFilters();
        setChartInteractions({
            lastClickedChart: null,
            clickHistory: []
        });
        onFiltersChange?.({});
    }, [clearAllFilters, onFiltersChange]);

    // Check if any filters are active
    const hasActiveFilters = Object.keys(currentFilters).some(key => {
        const value = currentFilters[key as keyof typeof currentFilters];
        return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
    });

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Filter Status Bar */}
            {hasActiveFilters && (
                <Card className="bg-blue-50 border-blue-200">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                            <span className="text-sm font-medium text-blue-900">
                                Interactive filters active
                            </span>
                            <span className="text-xs text-blue-700">
                                ({Object.keys(currentFilters).filter(key => {
                                    const value = currentFilters[key as keyof typeof currentFilters];
                                    return Array.isArray(value) ? value.length > 0 : value !== null && value !== undefined;
                                }).length} filter{Object.keys(currentFilters).length !== 1 ? 's' : ''} applied)
                            </span>
                        </div>
                        <button
                            onClick={handleClearFilters}
                            className="text-xs text-blue-700 hover:text-blue-900 underline"
                        >
                            Clear all filters
                        </button>
                    </div>

                    {/* Active Filter Summary */}
                    <div className="mt-2 flex flex-wrap gap-1">
                        {currentFilters.industries?.map(industry => (
                            <span key={industry} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                Industry: {industry}
                            </span>
                        ))}
                        {currentFilters.riskGrades?.map(grade => (
                            <span key={grade} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                Risk: {grade.toUpperCase()}
                            </span>
                        ))}
                        {currentFilters.gst_compliance_status?.map(status => (
                            <span key={status} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                GST: {status}
                            </span>
                        ))}
                        {currentFilters.epfo_compliance_status?.map(status => (
                            <span key={status} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                EPFO: {status}
                            </span>
                        ))}
                        {/* {currentFilters. && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                                Risk Score: {currentFilters.risk_score_range[0]}-{currentFilters.risk_score_range[1]}
                            </span>
                        )} */}
                    </div>
                </Card>
            )}

            {/* Interactive Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Industry Breakdown Chart */}
                {industryData && (
                    <IndustryBreakdown
                        data={industryData}
                        onIndustryClick={handleIndustryClick}
                        activeIndustries={activeSelections.selectedIndustries}
                        isInteractive={true}
                        isLoading={isLoading}
                    />
                )}

                {/* Risk Distribution Chart */}
                {riskData && (
                    <RiskDistribution
                        data={riskData}
                        onRiskGradeClick={handleRiskGradeClick}
                        onRiskScoreRangeClick={handleRiskScoreRangeClick}
                        activeRiskGrades={activeSelections.selectedRiskGrades}
                        // activeRiskScoreRange={activeSelections.selectedRiskGrades}
                        isInteractive={true}
                        isLoading={isLoading}
                        displayMode="chart"
                    />
                )}
            </div>

            {/* Compliance Heatmap - Full Width */}
            {complianceData && (
                <ComplianceHeatmap
                    data={complianceData}
                    onComplianceStatusClick={handleComplianceClick}
                    activeComplianceStatuses={activeSelections.selectedGSTStatuses}
                    isInteractive={true}
                    isLoading={isLoading}
                    width={800}
                    height={400}
                />
            )}

            {/* Interaction History (Debug/Development) */}
            {process.env.NODE_ENV === 'development' && chartInteractions.clickHistory.length > 0 && (
                <Card className="bg-gray-50">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                        Recent Chart Interactions (Debug)
                    </h4>
                    <div className="space-y-1 max-h-32 overflow-y-auto">
                        {chartInteractions.clickHistory.slice(-5).map((interaction, index) => (
                            <div key={index} className="text-xs text-gray-600">
                                <span className="font-mono">
                                    {new Date(interaction.timestamp).toLocaleTimeString()}
                                </span>
                                {' - '}
                                <span className="font-medium">{interaction.chartType}</span>
                                {' - '}
                                <span>{interaction.dataPoint.label}</span>
                            </div>
                        ))}
                    </div>
                </Card>
            )}

            {/* Usage Instructions */}
            <Card className="bg-neutral-10 border-neutral-20">
                <div className="text-sm text-neutral-70">
                    <h4 className="font-medium text-neutral-90 mb-2">Interactive Charts Guide</h4>
                    <ul className="space-y-1 text-xs">
                        <li>• Click on chart segments to filter the portfolio by that category</li>
                        <li>• Multiple selections are supported - click additional segments to add filters</li>
                        <li>• Use the "Clear all filters" button to reset all interactive selections</li>
                        <li>• Filtered data will be reflected across all dashboard components</li>
                        <li>• Selected segments are highlighted with blue borders and enhanced opacity</li>
                    </ul>
                </div>
            </Card>
        </div>
    );
}