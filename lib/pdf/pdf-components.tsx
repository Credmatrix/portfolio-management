import React from 'react'
import { Document, Page, Text, View, StyleSheet, Image, Link, Font } from '@react-pdf/renderer'
// Import markdown parsing utilities
import { unified } from 'unified'
import remarkParse from 'remark-parse'
import remarkGfm from 'remark-gfm'
import { visit } from 'unist-util-visit'
// Register custom fonts for professional typography
// Font.register({
//     family: 'Inter',
//     fonts: [
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjp-Ek-_EeA.woff', fontWeight: 400 },
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGKYAZ9hjp-Ek-_EeA.woff', fontWeight: 600 },
//         { src: 'https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuFuYAZ9hjp-Ek-_EeA.woff', fontWeight: 700 }
//     ]
// })

// Professional Color Palette
const colors = {
    primary: '#1e40af',      // Deep blue
    secondary: '#3b82f6',    // Bright blue
    accent: '#60a5fa',       // Light blue
    success: '#10b981',      // Green
    warning: '#f59e0b',      // Amber
    danger: '#ef4444',       // Red
    dark: '#0f172a',         // Near black
    gray: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a'
    }
}

// Enhanced Styles with Professional Design
const styles = StyleSheet.create({
    // Page Styles
    page: {
        // fontFamily: 'Inter',
        fontSize: 10,
        lineHeight: 1,
        color: colors.gray[800],
        backgroundColor: 'white',
    },
    pageWithPadding: {
        padding: 40,
    },

    // Cover Page Styles
    coverPage: {
        flexDirection: 'column',
        justifyContent: 'space-between',
        height: '100%',
        backgroundImage: `linear-gradient(135deg, ${colors.primary} 0%, ${colors.secondary} 100%)`,
        color: 'white',
        padding: 0,
    },
    coverHeader: {
        padding: 30,
        paddingTop: 40,
    },
    coverLogoContainer: {
        marginBottom: 20,
        alignItems: 'center',
    },
    coverLogo: {
        fontSize: 36,
        fontWeight: 700,
        letterSpacing: 2,
        color: colors.primary,
        textAlign: 'center',
        marginBottom: 4,
    },
    coverLogoTagline: {
        fontSize: 12,
        color: colors.accent,
        marginTop: 2,
        fontWeight: 400,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    coverContent: {
        flex: 1,
        padding: 40,
        justifyContent: 'center',
        alignItems: 'center',
    },
    coverTitleSection: {
        alignItems: 'center',
        marginBottom: 40,
    },
    coverTitle: {
        fontSize: 42,
        fontWeight: 700,
        marginBottom: 12,
        letterSpacing: 1.5,
        textTransform: 'uppercase',
        textAlign: 'center',
        color: 'white',
    },
    coverSubtitle: {
        fontSize: 20,
        fontWeight: 400,
        marginBottom: 0,
        color: colors.accent,
        textAlign: 'center',
        letterSpacing: 0.5,
    },
    coverMetadataCard: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 24,
        width: '100%',
        maxWidth: 450,
        marginBottom: 30,
        shadowColor: colors.dark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
    },
    coverMetadataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
        paddingBottom: 12,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
    },
    coverMetadataRowLast: {
        borderBottomWidth: 0,
        marginBottom: 0,
        paddingBottom: 0,
    },
    coverMetadataLabel: {
        fontSize: 11,
        fontWeight: 500,
        color: colors.gray[600],
        textTransform: 'uppercase',
        letterSpacing: 0.5,
    },
    coverMetadataValue: {
        fontSize: 12,
        fontWeight: 600,
        color: colors.dark,
    },
    coverDisclaimer: {
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: 8,
        padding: 16,
        width: '100%',
        maxWidth: 450,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    coverDisclaimerText: {
        fontSize: 10,
        color: colors.accent,
        textAlign: 'center',
        lineHeight: 1,
        fontStyle: 'italic',
    },
    coverFooter: {
        backgroundColor: colors.dark,
        padding: 20,
        alignItems: 'center',
    },
    coverFooterText: {
        fontSize: 10,
        color: 'white',
        letterSpacing: 0.5,
    },

    // Risk Badge Styles
    riskBadge: {
        paddingVertical: 4,
        paddingHorizontal: 12,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    riskBadgeText: {
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: 'white',
    },
    highRisk: {
        backgroundColor: colors.danger,
        color: 'white',
    },
    mediumRisk: {
        backgroundColor: colors.warning,
        color: 'white',
    },
    lowRisk: {
        backgroundColor: colors.success,
        color: 'white',
    },

    // Header & Footer
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 30,
        paddingBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    headerTitle: {
        fontSize: 10,
        fontWeight: 600,
        color: colors.primary,
    },
    headerPageNumber: {
        fontSize: 9,
        color: colors.gray[500],
    },
    footer: {
        position: 'absolute',
        bottom: 30,
        left: 40,
        right: 40,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: colors.gray[200],
        fontSize: 8,
        color: colors.gray[500],
    },

    // Content Styles
    content: {
        flex: 1,
        marginBottom: 70,
    },

    // Typography
    title: {
        fontSize: 28,
        fontWeight: 700,
        color: colors.dark,
        marginBottom: 25,
        letterSpacing: -0.5,
    },
    h1: {
        fontSize: 20,
        fontWeight: 700,
        color: colors.dark,
        marginTop: 24,
        marginBottom: 12,
        borderBottomWidth: 2,
        borderBottomColor: colors.gray[200],
        paddingBottom: 8,
    },
    h2: {
        fontSize: 16,
        fontWeight: 600,
        color: colors.dark,
        marginTop: 20,
        marginBottom: 10,
    },
    h3: {
        fontSize: 14,
        fontWeight: 600,
        color: colors.gray[700],
        marginTop: 16,
        marginBottom: 8,
    },
    paragraph: {
        marginBottom: 10,
        textAlign: 'justify',
        lineHeight: 1.1,
        color: colors.gray[700],
    },

    // Text Formatting
    bold: {
        fontWeight: 700,
        color: colors.dark,
    },
    italic: {
        fontStyle: 'italic',
    },
    underline: {
        textDecoration: 'underline',
    },
    code: {
        fontFamily: 'Courier',
        backgroundColor: colors.gray[100],
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 3,
        fontSize: 9,
        color: colors.gray[800],
    },
    codeBlock: {
        backgroundColor: colors.gray[900],
        color: colors.gray[100],
        padding: 12,
        borderRadius: 6,
        marginVertical: 10,
        fontFamily: 'Courier',
        fontSize: 9,
        lineHeight: 1.2,
    },

    // Lists
    bulletPoint: {
        flexDirection: 'row',
        marginBottom: 6,
        marginLeft: 20,
    },
    bulletSymbol: {
        width: 15,
        fontSize: 10,
        color: colors.primary,
    },
    bulletText: {
        flex: 1,
        lineHeight: 1.2,
    },
    orderedList: {
        marginLeft: 20,
    },
    orderedItem: {
        flexDirection: 'row',
        marginBottom: 6,
    },
    orderedNumber: {
        width: 20,
        fontSize: 10,
        fontWeight: 600,
        color: colors.primary,
    },

    // Tables
    table: {
        marginVertical: 15,
        borderWidth: 1,
        borderColor: colors.gray[300],
        borderRadius: 6,
        overflow: 'hidden',
    },
    tableRow: {
        flexDirection: 'row',
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[200],
    },
    tableRowLast: {
        borderBottomWidth: 0,
    },
    tableHeader: {
        backgroundColor: colors.gray[100],
        flexDirection: 'row',
        borderBottomWidth: 2,
        borderBottomColor: colors.primary,
    },
    tableCell: {
        flex: 1,
        padding: 10,
        fontSize: 9,
        borderRightWidth: 1,
        borderRightColor: colors.gray[200],
    },
    tableCellLast: {
        borderRightWidth: 0,
    },
    tableHeaderCell: {
        fontWeight: 700,
        color: colors.dark,
        backgroundColor: colors.gray[100],
    },

    // Table of Contents
    tocPage: {
        backgroundColor: 'white',
    },
    tocTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: colors.primary,
        marginBottom: 20,
        textAlign: 'center',
    },
    tocContainer: {
        paddingHorizontal: 20,
    },
    tocSection: {
        marginBottom: 15,
    },
    tocSectionTitle: {
        fontSize: 10,
        fontWeight: 700,
        color: colors.dark,
        marginBottom: 8,
        paddingBottom: 4,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[300],
    },
    tocItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        paddingLeft: 8,
    },
    tocItemText: {
        flex: 1,
        fontSize: 9,
        color: colors.gray[700],
        paddingRight: 8,
    },
    tocItemPage: {
        fontSize: 9,
        fontWeight: 600,
        color: colors.primary,
        width: 25,
        textAlign: 'right',
    },
    tocDots: {
        flex: 1,
        borderBottomWidth: 1,
        borderBottomColor: colors.gray[300],
        borderStyle: 'dotted',
        marginBottom: 3,
        marginHorizontal: 5,
    },

    // Cards and Callouts
    infoCard: {
        backgroundColor: colors.gray[50],
        borderLeftWidth: 4,
        borderLeftColor: colors.primary,
        padding: 12,
        marginVertical: 10,
        borderRadius: 4,
    },
    warningCard: {
        backgroundColor: '#fef3c7',
        borderLeftWidth: 4,
        borderLeftColor: colors.warning,
        padding: 12,
        marginVertical: 10,
        borderRadius: 4,
    },
    dangerCard: {
        backgroundColor: '#fee2e2',
        borderLeftWidth: 4,
        borderLeftColor: colors.danger,
        padding: 12,
        marginVertical: 10,
        borderRadius: 4,
    },
    successCard: {
        backgroundColor: '#d1fae5',
        borderLeftWidth: 4,
        borderLeftColor: colors.success,
        padding: 12,
        marginVertical: 10,
        borderRadius: 4,
    },

    // Disclaimer Page
    disclaimerContainer: {
        flex: 1,
        padding: 40,
    },
    disclaimerTitle: {
        fontSize: 24,
        fontWeight: 700,
        color: colors.danger,
        marginBottom: 20,
        textAlign: 'center',
    },
    disclaimerBox: {
        backgroundColor: colors.gray[50],
        borderWidth: 2,
        borderColor: colors.danger,
        borderRadius: 8,
        padding: 20,
        marginBottom: 20,
    },
    disclaimerText: {
        fontSize: 10,
        lineHeight: 1,
        color: colors.gray[700],
        marginBottom: 10,
    },

    // Links
    link: {
        color: '#2563eb',
        textDecoration: 'underline'
    },

    // Horizontal rule
    horizontalRule: {
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
        marginVertical: 12,
        width: '100%'
    }
})

