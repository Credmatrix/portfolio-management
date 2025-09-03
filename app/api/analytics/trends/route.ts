/**
 * Trends Analytics API Endpoint
 * 
 * Provides trend analysis including:
 * - Risk score trends over time
 * - Industry trends
 * - Portfolio growth trends
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
        const timeRange = searchParams.get('timeRange') || '12m';
        const selectedIndustry = searchParams.get('selectedIndustry') || 'all';
        const limit = parseInt(searchParams.get('limit') || '1000');

        // Parse filters
        const filters: FilterCriteria = {};

        if (selectedIndustry !== 'all') {
            filters.industries = [selectedIndustry];
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        
        switch (timeRange) {
            case '3m':
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case '6m':
                startDate.setMonth(endDate.getMonth() - 6);
                break;
            case '12m':
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            case '24m':
                startDate.setFullYear(endDate.getFullYear() - 2);
                break;
            default:
                startDate.setFullYear(endDate.getFullYear() - 1);
        }

        if (timeRange !== 'all') {
            filters.date_range = [startDate, endDate];
        }

        // Get portfolio data
        const portfolioData = await portfolioRepository.getPortfolioOverview(
            filters,
            { field: 'completed_at', direction: 'asc' }, // Ascending for time series
            { page: 1, limit },
            user.id
        );

        if (!portfolioData.companies || portfolioData.companies.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    trend_analysis: {
                        risk_score_trends: [],
                        portfolio_growth: [],
                        industry_trends: {},
                        monthly_summary: {}
                    }
                }
            });
        }

        // Calculate trends
        const companies = portfolioData.companies;
        const riskScoreTrends = calculateRiskScoreTrends(companies);
        const portfolioGrowth = calculatePortfolioGrowth(companies);
        const industryTrends = calculateIndustryTrends(companies);
        const monthlySummary = calculateMonthlySummary(companies);

        return NextResponse.json({
            success: true,
            data: {
                trend_analysis: {
                    risk_score_trends: riskScoreTrends,
                    portfolio_growth: portfolioGrowth,
                    industry_trends: industryTrends,
                    monthly_summary: monthlySummary,
                    time_range: timeRange,
                    selected_industry: selectedIndustry,
                    total_companies: companies.length
                }
            }
        });

    } catch (error) {
        console.error('Trends analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate trends analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function calculateRiskScoreTrends(companies: any[]) {
    const monthlyData = new Map<string, {
        scores: number[];
        count: number;
        totalExposure: number;
    }>();

    companies.forEach(company => {
        if (!company.completed_at || !company.risk_score) return;

        const date = new Date(company.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, {
                scores: [],
                count: 0,
                totalExposure: 0
            });
        }

        const monthData = monthlyData.get(monthKey)!;
        monthData.scores.push(company.risk_score);
        monthData.count++;
        monthData.totalExposure += company.recommended_limit || 0;
    });

    return Array.from(monthlyData.entries())
        .map(([month, data]) => ({
            month,
            average_risk_score: data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length,
            company_count: data.count,
            total_exposure: data.totalExposure,
            min_risk_score: Math.min(...data.scores),
            max_risk_score: Math.max(...data.scores)
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

function calculatePortfolioGrowth(companies: any[]) {
    const monthlyGrowth = new Map<string, {
        newCompanies: number;
        cumulativeCount: number;
        cumulativeExposure: number;
    }>();

    // Sort companies by completion date
    const sortedCompanies = companies
        .filter(c => c.completed_at)
        .sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    let cumulativeCount = 0;
    let cumulativeExposure = 0;

    sortedCompanies.forEach(company => {
        const date = new Date(company.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyGrowth.has(monthKey)) {
            monthlyGrowth.set(monthKey, {
                newCompanies: 0,
                cumulativeCount: 0,
                cumulativeExposure: 0
            });
        }

        const monthData = monthlyGrowth.get(monthKey)!;
        monthData.newCompanies++;
        cumulativeCount++;
        cumulativeExposure += company.recommended_limit || 0;
        monthData.cumulativeCount = cumulativeCount;
        monthData.cumulativeExposure = cumulativeExposure;
    });

    return Array.from(monthlyGrowth.entries())
        .map(([month, data]) => ({
            month,
            new_companies: data.newCompanies,
            cumulative_companies: data.cumulativeCount,
            cumulative_exposure: data.cumulativeExposure
        }))
        .sort((a, b) => a.month.localeCompare(b.month));
}

function calculateIndustryTrends(companies: any[]) {
    const industryMonthlyData = new Map<string, Map<string, {
        count: number;
        scores: number[];
        exposure: number;
    }>>();

    companies.forEach(company => {
        if (!company.completed_at || !company.industry) return;

        const date = new Date(company.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        const industry = company.industry;

        if (!industryMonthlyData.has(industry)) {
            industryMonthlyData.set(industry, new Map());
        }

        if (!industryMonthlyData.get(industry)!.has(monthKey)) {
            industryMonthlyData.get(industry)!.set(monthKey, {
                count: 0,
                scores: [],
                exposure: 0
            });
        }

        const monthData = industryMonthlyData.get(industry)!.get(monthKey)!;
        monthData.count++;
        if (company.risk_score) {
            monthData.scores.push(company.risk_score);
        }
        monthData.exposure += company.recommended_limit || 0;
    });

    const industryTrends: Record<string, any[]> = {};

    industryMonthlyData.forEach((monthlyData, industry) => {
        industryTrends[industry] = Array.from(monthlyData.entries())
            .map(([month, data]) => ({
                month,
                company_count: data.count,
                average_risk_score: data.scores.length > 0
                    ? data.scores.reduce((sum, score) => sum + score, 0) / data.scores.length
                    : 0,
                total_exposure: data.exposure
            }))
            .sort((a, b) => a.month.localeCompare(b.month));
    });

    return industryTrends;
}

function calculateMonthlySummary(companies: any[]) {
    const monthlyStats = new Map<string, {
        companies: any[];
        riskGrades: Record<string, number>;
        industries: Record<string, number>;
    }>();

    companies.forEach(company => {
        if (!company.completed_at) return;

        const date = new Date(company.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyStats.has(monthKey)) {
            monthlyStats.set(monthKey, {
                companies: [],
                riskGrades: {},
                industries: {}
            });
        }

        const monthData = monthlyStats.get(monthKey)!;
        monthData.companies.push(company);

        // Count risk grades
        const grade = company.risk_grade?.toUpperCase() || 'UNGRADED';
        monthData.riskGrades[grade] = (monthData.riskGrades[grade] || 0) + 1;

        // Count industries
        const industry = company.industry || 'Unknown';
        monthData.industries[industry] = (monthData.industries[industry] || 0) + 1;
    });

    return Array.from(monthlyStats.entries())
        .map(([month, data]) => {
            const totalCompanies = data.companies.length;
            const totalExposure = data.companies.reduce((sum, c) => sum + (c.recommended_limit || 0), 0);
            const avgRiskScore = data.companies
                .filter(c => c.risk_score)
                .reduce((sum, c) => sum + c.risk_score, 0) / Math.max(data.companies.filter(c => c.risk_score).length, 1);

            return {
                month,
                total_companies: totalCompanies,
                total_exposure: totalExposure,
                average_risk_score: avgRiskScore,
                risk_grade_distribution: data.riskGrades,
                industry_distribution: data.industries,
                high_risk_companies: (data.riskGrades['CM4'] || 0) + (data.riskGrades['CM5'] || 0),
                top_performers: (data.riskGrades['CM1'] || 0) + (data.riskGrades['CM2'] || 0)
            };
        })
        .sort((a, b) => a.month.localeCompare(b.month));
}