/**
 * Portfolio Analytics Service
 * 
 * Provides comprehensive portfolio analytics including overview metrics, risk distribution,
 * parameter analysis, industry breakdown, eligibility analysis, compliance status,
 * and model performance metrics for the credit portfolio dashboard.
 */

import {
    PortfolioCompany,
    RiskDistribution,
    IndustryBreakdown,
    RegionalDistribution,
    ComplianceSummary,
    EligibilitySummary,
    ParameterScore,
    CategoryResult
} from '@/types/portfolio.types';

export interface PortfolioOverviewMetrics {
    total_companies: number;
    total_exposure: number;
    average_risk_score: number;
    risk_distribution: RiskDistribution;
    industry_summary: {
        total_industries: number;
        top_industries: Array<{
            name: string;
            count: number;
            percentage: number;
            avg_risk_score: number;
        }>;
    };
    regional_summary: {
        total_regions: number;
        top_regions: Array<{
            name: string;
            count: number;
            percentage: number;
            avg_risk_score: number;
        }>;
    };
    eligibility_overview: {
        total_eligible_amount: number;
        average_eligibility: number;
        risk_adjusted_exposure: number;
    };
    compliance_overview: ComplianceSummary;
}

export interface RiskParameterAnalysis {
    category_performance: Record<string, {
        average_score: number;
        max_possible_score: number;
        percentage: number;
        parameter_count: number;
        available_parameters: number;
        top_parameters: Array<{
            parameter: string;
            average_score: number;
            benchmark_category: string;
        }>;
        bottom_parameters: Array<{
            parameter: string;
            average_score: number;
            benchmark_category: string;
        }>;
    }>;
    parameter_benchmarks: Array<{
        parameter: string;
        category: string;
        portfolio_average: number;
        excellent_threshold: number;
        good_threshold: number;
        average_threshold: number;
        poor_threshold: number;
        performance_rating: string;
        companies_excellent: number;
        companies_good: number;
        companies_average: number;
        companies_poor: number;
        companies_critical: number;
    }>;
}

export interface ModelPerformanceMetrics {
    overall_accuracy: number;
    parameter_availability: {
        financial: number;
        business: number;
        hygiene: number;
        banking: number;
        overall: number;
    };
    grade_distribution: Record<string, {
        count: number;
        percentage: number;
        avg_score: number;
        score_range: [number, number];
    }>;
    model_consistency: {
        score_variance: number;
        grade_stability: number;
        prediction_confidence: number;
    };
    validation_metrics: {
        companies_with_complete_data: number;
        data_completeness_percentage: number;
        model_coverage: Record<string, number>;
    };
}

export class PortfolioAnalyticsService {

    /**
     * Calculate comprehensive portfolio overview metrics
     */
    static calculateOverviewMetrics(companies: PortfolioCompany[]): PortfolioOverviewMetrics {
        try {
            if (!Array.isArray(companies)) {
                throw new Error('Invalid companies data: expected array');
            }

            const completedCompanies = companies.filter(c => c && c.status === 'completed');

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

            const riskDistribution = this.calculateRiskDistribution(completedCompanies);
            const industrySummary = this.calculateIndustrySummary(completedCompanies);
            const regionalSummary = this.calculateRegionalSummary(completedCompanies);
            const eligibilityOverview = this.calculateEligibilityOverview(completedCompanies);
            const complianceOverview = this.calculateComplianceOverview(completedCompanies);

            return {
                total_companies: totalCompanies,
                total_exposure: totalExposure,
                average_risk_score: Math.round(averageRiskScore * 100) / 100, // Round to 2 decimal places
                risk_distribution: riskDistribution,
                industry_summary: industrySummary,
                regional_summary: regionalSummary,
                eligibility_overview: eligibilityOverview,
                compliance_overview: complianceOverview
            };
        } catch (error) {
            console.error('Error calculating overview metrics:', error);
            // Return safe default values
            return {
                total_companies: 0,
                total_exposure: 0,
                average_risk_score: 0,
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
                industry_summary: { total_industries: 0, top_industries: [] },
                regional_summary: { total_regions: 0, top_regions: [] },
                eligibility_overview: {
                    total_eligible_amount: 0,
                    average_eligibility: 0,
                    risk_adjusted_exposure: 0
                },
                compliance_overview: {
                    gst_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                    epfo_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                    audit_status: { qualified: 0, unqualified: 0, unknown: 0 }
                }
            };
        }
    }

