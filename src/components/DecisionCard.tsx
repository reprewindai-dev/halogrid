import { motion } from 'framer-motion'
import type { Decision, Tier } from '../types'
import { actionColor, actionLabel, formatTime, formatHash } from '../lib/utils'

export default function DecisionCard({ decision: d, tier, index }: { decision:Decision; tier:Tier; index:number }) {
  const color = actionColor(d.action)
  return (
    <motion.div initial={{opacity:0,y:-6}} animate={{opacity:1,y:0}} transition={{duration:0.25,delay:index*0.02}}
      className="rounded-xl px-3 py-2.5 mb-1.5"
      style={{ background:'rgba(255,255,255,0.018)', border:`1px solid ${color}14` }}>
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:color, boxShadow:`0 0 5px ${color}` }}/>
          <span className="text-[10px] font-medium truncate" style={{maxWidth:120}}>{d.regionName}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
            style={{ background:`${color}18`, color }}>{actionLabel(d.action)}</span>
          <span className="text-[9px] font-mono text-muted/40">{formatTime(d.timestamp)}</span>
        </div>
      </div>
      <p className="text-[9px] text-muted/65 leading-relaxed mb-1.5">{d.reason}</p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-mono" style={{color:'#fbbf24'}}>{d.carbon}g</span>
          <span className="text-[9px] font-mono" style={{color:'#4ade80'}}>-{d.savings}kg</span>
          {tier !== 'freeview' && (
            <span className="text-[9px] font-mono" style={{color:'rgba(56,189,248,0.55)'}}>{d.confidence}%</span>
          )}
        </div>
        {tier === 'elite' && (
          <span className="text-[8px] font-mono text-muted/30">{formatHash(d.proofHash,10)}</span>
        )}
      </div>
    </motion.div>
  )
}
