import { useEffect, useState } from 'react'

export interface ProviderConfigStatus {
  tomorrow: boolean
  ember: boolean
  gridstatus: boolean
  watttime: boolean
  openMeteo: boolean
  aqueduct: boolean
}

export function useProviderConfig() {
  const [config, setConfig] = useState<ProviderConfigStatus | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      try {
        const response = await fetch('/api/providers/config', {
          headers: { Accept: 'application/json' },
        })

        if (!response.ok) {
          throw new Error('Provider config unavailable')
        }

        const payload = (await response.json()) as Partial<ProviderConfigStatus>
        if (!cancelled) {
          setConfig({
            tomorrow: Boolean(payload.tomorrow),
            ember: Boolean(payload.ember),
            gridstatus: Boolean(payload.gridstatus),
            watttime: Boolean(payload.watttime),
            openMeteo: Boolean(payload.openMeteo),
            aqueduct: Boolean(payload.aqueduct),
          })
        }
      } catch {
        if (!cancelled) {
          setConfig(null)
        }
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [])

  return config
}
