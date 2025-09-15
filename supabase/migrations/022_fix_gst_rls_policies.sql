-- Fix RLS policies for GST filing data to allow inserts

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "gst_filing_data_select" ON gst_filing_data;
DROP POLICY IF EXISTS "gst_filing_data_insert" ON gst_filing_data;
DROP POLICY IF EXISTS "gst_filing_data_update" ON gst_filing_data;
DROP POLICY IF EXISTS "gst_filing_data_delete" ON gst_filing_data;

-- Create comprehensive RLS policies for gst_filing_data
-- Allow all authenticated users to read GST filing data (it's public information)
CREATE POLICY "gst_filing_data_select" ON gst_filing_data
    FOR SELECT TO authenticated
    USING (true);

-- Allow service role and authenticated users to insert GST filing data
CREATE POLICY "gst_filing_data_insert" ON gst_filing_data
    FOR INSERT TO authenticated
    WITH CHECK (true);

-- Allow service role and authenticated users to update GST filing data
CREATE POLICY "gst_filing_data_update" ON gst_filing_data
    FOR UPDATE TO authenticated
    USING (true)
    WITH CHECK (true);

-- Allow service role and authenticated users to delete GST filing data
CREATE POLICY "gst_filing_data_delete" ON gst_filing_data
    FOR DELETE TO authenticated
    USING (true);

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON gst_filing_data TO authenticated;

-- Also ensure service_role has full access (for background jobs)
GRANT ALL ON gst_filing_data TO service_role;