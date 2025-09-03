// app/api/upload/requests/route.ts (List user's requests)
import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()

        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const page = parseInt(searchParams.get('page') || '1')
        const limit = parseInt(searchParams.get('limit') || '10')
        const status = searchParams.get('status')
        const search = searchParams.get('search')

        const offset = (page - 1) * limit

        // Build query
        let query = supabase
            .from('document_processing_requests')
            .select(`id, request_id, user_id, organization_id, original_filename,
            company_name, industry, risk_score, risk_grade, recommended_limit,
            currency, status, submitted_at, processing_started_at, completed_at,
            file_size, file_extension, s3_upload_key, s3_folder_path,
            pdf_filename, pdf_s3_key, pdf_file_size, model_type,
            total_parameters, available_parameters, financial_parameters,
            business_parameters, hygiene_parameters, banking_parameters,
            error_message, retry_count, created_at, updated_at`, { count: 'exact' })
            .eq('user_id', user.id)

        // Add search filtering
        if (search?.trim()) {
            query = query.or(`company_name.ilike.%${search}%,original_filename.ilike.%${search}%,request_id.ilike.%${search}%`)
        }

        // Add status filtering
        // if (status && status !== 'all') {
        //     query = query.eq('status', status)
        // }

        // Apply pagination and ordering
        const { data, error, count } = await query
            .order('submitted_at', { ascending: false })
            .range(offset, offset + limit - 1)

        if (error) {
            console.error('Database error:', error)
            return NextResponse.json({ error: 'Failed to fetch requests' }, { status: 500 })
        }

        return NextResponse.json({
            data: data || [],
            pagination: {
                page,
                limit,
                total: count || 0,
                pages: Math.ceil((count || 0) / limit)
            }
        })

    } catch (error) {
        console.error('Fetch requests error:', error)
        return NextResponse.json({
            error: 'Internal server error'
        }, { status: 500 })
    }
}