// Enhanced Markdown Parser

// Markdown AST to PDF components converter
const parseMarkdown = (text: string): React.ReactNode[] => {
    if (!text || typeof text !== 'string') {
        return [<Text key="empty" style={styles.paragraph}>No content available.</Text>]
    }

    try {
        // Parse markdown using the same library as ResearchReportViewer
        const processor = unified()
            .use(remarkParse)
            .use(remarkGfm)

        const ast = processor.parse(text)
        const elements: React.ReactNode[] = []
        let elementKey = 0

        // Convert AST nodes to PDF components
        visit(ast, (node: any) => {
            switch (node.type) {
                case 'heading':
                    const headingText = extractTextFromNode(node)
                    const headingStyle = node.depth === 1 ? styles.h1 :
                        node.depth === 2 ? styles.h2 : styles.h3
                    elements.push(
                        <Text key={`heading-${elementKey++}`} style={headingStyle}>
                            {headingText}
                        </Text>
                    )
                    break

                case 'paragraph':
                    const paragraphContent = renderInlineContent(node, elementKey++)
                    if (paragraphContent) {
                        elements.push(
                            <Text key={`para-${elementKey++}`} style={styles.paragraph}>
                                {paragraphContent}
                            </Text>
                        )
                    }
                    break

                case 'list':
                    node.children?.forEach((listItem: any, index: number) => {
                        const content = renderInlineContent(listItem, elementKey++)
                        if (node.ordered) {
                            elements.push(
                                <View key={`ordered-${elementKey++}`} style={styles.orderedItem}>
                                    <Text style={styles.orderedNumber}>{index + 1}.</Text>
                                    <Text style={styles.bulletText}>{content}</Text>
                                </View>
                            )
                        } else {
                            elements.push(
                                <View key={`bullet-${elementKey++}`} style={styles.bulletPoint}>
                                    <Text style={styles.bulletSymbol}>•</Text>
                                    <Text style={styles.bulletText}>{content}</Text>
                                </View>
                            )
                        }
                    })
                    break

                case 'table':
                    const tableData = extractTableData(node)
                    if (tableData.length > 0) {
                        elements.push(renderTable(tableData, elementKey++))
                    }
                    break

                case 'code':
                    elements.push(
                        <View key={`code-${elementKey++}`} style={styles.codeBlock}>
                            <Text style={styles.code}>{node.value}</Text>
                        </View>
                    )
                    break

                case 'blockquote':
                    const quoteContent = extractTextFromNode(node)
                    const isWarning = quoteContent.toLowerCase().includes('warning')
                    const isInfo = quoteContent.toLowerCase().includes('info')

                    elements.push(
                        <View key={`quote-${elementKey++}`} style={
                            isWarning ? styles.warningCard :
                                isInfo ? styles.infoCard : styles.infoCard
                        }>
                            <Text style={styles.bold}>
                                {isWarning ? '⚠️ Warning' : isInfo ? 'ℹ️ Information' : 'Note'}
                            </Text>
                            <Text style={styles.paragraph}>{quoteContent}</Text>
                        </View>
                    )
                    break

                case 'thematicBreak':
                    elements.push(
                        <View key={`hr-${elementKey++}`} style={styles.horizontalRule} />
                    )
                    break
            }
        })

        return elements.length > 0 ? elements : [
            <Text key="fallback" style={styles.paragraph}>Content not available.</Text>
        ]
    } catch (error) {
        console.error('Error parsing markdown:', error)
        return [
            <Text key="error" style={styles.paragraph}>
                Error parsing content. Please check the markdown format.
            </Text>
        ]
    }
}

