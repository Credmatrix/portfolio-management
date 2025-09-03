/**
 * Portfolio Overview Analytics API Endpoint
 * 
 * Provides comprehensive portfolio summary with risk metrics including:
 * - Total companies and exposure
 * - Risk distribution across CM grades
 * - Industry and regional summaries
 * - Eligibility and compliance overviews
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PortfolioAnalyticsService } from '@/lib/services/portfolio-analytics.service';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { FilterCriteria } from '@/types/portfolio.types';
const portfolioRepository = new PortfolioRepository()

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Parse query parameters
        const limit = parseInt(searchParams.get('limit') || '1000');
        const page = parseInt(searchParams.get('page') || '1');

        // Parse filters if provided
        const filters: FilterCriteria = {};

        // Risk filters
        const riskGrades = searchParams.get('risk_grades');
        if (riskGrades) {
            filters.risk_grades = riskGrades.split(',');
        }

        const riskScoreMin = searchParams.get('risk_score_min');
        const riskScoreMax = searchParams.get('risk_score_max');
        if (riskScoreMin && riskScoreMax) {
            filters.risk_score_range = [parseInt(riskScoreMin), parseInt(riskScoreMax)];
        }

        // Industry filters
        const industries = searchParams.get('industries');
        if (industries) {
            filters.industries = industries.split(',');
        }

        // Date filters
        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        if (dateFrom && dateTo) {
            filters.date_range = [new Date(dateFrom), new Date(dateTo)];
        }

        // Get portfolio data with filters
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
                    totalCompanies: 0,
                    totalExposure: 0,
                    averageRiskScore: 0,
                    riskDistribution: {
                        cm1: 0,
                        cm2: 0,
                        cm3: 0,
                        cm4: 0,
                        cm5: 0,
                        total: 0
                    },
                    topPerformers: 0,
                    highRiskCompanies: 0
                }
            });
        }

        // Calculate comprehensive overview metrics
        const companies = portfolioData.companies;
        const completedCompanies = companies.filter(c => c.status === 'completed');

        const totalCompanies = completedCompanies.length;
        const totalExposure = completedCompanies.reduce((sum, c) => {
            const limit = c.recommended_limit;
            return sum + (typeof limit === 'number' && !isNaN(limit) ? limit : 0);
        }, 0);

        const averageRiskScore = totalCompanies > 0
            ? completedCompanies.reduce((sum, c) => {
                const score = c.risk_score;
                return sum + (typeof score === 'number' && !isNaN(score) ? score : 0);
            }, 0) / totalCompanies
            : 0;

        // Calculate risk distribution
        const riskDistribution = {
            cm1: 0,
            cm2: 0,
            cm3: 0,
            cm4: 0,
            cm5: 0,
            total: totalCompanies
        };

        completedCompanies.forEach(company => {
            const grade = company.risk_grade?.toLowerCase();
            switch (grade) {
                case 'cm1': riskDistribution.cm1++; break;
                case 'cm2': riskDistribution.cm2++; break;
                case 'cm3': riskDistribution.cm3++; break;
                case 'cm4': riskDistribution.cm4++; break;
                case 'cm5': riskDistribution.cm5++; break;
            }
        });

        const topPerformers = riskDistribution.cm1 + riskDistribution.cm2;
        const highRiskCompanies = riskDistribution.cm4 + riskDistribution.cm5;

        return NextResponse.json({
            success: true,
            data: {
                totalCompanies,
                totalExposure,
                averageRiskScore,
                riskDistribution,
                topPerformers,
                highRiskCompanies
            }
        });

    } catch (error) {
        console.error('Portfolio overview analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate portfolio overview analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { filters, company_ids } = body;
        const supabase = await createServerSupabaseClient();
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        let companies;

        if (company_ids && Array.isArray(company_ids)) {
            // Get specific companies
            const companyPromises = company_ids.map(id =>
                portfolioRepository.getCompanyByRequestId(id, user.id)
            );
            const companyResults = await Promise.all(companyPromises);
            companies = companyResults.filter(c => c !== null);
        } else {
            // Get companies with filters
            const portfolioData = await portfolioRepository.getPortfolioOverview(
                filters,
                { field: 'completed_at', direction: 'desc' },
                { page: 1, limit: 1000 },
                user.id
            );
            companies = portfolioData.companies;
        }

        if (!companies || companies.length === 0) {
            return NextResponse.json({
                error: 'No companies found matching the criteria'
            }, { status: 404 });
        }

        // Calculate overview metrics
        const overviewMetrics = PortfolioAnalyticsService.calculateOverviewMetrics(companies);

        return NextResponse.json({
            success: true,
            data: {
                overview_metrics: overviewMetrics,
                metadata: {
                    companies_analyzed: companies.length,
                    request_type: company_ids ? 'specific_companies' : 'filtered_portfolio',
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Portfolio overview analytics POST error:', error);
        return NextResponse.json({
            error: 'Failed to calculate portfolio overview analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}