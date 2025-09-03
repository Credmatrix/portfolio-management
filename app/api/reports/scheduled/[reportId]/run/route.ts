import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

export async function POST(
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
    //     const { data: scheduledReport, error: fetchError } = await supabase
    //         .from('scheduled_reports')
    //         .select('*')
    //         .eq('id', reportId)
    //         .eq('user_id', user.id)
    //         .single();

    //     if (fetchError || !scheduledReport) {
    //         return NextResponse.json(
    //             { error: 'Scheduled report not found' },
    //             { status: 404 }
    //         );
    //     }

    //     // Create a report generation job based on the scheduled report
    //     const reportJobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    //     const reportJob = {
    //         id: reportJobId,
    //         user_id: user.id,
    //         template_id: scheduledReport.template_id,
    //         name: `${scheduledReport.name} - Manual Run`,
    //         description: `Manual execution of scheduled report: ${scheduledReport.description}`,
    //         format: scheduledReport.format,
    //         sections: getTemplateSections(scheduledReport.template_id),
    //         filters: scheduledReport.filters,
    //         status: 'pending',
    //         scheduled_report_id: reportId,
    //         created_at: new Date().toISOString(),
    //         updated_at: new Date().toISOString()
    //     };

    //     // Store report job in database
    //     const { error: insertError } = await supabase
    //         .from('report_generation_jobs')
    //         .insert(reportJob);

    //     if (insertError) {
    //         console.error('Error creating report job:', insertError);
    //         return NextResponse.json(
    //             { error: 'Failed to create report generation job' },
    //             { status: 500 }
    //         );
    //     }

    //     // Update scheduled report's last run time
    //     await supabase
    //         .from('scheduled_reports')
    //         .update({
    //             last_run: new Date().toISOString(),
    //             updated_at: new Date().toISOString()
    //         })
    //         .eq('id', reportId);

    //     // Start report generation process (in background)
    //     generateScheduledReport(reportJobId, scheduledReport, user.id);

    //     return NextResponse.json({
    //         jobId: reportJobId,
    //         message: 'Report generation started successfully',
    //         status: 'pending'
    //     });

    // } catch (error) {
    //     console.error('Error running scheduled report:', error);
    //     return NextResponse.json(
    //         { error: 'Internal server error' },
    //         { status: 500 }
    //     );
    // }
}

// async function generateScheduledReport(
//     jobId: string,
//     scheduledReport: any,
//     userId: string
// ) {
//     try {
//         const supabase = await createServerSupabaseClient();

//         // Update job status to processing
//         await supabase
//             .from('report_generation_jobs')
//             .update({
//                 status: 'processing',
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', jobId);

//         // Fetch portfolio data based on filters
//         const portfolioData = await fetchPortfolioData(scheduledReport.filters, userId);

//         // Generate report content
//         const sections = getTemplateSections(scheduledReport.template_id);
//         const reportContent = await generateReportContent(sections, portfolioData);

//         // Generate report file
//         const fileUrl = await generateReportFile(jobId, scheduledReport.format, reportContent);

//         // Send email to recipients
//         await sendReportEmail(scheduledReport.recipients, scheduledReport.name, fileUrl);

//         // Update job with completion status
//         await supabase
//             .from('report_generation_jobs')
//             .update({
//                 status: 'completed',
//                 file_url: fileUrl,
//                 completed_at: new Date().toISOString(),
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', jobId);

//         console.log(`Scheduled report ${jobId} generated and sent successfully`);

//     } catch (error) {
//         console.error(`Error generating scheduled report ${jobId}:`, error);

//         // Update job with error status
//         const supabase = await createServerSupabaseClient();
//         await supabase
//             .from('report_generation_jobs')
//             .update({
//                 status: 'failed',
//                 error_message: error instanceof Error ? error.message : 'Unknown error',
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', jobId);
//     }
// }

