"use client"

import * as React from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
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
} from "lucide-react"
import { notFound } from "next/navigation"
import { use, useEffect, useState } from "react"

interface CaseData {
  id: string
  clientName: string
  caseType: string
  status: string
  priority: string
  assignedTo: string
  createdAt: string
  lastActivity: string
  description: string
  nextAction?: string
  emails: Array<{
    id: string
    from: string
    to: string
    subject: string
    content: string
    createdAt: string
  }>
  files: Array<{
    id: string
    name: string
    url: string
    type: string
    size: string
    uploadedAt: string
    uploadedBy: string
  }>
  textMessages: Array<{
    id: string
    from: string
    to: string
    text: string
    createdAt: string
  }>
  reasonChains: Array<{
    id: string
    agentType: string
    action: string
    reasoning: string
    confidence?: number
    timestamp: string
  }>
}

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const [case_, setCase] = useState<CaseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchCase() {
      try {
        setLoading(true)
        const response = await fetch(`/api/cases/${id}`)
        
        if (!response.ok) {
          if (response.status === 404) {
            notFound()
          }
          throw new Error('Failed to fetch case')
        }
        
        const data = await response.json()
        setCase(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCase()
  }, [id])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p className="text-lg font-medium">Loading case details...</p>
        </div>
      </div>
    )
  }

  if (error || !case_) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 mx-auto" />
          <p className="text-lg font-medium">Error loading case</p>
          <p className="text-sm text-muted-foreground">{error || 'Case not found'}</p>
        </div>
      </div>
    )
  }

  const caseCommunications = case_.emails
  const caseActions = case_.reasonChains
  const caseFiles = case_.files

export default function CaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // `params` can be a promise in the app router. Unwrap it with React.use() in a client
  // component before accessing properties.
  const { id } = React.use(params)

  if (!case_) {
    notFound()
  }

  const getFileIcon = (type: string) => {
    switch (type) {
      case "audio":
        return <FileAudio className="h-5 w-5 text-muted-foreground" />
      case "image":
        return <FileImage className="h-5 w-5 text-muted-foreground" />
      case "pdf":
      case "document":
      case "csv":
      default:
        return <FileText className="h-5 w-5 text-muted-foreground" />
    }
  }

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
          <h1 className="text-3xl font-bold tracking-tight">{case_.clientName}</h1>
          <p className="text-muted-foreground">{case_.caseType}</p>
        </div>
        <Button>Edit Case</Button>
      </div>

      {/* Case Overview */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Case Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge
                variant={
                  case_.priority === "urgent" ? "destructive" : case_.priority === "high" ? "default" : "secondary"
                }
              >
                {case_.priority} priority
              </Badge>
              <Badge variant="outline">{case_.status}</Badge>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium mb-1">Description</p>
                <p className="text-sm text-muted-foreground">{case_.description}</p>
              </div>

              <Separator />

              <div className="grid gap-3 md:grid-cols-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Assigned To</p>
                    <p className="text-sm font-medium">{case_.assignedTo}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">{new Date(case_.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                    <p className="text-sm font-medium">{new Date(case_.lastActivity).toLocaleDateString()}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Next Action</p>
                    <p className="text-sm font-medium">{case_.nextAction || "None scheduled"}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Stats</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Communications</span>
              <span className="text-2xl font-bold">{caseCommunications.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Agent Actions</span>
              <span className="text-2xl font-bold">{caseActions.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Files</span>
              <span className="text-2xl font-bold">{caseFiles.length}</span>
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Days Active</span>
              <span className="text-2xl font-bold">
                {Math.floor((new Date().getTime() - new Date(case_.createdAt).getTime()) / (1000 * 60 * 60 * 24))}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Communications and Actions */}
      <Tabs defaultValue="communications" className="space-y-4">
        <TabsList>
          <TabsTrigger value="communications">
            Communications <Badge className="ml-2">{caseCommunications.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="actions">
            Agent Actions <Badge className="ml-2">{caseActions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="documents">
            Documents <Badge className="ml-2">{caseFiles.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
        </TabsList>

        <TabsContent value="communications" className="space-y-4">
          {caseCommunications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No communications yet</p>
                <p className="text-sm text-muted-foreground">Communications will appear here</p>
              </CardContent>
            </Card>
          ) : (
            caseCommunications.map((comm) => (
              <Card key={comm.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base">{comm.subject}</CardTitle>
                        <CardDescription>
                          {comm.from} → {comm.to}
                        </CardDescription>
                      </div>
                    </div>
                    <Badge variant="outline">email</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground whitespace-pre-line">{comm.content}</p>
                  <p className="text-xs text-muted-foreground">{new Date(comm.createdAt).toLocaleString()}</p>
                </CardContent>
              </Card>
            ))
          )}
          <Button className="w-full bg-transparent" variant="outline">
            <Mail className="h-4 w-4 mr-2" />
            New Communication
          </Button>
        </TabsContent>

        <TabsContent value="actions" className="space-y-4">
          {caseActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No agent actions</p>
                <p className="text-sm text-muted-foreground">AI-suggested actions will appear here</p>
              </CardContent>
            </Card>
          ) : (
            caseActions.map((action) => (
              <Card key={action.id}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-base">{action.action}</CardTitle>
                        {action.confidence && (
                          <Badge
                            variant={
                              action.confidence >= 0.8
                                ? "default"
                                : action.confidence >= 0.5
                                  ? "secondary"
                                  : "outline"
                            }
                          >
                            {Math.round(action.confidence * 100)}% confidence
                          </Badge>
                        )}
                      </div>
                      <CardDescription>{action.agentType}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-sm font-medium mb-1">AI Reasoning</p>
                    <p className="text-sm text-muted-foreground">{action.reasoning}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {new Date(action.timestamp).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="documents">
          <Card>
            <CardHeader>
              <CardTitle>Case Files</CardTitle>
              <CardDescription>All documents and files related to this case</CardDescription>
            </CardHeader>
            <CardContent>
              {caseFiles.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-lg font-medium">No documents</p>
                  <p className="text-sm text-muted-foreground">Case documents will appear here</p>
                  <Button className="mt-4 bg-transparent" variant="outline">
                    <FileText className="h-4 w-4 mr-2" />
                    Upload Document
                  </Button>
                </div>
              ) : (
                <>
                  <ScrollArea className="h-[600px] pr-4">
                    <div className="space-y-3">
                      {caseFiles.map((file) => (
                        <div
                          key={file.id}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {getFileIcon(file.type)}
                            <div className="flex-1 min-w-0">
                              <a
                                href={file.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-sm truncate hover:underline hover:text-primary block"
                              >
                                {file.name}
                              </a>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant="secondary" className="text-xs">
                                  {file.type.toUpperCase()}
                                </Badge>
                                <span className="text-xs text-muted-foreground">{file.size}</span>
                                <span className="text-xs text-muted-foreground">•</span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(file.uploadedAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm" asChild>
                            <a href={file.url} target="_blank" rel="noopener noreferrer">
                              <Download className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="mt-4 pt-4 border-t">
                    <Button className="w-full bg-transparent" variant="outline">
                      <FileText className="h-4 w-4 mr-2" />
                      Upload New Document
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="timeline">
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Clock className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Timeline view</p>
              <p className="text-sm text-muted-foreground">Case timeline will be displayed here</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}