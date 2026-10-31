import { createContext, useCallback, useContext, useMemo, useReducer, type ReactNode } from 'react'
import { apps, type AppId } from './apps'

// Window manager state: which windows are open, where, how big, which one is on top.

export type Win = {
  id: number
  app: AppId
  x: number
  y: number
  w: number
  h: number
  z: number
  minimized: boolean
  maximized: boolean
}

type Action =
  | { type: 'open'; app: AppId; desktop: { w: number; h: number } }
  | { type: 'close' | 'focus' | 'minimize' | 'toggleMax'; id: number }
  | { type: 'move'; id: number; x: number; y: number }
  | { type: 'resize'; id: number; w: number; h: number }

type State = { wins: Win[]; nextId: number; topZ: number }

function reducer(s: State, a: Action): State {
  switch (a.type) {
    case 'open': {
      // One window per app: opening it again brings the existing one back
      const existing = s.wins.find((w) => w.app === a.app)
      if (existing) {
        const z = s.topZ + 1
        return { ...s, topZ: z, wins: s.wins.map((w) => (w.id === existing.id ? { ...w, z, minimized: false } : w)) }
      }
      const def = apps[a.app]
      const small = a.desktop.w < 700
      const w = Math.min(def.size[0], a.desktop.w - 24)
      const h = Math.min(def.size[1], a.desktop.h - 24)
      const offset = (s.wins.length % 6) * 28
      const z = s.topZ + 1
      const win: Win = {
        id: s.nextId,
        app: a.app,
        w,
        h,
        x: Math.max(12, Math.round((a.desktop.w - w) / 2) - 60 + offset),
        y: Math.max(12, Math.round((a.desktop.h - h) / 2) - 40 + offset),
        z,
        minimized: false,
        maximized: small, // phones: full screen
      }
      return { wins: [...s.wins, win], nextId: s.nextId + 1, topZ: z }
    }
    case 'close':
      return { ...s, wins: s.wins.filter((w) => w.id !== a.id) }
    case 'focus': {
      const z = s.topZ + 1
      return { ...s, topZ: z, wins: s.wins.map((w) => (w.id === a.id ? { ...w, z, minimized: false } : w)) }
    }
    case 'minimize':
      return { ...s, wins: s.wins.map((w) => (w.id === a.id ? { ...w, minimized: true } : w)) }
    case 'toggleMax':
      return { ...s, wins: s.wins.map((w) => (w.id === a.id ? { ...w, maximized: !w.maximized } : w)) }
    case 'move':
      return { ...s, wins: s.wins.map((w) => (w.id === a.id ? { ...w, x: a.x, y: a.y } : w)) }
    case 'resize':
      return { ...s, wins: s.wins.map((w) => (w.id === a.id ? { ...w, w: a.w, h: a.h } : w)) }
  }
}

type Ctx = {
  wins: Win[]
  open: (app: AppId) => void
  close: (id: number) => void
  focus: (id: number) => void
  minimize: (id: number) => void
  toggleMax: (id: number) => void
  move: (id: number, x: number, y: number) => void
  resize: (id: number, w: number, h: number) => void
}

const WindowsContext = createContext<Ctx | null>(null)

export function WindowsProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, { wins: [], nextId: 1, topZ: 10 })
  const desktop = () => ({ w: window.innerWidth, h: window.innerHeight - 48 })
  const open = useCallback((app: AppId) => dispatch({ type: 'open', app, desktop: desktop() }), [])
  const value = useMemo<Ctx>(
    () => ({
      wins: state.wins,
      open,
      close: (id) => dispatch({ type: 'close', id }),
      focus: (id) => dispatch({ type: 'focus', id }),
      minimize: (id) => dispatch({ type: 'minimize', id }),
      toggleMax: (id) => dispatch({ type: 'toggleMax', id }),
      move: (id, x, y) => dispatch({ type: 'move', id, x, y }),
      resize: (id, w, h) => dispatch({ type: 'resize', id, w, h }),
    }),
    [state.wins, open],
  )
  return <WindowsContext.Provider value={value}>{children}</WindowsContext.Provider>
}

export function useWindows() {
  const ctx = useContext(WindowsContext)
  if (!ctx) throw new Error('useWindows outside WindowsProvider')
  return ctx
}
