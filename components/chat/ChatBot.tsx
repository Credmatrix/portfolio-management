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
    Minus,
    Maximize2,
    Minimize2,
    Send,
    Bot,
    User,
    Sparkles,
    AlertCircle,
    RefreshCw,
    Plus,
    MoreVertical
} from 'lucide-react'
import { ChatMessageComponent } from './ChatMessage'
import { ChatInput } from './ChatInput'

interface ChatBotProps {
    requestId: string
    company: PortfolioCompany
}

type ChatState = 'closed' | 'minimized' | 'open'

export function ChatBot({ requestId, company }: ChatBotProps) {
    const [chatState, setChatState] = useState<ChatState>('closed')
    const [conversations, setConversations] = useState<ChatConversation[]>([])
    const [activeConversation, setActiveConversation] = useState<ChatConversation | null>(null)
    const [messages, setMessages] = useState<ChatMessage[]>([])
    const [loading, setLoading] = useState(false)
    const [messagesLoading, setMessagesLoading] = useState(false)
    const [sendingMessage, setSendingMessage] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [unreadCount, setUnreadCount] = useState(0)

    const messagesEndRef = useRef<HTMLDivElement>(null)
    const chatContainerRef = useRef<HTMLDivElement>(null)

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatState === 'open') {
            scrollToBottom()
        }
    }, [messages, chatState])

    // Load conversations when chat opens for the first time
    useEffect(() => {
        if (chatState === 'open' && conversations.length === 0) {
            loadConversations()
        }
    }, [chatState])

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

            const response = await fetch(`/api/chat/conversations/${conversation.id}/messages`)

            if (!response.ok) {
                throw new Error('Failed to load messages')
            }

            const data = await response.json()
            setMessages(data.messages)
            setUnreadCount(0)
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
                await createNewConversation(content)
                return
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
                conversation_id: activeConversation.id,
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
                conversation_id: activeConversation.id,
                content
            }

            const response = await fetch(`/api/chat/conversations/${activeConversation.id}/messages`, {
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
                    conv.id === activeConversation.id
                        ? { ...conv, updated_at: new Date().toISOString() }
                        : conv
                )
            )

            // If chat is minimized, show unread indicator
            if (chatState === 'minimized') {
                setUnreadCount(prev => prev + 1)
            }
        } catch (error) {
            console.error('Error sending message:', error)
            setError('Failed to send message')

            // Remove the optimistic message on error
            setMessages(prev => prev.filter(msg => !msg.id.startsWith('temp-')))
        } finally {
            setSendingMessage(false)
        }
    }

    const handleChatToggle = () => {
        if (chatState === 'closed') {
            setChatState('open')
        } else if (chatState === 'open') {
            setChatState('minimized')
        } else {
            setChatState('open')
            setUnreadCount(0)
        }
    }

    const handleClose = () => {
        setChatState('closed')
        setUnreadCount(0)
    }

    // Render chat button when closed
    if (chatState === 'closed') {
        return (
            <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
                <Button
                    onClick={handleChatToggle}
                    className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center group"
                >
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-white group-hover:scale-110 transition-transform" />
                </Button>
            </div>
        )
    }

    // Render minimized chat
    if (chatState === 'minimized') {
        return (
            <div className="fixed bottom-4 right-4 z-50 sm:bottom-6 sm:right-6">
                <Card className="p-0 w-72 sm:w-80 shadow-xl border-0 bg-white">
                    <CardHeader className="p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                    <Bot className="w-4 h-4" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-sm">AI Assistant</h3>
                                    <p className="text-xs opacity-90">
                                        {company.company_name}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                {unreadCount > 0 && (
                                    <Badge variant="error" size="sm" className="bg-red-500 text-white">
                                        {unreadCount}
                                    </Badge>
                                )}
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleChatToggle}
                                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                >
                                    <Maximize2 className="w-3 h-3" />
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={handleClose}
                                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                >
                                    <X className="w-3 h-3" />
                                </Button>
                            </div>
                        </div>
                    </CardHeader>
                </Card>
            </div>
        )
    }

    // Render full chat window
    return (
        <div className={`fixed z-50 ${
            // Mobile: full screen, Desktop: bottom-right corner
            'inset-0 md:inset-auto md:bottom-4 md:right-4 lg:bottom-6 lg:right-6'
            }`}>
            <Card
                // ref={chatContainerRef}
                className={`p-0 shadow-2xl border-0 bg-white flex flex-col overflow-hidden ${
                    // Mobile: full screen, Desktop: fixed size
                    'w-full h-full md:w-80 md:h-[500px] lg:w-96 lg:h-[600px] md:rounded-lg'
                    }`}
            // style={{
            //     maxHeight: 'calc(100vh - 100px)',
            //     maxWidth: 'calc(100vw - 32px)'
            // }}
            >
                {/* Header */}
                <CardHeader className="flex-shrink-0 p-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-semibold text-sm">AI Assistant</h3>
                                <p className="text-xs opacity-90 truncate">
                                    {company.company_name}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {conversations.length > 1 && (
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                    title="Conversations"
                                >
                                    <MoreVertical className="w-3 h-3" />
                                </Button>
                            )}
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleChatToggle}
                                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                            >
                                <Minus className="w-3 h-3" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClose}
                                className="h-6 w-6 p-0 text-white hover:bg-white/20"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                {/* Content */}
                <CardContent className="flex-1 flex flex-col overflow-hidden p-0">
                    {activeConversation ? (
                        <>
                            {/* Messages */}
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {messagesLoading ? (
                                    <div className="space-y-3">
                                        {[...Array(3)].map((_, i) => (
                                            <div key={i} className="flex gap-2">
                                                <Skeleton className="w-6 h-6 rounded-full" />
                                                <Skeleton className="flex-1 h-12" />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <>
                                        {messages.map((message) => (
                                            <div key={message.id} className="group">
                                                <ChatMessageComponent
                                                    message={message}
                                                    company={company}
                                                />
                                            </div>
                                        ))}
                                        {sendingMessage && (
                                            <div className="flex gap-2">
                                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                                    <Bot className="w-3 h-3 text-blue-600" />
                                                </div>
                                                <div className="flex-1 bg-neutral-5 rounded-lg p-2">
                                                    <div className="flex items-center gap-2 text-neutral-60 text-sm">
                                                        <RefreshCw className="w-3 h-3 animate-spin" />
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
                            <div className="border-t border-neutral-20 p-3">
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
                        <div className="flex-1 flex items-center justify-center p-4">
                            <div className="text-center">
                                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                                    <Sparkles className="w-6 h-6 text-blue-600" />
                                </div>
                                <h3 className="font-semibold text-neutral-90 mb-2">
                                    AI Analysis
                                </h3>
                                <p className="text-xs text-neutral-60 mb-4 leading-relaxed">
                                    Get insights about {company.company_name}'s financial health,
                                    risk factors, and credit assessment.
                                </p>
                                <Button
                                    onClick={() => createNewConversation()}
                                    disabled={loading}
                                    size="sm"
                                    className="flex items-center gap-2"
                                >
                                    <Plus className="w-3 h-3" />
                                    Start Chat
                                </Button>
                            </div>
                        </div>
                    )}
                </CardContent>

                {/* Error Alert */}
                {error && (
                    <div className="p-3 border-t border-neutral-20">
                        <Alert variant="error" className="flex items-center gap-2 text-xs">
                            <AlertCircle className="w-3 h-3" />
                            <span className="flex-1">{error}</span>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setError(null)}
                                className="h-4 w-4 p-0"
                            >
                                <X className="w-3 h-3" />
                            </Button>
                        </Alert>
                    </div>
                )}
            </Card>
        </div>
    )
}