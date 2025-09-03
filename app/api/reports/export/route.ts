import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ExportRequest {
    format: 'csv' | 'excel' | 'pdf' | 'json';
    dataType: 'portfolio' | 'companies' | 'analytics' | 'compliance';
    fields: string[];
    filters: {
        industries: string[];
        riskGrades: string[];
        dateRange: {
            start: string;
            end: string;
        };
    };
    includeHeaders: boolean;
    includeMetadata: boolean;
    exportedAt: string;
}

export async function POST(request: NextRequest) {
    //     try {
    //         const supabase = createClient();

    //         // Verify authentication
    //         const { data: { user }, error: authError } = await supabase.auth.getUser();
    //         if (authError || !user) {
    //             return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    //         }

    //         const exportConfig: ExportRequest = await request.json();

    //         // Validate required fields
    //         if (!exportConfig.format || !exportConfig.dataType || exportConfig.fields.length === 0) {
    //             return NextResponse.json(
    //                 { error: 'Missing required fields: format, dataType, and fields' },
    //                 { status: 400 }
    //             );
    //         }

    //         // Fetch data based on configuration
    //         const data = await fetchExportData(exportConfig, user.id);

    //         // Generate export file
    //         const exportResult = await generateExportFile(exportConfig, data);

    //         return NextResponse.json({
    //             downloadUrl: exportResult.downloadUrl,
    //             filename: exportResult.filename,
    //             recordCount: data.length,
    //             exportedAt: new Date().toISOString()
    //         });

    //     } catch (error) {
    //         console.error('Error in data export:', error);
    //         return NextResponse.json(
    //             { error: 'Internal server error' },
    //             { status: 500 }
    //         );
    //     }
}

// async function fetchExportData(config: ExportRequest, userId: string) {
//     const supabase = createClient();

//     switch (config.dataType) {
//         case 'portfolio':
//             return await fetchPortfolioData(config, userId);
//         case 'companies':
//             return await fetchCompaniesData(config, userId);
//         case 'analytics':
//             return await fetchAnalyticsData(config, userId);
//         case 'compliance':
//             return await fetchComplianceData(config, userId);
//         default:
//             throw new Error(`Unsupported data type: ${config.dataType}`);
//     }
// }

// async function fetchPortfolioData(config: ExportRequest, userId: string) {
//     const supabase = createClient();

//     let query = supabase
//         .from('document_processing_requests')
//         .select('*')
//         .eq('user_id', userId)
//         .eq('status', 'completed');

//     // Apply filters
//     query = applyFilters(query, config.filters);

//     const { data, error } = await query;
//     if (error) throw new Error(`Failed to fetch portfolio data: ${error.message}`);

//     // Transform data based on selected fields
//     return transformPortfolioData(data || [], config.fields);
// }

// async function fetchCompaniesData(config: ExportRequest, userId: string) {
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

//     query = applyFilters(query, config.filters);

//     const { data, error } = await query;
//     if (error) throw new Error(`Failed to fetch companies data: ${error.message}`);

//     return transformCompaniesData(data || [], config.fields);
// }

// async function fetchAnalyticsData(config: ExportRequest, userId: string) {
//     const supabase = createClient();

//     let query = supabase
//         .from('document_processing_requests')
//         .select(`
//       request_id,
//       company_name,
//       industry,
//       risk_score,
//       risk_grade,
//       risk_analysis
//     `)
//         .eq('user_id', userId)
//         .eq('status', 'completed');

//     query = applyFilters(query, config.filters);

//     const { data, error } = await query;
//     if (error) throw new Error(`Failed to fetch analytics data: ${error.message}`);

//     return transformAnalyticsData(data || [], config.fields);
// }

// async function fetchComplianceData(config: ExportRequest, userId: string) {
//     const supabase = createClient();

//     let query = supabase
//         .from('document_processing_requests')
//         .select(`
//       request_id,
//       company_name,
//       industry,
//       extracted_data
//     `)
//         .eq('user_id', userId)
//         .eq('status', 'completed');

//     query = applyFilters(query, config.filters);

//     const { data, error } = await query;
//     if (error) throw new Error(`Failed to fetch compliance data: ${error.message}`);

//     return transformComplianceData(data || [], config.fields);
// }

// function applyFilters(query: any, filters: any) {
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

//     return query;
// }

// function transformPortfolioData(data: any[], fields: string[]) {
//     return data.map(item => {
//         const transformed: any = {};

