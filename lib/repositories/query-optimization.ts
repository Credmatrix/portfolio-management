/**
 * Database Query Optimization for Portfolio Filtering
 * 
 * This module provides query optimization strategies for enhanced filtering performance,
 * including index recommendations, query caching, and performance monitoring.
 */

import { FilterCriteria, SortCriteria, PaginationParams } from '@/types/portfolio.types'

/**
 * Query optimization strategies based on filter complexity
 */
export interface QueryOptimizationStrategy {
    useAnalyticsTable: boolean
    enableCaching: boolean
    batchSize: number
    indexHints: string[]
    estimatedPerformance: 'fast' | 'medium' | 'slow'
    recommendations: string[]
}

/**
 * Analyze filter criteria and recommend optimization strategy
 */
export function analyzeFilterComplexity(filters: FilterCriteria): QueryOptimizationStrategy {
    const strategy: QueryOptimizationStrategy = {
        useAnalyticsTable: false,
        enableCaching: false,
        batchSize: 100,
        indexHints: [],
        estimatedPerformance: 'fast',
        recommendations: []
    }

    let complexityScore = 0
    const appliedFilters: string[] = []

    // Analyze each filter type and assign complexity scores
    if (filters.risk_grades && filters.risk_grades.length > 0) {
        complexityScore += 1
        appliedFilters.push('risk_grades')
        strategy.indexHints.push('risk_grade_idx')
    }

    if (filters.risk_score_range) {
        complexityScore += 1
        appliedFilters.push('risk_score_range')
        strategy.indexHints.push('risk_score_idx')
    }

    if (filters.sectors && filters.sectors.length > 0) {
        complexityScore += 1
        appliedFilters.push('sectors')
        strategy.indexHints.push('sector_idx')
    }

    if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
        complexityScore += 1
        appliedFilters.push('gst_compliance_status')
        strategy.indexHints.push('gst_compliance_status_idx')
    }

    if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
        complexityScore += 1
        appliedFilters.push('epfo_compliance_status')
        strategy.indexHints.push('epfo_compliance_status_idx')
    }

    // Complex JSONB-based filters (high complexity)
    if (filters.regions && filters.regions.length > 0) {
        complexityScore += 3
        appliedFilters.push('regions')
        strategy.recommendations.push('Consider using analytics table for region filtering')
    }

    if (filters.cities && filters.cities.length > 0) {
        complexityScore += 3
        appliedFilters.push('cities')
        strategy.recommendations.push('Consider using analytics table for city filtering')
    }

    if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
        complexityScore += 4
        appliedFilters.push('gst_compliance')
        strategy.recommendations.push('GST compliance filtering requires analytics table for optimal performance')
    }

    if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
        complexityScore += 4
        appliedFilters.push('epfo_compliance')
        strategy.recommendations.push('EPFO compliance filtering requires analytics table for optimal performance')
    }

    if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
        complexityScore += 4
        appliedFilters.push('audit_qualification')
        strategy.recommendations.push('Audit qualification filtering requires analytics table for optimal performance')
    }

    // Financial metrics filters (very high complexity)
    if (filters.ebitda_margin_range) {
        complexityScore += 5
        appliedFilters.push('ebitda_margin')
        strategy.recommendations.push('Financial metrics filtering requires analytics table')
    }

    if (filters.debt_equity_range) {
        complexityScore += 5
        appliedFilters.push('debt_equity')
        strategy.recommendations.push('Financial metrics filtering requires analytics table')
    }

    if (filters.current_ratio_range) {
        complexityScore += 5
        appliedFilters.push('current_ratio')
        strategy.recommendations.push('Financial metrics filtering requires analytics table')
    }

    if (filters.revenue_range) {
        complexityScore += 4
        appliedFilters.push('revenue')
        strategy.recommendations.push('Revenue filtering benefits from analytics table')
    }

    if (filters.net_worth_range) {
        complexityScore += 4
        appliedFilters.push('net_worth')
        strategy.recommendations.push('Net worth filtering benefits from analytics table')
    }

    // Date range filters (medium complexity)
    if (filters.date_range) {
        complexityScore += 2
        appliedFilters.push('date_range')
        strategy.indexHints.push('completed_at_idx')
    }

    // Search query (medium complexity)
    if (filters.search_query) {
        complexityScore += 2
        appliedFilters.push('search')
        strategy.indexHints.push('company_name_gin_idx', 'industry_gin_idx')
    }

    // Determine strategy based on complexity score
    if (complexityScore >= 15) {
        strategy.useAnalyticsTable = true
        strategy.enableCaching = true
        strategy.batchSize = 50
        strategy.estimatedPerformance = 'slow'
        strategy.recommendations.push('High complexity query - strongly recommend analytics table')
    } else if (complexityScore >= 8) {
        strategy.useAnalyticsTable = true
        strategy.enableCaching = true
        strategy.batchSize = 75
        strategy.estimatedPerformance = 'medium'
        strategy.recommendations.push('Medium complexity query - analytics table recommended')
    } else if (complexityScore >= 4) {
        strategy.enableCaching = true
        strategy.batchSize = 100
        strategy.estimatedPerformance = 'medium'
        strategy.recommendations.push('Consider analytics table for better performance')
    }

    // Additional recommendations based on filter combinations
    if (appliedFilters.length > 6) {
        strategy.recommendations.push('Many filters applied - consider using saved filter presets')
    }

    if (appliedFilters.includes('search') && appliedFilters.length > 3) {
        strategy.recommendations.push('Search combined with many filters may be slow - consider refining search terms')
    }

    return strategy
}

