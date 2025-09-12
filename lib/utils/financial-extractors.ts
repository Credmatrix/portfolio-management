/**
 * Financial Metrics Extraction Utilities
 * 
 * Functions to extract and validate financial metrics from risk_analysis JSONB structure
 * with support for multiple years of data and proper error handling.
 * Updated to match actual data structure.
 */

import {
    RiskAnalysisData,
    parseRiskAnalysisData,
    validateFinancialMetric,
    getLatestFinancialYear,
    safeExtract
} from './risk-analysis-extractors';

export interface FinancialMetrics {
    ebitdaMargin: number | null;
    debtEquityRatio: number | null;
    currentRatio: number | null;
    totalRevenue: number | null;
    netProfit: number | null;
    totalAssets: number | null;
    totalLiabilities: number | null;
    year: string | null;
    confidence: 'high' | 'medium' | 'low';
    dataSource: 'latest' | 'fallback' | 'calculated' | 'unknown';
}

export interface FinancialHealthScore {
    score: number; // 0-100
    category: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    factors: {
        profitability: number;
        liquidity: number;
        leverage: number;
        efficiency: number;
    };
}

/**
 * Extracts financial metrics from risk analysis data
 */
export function extractFinancialMetrics(riskAnalysis: any): FinancialMetrics {
    return safeExtract(
        () => {
            const parsedData = parseRiskAnalysisData(riskAnalysis);
            if (!parsedData?.financialData) {
                return createEmptyFinancialMetrics();
            }

            // Get the latest year's data
            const latestYear = getLatestFinancialYear(parsedData.financialData);
            if (!latestYear) {
                return createEmptyFinancialMetrics();
            }

            // Extract metrics from the financial data structure
            const metrics = extractMetricsFromFinancialData(parsedData.financialData, latestYear);

            // Try fallback methods if primary extraction failed
            if (metrics.confidence === 'low') {
                const fallbackMetrics = extractFromAlternativePaths(parsedData, latestYear);
                if (fallbackMetrics.confidence !== 'low') {
                    return fallbackMetrics;
                }
            }

            return metrics;
        },
        createEmptyFinancialMetrics(),
        'extractFinancialMetrics'
    );
}

/**
 * Extracts metrics from the financial data structure
 */
function extractMetricsFromFinancialData(financialData: RiskAnalysisData['financialData'], year: string): FinancialMetrics {
    if (!financialData) {
        return createEmptyFinancialMetrics();
    }

    // Extract EBITDA margin from ratios
    const ebitdaMargin = extractRatioValue(
        financialData.ratios?.profitability_ratios?.ebitda_margin_,
        year
    );

    // Extract debt-equity ratio from ratios
    const debtEquityRatio = extractRatioValue(
        financialData.ratios?.leverage_ratios?.debt_equity,
        year
    );

    // Extract current ratio from ratios
    const currentRatio = extractRatioValue(
        financialData.ratios?.liquidity_ratios?.current_ratio,
        year
    );

    // Extract revenue from profit_loss
    const totalRevenue = extractRatioValue(
        financialData.profit_loss?.revenue?.net_revenue,
        year
    );

    // Extract net profit from profit_loss
    const netProfit = extractRatioValue(
        financialData.profit_loss?.profitability?.profit_for_the_period,
        year
    );

    // Extract total assets from balance_sheet
    const totalAssets = extractRatioValue(
        financialData.balance_sheet?.totals?.total_assets,
        year
    );

    // Calculate total liabilities (assets - equity)
    const totalEquity = extractRatioValue(
        financialData.balance_sheet?.totals?.total_equity,
        year
    );

    let totalLiabilities: number | null = null;
    if (totalAssets !== null && totalEquity !== null) {
        totalLiabilities = totalAssets - totalEquity;
    }

    // Validate all extracted metrics
    const validatedMetrics = {
        ebitdaMargin: validateFinancialMetric(ebitdaMargin, 'ebitdaMargin'),
        debtEquityRatio: validateFinancialMetric(debtEquityRatio, 'debtEquityRatio'),
        currentRatio: validateFinancialMetric(currentRatio, 'currentRatio'),
        totalRevenue: validateFinancialMetric(totalRevenue, 'totalRevenue'),
        netProfit: validateFinancialMetric(netProfit, 'netProfit'),
        totalAssets: validateFinancialMetric(totalAssets, 'totalAssets'),
        totalLiabilities: validateFinancialMetric(totalLiabilities, 'totalLiabilities'),
    };

    // Calculate missing metrics if possible
    const calculatedMetrics = calculateMissingMetrics(validatedMetrics, financialData, year);

    // Determine confidence based on data availability
    const availableMetrics = Object.values(calculatedMetrics).filter(metric => metric !== null).length;

    let confidence: 'high' | 'medium' | 'low';
    if (availableMetrics >= 5) {
        confidence = 'high';
    } else if (availableMetrics >= 3) {
        confidence = 'medium';
    } else {
        confidence = 'low';
    }

    return {
        ...calculatedMetrics,
        year,
        confidence,
        dataSource: 'latest'
    };
}

