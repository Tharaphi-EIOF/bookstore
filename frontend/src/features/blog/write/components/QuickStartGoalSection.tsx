import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'
import { type ContentMode, type QuickSeed } from '../types'

type Props = {
  contentMode: ContentMode
  quickSeeds: QuickSeed[]
  goalProgress: number
  writingGoal: number
  onApplyQuickSeed: (seed: QuickSeed) => void
  onWritingGoalChange: (value: number) => void
}

const QuickStartGoalSection = ({
  contentMode,
  quickSeeds,
  goalProgress,
  writingGoal,
  onApplyQuickSeed,
  onWritingGoalChange,
}: Props) => {
  return (
    <section className="grid gap-4 lg:grid-cols-[1.1fr,0.9fr]">
      <div className="rounded-2xl border border-slate-200 bg-white/88 p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950/88">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Quick Start</h2>
          <span className="text-xs text-slate-500 dark:text-slate-400">{contentMode === 'POEM' ? 'Poetry prompts' : 'Editorial prompts'}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {quickSeeds.map((seed) => (
            <button
              key={seed.label}
              type="button"
              onClick={() => onApplyQuickSeed(seed)}
              className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
            >
              <span className="inline-flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                {seed.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white/88 p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950/88">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Writing Goal</h2>
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-300">{goalProgress}%</span>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-slate-800">
          <motion.div
            className={`h-full rounded-full ${contentMode === 'POEM' ? 'bg-gradient-to-r from-rose-500 to-amber-400' : 'bg-gradient-to-r from-cyan-500 to-blue-500'}`}
            animate={{ width: `${goalProgress}%` }}
            transition={{ type: 'spring', stiffness: 120, damping: 24 }}
          />
        </div>
        <div className="mt-3 flex items-center gap-2">
          <input
            type="number"
            min={contentMode === 'POEM' ? 50 : 200}
            max={5000}
            step={50}
            value={writingGoal}
            onChange={(event) => onWritingGoalChange(Math.max(1, Number(event.target.value) || 1))}
            className="w-28 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">Target words</p>
        </div>
      </div>
    </section>
  )
}

export default QuickStartGoalSection
