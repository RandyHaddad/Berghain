import { AutoStepRequest, EventsPage, RunSummary, StepRequest, StepResponse, AdmittedByAttributeResponse } from './types'

const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api'

async function j<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`HTTP ${res.status}: ${text}`)
  }
  return res.json()
}

export const api = {
  async newRun(scenario: number): Promise<RunSummary> {
    const res = await fetch(`${BASE}/runs/new`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ scenario }),
    })
    return j(res)
  },
  async getRun(runId: string): Promise<RunSummary> {
    const res = await fetch(`${BASE}/runs/${runId}`)
    return j(res)
  },
  async listEvents(runId: string, offset = 0, limit = 200): Promise<EventsPage> {
    const res = await fetch(`${BASE}/runs/${runId}/events?offset=${offset}&limit=${limit}`)
    return j(res)
  },
  async step(runId: string, data: StepRequest): Promise<StepResponse> {
    const res = await fetch(`${BASE}/runs/${runId}/step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return j(res)
  },
  async autoStep(runId: string, data: AutoStepRequest): Promise<StepResponse> {
    const res = await fetch(`${BASE}/runs/${runId}/auto-step`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return j(res)
  },
  async admittedByAttribute(runId: string): Promise<AdmittedByAttributeResponse> {
    const res = await fetch(`${BASE}/runs/${runId}/admitted-by-attribute`)
    return j(res)
  },
}
