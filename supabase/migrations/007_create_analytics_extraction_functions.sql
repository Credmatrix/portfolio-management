-- Migration: Create data extraction functions for analytics table
-- This migration creates functions to extract and flatten data from JSONB fields

-- Function to extract parameter scores from risk_analysis JSONB
CREATE OR REPLACE FUNCTION extract_parameter_scores(risk_analysis JSONB)
RETURNS TABLE (
  -- Financial Parameters
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
  primary_banker_benchmark VARCHAR(20)
) AS $$
DECLARE
  param_record JSONB;
  param_name TEXT;
  param_value TEXT;
  param_score TEXT;
  param_benchmark TEXT;
BEGIN
  -- Initialize all values to NULL
  sales_trend_score := NULL;
  sales_trend_value := NULL;
  sales_trend_benchmark := NULL;
  ebitda_margin_score := NULL;
  ebitda_margin_value := NULL;
  ebitda_margin_benchmark := NULL;
  finance_cost_score := NULL;
  finance_cost_value := NULL;
  finance_cost_benchmark := NULL;
  tol_tnw_score := NULL;
  tol_tnw_value := NULL;
  tol_tnw_benchmark := NULL;
  debt_equity_score := NULL;
  debt_equity_value := NULL;
  debt_equity_benchmark := NULL;
  interest_coverage_score := NULL;
  interest_coverage_value := NULL;
  interest_coverage_benchmark := NULL;
  roce_score := NULL;
  roce_value := NULL;
  roce_benchmark := NULL;
  inventory_days_score := NULL;
  inventory_days_value := NULL;
  inventory_days_benchmark := NULL;
  debtors_days_score := NULL;
  debtors_days_value := NULL;
  debtors_days_benchmark := NULL;
  creditors_days_score := NULL;
  creditors_days_value := NULL;
  creditors_days_benchmark := NULL;
  current_ratio_score := NULL;
  current_ratio_value := NULL;
  current_ratio_benchmark := NULL;
  quick_ratio_score := NULL;
  quick_ratio_value := NULL;
  quick_ratio_benchmark := NULL;
  pat_score := NULL;
  pat_value := NULL;
  pat_benchmark := NULL;
  ncatd_score := NULL;
  ncatd_value := NULL;
  ncatd_benchmark := NULL;
  diversion_funds_score := NULL;
  diversion_funds_value := NULL;
  diversion_funds_benchmark := NULL;
  constitution_entity_score := NULL;
  constitution_entity_value := NULL;
  constitution_entity_benchmark := NULL;
  rating_type_score := NULL;
  rating_type_value := NULL;
  rating_type_benchmark := NULL;
  vintage_score := NULL;
  vintage_value := NULL;
  vintage_benchmark := NULL;
  gst_compliance_score := NULL;
  gst_compliance_value := NULL;
  gst_compliance_benchmark := NULL;
  pf_compliance_score := NULL;
  pf_compliance_value := NULL;
  pf_compliance_benchmark := NULL;
  recent_charges_score := NULL;
  recent_charges_value := NULL;
  recent_charges_benchmark := NULL;
  primary_banker_score := NULL;
  primary_banker_value := NULL;
  primary_banker_benchmark := NULL;
  
  -- Handle case where risk_analysis is NULL or doesn't have allScores
  IF risk_analysis IS NULL OR risk_analysis->'allScores' IS NULL THEN
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Loop through allScores array to extract parameter data
  FOR param_record IN SELECT jsonb_array_elements(risk_analysis->'allScores')
  LOOP
    BEGIN
      param_name := param_record->>'parameter';
      param_score := param_record->>'score';
      param_value := param_record->>'value';
      param_benchmark := param_record->>'benchmark';
      
      CASE param_name
        WHEN 'Sales Trend' THEN
          sales_trend_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          sales_trend_value := param_value;
          sales_trend_benchmark := param_benchmark;
        WHEN 'EBITDA Margin' THEN
          ebitda_margin_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          ebitda_margin_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(REPLACE(param_value, '%', ''), ' ', '')::DECIMAL(8,4) ELSE NULL END;
          ebitda_margin_benchmark := param_benchmark;
        WHEN 'Finance Cost as % of Revenue' THEN
          finance_cost_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          finance_cost_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(REPLACE(param_value, '%', ''), ' ', '')::DECIMAL(8,4) ELSE NULL END;
          finance_cost_benchmark := param_benchmark;
        WHEN 'TOL/TNW (Total Outside Liabilities / Tangible Net Worth)' THEN
          tol_tnw_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          tol_tnw_value := CASE WHEN param_value IS NOT NULL THEN param_value::DECIMAL(8,4) ELSE NULL END;
          tol_tnw_benchmark := param_benchmark;
        WHEN 'D/E Ratio' THEN
          debt_equity_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          debt_equity_value := CASE WHEN param_value IS NOT NULL THEN param_value::DECIMAL(8,4) ELSE NULL END;
          debt_equity_benchmark := param_benchmark;
        WHEN 'Interest Coverage Ratio' THEN
          interest_coverage_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          interest_coverage_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(param_value, 'x', '')::DECIMAL(8,4) ELSE NULL END;
          interest_coverage_benchmark := param_benchmark;
        WHEN 'ROCE (Return on Capital Employed)' THEN
          roce_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          roce_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(REPLACE(param_value, '%', ''), ' ', '')::DECIMAL(8,4) ELSE NULL END;
          roce_benchmark := param_benchmark;
        WHEN 'Inventory Holding Days' THEN
          inventory_days_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          inventory_days_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(param_value, ' days', '')::DECIMAL(8,2) ELSE NULL END;
          inventory_days_benchmark := param_benchmark;
        WHEN 'Debtors Holding Days' THEN
          debtors_days_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          debtors_days_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(param_value, ' days', '')::DECIMAL(8,2) ELSE NULL END;
          debtors_days_benchmark := param_benchmark;
        WHEN 'Creditors Holding Days' THEN
          creditors_days_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          creditors_days_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(param_value, ' days', '')::DECIMAL(8,2) ELSE NULL END;
          creditors_days_benchmark := param_benchmark;
        WHEN 'Current Ratio' THEN
          current_ratio_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          current_ratio_value := CASE WHEN param_value IS NOT NULL THEN param_value::DECIMAL(8,4) ELSE NULL END;
          current_ratio_benchmark := param_benchmark;
        WHEN 'Quick Ratio' THEN
          quick_ratio_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          quick_ratio_value := CASE WHEN param_value IS NOT NULL THEN param_value::DECIMAL(8,4) ELSE NULL END;
          quick_ratio_benchmark := param_benchmark;
        WHEN 'PAT' THEN
          pat_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          pat_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(REPLACE(param_value, '%', ''), ' ', '')::DECIMAL(8,4) ELSE NULL END;
          pat_benchmark := param_benchmark;
        WHEN 'NCATD' THEN
          ncatd_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          ncatd_value := CASE WHEN param_value IS NOT NULL THEN param_value::DECIMAL(8,4) ELSE NULL END;
          ncatd_benchmark := param_benchmark;
        WHEN 'Diversion of Funds' THEN
          diversion_funds_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          diversion_funds_value := CASE WHEN param_value IS NOT NULL THEN 
            REPLACE(REPLACE(param_value, '%', ''), ' ', '')::DECIMAL(8,4) ELSE NULL END;
          diversion_funds_benchmark := param_benchmark;
        WHEN 'Constitution of Entity' THEN
          constitution_entity_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          constitution_entity_value := param_value;
          constitution_entity_benchmark := param_benchmark;
        WHEN 'Rating Type' THEN
          rating_type_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          rating_type_value := param_value;
          rating_type_benchmark := param_benchmark;
        WHEN 'Managerial / Promoter Vintage' THEN
          vintage_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          vintage_value := param_value;
          vintage_benchmark := param_benchmark;
        WHEN 'Statutory Payments (GST)' THEN
          gst_compliance_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          gst_compliance_value := param_value;
          gst_compliance_benchmark := param_benchmark;
        WHEN 'Statutory Payments (PF)' THEN
          pf_compliance_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          pf_compliance_value := param_value;
          pf_compliance_benchmark := param_benchmark;
        WHEN 'Recent Charges by Bankers' THEN
          recent_charges_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          recent_charges_value := param_value;
          recent_charges_benchmark := param_benchmark;
        WHEN 'Primary Banker - Limit Funded' THEN
          primary_banker_score := CASE WHEN param_score IS NOT NULL THEN param_score::DECIMAL(5,2) ELSE NULL END;
          primary_banker_value := param_value;
          primary_banker_benchmark := param_benchmark;
      END CASE;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue processing other parameters
        RAISE NOTICE 'Error processing parameter %: %', param_name, SQLERRM;
        CONTINUE;
    END;
  END LOOP;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;
