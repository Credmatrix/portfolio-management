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
import { NoCompaniesFound, ErrorState } from "./EmptyStates";
import { FilterStateManager } from "./FilterStateManager";
import { FilterImpactIndicator } from "./FilterImpactIndicator";
import { FilterSuggestions } from "./FilterSuggestions";
import { FilterPerformanceMonitor } from "./FilterPerformanceMonitor";
import { ActiveFiltersDisplay } from "./ActiveFiltersDisplay";
// import { EnhancedFilterPanelManager } from "./EnhancedFilterPanelManager";
// import { SmartFilterPanel } from "./SmartFilterPanel";
import { FilterCriteria, SortCriteria, PaginationParams } from "@/types/portfolio.types";
import { DashboardFilterState, FilterSource } from "@/types/chart-interactions.types";
import { useFilterSystem } from "@/lib/hooks/useFilterSystem";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Grid, List, Filter, X, ArrowUpDown, TrendingUp, TrendingDown, Eye, EyeOff, Settings } from "lucide-react";

interface PortfolioGridProps {
	initialFilters?: FilterCriteria;
	initialSort?: SortCriteria;
	showFilters?: boolean;
	compactMode?: boolean;
	onUploadNew?: () => void;
	enableAdvancedPagination?: boolean;
	onFiltersChange?: (filters: FilterCriteria) => void;
	// Enhanced props for bidirectional filter synchronization
	externalFilters?: FilterCriteria;
	onManualFiltersChange?: (filters: FilterCriteria) => void;
	onExternalFiltersChange?: (filters: FilterCriteria) => void;
	disableInternalFiltering?: boolean;
	filterSyncMode?: 'merge' | 'replace' | 'independent';
	filterSource?: 'manual' | 'analytics' | 'search';
	onFilterSourceChange?: (source: 'manual' | 'analytics' | 'search', filters: FilterCriteria) => void;
	// Filter state management props
	enableFilterStateManagement?: boolean;
	showFilterSummary?: boolean;
	showConflictResolution?: boolean;
	// Advanced filter UI props
	showFilterImpact?: boolean;
	showFilterSuggestions?: boolean;
	enableFilterPresets?: boolean;
	maxVisibleFilters?: number;
	// Phase 7: Enhanced filter panel props
	enableEnhancedFiltering?: boolean;
	filterPanelData?: {
		portfolioStats?: {
			totalCompanies: number;
			industryBreakdown: Record<string, number>;
			regionBreakdown: Record<string, number>;
			complianceBreakdown: Record<string, number>;
			riskGradeBreakdown: Record<string, number>;
		};
		complianceStats?: any;
		regionData?: any[];
		industryData?: any[];
		financialMetrics?: any[];
		benchmarkData?: any;
	};
	onExportFilters?: () => void;
	onImportFilters?: (filters: any) => void;
}

