const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const JSZIP_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/jszip@3.10.1/dist/jszip.min.js'
const JSZIP_CDN_FALLBACK_SCRIPT = 'https://unpkg.com/jszip@3.10.1/dist/jszip.min.js'
const EPUB_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/epubjs/dist/epub.min.js'
const EPUB_CDN_FALLBACK_SCRIPT = 'https://unpkg.com/epubjs/dist/epub.min.js'
const PDFJS_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js'
const PDFJS_CDN_FALLBACK_SCRIPT = 'https://unpkg.com/pdfjs-dist@3.11.174/build/pdf.min.js'
const PDFJS_WORKER_CDN_SCRIPT = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js'
export const PDFJS_CMAP_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/'
export const PDFJS_STANDARD_FONTS_URL = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/'
const READER_SETTINGS_KEY = 'reader-settings-v1'

export type ReaderTheme = 'paper' | 'sepia' | 'night'

export type ReaderSettings = {
  theme: ReaderTheme
  fontSizeRem: number
  lineHeight: number
  sidePaddingRem: number
  pdfZoom: number
  pageView: 'single' | 'spread'
  stylePresetId: 'original' | 'quiet' | 'paper' | 'bold' | 'calm' | 'focus'
}

export type TocEntry = {
  label: string
  href?: string
  subitems?: TocEntry[]
}

export type SaveState = 'idle' | 'saving' | 'error'

export type SaveJob = {
  payload: {
    bookId: string
    page?: number
    locationCfi?: string
    percent?: number
  }
  silent: boolean
}

export type ReaderLastPosition = {
  page?: number
  locationCfi?: string
  percent?: number
}

export type ReaderAssetFormat = 'EPUB' | 'PDF' | ''

export type EpubSearchResult = {
  cfi: string
  excerpt: string
  page: number | null
}

export type HighlightStyle = 'yellow' | 'green' | 'pink' | 'blue' | 'underline'

export type PdfSelectionRect = {
  x: number
  y: number
  w: number
  h: number
}

export type EpubSelectionActionAnchor = {
  x: number
  y: number
}

export type DictionaryLookup = {
  definition: string
  phonetic?: string
  audioUrl?: string
  source: 'online' | 'fallback'
}

export const QUICK_DICTIONARY: Record<string, string> = {
  metaphor: 'A comparison that describes one thing as another to create meaning.',
  irony: 'A contrast between expectation and reality.',
  narrative: 'The structured telling of events in a story.',
  premise: 'The basic idea or foundation of an argument or story.',
  conflict: 'A struggle between opposing forces in a story.',
  protagonist: 'The main character in a narrative.',
  antagonist: 'The opposing force or character to the protagonist.',
  theme: 'The central message or underlying idea of a work.',
  context: 'The surrounding circumstances that shape meaning.',
  nuance: 'A subtle difference in meaning or expression.',
}

declare global {
  interface Window {
    JSZip?: unknown
    ePub?: (source: string | ArrayBuffer | Uint8Array) => any
    pdfjsLib?: any
  }
}

let epubScriptPromise: Promise<void> | null = null
let pdfScriptPromise: Promise<void> | null = null

export const defaultSettings: ReaderSettings = {
  theme: 'paper',
  fontSizeRem: 1.06,
  lineHeight: 1.68,
  sidePaddingRem: 1.15,
  pdfZoom: 1,
  pageView: 'single',
  stylePresetId: 'original',
}

export const READER_STYLE_PRESETS: Array<{
  id: 'original' | 'quiet' | 'paper' | 'bold' | 'calm' | 'focus'
  label: string
  fontFamily: string
  fontWeight: string
  letterSpacing: string
}> = [
  { id: 'original', label: 'Original', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: '400', letterSpacing: '0em' },
  { id: 'quiet', label: 'Quiet', fontFamily: '"Iowan Old Style", "Palatino Linotype", "Book Antiqua", serif', fontWeight: '400', letterSpacing: '0.002em' },
  { id: 'paper', label: 'Paper', fontFamily: '"Baskerville", "Times New Roman", serif', fontWeight: '400', letterSpacing: '0.004em' },
  { id: 'bold', label: 'Bold', fontFamily: '"Georgia", "Times New Roman", serif', fontWeight: '600', letterSpacing: '0.003em' },
  { id: 'calm', label: 'Calm', fontFamily: '"Garamond", "Times New Roman", serif', fontWeight: '400', letterSpacing: '0.005em' },
  { id: 'focus', label: 'Focus', fontFamily: '"Charter", "Palatino Linotype", serif', fontWeight: '500', letterSpacing: '0.002em' },
]

