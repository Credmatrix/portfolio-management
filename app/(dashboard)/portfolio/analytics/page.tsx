'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Tabs } from '@/components/ui/Tabs';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
    ParameterScoreRadar,
    BenchmarkComparison,
    AnalyticsDashboard,
    RiskAnalyticsDashboard,
    TrendAnalysis,
    BenchmarkingView,
    RiskConcentrationAnalysis,
    ParameterCorrelationAnalysis
} from '@/components/analytics';
import {
    RiskDistributionData,
    RiskScoreHeatmapData,
    ParameterScoreRadarData,
    IndustryBreakdownData,
    BenchmarkComparisonData
} from '@/types/analytics.types';
import { transformIndustryBreakdownData, transformOverviewData, transformRiskDistributionData } from '@/lib/utils/analytics-transformers';

interface AnalyticsPageProps { }

interface PortfolioMetrics {
    totalCompanies: number;
    totalExposure: number;
    averageRiskScore: number;
    riskDistribution: RiskDistributionData;
    topPerformers: number;
    highRiskCompanies: number;
}

interface ModelPerformanceMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    totalPredictions: number;
    correctPredictions: number;
    lastUpdated: string;
    modelVersion: string;
    validationResults: {
        truePositives: number;
        trueNegatives: number;
        falsePositives: number;
        falseNegatives: number;
    };
    performanceTrends: Array<{
        date: string;
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
    }>;
    industryPerformance: Array<{
        industry: string;
        accuracy: number;
        sampleSize: number;
        confidence: number;
    }>;
    riskGradeAccuracy: Array<{
        grade: string;
        accuracy: number;
        sampleSize: number;
        predictedCorrectly: number;
    }>;
}

