/**
 * Utility functions for calculating and formatting processing time
 */

export interface ProcessingTimeResult {
    text: string;
    minutes: number;
    seconds: number;
}

/**
 * Calculate elapsed time from start to now in minutes and seconds
 */
export function calculateElapsedTime(startTime: Date): ProcessingTimeResult {
    const now = new Date();
    const elapsedMs = now.getTime() - startTime.getTime();
    const totalSeconds = Math.floor(elapsedMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const text = `${minutes}m ${seconds}s`;

    return { text, minutes, seconds };
}

/**
 * Calculate total processing time from start to end in minutes and seconds
 */
export function calculateTotalProcessingTime(startTime: Date, endTime: Date): ProcessingTimeResult {
    const totalMs = endTime.getTime() - startTime.getTime();
    const totalSeconds = Math.floor(totalMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    const text = `${minutes}m ${seconds}s`;

    return { text, minutes, seconds };
}

/**
 * Get processing status text with time information
 */
export function getProcessingStatusText(
    status: string,
    processingStartedAt?: string | null,
    completedAt?: string | null
): string {
    if (status === 'processing' && processingStartedAt) {
        const startTime = new Date(processingStartedAt);
        const elapsed = calculateElapsedTime(startTime);
        return `Processing for ${elapsed.text}`;
    }

    if (status !== 'processing' && processingStartedAt && completedAt) {
        const startTime = new Date(processingStartedAt);
        const endTime = new Date(completedAt);
        const total = calculateTotalProcessingTime(startTime, endTime);
        return `Processing ${status} in ${total.text}`;
    }

    return `Processing ${status || 'unknown'}`;
}