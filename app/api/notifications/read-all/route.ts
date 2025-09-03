import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PUT(request: NextRequest) {
    // try {
    //     const supabase = await createServerSupabaseClient()

    //     const { data: { user }, error: authError } = await supabase.auth.getUser()
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //     }

    //     // Mark all unread notifications as read for the user
    //     const { data: notifications, error: updateError } = await supabase
    //         .from('notifications')
    //         .update({
    //             read: true,
    //             read_at: new Date().toISOString()
    //         })
    //         .eq('user_id', user.id)
    //         .eq('read', false)
    //         .select('id')

    //     if (updateError) {
    //         console.error('Database error:', updateError)
    //         return NextResponse.json({
    //             error: 'Failed to mark notifications as read'
    //         }, { status: 500 })
    //     }

    //     const updatedCount = notifications?.length || 0

    //     return NextResponse.json({
    //         success: true,
    //         message: `Marked ${updatedCount} notifications as read`,
    //         updated_count: updatedCount
    //     })

    // } catch (error) {
    //     console.error('Mark all notifications read error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}