-- F
unction to extract financial metrics from extracted_data JSONB
CREATE OR REPLACE FUNCTION extract_financial_data(extracted_data JSONB)
RETURNS TABLE (
  revenue DECIMAL(15,2),
  ebitda DECIMAL(15,2),
  net_profit DECIMAL(15,2),
  total_assets DECIMAL(15,2),
  total_equity DECIMAL(15,2),
  current_assets DECIMAL(15,2),
  current_liabilities DECIMAL(15,2),
  long_term_borrowings DECIMAL(15,2),
  short_term_borrowings DECIMAL(15,2)
) AS $$
DECLARE
  financial_data JSONB;
  latest_year_data JSONB;
  years_array JSONB;
  latest_year TEXT;
BEGIN
  -- Initialize all values to NULL
  revenue := NULL;
  ebitda := NULL;
  net_profit := NULL;
  total_assets := NULL;
  total_equity := NULL;
  current_assets := NULL;
  current_liabilities := NULL;
  long_term_borrowings := NULL;
  short_term_borrowings := NULL;
  
  -- Handle case where extracted_data is NULL
  IF extracted_data IS NULL THEN
    RETURN NEXT;
    RETURN;
  END IF;
  
  BEGIN
    -- Try to extract financial data from various possible structures
    financial_data := extracted_data->'financial_data';
    
    IF financial_data IS NULL THEN
      financial_data := extracted_data->'financials';
    END IF;
    
    IF financial_data IS NULL THEN
      RETURN NEXT;
      RETURN;
    END IF;
    
    -- Try to get the latest year data
    -- First try to get years array and pick the last one
    IF financial_data->'years' IS NOT NULL THEN
      years_array := financial_data->'years';
      IF jsonb_array_length(years_array) > 0 THEN
        latest_year := (years_array->-1)::TEXT;
        latest_year := REPLACE(latest_year, '"', '');
      END IF;
    END IF;
    
    -- Extract revenue (try multiple possible paths)
    IF latest_year IS NOT NULL THEN
      revenue := COALESCE(
        (financial_data->'profit_loss'->'revenue'->latest_year)::DECIMAL(15,2),
        (financial_data->'income_statement'->'revenue'->latest_year)::DECIMAL(15,2),
        (financial_data->'pnl'->'revenue'->latest_year)::DECIMAL(15,2)
      );
    ELSE
      revenue := COALESCE(
        (financial_data->'profit_loss'->'revenue'->-1)::DECIMAL(15,2),
        (financial_data->'income_statement'->'revenue'->-1)::DECIMAL(15,2),
        (financial_data->'pnl'->'revenue'->-1)::DECIMAL(15,2)
      );
    END IF;
    
    -- Extract EBITDA
    IF latest_year IS NOT NULL THEN
      ebitda := COALESCE(
        (financial_data->'profit_loss'->'ebitda'->latest_year)::DECIMAL(15,2),
        (financial_data->'income_statement'->'ebitda'->latest_year)::DECIMAL(15,2),
        (financial_data->'pnl'->'ebitda'->latest_year)::DECIMAL(15,2)
      );
    ELSE
      ebitda := COALESCE(
        (financial_data->'profit_loss'->'ebitda'->-1)::DECIMAL(15,2),
        (financial_data->'income_statement'->'ebitda'->-1)::DECIMAL(15,2),
        (financial_data->'pnl'->'ebitda'->-1)::DECIMAL(15,2)
      );
    END IF;
    
    -- Extract Net Profit
    IF latest_year IS NOT NULL THEN
      net_profit := COALESCE(
        (financial_data->'profit_loss'->'net_profit'->latest_year)::DECIMAL(15,2),
        (financial_data->'income_statement'->'net_profit'->latest_year)::DECIMAL(15,2),
        (financial_data->'pnl'->'net_profit'->latest_year)::DECIMAL(15,2),
        (financial_data->'profit_loss'->'pat'->latest_year)::DECIMAL(15,2)
      );
    ELSE
      net_profit := COALESCE(
        (financial_data->'profit_loss'->'net_profit'->-1)::DECIMAL(15,2),
        (financial_data->'income_statement'->'net_profit'->-1)::DECIMAL(15,2),
        (financial_data->'pnl'->'net_profit'->-1)::DECIMAL(15,2),
        (financial_data->'profit_loss'->'pat'->-1)::DECIMAL(15,2)
      );
    END IF;
    
    -- Extract Balance Sheet data
    IF latest_year IS NOT NULL THEN
      total_assets := COALESCE(
        (financial_data->'balance_sheet'->'assets'->'total_assets'->latest_year)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'total_assets'->latest_year)::DECIMAL(15,2)
      );
      
      total_equity := COALESCE(
        (financial_data->'balance_sheet'->'equity'->'total_equity'->latest_year)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'shareholders_equity'->latest_year)::DECIMAL(15,2)
      );
      
      current_assets := COALESCE(
        (financial_data->'balance_sheet'->'assets'->'current_assets'->latest_year)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'current_assets'->latest_year)::DECIMAL(15,2)
      );
      
      current_liabilities := COALESCE(
        (financial_data->'balance_sheet'->'liabilities'->'current_liabilities'->latest_year)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'current_liabilities'->latest_year)::DECIMAL(15,2)
      );
      
      long_term_borrowings := COALESCE(
        (financial_data->'balance_sheet'->'liabilities'->'long_term_borrowings'->latest_year)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'long_term_debt'->latest_year)::DECIMAL(15,2)
      );
      
      short_term_borrowings := COALESCE(
        (financial_data->'balance_sheet'->'liabilities'->'short_term_borrowings'->latest_year)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'short_term_debt'->latest_year)::DECIMAL(15,2)
      );
    ELSE
      total_assets := COALESCE(
        (financial_data->'balance_sheet'->'assets'->'total_assets'->-1)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'total_assets'->-1)::DECIMAL(15,2)
      );
      
      total_equity := COALESCE(
        (financial_data->'balance_sheet'->'equity'->'total_equity'->-1)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'shareholders_equity'->-1)::DECIMAL(15,2)
      );
      
      current_assets := COALESCE(
        (financial_data->'balance_sheet'->'assets'->'current_assets'->-1)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'current_assets'->-1)::DECIMAL(15,2)
      );
      
      current_liabilities := COALESCE(
        (financial_data->'balance_sheet'->'liabilities'->'current_liabilities'->-1)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'current_liabilities'->-1)::DECIMAL(15,2)
      );
      
      long_term_borrowings := COALESCE(
        (financial_data->'balance_sheet'->'liabilities'->'long_term_borrowings'->-1)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'long_term_debt'->-1)::DECIMAL(15,2)
      );
      
      short_term_borrowings := COALESCE(
        (financial_data->'balance_sheet'->'liabilities'->'short_term_borrowings'->-1)::DECIMAL(15,2),
        (financial_data->'balance_sheet'->'short_term_debt'->-1)::DECIMAL(15,2)
      );
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but return NULL values
      RAISE NOTICE 'Error extracting financial data: %', SQLERRM;
  END;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;-- Fun
