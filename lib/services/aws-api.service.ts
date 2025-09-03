// lib/services/aws-api.service.ts
/**
 * AWS API Service for integrating with existing AWS Lambda API
 * Handles file upload workflow, status polling, and document processing
 */

interface AWSAPIConfig {
    baseUrl: string;
    timeout: number;
}

interface UploadUrlResponse {
    uploadUrl: string;
    requestId: string;
    s3Key: string;
    expiresIn: number;
}

interface ConfirmUploadRequest {
    requestId: string;
    companyName: string;
    industry: string;
    modelType: 'with_banking' | 'without_banking';
    fileName: string;
    fileSize: number;
}

interface ProcessingStatusResponse {
    requestId: string;
    status: 'submitted' | 'processing' | 'completed' | 'failed';
    progress?: number;
    currentStage?: string;
    estimatedCompletion?: string;
    errorMessage?: string;
    downloadUrls?: {
        pdfUrl?: string;
        originalFileUrl?: string;
    };
}

interface RetryResponse {
    success: boolean;
    message: string;
    newRequestId?: string;
}

class AWSAPIService {
    private config: AWSAPIConfig;

    constructor() {
        this.config = {
            baseUrl: process.env.NEXT_PUBLIC_AWS_API_URL || 'https://z6px6n7b13.execute-api.ap-south-1.amazonaws.com/dev',
            timeout: 30000 // 30 seconds
        };
    }

