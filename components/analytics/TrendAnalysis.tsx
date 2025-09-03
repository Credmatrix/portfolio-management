'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { TrendChart, PerformanceChart } from '@/components/analytics';

interface TrendData {
    risk_score_trends: Array<{
        month: string;
        average_risk_score: number;
        company_count: number;
        total_exposure: number;
        min_risk_score: number;
        max_risk_score: number;
    }>;
    portfolio_growth: Array<{
        month: string;
        new_companies: number;
        cumulative_companies: number;
        cumulative_exposure: number;
    }>;
    industry_trends: {
        [key: string]: Array<{
            month: string;
            company_count: number;
            average_risk_score: number;
            total_exposure: number;
        }>;
    };
    monthly_summary: Array<{
        month: string;
        total_companies: number;
        total_exposure: number;
        average_risk_score: number;
        risk_grade_distribution: {
            [key: string]: number;
        };
        industry_distribution: {
            [key: string]: number;
        };
        high_risk_companies: number;
        top_performers: number;
    }>;
    time_range: string;
    selected_industry: string;
    total_companies: number;
}

interface TrendAnalysisProps {
    timeRange: string;
    selectedIndustry: string;
}

export function TrendAnalysis({ timeRange, selectedIndustry }: TrendAnalysisProps) {
    const [trendData, setTrendData] = useState<TrendData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedMetric, setSelectedMetric] = useState('risk');


    useEffect(() => {
        loadTrendData();
    }, [timeRange, selectedIndustry]);

    const loadTrendData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/analytics/trends?timeRange=${timeRange}&industry=${selectedIndustry}`
            );
            const result = await response.json();
            if (result.success && result.data?.trend_analysis) {
                setTrendData(result.data.trend_analysis);
            } else {
                console.error('Invalid response format:', result);
                setTrendData(null);
            }
        } catch (error) {
            console.error('Error loading trend data:', error);
            setTrendData(null);
        } finally {
            setLoading(false);
        }
    };

    const metricOptions = [
        { value: 'risk', label: 'Risk Score Trends' },
        { value: 'growth', label: 'Portfolio Growth' },
        { value: 'industry', label: 'Industry Comparison' },
        { value: 'distribution', label: 'Risk Distribution' }
    ];

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!trendData) {
        return (
            <Card className="p-6">
                <div className="text-center text-gray-500">
                    No trend data available for the selected period.
                </div>
            </Card>
        );
    }

    // Prepare chart data based on selected metric
    const getChartData = () => {
        switch (selectedMetric) {
            case 'risk':
                return [
                    {
                        name: 'Average Risk Score',
                        data: trendData.risk_score_trends.map(t => ({
                            date: t.month,
                            value: t.average_risk_score
                        })),
                        color: '#0078d4'
                    },
                    {
                        name: 'Company Count',
                        data: trendData.risk_score_trends.map(t => ({
                            date: t.month,
                            value: t.company_count
                        })),
                        color: '#107c10'
                    },
                    {
                        name: 'Total Exposure (₹Cr)',
                        data: trendData.risk_score_trends.map(t => ({
                            date: t.month,
                            value: t.total_exposure
                        })),
                        color: '#ff8c00'
                    }
                ];

            case 'growth':
                return [
                    {
                        name: 'New Companies',
                        data: trendData.portfolio_growth.map(t => ({
                            date: t.month,
                            value: t.new_companies
                        })),
                        color: '#0078d4'
                    },
                    {
                        name: 'Cumulative Companies',
                        data: trendData.portfolio_growth.map(t => ({
                            date: t.month,
                            value: t.cumulative_companies
                        })),
                        color: '#107c10'
                    },
                    {
                        name: 'Cumulative Exposure (₹Cr)',
                        data: trendData.portfolio_growth.map(t => ({
                            date: t.month,
                            value: t.cumulative_exposure
                        })),
                        color: '#ff8c00'
                    }
                ];

            case 'distribution':
                const latestSummary = trendData.monthly_summary[trendData.monthly_summary.length - 1];
                if (!latestSummary) return [];

                return Object.entries(latestSummary.risk_grade_distribution).map(([grade, count], index) => ({
                    name: grade,
                    data: [{
                        date: latestSummary.month,
                        value: count
                    }],
                    color: ['#107c10', '#52c41a', '#faad14', '#fa8c16', '#f5222d', '#a0d911', '#722ed1'][index % 7]
                }));

            default:
                return [];
        }
    };

    const getIndustryData = () => {
        return Object.entries(trendData.industry_trends).map(([industry, trends]) => ({
            industry: industry.replace('-', ' ').toUpperCase(),
            trends
        }));
    };

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Historical Trend Analysis</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Analyze financial performance correlated with risk scores over {timeRange}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Select
                            value={selectedMetric}
                            onChange={(e) => setSelectedMetric(e.target.value)}
                            className="w-48"
                        >
                            {metricOptions.map(option => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>

                    </div>
                </div>
            </Card>

            {/* Main Trend Chart */}
            <Card className="p-6">
                <TrendChart
                    series={getChartData()}
                    title={metricOptions.find(m => m.value === selectedMetric)?.label}
                    height={400}
                    format={selectedMetric === 'growth' ? 'currency' : 'number'}
                    yAxisLabel={selectedMetric === 'risk' ? 'Score/Count/Exposure' :
                        selectedMetric === 'growth' ? 'Count/Amount (₹Cr)' :
                            selectedMetric === 'distribution' ? 'Company Count' : 'Value'}
                    showLegend={true}
                    showGrid={true}
                />
            </Card>

            {/* Risk Distribution Analysis */}
            {selectedMetric === 'distribution' && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Grade Distribution</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                        {trendData.monthly_summary.length > 0 &&
                            Object.entries(trendData.monthly_summary[trendData.monthly_summary.length - 1].risk_grade_distribution)
                                .map(([grade, count]) => (
                                    <div key={grade} className="text-center p-4 bg-gray-50 rounded-lg">
                                        <div className="text-2xl font-bold text-gray-900 mb-1">
                                            {count}
                                        </div>
                                        <div className="text-sm text-gray-600">{grade}</div>
                                        <div className="text-xs text-gray-500 mt-1">
                                            {((count / trendData.total_companies) * 100).toFixed(1)}%
                                        </div>
                                    </div>
                                ))
                        }
                    </div>
                </Card>
            )}

            {/* Industry Trends */}
            {selectedMetric === 'industry' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {getIndustryData().map((industry, index) => (
                        <Card key={index} className="p-6">
                            <h4 className="text-lg font-semibold mb-4">{industry.industry}</h4>
                            <TrendChart
                                series={[
                                    {
                                        name: 'Risk Score',
                                        data: industry.trends.map(t => ({
                                            date: t.month,
                                            value: t.average_risk_score
                                        })),
                                        color: '#0078d4'
                                    },
                                    {
                                        name: 'Company Count',
                                        data: industry.trends.map(t => ({
                                            date: t.month,
                                            value: t.company_count
                                        })),
                                        color: '#107c10'
                                    },
                                    {
                                        name: 'Total Exposure (₹Cr)',
                                        data: industry.trends.map(t => ({
                                            date: t.month,
                                            value: t.total_exposure
                                        })),
                                        color: '#ff8c00'
                                    }
                                ]}
                                height={250}
                                showLegend={true}
                            />
                        </Card>
                    ))}
                </div>
            )}

            {/* Summary Statistics */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Portfolio Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                            {trendData.total_companies}
                        </div>
                        <div className="text-sm text-gray-600">Total Companies</div>
                        <div className="text-xs text-gray-500">In portfolio</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                            {trendData.risk_score_trends.length > 0 ?
                                trendData.risk_score_trends[0].average_risk_score.toFixed(1) : '0'}
                        </div>
                        <div className="text-sm text-gray-600">Average Risk Score</div>
                        <div className="text-xs text-gray-500">Current period</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                            ₹{trendData.risk_score_trends.length > 0 ?
                                trendData.risk_score_trends[0].total_exposure.toFixed(1) : '0'}Cr
                        </div>
                        <div className="text-sm text-gray-600">Total Exposure</div>
                        <div className="text-xs text-gray-500">Portfolio value</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">
                            {trendData.monthly_summary.length > 0 ?
                                trendData.monthly_summary[0].high_risk_companies : 0}
                        </div>
                        <div className="text-sm text-gray-600">High Risk Companies</div>
                        <div className="text-xs text-gray-500">Requires attention</div>
                    </div>
                </div>
            </Card>
        </div>
    );
}