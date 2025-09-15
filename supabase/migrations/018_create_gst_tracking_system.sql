-- GST Filing Data Tracking System
-- This migration creates tables to track GST filing data, API usage, and refresh requests

-- Table to store GST filing data from Whitebooks API
CREATE TABLE IF NOT EXISTS gst_filing_data (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    gstin TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    return_type TEXT NOT NULL, -- GSTR1, GSTR3B, etc.
    return_period TEXT NOT NULL, -- 042025, 052025, etc.
    date_of_filing DATE,
    filing_mode TEXT, -- ONLINE, OFFLINE
    arn TEXT, -- Acknowledgment Reference Number
    status TEXT, -- Filed, Not Filed, etc.
    is_valid BOOLEAN DEFAULT true,
    
    -- Metadata
    data_source TEXT DEFAULT 'whitebooks_api',
    fetched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(gstin, financial_year, return_type, return_period)
);

-- Table to track GST API requests and usage
CREATE TABLE IF NOT EXISTS gst_api_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL, -- Portfolio request ID
    user_id TEXT NOT NULL,
    gstin TEXT NOT NULL,
    financial_year TEXT NOT NULL,
    
    -- API Details
    api_provider TEXT DEFAULT 'whitebooks',
    api_endpoint TEXT,
    request_payload JSONB,
    response_data JSONB,
    response_status INTEGER,
    
    -- Cost tracking
    cost_inr DECIMAL(10,2) DEFAULT 0.10, -- 10k INR for 1L requests = 0.10 INR per request
    
    -- Status
    status TEXT DEFAULT 'pending', -- pending, success, failed, cached
    error_message TEXT,
    
    -- Timestamps
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key to document_processing_requests
    CONSTRAINT fk_gst_api_requests_request_id 
        FOREIGN KEY (request_id) 
        REFERENCES document_processing_requests(request_id)
);

-- Table to track user refresh quotas and usage
CREATE TABLE IF NOT EXISTS gst_refresh_quotas (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    request_id TEXT NOT NULL,
    
    -- Quota tracking
    month_year TEXT NOT NULL, -- Format: 2025-01
    refresh_count INTEGER DEFAULT 0,
    max_refreshes_per_month INTEGER DEFAULT 2,
    
    -- Last refresh details
    last_refresh_at TIMESTAMP WITH TIME ZONE,
    last_refresh_gstins TEXT[], -- Array of GSTINs refreshed
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(user_id, request_id, month_year),
    
    -- Foreign key
    CONSTRAINT fk_gst_refresh_quotas_request_id 
        FOREIGN KEY (request_id) 
        REFERENCES document_processing_requests(request_id)
);