const loadReaderScript = (src: string, marker: string, timeoutMs = 12000) =>
  new Promise<void>((resolve, reject) => {
    const existing = document.querySelector(
      `script[data-reader-lib="${marker}"]`,
    ) as HTMLScriptElement | null
    if (existing) {
      if (existing.dataset.loaded === 'true') {
        resolve()
        return
      }
      if (existing.dataset.failed === 'true') {
        existing.remove()
      } else {
        const timeout = window.setTimeout(
          () => reject(new Error(`Failed to load ${marker}`)),
          timeoutMs,
        )
        existing.addEventListener(
          'load',
          () => {
            window.clearTimeout(timeout)
            resolve()
          },
          { once: true },
        )
        existing.addEventListener(
          'error',
          () => {
            window.clearTimeout(timeout)
            reject(new Error(`Failed to load ${marker}`))
          },
          { once: true },
        )
        return
      }
    }

    const script = document.createElement('script')
    script.src = src
    script.async = true
    script.defer = true
    script.dataset.readerLib = marker
    const timeout = window.setTimeout(() => {
      script.dataset.failed = 'true'
      reject(new Error(`Failed to load ${marker}`))
    }, timeoutMs)
    script.onload = () => {
      window.clearTimeout(timeout)
      script.dataset.loaded = 'true'
      resolve()
    }
    script.onerror = () => {
      window.clearTimeout(timeout)
      script.dataset.failed = 'true'
      reject(new Error(`Failed to load ${marker}`))
    }
    document.head.appendChild(script)
  })

const loadReaderScriptWithFallback = async (sources: string[], marker: string) => {
  let lastError: Error | null = null
  for (const src of sources) {
    try {
      await loadReaderScript(src, marker)
      return
    } catch (error) {
      lastError = error as Error
    }
  }
  throw lastError ?? new Error(`Failed to load ${marker}`)
}

export const loadEpubScript = async () => {
  if (!window.JSZip) {
    await loadReaderScriptWithFallback(
      [JSZIP_CDN_SCRIPT, JSZIP_CDN_FALLBACK_SCRIPT],
      'jszip',
    )
  }

  if (window.ePub) return
  if (epubScriptPromise) {
    await epubScriptPromise
    return
  }

  epubScriptPromise = loadReaderScriptWithFallback(
    [EPUB_CDN_SCRIPT, EPUB_CDN_FALLBACK_SCRIPT],
    'epubjs',
  )
  await epubScriptPromise
}

export const loadPdfScript = async () => {
  if (window.pdfjsLib) return
  if (pdfScriptPromise) {
    await pdfScriptPromise
    return
  }

  pdfScriptPromise = loadReaderScriptWithFallback(
    [PDFJS_CDN_SCRIPT, PDFJS_CDN_FALLBACK_SCRIPT],
    'pdfjs',
  )
  await pdfScriptPromise
  if (window.pdfjsLib?.GlobalWorkerOptions) {
    window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER_CDN_SCRIPT
  }
}

export const flattenToc = (items: TocEntry[] = [], depth = 0): Array<TocEntry & { depth: number }> => {
  const rows: Array<TocEntry & { depth: number }> = []
  for (const item of items) {
    rows.push({ ...item, depth })
    if (item.subitems?.length) {
      rows.push(...flattenToc(item.subitems, depth + 1))
    }
  }
  return rows
}

export const getReaderSettingsKey = (bookId: string) => `${READER_SETTINGS_KEY}:${bookId || 'default'}`
export const getReaderPositionKey = (bookId: string) => `reader-last-position-v1:${bookId || 'default'}`

export const readLastPosition = (bookId: string): ReaderLastPosition | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = window.localStorage.getItem(getReaderPositionKey(bookId))
    if (!raw) return null
    const parsed = JSON.parse(raw) as ReaderLastPosition
    return parsed ?? null
  } catch {
    return null
  }
}

export const writeLastPosition = (bookId: string, value: ReaderLastPosition) => {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(getReaderPositionKey(bookId), JSON.stringify(value))
  } catch {
    // ignore storage write failures
  }
}

