/**
 * Risk Parameters Analytics API Endpoint
 * 
 * Provides detailed parameter scoring analysis including:
 * - Category-wise performance (Financial, Business, Hygiene, Banking)
 * - Parameter benchmarks and thresholds
 * - Performance distribution across parameters
 * - Parameter importance and availability analysis
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
        const category = searchParams.get('category'); // 'Financial', 'Business', 'Hygiene', 'Banking'
        const includeDetails = searchParams.get('include_details') === 'true';
        const minParameterCount = parseInt(searchParams.get('min_parameter_count') || '0');

        // Parse filters
        const filters: FilterCriteria = {};

        const riskGrades = searchParams.get('risk_grades');
        if (riskGrades) {
            filters.risk_grades = riskGrades.split(',');
        }

        const industries = searchParams.get('industries');
        if (industries) {
            filters.industries = industries.split(',');
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
                    parameter_analysis: {
                        category_performance: {},
                        parameter_benchmarks: []
                    },
                    parameter_availability: {
                        financial: 0,
                        business: 0,
                        hygiene: 0,
                        banking: 0,
                        overall: 0
                    },
                    metadata: {
                        total_companies_analyzed: 0,
                        generated_at: new Date().toISOString()
                    }
                }
            });
        }

        // Filter companies with sufficient parameter data
        const companiesWithSufficientData = portfolioData.companies.filter(company => {
            const totalParams = company.total_parameters || 0;
            const availableParams = company.available_parameters || 0;
            return totalParams >= minParameterCount && availableParams > 0;
        });

        if (companiesWithSufficientData.length === 0) {
            return NextResponse.json({
                error: 'No companies found with sufficient parameter data'
            }, { status: 404 });
        }

        // Calculate risk parameter analysis
        const parameterAnalysis = PortfolioAnalyticsService.calculateRiskParameterAnalysis(
            companiesWithSufficientData
        );

        // Calculate parameter availability
        const parameterAvailability = calculateParameterAvailability(companiesWithSufficientData);

        // Filter by category if specified
        let filteredAnalysis = parameterAnalysis;
        if (category) {
            filteredAnalysis = {
                category_performance: category in parameterAnalysis.category_performance
                    ? { [category]: parameterAnalysis.category_performance[category] }
                    : {},
                parameter_benchmarks: parameterAnalysis.parameter_benchmarks.filter(
                    p => p.category === category
                )
            };
        }

        // Add detailed parameter analysis if requested
        let detailedAnalysis = {};
        if (includeDetails) {
            detailedAnalysis = calculateDetailedParameterAnalysis(
                companiesWithSufficientData,
                category
            );
        }

        return NextResponse.json({
            success: true,
            data: {
                parameter_analysis: filteredAnalysis,
                parameter_availability: parameterAvailability,
                detailed_analysis: detailedAnalysis,
                metadata: {
                    total_companies_analyzed: companiesWithSufficientData.length,
                    total_companies_in_portfolio: portfolioData.total_count,
                    category_filter: category,
                    min_parameter_count: minParameterCount,
                    include_details: includeDetails,
                    filters_applied: Object.keys(filters).length > 0,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Risk parameters analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate risk parameters analytics',
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
            categories = ['Financial', 'Business', 'Hygiene', 'Banking'],
            include_parameter_details = false,
            include_correlation_analysis = false,
            benchmark_comparison = false
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

        // Filter companies with risk analysis
        const companiesWithAnalysis = companies.filter(c => c.risk_analysis);

        if (companiesWithAnalysis.length === 0) {
            return NextResponse.json({
                error: 'No companies found with risk analysis data'
            }, { status: 404 });
        }

        // Calculate parameter analysis
        const parameterAnalysis = PortfolioAnalyticsService.calculateRiskParameterAnalysis(
            companiesWithAnalysis
        );

        // Filter by requested categories
        const filteredCategoryPerformance: Record<string, any> = {};
        categories.forEach(category => {
            if (category in parameterAnalysis.category_performance) {
                filteredCategoryPerformance[category] = parameterAnalysis.category_performance[category];
            }
        });

        const filteredParameterBenchmarks = parameterAnalysis.parameter_benchmarks.filter(
            p => categories.includes(p.category)
        );

        let result: any = {
            parameter_analysis: {
                category_performance: filteredCategoryPerformance,
                parameter_benchmarks: filteredParameterBenchmarks
            },
            parameter_availability: calculateParameterAvailability(companiesWithAnalysis)
        };

        // Add optional analyses
        // if (include_parameter_details) {
        //     result.parameter_details = calculateParameterDetails(companiesWithAnalysis, categories);
        // }

        if (include_correlation_analysis) {
            result.correlation_analysis = calculateParameterCorrelations(companiesWithAnalysis);
        }

        if (benchmark_comparison) {
            result.benchmark_comparison = calculateBenchmarkComparison(companiesWithAnalysis);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                metadata: {
                    companies_analyzed: companiesWithAnalysis.length,
                    categories_analyzed: categories,
                    request_type: company_ids ? 'specific_companies' : 'filtered_portfolio',
                    include_parameter_details,
                    include_correlation_analysis,
                    benchmark_comparison,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Risk parameters analytics POST error:', error);
        return NextResponse.json({
            error: 'Failed to calculate risk parameters analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper functions

function calculateParameterAvailability(companies: any[]) {
    const totals = {
        financial: 0,
        business: 0,
        hygiene: 0,
        banking: 0,
        overall: 0
    };

    const available = {
        financial: 0,
        business: 0,
        hygiene: 0,
        banking: 0,
        overall: 0
    };

    companies.forEach(company => {
        totals.financial += company.financial_parameters || 0;
        totals.business += company.business_parameters || 0;
        totals.hygiene += company.hygiene_parameters || 0;
        totals.banking += company.banking_parameters || 0;
        totals.overall += company.total_parameters || 0;

        // Calculate available parameters by category
        const financialScores = company.risk_analysis?.financialScores || [];
        const businessScores = company.risk_analysis?.businessScores || [];
        const hygieneScores = company.risk_analysis?.hygieneScores || [];
        const bankingScores = company.risk_analysis?.bankingScores || [];

        available.financial += financialScores.filter((s: any) => s.available).length;
        available.business += businessScores.filter((s: any) => s.available).length;
        available.hygiene += hygieneScores.filter((s: any) => s.available).length;
        available.banking += bankingScores.filter((s: any) => s.available).length;
        available.overall += company.available_parameters || 0;
    });

    return {
        financial: totals.financial > 0 ? (available.financial / totals.financial) * 100 : 0,
        business: totals.business > 0 ? (available.business / totals.business) * 100 : 0,
        hygiene: totals.hygiene > 0 ? (available.hygiene / totals.hygiene) * 100 : 0,
        banking: totals.banking > 0 ? (available.banking / totals.banking) * 100 : 0,
        overall: totals.overall > 0 ? (available.overall / totals.overall) * 100 : 0,
        counts: {
            total: totals,
            available: available
        }
    };
}

function calculateDetailedParameterAnalysis(companies: any[], category?: any) {
    const parameterDetails = new Map<string, {
        scores: number[];
        maxScores: number[];
        benchmarks: string[];
        companies: string[];
        category: string;
    }>();

    companies.forEach(company => {
        const allScores = company.risk_analysis?.allScores || [];

        allScores.forEach((score: any) => {
            if (!score.available) return;
            if (category && getParameterCategory(score.parameter, company) !== category) return;

            if (!parameterDetails.has(score.parameter)) {
                parameterDetails.set(score.parameter, {
                    scores: [],
                    maxScores: [],
                    benchmarks: [],
                    companies: [],
                    category: getParameterCategory(score.parameter, company)
                });
            }

            const details = parameterDetails.get(score.parameter)!;
            details.scores.push(score.score);
            details.maxScores.push(score.maxScore);
            details.benchmarks.push(score.benchmark);
            details.companies.push(company.company_name || company.id);
        });
    });

    const detailedAnalysis: Record<string, any> = {};

    parameterDetails.forEach((details, parameter) => {
        const scores = details.scores;
        const mean = scores.reduce((sum, score) => sum + score, 0) / scores.length;
        const maxScore = Math.max(...details.maxScores);

        // Calculate benchmark distribution
        const benchmarkCounts = details.benchmarks.reduce((acc, benchmark) => {
            acc[benchmark] = (acc[benchmark] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        detailedAnalysis[parameter] = {
            category: details.category,
            company_count: details.companies.length,
            average_score: mean,
            max_possible_score: maxScore,
            performance_percentage: maxScore > 0 ? (mean / maxScore) * 100 : 0,
            score_distribution: {
                min: Math.min(...scores),
                max: Math.max(...scores),
                median: calculateMedian(scores),
                std_dev: calculateStandardDeviation(scores)
            },
            benchmark_distribution: benchmarkCounts,
            top_performing_companies: getTopPerformingCompanies(details, 5),
            improvement_potential: maxScore - mean
        };
    });

    return detailedAnalysis;
}

function calculateParameterCorrelations(companies: any[]) {
    // Calculate correlations between parameter scores and overall risk scores
    const correlations: Record<string, number> = {};

    const parameterScores = new Map<string, number[]>();
    const riskScores: number[] = [];

    companies.forEach(company => {
        if (!company.risk_score) return;

        const allScores = company.risk_analysis?.allScores || [];

        allScores.forEach((score: any) => {
            if (!score.available) return;

            if (!parameterScores.has(score.parameter)) {
                parameterScores.set(score.parameter, []);
            }

            parameterScores.get(score.parameter)!.push(score.score);
        });

        riskScores.push(company.risk_score);
    });

    parameterScores.forEach((scores, parameter) => {
        if (scores.length === riskScores.length) {
            correlations[parameter] = calculateCorrelation(scores, riskScores);
        }
    });

    return {
        parameter_risk_correlations: correlations,
        strongest_positive_correlations: Object.entries(correlations)
            .filter(([_, corr]) => corr > 0.3)
            .sort(([_, a], [__, b]) => b - a)
            .slice(0, 10),
        strongest_negative_correlations: Object.entries(correlations)
            .filter(([_, corr]) => corr < -0.3)
            .sort(([_, a], [__, b]) => a - b)
            .slice(0, 10)
    };
}

function calculateBenchmarkComparison(companies: any[]) {
    const benchmarkStats = {
        excellent: { count: 0, avg_risk_score: 0, risk_scores: [] as number[] },
        good: { count: 0, avg_risk_score: 0, risk_scores: [] as number[] },
        average: { count: 0, avg_risk_score: 0, risk_scores: [] as number[] },
        poor: { count: 0, avg_risk_score: 0, risk_scores: [] as number[] },
        critical: { count: 0, avg_risk_score: 0, risk_scores: [] as number[] }
    };

    companies.forEach(company => {
        const allScores = company.risk_analysis?.allScores || [];
        const riskScore = company.risk_score || 0;

        allScores.forEach((score: any) => {
            if (!score.available) return;

            const benchmark = score.benchmark.toLowerCase();
            if (benchmark.includes('excellent')) {
                benchmarkStats.excellent.count++;
                benchmarkStats.excellent.risk_scores.push(riskScore);
            } else if (benchmark.includes('good')) {
                benchmarkStats.good.count++;
                benchmarkStats.good.risk_scores.push(riskScore);
            } else if (benchmark.includes('average')) {
                benchmarkStats.average.count++;
                benchmarkStats.average.risk_scores.push(riskScore);
            } else if (benchmark.includes('poor')) {
                benchmarkStats.poor.count++;
                benchmarkStats.poor.risk_scores.push(riskScore);
            } else {
                benchmarkStats.critical.count++;
                benchmarkStats.critical.risk_scores.push(riskScore);
            }
        });
    });

    // Calculate average risk scores for each benchmark category
    Object.keys(benchmarkStats).forEach(key => {
        const stats = benchmarkStats[key as keyof typeof benchmarkStats];
        if (stats.risk_scores.length > 0) {
            stats.avg_risk_score = stats.risk_scores.reduce((sum, score) => sum + score, 0) / stats.risk_scores.length;
        }
    });

    return benchmarkStats;
}

// Utility functions

function getParameterCategory(parameter: string, company: any): string {
    const riskAnalysis = company.risk_analysis;
    if (!riskAnalysis) return 'Unknown';

    if (riskAnalysis.financialScores?.some((s: any) => s.parameter === parameter)) return 'Financial';
    if (riskAnalysis.businessScores?.some((s: any) => s.parameter === parameter)) return 'Business';
    if (riskAnalysis.hygieneScores?.some((s: any) => s.parameter === parameter)) return 'Hygiene';
    if (riskAnalysis.bankingScores?.some((s: any) => s.parameter === parameter)) return 'Banking';

    return 'Unknown';
}

function calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function calculateStandardDeviation(numbers: number[]): number {
    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
    return Math.sqrt(variance);
}

function calculateCorrelation(x: number[], y: number[]): number {
    if (x.length !== y.length || x.length === 0) return 0;

    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumXX = x.reduce((sum, xi) => sum + xi * xi, 0);
    const sumYY = y.reduce((sum, yi) => sum + yi * yi, 0);

    const numerator = n * sumXY - sumX * sumY;
    const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));

    return denominator === 0 ? 0 : numerator / denominator;
}

function getTopPerformingCompanies(details: any, limit: number) {
    const companyScores = details.companies.map((company: string, index: number) => ({
        company,
        score: details.scores[index],
        maxScore: details.maxScores[index],
        percentage: details.maxScores[index] > 0 ? (details.scores[index] / details.maxScores[index]) * 100 : 0
    }));

    return companyScores
        .sort((a, b) => b.percentage - a.percentage)
        .slice(0, limit);
}