import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { PDFGeneratorService } from '@/lib/services/pdf-generator.service'

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ reportId: string }> }
) {
    try {
        const { reportId } = await params
        const searchParams = request.nextUrl.searchParams
        const format = searchParams.get('format') || 'pdf'
        const type = searchParams.get('type') || 'full' // 'full' or 'summary'

        // Validate format
        if (format !== 'pdf') {
            return NextResponse.json(
                { success: false, message: 'Only PDF format is currently supported' },
                { status: 400 }
            )
        }

        // Validate type
        if (!['full', 'summary'].includes(type)) {
            return NextResponse.json(
                { success: false, message: 'Invalid export type. Must be "full" or "summary"' },
                { status: 400 }
            )
        }

        const supabase = await createServerSupabaseClient()

        // Fetch the report data
        const { data: report, error: reportError } = await supabase
            .from('deep_research_reports')
            .select(`
        id,
        title,
        sections,
        risk_level,
        generated_at,
        report_type,
        findings_summary,
        document_processing_requests!inner(
          id,
          company_name,
          industry,
          location_combined
        )
      `)
            .eq('id', reportId)
            .single()

        if (reportError || !report) {
            console.error('Error fetching report:', reportError)
            return NextResponse.json(
                { success: false, message: 'Report not found' },
                { status: 404 }
            )
        }

        // Validate report data
        try {
            PDFGeneratorService.validateReportData(report)
        } catch (validationError) {
            console.error('Report validation error:', validationError)
            return NextResponse.json(
                {
                    success: false,
                    message: `Invalid report data: ${validationError instanceof Error ? validationError.message : 'Unknown validation error'}`
                },
                { status: 400 }
            )
        }

        // Prepare report data for PDF generation - pass the report as is
        const reportData = {
            ...report,
            company_info: {
                name: report.document_processing_requests?.company_name || 'Unknown Company',
                industry: report.document_processing_requests?.industry,
                location: report.document_processing_requests?.location_combined
            }
        }

        // Check if report has content
        if (!reportData.sections || Object.keys(reportData.sections).length === 0) {
            return NextResponse.json(
                { success: false, message: 'Report has no content to export' },
                { status: 400 }
            )
        }

        // Generate PDF
        let pdfBuffer: Buffer

        try {
            if (type === 'summary') {
                pdfBuffer = await PDFGeneratorService.generateSummaryPDF(reportData)
            } else {
                pdfBuffer = await PDFGeneratorService.generateReportPDF(reportData, {
                    includeTableOfContents: true,
                    includeDisclaimer: true
                })
            }

            // Validate PDF buffer
            if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer) || pdfBuffer.length === 0) {
                throw new Error('PDF generation returned invalid or empty buffer')
            }

        } catch (pdfError) {
            console.error('PDF generation error:', pdfError)
            return NextResponse.json(
                {
                    success: false,
                    message: `Failed to generate PDF: ${pdfError instanceof Error ? pdfError.message : 'Unknown PDF generation error'}`
                },
                { status: 500 }
            )
        }

        // Get PDF metadata for headers
        const metadata = PDFGeneratorService.getPDFMetadata(reportData, type as 'full' | 'summary')

        // Return PDF as response
        return new NextResponse(new Uint8Array(pdfBuffer), {
            status: 200,
            headers: {
                ...metadata.headers,
                'Content-Length': pdfBuffer.length.toString(),
            }
        })

    } catch (error) {
        console.error('Export API error:', error)
        return NextResponse.json(
            {
                success: false,
                message: `Export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
            },
            { status: 500 }
        )
    }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
    return new NextResponse(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    })
}