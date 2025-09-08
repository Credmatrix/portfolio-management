"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    Building2,
    MapPin,
    Users,
    ArrowLeft,
    DollarSign,
    Clock,
    Map,
    User,
    RefreshCw,
    AlertCircle,
    Plus
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CompanyDataResponse } from '@/lib/zaubacorp/types';

export default function CompanyDetailsPage() {
    const router = useRouter();
    const params = useParams();
    const companyId = params.id as string;

    const [companyData, setCompanyData] = useState<CompanyDataResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (companyId) {
            fetchCompanyData(decodeURIComponent(companyId));
        }
    }, [companyId]);

    const fetchCompanyData = async (id: string) => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch(`/api/company/${encodeURIComponent(id)}`);

            if (!response.ok) {
                throw new Error(`Failed to fetch company data: ${response.status}`);
            }

            const data: CompanyDataResponse = await response.json();

            if (data.success) {
                setCompanyData(data);
            } else {
                setError(data.error_message || 'Failed to fetch company data');
            }
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : 'Data fetch error occurred';
            setError(`Data fetch error: ${errorMessage}`);
            console.error('Company data error:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRequestCreditReport = () => {
        router.push(`/upload?company_id=${encodeURIComponent(companyId)}`);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-neutral-5 p-6">
                <div className="max-w-7xl mx-auto">
                    <Card className="text-center py-12">
                        <RefreshCw className="animate-spin h-8 w-8 text-primary-500 mx-auto mb-4" />
                        <p className="text-neutral-60">Loading company data...</p>
                    </Card>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-neutral-5 p-6">
                <div className="max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/portfolio')}
                            leftIcon={<ArrowLeft className="h-4 w-4" />}
                        >
                            Back to Portfolio
                        </Button>
                    </div>

                    <Card variant="outlined" className="border-error">
                        <div className="flex items-center justify-center p-8">
                            <div className="text-center">
                                <AlertCircle className="h-12 w-12 text-error mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-error mb-2">Failed to Load Company Data</h3>
                                <p className="text-error text-sm mb-4">{error}</p>
                                <Button
                                    variant="outline"
                                    onClick={() => fetchCompanyData(decodeURIComponent(companyId))}
                                >
                                    Try Again
                                </Button>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    if (!companyData) {
        return null;
    }

    const sections = companyData.rc_sections || {};
    const companyName = getCompanyName(sections);

    return (
        <div className="min-h-screen bg-neutral-5 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => router.push('/portfolio')}
                            leftIcon={<ArrowLeft className="h-4 w-4" />}
                        >
                            Back to Portfolio
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold text-neutral-90">
                                {companyName || 'Company Details'}
                            </h1>
                            <p className="text-neutral-60 mt-1">
                                Review company information from ZaubaCorp database
                            </p>
                        </div>
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleRequestCreditReport}
                        leftIcon={<Plus className="h-4 w-4" />}
                    >
                        Request Credit Report
                    </Button>
                </div>

                {/* Company Header */}
                <Card>
                    <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-neutral-90 mb-2">
                                    {companyName || 'Company Information'}
                                </h2>
                                <div className="space-y-1">
                                    <p className="text-neutral-60 text-sm">
                                        Company ID: {companyData.company_id}
                                    </p>
                                    <p className="text-neutral-50 text-xs">
                                        Data extracted: {new Date(companyData.extraction_timestamp).toLocaleString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Key Sections */}
                {sections['Basic Information'] && (
                    <BasicInformationCard sectionData={sections['Basic Information']} />
                )}

                {sections['Key Numbers'] && (
                    <KeyNumbersCard sectionData={sections['Key Numbers']} />
                )}

                {sections['Annual Compliance Status'] && (
                    <AnnualComplianceCard sectionData={sections['Annual Compliance Status']} />
                )}

                {Object.entries(sections).find(([key]) => key.includes('Directors & Key Managerial Personnel')) && (
                    <DirectorsCard
                        sectionData={Object.entries(sections).find(([key]) => key.includes('Directors & Key Managerial Personnel'))![1]}
                    />
                )}

                {sections['Companies with Similar Address'] && (
                    <SimilarAddressCard sectionData={sections['Companies with Similar Address']} />
                )}
            </div>
        </div>
    );
}

// Helper function to extract company name from sections
function getCompanyName(sections: any): string | null {
    const basicInfo = sections['Basic Information'];
    if (basicInfo?.tables?.[0]?.data) {
        const data = basicInfo.tables[0].data;
        for (const item of data) {
            const entries = Object.entries(item);
            for (const [key, value] of entries) {
                if (key.toLowerCase().includes('name') && value) {
                    return value as string;
                }
            }
        }
    }
    return null;
}

