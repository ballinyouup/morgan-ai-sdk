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
    <div className="space-y-6 p-6">
      {/* Glassy header section */}
      <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Dashboard</h1>
        <p className="text-gray-400">Welcome back, Emily. Here's what needs your attention.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
        <div className="relative group cursor-pointer h-60">
          {/* Hover border effect */}
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full m-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Total Cases</CardTitle>
              <FolderOpen className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-all duration-250 group-hover:scale-110 group-hover:-translate-y-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.totalCases}</div>
              <p className="text-xs text-gray-400">Across all statuses</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group cursor-pointer h-60">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full m-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Active Cases</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-all duration-250 group-hover:scale-110 group-hover:-translate-y-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.activeCases}</div>
              <p className="text-xs text-gray-400">Requiring attention</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group cursor-pointer h-60">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full m-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Actions</CardTitle>
              <Clock className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-all duration-250 group-hover:scale-110 group-hover:-translate-y-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.pendingActions}</div>
              <p className="text-xs text-gray-400">Awaiting approval</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group cursor-pointer h-60">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full m-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Communications</CardTitle>
              <AlertCircle className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-all duration-250 group-hover:scale-110 group-hover:-translate-y-1" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats.recentCommunications}</div>
              <p className="text-xs text-gray-400">In the last 7 days</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2 max-w-7xl mx-auto">
        {/* Recent Cases */}
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl m-[1px] z-10">
            <CardHeader>
              <CardTitle className="text-white">Recent Active Cases</CardTitle>
              <CardDescription className="text-gray-400">Cases requiring immediate attention</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentCases.map((case_) => (
                <div key={case_.id} className="flex items-start justify-between border-b border-gray-600 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium leading-none text-white">{case_.clientName}</p>
                    <p className="text-sm text-gray-400">{case_.caseType}</p>
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
                      <span className="text-xs text-gray-400">{case_.nextAction}</span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-yellow-300 hover:bg-gray-700" asChild>
                    <Link href={`/cases/${case_.id}`}>View</Link>
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-yellow-300" asChild>
                <Link href="/cases">View All Cases</Link>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Pending Agent Actions */}
        <div className="relative group cursor-pointer">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl m-[1px] z-10">
            <CardHeader>
              <CardTitle className="text-white">Pending Agent Actions</CardTitle>
              <CardDescription className="text-gray-400">AI-suggested actions awaiting your review</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {pendingActions.map((action) => (
                <div key={action.id} className="flex items-start justify-between border-b border-gray-600 pb-4 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="font-medium leading-none text-white">{action.actionType}</p>
                    <p className="text-sm text-gray-400">{action.caseName}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant={action.impact === "high" ? "destructive" : "secondary"}>
                        {action.impact} impact
                      </Badge>
                      <span className="text-xs text-gray-400">
                        {new Date(action.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" className="text-gray-300 hover:text-yellow-300 hover:bg-gray-700" asChild>
                    <Link href="/actions">Review</Link>
                  </Button>
                </div>
              ))}
              <Button variant="outline" className="w-full bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-yellow-300" asChild>
                <Link href="/actions">View All Actions</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
