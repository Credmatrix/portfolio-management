'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    RiskScoreHeatmap,
    EligibilityMatrix,
    ComplianceHeatmap,
    ParameterScoreRadar
} from '@/components/analytics';
import {
    RiskScoreHeatmapData,
    EligibilityMatrixData,
    ComplianceHeatmapData,
    ParameterScoreRadarData
} from '@/types/analytics.types';

interface RiskAnalyticsDashboardProps {
    riskHeatmapData: RiskScoreHeatmapData | null;
    onCompanySelect: (companyId: string) => void;
    filters?: {
        industries?: string[];
        risk_grades?: string[];
    };
}

export function RiskAnalyticsDashboard({
    riskHeatmapData,
    onCompanySelect,
    filters = {}
}: RiskAnalyticsDashboardProps) {
    // Fetch eligibility data
    const { data: eligibilityResponse, isLoading: eligibilityLoading, error: eligibilityError } = useQuery({
        queryKey: ['analytics', 'eligibility', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.industries?.length) {
                params.set('industries', filters.industries.join(','));
            }
            if (filters.risk_grades?.length) {
                params.set('risk_grades', filters.risk_grades.join(','));
            }

            const response = await fetch(`/api/analytics/eligibility?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch eligibility data');
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Fetch compliance data
    const { data: complianceResponse, isLoading: complianceLoading, error: complianceError } = useQuery({
        queryKey: ['analytics', 'compliance', filters],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (filters.industries?.length) {
                params.set('industries', filters.industries.join(','));
            }

            const response = await fetch(`/api/analytics/compliance?${params}`);
            if (!response.ok) {
                throw new Error('Failed to fetch compliance data');
            }
            return response.json();
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
    });

    // Transform API responses to component data format
    const eligibilityData: EligibilityMatrixData | null = React.useMemo(() => {
        if (!eligibilityResponse?.success || !eligibilityResponse.data?.eligibility_matrix) {
            return null;
        }

        const matrix: EligibilityMatrixData = eligibilityResponse.data.eligibility_matrix;

        return matrix;
    }, [eligibilityResponse]);

    const complianceData: ComplianceHeatmapData | null = React.useMemo(() => {
        if (!complianceResponse?.success || !complianceResponse.data?.compliance_heatmap) {
            return null;
        }

        const heatmap = complianceResponse.data.compliance_heatmap;

        // Transform compliance data for the heatmap
        const companies = Array.from({ length: heatmap.total_companies }, (_, index) => {
            // Distribute companies across compliance statuses based on the data
            const gstStatus = index < heatmap.gst_compliance.compliant ? 'Compliant' :
                index < heatmap.gst_compliance.compliant + heatmap.gst_compliance.non_compliant ? 'Non-Compliant' : 'Unknown';

            const epfoStatus = index < heatmap.epfo_compliance.compliant ? 'Compliant' :
                index < heatmap.epfo_compliance.compliant + heatmap.epfo_compliance.non_compliant ? 'Non-Compliant' : 'Unknown';

            const gstScore = gstStatus === 'Compliant' ? 100 : gstStatus === 'Non-Compliant' ? 0 : 50;
            const epfoScore = epfoStatus === 'Compliant' ? 100 : epfoStatus === 'Non-Compliant' ? 0 : 50;
            const overallScore = (gstScore + epfoScore) / 2;

            // Assign risk grades based on compliance
            const riskGrade = overallScore >= 80 ? 'CM1' :
                overallScore >= 60 ? 'CM2' :
                    overallScore >= 40 ? 'CM3' :
                        overallScore >= 20 ? 'CM4' : 'CM5';

            return {
                id: `company-${index + 1}`,
                name: `Company ${index + 1}`,
                gstCompliance: {
                    status: gstStatus as 'Compliant' | 'Non-Compliant' | 'Unknown',
                    score: gstScore,
                    filingRegularity: gstScore
                },
                epfoCompliance: {
                    status: epfoStatus as 'Compliant' | 'Non-Compliant' | 'Unknown',
                    score: epfoScore,
                    paymentRegularity: epfoScore
                },
                overallComplianceScore: overallScore,
                riskGrade
            };
        });

        return {
            companies
        };
    }, [complianceResponse]);
    // Calculate risk metrics
    const riskMetrics = React.useMemo(() => {
        if (!riskHeatmapData) return null;

        const companies = riskHeatmapData.companies;
        const totalCompanies = companies.length;

        const gradeDistribution = companies.reduce((acc, company) => {
            acc[company.riskGrade] = (acc[company.riskGrade] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const averageRiskScore = companies.reduce((sum, company) => sum + company.riskScore, 0) / totalCompanies;

        const highRiskCount = companies.filter(c => ['CM4', 'CM5'].includes(c.riskGrade)).length;
        const lowRiskCount = companies.filter(c => ['CM1', 'CM2'].includes(c.riskGrade)).length;

        return {
            totalCompanies,
            gradeDistribution,
            averageRiskScore,
            highRiskCount,
            lowRiskCount,
            highRiskPercentage: (highRiskCount / totalCompanies) * 100,
            lowRiskPercentage: (lowRiskCount / totalCompanies) * 100
        };
    }, [riskHeatmapData]);

    // Calculate compliance metrics
    const complianceMetrics = React.useMemo(() => {
        if (!complianceData || !complianceResponse?.data?.compliance_heatmap) return null;

        const heatmap = complianceResponse.data.compliance_heatmap;
        const totalCompanies = heatmap.total_companies;

        const gstCompliant = heatmap.gst_compliance.compliant;
        const epfoCompliant = heatmap.epfo_compliance.compliant;

        // Calculate fully compliant (assuming some overlap)
        const fullyCompliant = Math.min(gstCompliant, epfoCompliant);

        // Calculate average compliance score
        const gstScore = (heatmap.gst_compliance.compliant * 100 + heatmap.gst_compliance.unknown * 50) / totalCompanies;
        const epfoScore = (heatmap.epfo_compliance.compliant * 100 + heatmap.epfo_compliance.unknown * 50) / totalCompanies;
        const averageComplianceScore = (gstScore + epfoScore) / 2;

        return {
            totalCompanies,
            gstCompliant,
            epfoCompliant,
            fullyCompliant,
            gstComplianceRate: (gstCompliant / totalCompanies) * 100,
            epfoComplianceRate: (epfoCompliant / totalCompanies) * 100,
            fullComplianceRate: (fullyCompliant / totalCompanies) * 100,
            averageComplianceScore
        };
    }, [complianceData, complianceResponse]);

    // Loading and error states
    if (eligibilityLoading || complianceLoading) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Card key={i} className="p-6">
                            <div className="animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                            </div>
                        </Card>
                    ))}
                </div>
                <Card className="p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                        <div className="h-32 bg-gray-200 rounded"></div>
                    </div>
                </Card>
            </div>
        );
    }

    if (eligibilityError || complianceError) {
        return (
            <div className="space-y-6">
                <Card className="p-6">
                    <div className="text-center text-red-600">
                        <p className="text-lg font-semibold mb-2">Error Loading Analytics Data</p>
                        <p className="text-sm">
                            {eligibilityError?.message || complianceError?.message || 'Failed to load analytics data'}
                        </p>
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Risk Metrics Overview */}
            {riskMetrics && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Average Risk Score</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {riskMetrics.averageRiskScore.toFixed(1)}%
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <span className="text-blue-600 text-xl">📊</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-sm text-gray-600">
                                Portfolio average
                            </div>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">High Risk Companies</p>
                                <p className="text-2xl font-bold text-red-600">
                                    {riskMetrics.highRiskCount}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-red-100 rounded-lg flex items-center justify-center">
                                <span className="text-red-600 text-xl">⚠️</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Badge variant="destructive">
                                {riskMetrics.highRiskPercentage.toFixed(1)}% of portfolio
                            </Badge>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Low Risk Companies</p>
                                <p className="text-2xl font-bold text-green-600">
                                    {riskMetrics.lowRiskCount}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <span className="text-green-600 text-xl">✅</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <Badge variant="default" className="bg-green-100 text-green-800">
                                {riskMetrics.lowRiskPercentage.toFixed(1)}% of portfolio
                            </Badge>
                        </div>
                    </Card>

                    <Card className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-600">Risk Grades</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {Object.keys(riskMetrics.gradeDistribution).length}
                                </p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <span className="text-purple-600 text-xl">🎯</span>
                            </div>
                        </div>
                        <div className="mt-4">
                            <div className="text-sm text-gray-600">
                                Grade distribution
                            </div>
                        </div>
                    </Card>
                </div>
            )}

            {/* Compliance Metrics */}
            {complianceMetrics && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Compliance Overview</h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {complianceMetrics.averageComplianceScore.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Average Compliance Score</div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">
                                {complianceMetrics.gstComplianceRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">GST Compliant</div>
                            <div className="text-xs text-gray-500">
                                {complianceMetrics.gstCompliant} companies
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
                                {complianceMetrics.epfoComplianceRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">EPFO Compliant</div>
                            <div className="text-xs text-gray-500">
                                {complianceMetrics.epfoCompliant} companies
                            </div>
                        </div>
                        <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">
                                {complianceMetrics.fullComplianceRate.toFixed(1)}%
                            </div>
                            <div className="text-sm text-gray-600">Fully Compliant</div>
                            <div className="text-xs text-gray-500">
                                {complianceMetrics.fullyCompliant} companies
                            </div>
                        </div>
                    </div>
                </Card>
            )}

            {/* Main Risk Analytics Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Score Distribution</h3>
                    {riskHeatmapData ? (
                        <RiskScoreHeatmap
                            data={riskHeatmapData}
                            height={400}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            Loading risk distribution data...
                        </div>
                    )}
                </Card>

                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Credit Eligibility Matrix</h3>
                    {eligibilityData ? (
                        <EligibilityMatrix
                            data={eligibilityData}
                            height={400}
                        />
                    ) : (
                        <div className="h-96 flex items-center justify-center text-gray-500">
                            Loading eligibility data...
                        </div>
                    )}
                </Card>
            </div>

            {/* Compliance Heatmap */}
            <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Compliance Status Heatmap</h3>
                {complianceData ? (
                    <ComplianceHeatmap
                        data={complianceData}
                        height={400}
                    />
                ) : (
                    <div className="h-96 flex items-center justify-center text-gray-500">
                        Loading compliance data...
                    </div>
                )}
            </Card>

            {/* Risk Grade Breakdown */}
            {riskMetrics && (
                <Card className="p-6">
                    <h3 className="text-lg font-semibold mb-4">Risk Grade Breakdown</h3>
                    <div className="space-y-4">
                        {Object.entries(riskMetrics.gradeDistribution)
                            .sort(([a], [b]) => a.localeCompare(b))
                            .map(([grade, count]) => {
                                const percentage = (count / riskMetrics.totalCompanies) * 100;
                                const getGradeColor = (grade: string) => {
                                    switch (grade) {
                                        case 'CM1': return 'bg-green-500';
                                        case 'CM2': return 'bg-blue-500';
                                        case 'CM3': return 'bg-yellow-500';
                                        case 'CM4': return 'bg-orange-500';
                                        case 'CM5': return 'bg-red-500';
                                        default: return 'bg-gray-500';
                                    }
                                };

                                return (
                                    <div key={grade} className="flex items-center space-x-4">
                                        <div className="w-16 text-sm font-medium text-gray-700">
                                            {grade}
                                        </div>
                                        <div className="flex-1 bg-gray-200 rounded-full h-4">
                                            <div
                                                className={`h-4 rounded-full ${getGradeColor(grade)}`}
                                                style={{ width: `${percentage}%` }}
                                            />
                                        </div>
                                        <div className="w-20 text-sm text-gray-600 text-right">
                                            {count} ({percentage.toFixed(1)}%)
                                        </div>
                                    </div>
                                );
                            })}
                    </div>
                </Card>
            )}
        </div>
    );
}