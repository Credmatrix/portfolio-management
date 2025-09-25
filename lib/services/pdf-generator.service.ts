import React from 'react'
import { Document, Page, Text, View, StyleSheet, renderToBuffer, Font } from '@react-pdf/renderer'
import {
    CoverPage,
    TableOfContents,
    ReportSection,
    DisclaimerPage,
    PDFHeader,
    PDFFooter
} from '@/lib/pdf/pdf-components'

// Enhanced Section Processing
interface ProcessedSection {
    title: string
    content: string
    page: number
    category?: 'executive' | 'analysis' | 'findings' | 'risk' | 'compliance' | 'appendix'
}

// Helper function to categorize sections
function categorizeSection(title: string): ProcessedSection['category'] {
    const lowerTitle = title.toLowerCase()

    if (lowerTitle.includes('executive') || lowerTitle.includes('summary')) {
        return 'executive'
    }
    if (lowerTitle.includes('finding') || lowerTitle.includes('detail')) {
        return 'findings'
    }
    if (lowerTitle.includes('risk') || lowerTitle.includes('assessment')) {
        return 'risk'
    }
    if (lowerTitle.includes('compliance') || lowerTitle.includes('regulatory')) {
        return 'compliance'
    }
    if (lowerTitle.includes('analysis') || lowerTitle.includes('overview')) {
        return 'analysis'
    }
    return 'appendix'
}

// Enhanced content formatting for markdown
function formatSectionContent(content: any): string {
    if (!content) return 'Content not available.'

    // If content is already a string, return it
    if (typeof content === 'string') {
        return enhanceMarkdownContent(content)
    }

    // If content is an object, try to format it nicely
    if (typeof content === 'object') {
        // Check if it's JSON that should be formatted
        try {
            const formatted = JSON.stringify(content, null, 2)
            // Convert JSON to markdown table or structured format
            return convertJsonToMarkdown(content)
        } catch (e) {
            return 'Content format error.'
        }
    }

    return String(content)
}

// Enhance markdown content with better formatting
function enhanceMarkdownContent(content: string): string {
    // Ensure headers have proper spacing
    content = content.replace(/^(#{1,3})\s*/gm, '\n$1 ')

    // Ensure lists have proper formatting
    content = content.replace(/^\*\s+/gm, '• ')
    content = content.replace(/^-\s+/gm, '• ')

    // Add line breaks after paragraphs if missing
    content = content.replace(/\.\s*(?=[A-Z])/g, '.\n\n')

    // Format tables properly
    content = formatMarkdownTables(content)

    return content
}

// Format markdown tables
function formatMarkdownTables(content: string): string {
    const lines = content.split('\n')
    const formattedLines: string[] = []
    let inTable = false

    for (const line of lines) {
        if (line.includes('|')) {
            if (!inTable) {
                inTable = true
                // Add spacing before table
                if (formattedLines.length > 0 && formattedLines[formattedLines.length - 1].trim()) {
                    formattedLines.push('')
                }
            }
            formattedLines.push(line)
        } else {
            if (inTable) {
                inTable = false
                // Add spacing after table
                formattedLines.push('')
            }
            formattedLines.push(line)
        }
    }

    return formattedLines.join('\n')
}

// Convert JSON to markdown format
function convertJsonToMarkdown(obj: any, depth: number = 0): string {
    const indent = '  '.repeat(depth)
    let result: string[] = []

    if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
            if (typeof item === 'object') {
                result.push(`${indent}${index + 1}. **Item ${index + 1}:**`)
                result.push(convertJsonToMarkdown(item, depth + 1))
            } else {
                result.push(`${indent}• ${item}`)
            }
        })
    } else if (typeof obj === 'object' && obj !== null) {
        Object.entries(obj).forEach(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())

            if (typeof value === 'object' && value !== null) {
                result.push(`${indent}**${formattedKey}:**`)
                result.push(convertJsonToMarkdown(value, depth + 1))
            } else if (value !== null && value !== undefined) {
                result.push(`${indent}**${formattedKey}:** ${value}`)
            }
        })
    } else {
        result.push(`${indent}${obj}`)
    }

    return result.join('\n')
}

