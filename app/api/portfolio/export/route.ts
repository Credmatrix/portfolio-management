import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { ProfessionalExcelGenerator } from '@/lib/utils/excel-styling';

interface PortfolioExportData {
    request_id: string;
    company_name: string;
    risk_grade: string;
    credit_rating: string;
    gst_compliance_status: string;
    epfo_compliance_status: string;
    cin: string;
    pan: string;
    approved_limit: number;
    ad_hoc_limit: number;
    payment_terms: string;
    security_requirements: string;
    limit_validity_date: string;
    insurance_cover: number;
    collection_feedback: string;
    ar_values: number;
    dpd_behavior: string;
    industry: string;
    sector: string;
    location_city: string;
    location_state: string;
    risk_score: number;
    recommended_limit: number;
    submitted_at: string;
    completed_at: string;
}

interface ExportField {
    key: keyof PortfolioExportData;
    label: string;
    category: 'basic' | 'risk' | 'credit' | 'compliance' | 'location' | 'dates';
}

// Available fields for export (excluding sensitive parameters)
const AVAILABLE_EXPORT_FIELDS: ExportField[] = [
    { key: 'request_id', label: 'Request ID', category: 'basic' },
    { key: 'company_name', label: 'Company Name', category: 'basic' },
    { key: 'cin', label: 'CIN', category: 'basic' },
    { key: 'pan', label: 'PAN', category: 'basic' },
    { key: 'industry', label: 'Industry', category: 'basic' },
    { key: 'sector', label: 'Sector', category: 'basic' },
    { key: 'location_city', label: 'City', category: 'location' },
    { key: 'location_state', label: 'State', category: 'location' },
    { key: 'risk_grade', label: 'Risk Grade', category: 'risk' },
    { key: 'credit_rating', label: 'Credit Rating', category: 'risk' },
    { key: 'risk_score', label: 'Risk Score', category: 'risk' },
    { key: 'recommended_limit', label: 'Recommended Limit (₹ Cr)', category: 'credit' },
    { key: 'approved_limit', label: 'Approved Limit (₹ Cr)', category: 'credit' },
    { key: 'ad_hoc_limit', label: 'Ad-hoc Limit (₹ Cr)', category: 'credit' },
    { key: 'payment_terms', label: 'Payment Terms', category: 'credit' },
    { key: 'security_requirements', label: 'Security Requirements', category: 'credit' },
    { key: 'limit_validity_date', label: 'Limit Validity Date', category: 'credit' },
    { key: 'insurance_cover', label: 'Insurance Cover (₹ Cr)', category: 'credit' },
    { key: 'collection_feedback', label: 'Collection Feedback', category: 'credit' },
    { key: 'ar_values', label: 'AR Values (₹ Cr)', category: 'credit' },
    { key: 'dpd_behavior', label: 'DPD Behavior', category: 'credit' },
    { key: 'gst_compliance_status', label: 'GST Compliance Status', category: 'compliance' },
    { key: 'epfo_compliance_status', label: 'EPFO Compliance Status', category: 'compliance' },
    { key: 'submitted_at', label: 'Submitted Date', category: 'dates' },
    { key: 'completed_at', label: 'Completed Date', category: 'dates' }
];

