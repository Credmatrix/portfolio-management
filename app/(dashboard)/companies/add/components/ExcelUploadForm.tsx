'use client'

import React, { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Alert } from '@/components/ui/Alert'
import { Progress } from '@/components/ui/Progress'
import { CompanySearchResult, EntityType } from '@/types/manual-company.types'
import { Database } from '@/types/database.types'
import {
    FileText,
    Upload,
    CheckCircle,
    AlertTriangle,
    Loader2,
    X,
    Download,
    Info,
    Eye,
    RefreshCw,
    AlertCircle,
    FileCheck,
    File,
    Settings
} from 'lucide-react'

type Industry = Database['public']['Enums']['industry_type'];
type ModelType = Database['public']['Enums']['model_type'];

interface ExcelUploadFormProps {
    selectedCompany: CompanySearchResult | null
    entityType: EntityType
    onUploadComplete: (request: any) => void
    onUploadError: (error: string) => void
    onFormDataUpdate?: (section: string, data: any) => void
}

interface UploadFile extends File {
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
    requestId?: string;
    stage?: string;
}

interface UploadedFile {
    name: string
    size: number
    type: string
    file: File
    id: string
    status: 'pending' | 'validating' | 'valid' | 'invalid' | 'processing' | 'completed' | 'failed'
    validationResults?: FileValidationResult
    previewData?: FilePreviewData
    uploadProgress?: number
}

interface FileValidationResult {
    isValid: boolean
    errors: string[]
    warnings: string[]
    detectedSheets: string[]
    expectedDataTypes: string[]
    dataQualityScore: number
}

interface FilePreviewData {
    sheets: SheetPreview[]
    detectedCompanyInfo?: {
        name?: string
        cin?: string
        pan?: string
        financialYear?: string
    }
    mappingSuggestions: DataMappingSuggestion[]
}

interface SheetPreview {
    name: string
    rowCount: number
    columnCount: number
    sampleData: any[][]
    detectedType: 'balance_sheet' | 'profit_loss' | 'cash_flow' | 'ratios' | 'company_info' | 'unknown'
}

interface DataMappingSuggestion {
    sheetName: string
    suggestedType: string
    confidence: number
    mappings: FieldMapping[]
}

interface FieldMapping {
    sourceColumn: string
    targetField: string
    confidence: number
}

const industryOptions = [
    { value: 'manufacturing-oem', label: 'Manufacturing - OEM' },
    { value: 'epc', label: 'EPC (Engineering, Procurement & Construction)' },
];

