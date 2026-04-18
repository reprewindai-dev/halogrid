import { motion, AnimatePresence } from 'framer-motion'
import { X, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import type { Region } from '../types'
import { stateColor, actionColor, actionLabel } from '../lib/utils'

interface Props {
  region: Region | null
  onClose: () => void
}

export default function RegionDetail({ region: r, onClose }: Props) {
  return (
    <AnimatePresence>
      {r && (
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 8 }}
          transition={{ type: 'spring', damping: 28, stiffness: 260 }}
          className="absolute bottom-5 left-1/2 -translate-x-1/2 z-30 w-80 rounded-2xl overflow-hidden"
          style={{
            background: 'rgba(6,13,24,0.96)',
            border: `1px solid ${stateColor(r.state)}25`,
            boxShadow: `0 24px 64px rgba(0,0,0,0.6), 0 0 0 1px ${stateColor(r.state)}10`,
          }}
        >
          <div
            className="px-4 py-3 flex items-start justify-between"
            style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: `${stateColor(r.state)}06` }}
          >
            <div>
              <div className="flex items-center gap-2 mb-0.5">
                <span className="w-2 h-2 rounded-full" style={{ background: stateColor(r.state), boxShadow: `0 0 8px ${stateColor(r.state)}` }} />
                <span className="text-xs font-bold">{r.name}</span>
              </div>
              <div className="text-[9px] font-mono text-muted ml-4">{r.provider} / {r.code}</div>
            </div>
            <button
              onClick={onClose}
              className="w-6 h-6 rounded-lg flex items-center justify-center transition-all"
              style={{ background: 'rgba(255,255,255,0.05)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(248,113,113,0.12)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
            >
              <X size={11} color="#64748b" />
            </button>
          </div>
          <div className="px-4 py-3 grid grid-cols-2 gap-3">
            {[
              { label: 'CARBON', value: `${r.carbon} gCO2/kWh`, color: stateColor(r.state) },
              { label: 'RENEWABLE', value: `${r.renewable}%`, color: '#4ade80' },
              { label: 'LOAD', value: `${r.load}%`, color: '#fbbf24' },
              { label: 'WATER STRESS', value: `${(r.waterStress * 100).toFixed(0)}%`, color: '#38bdf8' },
            ].map((m) => (
              <div key={m.label} className="rounded-xl px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)' }}>
                <div className="text-[8px] font-mono text-muted tracking-widest mb-0.5">{m.label}</div>
                <div className="text-sm font-bold font-mono tabular-nums" style={{ color: m.color }}>
                  {m.value}
                </div>
              </div>
            ))}
          </div>
          <div className="px-4 pb-3">
            <div
              className="rounded-xl px-3 py-2.5 flex items-center justify-between"
              style={{ background: `${actionColor(r.lastDecision)}10`, border: `1px solid ${actionColor(r.lastDecision)}20` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono tracking-widest" style={{ color: actionColor(r.lastDecision) }}>
                  LAST ACTION
                </span>
                <span
                  className="text-[9px] font-mono px-1.5 py-0.5 rounded-full font-bold"
                  style={{ background: `${actionColor(r.lastDecision)}20`, color: actionColor(r.lastDecision) }}
                >
                  {actionLabel(r.lastDecision)}
                </span>
              </div>
              <div className="flex items-center gap-1 text-muted/50">
                {r.trend === 'up' ? <TrendingUp size={11} color="#f87171" /> : r.trend === 'down' ? <TrendingDown size={11} color="#4ade80" /> : <Minus size={11} color="#64748b" />}
                <span className="text-[9px] font-mono">{r.trend}</span>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
