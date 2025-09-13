import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { CreditManagement, CreditManagementFormData } from '@/types/credit-management.types'

// Import the exact enum types from database schema
import { Database } from '@/types/database.types'

type CollectionFeedbackType = Database['public']['Enums']['collection_feedback_type']
type SecurityRequirementType = Database['public']['Enums']['security_requirement_type']
type CreditType = Database['public']['Enums']['credit_type']
type RepaymentType = Database['public']['Enums']['repayment_type']
type LpiReceivedType = Database['public']['Enums']['lpi_received_type']

// Validation function for enum fields
function validateEnumField<T extends string>(value: string | undefined, allowedValues: readonly T[], fieldName: string): T | null {
    if (!value) return null
    if (allowedValues.includes(value as T)) {
        return value as T
    }
    console.warn(`Invalid ${fieldName} value: ${value}. Allowed values: ${allowedValues.join(', ')}`)
    return null
}

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

        // Validate and sanitize enum fields using exact database enum values
        const sanitizedData = {
            ...body,
            collection_feedback: validateEnumField(
                body.collection_feedback,
                ["Good", "OK", "Bad", "No-Go", "Credit Call", "Business Call", "No Business", "Limited rotations"] as const,
                'collection_feedback'
            ),
            security_requirements: validateEnumField(
                body.security_requirements,
                ["CC", "BG", "Advance", "Others"] as const,
                'security_requirements'
            ),
            credit_type: validateEnumField(
                body.credit_type,
                ["Secured", "Unsecured", "Secured+Unsecured"] as const,
                'credit_type'
            ),
            repayment: validateEnumField(
                body.repayment,
                ["Before time", "Timely", "Slight Delay", "Huge Delay"] as const,
                'repayment'
            ),
            lpi_received: validateEnumField(
                body.lpi_received,
                ["NA", "Yes", "No"] as const,
                'lpi_received'
            )
        }

        let result
        if (existing) {
            // Update existing record
            const { data, error } = await supabase
                .from('credit_management')
                .update({
                    ...sanitizedData,
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
                    ...sanitizedData,
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