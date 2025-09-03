import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

// ============================================================================
// CURRENCY AND NUMBER FORMATTING (Indian Market)
// ============================================================================

export function formatCurrency(amount: number, currency: string = 'INR'): string {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}

export function formatCurrencyCompact(amount: number, currency: string = 'INR'): string {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency,
        notation: 'compact',
        maximumFractionDigits: 2
    })
    return formatter.format(amount)
}

export function formatIndianNumber(amount: number): string {
    return new Intl.NumberFormat('en-IN').format(amount)
}

export function formatCrores(amount: number): string {
    const crores = amount / 10000000
    return `₹${crores.toFixed(2)} Cr`
}

export function formatLakhs(amount: number): string {
    const lakhs = amount / 100000
    return `₹${lakhs.toFixed(2)} L`
}

export function formatPercentage(value: number, decimals: number = 2): string {
    return `${value.toFixed(decimals)}%`
}

export function formatNumber(value: number): string {
    return new Intl.NumberFormat('en-IN').format(value)
}

// ============================================================================
// DATE FORMATTING
// ============================================================================

export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date))
}

export function formatDateIndian(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(new Date(date))
}

export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    }).format(new Date(date))
}

export function getRelativeTime(date: string | Date): string {
    const now = new Date()
    const targetDate = new Date(date)
    const diffInSeconds = Math.floor((now.getTime() - targetDate.getTime()) / 1000)

    if (diffInSeconds < 60) return 'Just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} days ago`

    return formatDate(date)
}

// ============================================================================
// RISK CALCULATION AND SCORING
// ============================================================================

export function getRiskColor(grade: string): string {
    if (!grade) return 'bg-gray-100 text-gray-600'

    // Handle CM grades (CM1-CM5)
    if (grade.startsWith('CM')) {
        const gradeNum = parseInt(grade.replace('CM', ''))
        switch (gradeNum) {
            case 1: return 'bg-green-100 text-green-700 border-green-200'
            case 2: return 'bg-blue-100 text-blue-700 border-blue-200'
            case 3: return 'bg-yellow-100 text-yellow-700 border-yellow-200'
            case 4: return 'bg-orange-100 text-orange-700 border-orange-200'
            case 5: return 'bg-red-100 text-red-700 border-red-200'
            default: return 'bg-gray-100 text-gray-600 border-gray-200'
        }
    }

    // Legacy grade handling
    if (grade.startsWith('A')) return 'bg-green-100 text-green-700 border-green-200'
    if (grade.startsWith('B')) return 'bg-yellow-100 text-yellow-700 border-yellow-200'
    if (grade.startsWith('C')) return 'bg-orange-100 text-orange-700 border-orange-200'
    return 'bg-red-100 text-red-700 border-red-200'
}

export function getRiskGradeDescription(grade: string): string {
    if (!grade) return 'Unknown Risk'

    if (grade.startsWith('CM')) {
        const gradeNum = parseInt(grade.replace('CM', ''))
        switch (gradeNum) {
            case 1: return 'Excellent Credit Quality'
            case 2: return 'Good Credit Quality'
            case 3: return 'Average Credit Quality'
            case 4: return 'Poor Credit Quality'
            case 5: return 'Critical Risk'
            default: return 'Unknown Risk Grade'
        }
    }

    return 'Legacy Risk Grade'
}

export function calculateRiskScore(
    totalWeightedScore: number,
    totalMaxScore: number
): number {
    if (totalMaxScore === 0) return 0
    return Math.round((totalWeightedScore / totalMaxScore) * 100)
}

export function getRiskMultiplier(grade: string): number {
    if (!grade) return 1

    if (grade.startsWith('CM')) {
        const gradeNum = parseInt(grade.replace('CM', ''))
        switch (gradeNum) {
            case 1: return 1.0
            case 2: return 0.9
            case 3: return 0.8
            case 4: return 0.6
            case 5: return 0.4
            default: return 0.5
        }
    }

    return 0.7 // Default for legacy grades
}

// ============================================================================
// FINANCIAL CALCULATIONS
// ============================================================================

