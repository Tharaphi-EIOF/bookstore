import type { ReactNode, RefObject, WheelEvent } from 'react'
import { getHighlightSwatch, type HighlightStyle, type ReaderAssetFormat, type ReaderSettings } from '@/features/book-reader/lib/readerHelpers'

type HighlightRectWithColor = {
  x: number
  y: number
  w: number
  h: number
  color: HighlightStyle
}

type ReaderContentViewportProps = {
  resolvedAssetUrl: string
  inferredFormat: ReaderAssetFormat
  pdfError: string
  epubError: string
  isFullscreen: boolean
  pdfUseNativeViewer: boolean
  pdfObjectUrl: string
  paperToneClass: string
  readerViewportClass: string
  flipDirection: 'prev' | 'next' | null
  canNavigatePdf: boolean
  canNavigateEpub: boolean
  settings: ReaderSettings
  pdfHighlightRectsPrimary: HighlightRectWithColor[]
  pdfHighlightRectsSecondary: HighlightRectWithColor[]
  onPrevPdfPage: () => Promise<void>
  onNextPdfPage: () => Promise<void>
  onPrevEpubPage: () => Promise<void>
  onNextEpubPage: () => Promise<void>
  onTouchStart: (event: any) => void
  onTouchMove: (event: any) => void
  onTouchEnd: (event: any) => Promise<void>
  onCapturePdfSelection: () => void
  onEpubWheel: (event: WheelEvent<HTMLDivElement>) => void
  pdfViewportRef: RefObject<HTMLDivElement>
  setPdfCanvas: (node: HTMLCanvasElement | null) => void
  setPdfCanvasSecondary: (node: HTMLCanvasElement | null) => void
  setPdfTextLayer: (node: HTMLDivElement | null) => void
  setPdfTextLayerSecondary: (node: HTMLDivElement | null) => void
  setEpubContainer: (node: HTMLDivElement | null) => void
  selectionAction: ReactNode
}

const flipOverlayStyle = (direction: 'prev' | 'next') => ({
  animation: direction === 'next' ? 'readerFlipNext 320ms ease-out' : 'readerFlipPrev 320ms ease-out',
  background:
    direction === 'next'
      ? 'linear-gradient(90deg, rgba(255,255,255,0) 0%, rgba(254,242,218,0.35) 62%, rgba(180,147,95,0.24) 100%)'
      : 'linear-gradient(270deg, rgba(255,255,255,0) 0%, rgba(254,242,218,0.35) 62%, rgba(180,147,95,0.24) 100%)',
})

