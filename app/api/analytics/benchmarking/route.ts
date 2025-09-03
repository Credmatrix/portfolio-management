/**
 * Benchmarking Analytics API Endpoint
 * 
 * Provides benchmarking analysis including:
 * - Industry benchmarks
 * - Peer comparison
 * - Performance rankings
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
        const companyId = searchParams.get('companyId');
        const limit = parseInt(searchParams.get('limit') || '1000');

        if (!companyId) {
            return NextResponse.json({ error: 'Company ID is required' }, { status: 400 });
        }

        // Get the specific company
        const company = await portfolioRepository.getCompanyByRequestId(companyId, user.id);
        if (!company) {
            return NextResponse.json({ error: 'Company not found' }, { status: 404 });
        }

        // Get all companies for benchmarking
        const portfolioData = await portfolioRepository.getPortfolioOverview(
            {},
            { field: 'completed_at', direction: 'desc' },
            { page: 1, limit },
            user.id
        );

        if (!portfolioData.companies || portfolioData.companies.length === 0) {
            return NextResponse.json({
                success: true,
                data: {
                    benchmark_data: {
                        company_name: company.company_name,
                        industry_benchmark: {},
                        peer_comparison: {},
                        performance_ranking: {}
                    }
                }
            });
        }

        // Calculate benchmarks
        const companies = portfolioData.companies;
        const industryPeers = companies.filter(c => 
            c.industry === company.industry && c.request_id !== company.request_id
        );

        // Industry benchmark
        const industryBenchmark = calculateIndustryBenchmark(company, industryPeers);
        
        // Peer comparison
        const peerComparison = calculatePeerComparison(company, industryPeers);
        
        // Performance ranking
        const performanceRanking = calculatePerformanceRanking(company, companies);

        return NextResponse.json({
            success: true,
            data: {
                benchmark_data: {
                    company_name: company.company_name,
                    company_id: company.request_id,
                    industry: company.industry,
                    risk_score: company.risk_score,
                    risk_grade: company.risk_grade,
                    industry_benchmark: industryBenchmark,
                    peer_comparison: peerComparison,
                    performance_ranking: performanceRanking,
                    total_peers: industryPeers.length,
                    total_companies: companies.length
                }
            }
        });

    } catch (error) {
        console.error('Benchmarking analytics error:', error);
        return NextResponse.json({
            error: 'Failed to calculate benchmarking analytics',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}

function calculateIndustryBenchmark(company: any, industryPeers: any[]) {
    if (industryPeers.length === 0) {
        return {
            industry_average_risk_score: 0,
            company_vs_industry: 0,
            percentile_rank: 0,
            performance_category: 'No peers available'
        };
    }

    const industryRiskScores = industryPeers
        .map(p => p.risk_score)
        .filter(score => score !== null && score !== undefined);

    if (industryRiskScores.length === 0) {
        return {
            industry_average_risk_score: 0,
            company_vs_industry: 0,
            percentile_rank: 0,
            performance_category: 'No risk scores available'
        };
    }

    const industryAverage = industryRiskScores.reduce((sum, score) => sum + score, 0) / industryRiskScores.length;
    const companyRiskScore = company.risk_score || 0;
    const companyVsIndustry = companyRiskScore - industryAverage;

    // Calculate percentile rank
    const betterThanCount = industryRiskScores.filter(score => companyRiskScore > score).length;
    const percentileRank = (betterThanCount / industryRiskScores.length) * 100;

    // Determine performance category
    let performanceCategory = 'Average';
    if (percentileRank >= 90) performanceCategory = 'Top 10%';
    else if (percentileRank >= 75) performanceCategory = 'Top 25%';
    else if (percentileRank >= 50) performanceCategory = 'Above Average';
    else if (percentileRank >= 25) performanceCategory = 'Below Average';
    else performanceCategory = 'Bottom 25%';

    return {
        industry_average_risk_score: industryAverage,
        company_vs_industry: companyVsIndustry,
        percentile_rank: percentileRank,
        performance_category: performanceCategory,
        industry_peer_count: industryPeers.length
    };
}

function calculatePeerComparison(company: any, industryPeers: any[]) {
    if (industryPeers.length === 0) {
        return {
            similar_companies: [],
            better_performing_peers: [],
            lower_performing_peers: []
        };
    }

    const companyRiskScore = company.risk_score || 0;
    const companyExposure = company.recommended_limit || 0;

    // Find similar companies (within 10% risk score range and similar exposure)
    const similarCompanies = industryPeers.filter(peer => {
        const peerRiskScore = peer.risk_score || 0;
        const peerExposure = peer.recommended_limit || 0;
        
        const riskScoreDiff = Math.abs(peerRiskScore - companyRiskScore);
        const exposureDiff = Math.abs(peerExposure - companyExposure);
        
        return riskScoreDiff <= (companyRiskScore * 0.1) && 
               exposureDiff <= (companyExposure * 0.5);
    }).slice(0, 5);

    // Better performing peers
    const betterPerformingPeers = industryPeers
        .filter(peer => (peer.risk_score || 0) > companyRiskScore)
        .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
        .slice(0, 5);

    // Lower performing peers
    const lowerPerformingPeers = industryPeers
        .filter(peer => (peer.risk_score || 0) < companyRiskScore)
        .sort((a, b) => (a.risk_score || 0) - (b.risk_score || 0))
        .slice(0, 5);

    return {
        similar_companies: similarCompanies.map(peer => ({
            company_name: peer.company_name,
            risk_score: peer.risk_score,
            risk_grade: peer.risk_grade,
            recommended_limit: peer.recommended_limit
        })),
        better_performing_peers: betterPerformingPeers.map(peer => ({
            company_name: peer.company_name,
            risk_score: peer.risk_score,
            risk_grade: peer.risk_grade,
            score_difference: (peer.risk_score || 0) - companyRiskScore
        })),
        lower_performing_peers: lowerPerformingPeers.map(peer => ({
            company_name: peer.company_name,
            risk_score: peer.risk_score,
            risk_grade: peer.risk_grade,
            score_difference: companyRiskScore - (peer.risk_score || 0)
        }))
    };
}

function calculatePerformanceRanking(company: any, allCompanies: any[]) {
    const companyRiskScore = company.risk_score || 0;
    
    const companiesWithScores = allCompanies.filter(c => 
        c.risk_score !== null && c.risk_score !== undefined
    );

    if (companiesWithScores.length === 0) {
        return {
            overall_rank: 0,
            total_companies: 0,
            percentile: 0
        };
    }

    // Sort by risk score (descending - higher is better)
    companiesWithScores.sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0));

    // Find company's rank
    const companyRank = companiesWithScores.findIndex(c => c.request_id === company.request_id) + 1;
    const percentile = ((companiesWithScores.length - companyRank + 1) / companiesWithScores.length) * 100;

    return {
        overall_rank: companyRank,
        total_companies: companiesWithScores.length,
        percentile: percentile,
        top_performers: companiesWithScores.slice(0, 5).map(c => ({
            company_name: c.company_name,
            risk_score: c.risk_score,
            risk_grade: c.risk_grade
        }))
    };
}