-- Migration: Create portfolio_analytics table and synchronization procedures
-- This migration creates the analytics table and sync procedures

-- Create the portfolio_analytics table
CREATE TABLE IF NOT EXISTS portfolio_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR NOT NULL REFERENCES document_processing_requests(request_id),
  
  -- Company Basic Information
  company_name VARCHAR,
  industry industry_type,
  region VARCHAR,
  state VARCHAR,
  
  -- Risk Assessment Data
  risk_score DECIMAL(5,2),
  risk_grade VARCHAR(10),
  overall_percentage DECIMAL(5,2),
  risk_category INTEGER,
  risk_multiplier DECIMAL(4,2),
  model_id VARCHAR(50),
  model_type model_type,
  
  -- Category Scores
  financial_score DECIMAL(5,2),
  financial_max_score DECIMAL(5,2),
  financial_percentage DECIMAL(5,2),
  financial_count INTEGER,
  financial_total INTEGER,
  business_score DECIMAL(5,2),
  business_max_score DECIMAL(5,2),
  business_percentage DECIMAL(5,2),
  business_count INTEGER,
  business_total INTEGER,
  hygiene_score DECIMAL(5,2),
  hygiene_max_score DECIMAL(5,2),
  hygiene_percentage DECIMAL(5,2),
  hygiene_count INTEGER,
  hygiene_total INTEGER,
  banking_score DECIMAL(5,2),
  banking_max_score DECIMAL(5,2),
  banking_percentage DECIMAL(5,2),
  banking_count INTEGER,
  banking_total INTEGER,
  
  -- Individual Parameter Scores (Financial)
  sales_trend_score DECIMAL(5,2),
  sales_trend_value VARCHAR(50),
  sales_trend_benchmark VARCHAR(20),
  ebitda_margin_score DECIMAL(5,2),
  ebitda_margin_value DECIMAL(8,4),
  ebitda_margin_benchmark VARCHAR(20),
  finance_cost_score DECIMAL(5,2),
  finance_cost_value DECIMAL(8,4),
  finance_cost_benchmark VARCHAR(20),
  tol_tnw_score DECIMAL(5,2),
  tol_tnw_value DECIMAL(8,4),
  tol_tnw_benchmark VARCHAR(20),
  debt_equity_score DECIMAL(5,2),
  debt_equity_value DECIMAL(8,4),
  debt_equity_benchmark VARCHAR(20),
  interest_coverage_score DECIMAL(5,2),
  interest_coverage_value DECIMAL(8,4),
  interest_coverage_benchmark VARCHAR(20),
  roce_score DECIMAL(5,2),
  roce_value DECIMAL(8,4),
  roce_benchmark VARCHAR(20),
  inventory_days_score DECIMAL(5,2),
  inventory_days_value DECIMAL(8,2),
  inventory_days_benchmark VARCHAR(20),
  debtors_days_score DECIMAL(5,2),
  debtors_days_value DECIMAL(8,2),
  debtors_days_benchmark VARCHAR(20),
  creditors_days_score DECIMAL(5,2),
  creditors_days_value DECIMAL(8,2),
  creditors_days_benchmark VARCHAR(20),
  current_ratio_score DECIMAL(5,2),
  current_ratio_value DECIMAL(8,4),
  current_ratio_benchmark VARCHAR(20),
  quick_ratio_score DECIMAL(5,2),
  quick_ratio_value DECIMAL(8,4),
  quick_ratio_benchmark VARCHAR(20),
  pat_score DECIMAL(5,2),
  pat_value DECIMAL(8,4),
  pat_benchmark VARCHAR(20),
  ncatd_score DECIMAL(5,2),
  ncatd_value DECIMAL(8,4),
  ncatd_benchmark VARCHAR(20),
  diversion_funds_score DECIMAL(5,2),
  diversion_funds_value DECIMAL(8,4),
  diversion_funds_benchmark VARCHAR(20),
  
  -- Business Parameters
  constitution_entity_score DECIMAL(5,2),
  constitution_entity_value VARCHAR(100),
  constitution_entity_benchmark VARCHAR(20),
  rating_type_score DECIMAL(5,2),
  rating_type_value VARCHAR(100),
  rating_type_benchmark VARCHAR(20),
  vintage_score DECIMAL(5,2),
  vintage_value VARCHAR(50),
  vintage_benchmark VARCHAR(20),
  
  -- Hygiene Parameters
  gst_compliance_score DECIMAL(5,2),
  gst_compliance_value VARCHAR(100),
  gst_compliance_benchmark VARCHAR(20),
  pf_compliance_score DECIMAL(5,2),
  pf_compliance_value VARCHAR(100),
  pf_compliance_benchmark VARCHAR(20),
  recent_charges_score DECIMAL(5,2),
  recent_charges_value VARCHAR(100),
  recent_charges_benchmark VARCHAR(20),
  
  -- Banking Parameters
  primary_banker_score DECIMAL(5,2),
  primary_banker_value VARCHAR(100),
  primary_banker_benchmark VARCHAR(20),
  
  -- Financial Metrics (Latest Year - Extracted from Financial Data)
  revenue DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  total_assets DECIMAL(15,2),
  total_equity DECIMAL(15,2),
  current_assets DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  long_term_borrowings DECIMAL(15,2),
  short_term_borrowings DECIMAL(15,2),
  
  -- Credit Assessment
  recommended_limit DECIMAL(15,2),
  base_eligibility DECIMAL(15,2),
  final_eligibility DECIMAL(15,2),
  turnover_cr DECIMAL(10,2),
  net_worth_cr DECIMAL(10,2),
  
  -- Compliance Status (Derived)
  gst_compliance_status VARCHAR(20),
  gst_active_count INTEGER,
  epfo_compliance_status VARCHAR(20),
  epfo_establishment_count INTEGER,
  audit_qualification_status VARCHAR(20),
  
  -- Processing Information
  processing_status processing_status,
  completed_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT unique_request_analytics UNIQUE(request_id)
);

