/**
 * Compliance Status Extraction Utilities
 * 
 * Functions to extract GST, EPFO, and audit compliance status from risk_analysis JSONB structure
 * with proper handling for unknown/missing compliance data.
 * Updated to match actual data structure.
 */

import {
    RiskAnalysisData,
    parseRiskAnalysisData,
    findParameterScore,
    findParameterDetails,
    safeExtract,
    normalizeExtractedData
} from './risk-analysis-extractors';

export type ComplianceStatus = 'compliant' | 'non-compliant' | 'partial' | 'unknown';
export type AuditStatus = 'qualified' | 'unqualified' | 'adverse' | 'disclaimer' | 'unknown';

export interface ComplianceData {
    gstCompliance: {
        status: ComplianceStatus;
        score: number | null;
        confidence: 'high' | 'medium' | 'low';
        details?: any;
    };
    epfoCompliance: {
        status: ComplianceStatus;
        score: number | null;
        confidence: 'high' | 'medium' | 'low';
        details?: any;
    };
    auditStatus: {
        status: AuditStatus;
        qualification: string | null;
        confidence: 'high' | 'medium' | 'low';
        details?: any;
    };
}

/**
 * Extracts GST compliance status from risk analysis data
 */
export function extractGSTCompliance(riskAnalysis: any): ComplianceData['gstCompliance'] {
    return safeExtract(
        () => {
            const parsedData = parseRiskAnalysisData(riskAnalysis);
            if (!parsedData?.allScores) {
                return createEmptyGSTCompliance();
            }

            // Look for GST compliance in allScores array
            const gstParameter = parsedData.allScores.find(score =>
                score.parameter && score.parameter.toLowerCase().includes('gst')
            );

            if (gstParameter && gstParameter.available) {
                // Extract compliance rate from details if available
                const details = gstParameter.details;
                let complianceRate: number | null = null;

                if (details && typeof details === 'object') {
                    complianceRate = details.compliance_rate ||
                        details.gstr1_analysis?.compliance_rate ||
                        details.gstr3b_analysis?.compliance_rate;
                }

                if (complianceRate !== null) {
                    return {
                        ...mapGSTScoreToStatus(complianceRate),
                        details: details
                    };
                }

                // Fallback to parameter score (0-5 scale, convert to percentage)
                const scorePercentage = (gstParameter.score / gstParameter.maxScore) * 100;
                return {
                    ...mapGSTScoreToStatus(scorePercentage),
                    details: details
                };
            }

            return createEmptyGSTCompliance();
        },
        createEmptyGSTCompliance(),
        'extractGSTCompliance'
    );
}

/**
 * Extracts EPFO compliance status from risk analysis data
 */
export function extractEPFOCompliance(riskAnalysis: any): ComplianceData['epfoCompliance'] {
    return safeExtract(
        () => {
            const parsedData = parseRiskAnalysisData(riskAnalysis);
            if (!parsedData?.allScores) {
                return createEmptyEPFOCompliance();
            }

            // Look for EPFO/PF compliance in allScores array
            const epfoParameter = parsedData.allScores.find(score =>
                score.parameter && (
                    score.parameter.toLowerCase().includes('epfo') ||
                    score.parameter.toLowerCase().includes('pf') ||
                    score.parameter.toLowerCase().includes('provident fund')
                )
            );

            if (epfoParameter && epfoParameter.available) {
                const details = epfoParameter.details;
                let complianceRate: number | null = null;

                if (details && typeof details === 'object') {
                    complianceRate = details.compliance_rate ||
                        details.epfo_analysis?.compliance_rate ||
                        details.effective_compliance_rate;
                }

                if (complianceRate !== null) {
                    return {
                        ...mapEPFOScoreToStatus(complianceRate),
                        details: details
                    };
                }

                // Fallback to parameter score (0-5 scale, convert to percentage)
                const scorePercentage = (epfoParameter.score / epfoParameter.maxScore) * 100;
                return {
                    ...mapEPFOScoreToStatus(scorePercentage),
                    details: details
                };
            }

            return createEmptyEPFOCompliance();
        },
        createEmptyEPFOCompliance(),
        'extractEPFOCompliance'
    );
}

/**
 * Extracts audit qualification status from risk analysis data
 */
