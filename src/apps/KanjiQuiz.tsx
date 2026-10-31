import { useCallback, useEffect, useState } from 'react'

// Multiple-choice kanji quiz. The pool grows with your score, you have 3 lives,
// and the best score is kept in the browser. Keys 1 to 4 answer too.

type Kanji = { k: string; r: string; fr: string; en: string }

// Common kanji (mostly JLPT N5), in rough order of difficulty
const KANJI: Kanji[] = [
  { k: '日', r: 'hi · nichi', fr: 'soleil, jour', en: 'sun, day' },
  { k: '月', r: 'tsuki · getsu', fr: 'lune, mois', en: 'moon, month' },
  { k: '火', r: 'hi · ka', fr: 'feu', en: 'fire' },
  { k: '水', r: 'mizu · sui', fr: 'eau', en: 'water' },
  { k: '木', r: 'ki · moku', fr: 'arbre', en: 'tree' },
  { k: '山', r: 'yama · san', fr: 'montagne', en: 'mountain' },
  { k: '川', r: 'kawa · sen', fr: 'rivière', en: 'river' },
  { k: '人', r: 'hito · jin', fr: 'personne', en: 'person' },
  { k: '口', r: 'kuchi · kō', fr: 'bouche', en: 'mouth' },
  { k: '目', r: 'me · moku', fr: 'œil', en: 'eye' },
  { k: '手', r: 'te · shu', fr: 'main', en: 'hand' },
  { k: '大', r: 'ō · dai', fr: 'grand', en: 'big' },
  { k: '小', r: 'chii · shō', fr: 'petit', en: 'small' },
  { k: '上', r: 'ue · jō', fr: 'dessus, monter', en: 'above, up' },
  { k: '下', r: 'shita · ka', fr: 'dessous, descendre', en: 'below, down' },
  { k: '中', r: 'naka · chū', fr: 'milieu, dedans', en: 'middle, inside' },
  { k: '花', r: 'hana · ka', fr: 'fleur', en: 'flower' },
  { k: '雨', r: 'ame · u', fr: 'pluie', en: 'rain' },
  { k: '空', r: 'sora · kū', fr: 'ciel, vide', en: 'sky, empty' },
  { k: '白', r: 'shiro · haku', fr: 'blanc', en: 'white' },
  { k: '赤', r: 'aka · seki', fr: 'rouge', en: 'red' },
  { k: '青', r: 'ao · sei', fr: 'bleu', en: 'blue' },
  { k: '黒', r: 'kuro · koku', fr: 'noir', en: 'black' },
  { k: '心', r: 'kokoro · shin', fr: 'cœur, esprit', en: 'heart, mind' },
  { k: '力', r: 'chikara · ryoku', fr: 'force', en: 'strength' },
  { k: '名', r: 'na · mei', fr: 'nom', en: 'name' },
  { k: '学', r: 'mana · gaku', fr: 'étudier', en: 'study' },
  { k: '生', r: 'i · sei', fr: 'vie, naître', en: 'life, birth' },
  { k: '車', r: 'kuruma · sha', fr: 'voiture', en: 'car' },
  { k: '電', r: 'den', fr: 'électricité', en: 'electricity' },
  { k: '食', r: 'ta · shoku', fr: 'manger', en: 'eat' },
  { k: '見', r: 'mi · ken', fr: 'voir', en: 'see' },
  { k: '行', r: 'i · kō', fr: 'aller', en: 'go' },
  { k: '来', r: 'ku · rai', fr: 'venir', en: 'come' },
  { k: '話', r: 'hana · wa', fr: 'parler', en: 'talk' },
  { k: '書', r: 'ka · sho', fr: 'écrire', en: 'write' },
  { k: '読', r: 'yo · doku', fr: 'lire', en: 'read' },
  { k: '夢', r: 'yume · mu', fr: 'rêve', en: 'dream' },
  { k: '影', r: 'kage · ei', fr: 'ombre', en: 'shadow' },
  { k: '炎', r: 'honō · en', fr: 'flamme', en: 'flame' },
  { k: '創', r: 'tsuku · sō', fr: 'créer', en: 'create' },
  { k: '光', r: 'hikari · kō', fr: 'lumière', en: 'light' },
]

