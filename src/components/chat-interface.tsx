"use client"

import { useState } from "react"
import { useChat } from "@ai-sdk/react"
import { DefaultChatTransport } from "ai"
import { ChatSidebar } from "./chat-sidebar"
import { ChatMessages } from "./chat-messages"
import { ChatInput } from "./chat-input"
import { ChatHeader } from "./chat-header"

export interface Message {
    id: string
    content: string
    sender: "user" | "attorney"
    timestamp: Date
    read?: boolean
}

export interface Conversation {
    id: string
    name: string
    role: string
    lastMessage: string
    timestamp: Date
    unread?: number
    avatar?: string
    caseNumber?: string
}

const mockConversations: Conversation[] = [
    {
        id: "1",
        name: "Sarah Mitchell",
        role: "Senior Partner",
        lastMessage: "I reviewed the contract amendments...",
        timestamp: new Date(Date.now() - 1000 * 60 * 5),
        unread: 2,
        caseNumber: "CASE-2024-1847",
    },
    {
        id: "2",
        name: "James Rodriguez",
        role: "Corporate Attorney",
        lastMessage: "The merger documents are ready for review",
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        caseNumber: "CASE-2024-1923",
    },
    {
        id: "3",
        name: "Emily Chen",
        role: "Litigation Specialist",
        lastMessage: "Court date has been confirmed",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2),
        unread: 1,
        caseNumber: "CASE-2024-1756",
    },
    {
        id: "4",
        name: "Michael Thompson",
        role: "Estate Planning",
        lastMessage: "Trust documents finalized",
        timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5),
        caseNumber: "CASE-2024-1689",
    },
]

export function ChatInterface() {
    const [selectedConversation, setSelectedConversation] = useState<string>("1")
    const [conversations, setConversations] = useState<Conversation[]>(mockConversations)

    const { messages, sendMessage, status } = useChat({
        transport: new DefaultChatTransport({ api: "/api/chat" }),
    })

    const currentConversation = conversations.find((c) => c.id === selectedConversation)

    const handleSendMessage = (content: string) => {
        sendMessage({ text: content })

        // Update conversation last message
        setConversations((prev) =>
            prev.map((conv) =>
                conv.id === selectedConversation ? { ...conv, lastMessage: content, timestamp: new Date() } : conv,
            ),
        )
    }

    return (
        <div className="flex h-screen bg-background">
            <ChatSidebar conversations={conversations} selectedId={selectedConversation} onSelect={setSelectedConversation} />
            <div className="flex flex-1 flex-col">
                {currentConversation && (
                    <>
                        <ChatHeader conversation={currentConversation} />
                        <ChatMessages messages={messages} />
                        <ChatInput onSend={handleSendMessage} />
                    </>
                )}
            </div>
        </div>
    )
}
