import { useEffect, useMemo, useState } from 'react'
import type { Region, WaterSignal } from '../types'

const POLL_MS = 60_000

export function useWaterSignals(regions: Region[]) {
  const regionKey = useMemo(() => regions.map((region) => region.id).join(','), [regions])
  const [signals, setSignals] = useState<Record<string, WaterSignal>>({})

  useEffect(() => {
    if (!regionKey) {
      setSignals({})
      return
    }

    let cancelled = false

    const load = async () => {
      try {
        const query = new URLSearchParams({ regionIds: regionKey })
        const response = await fetch(`/api/water/signals?${query.toString()}`, {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Water signals unavailable')
        }

        const payload = (await response.json()) as { signals?: WaterSignal[] }
        if (cancelled) return

        const nextSignals = Object.fromEntries(
          (payload.signals ?? []).map((signal) => [signal.regionId, signal]),
        )
        setSignals(nextSignals)
      } catch {
        if (!cancelled) {
          setSignals({})
        }
      }
    }

    void load()
    const timer = window.setInterval(() => {
      void load()
    }, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [regionKey])

  return signals
}
