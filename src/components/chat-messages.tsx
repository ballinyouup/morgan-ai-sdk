"use client"

import { useEffect, useRef } from "react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"
import type { UIMessage } from "ai"

interface ChatMessagesProps {
    messages: UIMessage[]
}

export function ChatMessages({ messages }: ChatMessagesProps) {
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }
    }, [messages])

    const formatTime = (date: Date) => {
        return date.toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        })
    }

    return (
        <ScrollArea className="flex-1 px-6 py-4" ref={scrollRef}>
            <div className="space-y-6">
                {messages.map((message, index) => {
                    const showAvatar = index === 0 || messages[index - 1].role !== message.role
                    const isUser = message.role === "user"

                    return (
                        <div key={message.id} className={cn("flex gap-3", isUser && "flex-row-reverse")}>
                            {showAvatar ? (
                                <Avatar className="h-8 w-8 border border-border shrink-0">
                                    <AvatarFallback
                                        className={cn(
                                            "text-xs font-medium",
                                            isUser ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                        )}
                                    >
                                        {isUser ? "YO" : "AI"}
                                    </AvatarFallback>
                                </Avatar>
                            ) : (
                                <div className="w-8 shrink-0" />
                            )}
                            <div className={cn("flex flex-col gap-1 max-w-[70%]", isUser && "items-end")}>
                                <div
                                    className={cn(
                                        "rounded-lg px-4 py-2.5",
                                        isUser ? "bg-primary text-primary-foreground" : "bg-muted text-foreground",
                                    )}
                                >
                                    {message.parts.map((part, i) => {
                                        if (part.type === "text") {
                                            return (
                                                <p key={i} className="text-sm leading-relaxed text-pretty">
                                                    {part.text}
                                                </p>
                                            )
                                        }
                                        return null
                                    })}
                                </div>
                                <span className="text-xs text-muted-foreground px-1">
                </span>
                            </div>
                        </div>
                    )
                })}
            </div>
        </ScrollArea>
    )
}
