// app/api/portfolio/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'
import { FilterCriteria, SortCriteria, PaginationParams } from '@/types/portfolio.types'

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
            filters.risk_grades = riskGrades.split(',')
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
            filters.industries = industries.split(',')
        }

        const regions = searchParams.get('regions')
        if (regions) {
            filters.regions = regions.split(',')
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

        // Compliance filters
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
            filters.audit_qualification_status = auditStatus.split(',')
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
            'industry': 'industry',
            'completed_at': 'completed_at',
            'submitted_at': 'submitted_at',
            'total_parameters': 'total_parameters',
            'available_parameters': 'available_parameters',

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

        // Use search if search query is provided, otherwise use regular portfolio overview
        let result
        if (search) {
            result = await portfolioRepository.searchCompanies(search, filters, pagination, user.id)
            // Transform search result to match portfolio response format
            result = {
                companies: result.companies,
                total_count: result.total_matches,
                page,
                limit,
                has_next: result.total_matches > page * limit,
                has_previous: page > 1
            }
        } else {
            result = await portfolioRepository.getPortfolioOverview(filters, sort, pagination, user.id)
        }

        return NextResponse.json(result)

    } catch (error) {
        console.error('Portfolio API error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch portfolio data' },
            { status: 500 }
        )
    }
}