// Extract plain text from markdown AST node
const extractTextFromNode = (node: any): string => {
    if (node.type === 'text') {
        return node.value || ''
    }

    if (node.children) {
        return node.children.map(extractTextFromNode).join('')
    }

    return node.value || ''
}

// Render inline content with formatting
const renderInlineContent = (node: any, key: number): React.ReactNode => {
    if (!node.children) {
        return extractTextFromNode(node)
    }

    const elements: React.ReactNode[] = []
    let elementKey = 0

    node.children.forEach((child: any) => {
        switch (child.type) {
            case 'text':
                if (child.value) {
                    elements.push(child.value)
                }
                break

            case 'strong':
                elements.push(
                    <Text key={`strong-${elementKey++}`} style={styles.bold}>
                        {extractTextFromNode(child)}
                    </Text>
                )
                break

            case 'emphasis':
                elements.push(
                    <Text key={`em-${elementKey++}`} style={styles.italic}>
                        {extractTextFromNode(child)}
                    </Text>
                )
                break

            case 'inlineCode':
                elements.push(
                    <Text key={`code-${elementKey++}`} style={styles.code}>
                        {child.value}
                    </Text>
                )
                break

            case 'link':
                elements.push(
                    <Text key={`link-${elementKey++}`} style={styles.link}>
                        {extractTextFromNode(child)} ({child.url})
                    </Text>
                )
                break

            default:
                const text = extractTextFromNode(child)
                if (text) {
                    elements.push(text)
                }
        }
    })

    return elements.length === 1 ? elements[0] : elements
}

