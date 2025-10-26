"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Check, X, Clock, AlertCircle, ChevronDown, ChevronUp } from "lucide-react"
import Link from "next/link"

type AgentActionStatus = "pending" | "approved" | "rejected"

interface AgentAction {
  id: string
  caseId: string
  caseName: string
  actionType: string
  description: string
  suggestedBy: string
  status: AgentActionStatus
  createdAt: string
  reasoning: string
  impact: "low" | "medium" | "high"
  confidence?: number
  case: {
    id: string
    clientName: string
    caseType: string
  }
}

export default function ActionsPage() {
  const [actions, setActions] = useState<AgentAction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedAction, setExpandedAction] = useState<string | null>(null)

  useEffect(() => {
    fetchActions()
  }, [])

  async function fetchActions() {
    try {
      setLoading(true)
      const response = await fetch('/api/actions')
      
      if (!response.ok) {
        throw new Error('Failed to fetch actions')
      }
      
      const data = await response.json()
      setActions(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (actionId: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'approved' })
      })

      if (!response.ok) {
        throw new Error('Failed to approve action')
      }

      const updatedAction = await response.json()
      setActions((prev) => prev.map((a) => (a.id === actionId ? updatedAction : a)))
    } catch (err) {
      console.error('Error approving action:', err)
    }
  }

  const handleReject = async (actionId: string) => {
    try {
      const response = await fetch(`/api/actions/${actionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'rejected' })
      })

      if (!response.ok) {
        throw new Error('Failed to reject action')
      }

      const updatedAction = await response.json()
      setActions((prev) => prev.map((a) => (a.id === actionId ? updatedAction : a)))
    } catch (err) {
      console.error('Error rejecting action:', err)
    }
  }

  const toggleExpand = (actionId: string) => {
    setExpandedAction(expandedAction === actionId ? null : actionId)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Clock className="h-12 w-12 text-muted-foreground mb-4 mx-auto animate-spin" />
          <p className="text-lg font-medium text-black">Loading actions...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4 mx-auto" />
          <p className="text-lg font-medium">Error loading actions</p>
          <p className="text-sm text-muted-foreground">{error}</p>
        </div>
      </div>
    )
  }

  const pendingActions = actions.filter((a) => a.status === "pending")
  const approvedActions = actions.filter((a) => a.status === "approved")
  const rejectedActions = actions.filter((a) => a.status === "rejected")

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-black">Agent Actions</h1>
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
            <CardDescription>
              <Link href={`/cases/${action.case.id}`} className="hover:underline">
                {action.caseName}
              </Link>
            </CardDescription>
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
