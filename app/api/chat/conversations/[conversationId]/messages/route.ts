// Chat Messages API Route
// Handles sending messages and getting conversation history

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AIChatService } from '@/lib/services/ai-chat.service'
import { PortfolioRepository } from '@/lib/repositories/portfolio.repository'
import { SendMessageRequest, GetMessagesResponse } from '@/types/ai-chat.types'
import { Database } from '@/types/database.types'

const chatService = new AIChatService()
const portfolioRepository = new PortfolioRepository()

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { conversationId } = await params

        const result = await chatService.getMessages(conversationId, user.id)

        const response: GetMessagesResponse = {
            messages: result.messages,
            conversation: result.conversation,
            total_count: result.messages.length
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching messages:', error)
        return NextResponse.json(
            { error: 'Failed to fetch messages' },
            { status: 500 }
        )
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ conversationId: string }> }
) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { conversationId } = await params
        const body: SendMessageRequest = await request.json()
        const { content, context_data } = body

        if (!content?.trim()) {
            return NextResponse.json(
                { error: 'Message content is required' },
                { status: 400 }
            )
        }

        // Get conversation to find the request_id
        const { data: conversation, error: convError } = await supabase
            .from('ai_chat_conversations')
            .select('request_id')
            .eq('id', conversationId)
            .eq('user_id', user.id)
            .single<Database['public']['Tables']['ai_chat_conversations']['Row']>()

        if (convError || !conversation) {
            return NextResponse.json(
                { error: 'Conversation not found' },
                { status: 404 }
            )
        }

        // Get company data for context
        const company = await portfolioRepository.getCompanyByRequestId(
            conversation.request_id,
            user.id
        )

        if (!company) {
            return NextResponse.json(
                { error: 'Company data not found' },
                { status: 404 }
            )
        }

        // Send message and get AI response
        const result = await chatService.sendMessage(
            conversationId,
            user.id,
            content,
            company
        )

        return NextResponse.json({
            message: result.userMessage,
            assistant_message: result.assistantMessage,
            usage: result.usage
        })
    } catch (error) {
        console.error('Error sending message:', error)

        // Handle specific error types
        if (error instanceof Error) {
            if (error.message.includes('Claude API error')) {
                return NextResponse.json(
                    { error: 'AI service temporarily unavailable. Please try again.' },
                    { status: 503 }
                )
            }

            if (error.message.includes('API key')) {
                return NextResponse.json(
                    { error: 'AI service configuration error' },
                    { status: 500 }
                )
            }
        }

        return NextResponse.json(
            { error: 'Failed to send message' },
            { status: 500 }
        )
    }
}