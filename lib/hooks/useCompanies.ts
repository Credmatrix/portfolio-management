'use client';

import { useState, useEffect } from 'react';
import { CompanyListItem, CompanyMetrics, CompanyFilters, CompanyPagination } from '@/types/company.types';

interface UseCompaniesResult {
    companies: CompanyListItem[];
    metrics: CompanyMetrics | null;
    pagination: CompanyPagination | null;
    loading: boolean;
    error: string | null;
    refetch: () => void;
}

interface UseCompaniesOptions {
    filters: CompanyFilters;
    page: number;
    limit: number;
}

export function useCompanies({ filters, page, limit }: UseCompaniesOptions): UseCompaniesResult {
    const [companies, setCompanies] = useState<CompanyListItem[]>([]);
    const [metrics, setMetrics] = useState<CompanyMetrics | null>(null);
    const [pagination, setPagination] = useState<CompanyPagination | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            setError(null);

            // Build query parameters
            const params = new URLSearchParams({
                page: page.toString(),
                limit: limit.toString(),
                ...(filters.search && { search: filters.search }),
                ...(filters.industry && filters.industry !== 'all' && { industry: filters.industry }),
                ...(filters.status && filters.status !== 'all' && { status: filters.status }),
                ...(filters.creditRating && filters.creditRating !== 'all' && { creditRating: filters.creditRating }),
            });

            const [companiesResponse, metricsResponse] = await Promise.all([
                fetch(`/api/companies?${params}`),
                fetch('/api/companies/metrics')
            ]);

            if (!companiesResponse.ok) {
                throw new Error('Failed to fetch companies');
            }

            if (!metricsResponse.ok) {
                throw new Error('Failed to fetch metrics');
            }

            const companiesData = await companiesResponse.json();
            const metricsData = await metricsResponse.json();

            setCompanies(companiesData.companies || []);
            setPagination(companiesData.pagination);
            setMetrics(metricsData);

        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
            console.error('Error fetching companies:', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCompanies();
    }, [filters.search, filters.industry, filters.status, filters.creditRating, page, limit]);

    return {
        companies,
        metrics,
        pagination,
        loading,
        error,
        refetch: fetchCompanies
    };
}