// Convert sections to processed format
function processSections(sections: any): ProcessedSection[] {
    if (!sections) return getDefaultSections()

    const processed: ProcessedSection[] = []

    if (typeof sections === 'object' && !Array.isArray(sections)) {
        Object.entries(sections).filter(([key, content]) => content !== "").forEach(([key, value]) => {
            const title = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            const content = formatSectionContent(value)
            const category = categorizeSection(title)

            processed.push({
                title,
                content,
                page: 0, // Will be calculated later
                category
            })
        })
    }

    // Sort sections by category priority
    const categoryOrder: ProcessedSection['category'][] = [
        'executive', 'analysis', 'findings', 'risk', 'compliance', 'appendix'
    ]

    processed.sort((a, b) => {
        const aIndex = categoryOrder.indexOf(a.category || 'appendix')
        const bIndex = categoryOrder.indexOf(b.category || 'appendix')
        return aIndex - bIndex
    })

    return processed.length > 0 ? processed : getDefaultSections()
}

// Default sections if none provided
function getDefaultSections(): ProcessedSection[] {
    return [
        {
            title: 'Executive Summary',
            content: '# Executive Summary\n\nThis report provides a comprehensive analysis of the subject entity based on available data and professional due diligence standards.\n\n## Key Findings\n\n• The analysis has been conducted using industry-standard methodologies\n• All available data sources have been thoroughly examined\n• Risk assessment follows established frameworks\n\n## Conclusion\n\nThe report findings are presented in the following sections for detailed review.',
            page: 0,
            category: 'executive'
        },
        {
            title: 'Methodology',
            content: '# Methodology\n\n## Research Approach\n\nOur analysis methodology encompasses:\n\n• **Data Collection:** Comprehensive gathering from multiple authoritative sources\n• **Verification Process:** Cross-referencing and validation of all findings\n• **Risk Assessment:** Systematic evaluation using established frameworks\n• **Quality Assurance:** Multi-level review process\n\n## Data Sources\n\nThe following categories of sources were utilized:\n\n| Source Type | Coverage | Reliability |\n|------------|----------|-------------|\n| Regulatory Databases | Complete | High |\n| Public Records | Extensive | High |\n| Media Archives | Comprehensive | Medium |\n| Industry Reports | Targeted | High |\n\n## Limitations\n\nAny limitations encountered during the analysis are documented in the relevant sections.',
            page: 0,
            category: 'analysis'
        }
    ]
}

interface PDFGenerationOptions {
    includeTableOfContents?: boolean
    includeDisclaimer?: boolean
    customTitle?: string
    includeExecutiveSummaryOnly?: boolean
}

