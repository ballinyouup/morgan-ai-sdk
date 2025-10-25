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
    <div className="space-y-6 p-6">
      {/* Glassy header section */}
      <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Communications</h1>
            <p className="text-gray-400">Track all case-related communications</p>
          </div>
          <Button className="bg-yellow-300 text-gray-900 hover:bg-yellow-400 font-medium">New Communication</Button>
        </div>
      </div>

      {/* Search */}
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
        <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
          <CardContent className="pt-6">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search communications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-yellow-300/50 focus:ring-yellow-300/20"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Communications Tabs */}
      <Tabs defaultValue="all" className="space-y-4">
        <TabsList className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50">
          <TabsTrigger value="all" onClick={() => setFilterType("all")} className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            All <Badge className="ml-2 bg-yellow-300/20 text-yellow-300">{filteredComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="email" onClick={() => setFilterType("email")} className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Emails <Badge className="ml-2 bg-gray-700 text-gray-300">{emailComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="call" onClick={() => setFilterType("call")} className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Calls <Badge className="ml-2 bg-gray-700 text-gray-300">{callComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="meeting" onClick={() => setFilterType("meeting")} className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Meetings <Badge className="ml-2 bg-gray-700 text-gray-300">{meetingComms.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="document" onClick={() => setFilterType("document")} className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Documents <Badge className="ml-2 bg-gray-700 text-gray-300">{documentComms.length}</Badge>
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
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
        <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-white">No communications found</p>
            <p className="text-sm text-gray-400">Try adjusting your search</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {communications.map((comm) => (
        <div key={comm.id} className="relative group">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  {comm.type === "email" && <Mail className="h-5 w-5 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />}
                  {comm.type === "call" && <Phone className="h-5 w-5 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />}
                  {comm.type === "meeting" && <Calendar className="h-5 w-5 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />}
                  {comm.type === "document" && <FileText className="h-5 w-5 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />}
                  <div>
                    <CardTitle className="text-base text-white">{comm.subject}</CardTitle>
                    <CardDescription className="text-gray-400">
                      {comm.from} → {comm.to}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="outline" className="border-gray-600 text-gray-300">{comm.type}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-gray-400 whitespace-pre-line">{comm.content}</p>
              {comm.attachments && comm.attachments.length > 0 && (
                <div className="pt-2 border-t border-gray-600">
                  <p className="text-xs font-medium mb-2 text-white">Attachments:</p>
                  <div className="flex flex-wrap gap-2">
                    {comm.attachments.map((attachment, idx) => (
                      <Badge key={idx} variant="secondary" className="bg-gray-700 text-gray-300">
                        <FileText className="h-3 w-3 mr-1" />
                        {attachment}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500">{new Date(comm.date).toLocaleString()}</p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