    /**
     * Calculate risk distribution across CM grades
     */
    static calculateRiskDistribution(companies: PortfolioCompany[]): RiskDistribution {
        const distribution = {
            cm1_count: 0,
            cm2_count: 0,
            cm3_count: 0,
            cm4_count: 0,
            cm5_count: 0,
            ungraded_count: 0,
            total_count: companies.length,
            distribution_percentages: {} as Record<string, number>
        };

        companies.forEach(company => {
            const grade = company.risk_grade?.toLowerCase();
            switch (grade) {
                case 'cm1': distribution.cm1_count++; break;
                case 'cm2': distribution.cm2_count++; break;
                case 'cm3': distribution.cm3_count++; break;
                case 'cm4': distribution.cm4_count++; break;
                case 'cm5': distribution.cm5_count++; break;
                default: distribution.ungraded_count++; break;
            }
        });

        // Calculate percentages
        const total = distribution.total_count;
        if (total > 0) {
            distribution.distribution_percentages = {
                cm1: (distribution.cm1_count / total) * 100,
                cm2: (distribution.cm2_count / total) * 100,
                cm3: (distribution.cm3_count / total) * 100,
                cm4: (distribution.cm4_count / total) * 100,
                cm5: (distribution.cm5_count / total) * 100,
                ungraded: (distribution.ungraded_count / total) * 100
            };
        }

        return distribution;
    }

    /**
     * Calculate detailed parameter analysis across all categories
     */
    static calculateRiskParameterAnalysis(companies: PortfolioCompany[]): RiskParameterAnalysis {
        const companiesWithAnalysis = companies.filter(c => c.risk_analysis);

        if (companiesWithAnalysis.length === 0) {
            return {
                category_performance: {},
                parameter_benchmarks: []
            };
        }

        const categoryPerformance = this.calculateCategoryPerformance(companiesWithAnalysis);
        const parameterBenchmarks = this.calculateParameterBenchmarks(companiesWithAnalysis);

        return {
            category_performance: categoryPerformance,
            parameter_benchmarks: parameterBenchmarks
        };
    }

    /**
     * Calculate industry breakdown with risk overlay
     */
    static calculateIndustryBreakdown(companies: PortfolioCompany[]): IndustryBreakdown {
        const industryMap = new Map<string, {
            count: number;
            total_exposure: number;
            risk_scores: number[];
            risk_grades: string[];
        }>();

        companies.forEach(company => {
            const aboutCompany = company?.risk_analysis?.companyData
            const registeredAddress = aboutCompany?.addresses?.business_address
            const industry = registeredAddress?.industry || company.industry;
            const existing = industryMap.get(industry) || {
                count: 0,
                total_exposure: 0,
                risk_scores: [],
                risk_grades: []
            };

            existing.count++;
            existing.total_exposure += company.recommended_limit || 0;

            if (company.risk_score) {
                existing.risk_scores.push(company.risk_score);
            }

            if (company.risk_grade) {
                existing.risk_grades.push(company.risk_grade);
            }

            industryMap.set(industry, existing);
        });

        const industries = Array.from(industryMap.entries()).map(([name, data]) => {
            const riskDistribution = this.calculateIndustryRiskDistribution(data.risk_grades);

            return {
                name,
                count: data.count,
                total_exposure: data.total_exposure,
                average_risk_score: data.risk_scores.length > 0
                    ? data.risk_scores.reduce((sum, score) => sum + score, 0) / data.risk_scores.length
                    : 0,
                risk_distribution: riskDistribution
            };
        });

        return { industries };
    }

