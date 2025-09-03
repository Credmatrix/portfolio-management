/**
 * Analytics Services Index
 * 
 * Exports all analytics services for easy importing throughout the application.
 */

export { PortfolioAnalyticsService } from './portfolio-analytics.service';
export { FinancialAnalyticsService } from './financial-analytics.service';
// export { PortfolioAnalyticsService } from './portfolio-analytics.service';

// Export types for external use
export type {
    FinancialTrend,
    PeerComparisonResult,
    PortfolioExposureAnalysis,
    RiskModelPerformance,
    BenchmarkAnalysis,
    CreditEligibilityTrends
} from './financial-analytics.service';