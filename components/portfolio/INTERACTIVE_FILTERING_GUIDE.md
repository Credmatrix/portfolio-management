# Interactive Portfolio Filtering Guide

## Overview

The Interactive Portfolio Dashboard provides multiple ways to filter and explore your portfolio data. This guide explains how to use all filtering capabilities effectively.

## Filtering Methods

### 1. Chart-Based Filtering (Analytics)

#### Risk Distribution Chart
- **Click on Risk Grades**: Filter companies by specific risk levels (CM1-CM7)
- **Multi-Selection**: Hold Ctrl/Cmd while clicking to select multiple risk grades
- **Visual Feedback**: Selected grades are highlighted with distinct colors
- **Keyboard**: Use Tab to navigate, Enter/Space to select

#### Industry Breakdown Chart
- **Click on Industries**: Filter companies by industry sector
- **Pie Chart Segments**: Click on pie slices for industry filtering
- **Bar Chart Elements**: Click on bars for the same functionality
- **Hover Information**: Tooltips show company counts and percentages

#### Compliance Heatmap
- **Click on Status Cells**: Filter by GST, EPFO, or audit compliance status
- **Color Coding**: Green (compliant), Red (non-compliant), Yellow (partial)
- **Multiple Types**: Select different compliance types simultaneously
- **Status Details**: Hover for detailed compliance information

#### Metrics Cards
- **Total Companies**: Click to show all companies (removes other filters)
- **Average Risk Score**: Click to filter companies around the average
- **High Risk**: Click to show only high-risk companies (CM5-CM7, D rating)
- **Compliance Rate**: Click to show compliant companies only

### 2. Manual Filtering (Traditional)

#### Filter Panels
- **Risk Filters**: Dropdown selections for risk grades and score ranges
- **Industry Filters**: Multi-select for industry categories
- **Compliance Filters**: Checkboxes for compliance status
- **Financial Filters**: Range sliders for financial metrics

#### Advanced Filters
- **Date Ranges**: Filter by processing or analysis dates
- **Company Status**: Active, inactive, or pending companies
- **Model Types**: Filter by risk model used for assessment
- **Geographic Regions**: Filter by company location

### 3. Search Filtering

#### Text Search
- **Company Names**: Search by full or partial company names
- **Industry Keywords**: Search within industry descriptions
- **Location Search**: Find companies by city or state
- **Real-time Results**: Search updates as you type

#### Search Operators
- **Exact Match**: Use quotes for exact phrase matching
- **Wildcards**: Use * for partial matching
- **Exclusion**: Use - to exclude terms
- **Boolean Logic**: Combine terms with AND, OR operators

## Filter Combination Rules

### Logical Operations
- **Within Source**: Multiple selections within the same filter type use OR logic
  - Example: Selecting "Manufacturing" AND "Services" shows companies in either industry
- **Between Sources**: Different filter sources use AND logic
  - Example: Risk grade "CM3" AND Industry "Manufacturing" shows only CM3 manufacturing companies

### Filter Priority
1. **Search Filters**: Applied first to narrow the dataset
2. **Analytics Filters**: Applied to search results
3. **Manual Filters**: Applied to the combined result set

### Conflict Resolution
- **Automatic Resolution**: System automatically resolves obvious conflicts
- **User Notification**: Alerts shown for unresolvable conflicts
- **Suggestion Engine**: Recommendations for broadening overly restrictive filters

## Active Filter Management

### Filter Display
- **Source Indicators**: Icons show filter origin (chart, manual, search)
- **Color Coding**: Different colors for different filter sources
- **Value Display**: Clear representation of filter values
- **Count Badges**: Number of active filters per source

### Filter Removal
- **Individual Removal**: X button on each filter badge
- **Source Clearing**: Clear all filters from a specific source
- **Bulk Clearing**: "Clear All" button removes all active filters
- **Keyboard Support**: Use Delete key to remove focused filters

## Performance Tips

