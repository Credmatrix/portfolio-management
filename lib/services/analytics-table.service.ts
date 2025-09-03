// /**
//  * Analytics Table Service
//  * Manages analytics table operations, synchronization, and monitoring
//  */

// import { createServerSupabaseClient } from '@/lib/supabase/server'
// import type {
//   AnalyticsTableStatus,
//   SyncError,
//   SyncOperationStatus,
//   SyncHealthMetrics,
//   ValidationResult,
//   RetryResult,
//   RebuildResult
// } from '@/types/analytics-table.types'

// export class AnalyticsTableService {
//   private supabase = createServerSupabaseClient()

//   /**
//    * Manually sync analytics table for specific request IDs or all records
//    */
//   async syncAnalyticsTable(requestIds?: string[]): Promise<{
//     synced_count: number
//     error_count: number
//     message: string
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('sync_portfolio_analytics', {
//         p_request_id: requestIds?.length === 1 ? requestIds[0] : null
//       })

//       if (error) {
//         throw new Error(`Sync failed: ${error.message}`)
//       }

//       return data[0] || { synced_count: 0, error_count: 0, message: 'No records to sync' }
//     } catch (error) {
//       console.error('Analytics table sync error:', error)
//       throw error
//     }
//   }

//   /**
//    * Batch sync with progress tracking
//    */
//   async batchSyncAnalyticsTable(options: {
//     batchSize?: number
//     requestIds?: string[]
//     createdBy?: string
//   } = {}): Promise<{
//     batch_id: string
//     operation_id: string
//     total_records: number
//     message: string
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('batch_sync_portfolio_analytics', {
//         p_batch_size: options.batchSize || 100,
//         p_request_ids: options.requestIds || null,
//         p_created_by: options.createdBy || 'system'
//       })

//       if (error) {
//         throw new Error(`Batch sync failed: ${error.message}`)
//       }

//       return data[0]
//     } catch (error) {
//       console.error('Batch sync error:', error)
//       throw error
//     }
//   }

//   /**
//    * Validate analytics data consistency
//    */
//   async validateAnalyticsData(requestIds?: string[]): Promise<{
//     operation_id: string
//     total_validated: number
//     valid_records: number
//     invalid_records: number
//     validation_details: any[]
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('comprehensive_analytics_validation', {
//         p_request_ids: requestIds || null,
//         p_created_by: 'system'
//       })

//       if (error) {
//         throw new Error(`Validation failed: ${error.message}`)
//       }

//       return data[0]
//     } catch (error) {
//       console.error('Analytics validation error:', error)
//       throw error
//     }
//   }

//   /**
//    * Rollback analytics data for specific records
//    */
//   async rollbackAnalyticsSync(requestIds: string[], createdBy = 'system'): Promise<{
//     operation_id: string
//     rolled_back_count: number
//     message: string
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('rollback_analytics_sync', {
//         p_request_ids: requestIds,
//         p_created_by: createdBy
//       })

//       if (error) {
//         throw new Error(`Rollback failed: ${error.message}`)
//       }

//       return data[0]
//     } catch (error) {
//       console.error('Analytics rollback error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get analytics table status and health
//    */
//   async getAnalyticsTableStatus(): Promise<AnalyticsTableStatus> {
//     try {
//       const { data, error } = await this.supabase.rpc('get_analytics_table_status')

//       if (error) {
//         throw new Error(`Failed to get status: ${error.message}`)
//       }

//       return data[0] || {
//         total_records: 0,
//         synced_records: 0,
//         pending_sync: 0,
//         error_records: 0,
//         last_sync_time: null,
//         sync_coverage_percentage: 0
//       }
//     } catch (error) {
//       console.error('Get analytics status error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get sync operation status and progress
//    */
//   async getSyncOperationStatus(operationId?: string): Promise<SyncOperationStatus[]> {
//     try {
//       const { data, error } = await this.supabase.rpc('get_sync_operation_status', {
//         p_operation_id: operationId || null
//       })

//       if (error) {
//         throw new Error(`Failed to get operation status: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Get operation status error:', error)
//       throw error
//     }
//   }

//   /**
//    * Cancel a running sync operation
//    */
//   async cancelSyncOperation(operationId: string): Promise<{
//     operation_id: string
//     previous_status: string
//     message: string
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('cancel_sync_operation', {
//         p_operation_id: operationId
//       })

//       if (error) {
//         throw new Error(`Failed to cancel operation: ${error.message}`)
//       }

//       return data[0]
//     } catch (error) {
//       console.error('Cancel operation error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get detailed sync health metrics
//    */
//   async getSyncHealthMetrics(): Promise<SyncHealthMetrics[]> {
//     try {
//       const { data, error } = await this.supabase.rpc('get_sync_health_metrics')

//       if (error) {
//         throw new Error(`Failed to get health metrics: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Get health metrics error:', error)
//       throw error
//     }
//   }

//   /**
//    * Retry failed sync operations
//    */
//   async retryFailedSyncs(maxRetries = 3): Promise<Array<{
//     request_id: string
//     retry_status: string
//     message: string
//   }>> {
//     try {
//       const { data, error } = await this.supabase.rpc('retry_failed_syncs', {
//         max_retries: maxRetries
//       })

//       if (error) {
//         throw new Error(`Failed to retry syncs: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Retry failed syncs error:', error)
//       throw error
//     }
//   }

//   /**
//    * Rebuild entire analytics table
//    */
//   async rebuildAnalyticsTable(): Promise<{
//     total_processed: number
//     successful_syncs: number
//     failed_syncs: number
//     execution_time_seconds: number
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('rebuild_analytics_table')

//       if (error) {
//         throw new Error(`Rebuild failed: ${error.message}`)
//       }

//       return data[0]
//     } catch (error) {
//       console.error('Rebuild analytics table error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get sync errors with filtering and pagination
//    */
//   async getSyncErrors(options: {
//     resolved?: boolean
//     requestIds?: string[]
//     limit?: number
//     offset?: number
//   } = {}): Promise<{
//     errors: SyncError[]
//     total_count: number
//   }> {
//     try {
//       let query = this.supabase
//         .from('portfolio_analytics_sync_errors')
//         .select('*', { count: 'exact' })
//         .order('last_attempt', { ascending: false })

//       if (options.resolved !== undefined) {
//         query = query.eq('resolved', options.resolved)
//       }

//       if (options.requestIds?.length) {
//         query = query.in('request_id', options.requestIds)
//       }

//       if (options.limit) {
//         const offset = options.offset || 0
//         query = query.range(offset, offset + options.limit - 1)
//       }

//       const { data, error, count } = await query

//       if (error) {
//         throw new Error(`Failed to get sync errors: ${error.message}`)
//       }

//       return {
//         errors: data || [],
//         total_count: count || 0
//       }
//     } catch (error) {
//       console.error('Get sync errors error:', error)
//       throw error
//     }
//   }

//   /**
//    * Mark sync errors as resolved
//    */
//   async resolveSyncErrors(requestIds: string[]): Promise<number> {
//     try {
//       const { error, count } = await this.supabase
//         .from('portfolio_analytics_sync_errors')
//         .update({ resolved: true, last_attempt: new Date().toISOString() })
//         .in('request_id', requestIds)

//       if (error) {
//         throw new Error(`Failed to resolve sync errors: ${error.message}`)
//       }

//       return count || 0
//     } catch (error) {
//       console.error('Resolve sync errors error:', error)
//       throw error
//     }
//   }

//   /**
//    * Cleanup old sync status records
//    */
//   async cleanupSyncStatusRecords(retentionDays = 30): Promise<{
//     deleted_count: number
//     message: string
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('cleanup_sync_status_records', {
//         p_retention_days: retentionDays
//       })

//       if (error) {
//         throw new Error(`Cleanup failed: ${error.message}`)
//       }

//       return data[0]
//     } catch (error) {
//       console.error('Cleanup sync status error:', error)
//       throw error
//     }
//   }

//   /**
//    * Manual sync function for data consistency checks and repairs
//    * Provides comprehensive sync with validation and error handling
//    */
//   async manualSyncWithValidation(options: {
//     requestIds?: string[]
//     validateBeforeSync?: boolean
//     validateAfterSync?: boolean
//     repairInconsistencies?: boolean
//     createdBy?: string
//   } = {}): Promise<{
//     operation_id: string
//     sync_result: {
//       synced_count: number
//       error_count: number
//       message: string
//     }
//     validation_result?: {
//       total_validated: number
//       valid_records: number
//       invalid_records: number
//       validation_details: any[]
//     }
//     repair_result?: {
//       repaired_count: number
//       repair_details: any[]
//     }
//   }> {
//     try {
//       const operationId = crypto.randomUUID()
//       let syncResult: any
//       let validationResult: any
//       let repairResult: any

//       // Step 1: Pre-sync validation if requested
//       if (options.validateBeforeSync) {
//         validationResult = await this.validateAnalyticsData(options.requestIds)

//         // If repair is enabled and issues found, attempt repairs
//         if (options.repairInconsistencies && validationResult.invalid_records > 0) {
//           repairResult = await this.repairDataInconsistencies(
//             validationResult.validation_details.map((d: any) => d.request_id)
//           )
//         }
//       }

//       // Step 2: Perform sync
//       if (options.requestIds && options.requestIds.length === 1) {
//         syncResult = await this.syncAnalyticsTable(options.requestIds)
//       } else {
//         syncResult = await this.batchSyncAnalyticsTable({
//           requestIds: options.requestIds,
//           createdBy: options.createdBy
//         })
//       }

//       // Step 3: Post-sync validation if requested
//       if (options.validateAfterSync) {
//         const postValidation = await this.validateAnalyticsData(options.requestIds)
//         validationResult = validationResult || postValidation
//       }

//       return {
//         operation_id: operationId,
//         sync_result: syncResult,
//         validation_result: validationResult,
//         repair_result: repairResult
//       }
//     } catch (error) {
//       console.error('Manual sync with validation error:', error)
//       throw error
//     }
//   }

//   /**
//    * Repair data inconsistencies between main table and analytics table
//    */
//   async repairDataInconsistencies(requestIds: string[]): Promise<{
//     repaired_count: number
//     repair_details: Array<{
//       request_id: string
//       repair_type: string
//       status: 'success' | 'failed'
//       message: string
//     }>
//   }> {
//     try {
//       const repairDetails: Array<{
//         request_id: string
//         repair_type: string
//         status: 'success' | 'failed'
//         message: string
//       }> = []

//       let repairedCount = 0

//       for (const requestId of requestIds) {
//         try {
//           // Force re-sync the record
//           const syncResult = await this.syncAnalyticsTable([requestId])

//           if (syncResult.synced_count > 0) {
//             repairDetails.push({
//               request_id: requestId,
//               repair_type: 'force_resync',
//               status: 'success',
//               message: 'Successfully re-synced analytics data'
//             })
//             repairedCount++
//           } else {
//             repairDetails.push({
//               request_id: requestId,
//               repair_type: 'force_resync',
//               status: 'failed',
//               message: 'No records were synced'
//             })
//           }
//         } catch (error) {
//           repairDetails.push({
//             request_id: requestId,
//             repair_type: 'force_resync',
//             status: 'failed',
//             message: error instanceof Error ? error.message : 'Unknown error'
//           })
//         }
//       }

//       return {
//         repaired_count: repairedCount,
//         repair_details: repairDetails
//       }
//     } catch (error) {
//       console.error('Repair data inconsistencies error:', error)
//       throw error
//     }
//   }

//   /**
//    * Compare main table vs analytics table data consistency
//    */
//   async compareDataConsistency(requestIds?: string[]): Promise<{
//     total_compared: number
//     consistent_records: number
//     inconsistent_records: number
//     missing_in_analytics: number
//     orphaned_in_analytics: number
//     inconsistency_details: Array<{
//       request_id: string
//       issue_type: string
//       main_table_value: any
//       analytics_table_value: any
//       description: string
//     }>
//   }> {
//     try {
//       const query = `
//         WITH main_data AS (
//           SELECT 
//             request_id,
//             company_name,
//             industry,
//             risk_score,
//             risk_grade,
//             status,
//             updated_at as main_updated_at
//           FROM document_processing_requests
//           WHERE status = 'completed' AND risk_analysis IS NOT NULL
//           ${requestIds ? 'AND request_id = ANY($1)' : ''}
//         ),
//         analytics_data AS (
//           SELECT 
//             request_id,
//             company_name,
//             industry,
//             risk_score,
//             risk_grade,
//             processing_status,
//             updated_at as analytics_updated_at
//           FROM portfolio_analytics
//           ${requestIds ? 'WHERE request_id = ANY($1)' : ''}
//         ),
//         comparison AS (
//           SELECT 
//             COALESCE(m.request_id, a.request_id) as request_id,
//             m.company_name as main_company_name,
//             a.company_name as analytics_company_name,
//             m.industry as main_industry,
//             a.industry as analytics_industry,
//             m.risk_score as main_risk_score,
//             a.risk_score as analytics_risk_score,
//             m.risk_grade as main_risk_grade,
//             a.risk_grade as analytics_risk_grade,
//             m.main_updated_at,
//             a.analytics_updated_at,
//             CASE 
//               WHEN m.request_id IS NULL THEN 'orphaned_in_analytics'
//               WHEN a.request_id IS NULL THEN 'missing_in_analytics'
//               WHEN m.company_name != a.company_name THEN 'company_name_mismatch'
//               WHEN m.industry != a.industry THEN 'industry_mismatch'
//               WHEN ABS(COALESCE(m.risk_score, 0) - COALESCE(a.risk_score, 0)) > 0.01 THEN 'risk_score_mismatch'
//               WHEN m.risk_grade != a.risk_grade THEN 'risk_grade_mismatch'
//               WHEN m.main_updated_at > a.analytics_updated_at THEN 'analytics_outdated'
//               ELSE 'consistent'
//             END as consistency_status
//           FROM main_data m
//           FULL OUTER JOIN analytics_data a ON m.request_id = a.request_id
//         )
//         SELECT * FROM comparison
//       `

//       const { data, error } = await this.supabase.rpc('execute_raw_sql', {
//         sql_query: query,
//         params: requestIds ? [requestIds] : []
//       })

//       if (error) {
//         throw new Error(`Consistency check failed: ${error.message}`)
//       }

//       const results = data || []
//       const totalCompared = results.length
//       const consistentRecords = results.filter((r: any) => r.consistency_status === 'consistent').length
//       const inconsistentRecords = totalCompared - consistentRecords
//       const missingInAnalytics = results.filter((r: any) => r.consistency_status === 'missing_in_analytics').length
//       const orphanedInAnalytics = results.filter((r: any) => r.consistency_status === 'orphaned_in_analytics').length

//       const inconsistencyDetails = results
//         .filter((r: any) => r.consistency_status !== 'consistent')
//         .map((r: any) => ({
//           request_id: r.request_id,
//           issue_type: r.consistency_status,
//           main_table_value: {
//             company_name: r.main_company_name,
//             industry: r.main_industry,
//             risk_score: r.main_risk_score,
//             risk_grade: r.main_risk_grade,
//             updated_at: r.main_updated_at
//           },
//           analytics_table_value: {
//             company_name: r.analytics_company_name,
//             industry: r.analytics_industry,
//             risk_score: r.analytics_risk_score,
//             risk_grade: r.analytics_risk_grade,
//             updated_at: r.analytics_updated_at
//           },
//           description: this.getInconsistencyDescription(r.consistency_status)
//         }))

//       return {
//         total_compared: totalCompared,
//         consistent_records: consistentRecords,
//         inconsistent_records: inconsistentRecords,
//         missing_in_analytics: missingInAnalytics,
//         orphaned_in_analytics: orphanedInAnalytics,
//         inconsistency_details: inconsistencyDetails
//       }
//     } catch (error) {
//       console.error('Compare data consistency error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get human-readable description for inconsistency types
//    */
//   private getInconsistencyDescription(issueType: string): string {
//     const descriptions: Record<string, string> = {
//       'missing_in_analytics': 'Record exists in main table but missing in analytics table',
//       'orphaned_in_analytics': 'Record exists in analytics table but missing in main table',
//       'company_name_mismatch': 'Company name differs between main and analytics tables',
//       'industry_mismatch': 'Industry classification differs between tables',
//       'risk_score_mismatch': 'Risk score values do not match',
//       'risk_grade_mismatch': 'Risk grade classification differs',
//       'analytics_outdated': 'Analytics table data is older than main table data'
//     }
//     return descriptions[issueType] || 'Unknown inconsistency type'
//   }

//   /**
//    * Batch sync with enhanced progress reporting and error recovery
//    */
//   async enhancedBatchSync(options: {
//     batchSize?: number
//     requestIds?: string[]
//     maxRetries?: number
//     retryDelay?: number
//     progressCallback?: (progress: {
//       processed: number
//       total: number
//       successful: number
//       failed: number
//       percentage: number
//     }) => void
//     createdBy?: string
//   } = {}): Promise<{
//     batch_id: string
//     operation_id: string
//     total_records: number
//     successful_records: number
//     failed_records: number
//     retry_results: RetryResult[]
//     message: string
//   }> {
//     try {
//       // Start initial batch sync
//       const batchResult = await this.batchSyncAnalyticsTable({
//         batchSize: options.batchSize,
//         requestIds: options.requestIds,
//         createdBy: options.createdBy
//       })

//       let retryResults: RetryResult[] = []

//       // If there are failures and retries are enabled, attempt retries
//       if (options.maxRetries && options.maxRetries > 0) {
//         // Get failed records from the batch operation
//         const operationStatus = await this.getSyncOperationStatus(batchResult.operation_id)

//         if (operationStatus.length > 0 && operationStatus[0].failed_records > 0) {
//           // Get failed request IDs from sync errors
//           const syncErrors = await this.getSyncErrors({ resolved: false })
//           const failedRequestIds = syncErrors.errors.map(e => e.request_id)

//           // Retry failed syncs with exponential backoff
//           for (let attempt = 1; attempt <= options.maxRetries; attempt++) {
//             if (failedRequestIds.length === 0) break

//             console.log(`Retry attempt ${attempt}/${options.maxRetries} for ${failedRequestIds.length} failed records`)

//             // Wait before retry (exponential backoff)
//             if (options.retryDelay) {
//               await new Promise(resolve => setTimeout(resolve, options.retryDelay * Math.pow(2, attempt - 1)))
//             }

//             const retryResult = await this.retryFailedSyncs(1)
//             retryResults = retryResults.concat(retryResult)

//             // Remove successfully retried records
//             const successfulRetries = retryResult
//               .filter(r => r.retry_status === 'Success')
//               .map(r => r.request_id)

//             failedRequestIds.splice(0, failedRequestIds.length,
//               ...failedRequestIds.filter(id => !successfulRetries.includes(id))
//             )
//           }
//         }
//       }

//       // Get final operation status
//       const finalStatus = await this.getSyncOperationStatus(batchResult.operation_id)
//       const finalOperation = finalStatus[0]

//       return {
//         batch_id: batchResult.batch_id,
//         operation_id: batchResult.operation_id,
//         total_records: batchResult.total_records,
//         successful_records: finalOperation?.successful_records || 0,
//         failed_records: finalOperation?.failed_records || 0,
//         retry_results: retryResults,
//         message: `Enhanced batch sync completed. ${finalOperation?.successful_records || 0} successful, ${finalOperation?.failed_records || 0} failed${retryResults.length > 0 ? `, ${retryResults.filter(r => r.retry_status === 'Success').length} retried successfully` : ''}`
//       }
//     } catch (error) {
//       console.error('Enhanced batch sync error:', error)
//       throw error
//     }
//   }

//   /**
//    * Monitor sync operations in real-time
//    */
//   subscribeToSyncOperations(callback: (payload: any) => void) {
//     return this.supabase
//       .channel('sync_operations')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'portfolio_analytics_sync_status'
//         },
//         callback
//       )
//       .subscribe()
//   }

//   /**
//    * Monitor sync errors in real-time
//    */
//   subscribeToSyncErrors(callback: (payload: any) => void) {
//     return this.supabase
//       .channel('sync_errors')
//       .on(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'portfolio_analytics_sync_errors'
//         },
//         callback
//       )
//       .subscribe()
//   }

//   /**
//    * Get detailed sync statistics and health metrics
//    */
//   async getSyncStatistics(): Promise<{
//     total_main_records: number
//     total_analytics_records: number
//     pending_sync_count: number
//     error_count: number
//     last_sync_time: string | null
//     sync_coverage_percentage: number
//     avg_sync_duration_seconds: number
//     recent_success_rate: number
//   }> {
//     try {
//       const { data, error } = await this.supabase.rpc('get_sync_statistics')

//       if (error) {
//         throw new Error(`Failed to get sync statistics: ${error.message}`)
//       }

//       return data[0] || {
//         total_main_records: 0,
//         total_analytics_records: 0,
//         pending_sync_count: 0,
//         error_count: 0,
//         last_sync_time: null,
//         sync_coverage_percentage: 0,
//         avg_sync_duration_seconds: 0,
//         recent_success_rate: 100
//       }
//     } catch (error) {
//       console.error('Get sync statistics error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get sync operation history with filtering
//    */
//   async getSyncOperationHistory(options: {
//     operationTypes?: string[]
//     statusFilter?: string
//     limit?: number
//     offset?: number
//   } = {}): Promise<Array<{
//     operation_id: string
//     batch_id: string
//     operation_type: string
//     status: string
//     total_records: number
//     successful_records: number
//     failed_records: number
//     progress_percentage: number
//     started_at: Date
//     completed_at: Date | null
//     duration_minutes: number
//     error_message: string | null
//     created_by: string | null
//     metadata: any
//   }>> {
//     try {
//       const { data, error } = await this.supabase.rpc('get_sync_operation_history', {
//         p_operation_types: options.operationTypes || null,
//         p_status_filter: options.statusFilter || null,
//         p_limit: options.limit || 50,
//         p_offset: options.offset || 0
//       })

//       if (error) {
//         throw new Error(`Failed to get operation history: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Get sync operation history error:', error)
//       throw error
//     }
//   }

//   /**
//    * Analyze sync performance trends over time
//    */
//   async analyzeSyncPerformance(daysBack = 30): Promise<Array<{
//     date_bucket: string
//     total_operations: number
//     successful_operations: number
//     failed_operations: number
//     avg_duration_seconds: number
//     total_records_processed: number
//     success_rate_percentage: number
//   }>> {
//     try {
//       const { data, error } = await this.supabase.rpc('analyze_sync_performance', {
//         p_days_back: daysBack
//       })

//       if (error) {
//         throw new Error(`Failed to analyze sync performance: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Analyze sync performance error:', error)
//       throw error
//     }
//   }

//   /**
//    * Get sync health dashboard metrics
//    */
//   async getSyncHealthDashboard(): Promise<Array<{
//     metric_name: string
//     metric_value: number
//     unit: string
//     status: 'Excellent' | 'Good' | 'Warning' | 'Critical'
//     last_updated: Date
//   }>> {
//     try {
//       const { data, error } = await this.supabase
//         .from('sync_health_dashboard')
//         .select('*')

//       if (error) {
//         throw new Error(`Failed to get sync health dashboard: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Get sync health dashboard error:', error)
//       throw error
//     }
//   }

//   /**
//    * Validate analytics data consistency with detailed reporting
//    */
//   async validateAnalyticsDataConsistency(requestIds?: string[]): Promise<Array<{
//     request_id: string
//     validation_status: 'Valid' | 'Invalid'
//     issues: string[]
//     main_table_data: any
//     analytics_table_data: any
//   }>> {
//     try {
//       const { data, error } = await this.supabase.rpc('validate_analytics_data_consistency', {
//         p_request_ids: requestIds || null
//       })

//       if (error) {
//         throw new Error(`Failed to validate data consistency: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Validate analytics data consistency error:', error)
//       throw error
//     }
//   }

//   /**
//    * Repair analytics inconsistencies with different repair strategies
//    */
//   async repairAnalyticsInconsistencies(
//     requestIds: string[],
//     repairType: 'force_resync' | 'update_timestamps' | 'remove_orphaned' = 'force_resync'
//   ): Promise<Array<{
//     request_id: string
//     repair_status: 'Success' | 'Failed'
//     message: string
//   }>> {
//     try {
//       const { data, error } = await this.supabase.rpc('repair_analytics_inconsistencies', {
//         p_request_ids: requestIds,
//         p_repair_type: repairType
//       })

//       if (error) {
//         throw new Error(`Failed to repair inconsistencies: ${error.message}`)
//       }

//       return data || []
//     } catch (error) {
//       console.error('Repair analytics inconsistencies error:', error)
//       throw error
//     }
//   }
// }

// // Export singleton instance
// export const analyticsTableService = new AnalyticsTableService()