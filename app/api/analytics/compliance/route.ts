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
        const limit = parseInt(searchParams.get('limit') || '1000');
        const page = parseInt(searchParams.get('page') || '1');

        // Parse filters
        const filters: FilterCriteria = {};

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
                    compliance_heatmap: {
                        gst_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                        epfo_compliance: { compliant: 0, non_compliant: 0, unknown: 0 },
                        audit_status: { qualified: 0, unqualified: 0, unknown: 0 }
                    }
                }
            });
        }

        // Calculate compliance metrics
        const companies = portfolioData.companies;
        const gstCompliance = { compliant: 0, non_compliant: 0, unknown: 0 };
        const epfoCompliance = { compliant: 0, non_compliant: 0, unknown: 0 };
        const auditStatus = { qualified: 0, unqualified: 0, unknown: 0 };

        companies.forEach(company => {
            // Extract GST and PF data from allScores in risk_analysis
            const allScores = company.risk_analysis?.allScores || [];

            const gstData = allScores.find(score => score.parameter === "Statutory Payments (GST)");
            const pfData = allScores.find(score => score.parameter === "Statutory Payments (PF)");

            // GST Compliance Analysis
            if (gstData?.available && gstData.details?.compliance_rate !== undefined) {
                const complianceRate = gstData.details.compliance_rate;
                if (complianceRate >= 85) {
                    gstCompliance.compliant++;
                } else if (complianceRate < 70) {
                    gstCompliance.non_compliant++;
                } else {
                    // 70-84% range - could be considered moderate/unknown
                    gstCompliance.unknown++;
                }
            } else {
                gstCompliance.unknown++;
            }

            // EPFO Compliance Analysis
            if (pfData?.available && pfData.details?.effective_compliance_rate !== undefined) {
                const complianceRate = pfData.details.effective_compliance_rate;
                if (complianceRate >= 85) {
                    epfoCompliance.compliant++;
                } else if (complianceRate < 70) {
                    epfoCompliance.non_compliant++;
                } else {
                    // 70-84% range - could be considered moderate/unknown
                    epfoCompliance.unknown++;
                }
            } else {
                epfoCompliance.unknown++;
            }
        });

        return NextResponse.json({
            success: true,
            data: {
                compliance_heatmap: {
                    gst_compliance: gstCompliance,
                    epfo_compliance: epfoCompliance,
                    total_companies: companies.length
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