-- Add advanced error handling and data quality tracking for deep research system
-- Migration: 026_add_deep_research_error_handling.sql

-- Add error handling columns to existing deep_research_jobs table
ALTER TABLE deep_research_jobs 
ADD COLUMN IF NOT EXISTS error_handling_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS fallback_strategy TEXT,
ADD COLUMN IF NOT EXISTS data_quality_score INTEGER,
ADD COLUMN IF NOT EXISTS error_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS circuit_breaker_status TEXT DEFAULT 'closed';

-- Create comprehensive audit log table for error tracking
CREATE TABLE IF NOT EXISTS deep_research_error_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    error_category TEXT NOT NULL,
    error_severity TEXT NOT NULL,
    error_message TEXT NOT NULL,
    error_context JSONB,
    fallback_strategy TEXT,
    fallback_applied BOOLEAN DEFAULT false,
    user_message TEXT,
    technical_details JSONB,
    suggested_actions TEXT[],
    recoverable BOOLEAN DEFAULT true,
    resolved BOOLEAN DEFAULT false,
    resolution_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE,
    user_id UUID,
    ip_address INET,
    user_agent TEXT
);

-- Create data quality metrics table
CREATE TABLE IF NOT EXISTS deep_research_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    iteration_id UUID REFERENCES deep_research_iterations(id) ON DELETE CASCADE,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    completeness INTEGER NOT NULL CHECK (completeness >= 0 AND completeness <= 100),
    accuracy INTEGER NOT NULL CHECK (accuracy >= 0 AND accuracy <= 100),
    consistency INTEGER NOT NULL CHECK (consistency >= 0 AND consistency <= 100),
    validity INTEGER NOT NULL CHECK (validity >= 0 AND validity <= 100),
    timeliness INTEGER NOT NULL CHECK (timeliness >= 0 AND timeliness <= 100),
    uniqueness INTEGER NOT NULL CHECK (uniqueness >= 0 AND uniqueness <= 100),
    reliability INTEGER NOT NULL CHECK (reliability >= 0 AND reliability <= 100),
    verification_status TEXT NOT NULL CHECK (verification_status IN ('verified', 'partially_verified', 'unverified', 'disputed')),
    critical_issues_count INTEGER DEFAULT 0,
    warnings_count INTEGER DEFAULT 0,
    recommendations_count INTEGER DEFAULT 0,
    quality_report JSONB,
    validation_results JSONB,
    data_completeness_breakdown JSONB,
    source_reliability_scores JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    validated_by TEXT,
    validation_method TEXT DEFAULT 'automated'
);

-- Create API failure tracking table
CREATE TABLE IF NOT EXISTS deep_research_api_failures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    api_name TEXT NOT NULL,
    endpoint_url TEXT,
    failure_type TEXT NOT NULL,
    http_status_code INTEGER,
    error_message TEXT,
    request_payload JSONB,
    response_headers JSONB,
    retry_count INTEGER DEFAULT 0,
    circuit_breaker_triggered BOOLEAN DEFAULT false,
    fallback_used BOOLEAN DEFAULT false,
    resolution_time_ms INTEGER,
    job_id UUID REFERENCES deep_research_jobs(id) ON DELETE SET NULL,
    user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- Create professional fallback responses table
