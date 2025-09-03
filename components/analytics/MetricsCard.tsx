'use client';

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

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
    color?: 'blue' | 'green' | 'yellow' | 'red' | 'gray';
    subtitle?: string;
}

interface MetricsCardProps {
    metrics: MetricData[];
    title?: string;
    className?: string;
}

export function MetricsCard({ metrics, title, className = '' }: MetricsCardProps) {
    const formatValue = (value: string | number, format?: string) => {
        if (typeof value === 'string') return value;

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
        <Card className={`p-6 ${className}`}>
            {title && (
                <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {metrics.map((metric, index) => (
                    <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                {metric.icon && (
                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${getColorClasses(metric.color)}`}>
                                        <span className="text-sm">{metric.icon}</span>
                                    </div>
                                )}
                                <div>
                                    <p className="text-sm font-medium text-gray-600">{metric.label}</p>
                                    {metric.subtitle && (
                                        <p className="text-xs text-gray-500">{metric.subtitle}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-end justify-between">
                            <div>
                                <p className="text-2xl font-bold text-gray-900">
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
                ))}
            </div>
        </Card>
    );
}