"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { mockCases } from "@/lib/mock-data"
import { Search, Filter, ArrowUpDown } from "lucide-react"
import type { Case, CaseStatus } from "@/lib/types"

export default function CasesPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "priority">("date")
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "all">("all")

  const filteredCases = mockCases
    .filter((case_) => {
      const matchesSearch =
        case_.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        case_.caseType.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesStatus = filterStatus === "all" || case_.status === filterStatus
      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      if (sortBy === "date") {
        return new Date(b.lastActivity).getTime() - new Date(a.lastActivity).getTime()
      } else {
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        return priorityOrder[b.priority] - priorityOrder[a.priority]
      }
    })

  const activeCases = filteredCases.filter((c) => c.status === "active")
  const pendingCases = filteredCases.filter((c) => c.status === "pending")
  const onHoldCases = filteredCases.filter((c) => c.status === "on-hold")
  const closedCases = filteredCases.filter((c) => c.status === "closed")

  return (
    <div className="space-y-6 p-6">
      {/* Glassy header section */}
      <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Cases</h1>
            <p className="text-gray-400">Manage and track all your legal cases</p>
          </div>
          <Button className="bg-yellow-300 text-gray-900 hover:bg-yellow-400 font-medium">New Case</Button>
        </div>
      </div>

      {/* Filters */}
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
        <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
          <CardContent className="pt-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by client name or case type..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8 bg-gray-700/50 border-gray-600 text-white placeholder:text-gray-400 focus:border-yellow-300/50 focus:ring-yellow-300/20"
                />
              </div>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={(value: "date" | "priority") => setSortBy(value)}>
                  <SelectTrigger className="w-[180px] bg-gray-700/50 border-gray-600 text-white">
                    <ArrowUpDown className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="date" className="hover:bg-gray-700 hover:text-yellow-300">Sort by Date</SelectItem>
                    <SelectItem value="priority" className="hover:bg-gray-700 hover:text-yellow-300">Sort by Priority</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterStatus} onValueChange={(value: CaseStatus | "all") => setFilterStatus(value)}>
                  <SelectTrigger className="w-[180px] bg-gray-700/50 border-gray-600 text-white">
                    <Filter className="h-4 w-4 mr-2 text-gray-400" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700 text-white">
                    <SelectItem value="all" className="hover:bg-gray-700 hover:text-yellow-300">All Statuses</SelectItem>
                    <SelectItem value="active" className="hover:bg-gray-700 hover:text-yellow-300">Active</SelectItem>
                    <SelectItem value="pending" className="hover:bg-gray-700 hover:text-yellow-300">Pending</SelectItem>
                    <SelectItem value="on-hold" className="hover:bg-gray-700 hover:text-yellow-300">On Hold</SelectItem>
                    <SelectItem value="closed" className="hover:bg-gray-700 hover:text-yellow-300">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cases Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50">
          <TabsTrigger value="active" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Active <Badge className="ml-2 bg-yellow-300/20 text-yellow-300">{activeCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Pending <Badge className="ml-2 bg-gray-700 text-gray-300">{pendingCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="on-hold" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            On Hold <Badge className="ml-2 bg-gray-700 text-gray-300">{onHoldCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">Closed</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          <CasesList cases={activeCases} />
        </TabsContent>

        <TabsContent value="pending" className="space-y-4">
          <CasesList cases={pendingCases} />
        </TabsContent>

        <TabsContent value="on-hold" className="space-y-4">
          <CasesList cases={onHoldCases} />
        </TabsContent>

        <TabsContent value="closed" className="space-y-4">
          <CasesList cases={closedCases} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function CasesList({ cases }: { cases: Case[] }) {
  if (cases.length === 0) {
    return (
      <div className="relative group">
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
        <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-lg font-medium text-white">No cases found</p>
            <p className="text-sm text-gray-400">Try adjusting your filters</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {cases.map((case_) => (
        <div key={case_.id} className="relative group">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10 hover:bg-gray-700/50 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg text-white">{case_.clientName}</CardTitle>
                    <Badge
                      variant={
                        case_.priority === "urgent" ? "destructive" : case_.priority === "high" ? "default" : "secondary"
                      }
                    >
                      {case_.priority}
                    </Badge>
                    <Badge variant="outline" className="border-gray-600 text-gray-300">{case_.status}</Badge>
                  </div>
                  <CardDescription className="text-gray-400">{case_.caseType}</CardDescription>
                </div>
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-yellow-300 hover:bg-gray-700/50" asChild>
                  <Link href={`/cases/${case_.id}`}>View Details</Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <p className="text-sm text-gray-400">{case_.description}</p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-4">
                    <span>Assigned to: {case_.assignedTo}</span>
                    <span>•</span>
                    <span>Created: {new Date(case_.createdAt).toLocaleDateString()}</span>
                    <span>•</span>
                    <span>Last activity: {new Date(case_.lastActivity).toLocaleDateString()}</span>
                  </div>
                </div>
                {case_.nextAction && (
                  <div className="flex items-center gap-2 pt-2 border-t border-gray-600">
                    <span className="text-xs font-medium text-white">Next Action:</span>
                    <span className="text-xs text-gray-400">{case_.nextAction}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  )
}
