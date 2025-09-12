# Interactive Portfolio Dashboard

## Overview

The Interactive Portfolio Dashboard consolidates portfolio analytics and company listings into a unified interface where users can click on any chart element to dynamically filter the portfolio grid. This feature eliminates the need to navigate between separate pages and provides an intuitive way to drill down from high-level metrics to specific company details.

## Key Features

### 🎯 Click-to-Filter Analytics
- **Risk Distribution Charts**: Click on risk grades (AAA, AA, A, etc.) to filter companies by risk level
- **Industry Breakdown**: Click on industry segments to view companies in specific sectors
- **Compliance Heatmap**: Click on compliance status indicators to filter by GST, EPFO, or audit compliance
- **Rating Distribution**: Click on rating categories to filter by credit ratings
- **Metrics Cards**: Click on key metrics (total companies, average scores, etc.) to apply relevant filters

### 🔍 Multi-Source Filtering
- **Analytics Filters**: Applied through chart interactions
- **Manual Filters**: Traditional filter panels and controls
- **Search Filters**: Text-based company search
- **Combined Logic**: All filter sources work together using logical AND operations

### 📊 Visual Feedback
- **Hover States**: Visual indicators when hovering over clickable elements
- **Selection Highlighting**: Active chart elements are highlighted to show current filters
- **Loading States**: Progress indicators during filter application
- **Filter Badges**: Clear display of all active filters with source indicators

### ♿ Accessibility Features
- **Keyboard Navigation**: Full keyboard support with Tab, Enter, and Space key interactions
- **Screen Reader Support**: ARIA labels and roles for assistive technologies
- **Focus Management**: Clear focus indicators and logical tab order
- **High Contrast**: Visual elements work with high contrast modes

## Usage Guide

### Basic Interactions

#### Filtering by Chart Elements
1. **Navigate to Portfolio Dashboard**: Go to `/portfolio` in the application
2. **View Analytics**: The top section displays interactive charts and metrics
3. **Click to Filter**: Click on any chart segment, bar, or metric card
4. **View Results**: The portfolio grid below automatically updates to show filtered results
5. **Clear Filters**: Use the "Clear All" button or individual filter removal options

#### Combining Multiple Filters
1. **Chart Filters**: Click multiple chart elements to combine filters
2. **Manual Filters**: Use traditional filter panels alongside chart interactions
3. **Search**: Add text search to further refine results
4. **View Active Filters**: All active filters are displayed in the filter summary section

### Advanced Features

#### Keyboard Navigation
- **Tab Navigation**: Use Tab key to navigate between interactive elements
- **Activation**: Press Enter or Space to activate chart elements
- **Filter Management**: Navigate and remove filters using keyboard
- **Accessibility**: Full screen reader support with descriptive labels

#### Filter Management
- **Source Indicators**: Filters are color-coded by source (chart, manual, search)
- **Individual Removal**: Remove specific filters without affecting others
- **Bulk Clearing**: Clear all filters from a specific source or all sources
- **Conflict Resolution**: Automatic handling of conflicting filter combinations

#### Performance Optimization
- **Debounced Updates**: Rapid clicks are debounced to prevent excessive API calls
- **Request Cancellation**: In-flight requests are cancelled when new filters are applied
- **Loading States**: Visual feedback during data loading and processing
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices

## Technical Implementation

### Component Architecture
```
InteractiveAnalyticsSection
├── MetricsCard (with click handlers)
├── RiskDistribution (enhanced with interactions)
├── IndustryBreakdown (enhanced with interactions)
├── ComplianceHeatmap (enhanced with interactions)
└── RatingDistribution (enhanced with interactions)

ActiveFiltersDisplay
├── Filter source indicators
├── Individual filter removal
└── Bulk clearing options

PortfolioGrid
├── Receives combined filters
├── Maintains existing functionality
└── Updates based on filter changes
```

### Filter Flow
1. **Chart Click** → Generate FilterCriteria object
2. **Filter Combination** → Merge with existing filters
3. **API Request** → Send combined filters to portfolio endpoint
4. **Grid Update** → Display filtered results
5. **Visual Feedback** → Update chart highlights and filter badges

### Data Types
```typescript
interface FilterCriteria {
  risk_grades?: string[];
  industries?: string[];
  gst_compliance_status?: string[];
  risk_score_range?: [number, number];
  search_query?: string;
  // ... other filter properties
}

interface ChartClickEvent {
  chartType: 'risk-distribution' | 'industry-breakdown' | 'compliance-heatmap';
  dataPoint: any;
  filterMapping: Partial<FilterCriteria>;
  timestamp: number;
}
```

## Best Practices

### User Experience
- **Progressive Disclosure**: Start with overview metrics, drill down to details
- **Clear Feedback**: Always show what filters are active and how to remove them
- **Performance**: Keep interactions responsive with loading states for longer operations
- **Accessibility**: Ensure all functionality is available via keyboard and screen readers

### Development
- **State Management**: Use proper state synchronization between components
- **Error Handling**: Gracefully handle API failures and invalid filter combinations
- **Testing**: Include unit tests for filter logic and integration tests for user flows
- **Performance**: Implement debouncing and request cancellation for optimal performance

## Troubleshooting

### Common Issues

#### Filters Not Applying
- **Check Network**: Verify API endpoints are responding
- **Validate Data**: Ensure chart data contains valid filter values
- **Clear Cache**: Refresh the page to clear any cached state

#### Performance Issues
- **Large Datasets**: Enable pagination and virtual scrolling for large result sets
- **Multiple Filters**: Consider simplifying filter combinations for better performance
- **Network Latency**: Increase debounce delays for slower connections

#### Accessibility Problems
- **Keyboard Navigation**: Ensure all interactive elements have proper tabIndex
- **Screen Readers**: Verify ARIA labels are descriptive and accurate
- **Focus Management**: Check that focus moves logically through the interface

### Support
For technical issues or feature requests, please refer to:
- **API Documentation**: `/docs/API.md`
- **Architecture Guide**: `/docs/ARCHITECTURE.md`
- **Contributing Guidelines**: `/docs/CONTRIBUTING.md`

## Changelog

### Version 1.0.0
- Initial release of interactive dashboard
- Click-to-filter functionality for all chart types
- Multi-source filter combination
- Keyboard navigation and accessibility support
- Responsive design for all device sizes
- Comprehensive documentation and usage guides