-- Migration: Enhanced manual sync utilities and batch processing
-- This migration adds comprehensive manual sync utilities, batch processing, and monitoring

-- Create sync status tracking table
CREATE TABLE IF NOT EXISTS portfolio_analytics_sync_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID DEFAULT gen_random_uuid(),
  operation_type VARCHAR(50) NOT NULL, -- 'manual_sync', 'batch_sync', 'validation', 'rebuild'
  status VARCHAR(20) NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed', 'cancelled'
  total_records INTEGER DEFAULT 0,
  processed_records INTEGER DEFAULT 0,
  successful_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  progress_percentage DECIMAL(5,2) DEFAULT 0,
  started_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP,
  error_message TEXT,
  metadata JSONB,
  created_by VARCHAR(100),
  CONSTRAINT valid_status CHECK (status IN ('running', 'completed', 'failed', 'cancelled'))
);

CREATE INDEX IF NOT EXISTS idx_sync_status_batch_id ON portfolio_analytics_sync_status(batch_id);
CREATE INDEX IF NOT EXISTS idx_sync_status_operation ON portfolio_analytics_sync_status(operation_type, status);
CREATE INDEX IF NOT EXISTS idx_sync_status_started ON portfolio_analytics_sync_status(started_at);

-- Enhanced batch sync function with progress tracking
CREATE OR REPLACE FUNCTION batch_sync_portfolio_analytics(
  p_batch_size INTEGER DEFAULT 100,
  p_request_ids VARCHAR[] DEFAULT NULL,
  p_created_by VARCHAR DEFAULT 'system'
)
RETURNS TABLE (
  batch_id UUID,
  operation_id UUID,
  total_records INTEGER,
  message TEXT
) AS $
DECLARE
  v_batch_id UUID;
  v_operation_id UUID;
  v_total_records INTEGER;
  v_processed INTEGER := 0;
  v_successful INTEGER := 0;
  v_failed INTEGER := 0;
  rec RECORD;
  batch_records RECORD[];
  i INTEGER;
BEGIN
  -- Generate batch and operation IDs
  v_batch_id := gen_random_uuid();
  v_operation_id := gen_random_uuid();
  
  -- Count total records to process
  IF p_request_ids IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total_records
    FROM document_processing_requests dpr
    WHERE dpr.request_id = ANY(p_request_ids)
    AND dpr.status = 'completed'
    AND dpr.risk_analysis IS NOT NULL;
  ELSE
    SELECT COUNT(*) INTO v_total_records
    FROM document_processing_requests dpr
    WHERE dpr.status = 'completed'
    AND dpr.risk_analysis IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM portfolio_analytics pa 
      WHERE pa.request_id = dpr.request_id 
      AND pa.updated_at >= dpr.updated_at
    );
  END IF;
  
  -- Create operation status record
  INSERT INTO portfolio_analytics_sync_status (
    id, batch_id, operation_type, total_records, created_by, metadata
  ) VALUES (
    v_operation_id, v_batch_id, 'batch_sync', v_total_records, p_created_by,
    jsonb_build_object(
      'batch_size', p_batch_size,
      'has_request_filter', p_request_ids IS NOT NULL,
      'request_count', COALESCE(array_length(p_request_ids, 1), 0)
    )
  );
  
  -- Process records in batches
  FOR rec IN 
    SELECT dpr.request_id
    FROM document_processing_requests dpr
    WHERE 
      (p_request_ids IS NULL OR dpr.request_id = ANY(p_request_ids))
      AND dpr.status = 'completed'
      AND dpr.risk_analysis IS NOT NULL
      AND (
        p_request_ids IS NOT NULL 
        OR NOT EXISTS (
          SELECT 1 FROM portfolio_analytics pa 
          WHERE pa.request_id = dpr.request_id 
          AND pa.updated_at >= dpr.updated_at
        )
      )
    ORDER BY dpr.updated_at DESC
  LOOP
    BEGIN
      -- Sync individual record
      PERFORM sync_portfolio_analytics(rec.request_id);
      v_successful := v_successful + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        v_failed := v_failed + 1;
        
        -- Log individual error
        INSERT INTO portfolio_analytics_sync_errors (
          request_id, error_type, error_message, retry_count
        ) VALUES (
          rec.request_id, 'batch_sync_failed', SQLERRM, 0
        ) ON CONFLICT (request_id) DO UPDATE SET
          error_message = EXCLUDED.error_message,
          retry_count = portfolio_analytics_sync_errors.retry_count + 1,
          last_attempt = NOW(),
          resolved = FALSE;
    END;
    
    v_processed := v_processed + 1;
    
    -- Update progress every batch_size records or at the end
    IF v_processed % p_batch_size = 0 OR v_processed = v_total_records THEN
      UPDATE portfolio_analytics_sync_status 
      SET 
        processed_records = v_processed,
        successful_records = v_successful,
        failed_records = v_failed,
        progress_percentage = CASE 
          WHEN v_total_records > 0 THEN (v_processed::DECIMAL / v_total_records * 100)
          ELSE 100
        END
      WHERE id = v_operation_id;
      
      -- Commit batch
      COMMIT;
    END IF;
  END LOOP;
  
  -- Mark operation as completed
  UPDATE portfolio_analytics_sync_status 
  SET 
    status = CASE WHEN v_failed = 0 THEN 'completed' ELSE 'failed' END,
    completed_at = NOW(),
    processed_records = v_processed,
    successful_records = v_successful,
    failed_records = v_failed,
    progress_percentage = 100,
    error_message = CASE 
      WHEN v_failed > 0 THEN v_failed || ' records failed to sync'
      ELSE NULL
    END
  WHERE id = v_operation_id;
  
  RETURN QUERY SELECT 
    v_batch_id,
    v_operation_id,
    v_total_records,
    CASE 
      WHEN v_failed = 0 THEN 'Batch sync completed successfully'
      ELSE 'Batch sync completed with ' || v_failed || ' failures'
    END;
