import {
    RiskScoreHeatmapData,
    IndustryBreakdownData,
    ParameterScoreRadarData,
    BenchmarkComparisonData,
    ComplianceHeatmapData,
    EligibilityMatrixData,
    RiskDistributionData
} from '@/types/analytics.types';

// Transform API overview response to PortfolioMetrics
export interface PortfolioMetrics {
    totalCompanies: number;
    totalExposure: number;
    averageRiskScore: number;
    riskDistribution: RiskDistributionData;
    topPerformers: number;
    highRiskCompanies: number;
}

// Risk grade mapping - map your actual grades to display categories
const riskGradeMapping: Record<string, string> = {
    'CM1': 'CM1',  // Best grade maps to CM1
    'CM2': 'CM2',  // Second best maps to CM2  
    'CM3': 'CM3',  // Average maps to CM3
    'CM4': 'CM4',  // Poor maps to CM4
    'HCA2': 'CM2', // High risk grades map to CM5
    'HCB3': 'CM3',
    'HCB4': 'CM4',
    'HCB5': 'CM5',
    'CM5': 'CM5',
    'CM6': 'CM6',
};

// Get risk category for scoring
const getRiskCategory = (grade: string): 'low' | 'medium' | 'high' => {
    if (grade === 'CM7' || grade === 'CM6') return 'low';
    if (grade === 'CM5' || grade === 'CM4') return 'medium';
    return 'high';
};

export const transformOverviewData = (apiData: any): PortfolioMetrics => {

    // Calculate risk distribution from grade analysis
    const riskDistribution = {
        cm1: 0,
        cm2: 0,
        cm3: 0,
        cm4: 0,
        cm5: 0,
        ungraded: 0,
        total: 0
    };

    let topPerformers = apiData.topPerformers || 0;
    let highRiskCompanies = apiData.highRiskCompanies || 0;
    let averageRiskScore = apiData.averageRiskScore || 0;
    let totalCompanies = apiData.totalCompanies || 0;
    let totalExposure = apiData.totalExposure;

    return {
        totalCompanies,
        totalExposure,
        averageRiskScore,
        riskDistribution,
        topPerformers,
        highRiskCompanies
    };
};


// Transform API risk-distribution response to RiskScoreHeatmapData
export const transformRiskDistributionData = (apiData: any): RiskScoreHeatmapData => {
    const companies: Array<{
        id: string;
        name: string;
        riskScore: number;
        riskGrade: string;
        industry: string;
        x: number;
        y: number;
    }> = [];

    if (apiData.grade_analysis) {
        let companyIndex = 0;
        Object.entries(apiData.grade_analysis).forEach(([grade, analysis]: [string, any]) => {
            const count = analysis.count || 0;
            const avgRiskScore = analysis.avg_risk_score || 0;
            const topIndustry = analysis.top_industries?.[0]?.industry || 'Unknown';

            for (let i = 0; i < count; i++) {
                const variance = Math.random() * 10 - 5; // Add some variance around average
                companies.push({
                    id: `company-${companyIndex}`,
                    name: `Company ${companyIndex + 1}`,
                    riskScore: Math.max(0, Math.min(100, avgRiskScore + variance)),
                    riskGrade: riskGradeMapping[grade] || grade, // Use mapped grade for display
                    industry: topIndustry,
                    x: Math.random() * 100,
                    y: Math.random() * 100
                });
                companyIndex++;
            }
        });
    }

    return {
        companies,
        maxRiskScore: 100,
        minRiskScore: 0
    };
};

// Transform API industry-breakdown response to IndustryBreakdownData
export const transformIndustryBreakdownData = (apiData: any): IndustryBreakdownData => {
    const industryColors = [
        '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
        '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#6B7280'
    ];

    const industries = apiData.industry_breakdown?.industries?.map((industry: any, index: number) => {
        // Transform risk distribution to expected format
        const riskDistribution = {
            cm1: 0,
            cm2: 0,
            cm3: 0,
            cm4: 0,
            cm5: 0
        };

        // Map actual grades to display grades
        Object.entries(industry.risk_distribution || {}).forEach(([grade, count]: [string, any]) => {
            const mappedGrade = riskGradeMapping[grade.toUpperCase()];
            if (mappedGrade === 'CM1') riskDistribution.cm1 += count;
            else if (mappedGrade === 'CM2') riskDistribution.cm2 += count;
            else if (mappedGrade === 'CM3') riskDistribution.cm3 += count;
            else if (mappedGrade === 'CM4') riskDistribution.cm4 += count;
            else if (mappedGrade === 'CM5') riskDistribution.cm5 += count;
        });

        return {
            name: industry.name,
            count: industry.count,
            totalExposure: industry.total_exposure * 10000000, // Convert to actual value from crores
            averageRiskScore: industry.average_risk_score,
            riskDistribution,
            color: industryColors[index % industryColors.length]
        };
    }) || [];

    return { industries };
};


