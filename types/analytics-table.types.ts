import { Database } from './database.types'

// // Portfolio Analytics table types
// export type PortfolioAnalytics = Database['public']['Tables']['portfolio_analytics']['Row']
// export type PortfolioAnalyticsInsert = Database['public']['Tables']['portfolio_analytics']['Insert']
// export type PortfolioAnalyticsUpdate = Database['public']['Tables']['portfolio_analytics']['Update']

// Sync error types
export type AnalyticsSyncError = Database['public']['Tables']['portfolio_analytics_sync_errors']['Row']
export type AnalyticsSyncErrorInsert = Database['public']['Tables']['portfolio_analytics_sync_errors']['Insert']

// Function return types
export interface SyncResult {
  synced_count: number
  error_count: number
  message: string
}

export interface ValidationResult {
  request_id: string
  validation_status: 'Valid' | 'Invalid'
  issues: string[]
}

export interface AnalyticsTableStatus {
  total_records: number
  synced_records: number
  pending_sync: number
  error_records: number
  last_sync_time: string | null
  sync_coverage_percentage: number
}

export interface SyncError {
  id: string
  request_id: string
  error_type: string
  error_message: string
  retry_count: number
  last_attempt: Date
  resolved: boolean
  created_at: Date
}

export interface SyncOperationStatus {
  operation_id: string
  batch_id: string
  operation_type: string
  status: 'running' | 'completed' | 'failed' | 'cancelled'
  progress_percentage: number
  total_records: number
  processed_records: number
  successful_records: number
  failed_records: number
  started_at: Date
  completed_at: Date | null
  duration_seconds: number
  error_message: string | null
  metadata: any
}

export interface SyncHealthMetrics {
  metric_name: string
  metric_value: number
  metric_unit: string
  status: 'good' | 'warning' | 'error' | 'info'
  last_updated: Date
}

export interface RetryResult {
  request_id: string
  retry_status: 'Success' | 'Failed' | 'Error'
  message: string
}

export interface RebuildResult {
  total_processed: number
  successful_syncs: number
  failed_syncs: number
  execution_time_seconds: number
}

// Parameter score interface for type safety
export interface ParameterScore {
  parameter: string
  score: number
  value: string | number | null
  benchmark: string | null
  category: 'financial' | 'business' | 'hygiene' | 'banking'
  weight?: number
  description?: string
}

// Category score interface
export interface CategoryScore {
  score: number | null
  max_score: number | null
  percentage: number | null
  count: number | null
  total: number | null
}

// Structured analytics data interface
export interface StructuredAnalyticsData {
  // Basic info
  request_id: string
  company_name: string | null
  industry: string | null
  region: string | null

  // Risk data
  risk_score: number | null
  risk_grade: string | null
  overall_percentage: number | null

  // Category scores
  financial: CategoryScore
  business: CategoryScore
  hygiene: CategoryScore
  banking: CategoryScore

  // Financial parameters
  sales_trend: ParameterScore
  ebitda_margin: ParameterScore
  finance_cost: ParameterScore
  tol_tnw: ParameterScore
  debt_equity: ParameterScore
  interest_coverage: ParameterScore
  roce: ParameterScore
  inventory_days: ParameterScore
  debtors_days: ParameterScore
  creditors_days: ParameterScore
  current_ratio: ParameterScore
  quick_ratio: ParameterScore
  pat: ParameterScore
  ncatd: ParameterScore
  diversion_funds: ParameterScore

  // Business parameters
  constitution_entity: ParameterScore
  rating_type: ParameterScore
  vintage: ParameterScore

  // Hygiene parameters
  gst_compliance: ParameterScore
  pf_compliance: ParameterScore
  recent_charges: ParameterScore

  // Banking parameters
  primary_banker: ParameterScore

  // Financial metrics
  revenue: number | null
  ebitda: number | null
  net_profit: number | null
  total_assets: number | null
  total_equity: number | null
  current_assets: number | null
  current_liabilities: number | null
  long_term_borrowings: number | null
  short_term_borrowings: number | null

  // Credit assessment
  recommended_limit: number | null
  base_eligibility: number | null
  final_eligibility: number | null

  // Compliance status
  gst_compliance_status: string | null
  gst_active_count: number | null
  epfo_compliance_status: string | null
  epfo_establishment_count: number | null
  audit_qualification_status: string | null

  // Processing info
  processing_status: string | null
  completed_at: string | null
  created_at: string | null
  updated_at: string | null
}

// Filter criteria for analytics queries
export interface AnalyticsFilterCriteria {
  risk_grades?: string[]
  risk_score_range?: [number, number]
  industries?: string[]
  regions?: string[]
  ebitda_margin_range?: [number, number]
  debt_equity_range?: [number, number]
  current_ratio_range?: [number, number]
  gst_compliance_status?: string[]
  epfo_compliance_status?: string[]
  revenue_range?: [number, number]
  completed_after?: string
  completed_before?: string
}

// Sort criteria for analytics queries
// export interface AnalyticsSortCriteria {
//   field: keyof PortfolioAnalytics
//   direction: 'asc' | 'desc'
// }

// Pagination parameters
export interface AnalyticsPaginationParams {
  page: number
  limit: number
}

// Analytics query response
// export interface AnalyticsQueryResponse {
//   data: PortfolioAnalytics[]
//   total_count: number
//   page: number
//   limit: number
//   has_next: boolean
//   has_previous: boolean
// }

// Analytics metrics summary
export interface AnalyticsMetrics {
  total_companies: number
  average_risk_score: number
  total_exposure: number
  risk_distribution: Record<string, number>
  industry_breakdown: Record<string, number>
  compliance_summary: {
    gst_regular: number
    gst_inactive: number
    epfo_regular: number
    epfo_not_registered: number
  }
}