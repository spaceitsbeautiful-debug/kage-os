import { useEffect, useRef, useState } from 'react'
import { LAYERS, getAnalyser, setMaster, setVolume, stopAll, type LayerId } from './engine'

// Compose your own cyberpunk ambience: one slider per sound layer, a few presets,
// and a live visualizer driven by what you hear (oscilloscope, spectrum, or geometric rings).

type Mode = 'wave' | 'bars' | 'rings'
type Mix = Record<LayerId, number>

const EMPTY: Mix = { rain: 0, thunder: 0, wind: 0, city: 0, neon: 0, server: 0, keys: 0 }
const PRESETS: { name: string; mix: Partial<Mix> }[] = [
  { name: 'Nuit pluvieuse', mix: { rain: 0.7, neon: 0.35, city: 0.3 } },
  { name: 'Néo-Tokyo', mix: { city: 0.65, neon: 0.5, rain: 0.25, wind: 0.2 } },
  { name: 'Salle serveur', mix: { server: 0.75, keys: 0.45, neon: 0.15 } },
  { name: 'Orage', mix: { rain: 0.9, thunder: 0.8, wind: 0.55 } },
  { name: 'Focus', mix: { rain: 0.4, keys: 0.3, server: 0.15 } },
]

function Visualizer({ mode, active }: { mode: Mode; active: boolean }) {
  const canvas = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = canvas.current!
    const g = cv.getContext('2d')!
    let raf = 0
    let w = 0, h = 0, t = 0
    const time = new Uint8Array(2048)
    const freq = new Uint8Array(1024)
    const resize = () => {
      const r = cv.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      cv.width = w * dpr
      cv.height = h * dpr
      g.setTransform(dpr, 0, 0, dpr, 0, 0)
    }
    resize()
    const ro = new ResizeObserver(resize)
    ro.observe(cv)

    const css = getComputedStyle(cv)
    const draw = () => {
      t += 0.016
      const accent = css.getPropertyValue('--accent').trim() || '#c4b5e8'
      const neon = css.getPropertyValue('--neon').trim() || '#7ee7ff'
      const a = getAnalyser()
      if (a) {
        a.getByteTimeDomainData(time)
        a.getByteFrequencyData(freq)
      } else {
        // Before any sound: a gentle idle wave
        for (let i = 0; i < time.length; i++) time[i] = 128 + Math.sin(i / 60 + t * 2) * 6
        freq.fill(0)
      }
      // Trails: fade the previous frame instead of clearing it
      g.fillStyle = 'rgba(7, 7, 12, 0.28)'
      g.fillRect(0, 0, w, h)
      g.shadowBlur = 14

      if (mode === 'wave') {
        for (const [color, offset, scale] of [[neon, 0, 1], [accent, 8, 0.7]] as const) {
          g.strokeStyle = color
          g.shadowColor = color
          g.lineWidth = 2
          g.beginPath()
          for (let i = 0; i < time.length; i += 4) {
            const x = (i / time.length) * w
            const y = h / 2 + ((time[(i + offset * 20) % time.length] - 128) / 128) * h * 0.42 * scale
            if (i) g.lineTo(x, y)
            else g.moveTo(x, y)
          }
          g.stroke()
        }
      } else if (mode === 'bars') {
        const n = 64
        const bw = w / n
        for (let i = 0; i < n; i++) {
          // Logarithmic bins so the low end doesn't take the whole width
          const idx = Math.floor(Math.pow(i / n, 2) * 400) + 2
          const v = freq[idx] / 255
          const bh = Math.max(2, v * h * 0.9)
          const grad = g.createLinearGradient(0, h, 0, h - bh)
          grad.addColorStop(0, accent)
          grad.addColorStop(1, neon)
          g.fillStyle = grad
          g.shadowColor = neon
          g.fillRect(i * bw + 1, h - bh, bw - 2, bh)
        }
      } else {
        const cx = w / 2, cy = h / 2
        const base = Math.min(w, h) * 0.18
        for (let ring = 0; ring < 3; ring++) {
          const color = ring % 2 ? accent : neon
          g.strokeStyle = color
          g.shadowColor = color
          g.lineWidth = 1.6
          g.beginPath()
          const sides = 120
          for (let i = 0; i <= sides; i++) {
            const ang = (i / sides) * Math.PI * 2 + t * (0.3 + ring * 0.15) * (ring % 2 ? -1 : 1)
            const v = (time[(i * 12 + ring * 200) % time.length] - 128) / 128
            const r = base * (1 + ring * 0.55) + v * base * 0.9
            const x = cx + Math.cos(ang) * r, y = cy + Math.sin(ang) * r
            if (i) g.lineTo(x, y)
            else g.moveTo(x, y)
          }
          g.stroke()
        }
      }
      g.shadowBlur = 0
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [mode, active])

  return <canvas ref={canvas} aria-hidden="true" className="size-full" />
}