-- Create performance indexes
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_risk_grade ON portfolio_analytics(risk_grade);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_industry ON portfolio_analytics(industry);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_region ON portfolio_analytics(region);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_risk_score ON portfolio_analytics(risk_score);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_compliance ON portfolio_analytics(gst_compliance_status, epfo_compliance_status);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_financial ON portfolio_analytics(current_ratio_value, debt_equity_value, ebitda_margin_value);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_completed_at ON portfolio_analytics(completed_at);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_status ON portfolio_analytics(processing_status);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_company_name ON portfolio_analytics(company_name);

-- Composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_risk_industry ON portfolio_analytics(risk_grade, industry);
CREATE INDEX IF NOT EXISTS idx_portfolio_analytics_status_completed ON portfolio_analytics(processing_status, completed_at) WHERE processing_status = 'completed';-- 
Create sync error logging table
CREATE TABLE IF NOT EXISTS portfolio_analytics_sync_errors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id VARCHAR NOT NULL,
  error_type VARCHAR(50) NOT NULL,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  last_attempt TIMESTAMP DEFAULT NOW(),
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sync_errors_request_id ON portfolio_analytics_sync_errors(request_id);
CREATE INDEX IF NOT EXISTS idx_sync_errors_resolved ON portfolio_analytics_sync_errors(resolved, last_attempt);

-- Synchronization stored procedure
CREATE OR REPLACE FUNCTION sync_portfolio_analytics(p_request_id VARCHAR DEFAULT NULL)
RETURNS TABLE (
  synced_count INTEGER,
  error_count INTEGER,
  message TEXT
) AS $$
DECLARE
  rec RECORD;
  param_scores RECORD;
  financial_data RECORD;
  compliance_data RECORD;
  category_scores RECORD;
  sync_count INTEGER := 0;
  error_count INTEGER := 0;
  current_request_id VARCHAR;
