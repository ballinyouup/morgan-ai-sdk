"use client"

import type React from "react"

import { useState } from "react"
import { Send, Paperclip, Smile } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

interface ChatInputProps {
    onSend: (message: string) => void
    disabled?: boolean
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
    const [message, setMessage] = useState("")

    const handleSend = () => {
        if (message.trim()) {
            onSend(message)
            setMessage("")
        }
    }

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    return (
        <div className="border-t border-border bg-card p-4">
            <div className="flex items-end gap-2">
                <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
                        <Paperclip className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="shrink-0" disabled={disabled}>
                        <Smile className="h-5 w-5" />
                    </Button>
                </div>
                <Textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type your message..."
                    className="min-h-[44px] max-h-32 resize-none bg-background"
                    rows={1}
                    disabled={disabled}
                />
                <Button onClick={handleSend} disabled={!message.trim() || disabled} size="icon" className="shrink-0">
                    <Send className="h-5 w-5" />
                </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 px-1">All communications are encrypted and confidential</p>
        </div>
    )
}
