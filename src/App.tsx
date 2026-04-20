import { useState, useEffect } from 'react'
import type { Tier, ViewMode } from './types'
import { useLiveControlPlane } from './hooks/useLiveControlPlane'
import BlogHub from './components/BlogHub'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import GlobeCanvas from './components/GlobeCanvas'
import RightPanel from './components/RightPanel'
import RegionDetail from './components/RegionDetail'
import StatusBar from './components/StatusBar'
import './styles/globals.css'

export default function App() {
  const [viewMode, setViewMode] = useState<ViewMode>('control')
  const [tier, setTier] = useState<Tier>('core')
  const { regions, decisions, traces, metrics, paused, toggle, reset, backendHealth, backendError } = useLiveControlPlane()
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null)
  const [leftCollapsed, setLeftCollapsed] = useState(false)
  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    const timer = setInterval(() => setTime(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [])

  const selectedRegion = selectedRegionId ? regions.find((region) => region.id === selectedRegionId) ?? null : null

  const handleRegionClick = (regionId: string) => {
    setSelectedRegionId((selected) => (selected === regionId ? null : regionId))
  }

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: '#060d18' }}>
      <TopBar
        metrics={metrics}
        tier={tier}
        paused={paused}
        onToggle={toggle}
        onReset={reset}
        onTierChange={setTier}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        time={time}
      />

      {viewMode === 'blog' ? (
        <div className="flex-1 overflow-hidden">
          <BlogHub />
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden relative">
          <LeftPanel
            regions={regions}
            tier={tier}
            onRegionClick={(region) => handleRegionClick(region.id)}
            backendHealth={backendHealth}
            backendError={backendError}
            collapsed={leftCollapsed}
            onToggle={() => setLeftCollapsed((previous) => !previous)}
          />

          <div className="flex-1 relative overflow-hidden">
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(56,189,248,0.035) 0%, transparent 70%)',
              }}
            />
            <GlobeCanvas regions={regions} onRegionClick={(region) => handleRegionClick(region.id)} />
            <RegionDetail region={selectedRegion} onClose={() => setSelectedRegionId(null)} />

            <div className="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none">
              <div className="text-[9px] font-mono tracking-[0.25em] text-center" style={{ color: 'rgba(56,189,248,0.2)' }}>
                FLAT PROJECTION - EQUIRECTANGULAR
              </div>
            </div>
          </div>

          <RightPanel
            regions={regions}
            selectedRegion={selectedRegion}
            decisions={decisions}
            traces={traces}
            metrics={metrics}
            tier={tier}
            backendHealth={backendHealth}
            backendError={backendError}
          />
        </div>
      )}

      <StatusBar metrics={metrics} tier={tier} paused={paused} backendHealth={backendHealth} />
    </div>
  )
}