-- Table to store GST refresh job queue
CREATE TABLE IF NOT EXISTS gst_refresh_jobs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    
    -- Job details
    gstins TEXT[] NOT NULL, -- Array of GSTINs to refresh
    financial_year TEXT NOT NULL,
    priority INTEGER DEFAULT 1, -- 1 = low, 5 = high
    
    -- Status tracking
    status TEXT DEFAULT 'queued', -- queued, processing, completed, failed
    progress INTEGER DEFAULT 0, -- 0-100
    total_gstins INTEGER,
    processed_gstins INTEGER DEFAULT 0,
    failed_gstins INTEGER DEFAULT 0,
    
    -- Results
    results JSONB,
    error_details JSONB,
    
    -- Timestamps
    queued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Foreign key
    CONSTRAINT fk_gst_refresh_jobs_request_id 
        FOREIGN KEY (request_id) 
        REFERENCES document_processing_requests(request_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_gst_filing_data_gstin ON gst_filing_data(gstin);
CREATE INDEX IF NOT EXISTS idx_gst_filing_data_fy_period ON gst_filing_data(financial_year, return_period);
CREATE INDEX IF NOT EXISTS idx_gst_filing_data_fetched_at ON gst_filing_data(fetched_at);

CREATE INDEX IF NOT EXISTS idx_gst_api_requests_request_id ON gst_api_requests(request_id);
CREATE INDEX IF NOT EXISTS idx_gst_api_requests_user_id ON gst_api_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_gst_api_requests_gstin ON gst_api_requests(gstin);
CREATE INDEX IF NOT EXISTS idx_gst_api_requests_requested_at ON gst_api_requests(requested_at);

CREATE INDEX IF NOT EXISTS idx_gst_refresh_quotas_user_request ON gst_refresh_quotas(user_id, request_id);
CREATE INDEX IF NOT EXISTS idx_gst_refresh_quotas_month_year ON gst_refresh_quotas(month_year);

CREATE INDEX IF NOT EXISTS idx_gst_refresh_jobs_status ON gst_refresh_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gst_refresh_jobs_request_id ON gst_refresh_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_gst_refresh_jobs_queued_at ON gst_refresh_jobs(queued_at);

-- Function to check if user can refresh GST data
CREATE OR REPLACE FUNCTION can_user_refresh_gst(
    p_user_id TEXT,
    p_request_id TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    current_month TEXT;
    refresh_count INTEGER;
    max_refreshes INTEGER;
BEGIN
    -- Get current month in YYYY-MM format
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Get current refresh count and limit
    SELECT 
        COALESCE(refresh_count, 0),
        COALESCE(max_refreshes_per_month, 2)
    INTO refresh_count, max_refreshes
    FROM gst_refresh_quotas
    WHERE user_id = p_user_id 
      AND request_id = p_request_id 
      AND month_year = current_month;
    
    -- If no record exists, user can refresh (first time)
    IF refresh_count IS NULL THEN
        RETURN TRUE;
    END IF;
    
    -- Check if user has remaining refreshes
    RETURN refresh_count < max_refreshes;
END;
$$ LANGUAGE plpgsql;

-- Function to increment refresh count
CREATE OR REPLACE FUNCTION increment_gst_refresh_count(
    p_user_id TEXT,
    p_request_id TEXT,
    p_gstins TEXT[]
) RETURNS VOID AS $$
DECLARE
    current_month TEXT;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    
    -- Insert or update refresh quota record
    INSERT INTO gst_refresh_quotas (
        user_id, 
        request_id, 
        month_year, 
        refresh_count, 
        last_refresh_at,
        last_refresh_gstins
    )
    VALUES (
        p_user_id, 
        p_request_id, 
        current_month, 
        1, 
        NOW(),
        p_gstins
    )
    ON CONFLICT (user_id, request_id, month_year)
    DO UPDATE SET
        refresh_count = gst_refresh_quotas.refresh_count + 1,
        last_refresh_at = NOW(),
        last_refresh_gstins = p_gstins,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Function to get GST filing data for a GSTIN
CREATE OR REPLACE FUNCTION get_gst_filing_data(
    p_gstin TEXT,
    p_financial_year TEXT DEFAULT NULL
) RETURNS TABLE (
    gstin TEXT,
    financial_year TEXT,
    return_type TEXT,
    return_period TEXT,
    date_of_filing DATE,
    filing_mode TEXT,
    arn TEXT,
    status TEXT,
    is_valid BOOLEAN,
    fetched_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        gfd.gstin,
        gfd.financial_year,
        gfd.return_type,
        gfd.return_period,
        gfd.date_of_filing,
        gfd.filing_mode,
        gfd.arn,
        gfd.status,
        gfd.is_valid,
        gfd.fetched_at
    FROM gst_filing_data gfd
    WHERE gfd.gstin = p_gstin
      AND (p_financial_year IS NULL OR gfd.financial_year = p_financial_year)
    ORDER BY gfd.financial_year DESC, gfd.return_period DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to check if GST data is fresh (less than 30 days old)
CREATE OR REPLACE FUNCTION is_gst_data_fresh(
    p_gstin TEXT,
    p_financial_year TEXT,
    p_max_age_days INTEGER DEFAULT 30
) RETURNS BOOLEAN AS $$
DECLARE
    latest_fetch TIMESTAMP WITH TIME ZONE;
BEGIN
    SELECT MAX(fetched_at)
    INTO latest_fetch
    FROM gst_filing_data
    WHERE gstin = p_gstin
      AND financial_year = p_financial_year;
    
    -- If no data exists, it's not fresh
    IF latest_fetch IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if data is within the acceptable age
    RETURN latest_fetch > (NOW() - INTERVAL '1 day' * p_max_age_days);
END;
$$ LANGUAGE plpgsql;

-- Function to get user's GST refresh status
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
    current_month TEXT;
    next_month DATE;
    days_diff INTEGER;
BEGIN
    current_month := TO_CHAR(NOW(), 'YYYY-MM');
    next_month := DATE_TRUNC('month', NOW()) + INTERVAL '1 month';
    days_diff := (next_month - CURRENT_DATE);
    
    RETURN QUERY
    SELECT 
        can_user_refresh_gst(p_user_id, p_request_id) as can_refresh,
        COALESCE(grq.refresh_count, 0) as refresh_count,
        COALESCE(grq.max_refreshes_per_month, 2) as max_refreshes,
        grq.last_refresh_at,
        days_diff as days_until_reset
    FROM gst_refresh_quotas grq
    WHERE grq.user_id = p_user_id 
      AND grq.request_id = p_request_id 
      AND grq.month_year = current_month
    
    UNION ALL
    
    -- If no record exists, return default values
    SELECT 
        TRUE as can_refresh,
        0 as refresh_count,
        2 as max_refreshes,
        NULL::TIMESTAMP WITH TIME ZONE as last_refresh_at,
        days_diff as days_until_reset
    WHERE NOT EXISTS (
        SELECT 1 FROM gst_refresh_quotas 
        WHERE user_id = p_user_id 
          AND request_id = p_request_id 
          AND month_year = current_month
    )
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies
ALTER TABLE gst_filing_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_api_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_refresh_quotas ENABLE ROW LEVEL SECURITY;
ALTER TABLE gst_refresh_jobs ENABLE ROW LEVEL SECURITY;

-- RLS policies for gst_filing_data (readable by all authenticated users)
CREATE POLICY "gst_filing_data_select" ON gst_filing_data
    FOR SELECT TO authenticated
    USING (true);

-- RLS policies for gst_api_requests (users can only see their own requests)
CREATE POLICY "gst_api_requests_select" ON gst_api_requests
    FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);

CREATE POLICY "gst_api_requests_insert" ON gst_api_requests
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

-- RLS policies for gst_refresh_quotas (users can only see their own quotas)
CREATE POLICY "gst_refresh_quotas_select" ON gst_refresh_quotas
    FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);

CREATE POLICY "gst_refresh_quotas_insert" ON gst_refresh_quotas
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "gst_refresh_quotas_update" ON gst_refresh_quotas
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = user_id);

-- RLS policies for gst_refresh_jobs (users can only see their own jobs)
CREATE POLICY "gst_refresh_jobs_select" ON gst_refresh_jobs
    FOR SELECT TO authenticated
    USING (auth.uid()::text = user_id);

CREATE POLICY "gst_refresh_jobs_insert" ON gst_refresh_jobs
    FOR INSERT TO authenticated
    WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "gst_refresh_jobs_update" ON gst_refresh_jobs
    FOR UPDATE TO authenticated
    USING (auth.uid()::text = user_id);

-- Grant necessary permissions
GRANT SELECT ON gst_filing_data TO authenticated;
GRANT ALL ON gst_api_requests TO authenticated;
GRANT ALL ON gst_refresh_quotas TO authenticated;
GRANT ALL ON gst_refresh_jobs TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION can_user_refresh_gst(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION increment_gst_refresh_count(TEXT, TEXT, TEXT[]) TO authenticated;
GRANT EXECUTE ON FUNCTION get_gst_filing_data(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION is_gst_data_fresh(TEXT, TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_gst_refresh_status(TEXT, TEXT) TO authenticated;