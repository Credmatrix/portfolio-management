'use client';

import React, { useEffect, useState } from 'react';
import { useFilterSystem } from '@/lib/hooks/useFilterSystem';
import { FilterConflict, FilterPreset } from '@/types/filter.types';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import {
    AlertTriangle,
    Filter,
    X,
    Save,
    Download,
    Upload,
    RefreshCw,
    TrendingUp,
    Info
} from 'lucide-react';

interface FilterStateManagerProps {
    onFiltersChange?: (hasActiveFilters: boolean) => void;
    showConflictResolution?: boolean;
    showFilterSummary?: boolean;
    showPresetManagement?: boolean;
    className?: string;
}

export function FilterStateManager({
    onFiltersChange,
    showConflictResolution = true,
    showFilterSummary = true,
    showPresetManagement = false,
    className = ''
}: FilterStateManagerProps) {
    const {
        state,
        conflicts,
        impact,
        hasActiveFilters,
        hasConflicts,
        hasHighSeverityConflicts,
        filterSuggestions,
        filterSummary,
        clearAllFilters,
        calculateFilterImpact,
        autoResolveConflicts,
        createPreset,
        applyPreset
    } = useFilterSystem();

    const [showDetails, setShowDetails] = useState(false);
    const [presetName, setPresetName] = useState('');
    const [savedPresets, setSavedPresets] = useState<FilterPreset[]>([]);

    // Notify parent of filter changes
    useEffect(() => {
        onFiltersChange?.(hasActiveFilters);
    }, [hasActiveFilters, onFiltersChange]);

    // Calculate impact when filters change
    useEffect(() => {
        if (hasActiveFilters) {
            calculateFilterImpact();
        }
    }, [hasActiveFilters, calculateFilterImpact]);

    const handleClearAllFilters = () => {
        clearAllFilters();
    };

    const handleAutoResolveConflicts = () => {
        autoResolveConflicts();
    };

    const handleSavePreset = () => {
        if (presetName.trim() && hasActiveFilters) {
            const preset = createPreset(presetName.trim(), 'Custom filter preset');
            setSavedPresets(prev => [...prev, preset]);
            setPresetName('');
        }
    };

    const handleApplyPreset = (preset: FilterPreset) => {
        applyPreset(preset);
    };

    const handleExportFilters = () => {
        const dataStr = JSON.stringify(state, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio-filters-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    if (!hasActiveFilters && !hasConflicts && !showPresetManagement) {
        return null;
    }

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Filter Summary */}
            {showFilterSummary && hasActiveFilters && (
                <Card className="p-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-blue-600" />
                            <span className="font-medium text-gray-900">Active Filters</span>
                            <Badge variant="secondary" className="ml-2">
                                {filterSummary.length}
                            </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowDetails(!showDetails)}
                            >
                                {showDetails ? 'Hide Details' : 'Show Details'}
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearAllFilters}
                                className="text-red-600 hover:text-red-700"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        </div>
                    </div>

                    {/* Filter Summary Items */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {filterSummary.map((item, index) => (
                            <Badge
                                key={index}
                                variant="outline"
                                className="px-3 py-1"
                            >
                                <span className="font-medium text-gray-700">{item.label}:</span>
                                <span className="ml-1 text-gray-600">{item.value}</span>
                            </Badge>
                        ))}
                    </div>

                    {/* Impact Summary */}
                    {impact && (
                        <div className="flex items-center gap-4 text-sm text-gray-600 border-t pt-3">
                            <div className="flex items-center gap-1">
                                <TrendingUp className="h-4 w-4" />
                                <span>
                                    Showing {impact.filteredCompanies.toLocaleString()} of {impact.totalCompanies.toLocaleString()} companies
                                    ({impact.impactPercentage.toFixed(1)}%)
                                </span>
                            </div>
                            {Object.entries(impact.affectedMetrics).map(([metric, data]) => (
                                <div key={metric} className="flex items-center gap-1">
                                    <span className="capitalize">{metric.replace(/([A-Z])/g, ' $1').toLowerCase()}:</span>
                                    <span className={data.change > 0 ? 'text-green-600' : 'text-red-600'}>
                                        {data.change > 0 ? '+' : ''}{data.change.toFixed(1)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Detailed View */}
                    {showDetails && (
                        <div className="border-t pt-3 mt-3 space-y-3">
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="font-medium text-gray-700">Last Updated:</span>
                                    <span className="ml-2 text-gray-600">
                                        {new Date(state.metadata.lastUpdated).toLocaleString()}
                                    </span>
                                </div>
                                <div>
                                    <span className="font-medium text-gray-700">Source:</span>
                                    <span className="ml-2 text-gray-600 capitalize">
                                        {state.metadata.source}
                                    </span>
                                </div>
                            </div>

                            {/* Filter Suggestions */}
                            {filterSuggestions.length > 0 && (
                                <div>
                                    <h4 className="font-medium text-gray-700 mb-2">Suggestions:</h4>
                                    <div className="space-y-2">
                                        {filterSuggestions.map((suggestion, index) => (
                                            <div key={index} className="flex items-start gap-2 p-2 bg-blue-50 rounded-md">
                                                <Info className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                                                <span className="text-sm text-blue-800">{suggestion.message}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </Card>
            )}

            {/* Conflict Resolution */}
            {showConflictResolution && hasConflicts && (
                <Alert variant={hasHighSeverityConflicts ? "error" : "warning"}>
                    <AlertTriangle className="h-4 w-4" />
                    <div className="flex-1">
                        <h4 className="font-medium">
                            Filter Conflicts Detected ({conflicts.length})
                        </h4>
                        <div className="mt-2 space-y-2">
                            {conflicts.slice(0, 3).map((conflict) => (
                                <div key={conflict.id} className="text-sm">
                                    <span className="font-medium capitalize">{conflict.severity} Priority:</span>
                                    <span className="ml-2">{conflict.message}</span>
                                </div>
                            ))}
                            {conflicts.length > 3 && (
                                <div className="text-sm text-gray-600">
                                    +{conflicts.length - 3} more conflicts
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            size="sm"
                            onClick={handleAutoResolveConflicts}
                            disabled={!conflicts.some(c => c.autoResolvable)}
                        >
                            <RefreshCw className="h-4 w-4 mr-1" />
                            Auto-Resolve
                        </Button>
                    </div>
                </Alert>
            )}

            {/* Preset Management */}
            {showPresetManagement && (
                <Card className="p-4">
                    <h4 className="font-medium text-gray-900 mb-3">Filter Presets</h4>

                    {/* Save Current Filters */}
                    {hasActiveFilters && (
                        <div className="flex gap-2 mb-4">
                            <input
                                type="text"
                                placeholder="Preset name..."
                                value={presetName}
                                onChange={(e) => setPresetName(e.target.value)}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm"
                            />
                            <Button
                                size="sm"
                                onClick={handleSavePreset}
                                disabled={!presetName.trim()}
                            >
                                <Save className="h-4 w-4 mr-1" />
                                Save
                            </Button>
                        </div>
                    )}

                    {/* Saved Presets */}
                    {savedPresets.length > 0 && (
                        <div className="space-y-2 mb-4">
                            <h5 className="text-sm font-medium text-gray-700">Saved Presets:</h5>
                            {savedPresets.map((preset) => (
                                <div key={preset.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-md">
                                    <div>
                                        <span className="font-medium text-gray-900">{preset.name}</span>
                                        <span className="ml-2 text-sm text-gray-600">{preset.description}</span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleApplyPreset(preset)}
                                    >
                                        Apply
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Export/Import */}
                    <div className="flex gap-2 pt-3 border-t">
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleExportFilters}
                            disabled={!hasActiveFilters}
                        >
                            <Download className="h-4 w-4 mr-1" />
                            Export
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => {
                                // This would trigger a file input dialog
                                console.log('Import functionality would be implemented here');
                            }}
                        >
                            <Upload className="h-4 w-4 mr-1" />
                            Import
                        </Button>
                    </div>
                </Card>
            )}
        </div>
    );
}