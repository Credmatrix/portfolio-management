/**
 * Enhanced Compliance Filtering for Portfolio Repository
 * 
 * This module provides enhanced compliance filtering capabilities using the new data extraction utilities.
 * It replaces the basic client-side filtering with more sophisticated extraction-based filtering.
 */

import { PortfolioCompany, FilterCriteria } from '@/types/portfolio.types'
import {
    extractComplianceData,
    extractRegionFromRiskAnalysis,
    extractFinancialMetrics,
    ComplianceStatus,
    AuditStatus
} from '@/lib/utils/data-extractors'

/**
 * Enhanced compliance filtering using data extraction utilities
 */
export function applyEnhancedComplianceFilters(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    let filteredCompanies = [...companies]

    // Enhanced GST compliance filtering
    if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const complianceData = extractComplianceData(company.risk_analysis)
            const gstStatus = complianceData.gstCompliance.status

            return filters.gst_compliance_status!.includes(gstStatus)
        })
    }

    // Enhanced EPFO compliance filtering
    if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const complianceData = extractComplianceData(company.risk_analysis)
            const epfoStatus = complianceData.epfoCompliance.status

            return filters.epfo_compliance_status!.includes(epfoStatus)
        })
    }

    // Enhanced audit qualification filtering
    if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const complianceData = extractComplianceData(company.risk_analysis)
            const auditStatus = complianceData.auditStatus.status

            return filters.audit_qualification_status!.includes(auditStatus)
        })
    }

    return filteredCompanies
}

/**
 * Enhanced region filtering using data extraction utilities
 */
export function applyEnhancedRegionFilters(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    let filteredCompanies = [...companies]

    // Enhanced region filtering with multiple address sources
    if (filters.regions && filters.regions.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const regionData = extractRegionFromRiskAnalysis(company.risk_analysis)

            // Check if company's state matches any of the filtered regions
            if (regionData.state && filters.regions!.includes(regionData.state)) {
                return true
            }

            return false
        })
    }

    // City-level filtering
    if (filters.cities && filters.cities.length > 0) {
        filteredCompanies = filteredCompanies.filter(company => {
            const regionData = extractRegionFromRiskAnalysis(company.risk_analysis)

            // Check if company's city matches any of the filtered cities
            if (regionData.city && filters.cities!.includes(regionData.city)) {
                return true
            }

            return false
        })
    }

    return filteredCompanies
}

/**
 * Enhanced financial metrics filtering using data extraction utilities
 */
export function applyEnhancedFinancialFilters(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    let filteredCompanies = [...companies]

    // Check if any financial filters are applied
    const hasFinancialFilters = !!(
        filters.ebitda_margin_range ||
        filters.debt_equity_range ||
        filters.current_ratio_range ||
        filters.roce_range ||
        filters.interest_coverage_range ||
        filters.revenue_range ||
        filters.net_worth_range
    )

    if (!hasFinancialFilters) {
        return filteredCompanies
    }

    filteredCompanies = filteredCompanies.filter(company => {
        const financialMetrics = extractFinancialMetrics(company.risk_analysis)

        // Skip companies with low confidence financial data for strict filtering
        if (financialMetrics.confidence === 'low') {
            return false
        }

        // EBITDA Margin filter
        if (filters.ebitda_margin_range && financialMetrics.ebitdaMargin !== null) {
            const [min, max] = filters.ebitda_margin_range
            if (financialMetrics.ebitdaMargin < min || financialMetrics.ebitdaMargin > max) {
                return false
            }
        }

        // Debt-Equity Ratio filter
        if (filters.debt_equity_range && financialMetrics.debtEquityRatio !== null) {
            const [min, max] = filters.debt_equity_range
            if (financialMetrics.debtEquityRatio < min || financialMetrics.debtEquityRatio > max) {
                return false
            }
        }

        // Current Ratio filter
        if (filters.current_ratio_range && financialMetrics.currentRatio !== null) {
            const [min, max] = filters.current_ratio_range
            if (financialMetrics.currentRatio < min || financialMetrics.currentRatio > max) {
                return false
            }
        }

        // Revenue filter
        if (filters.revenue_range && financialMetrics.totalRevenue !== null) {
            const [min, max] = filters.revenue_range
            const revenueInCrores = financialMetrics.totalRevenue / 10000000 // Convert to crores
            if (revenueInCrores < min || revenueInCrores > max) {
                return false
            }
        }

        // Net worth filter (using total assets - total liabilities as proxy)
        if (filters.net_worth_range && financialMetrics.totalAssets !== null && financialMetrics.totalLiabilities !== null) {
            const [min, max] = filters.net_worth_range
            const netWorthInCrores = (financialMetrics.totalAssets - financialMetrics.totalLiabilities) / 10000000
            if (netWorthInCrores < min || netWorthInCrores > max) {
                return false
            }
        }

        return true
    })

    return filteredCompanies
}

