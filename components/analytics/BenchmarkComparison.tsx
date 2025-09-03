"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { BenchmarkComparisonData } from "@/types/analytics.types";

interface BenchmarkComparisonProps {
    data: BenchmarkComparisonData;
    showCategories?: boolean;
}

export function BenchmarkComparison({
    data,
    showCategories = true
}: BenchmarkComparisonProps) {
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    const [sortBy, setSortBy] = useState<'name' | 'company' | 'gap'>('gap');

    if (!data?.parameters?.length) {
        return (
            <Card>
                <h3 className='text-lg font-semibold text-neutral-90 mb-4'>
                    Benchmark Comparison
                </h3>
                <div className="flex items-center justify-center h-64 text-neutral-60">
                    No benchmark data available
                </div>
            </Card>
        );
    }

    const getBenchmarkColor = (benchmark: string): string => {
        switch (benchmark) {
            case 'Excellent': return FluentColors.success;
            case 'Good': return '#0E8A0E';
            case 'Average': return FluentColors.warning;
            case 'Poor': return FluentColors.orange;
            case 'Critical Risk': return FluentColors.error;
            default: return FluentColors.neutral[50];
        }
    };

    const getCategoryColor = (category: string): string => {
        switch (category) {
            case 'Financial': return FluentColors.primary[500];
            case 'Business': return FluentColors.teal;
            case 'Hygiene': return FluentColors.purple;
            case 'Banking': return FluentColors.orange;
            default: return FluentColors.neutral[60];
        }
    };

    const categories = ['All', ...Array.from(new Set(data.parameters.map(p => p.category)))];

    const filteredParameters = selectedCategory === 'All'
        ? data.parameters
        : data.parameters.filter(p => p.category === selectedCategory);

    const sortedParameters = [...filteredParameters].sort((a, b) => {
        switch (sortBy) {
            case 'name':
                return a.name.localeCompare(b.name);
            case 'company':
                return b.companyScore - a.companyScore;
            case 'gap':
                return Math.abs(b.companyScore - b.industryMedian) - Math.abs(a.companyScore - a.industryMedian);
            default:
                return 0;
        }
    });

    const getPerformanceGap = (param: any) => {
        return param.companyScore - param.industryMedian;
    };

    const getPerformanceIndicator = (gap: number) => {
        if (gap > 10) return { text: 'Significantly Above', color: FluentColors.success };
        if (gap > 0) return { text: 'Above Median', color: '#0E8A0E' };
        if (gap > -10) return { text: 'Below Median', color: FluentColors.warning };
        return { text: 'Significantly Below', color: FluentColors.error };
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Benchmark Comparison
                </h3>
                <div className="text-sm text-neutral-70">
                    {data.companyName}
                </div>
            </div>

            {/* Controls */}
            <div className="flex flex-wrap gap-4 mb-6">
                {showCategories && (
                    <div className="flex items-center gap-2">
                        <label className="text-sm text-neutral-70">Category:</label>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="text-sm border border-neutral-30 rounded px-2 py-1"
                        >
                            {categories.map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </div>
                )}

                <div className="flex items-center gap-2">
                    <label className="text-sm text-neutral-70">Sort by:</label>
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-sm border border-neutral-30 rounded px-2 py-1"
                    >
                        <option value="gap">Performance Gap</option>
                        <option value="company">Company Score</option>
                        <option value="name">Parameter Name</option>
                    </select>
                </div>
            </div>

            {/* Parameters List */}
            <div className="space-y-4">
                {sortedParameters.map((param, index) => {
                    const gap = getPerformanceGap(param);
                    const indicator = getPerformanceIndicator(gap);
                    const maxScore = Math.max(param.companyScore, param.industryMedian, param.industryBest);
                    const companyPercentage = maxScore > 0 ? (param.companyScore / maxScore) * 100 : 0;
                    const medianPercentage = maxScore > 0 ? (param.industryMedian / maxScore) * 100 : 0;
                    const bestPercentage = maxScore > 0 ? (param.industryBest / maxScore) * 100 : 0;

                    return (
                        <div key={index} className="border border-neutral-30 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: getCategoryColor(param.category) }}
                                    />
                                    <div>
                                        <div className="font-medium text-neutral-90">{param.name}</div>
                                        <div className="text-xs text-neutral-60">{param.category}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div
                                        className="px-2 py-1 rounded text-xs text-white"
                                        style={{ backgroundColor: getBenchmarkColor(param.benchmark) }}
                                    >
                                        {param.benchmark}
                                    </div>
                                    <div className="text-right">
                                        <div className="text-sm font-medium" style={{ color: indicator.color }}>
                                            {indicator.text}
                                        </div>
                                        <div className="text-xs text-neutral-60">
                                            {gap > 0 ? '+' : ''}{gap.toFixed(1)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Score Bars */}
                            <div className="space-y-2">
                                {/* Company Score */}
                                <div className="flex items-center gap-3">
                                    <div className="w-20 text-xs text-neutral-70">Company</div>
                                    <div className="flex-1 bg-neutral-20 rounded-full h-4 relative">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${companyPercentage}%`,
                                                backgroundColor: FluentColors.primary[500]
                                            }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-90">
                                            {param.companyScore.toFixed(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Industry Median */}
                                <div className="flex items-center gap-3">
                                    <div className="w-20 text-xs text-neutral-70">Median</div>
                                    <div className="flex-1 bg-neutral-20 rounded-full h-4 relative">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${medianPercentage}%`,
                                                backgroundColor: FluentColors.warning
                                            }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-90">
                                            {param.industryMedian.toFixed(1)}
                                        </span>
                                    </div>
                                </div>

                                {/* Industry Best */}
                                <div className="flex items-center gap-3">
                                    <div className="w-20 text-xs text-neutral-70">Best</div>
                                    <div className="flex-1 bg-neutral-20 rounded-full h-4 relative">
                                        <div
                                            className="absolute inset-y-0 left-0 rounded-full transition-all duration-300"
                                            style={{
                                                width: `${bestPercentage}%`,
                                                backgroundColor: FluentColors.success
                                            }}
                                        />
                                        <span className="absolute inset-0 flex items-center justify-center text-xs text-neutral-90">
                                            {param.industryBest.toFixed(1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Summary Statistics */}
            <div className="mt-6 pt-4 border-t border-neutral-30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-neutral-60">Parameters Above Median</div>
                        <div className="font-medium text-neutral-90">
                            {filteredParameters.filter(p => getPerformanceGap(p) > 0).length}
                        </div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Parameters Below Median</div>
                        <div className="font-medium text-neutral-90">
                            {filteredParameters.filter(p => getPerformanceGap(p) <= 0).length}
                        </div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Excellent Ratings</div>
                        <div className="font-medium text-neutral-90">
                            {filteredParameters.filter(p => p.benchmark === 'Excellent').length}
                        </div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Critical Risks</div>
                        <div className="font-medium text-neutral-90">
                            {filteredParameters.filter(p => p.benchmark === 'Critical Risk').length}
                        </div>
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="mt-4 pt-4 border-t border-neutral-30">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Score Types */}
                    <div>
                        <div className="text-sm font-medium text-neutral-90 mb-2">Score Types:</div>
                        <div className="space-y-1">
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: FluentColors.primary[500] }} />
                                <span className="text-xs text-neutral-70">Company Score</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: FluentColors.warning }} />
                                <span className="text-xs text-neutral-70">Industry Median</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-3 h-3 rounded" style={{ backgroundColor: FluentColors.success }} />
                                <span className="text-xs text-neutral-70">Industry Best</span>
                            </div>
                        </div>
                    </div>

                    {/* Benchmark Ratings */}
                    <div>
                        <div className="text-sm font-medium text-neutral-90 mb-2">Benchmark Ratings:</div>
                        <div className="flex flex-wrap gap-2">
                            {[
                                { label: 'Excellent', color: FluentColors.success },
                                { label: 'Good', color: '#0E8A0E' },
                                { label: 'Average', color: FluentColors.warning },
                                { label: 'Poor', color: FluentColors.orange },
                                { label: 'Critical Risk', color: FluentColors.error }
                            ].map(({ label, color }) => (
                                <div key={label} className="flex items-center gap-1">
                                    <div className="w-2 h-2 rounded" style={{ backgroundColor: color }} />
                                    <span className="text-xs text-neutral-70">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}