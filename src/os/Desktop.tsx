import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { appOrder, apps, type AppId } from './apps'
import { Notifications, notify } from './notify'
import { WALLPAPERS, getSettings, setSettings, useSettings } from './settings'
import { useWindows } from './store'
import Taskbar from './Taskbar'
import Wallpaper from './Wallpaper'
import Window from './Window'

// The desktop: wallpaper, a column of app icons (double-click, or single tap on touch screens),
// a right-click menu, the open windows, notifications and the taskbar.

export function nextWallpaper() {
  const i = WALLPAPERS.findIndex((w) => w.id === getSettings().wallpaper)
  const next = WALLPAPERS[(i + 1) % WALLPAPERS.length]
  setSettings({ wallpaper: next.id })
  notify(`Fond d’écran : ${next.label}`)
}

export default function Desktop({ onShutdown }: { onShutdown: () => void }) {
  const { wins, open } = useWindows()
  const { wallpaper } = useSettings()
  const [selected, setSelected] = useState<AppId | null>(null)
  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null)
  const touch = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches
  const top = wins.reduce((a, w) => (!w.minimized && w.z > a ? w.z : a), -1)

  // Welcome: open the ambience generator on larger screens, and a hint
  useEffect(() => {
    if (window.innerWidth >= 900) open('ambiance')
    const id = setTimeout(() => notify('Bienvenue sur 影OS. Fais un clic droit sur le bureau pour plus d’options.'), 900)
    return () => clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!menu) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setMenu(null)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [menu])

  const menuItems: [string, () => void][] = [
    ['Nouvelle note', () => open('notes')],
    ['Ouvrir les fichiers', () => open('files')],
    ['Ouvrir le Terminal', () => open('terminal')],
    ['Changer de fond d’écran', nextWallpaper],
    ['Réglages', () => open('settings')],
    ['À propos de 影OS', () => open('about')],
  ]

  return (
    <div
      className="wallpaper fixed inset-0 overflow-hidden"
      onPointerDown={() => {
        setSelected(null)
        setMenu(null)
      }}
      onContextMenu={(e) => {
        // Only on the desktop itself, not inside windows
        if ((e.target as HTMLElement).closest('section, footer, nav')) return
        e.preventDefault()
        setMenu({ x: Math.min(e.clientX, window.innerWidth - 230), y: Math.min(e.clientY, window.innerHeight - 290) })
      }}
    >
      <Wallpaper id={wallpaper} />

      <ul className="absolute top-3 left-3 m-0 grid list-none grid-flow-row grid-cols-[repeat(auto-fill,88px)] gap-1 p-0 sm:grid-flow-col sm:grid-cols-none sm:grid-rows-[repeat(auto-fill,96px)]" style={{ height: 'calc(100% - 64px)', width: 'calc(100% - 24px)' }}>
        {appOrder.map((id) => (
          <li key={id}>
            <button
              type="button"
              onPointerDown={(e) => {
                e.stopPropagation()
                setSelected(id)
                setMenu(null)
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

      <AnimatePresence>
        {menu && (
          <motion.nav
            aria-label="Menu du bureau"
            onPointerDown={(e) => e.stopPropagation()}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.12 }}
            className="fixed z-[8500] grid w-[220px] gap-0.5 rounded-[10px] border border-line bg-panel/95 p-1.5 shadow-2xl backdrop-blur-md"
            style={{ left: menu.x, top: menu.y }}
          >
            {menuItems.map(([label, run], i) => (
              <button
                key={label}
                type="button"
                onClick={() => {
                  run()
                  setMenu(null)
                }}
                className={`rounded-[6px] px-3 py-2 text-left text-[13px] hover:bg-accent hover:text-bg ${i === 3 || i === 4 ? 'mt-0.5 border-t border-line' : ''}`}
              >
                {label}
              </button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>

      <Notifications />
      <Taskbar onShutdown={onShutdown} />
    </div>
  )
}
