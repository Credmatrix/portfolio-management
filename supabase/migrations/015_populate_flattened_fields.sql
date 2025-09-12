-- Migration: Populate flattened fields from existing data
-- This updates the newly added columns with data extracted from existing JSONB fields

-- Function to extract credit rating from risk analysis
CREATE OR REPLACE FUNCTION extract_credit_rating(risk_analysis JSONB, risk_grade TEXT, risk_score INTEGER)
RETURNS TEXT AS $$
DECLARE
    rating TEXT;
BEGIN
    -- First try to get from risk analysis
    IF risk_analysis IS NOT NULL THEN
        -- Check if there's a specific rating field
        rating := risk_analysis->>'credit_rating';
        IF rating IS NOT NULL THEN
            RETURN rating;
        END IF;
    END IF;

    -- Try to extract from risk grade
    IF risk_grade IS NOT NULL THEN
        CASE UPPER(risk_grade)
            WHEN 'CM1' THEN RETURN 'AAA';
            WHEN 'CM2' THEN RETURN 'AA';
            WHEN 'CM3' THEN RETURN 'A';
            WHEN 'CM4' THEN RETURN 'BBB';
            WHEN 'CM5' THEN RETURN 'BB';
            WHEN 'CM6' THEN RETURN 'B';
            WHEN 'CM7' THEN RETURN 'CCC';
            ELSE NULL;
        END CASE;
    END IF;

    -- Try to extract from risk score ranges
    IF risk_score IS NOT NULL THEN
        CASE 
            WHEN risk_score >= 90 THEN RETURN 'AAA';
            WHEN risk_score >= 80 THEN RETURN 'AA';
            WHEN risk_score >= 70 THEN RETURN 'A';
            WHEN risk_score >= 60 THEN RETURN 'BBB';
            WHEN risk_score >= 50 THEN RETURN 'BB';
            WHEN risk_score >= 40 THEN RETURN 'B';
            WHEN risk_score >= 30 THEN RETURN 'CCC';
            ELSE RETURN 'D';
        END CASE;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to extract sector from extracted data
CREATE OR REPLACE FUNCTION extract_sector(extracted_data JSONB, industry TEXT)
RETURNS TEXT AS $$
DECLARE
    sector TEXT;
BEGIN
    -- First check if sector is explicitly mentioned in extracted data
    IF extracted_data IS NOT NULL THEN
        -- Check for sector
        sector := extracted_data->'about_company'->>'sector';
        IF sector IS NOT NULL THEN
            RETURN sector;
        END IF;

        -- Check for business segment
        sector := extracted_data->'about_company'->>'segment';
        IF sector IS NOT NULL THEN
            RETURN sector;
        END IF;

        -- Check for broad industry category
        sector := extracted_data->'about_company'->>'broad_industry_category';
        IF sector IS NOT NULL THEN
            RETURN sector;
        END IF;

        -- Check for industrial classification
        sector := extracted_data->'about_company'->>'industrial_classification';
        IF sector IS NOT NULL THEN
            RETURN sector;
        END IF;
    END IF;

    -- Fallback to industry with more specific mapping
    IF industry IS NOT NULL THEN
        CASE industry
            WHEN 'manufacturing' THEN RETURN 'Manufacturing & Production';
            WHEN 'manufacturing-oem' THEN RETURN 'Original Equipment Manufacturing';
            WHEN 'epc' THEN RETURN 'Engineering, Procurement & Construction';
            ELSE RETURN industry;
        END CASE;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Function to extract location from extracted data
CREATE OR REPLACE FUNCTION extract_location(extracted_data JSONB)
RETURNS TABLE(city TEXT, state TEXT, combined TEXT) AS $$
DECLARE
    business_city TEXT;
    business_state TEXT;
    registered_city TEXT;
    registered_state TEXT;
    final_city TEXT;
    final_state TEXT;
    final_combined TEXT;
BEGIN
    IF extracted_data IS NOT NULL THEN
        -- Extract from business address
        business_city := extracted_data->'about_company'->'business_address'->>'city';
        business_state := extracted_data->'about_company'->'business_address'->>'state';

        -- Extract from registered address
        registered_city := extracted_data->'about_company'->'registered_address'->>'city';
        registered_state := extracted_data->'about_company'->'registered_address'->>'state';

        -- Priority: business address first, then registered address
        final_city := COALESCE(business_city, registered_city);
        final_state := COALESCE(business_state, registered_state);

        -- Clean and standardize
        IF final_city IS NOT NULL THEN
            final_city := TRIM(final_city);
            final_city := REGEXP_REPLACE(final_city, '\s+', ' ', 'g');
        END IF;

        IF final_state IS NOT NULL THEN
            final_state := TRIM(final_state);
            final_state := REGEXP_REPLACE(final_state, '\s+', ' ', 'g');
            
            -- Standardize common state names
            CASE LOWER(final_state)
                WHEN 'mh', 'maharashtra' THEN final_state := 'Maharashtra';
                WHEN 'ka', 'karnataka' THEN final_state := 'Karnataka';
                WHEN 'tn', 'tamil nadu' THEN final_state := 'Tamil Nadu';
                WHEN 'gj', 'gujarat' THEN final_state := 'Gujarat';
                WHEN 'rj', 'rajasthan' THEN final_state := 'Rajasthan';
                WHEN 'up', 'uttar pradesh' THEN final_state := 'Uttar Pradesh';
                WHEN 'wb', 'west bengal' THEN final_state := 'West Bengal';
                WHEN 'dl', 'delhi' THEN final_state := 'Delhi';
                WHEN 'hr', 'haryana' THEN final_state := 'Haryana';
                WHEN 'pb', 'punjab' THEN final_state := 'Punjab';
                WHEN 'mp', 'madhya pradesh' THEN final_state := 'Madhya Pradesh';
                WHEN 'ap', 'andhra pradesh' THEN final_state := 'Andhra Pradesh';
                WHEN 'ts', 'telangana' THEN final_state := 'Telangana';
                WHEN 'kl', 'kerala' THEN final_state := 'Kerala';
                WHEN 'or', 'odisha' THEN final_state := 'Odisha';
                ELSE final_state := final_state;
            END CASE;
        END IF;

        -- Create combined location
        IF final_city IS NOT NULL AND final_state IS NOT NULL THEN
            final_combined := final_city || ', ' || final_state;
        ELSIF final_city IS NOT NULL THEN
            final_combined := final_city;
        ELSIF final_state IS NOT NULL THEN
            final_combined := final_state;
        END IF;
    END IF;

    RETURN QUERY SELECT final_city, final_state, final_combined;
