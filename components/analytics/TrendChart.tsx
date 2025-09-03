'use client';

import React, { useMemo } from 'react';

interface TrendDataPoint {
    date: string;
    value: number;
    category?: string;
}

interface TrendSeries {
    name: string;
    data: TrendDataPoint[];
    color: string;
}

interface TrendChartProps {
    series: TrendSeries[];
    title?: string;
    height?: number;
    className?: string;
    yAxisLabel?: string;
    format?: 'number' | 'currency' | 'percentage';
    showLegend?: boolean;
    showGrid?: boolean;
}

export function TrendChart({
    series,
    title,
    height = 300,
    className = '',
    yAxisLabel,
    format = 'number',
    showLegend = true,
    showGrid = true
}: TrendChartProps) {
    const { minValue, maxValue, chartData, dateRange } = useMemo(() => {
        if (!series.length || !series[0].data.length) {
            return { minValue: 0, maxValue: 100, chartData: [], dateRange: [] };
        }

        // Get all unique dates and sort them
        const allDates = Array.from(
            new Set(series.flatMap(s => s.data.map(d => d.date)))
        ).sort();

        // Get min/max values across all series
        const allValues = series.flatMap(s => s.data.map(d => d.value));
        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const padding = (max - min) * 0.1;

        // Normalize data for each series
        const normalizedSeries = series.map(s => ({
            ...s,
            points: allDates.map(date => {
                const dataPoint = s.data.find(d => d.date === date);
                return {
                    date,
                    value: dataPoint?.value || null,
                    x: (allDates.indexOf(date) / (allDates.length - 1)) * 100,
                    y: dataPoint ? ((dataPoint.value - (min - padding)) / (max - min + 2 * padding)) * 100 : null
                };
            }).filter(p => p.value !== null)
        }));

        return {
            minValue: Math.max(0, min - padding),
            maxValue: max + padding,
            chartData: normalizedSeries,
            dateRange: allDates
        };
    }, [series]);

    const formatValue = (value: number) => {
        switch (format) {
            case 'currency':
                return `₹${(value / 10000000).toFixed(1)}Cr`;
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'number':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    };

    const createPath = (points: Array<{ x: number; y: number }>) => {
        if (points.length === 0) return '';

        const pathData = points.map((point, index) => {
            const command = index === 0 ? 'M' : 'L';
            return `${command} ${point.x} ${100 - point.y}`;
        }).join(' ');

        return pathData;
    };

    return (
        <div className={`w-full ${className}`}>
            {title && (
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
            )}

            <div className="space-y-4">
                {/* Chart */}
                <div className="relative" style={{ height }}>
                    <svg
                        width="100%"
                        height="100%"
                        viewBox="0 0 100 100"
                        preserveAspectRatio="none"
                        className="absolute inset-0"
                    >
                        {/* Grid */}
                        {showGrid && (
                            <defs>
                                <pattern id="trendGrid" width="10" height="10" patternUnits="userSpaceOnUse">
                                    <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f3f4f6" strokeWidth="0.5" />
                                </pattern>
                            </defs>
                        )}
                        {showGrid && <rect width="100" height="100" fill="url(#trendGrid)" />}

                        {/* Trend lines */}
                        {chartData.map((seriesData, index) => {
                            const path = createPath(seriesData.points.map(p => ({ x: p.x, y: p.y! })));

                            return (
                                <g key={index}>
                                    {/* Line */}
                                    <path
                                        d={path}
                                        fill="none"
                                        stroke={seriesData.color}
                                        strokeWidth="1"
                                        vectorEffect="non-scaling-stroke"
                                    />

                                    {/* Data points */}
                                    {seriesData.points.map((point, pointIndex) => (
                                        <circle
                                            key={pointIndex}
                                            cx={point.x}
                                            cy={100 - point.y!}
                                            r="0.8"
                                            fill={seriesData.color}
                                            vectorEffect="non-scaling-stroke"
                                        />
                                    ))}
                                </g>
                            );
                        })}
                    </svg>

                    {/* Y-axis labels */}
                    <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-16">
                        <span>{formatValue(maxValue)}</span>
                        <span>{formatValue((maxValue + minValue) / 2)}</span>
                        <span>{formatValue(minValue)}</span>
                    </div>

                    {/* Y-axis label */}
                    {yAxisLabel && (
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-600 -ml-12">
                            {yAxisLabel}
                        </div>
                    )}
                </div>

                {/* X-axis labels */}
                <div className="flex justify-between text-xs text-gray-500">
                    {dateRange.length > 0 && (
                        <>
                            <span>{new Date(dateRange[0]).toLocaleDateString()}</span>
                            {dateRange.length > 2 && (
                                <span>{new Date(dateRange[Math.floor(dateRange.length / 2)]).toLocaleDateString()}</span>
                            )}
                            <span>{new Date(dateRange[dateRange.length - 1]).toLocaleDateString()}</span>
                        </>
                    )}
                </div>

                {/* Legend */}
                {showLegend && (
                    <div className="flex flex-wrap gap-4 justify-center">
                        {series.map((s, index) => (
                            <div key={index} className="flex items-center space-x-2">
                                <div
                                    className="w-3 h-0.5"
                                    style={{ backgroundColor: s.color }}
                                />
                                <span className="text-sm text-gray-600">{s.name}</span>
                            </div>
                        ))}
                    </div>
                )}

                {/* Summary statistics */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200">
                    {series.map((s, index) => {
                        const values = s.data.map(d => d.value);
                        const latest = values[values.length - 1];
                        const previous = values[values.length - 2];
                        const change = previous ? ((latest - previous) / previous) * 100 : 0;

                        return (
                            <div key={index} className="text-center">
                                <div className="flex items-center justify-center space-x-2">
                                    <div
                                        className="w-3 h-3 rounded-full"
                                        style={{ backgroundColor: s.color }}
                                    />
                                    <span className="text-sm font-medium text-gray-900">{s.name}</span>
                                </div>
                                <div className="text-lg font-bold text-gray-900 mt-1">
                                    {formatValue(latest)}
                                </div>
                                <div className={`text-sm ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {change >= 0 ? '↗' : '↘'} {Math.abs(change).toFixed(1)}%
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}