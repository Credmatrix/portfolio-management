"use client";

import { Card } from '@/components/ui/Card';
import { MetricsCardClickData } from '@/types/chart-interactions.types';
import { FluentColors } from '@/lib/constants/colors';
import { TrendingUp, TrendingDown, Minus, Users, Shield, DollarSign, AlertTriangle } from 'lucide-react';

interface MetricData {
    label: string;
    value: number | string;
    change?: number;
    changeType?: 'increase' | 'decrease' | 'neutral';
    format?: 'number' | 'currency' | 'percentage';
    icon?: React.ReactNode;
    description?: string;
    clickable?: boolean;
    metricType: 'total_companies' | 'average_risk_score' | 'total_exposure' | 'compliance_rate';
    filterType?: 'all' | 'above_average' | 'below_average';
}

interface InteractiveMetricsCardProps {
    metrics: MetricData[];
    onMetricClick?: (data: MetricsCardClickData) => void;
    isInteractive?: boolean;
    isLoading?: boolean;
    className?: string;
}

export function InteractiveMetricsCard({
    metrics,
    onMetricClick,
    isInteractive = false,
    isLoading = false,
    className = ""
}: InteractiveMetricsCardProps) {

    const formatValue = (value: number | string, format?: string): string => {
        if (typeof value === 'string') return value;

        switch (format) {
            case 'currency':
                return `₹${(value / 10000000).toFixed(1)}Cr`;
            case 'percentage':
                return `${value.toFixed(1)}%`;
            case 'number':
            default:
                return value.toLocaleString();
        }
    };

    const getChangeIcon = (changeType?: string) => {
        switch (changeType) {
            case 'increase':
                return <TrendingUp className="w-3 h-3 text-green-600" />;
            case 'decrease':
                return <TrendingDown className="w-3 h-3 text-red-600" />;
            case 'neutral':
            default:
                return <Minus className="w-3 h-3 text-neutral-500" />;
        }
    };

    const getChangeColor = (changeType?: string) => {
        switch (changeType) {
            case 'increase':
                return 'text-green-600';
            case 'decrease':
                return 'text-red-600';
            case 'neutral':
            default:
                return 'text-neutral-500';
        }
    };

    const handleMetricClick = (metric: MetricData) => {
        if (!isInteractive || !onMetricClick || !metric.clickable) return;

        const clickData: MetricsCardClickData = {
            label: metric.label,
            value: typeof metric.value === 'string' ? 0 : metric.value,
            metricType: metric.metricType,
            filterType: metric.filterType,
            category: 'metrics'
        };

        onMetricClick(clickData);
    };

    const getDefaultIcon = (metricType: string) => {
        switch (metricType) {
            case 'total_companies':
                return <Users className="w-5 h-5 text-blue-600" />;
            case 'average_risk_score':
                return <AlertTriangle className="w-5 h-5 text-orange-600" />;
            case 'total_exposure':
                return <DollarSign className="w-5 h-5 text-green-600" />;
            case 'compliance_rate':
                return <Shield className="w-5 h-5 text-purple-600" />;
            default:
                return <Users className="w-5 h-5 text-neutral-600" />;
        }
    };

    return (
        <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 ${className}`}>
            {metrics.map((metric, index) => (
                <Card
                    key={index}
                    className={`relative transition-all duration-200 ${isInteractive && metric.clickable
                            ? 'cursor-pointer hover:shadow-md hover:border-blue-300 hover:bg-blue-50'
                            : ''
                        } ${isLoading ? 'opacity-60' : ''}`}
                    onClick={() => handleMetricClick(metric)}
                >
                    {/* Loading Overlay */}
                    {isLoading && (
                        <div className="absolute inset-0 bg-white bg-opacity-80 flex items-center justify-center rounded-lg">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                    )}

                    <div className="flex items-start justify-between">
                        <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                                {metric.icon || getDefaultIcon(metric.metricType)}
                                <span className="text-sm font-medium text-neutral-70">
                                    {metric.label}
                                </span>
                            </div>

                            <div className="text-2xl font-bold text-neutral-90 mb-1">
                                {formatValue(metric.value, metric.format)}
                            </div>

                            {metric.change !== undefined && (
                                <div className={`flex items-center gap-1 text-sm ${getChangeColor(metric.changeType)}`}>
                                    {getChangeIcon(metric.changeType)}
                                    <span>
                                        {metric.change > 0 ? '+' : ''}{metric.change.toFixed(1)}%
                                    </span>
                                    <span className="text-neutral-500 text-xs">vs last period</span>
                                </div>
                            )}

                            {metric.description && (
                                <p className="text-xs text-neutral-60 mt-2">
                                    {metric.description}
                                </p>
                            )}

                            {isInteractive && metric.clickable && (
                                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <span className="text-xs text-blue-600">
                                        Click to filter
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Interactive Indicator */}
                    {isInteractive && metric.clickable && (
                        <div className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                    )}
                </Card>
            ))}
        </div>
    );
}

// Predefined metric configurations for common use cases
export const createPortfolioMetrics = (data: {
    totalCompanies: number;
    averageRiskScore: number;
    totalExposure: number;
    complianceRate: number;
    previousPeriodData?: {
        totalCompanies: number;
        averageRiskScore: number;
        totalExposure: number;
        complianceRate: number;
    };
}): MetricData[] => {
    const calculateChange = (current: number, previous?: number) => {
        if (!previous || previous === 0) return undefined;
        return ((current - previous) / previous) * 100;
    };

    const getChangeType = (change?: number): 'increase' | 'decrease' | 'neutral' => {
        if (!change) return 'neutral';
        if (Math.abs(change) < 0.1) return 'neutral';
        return change > 0 ? 'increase' : 'decrease';
    };

    return [
        {
            label: 'Total Companies',
            value: data.totalCompanies,
            change: calculateChange(data.totalCompanies, data.previousPeriodData?.totalCompanies),
            changeType: getChangeType(calculateChange(data.totalCompanies, data.previousPeriodData?.totalCompanies)),
            format: 'number',
            metricType: 'total_companies',
            clickable: true,
            description: 'Click to view all companies'
        },
        {
            label: 'Average Risk Score',
            value: data.averageRiskScore,
            change: calculateChange(data.averageRiskScore, data.previousPeriodData?.averageRiskScore),
            changeType: getChangeType(calculateChange(data.averageRiskScore, data.previousPeriodData?.averageRiskScore)),
            format: 'percentage',
            metricType: 'average_risk_score',
            clickable: true,
            filterType: 'above_average',
            description: 'Click to filter above-average risk scores'
        },
        {
            label: 'Total Exposure',
            value: data.totalExposure,
            change: calculateChange(data.totalExposure, data.previousPeriodData?.totalExposure),
            changeType: getChangeType(calculateChange(data.totalExposure, data.previousPeriodData?.totalExposure)),
            format: 'currency',
            metricType: 'total_exposure',
            clickable: false,
            description: 'Total recommended credit limits'
        },
        {
            label: 'Compliance Rate',
            value: data.complianceRate,
            change: calculateChange(data.complianceRate, data.previousPeriodData?.complianceRate),
            changeType: getChangeType(calculateChange(data.complianceRate, data.previousPeriodData?.complianceRate)),
            format: 'percentage',
            metricType: 'compliance_rate',
            clickable: true,
            description: 'Click to filter compliant companies'
        }
    ];
};