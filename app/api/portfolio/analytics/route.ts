// app/api/portfolio/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Helper function to extract rating from Rating Type parameter
function extractRatingFromRatingType(riskAnalysis: any): string | null {
    try {
        if (!riskAnalysis?.allScores) return null;
        
        const ratingTypeParam = riskAnalysis.allScores.find(
            (score: any) => score.parameter === 'Rating Type'
        );
        
        if (!ratingTypeParam || !ratingTypeParam.available || ratingTypeParam.value === 'Not Available') {
            return null;
        }
        
        // Extract rating from value like "A (CRISIL, 20 Mar, 2025)"
        const value = ratingTypeParam.value;
        if (typeof value === 'string') {
            // Extract the rating part before the first space or parenthesis
            const rating = value.split(/[\s(]/)[0].trim();
            
            // Validate if it's a valid Indian Long Term Rating Scale
            // Investment Grade: AAA, AA+, AA, AA-, A+, A, A-, BBB+, BBB, BBB-
            // Speculative Grade: BB+, BB, BB-, B+, B, B-, C+, C, C-, D
            const validRatings = [
                // Investment Grade
                'AAA', 'AA+', 'AA', 'AA-', 'A+', 'A', 'A-', 'BBB+', 'BBB', 'BBB-',
                // Speculative Grade  
                'BB+', 'BB', 'BB-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D'
            ];
            
            if (validRatings.includes(rating)) {
                // Normalize to base rating for grouping (remove + and -)
                if (rating.includes('+') || rating.includes('-')) {
                    return rating.replace(/[+-]/g, '');
                }
                return rating;
            }
        }
        
        return null;
    } catch (error) {
        console.error('Error extracting rating:', error);
        return null;
    }
}

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { data: portfolio, error } = await supabase
            .from('document_processing_requests')
            .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at, risk_analysis, processing_summary`)
            .eq('user_id', user.id)
            .eq('status', 'completed')

        if (error) {
            return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 })
        }

        // Initialize rating distribution based on Rating Type parameter
        const ratingDistribution = {
            AAA: 0,
            AA: 0,
            A: 0,
            BBB: 0,
            BB: 0,
            B: 0,
            C: 0,
            D: 0,
            'Not Rated': 0
        };

        // Initialize risk distribution based on risk_grade
        const riskDistribution = {
            cm1: 0,
            cm2: 0,
            cm3: 0,
            cm4: 0,
            cm5: 0,
            cm6: 0,
            cm7: 0,
            ungraded: 0
        };

        portfolio?.forEach(item => {
            // Rating Distribution - extract from Rating Type parameter in risk_analysis
            const extractedRating = extractRatingFromRatingType(item.risk_analysis);
            if (extractedRating && ratingDistribution.hasOwnProperty(extractedRating)) {
                ratingDistribution[extractedRating as keyof typeof ratingDistribution]++;
            } else {
                ratingDistribution['Not Rated']++;
            }

            // Risk Distribution - from risk_grade field
            if (item.risk_grade) {
                const riskGrade = item.risk_grade.toLowerCase();
                if (riskDistribution.hasOwnProperty(riskGrade)) {
                    riskDistribution[riskGrade as keyof typeof riskDistribution]++;
                } else {
                    // Handle any unexpected risk grades
                    riskDistribution.ungraded++;
                }
            } else {
                riskDistribution.ungraded++;
            }
        });

        const totalCompanies = portfolio?.length || 0;

        const analytics = {
            total_companies: totalCompanies,
            total_exposure: portfolio?.reduce((sum, item) => sum + (item.recommended_limit || 0), 0) || 0,

            // Rating distribution (AAA, AA, A, etc.) from Rating Type parameter
            rating_distribution: {
                ...ratingDistribution,
                total: totalCompanies
            },

            // Risk distribution (CM1, CM2, etc.) from risk_grade field
            risk_distribution: {
                ...riskDistribution,
                total: totalCompanies
            },

            average_risk_score: totalCompanies > 0
                ? portfolio.reduce((sum, item) => sum + (item.risk_score || 0), 0) / totalCompanies
                : 0,

            recent_assessments: portfolio
                ?.sort((a, b) => new Date(b.submitted_at!).getTime() - new Date(a.submitted_at!).getTime())
                .slice(0, 5)
                .map(item => {
                    const extractedRating = extractRatingFromRatingType(item.risk_analysis);
                    return {
                        company_name: item.company_name,
                        risk_grade: item.risk_grade || 'Ungraded',
                        credit_rating: extractedRating || 'Not Rated',
                        risk_score: item.risk_score,
                        submitted_at: item.submitted_at,
                        request_id: item.request_id,
                        recommended_limit: item.recommended_limit
                    };
                }) || []
        };

        return NextResponse.json(analytics)
    } catch (error) {
        console.error('Portfolio analytics error:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
    }
}