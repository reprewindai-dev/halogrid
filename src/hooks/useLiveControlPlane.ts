import { useEffect, useRef, useState } from 'react'

import type { BackendHealth, Decision, Region, SystemMetrics, TraceFrame } from '../types'
import { fetchBackendHealth, fetchLiveControlSnapshot } from '../lib/backend'

const POLL_MS = 20_000

const EMPTY_METRICS: SystemMetrics = {
  totalSavings: 0,
  decisionsToday: 0,
  avgCarbon: 0,
  uptimePct: 0,
  activeRegions: 0,
  alertCount: 0,
}

export function useLiveControlPlane() {
  const [regions, setRegions] = useState<Region[]>([])
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [traces, setTraces] = useState<TraceFrame[]>([])
  const [metrics, setMetrics] = useState<SystemMetrics>(EMPTY_METRICS)
  const [paused, setPaused] = useState(false)
  const [backendHealth, setBackendHealth] = useState<BackendHealth | null>(null)
  const [backendError, setBackendError] = useState<string | null>(null)
  const inFlightRef = useRef(false)

  const load = async () => {
    if (inFlightRef.current) return
    inFlightRef.current = true

    try {
      const [healthResult, snapshotResult] = await Promise.allSettled([
        fetchBackendHealth(),
        fetchLiveControlSnapshot(30),
      ])

      if (healthResult.status === 'fulfilled') {
        setBackendHealth(healthResult.value)
      }

      if (snapshotResult.status === 'fulfilled') {
        setRegions(snapshotResult.value.regions)
        setDecisions(snapshotResult.value.decisions)
        setTraces(snapshotResult.value.traces)
        setMetrics(snapshotResult.value.metrics)
      }

      if (healthResult.status === 'rejected' && snapshotResult.status === 'rejected') {
        const healthMessage = healthResult.reason instanceof Error ? healthResult.reason.message : 'Health fetch failed'
        const snapshotMessage =
          snapshotResult.reason instanceof Error ? snapshotResult.reason.message : 'Live data fetch failed'
        setBackendError(`${healthMessage}; ${snapshotMessage}`)
      } else {
        setBackendError(null)
      }
    } finally {
      inFlightRef.current = false
    }
  }

  useEffect(() => {
    let cancelled = false

    const tick = async () => {
      if (cancelled || paused) return
      await load()
    }

    void tick()
    const timer = window.setInterval(() => {
      void tick()
    }, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [paused])

  return {
    regions,
    decisions,
    traces,
    metrics,
    paused,
    toggle: () => setPaused((value) => !value),
    reset: () => {
      void load()
    },
    backendHealth,
    backendError,
  }
}

