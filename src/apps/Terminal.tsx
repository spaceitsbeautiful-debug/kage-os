import { useEffect, useRef, useState, type ReactNode } from 'react'
import { apps, type AppId } from '../os/apps'
import { resolve } from '../os/fs'
import { WALLPAPERS, setSettings, useSettings, type Accent } from '../os/settings'
import { useWindows } from '../os/store'

// A small shell: real commands that drive the OS (open apps, change the theme...)
// plus a few easter eggs. History with ↑ / ↓, Tab completes command names.

type Line = { kind: 'in' | 'out' | 'err'; text: ReactNode }

const COMMANDS = ['help', 'about', 'apps', 'open', 'ls', 'cat', 'clear', 'date', 'whoami', 'neofetch', 'echo', 'theme', 'wallpaper', 'crt', 'history', 'kage', 'sudo', 'exit']

export default function Terminal() {
  const { open, wins, close } = useWindows()
  const settings = useSettings()
  const [lines, setLines] = useState<Line[]>([
    { kind: 'out', text: '影OS · Terminal v1.0' },
    { kind: 'out', text: 'Tape « help » pour la liste des commandes.' },
  ])
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([])
  const [cursor, setCursor] = useState(-1)
  const end = useRef<HTMLDivElement>(null)
  const field = useRef<HTMLInputElement>(null)

  // Braces matter: recent browsers return a Promise from scrollIntoView, and an effect must not return one
  useEffect(() => {
    end.current?.scrollIntoView({ block: 'end' })
  }, [lines])

  const print = (...out: Line[]) => setLines((l) => [...l, ...out])
  const out = (text: ReactNode): Line => ({ kind: 'out', text })
  const err = (text: ReactNode): Line => ({ kind: 'err', text })

  const run = (raw: string) => {
    const cmd = raw.trim()
    print({ kind: 'in', text: cmd })
    if (!cmd) return
    setHistory((h) => [...h, cmd])
    const [name, ...args] = cmd.split(/\s+/)
    const arg = args.join(' ')

    switch (name.toLowerCase()) {
      case 'help':
        print(
          out(
            <span className="grid grid-cols-[110px_1fr] gap-x-4">
              {[
                ['help', 'cette aide'],
                ['about', 'qui a fait ce système'],
                ['apps', 'liste des applications'],
                ['open <app>', 'ouvrir une application (ex. open ambiance)'],
                ['ls [dossier]', 'lister un dossier (Documents, Images…)'],
                ['cat <fichier>', 'lire un fichier (ex. cat todo.txt)'],
                ['wallpaper <nom>', 'nuit, synthwave, pluie, minimal'],
                ['theme <couleur>', 'lavender, cyan, crimson, lime'],
                ['crt on|off', 'effet écran cathodique'],
                ['neofetch', 'infos système'],
                ['date, whoami', 'la date, toi'],
                ['clear', 'effacer l’écran'],
              ].map(([c, d]) => (
                <span key={c} className="contents">
                  <span className="text-accent">{c}</span>
                  <span className="text-muted">{d}</span>
                </span>
              ))}
            </span>,
          ),
          out(<span className="text-muted">Il y a aussi quelques commandes cachées…</span>),
        )
        break
      case 'about':
        print(out('影OS a été conçu et développé par Gounteni David, développeur full-stack.'), out('React · TypeScript · Tailwind · Framer Motion · Web Audio API · Canvas'))
        break
      case 'apps':
        print(...(Object.keys(apps) as AppId[]).map((id) => out(`${id.padEnd(10)} ${apps[id].kanji}  ${apps[id].hint}`)))
        break
      case 'open': {
        const id = arg.toLowerCase() as AppId
        if (id in apps) {
          open(id)
          print(out(`Ouverture de ${apps[id].title}…`))
        } else print(err(`Application inconnue : « ${arg} ». Tape « apps » pour la liste.`))
        break
      }
      case 'ls': {
        const node = resolve(arg ? arg.split('/').filter(Boolean) : [])
        if (node?.kind === 'folder') print(out(node.children.map((c) => (c.kind === 'folder' ? c.name + '/' : c.name)).join('    ')))
        else print(err(`ls : ${arg} : dossier introuvable`))
        break
      }
      case 'cat': {
        // A bare file name is looked up in Documents
        const parts = arg.split('/').filter(Boolean)
        const node = resolve(parts) ?? resolve(['Documents', ...parts])
        if (node?.kind === 'text') print(...node.content().split('\n').map((l) => out(l)))
        else print(err(`cat : ${arg || '?'} : fichier introuvable`))
        break
      }
      case 'wallpaper': {
        const w = WALLPAPERS.find((x) => x.id === arg.toLowerCase())
        if (w) {
          setSettings({ wallpaper: w.id })
          print(out(`Fond d’écran : ${w.label}`))
        } else print(err(`Fonds possibles : ${WALLPAPERS.map((x) => x.id).join(', ')}`))
        break
      }
      case 'clear':
        setLines([])
        break
      case 'date':
        print(out(new Date().toLocaleString('fr-FR', { dateStyle: 'full', timeStyle: 'medium' })))
        break
      case 'whoami':
        print(out('visiteur — mais bienvenue chez toi.'))
        break
      case 'echo':
        print(out(arg))
        break
      case 'history':
        print(...history.map((h, i) => out(`${String(i + 1).padStart(3)}  ${h}`)))
        break
      case 'theme': {
        const accents: Accent[] = ['lavender', 'cyan', 'crimson', 'lime']
        if (accents.includes(arg as Accent)) {
          setSettings({ accent: arg as Accent })
          print(out(`Couleur d’accent : ${arg}`))
        } else print(err(`Couleurs possibles : ${accents.join(', ')}`))
        break
      }
      case 'crt':
        if (arg === 'on' || arg === 'off') {
          setSettings({ crt: arg === 'on' })
          print(out(`Effet CRT ${arg === 'on' ? 'activé' : 'désactivé'}.`))
        } else print(err('Usage : crt on | crt off'))
        break
      case 'neofetch':
        print(
          out(
            <span className="flex gap-6">
              <span className="font-display text-6xl leading-none font-extrabold text-accent">影</span>
              <span className="grid">
                <span>
                  <span className="text-accent">visiteur</span>@<span className="text-accent">kage-os</span>
                </span>
                <span className="text-muted">-----------------</span>
                <span>OS : 影OS 1.0 (navigateur)</span>
                <span>Noyau : React 19</span>
                <span>Shell : kage-sh</span>
                <span>Fenêtres ouvertes : {wins.length}</span>
                <span>Thème : {settings.accent} · CRT {settings.crt ? 'on' : 'off'}</span>
                <span>Auteur : Gounteni David</span>
              </span>
            </span>,
          ),
        )
        break
      case 'kage':
        print(out(<span className="font-display text-2xl text-accent">影 — l’ombre suit toujours la lumière.</span>))
        break
      case 'sudo':
        print(err('Bien essayé. Ici, c’est l’ombre qui décide.'))
        break
      case 'rm':
        print(err(arg.includes('-rf') ? 'Non. Juste non. 影OS tient à ses fichiers.' : 'rm : opération refusée.'))
        break
      case 'exit': {
        const me = wins.find((w) => w.app === 'terminal')
        if (me) close(me.id)
        break
      }
      default:
        print(err(`${name} : commande introuvable. Tape « help ».`))
    }
  }

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      run(input)
      setInput('')
      setCursor(-1)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      if (!history.length) return
      const c = cursor < 0 ? history.length - 1 : Math.max(0, cursor - 1)
      setCursor(c)
      setInput(history[c])
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      if (cursor < 0) return
      const c = cursor + 1
      if (c >= history.length) {
        setCursor(-1)
        setInput('')
      } else {
        setCursor(c)
        setInput(history[c])
      }
    } else if (e.key === 'Tab') {
      e.preventDefault()
      const match = COMMANDS.filter((c) => c.startsWith(input.toLowerCase()))
      if (match.length === 1) setInput(match[0] + ' ')
      else if (match.length > 1) print(out(match.join('    ')))
    }
  }

  return (
    <div className="min-h-full bg-black/60 p-4 font-mono text-[13px] leading-relaxed" onClick={() => field.current?.focus()}>
      {lines.map((l, i) => (
        <div key={i} className={l.kind === 'err' ? 'text-bad' : l.kind === 'in' ? 'text-fg' : 'text-fg/85'}>
          {l.kind === 'in' && <span className="text-neon">visiteur@kage-os:~$ </span>}
          {l.text}
        </div>
      ))}
      <div className="flex items-center">
        <span className="text-neon">visiteur@kage-os:~$&nbsp;</span>
        <input
          ref={field}
          id="terminal-input"
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKey}
          spellCheck={false}
          autoComplete="off"
          aria-label="Commande"
          className="min-w-0 flex-1 bg-transparent text-fg caret-accent outline-none"
        />
      </div>
      <div ref={end} />
    </div>
  )
}
