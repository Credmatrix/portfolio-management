"use client";

import React, { useState } from 'react';
import { ActiveFiltersDisplay } from './ActiveFiltersDisplay';
import { DashboardFilterState, FilterSource } from '@/types/chart-interactions.types';
import { FilterCriteria } from '@/types/portfolio.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

/**
 * Example usage of ActiveFiltersDisplay component
 * This demonstrates how to integrate the component with filter state management
 */
export function ActiveFiltersDisplayExample() {
    const [filterState, setFilterState] = useState<DashboardFilterState>({
        analyticsFilters: {
            risk_grades: ['CM1', 'CM2'],
            industries: ['manufacturing', 'technology'],
            risk_score_range: [20, 80]
        },
        manualFilters: {
            gst_compliance_status: ['compliant'],
            revenue_range: [1000000, 5000000],
            epfo_compliance_status: ['compliant', 'non_compliant']
        },
        searchFilters: {
            search_query: 'tech company'
        },
        combinedFilters: {},
        activeChartSelections: {},
        filterHistory: []
    });

    // Handle removing individual filters
    const handleRemoveFilter = (source: FilterSource, filterKey: string, value?: any) => {
        setFilterState(prevState => {
            const updatedState = { ...prevState };
            const sourceFilters = { ...updatedState[`${source}Filters`] };

            if (Array.isArray(sourceFilters[filterKey as keyof FilterCriteria])) {
                // Remove specific value from array
                const currentArray = sourceFilters[filterKey as keyof FilterCriteria] as any[];
                const updatedArray = currentArray.filter(item => item !== value);

                if (updatedArray.length === 0) {
                    delete sourceFilters[filterKey as keyof FilterCriteria];
                } else {
                    (sourceFilters as any)[filterKey] = updatedArray;
                }
            } else {
                // Remove entire filter
                delete sourceFilters[filterKey as keyof FilterCriteria];
            }

            updatedState[`${source}Filters`] = sourceFilters;
            return updatedState;
        });
    };

    // Handle clearing all filters from a source
    const handleClearSource = (source: FilterSource) => {
        setFilterState(prevState => ({
            ...prevState,
            [`${source}Filters`]: {}
        }));
    };

    // Handle clearing all filters
    const handleClearAll = () => {
        setFilterState(prevState => ({
            ...prevState,
            analyticsFilters: {},
            manualFilters: {},
            searchFilters: {},
            combinedFilters: {},
            activeChartSelections: {},
            filterHistory: []
        }));
    };

    // Add some sample filters for demonstration
    const addSampleFilters = () => {
        setFilterState(prevState => ({
            ...prevState,
            analyticsFilters: {
                ...prevState.analyticsFilters,
                risk_grades: ['CM3', 'CM4'],
                industries: ['financial_services', 'healthcare']
            },
            manualFilters: {
                ...prevState.manualFilters,
                audit_qualification_status: ['qualified'],
                employee_range: [100, 1000]
            }
        }));
    };

    return (
        <div className="space-y-6 p-6">
            <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">ActiveFiltersDisplay Example</h2>
                <p className="text-neutral-70 mb-4">
                    This example shows how the ActiveFiltersDisplay component works with different filter sources.
                </p>

                <div className="space-y-4">
                    <Button onClick={addSampleFilters} variant="outline">
                        Add More Sample Filters
                    </Button>

                    <ActiveFiltersDisplay
                        filterState={filterState}
                        onRemoveFilter={handleRemoveFilter}
                        onClearSource={handleClearSource}
                        onClearAll={handleClearAll}
                        showSourceDetails={true}
                        collapsible={true}
                    />
                </div>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-medium mb-3">Current Filter State</h3>
                <pre className="bg-neutral-10 p-4 rounded-md text-sm overflow-auto">
                    {JSON.stringify(filterState, null, 2)}
                </pre>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-medium mb-3">Component Features</h3>
                <ul className="space-y-2 text-sm text-neutral-70">
                    <li>• <strong>Source Distinction:</strong> Clearly shows filters from analytics (charts), manual filters, and search</li>
                    <li>• <strong>Individual Removal:</strong> Click the X button on any filter to remove it</li>
                    <li>• <strong>Source Clearing:</strong> Clear all filters from a specific source</li>
                    <li>• <strong>Bulk Clear:</strong> Clear all filters at once</li>
                    <li>• <strong>Visual Feedback:</strong> Different icons and colors for different filter sources</li>
                    <li>• <strong>Collapsible:</strong> Can be collapsed to save space when many filters are active</li>
                    <li>• <strong>Smart Formatting:</strong> Automatically formats filter values for better readability</li>
                    <li>• <strong>Warnings:</strong> Shows warnings when too many filters might limit results</li>
                    <li>• <strong>Quick Actions:</strong> Quick clear buttons for multiple sources</li>
                </ul>
            </Card>

            <Card className="p-6">
                <h3 className="text-lg font-medium mb-3">Integration Notes</h3>
                <div className="space-y-3 text-sm text-neutral-70">
                    <p>
                        <strong>Filter State Management:</strong> The component expects a DashboardFilterState object
                        that tracks filters from different sources (analytics, manual, search).
                    </p>
                    <p>
                        <strong>Event Handlers:</strong> Provide handlers for removing individual filters, clearing
                        source-specific filters, and clearing all filters.
                    </p>
                    <p>
                        <strong>Styling:</strong> The component uses the existing UI design system with Cards, Badges,
                        and Buttons for consistent styling.
                    </p>
                    <p>
                        <strong>Accessibility:</strong> Includes proper ARIA labels, keyboard navigation support,
                        and clear visual indicators.
                    </p>
                </div>
            </Card>
        </div>
    );
}