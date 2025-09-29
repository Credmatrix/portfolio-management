/**
 * Data Quality Validation and Verification for Deep Research System
 * Implements comprehensive data validation, quality scoring, and verification
 */

import { Json } from '@/types/database.types'

// Data quality dimensions
export interface DataQualityDimensions {
    completeness: number      // 0-100: How complete is the data
    accuracy: number         // 0-100: How accurate is the data
    consistency: number      // 0-100: How consistent is the data
    validity: number         // 0-100: How valid is the data format
    timeliness: number       // 0-100: How current is the data
    uniqueness: number       // 0-100: How unique/non-duplicate is the data
    reliability: number      // 0-100: How reliable are the sources
}

// Validation rule interface
export interface ValidationRule {
    name: string
    description: string
    severity: 'critical' | 'high' | 'medium' | 'low'
    validator: (data: any, context?: any) => ValidationResult
}

// Validation result
export interface ValidationResult {
    passed: boolean
    score: number
    message: string
    details?: string
    suggestions?: string[]
}

// Data quality report
export interface DataQualityReport {
    overall_score: number
    dimensions: DataQualityDimensions
    validation_results: ValidationResult[]
    critical_issues: string[]
    warnings: string[]
    recommendations: string[]
    data_completeness_breakdown: Record<string, number>
    source_reliability_scores: Record<string, number>
    verification_status: 'verified' | 'partially_verified' | 'unverified' | 'disputed'
}

// Source verification interface
export interface SourceVerification {
    source: string
    reliability_score: number
    verification_method: string
    last_verified: string
    confidence_level: 'high' | 'medium' | 'low'
    issues: string[]
}