CREATE TABLE IF NOT EXISTS deep_research_fallback_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    fallback_type TEXT NOT NULL,
    trigger_reason TEXT NOT NULL,
    original_error TEXT,
    professional_response TEXT NOT NULL,
    confidence_score DECIMAL(3,2) CHECK (confidence_score >= 0 AND confidence_score <= 1),
    data_completeness INTEGER CHECK (data_completeness >= 0 AND data_completeness <= 100),
    verification_level TEXT CHECK (verification_level IN ('High', 'Medium', 'Low')),
    limitations TEXT[],
    recommendations TEXT[],
    user_feedback_rating INTEGER CHECK (user_feedback_rating >= 1 AND user_feedback_rating <= 5),
    user_feedback_comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_deep_research_error_log_job_id ON deep_research_error_log(job_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_error_log_category ON deep_research_error_log(error_category);
CREATE INDEX IF NOT EXISTS idx_deep_research_error_log_severity ON deep_research_error_log(error_severity);
CREATE INDEX IF NOT EXISTS idx_deep_research_error_log_created_at ON deep_research_error_log(created_at);
CREATE INDEX IF NOT EXISTS idx_deep_research_error_log_resolved ON deep_research_error_log(resolved);

CREATE INDEX IF NOT EXISTS idx_deep_research_quality_metrics_job_id ON deep_research_quality_metrics(job_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_quality_metrics_overall_score ON deep_research_quality_metrics(overall_score);
CREATE INDEX IF NOT EXISTS idx_deep_research_quality_metrics_verification_status ON deep_research_quality_metrics(verification_status);
CREATE INDEX IF NOT EXISTS idx_deep_research_quality_metrics_created_at ON deep_research_quality_metrics(created_at);

CREATE INDEX IF NOT EXISTS idx_deep_research_api_failures_api_name ON deep_research_api_failures(api_name);
CREATE INDEX IF NOT EXISTS idx_deep_research_api_failures_failure_type ON deep_research_api_failures(failure_type);
CREATE INDEX IF NOT EXISTS idx_deep_research_api_failures_created_at ON deep_research_api_failures(created_at);
CREATE INDEX IF NOT EXISTS idx_deep_research_api_failures_circuit_breaker ON deep_research_api_failures(circuit_breaker_triggered);

CREATE INDEX IF NOT EXISTS idx_deep_research_fallback_responses_job_id ON deep_research_fallback_responses(job_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_fallback_responses_fallback_type ON deep_research_fallback_responses(fallback_type);
CREATE INDEX IF NOT EXISTS idx_deep_research_fallback_responses_created_at ON deep_research_fallback_responses(created_at);

-- Add RLS policies for security
ALTER TABLE deep_research_error_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_research_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_research_api_failures ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_research_fallback_responses ENABLE ROW LEVEL SECURITY;

-- RLS policies for deep_research_error_log
CREATE POLICY "Users can view their own error logs" ON deep_research_error_log
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_error_log.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert error logs for their jobs" ON deep_research_error_log
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_error_log.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

-- RLS policies for deep_research_quality_metrics
CREATE POLICY "Users can view quality metrics for their jobs" ON deep_research_quality_metrics
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_quality_metrics.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert quality metrics" ON deep_research_quality_metrics
    FOR INSERT WITH CHECK (true);

-- RLS policies for deep_research_api_failures
CREATE POLICY "Users can view API failures for their jobs" ON deep_research_api_failures
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_api_failures.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert API failure records" ON deep_research_api_failures
    FOR INSERT WITH CHECK (true);

-- RLS policies for deep_research_fallback_responses
CREATE POLICY "Users can view fallback responses for their jobs" ON deep_research_fallback_responses
    FOR SELECT USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_fallback_responses.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert fallback responses for their jobs" ON deep_research_fallback_responses
    FOR INSERT WITH CHECK (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_fallback_responses.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update their fallback response feedback" ON deep_research_fallback_responses
    FOR UPDATE USING (
        user_id = auth.uid() OR 
        EXISTS (
            SELECT 1 FROM deep_research_jobs 
            WHERE deep_research_jobs.id = deep_research_fallback_responses.job_id 
            AND deep_research_jobs.user_id = auth.uid()
        )
    );

-- Create functions for error handling analytics

-- Function to get error statistics
CREATE OR REPLACE FUNCTION get_deep_research_error_statistics(
    p_user_id UUID DEFAULT NULL,
    p_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days',
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
)
RETURNS TABLE (
    total_errors BIGINT,
    critical_errors BIGINT,
    resolved_errors BIGINT,
    most_common_category TEXT,
    most_common_severity TEXT,
    average_resolution_time INTERVAL,
    fallback_success_rate DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    WITH error_stats AS (
        SELECT 
            COUNT(*) as total_count,
            COUNT(*) FILTER (WHERE error_severity = 'critical') as critical_count,
            COUNT(*) FILTER (WHERE resolved = true) as resolved_count,
            COUNT(*) FILTER (WHERE fallback_applied = true) as fallback_count,
            MODE() WITHIN GROUP (ORDER BY error_category) as common_category,
            MODE() WITHIN GROUP (ORDER BY error_severity) as common_severity,
            AVG(EXTRACT(EPOCH FROM (resolved_at - created_at))) as avg_resolution_seconds
        FROM deep_research_error_log
        WHERE created_at BETWEEN p_start_date AND p_end_date
        AND (p_user_id IS NULL OR user_id = p_user_id)
    )
    SELECT 
        total_count,
        critical_count,
        resolved_count,
        common_category,
        common_severity,
        MAKE_INTERVAL(secs => COALESCE(avg_resolution_seconds, 0)),
        CASE 
            WHEN total_count > 0 THEN ROUND((fallback_count::DECIMAL / total_count) * 100, 2)
            ELSE 0
        END
    FROM error_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get data quality trends
CREATE OR REPLACE FUNCTION get_data_quality_trends(
    p_user_id UUID DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    date_bucket DATE,
    avg_overall_score DECIMAL,
    avg_completeness DECIMAL,
    avg_accuracy DECIMAL,
    avg_reliability DECIMAL,
    total_assessments BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        DATE(dqm.created_at) as date_bucket,
        ROUND(AVG(dqm.overall_score), 2) as avg_overall_score,
        ROUND(AVG(dqm.completeness), 2) as avg_completeness,
        ROUND(AVG(dqm.accuracy), 2) as avg_accuracy,
        ROUND(AVG(dqm.reliability), 2) as avg_reliability,
        COUNT(*) as total_assessments
    FROM deep_research_quality_metrics dqm
    JOIN deep_research_jobs drj ON dqm.job_id = drj.id
    WHERE dqm.created_at >= NOW() - MAKE_INTERVAL(days => p_days)
    AND (p_user_id IS NULL OR drj.user_id = p_user_id)
    GROUP BY DATE(dqm.created_at)
    ORDER BY date_bucket DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get API health status
CREATE OR REPLACE FUNCTION get_api_health_status(
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    api_name TEXT,
    total_requests BIGINT,
    failed_requests BIGINT,
    failure_rate DECIMAL,
    circuit_breaker_triggers BIGINT,
    avg_response_time_ms DECIMAL,
    last_failure TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        daf.api_name,
        COUNT(*) as total_requests,
        COUNT(*) FILTER (WHERE daf.http_status_code >= 400 OR daf.error_message IS NOT NULL) as failed_requests,
        CASE 
            WHEN COUNT(*) > 0 THEN 
                ROUND((COUNT(*) FILTER (WHERE daf.http_status_code >= 400 OR daf.error_message IS NOT NULL)::DECIMAL / COUNT(*)) * 100, 2)
            ELSE 0
        END as failure_rate,
        COUNT(*) FILTER (WHERE daf.circuit_breaker_triggered = true) as circuit_breaker_triggers,
        ROUND(AVG(daf.resolution_time_ms), 2) as avg_response_time_ms,
        MAX(daf.created_at) as last_failure
    FROM deep_research_api_failures daf
    WHERE daf.created_at >= NOW() - MAKE_INTERVAL(hours => p_hours)
    GROUP BY daf.api_name
    ORDER BY failure_rate DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION get_deep_research_error_statistics TO authenticated;
GRANT EXECUTE ON FUNCTION get_data_quality_trends TO authenticated;
GRANT EXECUTE ON FUNCTION get_api_health_status TO authenticated;

-- Add comments for documentation
COMMENT ON TABLE deep_research_error_log IS 'Comprehensive error tracking for deep research system with categorization and fallback strategies';
COMMENT ON TABLE deep_research_quality_metrics IS 'Data quality assessment metrics for research results validation';
COMMENT ON TABLE deep_research_api_failures IS 'API failure tracking with circuit breaker and retry logic monitoring';
COMMENT ON TABLE deep_research_fallback_responses IS 'Professional fallback responses with user feedback tracking';

COMMENT ON FUNCTION get_deep_research_error_statistics IS 'Get comprehensive error statistics for monitoring and analysis';
COMMENT ON FUNCTION get_data_quality_trends IS 'Get data quality trends over time for performance monitoring';
COMMENT ON FUNCTION get_api_health_status IS 'Get API health status and performance metrics';