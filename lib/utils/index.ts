// Re-export all utilities from the main utils file
export * from '../utils'

// ============================================================================
// PORTFOLIO-SPECIFIC UTILITY FUNCTIONS
// ============================================================================

import type {
    PortfolioCompany,
    FilterCriteria,
    RiskDistribution,
    IndustryBreakdown,
    RegionalDistribution,
    ParameterScore,
    CategoryResult,
    PortfolioMetrics,
    EligibilityAssessment,
    ComplianceSummary,
    OverallGrade
} from '../../types/portfolio.types'

import { getRiskMultiplier, formatCurrencyCompact, formatDate, getRiskColor, getRiskGradeDescription, validateCompanyData } from '../utils'

// ============================================================================
// PORTFOLIO FILTERING AND SORTING
// ============================================================================

export function filterPortfolioCompanies(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    return companies.filter(company => {
        // Risk grade filter
        if (filters.risk_grades && filters.risk_grades.length > 0) {
            if (!company.risk_grade || !filters.risk_grades.includes(company.risk_grade)) {
                return false
            }
        }

        // Risk score range filter
        if (filters.risk_score_range && company.risk_score !== null) {
            const [min, max] = filters.risk_score_range
            if (company.risk_score < min || company.risk_score > max) {
                return false
            }
        }

        // Industry filter
        if (filters.industries && filters.industries.length > 0) {
            if (!filters.industries.includes(company.industry)) {
                return false
            }
        }

        // Processing status filter
        if (filters.processing_status && filters.processing_status.length > 0) {
            if (!company.status || !filters.processing_status.includes(company.status)) {
                return false
            }
        }

        // Recommended limit range filter
        if (filters.recommended_limit_range && company.recommended_limit !== null) {
            const [min, max] = filters.recommended_limit_range
            if (company.recommended_limit < min || company.recommended_limit > max) {
                return false
            }
        }

        // Search query filter
        if (filters.search_query && filters.search_query.trim() !== '') {
            const query = filters.search_query.toLowerCase()
            const searchableText = [
                company.company_name,
                company.industry,
                company.risk_grade,
                company.original_filename
            ].filter(Boolean).join(' ').toLowerCase()

            if (!searchableText.includes(query)) {
                return false
            }
        }

        return true
    })
}

export function sortPortfolioCompanies(
    companies: PortfolioCompany[],
    sortField: string,
    sortDirection: 'asc' | 'desc' = 'asc'
): PortfolioCompany[] {
    return [...companies].sort((a, b) => {
        let aValue: any
        let bValue: any

        switch (sortField) {
            case 'company_name':
                aValue = a.company_name || ''
                bValue = b.company_name || ''
                break
            case 'risk_score':
                aValue = a.risk_score || 0
                bValue = b.risk_score || 0
                break
            case 'recommended_limit':
                aValue = a.recommended_limit || 0
                bValue = b.recommended_limit || 0
                break
            case 'submitted_at':
                aValue = new Date(a.submitted_at || 0)
                bValue = new Date(b.submitted_at || 0)
                break
            case 'industry':
                aValue = a.industry || ''
                bValue = b.industry || ''
                break
            default:
                return 0
        }

        if (typeof aValue === 'string') {
            const comparison = aValue.localeCompare(bValue)
            return sortDirection === 'asc' ? comparison : -comparison
        }

        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
        return 0
    })
}

// ============================================================================
// PORTFOLIO ANALYTICS CALCULATIONS
// ============================================================================

export function calculateRiskDistribution(companies: PortfolioCompany[]): RiskDistribution {
    const distribution = {
        cm1_count: 0,
        cm2_count: 0,
        cm3_count: 0,
        cm4_count: 0,
        cm5_count: 0,
        ungraded_count: 0,
        total_count: companies.length,
        distribution_percentages: {} as Record<string, number>
    }

    companies.forEach(company => {
        if (!company.risk_grade) {
            distribution.ungraded_count++
            return
        }

        switch (company.risk_grade) {
            case 'CM1':
                distribution.cm1_count++
                break
            case 'CM2':
                distribution.cm2_count++
                break
            case 'CM3':
                distribution.cm3_count++
                break
            case 'CM4':
                distribution.cm4_count++
                break
            case 'CM5':
                distribution.cm5_count++
                break
            default:
                distribution.ungraded_count++
        }
    })

    // Calculate percentages
    const total = distribution.total_count
    if (total > 0) {
        distribution.distribution_percentages = {
            CM1: (distribution.cm1_count / total) * 100,
            CM2: (distribution.cm2_count / total) * 100,
            CM3: (distribution.cm3_count / total) * 100,
            CM4: (distribution.cm4_count / total) * 100,
            CM5: (distribution.cm5_count / total) * 100,
            Ungraded: (distribution.ungraded_count / total) * 100
        }
    }

    return distribution
}

