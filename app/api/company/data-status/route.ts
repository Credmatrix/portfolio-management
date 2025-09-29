import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { validateCinLlpin } from '@/lib/utils/validators';

const MOOLA_API_BASE_URL = process.env.MOOLA_API_BASE_URL || 'https://moola-axl1.credmatrix.ai/api/v1';

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const { searchParams } = new URL(request.url);
        const cin = searchParams.get('cin');
        const pan = searchParams.get('pan');
        const identifier = cin || pan;

        if (!identifier) {
            return NextResponse.json(
                { success: false, error: 'CIN or PAN parameter is required' },
                { status: 400 }
            );
        }

        // Check if company exists in our database with comprehensive_data
        const { data: company, error } = await supabase
            .from('companies')
            .select('id, cin, pan, comprehensive_data, comprehensive_data_cached_at, data_status, status_cached_at')
            .or(`cin.eq.${identifier},pan.eq.${identifier}`)
            .single();

        if (error && error.code !== 'PGRST116') { // PGRST116 is "not found"
            console.error('Database error:', error);
            return NextResponse.json(
                { success: false, error: 'Database error' },
                { status: 500 }
            );
        }

        const hasComprehensiveData = company?.comprehensive_data !== null;
        const dataAge = company?.comprehensive_data_cached_at
            ? Math.floor((Date.now() - new Date(company.comprehensive_data_cached_at).getTime()) / (1000 * 60 * 60 * 24))
            : null;

        return NextResponse.json({
            success: true,
            data: {
                exists: !!company,
                has_comprehensive_data: hasComprehensiveData,
                data_cached_at: company?.comprehensive_data_cached_at,
                data_age_days: dataAge,
                data_status: company?.data_status,
                status_cached_at: company?.status_cached_at,
                processing_method: hasComprehensiveData ? 'existing_data' : 'api_fetch_required',
            },
        });

    } catch (error) {
        console.error('Data status check error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// Enhanced POST method for new workflow
export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Get authenticated user
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { identifier, identifier_type, company_id } = body;

        // Enhanced validation for new workflow
        if (!identifier && !company_id) {
            return NextResponse.json(
                { success: false, error: 'Either identifier or company_id is required' },
                { status: 400 }
            );
        }

        let targetIdentifier = identifier;
        let targetType = identifier_type;

        // If company_id is provided, get the identifier from database
        if (company_id && !identifier) {
            const { data: company, error: companyError } = await supabase
                .from('companies')
                .select('cin, pan')
                .eq('id', company_id)
                .single();

            if (companyError) {
                return NextResponse.json(
                    { success: false, error: 'Company not found' },
                    { status: 404 }
                );
            }

            targetIdentifier = company.cin || company.pan;
            targetType = company.cin ? 'CIN' : 'PAN';
        }

        if (!targetIdentifier) {
            return NextResponse.json(
                { success: false, error: 'No valid identifier found' },
                { status: 400 }
            );
        }

        // Enhanced validation using new validator
        const validation = validateCinLlpin(targetIdentifier);
        if (!validation.isValid) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Invalid identifier format',
                    validation_error: validation.error,
                    identifier: targetIdentifier
                },
                { status: 400 }
            );
        }

        // Check if company exists in our database
        const { data: existingCompany, error: existingError } = await supabase
            .from('companies')
            .select('id, cin, pan, comprehensive_data, comprehensive_data_cached_at')
            .or(`cin.eq.${targetIdentifier},pan.eq.${targetIdentifier}`)
            .single();

        let localDataStatus = {
            exists_locally: false,
            has_comprehensive_data: false,
            data_cached_at: '',
            data_age_days: 0,
            is_data_fresh: false,
            requires_refresh: true
        };

        if (existingCompany && !existingError) {
            const dataAge = existingCompany.comprehensive_data_cached_at
                ? Date.now() - new Date(existingCompany.comprehensive_data_cached_at).getTime()
                : null;
            const isDataFresh = dataAge ? dataAge < (7 * 24 * 60 * 60 * 1000) : false; // 7 days

            localDataStatus = {
                exists_locally: true,
                has_comprehensive_data: !!existingCompany.comprehensive_data,
                data_cached_at: existingCompany.comprehensive_data_cached_at ?? '',
                data_age_days: dataAge ? Math.floor(dataAge / (24 * 60 * 60 * 1000)) : 0,
                is_data_fresh: isDataFresh,
                requires_refresh: !existingCompany.comprehensive_data || !isDataFresh
            };
        }

        // Check external API data availability
        let externalDataStatus;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.access_token) {
                const externalResponse = await fetch(
                    `${MOOLA_API_BASE_URL}/companies/${targetIdentifier}/data-status?identifier_type=${targetType}`,
                    {
                        headers: {
                            'accept': 'application/json',
                            'Authorization': `Bearer ${session.access_token}`,
                        },
                    }
                );

                if (externalResponse.ok) {
                    const externalResult = await externalResponse.json();
                    externalDataStatus = {
                        available: true,
                        data_status: externalResult.data?.data?.data_status,
                        last_updated: externalResult.data?.data?.data_status?.last_details_updated,
                        last_filing: externalResult.data?.data?.data_status?.last_filing_date
                    };
                } else {
                    externalDataStatus = {
                        available: false,
                        error: `API returned ${externalResponse.status}`
                    };
                }
            }
        } catch (apiError) {
            console.warn('External API check failed:', apiError);
            externalDataStatus = {
                available: false,
                error: 'External API unavailable'
            };
        }

        // Determine processing recommendations
        const recommendations: string[] = [];
        if (!localDataStatus.exists_locally && externalDataStatus?.available) {
            recommendations.push('Fresh API processing recommended');
        } else if (localDataStatus.exists_locally && localDataStatus.requires_refresh && externalDataStatus?.available) {
            recommendations.push('Data refresh recommended');
        } else if (localDataStatus.exists_locally && localDataStatus.is_data_fresh) {
            recommendations.push('Existing data is current');
        } else if (!externalDataStatus?.available) {
            recommendations.push('External data not available - consider manual entry');
        }

        return NextResponse.json({
            success: true,
            data: {
                identifier: targetIdentifier,
                identifier_type: targetType,
                validation: {
                    is_valid: validation.isValid,
                    warnings: validation.warnings,
                    metadata: validation.metadata
                },
                local_data: localDataStatus,
                external_data: externalDataStatus,
                recommendations,
                processing_eligible: validation.isValid && (localDataStatus.exists_locally || externalDataStatus?.available)
            }
        });

    } catch (error) {
        console.error('Enhanced data status check error:', error);
        return NextResponse.json(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}