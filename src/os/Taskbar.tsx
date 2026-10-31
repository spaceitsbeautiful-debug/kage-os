import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { appOrder, apps } from './apps'
import { useWindows } from './store'

// Bottom bar: start button + menu, one button per open window, and the clock.

function Clock() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 10_000)
    return () => clearInterval(id)
  }, [])
  return (
    <span className="grid text-right font-mono text-[11px] leading-tight text-muted">
      <span className="text-fg">{now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
      <span>{now.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
    </span>
  )
}

export default function Taskbar({ onShutdown }: { onShutdown: () => void }) {
  const { wins, open, focus, minimize } = useWindows()
  const [menu, setMenu] = useState(false)
  const top = wins.reduce((a, w) => (!w.minimized && w.z > (a?.z ?? -1) ? w : a), null as (typeof wins)[number] | null)

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu])

  return (
    <>
      <AnimatePresence>
        {menu && (
          <>
            <div className="fixed inset-0 z-[8000]" onPointerDown={() => setMenu(false)} />
            <motion.nav
              aria-label="Menu démarrer"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              transition={{ duration: 0.2 }}
              className="fixed bottom-14 left-2 z-[8001] grid w-[min(320px,calc(100vw-16px))] gap-1 rounded-[14px] border border-line bg-panel/95 p-3 shadow-2xl backdrop-blur-md"
            >
              <div className="mb-2 flex items-center gap-3 border-b border-line px-2 pb-3">
                <span className="font-display text-3xl font-extrabold text-accent">影</span>
                <span className="grid">
                  <span className="font-bold">影OS</span>
                  <span className="font-mono text-[11px] text-muted">Gounteni David · v1.0</span>
                </span>
              </div>
              {appOrder.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => {
                    open(id)
                    setMenu(false)
                  }}
                  className="flex items-center gap-3 rounded-[8px] px-2 py-2 text-left hover:bg-line"
                >
                  <span className="grid size-8 place-items-center rounded-[8px] bg-bg font-display text-lg font-bold text-accent">{apps[id].kanji}</span>
                  <span className="grid">
                    <span>{apps[id].title}</span>
                    <span className="font-mono text-[11px] text-muted">{apps[id].hint}</span>
                  </span>
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setMenu(false)
                  onShutdown()
                }}
                className="mt-2 flex items-center gap-3 rounded-[8px] border-t border-line px-2 pt-3 pb-1 text-left font-mono text-[12px] text-muted hover:text-bad"
              >
                ⏻ Éteindre
              </button>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      <footer className="fixed inset-x-0 bottom-0 z-[7000] flex h-12 items-center gap-2 border-t border-line bg-panel/85 px-2 backdrop-blur-md" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
        <button
          type="button"
          onClick={() => setMenu((m) => !m)}
          aria-expanded={menu}
          aria-label="Menu démarrer"
          className={`grid size-9 place-items-center rounded-[10px] font-display text-xl font-extrabold transition-colors ${menu ? 'bg-accent text-bg' : 'text-accent hover:bg-line'}`}
        >
          影
        </button>
        <div className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
          {wins.map((w) => {
            const isTop = top?.id === w.id
            return (
              <button
                key={w.id}
                type="button"
                onClick={() => (isTop ? minimize(w.id) : focus(w.id))}
                className={`flex h-9 flex-none items-center gap-2 rounded-[8px] px-3 font-mono text-[12px] transition-colors ${
                  isTop ? 'bg-line text-fg' : 'text-muted hover:bg-line/60'
                }`}
              >
                <span className="font-display text-sm font-bold text-accent">{apps[w.app].kanji}</span>
                <span className="hidden sm:inline">{apps[w.app].title}</span>
                {!w.minimized && <span className="size-1 rounded-full bg-accent" />}
              </button>
            )
          })}
        </div>
        <Clock />
      </footer>
    </>
  )
}
