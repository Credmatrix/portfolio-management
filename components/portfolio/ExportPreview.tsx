"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import {
    FileSpreadsheet,
    FileText,
    Sparkles,
    BarChart3,
    Database,
    Info,
    Palette,
    Shield
} from 'lucide-react';

interface ExportPreviewProps {
    selectedFormat: 'xlsx' | 'csv';
    selectedFieldsCount: number;
    hasFilters: boolean;
}

export function ExportPreview({ selectedFormat, selectedFieldsCount, hasFilters }: ExportPreviewProps) {
    if (selectedFormat === 'xlsx') {
        return (
            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500 text-white rounded-xl">
                        <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-green-800">Professional Excel Export</h4>
                            <Badge variant="success" className="text-xs">
                                <Sparkles className="w-3 h-3 mr-1" />
                                Premium
                            </Badge>
                        </div>
                        <p className="text-sm text-green-700 mb-4">
                            Your export will include professional formatting with company branding and multiple sheets
                        </p>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                    <span className="text-green-700">Portfolio Data Sheet</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                    <span className="text-green-700">Analytics Summary</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                                    <span className="text-green-700">Export Metadata</span>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center gap-2 text-sm">
                                    <Palette className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700">Fluent Design Styling</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <BarChart3 className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700">Risk Distribution Charts</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm">
                                    <Shield className="w-4 h-4 text-green-600" />
                                    <span className="text-green-700">Data Validation</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-4 p-3 bg-white/60 rounded-lg border border-green-200">
                            <div className="text-xs text-green-600 font-medium mb-1">What's Included:</div>
                            <div className="text-xs text-green-700">
                                • CREDMATRIX branded cover sheet with colorful banner design
                                • {selectedFieldsCount} selected data fields with professional headers
                                • Microsoft Fluent Design colors and gradient styling
                                • Summary analytics with risk distribution and compliance metrics
                                • Alternating row colors and proper cell formatting
                                {hasFilters && ' • Applied filter documentation in cover sheet'}
                                • Complete export metadata and audit trail
                            </div>
                        </div>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200">
            <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500 text-white rounded-xl">
                    <FileText className="w-6 h-6" />
                </div>
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold text-blue-800">Standard CSV Export</h4>
                        <Badge variant="secondary" className="text-xs">
                            Universal
                        </Badge>
                    </div>
                    <p className="text-sm text-blue-700 mb-4">
                        Plain text format compatible with all spreadsheet applications and data analysis tools
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Database className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Raw Data Only</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <FileText className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Lightweight Format</span>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="flex items-center gap-2 text-sm">
                                <Info className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Fast Processing</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Shield className="w-4 h-4 text-blue-600" />
                                <span className="text-blue-700">Universal Compatibility</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-4 p-3 bg-white/60 rounded-lg border border-blue-200">
                        <div className="text-xs text-blue-600 font-medium mb-1">What's Included:</div>
                        <div className="text-xs text-blue-700">
                            • {selectedFieldsCount} selected data fields as comma-separated values
                            • Clean column headers without formatting
                            • Properly escaped text values for data integrity
                            • UTF-8 encoding for international character support
                            • Optimized for import into Excel, Google Sheets, or databases
                        </div>
                    </div>
                </div>
            </div>
        </Card>
    );
}