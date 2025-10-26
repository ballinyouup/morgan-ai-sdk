"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Mail, Loader2 } from "lucide-react"

interface EmailComposeDialogProps {
  caseId: string
  defaultSubject?: string
  onEmailSent?: (updatedCase: any) => void
}

export function EmailComposeDialog({ caseId, defaultSubject, onEmailSent }: EmailComposeDialogProps) {
  const [open, setOpen] = useState(false)
  const [emailTo, setEmailTo] = useState("")
  const [emailSubject, setEmailSubject] = useState("")
  const [emailContent, setEmailContent] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function openDialog() {
    setEmailTo("")
    setEmailSubject(defaultSubject || "")
    setEmailContent("")
    setError(null)
    setOpen(true)
  }

  async function handleSendEmail() {
    if (!emailTo || !emailSubject || !emailContent) {
      setError('Email recipient, subject, and content are required')
      return
    }

    try {
      setSending(true)
      setError(null)
      
      const response = await fetch(`/api/cases/${caseId}/email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: emailTo,
          subject: emailSubject,
          content: emailContent
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to send email')
      }

      const data = await response.json()
      
      // Reset form
      setEmailTo("")
      setEmailSubject("")
      setEmailContent("")
      setOpen(false)
      
      // Notify parent component
      if (onEmailSent) {
        onEmailSent(data.case)
      }
      
      // Show success message
      alert('Email sent successfully!')
    } catch (err) {
      console.error('Error sending email:', err)
      setError(err instanceof Error ? err.message : 'Failed to send email')
    } finally {
      setSending(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-fit" variant="default" onClick={openDialog}>
          <Mail className="h-4 w-4 mr-2" />
          Send Email
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Send Email</DialogTitle>
          <DialogDescription>
            Compose and send an email to the client. The email will be saved to the case communications.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          {error && (
            <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
              {error}
            </div>
          )}
          <div className="grid gap-2">
            <Label htmlFor="email-to">To</Label>
            <Input
              id="email-to"
              type="email"
              placeholder="client@example.com"
              value={emailTo}
              onChange={(e) => setEmailTo(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-subject">Subject</Label>
            <Input
              id="email-subject"
              type="text"
              placeholder="Email subject"
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              disabled={sending}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email-content">Message</Label>
            <Textarea
              id="email-content"
              placeholder="Enter your email message..."
              value={emailContent}
              onChange={(e) => setEmailContent(e.target.value)}
              rows={8}
              disabled={sending}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button onClick={handleSendEmail} disabled={sending}>
            {sending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            {sending ? 'Sending...' : 'Send Email'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
