'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import { BenchmarkComparison, ParameterScoreRadar } from '@/components/analytics';
import { BenchmarkComparisonData, ParameterScoreRadarData } from '@/types/analytics.types';

interface BenchmarkingData {
    industryBenchmarks: Array<{
        industry: string;
        parameters: Array<{
            name: string;
            excellent: number;
            good: number;
            average: number;
            poor: number;
            critical: number;
        }>;
    }>;
    peerComparison: Array<{
        companyId: string;
        companyName: string;
        industry: string;
        riskGrade: string;
        parameters: Array<{
            name: string;
            score: number;
            industryMedian: number;
            industryBest: number;
            percentile: number;
        }>;
    }>;
    portfolioVsIndustry: {
        outperforming: number;
        underperforming: number;
        atPar: number;
    };
}

interface BenchmarkingViewProps {
    benchmarkData: BenchmarkComparisonData | null;
    selectedCompanyId: string | null;
    onCompanySelect: (companyId: string) => void;
}

export function BenchmarkingView({
    benchmarkData,
    selectedCompanyId,
    onCompanySelect
}: BenchmarkingViewProps) {
    const [benchmarkingData, setBenchmarkingData] = useState<BenchmarkingData | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedIndustry, setSelectedIndustry] = useState('all');
    const [selectedParameter, setSelectedParameter] = useState('all');

    useEffect(() => {
        loadBenchmarkingData();
    }, [selectedIndustry]);

    const loadBenchmarkingData = async () => {
        setLoading(true);
        try {
            const response = await fetch(
                `/api/analytics/benchmarking?industry=${selectedIndustry}`
            );
            const data = await response.json();
            setBenchmarkingData(data);
        } catch (error) {
            console.error('Error loading benchmarking data:', error);
        } finally {
            setLoading(false);
        }
    };

    const industryOptions = [
        { value: 'all', label: 'All Industries' },
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'services', label: 'Services' },
        { value: 'trading', label: 'Trading' },
        { value: 'construction', label: 'Construction' },
        { value: 'technology', label: 'Technology' }
    ];

    const parameterOptions = [
        { value: 'all', label: 'All Parameters' },
        { value: 'financial', label: 'Financial Parameters' },
        { value: 'business', label: 'Business Parameters' },
        { value: 'hygiene', label: 'Hygiene Parameters' },
        { value: 'banking', label: 'Banking Parameters' }
    ];

    const getBenchmarkColor = (benchmark: string) => {
        switch (benchmark) {
            case 'Excellent': return 'bg-green-100 text-green-800';
            case 'Good': return 'bg-blue-100 text-blue-800';
            case 'Average': return 'bg-yellow-100 text-yellow-800';
            case 'Poor': return 'bg-orange-100 text-orange-800';
            case 'Critical Risk': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getPerformanceIcon = (percentile: number) => {
        if (percentile >= 90) return '🏆';
        if (percentile >= 75) return '🥇';
        if (percentile >= 50) return '🥈';
        if (percentile >= 25) return '🥉';
        return '📉';
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

    return (
        <div className="space-y-6">
            {/* Controls */}
            <Card className="p-6">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Industry Benchmarking</h3>
                        <p className="text-sm text-gray-600 mt-1">
                            Compare companies against industry peers with risk overlay
                        </p>
                    </div>
                    <div className="flex gap-3">
                        {/* <Select
                            value={selectedIndustry}
                            onChange={setSelectedIndustry}
                            options={industryOptions}
                            className="w-40"
                        />
                        <Select
                            value={selectedParameter}
                            onChange={setSelectedParameter}
                            options={parameterOptions}
                            className="w-48"
                        /> */}
                    </div>
                </div>
            </Card>

            {/* Portfolio Performance Overview */}
            {benchmarkingData && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Portfolio vs Industry Performance</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="text-2xl font-bold text-green-600">
                                {benchmarkingData.portfolioVsIndustry.outperforming}
                            </div>
                            <div className="text-sm text-gray-600">Outperforming</div>
                            <div className="text-xs text-gray-500">Above industry median</div>
                        </div>
                        <div className="text-center p-4 bg-yellow-50 rounded-lg">
                            <div className="text-2xl font-bold text-yellow-600">
                                {benchmarkingData.portfolioVsIndustry.atPar}
                            </div>
                            <div className="text-sm text-gray-600">At Par</div>
                            <div className="text-xs text-gray-500">Near industry median</div>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="text-2xl font-bold text-red-600">
                                {benchmarkingData.portfolioVsIndustry.underperforming}
                            </div>
                            <div className="text-sm text-gray-600">Underperforming</div>
                            <div className="text-xs text-gray-500">Below industry median</div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Main Benchmarking Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Company Benchmark Comparison */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Company Benchmark Comparison</h3>
                    {benchmarkData && selectedCompanyId ? (
                        <BenchmarkComparison
                            data={benchmarkData}
                        // height={400}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <div className="text-4xl mb-4">📊</div>
                                <p>Select a company to view benchmark comparison</p>
                                <p className="text-sm mt-2">Click on a company from the peer comparison list</p>
                            </div>
                        </div>
                    )}
                </Card>

                {/* Industry Benchmark Standards */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Industry Benchmark Standards</h3>
                    {benchmarkingData && benchmarkingData.industryBenchmarks.length > 0 ? (
                        <div className="space-y-4">
                            {benchmarkingData.industryBenchmarks
                                .filter(ib => selectedIndustry === 'all' || ib.industry === selectedIndustry)
                                .slice(0, 1)
                                .map((industryBenchmark, index) => (
                                    <div key={index}>
                                        <h4 className="font-medium text-gray-900 mb-3">
                                            {industryBenchmark.industry} Benchmarks
                                        </h4>
                                        <div className="space-y-3">
                                            {industryBenchmark.parameters
                                                .filter(p => selectedParameter === 'all' ||
                                                    p.name.toLowerCase().includes(selectedParameter))
                                                .slice(0, 8)
                                                .map((param, paramIndex) => (
                                                    <div key={paramIndex} className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-sm font-medium text-gray-700">
                                                                {param.name}
                                                            </span>
                                                        </div>
                                                        <div className="flex space-x-1">
                                                            <div className="flex-1 bg-green-200 h-2 rounded-l"
                                                                title={`Excellent: ${param.excellent}`} />
                                                            <div className="flex-1 bg-blue-200 h-2"
                                                                title={`Good: ${param.good}`} />
                                                            <div className="flex-1 bg-yellow-200 h-2"
                                                                title={`Average: ${param.average}`} />
                                                            <div className="flex-1 bg-orange-200 h-2"
                                                                title={`Poor: ${param.poor}`} />
                                                            <div className="flex-1 bg-red-200 h-2 rounded-r"
                                                                title={`Critical: ${param.critical}`} />
                                                        </div>
                                                        <div className="flex justify-between text-xs text-gray-500">
                                                            <span>Excellent: {param.excellent}</span>
                                                            <span>Critical: {param.critical}</span>
                                                        </div>
                                                    </div>
                                                ))}
                                        </div>
                                    </div>
                                ))}
                        </div>
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            Loading industry benchmarks...
                        </div>
                    )}
                </Card>
            </div>

            {/* Peer Comparison Table */}
            {benchmarkingData && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Peer Comparison</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4">Company</th>
                                    <th className="text-left py-3 px-4">Industry</th>
                                    <th className="text-left py-3 px-4">Risk Grade</th>
                                    <th className="text-left py-3 px-4">Performance</th>
                                    <th className="text-left py-3 px-4">Top Parameter</th>
                                    <th className="text-left py-3 px-4">Weak Parameter</th>
                                    <th className="text-left py-3 px-4">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {benchmarkingData.peerComparison
                                    .filter(company => selectedIndustry === 'all' || company.industry === selectedIndustry)
                                    .slice(0, 10)
                                    .map((company, index) => {
                                        const topParam = company.parameters.reduce((max, p) =>
                                            p.percentile > max.percentile ? p : max
                                        );
                                        const weakParam = company.parameters.reduce((min, p) =>
                                            p.percentile < min.percentile ? p : min
                                        );
                                        const avgPercentile = company.parameters.reduce((sum, p) =>
                                            sum + p.percentile, 0) / company.parameters.length;

                                        return (
                                            <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="font-medium text-gray-900">
                                                        {company.companyName}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    {company.industry}
                                                </td>
                                                <td className="py-3 px-4">
                                                    <Badge variant="outline">
                                                        {company.riskGrade}
                                                    </Badge>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center space-x-2">
                                                        <span>{getPerformanceIcon(avgPercentile)}</span>
                                                        <span className="text-sm">
                                                            {avgPercentile.toFixed(0)}th percentile
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-xs">
                                                        <div className="font-medium">{topParam.name}</div>
                                                        <div className="text-gray-500">
                                                            {topParam.percentile.toFixed(0)}th percentile
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="text-xs">
                                                        <div className="font-medium">{weakParam.name}</div>
                                                        <div className="text-gray-500">
                                                            {weakParam.percentile.toFixed(0)}th percentile
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => onCompanySelect(company.companyId)}
                                                        className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                    >
                                                        View Details
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}
        </div>
    );
}