// app/api/upload/download-original/[request_id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const AWS_API_BASE = 'https://z6px6n7b13.execute-api.ap-south-1.amazonaws.com/dev'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ request_id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { request_id } = await params

        if (!request_id) {
            return NextResponse.json({
                error: 'request_id is required'
            }, { status: 400 })
        }

        // Check if user has access to this request
        const { data: requestData, error: requestError } = await supabase
            .from('document_processing_requests')
            .select('id, request_id, user_id')
            .eq('request_id', request_id)
            .eq('user_id', user.id)
            .single()

        if (requestError || !requestData) {
            return NextResponse.json({
                error: 'Request not found or access denied'
            }, { status: 404 })
        }

        // At this point, requestData is guaranteed to exist
        const documentId = requestData.id

        // Proxy request to AWS Lambda
        const awsResponse = await fetch(`${AWS_API_BASE}/download-original/${documentId}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        })

        if (!awsResponse.ok) {
            const errorData = await awsResponse.json().catch(() => ({ error: 'AWS API error' }))
            return NextResponse.json(
                { error: errorData.error || 'Failed to get download URL' },
                { status: awsResponse.status }
            )
        }

        const awsData = await awsResponse.json()

        return NextResponse.json(awsData)

    } catch (error) {
        console.error('Download URL generation error:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}
