import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  canvasLooksBlank,
  detectAssetFormat,
  parsePdfSelectionStartRef,
  loadPdfScript,
  PDFJS_CMAP_URL,
  PDFJS_STANDARD_FONTS_URL,
  type HighlightStyle,
  type PdfSelectionRect,
  type ReaderAssetFormat,
  type ReaderLastPosition,
  type ReaderSettings,
  type SaveJob,
} from '@/features/book-reader/lib/readerHelpers'
import { getErrorMessage } from '@/lib/api'
import type { EbookState } from '@/services/reading'

type UsePdfReaderArgs = {
  bookId: string
  inferredFormat: ReaderAssetFormat
  resolvedAssetUrl: string
  settings: ReaderSettings
  ebookState?: EbookState
  openProgressPage?: number
  lastPositionRef: React.MutableRefObject<ReaderLastPosition | null>
  latestPageRef: React.MutableRefObject<number>
  setPageInput: (value: string) => void
  setFormatOverride: (format: ReaderAssetFormat) => void
  showMessage: (message: string) => void
  queueProgressSave: (job: SaveJob) => Promise<void>
  writeLastPosition: (bookId: string, position: ReaderLastPosition) => void
}

const usePdfReader = ({
  bookId,
  inferredFormat,
  resolvedAssetUrl,
  settings,
  ebookState,
  openProgressPage,
  lastPositionRef,
  latestPageRef,
  setPageInput,
  setFormatOverride,
  showMessage,
  queueProgressSave,
  writeLastPosition,
}: UsePdfReaderArgs) => {
  const [pdfError, setPdfError] = useState('')
  const [isPdfReady, setIsPdfReady] = useState(false)
  const [pdfCanvasReady, setPdfCanvasReady] = useState(false)
  const [pdfPageCount, setPdfPageCount] = useState(0)
  const [pdfPageNumber, setPdfPageNumber] = useState(1)
  const [pdfUseNativeViewer, setPdfUseNativeViewer] = useState(false)
  const [pdfObjectUrl, setPdfObjectUrl] = useState('')
  const [pdfSelectedText, setPdfSelectedText] = useState('')
  const [pdfSelectedRects, setPdfSelectedRects] = useState<PdfSelectionRect[]>([])
  const [pdfSelectedPage, setPdfSelectedPage] = useState<number | null>(null)

  const pdfCanvasRef = useRef<HTMLCanvasElement | null>(null)
  const pdfCanvasSecondaryRef = useRef<HTMLCanvasElement | null>(null)
  const pdfTextLayerRef = useRef<HTMLDivElement | null>(null)
  const pdfTextLayerSecondaryRef = useRef<HTMLDivElement | null>(null)
  const pdfViewportRef = useRef<HTMLDivElement | null>(null)
  const pdfDocRef = useRef<any>(null)
  const pdfRenderTaskPrimaryRef = useRef<any>(null)
  const pdfRenderTaskSecondaryRef = useRef<any>(null)
  const pdfObjectUrlRef = useRef<string>('')

  const setPdfCanvas = useCallback((node: HTMLCanvasElement | null) => {
    pdfCanvasRef.current = node
    setPdfCanvasReady(Boolean(node))
  }, [])

  const setPdfCanvasSecondary = useCallback((node: HTMLCanvasElement | null) => {
    pdfCanvasSecondaryRef.current = node
  }, [])

  const setPdfTextLayer = useCallback((node: HTMLDivElement | null) => {
    pdfTextLayerRef.current = node
  }, [])

  const setPdfTextLayerSecondary = useCallback((node: HTMLDivElement | null) => {
    pdfTextLayerSecondaryRef.current = node
  }, [])

  const normalizePdfPageForView = useCallback((page: number) => {
    const safe = Math.max(1, Math.floor(page))
    if (settings.pageView !== 'spread') return safe
    return safe % 2 === 0 ? Math.max(1, safe - 1) : safe
  }, [settings.pageView])

  const renderPdfPage = useCallback(async (pageNumber: number) => {
    if (!pdfDocRef.current || !pdfCanvasRef.current) return
    const total = pdfDocRef.current.numPages || 0
    const leftPage = Math.min(Math.max(1, pageNumber), Math.max(1, total))
    const rightPage = leftPage + 1

    const renderToCanvas = async (
      pageToRender: number,
      canvas: HTMLCanvasElement,
      taskRef: { current: any },
    ) => {
      const page = await pdfDocRef.current.getPage(pageToRender)
      const baseViewport = page.getViewport({ scale: 1 })
      const containerWidth = pdfViewportRef.current?.clientWidth ?? 0
      const availableWidth = settings.pageView === 'spread'
        ? Math.max(220, (containerWidth - 56) / 2)
        : Math.max(220, containerWidth - 36)
      const fitScale = availableWidth > 0 ? availableWidth / baseViewport.width : 1
      const effectiveScale = Math.max(settings.pdfZoom, fitScale)
      const viewport = page.getViewport({ scale: effectiveScale })
      const context = canvas.getContext('2d')
      if (!context) return

      canvas.height = viewport.height
      canvas.width = viewport.width
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`

      taskRef.current?.cancel?.()
      taskRef.current = page.render({ canvasContext: context, viewport })
      await taskRef.current.promise

      const renderTextLayer = async (layerNode: HTMLDivElement | null) => {
        if (!layerNode) return
        layerNode.innerHTML = ''
        layerNode.style.width = `${viewport.width}px`
        layerNode.style.height = `${viewport.height}px`

        try {
          const textContent = await page.getTextContent()
          if (typeof window.pdfjsLib?.renderTextLayer === 'function') {
            const task = window.pdfjsLib.renderTextLayer({
              textContentSource: textContent,
              container: layerNode,
              viewport,
              textDivs: [],
            })
            if (task?.promise) {
              await task.promise
            } else if (typeof task?.then === 'function') {
              await task
            }
          }
        } catch {
          // Best effort only.
        }
      }

      await renderTextLayer(
        canvas === pdfCanvasRef.current ? pdfTextLayerRef.current : pdfTextLayerSecondaryRef.current,
      )
    }

    await renderToCanvas(leftPage, pdfCanvasRef.current, pdfRenderTaskPrimaryRef)

    const shouldRenderSpread = settings.pageView === 'spread'
    const secondaryCanvas = pdfCanvasSecondaryRef.current
    if (shouldRenderSpread && secondaryCanvas && rightPage <= total) {
      await renderToCanvas(rightPage, secondaryCanvas, pdfRenderTaskSecondaryRef)
    } else if (secondaryCanvas) {
      const context = secondaryCanvas.getContext('2d')
      if (context) {
        context.clearRect(0, 0, secondaryCanvas.width, secondaryCanvas.height)
      }
      secondaryCanvas.width = 1
      secondaryCanvas.height = 1
      secondaryCanvas.style.width = '0px'
      secondaryCanvas.style.height = '0px'
      if (pdfTextLayerSecondaryRef.current) {
        pdfTextLayerSecondaryRef.current.innerHTML = ''
        pdfTextLayerSecondaryRef.current.style.width = '0px'
        pdfTextLayerSecondaryRef.current.style.height = '0px'
      }
      pdfRenderTaskSecondaryRef.current?.cancel?.()
      pdfRenderTaskSecondaryRef.current = null
    }
  }, [settings.pageView, settings.pdfZoom])

  const jumpToPdfPage = useCallback(async (page: number) => {
    if (!isPdfReady || !pdfDocRef.current) return false
    const target = normalizePdfPageForView(page)
    setPdfPageNumber(target)
    latestPageRef.current = target
    setPageInput(String(target))
    writeLastPosition(bookId, {
      page: target,
      percent: pdfPageCount ? Number(((target / pdfPageCount) * 100).toFixed(2)) : undefined,
    })
    await renderPdfPage(target)
    await queueProgressSave({
      payload: {
        bookId,
        page: target,
        percent: pdfPageCount ? Number(((target / pdfPageCount) * 100).toFixed(2)) : undefined,
      },
      silent: true,
    })
    return true
  }, [bookId, isPdfReady, latestPageRef, normalizePdfPageForView, pdfPageCount, queueProgressSave, renderPdfPage, setPageInput, writeLastPosition])

  const goToPrevPdfPage = useCallback(async () => {
    if (!isPdfReady || !pdfDocRef.current) return
    const step = settings.pageView === 'spread' ? 2 : 1
    if (pdfPageNumber <= 1) {
      showMessage('You are at the beginning.')
      return
    }
    await jumpToPdfPage(Math.max(1, pdfPageNumber - step))
  }, [isPdfReady, jumpToPdfPage, pdfPageNumber, settings.pageView, showMessage])

  const goToNextPdfPage = useCallback(async () => {
    if (!isPdfReady || !pdfDocRef.current) return
    const step = settings.pageView === 'spread' ? 2 : 1
    if (pdfPageCount && pdfPageNumber >= pdfPageCount) {
      showMessage('You reached the end.')
      return
    }
    await jumpToPdfPage(Math.min(pdfPageCount || Number.MAX_SAFE_INTEGER, pdfPageNumber + step))
  }, [isPdfReady, jumpToPdfPage, pdfPageCount, pdfPageNumber, settings.pageView, showMessage])

  const capturePdfSelection = useCallback(() => {
    if (inferredFormat !== 'PDF') return
    const selection = window.getSelection?.()
    if (!selection || selection.rangeCount === 0) {
      setPdfSelectedText('')
      setPdfSelectedRects([])
      setPdfSelectedPage(null)
      return
    }

    const text = selection.toString().trim()
    if (!text) {
      setPdfSelectedText('')
      setPdfSelectedRects([])
      setPdfSelectedPage(null)
      return
    }

    const range = selection.getRangeAt(0)
    const primaryLayer = pdfTextLayerRef.current
    const secondaryLayer = pdfTextLayerSecondaryRef.current
    const leftPage = Math.max(1, pdfPageNumber)
    const rightPage = leftPage + 1

    const resolveLayer = () => {
      if (primaryLayer && primaryLayer.contains(range.commonAncestorContainer)) {
        return { layer: primaryLayer, page: leftPage }
      }
      if (secondaryLayer && secondaryLayer.contains(range.commonAncestorContainer)) {
        return { layer: secondaryLayer, page: rightPage }
      }
      return null
    }

    const target = resolveLayer()
    if (!target) return

    const layerRect = target.layer.getBoundingClientRect()
    if (layerRect.width <= 0 || layerRect.height <= 0) return

    const rects = Array.from(range.getClientRects())
      .map((rect) => {
        const left = Math.max(rect.left, layerRect.left)
        const top = Math.max(rect.top, layerRect.top)
        const right = Math.min(rect.right, layerRect.right)
        const bottom = Math.min(rect.bottom, layerRect.bottom)
        const w = right - left
        const h = bottom - top
        if (w < 2 || h < 2) return null
        return {
          x: Number(((left - layerRect.left) / layerRect.width).toFixed(4)),
          y: Number(((top - layerRect.top) / layerRect.height).toFixed(4)),
          w: Number((w / layerRect.width).toFixed(4)),
          h: Number((h / layerRect.height).toFixed(4)),
        } satisfies PdfSelectionRect
      })
      .filter((item): item is PdfSelectionRect => Boolean(item))

    if (rects.length === 0) return
    setPdfSelectedText(text.slice(0, 400))
    setPdfSelectedRects(rects)
    setPdfSelectedPage(target.page)
  }, [inferredFormat, pdfPageNumber])

  useEffect(() => {
    return () => {
      if (pdfObjectUrlRef.current) {
        URL.revokeObjectURL(pdfObjectUrlRef.current)
        pdfObjectUrlRef.current = ''
      }
    }
  }, [])

  useEffect(() => {
    if (inferredFormat !== 'PDF' || !resolvedAssetUrl || !pdfCanvasReady) return

    let disposed = false

    const mountPdf = async () => {
      try {
        setPdfError('')
        setIsPdfReady(false)
        setPdfUseNativeViewer(false)
        setPdfPageNumber(1)
        await loadPdfScript()

        if (!window.pdfjsLib) {
          throw new Error('PDF renderer unavailable')
        }
        if (disposed || !pdfCanvasRef.current) return

        const assetResponse = await fetch(resolvedAssetUrl, { credentials: 'include' })
        if (!assetResponse.ok) {
          throw new Error(`Failed to load PDF asset (${assetResponse.status})`)
        }

        const pdfBuffer = await assetResponse.arrayBuffer()
        const nextObjectUrl = URL.createObjectURL(new Blob([pdfBuffer], { type: 'application/pdf' }))
        if (pdfObjectUrlRef.current) {
          URL.revokeObjectURL(pdfObjectUrlRef.current)
        }
        pdfObjectUrlRef.current = nextObjectUrl
        setPdfObjectUrl(nextObjectUrl)
        const detectedFormat = detectAssetFormat(pdfBuffer)
        if (detectedFormat === 'EPUB') {
          setFormatOverride('EPUB')
          showMessage('Detected EPUB file. Opening in EPUB reader.')
          return
        }
        const loadingTask = window.pdfjsLib.getDocument({
          data: pdfBuffer,
          cMapUrl: PDFJS_CMAP_URL,
          cMapPacked: true,
          standardFontDataUrl: PDFJS_STANDARD_FONTS_URL,
          useSystemFonts: true,
        })
        const pdfDoc = await loadingTask.promise
        pdfDocRef.current = pdfDoc
        setPdfPageCount(pdfDoc.numPages || 0)

        const savedPage =
          lastPositionRef.current?.page
          ?? ebookState?.progress?.page
          ?? openProgressPage
          ?? 1
        const initialPage = normalizePdfPageForView(
          Math.min(Math.max(1, savedPage), Math.max(1, pdfDoc.numPages || 1)),
        )
        setPdfPageNumber(initialPage)
        latestPageRef.current = initialPage
        setPageInput(String(initialPage))
        await renderPdfPage(initialPage)
        if (canvasLooksBlank(pdfCanvasRef.current)) {
          setPdfUseNativeViewer(true)
          showMessage('Using native PDF viewer for better compatibility.')
        }
        setIsPdfReady(true)
      } catch (error) {
        if (pdfObjectUrlRef.current) {
          setPdfUseNativeViewer(true)
          setPdfError('')
          setIsPdfReady(true)
          showMessage('Switched to native PDF viewer.')
        } else {
          setPdfError(getErrorMessage(error))
          setIsPdfReady(false)
        }
      }
    }

    void mountPdf()

    return () => {
      disposed = true
      pdfRenderTaskPrimaryRef.current?.cancel?.()
      pdfRenderTaskSecondaryRef.current?.cancel?.()
      pdfDocRef.current = null
      setIsPdfReady(false)
      setPdfPageCount(0)
    }
  }, [
    ebookState?.progress?.page,
    inferredFormat,
    lastPositionRef,
    latestPageRef,
    normalizePdfPageForView,
    openProgressPage,
    pdfCanvasReady,
    renderPdfPage,
    resolvedAssetUrl,
    setFormatOverride,
    setPageInput,
    showMessage,
  ])

  useEffect(() => {
    if (inferredFormat !== 'PDF' || !isPdfReady || !pdfDocRef.current) return
    void renderPdfPage(pdfPageNumber)
  }, [inferredFormat, isPdfReady, pdfPageNumber, renderPdfPage, settings.pdfZoom])

  useEffect(() => {
    setPdfSelectedText('')
    setPdfSelectedRects([])
    setPdfSelectedPage(null)
  }, [pdfPageNumber, settings.pageView])

  useEffect(() => {
    if (inferredFormat !== 'PDF') return
    setPdfPageNumber((prev) => {
      const normalized = normalizePdfPageForView(prev)
      if (normalized !== prev) {
        latestPageRef.current = normalized
      }
      return normalized
    })
  }, [inferredFormat, latestPageRef, normalizePdfPageForView, settings.pageView])

  const pdfHighlightRectsPrimary = useMemo(() => {
    const highlights = ebookState?.highlights ?? []
    const page = Math.max(1, pdfPageNumber)
    return highlights
      .map((highlight) => {
        const parsed = parsePdfSelectionStartRef(highlight.startCfi)
        return parsed && parsed.page === page
          ? parsed.rects.map((rect) => ({ ...rect, color: (highlight.color as HighlightStyle) || 'yellow' }))
          : null
      })
      .flatMap((rects) => rects ?? [])
  }, [ebookState?.highlights, pdfPageNumber])

  const pdfHighlightRectsSecondary = useMemo(() => {
    if (settings.pageView !== 'spread') return []
    const highlights = ebookState?.highlights ?? []
    const page = Math.max(1, pdfPageNumber) + 1
    return highlights
      .map((highlight) => {
        const parsed = parsePdfSelectionStartRef(highlight.startCfi)
        return parsed && parsed.page === page
          ? parsed.rects.map((rect) => ({ ...rect, color: (highlight.color as HighlightStyle) || 'yellow' }))
          : null
      })
      .flatMap((rects) => rects ?? [])
  }, [ebookState?.highlights, pdfPageNumber, settings.pageView])

  return {
    pdfError,
    isPdfReady,
    pdfPageCount,
    pdfPageNumber,
    pdfUseNativeViewer,
    pdfObjectUrl,
    pdfSelectedText,
    pdfSelectedRects,
    pdfSelectedPage,
    pdfViewportRef,
    setPdfCanvas,
    setPdfCanvasSecondary,
    setPdfTextLayer,
    setPdfTextLayerSecondary,
    canNavigatePdf: inferredFormat === 'PDF' && isPdfReady && !pdfUseNativeViewer,
    pdfHighlightRectsPrimary,
    pdfHighlightRectsSecondary,
    goToPrevPdfPage,
    goToNextPdfPage,
    jumpToPdfPage,
    capturePdfSelection,
  }
}

export default usePdfReader
