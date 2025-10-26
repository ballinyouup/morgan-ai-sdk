"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertCircle, CheckCircle2, Clock, FolderOpen } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"

interface DashboardStats {
  totalCases: number
  activeCases: number
  pendingActions: number
  recentCommunications: number
}

interface Case {
  id: string
  clientName: string
  caseType: string
  status: string
  priority: string
  nextAction?: string
}

interface PendingAction {
  id: string
  agentType: string
  action: string
  reasoning: string
  confidence?: number
  timestamp: string
  case: {
    id: string
    clientName: string
    caseType: string
  }
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalCases: 0,
    activeCases: 0,
    pendingActions: 0,
    recentCommunications: 0
  })
  const [recentCases, setRecentCases] = useState<Case[]>([])
  const [pendingActions, setPendingActions] = useState<PendingAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        // Fetch all dashboard data in parallel
        const [statsRes, casesRes, actionsRes] = await Promise.all([
          fetch('/api/dashboard/stats'),
          fetch('/api/dashboard/recent-cases'),
          fetch('/api/dashboard/pending-actions')
        ])

        if (!statsRes.ok || !casesRes.ok || !actionsRes.ok) {
          throw new Error('Failed to fetch dashboard data')
        }

        const [statsData, casesData, actionsData] = await Promise.all([
          statsRes.json(),
          casesRes.json(),
          actionsRes.json()
        ])

        setStats(statsData)
        setRecentCases(casesData)
        setPendingActions(actionsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p className="text-lg font-medium">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 mx-auto" />
          <p className="text-lg font-medium">Error loading dashboard</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Emily. Here what needs your attention.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
            <FolderOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalCases}</div>
            <p className="text-xs text-muted-foreground">Across all statuses</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCases}</div>
            <p className="text-xs text-muted-foreground">Requiring attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Actions</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingActions}</div>
            <p className="text-xs text-muted-foreground">Awaiting approval</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Communications</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.recentCommunications}</div>
            <p className="text-xs text-muted-foreground">In the last 7 days</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Cases */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Active Cases</CardTitle>
            <CardDescription>Cases requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentCases.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No active cases</p>
            ) : (
              recentCases.map((case_) => (
                <div key={case_.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{case_.clientName}</p>
                    <p className="text-sm text-muted-foreground">{case_.caseType}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant={
                          case_.priority === "urgent"
                            ? "destructive"
                            : case_.priority === "high"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {case_.priority}
                      </Badge>
                      <span className="text-xs text-muted-foreground">{case_.nextAction}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cases/${case_.id}`}>View</Link>
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/cases">View All Cases</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Pending Agent Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Agent Actions</CardTitle>
            <CardDescription>AI-suggested actions awaiting your review</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingActions.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No pending actions</p>
            ) : (
              pendingActions.map((action) => (
                <div key={action.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium leading-none">{action.action}</p>
                    <p className="text-sm text-muted-foreground">{action.case.clientName} - {action.case.caseType}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="secondary">{action.agentType}</Badge>
                      {action.confidence && (
                        <Badge variant={action.confidence >= 0.8 ? "default" : "outline"}>
                          {Math.round(action.confidence * 100)}% confidence
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground">
                        {new Date(action.timestamp).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/cases/${action.case.id}`}>Review</Link>
                  </Button>
                </div>
              ))
            )}
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/actions">View All Actions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}