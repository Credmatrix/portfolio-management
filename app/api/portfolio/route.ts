// app/api/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'
import { FilterCriteria, SortCriteria, PaginationParams } from '@/types/portfolio.types'
import {
    extractAllCompanyData,
    extractRegionFromRiskAnalysis,
    extractComplianceData,
    extractFinancialMetrics
} from '@/lib/utils/data-extractors'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const portfolioRepository = new PortfolioRepository()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const searchParams = request.nextUrl.searchParams

        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '20')

        // Build filter criteria from query parameters
        const filters: FilterCriteria = {}

        // Risk-based filters
        const riskGrades = searchParams.get('risk_grades')
        if (riskGrades) {
            filters.risk_grades = riskGrades.split(',').map(grade => grade.toUpperCase())
        }

        const riskScoreMin = searchParams.get('risk_score_min')
        const riskScoreMax = searchParams.get('risk_score_max')
        if (riskScoreMin || riskScoreMax) {
            filters.risk_score_range = [
                riskScoreMin ? parseInt(riskScoreMin) : 0,
                riskScoreMax ? parseInt(riskScoreMax) : 100
            ]
        }

        // Business filters
        const industries = searchParams.get('industries')
        if (industries) {
            filters.sectors = industries.split(',')
        }

        const sectors = searchParams.get('sectors')
        if (sectors) {
            filters.sectors = sectors.split(',')
        }

        const regions = searchParams.get('regions')
        if (regions) {
            filters.regions = regions.split(',')
        }

        // Enhanced credit rating filter
        const creditRatings = searchParams.get('credit_ratings')
        if (creditRatings) {
            filters.credit_ratings = creditRatings.split(',')
        }

        // Enhanced location search
        const locationSearch = searchParams.get('location_search')
        if (locationSearch) {
            filters.location_search = locationSearch
        }

        const limitMin = searchParams.get('limit_min')
        const limitMax = searchParams.get('limit_max')
        if (limitMin || limitMax) {
            filters.recommended_limit_range = [
                limitMin ? parseFloat(limitMin) : 0,
                limitMax ? parseFloat(limitMax) : 1000
            ]
        }

        // Processing filters
        const processingStatus = searchParams.get('processing_status')
        if (processingStatus) {
            filters.processing_status = processingStatus.split(',') as any
        }

        // Enhanced compliance filters with proper status mapping
        const gstCompliance = searchParams.get('gst_compliance')
        if (gstCompliance) {
            filters.gst_compliance_status = gstCompliance.split(',')
        }

        const epfoCompliance = searchParams.get('epfo_compliance')
        if (epfoCompliance) {
            filters.epfo_compliance_status = epfoCompliance.split(',')
        }

        const auditStatus = searchParams.get('audit_status')
        if (auditStatus) {
            const statuses = auditStatus.split(',').map(status => {
                switch (status.toLowerCase()) {
                    case 'qualified': return 'qualified'
                    case 'unqualified': return 'unqualified'
                    case 'adverse': return 'adverse'
                    case 'disclaimer': return 'disclaimer'
                    case 'unknown': return 'unknown'
                    default: return status
                }
            })
            filters.audit_qualification_status = statuses
        }

        // Financial metrics filters
        const ebitdaMin = searchParams.get('ebitda_min')
        const ebitdaMax = searchParams.get('ebitda_max')
        if (ebitdaMin || ebitdaMax) {
            filters.ebitda_margin_range = [
                ebitdaMin ? parseFloat(ebitdaMin) : -50,
                ebitdaMax ? parseFloat(ebitdaMax) : 100
            ]
        }

        const debtEquityMin = searchParams.get('debt_equity_min')
        const debtEquityMax = searchParams.get('debt_equity_max')
        if (debtEquityMin || debtEquityMax) {
            filters.debt_equity_range = [
                debtEquityMin ? parseFloat(debtEquityMin) : 0,
                debtEquityMax ? parseFloat(debtEquityMax) : 10
            ]
        }

        const currentRatioMin = searchParams.get('current_ratio_min')
        const currentRatioMax = searchParams.get('current_ratio_max')
        if (currentRatioMin || currentRatioMax) {
            filters.current_ratio_range = [
                currentRatioMin ? parseFloat(currentRatioMin) : 0,
                currentRatioMax ? parseFloat(currentRatioMax) : 10
            ]
        }

        // Date range filter
        const dateFrom = searchParams.get('date_from')
        const dateTo = searchParams.get('date_to')
        if (dateFrom || dateTo) {
            filters.date_range = [
                dateFrom ? new Date(dateFrom) : new Date('2020-01-01'),
                dateTo ? new Date(dateTo) : new Date()
            ]
        }

        // Search query
        const search = searchParams.get('search')
        if (search) {
            filters.search_query = search
        }

        // Enhanced region filtering with multiple sources
        const cities = searchParams.get('cities')
        if (cities) {
            filters.cities = cities.split(',')
        }

        // Company type filters
        const listingStatus = searchParams.get('listing_status')
        if (listingStatus) {
            filters.listing_status = listingStatus.split(',')
        }

        const companyStatus = searchParams.get('company_status')
        if (companyStatus) {
            filters.company_status = companyStatus.split(',')
        }

        // Credit assessment filters
        const eligibilityMin = searchParams.get('eligibility_min')
        const eligibilityMax = searchParams.get('eligibility_max')
        if (eligibilityMin || eligibilityMax) {
            filters.eligibility_range = [
                eligibilityMin ? parseFloat(eligibilityMin) : 0,
                eligibilityMax ? parseFloat(eligibilityMax) : 1000
            ]
        }

        // Revenue range filter
        const revenueMin = searchParams.get('revenue_min')
        const revenueMax = searchParams.get('revenue_max')
        if (revenueMin || revenueMax) {
            filters.revenue_range = [
                revenueMin ? parseFloat(revenueMin) : 0,
                revenueMax ? parseFloat(revenueMax) : 10000
            ]
        }

        // Net worth range filter
        const netWorthMin = searchParams.get('net_worth_min')
        const netWorthMax = searchParams.get('net_worth_max')
        if (netWorthMin || netWorthMax) {
            filters.net_worth_range = [
                netWorthMin ? parseFloat(netWorthMin) : 0,
                netWorthMax ? parseFloat(netWorthMax) : 10000
            ]
        }

        // Employee range filter
        const employeeMin = searchParams.get('employee_min')
        const employeeMax = searchParams.get('employee_max')
        if (employeeMin || employeeMax) {
            filters.employee_range = [
                employeeMin ? parseInt(employeeMin) : 0,
                employeeMax ? parseInt(employeeMax) : 10000
            ]
        }

        // Additional financial ratios
        const roceMin = searchParams.get('roce_min')
        const roceMax = searchParams.get('roce_max')
        if (roceMin || roceMax) {
            filters.roce_range = [
                roceMin ? parseFloat(roceMin) : -50,
                roceMax ? parseFloat(roceMax) : 100
            ]
        }

        const interestCoverageMin = searchParams.get('interest_coverage_min')
        const interestCoverageMax = searchParams.get('interest_coverage_max')
        if (interestCoverageMin || interestCoverageMax) {
            filters.interest_coverage_range = [
                interestCoverageMin ? parseFloat(interestCoverageMin) : 0,
                interestCoverageMax ? parseFloat(interestCoverageMax) : 50
            ]
        }

        // Overall grade categories filter
        const gradeCategories = searchParams.get('grade_categories')
        if (gradeCategories) {
            filters.overall_grade_categories = gradeCategories.split(',').map(cat => parseInt(cat))
        }

        // Model type filter
        const modelType = searchParams.get('model_type')
        if (modelType) {
            filters.model_type = modelType.split(',')
        }

        // Sort criteria with enhanced field mapping
        const sortField = searchParams.get('sort_field') || 'completed_at'
        const sortDirection = searchParams.get('sort_direction') || 'desc'

        // Enhanced field mapping with performance optimizations for large datasets
        const fieldMapping: Record<string, string> = {
            // Primary indexed fields (fastest sorting)
            'risk_score': 'risk_score',
            'risk_grade': 'risk_grade',
            'recommended_limit': 'recommended_limit',
            'company_name': 'company_name',
            'sector': 'sector',
            'completed_at': 'completed_at',
            'submitted_at': 'submitted_at',
            'total_parameters': 'total_parameters',
            'available_parameters': 'available_parameters',
            'gst_compliance_status': 'gst_compliance_status',
            'epfo_compliance_status': 'epfo_compliance_status',

            // JSONB fields (slower for large datasets, consider adding indexes)
            'financial_score': 'risk_analysis->financialResult->percentage',
            'business_score': 'risk_analysis->businessResult->percentage',
            'hygiene_score': 'risk_analysis->hygieneResult->percentage',
            'banking_score': 'risk_analysis->bankingResult->percentage',
            'final_eligibility': 'risk_analysis->eligibility->finalEligibility',
            'risk_multiplier': 'risk_analysis->eligibility->riskMultiplier',
            'overall_grade_category': 'risk_analysis->overallGrade->category'
        }

        const mappedSortField = fieldMapping[sortField] || sortField

        const sort: SortCriteria = {
            field: mappedSortField,
            direction: sortDirection as 'asc' | 'desc'
        }

        // Enhanced pagination with performance optimizations
        const pagination: PaginationParams = {
            page,
            limit: Math.min(limit, 200) // Cap at 200 for performance
        }

        // Validate filter parameters
        const validationErrors = validateFilterCriteria(filters)
        if (validationErrors.length > 0) {
            return NextResponse.json(
                {
                    error: 'Invalid filter parameters',
                    details: validationErrors
                },
                { status: 400 }
            )
        }

        // Use search if search query is provided, otherwise use regular portfolio overview
        let result: any
        if (search) {
            const searchResult = await portfolioRepository.searchCompanies(search, filters, pagination, user.id)
            // Transform search result to match portfolio response format
            result = {
                companies: searchResult.companies,
                total_count: searchResult.total_matches,
                page,
                limit,
                has_next: searchResult.total_matches > page * limit,
                has_previous: page > 1
            }
        } else {
            result = await portfolioRepository.getPortfolioOverview(filters, sort, pagination, user.id)
        }

        // Add filter metadata to response for debugging and optimization
        const response = {
            ...result,
            filter_metadata: {
                applied_filters: Object.keys(filters).length,
                filter_types: Object.keys(filters),
                performance_hints: generatePerformanceHints(filters)
            }
        }

        return NextResponse.json(response)

    } catch (error) {
        console.error('Portfolio API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch portfolio data' },
            { status: 500 }
        )
    }
}

