import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { WheelEvent } from 'react'
import {
  detectAssetFormat,
  flattenToc,
  getHighlightSwatch,
  loadEpubScript,
  READER_STYLE_PRESETS,
  type EpubSearchResult,
  type EpubSelectionActionAnchor,
  type HighlightStyle,
  type ReaderAssetFormat,
  type ReaderLastPosition,
  type ReaderSettings,
  type SaveJob,
  type TocEntry,
} from '@/features/book-reader/lib/readerHelpers'
import { getErrorMessage } from '@/lib/api'
import type { EbookState } from '@/services/reading'

type UseEpubReaderArgs = {
  bookId: string
  inferredFormat: ReaderAssetFormat
  resolvedAssetUrl: string
  settings: ReaderSettings
  totalPages: number | null
  ebookHighlights: EbookState['highlights']
  initialLocationCfi?: string
  latestPageRef: React.MutableRefObject<number>
  latestCfiRef: React.MutableRefObject<string | undefined>
  latestPercentRef: React.MutableRefObject<number | undefined>
  totalPagesRef: React.MutableRefObject<number | null>
  queueProgressSave: (job: SaveJob) => Promise<void>
  setPageInput: (value: string) => void
  setFormatOverride: (format: ReaderAssetFormat) => void
  showMessage: (message: string) => void
  writeLastPosition: (bookId: string, position: ReaderLastPosition) => void
  readerStageRef: React.RefObject<HTMLDivElement>
}

