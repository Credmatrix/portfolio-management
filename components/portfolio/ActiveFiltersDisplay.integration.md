# ActiveFiltersDisplay Integration Guide

## Overview

The `ActiveFiltersDisplay` component is designed to work seamlessly with the interactive portfolio dashboard, showing all active filters from different sources (analytics charts, manual filters, and search) with clear visual distinction and removal capabilities.

## Integration with Portfolio Page

Here's how to integrate the component into the portfolio page:

```typescript
// app/(dashboard)/portfolio/page.tsx
"use client";

import React, { useState, useCallback } from 'react';
import { InteractiveAnalyticsSection } from '@/components/analytics/InteractiveAnalyticsSection';
import { ActiveFiltersDisplay } from '@/components/portfolio/ActiveFiltersDisplay';
import { PortfolioGrid } from '@/components/portfolio/PortfolioGrid';
import { FilterCriteria } from '@/types/portfolio.types';
import { 
    DashboardFilterState, 
    FilterSource 
} from '@/types/chart-interactions.types';
import { 
    createInitialFilterState,
    updateFilterState,
    removeFiltersFromSource,
    clearFiltersFromSource,
    clearAllFilters
} from '@/lib/utils/filter-combination';

export default function PortfolioPage() {
    const [filterState, setFilterState] = useState<DashboardFilterState>(
        createInitialFilterState()
    );

    // Handle filter changes from analytics interactions
    const handleAnalyticsFiltersChange = useCallback((filters: FilterCriteria) => {
        setFilterState(prevState => 
            updateFilterState(prevState, filters, 'analytics')
        );
    }, []);

    // Handle manual filter changes
    const handleManualFiltersChange = useCallback((filters: FilterCriteria) => {
        setFilterState(prevState => 
            updateFilterState(prevState, filters, 'manual')
        );
    }, []);

    // Handle search filter changes
    const handleSearchFiltersChange = useCallback((filters: FilterCriteria) => {
        setFilterState(prevState => 
            updateFilterState(prevState, filters, 'search')
        );
    }, []);

    // Handle individual filter removal
    const handleRemoveFilter = useCallback((
        source: FilterSource, 
        filterKey: string, 
        value?: any
    ) => {
        const filtersToRemove = { [filterKey]: value ? [value] : undefined };
        setFilterState(prevState => 
            removeFiltersFromSource(prevState, filtersToRemove, source)
        );
    }, []);

    // Handle clearing all filters from a source
    const handleClearSource = useCallback((source: FilterSource) => {
        setFilterState(prevState => 
            clearFiltersFromSource(prevState, source)
        );
    }, []);

    // Handle clearing all filters
    const handleClearAll = useCallback(() => {
        setFilterState(clearAllFilters);
    }, []);

    return (
        <div className="space-y-6">
            {/* Interactive Analytics Section */}
            <InteractiveAnalyticsSection
                onFiltersChange={handleAnalyticsFiltersChange}
                activeFilters={filterState.combinedFilters}
            />

            {/* Active Filters Display */}
            <ActiveFiltersDisplay
                filterState={filterState}
                onRemoveFilter={handleRemoveFilter}
                onClearSource={handleClearSource}
                onClearAll={handleClearAll}
                showSourceDetails={true}
                collapsible={true}
            />

            {/* Portfolio Grid */}
            <PortfolioGrid
                filters={filterState.combinedFilters}
                // ... other props
            />
        </div>
    );
}
```

## Component Features

### 1. Source Distinction
- **Analytics Filters**: Shown with chart icon (BarChart3) and blue color scheme
- **Manual Filters**: Shown with filter icon (Filter) and purple color scheme  
- **Search Filters**: Shown with search icon (Search) and green color scheme

### 2. Filter Display
- Individual filter items are displayed as removable badges
- Each filter shows the filter type (e.g., "Risk Grade", "Industry") and value
- Values are automatically formatted for better readability
- Hover effects show remove buttons for individual filters

### 3. Removal Functionality
- **Individual Removal**: Click X button on any filter badge
- **Source Clearing**: Clear all filters from a specific source (Chart, Filter, Search)
- **Bulk Clear**: Clear all filters from all sources at once

### 4. Visual Feedback
- Filter count badges show total filters and number of sources
- Warning messages when too many filters are applied
- Quick action buttons for multi-source scenarios
- Collapsible interface to save space

### 5. Smart Formatting
- Risk grades: `cm1` → `CM1`
- Industries: `information_technology` → `Information Technology`
- Compliance: `compliant` → `Compliant`, `non_compliant` → `Non-Compliant`
- Ranges: `[20, 80]` → `20 - 80`
- Dates: Formatted as locale-specific date strings

## Props Interface

```typescript
interface ActiveFiltersDisplayProps {
    filterState: DashboardFilterState;
    onRemoveFilter: (source: FilterSource, filterKey: string, value?: any) => void;
    onClearSource: (source: FilterSource) => void;
    onClearAll: () => void;
    className?: string;
    showSourceDetails?: boolean;  // Show source headers and counts
    collapsible?: boolean;        // Allow collapsing the filter display
}
```

## State Management

The component expects a `DashboardFilterState` object with the following structure:

```typescript
interface DashboardFilterState {
    analyticsFilters: FilterCriteria;    // Filters from chart interactions
    manualFilters: FilterCriteria;       // Filters from filter panels
    searchFilters: FilterCriteria;       // Filters from search input
    combinedFilters: FilterCriteria;     // Merged filters for API calls
    activeChartSelections: Record<ChartType, ChartDataPoint[]>;
    filterHistory: SourcedFilterCriteria[];
}
```

## Styling and Theming

The component uses the existing UI design system:
- **Card**: Main container with left border accent
- **Badge**: Filter counts and source indicators
- **Button**: Clear actions and remove buttons
- **Colors**: Fluent Design System color palette
- **Icons**: Lucide React icons for consistency

## Accessibility

- Proper ARIA labels and titles for screen readers
- Keyboard navigation support for all interactive elements
- Clear visual indicators for clickable elements
- High contrast colors for better visibility
- Semantic HTML structure

## Performance Considerations

- Memoized filter item generation to prevent unnecessary re-renders
- Efficient filter removal using React callbacks
- Minimal DOM updates when filters change
- Lazy rendering of filter details when collapsed

## Error Handling

- Graceful handling of invalid filter values
- Fallback display values for unknown filter types
- Safe removal of non-existent filters
- Validation of filter state structure

## Testing

The component includes comprehensive unit tests covering:
- Rendering with different filter combinations
- Source distinction and visual indicators
- Filter removal functionality
- Collapsible behavior
- Accessibility features
- Edge cases and error scenarios

## Migration Notes

When integrating this component:
1. Ensure `DashboardFilterState` is properly initialized
2. Connect filter change handlers to your state management
3. Update existing filter panels to work with the new state structure
4. Test filter combinations and edge cases
5. Verify accessibility with screen readers