"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { MetricsCard } from './MetricsCard';
import { RiskDistribution } from '@/components/portfolio/RiskDistribution';
import { RatingDistribution } from '@/components/portfolio/RatingDistribution';
import { IndustryBreakdown } from './IndustryBreakdown';
import { ComplianceHeatmap } from './ComplianceHeatmap';
import { FilterCriteria } from '@/types/portfolio.types';
import {
    ChartClickEvent,
    RiskDistributionClickData,
    IndustryBreakdownClickData,
    ComplianceClickData,
    RatingDistributionClickData,
    MetricsCardClickData,
    ChartSelectionState
} from '@/types/chart-interactions.types';
import { mapChartClickToFilter } from '@/lib/utils/chart-filter-mapping';
import { AlertCircle, Download } from 'lucide-react';
import { transformIndustryBreakdownData } from '@/lib/utils/analytics-transformers';
import { PortfolioExportModal } from '@/components/portfolio/PortfolioExportModal';
import { Button } from '@/components/ui/Button';

interface InteractiveAnalyticsSectionProps {
    onFiltersChange: (filters: FilterCriteria) => void;
    activeFilters: FilterCriteria;
    isLoading?: boolean;
    className?: string;
    initialAnalytics?: any;
    initialIndustryBreakdown?: any;
}

