import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

// Notifications that slide in above the taskbar (bottom right) and leave after a few seconds.

type Note = { id: number; text: string }
let push: ((text: string) => void) | null = null

export function notify(text: string) {
  push?.(text)
}

export function Notifications() {
  const [notes, setNotes] = useState<Note[]>([])
  useEffect(() => {
    let id = 0
    push = (text) => {
      const n = { id: ++id, text }
      setNotes((list) => [...list.slice(-2), n])
      setTimeout(() => setNotes((list) => list.filter((x) => x.id !== n.id)), 4500)
    }
    return () => {
      push = null
    }
  }, [])

  return (
    <div aria-live="polite" className="pointer-events-none fixed right-3 bottom-15 z-[7500] grid w-[min(320px,calc(100vw-24px))] gap-2">
      <AnimatePresence>
        {notes.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 40 }}
            transition={{ duration: 0.3 }}
            className="flex gap-3 rounded-[12px] border border-line bg-panel/95 p-3 shadow-2xl backdrop-blur-md"
          >
            <span className="font-display text-xl font-extrabold text-accent">影</span>
            <span className="grid gap-0.5">
              <span className="font-mono text-[11px] text-muted">影OS</span>
              <span className="text-[13px]">{n.text}</span>
            </span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
