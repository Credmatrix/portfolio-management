// components/portfolio/FilterConflictAlert.tsx
"use client";

import React from 'react';
import { Alert } from '@/components/ui/Alert';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { AlertTriangle, Info, X } from 'lucide-react';
import { FilterValidationResult, FilterConflict } from '@/types/chart-interactions.types';

interface FilterConflictAlertProps {
    validation: FilterValidationResult;
    onResolveConflict?: (conflict: FilterConflict) => void;
    onDismiss?: () => void;
    className?: string;
}

export function FilterConflictAlert({
    validation,
    onResolveConflict,
    onDismiss,
    className = ""
}: FilterConflictAlertProps) {
    if (validation.isValid && validation.warnings.length === 0) {
        return null;
    }

    const hasConflicts = validation.conflicts.length > 0;
    const hasWarnings = validation.warnings.length > 0;

    return (
        <div className={`space-y-3 ${className}`}>
            {/* Conflicts */}
            {hasConflicts && (
                <Alert variant="error" className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-red-800">
                                Filter Conflicts Detected
                            </h4>
                            {onDismiss && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDismiss}
                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="mt-2 space-y-3">
                            {validation.conflicts.map((conflict, index) => (
                                <div key={index} className="space-y-2">
                                    <div className="flex items-start gap-2">
                                        <Badge
                                            variant={conflict.type === 'incompatible' ? 'destructive' : 'secondary'}
                                            className="text-xs"
                                        >
                                            {conflict.type}
                                        </Badge>
                                        <p className="text-sm text-red-700 flex-1">
                                            {conflict.message}
                                        </p>
                                    </div>

                                    {conflict.suggestions.length > 0 && (
                                        <div className="ml-6 space-y-1">
                                            <p className="text-xs font-medium text-red-600">
                                                Suggestions:
                                            </p>
                                            <ul className="text-xs text-red-600 space-y-1">
                                                {conflict.suggestions.map((suggestion, suggestionIndex) => (
                                                    <li key={suggestionIndex} className="flex items-start gap-1">
                                                        <span className="text-red-400">•</span>
                                                        <span>{suggestion}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {onResolveConflict && (
                                        <div className="ml-6">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => onResolveConflict(conflict)}
                                                className="text-xs h-7 border-red-300 text-red-700 hover:bg-red-100"
                                            >
                                                Auto-resolve
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </Alert>
            )}

            {/* Warnings */}
            {hasWarnings && (
                <Alert variant={"info"} className="border-amber-200 bg-amber-50">
                    <Info className="h-4 w-4 text-amber-600" />
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <h4 className="font-medium text-amber-800">
                                Filter Warnings
                            </h4>
                            {onDismiss && !hasConflicts && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={onDismiss}
                                    className="h-6 w-6 p-0 text-amber-600 hover:text-amber-800"
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            )}
                        </div>

                        <div className="mt-2 space-y-1">
                            {validation.warnings.map((warning, index) => (
                                <div key={index} className="flex items-start gap-2">
                                    <span className="text-amber-500 text-xs">•</span>
                                    <p className="text-sm text-amber-700">{warning}</p>
                                </div>
                            ))}
                        </div>

                        {validation.estimatedResultCount !== undefined && (
                            <div className="mt-2 pt-2 border-t border-amber-200">
                                <p className="text-xs text-amber-600">
                                    Estimated results: {validation.estimatedResultCount.toLocaleString()} companies
                                </p>
                            </div>
                        )}
                    </div>
                </Alert>
            )}
        </div>
    );
}