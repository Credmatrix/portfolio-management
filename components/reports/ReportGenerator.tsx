'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Badge } from '@/components/ui/Badge';
import { Toast } from '@/components/ui/Toast';

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    sections: string[];
    format: 'pdf' | 'excel' | 'csv';
    category: 'portfolio' | 'risk' | 'compliance' | 'financial';
}

interface ReportFilter {
    industries: string[];
    riskGrades: string[];
    regions: string[];
    dateRange: {
        start: string;
        end: string;
    };
    companyIds?: string[];
}

interface ReportGeneratorProps {
    onReportGenerated?: (reportId: string) => void;
    className?: string;
}

export function ReportGenerator({ onReportGenerated, className = '' }: ReportGeneratorProps) {
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');
    const [reportName, setReportName] = useState('');
    const [reportDescription, setReportDescription] = useState('');
    const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'excel' | 'csv'>('pdf');
    const [filters, setFilters] = useState<ReportFilter>({
        industries: [],
        riskGrades: [],
        regions: [],
        dateRange: {
            start: '',
            end: ''
        }
    });
    const [selectedSections, setSelectedSections] = useState<string[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    const reportTemplates: ReportTemplate[] = [
        {
            id: 'portfolio-overview',
            name: 'Portfolio Overview Report',
            description: 'Comprehensive portfolio analysis with risk distribution and key metrics',
            sections: ['executive-summary', 'risk-distribution', 'industry-breakdown', 'performance-metrics', 'top-performers', 'high-risk-companies'],
            format: 'pdf',
            category: 'portfolio'
        },
        {
            id: 'risk-assessment',
            name: 'Risk Assessment Report',
            description: 'Detailed risk analysis with parameter scoring and compliance status',
            sections: ['risk-overview', 'parameter-analysis', 'compliance-status', 'risk-trends', 'recommendations'],
            format: 'pdf',
            category: 'risk'
        },
        {
            id: 'compliance-report',
            name: 'Compliance Status Report',
            description: 'GST and EPFO compliance analysis with regulatory insights',
            sections: ['compliance-summary', 'gst-analysis', 'epfo-analysis', 'non-compliance-alerts', 'remediation-plan'],
            format: 'excel',
            category: 'compliance'
        },
        {
            id: 'financial-analysis',
            name: 'Financial Performance Report',
            description: 'Multi-year financial analysis with peer benchmarking',
            sections: ['financial-summary', 'trend-analysis', 'ratio-analysis', 'peer-comparison', 'financial-health'],
            format: 'pdf',
            category: 'financial'
        },
        {
            id: 'custom-report',
            name: 'Custom Report',
            description: 'Build a custom report with selected sections and filters',
            sections: [],
            format: 'pdf',
            category: 'portfolio'
        }
    ];

    const availableSections = [
        { id: 'executive-summary', name: 'Executive Summary', category: 'overview' },
        { id: 'risk-distribution', name: 'Risk Distribution', category: 'risk' },
        { id: 'industry-breakdown', name: 'Industry Breakdown', category: 'portfolio' },
        { id: 'performance-metrics', name: 'Performance Metrics', category: 'financial' },
        { id: 'top-performers', name: 'Top Performers', category: 'portfolio' },
        { id: 'high-risk-companies', name: 'High Risk Companies', category: 'risk' },
        { id: 'parameter-analysis', name: 'Parameter Analysis', category: 'risk' },
        { id: 'compliance-status', name: 'Compliance Status', category: 'compliance' },
        { id: 'risk-trends', name: 'Risk Trends', category: 'risk' },
        { id: 'recommendations', name: 'Recommendations', category: 'overview' },
        { id: 'gst-analysis', name: 'GST Analysis', category: 'compliance' },
        { id: 'epfo-analysis', name: 'EPFO Analysis', category: 'compliance' },
        { id: 'financial-summary', name: 'Financial Summary', category: 'financial' },
        { id: 'trend-analysis', name: 'Trend Analysis', category: 'financial' },
        { id: 'ratio-analysis', name: 'Ratio Analysis', category: 'financial' },
        { id: 'peer-comparison', name: 'Peer Comparison', category: 'financial' }
    ];

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

    const regionOptions = [
        { value: 'north', label: 'North India' },
        { value: 'south', label: 'South India' },
        { value: 'east', label: 'East India' },
        { value: 'west', label: 'West India' },
        { value: 'central', label: 'Central India' }
    ];

    const formatOptions = [
        { value: 'pdf', label: 'PDF Report' },
        { value: 'excel', label: 'Excel Workbook' },
        { value: 'csv', label: 'CSV Data Export' }
    ];

    const handleTemplateSelect = (templateId: string) => {
        const template = reportTemplates.find(t => t.id === templateId);
        if (template) {
            setSelectedTemplate(templateId);
            setReportName(template.name);
            setReportDescription(template.description);
            setSelectedFormat(template.format);
            setSelectedSections(template.sections);
        }
    };

    const handleSectionToggle = (sectionId: string) => {
        setSelectedSections(prev =>
            prev.includes(sectionId)
                ? prev.filter(id => id !== sectionId)
                : [...prev, sectionId]
        );
    };

    const handleFilterChange = (filterType: keyof ReportFilter, value: any) => {
        setFilters(prev => ({
            ...prev,
            [filterType]: value
        }));
    };

    const generateReport = async () => {
        if (!selectedTemplate || selectedSections.length === 0) {
            setToastMessage('Please select a template and at least one section');
            setShowToast(true);
            return;
        }

        setIsGenerating(true);

        try {
            const reportConfig = {
                templateId: selectedTemplate,
                name: reportName,
                description: reportDescription,
                format: selectedFormat,
                sections: selectedSections,
                filters,
                generatedAt: new Date().toISOString()
            };

            const response = await fetch('/api/reports/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(reportConfig)
            });

            if (!response.ok) {
                throw new Error('Failed to generate report');
            }

            const result = await response.json();

            setToastMessage(`Report "${reportName}" generated successfully!`);
            setShowToast(true);

            if (onReportGenerated) {
                onReportGenerated(result.reportId);
            }

            // Reset form
            setSelectedTemplate('');
            setReportName('');
            setReportDescription('');
            setSelectedSections([]);
            setFilters({
                industries: [],
                riskGrades: [],
                regions: [],
                dateRange: { start: '', end: '' }
            });

        } catch (error) {
            console.error('Error generating report:', error);
            setToastMessage('Failed to generate report. Please try again.');
            setShowToast(true);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className={`space-y-6 ${className}`}>
            <Card className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Custom Report</h3>

                {/* Template Selection */}
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Report Template
                        </label>
                        {/* <Select
                            value={selectedTemplate}
                            onChange={handleTemplateSelect}
                            options={reportTemplates.map(t => ({ value: t.id, label: t.name }))}
                            placeholder="Select a report template"
                            className="w-full"
                        /> */}
                    </div>

                    {selectedTemplate && (
                        <>
                            {/* Report Details */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Report Name
                                    </label>
                                    <Input
                                        value={reportName}
                                        onChange={(e) => setReportName(e.target.value)}
                                        placeholder="Enter report name"
                                        className="w-full"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Output Format
                                    </label>
                                    {/* <Select
                                        value={selectedFormat}
                                        onChange={setSelectedFormat}
                                        options={formatOptions}
                                        className="w-full"
                                    /> */}
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Description
                                </label>
                                <Input
                                    value={reportDescription}
                                    onChange={(e) => setReportDescription(e.target.value)}
                                    placeholder="Enter report description"
                                    className="w-full"
                                />
                            </div>

                            {/* Section Selection */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-3">
                                    Report Sections
                                </label>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {availableSections.map(section => (
                                        <div key={section.id} className="flex items-center space-x-2">
                                            <Checkbox
                                                checked={selectedSections.includes(section.id)}
                                                onChange={() => handleSectionToggle(section.id)}
                                            />
                                            <span className="text-sm text-gray-700">{section.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {section.category}
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Filters */}
                            <div className="border-t pt-4">
                                <h4 className="font-medium text-gray-900 mb-3">Report Filters</h4>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Industries
                                        </label>
                                        {/* <Select
                                            value=""
                                            onChange={(value) => {
                                                if (value && !filters.industries.includes(value)) {
                                                    handleFilterChange('industries', [...filters.industries, value]);
                                                }
                                            }}
                                            options={industryOptions}
                                            placeholder="Add industry"
                                        /> */}
                                        {/* <div className="flex flex-wrap gap-1 mt-2">
                                            {filters.industries.map(industry => (
                                                <Badge
                                                    key={industry}
                                                    variant="secondary"
                                                    className="cursor-pointer"
                                                    onClick={() => handleFilterChange('industries',
                                                        filters.industries.filter(i => i !== industry)
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
                                                if (value && !filters.riskGrades.includes(value)) {
                                                    handleFilterChange('riskGrades', [...filters.riskGrades, value]);
                                                }
                                            }}
                                            options={riskGradeOptions}
                                            placeholder="Add risk grade"
                                        /> */}
                                        {/* <div className="flex flex-wrap gap-1 mt-2">
                                            {filters.riskGrades.map(grade => (
                                                <Badge
                                                    key={grade}
                                                    variant="secondary"
                                                    className="cursor-pointer"
                                                    onClick={() => handleFilterChange('riskGrades',
                                                        filters.riskGrades.filter(g => g !== grade)
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
                                        <Input
                                            type="date"
                                            value={filters.dateRange.start}
                                            onChange={(e) => handleFilterChange('dateRange', {
                                                ...filters.dateRange,
                                                start: e.target.value
                                            })}
                                            className="w-full"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            End Date
                                        </label>
                                        <Input
                                            type="date"
                                            value={filters.dateRange.end}
                                            onChange={(e) => handleFilterChange('dateRange', {
                                                ...filters.dateRange,
                                                end: e.target.value
                                            })}
                                            className="w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Generate Button */}
                            <div className="flex justify-end pt-4 border-t">
                                <Button
                                    onClick={generateReport}
                                    disabled={isGenerating || selectedSections.length === 0}
                                    className="px-6"
                                >
                                    {isGenerating ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                            Generating...
                                        </>
                                    ) : (
                                        'Generate Report'
                                    )}
                                </Button>
                            </div>
                        </>
                    )}
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