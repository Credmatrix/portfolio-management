import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-neutral-20",
                className
            )}
        />
    );
}

interface SkeletonCardProps {
    className?: string;
}

export function SkeletonCard({ className }: SkeletonCardProps) {
    return (
        <div className={cn("p-6 border border-neutral-30 rounded-lg bg-white", className)}>
            <div className="space-y-4">
                {/* Header */}
                <div className="flex items-start justify-between">
                    <div className="space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-24" />
                    </div>
                    <Skeleton className="h-6 w-12 rounded-full" />
                </div>

                {/* Content */}
                <div className="space-y-3">
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-16" />
                    </div>
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <div className="flex justify-between">
                        <Skeleton className="h-4 w-18" />
                        <Skeleton className="h-4 w-14" />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between pt-2">
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-8 w-20 rounded" />
                </div>
            </div>
        </div>
    );
}

interface SkeletonGridProps {
    count?: number;
    className?: string;
}

export function SkeletonGrid({ count = 8, className }: SkeletonGridProps) {
    return (
        <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6", className)}>
            {Array.from({ length: count }).map((_, index) => (
                <SkeletonCard key={index} />
            ))}
        </div>
    );
}