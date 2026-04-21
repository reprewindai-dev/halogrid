import { useEffect, useState } from 'react'
import type { ConsoleRuntime } from './types'
import TopBar from './components/TopBar'
import LeftPanel from './components/LeftPanel'
import GlobeCanvas from './components/GlobeCanvas'
import RightPanel from './components/RightPanel'
import StatusBar from './components/StatusBar'
import { loadConsoleRuntime } from './lib/ecobeMvpApi'
import './styles/globals.css'

const initialRuntime: ConsoleRuntime = {
  snapshot: {
    backendLabel: 'ecobe-mvp',
    backendBaseUrl: '/api/ecobe-mvp',
    connectionState: 'connecting',
    statusLine: 'Awaiting ecobe-mvp payload',
    lastSyncedAt: null,
    metrics: [
      { label: 'Backend target', value: 'ecobe-mvp', note: 'Pinned console backend', tone: 'positive' },
      { label: 'Backend isolation', value: 'Blocked', note: 'No bypass route is routed from HaloGrid', tone: 'danger' },
      { label: 'Synthetic telemetry', value: 'Removed', note: 'No fake-live state is rendered', tone: 'danger' },
      { label: 'Console scope', value: 'Frontend only', note: 'This repo is not the root website', tone: 'neutral' },
    ],
    surfaces: [],
    events: [],
    integrations: [
      { name: 'ecobe-mvp', status: 'required', mode: 'console target' },
    ],
    guardrails: [
      'No backend bypass',
      'Simulation surface disabled',
      'No blank shell on load',
      'Backend target pinned to ecobe-mvp',
    ],
  },
  connectionState: 'connecting',
  status: 'IN_PROGRESS',
  error: null,
  loading: true,
  refresh: () => undefined,
}

export default function App() {
  const [runtime, setRuntime] = useState<ConsoleRuntime>(initialRuntime)
  const [time, setTime] = useState(Date.now())

  useEffect(() => {
    let mounted = true

    loadConsoleRuntime().then((result) => {
      if (!mounted) return
      setRuntime((current) => ({
        ...current,
        ...result,
        loading: false,
        refresh: current.refresh,
      }))
    })

    const tick = window.setInterval(() => setTime(Date.now()), 1000)

    return () => {
      mounted = false
      window.clearInterval(tick)
    }
  }, [])

  const refresh = () => {
    setRuntime((current) => ({ ...current, loading: true }))
    void loadConsoleRuntime().then((result) => {
      setRuntime((current) => ({
        ...current,
        ...result,
        loading: false,
        refresh,
      }))
    })
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-slate-950 text-slate-100">
      <TopBar
        snapshot={runtime.snapshot}
        connectionState={runtime.connectionState}
        onRefresh={refresh}
        time={time}
      />

      <main className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <LeftPanel snapshot={runtime.snapshot} />

        <section className="relative min-h-[420px] flex-1 overflow-hidden border-b border-t border-white/10 bg-[radial-gradient(circle_at_center,rgba(56,189,248,0.08),transparent_58%)] lg:border-b-0">
          <div className="absolute inset-0 pointer-events-none opacity-60 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:42px_42px]" />
          <div className="relative flex h-full min-h-[420px] items-center justify-center px-4 py-5">
            <div className="glass-panel h-full w-full max-w-5xl overflow-hidden rounded-[28px] border border-white/10 bg-slate-950/75">
              <div className="flex items-center justify-between border-b border-white/8 px-4 py-3">
                <div>
                  <div className="text-[10px] font-mono tracking-[0.24em] uppercase text-sky-300/70">
                    Console surface
                  </div>
                  <div className="mt-1 text-lg font-semibold text-slate-100">
                    HaloGrid stays pinned to ecobe-mvp
                  </div>
                </div>
                <div className="rounded-full border border-white/10 bg-white/[0.04] px-3 py-1 text-[10px] font-mono tracking-[0.18em] uppercase text-slate-400">
                  {runtime.snapshot.connectionState}
                </div>
              </div>
              <div className="h-[calc(100%-61px)] min-h-[360px]">
                <GlobeCanvas
                  surfaces={runtime.snapshot.surfaces}
                  statusLine={runtime.snapshot.statusLine}
                />
              </div>
            </div>
          </div>
        </section>

        <RightPanel snapshot={runtime.snapshot} />
      </main>

      <StatusBar
        snapshot={runtime.snapshot}
        connectionState={runtime.connectionState}
        status={runtime.status}
      />
    </div>
  )
}
