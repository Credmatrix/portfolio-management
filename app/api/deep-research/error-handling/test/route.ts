/**
 * Test endpoint for advanced error handling and fallbacks
 * Allows testing of various error scenarios and fallback mechanisms
 */

import { NextRequest, NextResponse } from 'next/server'
import { DeepResearchErrorHandler, ErrorCategory, ErrorContext } from '@/lib/utils/deep-research-error-handler'
import { ApiFailureHandler } from '@/lib/utils/api-failure-handler'
import { DataQualityValidator } from '@/lib/utils/data-quality-validator'

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const {
            test_type,
            error_scenario,
            company_name = 'Test Company Ltd',
            job_type = 'directors_research',
            simulate_data
        } = body

        console.log(`[Error Handling Test] Testing ${test_type} with scenario: ${error_scenario}`)

        switch (test_type) {
            case 'error_categorization':
                return handleErrorCategorizationTest(error_scenario, company_name, job_type)

            case 'api_failure_handling':
                return handleApiFailureTest(error_scenario, company_name, job_type)

            case 'data_quality_validation':
                return handleDataQualityTest(simulate_data, company_name, job_type)

            case 'professional_fallback':
                return handleProfessionalFallbackTest(error_scenario, company_name, job_type)

            case 'circuit_breaker':
                return handleCircuitBreakerTest(error_scenario)

            default:
                return NextResponse.json({
                    success: false,
                    error: 'Invalid test type',
                    available_tests: [
                        'error_categorization',
                        'api_failure_handling',
                        'data_quality_validation',
                        'professional_fallback',
                        'circuit_breaker'
                    ]
                }, { status: 400 })
        }

    } catch (error) {
        console.error('Error handling test failed:', error)
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            message: 'Error handling test endpoint failed'
        }, { status: 500 })
    }
}

/**
 * Test error categorization and handling
 */
async function handleErrorCategorizationTest(
    scenario: string,
    companyName: string,
    jobType: string
) {
    const errorContext: ErrorContext = {
        jobType,
        companyName,
        timestamp: new Date().toISOString(),
        apiEndpoint: 'TEST_ENDPOINT'
    }

    let testError: Error

    // Create different error scenarios
    switch (scenario) {
        case 'rate_limit':
            testError = new Error('Rate limit exceeded: 429 Too Many Requests')
            break
        case 'timeout':
            testError = new Error('Request timeout after 30000ms')
            break
        case 'authentication':
            testError = new Error('Unauthorized: Invalid API key (401)')
            break
        case 'server_error':
            testError = new Error('Internal server error: 500')
            break
        case 'network_error':
            testError = new Error('Network connection failed: ECONNRESET')
            break
        case 'data_quality':
            testError = new Error('Invalid data format received')
            break
        default:
            testError = new Error('Generic processing error occurred')
    }

    // Handle the error
    const enhancedError = await DeepResearchErrorHandler.handleError(testError, errorContext)

    // Apply fallback
    const fallbackResponse = await DeepResearchErrorHandler.applyIntelligentFallback(
        enhancedError,
        { scenario, companyName, jobType }
    )

    return NextResponse.json({
        success: true,
        test_type: 'error_categorization',
        scenario,
        results: {
            error_analysis: {
                category: enhancedError.category,
                severity: enhancedError.severity,
                recoverable: enhancedError.recoverable,
                fallback_strategy: enhancedError.fallbackStrategy,
                user_message: enhancedError.userMessage,
                suggested_actions: enhancedError.suggestedActions
            },
            fallback_response: {
                success: fallbackResponse.success,
                content_preview: fallbackResponse.content.substring(0, 200) + '...',
                confidence_score: fallbackResponse.confidence_score,
                data_completeness: fallbackResponse.data_completeness,
                verification_level: fallbackResponse.verification_level,
                limitations: fallbackResponse.limitations,
                recommendations: fallbackResponse.recommendations
            }
        }
    })
}

/**
 * Test API failure handling with circuit breaker
 */
async function handleApiFailureTest(
    scenario: string,
    companyName: string,
    jobType: string
) {
    const errorContext: ErrorContext = {
        jobType,
        companyName,
        timestamp: new Date().toISOString(),
        apiEndpoint: 'TEST_API'
    }

    // Simulate API request function that fails
    const failingApiRequest = async (): Promise<Response> => {
        switch (scenario) {
            case 'timeout':
                await new Promise(resolve => setTimeout(resolve, 100))
                throw new Error('Request timeout')
            case 'rate_limit':
                return new Response('Rate limit exceeded', { status: 429 })
            case 'server_error':
                return new Response('Internal server error', { status: 500 })
            case 'auth_error':
                return new Response('Unauthorized', { status: 401 })
            default:
                throw new Error('Network connection failed')
        }
    }

    // Test API failure handling
    const apiResponse = await ApiFailureHandler.executeWithFailureHandling(
        'TEST_API',
        failingApiRequest,
        errorContext
    )

    // Get circuit breaker status
    const circuitBreakerStatus = ApiFailureHandler.getCircuitBreakerStatus()

    return NextResponse.json({
        success: true,
        test_type: 'api_failure_handling',
        scenario,
        results: {
            api_response: {
                success: apiResponse.success,
                error: apiResponse.error,
                fallback_used: apiResponse.fallbackUsed,
                circuit_breaker_triggered: apiResponse.circuitBreakerTriggered,
                retry_count: apiResponse.retryCount
            },
            circuit_breaker_status: circuitBreakerStatus
        }
    })
}