/**
 * Extracts a ratio value for a specific year from ratio data
 */
function extractRatioValue(ratioData: Record<string, number> | undefined, year: string): number | null {
    if (!ratioData || typeof ratioData !== 'object') {
        return null;
    }

    // Try exact match first
    if (ratioData[year] !== undefined) {
        return ratioData[year];
    }

    // Try to find a close match (same year in different format)
    const targetYear = extractYearFromString(year);
    if (targetYear) {
        for (const [key, value] of Object.entries(ratioData)) {
            const keyYear = extractYearFromString(key);
            if (keyYear === targetYear) {
                return value;
            }
        }
    }

    return null;
}

/**
 * Extracts year number from various date formats
 */
function extractYearFromString(dateString: string): number | null {
    if (!dateString || typeof dateString !== 'string') {
        return null;
    }

    // Match patterns like "31 Mar, 2024", "2024", "2023-24", etc.
    const yearMatch = dateString.match(/\b(20\d{2})\b/);
    return yearMatch ? parseInt(yearMatch[1]) : null;
}

/**
 * Calculates missing financial metrics from available data
 */
function calculateMissingMetrics(
    metrics: Omit<FinancialMetrics, 'year' | 'confidence' | 'dataSource'>,
    financialData: RiskAnalysisData['financialData'],
    year: string
): Omit<FinancialMetrics, 'year' | 'confidence' | 'dataSource'> {
    const result = { ...metrics };

    // Try to calculate EBITDA margin if missing
    if (result.ebitdaMargin === null && result.totalRevenue !== null && result.totalRevenue > 0) {
        const ebitda = extractRatioValue(
            financialData?.profit_loss?.profitability?.operating_profit_,
            year
        );
        if (ebitda !== null) {
            result.ebitdaMargin = (ebitda / result.totalRevenue) * 100;
        }
    }

    // Try to calculate current ratio if missing
    if (result.currentRatio === null) {
        const currentAssets = extractRatioValue(
            financialData?.balance_sheet?.totals?.total_current_assets,
            year
        );
        const currentLiabilities = extractRatioValue(
            financialData?.balance_sheet?.totals?.total_current_liabilities,
            year
        );

        if (currentAssets !== null && currentLiabilities !== null && currentLiabilities > 0) {
            result.currentRatio = currentAssets / currentLiabilities;
        }
    }

    return result;
}

/**
 * Tries to extract financial metrics from alternative paths in the data structure
 */
function extractFromAlternativePaths(data: RiskAnalysisData, preferredYear: string): FinancialMetrics {
    // Try to find any year's data if latest year failed
    if (data.financialData?.years && Array.isArray(data.financialData.years)) {
        const availableYears = [...data.financialData.years].sort((a, b) => {
            const yearA = extractYearFromString(a) || 0;
            const yearB = extractYearFromString(b) || 0;
            return yearB - yearA;
        });

        for (const year of availableYears) {
            if (year !== preferredYear) {
                const metrics = extractMetricsFromFinancialData(data.financialData, year);
                if (metrics.confidence !== 'low') {
                    return {
                        ...metrics,
                        dataSource: 'fallback'
                    };
                }
            }
        }
    }

    return createEmptyFinancialMetrics();
}

/**
 * Creates empty financial metrics object
 */
function createEmptyFinancialMetrics(): FinancialMetrics {
    return {
        ebitdaMargin: null,
        debtEquityRatio: null,
        currentRatio: null,
        totalRevenue: null,
        netProfit: null,
        totalAssets: null,
        totalLiabilities: null,
        year: null,
        confidence: 'low',
        dataSource: 'unknown'
    };
}

