import { motion } from 'framer-motion'
import { type ContentMode } from '../types'

type Props = {
  contentMode: ContentMode
  isEditorFocused: boolean
  modeAccentClass: string
}

const StudioHeader = ({ contentMode, isEditorFocused, modeAccentClass }: Props) => {
  return (
    <header
      className={`mb-6 rounded-3xl border p-6 backdrop-blur-xl transition-all duration-300 sm:p-8 ${
        isEditorFocused
          ? 'border-white/70 bg-white/76 dark:border-slate-700/70 dark:bg-slate-900/72'
          : 'border-white/55 bg-white/52 dark:border-slate-700/55 dark:bg-slate-900/52'
      }`}
    >
      <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">Writer Studio</p>
      <motion.h1
        key={contentMode}
        initial={{ opacity: 0.45, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="mt-3 text-4xl font-black tracking-tight text-slate-900 sm:text-5xl dark:text-slate-100"
      >
        {contentMode === 'POEM' ? 'Write your poem' : 'Write your story'}
      </motion.h1>
      <p className="mt-2 max-w-2xl text-base leading-7 text-slate-500 dark:text-slate-400">
        {contentMode === 'POEM'
          ? 'A focused space for verses, line breaks, and rhythm before you publish.'
          : 'A focused editorial workspace for drafting, revising, and publishing polished posts.'}
      </p>
      <div className={`mt-4 h-1.5 rounded-full bg-gradient-to-r ${modeAccentClass}`} />
    </header>
  )
}

export default StudioHeader