// Extract table data from markdown AST
const extractTableData = (tableNode: any): string[][] => {
    if (!tableNode.children) return []

    const rows: string[][] = []

    tableNode.children.forEach((row: any) => {
        if (row.type === 'tableRow' && row.children) {
            const cells = row.children.map((cell: any) => extractTextFromNode(cell))
            rows.push(cells)
        }
    })

    return rows
}

// Render markdown table (keeping the existing implementation)
const renderTable = (data: string[][], key: number): React.ReactNode => {
    if (data.length === 0) return null

    const headers = data[0]
    const rows = data.slice(1)

    return (
        <View key={`table-${key}`} style={styles.table}>
            {/* Header */}
            <View style={styles.tableHeader}>
                {headers.map((header, i) => (
                    <View key={`header-${i}`} style={[
                        styles.tableCell,
                        styles.tableHeaderCell,
                        ...(i === headers.length - 1 ? [styles.tableCellLast] : [])
                    ]}>
                        <Text style={styles.bold}>{header}</Text>
                    </View>
                ))}
            </View>

            {/* Rows */}
            {rows.map((row, rowIndex) => (
                <View key={`row-${rowIndex}`} style={[
                    styles.tableRow,
                    ...(rowIndex === rows.length - 1 ? [styles.tableRowLast] : [])
                ]}>
                    {row.map((cell, cellIndex) => (
                        <View key={`cell-${cellIndex}`} style={[
                            styles.tableCell,
                            ...(cellIndex === row.length - 1 ? [styles.tableCellLast] : [])
                        ]}>
                            <Text>{cell}</Text>
                        </View>
                    ))}
                </View>
            ))}
        </View>
    )
}

