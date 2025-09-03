'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PerformanceChart, TrendChart } from '@/components/analytics';

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

interface ModelPerformanceDashboardProps {
    modelPerformance: ModelPerformanceMetrics | null;
    timeRange: string;
}

export function ModelPerformanceDashboard({
    modelPerformance,
    timeRange
}: ModelPerformanceDashboardProps) {
    if (!modelPerformance) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-32 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                    <div className="mt-6 h-96 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    const getPerformanceColor = (score: number) => {
        if (score >= 0.9) return 'text-green-600';
        if (score >= 0.8) return 'text-blue-600';
        if (score >= 0.7) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPerformanceBadge = (score: number) => {
        if (score >= 0.9) return { variant: 'default' as const, label: 'Excellent', className: 'bg-green-100 text-green-800' };
        if (score >= 0.8) return { variant: 'default' as const, label: 'Good', className: 'bg-blue-100 text-blue-800' };
        if (score >= 0.7) return { variant: 'default' as const, label: 'Fair', className: 'bg-yellow-100 text-yellow-800' };
        return { variant: 'destructive' as const, label: 'Poor', className: 'bg-red-100 text-red-800' };
    };

    // Prepare trend data for chart
    const trendSeries = [
        {
            name: 'Accuracy',
            data: modelPerformance.performanceTrends.map(p => ({
                date: p.date,
                value: p.accuracy * 100
            })),
            color: '#0078d4'
        },
        {
            name: 'Precision',
            data: modelPerformance.performanceTrends.map(p => ({
                date: p.date,
                value: p.precision * 100
            })),
            color: '#107c10'
        },
        {
            name: 'Recall',
            data: modelPerformance.performanceTrends.map(p => ({
                date: p.date,
                value: p.recall * 100
            })),
            color: '#ff8c00'
        },
        {
            name: 'F1 Score',
            data: modelPerformance.performanceTrends.map(p => ({
                date: p.date,
                value: p.f1Score * 100
            })),
            color: '#d13438'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Core Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Model Accuracy</p>
                            <p className={`text-2xl font-bold ${getPerformanceColor(modelPerformance.accuracy)}`}>
                                {(modelPerformance.accuracy * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-blue-600 text-xl">🎯</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <Badge {...getPerformanceBadge(modelPerformance.accuracy)}>
                            {getPerformanceBadge(modelPerformance.accuracy).label}
                        </Badge>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Precision</p>
                            <p className={`text-2xl font-bold ${getPerformanceColor(modelPerformance.precision)}`}>
                                {(modelPerformance.precision * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                            <span className="text-green-600 text-xl">✓</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-600">
                            True positives accuracy
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Recall</p>
                            <p className={`text-2xl font-bold ${getPerformanceColor(modelPerformance.recall)}`}>
                                {(modelPerformance.recall * 100).toFixed(1)}%
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                            <span className="text-orange-600 text-xl">🔍</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-600">
                            Coverage completeness
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">AUC Score</p>
                            <p className={`text-2xl font-bold ${getPerformanceColor(modelPerformance.auc)}`}>
                                {modelPerformance.auc.toFixed(3)}
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 text-xl">📈</span>
                        </div>
                    </div>
                    <div className="mt-4">
                        <div className="text-sm text-gray-600">
                            ROC curve area
                        </div>
                    </div>
                </Card>
            </div>

            {/* Model Information */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Model Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                        <p className="text-sm font-medium text-gray-600">Model Version</p>
                        <p className="text-lg font-semibold text-gray-900">{modelPerformance.modelVersion}</p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Total Predictions</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {modelPerformance.totalPredictions.toLocaleString()}
                        </p>
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-600">Last Updated</p>
                        <p className="text-lg font-semibold text-gray-900">
                            {new Date(modelPerformance.lastUpdated).toLocaleDateString()}
                        </p>
                    </div>
                </div>
            </Card>

            {/* Performance Trends */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Trends ({timeRange})</h3>
                <TrendChart
                    series={trendSeries}
                    height={300}
                    format="percentage"
                    yAxisLabel="Performance (%)"
                    showLegend={true}
                    showGrid={true}
                />
            </Card>

            {/* Confusion Matrix */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Validation Results</h3>
                <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
                    <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                            {modelPerformance.validationResults.truePositives}
                        </div>
                        <div className="text-sm text-gray-600">True Positives</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="text-2xl font-bold text-red-600">
                            {modelPerformance.validationResults.falsePositives}
                        </div>
                        <div className="text-sm text-gray-600">False Positives</div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border-2 border-red-200">
                        <div className="text-2xl font-bold text-red-600">
                            {modelPerformance.validationResults.falseNegatives}
                        </div>
                        <div className="text-sm text-gray-600">False Negatives</div>
                    </div>
                    <div className="text-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                        <div className="text-2xl font-bold text-green-600">
                            {modelPerformance.validationResults.trueNegatives}
                        </div>
                        <div className="text-sm text-gray-600">True Negatives</div>
                    </div>
                </div>
            </Card>

            {/* Industry Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Performance by Industry</h3>
                    <div className="space-y-4">
                        {modelPerformance.industryPerformance.map((industry, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{industry.industry}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">
                                            {(industry.accuracy * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {industry.sampleSize} samples
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${getPerformanceColor(industry.accuracy).includes('green') ? 'bg-green-500' :
                                            getPerformanceColor(industry.accuracy).includes('blue') ? 'bg-blue-500' :
                                                getPerformanceColor(industry.accuracy).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${industry.accuracy * 100}%` }}
                                    />
                                </div>
                                <div className="text-xs text-gray-500">
                                    Confidence: {(industry.confidence * 100).toFixed(1)}%
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Accuracy by Risk Grade</h3>
                    <div className="space-y-4">
                        {modelPerformance.riskGradeAccuracy.map((grade, index) => (
                            <div key={index} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{grade.grade}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">
                                            {(grade.accuracy * 100).toFixed(1)}%
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {grade.predictedCorrectly}/{grade.sampleSize}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className={`h-2 rounded-full ${getPerformanceColor(grade.accuracy).includes('green') ? 'bg-green-500' :
                                            getPerformanceColor(grade.accuracy).includes('blue') ? 'bg-blue-500' :
                                                getPerformanceColor(grade.accuracy).includes('yellow') ? 'bg-yellow-500' : 'bg-red-500'
                                            }`}
                                        style={{ width: `${grade.accuracy * 100}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}