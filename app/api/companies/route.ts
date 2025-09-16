import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);

        // Pagination parameters
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const offset = (page - 1) * limit;

        // Filter parameters
        const search = searchParams.get('search') || '';
        const industry = searchParams.get('industry') || '';
        const creditRating = searchParams.get('creditRating') || '';

        // Build the query
        let query = supabase
            .from('document_processing_requests')
            .select(`
        request_id,
        company_name,
        cin,
        pan,
        sector,
        credit_rating,
        risk_score,
        recommended_limit,
        currency,
        status,
        submitted_at,
        location_city,
        location_state,
        gst_compliance_status,
        epfo_compliance_status,
        credit_management(
          actual_credit_limit_approved,
          limit_validity_date,
          payment_terms,
          security_requirements
        )
      `)
            .not('company_name', 'is', null)
            .eq('status', 'completed')
            .eq('user_id', user.id);

        // Apply filters
        if (search) {
            query = query.or(`company_name.ilike.%${search}%,cin.ilike.%${search}%,pan.ilike.%${search}%`);
        }

        if (industry && industry !== 'all') {
            query = query.eq('sector', industry);
        }

        if (creditRating && creditRating !== 'all') {
            query = query.eq('credit_rating', creditRating);
        }

        // Get total count for pagination
        const { count } = await supabase
            .from('document_processing_requests')
            .select('*', { count: 'exact', head: true })
            .not('company_name', 'is', null)
            .eq('status', 'completed')
            .eq('user_id', user.id);

        // Execute main query with pagination
        const { data, error } = await query
            .order('submitted_at', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch companies' },
                { status: 500 }
            );
        }

        // Group by unique company (CIN/PAN)
        const uniqueCompanies = new Map();

        data?.forEach((request) => {
            const key = request.cin || request.pan || request.company_name;
            if (!uniqueCompanies.has(key)) {
                uniqueCompanies.set(key, {
                    id: request.request_id,
                    name: request.company_name,
                    cin: request.cin,
                    pan: request.pan,
                    industry: request.sector,
                    creditRating: request.credit_rating,
                    riskScore: request.risk_score,
                    recommendedLimit: request.recommended_limit,
                    currency: request.currency,
                    status: 'Active', // Default status
                    lastUpdated: request.submitted_at,
                    location: `${request.location_city || ''}, ${request.location_state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
                    gstCompliance: request.gst_compliance_status,
                    epfoCompliance: request.epfo_compliance_status,
                    actualCreditLimit: request.credit_management?.[0]?.actual_credit_limit_approved,
                    limitValidity: request.credit_management?.[0]?.limit_validity_date,
                    paymentTerms: request.credit_management?.[0]?.payment_terms,
                    securityRequirements: request.credit_management?.[0]?.security_requirements,
                    requestCount: 1,
                    latestRequestId: request.request_id
                });
            } else {
                // Update with latest data if this request is more recent
                const existing = uniqueCompanies.get(key);
                if (request.submitted_at && new Date(request.submitted_at) > new Date(existing.lastUpdated)) {
                    existing.lastUpdated = request.submitted_at;
                    existing.latestRequestId = request.request_id;
                    existing.creditRating = request.credit_rating;
                    existing.riskScore = request.risk_score;
                    existing.recommendedLimit = request.recommended_limit;
                }
                existing.requestCount += 1;
            }
        });

        const companies = Array.from(uniqueCompanies.values());

        return NextResponse.json({
            companies,
            pagination: {
                page,
                limit,
                total: count || 0,
                totalPages: Math.ceil((count || 0) / limit)
            }
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}