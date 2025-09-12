-- Migration: Add flattened fields for better filtering and search
-- This adds Rating, Sector, and Location fields to document_processing_requests table

-- Add new columns to document_processing_requests table
ALTER TABLE document_processing_requests 
ADD COLUMN IF NOT EXISTS credit_rating VARCHAR(10),
ADD COLUMN IF NOT EXISTS sector VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_city VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_state VARCHAR(100),
ADD COLUMN IF NOT EXISTS location_combined VARCHAR(200);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_document_processing_requests_credit_rating 
ON document_processing_requests(credit_rating);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_sector 
ON document_processing_requests(sector);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_location_city 
ON document_processing_requests(location_city);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_location_state 
ON document_processing_requests(location_state);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_location_combined 
ON document_processing_requests(location_combined);

-- Create composite indexes for common filter combinations
CREATE INDEX IF NOT EXISTS idx_document_processing_requests_sector_rating 
ON document_processing_requests(sector, credit_rating);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_location_rating 
ON document_processing_requests(location_state, credit_rating);

CREATE INDEX IF NOT EXISTS idx_document_processing_requests_industry_sector 
ON document_processing_requests(industry, sector);

-- Add comments for documentation
COMMENT ON COLUMN document_processing_requests.credit_rating IS 'Flattened credit rating (A, AA, AAA, etc.) extracted from risk analysis';
COMMENT ON COLUMN document_processing_requests.sector IS 'Business sector classification, more granular than industry';
COMMENT ON COLUMN document_processing_requests.location_city IS 'Primary business city extracted from company address';
COMMENT ON COLUMN document_processing_requests.location_state IS 'Primary business state extracted from company address';
COMMENT ON COLUMN document_processing_requests.location_combined IS 'Combined city, state for search optimization';