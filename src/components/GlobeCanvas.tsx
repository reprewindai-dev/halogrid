import { useEffect, useRef } from 'react'
import type { ConsoleSurface } from '../types'
import { toneColor } from '../lib/utils'

interface Props {
  surfaces: ConsoleSurface[]
  statusLine: string
}

function drawLabel(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  label: string,
  tone: string,
) {
  ctx.save()
  ctx.font = '500 11px JetBrains Mono, monospace'
  ctx.fillStyle = '#e2e8f0'
  ctx.textAlign = 'center'
  ctx.fillText(label, x, y)
  ctx.font = '400 9px JetBrains Mono, monospace'
  ctx.fillStyle = tone
  ctx.fillText(label, x, y + 14)
  ctx.restore()
}

export default function GlobeCanvas({ surfaces, statusLine }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const context = canvas.getContext('2d')
    if (!context) return

    const parent = canvas.parentElement
    if (!parent) return

    const resize = () => {
      const width = parent.clientWidth
      const height = parent.clientHeight
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.max(1, Math.floor(width * dpr))
      canvas.height = Math.max(1, Math.floor(height * dpr))
      canvas.style.width = `${width}px`
      canvas.style.height = `${height}px`
      context.setTransform(dpr, 0, 0, dpr, 0, 0)

      const w = width
      const h = height
      context.clearRect(0, 0, w, h)

      const centerX = w / 2
      const centerY = h / 2
      const radiusX = Math.min(w * 0.36, 320)
      const radiusY = Math.min(h * 0.32, 240)

      const gradient = context.createRadialGradient(centerX, centerY, 0, centerX, centerY, Math.max(radiusX, radiusY) * 1.25)
      gradient.addColorStop(0, 'rgba(56, 189, 248, 0.12)')
      gradient.addColorStop(0.55, 'rgba(15, 23, 42, 0.04)')
      gradient.addColorStop(1, 'rgba(15, 23, 42, 0)')
      context.fillStyle = gradient
      context.fillRect(0, 0, w, h)

      context.strokeStyle = 'rgba(148, 163, 184, 0.14)'
      context.lineWidth = 1
      for (let step = -4; step <= 4; step += 1) {
        const y = centerY + (step / 4) * radiusY
        context.beginPath()
        context.ellipse(centerX, y, radiusX, radiusY * (1 - Math.abs(step) * 0.09), 0, 0, Math.PI * 2)
        context.stroke()
      }

      context.strokeStyle = 'rgba(56, 189, 248, 0.16)'
      for (let step = -4; step <= 4; step += 1) {
        const x = centerX + (step / 4) * radiusX
        context.beginPath()
        context.ellipse(x, centerY, radiusX * (1 - Math.abs(step) * 0.08), radiusY, 0, 0, Math.PI * 2)
        context.stroke()
      }

      context.beginPath()
      context.ellipse(centerX, centerY, radiusX, radiusY, 0, 0, Math.PI * 2)
      context.strokeStyle = 'rgba(226, 232, 240, 0.18)'
      context.lineWidth = 1.25
      context.stroke()

      const anchors = surfaces.length > 0 ? surfaces.slice(0, 3) : []
      const positions = [
        { x: centerX - radiusX * 0.42, y: centerY - radiusY * 0.18 },
        { x: centerX + radiusX * 0.38, y: centerY - radiusY * 0.08 },
        { x: centerX - radiusX * 0.04, y: centerY + radiusY * 0.35 },
      ]

      if (anchors.length === 0) {
        context.fillStyle = 'rgba(226, 232, 240, 0.9)'
        context.font = '600 16px Inter, system-ui, sans-serif'
        context.textAlign = 'center'
        context.fillText('Awaiting ecobe-mvp payload', centerX, centerY - 6)
        context.font = '400 10px JetBrains Mono, monospace'
        context.fillStyle = 'rgba(148, 163, 184, 0.85)'
        context.fillText(statusLine, centerX, centerY + 14)
        return
      }

      anchors.forEach((surface, index) => {
        const position = positions[index] ?? positions[positions.length - 1]
        const color = toneColor(surface.status === 'green' ? 'positive' : surface.status === 'yellow' ? 'warning' : 'danger')
        context.beginPath()
        context.arc(position.x, position.y, 7, 0, Math.PI * 2)
        context.fillStyle = `${color}dd`
        context.fill()
        context.strokeStyle = color
        context.lineWidth = 1.5
        context.stroke()

        context.beginPath()
        context.arc(position.x, position.y, 18, 0, Math.PI * 2)
        context.strokeStyle = `${color}22`
        context.lineWidth = 10
        context.stroke()

        drawLabel(context, position.x, position.y - 18, surface.code, color)
      })

      context.fillStyle = 'rgba(226, 232, 240, 0.88)'
      context.font = '600 15px Inter, system-ui, sans-serif'
      context.textAlign = 'center'
      context.fillText('HaloGrid console surface', centerX, centerY - radiusY - 28)
      context.font = '400 10px JetBrains Mono, monospace'
      context.fillStyle = 'rgba(148, 163, 184, 0.95)'
      context.fillText(statusLine, centerX, centerY - radiusY - 12)
    }

    const observer = new ResizeObserver(resize)
    observer.observe(parent)
    resize()

    return () => {
      observer.disconnect()
    }
  }, [surfaces, statusLine])

  return <canvas ref={canvasRef} className="block h-full w-full" />
}