END;
$$ LANGUAGE plpgsql;

-- Update existing records with flattened data
-- Process in batches to avoid long-running transactions
DO $$
DECLARE
    batch_size INTEGER := 100;
    total_records INTEGER;
    processed INTEGER := 0;
    batch_start INTEGER := 0;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_records 
    FROM document_processing_requests 
    WHERE status = 'completed';

    RAISE NOTICE 'Starting to update % records in batches of %', total_records, batch_size;

    -- Process in batches
    WHILE batch_start < total_records LOOP
        -- Update credit rating
        UPDATE document_processing_requests 
        SET credit_rating = extract_credit_rating(risk_analysis, risk_grade, risk_score)
        WHERE id IN (
            SELECT id FROM document_processing_requests 
            WHERE status = 'completed' 
            AND credit_rating IS NULL
            ORDER BY id 
            LIMIT batch_size OFFSET batch_start
        );

        -- Update sector
        UPDATE document_processing_requests 
        SET sector = extract_sector(extracted_data, industry::TEXT)
        WHERE id IN (
            SELECT id FROM document_processing_requests 
            WHERE status = 'completed' 
            AND sector IS NULL
            ORDER BY id 
            LIMIT batch_size OFFSET batch_start
        );

        -- Update location fields
        UPDATE document_processing_requests 
        SET 
            location_city = loc.city,
            location_state = loc.state,
            location_combined = loc.combined
        FROM (
            SELECT 
                dpr.id,
                el.city,
                el.state,
                el.combined
            FROM document_processing_requests dpr
            CROSS JOIN LATERAL extract_location(dpr.extracted_data) AS el
            WHERE dpr.status = 'completed' 
            AND dpr.location_combined IS NULL
            ORDER BY dpr.id 
            LIMIT batch_size OFFSET batch_start
        ) AS loc
        WHERE document_processing_requests.id = loc.id;

        processed := processed + batch_size;
        batch_start := batch_start + batch_size;
        
        RAISE NOTICE 'Processed % of % records (%.1f%%)', 
            LEAST(processed, total_records), 
            total_records, 
            (LEAST(processed, total_records)::FLOAT / total_records * 100);
        
        -- Commit batch
        COMMIT;
    END LOOP;

    RAISE NOTICE 'Completed updating flattened fields for all records';
END $$;

-- Create summary statistics
DO $$
DECLARE
    rating_stats RECORD;
    sector_stats RECORD;
    location_stats RECORD;
BEGIN
    -- Credit rating statistics
    SELECT 
        COUNT(*) as total_records,
        COUNT(credit_rating) as records_with_rating,
        ROUND(COUNT(credit_rating)::FLOAT / COUNT(*) * 100, 2) as rating_coverage_pct
    INTO rating_stats
    FROM document_processing_requests 
    WHERE status = 'completed';

    -- Sector statistics
    SELECT 
        COUNT(*) as total_records,
        COUNT(sector) as records_with_sector,
        ROUND(COUNT(sector)::FLOAT / COUNT(*) * 100, 2) as sector_coverage_pct
    INTO sector_stats
    FROM document_processing_requests 
    WHERE status = 'completed';

    -- Location statistics
    SELECT 
        COUNT(*) as total_records,
        COUNT(location_combined) as records_with_location,
        ROUND(COUNT(location_combined)::FLOAT / COUNT(*) * 100, 2) as location_coverage_pct
    INTO location_stats
    FROM document_processing_requests 
    WHERE status = 'completed';

    RAISE NOTICE 'Flattened Fields Population Summary:';
    RAISE NOTICE 'Credit Rating: % of % records (%.2f%% coverage)', 
        rating_stats.records_with_rating, rating_stats.total_records, rating_stats.rating_coverage_pct;
    RAISE NOTICE 'Sector: % of % records (%.2f%% coverage)', 
        sector_stats.records_with_sector, sector_stats.total_records, sector_stats.sector_coverage_pct;
    RAISE NOTICE 'Location: % of % records (%.2f%% coverage)', 
        location_stats.records_with_location, location_stats.total_records, location_stats.location_coverage_pct;
END $$;

-- Drop the helper functions as they're no longer needed
DROP FUNCTION IF EXISTS extract_credit_rating(JSONB, TEXT, INTEGER);
DROP FUNCTION IF EXISTS extract_sector(JSONB, TEXT);
DROP FUNCTION IF EXISTS extract_location(JSONB);