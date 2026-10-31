import { useEffect, useRef, useState } from 'react'
import { useWindows } from '../os/store'
import { notify } from '../os/notify'

// Pomodoro timer: 25 min of focus, then a short break (a long one every 4 sessions).
// Tasks and today's stats are kept in the browser. The Ambiance app can play in the background.

type Mode = 'focus' | 'short' | 'long'
const MINUTES: Record<Mode, number> = { focus: 25, short: 5, long: 15 }
type Task = { id: number; text: string; done: boolean }
type Stats = { date: string; sessions: number; minutes: number }

const today = () => new Date().toISOString().slice(0, 10)
const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}`

function load<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function save(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* not saved, the page keeps working */
  }
}

export default function FocusTimer() {
  const t = <T,>(fr: T, _en: T): T => fr
  const { open } = useWindows()
  const [mode, setMode] = useState<Mode>('focus')
  const [remaining, setRemaining] = useState(MINUTES.focus * 60)
  const [running, setRunning] = useState(false)
  const endAt = useRef(0)
  const [tasks, setTasks] = useState<Task[]>(() =>
    load('focus-tasks', [
      { id: 1, text: t('Finir la page d’accueil', 'Finish the home page'), done: true },
      { id: 2, text: t('Corriger le bug du formulaire', 'Fix the form bug'), done: false },
      { id: 3, text: t('Relire le code', 'Review the code'), done: false },
    ]),
  )
  const [draft, setDraft] = useState('')
  const [stats, setStats] = useState<Stats>(() => {
    const s = load<Stats>('focus-stats', { date: today(), sessions: 0, minutes: 0 })
    return s.date === today() ? s : { date: today(), sessions: 0, minutes: 0 }
  })

  useEffect(() => save('focus-tasks', tasks), [tasks])
  useEffect(() => save('focus-stats', stats), [stats])

  const switchMode = (m: Mode) => {
    setMode(m)
    setRunning(false)
    setRemaining(MINUTES[m] * 60)
  }

  // Countdown based on the end time, so it stays exact even if the tab sleeps
  useEffect(() => {
    if (!running) return
    const id = setInterval(() => {
      const left = Math.max(0, (endAt.current - Date.now()) / 1000)
      setRemaining(left)
      if (left <= 0) {
        clearInterval(id)
        setRunning(false)
        notify(mode === 'focus' ? 'Session de focus terminée : prends une pause.' : 'Pause terminée : on s’y remet ?')
                if (mode === 'focus') {
          const sessions = stats.sessions + 1
          setStats({ date: today(), sessions, minutes: stats.minutes + MINUTES.focus })
          switchMode(sessions % 4 === 0 ? 'long' : 'short')
        } else switchMode('focus')
      }
    }, 250)
    return () => clearInterval(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, mode])

  // Show the countdown in the browser tab while running
  useEffect(() => {
    if (!running) return
    const original = document.title
    document.title = `${fmt(remaining)} · ${mode === 'focus' ? 'Focus' : t('Pause', 'Break')}`
    return () => {
      document.title = original
    }
  }, [running, remaining, mode, t])

  const toggle = () => {
    if (running) setRunning(false)
    else {
      endAt.current = Date.now() + remaining * 1000
      setRunning(true)
    }
  }

  const addTask = (e: React.FormEvent) => {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    setTasks((list) => [...list, { id: Date.now(), text, done: false }])
    setDraft('')
  }

  const total = MINUTES[mode] * 60
  const progress = 1 - remaining / total
  const R = 88
  const C = 2 * Math.PI * R
  const labels: Record<Mode, string> = {
    focus: 'Focus',
    short: t('Pause courte', 'Short break'),
    long: t('Pause longue', 'Long break'),
  }

  return (
    <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:items-start">
      {/* Timer */}
      <div className="grid justify-items-center gap-5 rounded-[16px] border border-line bg-bg p-[clamp(18px,3vw,32px)]">
        <div role="group" aria-label={t('Mode', 'Mode')} className="flex flex-wrap justify-center gap-1.5 font-mono text-xs">
          {(Object.keys(MINUTES) as Mode[]).map((m) => (
            <button
              key={m}
              type="button"
              aria-pressed={mode === m}
              onClick={() => switchMode(m)}
              className={`rounded-full border px-3 py-1 transition-colors ${mode === m ? 'border-accent bg-accent text-bg' : 'border-line hover:border-accent'}`}
            >
              {labels[m]}
            </button>
          ))}
        </div>
        <div className="relative aspect-square w-[min(100%,230px)]">
          <svg viewBox="0 0 200 200" className="size-full -rotate-90" aria-hidden="true">
            <circle cx="100" cy="100" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
            <circle
              cx="100"
              cy="100"
              r={R}
              fill="none"
              stroke="var(--accent)"
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={C}
              strokeDashoffset={C * (1 - progress)}
              style={{ transition: running ? 'stroke-dashoffset .25s linear' : 'stroke-dashoffset .4s ease' }}
            />
          </svg>
          <div className="absolute inset-0 grid place-content-center justify-items-center gap-1">
            <span lang="ja" className="font-display text-sm text-accent">
              {mode === 'focus' ? '集中' : '休憩'}
            </span>
            <span className="font-mono text-[clamp(36px,6vw,52px)] leading-none tabular-nums" role="timer" aria-live="off">
              {fmt(remaining)}
            </span>
            <span className="font-mono text-[11px] uppercase tracking-[0.12em] text-muted">{labels[mode]}</span>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 font-mono text-[13px]">
          <button type="button" onClick={toggle} className="rounded-full bg-accent px-5 py-2 text-bg transition-transform hover:-translate-y-px">
            {running ? t('Pause', 'Pause') : remaining < total ? t('Reprendre', 'Resume') : t('Démarrer', 'Start')}
          </button>
          <button type="button" onClick={() => switchMode(mode)} className="rounded-full border border-line px-4 py-2 transition-colors hover:border-accent">
            {t('Réinitialiser', 'Reset')}
          </button>
          <button
            type="button"
            onClick={() => open('ambiance')}
            className="rounded-full border border-line px-4 py-2 transition-colors hover:border-accent"
          >
            Ouvrir l’ambiance
          </button>
        </div>
      </div>

      {/* Tasks + stats */}
      <div className="grid gap-4">
        <dl className="m-0 grid grid-cols-2 gap-3">
          {[
            [t('Sessions aujourd’hui', 'Sessions today'), stats.sessions],
            [t('Minutes de focus', 'Focus minutes'), stats.minutes],
          ].map(([k, v]) => (
            <div key={String(k)} className="grid gap-1 rounded-[12px] border border-line bg-panel p-4">
              <dt className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{k}</dt>
              <dd className="m-0 font-display text-3xl font-bold tabular-nums">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="grid gap-3 rounded-[12px] border border-line bg-panel p-4">
          <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-muted">{t('Tâches du jour', 'Today’s tasks')}</span>
          <ul className="m-0 grid list-none gap-1 p-0">
            {tasks.map((task) => (
              <li key={task.id} className="group flex items-center gap-3 rounded-[8px] px-2 py-1.5 hover:bg-bg">
                <input
                  id={`task-${task.id}`}
                  type="checkbox"
                  checked={task.done}
                  onChange={() => setTasks((list) => list.map((x) => (x.id === task.id ? { ...x, done: !x.done } : x)))}
                  className="size-4 accent-[var(--accent)]"
                />
                <label htmlFor={`task-${task.id}`} className={`flex-1 text-[15px] ${task.done ? 'text-muted line-through' : ''}`}>
                  {task.text}
                </label>
                <button
                  type="button"
                  onClick={() => setTasks((list) => list.filter((x) => x.id !== task.id))}
                  aria-label={t(`Supprimer « ${task.text} »`, `Delete "${task.text}"`)}
                  className="font-mono text-xs text-muted opacity-0 transition-opacity group-hover:opacity-100 focus:opacity-100"
                >
                  ✕
                </button>
              </li>
            ))}
          </ul>
          <form onSubmit={addTask} className="flex gap-2">
            <input
              id="focus-new-task"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder={t('Ajouter une tâche…', 'Add a task…')}
              className="min-w-0 flex-1 rounded-full border border-line bg-bg px-4 py-2 text-sm outline-none focus:border-accent"
            />
            <button type="submit" className="rounded-full border border-line px-4 py-2 font-mono text-xs transition-colors hover:border-accent">
              {t('Ajouter', 'Add')}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
