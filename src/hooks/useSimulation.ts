import { useState, useEffect, useRef, useCallback } from 'react'
import type { Region, Decision, TraceFrame, SystemMetrics, Tier } from '../types'
import { REGIONS, tickRegions, makeDecision, makeTrace, calcMetrics } from '../lib/simulation'

const MAX_DECISIONS = 120
const MAX_TRACES    = 200

export function useSimulation(tier: Tier) {
  const [regions,   setRegions]   = useState<Region[]>(REGIONS)
  const [decisions, setDecisions] = useState<Decision[]>([])
  const [traces,    setTraces]    = useState<TraceFrame[]>([])
  const [metrics,   setMetrics]   = useState<SystemMetrics>({
    totalSavings: 0, decisionsToday: 0, avgCarbon: 310, uptimePct: 99.94, activeRegions: 7, alertCount: 3
  })
  const [paused, setPaused] = useState(false)
  const tickRef = useRef<ReturnType<typeof setInterval>>()

  const tick = useCallback(() => {
    setRegions(prev => {
      const next = tickRegions(prev)
      const newDecisions: Decision[] = []
      const newTraces:    TraceFrame[] = []
      next.forEach(r => {
        if (Math.random() > 0.55) {
          const d = makeDecision(r)
          newDecisions.push(d)
          if (tier === 'elite') newTraces.push(makeTrace(d))
        }
      })
      setDecisions(p => [...newDecisions, ...p].slice(0, MAX_DECISIONS))
      if (tier === 'elite') setTraces(p => [...newTraces, ...p].slice(0, MAX_TRACES))
      setMetrics(calcMetrics(next, newDecisions))
      return next
    })
  }, [tier])

  useEffect(() => {
    if (paused) { clearInterval(tickRef.current); return }
    tickRef.current = setInterval(tick, tier === 'freeview' ? 4000 : 2200)
    return () => clearInterval(tickRef.current)
  }, [tick, paused, tier])

  const toggle = () => setPaused(p => !p)
  const reset  = () => { setRegions(REGIONS); setDecisions([]); setTraces([]) }

  return { regions, decisions, traces, metrics, paused, toggle, reset }
}
