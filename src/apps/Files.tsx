import { useState } from 'react'
import { apps } from '../os/apps'
import { resolve, root, type FileNode } from '../os/fs'
import { useWindows } from '../os/store'

// File manager: folders on the left, contents in the middle, a preview of the selected file on the right.
// Double-click opens a folder, launches an app, or shows a text / image.

const ICON: Record<FileNode['kind'], string> = { folder: '▤', text: '文', image: '画', app: '◈' }

export default function Files() {
  const { open } = useWindows()
  const [path, setPath] = useState<string[]>(['Documents'])
  const [selected, setSelected] = useState<FileNode | null>(null)
  const folder = resolve(path)
  const items = folder && folder.kind === 'folder' ? folder.children : []

  const activate = (n: FileNode) => {
    if (n.kind === 'folder') {
      setPath([...path, n.name])
      setSelected(null)
    } else if (n.kind === 'app') open(n.app)
    else setSelected(n)
  }

  return (
    <div className="grid h-full grid-cols-1 sm:grid-cols-[150px_minmax(0,1fr)] md:grid-cols-[150px_minmax(0,1fr)_minmax(0,1fr)]">
      {/* Sidebar */}
      <nav aria-label="Dossiers" className="hidden border-r border-line p-2 sm:grid sm:content-start sm:gap-0.5">
        {root.kind === 'folder' &&
          root.children
            .filter((c) => c.kind === 'folder')
            .map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => {
                  setPath([c.name])
                  setSelected(null)
                }}
                className={`flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] ${path[0] === c.name ? 'bg-accent/15 text-accent' : 'hover:bg-line'}`}
              >
                <span className="font-mono text-xs">{ICON.folder}</span>
                {c.name}
              </button>
            ))}
      </nav>

      {/* Folder contents */}
      <div className="flex min-w-0 flex-col">
        <div className="flex items-center gap-1 border-b border-line px-3 py-2 font-mono text-[12px] text-muted">
          <button type="button" disabled={!path.length} onClick={() => setPath(path.slice(0, -1))} aria-label="Dossier parent" className="rounded px-1.5 enabled:hover:bg-line disabled:opacity-30">
            ←
          </button>
          <button type="button" onClick={() => setPath([])} className="hover:text-fg">
            影
          </button>
          {path.map((p, i) => (
            <span key={i} className="flex items-center gap-1">
              /
              <button type="button" onClick={() => setPath(path.slice(0, i + 1))} className="hover:text-fg">
                {p}
              </button>
            </span>
          ))}
        </div>
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(92px,1fr))] content-start gap-1 p-3">
          {items.map((n) => (
            <li key={n.name}>
              <button
                type="button"
                onClick={() => (n.kind === 'folder' || n.kind === 'app' ? setSelected(null) : setSelected(n))}
                onDoubleClick={() => activate(n)}
                onKeyDown={(e) => e.key === 'Enter' && activate(n)}
                className={`grid w-full justify-items-center gap-1 rounded-[8px] p-2 text-center ${selected === n ? 'bg-accent/15 ring-1 ring-accent/40' : 'hover:bg-line/60'}`}
              >
                <span className={`grid size-11 place-items-center rounded-[10px] border border-line bg-bg font-display text-xl ${n.kind === 'app' ? 'text-neon' : 'text-accent'}`}>
                  {n.kind === 'app' ? apps[n.app].kanji : ICON[n.kind]}
                </span>
                <span className="w-full truncate text-[12px]">{n.name}</span>
              </button>
            </li>
          ))}
        </ul>
        <p className="m-0 mt-auto border-t border-line px-3 py-1.5 font-mono text-[11px] text-muted">
          {items.length} élément{items.length > 1 ? 's' : ''} · double-clic pour ouvrir
        </p>
      </div>

      {/* Preview */}
      <aside className={`${selected ? 'block' : 'hidden'} border-t border-line md:block md:border-t-0 md:border-l`}>
        {selected?.kind === 'text' ? (
          <div className="grid gap-2 p-4">
            <span className="font-mono text-[11px] text-muted">{selected.name}</span>
            <pre className="m-0 font-mono text-[12.5px] leading-relaxed whitespace-pre-wrap text-fg/90">{selected.content()}</pre>
          </div>
        ) : selected?.kind === 'image' ? (
          <div className="grid gap-2 p-4">
            <span className="font-mono text-[11px] text-muted">{selected.name}</span>
            <img src={selected.src} alt={selected.name} className="w-full rounded-[8px] border border-line" />
          </div>
        ) : (
          <p className="m-0 grid h-full place-items-center p-6 text-center font-mono text-[12px] text-muted">Sélectionne un fichier pour l’aperçu</p>
        )}
      </aside>
    </div>
  )
}
