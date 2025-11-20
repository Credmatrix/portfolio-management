// app/api/upload/confirm-upload/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const AWS_API_BASE = 'https://z6px6n7b13.execute-api.ap-south-1.amazonaws.com/dev'

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()

        // Validate required fields
        const { request_id, file_size } = body
        if (!request_id) {
            return NextResponse.json({
                error: 'request_id is required'
            }, { status: 400 })
        }

        // Proxy request to AWS Lambda
        const awsResponse = await fetch(`${AWS_API_BASE}/confirm-upload`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                request_id,
                file_size
            })
        })

        if (!awsResponse.ok) {
            const errorData = await awsResponse.json().catch(() => ({ error: 'AWS API error' }))
            return NextResponse.json(
                { error: errorData.error || 'Failed to confirm upload' },
                { status: awsResponse.status }
            )
        }

        const awsData = await awsResponse.json()

        // Get the created request with updated request_id from trigger
        const { data: createdRequest, error: fetchError } = await supabase
            .from('document_processing_requests')
            .select('request_id')
            .eq('id', request_id)
            .single();

        if (fetchError || !createdRequest || !createdRequest.request_id) {
            console.error('Error fetching created request:', fetchError);
            return NextResponse.json(
                { success: false, error: 'Failed to retrieve processing request' },
                { status: 500 }
            );
        }
        const requestID = createdRequest.request_id;

        return NextResponse.json({ ...awsData, request_id: requestID })

    } catch (error) {
        console.error('Upload confirmation error:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}