export function calculateIndustryBreakdown(companies: PortfolioCompany[]): IndustryBreakdown {
    const industryMap = new Map<string, {
        count: number
        total_exposure: number
        risk_scores: number[]
    }>()

    companies.forEach(company => {
        const industry = company.industry || 'Unknown'
        const exposure = company.recommended_limit || 0
        const riskScore = company.risk_score || 0

        if (!industryMap.has(industry)) {
            industryMap.set(industry, {
                count: 0,
                total_exposure: 0,
                risk_scores: []
            })
        }

        const industryData = industryMap.get(industry)!
        industryData.count++
        industryData.total_exposure += exposure
        if (riskScore > 0) {
            industryData.risk_scores.push(riskScore)
        }
    })

    const industries = Array.from(industryMap.entries()).map(([name, data]) => {
        const averageRiskScore = data.risk_scores.length > 0
            ? data.risk_scores.reduce((sum, score) => sum + score, 0) / data.risk_scores.length
            : 0

        // Calculate risk distribution for this industry
        const industryCompanies = companies.filter(c => (c.industry || 'Unknown') === name)
        const riskDist = calculateRiskDistribution(industryCompanies)

        return {
            name,
            count: data.count,
            total_exposure: data.total_exposure,
            average_risk_score: averageRiskScore,
            risk_distribution: riskDist.distribution_percentages
        }
    })

    return { industries }
}

export function calculatePortfolioMetrics(companies: PortfolioCompany[]) {
    const totalCompanies = companies.length
    const totalExposure = companies.reduce((sum, company) =>
        sum + (company.recommended_limit || 0), 0
    )

    const riskScores = companies
        .map(c => c.risk_score)
        .filter((score): score is number => score !== null && score > 0)

    const averageRiskScore = riskScores.length > 0
        ? riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length
        : 0

    return {
        total_companies: totalCompanies,
        total_exposure: totalExposure,
        average_risk_score: averageRiskScore,
        risk_distribution: calculateRiskDistribution(companies),
        industry_breakdown: calculateIndustryBreakdown(companies)
    }
}

// ============================================================================
// PARAMETER SCORE ANALYSIS
// ============================================================================

export function analyzeParameterScores(scores: ParameterScore[]): {
    excellent: number
    good: number
    average: number
    poor: number
    critical: number
} {
    const analysis = {
        excellent: 0,
        good: 0,
        average: 0,
        poor: 0,
        critical: 0
    }

    scores.forEach(score => {
        switch (score.benchmark.toLowerCase()) {
            case 'excellent':
                analysis.excellent++
                break
            case 'good':
                analysis.good++
                break
            case 'average':
                analysis.average++
                break
            case 'poor':
                analysis.poor++
                break
            case 'critical risk':
                analysis.critical++
                break
        }
    })

    return analysis
}

export function calculateCategoryPerformance(categoryResult: CategoryResult): {
    performance_percentage: number
    grade: string
    status: 'excellent' | 'good' | 'average' | 'poor' | 'critical'
} {
    const percentage = categoryResult.percentage

    let grade: string
    let status: 'excellent' | 'good' | 'average' | 'poor' | 'critical'

    if (percentage >= 90) {
        grade = 'A+'
        status = 'excellent'
    } else if (percentage >= 80) {
        grade = 'A'
        status = 'good'
    } else if (percentage >= 70) {
        grade = 'B'
        status = 'average'
    } else if (percentage >= 60) {
        grade = 'C'
        status = 'poor'
    } else {
        grade = 'D'
        status = 'critical'
    }

    return {
        performance_percentage: percentage,
        grade,
        status
    }
}

// ============================================================================
// SEARCH AND MATCHING UTILITIES
// ============================================================================

export function searchCompanies(
    companies: PortfolioCompany[],
    query: string,
    searchFields: string[] = ['company_name', 'industry', 'risk_grade']
): PortfolioCompany[] {
    if (!query.trim()) return companies

    const searchTerm = query.toLowerCase().trim()

    return companies.filter(company => {
        return searchFields.some(field => {
            const value = getNestedValue(company, field)
            return value && value.toString().toLowerCase().includes(searchTerm)
        })
    })
}

function getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj)
}

export function fuzzyMatch(text: string, query: string, threshold: number = 0.6): boolean {
    if (!text || !query) return false

    const textLower = text.toLowerCase()
    const queryLower = query.toLowerCase()

    // Exact match
    if (textLower.includes(queryLower)) return true

    // Simple fuzzy matching based on character overlap
    const textChars = new Set(textLower.split(''))
    const queryChars = new Set(queryLower.split(''))

    const intersection = new Set([...textChars].filter(char => queryChars.has(char)))
    const similarity = intersection.size / Math.max(textChars.size, queryChars.size)

    return similarity >= threshold
}

// ============================================================================
// DATA TRANSFORMATION UTILITIES
// ============================================================================

export function transformCompanyForDisplay(company: PortfolioCompany) {
    return {
        id: company.id,
        request_id: company.request_id,
        company_name: company.company_name || 'Unknown Company',
        industry: company.industry || 'Unknown',
        risk_score: company.risk_score || 0,
        risk_grade: company.risk_grade || 'Ungraded',
        recommended_limit: company.recommended_limit || 0,
        status: company.status || 'unknown',
        submitted_at: company.submitted_at,
        risk_color: getRiskColor(company.risk_grade || ''),
        risk_description: getRiskGradeDescription(company.risk_grade || ''),
        formatted_limit: formatCurrencyCompact(company.recommended_limit || 0),
        formatted_date: company.submitted_at ? formatDate(company.submitted_at) : 'Unknown'
    }
}

