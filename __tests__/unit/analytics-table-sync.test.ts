// /**
//  * Analytics Table Synchronization Tests
//  * Tests for automatic synchronization mechanisms and manual sync utilities
//  */

// import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals'
// import { AnalyticsTableService } from '@/lib/services/analytics-table.service'
// import { createClient } from '@/lib/supabase/server'

// // Mock Supabase client
// jest.mock('@/lib/supabase/server', () => ({
//   createClient: jest.fn()
// }))

// const mockSupabase = {
//   rpc: jest.fn(),
//   from: jest.fn(() => ({
//     select: jest.fn(() => ({
//       eq: jest.fn(() => ({
//         in: jest.fn(() => ({
//           order: jest.fn(() => ({
//             range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
//           }))
//         }))
//       }))
//     })),
//     update: jest.fn(() => ({
//       in: jest.fn(() => Promise.resolve({ error: null, count: 0 }))
//     }))
//   })),
//   channel: jest.fn(() => ({
//     on: jest.fn(() => ({
//       subscribe: jest.fn()
//     }))
//   }))
// }

// describe('AnalyticsTableService', () => {
//   let service: AnalyticsTableService
  
//   beforeEach(() => {
//     jest.clearAllMocks()
//     ;(createClient as jest.Mock).mockReturnValue(mockSupabase)
//     service = new AnalyticsTableService()
//   })

