'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { ConcentrationAnalysis } from '@/components/analytics';
import { IndustryBreakdownData, RiskScoreHeatmapData } from '@/types/analytics.types';
import { ChevronDown, ChevronUp, BarChart3, Grid, List, TrendingUp, AlertTriangle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';

interface ConcentrationData {
    industries: Array<{
        name: string;
        exposure: number;
        riskWeightedExposure: number;
        companyCount: number;
        averageRiskScore: number;
    }>;
    regions: Array<{
        name: string;
        exposure: number;
        riskWeightedExposure: number;
        companyCount: number;
        averageRiskScore: number;
    }>;
    riskGrades: Array<{
        grade: string;
        exposure: number;
        companyCount: number;
        percentage: number;
    }>;
}

interface RiskConcentrationAnalysisProps {
    industryData: IndustryBreakdownData | null;
    riskHeatmapData: RiskScoreHeatmapData | null;
}

export function RiskConcentrationAnalysis({
    industryData,
    riskHeatmapData
}: RiskConcentrationAnalysisProps) {
    const [viewMode, setViewMode] = useState<'overview' | 'detailed' | 'charts'>('overview');
    const [showRecommendations, setShowRecommendations] = useState(false);
    // Transform data for concentration analysis
    const concentrationData: ConcentrationData | null = React.useMemo(() => {
        if (!industryData || !riskHeatmapData) return null;

        // Calculate industry concentration
        const industries = industryData.industries.map(industry => ({
            name: industry.name,
            exposure: industry.totalExposure,
            riskWeightedExposure: industry.totalExposure * (industry.averageRiskScore / 100),
            companyCount: industry.count,
            averageRiskScore: industry.averageRiskScore
        }));

        // Calculate regional concentration (mock data - would come from API)
        const regions = [
            //     { name: 'Maharashtra', exposure: 45000000000, riskWeightedExposure: 35000000000, companyCount: 85, averageRiskScore: 72 },
            //     { name: 'Gujarat', exposure: 32000000000, riskWeightedExposure: 28000000000, companyCount: 62, averageRiskScore: 68 },
            //     { name: 'Karnataka', exposure: 28000000000, riskWeightedExposure: 22000000000, companyCount: 48, averageRiskScore: 75 },
            //     { name: 'Tamil Nadu', exposure: 25000000000, riskWeightedExposure: 20000000000, companyCount: 42, averageRiskScore: 70 },
            //     { name: 'Delhi NCR', exposure: 22000000000, riskWeightedExposure: 18000000000, companyCount: 38, averageRiskScore: 73 }
        ];

        // Calculate risk grade concentration
        const gradeDistribution = riskHeatmapData.companies.reduce((acc, company) => {
            const existing = acc.find(g => g.grade === company.riskGrade);
            if (existing) {
                existing.companyCount++;
                existing.exposure += 10000000; // Mock exposure per company
            } else {
                acc.push({
                    grade: company.riskGrade,
                    exposure: 10000000,
                    companyCount: 1,
                    percentage: 0
                });
            }
            return acc;
        }, [] as Array<{ grade: string; exposure: number; companyCount: number; percentage: number }>);

        const totalExposure = gradeDistribution.reduce((sum, g) => sum + g.exposure, 0);
        gradeDistribution.forEach(g => {
            g.percentage = (g.exposure / totalExposure) * 100;
        });

        return {
            industries,
            regions,
            riskGrades: gradeDistribution
        };
    }, [industryData, riskHeatmapData]);

    // Calculate concentration metrics
    const concentrationMetrics = React.useMemo(() => {
        if (!concentrationData) return null;

        const totalExposure = concentrationData.industries.reduce((sum, i) => sum + i.exposure, 0);
        const totalRiskWeightedExposure = concentrationData.industries.reduce((sum, i) => sum + i.riskWeightedExposure, 0);

        // Calculate Herfindahl-Hirschman Index for industry concentration
        const industryHHI = concentrationData.industries.reduce((sum, industry) => {
            const marketShare = industry.exposure / totalExposure;
            return sum + (marketShare * marketShare * 10000);
        }, 0);

        // Calculate top concentrations
        const top3Industries = concentrationData.industries
            .sort((a, b) => b.exposure - a.exposure)
            .slice(0, 3);

        const top3IndustryExposure = top3Industries.reduce((sum, i) => sum + i.exposure, 0);
        const top3Concentration = (top3IndustryExposure / totalExposure) * 100;

        const top3Regions = concentrationData.regions
            .sort((a, b) => b.exposure - a.exposure)
            .slice(0, 3);

        const top3RegionExposure = top3Regions.reduce((sum, r) => sum + r.exposure, 0);
        const regionalTop3Concentration = (top3RegionExposure / concentrationData.regions.reduce((sum, r) => sum + r.exposure, 0)) * 100;

        // High risk concentration
        const highRiskGrades = concentrationData.riskGrades.filter(g => ['CM4', 'CM5'].includes(g.grade));
        const highRiskExposure = highRiskGrades.reduce((sum, g) => sum + g.exposure, 0);
        const highRiskConcentration = (highRiskExposure / totalExposure) * 100;

        return {
            totalExposure,
            totalRiskWeightedExposure,
            riskAdjustmentFactor: (totalRiskWeightedExposure / totalExposure) * 100,
            industryHHI,
            top3Concentration,
            regionalTop3Concentration,
            highRiskConcentration,
            concentrationLevel: industryHHI > 2500 ? 'High' : industryHHI > 1500 ? 'Moderate' : 'Low'
        };
    }, [concentrationData]);

    if (!concentrationData || !concentrationMetrics) {
        return (
            <div className="space-y-6">
                <Card className="p-6">
                    <div className="text-center text-gray-500">
                        Loading concentration analysis data...
                    </div>
                </Card>
            </div>
        );
    }

    const getGradeColor = (grade: string) => {
        switch (grade) {
            case 'CM1': return '#10b981';
            case 'CM2': return '#3b82f6';
            case 'CM3': return '#f59e0b';
            case 'CM4': return '#f97316';
            case 'CM5': return '#ef4444';
            default: return '#6b7280';
        }
    };

    const pieChartData = concentrationData?.riskGrades.map(grade => ({
        name: grade.grade,
        value: grade.exposure,
        count: grade.companyCount,
        percentage: grade.percentage,
        color: getGradeColor(grade.grade)
    })) || [];

    const industryChartData = concentrationData?.industries
        .sort((a, b) => b.exposure - a.exposure)
        .slice(0, 10)
        .map(industry => ({
            name: industry.name.length > 12 ? industry.name.substring(0, 12) + '...' : industry.name,
            fullName: industry.name,
            exposure: industry.exposure / 10000000, // Convert to Cr
            riskWeighted: industry.riskWeightedExposure / 10000000,
            companies: industry.companyCount,
            risk: industry.averageRiskScore
        })) || [];

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-neutral-30 rounded shadow-lg">
                    <p className="font-medium text-neutral-90 mb-2">{data.fullName || data.name}</p>
                    <div className="space-y-1 text-sm">
                        {data.exposure && (
                            <p className="text-neutral-70">
                                Exposure: <span className="font-medium">₹{data.exposure.toFixed(1)}Cr</span>
                            </p>
                        )}
                        {data.companies && (
                            <p className="text-neutral-70">
                                Companies: <span className="font-medium">{data.companies}</span>
                            </p>
                        )}
                        {data.risk && (
                            <p className="text-neutral-70">
                                Avg Risk: <span className="font-medium">{data.risk.toFixed(1)}%</span>
                            </p>
                        )}
                        {data.count && (
                            <p className="text-neutral-70">
                                Count: <span className="font-medium">{data.count}</span>
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-6">
            {/* Header with View Mode Toggle */}
            <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">Risk Concentration Analysis</h3>
                    <div className="flex gap-2 flex-wrap">
                        {/* View Mode Toggle */}
                        <div className="flex border border-neutral-30 rounded overflow-hidden">
                            <button
                                onClick={() => setViewMode('overview')}
                                className={`px-3 py-1 text-xs ${viewMode === 'overview' ? 'bg-blue-500 text-white' : 'bg-white text-neutral-70'}`}
                                title="Overview"
                            >
                                <TrendingUp className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setViewMode('charts')}
                                className={`px-3 py-1 text-xs ${viewMode === 'charts' ? 'bg-blue-500 text-white' : 'bg-white text-neutral-70'}`}
                                title="Charts"
                            >
                                <BarChart3 className="w-3 h-3" />
                            </button>
                            <button
                                onClick={() => setViewMode('detailed')}
                                className={`px-3 py-1 text-xs ${viewMode === 'detailed' ? 'bg-blue-500 text-white' : 'bg-white text-neutral-70'}`}
                                title="Detailed"
                            >
                                <List className="w-3 h-3" />
                            </button>
                        </div>

                        {/* Recommendations Toggle */}
                        <button
                            onClick={() => setShowRecommendations(!showRecommendations)}
                            className={`flex items-center gap-1 px-3 py-1 text-xs border rounded ${showRecommendations ? 'bg-orange-50 border-orange-300 text-orange-700' : 'border-neutral-30 text-neutral-70'}`}
                        >
                            <AlertTriangle className="w-3 h-3" />
                            Alerts
                        </button>
                    </div>
                </div>

                {/* Key Metrics - Always Visible */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <div className="text-xl font-bold text-blue-600">
                            {concentrationMetrics.riskAdjustmentFactor.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Risk Factor</div>
                    </div>
                    <div className="text-center p-3 bg-yellow-50 rounded-lg">
                        <div className="text-xl font-bold text-yellow-600">
                            {concentrationMetrics.top3Concentration.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Top 3 Industries</div>
                    </div>
                    <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <div className="text-xl font-bold text-purple-600">
                            {concentrationMetrics.regionalTop3Concentration.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">Top 3 Regions</div>
                    </div>
                    <div className="text-center p-3 bg-red-50 rounded-lg">
                        <div className="text-xl font-bold text-red-600">
                            {concentrationMetrics.highRiskConcentration.toFixed(1)}%
                        </div>
                        <div className="text-xs text-gray-600">High Risk</div>
                    </div>
                </div>
            </Card>

            {/* Recommendations Panel - Conditional */}
            {showRecommendations && (
                <Card className="p-4 border-orange-200 bg-orange-50">
                    <h4 className="font-medium text-orange-900 mb-3 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        Risk Concentration Alerts
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {concentrationMetrics.highRiskConcentration > 15 && (
                            <div className="p-3 bg-red-50 border border-red-200 rounded">
                                <div className="text-sm font-medium text-red-800">High Risk Concentration</div>
                                <div className="text-xs text-red-600 mt-1">
                                    {concentrationMetrics.highRiskConcentration.toFixed(1)}% in CM4-CM5 companies
                                </div>
                            </div>
                        )}
                        {concentrationMetrics.top3Concentration > 60 && (
                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                                <div className="text-sm font-medium text-yellow-800">Industry Concentration</div>
                                <div className="text-xs text-yellow-600 mt-1">
                                    {concentrationMetrics.top3Concentration.toFixed(1)}% in top 3 industries
                                </div>
                            </div>
                        )}
                        {concentrationMetrics.regionalTop3Concentration > 70 && (
                            <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                <div className="text-sm font-medium text-blue-800">Geographic Concentration</div>
                                <div className="text-xs text-blue-600 mt-1">
                                    {concentrationMetrics.regionalTop3Concentration.toFixed(1)}% in top 3 regions
                                </div>
                            </div>
                        )}
                        {concentrationMetrics.highRiskConcentration <= 15 &&
                            concentrationMetrics.top3Concentration <= 60 &&
                            concentrationMetrics.regionalTop3Concentration <= 70 && (
                                <div className="p-3 bg-green-50 border border-green-200 rounded col-span-full">
                                    <div className="text-sm font-medium text-green-800">✅ Well Diversified Portfolio</div>
                                    <div className="text-xs text-green-600 mt-1">
                                        Good diversification across risk, industry, and geography
                                    </div>
                                </div>
                            )}
                    </div>
                </Card>
            )}

            {/* Content Based on View Mode */}
            {viewMode === 'overview' && (
                <Card className="p-6">
                    <h4 className="font-medium text-gray-900 mb-4">Concentration Assessment</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Industry</span>
                                <Badge
                                    className={concentrationMetrics.concentrationLevel === 'High' ? 'bg-red-100 text-red-800' :
                                        concentrationMetrics.concentrationLevel === 'Moderate' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                                >
                                    {concentrationMetrics.concentrationLevel}
                                </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                                HHI: {concentrationMetrics.industryHHI.toFixed(0)}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Risk</span>
                                <Badge
                                    className={concentrationMetrics.highRiskConcentration > 20 ? 'bg-red-100 text-red-800' :
                                        concentrationMetrics.highRiskConcentration > 10 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                                >
                                    {concentrationMetrics.highRiskConcentration > 20 ? 'High' :
                                        concentrationMetrics.highRiskConcentration > 10 ? 'Moderate' : 'Low'}
                                </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                                High Risk: {concentrationMetrics.highRiskConcentration.toFixed(1)}%
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <span className="text-sm font-medium text-gray-700">Geographic</span>
                                <Badge
                                    className={concentrationMetrics.regionalTop3Concentration > 70 ? 'bg-red-100 text-red-800' :
                                        concentrationMetrics.regionalTop3Concentration > 50 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}
                                >
                                    {concentrationMetrics.regionalTop3Concentration > 70 ? 'Concentrated' :
                                        concentrationMetrics.regionalTop3Concentration > 50 ? 'Moderate' : 'Diversified'}
                                </Badge>
                            </div>
                            <div className="text-xs text-gray-600">
                                Top 3: {concentrationMetrics.regionalTop3Concentration.toFixed(1)}%
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {viewMode === 'charts' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Risk Grade Distribution Pie Chart */}
                    <Card className="p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Risk Grade Distribution</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={pieChartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={40}
                                        outerRadius={80}
                                        paddingAngle={2}
                                        dataKey="value"
                                    >
                                        {pieChartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip content={<CustomTooltip />} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="flex flex-wrap gap-2 mt-4">
                            {pieChartData.map((entry, index) => (
                                <div key={index} className="flex items-center gap-1">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: entry.color }}
                                    />
                                    <span className="text-xs text-gray-600">
                                        {entry.name}: {entry.count}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Card>

                    {/* Industry Exposure Bar Chart */}
                    <Card className="p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Top Industries by Exposure</h4>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={industryChartData} margin={{ top: 20, right: 30, left: 20, bottom: 60 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                    <XAxis
                                        dataKey="name"
                                        angle={-45}
                                        textAnchor="end"
                                        height={60}
                                        fontSize={10}
                                    />
                                    <YAxis fontSize={10} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar dataKey="exposure" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </Card>
                </div>
            )}

            {viewMode === 'detailed' && (
                <div className="space-y-6">
                    {/* Detailed Concentration Analysis */}
                    <ConcentrationAnalysis
                        data={concentrationData}
                        height={400}
                    />

                    {/* Risk Grade Details */}
                    {/* <Card className="p-6">
                        <h4 className="font-medium text-gray-900 mb-4">Risk Grade Breakdown</h4>
                        <div className="space-y-3">
                            {concentrationData.riskGrades
                                .sort((a, b) => a.grade.localeCompare(b.grade))
                                .map((grade, index) => (
                                    <div key={index} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-gray-700">{grade.grade}</span>
                                            <div className="text-right">
                                                <div className="text-sm font-semibold">
                                                    ₹{(grade.exposure / 10000000).toFixed(1)}Cr
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    {grade.companyCount} companies
                                                </div>
                                            </div>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div
                                                className="h-2 rounded-full"
                                                style={{
                                                    width: `${grade.percentage}%`,
                                                    backgroundColor: getGradeColor(grade.grade)
                                                }}
                                            />
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {grade.percentage.toFixed(1)}% of total exposure
                                        </div>
                                    </div>
                                ))}
                        </div>
                    </Card> */}
                </div>
            )}
        </div>
    );
}