-- Migration: Manual sync utilities and data consistency functions
-- This migration adds enhanced manual sync utilities for data consistency checks and repairs

-- Function to execute raw SQL queries (for data consistency checks)
CREATE OR REPLACE FUNCTION execute_raw_sql(
  sql_query TEXT,
  params JSONB DEFAULT NULL
)
RETURNS JSONB AS $
DECLARE
  result JSONB;
BEGIN
  -- This is a simplified version - in production, you'd want more security controls
  -- For now, we'll implement specific consistency check functions instead
  RETURN '[]'::JSONB;
END;
$ LANGUAGE plpgsql;

-- Enhanced data consistency validation function
CREATE OR REPLACE FUNCTION validate_analytics_data_consistency(
  p_request_ids VARCHAR[] DEFAULT NULL
)
RETURNS TABLE (
  request_id VARCHAR,
  validation_status VARCHAR,
  issues JSONB,
  main_table_data JSONB,
  analytics_table_data JSONB
) AS $
DECLARE
  rec RECORD;
  v_issues JSONB;
  v_main_data JSONB;
  v_analytics_data JSONB;
BEGIN
  FOR rec IN 
    SELECT 
      COALESCE(dpr.request_id, pa.request_id) as req_id,
      dpr.company_name as main_company_name,
      dpr.industry as main_industry,
      dpr.risk_score as main_risk_score,
      dpr.risk_grade as main_risk_grade,
      dpr.status as main_status,
      dpr.updated_at as main_updated_at,
      pa.company_name as analytics_company_name,
      pa.industry as analytics_industry,
      pa.risk_score as analytics_risk_score,
      pa.risk_grade as analytics_risk_grade,
      pa.processing_status as analytics_status,
      pa.updated_at as analytics_updated_at
    FROM document_processing_requests dpr
    FULL OUTER JOIN portfolio_analytics pa ON dpr.request_id = pa.request_id
    WHERE 
      (p_request_ids IS NULL OR COALESCE(dpr.request_id, pa.request_id) = ANY(p_request_ids))
      AND (dpr.status = 'completed' OR pa.request_id IS NOT NULL)
  LOOP
    v_issues := '[]'::JSONB;
    
    -- Build main table data
    v_main_data := jsonb_build_object(
      'company_name', rec.main_company_name,
      'industry', rec.main_industry,
      'risk_score', rec.main_risk_score,
      'risk_grade', rec.main_risk_grade,
      'status', rec.main_status,
      'updated_at', rec.main_updated_at
    );
    
    -- Build analytics table data
    v_analytics_data := jsonb_build_object(
      'company_name', rec.analytics_company_name,
      'industry', rec.analytics_industry,
      'risk_score', rec.analytics_risk_score,
      'risk_grade', rec.analytics_risk_grade,
      'status', rec.analytics_status,
      'updated_at', rec.analytics_updated_at
    );
    
    -- Check for missing records
    IF rec.main_company_name IS NULL THEN
      v_issues := v_issues || jsonb_build_array('Record exists in analytics table but missing in main table');
    ELSIF rec.analytics_company_name IS NULL THEN
      v_issues := v_issues || jsonb_build_array('Record exists in main table but missing in analytics table');
    ELSE
      -- Check for data mismatches
      IF rec.main_company_name != rec.analytics_company_name THEN
        v_issues := v_issues || jsonb_build_array('Company name mismatch');
      END IF;
      
      IF rec.main_industry != rec.analytics_industry THEN
        v_issues := v_issues || jsonb_build_array('Industry mismatch');
      END IF;
      
      IF ABS(COALESCE(rec.main_risk_score, 0) - COALESCE(rec.analytics_risk_score, 0)) > 0.01 THEN
        v_issues := v_issues || jsonb_build_array('Risk score mismatch');
      END IF;
      
      IF rec.main_risk_grade != rec.analytics_risk_grade THEN
        v_issues := v_issues || jsonb_build_array('Risk grade mismatch');
      END IF;
      
      IF rec.main_updated_at > rec.analytics_updated_at THEN
        v_issues := v_issues || jsonb_build_array('Analytics data is outdated');
      END IF;
    END IF;
    
    RETURN QUERY SELECT 
      rec.req_id,
      CASE WHEN jsonb_array_length(v_issues) = 0 THEN 'Valid' ELSE 'Invalid' END,
      v_issues,
      v_main_data,
      v_analytics_data;
  END LOOP;
END;
$ LANGUAGE plpgsql;

-- Function to get sync statistics and health metrics
CREATE OR REPLACE FUNCTION get_sync_statistics()
RETURNS TABLE (
  total_main_records INTEGER,
  total_analytics_records INTEGER,
  pending_sync_count INTEGER,
  error_count INTEGER,
  last_sync_time TIMESTAMP,
  sync_coverage_percentage DECIMAL,
  avg_sync_duration_seconds DECIMAL,
  recent_success_rate DECIMAL
) AS $
DECLARE
  v_total_main INTEGER;
  v_total_analytics INTEGER;
  v_pending INTEGER;
  v_errors INTEGER;
  v_last_sync TIMESTAMP;
  v_coverage DECIMAL;
  v_avg_duration DECIMAL;
  v_success_rate DECIMAL;