type Direction = 'kanji' | 'meaning' // what is shown: the kanji, or its meaning
type Question = { answer: Kanji; options: Kanji[] }

function shuffle<T>(a: T[]) {
  const b = [...a]
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[b[i], b[j]] = [b[j], b[i]]
  }
  return b
}

function makeQuestion(score: number, previous?: Kanji): Question {
  const level = 1 + Math.floor(score / 5)
  const pool = KANJI.slice(0, Math.min(KANJI.length, 10 + level * 6))
  let answer = pool[Math.floor(Math.random() * pool.length)]
  if (previous && answer.k === previous.k) answer = pool[(pool.indexOf(answer) + 1) % pool.length]
  const others = shuffle(pool.filter((x) => x.k !== answer.k)).slice(0, 3)
  return { answer, options: shuffle([answer, ...others]) }
}

function readBest() {
  try {
    return Number(localStorage.getItem('kanji-best')) || 0
  } catch {
    return 0
  }
}

export default function KanjiQuiz() {
  const t = <T,>(fr: T, _en: T): T => fr
  const [direction, setDirection] = useState<Direction>('kanji')
  const [phase, setPhase] = useState<'ready' | 'play' | 'over'>('ready')
  const [q, setQ] = useState<Question>(() => makeQuestion(0))
  const [score, setScore] = useState(0)
  const [streak, setStreak] = useState(0)
  const [lives, setLives] = useState(3)
  const [best, setBest] = useState(readBest)
  const [picked, setPicked] = useState<string | null>(null)

  const meaning = (x: Kanji) => t(x.fr, x.en)

  const start = () => {
    setScore(0)
    setStreak(0)
    setLives(3)
    setPicked(null)
    setQ(makeQuestion(0))
    setPhase('play')
  }

  const answer = useCallback(
    (choice: Kanji) => {
      if (picked || phase !== 'play') return
      setPicked(choice.k)
      const right = choice.k === q.answer.k
      const nextScore = right ? score + 1 : score
      const nextLives = right ? lives : lives - 1
      if (right) {
        setScore(nextScore)
        setStreak((s) => s + 1)
      } else {
        setLives(nextLives)
        setStreak(0)
      }
      setTimeout(() => {
        setPicked(null)
        if (nextLives <= 0) {
          setPhase('over')
          if (nextScore > best) {
            setBest(nextScore)
            try {
              localStorage.setItem('kanji-best', String(nextScore))
            } catch {
              /* not saved */
            }
          }
        } else setQ(makeQuestion(nextScore, q.answer))
      }, right ? 550 : 1100)
    },
    [picked, phase, q, score, lives, best],
  )

  // Keys 1 to 4 pick an option
  useEffect(() => {
    if (phase !== 'play') return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea')) return
      const i = Number(e.key) - 1
      if (i >= 0 && i < 4) answer(q.options[i])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase, q, answer])

  const level = 1 + Math.floor(score / 5)

  return (
    <div className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3 font-mono text-xs">
        <div role="group" aria-label={t('Sens du quiz', 'Quiz direction')} className="flex gap-1.5">
          {(
            [
              ['kanji', t('Kanji → sens', 'Kanji → meaning')],
              ['meaning', t('Sens → kanji', 'Meaning → kanji')],
            ] as const
          ).map(([d, label]) => (
            <button
              key={d}
              type="button"
              aria-pressed={direction === d}
              onClick={() => setDirection(d)}
              className={`rounded-full border px-3 py-1 transition-colors ${direction === d ? 'border-accent bg-accent text-bg' : 'border-line hover:border-accent'}`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="flex gap-4 tabular-nums">
          <span>
            <span className="text-muted">Score </span>
            {score}
          </span>
          <span>
            <span className="text-muted">{t('Série', 'Streak')} </span>
            {streak}
          </span>
          <span>
            <span className="text-muted">{t('Niveau', 'Level')} </span>
            {level}
          </span>
          <span aria-label={t(`${lives} vies`, `${lives} lives`)}>{'♥'.repeat(lives) + '♡'.repeat(3 - lives)}</span>
          <span>
            <span className="text-muted">Record </span>
            {best}
          </span>
        </div>
      </div>

      <div className="relative grid min-h-[340px] place-items-center rounded-[16px] border border-line bg-bg p-[clamp(18px,3vw,32px)]">
        {phase === 'play' ? (
          <div className="grid w-full max-w-[520px] justify-items-center gap-6">
            <div className="grid justify-items-center gap-1 text-center" aria-live="polite">
              {direction === 'kanji' ? (
                <span lang="ja" className="font-display text-[clamp(84px,14vw,140px)] leading-none font-bold">
                  {q.answer.k}
                </span>
              ) : (
                <span className="font-display text-[clamp(30px,5vw,48px)] leading-tight font-bold">{meaning(q.answer)}</span>
              )}
              <span className={`font-mono text-xs text-muted transition-opacity ${picked ? 'opacity-100' : 'opacity-0'}`}>
                {q.answer.k} · {q.answer.r} · {meaning(q.answer)}
              </span>
            </div>
            <div className="grid w-full grid-cols-2 gap-2.5">
              {q.options.map((o, i) => {
                const isAnswer = o.k === q.answer.k
                const state = picked ? (isAnswer ? 'right' : picked === o.k ? 'wrong' : 'idle') : 'idle'
                return (
                  <button
                    key={o.k}
                    type="button"
                    onClick={() => answer(o)}
                    className={`flex items-center gap-3 rounded-[12px] border px-4 py-3 text-left transition-colors ${
                      state === 'right'
                        ? 'border-accent bg-accent text-bg'
                        : state === 'wrong'
                          ? 'border-bad bg-bad/15 text-bad'
                          : 'border-line bg-panel hover:border-accent'
                    }`}
                  >
                    <span className="font-mono text-[11px] opacity-60">{i + 1}</span>
                    {direction === 'kanji' ? (
                      <span className="text-[15px]">{meaning(o)}</span>
                    ) : (
                      <span lang="ja" className="font-display text-3xl font-bold">
                        {o.k}
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="grid justify-items-center gap-4 text-center">
            <span lang="ja" className="font-display text-7xl font-bold text-accent">
              {phase === 'over' ? '終' : '漢字'}
            </span>
            {phase === 'over' ? (
              <p className="m-0 max-w-[30em] text-muted">
                {t(`Partie terminée : ${score} bonne${score > 1 ? 's' : ''} réponse${score > 1 ? 's' : ''}.`, `Game over: ${score} correct answer${score === 1 ? '' : 's'}.`)}{' '}
                {score >= best && score > 0 ? t('Nouveau record !', 'New record!') : ''}
              </p>
            ) : (
              <p className="m-0 max-w-[30em] text-muted">
                {t(
                  `${KANJI.length} kanji courants, 3 vies. Plus ton score monte, plus de nouveaux kanji apparaissent. Les touches 1 à 4 marchent aussi.`,
                  `${KANJI.length} common kanji, 3 lives. The higher your score, the more new kanji show up. Keys 1 to 4 work too.`,
                )}
              </p>
            )}
            <button type="button" onClick={start} className="rounded-full bg-accent px-6 py-2.5 font-mono text-sm text-bg transition-transform hover:-translate-y-px">
              {phase === 'over' ? t('Rejouer', 'Play again') : t('Commencer', 'Start')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
