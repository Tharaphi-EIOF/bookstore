import { motion } from 'framer-motion'
import { type ContentMode } from '../types'

type Props = {
  wordCount: number
  readingMinutes: number
  contentMode: ContentMode
  writerFontLabel: string
  lineCount: number
  stanzaCount: number
  longestLine: number
  autoSaveState: 'idle' | 'saving' | 'saved'
  saveStamp: Date | null
}

const EditorInsightsBar = ({
  wordCount,
  readingMinutes,
  contentMode,
  writerFontLabel,
  lineCount,
  stanzaCount,
  longestLine,
  autoSaveState,
  saveStamp,
}: Props) => {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 rounded-2xl border border-white/60 bg-white/45 px-4 py-3 text-xs font-medium text-slate-500 shadow-[0_16px_40px_-40px_rgba(15,23,42,0.6)] backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-900/45 dark:text-slate-400">
      <motion.span key={wordCount} initial={{ scale: 0.95, opacity: 0.7 }} animate={{ scale: 1, opacity: 1 }}>
        {wordCount} words
      </motion.span>
      <span>{readingMinutes} min read</span>
      <span>{contentMode === 'POEM' ? 'Poem mode' : 'Blog mode'}</span>
      <span>{writerFontLabel} font</span>
      {contentMode === 'POEM' && (
        <>
          <span>{lineCount} lines</span>
          <span>{stanzaCount} stanzas</span>
          <span>Longest line: {longestLine} chars</span>
        </>
      )}
      <span className="inline-flex items-center gap-2">
        <span className={`h-2 w-2 rounded-full ${autoSaveState === 'saving' ? 'animate-pulse bg-amber-500' : 'bg-emerald-500'}`} />
        {saveStamp ? `Saved ${saveStamp.toLocaleTimeString()}` : 'Not saved yet'}
      </span>
    </div>
  )
}

export default EditorInsightsBar
