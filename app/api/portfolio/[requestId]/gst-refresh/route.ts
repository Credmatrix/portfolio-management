import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GstApiService } from '@/lib/services/gst-api.service'

export async function GET(
    request: NextRequest,
    { params }: { params: { requestId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }
        const { requestId } = await params
        const gstService = new GstApiService(supabase)
        const refreshStatus = await gstService.canUserRefresh(user.id, requestId)

        return NextResponse.json({
            success: true,
            data: refreshStatus
        })

    } catch (error) {
        console.error('Error checking GST refresh status:', error)
        return NextResponse.json(
            { error: 'Failed to check refresh status' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { requestId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { requestId } = await params
        const { gstins, financial_year } = body

        if (!gstins || !Array.isArray(gstins) || gstins.length === 0) {
            return NextResponse.json(
                { error: 'GSTINs array is required' },
                { status: 400 }
            )
        }

        if (!financial_year) {
            return NextResponse.json(
                { error: 'Financial year is required' },
                { status: 400 }
            )
        }

        // Validate financial year format (e.g., "2025-26")
        const fyRegex = /^\d{4}-\d{2}$/
        if (!fyRegex.test(financial_year)) {
            return NextResponse.json(
                { error: 'Invalid financial year format. Use YYYY-YY format (e.g., 2025-26)' },
                { status: 400 }
            )
        }

        // Validate GSTINs format (15 characters alphanumeric)
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
        const invalidGstins = gstins.filter((gstin: string) => !gstinRegex.test(gstin))

        if (invalidGstins.length > 0) {
            return NextResponse.json(
                { error: `Invalid GSTIN format: ${invalidGstins.join(', ')}` },
                { status: 400 }
            )
        }

        // Check if request exists
        const { data: requestData, error: requestError } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name')
            .eq('request_id', requestId)
            .single()

        if (requestError || !requestData) {
            return NextResponse.json(
                { error: 'Request not found' },
                { status: 404 }
            )
        }

        const gstService = new GstApiService(supabase)

        // Process GST refresh
        const result = await gstService.processGstRefresh(
            requestId,
            user.id,
            gstins,
            financial_year
        )

        return NextResponse.json({
            success: true,
            message: 'GST refresh completed',
            data: {
                jobId: result.jobId,
                processedGstins: gstins.length,
                results: result.results,
                summary: {
                    successful: result.results.filter(r => r.status === 'success').length,
                    cached: result.results.filter(r => r.status === 'cached').length,
                    failed: result.results.filter(r => r.status === 'failed').length
                }
            }
        })

    } catch (error) {
        console.error('Error processing GST refresh:', error)

        if (error instanceof Error && error.message.includes('Refresh limit exceeded')) {
            return NextResponse.json(
                { error: error.message },
                { status: 429 } // Too Many Requests
            )
        }

        return NextResponse.json(
            { error: 'Failed to refresh GST data' },
            { status: 500 }
        )
    }
}