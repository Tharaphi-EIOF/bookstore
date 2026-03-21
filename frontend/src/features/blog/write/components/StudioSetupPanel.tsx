import { Eye, Upload, X } from 'lucide-react'
import {
  POEM_CANVAS_PRESETS,
  POEM_INK_TONES,
  POEM_PAPER_STYLES,
  STUDIO_ATMOSPHERES,
  STUDIO_THEMES,
  type StudioAtmosphere,
  type StudioTheme,
} from '../constants'
import { type ContentMode, type PoemCanvasPreset, type PoemInkTone, type PoemPaperStyle } from '../types'

type Props = {
  className?: string
  variant?: 'inline' | 'drawer'
  onClose?: () => void
  contentMode: ContentMode
  studioTheme: StudioTheme
  studioAtmosphere: StudioAtmosphere
  studioBackdrop: string
  backdropTint: number
  poemCanvasPreset: PoemCanvasPreset
  poemPaperStyle: PoemPaperStyle
  poemInkTone: PoemInkTone
  poemPaperLines: boolean
  poemDeckleEdge: boolean
  poemGrainIntensity: number
  onStudioThemeChange: (value: StudioTheme) => void
  onStudioAtmosphereChange: (value: StudioAtmosphere) => void
  onTriggerBackdropUpload: () => void
  onClearBackdrop: () => void
  onBackdropTintChange: (value: number) => void
  onOpenPoemReadMode: () => void
  onPoemCanvasPresetChange: (value: PoemCanvasPreset) => void
  onPoemPaperStyleChange: (value: PoemPaperStyle) => void
  onPoemInkToneChange: (value: PoemInkTone) => void
  onPoemPaperLinesChange: (value: boolean) => void
  onPoemDeckleEdgeChange: (value: boolean) => void
  onPoemGrainIntensityChange: (value: number) => void
}

