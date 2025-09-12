"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterCriteria } from '@/types/portfolio.types';
import { cn } from '@/lib/utils';
import {
    TrendingUp,
    TrendingDown,
    Users,
    AlertTriangle,
    Info,
    ChevronDown,
    ChevronUp,
    Zap
} from 'lucide-react';

interface FilterImpact {
    totalCompanies: number;
    filteredCompanies: number;
    impactPercentage: number;
    estimatedLoadTime: number;
    affectedMetrics: {
        averageRiskScore: {
            before: number;
            after: number;
            change: number;
        };
        industryDiversity: {
            before: number;
            after: number;
            change: number;
        };
        complianceRate: {
            before: number;
            after: number;
            change: number;
        };
    };
    warnings: string[];
    suggestions: string[];
}

interface FilterImpactIndicatorProps {
    filters: FilterCriteria;
    totalCount: number;
    filteredCount: number;
    isLoading?: boolean;
    className?: string;
    showDetails?: boolean;
    onOptimizeFilters?: () => void;
}

export function FilterImpactIndicator({
    filters,
    totalCount,
    filteredCount,
    isLoading = false,
    className = '',
    showDetails = false,
    onOptimizeFilters
}: FilterImpactIndicatorProps) {
    const [impact, setImpact] = useState<FilterImpact | null>(null);
    const [isExpanded, setIsExpanded] = useState(false);

    // Calculate filter impact
    useEffect(() => {
        const calculateImpact = () => {
            const activeFilterCount = Object.keys(filters).filter(key => {
                const value = filters[key as keyof FilterCriteria];
                return value !== undefined && value !== null &&
                    (Array.isArray(value) ? value.length > 0 : true);
            }).length;

            // Simulate impact calculation
            const impactPercentage = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;
            const estimatedLoadTime = Math.max(200, activeFilterCount * 150 + (filteredCount > 500 ? 300 : 0));

            // Mock metric changes based on filter impact
            const riskScoreChange = impactPercentage < 50 ? -0.5 : 0.2;
            const industryChange = Math.max(-10, -activeFilterCount * 2);
            const complianceChange = impactPercentage < 30 ? 5 : -2;

            const warnings: string[] = [];
            const suggestions: string[] = [];

            // Generate warnings
            if (impactPercentage < 5) {
                warnings.push('Very restrictive filters may limit analysis effectiveness');
            }
            if (activeFilterCount > 8) {
                warnings.push('Many filters applied - consider using presets for better performance');
            }
            if (estimatedLoadTime > 2000) {
                warnings.push('Complex filters may cause slower loading times');
            }

            // Generate suggestions
            if (impactPercentage > 80) {
                suggestions.push('Consider adding more specific filters to focus your analysis');
            }
            if (activeFilterCount > 5 && impactPercentage < 20) {
                suggestions.push('Try removing some filters to broaden your results');
            }

            setImpact({
                totalCompanies: totalCount,
                filteredCompanies: filteredCount,
                impactPercentage,
                estimatedLoadTime,
                affectedMetrics: {
                    averageRiskScore: {
                        before: 6.5,
                        after: 6.5 + riskScoreChange,
                        change: riskScoreChange
                    },
                    industryDiversity: {
                        before: 15,
                        after: Math.max(1, 15 + industryChange),
                        change: industryChange
                    },
                    complianceRate: {
                        before: 75,
                        after: Math.min(100, Math.max(0, 75 + complianceChange)),
                        change: complianceChange
                    }
                },
                warnings,
                suggestions
            });
        };

        calculateImpact();
    }, [filters, totalCount, filteredCount]);

    if (!impact) return null;

    const getImpactColor = (percentage: number) => {
        if (percentage < 10) return 'text-red-600';
        if (percentage < 30) return 'text-yellow-600';
        if (percentage < 70) return 'text-green-600';
        return 'text-blue-600';
    };

    const getImpactBadgeVariant = (percentage: number) => {
        if (percentage < 10) return 'destructive' as const;
        if (percentage < 30) return 'warning' as const;
        if (percentage < 70) return 'success' as const;
        return 'info' as const;
    };

    const formatMetricChange = (change: number, suffix: string = '') => {
        const sign = change > 0 ? '+' : '';
        return `${sign}${change.toFixed(1)}${suffix}`;
    };

    return (
        <Card className={cn("border-l-4", {
            'border-l-red-500': impact.impactPercentage < 10,
            'border-l-yellow-500': impact.impactPercentage >= 10 && impact.impactPercentage < 30,
            'border-l-green-500': impact.impactPercentage >= 30 && impact.impactPercentage < 70,
            'border-l-blue-500': impact.impactPercentage >= 70
        }, className)} padding="sm">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-neutral-60" />
                        <span className="text-sm font-medium text-neutral-90">
                            Filter Impact
                        </span>
                    </div>

                    <Badge variant={getImpactBadgeVariant(impact.impactPercentage)} size="sm">
                        {impact.filteredCompanies.toLocaleString()} / {impact.totalCompanies.toLocaleString()}
                    </Badge>

                    <span className={cn("text-sm font-medium", getImpactColor(impact.impactPercentage))}>
                        {impact.impactPercentage.toFixed(1)}%
                    </span>

                    {isLoading && (
                        <div className="flex items-center gap-1">
                            <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                            <span className="text-xs text-neutral-60">Updating...</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {impact.estimatedLoadTime > 1500 && (
                        <div className="flex items-center gap-1 text-yellow-600">
                            <Zap className="w-3 h-3" />
                            <span className="text-xs">{(impact.estimatedLoadTime / 1000).toFixed(1)}s</span>
                        </div>
                    )}

                    {showDetails && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="p-1"
                        >
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4" />
                            ) : (
                                <ChevronDown className="w-4 h-4" />
                            )}
                        </Button>
                    )}
                </div>
            </div>

            {/* Expanded Details */}
            {isExpanded && showDetails && (
                <div className="mt-3 space-y-3 border-t border-neutral-20 pt-3">
                    {/* Metric Changes */}
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center">
                            <div className="text-neutral-60">Avg Risk Score</div>
                            <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{impact.affectedMetrics.averageRiskScore.after.toFixed(1)}</span>
                                <span className={cn("text-xs", {
                                    'text-green-600': impact.affectedMetrics.averageRiskScore.change < 0,
                                    'text-red-600': impact.affectedMetrics.averageRiskScore.change > 0,
                                    'text-neutral-60': impact.affectedMetrics.averageRiskScore.change === 0
                                })}>
                                    {impact.affectedMetrics.averageRiskScore.change < 0 ? (
                                        <TrendingDown className="w-3 h-3" />
                                    ) : impact.affectedMetrics.averageRiskScore.change > 0 ? (
                                        <TrendingUp className="w-3 h-3" />
                                    ) : null}
                                    {formatMetricChange(impact.affectedMetrics.averageRiskScore.change)}
                                </span>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-neutral-60">Industries</div>
                            <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{impact.affectedMetrics.industryDiversity.after}</span>
                                <span className={cn("text-xs", {
                                    'text-red-600': impact.affectedMetrics.industryDiversity.change < 0,
                                    'text-green-600': impact.affectedMetrics.industryDiversity.change > 0,
                                    'text-neutral-60': impact.affectedMetrics.industryDiversity.change === 0
                                })}>
                                    {formatMetricChange(impact.affectedMetrics.industryDiversity.change)}
                                </span>
                            </div>
                        </div>

                        <div className="text-center">
                            <div className="text-neutral-60">Compliance</div>
                            <div className="flex items-center justify-center gap-1">
                                <span className="font-medium">{impact.affectedMetrics.complianceRate.after.toFixed(0)}%</span>
                                <span className={cn("text-xs", {
                                    'text-green-600': impact.affectedMetrics.complianceRate.change > 0,
                                    'text-red-600': impact.affectedMetrics.complianceRate.change < 0,
                                    'text-neutral-60': impact.affectedMetrics.complianceRate.change === 0
                                })}>
                                    {formatMetricChange(impact.affectedMetrics.complianceRate.change, '%')}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Warnings */}
                    {impact.warnings.length > 0 && (
                        <div className="space-y-1">
                            {impact.warnings.map((warning, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs text-yellow-700 bg-yellow-50 p-2 rounded">
                                    <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{warning}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Suggestions */}
                    {impact.suggestions.length > 0 && (
                        <div className="space-y-1">
                            {impact.suggestions.map((suggestion, index) => (
                                <div key={index} className="flex items-start gap-2 text-xs text-blue-700 bg-blue-50 p-2 rounded">
                                    <Info className="w-3 h-3 mt-0.5 flex-shrink-0" />
                                    <span>{suggestion}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Optimize Button */}
                    {(impact.warnings.length > 0 || impact.estimatedLoadTime > 2000) && onOptimizeFilters && (
                        <div className="flex justify-center pt-2 border-t border-neutral-20">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onOptimizeFilters}
                                className="text-xs"
                            >
                                <Zap className="w-3 h-3 mr-1" />
                                Optimize Filters
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}