/**
 * Generate optimized query configuration
 */
export function generateOptimizedQueryConfig(
    filters: FilterCriteria,
    sort?: SortCriteria,
    pagination?: PaginationParams
): {
    queryConfig: {
        useAnalyticsTable: boolean
        enableParallelProcessing: boolean
        cacheKey: string
        cacheTTL: number
        queryTimeout: number
    }
    indexRecommendations: string[]
    performanceWarnings: string[]
} {
    const strategy = analyzeFilterComplexity(filters)

    // Generate cache key based on filters
    const filterKeys = Object.keys(filters).sort()
    const filterValues = filterKeys.map(key => {
        const value = filters[key as keyof FilterCriteria]
        if (Array.isArray(value)) {
            return value.sort().join(',')
        }
        return String(value)
    })

    const sortKey = sort ? `${sort.field}_${sort.direction}` : 'default'
    const pageKey = pagination ? `${pagination.page}_${pagination.limit}` : 'default'

    const cacheKey = `portfolio_${filterKeys.join('_')}_${filterValues.join('_')}_${sortKey}_${pageKey}`
        .replace(/[^a-zA-Z0-9_]/g, '_')
        .substring(0, 200) // Limit cache key length

    const queryConfig = {
        useAnalyticsTable: strategy.useAnalyticsTable,
        enableParallelProcessing: strategy.estimatedPerformance === 'slow',
        cacheKey,
        cacheTTL: strategy.enableCaching ? (strategy.estimatedPerformance === 'fast' ? 300 : 600) : 0,
        queryTimeout: strategy.estimatedPerformance === 'slow' ? 30000 : 15000
    }

    const performanceWarnings: string[] = []

    if (strategy.estimatedPerformance === 'slow') {
        performanceWarnings.push('Query may take longer than 5 seconds to complete')
    }

    if (!strategy.useAnalyticsTable && Object.keys(filters).length > 5) {
        performanceWarnings.push('Consider using analytics table for better performance with multiple filters')
    }

    return {
        queryConfig,
        indexRecommendations: strategy.indexHints,
        performanceWarnings
    }
}

/**
 * Database index recommendations for optimal filtering performance
 */
