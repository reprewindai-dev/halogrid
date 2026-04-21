export type ConsoleStatus = 'IN_PROGRESS' | 'LIVE_IN_PRODUCTION' | 'BLOCKED_BY_MISSING_INFRA' | 'BLOCKED_BY_CREDENTIALS'

export type ConnectionState = 'idle' | 'connecting' | 'connected' | 'degraded' | 'blocked' | 'error'

export type SurfaceTone = 'neutral' | 'positive' | 'warning' | 'danger'

export interface ConsoleMetric {
  label: string
  value: string
  note: string
  tone: SurfaceTone
}

export interface ConsoleSurface {
  id: string
  label: string
  code: string
  status: 'green' | 'yellow' | 'red'
  signal: string
  policy: string
  lastAction: string
}

export interface ConsoleEvent {
  id: string
  title: string
  detail: string
  timestamp: string
  tone: SurfaceTone
}

export interface ConsoleIntegration {
  name: string
  status: string
  mode: string
}

export interface ConsoleSnapshot {
  backendLabel: string
  backendBaseUrl: string
  connectionState: ConnectionState
  statusLine: string
  lastSyncedAt: string | null
  metrics: ConsoleMetric[]
  surfaces: ConsoleSurface[]
  events: ConsoleEvent[]
  integrations: ConsoleIntegration[]
  guardrails: string[]
}

export interface ConsoleRuntime {
  snapshot: ConsoleSnapshot
  connectionState: ConnectionState
  status: ConsoleStatus
  error: string | null
  loading: boolean
  refresh: () => void
}

export interface EcobeMvpPolicy {
  id: string
  name: string
  threshold: number | null
  delay_seconds: number | null
  active: boolean
  created_at: string | null
  raw: Record<string, unknown>
}

export interface EcobeMvpProofRecord {
  id: string
  proof_id: string
  job_id: string
  action: string
  carbon_value: string | number | null
  policy: string
  timestamp: string | null
  delay_seconds: number | null
  raw: Record<string, unknown>
}

export interface CreateEcobeMvpPolicyInput {
  name: string
  threshold: number
  delay_seconds: number
}