export class DataQualityValidator {
    private static readonly VALIDATION_RULES: ValidationRule[] = [
        {
            name: 'content_presence',
            description: 'Validates presence of meaningful content',
            severity: 'critical',
            validator: (data) => {
                const content = data?.content || data?.findings || data?.analysis || ''
                const contentLength = content.toString().trim().length

                if (contentLength === 0) {
                    return {
                        passed: false,
                        score: 0,
                        message: 'No content found',
                        suggestions: ['Verify data source', 'Check API response', 'Review extraction logic']
                    }
                }

                if (contentLength < 50) {
                    return {
                        passed: false,
                        score: 25,
                        message: 'Insufficient content length',
                        details: `Content length: ${contentLength} characters`,
                        suggestions: ['Expand research scope', 'Use additional data sources']
                    }
                }

                return {
                    passed: true,
                    score: Math.min(100, contentLength / 10), // Score based on content length
                    message: 'Content presence validated'
                }
            }
        },

        {
            name: 'structured_data_format',
            description: 'Validates structured data format and completeness',
            severity: 'high',
            validator: (data) => {
                const requiredFields = ['findings', 'summary', 'confidence_level']
                const presentFields = requiredFields.filter(field => data[field] !== undefined)
                const completeness = (presentFields.length / requiredFields.length) * 100

                if (completeness < 50) {
                    return {
                        passed: false,
                        score: completeness,
                        message: 'Incomplete structured data',
                        details: `Missing fields: ${requiredFields.filter(f => !presentFields.includes(f)).join(', ')}`,
                        suggestions: ['Review data extraction logic', 'Verify API response format']
                    }
                }

                return {
                    passed: true,
                    score: completeness,
                    message: 'Structured data format validated'
                }
            }
        },

        {
            name: 'findings_quality',
            description: 'Validates quality and relevance of findings',
            severity: 'high',
            validator: (data) => {
                const findings = data?.findings || []

                if (!Array.isArray(findings)) {
                    return {
                        passed: false,
                        score: 0,
                        message: 'Findings not in expected array format',
                        suggestions: ['Review findings extraction logic']
                    }
                }

                if (findings.length === 0) {
                    return {
                        passed: false,
                        score: 0,
                        message: 'No findings extracted',
                        suggestions: ['Expand research scope', 'Review search criteria', 'Check data sources']
                    }
                }

                // Check finding quality
                const qualityFindings = findings.filter((finding: any) =>
                    finding.title &&
                    finding.description &&
                    finding.severity &&
                    finding.title.length > 10 &&
                    finding.description.length > 20
                )

                const qualityScore = (qualityFindings.length / findings.length) * 100

                if (qualityScore < 60) {
                    return {
                        passed: false,
                        score: qualityScore,
                        message: 'Low quality findings detected',
                        details: `${qualityFindings.length}/${findings.length} findings meet quality standards`,
                        suggestions: ['Improve finding extraction logic', 'Enhance data processing']
                    }
                }

                return {
                    passed: true,
                    score: qualityScore,
                    message: 'Findings quality validated'
                }
            }
        },

        {
            name: 'source_attribution',
            description: 'Validates presence and quality of source attribution',
            severity: 'medium',
            validator: (data) => {
                const findings = data?.findings || []
                const citations = data?.citations || []

                if (findings.length === 0) {
                    return { passed: true, score: 100, message: 'No findings to validate sources for' }
                }

                const findingsWithSources = findings.filter((finding: any) =>
                    finding.source || finding.citation || finding.reference
                )

                const sourceScore = (findingsWithSources.length / findings.length) * 100

                if (sourceScore < 40) {
                    return {
                        passed: false,
                        score: sourceScore,
                        message: 'Insufficient source attribution',
                        details: `${findingsWithSources.length}/${findings.length} findings have source attribution`,
                        suggestions: ['Improve source tracking', 'Enhance citation extraction']
                    }
                }

                return {
                    passed: true,
                    score: sourceScore,
                    message: 'Source attribution validated'
                }
            }
        },

        {
            name: 'data_consistency',
            description: 'Validates consistency across data elements',
            severity: 'medium',
            validator: (data) => {
                const content = JSON.stringify(data).toLowerCase()

                // Check for contradictory statements
                const contradictionIndicators = [
                    'however', 'but', 'although', 'despite', 'contrary to',
                    'on the other hand', 'nevertheless', 'nonetheless'
                ]

                const contradictions = contradictionIndicators.filter(indicator =>
                    content.includes(indicator)
                ).length

                // Check for conflicting information
                const conflictIndicators = ['conflict', 'dispute', 'disagree', 'contradict']
                const conflicts = conflictIndicators.filter(indicator =>
                    content.includes(indicator)
                ).length

                const inconsistencyScore = Math.max(0, 100 - (contradictions * 10) - (conflicts * 15))

                if (inconsistencyScore < 70) {
                    return {
                        passed: false,
                        score: inconsistencyScore,
                        message: 'Data consistency issues detected',
                        details: `Found ${contradictions} contradictions and ${conflicts} conflicts`,
                        suggestions: ['Review data sources', 'Cross-verify information', 'Resolve conflicts']
                    }
                }

                return {
                    passed: true,
                    score: inconsistencyScore,
                    message: 'Data consistency validated'
                }
            }
        },

        {
            name: 'error_indicators',
            description: 'Checks for error indicators in the data',
            severity: 'critical',
            validator: (data) => {
                const content = JSON.stringify(data).toLowerCase()

                const errorIndicators = [
                    'error', 'failed', 'exception', 'null', 'undefined',
                    'not found', 'unavailable', 'timeout', 'invalid'
                ]

                const foundErrors = errorIndicators.filter(indicator =>
                    content.includes(indicator)
                )

                if (foundErrors.length > 0) {
                    return {
                        passed: false,
                        score: Math.max(0, 100 - (foundErrors.length * 20)),
                        message: 'Error indicators found in data',
                        details: `Found indicators: ${foundErrors.join(', ')}`,
                        suggestions: ['Review data processing', 'Check API responses', 'Validate data sources']
                    }
                }

                return {
                    passed: true,
                    score: 100,
                    message: 'No error indicators found'
                }
            }
        }
    ]

    /**
     * Validate data quality comprehensively
     */
    static validateDataQuality(data: any, context?: any): DataQualityReport {
        const validationResults: ValidationResult[] = []
        let totalScore = 0
        let criticalIssues: string[] = []
        let warnings: string[] = []

        // Run all validation rules
        for (const rule of this.VALIDATION_RULES) {
            try {
                const result = rule.validator(data, context)
                result.message = `${rule.name}: ${result.message}`
                validationResults.push(result)

                // Weight scores by severity
                const weight = this.getSeverityWeight(rule.severity)
                totalScore += result.score * weight

                // Collect issues
                if (!result.passed) {
                    if (rule.severity === 'critical') {
                        criticalIssues.push(result.message)
                    } else {
                        warnings.push(result.message)
                    }
                }
            } catch (error) {
                validationResults.push({
                    passed: false,
                    score: 0,
                    message: `${rule.name}: Validation failed - ${error instanceof Error ? error.message : 'Unknown error'}`,
                    suggestions: ['Review validation logic', 'Check data format']
                })
                criticalIssues.push(`Validation rule ${rule.name} failed to execute`)
            }
        }

        // Calculate weighted average score
        const totalWeight = this.VALIDATION_RULES.reduce((sum, rule) =>
            sum + this.getSeverityWeight(rule.severity), 0
        )
        const overallScore = totalScore / totalWeight

        // Calculate quality dimensions
        const dimensions = this.calculateQualityDimensions(data, validationResults)

        // Generate recommendations
        const recommendations = this.generateRecommendations(validationResults, dimensions)

        // Calculate data completeness breakdown
        const completenessBreakdown = this.calculateCompletenessBreakdown(data)

        // Calculate source reliability scores
        const sourceReliabilityScores = this.calculateSourceReliabilityScores(data)

        // Determine verification status
        const verificationStatus = this.determineVerificationStatus(dimensions, criticalIssues.length)

        return {
            overall_score: Math.round(overallScore),
            dimensions,
            validation_results: validationResults,
            critical_issues: criticalIssues,
            warnings,
            recommendations,
            data_completeness_breakdown: completenessBreakdown,
            source_reliability_scores: sourceReliabilityScores,
            verification_status: verificationStatus
        }
    }

