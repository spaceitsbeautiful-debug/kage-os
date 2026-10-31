import { setSettings, useSettings, type Accent } from '../os/settings'

const ACCENTS: { id: Accent; label: string; color: string }[] = [
  { id: 'lavender', label: 'Lavande', color: '#c4b5e8' },
  { id: 'cyan', label: 'Cyan', color: '#7ee7ff' },
  { id: 'crimson', label: 'Carmin', color: '#ff6b86' },
  { id: 'lime', label: 'Lime', color: '#b6f36b' },
]

export default function Settings() {
  const { crt, accent } = useSettings()
  return (
    <div className="grid content-start gap-6 p-5">
      <section className="grid gap-3">
        <h2 className="m-0 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-muted">Couleur d’accent</h2>
        <div role="radiogroup" aria-label="Couleur d’accent" className="grid grid-cols-2 gap-2">
          {ACCENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              role="radio"
              aria-checked={accent === a.id}
              onClick={() => setSettings({ accent: a.id })}
              className={`flex items-center gap-3 rounded-[10px] border px-3 py-2.5 text-left transition-colors ${accent === a.id ? 'border-accent bg-accent/10' : 'border-line hover:border-muted'}`}
            >
              <span className="size-5 rounded-full" style={{ background: a.color, boxShadow: `0 0 12px ${a.color}` }} />
              {a.label}
            </button>
          ))}
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="m-0 font-mono text-[11px] font-normal uppercase tracking-[0.14em] text-muted">Écran</h2>
        <button
          type="button"
          role="switch"
          aria-checked={crt}
          onClick={() => setSettings({ crt: !crt })}
          className="flex items-center justify-between gap-4 rounded-[10px] border border-line px-4 py-3 text-left"
        >
          <span className="grid">
            <span>Effet écran cathodique (CRT)</span>
            <span className="font-mono text-[11px] text-muted">Lignes de balayage, vignettage et léger scintillement</span>
          </span>
          <span className={`relative h-6 w-11 flex-none rounded-full transition-colors ${crt ? 'bg-accent' : 'bg-line'}`}>
            <span className={`absolute top-1 size-4 rounded-full bg-fg transition-[left] ${crt ? 'left-6' : 'left-1'}`} />
          </span>
        </button>
      </section>

      <p className="m-0 font-mono text-[11px] text-muted">Astuce : ces réglages marchent aussi depuis le Terminal (theme cyan, crt off).</p>
    </div>
  )
}
