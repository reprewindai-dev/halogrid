import type { RegionState, RouterAction } from '../types'

export const stateColor = (s: RegionState): string =>
  s === 'green' ? '#4ade80' : s === 'yellow' ? '#fbbf24' : '#f87171'

export const actionColor = (a: RouterAction): string => {
  const map: Record<RouterAction, string> = {
    SHIFT_REGION: '#38bdf8',
    DEFER_JOB: '#a78bfa',
    THROTTLE: '#fbbf24',
    HOLD: '#f87171',
    PASS: '#4ade80',
  }
  return map[a]
}

export const actionLabel = (a: RouterAction): string => {
  const map: Record<RouterAction, string> = {
    SHIFT_REGION: 'SHIFT',
    DEFER_JOB: 'DEFER',
    THROTTLE: 'THROT',
    HOLD: 'HOLD',
    PASS: 'PASS',
  }
  return map[a]
}

export const formatTime = (ts: number): string =>
  new Date(ts).toLocaleTimeString('en-CA', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })

export const formatHash = (hash: string, len = 8): string =>
  `${hash.slice(0, len)}...`

export const clamp = (v: number, min: number, max: number): number =>
  Math.min(max, Math.max(min, v))

export const lerp = (a: number, b: number, t: number): number =>
  a + (b - a) * t

export const randomBetween = (min: number, max: number): number =>
  Math.random() * (max - min) + min

export const randomInt = (min: number, max: number): number =>
  Math.floor(randomBetween(min, max + 1))

export const uuid = (): string =>
  Math.random().toString(36).slice(2, 10) + Date.now().toString(36)

export const hashLike = (): string =>
  Array.from({ length: 40 }, () => '0123456789abcdef'[randomInt(0, 15)]).join('')
