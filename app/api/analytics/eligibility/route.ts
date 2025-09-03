/**
 * Eligibility Analytics API Endpoint
 * 
 * Provides eligibility analysis including:
 * - Credit eligibility distribution
 * - Risk-adjusted exposure calculations
 * - Eligibility by risk grade and industry
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { FilterCriteria } from '@/types/portfolio.types';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const portfolioRepository = new PortfolioRepository();

        // Parse query parameters
        const limit = parseInt(searchParams.get('limit') || '1000');
        const page = parseInt(searchParams.get('page') || '1');

        // Parse filters
        const filters: FilterCriteria = {};

        const industries = searchParams.get('industries');
        if (industries) {
            filters.industries = industries.split(',');
        }

        const riskGrades = searchParams.get('risk_grades');
        if (riskGrades) {
            filters.risk_grades = riskGrades.split(',');
        }

        // Get portfolio data
        const portfolioData = await portfolioRepository.getPortfolioOverview(
            filters,
            { field: 'completed_at', direction: 'desc' },
            { page, limit },
            user.id
        );

        if (!portfolioData.companies || portfolioData.companies.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    eligibility_matrix: {
                        total_eligible_amount: 0,
                        average_eligibility: 0,
                        eligibility_by_grade: {},
                        eligibility_by_industry: {}
                    }
                }
            });
        }

        // Calculate eligibility metrics
        const companies = portfolioData.companies;
        const companiesWithEligibility = companies.filter(c =>
            c.risk_analysis?.eligibility && c.recommended_limit
        );

        const totalEligibleAmount = companiesWithEligibility.reduce(
            (sum, c) => sum + (c.risk_analysis?.eligibility?.finalEligibility || 0), 0
        );

        const averageEligibility = companiesWithEligibility.length > 0
            ? totalEligibleAmount / companiesWithEligibility.length
            : 0;

        // Eligibility by grade
        const eligibilityByGrade: Record<string, number> = {};
        companiesWithEligibility.forEach(company => {
            const grade = company.risk_grade?.toUpperCase() || 'UNGRADED';
            const eligibility = company.risk_analysis?.eligibility?.finalEligibility || 0;
            eligibilityByGrade[grade] = (eligibilityByGrade[grade] || 0) + eligibility;
        });

        // Eligibility by industry
        const eligibilityByIndustry: Record<string, number> = {};
        companiesWithEligibility.forEach(company => {
            const aboutCompany = company?.risk_analysis?.companyData
            const registeredAddress = aboutCompany?.addresses?.business_address
            const industry = registeredAddress?.industry || company.industry;
            const eligibility = company.risk_analysis?.eligibility?.finalEligibility || 0;
            eligibilityByIndustry[industry] = (eligibilityByIndustry[industry] || 0) + eligibility;
        });

        return NextResponse.json({
            success: true,
            data: {
                eligibility_matrix: {
                    total_eligible_amount: totalEligibleAmount,
                    average_eligibility: averageEligibility,
                    eligibility_by_grade: eligibilityByGrade,
                    eligibility_by_industry: eligibilityByIndustry,
                    companies_with_eligibility: companiesWithEligibility.length,
                    total_companies: companies.length
                }
            }
        });

    } catch (error) {
        console.error('Eligibility analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate eligibility analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}