'use client';

import { useState, useEffect } from 'react';
import {
    PortfolioSummary,
    RiskMetricsCards,
    CreditEligibilityOverview,
    QuickStats,
    ParameterPerformanceCards,
    RecentActivity
} from '@/components/portfolio';
import { PortfolioOverviewMetrics, RiskParameterAnalysis } from '@/lib/services/portfolio-analytics.service';
import { PortfolioCompany } from '@/types/portfolio.types';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function DashboardPage() {
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<PortfolioOverviewMetrics | null>(null);
    const [parameterAnalysis, setParameterAnalysis] = useState<RiskParameterAnalysis | null>(null);
    const [recentCompanies, setRecentCompanies] = useState<PortfolioCompany[]>([]);

    return (
        <ErrorBoundary>
            <div className="p-6 space-y-6">
                {/* Dashboard Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-neutral-90 mb-2">
                        Credit Portfolio Dashboard
                    </h1>
                    <p className="text-neutral-60">
                        Comprehensive overview of your credit portfolio with advanced risk analytics and performance metrics
                    </p>
                </div>

                {/* Portfolio Summary - Main KPIs */}
                {metrics && (
                    <PortfolioSummary
                        metrics={metrics}
                        loading={loading}
                    />
                )}

                {/* Risk Metrics Cards - CM Grade Distribution */}
                {metrics && (
                    <RiskMetricsCards
                        riskDistribution={metrics.risk_distribution}
                        averageRiskScore={metrics.average_risk_score}
                        loading={loading}
                    />
                )}

                {/* Two Column Layout - Credit Eligibility and Recent Activity */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* {metrics && (
                        <CreditEligibilityOverview
                            eligibilitySummary={metrics.eligibility_overview}
                            totalCompanies={metrics.total_companies}
                            loading={loading}
                        />
                    )} */}

                    <RecentActivity
                        recentCompanies={recentCompanies}
                        loading={loading}
                    />
                </div>

                {/* Quick Stats - Industry and Regional Distribution */}
                {metrics && (
                    <QuickStats
                        metrics={metrics}
                        loading={loading}
                    />
                )}

                {/* Parameter Performance Cards - Category-wise Scoring */}
                {parameterAnalysis && (
                    <ParameterPerformanceCards
                        parameterAnalysis={parameterAnalysis}
                        loading={loading}
                    />
                )}
            </div>
        </ErrorBoundary>
    );
}