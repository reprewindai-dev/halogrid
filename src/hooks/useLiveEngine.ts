import { useState, useEffect, useRef } from 'react'
import type { Region, Decision, SystemMetrics } from '../types'
import { REGIONS, calcMetrics } from '../lib/simulation'

const ENGINE_BASE = 'https://co2router.tech'
const POLL_MS = 4000

type EngineHealth = { status: string; mode: string }
type EngineRegion = {
  region: string
  carbonIntensity: number
  renewablePct?: number
  loadPct?: number
  waterStressIndex?: number
  state?: string
}
type EngineDecision = {
  decisionFrameId: string
  selectedRegion: string
  action: string
  reasonCode: string
  carbonIntensity?: number
  carbonReductionPct?: number
  createdAt?: string
}

function mapAction(action: string): Region['lastDecision'] {
  const a = action.toLowerCase()
  if (a === 'reroute' || a === 'shift_region') return 'SHIFT_REGION'
  if (a === 'delay' || a === 'defer_job')      return 'DEFER_JOB'
  if (a === 'throttle')                        return 'THROTTLE'
  if (a === 'deny' || a === 'hold')            return 'HOLD'
  return 'PASS'
}

function mergeRegions(base: Region[], live: EngineRegion[]): Region[] {
  return base.map(r => {
    const l = live.find(e => e.region === r.id || e.region === r.code)
    if (!l) return r
    const carbon = Math.round(l.carbonIntensity ?? r.carbon)
    const state: Region['state'] = carbon < 200 ? 'green' : carbon < 400 ? 'yellow' : 'red'
    return {
      ...r,
      carbon,
      renewable: Math.round(l.renewablePct ?? r.renewable),
      load: Math.round(l.loadPct ?? r.load),
      waterStress: l.waterStressIndex ?? r.waterStress,
      state,
      trend: carbon > r.carbon ? 'up' : carbon < r.carbon ? 'down' : 'flat',
    }
  })
}

function mapDecision(d: EngineDecision, regions: Region[]): Decision {
  const region = regions.find(r => r.id === d.selectedRegion || r.code === d.selectedRegion) ?? regions[0]
  return {
    id: d.decisionFrameId,
    regionId: region.id,
    regionName: region.name,
    action: mapAction(d.action),
    reason: d.reasonCode,
    carbon: Math.round(d.carbonIntensity ?? region.carbon),
    savings: Math.round((d.carbonReductionPct ?? 0) * 10) / 10,
    timestamp: d.createdAt ? new Date(d.createdAt).getTime() : Date.now(),
    confidence: 94,
    proofHash: d.decisionFrameId.slice(0, 16),
  }
}

async function fetchJson<T>(path: string, signal?: AbortSignal): Promise<T> {
  const res = await fetch(`${ENGINE_BASE}${path}`, { signal })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export type BackendStatus = 'online' | 'simulation' | 'connecting'

export function useLiveEngine() {
  const [regions,       setRegions]       = useState<Region[]>(REGIONS)
  const [decisions,     setDecisions]     = useState<Decision[]>([])
  const [metrics,       setMetrics]       = useState<SystemMetrics>({ totalSavings: 0, decisionsToday: 0, avgCarbon: 310, uptimePct: 99.94, activeRegions: 7, alertCount: 3 })
  const [backendStatus, setBackendStatus] = useState<BackendStatus>('connecting')
  const abortRef = useRef<AbortController | null>(null)
  const regionsRef = useRef<Region[]>(REGIONS)

  useEffect(() => {
    regionsRef.current = regions
  }, [regions])

  useEffect(() => {
    let alive = true

    async function poll() {
      if (abortRef.current) abortRef.current.abort()
      abortRef.current = new AbortController()
      const { signal } = abortRef.current

      try {
        const health = await fetchJson<EngineHealth>('/health', signal)
        if (!alive) return

        if (health.status === 'ok' || health.status === 'healthy' || health.status === 'degraded') {
          setBackendStatus('online')

          // Fetch regions
          try {
            const regionData = await fetchJson<{ regions: EngineRegion[] }>('/api/v1/regions/summary', signal)
            if (!alive) return
            if (regionData.regions?.length) {
              const merged = mergeRegions(regionsRef.current, regionData.regions)
              setRegions(merged)
              regionsRef.current = merged
            }
          } catch { /* region fetch failed, keep existing */ }

          // Fetch recent decisions
          try {
            const decData = await fetchJson<{ decisions: EngineDecision[] }>('/api/v1/decisions/recent?limit=40', signal)
            if (!alive) return
            if (decData.decisions?.length) {
              const mapped = decData.decisions.map(d => mapDecision(d, regionsRef.current))
              setDecisions(mapped)
              setMetrics(calcMetrics(regionsRef.current, mapped))
            }
          } catch { /* decisions fetch failed */ }
        }
      } catch {
        if (!alive) return
        setBackendStatus(prev => prev === 'connecting' ? 'simulation' : prev)
      }
    }

    poll()
    const interval = setInterval(poll, POLL_MS)
    return () => {
      alive = false
      clearInterval(interval)
      abortRef.current?.abort()
    }
  }, [])

  return { regions, decisions, metrics, backendStatus }
}
