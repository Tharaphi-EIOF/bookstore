import { Highlighter, Search } from 'lucide-react'
import ReaderDictionaryCard from '@/features/book-reader/components/ReaderDictionaryCard'
import ReaderContentViewport from '@/features/book-reader/components/ReaderContentViewport'
import ReaderOverlayContent from '@/features/book-reader/components/ReaderOverlayContent'
import useBookReaderController from '@/features/book-reader/hooks/useBookReaderController'
import ReaderHeader from '@/features/book-reader/components/ReaderHeader'
import ReaderProgressBar from '@/features/book-reader/components/ReaderProgressBar'
import ReaderToolbar from '@/features/book-reader/components/ReaderToolbar'

const readerRuntimeStyles = `@keyframes readerFlipNext{0%{opacity:0;transform:translateX(22%) skewX(-10deg)}35%{opacity:.26}100%{opacity:0;transform:translateX(-8%) skewX(-2deg)}}@keyframes readerFlipPrev{0%{opacity:0;transform:translateX(-22%) skewX(10deg)}35%{opacity:.26}100%{opacity:0;transform:translateX(8%) skewX(2deg)}}.reader-pdf-text-layer{user-select:text;-webkit-user-select:text;}.reader-pdf-text-layer span{position:absolute;white-space:pre;cursor:text;color:transparent;transform-origin:0 0;}.reader-pdf-text-layer ::selection{background:rgba(250,204,21,0.35);}`

const BookReaderPage = () => {
  const controller = useBookReaderController()

  if (controller.isMissingBookId) {
    return <div className="mx-auto max-w-4xl p-6">Missing book ID.</div>
  }

  return (
    <div
      ref={controller.refs.readerShellRef}
      className="min-h-screen bg-[radial-gradient(circle_at_top,_#f7f3ea_0%,_#ece6d9_42%,_#e1dbcf_100%)] px-3 py-4 text-slate-900 dark:bg-[radial-gradient(circle_at_top,_#171717_0%,_#101010_100%)] dark:text-slate-100 md:px-6 md:py-6"
    >
      <style>{readerRuntimeStyles}</style>
      <div className="mx-auto max-w-6xl">
        <ReaderHeader {...controller.headerProps} />

        {controller.feedback ? (
          <div className="mt-3 rounded-xl border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-300">
            {controller.feedback}
          </div>
        ) : null}

        <ReaderProgressBar {...controller.progressBarProps} />

        {controller.isInitialLoading ? (
          <div className="mt-4 rounded-3xl border border-white/60 bg-white/80 p-8 text-sm text-slate-600 shadow-[0_12px_35px_rgba(53,38,16,0.08)] dark:border-white/10 dark:bg-black/30 dark:text-slate-300">
            Loading reader...
          </div>
        ) : (
          <section ref={controller.refs.readerStageRef} className={controller.classes.readerStageClass}>
            <div ref={controller.refs.toolbarAreaRef}>
              <ReaderToolbar {...controller.toolbarProps} />
            </div>

            <ReaderOverlayContent {...controller.overlayProps} />

            {controller.selectionAction.visible && controller.selectionAction.anchor ? (
              <div
                ref={controller.selectionAction.ref}
                className={`absolute z-40 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-full rounded-2xl border px-3 py-2 shadow-xl backdrop-blur ${
                  controller.classes.isLightReaderTheme
                    ? 'border-[#8f7a57] bg-[rgba(47,41,33,0.95)] text-[#fff8ee]'
                    : 'border-[#8a7552] bg-[rgba(47,41,33,0.92)] text-[#f2e9dc]'
                }`}
                style={{
                  left: `${controller.selectionAction.anchor.x}px`,
                  top: `${controller.selectionAction.anchor.y}px`,
                }}
              >
                <p className="line-clamp-2 text-[11px] opacity-85">
                  {controller.selectionAction.text}
                </p>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={controller.selectionAction.onHighlight}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/25 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10"
                  >
                    <Highlighter className="h-3.5 w-3.5" />
                    Highlight
                  </button>
                  <button
                    type="button"
                    onClick={controller.selectionAction.onDictionary}
                    className="inline-flex flex-1 items-center justify-center gap-1 rounded-full border border-white/25 px-2.5 py-1.5 text-xs font-semibold hover:bg-white/10"
                  >
                    <Search className="h-3.5 w-3.5" />
                    Dictionary
                  </button>
                </div>
              </div>
            ) : null}

            <ReaderContentViewport {...controller.viewportProps} />

            <div className="mt-3 space-y-2">
              <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                <span>{controller.footer.currentLabel}</span>
                <span>{controller.footer.valueLabel}</span>
              </div>
              <input
                type="range"
                min={controller.footer.min}
                max={controller.footer.max}
                step={1}
                value={controller.footer.value}
                onChange={(event) => controller.footer.setValue(Number(event.target.value))}
                onMouseUp={controller.footer.onCommit}
                onTouchEnd={controller.footer.onCommit}
                className="w-full accent-slate-700 dark:accent-slate-200"
              />
            </div>
          </section>
        )}
      </div>

      {controller.dictionaryCardProps.isOpen ? (
        <ReaderDictionaryCard
          audioUrl={controller.dictionaryCardProps.audioUrl}
          definition={controller.dictionaryCardProps.definition}
          isLoading={controller.dictionaryCardProps.isLoading}
          onClose={controller.dictionaryCardProps.onClose}
          onPlayAudio={controller.dictionaryCardProps.onPlayAudio}
          phonetic={controller.dictionaryCardProps.phonetic}
          word={controller.dictionaryCardProps.word}
        />
      ) : null}
    </div>
  )
}

export default BookReaderPage
