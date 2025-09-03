import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
    // try {
    //     const supabase = await createServerSupabaseClient();

    //     // Verify authentication
    //     const { data: { user }, error: authError } = await supabase.auth.getUser();
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }

    //     const { searchParams } = new URL(request.url);
    //     const filename = searchParams.get('filename');
    //     const jobId = searchParams.get('jobId');

    //     if (!filename && !jobId) {
    //         return NextResponse.json(
    //             { error: 'Missing filename or jobId parameter' },
    //             { status: 400 }
    //         );
    //     }

    //     let fileUrl: string;
    //     let reportName: string;

    //     if (jobId) {
    //         // Fetch report job to get file URL
    //         const { data: job, error: jobError } = await supabase
    //             .from('report_generation_jobs')
    //             .select('file_url, name, status')
    //             .eq('id', jobId)
    //             .eq('user_id', user.id)
    //             .single();

    //         if (jobError || !job) {
    //             return NextResponse.json(
    //                 { error: 'Report job not found' },
    //                 { status: 404 }
    //             );
    //         }

    //         if (job.status !== 'completed') {
    //             return NextResponse.json(
    //                 { error: 'Report is not ready for download' },
    //                 { status: 400 }
    //             );
    //         }

    //         fileUrl = job.file_url;
    //         reportName = job.name;
    //     } else {
    //         // Direct filename download
    //         fileUrl = `/reports/${filename}`;
    //         reportName = filename || 'report';
    //     }

    //     // In a real implementation, this would:
    //     // 1. Fetch the file from cloud storage (S3, etc.)
    //     // 2. Stream the file content to the client
    //     // 3. Set appropriate headers for file download

    //     // For now, return a mock response
    //     return NextResponse.json({
    //         downloadUrl: fileUrl,
    //         filename: reportName,
    //         message: 'File ready for download'
    //     });

    // } catch (error) {
    //     console.error('Error in report download:', error);
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

//         const { reportId, format } = await request.json();

//         if (!reportId) {
//             return NextResponse.json(
//                 { error: 'Missing reportId' },
//                 { status: 400 }
//             );
//         }

//         // Fetch the report data
//         const { data: report, error: reportError } = await supabase
//             .from('document_processing_requests')
//             .select(`
//                 *,
//                 extracted_data,
//                 risk_analysis
//             `)
//             .eq('request_id', reportId)
//             .eq('user_id', user.id)
//             .single();

//         if (reportError || !report) {
//             return NextResponse.json(
//                 { error: 'Report not found' },
//                 { status: 404 }
//             );
//         }

//         // Generate download file based on format
//         const downloadResult = await generateDownloadFile(report, format || 'pdf');

//         return NextResponse.json({
//             downloadUrl: downloadResult.downloadUrl,
//             filename: downloadResult.filename,
//             message: 'Report ready for download'
//         });

//     } catch (error) {
//         console.error('Error generating download:', error);
//         return NextResponse.json(
//             { error: 'Internal server error' },
//             { status: 500 }
//         );
//     }
// }

// async function generateDownloadFile(report: any, format: string) {
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const companyName = report.company_name.replace(/[^a-zA-Z0-9]/g, '_');
//     const filename = `${companyName}_report_${timestamp}.${format}`;

//     // In a real implementation, this would generate actual files
//     switch (format) {
//         case 'pdf':
//             return generatePDFReport(report, filename);
//         case 'excel':
//             return generateExcelReport(report, filename);
//         case 'csv':
//             return generateCSVReport(report, filename);
//         default:
//             throw new Error(`Unsupported format: ${format}`);
//     }
// }

// async function generatePDFReport(report: any, filename: string) {
//     // In a real implementation, use PDFKit or similar library
//     const downloadUrl = `/api/reports/files/${filename}`;

//     // Mock PDF generation
//     console.log(`Generating PDF report for ${report.company_name}`);

//     return { downloadUrl, filename };
// }

// async function generateExcelReport(report: any, filename: string) {
//     // In a real implementation, use ExcelJS or similar library
//     const downloadUrl = `/api/reports/files/${filename}`;

//     // Mock Excel generation
//     console.log(`Generating Excel report for ${report.company_name}`);

//     return { downloadUrl, filename };
// }

// async function generateCSVReport(report: any, filename: string) {
//     // Generate CSV content
//     const csvData = [
//         ['Field', 'Value'],
//         ['Company Name', report.company_name],
//         ['Industry', report.industry],
//         ['Risk Score', report.risk_score],
//         ['Risk Grade', report.risk_grade],
//         ['Recommended Limit', report.recommended_limit],
//         ['Processing Status', report.status],
//         ['Submitted At', report.submitted_at],
//         ['Completed At', report.completed_at]
//     ];

//     // Add financial data if available
//     if (report.extracted_data?.financial_data) {
//         csvData.push(['', '']); // Empty row
//         csvData.push(['Financial Data', '']);
//         // Add financial metrics here
//     }

//     // Add risk analysis if available
//     if (report.risk_analysis) {
//         csvData.push(['', '']); // Empty row
//         csvData.push(['Risk Analysis', '']);
//         csvData.push(['Overall Score', report.risk_analysis.totalWeightedScore]);
//         csvData.push(['Overall Grade', report.risk_analysis.overallGrade?.grade]);
//         csvData.push(['Model Type', report.risk_analysis.modelType]);
//     }

//     const downloadUrl = `/api/reports/files/${filename}`;

//     // In a real implementation, save CSV content to storage
//     console.log(`Generating CSV report for ${report.company_name}`);

//     return { downloadUrl, filename };
// }