export function calculateGrowthRate(current: number, previous: number): number {
    if (previous === 0) return 0
    return ((current - previous) / Math.abs(previous)) * 100
}

export function calculateCAGR(startValue: number, endValue: number, years: number): number {
    if (startValue <= 0 || endValue <= 0 || years <= 0) return 0
    return (Math.pow(endValue / startValue, 1 / years) - 1) * 100
}

export function calculateRatio(numerator: number, denominator: number): number {
    if (denominator === 0) return 0
    return numerator / denominator
}

export function calculateMargin(profit: number, revenue: number): number {
    if (revenue === 0) return 0
    return (profit / revenue) * 100
}

export function calculateDebtEquityRatio(totalDebt: number, totalEquity: number): number {
    if (totalEquity === 0) return 0
    return totalDebt / totalEquity
}

export function calculateCurrentRatio(currentAssets: number, currentLiabilities: number): number {
    if (currentLiabilities === 0) return 0
    return currentAssets / currentLiabilities
}

export function calculateROE(netIncome: number, shareholderEquity: number): number {
    if (shareholderEquity === 0) return 0
    return (netIncome / shareholderEquity) * 100
}

export function calculateROA(netIncome: number, totalAssets: number): number {
    if (totalAssets === 0) return 0
    return (netIncome / totalAssets) * 100
}

// ============================================================================
// PORTFOLIO DATA VALIDATION
// ============================================================================

export function validateCompanyData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.company_name || data.company_name.trim() === '') {
        errors.push('Company name is required')
    }

    if (!data.request_id || data.request_id.trim() === '') {
        errors.push('Request ID is required')
    }

    if (data.risk_score !== null && (data.risk_score < 0 || data.risk_score > 100)) {
        errors.push('Risk score must be between 0 and 100')
    }

    if (data.recommended_limit !== null && data.recommended_limit < 0) {
        errors.push('Recommended limit cannot be negative')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

export function validateFinancialData(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (data.revenue !== undefined && data.revenue < 0) {
        errors.push('Revenue cannot be negative')
    }

    if (data.netIncome !== undefined && typeof data.netIncome !== 'number') {
        errors.push('Net income must be a number')
    }

    return {
        isValid: errors.length === 0,
        errors
    }
}

// ============================================================================
// UTILITY HELPERS
// ============================================================================

export function sanitizeString(str: string): string {
    return str.trim().replace(/[<>]/g, '')
}

export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text
    return text.substring(0, maxLength) + '...'
}

export function generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36)
}

export function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
        clearTimeout(timeout)
        timeout = setTimeout(() => func(...args), wait)
    }
}

export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
}

export function isValidPAN(pan: string): boolean {
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/
    return panRegex.test(pan)
}

export function isValidGSTIN(gstin: string): boolean {
    const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/
    return gstinRegex.test(gstin)
}

