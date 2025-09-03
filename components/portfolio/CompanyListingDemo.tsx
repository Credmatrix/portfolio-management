// components/portfolio/CompanyListingDemo.tsx
'use client'

import { useState } from 'react'
import { PortfolioGrid } from './PortfolioGrid'
import { SearchBar, defaultSearchSuggestions } from './SearchBar'
import { RiskFilterPanel } from './RiskFilterPanel'
import { AdvancedFilterPanel } from './AdvancedFilterPanel'
import { RiskSortingControls } from './RiskSortingControls'
import { FilterCriteria, SortCriteria } from '@/types/portfolio.types'
import { Card } from '@/components/ui/Card'

export function CompanyListingDemo() {
    const [filters, setFilters] = useState<FilterCriteria>({})
    const [sortCriteria, setSortCriteria] = useState<SortCriteria>({
        field: 'risk_score',
        direction: 'desc'
    })
    const [searchQuery, setSearchQuery] = useState('')

    return (
        <div className="space-y-6 p-6">
            <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-neutral-90 mb-2">
                    Company Listing Components Demo
                </h1>
                <p className="text-neutral-60">
                    Demonstration of Task 9.1 components: Enhanced company listing with advanced filtering and sorting
                </p>
            </div>

            {/* Individual Component Demos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Search Bar Demo */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Search Bar Component</h3>
                    <SearchBar
                        value={searchQuery}
                        onChange={setSearchQuery}
                        onSearch={(query) => console.log('Search:', query)}
                        suggestions={defaultSearchSuggestions}
                    />
                </Card>

                {/* Risk Sorting Controls Demo */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Sorting Controls</h3>
                    <RiskSortingControls
                        sortCriteria={sortCriteria}
                        onSortChange={setSortCriteria}
                    />
                </Card>

                {/* Risk Filter Panel Demo */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Filter Panel</h3>
                    <RiskFilterPanel
                        filters={filters}
                        onFilterChange={setFilters}
                    />
                </Card>

                {/* Advanced Filter Panel Demo */}
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Advanced Filter Panel</h3>
                    <AdvancedFilterPanel
                        filters={filters}
                        onFilterChange={setFilters}
                    />
                </Card>
            </div>

            {/* Full Portfolio Grid Demo */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Complete Portfolio Grid</h3>
                <p className="text-neutral-60 mb-6">
                    This demonstrates the full company listing interface with all components integrated
                </p>
                <PortfolioGrid
                    initialFilters={filters}
                    initialSort={sortCriteria}
                    showFilters={true}
                    compactMode={false}
                />
            </Card>

            {/* Component Features Summary */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Task 9.1 Implementation Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <h4 className="font-medium text-neutral-80 mb-2">✅ Implemented Components:</h4>
                        <ul className="text-sm text-neutral-60 space-y-1">
                            <li>• Enhanced CompanyCard with risk grade badges</li>
                            <li>• SearchBar with real-time suggestions</li>
                            <li>• RiskFilterPanel for CM grades and risk scores</li>
                            <li>• AdvancedFilterPanel for business filters</li>
                            <li>• RiskSortingControls for risk-based sorting</li>
                            <li>• Enhanced PortfolioGrid with pagination</li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-medium text-neutral-80 mb-2">🎯 Key Features:</h4>
                        <ul className="text-sm text-neutral-60 space-y-1">
                            <li>• Risk-based sorting (score, grade, category)</li>
                            <li>• Advanced filtering (industry, region, compliance)</li>
                            <li>• Real-time search across company data</li>
                            <li>• Parameter benchmark filtering</li>
                            <li>• Financial ratio range filtering</li>
                            <li>• Responsive grid and list view modes</li>
                        </ul>
                    </div>
                </div>
            </Card>
        </div>
    )
}