/**
 * Test data quality validation
 */
async function handleDataQualityTest(
    simulateData: any,
    companyName: string,
    jobType: string
) {
    // Create test data scenarios
    const testDataScenarios = {
        high_quality: {
            content: 'Comprehensive analysis of directors and key management personnel reveals detailed professional backgrounds, regulatory compliance status, and cross-directorship analysis.',
            findings: [
                {
                    id: '1',
                    title: 'Director Professional Background Verified',
                    description: 'Mr. John Smith has 15 years of experience in financial services with no regulatory sanctions found.',
                    severity: 'INFO',
                    source: 'Official regulatory database',
                    verification_level: 'High'
                },
                {
                    id: '2',
                    title: 'Clean Regulatory Record Confirmed',
                    description: 'No adverse regulatory actions or penalties found against the company or its directors.',
                    severity: 'INFO',
                    source: 'SEBI database search',
                    verification_level: 'High'
                }
            ],
            summary: 'Professional analysis completed with comprehensive coverage',
            confidence_level: 'High',
            citations: ['https://official-source.gov.in', 'https://regulatory-database.com']
        },

        medium_quality: {
            content: 'Limited information available for analysis.',
            findings: [
                {
                    id: '1',
                    title: 'Limited Data',
                    description: 'Some information found but incomplete.',
                    severity: 'INFO'
                }
            ],
            summary: 'Partial analysis completed',
            confidence_level: 'Medium'
        },

        low_quality: {
            content: '',
            findings: [],
            summary: null,
            confidence_level: null
        },

        error_data: {
            content: 'Error occurred during processing',
            findings: null,
            summary: 'Failed to process',
            error: 'API timeout'
        }
    }

    const testData = simulateData || testDataScenarios.high_quality

    // Validate data quality
    const qualityReport = DataQualityValidator.validateDataQuality(testData, {
        jobType,
        companyName
    })

    // Generate quality summary
    const qualitySummary = DataQualityValidator.generateQualitySummary(qualityReport)

    return NextResponse.json({
        success: true,
        test_type: 'data_quality_validation',
        results: {
            input_data: testData,
            quality_report: qualityReport,
            quality_summary: qualitySummary,
            validation_passed: qualityReport.overall_score >= 40,
            recommendations: qualityReport.recommendations
        }
    })
}

/**
 * Test professional fallback responses
 */
async function handleProfessionalFallbackTest(
    scenario: string,
    companyName: string,
    jobType: string
) {
    const errorContext: ErrorContext = {
        jobType,
        companyName,
        timestamp: new Date().toISOString()
    }

    // Generate professional fallback response
    const professionalResponse = DeepResearchErrorHandler.generateProfessionalLimitedDataResponse(
        companyName,
        jobType,
        errorContext
    )

    return NextResponse.json({
        success: true,
        test_type: 'professional_fallback',
        scenario,
        results: {
            professional_response: professionalResponse,
            content_length: professionalResponse.content.length,
            maintains_professional_tone: professionalResponse.content.includes('Professional'),
            includes_methodology: professionalResponse.content.includes('methodology'),
            provides_recommendations: professionalResponse.recommendations.length > 0,
            acknowledges_limitations: professionalResponse.limitations.length > 0
        }
    })
}

/**
 * Test circuit breaker functionality
 */
async function handleCircuitBreakerTest(scenario: string) {
    const circuitBreakerStatus = ApiFailureHandler.getCircuitBreakerStatus()

    // Perform health check
    const healthStatus = await ApiFailureHandler.performHealthCheck()

    let testResult = {}

    if (scenario === 'reset') {
        // Reset circuit breakers
        ApiFailureHandler.resetCircuitBreaker('TEST_API')
        testResult = { action: 'Circuit breaker reset for TEST_API' }
    }

    return NextResponse.json({
        success: true,
        test_type: 'circuit_breaker',
        scenario,
        results: {
            circuit_breaker_status: circuitBreakerStatus,
            health_status: healthStatus,
            test_result: testResult
        }
    })
}

export async function GET() {
    return NextResponse.json({
        message: 'Deep Research Error Handling Test Endpoint',
        description: 'POST to this endpoint to test various error handling scenarios',
        available_tests: {
            error_categorization: {
                description: 'Test error categorization and fallback strategies',
                scenarios: ['rate_limit', 'timeout', 'authentication', 'server_error', 'network_error', 'data_quality']
            },
            api_failure_handling: {
                description: 'Test API failure handling with retry logic and circuit breakers',
                scenarios: ['timeout', 'rate_limit', 'server_error', 'auth_error', 'network_error']
            },
            data_quality_validation: {
                description: 'Test data quality validation and scoring',
                note: 'Provide simulate_data object or use built-in test scenarios'
            },
            professional_fallback: {
                description: 'Test professional fallback response generation',
                scenarios: ['limited_data', 'api_failure', 'timeout', 'error']
            },
            circuit_breaker: {
                description: 'Test circuit breaker status and controls',
                scenarios: ['status', 'reset']
            }
        },
        example_request: {
            test_type: 'error_categorization',
            error_scenario: 'rate_limit',
            company_name: 'Test Company Ltd',
            job_type: 'directors_research'
        }
    })
}