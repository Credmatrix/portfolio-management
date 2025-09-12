'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { MetricsCardClickData } from '@/types/chart-interactions.types';
import {
    getChartElementStyles,
    getHoverHintClasses,
    LoadingOverlay
} from "@/lib/utils/chart-visual-feedback";

interface MetricData {
    label: string;
    value: string | number;
    change?: {
        value: number;
        period: string;
        trend: 'up' | 'down' | 'neutral';
    };
    format?: 'number' | 'currency' | 'percentage';
    icon?: string;
    color?: any;
    subtitle?: string;
    metricType?: 'total_companies' | 'average_risk_score' | 'total_exposure' | 'compliance_rate';
    filterType?: 'all' | 'above_average' | 'below_average';
    clickable?: boolean;
}

interface MetricsCardProps {
    metrics: MetricData[];
    title?: string;
    className?: string;
    onMetricClick?: (data: MetricsCardClickData) => void;
    activeMetricFilters?: string[];
    isInteractive?: boolean;
    isLoading?: boolean;
}

export function MetricsCard({
    metrics,
    title,
    className = '',
    onMetricClick,
    activeMetricFilters = [],
    isInteractive = false,
    isLoading = false
}: MetricsCardProps) {
    const [hoveredMetric, setHoveredMetric] = useState<number | null>(null);

    const handleMetricClick = (metric: MetricData, index: number) => {
        if (!isInteractive || !onMetricClick || !metric.clickable) return;

        const clickData: MetricsCardClickData = {
            label: metric.label,
            value: typeof metric.value === 'number' ? metric.value : parseFloat(metric.value.toString()) || 0,
            metricType: metric.metricType || 'total_companies',
            filterType: metric.filterType || 'all',
            category: 'metric'
        };

        onMetricClick(clickData);
    };

    const formatValue = (value: string | number, format?: string) => {
        if (typeof value === 'string') return value;

        switch (format) {
            case 'currency':
                return `₹${(value).toFixed(1)}Cr`;
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'number':
                return value.toLocaleString();
            default:
                return value.toString();
        }
    };

    const getColorClasses = (color?: string) => {
        switch (color) {
            case 'blue':
                return 'bg-blue-100 text-blue-600';
            case 'green':
                return 'bg-green-100 text-green-600';
            case 'yellow':
                return 'bg-yellow-100 text-yellow-600';
            case 'red':
                return 'bg-red-100 text-red-600';
            default:
                return 'bg-gray-100 text-gray-600';
        }
    };

    const getTrendIcon = (trend: 'up' | 'down' | 'neutral') => {
        switch (trend) {
            case 'up':
                return '↗️';
            case 'down':
                return '↘️';
            default:
                return '→';
        }
    };

    const getTrendColor = (trend: 'up' | 'down' | 'neutral') => {
        switch (trend) {
            case 'up':
                return 'text-green-600';
            case 'down':
                return 'text-red-600';
            default:
                return 'text-gray-600';
        }
    };

    return (
        <Card className={`p-6 relative ${className}`}>
            {/* <LoadingOverlay isVisible={isLoading} message="Updating metrics..." /> */}

            {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            )}

            <div className="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-5 gap-6">
                {metrics.map((metric, index) => {
                    const isSelected = isInteractive && activeMetricFilters.includes(`${metric.metricType}_${metric.filterType}`);
                    const isHovered = hoveredMetric === index;
                    const isClickable = isInteractive && metric.clickable;

                    const visualStyles = getChartElementStyles({
                        isInteractive,
                        isSelected,
                        isHovered,
                        isClickable,
                        isLoading
                    });

                    return (
                        <div
                            key={index}
                            className={`group space-y-2 rounded-lg p-3 -m-3 ${visualStyles.containerClasses} ${visualStyles.cursorStyle} ${isClickable ? 'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2' : ''}`}
                            onClick={() => handleMetricClick(metric, index)}
                            onKeyDown={(e) => {
                                if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                                    e.preventDefault();
                                    handleMetricClick(metric, index);
                                }
                            }}
                            onMouseEnter={() => isClickable && setHoveredMetric(index)}
                            onMouseLeave={() => setHoveredMetric(null)}
                            style={visualStyles.barStyles}
                            tabIndex={isClickable ? 0 : -1}
                            role={isClickable ? "button" : undefined}
                            aria-label={isClickable ? `${metric.label}: ${formatValue(metric.value, metric.format)}. Click to filter portfolio.` : undefined}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                    {/* {metric.icon && (
                                        <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-all duration-200 ${getColorClasses(metric.color)
                                            } ${isSelected ? 'ring-2 ring-white ring-opacity-80 scale-110' : isHovered ? 'scale-105' : ''
                                            }`}>
                                            <span className="text-sm">{metric.icon}</span>
                                        </div>
                                    )} */}
                                    <div>
                                        <p className={`text-sm font-medium ${visualStyles.textClasses}`}>
                                            {metric.label}
                                        </p>
                                        {metric.subtitle && (
                                            <p className="text-xs text-gray-500">{metric.subtitle}</p>
                                        )}
                                        {isClickable && (
                                            <p className={getHoverHintClasses(isInteractive, isClickable)}>
                                                Click to filter
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-end justify-between">
                                <div>
                                    <p className={`text-2xl font-bold transition-all duration-200 ${visualStyles.textClasses} ${isHovered ? 'scale-105' : ''
                                        }`}>
                                        {formatValue(metric.value, metric.format)}
                                    </p>

                                    {metric.change && (
                                        <div className="flex items-center space-x-1 mt-1">
                                            <span className={`text-sm ${getTrendColor(metric.change.trend)}`}>
                                                {getTrendIcon(metric.change.trend)}
                                                {Math.abs(metric.change.value).toFixed(1)}%
                                            </span>
                                            <span className="text-xs text-gray-500">
                                                vs {metric.change.period}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </Card>
    );
}