/**
 * Master function that applies all enhanced filters
 */
export function applyAllEnhancedFilters(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    let filteredCompanies = [...companies]

    // Apply compliance filters
    // filteredCompanies = applyEnhancedComplianceFilters(filteredCompanies, filters)

    // Apply region filters
    filteredCompanies = applyEnhancedRegionFilters(filteredCompanies, filters)

    // Apply financial filters
    filteredCompanies = applyEnhancedFinancialFilters(filteredCompanies, filters)

    return filteredCompanies
}

/**
 * Get filtering statistics for performance monitoring
 */
export function getFilteringStatistics(
    originalCount: number,
    filteredCount: number,
    filters: FilterCriteria
): {
    originalCount: number
    filteredCount: number
    reductionPercentage: number
    appliedFilters: string[]
    filterComplexity: 'low' | 'medium' | 'high'
} {
    const appliedFilters = Object.keys(filters).filter(key => {
        const value = filters[key as keyof FilterCriteria]
        return value !== undefined && value !== null &&
            (Array.isArray(value) ? value.length > 0 : true)
    })

    let filterComplexity: 'low' | 'medium' | 'high' = 'low'
    if (appliedFilters.length > 5) {
        filterComplexity = 'high'
    } else if (appliedFilters.length > 2) {
        filterComplexity = 'medium'
    }

    const reductionPercentage = originalCount > 0
        ? Math.round(((originalCount - filteredCount) / originalCount) * 100)
        : 0

    return {
        originalCount,
        filteredCount,
        reductionPercentage,
        appliedFilters,
        filterComplexity
    }
}

/**
 * Validate that companies have sufficient data for filtering
 */
export function validateCompaniesForFiltering(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): {
    validCompanies: PortfolioCompany[]
    invalidCompanies: PortfolioCompany[]
    validationWarnings: string[]
} {
    const validCompanies: PortfolioCompany[] = []
    const invalidCompanies: PortfolioCompany[] = []
    const validationWarnings: string[] = []

    companies.forEach(company => {
        let isValid = true
        const warnings: string[] = []

        // Check if risk_analysis data exists for compliance/region filtering
        if (!company.risk_analysis) {
            if (filters.gst_compliance_status || filters.epfo_compliance_status ||
                filters.audit_qualification_status || filters.regions || filters.cities) {
                isValid = false
                warnings.push(`Company ${company.company_name} missing risk_analysis data`)
            }
        }

        // Check for financial data if financial filters are applied
        const hasFinancialFilters = !!(
            filters.ebitda_margin_range || filters.debt_equity_range ||
            filters.current_ratio_range || filters.revenue_range || filters.net_worth_range
        )

        if (hasFinancialFilters && company.risk_analysis) {
            const financialMetrics = extractFinancialMetrics(company.risk_analysis)
            if (financialMetrics.confidence === 'low') {
                warnings.push(`Company ${company.company_name} has low confidence financial data`)
            }
        }

        if (isValid) {
            validCompanies.push(company)
        } else {
            invalidCompanies.push(company)
        }

        validationWarnings.push(...warnings)
    })

    return {
        validCompanies,
        invalidCompanies,
        validationWarnings
    }
}