# Advanced Portfolio Filtering Implementation

This document describes the implementation of advanced filtering and search capabilities for the credit portfolio dashboard.

## Overview

The filtering system provides comprehensive filtering across multiple dimensions:
- Risk-based filtering (grades, scores, categories)
- Business filtering (industry, region, financial metrics)
- Compliance filtering (GST, EPFO, audit status)
- Advanced search across all company data
- Financial performance filtering

## Architecture

### 1. Filter Criteria Interface

```typescript
interface FilterCriteria {
    // Risk-based Filters
    risk_grades?: string[]           // CM1, CM2, CM3, CM4, CM5
    risk_score_range?: [number, number]  // 0-100 percentage
    overall_grade_categories?: number[]  // 1, 2, 3, 4, 5

    // Business Filters
    industries?: string[]            // Technology, Manufacturing, etc.
    regions?: string[]              // Maharashtra, Gujarat, etc.
    revenue_range?: [number, number]
    employee_range?: [number, number]

    // Financial Performance Filters
    ebitda_margin_range?: [number, number]
    debt_equity_range?: [number, number]
    current_ratio_range?: [number, number]

    // Compliance Filters
    gst_compliance_status?: string[]     // Regular, Irregular, Unknown
    epfo_compliance_status?: string[]
    audit_qualification_status?: string[] // Qualified, Unqualified

    // Credit Assessment Filters
    eligibility_range?: [number, number]
    recommended_limit_range?: [number, number]

    // Processing Filters
    processing_status?: ProcessingStatus[]
    date_range?: [Date, Date]
    search_query?: string
}
```

### 2. Filtering Functions

#### Basic Filtering Functions

- `filterByRiskGrade(companies, riskGrades)` - Filter by risk grade (CM1-CM5)
- `filterByIndustry(companies, industries)` - Filter by industry classification
- `filterByRegion(companies, regions)` - Filter by registered/business address state
- `filterByGSTCompliance(companies, statuses)` - Filter by GST compliance status
- `filterByEPFOCompliance(companies, statuses)` - Filter by EPFO compliance status
- `filterByAuditQualification(companies, statuses)` - Filter by audit qualification
- `filterByFinancialMetrics(companies, filters)` - Filter by financial ratios

#### Advanced Functions

- `searchCompaniesAdvanced(companies, query)` - Full-text search across all data
- `applyAdvancedFilters(companies, filters)` - Apply all filter criteria
- `extractFilterOptions(companies)` - Extract unique values for filter dropdowns

### 3. Repository Integration

The `PortfolioRepository` class handles filtering at two levels:

#### Database-Level Filtering
Simple filters are applied at the database level for performance:
- Risk grades
- Risk score ranges
- Industries
- Processing status
- Date ranges
- Recommended limit ranges

#### Client-Side Filtering
Complex filters are applied after data retrieval:
- GST/EPFO compliance status (requires JSONB parsing)
- Financial metrics (requires ratio calculations)
- Audit qualifications
- Regional filtering (requires address parsing)

```typescript
// Example usage in repository
async getPortfolioOverview(filters, sort, pagination) {
    // Apply simple filters at DB level
    let query = this.applyFilters(baseQuery, filters)
    
    // Fetch data
    const { data } = await query
    
    // Apply complex filters client-side
    const filteredCompanies = this.applyClientSideFilters(data, filters)
    
    return { companies: filteredCompanies, ... }
}
```

### 4. API Integration

The `/api/portfolio` endpoint accepts filter parameters:

```
GET /api/portfolio?risk_grades=CM1,CM2&industries=Technology&search=tech
```

#### Supported Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `risk_grades` | string | Comma-separated risk grades |
| `risk_score_min/max` | number | Risk score range |
| `industries` | string | Comma-separated industries |
| `regions` | string | Comma-separated states |
| `processing_status` | string | Comma-separated statuses |
| `limit_min/max` | number | Recommended limit range |
| `ebitda_min/max` | number | EBITDA margin range |
| `debt_equity_min/max` | number | Debt-to-equity range |
| `current_ratio_min/max` | number | Current ratio range |
| `gst_compliance` | string | GST compliance statuses |
| `epfo_compliance` | string | EPFO compliance statuses |
| `audit_status` | string | Audit qualification statuses |
| `search` | string | Search query |
| `page` | number | Page number |
| `limit` | number | Results per page |

### 5. UI Components

#### FilterPanel Component

