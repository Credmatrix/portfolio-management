/**
 * Risk Analysis Data Extraction Utilities
 * 
 * This module provides functions to extract and normalize data from the risk_analysis JSONB structure
 * for consistent filtering across the portfolio management system.
 * Updated to match actual data structure from the system.
 */

import { z } from 'zod';

// Type definitions for risk analysis structure based on actual data
export interface RiskAnalysisData {
    allScores?: Array<{
        score: number;
        value: string;
        details: any;
        maxScore: number;
        available: boolean;
        benchmark: string;
        parameter: string;
        weightage: number;
    }>;
    companyData?: {
        addresses?: {
            registered_address?: {
                state?: string;
                city?: string;
                address_line_1?: string;
                address_line_2?: string;
                pin_code?: string;
            };
            business_address?: {
                state?: string;
                city?: string;
                address_line_1?: string;
                address_line_2?: string;
                pin_code?: string;
            };
        };
        company_info?: {
            cin?: string;
            pan?: string;
            legal_name?: string;
            company_status?: string;
            paid_up_capital_?: string;
            authorised_capital_?: string;
        };
        [key: string]: any;
    };
    financialData?: {
        years?: string[];
        ratios?: {
            profitability_ratios?: {
                ebitda_margin_?: Record<string, number>;
                net_margin_?: Record<string, number>;
                return_on_equity_?: Record<string, number>;
                return_on_capital_employed_?: Record<string, number>;
            };
            leverage_ratios?: {
                debt_equity?: Record<string, number>;
                debt_ratio?: Record<string, number>;
                interest_coverage_ratio?: Record<string, number>;
            };
            liquidity_ratios?: {
                current_ratio?: Record<string, number>;
                quick_ratio?: Record<string, number>;
            };
            efficiency_ratios?: Record<string, Record<string, number>>;
        };
        balance_sheet?: {
            totals?: {
                total_assets?: Record<string, number>;
                total_equity?: Record<string, number>;
                total_current_assets?: Record<string, number>;
                total_current_liabilities?: Record<string, number>;
            };
        };
        profit_loss?: {
            revenue?: {
                net_revenue?: Record<string, number>;
            };
            profitability?: {
                profit_for_the_period?: Record<string, number>;
                operating_profit_?: Record<string, number>;
            };
        };
        [key: string]: any;
    };
    [key: string]: any;
}

// Validation schemas updated for actual structure
const RiskAnalysisSchema = z.object({
    allScores: z.array(z.object({
        score: z.number(),
        value: z.string(),
        details: z.any(),
        maxScore: z.number(),
        available: z.boolean(),
        benchmark: z.string(),
        parameter: z.string(),
        weightage: z.number(),
    })).optional(),
    companyData: z.object({
        addresses: z.object({
            registered_address: z.object({
                state: z.string().optional(),
                city: z.string().optional(),
                address_line_1: z.string().optional(),
                address_line_2: z.string().optional(),
                pin_code: z.string().optional(),
            }).optional(),
            business_address: z.object({
                state: z.string().optional(),
                city: z.string().optional(),
                address_line_1: z.string().optional(),
                address_line_2: z.string().optional(),
                pin_code: z.string().optional(),
            }).optional(),
        }).optional(),
    }).passthrough().optional(),
    financialData: z.object({
        years: z.array(z.string()).optional(),
        ratios: z.object({
            profitability_ratios: z.object({
                ebitda_margin_: z.record(z.number()).optional(),
                net_margin_: z.record(z.number()).optional(),
                return_on_equity_: z.record(z.number()).optional(),
                return_on_capital_employed_: z.record(z.number()).optional(),
            }).optional(),
            leverage_ratios: z.object({
                debt_equity: z.record(z.number()).optional(),
                debt_ratio: z.record(z.number()).optional(),
                interest_coverage_ratio: z.record(z.number()).optional(),
            }).optional(),
            liquidity_ratios: z.object({
                current_ratio: z.record(z.number()).optional(),
                quick_ratio: z.record(z.number()).optional(),
            }).optional(),
        }).passthrough().optional(),
        balance_sheet: z.object({
            totals: z.object({
                total_assets: z.record(z.number()).optional(),
                total_equity: z.record(z.number()).optional(),
                total_current_assets: z.record(z.number()).optional(),
                total_current_liabilities: z.record(z.number()).optional(),
            }).optional(),
        }).passthrough().optional(),
        profit_loss: z.object({
            revenue: z.object({
                net_revenue: z.record(z.number()).optional(),
            }).optional(),
            profitability: z.object({
                profit_for_the_period: z.record(z.number()).optional(),
                operating_profit_: z.record(z.number()).optional(),
            }).optional(),
        }).passthrough().optional(),
    }).passthrough().optional(),
}).passthrough();