BEGIN
  -- If specific request_id provided, sync only that record
  -- Otherwise sync all completed records that need updating
  FOR rec IN 
    SELECT 
      dpr.request_id,
      dpr.company_name,
      dpr.industry,
      dpr.risk_score,
      dpr.risk_grade,
      dpr.model_type,
      dpr.recommended_limit,
      dpr.status as processing_status,
      dpr.completed_at,
      dpr.extracted_data,
      dpr.risk_analysis,
      -- Extract region from extracted_data
      COALESCE(
        dpr.extracted_data->'about_company'->'registered_address'->>'state',
        dpr.extracted_data->'company_info'->'address'->>'state',
        'Unknown'
      ) as region,
      COALESCE(
        dpr.extracted_data->'about_company'->'registered_address'->>'state',
        dpr.extracted_data->'company_info'->'address'->>'state',
        'Unknown'
      ) as state
    FROM document_processing_requests dpr
    WHERE 
      (p_request_id IS NULL OR dpr.request_id = p_request_id)
      AND dpr.status = 'completed'
      AND dpr.risk_analysis IS NOT NULL
      AND (
        p_request_id IS NOT NULL 
        OR NOT EXISTS (
          SELECT 1 FROM portfolio_analytics pa 
          WHERE pa.request_id = dpr.request_id 
          AND pa.updated_at >= dpr.updated_at
        )
      )
  LOOP
    BEGIN
      current_request_id := rec.request_id;
      
      -- Extract parameter scores
      SELECT * INTO param_scores FROM extract_parameter_scores(rec.risk_analysis);
      
      -- Extract financial data
      SELECT * INTO financial_data FROM extract_financial_data(rec.extracted_data);
      
      -- Extract compliance status
      SELECT * INTO compliance_data FROM extract_compliance_status(rec.extracted_data);
      
      -- Extract category scores
      SELECT * INTO category_scores FROM extract_category_scores(rec.risk_analysis);
      
      -- Insert or update analytics record
      INSERT INTO portfolio_analytics (
        request_id,
        company_name,
        industry,
        region,
        state,
        risk_score,
        risk_grade,
        overall_percentage,
        risk_category,
        risk_multiplier,
        model_type,
        
        -- Category scores
        financial_score,
        financial_max_score,
        financial_percentage,
        financial_count,
        financial_total,
        business_score,
        business_max_score,
        business_percentage,
        business_count,
        business_total,
        hygiene_score,
        hygiene_max_score,
        hygiene_percentage,
        hygiene_count,
        hygiene_total,
        banking_score,
        banking_max_score,
        banking_percentage,
        banking_count,
        banking_total,
        
        -- Financial parameters
        sales_trend_score, sales_trend_value, sales_trend_benchmark,
        ebitda_margin_score, ebitda_margin_value, ebitda_margin_benchmark,
        finance_cost_score, finance_cost_value, finance_cost_benchmark,
        tol_tnw_score, tol_tnw_value, tol_tnw_benchmark,
        debt_equity_score, debt_equity_value, debt_equity_benchmark,
        interest_coverage_score, interest_coverage_value, interest_coverage_benchmark,
        roce_score, roce_value, roce_benchmark,
        inventory_days_score, inventory_days_value, inventory_days_benchmark,
        debtors_days_score, debtors_days_value, debtors_days_benchmark,
        creditors_days_score, creditors_days_value, creditors_days_benchmark,
        current_ratio_score, current_ratio_value, current_ratio_benchmark,
        quick_ratio_score, quick_ratio_value, quick_ratio_benchmark,
        pat_score, pat_value, pat_benchmark,
        ncatd_score, ncatd_value, ncatd_benchmark,
        diversion_funds_score, diversion_funds_value, diversion_funds_benchmark,
        
        -- Business parameters
        constitution_entity_score, constitution_entity_value, constitution_entity_benchmark,
        rating_type_score, rating_type_value, rating_type_benchmark,
        vintage_score, vintage_value, vintage_benchmark,
        
        -- Hygiene parameters
        gst_compliance_score, gst_compliance_value, gst_compliance_benchmark,
        pf_compliance_score, pf_compliance_value, pf_compliance_benchmark,
        recent_charges_score, recent_charges_value, recent_charges_benchmark,
        
        -- Banking parameters
        primary_banker_score, primary_banker_value, primary_banker_benchmark,
        
        -- Financial metrics
        revenue, ebitda, net_profit, total_assets, total_equity,
        current_assets, current_liabilities, long_term_borrowings, short_term_borrowings,
        
        -- Credit assessment
        recommended_limit,
        base_eligibility,
        final_eligibility,
        
        -- Compliance status
        gst_compliance_status,
        gst_active_count,
        epfo_compliance_status,
        epfo_establishment_count,
        audit_qualification_status,
        
        -- Processing info
        processing_status,
        completed_at,
        updated_at
      )
      VALUES (
        rec.request_id,
        rec.company_name,
        rec.industry,
        rec.region,
        rec.state,
        rec.risk_score,
        rec.risk_grade,
        (rec.risk_analysis->>'overallPercentage')::DECIMAL(5,2),
        (rec.risk_analysis->>'riskCategory')::INTEGER,
        (rec.risk_analysis->>'riskMultiplier')::DECIMAL(4,2),
        rec.model_type,
        
        -- Category scores
        category_scores.financial_score,
        category_scores.financial_max_score,
        category_scores.financial_percentage,
        category_scores.financial_count,
        category_scores.financial_total,
        category_scores.business_score,
        category_scores.business_max_score,
        category_scores.business_percentage,
        category_scores.business_count,
        category_scores.business_total,
        category_scores.hygiene_score,
        category_scores.hygiene_max_score,
        category_scores.hygiene_percentage,
        category_scores.hygiene_count,
        category_scores.hygiene_total,
        category_scores.banking_score,
        category_scores.banking_max_score,
        category_scores.banking_percentage,
        category_scores.banking_count,
        category_scores.banking_total,
        
        -- Financial parameters
        param_scores.sales_trend_score, param_scores.sales_trend_value, param_scores.sales_trend_benchmark,
        param_scores.ebitda_margin_score, param_scores.ebitda_margin_value, param_scores.ebitda_margin_benchmark,
        param_scores.finance_cost_score, param_scores.finance_cost_value, param_scores.finance_cost_benchmark,
        param_scores.tol_tnw_score, param_scores.tol_tnw_value, param_scores.tol_tnw_benchmark,
        param_scores.debt_equity_score, param_scores.debt_equity_value, param_scores.debt_equity_benchmark,
        param_scores.interest_coverage_score, param_scores.interest_coverage_value, param_scores.interest_coverage_benchmark,
        param_scores.roce_score, param_scores.roce_value, param_scores.roce_benchmark,
        param_scores.inventory_days_score, param_scores.inventory_days_value, param_scores.inventory_days_benchmark,
        param_scores.debtors_days_score, param_scores.debtors_days_value, param_scores.debtors_days_benchmark,
        param_scores.creditors_days_score, param_scores.creditors_days_value, param_scores.creditors_days_benchmark,
        param_scores.current_ratio_score, param_scores.current_ratio_value, param_scores.current_ratio_benchmark,
        param_scores.quick_ratio_score, param_scores.quick_ratio_value, param_scores.quick_ratio_benchmark,
        param_scores.pat_score, param_scores.pat_value, param_scores.pat_benchmark,
        param_scores.ncatd_score, param_scores.ncatd_value, param_scores.ncatd_benchmark,
        param_scores.diversion_funds_score, param_scores.diversion_funds_value, param_scores.diversion_funds_benchmark,
        
        -- Business parameters
        param_scores.constitution_entity_score, param_scores.constitution_entity_value, param_scores.constitution_entity_benchmark,
        param_scores.rating_type_score, param_scores.rating_type_value, param_scores.rating_type_benchmark,
        param_scores.vintage_score, param_scores.vintage_value, param_scores.vintage_benchmark,
        
        -- Hygiene parameters
        param_scores.gst_compliance_score, param_scores.gst_compliance_value, param_scores.gst_compliance_benchmark,
        param_scores.pf_compliance_score, param_scores.pf_compliance_value, param_scores.pf_compliance_benchmark,
        param_scores.recent_charges_score, param_scores.recent_charges_value, param_scores.recent_charges_benchmark,
        
        -- Banking parameters
        param_scores.primary_banker_score, param_scores.primary_banker_value, param_scores.primary_banker_benchmark,
        
        -- Financial metrics
        financial_data.revenue, financial_data.ebitda, financial_data.net_profit, 
        financial_data.total_assets, financial_data.total_equity,
        financial_data.current_assets, financial_data.current_liabilities, 
        financial_data.long_term_borrowings, financial_data.short_term_borrowings,
        
        -- Credit assessment
        rec.recommended_limit,
        (rec.risk_analysis->'eligibility'->>'baseEligibility')::DECIMAL(15,2),
        (rec.risk_analysis->'eligibility'->>'finalEligibility')::DECIMAL(15,2),
        
        -- Compliance status
        compliance_data.gst_compliance_status,
        compliance_data.gst_active_count,
        compliance_data.epfo_compliance_status,
        compliance_data.epfo_establishment_count,
        compliance_data.audit_qualification_status,
        
        -- Processing info
        rec.processing_status,
        rec.completed_at,
        NOW()
      )
      ON CONFLICT (request_id) 
      DO UPDATE SET
        company_name = EXCLUDED.company_name,
        industry = EXCLUDED.industry,
        region = EXCLUDED.region,
        state = EXCLUDED.state,
        risk_score = EXCLUDED.risk_score,
        risk_grade = EXCLUDED.risk_grade,
        overall_percentage = EXCLUDED.overall_percentage,
        risk_category = EXCLUDED.risk_category,
        risk_multiplier = EXCLUDED.risk_multiplier,
        model_type = EXCLUDED.model_type,
        
        -- Category scores
        financial_score = EXCLUDED.financial_score,
        financial_max_score = EXCLUDED.financial_max_score,
        financial_percentage = EXCLUDED.financial_percentage,
        financial_count = EXCLUDED.financial_count,
        financial_total = EXCLUDED.financial_total,
        business_score = EXCLUDED.business_score,
        business_max_score = EXCLUDED.business_max_score,
        business_percentage = EXCLUDED.business_percentage,
        business_count = EXCLUDED.business_count,
        business_total = EXCLUDED.business_total,
        hygiene_score = EXCLUDED.hygiene_score,
        hygiene_max_score = EXCLUDED.hygiene_max_score,
        hygiene_percentage = EXCLUDED.hygiene_percentage,
        hygiene_count = EXCLUDED.hygiene_count,
        hygiene_total = EXCLUDED.hygiene_total,
        banking_score = EXCLUDED.banking_score,
        banking_max_score = EXCLUDED.banking_max_score,
        banking_percentage = EXCLUDED.banking_percentage,
        banking_count = EXCLUDED.banking_count,
        banking_total = EXCLUDED.banking_total,
        
        -- All parameter scores
        sales_trend_score = EXCLUDED.sales_trend_score,
        sales_trend_value = EXCLUDED.sales_trend_value,
        sales_trend_benchmark = EXCLUDED.sales_trend_benchmark,
        ebitda_margin_score = EXCLUDED.ebitda_margin_score,
        ebitda_margin_value = EXCLUDED.ebitda_margin_value,
        ebitda_margin_benchmark = EXCLUDED.ebitda_margin_benchmark,
        finance_cost_score = EXCLUDED.finance_cost_score,
        finance_cost_value = EXCLUDED.finance_cost_value,
        finance_cost_benchmark = EXCLUDED.finance_cost_benchmark,
        tol_tnw_score = EXCLUDED.tol_tnw_score,
        tol_tnw_value = EXCLUDED.tol_tnw_value,
        tol_tnw_benchmark = EXCLUDED.tol_tnw_benchmark,
        debt_equity_score = EXCLUDED.debt_equity_score,
        debt_equity_value = EXCLUDED.debt_equity_value,
        debt_equity_benchmark = EXCLUDED.debt_equity_benchmark,
        interest_coverage_score = EXCLUDED.interest_coverage_score,
        interest_coverage_value = EXCLUDED.interest_coverage_value,
        interest_coverage_benchmark = EXCLUDED.interest_coverage_benchmark,
        roce_score = EXCLUDED.roce_score,
        roce_value = EXCLUDED.roce_value,
        roce_benchmark = EXCLUDED.roce_benchmark,
        inventory_days_score = EXCLUDED.inventory_days_score,
        inventory_days_value = EXCLUDED.inventory_days_value,
        inventory_days_benchmark = EXCLUDED.inventory_days_benchmark,
        debtors_days_score = EXCLUDED.debtors_days_score,
        debtors_days_value = EXCLUDED.debtors_days_value,
        debtors_days_benchmark = EXCLUDED.debtors_days_benchmark,
        creditors_days_score = EXCLUDED.creditors_days_score,
        creditors_days_value = EXCLUDED.creditors_days_value,
        creditors_days_benchmark = EXCLUDED.creditors_days_benchmark,
        current_ratio_score = EXCLUDED.current_ratio_score,
        current_ratio_value = EXCLUDED.current_ratio_value,
        current_ratio_benchmark = EXCLUDED.current_ratio_benchmark,
        quick_ratio_score = EXCLUDED.quick_ratio_score,
        quick_ratio_value = EXCLUDED.quick_ratio_value,
        quick_ratio_benchmark = EXCLUDED.quick_ratio_benchmark,
        pat_score = EXCLUDED.pat_score,
        pat_value = EXCLUDED.pat_value,
        pat_benchmark = EXCLUDED.pat_benchmark,
        ncatd_score = EXCLUDED.ncatd_score,
        ncatd_value = EXCLUDED.ncatd_value,
        ncatd_benchmark = EXCLUDED.ncatd_benchmark,
        diversion_funds_score = EXCLUDED.diversion_funds_score,
        diversion_funds_value = EXCLUDED.diversion_funds_value,
        diversion_funds_benchmark = EXCLUDED.diversion_funds_benchmark,
        constitution_entity_score = EXCLUDED.constitution_entity_score,
        constitution_entity_value = EXCLUDED.constitution_entity_value,
        constitution_entity_benchmark = EXCLUDED.constitution_entity_benchmark,
        rating_type_score = EXCLUDED.rating_type_score,
        rating_type_value = EXCLUDED.rating_type_value,
        rating_type_benchmark = EXCLUDED.rating_type_benchmark,
        vintage_score = EXCLUDED.vintage_score,
        vintage_value = EXCLUDED.vintage_value,
        vintage_benchmark = EXCLUDED.vintage_benchmark,
        gst_compliance_score = EXCLUDED.gst_compliance_score,
        gst_compliance_value = EXCLUDED.gst_compliance_value,
        gst_compliance_benchmark = EXCLUDED.gst_compliance_benchmark,
        pf_compliance_score = EXCLUDED.pf_compliance_score,
        pf_compliance_value = EXCLUDED.pf_compliance_value,
        pf_compliance_benchmark = EXCLUDED.pf_compliance_benchmark,
        recent_charges_score = EXCLUDED.recent_charges_score,
        recent_charges_value = EXCLUDED.recent_charges_value,
        recent_charges_benchmark = EXCLUDED.recent_charges_benchmark,
        primary_banker_score = EXCLUDED.primary_banker_score,
        primary_banker_value = EXCLUDED.primary_banker_value,
        primary_banker_benchmark = EXCLUDED.primary_banker_benchmark,
        
        -- Financial metrics
        revenue = EXCLUDED.revenue,
        ebitda = EXCLUDED.ebitda,
        net_profit = EXCLUDED.net_profit,
        total_assets = EXCLUDED.total_assets,
        total_equity = EXCLUDED.total_equity,
        current_assets = EXCLUDED.current_assets,
        current_liabilities = EXCLUDED.current_liabilities,
        long_term_borrowings = EXCLUDED.long_term_borrowings,
        short_term_borrowings = EXCLUDED.short_term_borrowings,
        
        -- Credit assessment
        recommended_limit = EXCLUDED.recommended_limit,
        base_eligibility = EXCLUDED.base_eligibility,
        final_eligibility = EXCLUDED.final_eligibility,
        
        -- Compliance status
        gst_compliance_status = EXCLUDED.gst_compliance_status,
        gst_active_count = EXCLUDED.gst_active_count,
        epfo_compliance_status = EXCLUDED.epfo_compliance_status,
        epfo_establishment_count = EXCLUDED.epfo_establishment_count,
        audit_qualification_status = EXCLUDED.audit_qualification_status,
        
        -- Processing info
        processing_status = EXCLUDED.processing_status,
        completed_at = EXCLUDED.completed_at,
        updated_at = NOW();
      
      sync_count := sync_count + 1;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error
        INSERT INTO portfolio_analytics_sync_errors (
          request_id,
          error_type,
          error_message,
          retry_count
        ) VALUES (
          current_request_id,
          'sync_failed',
          SQLERRM,
          1
        ) ON CONFLICT (request_id) 
        DO UPDATE SET
          error_message = EXCLUDED.error_message,
          retry_count = portfolio_analytics_sync_errors.retry_count + 1,
          last_attempt = NOW(),
          resolved = FALSE;
        
        error_count := error_count + 1;
        CONTINUE;
    END;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT 
    sync_count,
    error_count,
    CASE 
      WHEN error_count = 0 THEN 'Sync completed successfully'
      ELSE 'Sync completed with ' || error_count || ' errors'
    END;
