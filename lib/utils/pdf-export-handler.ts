/**
 * Utility functions for handling PDF export operations
 */

export interface ExportOptions {
    type?: 'full' | 'summary'
    format?: 'pdf'
    onStart?: () => void
    onSuccess?: (filename: string) => void
    onError?: (error: string) => void
}

export class PDFExportHandler {
    /**
     * Handle PDF export with proper error handling and user feedback
     */
    static async exportReport(
        reportId: string,
        options: ExportOptions = {}
    ): Promise<void> {
        const {
            type = 'full',
            format = 'pdf',
            onStart,
            onSuccess,
            onError
        } = options

        try {
            onStart?.()

            const response = await fetch(
                `/api/deep-research/reports/${reportId}/export?format=${format}&type=${type}`
            )

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: 'Unknown error' }))
                throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
            }

            const blob = await response.blob()

            // Validate blob
            if (blob.size === 0) {
                throw new Error('Generated PDF is empty')
            }

            // Create download
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url

            // Extract filename from response headers
            const contentDisposition = response.headers.get('content-disposition')
            let filename = `research-report-${reportId}-${type}.pdf`

            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/)
                if (filenameMatch) {
                    filename = filenameMatch[1]
                }
            }

            a.download = filename
            document.body.appendChild(a)
            a.click()

            // Cleanup
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)

            onSuccess?.(filename)

        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred'
            console.error('PDF export error:', error)
            onError?.(errorMessage)
        }
    }

    /**
     * Validate export parameters
     */
    static validateExportParams(reportId: string, type: string): boolean {
        if (!reportId || typeof reportId !== 'string') {
            throw new Error('Invalid report ID')
        }

        if (!['full', 'summary'].includes(type)) {
            throw new Error('Invalid export type. Must be "full" or "summary"')
        }

        return true
    }

    /**
     * Get user-friendly error messages
     */
    static getErrorMessage(error: unknown): string {
        if (error instanceof Error) {
            // Handle specific error types
            if (error.message.includes('404')) {
                return 'Report not found. It may have been deleted or you may not have access.'
            }

            if (error.message.includes('400')) {
                return 'Invalid report data. The report may be incomplete or corrupted.'
            }

            if (error.message.includes('500')) {
                return 'Server error occurred while generating the PDF. Please try again later.'
            }

            if (error.message.includes('network') || error.message.includes('fetch')) {
                return 'Network error. Please check your connection and try again.'
            }

            return error.message
        }

        return 'An unexpected error occurred while exporting the report.'
    }

    /**
     * Check if browser supports PDF download
     */
    static isBrowserSupported(): boolean {
        return (
            typeof window !== 'undefined' &&
            typeof window.URL !== 'undefined' &&
            typeof window.URL.createObjectURL === 'function' &&
            typeof document !== 'undefined' &&
            typeof document.createElement === 'function'
        )
    }

    /**
     * Estimate PDF generation time based on report size
     */
    static estimateGenerationTime(sectionsCount: number): number {
        // Base time + time per section (in seconds)
        const baseTime = 2
        const timePerSection = 0.5
        return Math.max(baseTime + (sectionsCount * timePerSection), 3)
    }
}