/**
 * Calculates financial health score based on extracted metrics
 */
export function calculateFinancialHealthScore(metrics: FinancialMetrics): FinancialHealthScore {
    if (metrics.confidence === 'low') {
        return {
            score: 0,
            category: 'critical',
            factors: {
                profitability: 0,
                liquidity: 0,
                leverage: 0,
                efficiency: 0
            }
        };
    }

    // Calculate individual factor scores (0-100)
    const profitability = calculateProfitabilityScore(metrics);
    const liquidity = calculateLiquidityScore(metrics);
    const leverage = calculateLeverageScore(metrics);
    const efficiency = calculateEfficiencyScore(metrics);

    // Weighted average (profitability and leverage are more important)
    const score = Math.round(
        (profitability * 0.3) +
        (liquidity * 0.2) +
        (leverage * 0.3) +
        (efficiency * 0.2)
    );

    let category: FinancialHealthScore['category'];
    if (score >= 80) {
        category = 'excellent';
    } else if (score >= 65) {
        category = 'good';
    } else if (score >= 50) {
        category = 'fair';
    } else if (score >= 30) {
        category = 'poor';
    } else {
        category = 'critical';
    }

    return {
        score,
        category,
        factors: {
            profitability,
            liquidity,
            leverage,
            efficiency
        }
    };
}

/**
 * Calculates profitability score
 */
