# Portfolio Repository

The Portfolio Repository provides a comprehensive data access layer for managing credit portfolio data using Supabase integration. It implements all the core functionality needed for the credit portfolio dashboard.

## Features

### 1. Portfolio Overview (`getPortfolioOverview`)
- **Pagination**: Efficient handling of large datasets (300+ companies)
- **Filtering**: Comprehensive filtering across risk, business, financial, and compliance criteria
- **Sorting**: Flexible sorting by any field
- **Metrics**: Automatic calculation of portfolio metrics and analytics

### 2. Company Details (`getCompanyByRequestId`)
- **Complete Data**: Returns full company profile with all extracted data and risk analysis
- **Related Companies**: Finds similar companies in the same industry for comparison
- **Error Handling**: Proper error handling for missing companies

### 3. Search Functionality (`searchCompanies`)
- **Full-Text Search**: Search across company names, CIN, PAN, and other extracted data
- **Performance Tracking**: Measures and reports search performance
- **Combined Filtering**: Supports search with additional filters

### 4. Data Updates (`updateCompanyData`)
- **Selective Updates**: Update specific fields without affecting others
- **Validation**: Proper data validation and error handling
- **Audit Trail**: Automatic timestamp updates for change tracking

## Usage Examples

### Basic Portfolio Overview
```typescript
import { portfolioRepository } from '@/lib/repositories'

// Get first page of companies
const result = await portfolioRepository.getPortfolioOverview()
console.log(`Found ${result.total_count} companies`)
```

### Advanced Filtering
```typescript
const filters = {
    risk_grades: ['CM1', 'CM2'],
    industries: ['Manufacturing'],
    risk_score_range: [70, 100],
    processing_status: ['completed']
}

const result = await portfolioRepository.getPortfolioOverview(filters)
```

### Company Search
```typescript
const searchResults = await portfolioRepository.searchCompanies(
    'manufacturing company',
    { processing_status: ['completed'] },
    { page: 1, limit: 20 }
)
```

### Get Company Details
```typescript
const company = await portfolioRepository.getCompanyByRequestId('req-12345')
console.log(company.company.company_name)
console.log(company.related_companies?.length)
```

### Update Company Data
```typescript
const updated = await portfolioRepository.updateCompanyData('req-12345', {
    risk_score: 85,
    risk_grade: 'CM2'
})
```

## Filter Criteria

The repository supports comprehensive filtering through the `FilterCriteria` interface:

### Risk-Based Filters
- `risk_grades`: Filter by CM grades (CM1, CM2, CM3, CM4, CM5)
- `risk_score_range`: Filter by risk score percentage range
- `overall_grade_categories`: Filter by grade category numbers

### Business Filters
- `industries`: Filter by industry sectors
- `regions`: Filter by geographic regions
- `revenue_range`: Filter by company revenue
- `employee_range`: Filter by employee count

### Financial Performance Filters
- `ebitda_margin_range`: Filter by EBITDA margin
- `debt_equity_range`: Filter by debt-to-equity ratio
- `current_ratio_range`: Filter by current ratio

### Compliance Filters
- `gst_compliance_status`: Filter by GST compliance status
- `epfo_compliance_status`: Filter by EPFO compliance status
- `audit_qualification_status`: Filter by audit qualification status

### Credit Assessment Filters
- `eligibility_range`: Filter by credit eligibility amount
- `recommended_limit_range`: Filter by recommended credit limit

### Processing Filters
- `processing_status`: Filter by document processing status
- `date_range`: Filter by date ranges
- `search_query`: Text search query

## Portfolio Metrics

The repository automatically calculates comprehensive portfolio metrics:

### Risk Distribution
- Count and percentage of companies by CM grade
- Overall risk distribution across the portfolio

### Industry Breakdown
- Company count and exposure by industry
- Average risk scores by industry sector

### Regional Distribution
- Geographic distribution of companies
- Risk concentration by region

### Compliance Summary
- GST and EPFO compliance statistics
- Audit qualification status summary

### Eligibility Summary
- Total eligible credit amounts
- Risk-adjusted exposure calculations

## Error Handling

The repository implements comprehensive error handling:

- **Database Errors**: Proper error messages for database connection issues
- **Not Found**: Specific handling for missing companies
- **Validation Errors**: Input validation with descriptive error messages
- **Performance Issues**: Timeout and performance monitoring

## Performance Considerations

### Pagination
- Efficient offset-based pagination for large datasets
- Configurable page sizes (default: 20, max recommended: 100)

### Indexing
- Leverages database indexes on key fields (risk_grade, industry, status)
- Optimized queries for common filter combinations

### Caching
- Repository is designed to work with caching layers
- Metrics calculations can be cached for improved performance

## Security

### Authentication
- All methods require authenticated Supabase client
- Row-level security policies enforced at database level

### Data Access
- Only returns data accessible to the authenticated user
- Proper organization-level data isolation

### Audit Logging
- All data modifications are logged with timestamps
- User context preserved for audit trails

## Testing

The repository includes comprehensive test coverage:

### Unit Tests
- Mock-based testing for all public methods
- Error condition testing
- Filter and pagination logic validation

### Integration Tests
- Real database integration testing
- Performance benchmarking
- End-to-end workflow validation

## Dependencies

- `@supabase/ssr`: Server-side Supabase client
- `@/types/portfolio.types`: TypeScript type definitions
- `@/types/database.types`: Database schema types
- `@/lib/supabase/server`: Supabase server configuration

## Future Enhancements

### Planned Features
- **Caching Layer**: Redis integration for improved performance
- **Search Indexing**: Elasticsearch integration for advanced search
- **Real-time Updates**: WebSocket support for live data updates
- **Batch Operations**: Bulk update and delete operations
- **Export Functions**: CSV/Excel export capabilities

### Performance Optimizations
- **Query Optimization**: Advanced query optimization for complex filters
- **Connection Pooling**: Database connection pooling for high load
- **Materialized Views**: Pre-calculated metrics for faster dashboard loading