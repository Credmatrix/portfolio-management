// app/api/company/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const AWS_API_BASE_URL = 'https://nqrkc60k1g.execute-api.ap-south-1.amazonaws.com/dev'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { id: companyId } = await params

        if (!companyId) {
            return NextResponse.json(
                { error: 'Company ID is required' },
                { status: 400 }
            )
        }

        // Call AWS Lambda function
        const response = await fetch(`${AWS_API_BASE_URL}/company/${encodeURIComponent(companyId)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        })

        if (!response.ok) {
            throw new Error(`AWS API responded with status: ${response.status}`)
        }

        const data = await response.json()

        // Return the response with user_id added
        return NextResponse.json({
            ...data,
            user_id: user.id
        })

    } catch (error) {
        console.error('Company data API error:', error)

        return NextResponse.json({
            success: false,
            company_id: null,
            rc_sections: null,
            extraction_timestamp: null,
            error_message: error instanceof Error ? error.message : 'Failed to fetch company data'
        }, { status: 500 })
    }
}