/**
 * Validates filter criteria to ensure data integrity and prevent invalid queries
 */
function validateFilterCriteria(filters: FilterCriteria): string[] {
    const errors: string[] = []

    // Validate risk score range
    if (filters.risk_score_range) {
        const [min, max] = filters.risk_score_range
        if (min < 0 || min > 100 || max < 0 || max > 100) {
            errors.push('Risk score range must be between 0 and 100')
        }
        if (min > max) {
            errors.push('Risk score minimum cannot be greater than maximum')
        }
    }

    // Validate financial metric ranges
    if (filters.ebitda_margin_range) {
        const [min, max] = filters.ebitda_margin_range
        if (min < -100 || max > 200) {
            errors.push('EBITDA margin range should be between -100% and 200%')
        }
        if (min > max) {
            errors.push('EBITDA margin minimum cannot be greater than maximum')
        }
    }

    if (filters.debt_equity_range) {
        const [min, max] = filters.debt_equity_range
        if (min < 0 || max > 50) {
            errors.push('Debt-equity ratio range should be between 0 and 50')
        }
        if (min > max) {
            errors.push('Debt-equity ratio minimum cannot be greater than maximum')
        }
    }

    if (filters.current_ratio_range) {
        const [min, max] = filters.current_ratio_range
        if (min < 0 || max > 20) {
            errors.push('Current ratio range should be between 0 and 20')
        }
        if (min > max) {
            errors.push('Current ratio minimum cannot be greater than maximum')
        }
    }

    // Validate revenue and net worth ranges
    if (filters.revenue_range) {
        const [min, max] = filters.revenue_range
        if (min < 0 || max < 0) {
            errors.push('Revenue range values must be positive')
        }
        if (min > max) {
            errors.push('Revenue minimum cannot be greater than maximum')
        }
    }

    if (filters.net_worth_range) {
        const [min, max] = filters.net_worth_range
        if (min > max) {
            errors.push('Net worth minimum cannot be greater than maximum')
        }
    }

    // Validate date range
    if (filters.date_range) {
        const [startDate, endDate] = filters.date_range
        if (startDate > endDate) {
            errors.push('Start date cannot be after end date')
        }
        if (endDate > new Date()) {
            errors.push('End date cannot be in the future')
        }
    }

    // Validate employee range
    if (filters.employee_range) {
        const [min, max] = filters.employee_range
        if (min < 0 || max < 0) {
            errors.push('Employee range values must be positive')
        }
        if (min > max) {
            errors.push('Employee minimum cannot be greater than maximum')
        }
    }

    // Validate compliance status values
    const validComplianceStatuses = ['Regular', 'Generally Regular', 'Irregular', 'High Irregularity']
    if (filters.gst_compliance_status) {
        const invalidStatuses = filters.gst_compliance_status.filter(
            status => !validComplianceStatuses.includes(status)
        )
        if (invalidStatuses.length > 0) {
            errors.push(`Invalid GST compliance statuses: ${invalidStatuses.join(', ')}`)
        }
    }

    if (filters.epfo_compliance_status) {
        const invalidStatuses = filters.epfo_compliance_status.filter(
            status => !validComplianceStatuses.includes(status)
        )
        if (invalidStatuses.length > 0) {
            errors.push(`Invalid EPFO compliance statuses: ${invalidStatuses.join(', ')}`)
        }
    }

    // Validate audit qualification statuses
    const validAuditStatuses = ['qualified', 'unqualified', 'adverse', 'disclaimer', 'unknown']
    if (filters.audit_qualification_status) {
        const invalidStatuses = filters.audit_qualification_status.filter(
            status => !validAuditStatuses.includes(status)
        )
        if (invalidStatuses.length > 0) {
            errors.push(`Invalid audit qualification statuses: ${invalidStatuses.join(', ')}`)
        }
    }

    // Validate grade categories
    if (filters.overall_grade_categories) {
        const invalidCategories = filters.overall_grade_categories.filter(
            cat => cat < 1 || cat > 5 || !Number.isInteger(cat)
        )
        if (invalidCategories.length > 0) {
            errors.push('Grade categories must be integers between 1 and 5')
        }
    }

    return errors
}

