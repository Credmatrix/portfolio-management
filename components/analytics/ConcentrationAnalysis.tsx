'use client';

import React from 'react';

interface ConcentrationData {
    industries: Array<{
        name: string;
        exposure: number;
        riskWeightedExposure: number;
        companyCount: number;
        averageRiskScore: number;
    }>;
    regions: Array<{
        name: string;
        exposure: number;
        riskWeightedExposure: number;
        companyCount: number;
        averageRiskScore: number;
    }>;
    riskGrades: Array<{
        grade: string;
        exposure: number;
        companyCount: number;
        percentage: number;
    }>;
}

interface ConcentrationAnalysisProps {
    data: ConcentrationData;
    height?: number;
    className?: string;
}

export function ConcentrationAnalysis({
    data,
    height = 400,
    className = ''
}: ConcentrationAnalysisProps) {
    const maxIndustryExposure = Math.max(...data.industries.map(i => i.exposure));
    const maxRegionExposure = Math.max(...data.regions.map(r => r.exposure));

    return (
        <div className={`w-full ${className}`} style={{ height }}>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
                {/* Industry Concentration */}
                <div className="space-y-4 pb-10">
                    <h4 className="font-semibold text-gray-900">Industry Concentration</h4>
                    <div className="space-y-3">
                        {data.industries.slice(0, 8).map((industry, index) => (
                            <div key={industry.name} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{industry.name}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">
                                            ₹{(industry.exposure / 10000000).toFixed(1)}Cr
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {industry.companyCount} companies
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-blue-600 h-2 rounded-full relative"
                                        style={{ width: `${(industry.exposure / maxIndustryExposure) * 100}%` }}
                                    >
                                        {/* Risk overlay */}
                                        <div
                                            className="absolute top-0 right-0 h-2 bg-red-400 rounded-r-full"
                                            style={{
                                                width: `${Math.min(industry.averageRiskScore, 100)}%`,
                                                opacity: 0.7
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Risk Score: {industry.averageRiskScore.toFixed(1)}%</span>
                                    <span>{((industry.exposure / data.industries.reduce((sum, i) => sum + i.exposure, 0)) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Regional Concentration */}
                <div className="space-y-4">
                    <h4 className="font-semibold text-gray-900">Regional Concentration</h4>
                    <div className="space-y-3">
                        {data.regions.slice(0, 8).map((region, index) => (
                            <div key={region.name} className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">{region.name}</span>
                                    <div className="text-right">
                                        <div className="text-sm font-semibold">
                                            ₹{(region.exposure / 10000000).toFixed(1)}Cr
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            {region.companyCount} companies
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                        className="bg-green-600 h-2 rounded-full relative"
                                        style={{ width: `${(region.exposure / maxRegionExposure) * 100}%` }}
                                    >
                                        {/* Risk overlay */}
                                        <div
                                            className="absolute top-0 right-0 h-2 bg-red-400 rounded-r-full"
                                            style={{
                                                width: `${Math.min(region.averageRiskScore, 100)}%`,
                                                opacity: 0.7
                                            }}
                                        />
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-gray-500">
                                    <span>Risk Score: {region.averageRiskScore.toFixed(1)}%</span>
                                    <span>{((region.exposure / data.regions.reduce((sum, r) => sum + r.exposure, 0)) * 100).toFixed(1)}%</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Risk Grade Distribution */}
            {/* <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-4">Risk Grade Distribution</h4>
                <div className="flex flex-wrap gap-4">
                    {data.riskGrades.map((grade) => (
                        <div key={grade.grade} className="flex-1 min-w-0">
                            <div className="text-center">
                                <div className="text-lg font-bold text-gray-900">{grade.grade}</div>
                                <div className="text-sm text-gray-600">{grade.companyCount} companies</div>
                                <div className="text-xs text-gray-500">
                                    ₹{(grade.exposure / 10000000).toFixed(1)}Cr ({grade.percentage.toFixed(1)}%)
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div> */}
        </div>
    );
}