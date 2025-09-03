import React from "react";
import { Skeleton, SkeletonGrid } from "@/components/ui/Skeleton";
import { Loader2 } from "lucide-react";

interface LoadingSpinnerProps {
    size?: "sm" | "md" | "lg";
    className?: string;
}

export function LoadingSpinner({ size = "md", className }: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: "h-4 w-4",
        md: "h-8 w-8",
        lg: "h-12 w-12"
    };

    return (
        <Loader2 className={`animate-spin ${sizeClasses[size]} ${className || ""}`} />
    );
}

interface PortfolioLoadingProps {
    message?: string;
}

export function PortfolioLoading({ message = "Loading companies..." }: PortfolioLoadingProps) {
    return (
        <div className="space-y-6">
            {/* Search bar skeleton */}
            <div className="space-y-4">
                <Skeleton className="h-12 w-full rounded-lg" />

                {/* Filter controls skeleton */}
                <div className="flex flex-wrap items-center gap-3">
                    <Skeleton className="h-9 w-24" />
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-20" />
                    <div className="ml-auto flex gap-2">
                        <Skeleton className="h-9 w-9" />
                        <Skeleton className="h-9 w-9" />
                    </div>
                </div>

                {/* Sort controls skeleton */}
                <div className="flex items-center gap-4">
                    <Skeleton className="h-4 w-16" />
                    <Skeleton className="h-9 w-32" />
                    <Skeleton className="h-9 w-28" />
                </div>

                {/* Results summary skeleton */}
                <div className="flex justify-between items-center">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-4 w-24" />
                </div>
            </div>

            {/* Grid skeleton */}
            <SkeletonGrid count={8} />

            {/* Loading message */}
            <div className="flex items-center justify-center py-8">
                <div className="text-center">
                    <LoadingSpinner size="lg" className="text-blue-500 mx-auto mb-4" />
                    <p className="text-neutral-60 font-medium">{message}</p>
                    <p className="text-neutral-50 text-sm mt-1">This may take a few moments</p>
                </div>
            </div>
        </div>
    );
}

interface InlineLoadingProps {
    message?: string;
    size?: "sm" | "md" | "lg";
    showProgress?: boolean;
    progress?: number;
}

export function InlineLoading({
    message = "Loading...",
    size = "sm",
    showProgress = false,
    progress = 0
}: InlineLoadingProps) {
    return (
        <div className="flex items-center gap-2 text-neutral-60">
            <LoadingSpinner size={size} />
            <div className="flex flex-col gap-1">
                <span className="text-sm">{message}</span>
                {showProgress && (
                    <div className="w-24 h-1 bg-neutral-20 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-300 ease-out"
                            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                        />
                    </div>
                )}
            </div>
        </div>
    );
}

interface PaginationLoadingProps {
    isLoading: boolean;
    currentPage?: number;
    totalPages?: number;
}

export function PaginationLoading({ isLoading, currentPage, totalPages }: PaginationLoadingProps) {
    if (!isLoading) return null;

    const progress = currentPage && totalPages ? (currentPage / totalPages) * 100 : 0;

    return (
        <div className="flex justify-center py-4">
            <InlineLoading
                message={`Loading page ${currentPage || ''}${totalPages ? ` of ${totalPages}` : ''}...`}
                showProgress={!!currentPage && !!totalPages}
                progress={progress}
            />
        </div>
    );
}

interface DataRefreshLoadingProps {
    isRefreshing: boolean;
    message?: string;
}

export function DataRefreshLoading({ isRefreshing, message = "Refreshing data..." }: DataRefreshLoadingProps) {
    if (!isRefreshing) return null;

    return (
        <div className="fixed top-4 right-4 z-50 bg-white border border-neutral-30 rounded-lg shadow-lg p-3">
            <InlineLoading message={message} size="sm" />
        </div>
    );
}