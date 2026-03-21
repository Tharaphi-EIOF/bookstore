import { MoonStar, Settings } from 'lucide-react'
import type { RefObject } from 'react'
import type { EbookState } from '@/services/reading'
import ReaderOverlayPanel from '@/features/book-reader/components/ReaderOverlayPanel'
import {
  getHighlightSwatch,
  READER_STYLE_PRESETS,
  type EpubSearchResult,
  type HighlightStyle,
  type ReaderAssetFormat,
  type ReaderSettings,
  type TocEntry,
} from '@/features/book-reader/lib/readerHelpers'

type ReaderOverlayContentProps = {
  panelRef: RefObject<HTMLDivElement>
  panelShellClass: string
  panelMutedTextClass: string
  panelPrimaryTextClass: string
  panelInputClass: string
  panelCardClass: string
  inferredFormat: ReaderAssetFormat
  isTocOpen: boolean
  isSearchOpen: boolean
  isSettingsOpen: boolean
  isHelpOpen: boolean
  filteredToc: Array<TocEntry & { depth: number }>
  tocSearch: string
  setTocSearch: (value: string) => void
  jumpToEpubToc: (href?: string) => Promise<void>
  searchQuery: string
  setSearchQuery: (value: string) => void
  isSearchingText: boolean
  searchResults: EpubSearchResult[]
  jumpToSearchResult: (result: EpubSearchResult) => Promise<void>
  isLightReaderTheme: boolean
  settings: ReaderSettings
  setSettings: (updater: (prev: ReaderSettings) => ReaderSettings) => void
  activePresetId: ReaderSettings['stylePresetId']
  applyReaderPreset: (presetId: ReaderSettings['stylePresetId']) => void
  showAdvancedSettings: boolean
  setShowAdvancedSettings: (value: boolean | ((prev: boolean) => boolean)) => void
  availableVoices: Array<{ voiceURI: string; name: string }>
  selectedVoiceUri: string
  setSelectedVoiceUri: (value: string) => void
  speechRate: number
  setSpeechRate: (value: number) => void
  helpPanelMode: 'notes' | 'highlights'
  highlightColor: HighlightStyle
  setHighlightColor: (style: HighlightStyle) => void
  handleAddPdfHighlight: () => Promise<void>
  handleAddEpubHighlight: () => Promise<void>
  pdfSelectedText: string
  epubSelectedHighlightText: string
  noteInput: string
  setNoteInput: (value: string) => void
  handleAddNote: () => Promise<void>
  bookmarkItems: EbookState['bookmarks']
  jumpToBookmark: (bookmark: EbookState['bookmarks'][number]) => Promise<void>
  deleteBookmarkItem: (bookmarkId: string) => Promise<void>
  notes: EbookState['notes']
  deleteNoteItem: (noteId: string) => Promise<void>
}

