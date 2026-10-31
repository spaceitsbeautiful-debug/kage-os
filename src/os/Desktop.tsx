import { useEffect, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { appOrder, apps, type AppId } from './apps'
import { useWindows } from './store'
import Taskbar from './Taskbar'
import Window from './Window'

// The desktop: wallpaper, a column of app icons (double-click, or single tap on touch screens),
// the open windows and the taskbar.

export default function Desktop({ onShutdown }: { onShutdown: () => void }) {
  const { wins, open } = useWindows()
  const [selected, setSelected] = useState<AppId | null>(null)
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const top = wins.reduce((a, w) => (!w.minimized && w.z > a ? w.z : a), -1)

  // Welcome: open the ambience generator on first arrival (on larger screens)
  useEffect(() => {
    if (window.innerWidth >= 900) open('ambiance')
  }, [open])

  return (
    <div className="wallpaper fixed inset-0 overflow-hidden" onPointerDown={() => setSelected(null)}>
      <div aria-hidden="true" className="wallpaper-grid pointer-events-none absolute inset-x-[-20%] bottom-0 h-[60%]" />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute right-[6vw] bottom-[12vh] font-display text-[min(40vw,420px)] leading-none font-extrabold text-accent/[0.05]"
      >
        影
      </span>

      <ul className="absolute top-3 left-3 m-0 grid list-none grid-cols-[repeat(auto-fill,88px)] gap-2 p-0 sm:grid-cols-1" style={{ maxHeight: 'calc(100% - 64px)' }}>
        {appOrder.map((id) => (
          <li key={id}>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation()
                setSelected(id)
              }}
              onClick={() => touch && open(id)}
              onDoubleClick={() => open(id)}
              onKeyDown={(e) => e.key === 'Enter' && open(id)}
              className={`grid w-[88px] justify-items-center gap-1.5 rounded-[10px] p-2 text-center transition-colors ${selected === id ? 'bg-accent/20 ring-1 ring-accent/50' : 'hover:bg-white/5'}`}
            >
              <span className="grid size-12 place-items-center rounded-[12px] border border-line bg-panel/80 font-display text-2xl font-bold text-accent shadow-lg">
                {apps[id].kanji}
              </span>
              <span className="text-[12px] leading-tight drop-shadow">{apps[id].title}</span>
            </button>
          </li>
        ))}
      </ul>

      <AnimatePresence>
        {wins.map((w) => (
          <Window key={w.id} win={w} active={w.z === top} />
        ))}
      </AnimatePresence>

      <Taskbar onShutdown={onShutdown} />
    </div>
  )
}
