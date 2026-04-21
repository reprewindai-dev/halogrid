import type {
  ConnectionState,
  ConsoleEvent,
  ConsoleIntegration,
  ConsoleMetric,
  ConsoleSnapshot,
  ConsoleStatus,
  ConsoleSurface,
  SurfaceTone,
} from '../types'

const DEFAULT_BASE_URL = '/api/ecobe-mvp'
const REQUEST_TIMEOUT_MS = 8000

export const ECOBE_MVP_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_ECOBE_MVP_BASE_URL)

class EcobeMvpError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number | null,
    public readonly reason: 'missing_infra' | 'credentials' | 'network' | 'parse' | 'degraded',
  ) {
    super(message)
    this.name = 'EcobeMvpError'
  }
}

function normalizeBaseUrl(value: unknown): string {
  if (typeof value !== 'string' || !value.trim()) {
    return DEFAULT_BASE_URL
  }
  const trimmed = value.trim()
  return trimmed.replace(/\/+$/, '') || DEFAULT_BASE_URL
}

function buildUrl(path: string): string {
  const suffix = path.startsWith('/') ? path : `/${path}`
  return `${ECOBE_MVP_BASE_URL}${suffix}`
}

async function requestJson<T>(path: string): Promise<T> {
  const controller = new AbortController()
  const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS)

  try {
    const response = await fetch(buildUrl(path), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
      signal: controller.signal,
      credentials: 'include',
    })

    if (response.status === 401 || response.status === 403) {
      throw new EcobeMvpError('ecobe-mvp rejected the request', response.status, 'credentials')
    }

    if (!response.ok) {
      throw new EcobeMvpError(`ecobe-mvp returned ${response.status}`, response.status, 'missing_infra')
    }

    const payload = (await response.json()) as T
    return payload
  } catch (error) {
    if (error instanceof EcobeMvpError) {
      throw error
    }

    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new EcobeMvpError('ecobe-mvp request timed out', null, 'network')
    }

    throw new EcobeMvpError('ecobe-mvp request failed', null, 'network')
  } finally {
    window.clearTimeout(timeout)
  }
}

function toString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value.trim() : fallback
}

function toTone(value: unknown): SurfaceTone {
  if (value === 'positive' || value === 'warning' || value === 'danger' || value === 'neutral') {
    return value
  }
  return 'neutral'
}

function normalizeMetrics(source: unknown): ConsoleMetric[] {
  if (!Array.isArray(source)) {
    return defaultMetrics()
  }

  const metrics = source
    .map((item): ConsoleMetric | null => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const label = toString(record.label, '')
      const value = toString(record.value, '')
      const note = toString(record.note ?? record.description, '')
      if (!label || !value || !note) return null
      return {
        label,
        value,
        note,
        tone: toTone(record.tone),
      }
    })
    .filter((item): item is ConsoleMetric => item !== null)

  return metrics.length > 0 ? metrics : defaultMetrics()
}

function normalizeSurfaces(source: unknown): ConsoleSurface[] {
  if (!Array.isArray(source)) {
    return defaultSurfaces()
  }

  const surfaces = source
    .map((item): ConsoleSurface | null => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const label = toString(record.label ?? record.name, '')
      const code = toString(record.code ?? record.id, '')
      const signal = toString(record.signal ?? record.statusText ?? record.state, '')
      const policy = toString(record.policy ?? record.mode, '')
      const lastAction = toString(record.lastAction ?? record.action, '')
      const status = record.status === 'green' || record.status === 'yellow' || record.status === 'red'
        ? record.status
        : 'yellow'
      if (!label || !code || !signal || !policy || !lastAction) return null
      return { id: code, label, code, status, signal, policy, lastAction }
    })
    .filter((item): item is ConsoleSurface => item !== null)

  return surfaces.length > 0 ? surfaces : defaultSurfaces()
}