//   describe('syncAnalyticsTable', () => {
//     test('should sync analytics table successfully', async () => {
//       const mockResult = {
//         synced_count: 5,
//         error_count: 0,
//         message: 'Sync completed successfully'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.syncAnalyticsTable()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('sync_portfolio_analytics', {
//         p_request_id: null
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should sync specific request ID', async () => {
//       const requestId = 'test-request-123'
//       const mockResult = {
//         synced_count: 1,
//         error_count: 0,
//         message: 'Sync completed successfully'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.syncAnalyticsTable([requestId])
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('sync_portfolio_analytics', {
//         p_request_id: requestId
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should handle sync errors', async () => {
//       const mockError = { message: 'Database connection failed' }
//       mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError })
      
//       await expect(service.syncAnalyticsTable()).rejects.toThrow('Sync failed: Database connection failed')
//     })

//     test('should handle empty sync result', async () => {
//       mockSupabase.rpc.mockResolvedValue({ data: [], error: null })
      
//       const result = await service.syncAnalyticsTable()
      
//       expect(result).toEqual({
//         synced_count: 0,
//         error_count: 0,
//         message: 'No records to sync'
//       })
//     })
//   })

//   describe('batchSyncAnalyticsTable', () => {
//     test('should perform batch sync with default options', async () => {
//       const mockResult = {
//         batch_id: 'batch-123',
//         operation_id: 'op-456',
//         total_records: 100,
//         message: 'Batch sync started'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.batchSyncAnalyticsTable()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('batch_sync_portfolio_analytics', {
//         p_batch_size: 100,
//         p_request_ids: null,
//         p_created_by: 'system'
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should perform batch sync with custom options', async () => {
//       const options = {
//         batchSize: 50,
//         requestIds: ['req1', 'req2'],
//         createdBy: 'user123'
//       }
      
//       const mockResult = {
//         batch_id: 'batch-456',
//         operation_id: 'op-789',
//         total_records: 2,
//         message: 'Batch sync started'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.batchSyncAnalyticsTable(options)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('batch_sync_portfolio_analytics', {
//         p_batch_size: 50,
//         p_request_ids: ['req1', 'req2'],
//         p_created_by: 'user123'
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should handle batch sync errors', async () => {
//       const mockError = { message: 'Batch processing failed' }
//       mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError })
      
//       await expect(service.batchSyncAnalyticsTable()).rejects.toThrow('Batch sync failed: Batch processing failed')
//     })
//   })

//   describe('validateAnalyticsData', () => {
//     test('should validate analytics data successfully', async () => {
//       const mockResult = {
//         operation_id: 'validation-123',
//         total_validated: 100,
//         valid_records: 95,
//         invalid_records: 5,
//         validation_details: [
//           {
//             request_id: 'req1',
//             status: 'Invalid',
//             issues: ['Risk score mismatch']
//           }
//         ]
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.validateAnalyticsData()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('comprehensive_analytics_validation', {
//         p_request_ids: null,
//         p_created_by: 'system'
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should validate specific request IDs', async () => {
//       const requestIds = ['req1', 'req2']
//       const mockResult = {
//         operation_id: 'validation-456',
//         total_validated: 2,
//         valid_records: 2,
//         invalid_records: 0,
//         validation_details: []
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.validateAnalyticsData(requestIds)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('comprehensive_analytics_validation', {
//         p_request_ids: requestIds,
//         p_created_by: 'system'
//       })
//       expect(result).toEqual(mockResult)
//     })
//   })

//   describe('rollbackAnalyticsSync', () => {
//     test('should rollback analytics sync successfully', async () => {
//       const requestIds = ['req1', 'req2']
//       const mockResult = {
//         operation_id: 'rollback-123',
//         rolled_back_count: 2,
//         message: 'Rolled back 2 analytics records'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.rollbackAnalyticsSync(requestIds)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('rollback_analytics_sync', {
//         p_request_ids: requestIds,
//         p_created_by: 'system'
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should rollback with custom created_by', async () => {
//       const requestIds = ['req1']
//       const createdBy = 'admin'
      
//       mockSupabase.rpc.mockResolvedValue({ 
//         data: [{ operation_id: 'rollback-456', rolled_back_count: 1, message: 'Success' }], 
//         error: null 
//       })
      
//       await service.rollbackAnalyticsSync(requestIds, createdBy)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('rollback_analytics_sync', {
//         p_request_ids: requestIds,
//         p_created_by: createdBy
//       })
//     })
//   })

//   describe('getAnalyticsTableStatus', () => {
//     test('should get analytics table status successfully', async () => {
//       const mockStatus = {
//         total_records: 300,
//         synced_records: 295,
//         pending_sync: 5,
//         error_records: 2,
//         last_sync_time: '2024-01-15T10:30:00Z',
//         sync_coverage_percentage: 98.33
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockStatus], error: null })
      
//       const result = await service.getAnalyticsTableStatus()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('get_analytics_table_status')
//       expect(result).toEqual(mockStatus)
//     })

//     test('should handle empty status result', async () => {
//       mockSupabase.rpc.mockResolvedValue({ data: [], error: null })
      
//       const result = await service.getAnalyticsTableStatus()
      
//       expect(result).toEqual({
//         total_records: 0,
//         synced_records: 0,
//         pending_sync: 0,
//         error_records: 0,
//         last_sync_time: null,
//         sync_coverage_percentage: 0
//       })
//     })
//   })

//   describe('getSyncOperationStatus', () => {
//     test('should get all sync operations when no ID provided', async () => {
//       const mockOperations = [
//         {
//           operation_id: 'op1',
//           batch_id: 'batch1',
//           operation_type: 'batch_sync',
//           status: 'completed',
//           progress_percentage: 100,
//           total_records: 50,
//           processed_records: 50,
//           successful_records: 48,
//           failed_records: 2,
//           started_at: '2024-01-15T10:00:00Z',
//           completed_at: '2024-01-15T10:05:00Z',
//           duration_seconds: 300,
//           error_message: null,
//           metadata: { batch_size: 100 }
//         }
//       ]
      
//       mockSupabase.rpc.mockResolvedValue({ data: mockOperations, error: null })
      
//       const result = await service.getSyncOperationStatus()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('get_sync_operation_status', {
//         p_operation_id: null
//       })
//       expect(result).toEqual(mockOperations)
//     })

//     test('should get specific operation status', async () => {
//       const operationId = 'op-123'
//       const mockOperation = [{
//         operation_id: operationId,
//         status: 'running',
//         progress_percentage: 75
//       }]
      
//       mockSupabase.rpc.mockResolvedValue({ data: mockOperation, error: null })
      
//       const result = await service.getSyncOperationStatus(operationId)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('get_sync_operation_status', {
//         p_operation_id: operationId
//       })
//       expect(result).toEqual(mockOperation)
//     })
//   })

//   describe('cancelSyncOperation', () => {
//     test('should cancel sync operation successfully', async () => {
//       const operationId = 'op-123'
//       const mockResult = {
//         operation_id: operationId,
//         previous_status: 'running',
//         message: 'Operation cancelled successfully'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.cancelSyncOperation(operationId)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('cancel_sync_operation', {
//         p_operation_id: operationId
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should handle operation not found', async () => {
//       const operationId = 'nonexistent'
//       const mockResult = {
//         operation_id: operationId,
//         previous_status: null,
//         message: 'Operation not found'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.cancelSyncOperation(operationId)
      
//       expect(result.message).toBe('Operation not found')
//     })
//   })

//   describe('getSyncHealthMetrics', () => {
//     test('should get sync health metrics successfully', async () => {
//       const mockMetrics = [
//         {
//           metric_name: 'total_main_records',
//           metric_value: 300,
//           metric_unit: 'count',
//           status: 'info',
//           last_updated: '2024-01-15T10:30:00Z'
//         },
//         {
//           metric_name: 'sync_coverage_percentage',
//           metric_value: 98.33,
//           metric_unit: 'percentage',
//           status: 'good',
//           last_updated: '2024-01-15T10:30:00Z'
//         },
//         {
//           metric_name: 'pending_sync_records',
//           metric_value: 5,
//           metric_unit: 'count',
//           status: 'warning',
//           last_updated: '2024-01-15T10:30:00Z'
//         }
//       ]
      
//       mockSupabase.rpc.mockResolvedValue({ data: mockMetrics, error: null })
      
//       const result = await service.getSyncHealthMetrics()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('get_sync_health_metrics')
//       expect(result).toEqual(mockMetrics)
//       expect(result).toHaveLength(3)
//       expect(result[1].status).toBe('good')
//       expect(result[2].status).toBe('warning')
//     })
//   })

//   describe('retryFailedSyncs', () => {
//     test('should retry failed syncs successfully', async () => {
//       const mockResults = [
//         {
//           request_id: 'req1',
//           retry_status: 'Success',
//           message: 'Sync completed successfully'
//         },
//         {
//           request_id: 'req2',
//           retry_status: 'Failed',
//           message: 'Sync failed again'
//         }
//       ]
      
//       mockSupabase.rpc.mockResolvedValue({ data: mockResults, error: null })
      
//       const result = await service.retryFailedSyncs(3)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('retry_failed_syncs', {
//         max_retries: 3
//       })
//       expect(result).toEqual(mockResults)
//     })

//     test('should use default max retries', async () => {
//       mockSupabase.rpc.mockResolvedValue({ data: [], error: null })
      
//       await service.retryFailedSyncs()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('retry_failed_syncs', {
//         max_retries: 3
//       })
//     })
//   })

//   describe('rebuildAnalyticsTable', () => {
//     test('should rebuild analytics table successfully', async () => {
//       const mockResult = {
//         total_processed: 300,
//         successful_syncs: 295,
//         failed_syncs: 5,
//         execution_time_seconds: 45.67
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.rebuildAnalyticsTable()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('rebuild_analytics_table')
//       expect(result).toEqual(mockResult)
//     })

//     test('should handle rebuild errors', async () => {
//       const mockError = { message: 'Rebuild operation failed' }
//       mockSupabase.rpc.mockResolvedValue({ data: null, error: mockError })
      
//       await expect(service.rebuildAnalyticsTable()).rejects.toThrow('Rebuild failed: Rebuild operation failed')
//     })
//   })

//   describe('getSyncErrors', () => {
//     test('should get sync errors with default options', async () => {
//       const mockErrors = [
//         {
//           id: 'error1',
//           request_id: 'req1',
//           error_type: 'sync_failed',
//           error_message: 'Database timeout',
//           retry_count: 2,
//           last_attempt: '2024-01-15T10:00:00Z',
//           resolved: false,
//           created_at: '2024-01-15T09:00:00Z'
//         }
//       ]
      
//       const mockQuery = {
//         select: jest.fn(() => mockQuery),
//         order: jest.fn(() => mockQuery),
//         eq: jest.fn(() => mockQuery),
//         in: jest.fn(() => mockQuery),
//         range: jest.fn(() => Promise.resolve({ data: mockErrors, error: null, count: 1 }))
//       }
      
//       mockSupabase.from.mockReturnValue(mockQuery)
      
//       const result = await service.getSyncErrors()
      
//       expect(mockSupabase.from).toHaveBeenCalledWith('portfolio_analytics_sync_errors')
//       expect(result).toEqual({
//         errors: mockErrors,
//         total_count: 1
//       })
//     })

//     test('should filter sync errors by resolved status', async () => {
//       const mockQuery = {
//         select: jest.fn(() => mockQuery),
//         order: jest.fn(() => mockQuery),
//         eq: jest.fn(() => mockQuery),
//         in: jest.fn(() => mockQuery),
//         range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
//       }
      
//       mockSupabase.from.mockReturnValue(mockQuery)
      
//       await service.getSyncErrors({ resolved: false })
      
//       expect(mockQuery.eq).toHaveBeenCalledWith('resolved', false)
//     })

//     test('should filter sync errors by request IDs', async () => {
//       const requestIds = ['req1', 'req2']
//       const mockQuery = {
//         select: jest.fn(() => mockQuery),
//         order: jest.fn(() => mockQuery),
//         eq: jest.fn(() => mockQuery),
//         in: jest.fn(() => mockQuery),
//         range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
//       }
      
//       mockSupabase.from.mockReturnValue(mockQuery)
      
//       await service.getSyncErrors({ requestIds })
      
//       expect(mockQuery.in).toHaveBeenCalledWith('request_id', requestIds)
//     })

//     test('should apply pagination', async () => {
//       const mockQuery = {
//         select: jest.fn(() => mockQuery),
//         order: jest.fn(() => mockQuery),
//         eq: jest.fn(() => mockQuery),
//         in: jest.fn(() => mockQuery),
//         range: jest.fn(() => Promise.resolve({ data: [], error: null, count: 0 }))
//       }
      
//       mockSupabase.from.mockReturnValue(mockQuery)
      
//       await service.getSyncErrors({ limit: 10, offset: 20 })
      
//       expect(mockQuery.range).toHaveBeenCalledWith(20, 29)
//     })
//   })

//   describe('resolveSyncErrors', () => {
//     test('should resolve sync errors successfully', async () => {
//       const requestIds = ['req1', 'req2']
//       const mockUpdate = {
//         update: jest.fn(() => ({
//           in: jest.fn(() => Promise.resolve({ error: null, count: 2 }))
//         }))
//       }
      
//       mockSupabase.from.mockReturnValue(mockUpdate)
      
//       const result = await service.resolveSyncErrors(requestIds)
      
//       expect(mockSupabase.from).toHaveBeenCalledWith('portfolio_analytics_sync_errors')
//       expect(result).toBe(2)
//     })

//     test('should handle resolve errors', async () => {
//       const requestIds = ['req1']
//       const mockUpdate = {
//         update: jest.fn(() => ({
//           in: jest.fn(() => Promise.resolve({ error: { message: 'Update failed' }, count: null }))
//         }))
//       }
      
//       mockSupabase.from.mockReturnValue(mockUpdate)
      
//       await expect(service.resolveSyncErrors(requestIds)).rejects.toThrow('Failed to resolve sync errors: Update failed')
//     })
//   })

//   describe('cleanupSyncStatusRecords', () => {
//     test('should cleanup old sync status records', async () => {
//       const mockResult = {
//         deleted_count: 25,
//         message: 'Cleaned up 25 old sync status records'
//       }
      
//       mockSupabase.rpc.mockResolvedValue({ data: [mockResult], error: null })
      
//       const result = await service.cleanupSyncStatusRecords(30)
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('cleanup_sync_status_records', {
//         p_retention_days: 30
//       })
//       expect(result).toEqual(mockResult)
//     })

//     test('should use default retention days', async () => {
//       mockSupabase.rpc.mockResolvedValue({ data: [{ deleted_count: 0, message: 'No records to cleanup' }], error: null })
      
//       await service.cleanupSyncStatusRecords()
      
//       expect(mockSupabase.rpc).toHaveBeenCalledWith('cleanup_sync_status_records', {
//         p_retention_days: 30
//       })
//     })
//   })

//   describe('Real-time subscriptions', () => {
//     test('should subscribe to sync operations', () => {
//       const callback = jest.fn()
//       const mockChannel = {
//         on: jest.fn(() => ({
//           subscribe: jest.fn()
//         }))
//       }
      
//       mockSupabase.channel.mockReturnValue(mockChannel)
      
//       service.subscribeToSyncOperations(callback)
      
//       expect(mockSupabase.channel).toHaveBeenCalledWith('sync_operations')
//       expect(mockChannel.on).toHaveBeenCalledWith(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'portfolio_analytics_sync_status'
//         },
//         callback
//       )
//     })

//     test('should subscribe to sync errors', () => {
//       const callback = jest.fn()
//       const mockChannel = {
//         on: jest.fn(() => ({
//           subscribe: jest.fn()
//         }))
//       }
      
//       mockSupabase.channel.mockReturnValue(mockChannel)
      
//       service.subscribeToSyncErrors(callback)
      
//       expect(mockSupabase.channel).toHaveBeenCalledWith('sync_errors')
//       expect(mockChannel.on).toHaveBeenCalledWith(
//         'postgres_changes',
//         {
//           event: '*',
//           schema: 'public',
//           table: 'portfolio_analytics_sync_errors'
//         },
//         callback
//       )
//     })
//   })
// })