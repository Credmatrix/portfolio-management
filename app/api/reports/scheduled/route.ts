import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ScheduledReportRequest {
    name: string;
    description: string;
    templateId: string;
    schedule: {
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        dayOfWeek?: number;
        dayOfMonth?: number;
        time: string;
    };
    recipients: string[];
    format: 'pdf' | 'excel' | 'csv';
    filters: {
        industries: string[];
        riskGrades: string[];
    };
    isActive: boolean;
}

export async function GET(request: NextRequest) {
    // try {
    //     const supabase = createClient();

    //     // Verify authentication
    //     const { data: { user }, error: authError } = await supabase.auth.getUser();
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }

    //     // Fetch scheduled reports for the user
    //     const { data: scheduledReports, error } = await supabase
    //         .from('scheduled_reports')
    //         .select('*')
    //         .eq('user_id', user.id)
    //         .order('created_at', { ascending: false });

    //     if (error) {
    //         console.error('Error fetching scheduled reports:', error);
    //         return NextResponse.json(
    //             { error: 'Failed to fetch scheduled reports' },
    //             { status: 500 }
    //         );
    //     }

    //     // Calculate next run times for each report
    //     const reportsWithNextRun = scheduledReports.map(report => ({
    //         ...report,
    //         nextRun: calculateNextRun(report.schedule)
    //     }));

    //     return NextResponse.json(reportsWithNextRun);

    // } catch (error) {
    //     console.error('Error in scheduled reports GET:', error);
    //     return NextResponse.json(
    //         { error: 'Internal server error' },
    //         { status: 500 }
    //     );
    // }
}

// export async function POST(request: NextRequest) {
//     try {
//         const supabase = createClient();

//         // Verify authentication
//         const { data: { user }, error: authError } = await supabase.auth.getUser();
//         if (authError || !user) {
//             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
//         }

//         const reportData: ScheduledReportRequest = await request.json();

//         // Validate required fields
//         if (!reportData.name || !reportData.templateId || reportData.recipients.length === 0) {
//             return NextResponse.json(
//                 { error: 'Missing required fields: name, templateId, and recipients' },
//                 { status: 400 }
//             );
//         }

//         // Validate email addresses
//         const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//         const invalidEmails = reportData.recipients.filter(email => !emailRegex.test(email));
//         if (invalidEmails.length > 0) {
//             return NextResponse.json(
//                 { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
//                 { status: 400 }
//             );
//         }

//         // Generate unique report ID
//         const reportId = `scheduled_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

//         // Calculate next run time
//         const nextRun = calculateNextRun(reportData.schedule);

//         // Create scheduled report
//         const scheduledReport = {
//             id: reportId,
//             user_id: user.id,
//             name: reportData.name,
//             description: reportData.description,
//             template_id: reportData.templateId,
//             schedule: reportData.schedule,
//             recipients: reportData.recipients,
//             format: reportData.format,
//             filters: reportData.filters,
//             is_active: reportData.isActive,
//             next_run: nextRun,
//             created_at: new Date().toISOString(),
//             created_by: user.email || user.id,
//             updated_at: new Date().toISOString()
//         };

//         const { error: insertError } = await supabase
//             .from('scheduled_reports')
//             .insert(scheduledReport);

//         if (insertError) {
//             console.error('Error creating scheduled report:', insertError);
//             return NextResponse.json(
//                 { error: 'Failed to create scheduled report' },
//                 { status: 500 }
//             );
//         }

//         return NextResponse.json({
//             id: reportId,
//             message: 'Scheduled report created successfully',
//             nextRun
//         });

//     } catch (error) {
//         console.error('Error in scheduled reports POST:', error);
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