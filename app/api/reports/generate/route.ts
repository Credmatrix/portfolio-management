import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ReportGenerationRequest {
    templateId: string;
    name: string;
    description: string;
    format: 'pdf' | 'excel' | 'csv';
    sections: string[];
    filters: {
        industries: string[];
        riskGrades: string[];
        regions: string[];
        dateRange: {
            start: string;
            end: string;
        };
        companyIds?: string[];
    };
    generatedAt: string;
}

export async function POST(request: NextRequest) {
    // try {
    //     const supabase = createClient();

    //     // Verify authentication
    //     const { data: { user }, error: authError } = await supabase.auth.getUser();
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //     }

    //     const reportConfig: ReportGenerationRequest = await request.json();

    //     // Validate required fields
    //     if (!reportConfig.templateId || !reportConfig.name || reportConfig.sections.length === 0) {
    //         return NextResponse.json(
    //             { error: 'Missing required fields: templateId, name, and sections' },
    //             { status: 400 }
    //         );
    //     }

    //     // Generate unique report ID
    //     const reportId = `report_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    //     // Create report generation job
    //     const reportJob = {
    //         id: reportId,
    //         user_id: user.id,
    //         template_id: reportConfig.templateId,
    //         name: reportConfig.name,
    //         description: reportConfig.description,
    //         format: reportConfig.format,
    //         sections: reportConfig.sections,
    //         filters: reportConfig.filters,
    //         status: 'pending',
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

    //     // Start report generation process (in a real implementation, this would be queued)
    //     await generateReport(reportId, reportConfig, user.id);

    //     return NextResponse.json({
    //         reportId,
    //         status: 'pending',
    //         message: 'Report generation started successfully'
    //     });

    // } catch (error) {
    //     console.error('Error in report generation:', error);
    //     return NextResponse.json(
    //         { error: 'Internal server error' },
    //         { status: 500 }
    //     );
    // }
}

// async function generateReport(
//     reportId: string,
//     config: ReportGenerationRequest,
//     userId: string
// ) {
//     try {
//         const supabase = createClient();

//         // Update status to processing
//         await supabase
//             .from('report_generation_jobs')
//             .update({
//                 status: 'processing',
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', reportId);

//         // Fetch data based on filters
//         const portfolioData = await fetchPortfolioData(config.filters, userId);

//         // Generate report content based on selected sections
//         const reportContent = await generateReportContent(config.sections, portfolioData);

//         // Generate file based on format
//         const fileUrl = await generateReportFile(reportId, config.format, reportContent);

//         // Update job with completion status
//         await supabase
//             .from('report_generation_jobs')
//             .update({
//                 status: 'completed',
//                 file_url: fileUrl,
//                 completed_at: new Date().toISOString(),
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', reportId);

//         console.log(`Report ${reportId} generated successfully`);

//     } catch (error) {
//         console.error(`Error generating report ${reportId}:`, error);

//         // Update job with error status
//         const supabase = createClient();
//         await supabase
//             .from('report_generation_jobs')
//             .update({
//                 status: 'failed',
//                 error_message: error instanceof Error ? error.message : 'Unknown error',
//                 updated_at: new Date().toISOString()
//             })
//             .eq('id', reportId);
//     }
// }

// async function fetchPortfolioData(filters: any, userId: string) {
//     const supabase = createClient();

//     let query = supabase
//         .from('document_processing_requests')
//         .select(`
//       *,
//       extracted_data,
//       risk_analysis
//     `)
//         .eq('user_id', userId)
//         .eq('status', 'completed');

//     // Apply filters
//     if (filters.industries && filters.industries.length > 0) {
//         query = query.in('industry', filters.industries);
//     }

//     if (filters.riskGrades && filters.riskGrades.length > 0) {
//         query = query.in('risk_grade', filters.riskGrades);
//     }

//     if (filters.dateRange.start) {
//         query = query.gte('completed_at', filters.dateRange.start);
//     }

//     if (filters.dateRange.end) {
//         query = query.lte('completed_at', filters.dateRange.end);
//     }

//     if (filters.companyIds && filters.companyIds.length > 0) {
//         query = query.in('request_id', filters.companyIds);
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

// function generateExecutiveSummary(data: any[]) {
//     const totalCompanies = data.length;
//     const totalExposure = data.reduce((sum, company) => sum + (company.recommended_limit || 0), 0);
//     const avgRiskScore = data.reduce((sum, company) => sum + (company.risk_score || 0), 0) / totalCompanies;

//     const riskDistribution = data.reduce((acc, company) => {
//         const grade = company.risk_grade || 'Ungraded';
//         acc[grade] = (acc[grade] || 0) + 1;
//         return acc;
//     }, {});

//     return {
//         totalCompanies,
//         totalExposure,
//         avgRiskScore,
//         riskDistribution,
//         keyInsights: [
//             `Portfolio contains ${totalCompanies} companies with total exposure of ₹${(totalExposure / 10000000).toFixed(1)}Cr`,
//             `Average risk score is ${avgRiskScore.toFixed(1)}%`,
//             `${riskDistribution.CM4 || 0} companies are in high-risk category (CM4)`
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
//         }, {}),
//         processingStatus: data.reduce((acc, company) => {
//             acc[company.status] = (acc[company.status] || 0) + 1;
//             return acc;
//         }, {})
//     };
// }

// function generateRiskDistribution(data: any[]) {
//     const riskGrades = data.reduce((acc, company) => {
//         const grade = company.risk_grade || 'Ungraded';
//         acc[grade] = (acc[grade] || 0) + 1;
//         return acc;
//     }, {});

