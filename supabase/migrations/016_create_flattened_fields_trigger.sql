-- Migration: Create trigger to auto-populate flattened fields on new records
-- This ensures new records automatically get the flattened fields populated

-- Function to auto-populate flattened fields
CREATE OR REPLACE FUNCTION auto_populate_flattened_fields()
RETURNS TRIGGER AS $$
DECLARE
    rating TEXT;
    sector_value TEXT;
    location_data RECORD;
BEGIN
    -- Only process if status is completed and flattened fields are not already set
    IF NEW.status = 'completed' THEN
        
        -- Extract credit rating if not already set
        IF NEW.credit_rating IS NULL THEN
            -- Extract from risk grade
            IF NEW.risk_grade IS NOT NULL THEN
                CASE UPPER(NEW.risk_grade)
                    WHEN 'CM1' THEN NEW.credit_rating := 'AAA';
                    WHEN 'CM2' THEN NEW.credit_rating := 'AA';
                    WHEN 'CM3' THEN NEW.credit_rating := 'A';
                    WHEN 'CM4' THEN NEW.credit_rating := 'BBB';
                    WHEN 'CM5' THEN NEW.credit_rating := 'BB';
                    WHEN 'CM6' THEN NEW.credit_rating := 'B';
                    WHEN 'CM7' THEN NEW.credit_rating := 'CCC';
                    ELSE NULL;
                END CASE;
            -- Extract from risk score if risk grade not available
            ELSIF NEW.risk_score IS NOT NULL THEN
                CASE 
                    WHEN NEW.risk_score >= 90 THEN NEW.credit_rating := 'AAA';
                    WHEN NEW.risk_score >= 80 THEN NEW.credit_rating := 'AA';
                    WHEN NEW.risk_score >= 70 THEN NEW.credit_rating := 'A';
                    WHEN NEW.risk_score >= 60 THEN NEW.credit_rating := 'BBB';
                    WHEN NEW.risk_score >= 50 THEN NEW.credit_rating := 'BB';
                    WHEN NEW.risk_score >= 40 THEN NEW.credit_rating := 'B';
                    WHEN NEW.risk_score >= 30 THEN NEW.credit_rating := 'CCC';
                    ELSE NEW.credit_rating := 'D';
                END CASE;
            END IF;
        END IF;

        -- Extract sector if not already set
        IF NEW.sector IS NULL AND NEW.extracted_data IS NOT NULL THEN
            -- Try to get sector from extracted data
            sector_value := NEW.extracted_data->'about_company'->>'sector';
            IF sector_value IS NULL THEN
                sector_value := NEW.extracted_data->'about_company'->>'segment';
            END IF;
            IF sector_value IS NULL THEN
                sector_value := NEW.extracted_data->'about_company'->>'broad_industry_category';
            END IF;
            IF sector_value IS NULL THEN
                sector_value := NEW.extracted_data->'about_company'->>'industrial_classification';
            END IF;
            
            -- Fallback to industry mapping
            IF sector_value IS NULL AND NEW.industry IS NOT NULL THEN
                CASE NEW.industry::TEXT
                    WHEN 'manufacturing' THEN sector_value := 'Manufacturing & Production';
                    WHEN 'manufacturing-oem' THEN sector_value := 'Original Equipment Manufacturing';
                    WHEN 'epc' THEN sector_value := 'Engineering, Procurement & Construction';
                    ELSE sector_value := NEW.industry::TEXT;
                END CASE;
            END IF;
            
            NEW.sector := sector_value;
        END IF;

        -- Extract location if not already set
        IF NEW.location_combined IS NULL AND NEW.extracted_data IS NOT NULL THEN
            -- Extract from business address first, then registered address
            SELECT 
                COALESCE(
                    NEW.extracted_data->'about_company'->'business_address'->>'city',
                    NEW.extracted_data->'about_company'->'registered_address'->>'city'
                ) as city,
                COALESCE(
                    NEW.extracted_data->'about_company'->'business_address'->>'state',
                    NEW.extracted_data->'about_company'->'registered_address'->>'state'
                ) as state
            INTO location_data;

            -- Clean and standardize location data
            IF location_data.city IS NOT NULL THEN
                NEW.location_city := TRIM(REGEXP_REPLACE(location_data.city, '\s+', ' ', 'g'));
            END IF;

            IF location_data.state IS NOT NULL THEN
                NEW.location_state := TRIM(REGEXP_REPLACE(location_data.state, '\s+', ' ', 'g'));
                
                -- Standardize common state names
                CASE LOWER(NEW.location_state)
                    WHEN 'mh', 'maharashtra' THEN NEW.location_state := 'Maharashtra';
                    WHEN 'ka', 'karnataka' THEN NEW.location_state := 'Karnataka';
                    WHEN 'tn', 'tamil nadu' THEN NEW.location_state := 'Tamil Nadu';
                    WHEN 'gj', 'gujarat' THEN NEW.location_state := 'Gujarat';
                    WHEN 'rj', 'rajasthan' THEN NEW.location_state := 'Rajasthan';
                    WHEN 'up', 'uttar pradesh' THEN NEW.location_state := 'Uttar Pradesh';
                    WHEN 'wb', 'west bengal' THEN NEW.location_state := 'West Bengal';
                    WHEN 'dl', 'delhi' THEN NEW.location_state := 'Delhi';
                    WHEN 'hr', 'haryana' THEN NEW.location_state := 'Haryana';
                    WHEN 'pb', 'punjab' THEN NEW.location_state := 'Punjab';
                    WHEN 'mp', 'madhya pradesh' THEN NEW.location_state := 'Madhya Pradesh';
                    WHEN 'ap', 'andhra pradesh' THEN NEW.location_state := 'Andhra Pradesh';
                    WHEN 'ts', 'telangana' THEN NEW.location_state := 'Telangana';
                    WHEN 'kl', 'kerala' THEN NEW.location_state := 'Kerala';
                    WHEN 'or', 'odisha' THEN NEW.location_state := 'Odisha';
                    ELSE NEW.location_state := NEW.location_state;
                END CASE;
            END IF;

            -- Create combined location
            IF NEW.location_city IS NOT NULL AND NEW.location_state IS NOT NULL THEN
                NEW.location_combined := NEW.location_city || ', ' || NEW.location_state;
            ELSIF NEW.location_city IS NOT NULL THEN
                NEW.location_combined := NEW.location_city;
            ELSIF NEW.location_state IS NOT NULL THEN
                NEW.location_combined := NEW.location_state;
            END IF;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for INSERT operations
CREATE TRIGGER trigger_auto_populate_flattened_fields_insert
    BEFORE INSERT ON document_processing_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_populate_flattened_fields();

-- Create trigger for UPDATE operations (when status changes to completed)
CREATE TRIGGER trigger_auto_populate_flattened_fields_update
    BEFORE UPDATE ON document_processing_requests
    FOR EACH ROW
    WHEN (NEW.status = 'completed' AND (OLD.status != 'completed' OR OLD.status IS NULL))
    EXECUTE FUNCTION auto_populate_flattened_fields();

-- Add comment for documentation
COMMENT ON FUNCTION auto_populate_flattened_fields() IS 'Auto-populates flattened fields (credit_rating, sector, location) when records are completed';
COMMENT ON TRIGGER trigger_auto_populate_flattened_fields_insert ON document_processing_requests IS 'Auto-populates flattened fields on new record insertion';
COMMENT ON TRIGGER trigger_auto_populate_flattened_fields_update ON document_processing_requests IS 'Auto-populates flattened fields when status changes to completed';