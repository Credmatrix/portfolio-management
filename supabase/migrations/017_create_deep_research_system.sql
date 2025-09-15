-- Deep Research System Migration
-- Creates tables for JINA AI deep research functionality

-- Research Jobs Table
CREATE TABLE IF NOT EXISTS deep_research_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES portfolio_requests(request_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    job_type TEXT NOT NULL CHECK (job_type IN ('full_due_diligence', 'directors_research', 'legal_research', 'negative_news', 'regulatory_research', 'related_companies')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    
    -- Job Configuration
    research_scope JSONB DEFAULT '{}',
    budget_tokens INTEGER DEFAULT 15000,
    max_attempts INTEGER DEFAULT 2,
    
    -- Results
    findings JSONB DEFAULT '{}',
    risk_assessment JSONB DEFAULT '{}',
    recommendations TEXT[],
    
    -- Metadata
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    tokens_used INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research Findings Table (for individual research queries)
CREATE TABLE IF NOT EXISTS deep_research_findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    research_type TEXT NOT NULL,
    query_text TEXT NOT NULL,
    
    -- Results
    success BOOLEAN DEFAULT FALSE,
    content TEXT,
    tokens_used INTEGER DEFAULT 0,
    
    -- Metadata
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research Reports Table (for compiled reports)
CREATE TABLE IF NOT EXISTS deep_research_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES portfolio_requests(request_id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    
    -- Report Details
    report_type TEXT NOT NULL DEFAULT 'comprehensive',
    title TEXT NOT NULL,
    executive_summary TEXT,
    
    -- Content
    sections JSONB DEFAULT '{}',
    findings_summary JSONB DEFAULT '{}',
    risk_level TEXT CHECK (risk_level IN ('LOW', 'MEDIUM', 'HIGH')),
    recommendations TEXT[],
    
    -- Export Options
    pdf_url TEXT,
    export_formats TEXT[] DEFAULT ARRAY['pdf', 'json'],
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '30 days'),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_request_id ON deep_research_jobs(request_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_user_id ON deep_research_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_status ON deep_research_jobs(status);
CREATE INDEX IF NOT EXISTS idx_deep_research_jobs_created_at ON deep_research_jobs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deep_research_findings_job_id ON deep_research_findings(job_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_findings_research_type ON deep_research_findings(research_type);

CREATE INDEX IF NOT EXISTS idx_deep_research_reports_request_id ON deep_research_reports(request_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_reports_user_id ON deep_research_reports(user_id);

-- RLS Policies
ALTER TABLE deep_research_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_research_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE deep_research_reports ENABLE ROW LEVEL SECURITY;

-- Policies for deep_research_jobs
CREATE POLICY "Users can view their own research jobs" ON deep_research_jobs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create research jobs" ON deep_research_jobs
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own research jobs" ON deep_research_jobs
    FOR UPDATE USING (user_id = auth.uid());

-- Policies for deep_research_findings
CREATE POLICY "Users can view findings for their jobs" ON deep_research_findings
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM deep_research_jobs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can insert findings" ON deep_research_findings
    FOR INSERT WITH CHECK (true);

-- Policies for deep_research_reports
CREATE POLICY "Users can view their own reports" ON deep_research_reports
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create reports" ON deep_research_reports
    FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reports" ON deep_research_reports
    FOR UPDATE USING (user_id = auth.uid());

-- Functions for job management
CREATE OR REPLACE FUNCTION update_research_job_progress(
    job_id_param UUID,
    progress_param INTEGER,
    status_param TEXT DEFAULT NULL
) RETURNS VOID AS $$
BEGIN
    UPDATE deep_research_jobs 
    SET 
        progress = progress_param,
        status = COALESCE(status_param, status),
        updated_at = NOW()
    WHERE id = job_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get active research jobs
CREATE OR REPLACE FUNCTION get_active_research_jobs(user_id_param UUID)
RETURNS TABLE (
    id UUID,
    request_id UUID,
    job_type TEXT,
    status TEXT,
    progress INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id,
        j.request_id,
        j.job_type,
        j.status,
        j.progress,
        j.created_at
    FROM deep_research_jobs j
    WHERE j.user_id = user_id_param
    AND j.status IN ('pending', 'running')
    ORDER BY j.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to cleanup expired reports
CREATE OR REPLACE FUNCTION cleanup_expired_research_reports()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM deep_research_reports 
    WHERE expires_at < NOW();
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_deep_research_jobs_updated_at
    BEFORE UPDATE ON deep_research_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_deep_research_reports_updated_at
    BEFORE UPDATE ON deep_research_reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();