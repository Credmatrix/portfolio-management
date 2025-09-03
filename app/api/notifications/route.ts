import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ProcessingNotification {
    id: string;
    type: 'success' | 'error' | 'info' | 'warning';
    title: string;
    message: string;
    request_id?: string;
    company_name?: string;
    timestamp: string;
    read: boolean;
    actions?: Array<{
        label: string;
        action: string;
        variant?: 'primary' | 'secondary';
    }>;
}

export async function GET(request: NextRequest) {
    // try {
    //     const supabase = await createServerSupabaseClient()

    //     const { data: { user }, error: authError } = await supabase.auth.getUser()
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //     }

    //     const { searchParams } = new URL(request.url)
    //     const requestId = searchParams.get('request_id')
    //     const limit = parseInt(searchParams.get('limit') || '50')
    //     const offset = parseInt(searchParams.get('offset') || '0')

    //     // Build query for notifications
    //     let query = supabase
    //         .from('notifications')
    //         .select('*')
    //         .eq('user_id', user.id)
    //         .order('created_at', { ascending: false })
    //         .range(offset, offset + limit - 1)

    //     // Filter by request_id if provided
    //     if (requestId) {
    //         query = query.eq('request_id', requestId)
    //     }

    //     const { data: notifications, error: fetchError } = await query

    //     if (fetchError) {
    //         console.error('Database error:', fetchError)
    //         return NextResponse.json({
    //             error: 'Failed to fetch notifications'
    //         }, { status: 500 })
    //     }

    //     // Transform database notifications to the expected format
    //     const transformedNotifications: ProcessingNotification[] = (notifications || []).map(notification => ({
    //         id: notification.id,
    //         type: notification.type,
    //         title: notification.title,
    //         message: notification.message,
    //         request_id: notification.request_id,
    //         company_name: notification.company_name,
    //         timestamp: notification.created_at,
    //         read: notification.read || false,
    //         actions: notification.actions || []
    //     }))

    //     // Get unread count
    //     const { count: unreadCount } = await supabase
    //         .from('notifications')
    //         .select('*', { count: 'exact', head: true })
    //         .eq('user_id', user.id)
    //         .eq('read', false)

    //     return NextResponse.json({
    //         notifications: transformedNotifications,
    //         unread_count: unreadCount || 0,
    //         total_count: notifications?.length || 0
    //     })

    // } catch (error) {
    //     console.error('Notifications fetch error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}

// export async function POST(request: NextRequest) {
//     try {
//         const supabase = await createServerSupabaseClient()

//         const { data: { user }, error: authError } = await supabase.auth.getUser()
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//         }

//         const body = await request.json()
//         const {
//             type,
//             title,
//             message,
//             request_id,
//             company_name,
//             actions
//         } = body

//         // Validate required fields
//         if (!type || !title || !message) {
//             return NextResponse.json({
//                 error: 'Missing required fields: type, title, message'
//             }, { status: 400 })
//         }

//         // Create notification
//         const { data: notification, error: insertError } = await supabase
//             .from('notifications')
//             .insert({
//                 user_id: user.id,
//                 type,
//                 title,
//                 message,
//                 request_id,
//                 company_name,
//                 actions,
//                 read: false,
//                 created_at: new Date().toISOString()
//             })
//             .select()
//             .single()

//         if (insertError) {
//             console.error('Database error:', insertError)
//             return NextResponse.json({
//                 error: 'Failed to create notification'
//             }, { status: 500 })
//         }

//         return NextResponse.json({
//             success: true,
//             notification: {
//                 id: notification.id,
//                 type: notification.type,
//                 title: notification.title,
//                 message: notification.message,
//                 request_id: notification.request_id,
//                 company_name: notification.company_name,
//                 timestamp: notification.created_at,
//                 read: notification.read,
//                 actions: notification.actions
//             }
//         })

//     } catch (error) {
//         console.error('Notification creation error:', error)
//         return NextResponse.json({
//             error: 'Internal server error'
//         }, { status: 500 })
//     }
// }