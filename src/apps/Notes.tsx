import { useEffect, useState } from 'react'

// A plain notepad, saved in the browser as you type.

const DEFAULT = `Bienvenue dans Notes.

Tout ce que tu écris ici est gardé dans ton navigateur.

Idées :
- une room 3D pour le prochain portfolio
- ajouter une app météo à 影OS
`

export default function Notes() {
  const [text, setText] = useState(() => {
    try {
      return localStorage.getItem('kage-notes') ?? DEFAULT
    } catch {
      return DEFAULT
    }
  })
  const [saved, setSaved] = useState(true)

  useEffect(() => {
    setSaved(false)
    const id = setTimeout(() => {
      try {
        localStorage.setItem('kage-notes', text)
      } catch {
        /* not saved */
      }
      setSaved(true)
    }, 400)
    return () => clearTimeout(id)
  }, [text])

  const words = text.trim() ? text.trim().split(/\s+/).length : 0

  return (
    <div className="flex h-full flex-col">
      <textarea
        id="notes-text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        spellCheck={false}
        aria-label="Notes"
        className="scroll-thin min-h-0 flex-1 resize-none bg-transparent p-4 font-mono text-[13px] leading-relaxed text-fg outline-none"
      />
      <div className="flex justify-between border-t border-line px-4 py-2 font-mono text-[11px] text-muted">
        <span>
          {words} mot{words > 1 ? 's' : ''} · {text.length} caractères
        </span>
        <span>{saved ? 'Enregistré' : 'Enregistrement…'}</span>
      </div>
    </div>
  )
}
