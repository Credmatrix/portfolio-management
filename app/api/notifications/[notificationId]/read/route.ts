import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ notificationId: string }> }
) {
    // try {
    //     const supabase = await createServerSupabaseClient()

    //     const { data: { user }, error: authError } = await supabase.auth.getUser()
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //     }

    //     const { notificationId } = await params

    //     // Update notification as read
    //     const { data: notification, error: updateError } = await supabase
    //         .from('notifications')
    //         .update({
    //             read: true,
    //             read_at: new Date().toISOString()
    //         })
    //         .eq('id', notificationId)
    //         .eq('user_id', user.id) // Ensure user can only update their own notifications
    //         .select()
    //         .single()

    //     if (updateError) {
    //         if (updateError.code === 'PGRST116') {
    //             return NextResponse.json({
    //                 error: 'Notification not found'
    //             }, { status: 404 })
    //         }

    //         console.error('Database error:', updateError)
    //         return NextResponse.json({
    //             error: 'Failed to mark notification as read'
    //         }, { status: 500 })
    //     }

    //     return NextResponse.json({
    //         success: true,
    //         message: 'Notification marked as read',
    //         notification: {
    //             id: notification.id,
    //             read: notification.read,
    //             read_at: notification.read_at
    //         }
    //     })

    // } catch (error) {
    //     console.error('Mark notification read error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}