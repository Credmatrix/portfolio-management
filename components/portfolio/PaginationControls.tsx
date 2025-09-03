import React from "react";
import { Button } from "@/components/ui/Button";
import { Select } from "@/components/ui/Select";
import {
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight,
    MoreHorizontal
} from "lucide-react";
import { PaginationParams } from "@/types/portfolio.types";

interface PaginationControlsProps {
    pagination: PaginationParams;
    totalCount: number;
    hasNext: boolean;
    hasPrevious: boolean;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
    isLoading?: boolean;
    showPageSizeSelector?: boolean;
    showPageInfo?: boolean;
    compact?: boolean;
}

export function PaginationControls({
    pagination,
    totalCount,
    hasNext,
    hasPrevious,
    onPageChange,
    onLimitChange,
    isLoading = false,
    showPageSizeSelector = true,
    showPageInfo = true,
    compact = false
}: PaginationControlsProps) {
    const { page, limit } = pagination;
    const totalPages = Math.ceil(totalCount / limit);
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, totalCount);

    // Generate page numbers to show with performance optimization for large datasets
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = [];
        const maxVisiblePages = compact ? 3 : 5;

        // For very large datasets (>1000 pages), show fewer page numbers
        const isLargeDataset = totalPages > 1000;
        const effectiveMaxPages = isLargeDataset ? 3 : maxVisiblePages;

        if (totalPages <= effectiveMaxPages) {
            // Show all pages if total is small
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            // Always show first page
            pages.push(1);

            const showEllipsisStart = page > (isLargeDataset ? 2 : 3);
            if (showEllipsisStart) {
                pages.push('ellipsis');
            }

            // Show pages around current page
            const range = isLargeDataset ? 0 : 1; // Smaller range for large datasets
            const start = Math.max(2, page - range);
            const end = Math.min(totalPages - 1, page + range);

            for (let i = start; i <= end; i++) {
                if (i !== 1 && i !== totalPages) {
                    pages.push(i);
                }
            }

            const showEllipsisEnd = page < totalPages - (isLargeDataset ? 1 : 2);
            if (showEllipsisEnd) {
                pages.push('ellipsis');
            }

            // Always show last page if more than 1 page
            if (totalPages > 1) {
                pages.push(totalPages);
            }
        }

        return pages;
    };

    const pageNumbers = getPageNumbers();

    if (totalCount === 0) {
        return null;
    }

    return (
        <div className={`flex flex-col ${compact ? 'gap-3' : 'gap-4'} ${compact ? 'sm:flex-row sm:items-center sm:justify-between' : ''}`}>
            {/* Page Info */}
            {showPageInfo && (
                <div className="text-sm text-neutral-60">
                    Showing <span className="font-medium text-neutral-80">{startItem}</span> to{' '}
                    <span className="font-medium text-neutral-80">{endItem}</span> of{' '}
                    <span className="font-medium text-neutral-80">{totalCount}</span> companies
                </div>
            )}

            <div className={`flex ${compact ? 'flex-col gap-3' : 'flex-col sm:flex-row'} items-center ${compact ? '' : 'sm:gap-6'}`}>
                {/* Page Size Selector */}
                {showPageSizeSelector && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-60 whitespace-nowrap">Show:</span>
                        {/* <Select
                            value={limit.toString()}
                            onValueChange={(value) => onLimitChange(parseInt(value))}
                            disabled={isLoading}
                        >
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                            {totalCount > 500 && <option value="200">200</option>}
                        </Select> */}
                    </div>
                )}

                {/* Jump to Page for Large Datasets */}
                {totalPages > 10 && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-neutral-60 whitespace-nowrap">Go to:</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            placeholder={page.toString()}
                            className="w-16 px-2 py-1 text-sm border border-neutral-30 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    const target = parseInt((e.target as HTMLInputElement).value);
                                    if (target >= 1 && target <= totalPages) {
                                        onPageChange(target);
                                        (e.target as HTMLInputElement).value = '';
                                    }
                                }
                            }}
                            disabled={isLoading}
                        />
                    </div>
                )}

                {/* Pagination Controls */}
                <div className="flex items-center gap-1">
                    {/* First Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(1)}
                        disabled={!hasPrevious || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsLeft className="w-4 h-4" />
                    </Button>

                    {/* Previous Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page - 1)}
                        disabled={!hasPrevious || isLoading}
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {!compact && <span className="ml-1 hidden sm:inline">Previous</span>}
                    </Button>

                    {/* Page Numbers */}
                    <div className="flex items-center gap-1">
                        {pageNumbers.map((pageNum, index) => (
                            pageNum === 'ellipsis' ? (
                                <div key={`ellipsis-${index}`} className="px-2">
                                    <MoreHorizontal className="w-4 h-4 text-neutral-40" />
                                </div>
                            ) : (
                                <Button
                                    key={pageNum}
                                    variant={pageNum === page ? "primary" : "outline"}
                                    size="sm"
                                    onClick={() => onPageChange(pageNum)}
                                    disabled={isLoading}
                                    className="min-w-[2.5rem]"
                                >
                                    {pageNum}
                                </Button>
                            )
                        ))}
                    </div>

                    {/* Next Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(page + 1)}
                        disabled={!hasNext || isLoading}
                    >
                        {!compact && <span className="mr-1 hidden sm:inline">Next</span>}
                        <ChevronRight className="w-4 h-4" />
                    </Button>

                    {/* Last Page */}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPageChange(totalPages)}
                        disabled={!hasNext || isLoading}
                        className="hidden sm:flex"
                    >
                        <ChevronsRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Mobile Page Info */}
            {compact && (
                <div className="text-xs text-neutral-50 text-center sm:hidden">
                    Page {page} of {totalPages}
                </div>
            )}
        </div>
    );
}

interface SimplePaginationProps {
    hasNext: boolean;
    hasPrevious: boolean;
    onNext: () => void;
    onPrevious: () => void;
    isLoading?: boolean;
    currentPage: number;
    totalPages: number;
}

export function SimplePagination({
    hasNext,
    hasPrevious,
    onNext,
    onPrevious,
    isLoading = false,
    currentPage,
    totalPages
}: SimplePaginationProps) {
    return (
        <div className="flex items-center justify-between">
            <Button
                variant="outline"
                onClick={onPrevious}
                disabled={!hasPrevious || isLoading}
            >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
            </Button>

            <span className="text-sm text-neutral-60">
                Page {currentPage} of {totalPages}
            </span>

            <Button
                variant="outline"
                onClick={onNext}
                disabled={!hasNext || isLoading}
            >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
        </div>
    );
}