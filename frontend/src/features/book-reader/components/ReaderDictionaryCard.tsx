type ReaderDictionaryCardProps = {
  audioUrl: string
  definition: string
  isLoading: boolean
  phonetic: string
  word: string
  onClose: () => void
  onPlayAudio: () => void
}

const ReaderDictionaryCard = ({
  audioUrl,
  definition,
  isLoading,
  phonetic,
  word,
  onClose,
  onPlayAudio,
}: ReaderDictionaryCardProps) => {
  return (
    <div className="fixed bottom-4 right-4 z-[76] w-full max-w-sm rounded-2xl border border-slate-300 bg-white/95 p-4 shadow-2xl backdrop-blur dark:border-white/10 dark:bg-[#0f1115]/95">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">Quick Dictionary</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded border px-2 py-1 text-xs"
        >
          Close
        </button>
      </div>
      <p className="text-lg font-semibold capitalize text-slate-900 dark:text-slate-100">{word}</p>
      {phonetic ? (
        <p className="mt-0.5 text-xs uppercase tracking-[0.1em] text-slate-500 dark:text-slate-400">
          {phonetic}
        </p>
      ) : null}
      <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">
        {isLoading ? 'Looking up definition...' : definition}
      </p>
      {audioUrl ? (
        <button
          type="button"
          onClick={onPlayAudio}
          className="mt-3 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.1em] text-slate-700 hover:bg-slate-100 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10"
        >
          Play Pronunciation
        </button>
      ) : null}
    </div>
  )
}

export default ReaderDictionaryCard