BEGIN
  -- Get total records in main table (completed with risk analysis)
  SELECT COUNT(*) INTO v_total_main
  FROM document_processing_requests 
  WHERE status = 'completed' AND risk_analysis IS NOT NULL;
  
  -- Get total records in analytics table
  SELECT COUNT(*) INTO v_total_analytics FROM portfolio_analytics;
  
  -- Calculate pending sync count
  v_pending := v_total_main - v_total_analytics;
  
  -- Get unresolved error count
  SELECT COUNT(*) INTO v_errors
  FROM portfolio_analytics_sync_errors 
  WHERE resolved = FALSE;
  
  -- Get last sync time
  SELECT MAX(updated_at) INTO v_last_sync FROM portfolio_analytics;
  
  -- Calculate coverage percentage
  v_coverage := CASE 
    WHEN v_total_main > 0 THEN (v_total_analytics::DECIMAL / v_total_main * 100)
    ELSE 100
  END;
  
  -- Calculate average sync duration from recent operations
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) INTO v_avg_duration
  FROM portfolio_analytics_sync_status
  WHERE status = 'completed' 
  AND started_at > NOW() - INTERVAL '7 days';
  
  -- Calculate recent success rate
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100)
      ELSE 100
    END INTO v_success_rate
  FROM portfolio_analytics_sync_status
  WHERE started_at > NOW() - INTERVAL '7 days';
  
  RETURN QUERY SELECT 
    v_total_main,
    v_total_analytics,
    GREATEST(v_pending, 0),
    v_errors,
    v_last_sync,
    v_coverage,
    COALESCE(v_avg_duration, 0),
    COALESCE(v_success_rate, 100);
END;
$ LANGUAGE plpgsql;

-- Function to repair specific data inconsistencies
CREATE OR REPLACE FUNCTION repair_analytics_inconsistencies(
  p_request_ids VARCHAR[],
  p_repair_type VARCHAR DEFAULT 'force_resync'
)
RETURNS TABLE (
  request_id VARCHAR,
  repair_status VARCHAR,
  message TEXT
) AS $
DECLARE
  v_request_id VARCHAR;
  sync_result RECORD;
BEGIN
  FOREACH v_request_id IN ARRAY p_request_ids
  LOOP
    BEGIN
      CASE p_repair_type
        WHEN 'force_resync' THEN
          -- Delete existing analytics record and re-sync
          DELETE FROM portfolio_analytics WHERE request_id = v_request_id;
          
          -- Call sync function
          SELECT * INTO sync_result FROM sync_portfolio_analytics(v_request_id);
          
          IF sync_result.synced_count > 0 THEN
            RETURN QUERY SELECT v_request_id, 'Success', 'Record successfully re-synced';
          ELSE
            RETURN QUERY SELECT v_request_id, 'Failed', 'No records were synced: ' || sync_result.message;
          END IF;
          
        WHEN 'update_timestamps' THEN
          -- Update analytics table timestamp to match main table
          UPDATE portfolio_analytics 
          SET updated_at = (
            SELECT updated_at FROM document_processing_requests 
            WHERE request_id = v_request_id
          )
          WHERE request_id = v_request_id;
          
          RETURN QUERY SELECT v_request_id, 'Success', 'Timestamp updated successfully';
          
        WHEN 'remove_orphaned' THEN
          -- Remove analytics records that don't exist in main table
          DELETE FROM portfolio_analytics 
          WHERE request_id = v_request_id
          AND NOT EXISTS (
            SELECT 1 FROM document_processing_requests 
            WHERE request_id = v_request_id AND status = 'completed'
          );
          
          RETURN QUERY SELECT v_request_id, 'Success', 'Orphaned record removed';
          
        ELSE
          RETURN QUERY SELECT v_request_id, 'Failed', 'Unknown repair type: ' || p_repair_type;
      END CASE;
      
    EXCEPTION
      WHEN OTHERS THEN
        RETURN QUERY SELECT v_request_id, 'Failed', 'Repair failed: ' || SQLERRM;
    END;
  END LOOP;
END;
$ LANGUAGE plpgsql;

