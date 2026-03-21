import { type ContentMode } from '../types'

type Props = {
  contentMode: ContentMode
  readabilityScore: number | null
  readabilityLabel: string
  readabilityHint: string
  sentenceCount: number
  averageWordsPerSentence: number
  averageWordsPerLine: number
  longLineCount: number
  shortLineCount: number
  rhythmLabel: string
  poemHints: string[]
  rhythmBars: Array<{ line: number; words: number; density: 'short' | 'medium' | 'long' }>
  repeatedWords: Array<{ word: string; count: number }>
}

const WritingAidsSection = ({
  contentMode,
  readabilityScore,
  readabilityLabel,
  readabilityHint,
  sentenceCount,
  averageWordsPerSentence,
  averageWordsPerLine,
  longLineCount,
  shortLineCount,
  rhythmLabel,
  poemHints,
  rhythmBars,
  repeatedWords,
}: Props) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/92 p-4 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-950/92">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Writing Aids (AI-Free)</h2>

      {contentMode === 'BLOG' ? (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Readability score:</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {readabilityScore === null ? 'Need more text' : `${readabilityScore} / 100`}
            </span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {readabilityLabel}
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-300">{readabilityHint}</p>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Sentences: {sentenceCount}</span>
            <span>Avg sentence length: {averageWordsPerSentence.toFixed(1)} words</span>
          </div>
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2 text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">Rhythm:</span>
            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-200">
              {rhythmLabel}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500 dark:text-slate-400">
            <span>Avg line length: {averageWordsPerLine.toFixed(1)} words</span>
            <span>Long lines: {longLineCount}</span>
            <span>Short lines: {shortLineCount}</span>
          </div>
          <div className="space-y-1">
            {poemHints.map((hint) => (
              <p key={hint} className="text-sm text-slate-600 dark:text-slate-300">• {hint}</p>
            ))}
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Line rhythm map</p>
            <div className="mt-2 space-y-1.5">
              {rhythmBars.slice(0, 10).map((bar) => (
                <div key={`${bar.line}-${bar.words}`} className="flex items-center gap-2 text-xs">
                  <span className="w-10 text-slate-500 dark:text-slate-400">L{bar.line}</span>
                  <div className="h-2 flex-1 rounded-full bg-slate-200/80 dark:bg-slate-800">
                    <div
                      className={`h-2 rounded-full ${
                        bar.density === 'long'
                          ? 'bg-rose-400 dark:bg-rose-500'
                          : bar.density === 'medium'
                            ? 'bg-amber-400 dark:bg-amber-500'
                            : 'bg-emerald-400 dark:bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(8, bar.words * 8))}%` }}
                    />
                  </div>
                  <span className="w-14 text-right text-slate-500 dark:text-slate-400">{bar.words} w</span>
                </div>
              ))}
              {rhythmBars.length === 0 && (
                <p className="text-xs text-slate-500 dark:text-slate-400">Add more lines to visualize rhythm.</p>
              )}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/90 p-3 dark:border-slate-800 dark:bg-slate-900/80">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Repetition highlights</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {repeatedWords.length > 0 ? (
                repeatedWords.map((item) => (
                  <span
                    key={item.word}
                    className="rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                  >
                    {item.word} ×{item.count}
                  </span>
                ))
              ) : (
                <p className="text-xs text-slate-500 dark:text-slate-400">No strong repetition yet.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}

export default WritingAidsSection
