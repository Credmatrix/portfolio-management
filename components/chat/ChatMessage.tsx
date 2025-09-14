'use client'

import { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
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

    // Custom components for markdown rendering
    const markdownComponents = {
        // Tables - Enhanced styling for better readability
        table: ({ children }: any) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-neutral-200 shadow-sm">
                <table className="min-w-full border-collapse bg-white text-sm">
                    {children}
                </table>
            </div>
        ),
        thead: ({ children }: any) => (
            <thead className="bg-gradient-to-r from-blue-50 to-indigo-50">
                {children}
            </thead>
        ),
        tbody: ({ children }: any) => (
            <tbody className="bg-white divide-y divide-neutral-200">
                {children}
            </tbody>
        ),
        tr: ({ children }: any) => (
            <tr className="hover:bg-neutral-25 transition-colors duration-150">
                {children}
            </tr>
        ),
        th: ({ children }: any) => (
            <th className="px-4 py-3 text-left font-semibold text-neutral-900 border-b border-neutral-200 text-xs uppercase tracking-wider">
                {children}
            </th>
        ),
        td: ({ children }: any) => (
            <td className="px-4 py-3 text-neutral-700 border-b border-neutral-100 whitespace-nowrap">
                {children}
            </td>
        ),
        // Headers - Enhanced with better spacing and styling
        h1: ({ children }: any) => (
            <h1 className="text-xl font-bold text-neutral-900 mb-4 mt-6 first:mt-0 pb-2 border-b border-neutral-200">
                {children}
            </h1>
        ),
        h2: ({ children }: any) => (
            <h2 className="text-lg font-bold text-neutral-900 mb-3 mt-5 first:mt-0 pb-1 border-b border-neutral-100">
                {children}
            </h2>
        ),
        h3: ({ children }: any) => (
            <h3 className="text-base font-semibold text-neutral-900 mb-2 mt-4 first:mt-0 text-blue-900">
                {children}
            </h3>
        ),
        h4: ({ children }: any) => (
            <h4 className="text-sm font-semibold text-neutral-800 mb-2 mt-3 first:mt-0 text-blue-800">
                {children}
            </h4>
        ),
        // Paragraphs and text - Better spacing
        p: ({ children }: any) => (
            <p className="mb-3 text-neutral-700 leading-relaxed text-sm">
                {children}
            </p>
        ),
        // Lists - Enhanced styling
        ul: ({ children }: any) => (
            <ul className="list-disc list-outside ml-4 mb-3 space-y-1 text-neutral-700">
                {children}
            </ul>
        ),
        ol: ({ children }: any) => (
            <ol className="list-decimal list-outside ml-4 mb-3 space-y-1 text-neutral-700">
                {children}
            </ol>
        ),
        li: ({ children }: any) => (
            <li className="text-neutral-700 text-sm leading-relaxed">
                {children}
            </li>
        ),
        // Code - Enhanced styling
        code: ({ children, className }: any) => {
            const isInline = !className
            if (isInline) {
                return (
                    <code className="bg-blue-50 text-blue-800 px-2 py-1 rounded text-xs font-mono border border-blue-200">
                        {children}
                    </code>
                )
            }
            return (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-xs font-mono mb-4 border border-gray-700">
                    <code>{children}</code>
                </pre>
            )
        },
        // Emphasis - Enhanced styling
        strong: ({ children }: any) => (
            <strong className="font-semibold text-neutral-900 bg-yellow-100 px-1 rounded">
                {children}
            </strong>
        ),
        em: ({ children }: any) => (
            <em className="italic text-neutral-700 font-medium">
                {children}
            </em>
        ),
        // Blockquotes - Enhanced styling
        blockquote: ({ children }: any) => (
            <blockquote className="border-l-4 border-blue-400 pl-4 py-3 my-4 bg-gradient-to-r from-blue-50 to-blue-25 text-neutral-700 italic rounded-r-lg">
                {children}
            </blockquote>
        ),
        // Horizontal rule - Enhanced styling
        hr: () => (
            <hr className="border-t-2 border-gradient-to-r from-transparent via-neutral-300 to-transparent my-6" />
        ),
        // Links - Enhanced styling
        a: ({ children, href }: any) => (
            <a
                href={href}
                className="text-blue-600 hover:text-blue-800 underline decoration-2 underline-offset-2 hover:bg-blue-50 px-1 rounded transition-colors"
                target="_blank"
                rel="noopener noreferrer"
            >
                {children}
            </a>
        )
    }

    return (
        <div className={`group flex gap-2 ${isUser ? 'flex-row-reverse' : ''}`}>
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
                    ) : isUser ? (
                        // Simple text rendering for user messages
                        <div className="whitespace-pre-wrap">
                            {message.content}
                        </div>
                    ) : (
                        // Full markdown rendering for assistant messages
                        <div className="markdown-content">
                            <ReactMarkdown
                                remarkPlugins={[remarkGfm]}
                                components={markdownComponents}
                            >
                                {message.content}
                            </ReactMarkdown>
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