END;
$ LANGUAGE plpgsql;

-- Function for comprehensive data validation with detailed reporting
CREATE OR REPLACE FUNCTION comprehensive_analytics_validation(
  p_request_ids VARCHAR[] DEFAULT NULL,
  p_created_by VARCHAR DEFAULT 'system'
)
RETURNS TABLE (
  operation_id UUID,
  total_validated INTEGER,
  valid_records INTEGER,
  invalid_records INTEGER,
  validation_details JSONB
) AS $
DECLARE
  v_operation_id UUID;
  v_total INTEGER := 0;
  v_valid INTEGER := 0;
  v_invalid INTEGER := 0;
  v_details JSONB := '[]'::JSONB;
  rec RECORD;
  validation_result RECORD;
BEGIN
  v_operation_id := gen_random_uuid();
  
  -- Count total records to validate
  IF p_request_ids IS NOT NULL THEN
    SELECT COUNT(*) INTO v_total
    FROM portfolio_analytics pa
    WHERE pa.request_id = ANY(p_request_ids);
  ELSE
    SELECT COUNT(*) INTO v_total FROM portfolio_analytics;
  END IF;
  
  -- Create validation status record
  INSERT INTO portfolio_analytics_sync_status (
    id, operation_type, total_records, created_by, metadata
  ) VALUES (
    v_operation_id, 'validation', v_total, p_created_by,
    jsonb_build_object(
      'validation_type', 'comprehensive',
      'has_request_filter', p_request_ids IS NOT NULL
    )
  );
  
  -- Validate each record
  FOR validation_result IN 
    SELECT * FROM validate_analytics_data(
      CASE WHEN p_request_ids IS NOT NULL THEN NULL ELSE NULL END
    )
  LOOP
    IF validation_result.validation_status = 'Valid' THEN
      v_valid := v_valid + 1;
    ELSE
      v_invalid := v_invalid + 1;
      
      -- Add to details
      v_details := v_details || jsonb_build_object(
        'request_id', validation_result.request_id,
        'status', validation_result.validation_status,
        'issues', validation_result.issues
      );
    END IF;
  END LOOP;
  
  -- Update validation status
  UPDATE portfolio_analytics_sync_status 
  SET 
    status = 'completed',
    completed_at = NOW(),
    processed_records = v_total,
    successful_records = v_valid,
    failed_records = v_invalid,
    progress_percentage = 100,
    metadata = metadata || jsonb_build_object(
      'validation_summary', jsonb_build_object(
        'total_validated', v_total,
        'valid_records', v_valid,
        'invalid_records', v_invalid,
        'validation_details', v_details
      )
    )
  WHERE id = v_operation_id;
  
  RETURN QUERY SELECT 
    v_operation_id,
    v_total,
    v_valid,
    v_invalid,
    v_details;
