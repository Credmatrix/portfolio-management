'use client';

import React, { useMemo } from 'react';

interface PerformanceDataPoint {
    date: string;
    value: number;
    benchmark?: number;
    target?: number;
}

interface PerformanceChartProps {
    data: PerformanceDataPoint[];
    title?: string;
    height?: number;
    className?: string;
    showBenchmark?: boolean;
    showTarget?: boolean;
    yAxisLabel?: string;
    format?: 'number' | 'currency' | 'percentage';
}

export function PerformanceChart({
    data,
    title,
    height = 300,
    className = '',
    showBenchmark = false,
    showTarget = false,
    yAxisLabel,
    format = 'number'
}: PerformanceChartProps) {
    const { minValue, maxValue, chartData } = useMemo(() => {
        if (!data.length) return { minValue: 0, maxValue: 100, chartData: [] };

        const allValues = data.flatMap(d => [
            d.value,
            ...(showBenchmark && d.benchmark ? [d.benchmark] : []),
            ...(showTarget && d.target ? [d.target] : [])
        ]);

        const min = Math.min(...allValues);
        const max = Math.max(...allValues);
        const padding = (max - min) * 0.1;

        return {
            minValue: Math.max(0, min - padding),
            maxValue: max + padding,
            chartData: data.map((point, index) => ({
                ...point,
                x: (index / (data.length - 1)) * 100,
                y: ((point.value - (min - padding)) / (max - min + 2 * padding)) * 100,
                benchmarkY: point.benchmark ? ((point.benchmark - (min - padding)) / (max - min + 2 * padding)) * 100 : undefined,
                targetY: point.target ? ((point.target - (min - padding)) / (max - min + 2 * padding)) * 100 : undefined
            }))
        };
    }, [data, showBenchmark, showTarget]);

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

    const mainPath = createPath(chartData.map(d => ({ x: d.x, y: d.y })));
    const benchmarkPath = showBenchmark ? createPath(
        chartData.filter(d => d.benchmarkY !== undefined).map(d => ({ x: d.x, y: d.benchmarkY! }))
    ) : '';
    const targetPath = showTarget ? createPath(
        chartData.filter(d => d.targetY !== undefined).map(d => ({ x: d.x, y: d.targetY! }))
    ) : '';

    return (
        <div className={`w-full ${className}`}>
            {title && (
                <h4 className="text-lg font-semibold text-gray-900 mb-4">{title}</h4>
            )}

            <div className="relative" style={{ height }}>
                <svg
                    width="100%"
                    height="100%"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    className="absolute inset-0"
                >
                    {/* Grid lines */}
                    <defs>
                        <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                            <path d="M 10 0 L 0 0 0 10" fill="none" stroke="#f3f4f6" strokeWidth="0.5" />
                        </pattern>
                    </defs>
                    <rect width="100" height="100" fill="url(#grid)" />

                    {/* Target line */}
                    {showTarget && targetPath && (
                        <path
                            d={targetPath}
                            fill="none"
                            stroke="#10b981"
                            strokeWidth="0.5"
                            strokeDasharray="2,2"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}

                    {/* Benchmark line */}
                    {showBenchmark && benchmarkPath && (
                        <path
                            d={benchmarkPath}
                            fill="none"
                            stroke="#f59e0b"
                            strokeWidth="0.5"
                            strokeDasharray="1,1"
                            vectorEffect="non-scaling-stroke"
                        />
                    )}

                    {/* Main performance line */}
                    <path
                        d={mainPath}
                        fill="none"
                        stroke="#3b82f6"
                        strokeWidth="1"
                        vectorEffect="non-scaling-stroke"
                    />

                    {/* Data points */}
                    {chartData.map((point, index) => (
                        <circle
                            key={index}
                            cx={point.x}
                            cy={100 - point.y}
                            r="0.8"
                            fill="#3b82f6"
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>

                {/* Y-axis labels */}
                <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 -ml-12">
                    <span>{formatValue(maxValue)}</span>
                    <span>{formatValue((maxValue + minValue) / 2)}</span>
                    <span>{formatValue(minValue)}</span>
                </div>

                {/* Y-axis label */}
                {yAxisLabel && (
                    <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -rotate-90 text-xs text-gray-600 -ml-8">
                        {yAxisLabel}
                    </div>
                )}
            </div>

            {/* X-axis labels */}
            <div className="flex justify-between mt-2 text-xs text-gray-500">
                {data.length > 0 && (
                    <>
                        <span>{new Date(data[0].date).toLocaleDateString()}</span>
                        <span>{new Date(data[data.length - 1].date).toLocaleDateString()}</span>
                    </>
                )}
            </div>

            {/* Legend */}
            {(showBenchmark || showTarget) && (
                <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
                    <div className="flex items-center space-x-1">
                        <div className="w-3 h-0.5 bg-blue-500"></div>
                        <span className="text-gray-600">Performance</span>
                    </div>
                    {showBenchmark && (
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-0.5 bg-yellow-500 border-dashed"></div>
                            <span className="text-gray-600">Benchmark</span>
                        </div>
                    )}
                    {showTarget && (
                        <div className="flex items-center space-x-1">
                            <div className="w-3 h-0.5 bg-green-500 border-dashed"></div>
                            <span className="text-gray-600">Target</span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}