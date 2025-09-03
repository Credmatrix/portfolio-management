-- Create credit management table for additional portfolio fields
CREATE TABLE IF NOT EXISTS credit_management (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    request_id UUID NOT NULL REFERENCES portfolio_requests(request_id) ON DELETE CASCADE,
    
    -- Credit Approval Details
    actual_credit_limit_approved DECIMAL(15,2),
    payment_terms TEXT,
    security_requirements TEXT,
    ad_hoc_limit DECIMAL(15,2),
    limit_validity_date DATE,
    
    -- Insurance and Remarks
    insurance_cover DECIMAL(15,2),
    insurance_remarks TEXT,
    general_remarks TEXT,
    
    -- Collection Feedback
    collection_feedback TEXT,
    collection_remarks TEXT,
    
    -- Case Specific Notes
    case_notes TEXT,
    
    -- ERP Integration Fields (manual entry for now)
    ar_values DECIMAL(15,2),
    dpd_behavior TEXT,
    ar_remarks TEXT,
    dpd_remarks TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id),
    updated_by UUID REFERENCES auth.users(id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_credit_management_request_id ON credit_management(request_id);

-- Enable RLS
ALTER TABLE credit_management ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view credit management data" ON credit_management
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Users can insert credit management data" ON credit_management
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can update credit management data" ON credit_management
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Users can delete credit management data" ON credit_management
    FOR DELETE USING (auth.role() = 'authenticated');

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_credit_management_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    NEW.updated_by = auth.uid();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_credit_management_updated_at
    BEFORE UPDATE ON credit_management
    FOR EACH ROW
    EXECUTE FUNCTION update_credit_management_updated_at();