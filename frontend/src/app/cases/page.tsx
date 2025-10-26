"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search, Filter, ArrowUpDown, Clock, AlertCircle } from "lucide-react"
import type { Case, CaseStatus } from "@/lib/types"

export default function CasesPage() {
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState<"date" | "priority">("date")
  const [filterStatus, setFilterStatus] = useState<CaseStatus | "all">("all")

  useEffect(() => {
    async function fetchCases() {
      try {
        setLoading(true)
        const response = await fetch('/api/cases')
        
        if (!response.ok) {
          throw new Error('Failed to fetch cases')
        }
        
        const data = await response.json()
        setCases(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchCases()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p className="text-lg font-medium">Loading cases...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 mx-auto" />
          <p className="text-lg font-medium">Error loading cases</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const filteredCases = cases
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cases</h1>
          <p className="text-muted-foreground">Manage and track all your legal cases</p>
        </div>
        <Button>New Case</Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by client name or case type..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8"
              />
            </div>
            <div className="flex gap-2">
              <Select value={sortBy} onValueChange={(value: "date" | "priority") => setSortBy(value)}>
                <SelectTrigger className="w-[180px]">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Sort by Date</SelectItem>
                  <SelectItem value="priority">Sort by Priority</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterStatus} onValueChange={(value: CaseStatus | "all") => setFilterStatus(value)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cases Tabs */}
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active">
            Active <Badge className="ml-2">{activeCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="pending">
            Pending <Badge className="ml-2">{pendingCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="on-hold">
            On Hold <Badge className="ml-2">{onHoldCases.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="closed">Closed</TabsTrigger>
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
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-lg font-medium">No cases found</p>
          <p className="text-sm text-muted-foreground">Try adjusting your filters</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="grid gap-4">
      {cases.map((case_) => (
        <Card key={case_.id} className="hover:bg-accent/50 transition-colors">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{case_.clientName}</CardTitle>
                  <Badge
                    variant={
                      case_.priority === "urgent" ? "destructive" : case_.priority === "high" ? "default" : "secondary"
                    }
                  >
                    {case_.priority}
                  </Badge>
                  <Badge variant="outline">{case_.status}</Badge>
                </div>
                <CardDescription>{case_.caseType}</CardDescription>
              </div>
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/cases/${case_.id}`}>View Details</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">{case_.description}</p>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>Assigned to: {case_.assignedTo}</span>
                  <span>•</span>
                  <span>Created: {new Date(case_.createdAt).toLocaleDateString()}</span>
                  <span>•</span>
                  <span>Last activity: {new Date(case_.lastActivity).toLocaleDateString()}</span>
                </div>
              </div>
              {case_.nextAction && (
                <div className="flex items-center gap-2 pt-2 border-t">
                  <span className="text-xs font-medium">Next Action:</span>
                  <span className="text-xs text-muted-foreground">{case_.nextAction}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