-- Function to get detailed sync operation history
CREATE OR REPLACE FUNCTION get_sync_operation_history(
  p_operation_types VARCHAR[] DEFAULT NULL,
  p_status_filter VARCHAR DEFAULT NULL,
  p_limit INTEGER DEFAULT 50,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  operation_id UUID,
  batch_id UUID,
  operation_type VARCHAR,
  status VARCHAR,
  total_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  progress_percentage DECIMAL,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_minutes DECIMAL,
  error_message TEXT,
  created_by VARCHAR,
  metadata JSONB
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.batch_id,
    ss.operation_type,
    ss.status,
    ss.total_records,
    ss.successful_records,
    ss.failed_records,
    ss.progress_percentage,
    ss.started_at,
    ss.completed_at,
    EXTRACT(EPOCH FROM (COALESCE(ss.completed_at, NOW()) - ss.started_at)) / 60.0,
    ss.error_message,
    ss.created_by,
    ss.metadata
  FROM portfolio_analytics_sync_status ss
  WHERE 
    (p_operation_types IS NULL OR ss.operation_type = ANY(p_operation_types))
    AND (p_status_filter IS NULL OR ss.status = p_status_filter)
  ORDER BY ss.started_at DESC
  LIMIT p_limit OFFSET p_offset;
END;
$ LANGUAGE plpgsql;

-- Function to analyze sync performance trends
CREATE OR REPLACE FUNCTION analyze_sync_performance(
  p_days_back INTEGER DEFAULT 30
)
RETURNS TABLE (
  date_bucket DATE,
  total_operations INTEGER,
  successful_operations INTEGER,
  failed_operations INTEGER,
  avg_duration_seconds DECIMAL,
  total_records_processed INTEGER,
  success_rate_percentage DECIMAL
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    DATE(ss.started_at) as date_bucket,
    COUNT(*)::INTEGER as total_operations,
    COUNT(*) FILTER (WHERE ss.status = 'completed')::INTEGER as successful_operations,
    COUNT(*) FILTER (WHERE ss.status = 'failed')::INTEGER as failed_operations,
    AVG(EXTRACT(EPOCH FROM (ss.completed_at - ss.started_at)))::DECIMAL as avg_duration_seconds,
    SUM(ss.processed_records)::INTEGER as total_records_processed,
    (COUNT(*) FILTER (WHERE ss.status = 'completed')::DECIMAL / COUNT(*) * 100)::DECIMAL as success_rate_percentage
  FROM portfolio_analytics_sync_status ss
  WHERE ss.started_at >= NOW() - (p_days_back || ' days')::INTERVAL
  GROUP BY DATE(ss.started_at)
  ORDER BY date_bucket DESC;
END;
$ LANGUAGE plpgsql;

-- Create indexes for better performance on sync status queries
CREATE INDEX IF NOT EXISTS idx_sync_status_created_by ON portfolio_analytics_sync_status(created_by);
CREATE INDEX IF NOT EXISTS idx_sync_status_metadata ON portfolio_analytics_sync_status USING GIN(metadata);
CREATE INDEX IF NOT EXISTS idx_sync_errors_resolved ON portfolio_analytics_sync_errors(resolved, last_attempt);

-- Create a view for easy access to sync health dashboard
CREATE OR REPLACE VIEW sync_health_dashboard AS
SELECT 
  'Sync Coverage' as metric_name,
  CASE 
    WHEN main_count.total > 0 THEN (analytics_count.total::DECIMAL / main_count.total * 100)
    ELSE 100
  END as metric_value,
  '%' as unit,
  CASE 
    WHEN main_count.total = 0 OR analytics_count.total >= main_count.total THEN 'Excellent'
    WHEN analytics_count.total >= main_count.total * 0.95 THEN 'Good'
    WHEN analytics_count.total >= main_count.total * 0.85 THEN 'Warning'
    ELSE 'Critical'
  END as status,
  NOW() as last_updated
FROM 
  (SELECT COUNT(*) as total FROM document_processing_requests WHERE status = 'completed' AND risk_analysis IS NOT NULL) main_count,
  (SELECT COUNT(*) as total FROM portfolio_analytics) analytics_count

UNION ALL

SELECT 
  'Unresolved Errors' as metric_name,
  error_count.total::DECIMAL as metric_value,
  'count' as unit,
  CASE 
    WHEN error_count.total = 0 THEN 'Excellent'
    WHEN error_count.total <= 5 THEN 'Good'
    WHEN error_count.total <= 20 THEN 'Warning'
    ELSE 'Critical'
  END as status,
  NOW() as last_updated
FROM 
  (SELECT COUNT(*) as total FROM portfolio_analytics_sync_errors WHERE resolved = FALSE) error_count

UNION ALL

SELECT 
  'Recent Success Rate' as metric_name,
  COALESCE(success_rate.rate, 100) as metric_value,
  '%' as unit,
  CASE 
    WHEN COALESCE(success_rate.rate, 100) >= 95 THEN 'Excellent'
    WHEN COALESCE(success_rate.rate, 100) >= 85 THEN 'Good'
    WHEN COALESCE(success_rate.rate, 100) >= 70 THEN 'Warning'
    ELSE 'Critical'
  END as status,
  NOW() as last_updated
FROM (
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100)
      ELSE 100
    END as rate
  FROM portfolio_analytics_sync_status
  WHERE started_at > NOW() - INTERVAL '7 days'
) success_rate;

-- Grant necessary permissions
GRANT SELECT ON sync_health_dashboard TO authenticated;
GRANT EXECUTE ON FUNCTION validate_analytics_data_consistency TO authenticated;
GRANT EXECUTE ON FUNCTION get_sync_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION repair_analytics_inconsistencies TO authenticated;
GRANT EXECUTE ON FUNCTION get_sync_operation_history TO authenticated;
GRANT EXECUTE ON FUNCTION analyze_sync_performance TO authenticated;