//     const riskScoreRanges = data.reduce((acc, company) => {
//         const score = company.risk_score || 0;
//         const range = score >= 80 ? 'Excellent' :
//             score >= 60 ? 'Good' :
//                 score >= 40 ? 'Average' :
//                     score >= 20 ? 'Poor' : 'Critical';
//         acc[range] = (acc[range] || 0) + 1;
//         return acc;
//     }, {});

//     return { riskGrades, riskScoreRanges };
// }

// function generateIndustryBreakdown(data: any[]) {
//     return data.reduce((acc, company) => {
//         const industry = company.industry || 'Unknown';
//         if (!acc[industry]) {
//             acc[industry] = {
//                 count: 0,
//                 totalExposure: 0,
//                 avgRiskScore: 0,
//                 companies: []
//             };
//         }
//         acc[industry].count++;
//         acc[industry].totalExposure += company.recommended_limit || 0;
//         acc[industry].companies.push({
//             name: company.company_name,
//             riskScore: company.risk_score,
//             riskGrade: company.risk_grade
//         });
//         return acc;
//     }, {});
// }

// function generateParameterAnalysis(data: any[]) {
//     // Analyze parameter scores across all companies
//     const parameterStats = {};

//     data.forEach(company => {
//         if (company.risk_analysis?.allScores) {
//             company.risk_analysis.allScores.forEach((param: any) => {
//                 if (!parameterStats[param.parameter]) {
//                     parameterStats[param.parameter] = {
//                         scores: [],
//                         category: param.category || 'Unknown'
//                     };
//                 }
//                 parameterStats[param.parameter].scores.push(param.score);
//             });
//         }
//     });

//     // Calculate statistics for each parameter
//     Object.keys(parameterStats).forEach(param => {
//         const scores = parameterStats[param].scores;
//         parameterStats[param].avg = scores.reduce((a, b) => a + b, 0) / scores.length;
//         parameterStats[param].min = Math.min(...scores);
//         parameterStats[param].max = Math.max(...scores);
//     });

//     return parameterStats;
// }

// function generateComplianceStatus(data: any[]) {
//     const gstCompliance = data.reduce((acc, company) => {
//         const gstRecords = company.extracted_data?.gst_records;
//         if (gstRecords?.active_gstins?.length > 0) {
//             acc.compliant++;
//         } else {
//             acc.nonCompliant++;
//         }
//         return acc;
//     }, { compliant: 0, nonCompliant: 0 });

//     const epfoCompliance = data.reduce((acc, company) => {
//         const epfoRecords = company.extracted_data?.epfo_records;
//         if (epfoRecords?.establishments?.length > 0) {
//             acc.compliant++;
//         } else {
//             acc.nonCompliant++;
//         }
//         return acc;
//     }, { compliant: 0, nonCompliant: 0 });

//     return { gstCompliance, epfoCompliance };
// }

// function generateFinancialSummary(data: any[]) {
//     // Analyze financial data across companies
//     const financialMetrics = {
//         totalRevenue: 0,
//         avgEbitdaMargin: 0,
//         avgDebtEquity: 0,
//         companiesWithFinancials: 0
//     };

//     data.forEach(company => {
//         const financialData = company.extracted_data["Standalone Financial Data"];
//         if (financialData) {
//             financialMetrics.companiesWithFinancials++;
//             // Add financial analysis logic here
//         }
//     });

//     return financialMetrics;
// }

// function generateTopPerformers(data: any[]) {
//     return data
//         .filter(company => company.risk_score >= 70)
//         .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
//         .slice(0, 10)
//         .map(company => ({
//             name: company.company_name,
//             industry: company.industry,
//             riskScore: company.risk_score,
//             riskGrade: company.risk_grade,
//             recommendedLimit: company.recommended_limit
//         }));
// }

// function generateHighRiskCompanies(data: any[]) {
//     return data
//         .filter(company => company.risk_grade === 'CM4' || company.risk_grade === 'CM5')
//         .sort((a, b) => (a.risk_score || 0) - (b.risk_score || 0))
//         .map(company => ({
//             name: company.company_name,
//             industry: company.industry,
//             riskScore: company.risk_score,
//             riskGrade: company.risk_grade,
//             riskFactors: extractRiskFactors(company)
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
//             description: `${highRiskCount} companies (${((highRiskCount / data.length) * 100).toFixed(1)}%) are in high-risk categories. Consider portfolio rebalancing.`
//         });
//     }

//     const avgRiskScore = data.reduce((sum, c) => sum + (c.risk_score || 0), 0) / data.length;
//     if (avgRiskScore < 50) {
//         recommendations.push({
//             type: 'performance',
//             priority: 'medium',
//             title: 'Portfolio Performance',
//             description: `Average risk score of ${avgRiskScore.toFixed(1)}% indicates room for improvement in portfolio quality.`
//         });
//     }

//     return recommendations;
// }

// function extractRiskFactors(company: any) {
//     const factors = [];

//     if (company.risk_score < 30) factors.push('Very low risk score');
//     if (company.extracted_data?.charges?.open_charges?.length > 0) factors.push('Outstanding charges');
//     if (company.extracted_data?.legal_cases?.length > 0) factors.push('Legal cases');

//     return factors;
// }

// async function generateReportFile(reportId: string, format: string, content: any) {
//     // In a real implementation, this would generate actual files
//     // For now, return a mock URL
//     const fileName = `${reportId}.${format}`;
//     const fileUrl = `/api/reports/download/${fileName}`;

//     // Store the report content for later retrieval
//     // This would typically be saved to cloud storage

//     return fileUrl;
// }