const StudioSetupPanel = ({
  className = '',
  variant = 'inline',
  onClose,
  contentMode,
  studioTheme,
  studioAtmosphere,
  studioBackdrop,
  backdropTint,
  poemCanvasPreset,
  poemPaperStyle,
  poemInkTone,
  poemPaperLines,
  poemDeckleEdge,
  poemGrainIntensity,
  onStudioThemeChange,
  onStudioAtmosphereChange,
  onTriggerBackdropUpload,
  onClearBackdrop,
  onBackdropTintChange,
  onOpenPoemReadMode,
  onPoemCanvasPresetChange,
  onPoemPaperStyleChange,
  onPoemInkToneChange,
  onPoemPaperLinesChange,
  onPoemDeckleEdgeChange,
  onPoemGrainIntensityChange,
}: Props) => {
  const isDrawer = variant === 'drawer'
  const themeSwatches: Record<StudioTheme, string> = {
    classic: 'bg-[#fdfaf3]',
    parchment: 'bg-[#f7efd8]',
    mist: 'bg-[#eef4ff]',
    night: 'bg-[#111827]',
  }
  const atmosphereSwatches: Record<StudioAtmosphere, string> = {
    dawn: 'bg-[linear-gradient(135deg,#dce7f8,#f7f8fc)]',
    library: 'bg-[linear-gradient(135deg,#efe6d7,#f7f0e5)]',
    aurora: 'bg-[linear-gradient(135deg,#d9f0ef,#efe9ff)]',
    noir: 'bg-[linear-gradient(135deg,#d8dde7,#e9edf4)]',
  }
  const canvasAccent: Record<PoemCanvasPreset, string> = {
    moonlit: 'from-indigo-100 to-slate-50',
    ink: 'from-slate-200 to-zinc-50',
    sunset: 'from-orange-100 to-rose-50',
    rain: 'from-cyan-100 to-sky-50',
  }
  const paperSwatches: Record<PoemPaperStyle, string> = {
    vellum: 'bg-[#fbf4e2]',
    aged: 'bg-[#f4e6c7]',
    linen: 'bg-[#f8f6ef]',
    charcoal: 'bg-[#17171b]',
  }
  const inkSwatches: Record<PoemInkTone, string> = {
    sepia: 'bg-[#4c3322]',
    midnight: 'bg-[#1f2b45]',
    moss: 'bg-[#1f3c2f]',
    wine: 'bg-[#4b2332]',
  }

  return (
    <section className={`${className} rounded-2xl border border-slate-200 bg-white p-5 shadow-[0_24px_60px_-40px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950`}>
      {isDrawer && (
        <div className="mb-5 flex items-start justify-between gap-3 border-b border-slate-200 pb-4 dark:border-slate-800">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Appearance</p>
            <h2 className="mt-1 text-lg font-semibold text-slate-900 dark:text-slate-100">Customize</h2>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-300 bg-white text-slate-500 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:text-white"
              aria-label="Close appearance panel"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      <div className={`grid gap-6 ${isDrawer ? '' : 'xl:grid-cols-[1fr,1fr]'}`}>
        <div>
          {!isDrawer && (
            <>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Appearance</p>
            </>
          )}
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Paper</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {STUDIO_THEMES.map((theme) => (
              <button
                key={theme.key}
                type="button"
                onClick={() => onStudioThemeChange(theme.key)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  studioTheme === theme.key
                    ? 'border-slate-900 bg-slate-50 text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className={`h-4 w-4 rounded-full border border-slate-300 ${themeSwatches[theme.key]}`} />
                {theme.label}
              </button>
            ))}
          </div>
          <p className="mt-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Backdrop</p>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {STUDIO_ATMOSPHERES.map((theme) => (
              <button
                key={theme.key}
                type="button"
                onClick={() => onStudioAtmosphereChange(theme.key)}
                className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-left text-xs font-semibold transition ${
                  studioAtmosphere === theme.key
                    ? 'border-slate-900 bg-slate-50 text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:border-slate-600'
                }`}
              >
                <span className={`h-4 w-4 rounded-full border border-slate-300 ${atmosphereSwatches[theme.key]}`} />
                {theme.label}
              </button>
            ))}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={onTriggerBackdropUpload}
              className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              <Upload className="h-3.5 w-3.5" />
              Upload backdrop
            </button>
            {studioBackdrop && (
              <button
                type="button"
                onClick={onClearBackdrop}
                className="rounded-full border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:text-slate-300 dark:hover:border-slate-600"
              >
                Remove backdrop
              </button>
            )}
          </div>
          {studioBackdrop && (
            <div className="mt-4">
              <label className="flex items-center justify-between gap-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
                Backdrop
                <span>{100 - backdropTint}%</span>
              </label>
              <input
                type="range"
                min={12}
                max={70}
                value={backdropTint}
                onChange={(event) => onBackdropTintChange(Number(event.target.value))}
                className="mt-2 w-full accent-slate-900 dark:accent-slate-100"
              />
            </div>
          )}
        </div>

        {contentMode === 'POEM' && (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Poem style</h2>
              </div>
              <button
                type="button"
                onClick={onOpenPoemReadMode}
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
              >
                <Eye className="h-3.5 w-3.5" />
                Preview
              </button>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {POEM_CANVAS_PRESETS.map((preset) => (
                <button
                  key={preset.key}
                  type="button"
                  onClick={() => onPoemCanvasPresetChange(preset.key)}
                  className={`rounded-xl border px-3 py-3 text-left transition ${
                    poemCanvasPreset === preset.key
                      ? 'border-slate-900 bg-slate-50 text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600'
                  }`}
                >
                  <span className={`block h-10 rounded-lg bg-gradient-to-br ${canvasAccent[preset.key]}`} />
                  <p className="mt-2 text-xs font-semibold uppercase tracking-[0.14em]">{preset.label}</p>
                </button>
              ))}
            </div>
            <div className="mt-4 space-y-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Paper</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {POEM_PAPER_STYLES.map((paper) => (
                <button
                  key={paper.key}
                  type="button"
                  onClick={() => onPoemPaperStyleChange(paper.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    poemPaperStyle === paper.key
                      ? 'border-slate-900 bg-slate-50 text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full border border-slate-300 ${paperSwatches[paper.key]}`} />
                  {paper.label}
                </button>
              ))}
                </div>
              </div>
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">Ink</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {POEM_INK_TONES.map((ink) => (
                <button
                  key={ink.key}
                  type="button"
                  onClick={() => onPoemInkToneChange(ink.key)}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition ${
                    poemInkTone === ink.key
                      ? 'border-slate-900 bg-slate-50 text-slate-900 dark:border-slate-100 dark:bg-slate-900 dark:text-slate-100'
                      : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                  }`}
                >
                  <span className={`h-4 w-4 rounded-full ${inkSwatches[ink.key]}`} />
                  {ink.label}
                </button>
              ))}
                </div>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => onPoemPaperLinesChange(!poemPaperLines)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  poemPaperLines
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                Ruled lines {poemPaperLines ? 'On' : 'Off'}
              </button>
              <button
                type="button"
                onClick={() => onPoemDeckleEdgeChange(!poemDeckleEdge)}
                className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                  poemDeckleEdge
                    ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                    : 'border-slate-300 bg-white text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
                }`}
              >
                Deckle edge {poemDeckleEdge ? 'On' : 'Off'}
              </button>
              <label className={`${isDrawer ? 'w-full justify-between pt-2' : 'ml-auto'} flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300`}>
                Grain
                <input
                  type="range"
                  min={10}
                  max={80}
                  value={poemGrainIntensity}
                  onChange={(event) => onPoemGrainIntensityChange(Number(event.target.value))}
                  className="w-24 accent-rose-500"
                />
              </label>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default StudioSetupPanel
