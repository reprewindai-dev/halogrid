import { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import type { Region, Tier } from '../types'
import { stateColor, actionColor, actionLabel } from '../lib/utils'
import { SIGNAL_PROVIDERS } from '../lib/simulation'

interface Props { regions:Region[]; tier:Tier; onRegionClick:(r:Region)=>void; collapsed:boolean; onToggle:()=>void }

export default function LeftPanel({ regions, tier, onRegionClick, collapsed, onToggle }: Props) {
  const [tab, setTab] = useState<'regions'|'signals'>('regions')
  const sc = (s:string) => s==='healthy'?'#4ade80':s==='degraded'?'#fbbf24':'#f87171'
  return (
    <div className="relative flex h-full">
      <AnimatePresence>
        {!collapsed && (
          <motion.div initial={{width:0,opacity:0}} animate={{width:272,opacity:1}} exit={{width:0,opacity:0}}
            transition={{type:'spring',damping:30,stiffness:280}}
            className="panel-glass h-full flex flex-col overflow-hidden" style={{borderRight:'1px solid rgba(56,189,248,0.08)'}}>
            <div className="px-4 pt-4 pb-2 flex-shrink-0">
              <div className="text-[9px] font-mono tracking-widest mb-3" style={{color:'#64748b'}}>CONTROL PLANE</div>
              {tier !== 'freeview' && (
                <div className="flex gap-1 mb-2 rounded-xl p-1" style={{background:'rgba(255,255,255,0.03)'}}>
                  {(['regions','signals'] as const).map(t => (
                    <button key={t} onClick={() => setTab(t)}
                      className="flex-1 py-1.5 rounded-lg text-[10px] font-mono tracking-widest uppercase transition-all"
                      style={{ background:tab===t?'rgba(56,189,248,0.12)':'transparent', color:tab===t?'#38bdf8':'#64748b' }}>{t}</button>
                  ))}
                </div>
              )}
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-thin px-3 pb-4">
              {(tab==='regions'||tier==='freeview') && (
                <div className="space-y-1">
                  {regions.map(r => (
                    <button key={r.id} onClick={() => onRegionClick(r)}
                      className="w-full text-left rounded-xl px-3 py-2.5 transition-all duration-200"
                      style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.04)' }}
                      onMouseEnter={e => { e.currentTarget.style.background='rgba(56,189,248,0.06)'; e.currentTarget.style.borderColor='rgba(56,189,248,0.14)' }}
                      onMouseLeave={e => { e.currentTarget.style.background='rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor='rgba(255,255,255,0.04)' }}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:stateColor(r.state), boxShadow:`0 0 5px ${stateColor(r.state)}` }}/>
                          <span className="text-xs font-medium truncate" style={{maxWidth:130}}>{r.name}</span>
                        </div>
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                          style={{ background:`${actionColor(r.lastDecision)}15`, color:actionColor(r.lastDecision) }}>
                          {actionLabel(r.lastDecision)}
                        </span>
                      </div>
                      <div className="metric-bar">
                        <div className="metric-bar-fill" style={{ width:`${Math.min(100,(r.carbon/620)*100)}%`, background:stateColor(r.state) }}/>
                      </div>
                      <div className="flex justify-between mt-1">
                        <span className="text-[9px] font-mono" style={{color:'#64748b'}}>{r.carbon} gCO2/kWh</span>
                        <span className="text-[9px] font-mono" style={{color:'#64748b'}}>{r.load}%</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {tab==='signals' && tier!=='freeview' && (
                <div className="space-y-3">
                  {(['carbon','water'] as const).map(type => (
                    <div key={type}>
                      <div className="text-[9px] font-mono tracking-widest mb-2 uppercase" style={{color:'#64748b'}}>{type} providers</div>
                      {SIGNAL_PROVIDERS.filter(p => p.type===type).map(p => (
                        <div key={p.name} className="rounded-xl px-3 py-2.5 mb-1.5"
                          style={{ background:'rgba(255,255,255,0.02)', border:'1px solid rgba(255,255,255,0.05)' }}>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background:sc(p.status), boxShadow:`0 0 6px ${sc(p.status)}` }}/>
                              <span className="text-xs font-semibold">{p.name}</span>
                            </div>
                            <span className="text-[9px] font-mono capitalize" style={{color:'#64748b'}}>{p.mode}</span>
                          </div>
                          <p className="text-[10px] leading-relaxed" style={{color:'rgba(100,116,139,0.7)'}}>{p.authority}</p>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <button onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 w-6 h-12 rounded-r-lg flex items-center justify-center transition-all"
        style={{ background:'rgba(10,22,40,0.92)', border:'1px solid rgba(56,189,248,0.14)', borderLeft:'none' }}>
        {collapsed ? <ChevronRight size={12} color="#64748b"/> : <ChevronLeft size={12} color="#64748b"/>}
      </button>
    </div>
  )
}
