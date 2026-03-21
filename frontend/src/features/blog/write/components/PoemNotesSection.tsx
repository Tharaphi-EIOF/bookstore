type Props = {
  onInsertStanzaBreak: () => void
}

const PoemNotesSection = ({ onInsertStanzaBreak }: Props) => {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white/92 p-4 text-sm text-slate-800 shadow-[0_16px_40px_-32px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-950/92 dark:text-slate-100">
      <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600 dark:text-slate-300">Poem Notes</h2>
      <p className="mt-2">Use shorter lines and intentional line breaks. Press Enter once for a new line, twice for a stanza break.</p>
      <button
        type="button"
        onClick={onInsertStanzaBreak}
        className="mt-3 rounded-full border border-slate-300 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-white dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
      >
        Insert stanza break
      </button>
    </section>
  )
}

export default PoemNotesSection