// Transform API model-performance response to ModelPerformanceMetrics
export interface ModelPerformanceMetrics {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    totalPredictions: number;
    correctPredictions: number;
    lastUpdated: string;
    modelVersion: string;
    validationResults: {
        truePositives: number;
        trueNegatives: number;
        falsePositives: number;
        falseNegatives: number;
    };
    performanceTrends: Array<{
        date: string;
        accuracy: number;
        precision: number;
        recall: number;
        f1Score: number;
    }>;
    industryPerformance: Array<{
        industry: string;
        accuracy: number;
        sampleSize: number;
        confidence: number;
    }>;
    riskGradeAccuracy: Array<{
        grade: string;
        accuracy: number;
        sampleSize: number;
        predictedCorrectly: number;
    }>;
}

export const transformModelPerformanceData = (apiData: any): ModelPerformanceMetrics => {
    const modelPerformance = apiData.model_performance || {};
    const gradeDistribution = modelPerformance.grade_distribution || {};

    // Calculate mock metrics from available data
    const totalCompanies = Object.values(gradeDistribution).reduce((sum: number, grade: any) => sum + (grade.count || 0), 0);
    const accuracy = modelPerformance.overall_accuracy || 85;

    return {
        accuracy,
        precision: accuracy * 0.95, // Mock precision
        recall: accuracy * 0.92, // Mock recall
        f1Score: accuracy * 0.93, // Mock F1 score
        auc: accuracy * 0.01, // Mock AUC
        totalPredictions: totalCompanies,
        correctPredictions: Math.round(totalCompanies * (accuracy / 100)),
        lastUpdated: new Date().toISOString(),
        modelVersion: '2.1.0',
        validationResults: {
            truePositives: Math.round(totalCompanies * 0.4),
            trueNegatives: Math.round(totalCompanies * 0.45),
            falsePositives: Math.round(totalCompanies * 0.08),
            falseNegatives: Math.round(totalCompanies * 0.07)
        },
        performanceTrends: [
            { date: '2024-01-01', accuracy: 82, precision: 80, recall: 78, f1Score: 79 },
            { date: '2024-02-01', accuracy: 84, precision: 82, recall: 80, f1Score: 81 },
            { date: '2024-03-01', accuracy: accuracy, precision: accuracy * 0.95, recall: accuracy * 0.92, f1Score: accuracy * 0.93 }
        ],
        industryPerformance: [
            { industry: 'Manufacturing', accuracy: 88, sampleSize: 50, confidence: 0.95 },
            { industry: 'Services', accuracy: 85, sampleSize: 30, confidence: 0.92 },
            { industry: 'Trading', accuracy: 82, sampleSize: 25, confidence: 0.89 }
        ],
        riskGradeAccuracy: Object.entries(gradeDistribution).map(([grade, data]: [string, any]) => ({
            grade,
            accuracy: 85 + Math.random() * 10,
            sampleSize: data.count || 0,
            predictedCorrectly: Math.round((data.count || 0) * 0.85)
        }))
    };
};

// Mock data generators for development
export const generateMockParameterRadarData = (companyId: string): ParameterScoreRadarData => {
    return {
        companyId,
        companyName: `Company ${companyId}`,
        parameters: [
            { category: 'Financial', score: 75, maxScore: 100, percentage: 75, benchmark: 'Good' },
            { category: 'Business', score: 82, maxScore: 100, percentage: 82, benchmark: 'Good' },
            { category: 'Hygiene', score: 65, maxScore: 100, percentage: 65, benchmark: 'Average' },
            { category: 'Banking', score: 70, maxScore: 100, percentage: 70, benchmark: 'Average' }
        ],
        overallScore: 73
    };
};

export const generateMockBenchmarkData = (companyId: string): BenchmarkComparisonData => {
    return {
        companyId,
        companyName: `Company ${companyId}`,
        parameters: [
            {
                name: 'Revenue Growth',
                companyScore: 15.5,
                industryMedian: 12.0,
                industryBest: 25.0,
                benchmark: 'Good',
                category: 'Financial'
            },
            {
                name: 'Profit Margin',
                companyScore: 8.2,
                industryMedian: 10.5,
                industryBest: 18.0,
                benchmark: 'Average',
                category: 'Financial'
            },
            {
                name: 'Market Position',
                companyScore: 7.5,
                industryMedian: 6.8,
                industryBest: 9.2,
                benchmark: 'Good',
                category: 'Business'
            }
        ]
    };
};

// Error handling utility
export const handleAPIError = (error: unknown): string => {
    if (error instanceof Error) {
        return error.message;
    }
    return 'An unexpected error occurred';
};

// API fetch utility with error handling
export const fetchWithErrorHandling = async <T>(url: string): Promise<T | null> => {
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        return result.success ? result.data : null;
    } catch (error) {
        console.error('API Error:', error);
        return null;
    }
};