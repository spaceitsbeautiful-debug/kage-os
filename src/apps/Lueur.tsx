import { useEffect, useRef, useState } from 'react'

// "Lueur" (glow): an original little arcade game. You are a light in the dark.
// Collect the petals, dodge the shadows closing in. 3 lives, the pace keeps rising.
// Mouse / finger to move, or the arrow keys / WASD.

type Thing = { x: number; y: number; vx: number; vy: number; r: number }
type Phase = 'ready' | 'play' | 'over'

const W = 800
const H = 560

function readBest() {
  try {
    return Number(localStorage.getItem('lueur-best')) || 0
  } catch {
    return 0
  }
}

export default function Lueur() {
  const t = (fr: string, _en: string) => fr
  const canvas = useRef<HTMLCanvasElement>(null)
  const [phase, setPhase] = useState<Phase>('ready')
  const [score, setScore] = useState(0)
  const [best, setBest] = useState(readBest)

  useEffect(() => {
    if (phase !== 'play') return
    const cv = canvas.current!
    const ctx = cv.getContext('2d')!
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    cv.width = W * dpr
    cv.height = H * dpr
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const css = getComputedStyle(cv)
    const color = (name: string, fallback: string) => css.getPropertyValue(name).trim() || fallback
    const accent = color('--accent', '#c4b5e8')
    const fg = color('--fg', '#e9e6ef')
    const bg = color('--bg', '#07070c')
    const bad = color('--bad', '#ef8fa0')

    const player = { x: W / 2, y: H / 2, tx: W / 2, ty: H / 2, r: 11 }
    const shadows: Thing[] = []
    const petals: Thing[] = []
    const sparks: { x: number; y: number; vx: number; vy: number; life: number }[] = []
    const keys = new Set<string>()
    let lives = 3
    let points = 0
    let invulnerable = 0
    let elapsed = 0
    let spawnShadow = 0
    let spawnPetal = 0
    let last = performance.now()
    let raf = 0

    const toCanvas = (clientX: number, clientY: number) => {
      const r = cv.getBoundingClientRect()
      return { x: ((clientX - r.left) / r.width) * W, y: ((clientY - r.top) / r.height) * H }
    }
    const onPointer = (e: PointerEvent) => {
      const p = toCanvas(e.clientX, e.clientY)
      player.tx = p.x
      player.ty = p.y
    }
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'w', 'a', 's', 'd', 'z', 'q'].includes(k)) {
        e.preventDefault()
        if (e.type === 'keydown') keys.add(k)
        else keys.delete(k)
      }
    }
    cv.addEventListener('pointermove', onPointer)
    cv.addEventListener('pointerdown', onPointer)
    window.addEventListener('keydown', onKey)
    window.addEventListener('keyup', onKey)

    const burst = (x: number, y: number, n: number) => {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, s = 1 + Math.random() * 3
        sparks.push({ x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, life: 1 })
      }
    }

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 3)
      last = now
      elapsed += dt / 60
      const pace = 1 + elapsed / 25 // everything speeds up over time

      // Player: keyboard moves the target, the light glides toward it
      const step = 7 * dt
      if (keys.has('arrowup') || keys.has('w') || keys.has('z')) player.ty -= step
      if (keys.has('arrowdown') || keys.has('s')) player.ty += step
      if (keys.has('arrowleft') || keys.has('a') || keys.has('q')) player.tx -= step
      if (keys.has('arrowright') || keys.has('d')) player.tx += step
      player.tx = Math.max(player.r, Math.min(W - player.r, player.tx))
      player.ty = Math.max(player.r, Math.min(H - player.r, player.ty))
      player.x += (player.tx - player.x) * 0.2 * dt
      player.y += (player.ty - player.y) * 0.2 * dt

      // Shadows come from the edges, aimed near the player
      spawnShadow -= dt
      if (spawnShadow <= 0) {
        spawnShadow = Math.max(14, 50 - elapsed * 1.2)
        const side = Math.floor(Math.random() * 4)
        const x = side === 0 ? -30 : side === 1 ? W + 30 : Math.random() * W
        const y = side === 2 ? -30 : side === 3 ? H + 30 : Math.random() * H
        const ax = player.x + (Math.random() - 0.5) * 220, ay = player.y + (Math.random() - 0.5) * 220
        const d = Math.hypot(ax - x, ay - y) || 1
        const speed = (1.6 + Math.random() * 1.4) * pace
        shadows.push({ x, y, vx: ((ax - x) / d) * speed, vy: ((ay - y) / d) * speed, r: 14 + Math.random() * 18 })
      }
      // Petals appear anywhere and drift slowly
      spawnPetal -= dt
      if (spawnPetal <= 0 && petals.length < 4) {
        spawnPetal = 60 + Math.random() * 60
        petals.push({ x: 40 + Math.random() * (W - 80), y: 40 + Math.random() * (H - 80), vx: (Math.random() - 0.5) * 0.6, vy: (Math.random() - 0.5) * 0.6, r: 9 })
      }

      for (const s of shadows) {
        s.x += s.vx * dt
        s.y += s.vy * dt
      }
      for (let i = shadows.length - 1; i >= 0; i--) {
        const s = shadows[i]
        if (s.x < -80 || s.x > W + 80 || s.y < -80 || s.y > H + 80) shadows.splice(i, 1)
        else if (invulnerable <= 0 && Math.hypot(s.x - player.x, s.y - player.y) < s.r + player.r - 4) {
          lives--
          invulnerable = 90
          shadows.splice(i, 1)
          burst(player.x, player.y, 26)
                    if (lives <= 0) {
            setScore(points)
            setPhase('over')
            setBest((b) => {
              const nb = Math.max(b, points)
              try {
                localStorage.setItem('lueur-best', String(nb))
              } catch {
                /* not saved */
              }
              return nb
            })
            return
          }
        }
      }
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i]
        p.x += p.vx * dt
        p.y += p.vy * dt
        if (p.x < 10 || p.x > W - 10) p.vx *= -1
        if (p.y < 10 || p.y > H - 10) p.vy *= -1
        if (Math.hypot(p.x - player.x, p.y - player.y) < p.r + player.r + 4) {
          petals.splice(i, 1)
          points += 1
          setScore(points)
          burst(p.x, p.y, 12)
                  }
      }
      invulnerable -= dt
      for (let i = sparks.length - 1; i >= 0; i--) {
        const s = sparks[i]
        s.x += s.vx * dt
        s.y += s.vy * dt
        s.life -= 0.03 * dt
        if (s.life <= 0) sparks.splice(i, 1)
      }

      // Draw
      ctx.fillStyle = bg
      ctx.fillRect(0, 0, W, H)
      // Light halo around the player
      const halo = ctx.createRadialGradient(player.x, player.y, 0, player.x, player.y, 150)
      halo.addColorStop(0, accent + '40')
      halo.addColorStop(1, 'transparent')
      ctx.fillStyle = halo
      ctx.fillRect(0, 0, W, H)
      // Petals: small five-leaf flowers
      for (const p of petals) {
        ctx.fillStyle = accent
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2 + elapsed
          ctx.beginPath()
          ctx.arc(p.x + Math.cos(a) * 5, p.y + Math.sin(a) * 5, 4, 0, Math.PI * 2)
          ctx.fill()
        }
        ctx.fillStyle = fg
        ctx.beginPath()
        ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2)
        ctx.fill()
      }
      // Shadows: dark blurred blobs with a red rim
      for (const s of shadows) {
        const g = ctx.createRadialGradient(s.x, s.y, s.r * 0.2, s.x, s.y, s.r)
        g.addColorStop(0, '#000000ee')
        g.addColorStop(0.8, '#000000aa')
        g.addColorStop(1, bad + '55')
        ctx.fillStyle = g
        ctx.beginPath()
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2)
        ctx.fill()
      }
      for (const s of sparks) {
        ctx.globalAlpha = Math.max(0, s.life)
        ctx.fillStyle = accent
        ctx.fillRect(s.x - 1.5, s.y - 1.5, 3, 3)
      }
      ctx.globalAlpha = invulnerable > 0 && Math.floor(invulnerable / 6) % 2 === 0 ? 0.35 : 1
      ctx.fillStyle = fg
      ctx.beginPath()
      ctx.arc(player.x, player.y, player.r, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
      // HUD
      ctx.fillStyle = fg
      ctx.font = '600 15px "JetBrains Mono", monospace'
      ctx.fillText(`✿ ${points}`, 18, 30)
      ctx.textAlign = 'right'
      ctx.fillStyle = bad
      ctx.fillText('♥'.repeat(lives) + '♡'.repeat(3 - lives), W - 18, 30)
      ctx.textAlign = 'left'

      raf = requestAnimationFrame(loop)
    }
    raf = requestAnimationFrame(loop)
    return () => {
      cancelAnimationFrame(raf)
      cv.removeEventListener('pointermove', onPointer)
      cv.removeEventListener('pointerdown', onPointer)
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('keyup', onKey)
    }
  }, [phase])

  return (
    <div className="grid">
      <div className="relative overflow-hidden bg-bg">
        <canvas
          ref={canvas}
          aria-label={t('Jeu Lueur', 'Lueur game')}
          className="block aspect-[10/7] w-full max-w-full touch-none"
          style={{ cursor: phase === 'play' ? 'none' : 'default' }}
        />
        {phase !== 'play' && (
          <div className="absolute inset-0 grid place-items-center bg-bg/70 p-6 text-center backdrop-blur-sm">
            <div className="grid justify-items-center gap-3">
              <span lang="ja" className="font-display text-6xl font-bold text-accent">
                光
              </span>
              <span className="font-display text-3xl font-bold">Lueur</span>
              <p className="m-0 max-w-[30em] text-sm text-muted">
                {phase === 'over'
                  ? t(`L’ombre t’a rattrapé. ${score} pétale${score > 1 ? 's' : ''} récupéré${score > 1 ? 's' : ''}.`, `The shadow caught you. ${score} petal${score === 1 ? '' : 's'} collected.`)
                  : t(
                      'Tu es une lumière dans le noir. Ramasse les pétales, évite les ombres qui se rapprochent. Souris, doigt ou flèches du clavier.',
                      'You are a light in the dark. Collect the petals, dodge the shadows closing in. Mouse, finger or arrow keys.',
                    )}
              </p>
              <span className="font-mono text-xs text-muted">Record : {best}</span>
              <button
                type="button"
                onClick={() => {
                  setScore(0)
                  setPhase('play')
                }}
                className="rounded-full bg-accent px-6 py-2.5 font-mono text-sm text-bg transition-transform hover:-translate-y-px"
              >
                {phase === 'over' ? t('Rejouer', 'Play again') : t('Jouer', 'Play')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