export const RECOMMENDED_INDEXES = {
    // Basic filtering indexes
    risk_grade_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_risk_grade ON document_processing_requests(risk_grade) WHERE status = \'completed\'',
    risk_score_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_risk_score ON document_processing_requests(risk_score) WHERE status = \'completed\'',
    industry_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_industry ON document_processing_requests(industry) WHERE status = \'completed\'',
    completed_at_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_completed_at ON document_processing_requests(completed_at DESC) WHERE status = \'completed\'',

    // Composite indexes for common filter combinations
    risk_industry_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_risk_industry ON document_processing_requests(risk_grade, industry) WHERE status = \'completed\'',
    score_date_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_score_date ON document_processing_requests(risk_score, completed_at DESC) WHERE status = \'completed\'',

    // GIN indexes for text search
    company_name_gin_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_company_name_gin ON document_processing_requests USING gin(to_tsvector(\'english\', company_name)) WHERE status = \'completed\'',
    industry_gin_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_industry_gin ON document_processing_requests USING gin(to_tsvector(\'english\', industry)) WHERE status = \'completed\'',

    // JSONB indexes for complex filtering (if not using analytics table)
    risk_analysis_gin_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_risk_analysis_gin ON document_processing_requests USING gin(risk_analysis) WHERE status = \'completed\'',
    extracted_data_gin_idx: 'CREATE INDEX IF NOT EXISTS idx_portfolio_extracted_data_gin ON document_processing_requests USING gin(extracted_data) WHERE status = \'completed\'',

    // Analytics table indexes (for optimal performance)
    analytics_risk_grade_idx: 'CREATE INDEX IF NOT EXISTS idx_analytics_risk_grade ON portfolio_analytics(risk_grade)',
    analytics_industry_idx: 'CREATE INDEX IF NOT EXISTS idx_analytics_industry ON portfolio_analytics(industry)',
    analytics_region_idx: 'CREATE INDEX IF NOT EXISTS idx_analytics_region ON portfolio_analytics(business_state, registered_state)',
    analytics_compliance_idx: 'CREATE INDEX IF NOT EXISTS idx_analytics_compliance ON portfolio_analytics(gst_compliance_status, epfo_compliance_status, audit_qualification_status)',
    analytics_financial_idx: 'CREATE INDEX IF NOT EXISTS idx_analytics_financial ON portfolio_analytics(ebitda_margin_value, debt_equity_value, current_ratio_value)',
    analytics_composite_idx: 'CREATE INDEX IF NOT EXISTS idx_analytics_composite ON portfolio_analytics(risk_grade, industry, business_state) WHERE processing_status = \'completed\''
}

/**
 * Query performance monitoring
 */
export interface QueryPerformanceMetrics {
    queryId: string
    executionTime: number
    rowsScanned: number
    rowsReturned: number
    cacheHit: boolean
    indexesUsed: string[]
    optimizationApplied: boolean
    performanceGrade: 'A' | 'B' | 'C' | 'D' | 'F'
}

/**
 * Monitor query performance and provide optimization suggestions
 */
export function analyzeQueryPerformance(metrics: QueryPerformanceMetrics): {
    isOptimal: boolean
    suggestions: string[]
    criticalIssues: string[]
} {
    const suggestions: string[] = []
    const criticalIssues: string[] = []

    // Analyze execution time
    if (metrics.executionTime > 5000) {
        criticalIssues.push('Query execution time exceeds 5 seconds')
        suggestions.push('Consider using analytics table or adding appropriate indexes')
    } else if (metrics.executionTime > 2000) {
        suggestions.push('Query execution time could be improved with better indexing')
    }

    // Analyze scan efficiency
    const scanEfficiency = metrics.rowsReturned / Math.max(metrics.rowsScanned, 1)
    if (scanEfficiency < 0.1) {
        criticalIssues.push('Low scan efficiency - scanning too many rows')
        suggestions.push('Add more selective indexes or refine filter criteria')
    } else if (scanEfficiency < 0.3) {
        suggestions.push('Scan efficiency could be improved with better indexing')
    }

    // Check cache utilization
    if (!metrics.cacheHit && metrics.executionTime > 1000) {
        suggestions.push('Enable query caching for frequently used filter combinations')
    }

    // Check index usage
    if (metrics.indexesUsed.length === 0 && metrics.rowsScanned > 100) {
        criticalIssues.push('No indexes used for query with significant row scan')
        suggestions.push('Add appropriate indexes for filter criteria')
    }

    // Performance grade analysis
    if (metrics.performanceGrade === 'F' || metrics.performanceGrade === 'D') {
        criticalIssues.push('Poor query performance grade')
        suggestions.push('Immediate optimization required')
    }

    return {
        isOptimal: criticalIssues.length === 0 && metrics.performanceGrade <= 'B',
        suggestions,
        criticalIssues
    }
}

/**
 * Generate query optimization report
 */
export function generateOptimizationReport(
    filters: FilterCriteria,
    performanceMetrics?: QueryPerformanceMetrics
): {
    summary: string
    strategy: QueryOptimizationStrategy
    indexRecommendations: string[]
    performanceAnalysis?: ReturnType<typeof analyzeQueryPerformance>
    actionItems: Array<{
        priority: 'high' | 'medium' | 'low'
        action: string
        impact: string
    }>
} {
    const strategy = analyzeFilterComplexity(filters)
    const config = generateOptimizedQueryConfig(filters)

    let performanceAnalysis
    if (performanceMetrics) {
        performanceAnalysis = analyzeQueryPerformance(performanceMetrics)
    }

    const actionItems: Array<{
        priority: 'high' | 'medium' | 'low'
        action: string
        impact: string
    }> = []

    // High priority actions
    if (strategy.estimatedPerformance === 'slow' && !strategy.useAnalyticsTable) {
        actionItems.push({
            priority: 'high',
            action: 'Implement analytics table for complex filtering',
            impact: 'Reduce query time from 10+ seconds to under 2 seconds'
        })
    }

    if (performanceAnalysis?.criticalIssues.length) {
        actionItems.push({
            priority: 'high',
            action: 'Address critical performance issues',
            impact: 'Prevent query timeouts and improve user experience'
        })
    }

    // Medium priority actions
    if (strategy.indexHints.length > 0) {
        actionItems.push({
            priority: 'medium',
            action: 'Add recommended database indexes',
            impact: 'Improve query performance by 30-50%'
        })
    }

    if (!strategy.enableCaching && Object.keys(filters).length > 3) {
        actionItems.push({
            priority: 'medium',
            action: 'Enable query result caching',
            impact: 'Reduce repeated query execution time by 80%'
        })
    }

    // Low priority actions
    if (strategy.recommendations.length > 0) {
        actionItems.push({
            priority: 'low',
            action: 'Consider optimization recommendations',
            impact: 'Further improve query performance and maintainability'
        })
    }

    const summary = `Query complexity: ${strategy.estimatedPerformance.toUpperCase()} | ` +
        `Filters applied: ${Object.keys(filters).length} | ` +
        `Analytics table recommended: ${strategy.useAnalyticsTable ? 'YES' : 'NO'} | ` +
        `Caching recommended: ${strategy.enableCaching ? 'YES' : 'NO'}`

    return {
        summary,
        strategy,
        indexRecommendations: config.indexRecommendations,
        performanceAnalysis,
        actionItems
    }
}