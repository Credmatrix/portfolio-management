'use client'

import { useState, useEffect, useRef } from 'react'
import { PortfolioCompany } from '@/types/portfolio.types'
import {
    ChatConversation,
    ChatMessage,
    CreateConversationRequest,
    SendMessageRequest
} from '@/types/ai-chat.types'
import { Card, CardContent, CardHeader } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Skeleton } from '@/components/ui/Skeleton'
import { Alert } from '@/components/ui/Alert'
import {
    MessageSquare,
    X,
    Plus,
    Send,
    Bot,
    User,
    Trash2,
    Archive,
    Edit3,
    Sparkles,
    AlertCircle,
    RefreshCw
} from 'lucide-react'
import { ChatMessageComponent } from './ChatMessage'
import { ChatInput } from './ChatInput'
import { ConversationList } from './ConversationList'

interface ChatInterfaceProps {
    requestId: string
    company: PortfolioCompany
    isOpen: boolean
    onClose: () => void
}

export function ChatInterface({ requestId, company, isOpen, onClose }: ChatInterfaceProps) {
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [showConversationList, setShowConversationList] = useState(true)

    const messagesEndRef = useRef<HTMLDivElement>(null)

    // Load conversations when chat opens
    useEffect(() => {
        if (isOpen && requestId) {
            loadConversations()
        }
    }, [isOpen, requestId])

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        scrollToBottom()
    }, [messages])

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const loadConversations = async () => {
        try {
            setLoading(true)
            setError(null)

            const response = await fetch(`/api/chat/conversations?request_id=${requestId}`)
            
            if (!response.ok) {
                throw new Error('Failed to load conversations')
            }

            const data = await response.json()
            setConversations(data.conversations)

            // Auto-select the most recent conversation
            if (data.conversations.length > 0 && !activeConversation) {
                selectConversation(data.conversations[0])
            }
        } catch (error) {
            console.error('Error loading conversations:', error)
            setError('Failed to load conversations')
        } finally {
            setLoading(false)
        }
    }

    const selectConversation = async (conversation: ChatConversation) => {
        try {
            setMessagesLoading(true)
            setActiveConversation(conversation)
            setShowConversationList(false)

            const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`)
            
            if (!response.ok) {
                throw new Error('Failed to load messages')
            }

            const data = await response.json()
            setMessages(data.messages)
        } catch (error) {
            console.error('Error loading messages:', error)
            setError('Failed to load messages')
        } finally {
            setMessagesLoading(false)
        }
    }

    const createNewConversation = async (initialMessage?: string) => {
        try {
            setLoading(true)
            setError(null)

            const request: CreateConversationRequest = {
                request_id: requestId,
                title: 'New Chat',
                initial_message: initialMessage
            }

            const response = await fetch('/api/chat/conversations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            })

            if (!response.ok) {
                throw new Error('Failed to create conversation')
            }

            const data = await response.json()
            
            // Add to conversations list
            setConversations(prev => [data.conversation, ...prev])
            
            // Select the new conversation
            setActiveConversation(data.conversation)
            setMessages(data.message ? [data.message] : [])
            setShowConversationList(false)

            return data.conversation
        } catch (error) {
            console.error('Error creating conversation:', error)
            setError('Failed to create conversation')
            throw error
        } finally {
            setLoading(false)
        }
    }

    const sendMessage = async (content: string) => {
        if (!activeConversation) {
            // Create new conversation with this message
            try {
                const conversation = await createNewConversation(content)
                if (conversation) {
                    // The message will be sent as part of conversation creation
                    return
                }
            } catch (error) {
                return // Error already handled
            }
        }

        try {
            setSendingMessage(true)
            setError(null)

            // Add user message optimistically
            const tempUserMessage: ChatMessage = {
                id: `temp-${Date.now()}`,
                conversation_id: activeConversation!.id,
                role: 'user',
                content,
                tokens_used: 0,
                model_used: 'claude-3-sonnet-20240229',
                context_data: {},
                created_at: new Date().toISOString(),
                metadata: {}
            }

            setMessages(prev => [...prev, tempUserMessage])

            const request: SendMessageRequest = {
                conversation_id: activeConversation!.id,
                content
            }

            const response = await fetch(`/api/chat/conversations/${activeConversation!.id}/messages`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(request)
            })

            if (!response.ok) {
                throw new Error('Failed to send message')
            }

            const data = await response.json()

            // Replace temp message with actual messages
            setMessages(prev => {
                const filtered = prev.filter(msg => msg.id !== tempUserMessage.id)
                return [...filtered, data.message, data.assistant_message]
            })

            // Update conversation timestamp
            setConversations(prev => 
                prev.map(conv => 
                    conv.id === activeConversation!.id 
                        ? { ...conv, updated_at: new Date().toISOString() }
                        : conv
                )
            )
        } catch (error) {
            console.error('Error sending message:', error)
            setError('Failed to send message')
            
            // Remove the optimistic message on error
            setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
        } finally {
            setSendingMessage(false)
        }
    }

    const deleteConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/chat/conversations/${conversationId}`, {
                method: 'DELETE'
            })

            if (!response.ok) {
                throw new Error('Failed to delete conversation')
            }

            // Remove from list
            setConversations(prev => prev.filter(conv => conv.id !== conversationId))
            
            // Clear active conversation if it was deleted
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null)
                setMessages([])
                setShowConversationList(true)
            }
        } catch (error) {
            console.error('Error deleting conversation:', error)
            setError('Failed to delete conversation')
        }
    }

    const archiveConversation = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/chat/conversations/${conversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'archive' })
            })

            if (!response.ok) {
                throw new Error('Failed to archive conversation')
            }

            // Remove from list (archived conversations are hidden)
            setConversations(prev => prev.filter(conv => conv.id !== conversationId))
            
            // Clear active conversation if it was archived
            if (activeConversation?.id === conversationId) {
                setActiveConversation(null)
                setMessages([])
                setShowConversationList(true)
            }
        } catch (error) {
            console.error('Error archiving conversation:', error)
            setError('Failed to archive conversation')
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-6xl h-[80vh] flex flex-col bg-white shadow-2xl">
                {/* Header */}
                <CardHeader className="flex-shrink-0 border-b border-neutral-20 bg-neutral-5">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Sparkles className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg font-semibold text-neutral-90 flex items-center gap-2">
                                    AI Assistant
                                    <Badge variant="info" size="sm">Beta</Badge>
                                </h2>
                                <p className="text-sm text-neutral-60">
                                    Ask questions about {company.company_name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {!showConversationList && activeConversation && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setShowConversationList(true)}
                                    className="flex items-center gap-2"
                                >
                                    <MessageSquare className="w-4 h-4" />
                                    Conversations
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={onClose}
                                className="flex items-center gap-2"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="flex-1 flex overflow-hidden p-0">
                    {/* Conversation List Sidebar */}
                    {showConversationList && (
                        <div className="w-80 border-r border-neutral-20 flex flex-col">
                            <div className="p-4 border-b border-neutral-20">
                                <Button
                                    onClick={() => createNewConversation()}
                                    disabled={loading}
                                    className="w-full flex items-center gap-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    New Conversation
                                </Button>
                            </div>
                            
                            <div className="flex-1 overflow-y-auto">
                                {loading ? (
                                    <div className="p-4 space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <Skeleton key={i} className="w-full h-16" />
                                        ))}
                                    </div>
                                ) : (
                                    <ConversationList
                                        conversations={conversations}
                                        activeConversationId={activeConversation?.id}
                                        onSelectConversation={selectConversation}
                                        onDeleteConversation={deleteConversation}
                                        onArchiveConversation={archiveConversation}
                                    />
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat Area */}
                    <div className="flex-1 flex flex-col">
                        {activeConversation ? (
                            <>
                                {/* Messages */}
                                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                    {messagesLoading ? (
                                        <div className="space-y-4">
                                            {[...Array(3)].map((_, i) => (
                                                <div key={i} className="flex gap-3">
                                                    <Skeleton className="w-8 h-8 rounded-full" />
                                                    <Skeleton className="flex-1 h-16" />
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            {messages.map((message) => (
                                                <ChatMessageComponent
                                                    key={message.id}
                                                    message={message}
                                                    company={company}
                                                />
                                            ))}
                                            {sendingMessage && (
                                                <div className="flex gap-3">
                                                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <Bot className="w-4 h-4 text-blue-600" />
                                                    </div>
                                                    <div className="flex-1 bg-neutral-5 rounded-lg p-3">
                                                        <div className="flex items-center gap-2 text-neutral-60">
                                                            <RefreshCw className="w-4 h-4 animate-spin" />
                                                            Thinking...
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            <div ref={messagesEndRef} />
                                        </>
                                    )}
                                </div>

                                {/* Input */}
                                <div className="border-t border-neutral-20 p-4">
                                    <ChatInput
                                        onSendMessage={sendMessage}
                                        isLoading={sendingMessage}
                                        disabled={messagesLoading}
                                        placeholder={`Ask about ${company.company_name}...`}
                                    />
                                </div>
                            </>
                        ) : (
                            /* Welcome Screen */
                            <div className="flex-1 flex items-center justify-center p-8">
                                <div className="text-center max-w-md">
                                    <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Sparkles className="w-8 h-8 text-blue-600" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-neutral-90 mb-2">
                                        AI-Powered Analysis
                                    </h3>
                                    <p className="text-neutral-60 mb-6">
                                        Get instant insights about {company.company_name}'s financial health, 
                                        risk factors, and credit assessment. Ask questions about ratios, 
                                        compliance, or get recommendations.
                                    </p>
                                    <Button
                                        onClick={() => createNewConversation()}
                                        disabled={loading}
                                        className="flex items-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" />
                                        Start New Conversation
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>

                {/* Error Alert */}
                {error && (
                    <div className="p-4 border-t border-neutral-20">
                        <Alert variant="error" className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4" />
                            <span>{error}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="ml-auto"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </Alert>
                    </div>
                )}
            </Card>
        </div>
    )
}