const ReaderOverlayContent = ({
  panelRef,
  panelShellClass,
  panelMutedTextClass,
  panelPrimaryTextClass,
  panelInputClass,
  panelCardClass,
  inferredFormat,
  isTocOpen,
  isSearchOpen,
  isSettingsOpen,
  isHelpOpen,
  filteredToc,
  tocSearch,
  setTocSearch,
  jumpToEpubToc,
  searchQuery,
  setSearchQuery,
  isSearchingText,
  searchResults,
  jumpToSearchResult,
  isLightReaderTheme,
  settings,
  setSettings,
  activePresetId,
  applyReaderPreset,
  showAdvancedSettings,
  setShowAdvancedSettings,
  availableVoices,
  selectedVoiceUri,
  setSelectedVoiceUri,
  speechRate,
  setSpeechRate,
  helpPanelMode,
  highlightColor,
  setHighlightColor,
  handleAddPdfHighlight,
  handleAddEpubHighlight,
  pdfSelectedText,
  epubSelectedHighlightText,
  noteInput,
  setNoteInput,
  handleAddNote,
  bookmarkItems,
  jumpToBookmark,
  deleteBookmarkItem,
  notes,
  deleteNoteItem,
}: ReaderOverlayContentProps) => {
  if (!(isTocOpen || isSearchOpen || isSettingsOpen || isHelpOpen)) {
    return null
  }

  return (
    <ReaderOverlayPanel panelRef={panelRef} panelShellClass={panelShellClass}>
      {isTocOpen ? (
        <>
          <p className="mb-2 text-center text-base font-semibold">Contents</p>
          <input
            type="text"
            value={tocSearch}
            onChange={(event) => setTocSearch(event.target.value)}
            placeholder="Search chapters..."
            className={`mb-2.5 w-full rounded-2xl border px-3 py-1.5 text-xs outline-none ${panelInputClass}`}
          />
          {inferredFormat !== 'EPUB' ? (
            <p className={`text-xs ${panelMutedTextClass}`}>TOC is available for EPUB only.</p>
          ) : filteredToc.length === 0 ? (
            <p className={`text-xs ${panelMutedTextClass}`}>No chapter list available.</p>
          ) : (
            <div className="max-h-[42vh] space-y-1 overflow-y-auto pr-2">
              {filteredToc.map((item, idx) => (
                <button
                  key={`${item.label}-${idx}`}
                  type="button"
                  onClick={() => void jumpToEpubToc(item.href)}
                  className={`block w-full rounded-2xl px-2.5 py-1.5 text-left text-xs ${panelPrimaryTextClass} ${panelCardClass}`}
                  style={{ paddingLeft: `${0.65 + item.depth * 0.6}rem` }}
                >
                  {item.label || `Chapter ${idx + 1}`}
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}

      {isSearchOpen ? (
        <>
          <p className="mb-2 text-center text-base font-semibold">Search</p>
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search text..."
            className={`mb-2.5 w-full rounded-2xl border px-3 py-1.5 text-xs outline-none ${panelInputClass}`}
          />
          {isSearchingText ? (
            <p className={`text-xs ${panelMutedTextClass}`}>Searching...</p>
          ) : searchQuery.trim() && searchResults.length === 0 ? (
            <p className={`text-xs ${panelMutedTextClass}`}>No matches found.</p>
          ) : (
            <div className="max-h-[40vh] space-y-1.5 overflow-y-auto pr-1">
              {searchResults.map((result, idx) => (
                <button
                  key={`${result.cfi}-${idx}`}
                  type="button"
                  onClick={() => void jumpToSearchResult(result)}
                  className={`block w-full rounded-2xl border px-3 py-1.5 text-left text-xs ${panelPrimaryTextClass} ${panelCardClass}`}
                >
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] opacity-75">
                    Page {result.page ?? '?'}
                  </p>
                  <p>{result.excerpt}</p>
                </button>
              ))}
            </div>
          )}
        </>
      ) : null}

      {isSettingsOpen ? (
        <div className="space-y-3">
          <p className="text-center text-base font-semibold">Themes & Settings</p>
          <div className="grid grid-cols-[1fr_auto] gap-2">
            <div className={`grid grid-cols-2 overflow-hidden rounded-3xl border ${isLightReaderTheme ? 'border-[#c7b08b] bg-[#eadfca]' : 'border-white/15 bg-white/10'}`}>
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, fontSizeRem: Math.max(0.72, Number((prev.fontSizeRem - 0.06).toFixed(2))) }))}
                className={`py-1.5 text-base font-semibold ${isLightReaderTheme ? 'text-[#4b3d2b] hover:bg-[#dfd2ba]' : 'text-[#f2e7d4] hover:bg-white/10'}`}
              >
                A
              </button>
              <button
                type="button"
                onClick={() => setSettings((prev) => ({ ...prev, fontSizeRem: Math.min(1.9, Number((prev.fontSizeRem + 0.06).toFixed(2))) }))}
                className={`border-l py-1.5 text-3xl leading-none ${isLightReaderTheme ? 'border-[#c7b08b] text-[#4b3d2b] hover:bg-[#dfd2ba]' : 'border-white/15 text-[#f2e7d4] hover:bg-white/10'}`}
              >
                A
              </button>
            </div>
            <button
              type="button"
              onClick={() => setSettings((prev) => ({ ...prev, theme: prev.theme === 'night' ? 'paper' : 'night' }))}
              className={`inline-flex items-center justify-center rounded-3xl border px-3 ${isLightReaderTheme ? 'border-[#c7b08b] bg-[#eadfca] text-[#4b3d2b] hover:bg-[#dfd2ba]' : 'border-white/15 bg-white/10 text-[#f2e7d4] hover:bg-white/15'}`}
            >
              <MoonStar className="h-4 w-4" />
            </button>
          </div>

          <div className={`flex items-center gap-2 px-1 ${isLightReaderTheme ? 'text-[#7a6950]' : 'text-[#9f8e78]'}`}>
            {Array.from({ length: 16 }).map((_, idx) => (
              <span
                key={`density-${idx}`}
                className={`h-1.5 w-1.5 rounded-full ${idx < Math.min(16, Math.max(1, Math.round(((settings.fontSizeRem - 0.72) / (1.9 - 0.72)) * 16))) ? (isLightReaderTheme ? 'bg-[#7a6950]' : 'bg-[#e8dbc8]') : 'bg-current/35'}`}
              />
            ))}
          </div>

          <div className="grid grid-cols-3 gap-2">
            {READER_STYLE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => applyReaderPreset(preset.id)}
                className={`rounded-2xl border px-2 py-2 text-center transition ${
                  activePresetId === preset.id
                    ? 'border-white bg-white/15 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.45)]'
                    : isLightReaderTheme
                      ? 'border-[#c7b08b] bg-[#f3e7d2] hover:bg-[#ebdcc3]'
                      : 'border-white/15 bg-black/35 hover:bg-black/45'
                }`}
              >
                <div className={`text-[1.65rem] leading-none ${isLightReaderTheme ? 'text-[#2f281f]' : 'text-[#f2e9dc]'}`}>Aa</div>
                <div className={`text-xs font-semibold ${isLightReaderTheme ? 'text-[#2f281f]' : 'text-[#f2e9dc]'}`}>{preset.label}</div>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowAdvancedSettings((prev) => !prev)}
            className={`inline-flex w-full items-center justify-center gap-2 rounded-3xl border py-2.5 text-sm font-semibold ${
              isLightReaderTheme
                ? 'border-[#b8a080] bg-[#eadfca] text-[#3f3224] hover:bg-[#dfd2ba]'
                : 'border-white/15 bg-white/10 text-[#f2e9dc] hover:bg-white/15'
            }`}
          >
            <Settings className="h-4 w-4" />
            Customize
          </button>

          {showAdvancedSettings ? (
            <div className={`space-y-3 rounded-2xl border p-3 ${isLightReaderTheme ? 'border-[#c9b18f] bg-[#fbf3e4]' : 'border-white/10 bg-black/25'}`}>
              <div className="grid grid-cols-2 gap-2">
                {(['single', 'spread'] as const).map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setSettings((prev) => ({ ...prev, pageView: mode }))}
                    className={`rounded-2xl border px-2 py-2 text-xs font-semibold uppercase ${
                      settings.pageView === mode
                        ? 'border-[#d6c09e] bg-white/25 text-[#fff8ee]'
                        : isLightReaderTheme
                          ? 'border-[#c7b08b] text-[#4e4130] hover:bg-[#f4e8d5]/70'
                          : 'border-white/15 text-[#ddd0bd] hover:bg-white/10'
                    }`}
                  >
                    {mode === 'single' ? 'Single Page' : 'Two Page'}
                  </button>
                ))}
              </div>
              {inferredFormat === 'EPUB' ? (
                <label className={`block text-xs ${panelMutedTextClass}`}>
                  Line Height
                  <input
                    type="range"
                    min={1.2}
                    max={2}
                    step={0.02}
                    value={settings.lineHeight}
                    onChange={(event) => setSettings((prev) => ({ ...prev, lineHeight: Number(event.target.value) }))}
                    className="mt-1 w-full"
                  />
                </label>
              ) : (
                <label className={`block text-xs ${panelMutedTextClass}`}>
                  Zoom
                  <input
                    type="range"
                    min={0.8}
                    max={2.3}
                    step={0.05}
                    value={settings.pdfZoom}
                    onChange={(event) => setSettings((prev) => ({ ...prev, pdfZoom: Number(event.target.value) }))}
                    className="mt-1 w-full"
                  />
                </label>
              )}
              <label className={`block text-xs ${panelMutedTextClass}`}>
                Voice
                <select
                  value={selectedVoiceUri}
                  onChange={(event) => setSelectedVoiceUri(event.target.value)}
                  className={`mt-1 w-full rounded-xl border px-3 py-2 text-sm outline-none ${panelInputClass}`}
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.voiceURI} value={voice.voiceURI}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className={`block text-xs ${panelMutedTextClass}`}>
                Speed
                <input
                  type="range"
                  min={0.7}
                  max={1.4}
                  step={0.05}
                  value={speechRate}
                  onChange={(event) => setSpeechRate(Number(event.target.value))}
                  className="mt-1 w-full"
                />
                <span className="mt-1 block text-[11px]">{speechRate.toFixed(2)}x</span>
              </label>
            </div>
          ) : null}
        </div>
      ) : null}

      {isHelpOpen ? (
        <div className="space-y-3">
          <p className="text-center text-lg font-semibold">
            {helpPanelMode === 'highlights' ? 'Highlights' : 'Notes'}
          </p>

          {helpPanelMode === 'highlights' ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 rounded-2xl border px-3 py-2">
                <span className={`text-xs font-semibold uppercase tracking-[0.12em] ${panelMutedTextClass}`}>
                  Style
                </span>
                <div className="flex items-center gap-1.5">
                  {(['yellow', 'green', 'pink', 'blue', 'underline'] as HighlightStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setHighlightColor(style)}
                      className={`h-6 rounded-full border px-2 text-[10px] font-semibold uppercase ${
                        highlightColor === style ? 'border-slate-800 dark:border-slate-200' : 'border-slate-300 dark:border-slate-700'
                      }`}
                      style={{
                        backgroundColor: style === 'underline' ? 'transparent' : getHighlightSwatch(style),
                        textDecoration: style === 'underline' ? 'underline' : 'none',
                      }}
                    >
                      {style === 'underline' ? 'U' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {inferredFormat === 'PDF' ? (
                <div className="space-y-2">
                  <button
                    onClick={() => void handleAddPdfHighlight()}
                    className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold ${
                      isLightReaderTheme
                        ? 'border-[#af9470] bg-[#f7ebd8] text-[#3f3224] hover:bg-[#efdfc7]'
                        : 'border-[#8a7552] bg-white/10 text-[#f8f1e6] hover:bg-white/20'
                    }`}
                    type="button"
                  >
                    {pdfSelectedText ? 'Highlight Selected Text' : 'Highlight This Page'}
                  </button>
                  {pdfSelectedText ? (
                    <p className={`line-clamp-2 rounded-xl border px-3 py-2 text-xs ${panelCardClass}`}>
                      Selected: {pdfSelectedText}
                    </p>
                  ) : (
                    <p className={`text-xs ${panelMutedTextClass}`}>
                      Select text on the PDF page, then tap highlight.
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => void handleAddEpubHighlight()}
                    className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold ${
                      isLightReaderTheme
                        ? 'border-[#af9470] bg-[#f7ebd8] text-[#3f3224] hover:bg-[#efdfc7]'
                        : 'border-[#8a7552] bg-white/10 text-[#f8f1e6] hover:bg-white/20'
                    }`}
                    type="button"
                  >
                    Highlight Selected Text
                  </button>
                  {epubSelectedHighlightText ? (
                    <p className={`line-clamp-2 rounded-xl border px-3 py-2 text-xs ${panelCardClass}`}>
                      Selected: {epubSelectedHighlightText}
                    </p>
                  ) : (
                    <p className={`text-xs ${panelMutedTextClass}`}>
                      Select text in the page, then tap highlight.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}

          {helpPanelMode === 'notes' ? (
            <>
              <textarea
                value={noteInput}
                onChange={(event) => setNoteInput(event.target.value)}
                rows={3}
                className={`w-full rounded-2xl border px-3 py-2 text-sm outline-none ${panelInputClass}`}
                placeholder="Write a note for this page..."
              />
              <button
                onClick={() => void handleAddNote()}
                className={`w-full rounded-2xl border px-3 py-2 text-sm font-semibold ${
                  isLightReaderTheme
                    ? 'border-[#af9470] bg-[#f7ebd8] text-[#3f3224] hover:bg-[#efdfc7]'
                    : 'border-[#8a7552] bg-white/10 text-[#f8f1e6] hover:bg-white/20'
                }`}
                type="button"
              >
                Save Note
              </button>
              <div className="max-h-[34vh] space-y-2 overflow-y-auto pr-1 text-sm">
                <p className={`text-xs uppercase tracking-[0.12em] ${panelMutedTextClass}`}>Bookmarks</p>
                {bookmarkItems.length === 0 ? (
                  <p className={panelMutedTextClass}>No bookmarks.</p>
                ) : (
                  bookmarkItems.map((bookmark) => (
                    <div key={bookmark.id} className={`flex items-center justify-between gap-2 rounded-xl border px-2 py-1.5 ${panelCardClass}`}>
                      <button
                        type="button"
                        onClick={() => void jumpToBookmark(bookmark)}
                        className="flex-1 truncate text-left hover:underline"
                      >
                        {bookmark.label ?? `Page ${bookmark.page}`}
                      </button>
                      <button
                        className="text-rose-300 hover:text-rose-200"
                        type="button"
                        onClick={() => void deleteBookmarkItem(bookmark.id)}
                      >
                        x
                      </button>
                    </div>
                  ))
                )}

                <p className={`pt-2 text-xs uppercase tracking-[0.12em] ${panelMutedTextClass}`}>Notes</p>
                {notes.length === 0 ? (
                  <p className={panelMutedTextClass}>No notes.</p>
                ) : (
                  notes.slice(0, 8).map((note) => (
                    <div key={note.id} className={`flex items-start justify-between gap-2 rounded-xl border px-2 py-1.5 ${panelCardClass}`}>
                      <span className="line-clamp-2">{note.content}</span>
                      <button
                        className="text-rose-300 hover:text-rose-200"
                        type="button"
                        onClick={() => void deleteNoteItem(note.id)}
                      >
                        x
                      </button>
                    </div>
                  ))
                )}
              </div>
            </>
          ) : null}
        </div>
      ) : null}
    </ReaderOverlayPanel>
  )
}

export default ReaderOverlayContent