END;
$$ LANGUAGE plpgsql;-- Fu
nction to validate analytics data consistency
CREATE OR REPLACE FUNCTION validate_analytics_data(p_request_id VARCHAR DEFAULT NULL)
RETURNS TABLE (
  request_id VARCHAR,
  validation_status VARCHAR,
  issues TEXT[]
) AS $$
DECLARE
  rec RECORD;
  issues_array TEXT[];
BEGIN
  FOR rec IN 
    SELECT 
      pa.request_id,
      pa.risk_score as analytics_risk_score,
      pa.risk_grade as analytics_risk_grade,
      pa.company_name as analytics_company_name,
      dpr.risk_score as main_risk_score,
      dpr.risk_grade as main_risk_grade,
      dpr.company_name as main_company_name,
      pa.updated_at as analytics_updated,
      dpr.updated_at as main_updated
    FROM portfolio_analytics pa
    JOIN document_processing_requests dpr ON pa.request_id = dpr.request_id
    WHERE (p_request_id IS NULL OR pa.request_id = p_request_id)
  LOOP
    issues_array := ARRAY[]::TEXT[];
    
    -- Check risk score consistency
    IF ABS(COALESCE(rec.analytics_risk_score, 0) - COALESCE(rec.main_risk_score, 0)) > 0.01 THEN
      issues_array := array_append(issues_array, 'Risk score mismatch');
    END IF;
    
    -- Check risk grade consistency
    IF rec.analytics_risk_grade != rec.main_risk_grade THEN
      issues_array := array_append(issues_array, 'Risk grade mismatch');
    END IF;
    
    -- Check company name consistency
    IF rec.analytics_company_name != rec.main_company_name THEN
      issues_array := array_append(issues_array, 'Company name mismatch');
    END IF;
    
    -- Check if analytics data is stale
    IF rec.analytics_updated < rec.main_updated THEN
      issues_array := array_append(issues_array, 'Analytics data is stale');
    END IF;
    
    -- Return validation result
    RETURN QUERY SELECT 
      rec.request_id,
      CASE 
        WHEN array_length(issues_array, 1) IS NULL THEN 'Valid'
        ELSE 'Invalid'
      END,
      issues_array;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Function to get analytics table status and health metrics