export function PortfolioGrid({
	initialFilters = {},
	initialSort = { field: 'risk_score', direction: 'desc' },
	showFilters = true,
	compactMode = false,
	onUploadNew,
	enableAdvancedPagination = true,
	onFiltersChange,
	// Enhanced props for bidirectional filter synchronization
	externalFilters = {},
	onManualFiltersChange,
	onExternalFiltersChange,
	disableInternalFiltering = false,
	filterSyncMode = 'merge',
	filterSource = 'manual',
	onFilterSourceChange,
	// Filter state management props
	enableFilterStateManagement = false,
	showFilterSummary = true,
	showConflictResolution = true,
	// Advanced filter UI props
	showFilterImpact = true,
	showFilterSuggestions = true,
	enableFilterPresets = false,
	maxVisibleFilters = 10,
	// Phase 7: Enhanced filter panel props
	enableEnhancedFiltering = false,
	filterPanelData,
	onExportFilters,
	onImportFilters
}: PortfolioGridProps) {
	const router = useRouter();
	const [internalFilters, setInternalFilters] = useState<FilterCriteria>(initialFilters);
	const [sortCriteria, setSortCriteria] = useState<SortCriteria>(initialSort);
	const [searchQuery, setSearchQuery] = useState<string>(initialFilters.search_query || '');
	const [pagination, setPagination] = useState<PaginationParams>({ page: 1, limit: 20 });
	const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
	const [showRiskFilters, setShowRiskFilters] = useState(false);
	const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
	const [showEnhancedFilters, setShowEnhancedFilters] = useState(false);
	const [isRefreshing, setIsRefreshing] = useState(false);
	const abortControllerRef = useRef<AbortController | null>(null);

	// Filter state management integration
	const filterSystem = null;

	// Filter source tracking state
	const [currentFilterSource, setCurrentFilterSource] = useState<'manual' | 'analytics' | 'search'>(filterSource);
	const [filterHistory, setFilterHistory] = useState<Array<{
		source: 'manual' | 'analytics' | 'search';
		filters: FilterCriteria;
		timestamp: number;
	}>>([]);

	// Bidirectional filter synchronization with merge logic
	const combinedFilters = useMemo(() => {
		switch (filterSyncMode) {
			case 'replace':
				// External filters completely replace internal filters
				return Object.keys(externalFilters).length > 0 ? externalFilters : internalFilters;

			case 'independent':
				// Use only internal filters, ignore external
				return internalFilters;

			case 'merge':
			default:
				// Merge filters with external taking precedence for conflicts
				const merged = { ...internalFilters };

				// Merge external filters, handling arrays and ranges properly
				Object.entries(externalFilters).forEach(([key, value]) => {
					if (value !== undefined && value !== null) {
						const filterKey = key as keyof FilterCriteria;

						if (Array.isArray(value) && Array.isArray(merged[filterKey])) {
							// Merge arrays and remove duplicates
							const existingArray = merged[filterKey] as any[];
							const newArray = [...new Set([...existingArray, ...value])];
							(merged as any)[filterKey] = newArray;
						} else {
							// Replace with external value
							(merged as any)[filterKey] = value;
						}
					}
				});

				return merged;
		}
	}, [internalFilters, externalFilters, filterSyncMode]);

	// Advanced filter UI state
	const [showAdvancedUI, setShowAdvancedUI] = useState(false);
	const [dashboardFilterState, setDashboardFilterState] = useState<DashboardFilterState>({
		analyticsFilters: {},
		manualFilters: internalFilters,
		searchFilters: {},
		combinedFilters: combinedFilters,
		activeChartSelections: {},
		filterHistory: []
	});
	const [lastRequestTime, setLastRequestTime] = useState<number>(0);



	// Initialize internal filters only once on mount
	useEffect(() => {
		setInternalFilters(initialFilters);
		setSearchQuery(initialFilters.search_query || '');
	}, []); // Empty dependency array - only run on mount

	// Update search query when external filters change
	const externalSearchQuery = externalFilters.search_query;
	useEffect(() => {
		if (externalSearchQuery !== undefined) {
			setSearchQuery(externalSearchQuery || '');
		}
	}, [externalSearchQuery]);

	// Pagination reset is handled in individual filter change handlers instead of useEffect

	// Cleanup abort controller on unmount
	useEffect(() => {
		return () => {
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}
		};
	}, []);

	// Create stable query key to prevent unnecessary re-fetches
	const queryKey = useMemo(() => [
		"portfolio",
		JSON.stringify(combinedFilters),
		JSON.stringify(sortCriteria),
		searchQuery,
		JSON.stringify(pagination)
	], [combinedFilters, sortCriteria, searchQuery, pagination]);

	const { data, isLoading, error, refetch, isFetching } = useQuery({
		queryKey,
		queryFn: async () => {
			// Track request start time
			const requestStartTime = performance.now();
			setLastRequestTime(requestStartTime);

			// Cancel previous request if still pending
			if (abortControllerRef.current) {
				abortControllerRef.current.abort();
			}

			// Create new abort controller for this request
			abortControllerRef.current = new AbortController();

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
			if (combinedFilters.risk_grades && combinedFilters.risk_grades.length > 0) {
				params.append('risk_grades', combinedFilters.risk_grades.join(','));
			}
			if (combinedFilters.risk_score_range) {
				params.append('risk_score_min', combinedFilters.risk_score_range[0].toString());
				params.append('risk_score_max', combinedFilters.risk_score_range[1].toString());
			}
			if (combinedFilters.overall_grade_categories && combinedFilters.overall_grade_categories.length > 0) {
				params.append('grade_categories', combinedFilters.overall_grade_categories.join(','));
			}

			// Business filters
			if (combinedFilters.industries && combinedFilters.industries.length > 0) {
				params.append('industries', combinedFilters.industries.join(','));
			}
			if (combinedFilters.sectors && combinedFilters.sectors.length > 0) {
				params.append('sectors', combinedFilters.sectors.join(','));
			}
			if (combinedFilters.regions && combinedFilters.regions.length > 0) {
				params.append('regions', combinedFilters.regions.join(','));
			}
			if (combinedFilters.cities && combinedFilters.cities.length > 0) {
				params.append('cities', combinedFilters.cities.join(','));
			}
			if (combinedFilters.credit_ratings && combinedFilters.credit_ratings.length > 0) {
				params.append('credit_ratings', combinedFilters.credit_ratings.join(','));
			}
			if (combinedFilters.location_search) {
				params.append('location_search', combinedFilters.location_search);
			}
			if (combinedFilters.processing_status && combinedFilters.processing_status.length > 0) {
				params.append('processing_status', combinedFilters.processing_status.join(','));
			}

			// Financial filters
			if (combinedFilters.recommended_limit_range) {
				params.append('limit_min', combinedFilters.recommended_limit_range[0].toString());
				params.append('limit_max', combinedFilters.recommended_limit_range[1].toString());
			}
			if (combinedFilters.revenue_range) {
				params.append('revenue_min', combinedFilters.revenue_range[0].toString());
				params.append('revenue_max', combinedFilters.revenue_range[1].toString());
			}
			if (combinedFilters.ebitda_margin_range) {
				params.append('ebitda_min', combinedFilters.ebitda_margin_range[0].toString());
				params.append('ebitda_max', combinedFilters.ebitda_margin_range[1].toString());
			}
			if (combinedFilters.debt_equity_range) {
				params.append('debt_equity_min', combinedFilters.debt_equity_range[0].toString());
				params.append('debt_equity_max', combinedFilters.debt_equity_range[1].toString());
			}
			if (combinedFilters.current_ratio_range) {
				params.append('current_ratio_min', combinedFilters.current_ratio_range[0].toString());
				params.append('current_ratio_max', combinedFilters.current_ratio_range[1].toString());
			}

			// Compliance filters
			if (combinedFilters.gst_compliance_status && combinedFilters.gst_compliance_status.length > 0) {
				params.append('gst_compliance', combinedFilters.gst_compliance_status.join(','));
			}
			if (combinedFilters.epfo_compliance_status && combinedFilters.epfo_compliance_status.length > 0) {
				params.append('epfo_compliance', combinedFilters.epfo_compliance_status.join(','));
			}
			if (combinedFilters.audit_qualification_status && combinedFilters.audit_qualification_status.length > 0) {
				params.append('audit_status', combinedFilters.audit_qualification_status.join(','));
			}

			// Date filters
			if (combinedFilters.date_range) {
				params.append('date_from', combinedFilters.date_range[0].toISOString());
				params.append('date_to', combinedFilters.date_range[1].toISOString());
			}

			const response = await fetch(`/api/portfolio?${params}`);

			if (!response.ok) {
				const errorData = await response.json().catch(() => ({}));
				throw new Error(errorData.error || `HTTP ${response.status}: Failed to fetch portfolio`);
			}

			const result = await response.json();

			// Track request completion time
			const requestEndTime = performance.now();
			setLastRequestTime(requestEndTime);

			return result;
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
	const handleFilterChange = useCallback((newFilters: FilterCriteria, source: 'manual' | 'analytics' | 'search' = 'manual') => {
		// Track filter history for debugging and analytics
		setFilterHistory(prev => [...prev.slice(-9), {
			source,
			filters: newFilters,
			timestamp: Date.now()
		}]);

		// Update current filter source
		setCurrentFilterSource(source);

		if (!disableInternalFiltering || source !== 'manual') {
			setInternalFilters(newFilters);
			setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page

			// Notify parent component based on source
			if (source === 'manual' && onManualFiltersChange) {
				onManualFiltersChange(newFilters);
			} else if (source === 'analytics' && onExternalFiltersChange) {
				onExternalFiltersChange(newFilters);
			}

			// Notify parent of filter source changes
			if (onFilterSourceChange) {
				onFilterSourceChange(source, newFilters);
			}
		}

		// Always notify parent of filter changes for backward compatibility
		if (onFiltersChange) {
			onFiltersChange(newFilters);
		}
	}, [onFiltersChange, onManualFiltersChange, onExternalFiltersChange, onFilterSourceChange, disableInternalFiltering]);

	// Debounced filter changes to prevent excessive API calls
	const debouncedFilterChange = useCallback(
		debounce((filters: FilterCriteria, source: 'manual' | 'analytics' | 'search') => {
			handleFilterChange(filters, source);
		}, 250),
		[handleFilterChange]
	);

	const handleSearch = useCallback((query: string) => {
		// Cancel any pending requests for rapid search changes
		if (abortControllerRef.current) {
			abortControllerRef.current.abort();
		}
		debouncedSearch(query);
	}, [debouncedSearch]);


	// Handle external filter updates from analytics components
	const handleExternalFilterUpdate = useCallback((analyticsFilters: FilterCriteria) => {
		handleFilterChange(analyticsFilters, 'analytics');
	}, [handleFilterChange]);

	// Update dashboard filter state when filters change
	useEffect(() => {
		setDashboardFilterState(prev => ({
			...prev,
			manualFilters: currentFilterSource === 'manual' ? combinedFilters : prev.manualFilters,
			analyticsFilters: currentFilterSource === 'analytics' ? combinedFilters : prev.analyticsFilters,
			searchFilters: currentFilterSource === 'search' ? combinedFilters : prev.searchFilters,
			combinedFilters: combinedFilters,
			filterHistory: filterHistory.map(h => ({
				source: h.source,
				filters: h.filters,
				sourceDetails: {
					timestamp: h.timestamp
				}
			}))
		}));
	}, [combinedFilters, currentFilterSource, filterHistory]);

	// Handle filter suggestions
	const handleApplySuggestion = useCallback((suggestion: any) => {
		const updatedFilters = { ...combinedFilters, ...suggestion.filterUpdates };
		handleFilterChange(updatedFilters, 'manual');
	}, [combinedFilters, handleFilterChange]);

	// Handle filter optimization
	const handleOptimizeFilters = useCallback(() => {
		// Remove less impactful filters to improve performance
		const optimizedFilters: FilterCriteria = {};

		// Keep high-impact filters
		if (combinedFilters.risk_grades) optimizedFilters.risk_grades = combinedFilters.risk_grades;
		if (combinedFilters.industries) optimizedFilters.industries = combinedFilters.industries.slice(0, 3);
		if (combinedFilters.search_query) optimizedFilters.search_query = combinedFilters.search_query;

		handleFilterChange(optimizedFilters, 'manual');
	}, [combinedFilters, handleFilterChange]);

	// Handle active filter removal
	const handleRemoveFilter = useCallback((source: FilterSource, filterKey: string, value?: any) => {
		const currentFilters = source === 'analytics' ? dashboardFilterState.analyticsFilters :
			source === 'search' ? dashboardFilterState.searchFilters :
				dashboardFilterState.manualFilters;

		const updatedFilters = { ...currentFilters };
		const key = filterKey as keyof FilterCriteria;

		if (Array.isArray(updatedFilters[key]) && value !== undefined) {
			// Remove specific value from array
			const currentArray = updatedFilters[key] as any[];
			(updatedFilters as any)[key] = currentArray.filter(item => item !== value);

			// Remove the key entirely if array becomes empty
			if ((updatedFilters[key] as any[]).length === 0) {
				delete updatedFilters[key];
			}
		} else {
			// Remove entire filter
			delete updatedFilters[key];
		}

		handleFilterChange(updatedFilters, source === 'analytics' ? 'analytics' : 'manual');
	}, [dashboardFilterState, handleFilterChange]);

	// Handle clearing filters by source
	const handleClearSource = useCallback((source: FilterSource) => {
		handleFilterChange({}, source === 'analytics' ? 'analytics' : 'manual');
	}, [handleFilterChange]);

	// Handle clearing all filters
	const handleClearAllFilters = useCallback(() => {
		setDashboardFilterState(prev => ({
			...prev,
			analyticsFilters: {},
			manualFilters: {},
			searchFilters: {},
			combinedFilters: {},
			activeChartSelections: {}
		}));
		handleFilterChange({}, 'manual');
	}, [handleFilterChange]);

	const handleSortChange = useCallback((newSort: SortCriteria) => {
		setSortCriteria(newSort);
		setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page
	}, []);

	const handlePageChange = useCallback((page: number) => {
		setPagination(prev => ({ ...prev, page }));
	}, []);

	const handleLimitChange = useCallback((limit: number) => {
		setPagination({ page: 1, limit }); // Reset to first page when changing limit
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
		if (!disableInternalFiltering) {
			setInternalFilters({});
			setSearchQuery('');
			setSortCriteria({ field: 'risk_score', direction: 'desc' });
			setPagination({ page: 1, limit: 20 });

			// Clear dashboard filter state
			handleClearAllFilters();

			// Notify parent of manual filter clearing
			if (onManualFiltersChange) {
				onManualFiltersChange({});
			}
		}

		// Notify parent for backward compatibility
		if (onFiltersChange) {
			onFiltersChange({});
		}
	}, [onFiltersChange, onManualFiltersChange, disableInternalFiltering, handleClearAllFilters]);

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
		// Always count combined filters to show the true active filter count
		return Object.keys(combinedFilters).filter(key => {
			const value = combinedFilters[key as keyof FilterCriteria];
			return value !== undefined && value !== null &&
				(Array.isArray(value) ? value.length > 0 : true);
		}).length + (searchQuery.trim() ? 1 : 0);
	}, [combinedFilters, searchQuery]);

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
			{/* Filter State Management */}
			{enableFilterStateManagement && filterSystem && (
				<FilterStateManager
					showFilterSummary={showFilterSummary}
					showConflictResolution={showConflictResolution}
					onFiltersChange={(hasActiveFilters) => {
						// Handle filter state changes if needed
						console.log('Filter state changed:', hasActiveFilters);
					}}
				/>
			)}

			{/* Advanced Filter UI Toggle */}
			{(showFilterImpact || showFilterSuggestions) && (
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-2">
						<span className="text-sm text-neutral-60">Advanced Filtering</span>
						<Badge variant="outline" size="sm">
							{getActiveFilterCount} active
						</Badge>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setShowAdvancedUI(!showAdvancedUI)}
						className="flex items-center gap-2"
					>
						{showAdvancedUI ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
						{showAdvancedUI ? 'Hide' : 'Show'} Details
					</Button>
				</div>
			)}

			{/* Advanced Filter Components */}
			{showAdvancedUI && (
				<div className="space-y-4">
					{/* Active Filters Display */}
					<ActiveFiltersDisplay
						filterState={dashboardFilterState}
						onRemoveFilter={handleRemoveFilter}
						onClearSource={handleClearSource}
						onClearAll={handleClearAllFilters}
						showSourceDetails={true}
						collapsible={false}
					/>

					{/* Filter Impact Indicator */}
					{showFilterImpact && (
						<FilterImpactIndicator
							filters={combinedFilters}
							totalCount={totalCount}
							filteredCount={companies.length}
							isLoading={isFetching}
							showDetails={true}
							onOptimizeFilters={handleOptimizeFilters}
						/>
					)}

					{/* Filter Suggestions */}
					{showFilterSuggestions && (
						<FilterSuggestions
							currentFilters={combinedFilters}
							totalCount={totalCount}
							filteredCount={companies.length}
							onApplySuggestion={handleApplySuggestion}
							onDismissSuggestion={(id) => console.log('Dismissed suggestion:', id)}
							maxSuggestions={3}
							showOnlyHighPriority={false}
						/>
					)}

					{/* Performance Monitor */}
					<FilterPerformanceMonitor
						filters={combinedFilters}
						isLoading={isFetching}
						lastRequestTime={lastRequestTime}
						showDetails={true}
						onOptimizeRequest={handleOptimizeFilters}
					/>
				</div>
			)}

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
					{enableEnhancedFiltering && filterPanelData ? (
						<Button
							variant={showEnhancedFilters ? 'primary' : 'outline'}
							size="sm"
							onClick={() => setShowEnhancedFilters(!showEnhancedFilters)}
							className="flex items-center gap-2"
							disabled={disableInternalFiltering}
						>
							<Settings className="w-4 h-4" />
							Smart Filters
							{getActiveFilterCount > 0 && (
								<Badge variant="secondary" className="text-xs ml-1">
									{getActiveFilterCount}
								</Badge>
							)}
						</Button>
					) : (
						<>
							<Button
								variant={showRiskFilters ? 'primary' : 'outline'}
								size="sm"
								onClick={() => setShowRiskFilters(!showRiskFilters)}
								className="flex items-center gap-2"
								disabled={disableInternalFiltering}
							>
								<Filter className="w-4 h-4" />
								Risk Filters
								{Object.keys(combinedFilters).some(key =>
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
								disabled={disableInternalFiltering}
							>
								<Filter className="w-4 h-4" />
								Business Filters
								{Object.keys(combinedFilters).some(key =>
									!['risk_grades', 'risk_score_range', 'overall_grade_categories', 'search_query'].includes(key)
								) && (
										<Badge variant="secondary" className="text-xs ml-1">
											Active
										</Badge>
									)}
							</Button>
						</>
					)}

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
							{isFetching && (
								<div className="w-3 h-3 border border-red-600 border-t-transparent rounded-full animate-spin ml-1" />
							)}
						</Button>
					)}

					{/* Filter Source Indicator */}
					{currentFilterSource !== 'manual' && (
						<Badge variant="info" size="sm" className="flex items-center gap-1">
							<Settings className="w-3 h-3" />
							{currentFilterSource === 'analytics' ? 'Chart-driven' : 'Search-driven'}
						</Badge>
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

			{/* Enhanced Filter Panels */}
			{/* {showEnhancedFilters && enableEnhancedFiltering && filterPanelData && !disableInternalFiltering && (
				<EnhancedFilterPanelManager
					data={filterPanelData}
					onFilterChange={(filters) => handleFilterChange(filters, 'manual')}
					onExportFilters={onExportFilters}
					onImportFilters={onImportFilters}
				/>
			)} */}

			{/* Traditional Filter Panels */}
			{!enableEnhancedFiltering && (
				<>
					{showRiskFilters && !disableInternalFiltering && (
						<RiskFilterPanel
							filters={internalFilters}
							onFilterChange={(filters) => handleFilterChange(filters, 'manual')}
						/>
					)}

					{showAdvancedFilters && !disableInternalFiltering && (
						<AdvancedFilterPanel
							filters={internalFilters}
							onFilterChange={(filters) => handleFilterChange(filters, 'manual')}
						/>
					)}
				</>
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
							<span className="ml-2 flex items-center gap-2">
								<Badge variant="secondary" className="text-xs">
									{getActiveFilterCount} filter{getActiveFilterCount !== 1 ? 's' : ''} active
								</Badge>
								{totalCount > 0 && (
									<Badge
										variant={companies.length / totalCount < 0.1 ? "destructive" :
											companies.length / totalCount < 0.3 ? "warning" : "info"}
										className="text-xs"
									>
										{((companies.length / totalCount) * 100).toFixed(1)}% shown
									</Badge>
								)}
							</span>
						)}
					</p>
					{isFetching && (
						<InlineLoading message="Updating..." size="sm" />
					)}
					{currentFilterSource === 'analytics' && (
						<Badge variant="info" size="sm" className="text-xs">
							Chart-filtered
						</Badge>
					)}
				</div>

				{totalCount > 0 && (
					<div className="flex items-center gap-3">
						<p className="text-sm text-neutral-60">
							Page {pagination.page} of {Math.ceil(totalCount / pagination.limit)}
						</p>
						{getActiveFilterCount > 5 && (
							<Badge variant="warning" size="sm" className="text-xs">
								Complex filters
							</Badge>
						)}
					</div>
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
