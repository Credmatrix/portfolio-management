'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';

interface ExportConfig {
    format: 'csv' | 'excel' | 'pdf' | 'json';
    dataType: 'portfolio' | 'companies' | 'analytics' | 'compliance';
    fields: string[];
    filters: {
        industries: string[];
        riskGrades: string[];
        dateRange: {
            start: string;
            end: string;
        };
    };
    includeHeaders: boolean;
    includeMetadata: boolean;
}

interface ExportFunctionalityProps {
    onExportComplete?: (downloadUrl: string) => void;
    className?: string;
}

export function ExportFunctionality({ onExportComplete, className = '' }: ExportFunctionalityProps) {
    const [exportConfig, setExportConfig] = useState<ExportConfig>({
        format: 'csv',
        dataType: 'portfolio',
        fields: [],
        filters: {
            industries: [],
            riskGrades: [],
            dateRange: { start: '', end: '' }
        },
        includeHeaders: true,
        includeMetadata: false
    });
    const [isExporting, setIsExporting] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const formatOptions = [
        { value: 'csv', label: 'CSV (Comma Separated Values)', description: 'Best for spreadsheet applications' },
        { value: 'excel', label: 'Excel Workbook (.xlsx)', description: 'Formatted Excel file with multiple sheets' },
        { value: 'pdf', label: 'PDF Document', description: 'Formatted report document' },
        { value: 'json', label: 'JSON Data', description: 'Raw data in JSON format' }
    ];

    const dataTypeOptions = [
        { value: 'portfolio', label: 'Portfolio Overview', description: 'Summary data and key metrics' },
        { value: 'companies', label: 'Company Details', description: 'Detailed company information and scores' },
        { value: 'analytics', label: 'Analytics Data', description: 'Risk analysis and performance metrics' },
        { value: 'compliance', label: 'Compliance Data', description: 'GST and EPFO compliance information' }
    ];

    const fieldOptions = {
        portfolio: [
            { id: 'total_companies', name: 'Total Companies', category: 'summary' },
            { id: 'total_exposure', name: 'Total Exposure', category: 'summary' },
            { id: 'risk_distribution', name: 'Risk Distribution', category: 'risk' },
            { id: 'industry_breakdown', name: 'Industry Breakdown', category: 'industry' },
            { id: 'performance_metrics', name: 'Performance Metrics', category: 'performance' }
        ],
        companies: [
            { id: 'company_name', name: 'Company Name', category: 'basic' },
            { id: 'industry', name: 'Industry', category: 'basic' },
            { id: 'risk_score', name: 'Risk Score', category: 'risk' },
            { id: 'risk_grade', name: 'Risk Grade', category: 'risk' },
            { id: 'recommended_limit', name: 'Recommended Limit', category: 'financial' },
            { id: 'financial_data', name: 'Financial Data', category: 'financial' },
            { id: 'compliance_status', name: 'Compliance Status', category: 'compliance' },
            { id: 'directors', name: 'Directors Information', category: 'governance' },
            { id: 'charges', name: 'Charges & Securities', category: 'legal' }
        ],
        analytics: [
            { id: 'parameter_scores', name: 'Parameter Scores', category: 'risk' },
            { id: 'benchmark_comparison', name: 'Benchmark Comparison', category: 'performance' },
            { id: 'trend_analysis', name: 'Trend Analysis', category: 'performance' },
            { id: 'peer_analysis', name: 'Peer Analysis', category: 'comparison' },
            { id: 'model_performance', name: 'Model Performance', category: 'validation' }
        ],
        compliance: [
            { id: 'gst_records', name: 'GST Records', category: 'gst' },
            { id: 'epfo_records', name: 'EPFO Records', category: 'epfo' },
            { id: 'filing_status', name: 'Filing Status', category: 'compliance' },
            { id: 'compliance_scores', name: 'Compliance Scores', category: 'scoring' },
            { id: 'audit_qualifications', name: 'Audit Qualifications', category: 'audit' }
        ]
    };

    const industryOptions = [
        { value: 'manufacturing', label: 'Manufacturing' },
        { value: 'services', label: 'Services' },
        { value: 'trading', label: 'Trading' },
        { value: 'construction', label: 'Construction' },
        { value: 'technology', label: 'Technology' }
    ];

    const riskGradeOptions = [
        { value: 'CM1', label: 'CM1 (Excellent)' },
        { value: 'CM2', label: 'CM2 (Good)' },
        { value: 'CM3', label: 'CM3 (Average)' },
        { value: 'CM4', label: 'CM4 (Poor)' },
        { value: 'CM5', label: 'CM5 (Critical)' }
    ];

    const handleConfigChange = (key: keyof ExportConfig, value: any) => {
        setExportConfig(prev => ({
            ...prev,
            [key]: value
        }));
    };

    const handleFieldToggle = (fieldId: string) => {
        setExportConfig(prev => ({
            ...prev,
            fields: prev.fields.includes(fieldId)
                ? prev.fields.filter(id => id !== fieldId)
                : [...prev.fields, fieldId]
        }));
    };

    const handleFilterChange = (filterType: string, value: any) => {
        setExportConfig(prev => ({
            ...prev,
            filters: {
                ...prev.filters,
                [filterType]: value
            }
        }));
    };

    const exportData = async () => {
        if (exportConfig.fields.length === 0) {
            setToastMessage('Please select at least one field to export');
            setShowToast(true);
            return;
        }

        setIsExporting(true);

        try {
            const response = await fetch('/api/reports/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...exportConfig,
                    exportedAt: new Date().toISOString()
                })
            });

            if (!response.ok) {
                throw new Error('Export failed');
            }

            const result = await response.json();

            // Trigger download
            const link = document.createElement('a');
            link.href = result.downloadUrl;
            link.download = result.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            setToastMessage(`Data exported successfully as ${exportConfig.format.toUpperCase()}`);
            setShowToast(true);

            if (onExportComplete) {
                onExportComplete(result.downloadUrl);
            }

        } catch (error) {
            console.error('Export error:', error);
            setToastMessage('Export failed. Please try again.');
            setShowToast(true);
        } finally {
            setIsExporting(false);
        }
    };

    const currentFields = fieldOptions[exportConfig.dataType] || [];
    const selectedFormat = formatOptions.find(f => f.value === exportConfig.format);
    const selectedDataType = dataTypeOptions.find(d => d.value === exportConfig.dataType);

    return (
        <div className={`space-y-6 ${className}`}>
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Export Data</h3>

                <div className="space-y-6">
                    {/* Format Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Export Format
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {formatOptions.map(format => (
                                <div
                                    key={format.value}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${exportConfig.format === format.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => handleConfigChange('format', format.value)}
                                >
                                    <div className="font-medium text-gray-900">{format.label}</div>
                                    <div className="text-sm text-gray-600">{format.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Data Type Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Data Type
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {dataTypeOptions.map(dataType => (
                                <div
                                    key={dataType.value}
                                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${exportConfig.dataType === dataType.value
                                        ? 'border-blue-500 bg-blue-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    onClick={() => {
                                        handleConfigChange('dataType', dataType.value);
                                        handleConfigChange('fields', []); // Reset fields when data type changes
                                    }}
                                >
                                    <div className="font-medium text-gray-900">{dataType.label}</div>
                                    <div className="text-sm text-gray-600">{dataType.description}</div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Field Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Fields to Export
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {currentFields.map(field => (
                                <div key={field.id} className="flex items-center space-x-2">
                                    <Checkbox
                                        checked={exportConfig.fields.includes(field.id)}
                                        onChange={() => handleFieldToggle(field.id)}
                                    />
                                    <span className="text-sm text-gray-700">{field.name}</span>
                                    <Badge variant="outline" className="text-xs">
                                        {field.category}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        {currentFields.length > 0 && (
                            <div className="flex space-x-2 mt-3">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfigChange('fields', currentFields.map(f => f.id))}
                                >
                                    Select All
                                </Button>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleConfigChange('fields', [])}
                                >
                                    Clear All
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Export Filters</h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Industries
                                </label>
                                {/* <Select
                                    value=""
                                    onChange={(value) => {
                                        if (value && !exportConfig.filters.industries.includes(value)) {
                                            handleFilterChange('industries', [...exportConfig.filters.industries, value]);
                                        }
                                    }}
                                    options={industryOptions}
                                    placeholder="Add industry"
                                /> */}
                                {/* <div className="flex flex-wrap gap-1 mt-2">
                                    {exportConfig.filters.industries.map(industry => (
                                        <Badge
                                            key={industry}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => handleFilterChange('industries',
                                                exportConfig.filters.industries.filter(i => i !== industry)
                                            )}
                                        >
                                            {industry} ×
                                        </Badge>
                                    ))}
                                </div> */}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Risk Grades
                                </label>
                                {/* <Select
                                    value=""
                                    onChange={(value) => {
                                        if (value && !exportConfig.filters.riskGrades.includes(value)) {
                                            handleFilterChange('riskGrades', [...exportConfig.filters.riskGrades, value]);
                                        }
                                    }}
                                    options={riskGradeOptions}
                                    placeholder="Add risk grade"
                                /> */}
                                {/* <div className="flex flex-wrap gap-1 mt-2">
                                    {exportConfig.filters.riskGrades.map(grade => (
                                        <Badge
                                            key={grade}
                                            variant="secondary"
                                            className="cursor-pointer"
                                            onClick={() => handleFilterChange('riskGrades',
                                                exportConfig.filters.riskGrades.filter(g => g !== grade)
                                            )}
                                        >
                                            {grade} ×
                                        </Badge>
                                    ))}
                                </div> */}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={exportConfig.filters.dateRange.start}
                                    onChange={(e) => handleFilterChange('dateRange', {
                                        ...exportConfig.filters.dateRange,
                                        start: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={exportConfig.filters.dateRange.end}
                                    onChange={(e) => handleFilterChange('dateRange', {
                                        ...exportConfig.filters.dateRange,
                                        end: e.target.value
                                    })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Export Options */}
                    <div className="border-t pt-4">
                        <h4 className="font-medium text-gray-900 mb-3">Export Options</h4>

                        <div className="space-y-3">
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={exportConfig.includeHeaders}
                                    onChange={(checked) => handleConfigChange('includeHeaders', checked)}
                                />
                                <span className="text-sm text-gray-700">Include column headers</span>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    checked={exportConfig.includeMetadata}
                                    onChange={(checked) => handleConfigChange('includeMetadata', checked)}
                                />
                                <span className="text-sm text-gray-700">Include export metadata (timestamp, filters, etc.)</span>
                            </div>
                        </div>
                    </div>

                    {/* Export Summary */}
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Export Summary</h4>
                        <div className="text-sm text-gray-600 space-y-1">
                            <div><strong>Format:</strong> {selectedFormat?.label}</div>
                            <div><strong>Data Type:</strong> {selectedDataType?.label}</div>
                            <div><strong>Fields:</strong> {exportConfig.fields.length} selected</div>
                            <div><strong>Filters:</strong> {
                                exportConfig.filters.industries.length + exportConfig.filters.riskGrades.length > 0
                                    ? `${exportConfig.filters.industries.length + exportConfig.filters.riskGrades.length} applied`
                                    : 'None'
                            }</div>
                        </div>
                    </div>

                    {/* Export Button */}
                    <div className="flex justify-end pt-4 border-t">
                        <Button
                            onClick={exportData}
                            disabled={isExporting || exportConfig.fields.length === 0}
                            className="px-6"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Exporting...
                                </>
                            ) : (
                                `Export as ${exportConfig.format.toUpperCase()}`
                            )}
                        </Button>
                    </div>
                </div>
            </Card>

            {/* Toast Notification */}
            {/* {showToast && (
                <Toast
                    message={toastMessage}
                    type={toastMessage.includes('successfully') ? 'success' : 'error'}
                    onClose={() => setShowToast(false)}
                />
            )} */}
        </div>
    );
}