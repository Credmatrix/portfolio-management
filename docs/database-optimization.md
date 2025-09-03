# Database Optimization Guide

## Portfolio Query Performance Issues

### Problem
The portfolio metrics calculation was timing out due to inefficient queries that:
1. Selected all columns (`SELECT *`) instead of only needed fields
2. Fetched all records without limits
3. Lacked proper database indexes

### Solutions Implemented

#### 1. Query Optimization
- Changed from `SELECT *` to specific columns: `risk_score, recommended_limit, industry, region, company_name`
- Added reasonable limits (5000 records for calculations, 10000 max)
- Used database count queries for total counts instead of fetching all data

#### 2. Error Handling
- Added try-catch blocks with fallback default metrics
- Improved error messages for debugging

### Recommended Database Indexes

Add these indexes to improve query performance:

```sql
-- Primary index for status filtering (most important)
CREATE INDEX IF NOT EXISTS idx_document_processing_requests_status 
ON document_processing_requests(status);

-- Composite index for common filter combinations
CREATE INDEX IF NOT EXISTS idx_document_processing_requests_status_industry 
ON document_processing_requests(status, industry);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_status_region 
ON document_processing_requests(status, region);

-- Index for risk score calculations
CREATE INDEX IF NOT EXISTS idx_document_processing_requests_risk_score 
ON document_processing_requests(risk_score) 
WHERE status = 'completed';

-- Index for recommended limit calculations
CREATE INDEX IF NOT EXISTS idx_document_processing_requests_recommended_limit 
ON document_processing_requests(recommended_limit) 
WHERE status = 'completed';
```

### Performance Monitoring

Monitor these queries in your database:
1. Portfolio overview queries
2. Metrics calculation queries
3. Filter-heavy queries

### Additional Recommendations

1. **Pagination**: Always use LIMIT and OFFSET for large datasets
2. **Caching**: Consider caching frequently accessed metrics
3. **Database Connection Pooling**: Ensure proper connection management
4. **Query Analysis**: Use EXPLAIN ANALYZE to identify slow queries