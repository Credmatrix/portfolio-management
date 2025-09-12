// ============================================================================
// CHART INTERACTION TYPES
// ============================================================================

import { FilterCriteria } from './portfolio.types';

/**
 * Supported chart types for interactive filtering
 */
export type ChartType =
    | 'risk-distribution'
    | 'industry-breakdown'
    | 'compliance-heatmap'
    | 'rating-distribution'
    | 'metrics-card'
    | 'eligibility-matrix'
    | 'parameter-correlation';

/**
 * Chart click event data structure
 */
export interface ChartClickEvent {
    chartType: ChartType;
    dataPoint: ChartDataPoint;
    filterMapping: Partial<FilterCriteria>;
    timestamp: number;
}

/**
 * Generic data point structure for chart clicks
 */
export interface ChartDataPoint {
    label: string;
    value: number | string;
    range?: [number, number];
    category?: string;
    metadata?: Record<string, any>;
}

/**
 * Risk distribution specific click data
 */
export interface RiskDistributionClickData extends ChartDataPoint {
    riskGrade: string; // CM1, CM2, CM3, CM4, CM5, ungraded
    count: number;
    percentage: number;
}

/**
 * Industry breakdown specific click data
 */
export interface IndustryBreakdownClickData extends ChartDataPoint {
    industry: string;
    count: number;
    totalExposure: number;
    averageRiskScore: number;
}

/**
 * Compliance heatmap specific click data
 */
export interface ComplianceClickData extends ChartDataPoint {
    complianceType: 'gst' | 'epfo' | 'audit';
    status: string; // 'Compliant', 'Non-Compliant', 'Unknown'
    count: number;
}

/**
 * Rating distribution specific click data
 */
export interface RatingDistributionClickData extends ChartDataPoint {
    rating: string; // AAA, AA, A, BBB, BB, B, C, D, Not Rated
    count: number;
    percentage: number;
}

/**
 * Metrics card specific click data
 */
export interface MetricsCardClickData extends ChartDataPoint {
    metricType: 'total_companies' | 'average_risk_score' | 'total_exposure' | 'compliance_rate';
    value: number;
    filterType?: 'all' | 'above_average' | 'below_average';
}

/**
 * Filter source types to distinguish between different filter origins
 */
export type FilterSource = 'analytics' | 'manual' | 'search';

/**
 * Enhanced filter criteria with source tracking
 */
export interface SourcedFilterCriteria extends FilterCriteria {
    source: FilterSource;
    sourceDetails?: {
        chartType?: ChartType;
        clickData?: ChartDataPoint;
        timestamp?: number;
    };
}

/**
 * Combined filter state for dashboard
 */
export interface DashboardFilterState {
    analyticsFilters: FilterCriteria;
    manualFilters: FilterCriteria;
    searchFilters: FilterCriteria;
    combinedFilters: FilterCriteria;
    activeChartSelections: Record<ChartType, ChartDataPoint[]> | {};
    filterHistory: SourcedFilterCriteria[];
}

/**
 * Chart interaction handlers
 */
export interface ChartInteractionHandlers {
    onRiskGradeClick?: (data: RiskDistributionClickData) => void;
    onRiskScoreRangeClick?: (range: [number, number]) => void;
    onIndustryClick?: (data: IndustryBreakdownClickData) => void;
    onComplianceStatusClick?: (data: ComplianceClickData) => void;
    onRatingClick?: (data: RatingDistributionClickData) => void;
    onMetricClick?: (data: MetricsCardClickData) => void;
}

/**
 * Visual feedback states for chart elements
 */
export interface ChartElementState {
    isHovered: boolean;
    isSelected: boolean;
    isClickable: boolean;
    isLoading?: boolean;
}

/**
 * Chart selection state for visual feedback
 */
export interface ChartSelectionState {
    selectedRiskGrades: string[];
    selectedIndustries: string[];
    selectedComplianceStatuses: string[];
    selectedRatings: string[];
    selectedRiskScoreRange?: [number, number];
    activeMetricFilters: string[];
}

/**
 * Filter conflict resolution
 */
export interface FilterConflict {
    type: 'incompatible' | 'redundant' | 'empty_result';
    message: string;
    conflictingFilters: string[];
    suggestions: string[];
}

/**
 * Filter validation result
 */
export interface FilterValidationResult {
    isValid: boolean;
    conflicts: FilterConflict[];
    warnings: string[];
    estimatedResultCount?: number;
}