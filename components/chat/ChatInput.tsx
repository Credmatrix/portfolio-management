'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/Button'
import { Send } from 'lucide-react'

interface ChatInputProps {
    onSendMessage: (content: string) => void
    isLoading: boolean
    disabled?: boolean
    placeholder?: string
}

export function ChatInput({ onSendMessage, isLoading, disabled, placeholder }: ChatInputProps) {
    const [message, setMessage] = useState('')

    const textareaRef = useRef<HTMLTextAreaElement>(null)

    // Auto-resize textarea
    useEffect(() => {
        const textarea = textareaRef.current
        if (textarea) {
            textarea.style.height = 'auto'
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`
        }
    }, [message])

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()

        const trimmedMessage = message.trim()
        if (!trimmedMessage || isLoading || disabled) return

        onSendMessage(trimmedMessage)
        setMessage('')
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSubmit(e)
        }
    }

    const handleVoiceInput = () => {
        // TODO: Implement voice input functionality
        // setIsRecording(!isRecording)
        console.log('Voice input not yet implemented')
    }

    const suggestedQuestions = [
        "Prepare a credit assessment report",
        "Analyze the financial performance",
        "What are the key risk factors?",
        "Show me the compliance status",
        "Compare with industry benchmarks",
        "What's the turnover trend?",
        "Evaluate the directors and shareholding pattern",
        "Assess the legal and litigation risks",
        "Review the banking relationships",
        "Provide credit limit recommendations"
    ]

    const handleSuggestedQuestion = (question: string) => {
        if (!isLoading && !disabled) {
            onSendMessage(question)
        }
    }

    return (
        <div className="space-y-2">
            {/* Suggested Questions - Enhanced */}
            {message === '' && (
                <div className="space-y-2">
                    <div className="text-xs text-neutral-60 font-medium">Quick Actions:</div>
                    <div className="flex flex-wrap gap-1">
                        {suggestedQuestions.slice(0, 3).map((question, index) => (
                            <Button
                                key={index}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestedQuestion(question)}
                                disabled={isLoading || disabled}
                                className="text-xs h-7 px-3 text-neutral-60 hover:text-neutral-90 border-neutral-20 hover:border-blue-300 hover:bg-blue-50 transition-colors"
                            >
                                {question}
                            </Button>
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-1">
                        {suggestedQuestions.slice(3, 6).map((question, index) => (
                            <Button
                                key={index + 3}
                                variant="ghost"
                                size="sm"
                                onClick={() => handleSuggestedQuestion(question)}
                                disabled={isLoading || disabled}
                                className="text-xs h-6 px-2 text-neutral-50 hover:text-neutral-70 hover:bg-neutral-10"
                            >
                                {question}
                            </Button>
                        ))}
                    </div>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="relative">
                <div className="relative flex items-end gap-2 p-2 bg-neutral-5 border border-neutral-20 rounded-lg focus-within:border-blue-300 focus-within:ring-1 focus-within:ring-blue-100">
                    {/* Textarea */}
                    <textarea
                        ref={textareaRef}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder || "Ask a question..."}
                        disabled={disabled || isLoading}
                        className="flex-1 resize-none bg-transparent border-none outline-none placeholder-neutral-50 text-neutral-90 text-sm min-h-[20px] max-h-[80px]"
                        rows={1}
                    />

                    {/* Send Button */}
                    <Button
                        type="submit"
                        size="sm"
                        disabled={!message.trim() || disabled || isLoading}
                        className="h-6 w-6 p-0 bg-blue-600 hover:bg-blue-700 disabled:bg-neutral-20 flex-shrink-0"
                    >
                        <Send className="w-3 h-3" />
                    </Button>
                </div>
            </form>

            {/* Input Hints - Compact */}
            {isLoading && (
                <div className="text-xs text-blue-600 text-center">
                    AI is thinking...
                </div>
            )}
        </div>
    )
}