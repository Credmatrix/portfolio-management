'use client';

import { useState, useEffect } from 'react';

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

interface UseCompanyDetailsResult {
    companyData: CompanyData | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

export function useCompanyDetails(slug: string): UseCompanyDetailsResult {
    const [companyData, setCompanyData] = useState<CompanyData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompanyData = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`/api/companies/${slug}`);

            if (!response.ok) {
                if (response.status === 404) {
                    setError('Company not found');
                } else if (response.status === 401) {
                    setError('Unauthorized access');
                } else {
                    setError('Failed to fetch company data');
                }
                return;
            }

            const data = await response.json();
            setCompanyData(data);
        } catch (err) {
            setError('An error occurred while fetching company data');
            console.error('Error fetching company data:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (slug) {
            fetchCompanyData();
        }
    }, [slug]);

    return {
        companyData,
        loading,
        error,
        refetch: fetchCompanyData
    };
}