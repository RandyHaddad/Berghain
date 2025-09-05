export type Constraint = { attribute: string; minCount: number }

export type AttributeStatistics = {
  relativeFrequencies: Record<string, number>
  correlations: Record<string, Record<string, number>>
}

export type RunSummary = {
  id: string
  scenario: number
  gameId: string
  status: 'created' | 'running' | 'paused' | 'completed' | 'failed' | string
  admittedCount: number
  rejectedCount: number
  capacityRequired: number
  constraints: Constraint[]
  attributeStatistics: AttributeStatistics
  pendingPersonIndex?: number | null
}

export type NextPerson = {
  personIndex: number
  attributes: Record<string, boolean>
}

export type EventOut = {
  id: number
  personIndex: number
  attributes: Record<string, boolean>
  accepted: boolean
  admittedCount: number
  rejectedCount: number
  createdAt: string
}

export type StepRequest = { personIndex: number; accept?: boolean | null }
export type AutoStepRequest = { personIndex: number; strategy?: string }

export type StepResponse = {
  run: RunSummary
  event?: EventOut | null
  nextPerson?: NextPerson | null
}

export type EventsPage = { items: EventOut[]; offset: number; limit: number }
