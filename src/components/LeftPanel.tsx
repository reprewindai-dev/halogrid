import { Database, ShieldAlert, Layers3 } from 'lucide-react'
import type { ConsoleMetric, ConsoleSnapshot } from '../types'
import { toneColor, toneLabel } from '../lib/utils'

interface Props {
  snapshot: ConsoleSnapshot
}

function MetricCard({ metric }: { metric: ConsoleMetric }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
          {metric.label}
        </div>
        <div className="text-[10px] font-mono tracking-[0.18em] uppercase" style={{ color: toneColor(metric.tone) }}>
          {toneLabel(metric.tone)}
        </div>
      </div>
      <div className="mt-2 text-base font-semibold text-slate-100">
        {metric.value}
      </div>
      <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
        {metric.note}
      </div>
    </div>
  )
}

export default function LeftPanel({ snapshot }: Props) {
  return (
    <aside className="flex w-full flex-col gap-4 border-r border-white/10 bg-slate-950/70 p-4 lg:w-[340px] lg:max-w-[340px]">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
          <Database size={12} />
          Backend contract
        </div>
        <div className="mt-3 text-sm font-semibold text-slate-100">
          {snapshot.backendLabel}
        </div>
        <div className="mt-1 text-[11px] leading-relaxed text-slate-400">
          {snapshot.backendBaseUrl}
        </div>
        <div className="mt-3 rounded-2xl border border-emerald-400/15 bg-emerald-400/5 px-3 py-2 text-[11px] leading-relaxed text-slate-300">
          {snapshot.statusLine}
        </div>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
          <ShieldAlert size={12} />
          Guardrails
        </div>
        <div className="mt-3 space-y-2">
          {snapshot.guardrails.map((item) => (
            <div key={item} className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2 text-[11px] leading-relaxed text-slate-300">
              {item}
            </div>
          ))}
        </div>
      </div>

      <div className="grid gap-3">
        {snapshot.metrics.map((metric) => (
          <MetricCard key={metric.label} metric={metric} />
        ))}
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-4">
        <div className="flex items-center gap-2 text-[10px] font-mono tracking-[0.22em] uppercase text-slate-400">
          <Layers3 size={12} />
          Surface summary
        </div>
        <div className="mt-3 space-y-2">
          {snapshot.surfaces.map((surface) => (
            <div key={surface.id} className="rounded-2xl border border-white/8 bg-white/[0.02] px-3 py-2">
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-medium text-slate-100">{surface.label}</div>
                <div className="text-[10px] font-mono uppercase tracking-[0.18em]" style={{ color: toneColor(surface.status === 'green' ? 'positive' : surface.status === 'yellow' ? 'warning' : 'danger') }}>
                  {surface.code}
                </div>
              </div>
              <div className="mt-1 text-[11px] leading-relaxed text-slate-400">{surface.signal}</div>
              <div className="mt-2 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-500">
                {surface.policy}
              </div>
            </div>
          ))}
        </div>
      </div>
    </aside>
  )
}
