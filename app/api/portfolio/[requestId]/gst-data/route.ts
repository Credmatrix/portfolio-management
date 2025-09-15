import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { GstApiService } from '@/lib/services/gst-api.service'


// Function to get current financial year (April 1 - March 31)
const getCurrentFinancialYear = (): string => {
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    const currentMonth = currentDate.getMonth() + 1 // getMonth() returns 0-11, so add 1

    // If current month is April (4) or later, FY starts from current year
    // If current month is January (1) to March (3), FY started from previous year
    if (currentMonth >= 4) {
        // April to December: FY is current year to next year
        return `${currentYear}-${(currentYear + 1).toString().slice(-2)}`
    } else {
        // January to March: FY is previous year to current year
        return `${currentYear - 1}-${currentYear.toString().slice(-2)}`
    }
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const { requestId } = await params
        const gstin = searchParams.get('gstin')
        const financialYear = searchParams.get('financial_year') || getCurrentFinancialYear()

        if (!gstin) {
            return NextResponse.json(
                { error: 'GSTIN parameter is required' },
                { status: 400 }
            )
        }

        // Validate GSTIN format
        const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
        if (!gstinRegex.test(gstin)) {
            return NextResponse.json(
                { error: 'Invalid GSTIN format' },
                { status: 400 }
            )
        }

        // Check if request exists and user has access
        const { data: requestData, error: requestError } = await supabase
            .from('document_processing_requests')
            .select('request_id, company_name, extracted_data')
            .eq('request_id', requestId)
            .single()

        if (requestError || !requestData) {
            return NextResponse.json(
                { error: 'Request not found' },
                { status: 404 }
            )
        }

        const gstService = new GstApiService(supabase)

        // Get GST filing data from database
        const filingData = await gstService.getGstFilingData(gstin, financialYear)

        // Check if data is fresh
        const currentFY = financialYear || '2025-26' // Default to current FY
        const isFresh = await gstService.isGstDataFresh(gstin, currentFY, 7)

        // Get user's refresh status
        const refreshStatus = await gstService.canUserRefresh(user.id, requestId)

        return NextResponse.json({
            success: true,
            data: {
                gstin,
                financial_year: financialYear,
                filing_data: filingData,
                data_freshness: {
                    is_fresh: isFresh,
                    max_age_days: 7,
                    last_updated: filingData.length > 0 ? filingData[0].fetched_at : null
                },
                refresh_status: refreshStatus
            }
        })

    } catch (error) {
        console.error('Error fetching GST data:', error)
        return NextResponse.json(
            { error: 'Failed to fetch GST data' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { requestId } = await params;
        const { gstins, financial_year, force_refresh = false } = body

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
        const results: any[] = []

        for (const gstin of gstins) {
            try {
                // Check if we need to refresh data
                const isFresh = await gstService.isGstDataFresh(gstin, financial_year, 7)

                if (!force_refresh && isFresh) {
                    // Return cached data
                    const cachedData = await gstService.getGstFilingData(gstin, financial_year)
                    results.push({
                        gstin,
                        status: 'cached',
                        data: cachedData,
                        message: 'Using cached data (less than 7 days old)'
                    })
                } else {
                    // Get fresh data (this will be handled by the refresh endpoint)
                    const cachedData = await gstService.getGstFilingData(gstin, financial_year)
                    results.push({
                        gstin,
                        status: 'stale',
                        data: cachedData,
                        message: 'Data is stale, consider refreshing',
                        needs_refresh: true
                    })
                }
            } catch (error) {
                console.error(`Error processing GSTIN ${gstin}:`, error)
                results.push({
                    gstin,
                    status: 'error',
                    error: error instanceof Error ? error.message : 'Unknown error'
                })
            }
        }

        return NextResponse.json({
            success: true,
            data: {
                financial_year,
                results,
                summary: {
                    total: gstins.length,
                    cached: results.filter(r => r.status === 'cached').length,
                    stale: results.filter(r => r.status === 'stale').length,
                    errors: results.filter(r => r.status === 'error').length
                }
            }
        })

    } catch (error) {
        console.error('Error fetching GST data:', error)
        return NextResponse.json(
            { error: 'Failed to fetch GST data' },
            { status: 500 }
        )
    }
}