The enhanced `FilterPanel` provides:
- Search bar with real-time search
- Quick filters for common criteria
- Expandable advanced filters section
- Multi-select checkboxes for compliance status
- Range inputs for financial metrics
- Active filter count display
- Clear all filters functionality

```typescript
<FilterPanel 
    filters={filters} 
    onFilterChange={setFilters}
    onSearch={handleSearch}
/>
```

#### PortfolioGrid Component

Updated to use the new filtering system:
- Converts FilterCriteria to API parameters
- Handles search separately from filters
- Shows results summary and filter status
- Provides clear filters functionality

## Usage Examples

### 1. Filter High-Risk Technology Companies

```typescript
const filters: FilterCriteria = {
    risk_grades: ['CM4', 'CM5'],
    industries: ['Technology', 'Information Technology']
}

const result = await portfolioRepository.getPortfolioOverview(filters)
```

### 2. Find Non-Compliant Companies

```typescript
const filters: FilterCriteria = {
    gst_compliance_status: ['Irregular', 'Non-Filer'],
    epfo_compliance_status: ['Irregular', 'Defaulter']
}
```

### 3. Search with Financial Criteria

```typescript
const filters: FilterCriteria = {
    ebitda_margin_range: [15, 100],
    current_ratio_range: [1.5, 10],
    debt_equity_range: [0, 0.8],
    search_query: 'manufacturing'
}
```

### 4. Regional Analysis

```typescript
const filters: FilterCriteria = {
    regions: ['Maharashtra', 'Gujarat'],
    recommended_limit_range: [10, 1000]
}
```

## Performance Considerations

### Database Optimization
- Simple filters use database indexes
- Complex JSONB queries are minimized
- Pagination reduces data transfer

### Client-Side Optimization
- Filtering functions are optimized for large datasets
- Memoization can be added for repeated filter operations
- Progressive loading for large result sets

### Caching Strategy
- Filter options can be cached
- Common filter combinations can be pre-computed
- Search results can be cached with TTL

## Testing

Comprehensive test suite covers:
- Individual filtering functions
- Combined filter scenarios
- Edge cases and empty results
- Performance with large datasets
- API parameter parsing
- UI component interactions

## Future Enhancements

### Planned Features
1. **Saved Filters** - Allow users to save and reuse filter combinations
2. **Filter Presets** - Pre-defined filters for common scenarios
3. **Advanced Search** - Boolean operators, field-specific search
4. **Export Filtered Data** - Export filtered results to CSV/Excel
5. **Real-time Filters** - WebSocket-based real-time filter updates
6. **Smart Suggestions** - AI-powered filter suggestions based on usage

### Performance Improvements
1. **Elasticsearch Integration** - Full-text search with faceted filtering
2. **Database Views** - Pre-computed filter-friendly views
3. **Lazy Loading** - Progressive filter application
4. **Background Processing** - Async filter computation for complex queries

## Troubleshooting

### Common Issues

1. **Slow Filter Performance**
   - Check if complex filters are being applied at DB level
   - Consider adding database indexes
   - Implement pagination for large result sets

2. **Incorrect Filter Results**
   - Verify JSONB path expressions
   - Check data type conversions
   - Validate filter parameter parsing

3. **UI Filter State Issues**
   - Ensure FilterCriteria interface consistency
   - Check component re-rendering logic
   - Validate filter state synchronization

### Debug Tools

```typescript
// Enable debug logging
const debugFilters = (filters: FilterCriteria) => {
    console.log('Applied filters:', JSON.stringify(filters, null, 2))
}

// Performance monitoring
const measureFilterTime = async (filterFn: Function) => {
    const start = performance.now()
    const result = await filterFn()
    const end = performance.now()
    console.log(`Filter execution time: ${end - start}ms`)
    return result
}
```

## API Documentation

### GET /api/portfolio

Returns filtered portfolio data with pagination and metrics.

#### Query Parameters
See parameter table above for complete list.

#### Response Format
```typescript
{
    companies: PortfolioCompany[],
    total_count: number,
    page: number,
    limit: number,
    has_next: boolean,
    has_previous: boolean,
    metrics?: PortfolioMetrics
}
```

#### Error Responses
- `400` - Invalid filter parameters
- `401` - Unauthorized access
- `500` - Server error during filtering

This implementation provides a robust, scalable filtering system that can handle the complexity of credit portfolio data while maintaining good performance and user experience.