//         fields.forEach(field => {
//             switch (field) {
//                 case 'total_companies':
//                     transformed.total_companies = data.length;
//                     break;
//                 case 'total_exposure':
//                     transformed.total_exposure = data.reduce((sum, company) => sum + (company.recommended_limit || 0), 0);
//                     break;
//                 case 'risk_distribution':
//                     transformed.risk_distribution = JSON.stringify(calculateRiskDistribution(data));
//                     break;
//                 case 'industry_breakdown':
//                     transformed.industry_breakdown = JSON.stringify(calculateIndustryBreakdown(data));
//                     break;
//                 case 'performance_metrics':
//                     transformed.performance_metrics = JSON.stringify(calculatePerformanceMetrics(data));
//                     break;
//             }
//         });

//         return transformed;
//     });
// }

// function transformCompaniesData(data: any[], fields: string[]) {
//     return data.map(item => {
//         const transformed: any = {};

//         fields.forEach(field => {
//             switch (field) {
//                 case 'company_name':
//                     transformed.company_name = item.company_name;
//                     break;
//                 case 'industry':
//                     transformed.industry = item.industry;
//                     break;
//                 case 'risk_score':
//                     transformed.risk_score = item.risk_score;
//                     break;
//                 case 'risk_grade':
//                     transformed.risk_grade = item.risk_grade;
//                     break;
//                 case 'recommended_limit':
//                     transformed.recommended_limit = item.recommended_limit;
//                     break;
//                 case 'financial_data':
//                     transformed.financial_data = JSON.stringify(item.extracted_data?.financial_data || {});
//                     break;
//                 case 'compliance_status':
//                     transformed.compliance_status = JSON.stringify({
//                         gst: item.extracted_data?.gst_records || {},
//                         epfo: item.extracted_data?.epfo_records || {}
//                     });
//                     break;
//                 case 'directors':
//                     transformed.directors = JSON.stringify(item.extracted_data?.directors || []);
//                     break;
//                 case 'charges':
//                     transformed.charges = JSON.stringify(item.extracted_data?.charges || {});
//                     break;
//             }
//         });

//         return transformed;
//     });
// }

// function transformAnalyticsData(data: any[], fields: string[]) {
//     return data.map(item => {
//         const transformed: any = {};

//         fields.forEach(field => {
//             switch (field) {
//                 case 'parameter_scores':
//                     transformed.parameter_scores = JSON.stringify(item.risk_analysis?.allScores || []);
//                     break;
//                 case 'benchmark_comparison':
//                     transformed.benchmark_comparison = JSON.stringify(calculateBenchmarkComparison(item));
//                     break;
//                 case 'trend_analysis':
//                     transformed.trend_analysis = JSON.stringify(calculateTrendAnalysis(item));
//                     break;
//                 case 'peer_analysis':
//                     transformed.peer_analysis = JSON.stringify(item.extracted_data?.peer_analysis || {});
//                     break;
//                 case 'model_performance':
//                     transformed.model_performance = JSON.stringify(calculateModelPerformance(item));
//                     break;
//             }
//         });

//         return transformed;
//     });
// }

// function transformComplianceData(data: any[], fields: string[]) {
//     return data.map(item => {
//         const transformed: any = {};

//         fields.forEach(field => {
//             switch (field) {
//                 case 'gst_records':
//                     transformed.gst_records = JSON.stringify(item.extracted_data?.gst_records || {});
//                     break;
//                 case 'epfo_records':
//                     transformed.epfo_records = JSON.stringify(item.extracted_data?.epfo_records || {});
//                     break;
//                 case 'filing_status':
//                     transformed.filing_status = JSON.stringify(calculateFilingStatus(item));
//                     break;
//                 case 'compliance_scores':
//                     transformed.compliance_scores = JSON.stringify(calculateComplianceScores(item));
//                     break;
//                 case 'audit_qualifications':
//                     transformed.audit_qualifications = JSON.stringify(item.extracted_data?.audit_qualifications || []);
//                     break;
//             }
//         });

//         return transformed;
//     });
// }

// async function generateExportFile(config: ExportRequest, data: any[]) {
//     const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
//     const filename = `${config.dataType}_export_${timestamp}.${config.format}`;

//     switch (config.format) {
//         case 'csv':
//             return generateCSV(data, filename, config);
//         case 'excel':
//             return generateExcel(data, filename, config);
//         case 'pdf':
//             return generatePDF(data, filename, config);
//         case 'json':
//             return generateJSON(data, filename, config);
//         default:
//             throw new Error(`Unsupported format: ${config.format}`);
//     }
// }