function calculateProfitabilityScore(metrics: FinancialMetrics): number {
    let score = 50; // Base score

    // EBITDA Margin scoring
    if (metrics.ebitdaMargin !== null) {
        if (metrics.ebitdaMargin >= 20) {
            score += 25;
        } else if (metrics.ebitdaMargin >= 15) {
            score += 20;
        } else if (metrics.ebitdaMargin >= 10) {
            score += 15;
        } else if (metrics.ebitdaMargin >= 5) {
            score += 10;
        } else if (metrics.ebitdaMargin >= 0) {
            score += 5;
        } else {
            score -= 20;
        }
    }

    // Net Profit Margin scoring (if we can calculate it)
    if (metrics.netProfit !== null && metrics.totalRevenue !== null && metrics.totalRevenue > 0) {
        const netProfitMargin = (metrics.netProfit / metrics.totalRevenue) * 100;
        if (netProfitMargin >= 10) {
            score += 25;
        } else if (netProfitMargin >= 5) {
            score += 15;
        } else if (netProfitMargin >= 0) {
            score += 5;
        } else {
            score -= 15;
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculates liquidity score
 */
function calculateLiquidityScore(metrics: FinancialMetrics): number {
    let score = 50; // Base score

    // Current Ratio scoring
    if (metrics.currentRatio !== null) {
        if (metrics.currentRatio >= 2.0) {
            score += 30;
        } else if (metrics.currentRatio >= 1.5) {
            score += 25;
        } else if (metrics.currentRatio >= 1.2) {
            score += 20;
        } else if (metrics.currentRatio >= 1.0) {
            score += 10;
        } else if (metrics.currentRatio >= 0.8) {
            score -= 10;
        } else {
            score -= 30;
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculates leverage score
 */
function calculateLeverageScore(metrics: FinancialMetrics): number {
    let score = 50; // Base score

    // Debt-Equity Ratio scoring (lower is better)
    if (metrics.debtEquityRatio !== null) {
        if (metrics.debtEquityRatio <= 0.3) {
            score += 30;
        } else if (metrics.debtEquityRatio <= 0.5) {
            score += 25;
        } else if (metrics.debtEquityRatio <= 1.0) {
            score += 15;
        } else if (metrics.debtEquityRatio <= 2.0) {
            score += 5;
        } else if (metrics.debtEquityRatio <= 3.0) {
            score -= 10;
        } else {
            score -= 30;
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Calculates efficiency score
 */
function calculateEfficiencyScore(metrics: FinancialMetrics): number {
    let score = 50; // Base score

    // Asset Turnover (Revenue/Assets) - if we can calculate it
    if (metrics.totalRevenue !== null && metrics.totalAssets !== null && metrics.totalAssets > 0) {
        const assetTurnover = metrics.totalRevenue / metrics.totalAssets;
        if (assetTurnover >= 1.5) {
            score += 25;
        } else if (assetTurnover >= 1.0) {
            score += 20;
        } else if (assetTurnover >= 0.7) {
            score += 15;
        } else if (assetTurnover >= 0.5) {
            score += 10;
        } else {
            score += 5;
        }
    }

    return Math.max(0, Math.min(100, score));
}

/**
 * Validates financial metrics data quality
 */
export function validateFinancialMetricsQuality(metrics: FinancialMetrics): {
    isValid: boolean;
    completeness: number; // 0-100
    reliability: 'high' | 'medium' | 'low';
    missingMetrics: string[];
} {
    const requiredMetrics = [
        'ebitdaMargin',
        'debtEquityRatio',
        'currentRatio',
        'totalRevenue',
        'netProfit',
        'totalAssets',
        'totalLiabilities'
    ] as const;

    const availableMetrics = requiredMetrics.filter(metric => metrics[metric] !== null);
    const missingMetrics = requiredMetrics.filter(metric => metrics[metric] === null);

    const completeness = Math.round((availableMetrics.length / requiredMetrics.length) * 100);

    let reliability: 'high' | 'medium' | 'low';
    if (metrics.confidence === 'high' && completeness >= 70) {
        reliability = 'high';
    } else if (metrics.confidence === 'medium' || completeness >= 50) {
        reliability = 'medium';
    } else {
        reliability = 'low';
    }

    return {
        isValid: availableMetrics.length >= 3, // At least 3 metrics required
        completeness,
        reliability,
        missingMetrics: missingMetrics.map(metric => metric.toString())
    };
}

/**
 * Gets financial metrics summary for display
 */
export function getFinancialMetricsSummary(metrics: FinancialMetrics): {
    displayMetrics: Array<{
        name: string;
        value: string;
        status: any;
    }>;
    healthScore: FinancialHealthScore;
    dataQuality: string;
} {
    const healthScore = calculateFinancialHealthScore(metrics);
    const quality = validateFinancialMetricsQuality(metrics);

    const displayMetrics = [
        {
            name: 'EBITDA Margin',
            value: metrics.ebitdaMargin !== null ? `${metrics.ebitdaMargin.toFixed(1)}%` : 'N/A',
            status: metrics.ebitdaMargin !== null ?
                (metrics.ebitdaMargin >= 15 ? 'good' : metrics.ebitdaMargin >= 5 ? 'warning' : 'poor') : 'unknown' as const
        },
        {
            name: 'Current Ratio',
            value: metrics.currentRatio !== null ? metrics.currentRatio.toFixed(2) : 'N/A',
            status: metrics.currentRatio !== null ?
                (metrics.currentRatio >= 1.5 ? 'good' : metrics.currentRatio >= 1.0 ? 'warning' : 'poor') : 'unknown' as const
        },
        {
            name: 'Debt-Equity Ratio',
            value: metrics.debtEquityRatio !== null ? metrics.debtEquityRatio.toFixed(2) : 'N/A',
            status: metrics.debtEquityRatio !== null ?
                (metrics.debtEquityRatio <= 0.5 ? 'good' : metrics.debtEquityRatio <= 1.0 ? 'warning' : 'poor') : 'unknown' as const
        },
        {
            name: 'Total Revenue',
            value: metrics.totalRevenue !== null ? formatCurrency(metrics.totalRevenue) : 'N/A',
            status: 'unknown' as const
        }
    ];

    let dataQuality: string;
    if (quality.reliability === 'high') {
        dataQuality = `High quality (${quality.completeness}% complete)`;
    } else if (quality.reliability === 'medium') {
        dataQuality = `Medium quality (${quality.completeness}% complete)`;
    } else {
        dataQuality = `Low quality (${quality.completeness}% complete)`;
    }

    return {
        displayMetrics,
        healthScore,
        dataQuality
    };
}

/**
 * Formats currency values for display
 */
function formatCurrency(value: number): string {
    if (value >= 1e9) {
        return `₹${(value / 1e9).toFixed(1)}B`;
    } else if (value >= 1e7) {
        return `₹${(value / 1e7).toFixed(1)}Cr`;
    } else if (value >= 1e5) {
        return `₹${(value / 1e5).toFixed(1)}L`;
    } else if (value >= 1e3) {
        return `₹${(value / 1e3).toFixed(1)}K`;
    } else {
        return `₹${value.toFixed(0)}`;
    }
}