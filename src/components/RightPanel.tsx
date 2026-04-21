import { Activity, PlugZap, TerminalSquare } from 'lucide-react'
import type { ConsoleSnapshot } from '../types'
import { formatDateTime, toneColor, toneLabel } from '../lib/utils'

interface Props {
  snapshot: ConsoleSnapshot
}

export default function RightPanel({ snapshot }: Props) {
  return (
    <aside className="flex w-full flex-col gap-4 border-l border-white/10 bg-slate-950/70 p-4 lg:w-[360px] lg:max-w-[360px]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
          <PlugZap size={12} />
          Integrations
        </div>
        <div className="mt-3 space-y-2">
          {snapshot.integrations.map((integration) => (
            <div key={`${integration.name}-${integration.mode}`} className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-100">{integration.name}</div>
                <div className="text-[10px] font-mono tracking-[0.18em] uppercase" style={{ color: toneColor(integration.status === 'required' ? 'positive' : integration.status === 'blocked' ? 'danger' : 'neutral') }}>
                  {integration.status}
                </div>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {integration.mode}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
          <Activity size={12} />
          Activity rail
        </div>
        <div className="mt-3 space-y-2">
          {snapshot.events.map((event) => (
            <div key={event.id} className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-100">{event.title}</div>
                <div className="text-[10px] font-mono tracking-[0.18em] uppercase" style={{ color: toneColor(event.tone) }}>
                  {toneLabel(event.tone)}
                </div>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
                {event.detail}
              </div>
              <div className="mt-2 text-[10px] font-mono tracking-[0.16em] uppercase text-slate-500">
                {formatDateTime(event.timestamp)}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-sky-400/10 to-transparent p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
          <TerminalSquare size={12} />
          Runtime note
        </div>
        <div className="mt-3 text-sm leading-relaxed text-slate-200">
          CO2 Grid renders as a console-only surface. It is pinned to the approved backend and has no backend bypass path.
        </div>
      </div>
    </aside>
  )
}
