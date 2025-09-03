// components/portfolio/PortfolioGrid.tsx
"use client";

import React, { useState, useCallback, useMemo, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { debounce } from "@/lib/utils/performance";
import { CompanyCard } from "./CompanyCard";
import { SearchBar, defaultSearchSuggestions } from "./SearchBar";
import { RiskFilterPanel } from "./RiskFilterPanel";
import { AdvancedFilterPanel } from "./AdvancedFilterPanel";
import { RiskSortingControls } from "./RiskSortingControls";
import { PaginationControls } from "./PaginationControls";
import { PortfolioLoading, InlineLoading, DataRefreshLoading } from "./LoadingStates";
import { NoCompaniesFound, ErrorState, LargeDatasetWarning } from "./EmptyStates";
import { FilterCriteria, SortCriteria, PaginationParams } from "@/types/portfolio.types";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Grid, List, Filter, X, ArrowUpDown, TrendingUp, TrendingDown } from "lucide-react";

interface PortfolioGridProps {
	initialFilters?: FilterCriteria;
	initialSort?: SortCriteria;
	showFilters?: boolean;
	compactMode?: boolean;
	onUploadNew?: () => void;
	enableAdvancedPagination?: boolean;
}

export function PortfolioGrid({
	initialFilters = {},
	initialSort = { field: 'risk_score', direction: 'desc' },
	showFilters = true,
	compactMode = false,
	onUploadNew,
	enableAdvancedPagination = true
}: PortfolioGridProps) {
	const router = useRouter();
	const [filters, setFilters] = useState<FilterCriteria>(initialFilters);
	const [sortCriteria, setSortCriteria] = useState<SortCriteria>(initialSort);
	const [searchQuery, setSearchQuery] = useState<string>(filters.search_query || '');
	const [pagination, setPagination] = useState<PaginationParams>({ page: 1, limit: 20 });
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [showRiskFilters, setShowRiskFilters] = useState(false);
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);

	const { data, isLoading, error, refetch, isFetching } = useQuery({
		queryKey: ["portfolio", filters, sortCriteria, searchQuery, pagination],
		queryFn: async () => {
			// Build query parameters from filters, sort, and pagination
			const params = new URLSearchParams();

			// Pagination
			params.append('page', pagination.page.toString());
			params.append('limit', pagination.limit.toString());

			// Sorting
			params.append('sort_field', sortCriteria.field);
			params.append('sort_direction', sortCriteria.direction);

			// Search
			if (searchQuery.trim()) {
				params.append('search', searchQuery.trim());
			}

			// Risk-based filters
			if (filters.risk_grades && filters.risk_grades.length > 0) {
				params.append('risk_grades', filters.risk_grades.join(','));
			}
			if (filters.risk_score_range) {
				params.append('risk_score_min', filters.risk_score_range[0].toString());
				params.append('risk_score_max', filters.risk_score_range[1].toString());
			}
			if (filters.overall_grade_categories && filters.overall_grade_categories.length > 0) {
				params.append('grade_categories', filters.overall_grade_categories.join(','));
			}

			// Business filters
			if (filters.industries && filters.industries.length > 0) {
				params.append('industries', filters.industries.join(','));
			}
			if (filters.regions && filters.regions.length > 0) {
				params.append('regions', filters.regions.join(','));
			}
			if (filters.processing_status && filters.processing_status.length > 0) {
				params.append('processing_status', filters.processing_status.join(','));
			}

			// Financial filters
			if (filters.recommended_limit_range) {
				params.append('limit_min', filters.recommended_limit_range[0].toString());
				params.append('limit_max', filters.recommended_limit_range[1].toString());
			}
			if (filters.revenue_range) {
				params.append('revenue_min', filters.revenue_range[0].toString());
				params.append('revenue_max', filters.revenue_range[1].toString());
			}
			if (filters.ebitda_margin_range) {
				params.append('ebitda_min', filters.ebitda_margin_range[0].toString());
				params.append('ebitda_max', filters.ebitda_margin_range[1].toString());
			}
			if (filters.debt_equity_range) {
				params.append('debt_equity_min', filters.debt_equity_range[0].toString());
				params.append('debt_equity_max', filters.debt_equity_range[1].toString());
			}
			if (filters.current_ratio_range) {
				params.append('current_ratio_min', filters.current_ratio_range[0].toString());
				params.append('current_ratio_max', filters.current_ratio_range[1].toString());
			}

			// Compliance filters
			if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
				params.append('gst_compliance', filters.gst_compliance_status.join(','));
			}
			if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
				params.append('epfo_compliance', filters.epfo_compliance_status.join(','));
			}
			if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
				params.append('audit_status', filters.audit_qualification_status.join(','));
			}

			// Date filters
			if (filters.date_range) {
				params.append('date_from', filters.date_range[0].toISOString());
				params.append('date_to', filters.date_range[1].toISOString());
			}

			const response = await fetch(`/api/portfolio?${params}`);
			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch portfolio`);
			}
			return response.json();
		},
		retry: (failureCount, error) => {
			// Retry up to 3 times for network errors, but not for 4xx errors
			if (failureCount < 3) {
				const errorMessage = error.message.toLowerCase();
				return errorMessage.includes('network') || errorMessage.includes('fetch') || errorMessage.includes('500');
			}
			return false;
		},
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
	});

	// Debounced search to improve performance
	const debouncedSearch = useCallback(
		debounce((query: string) => {
			setSearchQuery(query);
			setPagination(prev => ({ ...prev, page: 1 }));
		}, 300),
		[]
	);

	const handleSearch = useCallback((query: string) => {
		debouncedSearch(query);
	}, [debouncedSearch]);

	const handleFilterChange = useCallback((newFilters: FilterCriteria) => {
		setFilters(newFilters);
		setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
	}, []);

	const handleSortChange = useCallback((newSort: SortCriteria) => {
		setSortCriteria(newSort);
		setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setPagination(prev => ({ ...prev, page }));
	}, []);

	const handleLimitChange = useCallback((limit: number) => {
		setPagination(prev => ({ page: 1, limit })); // Reset to first page when changing limit
	}, []);

	const handleCompanyClick = useCallback((company: any) => {
		router.push(`/portfolio/${company.request_id}`);
	}, [router]);

	const handleRetry = useCallback(async (requestId: string) => {
		try {
			const response = await fetch(`/api/portfolio/${requestId}/retry`, {
				method: 'POST'
			});

			const result = await response.json();

			if (response.ok) {
				alert('Processing retry initiated successfully');
				// Refetch data to update the UI
				refetch();
			} else {
				alert(result.error || 'Failed to retry processing');
			}
		} catch (error) {
			console.error('Error retrying processing:', error);
			alert('Failed to retry processing');
		}
	}, [refetch]);

	const handleDelete = useCallback(async (requestId: string) => {
		const company = data?.companies.find((c: any) => c.request_id === requestId);
		const confirmDelete = window.confirm(
			`Are you sure you want to delete ${company?.company_name || 'this company'}? This action cannot be undone.`
		);

		if (!confirmDelete) return;

		try {
			const response = await fetch(`/api/portfolio/${requestId}`, {
				method: 'DELETE'
			});

			const result = await response.json();

			if (response.ok) {
				alert('Company deleted successfully');
				// Refetch data to update the UI
				refetch();
			} else {
				alert(result.error || 'Failed to delete company');
			}
		} catch (error) {
			console.error('Error deleting company:', error);
			alert('Failed to delete company');
		}
	}, [data?.companies, refetch]);

	const clearAllFilters = useCallback(() => {
		setFilters({});
		setSearchQuery('');
		setSortCriteria({ field: 'risk_score', direction: 'desc' });
		setPagination({ page: 1, limit: 20 });
	}, []);

	const handleRetry1 = useCallback(async () => {
		setIsRefreshing(true);
		try {
			await refetch();
		} finally {
			setIsRefreshing(false);
		}
	}, [refetch]);

	const handleUploadNew = useCallback(() => {
		if (onUploadNew) {
			onUploadNew();
		} else {
			router.push('/upload');
		}
	}, [onUploadNew, router]);

	const getActiveFilterCount = useMemo(() => {
		return Object.keys(filters).filter(key => {
			const value = filters[key as keyof FilterCriteria];
			return value !== undefined && value !== null &&
				(Array.isArray(value) ? value.length > 0 : true);
		}).length + (searchQuery.trim() ? 1 : 0);
	}, [filters, searchQuery]);

	// Show full loading state on initial load
	if (isLoading && !data) {
		return <PortfolioLoading message="Loading your portfolio..." />;
	}

	// Show error state
	if (error && !data) {
		return (
			<ErrorState
				error={error}
				onRetry={handleRetry1}
				onRefresh={() => window.location.reload()}
			/>
		);
	}

	const companies = data?.companies || [];
	const totalCount = data?.total_count || 0;
	const hasNext = data?.has_next || false;
	const hasPrevious = data?.has_previous || false;

	return (
		<div className='space-y-6'>
			{/* Data Refresh Loading Indicator */}
			<DataRefreshLoading isRefreshing={isRefreshing} />

			{/* Large Dataset Warning */}
			{/* <LargeDatasetWarning
				totalCount={totalCount}
				currentLimit={pagination.limit}
				onIncreaseLimit={handleLimitChange}
				onApplyFilters={() => setShowRiskFilters(true)}
			/> */}

			{/* Search Bar */}
			<SearchBar
				value={searchQuery}
				onChange={setSearchQuery}
				onSearch={handleSearch}
				suggestions={defaultSearchSuggestions}
				isLoading={isFetching}
			/>

			{/* Filter Controls */}
			{showFilters && (
				<div className="flex flex-wrap items-center gap-3">
					<Button
						variant={showRiskFilters ? 'primary' : 'outline'}
						size="sm"
						onClick={() => setShowRiskFilters(!showRiskFilters)}
						className="flex items-center gap-2"
					>
						<Filter className="w-4 h-4" />
						Risk Filters
						{Object.keys(filters).some(key =>
							['risk_grades', 'risk_score_range', 'overall_grade_categories'].includes(key)
						) && (
								<Badge variant="secondary" className="text-xs ml-1">
									Active
								</Badge>
							)}
					</Button>

					<Button
						variant={showAdvancedFilters ? 'primary' : 'outline'}
						size="sm"
						onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
						className="flex items-center gap-2"
					>
						<Filter className="w-4 h-4" />
						Business Filters
						{Object.keys(filters).some(key =>
							!['risk_grades', 'risk_score_range', 'overall_grade_categories', 'search_query'].includes(key)
						) && (
								<Badge variant="secondary" className="text-xs ml-1">
									Active
								</Badge>
							)}
					</Button>

					{getActiveFilterCount > 0 && (
						<Button
							variant="outline"
							size="sm"
							onClick={clearAllFilters}
							className="flex items-center gap-2 text-red-600 hover:text-red-700"
							disabled={isFetching}
						>
							<X className="w-4 h-4" />
							Clear All ({getActiveFilterCount})
						</Button>
					)}

					{/* View Mode Toggle */}
					<div className="ml-auto flex items-center gap-2">
						<Button
							variant={viewMode === 'grid' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setViewMode('grid')}
						>
							<Grid className="w-4 h-4" />
						</Button>
						<Button
							variant={viewMode === 'list' ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setViewMode('list')}
						>
							<List className="w-4 h-4" />
						</Button>
					</div>
				</div>
			)}

			{/* Filter Panels */}
			{showRiskFilters && (
				<RiskFilterPanel
					filters={filters}
					onFilterChange={handleFilterChange}
				/>
			)}

			{showAdvancedFilters && (
				<AdvancedFilterPanel
					filters={filters}
					onFilterChange={handleFilterChange}
				/>
			)}

			{/* Enhanced Sorting Controls */}
			<div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
				<RiskSortingControls
					sortCriteria={sortCriteria}
					onSortChange={handleSortChange}
				/>

				{/* Quick Sort Actions */}
				<div className="flex items-center gap-2">
					<span className="text-sm text-neutral-60 hidden sm:inline">Quick sort:</span>
					<Button
						variant={sortCriteria.field === 'risk_score' ? 'primary' : 'outline'}
						size="sm"
						onClick={() => handleSortChange({
							field: 'risk_score',
							direction: sortCriteria.field === 'risk_score' && sortCriteria.direction === 'desc' ? 'asc' : 'desc'
						})}
						disabled={isFetching}
						className="flex items-center gap-1"
					>
						<TrendingUp className="w-4 h-4" />
						Risk Score
						{sortCriteria.field === 'risk_score' && (
							sortCriteria.direction === 'desc' ?
								<TrendingDown className="w-3 h-3" /> :
								<TrendingUp className="w-3 h-3" />
						)}
					</Button>

					<Button
						variant={sortCriteria.field === 'recommended_limit' ? 'primary' : 'outline'}
						size="sm"
						onClick={() => handleSortChange({
							field: 'recommended_limit',
							direction: sortCriteria.field === 'recommended_limit' && sortCriteria.direction === 'desc' ? 'asc' : 'desc'
						})}
						disabled={isFetching}
						className="flex items-center gap-1"
					>
						<ArrowUpDown className="w-4 h-4" />
						Limit
						{sortCriteria.field === 'recommended_limit' && (
							sortCriteria.direction === 'desc' ?
								<TrendingDown className="w-3 h-3" /> :
								<TrendingUp className="w-3 h-3" />
						)}
					</Button>

					<Button
						variant={sortCriteria.field === 'industry' ? 'primary' : 'outline'}
						size="sm"
						onClick={() => handleSortChange({
							field: 'industry',
							direction: sortCriteria.field === 'industry' && sortCriteria.direction === 'desc' ? 'asc' : 'desc'
						})}
						disabled={isFetching}
						className="flex items-center gap-1"
					>
						Industry
						{sortCriteria.field === 'industry' && (
							sortCriteria.direction === 'desc' ?
								<TrendingDown className="w-3 h-3" /> :
								<TrendingUp className="w-3 h-3" />
						)}
					</Button>
				</div>
			</div>

			{/* Results Summary with Loading Indicator */}
			<div className='flex justify-between items-center'>
				<div className="flex items-center gap-3">
					<p className='text-neutral-60'>
						Showing {companies.length} of {totalCount.toLocaleString()} companies
						{getActiveFilterCount > 0 && (
							<span className="ml-2">
								<Badge variant="secondary" className="text-xs">
									{getActiveFilterCount} filter{getActiveFilterCount !== 1 ? 's' : ''} active
								</Badge>
							</span>
						)}
					</p>
					{isFetching && (
						<InlineLoading message="Updating..." size="sm" />
					)}
				</div>

				{totalCount > 0 && (
					<p className="text-sm text-neutral-60">
						Page {pagination.page} of {Math.ceil(totalCount / pagination.limit)}
					</p>
				)}
			</div>

			{/* Company Grid/List */}
			<div className={
				viewMode === 'grid'
					? `grid grid-cols-1 ${compactMode ? 'md:grid-cols-3 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-3'} xl:grid-cols-4 gap-6`
					: 'space-y-4'
			}>
				{companies.map((company: any) => (
					<CompanyCard
						key={company.id}
						company={company}
						onClick={() => handleCompanyClick(company)}
						onRetry={handleRetry}
						onDelete={handleDelete}
						showActions={true}
					/>
				))}
			</div>

			{/* Empty State */}
			{companies.length === 0 && !isFetching && (
				<NoCompaniesFound
					hasFilters={getActiveFilterCount > 0}
					hasSearch={!!searchQuery.trim()}
					searchQuery={searchQuery}
					activeFilterCount={getActiveFilterCount}
					onClearFilters={clearAllFilters}
					onUploadNew={handleUploadNew}
				/>
			)}

			{/* Enhanced Pagination with Performance Optimizations */}
			{totalCount > 0 && (
				<div className="pt-6">
					{enableAdvancedPagination ? (
						<div className="space-y-4">
							{/* Performance Info for Large Datasets */}
							{totalCount > 100 && (
								<div className="flex items-center justify-between text-sm text-neutral-60 bg-blue-50 p-3 rounded-lg">
									<div className="flex items-center gap-2">
										<TrendingUp className="w-4 h-4 text-blue-600" />
										<span>
											Large dataset detected ({totalCount.toLocaleString()} companies).
											Consider using filters to improve performance.
										</span>
									</div>
									{pagination.limit < 50 && totalCount > 200 && (
										<Button
											variant="outline"
											size="sm"
											onClick={() => handleLimitChange(50)}
											disabled={isFetching}
										>
											Show 50 per page
										</Button>
									)}
								</div>
							)}

							<PaginationControls
								pagination={pagination}
								totalCount={totalCount}
								hasNext={hasNext}
								hasPrevious={hasPrevious}
								onPageChange={handlePageChange}
								onLimitChange={handleLimitChange}
								isLoading={isFetching}
								showPageSizeSelector={true}
								showPageInfo={false} // Already shown above
								compact={compactMode}
							/>
						</div>
					) : (
						// Simple pagination for compact mode
						<div className='flex justify-center items-center gap-4'>
							<Button
								variant="outline"
								disabled={!hasPrevious || isFetching}
								onClick={() => handlePageChange(pagination.page - 1)}
							>
								Previous
							</Button>

							<span className="text-sm text-neutral-60">
								Page {pagination.page} of {Math.ceil(totalCount / pagination.limit)}
							</span>

							<Button
								variant="outline"
								disabled={!hasNext || isFetching}
								onClick={() => handlePageChange(pagination.page + 1)}
							>
								Next
							</Button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}