### Optimal Usage
- **Start Broad**: Begin with high-level filters, then narrow down
- **Use Analytics First**: Chart-based filters are often more efficient
- **Combine Wisely**: Avoid overly complex filter combinations
- **Monitor Results**: Check result counts to ensure meaningful data

### Large Datasets
- **Pagination**: Results are automatically paginated for performance
- **Loading States**: Visual feedback during data processing
- **Request Optimization**: Duplicate requests are automatically prevented
- **Caching**: Recent filter results are cached for faster access

## Accessibility Guide

### Keyboard Navigation
1. **Tab Order**: Navigate through interactive elements in logical order
2. **Chart Navigation**: Use Tab to reach charts, Enter/Space to interact
3. **Filter Management**: Navigate filter badges and removal buttons
4. **Search Input**: Standard text input with autocomplete support

### Screen Reader Support
- **Chart Descriptions**: Audio descriptions of chart data and interactions
- **Filter Announcements**: Active filters are announced when applied
- **Status Updates**: Loading states and errors are announced
- **Navigation Hints**: Instructions for using interactive features

### Visual Accessibility
- **High Contrast**: All elements work in high contrast mode
- **Focus Indicators**: Clear visual focus outlines
- **Color Independence**: Information conveyed through multiple visual cues
- **Text Scaling**: Interface adapts to user font size preferences

## Troubleshooting

### Common Issues

#### Filters Not Applying
1. **Check Network**: Verify internet connection and API availability
2. **Clear Cache**: Refresh the page to clear any cached state
3. **Validate Data**: Ensure chart data contains valid filter values
4. **Check Permissions**: Verify user has access to filtered data

#### Performance Problems
1. **Simplify Filters**: Reduce the number of active filters
2. **Clear Old Filters**: Remove unused filters to improve performance
3. **Check Dataset Size**: Large result sets may require pagination
4. **Browser Resources**: Close other tabs to free up memory

#### Accessibility Issues
1. **Keyboard Navigation**: Ensure all elements are reachable via Tab key
2. **Screen Reader**: Test with screen reader software
3. **Focus Management**: Verify focus moves logically through interface
4. **ARIA Labels**: Check that labels are descriptive and accurate

### Getting Help
- **Documentation**: Refer to `/docs/API.md` for technical details
- **Architecture**: See `/docs/ARCHITECTURE.md` for system overview
- **Contributing**: Check `/docs/CONTRIBUTING.md` for development guidelines

## Advanced Usage

### Custom Filter Combinations
Create complex queries by combining multiple filter sources:

1. **Start with Search**: Enter company name or keyword
2. **Add Industry Filter**: Click on industry chart segment
3. **Refine by Risk**: Click on risk distribution element
4. **Check Compliance**: Add compliance status filters
5. **Review Results**: Use active filter display to manage selections

### Workflow Optimization
- **Save Common Filters**: Bookmark URLs with filter parameters
- **Export Results**: Use export functionality with active filters
- **Share Views**: Copy URLs to share filtered portfolio views
- **Report Generation**: Generate reports based on current filter state

### Integration with Other Features
- **Report Generation**: Active filters are applied to generated reports
- **Data Export**: Filtered data can be exported to Excel/CSV
- **API Access**: Filter parameters available via REST API
- **Real-time Updates**: Filtered views update automatically with new data

## Best Practices

### User Experience
- **Progressive Disclosure**: Start with overview, drill down to details
- **Clear Intent**: Make filter actions obvious and reversible
- **Immediate Feedback**: Provide instant visual feedback for all interactions
- **Error Prevention**: Guide users away from invalid filter combinations

### Performance
- **Efficient Filtering**: Use analytics filters before manual filters
- **Batch Operations**: Apply multiple filters together when possible
- **Monitor Usage**: Track filter performance and optimize accordingly
- **Cache Strategy**: Leverage caching for frequently used filter combinations

### Accessibility
- **Universal Design**: Ensure features work for all users
- **Multiple Interaction Methods**: Support mouse, keyboard, and touch
- **Clear Communication**: Provide clear instructions and feedback
- **Testing**: Regularly test with assistive technologies