import { type ContentMode, type PoemCanvasPreset, type PoemInkTone, type PoemPaperStyle, type QuickSeed, type WriterFont } from './types'

export type StudioTheme = 'classic' | 'parchment' | 'mist' | 'night'
export type StudioAtmosphere = 'dawn' | 'library' | 'aurora' | 'noir'

export const toDateTimeLocalValue = (value?: string | null) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
  return local.toISOString().slice(0, 16)
}

export const toApiDateTime = (value?: string | null) => {
  if (!value?.trim()) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
}

export const STUDIO_THEMES: Array<{
  key: StudioTheme
  label: string
  pageClass: string
  frameClass: string
}> = [
  {
    key: 'classic',
    label: 'Classic',
    pageClass: 'bg-[#fdfaf3] text-slate-800 dark:text-slate-100',
    frameClass: 'from-amber-100/60 to-amber-50/20 dark:from-slate-900/90 dark:to-slate-900/70',
  },
  {
    key: 'parchment',
    label: 'Parchment',
    pageClass: 'bg-[#f7efd8] text-[#5b4630]',
    frameClass: 'from-[#e9d6a2]/45 to-[#f6edd2]/20',
  },
  {
    key: 'mist',
    label: 'Mist',
    pageClass: 'bg-[#eef4ff] text-[#21324a]',
    frameClass: 'from-cyan-100/50 to-sky-100/20',
  },
  {
    key: 'night',
    label: 'Night',
    pageClass: 'bg-[#111827] text-slate-100',
    frameClass: 'from-slate-800/65 to-slate-900/45',
  },
]

export const STUDIO_ATMOSPHERES: Array<{
  key: StudioAtmosphere
  label: string
  shellClass: string
  haloClass: string
}> = [
  {
    key: 'dawn',
    label: 'Dawn',
    shellClass: 'from-[#dce7f8] via-[#f7f8fc] to-[#edf2f8] dark:from-[#040b17] dark:via-[#0d1525] dark:to-[#070d19]',
    haloClass:
      'bg-[radial-gradient(circle_at_18%_14%,rgba(255,255,255,0.58),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(240,249,255,0.42),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(255,255,255,0.22),transparent_38%)] dark:bg-[radial-gradient(circle_at_18%_14%,rgba(30,64,175,0.2),transparent_42%),radial-gradient(circle_at_85%_15%,rgba(8,145,178,0.16),transparent_40%),radial-gradient(circle_at_50%_90%,rgba(30,41,59,0.24),transparent_38%)]',
  },
  {
    key: 'library',
    label: 'Library',
    shellClass: 'from-[#efe6d7] via-[#f7f0e5] to-[#ece5d7] dark:from-[#1b1511] dark:via-[#201915] dark:to-[#17110d]',
    haloClass:
      'bg-[radial-gradient(circle_at_20%_16%,rgba(251,191,36,0.2),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(251,146,60,0.16),transparent_34%)] dark:bg-[radial-gradient(circle_at_20%_16%,rgba(180,83,9,0.26),transparent_34%),radial-gradient(circle_at_78%_18%,rgba(146,64,14,0.2),transparent_34%)]',
  },
  {
    key: 'aurora',
    label: 'Aurora',
    shellClass: 'from-[#d9f0ef] via-[#e7f3ff] to-[#efe9ff] dark:from-[#05121a] dark:via-[#0a1825] dark:to-[#17132a]',
    haloClass:
      'bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.25),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(56,189,248,0.2),transparent_36%),radial-gradient(circle_at_55%_90%,rgba(168,85,247,0.16),transparent_36%)] dark:bg-[radial-gradient(circle_at_10%_20%,rgba(34,211,238,0.22),transparent_38%),radial-gradient(circle_at_88%_12%,rgba(59,130,246,0.22),transparent_36%),radial-gradient(circle_at_55%_90%,rgba(147,51,234,0.18),transparent_36%)]',
  },
  {
    key: 'noir',
    label: 'Noir',
    shellClass: 'from-[#d8dde7] via-[#e9edf4] to-[#dce2ec] dark:from-[#020617] dark:via-[#030b1a] dark:to-[#070f1e]',
    haloClass:
      'bg-[radial-gradient(circle_at_18%_16%,rgba(148,163,184,0.25),transparent_34%),radial-gradient(circle_at_80%_14%,rgba(125,211,252,0.14),transparent_34%)] dark:bg-[radial-gradient(circle_at_18%_16%,rgba(30,41,59,0.38),transparent_34%),radial-gradient(circle_at_80%_14%,rgba(8,47,73,0.24),transparent_34%)]',
  },
]