    /**
     * Calculate eligibility analysis across portfolio
     */
    static calculateEligibilityAnalysis(companies: PortfolioCompany[]): EligibilitySummary {
        const companiesWithEligibility = companies.filter(c =>
            c.risk_analysis?.eligibility && c.recommended_limit
        );

        if (companiesWithEligibility.length === 0) {
            return {
                total_eligible_amount: 0,
                average_eligibility: 0,
                eligibility_distribution: {},
                risk_adjusted_exposure: 0
            };
        }

        const totalEligibleAmount = companiesWithEligibility.reduce(
            (sum, c) => sum + c.risk_analysis!.eligibility.finalEligibility, 0
        );

        const averageEligibility = totalEligibleAmount / companiesWithEligibility.length;

        const riskAdjustedExposure = companiesWithEligibility.reduce(
            (sum, c) => {
                const eligibility = c.risk_analysis!.eligibility;
                return sum + (eligibility.finalEligibility * eligibility.riskMultiplier);
            }, 0
        );

        // Calculate eligibility distribution by risk grade
        const eligibilityDistribution = companiesWithEligibility.reduce((acc, company) => {
            const grade = company.risk_analysis!.eligibility.riskGrade || 'Unknown';
            const eligibility = company.risk_analysis!.eligibility.finalEligibility;
            acc[grade] = (acc[grade] || 0) + eligibility;
            return acc;
        }, {} as Record<string, number>);

        return {
            total_eligible_amount: totalEligibleAmount,
            average_eligibility: averageEligibility,
            eligibility_distribution: eligibilityDistribution,
            risk_adjusted_exposure: riskAdjustedExposure
        };
    }

    /**
     * Calculate compliance status across GST and EPFO
     */
    static calculateComplianceStatus(companies: PortfolioCompany[]): ComplianceSummary {
        const gstCompliance = { compliant: 0, non_compliant: 0, unknown: 0 };
        const epfoCompliance = { compliant: 0, non_compliant: 0, unknown: 0 };
        const auditStatus = { qualified: 0, unqualified: 0, unknown: 0 };

        companies.forEach(company => {
            const extractedData = company.extracted_data;

            // GST Compliance Analysis
            if (extractedData?.gst_records) {
                const activeGSTINs = extractedData.gst_records.active_gstins || [];
                const hasRegularCompliance = activeGSTINs.some(gstin =>
                    gstin.compliance_status === 'Regular'
                );
                const hasIrregularCompliance = activeGSTINs.some(gstin =>
                    gstin.compliance_status === 'Irregular'
                );

                if (hasRegularCompliance && !hasIrregularCompliance) {
                    gstCompliance.compliant++;
                } else if (hasIrregularCompliance) {
                    gstCompliance.non_compliant++;
                } else {
                    gstCompliance.unknown++;
                }
            } else {
                gstCompliance.unknown++;
            }

            // EPFO Compliance Analysis
            if (extractedData?.epfo_records) {
                const establishments = extractedData.epfo_records.establishments || [];
                const hasRegularCompliance = establishments.some(est =>
                    est.compliance_status === 'Regular'
                );
                const hasIrregularCompliance = establishments.some(est =>
                    est.compliance_status === 'Irregular'
                );

                if (hasRegularCompliance && !hasIrregularCompliance) {
                    epfoCompliance.compliant++;
                } else if (hasIrregularCompliance) {
                    epfoCompliance.non_compliant++;
                } else {
                    epfoCompliance.unknown++;
                }
            } else {
                epfoCompliance.unknown++;
            }

            // Audit Status Analysis
            if (extractedData?.audit_qualifications && extractedData.audit_qualifications.length > 0) {
                const hasUnqualified = extractedData.audit_qualifications.some(audit =>
                    audit.qualification_type === 'Unqualified'
                );
                const hasQualified = extractedData.audit_qualifications.some(audit =>
                    audit.qualification_type === 'Qualified'
                );

                if (hasUnqualified && !hasQualified) {
                    auditStatus.unqualified++;
                } else if (hasQualified) {
                    auditStatus.qualified++;
                } else {
                    auditStatus.unknown++;
                }
            } else {
                auditStatus.unknown++;
            }
        });

        return {
            gst_compliance: gstCompliance,
            epfo_compliance: epfoCompliance,
            audit_status: auditStatus
        };
    }

