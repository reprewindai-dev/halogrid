import type { BackendHealth, SystemMetrics, Tier } from '../types'

export default function StatusBar({
  metrics,
  tier,
  paused,
  backendHealth,
}: {
  metrics: SystemMetrics
  tier: Tier
  paused: boolean
  backendHealth: BackendHealth | null
}) {
  return (
    <div
      className="flex-shrink-0 flex items-center justify-between px-4 py-1.5"
      style={{ borderTop: '1px solid rgba(56,189,248,0.06)', background: 'rgba(6,13,24,0.92)', fontSize: 9 }}
    >
      <div className="flex items-center gap-4 font-mono text-muted">
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full"
            style={{
              background: paused ? '#fbbf24' : '#4ade80',
              boxShadow: paused ? '0 0 5px #fbbf24' : '0 0 5px #4ade80',
            }}
          />
          {paused ? 'LIVE POLL PAUSED' : 'LIVE POLL ACTIVE'}
        </span>
        <span className="tracking-widest">TIER: {tier.toUpperCase()}</span>
        <span className="tracking-widest">REGIONS: {metrics.activeRegions}/{10}</span>
        <span className="tracking-widest">BROKER HEALTH: {backendHealth ? 'ONLINE' : 'DEGRADED'}</span>
      </div>
      <div className="flex items-center gap-4 font-mono text-muted">
        {backendHealth && <span>DB {backendHealth.dependencies.database ? 'UP' : 'DOWN'} / REDIS {backendHealth.dependencies.redis ? 'UP' : 'DOWN'}</span>}
        <span>v0.1.0-alpha</span>
        <span>CO2ROUTER 2026</span>
        <span className="tracking-widest" style={{ color: 'rgba(56,189,248,0.35)' }}>CO2 GRID</span>
      </div>
    </div>
  )
}
