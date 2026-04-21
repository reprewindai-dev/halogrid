import { RefreshCcw, ShieldCheck, Slash } from 'lucide-react'
import type { ConsoleSnapshot, ConnectionState } from '../types'
import { formatDateTime, formatTime, toneColor } from '../lib/utils'

interface Props {
  snapshot: ConsoleSnapshot
  connectionState: ConnectionState
  onRefresh: () => void
  time: number
}

function connectionLabel(connectionState: ConnectionState): string {
  const map: Record<ConnectionState, string> = {
    idle: 'IDLE',
    connecting: 'CONNECTING',
    connected: 'CONNECTED',
    degraded: 'DEGRADED',
    blocked: 'BLOCKED',
    error: 'ERROR',
  }
  return map[connectionState]
}

export default function TopBar({ snapshot, connectionState, onRefresh, time }: Props) {
  const accent = toneColor(connectionState === 'connected' ? 'positive' : connectionState === 'blocked' ? 'danger' : connectionState === 'degraded' ? 'warning' : 'neutral')

  return (
    <header
      className="flex items-center justify-between gap-4 px-5 py-3 console-shell"
      style={{ borderBottom: '1px solid rgba(148, 163, 184, 0.12)' }}
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="halo-mark" aria-hidden="true">
          <span className="halo-mark-core" />
        </div>
        <div className="min-w-0">
          <div className="text-xs font-semibold tracking-[0.28em] uppercase text-slate-100">
            HaloGrid
          </div>
          <div className="text-[10px] font-mono tracking-[0.22em] uppercase text-sky-300/70 truncate">
            CO2 Router console only
          </div>
        </div>
      </div>

      <div className="hidden lg:flex items-center gap-4 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          {snapshot.backendLabel}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">
          {snapshot.backendBaseUrl}
        </span>
        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1" style={{ color: accent }}>
          {connectionLabel(connectionState)}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <div className="hidden md:flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-2 text-[10px] font-mono tracking-[0.16em] uppercase text-slate-300">
          <ShieldCheck size={12} color={accent} />
          <span>{snapshot.statusLine}</span>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          className="h-9 w-9 rounded-xl border border-white/10 bg-white/[0.04] text-slate-200 transition-colors hover:bg-sky-400/10"
          aria-label="Refresh ecobe-mvp status"
        >
          <RefreshCcw size={14} className="mx-auto" />
        </button>
        <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] px-3 py-2 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
          <Slash size={12} color={accent} />
          <span>{formatDateTime(snapshot.lastSyncedAt)}</span>
        </div>
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-slate-500">
          {formatTime(time)}
        </div>
      </div>
    </header>
  )
}