export function extractFinancialSummary(company: PortfolioCompany) {
    const financialData = company.extracted_data["Standalone Financial Data"]
    if (!financialData) return null

    const latestYear = financialData.years?.[financialData.years.length - 1]
    if (!latestYear) return null

    return {
        year: latestYear,
        revenue: financialData.profit_loss?.revenue?.[latestYear] || 0,
        ebitda: financialData.profit_loss?.ebitda?.[latestYear] || 0,
        pat: financialData.profit_loss?.pat?.[latestYear] || 0,
        total_assets: financialData.balance_sheet?.assets?.total_assets?.[latestYear] || 0,
        current_ratio: financialData.ratios?.liquidity?.current_ratio?.[latestYear] || 0,
        debt_equity: financialData.ratios?.leverage?.debt_equity?.[latestYear] || 0
    }
}

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

export function validatePortfolioData(companies: PortfolioCompany[]): {
    valid: PortfolioCompany[]
    invalid: Array<{ company: PortfolioCompany; errors: string[] }>
} {
    const valid: PortfolioCompany[] = []
    const invalid: Array<{ company: PortfolioCompany; errors: string[] }> = []

    companies.forEach(company => {
        const validation = validateCompanyData(company)
        if (validation.isValid) {
            valid.push(company)
        } else {
            invalid.push({ company, errors: validation.errors })
        }
    })

    return { valid, invalid }
}

// ============================================================================
// ADVANCED RISK CALCULATION AND SCORING UTILITIES
// ============================================================================

export function calculateOverallRiskGrade(
    totalWeightedScore: number,
    totalMaxScore: number,
    industryModel: string = 'default'
): OverallGrade {
    const percentage = totalMaxScore > 0 ? (totalWeightedScore / totalMaxScore) * 100 : 0

    let grade: string
    let category: number
    let multiplier: number
    let color: string
    let description: string

    if (percentage >= 85) {
        grade = 'CM1'
        category = 1
        multiplier = 1.0
        color = '#10B981' // Green
        description = 'Excellent Credit Quality'
    } else if (percentage >= 70) {
        grade = 'CM2'
        category = 2
        multiplier = 0.9
        color = '#3B82F6' // Blue
        description = 'Good Credit Quality'
    } else if (percentage >= 55) {
        grade = 'CM3'
        category = 3
        multiplier = 0.8
        color = '#F59E0B' // Yellow
        description = 'Average Credit Quality'
    } else if (percentage >= 40) {
        grade = 'CM4'
        category = 4
        multiplier = 0.6
        color = '#F97316' // Orange
        description = 'Poor Credit Quality'
    } else {
        grade = 'CM5'
        category = 5
        multiplier = 0.4
        color = '#EF4444' // Red
        description = 'Critical Risk'
    }

    return {
        grade,
        category,
        multiplier,
        color,
        description
    }
}

export function calculateCreditEligibility(
    turnoverCr: number,
    netWorthCr: number,
    riskGrade: string,
    existingExposure: number = 0
): EligibilityAssessment {
    // Base eligibility calculation (typically 10-15% of turnover or 25% of net worth)
    const turnoverBasedEligibility = turnoverCr * 0.12 // 12% of turnover
    const netWorthBasedEligibility = netWorthCr * 0.25 // 25% of net worth

    const baseEligibility = Math.min(turnoverBasedEligibility, netWorthBasedEligibility)

    // Get risk multiplier based on grade
    const riskMultiplier = getRiskMultiplier(riskGrade)

    // Calculate final eligibility
    const finalEligibility = baseEligibility * riskMultiplier
    const incrementalEligibility = Math.max(0, finalEligibility - existingExposure)

    return {
        turnoverCr,
        netWorthCr,
        baseEligibility,
        riskScore: 0, // Will be calculated separately
        riskGrade,
        riskMultiplier,
        finalEligibility,
        existingExposure,
        incrementalEligibility
    }
}

export function calculateParameterBenchmark(
    score: number,
    maxScore: number,
    parameter: string
): string {
    const percentage = maxScore > 0 ? (score / maxScore) * 100 : 0

    // Industry-specific benchmarks can be added here
    if (percentage >= 90) return 'Excellent'
    if (percentage >= 75) return 'Good'
    if (percentage >= 60) return 'Average'
    if (percentage >= 40) return 'Poor'
    return 'Critical Risk'
}

export function calculateRiskTrend(
    currentScore: number,
    previousScore: number
): { trend: 'improving' | 'stable' | 'deteriorating'; change: number } {
    const change = currentScore - previousScore
    const changePercentage = Math.abs(change / previousScore) * 100

    let trend: 'improving' | 'stable' | 'deteriorating'

    if (changePercentage < 5) {
        trend = 'stable'
    } else if (change > 0) {
        trend = 'improving'
    } else {
        trend = 'deteriorating'
    }

    return { trend, change }
}

// ============================================================================
// ENHANCED FINANCIAL DATA FORMATTING AND CALCULATIONS
// ============================================================================

