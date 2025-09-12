/**
 * Industry Breakdown Analytics API Endpoint
 * 
 * Provides comprehensive industry analysis with risk overlay including:
 * - Industry-wise company distribution
 * - Risk metrics by industry sector
 * - Industry benchmarking and comparison
 * - Sector concentration analysis
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PortfolioAnalyticsService } from '@/lib/services/portfolio-analytics.service';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { FilterCriteria, ProcessingStatus } from '@/types/portfolio.types';

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
        const includeRiskOverlay = searchParams.get('include_risk_overlay') !== 'false';
        const includeBenchmarks = searchParams.get('include_benchmarks') === 'true';
        const minCompanyCount = parseInt(searchParams.get('min_company_count') || '1');
        const sortBy = searchParams.get('sort_by') || 'company_count'; // 'company_count', 'avg_risk_score', 'total_exposure'

        // Parse comprehensive filters
        const filters: FilterCriteria = {};

        // Risk-based filters
        const riskGrades = searchParams.get('risk_grades');
        if (riskGrades) {
            filters.risk_grades = riskGrades.split(',');
        }

        const riskScoreRange = searchParams.get('risk_score_range');
        if (riskScoreRange) {
            const [min, max] = riskScoreRange.split(',').map(Number);
            filters.risk_score_range = [min, max];
        }

        // Geographic filters
        const regions = searchParams.get('regions');
        if (regions) {
            filters.regions = regions.split(',');
        }

        const cities = searchParams.get('cities');
        if (cities) {
            filters.cities = cities.split(',');
        }

        // Industry filters
        const specificIndustries = searchParams.get('industries');
        if (specificIndustries) {
            filters.industries = specificIndustries.split(',');
        }

        // Compliance filters
        const gstCompliance = searchParams.get('gst_compliance_status');
        if (gstCompliance) {
            filters.gst_compliance_status = gstCompliance.split(',');
        }

        const epfoCompliance = searchParams.get('epfo_compliance_status');
        if (epfoCompliance) {
            filters.epfo_compliance_status = epfoCompliance.split(',');
        }

        const auditStatus = searchParams.get('audit_qualification_status');
        if (auditStatus) {
            filters.audit_qualification_status = auditStatus.split(',');
        }

        // Financial filters
        const revenueRange = searchParams.get('revenue_range');
        if (revenueRange) {
            const [min, max] = revenueRange.split(',').map(Number);
            filters.revenue_range = [min, max];
        }

        const ebitdaMarginRange = searchParams.get('ebitda_margin_range');
        if (ebitdaMarginRange) {
            const [min, max] = ebitdaMarginRange.split(',').map(Number);
            filters.ebitda_margin_range = [min, max];
        }

        const debtEquityRange = searchParams.get('debt_equity_range');
        if (debtEquityRange) {
            const [min, max] = debtEquityRange.split(',').map(Number);
            filters.debt_equity_range = [min, max];
        }

        // Credit assessment filters
        const recommendedLimitRange = searchParams.get('recommended_limit_range');
        if (recommendedLimitRange) {
            const [min, max] = recommendedLimitRange.split(',').map(Number);
            filters.recommended_limit_range = [min, max];
        }

        // Processing filters
        const processingStatus = searchParams.get('processing_status');
        if (processingStatus) {
            filters.processing_status = processingStatus.split(',') as ProcessingStatus[];
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
                    industry_breakdown: { industries: [] },
                    industry_summary: {
                        total_industries: 0,
                        top_industries_by_count: [],
                        top_industries_by_exposure: [],
                        industry_concentration: {
                            herfindahl_index: 0,
                            top_5_concentration: 0
                        }
                    },
                    metadata: {
                        total_companies_analyzed: 0,
                        generated_at: new Date().toISOString()
                    }
                }
            });
        }

        // Calculate industry breakdown
        const industryBreakdown = PortfolioAnalyticsService.calculateIndustryBreakdown(
            portfolioData.companies
        );

        // Filter industries by minimum company count
        const filteredIndustries = industryBreakdown.industries.filter(
            industry => industry.count >= minCompanyCount
        );

        // Sort industries based on sortBy parameter
        filteredIndustries.sort((a, b) => {
            switch (sortBy) {
                case 'avg_risk_score':
                    return b.average_risk_score - a.average_risk_score;
                case 'total_exposure':
                    return b.total_exposure - a.total_exposure;
                case 'company_count':
                default:
                    return b.count - a.count;
            }
        });

        // Calculate industry summary metrics
        const industrySummary = calculateIndustrySummary(filteredIndustries, portfolioData.companies);

        // Add risk overlay analysis if requested
        let riskOverlayAnalysis = {};
        if (includeRiskOverlay) {
            riskOverlayAnalysis = calculateRiskOverlayAnalysis(portfolioData.companies);
        }

        // Add industry benchmarks if requested
        let industryBenchmarks = {};
        if (includeBenchmarks) {
            industryBenchmarks = await calculateIndustryBenchmarks(filteredIndustries, filters);
        }

        return NextResponse.json({
            success: true,
            data: {
                industry_breakdown: {
                    industries: filteredIndustries
                },
                industry_summary: industrySummary,
                risk_overlay_analysis: riskOverlayAnalysis,
                industry_benchmarks: industryBenchmarks,
                metadata: {
                    total_companies_analyzed: portfolioData.companies.length,
                    total_companies_in_portfolio: portfolioData.total_count,
                    industries_analyzed: filteredIndustries.length,
                    min_company_count: minCompanyCount,
                    sort_by: sortBy,
                    include_risk_overlay: includeRiskOverlay,
                    include_benchmarks: includeBenchmarks,
                    filters_applied: Object.keys(filters).length > 0,
                    applied_filters: {
                        risk_grades: filters.risk_grades?.length || 0,
                        risk_score_range: filters.risk_score_range ? 1 : 0,
                        regions: filters.regions?.length || 0,
                        cities: filters.cities?.length || 0,
                        industries: filters.industries?.length || 0,
                        gst_compliance: filters.gst_compliance_status?.length || 0,
                        epfo_compliance: filters.epfo_compliance_status?.length || 0,
                        audit_status: filters.audit_qualification_status?.length || 0,
                        financial_filters: [
                            filters.revenue_range,
                            filters.ebitda_margin_range,
                            filters.debt_equity_range,
                            filters.recommended_limit_range
                        ].filter(Boolean).length,
                        date_range: filters.date_range ? 1 : 0,
                        processing_status: filters.processing_status?.length || 0
                    },
                    filter_impact: {
                        companies_filtered_out: portfolioData.total_count - portfolioData.companies.length,
                        filter_efficiency: portfolioData.total_count > 0
                            ? ((portfolioData.companies.length / portfolioData.total_count) * 100).toFixed(2) + '%'
                            : '100%'
                    },
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Industry breakdown analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate industry breakdown analytics',
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
            include_risk_overlay = true,
            include_benchmarks = false,
            include_peer_comparison = false,
            group_by_risk_grade = false,
            calculate_correlations = false
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

        // Calculate industry breakdown
        const industryBreakdown = PortfolioAnalyticsService.calculateIndustryBreakdown(companies);
        const industrySummary = calculateIndustrySummary(industryBreakdown.industries, companies);

        let result: any = {
            industry_breakdown: industryBreakdown,
            industry_summary: industrySummary
        };

        // Add optional analyses
        if (include_risk_overlay) {
            result.risk_overlay_analysis = calculateRiskOverlayAnalysis(companies);
        }

        if (include_benchmarks) {
            result.industry_benchmarks = await calculateIndustryBenchmarks(industryBreakdown.industries, filters);
        }

        if (include_peer_comparison) {
            result.peer_comparison = calculateIndustryPeerComparison(companies);
        }

        if (group_by_risk_grade) {
            result.risk_grade_grouping = calculateIndustryByRiskGrade(companies);
        }

        if (calculate_correlations) {
            result.industry_correlations = calculateIndustryCorrelations(companies);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                metadata: {
                    companies_analyzed: companies.length,
                    industries_found: industryBreakdown.industries.length,
                    request_type: company_ids ? 'specific_companies' : 'filtered_portfolio',
                    include_risk_overlay,
                    include_benchmarks,
                    include_peer_comparison,
                    group_by_risk_grade,
                    calculate_correlations,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Industry breakdown analytics POST error:', error);
        return NextResponse.json({
            error: 'Failed to calculate industry breakdown analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper functions

function calculateIndustrySummary(industries: any[], allCompanies: any[]) {
    const totalIndustries = industries.length;
    const totalCompanies = allCompanies.length;
    const totalExposure = allCompanies.reduce((sum, c) => sum + (c.recommended_limit || 0), 0);

    // Top industries by company count
    const topIndustriesByCount = [...industries]
        .sort((a, b) => b.count - a.count)
        .slice(0, 10)
        .map(industry => ({
            name: industry.name,
            count: industry.count,
            percentage: (industry.count / totalCompanies) * 100,
            avg_risk_score: industry.average_risk_score
        }));

    // Top industries by exposure
    const topIndustriesByExposure = [...industries]
        .sort((a, b) => b.total_exposure - a.total_exposure)
        .slice(0, 10)
        .map(industry => ({
            name: industry.name,
            total_exposure: industry.total_exposure,
            percentage: totalExposure > 0 ? (industry.total_exposure / totalExposure) * 100 : 0,
            avg_risk_score: industry.average_risk_score
        }));

    // Calculate industry concentration
    const industryConcentration = calculateIndustryConcentration(industries, totalCompanies, totalExposure);

    return {
        total_industries: totalIndustries,
        top_industries_by_count: topIndustriesByCount,
        top_industries_by_exposure: topIndustriesByExposure,
        industry_concentration: industryConcentration,
        diversity_metrics: {
            companies_per_industry: totalCompanies / Math.max(totalIndustries, 1),
            largest_industry_percentage: topIndustriesByCount.length > 0 ? topIndustriesByCount[0].percentage : 0,
            top_5_industries_percentage: topIndustriesByCount.slice(0, 5).reduce((sum, ind) => sum + ind.percentage, 0)
        }
    };
}

function calculateIndustryConcentration(industries: any[], totalCompanies: number, totalExposure: number) {
    // Calculate Herfindahl-Hirschman Index for industry concentration
    const herfindahlIndex = industries.reduce((sum, industry) => {
        const marketShare = industry.count / totalCompanies;
        return sum + (marketShare * marketShare * 10000); // Multiply by 10000 for standard HHI
    }, 0);

    // Calculate top 5 concentration
    const top5Industries = [...industries]
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    const top5Concentration = top5Industries.reduce((sum, industry) => {
        return sum + (industry.count / totalCompanies) * 100;
    }, 0);

    // Calculate exposure concentration
    const exposureHHI = industries.reduce((sum, industry) => {
        const exposureShare = totalExposure > 0 ? industry.total_exposure / totalExposure : 0;
        return sum + (exposureShare * exposureShare * 10000);
    }, 0);

    return {
        herfindahl_index: herfindahlIndex,
        top_5_concentration: top5Concentration,
        exposure_hhi: exposureHHI,
        concentration_level: getConcentrationLevel(herfindahlIndex)
    };
}

function getConcentrationLevel(hhi: number): string {
    if (hhi < 1500) return 'Low Concentration';
    if (hhi < 2500) return 'Moderate Concentration';
    return 'High Concentration';
}

function calculateRiskOverlayAnalysis(companies: any[]) {
    const industryRiskMap = new Map<string, {
        companies: any[];
        riskScores: number[];
        riskGrades: string[];
        exposures: number[];
    }>();

    companies.forEach(company => {
        const industry = company.industry || 'Unknown';

        if (!industryRiskMap.has(industry)) {
            industryRiskMap.set(industry, {
                companies: [],
                riskScores: [],
                riskGrades: [],
                exposures: []
            });
        }

        const industryData = industryRiskMap.get(industry)!;
        industryData.companies.push(company);

        if (company.risk_score) {
            industryData.riskScores.push(company.risk_score);
        }

        if (company.risk_grade) {
            industryData.riskGrades.push(company.risk_grade);
        }

        if (company.recommended_limit) {
            industryData.exposures.push(company.recommended_limit);
        }
    });

    const riskOverlay: Record<string, any> = {};

    industryRiskMap.forEach((data, industry) => {
        // Calculate risk grade distribution
        const gradeDistribution = data.riskGrades.reduce((acc, grade) => {
            const normalizedGrade = grade.toUpperCase();
            acc[normalizedGrade] = (acc[normalizedGrade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Calculate risk metrics
        const avgRiskScore = data.riskScores.length > 0
            ? data.riskScores.reduce((sum, score) => sum + score, 0) / data.riskScores.length
            : 0;

        const riskScoreRange = data.riskScores.length > 0
            ? [Math.min(...data.riskScores), Math.max(...data.riskScores)]
            : [0, 0];

        // Calculate exposure-weighted risk
        const totalExposure = data.exposures.reduce((sum, exp) => sum + exp, 0);
        const exposureWeightedRisk = data.companies.reduce((sum, company) => {
            const exposure = company.recommended_limit || 0;
            const riskScore = company.risk_score || 0;
            return sum + (exposure * riskScore);
        }, 0) / Math.max(totalExposure, 1);

        // Risk concentration by grade
        const highRiskCount = data.riskGrades.filter(grade =>
            ['CM4', 'CM5'].includes(grade.toUpperCase())
        ).length;

        const highRiskPercentage = data.companies.length > 0
            ? (highRiskCount / data.companies.length) * 100
            : 0;

        riskOverlay[industry] = {
            company_count: data.companies.length,
            avg_risk_score: avgRiskScore,
            risk_score_range: riskScoreRange,
            grade_distribution: gradeDistribution,
            exposure_weighted_risk: exposureWeightedRisk,
            high_risk_percentage: highRiskPercentage,
            risk_volatility: calculateRiskVolatility(data.riskScores),
            total_exposure: totalExposure
        };
    });

    return riskOverlay;
}

function calculateRiskVolatility(riskScores: number[]): number {
    if (riskScores.length < 2) return 0;

    const mean = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    const variance = riskScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / riskScores.length;

    return Math.sqrt(variance);
}

async function calculateIndustryBenchmarks(industries: any[], appliedFilters?: FilterCriteria) {
    const benchmarks: Record<string, any> = {};

    // For each industry, calculate benchmarks
    industries.forEach(industry => {
        benchmarks[industry.name] = {
            company_count: industry.count,
            avg_risk_score: industry.average_risk_score,
            total_exposure: industry.total_exposure,
            avg_exposure_per_company: industry.count > 0 ? industry.total_exposure / industry.count : 0,
            risk_grade_distribution: industry.risk_distribution,

            // Benchmark categories
            performance_category: getIndustryPerformanceCategory(industry.average_risk_score),
            exposure_category: getExposureCategory(industry.total_exposure),
            risk_profile: getRiskProfile(industry.average_risk_score),

            // Filter-aware benchmarking
            filter_context: {
                is_filtered_dataset: appliedFilters && Object.keys(appliedFilters).length > 0,
                applied_filters: appliedFilters ? Object.keys(appliedFilters).filter(key =>
                    appliedFilters[key as keyof FilterCriteria] !== undefined
                ) : [],
                benchmark_reliability: industry.count >= 10 ? 'High' : industry.count >= 5 ? 'Medium' : 'Low'
            },

            // Relative performance within filtered context
            market_position: calculateMarketPosition(industry, industries),
            concentration_metrics: {
                market_share_in_filtered_set: industries.length > 0
                    ? ((industry.count / industries.reduce((sum, ind) => sum + ind.count, 0)) * 100).toFixed(2) + '%'
                    : '0%',
                exposure_share_in_filtered_set: industries.length > 0
                    ? ((industry.total_exposure / industries.reduce((sum, ind) => sum + ind.total_exposure, 0)) * 100).toFixed(2) + '%'
                    : '0%'
            }
        };
    });

    return benchmarks;
}

function getIndustryPerformanceCategory(avgRiskScore: number): string {
    if (avgRiskScore >= 80) return 'Excellent';
    if (avgRiskScore >= 70) return 'Good';
    if (avgRiskScore >= 60) return 'Average';
    if (avgRiskScore >= 40) return 'Below Average';
    return 'Poor';
}

function getExposureCategory(totalExposure: number): string {
    if (totalExposure >= 100000000) return 'High Exposure'; // 10 Cr+
    if (totalExposure >= 50000000) return 'Medium-High Exposure'; // 5-10 Cr
    if (totalExposure >= 10000000) return 'Medium Exposure'; // 1-5 Cr
    if (totalExposure >= 1000000) return 'Low-Medium Exposure'; // 10L-1Cr
    return 'Low Exposure';
}

function getRiskProfile(avgRiskScore: number): string {
    if (avgRiskScore >= 75) return 'Low Risk';
    if (avgRiskScore >= 60) return 'Medium Risk';
    if (avgRiskScore >= 45) return 'High Risk';
    return 'Very High Risk';
}

function calculateMarketPosition(industry: any, allIndustries: any[]): string {
    const totalCompanies = allIndustries.reduce((sum, ind) => sum + ind.count, 0);
    const totalExposure = allIndustries.reduce((sum, ind) => sum + ind.total_exposure, 0);

    const companyShare = totalCompanies > 0 ? (industry.count / totalCompanies) * 100 : 0;
    const exposureShare = totalExposure > 0 ? (industry.total_exposure / totalExposure) * 100 : 0;

    // Calculate position based on both company count and exposure
    const avgShare = (companyShare + exposureShare) / 2;

    if (avgShare >= 20) return 'Dominant';
    if (avgShare >= 10) return 'Major Player';
    if (avgShare >= 5) return 'Significant';
    if (avgShare >= 2) return 'Moderate';
    return 'Minor';
}

function calculateIndustryPeerComparison(companies: any[]) {
    const industryGroups = new Map<string, any[]>();

    companies.forEach(company => {
        const industry = company.industry || 'Unknown';
        if (!industryGroups.has(industry)) {
            industryGroups.set(industry, []);
        }
        industryGroups.get(industry)!.push(company);
    });

    const peerComparison: Record<string, any> = {};

    industryGroups.forEach((industryCompanies, industry) => {
        if (industryCompanies.length < 2) return; // Need at least 2 companies for comparison

        const riskScores = industryCompanies
            .map(c => c.risk_score)
            .filter((score): score is number => score !== null);

        const exposures = industryCompanies
            .map(c => c.recommended_limit)
            .filter((exp): exp is number => exp !== null);

        if (riskScores.length === 0) return;

        const sortedRiskScores = [...riskScores].sort((a, b) => a - b);
        const sortedExposures = [...exposures].sort((a, b) => a - b);

        peerComparison[industry] = {
            company_count: industryCompanies.length,
            risk_score_percentiles: {
                p25: sortedRiskScores[Math.floor(sortedRiskScores.length * 0.25)],
                p50: sortedRiskScores[Math.floor(sortedRiskScores.length * 0.5)],
                p75: sortedRiskScores[Math.floor(sortedRiskScores.length * 0.75)],
                p90: sortedRiskScores[Math.floor(sortedRiskScores.length * 0.9)]
            },
            exposure_percentiles: sortedExposures.length > 0 ? {
                p25: sortedExposures[Math.floor(sortedExposures.length * 0.25)],
                p50: sortedExposures[Math.floor(sortedExposures.length * 0.5)],
                p75: sortedExposures[Math.floor(sortedExposures.length * 0.75)],
                p90: sortedExposures[Math.floor(sortedExposures.length * 0.9)]
            } : null,
            top_performers: industryCompanies
                .filter(c => c.risk_score)
                .sort((a, b) => b.risk_score - a.risk_score)
                .slice(0, 3)
                .map(c => ({
                    company_name: c.company_name,
                    risk_score: c.risk_score,
                    risk_grade: c.risk_grade
                })),
            bottom_performers: industryCompanies
                .filter(c => c.risk_score)
                .sort((a, b) => a.risk_score - b.risk_score)
                .slice(0, 3)
                .map(c => ({
                    company_name: c.company_name,
                    risk_score: c.risk_score,
                    risk_grade: c.risk_grade
                }))
        };
    });

    return peerComparison;
}

function calculateIndustryByRiskGrade(companies: any[]) {
    const riskGradeGroups = new Map<string, Map<string, any[]>>();

    companies.forEach(company => {
        const industry = company.industry || 'Unknown';
        const riskGrade = company.risk_grade?.toUpperCase() || 'UNGRADED';

        if (!riskGradeGroups.has(riskGrade)) {
            riskGradeGroups.set(riskGrade, new Map());
        }

        if (!riskGradeGroups.get(riskGrade)!.has(industry)) {
            riskGradeGroups.get(riskGrade)!.set(industry, []);
        }

        riskGradeGroups.get(riskGrade)!.get(industry)!.push(company);
    });

    const groupedAnalysis: Record<string, any> = {};

    riskGradeGroups.forEach((industryMap, riskGrade) => {
        const industries: Record<string, any> = {};

        industryMap.forEach((industryCompanies, industry) => {
            const totalExposure = industryCompanies.reduce((sum, c) => sum + (c.recommended_limit || 0), 0);
            const avgRiskScore = industryCompanies.reduce((sum, c) => sum + (c.risk_score || 0), 0) / industryCompanies.length;

            industries[industry] = {
                company_count: industryCompanies.length,
                total_exposure: totalExposure,
                avg_risk_score: avgRiskScore,
                percentage_of_grade: 0 // Will be calculated after all industries are processed
            };
        });

        const totalCompaniesInGrade = Array.from(industryMap.values())
            .reduce((sum, companies) => sum + companies.length, 0);

        // Calculate percentages
        Object.keys(industries).forEach(industry => {
            industries[industry].percentage_of_grade =
                (industries[industry].company_count / totalCompaniesInGrade) * 100;
        });

        groupedAnalysis[riskGrade] = {
            total_companies: totalCompaniesInGrade,
            industries: industries,
            top_industries: Object.entries(industries)
                .sort(([, a], [, b]) => (b as any).company_count - (a as any).company_count)
                .slice(0, 5)
                .map(([name, data]) => ({ name, ...(data as any) }))
        };
    });

    return groupedAnalysis;
}

function calculateIndustryCorrelations(companies: any[]) {
    // Calculate correlations between industry presence and various risk metrics
    const industryList = [...new Set(companies.map(c => c.industry || 'Unknown'))];
    const correlations: Record<string, any> = {};

    industryList.forEach(industry => {
        const industryCompanies = companies.filter(c => (c.industry || 'Unknown') === industry);
        const nonIndustryCompanies = companies.filter(c => (c.industry || 'Unknown') !== industry);

        if (industryCompanies.length < 5 || nonIndustryCompanies.length < 5) return;

        const industryRiskScores = industryCompanies.map(c => c.risk_score).filter(s => s !== null);
        const nonIndustryRiskScores = nonIndustryCompanies.map(c => c.risk_score).filter(s => s !== null);

        if (industryRiskScores.length === 0 || nonIndustryRiskScores.length === 0) return;

        const industryAvgRisk = industryRiskScores.reduce((sum, score) => sum + score, 0) / industryRiskScores.length;
        const nonIndustryAvgRisk = nonIndustryRiskScores.reduce((sum, score) => sum + score, 0) / nonIndustryRiskScores.length;

        correlations[industry] = {
            company_count: industryCompanies.length,
            avg_risk_score: industryAvgRisk,
            market_avg_risk_score: nonIndustryAvgRisk,
            risk_differential: industryAvgRisk - nonIndustryAvgRisk,
            relative_performance: industryAvgRisk > nonIndustryAvgRisk ? 'Above Market' : 'Below Market',
            statistical_significance: Math.abs(industryAvgRisk - nonIndustryAvgRisk) > 5 ? 'Significant' : 'Not Significant'
        };
    });

    return correlations;
}