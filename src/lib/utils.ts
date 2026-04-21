import type { SurfaceTone } from '../types'

export const formatTime = (value: string | number | Date | null): string => {
  if (value === null) return 'not synced'
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'invalid time'
  return date.toLocaleTimeString('en-CA', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export const formatDateTime = (value: string | number | Date | null): string => {
  if (value === null) return 'not synced'
  const date = typeof value === 'string' || typeof value === 'number' ? new Date(value) : value
  if (Number.isNaN(date.getTime())) return 'invalid time'
  return date.toLocaleString('en-CA', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
}

export const toneColor = (tone: SurfaceTone): string => {
  const map: Record<SurfaceTone, string> = {
    neutral: '#94a3b8',
    positive: '#4ade80',
    warning: '#fbbf24',
    danger: '#f87171',
  }
  return map[tone]
}

export const toneLabel = (tone: SurfaceTone): string => {
  const map: Record<SurfaceTone, string> = {
    neutral: 'STABLE',
    positive: 'READY',
    warning: 'WATCH',
    danger: 'BLOCKED',
  }
  return map[tone]
}

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, value))

export const formatBaseUrl = (baseUrl: string): string => {
  try {
    const parsed = new URL(baseUrl, window.location.origin)
    return parsed.pathname.replace(/\/$/, '') || '/'
  } catch {
    return baseUrl.replace(/\/$/, '') || '/api/backend'
  }
}
