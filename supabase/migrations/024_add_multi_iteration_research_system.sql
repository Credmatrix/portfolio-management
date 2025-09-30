-- Multi-Iteration Research System Migration
-- Adds support for tracking multiple research iterations and findings consolidation

-- Research Iterations Table
CREATE TABLE IF NOT EXISTS deep_research_iterations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    iteration_number INTEGER NOT NULL,
    research_type TEXT NOT NULL,
    
    -- Iteration Configuration
    research_focus JSONB NOT NULL DEFAULT '{}',
    budget_tokens INTEGER DEFAULT 0, -- 0 = unlimited
    search_depth TEXT DEFAULT 'exhaustive' CHECK (search_depth IN ('standard', 'exhaustive', 'reduced')),
    
    -- Results
    findings JSONB DEFAULT '{}',
    structured_findings JSONB DEFAULT '[]',
    confidence_score DECIMAL(3,2) DEFAULT 0.0 CHECK (confidence_score >= 0 AND confidence_score <= 1),
    data_quality_score DECIMAL(3,2) DEFAULT 0.0 CHECK (data_quality_score >= 0 AND data_quality_score <= 1),
    tokens_used INTEGER DEFAULT 0,
    
    -- Status and Timing
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Constraints
    UNIQUE(job_id, iteration_number)
);

-- Entity Analysis Table for comprehensive tracking
CREATE TABLE IF NOT EXISTS research_entity_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    iteration_id UUID REFERENCES deep_research_iterations(id) ON DELETE CASCADE,
    
    -- Entity Information
    entity_type TEXT NOT NULL CHECK (entity_type IN ('company', 'director', 'subsidiary', 'associate', 'related_party')),
    entity_identifier TEXT NOT NULL, -- CIN, PAN, Name, etc.
    entity_name TEXT NOT NULL,
    
    -- Analysis Results
    analysis_results JSONB NOT NULL DEFAULT '{}',
    risk_assessment JSONB DEFAULT '{}',
    business_impact JSONB DEFAULT '{}',
    
    -- Verification and Quality
    verification_status TEXT DEFAULT 'unverified' CHECK (verification_status IN ('verified', 'partial', 'unverified', 'disputed')),
    data_completeness DECIMAL(3,2) DEFAULT 0.0 CHECK (data_completeness >= 0 AND data_completeness <= 1),
    confidence_level TEXT DEFAULT 'medium' CHECK (confidence_level IN ('high', 'medium', 'low')),
    
    -- Source Information
    sources JSONB DEFAULT '[]',
    citations JSONB DEFAULT '[]',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Findings Consolidation Table
