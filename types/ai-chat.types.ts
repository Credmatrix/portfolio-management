// AI Chat System Types
// Comprehensive type definitions for the AI chat feature

import { Json } from "./database.types"

export interface ChatConversation {
    created_at: string | null
    id: string
    is_archived: boolean | null
    metadata: Json | null
    request_id: string
    title: string
    updated_at: string | null
    user_id: string
}

export interface ChatMessage {
    content: string
    context_data: Json | null
    conversation_id: string
    created_at: string | null
    id: string
    metadata: Json | null
    model_used: string | null
    role: string
    tokens_used: number | null
}

export interface ChatUsage {
    conversation_id: string
    cost_usd: number | null
    created_at: string | null
    id: string
    model_used: string
    tokens_input: number
    tokens_output: number
    user_id: string
}

// API Request/Response Types
export interface CreateConversationRequest {
    request_id: string
    title?: string
    initial_message?: string
}

export interface CreateConversationResponse {
    conversation: ChatConversation
    message?: ChatMessage
}

export interface SendMessageRequest {
    conversation_id: string
    content: string
    context_data?: Record<string, any>
}

export interface SendMessageResponse {
    message: ChatMessage
    assistant_message: ChatMessage
    usage: ChatUsage
}

export interface GetConversationsResponse {
    conversations: ChatConversation[]
    total_count: number
}

export interface GetMessagesResponse {
    messages: ChatMessage[]
    conversation: ChatConversation
    total_count: number
}

// Claude API Configuration
export interface ClaudeConfig {
    model: string
    max_tokens: number
    temperature: number
    system_prompt: string
}

// Context Data Types
export interface CompanyContextData {
    company_name: string
    industry: string
    risk_score: number
    risk_grade: string
    recommended_limit: number
    financial_data?: any
    compliance_data?: any
    risk_analysis?: any
    extracted_data?: any
}

export interface ChatContextData {
    company: CompanyContextData
    conversation_history: ChatMessage[]
    user_query: string
    timestamp: string
}

// UI Component Props
export interface ChatInterfaceProps {
    requestId: string
    company: any // PortfolioCompany type
    isOpen: boolean
    onClose: () => void
}

export interface ChatMessageProps {
    message: ChatMessage
    isLoading?: boolean
    onRetry?: () => void
}

export interface ChatInputProps {
    onSendMessage: (content: string) => void
    isLoading: boolean
    disabled?: boolean
    placeholder?: string
}

export interface ConversationListProps {
    conversations: ChatConversation[]
    activeConversationId?: string
    onSelectConversation: (conversationId: string) => void
    onDeleteConversation: (conversationId: string) => void
    onArchiveConversation: (conversationId: string) => void
}

// Error Types
export interface ChatError {
    code: string
    message: string
    details?: Record<string, any>
}

// Streaming Response Types
export interface StreamingChatResponse {
    type: 'token' | 'complete' | 'error'
    content?: string
    message?: ChatMessage
    usage?: ChatUsage
    error?: ChatError
}

// Chat Analytics Types
export interface ChatAnalytics {
    total_conversations: number
    total_messages: number
    total_tokens_used: number
    total_cost_usd: number
    average_conversation_length: number
    most_common_queries: string[]
    user_satisfaction_score?: number
}

// Export utility types
export type MessageRole = ChatMessage['role']
export type ClaudeModel = ClaudeConfig['model']
export type ChatEventType = StreamingChatResponse['type']