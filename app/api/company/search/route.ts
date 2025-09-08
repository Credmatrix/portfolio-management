// app/api/company/search/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

const AWS_API_BASE_URL = 'https://nqrkc60k1g.execute-api.ap-south-1.amazonaws.com/dev'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const query = searchParams.get('query')
        const filterType = searchParams.get('filter_type') || 'company'
        const maxResults = searchParams.get('max_results') ?
            parseInt(searchParams.get('max_results')!) : 10

        if (!query) {
            return NextResponse.json(
                { error: 'Query parameter is required' },
                { status: 400 }
            )
        }

        // Build AWS API URL with query parameters
        const awsUrl = new URL(`${AWS_API_BASE_URL}/search`)
        awsUrl.searchParams.set('query', query)
        awsUrl.searchParams.set('filter_type', filterType)
        awsUrl.searchParams.set('max_results', maxResults.toString())

        // Call AWS Lambda function
        const response = await fetch(awsUrl.toString(), {
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
        console.error('Company search API error:', error)

        return NextResponse.json({
            success: false,
            results: [],
            total_found: 0,
            error_message: error instanceof Error ? error.message : 'Failed to search companies'
        }, { status: 500 })
    }
}