import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { mockDashboardStats, mockCases, mockAgentActions } from "@/lib/mock-data"
import { AlertCircle, CheckCircle2, Clock, FolderOpen } from "lucide-react"
import Link from "next/link"

export default function DashboardPage() {
  const stats = mockDashboardStats
  const recentCases = mockCases.filter((c) => c.status === "active").slice(0, 3)
  const pendingActions = mockAgentActions.filter((a) => a.status === "pending").slice(0, 3)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">Welcome back, Emily. Here's what needs your attention.</p>
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
            {recentCases.map((case_) => (
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
            ))}
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
            {pendingActions.map((action) => (
              <div key={action.id} className="flex items-start justify-between border-b pb-4 last:border-0 last:pb-0">
                <div className="space-y-1">
                  <p className="font-medium leading-none">{action.actionType}</p>
                  <p className="text-sm text-muted-foreground">{action.caseName}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={action.impact === "high" ? "destructive" : "secondary"}>
                      {action.impact} impact
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(action.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/actions">Review</Link>
                </Button>
              </div>
            ))}
            <Button variant="outline" className="w-full bg-transparent" asChild>
              <Link href="/actions">View All Actions</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
