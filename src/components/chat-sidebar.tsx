"use client"

import { Scale, Search, Settings, Moon, Sun } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { Conversation } from "./chat-interface"
import { useTheme } from "next-themes"

interface ChatSidebarProps {
    conversations: Conversation[]
    selectedId: string
    onSelect: (id: string) => void
}

export function ChatSidebar({ conversations, selectedId, onSelect }: ChatSidebarProps) {
    const { theme, setTheme } = useTheme()

    const formatTime = (date: Date) => {
        const now = new Date()
        const diff = now.getTime() - date.getTime()
        const minutes = Math.floor(diff / 60000)
        const hours = Math.floor(diff / 3600000)
        const days = Math.floor(diff / 86400000)

        if (minutes < 60) return `${minutes}m`
        if (hours < 24) return `${hours}h`
        return `${days}d`
    }

    return (
        <div className="flex w-80 flex-col border-r border-border bg-card">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border p-4">
                <div className="flex items-center gap-2">
                    <Scale className="h-6 w-6 text-foreground" />
                    <h1 className="text-lg font-semibold text-foreground">LegalChat</h1>
                </div>
                <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                        {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>

                    <Button variant="ghost" size="icon">
                        <Settings className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Search */}
            <div className="p-3">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input placeholder="Search conversations..." className="pl-9 bg-background" />
                </div>
            </div>

            {/* Conversations */}
            <ScrollArea className="flex-1">
                <div className="space-y-1 p-2">
                    {conversations.map((conversation) => (
                        <button
                            key={conversation.id}
                            onClick={() => onSelect(conversation.id)}
                            className={cn(
                                "w-full rounded-lg p-3 text-left transition-colors hover:bg-accent",
                                selectedId === conversation.id && "bg-accent",
                            )}
                        >
                            <div className="flex items-start gap-3">
                                <Avatar className="h-10 w-10 border border-border">
                                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                                        {conversation.name
                                            .split(" ")
                                            .map((n) => n[0])
                                            .join("")}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex-1 overflow-hidden">
                                    <div className="flex items-center justify-between gap-2">
                                        <h3 className="text-sm font-semibold text-foreground truncate">{conversation.name}</h3>
                                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                      {formatTime(conversation.timestamp)}
                    </span>
                                    </div>
                                    <p className="text-xs text-muted-foreground mb-1">{conversation.role}</p>
                                    <div className="flex items-center justify-between gap-2">
                                        <p className="text-sm text-muted-foreground truncate">{conversation.lastMessage}</p>
                                        {conversation.unread && (
                                            <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                        {conversation.unread}
                      </span>
                                        )}
                                    </div>
                                    {conversation.caseNumber && (
                                        <p className="text-xs text-muted-foreground/70 mt-1 font-mono">{conversation.caseNumber}</p>
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>
            </ScrollArea>
        </div>
    )
}
