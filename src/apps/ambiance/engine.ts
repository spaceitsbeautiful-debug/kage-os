// Cyberpunk ambience engine: every layer is synthesized live with the Web Audio API
// (noise, filters, oscillators, random events). No audio files.
// All layers go through one master gain into an AnalyserNode that feeds the visualizer.

export type LayerId = 'rain' | 'thunder' | 'wind' | 'city' | 'neon' | 'server' | 'keys'

export type LayerDef = { id: LayerId; label: string; kanji: string }

export const LAYERS: LayerDef[] = [
  { id: 'rain', label: 'Pluie', kanji: '雨' },
  { id: 'thunder', label: 'Orage', kanji: '雷' },
  { id: 'wind', label: 'Vent', kanji: '風' },
  { id: 'city', label: 'Ville la nuit', kanji: '街' },
  { id: 'neon', label: 'Néons', kanji: '光' },
  { id: 'server', label: 'Salle serveur', kanji: '機' },
  { id: 'keys', label: 'Clavier', kanji: '鍵' },
]

type Layer = { gain: GainNode; stop: () => void }

let ctx: AudioContext | null = null
let master: GainNode
let analyser: AnalyserNode
let noiseBuffer: AudioBuffer
let brownBuffer: AudioBuffer
const layers = new Map<LayerId, Layer>()
const volumes = new Map<LayerId, number>()

function init() {
  if (ctx) return ctx
  ctx = new AudioContext()
  master = ctx.createGain()
  master.gain.value = 0.8
  analyser = ctx.createAnalyser()
  analyser.fftSize = 2048
  analyser.smoothingTimeConstant = 0.82
  master.connect(analyser).connect(ctx.destination)

  // White noise, and a "brown" noise (deeper, smoother) for the city rumble
  const len = ctx.sampleRate * 3
  noiseBuffer = ctx.createBuffer(1, len, ctx.sampleRate)
  brownBuffer = ctx.createBuffer(1, len, ctx.sampleRate)
  const white = noiseBuffer.getChannelData(0)
  const brown = brownBuffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < len; i++) {
    white[i] = Math.random() * 2 - 1
    last = (last + 0.02 * white[i]) / 1.02
    brown[i] = last * 3.5
  }
  return ctx
}

export function getAnalyser() {
  return ctx ? analyser : null
}

function loopNoise(buffer: AudioBuffer) {
  const src = ctx!.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.start(0, Math.random() * 2)
  return src
}

/** Repeats `fn` at random intervals between min and max ms; returns a canceller. */
function every(min: number, max: number, fn: () => void) {
  let id = 0
  const tick = () => {
    fn()
    id = window.setTimeout(tick, min + Math.random() * (max - min))
  }
  id = window.setTimeout(tick, Math.random() * max)
  return () => clearTimeout(id)
}

/** A short burst of filtered noise (drops, clicks, thunder). */
function burst(out: AudioNode, type: BiquadFilterType, freq: number, q: number, peak: number, attack: number, decay: number) {
  const c = ctx!
  const t = c.currentTime
  const src = c.createBufferSource()
  src.buffer = noiseBuffer
  const f = c.createBiquadFilter()
  f.type = type
  f.frequency.value = freq
  f.Q.value = q
  const g = c.createGain()
  g.gain.setValueAtTime(0, t)
  g.gain.linearRampToValueAtTime(peak, t + attack)
  g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay)
  src.connect(f).connect(g).connect(out)
  src.start(t, Math.random() * 2)
  src.stop(t + attack + decay + 0.05)
}