CREATE TABLE IF NOT EXISTS research_findings_consolidation (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    
    -- Consolidation Configuration
    consolidation_strategy TEXT DEFAULT 'comprehensive' CHECK (consolidation_strategy IN ('merge', 'latest', 'comprehensive')),
    iterations_included INTEGER[] NOT NULL,
    
    -- Consolidated Results
    consolidated_findings JSONB NOT NULL DEFAULT '{}',
    primary_entity_analysis JSONB DEFAULT '{}',
    directors_analysis JSONB DEFAULT '[]',
    subsidiaries_analysis JSONB DEFAULT '[]',
    regulatory_findings JSONB DEFAULT '[]',
    litigation_findings JSONB DEFAULT '[]',
    
    -- Quality Metrics
    overall_confidence_score DECIMAL(3,2) DEFAULT 0.0,
    data_completeness_score DECIMAL(3,2) DEFAULT 0.0,
    verification_level TEXT DEFAULT 'medium' CHECK (verification_level IN ('high', 'medium', 'low')),
    
    -- Risk Assessment
    comprehensive_risk_assessment JSONB DEFAULT '{}',
    requires_immediate_attention BOOLEAN DEFAULT FALSE,
    follow_up_required TEXT[] DEFAULT ARRAY[]::TEXT[],
    
    -- Metadata
    consolidated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Iteration Comparison Table for tracking differences
CREATE TABLE IF NOT EXISTS research_iteration_comparisons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID NOT NULL REFERENCES deep_research_jobs(id) ON DELETE CASCADE,
    iteration_1_id UUID NOT NULL REFERENCES deep_research_iterations(id) ON DELETE CASCADE,
    iteration_2_id UUID NOT NULL REFERENCES deep_research_iterations(id) ON DELETE CASCADE,
    
    -- Comparison Results
    differences JSONB NOT NULL DEFAULT '[]',
    confidence_improvement DECIMAL(5,4) DEFAULT 0.0,
    data_quality_improvement DECIMAL(5,4) DEFAULT 0.0,
    new_findings_count INTEGER DEFAULT 0,
    modified_findings_count INTEGER DEFAULT 0,
    removed_findings_count INTEGER DEFAULT 0,
    
    -- Analysis
    significance_level TEXT DEFAULT 'medium' CHECK (significance_level IN ('high', 'medium', 'low')),
    recommendation TEXT,
    
    -- Metadata
    compared_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Extend existing deep_research_jobs table with multi-iteration support
ALTER TABLE deep_research_jobs ADD COLUMN IF NOT EXISTS max_iterations INTEGER DEFAULT 1;
ALTER TABLE deep_research_jobs ADD COLUMN IF NOT EXISTS current_iteration INTEGER DEFAULT 1;
ALTER TABLE deep_research_jobs ADD COLUMN IF NOT EXISTS iteration_strategy TEXT DEFAULT 'single' CHECK (iteration_strategy IN ('single', 'multi', 'adaptive'));
ALTER TABLE deep_research_jobs ADD COLUMN IF NOT EXISTS consolidation_required BOOLEAN DEFAULT FALSE;
ALTER TABLE deep_research_jobs ADD COLUMN IF NOT EXISTS auto_consolidate BOOLEAN DEFAULT TRUE;

-- Extend existing deep_research_findings table with iteration support
ALTER TABLE deep_research_findings ADD COLUMN IF NOT EXISTS iteration_number INTEGER DEFAULT 1;
ALTER TABLE deep_research_findings ADD COLUMN IF NOT EXISTS iteration_id UUID REFERENCES deep_research_iterations(id) ON DELETE SET NULL;
ALTER TABLE deep_research_findings ADD COLUMN IF NOT EXISTS entity_focus JSONB DEFAULT '{}';
ALTER TABLE deep_research_findings ADD COLUMN IF NOT EXISTS comprehensive_analysis JSONB DEFAULT '{}';
ALTER TABLE deep_research_findings ADD COLUMN IF NOT EXISTS source_verification JSONB DEFAULT '{}';
ALTER TABLE deep_research_findings ADD COLUMN IF NOT EXISTS business_impact_detailed JSONB DEFAULT '{}';

-- Indexes for performance optimization
CREATE INDEX IF NOT EXISTS idx_deep_research_iterations_job_id ON deep_research_iterations(job_id);
CREATE INDEX IF NOT EXISTS idx_deep_research_iterations_iteration_number ON deep_research_iterations(iteration_number);
CREATE INDEX IF NOT EXISTS idx_deep_research_iterations_status ON deep_research_iterations(status);
CREATE INDEX IF NOT EXISTS idx_deep_research_iterations_created_at ON deep_research_iterations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_research_entity_analysis_job_id ON research_entity_analysis(job_id);
CREATE INDEX IF NOT EXISTS idx_research_entity_analysis_iteration_id ON research_entity_analysis(iteration_id);
CREATE INDEX IF NOT EXISTS idx_research_entity_analysis_entity_type ON research_entity_analysis(entity_type);
CREATE INDEX IF NOT EXISTS idx_research_entity_analysis_entity_identifier ON research_entity_analysis(entity_identifier);

CREATE INDEX IF NOT EXISTS idx_research_findings_consolidation_job_id ON research_findings_consolidation(job_id);
CREATE INDEX IF NOT EXISTS idx_research_iteration_comparisons_job_id ON research_iteration_comparisons(job_id);

-- RLS Policies for new tables
ALTER TABLE deep_research_iterations ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_entity_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_findings_consolidation ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_iteration_comparisons ENABLE ROW LEVEL SECURITY;

-- Policies for deep_research_iterations
CREATE POLICY "Users can view iterations for their jobs" ON deep_research_iterations
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM deep_research_jobs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage iterations" ON deep_research_iterations
    FOR ALL WITH CHECK (true);

-- Policies for research_entity_analysis
CREATE POLICY "Users can view entity analysis for their jobs" ON research_entity_analysis
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM deep_research_jobs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage entity analysis" ON research_entity_analysis
    FOR ALL WITH CHECK (true);

-- Policies for research_findings_consolidation
CREATE POLICY "Users can view consolidation for their jobs" ON research_findings_consolidation
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM deep_research_jobs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage consolidation" ON research_findings_consolidation
    FOR ALL WITH CHECK (true);

-- Policies for research_iteration_comparisons
CREATE POLICY "Users can view comparisons for their jobs" ON research_iteration_comparisons
    FOR SELECT USING (
        job_id IN (
            SELECT id FROM deep_research_jobs WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "System can manage comparisons" ON research_iteration_comparisons
    FOR ALL WITH CHECK (true);

-- Functions for multi-iteration management

-- Function to start a new research iteration
CREATE OR REPLACE FUNCTION start_research_iteration(
    job_id_param UUID,
    iteration_number_param INTEGER,
    research_type_param TEXT,
    research_focus_param JSONB DEFAULT '{}'
) RETURNS UUID AS $$
DECLARE
    iteration_id UUID;
BEGIN
    INSERT INTO deep_research_iterations (
        job_id,
        iteration_number,
        research_type,
        research_focus,
        status
    ) VALUES (
        job_id_param,
        iteration_number_param,
        research_type_param,
        research_focus_param,
        'pending'
    ) RETURNING id INTO iteration_id;
    
    -- Update job current iteration
    UPDATE deep_research_jobs 
    SET current_iteration = iteration_number_param,
        updated_at = NOW()
    WHERE id = job_id_param;
    
    RETURN iteration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to complete a research iteration
CREATE OR REPLACE FUNCTION complete_research_iteration(
    iteration_id_param UUID,
    findings_param JSONB,
    confidence_score_param DECIMAL DEFAULT 0.0,
    data_quality_score_param DECIMAL DEFAULT 0.0,
    tokens_used_param INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    UPDATE deep_research_iterations 
    SET 
        status = 'completed',
        findings = findings_param,
        confidence_score = confidence_score_param,
        data_quality_score = data_quality_score_param,
        tokens_used = tokens_used_param,
        completed_at = NOW(),
        updated_at = NOW()
    WHERE id = iteration_id_param;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to consolidate findings from multiple iterations
CREATE OR REPLACE FUNCTION consolidate_research_findings(
    job_id_param UUID,
    consolidation_strategy_param TEXT DEFAULT 'comprehensive'
) RETURNS UUID AS $$
DECLARE
    consolidation_id UUID;
    iterations_data JSONB;
    consolidated_data JSONB;
BEGIN
    -- Get all completed iterations for the job
    SELECT json_agg(
        json_build_object(
            'iteration_id', id,
            'iteration_number', iteration_number,
            'findings', findings,
            'confidence_score', confidence_score,
            'data_quality_score', data_quality_score
        )
    ) INTO iterations_data
    FROM deep_research_iterations
    WHERE job_id = job_id_param AND status = 'completed';
    
    -- Create consolidation record
    INSERT INTO research_findings_consolidation (
        job_id,
        consolidation_strategy,
        iterations_included,
        consolidated_findings
    ) 
    SELECT 
        job_id_param,
        consolidation_strategy_param,
        array_agg(iteration_number),
        iterations_data
    FROM deep_research_iterations
    WHERE job_id = job_id_param AND status = 'completed'
    RETURNING id INTO consolidation_id;
    
    -- Mark job as requiring consolidation complete
    UPDATE deep_research_jobs 
    SET consolidation_required = FALSE,
        updated_at = NOW()
    WHERE id = job_id_param;
    
    RETURN consolidation_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to compare two research iterations
CREATE OR REPLACE FUNCTION compare_research_iterations(
    iteration_1_id_param UUID,
    iteration_2_id_param UUID
) RETURNS UUID AS $$
DECLARE
    comparison_id UUID;
    job_id_val UUID;
    differences_data JSONB;
    confidence_diff DECIMAL;
    quality_diff DECIMAL;
BEGIN
    -- Get job_id from first iteration
    SELECT job_id INTO job_id_val
    FROM deep_research_iterations
    WHERE id = iteration_1_id_param;
    
    -- Calculate differences (simplified for now)
    SELECT 
        (i2.confidence_score - i1.confidence_score) as conf_diff,
        (i2.data_quality_score - i1.data_quality_score) as qual_diff
    INTO confidence_diff, quality_diff
    FROM deep_research_iterations i1
    JOIN deep_research_iterations i2 ON i2.id = iteration_2_id_param
    WHERE i1.id = iteration_1_id_param;
    
    -- Create comparison record
    INSERT INTO research_iteration_comparisons (
        job_id,
        iteration_1_id,
        iteration_2_id,
        confidence_improvement,
        data_quality_improvement,
        differences
    ) VALUES (
        job_id_val,
        iteration_1_id_param,
        iteration_2_id_param,
        confidence_diff,
        quality_diff,
        '[]'::jsonb -- Placeholder for detailed differences
    ) RETURNING id INTO comparison_id;
    
    RETURN comparison_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get multi-iteration research status
CREATE OR REPLACE FUNCTION get_multi_iteration_research_status(job_id_param UUID)
RETURNS TABLE (
    job_id UUID,
    current_iteration INTEGER,
    max_iterations INTEGER,
    completed_iterations INTEGER,
    pending_iterations INTEGER,
    overall_progress DECIMAL,
    consolidation_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        j.id as job_id,
        j.current_iteration,
        j.max_iterations,
        COUNT(CASE WHEN i.status = 'completed' THEN 1 END)::INTEGER as completed_iterations,
        COUNT(CASE WHEN i.status IN ('pending', 'running') THEN 1 END)::INTEGER as pending_iterations,
        CASE 
            WHEN j.max_iterations > 0 THEN 
                (COUNT(CASE WHEN i.status = 'completed' THEN 1 END)::DECIMAL / j.max_iterations * 100)
            ELSE 0 
        END as overall_progress,
        CASE 
            WHEN j.consolidation_required THEN 'required'
            WHEN EXISTS(SELECT 1 FROM research_findings_consolidation WHERE job_id = j.id) THEN 'completed'
            ELSE 'not_required'
        END as consolidation_status
    FROM deep_research_jobs j
    LEFT JOIN deep_research_iterations i ON i.job_id = j.id
    WHERE j.id = job_id_param
    GROUP BY j.id, j.current_iteration, j.max_iterations, j.consolidation_required;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update updated_at timestamp for new tables
CREATE TRIGGER update_deep_research_iterations_updated_at
    BEFORE UPDATE ON deep_research_iterations
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_entity_analysis_updated_at
    BEFORE UPDATE ON research_entity_analysis
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_research_findings_consolidation_updated_at
    BEFORE UPDATE ON research_findings_consolidation
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to cleanup old iteration data (optional)
CREATE OR REPLACE FUNCTION cleanup_old_research_iterations(days_old INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM deep_research_iterations 
    WHERE created_at < NOW() - INTERVAL '1 day' * days_old
    AND status IN ('completed', 'failed');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE deep_research_iterations IS 'Tracks individual research iterations for multi-iteration research jobs';
COMMENT ON TABLE research_entity_analysis IS 'Stores comprehensive analysis results for individual entities across iterations';
COMMENT ON TABLE research_findings_consolidation IS 'Consolidates findings from multiple research iterations';
COMMENT ON TABLE research_iteration_comparisons IS 'Tracks differences and improvements between research iterations';