const useEpubReader = ({
  bookId,
  inferredFormat,
  resolvedAssetUrl,
  settings,
  totalPages,
  ebookHighlights,
  initialLocationCfi,
  latestPageRef,
  latestCfiRef,
  latestPercentRef,
  totalPagesRef,
  queueProgressSave,
  setPageInput,
  setFormatOverride,
  showMessage,
  writeLastPosition,
  readerStageRef,
}: UseEpubReaderArgs) => {
  const [epubError, setEpubError] = useState('')
  const [isTurningPage, setIsTurningPage] = useState(false)
  const [isEpubReady, setIsEpubReady] = useState(false)
  const [epubContainerReady, setEpubContainerReady] = useState(false)
  const [tocSearch, setTocSearch] = useState('')
  const [tocEntries, setTocEntries] = useState<TocEntry[]>([])
  const [isSearchingText, setIsSearchingText] = useState(false)
  const [searchResults, setSearchResults] = useState<EpubSearchResult[]>([])
  const [epubSelectedHighlight, setEpubSelectedHighlight] = useState<{ cfiRange: string; text: string } | null>(null)
  const [epubSelectionActionAnchor, setEpubSelectionActionAnchor] = useState<EpubSelectionActionAnchor | null>(null)

  const epubContainerRef = useRef<HTMLDivElement | null>(null)
  const renditionRef = useRef<any>(null)
  const bookRef = useRef<any>(null)
  const lastRelocationSyncRef = useRef<{ cfi: string; at: number }>({ cfi: '', at: 0 })
  const wheelLockUntilRef = useRef(0)
  const appliedHighlightsRef = useRef(new Set<string>())
  const turnFallbackTimerRef = useRef<number | null>(null)
  const suppressSelectionDismissUntilRef = useRef(0)

  const setEpubContainer = useCallback((node: HTMLDivElement | null) => {
    epubContainerRef.current = node
    setEpubContainerReady(Boolean(node))
  }, [])

  const filteredToc = useMemo(() => {
    const query = tocSearch.trim().toLowerCase()
    const flattenedToc = flattenToc(tocEntries)
    if (!query) return flattenedToc
    return flattenedToc.filter((item) => item.label?.toLowerCase().includes(query))
  }, [tocEntries, tocSearch])

  const applyEpubTheme = useCallback((rendition: any) => {
    const preset = READER_STYLE_PRESETS.find((item) => item.id === settings.stylePresetId) ?? READER_STYLE_PRESETS[0]
    const palette =
      settings.theme === 'night'
        ? { bg: '#111827', fg: '#e5e7eb' }
        : settings.theme === 'sepia'
          ? { bg: '#f6f0df', fg: '#3f2f1f' }
          : { bg: '#fffdf7', fg: '#1f2937' }

    rendition.themes.default({
      body: {
        'line-height': String(settings.lineHeight),
        'font-size': `${settings.fontSizeRem}rem`,
        'padding-top': '1.2rem',
        'padding-bottom': '1.2rem',
        'padding-left': `${settings.sidePaddingRem}rem`,
        'padding-right': `${settings.sidePaddingRem}rem`,
        color: palette.fg,
        'background-color': palette.bg,
        'font-family': preset.fontFamily,
        'font-weight': preset.fontWeight,
        'letter-spacing': preset.letterSpacing,
      },
    })
    rendition.themes.fontSize?.(`${Math.round(settings.fontSizeRem * 100)}%`)
  }, [settings])

  const applyEpubTypography = useCallback((rendition: any) => {
    const preset = READER_STYLE_PRESETS.find((item) => item.id === settings.stylePresetId) ?? READER_STYLE_PRESETS[0]
    const sizePercent = `${Math.round(settings.fontSizeRem * 100)}%`
    const lineHeight = String(settings.lineHeight)
    const contents = typeof rendition?.getContents === 'function' ? rendition.getContents() : []
    for (const content of contents ?? []) {
      const doc = content?.document as Document | undefined
      if (!doc) continue
      doc.documentElement.style.setProperty('font-size', sizePercent, 'important')
      doc.body?.style.setProperty('font-size', sizePercent, 'important')
      doc.body?.style.setProperty('line-height', lineHeight, 'important')
      doc.body?.style.setProperty('padding-top', '1.2rem', 'important')
      doc.body?.style.setProperty('padding-bottom', '1.2rem', 'important')
      doc.body?.style.setProperty('font-family', preset.fontFamily, 'important')
      doc.body?.style.setProperty('font-weight', preset.fontWeight, 'important')
      doc.body?.style.setProperty('letter-spacing', preset.letterSpacing, 'important')
    }
  }, [settings.fontSizeRem, settings.lineHeight, settings.stylePresetId])

  const runEpubTurn = useCallback(async (direction: 'prev' | 'next') => {
    const rendition = renditionRef.current
    if (!rendition || isTurningPage) {
      showMessage('Reader is still loading. Try again in a moment.')
      return
    }

    if (turnFallbackTimerRef.current) {
      window.clearTimeout(turnFallbackTimerRef.current)
      turnFallbackTimerRef.current = null
    }

    setIsTurningPage(true)
    turnFallbackTimerRef.current = window.setTimeout(() => {
      setIsTurningPage(false)
      turnFallbackTimerRef.current = null
    }, 2500)

    try {
      await Promise.race([
        direction === 'prev' ? rendition.prev() : rendition.next(),
        new Promise((_, reject) =>
          window.setTimeout(() => reject(new Error('EPUB_PAGE_TURN_TIMEOUT')), 2200),
        ),
      ])
    } catch {
      const book = bookRef.current
      const currentCfi = latestCfiRef.current
      const percentageFromCfi = book?.locations?.percentageFromCfi
      const cfiFromPercentage = book?.locations?.cfiFromPercentage || book?.locations?.percentageToCfi

      if (
        currentCfi
        && typeof percentageFromCfi === 'function'
        && typeof cfiFromPercentage === 'function'
      ) {
        try {
          const raw = Number(percentageFromCfi(currentCfi))
          const estimatedStep = totalPages ? 1 / Math.max(1, totalPages) : 0.015
          const delta = Math.max(0.0035, Math.min(0.03, estimatedStep * 1.4))
          const nextRaw = Math.max(
            0,
            Math.min(1, direction === 'next' ? raw + delta : raw - delta),
          )
          const fallbackCfi = cfiFromPercentage(nextRaw)
          await rendition.display(fallbackCfi)
          return
        } catch {
          // ignore
        }
      }

      showMessage(direction === 'prev' ? 'You are at the beginning.' : 'You reached the end.')
    } finally {
      if (turnFallbackTimerRef.current) {
        window.clearTimeout(turnFallbackTimerRef.current)
        turnFallbackTimerRef.current = null
      }
      setIsTurningPage(false)
    }
  }, [isTurningPage, latestCfiRef, showMessage, totalPages])

  const goToPrevPage = useCallback(async () => {
    await runEpubTurn('prev')
  }, [runEpubTurn])

  const goToNextPage = useCallback(async () => {
    await runEpubTurn('next')
  }, [runEpubTurn])

  const jumpToEpubToc = useCallback(async (href?: string) => {
    if (!href || !renditionRef.current) return
    try {
      await renditionRef.current.display(href)
    } catch {
      showMessage('Unable to open that chapter.')
    }
  }, [showMessage])

  const runEpubTextSearch = useCallback(async (query: string) => {
    const trimmed = query.trim()
    if (!trimmed || inferredFormat !== 'EPUB' || !bookRef.current) {
      setSearchResults([])
      return
    }

    const book = bookRef.current
    const toPageFromCfi = (cfi: string): number | null => {
      const total = totalPagesRef.current
      if (!total || typeof book?.locations?.percentageFromCfi !== 'function') return null
      try {
        const raw = Number(book.locations.percentageFromCfi(cfi))
        if (!Number.isFinite(raw)) return null
        const normalized = Math.min(1, Math.max(0, raw))
        return Math.min(total, Math.max(1, Math.floor(normalized * total) + 1))
      } catch {
        return null
      }
    }
    const spineItems = (book.spine?.spineItems ?? []) as any[]
    if (!spineItems.length) {
      setSearchResults([])
      return
    }

    setIsSearchingText(true)
    try {
      const results: EpubSearchResult[] = []
      for (const item of spineItems) {
        if (results.length >= 80) break
        try {
          const section = typeof book.spine?.get === 'function' ? book.spine.get(item.index) : item
          if (!section) continue
          await section.load(book.load?.bind(book))
          const matches = typeof section.find === 'function' ? section.find(trimmed) : []
          for (const match of matches ?? []) {
            const cfi = match?.cfi as string | undefined
            if (!cfi) continue
            results.push({
              cfi,
              excerpt: (match?.excerpt as string | undefined)?.trim() || 'Match',
              page: toPageFromCfi(cfi),
            })
            if (results.length >= 80) break
          }
          section.unload?.()
        } catch {
          // keep scanning
        }
      }
      setSearchResults(results)
    } finally {
      setIsSearchingText(false)
    }
  }, [inferredFormat, totalPagesRef])

  const jumpToSearchResult = useCallback(async (result: EpubSearchResult) => {
    if (!renditionRef.current) return false
    try {
      await renditionRef.current.display(result.cfi)
      return true
    } catch {
      showMessage('Unable to open that result.')
      return false
    }
  }, [showMessage])

  const clearSelectionAction = useCallback(() => {
    setEpubSelectionActionAnchor(null)
  }, [])

  const handleEpubWheel = useCallback((event: WheelEvent<HTMLDivElement>) => {
    if (!renditionRef.current) return
    const now = Date.now()
    if (now < wheelLockUntilRef.current) return
    if (Math.abs(event.deltaY) < 24) return
    event.preventDefault()
    wheelLockUntilRef.current = now + 420
    if (event.deltaY > 0) {
      void goToNextPage()
    } else {
      void goToPrevPage()
    }
  }, [goToNextPage, goToPrevPage])

  useEffect(() => {
    if (inferredFormat !== 'EPUB' || !resolvedAssetUrl || !epubContainerReady) return

    let disposed = false

    const mountEpub = async () => {
      try {
        setEpubError('')
        setIsEpubReady(false)
        setTocEntries([])
        await loadEpubScript()

        if (disposed || !window.ePub || !epubContainerRef.current) return

        const assetResponse = await fetch(resolvedAssetUrl, { credentials: 'include' })
        if (!assetResponse.ok) {
          throw new Error(`Failed to load eBook asset (${assetResponse.status})`)
        }

        const epubBuffer = await assetResponse.arrayBuffer()
        const detectedFormat = detectAssetFormat(epubBuffer)
        if (detectedFormat === 'PDF') {
          setFormatOverride('PDF')
          showMessage('Detected PDF file. Opening in PDF reader.')
          return
        }
        const book = window.ePub(epubBuffer)
        bookRef.current = book
        await book.ready

        const navigationToc = (book.navigation?.toc ?? []) as TocEntry[]
        setTocEntries(Array.isArray(navigationToc) ? navigationToc : [])

        const rendition = book.renderTo(epubContainerRef.current, {
          width: '100%',
          height: '100%',
          spread: settings.pageView === 'spread' ? 'auto' : 'none',
          flow: 'paginated',
          allowScriptedContent: true,
        })

        renditionRef.current = rendition
        setIsEpubReady(true)
        const syncRenderedTypography = () => applyEpubTypography(rendition)
        rendition.on('rendered', syncRenderedTypography)
        rendition.on('click', () => {
          window.setTimeout(() => {
            const hasActiveSelection = (rendition.getContents?.() ?? []).some((entry: any) => {
              const selection = entry?.window?.getSelection?.()
              if (!selection) return false
              return !selection.isCollapsed && selection.toString().trim().length > 0
            })
            if (hasActiveSelection) return
            if (Date.now() < suppressSelectionDismissUntilRef.current) return
            setEpubSelectionActionAnchor(null)
          }, 0)
        })

        await rendition.display(initialLocationCfi)
        syncRenderedTypography()

        try {
          await book.locations.generate(1200)
        } catch (error) {
          console.warn('[EPUB] Could not generate location map:', error)
        }

        rendition.on('selected', (cfiRange: string, contents: any) => {
          const selectedText = contents?.window?.getSelection?.()?.toString()?.trim() ?? ''
          if (!selectedText) return

          const stageRect = readerStageRef.current?.getBoundingClientRect()
          let anchorX = 160
          let anchorY = 84
          if (stageRect) {
            try {
              const selection = contents?.window?.getSelection?.()
              const range = selection?.rangeCount ? selection.getRangeAt(0) : null
              const rect = range?.getBoundingClientRect?.()
              const frame = contents?.document?.defaultView?.frameElement as HTMLElement | null
              const frameRect = frame?.getBoundingClientRect?.()
              if (rect) {
                const left = frameRect ? frameRect.left + rect.left : rect.left
                const top = frameRect ? frameRect.top + rect.top : rect.top
                anchorX = left - stageRect.left + (rect.width / 2)
                anchorY = top - stageRect.top - 12
              }
            } catch {
              // best effort
            }
            anchorX = Math.max(74, Math.min(stageRect.width - 74, anchorX))
            anchorY = Math.max(72, Math.min(stageRect.height - 48, anchorY))
          }

          setEpubSelectedHighlight({
            cfiRange,
            text: selectedText.slice(0, 400),
          })
          setEpubSelectionActionAnchor({ x: anchorX, y: anchorY })
          suppressSelectionDismissUntilRef.current = Date.now() + 1200
        })

        rendition.on('relocated', (location: any) => {
          const cfi = location?.start?.cfi as string | undefined
          if (!cfi) return

          const now = Date.now()
          const last = lastRelocationSyncRef.current
          if ((last.cfi === cfi && now - last.at < 4000) || now - last.at < 3000) return
          lastRelocationSyncRef.current = { cfi, at: now }

          let percent: number | undefined
          let rawPercent: number | undefined
          if (typeof book.locations?.percentageFromCfi === 'function') {
            try {
              const raw = Number(book.locations.percentageFromCfi(cfi))
              if (Number.isFinite(raw) && raw >= 0) {
                rawPercent = Math.min(1, Math.max(0, raw))
                percent = Number((raw * 100).toFixed(2))
              }
            } catch {
              rawPercent = undefined
              percent = undefined
            }
          }

          const total = totalPagesRef.current
          const page = total && typeof rawPercent === 'number'
            ? Math.min(total, Math.max(1, Math.floor(rawPercent * total) + 1))
            : undefined

          latestCfiRef.current = cfi
          latestPercentRef.current = percent

          if (typeof page === 'number') {
            latestPageRef.current = page
            setPageInput(String(page))
          }
          writeLastPosition(bookId, {
            page: typeof page === 'number' ? page : latestPageRef.current,
            locationCfi: cfi,
            percent,
          })

          void queueProgressSave({
            payload: {
              bookId,
              page,
              locationCfi: cfi,
              percent,
            },
            silent: true,
          })
        })
      } catch (error) {
        setEpubError(getErrorMessage(error))
        setIsEpubReady(false)
      }
    }

    appliedHighlightsRef.current = new Set()
    void mountEpub()

    return () => {
      disposed = true
      try {
        renditionRef.current?.destroy?.()
      } catch {
        // ignore
      }
      renditionRef.current = null
      bookRef.current = null
      setIsEpubReady(false)
      setTocEntries([])
    }
  }, [
    applyEpubTypography,
    bookId,
    epubContainerReady,
    inferredFormat,
    initialLocationCfi,
    latestCfiRef,
    latestPageRef,
    latestPercentRef,
    queueProgressSave,
    readerStageRef,
    resolvedAssetUrl,
    setFormatOverride,
    setPageInput,
    settings.pageView,
    showMessage,
    totalPagesRef,
    writeLastPosition,
  ])

  useEffect(() => {
    if (inferredFormat !== 'EPUB' || !isEpubReady || !renditionRef.current) return
    const rendition = renditionRef.current
    const targetCfi = latestCfiRef.current
    applyEpubTheme(rendition)
    rendition.spread?.(settings.pageView === 'spread' ? 'auto' : 'none')
    applyEpubTypography(rendition)
    if (targetCfi) {
      void rendition.display(targetCfi).catch(() => {
        // keep current view
      })
    }
  }, [applyEpubTheme, applyEpubTypography, inferredFormat, isEpubReady, latestCfiRef, settings])

  useEffect(() => {
    if (inferredFormat !== 'EPUB' || !isEpubReady || !renditionRef.current) return
    const rendition = renditionRef.current
    for (const highlight of ebookHighlights ?? []) {
      const key = `hl-${highlight.id}`
      if (appliedHighlightsRef.current.has(key)) continue
      appliedHighlightsRef.current.add(key)
      rendition.annotations.add('highlight', highlight.startCfi, {}, undefined, key, {
        fill: highlight.color || 'yellow',
        'fill-opacity': '0.35',
      })
    }
  }, [ebookHighlights, inferredFormat, isEpubReady])

  useEffect(() => {
    if (inferredFormat !== 'EPUB') {
      setEpubSelectionActionAnchor(null)
      return
    }
    if (!epubSelectedHighlight?.cfiRange) {
      setEpubSelectionActionAnchor(null)
    }
  }, [epubSelectedHighlight?.cfiRange, inferredFormat])

  useEffect(() => {
    return () => {
      if (turnFallbackTimerRef.current) {
        window.clearTimeout(turnFallbackTimerRef.current)
        turnFallbackTimerRef.current = null
      }
    }
  }, [])

  const saveEpubHighlight = useCallback(async (
    color: HighlightStyle,
    createHighlight: (payload: {
      bookId: string
      page: number
      startCfi: string
      textSnippet: string
      color: HighlightStyle
    }) => Promise<unknown>,
    page: number,
  ) => {
    if (!epubSelectedHighlight?.cfiRange) return false
    const swatch = getHighlightSwatch(color)
    await createHighlight({
      bookId,
      page,
      startCfi: epubSelectedHighlight.cfiRange,
      textSnippet: epubSelectedHighlight.text.slice(0, 400),
      color,
    })
    renditionRef.current?.annotations?.add?.(
      'highlight',
      epubSelectedHighlight.cfiRange,
      {},
      undefined,
      `hl-${Date.now()}`,
      {
        fill: swatch,
        'fill-opacity': color === 'underline' ? '0.08' : '0.35',
      },
    )
    setEpubSelectedHighlight(null)
    return true
  }, [bookId, epubSelectedHighlight])

  return {
    epubError,
    isTurningPage,
    isEpubReady,
    tocSearch,
    setTocSearch,
    filteredToc,
    isSearchingText,
    searchResults,
    epubSelectedHighlight,
    epubSelectionActionAnchor,
    setEpubSelectionActionAnchor,
    setEpubContainer,
    bookRef,
    renditionRef,
    goToPrevPage,
    goToNextPage,
    jumpToEpubToc,
    runEpubTextSearch,
    jumpToSearchResult,
    handleEpubWheel,
    clearSelectionAction,
    saveEpubHighlight,
  }
}

export default useEpubReader