    /**
     * Calculate model performance metrics
     */
    static calculateModelPerformance(companies: PortfolioCompany[]): ModelPerformanceMetrics {
        const companiesWithAnalysis = companies.filter(c => c.risk_analysis);

        if (companiesWithAnalysis.length === 0) {
            return {
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
            };
        }

        const overallAccuracy = this.calculateOverallAccuracy(companiesWithAnalysis);
        const parameterAvailability = this.calculateParameterAvailability(companiesWithAnalysis);
        const gradeDistribution = this.calculateGradeDistribution(companiesWithAnalysis);
        const modelConsistency = this.calculateModelConsistency(companiesWithAnalysis);
        const validationMetrics = this.calculateValidationMetrics(companiesWithAnalysis);

        return {
            overall_accuracy: overallAccuracy,
            parameter_availability: parameterAvailability,
            grade_distribution: gradeDistribution,
            model_consistency: modelConsistency,
            validation_metrics: validationMetrics
        };
    }

    // Private helper methods

    private static calculateIndustrySummary(companies: PortfolioCompany[]) {
        const industryMap = new Map<string, { count: number; riskScores: number[] }>();

        companies.forEach(company => {
            const industry = company.industry || 'Unknown';
            const existing = industryMap.get(industry) || { count: 0, riskScores: [] };
            existing.count++;
            if (company.risk_score) {
                existing.riskScores.push(company.risk_score);
            }
            industryMap.set(industry, existing);
        });

        const topIndustries = Array.from(industryMap.entries())
            .map(([name, data]) => ({
                name,
                count: data.count,
                percentage: (data.count / companies.length) * 100,
                avg_risk_score: data.riskScores.length > 0
                    ? data.riskScores.reduce((sum, score) => sum + score, 0) / data.riskScores.length
                    : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            total_industries: industryMap.size,
            top_industries: topIndustries
        };
    }

    private static calculateRegionalSummary(companies: PortfolioCompany[]) {
        const regionMap = new Map<string, { count: number; riskScores: number[] }>();

        companies.forEach(company => {
            const state = company.extracted_data?.about_company?.registered_address?.state || 'Unknown';
            const existing = regionMap.get(state) || { count: 0, riskScores: [] };
            existing.count++;
            if (company.risk_score) {
                existing.riskScores.push(company.risk_score);
            }
            regionMap.set(state, existing);
        });

        const topRegions = Array.from(regionMap.entries())
            .map(([name, data]) => ({
                name,
                count: data.count,
                percentage: (data.count / companies.length) * 100,
                avg_risk_score: data.riskScores.length > 0
                    ? data.riskScores.reduce((sum, score) => sum + score, 0) / data.riskScores.length
                    : 0
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        return {
            total_regions: regionMap.size,
            top_regions: topRegions
        };
    }

    private static calculateEligibilityOverview(companies: PortfolioCompany[]) {
        const companiesWithEligibility = companies.filter(c => c.risk_analysis?.eligibility);

        if (companiesWithEligibility.length === 0) {
            return {
                total_eligible_amount: 0,
                average_eligibility: 0,
                risk_adjusted_exposure: 0
            };
        }

        const totalEligibleAmount = companiesWithEligibility.reduce(
            (sum, c) => sum + c.risk_analysis!.eligibility.finalEligibility, 0
        );

        const averageEligibility = totalEligibleAmount / companiesWithEligibility.length;

        const riskAdjustedExposure = companiesWithEligibility.reduce(
            (sum, c) => {
                const eligibility = c.risk_analysis!.eligibility;
                return sum + (eligibility.finalEligibility * eligibility.riskMultiplier);
            }, 0
        );

        return {
            total_eligible_amount: totalEligibleAmount,
            average_eligibility: averageEligibility,
            risk_adjusted_exposure: riskAdjustedExposure
        };
    }

    private static calculateComplianceOverview(companies: PortfolioCompany[]): ComplianceSummary {
        return this.calculateComplianceStatus(companies);
    }

    private static calculateCategoryPerformance(companies: PortfolioCompany[]) {
        const categories = ['Financial', 'Business', 'Hygiene', 'Banking'];
        const categoryPerformance: Record<string, any> = {};

        categories.forEach(category => {
            const categoryScores: number[] = [];
            const categoryMaxScores: number[] = [];
            const parameterScores = new Map<string, number[]>();

            companies.forEach(company => {
                let categoryResult: CategoryResult | undefined;
                let categoryParameterScores: ParameterScore[] = [];

                switch (category) {
                    case 'Financial':
                        categoryResult = company.risk_analysis?.financialResult;
                        categoryParameterScores = company.risk_analysis?.financialScores || [];
                        break;
                    case 'Business':
                        categoryResult = company.risk_analysis?.businessResult;
                        categoryParameterScores = company.risk_analysis?.businessScores || [];
                        break;
                    case 'Hygiene':
                        categoryResult = company.risk_analysis?.hygieneResult;
                        categoryParameterScores = company.risk_analysis?.hygieneScores || [];
                        break;
                    case 'Banking':
                        categoryResult = company.risk_analysis?.bankingResult;
                        categoryParameterScores = company.risk_analysis?.bankingScores || [];
                        break;
                }

                if (categoryResult) {
                    categoryScores.push(categoryResult.score);
                    categoryMaxScores.push(categoryResult.maxScore);
                }

                // Collect parameter scores
                categoryParameterScores.forEach(paramScore => {
                    if (paramScore.available) {
                        if (!parameterScores.has(paramScore.parameter)) {
                            parameterScores.set(paramScore.parameter, []);
                        }
                        parameterScores.get(paramScore.parameter)!.push(paramScore.score);
                    }
                });
            });

            if (categoryScores.length > 0) {
                const averageScore = categoryScores.reduce((sum, score) => sum + score, 0) / categoryScores.length;
                const maxPossibleScore = categoryMaxScores.reduce((sum, max) => sum + max, 0) / categoryMaxScores.length;
                const percentage = maxPossibleScore > 0 ? (averageScore / maxPossibleScore) * 100 : 0;

                // Get top and bottom parameters
                const parameterAverages = Array.from(parameterScores.entries())
                    .map(([parameter, scores]) => ({
                        parameter,
                        average_score: scores.reduce((sum, score) => sum + score, 0) / scores.length,
                        benchmark_category: this.getBenchmarkCategory(
                            scores.reduce((sum, score) => sum + score, 0) / scores.length
                        )
                    }))
                    .sort((a, b) => b.average_score - a.average_score);

                categoryPerformance[category] = {
                    average_score: averageScore,
                    max_possible_score: maxPossibleScore,
                    percentage: percentage,
                    parameter_count: parameterScores.size,
                    available_parameters: parameterScores.size,
                    top_parameters: parameterAverages.slice(0, 5),
                    bottom_parameters: parameterAverages.slice(-5).reverse()
                };
            }
        });

        return categoryPerformance;
    }

    private static calculateParameterBenchmarks(companies: PortfolioCompany[]) {
        const parameterStats = new Map<string, {
            category: string;
            scores: number[];
            maxScores: number[];
            benchmarks: string[];
        }>();

        companies.forEach(company => {
            const allScores = company.risk_analysis?.allScores || [];

            allScores.forEach(score => {
                if (!score.available) return;

                if (!parameterStats.has(score.parameter)) {
                    parameterStats.set(score.parameter, {
                        category: this.getParameterCategory(score.parameter, company),
                        scores: [],
                        maxScores: [],
                        benchmarks: []
                    });
                }

                const stats = parameterStats.get(score.parameter)!;
                stats.scores.push(score.score);
                stats.maxScores.push(score.maxScore);
                stats.benchmarks.push(score.benchmark);
            });
        });

        return Array.from(parameterStats.entries()).map(([parameter, stats]) => {
            const portfolioAverage = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length;
            const maxScoreAverage = stats.maxScores.reduce((sum, max) => sum + max, 0) / stats.maxScores.length;

            // Calculate benchmark thresholds
            const excellentThreshold = maxScoreAverage * 0.9;
            const goodThreshold = maxScoreAverage * 0.75;
            const averageThreshold = maxScoreAverage * 0.6;
            const poorThreshold = maxScoreAverage * 0.4;

            // Count companies in each category
            const companyCounts = {
                excellent: 0,
                good: 0,
                average: 0,
                poor: 0,
                critical: 0
            };

            stats.scores.forEach(score => {
                if (score >= excellentThreshold) companyCounts.excellent++;
                else if (score >= goodThreshold) companyCounts.good++;
                else if (score >= averageThreshold) companyCounts.average++;
                else if (score >= poorThreshold) companyCounts.poor++;
                else companyCounts.critical++;
            });

            // Determine performance rating
            let performanceRating = 'Critical Risk';
            if (portfolioAverage >= excellentThreshold) performanceRating = 'Excellent';
            else if (portfolioAverage >= goodThreshold) performanceRating = 'Good';
            else if (portfolioAverage >= averageThreshold) performanceRating = 'Average';
            else if (portfolioAverage >= poorThreshold) performanceRating = 'Poor';

            return {
                parameter,
                category: stats.category,
                portfolio_average: portfolioAverage,
                excellent_threshold: excellentThreshold,
                good_threshold: goodThreshold,
                average_threshold: averageThreshold,
                poor_threshold: poorThreshold,
                performance_rating: performanceRating,
                companies_excellent: companyCounts.excellent,
                companies_good: companyCounts.good,
                companies_average: companyCounts.average,
                companies_poor: companyCounts.poor,
                companies_critical: companyCounts.critical
            };
        });
    }

    private static calculateIndustryRiskDistribution(riskGrades: string[]): Record<string, number> {
        const distribution: Record<string, number> = {};

        riskGrades.forEach(grade => {
            const normalizedGrade = grade.toLowerCase();
            distribution[normalizedGrade] = (distribution[normalizedGrade] || 0) + 1;
        });

        return distribution;
    }

    private static calculateOverallAccuracy(companies: PortfolioCompany[]): number {
        const totalParameters = companies.reduce((sum, c) => sum + (c.total_parameters || 0), 0);
        const availableParameters = companies.reduce((sum, c) => sum + (c.available_parameters || 0), 0);

        return totalParameters > 0 ? (availableParameters / totalParameters) * 100 : 0;
    }

    private static calculateParameterAvailability(companies: PortfolioCompany[]) {
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

            available.financial += financialScores.filter(s => s.available).length;
            available.business += businessScores.filter(s => s.available).length;
            available.hygiene += hygieneScores.filter(s => s.available).length;
            available.banking += bankingScores.filter(s => s.available).length;
            available.overall += company.available_parameters || 0;
        });

        return {
            financial: totals.financial > 0 ? (available.financial / totals.financial) * 100 : 0,
            business: totals.business > 0 ? (available.business / totals.business) * 100 : 0,
            hygiene: totals.hygiene > 0 ? (available.hygiene / totals.hygiene) * 100 : 0,
            banking: totals.banking > 0 ? (available.banking / totals.banking) * 100 : 0,
            overall: totals.overall > 0 ? (available.overall / totals.overall) * 100 : 0
        };
    }

    private static calculateGradeDistribution(companies: PortfolioCompany[]) {
        const gradeStats = new Map<string, { count: number; scores: number[] }>();

        companies.forEach(company => {
            const grade = company.risk_analysis?.overallGrade?.grade || 'Unknown';
            const score = company.risk_score || 0;

            if (!gradeStats.has(grade)) {
                gradeStats.set(grade, { count: 0, scores: [] });
            }

            const stats = gradeStats.get(grade)!;
            stats.count++;
            stats.scores.push(score);
        });

        const distribution: Record<string, any> = {};

        gradeStats.forEach((stats, grade) => {
            const avgScore = stats.scores.reduce((sum, score) => sum + score, 0) / stats.scores.length;
            const minScore = Math.min(...stats.scores);
            const maxScore = Math.max(...stats.scores);

            distribution[grade] = {
                count: stats.count,
                percentage: (stats.count / companies.length) * 100,
                avg_score: avgScore,
                score_range: [minScore, maxScore] as [number, number]
            };
        });

        return distribution;
    }

    private static calculateModelConsistency(companies: PortfolioCompany[]) {
        const riskScores = companies
            .map(c => c.risk_score)
            .filter((score): score is number => score !== null);

        if (riskScores.length === 0) {
            return {
                score_variance: 0,
                grade_stability: 0,
                prediction_confidence: 0
            };
        }

        // Calculate variance
        const mean = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
        const variance = riskScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / riskScores.length;

        // Calculate grade stability (how evenly distributed grades are)
        const gradeDistribution = this.calculateRiskDistribution(companies);
        const gradePercentages = Object.values(gradeDistribution.distribution_percentages);
        const gradeStability = 100 - (Math.max(...gradePercentages) - Math.min(...gradePercentages));

        // Calculate prediction confidence based on parameter availability
        const avgParameterAvailability = companies.reduce((sum, c) => {
            const total = c.total_parameters || 0;
            const available = c.available_parameters || 0;
            return sum + (total > 0 ? (available / total) * 100 : 0);
        }, 0) / companies.length;

        return {
            score_variance: variance,
            grade_stability: Math.max(0, gradeStability),
            prediction_confidence: avgParameterAvailability
        };
    }

    private static calculateValidationMetrics(companies: PortfolioCompany[]) {
        const companiesWithCompleteData = companies.filter(c => {
            const hasFinancialData = c.extracted_data?.financial_data !== null;
            const hasRiskAnalysis = c.risk_analysis !== null;
            const hasBasicInfo = c.company_name && c.industry;
            return hasFinancialData && hasRiskAnalysis && hasBasicInfo;
        }).length;

        const dataCompletenessPercentage = (companiesWithCompleteData / companies.length) * 100;

        // Calculate model coverage by type
        const modelCoverage: Record<string, number> = {};
        const modelTypes = ['with_banking', 'without_banking'];

        modelTypes.forEach(modelType => {
            const companiesWithModel = companies.filter(c => c.model_type === modelType).length;
            modelCoverage[modelType] = (companiesWithModel / companies.length) * 100;
        });

        return {
            companies_with_complete_data: companiesWithCompleteData,
            data_completeness_percentage: dataCompletenessPercentage,
            model_coverage: modelCoverage
        };
    }

    private static getParameterCategory(parameter: string, company: PortfolioCompany): string {
        const riskAnalysis = company.risk_analysis;
        if (!riskAnalysis) return 'Unknown';

        if (riskAnalysis.financialScores?.some(s => s.parameter === parameter)) return 'Financial';
        if (riskAnalysis.businessScores?.some(s => s.parameter === parameter)) return 'Business';
        if (riskAnalysis.hygieneScores?.some(s => s.parameter === parameter)) return 'Hygiene';
        if (riskAnalysis.bankingScores?.some(s => s.parameter === parameter)) return 'Banking';

        return 'Unknown';
    }

    private static getBenchmarkCategory(score: number): string {
        if (score >= 90) return 'Excellent';
        if (score >= 75) return 'Good';
        if (score >= 60) return 'Average';
        if (score >= 40) return 'Poor';
        return 'Critical Risk';
    }
}