// app/api/upload/get-upload-url/route.ts
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
        const { filename, model_type, industry, company_name } = body
        if (!filename || !model_type || !industry) {
            return NextResponse.json({
                error: 'Missing required fields: filename, model_type, industry'
            }, { status: 400 })
        }

        // Validate file extension
        if (!filename.toLowerCase().endsWith('.xls') && !filename.toLowerCase().endsWith('.xlsx')) {
            return NextResponse.json({
                error: 'Invalid file type. Only .xls and .xlsx files are allowed'
            }, { status: 400 })
        }

        // Proxy request to AWS Lambda
        const awsResponse = await fetch(`${AWS_API_BASE}/get-upload-url`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                user_id: user.id,
                organization_id: user.user_metadata?.organization_id || user.id,
                filename,
                model_type,
                industry,
                company_name
            })
        })

        if (!awsResponse.ok) {
            const errorData = await awsResponse.json().catch(() => ({ error: 'AWS API error' }))
            return NextResponse.json(
                { error: errorData.error || 'Failed to generate upload URL' },
                { status: awsResponse.status }
            )
        }

        const awsData = await awsResponse.json()
        
        return NextResponse.json(awsData)

    } catch (error) {
        console.error('Upload URL generation error:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}