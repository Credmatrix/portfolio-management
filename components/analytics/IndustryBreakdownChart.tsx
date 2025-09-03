"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { FluentColors } from "@/lib/constants/colors";
import { IndustryBreakdownData } from "@/types/analytics.types";
import { ChevronDown, ChevronUp, Grid, List, BarChart3 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface IndustryBreakdownChartProps {
    data: IndustryBreakdownData;
    showRiskOverlay?: boolean;
}

export function IndustryBreakdownChart({
    data,
    showRiskOverlay = true
}: IndustryBreakdownChartProps) {
    const [selectedIndustry, setSelectedIndustry] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'count' | 'exposure' | 'risk'>('count');
    const [displayMode, setDisplayMode] = useState<'compact' | 'chart' | 'grid'>('compact');
    const [showAll, setShowAll] = useState(false);
    const [sortBy, setSortBy] = useState<'value' | 'name' | 'risk'>('value');

    if (!data?.industries?.length) {
        return (
            <Card>
                <h3 className='text-lg font-semibold text-neutral-90 mb-4'>
                    Industry Breakdown
                </h3>
                <div className="flex items-center justify-center h-64 text-neutral-60">
                    No industry data available
                </div>
            </Card>
        );
    }

    const totalCount = data.industries.reduce((sum, industry) => sum + industry.count, 0);
    const totalExposure = data.industries.reduce((sum, industry) => sum + industry.totalExposure, 0);

    const getValueForMode = (industry: any) => {
        switch (viewMode) {
            case 'count': return industry.count;
            case 'exposure': return industry.totalExposure;
            case 'risk': return industry.averageRiskScore;
            default: return industry.count;
        }
    };

    const getMaxValue = () => {
        return Math.max(...data.industries.map(getValueForMode));
    };

    const formatValue = (value: number) => {
        switch (viewMode) {
            case 'count': return value.toString();
            case 'exposure': return `₹${(value / 10000000).toFixed(1)}Cr`;
            case 'risk': return `${value.toFixed(1)}%`;
            default: return value.toString();
        }
    };

    const formatValueCompact = (value: number) => {
        switch (viewMode) {
            case 'count': return value.toString();
            case 'exposure': return `₹${(value / 10000000).toFixed(0)}Cr`;
            case 'risk': return `${value.toFixed(0)}%`;
            default: return value.toString();
        }
    };

    const getSortedIndustries = () => {
        let sorted = [...data.industries];
        switch (sortBy) {
            case 'value':
                sorted.sort((a, b) => getValueForMode(b) - getValueForMode(a));
                break;
            case 'name':
                sorted.sort((a, b) => a.name.localeCompare(b.name));
                break;
            case 'risk':
                sorted.sort((a, b) => b.averageRiskScore - a.averageRiskScore);
                break;
        }
        return sorted;
    };

    const getDisplayedIndustries = () => {
        const sorted = getSortedIndustries();
        if (displayMode === 'compact' && !showAll) {
            return sorted.slice(0, 8);
        }
        if (displayMode === 'chart') {
            return sorted.slice(0, 15); // Show top 15 for chart readability
        }
        return sorted;
    };

    const getChartData = () => {
        return getDisplayedIndustries().map((industry) => ({
            name: industry.name.length > 12 ? industry.name.substring(0, 12) + '...' : industry.name,
            fullName: industry.name,
            value: getValueForMode(industry),
            count: industry.count,
            exposure: industry.totalExposure,
            risk: industry.averageRiskScore,
            color: industry.color,
            riskDistribution: industry.riskDistribution
        }));
    };

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-3 border border-neutral-30 rounded shadow-lg">
                    <p className="font-medium text-neutral-90 mb-2">{data.fullName}</p>
                    <div className="space-y-1 text-sm">
                        <p className="text-neutral-70">
                            Companies: <span className="font-medium">{data.count}</span>
                        </p>
                        <p className="text-neutral-70">
                            Exposure: <span className="font-medium">₹{(data.exposure / 10000000).toFixed(1)}Cr</span>
                        </p>
                        <p className="text-neutral-70">
                            Avg Risk: <span className="font-medium">{data.risk.toFixed(1)}%</span>
                        </p>
                        <p className="text-neutral-70">
                            {viewMode === 'count' && `Count: ${data.value}`}
                            {viewMode === 'exposure' && `Exposure: ₹${(data.value / 10000000).toFixed(1)}Cr`}
                            {viewMode === 'risk' && `Risk Score: ${data.value.toFixed(1)}%`}
                        </p>
                    </div>
                </div>
            );
        }
        return null;
    };

    const getRiskGradeColor = (grade: string): string => {
        switch (grade) {
            case 'CM1': return FluentColors.success;
            case 'CM2': return '#0E8A0E';
            case 'CM3': return FluentColors.warning;
            case 'CM4': return FluentColors.orange;
            case 'CM5': return FluentColors.error;
            default: return FluentColors.neutral[50];
        }
    };

    return (
        <Card>
            <div className="flex items-center justify-between mb-4">
                <h3 className='text-lg font-semibold text-neutral-90'>
                    Industry Breakdown
                </h3>
                <div className="flex gap-2 flex-wrap">
                    {/* Display Mode Toggle */}
                    <div className="flex border border-neutral-30 rounded overflow-hidden">
                        <button
                            onClick={() => setDisplayMode('compact')}
                            className={`px-2 py-1 text-xs ${displayMode === 'compact' ? 'bg-blue-500 text-white' : 'bg-white text-neutral-70'}`}
                            title="Compact View"
                        >
                            <List className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setDisplayMode('grid')}
                            className={`px-2 py-1 text-xs ${displayMode === 'grid' ? 'bg-blue-500 text-white' : 'bg-white text-neutral-70'}`}
                            title="Grid View"
                        >
                            <Grid className="w-3 h-3" />
                        </button>
                        <button
                            onClick={() => setDisplayMode('chart')}
                            className={`px-2 py-1 text-xs ${displayMode === 'chart' ? 'bg-blue-500 text-white' : 'bg-white text-neutral-70'}`}
                            title="Chart View"
                        >
                            <BarChart3 className="w-3 h-3" />
                        </button>
                    </div>

                    {/* Sort Options */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="text-xs border border-neutral-30 rounded px-2 py-1"
                    >
                        <option value="value">Sort by Value</option>
                        <option value="name">Sort by Name</option>
                        <option value="risk">Sort by Risk</option>
                    </select>

                    {/* View Mode */}
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as any)}
                        className="text-xs border border-neutral-30 rounded px-2 py-1"
                    >
                        <option value="count">Company Count</option>
                        <option value="exposure">Total Exposure</option>
                        <option value="risk">Average Risk Score</option>
                    </select>
                </div>
            </div>

            {/* Industry Display */}
            {displayMode === 'grid' ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-6">
                    {getDisplayedIndustries().map((industry) => {
                        const value = getValueForMode(industry);
                        const maxValue = getMaxValue();
                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        const isSelected = selectedIndustry === industry.name;

                        return (
                            <div
                                key={industry.name}
                                className={`cursor-pointer transition-all ${isSelected ? 'bg-neutral-20 ring-2 ring-blue-500' : 'hover:bg-neutral-10'} p-3 rounded border border-neutral-30`}
                                onClick={() => setSelectedIndustry(isSelected ? null : industry.name)}
                            >
                                <div className="flex items-center gap-2 mb-2">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: industry.color }}
                                    />
                                    <span className="text-xs font-medium text-neutral-90 truncate">
                                        {industry.name}
                                    </span>
                                </div>

                                <div className="text-sm font-semibold text-neutral-90 mb-1">
                                    {formatValueCompact(value)}
                                </div>

                                <div className="bg-neutral-20 rounded-full h-2 mb-2">
                                    <div
                                        className="h-full rounded-full transition-all duration-300"
                                        style={{
                                            width: `${percentage}%`,
                                            backgroundColor: industry.color
                                        }}
                                    />
                                </div>

                                <div className="text-xs text-neutral-60">
                                    Risk: {industry.averageRiskScore.toFixed(0)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : displayMode === 'compact' ? (
                <div className="space-y-2 mb-6">
                    {getDisplayedIndustries().map((industry) => {
                        const value = getValueForMode(industry);
                        const maxValue = getMaxValue();
                        const percentage = maxValue > 0 ? (value / maxValue) * 100 : 0;
                        const isSelected = selectedIndustry === industry.name;

                        return (
                            <div
                                key={industry.name}
                                className={`cursor-pointer transition-all ${isSelected ? 'bg-neutral-20' : 'hover:bg-neutral-10'} p-2 rounded`}
                                onClick={() => setSelectedIndustry(isSelected ? null : industry.name)}
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                        <div
                                            className="w-3 h-3 rounded flex-shrink-0"
                                            style={{ backgroundColor: industry.color }}
                                        />
                                        <span className="text-sm font-medium text-neutral-90 truncate">
                                            {industry.name}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 flex-shrink-0">
                                        <span className="text-sm text-neutral-70">
                                            {formatValueCompact(value)}
                                        </span>
                                        <div className="w-16 bg-neutral-20 rounded-full h-2">
                                            <div
                                                className="h-full rounded-full transition-all duration-300"
                                                style={{
                                                    width: `${percentage}%`,
                                                    backgroundColor: industry.color
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded details for selected industry */}
                                {isSelected && (
                                    <div className="mt-3 pt-3 border-t border-neutral-30">
                                        <div className="grid grid-cols-3 gap-4 text-xs mb-3">
                                            <div>
                                                <div className="text-neutral-60">Companies</div>
                                                <div className="font-medium">{industry.count}</div>
                                            </div>
                                            <div>
                                                <div className="text-neutral-60">Exposure</div>
                                                <div className="font-medium">₹{(industry.totalExposure / 10000000).toFixed(1)}Cr</div>
                                            </div>
                                            <div>
                                                <div className="text-neutral-60">Avg Risk</div>
                                                <div className="font-medium">{industry.averageRiskScore.toFixed(1)}%</div>
                                            </div>
                                        </div>

                                        {showRiskOverlay && (
                                            <div>
                                                <div className="text-xs text-neutral-70 mb-1">Risk Distribution:</div>
                                                <div className="flex gap-1">
                                                    {Object.entries(industry.riskDistribution).map(([grade, count]) => {
                                                        const riskPercentage = industry.count > 0 ? (count / industry.count) * 100 : 0;
                                                        return (
                                                            <div
                                                                key={grade}
                                                                className="flex-1 h-2 rounded"
                                                                style={{
                                                                    backgroundColor: getRiskGradeColor(grade.toUpperCase()),
                                                                    opacity: riskPercentage > 0 ? 1 : 0.2
                                                                }}
                                                                title={`${grade.toUpperCase()}: ${count} companies (${riskPercentage.toFixed(1)}%)`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            ) : (
                // Chart view with Recharts
                <div className="mb-6">
                    <div className="h-96 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={getChartData()}
                                margin={{
                                    top: 20,
                                    right: 30,
                                    left: 20,
                                    bottom: 60,
                                }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    fontSize={12}
                                    stroke="#6b7280"
                                />
                                <YAxis
                                    fontSize={12}
                                    stroke="#6b7280"
                                    tickFormatter={(value) => {
                                        if (viewMode === 'exposure') {
                                            return `₹${(value / 10000000).toFixed(0)}Cr`;
                                        }
                                        if (viewMode === 'risk') {
                                            return `${value.toFixed(0)}%`;
                                        }
                                        return value.toString();
                                    }}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Bar
                                    dataKey="value"
                                    radius={[4, 4, 0, 0]}
                                    cursor="pointer"
                                    onClick={(data) => {
                                        setSelectedIndustry(
                                            selectedIndustry === data.fullName ? null : data.fullName
                                        );
                                    }}
                                >
                                    {getChartData().map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke={selectedIndustry === entry.fullName ? '#3b82f6' : 'transparent'}
                                            strokeWidth={selectedIndustry === entry.fullName ? 2 : 0}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* Selected Industry Details */}
                    {selectedIndustry && (
                        <div className="mt-4 p-4 bg-neutral-10 rounded border border-neutral-30">
                            {(() => {
                                const industry = data.industries.find(ind => ind.name === selectedIndustry);
                                if (!industry) return null;

                                return (
                                    <div>
                                        <div className="flex items-center gap-2 mb-3">
                                            <div
                                                className="w-4 h-4 rounded"
                                                style={{ backgroundColor: industry.color }}
                                            />
                                            <h4 className="font-medium text-neutral-90">{industry.name}</h4>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                            <div>
                                                <div className="text-xs text-neutral-60">Companies</div>
                                                <div className="text-sm font-medium">{industry.count}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-neutral-60">Total Exposure</div>
                                                <div className="text-sm font-medium">₹{(industry.totalExposure / 10000000).toFixed(1)}Cr</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-neutral-60">Avg Risk Score</div>
                                                <div className="text-sm font-medium">{industry.averageRiskScore.toFixed(1)}%</div>
                                            </div>
                                            <div>
                                                <div className="text-xs text-neutral-60">Portfolio %</div>
                                                <div className="text-sm font-medium">{((industry.count / totalCount) * 100).toFixed(1)}%</div>
                                            </div>
                                        </div>

                                        {showRiskOverlay && (
                                            <div>
                                                <div className="text-xs text-neutral-70 mb-2">Risk Distribution:</div>
                                                <div className="flex gap-1 mb-2">
                                                    {Object.entries(industry.riskDistribution).map(([grade, count]) => {
                                                        const riskPercentage = industry.count > 0 ? (count / industry.count) * 100 : 0;
                                                        return (
                                                            <div
                                                                key={grade}
                                                                className="flex-1 h-3 rounded"
                                                                style={{
                                                                    backgroundColor: getRiskGradeColor(grade.toUpperCase()),
                                                                    opacity: riskPercentage > 0 ? 1 : 0.2
                                                                }}
                                                                title={`${grade.toUpperCase()}: ${count} companies (${riskPercentage.toFixed(1)}%)`}
                                                            />
                                                        );
                                                    })}
                                                </div>
                                                <div className="flex justify-between text-xs text-neutral-60">
                                                    {Object.entries(industry.riskDistribution).map(([grade, count]) => (
                                                        <span key={grade}>{grade.toUpperCase()}: {count}</span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                );
                            })()}
                        </div>
                    )}

                    {data.industries.length > 15 && (
                        <div className="text-center text-sm text-neutral-60 mt-4">
                            Showing top 15 industries. Switch to compact or grid view to see all {data.industries.length} industries.
                        </div>
                    )}
                </div>
            )}

            {/* Show More/Less Button */}
            {displayMode === 'compact' && data.industries.length > 8 && (
                <div className="flex justify-center mb-6">
                    <button
                        onClick={() => setShowAll(!showAll)}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                    >
                        {showAll ? (
                            <>
                                <ChevronUp className="w-4 h-4" />
                                Show Less
                            </>
                        ) : (
                            <>
                                <ChevronDown className="w-4 h-4" />
                                Show All ({data.industries.length - 8} more)
                            </>
                        )}
                    </button>
                </div>
            )}

            {/* Summary Statistics */}
            <div className="pt-4 border-t border-neutral-30">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <div className="text-neutral-60">Total Industries</div>
                        <div className="font-medium text-neutral-90">{data.industries.length}</div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Total Companies</div>
                        <div className="font-medium text-neutral-90">{totalCount}</div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Total Exposure</div>
                        <div className="font-medium text-neutral-90">
                            ₹{(totalExposure / 10000000).toFixed(1)}Cr
                        </div>
                    </div>
                    <div>
                        <div className="text-neutral-60">Avg Risk Score</div>
                        <div className="font-medium text-neutral-90">
                            {(data.industries.reduce((sum, ind) => sum + ind.averageRiskScore, 0) / data.industries.length).toFixed(1)}%
                        </div>
                    </div>
                </div>
            </div>

            {/* Risk Grade Legend */}
            {showRiskOverlay && (
                <div className="mt-4 pt-4 border-t border-neutral-30">
                    <div className="text-sm font-medium text-neutral-90 mb-2">Risk Grades:</div>
                    <div className="flex flex-wrap gap-3">
                        {[
                            { grade: 'CM1', color: FluentColors.success },
                            { grade: 'CM2', color: '#0E8A0E' },
                            { grade: 'CM3', color: FluentColors.warning },
                            { grade: 'CM4', color: FluentColors.orange },
                            { grade: 'CM5', color: FluentColors.error }
                        ].map(({ grade, color }) => (
                            <div key={grade} className="flex items-center gap-2">
                                <div
                                    className="w-3 h-3 rounded"
                                    style={{ backgroundColor: color }}
                                />
                                <span className="text-xs text-neutral-70">{grade}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </Card>
    );
}