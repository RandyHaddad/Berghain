// Core API types (matching backend schemas)
export type Constraint = { 
  attribute: string; 
  minCount: number; 
}

export type AttributeStatistics = {
  relativeFrequencies: Record<string, number>
  correlations: Record<string, Record<string, number>>
}

export type RunSummary = {
  id: string
  scenario: 1 | 2 | 3
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

export type StepRequest = { 
  personIndex: number; 
  accept?: boolean | null;
}

export type AutoStepRequest = { 
  personIndex: number; 
  strategy?: string;
  delayMs?: number;
}

export type StepResponse = {
  run: RunSummary
  event?: EventOut | null
  nextPerson?: NextPerson | null
  admittedByAttribute?: Record<string, number>
}

export type EventsPage = { 
  items: EventOut[]; 
  offset: number; 
  limit: number;
}

export type AdmittedByAttributeResponse = { 
  counts: Record<string, number>;
}

// V2 types for new features
export type ProfileResponse = {
  guest_id: string
  display_name: string
}

export type LeaderboardEntry = {
  name: string
  scenarios_completed: number
  total_rejections: number
  last_completion: string
  best_run_id?: string | null
}

export type LeaderboardResponse = {
  entries: LeaderboardEntry[]
}

// UI State types
export type GameState = 
  | 'idle'
  | 'newGame'
  | 'awaitingPerson0'
  | 'manualReady'
  | 'autoRunning'
  | 'autoPaused'
  | 'completed'
  | 'failed'

export type AppSettings = {
  displayName: string
  sounds: boolean
  autoRunDelayMs: number
  confirmBeforeNewGame: boolean
  theme: 'light' | 'dark'
}

// Image manifest types
export type ScenarioManifest = {
  scenario: number
  mapping: Record<string, string[]>
}

// Decision strategies available from backend
export type DecisionStrategy = 
  | 'greedy_tightness'
  | 'expected_feasible'
  | 'risk_adjusted_feasible'
  | 'proportional_control'
  | 'lookahead_1'

export const DECISION_STRATEGIES: { value: DecisionStrategy; label: string }[] = [
  { value: 'greedy_tightness', label: 'Greedy Tightness' },
  { value: 'expected_feasible', label: 'Expected Feasible Guard' },
  { value: 'risk_adjusted_feasible', label: 'Risk-adjusted Feasible' },
  { value: 'proportional_control', label: 'Proportional Control' },
  { value: 'lookahead_1', label: 'Lookahead-1 (expected slack)' },
]
