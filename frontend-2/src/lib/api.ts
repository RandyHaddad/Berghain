import { 
  AutoStepRequest, 
  EventsPage, 
  RunSummary, 
  StepRequest, 
  StepResponse, 
  AdmittedByAttributeResponse,
  ProfileResponse,
  LeaderboardResponse
} from '../types'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function handleResponse<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  // Core run management
  async newRun(scenario: number): Promise<RunSummary> {
    const res = await fetch(`${BASE}/runs/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async getRun(runId: string): Promise<RunSummary> {
    const res = await fetch(`${BASE}/runs/${runId}`, {
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async listEvents(runId: string, offset = 0, limit = 200): Promise<EventsPage> {
    const res = await fetch(`${BASE}/runs/${runId}/events?offset=${offset}&limit=${limit}`, {
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async step(runId: string, data: StepRequest): Promise<StepResponse> {
    const res = await fetch(`${BASE}/runs/${runId}/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async autoStep(runId: string, data: AutoStepRequest): Promise<StepResponse> {
    const res = await fetch(`${BASE}/runs/${runId}/auto-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async pauseRun(runId: string): Promise<RunSummary> {
    const res = await fetch(`${BASE}/runs/${runId}/pause`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async resumeRun(runId: string): Promise<RunSummary> {
    const res = await fetch(`${BASE}/runs/${runId}/resume`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async admittedByAttribute(runId: string): Promise<AdmittedByAttributeResponse> {
    const res = await fetch(`${BASE}/runs/${runId}/admitted-by-attribute`, {
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async exportRun(runId: string): Promise<Blob> {
    const res = await fetch(`${BASE}/runs/${runId}/export`, {
      credentials: 'include',
    })
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${await res.text()}`)
    }
    return res.blob()
  },

  // V2 Profile & Leaderboard APIs
  async getProfile(): Promise<ProfileResponse> {
    const res = await fetch(`${BASE}/profile`, {
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async updateDisplayName(displayName: string): Promise<ProfileResponse> {
    const res = await fetch(`${BASE}/profile/name`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ display_name: displayName }),
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async getLeaderboard(): Promise<LeaderboardResponse> {
    const res = await fetch(`${BASE}/leaderboard`, {
      credentials: 'include',
    })
    return handleResponse(res)
  },

  async completeRun(runId: string): Promise<{ status: string; success: boolean }> {
    const res = await fetch(`${BASE}/runs/${runId}/complete`, {
      method: 'POST',
      credentials: 'include',
    })
    return handleResponse(res)
  },
}