export function extractAuditStatus(riskAnalysis: any): ComplianceData['auditStatus'] {
    return safeExtract(
        () => {
            const parsedData = parseRiskAnalysisData(riskAnalysis);
            if (!parsedData?.allScores) {
                return createEmptyAuditStatus();
            }

            // Look for audit-related parameters
            const auditParameter = parsedData.allScores.find(score =>
                score.parameter && (
                    score.parameter.toLowerCase().includes('audit') ||
                    score.parameter.toLowerCase().includes('qualification')
                )
            );

            if (auditParameter && auditParameter.available) {
                const details = auditParameter.details;
                let qualification: string | null = null;

                if (details && typeof details === 'object') {
                    qualification = details.qualification ||
                        details.audit_qualification ||
                        details.opinion ||
                        auditParameter.value;
                } else {
                    qualification = auditParameter.value;
                }

                if (qualification && typeof qualification === 'string') {
                    return {
                        ...mapAuditQualificationToStatus(qualification),
                        details: details
                    };
                }
            }

            return createEmptyAuditStatus();
        },
        createEmptyAuditStatus(),
        'extractAuditStatus'
    );
}

/**
 * Extracts complete compliance data from risk analysis
 */
export function extractComplianceData(riskAnalysis: any): ComplianceData {
    return {
        gstCompliance: extractGSTCompliance(riskAnalysis),
        epfoCompliance: extractEPFOCompliance(riskAnalysis),
        auditStatus: extractAuditStatus(riskAnalysis)
    };
}

/**
 * Maps GST compliance score to status
 */
function mapGSTScoreToStatus(score: number): Omit<ComplianceData['gstCompliance'], 'details'> {
    // Validate score range (assuming 0-100 scale)
    if (score < 0 || score > 100) {
        console.warn(`GST compliance score ${score} is outside expected range [0, 100]`);
        return createEmptyGSTCompliance();
    }

    let status: ComplianceStatus;
    let confidence: 'high' | 'medium' | 'low' = 'high';

    if (score >= 95) {
        status = 'compliant';
    } else if (score >= 80) {
        status = 'partial';
        confidence = 'medium';
    } else if (score >= 60) {
        status = 'non-compliant';
        confidence = 'medium';
    } else {
        status = 'non-compliant';
    }

    return {
        status,
        score,
        confidence
    };
}

/**
 * Maps EPFO compliance score to status
 */
function mapEPFOScoreToStatus(score: number): Omit<ComplianceData['epfoCompliance'], 'details'> {
    // Validate score range (assuming 0-100 scale)
    if (score < 0 || score > 100) {
        console.warn(`EPFO compliance score ${score} is outside expected range [0, 100]`);
        return createEmptyEPFOCompliance();
    }

    let status: ComplianceStatus;
    let confidence: 'high' | 'medium' | 'low' = 'high';

    if (score >= 95) {
        status = 'compliant';
    } else if (score >= 85) {
        status = 'partial';
        confidence = 'medium';
    } else if (score >= 70) {
        status = 'non-compliant';
        confidence = 'medium';
    } else {
        status = 'non-compliant';
    }

    return {
        status,
        score,
        confidence
    };
}

/**
 * Maps audit qualification string to status
 */
function mapAuditQualificationToStatus(qualification: string): Omit<ComplianceData['auditStatus'], 'details'> {
    const normalizedQualification = qualification.toLowerCase().trim();

    let status: AuditStatus;
    let confidence: 'high' | 'medium' | 'low' = 'high';

    // Map common audit qualification terms
    if (normalizedQualification.includes('unqualified') ||
        normalizedQualification.includes('clean') ||
        normalizedQualification.includes('standard') ||
        normalizedQualification.includes('regular')) {
        status = 'unqualified'; // This is actually good - unqualified opinion means clean audit
    } else if (normalizedQualification.includes('qualified') ||
        normalizedQualification.includes('except for') ||
        normalizedQualification.includes('subject to')) {
        status = 'qualified';
    } else if (normalizedQualification.includes('adverse') ||
        normalizedQualification.includes('negative')) {
        status = 'adverse';
    } else if (normalizedQualification.includes('disclaimer') ||
        normalizedQualification.includes('unable to express') ||
        normalizedQualification.includes('scope limitation')) {
        status = 'disclaimer';
    } else {
        status = 'unknown';
        confidence = 'low';
    }

    return {
        status,
        qualification,
        confidence
    };
}