export function isValidCIN(cin: string): boolean {
    const cinRegex = /^[LUF][0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/
    return cinRegex.test(cin)
}

// ============================================================================
// ADDITIONAL INDIAN MARKET SPECIFIC UTILITIES
// ============================================================================

export function parseIndianAmount(amountStr: string): number {
    // Remove currency symbols and common Indian number formatting
    const cleaned = amountStr
        .replace(/[₹,\s]/g, '')
        .replace(/crore?s?/i, '0000000')
        .replace(/lakh?s?/i, '00000')
        .replace(/thousand?s?/i, '000')

    return parseFloat(cleaned) || 0
}

export function formatIndianNumberSystem(num: number): string {
    // Indian numbering system with lakhs and crores
    if (num >= 10000000) {
        return `${(num / 10000000).toFixed(2)} Crore`
    } else if (num >= 100000) {
        return `${(num / 100000).toFixed(2)} Lakh`
    } else if (num >= 1000) {
        return `${(num / 1000).toFixed(2)} Thousand`
    }
    return num.toString()
}

export function getFinancialYearFromDate(date: Date): string {
    const year = date.getFullYear()
    const month = date.getMonth() + 1

    if (month >= 4) {
        return `${year}-${(year + 1).toString().slice(-2)}`
    } else {
        return `${year - 1}-${year.toString().slice(-2)}`
    }
}

export function isValidIndianPincode(pincode: string): boolean {
    const pincodeRegex = /^[1-9][0-9]{5}$/
    return pincodeRegex.test(pincode)
}

export function getStateFromPincode(pincode: string): string {
    if (!isValidIndianPincode(pincode)) return 'Unknown'

    const firstDigit = pincode.charAt(0)
    const stateMap: Record<string, string> = {
        '1': 'Delhi/Punjab/Haryana',
        '2': 'Uttar Pradesh/Uttarakhand',
        '3': 'Rajasthan',
        '4': 'Gujarat/Maharashtra/Goa',
        '5': 'Andhra Pradesh/Telangana/Karnataka',
        '6': 'Tamil Nadu/Kerala/Puducherry',
        '7': 'West Bengal/Odisha/Jharkhand',
        '8': 'Bihar/Jharkhand/West Bengal',
        '9': 'Assam/Northeast States'
    }

    return stateMap[firstDigit] || 'Unknown'
}

// ============================================================================
// ENHANCED FINANCIAL CALCULATION UTILITIES
// ============================================================================

export function calculateWorkingCapital(currentAssets: number, currentLiabilities: number): number {
    return currentAssets - currentLiabilities
}

export function calculateAssetTurnover(revenue: number, totalAssets: number): number {
    if (totalAssets === 0) return 0
    return revenue / totalAssets
}

export function calculateInventoryTurnover(cogs: number, averageInventory: number): number {
    if (averageInventory === 0) return 0
    return cogs / averageInventory
}

export function calculateReceivablesTurnover(revenue: number, averageReceivables: number): number {
    if (averageReceivables === 0) return 0
    return revenue / averageReceivables
}

export function calculateDaysInReceivables(receivablesTurnover: number): number {
    if (receivablesTurnover === 0) return 0
    return 365 / receivablesTurnover
}

export function calculateQuickRatio(
    currentAssets: number,
    inventory: number,
    currentLiabilities: number
): number {
    if (currentLiabilities === 0) return 0
    return (currentAssets - inventory) / currentLiabilities
}

export function calculateEBITDAMargin(ebitda: number, revenue: number): number {
    if (revenue === 0) return 0
    return (ebitda / revenue) * 100
}

export function calculateInterestCoverageRatio(ebit: number, interestExpense: number): number {
    if (interestExpense === 0) return 0
    return ebit / interestExpense
}

// ============================================================================
// BUSINESS INTELLIGENCE UTILITIES
// ============================================================================

export function calculateCompoundAnnualGrowthRate(
    beginningValue: number,
    endingValue: number,
    numberOfYears: number
): number {
    if (beginningValue <= 0 || endingValue <= 0 || numberOfYears <= 0) return 0
    return (Math.pow(endingValue / beginningValue, 1 / numberOfYears) - 1) * 100
}

export function calculateVolatility(values: number[]): number {
    if (values.length < 2) return 0

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length
    const squaredDifferences = values.map(val => Math.pow(val - mean, 2))
    const variance = squaredDifferences.reduce((sum, val) => sum + val, 0) / values.length

    return Math.sqrt(variance)
}

export function calculateTrendDirection(values: number[]): 'increasing' | 'decreasing' | 'stable' {
    if (values.length < 2) return 'stable'

    let increasingCount = 0
    let decreasingCount = 0

    for (let i = 1; i < values.length; i++) {
        if (values[i] > values[i - 1]) increasingCount++
        else if (values[i] < values[i - 1]) decreasingCount++
    }

    if (increasingCount > decreasingCount) return 'increasing'
    if (decreasingCount > increasingCount) return 'decreasing'
    return 'stable'
}

export function calculatePercentileRank(value: number, dataset: number[]): number {
    const sortedData = [...dataset].sort((a, b) => a - b)
    const index = sortedData.findIndex(val => val >= value)

    if (index === -1) return 100
    return (index / sortedData.length) * 100
}