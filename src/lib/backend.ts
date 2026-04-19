import type { BackendHealth } from '../types'

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env

// Use the site proxy by default so the browser stays same-origin and never
// depends on direct cross-origin broker calls.
export const HALOGRID_API_BASE = (viteEnv?.VITE_HALOGRID_API_BASE || '/api/ecobe').replace(/\/+$/, '')

type JsonRecord = Record<string, unknown>

function asRecord(value: unknown): JsonRecord {
  return value && typeof value === 'object' ? (value as JsonRecord) : {}
}

function asString(value: unknown, fallback: string) {
  return typeof value === 'string' && value.trim().length > 0 ? value : fallback
}

function asBoolean(value: unknown, fallback = false) {
  return typeof value === 'boolean' ? value : fallback
}

function parseJson(value: string | null): JsonRecord {
  if (!value) return {}
  try {
    return JSON.parse(value) as JsonRecord
  } catch {
    return {}
  }
}

function normalizeProviderKey(name: string) {
  const normalized = name.trim().toLowerCase().replace(/[\s_-]+/g, '')
  const aliases: Record<string, string> = {
    watttime: 'watttime',
    gridstatus: 'gridstatus',
    eia930: 'eia930',
    ember: 'ember',
    gbcarbon: 'gbCarbon',
    dkcarbon: 'dkCarbon',
    ficarbon: 'fiCarbon',
    oncarbon: 'onCarbon',
    qccarbon: 'qcCarbon',
    bccarbon: 'bcCarbon',
    openmeteo: 'openMeteo',
    aqueduct: 'aqueduct',
    staticdataset: 'static',
  }

  return aliases[normalized] ?? normalized
}

async function fetchJson(path: string) {
  const response = await fetch(`${HALOGRID_API_BASE}${path}`, {
    headers: { Accept: 'application/json' },
    cache: 'no-store',
  })
  const text = await response.text()
  return {
    ok: response.ok,
    status: response.status,
    body: parseJson(text),
  }
}

function normalizeBackendHealth(health: JsonRecord, providerHealth: JsonRecord, systemStatus: JsonRecord): BackendHealth {
  const providerList = Array.isArray(providerHealth.providers) ? (providerHealth.providers as Array<JsonRecord>) : []
  const providers = providerList.reduce<Record<string, boolean>>((acc, provider) => {
    const name = typeof provider.name === 'string' ? provider.name : ''
    if (!name) return acc
    acc[normalizeProviderKey(name)] = provider.status !== 'offline'
    return acc
  }, {})

  const build = asRecord(health.build ?? systemStatus.build)
  const checks = asRecord(systemStatus.dependencies)
  const cache = asRecord(systemStatus.cache)

  return {
    status: asString(health.status ?? systemStatus.status, 'healthy'),
    engine: asString(health.service ?? 'co2router-mcp', 'co2router-mcp'),
    router: asBoolean(health.router ?? true, true),
    fingrid: asBoolean(health.fingrid ?? false, false),
    providers,
    providerModes: {},
    build: {
      revision: asString(build.commit ?? build.revision ?? health.timestamp ?? systemStatus.timestamp, 'unknown'),
      branch: asString(build.branch ?? health.version ?? 'production', 'production'),
      serviceId: asString(build.serviceId ?? 'co2router-mcp', 'co2router-mcp'),
      serviceName: asString(build.serviceName ?? 'CO2 Router MCP', 'CO2 Router MCP'),
      instanceId: asString(build.instanceId ?? health.timestamp ?? systemStatus.timestamp, health.timestamp ? String(health.timestamp) : 'instance'),
      runtimeRoot: asString(build.runtimeRoot ?? '/api/v1', '/api/v1'),
      nestedDuplicatePathDetected: asBoolean(build.nestedDuplicatePathDetected, false),
    },
    timestamp: asString(health.timestamp ?? systemStatus.timestamp, new Date().toISOString()),
    checks: {
      database: asBoolean(checks.database, false),
      redis: asBoolean(checks.redis, false),
      waterArtifacts: {
        bundlePresent: Number(cache.regionCount ?? 0) > 0,
        manifestPresent: Number(cache.regionCount ?? 0) > 0,
        schemaCompatible: Number(cache.regionCount ?? 0) > 0,
        regionCount: Number(cache.regionCount ?? 0),
        sourceCount: Number(cache.regionCount ?? 0),
        datasetHashesPresent: Number(cache.regionCount ?? 0) > 0,
      },
    },
    dependencies: {
      database: asBoolean(checks.database, false),
      redis: asBoolean(checks.redis, false),
    },
    waterArtifactErrors: Array.isArray(asRecord(systemStatus.runtime).incidents)
      ? (asRecord(systemStatus.runtime).incidents as Array<JsonRecord>)
          .filter((incident) => incident.status === 'OPEN')
          .map((incident) => asString(incident.summary, 'Open incident'))
      : [],
  }
}

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const [health, providerHealth, systemStatus] = await Promise.all([
    fetchJson('/health'),
    fetchJson('/methodology/providers').catch(() => ({ ok: false, status: 0, body: {} as JsonRecord })),
    fetchJson('/system/status').catch(() => ({ ok: false, status: 0, body: {} as JsonRecord })),
  ])

  if (!health.ok && !providerHealth.ok && !systemStatus.ok) {
    throw new Error(`Broker health request failed with ${health.status}/${providerHealth.status}/${systemStatus.status}`)
  }

  return normalizeBackendHealth(health.body, providerHealth.body, systemStatus.body)
}

export function shortRevision(revision: string): string {
  return revision.slice(0, 8)
}

export function humanizeMode(mode?: string): string {
  if (!mode) return 'direct'
  return mode.replace(/_/g, ' ')
}
