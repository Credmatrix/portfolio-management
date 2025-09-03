'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { RiskScoreHeatmap, IndustryBreakdownChart } from '@/components/analytics';
import { RiskDistributionData, RiskScoreHeatmapData, IndustryBreakdownData } from '@/types/analytics.types';

interface PortfolioMetrics {
    totalCompanies: number;
    totalExposure: number;
    averageRiskScore: number;
    riskDistribution: RiskDistributionData;
    topPerformers: number;
    highRiskCompanies: number;
}

interface AnalyticsDashboardProps {
    portfolioMetrics: PortfolioMetrics | null;
    riskHeatmapData: RiskScoreHeatmapData | null;
    industryData: IndustryBreakdownData | null;
    onCompanySelect: (companyId: string) => void;
}

export function AnalyticsDashboard({
    portfolioMetrics,
    riskHeatmapData,
    industryData,
    onCompanySelect
}: AnalyticsDashboardProps) {
    const formatCurrency = (value: number) => {
        if (value >= 10000000) {
            return `₹${(value / 10000000).toFixed(1)}Cr`;
        }
        return `₹${value.toFixed(2)}L`;
    };

    return (
        <div className="space-y-6">
            {/* Portfolio Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Portfolio Value</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {portfolioMetrics ? formatCurrency(portfolioMetrics.totalExposure * 10000000) : '₹0'}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xl">💰</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-600">
                            Across {portfolioMetrics?.totalCompanies || 0} companies
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Average Risk Score</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {(portfolioMetrics?.averageRiskScore || 0).toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <span className="text-yellow-600 text-xl">⚡</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="flex space-x-1 h-2">
                            {portfolioMetrics?.riskDistribution && portfolioMetrics.riskDistribution.total > 0 && (
                                <>
                                    <div
                                        className="bg-green-400 rounded"
                                        style={{
                                            width: `${(portfolioMetrics.riskDistribution.cm1 / portfolioMetrics.riskDistribution.total) * 100}%`
                                        }}
                                    />
                                    <div
                                        className="bg-green-300 rounded"
                                        style={{
                                            width: `${(portfolioMetrics.riskDistribution.cm2 / portfolioMetrics.riskDistribution.total) * 100}%`
                                        }}
                                    />
                                    <div
                                        className="bg-yellow-300 rounded"
                                        style={{
                                            width: `${(portfolioMetrics.riskDistribution.cm3 / portfolioMetrics.riskDistribution.total) * 100}%`
                                        }}
                                    />
                                    <div
                                        className="bg-orange-300 rounded"
                                        style={{
                                            width: `${(portfolioMetrics.riskDistribution.cm4 / portfolioMetrics.riskDistribution.total) * 100}%`
                                        }}
                                    />
                                    <div
                                        className="bg-red-300 rounded"
                                        style={{
                                            width: `${(portfolioMetrics.riskDistribution.cm5 / portfolioMetrics.riskDistribution.total) * 100}%`
                                        }}
                                    />
                                    <div
                                        className="bg-gray-300 rounded"
                                        style={{
                                            width: `${(portfolioMetrics.riskDistribution.ungraded / portfolioMetrics.riskDistribution.total) * 100}%`
                                        }}
                                    />
                                </>
                            )}
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Low Risk Companies</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {portfolioMetrics?.topPerformers || 0}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-xl">🏆</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-600">
                            CM1-CM2 grade companies
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">High Risk</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {portfolioMetrics?.highRiskCompanies || 0}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                            <span className="text-red-600 text-xl">⚠️</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-600">
                            CM4-CM5 grade companies
                        </div>
                    </div>
                </Card>
            </div>

            {/* Main Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Distribution Heatmap</h3>
                    {riskHeatmapData && riskHeatmapData.companies.length > 0 ? (
                        <RiskScoreHeatmap
                            data={riskHeatmapData}
                            // onCompanyClick={onCompanySelect}
                            height={400}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <div className="text-gray-400 mb-2">📊</div>
                                <div className="text-gray-500">Risk distribution chart will appear here</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {portfolioMetrics?.totalCompanies === 0 ? 'No companies in portfolio' : 'Data loading...'}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Industry Breakdown</h3>
                    {industryData && industryData.industries.length > 0 ? (
                        <IndustryBreakdownChart
                            data={industryData}
                        // height={400}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center bg-gray-50 rounded-lg">
                            <div className="text-center">
                                <div className="text-gray-400 mb-2">🏭</div>
                                <div className="text-gray-500">Industry breakdown chart will appear here</div>
                                <div className="text-sm text-gray-400 mt-1">
                                    {portfolioMetrics?.totalCompanies === 0 ? 'No companies in portfolio' : 'Data loading...'}
                                </div>
                            </div>
                        </div>
                    )}
                </Card>
            </div>

            {/* Risk Grade Distribution */}
            {portfolioMetrics?.riskDistribution && portfolioMetrics.riskDistribution.total > 0 && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Grade Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {portfolioMetrics.riskDistribution.cm1 || 0}
                            </div>
                            <div className="text-sm text-gray-600">CM1 (Excellent)</div>
                            <div className="text-xs text-gray-500">
                                {(((portfolioMetrics.riskDistribution.cm1 || 0) / portfolioMetrics.riskDistribution.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-500">
                                {portfolioMetrics.riskDistribution.cm2 || 0}
                            </div>
                            <div className="text-sm text-gray-600">CM2 (Good)</div>
                            <div className="text-xs text-gray-500">
                                {(((portfolioMetrics.riskDistribution.cm2 || 0) / portfolioMetrics.riskDistribution.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                                {portfolioMetrics.riskDistribution.cm3 || 0}
                            </div>
                            <div className="text-sm text-gray-600">CM3 (Average)</div>
                            <div className="text-xs text-gray-500">
                                {(((portfolioMetrics.riskDistribution.cm3 || 0) / portfolioMetrics.riskDistribution.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="text-center p-4 bg-orange-50 rounded-lg">
                            <div className="text-2xl font-bold text-orange-600">
                                {portfolioMetrics.riskDistribution.cm4 || 0}
                            </div>
                            <div className="text-sm text-gray-600">CM4 (Poor)</div>
                            <div className="text-xs text-gray-500">
                                {(((portfolioMetrics.riskDistribution.cm4 || 0) / portfolioMetrics.riskDistribution.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                                {portfolioMetrics.riskDistribution.cm5 || 0}
                            </div>
                            <div className="text-sm text-gray-600">CM5 (Critical)</div>
                            <div className="text-xs text-gray-500">
                                {(((portfolioMetrics.riskDistribution.cm5 || 0) / portfolioMetrics.riskDistribution.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="text-2xl font-bold text-gray-600">
                                {portfolioMetrics.riskDistribution.ungraded || 0}
                            </div>
                            <div className="text-sm text-gray-600">Ungraded</div>
                            <div className="text-xs text-gray-500">
                                {(((portfolioMetrics.riskDistribution.ungraded || 0) / portfolioMetrics.riskDistribution.total) * 100).toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}