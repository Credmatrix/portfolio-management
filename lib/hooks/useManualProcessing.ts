'use client'

import { useState, useCallback } from 'react';
import { EntityType } from '@/types/manual-company.types';

export interface ManualProcessingData {
    entity_type: EntityType;
    basic_details: any;
    ownership_structure?: any;
    financial_data?: any;
    compliance_data?: any;
}

export interface ProcessingStatus {
    request_id?: string;
    status: 'idle' | 'processing' | 'completed' | 'failed';
    progress: number;
    current_step: string;
    data_completeness_score?: number;
    risk_analysis?: any;
    error?: string;
}

export interface UseManualProcessingReturn {
    processingStatus: ProcessingStatus;
    processManualEntry: (data: ManualProcessingData) => Promise<void>;
    updateManualEntry: (requestId: string, updates: Partial<ManualProcessingData>) => Promise<void>;
    getProcessingStatus: (requestId: string) => Promise<void>;
    resetProcessing: () => void;
}

export function useManualProcessing(): UseManualProcessingReturn {
    const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
        status: 'idle',
        progress: 0,
        current_step: ''
    });

    const processManualEntry = useCallback(async (data: ManualProcessingData) => {
        try {
            setProcessingStatus({
                status: 'processing',
                progress: 0,
                current_step: 'Initializing manual processing...'
            });

            // Step 1: Validate data
            setProcessingStatus(prev => ({
                ...prev,
                progress: 20,
                current_step: 'Validating form data...'
            }));

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 2: Calculate data completeness
            setProcessingStatus(prev => ({
                ...prev,
                progress: 40,
                current_step: 'Calculating data completeness score...'
            }));

            await new Promise(resolve => setTimeout(resolve, 1000));

            // Step 3: Perform risk analysis
            setProcessingStatus(prev => ({
                ...prev,
                progress: 60,
                current_step: 'Performing risk analysis with available data...'
            }));

            await new Promise(resolve => setTimeout(resolve, 1500));

            // Step 4: Generate processing request
            setProcessingStatus(prev => ({
                ...prev,
                progress: 80,
                current_step: 'Creating document processing request...'
            }));

            const response = await fetch('/api/company/manual-process', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Processing failed');
            }

            const result = await response.json();

            // Step 5: Complete processing
            setProcessingStatus(prev => ({
                ...prev,
                progress: 100,
                current_step: 'Processing completed successfully'
            }));

            await new Promise(resolve => setTimeout(resolve, 500));

            setProcessingStatus({
                status: 'completed',
                progress: 100,
                current_step: 'Manual entry processed successfully',
                request_id: result.data.request_id,
                data_completeness_score: result.data.data_completeness_score,
                risk_analysis: result.data.risk_analysis
            });

        } catch (error) {
            console.error('Manual processing error:', error);
            setProcessingStatus({
                status: 'failed',
                progress: 0,
                current_step: 'Processing failed',
                error: error instanceof Error ? error.message : 'Unknown error'
            });
        }
    }, []);

    const updateManualEntry = useCallback(async (
        requestId: string,
        updates: Partial<ManualProcessingData>
    ) => {
        try {
            setProcessingStatus(prev => ({
                ...prev,
                status: 'processing',
                current_step: 'Updating manual entry...'
            }));

            const response = await fetch('/api/company/manual-process', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    request_id: requestId,
                    ...updates
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Update failed');
            }

            setProcessingStatus(prev => ({
                ...prev,
                status: 'completed',
                current_step: 'Manual entry updated successfully'
            }));

        } catch (error) {
            console.error('Manual entry update error:', error);
            setProcessingStatus(prev => ({
                ...prev,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Update failed'
            }));
        }
    }, []);

    const getProcessingStatus = useCallback(async (requestId: string) => {
        try {
            const response = await fetch(`/api/company/manual-process?request_id=${requestId}`);

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to get status');
            }

            const result = await response.json();
            const statusData = result.data.combined_status;

            setProcessingStatus({
                status: statusData.status === 'completed' ? 'completed' : 'processing',
                progress: statusData.status === 'completed' ? 100 : 50,
                current_step: statusData.processing_notes || 'Processing...',
                request_id: statusData.request_id,
                data_completeness_score: statusData.data_completeness_score,
                risk_analysis: statusData.risk_analysis
            });

        } catch (error) {
            console.error('Get processing status error:', error);
            setProcessingStatus(prev => ({
                ...prev,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Failed to get status'
            }));
        }
    }, []);

    const resetProcessing = useCallback(() => {
        setProcessingStatus({
            status: 'idle',
            progress: 0,
            current_step: ''
        });
    }, []);

    return {
        processingStatus,
        processManualEntry,
        updateManualEntry,
        getProcessingStatus,
        resetProcessing
    };
}