    /**
     * Get severity weight for scoring
     */
    private static getSeverityWeight(severity: string): number {
        switch (severity) {
            case 'critical': return 3
            case 'high': return 2
            case 'medium': return 1.5
            case 'low': return 1
            default: return 1
        }
    }

    /**
     * Calculate quality dimensions
     */
    private static calculateQualityDimensions(data: any, validationResults: ValidationResult[]): DataQualityDimensions {
        // Completeness
        const completenessResult = validationResults.find(r => r.message.includes('content_presence'))
        const completeness = completenessResult ? completenessResult.score : 0

        // Accuracy
        const errorResult = validationResults.find(r => r.message.includes('error_indicators'))
        const accuracy = errorResult ? errorResult.score : 50

        // Consistency
        const consistencyResult = validationResults.find(r => r.message.includes('data_consistency'))
        const consistency = consistencyResult ? consistencyResult.score : 80

        // Validity
        const structureResult = validationResults.find(r => r.message.includes('structured_data_format'))
        const validity = structureResult ? structureResult.score : 70

        // Timeliness (assume current data is timely)
        const timeliness = 90

        // Uniqueness (assume data is unique unless duplicates detected)
        const uniqueness = 95

        // Reliability
        const sourceResult = validationResults.find(r => r.message.includes('source_attribution'))
        const reliability = sourceResult ? sourceResult.score : 60

        return {
            completeness: Math.round(completeness),
            accuracy: Math.round(accuracy),
            consistency: Math.round(consistency),
            validity: Math.round(validity),
            timeliness: Math.round(timeliness),
            uniqueness: Math.round(uniqueness),
            reliability: Math.round(reliability)
        }
    }

    /**
     * Generate recommendations based on validation results
     */
    private static generateRecommendations(
        validationResults: ValidationResult[],
        dimensions: DataQualityDimensions
    ): string[] {
        const recommendations: string[] = []

        // Collect suggestions from failed validations
        validationResults.forEach(result => {
            if (!result.passed && result.suggestions) {
                recommendations.push(...result.suggestions)
            }
        })

        // Add dimension-specific recommendations
        if (dimensions.completeness < 60) {
            recommendations.push('Enhance data collection from additional sources')
        }

        if (dimensions.accuracy < 70) {
            recommendations.push('Implement additional verification steps')
        }

        if (dimensions.consistency < 70) {
            recommendations.push('Cross-reference information across multiple sources')
        }

        if (dimensions.reliability < 60) {
            recommendations.push('Prioritize official and verified information sources')
        }

        // Remove duplicates and return
        return [...new Set(recommendations)]
    }

    /**
     * Calculate data completeness breakdown
     */
    private static calculateCompletenessBreakdown(data: any): Record<string, number> {
        const breakdown: Record<string, number> = {}

        // Check key data elements
        const keyElements = [
            'content', 'findings', 'summary', 'analysis', 'citations',
            'confidence_level', 'risk_assessment', 'recommendations'
        ]

        keyElements.forEach(element => {
            const value = data[element]
            if (value === undefined || value === null) {
                breakdown[element] = 0
            } else if (typeof value === 'string') {
                breakdown[element] = value.trim().length > 0 ? 100 : 0
            } else if (Array.isArray(value)) {
                breakdown[element] = value.length > 0 ? 100 : 0
            } else if (typeof value === 'object') {
                breakdown[element] = Object.keys(value).length > 0 ? 100 : 0
            } else {
                breakdown[element] = 100
            }
        })

        return breakdown
    }

