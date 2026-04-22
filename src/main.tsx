import { Component, StrictMode, type ErrorInfo, type ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'

const rootElement = document.getElementById('root')

if (!rootElement) {
  throw new Error('CO2 Grid root mount element "#root" was not found')
}

function ConsoleFallback() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'radial-gradient(circle at top, rgba(56,189,248,0.08), transparent 30%), #060d18',
        color: '#e2e8f0',
        padding: '32px',
      }}
    >
      <div
        style={{
          maxWidth: '640px',
          width: '100%',
          border: '1px solid rgba(56,189,248,0.14)',
          borderRadius: '24px',
          background: 'rgba(6,13,24,0.92)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.35)',
          padding: '28px',
        }}
      >
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', letterSpacing: '0.24em', color: '#38bdf8' }}>
          CO2 GRID
        </div>
        <h1 style={{ marginTop: '14px', fontSize: '32px', lineHeight: 1.05, marginBottom: '12px' }}>
          Live console is hydrating.
        </h1>
        <p style={{ margin: 0, color: '#94a3b8', fontSize: '15px', lineHeight: 1.7 }}>
          The browser shell is up, but the control plane surface is still loading or recovering. Refresh once, then check
          broker health and backend access if this message persists.
        </p>
        <div
          style={{
            marginTop: '22px',
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: '11px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span style={{ padding: '8px 10px', borderRadius: '999px', background: 'rgba(56,189,248,0.1)', color: '#38bdf8' }}>
            console.co2router.com
          </span>
          <span style={{ padding: '8px 10px', borderRadius: '999px', background: 'rgba(45,212,191,0.1)', color: '#2dd4bf' }}>
            CO2 Grid
          </span>
        </div>
      </div>
    </div>
  )
}

class AppErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  state = { hasError: false }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('CO2 Grid render failure:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return <ConsoleFallback />
    }
    return this.props.children
  }
}

createRoot(rootElement).render(
  <StrictMode>
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  </StrictMode>
)