export function formatIndianCurrency(
    amount: number,
    options: {
        compact?: boolean
        showDecimals?: boolean
        currency?: string
    } = {}
): string {
    const { compact = false, showDecimals = true, currency = 'INR' } = options

    if (compact) {
        if (amount >= 10000000) { // 1 Crore
            return `₹${(amount / 10000000).toFixed(showDecimals ? 2 : 0)} Cr`
        } else if (amount >= 100000) { // 1 Lakh
            return `₹${(amount / 100000).toFixed(showDecimals ? 2 : 0)} L`
        } else if (amount >= 1000) { // 1 Thousand
            return `₹${(amount / 1000).toFixed(showDecimals ? 1 : 0)}K`
        }
    }

    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency,
        minimumFractionDigits: showDecimals ? 2 : 0,
        maximumFractionDigits: showDecimals ? 2 : 0
    }).format(amount)
}

export function calculateFinancialHealthScore(company: PortfolioCompany): {
    score: number
    factors: Array<{ name: string; score: number; weight: number }>
} {
    const factors: any[] = []
    let totalScore = 0
    let totalWeight = 0

    const financialData = company.extracted_data["Standalone Financial Data"]
    if (!financialData) {
        return { score: 0, factors: [] }
    }

    // Current Ratio (Weight: 20%)
    const currentRatio = financialData.ratios?.liquidity?.current_ratio
    if (currentRatio) {
        const latestYear = Object.keys(currentRatio)[0]
        const ratio = currentRatio[latestYear]
        let score = 0
        if (ratio >= 2) score = 100
        else if (ratio >= 1.5) score = 80
        else if (ratio >= 1.2) score = 60
        else if (ratio >= 1) score = 40
        else score = 20

        factors.push({ name: 'Current Ratio', score, weight: 20 })
        totalScore += score * 0.2
        totalWeight += 20
    }

    // Debt-to-Equity Ratio (Weight: 25%)
    const debtEquity = financialData.ratios?.leverage?.debt_equity
    if (debtEquity) {
        const latestYear = Object.keys(debtEquity)[0]
        const ratio = debtEquity[latestYear]
        let score = 0
        if (ratio <= 0.3) score = 100
        else if (ratio <= 0.5) score = 80
        else if (ratio <= 0.8) score = 60
        else if (ratio <= 1.2) score = 40
        else score = 20

        factors.push({ name: 'Debt-to-Equity', score, weight: 25 })
        totalScore += score * 0.25
        totalWeight += 25
    }

    // Profitability (Weight: 30%)
    const netMargin = financialData.ratios?.profitability?.net_margin
    if (netMargin) {
        const latestYear = Object.keys(netMargin)[0]
        const margin = netMargin[latestYear]
        let score = 0
        if (margin >= 15) score = 100
        else if (margin >= 10) score = 80
        else if (margin >= 5) score = 60
        else if (margin >= 2) score = 40
        else score = 20

        factors.push({ name: 'Net Margin', score, weight: 30 })
        totalScore += score * 0.3
        totalWeight += 30
    }

    // Interest Coverage (Weight: 25%)
    const interestCoverage = financialData.ratios?.leverage?.interest_coverage
    if (interestCoverage) {
        const latestYear = Object.keys(interestCoverage)[0]
        const coverage = interestCoverage[latestYear]
        let score = 0
        if (coverage >= 10) score = 100
        else if (coverage >= 5) score = 80
        else if (coverage >= 2.5) score = 60
        else if (coverage >= 1.5) score = 40
        else score = 20

        factors.push({ name: 'Interest Coverage', score, weight: 25 })
        totalScore += score * 0.25
        totalWeight += 25
    }

    const finalScore = totalWeight > 0 ? (totalScore / totalWeight) * 100 : 0

    return { score: Math.round(finalScore), factors }
}

export function calculateComplianceScore(company: PortfolioCompany): {
    score: number
    gstScore: number
    epfoScore: number
    auditScore: number
} {
    let gstScore = 0
    let epfoScore = 0
    let auditScore = 0

    // GST Compliance Score
    const gstRecords = company.extracted_data?.gst_records
    if (gstRecords) {
        const activeGSTINs = gstRecords.active_gstins?.length || 0
        const cancelledGSTINs = gstRecords.cancelled_gstins?.length || 0
        const totalGSTINs = activeGSTINs + cancelledGSTINs

        if (totalGSTINs > 0) {
            const activeRatio = activeGSTINs / totalGSTINs
            gstScore = activeRatio * 100
        }
    }

    // EPFO Compliance Score
    const epfoRecords = company.extracted_data?.epfo_records
    if (epfoRecords) {
        const establishments = epfoRecords.establishments?.length || 0
        if (establishments > 0) {
            // Assume compliance based on establishment count and employee data
            epfoScore = Math.min(100, establishments * 25)
        }
    }

    // Audit Score
    const auditQualifications = company.extracted_data?.audit_qualifications
    if (auditQualifications) {
        const qualifiedCount = auditQualifications.filter(q =>
            q.qualification_type === 'Unqualified'
        ).length
        const totalAudits = auditQualifications.length

        if (totalAudits > 0) {
            auditScore = (qualifiedCount / totalAudits) * 100
        }
    }

    const overallScore = (gstScore + epfoScore + auditScore) / 3

    return {
        score: Math.round(overallScore),
        gstScore: Math.round(gstScore),
        epfoScore: Math.round(epfoScore),
        auditScore: Math.round(auditScore)
    }
}

