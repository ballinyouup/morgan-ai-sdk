"use client"

import { Phone, Video, MoreVertical, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import type { Conversation } from "./chat-interface"

interface ChatHeaderProps {
    conversation: Conversation
}

export function ChatHeader({ conversation }: ChatHeaderProps) {
    return (
        <div className="flex items-center justify-between border-b border-border bg-card px-6 py-4">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-border">
                    <AvatarFallback className="bg-primary text-primary-foreground text-sm font-medium">
                        {conversation.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <h2 className="text-base font-semibold text-foreground">{conversation.name}</h2>
                    <p className="text-sm text-muted-foreground">{conversation.role}</p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                    <FileText className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Phone className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <Video className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                </Button>
            </div>
        </div>
    )
}
