-- Enhanced Add Company Workflow - Manual Entry System
-- Migration: 024_create_manual_company_entry_system.sql

-- Create entity type enum for Indian business entities
CREATE TYPE entity_type_enum AS ENUM (
    'private_limited',
    'public_limited', 
    'llp',
    'partnership_registered',
    'partnership_unregistered',
    'proprietorship',
    'huf',
    'trust_private',
    'trust_public',
    'society'
);

-- Create data source enum
CREATE TYPE data_source_enum AS ENUM (
    'manual',
    'api',
    'excel',
    'hybrid'
);

-- Main manual company entries table
CREATE TABLE manual_company_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) UNIQUE NOT NULL,
    entity_type entity_type_enum NOT NULL,
    data_source data_source_enum DEFAULT 'manual',
    
    -- Basic company information
    basic_details JSONB NOT NULL DEFAULT '{}',
    
    -- Ownership structure (directors, partners, owners, etc.)
    ownership_structure JSONB DEFAULT '{}',
    
    -- Financial data in new non-corporate format
    financial_data JSONB DEFAULT '{}',
    
    -- Compliance data (GST, EPFO, Legal, Audit)
    compliance_data JSONB DEFAULT '{}',
    
    -- Data quality and completeness tracking
    data_completeness_score DECIMAL(5,2) DEFAULT 0.00,
    data_quality_indicators JSONB DEFAULT '{}',
    
    -- Processing status
    processing_status VARCHAR(50) DEFAULT 'draft',
    processing_notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Financial data table for non-corporate entities (new format)
CREATE TABLE non_corporate_financial_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) REFERENCES manual_company_entries(request_id) ON DELETE CASCADE,
    financial_year VARCHAR(10) NOT NULL,
    
    -- New vertical balance sheet format
    balance_sheet JSONB DEFAULT '{}',
    
    -- New P&L format with partners' remuneration
    profit_loss JSONB DEFAULT '{}',
    
    -- Optional cash flow statement
    cash_flow JSONB DEFAULT '{}',
    
    -- Calculated ratios
    ratios JSONB DEFAULT '{}',
    
    -- Financial notes and disclosures
    notes JSONB DEFAULT '{}',
    
    -- Data validation and quality
    validation_status VARCHAR(50) DEFAULT 'pending',
    validation_errors JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(request_id, financial_year)
);

-- GST data for manual entries
CREATE TABLE manual_gst_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) REFERENCES manual_company_entries(request_id) ON DELETE CASCADE,
    gstin VARCHAR(15) NOT NULL,
    
    -- Registration details
    registration_date DATE,
    registration_status VARCHAR(50),
    business_nature VARCHAR(100),
    
    -- Filing history and compliance
    filing_history JSONB DEFAULT '[]',
    compliance_status VARCHAR(50),
    compliance_score DECIMAL(5,2),
    
    -- Additional GST details
    turnover_details JSONB DEFAULT '{}',
    return_filing_status JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(request_id, gstin)
);

-- EPFO data for manual entries  
CREATE TABLE manual_epfo_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) REFERENCES manual_company_entries(request_id) ON DELETE CASCADE,
    
    -- Establishment details
    establishment_code VARCHAR(50),
    establishment_name VARCHAR(255),
    registration_date DATE,
    registration_status VARCHAR(50),
    
    -- Employee and contribution details
    employee_count INTEGER DEFAULT 0,
    active_members INTEGER DEFAULT 0,
    monthly_contribution_amount DECIMAL(15,2) DEFAULT 0.00,
    
    -- Compliance tracking
    compliance_status VARCHAR(50),
    compliance_score DECIMAL(5,2),
    contribution_history JSONB DEFAULT '[]',
    
    -- Additional EPFO details
    coverage_details JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legal and regulatory data
