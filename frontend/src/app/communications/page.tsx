"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockCommunications } from "@/lib/mock-data"
import { Mail, Phone, Calendar, FileText, Search } from "lucide-react"
import type { Communication, CommunicationType } from "@/lib/types"

export default function CommunicationsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterType, setFilterType] = useState<CommunicationType | "all">("all")

  const filteredComms = mockCommunications.filter((comm) => {
    const matchesSearch =
      comm.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.from.toLowerCase().includes(searchQuery.toLowerCase()) ||
      comm.to.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesType = filterType === "all" || comm.type === filterType
    return matchesSearch && matchesType
  })

  const emailComms = filteredComms.filter((c) => c.type === "email")
  const callComms = filteredComms.filter((c) => c.type === "call")
  const meetingComms = filteredComms.filter((c) => c.type === "meeting")
  const documentComms = filteredComms.filter((c) => c.type === "document")

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
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
            All <Badge className="ml-2">{filteredComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="email" onClick={() => setFilterType("email")}>
            Emails <Badge className="ml-2">{emailComms.length}</Badge>
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
              <div className="flex items-center gap-3">
                {comm.type === "email" && <Mail className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "call" && <Phone className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "meeting" && <Calendar className="h-5 w-5 text-muted-foreground" />}
                {comm.type === "document" && <FileText className="h-5 w-5 text-muted-foreground" />}
                <div>
                  <CardTitle className="text-base">{comm.subject}</CardTitle>
                  <CardDescription>
                    {comm.from} → {comm.to}
                  </CardDescription>
                </div>
              </div>
              <Badge variant="outline">{comm.type}</Badge>
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