/**
 * Creates empty GST compliance data
 */
function createEmptyGSTCompliance(): ComplianceData['gstCompliance'] {
    return {
        status: 'unknown',
        score: null,
        confidence: 'low'
    };
}

/**
 * Creates empty EPFO compliance data
 */
function createEmptyEPFOCompliance(): ComplianceData['epfoCompliance'] {
    return {
        status: 'unknown',
        score: null,
        confidence: 'low'
    };
}

/**
 * Creates empty audit status data
 */
function createEmptyAuditStatus(): ComplianceData['auditStatus'] {
    return {
        status: 'unknown',
        qualification: null,
        confidence: 'low'
    };
}

/**
 * Validates compliance data quality
 */
export function validateComplianceData(complianceData: ComplianceData): {
    isValid: boolean;
    hasGSTData: boolean;
    hasEPFOData: boolean;
    hasAuditData: boolean;
} {
    const hasGSTData = complianceData.gstCompliance.status !== 'unknown';
    const hasEPFOData = complianceData.epfoCompliance.status !== 'unknown';
    const hasAuditData = complianceData.auditStatus.status !== 'unknown';

    return {
        isValid: hasGSTData || hasEPFOData || hasAuditData,
        hasGSTData,
        hasEPFOData,
        hasAuditData
    };
}

/**
 * Gets compliance summary for display
 */
export function getComplianceSummary(complianceData: ComplianceData): {
    overallStatus: ComplianceStatus;
    compliantCount: number;
    totalCount: number;
    details: string[];
} {
    const statuses = [
        complianceData.gstCompliance.status,
        complianceData.epfoCompliance.status,
        complianceData.auditStatus.status === 'unqualified' ? 'compliant' :
            complianceData.auditStatus.status === 'qualified' ? 'partial' :
                complianceData.auditStatus.status === 'adverse' ? 'non-compliant' :
                    complianceData.auditStatus.status === 'disclaimer' ? 'non-compliant' : 'unknown'
    ];

    const knownStatuses = statuses.filter(status => status !== 'unknown');
    const compliantCount = knownStatuses.filter(status => status === 'compliant').length;
    const partialCount = knownStatuses.filter(status => status === 'partial').length;
    const nonCompliantCount = knownStatuses.filter(status => status === 'non-compliant').length;

    let overallStatus: ComplianceStatus;
    if (knownStatuses.length === 0) {
        overallStatus = 'unknown';
    } else if (nonCompliantCount > 0) {
        overallStatus = 'non-compliant';
    } else if (partialCount > 0) {
        overallStatus = 'partial';
    } else {
        overallStatus = 'compliant';
    }

    const details: string[] = [];
    if (complianceData.gstCompliance.status !== 'unknown') {
        details.push(`GST: ${complianceData.gstCompliance.status}`);
    }
    if (complianceData.epfoCompliance.status !== 'unknown') {
        details.push(`EPFO: ${complianceData.epfoCompliance.status}`);
    }
    if (complianceData.auditStatus.status !== 'unknown') {
        details.push(`Audit: ${complianceData.auditStatus.status}`);
    }

    return {
        overallStatus,
        compliantCount,
        totalCount: knownStatuses.length,
        details
    };
}

/**
 * Checks if compliance status meets minimum requirements
 */
export function meetsComplianceRequirements(
    complianceData: ComplianceData,
    requirements: {
        gstRequired?: boolean;
        epfoRequired?: boolean;
        auditRequired?: boolean;
        minimumCompliantCount?: number;
    }
): boolean {
    const validation = validateComplianceData(complianceData);

    if (requirements.gstRequired && !validation.hasGSTData) {
        return false;
    }

    if (requirements.epfoRequired && !validation.hasEPFOData) {
        return false;
    }

    if (requirements.auditRequired && !validation.hasAuditData) {
        return false;
    }

    if (requirements.minimumCompliantCount) {
        const summary = getComplianceSummary(complianceData);
        if (summary.compliantCount < requirements.minimumCompliantCount) {
            return false;
        }
    }

    return true;
}