CREATE TABLE manual_legal_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) REFERENCES manual_company_entries(request_id) ON DELETE CASCADE,
    
    -- Legal cases and disputes
    legal_cases JSONB DEFAULT '[]',
    
    -- Regulatory compliance
    regulatory_compliance JSONB DEFAULT '{}',
    
    -- Licenses and permits
    licenses_permits JSONB DEFAULT '[]',
    
    -- Audit information
    audit_details JSONB DEFAULT '{}',
    auditor_comments JSONB DEFAULT '[]',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data enhancement tracking
CREATE TABLE data_enhancement_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id VARCHAR(255) REFERENCES manual_company_entries(request_id) ON DELETE CASCADE,
    
    -- Enhancement details
    enhancement_type VARCHAR(50) NOT NULL, -- 'api_overlay', 'excel_supplement', 'manual_update'
    data_source VARCHAR(50) NOT NULL,
    enhanced_fields JSONB DEFAULT '[]',
    
    -- Conflict resolution
    conflicts_detected JSONB DEFAULT '[]',
    conflicts_resolved JSONB DEFAULT '[]',
    resolution_method VARCHAR(50),
    
    -- Quality improvement
    quality_before DECIMAL(5,2),
    quality_after DECIMAL(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Indexes for performance
CREATE INDEX idx_manual_company_entries_request_id ON manual_company_entries(request_id);
CREATE INDEX idx_manual_company_entries_entity_type ON manual_company_entries(entity_type);
CREATE INDEX idx_manual_company_entries_created_by ON manual_company_entries(created_by);
CREATE INDEX idx_manual_company_entries_processing_status ON manual_company_entries(processing_status);

CREATE INDEX idx_non_corporate_financial_request_id ON non_corporate_financial_data(request_id);
CREATE INDEX idx_non_corporate_financial_year ON non_corporate_financial_data(financial_year);

CREATE INDEX idx_manual_gst_request_id ON manual_gst_data(request_id);
CREATE INDEX idx_manual_gst_gstin ON manual_gst_data(gstin);

CREATE INDEX idx_manual_epfo_request_id ON manual_epfo_data(request_id);
CREATE INDEX idx_manual_epfo_establishment ON manual_epfo_data(establishment_code);

CREATE INDEX idx_data_enhancement_request_id ON data_enhancement_log(request_id);
CREATE INDEX idx_data_enhancement_type ON data_enhancement_log(enhancement_type);

-- RLS Policies
ALTER TABLE manual_company_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE non_corporate_financial_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_gst_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_epfo_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE manual_legal_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_enhancement_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (users can only access their own data)
CREATE POLICY "Users can view their own manual entries" ON manual_company_entries
    FOR SELECT USING (auth.uid() = created_by);

CREATE POLICY "Users can insert their own manual entries" ON manual_company_entries
    FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Users can update their own manual entries" ON manual_company_entries
    FOR UPDATE USING (auth.uid() = created_by);

-- Similar policies for related tables
CREATE POLICY "Users can access their financial data" ON non_corporate_financial_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM manual_company_entries 
            WHERE manual_company_entries.request_id = non_corporate_financial_data.request_id 
            AND manual_company_entries.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can access their GST data" ON manual_gst_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM manual_company_entries 
            WHERE manual_company_entries.request_id = manual_gst_data.request_id 
            AND manual_company_entries.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can access their EPFO data" ON manual_epfo_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM manual_company_entries 
            WHERE manual_company_entries.request_id = manual_epfo_data.request_id 
            AND manual_company_entries.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can access their legal data" ON manual_legal_data
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM manual_company_entries 
            WHERE manual_company_entries.request_id = manual_legal_data.request_id 
            AND manual_company_entries.created_by = auth.uid()
        )
    );

CREATE POLICY "Users can access their enhancement log" ON data_enhancement_log
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM manual_company_entries 
            WHERE manual_company_entries.request_id = data_enhancement_log.request_id 
            AND manual_company_entries.created_by = auth.uid()
        )
    );