/**
 * Generates performance hints based on applied filters to help optimize queries
 */
function generatePerformanceHints(filters: FilterCriteria): string[] {
    const hints: string[] = []

    // Check for potentially slow filter combinations
    const complexFilters = [
        'gst_compliance_status',
        'epfo_compliance_status',
        'audit_qualification_status',
        'ebitda_margin_range',
        'debt_equity_range',
        'current_ratio_range'
    ]

    const appliedComplexFilters = complexFilters.filter(filter => filters[filter as keyof FilterCriteria])

    if (appliedComplexFilters.length > 3) {
        hints.push('Multiple complex filters applied - consider using analytics table for better performance')
    }

    if (filters.search_query && filters.search_query.length < 3) {
        hints.push('Short search queries may return too many results - consider using more specific terms')
    }

    if (filters.regions && filters.regions.length > 10) {
        hints.push('Large number of regions selected - consider grouping by broader geographic areas')
    }

    if (filters.industries && filters.industries.length > 15) {
        hints.push('Large number of industries selected - consider using industry categories')
    }

    // Check for conflicting filters
    if (filters.risk_score_range && filters.risk_grades) {
        const [minScore, maxScore] = filters.risk_score_range
        if (maxScore - minScore < 10 && filters.risk_grades.length > 2) {
            hints.push('Narrow risk score range with multiple risk grades may return few results')
        }
    }

    return hints
}