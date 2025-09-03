-- Migration: Create triggers for automatic analytics table synchronization
-- This migration creates triggers to automatically sync the analytics table

-- Trigger function for automatic synchronization
CREATE OR REPLACE FUNCTION sync_portfolio_analytics_trigger()
RETURNS TRIGGER AS $$
DECLARE
  sync_result RECORD;
BEGIN
  -- Only sync when status is completed and risk_analysis is present
  IF NEW.status = 'completed' AND NEW.risk_analysis IS NOT NULL THEN
    BEGIN
      -- Call the sync function for this specific request
      SELECT * INTO sync_result FROM sync_portfolio_analytics(NEW.request_id);
      
      -- Log successful sync
      RAISE NOTICE 'Analytics sync completed for request %: % records synced', 
        NEW.request_id, sync_result.synced_count;
        
    EXCEPTION
      WHEN OTHERS THEN
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
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER portfolio_analytics_sync_insert_trigger
  AFTER INSERT ON document_processing_requests
  FOR EACH ROW
  WHEN (NEW.status = 'completed' AND NEW.risk_analysis IS NOT NULL)
  EXECUTE FUNCTION sync_portfolio_analytics_trigger();

-- Create trigger for UPDATE operations
CREATE TRIGGER portfolio_analytics_sync_update_trigger
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
  EXECUTE FUNCTION sync_portfolio_analytics_trigger();

-- Function to manually retry failed syncs
CREATE OR REPLACE FUNCTION retry_failed_syncs(max_retries INTEGER DEFAULT 3)
RETURNS TABLE (
  request_id VARCHAR,
  retry_status VARCHAR,
  message TEXT
) AS $$
DECLARE
  error_rec RECORD;
  sync_result RECORD;
BEGIN
  FOR error_rec IN 
    SELECT se.request_id, se.retry_count
    FROM portfolio_analytics_sync_errors se
    WHERE se.resolved = FALSE 
    AND se.retry_count < max_retries
    ORDER BY se.last_attempt ASC
  LOOP
    BEGIN
      -- Attempt to sync the failed record
      SELECT * INTO sync_result FROM sync_portfolio_analytics(error_rec.request_id);
      
      IF sync_result.error_count = 0 THEN
        -- Mark as resolved
        UPDATE portfolio_analytics_sync_errors 
        SET resolved = TRUE, last_attempt = NOW()
        WHERE portfolio_analytics_sync_errors.request_id = error_rec.request_id;
        
        RETURN QUERY SELECT 
          error_rec.request_id,
          'Success'::VARCHAR,
          'Sync completed successfully'::TEXT;
      ELSE
        RETURN QUERY SELECT 
          error_rec.request_id,
          'Failed'::VARCHAR,
          'Sync failed again'::TEXT;
      END IF;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Update retry count
        UPDATE portfolio_analytics_sync_errors 
        SET retry_count = retry_count + 1, 
            last_attempt = NOW(),
            error_message = SQLERRM
        WHERE portfolio_analytics_sync_errors.request_id = error_rec.request_id;
        
        RETURN QUERY SELECT 
          error_rec.request_id,
          'Error'::VARCHAR,
          SQLERRM::TEXT;
    END;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to rebuild entire analytics table
CREATE OR REPLACE FUNCTION rebuild_analytics_table()
RETURNS TABLE (
  total_processed INTEGER,
  successful_syncs INTEGER,
  failed_syncs INTEGER,
  execution_time_seconds DECIMAL
) AS $$
DECLARE
  start_time TIMESTAMP;
  end_time TIMESTAMP;
  sync_result RECORD;
BEGIN
  start_time := clock_timestamp();
  
  -- Clear existing analytics data
  TRUNCATE TABLE portfolio_analytics;
  
  -- Clear sync errors
  DELETE FROM portfolio_analytics_sync_errors;
  
  -- Sync all completed records
  SELECT * INTO sync_result FROM sync_portfolio_analytics();
  
  end_time := clock_timestamp();
  
  RETURN QUERY SELECT
    sync_result.synced_count + sync_result.error_count,
    sync_result.synced_count,
    sync_result.error_count,
    EXTRACT(EPOCH FROM (end_time - start_time))::DECIMAL;
END;
$$ LANGUAGE plpgsql;