// Components
interface CoverPageProps {
    title: string
    companyName?: string
    riskLevel?: string
    generatedAt: string
    reportType: string
}

export const CoverPage: React.FC<CoverPageProps> = ({
    title,
    companyName,
    riskLevel,
    generatedAt,
    reportType
}) => {
    const getRiskStyle = (risk?: string) => {
        switch (risk?.toUpperCase()) {
            case 'HIGH':
                return [styles.riskBadge, styles.highRisk]
            case 'MEDIUM':
                return [styles.riskBadge, styles.mediumRisk]
            case 'LOW':
                return [styles.riskBadge, styles.lowRisk]
            default:
                return [styles.riskBadge, styles.lowRisk]
        }
    }

    return (
        <Page size="A4" style={[styles.page, styles.coverPage]}>
            {/* Header with Enhanced Logo */}
            <View style={styles.coverHeader}>
                <View style={styles.coverLogoContainer}>
                    <Text style={styles.coverLogo}>CREDMATRIX</Text>
                </View>
            </View>

            {/* Main Content with Better Spacing */}
            <View style={styles.coverContent}>
                <View style={styles.coverTitleSection}>
                    <Text style={styles.coverTitle}>Due Diligence Report</Text>
                    <Text style={styles.coverSubtitle}>{companyName || 'Company Analysis'}</Text>
                </View>

                {/* Enhanced Metadata Card */}
                <View style={styles.coverMetadataCard}>
                    <View style={styles.coverMetadataRow}>
                        <Text style={styles.coverMetadataLabel}>Report Type</Text>
                        <Text style={styles.coverMetadataValue}>
                            {reportType?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Due Diligence'}
                        </Text>
                    </View>

                    <View style={styles.coverMetadataRow}>
                        <Text style={styles.coverMetadataLabel}>Risk Assessment</Text>
                        <View style={getRiskStyle(riskLevel)}>
                            <Text style={styles.riskBadgeText}>{(riskLevel || 'PENDING').toUpperCase()}</Text>
                        </View>
                    </View>

                    <View style={[styles.coverMetadataRow, styles.coverMetadataRowLast]}>
                        <Text style={styles.coverMetadataLabel}>Generated On</Text>
                        <Text style={styles.coverMetadataValue}>
                            {new Date(generatedAt || Date.now()).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                            })}
                        </Text>
                    </View>
                </View>

                {/* Professional Disclaimer */}
                <View style={styles.coverDisclaimer}>
                    <Text style={styles.coverDisclaimerText}>
                        This report contains confidential and proprietary information.
                        Distribution is restricted to authorized personnel only.
                    </Text>
                </View>
            </View>

            {/* Enhanced Footer */}
            <View style={styles.coverFooter}>
                <Text style={styles.coverFooterText}>
                    Confidential & Proprietary | © 2025 CredMatrix
                </Text>
            </View>
        </Page>
    )
}

