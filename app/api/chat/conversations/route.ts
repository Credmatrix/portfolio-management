// Chat Conversations API Route
// Handles creating and listing chat conversations

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AIChatService } from '@/lib/services/ai-chat.service'
import { CreateConversationRequest, GetConversationsResponse } from '@/types/ai-chat.types'

const chatService = new AIChatService()

export async function GET(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const { searchParams } = new URL(request.url)
        const requestId = searchParams.get('request_id')

        if (!requestId) {
            return NextResponse.json(
                { error: 'request_id parameter is required' },
                { status: 400 }
            )
        }

        const conversations = await chatService.getConversations(user.id, requestId)

        const response: GetConversationsResponse = {
            conversations,
            total_count: conversations.length
        }

        return NextResponse.json(response)
    } catch (error) {
        console.error('Error fetching conversations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch conversations' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createServerSupabaseClient()
        const { data: { user }, error: authError } = await supabase.auth.getUser()

        if (authError || !user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body: CreateConversationRequest = await request.json()
        const { request_id, title, initial_message } = body

        if (!request_id) {
            return NextResponse.json(
                { error: 'request_id is required' },
                { status: 400 }
            )
        }

        // Verify user has access to this request
        const { data: requestData, error: requestError } = await supabase
            .from('document_processing_requests')
            .select('id')
            .eq('request_id', request_id)
            .eq('user_id', user.id)
            .single()

        if (requestError || !requestData) {
            return NextResponse.json(
                { error: 'Request not found or access denied' },
                { status: 404 }
            )
        }

        const result = await chatService.createConversation(
            user.id,
            request_id,
            title,
            initial_message
        )

        return NextResponse.json(result, { status: 201 })
    } catch (error) {
        console.error('Error creating conversation:', error)
        return NextResponse.json(
            { error: 'Failed to create conversation' },
            { status: 500 }
        )
    }
}