// ============================================================================
// ENHANCED DATE AND NUMBER FORMATTING FOR INDIAN MARKET
// ============================================================================

export function formatIndianDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    }).format(new Date(date))
}

export function formatFinancialYear(date: string | Date): string {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = d.getMonth() + 1

    if (month >= 4) {
        return `FY ${year}-${(year + 1).toString().slice(-2)}`
    } else {
        return `FY ${year - 1}-${year.toString().slice(-2)}`
    }
}

export function formatBusinessAge(incorporationDate: string): string {
    const incDate = new Date(incorporationDate)
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - incDate.getTime())
    const diffYears = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25))
    const diffMonths = Math.floor((diffTime % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44))

    if (diffYears > 0) {
        return `${diffYears} year${diffYears > 1 ? 's' : ''} ${diffMonths > 0 ? `${diffMonths} month${diffMonths > 1 ? 's' : ''}` : ''}`
    } else {
        return `${diffMonths} month${diffMonths > 1 ? 's' : ''}`
    }
}

export function formatIndianPhoneNumber(phone: string): string {
    // Remove all non-digits
    const digits = phone.replace(/\D/g, '')

    // Handle different formats
    if (digits.length === 10) {
        return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`
    } else if (digits.length === 12 && digits.startsWith('91')) {
        return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`
    }

    return phone // Return original if format not recognized
}

// ============================================================================
// ENHANCED PORTFOLIO DATA VALIDATION HELPERS
// ============================================================================

export function validatePortfolioCompany(company: Partial<PortfolioCompany>): {
    isValid: boolean
    errors: string[]
    warnings: string[]
} {
    const errors: string[] = []
    const warnings: string[] = []

    // Required fields validation
    if (!company.company_name?.trim()) {
        errors.push('Company name is required')
    }

    if (!company.request_id?.trim()) {
        errors.push('Request ID is required')
    }

    if (!company.industry?.trim()) {
        warnings.push('Industry classification is missing')
    }

    // Risk score validation
    if (company.risk_score !== null && company.risk_score !== undefined) {
        if (company.risk_score < 0 || company.risk_score > 100) {
            errors.push('Risk score must be between 0 and 100')
        }
    }

    // Recommended limit validation
    if (company.recommended_limit !== null && company.recommended_limit !== undefined) {
        if (company.recommended_limit < 0) {
            errors.push('Recommended limit cannot be negative')
        }
    }

    // File validation
    if (company.file_size !== null && company.file_size !== undefined) {
        if (company.file_size <= 0) {
            errors.push('File size must be positive')
        }
        if (company.file_size > 50 * 1024 * 1024) { // 50MB limit
            warnings.push('File size is very large (>50MB)')
        }
    }

    // Status validation
    if (company.status && !['submitted', 'processing', 'completed', 'failed'].includes(company.status)) {
        errors.push('Invalid processing status')
    }

    // Date validation
    if (company.submitted_at) {
        const submittedDate = new Date(company.submitted_at)
        if (isNaN(submittedDate.getTime())) {
            errors.push('Invalid submission date')
        }
    }

    return {
        isValid: errors.length === 0,
        errors,
        warnings
    }
}

export function validateGSTIN(gstin: string): { isValid: boolean; error?: string } {
    if (!gstin) return { isValid: false, error: 'GSTIN is required' }

    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/

    if (!gstinRegex.test(gstin)) {
        return { isValid: false, error: 'Invalid GSTIN format' }
    }

    // Additional checksum validation can be added here
    return { isValid: true }
}

export function validatePAN(pan: string): { isValid: boolean; error?: string } {
    if (!pan) return { isValid: false, error: 'PAN is required' }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/

    if (!panRegex.test(pan)) {
        return { isValid: false, error: 'Invalid PAN format' }
    }

    return { isValid: true }
}

