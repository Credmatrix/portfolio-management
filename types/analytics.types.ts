// ============================================================================
// ANALYTICS AND VISUALIZATION TYPES
// ============================================================================

export interface RiskDistributionData {
    cm1: number
    cm2: number
    cm3: number
    cm4: number
    cm5: number
    ungraded: number
    total: number
}

export interface RatingDistributionData {
    AAA: number;
    AA: number;
    A: number;
    BBB: number;
    BB: number;
    B: number;
    C: number;
    D: number;
    'Not Rated': number;
    total: number;
}

export interface RiskScoreHeatmapData {
    companies: Array<{
        id: string
        name: string
        riskScore: number
        riskGrade: string
        industry: string
        x: number // Position for visualization
        y: number // Position for visualization
    }>
    maxRiskScore: number
    minRiskScore: number
}

export interface ParameterScoreRadarData {
    companyId: string
    companyName: string
    parameters: Array<{
        category: string
        score: number
        maxScore: number
        percentage: number
        benchmark: string
    }>
    overallScore: number
}

export interface IndustryBreakdownData {
    industries: Array<{
        name: string
        count: number
        totalExposure: number
        averageRiskScore: number
        riskDistribution: {
            cm1: number
            cm2: number
            cm3: number
            cm4: number
            cm5: number
        }
        color: string
    }>
}

export interface EligibilityMatrixData {
    total_eligible_amount: number;
    average_eligibility: number;
    eligibility_by_grade: Record<string, number>;
    eligibility_by_industry: Record<string, number>;
    companies_with_eligibility: number;
    total_companies: number;
}

export interface BenchmarkComparisonData {
    companyId: string
    companyName: string
    parameters: Array<{
        name: string
        companyScore: number
        industryMedian: number
        industryBest: number
        benchmark: 'Excellent' | 'Good' | 'Average' | 'Poor' | 'Critical Risk'
        category: 'Financial' | 'Business' | 'Hygiene' | 'Banking'
    }>
}

export interface ComplianceHeatmapData {
    companies: Array<{
        id: string
        name: string
        gstCompliance: {
            status: 'Compliant' | 'Non-Compliant' | 'Unknown'
            score: number
            filingRegularity: number
        }
        epfoCompliance: {
            status: 'Compliant' | 'Non-Compliant' | 'Unknown'
            score: number
            paymentRegularity: number
        }
        overallComplianceScore: number
        riskGrade: string
    }>
}

export interface ChartColors {
    cm1: string
    cm2: string
    cm3: string
    cm4: string
    cm5: string
    ungraded: string
    excellent: string
    good: string
    average: string
    poor: string
    critical: string
}

export interface ChartDimensions {
    width: number
    height: number
    margin: {
        top: number
        right: number
        bottom: number
        left: number
    }
}

export interface TooltipData {
    x: number
    y: number
    content: string | React.ReactNode
    visible: boolean
}