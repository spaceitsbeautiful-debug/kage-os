import { useSyncExternalStore } from 'react'

// User preferences, remembered in the browser: CRT effect, accent colour and wallpaper.

export type Accent = 'lavender' | 'cyan' | 'crimson' | 'lime'
export type Wallpaper = 'nuit' | 'synthwave' | 'pluie' | 'minimal'
export const WALLPAPERS: { id: Wallpaper; label: string }[] = [
  { id: 'nuit', label: 'Nuit' },
  { id: 'synthwave', label: 'Synthwave' },
  { id: 'pluie', label: 'Pluie' },
  { id: 'minimal', label: 'Minimal' },
]
type Settings = { crt: boolean; accent: Accent; wallpaper: Wallpaper }

function load(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem('kage-settings') || '{}')
    return { crt: s.crt ?? true, accent: s.accent ?? 'lavender', wallpaper: s.wallpaper ?? 'nuit' }
  } catch {
    return { crt: true, accent: 'lavender', wallpaper: 'nuit' }
  }
}

let settings = load()
const listeners = new Set<() => void>()

function apply() {
  const root = document.documentElement
  if (settings.accent === 'lavender') delete root.dataset.accent
  else root.dataset.accent = settings.accent
}
apply()

export function setSettings(patch: Partial<Settings>) {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem('kage-settings', JSON.stringify(settings))
  } catch {
    /* not saved */
  }
  apply()
  listeners.forEach((l) => l())
}

export const getSettings = () => settings

export function useSettings() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
  )
}
