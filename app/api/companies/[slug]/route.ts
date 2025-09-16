import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { parseCompanySlug, matchCompanyBySlug } from '@/lib/utils/company-slug';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ slug: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient();

        // Check authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { slug } = await params;
        const { companyName, identifier } = parseCompanySlug(slug);

        // Build query to find matching companies
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
        risk_grade,
        industry,
        recommended_limit,
        currency,
        status,
        submitted_at,
        completed_at,
        location_city,
        location_state,
        gst_compliance_status,
        epfo_compliance_status,
        extracted_data,
        risk_analysis,
        processing_summary,
        original_filename,
        model_type,
        total_parameters,
        available_parameters,
        financial_parameters,
        business_parameters,
        hygiene_parameters,
        banking_parameters,
        credit_management(
          actual_credit_limit_approved,
          limit_validity_date,
          payment_terms,
          security_requirements,
          ad_hoc_limit,
          insurance_cover,
          general_remarks,
          collection_feedback,
          ar_values,
          dpd_behavior,
          credit_type,
          repayment,
          lpi,
          lpi_received
        )
      `)
            .eq('user_id', user.id)
            .not('company_name', 'is', null);

        // Add identifier filter if available
        if (identifier) {
            if (identifier.length === 10) {
                // Likely PAN
                query = query.eq('pan', identifier);
            } else if (identifier.length === 21) {
                // Likely CIN
                query = query.eq('cin', identifier);
            } else {
                // Try both
                query = query.or(`pan.eq.${identifier},cin.eq.${identifier}`);
            }
        }

        const { data, error } = await query.order('submitted_at', { ascending: false });

        if (error) {
            console.error('Database error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch company details' },
                { status: 500 }
            );
        }

        // Filter results to match the slug exactly
        const matchingRequests = data?.filter(request =>
            request.company_name && request.pan && request.cin && matchCompanyBySlug(slug, request.company_name, request.pan, request.cin)
        ) || [];

        if (matchingRequests.length === 0) {
            return NextResponse.json(
                { error: 'Company not found' },
                { status: 404 }
            );
        }

        // Get the latest request for company header info
        const latestRequest = matchingRequests[0];

        // Group requests by status
        const requestsByStatus = {
            completed: matchingRequests.filter(r => r.status === 'completed'),
            processing: matchingRequests.filter(r => r.status === 'processing'),
            failed: matchingRequests.filter(r => r.status === 'failed'),
            submitted: matchingRequests.filter(r => r.status === 'submitted')
        };

        // Calculate summary metrics
        const summary = {
            totalRequests: matchingRequests.length,
            completedRequests: requestsByStatus.completed.length,
            processingRequests: requestsByStatus.processing.length,
            failedRequests: requestsByStatus.failed.length,
            submittedRequests: requestsByStatus.submitted.length,
            latestRiskScore: latestRequest.risk_score,
            latestCreditRating: latestRequest.credit_rating,
            latestRecommendedLimit: latestRequest.recommended_limit,
            hasActiveCreditManagement: latestRequest.credit_management && latestRequest.credit_management.length > 0
        };

        return NextResponse.json({
            company: {
                name: latestRequest.company_name,
                cin: latestRequest.cin,
                pan: latestRequest.pan,
                industry: latestRequest.sector,
                location: `${latestRequest.location_city || ''}, ${latestRequest.location_state || ''}`.trim().replace(/^,\s*|,\s*$/g, ''),
                slug
            },
            latestRequest,
            requests: matchingRequests,
            requestsByStatus,
            summary
        });

    } catch (error) {
        console.error('API error:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}