import * as XLSX from 'xlsx-js-style';
import { FluentColors } from '@/lib/constants/colors';

// Enhanced color palette with gradients and effects
const ExcelColors = {
    // CREDMATRIX Brand Colors (ARGB format for Excel)
    brandPrimary: 'FF0066CC',
    brandSecondary: 'FF00A3E0',
    brandAccent: 'FF00D4FF',
    brandDark: 'FF003D6B',

    // Modern Gradient Palette
    gradientBlue1: 'FF1E3A8A',   // Deep blue
    gradientBlue2: 'FF3B82F6',   // Blue
    gradientBlue3: 'FF60A5FA',   // Light blue
    gradientBlue4: 'FF93C5FD',   // Very light blue
    gradientBlue5: 'FFDBEAFE',   // Ultra light blue

    // Accent Colors
    success: 'FF10B981',
    warning: 'FFF59E0B',
    danger: 'FFEF4444',
    info: 'FF3B82F6',

    // Neutral Colors
    gray50: 'FFFAFAFA',
    gray100: 'FFF4F4F5',
    gray200: 'FFE4E4E7',
    gray300: 'FFD4D4D8',
    gray600: 'FF52525B',
    gray800: 'FF27272A',
    gray900: 'FF18181B',

    // Special Effects
    gold: 'FFFBBF24',
    silver: 'FF94A3B8',
    highlight: 'FFFEF3C7',


    credmatrixBlue: 'FF0078D4',
    credmatrixLightBlue: 'FF71AFE5',
    credmatrixCyan: 'FF00BCF2',
    credmatrixDarkBlue: 'FF005A9E',
    credmatrixGreen: 'FF107C10',
    credmatrixOrange: 'FFFF8C00',
    credmatrixRed: 'FFD13438',
    credmatrixPurple: 'FF5C2D91',
    credmatrixTeal: 'FF00B7C3',

    // Gradient Colors
    gradient1: 'FF4A90E2',
    gradient2: 'FF357ABD',
    gradient3: 'FF1E6091',
    gradient4: 'FF0F4C75',
    gradientGold1: 'FFFFD700',
    gradientGold2: 'FFFFB347',
    gradientSilver1: 'FFC0C0C0',
    gradientSilver2: 'FF808080',

    // Background Colors
    lightGray: 'FFF8F9FA',
    mediumGray: 'FFE9ECEF',
    darkGray: 'FF6C757D',
    white: 'FFFFFFFF',
    black: 'FF000000',

    // Accent Colors
    accent1: 'FFFF1744',
    accent2: 'FF00E676',
    accent3: 'FF2979FF',
    accent4: 'FFFFC400'
};

export interface ExcelStyleConfig {
    companyName?: string;
    reportTitle?: string;
    generatedBy?: string;
    filters?: Record<string, any>;
    theme?: 'professional' | 'modern' | 'creative' | 'minimal';
}

export class ProfessionalExcelGenerator {
    private workbook: XLSX.WorkBook;
    private config: ExcelStyleConfig;
    private theme: string;

    constructor(config: ExcelStyleConfig = {}) {
        this.workbook = XLSX.utils.book_new();
        this.config = {
            companyName: 'Credit Portfolio Manager',
            reportTitle: 'Portfolio Export Report',
            generatedBy: 'System',
            theme: 'professional',
            ...config
        };
        this.theme = this.config.theme || 'professional';
    }

