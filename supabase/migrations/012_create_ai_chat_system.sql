-- Create AI Chat System Tables
-- This migration creates tables for storing AI chat conversations and messages

-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.ai_chat_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_id TEXT NOT NULL REFERENCES document_processing_requests(request_id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.ai_chat_messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    model_used TEXT DEFAULT 'claude-3-sonnet-20240229',
    context_data JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Chat usage tracking table
CREATE TABLE IF NOT EXISTS public.ai_chat_usage (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    conversation_id UUID NOT NULL REFERENCES ai_chat_conversations(id) ON DELETE CASCADE,
    tokens_input INTEGER NOT NULL DEFAULT 0,
    tokens_output INTEGER NOT NULL DEFAULT 0,
    cost_usd DECIMAL(10, 6) DEFAULT 0,
    model_used TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_user_id ON ai_chat_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_request_id ON ai_chat_conversations(request_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_conversations_created_at ON ai_chat_conversations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_conversation_id ON ai_chat_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_created_at ON ai_chat_messages(created_at ASC);
CREATE INDEX IF NOT EXISTS idx_ai_chat_messages_role ON ai_chat_messages(role);

CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_user_id ON ai_chat_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_chat_usage_created_at ON ai_chat_usage(created_at DESC);

-- Enable Row Level Security
ALTER TABLE ai_chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_chat_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for ai_chat_conversations
CREATE POLICY "Users can view their own conversations" ON ai_chat_conversations
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own conversations" ON ai_chat_conversations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own conversations" ON ai_chat_conversations
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own conversations" ON ai_chat_conversations
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for ai_chat_messages
CREATE POLICY "Users can view messages in their conversations" ON ai_chat_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ai_chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

CREATE POLICY "Users can create messages in their conversations" ON ai_chat_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM ai_chat_conversations 
            WHERE id = conversation_id AND user_id = auth.uid()
        )
    );

-- RLS Policies for ai_chat_usage
CREATE POLICY "Users can view their own usage" ON ai_chat_usage
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert usage records" ON ai_chat_usage
    FOR INSERT WITH CHECK (true);

-- Function to update conversation updated_at timestamp
CREATE OR REPLACE FUNCTION update_conversation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE ai_chat_conversations 
    SET updated_at = NOW() 
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update conversation timestamp when messages are added
CREATE TRIGGER update_conversation_on_message_insert
    AFTER INSERT ON ai_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_conversation_timestamp();

-- Function to generate conversation title from first message
CREATE OR REPLACE FUNCTION generate_conversation_title(conversation_uuid UUID)
RETURNS TEXT AS $$
DECLARE
    first_message TEXT;
    title TEXT;
BEGIN
    -- Get the first user message
    SELECT content INTO first_message
    FROM ai_chat_messages
    WHERE conversation_id = conversation_uuid AND role = 'user'
    ORDER BY created_at ASC
    LIMIT 1;
    
    IF first_message IS NULL THEN
        RETURN 'New Chat';
    END IF;
    
    -- Generate title from first 50 characters
    title := TRIM(SUBSTRING(first_message FROM 1 FOR 50));
    
    -- Add ellipsis if truncated
    IF LENGTH(first_message) > 50 THEN
        title := title || '...';
    END IF;
    
    RETURN title;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-generate title after first user message
CREATE OR REPLACE FUNCTION auto_generate_title()
RETURNS TRIGGER AS $$
DECLARE
    message_count INTEGER;
    new_title TEXT;
BEGIN
    -- Only process user messages
    IF NEW.role != 'user' THEN
        RETURN NEW;
    END IF;
    
    -- Count user messages in this conversation
    SELECT COUNT(*) INTO message_count
    FROM ai_chat_messages
    WHERE conversation_id = NEW.conversation_id AND role = 'user';
    
    -- If this is the first user message, generate title
    IF message_count = 1 THEN
        new_title := generate_conversation_title(NEW.conversation_id);
        
        UPDATE ai_chat_conversations
        SET title = new_title
        WHERE id = NEW.conversation_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate conversation title
CREATE TRIGGER auto_generate_conversation_title
    AFTER INSERT ON ai_chat_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_title();

-- Grant necessary permissions
GRANT ALL ON ai_chat_conversations TO authenticated;
GRANT ALL ON ai_chat_messages TO authenticated;
GRANT ALL ON ai_chat_usage TO authenticated;

-- Comments for documentation
COMMENT ON TABLE ai_chat_conversations IS 'Stores AI chat conversations linked to specific company requests';
COMMENT ON TABLE ai_chat_messages IS 'Stores individual messages within AI chat conversations';
COMMENT ON TABLE ai_chat_usage IS 'Tracks token usage and costs for AI chat interactions';

COMMENT ON COLUMN ai_chat_conversations.request_id IS 'Links conversation to specific company/document processing request';
COMMENT ON COLUMN ai_chat_messages.context_data IS 'Stores relevant company data context used for the message';
COMMENT ON COLUMN ai_chat_messages.tokens_used IS 'Number of tokens used for this specific message';
COMMENT ON COLUMN ai_chat_usage.cost_usd IS 'Estimated cost in USD for the API call';