export async function GET() {
    // Return available fields for frontend
    return NextResponse.json({
        availableFields: AVAILABLE_EXPORT_FIELDS,
        categories: {
            basic: 'Basic Information',
            risk: 'Risk Assessment',
            credit: 'Credit Management',
            compliance: 'Compliance Status',
            location: 'Location Details',
            dates: 'Important Dates'
        }
    });
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient();

        // Verify authentication
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError || !user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const {
            format = 'xlsx',
            filters = {},
            selectedFields = [],
            theme = 'modern' // Accept theme from frontend
        } = await request.json();

        // Validate format
        if (!['xlsx', 'csv'].includes(format)) {
            return NextResponse.json(
                { error: 'Invalid format. Supported formats: xlsx, csv' },
                { status: 400 }
            );
        }

        // Validate selected fields
        if (!selectedFields || selectedFields.length === 0) {
            return NextResponse.json(
                { error: 'Please select at least one field to export' },
                { status: 400 }
            );
        }

        // Build the query with comprehensive data
        let query = supabase
            .from('document_processing_requests')
            .select(`
                request_id,
                company_name,
                risk_grade,
                credit_rating,
                gst_compliance_status,
                epfo_compliance_status,
                industry,
                sector,
                location_city,
                location_state,
                risk_score,
                recommended_limit,
                submitted_at,
                completed_at,
                risk_analysis,
                credit_management (
                    actual_credit_limit_approved,
                    ad_hoc_limit,
                    payment_terms,
                    security_requirements,
                    limit_validity_date,
                    insurance_cover,
                    collection_feedback,
                    ar_values,
                    dpd_behavior
                )
            `)
            .eq('user_id', user.id)
            .eq('status', 'completed')
            .order('completed_at', { ascending: false });

        // Apply filters (same as before)
        // ... [filter application code remains the same]

        const { data, error } = await query;

        if (error) {
            console.error('Database query error:', error);
            return NextResponse.json(
                { error: 'Failed to fetch portfolio data' },
                { status: 500 }
            );
        }

        if (!data || data.length === 0) {
            return NextResponse.json(
                { error: 'No data found matching the criteria' },
                { status: 404 }
            );
        }

        // Transform data for export - Create full data array
        const exportData = data.map(item => {
            // Safely parse risk_analysis JSON data
            let companyInfo;
            try {
                const riskAnalysis = typeof item.risk_analysis === 'string'
                    ? JSON.parse(item.risk_analysis)
                    : item.risk_analysis;
                companyInfo = riskAnalysis?.companyData?.company_info || {};
            } catch (error) {
                console.warn('Failed to parse risk_analysis for item:', item.request_id);
                companyInfo = {};
            }

            const creditMgmt = Array.isArray(item.credit_management)
                ? item.credit_management[0]
                : item.credit_management;

            return {
                request_id: item.request_id || '',
                company_name: item.company_name || '',
                risk_grade: item.risk_grade || '',
                credit_rating: item.credit_rating || '',
                gst_compliance_status: item.gst_compliance_status || '',
                epfo_compliance_status: item.epfo_compliance_status || '',
                cin: companyInfo.cin || '',
                pan: companyInfo.pan || '',
                approved_limit: creditMgmt?.actual_credit_limit_approved || 0,
                ad_hoc_limit: creditMgmt?.ad_hoc_limit || 0,
                payment_terms: creditMgmt?.payment_terms || '',
                security_requirements: creditMgmt?.security_requirements || '',
                limit_validity_date: creditMgmt?.limit_validity_date || '',
                insurance_cover: creditMgmt?.insurance_cover || 0,
                collection_feedback: creditMgmt?.collection_feedback || '',
                ar_values: creditMgmt?.ar_values || 0,
                dpd_behavior: creditMgmt?.dpd_behavior || '',
                industry: item.industry || '',
                sector: item.sector || '',
                location_city: item.location_city || '',
                location_state: item.location_state || '',
                risk_score: item.risk_score || 0,
                recommended_limit: item.recommended_limit || 0,
                submitted_at: item.submitted_at ? new Date(item.submitted_at).toLocaleDateString() : '',
                completed_at: item.completed_at ? new Date(item.completed_at).toLocaleDateString() : ''
            };
        });

        // Filter data based on selected fields for the main sheet
        const selectedFieldsData = exportData.map(row => {
            const filteredRow: any = {};
            selectedFields.forEach((fieldKey: string) => {
                filteredRow[fieldKey] = row[fieldKey as keyof typeof row];
            });
            return filteredRow;
        });

        // Get headers and labels for selected fields
        const AVAILABLE_EXPORT_FIELDS = [
            { key: 'request_id', label: 'Request ID' },
            { key: 'company_name', label: 'Company Name' },
            { key: 'cin', label: 'CIN' },
            { key: 'pan', label: 'PAN' },
            { key: 'industry', label: 'Industry' },
            { key: 'sector', label: 'Sector' },
            { key: 'location_city', label: 'City' },
            { key: 'location_state', label: 'State' },
            { key: 'risk_grade', label: 'Risk Grade' },
            { key: 'credit_rating', label: 'Credit Rating' },
            { key: 'risk_score', label: 'Risk Score' },
            { key: 'recommended_limit', label: 'Recommended Limit (₹ Cr)' },
            { key: 'approved_limit', label: 'Approved Limit (₹ Cr)' },
            { key: 'ad_hoc_limit', label: 'Ad-hoc Limit (₹ Cr)' },
            { key: 'payment_terms', label: 'Payment Terms' },
            { key: 'security_requirements', label: 'Security Requirements' },
            { key: 'limit_validity_date', label: 'Limit Validity Date' },
            { key: 'insurance_cover', label: 'Insurance Cover (₹ Cr)' },
            { key: 'collection_feedback', label: 'Collection Feedback' },
            { key: 'ar_values', label: 'AR Values (₹ Cr)' },
            { key: 'dpd_behavior', label: 'DPD Behavior' },
            { key: 'gst_compliance_status', label: 'GST Compliance Status' },
            { key: 'epfo_compliance_status', label: 'EPFO Compliance Status' },
            { key: 'submitted_at', label: 'Submitted Date' },
            { key: 'completed_at', label: 'Completed Date' }
        ];

        const selectedFieldsInfo = AVAILABLE_EXPORT_FIELDS.filter(field =>
            selectedFields.includes(field.key)
        );
        const headers = selectedFieldsInfo.map(field => field.label);
        const fieldKeys = selectedFieldsInfo.map(field => field.key);

        // Generate file based on format
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
        const filename = `credmatrix_portfolio_${timestamp}.${format}`;

        let fileBuffer: Buffer;
        let contentType: string;

        if (format === 'xlsx') {
            // Calculate analytics from the full data
            const analytics = {
                total_companies: exportData.length,
                total_exposure: exportData.reduce((sum, item) =>
                    sum + (parseFloat(String(item.recommended_limit)) || 0), 0
                ).toFixed(2),
                average_risk_score: (exportData.reduce((sum, item) =>
                    sum + (parseFloat(String(item.risk_score)) || 0), 0
                ) / exportData.length).toFixed(2),
                risk_distribution: exportData.reduce((acc, item) => {
                    const grade = item.risk_grade?.toLowerCase() || 'ungraded';
                    acc[grade] = (acc[grade] || 0) + 1;
                    return acc;
                }, {} as Record<string, number>),
                compliance_overview: {
                    gst_compliance: {
                        compliant: exportData.filter(item =>
                            item.gst_compliance_status.includes('Regular') || item.gst_compliance_status.includes('Generally Regular')
                        ).length,
                        non_compliant: exportData.filter(item =>
                            item.gst_compliance_status.includes('Irregular')
                        ).length
                    },
                    epfo_compliance: {
                        compliant: exportData.filter(item =>
                            item.epfo_compliance_status.includes('Regular') || item.gst_compliance_status.includes('Generally Regular')
                        ).length,
                        non_compliant: exportData.filter(item =>
                            item.epfo_compliance_status.includes('Irregular')
                        ).length
                    }
                }
            };

            // Create professional Excel generator with selected theme
            const excelGenerator = new ProfessionalExcelGenerator({
                companyName: 'CREDMATRIX',
                reportTitle: 'Portfolio Intelligence Report',
                generatedBy: user.email || 'System User',
                filters: Object.keys(filters).length > 0 ? filters : undefined,
                theme: theme // Use theme from frontend
            });

            // Create enhanced branded cover sheet
            excelGenerator.createEnhancedCoverSheet(exportData.length, analytics);

            // Create data visualization dashboard
            // IMPORTANT: Pass the full exportData array, not selectedFieldsData
            excelGenerator.createDataVisualizationSheet(exportData, 'Risk Analytics');

            // Create main data worksheet with selected fields
            excelGenerator.createStyledWorksheet(
                selectedFieldsData,
                headers,
                fieldKeys,
                'Portfolio Details'
            );

            // Create summary analytics sheet
            excelGenerator.createSummarySheet(analytics);

            fileBuffer = excelGenerator.generateBuffer();
            contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

        } else {
            // Generate CSV (remains the same)
            const csvContent = [
                headers.join(','),
                ...selectedFieldsData.map(row =>
                    fieldKeys.map(key => {
                        const value = row[key] || '';
                        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                            return `"${value.replace(/"/g, '""')}"`;
                        }
                        return value;
                    }).join(',')
                )
            ].join('\n');

            fileBuffer = Buffer.from(csvContent, 'utf-8');
            contentType = 'text/csv';
        }

        // Return file as response
        return new NextResponse(new Uint8Array(fileBuffer), {
            status: 200,
            headers: {
                'Content-Type': contentType,
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Content-Length': fileBuffer.length.toString(),
                'X-Export-Theme': theme,
                'X-Export-Records': exportData.length.toString()
            },
        });

    } catch (error) {
        console.error('Error in portfolio export:', error);
        return NextResponse.json(
            {
                error: 'Internal server error during export',
                details: error instanceof Error ? error.message : 'Unknown error'
            },
            { status: 500 }
        );
    }
}