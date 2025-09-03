'use client'

import { useState } from 'react'
import { ChatMessage } from '@/types/ai-chat.types'
import { PortfolioCompany } from '@/types/portfolio.types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
    Bot,
    User,
    Copy,
    ThumbsUp,
    ThumbsDown,
    RefreshCw,
    Clock,
    Zap
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessageProps {
    message: ChatMessage
    company: PortfolioCompany
    isLoading?: boolean
    onRetry?: () => void
}

export function ChatMessageComponent({ message, company, isLoading, onRetry }: ChatMessageProps) {
    const [copied, setCopied] = useState(false)
    const [feedback, setFeedback] = useState<'up' | 'down' | null>(null)

    const isUser = message.role === 'user'
    const isAssistant = message.role === 'assistant'

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(message.content)
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        } catch (error) {
            console.error('Failed to copy message:', error)
        }
    }

    const handleFeedback = (type: 'up' | 'down') => {
        setFeedback(type)
        // TODO: Send feedback to analytics
        console.log(`Feedback: ${type} for message ${message.id}`)
    }

    const formatMessageContent = (content: string) => {
        // Simple markdown-like formatting
        return content
            .split('\n')
            .map((line, index) => {
                // Handle bullet points
                if (line.trim().startsWith('•') || line.trim().startsWith('-')) {
                    return (
                        <li key={index} className="ml-4">
                            {line.trim().substring(1).trim()}
                        </li>
                    )
                }

                // Handle numbered lists
                if (/^\d+\./.test(line.trim())) {
                    return (
                        <li key={index} className="ml-4">
                            {line.trim().replace(/^\d+\.\s*/, '')}
                        </li>
                    )
                }

                // Handle bold text (simple **text** format)
                const boldFormatted = line.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')

                return (
                    <p key={index} className={line.trim() === '' ? 'h-2' : ''}>
                        <span dangerouslySetInnerHTML={{ __html: boldFormatted }} />
                    </p>
                )
            })
    }

    return (
        <div className={`flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
            {/* Avatar */}
            <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${isUser
                    ? 'bg-blue-600 text-white'
                    : 'bg-neutral-100 text-neutral-600'
                }`}>
                {isUser ? (
                    <User className="w-3 h-3" />
                ) : (
                    <Bot className="w-3 h-3" />
                )}
            </div>

            {/* Message Content */}
            <div className={`flex-1 max-w-[85%] ${isUser ? 'flex flex-col items-end' : ''}`}>
                {/* Message Bubble */}
                <div className={`rounded-lg p-2 text-sm ${isUser
                        ? 'bg-blue-600 text-white'
                        : 'bg-neutral-5 text-neutral-90 border border-neutral-20'
                    }`}>
                    {isLoading ? (
                        <div className="flex items-center gap-2 text-neutral-60">
                            <RefreshCw className="w-3 h-3 animate-spin" />
                            Generating response...
                        </div>
                    ) : (
                        <div className="prose prose-sm max-w-none [&>p]:mb-1 [&>li]:mb-0">
                            {formatMessageContent(message.content)}
                        </div>
                    )}
                </div>

                {/* Message Metadata - Compact */}
                <div className={`flex items-center gap-1 mt-1 ${isUser ? 'flex-row-reverse' : ''
                    }`}>
                    <span className="text-xs text-neutral-50">
                        {formatDistanceToNow(new Date(String(message.created_at)), { addSuffix: true })}
                    </span>

                    {isAssistant && message.model_used && (
                        <Badge variant="info" size="sm" className="text-xs">
                            {message.model_used.includes('sonnet') ? 'Sonnet' :
                                message.model_used.includes('haiku') ? 'Haiku' :
                                    message.model_used.includes('opus') ? 'Opus' : 'AI'}
                        </Badge>
                    )}
                </div>

                {/* Action Buttons - Compact */}
                {!isLoading && (
                    <div className={`flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity ${isUser ? 'flex-row-reverse' : ''
                        }`}>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleCopy}
                            className="h-5 px-1 text-xs"
                        >
                            <Copy className="w-2 h-2" />
                        </Button>

                        {isAssistant && (
                            <>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFeedback('up')}
                                    className={`h-5 px-1 text-xs ${feedback === 'up' ? 'text-green-600' : ''
                                        }`}
                                >
                                    <ThumbsUp className="w-2 h-2" />
                                </Button>

                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleFeedback('down')}
                                    className={`h-5 px-1 text-xs ${feedback === 'down' ? 'text-red-600' : ''
                                        }`}
                                >
                                    <ThumbsDown className="w-2 h-2" />
                                </Button>
                            </>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}