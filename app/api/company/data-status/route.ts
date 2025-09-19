import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

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

        if (!cin) {
            return NextResponse.json(
                { success: false, error: 'CIN parameter is required' },
                { status: 400 }
            );
        }

        // Check if company exists in our database with comprehensive_data
        const { data: company, error } = await supabase
            .from('companies')
            .select('id, cin, comprehensive_data, comprehensive_data_cached_at, data_status, status_cached_at')
            .eq('cin', cin)
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