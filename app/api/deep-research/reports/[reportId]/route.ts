// Deep Research Report Details API
// Get individual report details and download

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const reportId = params.reportId

        // Get report details
        const { data: report, error: reportError } = await supabase
            .from('deep_research_reports')
            .select(`
        *,
        document_processing_requests!inner(company_name)
      `)
            .eq('id', reportId)
            .eq('user_id', user.id)
            .single()

        if (reportError || !report) {
            return NextResponse.json(
                { error: 'Report not found or access denied' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            report
        })

    } catch (error) {
        console.error('Error fetching report:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { reportId: string } }
) {
    try {
        const supabase = await createServerSupabaseClient()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const reportId = params.reportId

        // Delete report
        const { error } = await supabase
            .from('deep_research_reports')
            .delete()
            .eq('id', reportId)
            .eq('user_id', user.id)

        if (error) {
            throw error
        }

        return NextResponse.json({
            success: true,
            message: 'Report deleted successfully'
        })

    } catch (error) {
        console.error('Error deleting report:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}