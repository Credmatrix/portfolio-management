import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'

interface ProcessingStage {
    id: string;
    name: string;
    description: string;
    status: 'pending' | 'active' | 'completed' | 'error';
    progress?: number;
    startTime?: string;
    endTime?: string;
    error?: string;
}

const DEFAULT_STAGES: ProcessingStage[] = [
    {
        id: 'validation',
        name: 'Document Validation',
        description: 'Validating uploaded document format and content',
        status: 'pending'
    },
    {
        id: 'extraction',
        name: 'Data Extraction',
        description: 'Extracting financial data and company information',
        status: 'pending'
    },
    {
        id: 'analysis',
        name: 'Risk Analysis',
        description: 'Calculating risk scores and parameter analysis',
        status: 'pending'
    },
    {
        id: 'benchmarking',
        name: 'Peer Benchmarking',
        description: 'Comparing against industry peers and standards',
        status: 'pending'
    },
    {
        id: 'reporting',
        name: 'Report Generation',
        description: 'Generating comprehensive analysis report',
        status: 'pending'
    }
];

function calculateProgress(status: string, stages: ProcessingStage[]): number {
    if (status === 'completed') return 100;
    if (status === 'failed') return 0;
    if (status === 'submitted') return 0;

    const completedStages = stages.filter(stage => stage.status === 'completed').length;
    const activeStages = stages.filter(stage => stage.status === 'active').length;

    // Give partial credit for active stages
    const progress = (completedStages + (activeStages * 0.5)) / stages.length * 100;
    return Math.round(progress);
}

function updateStagesBasedOnStatus(status: string, currentStage?: string): ProcessingStage[] {
    const stages = [...DEFAULT_STAGES];

    if (status === 'completed') {
        return stages.map(stage => ({ ...stage, status: 'completed' as const }));
    }

    if (status === 'failed') {
        const failedStageIndex = stages.findIndex(stage => stage.id === currentStage);
        return stages.map((stage, index) => {
            if (index < failedStageIndex) return { ...stage, status: 'completed' as const };
            if (index === failedStageIndex) return { ...stage, status: 'error' as const };
            return stage;
        });
    }

    if (status === 'processing' && currentStage) {
        const activeStageIndex = stages.findIndex(stage => stage.id === currentStage);
        return stages.map((stage, index) => {
            if (index < activeStageIndex) return { ...stage, status: 'completed' as const };
            if (index === activeStageIndex) return { ...stage, status: 'active' as const };
            return stage;
        });
    }

    return stages;
}

function estimateCompletion(status: string, submittedAt: string): string | undefined {
    if (status !== 'processing') return undefined;

    const submitted = new Date(submittedAt);
    const now = new Date();
    const elapsed = now.getTime() - submitted.getTime();

    // Estimate 5-10 minutes total processing time
    const estimatedTotal = 7 * 60 * 1000; // 7 minutes in milliseconds
    const remaining = Math.max(0, estimatedTotal - elapsed);

    return new Date(now.getTime() + remaining).toISOString();
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ requestId: string }> }
) {
    // try {
    //     const supabase = await createServerSupabaseClient()

    //     const { data: { user }, error: authError } = await supabase.auth.getUser()
    //     if (authError || !user) {
    //         return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    //     }

    //     const { requestId } = await params

    //     // Get the processing request
    //     const { data: request, error: fetchError } = await supabase
    //         .from('document_processing_requests')
    //         .select('*')
    //         .eq('request_id', requestId)
    //         .eq('user_id', user.id)
    //         .single()

    //     if (fetchError || !request) {
    //         return NextResponse.json({
    //             error: 'Processing request not found'
    //         }, { status: 404 })
    //     }

    //     // Determine current stage based on status and processing details
    //     let currentStage: string | undefined;
    //     if (request.status === 'processing') {
    //         // In a real implementation, this would come from the processing pipeline
    //         // For now, we'll simulate based on elapsed time
    //         const elapsed = Date.now() - new Date(request.processing_started_at || request.submitted_at).getTime();
    //         const minutes = elapsed / (1000 * 60);

    //         if (minutes < 1) currentStage = 'validation';
    //         else if (minutes < 2) currentStage = 'extraction';
    //         else if (minutes < 4) currentStage = 'analysis';
    //         else if (minutes < 6) currentStage = 'benchmarking';
    //         else currentStage = 'reporting';
    //     }

    //     const stages = updateStagesBasedOnStatus(request.status, currentStage);
    //     const progress = calculateProgress(request.status, stages);
    //     const estimatedCompletion = estimateCompletion(request.status, request.submitted_at);

    //     // Get processing logs (if available)
    //     const { data: logs } = await supabase
    //         .from('processing_logs')
    //         .select('message, timestamp')
    //         .eq('request_id', requestId)
    //         .order('timestamp', { ascending: true })
    //         .limit(50);

    //     const processingLogs = logs?.map(log =>
    //         `[${new Date(log.timestamp).toLocaleTimeString()}] ${log.message}`
    //     ) || [];

    //     const response = {
    //         request_id: requestId,
    //         company_name: request.company_name || 'Unknown Company',
    //         status: request.status,
    //         current_stage: currentStage,
    //         progress,
    //         stages,
    //         estimated_completion: estimatedCompletion,
    //         error_message: request.error_message,
    //         processing_logs: processingLogs,
    //         submitted_at: request.submitted_at,
    //         processing_started_at: request.processing_started_at,
    //         completed_at: request.completed_at,
    //         retry_count: request.retry_count || 0
    //     };

    //     return NextResponse.json(response)

    // } catch (error) {
    //     console.error('Status fetch error:', error)
    //     return NextResponse.json({
    //         error: 'Internal server error'
    //     }, { status: 500 })
    // }
}