/**
 * Safely parses and validates risk analysis data
 */
export function parseRiskAnalysisData(riskAnalysis: any): any | null {
    try {
        if (!riskAnalysis || typeof riskAnalysis !== 'object') {
            return null;
        }

        const parsed = RiskAnalysisSchema.safeParse(riskAnalysis);
        return parsed.success ? parsed.data : riskAnalysis; // Return original if validation fails but data exists
    } catch (error) {
        console.warn('Failed to parse risk analysis data:', error);
        return null;
    }
}

/**
 * Finds a parameter score from allScores array by parameter name
 */
export function findParameterScore(allScores: RiskAnalysisData['allScores'], parameterName: string): number | null {
    if (!allScores || !Array.isArray(allScores)) {
        return null;
    }

    const parameter = allScores.find(score =>
        score.parameter && score.parameter.toLowerCase().includes(parameterName.toLowerCase())
    );

    return parameter?.score ?? null;
}

/**
 * Finds parameter details from allScores array by parameter name
 */
export function findParameterDetails(allScores: RiskAnalysisData['allScores'], parameterName: string): any | null {
    if (!allScores || !Array.isArray(allScores)) {
        return null;
    }

    const parameter = allScores.find(score =>
        score.parameter && score.parameter.toLowerCase().includes(parameterName.toLowerCase())
    );

    return parameter?.details ?? null;
}

/**
 * Normalizes state names to handle variations in naming
 */
export function normalizeStateName(stateName: string): string {
    if (!stateName || typeof stateName !== 'string') {
        return '';
    }

    const normalized = stateName.trim().toLowerCase();

    // Common state name mappings
    const stateMapping: Record<string, string> = {
        'maharashtra': 'Maharashtra',
        'karnataka': 'Karnataka',
        'tamil nadu': 'Tamil Nadu',
        'tamilnadu': 'Tamil Nadu',
        'uttar pradesh': 'Uttar Pradesh',
        'uttarpradesh': 'Uttar Pradesh',
        'west bengal': 'West Bengal',
        'westbengal': 'West Bengal',
        'andhra pradesh': 'Andhra Pradesh',
        'andhrapradesh': 'Andhra Pradesh',
        'madhya pradesh': 'Madhya Pradesh',
        'madhyapradesh': 'Madhya Pradesh',
        'himachal pradesh': 'Himachal Pradesh',
        'himachalpradesh': 'Himachal Pradesh',
        'arunachal pradesh': 'Arunachal Pradesh',
        'arunachalpradesh': 'Arunachal Pradesh',
        'delhi': 'Delhi',
        'new delhi': 'Delhi',
        'ncr': 'Delhi',
        'gujarat': 'Gujarat',
        'rajasthan': 'Rajasthan',
        'punjab': 'Punjab',
        'haryana': 'Haryana',
        'kerala': 'Kerala',
        'odisha': 'Odisha',
        'orissa': 'Odisha',
        'jharkhand': 'Jharkhand',
        'chhattisgarh': 'Chhattisgarh',
        'assam': 'Assam',
        'bihar': 'Bihar',
        'goa': 'Goa',
        'tripura': 'Tripura',
        'meghalaya': 'Meghalaya',
        'manipur': 'Manipur',
        'nagaland': 'Nagaland',
        'mizoram': 'Mizoram',
        'sikkim': 'Sikkim',
        'telangana': 'Telangana',
        'jammu and kashmir': 'Jammu and Kashmir',
        'ladakh': 'Ladakh',
    };

    return stateMapping[normalized] || stateName.split(' ').map(word =>
        word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    ).join(' ');
}