const ReaderContentViewport = ({
  resolvedAssetUrl,
  inferredFormat,
  pdfError,
  epubError,
  isFullscreen,
  pdfUseNativeViewer,
  pdfObjectUrl,
  paperToneClass,
  readerViewportClass,
  flipDirection,
  canNavigatePdf,
  canNavigateEpub,
  settings,
  pdfHighlightRectsPrimary,
  pdfHighlightRectsSecondary,
  onPrevPdfPage,
  onNextPdfPage,
  onPrevEpubPage,
  onNextEpubPage,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
  onCapturePdfSelection,
  onEpubWheel,
  pdfViewportRef,
  setPdfCanvas,
  setPdfCanvasSecondary,
  setPdfTextLayer,
  setPdfTextLayerSecondary,
  setEpubContainer,
  selectionAction,
}: ReaderContentViewportProps) => {
  if (!resolvedAssetUrl) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300">
        Reader content is unavailable for this eBook.
      </div>
    )
  }

  if (inferredFormat === 'PDF') {
    if (pdfError) {
      return (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p>PDF renderer could not load ({pdfError}).</p>
          <a
            href={resolvedAssetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Open PDF
          </a>
        </div>
      )
    }

    return (
      <div className={isFullscreen ? 'relative flex-1 min-h-0' : 'relative'}>
        {!pdfUseNativeViewer ? (
          <>
            <button
              type="button"
              onClick={() => void onPrevPdfPage()}
              disabled={!canNavigatePdf}
              aria-label="Previous page"
              className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
            >
              &#8249;
            </button>
            <button
              type="button"
              onClick={() => void onNextPdfPage()}
              disabled={!canNavigatePdf}
              aria-label="Next page"
              className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
            >
              &#8250;
            </button>
          </>
        ) : null}
        {flipDirection ? (
          <div
            className="pointer-events-none absolute inset-x-8 top-6 bottom-6 z-10 rounded-2xl"
            style={flipOverlayStyle(flipDirection)}
          />
        ) : null}
        {pdfUseNativeViewer && pdfObjectUrl ? (
          <div className={`overflow-hidden rounded-2xl border border-[#cab89b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_16px_30px_rgba(93,69,33,0.2)] dark:border-white/10 ${paperToneClass} ${readerViewportClass}`}>
            <iframe
              src={pdfObjectUrl}
              title="PDF reader fallback"
              className="h-full w-full"
            />
          </div>
        ) : (
          <div
            ref={pdfViewportRef}
            className={`flex items-start justify-center overflow-auto rounded-2xl border border-[#cab89b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_16px_30px_rgba(93,69,33,0.2)] dark:border-white/10 ${paperToneClass} ${readerViewportClass}`}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={(event) => void onTouchEnd(event)}
            onMouseUp={onCapturePdfSelection}
          >
            <div className={`flex min-h-full w-full items-start justify-center px-3 py-3 ${settings.pageView === 'spread' ? 'gap-2 md:gap-4' : ''}`}>
              <div className={`relative ${settings.pageView === 'spread' ? 'max-w-[48%]' : ''}`}>
                <canvas
                  ref={setPdfCanvas}
                  className={settings.pageView === 'spread' ? 'h-auto w-auto max-w-[48%]' : 'h-auto w-auto'}
                />
                <div
                  ref={setPdfTextLayer}
                  className="reader-pdf-text-layer absolute inset-0 z-10"
                />
                <div className="pointer-events-none absolute inset-0 z-20">
                  {pdfHighlightRectsPrimary.map((rect, idx) => (
                    <span
                      key={`pdfhl-left-${idx}`}
                      className="absolute rounded-sm"
                      style={{
                        left: `${rect.x * 100}%`,
                        top: `${rect.y * 100}%`,
                        width: `${rect.w * 100}%`,
                        height: rect.color === 'underline' ? '2px' : `${rect.h * 100}%`,
                        marginTop: rect.color === 'underline' ? `${Math.max(0, rect.h * 100 - 0.4)}%` : undefined,
                        backgroundColor:
                          rect.color === 'underline'
                            ? getHighlightSwatch('underline')
                            : getHighlightSwatch(rect.color || 'yellow'),
                        opacity: rect.color === 'underline' ? 0.95 : 0.35,
                      }}
                    />
                  ))}
                </div>
              </div>
              {settings.pageView === 'spread' ? (
                <div className="relative max-w-[48%] border-l border-[#d3c0a3]/70 pl-2 md:pl-4">
                  <canvas
                    ref={setPdfCanvasSecondary}
                    className="h-auto w-auto max-w-[48%]"
                  />
                  <div
                    ref={setPdfTextLayerSecondary}
                    className="reader-pdf-text-layer absolute inset-0 z-10"
                  />
                  <div className="pointer-events-none absolute inset-0 z-20">
                    {pdfHighlightRectsSecondary.map((rect, idx) => (
                      <span
                        key={`pdfhl-right-${idx}`}
                        className="absolute rounded-sm"
                        style={{
                          left: `${rect.x * 100}%`,
                          top: `${rect.y * 100}%`,
                          width: `${rect.w * 100}%`,
                          height: rect.color === 'underline' ? '2px' : `${rect.h * 100}%`,
                          marginTop: rect.color === 'underline' ? `${Math.max(0, rect.h * 100 - 0.4)}%` : undefined,
                          backgroundColor:
                            rect.color === 'underline'
                              ? getHighlightSwatch('underline')
                              : getHighlightSwatch(rect.color || 'yellow'),
                          opacity: rect.color === 'underline' ? 0.95 : 0.35,
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        )}
      </div>
    )
  }

  if (inferredFormat === 'EPUB') {
    if (epubError) {
      return (
        <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
          <p>EPUB renderer could not load ({epubError}).</p>
          <a
            href={resolvedAssetUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-700 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-300"
          >
            Open EPUB
          </a>
        </div>
      )
    }

    return (
      <div className={isFullscreen ? 'relative flex-1 min-h-0' : 'relative'}>
        <button
          type="button"
          onClick={() => void onPrevEpubPage()}
          disabled={!canNavigateEpub}
          aria-label="Previous page"
          className="absolute left-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
        >
          &#8249;
        </button>
        <button
          type="button"
          onClick={() => void onNextEpubPage()}
          disabled={!canNavigateEpub}
          aria-label="Next page"
          className="absolute right-2 top-1/2 z-20 -translate-y-1/2 rounded-full border border-slate-300 bg-white/90 px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-slate-700 shadow-md transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-40 dark:border-white/20 dark:bg-black/60 dark:text-slate-200"
        >
          &#8250;
        </button>
        {flipDirection ? (
          <div
            className="pointer-events-none absolute inset-x-8 top-6 bottom-6 z-10 rounded-2xl"
            style={flipOverlayStyle(flipDirection)}
          />
        ) : null}
        <div
          className={`overflow-hidden rounded-2xl border border-[#cab89b] shadow-[inset_0_0_0_1px_rgba(255,255,255,0.7),0_16px_30px_rgba(93,69,33,0.2)] dark:border-white/10 ${paperToneClass} ${readerViewportClass}`}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={(event) => void onTouchEnd(event)}
          onWheel={onEpubWheel}
        >
          <div ref={setEpubContainer} className="h-full w-full" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/20 dark:text-amber-300">
      <p>
        Unsupported eBook format: <strong>{inferredFormat || 'unknown'}</strong>.
      </p>
      {selectionAction}
    </div>
  )
}

export default ReaderContentViewport
