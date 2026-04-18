import { useEffect, useState } from 'react'
import type { BackendHealth } from '../types'
import { fetchBackendHealth } from '../lib/backend'

const POLL_MS = 60_000

export function useBackendHealth() {
  const [health, setHealth] = useState<BackendHealth | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const next = await fetchBackendHealth()
        if (cancelled) return
        setHealth(next)
        setError(null)
      } catch (err) {
        if (cancelled) return
        setError(err instanceof Error ? err.message : 'Backend unavailable')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    const timer = window.setInterval(() => { void load() }, POLL_MS)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  return { health, error, loading }
}
