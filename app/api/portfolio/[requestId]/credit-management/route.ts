import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreditManagement, CreditManagementFormData } from '@/types/credit-management.types'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { requestId } = await params

        const { data, error } = await supabase
            .from('credit_management')
            .select('*')
            .eq('request_id', requestId)
            .single()

        if (error && error.code !== 'PGRST116') {
            console.error('Error fetching credit management data:', error)
            return NextResponse.json(
                { error: 'Failed to fetch credit management data' },
                { status: 500 }
            )
        }

        return NextResponse.json({ data: data || null })
    } catch (error) {
        console.error('Error in credit management GET:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
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
        const { requestId } = await params
        const body: CreditManagementFormData = await request.json()

        // Get current user
        const { data: { user }, error: authError } = await supabase.auth.getUser()
        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Check if record exists
        const { data: existing } = await supabase
            .from('credit_management')
            .select('id')
            .eq('request_id', requestId)
            .single()

        let result
        if (existing) {
            // Update existing record
            const { data, error } = await supabase
                .from('credit_management')
                .update({
                    ...body,
                    updated_by: user.id
                })
                .eq('request_id', requestId)
                .select()
                .single()

            if (error) {
                console.error('Error updating credit management data:', error)
                return NextResponse.json(
                    { error: 'Failed to update credit management data' },
                    { status: 500 }
                )
            }
            result = data
        } else {
            // Create new record
            const { data, error } = await supabase
                .from('credit_management')
                .insert({
                    request_id: requestId,
                    ...body,
                    created_by: user.id,
                    updated_by: user.id
                })
                .select()
                .single()

            if (error) {
                console.error('Error creating credit management data:', error)
                return NextResponse.json(
                    { error: 'Failed to create credit management data' },
                    { status: 500 }
                )
            }
            result = data
        }

        return NextResponse.json({ data: result })
    } catch (error) {
        console.error('Error in credit management POST:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { requestId } = await params

        const { error } = await supabase
            .from('credit_management')
            .delete()
            .eq('request_id', requestId)

        if (error) {
            console.error('Error deleting credit management data:', error)
            return NextResponse.json(
                { error: 'Failed to delete credit management data' },
                { status: 500 }
            )
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error in credit management DELETE:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}