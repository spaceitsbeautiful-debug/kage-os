import { useSyncExternalStore } from 'react'

// User preferences, remembered in the browser: CRT effect and accent colour.

export type Accent = 'lavender' | 'cyan' | 'crimson' | 'lime'
type Settings = { crt: boolean; accent: Accent }

function load(): Settings {
  try {
    const s = JSON.parse(localStorage.getItem('kage-settings') || '{}')
    return { crt: s.crt ?? true, accent: s.accent ?? 'lavender' }
  } catch {
    return { crt: true, accent: 'lavender' }
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

export function useSettings() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => settings,
  )
}