function build(id: LayerId): Layer {
  const c = ctx!
  const gain = c.createGain()
  gain.gain.value = 0
  gain.connect(master)
  const stops: (() => void)[] = []
  const node = <T extends AudioScheduledSourceNode>(n: T) => {
    stops.push(() => n.stop())
    return n
  }

  switch (id) {
    case 'rain': {
      // Steady hiss + random drops
      const src = node(loopNoise(noiseBuffer))
      const hp = c.createBiquadFilter()
      hp.type = 'highpass'
      hp.frequency.value = 900
      const lp = c.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 7000
      const g = c.createGain()
      g.gain.value = 0.35
      src.connect(hp).connect(lp).connect(g).connect(gain)
      stops.push(every(15, 70, () => burst(gain, 'bandpass', 2500 + Math.random() * 4000, 8, 0.25, 0.002, 0.05)))
      break
    }
    case 'thunder': {
      // Rare low rumbles that roll in and fade out
      stops.push(
        every(9000, 22000, () => {
          burst(gain, 'lowpass', 120 + Math.random() * 120, 0.7, 1.6, 0.08 + Math.random() * 0.4, 3 + Math.random() * 3)
          burst(gain, 'lowpass', 900, 0.5, 0.5, 0.01, 0.6)
        }),
      )
      break
    }
    case 'wind': {
      // Noise through a band-pass whose frequency slowly sweeps
      const src = node(loopNoise(noiseBuffer))
      const bp = c.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 500
      bp.Q.value = 1.2
      const lfo = node(c.createOscillator())
      lfo.frequency.value = 0.08
      const depth = c.createGain()
      depth.gain.value = 350
      lfo.connect(depth).connect(bp.frequency)
      lfo.start()
      const g = c.createGain()
      g.gain.value = 0.5
      src.connect(bp).connect(g).connect(gain)
      break
    }
    case 'city': {
      // Deep rumble + cars passing by (noise sweeps)
      const src = node(loopNoise(brownBuffer))
      const lp = c.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 320
      const g = c.createGain()
      g.gain.value = 0.6
      src.connect(lp).connect(g).connect(gain)
      stops.push(
        every(2500, 7000, () => {
          const t = c.currentTime
          const car = c.createBufferSource()
          car.buffer = brownBuffer
          const f = c.createBiquadFilter()
          f.type = 'bandpass'
          f.Q.value = 2
          f.frequency.setValueAtTime(250, t)
          f.frequency.linearRampToValueAtTime(700, t + 1.2)
          f.frequency.linearRampToValueAtTime(220, t + 3)
          const cg = c.createGain()
          cg.gain.setValueAtTime(0, t)
          cg.gain.linearRampToValueAtTime(0.5, t + 1.3)
          cg.gain.linearRampToValueAtTime(0, t + 3)
          car.connect(f).connect(cg).connect(gain)
          car.start(t, Math.random() * 2)
          car.stop(t + 3.1)
        }),
      )
      break
    }
    case 'neon': {
      // Electric buzz with flickers
      const osc = node(c.createOscillator())
      osc.type = 'sawtooth'
      osc.frequency.value = 120
      const bp = c.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 1800
      bp.Q.value = 3
      const g = c.createGain()
      g.gain.value = 0.08
      osc.connect(bp).connect(g).connect(gain)
      osc.start()
      stops.push(
        every(800, 4000, () => {
          const t = c.currentTime
          g.gain.cancelScheduledValues(t)
          g.gain.setValueAtTime(0.08, t)
          g.gain.setValueAtTime(0.01, t + 0.04)
          g.gain.setValueAtTime(0.1, t + 0.09)
          g.gain.setValueAtTime(0.02, t + 0.12)
          g.gain.setValueAtTime(0.08, t + 0.2)
        }),
      )
      break
    }
    case 'server': {
      // Mains hum (60 Hz and harmonics) + fan noise slowly breathing
      for (const [f, v] of [[60, 0.18], [120, 0.1], [180, 0.04]] as const) {
        const o = node(c.createOscillator())
        o.frequency.value = f
        const og = c.createGain()
        og.gain.value = v
        o.connect(og).connect(gain)
        o.start()
      }
      const fan = node(loopNoise(noiseBuffer))
      const lp = c.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 450
      const fg = c.createGain()
      fg.gain.value = 0.35
      const lfo = node(c.createOscillator())
      lfo.frequency.value = 0.2
      const depth = c.createGain()
      depth.gain.value = 0.08
      lfo.connect(depth).connect(fg.gain)
      lfo.start()
      fan.connect(lp).connect(fg).connect(gain)
      break
    }
    case 'keys': {
      // Mechanical keyboard: bursts of typing with pauses
      let typing = 0
      stops.push(
        every(60, 190, () => {
          if (typing <= 0) {
            if (Math.random() < 0.08) typing = 8 + Math.floor(Math.random() * 30)
            return
          }
          typing--
          const heavy = Math.random() < 0.12 // space bar / enter
          burst(gain, 'highpass', heavy ? 1200 : 2500 + Math.random() * 1500, 1, heavy ? 0.5 : 0.35, 0.001, heavy ? 0.06 : 0.03)
          burst(gain, 'bandpass', 300, 4, heavy ? 0.25 : 0.12, 0.001, 0.04)
        }),
      )
      break
    }
  }
  return { gain, stop: () => stops.forEach((s) => s()) }
}

/** Sets a layer's volume (0..1); creates or tears down the layer as needed. */
export function setVolume(id: LayerId, v: number) {
  const c = init()
  if (c.state === 'suspended') void c.resume()
  volumes.set(id, v)
  let layer = layers.get(id)
  if (v > 0 && !layer) {
    layer = build(id)
    layers.set(id, layer)
  }
  if (!layer) return
  const t = c.currentTime
  layer.gain.gain.cancelScheduledValues(t)
  layer.gain.gain.setTargetAtTime(v, t, 0.15)
  if (v === 0) {
    const l = layer
    layers.delete(id)
    setTimeout(() => {
      l.stop()
      l.gain.disconnect()
    }, 1200)
  }
}

export function setMaster(v: number) {
  init()
  master.gain.setTargetAtTime(v, ctx!.currentTime, 0.1)
}

export function stopAll() {
  for (const id of [...layers.keys()]) setVolume(id, 0)
}

export const getVolume = (id: LayerId) => volumes.get(id) ?? 0
