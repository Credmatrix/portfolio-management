/**
 * Enhanced Region Filtering for Portfolio Repository
 * 
 * This module provides sophisticated region filtering capabilities that support
 * multiple address sources, city-level filtering, and proper handling of missing data.
 */

import { PortfolioCompany, FilterCriteria } from '@/types/portfolio.types'
import { extractRegionFromRiskAnalysis, RegionData } from '@/lib/utils/data-extractors'

/**
 * Enhanced region filtering with support for multiple address sources
 */
export function applyEnhancedRegionFiltering(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    let filteredCompanies = [...companies]

    // State-level filtering
    if (filters.regions && filters.regions.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const regionData = extractRegionFromRiskAnalysis(company.risk_analysis)

            // Handle unknown regions based on filter preferences
            if (!regionData.state) {
                return filters.regions!.includes('Unknown') || filters.regions!.includes('unknown')
            }

            // Check if company's state matches any of the filtered regions
            return filters.regions!.some(filterRegion =>
                regionData.state?.toLowerCase() === filterRegion.toLowerCase()
            )
        })
    }

    // City-level filtering
    if (filters.cities && filters.cities.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const regionData = extractRegionFromRiskAnalysis(company.risk_analysis)

            // Handle unknown cities
            if (!regionData.city) {
                return filters.cities!.includes('Unknown') || filters.cities!.includes('unknown')
            }

            // Check if company's city matches any of the filtered cities
            return filters.cities!.some(filterCity =>
                regionData.city?.toLowerCase() === filterCity.toLowerCase()
            )
        })
    }

    return filteredCompanies
}

/**
 * Get region distribution for analytics and filter options
 */
export function getRegionDistribution(companies: PortfolioCompany[]): {
    states: Array<{
        name: string
        count: number
        cities: Array<{
            name: string
            count: number
        }>
    }>
    totalWithRegionData: number
    totalWithoutRegionData: number
    dataQuality: {
        highConfidence: number
        mediumConfidence: number
        lowConfidence: number
    }
} {
    const stateMap = new Map<string, {
        count: number
        cities: Map<string, number>
    }>()

    let totalWithRegionData = 0
    let totalWithoutRegionData = 0
    let highConfidence = 0
    let mediumConfidence = 0
    let lowConfidence = 0

    companies.forEach(company => {
        const regionData = extractRegionFromRiskAnalysis(company.risk_analysis)

        // Track data quality
        switch (regionData.confidence) {
            case 'high':
                highConfidence++
                break
            case 'medium':
                mediumConfidence++
                break
            case 'low':
                lowConfidence++
                break
        }

        if (regionData.state) {
            totalWithRegionData++

            // Initialize state if not exists
            if (!stateMap.has(regionData.state)) {
                stateMap.set(regionData.state, {
                    count: 0,
                    cities: new Map()
                })
            }

            const stateData = stateMap.get(regionData.state)!
            stateData.count++

            // Track cities within state
            if (regionData.city) {
                const cityCount = stateData.cities.get(regionData.city) || 0
                stateData.cities.set(regionData.city, cityCount + 1)
            }
        } else {
            totalWithoutRegionData++
        }
    })

    // Convert maps to arrays and sort
    const states = Array.from(stateMap.entries())
        .map(([stateName, stateData]) => ({
            name: stateName,
            count: stateData.count,
            cities: Array.from(stateData.cities.entries())
                .map(([cityName, count]) => ({ name: cityName, count }))
                .sort((a, b) => b.count - a.count)
        }))
        .sort((a, b) => b.count - a.count)

    return {
        states,
        totalWithRegionData,
        totalWithoutRegionData,
        dataQuality: {
            highConfidence,
            mediumConfidence,
            lowConfidence
        }
    }
}

/**
 * Get suggested regions based on current portfolio composition
 */
export function getSuggestedRegions(
    companies: PortfolioCompany[],
    minCompanyCount: number = 2
): {
    topStates: string[]
    topCities: string[]
    regionalClusters: Array<{
        region: string
        states: string[]
        totalCompanies: number
    }>
} {
    const distribution = getRegionDistribution(companies)

    // Get top states with minimum company count
    const topStates = distribution.states
        .filter(state => state.count >= minCompanyCount)
        .slice(0, 10)
        .map(state => state.name)

    // Get top cities across all states
    const allCities = distribution.states
        .flatMap(state => state.cities)
        .sort((a, b) => b.count - a.count)
        .filter(city => city.count >= minCompanyCount)
        .slice(0, 15)
        .map(city => city.name)

    // Create regional clusters (simplified - could be enhanced with geographic data)
    const regionalClusters = [
        {
            region: 'Western India',
            states: ['Maharashtra', 'Gujarat', 'Goa'],
            totalCompanies: 0
        },
        {
            region: 'Northern India',
            states: ['Delhi', 'Punjab', 'Haryana', 'Uttar Pradesh', 'Rajasthan'],
            totalCompanies: 0
        },
        {
            region: 'Southern India',
            states: ['Karnataka', 'Tamil Nadu', 'Andhra Pradesh', 'Telangana', 'Kerala'],
            totalCompanies: 0
        },
        {
            region: 'Eastern India',
            states: ['West Bengal', 'Odisha', 'Jharkhand', 'Bihar'],
            totalCompanies: 0
        },
        {
            region: 'Central India',
            states: ['Madhya Pradesh', 'Chhattisgarh'],
            totalCompanies: 0
        }
    ]

    // Calculate company counts for each cluster
    regionalClusters.forEach(cluster => {
        cluster.totalCompanies = distribution.states
            .filter(state => cluster.states.includes(state.name))
            .reduce((sum, state) => sum + state.count, 0)
    })

    return {
        topStates,
        topCities: allCities,
        regionalClusters: regionalClusters.filter(cluster => cluster.totalCompanies > 0)
    }
}

