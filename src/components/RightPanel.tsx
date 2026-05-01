import { motion } from 'framer-motion'
import type { Decision, TraceFrame, Tier } from '../types'
import DecisionCard from './DecisionCard'
import { formatTime, formatHash, actionColor, actionLabel } from '../lib/utils'

export default function RightPanel({ decisions, traces, tier }: { decisions:Decision[]; traces:TraceFrame[]; tier:Tier }) {
  return (
    <div className="panel-glass h-full flex flex-col overflow-hidden" style={{ width:308, borderLeft:'1px solid rgba(56,189,248,0.08)' }}>
      <div className="flex-1 flex flex-col min-h-0">
        <div className="px-4 pt-3 pb-2 flex-shrink-0" style={{ borderBottom:'1px solid rgba(56,189,248,0.06)' }}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono tracking-widest" style={{color:'#64748b'}}>DECISION STREAM</span>
            <span className="text-[9px] font-mono" style={{color:'rgba(56,189,248,0.5)'}}>{decisions.length} frames</span>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-2">
          {decisions.slice(0,20).map((d,i) => <DecisionCard key={d.id} decision={d} tier={tier} index={i}/>)}
          {decisions.length===0 && (
            <div className="flex flex-col items-center justify-center h-40 gap-2">
              <div className="w-6 h-6 rounded-full animate-spin" style={{border:'2px solid rgba(56,189,248,0.2)',borderTopColor:'rgba(56,189,248,0.8)'}}/>
              <span className="text-[10px] font-mono" style={{color:'rgba(100,116,139,0.5)'}}>Waiting for decisions...</span>
            </div>
          )}
        </div>
      </div>
      {tier==='elite' && (
        <div className="flex-shrink-0" style={{ borderTop:'1px solid rgba(56,189,248,0.06)' }}>
          <div className="px-4 pt-2 pb-1">
            <span className="text-[9px] font-mono tracking-widest" style={{color:'#64748b'}}>TRACE RAIL</span>
          </div>
          <div className="px-3 pb-3 space-y-0.5 overflow-y-auto scrollbar-thin" style={{maxHeight:144}}>
            {traces.slice(0,14).map(t => (
              <motion.div key={t.id} initial={{opacity:0,x:8}} animate={{opacity:1,x:0}} transition={{duration:.22}}
                className="flex items-center gap-2 py-1 px-2 rounded-lg" style={{ background:'rgba(255,255,255,0.015)' }}>
                <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:actionColor(t.action) }}/>
                <span className="text-[9px] font-mono flex-1 truncate" style={{color:'rgba(226,232,240,0.65)'}}>{t.regionName}</span>
                <span className="text-[8px] font-mono px-1 rounded" style={{ background:`${actionColor(t.action)}18`, color:actionColor(t.action) }}>{actionLabel(t.action)}</span>
                <span className="text-[8px] font-mono flex-shrink-0" style={{color:'rgba(100,116,139,0.35)'}}>{formatTime(t.timestamp)}</span>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
