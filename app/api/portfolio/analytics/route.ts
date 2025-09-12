// app/api/portfolio/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

// Helper function to safely access risk analysis data
function safelyAccessRiskAnalysis(riskAnalysis: any): any {
    try {
        if (typeof riskAnalysis === 'string') {
            return JSON.parse(riskAnalysis);
        }
        return riskAnalysis || {};
    } catch (error) {
        console.error('Error parsing risk analysis:', error);
        return {};
    }
}

// Helper function to extract rating from Rating Type parameter
function extractRatingFromRatingType(riskAnalysis: any): string | null {
    try {
        const parsedAnalysis = safelyAccessRiskAnalysis(riskAnalysis);
        if (!parsedAnalysis?.allScores) return null;

        const ratingTypeParam = parsedAnalysis.allScores.find(
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

// Helper function to extract region from extracted data
function extractRegionFromExtractedData(extractedData: any): string | null {
    try {
        const parsedData = typeof extractedData === 'string' ? JSON.parse(extractedData) : extractedData;

        // Try to get region from registered address
        const registeredAddress = parsedData?.about_company?.registered_address;
        if (registeredAddress?.state) {
            return registeredAddress.state;
        }

        // Try to get region from business address
        const businessAddress = parsedData?.about_company?.business_address;
        if (businessAddress?.state) {
            return businessAddress.state;
        }

        // Try to get from GST records
        const gstRecords = parsedData?.gst_records?.active_gstins;
        if (gstRecords && gstRecords.length > 0) {
            return gstRecords[0].state;
        }

        return null;
    } catch (error) {
        console.error('Error extracting region:', error);
        return null;
    }
}

// Helper function to calculate overall compliance score
function calculateOverallComplianceScore(gstCompliance: any, epfoCompliance: any, totalCompanies: number): number {
    if (totalCompanies === 0) return 0;

    const gstScore = ((gstCompliance.compliant * 100) + (gstCompliance.partial * 50)) / totalCompanies;
    const epfoScore = ((epfoCompliance.compliant * 100) + (epfoCompliance.partial * 50)) / totalCompanies;

    return (gstScore + epfoScore) / 2;
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

        // Initialize industry breakdown and regional breakdown
        const industryBreakdown: Record<string, number> = {};
        const regionalBreakdown: Record<string, number> = {};

        // Initialize compliance overview
        const complianceOverview = {
            gst_compliance: { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 },
            epfo_compliance: { compliant: 0, non_compliant: 0, partial: 0, unknown: 0 },
            audit_qualification: { qualified: 0, unqualified: 0, unknown: 0 }
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

            // Industry breakdown - use industry field directly
            if (item.industry) {
                industryBreakdown[item.industry] = (industryBreakdown[item.industry] || 0) + 1;
            } else {
                industryBreakdown['Unknown'] = (industryBreakdown['Unknown'] || 0) + 1;
            }

            // Regional breakdown - extract from risk_analysis extracted_data
            const parsedRegionalRiskAnalysis = safelyAccessRiskAnalysis(item.risk_analysis);
            let region: string | null = null;

            if (parsedRegionalRiskAnalysis?.extracted_data) {
                region = extractRegionFromExtractedData(parsedRegionalRiskAnalysis.extracted_data);
            }

            if (region) {
                regionalBreakdown[region] = (regionalBreakdown[region] || 0) + 1;
            } else {
                regionalBreakdown['Unknown'] = (regionalBreakdown['Unknown'] || 0) + 1;
            }

            // Compliance analysis from risk_analysis using correct parameter names
            const parsedRiskAnalysis = safelyAccessRiskAnalysis(item.risk_analysis);
            if (parsedRiskAnalysis?.allScores) {
                const allScores = parsedRiskAnalysis.allScores;

                // GST Compliance - using "Statutory Payments (GST)" parameter
                const gstData = allScores.find((score: any) => score.parameter === "Statutory Payments (GST)");
                if (gstData?.available && gstData.details?.compliance_rate !== undefined) {
                    const gstRate = gstData.details.compliance_rate;
                    if (gstRate >= 85) {
                        complianceOverview.gst_compliance.compliant++;
                    } else if (gstRate < 70) {
                        complianceOverview.gst_compliance.non_compliant++;
                    } else {
                        complianceOverview.gst_compliance.partial++;
                    }
                } else {
                    complianceOverview.gst_compliance.unknown++;
                }

                // EPFO Compliance - using "Statutory Payments (PF)" parameter
                const pfData = allScores.find((score: any) => score.parameter === "Statutory Payments (PF)");
                if (pfData?.available && pfData.details?.effective_compliance_rate !== undefined) {
                    const epfoRate = pfData.details.effective_compliance_rate;
                    if (epfoRate >= 85) {
                        complianceOverview.epfo_compliance.compliant++;
                    } else if (epfoRate < 70) {
                        complianceOverview.epfo_compliance.non_compliant++;
                    } else {
                        complianceOverview.epfo_compliance.partial++;
                    }
                } else {
                    complianceOverview.epfo_compliance.unknown++;
                }

                // Audit Qualification - simplified for now as per helper function
                complianceOverview.audit_qualification.unknown++;
            } else {
                // No risk analysis data available
                complianceOverview.gst_compliance.unknown++;
                complianceOverview.epfo_compliance.unknown++;
                complianceOverview.audit_qualification.unknown++;
            }
        });

        const totalCompanies = portfolio?.length || 0;

        const analytics = {
            total_companies: totalCompanies,
            total_exposure: portfolio?.reduce((sum, item) => {
                const limit = item.recommended_limit;
                // Handle both number and string values, convert to number
                const numericLimit = typeof limit === 'string' ? parseFloat(limit) : (limit || 0);
                return sum + (isNaN(numericLimit) ? 0 : numericLimit);
            }, 0) || 0,

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

            // Industry breakdown
            industry_breakdown: {
                ...industryBreakdown,
                total: totalCompanies
            },

            // Regional breakdown
            regional_breakdown: {
                ...regionalBreakdown,
                total: totalCompanies
            },

            // Compliance overview with enhanced metrics
            compliance_overview: {
                ...complianceOverview,
                overall_compliance_score: calculateOverallComplianceScore(
                    complianceOverview.gst_compliance,
                    complianceOverview.epfo_compliance,
                    totalCompanies
                ),
                compliance_distribution: {
                    fully_compliant: portfolio?.filter(item => {
                        const parsedRiskAnalysis = safelyAccessRiskAnalysis(item.risk_analysis);
                        if (!parsedRiskAnalysis?.allScores) return false;

                        const allScores = parsedRiskAnalysis.allScores;
                        const gstData = allScores.find((score: any) => score.parameter === "Statutory Payments (GST)");
                        const pfData = allScores.find((score: any) => score.parameter === "Statutory Payments (PF)");

                        const gstCompliant = gstData?.available && gstData.details?.compliance_rate >= 85;
                        const epfoCompliant = pfData?.available && pfData.details?.effective_compliance_rate >= 85;

                        return gstCompliant && epfoCompliant;
                    }).length || 0,
                    partially_compliant: portfolio?.filter(item => {
                        const parsedRiskAnalysis = safelyAccessRiskAnalysis(item.risk_analysis);
                        if (!parsedRiskAnalysis?.allScores) return false;

                        const allScores = parsedRiskAnalysis.allScores;
                        const gstData = allScores.find((score: any) => score.parameter === "Statutory Payments (GST)");
                        const pfData = allScores.find((score: any) => score.parameter === "Statutory Payments (PF)");

                        const gstCompliant = gstData?.available && gstData.details?.compliance_rate >= 85;
                        const epfoCompliant = pfData?.available && pfData.details?.effective_compliance_rate >= 85;

                        return (gstCompliant || epfoCompliant) && !(gstCompliant && epfoCompliant);
                    }).length || 0,
                    non_compliant: portfolio?.filter(item => {
                        const parsedRiskAnalysis = safelyAccessRiskAnalysis(item.risk_analysis);
                        if (!parsedRiskAnalysis?.allScores) return false;

                        const allScores = parsedRiskAnalysis.allScores;
                        const gstData = allScores.find((score: any) => score.parameter === "Statutory Payments (GST)");
                        const pfData = allScores.find((score: any) => score.parameter === "Statutory Payments (PF)");

                        const gstNonCompliant = gstData?.available && gstData.details?.compliance_rate < 70;
                        const epfoNonCompliant = pfData?.available && pfData.details?.effective_compliance_rate < 70;

                        return gstNonCompliant && epfoNonCompliant;
                    }).length || 0
                }
            },

            // Compliance heatmap data - transform portfolio data for heatmap visualization
            compliance_heatmap: {
                companies: portfolio?.map(item => {
                    // Extract compliance data from risk analysis using correct parameter names
                    let gstStatus = 'Unknown';
                    let gstScore = 0;
                    let epfoStatus = 'Unknown';
                    let epfoScore = 0;

                    const parsedRiskAnalysis = safelyAccessRiskAnalysis(item.risk_analysis);
                    if (parsedRiskAnalysis?.allScores) {
                        const allScores = parsedRiskAnalysis.allScores;

                        // GST Compliance - using "Statutory Payments (GST)" parameter
                        const gstData = allScores.find((score: any) => score.parameter === "Statutory Payments (GST)");
                        if (gstData?.available && gstData.details?.compliance_rate !== undefined) {
                            const gstRate = gstData.details.compliance_rate;
                            gstScore = gstRate;
                            if (gstRate >= 85) {
                                gstStatus = 'Compliant';
                            } else if (gstRate < 70) {
                                gstStatus = 'Non-Compliant';
                            } else {
                                gstStatus = 'Partial';
                            }
                        }

                        // EPFO Compliance - using "Statutory Payments (PF)" parameter
                        const pfData = allScores.find((score: any) => score.parameter === "Statutory Payments (PF)");
                        if (pfData?.available && pfData.details?.effective_compliance_rate !== undefined) {
                            const epfoRate = pfData.details.effective_compliance_rate;
                            epfoScore = epfoRate;
                            if (epfoRate >= 85) {
                                epfoStatus = 'Compliant';
                            } else if (epfoRate < 70) {
                                epfoStatus = 'Non-Compliant';
                            } else {
                                epfoStatus = 'Partial';
                            }
                        }
                    }

                    const overallComplianceScore = (gstScore + epfoScore) / 2;

                    return {
                        id: item.request_id,
                        name: item.company_name || 'Unknown Company',
                        riskGrade: item.risk_grade || 'Ungraded',
                        overallComplianceScore,
                        gstCompliance: {
                            status: gstStatus,
                            score: gstScore,
                            filingRegularity: gstScore
                        },
                        epfoCompliance: {
                            status: epfoStatus,
                            score: epfoScore,
                            paymentRegularity: epfoScore
                        }
                    };
                }) || []
            },

            average_risk_score: totalCompanies > 0
                ? portfolio.reduce((sum, item) => {
                    const score = item.risk_score;
                    const numericScore = typeof score === 'string' ? parseFloat(score) : (score || 0);
                    return sum + (isNaN(numericScore) ? 0 : numericScore);
                }, 0) / totalCompanies
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