export function validateCIN(cin: string): { isValid: boolean; error?: string } {
    if (!cin) return { isValid: false, error: 'CIN is required' }

    const cinRegex = /^[LUF][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/

    if (!cinRegex.test(cin)) {
        return { isValid: false, error: 'Invalid CIN format' }
    }

    return { isValid: true }
}

export function validateFinancialRatio(
    ratio: number,
    type: 'current_ratio' | 'debt_equity' | 'interest_coverage' | 'net_margin'
): { isValid: boolean; warning?: string } {
    switch (type) {
        case 'current_ratio':
            if (ratio < 0.5) return { isValid: false, warning: 'Current ratio is critically low' }
            if (ratio < 1) return { isValid: true, warning: 'Current ratio below 1 indicates liquidity concerns' }
            if (ratio > 5) return { isValid: true, warning: 'Very high current ratio may indicate inefficient asset utilization' }
            break

        case 'debt_equity':
            if (ratio < 0) return { isValid: false, warning: 'Debt-to-equity ratio cannot be negative' }
            if (ratio > 2) return { isValid: true, warning: 'High debt-to-equity ratio indicates high leverage' }
            break

        case 'interest_coverage':
            if (ratio < 1) return { isValid: false, warning: 'Interest coverage below 1 indicates inability to service debt' }
            if (ratio < 2.5) return { isValid: true, warning: 'Low interest coverage indicates potential debt servicing issues' }
            break

        case 'net_margin':
            if (ratio < -50) return { isValid: false, warning: 'Extremely negative margin indicates severe losses' }
            if (ratio < 0) return { isValid: true, warning: 'Negative margin indicates losses' }
            break
    }

    return { isValid: true }
}

// ============================================================================
// REGIONAL DISTRIBUTION CALCULATIONS
// ============================================================================

export function calculateRegionalDistribution(companies: PortfolioCompany[]): RegionalDistribution {
    const stateMap = new Map<string, {
        count: number
        total_exposure: number
        risk_scores: number[]
        cities: Map<string, number>
    }>()

    companies.forEach(company => {
        const address = company.extracted_data?.about_company?.registered_address
        if (!address) return

        const state = address.state || 'Unknown'
        const city = address.city || 'Unknown'
        const exposure = company.recommended_limit || 0
        const riskScore = company.risk_score || 0

        if (!stateMap.has(state)) {
            stateMap.set(state, {
                count: 0,
                total_exposure: 0,
                risk_scores: [],
                cities: new Map()
            })
        }

        const stateData = stateMap.get(state)!
        stateData.count++
        stateData.total_exposure += exposure
        if (riskScore > 0) {
            stateData.risk_scores.push(riskScore)
        }

        const cityCount = stateData.cities.get(city) || 0
        stateData.cities.set(city, cityCount + 1)
    })

    const regions = Array.from(stateMap.entries()).map(([state, data]) => {
        const averageRiskScore = data.risk_scores.length > 0
            ? data.risk_scores.reduce((sum, score) => sum + score, 0) / data.risk_scores.length
            : 0

        const cities = Array.from(data.cities.entries()).map(([name, count]) => ({
            name,
            count
        }))

        return {
            state,
            count: data.count,
            total_exposure: data.total_exposure,
            average_risk_score: averageRiskScore,
            cities
        }
    })

    return { regions }
}

// Re-export the main utilities
export {
    getRiskColor,
    getRiskGradeDescription,
    formatCurrency,
    formatDate,
    validateCompanyData,
    getRiskMultiplier,
    formatCurrencyCompact,
    calculateGrowthRate,
    calculateCAGR,
    calculateRatio,
    calculateMargin,
    calculateDebtEquityRatio,
    calculateCurrentRatio,
    calculateROE,
    calculateROA,
    formatCrores,
    formatLakhs,
    formatPercentage,
    formatIndianNumber,
    isValidPAN,
    isValidGSTIN,
    isValidCIN
} from '../utils'

// ============================================================================
// ADVANCED FILTERING FUNCTIONS
// ============================================================================

/**
 * Filter companies by risk grade using risk_grade field
 */
export function filterByRiskGrade(
    companies: PortfolioCompany[],
    riskGrades: string[]
): PortfolioCompany[] {
    if (!riskGrades || riskGrades.length === 0) return companies

    return companies.filter(company =>
        company.risk_grade && riskGrades.includes(company.risk_grade)
    )
}

/**
 * Filter companies by industry using industry field from extracted data
 */
export function filterByIndustry(
    companies: PortfolioCompany[],
    industries: string[]
): PortfolioCompany[] {
    if (!industries || industries.length === 0) return companies

    return companies.filter(company => {
        // Check both the main industry field and extracted data industry
        const mainIndustry = company.industry
        const extractedIndustry = company.extracted_data?.about_company?.industry

        return industries.some(industry =>
            mainIndustry === industry || extractedIndustry === industry
        )
    })
}

/**
 * Filter companies by region using address data from extracted_data
 */
export function filterByRegion(
    companies: PortfolioCompany[],
    regions: string[]
): PortfolioCompany[] {
    if (!regions || regions.length === 0) return companies

    return companies.filter(company => {
        const registeredAddress = company.extracted_data?.about_company?.registered_address
        const businessAddress = company.extracted_data?.about_company?.business_address

        // Extract state from addresses
        const registeredState = registeredAddress?.state
        const businessState = businessAddress?.state

        return regions.some(region =>
            registeredState === region || businessState === region
        )
    })
}

/**
 * Filter companies by GST compliance status using GST data
 */
export function filterByGSTCompliance(
    companies: PortfolioCompany[],
    complianceStatuses: string[]
): PortfolioCompany[] {
    if (!complianceStatuses || complianceStatuses.length === 0) return companies

    return companies.filter(company => {
        const gstRecords = company.extracted_data?.gst_records
        if (!gstRecords) {
            return complianceStatuses.includes('Unknown')
        }

        const activeGSTINs = gstRecords.active_gstins || []
        const hasRegularCompliance = activeGSTINs.some(gstin =>
            gstin.compliance_status === 'Regular'
        )
        const hasIrregularCompliance = activeGSTINs.some(gstin =>
            gstin.compliance_status === 'Irregular'
        )

        if (hasRegularCompliance && complianceStatuses.includes('Regular')) return true
        if (hasIrregularCompliance && complianceStatuses.includes('Irregular')) return true
        if (!hasRegularCompliance && !hasIrregularCompliance && complianceStatuses.includes('Unknown')) return true

        return false
    })
}

/**
 * Filter companies by EPFO compliance status using EPFO data
 */
export function filterByEPFOCompliance(
    companies: PortfolioCompany[],
    complianceStatuses: string[]
): PortfolioCompany[] {
    if (!complianceStatuses || complianceStatuses.length === 0) return companies

    return companies.filter(company => {
        const epfoRecords = company.extracted_data?.epfo_records
        if (!epfoRecords) {
            return complianceStatuses.includes('Unknown')
        }

        const establishments = epfoRecords.establishments || []
        const hasRegularCompliance = establishments.some(est =>
            est.compliance_status === 'Regular'
        )
        const hasIrregularCompliance = establishments.some(est =>
            est.compliance_status === 'Irregular'
        )

        if (hasRegularCompliance && complianceStatuses.includes('Regular')) return true
        if (hasIrregularCompliance && complianceStatuses.includes('Irregular')) return true
        if (!hasRegularCompliance && !hasIrregularCompliance && complianceStatuses.includes('Unknown')) return true

        return false
    })
}

/**
 * Filter companies by audit qualification status
 */
export function filterByAuditQualification(
    companies: PortfolioCompany[],
    qualificationStatuses: string[]
): PortfolioCompany[] {
    if (!qualificationStatuses || qualificationStatuses.length === 0) return companies

    return companies.filter(company => {
        const auditQualifications = company.extracted_data?.audit_qualifications
        if (!auditQualifications || auditQualifications.length === 0) {
            return qualificationStatuses.includes('Unknown')
        }

        const hasQualified = auditQualifications.some(audit =>
            audit.qualification_type === 'Unqualified'
        )
        const hasUnqualified = auditQualifications.some(audit =>
            audit.qualification_type === 'Qualified'
        )

        if (hasQualified && qualificationStatuses.includes('Qualified')) return true
        if (hasUnqualified && qualificationStatuses.includes('Unqualified')) return true
        if (!hasQualified && !hasUnqualified && qualificationStatuses.includes('Unknown')) return true

        return false
    })
}

/**
 * Advanced search across company names and extracted data
 */
export function searchCompaniesAdvanced(
    companies: PortfolioCompany[],
    query: string
): PortfolioCompany[] {
    if (!query || !query.trim()) return companies

    const searchTerm = query.toLowerCase().trim()

    return companies.filter(company => {
        // Search in basic company information
        const basicFields = [
            company.company_name,
            company.industry,
            company.risk_grade,
            company.original_filename
        ].filter(Boolean).join(' ').toLowerCase()

        if (basicFields.includes(searchTerm)) return true

        // Search in extracted company data
        const aboutCompany = company.extracted_data?.about_company
        if (aboutCompany) {
            const companyFields = [
                aboutCompany.legal_name,
                aboutCompany.cin,
                aboutCompany.pan,
                aboutCompany.industry,
                aboutCompany.segment,
                aboutCompany.website,
                aboutCompany.email
            ].filter(Boolean).join(' ').toLowerCase()

            if (companyFields.includes(searchTerm)) return true
        }

        // Search in directors
        const directors = company.extracted_data?.directors || []
        const directorNames = directors.map(d => d.name).join(' ').toLowerCase()
        if (directorNames.includes(searchTerm)) return true

        // Search in GST records
        const gstRecords = company.extracted_data?.gst_records
        if (gstRecords) {
            const gstins = [
                ...(gstRecords.active_gstins || []),
                ...(gstRecords.cancelled_gstins || [])
            ].map(g => g.gstin).join(' ').toLowerCase()

            if (gstins.includes(searchTerm)) return true
        }

        return false
    })
}

/**
 * Filter companies by financial metrics ranges
 */
export function filterByFinancialMetrics(
    companies: PortfolioCompany[],
    filters: {
        ebitda_margin_range?: [number, number]
        debt_equity_range?: [number, number]
        current_ratio_range?: [number, number]
    }
): PortfolioCompany[] {
    return companies.filter(company => {
        const financialData = company.extracted_data["Standalone Financial Data"]
        if (!financialData || !financialData.years || financialData.years.length === 0) {
            return false
        }

        const latestYear = financialData.years[financialData.years.length - 1]

        // EBITDA Margin filter
        if (filters.ebitda_margin_range) {
            const ebitdaMargin = financialData.ratios?.profitability?.ebitda_margin?.[latestYear]
            if (ebitdaMargin !== undefined) {
                const [min, max] = filters.ebitda_margin_range
                if (ebitdaMargin < min || ebitdaMargin > max) return false
            }
        }

        // Debt-to-Equity filter
        if (filters.debt_equity_range) {
            const debtEquity = financialData.ratios?.leverage?.debt_equity?.[latestYear]
            if (debtEquity !== undefined) {
                const [min, max] = filters.debt_equity_range
                if (debtEquity < min || debtEquity > max) return false
            }
        }

        // Current Ratio filter
        if (filters.current_ratio_range) {
            const currentRatio = financialData.ratios?.liquidity?.current_ratio?.[latestYear]
            if (currentRatio !== undefined) {
                const [min, max] = filters.current_ratio_range
                if (currentRatio < min || currentRatio > max) return false
            }
        }

        return true
    })
}

/**
 * Comprehensive filtering function that applies all filter criteria
 */
export function applyAdvancedFilters(
    companies: PortfolioCompany[],
    filters: FilterCriteria
): PortfolioCompany[] {
    let filteredCompanies = [...companies]

    // Apply risk grade filter
    if (filters.risk_grades && filters.risk_grades.length > 0) {
        filteredCompanies = filterByRiskGrade(filteredCompanies, filters.risk_grades)
    }

    // Apply industry filter
    if (filters.industries && filters.industries.length > 0) {
        filteredCompanies = filterByIndustry(filteredCompanies, filters.industries)
    }

    // Apply region filter
    if (filters.regions && filters.regions.length > 0) {
        filteredCompanies = filterByRegion(filteredCompanies, filters.regions)
    }

    // Apply GST compliance filter
    if (filters.gst_compliance_status && filters.gst_compliance_status.length > 0) {
        filteredCompanies = filterByGSTCompliance(filteredCompanies, filters.gst_compliance_status)
    }

    // Apply EPFO compliance filter
    if (filters.epfo_compliance_status && filters.epfo_compliance_status.length > 0) {
        filteredCompanies = filterByEPFOCompliance(filteredCompanies, filters.epfo_compliance_status)
    }

    // Apply audit qualification filter
    if (filters.audit_qualification_status && filters.audit_qualification_status.length > 0) {
        filteredCompanies = filterByAuditQualification(filteredCompanies, filters.audit_qualification_status)
    }

    // Apply financial metrics filters
    const financialFilters = {
        ebitda_margin_range: filters.ebitda_margin_range,
        debt_equity_range: filters.debt_equity_range,
        current_ratio_range: filters.current_ratio_range
    }

    if (Object.values(financialFilters).some(filter => filter !== undefined)) {
        filteredCompanies = filterByFinancialMetrics(filteredCompanies, financialFilters)
    }

    // Apply risk score range filter
    if (filters.risk_score_range) {
        const [min, max] = filters.risk_score_range
        filteredCompanies = filteredCompanies.filter(company =>
            company.risk_score !== null &&
            company.risk_score >= min &&
            company.risk_score <= max
        )
    }

    // Apply recommended limit range filter
    if (filters.recommended_limit_range) {
        const [min, max] = filters.recommended_limit_range
        filteredCompanies = filteredCompanies.filter(company =>
            company.recommended_limit !== null &&
            company.recommended_limit >= min &&
            company.recommended_limit <= max
        )
    }

    // Apply processing status filter
    if (filters.processing_status && filters.processing_status.length > 0) {
        filteredCompanies = filteredCompanies.filter(company =>
            company.status && filters.processing_status!.includes(company.status)
        )
    }

    // Apply date range filter
    if (filters.date_range) {
        const [startDate, endDate] = filters.date_range
        filteredCompanies = filteredCompanies.filter(company => {
            if (!company.completed_at) return false
            const completedDate = new Date(company.completed_at)
            return completedDate >= startDate && completedDate <= endDate
        })
    }

    // Apply search query
    if (filters.search_query && filters.search_query.trim()) {
        filteredCompanies = searchCompaniesAdvanced(filteredCompanies, filters.search_query)
    }

    return filteredCompanies
}

/**
 * Extract unique values for filter options
 */
export function extractFilterOptions(companies: PortfolioCompany[]): {
    industries: string[]
    regions: string[]
    riskGrades: string[]
    gstComplianceStatuses: string[]
    epfoComplianceStatuses: string[]
    auditStatuses: string[]
} {
    const industries = new Set<string>()
    const regions = new Set<string>()
    const riskGrades = new Set<string>()
    const gstStatuses = new Set<string>()
    const epfoStatuses = new Set<string>()
    const auditStatuses = new Set<string>()

    companies.forEach(company => {
        // Industries
        if (company.industry) industries.add(company.industry)
        if (company.extracted_data?.about_company?.industry) {
            industries.add(company.extracted_data.about_company.industry)
        }

        // Regions
        const registeredState = company.extracted_data?.about_company?.registered_address?.state
        const businessState = company.extracted_data?.about_company?.business_address?.state
        if (registeredState) regions.add(registeredState)
        if (businessState) regions.add(businessState)

        // Risk Grades
        if (company.risk_grade) riskGrades.add(company.risk_grade)

        // GST Compliance
        const gstRecords = company.extracted_data?.gst_records
        if (gstRecords?.active_gstins) {
            gstRecords.active_gstins.forEach(gstin => {
                if (gstin.compliance_status) gstStatuses.add(gstin.compliance_status)
            })
        }

        // EPFO Compliance
        const epfoRecords = company.extracted_data?.epfo_records
        if (epfoRecords?.establishments) {
            epfoRecords.establishments.forEach(est => {
                if (est.compliance_status) epfoStatuses.add(est.compliance_status)
            })
        }

        // Audit Status
        const auditQualifications = company.extracted_data?.audit_qualifications
        if (auditQualifications) {
            auditQualifications.forEach(audit => {
                if (audit.qualification_type) auditStatuses.add(audit.qualification_type)
            })
        }
    })

    return {
        industries: Array.from(industries).sort(),
        regions: Array.from(regions).sort(),
        riskGrades: Array.from(riskGrades).sort(),
        gstComplianceStatuses: Array.from(gstStatuses).sort(),
        epfoComplianceStatuses: Array.from(epfoStatuses).sort(),
        auditStatuses: Array.from(auditStatuses).sort()
    }
}