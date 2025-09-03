"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, File, X, AlertCircle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Alert } from "@/components/ui/Alert";
import { Progress } from "@/components/ui/Progress";

interface FileUploadProps {
    onUploadComplete: (request: any) => void;
    onStatusUpdate: (requestId: string, status: string, progress?: number) => void;
}

interface UploadFile extends File {
    id: string;
    progress: number;
    status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
    error?: string;
    requestId?: string;
    stage?: string;
}

const SUPPORTED_INDUSTRIES = [
    'manufacturing-oem',
    'epc'
];

const INDUSTRY_LABELS = {
    'manufacturing-oem': 'Manufacturing OEM',
    'epc': 'EPC'
};

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const SUPPORTED_TYPES = ['.xlsx', '.xls'];

export function FileUpload({ onUploadComplete, onStatusUpdate }: FileUploadProps) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [companyName, setCompanyName] = useState("");
    const [industry, setIndustry] = useState("manufacturing-oem");
    const [modelType, setModelType] = useState("without_banking");
    const [isDragging, setIsDragging] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

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
            setUploadError(errors.join('\n'));
        } else {
            setUploadError(null);
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
                    company_name: companyName
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
            onUploadComplete({
                id: request_id,
                request_id,
                company_name: companyName,
                filename: file.name,
                status: 'submitted',
                submitted_at: new Date().toISOString()
            });

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
                    onStatusUpdate(requestId, statusData.status);

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

    const handleUpload = async () => {
        if (!companyName.trim()) {
            setUploadError('Company name is required');
            return;
        }

        if (files.length === 0) {
            setUploadError('Please select at least one file');
            return;
        }

        setIsUploading(true);
        setUploadError(null);

        try {
            // Upload files sequentially
            for (const file of files.filter(f => f.status === 'pending')) {
                await uploadFile(file);
            }
        } finally {
            setIsUploading(false);
        }
    };

    const clearCompleted = () => {
        setFiles(prev => prev.filter(f => f.status !== 'completed'));
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

    const hasCompletedFiles = files.some(f => f.status === 'completed');
    const hasPendingFiles = files.some(f => f.status === 'pending');
    const hasErrors = files.some(f => f.status === 'error');

    return (
        <div className="space-y-6">
            {/* Configuration Section */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-90 mb-4">
                    Document Configuration
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Company Name *
                        </label>
                        <Input
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="Enter company name"
                            className="w-full"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Industry *
                        </label>
                        <Select
                            value={industry}
                            onChange={(e) => setIndustry(e.target.value)}
                            className="w-full"
                        >
                            {SUPPORTED_INDUSTRIES.map(ind => (
                                <option key={ind} value={ind}>
                                    {INDUSTRY_LABELS[ind as keyof typeof INDUSTRY_LABELS]}
                                </option>
                            ))}
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-neutral-70 mb-2">
                            Analysis Model
                        </label>
                        <Select
                            value={modelType}
                            onChange={(e) => setModelType(e.target.value)}
                            className="w-full"
                            disabled={true}
                        >
                            <option value="without_banking">Without Banking Data</option>
                            <option value="with_banking">With Banking Data</option>
                        </Select>
                    </div>
                </div>

                <Alert variant="info" className="mb-4">
                    <Info className="w-4 h-4" />
                    <div>
                        <p className="font-medium">Supported file types:</p>
                        <p className="text-sm">Excel files (.xlsx, .xls) up to 50MB each</p>
                    </div>
                </Alert>
            </Card>

            {/* File Upload Section */}
            <Card className="p-6">
                <h2 className="text-lg font-semibold text-neutral-90 mb-4">
                    Upload Documents
                </h2>

                <div
                    className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging
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

                {/* Error Display */}
                {uploadError && (
                    <Alert variant="error" className="mt-4">
                        <AlertCircle className="w-4 h-4" />
                        <div>
                            <p className="font-medium">Upload Error</p>
                            <pre className="text-sm whitespace-pre-wrap">{uploadError}</pre>
                        </div>
                    </Alert>
                )}

                {/* File List */}
                {files.length > 0 && (
                    <div className="mt-6 space-y-3">
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
                                    onClick={handleUpload}
                                    disabled={isUploading || !companyName.trim()}
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
        </div>
    );
}