'use client';

import React, { useMemo } from 'react';

interface ScoreDistributionData {
    ranges: Array<{
        min: number;
        max: number;
        count: number;
        label: string;
        color: string;
    }>;
    totalCount: number;
    averageScore: number;
    medianScore: number;
}

interface ScoreDistributionProps {
    data: ScoreDistributionData;
    title?: string;
    height?: number;
    className?: string;
    showStats?: boolean;
}

export function ScoreDistribution({
    data,
    title,
    height = 300,
    className = '',
    showStats = true
}: ScoreDistributionProps) {
    const { maxCount, chartData } = useMemo(() => {
        const max = Math.max(...data.ranges.map(r => r.count));
        return {
            maxCount: max,
            chartData: data.ranges.map((range, index) => ({
                ...range,
                x: (index / data.ranges.length) * 100,
                width: (1 / data.ranges.length) * 100,
                height: (range.count / max) * 100,
                percentage: (range.count / data.totalCount) * 100
            }))
        };
    }, [data]);

    return (
        <div className={`w-full ${className}`}>
            {title && (
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
            )}

            <div className="space-y-4">
                {/* Chart */}
                <div className="relative bg-gray-50 rounded-lg p-4" style={{ height }}>
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="absolute inset-4"
                    >
                        {/* Grid lines */}
                        {[0, 25, 50, 75, 100].map(y => (
                            <line
                                key={y}
                                x1="0"
                                y1={100 - y}
                                x2="100"
                                y2={100 - y}
                                stroke="#e5e7eb"
                                strokeWidth="0.2"
                                vectorEffect="non-scaling-stroke"
                            />
                        ))}

                        {/* Bars */}
                        {chartData.map((bar, index) => (
                            <g key={index}>
                                <rect
                                    x={bar.x}
                                    y={100 - bar.height}
                                    width={bar.width * 0.8}
                                    height={bar.height}
                                    fill={bar.color}
                                    opacity="0.8"
                                    vectorEffect="non-scaling-stroke"
                                />

                                {/* Bar labels */}
                                <text
                                    x={bar.x + (bar.width * 0.4)}
                                    y={100 - bar.height - 2}
                                    textAnchor="middle"
                                    fontSize="2"
                                    fill="#374151"
                                    vectorEffect="non-scaling-stroke"
                                >
                                    {bar.count}
                                </text>
                            </g>
                        ))}
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-4 bottom-4 flex flex-col justify-between text-xs text-gray-500 -ml-8">
                        <span>{maxCount}</span>
                        <span>{Math.round(maxCount * 0.75)}</span>
                        <span>{Math.round(maxCount * 0.5)}</span>
                        <span>{Math.round(maxCount * 0.25)}</span>
                        <span>0</span>
                    </div>
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-gray-500 px-4">
                    {data.ranges.map((range, index) => (
                        <div key={index} className="text-center" style={{ width: `${100 / data.ranges.length}%` }}>
                            <div className="font-medium">{range.label}</div>
                            <div className="text-gray-400">
                                {range.min}-{range.max}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center">
                    {data.ranges.map((range, index) => (
                        <div key={index} className="flex items-center space-x-2">
                            <div
                                className="w-3 h-3 rounded"
                                style={{ backgroundColor: range.color }}
                            />
                            <span className="text-sm text-gray-600">
                                {range.label} ({range.count})
                            </span>
                        </div>
                    ))}
                </div>

                {/* Statistics */}
                {showStats && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-4 border-t border-gray-200">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                                {data.totalCount.toLocaleString()}
                            </div>
                            <div className="text-sm text-gray-600">Total Companies</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {data.averageScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">Average Score</div>
                        </div>

                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {data.medianScore.toFixed(1)}
                            </div>
                            <div className="text-sm text-gray-600">Median Score</div>
                        </div>
                    </div>
                )}

                {/* Detailed breakdown */}
                <div className="space-y-2">
                    {chartData.map((bar, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div
                                    className="w-4 h-4 rounded"
                                    style={{ backgroundColor: bar.color }}
                                />
                                <div>
                                    <div className="font-medium text-gray-900">{bar.label}</div>
                                    <div className="text-sm text-gray-600">
                                        Score range: {bar.min}-{bar.max}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className="font-semibold text-gray-900">{bar.count}</div>
                                <div className="text-sm text-gray-600">
                                    {bar.percentage.toFixed(1)}%
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}