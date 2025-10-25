// API client for Legal AI Platform backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"

export interface ApiResponse<T> {
  data?: T
  error?: string
}

// Case Management
export interface Case {
  id: string
  case_name: string
  client_name: string
  case_type: string
  description?: string
  priority: number
  status: string
  created_at: string
  updated_at?: string
}

export interface CreateCaseRequest {
  case_name: string
  client_name: string
  case_type: string
  description?: string
  priority?: number
}

export const caseApi = {
  list: async (): Promise<ApiResponse<Case[]>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cases`)
      const data = await response.json()
      return { data: data.cases }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  get: async (caseId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cases/${caseId}`)
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  create: async (caseData: CreateCaseRequest): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/cases`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(caseData),
      })
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },
}

// Task Management
export interface DocumentProcessTask {
  case_id: string
  document_id: string
  document_path?: string
}

export interface ClientMessageTask {
  case_id: string
  client_id: string
  message_id: string
  message_text: string
  context?: Record<string, any>
  generate_response?: boolean
}

export interface LegalResearchTask {
  case_id: string
  query: string
  case_facts?: string
  legal_issue?: string
  top_k?: number
}

export const taskApi = {
  processDocument: async (task: DocumentProcessTask): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/document-process`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      })
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  handleClientMessage: async (task: ClientMessageTask): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/client-message`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      })
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  legalResearch: async (task: LegalResearchTask): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/tasks/legal-research`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(task),
      })
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },
}

// Status and Monitoring
export interface OrchestratorStatus {
  orchestrator: {
    is_running: boolean
    last_check: string
    polling_interval: number
    queued_tasks: number
    active_tasks: number
    completed_tasks: number
  }
  agents: Record<string, any>
  task_queue: any[]
  timestamp: string
}

export const statusApi = {
  getHealth: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/health`)
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  getStatus: async (): Promise<ApiResponse<OrchestratorStatus>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/status`)
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  getReasonChains: async (caseId: string): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/reason-chains/${caseId}`)
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },

  getAnalytics: async (): Promise<ApiResponse<any>> => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/analytics/dashboard`)
      const data = await response.json()
      return { data }
    } catch (error) {
      return { error: (error as Error).message }
    }
  },
}
