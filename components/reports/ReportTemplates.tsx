'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Select } from '@/components/ui/Select';
import { Toast } from '@/components/ui/Toast';

interface ReportSection {
    id: string;
    name: string;
    description: string;
    category: 'overview' | 'risk' | 'financial' | 'compliance' | 'governance';
    required: boolean;
    dataRequirements: string[];
}

interface ReportTemplate {
    id: string;
    name: string;
    description: string;
    category: 'portfolio' | 'risk' | 'compliance' | 'financial' | 'custom';
    sections: string[];
    defaultFormat: 'pdf' | 'excel' | 'csv';
    isBuiltIn: boolean;
    createdAt: string;
    createdBy: string;
    usageCount: number;
    lastUsed?: string;
}

interface ReportTemplatesProps {
    onTemplateSelect?: (templateId: string) => void;
    className?: string;
}

export function ReportTemplates({ onTemplateSelect, className = '' }: ReportTemplatesProps) {
    const [templates, setTemplates] = useState<ReportTemplate[]>([]);
    const [sections, setSections] = useState<ReportSection[]>([]);
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');
    const [loading, setLoading] = useState(true);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');

    // Form state for creating/editing templates
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'custom' as const,
        sections: [] as string[],
        defaultFormat: 'pdf' as const
    });

    const availableSections: ReportSection[] = [
        {
            id: 'executive-summary',
            name: 'Executive Summary',
            description: 'High-level overview of portfolio performance and key insights',
            category: 'overview',
            required: false,
            dataRequirements: ['portfolio_metrics', 'risk_distribution']
        },
        {
            id: 'portfolio-overview',
            name: 'Portfolio Overview',
            description: 'Comprehensive portfolio statistics and composition',
            category: 'overview',
            required: false,
            dataRequirements: ['company_count', 'total_exposure', 'industry_breakdown']
        },
        {
            id: 'risk-distribution',
            name: 'Risk Distribution',
            description: 'Analysis of risk grades and score distribution across portfolio',
            category: 'risk',
            required: false,
            dataRequirements: ['risk_scores', 'risk_grades', 'parameter_scores']
        },
        {
            id: 'parameter-analysis',
            name: 'Parameter Analysis',
            description: 'Detailed breakdown of risk parameters by category',
            category: 'risk',
            required: false,
            dataRequirements: ['parameter_scores', 'category_results', 'benchmarks']
        },
        {
            id: 'industry-breakdown',
            name: 'Industry Analysis',
            description: 'Sector-wise portfolio composition and risk analysis',
            category: 'overview',
            required: false,
            dataRequirements: ['industry_data', 'sector_exposure', 'industry_risk']
        },
        {
            id: 'financial-summary',
            name: 'Financial Summary',
            description: 'Key financial metrics and performance indicators',
            category: 'financial',
            required: false,
            dataRequirements: ['financial_data', 'ratios', 'trends']
        },
        {
            id: 'trend-analysis',
            name: 'Trend Analysis',
            description: 'Historical performance trends and projections',
            category: 'financial',
            required: false,
            dataRequirements: ['historical_data', 'trend_calculations', 'forecasts']
        },
        {
            id: 'peer-comparison',
            name: 'Peer Comparison',
            description: 'Benchmarking against industry peers and standards',
            category: 'financial',
            required: false,
            dataRequirements: ['peer_data', 'industry_benchmarks', 'comparative_metrics']
        },
        {
            id: 'compliance-status',
            name: 'Compliance Status',
            description: 'GST and EPFO compliance analysis and scoring',
            category: 'compliance',
            required: false,
            dataRequirements: ['gst_records', 'epfo_records', 'compliance_scores']
        },
        {
            id: 'gst-analysis',
            name: 'GST Analysis',
            description: 'Detailed GST registration and filing compliance',
            category: 'compliance',
            required: false,
            dataRequirements: ['gst_registrations', 'filing_history', 'compliance_trends']
        },
        {
            id: 'epfo-analysis',
            name: 'EPFO Analysis',
            description: 'Employee provident fund compliance and payment history',
            category: 'compliance',
            required: false,
            dataRequirements: ['epfo_establishments', 'payment_history', 'employee_data']
        },
        {
            id: 'directors-analysis',
            name: 'Directors & Governance',
            description: 'Director information and corporate governance analysis',
            category: 'governance',
            required: false,
            dataRequirements: ['director_data', 'shareholding', 'appointments']
        },
        {
            id: 'charges-analysis',
            name: 'Charges & Securities',
            description: 'Analysis of charges, securities, and legal encumbrances',
            category: 'governance',
            required: false,
            dataRequirements: ['charges_data', 'security_interests', 'legal_cases']
        },
        {
            id: 'top-performers',
            name: 'Top Performers',
            description: 'Highest performing companies in the portfolio',
            category: 'overview',
            required: false,
            dataRequirements: ['performance_rankings', 'top_companies', 'success_metrics']
        },
        {
            id: 'high-risk-companies',
            name: 'High Risk Companies',
            description: 'Companies requiring attention due to elevated risk',
            category: 'risk',
            required: false,
            dataRequirements: ['high_risk_list', 'risk_factors', 'mitigation_recommendations']
        },
        {
            id: 'recommendations',
            name: 'Recommendations',
            description: 'Strategic recommendations and action items',
            category: 'overview',
            required: false,
            dataRequirements: ['analysis_results', 'risk_assessment', 'strategic_insights']
        }
    ];

    const categoryOptions = [
        { value: 'all', label: 'All Categories' },
        { value: 'portfolio', label: 'Portfolio Reports' },
        { value: 'risk', label: 'Risk Reports' },
        { value: 'compliance', label: 'Compliance Reports' },
        { value: 'financial', label: 'Financial Reports' },
        { value: 'custom', label: 'Custom Reports' }
    ];

    const formatOptions = [
        { value: 'pdf', label: 'PDF Report' },
        { value: 'excel', label: 'Excel Workbook' },
        { value: 'csv', label: 'CSV Data Export' }
    ];

    useEffect(() => {
        loadTemplates();
        setSections(availableSections);
    }, []);

    const loadTemplates = async () => {
        setLoading(true);
        try {
            const response = await fetch('/api/reports/templates');
            const templatesData = await response.json();
            setTemplates(templatesData);
        } catch (error) {
            console.error('Error loading templates:', error);
            // Load default templates if API fails
            setTemplates(getDefaultTemplates());
        } finally {
            setLoading(false);
        }
    };

    const getDefaultTemplates = (): ReportTemplate[] => [
        {
            id: 'portfolio-overview',
            name: 'Portfolio Overview Report',
            description: 'Comprehensive portfolio analysis with risk distribution and key metrics',
            category: 'portfolio',
            sections: ['executive-summary', 'portfolio-overview', 'risk-distribution', 'industry-breakdown', 'top-performers'],
            defaultFormat: 'pdf',
            isBuiltIn: true,
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'System',
            usageCount: 45,
            lastUsed: '2024-01-15T10:30:00Z'
        },
        {
            id: 'risk-assessment',
            name: 'Risk Assessment Report',
            description: 'Detailed risk analysis with parameter scoring and compliance status',
            category: 'risk',
            sections: ['risk-distribution', 'parameter-analysis', 'high-risk-companies', 'compliance-status', 'recommendations'],
            defaultFormat: 'pdf',
            isBuiltIn: true,
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'System',
            usageCount: 32,
            lastUsed: '2024-01-14T14:20:00Z'
        },
        {
            id: 'compliance-report',
            name: 'Compliance Status Report',
            description: 'GST and EPFO compliance analysis with regulatory insights',
            category: 'compliance',
            sections: ['compliance-status', 'gst-analysis', 'epfo-analysis', 'recommendations'],
            defaultFormat: 'excel',
            isBuiltIn: true,
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'System',
            usageCount: 28,
            lastUsed: '2024-01-13T09:15:00Z'
        },
        {
            id: 'financial-analysis',
            name: 'Financial Performance Report',
            description: 'Multi-year financial analysis with peer benchmarking',
            category: 'financial',
            sections: ['financial-summary', 'trend-analysis', 'peer-comparison', 'recommendations'],
            defaultFormat: 'pdf',
            isBuiltIn: true,
            createdAt: '2024-01-01T00:00:00Z',
            createdBy: 'System',
            usageCount: 19,
            lastUsed: '2024-01-12T16:45:00Z'
        }
    ];

    const filteredTemplates = templates.filter(template =>
        selectedCategory === 'all' || template.category === selectedCategory
    );

    const handleCreateTemplate = () => {
        setFormData({
            name: '',
            description: '',
            category: 'custom',
            sections: [],
            defaultFormat: 'pdf'
        });
        setEditingTemplate(null);
        setShowCreateModal(true);
    };

    const handleEditTemplate = (template: ReportTemplate) => {
        if (template.isBuiltIn) {
            setToastMessage('Built-in templates cannot be edited. Create a copy instead.');
            setShowToast(true);
            return;
        }

        // setFormData({
        //     name: template.name,
        //     description: template.description,
        //     category: template.category,
        //     sections: template.sections,
        //     defaultFormat: template.defaultFormat
        // });
        setEditingTemplate(template);
        setShowCreateModal(true);
    };

    const handleSaveTemplate = async () => {
        if (!formData.name || formData.sections.length === 0) {
            setToastMessage('Please provide a name and select at least one section');
            setShowToast(true);
            return;
        }

        try {
            const templateData = {
                ...formData,
                isBuiltIn: false,
                createdAt: editingTemplate?.createdAt || new Date().toISOString(),
                createdBy: 'Current User', // This would come from auth context
                usageCount: editingTemplate?.usageCount || 0
            };

            const url = editingTemplate
                ? `/api/reports/templates/${editingTemplate.id}`
                : '/api/reports/templates';

            const method = editingTemplate ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateData)
            });

            if (!response.ok) {
                throw new Error('Failed to save template');
            }

            setToastMessage(`Template ${editingTemplate ? 'updated' : 'created'} successfully`);
            setShowToast(true);
            setShowCreateModal(false);
            loadTemplates();

        } catch (error) {
            console.error('Error saving template:', error);
            setToastMessage('Failed to save template');
            setShowToast(true);
        }
    };

    const handleDeleteTemplate = async (templateId: string) => {
        const template = templates.find(t => t.id === templateId);
        if (template?.isBuiltIn) {
            setToastMessage('Built-in templates cannot be deleted');
            setShowToast(true);
            return;
        }

        if (!confirm('Are you sure you want to delete this template?')) {
            return;
        }

        try {
            const response = await fetch(`/api/reports/templates/${templateId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete template');
            }

            setTemplates(prev => prev.filter(t => t.id !== templateId));
            setToastMessage('Template deleted successfully');
            setShowToast(true);

        } catch (error) {
            console.error('Error deleting template:', error);
            setToastMessage('Failed to delete template');
            setShowToast(true);
        }
    };

    const handleDuplicateTemplate = (template: ReportTemplate) => {
        // setFormData({
        //     name: `${template.name} (Copy)`,
        //     description: template.description,
        //     category: template.category,
        //     sections: template.sections,
        //     defaultFormat: template.defaultFormat
        // });
        setEditingTemplate(null);
        setShowCreateModal(true);
    };

    const handleSectionToggle = (sectionId: string) => {
        setFormData(prev => ({
            ...prev,
            sections: prev.sections.includes(sectionId)
                ? prev.sections.filter(id => id !== sectionId)
                : [...prev.sections, sectionId]
        }));
    };

    const getCategoryBadgeColor = (category: string) => {
        switch (category) {
            case 'portfolio': return 'bg-blue-100 text-blue-800';
            case 'risk': return 'bg-red-100 text-red-800';
            case 'compliance': return 'bg-yellow-100 text-yellow-800';
            case 'financial': return 'bg-green-100 text-green-800';
            case 'custom': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="p-6">
                <div className="animate-pulse space-y-4">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="h-32 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`space-y-6 ${className}`}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-gray-900">Report Templates</h3>
                    <p className="text-gray-600 mt-1">Manage and customize report templates</p>
                </div>

                <div className="flex items-center space-x-3">
                    {/* <Select
                        value={selectedCategory}
                        onChange={setSelectedCategory}
                        options={categoryOptions}
                        className="w-48"
                    /> */}
                    <Button onClick={handleCreateTemplate}>
                        Create Template
                    </Button>
                </div>
            </div>

            {/* Templates Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTemplates.map(template => (
                    <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
                        <div className="space-y-4">
                            <div className="flex items-start justify-between">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-2 mb-2">
                                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                                        {template.isBuiltIn && (
                                            <Badge variant="secondary" className="text-xs">Built-in</Badge>
                                        )}
                                    </div>
                                    <Badge className={`text-xs ${getCategoryBadgeColor(template.category)}`}>
                                        {template.category}
                                    </Badge>
                                </div>

                                <Badge variant="outline" className="text-xs">
                                    {template.defaultFormat.toUpperCase()}
                                </Badge>
                            </div>

                            <p className="text-sm text-gray-600">{template.description}</p>

                            <div className="space-y-2">
                                <div className="text-xs text-gray-500">
                                    <strong>Sections:</strong> {template.sections.length}
                                </div>
                                <div className="flex flex-wrap gap-1">
                                    {template.sections.slice(0, 3).map(sectionId => {
                                        const section = availableSections.find(s => s.id === sectionId);
                                        return section ? (
                                            <Badge key={sectionId} variant="outline" className="text-xs">
                                                {section.name}
                                            </Badge>
                                        ) : null;
                                    })}
                                    {template.sections.length > 3 && (
                                        <Badge variant="outline" className="text-xs">
                                            +{template.sections.length - 3} more
                                        </Badge>
                                    )}
                                </div>
                            </div>

                            <div className="text-xs text-gray-500 space-y-1">
                                <div>Used {template.usageCount} times</div>
                                {template.lastUsed && (
                                    <div>Last used: {new Date(template.lastUsed).toLocaleDateString()}</div>
                                )}
                            </div>

                            <div className="flex items-center justify-between pt-2 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => onTemplateSelect?.(template.id)}
                                >
                                    Use Template
                                </Button>

                                <div className="flex items-center space-x-1">
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDuplicateTemplate(template)}
                                        title="Duplicate"
                                    >
                                        📋
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleEditTemplate(template)}
                                        title="Edit"
                                        disabled={template.isBuiltIn}
                                    >
                                        ✏️
                                    </Button>

                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => handleDeleteTemplate(template.id)}
                                        title="Delete"
                                        disabled={template.isBuiltIn}
                                    >
                                        🗑️
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            {filteredTemplates.length === 0 && (
                <Card className="p-8 text-center">
                    <div className="text-gray-500">
                        <div className="text-4xl mb-4">📄</div>
                        <h4 className="text-lg font-medium mb-2">No Templates Found</h4>
                        <p className="text-sm mb-4">
                            {selectedCategory === 'all'
                                ? 'Create your first report template to get started'
                                : `No templates found in the ${selectedCategory} category`
                            }
                        </p>
                        <Button onClick={handleCreateTemplate}>
                            Create Template
                        </Button>
                    </div>
                </Card>
            )}

            {/* Create/Edit Modal */}
            <Modal
                isOpen={showCreateModal}
                onClose={() => setShowCreateModal(false)}
                title={editingTemplate ? 'Edit Template' : 'Create Template'}
            // size="large"
            >
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Template Name
                            </label>
                            <Input
                                value={formData.name}
                                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                placeholder="Enter template name"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Category
                            </label>
                            {/* <Select
                                value={formData.category}
                                onChange={(value) => setFormData(prev => ({ ...prev, category: value as any }))}
                                // options={categoryOptions.filter(opt => opt.value !== 'all')}
                            /> */}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Description
                        </label>
                        <Input
                            value={formData.description}
                            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                            placeholder="Enter template description"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Default Format
                        </label>
                        {/* <Select
                            value={formData.defaultFormat}
                            onChange={(value) => setFormData(prev => ({ ...prev, defaultFormat: value as any }))}
                            options={formatOptions}
                        /> */}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Report Sections
                        </label>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto">
                            {availableSections.map(section => (
                                <div key={section.id} className="flex items-start space-x-2 p-2 border rounded">
                                    <Checkbox
                                        checked={formData.sections.includes(section.id)}
                                        onChange={() => handleSectionToggle(section.id)}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2">
                                            <span className="text-sm font-medium text-gray-900">{section.name}</span>
                                            <Badge variant="outline" className="text-xs">
                                                {section.category}
                                            </Badge>
                                        </div>
                                        <p className="text-xs text-gray-600 mt-1">{section.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                        <Button
                            variant="outline"
                            onClick={() => setShowCreateModal(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveTemplate}
                            disabled={!formData.name || formData.sections.length === 0}
                        >
                            {editingTemplate ? 'Update Template' : 'Create Template'}
                        </Button>
                    </div>
                </div>
            </Modal>

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