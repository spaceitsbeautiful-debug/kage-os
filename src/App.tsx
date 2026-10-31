import { useCallback, useState } from 'react'
import Boot from './os/Boot'
import Desktop from './os/Desktop'
import { useSettings } from './os/settings'
import { WindowsProvider } from './os/store'

type Phase = 'boot' | 'desktop' | 'off'

function firstPhase(): Phase {
  try {
    return sessionStorage.getItem('kage-booted') === '1' ? 'desktop' : 'boot'
  } catch {
    return 'boot'
  }
}

export default function App() {
  const [phase, setPhase] = useState<Phase>(firstPhase)
  const { crt } = useSettings()

  const booted = useCallback(() => {
    try {
      sessionStorage.setItem('kage-booted', '1')
    } catch {
      /* ignore */
    }
    setPhase('desktop')
  }, [])

  return (
    <div className={`h-full ${crt ? 'crt crt-flicker' : ''}`}>
      {phase === 'boot' && <Boot onDone={booted} />}
      {phase === 'desktop' && (
        <WindowsProvider>
          <Desktop onShutdown={() => setPhase('off')} />
        </WindowsProvider>
      )}
      {phase === 'off' && (
        <button
          type="button"
          onClick={() => setPhase('boot')}
          className="fixed inset-0 grid place-content-center justify-items-center gap-4 bg-black font-mono text-sm text-muted"
        >
          <span className="font-display text-6xl font-extrabold text-accent/40">影</span>
          Tu peux éteindre ton ordinateur en toute sécurité.
          <span className="text-[11px]">(Clique pour redémarrer)</span>
        </button>
      )}
    </div>
  )
}
