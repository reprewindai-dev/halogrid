import type { SystemMetrics, Tier } from '../types'

export default function StatusBar({ metrics, tier, paused }: { metrics:SystemMetrics; tier:Tier; paused:boolean }) {
  return (
    <div className="flex-shrink-0 flex items-center justify-between px-4 py-1.5"
      style={{ borderTop:'1px solid rgba(56,189,248,0.06)', background:'rgba(6,13,24,0.92)', fontSize:9 }}>
      <div className="flex items-center gap-4 font-mono text-muted">
        <span className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full" style={{ background: paused ? '#fbbf24' : '#4ade80',
            boxShadow: paused ? '0 0 5px #fbbf24' : '0 0 5px #4ade80' }}/>
          {paused ? 'PAUSED' : 'LIVE'}
        </span>
        <span className="tracking-widest">TIER: {tier.toUpperCase()}</span>
        <span className="tracking-widest">REGIONS: {metrics.activeRegions}/{10}</span>
      </div>
      <div className="flex items-center gap-4 font-mono text-muted">
        <span>v0.1.0-alpha</span>
        <span>CO₂ROUTER © 2026</span>
        <span className="tracking-widest" style={{color:'rgba(56,189,248,0.35)'}}>HALOGRID</span>
      </div>
    </div>
  )
}
