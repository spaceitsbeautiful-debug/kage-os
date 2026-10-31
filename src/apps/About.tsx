import { useWindows } from '../os/store'

export default function About() {
  const { open } = useWindows()
  return (
    <div className="grid content-start justify-items-center gap-4 p-6 text-center">
      <span className="font-display text-7xl leading-none font-extrabold text-accent drop-shadow-[0_0_24px_var(--accent)]">影</span>
      <div className="grid gap-1">
        <span className="text-xl font-bold">影OS</span>
        <span className="font-mono text-[12px] text-muted">Version 1.0 · 2026</span>
      </div>
      <p className="m-0 max-w-[34em] text-[14px] text-fg/85">
        Un système d’exploitation rétro-futuriste qui tourne entièrement dans le navigateur : des fenêtres, un terminal, un générateur
        d’ambiance cyberpunk et des mini-jeux. Rien à installer.
      </p>
      <dl className="m-0 grid w-full max-w-[340px] gap-2 text-left font-mono text-[12px]">
        {[
          ['Conçu par', 'Gounteni David'],
          ['Interface', 'React · TypeScript · Tailwind'],
          ['Animations', 'Framer Motion'],
          ['Son', 'Web Audio API (100 % synthétisé)'],
          ['Graphismes', 'Canvas 2D'],
        ].map(([k, v]) => (
          <div key={k} className="flex justify-between gap-4 border-b border-line pb-1.5">
            <dt className="text-muted">{k}</dt>
            <dd className="m-0 text-right">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="flex flex-wrap justify-center gap-2 font-mono text-[12px]">
        <button type="button" onClick={() => open('terminal')} className="rounded-full border border-line px-4 py-1.5 hover:border-accent">
          Ouvrir le Terminal
        </button>
        <a href="https://gounteni.vercel.app" target="_blank" rel="noopener" className="rounded-full bg-accent px-4 py-1.5 text-bg">
          Mon portfolio ↗
        </a>
      </div>
      <p className="m-0 font-mono text-[11px] text-muted">© 2026 Gounteni David · Tous droits réservés</p>
    </div>
  )
}
