import { Bookmark, Highlighter, List, Maximize2, Minimize2, Play, Search, Square, StickyNote } from 'lucide-react'

type ReaderToolbarProps = {
  helpPanelMode: 'notes' | 'highlights'
  isFullscreen: boolean
  isHelpOpen: boolean
  isSearchOpen: boolean
  isSettingsOpen: boolean
  isSpeaking: boolean
  isTocOpen: boolean
  toolbarButtonActiveClass: string
  toolbarButtonIdleClass: string
  toolbarShellClass: string
  onAddBookmark: () => Promise<void>
  onReadAloudToggle: () => void
  onToggleFullscreen: () => Promise<void>
  onTogglePanel: (panel: 'toc' | 'search' | 'settings' | 'notes' | 'highlights') => void
}

const ReaderToolbar = ({
  helpPanelMode,
  isFullscreen,
  isHelpOpen,
  isSearchOpen,
  isSettingsOpen,
  isSpeaking,
  isTocOpen,
  toolbarButtonActiveClass,
  toolbarButtonIdleClass,
  toolbarShellClass,
  onAddBookmark,
  onReadAloudToggle,
  onToggleFullscreen,
  onTogglePanel,
}: ReaderToolbarProps) => {
  return (
    <div className="absolute left-4 right-4 top-3 z-30 flex items-center justify-between">
      <div className={`inline-flex items-center rounded-full border p-1 shadow-lg backdrop-blur ${toolbarShellClass}`}>
        <button
          type="button"
          onClick={() => onTogglePanel('toc')}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${isTocOpen ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
          aria-label="Contents"
        >
          <List className="h-4 w-4 stroke-2" />
        </button>
        <button
          type="button"
          onClick={() => void onAddBookmark()}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${toolbarButtonIdleClass}`}
          aria-label="Bookmark current page"
        >
          <Bookmark className="h-4 w-4 stroke-2" />
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel('notes')}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${isHelpOpen && helpPanelMode === 'notes' ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
          aria-label="Notes"
        >
          <StickyNote className="h-4 w-4 stroke-2" />
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel('highlights')}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${isHelpOpen && helpPanelMode === 'highlights' ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
          aria-label="Highlights"
        >
          <Highlighter className="h-4 w-4 stroke-2" />
        </button>
      </div>

      <div className={`inline-flex items-center rounded-full border p-1 shadow-lg backdrop-blur ${toolbarShellClass}`}>
        <button
          type="button"
          onClick={() => onTogglePanel('settings')}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${isSettingsOpen ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
          aria-label="Reader typography"
        >
          Aa
        </button>
        <button
          type="button"
          onClick={() => onTogglePanel('search')}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${isSearchOpen ? toolbarButtonActiveClass : toolbarButtonIdleClass}`}
          aria-label="Search in book"
        >
          <Search className="h-4 w-4 stroke-2" />
        </button>
        <button
          type="button"
          onClick={onReadAloudToggle}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${toolbarButtonIdleClass}`}
          aria-label="Read aloud"
        >
          {isSpeaking ? <Square className="h-4 w-4 stroke-2" /> : <Play className="h-4 w-4 stroke-2" />}
        </button>
        <button
          type="button"
          onClick={() => void onToggleFullscreen()}
          className={`rounded-full px-3 py-1.5 text-sm leading-none ${toolbarButtonIdleClass}`}
          aria-label={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4 stroke-2" /> : <Maximize2 className="h-4 w-4 stroke-2" />}
        </button>
      </div>
    </div>
  )
}

export default ReaderToolbar