const modelTypeOptions = [
    { value: 'without_banking', label: 'Without Banking Data' },
    { value: 'with_banking', label: 'With Banking Data' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ['.xlsx', '.xls'];

export function ExcelUploadForm({
    selectedCompany,
    entityType,
    onUploadComplete,
    onUploadError,
    onFormDataUpdate
}: ExcelUploadFormProps) {
    // Configuration state
    const [industry, setIndustry] = useState<Industry>('manufacturing-oem');
    const [modelType, setModelType] = useState<ModelType>('without_banking');
    const [companyName, setCompanyName] = useState(selectedCompany?.name || "");

    // File upload state
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Legacy state for compatibility
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [progress, setProgress] = useState(0)
    const [currentStep, setCurrentStep] = useState('')
    const [dragActive, setDragActive] = useState(false)
    const [selectedFileForPreview, setSelectedFileForPreview] = useState<string | null>(null)
    const [showDataMapping, setShowDataMapping] = useState(false)
    const [validationInProgress, setValidationInProgress] = useState<Set<string>>(new Set())
    const [retryCount, setRetryCount] = useState(0)
    const [maxRetries] = useState(3)

    const fileInputRef = useRef<HTMLInputElement>(null);

    // File validation function
    const validateFile = (file: File): string | null => {
        if (file.size > MAX_FILE_SIZE) {
            return `File size exceeds 50MB limit`;
        }

        const extension = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!SUPPORTED_TYPES.includes(extension)) {
            return `Unsupported file type. Please upload Excel files (.xls, .xlsx)`;
        }

        return null;
    };

    const addFiles = useCallback((newFiles: FileList | File[]) => {
        const fileArray = Array.from(newFiles);
        const validFiles: UploadFile[] = [];
        const errors: string[] = [];

        fileArray.forEach(file => {
            const error = validateFile(file);
            if (error) {
                errors.push(`${file.name}: ${error}`);
            } else {
                const uploadFile: UploadFile = Object.assign(file, {
                    id: Math.random().toString(36).substring(2, 11),
                    progress: 0,
                    status: 'pending' as const
                });
                validFiles.push(uploadFile);
            }
        });

        if (errors.length > 0) {
            onUploadError(errors.join('\n'));
        }

        setFiles(prev => [...prev, ...validFiles]);
    }, [onUploadError]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);

        const droppedFiles = e.dataTransfer.files;
        if (droppedFiles.length > 0) {
            addFiles(droppedFiles);
        }
    }, [addFiles]);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            addFiles(e.target.files);
        }
    };

    const removeFile = (fileId: string) => {
        setFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const uploadFile = async (file: UploadFile): Promise<void> => {
        try {
            // Update file status to uploading
            setFiles(prev => prev.map(f =>
                f.id === file.id ? {
                    ...f,
                    status: 'uploading',
                    progress: 10,
                    stage: 'Getting upload URL...'
                } : f
            ));

            // Step 1: Get presigned upload URL
            const uploadUrlResponse = await fetch('/api/upload/get-upload-url', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    filename: file.name,
                    model_type: modelType,
                    industry: industry,
                    company_name: selectedCompany?.name || companyName,
                    cin: selectedCompany?.registration_number
                }),
            });

            if (!uploadUrlResponse.ok) {
                const error = await uploadUrlResponse.json();
                throw new Error(error.error || 'Failed to get upload URL');
            }

            const { upload_url, request_id } = await uploadUrlResponse.json();

            // Update progress
            setFiles(prev => prev.map(f =>
                f.id === file.id ? {
                    ...f,
                    progress: 30,
                    stage: 'Uploading file...',
                    requestId: request_id
                } : f
            ));

            // Step 2: Upload file directly to S3
            const contentType = file.name.toLowerCase().endsWith('.xlsx')
                ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                : 'application/vnd.ms-excel';

            const s3Response = await fetch(upload_url, {
                method: 'PUT',
                headers: {
                    'Content-Type': contentType,
                },
                body: file,
            });

            if (!s3Response.ok) {
                throw new Error('Failed to upload file to S3');
            }

            // Update progress
            setFiles(prev => prev.map(f =>
                f.id === file.id ? {
                    ...f,
                    progress: 70,
                    stage: 'Confirming upload...'
                } : f
            ));

            // Step 3: Confirm upload
            const confirmResponse = await fetch('/api/upload/confirm-upload', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    request_id,
                    file_size: file.size
                }),
            });

            if (!confirmResponse.ok) {
                const error = await confirmResponse.json();
                throw new Error(error.error || 'Failed to confirm upload');
            }

            // Update to processing status
            setFiles(prev => prev.map(f =>
                f.id === file.id ? {
                    ...f,
                    status: 'processing',
                    progress: 100,
                    stage: 'Processing document...'
                } : f
            ));

            const res = await confirmResponse.json();

            // Notify parent component
            onUploadComplete(res.request_id);

            // Start polling for processing status
            startStatusPolling(request_id, file.id);

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Upload failed';
            setFiles(prev => prev.map(f =>
                f.id === file.id ? { ...f, status: 'error', error: errorMessage } : f
            ));
        }
    };

    const startStatusPolling = async (requestId: string, fileId: string) => {
        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/upload/status/${requestId}`);
                if (response.ok) {
                    const statusData = await response.json();

                    // Update file status
                    setFiles(prev => prev.map(f =>
                        f.id === fileId ? {
                            ...f,
                            status: statusData.status === 'completed' ? 'completed' :
                                statusData.status === 'failed' ? 'error' : 'processing',
                            stage: statusData.status === 'completed' ? 'Analysis complete!' :
                                statusData.status === 'failed' ? 'Processing failed' :
                                    statusData.status === 'processing' ? 'Analyzing document...' :
                                        'Queued for processing...',
                            error: statusData.error_message
                        } : f
                    ));

                    // Continue polling if still processing
                    if (statusData.status === 'processing' || statusData.status === 'submitted') {
                        setTimeout(pollStatus, 10000); // Poll every 10 seconds
                    }
                }
            } catch (error) {
                console.error('Status polling error:', error);
            }
        };

        // Start polling after a short delay
        setTimeout(pollStatus, 5000);
    };

    const handleFileUpload = async () => {
        const effectiveCompanyName = selectedCompany?.name || companyName;
        if (!effectiveCompanyName.trim()) {
            onUploadError('Company name is required');
            return;
        }

        if (files.length === 0) {
            onUploadError('Please select at least one file');
            return;
        }

        setIsUploading(true);

        try {
            // Upload files sequentially
            for (const file of files.filter(f => f.status === 'pending')) {
                await uploadFile(file);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const retryFile = async (fileId: string) => {
        const file = files.find(f => f.id === fileId);
        if (!file) return;

        // Reset file status and retry
        setFiles(prev => prev.map(f =>
            f.id === fileId ? {
                ...f,
                status: 'pending',
                progress: 0,
                error: undefined,
                stage: undefined
            } : f
        ));

        if (file.requestId) {
            // If we have a request ID, try to retry processing
            try {
                const response = await fetch(`/api/upload/retry/${file.requestId}`, {
                    method: 'POST'
                });

                if (response.ok) {
                    setFiles(prev => prev.map(f =>
                        f.id === fileId ? {
                            ...f,
                            status: 'processing',
                            stage: 'Retrying processing...'
                        } : f
                    ));

                    startStatusPolling(file.requestId, fileId);
                }
            } catch (error) {
                console.error('Retry failed:', error);
                await uploadFile(file);
            }
        } else {
            // Re-upload the file
            await uploadFile(file);
        }
    };

    const clearCompleted = () => {
        setFiles(prev => prev.filter(f => f.status !== 'completed'));
    };





    const hasCompletedFiles = files.some(f => f.status === 'completed');
    const hasPendingFiles = files.some(f => f.status === 'pending');
    const hasErrors = files.some(f => f.status === 'error');

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="text-center space-y-2">
                <div className="flex items-center justify-center gap-2 text-blue-600 mb-4">
                    <Upload className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90">
                    Document Upload Processing
                </h3>
                <p className="text-sm text-neutral-60 max-w-md mx-auto">
                    Upload your financial statements and company documents in Excel format for automated processing.
                </p>
            </div>

            {/* Configuration Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Settings className="w-5 h-5 text-neutral-60" />
                        <h4 className="font-semibold text-neutral-90">Processing Configuration</h4>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Industry Type
                            </label>
                            <Select
                                value={industry}
                                onChange={(e) => setIndustry(e.target.value as Industry)}
                                disabled={isUploading}
                            >
                                {industryOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Model Type
                            </label>
                            <Select
                                value={modelType}
                                onChange={(e) => setModelType(e.target.value as ModelType)}
                                disabled={true}
                            >
                                {modelTypeOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    </div>

                    {!selectedCompany && (
                        <div>
                            <label className="block text-sm font-medium text-neutral-70 mb-2">
                                Company Name *
                            </label>
                            <Input
                                type="text"
                                placeholder="Enter company name"
                                value={companyName}
                                onChange={(e) => setCompanyName(e.target.value)}
                                disabled={isUploading}
                            />
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Info Alert */}
            <Alert variant="info">
                <Info className="w-4 h-4" />
                <div>
                    <p className="font-medium">Supported file types:</p>
                    <p className="text-sm">Excel files (.xlsx, .xls) up to 50MB each</p>
                </div>
            </Alert>

            {/* File Upload Area */}
            <Card>
                <CardHeader>
                    <h4 className="font-semibold text-neutral-90">Upload Files</h4>
                </CardHeader>
                <CardContent>
                    <div
                        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-neutral-300 hover:border-neutral-400'
                            } ${isUploading ? 'opacity-50 pointer-events-none' : 'cursor-pointer'}`}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <Upload className="w-12 h-12 text-neutral-400 mx-auto mb-4" />
                        <h4 className="font-medium text-neutral-90 mb-2">
                            Drag & drop files here, or click to select
                        </h4>
                        <p className="text-sm text-neutral-600 mb-4">
                            Supports Excel files (.xlsx, .xls) up to 50MB each
                        </p>

                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept=".xlsx,.xls"
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        <Button
                            variant="outline"
                            size="sm"
                            disabled={isUploading}
                        >
                            Select Files
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* File List */}
            {files.length > 0 && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <h4 className="font-semibold text-neutral-90">
                                Selected Files ({files.length})
                            </h4>
                            {hasCompletedFiles && (
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={clearCompleted}
                                >
                                    Clear Completed
                                </Button>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-3">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="flex items-center justify-between p-4 bg-neutral-10 rounded-lg border"
                                >
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="relative">
                                            <File className="w-5 h-5 text-neutral-60" />
                                            {file.status === 'completed' && (
                                                <CheckCircle className="w-3 h-3 text-green-600 absolute -top-1 -right-1" />
                                            )}
                                            {file.status === 'error' && (
                                                <AlertCircle className="w-3 h-3 text-red-600 absolute -top-1 -right-1" />
                                            )}
                                        </div>

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-neutral-90 truncate">
                                                {file.name}
                                            </p>
                                            <p className="text-xs text-neutral-50">
                                                {file.size ? (file.size / 1024 / 1024).toFixed(2) : '0.0'} MB
                                            </p>

                                            {(file.status === 'uploading' || file.status === 'processing') && (
                                                <div className="mt-1">
                                                    <Progress value={file.progress} className="mb-1" />
                                                    {file.stage && (
                                                        <p className="text-xs text-neutral-60">{file.stage}</p>
                                                    )}
                                                </div>
                                            )}

                                            {file.status === 'error' && file.error && (
                                                <div className="mt-1">
                                                    <p className="text-xs text-red-600">{file.error}</p>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        onClick={() => retryFile(file.id)}
                                                        className="mt-1 text-xs h-6 px-2"
                                                    >
                                                        <RefreshCw className="w-3 h-3 mr-1" />
                                                        Retry
                                                    </Button>
                                                </div>
                                            )}

                                            {file.status === 'completed' && (
                                                <p className="text-xs text-green-600 mt-1">Processing completed</p>
                                            )}
                                        </div>
                                    </div>

                                    {file.status === 'pending' && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeFile(file.id)}
                                            className="ml-2"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            ))}

                            {/* Upload Button */}
                            {hasPendingFiles && (
                                <div className="pt-4 border-t">
                                    <Button
                                        variant="primary"
                                        onClick={handleFileUpload}
                                        disabled={isUploading || !(selectedCompany?.name || companyName.trim())}
                                        className="w-full"
                                    >
                                        {isUploading ? 'Uploading...' : `Upload ${files.filter(f => f.status === 'pending').length} File(s)`}
                                    </Button>
                                </div>
                            )}

                            {/* Status Summary */}
                            {(hasCompletedFiles || hasErrors) && (
                                <div className="pt-4 border-t">
                                    <div className="flex items-center justify-between text-sm">
                                        {hasCompletedFiles && (
                                            <span className="text-green-600">
                                                ✓ {files.filter(f => f.status === 'completed').length} completed
                                            </span>
                                        )}
                                        {hasErrors && (
                                            <span className="text-red-600">
                                                ✗ {files.filter(f => f.status === 'error').length} failed
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Expected Data */}
            <Card>
                <CardHeader>
                    <h4 className="font-semibold text-neutral-90">What We'll Extract</h4>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <h5 className="font-medium text-neutral-80 text-sm">Financial Statements</h5>
                            <ul className="text-xs text-neutral-600 space-y-1">
                                <li>• Balance Sheet (3-5 years)</li>
                                <li>• Profit & Loss Statement</li>
                                <li>• Cash Flow Statement</li>
                                <li>• Financial Ratios</li>
                            </ul>
                        </div>

                        <div className="space-y-2">
                            <h5 className="font-medium text-neutral-80 text-sm">Company Information</h5>
                            <ul className="text-xs text-neutral-600 space-y-1">
                                <li>• Basic company details</li>
                                <li>• Director information</li>
                                <li>• Shareholding pattern</li>
                                <li>• Business activities</li>
                            </ul>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Tips */}
            <Alert variant="info">
                <Info className="w-4 h-4" />
                <div>
                    <p className="font-medium">Tips for Best Results</p>
                    <ul className="text-sm mt-1 list-disc list-inside space-y-0.5">
                        <li>Ensure financial data is in standard Excel formats</li>
                        <li>Include multiple years of data when available</li>
                        <li>Keep file sizes under 50MB for faster processing</li>
                        <li>Use clear sheet names (Balance Sheet, P&L, etc.)</li>
                    </ul>
                </div>
            </Alert>
        </div>
    )
}