export default function AnalyticsPage({ }: AnalyticsPageProps) {
    const [activeTab, setActiveTab] = useState('overview');
    const [timeRange, setTimeRange] = useState('12m');
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    const [selectedRiskGrade, setSelectedRiskGrade] = useState('all');
    const [loading, setLoading] = useState(true);

    // Data states
    const [portfolioMetrics, setPortfolioMetrics] = useState<PortfolioMetrics | null>(null);
    const [riskHeatmapData, setRiskHeatmapData] = useState<RiskScoreHeatmapData | null>(null);
    const [industryData, setIndustryData] = useState<IndustryBreakdownData | null>(null);


    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
    const [radarData, setRadarData] = useState<ParameterScoreRadarData | null>(null);
    const [benchmarkData, setBenchmarkData] = useState<BenchmarkComparisonData | null>(null);

    useEffect(() => {
        loadAnalyticsData();
    }, [timeRange, selectedIndustry, selectedRiskGrade]);

    const loadAnalyticsData = async () => {
        setLoading(false);
        try {
            // Load portfolio overview metrics
            const metricsResponse = await fetch(`/api/analytics/overview?timeRange=${timeRange}&industry=${selectedIndustry}&riskGrade=${selectedRiskGrade}`);
            if (metricsResponse.ok) {
                const metricsResult = await metricsResponse.json();
                if (metricsResult.success) {
                    setPortfolioMetrics(transformOverviewData(metricsResult.data));
                }
            }

            // Load risk distribution heatmap data
            const heatmapResponse = await fetch(`/api/analytics/risk-distribution?timeRange=${timeRange}&industry=${selectedIndustry}`);
            if (heatmapResponse.ok) {
                const heatmapResult = await heatmapResponse.json();
                if (heatmapResult.success) {
                    setRiskHeatmapData(transformRiskDistributionData(heatmapResult.data));
                }
            }

            // Load industry breakdown
            const industryResponse = await fetch(`/api/analytics/industry-breakdown?timeRange=${timeRange}&riskGrade=${selectedRiskGrade}`);
            if (industryResponse.ok) {
                const industryResult = await industryResponse.json();
                if (industryResult.success) {
                    setIndustryData(transformIndustryBreakdownData(industryResult.data));
                }
            }

            // Load model performance metrics
            // const modelResponse = await fetch(`/api/analytics/model-performance?timeRange=${timeRange}`);
            // if (modelResponse.ok) {
            //     const modelResult = await modelResponse.json();
            //     if (modelResult.success) {
            //         setModelPerformance(transformModelPerformanceData(modelResult.data));
            //     }
            // }

        } catch (error) {
            console.error('Error loading analytics data:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadCompanyDetails = async (companyId: string) => {
        try {
            // Load parameter radar data for selected company
            const radarResponse = await fetch(`/api/analytics/risk-parameters?companyId=${companyId}`);
            const radarData = await radarResponse.json();
            setRadarData(radarData);

            // Load benchmark comparison data
            const benchmarkResponse = await fetch(`/api/analytics/benchmark-comparison?companyId=${companyId}`);
            const benchmarkData = await benchmarkResponse.json();
            setBenchmarkData(benchmarkData);

            setSelectedCompanyId(companyId);
        } catch (error) {
            console.error('Error loading company details:', error);
        }
    };

    const tabs = [
        { id: 'overview', label: 'Portfolio Overview', icon: '📊' },
        { id: 'risk', label: 'Risk Analytics', icon: '⚠️' },
        // { id: 'performance', label: 'Model Performance', icon: '🎯' },
        // { id: 'trends', label: 'Trend Analysis', icon: '📈' },
        // { id: 'benchmarking', label: 'Benchmarking', icon: '🏆' },
        { id: 'concentration', label: 'Risk Concentration', icon: '🎯' },
        // { id: 'correlation', label: 'Parameter Correlation', icon: '🔗' }
    ];

    const timeRangeOptions = [
        { value: '3m', label: '3 Months' },
        { value: '6m', label: '6 Months' },
        { value: '12m', label: '12 Months' },
        { value: '24m', label: '24 Months' },
        { value: 'all', label: 'All Time' }
    ];

    const industryOptions = [
        { value: 'all', label: 'All Industries' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'services', label: 'Services' },
        { value: 'trading', label: 'Trading' },
        { value: 'construction', label: 'Construction' },
        { value: 'technology', label: 'Technology' }
    ];

    const riskGradeOptions = [
        { value: 'all', label: 'All Risk Grades' },
        { value: 'CM1', label: 'CM1 (Excellent)' },
        { value: 'CM2', label: 'CM2 (Good)' },
        { value: 'CM3', label: 'CM3 (Average)' },
        { value: 'CM4', label: 'CM4 (Poor)' },
        { value: 'CM5', label: 'CM5 (Critical)' }
    ];

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-6">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Portfolio Analytics</h1>
                    <p className="text-gray-600 mt-1">Comprehensive insights and risk analysis</p>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap gap-3">
                    {/* <Select
                        value={timeRange}
                        onChange={setTimeRange}
                        options={timeRangeOptions}
                        placeholder="Time Range"
                        className="w-32"
                    />
                    <Select
                        value={selectedIndustry}
                        onChange={setSelectedIndustry}
                        options={industryOptions}
                        placeholder="Industry"
                        className="w-40"
                    />
                    <Select
                        value={selectedRiskGrade}
                        onChange={setSelectedRiskGrade}
                        options={riskGradeOptions}
                        placeholder="Risk Grade"
                        className="w-40"
                    /> */}
                    <Button variant="outline" onClick={loadAnalyticsData}>
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Key Metrics Cards */}
            {portfolioMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Companies</p>
                                <p className="text-2xl font-bold text-gray-900">{portfolioMetrics.totalCompanies}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-xl">🏢</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Exposure</p>
                                <p className="text-2xl font-bold text-gray-900">₹{portfolioMetrics.totalExposure.toFixed(1)}Cr</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-xl">💰</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Avg Risk Score</p>
                                <p className="text-2xl font-bold text-gray-900">{(portfolioMetrics.averageRiskScore || 0).toFixed(1)}%</p>
                            </div>
                            <div className="h-12 w-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                                <span className="text-yellow-600 text-xl">⚡</span>
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">High Risk</p>
                                <p className="text-2xl font-bold text-gray-900">{portfolioMetrics.highRiskCompanies || 0}</p>
                                <Badge variant="destructive" className="mt-1">
                                    {portfolioMetrics.totalCompanies > 0 ? (((portfolioMetrics.highRiskCompanies || 0) / portfolioMetrics.totalCompanies) * 100).toFixed(1) : 0}%
                                </Badge>
                            </div>
                            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 text-xl">⚠️</span>
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Analytics Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <div className="flex flex-wrap gap-2 border-b border-gray-200 mb-6">
                    {tabs.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-2 text-sm font-medium rounded-t-lg transition-colors ${activeTab === tab.id
                                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                        >
                            <span className="mr-2">{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                {/* Tab Content */}
                <div className="space-y-6">
                    {activeTab === 'overview' && (
                        <AnalyticsDashboard
                            portfolioMetrics={portfolioMetrics}
                            riskHeatmapData={riskHeatmapData}
                            industryData={industryData}
                            onCompanySelect={loadCompanyDetails}
                        />
                    )}

                    {activeTab === 'risk' && (
                        <RiskAnalyticsDashboard
                            riskHeatmapData={riskHeatmapData}
                            onCompanySelect={loadCompanyDetails}
                            filters={{
                                industries: selectedIndustry !== 'all' ? [selectedIndustry] : undefined,
                                risk_grades: selectedRiskGrade !== 'all' ? [selectedRiskGrade] : undefined
                            }}
                        />
                    )}

                    {/* {activeTab === 'performance' && (
                        <ModelPerformanceDashboard
                            modelPerformance={modelPerformance}
                            timeRange={timeRange}
                        />
                    )} */}

                    {activeTab === 'trends' && (
                        <TrendAnalysis
                            timeRange={timeRange}
                            selectedIndustry={selectedIndustry}
                        />
                    )}

                    {/* {activeTab === 'benchmarking' && (
                        <BenchmarkingView
                            benchmarkData={benchmarkData}
                            selectedCompanyId={selectedCompanyId}
                            onCompanySelect={loadCompanyDetails}
                        />
                    )} */}

                    {activeTab === 'concentration' && (
                        <RiskConcentrationAnalysis
                            industryData={industryData}
                            riskHeatmapData={riskHeatmapData}
                        />
                    )}

                    {/* {activeTab === 'correlation' && (
                        <ParameterCorrelationAnalysis
                            radarData={radarData}
                            selectedCompanyId={selectedCompanyId}
                        />
                    )} */}
                </div>
            </Tabs>

            {/* Company Detail Modal */}
            {selectedCompanyId && radarData && (
                <CompanyDetailModal
                    companyId={selectedCompanyId}
                    radarData={radarData}
                    benchmarkData={benchmarkData}
                    onClose={() => setSelectedCompanyId(null)}
                />
            )}
        </div>
    );
}



function CompanyDetailModal({
    companyId,
    radarData,
    benchmarkData,
    onClose
}: {
    companyId: string;
    radarData: ParameterScoreRadarData;
    benchmarkData: BenchmarkComparisonData | null;
    onClose: () => void;
}) {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-4xl max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-semibold">Company Analysis: {radarData.companyName}</h2>
                    <Button variant="outline" onClick={onClose}>Close</Button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div>
                        <h3 className="text-lg font-semibold mb-4">Parameter Scores</h3>
                        <ParameterScoreRadar data={radarData} height={300} />
                    </div>

                    {benchmarkData && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4">Benchmark Comparison</h3>
                            <BenchmarkComparison data={benchmarkData} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}