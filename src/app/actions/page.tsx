"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { mockAgentActions } from "@/lib/mock-data"
import { Check, X, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import type { AgentAction } from "@/lib/types"

export default function ActionsPage() {
  const [actions, setActions] = useState(mockAgentActions)
  const [expandedAction, setExpandedAction] = useState<string | null>(null)

  const handleApprove = (actionId: string) => {
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, status: "approved" as const } : a)))
  }

  const handleReject = (actionId: string) => {
    setActions((prev) => prev.map((a) => (a.id === actionId ? { ...a, status: "rejected" as const } : a)))
  }

  const toggleExpand = (actionId: string) => {
    setExpandedAction(expandedAction === actionId ? null : actionId)
  }

  const pendingActions = actions.filter((a) => a.status === "pending")
  const approvedActions = actions.filter((a) => a.status === "approved")
  const rejectedActions = actions.filter((a) => a.status === "rejected")

  return (
    <div className="space-y-6 p-6">
      {/* Glassy header section */}
      <div className="bg-gray-800/30 backdrop-blur-lg border border-gray-700/50 rounded-xl p-6">
        <h1 className="text-3xl font-bold tracking-tight text-white">Agent Actions</h1>
        <p className="text-gray-400">Review and approve AI-suggested actions for your cases</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="relative group cursor-pointer h-32">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full inset-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Pending Review</CardTitle>
              <Clock className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingActions.length}</div>
              <p className="text-xs text-gray-400">Awaiting your decision</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group cursor-pointer h-32">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full inset-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Approved</CardTitle>
              <Check className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{approvedActions.length}</div>
              <p className="text-xs text-gray-400">Ready to execute</p>
            </CardContent>
          </Card>
        </div>

        <div className="relative group cursor-pointer h-32">
          <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
          <Card className="relative bg-gray-800 border-gray-700 rounded-xl h-full m-[1px] z-10">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-white">Rejected</CardTitle>
              <X className="h-4 w-4 text-gray-400 group-hover:text-yellow-300 transition-colors duration-250" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{rejectedActions.length}</div>
              <p className="text-xs text-gray-400">Declined actions</p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Actions List */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-gray-800/50 backdrop-blur-lg border border-gray-700/50">
          <TabsTrigger value="pending" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">
            Pending <Badge className="ml-2 bg-yellow-300/20 text-yellow-300">{pendingActions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">Approved</TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-yellow-300/20 data-[state=active]:text-yellow-300 text-gray-300">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingActions.length === 0 ? (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Check className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-white">All caught up!</p>
                  <p className="text-sm text-gray-400">No pending actions to review</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            pendingActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                onApprove={handleApprove}
                onReject={handleReject}
                expanded={expandedAction === action.id}
                onToggleExpand={toggleExpand}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedActions.length === 0 ? (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-white">No approved actions</p>
                  <p className="text-sm text-gray-400">Approved actions will appear here</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            approvedActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedAction === action.id}
                onToggleExpand={toggleExpand}
              />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedActions.length === 0 ? (
            <div className="relative group">
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
              <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-lg font-medium text-white">No rejected actions</p>
                  <p className="text-sm text-gray-400">Rejected actions will appear here</p>
                </CardContent>
              </Card>
            </div>
          ) : (
            rejectedActions.map((action) => (
              <ActionCard
                key={action.id}
                action={action}
                expanded={expandedAction === action.id}
                onToggleExpand={toggleExpand}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}

interface ActionCardProps {
  action: AgentAction
  onApprove?: (id: string) => void
  onReject?: (id: string) => void
  expanded: boolean
  onToggleExpand: (id: string) => void
}

function ActionCard({ action, onApprove, onReject, expanded, onToggleExpand }: ActionCardProps) {
  return (
    <div className="relative group">
      <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-transparent via-yellow-300/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>
      <Card className="relative bg-gray-800/50 backdrop-blur-lg border-gray-700/50 rounded-xl m-[1px] z-10">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg text-white">{action.actionType}</CardTitle>
                <Badge
                  variant={
                    action.impact === "high" ? "destructive" : action.impact === "medium" ? "default" : "secondary"
                  }
                >
                  {action.impact} impact
                </Badge>
                {action.status === "approved" && (
                  <Badge variant="default" className="bg-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Approved
                  </Badge>
                )}
                {action.status === "rejected" && (
                  <Badge variant="destructive">
                    <X className="h-3 w-3 mr-1" />
                    Rejected
                  </Badge>
                )}
              </div>
              <CardDescription className="text-gray-400">{action.caseName}</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="text-gray-300 hover:text-yellow-300 hover:bg-gray-700/50" onClick={() => onToggleExpand(action.id)}>
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-gray-300">{action.description}</p>
          </div>

          {expanded && (
            <div className="space-y-3 pt-3 border-t border-gray-600">
              <div>
                <p className="text-sm font-medium mb-1 text-white">AI Reasoning</p>
                <p className="text-sm text-gray-400">{action.reasoning}</p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span>Suggested by: {action.suggestedBy}</span>
                <span>•</span>
                <span>{new Date(action.createdAt).toLocaleString()}</span>
              </div>
            </div>
          )}

          {action.status === "pending" && onApprove && onReject && (
            <div className="flex gap-2 pt-2">
              <Button onClick={() => onApprove(action.id)} className="flex-1 bg-green-600 hover:bg-green-700" size="sm">
                <Check className="h-4 w-4 mr-2" />
                Approve
              </Button>
              <Button onClick={() => onReject(action.id)} variant="outline" className="flex-1 border-gray-600 text-gray-300 hover:bg-gray-700 hover:text-red-400" size="sm">
                <X className="h-4 w-4 mr-2" />
                Reject
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