END;
$ LANGUAGE plpgsql;

-- Function to rollback analytics data for specific records
CREATE OR REPLACE FUNCTION rollback_analytics_sync(
  p_request_ids VARCHAR[],
  p_created_by VARCHAR DEFAULT 'system'
)
RETURNS TABLE (
  operation_id UUID,
  rolled_back_count INTEGER,
  message TEXT
) AS $
DECLARE
  v_operation_id UUID;
  v_count INTEGER;
BEGIN
  v_operation_id := gen_random_uuid();
  
  -- Create rollback status record
  INSERT INTO portfolio_analytics_sync_status (
    id, operation_type, total_records, created_by, metadata
  ) VALUES (
    v_operation_id, 'rollback', array_length(p_request_ids, 1), p_created_by,
    jsonb_build_object(
      'rollback_request_ids', p_request_ids
    )
  );
  
  -- Delete analytics records
  DELETE FROM portfolio_analytics 
  WHERE request_id = ANY(p_request_ids);
  
  GET DIAGNOSTICS v_count = ROW_COUNT;
  
  -- Clear related sync errors
  DELETE FROM portfolio_analytics_sync_errors 
  WHERE request_id = ANY(p_request_ids);
  
  -- Update rollback status
  UPDATE portfolio_analytics_sync_status 
  SET 
    status = 'completed',
    completed_at = NOW(),
    processed_records = v_count,
    successful_records = v_count,
    progress_percentage = 100
  WHERE id = v_operation_id;
  
  RETURN QUERY SELECT 
    v_operation_id,
    v_count,
    'Rolled back ' || v_count || ' analytics records';
END;
$ LANGUAGE plpgsql;

-- Function to get sync operation status and progress
CREATE OR REPLACE FUNCTION get_sync_operation_status(p_operation_id UUID DEFAULT NULL)
RETURNS TABLE (
  operation_id UUID,
  batch_id UUID,
  operation_type VARCHAR,
  status VARCHAR,
  progress_percentage DECIMAL,
  total_records INTEGER,
  processed_records INTEGER,
  successful_records INTEGER,
  failed_records INTEGER,
  started_at TIMESTAMP,
  completed_at TIMESTAMP,
  duration_seconds INTEGER,
  error_message TEXT,
  metadata JSONB
) AS $
BEGIN
  RETURN QUERY
  SELECT 
    ss.id,
    ss.batch_id,
    ss.operation_type,
    ss.status,
    ss.progress_percentage,
    ss.total_records,
    ss.processed_records,
    ss.successful_records,
    ss.failed_records,
    ss.started_at,
    ss.completed_at,
    EXTRACT(EPOCH FROM (COALESCE(ss.completed_at, NOW()) - ss.started_at))::INTEGER,
    ss.error_message,
    ss.metadata
  FROM portfolio_analytics_sync_status ss
  WHERE (p_operation_id IS NULL OR ss.id = p_operation_id)
  ORDER BY ss.started_at DESC;
END;
$ LANGUAGE plpgsql;

-- Function to cancel running sync operations
CREATE OR REPLACE FUNCTION cancel_sync_operation(p_operation_id UUID)
RETURNS TABLE (
  operation_id UUID,
  previous_status VARCHAR,
  message TEXT
) AS $
DECLARE
  v_current_status VARCHAR;
BEGIN
  -- Get current status
  SELECT status INTO v_current_status
  FROM portfolio_analytics_sync_status
  WHERE id = p_operation_id;
  
  IF v_current_status IS NULL THEN
    RETURN QUERY SELECT p_operation_id, NULL::VARCHAR, 'Operation not found';
    RETURN;
  END IF;
  
  IF v_current_status != 'running' THEN
    RETURN QUERY SELECT p_operation_id, v_current_status, 'Operation is not running';
    RETURN;
  END IF;
  
  -- Cancel the operation
  UPDATE portfolio_analytics_sync_status 
  SET 
    status = 'cancelled',
    completed_at = NOW(),
    error_message = 'Operation cancelled by user'
  WHERE id = p_operation_id;
  
  RETURN QUERY SELECT p_operation_id, v_current_status, 'Operation cancelled successfully';
END;
$ LANGUAGE plpgsql;