export class PDFGeneratorService {
    /**
     * Generate a professional PDF report from research data
     */
    static async generateReportPDF(
        reportData: any,
        options: PDFGenerationOptions = {}
    ): Promise<Buffer> {
        const {
            includeTableOfContents = true,
            includeDisclaimer = true,
            customTitle,
            includeExecutiveSummaryOnly = false
        } = options

        try {
            // Process sections
            let sections = processSections(reportData.sections)

            // Filter for executive summary if requested
            if (includeExecutiveSummaryOnly) {
                sections = sections.filter(s =>
                    s.category === 'executive' ||
                    s.category === 'risk'
                )
            }

            // Calculate page numbers
            let currentPage = 1 // Cover page

            if (includeTableOfContents) {
                currentPage++ // TOC page
            }

            // Assign page numbers to sections
            sections = sections.map(section => ({
                ...section,
                page: ++currentPage
            }))

            // Add disclaimer page number if included
            const disclaimerPageNum = includeDisclaimer ? ++currentPage : 0
            const totalPages = currentPage

            // Build TOC data
            const tocSections = [
                ...sections.map(s => ({
                    title: s.title,
                    page: s.page
                })),
                ...(includeDisclaimer ? [{
                    title: 'Disclaimer',
                    page: disclaimerPageNum
                }] : [])
            ]

            // Build document
            const documentChildren: React.ReactElement[] = []

            // Cover Page
            documentChildren.push(
                React.createElement(CoverPage, {
                    key: 'cover',
                    title: customTitle || reportData.title || 'Due Diligence Report',
                    companyName: reportData.company_info?.name,
                    riskLevel: reportData.risk_level,
                    generatedAt: reportData.generated_at || new Date().toISOString(),
                    reportType: reportData.report_type || 'Comprehensive Due Diligence'
                })
            )

            // Table of Contents
            if (includeTableOfContents && tocSections.length > 0) {
                documentChildren.push(
                    React.createElement(TableOfContents, {
                        key: 'toc',
                        sections: tocSections
                    })
                )
            }

            // Report Sections
            sections.forEach((section, index) => {
                documentChildren.push(
                    React.createElement(ReportSection, {
                        key: `section-${index}`,
                        title: section.title,
                        content: section.content,
                        pageNumber: section.page,
                        totalPages
                    })
                )
            })

            // Disclaimer
            if (includeDisclaimer) {
                documentChildren.push(
                    React.createElement(DisclaimerPage, {
                        key: 'disclaimer',
                        pageNumber: disclaimerPageNum,
                        totalPages
                    })
                )
            }

            // Create PDF Document
            const PDFDocument = React.createElement(
                Document,
                {
                    title: customTitle || reportData.title || 'Due Diligence Report',
                    author: 'CredMatrix',
                    subject: 'Due Diligence Report',
                    keywords: 'credit, risk, due diligence, compliance, analysis',
                    creator: 'CredMatrix Platform',
                    producer: 'CredMatrix PDF Generator v2.0'
                },
                ...documentChildren
            )

            console.log('Generating enhanced PDF...')
            console.log(`Total sections: ${sections.length}`)
            console.log(`Total pages: ${totalPages}`)

            // Render to buffer
            const pdfBuffer = await renderToBuffer(PDFDocument)

            // Validate buffer
            if (!pdfBuffer || !Buffer.isBuffer(pdfBuffer)) {
                throw new Error('PDF generation failed - invalid buffer')
            }

            if (pdfBuffer.length === 0) {
                throw new Error('PDF generation produced empty buffer')
            }

            console.log(`PDF generated successfully: ${pdfBuffer.length} bytes`)
            return pdfBuffer

        } catch (error) {
            console.error('PDF generation error:', error)

            if (error instanceof Error) {
                throw new Error(`PDF generation failed: ${error.message}`)
            }

            throw new Error('Unknown PDF generation error')
        }
    }

    /**
     * Generate an executive summary PDF
     */
    static async generateSummaryPDF(reportData: any): Promise<Buffer> {
        return this.generateReportPDF(reportData, {
            includeTableOfContents: false,
            includeDisclaimer: true,
            customTitle: `Executive Summary - ${reportData.title || 'Report'}`,
            includeExecutiveSummaryOnly: true
        })
    }

    /**
     * Validate report data
     */
    static validateReportData(reportData: any): boolean {
        if (!reportData || typeof reportData !== 'object') {
            throw new Error('Invalid report data: must be an object')
        }

        // More flexible validation
        if (!reportData.id && !reportData.title) {
            throw new Error('Report data must have either id or title')
        }

        return true
    }

    /**
     * Get PDF metadata for response headers
     */
    static getPDFMetadata(reportData: any, format: 'full' | 'summary' = 'full') {
        const timestamp = new Date().toISOString().split('T')[0]
        const companyName = reportData.company_info?.name
            ? reportData.company_info.name
                .replace(/[^a-zA-Z0-9]/g, '-')
                .toLowerCase()
                .substring(0, 50) // Limit length
            : 'company'

        const reportType = format === 'summary' ? 'executive-summary' : 'due-diligence-report'
        const filename = `${reportType}-${companyName}-${timestamp}.pdf`

        return {
            filename,
            contentType: 'application/pdf',
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': `attachment; filename="${filename}"`,
                'Cache-Control': 'private, max-age=3600',
                'X-Content-Type-Options': 'nosniff',
                'X-Frame-Options': 'DENY'
            }
        }
    }

    /**
     * Generate PDF with custom sections
     */
    static async generateCustomPDF(
        title: string,
        sections: Array<{ title: string; content: string }>,
        metadata?: {
            companyName?: string
            riskLevel?: string
            reportType?: string
        }
    ): Promise<Buffer> {
        const reportData = {
            title,
            sections: sections.reduce((acc, section) => {
                acc[section.title] = section.content
                return acc
            }, {} as Record<string, string>),
            company_info: metadata?.companyName ? { name: metadata.companyName } : undefined,
            risk_level: metadata?.riskLevel,
            report_type: metadata?.reportType || 'Custom Report',
            generated_at: new Date().toISOString()
        }

        return this.generateReportPDF(reportData)
    }
}