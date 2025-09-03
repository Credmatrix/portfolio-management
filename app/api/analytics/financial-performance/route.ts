/**
 * Financial Performance Analytics API Endpoint
 * 
 * Provides comprehensive financial performance analytics including trends analysis,
 * peer comparison, portfolio exposure calculation, risk model performance metrics,
 * benchmark analysis, and credit eligibility trends.
 */

import { NextRequest, NextResponse } from 'next/server';
import { FinancialAnalyticsService } from '@/lib/services/financial-analytics.service';
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository';
const portfolioRepository = new PortfolioRepository()

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '100');
        const offset = parseInt(searchParams.get('offset') || '0');

        // Get portfolio companies
        const portfolioData = await portfolioRepository.getPortfolioOverview();

        if (!portfolioData.companies || portfolioData.companies.length === 0) {
            return NextResponse.json({
                error: 'No companies found in portfolio'
            }, { status: 404 });
        }

        // Calculate comprehensive financial analytics
        const analytics = FinancialAnalyticsService.getComprehensiveFinancialAnalytics(
            portfolioData.companies
        );

        return NextResponse.json({
            success: true,
            data: {
                ...analytics,
                metadata: {
                    total_companies_analyzed: portfolioData.companies.length,
                    companies_with_financial_data: portfolioData.companies.filter(
                        c => c.extracted_data?.financial_data
                    ).length,
                    companies_with_risk_analysis: portfolioData.companies.filter(
                        c => c.risk_analysis
                    ).length,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Financial analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate financial analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { company_ids, metrics } = body;

        if (!company_ids || !Array.isArray(company_ids)) {
            return NextResponse.json({
                error: 'company_ids array is required'
            }, { status: 400 });
        }

        // Get specific companies
        const companies = await Promise.all(
            company_ids.map(id => portfolioRepository.getCompanyByRequestId(id))
        );

        const validCompanies = companies.filter(c => c !== null);

        if (validCompanies.length === 0) {
            return NextResponse.json({
                error: 'No valid companies found'
            }, { status: 404 });
        }

        // Calculate specific metrics if requested
        let analytics;
        if (metrics && Array.isArray(metrics)) {
            analytics = {};

            if (metrics.includes('financial_trends')) {
                analytics.financial_trends = FinancialAnalyticsService.calculateFinancialTrends(validCompanies);
            }

            if (metrics.includes('peer_comparison')) {
                analytics.peer_comparison = FinancialAnalyticsService.calculatePeerComparison(validCompanies);
            }

            if (metrics.includes('portfolio_exposure')) {
                analytics.portfolio_exposure = FinancialAnalyticsService.calculatePortfolioExposure(validCompanies);
            }

            if (metrics.includes('risk_model_performance')) {
                analytics.risk_model_performance = FinancialAnalyticsService.calculateRiskModelPerformance(validCompanies);
            }

            if (metrics.includes('benchmark_analysis')) {
                analytics.benchmark_analysis = FinancialAnalyticsService.calculateBenchmarkAnalysis(validCompanies);
            }

            if (metrics.includes('eligibility_trends')) {
                analytics.eligibility_trends = FinancialAnalyticsService.calculateCreditEligibilityTrends(validCompanies);
            }
        } else {
            // Calculate all analytics
            analytics = FinancialAnalyticsService.getComprehensiveFinancialAnalytics(validCompanies);
        }

        return NextResponse.json({
            success: true,
            data: {
                ...analytics,
                metadata: {
                    companies_analyzed: validCompanies.length,
                    requested_companies: company_ids.length,
                    generated_at: new Date().toISOString()
                }
            }
        });

    } catch (error) {
        console.error('Financial analytics POST error:', error);
        return NextResponse.json({
            error: 'Failed to calculate financial analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}