-- Function to get detailed sync health metrics
CREATE OR REPLACE FUNCTION get_sync_health_metrics()
RETURNS TABLE (
  metric_name VARCHAR,
  metric_value DECIMAL,
  metric_unit VARCHAR,
  status VARCHAR,
  last_updated TIMESTAMP
) AS $
DECLARE
  v_total_main INTEGER;
  v_total_analytics INTEGER;
  v_pending_sync INTEGER;
  v_error_count INTEGER;
  v_last_sync TIMESTAMP;
  v_avg_sync_time DECIMAL;
  v_success_rate DECIMAL;
BEGIN
  -- Get basic counts
  SELECT COUNT(*) INTO v_total_main
  FROM document_processing_requests 
  WHERE status = 'completed' AND risk_analysis IS NOT NULL;
  
  SELECT COUNT(*) INTO v_total_analytics FROM portfolio_analytics;
  
  v_pending_sync := v_total_main - v_total_analytics;
  
  SELECT COUNT(*) INTO v_error_count
  FROM portfolio_analytics_sync_errors WHERE resolved = FALSE;
  
  SELECT MAX(updated_at) INTO v_last_sync FROM portfolio_analytics;
  
  -- Calculate average sync time from recent operations
  SELECT AVG(EXTRACT(EPOCH FROM (completed_at - started_at))) INTO v_avg_sync_time
  FROM portfolio_analytics_sync_status
  WHERE status = 'completed' 
  AND started_at > NOW() - INTERVAL '7 days';
  
  -- Calculate success rate from recent operations
  SELECT 
    CASE 
      WHEN COUNT(*) > 0 THEN 
        (COUNT(*) FILTER (WHERE status = 'completed')::DECIMAL / COUNT(*) * 100)
      ELSE 100
    END INTO v_success_rate
  FROM portfolio_analytics_sync_status
  WHERE started_at > NOW() - INTERVAL '7 days';
  
  -- Return metrics
  RETURN QUERY VALUES
    ('total_main_records', v_total_main, 'count', 'info', NOW()),
    ('total_analytics_records', v_total_analytics, 'count', 'info', NOW()),
    ('pending_sync_records', v_pending_sync, 'count', 
     CASE WHEN v_pending_sync = 0 THEN 'good' WHEN v_pending_sync < 10 THEN 'warning' ELSE 'error' END, 
     NOW()),
    ('sync_error_count', v_error_count, 'count',
     CASE WHEN v_error_count = 0 THEN 'good' WHEN v_error_count < 5 THEN 'warning' ELSE 'error' END,
     NOW()),
    ('sync_coverage_percentage', 
     CASE WHEN v_total_main > 0 THEN (v_total_analytics::DECIMAL / v_total_main * 100) ELSE 100 END,
     'percentage',
     CASE WHEN v_total_analytics >= v_total_main THEN 'good' 
          WHEN v_total_analytics >= v_total_main * 0.95 THEN 'warning' 
          ELSE 'error' END,
     NOW()),
    ('avg_sync_time', COALESCE(v_avg_sync_time, 0), 'seconds',
     CASE WHEN v_avg_sync_time IS NULL THEN 'info'
          WHEN v_avg_sync_time < 60 THEN 'good'
          WHEN v_avg_sync_time < 300 THEN 'warning'
          ELSE 'error' END,
     NOW()),
    ('success_rate', COALESCE(v_success_rate, 100), 'percentage',
     CASE WHEN v_success_rate >= 95 THEN 'good'
          WHEN v_success_rate >= 85 THEN 'warning'
          ELSE 'error' END,
     NOW()),
    ('last_sync_age', 
     CASE WHEN v_last_sync IS NOT NULL THEN EXTRACT(EPOCH FROM (NOW() - v_last_sync)) / 3600 ELSE 0 END,
     'hours',
     CASE WHEN v_last_sync IS NULL THEN 'error'
          WHEN v_last_sync > NOW() - INTERVAL '1 hour' THEN 'good'
          WHEN v_last_sync > NOW() - INTERVAL '24 hours' THEN 'warning'
          ELSE 'error' END,
     v_last_sync);
END;
$ LANGUAGE plpgsql;

-- Function to cleanup old sync status records
CREATE OR REPLACE FUNCTION cleanup_sync_status_records(p_retention_days INTEGER DEFAULT 30)
RETURNS TABLE (
  deleted_count INTEGER,
  message TEXT
) AS $
DECLARE
  v_deleted INTEGER;
