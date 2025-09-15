-- Completely rewrite the GST refresh status function to avoid ambiguous references

-- Drop all existing versions of the function
DROP FUNCTION IF EXISTS get_user_gst_refresh_status(TEXT, TEXT);
DROP FUNCTION IF EXISTS can_user_refresh_gst(TEXT, TEXT);

-- Create a simple, robust function to get refresh status
CREATE OR REPLACE FUNCTION get_user_gst_refresh_status(
    p_user_id TEXT,
    p_request_id TEXT
) RETURNS JSON AS $$
DECLARE
    current_month_str TEXT;
    quota_record RECORD;
    can_refresh_val BOOLEAN;
    days_until_reset_val INTEGER;
    result_json JSON;
BEGIN
    -- Get current month string
    current_month_str := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Calculate days until reset
    days_until_reset_val := EXTRACT(DAY FROM (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - CURRENT_DATE))::INTEGER;
    
    -- Get quota record for this user/request/month
    SELECT 
        refresh_count,
        max_refreshes_per_month,
        last_refresh_at
    INTO quota_record
    FROM gst_refresh_quotas
    WHERE user_id = p_user_id 
      AND request_id = p_request_id 
      AND month_year = current_month_str;
    
    -- Determine if user can refresh
    IF quota_record IS NULL THEN
        -- No record exists, user can refresh (first time)
        can_refresh_val := TRUE;
        result_json := json_build_object(
            'can_refresh', TRUE,
            'refresh_count', 0,
            'max_refreshes', 2,
            'last_refresh_at', NULL,
            'days_until_reset', days_until_reset_val
        );
    ELSE
        -- Record exists, check limits
        can_refresh_val := COALESCE(quota_record.refresh_count, 0) < COALESCE(quota_record.max_refreshes_per_month, 2);
        result_json := json_build_object(
            'can_refresh', can_refresh_val,
            'refresh_count', COALESCE(quota_record.refresh_count, 0),
            'max_refreshes', COALESCE(quota_record.max_refreshes_per_month, 2),
            'last_refresh_at', quota_record.last_refresh_at,
            'days_until_reset', days_until_reset_val
        );
    END IF;
    
    RETURN result_json;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a simple boolean function for checking refresh capability
CREATE OR REPLACE FUNCTION can_user_refresh_gst(
    p_user_id TEXT,
    p_request_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_month_str TEXT;
    current_refresh_count INTEGER;
    max_refresh_count INTEGER;
BEGIN
    current_month_str := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current counts
    SELECT 
        COALESCE(refresh_count, 0),
        COALESCE(max_refreshes_per_month, 2)
    INTO current_refresh_count, max_refresh_count
    FROM gst_refresh_quotas
    WHERE user_id = p_user_id 
      AND request_id = p_request_id 
      AND month_year = current_month_str;
    
    -- If no record found, user can refresh
    IF current_refresh_count IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if under limit
    RETURN current_refresh_count < max_refresh_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_gst_refresh_status(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION can_user_refresh_gst(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gst_refresh_status(TEXT, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION can_user_refresh_gst(TEXT, TEXT) TO service_role;