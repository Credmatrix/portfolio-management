"use client";

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Alert } from '@/components/ui/Alert';
import { Skeleton } from '@/components/ui/Skeleton';
import { Card } from '@/components/ui/Card';
import {
    Download,
    FileSpreadsheet,
    FileText,
    AlertCircle,
    CheckCircle2,
    Sparkles,
    Database,
    Shield,
    MapPin,
    Calendar,
    TrendingUp,
    Building2,
    Star
} from 'lucide-react';
import { FilterCriteria } from '@/types/portfolio.types';
import { ExportPreview } from './ExportPreview';

interface ExportField {
    key: string;
    label: string;
    category: 'basic' | 'risk' | 'credit' | 'compliance' | 'location' | 'dates';
}

interface ExportCategories {
    [key: string]: string;
}

interface PortfolioExportModalProps {
    isOpen: boolean;
    onClose: () => void;
    activeFilters: FilterCriteria;
    className?: string;
}

export function PortfolioExportModal({
    isOpen,
    onClose,
    activeFilters,
    className = ''
}: PortfolioExportModalProps) {
    const [selectedFields, setSelectedFields] = useState<string[]>([]);
    const [selectedFormat, setSelectedFormat] = useState<'xlsx' | 'csv'>('xlsx');
    const [isExporting, setIsExporting] = useState(false);
    const [exportError, setExportError] = useState<string | null>(null);
    const [exportSuccess, setExportSuccess] = useState(false);

    // Fetch available export fields
    const {
        data: exportConfig,
        isLoading: configLoading,
        error: configError
    } = useQuery({
        queryKey: ['export-config'],
        queryFn: async () => {
            const response = await fetch('/api/portfolio/export');
            if (!response.ok) {
                throw new Error('Failed to fetch export configuration');
            }
            return response.json();
        },
        enabled: isOpen
    });

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setExportError(null);
            setExportSuccess(false);
            // Set default selected fields (basic info)
            if (exportConfig?.availableFields) {
                const basicFields = exportConfig.availableFields
                    .filter((field: ExportField) => field.category === 'basic')
                    .map((field: ExportField) => field.key);
                setSelectedFields(basicFields);
            }
        }
    }, [isOpen, exportConfig]);

    const handleFieldToggle = (fieldKey: string) => {
        setSelectedFields(prev => {
            if (prev.includes(fieldKey)) {
                return prev.filter(key => key !== fieldKey);
            } else {
                return [...prev, fieldKey];
            }
        });
    };

    const handleCategoryToggle = (category: string) => {
        if (!exportConfig?.availableFields) return;

        const categoryFields = exportConfig.availableFields
            .filter((field: ExportField) => field.category === category)
            .map((field: ExportField) => field.key);

        const allCategoryFieldsSelected = categoryFields.every((key: string) =>
            selectedFields.includes(key)
        );

        if (allCategoryFieldsSelected) {
            // Deselect all category fields
            setSelectedFields(prev => prev.filter(key => !categoryFields.includes(key)));
        } else {
            // Select all category fields
            setSelectedFields(prev => {
                const newFields = [...prev];
                categoryFields.forEach((key: string) => {
                    if (!newFields.includes(key)) {
                        newFields.push(key);
                    }
                });
                return newFields;
            });
        }
    };

    const handleSelectAll = () => {
        if (!exportConfig?.availableFields) return;

        const allFields = exportConfig.availableFields.map((field: ExportField) => field.key);

        if (selectedFields.length === allFields.length) {
            setSelectedFields([]);
        } else {
            setSelectedFields(allFields);
        }
    };

    const handleExport = async () => {
        if (selectedFields.length === 0) {
            setExportError('Please select at least one field to export');
            return;
        }

        setIsExporting(true);
        setExportError(null);

        try {
            const response = await fetch('/api/portfolio/export', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    format: selectedFormat,
                    selectedFields,
                    filters: activeFilters
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Export failed');
            }

            // Download the file
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;

            const timestamp = new Date().toISOString().split('T')[0];
            link.download = `portfolio_export_${timestamp}.${selectedFormat}`;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);

            setExportSuccess(true);
            setTimeout(() => {
                onClose();
            }, 2000);

        } catch (error) {
            console.error('Export error:', error);
            setExportError(error instanceof Error ? error.message : 'Export failed');
        } finally {
            setIsExporting(false);
        }
    };

    const getCategoryFieldCount = (category: string) => {
        if (!exportConfig?.availableFields) return { selected: 0, total: 0 };

        const categoryFields = exportConfig.availableFields
            .filter((field: ExportField) => field.category === category)
            .map((field: ExportField) => field.key);

        const selectedCount = categoryFields.filter((key: string) =>
            selectedFields.includes(key)
        ).length;

        return { selected: selectedCount, total: categoryFields.length };
    };

    if (!isOpen) return null;

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'basic': return <Building2 className="w-4 h-4" />;
            case 'risk': return <TrendingUp className="w-4 h-4" />;
            case 'credit': return <Database className="w-4 h-4" />;
            case 'compliance': return <Shield className="w-4 h-4" />;
            case 'location': return <MapPin className="w-4 h-4" />;
            case 'dates': return <Calendar className="w-4 h-4" />;
            default: return <Star className="w-4 h-4" />;
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title=""
            className={`max-w-6xl ${className}`}
        >
            <div className="space-y-8 m-5">
                {/* Header with Gradient */}
                {/* <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-500 via-primary-600 to-primary-700 p-8 text-white">
                    <div className="absolute inset-0 bg-black/10"></div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                                <Download className="w-6 h-6" />
                            </div>
                            <h2 className="text-2xl font-semibold">Export Portfolio Data</h2>
                        </div>
                        <p className="text-primary-100 text-sm">
                            Generate professional reports with your selected data fields and current filters
                        </p>
                    </div>
                    <div className="absolute -top-4 -right-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
                    <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                </div> */}

                {/* Export Format Selection */}
                <div>
                    <h3 className="text-lg font-semibold text-neutral-90 mb-4 flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-primary-500" />
                        Choose Export Format
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Card
                            className={`p-6 cursor-pointer transition-all duration-200 border-2 ${selectedFormat === 'xlsx'
                                ? 'border-primary-500 bg-primary-50 shadow-lg'
                                : 'border-neutral-30 hover:border-primary-300 hover:shadow-md'
                                }`}
                            onClick={() => setSelectedFormat('xlsx')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${selectedFormat === 'xlsx'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-green-100 text-green-600'
                                    }`}>
                                    <FileSpreadsheet className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-neutral-90">Excel (.xlsx)</h4>
                                        <span className="px-2 py-1 bg-gradient-to-r from-orange-500 to-red-500 text-white text-xs font-medium rounded-full">
                                            PREMIUM
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-60">
                                        Custom branded cover sheet with professional formatting and multiple sheets
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-50">
                                        <span>✓ Risk Analytics</span>
                                        <span>✓ Colorful banner design</span>
                                        <span>✓ Multiple worksheets</span>
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${selectedFormat === 'xlsx'
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-neutral-40'
                                    }`}>
                                    {selectedFormat === 'xlsx' && (
                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                    )}
                                </div>
                            </div>
                        </Card>

                        <Card
                            className={`p-6 cursor-pointer transition-all duration-200 border-2 ${selectedFormat === 'csv'
                                ? 'border-primary-500 bg-primary-50 shadow-lg'
                                : 'border-neutral-30 hover:border-primary-300 hover:shadow-md'
                                }`}
                            onClick={() => setSelectedFormat('csv')}
                        >
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-xl ${selectedFormat === 'csv'
                                    ? 'bg-primary-500 text-white'
                                    : 'bg-blue-100 text-blue-600'
                                    }`}>
                                    <FileText className="w-6 h-6" />
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-semibold text-neutral-90">CSV (.csv)</h4>
                                        <span className="px-2 py-1 bg-neutral-20 text-neutral-70 text-xs font-medium rounded-full">
                                            STANDARD
                                        </span>
                                    </div>
                                    <p className="text-sm text-neutral-60">
                                        Plain text format, compatible with all spreadsheet applications
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-neutral-50">
                                        <span>✓ Universal compatibility</span>
                                        <span>✓ Lightweight</span>
                                        <span>✓ Fast processing</span>
                                    </div>
                                </div>
                                <div className={`w-4 h-4 rounded-full border-2 ${selectedFormat === 'csv'
                                    ? 'border-primary-500 bg-primary-500'
                                    : 'border-neutral-40'
                                    }`}>
                                    {selectedFormat === 'csv' && (
                                        <div className="w-full h-full rounded-full bg-white scale-50"></div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    </div>
                </div>

                {/* Field Selection */}
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                            <Database className="w-5 h-5 text-primary-500" />
                            Select Data Fields
                        </h3>
                        <div className="flex items-center gap-3">
                            <span className="text-sm text-neutral-60">
                                {selectedFields.length} of {exportConfig?.availableFields?.length || 0} selected
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleSelectAll}
                                disabled={configLoading}
                                className="flex items-center gap-2"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                {selectedFields.length === exportConfig?.availableFields?.length ? 'Deselect All' : 'Select All'}
                            </Button>
                        </div>
                    </div>

                    {configLoading && (
                        <div className="space-y-4">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-5 w-32" />
                                    <div className="grid grid-cols-2 gap-2">
                                        <Skeleton className="h-8 w-full" />
                                        <Skeleton className="h-8 w-full" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {configError && (
                        <Alert variant="error">
                            <AlertCircle className="w-4 h-4" />
                            <div>
                                <h4 className="font-medium">Failed to load export options</h4>
                                <p className="text-sm mt-1">
                                    {configError.message || 'Unable to fetch available fields'}
                                </p>
                            </div>
                        </Alert>
                    )}

                    {exportConfig && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-h-96 overflow-y-auto pr-2">
                            {Object.entries(exportConfig.categories).map(([categoryKey, categoryLabel]) => {
                                const categoryFields = exportConfig.availableFields.filter(
                                    (field: ExportField) => field.category === categoryKey
                                );
                                const { selected, total } = getCategoryFieldCount(categoryKey);

                                return (
                                    <Card key={categoryKey} className="p-6 border-2 border-neutral-20 hover:border-primary-200 transition-all duration-200">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="flex items-center gap-3 cursor-pointer group">
                                                <Checkbox
                                                    checked={selected === total && total > 0}
                                                    indeterminate={selected > 0 && selected < total}
                                                    onChange={() => handleCategoryToggle(categoryKey)}
                                                />
                                                <div className="flex items-center gap-2">
                                                    <div className="p-2 bg-primary-50 text-primary-500 rounded-lg group-hover:bg-primary-100 transition-colors">
                                                        {getCategoryIcon(categoryKey)}
                                                    </div>
                                                    <div>
                                                        <span className="font-semibold text-neutral-90 block">
                                                            {`${categoryLabel}`}
                                                        </span>
                                                        <span className="text-xs text-neutral-60">
                                                            {selected}/{total} selected
                                                        </span>
                                                    </div>
                                                </div>
                                            </label>
                                            <div className={`px-3 py-1 rounded-full text-xs font-medium ${selected === total && total > 0
                                                ? 'bg-success text-white'
                                                : selected > 0
                                                    ? 'bg-warning text-white'
                                                    : 'bg-neutral-20 text-neutral-60'
                                                }`}>
                                                {selected === total && total > 0 ? 'All Selected' :
                                                    selected > 0 ? 'Partial' : 'None'}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {categoryFields.map((field: ExportField) => (
                                                <label
                                                    key={field.key}
                                                    className={`flex items-center gap-3 cursor-pointer p-3 rounded-lg transition-all duration-150 ${selectedFields.includes(field.key)
                                                        ? 'bg-primary-50 border border-primary-200'
                                                        : 'hover:bg-neutral-10 border border-transparent'
                                                        }`}
                                                >
                                                    <Checkbox
                                                        checked={selectedFields.includes(field.key)}
                                                        onChange={() => handleFieldToggle(field.key)}
                                                    />
                                                    <span className={`text-sm font-medium ${selectedFields.includes(field.key)
                                                        ? 'text-primary-700'
                                                        : 'text-neutral-80'
                                                        }`}>
                                                        {field.label}
                                                    </span>
                                                </label>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Export Summary */}
                {/* {selectedFields.length > 0 && (
                    <Card className="p-6 bg-gradient-to-r from-primary-50 to-blue-50 border-2 border-primary-200">
                        <div className="flex items-start gap-4">
                            <div className="p-3 bg-primary-500 text-white rounded-xl">
                                <CheckCircle2 className="w-6 h-6" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-semibold text-primary-700 mb-2">Export Ready</h4>
                                <p className="text-sm text-primary-600 mb-3">
                                    {selectedFields.length} field{selectedFields.length !== 1 ? 's' : ''} selected for export
                                    {Object.keys(activeFilters).length > 0 && ' with current dashboard filters applied'}
                                </p>
                                <div className="flex flex-wrap gap-2">
                                    {Object.entries(exportConfig?.categories || {}).map(([categoryKey, categoryLabel]) => {
                                        const { selected, total } = getCategoryFieldCount(categoryKey);
                                        if (selected === 0) return null;

                                        return (
                                            <span
                                                key={categoryKey}
                                                className="px-3 py-1 bg-white/80 text-primary-700 text-xs font-medium rounded-full border border-primary-200"
                                            >
                                                {categoryLabel}: {selected}/{total}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </Card>
                )} */}

                {/* Error Display */}
                {exportError && (
                    <Alert variant="error">
                        <AlertCircle className="w-4 h-4" />
                        <div>
                            <h4 className="font-medium">Export Failed</h4>
                            <p className="text-sm mt-1">{exportError}</p>
                        </div>
                    </Alert>
                )}

                {/* Success Display */}
                {exportSuccess && (
                    <Alert variant="success">
                        <CheckCircle2 className="w-4 h-4" />
                        <div>
                            <h4 className="font-medium">Export Successful</h4>
                            <p className="text-sm mt-1">Your file has been downloaded successfully.</p>
                        </div>
                    </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex justify-between items-center pt-6 border-t border-neutral-20">
                    <div className="text-sm text-neutral-60">
                        {selectedFormat === 'xlsx' ? (
                            <span className="flex items-center gap-2">
                                <Sparkles className="w-4 h-4 text-orange-500" />
                                Professional Excel with branding and formatting
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                <FileText className="w-4 h-4 text-blue-500" />
                                Plain CSV format for universal compatibility
                            </span>
                        )}
                    </div>
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isExporting}
                            size="lg"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleExport}
                            disabled={selectedFields.length === 0 || isExporting || configLoading}
                            className="flex items-center gap-2 px-8"
                            size="lg"
                        >
                            {isExporting ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Generating {selectedFormat.toUpperCase()}...
                                </>
                            ) : (
                                <>
                                    <Download className="w-5 h-5" />
                                    Export {selectedFormat.toUpperCase()}
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}