'use client'

import { useState } from 'react'
import { ChatConversation } from '@/types/ai-chat.types'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import {
    MessageSquare,
    MoreVertical,
    Trash2,
    Archive,
    Edit3,
    Clock
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface ConversationListProps {
    conversations: ChatConversation[]
    activeConversationId?: string
    onSelectConversation: (conversation: ChatConversation) => void
    onDeleteConversation: (conversationId: string) => void
    onArchiveConversation: (conversationId: string) => void
}

export function ConversationList({
    conversations,
    activeConversationId,
    onSelectConversation,
    onDeleteConversation,
    onArchiveConversation
}: ConversationListProps) {
    const [showMenuFor, setShowMenuFor] = useState<string | null>(null)
    const [editingTitle, setEditingTitle] = useState<string | null>(null)
    const [newTitle, setNewTitle] = useState('')

    const handleMenuToggle = (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        setShowMenuFor(showMenuFor === conversationId ? null : conversationId)
    }

    const handleEdit = (conversation: ChatConversation, e: React.MouseEvent) => {
        e.stopPropagation()
        setEditingTitle(conversation.id)
        setNewTitle(conversation.title)
        setShowMenuFor(null)
    }

    const handleSaveTitle = async (conversationId: string) => {
        try {
            const response = await fetch(`/api/chat/conversations/${conversationId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'update_title', title: newTitle })
            })

            if (response.ok) {
                // Update local state would be handled by parent component
                setEditingTitle(null)
                setNewTitle('')
            }
        } catch (error) {
            console.error('Error updating title:', error)
        }
    }

    const handleDelete = (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        if (window.confirm('Are you sure you want to delete this conversation?')) {
            onDeleteConversation(conversationId)
        }
        setShowMenuFor(null)
    }

    const handleArchive = (conversationId: string, e: React.MouseEvent) => {
        e.stopPropagation()
        onArchiveConversation(conversationId)
        setShowMenuFor(null)
    }

    if (conversations.length === 0) {
        return (
            <div className="p-4 text-center">
                <div className="w-12 h-12 bg-neutral-10 rounded-full flex items-center justify-center mx-auto mb-3">
                    <MessageSquare className="w-6 h-6 text-neutral-50" />
                </div>
                <p className="text-sm text-neutral-60 mb-2">No conversations yet</p>
                <p className="text-xs text-neutral-50">
                    Start a new conversation to begin analyzing this company with AI
                </p>
            </div>
        )
    }

    return (
        <div className="space-y-1 p-2">
            {conversations.map((conversation) => (
                <div
                    key={conversation.id}
                    className={`relative group rounded-lg p-3 cursor-pointer transition-colors ${activeConversationId === conversation.id
                            ? 'bg-blue-50 border border-blue-200'
                            : 'hover:bg-neutral-5 border border-transparent'
                        }`}
                    onClick={() => onSelectConversation(conversation)}
                >
                    <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                            {editingTitle === conversation.id ? (
                                <input
                                    type="text"
                                    value={newTitle}
                                    onChange={(e) => setNewTitle(e.target.value)}
                                    onBlur={() => handleSaveTitle(conversation.id)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            handleSaveTitle(conversation.id)
                                        } else if (e.key === 'Escape') {
                                            setEditingTitle(null)
                                            setNewTitle('')
                                        }
                                    }}
                                    className="w-full text-sm font-medium bg-white border border-neutral-20 rounded px-2 py-1"
                                    autoFocus
                                    onClick={(e) => e.stopPropagation()}
                                />
                            ) : (
                                <h4 className="text-sm font-medium text-neutral-90 truncate">
                                    {conversation.title}
                                </h4>
                            )}

                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-neutral-50 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(String(conversation.updated_at)), { addSuffix: true })}
                                </span>

                                {activeConversationId === conversation.id && (
                                    <Badge variant="info" size="sm">
                                        Active
                                    </Badge>
                                )}
                            </div>
                        </div>

                        {/* Menu Button */}
                        <div className="relative">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={(e) => handleMenuToggle(conversation.id, e)}
                                className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <MoreVertical className="w-3 h-3" />
                            </Button>

                            {/* Dropdown Menu */}
                            {showMenuFor === conversation.id && (
                                <div className="absolute right-0 top-full mt-1 bg-white border border-neutral-20 rounded-lg shadow-lg z-10 min-w-[120px]">
                                    <div className="py-1">
                                        <button
                                            onClick={(e) => handleEdit(conversation, e)}
                                            className="w-full px-3 py-2 text-left text-sm text-neutral-70 hover:bg-neutral-5 flex items-center gap-2"
                                        >
                                            <Edit3 className="w-3 h-3" />
                                            Rename
                                        </button>
                                        <button
                                            onClick={(e) => handleArchive(conversation.id, e)}
                                            className="w-full px-3 py-2 text-left text-sm text-neutral-70 hover:bg-neutral-5 flex items-center gap-2"
                                        >
                                            <Archive className="w-3 h-3" />
                                            Archive
                                        </button>
                                        <button
                                            onClick={(e) => handleDelete(conversation.id, e)}
                                            className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                                        >
                                            <Trash2 className="w-3 h-3" />
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
}