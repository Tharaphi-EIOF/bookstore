import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import {
  useCreateEbookBookmark,
  useCreateEbookHighlight,
  useCreateEbookNote,
  useDeleteEbookBookmark,
  useDeleteEbookNote,
  useEbookState,
  useOpenEbook,
  useUpdateEbookProgress,
} from '@/services/reading'
import type { EbookState } from '@/services/reading'
import {
  API_BASE_URL,
  defaultSettings,
  formatSavedTime,
  getReaderSettingsKey,
  makePdfSelectionStartRef,
  QUICK_DICTIONARY,
  readLastPosition,
  readSettings,
  writeLastPosition,
  type DictionaryLookup,
  type HighlightStyle,
  type ReaderAssetFormat,
  type ReaderLastPosition,
  type ReaderSettings,
  type SaveJob,
  type SaveState,
} from '@/features/book-reader/lib/readerHelpers'
import useEpubReader from '@/features/book-reader/hooks/useEpubReader'
import usePdfReader from '@/features/book-reader/hooks/usePdfReader'
import { getErrorMessage } from '@/lib/api'

export const useBookReaderController = () => {
  const { id: bookId = '' } = useParams()
  const { data: openData, isLoading: isOpenLoading } = useOpenEbook(bookId, !!bookId)
  const { data: ebookState, isLoading: isStateLoading } = useEbookState(bookId, !!bookId)

  const updateProgress = useUpdateEbookProgress()
  const createBookmark = useCreateEbookBookmark()
  const deleteBookmark = useDeleteEbookBookmark()
  const createNote = useCreateEbookNote()
  const deleteNote = useDeleteEbookNote()
  const createHighlight = useCreateEbookHighlight()

  const [pageInput, setPageInput] = useState('1')
  const [noteInput, setNoteInput] = useState('')
  const [feedback, setFeedback] = useState('')
  const [settings, setSettings] = useState<ReaderSettings>(defaultSettings)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isTocOpen, setIsTocOpen] = useState(false)
  const [isHelpOpen, setIsHelpOpen] = useState(false)
  const [helpPanelMode, setHelpPanelMode] = useState<'notes' | 'highlights'>('notes')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [bookmarkItems, setBookmarkItems] = useState<EbookState['bookmarks']>([])
  const [dictionaryWord, setDictionaryWord] = useState('')
  const [dictionaryDefinition, setDictionaryDefinition] = useState('')
  const [dictionaryPhonetic, setDictionaryPhonetic] = useState('')
  const [dictionaryAudioUrl, setDictionaryAudioUrl] = useState('')
  const [isDictionaryLoading, setIsDictionaryLoading] = useState(false)
  const [isDictionaryOpen, setIsDictionaryOpen] = useState(false)
  const [speechRate, setSpeechRate] = useState(1)
  const [selectedVoiceUri, setSelectedVoiceUri] = useState('')
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([])
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [scrubValue, setScrubValue] = useState(0)
  const [highlightColor, setHighlightColor] = useState<HighlightStyle>('yellow')
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false)
  const [formatOverride, setFormatOverride] = useState<ReaderAssetFormat>('')

  const readerShellRef = useRef<HTMLDivElement | null>(null)
  const readerStageRef = useRef<HTMLDivElement | null>(null)
  const toolbarAreaRef = useRef<HTMLDivElement | null>(null)
  const panelRef = useRef<HTMLDivElement | null>(null)
  const selectionActionRef = useRef<HTMLDivElement | null>(null)
  const pageInputRef = useRef(pageInput)
  const latestCfiRef = useRef<string | undefined>(undefined)
  const latestPercentRef = useRef<number | undefined>(undefined)
  const latestPageRef = useRef<number>(1)
  const totalPagesRef = useRef<number | null>(null)
  const lastPositionRef = useRef<ReaderLastPosition | null>(null)
  const resolvedProgressConflictRef = useRef(false)
  const dictionaryLookupTokenRef = useRef(0)
  const dictionaryAudioRef = useRef<HTMLAudioElement | null>(null)
  const saveInFlightRef = useRef(false)
  const pendingSaveRef = useRef<SaveJob | null>(null)
  const touchStartXRef = useRef<number | null>(null)
  const touchStartYRef = useRef<number | null>(null)
  const touchStartAtRef = useRef<number>(0)
  const sessionStartAtRef = useRef<string>(new Date().toISOString())

  const currentPage = ebookState?.progress?.page ?? openData?.progress?.page ?? 1
  const totalPages = ebookState?.book?.totalPages ?? openData?.totalPages ?? null
  const progressPercent = ebookState?.progress?.percent ?? openData?.progress?.percent ?? 0

  const showMessage = useCallback((message: string) => {
    setFeedback(message)
    window.setTimeout(() => setFeedback(''), 2400)
  }, [])

  const closeReaderPanels = useCallback(() => {
    setIsTocOpen(false)
    setIsSearchOpen(false)
    setIsSettingsOpen(false)
    setIsHelpOpen(false)
  }, [])

  const toggleReaderPanel = useCallback((panel: 'toc' | 'search' | 'settings' | 'notes' | 'highlights') => {
    epub.clearSelectionAction()
    const wantsHelpPanel = panel === 'notes' || panel === 'highlights'
    const nextHelpMode = panel === 'highlights' ? 'highlights' : 'notes'
    const shouldToggleOffHelp = wantsHelpPanel && isHelpOpen && helpPanelMode === nextHelpMode
    const next = {
      toc: panel === 'toc' ? !isTocOpen : false,
      search: panel === 'search' ? !isSearchOpen : false,
      settings: panel === 'settings' ? !isSettingsOpen : false,
      notes: wantsHelpPanel ? !shouldToggleOffHelp : false,
    }
    if (wantsHelpPanel) {
      setHelpPanelMode(nextHelpMode)
    }
    setIsTocOpen(next.toc)
    setIsSearchOpen(next.search)
    setIsSettingsOpen(next.settings)
    setIsHelpOpen(next.notes)
  }, [helpPanelMode, isHelpOpen, isSearchOpen, isSettingsOpen, isTocOpen])

  const applyReaderPreset = useCallback((presetId: ReaderSettings['stylePresetId']) => {
    setSettings((prev) => ({
      ...prev,
      stylePresetId: presetId,
    }))
  }, [])

  const queueProgressSave = useCallback(async (job: SaveJob) => {
    pendingSaveRef.current = job
    if (saveInFlightRef.current) return

    saveInFlightRef.current = true
    while (pendingSaveRef.current) {
      const next = pendingSaveRef.current
      pendingSaveRef.current = null
      setSaveState('saving')
      try {
        let lastError: unknown = null
        let success = false
        for (let attempt = 0; attempt < 3; attempt += 1) {
          try {
            await updateProgress.mutateAsync({
              ...next.payload,
              sessionStartAt: sessionStartAtRef.current,
            })
            success = true
            break
          } catch (error) {
            lastError = error
            if (attempt < 2) {
              await new Promise((resolve) => window.setTimeout(resolve, 300 * (attempt + 1)))
            }
          }
        }
        if (!success) {
          throw lastError ?? new Error('Save failed')
        }
        setSaveState('idle')
        setLastSavedAt(new Date().toISOString())
        if (!next.silent) {
          showMessage('Progress saved.')
        }
      } catch (error) {
        setSaveState('error')
        if (!next.silent) {
          showMessage(getErrorMessage(error))
        }
      }
    }
    saveInFlightRef.current = false
  }, [showMessage, updateProgress])

  const resolvedAssetUrl = useMemo(() => {
    if (!openData?.contentUrl) return ''
    if (openData.contentUrl.startsWith('http')) return openData.contentUrl
    return `${API_BASE_URL}${openData.contentUrl}`
  }, [openData?.contentUrl])

  const ebookFormat = (openData?.ebookFormat ?? '').trim().toUpperCase()
  const inferredFormat = useMemo<ReaderAssetFormat>(() => {
    if (formatOverride) return formatOverride
    if (ebookFormat === 'EPUB' || ebookFormat === 'PDF') return ebookFormat
    const lowerUrl = resolvedAssetUrl.toLowerCase()
    if (lowerUrl.endsWith('.epub')) return 'EPUB'
    if (lowerUrl.endsWith('.pdf')) return 'PDF'
    return ''
  }, [ebookFormat, formatOverride, resolvedAssetUrl])

  useEffect(() => {
    setFormatOverride('')
  }, [bookId, openData?.contentUrl, openData?.ebookFormat])

  useEffect(() => {
    sessionStartAtRef.current = new Date().toISOString()
  }, [bookId])

  const epub = useEpubReader({
    bookId,
    inferredFormat,
    resolvedAssetUrl,
    settings,
    totalPages,
    ebookHighlights: ebookState?.highlights ?? [],
    initialLocationCfi: lastPositionRef.current?.locationCfi || ebookState?.progress?.locationCfi || undefined,
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
  })

  const pdf = usePdfReader({
    bookId,
    inferredFormat,
    resolvedAssetUrl,
    settings,
    ebookState,
    openProgressPage: openData?.progress?.page,
    lastPositionRef,
    latestPageRef,
    setPageInput,
    setFormatOverride,
    showMessage,
    queueProgressSave,
    writeLastPosition,
  })

  const activePresetId = settings.stylePresetId

  const lookupDictionary = useCallback(async (rawText: string) => {
    const cleaned = rawText.trim().toLowerCase().replace(/^[^a-z]+|[^a-z]+$/g, '')
    if (!cleaned) return
    const lookupToken = dictionaryLookupTokenRef.current + 1
    dictionaryLookupTokenRef.current = lookupToken
    setDictionaryWord(cleaned)
    setDictionaryDefinition('')
    setDictionaryPhonetic('')
    setDictionaryAudioUrl('')
    setIsDictionaryOpen(true)
    setIsDictionaryLoading(true)

    const fallback: DictionaryLookup = {
      definition:
        QUICK_DICTIONARY[cleaned]
        || `No built-in definition for "${cleaned}". Tip: long-press and search web/dictionary for full context.`,
      source: 'fallback',
    }

    try {
      const response = await fetch(
        `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleaned)}`,
      )
      if (!response.ok) {
        throw new Error('Dictionary request failed')
      }
      const payload = await response.json()
      const first = Array.isArray(payload) ? payload[0] : null
      const phonetics = Array.isArray(first?.phonetics) ? first.phonetics : []
      const meanings = Array.isArray(first?.meanings) ? first.meanings : []
      const firstMeaning = meanings[0]
      const definitions = Array.isArray(firstMeaning?.definitions) ? firstMeaning.definitions : []
      const firstDefinition = definitions[0]

      if (dictionaryLookupTokenRef.current !== lookupToken) return
      setDictionaryDefinition(firstDefinition?.definition || fallback.definition)
      setDictionaryPhonetic(first?.phonetic || phonetics.find((item: any) => item?.text)?.text || '')
      setDictionaryAudioUrl(phonetics.find((item: any) => item?.audio)?.audio || '')
      setIsDictionaryLoading(false)
    } catch {
      if (dictionaryLookupTokenRef.current !== lookupToken) return
      setDictionaryDefinition(fallback.definition)
      setDictionaryPhonetic('')
      setDictionaryAudioUrl('')
      setIsDictionaryLoading(false)
    }
  }, [])

  const playDictionaryAudio = useCallback(() => {
    if (!dictionaryAudioUrl) return
    try {
      dictionaryAudioRef.current?.pause()
      const audio = new Audio(dictionaryAudioUrl)
      dictionaryAudioRef.current = audio
      void audio.play()
    } catch {
      showMessage('Unable to play pronunciation audio.')
    }
  }, [dictionaryAudioUrl, showMessage])

  const stopReadAloud = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    window.speechSynthesis.cancel()
    setIsSpeaking(false)
  }, [])

  const speakCurrentEpubView = useCallback(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      showMessage('Text-to-speech is not supported in this browser.')
      return
    }
    if (inferredFormat !== 'EPUB' || !epub.renditionRef.current) {
      showMessage('Read aloud currently supports EPUB pages.')
      return
    }

    const contents = typeof epub.renditionRef.current.getContents === 'function'
      ? epub.renditionRef.current.getContents()
      : []
    const text = (contents ?? [])
      .map((entry: any) => entry?.document?.body?.innerText || '')
      .join('\n')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 5000)

    if (!text) {
      showMessage('No readable text on this page yet.')
      return
    }

    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = speechRate
    if (selectedVoiceUri) {
      const voice = availableVoices.find((item) => item.voiceURI === selectedVoiceUri)
      if (voice) {
        utterance.voice = voice
      }
    }
    utterance.onstart = () => setIsSpeaking(true)
    utterance.onend = () => setIsSpeaking(false)
    utterance.onerror = () => setIsSpeaking(false)
    window.speechSynthesis.speak(utterance)
  }, [availableVoices, epub.renditionRef, inferredFormat, selectedVoiceUri, showMessage, speechRate])

  const handleReaderTouchStart = useCallback((event: any) => {
    if (event.touches.length !== 1) return
    touchStartXRef.current = event.touches[0].clientX
    touchStartYRef.current = event.touches[0].clientY
    touchStartAtRef.current = Date.now()
  }, [])

  const handleReaderTouchMove = useCallback((event: any) => {
    if (event.touches.length !== 1) return
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    if (startX === null || startY === null) return

    const deltaX = event.touches[0].clientX - startX
    const deltaY = event.touches[0].clientY - startY
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 12) {
      event.preventDefault()
    }
  }, [])

  const handleReaderTouchEnd = useCallback(async (event: any) => {
    const startX = touchStartXRef.current
    const startY = touchStartYRef.current
    touchStartXRef.current = null
    touchStartYRef.current = null
    if (startX === null || startY === null) return

    const elapsed = Date.now() - touchStartAtRef.current
    if (elapsed > 800) return

    const activeTouch = event.changedTouches?.[0]
    if (!activeTouch) return

    const deltaX = activeTouch.clientX - startX
    const deltaY = activeTouch.clientY - startY
    if (Math.abs(deltaX) < 48 || Math.abs(deltaX) <= Math.abs(deltaY)) return

    if (deltaX < 0) {
      await (inferredFormat === 'PDF' ? pdf.goToNextPdfPage() : epub.goToNextPage())
    } else {
      await (inferredFormat === 'PDF' ? pdf.goToPrevPdfPage() : epub.goToPrevPage())
    }
  }, [epub, inferredFormat, pdf])

  const toggleFullscreen = useCallback(async () => {
    const container = readerStageRef.current ?? readerShellRef.current
    if (!container || typeof document === 'undefined') return
    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen()
      } else {
        await container.requestFullscreen()
      }
    } catch {
      showMessage('Fullscreen is not available in this browser.')
    }
  }, [showMessage])

  const handleScrubCommit = useCallback(async () => {
    if (inferredFormat === 'PDF') {
      if (!pdf.pdfPageCount || !pdf.isPdfReady) return
      const ok = await pdf.jumpToPdfPage(Math.min(pdf.pdfPageCount, Math.max(1, Math.round(scrubValue))))
      if (!ok) {
        showMessage('Unable to jump to that page.')
      }
      return
    }

    if (inferredFormat === 'EPUB' && epub.bookRef.current && epub.renditionRef.current) {
      const rawPercent = Math.min(100, Math.max(0, scrubValue)) / 100
      const percentageToCfi = epub.bookRef.current.locations?.cfiFromPercentage
        || epub.bookRef.current.locations?.percentageToCfi
      if (typeof percentageToCfi !== 'function') {
        showMessage('Reader map is still loading. Try again in a moment.')
        return
      }
      try {
        const cfi = percentageToCfi(rawPercent)
        await epub.renditionRef.current.display(cfi)
        writeLastPosition(bookId, {
          page: latestPageRef.current,
          locationCfi: cfi,
          percent: Number((rawPercent * 100).toFixed(2)),
        })
      } catch {
        showMessage('Unable to jump to that location.')
      }
    }
  }, [bookId, epub.bookRef, epub.renditionRef, inferredFormat, pdf, scrubValue, showMessage])

  const handleAddBookmark = useCallback(async () => {
    const page = Number(pageInput || currentPage)
    if (Number.isNaN(page) || page < 1) {
      showMessage('Select a valid page first.')
      return
    }

    try {
      const bookmark = await createBookmark.mutateAsync({
        bookId,
        page,
        locationCfi: inferredFormat === 'EPUB' ? latestCfiRef.current : undefined,
        label: `Page ${page}`,
      })
      setBookmarkItems((prev) => [bookmark, ...prev.filter((item) => item.id !== bookmark.id)])
      showMessage('Bookmark saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }, [bookId, createBookmark, currentPage, inferredFormat, pageInput, showMessage])

  const jumpToBookmark = useCallback(async (bookmark: EbookState['bookmarks'][number]) => {
    const targetPage = Math.max(1, Number(bookmark.page || 1))

    if (inferredFormat === 'PDF') {
      const opened = await pdf.jumpToPdfPage(targetPage)
      if (!opened) {
        showMessage('Unable to open bookmark.')
        return
      }
      closeReaderPanels()
      return
    }

    if (inferredFormat !== 'EPUB' || !epub.renditionRef.current) {
      showMessage('Unable to open bookmark.')
      return
    }

    try {
      const percentageToCfi = epub.bookRef.current?.locations?.cfiFromPercentage
        || epub.bookRef.current?.locations?.percentageToCfi
      let cfi = bookmark.locationCfi || undefined

      if (!cfi && totalPages && typeof percentageToCfi === 'function') {
        const rawPercent = Math.min(1, Math.max(0, (targetPage - 1) / Math.max(1, totalPages)))
        cfi = percentageToCfi(rawPercent)
      }

      if (!cfi) {
        showMessage('Bookmark location is unavailable.')
        return
      }

      await epub.renditionRef.current.display(cfi)
      setPageInput(String(targetPage))
      writeLastPosition(bookId, {
        page: targetPage,
        locationCfi: cfi,
        percent: totalPages ? Number(((targetPage / totalPages) * 100).toFixed(2)) : undefined,
      })
      await queueProgressSave({
        payload: {
          bookId,
          page: targetPage,
          locationCfi: cfi,
          percent: totalPages ? Number(((targetPage / totalPages) * 100).toFixed(2)) : undefined,
        },
        silent: true,
      })
      closeReaderPanels()
    } catch {
      showMessage('Unable to open bookmark.')
    }
  }, [bookId, closeReaderPanels, epub.bookRef, epub.renditionRef, inferredFormat, pdf, queueProgressSave, setPageInput, showMessage, totalPages])

  const handleAddNote = useCallback(async () => {
    const content = noteInput.trim()
    if (!content) {
      showMessage('Note cannot be empty.')
      return
    }

    const page = Number(pageInput || currentPage)
    try {
      await createNote.mutateAsync({
        bookId,
        page: Number.isNaN(page) ? currentPage : page,
        content,
      })
      setNoteInput('')
      showMessage('Note saved.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }, [bookId, createNote, currentPage, noteInput, pageInput, showMessage])

  const handleAddPdfHighlight = useCallback(async () => {
    if (inferredFormat !== 'PDF') return
    const page = Math.max(1, (pdf.pdfSelectedPage ?? pdf.pdfPageNumber ?? 1))
    const hasSelection = pdf.pdfSelectedRects.length > 0 && !!pdf.pdfSelectedText
    const snippet =
      (hasSelection ? pdf.pdfSelectedText : noteInput.trim()).slice(0, 400)
      || `Highlighted page ${page}`
    const startCfi = hasSelection
      ? makePdfSelectionStartRef(page, pdf.pdfSelectedRects)
      : `pdf:page:${page}:manual:${Date.now()}`

    try {
      await createHighlight.mutateAsync({
        bookId,
        page,
        startCfi,
        textSnippet: snippet,
        color: highlightColor,
      })
      if (hasSelection) {
        window.getSelection?.()?.removeAllRanges?.()
      }
      showMessage(`Page ${page} highlighted.`)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }, [bookId, createHighlight, highlightColor, inferredFormat, noteInput, pdf.pdfPageNumber, pdf.pdfSelectedPage, pdf.pdfSelectedRects, pdf.pdfSelectedText, showMessage])

  const handleAddEpubHighlight = useCallback(async () => {
    if (inferredFormat !== 'EPUB') return
    if (!epub.epubSelectedHighlight?.cfiRange) {
      showMessage('Select text first, then tap highlight.')
      return
    }
    const page = Number(pageInputRef.current)
    const payloadPage = Number.isNaN(page) ? latestPageRef.current : page
    try {
      const saved = await epub.saveEpubHighlight(
        highlightColor,
        (payload) => createHighlight.mutateAsync(payload),
        payloadPage,
      )
      if (saved) {
        showMessage('Highlight saved.')
      }
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }, [createHighlight, epub, highlightColor, inferredFormat, showMessage])

  const handleSelectionDictionaryLookup = useCallback(() => {
    const selectedText = epub.epubSelectedHighlight?.text?.trim() ?? ''
    if (!selectedText) {
      showMessage('Select text first.')
      return
    }
    const firstWord = selectedText.split(/\s+/).find(Boolean) ?? ''
    if (!firstWord) {
      showMessage('Pick a word to lookup.')
      return
    }
    void lookupDictionary(firstWord)
    epub.clearSelectionAction()
  }, [epub, lookupDictionary, showMessage])

  const handleSelectionHighlight = useCallback(async () => {
    await handleAddEpubHighlight()
    epub.clearSelectionAction()
  }, [epub, handleAddEpubHighlight])

  const deleteBookmarkItem = useCallback(async (bookmarkId: string) => {
    try {
      await deleteBookmark.mutateAsync({ bookId, bookmarkId })
      setBookmarkItems((prev) => prev.filter((item) => item.id !== bookmarkId))
      showMessage('Bookmark removed.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }, [bookId, deleteBookmark, showMessage])

  const deleteNoteItem = useCallback(async (noteId: string) => {
    try {
      await deleteNote.mutateAsync({ bookId, noteId })
      showMessage('Note removed.')
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }, [bookId, deleteNote, showMessage])

  useEffect(() => {
    setPageInput(String(currentPage))
    latestPageRef.current = currentPage
  }, [currentPage])

  useEffect(() => {
    latestCfiRef.current = ebookState?.progress?.locationCfi || undefined
    latestPercentRef.current = ebookState?.progress?.percent
  }, [ebookState?.progress?.locationCfi, ebookState?.progress?.percent])

  useEffect(() => {
    setBookmarkItems(ebookState?.bookmarks ?? [])
  }, [ebookState?.bookmarks])

  useEffect(() => {
    pageInputRef.current = pageInput
  }, [pageInput])

  useEffect(() => {
    totalPagesRef.current = totalPages
  }, [totalPages])

  useEffect(() => {
    if (typeof window === 'undefined') return
    window.localStorage.setItem(getReaderSettingsKey(bookId), JSON.stringify(settings))
  }, [bookId, settings])

  useEffect(() => {
    setSettings(readSettings(bookId))
    const cached = readLastPosition(bookId)
    lastPositionRef.current = cached
    latestCfiRef.current = cached?.locationCfi || undefined
    if (typeof cached?.page === 'number' && cached.page > 0) {
      latestPageRef.current = cached.page
      setPageInput(String(cached.page))
    } else {
      latestPageRef.current = 1
      setPageInput('1')
    }
    if (typeof cached?.percent === 'number') {
      latestPercentRef.current = cached.percent
    }
  }, [bookId])

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return
    const loadVoices = () => {
      const voices = window.speechSynthesis.getVoices() || []
      setAvailableVoices(voices)
      if (!selectedVoiceUri && voices.length > 0) {
        setSelectedVoiceUri(voices[0].voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      window.speechSynthesis.onvoiceschanged = null
    }
  }, [selectedVoiceUri])

  useEffect(() => {
    const local = lastPositionRef.current
    const serverPage = ebookState?.progress?.page ?? openData?.progress?.page
    if (!local || !serverPage || typeof local.page !== 'number') {
      resolvedProgressConflictRef.current = false
      return
    }
    if (resolvedProgressConflictRef.current) return

    if (local.page > serverPage + 1) {
      resolvedProgressConflictRef.current = true
      void queueProgressSave({
        payload: {
          bookId,
          page: local.page,
          locationCfi: local.locationCfi,
          percent: local.percent,
        },
        silent: true,
      })
      return
    }

    if (serverPage > local.page + 1) {
      const serverPosition = {
        page: serverPage,
        locationCfi: ebookState?.progress?.locationCfi ?? openData?.progress?.locationCfi ?? undefined,
        percent: ebookState?.progress?.percent ?? openData?.progress?.percent ?? undefined,
      }
      writeLastPosition(bookId, serverPosition)
      lastPositionRef.current = serverPosition
      resolvedProgressConflictRef.current = true
    }
  }, [
    bookId,
    ebookState?.progress?.locationCfi,
    ebookState?.progress?.page,
    ebookState?.progress?.percent,
    openData?.progress?.locationCfi,
    openData?.progress?.page,
    openData?.progress?.percent,
    queueProgressSave,
  ])

  useEffect(() => {
    const onFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement))
    }
    document.addEventListener('fullscreenchange', onFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange)
  }, [])

  useEffect(() => {
    if (!(isTocOpen || isSearchOpen || isSettingsOpen || isHelpOpen)) return

    const handleOutsideInteraction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (panelRef.current?.contains(target)) return
      if (toolbarAreaRef.current?.contains(target)) return
      if (selectionActionRef.current?.contains(target)) return
      closeReaderPanels()
      epub.clearSelectionAction()
    }

    document.addEventListener('mousedown', handleOutsideInteraction)
    document.addEventListener('touchstart', handleOutsideInteraction)
    return () => {
      document.removeEventListener('mousedown', handleOutsideInteraction)
      document.removeEventListener('touchstart', handleOutsideInteraction)
    }
  }, [closeReaderPanels, epub, isHelpOpen, isSearchOpen, isSettingsOpen, isTocOpen])

  useEffect(() => {
    if (!epub.epubSelectionActionAnchor) return

    const handleOutsideSelectionAction = (event: MouseEvent | TouchEvent) => {
      const target = event.target as Node | null
      if (!target) return
      if (selectionActionRef.current?.contains(target)) return
      epub.clearSelectionAction()
    }

    document.addEventListener('mousedown', handleOutsideSelectionAction)
    document.addEventListener('touchstart', handleOutsideSelectionAction)
    return () => {
      document.removeEventListener('mousedown', handleOutsideSelectionAction)
      document.removeEventListener('touchstart', handleOutsideSelectionAction)
    }
  }, [epub])

  useEffect(() => {
    if (inferredFormat === 'PDF') {
      setScrubValue(pdf.pdfPageNumber)
      return
    }
    if (inferredFormat === 'EPUB') {
      setScrubValue(Number(progressPercent.toFixed(0)))
    }
  }, [inferredFormat, pdf.pdfPageNumber, progressPercent])

  useEffect(() => {
    if (inferredFormat !== 'EPUB') return

    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea') return

      if (event.key === 'ArrowRight' || event.key === 'PageDown' || event.key === ' ') {
        event.preventDefault()
        void epub.goToNextPage()
      }
      if (event.key === 'ArrowLeft' || event.key === 'PageUp') {
        event.preventDefault()
        void epub.goToPrevPage()
      }
      if (event.key.toLowerCase() === 't') {
        event.preventDefault()
        toggleReaderPanel('toc')
      }
      if (event.key.toLowerCase() === 's') {
        event.preventDefault()
        toggleReaderPanel('settings')
      }
      if (event.key === '/') {
        event.preventDefault()
        toggleReaderPanel('search')
      }
      if (event.key.toLowerCase() === 'f') {
        event.preventDefault()
        void toggleFullscreen()
      }
      if (event.key === '?') {
        event.preventDefault()
        toggleReaderPanel('notes')
      }
      if (event.key === 'Escape') {
        closeReaderPanels()
        setIsDictionaryOpen(false)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [closeReaderPanels, epub, inferredFormat, toggleFullscreen, toggleReaderPanel])

  useEffect(() => {
    if (!isSearchOpen || inferredFormat !== 'EPUB') return
    const id = window.setTimeout(() => {
      void epub.runEpubTextSearch(searchQuery)
    }, 220)
    return () => window.clearTimeout(id)
  }, [epub, inferredFormat, isSearchOpen, searchQuery])

  useEffect(() => {
    const id = window.setInterval(() => {
      if (inferredFormat === 'EPUB' && latestCfiRef.current) {
        void queueProgressSave({
          payload: {
            bookId,
            page: latestPageRef.current,
            locationCfi: latestCfiRef.current,
            percent: latestPercentRef.current,
          },
          silent: true,
        })
        return
      }

      if (inferredFormat === 'PDF' && pdf.isPdfReady) {
        const page = latestPageRef.current
        void queueProgressSave({
          payload: {
            bookId,
            page,
            percent: pdf.pdfPageCount ? Number(((page / pdf.pdfPageCount) * 100).toFixed(2)) : undefined,
          },
          silent: true,
        })
      }
    }, 20000)

    return () => window.clearInterval(id)
  }, [bookId, inferredFormat, pdf.isPdfReady, pdf.pdfPageCount, queueProgressSave])

  useEffect(() => {
    const onBeforeUnload = () => {
      if (inferredFormat === 'EPUB' && latestCfiRef.current) {
        void queueProgressSave({
          payload: {
            bookId,
            page: latestPageRef.current,
            locationCfi: latestCfiRef.current,
            percent: latestPercentRef.current,
          },
          silent: true,
        })
      }
    }

    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [bookId, inferredFormat, queueProgressSave])

  useEffect(() => {
    return () => {
      stopReadAloud()
      dictionaryAudioRef.current?.pause()
    }
  }, [stopReadAloud])

  const isInitialLoading = !openData && !ebookState && (isOpenLoading || isStateLoading)
  const canNavigateEpub = inferredFormat === 'EPUB' && !!epub.renditionRef.current && !epub.isTurningPage

  const paperToneClass =
    settings.theme === 'night'
      ? 'bg-[#121212]'
      : settings.theme === 'sepia'
        ? 'bg-[#f6f0df]'
        : 'bg-[#fffdf7]'

  const isLightReaderTheme = settings.theme === 'paper'
  const toolbarShellClass = isLightReaderTheme
    ? 'border-[#8f7a57] bg-[rgba(47,41,33,0.94)]'
    : 'border-[#8a7552] bg-[rgba(47,41,33,0.9)]'
  const toolbarButtonIdleClass = isLightReaderTheme
    ? 'text-[#fff8ee] hover:bg-white/15'
    : 'text-[#e8dbc8] hover:bg-white/12'
  const toolbarButtonActiveClass = isLightReaderTheme
    ? 'bg-white/24 text-[#ffffff]'
    : 'bg-white/15 text-[#f7f1e6]'
  const panelShellClass = isLightReaderTheme
    ? 'border-[#8f7a57] bg-[#fffaf1]/94 text-[#2a241c]'
    : 'border-[#8a7552] bg-[#241f18]/88 text-[#f0e8da]'
  const panelMutedTextClass = isLightReaderTheme ? 'text-[#6a5a44]' : 'text-[#d5c7b0]'
  const panelPrimaryTextClass = isLightReaderTheme ? 'text-[#2f281f]' : 'text-[#f3eadb]'
  const panelInputClass = isLightReaderTheme
    ? 'border-[#bfa882] bg-[#fffdf7] text-[#2d261d] focus:border-[#8f7551]'
    : 'border-[#8a7552] bg-black/20 text-[#f8f1e6] focus:border-[#c7b18f]'
  const panelCardClass = isLightReaderTheme
    ? 'border-[#d3bea0] hover:bg-[#f3e8d6]/70'
    : 'border-white/10 hover:bg-white/10'
  const readerStageClass = isFullscreen
    ? 'relative flex h-[100dvh] flex-col rounded-[20px] border border-[#d8ccb8] bg-[#f4eee2] p-3 pt-14 shadow-none dark:border-white/10 dark:bg-[#181818]'
    : 'relative mt-4 rounded-[30px] border border-[#d8ccb8] bg-[#f4eee2] p-4 pt-16 shadow-[0_26px_45px_rgba(80,57,18,0.14)] dark:border-white/10 dark:bg-[#181818]'
  const readerViewportClass = isFullscreen ? 'h-full min-h-0' : 'h-[70vh]'

  return {
    isMissingBookId: !bookId,
    feedback,
    isInitialLoading,
    refs: {
      readerShellRef,
      readerStageRef,
      toolbarAreaRef,
      panelRef,
      selectionActionRef,
    },
    classes: {
      readerStageClass,
      isLightReaderTheme,
    },
    headerProps: {
      currentPage,
      formatSavedTime,
      lastSavedAt,
      progressPercent,
      saveState,
      title: openData?.title ?? ebookState?.book.title ?? 'Reader',
      totalPages,
    },
    progressBarProps: {
      currentLabel: inferredFormat === 'PDF' ? `Page ${pdf.pdfPageNumber}` : `Page ${currentPage}`,
      progressWidth: inferredFormat === 'PDF' ? (pdf.pdfPageCount ? (pdf.pdfPageNumber / pdf.pdfPageCount) * 100 : 0) : progressPercent,
      valueLabel: inferredFormat === 'PDF' ? `${pdf.pdfPageCount} pages` : `${progressPercent.toFixed(1)}%`,
    },
    toolbarProps: {
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
      onAddBookmark: async () => {
        closeReaderPanels()
        await handleAddBookmark()
      },
      onReadAloudToggle: () => {
        if (isSpeaking) {
          stopReadAloud()
          return
        }
        speakCurrentEpubView()
      },
      onToggleFullscreen: toggleFullscreen,
      onTogglePanel: toggleReaderPanel,
    },
    overlayProps: {
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
      filteredToc: epub.filteredToc,
      tocSearch: epub.tocSearch,
      setTocSearch: epub.setTocSearch,
      jumpToEpubToc: epub.jumpToEpubToc,
      searchQuery,
      setSearchQuery,
      isSearchingText: epub.isSearchingText,
      searchResults: epub.searchResults,
      jumpToSearchResult: async (result: any) => {
        const opened = await epub.jumpToSearchResult(result)
        if (opened) {
          setIsSearchOpen(false)
        }
      },
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
      pdfSelectedText: pdf.pdfSelectedText,
      epubSelectedHighlightText: epub.epubSelectedHighlight?.text || '',
      noteInput,
      setNoteInput,
      handleAddNote,
      bookmarkItems,
      jumpToBookmark,
      deleteBookmarkItem,
      notes: ebookState?.notes ?? [],
      deleteNoteItem,
    },
    selectionAction: {
      visible: inferredFormat === 'EPUB' && !!epub.epubSelectionActionAnchor && !!epub.epubSelectedHighlight?.text,
      anchor: epub.epubSelectionActionAnchor,
      text: epub.epubSelectedHighlight?.text || '',
      ref: selectionActionRef,
      onHighlight: () => void handleSelectionHighlight(),
      onDictionary: handleSelectionDictionaryLookup,
    },
    viewportProps: {
      resolvedAssetUrl,
      inferredFormat,
      pdfError: pdf.pdfError,
      epubError: epub.epubError,
      isFullscreen,
      pdfUseNativeViewer: pdf.pdfUseNativeViewer,
      pdfObjectUrl: pdf.pdfObjectUrl,
      paperToneClass,
      readerViewportClass,
      flipDirection: null,
      canNavigatePdf: pdf.canNavigatePdf,
      canNavigateEpub,
      settings,
      pdfHighlightRectsPrimary: pdf.pdfHighlightRectsPrimary,
      pdfHighlightRectsSecondary: pdf.pdfHighlightRectsSecondary,
      onPrevPdfPage: pdf.goToPrevPdfPage,
      onNextPdfPage: pdf.goToNextPdfPage,
      onPrevEpubPage: epub.goToPrevPage,
      onNextEpubPage: epub.goToNextPage,
      onTouchStart: handleReaderTouchStart,
      onTouchMove: handleReaderTouchMove,
      onTouchEnd: handleReaderTouchEnd,
      onCapturePdfSelection: pdf.capturePdfSelection,
      onEpubWheel: epub.handleEpubWheel,
      pdfViewportRef: pdf.pdfViewportRef,
      setPdfCanvas: pdf.setPdfCanvas,
      setPdfCanvasSecondary: pdf.setPdfCanvasSecondary,
      setPdfTextLayer: pdf.setPdfTextLayer,
      setPdfTextLayerSecondary: pdf.setPdfTextLayerSecondary,
      setEpubContainer: epub.setEpubContainer,
      selectionAction: null,
    },
    footer: {
      currentLabel: inferredFormat === 'PDF' ? `Page ${pdf.pdfPageNumber}` : `Page ${currentPage}`,
      valueLabel: inferredFormat === 'PDF' ? `${pdf.pdfPageCount} pages` : `${progressPercent.toFixed(1)}%`,
      min: inferredFormat === 'PDF' ? 1 : 0,
      max: inferredFormat === 'PDF' ? Math.max(1, pdf.pdfPageCount) : 100,
      value: scrubValue,
      setValue: setScrubValue,
      onCommit: () => void handleScrubCommit(),
    },
    dictionaryCardProps: {
      isOpen: isDictionaryOpen,
      audioUrl: dictionaryAudioUrl,
      definition: dictionaryDefinition,
      isLoading: isDictionaryLoading,
      onClose: () => setIsDictionaryOpen(false),
      onPlayAudio: playDictionaryAudio,
      phonetic: dictionaryPhonetic,
      word: dictionaryWord,
    },
  }
}

export default useBookReaderController
