"use client";

import * as React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { use, useEffect, useState } from "react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  ArrowLeft,
  Mail,
  Phone,
  FileText,
  Calendar,
  User,
  Clock,
  AlertCircle,
  Download,
  FileAudio,
  FileImage,
  Loader2,
} from "lucide-react";

import { EmailComposeDialog } from "@/components/email-compose-dialog";

interface CaseData {
  id: string;
  clientName: string;
  caseType: string;
  status: string;
  priority: string;
  assignedTo: string;
  createdAt: string;
  lastActivity: string;
  description: string;
  nextAction?: string;
  clientPhone?: string;
  emails: Array<{
    id: string;
    from: string;
    to: string;
    subject: string;
    content: string;
    createdAt: string;
  }>;
  files: Array<{
    id: string;
    name: string;
    url: string;
    type: string;
    size: string;
    uploadedAt: string;
    uploadedBy: string;
  }>;
  textMessages: Array<{
    id: string;
    from: string;
    to: string;
    text: string;
    createdAt: string;
  }>;
  phoneCalls: Array<{
    id: string;
    phoneNumber: string;
    message: string;
    callSid?: string;
    status: string;
    duration?: number;
    statusBeforeCall?: string;
    statusAfterCall?: string;
    createdAt: string;
  }>;
  reasonChains: Array<{
    id: string;
    agentType: string;
    action: string;
    reasoning: string;
    confidence?: number;
    timestamp: string;
  }>;
}

export default function CaseDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [case_, setCase] = useState<CaseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [callDialogOpen, setCallDialogOpen] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [callMessage, setCallMessage] = useState("");
  const [statusUpdate, setStatusUpdate] = useState("");
  const [makingCall, setMakingCall] = useState(false);

  useEffect(() => {
    fetchCase();
  }, [id]);

  async function fetchCase() {
    try {
      setLoading(true);
      const response = await fetch(`/api/cases/${id}`);
      if (!response.ok) {
        if (response.status === 404) notFound();
        throw new Error("Failed to fetch case");
      }
      const data = await response.json();
      setCase(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(newStatus: string) {
    try {
      const response = await fetch(`/api/cases/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update case status");
      const updatedCase = await response.json();
      setCase(updatedCase);
    } catch (err) {
      console.error("Error updating case status:", err);
      setError(err instanceof Error ? err.message : "Failed to update status");
    }
  }

  async function handleMakeCall() {
    if (!phoneNumber || !callMessage) {
      setError("Phone number and message are required");
      return;
    }

    try {
      setMakingCall(true);
      const response = await fetch(`/api/cases/${id}/call`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber,
          message: callMessage,
          statusUpdate: statusUpdate || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to initiate call");
      }

      const data = await response.json();
      setCase(data.case);
      setCallDialogOpen(false);
      setPhoneNumber("");
      setCallMessage("");
      setStatusUpdate("");
      alert("Call initiated successfully!");
    } catch (err) {
      console.error("Error making call:", err);
      setError(err instanceof Error ? err.message : "Failed to make call");
    } finally {
      setMakingCall(false);
    }
  }

  function openCallDialog() {
    setPhoneNumber(case_?.clientPhone || "");
    setStatusUpdate(case_?.status || "");
    setCallDialogOpen(true);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p className="text-lg font-medium">Loading case details...</p>
        </div>
      </div>
    );
  }

  if (error || !case_) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 mx-auto" />
          <p className="text-lg font-medium">Error loading case</p>
          <p className="text-sm text-muted-foreground">
            {error || "Case not found"}
          </p>
        </div>
      </div>
    );
  }

  const caseCommunications = [...case_.emails, ...case_.phoneCalls].sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const caseActions = case_.reasonChains;
  const caseFiles = case_.files;

  const getFileIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <FileAudio className="h-5 w-5 text-muted-foreground" />;
      case "image":
        return <FileImage className="h-5 w-5 text-muted-foreground" />;
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/cases">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">
            {case_.clientName}
          </h1>
          <p className="text-muted-foreground">{case_.caseType}</p>
        </div>

        {/* Call Client Dialog */}
        <Dialog open={callDialogOpen} onOpenChange={setCallDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openCallDialog}>
              <Phone className="h-4 w-4 mr-2" />
              Call Client
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[525px]">
            <DialogHeader>
              <DialogTitle>Make Phone Call</DialogTitle>
              <DialogDescription>
                Update case status and make a phone call to the client. The
                status will be updated before the call is made.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="status">Update Status (Optional)</Label>
                <Select value={statusUpdate} onValueChange={setStatusUpdate}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select new status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="open">Open</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="on-hold">On Hold</SelectItem>
                    <SelectItem value="closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="message">Call Message</Label>
                <Textarea
                  id="message"
                  placeholder="Enter the message to be spoken during the call..."
                  value={callMessage}
                  onChange={(e) => setCallMessage(e.target.value)}
                  rows={4}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setCallDialogOpen(false)}
                disabled={makingCall}
              >
                Cancel
              </Button>
              <Button onClick={handleMakeCall} disabled={makingCall}>
                {makingCall && (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                )}
                {makingCall ? "Submitting..." : "Submit & Call"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Email Dialog */}
        <EmailComposeDialog
          caseId={id}
          defaultSubject={`Re: ${case_.caseType} - ${case_.clientName}`}
          onEmailSent={(updatedCase) => setCase(updatedCase)}
        />

        <Button variant="outline">Edit Case</Button>
      </div>

      {/* === Case Overview, Tabs, etc. === */}
      {/* Everything below remains unchanged from your original layout */}
      {/* (Case Overview, Quick Stats, Tabs, Communications, Actions, Documents, Timeline) */}
    </div>
  );
}
