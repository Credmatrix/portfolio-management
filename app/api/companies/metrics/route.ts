import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET() {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get overall metrics
        const { data: metricsData, error: metricsError } = await supabase
            .from('document_processing_requests')
            .select(`
        company_name,
        cin,
        pan,
        risk_score,
        recommended_limit,
        credit_rating,
        status,
        sector,
        credit_management(actual_credit_limit_approved)
      `)
            .not('company_name', 'is', null)
            .eq('status', 'completed')
            .eq('user_id', user.id);

        if (metricsError) {
            console.error('Metrics error:', metricsError);
            return NextResponse.json(
                { error: 'Failed to fetch metrics' },
                { status: 500 }
            );
        }

        // Group by unique companies
        const uniqueCompanies = new Map();
        metricsData?.forEach((request) => {
            const key = request.cin || request.pan || request.company_name;
            if (!uniqueCompanies.has(key)) {
                uniqueCompanies.set(key, request);
            }
        });

        const companies = Array.from(uniqueCompanies.values());

        // Calculate metrics
        const totalCompanies = companies.length;
        const totalCreditLimit = companies.reduce((sum, company) => {
            const limit = company.recommended_limit || 0;
            return sum + (typeof limit === 'number' ? limit : 0);
        }, 0);

        const averageRiskScore = companies.length > 0
            ? companies.reduce((sum, company) => sum + (company.risk_score || 0), 0) / companies.length
            : 0;

        // Risk distribution
        const riskDistribution = {
            low: companies.filter(c => (c.risk_score || 0) >= 80).length,
            medium: companies.filter(c => (c.risk_score || 0) >= 60 && (c.risk_score || 0) < 80).length,
            high: companies.filter(c => (c.risk_score || 0) < 60).length
        };

        // Industry breakdown
        const industryBreakdown = companies.reduce((acc, company) => {
            const industry = company.sector || 'Unknown';
            acc[industry] = (acc[industry] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return NextResponse.json({
            totalCompanies,
            totalCreditLimit,
            averageRiskScore: Math.round(averageRiskScore),
            riskDistribution,
            industryBreakdown,
            activeCompanies: companies.filter(c => c.status === 'completed').length
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}