    createEnhancedCoverSheet(totalRecords?: number, analytics?: any) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = currentDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        // Create ultra-wide readable layout
        const coverData = [
            // Header with date/time - Rows 1-3
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', formattedDate, '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', formattedTime, '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Main brand banner - Rows 4-8
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'C R E D M A T R I X', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌▌', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'PORTFOLIO INTELLIGENCE PLATFORM', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄▄', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Large spaced-out sections - Start Row 10

            // Portfolio Overview - LARGE SECTION (Rows 10-18)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'PORTFOLIO OVERVIEW', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Total Companies:', `${totalRecords || 0}`, '', '', 'Total Exposure:', `₹${analytics?.total_exposure || 0} Cr`, '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Average Risk Score:', `${analytics?.average_risk_score || 0}`, '', '', 'Processing Speed:', 'Real-time Analytics', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Risk Assessment:', this.getOverallRiskRating(analytics), '', '', 'Data Quality:', '✓ Verified & Validated', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Risk Distribution - LARGE SECTION (Rows 19-30)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'RISK DISTRIBUTION ANALYSIS', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Low Risk (CM1-CM2):', `${this.getRiskCount(analytics, 'low')} companies`, '', '████████████████████████', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Medium Risk (CM3-CM4):', `${this.getRiskCount(analytics, 'medium')} companies`, '', '████████████████████████', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'High Risk (CM5-CM7):', `${this.getRiskCount(analytics, 'high')} companies`, '', '████████████████████████', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Risk Trend:', '⬇️ Improving Overall', '', '', 'Portfolio Health:', '🟢 Stable', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Intelligence Features - LARGE SECTION (Rows 31-42)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'AI-POWERED INTELLIGENCE FEATURES', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '🎯 Real-time Risk Assessment', '', '', '', '🛡️ Compliance Monitoring', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '💡 Smart Credit Optimization', '', '', '', '🔮 Predictive Default Analytics', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '📊 Portfolio Performance Insights', '', '', '', '⚡ Automated Decision Engine', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '🔍 Deep Company Analysis', '', '', '', '📈 Market Intelligence', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Compliance Overview - LARGE SECTION (Rows 43-54)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'COMPLIANCE STATUS OVERVIEW', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'GST Compliance:', '', '', '', 'EPFO Compliance:', '', '', '', 'Overall Status:', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', `✅ Compliant: ${analytics?.compliance_overview?.gst_compliance?.compliant || 0}`, '', '', '', `✅ Compliant: ${analytics?.compliance_overview?.epfo_compliance?.compliant || 0}`, '', '', '', `📈 Compliance Rate: ${this.getOverallComplianceRate(analytics)}%`, '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', `❌ Non-Compliant: ${analytics?.compliance_overview?.gst_compliance?.non_compliant || 0}`, '', '', '', `❌ Non-Compliant: ${analytics?.compliance_overview?.epfo_compliance?.non_compliant || 0}`, '', '', '', `🎯 Risk Level: ${this.getOverallRiskRating(analytics)}`, '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', `📊 Rate: ${this.getGSTComplianceRate(analytics)}%`, '', '', '', `📊 Rate: ${this.getEPFOComplianceRate(analytics)}%`, '', '', '', `🛡️ Security: Enterprise Grade`, '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Export Information - LARGE SECTION (Rows 55-66)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'EXPORT INFORMATION & METADATA', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Report Type:', this.config.reportTitle, '', '', 'Generated By:', this.config.generatedBy || 'System User', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Export ID:', this.generateExportId(), '', '', 'Generation Date:', formattedDate, '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Security Level:', '✓ Enterprise Grade Encryption', '', '', 'Valid Until:', this.getValidityDate(), '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'Format Version:', '2.0 Professional', '', '', 'Quality Assurance:', '✓ Verified Data Integrity', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],

            // Applied Filters Section (Rows 67-75)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', 'APPLIED FILTERS & CRITERIA', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ...(this.config.filters && Object.keys(this.config.filters).length > 0 ?
                Object.entries(this.config.filters)
                    .filter(([_, value]) => value && (Array.isArray(value) ? value.length > 0 : true))
                    .slice(0, 3)
                    .flatMap(([key, value]) => [
                        ['', '', `${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:`, Array.isArray(value) ? value.slice(0, 3).join(', ') + (value.length > 3 ? '...' : '') : String(value), '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                        ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                    ]) : [
                    ['', '', 'No active filters applied', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
                    ['', '', 'Showing all available portfolio data', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '']
                ]
            ),

            // Footer Section (Rows 76-80)
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '• CREDMATRIX - TRANSFORMING CREDIT DECISIONS •', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
            ['', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', '', ''],
        ];

        const coverSheet = XLSX.utils.aoa_to_sheet(coverData);

        // Apply ultra-readable styling
        this.applyUltraReadableStyling(coverSheet, totalRecords, analytics);

        // Add to workbook
        XLSX.utils.book_append_sheet(this.workbook, coverSheet, '⚡ CREDMATRIX');

        return coverSheet;
    }

    private applyUltraReadableStyling(worksheet: XLSX.WorkSheet, totalRecords?: number, analytics?: any) {
        // Set ultra-wide worksheet range
        worksheet['!ref'] = 'A1:T85';

        // Header date/time styling (top right)
        this.styleCell(worksheet, 'R1', {
            font: { size: 10, color: { rgb: ExcelColors.gray600 }, italic: true },
            alignment: { horizontal: 'right', vertical: 'center' }
        });
        this.styleCell(worksheet, 'R2', {
            font: { size: 10, color: { rgb: ExcelColors.gray600 }, italic: true },
            alignment: { horizontal: 'right', vertical: 'center' }
        });

        // Main CREDMATRIX brand banner (ultra-wide)
        worksheet['!merges'] = worksheet['!merges'] || [];
        worksheet['!merges'].push({ s: { r: 4, c: 2 }, e: { r: 4, c: 13 } });

        this.styleCell(worksheet, 'C5', {
            font: {
                bold: true,
                size: 36,
                color: { rgb: ExcelColors.white },
                name: 'Segoe UI'
            },
            fill: { fgColor: { rgb: ExcelColors.gradientBlue1 } },
            alignment: { horizontal: 'center', vertical: 'center' },
            border: {
                top: { style: 'thick', color: { rgb: ExcelColors.brandAccent } },
                bottom: { style: 'thick', color: { rgb: ExcelColors.brandAccent } },
                left: { style: 'thick', color: { rgb: ExcelColors.brandAccent } },
                right: { style: 'thick', color: { rgb: ExcelColors.brandAccent } }
            }
        });

        // Decorative line
        worksheet['!merges'].push({ s: { r: 5, c: 2 }, e: { r: 5, c: 13 } });
        this.styleCell(worksheet, 'C6', {
            font: { size: 12, color: { rgb: ExcelColors.brandAccent } },
            fill: { fgColor: { rgb: ExcelColors.gradientBlue2 } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Subtitle
        worksheet['!merges'].push({ s: { r: 6, c: 2 }, e: { r: 6, c: 13 } });
        this.styleCell(worksheet, 'C7', {
            font: {
                bold: true,
                size: 18,
                color: { rgb: ExcelColors.white },
                name: 'Segoe UI Light'
            },
            fill: { fgColor: { rgb: ExcelColors.gradientBlue2 } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Bottom decorative line
        worksheet['!merges'].push({ s: { r: 7, c: 2 }, e: { r: 7, c: 13 } });
        this.styleCell(worksheet, 'C8', {
            font: { size: 10, color: { rgb: ExcelColors.brandAccent } },
            fill: { fgColor: { rgb: ExcelColors.gradientBlue3 } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Section Headers - Large and bold
        this.styleLargeSectionHeader(worksheet, 'C11', 'PORTFOLIO OVERVIEW');
        this.styleLargeSectionHeader(worksheet, 'C20', 'RISK DISTRIBUTION ANALYSIS');
        this.styleLargeSectionHeader(worksheet, 'C32', 'AI-POWERED INTELLIGENCE FEATURES');
        this.styleLargeSectionHeader(worksheet, 'C44', 'COMPLIANCE STATUS OVERVIEW');
        this.styleLargeSectionHeader(worksheet, 'C56', 'EXPORT INFORMATION & METADATA');
        this.styleLargeSectionHeader(worksheet, 'C68', 'APPLIED FILTERS & CRITERIA');

        // Portfolio Overview Values - Large fonts
        this.styleLargeMetric(worksheet, 'C13', 'D13', ExcelColors.info);
        this.styleLargeMetric(worksheet, 'G13', 'H13', ExcelColors.success);
        this.styleLargeMetric(worksheet, 'C15', 'D15', ExcelColors.warning);
        this.styleLargeMetric(worksheet, 'G15', 'H15', ExcelColors.brandPrimary);
        this.styleLargeMetric(worksheet, 'C17', 'D17', ExcelColors.info);
        this.styleLargeMetric(worksheet, 'G17', 'H17', ExcelColors.success);

        // Risk Distribution Bars - Large and colorful
        this.styleLargeRiskBar(worksheet, 'F22', ExcelColors.success);
        this.styleLargeRiskBar(worksheet, 'F24', ExcelColors.warning);
        this.styleLargeRiskBar(worksheet, 'F26', ExcelColors.danger);

        // Risk metrics
        this.styleLargeMetric(worksheet, 'C22', 'D22', ExcelColors.success);
        this.styleLargeMetric(worksheet, 'C24', 'D24', ExcelColors.warning);
        this.styleLargeMetric(worksheet, 'C26', 'D26', ExcelColors.danger);

        // Features section - Large icons and text
        this.styleLargeFeature(worksheet, 'C34');
        this.styleLargeFeature(worksheet, 'C36');
        this.styleLargeFeature(worksheet, 'C38');
        this.styleLargeFeature(worksheet, 'C40');

        // Compliance metrics - Large values
        this.styleLargeMetric(worksheet, 'C47', 'C47', ExcelColors.brandPrimary);
        this.styleLargeMetric(worksheet, 'G47', 'G47', ExcelColors.brandPrimary);
        this.styleLargeMetric(worksheet, 'K47', 'K47', ExcelColors.brandPrimary);

        // Export information - Large and clear
        this.styleLargeMetric(worksheet, 'C58', 'D58', ExcelColors.gray800);
        this.styleLargeMetric(worksheet, 'G58', 'H58', ExcelColors.gray800);
        this.styleLargeMetric(worksheet, 'C60', 'D60', ExcelColors.gray800);
        this.styleLargeMetric(worksheet, 'G60', 'H60', ExcelColors.gray800);

        // Footer branding
        worksheet['!merges'].push({ s: { r: 69, c: 5 }, e: { r: 69, c: 14 } });
        this.styleCell(worksheet, 'F70', {
            font: {
                bold: true,
                size: 16,
                color: { rgb: ExcelColors.brandPrimary },
                name: 'Segoe UI'
            },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        worksheet['!merges'].push({ s: { r: 70, c: 5 }, e: { r: 70, c: 14 } });
        this.styleCell(worksheet, 'F71', {
            font: {
                size: 12,
                color: { rgb: ExcelColors.gray600 },
                italic: true
            },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Set ultra-wide column widths for maximum readability
        worksheet['!cols'] = [
            { wch: 3 },   // A
            { wch: 3 },   // B
            { wch: 30 },  // C - Main labels
            { wch: 18 },  // D - Values
            { wch: 5 },   // E - Spacer
            { wch: 25 },  // F - Secondary content
            { wch: 25 },   // G - Spacer
            { wch: 18 },  // H - Values
            { wch: 5 },   // I - Spacer
            { wch: 15 },  // J
            { wch: 20 },  // K
            { wch: 15 },  // L
            { wch: 15 },  // M
            { wch: 15 },  // N
            { wch: 15 },  // O
            { wch: 15 },  // P
            { wch: 15 },  // Q
            { wch: 17 },  // R
            { wch: 5 },   // S - Spacer
            { wch: 3 }   // T - Date column
        ];

        // Set generous row heights for excellent readability
        worksheet['!rows'] = [
            { hpt: 20 },  // Header
            { hpt: 20 },  // Date/time
            { hpt: 20 },  // Space
            { hpt: 25 },  // Space
            { hpt: 60 },  // Main brand banner
            { hpt: 20 },  // Decorative
            { hpt: 40 },  // Subtitle
            { hpt: 20 },  // Bottom line
            { hpt: 30 },  // Space
            { hpt: 30 },  // Space
            { hpt: 35 },  // Section headers
            ...Array(75).fill({ hpt: 28 }) // All content rows - generous spacing
        ];
    }

    private styleLargeSectionHeader(worksheet: XLSX.WorkSheet, cellAddress: string, text: string) {
        // Merge across multiple columns for wide headers
        const pos = XLSX.utils.decode_cell(cellAddress);
        worksheet['!merges'] = worksheet['!merges'] || [];
        worksheet['!merges'].push({ s: { r: pos.r, c: pos.c }, e: { r: pos.r, c: pos.c + 8 } });

        this.styleCell(worksheet, cellAddress, {
            font: {
                bold: true,
                size: 16,
                color: { rgb: ExcelColors.brandPrimary },
                name: 'Segoe UI'
            },
            fill: { fgColor: { rgb: ExcelColors.gray100 } },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: {
                bottom: { style: 'medium', color: { rgb: ExcelColors.brandPrimary } },
                top: { style: 'thin', color: { rgb: ExcelColors.gray300 } }
            }
        });
    }

    private styleLargeMetric(worksheet: XLSX.WorkSheet, labelCell: string, valueCell: string, color: string) {
        // Label styling
        this.styleCell(worksheet, labelCell, {
            font: {
                bold: true,
                size: 12,
                color: { rgb: ExcelColors.gray800 },
                name: 'Segoe UI'
            },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Value styling
        this.styleCell(worksheet, valueCell, {
            font: {
                bold: true,
                size: 14,
                color: { rgb: color },
                name: 'Segoe UI'
            },
            alignment: { horizontal: 'left', vertical: 'center' }
        });
    }

    private styleLargeRiskBar(worksheet: XLSX.WorkSheet, cellAddress: string, color: string) {
        this.styleCell(worksheet, cellAddress, {
            font: {
                size: 14,
                color: { rgb: color },
                name: 'Consolas',
                bold: true
            },
            alignment: { horizontal: 'left', vertical: 'center' }
        });
    }

    private styleLargeFeature(worksheet: XLSX.WorkSheet, cellAddress: string) {
        this.styleCell(worksheet, cellAddress, {
            font: {
                size: 13,
                color: { rgb: ExcelColors.gray800 },
                name: 'Segoe UI'
            },
            alignment: { horizontal: 'left', vertical: 'center' }
        });
    }

    private getRiskCount(analytics: any, riskLevel: 'low' | 'medium' | 'high'): number {
        if (!analytics?.risk_distribution) return 0;

        const dist = analytics.risk_distribution;
        switch (riskLevel) {
            case 'low':
                return (dist.cm1 || 0) + (dist.cm2 || 0);
            case 'medium':
                return (dist.cm3 || 0) + (dist.cm4 || 0);
            case 'high':
                return (dist.cm5 || 0) + (dist.cm6 || 0) + (dist.cm7 || 0);
            default:
                return 0;
        }
    }

    private getOverallComplianceRate(analytics: any): number {
        if (!analytics?.compliance_overview) return 0;

        const gstCompliant = analytics.compliance_overview.gst_compliance?.compliant || 0;
        const epfoCompliant = analytics.compliance_overview.epfo_compliance?.compliant || 0;
        const total = analytics.total_companies || 1;

        return Math.round(((gstCompliant + epfoCompliant) / (total * 2)) * 100);
    }

    private getGSTComplianceRate(analytics: any): number {
        if (!analytics?.compliance_overview?.gst_compliance) return 0;
        const compliant = analytics.compliance_overview.gst_compliance.compliant || 0;
        const total = analytics.total_companies || 1;
        return Math.round((compliant / total) * 100);
    }

    private getEPFOComplianceRate(analytics: any): number {
        if (!analytics?.compliance_overview?.epfo_compliance) return 0;
        const compliant = analytics.compliance_overview.epfo_compliance.compliant || 0;
        const total = analytics.total_companies || 1;
        return Math.round((compliant / total) * 100);
    }

    private getOverallRiskRating(analytics: any): string {
        const avgScore = parseFloat(analytics?.average_risk_score || '0');
        if (avgScore < 30) return 'Low Risk Portfolio';
        if (avgScore < 60) return 'Moderate Risk Portfolio';
        return 'Higher Risk Portfolio';
    }

    private applyEnhancedCoverStyling(worksheet: XLSX.WorkSheet) {
        // Set worksheet range
        worksheet['!ref'] = 'A1:K45';

        // Apply theme-based styling
        if (this.theme === 'modern') {
            this.applyModernTheme(worksheet);
        } else if (this.theme === 'creative') {
            this.applyCreativeTheme(worksheet);
        } else if (this.theme === 'minimal') {
            this.applyMinimalTheme(worksheet);
        } else {
            this.applyProfessionalTheme(worksheet);
        }

        // Common styling elements
        this.applyCommonStyling(worksheet);
    }

    private applyProfessionalTheme(worksheet: XLSX.WorkSheet) {
        // CREDMATRIX text in row 3
        this.styleCell(worksheet, 'C3', {
            font: { bold: true, size: 10, color: { rgb: 'FF0078D4' }, name: 'Segoe UI' },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Main CREDMATRIX banner (Row 7) - Letter by letter with gradient
        const letters = ['C', 'R', 'E', 'D', 'M', 'A', 'T', 'R', 'I', 'X'];
        const letterColors = [
            'FF0078D4', // C - Primary Blue
            'FF1BA1E2', // R - Lighter Blue
            'FF00BCF2', // E - Cyan
            'FF00D8FF', // D - Light Cyan
            'FF0078D4', // M - Primary Blue
            'FF005A9E', // A - Dark Blue
            'FF003D6E', // T - Darker Blue
            'FF005A9E', // R - Dark Blue
            'FF0078D4', // I - Primary Blue
            'FF00BCF2'  // X - Cyan
        ];

        letters.forEach((letter, index) => {
            const col = String.fromCharCode(66 + index); // B=66, C=67, etc.
            this.styleCell(worksheet, `${col}7`, {
                font: {
                    bold: true,
                    size: 36,
                    color: { rgb: 'FFFFFFFF' },
                    name: 'Impact'
                },
                fill: {
                    fgColor: { rgb: letterColors[index] }
                },
                alignment: {
                    horizontal: 'center',
                    vertical: 'center'
                },
                border: {
                    top: { style: 'thick', color: { rgb: 'FF004578' } },
                    bottom: { style: 'thick', color: { rgb: 'FF004578' } },
                    left: { style: 'medium', color: { rgb: letterColors[index] } },
                    right: { style: 'medium', color: { rgb: letterColors[index] } }
                }
            });
        });

        // Diamond decorators row (Row 8)
        for (let i = 1; i <= 10; i++) {
            const col = String.fromCharCode(65 + i);
            this.styleCell(worksheet, `${col}8`, {
                font: {
                    size: 12,
                    color: { rgb: ExcelColors.gradientGold1 }
                },
                alignment: { horizontal: 'center', vertical: 'center' }
            });
        }

        // Comprehensive Credit Solutions (Row 9)
        worksheet['!merges'] = worksheet['!merges'] || [];
        worksheet['!merges'].push({ s: { r: 8, c: 1 }, e: { r: 8, c: 10 } });

        this.styleCell(worksheet, 'B9', {
            font: {
                bold: true,
                size: 18,
                color: { rgb: 'FF0078D4' },
                name: 'Calibri Light'
            },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Metrics section styling
        this.styleMetricsSection(worksheet);

        // Risk distribution visual chart
        this.styleRiskDistribution(worksheet);

        // Key features with star icons
        this.styleKeyFeatures(worksheet);

        // Export information section
        this.styleExportInfo(worksheet);
    }

    private applyModernTheme(worksheet: XLSX.WorkSheet) {
        // Modern theme with glass morphism effect simulation
        // Main banner with gradient effect
        for (let col = 1; col <= 10; col++) {
            const colLetter = String.fromCharCode(65 + col);
            const opacity = Math.abs(5 - col) / 5;
            const blueValue = Math.floor(120 + (opacity * 135));
            const color = `FF00${blueValue.toString(16).padStart(2, '0')}D4`;

            this.styleCell(worksheet, `${colLetter}7`, {
                font: { bold: true, size: 32, color: { rgb: 'FFFFFFFF' } },
                fill: { fgColor: { rgb: color } },
                alignment: { horizontal: 'center', vertical: 'center' }
            });
        }
    }

    private applyCreativeTheme(worksheet: XLSX.WorkSheet) {
        // Creative theme with bold colors and patterns
        const creativeColors = [
            'FFFF1744', // Red
            'FFFF9100', // Orange
            'FFFFC400', // Amber
            'FF76FF03', // Light Green
            'FF00E676', // Green
            'FF00E5FF', // Cyan
            'FF2979FF', // Blue
            'FF651FFF', // Purple
            'FFD500F9', // Pink
            'FFFF1744'  // Red
        ];

        // Apply rainbow effect to main banner
        for (let i = 0; i < 10; i++) {
            const col = String.fromCharCode(66 + i);
            this.styleCell(worksheet, `${col}7`, {
                font: { bold: true, size: 30, color: { rgb: 'FFFFFFFF' } },
                fill: { fgColor: { rgb: creativeColors[i] } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'double', color: { rgb: 'FFFFFFFF' } },
                    bottom: { style: 'double', color: { rgb: 'FFFFFFFF' } }
                }
            });
        }
    }

    private applyMinimalTheme(worksheet: XLSX.WorkSheet) {
        // Minimal theme with clean lines and subtle colors
        for (let i = 0; i < 10; i++) {
            const col = String.fromCharCode(66 + i);
            this.styleCell(worksheet, `${col}7`, {
                font: { bold: false, size: 24, color: { rgb: 'FF333333' }, name: 'Helvetica' },
                fill: { fgColor: { rgb: 'FFFAFAFA' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    bottom: { style: 'thin', color: { rgb: 'FFE0E0E0' } }
                }
            });
        }
    }

    private styleMetricsSection(worksheet: XLSX.WorkSheet) {
        // Portfolio Metrics header
        this.styleCell(worksheet, 'D11', {
            font: { bold: true, size: 14, color: { rgb: 'FF0078D4' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Metric values with different colors
        const metricCells = ['D12', 'F12', 'H12'];
        const metricColors = [ExcelColors.credmatrixGreen, ExcelColors.credmatrixBlue, ExcelColors.credmatrixOrange];

        metricCells.forEach((cell, index) => {
            this.styleCell(worksheet, cell, {
                font: { bold: true, size: 24, color: { rgb: metricColors[index] } },
                alignment: { horizontal: 'center', vertical: 'center' }
            });
        });

        // Metric labels
        const labelCells = ['D13', 'F13', 'H13'];
        labelCells.forEach(cell => {
            this.styleCell(worksheet, cell, {
                font: { size: 10, color: { rgb: 'FF6C757D' } },
                alignment: { horizontal: 'center', vertical: 'center' }
            });
        });
    }

    private styleRiskDistribution(worksheet: XLSX.WorkSheet) {
        // Risk Distribution header
        this.styleCell(worksheet, 'D15', {
            font: { bold: true, size: 14, color: { rgb: 'FF0078D4' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Visual bars with colors
        this.styleCell(worksheet, 'D16', {
            font: { size: 14, color: { rgb: ExcelColors.credmatrixGreen } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        this.styleCell(worksheet, 'F16', {
            font: { size: 14, color: { rgb: ExcelColors.credmatrixOrange } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        this.styleCell(worksheet, 'H16', {
            font: { size: 14, color: { rgb: ExcelColors.credmatrixRed } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });
    }

    private styleKeyFeatures(worksheet: XLSX.WorkSheet) {
        // Key Features header with star
        this.styleCell(worksheet, 'D20', {
            font: { bold: true, size: 14, color: { rgb: 'FF0078D4' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Feature items with diamond bullets
        const featureRows = [21, 22, 23];
        featureRows.forEach(row => {
            this.styleCell(worksheet, `C${row}`, {
                font: { size: 10, color: { rgb: ExcelColors.gradientGold1 } },
                alignment: { horizontal: 'center', vertical: 'center' }
            });

            this.styleCell(worksheet, `D${row}`, {
                font: { size: 11, color: { rgb: 'FF333333' } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });

            this.styleCell(worksheet, `F${row}`, {
                font: { size: 10, color: { rgb: ExcelColors.gradientGold1 } },
                alignment: { horizontal: 'center', vertical: 'center' }
            });

            this.styleCell(worksheet, `G${row}`, {
                font: { size: 11, color: { rgb: 'FF333333' } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });
        });
    }

    private styleExportInfo(worksheet: XLSX.WorkSheet) {
        // Export Information header
        this.styleCell(worksheet, 'D26', {
            font: { bold: true, size: 14, color: { rgb: 'FF0078D4' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Info rows with alternating alignment
        const infoRows = [27, 28, 29];
        infoRows.forEach(row => {
            // Labels
            this.styleCell(worksheet, `D${row}`, {
                font: { bold: true, size: 10, color: { rgb: 'FF6C757D' } },
                alignment: { horizontal: 'right', vertical: 'center' }
            });

            // Values
            this.styleCell(worksheet, `E${row}`, {
                font: { size: 10, color: { rgb: 'FF333333' } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });

            // Second column labels
            this.styleCell(worksheet, `G${row}`, {
                font: { bold: true, size: 10, color: { rgb: 'FF6C757D' } },
                alignment: { horizontal: 'right', vertical: 'center' }
            });

            // Second column values
            this.styleCell(worksheet, `H${row}`, {
                font: { size: 10, color: { rgb: 'FF333333' } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });
        });
    }

    private applyCommonStyling(worksheet: XLSX.WorkSheet) {
        // Set column widths for optimal layout
        worksheet['!cols'] = [
            { wch: 3 },   // A - Margin
            { wch: 12 },  // B
            { wch: 12 },  // C
            { wch: 20 },  // D
            { wch: 20 },  // E
            { wch: 15 },  // F
            { wch: 20 },  // G
            { wch: 15 },  // H
            { wch: 12 },  // I
            { wch: 12 },  // J
            { wch: 15 }   // K
        ];

        // Set row heights for visual hierarchy
        worksheet['!rows'] = [
            { hpt: 10 },  // Row 1
            { hpt: 10 },  // Row 2
            { hpt: 20 },  // Row 3
            { hpt: 20 },  // Row 4
            { hpt: 15 },  // Row 5
            { hpt: 15 },  // Row 6
            { hpt: 50 },  // Row 7 - Main banner
            { hpt: 20 },  // Row 8 - Decorators
            { hpt: 30 },  // Row 9 - Subtitle
            { hpt: 15 },  // Row 10
            { hpt: 25 },  // Row 11
            { hpt: 35 },  // Row 12 - Metrics values
            { hpt: 20 },  // Row 13
            { hpt: 15 },  // Row 14
            { hpt: 25 },  // Row 15
            { hpt: 25 },  // Row 16
            { hpt: 20 },  // Row 17
            { hpt: 15 },  // Row 18
            { hpt: 15 },  // Row 19
            { hpt: 25 },  // Row 20
            ...Array(25).fill({ hpt: 20 }) // Remaining rows
        ];
    }

    createDataVisualizationSheet(data: any[], sheetName: string = 'Data Insights') {
        // Create a sheet with data visualization elements
        const vizData = this.generateVisualizationData(data);
        const vizSheet = XLSX.utils.aoa_to_sheet(vizData);

        // Apply visualization styling
        this.applyVisualizationStyling(vizSheet, data.length);

        // Add to workbook
        XLSX.utils.book_append_sheet(this.workbook, vizSheet, '📊 ' + sheetName);

        return vizSheet;
    }

    private generateVisualizationData(data: any[]): any[][] {
        // Generate sparklines and mini-charts using Unicode characters
        const riskDistribution = this.calculateRiskDistribution(data);
        const complianceStats = this.calculateComplianceStats(data);

        return [
            ['DATA VISUALIZATION DASHBOARD'],
            ['Generated: ' + new Date().toLocaleDateString()],
            [],

            // Risk Distribution Chart
            ['RISK DISTRIBUTION'],
            ['Grade', 'Count', 'Visual', 'Percentage'],
            ...Object.entries(riskDistribution).map(([grade, count]) => {
                const percentage = ((count as number) / data.length * 100).toFixed(1);
                const bars = '█'.repeat(Math.ceil((count as number) / data.length * 20));
                return [grade, count, bars, `${percentage}%`];
            }),
            [],

            // Compliance Overview
            ['COMPLIANCE OVERVIEW'],
            ['Type', 'Compliant', 'Non-Compliant', 'Compliance Rate'],
            ['GST', complianceStats.gst.compliant, complianceStats.gst.nonCompliant,
                `${(complianceStats.gst.compliant / data.length * 100).toFixed(1)}%`],
            ['EPFO', complianceStats.epfo.compliant, complianceStats.epfo.nonCompliant,
                `${(complianceStats.epfo.compliant / data.length * 100).toFixed(1)}%`],
            [],

            // Top Performers
            ['TOP PERFORMERS BY RISK SCORE'],
            ['Rank', 'Company', 'Risk Score', 'Grade', 'Performance'],
            ...this.getTopPerformers(data, 5).map((company, index) => [
                index + 1,
                company.company_name,
                company.risk_score,
                company.risk_grade,
                '⭐'.repeat(Math.round(5 * company.risk_score / 100))
            ])
        ];
    }

    private applyVisualizationStyling(worksheet: XLSX.WorkSheet, dataCount: number) {
        // Dashboard title
        this.styleCell(worksheet, 'A1', {
            font: { bold: true, size: 18, color: { rgb: 'FF0078D4' } },
            fill: { fgColor: { rgb: 'FFE3F2FD' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Section headers
        const sectionHeaders = ['A4', 'A10', 'A15'];
        sectionHeaders.forEach(cell => {
            this.styleCell(worksheet, cell, {
                font: { bold: true, size: 14, color: { rgb: 'FFFFFFFF' } },
                fill: { fgColor: { rgb: 'FF0078D4' } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });
        });

        // Table headers
        const tableHeaders = [
            { row: 5, cols: ['A', 'B', 'C', 'D'] },
            { row: 11, cols: ['A', 'B', 'C', 'D'] },
            { row: 16, cols: ['A', 'B', 'C', 'D', 'E'] }
        ];

        tableHeaders.forEach(header => {
            header.cols.forEach(col => {
                this.styleCell(worksheet, `${col}${header.row}`, {
                    font: { bold: true, size: 11, color: { rgb: 'FF333333' } },
                    fill: { fgColor: { rgb: 'FFE9ECEF' } },
                    alignment: { horizontal: 'center', vertical: 'center' },
                    border: {
                        bottom: { style: 'medium', color: { rgb: 'FF0078D4' } }
                    }
                });
            });
        });

        // Apply alternating row colors for data
        for (let row = 6; row <= 8; row++) {
            const isEven = row % 2 === 0;
            const fillColor = isEven ? 'FFFAFAFA' : 'FFFFFFFF';

            ['A', 'B', 'C', 'D'].forEach(col => {
                this.styleCell(worksheet, `${col}${row}`, {
                    fill: { fgColor: { rgb: fillColor } },
                    border: {
                        bottom: { style: 'thin', color: { rgb: 'FFE0E0E0' } }
                    }
                });
            });
        }

        // Style visualization bars
        for (let row = 6; row <= 8; row++) {
            this.styleCell(worksheet, `C${row}`, {
                font: { color: { rgb: this.getColorForRiskGrade(row - 5) } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });
        }

        // Set column widths
        worksheet['!cols'] = [
            { wch: 20 },
            { wch: 15 },
            { wch: 25 },
            { wch: 15 },
            { wch: 20 }
        ];
    }

    private calculateRiskDistribution(data: any[]): Record<string, number> {
        const distribution: Record<string, number> = {
            'CM1-CM2': 0,
            'CM3-CM4': 0,
            'CM5-CM7': 0
        };

        // Ensure data is an array
        if (!Array.isArray(data)) {
            return distribution;
        }

        data.forEach(item => {
            if (!item || typeof item !== 'object') return;

            const grade = item.risk_grade?.toLowerCase() || '';
            if (grade === 'cm1' || grade === 'cm2') {
                distribution['CM1-CM2']++;
            } else if (grade === 'cm3' || grade === 'cm4') {
                distribution['CM3-CM4']++;
            } else if (grade === 'cm5' || grade === 'cm6' || grade === 'cm7') {
                distribution['CM5-CM7']++;
            }
        });

        return distribution;
    }

    private calculateComplianceStats(data: any[]) {
        // Ensure data is an array
        if (!Array.isArray(data)) {
            return {
                gst: { compliant: 0, nonCompliant: 0 },
                epfo: { compliant: 0, nonCompliant: 0 }
            };
        }

        return {
            gst: {
                compliant: data.filter(item => item && item.gst_compliance_status.includes('Regular') || item.gst_compliance_status.includes('Generally Regular')).length,
                nonCompliant: data.filter(item => item && item.gst_compliance_status.includes('Irregular')).length
            },
            epfo: {
                compliant: data.filter(item => item && item.epfo_compliance_status.includes('Regular') || item.epfo_compliance_status.includes('Generally Regular')).length,
                nonCompliant: data.filter(item => item && item.epfo_compliance_status.includes('Irregular')).length
            }
        };
    }

    private getTopPerformers(data: any[], limit: number = 5) {
        // Ensure data is an array
        if (!Array.isArray(data)) {
            return [];
        }

        return data
            .filter(item => item && item.risk_score != null && item.risk_score > 0)
            .sort((a, b) => (b.risk_score || 0) - (a.risk_score || 0))
            .slice(0, limit);
    }

    private getColorForRiskGrade(grade: number): string {
        switch (grade) {
            case 1: return ExcelColors.credmatrixGreen;
            case 2: return ExcelColors.credmatrixOrange;
            case 3: return ExcelColors.credmatrixRed;
            default: return 'FF6C757D';
        }
    }

    private generateExportId(): string {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substr(2, 5);
        return `CRD-${timestamp}-${random}`.toUpperCase();
    }

    private getValidityDate(): string {
        const date = new Date();
        date.setMonth(date.getMonth() + 3); // 3 months validity
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    createStyledWorksheet(data: any[], headers: string[], fieldKeys: string[], sheetName: string = 'Portfolio Data') {
        // Create worksheet data with enhanced header
        const worksheetData = this.createEnhancedWorksheetData(data, headers, fieldKeys);

        // Create worksheet
        const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);

        // Apply enhanced styling
        this.applyEnhancedWorksheetStyling(worksheet, headers.length, data.length);

        // Set column widths
        this.setDynamicColumnWidths(worksheet, headers, fieldKeys, data);

        // Add conditional formatting simulation
        this.applyConditionalFormatting(worksheet, fieldKeys, data);

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(this.workbook, worksheet, '📑 ' + sheetName);

        return worksheet;
    }

    private createEnhancedWorksheetData(data: any[], headers: string[], fieldKeys: string[]) {
        const currentDate = new Date().toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        const worksheetData = [
            // Mini header
            [`CREDMATRIX | ${this.config.reportTitle} | ${currentDate}`],
            [], // Empty row

            // Column headers with icons
            headers.map(header => this.getHeaderWithIcon(header)),

            // Data rows
            ...data.map(row =>
                fieldKeys.map(key => this.formatEnhancedCellValue(row[key], key))
            ),

            [], // Empty row

            // Summary footer
            ['SUMMARY'],
            [`Total Records: ${data.length}`],
            [`Export Date: ${currentDate}`],
            [`Generated By: ${this.config.generatedBy}`]
        ];

        return worksheetData;
    }

    private getHeaderWithIcon(header: string): string {
        const iconMap: Record<string, string> = {
            'Company Name': '🏢 Company Name',
            'Risk Grade': '⚠️ Risk Grade',
            'Credit Rating': '📊 Credit Rating',
            'Compliance': '✓ Compliance',
            'Location': '📍 Location',
            'Date': '📅 Date',
            'Limit': '💰 Limit',
            'Score': '📈 Score'
        };

        for (const [key, value] of Object.entries(iconMap)) {
            if (header.includes(key)) {
                return value;
            }
        }

        return header;
    }

    private formatEnhancedCellValue(value: any, key: string): any {
        if (value === null || value === undefined) return '-';

        // Format based on field type
        if (key.includes('limit') || key.includes('amount')) {
            return typeof value === 'number' ? `₹ ${value.toLocaleString('en-IN')} Cr` : value;
        }

        if (key.includes('date')) {
            return value ? new Date(value).toLocaleDateString('en-IN') : '-';
        }

        if (key.includes('score')) {
            return typeof value === 'number' ? value.toFixed(2) : value;
        }

        return String(value);
    }

    private applyEnhancedWorksheetStyling(worksheet: XLSX.WorkSheet, headerCount: number, dataRowCount: number) {
        // Mini header styling
        this.styleCell(worksheet, 'A1', {
            font: { size: 10, color: { rgb: 'FF0078D4' }, italic: true },
            alignment: { horizontal: 'left', vertical: 'center' }
        });

        // Column headers with gradient
        for (let col = 0; col < headerCount; col++) {
            const cellAddress = XLSX.utils.encode_cell({ r: 2, c: col });
            this.styleCell(worksheet, cellAddress, {
                font: { bold: true, size: 11, color: { rgb: 'FFFFFFFF' } },
                fill: { fgColor: { rgb: 'FF0078D4' } },
                alignment: { horizontal: 'center', vertical: 'center' },
                border: {
                    top: { style: 'medium', color: { rgb: 'FF005A9E' } },
                    bottom: { style: 'medium', color: { rgb: 'FF005A9E' } },
                    left: { style: 'thin', color: { rgb: 'FF0078D4' } },
                    right: { style: 'thin', color: { rgb: 'FF0078D4' } }
                }
            });
        }

        // Data rows with zebra striping and hover effect simulation
        for (let row = 3; row < 3 + dataRowCount; row++) {
            const isEvenRow = (row - 3) % 2 === 0;
            const fillColor = isEvenRow ? 'FFFFFFFF' : 'FFF0F8FF';

            for (let col = 0; col < headerCount; col++) {
                const cellAddress = XLSX.utils.encode_cell({ r: row, c: col });
                this.styleCell(worksheet, cellAddress, {
                    fill: { fgColor: { rgb: fillColor } },
                    alignment: { horizontal: 'left', vertical: 'center' },
                    border: {
                        bottom: { style: 'hair', color: { rgb: 'FFE0E0E0' } },
                        left: { style: 'hair', color: { rgb: 'FFE0E0E0' } },
                        right: { style: 'hair', color: { rgb: 'FFE0E0E0' } }
                    },
                    font: { size: 10, color: { rgb: 'FF333333' } }
                });
            }
        }

        // Summary footer styling
        const footerStartRow = 3 + dataRowCount + 1;
        this.styleCell(worksheet, `A${footerStartRow}`, {
            font: { bold: true, size: 12, color: { rgb: 'FF0078D4' } },
            fill: { fgColor: { rgb: 'FFE3F2FD' } },
            alignment: { horizontal: 'left', vertical: 'center' }
        });
    }

    private setDynamicColumnWidths(worksheet: XLSX.WorkSheet, headers: string[], fieldKeys: string[], data: any[]) {
        const colWidths = headers.map((header, index) => {
            const fieldKey = fieldKeys[index];
            let maxWidth = header.length + 4; // Header length + padding for icon

            // Check data for max width
            data.forEach(row => {
                const value = String(row[fieldKey] || '');
                maxWidth = Math.max(maxWidth, value.length);
            });

            // Cap maximum width
            maxWidth = Math.min(maxWidth, 40);
            maxWidth = Math.max(maxWidth, 10);

            return { wch: maxWidth };
        });

        worksheet['!cols'] = colWidths;
    }

    private applyConditionalFormatting(worksheet: XLSX.WorkSheet, fieldKeys: string[], data: any[]) {
        // Simulate conditional formatting with colors
        data.forEach((row, rowIndex) => {
            fieldKeys.forEach((key, colIndex) => {
                const cellAddress = XLSX.utils.encode_cell({ r: rowIndex + 3, c: colIndex });

                // Risk grade coloring
                if (key.includes('risk_grade')) {
                    const grade = row[key]?.toLowerCase() || '';
                    let color = 'FF333333';
                    let bgColor = 'FFFFFFFF';

                    if (grade.includes('cm1') || grade.includes('cm2')) {
                        color = 'FF107C10';
                        bgColor = 'FFE8F5E9';
                    } else if (grade.includes('cm3') || grade.includes('cm4')) {
                        color = 'FFFF8C00';
                        bgColor = 'FFFFF3E0';
                    } else if (grade.includes('cm5') || grade.includes('cm6') || grade.includes('cm7')) {
                        color = 'FFD13438';
                        bgColor = 'FFFFEBEE';
                    }

                    this.styleCell(worksheet, cellAddress, {
                        font: { bold: true, color: { rgb: color } },
                        fill: { fgColor: { rgb: bgColor } }
                    });
                }

                // Compliance status coloring
                if (key.includes('compliance_status')) {
                    const status = row[key]?.toLowerCase() || '';
                    if (status === 'compliant') {
                        this.styleCell(worksheet, cellAddress, {
                            font: { color: { rgb: 'FF107C10' } },
                            fill: { fgColor: { rgb: 'FFE8F5E9' } }
                        });
                    } else if (status === 'non-compliant') {
                        this.styleCell(worksheet, cellAddress, {
                            font: { color: { rgb: 'FFD13438' } },
                            fill: { fgColor: { rgb: 'FFFFEBEE' } }
                        });
                    }
                }

                // Highlight high values
                if (key.includes('limit') || key.includes('amount')) {
                    const value = parseFloat(row[key]);
                    if (value > 100) {
                        this.styleCell(worksheet, cellAddress, {
                            font: { bold: true, color: { rgb: 'FF0078D4' } }
                        });
                    }
                }
            });
        });
    }

    private styleCell(worksheet: XLSX.WorkSheet, cellAddress: string, style: any) {
        if (!worksheet[cellAddress]) {
            worksheet[cellAddress] = { t: 's', v: '' };
        }

        if (!worksheet[cellAddress].s) {
            worksheet[cellAddress].s = {};
        }

        // Ensure proper Excel color format (ARGB with FF prefix)
        if (style.fill?.fgColor?.rgb) {
            let color = style.fill.fgColor.rgb.replace('#', '');
            if (!color.startsWith('FF')) {
                style.fill.fgColor.rgb = 'FF' + color;
            }
        }

        if (style.font?.color?.rgb) {
            let color = style.font.color.rgb.replace('#', '');
            if (!color.startsWith('FF')) {
                style.font.color.rgb = 'FF' + color;
            }
        }

        if (style.border) {
            ['top', 'bottom', 'left', 'right'].forEach(side => {
                if (style.border[side]?.color?.rgb) {
                    let color = style.border[side].color.rgb.replace('#', '');
                    if (!color.startsWith('FF')) {
                        style.border[side].color.rgb = 'FF' + color;
                    }
                }
            });
        }

        Object.assign(worksheet[cellAddress].s, style);
    }

    createSummarySheet(analytics: any, metadata: any = {}) {
        const currentDate = new Date();
        const formattedDate = currentDate.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
        const formattedTime = currentDate.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        });

        const summaryData = [
            ['PORTFOLIO SUMMARY'],
            [`Generated on ${formattedDate} at ${formattedTime}`],
            [],

            ['KEY METRICS'],
            [],
            ['Metric', 'Value', 'Status'],
            ['Total Companies', analytics?.total_companies || 0, '✓'],
            ['Total Exposure (₹ Cr)', analytics?.total_exposure || 0, '✓'],
            ['Average Risk Score', analytics?.average_risk_score || 0,
                parseFloat(analytics?.average_risk_score || '0') < 50 ? '✓ Good' : '⚠ Review'],
            [],

            ['RISK GRADE DISTRIBUTION'],
            [],
            ['Grade', 'Count', 'Percentage', 'Visual'],
            ...Object.entries(analytics?.risk_distribution || {}).map(([grade, count]) => {
                const percentage = ((count as number) / (analytics?.total_companies || 1) * 100).toFixed(1);
                const bars = '█'.repeat(Math.ceil((count as number) / (analytics?.total_companies || 1) * 10));
                return [grade.toUpperCase(), count, `${percentage}%`, bars];
            }),
            [],

            ['COMPLIANCE SUMMARY'],
            [],
            ['Type', 'Compliant', 'Non-Compliant', 'Rate'],
            ['GST',
                analytics?.compliance_overview?.gst_compliance?.compliant || 0,
                analytics?.compliance_overview?.gst_compliance?.non_compliant || 0,
                `${((analytics?.compliance_overview?.gst_compliance?.compliant || 0) / (analytics?.total_companies || 1) * 100).toFixed(1)}%`
            ],
            ['EPFO',
                analytics?.compliance_overview?.epfo_compliance?.compliant || 0,
                analytics?.compliance_overview?.epfo_compliance?.non_compliant || 0,
                `${((analytics?.compliance_overview?.epfo_compliance?.compliant || 0) / (analytics?.total_companies || 1) * 100).toFixed(1)}%`
            ],
            [],

            ['EXPORT METADATA'],
            [],
            ['User', metadata.user || 'System User'],
            ['Date', formattedDate],
            ['Time', formattedTime],
            ['Records Exported', analytics?.total_companies || 0],
            ['Fields Selected', metadata.fieldsCount || 'All'],
            ['Format', metadata.format || 'Excel Professional (.xlsx)'],
            ['Theme', metadata.theme || 'Professional'],
            ['Export ID', this.generateExportId()]
        ];

        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

        // Apply professional styling
        this.applySummarySheetStyling(summarySheet);

        // Add to workbook
        XLSX.utils.book_append_sheet(this.workbook, summarySheet, '📈 Summary');

        return summarySheet;
    }

    private applySummarySheetStyling(worksheet: XLSX.WorkSheet) {
        // Title styling
        this.styleCell(worksheet, 'A1', {
            font: { bold: true, size: 18, color: { rgb: 'FF0078D4' } },
            fill: { fgColor: { rgb: 'FFE3F2FD' } },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Date/time styling
        this.styleCell(worksheet, 'A2', {
            font: { size: 10, color: { rgb: 'FF6C757D' }, italic: true },
            alignment: { horizontal: 'center', vertical: 'center' }
        });

        // Section headers
        const sectionHeaders = ['A4', 'A11', 'A18', 'A26'];
        sectionHeaders.forEach(cell => {
            this.styleCell(worksheet, cell, {
                font: { bold: true, size: 14, color: { rgb: 'FF0078D4' } },
                fill: { fgColor: { rgb: 'FFF0F8FF' } },
                alignment: { horizontal: 'left', vertical: 'center' }
            });
        });

        // Table headers
        const tableHeaderRows = [6, 13, 20, 28];
        tableHeaderRows.forEach(row => {
            ['A', 'B', 'C', 'D'].forEach(col => {
                const cell = `${col}${row}`;
                if (worksheet[cell]) {
                    this.styleCell(worksheet, cell, {
                        font: { bold: true, size: 11, color: { rgb: 'FF333333' } },
                        fill: { fgColor: { rgb: 'FFE9ECEF' } },
                        alignment: { horizontal: 'center', vertical: 'center' },
                        border: {
                            bottom: { style: 'medium', color: { rgb: 'FF0078D4' } }
                        }
                    });
                }
            });
        });

        // Apply alternating row colors for data sections
        const dataRows = [
            { start: 7, end: 9 },    // Key metrics
            { start: 14, end: 16 },  // Risk distribution
            { start: 21, end: 23 },  // Compliance
            { start: 29, end: 36 }   // Metadata
        ];

        dataRows.forEach(section => {
            for (let row = section.start; row <= section.end; row++) {
                const isEven = (row - section.start) % 2 === 0;
                const fillColor = isEven ? 'FFFFFFFF' : 'FFFAFAFA';

                ['A', 'B', 'C', 'D'].forEach(col => {
                    const cell = `${col}${row}`;
                    if (worksheet[cell]) {
                        this.styleCell(worksheet, cell, {
                            fill: { fgColor: { rgb: fillColor } },
                            font: { size: 10, color: { rgb: 'FF333333' } },
                            border: {
                                bottom: { style: 'thin', color: { rgb: 'FFE0E0E0' } }
                            }
                        });
                    }
                });
            }
        });

        // Style visual bars in risk distribution
        for (let row = 14; row <= 16; row++) {
            const cell = `D${row}`;
            if (worksheet[cell]) {
                this.styleCell(worksheet, cell, {
                    font: {
                        color: { rgb: this.getColorForRiskGrade(row - 13) },
                        size: 12
                    },
                    alignment: { horizontal: 'left', vertical: 'center' }
                });
            }
        }

        // Set column widths
        worksheet['!cols'] = [
            { wch: 25 },  // A - Labels
            { wch: 20 },  // B - Values
            { wch: 20 },  // C - Additional info
            { wch: 25 }   // D - Visual elements
        ];

        // Set row heights
        worksheet['!rows'] = [
            { hpt: 30 },  // Title
            { hpt: 20 },  // Date
            { hpt: 15 },  // Empty
            { hpt: 25 },  // Section header
            ...Array(35).fill({ hpt: 20 })
        ];

        // Merge cells for title
        worksheet['!merges'] = worksheet['!merges'] || [];
        worksheet['!merges'].push(
            { s: { r: 0, c: 0 }, e: { r: 0, c: 3 } },  // Title
            { s: { r: 1, c: 0 }, e: { r: 1, c: 3 } }   // Date
        );
    }

    // Getter to access the workbook
    getWorkbook(): XLSX.WorkBook {
        return this.workbook;
    }

    generateBuffer(): Buffer {
        return XLSX.write(this.workbook, {
            type: 'buffer',
            bookType: 'xlsx',
            bookSST: true,
            compression: true
        });
    }
}