/**
 * Validates if a value is within expected range for financial metrics
 */
export function validateFinancialMetric(value: any, metricType: string): number | null {
    if (typeof value !== 'number' || isNaN(value) || !isFinite(value)) {
        return null;
    }

    // Define reasonable ranges for different metrics
    const ranges: Record<string, { min: number; max: number }> = {
        ebitdaMargin: { min: -100, max: 100 }, // Percentage
        debtEquityRatio: { min: 0, max: 50 }, // Ratio
        currentRatio: { min: 0, max: 20 }, // Ratio
        totalRevenue: { min: 0, max: 1e12 }, // Currency
        netProfit: { min: -1e12, max: 1e12 }, // Currency (can be negative)
        totalAssets: { min: 0, max: 1e12 }, // Currency
        totalLiabilities: { min: 0, max: 1e12 }, // Currency
    };

    const range = ranges[metricType];
    if (!range) {
        return value; // No validation for unknown metrics
    }

    if (value < range.min || value > range.max) {
        console.warn(`Financial metric ${metricType} value ${value} is outside expected range [${range.min}, ${range.max}]`);
        return null;
    }

    return value;
}

/**
 * Gets the latest year from financial data years array or ratio keys
 */
export function getLatestFinancialYear(financialData: RiskAnalysisData['financialData']): string | null {
    if (!financialData || typeof financialData !== 'object') {
        return null;
    }

    // Try to get from years array first
    if (financialData.years && Array.isArray(financialData.years) && financialData.years.length > 0) {
        const sortedYears = [...financialData.years].sort((a, b) => {
            const yearA = parseInt(a.split(' ')[2] || a.split('-')[0]);
            const yearB = parseInt(b.split(' ')[2] || b.split('-')[0]);
            return yearB - yearA; // Descending order (latest first)
        });
        return sortedYears[0];
    }

    // Fallback: try to extract from ratio keys
    const ratioSections = [
        financialData.ratios?.profitability_ratios?.ebitda_margin_,
        financialData.ratios?.leverage_ratios?.debt_equity,
        financialData.ratios?.liquidity_ratios?.current_ratio,
    ];

    for (const ratioData of ratioSections) {
        if (ratioData && typeof ratioData === 'object') {
            const years = Object.keys(ratioData)
                .filter(year => /\d{4}/.test(year)) // Contains a 4-digit year
                .sort((a, b) => {
                    const yearA = parseInt(a.split(' ')[2] || a.split('-')[0]);
                    const yearB = parseInt(b.split(' ')[2] || b.split('-')[0]);
                    return yearB - yearA;
                });

            if (years.length > 0) {
                return years[0];
            }
        }
    }

    return null;
}

/**
 * Data normalization function for consistent filtering
 */
export function normalizeExtractedData<T>(
    data: T | null | undefined,
    defaultValue: T,
    validator?: (value: T) => boolean
): T {
    if (data === null || data === undefined) {
        return defaultValue;
    }

    if (validator && !validator(data)) {
        return defaultValue;
    }

    return data;
}

/**
 * Error handling wrapper for extraction functions
 */
export function safeExtract<T>(
    extractor: () => T,
    defaultValue: T,
    context: string
): T {
    try {
        return extractor();
    } catch (error) {
        console.warn(`Error in ${context}:`, error);
        return defaultValue;
    }
}