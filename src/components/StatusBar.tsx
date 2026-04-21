import type { ConsoleSnapshot, ConnectionState, ConsoleStatus } from '../types'
import { toneColor } from '../lib/utils'

interface Props {
  snapshot: ConsoleSnapshot
  connectionState: ConnectionState
  status: ConsoleStatus
}

function labelForConnection(state: ConnectionState): string {
  const map: Record<ConnectionState, string> = {
    idle: 'IDLE',
    connecting: 'CONNECTING',
    connected: 'CONNECTED',
    degraded: 'DEGRADED',
    blocked: 'BLOCKED',
    error: 'ERROR',
  }
  return map[state]
}

export default function StatusBar({ snapshot, connectionState, status }: Props) {
  const tone = connectionState === 'connected' ? 'positive' : connectionState === 'blocked' ? 'danger' : connectionState === 'degraded' ? 'warning' : 'neutral'

  return (
    <div
      className="flex items-center justify-between gap-3 border-t border-white/10 px-4 py-2 console-shell"
      style={{ fontSize: 10 }}
    >
      <div className="flex flex-wrap items-center gap-4 font-mono tracking-[0.14em] uppercase text-slate-400">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: toneColor(tone), boxShadow: `0 0 10px ${toneColor(tone)}55` }} />
          <span>{labelForConnection(connectionState)}</span>
        </span>
        <span>STATUS: {status}</span>
        <span>TARGET: {snapshot.backendLabel}</span>
        <span>SURFACE: CONSOLE ONLY</span>
      </div>
      <div className="flex flex-wrap items-center gap-4 font-mono tracking-[0.14em] uppercase text-slate-500">
        {snapshot.guardrails.slice(0, 3).map((item) => (
          <span key={item}>{item}</span>
        ))}
      </div>
    </div>
  )
}