ction to extract compliance status from extracted_data JSONB
CREATE OR REPLACE FUNCTION extract_compliance_status(extracted_data JSONB)
RETURNS TABLE (
  gst_compliance_status VARCHAR(20),
  gst_active_count INTEGER,
  epfo_compliance_status VARCHAR(20),
  epfo_establishment_count INTEGER,
  audit_qualification_status VARCHAR(20)
) AS $$
DECLARE
  gst_data JSONB;
  epfo_data JSONB;
  audit_data JSONB;
BEGIN
  -- Initialize default values
  gst_compliance_status := 'Unknown';
  gst_active_count := 0;
  epfo_compliance_status := 'Unknown';
  epfo_establishment_count := 0;
  audit_qualification_status := 'Unknown';
  
  -- Handle case where extracted_data is NULL
  IF extracted_data IS NULL THEN
    RETURN NEXT;
    RETURN;
  END IF;
  
  BEGIN
    -- Extract GST compliance data
    gst_data := COALESCE(
      extracted_data->'gst_records',
      extracted_data->'gst_data',
      extracted_data->'gst'
    );
    
    IF gst_data IS NOT NULL THEN
      -- Count active GST registrations
      IF gst_data->'active_gstins' IS NOT NULL THEN
        gst_active_count := jsonb_array_length(gst_data->'active_gstins');
      ELSIF gst_data->'registrations' IS NOT NULL THEN
        gst_active_count := jsonb_array_length(gst_data->'registrations');
      END IF;
      
      -- Determine GST compliance status
      IF gst_active_count > 0 THEN
        gst_compliance_status := 'Regular';
      ELSE
        gst_compliance_status := 'Inactive';
      END IF;
    END IF;
    
    -- Extract EPFO compliance data
    epfo_data := COALESCE(
      extracted_data->'epfo_records',
      extracted_data->'epfo_data',
      extracted_data->'epfo'
    );
    
    IF epfo_data IS NOT NULL THEN
      -- Count EPFO establishments
      IF epfo_data->'establishments' IS NOT NULL THEN
        epfo_establishment_count := jsonb_array_length(epfo_data->'establishments');
      ELSIF epfo_data->'establishment_details' IS NOT NULL THEN
        epfo_establishment_count := jsonb_array_length(epfo_data->'establishment_details');
      END IF;
      
      -- Determine EPFO compliance status
      IF epfo_establishment_count > 0 THEN
        epfo_compliance_status := 'Regular';
      ELSE
        epfo_compliance_status := 'Not Registered';
      END IF;
    END IF;
    
    -- Extract audit qualification status
    audit_data := COALESCE(
      extracted_data->'audit_qualifications',
      extracted_data->'audit_data',
      extracted_data->'auditor_comments'
    );
    
    IF audit_data IS NOT NULL THEN
      IF jsonb_array_length(COALESCE(audit_data, '[]'::jsonb)) > 0 THEN
        audit_qualification_status := 'Qualified';
      ELSE
        audit_qualification_status := 'Unqualified';
      END IF;
    END IF;
    
  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but return default values
      RAISE NOTICE 'Error extracting compliance status: %', SQLERRM;
  END;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;--
 Function to extract category scores from risk_analysis JSONB