CREATE OR REPLACE FUNCTION get_analytics_table_status()
RETURNS TABLE (
  total_records INTEGER,
  synced_records INTEGER,
  pending_sync INTEGER,
  error_records INTEGER,
  last_sync_time TIMESTAMP,
  sync_coverage_percentage DECIMAL(5,2)
) AS $$
DECLARE
  total_completed INTEGER;
  total_analytics INTEGER;
  total_errors INTEGER;
  last_sync TIMESTAMP;
BEGIN
  -- Count total completed records in main table
  SELECT COUNT(*) INTO total_completed
  FROM document_processing_requests 
  WHERE status = 'completed' AND risk_analysis IS NOT NULL;
  
  -- Count records in analytics table
  SELECT COUNT(*) INTO total_analytics
  FROM portfolio_analytics;
  
  -- Count sync errors
  SELECT COUNT(*) INTO total_errors
  FROM portfolio_analytics_sync_errors
  WHERE resolved = FALSE;
  
  -- Get last sync time
  SELECT MAX(updated_at) INTO last_sync
  FROM portfolio_analytics;
  
  RETURN QUERY SELECT
    total_completed,
    total_analytics,
    total_completed - total_analytics,
    total_errors,
    last_sync,
    CASE 
      WHEN total_completed > 0 THEN (total_analytics::DECIMAL / total_completed * 100)
      ELSE 0
    END;
END;
$$ LANGUAGE plpgsql;