import type { BackendHealth, Decision, Region, RouterAction, SystemMetrics, TraceFrame } from '../types'

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env

// Browser calls must target the MCP broker surface only.
export const HALOGRID_API_BASE = (
  viteEnv?.VITE_MCP_API_BASE ||
  '/api/ecobe'
).replace(/\/+$/, '')

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

function asNumber(value: unknown, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function parseJson(value: string | null): JsonRecord {
  if (!value) return {}
  try {
    return JSON.parse(value) as JsonRecord
  } catch {
    return {}
  }
}

function toIsoTimestamp(value: unknown): string {
  if (typeof value === 'string' && value.trim()) return value
  return new Date().toISOString()
}

function toAction(value: unknown): RouterAction {
  if (typeof value !== 'string') return 'PASS'
  const normalized = value.trim().toLowerCase()
  if (normalized === 'reroute' || normalized === 'shift_region' || normalized === 'shift') return 'SHIFT_REGION'
  if (normalized === 'delay' || normalized === 'defer' || normalized === 'defer_job') return 'DEFER_JOB'
  if (normalized === 'throttle') return 'THROTTLE'
  if (normalized === 'deny' || normalized === 'hold') return 'HOLD'
  return 'PASS'
}

function toState(carbon: number): Region['state'] {
  if (carbon >= 400) return 'red'
  if (carbon >= 220) return 'yellow'
  return 'green'
}

function toTrend(value: unknown): Region['trend'] {
  if (typeof value === 'number') {
    if (value > 1) return 'up'
    if (value < -1) return 'down'
    return 'flat'
  }
  if (typeof value === 'string') {
    const normalized = value.trim().toLowerCase()
    if (normalized === 'up') return 'up'
    if (normalized === 'down') return 'down'
  }
  return 'flat'
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

const REGION_LABELS: Record<string, string> = {
  'us-east-1': 'US East (N. Virginia)',
  'us-east-2': 'US East (Ohio)',
  'us-west-1': 'US West (N. California)',
  'us-west-2': 'US West (Oregon)',
  'us-central-1': 'US Central',
  'eu-west-1': 'Europe (Ireland)',
  'eu-west-2': 'Europe (London)',
  'eu-central-1': 'Europe (Frankfurt)',
  'ap-southeast-1': 'Asia Pacific (Singapore)',
  'ap-northeast-1': 'Asia Pacific (Tokyo)',
  'ap-south-1': 'Asia Pacific (Mumbai)',
}

function regionLabel(regionId: string) {
  return REGION_LABELS[regionId] ?? regionId
}

type LiveControlSnapshot = {
  regions: Region[]
  decisions: Decision[]
  traces: TraceFrame[]
  metrics: SystemMetrics
}

function normalizeDecisions(payload: JsonRecord, limit: number): Decision[] {
  const rows = Array.isArray(payload.decisions) ? payload.decisions : []
  return rows.slice(0, limit).map((row, index) => {
    const record = asRecord(row)
    const rawConfidence = asNumber(record.signalConfidence, 0.5)
    const confidence =
      rawConfidence <= 1 ? Math.round(rawConfidence * 100) : Math.round(rawConfidence)
    const baseline = asNumber(record.baseline, 0)
    const intensity = asNumber(record.carbonIntensity, baseline)
    const savings = Math.max(0, asNumber(record.savings, 0))

    return {
      id: asString(record.decisionFrameId, `decision-${index}`),
      regionId: asString(record.selectedRegion, `region-${index}`),
      regionName: regionLabel(asString(record.selectedRegion, `region-${index}`)),
      action: toAction(record.action ?? record.decisionAction),
      reason: asString(record.reasonCode, 'Live decision frame'),
      carbon: Math.round(intensity),
      savings: Number(savings.toFixed(2)),
      timestamp: Date.parse(toIsoTimestamp(record.createdAt)),
      confidence: Math.max(0, Math.min(100, confidence)),
      proofHash: asString(record.proofHash, 'unavailable'),
    }
  })
}

function normalizeRegionsFromGridSummary(
  payload: JsonRecord,
  decisionsByRegion: Map<string, Decision>,
): Region[] {
  const rows = Array.isArray(payload.regions) ? payload.regions : []
  return rows.map((row) => {
    const record = asRecord(row)
    const regionId = asString(record.region, 'unknown')
    const carbon = Math.round(asNumber(record.carbonIntensity, 0))
    const renewable = Math.round(Math.max(0, Math.min(100, asNumber(record.renewableRatio, 0) * 100)))
    const demandRamp = asNumber(record.demandRampPct, 0)
    const load = Math.round(Math.max(0, Math.min(100, 50 + demandRamp)))
    const signalQuality = asString(record.signalQuality, 'low')
    const stressFromQuality = signalQuality === 'high' ? 0.25 : signalQuality === 'medium' ? 0.45 : 0.65
    const latestDecision = decisionsByRegion.get(regionId)

    return {
      id: regionId,
      name: regionLabel(regionId),
      code: regionId.toUpperCase(),
      lat: 0,
      lng: 0,
      carbon,
      renewable,
      load,
      waterStress: stressFromQuality,
      state: toState(carbon),
      lastDecision: latestDecision?.action ?? 'PASS',
      trend: toTrend(demandRamp),
      provider: asString(record.source, 'MCP'),
    }
  })
}

function normalizeRegionsFromDashboard(
  payload: JsonRecord,
  decisionsByRegion: Map<string, Decision>,
): Region[] {
  const rows = Array.isArray(payload.regions) ? payload.regions : []
  return rows.map((row) => {
    const record = asRecord(row)
    const regionId = asString(record.code, 'unknown').toLowerCase()
    const carbon = Math.round(asNumber(record.carbonIntensityGPerKwh, 0))
    const latestDecision = decisionsByRegion.get(regionId)

    return {
      id: regionId,
      name: asString(record.name, regionLabel(regionId)),
      code: asString(record.code, regionId.toUpperCase()),
      lat: 0,
      lng: 0,
      carbon,
      renewable: 0,
      load: 50,
      waterStress: 0.5,
      state: toState(carbon),
      lastDecision: latestDecision?.action ?? 'PASS',
      trend: 'flat',
      provider: 'MCP',
    }
  })
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

export async function fetchLiveControlSnapshot(limit = 24): Promise<LiveControlSnapshot> {
  const [gridSummary, dashboardRegions, decisions, metrics] = await Promise.all([
    fetchJson('/intelligence/grid/summary').catch(() => ({ ok: false, status: 0, body: {} as JsonRecord })),
    fetchJson('/dashboard/regions').catch(() => ({ ok: false, status: 0, body: {} as JsonRecord })),
    fetchJson(`/ci/decisions?limit=${Math.max(1, Math.min(100, limit))}&offset=0`).catch(() => ({
      ok: false,
      status: 0,
      body: {} as JsonRecord,
    })),
    fetchJson('/dashboard/metrics?window=24h').catch(() => ({ ok: false, status: 0, body: {} as JsonRecord })),
  ])

  if (!gridSummary.ok && !dashboardRegions.ok && !decisions.ok && !metrics.ok) {
    throw new Error(
      `Broker live data request failed with ${gridSummary.status}/${dashboardRegions.status}/${decisions.status}/${metrics.status}`,
    )
  }

  const decisionList = decisions.ok ? normalizeDecisions(decisions.body, limit) : []
  const decisionsByRegion = new Map<string, Decision>()
  for (const decision of decisionList) {
    if (!decisionsByRegion.has(decision.regionId)) {
      decisionsByRegion.set(decision.regionId, decision)
    }
  }

  const regions =
    gridSummary.ok
      ? normalizeRegionsFromGridSummary(gridSummary.body, decisionsByRegion)
      : normalizeRegionsFromDashboard(dashboardRegions.body, decisionsByRegion)

  const traces: TraceFrame[] = decisionList.slice(0, 12).map((decision) => ({
    id: decision.id,
    regionName: decision.regionName,
    action: decision.action,
    proofHash: decision.proofHash,
    timestamp: decision.timestamp,
  }))

  const metricsBody = asRecord(metrics.body)
  const avgCarbon =
    regions.length > 0
      ? Math.round(regions.reduce((sum, region) => sum + region.carbon, 0) / regions.length)
      : 0

  const systemMetrics: SystemMetrics = {
    totalSavings: Number((asNumber(metricsBody.co2SavedG, 0) / 1000).toFixed(2)),
    decisionsToday: Math.max(decisionList.length, Math.round(asNumber(metricsBody.totalDecisions, 0))),
    avgCarbon,
    uptimePct: 99.9,
    activeRegions: regions.filter((region) => region.state !== 'red').length,
    alertCount: regions.filter((region) => region.state === 'red').length,
  }

  return {
    regions,
    decisions: decisionList,
    traces,
    metrics: systemMetrics,
  }
}

export function shortRevision(revision: string): string {
  return revision.slice(0, 8)
}

export function humanizeMode(mode?: string): string {
  if (!mode) return 'direct'
  return mode.replace(/_/g, ' ')
}
