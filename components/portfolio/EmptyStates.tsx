import React from "react";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
    Building2,
    Search,
    Filter,
    FileX,
    AlertCircle,
    RefreshCw,
    Plus,
    Database
} from "lucide-react";

interface EmptyStateProps {
    icon?: React.ReactNode;
    title: string;
    description: string;
    action?: {
        label: string;
        onClick: () => void;
        variant?: "primary" | "outline";
    };
    secondaryAction?: {
        label: string;
        onClick: () => void;
    };
}

export function EmptyState({
    icon,
    title,
    description,
    action,
    secondaryAction
}: EmptyStateProps) {
    return (
        <div className="text-center py-12">
            <div className="text-neutral-40 mb-6">
                {icon || <Building2 className="w-16 h-16 mx-auto" />}
            </div>
            <h3 className="text-lg font-semibold text-neutral-80 mb-2">
                {title}
            </h3>
            <p className="text-neutral-60 mb-6 max-w-md mx-auto">
                {description}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                {action && (
                    <Button
                        variant={action.variant || "primary"}
                        onClick={action.onClick}
                    >
                        {action.label}
                    </Button>
                )}
                {secondaryAction && (
                    <Button
                        variant="outline"
                        onClick={secondaryAction.onClick}
                    >
                        {secondaryAction.label}
                    </Button>
                )}
            </div>
        </div>
    );
}

interface NoCompaniesFoundProps {
    hasFilters: boolean;
    hasSearch: boolean;
    searchQuery?: string;
    activeFilterCount: number;
    onClearFilters: () => void;
    onUploadNew?: () => void;
}

export function NoCompaniesFound({
    hasFilters,
    hasSearch,
    searchQuery,
    activeFilterCount,
    onClearFilters,
    onUploadNew
}: NoCompaniesFoundProps) {
    if (hasSearch || hasFilters) {
        // Enhanced messaging for different filter scenarios
        let description = "";
        let suggestions: string[] = [];

        if (hasSearch && hasFilters) {
            description = `No results found for "${searchQuery}" with ${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}.`;
            suggestions = [
                "Try different search terms",
                "Remove some filters",
                "Check spelling in search query"
            ];
        } else if (hasSearch) {
            description = `No companies found matching "${searchQuery}".`;
            suggestions = [
                "Check spelling and try again",
                "Try broader search terms",
                "Search by company name, industry, or CIN"
            ];
        } else {
            description = `No companies match your ${activeFilterCount} active filter${activeFilterCount !== 1 ? 's' : ''}.`;
            suggestions = [
                "Try broader filter criteria",
                "Remove some filters",
                "Check if filter combinations are too restrictive"
            ];
        }

        return (
            <div className="text-center py-12">
                <Search className="w-16 h-16 mx-auto text-neutral-40 mb-6" />
                <h3 className="text-lg font-semibold text-neutral-80 mb-2">
                    No companies match your criteria
                </h3>
                <p className="text-neutral-60 mb-4 max-w-md mx-auto">
                    {description}
                </p>

                {/* Suggestions */}
                <div className="mb-6">
                    <p className="text-sm font-medium text-neutral-70 mb-2">Suggestions:</p>
                    <ul className="text-sm text-neutral-60 space-y-1">
                        {suggestions.map((suggestion, index) => (
                            <li key={index}>• {suggestion}</li>
                        ))}
                    </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        variant="outline"
                        onClick={onClearFilters}
                    >
                        Clear {hasSearch ? 'search and ' : ''}filters ({activeFilterCount})
                    </Button>
                    {onUploadNew && (
                        <Button
                            variant="primary"
                            onClick={onUploadNew}
                        >
                            Upload new company
                        </Button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <EmptyState
            icon={<Database className="w-16 h-16 mx-auto text-neutral-40" />}
            title="No companies in your portfolio"
            description="Get started by uploading company documents for credit analysis and risk assessment."
            action={
                onUploadNew ? {
                    label: "Upload first company",
                    onClick: onUploadNew
                } : undefined
            }
        />
    );
}

interface ErrorStateProps {
    error: Error | string;
    onRetry: () => void;
    onRefresh?: () => void;
}

export function ErrorState({ error, onRetry, onRefresh }: ErrorStateProps) {
    const errorMessage = typeof error === 'string' ? error : error.message;
    const isNetworkError = errorMessage.toLowerCase().includes('network') ||
        errorMessage.toLowerCase().includes('fetch');

    return (
        <EmptyState
            icon={<AlertCircle className="w-16 h-16 mx-auto text-red-500" />}
            title={isNetworkError ? "Connection Error" : "Something went wrong"}
            description={
                isNetworkError
                    ? "Unable to load portfolio data. Please check your connection and try again."
                    : `Error: ${errorMessage}`
            }
            action={{
                label: "Try Again",
                onClick: onRetry,
                variant: "primary"
            }}
            secondaryAction={
                onRefresh ? {
                    label: "Refresh Page",
                    onClick: onRefresh
                } : undefined
            }
        />
    );
}

interface LoadingFailedProps {
    onRetry: () => void;
    retryCount?: number;
}

export function LoadingFailed({ onRetry, retryCount = 0 }: LoadingFailedProps) {
    return (
        <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 mx-auto text-orange-500 mb-4" />
            <h4 className="text-base font-medium text-neutral-80 mb-2">
                Loading took longer than expected
            </h4>
            <p className="text-neutral-60 text-sm mb-4">
                {retryCount > 0
                    ? `Retry attempt ${retryCount}. The server might be busy.`
                    : "This might be due to a slow connection or server load."
                }
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
            </Button>
        </div>
    );
}

interface FilterEmptyStateProps {
    filterType: string;
    onClearFilter: () => void;
}

export function FilterEmptyState({ filterType, onClearFilter }: FilterEmptyStateProps) {
    return (
        <div className="text-center py-8">
            <Filter className="w-12 h-12 mx-auto text-neutral-40 mb-4" />
            <h4 className="text-base font-medium text-neutral-80 mb-2">
                No companies match this {filterType}
            </h4>
            <p className="text-neutral-60 text-sm mb-4">
                Try selecting different {filterType} options or clear this filter.
            </p>
            <Button variant="outline" size="sm" onClick={onClearFilter}>
                Clear {filterType} filter
            </Button>
        </div>
    );
}

interface LargeDatasetWarningProps {
    totalCount: number;
    currentLimit: number;
    onIncreaseLimit: (newLimit: number) => void;
    onApplyFilters: () => void;
}

export function LargeDatasetWarning({
    totalCount,
    currentLimit,
    onIncreaseLimit,
    onApplyFilters
}: LargeDatasetWarningProps) {
    if (totalCount <= 100) return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
                <div className="flex-1">
                    <h4 className="font-medium text-amber-900 mb-1">
                        Large Dataset Detected
                    </h4>
                    <p className="text-sm text-amber-800 mb-3">
                        You have {totalCount.toLocaleString()} companies in your portfolio.
                        For better performance, consider using filters or increasing the page size.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {currentLimit < 50 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onIncreaseLimit(50)}
                                className="text-amber-800 border-amber-300 hover:bg-amber-100"
                            >
                                Show 50 per page
                            </Button>
                        )}
                        {currentLimit < 100 && totalCount > 200 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onIncreaseLimit(100)}
                                className="text-amber-800 border-amber-300 hover:bg-amber-100"
                            >
                                Show 100 per page
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={onApplyFilters}
                            className="text-amber-800 border-amber-300 hover:bg-amber-100"
                        >
                            Apply Filters
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}