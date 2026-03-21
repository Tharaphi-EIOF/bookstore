export type ContentMode = 'BLOG' | 'POEM'
export type WriterFont = 'sans' | 'serif' | 'display' | 'mono' | 'cursive' | 'handwritten'
export type PoemCanvasPreset = 'moonlit' | 'ink' | 'sunset' | 'rain'
export type PoemPaperStyle = 'vellum' | 'aged' | 'linen' | 'charcoal'
export type PoemInkTone = 'sepia' | 'midnight' | 'moss' | 'wine'

export type QuickSeed = {
  label: string
  title: string
  subtitle: string
  opening: string
  tags: string[]
}