interface TableOfContentsProps {
    sections: Array<{ title: string; page: number }>
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({ sections }) => {
    // Group sections by category
    const mainSections = sections.filter(s =>
        !['Disclaimer', 'Appendix'].includes(s.title)
    )
    const appendixSections = sections.filter(s =>
        ['Disclaimer', 'Appendix'].includes(s.title)
    )

    return (
        <Page size="A4" style={[styles.page, styles.pageWithPadding, styles.tocPage]}>
            <Text style={styles.tocTitle}>Table of Contents</Text>

            <View style={styles.tocContainer}>
                {/* Main Sections */}
                <View style={styles.tocSection}>
                    <Text style={styles.tocSectionTitle}>Main Report</Text>
                    {mainSections.map((section, index) => (
                        <View key={index} style={styles.tocItem}>
                            <Text style={styles.tocItemText}>{section.title}</Text>
                            <View style={styles.tocDots} />
                            <Text style={styles.tocItemPage}>{section.page}</Text>
                        </View>
                    ))}
                </View>

                {/* Appendix Sections */}
                {appendixSections.length > 0 && (
                    <View style={styles.tocSection}>
                        <Text style={styles.tocSectionTitle}>Additional Information</Text>
                        {appendixSections.map((section, index) => (
                            <View key={index} style={styles.tocItem}>
                                <Text style={styles.tocItemText}>{section.title}</Text>
                                <View style={styles.tocDots} />
                                <Text style={styles.tocItemPage}>{section.page}</Text>
                            </View>
                        ))}
                    </View>
                )}
            </View>
        </Page>
    )
}

interface PDFHeaderProps {
    title: string
    pageNumber: number
    totalPages: number
}

export const PDFHeader: React.FC<PDFHeaderProps> = ({ title, pageNumber, totalPages }) => (
    <View style={styles.header}>
        <Text style={styles.headerTitle}>CredMatrix Due Diligence Report</Text>
        <Text style={styles.headerPageNumber}>
            Page {pageNumber} of {totalPages}
        </Text>
    </View>
)

interface PDFFooterProps {
    generatedAt: string
    pageNumber: number
}

export const PDFFooter: React.FC<PDFFooterProps> = ({ generatedAt }) => (
    <View style={styles.footer}>
        <Text>Generated: {new Date(generatedAt).toLocaleDateString()}</Text>
        <Text>Confidential & Proprietary</Text>
        <Text>© 2025 CredMatrix</Text>
    </View>
)

interface ReportSectionProps {
    title: string
    content: string
    pageNumber: number
    totalPages: number
}

export const ReportSection: React.FC<ReportSectionProps> = ({
    title,
    content,
    pageNumber,
    totalPages
}) => {
    return (
        <Page size="A4" style={[styles.page, styles.pageWithPadding]}>
            <PDFHeader title={title} pageNumber={pageNumber} totalPages={totalPages} />

            <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                {parseMarkdown(content)}
            </View>

            <PDFFooter generatedAt={new Date().toISOString()} pageNumber={pageNumber} />
        </Page>
    )
}

interface DisclaimerPageProps {
    pageNumber: number
    totalPages: number
}

export const DisclaimerPage: React.FC<DisclaimerPageProps> = ({ pageNumber, totalPages }) => (
    <Page size="A4" style={[styles.page, styles.pageWithPadding]}>
        <PDFHeader title="Legal Disclaimer" pageNumber={pageNumber} totalPages={totalPages} />

        <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>⚠️ IMPORTANT DISCLAIMER</Text>

            <View style={styles.disclaimerBox}>
                <Text style={[styles.disclaimerText, styles.bold]}>Legal Notice & Risk Disclosure</Text>

                <Text style={styles.disclaimerText}>
                    This due diligence report has been prepared by CredMatrix for informational purposes only.
                    The information contained herein is based on data available at the time of preparation and
                    should not be considered as investment advice, credit recommendation, or guarantee of accuracy.
                </Text>

                <Text style={[styles.disclaimerText, styles.bold, { marginTop: 15 }]}>
                    Key Limitations:
                </Text>

                <View style={styles.bulletPoint}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                        Information accuracy depends on source data quality and availability
                    </Text>
                </View>

                <View style={styles.bulletPoint}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                        Risk assessments are based on available financial and compliance data
                    </Text>
                </View>

                <View style={styles.bulletPoint}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                        Market conditions and company circumstances may change rapidly
                    </Text>
                </View>

                <View style={styles.bulletPoint}>
                    <Text style={styles.bulletSymbol}>•</Text>
                    <Text style={styles.bulletText}>
                        This report should be used in conjunction with other due diligence processes
                    </Text>
                </View>

                <Text style={[styles.disclaimerText, styles.bold, { marginTop: 15 }]}>
                    Confidentiality:
                </Text>

                <Text style={styles.disclaimerText}>
                    This report contains confidential and proprietary information. Distribution is restricted
                    to authorized personnel only. Unauthorized reproduction or distribution is strictly prohibited.
                </Text>

                <Text style={[styles.disclaimerText, styles.bold, { marginTop: 15 }]}>
                    Contact Information:
                </Text>

                <Text style={styles.disclaimerText}>
                    For questions regarding this report or our methodology, please contact:
                </Text>

                <View style={{ marginTop: 10 }}>
                    <Text style={styles.paragraph}>• Email: support@credmatrix.com</Text>
                    <Text style={styles.paragraph}>• Phone: +91-XXX-XXX-XXXX</Text>
                    <Text style={styles.paragraph}>• Website: https://credmatrix.ai</Text>
                </View>
            </View>

            <View style={{ marginTop: 30, alignItems: 'center' }}>
                <Text style={{ fontSize: 8, color: colors.gray[500] }}>
                    © 2025 CredMatrix. All rights reserved.
                </Text>
            </View>
        </View>

        <PDFFooter generatedAt={new Date().toISOString()} pageNumber={pageNumber} />
    </Page>
)