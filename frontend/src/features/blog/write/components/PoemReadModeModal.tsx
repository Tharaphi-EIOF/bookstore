import { motion } from 'framer-motion'

type PoemReadModeModalProps = {
  pageClassName: string
  poemLines: string[]
  subtitle: string
  title: string
  onClose: () => void
}

const PoemReadModeModal = ({
  pageClassName,
  poemLines,
  subtitle,
  title,
  onClose,
}: PoemReadModeModalProps) => {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/65 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 14, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`max-h-[88vh] w-full max-w-4xl overflow-y-auto rounded-[2rem] border border-white/45 shadow-[0_40px_90px_-50px_rgba(0,0,0,0.7)] ${pageClassName}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-current/10 px-6 py-4 sm:px-8">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] opacity-60">Poem preview</p>
            <p className="mt-1 truncate text-sm opacity-75">{title.trim() || 'Untitled Poem'}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-current/30 px-3 py-1.5 text-xs font-semibold opacity-80 transition hover:opacity-100"
          >
            Close
          </button>
        </div>
        <div className="px-6 py-8 sm:px-8 sm:py-10">
          <div className="mx-auto max-w-2xl">
            <header className="mb-10 text-center">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] opacity-55">Read mode</p>
              <h3 className="mt-4 text-3xl font-semibold sm:text-4xl">{title.trim() || 'Untitled Poem'}</h3>
              {subtitle.trim() && <p className="mt-3 text-sm opacity-75 sm:text-base">{subtitle.trim()}</p>}
            </header>
            <div className="space-y-1 text-lg leading-9 tracking-[0.01em]">
              {poemLines.map((line, idx) => (
                <p key={`${idx}-${line}`} className={line.trim() ? '' : 'h-8'}>
                  {line || '\u00A0'}
                </p>
              ))}
              {poemLines.length === 0 && (
                <p className="text-center text-base opacity-70">Your poem preview appears here as you write.</p>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default PoemReadModeModal
