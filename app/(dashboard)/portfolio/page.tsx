// app/(dashboard)/portfolio/page.tsx
"use client";

import React, { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { InteractiveAnalyticsSection } from "@/components/analytics/InteractiveAnalyticsSection";
import { PortfolioGrid } from "@/components/portfolio/PortfolioGrid";
import { CompanySearchBar } from "@/components/portfolio/CompanySearchBar";
import { FilterCriteria } from "@/types/portfolio.types";
import { Button } from "@/components/ui/Button";
import { X } from "lucide-react";

export default function PortfolioPage() {
	const router = useRouter();

	// Simplified filter state management
	const [activeFilters, setActiveFilters] = useState<FilterCriteria>({});
	const [searchQuery, setSearchQuery] = useState<string>('');
	const [isUpdatingFilters, setIsUpdatingFilters] = useState(false);

	// Handle analytics filter changes
	const handleAnalyticsFiltersChange = useCallback((newFilters: FilterCriteria) => {
		console.log('Analytics filters changed:', newFilters);
		setIsUpdatingFilters(true);

		// Simply replace the filters - don't merge to avoid confusion
		setActiveFilters(newFilters);

		setTimeout(() => setIsUpdatingFilters(false), 300);
	}, []);

	// Handle search changes
	const handleSearchChange = useCallback((query: string) => {
		setSearchQuery(query);
		setActiveFilters(prev => ({
			...prev,
			search_query: query.trim() || undefined
		}));
	}, []);

	// Handle manual filter changes from PortfolioGrid
	const handleManualFiltersChange = useCallback((newFilters: FilterCriteria) => {
		setActiveFilters(newFilters);
	}, []);

	// Clear all filters
	const handleClearAllFilters = useCallback(() => {
		setActiveFilters({});
		setSearchQuery('');
	}, []);

	// Remove individual filter
	const handleRemoveFilter = useCallback((filterKey: keyof FilterCriteria, value?: string) => {
		setActiveFilters(prev => {
			const updated = { ...prev };

			if (value && Array.isArray(updated[filterKey])) {
				// Remove specific value from array
				const filteredArray = (updated[filterKey] as string[]).filter(item => item !== value);
				if (filteredArray.length === 0) {
					delete updated[filterKey];
				} else {
					(updated as any)[filterKey] = filteredArray;
				}
			} else {
				// Remove entire filter
				delete updated[filterKey];
				if (filterKey === 'search_query') {
					setSearchQuery('');
				}
			}

			return updated;
		});
	}, []);

	// Check if any filters are active
	const hasActiveFilters = Object.keys(activeFilters).some(key => {
		const value = activeFilters[key as keyof FilterCriteria];
		return value !== undefined && value !== null &&
			(Array.isArray(value) ? value.length > 0 : true);
	});

	return (
		<div className='p-4 sm:p-6 lg:p-8 space-y-6 lg:space-y-8'>
			{/* Page Header */}
			{/* <div className='flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4'>
				<div className='flex-1'>
					<h1 className='text-2xl sm:text-3xl font-bold text-neutral-90'>
						Interactive Portfolio Dashboard
					</h1>
					<p className='text-neutral-60 mt-2 text-sm sm:text-base'>
						Click on any chart element to filter your portfolio
					</p>
				</div>
				<div className='w-full lg:w-auto lg:min-w-[300px]'>
					<CompanySearchBar
						onSearch={handleSearchChange}
						value={searchQuery}
					/>
				</div>
			</div> */}

			{/* Interactive Analytics Section */}
			<InteractiveAnalyticsSection
				onFiltersChange={handleAnalyticsFiltersChange}
				activeFilters={activeFilters}
				isLoading={isUpdatingFilters}
				className="mb-6 lg:mb-8"
			/>

			{/* Active Filters Display */}
			{hasActiveFilters && (
				<div className="flex flex-wrap items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-lg">
					<span className="text-sm font-medium text-blue-700">Active Filters:</span>

					{/* Risk Grades */}
					{activeFilters.risk_grades?.map(grade => (
						<span key={grade} className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded">
							Risk: {grade.toUpperCase()}
							<button
								onClick={() => handleRemoveFilter('risk_grades', grade)}
								className="hover:bg-blue-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}

					{/* Industries */}
					{activeFilters.industries?.map(industry => (
						<span key={industry} className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
							Industry: {industry}
							<button
								onClick={() => handleRemoveFilter('industries', industry)}
								className="hover:bg-green-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}

					{/* Regions */}
					{activeFilters.regions?.map(region => (
						<span key={region} className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
							Region: {region}
							<button
								onClick={() => handleRemoveFilter('regions', region)}
								className="hover:bg-orange-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}

					{/* GST Compliance */}
					{activeFilters.gst_compliance_status?.map(status => (
						<span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded">
							GST: {status}
							<button
								onClick={() => handleRemoveFilter('gst_compliance_status', status)}
								className="hover:bg-yellow-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}

					{/* EPFO Compliance */}
					{activeFilters.epfo_compliance_status?.map(status => (
						<span key={status} className="inline-flex items-center gap-1 px-2 py-1 bg-teal-100 text-teal-700 text-xs rounded">
							EPFO: {status}
							<button
								onClick={() => handleRemoveFilter('epfo_compliance_status', status)}
								className="hover:bg-teal-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					))}

					{/* Risk Score Range */}
					{activeFilters.risk_score_range && (
						<span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 text-red-700 text-xs rounded">
							Risk Score: {activeFilters.risk_score_range[0]}-{activeFilters.risk_score_range[1]}
							<button
								onClick={() => handleRemoveFilter('risk_score_range')}
								className="hover:bg-red-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					)}

					{/* Search Query */}
					{activeFilters.search_query && (
						<span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">
							Search: "{activeFilters.search_query}"
							<button
								onClick={() => handleRemoveFilter('search_query')}
								className="hover:bg-purple-200 rounded p-0.5"
							>
								<X className="w-3 h-3" />
							</button>
						</span>
					)}

					<Button
						variant="outline"
						size="sm"
						onClick={handleClearAllFilters}
						className="ml-auto"
					>
						Clear All
					</Button>
				</div>
			)}

			{/* Portfolio Grid with Combined Filters */}
			<div className="relative">
				{/* Loading overlay for filter updates */}
				{isUpdatingFilters && (
					<div className="absolute top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4">
						<div className="flex items-center justify-center gap-2">
							<div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-500"></div>
							<span className="text-sm text-neutral-70">Applying filters...</span>
						</div>
					</div>
				)}

				<PortfolioGrid
					externalFilters={activeFilters}
					showFilters={true}
					onUploadNew={() => router.push('/upload')}
					onManualFiltersChange={handleManualFiltersChange}
					disableInternalFiltering={false}
					filterSyncMode="merge"
					enableAdvancedPagination={true}
				/>
			</div>
		</div>
	);
}