import type { ComponentType } from 'react'
import About from '../apps/About'
import Ambiance from '../apps/ambiance/Ambiance'
import Lueur from '../apps/Lueur'
import Notes from '../apps/Notes'
import Settings from '../apps/Settings'
import Terminal from '../apps/Terminal'

// Every app of the OS: its window title, desktop icon (a kanji), default window size and component.

export type AppId = 'terminal' | 'ambiance' | 'lueur' | 'notes' | 'about' | 'settings'

export type AppDef = {
  title: string
  kanji: string
  hint: string
  size: [number, number]
  Component: ComponentType
}

export const apps: Record<AppId, AppDef> = {
  ambiance: { title: 'Ambiance', kanji: '音', hint: 'Générateur d’ambiance cyberpunk', size: [880, 600], Component: Ambiance },
  terminal: { title: 'Terminal', kanji: '端', hint: 'Ligne de commande', size: [700, 440], Component: Terminal },
  lueur: { title: 'Lueur', kanji: '光', hint: 'Mini-jeu d’arcade', size: [760, 600], Component: Lueur },
  notes: { title: 'Notes', kanji: '記', hint: 'Bloc-notes', size: [520, 440], Component: Notes },
  about: { title: 'À propos', kanji: '影', hint: 'À propos de 影OS', size: [520, 460], Component: About },
  settings: { title: 'Réglages', kanji: '設', hint: 'Apparence et effets', size: [460, 420], Component: Settings },
}

export const appOrder: AppId[] = ['ambiance', 'terminal', 'lueur', 'notes', 'about', 'settings']