-- Functions for data quality calculation
CREATE OR REPLACE FUNCTION calculate_data_completeness_score(entry_data JSONB)
RETURNS DECIMAL(5,2) AS $$
DECLARE
    total_fields INTEGER := 0;
    completed_fields INTEGER := 0;
    score DECIMAL(5,2);
BEGIN
    -- Basic details scoring (40% weight)
    total_fields := total_fields + 10;
    IF entry_data->'basic_details'->>'legal_name' IS NOT NULL AND entry_data->'basic_details'->>'legal_name' != '' THEN
        completed_fields := completed_fields + 1;
    END IF;
    IF entry_data->'basic_details'->>'entity_type' IS NOT NULL THEN
        completed_fields := completed_fields + 1;
    END IF;
    -- Add more basic field checks...
    
    -- Financial data scoring (30% weight)
    total_fields := total_fields + 8;
    IF entry_data->'financial_data' IS NOT NULL AND jsonb_array_length(entry_data->'financial_data'->'years') > 0 THEN
        completed_fields := completed_fields + 4;
    END IF;
    -- Add more financial field checks...
    
    -- Compliance data scoring (20% weight)
    total_fields := total_fields + 6;
    IF entry_data->'compliance_data'->'gst_data' IS NOT NULL THEN
        completed_fields := completed_fields + 2;
    END IF;
    -- Add more compliance field checks...
    
    -- Ownership data scoring (10% weight)
    total_fields := total_fields + 4;
    IF entry_data->'ownership_structure' IS NOT NULL THEN
        completed_fields := completed_fields + 2;
    END IF;
    -- Add more ownership field checks...
    
    -- Calculate percentage score
    IF total_fields > 0 THEN
        score := (completed_fields::DECIMAL / total_fields::DECIMAL) * 100;
    ELSE
        score := 0;
    END IF;
    
    RETURN ROUND(score, 2);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update completeness score
CREATE OR REPLACE FUNCTION update_completeness_score()
RETURNS TRIGGER AS $$
BEGIN
    NEW.data_completeness_score := calculate_data_completeness_score(
        jsonb_build_object(
            'basic_details', NEW.basic_details,
            'ownership_structure', NEW.ownership_structure,
            'financial_data', NEW.financial_data,
            'compliance_data', NEW.compliance_data
        )
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_completeness_score
    BEFORE INSERT OR UPDATE ON manual_company_entries
    FOR EACH ROW EXECUTE FUNCTION update_completeness_score();

-- Function to generate unique request IDs
CREATE OR REPLACE FUNCTION generate_manual_request_id()
RETURNS VARCHAR(255) AS $$
DECLARE
    new_id VARCHAR(255);
    counter INTEGER := 0;
BEGIN
    LOOP
        new_id := 'MAN_' || TO_CHAR(NOW(), 'YYYYMMDD') || '_' || LPAD((EXTRACT(EPOCH FROM NOW())::BIGINT % 100000)::TEXT, 5, '0');
        
        -- Check if ID already exists
        IF NOT EXISTS (SELECT 1 FROM manual_company_entries WHERE request_id = new_id) THEN
            EXIT;
        END IF;
        
        counter := counter + 1;
        IF counter > 100 THEN
            -- Fallback to UUID if we can't generate unique ID
            new_id := 'MAN_' || REPLACE(gen_random_uuid()::TEXT, '-', '');
            EXIT;
        END IF;
    END LOOP;
    
    RETURN new_id;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE manual_company_entries IS 'Stores manually entered company data for non-API eligible entities';
COMMENT ON TABLE non_corporate_financial_data IS 'Financial statements in new non-corporate format (FY 2024-25)';
COMMENT ON TABLE manual_gst_data IS 'GST registration and compliance data for manual entries';
COMMENT ON TABLE manual_epfo_data IS 'EPFO establishment and compliance data for manual entries';
COMMENT ON TABLE manual_legal_data IS 'Legal cases, regulatory compliance, and audit information';
COMMENT ON TABLE data_enhancement_log IS 'Tracks data enhancements and quality improvements over time';