    /**
     * Get signed upload URL from AWS API
     */
    async getUploadUrl(fileName: string, fileType: string): Promise<UploadUrlResponse> {
        try {
            const response = await fetch(`${this.config.baseUrl}/get-upload-url`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    fileName,
                    fileType,
                    timestamp: new Date().toISOString()
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to get upload URL`);
            }

            const data = await response.json();
            
            return {
                uploadUrl: data.uploadUrl,
                requestId: data.requestId,
                s3Key: data.s3Key,
                expiresIn: data.expiresIn || 3600
            };
        } catch (error) {
            console.error('Error getting upload URL:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to get upload URL from AWS API'
            );
        }
    }

    /**
     * Upload file to S3 using signed URL
     */
    async uploadFileToS3(uploadUrl: string, file: File, onProgress?: (progress: number) => void): Promise<void> {
        try {
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();

                // Track upload progress
                if (onProgress) {
                    xhr.upload.addEventListener('progress', (event) => {
                        if (event.lengthComputable) {
                            const progress = Math.round((event.loaded / event.total) * 100);
                            onProgress(progress);
                        }
                    });
                }

                xhr.addEventListener('load', () => {
                    if (xhr.status >= 200 && xhr.status < 300) {
                        resolve();
                    } else {
                        reject(new Error(`Upload failed with status ${xhr.status}`));
                    }
                });

                xhr.addEventListener('error', () => {
                    reject(new Error('Upload failed due to network error'));
                });

                xhr.addEventListener('timeout', () => {
                    reject(new Error('Upload timed out'));
                });

                xhr.timeout = this.config.timeout;
                xhr.open('PUT', uploadUrl);
                xhr.setRequestHeader('Content-Type', file.type);
                xhr.send(file);
            });
        } catch (error) {
            console.error('Error uploading file to S3:', error);
            throw new Error('Failed to upload file to S3');
        }
    }

    /**
     * Confirm upload and start processing
     */
    async confirmUpload(request: ConfirmUploadRequest): Promise<{ success: boolean; message: string }> {
        try {
            const response = await fetch(`${this.config.baseUrl}/confirm-upload`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    requestId: request.requestId,
                    companyName: request.companyName,
                    industry: request.industry,
                    modelType: request.modelType,
                    fileName: request.fileName,
                    fileSize: request.fileSize,
                    timestamp: new Date().toISOString()
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to confirm upload`);
            }

            const data = await response.json();
            return {
                success: true,
                message: data.message || 'Upload confirmed successfully'
            };
        } catch (error) {
            console.error('Error confirming upload:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to confirm upload with AWS API'
            );
        }
    }

    /**
     * Get processing status from AWS API
     */
    async getProcessingStatus(requestId: string): Promise<ProcessingStatusResponse> {
        try {
            const response = await fetch(`${this.config.baseUrl}/status/${requestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Processing request not found');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to get status`);
            }

            const data = await response.json();
            
            return {
                requestId: data.requestId,
                status: data.status,
                progress: data.progress,
                currentStage: data.currentStage,
                estimatedCompletion: data.estimatedCompletion,
                errorMessage: data.errorMessage,
                downloadUrls: data.downloadUrls
            };
        } catch (error) {
            console.error('Error getting processing status:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to get processing status from AWS API'
            );
        }
    }

    /**
     * Retry failed processing
     */
    async retryProcessing(requestId: string): Promise<RetryResponse> {
        try {
            const response = await fetch(`${this.config.baseUrl}/retry/${requestId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString()
                }),
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to retry processing`);
            }

            const data = await response.json();
            return {
                success: data.success || true,
                message: data.message || 'Processing retry initiated',
                newRequestId: data.newRequestId
            };
        } catch (error) {
            console.error('Error retrying processing:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to retry processing with AWS API'
            );
        }
    }

    /**
     * Get download URLs for processed documents
     */
    async getDownloadUrls(requestId: string): Promise<{ pdfUrl?: string; originalFileUrl?: string }> {
        try {
            const response = await fetch(`${this.config.baseUrl}/download-urls/${requestId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                signal: AbortSignal.timeout(this.config.timeout)
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Download URLs not available');
                }
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${response.status}: Failed to get download URLs`);
            }

            const data = await response.json();
            return {
                pdfUrl: data.pdfUrl,
                originalFileUrl: data.originalFileUrl
            };
        } catch (error) {
            console.error('Error getting download URLs:', error);
            throw new Error(
                error instanceof Error 
                    ? error.message 
                    : 'Failed to get download URLs from AWS API'
            );
        }
    }

    /**
     * Complete upload workflow - combines all steps
     */
    async uploadDocument(
        file: File,
        companyName: string,
        industry: string,
        modelType: 'with_banking' | 'without_banking',
        onProgress?: (stage: string, progress: number) => void
    ): Promise<string> {
        try {
            // Step 1: Get upload URL
            onProgress?.('Getting upload URL...', 10);
            const uploadData = await this.getUploadUrl(file.name, file.type);

            // Step 2: Upload file to S3
            onProgress?.('Uploading file...', 20);
            await this.uploadFileToS3(uploadData.uploadUrl, file, (progress) => {
                onProgress?.('Uploading file...', 20 + (progress * 0.6)); // 20-80%
            });

            // Step 3: Confirm upload and start processing
            onProgress?.('Starting processing...', 90);
            await this.confirmUpload({
                requestId: uploadData.requestId,
                companyName,
                industry,
                modelType,
                fileName: file.name,
                fileSize: file.size
            });

            onProgress?.('Upload complete', 100);
            return uploadData.requestId;
        } catch (error) {
            console.error('Error in upload workflow:', error);
            throw error;
        }
    }

    /**
     * Poll processing status with exponential backoff
     */
    async pollProcessingStatus(
        requestId: string,
        onStatusUpdate?: (status: ProcessingStatusResponse) => void,
        maxAttempts: number = 60, // 5 minutes with 5-second intervals
        initialDelay: number = 5000
    ): Promise<ProcessingStatusResponse> {
        let attempts = 0;
        let delay = initialDelay;

        while (attempts < maxAttempts) {
            try {
                const status = await this.getProcessingStatus(requestId);
                onStatusUpdate?.(status);

                // If processing is complete or failed, return the status
                if (status.status === 'completed' || status.status === 'failed') {
                    return status;
                }

                // Wait before next poll
                await new Promise(resolve => setTimeout(resolve, delay));
                
                attempts++;
                // Exponential backoff with max delay of 30 seconds
                delay = Math.min(delay * 1.1, 30000);
            } catch (error) {
                console.error(`Error polling status (attempt ${attempts + 1}):`, error);
                attempts++;
                
                // If we've exhausted attempts, throw the error
                if (attempts >= maxAttempts) {
                    throw error;
                }
                
                // Wait before retrying
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        throw new Error('Processing status polling timed out');
    }
}

// Export singleton instance
export const awsApiService = new AWSAPIService();
export type { UploadUrlResponse, ProcessingStatusResponse, RetryResponse };