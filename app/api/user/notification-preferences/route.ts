import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface NotificationPreferences {
    browser_notifications: boolean;
    email_notifications: boolean;
    sms_notifications: boolean;
    sound_enabled: boolean;
    notification_types: {
        processing_complete: boolean;
        processing_failed: boolean;
        retry_started: boolean;
        queue_position_update: boolean;
        system_alerts: boolean;
    };
    quiet_hours: {
        enabled: boolean;
        start_time: string;
        end_time: string;
    };
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    browser_notifications: true,
    email_notifications: false,
    sms_notifications: false,
    sound_enabled: true,
    notification_types: {
        processing_complete: true,
        processing_failed: true,
        retry_started: true,
        queue_position_update: false,
        system_alerts: true
    },
    quiet_hours: {
        enabled: false,
        start_time: '22:00',
        end_time: '08:00'
    }
};

export async function GET(request: NextRequest) {
    // try {
    //     const supabase = await createServerSupabaseClient()

    //     const { data: { user }, error: authError } = await supabase.auth.getUser()
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //     }

    //     // Get user preferences from database
    //     const { data: preferences, error: fetchError } = await supabase
    //         .from('user_notification_preferences')
    //         .select('preferences')
    //         .eq('user_id', user.id)
    //         .single()

    //     if (fetchError && fetchError.code !== 'PGRST116') {
    //         console.error('Database error:', fetchError)
    //         return NextResponse.json({
    //             error: 'Failed to fetch notification preferences'
    //         }, { status: 500 })
    //     }

    //     // Return stored preferences or defaults
    //     const userPreferences = preferences?.preferences || DEFAULT_PREFERENCES

    //     return NextResponse.json(userPreferences)

    // } catch (error) {
    //     console.error('Notification preferences fetch error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}

// export async function PUT(request: NextRequest) {
//     try {
//         const supabase = await createServerSupabaseClient()

//         const { data: { user }, error: authError } = await supabase.auth.getUser()
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
//         }

//         const body = await request.json()
//         const preferences: NotificationPreferences = body

//         // Validate preferences structure
//         if (!preferences || typeof preferences !== 'object') {
//             return NextResponse.json({
//                 error: 'Invalid preferences format'
//             }, { status: 400 })
//         }

//         // Merge with defaults to ensure all fields are present
//         const mergedPreferences = {
//             ...DEFAULT_PREFERENCES,
//             ...preferences,
//             notification_types: {
//                 ...DEFAULT_PREFERENCES.notification_types,
//                 ...preferences.notification_types
//             },
//             quiet_hours: {
//                 ...DEFAULT_PREFERENCES.quiet_hours,
//                 ...preferences.quiet_hours
//             }
//         }

//         // Upsert preferences
//         const { data: updatedPreferences, error: upsertError } = await supabase
//             .from('user_notification_preferences')
//             .upsert({
//                 user_id: user.id,
//                 preferences: mergedPreferences,
//                 updated_at: new Date().toISOString()
//             }, {
//                 onConflict: 'user_id'
//             })
//             .select()
//             .single()

//         if (upsertError) {
//             console.error('Database error:', upsertError)
//             return NextResponse.json({
//                 error: 'Failed to save notification preferences'
//             }, { status: 500 })
//         }

//         return NextResponse.json({
//             success: true,
//             message: 'Notification preferences updated',
//             preferences: updatedPreferences.preferences
//         })

//     } catch (error) {
//         console.error('Notification preferences update error:', error)
//         return NextResponse.json({
//             error: 'Internal server error'
//         }, { status: 500 })
//     }
// }