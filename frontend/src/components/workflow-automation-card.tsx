"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  TrendingUp,
  FileText,
  Mail,
  Phone,
  Search,
  Calendar,
  Loader2,
  Sparkles
} from "lucide-react"

interface AITask {
  id: string
  title: string
  description: string
  priority: "high" | "medium" | "low"
  category: "document" | "communication" | "research" | "deadline" | "follow-up"
  status: "pending" | "in-progress" | "completed" | "dismissed"
  estimatedTime: string | null
  reasoning: string | null
  createdBy: string
  createdAt: string
}

interface WorkflowAutomationCardProps {
  caseId: string
}

export function WorkflowAutomationCard({ caseId }: WorkflowAutomationCardProps) {
  const [tasks, setTasks] = useState<AITask[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTasks()
  }, [caseId])

  async function fetchTasks() {
    try {
      setLoading(true)
      const response = await fetch(`/api/cases/${caseId}/tasks`)
      if (response.ok) {
        const data = await response.json()
        setTasks(data)
      }
    } catch (error) {
      console.error("Error fetching tasks:", error)
    } finally {
      setLoading(false)
    }
  }

  async function toggleTask(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === "completed" ? "pending" : "completed"
    
    try {
      const response = await fetch(`/api/cases/${caseId}/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      })

      if (response.ok) {
        const updatedTask = await response.json()
        setTasks(prev =>
          prev.map(task =>
            task.id === taskId ? updatedTask : task
          )
        )
      }
    } catch (error) {
      console.error("Error updating task:", error)
    }
  }

  const getCategoryIcon = (category: AITask["category"]) => {
    switch (category) {
      case "document":
        return <FileText className="h-4 w-4" />
      case "communication":
        return <Mail className="h-4 w-4" />
      case "research":
        return <Search className="h-4 w-4" />
      case "deadline":
        return <Calendar className="h-4 w-4" />
      case "follow-up":
        return <Phone className="h-4 w-4" />
    }
  }

  const getPriorityColor = (priority: AITask["priority"]) => {
    switch (priority) {
      case "high":
        return "destructive"
      case "medium":
        return "default"
      case "low":
        return "secondary"
    }
  }

  const completedCount = tasks.filter(t => t.status === "completed").length
  const totalCount = tasks.length
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const highPriorityPending = tasks.filter(
    t => t.priority === "high" && t.status !== "completed"
  ).length

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (tasks.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI-Generated Tasks</CardTitle>
          <CardDescription>No tasks yet - run an AI analysis to generate action items</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Sparkles className="h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-sm text-muted-foreground text-center">
            Use the AI Analysis button to analyze your case and get personalized task recommendations
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-purple-500" />
              AI-Generated Tasks
            </CardTitle>
            <CardDescription>Actionable recommendations from AI analysis</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-muted-foreground" />
            <span className="text-2xl font-bold">{completionPercentage}%</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Progress Summary */}
        <div className="flex items-center text-white justify-between p-3 bg-black rounded-lg">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          {highPriorityPending > 0 && (
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <span className="text-sm font-medium text-orange-600">
                {highPriorityPending} high priority pending
              </span>
            </div>
          )}
        </div>

        {/* Action Items */}
        <div className="space-y-3">
          {tasks.map((task) => (
            <div
              key={task.id}
              className={`flex items-start gap-3 p-3 border rounded-lg transition-all ${
                task.status === "completed" ? "bg-muted/50 opacity-75" : "hover:bg-background"
              }`}
            >
              <Checkbox
                id={task.id}
                checked={task.status === "completed"}
                onCheckedChange={() => toggleTask(task.id, task.status)}
                className="mt-1"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <label
                    htmlFor={task.id}
                    className={`font-medium cursor-pointer ${
                      task.status === "completed" ? "line-through text-muted-foreground" : ""
                    }`}
                  >
                    {task.title}
                  </label>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge variant={getPriorityColor(task.priority)} className="text-xs">
                      {task.priority}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {getCategoryIcon(task.category)}
                      <span className="ml-1">{task.category}</span>
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{task.description}</p>
                {task.reasoning && (
                  <p className="text-xs text-muted-foreground italic">
                    💡 {task.reasoning}
                  </p>
                )}
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {task.estimatedTime && (
                    <>
                      <Clock className="h-3 w-3" />
                      <span>Est. {task.estimatedTime}</span>
                    </>
                  )}
                  <span>•</span>
                  <span>Created by {task.createdBy}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
