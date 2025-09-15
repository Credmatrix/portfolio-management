-- Add a simple fallback function for GST refresh status checking

-- Simple function to check refresh count without complex queries
CREATE OR REPLACE FUNCTION get_simple_gst_refresh_status(
    p_user_id TEXT,
    p_request_id TEXT
) RETURNS JSON AS $$
DECLARE
    current_month_str TEXT;
    quota_record RECORD;
    result JSON;
BEGIN
    current_month_str := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get the quota record
    SELECT * INTO quota_record
    FROM gst_refresh_quotas
    WHERE user_id = p_user_id 
      AND request_id = p_request_id 
      AND month_year = current_month_str;
    
    -- Build result JSON
    IF quota_record IS NULL THEN
        -- No record exists, user can refresh
        result := json_build_object(
            'can_refresh', true,
            'refresh_count', 0,
            'max_refreshes', 2,
            'last_refresh_at', null,
            'days_until_reset', EXTRACT(DAY FROM (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - CURRENT_DATE))
        );
    ELSE
        -- Record exists, check if user can still refresh
        result := json_build_object(
            'can_refresh', (quota_record.refresh_count < COALESCE(quota_record.max_refreshes_per_month, 2)),
            'refresh_count', COALESCE(quota_record.refresh_count, 0),
            'max_refreshes', COALESCE(quota_record.max_refreshes_per_month, 2),
            'last_refresh_at', quota_record.last_refresh_at,
            'days_until_reset', EXTRACT(DAY FROM (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' - CURRENT_DATE))
        );
    END IF;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_simple_gst_refresh_status(TEXT, TEXT) TO authenticated;

-- Create a simple function to check if user can refresh (boolean only)
CREATE OR REPLACE FUNCTION can_user_refresh_gst_simple(
    p_user_id TEXT,
    p_request_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_month_str TEXT;
    current_count INTEGER;
    max_count INTEGER;
BEGIN
    current_month_str := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current refresh count and limit
    SELECT 
        COALESCE(refresh_count, 0),
        COALESCE(max_refreshes_per_month, 2)
    INTO current_count, max_count
    FROM gst_refresh_quotas
    WHERE user_id = p_user_id 
      AND request_id = p_request_id 
      AND month_year = current_month_str;
    
    -- If no record exists, user can refresh (first time)
    IF current_count IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has remaining refreshes
    RETURN current_count < max_count;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION can_user_refresh_gst_simple(TEXT, TEXT) TO authenticated;