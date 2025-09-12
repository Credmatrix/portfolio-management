"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterCriteria } from '@/types/portfolio.types';
import { cn } from '@/lib/utils';
import {
    Activity,
    Clock,
    Zap,
    AlertTriangle,
    CheckCircle,
    TrendingUp,
    TrendingDown,
    BarChart3,
    RefreshCw
} from 'lucide-react';

interface PerformanceMetrics {
    requestTime: number;
    responseTime: number;
    totalTime: number;
    cacheHit: boolean;
    resultCount: number;
    queryComplexity: 'low' | 'medium' | 'high';
    memoryUsage?: number;
    networkLatency?: number;
}

interface FilterPerformanceMonitorProps {
    filters: FilterCriteria;
    isLoading: boolean;
    lastRequestTime?: number;
    className?: string;
    showDetails?: boolean;
    onOptimizeRequest?: () => void;
}

export function FilterPerformanceMonitor({
    filters,
    isLoading,
    lastRequestTime,
    className = '',
    showDetails = false,
    onOptimizeRequest
}: FilterPerformanceMonitorProps) {
    const [metrics, setMetrics] = useState<PerformanceMetrics[]>([]);
    const [currentMetrics, setCurrentMetrics] = useState<PerformanceMetrics | null>(null);
    const [averageResponseTime, setAverageResponseTime] = useState<number>(0);
    const requestStartTime = useRef<number>(0);

    // Track request start
    useEffect(() => {
        if (isLoading) {
            requestStartTime.current = performance.now();
        }
    }, [isLoading]);

    // Track request completion and calculate metrics
    useEffect(() => {
        if (!isLoading && requestStartTime.current > 0 && lastRequestTime) {
            const endTime = performance.now();
            const totalTime = endTime - requestStartTime.current;

            // Calculate query complexity based on active filters
            const activeFilterCount = Object.keys(filters).filter(key => {
                const value = filters[key as keyof FilterCriteria];
                return value !== undefined && value !== null &&
                    (Array.isArray(value) ? value.length > 0 : true);
            }).length;

            const hasRangeFilters = !!(
                filters.risk_score_range ||
                filters.revenue_range ||
                filters.ebitda_margin_range ||
                filters.debt_equity_range ||
                filters.current_ratio_range
            );

            const hasTextSearch = !!(filters.search_query && filters.search_query.trim());

            let queryComplexity: 'low' | 'medium' | 'high' = 'low';
            if (activeFilterCount > 5 || hasRangeFilters || hasTextSearch) {
                queryComplexity = activeFilterCount > 8 ? 'high' : 'medium';
            }

            // Simulate cache hit detection (in real app, this would come from API response)
            const cacheHit = totalTime < 200 && Math.random() > 0.3;

            const newMetrics: PerformanceMetrics = {
                requestTime: requestStartTime.current,
                responseTime: totalTime,
                totalTime,
                cacheHit,
                resultCount: 0, // This would be populated from actual results
                queryComplexity,
                memoryUsage: Math.random() * 50 + 10, // Simulated
                networkLatency: Math.random() * 100 + 20 // Simulated
            };

            setCurrentMetrics(newMetrics);
            setMetrics(prev => [...prev.slice(-9), newMetrics]); // Keep last 10 metrics

            requestStartTime.current = 0;
        }
    }, [isLoading, lastRequestTime, filters]);

    // Calculate average response time
    useEffect(() => {
        if (metrics.length > 0) {
            const avg = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
            setAverageResponseTime(avg);
        }
    }, [metrics]);

    const getPerformanceStatus = (responseTime: number) => {
        if (responseTime < 500) return { status: 'excellent', color: 'text-green-600', icon: CheckCircle };
        if (responseTime < 1000) return { status: 'good', color: 'text-blue-600', icon: TrendingUp };
        if (responseTime < 2000) return { status: 'fair', color: 'text-yellow-600', icon: Clock };
        return { status: 'poor', color: 'text-red-600', icon: AlertTriangle };
    };

    const getComplexityColor = (complexity: 'low' | 'medium' | 'high') => {
        switch (complexity) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-red-600';
        }
    };

    const formatTime = (ms: number) => {
        if (ms < 1000) return `${Math.round(ms)}ms`;
        return `${(ms / 1000).toFixed(1)}s`;
    };

    const getPerformanceTrend = () => {
        if (metrics.length < 2) return null;

        const recent = metrics.slice(-3);
        const older = metrics.slice(-6, -3);

        if (recent.length === 0 || older.length === 0) return null;

        const recentAvg = recent.reduce((sum, m) => sum + m.responseTime, 0) / recent.length;
        const olderAvg = older.reduce((sum, m) => sum + m.responseTime, 0) / older.length;

        const improvement = ((olderAvg - recentAvg) / olderAvg) * 100;

        if (Math.abs(improvement) < 5) return null;

        return {
            improving: improvement > 0,
            percentage: Math.abs(improvement)
        };
    };

    if (!currentMetrics && !isLoading) {
        return null;
    }

    const performanceStatus = currentMetrics ? getPerformanceStatus(currentMetrics.responseTime) : null;
    const StatusIcon = performanceStatus?.icon || Activity;
    const trend = getPerformanceTrend();

    return (
        <Card className={cn("border-l-4", {
            'border-l-green-500': performanceStatus?.status === 'excellent',
            'border-l-blue-500': performanceStatus?.status === 'good',
            'border-l-yellow-500': performanceStatus?.status === 'fair',
            'border-l-red-500': performanceStatus?.status === 'poor',
            'border-l-neutral-300': !performanceStatus
        }, className)} padding="sm">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                        {isLoading ? (
                            <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                        ) : (
                            <StatusIcon className={cn("w-4 h-4", performanceStatus?.color || "text-neutral-60")} />
                        )}
                        <span className="text-sm font-medium text-neutral-90">
                            {isLoading ? 'Loading...' : 'Performance'}
                        </span>
                    </div>

                    {currentMetrics && (
                        <>
                            <Badge
                                variant={performanceStatus?.status === 'excellent' ? 'success' :
                                    performanceStatus?.status === 'good' ? 'info' :
                                        performanceStatus?.status === 'fair' ? 'warning' : 'destructive'}
                                size="sm"
                            >
                                {formatTime(currentMetrics.responseTime)}
                            </Badge>

                            {currentMetrics.cacheHit && (
                                <Badge variant="outline" size="sm" className="text-green-600 border-green-200">
                                    <Zap className="w-3 h-3 mr-1" />
                                    Cached
                                </Badge>
                            )}

                            <span className={cn("text-xs font-medium", getComplexityColor(currentMetrics.queryComplexity))}>
                                {currentMetrics.queryComplexity.toUpperCase()} complexity
                            </span>
                        </>
                    )}

                    {trend && (
                        <div className={cn("flex items-center gap-1 text-xs", {
                            'text-green-600': trend.improving,
                            'text-red-600': !trend.improving
                        })}>
                            {trend.improving ? (
                                <TrendingUp className="w-3 h-3" />
                            ) : (
                                <TrendingDown className="w-3 h-3" />
                            )}
                            <span>{trend.percentage.toFixed(0)}%</span>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    {averageResponseTime > 1500 && onOptimizeRequest && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onOptimizeRequest}
                            className="text-xs h-6 px-2"
                        >
                            <Zap className="w-3 h-3 mr-1" />
                            Optimize
                        </Button>
                    )}
                </div>
            </div>

            {showDetails && currentMetrics && (
                <div className="mt-3 pt-3 border-t border-neutral-20">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div className="text-center">
                            <div className="text-neutral-60">Response</div>
                            <div className="font-medium">{formatTime(currentMetrics.responseTime)}</div>
                        </div>

                        <div className="text-center">
                            <div className="text-neutral-60">Average</div>
                            <div className="font-medium">{formatTime(averageResponseTime)}</div>
                        </div>

                        {currentMetrics.memoryUsage && (
                            <div className="text-center">
                                <div className="text-neutral-60">Memory</div>
                                <div className="font-medium">{currentMetrics.memoryUsage.toFixed(1)}MB</div>
                            </div>
                        )}

                        {currentMetrics.networkLatency && (
                            <div className="text-center">
                                <div className="text-neutral-60">Network</div>
                                <div className="font-medium">{formatTime(currentMetrics.networkLatency)}</div>
                            </div>
                        )}
                    </div>

                    {/* Performance History Chart (simplified) */}
                    {metrics.length > 1 && (
                        <div className="mt-3 pt-3 border-t border-neutral-20">
                            <div className="flex items-center gap-2 mb-2">
                                <BarChart3 className="w-3 h-3 text-neutral-60" />
                                <span className="text-xs text-neutral-60">Recent Performance</span>
                            </div>
                            <div className="flex items-end gap-1 h-8">
                                {metrics.slice(-10).map((metric, index) => {
                                    const height = Math.max(4, (metric.responseTime / Math.max(...metrics.map(m => m.responseTime))) * 32);
                                    const color = metric.responseTime < 500 ? 'bg-green-500' :
                                        metric.responseTime < 1000 ? 'bg-blue-500' :
                                            metric.responseTime < 2000 ? 'bg-yellow-500' : 'bg-red-500';

                                    return (
                                        <div
                                            key={index}
                                            className={cn("w-2 rounded-t", color)}
                                            style={{ height: `${height}px` }}
                                            title={`${formatTime(metric.responseTime)} - ${new Date(metric.requestTime).toLocaleTimeString()}`}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Performance Warnings */}
                    {currentMetrics.responseTime > 2000 && (
                        <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-700">
                            <div className="flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3" />
                                <span>Slow response detected. Consider simplifying filters or using presets.</span>
                            </div>
                        </div>
                    )}

                    {currentMetrics.queryComplexity === 'high' && (
                        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-700">
                            <div className="flex items-center gap-2">
                                <Clock className="w-3 h-3" />
                                <span>Complex query detected. Performance may be impacted with large datasets.</span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </Card>
    );
}