export function InteractiveAnalyticsSection({
    onFiltersChange,
    activeFilters,
    isLoading: externalLoading = false,
    className = '',
    initialAnalytics,
    initialIndustryBreakdown
}: InteractiveAnalyticsSectionProps) {
    const [chartSelections, setChartSelections] = useState<ChartSelectionState>({
        selectedRiskGrades: activeFilters.risk_grades || [],
        selectedIndustries: activeFilters.industries || [],
        selectedComplianceStatuses: [],
        selectedRatings: [],
        selectedRiskScoreRange: activeFilters.risk_score_range,
        activeMetricFilters: []
    });

    const [isExportModalOpen, setIsExportModalOpen] = useState(false);

    // Fetch analytics data
    const {
        data: analytics,
        isLoading: analyticsLoading,
        error: analyticsError,
        refetch: refetchAnalytics
    } = useQuery({
        queryKey: ["analytics", "interactive"],
        queryFn: async () => {
            const response = await fetch("/api/portfolio/analytics");
            if (!response.ok) {
                throw new Error(`Failed to fetch analytics: ${response.status}`);
            }
            return response.json();
        },
        retry: 2,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch analytics data
    const {
        data: industryBreakdown,
        isLoading: industryBreakdownLoading,
        error: industryBreakdownError,
        refetch: refetchindustryBreakdownAnalytics
    } = useQuery({
        queryKey: ["analytics", "industry-breakdown"],
        queryFn: async () => {
            const response = await fetch("/api/analytics/industry-breakdown");
            if (!response.ok) {
                throw new Error(`Failed to fetch industryBreakdown: ${response.status}`);
            }
            return response.json();
        },
        retry: 2,
        retryDelay: 1000,
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    const isLoading = analyticsLoading || industryBreakdownLoading || externalLoading;

    // Handle chart click events
    const handleChartClick = useCallback((event: ChartClickEvent) => {
        try {
            // Map chart click to filter criteria
            const newFilters = mapChartClickToFilter(event.chartType, event.dataPoint);

            // Update chart selections for visual feedback
            setChartSelections(prev => {
                const updated = { ...prev };

                switch (event.chartType) {
                    case 'risk-distribution':
                        const riskData = event.dataPoint as RiskDistributionClickData;
                        const riskGrades = [...prev.selectedRiskGrades];
                        const riskIndex = riskGrades.indexOf(riskData.riskGrade);
                        if (riskIndex > -1) {
                            riskGrades.splice(riskIndex, 1);
                        } else {
                            riskGrades.push(riskData.riskGrade);
                        }
                        updated.selectedRiskGrades = riskGrades;
                        break;

                    case 'industry-breakdown':
                        const industryData = event.dataPoint as IndustryBreakdownClickData;
                        const industries = [...prev.selectedIndustries];
                        const industryIndex = industries.indexOf(industryData.industry);
                        if (industryIndex > -1) {
                            industries.splice(industryIndex, 1);
                        } else {
                            industries.push(industryData.industry);
                        }
                        updated.selectedIndustries = industries;
                        break;

                    case 'compliance-heatmap':
                        const complianceData = event.dataPoint as ComplianceClickData;
                        const complianceKey = `${complianceData.complianceType}_${complianceData.status}`;
                        const complianceStatuses = [...prev.selectedComplianceStatuses];
                        const complianceIndex = complianceStatuses.indexOf(complianceKey);
                        if (complianceIndex > -1) {
                            complianceStatuses.splice(complianceIndex, 1);
                        } else {
                            complianceStatuses.push(complianceKey);
                        }
                        updated.selectedComplianceStatuses = complianceStatuses;
                        break;

                    case 'rating-distribution':
                        const ratingData = event.dataPoint as RatingDistributionClickData;
                        const ratings = [...prev.selectedRatings];
                        const ratingIndex = ratings.indexOf(ratingData.rating);
                        if (ratingIndex > -1) {
                            ratings.splice(ratingIndex, 1);
                        } else {
                            ratings.push(ratingData.rating);
                        }
                        updated.selectedRatings = ratings;
                        break;

                    case 'metrics-card':
                        const metricData = event.dataPoint as MetricsCardClickData;
                        const metricKey = `${metricData.metricType}_${metricData.filterType || 'all'}`;
                        const metricFilters = [...prev.activeMetricFilters];
                        const metricIndex = metricFilters.indexOf(metricKey);
                        if (metricIndex > -1) {
                            metricFilters.splice(metricIndex, 1);
                        } else {
                            metricFilters.push(metricKey);
                        }
                        updated.activeMetricFilters = metricFilters;
                        break;
                }

                return updated;
            });

            // Combine with existing filters and notify parent
            const combinedFilters = {
                ...activeFilters,
                ...newFilters
            };

            onFiltersChange(combinedFilters);
        } catch (error) {
            console.error('Error handling chart click:', error);
        }
    }, [activeFilters, onFiltersChange]);

    // Keyboard navigation support
    const handleKeyboardInteraction = useCallback((
        event: React.KeyboardEvent,
        clickHandler: () => void
    ) => {
        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            clickHandler();
        }
    }, []);

    // Specific chart click handlers
    const handleRiskGradeClick = useCallback((data: RiskDistributionClickData) => {
        const event: ChartClickEvent = {
            chartType: 'risk-distribution',
            dataPoint: data,
            filterMapping: { risk_grades: [data.riskGrade] },
            timestamp: Date.now()
        };
        handleChartClick(event);
    }, [handleChartClick]);

    const handleIndustryClick = useCallback((data: IndustryBreakdownClickData) => {
        const event: ChartClickEvent = {
            chartType: 'industry-breakdown',
            dataPoint: data,
            filterMapping: { sectors: [data.industry] },
            timestamp: Date.now()
        };
        handleChartClick(event);
    }, [handleChartClick]);

    const handleComplianceClick = useCallback((data: ComplianceClickData) => {
        const event: ChartClickEvent = {
            chartType: 'compliance-heatmap',
            dataPoint: data,
            filterMapping: {
                [`${data.complianceType}_compliance_status`]: [data.status]
            },
            timestamp: Date.now()
        };
        handleChartClick(event);
    }, [handleChartClick]);

    const handleRatingClick = useCallback((data: RatingDistributionClickData) => {
        const event: ChartClickEvent = {
            chartType: 'rating-distribution',
            dataPoint: data,
            filterMapping: mapChartClickToFilter('rating-distribution', data),
            timestamp: Date.now()
        };
        handleChartClick(event);
    }, [handleChartClick]);

    const handleMetricClick = useCallback((data: MetricsCardClickData) => {
        const event: ChartClickEvent = {
            chartType: 'metrics-card',
            dataPoint: data,
            filterMapping: mapChartClickToFilter('metrics-card', data),
            timestamp: Date.now()
        };
        handleChartClick(event);
    }, [handleChartClick]);

    // Prepare metrics data
    const metricsData = useMemo(() => {
        if (!analytics) return [];

        const highRiskCount = (analytics.risk_distribution?.cm5 || 0) +
            (analytics.risk_distribution?.cm6 || 0) +
            (analytics.risk_distribution?.cm7 || 0) +
            (analytics.rating_distribution?.D || 0);

        const complianceRate = analytics.compliance_overview ?
            ((analytics.compliance_overview.gst_compliance?.compliant || 0) +
                (analytics.compliance_overview.epfo_compliance?.compliant || 0)) /
            ((analytics.total_companies || 1) * 2) * 100 : 0;

        return [
            {
                label: 'Total Companies',
                value: analytics.total_companies || 0,
                icon: '🏢',
                color: 'blue' as const,
                metricType: 'total_companies' as const,
                filterType: 'all' as const,
                clickable: false
            },
            {
                label: 'Accounts Receivable',
                value: analytics.total_exposure * 0.13,
                subtitle: `as on ${new Date().toDateString()}`,
                format: 'currency' as const,
                icon: '💰',
                color: 'green' as const,
                metricType: 'total_exposure' as const,
                filterType: 'all' as const,
                clickable: false
            },
            {
                label: 'Approved Limit',
                value: analytics.total_exposure,
                format: 'currency' as const,
                icon: '💰',
                color: 'green' as const,
                metricType: 'total_exposure' as const,
                filterType: 'all' as const,
                clickable: false
            },
            {
                label: 'Avg Risk Score',
                value: analytics.average_risk_score || 0,
                format: 'number' as const,
                icon: '📊',
                color: 'yellow' as const,
                metricType: 'average_risk_score' as const,
                filterType: 'all' as const,
                clickable: false
            },
            {
                label: 'Adhoc limits',
                value: Math.round(highRiskCount * 0.6),
                // subtitle: 'CM5-CM7 + D rating',
                icon: '⚠️',
                color: 'red' as const,
                metricType: 'total_companies' as const,
                filterType: 'above_average' as const,
                clickable: false
            },
            {
                label: 'Watchlist',
                value: Math.round(highRiskCount * 0.1),
                // subtitle: 'CM5-CM7 + D rating',
                icon: '⚠️',
                color: 'red' as const,
                metricType: 'total_companies' as const,
                filterType: 'above_average' as const,
                clickable: false
            },
            {
                label: 'Compliance Rate',
                value: complianceRate,
                format: 'percentage' as const,
                icon: '✅',
                color: complianceRate > 80 ? 'green' : complianceRate > 60 ? 'yellow' : 'red',
                metricType: 'compliance_rate' as const,
                filterType: 'all' as const,
                clickable: false
            }
        ];
    }, [analytics]);

    // Error state
    if (analyticsError && !analytics) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Alert variant="error">
                    <AlertCircle className="w-4 h-4" />
                    <div>
                        <h4 className="font-medium">Failed to load analytics</h4>
                        <p className="text-sm mt-1">
                            {analyticsError.message || 'Unable to fetch analytics data'}
                        </p>
                        <button
                            onClick={() => refetchAnalytics()}
                            className="text-sm underline mt-2 hover:no-underline"
                        >
                            Try again
                        </button>
                    </div>
                </Alert>
            </div>
        );
    }

    // Loading state
    if (isLoading && !analytics) {
        return (
            <div className={`space-y-6 ${className}`}>
                <Card className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="space-y-2">
                                <Skeleton className="h-4 w-24" />
                                <Skeleton className="h-8 w-16" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        ))}
                    </div>
                </Card>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-64 w-full" />
                    </Card>
                    <Card className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-64 w-full" />
                    </Card>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <Card className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-64 w-full" />
                    </Card>
                    <Card className="p-6">
                        <Skeleton className="h-6 w-32 mb-4" />
                        <Skeleton className="h-64 w-full" />
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            {/* Loading overlay for data refresh */}
            {isLoading && analytics && (
                <div className="fixed top-4 right-4 z-50">
                    <div className="bg-white border border-neutral-30 rounded-lg shadow-lg p-3 flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
                        <span className="text-sm text-neutral-70">Updating analytics...</span>
                    </div>
                </div>
            )}

            {/* Key Metrics Cards with Export Button */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-neutral-90">Portfolio Overview</h2>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center gap-2"
                    >
                        <Download className="w-4 h-4" />
                        Export Portfolio
                    </Button>
                </div>

                <MetricsCard
                    title=""
                    metrics={metricsData}
                    onMetricClick={handleMetricClick}
                    activeMetricFilters={chartSelections.activeMetricFilters}
                    isInteractive={true}
                    isLoading={isLoading}
                />
            </div>

            {/* Distribution Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <RiskDistribution
                    data={analytics?.risk_distribution}
                    onRiskGradeClick={handleRiskGradeClick}
                    activeRiskGrades={chartSelections.selectedRiskGrades}
                    isInteractive={true}
                    isLoading={isLoading}
                />
                <RatingDistribution
                    data={analytics?.rating_distribution}
                    onRatingClick={handleRatingClick}
                    activeRatings={chartSelections.selectedRatings}
                    isInteractive={true}
                    isLoading={isLoading}
                />
            </div>

            {/* Industry and Compliance Analysis */}
            {industryBreakdown && <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <IndustryBreakdown
                    data={transformIndustryBreakdownData(industryBreakdown.data)}
                    onIndustryClick={handleIndustryClick}
                    activeIndustries={chartSelections.selectedIndustries}
                    isInteractive={true}
                    showRiskOverlay={true}
                />
                <ComplianceHeatmap
                    data={analytics?.compliance_heatmap}
                    onComplianceStatusClick={handleComplianceClick}
                    activeComplianceStatuses={chartSelections.selectedComplianceStatuses}
                    isInteractive={true}
                />
            </div>
            }

            {/* Export Modal */}
            <PortfolioExportModal
                isOpen={isExportModalOpen}
                onClose={() => setIsExportModalOpen(false)}
                activeFilters={activeFilters}
            />

            {/* Interactive Feedback */}
            {/* {Object.values(chartSelections).some(selection =>
                Array.isArray(selection) ? selection.length > 0 : selection !== undefined
            ) && (
                    <Card className="p-4 bg-blue-50 border-blue-200">
                        <div className="flex items-center gap-2 text-blue-700">
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">
                                 Filters applied - portfolio grid will update automatically
                            </span>
                        </div>
                    </Card>
                )} */}
        </div>
    );
}