function normalizeEvents(source: unknown): ConsoleEvent[] {
  if (!Array.isArray(source)) {
    return defaultEvents()
  }

  const events = source
    .map((item): ConsoleEvent | null => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const title = toString(record.title ?? record.label, '')
      const detail = toString(record.detail ?? record.message, '')
      const timestamp = toString(record.timestamp ?? record.time, '')
      if (!title || !detail || !timestamp) return null
      return {
        id: toString(record.id, `${title}-${timestamp}`),
        title,
        detail,
        timestamp,
        tone: toTone(record.tone),
      }
    })
    .filter((item): item is ConsoleEvent => item !== null)

  return events.length > 0 ? events : defaultEvents()
}

function normalizeIntegrations(source: unknown): ConsoleIntegration[] {
  if (!Array.isArray(source)) {
    return defaultIntegrations()
  }

  const integrations = source
    .map((item): ConsoleIntegration | null => {
      if (!item || typeof item !== 'object') return null
      const record = item as Record<string, unknown>
      const name = toString(record.name, '')
      const status = toString(record.status, '')
      const mode = toString(record.mode, '')
      if (!name || !status || !mode) return null
      return { name, status, mode }
    })
    .filter((item): item is ConsoleIntegration => item !== null)

  return integrations.length > 0 ? integrations : defaultIntegrations()
}

function defaultMetrics(): ConsoleMetric[] {
  return [
    { label: 'Backend target', value: 'ecobe-mvp', note: 'Only approved backend surface for HaloGrid.', tone: 'positive' },
    { label: 'Backend isolation', value: 'Blocked', note: 'No bypass route is exposed.', tone: 'danger' },
    { label: 'Synthetic telemetry', value: 'Removed', note: 'The live console no longer renders fake telemetry.', tone: 'danger' },
    { label: 'Console scope', value: 'Frontend only', note: 'HaloGrid remains scoped to the console surface.', tone: 'neutral' },
  ]
}

function defaultSurfaces(): ConsoleSurface[] {
  return [
    {
      id: 'console-ingress',
      label: 'Console ingress',
      code: 'ING',
      status: 'green',
      signal: 'Ready for ecobe-mvp traffic',
      policy: 'Transport pinned to backend proxy',
      lastAction: 'Awaiting first live payload',
    },
    {
      id: 'policy-rail',
      label: 'Policy rail',
      code: 'POL',
      status: 'yellow',
      signal: 'Guardrails active',
      policy: 'Backend bypass blocked',
      lastAction: 'Static enforcement enabled',
    },
    {
      id: 'audit-rail',
      label: 'Audit rail',
      code: 'AUD',
      status: 'red',
      signal: 'No live audit stream yet',
      policy: 'Render-safe empty state on load',
      lastAction: 'Simulation surface disabled',
    },
  ]
}

function defaultEvents(): ConsoleEvent[] {
  const now = new Date().toISOString()
  return [
    {
      id: 'bootstrap-1',
      title: 'Console contract loaded',
      detail: 'HaloGrid now renders an operational shell while it waits for ecobe-mvp.',
      timestamp: now,
      tone: 'positive',
    },
    {
      id: 'bootstrap-2',
      title: 'Synthetic telemetry removed',
      detail: 'No live-surface drift, synthetic telemetry, or synthetic status wording remains.',
      timestamp: now,
      tone: 'danger',
    },
    {
      id: 'bootstrap-3',
      title: 'Backend restriction set',
      detail: 'Only ecobe-mvp is permitted as the console backend target.',
      timestamp: now,
      tone: 'neutral',
    },
  ]
}

function defaultIntegrations(): ConsoleIntegration[] {
  return [{ name: 'ecobe-mvp', status: 'required', mode: 'console target' }]
}

