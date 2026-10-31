import { useEffect, useState } from 'react'

// BIOS-style boot screen: the lines type in, memory counts up, then the logo and a progress bar.
// A click or any key skips it. Shown once per visit.

const LINES = [
  'KAGE BIOS v1.0 · (c) 2026 Gounteni David',
  'Processeur : Shadow Core 影-9 @ 4.20 GHz',
  'Vérification mémoire : ',
  'Détection des périphériques… clavier, souris, son',
  'Chargement du noyau 影OS…',
  'Montage du système de fichiers… ok',
  'Démarrage de l’interface…',
]

export default function Boot({ onDone }: { onDone: () => void }) {
  const [shown, setShown] = useState(0)
  const [memory, setMemory] = useState(0)
  const [logo, setLogo] = useState(false)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (reduced) {
      onDone()
      return
    }
    const timers: number[] = []
    LINES.forEach((_, i) => timers.push(window.setTimeout(() => setShown(i + 1), 280 + i * 330)))
    const mem = window.setInterval(() => setMemory((m) => Math.min(16384, m + 912)), 40)
    timers.push(window.setTimeout(() => setLogo(true), 280 + LINES.length * 330 + 200))
    const prog = window.setInterval(() => setProgress((p) => p + 1), 28)
    timers.push(window.setTimeout(onDone, 280 + LINES.length * 330 + 2200))
    const skip = () => onDone()
    window.addEventListener('keydown', skip)
    window.addEventListener('pointerdown', skip)
    return () => {
      timers.forEach(clearTimeout)
      clearInterval(mem)
      clearInterval(prog)
      window.removeEventListener('keydown', skip)
      window.removeEventListener('pointerdown', skip)
    }
  }, [onDone])

  return (
    <div className="fixed inset-0 z-[9000] bg-black p-[max(20px,4vw)] font-mono text-[13px] text-fg">
      {!logo ? (
        <div className="grid gap-1.5">
          {LINES.slice(0, shown).map((l, i) => (
            <div key={i} className={i === 0 ? 'text-accent' : ''}>
              {l}
              {i === 2 && <span className="text-neon">{memory} Mo OK</span>}
            </div>
          ))}
          <span className="caret">▌</span>
        </div>
      ) : (
        <div className="grid h-full place-content-center justify-items-center gap-6">
          <span className="font-display text-[clamp(90px,16vw,160px)] leading-none font-extrabold text-accent drop-shadow-[0_0_30px_var(--accent)]">
            影
          </span>
          <span className="tracking-[0.5em] text-muted">KAGE OS</span>
          <div className="h-1 w-56 overflow-hidden rounded-full bg-line">
            <div className="h-full bg-accent transition-[width] duration-100" style={{ width: `${Math.min(100, progress * 1.4)}%` }} />
          </div>
        </div>
      )}
      <span className="absolute right-6 bottom-5 text-[11px] text-muted">Clique ou appuie sur une touche pour passer</span>
    </div>
  )
}