CREATE OR REPLACE FUNCTION extract_category_scores(risk_analysis JSONB)
RETURNS TABLE (
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
  banking_total INTEGER
) AS $$
DECLARE
  category_record JSONB;
  category_name TEXT;
BEGIN
  -- Initialize all values to NULL
  financial_score := NULL;
  financial_max_score := NULL;
  financial_percentage := NULL;
  financial_count := NULL;
  financial_total := NULL;
  business_score := NULL;
  business_max_score := NULL;
  business_percentage := NULL;
  business_count := NULL;
  business_total := NULL;
  hygiene_score := NULL;
  hygiene_max_score := NULL;
  hygiene_percentage := NULL;
  hygiene_count := NULL;
  hygiene_total := NULL;
  banking_score := NULL;
  banking_max_score := NULL;
  banking_percentage := NULL;
  banking_count := NULL;
  banking_total := NULL;
  
  -- Handle case where risk_analysis is NULL or doesn't have categoryScores
  IF risk_analysis IS NULL OR risk_analysis->'categoryScores' IS NULL THEN
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Loop through categoryScores array to extract category data
  FOR category_record IN SELECT jsonb_array_elements(risk_analysis->'categoryScores')
  LOOP
    BEGIN
      category_name := LOWER(category_record->>'category');
      
      CASE category_name
        WHEN 'financial' THEN
          financial_score := CASE WHEN category_record->>'score' IS NOT NULL THEN 
            (category_record->>'score')::DECIMAL(5,2) ELSE NULL END;
          financial_max_score := CASE WHEN category_record->>'maxScore' IS NOT NULL THEN 
            (category_record->>'maxScore')::DECIMAL(5,2) ELSE NULL END;
          financial_percentage := CASE WHEN category_record->>'percentage' IS NOT NULL THEN 
            (category_record->>'percentage')::DECIMAL(5,2) ELSE NULL END;
          financial_count := CASE WHEN category_record->>'count' IS NOT NULL THEN 
            (category_record->>'count')::INTEGER ELSE NULL END;
          financial_total := CASE WHEN category_record->>'total' IS NOT NULL THEN 
            (category_record->>'total')::INTEGER ELSE NULL END;
            
        WHEN 'business' THEN
          business_score := CASE WHEN category_record->>'score' IS NOT NULL THEN 
            (category_record->>'score')::DECIMAL(5,2) ELSE NULL END;
          business_max_score := CASE WHEN category_record->>'maxScore' IS NOT NULL THEN 
            (category_record->>'maxScore')::DECIMAL(5,2) ELSE NULL END;
          business_percentage := CASE WHEN category_record->>'percentage' IS NOT NULL THEN 
            (category_record->>'percentage')::DECIMAL(5,2) ELSE NULL END;
          business_count := CASE WHEN category_record->>'count' IS NOT NULL THEN 
            (category_record->>'count')::INTEGER ELSE NULL END;
          business_total := CASE WHEN category_record->>'total' IS NOT NULL THEN 
            (category_record->>'total')::INTEGER ELSE NULL END;
            
        WHEN 'hygiene' THEN
          hygiene_score := CASE WHEN category_record->>'score' IS NOT NULL THEN 
            (category_record->>'score')::DECIMAL(5,2) ELSE NULL END;
          hygiene_max_score := CASE WHEN category_record->>'maxScore' IS NOT NULL THEN 
            (category_record->>'maxScore')::DECIMAL(5,2) ELSE NULL END;
          hygiene_percentage := CASE WHEN category_record->>'percentage' IS NOT NULL THEN 
            (category_record->>'percentage')::DECIMAL(5,2) ELSE NULL END;
          hygiene_count := CASE WHEN category_record->>'count' IS NOT NULL THEN 
            (category_record->>'count')::INTEGER ELSE NULL END;
          hygiene_total := CASE WHEN category_record->>'total' IS NOT NULL THEN 
            (category_record->>'total')::INTEGER ELSE NULL END;
            
        WHEN 'banking' THEN
          banking_score := CASE WHEN category_record->>'score' IS NOT NULL THEN 
            (category_record->>'score')::DECIMAL(5,2) ELSE NULL END;
          banking_max_score := CASE WHEN category_record->>'maxScore' IS NOT NULL THEN 
            (category_record->>'maxScore')::DECIMAL(5,2) ELSE NULL END;
          banking_percentage := CASE WHEN category_record->>'percentage' IS NOT NULL THEN 
            (category_record->>'percentage')::DECIMAL(5,2) ELSE NULL END;
          banking_count := CASE WHEN category_record->>'count' IS NOT NULL THEN 
            (category_record->>'count')::INTEGER ELSE NULL END;
          banking_total := CASE WHEN category_record->>'total' IS NOT NULL THEN 
            (category_record->>'total')::INTEGER ELSE NULL END;
      END CASE;
      
    EXCEPTION
      WHEN OTHERS THEN
        -- Log error but continue processing other categories
        RAISE NOTICE 'Error processing category %: %', category_name, SQLERRM;
        CONTINUE;
    END;
  END LOOP;
  
  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;