// function getTemplateSections(templateId: string): string[] {
//     const templateSections: { [key: string]: string[] } = {
//         'portfolio-overview': ['executive-summary', 'portfolio-overview', 'risk-distribution', 'industry-breakdown', 'top-performers'],
//         'risk-assessment': ['risk-distribution', 'parameter-analysis', 'high-risk-companies', 'compliance-status', 'recommendations'],
//         'compliance-report': ['compliance-status', 'gst-analysis', 'epfo-analysis', 'recommendations'],
//         'financial-analysis': ['financial-summary', 'trend-analysis', 'peer-comparison', 'recommendations'],
//         'executive-summary': ['executive-summary', 'top-performers', 'high-risk-companies', 'recommendations'],
//         'regulatory-compliance': ['compliance-status', 'gst-analysis', 'epfo-analysis', 'audit-qualifications', 'directors-analysis']
//     };

//     return templateSections[templateId] || ['executive-summary'];
// }

// async function fetchPortfolioData(filters: any, userId: string) {
//     const supabase = await createServerSupabaseClient();

//     let query = supabase
//         .from('document_processing_requests')
//         .select(`
//             *,
//             extracted_data,
//             risk_analysis
//         `)
//         .eq('user_id', userId)
//         .eq('status', 'completed');

//     // Apply filters
//     if (filters.industries && filters.industries.length > 0) {
//         query = query.in('industry', filters.industries);
//     }

//     if (filters.riskGrades && filters.riskGrades.length > 0) {
//         query = query.in('risk_grade', filters.riskGrades);
//     }

//     const { data, error } = await query;

//     if (error) {
//         throw new Error(`Failed to fetch portfolio data: ${error.message}`);
//     }

//     return data || [];
// }

// async function generateReportContent(sections: string[], portfolioData: any[]) {
//     const content: any = {};

//     for (const sectionId of sections) {
//         switch (sectionId) {
//             case 'executive-summary':
//                 content.executiveSummary = generateExecutiveSummary(portfolioData);
//                 break;
//             case 'portfolio-overview':
//                 content.portfolioOverview = generatePortfolioOverview(portfolioData);
//                 break;
//             case 'risk-distribution':
//                 content.riskDistribution = generateRiskDistribution(portfolioData);
//                 break;
//             case 'industry-breakdown':
//                 content.industryBreakdown = generateIndustryBreakdown(portfolioData);
//                 break;
//             case 'parameter-analysis':
//                 content.parameterAnalysis = generateParameterAnalysis(portfolioData);
//                 break;
//             case 'compliance-status':
//                 content.complianceStatus = generateComplianceStatus(portfolioData);
//                 break;
//             case 'financial-summary':
//                 content.financialSummary = generateFinancialSummary(portfolioData);
//                 break;
//             case 'top-performers':
//                 content.topPerformers = generateTopPerformers(portfolioData);
//                 break;
//             case 'high-risk-companies':
//                 content.highRiskCompanies = generateHighRiskCompanies(portfolioData);
//                 break;
//             case 'recommendations':
//                 content.recommendations = generateRecommendations(portfolioData);
//                 break;
//         }
//     }

//     return content;
// }

// async function generateReportFile(jobId: string, format: string, content: any) {
//     // In a real implementation, this would generate actual files using libraries like:
//     // - PDFKit for PDF generation
//     // - ExcelJS for Excel files
//     // - CSV generation for CSV files

//     const fileName = `scheduled_report_${jobId}.${format}`;
//     const fileUrl = `/api/reports/download/${fileName}`;

//     // Store the report content for later retrieval
//     // This would typically be saved to cloud storage (S3, etc.)

//     return fileUrl;
// }

// async function sendReportEmail(recipients: string[], reportName: string, fileUrl: string) {
//     // In a real implementation, this would send emails using a service like:
//     // - SendGrid
//     // - AWS SES
//     // - Nodemailer with SMTP

//     console.log(`Sending report "${reportName}" to recipients:`, recipients);
//     console.log(`Report URL: ${fileUrl}`);

