/**
 * Data Extractors Index
 * 
 * Centralized exports for all risk analysis data extraction utilities
 * providing a single import point for filtering system components.
 */

// Core extraction utilities
export * from './risk-analysis-extractors';
export * from './region-extractors';
export * from './compliance-extractors';
export * from './financial-extractors';

// Re-export commonly used types and functions for convenience
export type {
    RiskAnalysisData
} from './risk-analysis-extractors';

export type {
    RegionData
} from './region-extractors';

export type {
    ComplianceStatus,
    AuditStatus,
    ComplianceData
} from './compliance-extractors';

export type {
    FinancialMetrics,
    FinancialHealthScore
} from './financial-extractors';

// Main extraction function that combines all extractors
import { parseRiskAnalysisData } from './risk-analysis-extractors';
import { extractRegionFromRiskAnalysis, type RegionData } from './region-extractors';
import { extractComplianceData, type ComplianceData } from './compliance-extractors';
import { extractFinancialMetrics, type FinancialMetrics } from './financial-extractors';

export interface ExtractedCompanyData {
    region: RegionData;
    compliance: ComplianceData;
    financial: FinancialMetrics;
    dataQuality: {
        hasRegionData: boolean;
        hasComplianceData: boolean;
        hasFinancialData: boolean;
        overallConfidence: 'high' | 'medium' | 'low';
    };
}

/**
 * Main extraction function that processes risk analysis data and returns all extracted information
 */
export function extractAllCompanyData(riskAnalysis: any): ExtractedCompanyData {
    const region = extractRegionFromRiskAnalysis(riskAnalysis);
    const compliance = extractComplianceData(riskAnalysis);
    const financial = extractFinancialMetrics(riskAnalysis);

    // Assess overall data quality
    const hasRegionData = region.state !== null || region.city !== null;
    const hasComplianceData = compliance.gstCompliance.status !== 'unknown' ||
        compliance.epfoCompliance.status !== 'unknown' ||
        compliance.auditStatus.status !== 'unknown';
    const hasFinancialData = financial.confidence !== 'low';

    let overallConfidence: 'high' | 'medium' | 'low';
    const confidenceScores = [
        region.confidence === 'high' ? 3 : region.confidence === 'medium' ? 2 : 1,
        compliance.gstCompliance.confidence === 'high' ? 3 : compliance.gstCompliance.confidence === 'medium' ? 2 : 1,
        compliance.epfoCompliance.confidence === 'high' ? 3 : compliance.epfoCompliance.confidence === 'medium' ? 2 : 1,
        compliance.auditStatus.confidence === 'high' ? 3 : compliance.auditStatus.confidence === 'medium' ? 2 : 1,
        financial.confidence === 'high' ? 3 : financial.confidence === 'medium' ? 2 : 1
    ];

    const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;

    if (avgConfidence >= 2.5) {
        overallConfidence = 'high';
    } else if (avgConfidence >= 2.0) {
        overallConfidence = 'medium';
    } else {
        overallConfidence = 'low';
    }

    return {
        region,
        compliance,
        financial,
        dataQuality: {
            hasRegionData,
            hasComplianceData,
            hasFinancialData,
            overallConfidence
        }
    };
}

/**
 * Utility function to check if extracted data meets filtering requirements
 */
export function meetsFilteringRequirements(
    extractedData: ExtractedCompanyData,
    requirements: {
        requireRegion?: boolean;
        requireCompliance?: boolean;
        requireFinancial?: boolean;
        minimumConfidence?: 'high' | 'medium' | 'low';
    }
): boolean {
    if (requirements.requireRegion && !extractedData.dataQuality.hasRegionData) {
        return false;
    }

    if (requirements.requireCompliance && !extractedData.dataQuality.hasComplianceData) {
        return false;
    }

    if (requirements.requireFinancial && !extractedData.dataQuality.hasFinancialData) {
        return false;
    }

    if (requirements.minimumConfidence) {
        const confidenceOrder = { 'low': 1, 'medium': 2, 'high': 3 };
        const requiredLevel = confidenceOrder[requirements.minimumConfidence];
        const actualLevel = confidenceOrder[extractedData.dataQuality.overallConfidence];

        if (actualLevel < requiredLevel) {
            return false;
        }
    }

    return true;
}

/**
 * Batch extraction function for processing multiple companies
 */
export function extractBatchCompanyData(
    companies: Array<{ id: string; risk_analysis: any }>
): Array<{ id: string; extractedData: ExtractedCompanyData }> {
    return companies.map(company => ({
        id: company.id,
        extractedData: extractAllCompanyData(company.risk_analysis)
    }));
}

/**
 * Statistics function to analyze extraction success rates
 */
export function getExtractionStatistics(
    extractedDataArray: ExtractedCompanyData[]
): {
    totalCompanies: number;
    regionDataAvailable: number;
    complianceDataAvailable: number;
    financialDataAvailable: number;
    highConfidenceData: number;
    mediumConfidenceData: number;
    lowConfidenceData: number;
    successRates: {
        region: number;
        compliance: number;
        financial: number;
        overall: number;
    };
} {
    const total = extractedDataArray.length;

    if (total === 0) {
        return {
            totalCompanies: 0,
            regionDataAvailable: 0,
            complianceDataAvailable: 0,
            financialDataAvailable: 0,
            highConfidenceData: 0,
            mediumConfidenceData: 0,
            lowConfidenceData: 0,
            successRates: {
                region: 0,
                compliance: 0,
                financial: 0,
                overall: 0
            }
        };
    }

    const regionDataAvailable = extractedDataArray.filter(data => data.dataQuality.hasRegionData).length;
    const complianceDataAvailable = extractedDataArray.filter(data => data.dataQuality.hasComplianceData).length;
    const financialDataAvailable = extractedDataArray.filter(data => data.dataQuality.hasFinancialData).length;

    const highConfidenceData = extractedDataArray.filter(data => data.dataQuality.overallConfidence === 'high').length;
    const mediumConfidenceData = extractedDataArray.filter(data => data.dataQuality.overallConfidence === 'medium').length;
    const lowConfidenceData = extractedDataArray.filter(data => data.dataQuality.overallConfidence === 'low').length;

    return {
        totalCompanies: total,
        regionDataAvailable,
        complianceDataAvailable,
        financialDataAvailable,
        highConfidenceData,
        mediumConfidenceData,
        lowConfidenceData,
        successRates: {
            region: (regionDataAvailable / total) * 100,
            compliance: (complianceDataAvailable / total) * 100,
            financial: (financialDataAvailable / total) * 100,
            overall: ((regionDataAvailable + complianceDataAvailable + financialDataAvailable) / (total * 3)) * 100
        }
    };
}