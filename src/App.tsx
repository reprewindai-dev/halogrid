import { useState, useEffect } from 'react'
import type { Region, Tier } from './types'
import { useSimulation } from './hooks/useSimulation'
import { useLiveEngine } from './hooks/useLiveEngine'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import GlobeCanvas from './components/GlobeCanvas'
import RightPanel from './components/RightPanel'
import RegionDetail from './components/RegionDetail'
import StatusBar from './components/StatusBar'
import './styles/globals.css'

export default function App() {
  const [tier, setTier] = useState<Tier>('freeview')
  const sim = useSimulation(tier)
  const live = useLiveEngine()
  const isLive = live.backendStatus === 'online'

  const regions   = isLive ? live.regions   : sim.regions
  const decisions = isLive ? live.decisions : sim.decisions
  const metrics   = isLive ? live.metrics   : sim.metrics
  const traces    = sim.traces

  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [time, setTime] = useState(Date.now())

  useEffect(() => { const t = setInterval(() => setTime(Date.now()), 1000); return () => clearInterval(t) }, [])

  const handleRegionClick = (r: Region) => setSelectedRegion(s => s?.id === r.id ? null : r)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background:'#060d18' }}>
      {/* Backend status badge */}
      <div className="flex-shrink-0 flex items-center justify-end px-5 py-1" style={{ background:'rgba(6,13,24,0.95)' }}>
        <span className="text-[9px] font-mono tracking-widest uppercase flex items-center gap-1.5"
          style={{ color: isLive ? '#4ade80' : live.backendStatus === 'connecting' ? '#fbbf24' : '#64748b' }}>
          <span className="w-1.5 h-1.5 rounded-full inline-block" style={{ background: isLive ? '#4ade80' : live.backendStatus === 'connecting' ? '#fbbf24' : '#475569' }}/>
          {isLive ? 'BACKEND: ONLINE' : live.backendStatus === 'connecting' ? 'CONNECTING...' : 'SIMULATION MODE'}
        </span>
      </div>
      <TopBar metrics={metrics} tier={tier} paused={sim.paused} onToggle={sim.toggle} onReset={sim.reset} onTierChange={setTier} time={time}/>

      <div className="flex flex-1 overflow-hidden relative">
        {/* Left panel */}
        <LeftPanel regions={regions} tier={tier} onRegionClick={handleRegionClick}
          collapsed={leftCollapsed} onToggle={() => setLeftCollapsed(p => !p)}/>

        {/* Center globe */}
        <div className="flex-1 relative overflow-hidden">
          {/* Radial background glow */}
          <div className="absolute inset-0 pointer-events-none" style={{
            background:'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(56,189,248,0.035) 0%, transparent 70%)'
          }}/>
          <GlobeCanvas regions={regions} onRegionClick={handleRegionClick}/>
          <RegionDetail region={selectedRegion} onClose={() => setSelectedRegion(null)}/>

          {/* Center watermark */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
            <div className="text-[9px] font-mono tracking-[0.25em] text-center" style={{color:'rgba(56,189,248,0.2)'}}>
              FLAT PROJECTION · EQUIRECTANGULAR
            </div>
          </div>
        </div>

        {/* Right panel */}
        <RightPanel decisions={decisions} traces={traces} tier={tier}/>
      </div>

      <StatusBar metrics={metrics} tier={tier} paused={paused}/>
    </div>
  )
}
