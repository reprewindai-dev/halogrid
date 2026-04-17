import { useState, useEffect } from 'react'
import type { Region, Tier } from './types'
import { useSimulation } from './hooks/useSimulation'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import GlobeCanvas from './components/GlobeCanvas'
import RightPanel from './components/RightPanel'
import RegionDetail from './components/RegionDetail'
import StatusBar from './components/StatusBar'
import './styles/globals.css'

export default function App() {
  const [tier, setTier] = useState<Tier>('core')
  const { regions, decisions, traces, metrics, paused, toggle, reset } = useSimulation(tier)
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [time, setTime] = useState(Date.now())

  useEffect(() => { const t = setInterval(() => setTime(Date.now()), 1000); return () => clearInterval(t) }, [])

  const handleRegionClick = (r: Region) => setSelectedRegion(s => s?.id === r.id ? null : r)

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background:'#060d18' }}>
      <TopBar metrics={metrics} tier={tier} paused={paused} onToggle={toggle} onReset={reset} onTierChange={setTier} time={time}/>

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
