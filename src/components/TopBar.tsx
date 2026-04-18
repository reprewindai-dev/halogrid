import { Pause, Play, RotateCcw, Shield, Zap, Globe, BookOpenText } from 'lucide-react'
import type { SystemMetrics, Tier, ViewMode } from '../types'
import { formatTime } from '../lib/utils'

interface Props {
  metrics: SystemMetrics
  tier: Tier
  paused: boolean
  onToggle: () => void
  onReset: () => void
  onTierChange: (t: Tier) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  time: number
}

const TIER_CFG: { id: Tier; label: string; icon: typeof Shield }[] = [
  { id: 'freeview', label: 'Freeview', icon: Globe  },
  { id: 'core',     label: 'Core',     icon: Zap    },
  { id: 'elite',    label: 'Elite',    icon: Shield },
]

export default function TopBar({ metrics, tier, paused, onToggle, onReset, onTierChange, viewMode, onViewModeChange, time }: Props) {
  return (
    <header className="flex-shrink-0 flex items-center justify-between px-5 py-2.5"
      style={{ borderBottom:'1px solid rgba(56,189,248,0.07)', background:'rgba(6,13,24,0.92)', backdropFilter:'blur(24px)' }}>

      {/* Logo */}
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 32 32" width="28" height="28" fill="none" aria-label="HaloGrid">
          <circle cx="16" cy="16" r="14" stroke="#38bdf8" strokeWidth="1.5" opacity="0.35"/>
          <circle cx="16" cy="16" r="9"  stroke="#2dd4bf" strokeWidth="1.5" opacity="0.55"/>
          <circle cx="16" cy="16" r="4"  fill="#38bdf8"/>
          <line x1="16" y1="2"  x2="16" y2="7"  stroke="#38bdf8" strokeWidth="1.5" opacity="0.6"/>
          <line x1="16" y1="25" x2="16" y2="30" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6"/>
          <line x1="2"  y1="16" x2="7"  y2="16" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6"/>
          <line x1="25" y1="16" x2="30" y2="16" stroke="#38bdf8" strokeWidth="1.5" opacity="0.6"/>
        </svg>
        <div>
          <div className="text-sm font-bold tracking-wide" style={{color:'#e2e8f0', letterSpacing:'0.06em'}}>HALOGRID</div>
          <div className="text-[9px] font-mono tracking-widest" style={{color:'rgba(56,189,248,0.5)'}}>CO₂ ROUTER CONTROL PLANE</div>
        </div>
      </div>

      {/* KPIs */}
      <div className="hidden md:flex items-center gap-6">
        {[
          { label:'SAVED',    value:`${metrics.totalSavings} kg`, color:'#4ade80' },
          { label:'DECISIONS',value:`${metrics.decisionsToday}`,  color:'#38bdf8' },
          { label:'AVG CO₂',  value:`${metrics.avgCarbon} g`,     color:'#fbbf24' },
          { label:'UPTIME',   value:`${metrics.uptimePct}%`,      color:'#4ade80' },
          { label:'ALERTS',   value:`${metrics.alertCount}`,      color: metrics.alertCount > 0 ? '#f87171' : '#4ade80' },
        ].map(k => (
          <div key={k.label} className="text-center">
            <div className="text-[9px] font-mono text-muted tracking-widest">{k.label}</div>
            <div className="text-sm font-bold font-mono tabular-nums" style={{color:k.color}}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <div className="flex gap-0.5 bg-white/[0.03] rounded-xl p-0.5 mr-2">
          {[
            { id: 'control' as const, label: 'Control', icon: Globe },
            { id: 'blog' as const, label: 'Blog', icon: BookOpenText },
          ].map(({ id, label }) => (
            <button key={id} onClick={() => onViewModeChange(id)}
              className="px-3 py-1 rounded-[10px] text-[9px] font-mono tracking-widest uppercase transition-all"
              style={{ background:viewMode===id?'rgba(45,212,191,0.16)':'transparent', color:viewMode===id?'#2dd4bf':'#64748b',
                       boxShadow: viewMode===id?'0 0 8px rgba(45,212,191,0.2)':undefined }}>
              {label}
            </button>
          ))}
        </div>

        {/* Tier pills */}
        <div className="flex gap-0.5 bg-white/[0.03] rounded-xl p-0.5 mr-2" style={{ opacity: viewMode === 'blog' ? 0.45 : 1 }}>
          {TIER_CFG.map(({ id, label }) => (
            <button key={id} onClick={() => onTierChange(id)} disabled={viewMode === 'blog'}
              className="px-3 py-1 rounded-[10px] text-[9px] font-mono tracking-widest uppercase transition-all"
              style={{ background:tier===id?'rgba(56,189,248,0.15)':'transparent', color:tier===id?'#38bdf8':'#64748b',
                       boxShadow: tier===id?'0 0 8px rgba(56,189,248,0.2)':undefined }}>
              {label}
            </button>
          ))}
        </div>

        <button onClick={onToggle} disabled={viewMode === 'blog'}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', opacity: viewMode === 'blog' ? 0.45 : 1 }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(56,189,248,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
          {paused ? <Play size={13} color="#38bdf8"/> : <Pause size={13} color="#64748b"/>}
        </button>
        <button onClick={onReset} disabled={viewMode === 'blog'}
          className="w-8 h-8 rounded-xl flex items-center justify-center transition-all"
          style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', opacity: viewMode === 'blog' ? 0.45 : 1 }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(248,113,113,0.1)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,0.04)'}>
          <RotateCcw size={13} color="#64748b"/>
        </button>

        <div className="text-[10px] font-mono text-muted ml-2 tabular-nums">{formatTime(time)}</div>
      </div>
    </header>
  )
}
