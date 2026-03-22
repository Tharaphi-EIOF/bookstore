import { motion } from 'framer-motion'
import { useEffect, useMemo, useRef, useState, type ChangeEvent, type MouseEvent, type ReactNode } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getErrorMessage } from '@/lib/api'
import {
  extractStoredContentImageUrls,
  editableHtmlFromStoredContent,
  editorJsonToStoredContent,
  getStoredContentDisplayLines,
  getStoredContentPresentation,
  getStoredContentText,
  hasStoredContentInlineImages,
  withStoredContentPresentation,
  type StoredContentPresentation,
} from '@/lib/editor'
import StudioTopBar from '@/features/blog/write/components/StudioTopBar'
import FocusModeBanner from '@/features/blog/write/components/FocusModeBanner'
import FloatingQuickToolsDock from '@/features/blog/write/components/FloatingQuickToolsDock'
import PoemReadModeModal from '@/features/blog/write/components/PoemReadModeModal'
import WriteIdentitySection from '@/features/blog/write/components/WriteIdentitySection'
import QuickStartGoalSection from '@/features/blog/write/components/QuickStartGoalSection'
import EditorInsightsBar from '@/features/blog/write/components/EditorInsightsBar'
import PoemNotesSection from '@/features/blog/write/components/PoemNotesSection'
import PostDetailsSection from '@/features/blog/write/components/PostDetailsSection'
import LinkPopover from '@/features/blog/write/components/LinkPopover'
import BooksDrawer from '@/features/blog/write/components/BooksDrawer'
import StudioSideDrawer from '@/features/blog/write/components/StudioSideDrawer'
import StudioSetupPanel from '@/features/blog/write/components/StudioSetupPanel'
import EditorToolbarButtons from '@/features/blog/write/components/EditorToolbarButtons'
import EditorToolPanel from '@/features/blog/write/components/EditorToolPanel'
import { type ContentMode, type PoemCanvasPreset, type PoemInkTone, type PoemPaperStyle, type QuickSeed, type WriterFont } from '@/features/blog/write/types'
import {
  POEM_CANVAS_PRESETS,
  POEM_INK_TONES,
  POEM_PAPER_STYLES,
  STUDIO_ATMOSPHERES,
  STUDIO_THEMES,
  WRITER_FONTS,
  getQuickSeedsByMode,
  toApiDateTime,
  toDateTimeLocalValue,
  type StudioAtmosphere,
  type StudioTheme,
} from '@/features/blog/write/constants'
import { useBooks } from '@/services/books'
import {
  useBlogDetails,
  useCreateBlog,
  useDeleteUploadedBlogImage,
  useUpdateBlog,
  useUploadBlogImage,
} from '@/features/blog/services/blogs'
import { useAuthStore } from '@/store/auth.store'
import { useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import TiptapUnderline from '@tiptap/extension-underline'
import TiptapLink from '@tiptap/extension-link'
import { ResizableImageWithNodeView } from '@/lib/tiptap/resizable-image'
import { InlineFontFamily } from '@/lib/tiptap/font-family'
import {
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  BookOpen,
  ImageIcon,
  Italic,
  List,
  ListOrdered,
  Link2,
  Pilcrow,
  Settings2,
  Upload,
  Underline,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

const LOCAL_DRAFT_KEY = 'blog-write:local-draft:v1'

type EditorFormatState = {
  block: 'p' | 'h1' | 'h2' | 'blockquote' | 'codeBlock' | null
  bold: boolean
  italic: boolean
  underline: boolean
  orderedList: boolean
  unorderedList: boolean
  align: 'left' | 'center' | 'right' | null
  link: boolean
}

const BlogWritePage = () => {
  // Route context and server mutations for create/edit mode.
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuthStore()
  const editBlogId = searchParams.get('blogId')?.trim() || null
  const createBlog = useCreateBlog()
  const uploadBlogImage = useUploadBlogImage()
  const deleteUploadedBlogImage = useDeleteUploadedBlogImage()
  const updateBlog = useUpdateBlog()
  const { data: booksData } = useBooks({ page: 1, limit: 80, status: 'active' })

  // Core draft fields and writing-mode controls.
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [contentMode, setContentMode] = useState<ContentMode>('BLOG')
  const [writerFont, setWriterFont] = useState<WriterFont>('sans')
  const [scheduledAt, setScheduledAt] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [content, setContent] = useState('')
  const [tagsInput, setTagsInput] = useState('')
  const [selectedBookIds, setSelectedBookIds] = useState<string[]>([])
  const [bookSearch, setBookSearch] = useState('')
  const [draftId, setDraftId] = useState<string | null>(null)
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null)
  const [autoSavedAt, setAutoSavedAt] = useState<Date | null>(null)
  const [autoSaveState, setAutoSaveState] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [actionInFlight, setActionInFlight] = useState<'DRAFT' | 'PUBLISHED' | null>(null)
  const [isEditorFocused, setIsEditorFocused] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [isLinkPopoverOpen, setIsLinkPopoverOpen] = useState(false)
  const [linkTextInput, setLinkTextInput] = useState('')
  const [linkUrlInput, setLinkUrlInput] = useState('')
  const [linkSelection, setLinkSelection] = useState<{ from: number; to: number } | null>(null)
  const [formatState, setFormatState] = useState<EditorFormatState>({
    block: null,
    bold: false,
    italic: false,
    underline: false,
    orderedList: false,
    unorderedList: false,
    align: null,
    link: false,
  })
  const [hydrated, setHydrated] = useState(false)
  const [scrollDamp, setScrollDamp] = useState(1)
  const [studioTheme, setStudioTheme] = useState<StudioTheme>('classic')
  const [studioAtmosphere, setStudioAtmosphere] = useState<StudioAtmosphere>('dawn')
  const [studioBackdrop, setStudioBackdrop] = useState('')
  const [backdropTint, setBackdropTint] = useState(38)
  const [isBooksDrawerOpen, setIsBooksDrawerOpen] = useState(false)
  const [isQuickToolsOpen, setIsQuickToolsOpen] = useState(false)
  const [isFocusMode, setIsFocusMode] = useState(false)
  const [isStudioSetupOpen, setIsStudioSetupOpen] = useState(false)
  const [isPublishingDetailsOpen, setIsPublishingDetailsOpen] = useState(false)
  const [isPoemReadModeOpen, setIsPoemReadModeOpen] = useState(false)
  const [isTypewriterMode, setIsTypewriterMode] = useState(false)
  const [poemCanvasPreset, setPoemCanvasPreset] = useState<PoemCanvasPreset>('moonlit')
  const [poemPaperStyle, setPoemPaperStyle] = useState<PoemPaperStyle>('vellum')
  const [poemInkTone, setPoemInkTone] = useState<PoemInkTone>('sepia')
  const [poemPaperLines, setPoemPaperLines] = useState(false)
  const [poemDeckleEdge, setPoemDeckleEdge] = useState(true)
  const [poemGrainIntensity, setPoemGrainIntensity] = useState(42)
  const [poemAuthorSignature, setPoemAuthorSignature] = useState('')
  const [writingGoal, setWritingGoal] = useState(800)
  const [isPromptPanelOpen, setIsPromptPanelOpen] = useState(false)
  const [isPoemNotesOpen, setIsPoemNotesOpen] = useState(false)
  const didHydrateEditorRef = useRef(false)
  const didHydrateRemoteRef = useRef(false)
  const sessionUploadedImageUrlsRef = useRef<Set<string>>(new Set())
  const scheduleInputRef = useRef<HTMLInputElement | null>(null)
  const imageUploadInputRef = useRef<HTMLInputElement | null>(null)
  const backdropUploadInputRef = useRef<HTMLInputElement | null>(null)
  const quickToolsDockRef = useRef<HTMLDivElement | null>(null)
  const scrollRafRef = useRef<number | null>(null)
  const scrollDampRef = useRef(1)
  const prefersReducedMotion = useReducedMotion()
  const parallaxX = useMotionValue(0)
  const parallaxY = useMotionValue(0)
  const smoothX = useSpring(parallaxX, { stiffness: 72, damping: 22, mass: 0.7 })
  const smoothY = useSpring(parallaxY, { stiffness: 72, damping: 22, mass: 0.7 })

  // Computed writing metrics, reading estimates, and content-derived summaries.
  const books = booksData?.books ?? []
  const accountAuthorName = user?.name?.trim() || 'Author'
  const isSaving = createBlog.isPending || updateBlog.isPending
  const focusDamp = isEditorFocused ? 0.58 : 1
  const parallaxStrength = (prefersReducedMotion ? 0 : scrollDamp) * focusDamp
  const deepLayerX = useTransform(smoothX, (value) => value * 4 * parallaxStrength)
  const deepLayerY = useTransform(smoothY, (value) => value * 4 * parallaxStrength)
  const cloudLayerX = useTransform(smoothX, (value) => value * 9 * parallaxStrength)
  const cloudLayerY = useTransform(smoothY, (value) => value * 9 * parallaxStrength)

  const tags = useMemo(
    () => tagsInput.split(',').map((item) => item.trim()).filter(Boolean),
    [tagsInput],
  )
  const plainContent = useMemo(() => getStoredContentText(content), [content])
  const poemDisplayLines = useMemo(() => getStoredContentDisplayLines(content), [content])
  const wordCount = useMemo(() => {
    const words = plainContent.trim().split(/\s+/).filter(Boolean)
    return words.length
  }, [plainContent])
  const lineCount = useMemo(
    () => (contentMode === 'POEM'
      ? poemDisplayLines.filter((line) => line.trim().length > 0).length
      : plainContent.split(/\r?\n/).filter((line) => line.trim().length > 0).length),
    [contentMode, plainContent, poemDisplayLines],
  )
  const stanzaCount = useMemo(
    () => {
      if (contentMode !== 'POEM') {
        return plainContent
          .trim()
          .split(/\n\s*\n/)
          .map((block) => block.trim())
          .filter(Boolean).length
      }

      let count = 0
      let inStanza = false
      poemDisplayLines.forEach((line) => {
        if (line.trim()) {
          if (!inStanza) count += 1
          inStanza = true
          return
        }
        inStanza = false
      })
      return count
    },
    [contentMode, plainContent, poemDisplayLines],
  )
  const longestLine = useMemo(() => {
    const sourceLines = contentMode === 'POEM' ? poemDisplayLines : plainContent.split(/\r?\n/)
    const lengths = sourceLines
      .map((line) => line.trim().length)
      .filter((length) => length > 0)
    return lengths.length ? Math.max(...lengths) : 0
  }, [contentMode, plainContent, poemDisplayLines])
  const modeProgressDenominator = contentMode === 'POEM' ? Math.max(80, writingGoal) : Math.max(200, writingGoal)
  const goalProgress = Math.min(100, Math.round((wordCount / modeProgressDenominator) * 100))
  const readingMinutes = Math.max(1, Math.round(wordCount / 220))
  const selectedBooksText = selectedBookIds.sort().join(',')
  const selectedBooks = useMemo(
    () => books.filter((book) => selectedBookIds.includes(book.id)),
    [books, selectedBookIds],
  )
  const filteredBooks = useMemo(() => {
    const query = bookSearch.trim().toLowerCase()
    if (!query) return books
    return books.filter((book) => {
      const title = book.title.toLowerCase()
      const author = book.author.toLowerCase()
      return title.includes(query) || author.includes(query)
    })
  }, [bookSearch, books])
  const currentStudioTheme = useMemo(
    () => STUDIO_THEMES.find((theme) => theme.key === studioTheme) ?? STUDIO_THEMES[0],
    [studioTheme],
  )
  const currentStudioAtmosphere = useMemo(
    () => STUDIO_ATMOSPHERES.find((theme) => theme.key === studioAtmosphere) ?? STUDIO_ATMOSPHERES[0],
    [studioAtmosphere],
  )
  const currentWriterFont = useMemo(
    () => WRITER_FONTS.find((font) => font.key === writerFont) ?? WRITER_FONTS[0],
    [writerFont],
  )
  const currentPoemCanvas = useMemo(
    () => POEM_CANVAS_PRESETS.find((preset) => preset.key === poemCanvasPreset) ?? POEM_CANVAS_PRESETS[0],
    [poemCanvasPreset],
  )
  const currentPoemPaper = useMemo(
    () => POEM_PAPER_STYLES.find((paper) => paper.key === poemPaperStyle) ?? POEM_PAPER_STYLES[0],
    [poemPaperStyle],
  )
  const currentPoemInk = useMemo(
    () => POEM_INK_TONES.find((ink) => ink.key === poemInkTone) ?? POEM_INK_TONES[0],
    [poemInkTone],
  )
  const localDraftKey = useMemo(
    () => (editBlogId ? `${LOCAL_DRAFT_KEY}:${editBlogId}` : LOCAL_DRAFT_KEY),
    [editBlogId],
  )
  const { data: editingBlog } = useBlogDetails(editBlogId ?? '', Boolean(editBlogId))
  const quickSeeds = getQuickSeedsByMode(contentMode)
  const contentPresentation = useMemo<StoredContentPresentation | null>(
    () =>
      contentMode === 'POEM'
        ? {
            mode: 'POEM',
            writerFont,
            authorSignature: poemAuthorSignature.trim() || undefined,
            paperTemplate: poemPaperStyle,
            inkTone: poemInkTone,
            ruledLines: poemPaperLines,
            deckleEdge: poemDeckleEdge,
            grainIntensity: poemGrainIntensity,
            canvasPreset: poemCanvasPreset,
          }
        : null,
    [
      contentMode,
      writerFont,
      poemAuthorSignature,
      poemPaperStyle,
      poemInkTone,
      poemPaperLines,
      poemDeckleEdge,
      poemGrainIntensity,
      poemCanvasPreset,
    ],
  )
  const persistedContent = useMemo(
    () => withStoredContentPresentation(content, contentPresentation),
    [content, contentPresentation],
  )

  // Editor helpers and toolbar actions.
  // Editor commands, quick actions, and media helpers for the writing canvas.
  const toggleBook = (bookId: string) => {
    setSelectedBookIds((prev) =>
      prev.includes(bookId) ? prev.filter((id) => id !== bookId) : [...prev, bookId],
    )
  }

  const applyQuickSeed = (seed: QuickSeed) => {
    const nextTitle = title.trim() ? title : seed.title
    const nextSubtitle = subtitle.trim() ? subtitle : seed.subtitle
    const mergedTags = Array.from(
      new Set([...tagsInput.split(',').map((item) => item.trim()).filter(Boolean), ...seed.tags]),
    ).join(', ')

    setTitle(nextTitle)
    setSubtitle(nextSubtitle)
    setTagsInput(mergedTags)
    setFeedback(`${seed.label} starter applied.`)
    if (!editor) return

    const hasExistingText = editor.getText().trim().length > 0
    if (!hasExistingText) {
      editor.commands.setContent(`<p>${seed.opening.replace(/\n/g, '</p><p>')}</p>`)
    }
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2] },
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph', 'blockquote'],
        alignments: ['left', 'center', 'right'],
      }),
      TiptapUnderline,
      ResizableImageWithNodeView.configure({ inline: false }),
      TiptapLink.configure({
        openOnClick: false,
        autolink: true,
        defaultProtocol: 'https',
      }),
      InlineFontFamily,
    ],
    content: '<p><br></p>',
    onFocus: () => setIsEditorFocused(true),
    onBlur: () => setIsEditorFocused(false),
    onUpdate: ({ editor: tiptapEditor }: { editor: { getJSON: () => unknown } }) => {
      setContent(editorJsonToStoredContent(tiptapEditor.getJSON() as Record<string, unknown>))
    },
  })

  const refreshFormatState = (activeEditor = editor) => {
    if (!activeEditor) return
    const block = activeEditor.isActive('codeBlock')
      ? 'codeBlock'
      : activeEditor.isActive('heading', { level: 1 })
      ? 'h1'
      : activeEditor.isActive('heading', { level: 2 })
        ? 'h2'
        : activeEditor.isActive('blockquote')
          ? 'blockquote'
          : activeEditor.isActive('paragraph')
            ? 'p'
            : null
    const align = activeEditor.isActive({ textAlign: 'center' })
      ? 'center'
      : activeEditor.isActive({ textAlign: 'right' })
        ? 'right'
        : 'left'
    const currentFontFamily = String(activeEditor.getAttributes('inlineFontFamily').fontFamily || '')
    const matchedFont = WRITER_FONTS.find((font) => currentFontFamily.includes(font.cssValue.split(',')[0]))
    if (matchedFont && matchedFont.key !== writerFont) {
      setWriterFont(matchedFont.key)
    }

    setFormatState({
      block,
      bold: activeEditor.isActive('bold'),
      italic: activeEditor.isActive('italic'),
      underline: activeEditor.isActive('underline'),
      orderedList: activeEditor.isActive('orderedList'),
      unorderedList: activeEditor.isActive('bulletList'),
      align,
      link: activeEditor.isActive('link'),
    })
  }

  const applyBlockFormat = (tag: 'p' | 'h1' | 'h2' | 'blockquote' | 'codeBlock') => {
    if (!editor) return
    if (tag === 'p') editor.chain().focus().setParagraph().run()
    if (tag === 'h1') editor.chain().focus().setHeading({ level: 1 }).run()
    if (tag === 'h2') editor.chain().focus().setHeading({ level: 2 }).run()
    if (tag === 'blockquote') editor.chain().focus().toggleBlockquote().run()
    if (tag === 'codeBlock') editor.chain().focus().setCodeBlock().run()
  }

  const applyInlineFont = (fontKey: WriterFont) => {
    setWriterFont(fontKey)
    if (!editor) return
    const selected = WRITER_FONTS.find((font) => font.key === fontKey)
    if (!selected) return
    editor.chain().focus().setFontFamily(selected.cssValue).run()
  }

  const openLinkPopover = () => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selected = editor.state.doc.textBetween(from, to, ' ').trim()
    setLinkSelection({ from, to })
    setLinkTextInput(selected)
    setLinkUrlInput(editor.getAttributes('link').href || 'https://')
    setIsLinkPopoverOpen(true)
  }

  const resolveAutoImageAlt = () => {
    const trimmed = title.trim()
    if (trimmed) return `${trimmed} image`
    return 'Blog image'
  }

  const insertImageFromUrl = () => {
    if (!editor) return
    const url = window.prompt('Paste image URL', 'https://')
    if (!url) return
    editor.chain().focus().setImage({ src: url, alt: resolveAutoImageAlt() }).run()
  }

  const insertImageFromDevice = () => {
    imageUploadInputRef.current?.click()
  }

  const triggerBackdropUpload = () => {
    backdropUploadInputRef.current?.click()
  }

  const handleImageFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const input = event.target
    const file = input.files?.[0]
    if (!file || !editor) return

    setFeedback('Uploading image...')
    void uploadBlogImage.mutateAsync(file)
      .then(({ url }) => {
        sessionUploadedImageUrlsRef.current.add(url)
        editor.chain().focus().setImage({ src: url, alt: resolveAutoImageAlt() }).run()
        setFeedback('Image added.')
      })
      .catch((error) => {
        setFeedback(getErrorMessage(error))
      })
      .finally(() => {
        input.value = ''
      })
  }

  const handleBackdropFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      const src = typeof reader.result === 'string' ? reader.result : ''
      if (!src) return
      setStudioBackdrop(src)
      event.target.value = ''
    }
    reader.readAsDataURL(file)
  }

  const clearFormatting = () => {
    if (!editor) return
    editor.chain().focus().unsetAllMarks().clearNodes().unsetTextAlign().run()
    refreshFormatState(editor)
  }

  const insertPoemStanzaBreak = () => {
    if (!editor) return
    editor.chain().focus().insertContent('<p><br></p><p><br></p>').run()
  }

  const applyLinkFromPopover = () => {
    if (!editor) return
    const rawUrl = linkUrlInput.trim()
    if (!rawUrl) return
    const normalizedUrl = /^https?:\/\//i.test(rawUrl) ? rawUrl : `https://${rawUrl}`
    const selection = linkSelection ?? editor.state.selection
    const labelFromDoc = editor.state.doc.textBetween(selection.from, selection.to, ' ').trim()
    const label = linkTextInput.trim() || labelFromDoc || normalizedUrl
    const to = selection.from + label.length

    editor
      .chain()
      .focus()
      .insertContentAt({ from: selection.from, to: selection.to }, label)
      .setTextSelection({ from: selection.from, to })
      .setLink({ href: normalizedUrl, target: '_blank', rel: 'noreferrer' })
      .run()

    setLinkSelection(null)
    setIsLinkPopoverOpen(false)
  }

  const isToolbarActionActive = (key: string) => {
    if (key === 'p') return formatState.block === 'p'
    if (key === 'h1') return formatState.block === 'h1'
    if (key === 'h2') return formatState.block === 'h2'
    if (key === 'bold') return formatState.bold
    if (key === 'italic') return formatState.italic
    if (key === 'underline') return formatState.underline
    if (key === 'quote') return formatState.block === 'blockquote'
    if (key === 'olist') return formatState.orderedList
    if (key === 'ulist') return formatState.unorderedList
    if (key === 'left') return formatState.align === 'left'
    if (key === 'center') return formatState.align === 'center'
    if (key === 'right') return formatState.align === 'right'
    if (key === 'link') return formatState.link
    if (key === 'booksDrawer') return isBooksDrawerOpen
    return false
  }

  const toolbarActions: Array<{
    key: string
    label: string
    icon: ReactNode
    onClick: () => void
  }> = [
    { key: 'bold', label: 'Bold (Ctrl/Cmd+B)', icon: <Bold className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleBold().run() },
    { key: 'italic', label: 'Italic (Ctrl/Cmd+I)', icon: <Italic className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleItalic().run() },
    { key: 'underline', label: 'Underline', icon: <Underline className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleUnderline().run() },
    { key: 'olist', label: 'Numbered list', icon: <ListOrdered className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleOrderedList().run() },
    { key: 'ulist', label: 'Bullet list', icon: <List className="h-4 w-4" />, onClick: () => editor?.chain().focus().toggleBulletList().run() },
    { key: 'left', label: 'Align left', icon: <AlignLeft className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('left').run() },
    { key: 'center', label: 'Align center', icon: <AlignCenter className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('center').run() },
    { key: 'right', label: 'Align right', icon: <AlignRight className="h-4 w-4" />, onClick: () => editor?.chain().focus().setTextAlign('right').run() },
    { key: 'link', label: 'Link', icon: <Link2 className="h-4 w-4" />, onClick: openLinkPopover },
    {
      key: 'booksDrawer',
      label: 'Link books',
      icon: <BookOpen className="h-4 w-4" />,
      onClick: () => {
        setIsStudioSetupOpen(false)
        setIsBooksDrawerOpen((prev) => !prev)
      },
    },
    { key: 'imageUpload', label: 'Upload image from device', icon: <ImageIcon className="h-4 w-4" />, onClick: insertImageFromDevice },
    { key: 'imageUrl', label: 'Insert image URL', icon: <Link2 className="h-4 w-4" />, onClick: insertImageFromUrl },
    ...(contentMode === 'POEM'
      ? [{ key: 'stanzaBreak', label: 'Insert stanza break', icon: <Pilcrow className="h-4 w-4" />, onClick: insertPoemStanzaBreak }]
      : []),
  ]

  // Hydrate from local draft storage when creating a new post.
  // Hydration, autosave, editor event wiring, and interaction side effects.
  useEffect(() => {
    if (editBlogId) {
      setHydrated(true)
      return
    }
    try {
      const raw = window.localStorage.getItem(localDraftKey)
      if (!raw) {
        setHydrated(true)
        return
      }

      const parsed = JSON.parse(raw) as Partial<{
        title: string
        subtitle: string
        contentMode: ContentMode
        writerFont: WriterFont
        scheduledAt: string
        coverImage: string
        content: string
        tagsInput: string
        selectedBookIds: string[]
        poemCanvasPreset: PoemCanvasPreset
        isTypewriterMode: boolean
        poemPaperStyle: PoemPaperStyle
        poemInkTone: PoemInkTone
        poemPaperLines: boolean
        poemDeckleEdge: boolean
        poemGrainIntensity: number
        updatedAt: string
      }>

      setTitle(parsed.title ?? '')
      setSubtitle(parsed.subtitle ?? '')
      setContentMode(parsed.contentMode === 'POEM' ? 'POEM' : 'BLOG')
      const localPresentation = getStoredContentPresentation(parsed.content ?? '')
      setPoemAuthorSignature(localPresentation?.authorSignature ?? '')
      setWriterFont(
        WRITER_FONTS.some((font) => font.key === parsed.writerFont)
          ? (parsed.writerFont as WriterFont)
          : localPresentation?.writerFont && WRITER_FONTS.some((font) => font.key === localPresentation.writerFont)
            ? localPresentation.writerFont
            : 'sans',
      )
      setScheduledAt(parsed.scheduledAt ?? '')
      setCoverImage(parsed.coverImage ?? '')
      setContent(parsed.content ?? '')
      setTagsInput(parsed.tagsInput ?? '')
      setSelectedBookIds(Array.isArray(parsed.selectedBookIds) ? parsed.selectedBookIds : [])
      setPoemCanvasPreset(
        POEM_CANVAS_PRESETS.some((preset) => preset.key === parsed.poemCanvasPreset)
          ? (parsed.poemCanvasPreset as PoemCanvasPreset)
          : localPresentation?.canvasPreset && POEM_CANVAS_PRESETS.some((preset) => preset.key === localPresentation.canvasPreset)
            ? localPresentation.canvasPreset
            : 'moonlit',
      )
      setIsTypewriterMode(Boolean(parsed.isTypewriterMode))
      setPoemPaperStyle(
        POEM_PAPER_STYLES.some((paper) => paper.key === parsed.poemPaperStyle)
          ? (parsed.poemPaperStyle as PoemPaperStyle)
          : localPresentation?.paperTemplate && POEM_PAPER_STYLES.some((paper) => paper.key === localPresentation.paperTemplate)
            ? localPresentation.paperTemplate
          : 'vellum',
      )
      setPoemInkTone(
        POEM_INK_TONES.some((tone) => tone.key === parsed.poemInkTone)
          ? (parsed.poemInkTone as PoemInkTone)
          : localPresentation?.inkTone && POEM_INK_TONES.some((tone) => tone.key === localPresentation.inkTone)
            ? localPresentation.inkTone
          : 'sepia',
      )
      setPoemPaperLines(parsed.poemPaperLines ?? localPresentation?.ruledLines ?? false)
      setPoemDeckleEdge(parsed.poemDeckleEdge ?? localPresentation?.deckleEdge ?? true)
      setPoemGrainIntensity(
        typeof parsed.poemGrainIntensity === 'number'
          ? Math.min(80, Math.max(10, parsed.poemGrainIntensity))
          : typeof localPresentation?.grainIntensity === 'number'
            ? Math.min(80, Math.max(10, localPresentation.grainIntensity))
            : 42,
      )
      if (parsed.updatedAt) {
        const parsedDate = new Date(parsed.updatedAt)
        if (!Number.isNaN(parsedDate.getTime())) {
          setAutoSavedAt(parsedDate)
          setAutoSaveState('saved')
        }
      }
    } catch {
      // ignore corrupted local draft
    } finally {
      setHydrated(true)
    }
  }, [editBlogId, localDraftKey])

  // Hydrate remote data when editing an existing post.
  useEffect(() => {
    if (!editingBlog || didHydrateRemoteRef.current) return
    didHydrateRemoteRef.current = true
    didHydrateEditorRef.current = false
    setDraftId(editingBlog.id)
    setTitle(editingBlog.title ?? '')
    setSubtitle(editingBlog.subtitle ?? '')
    setContent(editingBlog.content ?? '')
    const remotePresentation = getStoredContentPresentation(editingBlog.content ?? '')
    setPoemAuthorSignature(remotePresentation?.authorSignature ?? '')
    if (remotePresentation?.writerFont && WRITER_FONTS.some((font) => font.key === remotePresentation.writerFont)) {
      setWriterFont(remotePresentation.writerFont)
    }
    setCoverImage(editingBlog.coverImage ?? '')
    setTagsInput((editingBlog.tags ?? []).map((tag) => tag.name).join(', '))
    setSelectedBookIds((editingBlog.bookReferences ?? []).map((book) => book.id))
    setScheduledAt(toDateTimeLocalValue(editingBlog.scheduledAt))
    if (remotePresentation?.mode === 'POEM') {
      if (remotePresentation.canvasPreset && POEM_CANVAS_PRESETS.some((preset) => preset.key === remotePresentation.canvasPreset)) {
        setPoemCanvasPreset(remotePresentation.canvasPreset)
      }
      if (remotePresentation.paperTemplate && POEM_PAPER_STYLES.some((paper) => paper.key === remotePresentation.paperTemplate)) {
        setPoemPaperStyle(remotePresentation.paperTemplate)
      }
      if (remotePresentation.inkTone && POEM_INK_TONES.some((tone) => tone.key === remotePresentation.inkTone)) {
        setPoemInkTone(remotePresentation.inkTone)
      }
      if (typeof remotePresentation.ruledLines === 'boolean') setPoemPaperLines(remotePresentation.ruledLines)
      if (typeof remotePresentation.deckleEdge === 'boolean') setPoemDeckleEdge(remotePresentation.deckleEdge)
      if (typeof remotePresentation.grainIntensity === 'number') {
        setPoemGrainIntensity(Math.min(80, Math.max(10, remotePresentation.grainIntensity)))
      }
    }
    setHydrated(true)
  }, [editingBlog])

  // Keep TipTap editor content synchronized after hydration.
  useEffect(() => {
    if (!hydrated) return
    if (didHydrateEditorRef.current) return
    if (!editor) return
    editor.commands.setContent(editableHtmlFromStoredContent(content || ''))
    didHydrateEditorRef.current = true
    refreshFormatState(editor)
  }, [content, editor, hydrated])

  useEffect(() => {
    if (!user?.name?.trim()) return
    if (poemAuthorSignature.trim()) return
    setPoemAuthorSignature(user.name.trim())
  }, [poemAuthorSignature, user?.name])

  useEffect(() => {
    if (!hydrated) return

    const hasAnyDraftContent =
      Boolean(title.trim()) ||
      Boolean(subtitle.trim()) ||
      Boolean(plainContent.trim()) ||
      Boolean(tagsInput.trim()) ||
      Boolean(coverImage.trim()) ||
      selectedBookIds.length > 0

    if (!hasAnyDraftContent) {
      window.localStorage.removeItem(localDraftKey)
      setAutoSaveState('idle')
      return
    }

    setAutoSaveState('saving')
    const timeout = window.setTimeout(() => {
      const now = new Date()
      window.localStorage.setItem(
        localDraftKey,
        JSON.stringify({
          title,
          subtitle,
          contentMode,
          writerFont,
          scheduledAt,
          coverImage,
          content: persistedContent,
          tagsInput,
          selectedBookIds,
          poemCanvasPreset,
          isTypewriterMode,
          poemPaperStyle,
          poemInkTone,
          poemPaperLines,
          poemDeckleEdge,
          poemGrainIntensity,
          updatedAt: now.toISOString(),
        }),
      )
      setAutoSavedAt(now)
      setAutoSaveState('saved')
    }, 900)

    return () => window.clearTimeout(timeout)
  }, [hydrated, title, subtitle, contentMode, writerFont, scheduledAt, coverImage, persistedContent, plainContent, tagsInput, selectedBooksText, selectedBookIds, poemCanvasPreset, isTypewriterMode, poemPaperStyle, poemInkTone, poemPaperLines, poemDeckleEdge, poemGrainIntensity, localDraftKey])

  useEffect(() => {
    if (prefersReducedMotion) return
    const handleScroll = () => {
      if (scrollRafRef.current !== null) return
      scrollRafRef.current = window.requestAnimationFrame(() => {
        const damp = Math.max(0.45, 1 - window.scrollY / 2200)
        // Avoid re-rendering on every tiny wheel/touch delta.
        if (Math.abs(damp - scrollDampRef.current) > 0.015) {
          scrollDampRef.current = damp
          setScrollDamp(damp)
        }
        scrollRafRef.current = null
      })
    }
    handleScroll()
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', handleScroll)
      if (scrollRafRef.current !== null) {
        window.cancelAnimationFrame(scrollRafRef.current)
      }
    }
  }, [prefersReducedMotion])

  useEffect(() => {
    if (!editor) return
    const update = () => refreshFormatState(editor)
    editor.on('selectionUpdate', update)
    editor.on('transaction', update)
    return () => {
      editor.off('selectionUpdate', update)
      editor.off('transaction', update)
    }
  }, [editor])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'f') {
        event.preventDefault()
        setIsFocusMode((prev) => !prev)
        return
      }
      if (event.key !== 'Escape') return
      setIsBooksDrawerOpen(false)
      setIsQuickToolsOpen(false)
      setIsFocusMode(false)
      setIsPoemReadModeOpen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (!isFocusMode) return
    setIsQuickToolsOpen(false)
  }, [isFocusMode])

  useEffect(() => {
    if (!isQuickToolsOpen) return
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target
      if (!(target instanceof Node)) return
      if (quickToolsDockRef.current?.contains(target)) return
      setIsQuickToolsOpen(false)
    }
    window.addEventListener('pointerdown', handlePointerDown)
    return () => window.removeEventListener('pointerdown', handlePointerDown)
  }, [isQuickToolsOpen])

  useEffect(() => {
    if (contentMode !== 'POEM') {
      setIsPoemReadModeOpen(false)
    }
  }, [contentMode])

  useEffect(() => {
    if (contentMode === 'POEM') {
      setIsStudioSetupOpen(true)
    }
  }, [contentMode])

  useEffect(() => {
    if (!editor || !isTypewriterMode) return
    let raf: number | null = null
    const alignActiveLine = () => {
      if (!editor.isFocused) return
      if (raf !== null) window.cancelAnimationFrame(raf)
      raf = window.requestAnimationFrame(() => {
        const selection = window.getSelection()
        const anchor = selection?.anchorNode
        const element = anchor instanceof Element ? anchor : anchor?.parentElement
        const target = element?.closest('p, h1, h2, blockquote, li') as HTMLElement | null
        target?.scrollIntoView({ block: 'center', inline: 'nearest' })
      })
    }
    editor.on('selectionUpdate', alignActiveLine)
    editor.on('transaction', alignActiveLine)
    return () => {
      if (raf !== null) window.cancelAnimationFrame(raf)
      editor.off('selectionUpdate', alignActiveLine)
      editor.off('transaction', alignActiveLine)
    }
  }, [editor, isTypewriterMode])

  // Unsaved uploads should be cleaned up if the image node is removed before save.
  useEffect(() => {
    const currentUrls = new Set(extractStoredContentImageUrls(content))
    const pendingDeletes = [...sessionUploadedImageUrlsRef.current].filter((url) => !currentUrls.has(url))

    if (pendingDeletes.length === 0) return

    pendingDeletes.forEach((url) => {
      sessionUploadedImageUrlsRef.current.delete(url)
      void deleteUploadedBlogImage.mutateAsync(url).catch(() => {
        // Best-effort cleanup only; saved-post updates also reconcile removed files.
      })
    })
  }, [content, deleteUploadedBlogImage])

  const handlePointerMove = (event: MouseEvent<HTMLDivElement>) => {
    if (prefersReducedMotion) return
    const rect = event.currentTarget.getBoundingClientRect()
    const normalizedX = ((event.clientX - rect.left) / rect.width - 0.5) * 2
    const normalizedY = ((event.clientY - rect.top) / rect.height - 0.5) * 2
    parallaxX.set(Math.max(-1, Math.min(1, normalizedX)))
    parallaxY.set(Math.max(-1, Math.min(1, normalizedY)))
  }

  const resetParallax = () => {
    parallaxX.set(0)
    parallaxY.set(0)
  }

  const persistPost = async (nextStatus: 'DRAFT' | 'PUBLISHED') => {
    if (hasStoredContentInlineImages(persistedContent)) {
      throw new Error('Please re-upload inline images before saving this post.')
    }

    const normalizedScheduledAt =
      nextStatus === 'PUBLISHED' ? null : toApiDateTime(scheduledAt)
    if (draftId) {
      const updated = await updateBlog.mutateAsync({
        blogId: draftId,
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        content: persistedContent,
        coverImage: coverImage.trim() || undefined,
        tags,
        bookIds: selectedBookIds,
        status: nextStatus,
        scheduledAt: normalizedScheduledAt,
      })
      sessionUploadedImageUrlsRef.current.clear()
      return updated
    }
    const created = await createBlog.mutateAsync({
      title: title.trim(),
      subtitle: subtitle.trim() || undefined,
      content: persistedContent,
      coverImage: coverImage.trim() || undefined,
      tags,
      bookIds: selectedBookIds,
      status: nextStatus,
      scheduledAt: normalizedScheduledAt,
    })
    setDraftId(created.id)
    sessionUploadedImageUrlsRef.current.clear()
    return created
  }

  const submitPost = async (nextStatus: 'DRAFT' | 'PUBLISHED') => {
    setFeedback('')
    setActionInFlight(nextStatus)

    if (!title.trim() || !plainContent.trim()) {
      setFeedback('Title and content are required.')
      setActionInFlight(null)
      return
    }

    try {
      const post = await persistPost(nextStatus)
      setLastSavedAt(new Date())
      window.localStorage.removeItem(localDraftKey)
      if (nextStatus === 'DRAFT') {
        setFeedback('Draft saved successfully.')
        return
      }
      navigate(`/blogs/${post.id}`)
    } catch (error) {
      setFeedback(getErrorMessage(error))
    } finally {
      setActionInFlight(null)
    }
  }

  const scheduleDraft = async () => {
    setFeedback('')
    if (!title.trim() || !plainContent.trim()) {
      setFeedback('Title and content are required.')
      return
    }
    if (!scheduledAt) {
      setIsStudioSetupOpen(false)
      setIsPublishingDetailsOpen(true)
      setFeedback('Choose a schedule time below.')
      requestAnimationFrame(() => {
        scheduleInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        scheduleInputRef.current?.focus()
      })
      return
    }
    try {
      await persistPost('DRAFT')
      setLastSavedAt(new Date())
      const when = new Date(scheduledAt)
      const label = Number.isNaN(when.getTime()) ? scheduledAt : when.toLocaleString()
      setFeedback(`Scheduled for ${label}. This stays as draft until manual publish.`)
    } catch (error) {
      setFeedback(getErrorMessage(error))
    }
  }

  const saveText =
    actionInFlight === 'DRAFT'
      ? 'Saving Draft...'
      : autoSaveState === 'saving'
        ? 'Autosaving...'
        : 'Save Draft'

  const saveStamp = lastSavedAt ?? autoSavedAt
  return (
    // Main studio layout with the writing canvas, side tools, and publishing controls.
    <div
      className={`relative overflow-x-clip bg-gradient-to-b ${currentStudioAtmosphere.shellClass}`}
      onMouseMove={handlePointerMove}
      onMouseLeave={resetParallax}
    >
      <div className="pointer-events-none absolute inset-0">
        <motion.div
          style={{ x: deepLayerX, y: deepLayerY }}
          className="absolute inset-0"
        >
          <div className="absolute -top-40 left-1/4 h-[28rem] w-[28rem] rounded-full bg-blue-300/6 blur-3xl dark:bg-blue-700/6" />
          <div className="absolute bottom-[-10rem] right-[-4rem] h-[24rem] w-[24rem] rounded-full bg-cyan-200/6 blur-3xl dark:bg-cyan-700/5" />
        </motion.div>
        <motion.div
          style={{ x: cloudLayerX, y: cloudLayerY }}
          className="absolute inset-0"
        >
          <div className="absolute top-24 right-10 h-64 w-64 rounded-full bg-amber-200/10 blur-3xl dark:bg-amber-600/8" />
          <div className="absolute top-1/2 left-[-6rem] h-56 w-56 rounded-full bg-slate-200/12 blur-3xl dark:bg-slate-700/8" />
        </motion.div>
        <div className={`absolute inset-0 opacity-20 ${currentStudioAtmosphere.haloClass}`} />
      </div>
      <motion.div
        className="pointer-events-none absolute inset-0 bg-slate-900/25 dark:bg-slate-950/50"
        initial={false}
        animate={{ opacity: isEditorFocused ? 0.12 : 0 }}
        transition={{ duration: 0.24, ease: [0.4, 0, 0.2, 1] }}
      />

      <div className="relative mx-auto w-full px-4 py-8 sm:px-6 lg:px-10">
        {/* Top chrome for navigation and studio mode toggles. */}
        <StudioTopBar
          isFocusMode={isFocusMode}
          onToggleFocusMode={() => setIsFocusMode((prev) => !prev)}
        />

        {!isFocusMode && (
          <section className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white px-6 py-5 shadow-[0_18px_42px_-34px_rgba(15,23,42,0.12)] dark:border-slate-800 dark:bg-slate-950">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-500 dark:text-slate-400">Draft</p>
                <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-50">
                  {contentMode === 'POEM' ? 'Poem' : 'Post'}
                </h1>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
                  {contentMode === 'POEM' ? `${lineCount} lines` : `${wordCount} words`}
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
                  Goal {goalProgress}%
                </span>
                <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 dark:border-slate-700 dark:bg-slate-900">
                  {saveStamp ? `Saved ${saveStamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : 'Draft'}
                </span>
              </div>
            </div>
          </section>
        )}

        {!isFocusMode && (
          <>
            {/* Secondary controls for setup and publishing details. */}
            <section className="mb-6 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setIsBooksDrawerOpen(false)
                setIsStudioSetupOpen((prev) => !prev)
              }}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isStudioSetupOpen
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <Settings2 className="h-4 w-4" />
              {isStudioSetupOpen ? 'Close customize' : 'Customize'}
            </button>
            <button
              type="button"
              onClick={() => setIsPublishingDetailsOpen((prev) => !prev)}
              className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                isPublishingDetailsOpen
                  ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                  : 'border-slate-300 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200'
              }`}
            >
              <Upload className="h-4 w-4" />
              {isPublishingDetailsOpen ? 'Hide post details' : 'Post details'}
            </button>
            </section>
          </>
        )}

        {!isFocusMode && isStudioSetupOpen && (
          <>
            {/* Mobile appearance/setup panel. */}
            <div className="xl:hidden">
            <StudioSetupPanel
              className="mb-6"
              contentMode={contentMode}
              studioTheme={studioTheme}
              studioAtmosphere={studioAtmosphere}
              studioBackdrop={studioBackdrop}
              backdropTint={backdropTint}
              poemCanvasPreset={poemCanvasPreset}
              poemPaperStyle={poemPaperStyle}
              poemInkTone={poemInkTone}
              poemPaperLines={poemPaperLines}
              poemDeckleEdge={poemDeckleEdge}
              poemGrainIntensity={poemGrainIntensity}
              onStudioThemeChange={setStudioTheme}
              onStudioAtmosphereChange={setStudioAtmosphere}
              onTriggerBackdropUpload={triggerBackdropUpload}
              onClearBackdrop={() => setStudioBackdrop('')}
              onBackdropTintChange={setBackdropTint}
              onOpenPoemReadMode={() => setIsPoemReadModeOpen(true)}
              onPoemCanvasPresetChange={setPoemCanvasPreset}
              onPoemPaperStyleChange={setPoemPaperStyle}
              onPoemInkToneChange={setPoemInkTone}
              onPoemPaperLinesChange={setPoemPaperLines}
              onPoemDeckleEdgeChange={setPoemDeckleEdge}
              onPoemGrainIntensityChange={setPoemGrainIntensity}
            />
            </div>
          </>
        )}

        <div className="space-y-6">
          {/* Identity and quick-start guidance live above the editor. */}
          {isFocusMode && <FocusModeBanner />}
          <WriteIdentitySection
            contentMode={contentMode}
            title={title}
            subtitle={subtitle}
            onContentModeChange={setContentMode}
            onTitleChange={setTitle}
            onSubtitleChange={setSubtitle}
          />

          {!isFocusMode && (
            <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-950/90">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-3 text-sm text-slate-600 dark:text-slate-300">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Draft Setup</span>
                  <span>{contentMode === 'POEM' ? `${quickSeeds.length} poem prompts` : `${quickSeeds.length} writing prompts`}</span>
                  <span>{writingGoal} target words</span>
                  <span>{goalProgress}% complete</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsPromptPanelOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                >
                  {isPromptPanelOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {isPromptPanelOpen ? 'Hide prompts & goal' : 'Show prompts & goal'}
                </button>
              </div>
              {isPromptPanelOpen && (
                <div className="mt-4">
                  <QuickStartGoalSection
                    contentMode={contentMode}
                    quickSeeds={quickSeeds}
                    goalProgress={goalProgress}
                    writingGoal={writingGoal}
                    onApplyQuickSeed={applyQuickSeed}
                    onWritingGoalChange={setWritingGoal}
                  />
                </div>
              )}
            </section>
          )}

          <input
            ref={imageUploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageFileChange}
            className="hidden"
          />
          <input
            ref={backdropUploadInputRef}
            type="file"
            accept="image/*"
            onChange={handleBackdropFileChange}
            className="hidden"
          />

          {!isFocusMode && (
            <>
              {/* Mobile editor toolbar. */}
              <section className="lg:hidden rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_20px_50px_-45px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-950">
              <EditorToolPanel
                blockValue={formatState.block ?? 'p'}
                writerFont={writerFont}
                fonts={WRITER_FONTS}
                onBlockChange={applyBlockFormat}
                onFontChange={applyInlineFont}
              >
                <EditorToolbarButtons
                  actions={toolbarActions}
                  isActionActive={isToolbarActionActive}
                  onClearFormatting={clearFormatting}
                />
              </EditorToolPanel>
              </section>
            </>
          )}

          {!isFocusMode && isBooksDrawerOpen && (
            <>
              {/* Mobile linked-books drawer. */}
              <motion.section
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="xl:hidden rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950"
            >
              <BooksDrawer
                selectedBooks={selectedBooks}
                filteredBooks={filteredBooks}
                selectedBookIds={selectedBookIds}
                bookSearch={bookSearch}
                booksCount={books.length}
                onBookSearchChange={setBookSearch}
                onToggleBook={toggleBook}
                onClose={() => setIsBooksDrawerOpen(false)}
                listClassName="mt-3 max-h-72 space-y-2 overflow-y-auto pr-1"
              />
              </motion.section>
            </>
          )}

          <div className="space-y-6">
            <div className="relative space-y-6">
              {!isFocusMode && (
                <>
                  {/* Desktop appearance/setup drawer. */}
                  <StudioSideDrawer isOpen={isStudioSetupOpen} widthClassName="w-[28rem]">
                  <StudioSetupPanel
                    className="max-h-[calc(100vh-7rem)] overflow-y-auto"
                    variant="drawer"
                    onClose={() => setIsStudioSetupOpen(false)}
                    contentMode={contentMode}
                    studioTheme={studioTheme}
                    studioAtmosphere={studioAtmosphere}
                    studioBackdrop={studioBackdrop}
                    backdropTint={backdropTint}
                    poemCanvasPreset={poemCanvasPreset}
                    poemPaperStyle={poemPaperStyle}
                    poemInkTone={poemInkTone}
                    poemPaperLines={poemPaperLines}
                    poemDeckleEdge={poemDeckleEdge}
                    poemGrainIntensity={poemGrainIntensity}
                    onStudioThemeChange={setStudioTheme}
                    onStudioAtmosphereChange={setStudioAtmosphere}
                    onTriggerBackdropUpload={triggerBackdropUpload}
                    onClearBackdrop={() => setStudioBackdrop('')}
                    onBackdropTintChange={setBackdropTint}
                    onOpenPoemReadMode={() => setIsPoemReadModeOpen(true)}
                    onPoemCanvasPresetChange={setPoemCanvasPreset}
                    onPoemPaperStyleChange={setPoemPaperStyle}
                    onPoemInkToneChange={setPoemInkTone}
                    onPoemPaperLinesChange={setPoemPaperLines}
                    onPoemDeckleEdgeChange={setPoemDeckleEdge}
                    onPoemGrainIntensityChange={setPoemGrainIntensity}
                  />
                  </StudioSideDrawer>
                </>
              )}

              {!isFocusMode && (
                <>
                  {/* Desktop linked-books drawer. */}
                  <StudioSideDrawer
                    isOpen={isBooksDrawerOpen}
                    widthClassName="w-[24rem]"
                    wrapperClassName="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950"
                  >
                    <BooksDrawer
                      selectedBooks={selectedBooks}
                      filteredBooks={filteredBooks}
                      selectedBookIds={selectedBookIds}
                      bookSearch={bookSearch}
                      booksCount={books.length}
                      onBookSearchChange={setBookSearch}
                      onToggleBook={toggleBook}
                      onClose={() => setIsBooksDrawerOpen(false)}
                      listClassName="mt-3 max-h-[calc(100vh-12rem)] space-y-2 overflow-y-auto pr-1"
                    />
                  </StudioSideDrawer>
                </>
              )}

              <div
                className={`relative overflow-hidden rounded-3xl border bg-white shadow-[0_28px_82px_-52px_rgba(15,23,42,0.18)] transition-all duration-300 ${
                  contentMode === 'POEM' ? 'mx-auto max-w-3xl bg-transparent shadow-none' : ''
                } ${
                  isEditorFocused
                    ? 'border-amber-300/70 ring-2 ring-amber-300/30 dark:border-amber-400/50 dark:ring-amber-500/20'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
              {/* Floating link editor for the current text selection. */}
              {isLinkPopoverOpen && (
                <LinkPopover
                  linkTextInput={linkTextInput}
                  linkUrlInput={linkUrlInput}
                  onLinkTextInputChange={setLinkTextInput}
                  onLinkUrlInputChange={setLinkUrlInput}
                  onApply={applyLinkFromPopover}
                  onClose={() => setIsLinkPopoverOpen(false)}
                />
              )}

              <div
                className={`relative rounded-[1.7rem] border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-950 ${
                  contentMode === 'POEM' ? `mx-auto max-w-3xl p-3 sm:p-4 ${currentPoemPaper.pageClass}` : ''
                }`}
                style={
                  studioBackdrop
                    ? {
                        backgroundImage: `url(${studioBackdrop})`,
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                      }
                    : undefined
                }
              >
                {/* Main writing canvas and rich-text editor shell. */}
                {studioBackdrop && (
                  <div
                    className="pointer-events-none absolute inset-4 rounded-[1.25rem]"
                    style={{ backgroundColor: `rgba(255,255,255,${backdropTint / 100})` }}
                  />
                )}
                {contentMode === 'POEM' && (
                  <>
                    <div
                      className={`pointer-events-none absolute inset-2 rounded-[1.25rem] ${currentPoemPaper.grainClass}`}
                      style={{ opacity: poemGrainIntensity / 100 }}
                    />
                    {poemPaperLines && (
                      <div className="pointer-events-none absolute inset-2 rounded-[1.25rem] bg-[linear-gradient(to_bottom,rgba(100,116,139,0.15)_1px,transparent_1px)] bg-[size:100%_2.15rem]" />
                    )}
                    {poemDeckleEdge && (
                      <div className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-amber-900/20 shadow-[inset_0_0_0_2px_rgba(120,53,15,0.06),inset_0_0_28px_rgba(120,53,15,0.22)] dark:border-slate-500/25 dark:shadow-[inset_0_0_0_2px_rgba(148,163,184,0.08),inset_0_0_30px_rgba(15,23,42,0.5)]" />
                    )}
                  </>
                )}
                {studioTheme === 'parchment' && (
                  <div className="pointer-events-none absolute inset-2 rounded-[1.25rem] border border-amber-300/45 bg-[radial-gradient(circle_at_12%_14%,rgba(161,98,7,0.12),transparent_24%),radial-gradient(circle_at_88%_90%,rgba(120,53,15,0.18),transparent_26%),radial-gradient(circle_at_50%_50%,rgba(120,53,15,0.06),transparent_62%)] shadow-[inset_0_0_45px_rgba(120,53,15,0.2)]" />
                )}
                {contentMode === 'POEM' ? (
                  <div
                    className={`relative z-10 mx-auto flex h-[44rem] w-full max-w-none flex-col overflow-hidden rounded-[1.3rem] border border-black/8 bg-white/40 px-6 py-8 sm:px-10`}
                  >
                    <header className="shrink-0 border-b border-current/10 pb-6 text-center">
                      <input
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Untitled poem"
                        className="w-full bg-transparent text-center text-4xl font-semibold tracking-tight text-inherit outline-none placeholder:text-current/35 sm:text-5xl"
                      />
                      <input
                        value={subtitle}
                        onChange={(event) => setSubtitle(event.target.value)}
                        placeholder="Optional note or dedication"
                        className="mt-3 w-full bg-transparent text-center text-sm text-inherit/70 outline-none placeholder:text-current/35 sm:text-base"
                      />
                    </header>
                    <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto py-8 pr-2">
                      <EditorContent
                        editor={editor}
                        className={`prose prose-slate h-full max-w-none text-base outline-none [&_.ProseMirror]:min-h-full [&_.ProseMirror]:outline-none [&_.ProseMirror]:whitespace-pre-wrap [&_.ProseMirror]:tracking-[0.01em] [&_.ProseMirror]:leading-9 [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline [&_a]:decoration-primary-400/70 [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:my-2 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 ${currentPoemInk.proseClass}`}
                      />
                    </div>
                    <footer className="shrink-0 border-t border-current/10 pt-5 text-right">
                      <input
                        value={poemAuthorSignature}
                        onChange={(event) => setPoemAuthorSignature(event.target.value)}
                        placeholder={accountAuthorName}
                        className="w-full bg-transparent text-right text-lg font-semibold tracking-[0.04em] text-inherit/80 outline-none placeholder:text-current/35"
                      />
                    </footer>
                  </div>
                ) : (
                  <EditorContent
                    editor={editor}
                    className={`prose prose-slate no-scrollbar relative z-10 h-[70vh] min-h-[44rem] max-w-none overflow-hidden rounded-[1.2rem] border border-black/6 px-8 py-8 text-base outline-none [&_.ProseMirror]:h-full [&_.ProseMirror]:overflow-y-auto [&_.ProseMirror]:outline-none [&_.ProseMirror]:pr-2 [&_a]:font-medium [&_a]:text-primary-700 [&_a]:underline [&_a]:decoration-primary-400/70 [&_a]:underline-offset-2 [&_blockquote]:my-4 [&_blockquote]:border-l-4 [&_blockquote]:border-slate-300 [&_blockquote]:pl-4 [&_blockquote]:italic [&_h1]:mt-6 [&_h1]:mb-3 [&_h1]:text-4xl [&_h1]:font-semibold [&_h2]:mt-5 [&_h2]:mb-3 [&_h2]:text-3xl [&_h2]:font-semibold [&_li]:my-1 [&_ol]:my-4 [&_ol]:list-decimal [&_ol]:pl-6 [&_ul]:my-4 [&_ul]:list-disc [&_ul]:pl-6 leading-8 [&_p]:my-4 ${studioBackdrop ? 'bg-white/70' : currentStudioTheme.pageClass}`}
                  />
                )}
              </div>
              </div>

              <EditorInsightsBar
                wordCount={wordCount}
                readingMinutes={readingMinutes}
                contentMode={contentMode}
                writerFontLabel={currentWriterFont.label}
                lineCount={lineCount}
                stanzaCount={stanzaCount}
                longestLine={longestLine}
                autoSaveState={autoSaveState}
                saveStamp={saveStamp}
              />

              {contentMode === 'POEM' && (
                <section className="rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.16)] dark:border-slate-800 dark:bg-slate-950/90">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="text-sm text-slate-600 dark:text-slate-300">
                      <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">Poem Notes</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsPoemNotesOpen((prev) => !prev)}
                      className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                    >
                      {isPoemNotesOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                      {isPoemNotesOpen ? 'Hide notes' : 'Show notes'}
                    </button>
                  </div>
                  {isPoemNotesOpen && (
                    <div className="mt-4">
                      <PoemNotesSection onInsertStanzaBreak={insertPoemStanzaBreak} />
                    </div>
                  )}
                </section>
              )}

              {!isFocusMode && isPublishingDetailsOpen && (
                <PostDetailsSection
                  coverImage={coverImage}
                  tagsInput={tagsInput}
                  tags={tags}
                  scheduledAt={scheduledAt}
                  scheduleInputRef={scheduleInputRef}
                  onCoverImageChange={setCoverImage}
                  onTagsInputChange={setTagsInput}
                  onScheduledAtChange={setScheduledAt}
                />
              )}

              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => submitPost('DRAFT')}
                  disabled={isSaving}
                  className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-slate-400 hover:bg-slate-100 disabled:opacity-70 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  {saveText}
                </button>
                {!isFocusMode && (
                  <button
                    type="button"
                    onClick={scheduleDraft}
                    disabled={isSaving}
                    className="rounded-full border border-indigo-300 px-4 py-2 text-sm font-semibold text-indigo-700 transition-all duration-150 hover:-translate-y-0.5 hover:border-indigo-400 hover:bg-indigo-50 disabled:opacity-70 dark:border-indigo-700 dark:text-indigo-300 dark:hover:bg-indigo-950/40"
                  >
                    Schedule Draft
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => submitPost('PUBLISHED')}
                  disabled={isSaving}
                  className="rounded-full bg-slate-900 px-5 py-2 text-sm font-semibold text-white transition-all duration-150 hover:-translate-y-0.5 hover:bg-slate-700 disabled:opacity-70 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
                >
                  {actionInFlight === 'PUBLISHED' ? 'Publishing...' : 'Publish'}
                </button>
              </div>

              {feedback && (
                <motion.p
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`text-sm font-medium ${feedback.toLowerCase().includes('saved') ? 'text-emerald-600' : 'text-rose-600'}`}
                >
                  {feedback}
                </motion.p>
              )}
            </div>
          </div>
        </div>
      </div>

      {!isFocusMode && (
        <FloatingQuickToolsDock
          dockRef={quickToolsDockRef}
          isOpen={isQuickToolsOpen}
          onToggle={() => setIsQuickToolsOpen((prev) => !prev)}
        >
            <EditorToolPanel
              title="Quick Tools"
              blockValue={formatState.block ?? 'p'}
              writerFont={writerFont}
              fonts={WRITER_FONTS}
              onBlockChange={applyBlockFormat}
              onFontChange={applyInlineFont}
            >
              <EditorToolbarButtons
                actions={toolbarActions}
                buttonClassName="rounded-md p-2"
                isActionActive={isToolbarActionActive}
                onClearFormatting={clearFormatting}
              />
            </EditorToolPanel>
        </FloatingQuickToolsDock>
      )}

      {isPoemReadModeOpen && contentMode === 'POEM' && (
        <PoemReadModeModal
          pageClassName={currentPoemCanvas.pageClass}
          poemLines={poemDisplayLines}
          subtitle={subtitle}
          title={title}
          onClose={() => setIsPoemReadModeOpen(false)}
        />
      )}
    </div>
  )
}

export default BlogWritePage
