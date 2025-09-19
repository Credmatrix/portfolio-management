"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";
import { CompanyDetails } from "@/types/company.types";
import { Database } from "@/types/database.types";
import {
    Zap,
    Building2,
    Settings,
    CheckCircle,
    AlertCircle,
    Loader2,
    Database as DatabaseIcon,
    Clock,
    Upload,
    File,
    X,
    Info,
    RefreshCw
} from "lucide-react";

type Industry = Database['public']['Enums']['industry_type'];
type ModelType = Database['public']['Enums']['model_type'];

interface UnifiedProcessingProps {
    selectedCompany: CompanyDetails | null;
    onProcessingStart: (requestId: string) => void;
    onUploadComplete?: (request: any) => void;
    onStatusUpdate?: (requestId: string, status: string, progress?: number) => void;
}

interface ProcessingResult {
    request_id: string;
    status: string;
    message: string;
    has_existing_data: boolean;
}

interface DataStatus {
    exists: boolean;
    has_comprehensive_data: boolean;
    data_cached_at: string | null;
    data_age_days: number | null;
    processing_method: 'existing_data' | 'api_fetch_required';
}

interface UploadFile extends File {
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
    requestId?: string;
    stage?: string;
}

const industryOptions = [
    { value: 'manufacturing', label: 'Manufacturing' },
    { value: 'manufacturing-oem', label: 'Manufacturing - OEM' },
    { value: 'epc', label: 'EPC (Engineering, Procurement & Construction)' },
];

const modelTypeOptions = [
    { value: 'without_banking', label: 'Without Banking Data' },
    { value: 'with_banking', label: 'With Banking Data' },
];

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ['.xlsx', '.xls'];