export const WRITER_FONTS: Array<{
  key: WriterFont
  label: string
  cssValue: string
}> = [
  { key: 'sans', label: 'Sans', cssValue: 'Inter, ui-sans-serif, system-ui, sans-serif' },
  { key: 'serif', label: 'Serif', cssValue: 'ui-serif, Georgia, Cambria, "Times New Roman", serif' },
  { key: 'display', label: 'Display', cssValue: 'Poppins, Inter, ui-sans-serif, system-ui, sans-serif' },
  { key: 'mono', label: 'Mono', cssValue: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace' },
  { key: 'cursive', label: 'Cursive', cssValue: '"Apple Chancery", "Snell Roundhand", "Brush Script MT", cursive' },
  { key: 'handwritten', label: 'Handwritten', cssValue: '"Segoe Print", "Comic Sans MS", "Bradley Hand", cursive' },
]

export const POEM_CANVAS_PRESETS: Array<{
  key: PoemCanvasPreset
  label: string
  description: string
  frameClass: string
  pageClass: string
}> = [
  {
    key: 'moonlit',
    label: 'Moonlit',
    description: 'Soft contrast and quiet glow',
    frameClass: 'from-indigo-200/50 via-slate-100/40 to-sky-100/30 dark:from-indigo-900/45 dark:via-slate-900/45 dark:to-sky-900/30',
    pageClass: 'bg-[#f5f7ff] text-[#1f2a44] dark:bg-[#0f172a] dark:text-slate-100',
  },
  {
    key: 'ink',
    label: 'Ink Wash',
    description: 'Monochrome studio with crisp strokes',
    frameClass: 'from-slate-200/70 via-zinc-100/40 to-slate-100/20 dark:from-slate-800/65 dark:via-zinc-900/45 dark:to-slate-900/30',
    pageClass: 'bg-[#f8f8f7] text-[#22262d] dark:bg-[#111418] dark:text-slate-100',
  },
  {
    key: 'sunset',
    label: 'Sunset Paper',
    description: 'Warm tones and mellow highlights',
    frameClass: 'from-orange-200/55 via-amber-100/35 to-rose-100/25 dark:from-orange-900/45 dark:via-amber-900/30 dark:to-rose-900/20',
    pageClass: 'bg-[#fff8ee] text-[#4a2f1f] dark:bg-[#1a130f] dark:text-amber-50',
  },
  {
    key: 'rain',
    label: 'Rain Glass',
    description: 'Cool atmosphere with airy spacing',
    frameClass: 'from-cyan-200/55 via-blue-100/35 to-slate-100/25 dark:from-cyan-900/45 dark:via-blue-900/30 dark:to-slate-900/20',
    pageClass: 'bg-[#edf7fb] text-[#173544] dark:bg-[#0a1a24] dark:text-cyan-50',
  },
]

export const POEM_PAPER_STYLES: Array<{
  key: PoemPaperStyle
  label: string
  pageClass: string
  grainClass: string
}> = [
  {
    key: 'vellum',
    label: 'Vellum',
    pageClass: 'bg-[#fbf4e2]',
    grainClass: 'bg-[radial-gradient(circle_at_14%_16%,rgba(120,53,15,0.08),transparent_24%),radial-gradient(circle_at_82%_84%,rgba(120,53,15,0.07),transparent_22%)]',
  },
  {
    key: 'aged',
    label: 'Aged',
    pageClass: 'bg-[#f4e6c7]',
    grainClass: 'bg-[radial-gradient(circle_at_8%_12%,rgba(120,53,15,0.16),transparent_26%),radial-gradient(circle_at_92%_10%,rgba(161,98,7,0.12),transparent_28%),radial-gradient(circle_at_86%_88%,rgba(120,53,15,0.1),transparent_24%)]',
  },
  {
    key: 'linen',
    label: 'Linen',
    pageClass: 'bg-[#f8f6ef]',
    grainClass: 'bg-[linear-gradient(to_right,rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(to_bottom,rgba(148,163,184,0.1)_1px,transparent_1px)] bg-[size:22px_22px,22px_22px]',
  },
  {
    key: 'charcoal',
    label: 'Charcoal',
    pageClass: 'bg-[#17171b]',
    grainClass: 'bg-[radial-gradient(circle_at_12%_18%,rgba(100,116,139,0.2),transparent_24%),radial-gradient(circle_at_86%_82%,rgba(71,85,105,0.24),transparent_22%)]',
  },
]

export const POEM_INK_TONES: Array<{
  key: PoemInkTone
  label: string
  proseClass: string
}> = [
  { key: 'sepia', label: 'Sepia Ink', proseClass: '[&_.ProseMirror]:text-[#4c3322]' },
  { key: 'midnight', label: 'Midnight Ink', proseClass: '[&_.ProseMirror]:text-[#1f2b45]' },
  { key: 'moss', label: 'Moss Ink', proseClass: '[&_.ProseMirror]:text-[#1f3c2f]' },
  { key: 'wine', label: 'Wine Ink', proseClass: '[&_.ProseMirror]:text-[#4b2332]' },
]

export const BLOG_QUICK_SEEDS: QuickSeed[] = [
  {
    label: 'Essay',
    title: 'How Small Reading Rituals Change a Week',
    subtitle: 'A practical reflection from daily reading notes',
    opening: 'Start with one honest observation.\n\nWhat changed when you committed to ten minutes each day?',
    tags: ['writing', 'reflection'],
  },
  {
    label: 'Review',
    title: 'Book Notes: What Worked, What Stayed',
    subtitle: 'Short review structure with clear takeaways',
    opening: 'This book succeeds when it ____. The strongest section is ____. The one limitation is ____.',
    tags: ['review', 'books'],
  },
]

export const POEM_QUICK_SEEDS: QuickSeed[] = [
  {
    label: 'Free Verse',
    title: 'After Rain',
    subtitle: 'A poem about quiet change',
    opening: 'The street is still learning\nhow to hold the light\n\nafter all that weather.',
    tags: ['poem', 'free-verse'],
  },
  {
    label: 'Love Poem',
    title: 'Letter Without Address',
    subtitle: 'A soft, intimate tone',
    opening: 'I kept your name\nbetween two pages\nso it could breathe.',
    tags: ['poem', 'love'],
  },
]

export const getQuickSeedsByMode = (contentMode: ContentMode) =>
  contentMode === 'POEM' ? POEM_QUICK_SEEDS : BLOG_QUICK_SEEDS
