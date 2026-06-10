import { ChevronLeft, ChevronRight, Waves, Zap } from 'lucide-react'
import type { BackendHealth, Region, Tier } from '../types'
import { actionColor, actionLabel, stateColor } from '../lib/utils'
import { humanizeMode } from '../lib/backend'

interface Props {
  regions: Region[]
  tier: Tier
  onRegionClick: (region: Region) => void
  collapsed: boolean
  onToggle: () => void
  backendHealth: BackendHealth | null
  backendError: string | null
}

function pct(value: number) {
  return `${Math.round(value)}%`
}

const PROVIDER_LABELS: Record<string, { name: string; type: 'carbon' | 'water'; authority: string }> = {
  watttime: { name: 'WattTime', type: 'carbon', authority: 'Marginal emissions' },
  gridstatus: { name: 'GridStatus', type: 'carbon', authority: 'Grid data network' },
  eia930: { name: 'EIA-930', type: 'carbon', authority: 'Public grid monitor' },
  tomorrow: { name: 'Tomorrow.io', type: 'water', authority: 'Premium weather fallback' },
  ember: { name: 'Ember', type: 'carbon', authority: 'Power data dataset' },
  gbCarbon: { name: 'GB Carbon', type: 'carbon', authority: 'Great Britain carbon feed' },
  dkCarbon: { name: 'DK Carbon', type: 'carbon', authority: 'Denmark carbon feed' },
  fiCarbon: { name: 'FI Carbon', type: 'carbon', authority: 'Finland carbon feed' },
  onCarbon: { name: 'ON Carbon', type: 'carbon', authority: 'Ontario carbon feed' },
  qcCarbon: { name: 'QC Carbon', type: 'carbon', authority: 'Quebec carbon feed' },
  bcCarbon: { name: 'BC Carbon', type: 'carbon', authority: 'British Columbia carbon feed' },
  openMeteo: { name: 'Open-Meteo', type: 'water', authority: 'Public live meteo-water feed' },
  aqueduct: { name: 'Aqueduct', type: 'water', authority: 'Baseline water stress dataset' },
  static: { name: 'Static Dataset', type: 'water', authority: 'Fallback artifact bundle' },
}

