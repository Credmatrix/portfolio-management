'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { PortfolioCompany, CompanyDetailResponse } from '@/types/portfolio.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
// import { useRealtimeStatus } from '@/lib/services/realtime-status.service'
import {
    ArrowLeft,
    Building2,
    Download,
    Edit,
    AlertTriangle,
    RefreshCw,
    Trash2,
    FileText,
    ExternalLink,
    MessageSquare,
    Sparkles
} from 'lucide-react'

// Import the section components
import { CompanyHeader } from './components/CompanyHeader'
import { RiskAssessmentSection } from './components/RiskAssessmentSection'
import { CreditEligibilitySection } from './components/CreditEligibilitySection'
import { FinancialDataSection } from './components/FinancialDataSection'
import { ComplianceSection } from './components/ComplianceSection'
import { DirectorsSection } from './components/DirectorsSection'
import { ParameterBreakdownSection } from './components/ParameterBreakdownSection'
import { CreditManagementSection } from './components/CreditManagementSection'

// Import AI Chat components
import { ChatBot } from '@/components/chat'

interface CompanyDetailPageProps { }

export default function CompanyDetailPage({ }: CompanyDetailPageProps) {
    const params = useParams()
    const router = useRouter()
    const requestId = params.requestId as string

    const [company, setCompany] = useState<PortfolioCompany | null>(null)
    const [relatedCompanies, setRelatedCompanies] = useState<PortfolioCompany[]>([])
    const [industryBenchmarks, setIndustryBenchmarks] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isRetrying, setIsRetrying] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

    // Real-time status monitoring
    // const { status: realtimeStatus, isConnected } = useRealtimeStatus(requestId)

    useEffect(() => {
        if (requestId) {
            fetchCompanyDetails()
        }
    }, [requestId])

    const fetchCompanyDetails = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/portfolio/${requestId}`)

            if (!response.ok) {
                throw new Error(`Failed to fetch company details: ${response.statusText}`)
            }

            const data: CompanyDetailResponse = await response.json()

            setCompany(data.company)
            setRelatedCompanies(data.related_companies || [])
            setIndustryBenchmarks(data.industry_benchmarks)
        } catch (err) {
            console.error('Error fetching company details:', err)
            setError(err instanceof Error ? err.message : 'Failed to load company details')
        } finally {
            setLoading(false)
        }
    }

    // Update company status from real-time updates
    // useEffect(() => {
    //     if (realtimeStatus && company) {
    //         setCompany(prev => prev ? {
    //             ...prev,
    //             status: realtimeStatus.status,
    //             error_message: realtimeStatus.error_message,
    //             completed_at: realtimeStatus.completed_at,
    //             processing_started_at: realtimeStatus.processing_started_at
    //         } : null)
    //     }
    // }, [realtimeStatus, company])

    const handleDownloadReport = async () => {
        try {
            // Get status first to get the download URL
            const response = await fetch(`/api/upload/status/${requestId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.download_url) {
                    // Create temporary link to trigger download
                    const link = document.createElement('a')
                    link.href = data.download_url
                    link.download = data.pdf_filename || `${requestId}_report.pdf`
                    link.target = '_blank'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                } else {
                    alert('Report download URL not available')
                }
            } else {
                const errorData = await response.json()
                alert(errorData.error || 'Failed to get download URL')
            }
        } catch (error) {
            console.error('Error downloading report:', error)
            alert('Failed to download report')
        }
    }

    const handleDownloadOriginal = async () => {
        try {
            const response = await fetch(`/api/upload/download-original/${requestId}`)
            if (response.ok) {
                const data = await response.json()
                if (data.download_url) {
                    const link = document.createElement('a')
                    link.href = data.download_url
                    link.download = data.filename || 'original_file'
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                } else {
                    alert('Original file download URL not available')
                }
            } else {
                const errorData = await response.json()
                alert(errorData.error || 'Failed to get download URL')
            }
        } catch (error) {
            console.error('Error downloading original file:', error)
            alert('Failed to download original file')
        }
    }

    const handleRetry = async () => {
        // if (!company || company.status !== 'failed') return

        setIsRetrying(true)
        try {
            const response = await fetch(`/api/upload/retry/${requestId}`, {
                method: 'POST'
            })

            const result = await response.json()

            if (response.ok) {
                // Update company status optimistically
                setCompany(prev => prev ? {
                    ...prev,
                    status: 'processing',
                    error_message: null,
                    processing_started_at: new Date().toISOString()
                } : null)

                alert('Processing retry initiated successfully')
            } else {
                alert(result.error || 'Failed to retry processing')
            }
        } catch (error) {
            console.error('Error retrying processing:', error)
            alert('Failed to retry processing')
        } finally {
            setIsRetrying(false)
        }
    }

    const handleDelete = async () => {
        if (!company) return

        const confirmDelete = window.confirm(
            `Are you sure you want to delete ${company.company_name}? This action cannot be undone.`
        )

        if (!confirmDelete) return

        setIsDeleting(true)
        try {
            const response = await fetch(`/api/portfolio/${requestId}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (response.ok) {
                alert('Company deleted successfully')
                router.push('/portfolio')
            } else {
                alert(result.error || 'Failed to delete company')
            }
        } catch (error) {
            console.error('Error deleting company:', error)
            alert('Failed to delete company')
        } finally {
            setIsDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-10 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header Skeleton */}
                    <div className="flex items-center gap-4 mb-6">
                        <Skeleton className="w-10 h-10 rounded-lg" />
                        <div className="space-y-2">
                            <Skeleton className="w-64 h-8" />
                            <Skeleton className="w-32 h-4" />
                        </div>
                    </div>

                    {/* Content Skeletons */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Skeleton className="w-full h-64" />
                            <Skeleton className="w-full h-96" />
                        </div>
                        <div className="space-y-6">
                            <Skeleton className="w-full h-48" />
                            <Skeleton className="w-full h-32" />
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-10 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </div>

                    <Alert variant="error" className="max-w-2xl">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                            <h3 className="font-semibold">Error Loading Company Details</h3>
                            <p className="text-sm mt-1">{error}</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={fetchCompanyDetails}
                                className="mt-3"
                            >
                                Try Again
                            </Button>
                        </div>
                    </Alert>
                </div>
            </div>
        )
    }

    if (!company) {
        return (
            <div className="min-h-screen bg-neutral-10 p-6">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center gap-4 mb-6">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.back()}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Button>
                    </div>

                    <Alert variant="warning" className="max-w-2xl">
                        <AlertTriangle className="w-5 h-5" />
                        <div>
                            <h3 className="font-semibold">Company Not Found</h3>
                            <p className="text-sm mt-1">The requested company could not be found.</p>
                        </div>
                    </Alert>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-neutral-10">
            {/* Navigation Header */}
            <div className="bg-white border-b border-neutral-20 px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/portfolio')}
                            className="flex items-center gap-2"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back to Portfolio
                        </Button>
                        <div className="h-6 w-px bg-neutral-30" />
                        <div className="flex items-center gap-2 text-sm text-neutral-60">
                            <span>Portfolio</span>
                            <span>/</span>
                            <span className="text-neutral-90 font-medium">
                                {company.company_name || 'Company Details'}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        {/* Status indicator */}
                        {/* {company && (
                            <div className="flex items-center gap-2">
                                <Badge
                                    variant={
                                        company.status === 'completed' ? 'success' :
                                            company.status === 'processing' ? 'info' :
                                                company.status === 'failed' ? 'error' : 'secondary'
                                    }
                                    className="flex items-center gap-1"
                                >
                                    {company.status === 'processing' && (
                                        <RefreshCw className="w-3 h-3 animate-spin" />
                                    )}
                                    {company.status}
                                </Badge>
                                {isConnected && (
                                    <div className="w-2 h-2 bg-green-500 rounded-full" title="Real-time updates active" />
                                )}
                            </div>
                        )} */}

                        {/* Action buttons */}
                        <div className="flex items-center gap-2">
                            {company?.status === 'completed' && (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadReport}
                                        className="flex items-center gap-2"
                                    >
                                        <Download className="w-4 h-4" />
                                        PDF Report
                                    </Button>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleDownloadOriginal}
                                        className="flex items-center gap-2"
                                    >
                                        <FileText className="w-4 h-4" />
                                        Original File
                                    </Button>
                                </>
                            )}

                            {company.status !== 'processing' && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={handleRetry}
                                    disabled={isRetrying}
                                    className="flex items-center gap-2"
                                >
                                    <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                                    {isRetrying ? 'Retrying...' : 'Retry Processing'}
                                </Button>
                            )}

                            {/* <Button
                                variant="outline"
                                size="sm"
                                className="flex items-center gap-2"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Details
                            </Button>

                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:border-red-300"
                            >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </Button> */}
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="space-y-8">
                    {/* Company Header */}
                    <CompanyHeader
                        company={company}
                        industryBenchmarks={industryBenchmarks}
                    />

                    {/* Main Content Grid */}
                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                        {/* Left Column - Main Content */}
                        <div className="xl:col-span-3 space-y-8">
                            {/* Risk Assessment Section */}
                            {/* Credit Management Section */}
                            <CreditManagementSection
                                requestId={requestId}
                            />
                            <RiskAssessmentSection
                                company={company}
                                industryBenchmarks={industryBenchmarks}
                            />

                            {/* Financial Data Section */}
                            <FinancialDataSection
                                company={company}
                                industryBenchmarks={industryBenchmarks}
                            />
                            {/* Directors Section */}
                            <DirectorsSection
                                company={company}
                            />

                            {/* Parameter Breakdown Section */}
                            <ParameterBreakdownSection
                                company={company}
                            />


                        </div>

                        {/* Right Column - Sidebar */}
                        <div className="xl:col-span-1 space-y-6">
                            {/* Credit Eligibility Section */}
                            <CreditEligibilitySection
                                company={company}
                            />

                            {/* Compliance Section */}
                            <ComplianceSection
                                company={company}
                            />

                            {/* Related Companies */}
                            {relatedCompanies.length > 0 && (
                                <Card>
                                    <CardHeader>
                                        <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                            <Building2 className="w-5 h-5" />
                                            Related Companies
                                        </h3>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        {relatedCompanies.slice(0, 3).map((relatedCompany) => (
                                            <div
                                                key={relatedCompany.request_id}
                                                className="p-3 bg-neutral-5 rounded-lg hover:bg-neutral-10 cursor-pointer transition-colors"
                                                onClick={() => router.push(`/portfolio/${relatedCompany.request_id}`)}
                                            >
                                                <div className="font-medium text-sm text-neutral-90 mb-1">
                                                    {relatedCompany.company_name}
                                                </div>
                                                <div className="flex items-center justify-between text-xs text-neutral-60">
                                                    <span>{relatedCompany.industry}</span>
                                                    <Badge
                                                        variant={relatedCompany.risk_grade === 'CM1' ? 'success' :
                                                            relatedCompany.risk_grade === 'CM2' ? 'info' :
                                                                relatedCompany.risk_grade === 'CM3' ? 'warning' : 'error'}
                                                        size="sm"
                                                    >
                                                        {relatedCompany.risk_grade}
                                                    </Badge>
                                                </div>
                                            </div>
                                        ))}
                                    </CardContent>
                                </Card>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* AI Chat Bot */}
            {company?.status === 'completed' && (
                <ChatBot
                    requestId={requestId}
                    company={company}
                />
            )}
        </div>
    )
}