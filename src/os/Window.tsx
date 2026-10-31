import { useRef } from 'react'
import { motion } from 'framer-motion'
import { apps } from './apps'
import { useWindows, type Win } from './store'

// A window: drag it by the title bar, resize it from the bottom-right corner,
// double-click the title bar to maximize. Clicking anywhere brings it to the front.

const MIN_W = 300
const MIN_H = 200
const TASKBAR = 48

export default function Window({ win, active }: { win: Win; active: boolean }) {
  const { close, focus, minimize, toggleMax, move, resize } = useWindows()
  const def = apps[win.app]
  const drag = useRef<{ dx: number; dy: number } | null>(null)
  const size = useRef<{ x: number; y: number; w: number; h: number } | null>(null)

  const onTitleDown = (e: React.PointerEvent) => {
    if (win.maximized || (e.target as HTMLElement).closest('button')) return
    drag.current = { dx: e.clientX - win.x, dy: e.clientY - win.y }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onTitleMove = (e: React.PointerEvent) => {
    if (!drag.current) return
    const x = Math.min(window.innerWidth - 80, Math.max(-win.w + 120, e.clientX - drag.current.dx))
    const y = Math.min(window.innerHeight - TASKBAR - 30, Math.max(0, e.clientY - drag.current.dy))
    move(win.id, x, y)
  }
  const onResizeDown = (e: React.PointerEvent) => {
    e.stopPropagation()
    size.current = { x: e.clientX, y: e.clientY, w: win.w, h: win.h }
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
  }
  const onResizeMove = (e: React.PointerEvent) => {
    if (!size.current) return
    const s = size.current
    resize(win.id, Math.max(MIN_W, s.w + e.clientX - s.x), Math.max(MIN_H, s.h + e.clientY - s.y))
  }

  const rect = win.maximized
    ? { left: 0, top: 0, width: '100%', height: `calc(100% - ${TASKBAR}px)` }
    : { left: win.x, top: win.y, width: win.w, height: win.h }

  return (
    <motion.section
      role="dialog"
      aria-label={def.title}
      onPointerDown={() => !active && focus(win.id)}
      initial={{ opacity: 0, scale: 0.94, y: 12 }}
      animate={{ opacity: win.minimized ? 0 : 1, scale: win.minimized ? 0.9 : 1, y: win.minimized ? 40 : 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      transition={{ duration: 0.22, ease: [0.2, 0.8, 0.2, 1] }}
      className={`absolute flex flex-col overflow-hidden border bg-panel/95 shadow-2xl backdrop-blur-md ${
        win.maximized ? 'rounded-none' : 'rounded-[12px]'
      } ${active ? 'border-accent/60 shadow-[0_0_40px_-10px_var(--accent)]' : 'border-line'} ${win.minimized ? 'pointer-events-none' : ''}`}
      style={{ ...rect, zIndex: win.z }}
    >
      <header
        onPointerDown={onTitleDown}
        onPointerMove={onTitleMove}
        onPointerUp={() => (drag.current = null)}
        onDoubleClick={() => toggleMax(win.id)}
        className={`flex h-10 flex-none touch-none items-center gap-3 border-b border-line px-3 ${win.maximized ? '' : 'cursor-grab active:cursor-grabbing'}`}
      >
        <span className="font-display text-base font-bold text-accent">{def.kanji}</span>
        <span className="flex-1 truncate font-mono text-[12px] tracking-[0.06em] text-muted">{def.title}</span>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => minimize(win.id)} aria-label="Réduire" className="grid size-6 place-items-center rounded-md text-muted hover:bg-line hover:text-fg">
            ─
          </button>
          <button type="button" onClick={() => toggleMax(win.id)} aria-label="Agrandir" className="grid size-6 place-items-center rounded-md text-muted hover:bg-line hover:text-fg">
            {win.maximized ? '❐' : '□'}
          </button>
          <button type="button" onClick={() => close(win.id)} aria-label="Fermer" className="grid size-6 place-items-center rounded-md text-muted hover:bg-bad hover:text-bg">
            ✕
          </button>
        </div>
      </header>
      <div className="scroll-thin min-h-0 flex-1 overflow-auto">
        <def.Component />
      </div>
      {!win.maximized && (
        <span
          onPointerDown={onResizeDown}
          onPointerMove={onResizeMove}
          onPointerUp={() => (size.current = null)}
          aria-hidden="true"
          className="absolute right-0 bottom-0 size-4 cursor-nwse-resize touch-none"
          style={{ background: 'linear-gradient(135deg, transparent 50%, var(--line) 50%)' }}
        />
      )}
    </motion.section>
  )
}
