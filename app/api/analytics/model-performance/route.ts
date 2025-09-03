/**
 * Model Performance Analytics API Endpoint
 * 
 * Provides comprehensive risk model performance metrics including:
 * - Model accuracy and validation metrics
 * - Parameter availability and coverage analysis
 * - Grade distribution and consistency metrics
 * - Prediction confidence and reliability assessment
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
        const modelType = searchParams.get('model_type'); // 'with_banking', 'without_banking'
        const includeValidation = searchParams.get('include_validation') === 'true';
        const includeParameterAnalysis = searchParams.get('include_parameter_analysis') === 'true';

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
                    model_performance: {
                        overall_accuracy: 0,
                        parameter_availability: {
                            financial: 0,
                            business: 0,
                            hygiene: 0,
                            banking: 0,
                            overall: 0
                        },
                        grade_distribution: {},
                        model_consistency: {
                            score_variance: 0,
                            grade_stability: 0,
                            prediction_confidence: 0
                        },
                        validation_metrics: {
                            companies_with_complete_data: 0,
                            data_completeness_percentage: 0,
                            model_coverage: {}
                        }
                    },
                    metadata: {
                        total_companies_analyzed: 0,
                        generated_at: new Date().toISOString()
                    }
                }
            });
        }

        // Filter by model type if specified
        let filteredCompanies = portfolioData.companies;
        if (modelType) {
            filteredCompanies = portfolioData.companies.filter(c => c.model_type === modelType);
        }

        // Filter companies with risk analysis
        const companiesWithAnalysis = filteredCompanies.filter(c => c.risk_analysis);

        if (companiesWithAnalysis.length === 0) {
            return NextResponse.json({
                error: 'No companies found with risk analysis data'
            }, { status: 404 });
        }

        // Calculate model performance metrics
        const modelPerformance = PortfolioAnalyticsService.calculateModelPerformance(
            companiesWithAnalysis
        );

        let result: any = {
            model_performance: modelPerformance
        };

        // Add validation metrics if requested
        if (includeValidation) {
            result.validation_analysis = calculateValidationAnalysis(companiesWithAnalysis);
        }

        // Add parameter analysis if requested
        if (includeParameterAnalysis) {
            result.parameter_analysis = calculateParameterPerformanceAnalysis(companiesWithAnalysis);
        }

        // Add model comparison if multiple model types exist
        const modelComparison = calculateModelTypeComparison(portfolioData.companies);
        if (Object.keys(modelComparison).length > 1) {
            result.model_comparison = modelComparison;
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                metadata: {
                    total_companies_analyzed: companiesWithAnalysis.length,
                    total_companies_in_portfolio: portfolioData.total_count,
                    companies_without_analysis: filteredCompanies.length - companiesWithAnalysis.length,
                    model_type_filter: modelType,
                    include_validation: includeValidation,
                    include_parameter_analysis: includeParameterAnalysis,
                    filters_applied: Object.keys(filters).length > 0,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Model performance analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate model performance analytics',
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
            model_types = ['with_banking', 'without_banking'],
            include_validation_details = false,
            include_parameter_importance = false,
            include_accuracy_trends = false,
            calculate_model_drift = false,
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

        // Calculate core model performance
        const modelPerformance = PortfolioAnalyticsService.calculateModelPerformance(companiesWithAnalysis);
        const modelComparison = calculateModelTypeComparison(companiesWithAnalysis);

        let result: any = {
            model_performance: modelPerformance,
            model_comparison: modelComparison
        };

        // Add optional analyses
        // if (include_validation_details) {
        //     result.validation_details = calculateDetailedValidationMetrics(companiesWithAnalysis);
        // }

        if (include_parameter_importance) {
            result.parameter_importance = calculateParameterImportanceAnalysis(companiesWithAnalysis);
        }

        if (include_accuracy_trends) {
            result.accuracy_trends = calculateAccuracyTrends(companiesWithAnalysis);
        }

        if (calculate_model_drift) {
            result.model_drift = calculateModelDrift(companiesWithAnalysis);
        }

        if (benchmark_comparison) {
            result.benchmark_comparison = calculateModelBenchmarks(companiesWithAnalysis);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...result,
                metadata: {
                    companies_analyzed: companiesWithAnalysis.length,
                    model_types_analyzed: model_types,
                    request_type: company_ids ? 'specific_companies' : 'filtered_portfolio',
                    include_validation_details,
                    include_parameter_importance,
                    include_accuracy_trends,
                    calculate_model_drift,
                    benchmark_comparison,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Model performance analytics POST error:', error);
        return NextResponse.json({
            error: 'Failed to calculate model performance analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper functions

function calculateValidationAnalysis(companies: any[]) {
    const validationMetrics = {
        data_quality: {
            complete_financial_data: 0,
            complete_business_data: 0,
            complete_hygiene_data: 0,
            complete_banking_data: 0,
            overall_completeness: 0
        },
        model_coverage: {
            companies_with_all_categories: 0,
            companies_missing_financial: 0,
            companies_missing_business: 0,
            companies_missing_hygiene: 0,
            companies_missing_banking: 0
        },
        prediction_reliability: {
            high_confidence: 0,    // >80% parameter availability
            medium_confidence: 0,  // 60-80% parameter availability
            low_confidence: 0      // <60% parameter availability
        }
    };

    companies.forEach(company => {
        const totalParams = company.total_parameters || 0;
        const availableParams = company.available_parameters || 0;
        const completeness = totalParams > 0 ? (availableParams / totalParams) * 100 : 0;

        // Data quality metrics
        const financialParams = company.financial_parameters || 0;
        const businessParams = company.business_parameters || 0;
        const hygieneParams = company.hygiene_parameters || 0;
        const bankingParams = company.banking_parameters || 0;

        const financialAvailable = company.risk_analysis?.financialScores?.filter((s: any) => s.available).length || 0;
        const businessAvailable = company.risk_analysis?.businessScores?.filter((s: any) => s.available).length || 0;
        const hygieneAvailable = company.risk_analysis?.hygieneScores?.filter((s: any) => s.available).length || 0;
        const bankingAvailable = company.risk_analysis?.bankingScores?.filter((s: any) => s.available).length || 0;

        if (financialParams > 0 && (financialAvailable / financialParams) >= 0.8) {
            validationMetrics.data_quality.complete_financial_data++;
        }
        if (businessParams > 0 && (businessAvailable / businessParams) >= 0.8) {
            validationMetrics.data_quality.complete_business_data++;
        }
        if (hygieneParams > 0 && (hygieneAvailable / hygieneParams) >= 0.8) {
            validationMetrics.data_quality.complete_hygiene_data++;
        }
        if (bankingParams > 0 && (bankingAvailable / bankingParams) >= 0.8) {
            validationMetrics.data_quality.complete_banking_data++;
        }

        if (completeness >= 80) {
            validationMetrics.data_quality.overall_completeness++;
        }

        // Model coverage
        const hasAllCategories = financialAvailable > 0 && businessAvailable > 0 &&
            hygieneAvailable > 0 && bankingAvailable > 0;

        if (hasAllCategories) {
            validationMetrics.model_coverage.companies_with_all_categories++;
        }
        if (financialAvailable === 0) validationMetrics.model_coverage.companies_missing_financial++;
        if (businessAvailable === 0) validationMetrics.model_coverage.companies_missing_business++;
        if (hygieneAvailable === 0) validationMetrics.model_coverage.companies_missing_hygiene++;
        if (bankingAvailable === 0) validationMetrics.model_coverage.companies_missing_banking++;

        // Prediction reliability
        if (completeness >= 80) {
            validationMetrics.prediction_reliability.high_confidence++;
        } else if (completeness >= 60) {
            validationMetrics.prediction_reliability.medium_confidence++;
        } else {
            validationMetrics.prediction_reliability.low_confidence++;
        }
    });

    const totalCompanies = companies.length;

    return {
        data_quality_rates: {
            complete_financial_rate: (validationMetrics.data_quality.complete_financial_data / totalCompanies) * 100,
            complete_business_rate: (validationMetrics.data_quality.complete_business_data / totalCompanies) * 100,
            complete_hygiene_rate: (validationMetrics.data_quality.complete_hygiene_data / totalCompanies) * 100,
            complete_banking_rate: (validationMetrics.data_quality.complete_banking_data / totalCompanies) * 100,
            overall_completeness_rate: (validationMetrics.data_quality.overall_completeness / totalCompanies) * 100
        },
        model_coverage_analysis: {
            full_coverage_rate: (validationMetrics.model_coverage.companies_with_all_categories / totalCompanies) * 100,
            missing_financial_rate: (validationMetrics.model_coverage.companies_missing_financial / totalCompanies) * 100,
            missing_business_rate: (validationMetrics.model_coverage.companies_missing_business / totalCompanies) * 100,
            missing_hygiene_rate: (validationMetrics.model_coverage.companies_missing_hygiene / totalCompanies) * 100,
            missing_banking_rate: (validationMetrics.model_coverage.companies_missing_banking / totalCompanies) * 100
        },
        prediction_confidence: {
            high_confidence_rate: (validationMetrics.prediction_reliability.high_confidence / totalCompanies) * 100,
            medium_confidence_rate: (validationMetrics.prediction_reliability.medium_confidence / totalCompanies) * 100,
            low_confidence_rate: (validationMetrics.prediction_reliability.low_confidence / totalCompanies) * 100
        },
        validation_summary: {
            total_companies: totalCompanies,
            companies_ready_for_production: validationMetrics.prediction_reliability.high_confidence,
            companies_needing_improvement: validationMetrics.prediction_reliability.low_confidence
        }
    };
}

function calculateParameterPerformanceAnalysis(companies: any[]) {
    const parameterStats = new Map<string, {
        category: string;
        availability_count: number;
        total_count: number;
        score_sum: number;
        max_score_sum: number;
        companies: string[];
    }>();

    companies.forEach(company => {
        const allScores = company.risk_analysis?.allScores || [];

        allScores.forEach((score: any) => {
            if (!parameterStats.has(score.parameter)) {
                parameterStats.set(score.parameter, {
                    category: getParameterCategory(score.parameter, company),
                    availability_count: 0,
                    total_count: 0,
                    score_sum: 0,
                    max_score_sum: 0,
                    companies: []
                });
            }

            const stats = parameterStats.get(score.parameter)!;
            stats.total_count++;
            stats.max_score_sum += score.maxScore;

            if (score.available) {
                stats.availability_count++;
                stats.score_sum += score.score;
                stats.companies.push(company.company_name || company.id);
            }
        });
    });

    const parameterPerformance = Array.from(parameterStats.entries()).map(([parameter, stats]) => {
        const availabilityRate = stats.total_count > 0 ? (stats.availability_count / stats.total_count) * 100 : 0;
        const averageScore = stats.availability_count > 0 ? stats.score_sum / stats.availability_count : 0;
        const averageMaxScore = stats.total_count > 0 ? stats.max_score_sum / stats.total_count : 0;
        const performanceRate = averageMaxScore > 0 ? (averageScore / averageMaxScore) * 100 : 0;

        return {
            parameter,
            category: stats.category,
            availability_rate: availabilityRate,
            performance_rate: performanceRate,
            average_score: averageScore,
            average_max_score: averageMaxScore,
            companies_with_data: stats.availability_count,
            total_companies: stats.total_count,
            impact_score: availabilityRate * performanceRate / 100 // Combined metric
        };
    });

    // Sort by impact score (availability * performance)
    parameterPerformance.sort((a, b) => b.impact_score - a.impact_score);

    // Group by category
    const categoryPerformance = parameterPerformance.reduce((acc, param) => {
        if (!acc[param.category]) {
            acc[param.category] = [];
        }
        acc[param.category].push(param);
        return acc;
    }, {} as Record<string, any[]>);

    return {
        parameter_performance: parameterPerformance,
        category_performance: categoryPerformance,
        top_performing_parameters: parameterPerformance.slice(0, 20),
        underperforming_parameters: parameterPerformance
            .filter(p => p.availability_rate < 50 || p.performance_rate < 60)
            .slice(0, 20),
        performance_summary: {
            total_parameters: parameterPerformance.length,
            high_impact_parameters: parameterPerformance.filter(p => p.impact_score >= 70).length,
            low_availability_parameters: parameterPerformance.filter(p => p.availability_rate < 50).length,
            low_performance_parameters: parameterPerformance.filter(p => p.performance_rate < 60).length
        }
    };
}

function calculateModelTypeComparison(companies: any[]) {
    const modelTypes = new Map<string, {
        companies: any[];
        totalParams: number;
        availableParams: number;
        riskScores: number[];
        grades: string[];
    }>();

    companies.forEach(company => {
        const modelType = company.model_type || 'unknown';

        if (!modelTypes.has(modelType)) {
            modelTypes.set(modelType, {
                companies: [],
                totalParams: 0,
                availableParams: 0,
                riskScores: [],
                grades: []
            });
        }

        const modelData = modelTypes.get(modelType)!;
        modelData.companies.push(company);
        modelData.totalParams += company.total_parameters || 0;
        modelData.availableParams += company.available_parameters || 0;

        if (company.risk_score) {
            modelData.riskScores.push(company.risk_score);
        }

        if (company.risk_grade) {
            modelData.grades.push(company.risk_grade);
        }
    });

    const comparison: Record<string, any> = {};

    modelTypes.forEach((data, modelType) => {
        const avgRiskScore = data.riskScores.length > 0
            ? data.riskScores.reduce((sum, score) => sum + score, 0) / data.riskScores.length
            : 0;

        const parameterAvailability = data.totalParams > 0
            ? (data.availableParams / data.totalParams) * 100
            : 0;

        // Grade distribution
        const gradeDistribution = data.grades.reduce((acc, grade) => {
            acc[grade] = (acc[grade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Risk score statistics
        const sortedScores = [...data.riskScores].sort((a, b) => a - b);
        const scoreStats = {
            min: sortedScores[0] || 0,
            max: sortedScores[sortedScores.length - 1] || 0,
            median: sortedScores.length > 0
                ? (sortedScores.length % 2 === 0
                    ? (sortedScores[sortedScores.length / 2 - 1] + sortedScores[sortedScores.length / 2]) / 2
                    : sortedScores[Math.floor(sortedScores.length / 2)])
                : 0,
            std_dev: calculateStandardDeviation(data.riskScores)
        };

        comparison[modelType] = {
            company_count: data.companies.length,
            parameter_availability: parameterAvailability,
            average_risk_score: avgRiskScore,
            risk_score_statistics: scoreStats,
            grade_distribution: gradeDistribution,
            model_performance_score: (parameterAvailability + avgRiskScore) / 2 // Simple combined metric
        };
    });

    return comparison;
}

// function calculateDetailedValidationMetrics(companies: any[]) {
//     const validationDetails = {
//         cross_validation: calculateCrossValidationMetrics(companies),
//         holdout_validation: calculateHoldoutValidation(companies),
//         temporal_validation: calculateTemporalValidation(companies),
//         industry_validation: calculateIndustryValidation(companies)
//     };

//     return validationDetails;
// }

// function calculateCrossValidationMetrics(companies: any[]) {
//     // Simulate cross-validation by splitting companies into folds
//     const foldSize = Math.floor(companies.length / 5); // 5-fold CV
//     const folds = [];

//     for (let i = 0; i < 5; i++) {
//         const start = i * foldSize;
//         const end = i === 4 ? companies.length : (i + 1) * foldSize;
//         folds.push(companies.slice(start, end));
//     }

//     const foldResults = folds.map((testFold, foldIndex) => {
//         const trainFolds = folds.filter((_, index) => index !== foldIndex).flat();

//         // Calculate metrics for this fold
//         const testAccuracy = calculateFoldAccuracy(testFold);
//         const trainAccuracy = calculateFoldAccuracy(trainFolds);

//         return {
//             fold: foldIndex + 1,
//             test_accuracy: testAccuracy,
//             train_accuracy: trainAccuracy,
//             test_companies: testFold.length,
//             train_companies: trainFolds.length
//         };
//     });

//     const avgTestAccuracy = foldResults.reduce((sum, fold) => sum + fold.test_accuracy, 0) / foldResults.length;
//     const avgTrainAccuracy = foldResults.reduce((sum, fold) => sum + fold.train_accuracy, 0) / foldResults.length;

//     return {
//         fold_results: foldResults,
//         average_test_accuracy: avgTestAccuracy,
//         average_train_accuracy: avgTrainAccuracy,
//         overfitting_indicator: avgTrainAccuracy - avgTestAccuracy,
//         cross_validation_score: avgTestAccuracy
//     };
// }

function calculateFoldAccuracy(companies: any[]): number {
    const companiesWithData = companies.filter(c =>
        c.total_parameters && c.available_parameters && c.risk_score
    );

    if (companiesWithData.length === 0) return 0;

    const totalParams = companiesWithData.reduce((sum, c) => sum + c.total_parameters, 0);
    const availableParams = companiesWithData.reduce((sum, c) => sum + c.available_parameters, 0);

    return totalParams > 0 ? (availableParams / totalParams) * 100 : 0;
}

function calculateHoldoutValidation(companies: any[]) {
    // Split into 80% train, 20% test
    const shuffled = [...companies].sort(() => Math.random() - 0.5);
    const splitIndex = Math.floor(companies.length * 0.8);

    const trainSet = shuffled.slice(0, splitIndex);
    const testSet = shuffled.slice(splitIndex);

    const trainAccuracy = calculateFoldAccuracy(trainSet);
    const testAccuracy = calculateFoldAccuracy(testSet);

    return {
        train_set_size: trainSet.length,
        test_set_size: testSet.length,
        train_accuracy: trainAccuracy,
        test_accuracy: testAccuracy,
        generalization_gap: trainAccuracy - testAccuracy,
        holdout_score: testAccuracy
    };
}

function calculateTemporalValidation(companies: any[]) {
    // Group by processing date
    const companiesWithDates = companies.filter(c => c.completed_at);

    if (companiesWithDates.length === 0) {
        return { message: 'No temporal data available for validation' };
    }

    companiesWithDates.sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    // Split into early (train) and late (test) periods
    const splitIndex = Math.floor(companiesWithDates.length * 0.7);
    const earlyPeriod = companiesWithDates.slice(0, splitIndex);
    const latePeriod = companiesWithDates.slice(splitIndex);

    const earlyAccuracy = calculateFoldAccuracy(earlyPeriod);
    const lateAccuracy = calculateFoldAccuracy(latePeriod);

    return {
        early_period_companies: earlyPeriod.length,
        late_period_companies: latePeriod.length,
        early_period_accuracy: earlyAccuracy,
        late_period_accuracy: lateAccuracy,
        temporal_stability: Math.abs(earlyAccuracy - lateAccuracy) < 5 ? 'Stable' : 'Unstable',
        temporal_drift: lateAccuracy - earlyAccuracy
    };
}

function calculateIndustryValidation(companies: any[]) {
    const industryGroups = new Map<string, any[]>();

    companies.forEach(company => {
        const industry = company.industry || 'Unknown';
        if (!industryGroups.has(industry)) {
            industryGroups.set(industry, []);
        }
        industryGroups.get(industry)!.push(company);
    });

    const industryValidation: Record<string, any> = {};

    industryGroups.forEach((industryCompanies, industry) => {
        if (industryCompanies.length < 5) return; // Need minimum companies

        const accuracy = calculateFoldAccuracy(industryCompanies);
        const avgRiskScore = industryCompanies
            .filter(c => c.risk_score)
            .reduce((sum, c) => sum + c.risk_score, 0) / industryCompanies.length;

        industryValidation[industry] = {
            company_count: industryCompanies.length,
            model_accuracy: accuracy,
            average_risk_score: avgRiskScore,
            validation_status: accuracy >= 70 ? 'Good' : accuracy >= 50 ? 'Fair' : 'Poor'
        };
    });

    return industryValidation;
}

function calculateParameterImportanceAnalysis(companies: any[]) {
    const parameterImportance = new Map<string, {
        category: string;
        impact_on_risk: number[];
        availability_impact: number;
        score_variance: number;
    }>();

    companies.forEach(company => {
        const riskScore = company.risk_score || 0;
        const allScores = company.risk_analysis?.allScores || [];

        allScores.forEach((score: any) => {
            if (!score.available) return;

            if (!parameterImportance.has(score.parameter)) {
                parameterImportance.set(score.parameter, {
                    category: getParameterCategory(score.parameter, company),
                    impact_on_risk: [],
                    availability_impact: 0,
                    score_variance: 0
                });
            }

            const importance = parameterImportance.get(score.parameter)!;
            importance.impact_on_risk.push(riskScore);
        });
    });

    const importanceAnalysis = Array.from(parameterImportance.entries()).map(([parameter, data]) => {
        const avgRiskImpact = data.impact_on_risk.length > 0
            ? data.impact_on_risk.reduce((sum, risk) => sum + risk, 0) / data.impact_on_risk.length
            : 0;

        const riskVariance = calculateVariance(data.impact_on_risk);

        return {
            parameter,
            category: data.category,
            companies_with_parameter: data.impact_on_risk.length,
            average_risk_when_present: avgRiskImpact,
            risk_variance: riskVariance,
            importance_score: avgRiskImpact * Math.sqrt(data.impact_on_risk.length) // Weight by sample size
        };
    });

    importanceAnalysis.sort((a, b) => b.importance_score - a.importance_score);

    return {
        parameter_importance: importanceAnalysis,
        most_important_parameters: importanceAnalysis.slice(0, 20),
        least_important_parameters: importanceAnalysis.slice(-10),
        category_importance: calculateCategoryImportance(importanceAnalysis)
    };
}

function calculateCategoryImportance(parameterImportance: any[]) {
    const categoryImportance = parameterImportance.reduce((acc, param) => {
        if (!acc[param.category]) {
            acc[param.category] = {
                parameter_count: 0,
                total_importance: 0,
                avg_importance: 0
            };
        }

        acc[param.category].parameter_count++;
        acc[param.category].total_importance += param.importance_score;

        return acc;
    }, {} as Record<string, any>);

    // Calculate averages
    Object.keys(categoryImportance).forEach(category => {
        const data = categoryImportance[category];
        data.avg_importance = data.total_importance / data.parameter_count;
    });

    return categoryImportance;
}

function calculateAccuracyTrends(companies: any[]) {
    // Group by processing month
    const monthlyData = new Map<string, any[]>();

    companies.forEach(company => {
        if (!company.completed_at) return;

        const date = new Date(company.completed_at);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

        if (!monthlyData.has(monthKey)) {
            monthlyData.set(monthKey, []);
        }
        monthlyData.get(monthKey)!.push(company);
    });

    const trends = Array.from(monthlyData.entries())
        .map(([month, monthCompanies]) => {
            const accuracy = calculateFoldAccuracy(monthCompanies);
            const avgRiskScore = monthCompanies
                .filter(c => c.risk_score)
                .reduce((sum, c) => sum + c.risk_score, 0) / monthCompanies.length;

            return {
                month,
                company_count: monthCompanies.length,
                model_accuracy: accuracy,
                average_risk_score: avgRiskScore
            };
        })
        .sort((a, b) => a.month.localeCompare(b.month));

    // Calculate trend direction
    const trendAnalysis = {
        accuracy_trend: trends.length > 1
            ? trends[trends.length - 1].model_accuracy - trends[0].model_accuracy
            : 0,
        risk_score_trend: trends.length > 1
            ? trends[trends.length - 1].average_risk_score - trends[0].average_risk_score
            : 0
    };

    return {
        monthly_trends: trends,
        trend_analysis: trendAnalysis,
        trend_summary: {
            total_months: trends.length,
            accuracy_improving: trendAnalysis.accuracy_trend > 0,
            risk_scores_improving: trendAnalysis.risk_score_trend > 0
        }
    };
}

function calculateModelDrift(companies: any[]) {
    // Compare early vs recent performance
    const companiesWithDates = companies.filter(c => c.completed_at);

    if (companiesWithDates.length < 20) {
        return { message: 'Insufficient data for drift analysis' };
    }

    companiesWithDates.sort((a, b) => new Date(a.completed_at).getTime() - new Date(b.completed_at).getTime());

    const splitIndex = Math.floor(companiesWithDates.length / 2);
    const earlyPeriod = companiesWithDates.slice(0, splitIndex);
    const recentPeriod = companiesWithDates.slice(splitIndex);

    const earlyMetrics = calculatePeriodMetrics(earlyPeriod);
    const recentMetrics = calculatePeriodMetrics(recentPeriod);

    const drift = {
        accuracy_drift: recentMetrics.accuracy - earlyMetrics.accuracy,
        risk_score_drift: recentMetrics.avg_risk_score - earlyMetrics.avg_risk_score,
        parameter_availability_drift: recentMetrics.parameter_availability - earlyMetrics.parameter_availability
    };

    return {
        early_period: earlyMetrics,
        recent_period: recentMetrics,
        drift_analysis: drift,
        drift_severity: Math.abs(drift.accuracy_drift) > 10 ? 'High' :
            Math.abs(drift.accuracy_drift) > 5 ? 'Medium' : 'Low'
    };
}

function calculatePeriodMetrics(companies: any[]) {
    const accuracy = calculateFoldAccuracy(companies);
    const avgRiskScore = companies
        .filter(c => c.risk_score)
        .reduce((sum, c) => sum + c.risk_score, 0) / companies.length;

    const totalParams = companies.reduce((sum, c) => sum + (c.total_parameters || 0), 0);
    const availableParams = companies.reduce((sum, c) => sum + (c.available_parameters || 0), 0);
    const parameterAvailability = totalParams > 0 ? (availableParams / totalParams) * 100 : 0;

    return {
        company_count: companies.length,
        accuracy: accuracy,
        avg_risk_score: avgRiskScore,
        parameter_availability: parameterAvailability
    };
}

function calculateModelBenchmarks(companies: any[]) {
    // Industry benchmarks
    const industryBenchmarks = new Map<string, {
        companies: any[];
        accuracy: number;
        avgRiskScore: number;
    }>();

    companies.forEach(company => {
        const industry = company.industry || 'Unknown';
        if (!industryBenchmarks.has(industry)) {
            industryBenchmarks.set(industry, { companies: [], accuracy: 0, avgRiskScore: 0 });
        }
        industryBenchmarks.get(industry)!.companies.push(company);
    });

    const benchmarks: Record<string, any> = {};

    industryBenchmarks.forEach((data, industry) => {
        if (data.companies.length < 5) return;

        const accuracy = calculateFoldAccuracy(data.companies);
        const avgRiskScore = data.companies
            .filter(c => c.risk_score)
            .reduce((sum, c) => sum + c.risk_score, 0) / data.companies.length;

        benchmarks[industry] = {
            company_count: data.companies.length,
            model_accuracy: accuracy,
            average_risk_score: avgRiskScore,
            benchmark_category: accuracy >= 80 ? 'Excellent' :
                accuracy >= 70 ? 'Good' :
                    accuracy >= 60 ? 'Fair' : 'Poor'
        };
    });

    return {
        industry_benchmarks: benchmarks,
        portfolio_benchmark: {
            overall_accuracy: calculateFoldAccuracy(companies),
            total_companies: companies.length,
            benchmark_status: 'Portfolio Average'
        }
    };
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

function calculateStandardDeviation(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    const variance = numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;

    return Math.sqrt(variance);
}

function calculateVariance(numbers: number[]): number {
    if (numbers.length === 0) return 0;

    const mean = numbers.reduce((sum, num) => sum + num, 0) / numbers.length;
    return numbers.reduce((sum, num) => sum + Math.pow(num - mean, 2), 0) / numbers.length;
}