// function generateCSV(data: any[], filename: string, config: ExportRequest) {
//     let csvContent = '';

//     if (config.includeMetadata) {
//         csvContent += `# Export Metadata\n`;
//         csvContent += `# Generated: ${new Date().toISOString()}\n`;
//         csvContent += `# Data Type: ${config.dataType}\n`;
//         csvContent += `# Record Count: ${data.length}\n`;
//         csvContent += `# Filters: ${JSON.stringify(config.filters)}\n\n`;
//     }

//     if (data.length > 0) {
//         // Headers
//         if (config.includeHeaders) {
//             const headers = Object.keys(data[0]);
//             csvContent += headers.join(',') + '\n';
//         }

//         // Data rows
//         data.forEach(row => {
//             const values = Object.values(row).map(value => {
//                 if (typeof value === 'string' && value.includes(',')) {
//                     return `"${value.replace(/"/g, '""')}"`;
//                 }
//                 return value;
//             });
//             csvContent += values.join(',') + '\n';
//         });
//     }

//     // In a real implementation, save to cloud storage and return URL
//     const downloadUrl = `/api/reports/download/${filename}`;

//     return { downloadUrl, filename };
// }

// function generateExcel(data: any[], filename: string, config: ExportRequest) {
//     // In a real implementation, use a library like ExcelJS to generate Excel files
//     const downloadUrl = `/api/reports/download/${filename}`;
//     return { downloadUrl, filename };
// }

// function generatePDF(data: any[], filename: string, config: ExportRequest) {
//     // In a real implementation, use a library like PDFKit to generate PDF files
//     const downloadUrl = `/api/reports/download/${filename}`;
//     return { downloadUrl, filename };
// }

// function generateJSON(data: any[], filename: string, config: ExportRequest) {
//     const jsonData = {
//         metadata: config.includeMetadata ? {
//             generated: new Date().toISOString(),
//             dataType: config.dataType,
//             recordCount: data.length,
//             filters: config.filters
//         } : undefined,
//         data
//     };

//     // In a real implementation, save to cloud storage
//     const downloadUrl = `/api/reports/download/${filename}`;
//     return { downloadUrl, filename };
// }

// // Helper functions for calculations
// function calculateRiskDistribution(data: any[]) {
//     return data.reduce((acc, item) => {
//         const grade = item.risk_grade || 'Ungraded';
//         acc[grade] = (acc[grade] || 0) + 1;
//         return acc;
//     }, {});
// }

// function calculateIndustryBreakdown(data: any[]) {
//     return data.reduce((acc, item) => {
//         const industry = item.industry || 'Unknown';
//         acc[industry] = (acc[industry] || 0) + 1;
//         return acc;
//     }, {});
// }

// function calculatePerformanceMetrics(data: any[]) {
//     const totalCompanies = data.length;
//     const avgRiskScore = data.reduce((sum, item) => sum + (item.risk_score || 0), 0) / totalCompanies;
//     const totalExposure = data.reduce((sum, item) => sum + (item.recommended_limit || 0), 0);

//     return {
//         totalCompanies,
//         avgRiskScore,
//         totalExposure
//     };
// }

// function calculateBenchmarkComparison(item: any) {
//     // Implementation would compare against industry benchmarks
//     return {
//         companyScore: item.risk_score,
//         industryMedian: 65, // Mock data
//         industryBest: 85    // Mock data
//     };
// }

// function calculateTrendAnalysis(item: any) {
//     // Implementation would analyze historical trends
//     return {
//         currentScore: item.risk_score,
//         trend: 'stable' // Mock data
//     };
// }

// function calculateModelPerformance(item: any) {
//     // Implementation would calculate model performance metrics
//     return {
//         accuracy: 0.85, // Mock data
//         confidence: 0.92 // Mock data
//     };
// }

// function calculateFilingStatus(item: any) {
//     const gstRecords = item.extracted_data?.gst_records;
//     const epfoRecords = item.extracted_data?.epfo_records;

//     return {
//         gstFiling: gstRecords?.active_gstins?.length > 0 ? 'Regular' : 'Irregular',
//         epfoFiling: epfoRecords?.establishments?.length > 0 ? 'Regular' : 'Irregular'
//     };
// }

// function calculateComplianceScores(item: any) {
//     // Implementation would calculate compliance scores
//     return {
//         gstScore: 85, // Mock data
//         epfoScore: 78 // Mock data
//     };
// }