export function UnifiedProcessing({
    selectedCompany,
    onProcessingStart,
    onUploadComplete,
    onStatusUpdate
}: UnifiedProcessingProps) {
    // Shared configuration state
    const [industry, setIndustry] = useState<Industry>('manufacturing');
    const [modelType, setModelType] = useState<ModelType>('without_banking');
    const [companyName, setCompanyName] = useState(selectedCompany?.company_name || "");

    // API Processing state
    const [isApiProcessing, setIsApiProcessing] = useState(false);
    const [apiResult, setApiResult] = useState<ProcessingResult | null>(null);
    const [dataStatus, setDataStatus] = useState<DataStatus | null>(null);
    const [isCheckingData, setIsCheckingData] = useState(false);

    // File Upload state
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Shared error state
    const [error, setError] = useState<string | null>(null);

    // Tab state
    const [activeTab, setActiveTab] = useState<'api' | 'upload'>('api');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Update company name when selectedCompany changes
    useEffect(() => {
        if (selectedCompany?.company_name) {
            setCompanyName(selectedCompany.company_name);
        }
    }, [selectedCompany]);

    // Check data status when company is selected
    useEffect(() => {
        if (selectedCompany?.cin) {
            setIsCheckingData(true);
            setDataStatus(null);
            setError(null);

            fetch(`/api/company/data-status?cin=${encodeURIComponent(selectedCompany.cin)}`)
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        setDataStatus(data.data);
                    } else {
                        setError(data.error || 'Failed to check data status');
                    }
                })
                .catch(err => {
                    setError('Failed to check company data status');
                    console.error('Data status check error:', err);
                })
                .finally(() => {
                    setIsCheckingData(false);
                });
        } else {
            setDataStatus(null);
        }
    }, [selectedCompany?.cin]);

    // API Processing functions
    const handleApiProcessing = async () => {
        if (!selectedCompany) {
            setError('Please select a company first');
            return;
        }

        setIsApiProcessing(true);
        setError(null);
        setApiResult(null);

        try {
            const response = await fetch('/api/company/process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    cin: selectedCompany.cin,
                    industry,
                    model_type: modelType,
                }),
            });

            const data = await response.json();

            if (data.success) {
                setApiResult(data.data);
                onProcessingStart(data.data.request_id);
            } else {
                setError(data.error || 'Processing failed');
            }
        } catch (err) {
            setError('Network error occurred');
            console.error('Processing error:', err);
        } finally {
            setIsApiProcessing(false);
        }
    };

    // File Upload functions
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
            setError(errors.join('\n'));
        } else {
            setError(null);
        }

        setFiles(prev => [...prev, ...validFiles]);
    }, []);

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
                    company_name: selectedCompany?.company_name || companyName,
                    cin: selectedCompany?.cin
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

            // Notify parent component
            if (onUploadComplete) {
                onUploadComplete({
                    id: request_id,
                    request_id,
                    company_name: selectedCompany?.company_name || companyName,
                    filename: file.name,
                    status: 'submitted',
                    submitted_at: new Date().toISOString()
                });
            }

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

                    // Update parent component
                    if (onStatusUpdate) {
                        onStatusUpdate(requestId, statusData.status);
                    }

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
        const effectiveCompanyName = selectedCompany?.company_name || companyName;
        if (!effectiveCompanyName.trim()) {
            setError('Company name is required');
            return;
        }

        if (files.length === 0) {
            setError('Please select at least one file');
            return;
        }

        setIsUploading(true);
        setError(null);

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

    if (!selectedCompany) {
        return (
            <Card className="p-8 text-center">
                <div className="w-16 h-16 bg-neutral-10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Building2 className="w-8 h-8 text-neutral-40" />
                </div>
                <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                    No Company Selected
                </h3>
                <p className="text-neutral-60">
                    Please search and select a company to start processing
                </p>
            </Card>
        );
    }

    const hasCompletedFiles = files.some(f => f.status === 'completed');
    const hasPendingFiles = files.some(f => f.status === 'pending');
    const hasErrors = files.some(f => f.status === 'error');

    return (
        <div className="space-y-6">
            {/* Company Information Header */}
            <Card className="p-6 bg-gradient-to-r from-blue-5 to-blue-10 border border-blue-20">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-neutral-90">
                            Company Processing
                        </h3>
                        <p className="text-sm text-neutral-60">
                            Process company data using API or document upload
                        </p>
                    </div>
                </div>

                <div className="bg-blue-5 rounded-lg p-4">
                    <h4 className="font-medium text-neutral-90 mb-2">Selected Company</h4>
                    <div className="flex items-center gap-3">
                        <Building2 className="w-5 h-5 text-neutral-60" />
                        <div>
                            <p className="font-medium text-neutral-90">{selectedCompany.company_name}</p>
                            <p className="text-sm text-neutral-60">CIN: {selectedCompany.cin}</p>
                        </div>
                    </div>
                </div>

                {/* Data Status Display */}
                {isCheckingData && (
                    <div className="bg-blue-5 rounded-lg p-4 mt-4">
                        <div className="flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-blue-60" />
                            <span className="text-sm text-neutral-70">Checking data availability...</span>
                        </div>
                    </div>
                )}

                {dataStatus && (
                    <div className="bg-blue-5 rounded-lg p-4 mt-4">
                        <h4 className="font-medium text-neutral-90 mb-3">Data Availability Status</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-2">
                                <DatabaseIcon className="w-4 h-4 text-neutral-60" />
                                <div>
                                    <p className="text-xs text-neutral-60">Data Source</p>
                                    <p className="text-sm font-medium text-neutral-90">
                                        {dataStatus.has_comprehensive_data ? 'Database Cache' : 'API Fetch Required'}
                                    </p>
                                </div>
                            </div>

                            {dataStatus.data_age_days !== null && (
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-neutral-60" />
                                    <div>
                                        <p className="text-xs text-neutral-60">Data Age</p>
                                        <p className="text-sm font-medium text-neutral-90">
                                            {dataStatus.data_age_days === 0 ? 'Today' : `${dataStatus.data_age_days} days old`}
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="mt-3 p-2 bg-blue-10 rounded text-xs text-blue-80">
                            {dataStatus.processing_method === 'existing_data'
                                ? '✓ Processing will use cached data for faster results'
                                : '⚡ Fresh data will be fetched from external APIs'
                            }
                        </div>
                    </div>
                )}
            </Card>

            {/* Configuration Section */}
            <Card className="p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Settings className="w-5 h-5 text-neutral-60" />
                    <h3 className="text-lg font-semibold text-neutral-90">
                        Processing Configuration
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Industry Type
                        </label>
                        <Select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value as Industry)}
                            disabled={isApiProcessing || isUploading}
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
                            disabled={isApiProcessing || isUploading}
                        >
                            {modelTypeOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                    {option.label}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>
            </Card>

            {/* Processing Options Tabs */}
            <div className="w-full">
                <div className="flex border-b border-neutral-20 mb-6">
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'api'
                            ? 'border-blue-50 text-blue-60'
                            : 'border-transparent text-neutral-60 hover:text-neutral-90'
                            }`}
                        onClick={() => setActiveTab('api')}
                    >
                        <Zap className="w-4 h-4 mr-2 inline" />
                        API Processing
                    </button>
                    <button
                        className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'upload'
                            ? 'border-blue-50 text-blue-60'
                            : 'border-transparent text-neutral-60 hover:text-neutral-90'
                            }`}
                        onClick={() => setActiveTab('upload')}
                    >
                        <Upload className="w-4 h-4 mr-2 inline" />
                        Document Upload
                    </button>
                </div>

                {/* API Processing Tab */}
                {activeTab === 'api' && (
                    <Card className="p-6">
                        <div className="mb-6">
                            <Button
                                onClick={handleApiProcessing}
                                disabled={isApiProcessing}
                                className="w-full"
                            >
                                {isApiProcessing ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Starting Processing...
                                    </>
                                ) : (
                                    <>
                                        <Zap className="w-4 h-4 mr-2" />
                                        Start API Processing
                                    </>
                                )}
                            </Button>
                        </div>

                        {/* API Processing Result */}
                        {apiResult && (
                            <div className="bg-gradient-to-r from-green-5 to-green-10 border border-green-20 rounded-lg p-6 mb-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <CheckCircle className="w-6 h-6 text-green-60" />
                                    <div>
                                        <h3 className="text-lg font-semibold text-neutral-90">
                                            Processing Started Successfully
                                        </h3>
                                        <p className="text-sm text-neutral-60">
                                            Request ID: {apiResult.request_id}
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Status:</span>
                                        <span className="text-sm font-medium text-neutral-90 capitalize">
                                            {apiResult.status}
                                        </span>
                                    </div>
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-neutral-60">Data Source:</span>
                                        <span className="text-sm font-medium text-neutral-90">
                                            {apiResult.has_existing_data ? 'Existing Database' : 'Fresh API Fetch'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 p-3 bg-green-10 rounded-lg">
                                    <p className="text-sm text-green-80">{apiResult.message}</p>
                                </div>
                            </div>
                        )}
                    </Card>
                )}

                {/* Document Upload Tab */}
                {activeTab === 'upload' && (
                    <Card className="p-6">
                        <Alert variant="info" className="mb-6">
                            <Info className="w-4 h-4" />
                            <div>
                                <p className="font-medium">Supported file types:</p>
                                <p className="text-sm">Excel files (.xlsx, .xls) up to 50MB each</p>
                            </div>
                        </Alert>

                        <div
                            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors mb-6 ${isDragging
                                ? 'border-fluent-blue bg-fluent-blue/5'
                                : 'border-neutral-30 hover:border-neutral-40'
                                }`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                        >
                            <Upload className="w-12 h-12 text-neutral-50 mx-auto mb-4" />
                            <p className="text-neutral-70 mb-2">
                                Drag & drop files here, or click to select
                            </p>
                            <p className="text-sm text-neutral-50 mb-4">
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
                                variant="primary"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                            >
                                Select Files
                            </Button>
                        </div>

                        {/* File List */}
                        {files.length > 0 && (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-medium text-neutral-70">
                                        Selected Files ({files.length})
                                    </h3>
                                    {hasCompletedFiles && (
                                        <Button
                                            variant="secondary"
                                            size="sm"
                                            onClick={clearCompleted}
                                        >
                                            Clear Completed
                                        </Button>
                                    )}
                                </div>

                                {files.map((file) => (
                                    <div
                                        key={file.id}
                                        className="flex items-center justify-between p-4 bg-neutral-10 rounded-lg border"
                                    >
                                        <div className="flex items-center gap-3 flex-1">
                                            <div className="relative">
                                                <File className="w-5 h-5 text-neutral-60" />
                                                {file.status === 'completed' && (
                                                    <CheckCircle className="w-3 h-3 text-fluent-success absolute -top-1 -right-1" />
                                                )}
                                                {file.status === 'error' && (
                                                    <AlertCircle className="w-3 h-3 text-fluent-error absolute -top-1 -right-1" />
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
                                                        <p className="text-xs text-fluent-error">{file.error}</p>
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
                                                    <p className="text-xs text-fluent-success mt-1">Processing completed</p>
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
                                            disabled={isUploading || !(selectedCompany?.company_name || companyName.trim())}
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
                                                <span className="text-fluent-success">
                                                    ✓ {files.filter(f => f.status === 'completed').length} completed
                                                </span>
                                            )}
                                            {hasErrors && (
                                                <span className="text-fluent-error">
                                                    ✗ {files.filter(f => f.status === 'error').length} failed
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </Card>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <Card className="p-6 bg-gradient-to-r from-red-5 to-red-10 border border-red-20">
                    <div className="flex items-center gap-3">
                        <AlertCircle className="w-6 h-6 text-red-60" />
                        <div>
                            <h3 className="text-lg font-semibold text-neutral-90">
                                Processing Error
                            </h3>
                            <pre className="text-sm text-red-70 mt-1 whitespace-pre-wrap">{error}</pre>
                        </div>
                    </div>
                </Card>
            )}
        </div>
    );
}