function normalizeStatus(connectionState: ConnectionState, statusCode: number | null): ConsoleStatus {
  if (connectionState === 'connected') return 'LIVE_IN_PRODUCTION'
  if (statusCode === 401 || statusCode === 403) {
    return 'BLOCKED_BY_CREDENTIALS'
  }
  if (connectionState === 'blocked' || connectionState === 'error' || connectionState === 'degraded') {
    return 'BLOCKED_BY_MISSING_INFRA'
  }
  return 'IN_PROGRESS'
}

function normalizeSnapshot(raw: unknown, health: unknown, connectionState: ConnectionState, errorMessage: string | null): ConsoleSnapshot {
  const record = raw && typeof raw === 'object' ? (raw as Record<string, unknown>) : {}
  const healthRecord = health && typeof health === 'object' ? (health as Record<string, unknown>) : {}
  return {
    backendLabel: toString(record.backendLabel ?? record.service ?? healthRecord.service ?? 'ecobe-mvp', 'ecobe-mvp'),
    backendBaseUrl: ECOBE_MVP_BASE_URL,
    connectionState,
    statusLine: toString(
      record.statusLine ?? record.summary ?? healthRecord.status ?? errorMessage ?? 'Awaiting ecobe-mvp payload',
      errorMessage ?? 'Awaiting ecobe-mvp payload',
    ),
    lastSyncedAt: toString(record.lastSyncedAt ?? record.updatedAt, ''),
    metrics: normalizeMetrics(record.metrics),
    surfaces: normalizeSurfaces(record.surfaces ?? record.regions),
    events: normalizeEvents(record.events ?? record.activity),
    integrations: normalizeIntegrations(record.integrations),
    guardrails: Array.isArray(record.guardrails)
        ? record.guardrails.map((item) => toString(item, '')).filter(Boolean)
        : [
          'No backend bypass',
          'No synthetic telemetry',
          'No blank shell on load',
          'Backend target pinned to ecobe-mvp',
        ],
  }
}

export async function loadConsoleRuntime(): Promise<{
  status: ConsoleStatus
  connectionState: ConnectionState
  snapshot: ConsoleSnapshot
  error: string | null
}> {
  let health: unknown = null
  let snapshot: unknown = null
  let error: EcobeMvpError | null = null
  let connectionState: ConnectionState = 'connecting'
  let errorMessage: string | null = null

  try {
    const [healthResult, snapshotResult] = await Promise.allSettled([
      requestJson<unknown>('/health'),
      requestJson<unknown>('/console'),
    ])

    if (healthResult.status === 'fulfilled') {
      health = healthResult.value
      connectionState = 'connected'
    } else if (healthResult.reason instanceof EcobeMvpError) {
      error = healthResult.reason
    }

    if (snapshotResult.status === 'fulfilled') {
      snapshot = snapshotResult.value
    } else if (!error && snapshotResult.reason instanceof EcobeMvpError) {
      error = snapshotResult.reason
    }

    if (error) {
      connectionState =
        error.reason === 'credentials'
          ? 'blocked'
          : error.reason === 'degraded'
            ? 'degraded'
            : 'error'
      errorMessage = error.message
    }
  } catch (caught) {
    if (caught instanceof EcobeMvpError) {
      error = caught
      connectionState =
        caught.reason === 'credentials'
          ? 'blocked'
          : caught.reason === 'degraded'
            ? 'degraded'
            : 'error'
      errorMessage = caught.message
    } else {
      errorMessage = 'ecobe-mvp request failed'
      connectionState = 'error'
    }
  }

  const normalizedSnapshot = normalizeSnapshot(snapshot, health, connectionState, errorMessage)

  if (connectionState === 'connected' && normalizedSnapshot.statusLine === 'Awaiting ecobe-mvp payload') {
    normalizedSnapshot.statusLine = 'Connected to ecobe-mvp'
  }

  return {
    status: normalizeStatus(connectionState, error?.statusCode ?? null),
    connectionState,
    snapshot: normalizedSnapshot,
    error: errorMessage,
  }
}

export function getEcobeMvpBaseUrl(): string {
  return ECOBE_MVP_BASE_URL
}