    /**
     * Calculate source reliability scores
     */
    private static calculateSourceReliabilityScores(data: any): Record<string, number> {
        const scores: Record<string, number> = {}
        const findings = data?.findings || []
        const citations = data?.citations || []

        // Analyze sources from findings
        findings.forEach((finding: any) => {
            const source = finding.source || finding.citation || 'unknown'
            if (!scores[source]) {
                scores[source] = this.calculateSourceReliability(source, finding)
            }
        })

        // Analyze citations
        citations.forEach((citation: any) => {
            const source = citation.source || citation.url || 'unknown'
            if (!scores[source]) {
                scores[source] = this.calculateSourceReliability(source, citation)
            }
        })

        return scores
    }

    /**
     * Calculate reliability score for a specific source
     */
    private static calculateSourceReliability(source: string, data: any): number {
        let score = 50 // Base score

        const sourceLower = source.toLowerCase()

        // Official sources get higher scores
        if (sourceLower.includes('gov.') || sourceLower.includes('official') ||
            sourceLower.includes('regulatory') || sourceLower.includes('court')) {
            score += 30
        }

        // News sources get medium scores
        if (sourceLower.includes('news') || sourceLower.includes('media') ||
            sourceLower.includes('press')) {
            score += 15
        }

        // Social media gets lower scores
        if (sourceLower.includes('twitter') || sourceLower.includes('facebook') ||
            sourceLower.includes('social')) {
            score -= 20
        }

        // Check for verification indicators
        if (data.verified || data.verification_level === 'high') {
            score += 20
        }

        // Check for date recency
        if (data.date) {
            const date = new Date(data.date)
            const now = new Date()
            const daysDiff = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)

            if (daysDiff < 30) score += 10
            else if (daysDiff < 365) score += 5
            else if (daysDiff > 1825) score -= 10 // Older than 5 years
        }

        return Math.max(0, Math.min(100, score))
    }

    /**
     * Determine overall verification status
     */
    private static determineVerificationStatus(
        dimensions: DataQualityDimensions,
        criticalIssuesCount: number
    ): 'verified' | 'partially_verified' | 'unverified' | 'disputed' {
        if (criticalIssuesCount > 0) {
            return 'disputed'
        }

        const avgScore = (dimensions.accuracy + dimensions.reliability + dimensions.consistency) / 3

        if (avgScore >= 85) {
            return 'verified'
        } else if (avgScore >= 60) {
            return 'partially_verified'
        } else {
            return 'unverified'
        }
    }

    /**
     * Verify specific data elements
     */
    static verifyDataElements(data: any, elements: string[]): Record<string, ValidationResult> {
        const results: Record<string, ValidationResult> = {}

        elements.forEach(element => {
            const value = data[element]

            if (value === undefined || value === null) {
                results[element] = {
                    passed: false,
                    score: 0,
                    message: `${element} is missing`,
                    suggestions: [`Ensure ${element} is included in data processing`]
                }
            } else if (typeof value === 'string' && value.trim().length === 0) {
                results[element] = {
                    passed: false,
                    score: 0,
                    message: `${element} is empty`,
                    suggestions: [`Provide meaningful content for ${element}`]
                }
            } else {
                results[element] = {
                    passed: true,
                    score: 100,
                    message: `${element} is present and valid`
                }
            }
        })

        return results
    }

    /**
     * Generate data quality summary
     */
    static generateQualitySummary(report: DataQualityReport): string {
        const { overall_score, dimensions, critical_issues, warnings } = report

        let summary = `Data Quality Assessment: ${overall_score}/100\n\n`

        // Overall assessment
        if (overall_score >= 85) {
            summary += "✅ Excellent data quality - suitable for professional analysis\n"
        } else if (overall_score >= 70) {
            summary += "✅ Good data quality - suitable for analysis with minor limitations\n"
        } else if (overall_score >= 50) {
            summary += "⚠️ Moderate data quality - usable but requires careful interpretation\n"
        } else {
            summary += "❌ Poor data quality - significant limitations affect reliability\n"
        }

        // Dimension breakdown
        summary += "\nQuality Dimensions:\n"
        Object.entries(dimensions).forEach(([dimension, score]) => {
            const status = score >= 80 ? "✅" : score >= 60 ? "⚠️" : "❌"
            summary += `${status} ${dimension}: ${score}/100\n`
        })

        // Issues
        if (critical_issues.length > 0) {
            summary += `\n❌ Critical Issues (${critical_issues.length}):\n`
            critical_issues.forEach(issue => summary += `• ${issue}\n`)
        }

        if (warnings.length > 0) {
            summary += `\n⚠️ Warnings (${warnings.length}):\n`
            warnings.forEach(warning => summary += `• ${warning}\n`)
        }

        // Verification status
        summary += `\nVerification Status: ${report.verification_status.toUpperCase()}\n`

        return summary
    }
}