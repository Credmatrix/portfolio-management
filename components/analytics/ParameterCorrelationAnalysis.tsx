'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { ParameterScoreRadar } from '@/components/analytics';
import { ParameterScoreRadarData } from '@/types/analytics.types';

interface CorrelationData {
    parameterCorrelations: Array<{
        parameter1: string;
        parameter2: string;
        correlation: number;
        significance: number;
        category1: string;
        category2: string;
    }>;
    categoryCorrelations: Array<{
        category1: string;
        category2: string;
        correlation: number;
        significance: number;
    }>;
    riskDrivers: Array<{
        parameter: string;
        category: string;
        riskImpact: number;
        importance: number;
        description: string;
    }>;
    portfolioInsights: {
        strongestCorrelation: {
            parameters: [string, string];
            correlation: number;
        };
        weakestCorrelation: {
            parameters: [string, string];
            correlation: number;
        };
        keyRiskDrivers: string[];
        diversificationOpportunities: string[];
    };
}

interface ParameterCorrelationAnalysisProps {
    radarData: ParameterScoreRadarData | null;
    selectedCompanyId: string | null;
}

export function ParameterCorrelationAnalysis({
    radarData,
    selectedCompanyId
}: ParameterCorrelationAnalysisProps) {
    const [correlationData, setCorrelationData] = useState<CorrelationData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState('all');
    const [correlationThreshold, setCorrelationThreshold] = useState(0.3);

    useEffect(() => {
        loadCorrelationData();
    }, [selectedCompanyId]);

    const loadCorrelationData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/analytics/parameter-correlation${selectedCompanyId ? `?companyId=${selectedCompanyId}` : ''}`
            );
            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Failed to load correlation data');
            }

            // Extract data from the response wrapper
            setCorrelationData(result.data);
        } catch (error) {
            console.error('Error loading correlation data:', error);
            setCorrelationData(null);
        } finally {
            setLoading(false);
        }
    };

    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        { value: 'financial', label: 'Financial Parameters' },
        { value: 'business', label: 'Business Parameters' },
        { value: 'hygiene', label: 'Hygiene Parameters' },
        { value: 'banking', label: 'Banking Parameters' }
    ];

    const thresholdOptions = [
        { value: 0.1, label: 'Weak (0.1+)' },
        { value: 0.3, label: 'Moderate (0.3+)' },
        { value: 0.5, label: 'Strong (0.5+)' },
        { value: 0.7, label: 'Very Strong (0.7+)' }
    ];

    const getCorrelationColor = (correlation: number) => {
        const abs = Math.abs(correlation);
        if (abs >= 0.7) return correlation > 0 ? 'text-green-600' : 'text-red-600';
        if (abs >= 0.5) return correlation > 0 ? 'text-blue-600' : 'text-orange-600';
        if (abs >= 0.3) return correlation > 0 ? 'text-teal-600' : 'text-yellow-600';
        return 'text-gray-600';
    };

    const getCorrelationBadge = (correlation: number) => {
        const abs = Math.abs(correlation);
        if (abs >= 0.7) return {
            label: 'Very Strong',
            className: correlation > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
        };
        if (abs >= 0.5) return {
            label: 'Strong',
            className: correlation > 0 ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'
        };
        if (abs >= 0.3) return {
            label: 'Moderate',
            className: correlation > 0 ? 'bg-teal-100 text-teal-800' : 'bg-yellow-100 text-yellow-800'
        };
        return {
            label: 'Weak',
            className: 'bg-gray-100 text-gray-800'
        };
    };

    const getRiskImpactColor = (impact: number) => {
        if (impact >= 0.8) return 'text-red-600';
        if (impact >= 0.6) return 'text-orange-600';
        if (impact >= 0.4) return 'text-yellow-600';
        return 'text-green-600';
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-96 bg-gray-200 rounded"></div>
                        <div className="h-96 bg-gray-200 rounded"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!correlationData) {
        return (
            <Card className="p-6">
                <div className="text-center text-gray-500">
                    <div className="text-4xl mb-4">🔗</div>
                    <p>No correlation data available</p>
                    <p className="text-sm mt-2">Portfolio-wide correlation analysis will be displayed</p>
                </div>
            </Card>
        );
    }

    // Filter correlations based on selected criteria
    const filteredCorrelations = (correlationData.parameterCorrelations || []).filter(corr => {
        const meetsThreshold = Math.abs(corr.correlation) >= correlationThreshold;
        const meetsCategory = selectedCategory === 'all' ||
            corr.category1?.toLowerCase() === selectedCategory ||
            corr.category2?.toLowerCase() === selectedCategory;
        return meetsThreshold && meetsCategory;
    });

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Parameter Correlation Analysis</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Identify key risk drivers across portfolio parameters
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* <Select
                            value={selectedCategory}
                            onChange={setSelectedCategory}
                            options={categoryOptions}
                            className="w-48"
                        />
                        <Select
                            value={correlationThreshold}
                            onChange={(value) => setCorrelationThreshold(Number(value))}
                            options={thresholdOptions}
                            className="w-40"
                        /> */}
                    </div>
                </div>
            </Card>

            {/* Portfolio Insights Overview */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Portfolio Correlation Insights</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="text-center p-4 bg-green-50 rounded-lg">
                        <div className="text-lg font-bold text-green-600">
                            {correlationData.portfolioInsights?.strongestCorrelation?.correlation?.toFixed(3) || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-600">Strongest Correlation</div>
                        <div className="text-xs text-gray-500 mt-1">
                            {correlationData.portfolioInsights?.strongestCorrelation?.parameters?.[0] || 'N/A'} ↔ {correlationData.portfolioInsights?.strongestCorrelation?.parameters?.[1] || 'N/A'}
                        </div>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                        <div className="text-lg font-bold text-blue-600">
                            {correlationData.portfolioInsights?.keyRiskDrivers?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Key Risk Drivers</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Primary risk parameters
                        </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg">
                        <div className="text-lg font-bold text-purple-600">
                            {correlationData.portfolioInsights?.diversificationOpportunities?.length || 0}
                        </div>
                        <div className="text-sm text-gray-600">Diversification Opportunities</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Uncorrelated parameters
                        </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg">
                        <div className="text-lg font-bold text-orange-600">
                            {filteredCorrelations.length}
                        </div>
                        <div className="text-sm text-gray-600">Significant Correlations</div>
                        <div className="text-xs text-gray-500 mt-1">
                            Above {correlationThreshold} threshold
                        </div>
                    </div>
                </div>
            </Card>

            {/* Main Analysis Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Parameter Radar Chart */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Parameter Score Distribution</h3>
                    {radarData && selectedCompanyId ? (
                        <ParameterScoreRadar
                            data={radarData}
                            height={400}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p>Select a company to view parameter distribution</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Risk Drivers */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Key Risk Drivers</h3>
                    <div className="space-y-4">
                        {(correlationData.riskDrivers || [])
                            .sort((a, b) => b.riskImpact - a.riskImpact)
                            .slice(0, 8)
                            .map((driver, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-700">
                                                {driver.parameter}
                                            </span>
                                            <Badge variant="outline" className="text-xs">
                                                {driver.category}
                                            </Badge>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-sm font-semibold ${getRiskImpactColor(driver.riskImpact)}`}>
                                                {(driver.riskImpact * 100).toFixed(0)}%
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                Impact
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${driver.riskImpact >= 0.8 ? 'bg-red-500' :
                                                driver.riskImpact >= 0.6 ? 'bg-orange-500' :
                                                    driver.riskImpact >= 0.4 ? 'bg-yellow-500' : 'bg-green-500'
                                                }`}
                                            style={{ width: `${driver.riskImpact * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {driver.description}
                                    </div>
                                </div>
                            ))}
                    </div>
                </Card>
            </div>

            {/* Parameter Correlations Table */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Parameter Correlations</h3>
                {filteredCorrelations.length > 0 ? (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4">Parameter 1</th>
                                    <th className="text-left py-3 px-4">Parameter 2</th>
                                    <th className="text-left py-3 px-4">Correlation</th>
                                    <th className="text-left py-3 px-4">Strength</th>
                                    <th className="text-left py-3 px-4">Significance</th>
                                    <th className="text-left py-3 px-4">Categories</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredCorrelations
                                    .sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation))
                                    .slice(0, 20)
                                    .map((corr, index) => {
                                        const badge = getCorrelationBadge(corr.correlation);
                                        return (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4 font-medium text-gray-900">
                                                    {corr.parameter1}
                                                </td>
                                                <td className="py-3 px-4 font-medium text-gray-900">
                                                    {corr.parameter2}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`font-semibold ${getCorrelationColor(corr.correlation)}`}>
                                                        {corr.correlation > 0 ? '+' : ''}{corr.correlation.toFixed(3)}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline" className={badge.className}>
                                                        {badge.label}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-sm">
                                                        {(corr.significance * 100).toFixed(1)}%
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        {corr.significance > 0.95 ? 'Highly significant' :
                                                            corr.significance > 0.90 ? 'Significant' : 'Moderate'}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex space-x-1">
                                                        <Badge variant="outline" className="text-xs">
                                                            {corr.category1}
                                                        </Badge>
                                                        {corr.category1 !== corr.category2 && (
                                                            <Badge variant="outline" className="text-xs">
                                                                {corr.category2}
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="text-center py-8 text-gray-500">
                        <div className="text-4xl mb-4">📊</div>
                        <p>No correlations found above the {correlationThreshold} threshold</p>
                        <p className="text-sm mt-2">Try lowering the correlation threshold or selecting a different category</p>
                    </div>
                )}
            </Card>

            {/* Category Correlations */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Category Correlations</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Inter-Category Relationships</h4>
                        {(correlationData.categoryCorrelations || []).length > 0 ? (
                            (correlationData.categoryCorrelations || []).map((catCorr, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm font-medium text-gray-700">
                                            {catCorr.category1} ↔ {catCorr.category2}
                                        </span>
                                        <div className="text-right">
                                            <div className={`text-sm font-semibold ${getCorrelationColor(catCorr.correlation)}`}>
                                                {catCorr.correlation > 0 ? '+' : ''}{catCorr.correlation.toFixed(3)}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${Math.abs(catCorr.correlation) >= 0.7 ?
                                                (catCorr.correlation > 0 ? 'bg-green-500' : 'bg-red-500') :
                                                Math.abs(catCorr.correlation) >= 0.5 ?
                                                    (catCorr.correlation > 0 ? 'bg-blue-500' : 'bg-orange-500') :
                                                    'bg-gray-400'
                                                }`}
                                            style={{ width: `${Math.abs(catCorr.correlation) * 100}%` }}
                                        />
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        Significance: {(catCorr.significance * 100).toFixed(1)}%
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="text-sm text-gray-500 italic">No category correlations available</div>
                        )}
                    </div>

                    <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">Diversification Opportunities</h4>
                        <div className="space-y-3">
                            {(correlationData.portfolioInsights?.diversificationOpportunities || []).length > 0 ? (
                                (correlationData.portfolioInsights?.diversificationOpportunities || []).map((opportunity, index) => (
                                    <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-blue-600 text-sm">💡</span>
                                            <div>
                                                <div className="text-sm font-medium text-blue-800">{opportunity}</div>
                                                <div className="text-xs text-blue-600 mt-1">
                                                    Low correlation with other risk factors
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 italic">No diversification opportunities identified</div>
                            )}
                        </div>

                        <h4 className="font-medium text-gray-900 mt-6">Key Risk Drivers</h4>
                        <div className="space-y-3">
                            {(correlationData.portfolioInsights?.keyRiskDrivers || []).length > 0 ? (
                                (correlationData.portfolioInsights?.keyRiskDrivers || []).map((driver, index) => (
                                    <div key={index} className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <div className="flex items-start space-x-2">
                                            <span className="text-red-600 text-sm">⚠️</span>
                                            <div>
                                                <div className="text-sm font-medium text-red-800">{driver}</div>
                                                <div className="text-xs text-red-600 mt-1">
                                                    High impact on overall risk
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-sm text-gray-500 italic">No key risk drivers identified</div>
                            )}
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}