import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const cin = searchParams.get('cin');

        if (!cin) {
            return NextResponse.json({
                error: 'CIN parameter is required'
            }, { status: 400 });
        }

        const supabase = await createServerSupabaseClient();

        // Get the user's session to extract JWT token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError || !session) {
            return NextResponse.json({
                error: 'Authentication required'
            }, { status: 401 });
        }

        // Call the Supabase Edge Function with the user's JWT token
        const response = await fetch(
            `https://slkosezyamdmvaarmwow.supabase.co/functions/v1/get-company?cin=${encodeURIComponent(cin)}`,
            {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Edge function error:', errorText);
            return NextResponse.json({
                error: 'Failed to fetch company details',
                details: errorText
            }, { status: response.status });
        }

        const companyData = await response.json();

        return NextResponse.json(companyData);

    } catch (error) {
        console.error('Company details API error:', error);
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 });
    }
}