export default function LeftPanel({
  regions,
  tier,
  onRegionClick,
  collapsed,
  onToggle,
  backendHealth,
  backendError,
}: Props) {
  const sortedRegions = [...regions].sort((a, b) => a.carbon - b.carbon)
  const averageLoad = Math.round(regions.reduce((sum, region) => sum + region.load, 0) / Math.max(regions.length, 1))
  const backendProviders = backendHealth
    ? Object.entries(backendHealth.providers).map(([key, online]) => {
        const meta = PROVIDER_LABELS[key] ?? { name: key, type: 'carbon' as const, authority: 'Backend provider' }
        return {
          name: meta.name,
          type: meta.type,
          authority: backendHealth.providerModes?.[key] ? humanizeMode(backendHealth.providerModes[key]) : meta.authority,
          status: online ? 'healthy' : 'offline',
          freshness: online ? 0 : 999,
        }
      })
    : []
  const liveProviders = backendProviders

  return (
    <aside
      className={`relative z-20 flex h-full flex-shrink-0 flex-col border-r transition-all duration-300 ${
        collapsed ? 'w-[72px]' : 'w-[340px]'
      }`}
      style={{
        borderColor: 'rgba(56,189,248,0.08)',
        background: 'linear-gradient(180deg, rgba(6,13,24,0.95) 0%, rgba(6,13,24,0.88) 100%)',
        backdropFilter: 'blur(24px)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {!collapsed && (
          <div>
            <div className="text-[10px] font-mono tracking-[0.24em]" style={{ color: 'rgba(56,189,248,0.75)' }}>
              REGION MESH
            </div>
            <div className="mt-1 text-xs font-semibold text-slate-100">Routing candidates and signal health</div>
          </div>
        )}
        <button
          onClick={onToggle}
          className="flex h-8 w-8 items-center justify-center rounded-xl transition-all"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
          aria-label={collapsed ? 'Expand left panel' : 'Collapse left panel'}
        >
          {collapsed ? <ChevronRight size={14} color="#94a3b8" /> : <ChevronLeft size={14} color="#94a3b8" />}
        </button>
      </div>

      {collapsed ? (
        <div className="flex flex-1 flex-col items-center gap-3 px-2 py-4">
          {sortedRegions.slice(0, 8).map((region) => (
            <button
              key={region.id}
              onClick={() => onRegionClick(region)}
              className="flex w-full flex-col items-center gap-1 rounded-2xl px-2 py-2 transition-all"
              style={{ background: 'rgba(255,255,255,0.03)' }}
              title={region.name}
            >
              <span
                className="h-2 w-2 rounded-full"
                style={{ background: stateColor(region.state), boxShadow: `0 0 8px ${stateColor(region.state)}` }}
              />
              <span className="text-[9px] font-mono tracking-widest text-slate-300">{region.code}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          <div className="scrollbar-thin flex-1 overflow-y-auto px-3 py-3">
            <div className="mb-4 grid grid-cols-3 gap-2">
              <div className="rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-[8px] font-mono tracking-[0.22em] text-slate-500">BEST</div>
                <div className="mt-1 text-sm font-bold text-emerald-400">{sortedRegions[0]?.code ?? '--'}</div>
              </div>
              <div className="rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-[8px] font-mono tracking-[0.22em] text-slate-500">HOT</div>
                <div className="mt-1 text-sm font-bold text-amber-300">{averageLoad}%</div>
              </div>
              <div className="rounded-2xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-[8px] font-mono tracking-[0.22em] text-slate-500">RED</div>
                <div className="mt-1 text-sm font-bold text-rose-400">{regions.filter((region) => region.state === 'red').length}</div>
              </div>
            </div>

            <div className="space-y-2">
              {sortedRegions.map((region) => (
                <button
                  key={region.id}
                  onClick={() => onRegionClick(region)}
                  className="w-full rounded-2xl px-3 py-3 text-left transition-all"
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${stateColor(region.state)}18`,
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span
                          className="h-2 w-2 flex-shrink-0 rounded-full"
                          style={{ background: stateColor(region.state), boxShadow: `0 0 8px ${stateColor(region.state)}` }}
                        />
                        <span className="truncate text-[11px] font-semibold text-slate-100">{region.name}</span>
                      </div>
                      <div className="mt-1 text-[9px] font-mono tracking-[0.18em] text-slate-500">
                        {region.provider} / {region.code}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold tabular-nums" style={{ color: stateColor(region.state) }}>
                        {region.carbon}
                      </div>
                      <div className="text-[8px] font-mono tracking-[0.18em] text-slate-500">gCO2/kWh</div>
                    </div>
                  </div>

                  <div className="mt-3 grid grid-cols-3 gap-2">
                    {[
                      { label: 'REN', value: pct(region.renewable), color: '#4ade80' },
                      { label: 'LOAD', value: pct(region.load), color: '#fbbf24' },
                      { label: 'WATER', value: pct(region.waterStress * 100), color: '#38bdf8' },
                    ].map((item) => (
                      <div key={item.label}>
                        <div className="mb-1 flex items-center justify-between text-[8px] font-mono tracking-[0.16em] text-slate-500">
                          <span>{item.label}</span>
                          <span style={{ color: item.color }}>{item.value}</span>
                        </div>
                        <div className="metric-bar">
                          <div className="metric-bar-fill" style={{ width: item.value, background: item.color }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex items-center justify-between">
                    <span
                      className="rounded-full px-2 py-1 text-[8px] font-mono tracking-[0.18em]"
                      style={{ background: `${actionColor(region.lastDecision)}18`, color: actionColor(region.lastDecision) }}
                    >
                      {actionLabel(region.lastDecision)}
                    </span>
                    <span className="text-[8px] font-mono uppercase tracking-[0.18em] text-slate-500">{region.trend}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {tier !== 'freeview' && (
            <div className="px-3 pb-3">
              <div
                className="rounded-2xl px-3 py-3"
                style={{ border: '1px solid rgba(56,189,248,0.1)', background: 'rgba(255,255,255,0.02)' }}
              >
                <div className="mb-2 text-[10px] font-mono tracking-[0.22em]" style={{ color: 'rgba(56,189,248,0.75)' }}>
                  SIGNAL PROVIDERS
                </div>
                {backendHealth && (
                  <div className="mb-2 grid grid-cols-3 gap-2">
                    <div className="rounded-xl px-2 py-2" style={{ background: 'rgba(255,255,255,0.025)' }}>
                      <div className="text-[8px] font-mono tracking-[0.16em] text-slate-500">ENGINE</div>
                      <div className="mt-1 text-[10px] font-semibold text-emerald-400">{backendHealth.engine}</div>
                    </div>
                    <div className="rounded-xl px-2 py-2" style={{ background: 'rgba(255,255,255,0.025)' }}>
                      <div className="text-[8px] font-mono tracking-[0.16em] text-slate-500">DATA</div>
                      <div className="mt-1 text-[10px] font-semibold text-sky-400">
                        {backendHealth.checks.waterArtifacts?.regionCount ?? 0} regions
                      </div>
                    </div>
                    <div className="rounded-xl px-2 py-2" style={{ background: 'rgba(255,255,255,0.025)' }}>
                      <div className="text-[8px] font-mono tracking-[0.16em] text-slate-500">CACHE</div>
                      <div className="mt-1 text-[10px] font-semibold" style={{ color: backendHealth.dependencies.redis ? '#4ade80' : '#f87171' }}>
                        {backendHealth.dependencies.redis ? 'online' : 'offline'}
                      </div>
                    </div>
                  </div>
                )}
                {backendError && !backendHealth && (
                  <div className="mb-2 rounded-xl px-2 py-2 text-[9px] font-mono text-amber-300" style={{ background: 'rgba(251,191,36,0.08)' }}>
                    Render health is unavailable. This panel only reports deployed backend providers and does not fall back to local provider claims.
                  </div>
                )}
                {liveProviders.length > 0 ? (
                  <div className="space-y-2">
                    {liveProviders.map((provider) => {
                    const Icon = provider.type === 'water' ? Waves : Zap
                    const statusColor =
                      provider.status === 'healthy' ? '#4ade80' : provider.status === 'degraded' ? '#fbbf24' : '#f87171'

                    return (
                      <div key={provider.name} className="flex items-center justify-between rounded-xl px-2 py-2" style={{ background: 'rgba(255,255,255,0.025)' }}>
                        <div className="flex min-w-0 items-center gap-2">
                          <Icon size={12} color={statusColor} />
                          <div className="min-w-0">
                            <div className="truncate text-[10px] font-medium text-slate-200">{provider.name}</div>
                            <div className="text-[8px] font-mono tracking-[0.14em] text-slate-500">{provider.authority}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[8px] font-mono uppercase tracking-[0.16em]" style={{ color: statusColor }}>
                            {provider.status}
                          </div>
                          <div className="text-[8px] font-mono text-slate-500">{provider.freshness}s</div>
                        </div>
                      </div>
                    )
                    })}
                  </div>
                ) : (
                  <div className="rounded-xl px-2 py-3 text-[9px] font-mono text-slate-500" style={{ background: 'rgba(255,255,255,0.025)' }}>
                    No deployed provider inventory is available from this runtime beyond the Render health response.
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </aside>
  )
}