export default function Ambiance() {
  const [mix, setMix] = useState<Mix>(EMPTY)
  const [master, setMasterState] = useState(0.8)
  const [mode, setMode] = useState<Mode>('wave')
  const playing = Object.values(mix).some((v) => v > 0)

  // Stop the sound when the window closes
  useEffect(() => () => stopAll(), [])

  const change = (id: LayerId, v: number) => {
    setVolume(id, v)
    setMix((m) => ({ ...m, [id]: v }))
  }
  const applyPreset = (p: Partial<Mix>) => {
    const next = { ...EMPTY, ...p }
    for (const l of LAYERS) setVolume(l.id, next[l.id])
    setMix(next)
  }

  return (
    <div className="grid h-full min-h-[480px] grid-rows-[minmax(180px,1fr)_auto] gap-0 md:grid-cols-[minmax(0,1.3fr)_minmax(280px,1fr)] md:grid-rows-1">
      {/* Visualizer */}
      <div className="relative min-h-[200px] overflow-hidden border-line bg-black md:border-r">
        <Visualizer mode={mode} active={playing} />
        <div className="absolute top-3 left-3 flex gap-1.5 font-mono text-[11px]">
          {(
            [
              ['wave', 'Oscilloscope'],
              ['bars', 'Spectre'],
              ['rings', 'Géométrie'],
            ] as const
          ).map(([m, label]) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-full border px-2.5 py-1 backdrop-blur ${mode === m ? 'border-neon bg-neon/15 text-neon' : 'border-line bg-black/40 text-muted hover:text-fg'}`}
            >
              {label}
            </button>
          ))}
        </div>
        {!playing && (
          <p className="absolute inset-x-0 bottom-4 m-0 text-center font-mono text-[12px] text-muted">Choisis une ambiance ou monte un curseur →</p>
        )}
      </div>

      {/* Mixer */}
      <div className="scroll-thin grid content-start gap-4 overflow-auto p-4">
        <div className="grid gap-2">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Ambiances</span>
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button
                key={p.name}
                type="button"
                onClick={() => applyPreset(p.mix)}
                className="rounded-full border border-line px-3 py-1.5 text-[12px] transition-colors hover:border-accent hover:text-accent"
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-3">
          <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Mixage</span>
          {LAYERS.map((l) => {
            const v = mix[l.id]
            return (
              <label key={l.id} className="grid grid-cols-[28px_1fr_38px] items-center gap-3">
                <span className={`font-display text-lg font-bold transition-colors ${v > 0 ? 'text-accent' : 'text-muted'}`}>{l.kanji}</span>
                <span className="grid gap-1.5">
                  <span className="text-[12px]">{l.label}</span>
                  <input
                    id={`layer-${l.id}`}
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={v}
                    onChange={(e) => change(l.id, Number(e.target.value))}
                    className="slider w-full"
                    style={{ '--fill': `${v * 100}%` } as React.CSSProperties}
                  />
                </span>
                <span className="text-right font-mono text-[11px] text-muted tabular-nums">{Math.round(v * 100)}</span>
              </label>
            )
          })}
        </div>

        <div className="grid gap-2 border-t border-line pt-3">
          <label className="grid grid-cols-[1fr_38px] items-center gap-3">
            <span className="grid gap-1.5">
              <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-muted">Volume général</span>
              <input
                id="master-volume"
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={master}
                onChange={(e) => {
                  const v = Number(e.target.value)
                  setMasterState(v)
                  setMaster(v)
                }}
                className="slider w-full"
                style={{ '--fill': `${master * 100}%` } as React.CSSProperties}
              />
            </span>
            <span className="text-right font-mono text-[11px] text-muted tabular-nums">{Math.round(master * 100)}</span>
          </label>
          <button
            type="button"
            onClick={() => applyPreset({})}
            disabled={!playing}
            className="w-fit rounded-full border border-line px-3 py-1.5 font-mono text-[12px] text-muted transition-colors enabled:hover:border-bad enabled:hover:text-bad disabled:opacity-40"
          >
            ■ Tout couper
          </button>
        </div>
      </div>
    </div>
  )
}
