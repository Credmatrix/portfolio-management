import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const query = searchParams.get('query');

        if (!query || query.trim().length < 2) {
            return NextResponse.json({
                error: 'Query must be at least 2 characters long'
            }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Call the RPC function to get company suggestions
        const { data, error } = await supabase
            .rpc('get_company_suggestions', { search_prefix: query.trim() });

        if (error) {
            console.error('Error fetching company suggestions:', error);
            return NextResponse.json({
                error: 'Failed to fetch company suggestions'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data: data || []
        });

    } catch (error) {
        console.error('Company suggestions API error:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}