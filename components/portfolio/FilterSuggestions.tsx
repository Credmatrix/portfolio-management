"use client";

import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { FilterCriteria } from '@/types/portfolio.types';
import { cn } from '@/lib/utils';
import {
    Lightbulb,
    TrendingUp,
    Filter,
    X,
    ChevronRight,
    Sparkles,
    Target,
    BarChart3
} from 'lucide-react';

interface FilterSuggestion {
    id: string;
    type: 'related' | 'enhancement' | 'optimization' | 'preset';
    title: string;
    description: string;
    filterUpdates: Partial<FilterCriteria>;
    impact: {
        expectedResults: number;
        confidence: 'high' | 'medium' | 'low';
        reason: string;
    };
    priority: 'high' | 'medium' | 'low';
}

interface FilterSuggestionsProps {
    currentFilters: FilterCriteria;
    totalCount: number;
    filteredCount: number;
    onApplySuggestion: (suggestion: FilterSuggestion) => void;
    onDismissSuggestion: (suggestionId: string) => void;
    className?: string;
    maxSuggestions?: number;
    showOnlyHighPriority?: boolean;
}

export function FilterSuggestions({
    currentFilters,
    totalCount,
    filteredCount,
    onApplySuggestion,
    onDismissSuggestion,
    className = '',
    maxSuggestions = 3,
    showOnlyHighPriority = false
}: FilterSuggestionsProps) {
    const [suggestions, setSuggestions] = useState<FilterSuggestion[]>([]);
    const [dismissedSuggestions, setDismissedSuggestions] = useState<Set<string>>(new Set());

    // Generate smart filter suggestions
    useEffect(() => {
        const generateSuggestions = (): FilterSuggestion[] => {
            const newSuggestions: FilterSuggestion[] = [];
            const activeFilterCount = Object.keys(currentFilters).filter(key => {
                const value = currentFilters[key as keyof FilterCriteria];
                return value !== undefined && value !== null &&
                    (Array.isArray(value) ? value.length > 0 : true);
            }).length;

            const impactPercentage = totalCount > 0 ? (filteredCount / totalCount) * 100 : 0;

            // Suggestion 1: Too many results - add more specific filters
            if (impactPercentage > 80 && activeFilterCount < 3) {
                newSuggestions.push({
                    id: 'add-risk-filter',
                    type: 'enhancement',
                    title: 'Focus on Risk Assessment',
                    description: 'Add risk grade filters to focus on companies that match your risk appetite',
                    filterUpdates: {
                        risk_grades: ['A', 'B+', 'B']
                    },
                    impact: {
                        expectedResults: Math.floor(filteredCount * 0.6),
                        confidence: 'high',
                        reason: 'Risk-based filtering typically reduces results by 40%'
                    },
                    priority: 'high'
                });
            }

            // Suggestion 2: Too few results - broaden filters
            if (impactPercentage < 10 && activeFilterCount > 3) {
                newSuggestions.push({
                    id: 'broaden-filters',
                    type: 'optimization',
                    title: 'Broaden Your Search',
                    description: 'Remove some restrictive filters to see more companies',
                    filterUpdates: {
                        // Suggest removing the most restrictive filters
                        risk_score_range: undefined,
                        ebitda_margin_range: undefined
                    },
                    impact: {
                        expectedResults: Math.floor(filteredCount * 3),
                        confidence: 'medium',
                        reason: 'Removing range filters typically increases results'
                    },
                    priority: 'high'
                });
            }

            // Suggestion 3: Industry-specific analysis
            if (currentFilters.industries && currentFilters.industries.length > 0 && !currentFilters.regions) {
                newSuggestions.push({
                    id: 'add-regional-analysis',
                    type: 'related',
                    title: 'Add Regional Analysis',
                    description: 'Analyze geographic distribution within selected industries',
                    filterUpdates: {
                        regions: ['Maharashtra', 'Karnataka', 'Tamil Nadu']
                    },
                    impact: {
                        expectedResults: Math.floor(filteredCount * 0.7),
                        confidence: 'medium',
                        reason: 'Regional filtering provides geographic insights'
                    },
                    priority: 'medium'
                });
            }

            // Suggestion 4: Compliance focus for high-risk companies
            if (currentFilters.risk_grades &&
                currentFilters.risk_grades.some(grade => ['C', 'D', 'E'].includes(grade)) &&
                !currentFilters.gst_compliance_status) {
                newSuggestions.push({
                    id: 'compliance-focus',
                    type: 'related',
                    title: 'Check Compliance Status',
                    description: 'Review compliance status for high-risk companies',
                    filterUpdates: {
                        gst_compliance_status: ['non_compliant', 'unknown']
                    },
                    impact: {
                        expectedResults: Math.floor(filteredCount * 0.4),
                        confidence: 'high',
                        reason: 'High-risk companies often have compliance issues'
                    },
                    priority: 'high'
                });
            }

            // Suggestion 5: Financial health preset
            if (activeFilterCount === 0) {
                newSuggestions.push({
                    id: 'financial-health-preset',
                    type: 'preset',
                    title: 'Financial Health Analysis',
                    description: 'Apply preset filters for financially healthy companies',
                    filterUpdates: {
                        risk_grades: ['A+', 'A', 'A-', 'B+'],
                        ebitda_margin_range: [10, 100],
                        current_ratio_range: [1.2, 10],
                        gst_compliance_status: ['compliant']
                    },
                    impact: {
                        expectedResults: Math.floor(totalCount * 0.3),
                        confidence: 'high',
                        reason: 'Preset combines multiple financial health indicators'
                    },
                    priority: 'medium'
                });
            }

            // Suggestion 6: Performance optimization
            if (activeFilterCount > 6) {
                newSuggestions.push({
                    id: 'optimize-performance',
                    type: 'optimization',
                    title: 'Optimize for Performance',
                    description: 'Reduce filter complexity for faster loading',
                    filterUpdates: {
                        // Keep only the most impactful filters
                        risk_grades: currentFilters.risk_grades,
                        industries: currentFilters.industries?.slice(0, 3),
                        // Remove range filters that might be less critical
                        debt_equity_range: undefined,
                        current_ratio_range: undefined
                    },
                    impact: {
                        expectedResults: Math.floor(filteredCount * 1.2),
                        confidence: 'medium',
                        reason: 'Simplified filters improve performance'
                    },
                    priority: 'low'
                });
            }

            return newSuggestions;
        };

        const newSuggestions = generateSuggestions();
        setSuggestions(newSuggestions);
    }, [currentFilters, totalCount, filteredCount]);

    // Filter suggestions based on dismissals and priority
    const visibleSuggestions = suggestions
        .filter(suggestion => !dismissedSuggestions.has(suggestion.id))
        .filter(suggestion => !showOnlyHighPriority || suggestion.priority === 'high')
        .slice(0, maxSuggestions);

    const handleDismiss = (suggestionId: string) => {
        setDismissedSuggestions(prev => new Set([...prev, suggestionId]));
        onDismissSuggestion(suggestionId);
    };

    const getSuggestionIcon = (type: FilterSuggestion['type']) => {
        switch (type) {
            case 'related':
                return BarChart3;
            case 'enhancement':
                return TrendingUp;
            case 'optimization':
                return Target;
            case 'preset':
                return Sparkles;
            default:
                return Filter;
        }
    };

    const getSuggestionColor = (priority: FilterSuggestion['priority']) => {
        switch (priority) {
            case 'high':
                return 'border-l-blue-500 bg-blue-50';
            case 'medium':
                return 'border-l-green-500 bg-green-50';
            case 'low':
                return 'border-l-yellow-500 bg-yellow-50';
        }
    };

    const getConfidenceBadge = (confidence: FilterSuggestion['impact']['confidence']) => {
        switch (confidence) {
            case 'high':
                return <Badge variant="success" size="sm">High Confidence</Badge>;
            case 'medium':
                return <Badge variant="warning" size="sm">Medium Confidence</Badge>;
            case 'low':
                return <Badge variant="secondary" size="sm">Low Confidence</Badge>;
        }
    };

    if (visibleSuggestions.length === 0) {
        return null;
    }

    return (
        <Card className={cn("border-l-4 border-l-purple-500", className)} padding="md">
            <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-purple-600" />
                <h3 className="font-medium text-neutral-90">Filter Suggestions</h3>
                <Badge variant="outline" size="sm">
                    {visibleSuggestions.length}
                </Badge>
            </div>

            <div className="space-y-3">
                {visibleSuggestions.map((suggestion) => {
                    const SuggestionIcon = getSuggestionIcon(suggestion.type);

                    return (
                        <div
                            key={suggestion.id}
                            className={cn(
                                "border-l-4 rounded-r-md p-3 transition-all hover:shadow-sm",
                                getSuggestionColor(suggestion.priority)
                            )}
                        >
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <SuggestionIcon className="w-4 h-4 text-neutral-60" />
                                        <h4 className="font-medium text-sm text-neutral-90">
                                            {suggestion.title}
                                        </h4>
                                        {getConfidenceBadge(suggestion.impact.confidence)}
                                    </div>

                                    <p className="text-xs text-neutral-60 mb-2">
                                        {suggestion.description}
                                    </p>

                                    <div className="flex items-center gap-3 text-xs text-neutral-50">
                                        <span>
                                            Expected: ~{suggestion.impact.expectedResults.toLocaleString()} results
                                        </span>
                                        <span className="text-neutral-40">•</span>
                                        <span>{suggestion.impact.reason}</span>
                                    </div>
                                </div>

                                <div className="flex items-center gap-1 ml-3">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={() => onApplySuggestion(suggestion)}
                                        className="text-xs h-7 px-2"
                                    >
                                        <ChevronRight className="w-3 h-3 mr-1" />
                                        Apply
                                    </Button>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDismiss(suggestion.id)}
                                        className="text-xs h-7 w-7 p-0 text-neutral-50 hover:text-red-600"
                                    >
                                        <X className="w-3 h-3" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {dismissedSuggestions.size > 0 && (
                <div className="mt-3 pt-3 border-t border-neutral-20">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDismissedSuggestions(new Set())}
                        className="text-xs text-neutral-60 hover:text-neutral-90"
                    >
                        Show dismissed suggestions ({dismissedSuggestions.size})
                    </Button>
                </div>
            )}
        </Card>
    );
}