BEGIN
  DELETE FROM portfolio_analytics_sync_status
  WHERE started_at < NOW() - (p_retention_days || ' days')::INTERVAL
  AND status IN ('completed', 'failed', 'cancelled');
  
  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  
  RETURN QUERY SELECT 
    v_deleted,
    'Cleaned up ' || v_deleted || ' old sync status records';
END;
$ LANGUAGE plpgsql;

-- Enhanced trigger function with better error handling and logging
CREATE OR REPLACE FUNCTION sync_portfolio_analytics_trigger_enhanced()
RETURNS TRIGGER AS $
DECLARE
  sync_result RECORD;
  v_operation_id UUID;
BEGIN
  -- Only sync when status is completed and risk_analysis is present
  IF NEW.status = 'completed' AND NEW.risk_analysis IS NOT NULL THEN
    BEGIN
      v_operation_id := gen_random_uuid();
      
      -- Create trigger operation status
      INSERT INTO portfolio_analytics_sync_status (
        id, operation_type, total_records, metadata
      ) VALUES (
        v_operation_id, 'trigger_sync', 1,
        jsonb_build_object(
          'request_id', NEW.request_id,
          'trigger_type', TG_OP,
          'company_name', NEW.company_name
        )
      );
      
      -- Call the sync function for this specific request
      SELECT * INTO sync_result FROM sync_portfolio_analytics(NEW.request_id);
      
      -- Update operation status
      UPDATE portfolio_analytics_sync_status 
      SET 
        status = CASE WHEN sync_result.error_count = 0 THEN 'completed' ELSE 'failed' END,
        completed_at = NOW(),
        processed_records = 1,
        successful_records = sync_result.synced_count,
        failed_records = sync_result.error_count,
        progress_percentage = 100,
        error_message = CASE WHEN sync_result.error_count > 0 THEN sync_result.message ELSE NULL END
      WHERE id = v_operation_id;
      
      -- Log successful sync
      RAISE NOTICE 'Analytics sync completed for request %: % records synced', 
        NEW.request_id, sync_result.synced_count;
        
    EXCEPTION
      WHEN OTHERS THEN
        -- Update operation status with error
        UPDATE portfolio_analytics_sync_status 
        SET 
          status = 'failed',
          completed_at = NOW(),
          processed_records = 1,
          failed_records = 1,
          progress_percentage = 100,
          error_message = SQLERRM
        WHERE id = v_operation_id;
        
        -- Log error but don't fail the main operation
        RAISE NOTICE 'Analytics sync failed for request %: %', NEW.request_id, SQLERRM;
        
        -- Insert error record
        INSERT INTO portfolio_analytics_sync_errors (
          request_id,
          error_type,
          error_message
        ) VALUES (
          NEW.request_id,
          'trigger_sync_failed',
          SQLERRM
        ) ON CONFLICT (request_id) DO UPDATE SET
          error_message = EXCLUDED.error_message,
          retry_count = portfolio_analytics_sync_errors.retry_count + 1,
          last_attempt = NOW(),
          resolved = FALSE;
    END;
  END IF;
  
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

-- Replace existing triggers with enhanced version
DROP TRIGGER IF EXISTS portfolio_analytics_sync_insert_trigger ON document_processing_requests;
DROP TRIGGER IF EXISTS portfolio_analytics_sync_update_trigger ON document_processing_requests;

-- Create enhanced triggers
CREATE TRIGGER portfolio_analytics_sync_insert_trigger_enhanced
  AFTER INSERT ON document_processing_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.risk_analysis IS NOT NULL)
  EXECUTE FUNCTION sync_portfolio_analytics_trigger_enhanced();

CREATE TRIGGER portfolio_analytics_sync_update_trigger_enhanced
  AFTER UPDATE ON document_processing_requests
  FOR EACH ROW
  WHEN (
    NEW.status = 'completed' 
    AND NEW.risk_analysis IS NOT NULL 
    AND (
      OLD.status != NEW.status 
      OR OLD.risk_analysis IS DISTINCT FROM NEW.risk_analysis
      OR OLD.extracted_data IS DISTINCT FROM NEW.extracted_data
      OR OLD.company_name IS DISTINCT FROM NEW.company_name
      OR OLD.risk_score IS DISTINCT FROM NEW.risk_score
      OR OLD.risk_grade IS DISTINCT FROM NEW.risk_grade
    )
  )
  EXECUTE FUNCTION sync_portfolio_analytics_trigger_enhanced();