/**
 * Validate region filter parameters
 */
export function validateRegionFilters(filters: FilterCriteria): {
    isValid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []

    // Validate regions array
    if (filters.regions) {
        if (filters.regions.length === 0) {
            warnings.push('Empty regions array provided')
        }

        if (filters.regions.length > 20) {
            warnings.push('Large number of regions selected may impact performance')
        }

        // Check for invalid region names (basic validation)
        const invalidRegions = filters.regions.filter(region =>
            typeof region !== 'string' || region.trim().length === 0
        )

        if (invalidRegions.length > 0) {
            errors.push('Invalid region names provided')
        }
    }

    // Validate cities array
    if (filters.cities) {
        if (filters.cities.length === 0) {
            warnings.push('Empty cities array provided')
        }

        if (filters.cities.length > 50) {
            warnings.push('Large number of cities selected may impact performance')
        }

        const invalidCities = filters.cities.filter(city =>
            typeof city !== 'string' || city.trim().length === 0
        )

        if (invalidCities.length > 0) {
            errors.push('Invalid city names provided')
        }
    }

    // Check for potential conflicts
    if (filters.regions && filters.cities &&
        filters.regions.length > 10 && filters.cities.length > 20) {
        warnings.push('Both region and city filters with many options may be overly restrictive')
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

/**
 * Optimize region filtering for better performance
 */
export function optimizeRegionFiltering(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): {
    optimizedFilters: FilterCriteria
    optimizationApplied: boolean
    optimizationDetails: string[]
} {
    const optimizedFilters = { ...filters }
    const optimizationDetails: string[] = []
    let optimizationApplied = false

    // If too many regions are selected, suggest using regional clusters
    if (filters.regions && filters.regions.length > 15) {
        const suggestions = getSuggestedRegions(companies)
        const matchingClusters = suggestions.regionalClusters.filter(cluster =>
            cluster.states.some(state => filters.regions!.includes(state))
        )

        if (matchingClusters.length > 0) {
            optimizationDetails.push(
                `Consider using regional clusters instead of individual states for better performance`
            )
        }
    }

    // If both regions and cities are specified, check for redundancy
    if (filters.regions && filters.cities) {
        const distribution = getRegionDistribution(companies)
        const redundantCities = filters.cities.filter(city => {
            // Check if city belongs to a state that's already in the region filter
            return distribution.states.some(state =>
                filters.regions!.includes(state.name) &&
                state.cities.some(stateCity => stateCity.name === city)
            )
        })

        if (redundantCities.length > 0) {
            optimizedFilters.cities = filters.cities.filter(city =>
                !redundantCities.includes(city)
            )
            optimizationApplied = true
            optimizationDetails.push(
                `Removed ${redundantCities.length} redundant cities that are already covered by region filters`
            )
        }
    }

    return {
        optimizedFilters,
        optimizationApplied,
        optimizationDetails
    }
}

/**
 * Get region filtering performance metrics
 */
export function getRegionFilteringMetrics(
    originalCompanies: PortfolioCompany[],
    filteredCompanies: PortfolioCompany[],
    filters: FilterCriteria
): {
    originalCount: number
    filteredCount: number
    reductionRate: number
    regionDataAvailability: number
    filterEffectiveness: 'high' | 'medium' | 'low'
    recommendations: string[]
} {
    const originalCount = originalCompanies.length
    const filteredCount = filteredCompanies.length
    const reductionRate = originalCount > 0 ? (originalCount - filteredCount) / originalCount : 0

    // Calculate region data availability
    const companiesWithRegionData = originalCompanies.filter(company => {
        const regionData = extractRegionFromRiskAnalysis(company.risk_analysis)
        return regionData.state !== null || regionData.city !== null
    }).length

    const regionDataAvailability = originalCount > 0 ? companiesWithRegionData / originalCount : 0

    // Determine filter effectiveness
    let filterEffectiveness: 'high' | 'medium' | 'low' = 'low'
    if (reductionRate > 0.7) {
        filterEffectiveness = 'high'
    } else if (reductionRate > 0.3) {
        filterEffectiveness = 'medium'
    }

    // Generate recommendations
    const recommendations: string[] = []

    if (regionDataAvailability < 0.8) {
        recommendations.push('Consider improving region data extraction to enhance filtering accuracy')
    }

    if (reductionRate > 0.9) {
        recommendations.push('Region filters may be too restrictive - consider broadening criteria')
    }

    if (reductionRate < 0.1 && (filters.regions || filters.cities)) {
        recommendations.push('Region filters have minimal impact - consider more specific criteria')
    }

    return {
        originalCount,
        filteredCount,
        reductionRate,
        regionDataAvailability,
        filterEffectiveness,
        recommendations
    }
}