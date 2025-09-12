/**
 * Compliance Analytics API Endpoint
 * 
 * Provides compliance analysis including:
 * - GST compliance status
 * - EPFO compliance status
 * - Audit qualification status
 * - Compliance heatmap data
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
import { FilterCriteria, ProcessingStatus } from '@/types/portfolio.types';

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
        const industries = searchParams.get('industries');
        if (industries) {
            filters.industries = industries.split(',');
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
                    compliance_heatmap: {
                        gst_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                        epfo_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                        audit_status: { qualified: 0, unqualified: 0, unknown: 0 }
                    }
                }
            });
        }

        // Calculate comprehensive compliance metrics
        const companies = portfolioData.companies;
        const complianceMetrics = calculateComprehensiveComplianceMetrics(companies);

        // Calculate regional compliance breakdown
        const regionalCompliance = calculateRegionalComplianceBreakdown(companies);

        // Calculate industry compliance breakdown
        const industryCompliance = calculateIndustryComplianceBreakdown(companies);

        // Calculate compliance trends if date range is provided
        let complianceTrends = {};
        if (filters.date_range) {
            complianceTrends = calculateComplianceTrends(companies, filters.date_range);
        }

        // Calculate compliance benchmarking
        const complianceBenchmarks = calculateComplianceBenchmarks(companies, filters);

        return NextResponse.json({
            success: true,
            data: {
                compliance_heatmap: complianceMetrics.heatmap,
                compliance_summary: complianceMetrics.summary,
                regional_breakdown: regionalCompliance,
                industry_breakdown: industryCompliance,
                compliance_trends: complianceTrends,
                compliance_benchmarks: complianceBenchmarks,
                metadata: {
                    total_companies_analyzed: companies.length,
                    total_companies_in_portfolio: portfolioData.total_count,
                    filters_applied: Object.keys(filters).length > 0,
                    applied_filters: {
                        risk_grades: filters.risk_grades?.length || 0,
                        risk_score_range: filters.risk_score_range ? 1 : 0,
                        regions: filters.regions?.length || 0,
                        cities: filters.cities?.length || 0,
                        industries: filters.industries?.length || 0,
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
        console.error('Compliance analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate compliance analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

// Helper functions

function calculateComprehensiveComplianceMetrics(companies: any[]) {
    const gstCompliance = { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 };
    const epfoCompliance = { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 };
    const auditStatus = { qualified: 0, unqualified: 0, unknown: 0 };

    const detailedMetrics = {
        gst_details: [] as any[],
        epfo_details: [] as any[],
        audit_details: [] as any[]
    };

    companies.forEach(company => {
        const allScores = company.risk_analysis?.allScores || [];

        // GST Compliance Analysis
        const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)");
        let gstStatus = 'unknown';
        let gstRate = 0;

        if (gstData?.available && gstData.details?.compliance_rate !== undefined) {
            gstRate = gstData.details.compliance_rate;
            if (gstRate >= 85) {
                gstStatus = 'compliant';
                gstCompliance.compliant++;
            } else if (gstRate < 70) {
                gstStatus = 'non_compliant';
                gstCompliance.non_compliant++;
            } else {
                gstStatus = 'partial';
                gstCompliance.partial++;
            }
        } else {
            gstCompliance.unknown++;
        }

        detailedMetrics.gst_details.push({
            company_id: company.request_id,
            company_name: company.company_name,
            status: gstStatus,
            compliance_rate: gstRate,
            risk_score: company.risk_score,
            industry: company.industry,
            region: company.extracted_data?.about_company?.registered_address?.state
        });

        // EPFO Compliance Analysis
        const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)");
        let epfoStatus = 'unknown';
        let epfoRate = 0;

        if (pfData?.available && pfData.details?.effective_compliance_rate !== undefined) {
            epfoRate = pfData.details.effective_compliance_rate;
            if (epfoRate >= 85) {
                epfoStatus = 'compliant';
                epfoCompliance.compliant++;
            } else if (epfoRate < 70) {
                epfoStatus = 'non_compliant';
                epfoCompliance.non_compliant++;
            } else {
                epfoStatus = 'partial';
                epfoCompliance.partial++;
            }
        } else {
            epfoCompliance.unknown++;
        }

        detailedMetrics.epfo_details.push({
            company_id: company.request_id,
            company_name: company.company_name,
            status: epfoStatus,
            compliance_rate: epfoRate,
            risk_score: company.risk_score,
            industry: company.industry,
            region: company.extracted_data?.about_company?.registered_address?.state
        });

        // Audit Status (simplified for now)
        auditStatus.unknown++;
        detailedMetrics.audit_details.push({
            company_id: company.request_id,
            company_name: company.company_name,
            status: 'unknown',
            risk_score: company.risk_score,
            industry: company.industry,
            region: company.extracted_data?.about_company?.registered_address?.state
        });
    });

    const totalCompanies = companies.length;

    return {
        heatmap: {
            gst_compliance: gstCompliance,
            epfo_compliance: epfoCompliance,
            audit_status: auditStatus,
            total_companies: totalCompanies
        },
        summary: {
            overall_compliance_score: calculateOverallComplianceScore(gstCompliance, epfoCompliance, totalCompanies),
            compliance_distribution: {
                fully_compliant: companies.filter(c => {
                    const gstDetail = detailedMetrics.gst_details.find(d => d.company_id === c.request_id);
                    const epfoDetail = detailedMetrics.epfo_details.find(d => d.company_id === c.request_id);
                    return gstDetail?.status === 'compliant' && epfoDetail?.status === 'compliant';
                }).length,
                partially_compliant: companies.filter(c => {
                    const gstDetail = detailedMetrics.gst_details.find(d => d.company_id === c.request_id);
                    const epfoDetail = detailedMetrics.epfo_details.find(d => d.company_id === c.request_id);
                    return (gstDetail?.status === 'compliant' || epfoDetail?.status === 'compliant') &&
                        (gstDetail?.status !== 'compliant' || epfoDetail?.status !== 'compliant');
                }).length,
                non_compliant: companies.filter(c => {
                    const gstDetail = detailedMetrics.gst_details.find(d => d.company_id === c.request_id);
                    const epfoDetail = detailedMetrics.epfo_details.find(d => d.company_id === c.request_id);
                    return gstDetail?.status === 'non_compliant' && epfoDetail?.status === 'non_compliant';
                }).length
            }
        },
        detailed_metrics: detailedMetrics
    };
}

function calculateOverallComplianceScore(gstCompliance: any, epfoCompliance: any, totalCompanies: number): number {
    if (totalCompanies === 0) return 0;

    const gstScore = ((gstCompliance.compliant * 100) + (gstCompliance.partial * 50)) / totalCompanies;
    const epfoScore = ((epfoCompliance.compliant * 100) + (epfoCompliance.partial * 50)) / totalCompanies;

    return (gstScore + epfoScore) / 2;
}

function calculateRegionalComplianceBreakdown(companies: any[]) {
    const regionalBreakdown = new Map<string, {
        companies: any[];
        gst_compliance: Record<string, number>;
        epfo_compliance: Record<string, number>;
    }>();

    companies.forEach(company => {
        const region = company.extracted_data?.about_company?.registered_address?.state ||
            company.extracted_data?.about_company?.business_address?.state ||
            'Unknown';

        if (!regionalBreakdown.has(region)) {
            regionalBreakdown.set(region, {
                companies: [],
                gst_compliance: { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 },
                epfo_compliance: { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 }
            });
        }

        const regionData = regionalBreakdown.get(region)!;
        regionData.companies.push(company);

        // Calculate GST compliance for this region
        const allScores = company.risk_analysis?.allScores || [];
        const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)");

        if (gstData?.available && gstData.details?.compliance_rate !== undefined) {
            const rate = gstData.details.compliance_rate;
            if (rate >= 85) regionData.gst_compliance.compliant++;
            else if (rate < 70) regionData.gst_compliance.non_compliant++;
            else regionData.gst_compliance.partial++;
        } else {
            regionData.gst_compliance.unknown++;
        }

        // Calculate EPFO compliance for this region
        const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)");

        if (pfData?.available && pfData.details?.effective_compliance_rate !== undefined) {
            const rate = pfData.details.effective_compliance_rate;
            if (rate >= 85) regionData.epfo_compliance.compliant++;
            else if (rate < 70) regionData.epfo_compliance.non_compliant++;
            else regionData.epfo_compliance.partial++;
        } else {
            regionData.epfo_compliance.unknown++;
        }
    });

    const breakdown: Record<string, any> = {};
    regionalBreakdown.forEach((data, region) => {
        const totalCompanies = data.companies.length;
        breakdown[region] = {
            company_count: totalCompanies,
            gst_compliance: data.gst_compliance,
            epfo_compliance: data.epfo_compliance,
            compliance_percentages: {
                gst_compliant_percentage: ((data.gst_compliance.compliant / totalCompanies) * 100).toFixed(2) + '%',
                epfo_compliant_percentage: ((data.epfo_compliance.compliant / totalCompanies) * 100).toFixed(2) + '%'
            },
            overall_compliance_score: calculateOverallComplianceScore(
                data.gst_compliance,
                data.epfo_compliance,
                totalCompanies
            ),
            avg_risk_score: data.companies.reduce((sum, c) => sum + (c.risk_score || 0), 0) / totalCompanies
        };
    });

    return breakdown;
}

function calculateIndustryComplianceBreakdown(companies: any[]) {
    const industryBreakdown = new Map<string, {
        companies: any[];
        gst_compliance: Record<string, number>;
        epfo_compliance: Record<string, number>;
    }>();

    companies.forEach(company => {
        const industry = company.industry || 'Unknown';

        if (!industryBreakdown.has(industry)) {
            industryBreakdown.set(industry, {
                companies: [],
                gst_compliance: { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 },
                epfo_compliance: { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 }
            });
        }

        const industryData = industryBreakdown.get(industry)!;
        industryData.companies.push(company);

        // Calculate GST compliance for this industry
        const allScores = company.risk_analysis?.allScores || [];
        const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)");

        if (gstData?.available && gstData.details?.compliance_rate !== undefined) {
            const rate = gstData.details.compliance_rate;
            if (rate >= 85) industryData.gst_compliance.compliant++;
            else if (rate < 70) industryData.gst_compliance.non_compliant++;
            else industryData.gst_compliance.partial++;
        } else {
            industryData.gst_compliance.unknown++;
        }

        // Calculate EPFO compliance for this industry
        const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)");

        if (pfData?.available && pfData.details?.effective_compliance_rate !== undefined) {
            const rate = pfData.details.effective_compliance_rate;
            if (rate >= 85) industryData.epfo_compliance.compliant++;
            else if (rate < 70) industryData.epfo_compliance.non_compliant++;
            else industryData.epfo_compliance.partial++;
        } else {
            industryData.epfo_compliance.unknown++;
        }
    });

    const breakdown: Record<string, any> = {};
    industryBreakdown.forEach((data, industry) => {
        const totalCompanies = data.companies.length;
        breakdown[industry] = {
            company_count: totalCompanies,
            gst_compliance: data.gst_compliance,
            epfo_compliance: data.epfo_compliance,
            compliance_percentages: {
                gst_compliant_percentage: ((data.gst_compliance.compliant / totalCompanies) * 100).toFixed(2) + '%',
                epfo_compliant_percentage: ((data.epfo_compliance.compliant / totalCompanies) * 100).toFixed(2) + '%'
            },
            overall_compliance_score: calculateOverallComplianceScore(
                data.gst_compliance,
                data.epfo_compliance,
                totalCompanies
            ),
            avg_risk_score: data.companies.reduce((sum, c) => sum + (c.risk_score || 0), 0) / totalCompanies,
            total_exposure: data.companies.reduce((sum, c) => sum + (c.recommended_limit || 0), 0)
        };
    });

    return breakdown;
}

function calculateComplianceTrends(companies: any[], dateRange: [Date, Date]) {
    // Group companies by month within the date range
    const monthlyData = new Map<string, any[]>();

    companies.forEach(company => {
        if (company.completed_at) {
            const date = new Date(company.completed_at);
            if (date >= dateRange[0] && date <= dateRange[1]) {
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

                if (!monthlyData.has(monthKey)) {
                    monthlyData.set(monthKey, []);
                }
                monthlyData.get(monthKey)!.push(company);
            }
        }
    });

    const trends: Record<string, any> = {};
    monthlyData.forEach((monthCompanies, month) => {
        const monthMetrics = calculateComprehensiveComplianceMetrics(monthCompanies);
        trends[month] = {
            company_count: monthCompanies.length,
            gst_compliance_rate: monthMetrics.heatmap.total_companies > 0
                ? ((monthMetrics.heatmap.gst_compliance.compliant / monthMetrics.heatmap.total_companies) * 100).toFixed(2)
                : '0',
            epfo_compliance_rate: monthMetrics.heatmap.total_companies > 0
                ? ((monthMetrics.heatmap.epfo_compliance.compliant / monthMetrics.heatmap.total_companies) * 100).toFixed(2)
                : '0',
            overall_compliance_score: monthMetrics.summary.overall_compliance_score
        };
    });

    return trends;
}

function calculateComplianceBenchmarks(companies: any[], appliedFilters: FilterCriteria) {
    const totalCompanies = companies.length;
    if (totalCompanies === 0) return {};

    const complianceMetrics = calculateComprehensiveComplianceMetrics(companies);

    return {
        dataset_context: {
            total_companies: totalCompanies,
            is_filtered: Object.keys(appliedFilters).length > 0,
            applied_filters: Object.keys(appliedFilters).filter(key =>
                appliedFilters[key as keyof FilterCriteria] !== undefined
            )
        },
        compliance_benchmarks: {
            gst_compliance: {
                excellent: complianceMetrics.heatmap.gst_compliance.compliant,
                good: complianceMetrics.heatmap.gst_compliance.partial,
                poor: complianceMetrics.heatmap.gst_compliance.non_compliant,
                unknown: complianceMetrics.heatmap.gst_compliance.unknown,
                benchmark_score: totalCompanies > 0
                    ? ((complianceMetrics.heatmap.gst_compliance.compliant / totalCompanies) * 100).toFixed(2) + '%'
                    : '0%'
            },
            epfo_compliance: {
                excellent: complianceMetrics.heatmap.epfo_compliance.compliant,
                good: complianceMetrics.heatmap.epfo_compliance.partial,
                poor: complianceMetrics.heatmap.epfo_compliance.non_compliant,
                unknown: complianceMetrics.heatmap.epfo_compliance.unknown,
                benchmark_score: totalCompanies > 0
                    ? ((complianceMetrics.heatmap.epfo_compliance.compliant / totalCompanies) * 100).toFixed(2) + '%'
                    : '0%'
            }
        },
        risk_correlation: {
            high_compliance_avg_risk: companies
                .filter(c => {
                    const allScores = c.risk_analysis?.allScores || [];
                    const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)");
                    const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)");

                    const gstCompliant = gstData?.available && gstData.details?.compliance_rate >= 85;
                    const epfoCompliant = pfData?.available && pfData.details?.effective_compliance_rate >= 85;

                    return gstCompliant && epfoCompliant;
                })
                .reduce((sum, c, _, arr) => sum + (c.risk_score || 0) / arr.length, 0),
            low_compliance_avg_risk: companies
                .filter(c => {
                    const allScores = c.risk_analysis?.allScores || [];
                    const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)");
                    const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)");

                    const gstNonCompliant = gstData?.available && gstData.details?.compliance_rate < 70;
                    const epfoNonCompliant = pfData?.available && pfData.details?.effective_compliance_rate < 70;

                    return gstNonCompliant || epfoNonCompliant;
                })
                .reduce((sum, c, _, arr) => arr.length > 0 ? sum + (c.risk_score || 0) / arr.length : 0, 0)
        }
    };
}