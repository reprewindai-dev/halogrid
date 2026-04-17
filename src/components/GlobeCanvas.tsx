import { useRef, useEffect, useState } from 'react'
import type { Region } from '../types'
import { stateColor } from '../lib/utils'

interface Props { regions: Region[]; onRegionClick: (r: Region) => void }

function project(lat: number, lng: number, cx: number, cy: number, rx: number, ry: number) {
  const x = cx + (lng / 180) * rx
  const y = cy - (lat / 90)  * ry
  return { x, y }
}

export default function GlobeCanvas({ regions, onRegionClick }: Props) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const [hover, setHover] = useState<string | null>(null)
  const animRef = useRef<number>()
  const frameRef = useRef(0)

  useEffect(() => {
    const c = canvas.current; if (!c) return
    const ctx = c.getContext('2d')!
    let dpr = window.devicePixelRatio || 1

    const resize = () => {
      const w = c.parentElement!.clientWidth
      const h = c.parentElement!.clientHeight
      c.width  = w * dpr; c.height = h * dpr
      c.style.width  = w + 'px'; c.style.height = h + 'px'
      ctx.scale(dpr, dpr)
    }
    resize()
    const ro = new ResizeObserver(resize); ro.observe(c.parentElement!)

    const draw = () => {
      frameRef.current++
      const w = c.width / dpr; const h = c.height / dpr
      ctx.clearRect(0, 0, w, h)

      const cx = w / 2; const cy = h / 2
      const rx = w * 0.44; const ry = h * 0.42

      // Grid lines
      ctx.strokeStyle = 'rgba(56,189,248,0.06)'; ctx.lineWidth = 0.5
      for (let lng = -180; lng <= 180; lng += 30) {
        const { x: x1 } = project(-90, lng, cx, cy, rx, ry)
        const { x: x2 } = project( 90, lng, cx, cy, rx, ry)
        ctx.beginPath(); ctx.moveTo(x1, cy + ry); ctx.lineTo(x2, cy - ry); ctx.stroke()
      }
      for (let lat = -75; lat <= 75; lat += 30) {
        const { x: x1, y } = project(lat, -180, cx, cy, rx, ry)
        ctx.beginPath(); ctx.moveTo(x1, y); ctx.lineTo(cx + rx, y); ctx.stroke()
      }

      // Equator & meridian
      ctx.strokeStyle = 'rgba(56,189,248,0.12)'; ctx.lineWidth = 0.8
      ctx.beginPath(); ctx.moveTo(cx - rx, cy); ctx.lineTo(cx + rx, cy); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(cx, cy - ry); ctx.lineTo(cx, cy + ry); ctx.stroke()

      // Region nodes
      regions.forEach(r => {
        const { x, y } = project(r.lat, r.lng, cx, cy, rx, ry)
        const color = stateColor(r.state)
        const isHovered = hover === r.id
        const pulse = Math.sin(frameRef.current * 0.05 + r.lat) * 0.5 + 0.5
        const radius = isHovered ? 9 : 6

        // Pulse ring
        if (r.state !== 'green') {
          ctx.beginPath()
          ctx.arc(x, y, radius + 4 + pulse * 5, 0, Math.PI * 2)
          ctx.strokeStyle = color + '22'; ctx.lineWidth = 1.5; ctx.stroke()
        }

        // Outer glow
        const grd = ctx.createRadialGradient(x, y, 0, x, y, radius + 10)
        grd.addColorStop(0, color + '55'); grd.addColorStop(1, 'transparent')
        ctx.fillStyle = grd; ctx.beginPath(); ctx.arc(x, y, radius + 10, 0, Math.PI * 2); ctx.fill()

        // Core dot
        ctx.beginPath(); ctx.arc(x, y, radius, 0, Math.PI * 2)
        ctx.fillStyle = color + 'cc'; ctx.fill()
        ctx.strokeStyle = color; ctx.lineWidth = isHovered ? 2 : 1; ctx.stroke()

        // Label
        if (isHovered) {
          ctx.font = '600 11px JetBrains Mono, monospace'
          ctx.fillStyle = '#e2e8f0'; ctx.textAlign = 'left'
          ctx.fillText(r.code, x + 12, y + 4)
          ctx.font = '400 9px JetBrains Mono, monospace'
          ctx.fillStyle = color; ctx.fillText(r.carbon + ' g', x + 12, y + 14)
        } else {
          ctx.font = '500 9px JetBrains Mono, monospace'
          ctx.fillStyle = color + 'cc'; ctx.textAlign = 'center'
          ctx.fillText(r.code, x, y - 10)
        }
      })

      // Arc connections from red/yellow to nearest green
      regions.filter(r => r.lastDecision === 'SHIFT_REGION').forEach(r => {
        const target = regions.find(t => t.state === 'green' && t.id !== r.id)
        if (!target) return
        const s = project(r.lat, r.lng, cx, cy, rx, ry)
        const e = project(target.lat, target.lng, cx, cy, rx, ry)
        const mx = (s.x + e.x) / 2; const my = (s.y + e.y) / 2 - 30
        const alpha = 0.35 + Math.sin(frameRef.current * 0.08) * 0.15
        ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.quadraticCurveTo(mx, my, e.x, e.y)
        ctx.strokeStyle = `rgba(56,189,248,${alpha})`; ctx.lineWidth = 1; ctx.setLineDash([4,6])
        ctx.stroke(); ctx.setLineDash([])
      })

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { cancelAnimationFrame(animRef.current!); ro.disconnect() }
  }, [regions, hover])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvas.current; if (!c) return
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    const mx = (e.clientX - rect.left)
    const my = (e.clientY - rect.top)
    const w = c.width / dpr; const h = c.height / dpr
    const cx = w / 2; const cy = h / 2; const rx = w * 0.44; const ry = h * 0.42
    regions.forEach(r => {
      const { x, y } = project(r.lat, r.lng, cx, cy, rx, ry)
      if (Math.hypot(mx - x, my - y) < 14) onRegionClick(r)
    })
  }

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const c = canvas.current; if (!c) return
    const dpr = window.devicePixelRatio || 1
    const rect = c.getBoundingClientRect()
    const mx = e.clientX - rect.left; const my = e.clientY - rect.top
    const w = c.width / dpr; const h = c.height / dpr
    const cx = w / 2; const cy = h / 2; const rx = w * 0.44; const ry = h * 0.42
    let found: string | null = null
    regions.forEach(r => {
      const { x, y } = project(r.lat, r.lng, cx, cy, rx, ry)
      if (Math.hypot(mx - x, my - y) < 14) found = r.id
    })
    setHover(found)
    c.style.cursor = found ? 'pointer' : 'default'
  }

  return (
    <canvas ref={canvas} onClick={handleClick} onMouseMove={handleMove}
      style={{ width:'100%', height:'100%', display:'block' }}/>
  )
}
