-- Fix the get_user_gst_refresh_status function to resolve EXTRACT error

-- Drop and recreate the function with proper date calculation
DROP FUNCTION IF EXISTS get_user_gst_refresh_status(TEXT, TEXT);

CREATE OR REPLACE FUNCTION get_user_gst_refresh_status(
    p_user_id TEXT,
    p_request_id TEXT
) RETURNS TABLE (
    can_refresh BOOLEAN,
    refresh_count INTEGER,
    max_refreshes INTEGER,
    last_refresh_at TIMESTAMP WITH TIME ZONE,
    days_until_reset INTEGER
) AS $$
DECLARE
    current_month_str TEXT;
    next_month_date DATE;
    days_diff_val INTEGER;
BEGIN
    current_month_str := TO_CHAR(NOW(), 'YYYY-MM');
    next_month_date := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
    days_diff_val := (next_month_date - CURRENT_DATE);
    
    RETURN QUERY
    SELECT 
        can_user_refresh_gst(p_user_id, p_request_id) as can_refresh,
        COALESCE(grq.refresh_count, 0) as refresh_count,
        COALESCE(grq.max_refreshes_per_month, 2) as max_refreshes,
        grq.last_refresh_at,
        days_diff_val as days_until_reset
    FROM gst_refresh_quotas grq
    WHERE grq.user_id = p_user_id 
      AND grq.request_id = p_request_id 
      AND grq.month_year = current_month_str
    
    UNION ALL
    
    -- If no record exists, return default values
    SELECT 
        TRUE as can_refresh,
        0 as refresh_count,
        2 as max_refreshes,
        NULL::TIMESTAMP WITH TIME ZONE as last_refresh_at,
        days_diff_val as days_until_reset
    WHERE NOT EXISTS (
        SELECT 1 FROM gst_refresh_quotas q
        WHERE q.user_id = p_user_id 
          AND q.request_id = p_request_id 
          AND q.month_year = current_month_str
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_gst_refresh_status(TEXT, TEXT) TO authenticated;