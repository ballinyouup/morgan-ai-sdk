"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Mail, Phone, Calendar, FileText, Search, Clock, AlertCircle, MessageSquare } from "lucide-react"
import Link from "next/link"

type CommunicationType = "email" | "sms" | "call" | "meeting" | "document"

interface Communication {
  id: string
  caseId: string
  caseName: string
  type: CommunicationType
  subject: string
  from: string
  to: string
  date: string
  content: string
  attachments?: string[]
  case: {
    id: string
    clientName: string
    caseType: string
  }
}

export default function CommunicationsPage() {
  const [communications, setCommunications] = useState<Communication[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<CommunicationType | "all">("all")

  useEffect(() => {
    async function fetchCommunications() {
      try {
        setLoading(true)
        const response = await fetch('/api/communications')
        
        if (!response.ok) {
          throw new Error('Failed to fetch communications')
        }
        
        const data = await response.json()
        setCommunications(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCommunications()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p className="text-lg font-medium text-black">Loading communications...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 mx-auto" />
          <p className="text-lg font-medium">Error loading communications</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  // Filter by search only first
  const searchFiltered = communications.filter((comm) => {
    const matchesSearch =
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.to.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.caseName.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesSearch
  })

  // Calculate counts from search-filtered results
  const emailComms = searchFiltered.filter((c) => c.type === "email")
  const smsComms = searchFiltered.filter((c) => c.type === "sms")
  const callComms = searchFiltered.filter((c) => c.type === "call")
  const meetingComms = searchFiltered.filter((c) => c.type === "meeting")
  const documentComms = searchFiltered.filter((c) => c.type === "document")

  // Apply type filter for display
  const filteredComms = filterType === "all" 
    ? searchFiltered 
    : searchFiltered.filter((c) => c.type === filterType)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-black">Communications</h1>
          <p className="text-muted-foreground">Track all case-related communications</p>
        </div>
        <Button>New Communication</Button>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search communications..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8"
            />
          </div>
        </CardContent>
      </Card>

      {/* Communications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all" onClick={() => setFilterType("all")}>
            All <Badge className="ml-2">{searchFiltered.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="email" onClick={() => setFilterType("email")}>
            Emails <Badge className="ml-2">{emailComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="sms" onClick={() => setFilterType("sms")}>
            SMS <Badge className="ml-2">{smsComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="call" onClick={() => setFilterType("call")}>
            Calls <Badge className="ml-2">{callComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="meeting" onClick={() => setFilterType("meeting")}>
            Meetings <Badge className="ml-2">{meetingComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="document" onClick={() => setFilterType("document")}>
            Documents <Badge className="ml-2">{documentComms.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <CommunicationsList communications={filteredComms} />
        </TabsContent>

        <TabsContent value="email" className="space-y-4">
          <CommunicationsList communications={emailComms} />
        </TabsContent>

        <TabsContent value="sms" className="space-y-4">
          <CommunicationsList communications={smsComms} />
        </TabsContent>

        <TabsContent value="call" className="space-y-4">
          <CommunicationsList communications={callComms} />
        </TabsContent>

        <TabsContent value="meeting" className="space-y-4">
          <CommunicationsList communications={meetingComms} />
        </TabsContent>

        <TabsContent value="document" className="space-y-4">
          <CommunicationsList communications={documentComms} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CommunicationsList({ communications }: { communications: Communication[] }) {
  if (communications.length === 0) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">No communications found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your search</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {communications.map((comm) => (
        <Card key={comm.id}>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3 flex-1">
                {comm.type === "email" && <Mail className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "sms" && <MessageSquare className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "call" && <Phone className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "meeting" && <Calendar className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "document" && <FileText className="h-5 w-5 text-muted-foreground" />}
                <div className="flex-1">
                  <CardTitle className="text-base">{comm.subject}</CardTitle>
                  <CardDescription>
                    {comm.from} → {comm.to}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-1">
                    <Link href={`/cases/${comm.case.id}`} className="hover:underline">
                      {comm.caseName}
                    </Link>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline">{comm.type}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground whitespace-pre-line">{comm.content}</p>
            {comm.attachments && comm.attachments.length > 0 && (
              <div className="pt-2 border-t">
                <p className="text-xs font-medium mb-2">Attachments:</p>
                <div className="flex flex-wrap gap-2">
                  {comm.attachments.map((attachment, idx) => (
                    <Badge key={idx} variant="secondary">
                      <FileText className="h-3 w-3 mr-1" />
                      {attachment}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">{new Date(comm.date).toLocaleString()}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
