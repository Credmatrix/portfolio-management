import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ reportId: string }> }
) {
    // try {
    //     const supabase = createServerSupabaseClient();

    //     // Verify authentication
    //     const { data: { user }, error: authError } = await supabase.auth.getUser();
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }

    //     const { reportId } = await params;

    //     // Fetch scheduled report
    //     const { data: report, error } = await supabase
    //         .from('scheduled_reports')
    //         .select('*')
    //         .eq('id', reportId)
    //         .eq('user_id', user.id)
    //         .single();

    //     if (error || !report) {
    //         return NextResponse.json(
    //             { error: 'Scheduled report not found' },
    //             { status: 404 }
    //         );
    //     }

    //     // Calculate next run time
    //     const nextRun = calculateNextRun(report.schedule);

    //     return NextResponse.json({
    //         ...report,
    //         nextRun
    //     });

    // } catch (error) {
    //     console.error('Error fetching scheduled report:', error);
    //     return NextResponse.json(
    //         { error: 'Internal server error' },
    //         { status: 500 }
    //     );
    // }
}

// export async function PUT(
//     request: NextRequest,
//     { params }: { params: Promise<{ reportId: string }> }
// ) {
//     try {
//         const supabase = createClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { reportId } = await params;
//         const reportData = await request.json();

//         // Validate required fields
//         if (!reportData.name || !reportData.templateId || reportData.recipients.length === 0) {
//             return NextResponse.json(
//                 { error: 'Missing required fields: name, templateId, and recipients' },
//                 { status: 400 }
//             );
//         }

//         // Validate email addresses
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         const invalidEmails = reportData.recipients.filter((email: string) => !emailRegex.test(email));
//         if (invalidEmails.length > 0) {
//             return NextResponse.json(
//                 { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
//                 { status: 400 }
//             );
//         }

//         // Calculate next run time
//         const nextRun = calculateNextRun(reportData.schedule);

//         // Update scheduled report
//         const { error: updateError } = await supabase
//             .from('scheduled_reports')
//             .update({
//                 name: reportData.name,
//                 description: reportData.description,
//                 template_id: reportData.templateId,
//                 schedule: reportData.schedule,
//                 recipients: reportData.recipients,
//                 format: reportData.format,
//                 filters: reportData.filters,
//                 is_active: reportData.isActive,
//                 next_run: nextRun,
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', reportId)
//             .eq('user_id', user.id);

//         if (updateError) {
//             console.error('Error updating scheduled report:', updateError);
//             return NextResponse.json(
//                 { error: 'Failed to update scheduled report' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             message: 'Scheduled report updated successfully',
//             nextRun
//         });

//     } catch (error) {
//         console.error('Error updating scheduled report:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// export async function DELETE(
//     request: NextRequest,
//     { params }: { params: Promise<{ reportId: string }> }
// ) {
//     try {
//         const supabase = createClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { reportId } = await params;

//         // Delete scheduled report
//         const { error: deleteError } = await supabase
//             .from('scheduled_reports')
//             .delete()
//             .eq('id', reportId)
//             .eq('user_id', user.id);

//         if (deleteError) {
//             console.error('Error deleting scheduled report:', deleteError);
//             return NextResponse.json(
//                 { error: 'Failed to delete scheduled report' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             message: 'Scheduled report deleted successfully'
//         });

//     } catch (error) {
//         console.error('Error deleting scheduled report:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// export async function PATCH(
//     request: NextRequest,
//     { params }: { params: Promise<{ reportId: string }> }
// ) {
//     try {
//         const supabase = createClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const { reportId } = await params;
//         const { isActive } = await request.json();

//         // Update report active status
//         const { error: updateError } = await supabase
//             .from('scheduled_reports')
//             .update({
//                 is_active: isActive,
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', reportId)
//             .eq('user_id', user.id);

//         if (updateError) {
//             console.error('Error updating report status:', updateError);
//             return NextResponse.json(
//                 { error: 'Failed to update report status' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             message: `Report ${isActive ? 'activated' : 'deactivated'} successfully`
//         });

//     } catch (error) {
//         console.error('Error updating report status:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// function calculateNextRun(schedule: any): string {
//     const now = new Date();
//     const [hours, minutes] = schedule.time.split(':').map(Number);

//     let nextRun = new Date();
//     nextRun.setHours(hours, minutes, 0, 0);

//     switch (schedule.frequency) {
//         case 'daily':
//             // If time has passed today, schedule for tomorrow
//             if (nextRun <= now) {
//                 nextRun.setDate(nextRun.getDate() + 1);
//             }
//             break;

//         case 'weekly':
//             const targetDayOfWeek = schedule.dayOfWeek || 1; // Default to Monday
//             const currentDayOfWeek = nextRun.getDay();
//             let daysUntilTarget = targetDayOfWeek - currentDayOfWeek;

//             if (daysUntilTarget < 0 || (daysUntilTarget === 0 && nextRun <= now)) {
//                 daysUntilTarget += 7;
//             }

//             nextRun.setDate(nextRun.getDate() + daysUntilTarget);
//             break;

//         case 'monthly':
//             const targetDayOfMonth = schedule.dayOfMonth || 1;
//             nextRun.setDate(targetDayOfMonth);

//             // If the target day has passed this month, move to next month
//             if (nextRun <= now) {
//                 nextRun.setMonth(nextRun.getMonth() + 1);
//                 nextRun.setDate(targetDayOfMonth);
//             }
//             break;

//         case 'quarterly':
//             // Schedule for the first day of next quarter
//             const currentQuarter = Math.floor(nextRun.getMonth() / 3);
//             const nextQuarterMonth = (currentQuarter + 1) * 3;

//             if (nextQuarterMonth >= 12) {
//                 nextRun.setFullYear(nextRun.getFullYear() + 1);
//                 nextRun.setMonth(0);
//             } else {
//                 nextRun.setMonth(nextQuarterMonth);
//             }
//             nextRun.setDate(1);
//             break;
//     }

//     return nextRun.toISOString();
// }