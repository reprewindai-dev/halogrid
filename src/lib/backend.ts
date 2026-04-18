import type { BackendHealth } from '../types'

const viteEnv = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env

export const HALOGRID_API_BASE =
  (viteEnv?.VITE_HALOGRID_API_BASE || 'https://ecobe-engineclaude-co2router.onrender.com').replace(/\/+$/, '')

export async function fetchBackendHealth(): Promise<BackendHealth> {
  const response = await fetch(`${HALOGRID_API_BASE}/health`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Backend health request failed with ${response.status}`)
  }

  return response.json() as Promise<BackendHealth>
}

export function shortRevision(revision: string): string {
  return revision.slice(0, 8)
}

export function humanizeMode(mode?: string): string {
  if (!mode) return 'direct'
  return mode.replace(/_/g, ' ')
}
