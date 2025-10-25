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
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Agent Actions</h1>
        <p className="text-muted-foreground">Review and approve AI-suggested actions for your cases</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingActions.length}</div>
            <p className="text-xs text-muted-foreground">Awaiting your decision</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Approved</CardTitle>
            <Check className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{approvedActions.length}</div>
            <p className="text-xs text-muted-foreground">Ready to execute</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rejected</CardTitle>
            <X className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{rejectedActions.length}</div>
            <p className="text-xs text-muted-foreground">Declined actions</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions List */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList>
          <TabsTrigger value="pending">
            Pending <Badge className="ml-2">{pendingActions.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="approved">Approved</TabsTrigger>
          <TabsTrigger value="rejected">Rejected</TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          {pendingActions.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Check className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">All caught up!</p>
                <p className="text-sm text-muted-foreground">No pending actions to review</p>
              </CardContent>
            </Card>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No approved actions</p>
                <p className="text-sm text-muted-foreground">Approved actions will appear here</p>
              </CardContent>
            </Card>
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
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">No rejected actions</p>
                <p className="text-sm text-muted-foreground">Rejected actions will appear here</p>
              </CardContent>
            </Card>
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
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <CardTitle className="text-lg">{action.actionType}</CardTitle>
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
            <CardDescription>{action.caseName}</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onToggleExpand(action.id)}>
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm text-foreground">{action.description}</p>
        </div>

        {expanded && (
          <div className="space-y-3 pt-3 border-t">
            <div>
              <p className="text-sm font-medium mb-1">AI Reasoning</p>
              <p className="text-sm text-muted-foreground">{action.reasoning}</p>
            </div>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span>Suggested by: {action.suggestedBy}</span>
              <span>•</span>
              <span>{new Date(action.createdAt).toLocaleString()}</span>
            </div>
          </div>
        )}

        {action.status === "pending" && onApprove && onReject && (
          <div className="flex gap-2 pt-2">
            <Button onClick={() => onApprove(action.id)} className="flex-1" size="sm">
              <Check className="h-4 w-4 mr-2" />
              Approve
            </Button>
            <Button onClick={() => onReject(action.id)} variant="outline" className="flex-1" size="sm">
              <X className="h-4 w-4 mr-2" />
              Reject
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
