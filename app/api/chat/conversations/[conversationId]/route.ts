// Individual Chat Conversation API Route
// Handles operations on specific conversations

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase/server'
import { AIChatService } from '@/lib/services/ai-chat.service'

const chatService = new AIChatService()

export async function DELETE(
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

        await chatService.deleteConversation(conversationId, user.id)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting conversation:', error)
        return NextResponse.json(
            { error: 'Failed to delete conversation' },
            { status: 500 }
        )
    }
}

export async function PATCH(
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
        const body = await request.json()
        const { action, title } = body

        if (action === 'archive') {
            await chatService.archiveConversation(conversationId, user.id)
            return NextResponse.json({ success: true })
        }

        if (action === 'update_title' && title) {
            const { error } = await supabase
                .from('ai_chat_conversations')
                .update({ title })
                .eq('id', conversationId)
                .eq('user_id', user.id)

            if (error) {
                throw new Error(`Failed to update title: ${error.message}`)
            }

            return NextResponse.json({ success: true })
        }

        return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
        )
    } catch (error) {
        console.error('Error updating conversation:', error)
        return NextResponse.json(
            { error: 'Failed to update conversation' },
            { status: 500 }
        )
    }
}