//     // Mock email sending
//     for (const recipient of recipients) {
//         console.log(`Email sent to ${recipient}`);
//     }
// }

// // Helper functions for report content generation
// function generateExecutiveSummary(data: any[]) {
//     const totalCompanies = data.length;
//     const totalExposure = data.reduce((sum, company) => sum + (company.recommended_limit || 0), 0);
//     const avgRiskScore = data.reduce((sum, company) => sum + (company.risk_score || 0), 0) / totalCompanies;

//     return {
//         totalCompanies,
//         totalExposure,
//         avgRiskScore,
//         keyInsights: [
//             `Portfolio contains ${totalCompanies} companies with total exposure of ₹${(totalExposure / 10000000).toFixed(1)}Cr`,
//             `Average risk score is ${avgRiskScore.toFixed(1)}%`
//         ]
//     };
// }

// function generatePortfolioOverview(data: any[]) {
//     return {
//         totalCompanies: data.length,
//         totalExposure: data.reduce((sum, company) => sum + (company.recommended_limit || 0), 0),
//         industryDistribution: data.reduce((acc, company) => {
//             const industry = company.industry || 'Unknown';
//             acc[industry] = (acc[industry] || 0) + 1;
//             return acc;
//         }, {})
//     };
// }

// function generateRiskDistribution(data: any[]) {
//     return data.reduce((acc, company) => {
//         const grade = company.risk_grade || 'Ungraded';
//         acc[grade] = (acc[grade] || 0) + 1;
//         return acc;
//     }, {});
// }

// function generateIndustryBreakdown(data: any[]) {
//     return data.reduce((acc, company) => {
//         const industry = company.industry || 'Unknown';
//         if (!acc[industry]) {
//             acc[industry] = { count: 0, totalExposure: 0 };
//         }
//         acc[industry].count++;
//         acc[industry].totalExposure += company.recommended_limit || 0;
//         return acc;
//     }, {});
// }

// function generateParameterAnalysis(data: any[]) {
//     // Mock parameter analysis
//     return {
//         avgFinancialScore: 75,
//         avgBusinessScore: 68,
//         avgHygieneScore: 82,
//         avgBankingScore: 71
//     };
// }

// function generateComplianceStatus(data: any[]) {
//     const gstCompliant = data.filter(c => c.extracted_data?.gst_records?.active_gstins?.length > 0).length;
//     const epfoCompliant = data.filter(c => c.extracted_data?.epfo_records?.establishments?.length > 0).length;

//     return {
//         gstCompliance: { compliant: gstCompliant, total: data.length },
//         epfoCompliance: { compliant: epfoCompliant, total: data.length }
//     };
// }

// function generateFinancialSummary(data: any[]) {
//     return {
//         companiesWithFinancials: data.filter(c => c.extracted_data?.financial_data).length,
//         totalCompanies: data.length
//     };
// }

// function generateTopPerformers(data: any[]) {
//     return data
//         .filter(company => company.risk_score >= 70)
//         .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
//         .slice(0, 10)
//         .map(company => ({
//             name: company.company_name,
//             riskScore: company.risk_score,
//             riskGrade: company.risk_grade
//         }));
// }

// function generateHighRiskCompanies(data: any[]) {
//     return data
//         .filter(company => company.risk_grade === 'CM4' || company.risk_grade === 'CM5')
//         .map(company => ({
//             name: company.company_name,
//             riskScore: company.risk_score,
//             riskGrade: company.risk_grade
//         }));
// }

// function generateRecommendations(data: any[]) {
//     const recommendations = [];
//     const highRiskCount = data.filter(c => c.risk_grade === 'CM4' || c.risk_grade === 'CM5').length;

//     if (highRiskCount > data.length * 0.2) {
//         recommendations.push({
//             type: 'risk',
//             priority: 'high',
//             title: 'High Risk Concentration',
//             description: `${highRiskCount} companies are in high-risk categories. Consider portfolio rebalancing.`
//         });
//     }

//     return recommendations;
// }