import { useEffect, useRef } from 'react'
import type { Wallpaper as WallpaperId } from './settings'

// Desktop backgrounds. "Pluie" is a light canvas animation of falling rain streaks.

function Rain() {
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cv = canvas.current!
    const g = cv.getContext('2d')!
    let w = 0, h = 0, raf = 0
    const drops = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random(), l: 0.02 + Math.random() * 0.04, v: 0.006 + Math.random() * 0.01 }))
    const resize = () => {
      w = cv.width = cv.clientWidth
      h = cv.height = cv.clientHeight
    }
    resize()
    window.addEventListener('resize', resize)
    const accent = getComputedStyle(cv).getPropertyValue('--neon').trim() || '#7ee7ff'
    const loop = () => {
      g.clearRect(0, 0, w, h)
      g.strokeStyle = accent
      g.lineWidth = 1
      for (const d of drops) {
        g.globalAlpha = 0.15 + d.v * 20
        g.beginPath()
        g.moveTo(d.x * w, d.y * h)
        g.lineTo(d.x * w - 2, (d.y + d.l) * h)
        g.stroke()
        d.y += d.v
        if (d.y > 1) {
          d.y = -d.l
          d.x = Math.random()
        }
      }
      g.globalAlpha = 1
      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])
  return <canvas ref={canvas} aria-hidden="true" className="absolute inset-0 size-full" />
}

export default function Wallpaper({ id }: { id: WallpaperId }) {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
      {id === 'synthwave' && (
        <>
          <span className="absolute inset-0 bg-[linear-gradient(to_bottom,#0a0614_0%,#1b0b2e_55%,#07070c_100%)]" />
          <span className="absolute top-[18%] left-1/2 size-[min(46vw,380px)] -translate-x-1/2 rounded-full bg-[linear-gradient(to_bottom,var(--neon),var(--accent))] opacity-80 [mask-image:repeating-linear-gradient(to_bottom,black_0_14px,transparent_14px_20px)]" />
          <div className="wallpaper-grid absolute inset-x-[-20%] bottom-0 h-[55%] opacity-90" />
        </>
      )}
      {id === 'nuit' && (
        <>
          <div className="wallpaper-grid absolute inset-x-[-20%] bottom-0 h-[60%]" />
          <span className="absolute right-[6vw] bottom-[12vh] font-display text-[min(40vw,420px)] leading-none font-extrabold text-accent/[0.05]">影</span>
        </>
      )}
      {id === 'pluie' && (
        <>
          <span className="absolute inset-0 bg-[linear-gradient(to_bottom,#06080f,#0b1018)]" />
          <Rain />
          <span className="absolute bottom-[10vh] left-1/2 -translate-x-1/2 font-display text-[min(30vw,300px)] leading-none font-extrabold text-neon/[0.06]">雨</span>
        </>
      )}
      {id === 'minimal' && (
        <span className="absolute inset-0 grid place-items-center bg-bg">
          <span className="font-display text-[min(50vw,520px)] leading-none font-extrabold text-fg/[0.03]">影</span>
        </span>
      )}
    </div>
  )
}
