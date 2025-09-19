'use client';

import { CompanyHeader } from '@/app/(dashboard)/portfolio/[requestId]/components/CompanyHeader';
import { CompanyInfoSection } from '@/components/company';
import { Button } from '@/components/ui';
import { Badge } from '@/components/ui/Badge';
import { Card, CardContent } from '@/components/ui/Card';
import { useCompanyDetails } from '@/lib/hooks/useCompanyDetails';
import {
    AlertTriangle,
    ArrowLeft,
    Calendar,
    CheckCircle,
    Clock,
    CreditCard,
    Eye,
    FileText,
    Plus,
    Shield,
    TrendingUp,
    XCircle
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';

interface CompanyRequest {
    request_id: string;
    company_name: string;
    cin?: string;
    pan?: string;
    sector: string;
    credit_rating?: string;
    risk_score?: number;
    recommended_limit?: number;
    currency?: string;
    status: string;
    submitted_at: string;
    completed_at?: string;
    location_city?: string;
    location_state?: string;
    gst_compliance_status?: string;
    epfo_compliance_status?: string;
    extracted_data: any;
    risk_analysis: any;
    processing_summary: any;
    original_filename: string;
    model_type: string;
    industry: string;
    total_parameters?: number;
    available_parameters?: number;
    financial_parameters?: number;
    business_parameters?: number;
    hygiene_parameters?: number;
    banking_parameters?: number;
    credit_management?: any[];
}

interface CompanyData {
    company: {
        name: string;
        cin?: string;
        pan?: string;
        industry: string;
        location: string;
        slug: string;
    };
    latestRequest: CompanyRequest;
    requests: CompanyRequest[];
    requestsByStatus: {
        completed: CompanyRequest[];
        processing: CompanyRequest[];
        failed: CompanyRequest[];
        submitted: CompanyRequest[];
    };
    summary: {
        totalRequests: number;
        completedRequests: number;
        processingRequests: number;
        failedRequests: number;
        submittedRequests: number;
        latestRiskScore?: number;
        latestCreditRating?: string;
        latestRecommendedLimit?: number;
        hasActiveCreditManagement: boolean;
    };
}

export default function CompanyDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const slug = params.slug as string;

    const [selectedTab, setSelectedTab] = useState<'all' | 'completed' | 'processing' | 'failed' | 'submitted'>('all');
    const { companyData, loading, error, refetch } = useCompanyDetails(slug);

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'processing':
                return <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
            case 'failed':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'submitted':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertTriangle className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'completed':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'processing':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'failed':
                return 'bg-red-100 text-red-800 border-red-200';
            case 'submitted':
                return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatCurrency = (amount?: number) => {
        if (!amount) return '-';
        if (amount >= 10000000) {
            return `₹${(amount / 10000000).toFixed(1)}Cr`;
        } else if (amount >= 100000) {
            return `₹${(amount / 100000).toFixed(1)}L`;
        } else {
            return `₹${amount.toFixed(0)}`;
        }
    };

    const getDisplayRequests = () => {
        if (!companyData) return [];

        switch (selectedTab) {
            case 'completed':
                return companyData.requestsByStatus.completed;
            case 'processing':
                return companyData.requestsByStatus.processing;
            case 'failed':
                return companyData.requestsByStatus.failed;
            case 'submitted':
                return companyData.requestsByStatus.submitted;
            default:
                return companyData.requests;
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse">
                    <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
                    <div className="h-64 bg-gray-200 rounded mb-6"></div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="h-24 bg-gray-200 rounded"></div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="p-6">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                    <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-red-800 mb-2">Error</h3>
                    <p className="text-red-600 mb-4">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => router.back()} variant="outline">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Go Back
                        </Button>
                        <Button onClick={refetch}>
                            Try Again
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    if (!companyData) {
        return null;
    }

    return (
        <div className="p-6">
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-600 mb-6">
                <Link href="/companies" className="hover:text-blue-600">
                    Companies
                </Link>
                <span>/</span>
                <span className="text-gray-900">{companyData.company.name}</span>
            </div>

            {/* Company Header */}
            <div className="mb-6">
                <CompanyHeader
                    company={companyData.latestRequest as any}
                    isCollapsed={false}
                />
            </div>

            {/* Company Information Section */}
            <div className="mb-6">
                <CompanyInfoSection company={companyData.latestRequest as any} />
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Total Requests</p>
                                <p className="text-2xl font-bold text-gray-900">{companyData.summary.totalRequests}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-lg">
                                <FileText className="w-6 h-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Completed</p>
                                <p className="text-2xl font-bold text-green-700">{companyData.summary.completedRequests}</p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-lg">
                                <CheckCircle className="w-6 h-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Latest Risk Score</p>
                                <p className="text-2xl font-bold text-orange-700">
                                    {companyData.summary.latestRiskScore?.toFixed(1) || 'N/A'}
                                    {companyData.summary.latestRiskScore && '%'}
                                </p>
                            </div>
                            <div className="p-3 bg-orange-100 rounded-lg">
                                <Shield className="w-6 h-6 text-orange-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Credit Limit</p>
                                <p className="text-2xl font-bold text-purple-700">
                                    {formatCurrency(companyData.summary.latestRecommendedLimit)}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-lg">
                                <CreditCard className="w-6 h-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Actions */}
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Credit Reports</h2>
                <Link href="/upload">
                    <Button className="flex items-center gap-2">
                        <Plus className="w-4 h-4" />
                        New Credit Report
                    </Button>
                </Link>
            </div>

            {/* Status Tabs */}
            <div className="flex gap-2 mb-6 border-b border-gray-200">
                {[
                    { key: 'all', label: 'All', count: companyData.summary.totalRequests },
                    { key: 'completed', label: 'Completed', count: companyData.summary.completedRequests },
                    { key: 'processing', label: 'Processing', count: companyData.summary.processingRequests },
                    { key: 'failed', label: 'Failed', count: companyData.summary.failedRequests },
                    { key: 'submitted', label: 'Submitted', count: companyData.summary.submittedRequests }
                ].map((tab) => (
                    <button
                        key={tab.key}
                        onClick={() => setSelectedTab(tab.key as any)}
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${selectedTab === tab.key
                            ? 'border-blue-500 text-blue-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        {tab.label} ({tab.count})
                    </button>
                ))}
            </div>

            {/* Requests List */}
            <div className="space-y-4">
                {getDisplayRequests().map((request) => (
                    <Card key={request.request_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-start gap-4">
                                    <div className="p-2 bg-gray-100 rounded-lg">
                                        <FileText className="w-5 h-5 text-gray-600" />
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-3">
                                            <h3 className="font-medium text-gray-900">
                                                {request.original_filename}
                                            </h3>
                                            <Badge className={`${getStatusColor(request.status)} border`}>
                                                <div className="flex items-center gap-1">
                                                    {getStatusIcon(request.status)}
                                                    {request.status}
                                                </div>
                                            </Badge>
                                            <Badge variant="outline">
                                                {request.industry.replace('-', ' ').toUpperCase()}
                                            </Badge>
                                        </div>

                                        <div className="flex items-center gap-6 text-sm text-gray-600">
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-4 h-4" />
                                                Submitted: {formatDate(request.submitted_at)}
                                            </span>
                                            {request.completed_at && (
                                                <span className="flex items-center gap-1">
                                                    <CheckCircle className="w-4 h-4" />
                                                    Completed: {formatDate(request.completed_at)}
                                                </span>
                                            )}
                                        </div>

                                        {request.status === 'completed' && (
                                            <div className="flex items-center gap-6 text-sm">
                                                {request.risk_score && (
                                                    <span className="flex items-center gap-1">
                                                        <Shield className="w-4 h-4 text-orange-500" />
                                                        Risk Score: <strong>{request.risk_score.toFixed(1)}%</strong>
                                                    </span>
                                                )}
                                                {request.credit_rating && (
                                                    <span className="flex items-center gap-1">
                                                        <TrendingUp className="w-4 h-4 text-blue-500" />
                                                        Rating: <strong>{request.credit_rating}</strong>
                                                    </span>
                                                )}
                                                {request.recommended_limit && (
                                                    <span className="flex items-center gap-1">
                                                        <CreditCard className="w-4 h-4 text-green-500" />
                                                        Limit: <strong>{formatCurrency(request.recommended_limit)}</strong>
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    {request.status === 'completed' && (
                                        <Link href={`/portfolio/${request.request_id}`}>
                                            <Button variant="outline" size="sm">
                                                <Eye className="w-4 h-4 mr-2" />
                                                View Details
                                            </Button>
                                        </Link>
                                    )}

                                    {request.status === 'processing' && (
                                        <Button variant="outline" size="sm" disabled>
                                            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
                                            Processing
                                        </Button>
                                    )}

                                    {request.status === 'failed' && (
                                        <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50">
                                            <XCircle className="w-4 h-4 mr-2" />
                                            Failed
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {getDisplayRequests().length === 0 && (
                    <Card>
                        <CardContent className="p-12 text-center">
                            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No {selectedTab !== 'all' ? selectedTab : ''} requests found
                            </h3>
                            <p className="text-gray-600 mb-4">
                                {selectedTab === 'all'
                                    ? 'This company has no credit reports yet.'
                                    : `No ${selectedTab} requests for this company.`
                                }
                            </p>
                            <Link href="/upload">
                                <Button>
                                    <Plus className="w-4 h-4 mr-2" />
                                    Create New Report
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}