// Basic Information Card Component
function BasicInformationCard({ sectionData }: { sectionData: any }) {
    if (!sectionData.tables || !sectionData.tables[0] || !sectionData.tables[0].data) return null;

    const data = sectionData.tables[0].data;
    const items = data.map((item: any) => Object.entries(item)[0]).filter(([key, value]: [string, any]) => key && value);

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-90 flex items-center mb-6">
                    <Building2 className="mr-3 h-5 w-5 text-primary-500" />
                    Basic Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {items.map(([key, value]: [string, any], index: number) => (
                        <div key={index} className="border-l-4 border-primary-500 pl-4 py-2">
                            <dt className="text-sm font-medium text-neutral-60">{key}</dt>
                            <dd className="mt-1 text-sm text-neutral-90 font-semibold">{value}</dd>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// Key Numbers Card Component
function KeyNumbersCard({ sectionData }: { sectionData: any }) {
    if (!sectionData.tables || !sectionData.tables[0] || !sectionData.tables[0].data) return null;

    const data = sectionData.tables[0].data;
    const items = data.map((item: any) => Object.entries(item)[0]).filter(([key, value]: [string, any]) => key && value);

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-90 flex items-center mb-6">
                    <DollarSign className="mr-3 h-5 w-5 text-success" />
                    Key Financial Numbers
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {items.map(([key, value]: [string, any], index: number) => (
                        <div key={index} className="bg-gradient-to-r from-success/10 to-success/5 rounded-lg p-4 border border-success/20">
                            <div className="text-sm font-medium text-success">{key}</div>
                            <div className="text-2xl font-bold text-neutral-90 mt-1">{value}</div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// Annual Compliance Card Component
function AnnualComplianceCard({ sectionData }: { sectionData: any }) {
    if (!sectionData.tables || !sectionData.tables[0] || !sectionData.tables[0].data) return null;

    const data = sectionData.tables[0].data;
    const items = data.map((item: any) => Object.entries(item)[0]).filter(([key, value]: [string, any]) => key && value);

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-90 flex items-center mb-6">
                    <Clock className="mr-3 h-5 w-5 text-warning" />
                    Annual Compliance Status
                </h3>
                <div className="space-y-3">
                    {items.map(([key, value]: [string, any], index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-warning/10 rounded border border-warning/20">
                            <span className="text-sm font-medium text-neutral-80">{key}</span>
                            <span className="text-sm font-semibold text-neutral-90 bg-warning/20 px-3 py-1 rounded-full">
                                {value}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// Directors Card Component
function DirectorsCard({ sectionData }: { sectionData: any }) {
    if (!sectionData.tables || sectionData.tables.length === 0) return null;

    const renderDirectorsTable = (table: any) => {
        if (!table.data || table.data.length === 0) {
            return (
                <div className="text-center py-8 text-neutral-60">
                    <User className="h-12 w-12 mx-auto mb-2 text-neutral-40" />
                    <p>No director information available</p>
                </div>
            );
        }

        if (table.data.length === 1) {
            return (
                <div className="text-center py-8 text-neutral-60">
                    <User className="h-12 w-12 mx-auto mb-2 text-neutral-40" />
                    <p>No data available for this section</p>
                </div>
            );
        }

        const headers = table.data[0];
        const rows = table.data.slice(1);
        const headerKeys = Object.keys(headers).sort();

        return (
            <div className="bg-neutral-0 rounded-lg border border-neutral-20 overflow-hidden">
                <div className="bg-neutral-10 px-4 py-3 border-b border-neutral-20">
                    <h4 className="font-medium text-neutral-90">{table.caption || 'Director Information'}</h4>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-neutral-20">
                        <thead className="bg-neutral-10">
                            <tr>
                                {headerKeys.map(key => (
                                    <th key={key} className="px-6 py-3 text-left text-xs font-medium text-neutral-60 uppercase tracking-wider">
                                        {headers[key]}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="bg-neutral-0 divide-y divide-neutral-20">
                            {rows.map((row: any, index: number) => (
                                <tr key={index} className="hover:bg-neutral-5">
                                    {headerKeys.map(key => (
                                        <td key={key} className="px-6 py-4 whitespace-nowrap text-sm text-neutral-90">
                                            {row[key] || '-'}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-90 flex items-center mb-6">
                    <Users className="mr-3 h-5 w-5 text-info" />
                    Directors & Key Managerial Personnel
                </h3>
                <div className="space-y-6">
                    {sectionData.tables.map((table: any, index: number) => (
                        <div key={index}>
                            {renderDirectorsTable(table)}
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}

// Similar Address Companies Card Component
function SimilarAddressCard({ sectionData }: { sectionData: any }) {
    if (!sectionData.tables || !sectionData.tables[0] || !sectionData.tables[0].data) return null;

    const data = sectionData.tables[0].data;
    if (data.length <= 1) return null; // Only headers

    const companies = data.slice(1); // Skip header row

    return (
        <Card>
            <div className="p-6">
                <h3 className="text-xl font-semibold text-neutral-90 flex items-center mb-6">
                    <Map className="mr-3 h-5 w-5 text-info" />
                    Companies with Similar Address ({companies.length})
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 max-h-96 overflow-y-auto">
                    {companies.map((company: any, index: number) => (
                        <div key={index} className="border border-neutral-20 rounded-lg p-4 hover:shadow-fluent-1 transition-shadow">
                            <div className="flex items-start space-x-3">
                                <Building2 className="h-5 w-5 text-info mt-0.5 flex-shrink-0" />
                                <div className="flex-1 min-w-0">
                                    <h4 className="text-sm font-medium text-neutral-90 truncate">
                                        {company.column_1 || 'Company Name Not Available'}
                                    </h4>
                                    <p className="text-xs text-neutral-60 mt-1">
                                        CIN: {company.column_0 || 'N/A'}
                                    </p>
                                    <p className="text-xs text-neutral-70 mt-2 overflow-hidden max-h-8">
                                        <MapPin className="h-3 w-3 inline mr-1" />
                                        {company.column_2 || 'Address Not Available'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Card>
    );
}