export const readSettings = (bookId: string): ReaderSettings => {
  if (typeof window === 'undefined') return defaultSettings
  try {
    const raw =
      window.localStorage.getItem(getReaderSettingsKey(bookId))
      || window.localStorage.getItem(READER_SETTINGS_KEY)
    if (!raw) return defaultSettings
    const parsed = JSON.parse(raw) as Partial<ReaderSettings>
    return {
      theme: parsed.theme === 'sepia' || parsed.theme === 'night' ? parsed.theme : 'paper',
      fontSizeRem:
        typeof parsed.fontSizeRem === 'number' ? Math.min(1.9, Math.max(0.72, parsed.fontSizeRem)) : defaultSettings.fontSizeRem,
      lineHeight:
        typeof parsed.lineHeight === 'number' ? Math.min(2, Math.max(1.2, parsed.lineHeight)) : defaultSettings.lineHeight,
      sidePaddingRem:
        typeof parsed.sidePaddingRem === 'number' ? Math.min(2.2, Math.max(0.4, parsed.sidePaddingRem)) : defaultSettings.sidePaddingRem,
      pdfZoom:
        typeof parsed.pdfZoom === 'number' ? Math.min(2.3, Math.max(0.8, parsed.pdfZoom)) : defaultSettings.pdfZoom,
      pageView: parsed.pageView === 'spread' ? 'spread' : 'single',
      stylePresetId:
        parsed.stylePresetId === 'quiet'
        || parsed.stylePresetId === 'paper'
        || parsed.stylePresetId === 'bold'
        || parsed.stylePresetId === 'calm'
        || parsed.stylePresetId === 'focus'
          ? parsed.stylePresetId
          : 'original',
    }
  } catch {
    return defaultSettings
  }
}

export const detectAssetFormat = (buffer: ArrayBuffer): ReaderAssetFormat => {
  const bytes = new Uint8Array(buffer)
  if (bytes.length >= 5) {
    const pdfMagic =
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46 &&
      bytes[4] === 0x2d
    if (pdfMagic) return 'PDF'
  }
  if (bytes.length >= 2) {
    const zipMagic = bytes[0] === 0x50 && bytes[1] === 0x4b
    if (zipMagic) return 'EPUB'
  }
  return ''
}

export const formatSavedTime = (iso: string | null) => {
  if (!iso) return 'Not saved yet'
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return 'Saved'
  return `Saved ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
}

const encodePdfRects = (rects: PdfSelectionRect[]) =>
  rects
    .map((rect) =>
      [
        rect.x.toFixed(4),
        rect.y.toFixed(4),
        rect.w.toFixed(4),
        rect.h.toFixed(4),
      ].join(','),
    )
    .join('|')

const decodePdfRects = (value: string): PdfSelectionRect[] => {
  if (!value) return []
  return value
    .split('|')
    .map((segment) => segment.split(',').map(Number))
    .filter((nums) => nums.length === 4 && nums.every((num) => Number.isFinite(num)))
    .map(([x, y, w, h]) => ({ x, y, w, h }))
}

export const makePdfSelectionStartRef = (page: number, rects: PdfSelectionRect[]) =>
  `pdfsel:${page}:${encodePdfRects(rects)}`

export const parsePdfSelectionStartRef = (startCfi: string): { page: number; rects: PdfSelectionRect[] } | null => {
  if (!startCfi.startsWith('pdfsel:')) return null
  const match = /^pdfsel:(\d+):(.*)$/.exec(startCfi)
  if (!match) return null
  const page = Number(match[1])
  if (!Number.isFinite(page) || page < 1) return null
  const rects = decodePdfRects(match[2])
  if (rects.length === 0) return null
  return { page, rects }
}

export const getHighlightSwatch = (style: HighlightStyle) => {
  switch (style) {
    case 'green':
      return '#86efac'
    case 'pink':
      return '#f9a8d4'
    case 'blue':
      return '#93c5fd'
    case 'underline':
      return '#f59e0b'
    case 'yellow':
    default:
      return '#fde047'
  }
}

export const canvasLooksBlank = (canvas: HTMLCanvasElement | null) => {
  if (!canvas) return true
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  if (!ctx || canvas.width < 2 || canvas.height < 2) return true

  const sampleWidth = Math.min(canvas.width, 360)
  const sampleHeight = Math.min(canvas.height, 360)
  const sx = Math.floor((canvas.width - sampleWidth) / 2)
  const sy = Math.floor((canvas.height - sampleHeight) / 2)
  const pixels = ctx.getImageData(sx, sy, sampleWidth, sampleHeight).data

  let nonWhite = 0
  for (let i = 0; i < pixels.length; i += 32) {
    const r = pixels[i]
    const g = pixels[i + 1]
    const b = pixels[i + 2]
    const a = pixels[i + 3]
    if (a > 10 && (r < 245 || g < 245 || b < 245)) {
      nonWhite += 1
      if (nonWhite > 30) return false
    }
  }
  return true
}

export { API_BASE_URL }
