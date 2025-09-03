/**
 * Risk Distribution Analytics API Endpoint
 * 
 * Provides detailed CM grade analysis including:
 * - Distribution across CM1-CM5 grades
 * - Risk score analysis by grade
 * - Grade-wise exposure and metrics
 * - Risk concentration analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PortfolioAnalyticsService } from '@/lib/services/portfolio-analytics.service';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { FilterCriteria } from '@/types/portfolio.types';
const portfolioRepository = new PortfolioRepository();

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
        const includeExposure = searchParams.get('include_exposure') === 'true';
        const includeScoreAnalysis = searchParams.get('include_score_analysis') === 'true';

        // Parse filters
        const filters: FilterCriteria = {};

        const industries = searchParams.get('industries');
        if (industries) {
            filters.industries = industries.split(',');
        }

        const regions = searchParams.get('regions');
        if (regions) {
            filters.regions = regions.split(',');
        }

        const dateFrom = searchParams.get('date_from');
        const dateTo = searchParams.get('date_to');
        if (dateFrom && dateTo) {
            filters.date_range = [new Date(dateFrom), new Date(dateTo)];
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
                    risk_distribution: {
                        cm1_count: 0,
                        cm2_count: 0,
                        cm3_count: 0,
                        cm4_count: 0,
                        cm5_count: 0,
                        ungraded_count: 0,
                        total_count: 0,
                        distribution_percentages: {}
                    },
                    grade_analysis: {},
                    exposure_by_grade: {},
                    risk_concentration: {
                        high_risk_percentage: 0,
                        medium_risk_percentage: 0,
                        low_risk_percentage: 0
                    },
                    metadata: {
                        total_companies_analyzed: 0,
                        generated_at: new Date().toISOString()
                    }
                }
            });
        }

        // Calculate risk distribution
        const riskDistribution = PortfolioAnalyticsService.calculateRiskDistribution(
            portfolioData.companies
        );

        // Calculate detailed grade analysis
        const gradeAnalysis = calculateGradeAnalysis(portfolioData.companies);

        // Calculate exposure by grade if requested
        let exposureByGrade = {};
        if (includeExposure) {
            exposureByGrade = calculateExposureByGrade(portfolioData.companies);
        }

        // Calculate risk concentration metrics
        const riskConcentration = calculateRiskConcentration(portfolioData.companies);

        // Calculate score analysis by grade if requested
        let scoreAnalysis = {};
        if (includeScoreAnalysis) {
            scoreAnalysis = calculateScoreAnalysisByGrade(portfolioData.companies);
        }

        return NextResponse.json({
            success: true,
            data: {
                risk_distribution: riskDistribution,
                grade_analysis: gradeAnalysis,
                exposure_by_grade: exposureByGrade,
                risk_concentration: riskConcentration,
                score_analysis: scoreAnalysis,
                metadata: {
                    total_companies_analyzed: portfolioData.companies.length,
                    total_companies_in_portfolio: portfolioData.total_count,
                    filters_applied: Object.keys(filters).length > 0,
                    include_exposure: includeExposure,
                    include_score_analysis: includeScoreAnalysis,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Risk distribution analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate risk distribution analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            filters,
            company_ids,
            include_exposure = false,
            include_score_analysis = false,
            group_by
        } = body;

        let companies;

        if (company_ids && Array.isArray(company_ids)) {
            // Get specific companies
            const companyPromises = company_ids.map(id =>
                portfolioRepository.getCompanyByRequestId(id)
            );
            const companyResults = await Promise.all(companyPromises);
            companies = companyResults.filter(c => c !== null);
        } else {
            // Get companies with filters
            const portfolioData = await portfolioRepository.getPortfolioOverview(
                filters,
                { field: 'completed_at', direction: 'desc' },
                { page: 1, limit: 1000 }
            );
            companies = portfolioData.companies;
        }

        if (!companies || companies.length === 0) {
            return NextResponse.json({
                error: 'No companies found matching the criteria'
            }, { status: 404 });
        }

        // Calculate risk distribution
        const riskDistribution = PortfolioAnalyticsService.calculateRiskDistribution(companies);
        const gradeAnalysis = calculateGradeAnalysis(companies);

        let result: any = {
            risk_distribution: riskDistribution,
            grade_analysis: gradeAnalysis,
            risk_concentration: calculateRiskConcentration(companies)
        };

        // Add optional analyses
        if (include_exposure) {
            result.exposure_by_grade = calculateExposureByGrade(companies);
        }

        if (include_score_analysis) {
            result.score_analysis = calculateScoreAnalysisByGrade(companies);
        }

        // Add grouping if requested
        if (group_by) {
            result.grouped_analysis = calculateGroupedRiskDistribution(companies, group_by);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                metadata: {
                    companies_analyzed: companies.length,
                    request_type: company_ids ? 'specific_companies' : 'filtered_portfolio',
                    include_exposure,
                    include_score_analysis,
                    group_by,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Risk distribution analytics POST error:', error);
        return NextResponse.json({
            error: 'Failed to calculate risk distribution analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper functions

function calculateGradeAnalysis(companies: any[]) {
    const gradeStats = new Map<string, {
        count: number;
        risk_scores: number[];
        exposures: number[];
        industries: string[];
    }>();

    companies.forEach(company => {
        const grade = company.risk_grade?.toUpperCase() || 'UNGRADED';

        if (!gradeStats.has(grade)) {
            gradeStats.set(grade, {
                count: 0,
                risk_scores: [],
                exposures: [],
                industries: []
            });
        }

        const stats = gradeStats.get(grade)!;
        stats.count++;

        if (company.risk_score) {
            stats.risk_scores.push(company.risk_score);
        }

        if (company.recommended_limit) {
            stats.exposures.push(company.recommended_limit);
        }

        if (company.industry) {
            stats.industries.push(company.industry);
        }
    });

    const analysis: Record<string, any> = {};

    gradeStats.forEach((stats, grade) => {
        const avgRiskScore = stats.risk_scores.length > 0
            ? stats.risk_scores.reduce((sum, score) => sum + score, 0) / stats.risk_scores.length
            : 0;

        const totalExposure = stats.exposures.reduce((sum, exp) => sum + exp, 0);
        const avgExposure = stats.exposures.length > 0 ? totalExposure / stats.exposures.length : 0;

        // Calculate industry distribution for this grade
        const industryCount = new Map<string, number>();
        stats.industries.forEach(industry => {
            industryCount.set(industry, (industryCount.get(industry) || 0) + 1);
        });

        const topIndustries = Array.from(industryCount.entries())
            .map(([industry, count]) => ({ industry, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);

        analysis[grade] = {
            count: stats.count,
            percentage: (stats.count / companies.length) * 100,
            avg_risk_score: avgRiskScore,
            risk_score_range: stats.risk_scores.length > 0
                ? [Math.min(...stats.risk_scores), Math.max(...stats.risk_scores)]
                : [0, 0],
            total_exposure: totalExposure,
            avg_exposure: avgExposure,
            top_industries: topIndustries
        };
    });

    return analysis;
}

function calculateExposureByGrade(companies: any[]) {
    const exposureByGrade: Record<string, number> = {};
    let totalExposure = 0;

    companies.forEach(company => {
        const grade = company.risk_grade?.toUpperCase() || 'UNGRADED';
        const exposure = company.recommended_limit || 0;

        exposureByGrade[grade] = (exposureByGrade[grade] || 0) + exposure;
        totalExposure += exposure;
    });

    // Convert to percentages
    const exposurePercentages: Record<string, number> = {};
    Object.entries(exposureByGrade).forEach(([grade, exposure]) => {
        exposurePercentages[grade] = totalExposure > 0 ? (exposure / totalExposure) * 100 : 0;
    });

    return {
        absolute_exposure: exposureByGrade,
        exposure_percentages: exposurePercentages,
        total_exposure: totalExposure
    };
}

function calculateRiskConcentration(companies: any[]) {
    const gradeCategories = {
        high_risk: ['CM4', 'CM5'],
        medium_risk: ['CM3'],
        low_risk: ['CM1', 'CM2']
    };

    const concentration = {
        high_risk_count: 0,
        medium_risk_count: 0,
        low_risk_count: 0,
        ungraded_count: 0
    };

    companies.forEach(company => {
        const grade = company.risk_grade?.toUpperCase();

        if (!grade) {
            concentration.ungraded_count++;
        } else if (gradeCategories.high_risk.includes(grade)) {
            concentration.high_risk_count++;
        } else if (gradeCategories.medium_risk.includes(grade)) {
            concentration.medium_risk_count++;
        } else if (gradeCategories.low_risk.includes(grade)) {
            concentration.low_risk_count++;
        } else {
            concentration.ungraded_count++;
        }
    });

    const total = companies.length;

    return {
        high_risk_percentage: total > 0 ? (concentration.high_risk_count / total) * 100 : 0,
        medium_risk_percentage: total > 0 ? (concentration.medium_risk_count / total) * 100 : 0,
        low_risk_percentage: total > 0 ? (concentration.low_risk_count / total) * 100 : 0,
        ungraded_percentage: total > 0 ? (concentration.ungraded_count / total) * 100 : 0,
        counts: concentration
    };
}

function calculateScoreAnalysisByGrade(companies: any[]) {
    const scoreAnalysis: Record<string, any> = {};

    const gradeGroups = new Map<string, number[]>();

    companies.forEach(company => {
        const grade = company.risk_grade?.toUpperCase() || 'UNGRADED';
        const score = company.risk_score;

        if (score !== null && score !== undefined) {
            if (!gradeGroups.has(grade)) {
                gradeGroups.set(grade, []);
            }
            gradeGroups.get(grade)!.push(score);
        }
    });

    gradeGroups.forEach((scores, grade) => {
        if (scores.length === 0) return;

        scores.sort((a, b) => a - b);

        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const median = scores.length % 2 === 0
            ? (scores[scores.length / 2 - 1] + scores[scores.length / 2]) / 2
            : scores[Math.floor(scores.length / 2)];

        const variance = scores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / scores.length;
        const standardDeviation = Math.sqrt(variance);

        scoreAnalysis[grade] = {
            count: scores.length,
            mean: mean,
            median: median,
            min: scores[0],
            max: scores[scores.length - 1],
            standard_deviation: standardDeviation,
            quartiles: {
                q1: scores[Math.floor(scores.length * 0.25)],
                q2: median,
                q3: scores[Math.floor(scores.length * 0.75)]
            }
        };
    });

    return scoreAnalysis;
}

function calculateGroupedRiskDistribution(companies: any[], groupBy: string) {
    const groups = new Map<string, any[]>();

    companies.forEach(company => {
        let groupKey = 'Unknown';

        switch (groupBy) {
            case 'industry':
                groupKey = company.industry || 'Unknown';
                break;
            case 'region':
                groupKey = company.extracted_data?.about_company?.registered_address?.state || 'Unknown';
                break;
            case 'processing_month':
                if (company.completed_at) {
                    const date = new Date(company.completed_at);
                    groupKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                }
                break;
        }

        if (!groups.has(groupKey)) {
            groups.set(groupKey, []);
        }
        groups.get(groupKey)!.push(company);
    });

    const groupedAnalysis: Record<string, any> = {};

    groups.forEach((groupCompanies, groupKey) => {
        const riskDistribution = PortfolioAnalyticsService.calculateRiskDistribution(groupCompanies);
        groupedAnalysis[groupKey] = {
            company_count: groupCompanies.length,
            risk_distribution: riskDistribution,
            avg_risk_score: groupCompanies.reduce((sum, c) => sum + (c.risk_score || 0), 0) / groupCompanies.length
        };
    });

    return groupedAnalysis;
}