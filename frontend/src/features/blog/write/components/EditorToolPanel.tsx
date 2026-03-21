import { type ReactNode } from 'react'
import { type WriterFont } from '../types'

type FontOption = {
  key: WriterFont
  label: string
}

type BlockOption = 'p' | 'h1' | 'h2' | 'blockquote' | 'codeBlock'

type Props = {
  title?: string
  blockValue: BlockOption
  writerFont: WriterFont
  fonts: FontOption[]
  onBlockChange: (value: BlockOption) => void
  onFontChange: (value: WriterFont) => void
  children: ReactNode
}

const EditorToolPanel = ({
  title = 'Editor Tools',
  blockValue,
  writerFont,
  fonts,
  onBlockChange,
  onFontChange,
  children,
}: Props) => {
  return (
    <>
      <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">{title}</p>
      <div className="grid gap-2 sm:grid-cols-2">
        <select
          value={blockValue}
          onChange={(event) => onBlockChange(event.target.value as BlockOption)}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          title="Style"
        >
          <option value="p">Style: Body</option>
          <option value="h1">Style: Heading 1</option>
          <option value="h2">Style: Heading 2</option>
          <option value="blockquote">Style: Quote</option>
          <option value="codeBlock">Style: Code Block</option>
        </select>
        <select
          value={writerFont}
          onChange={(event) => onFontChange(event.target.value as WriterFont)}
          className="w-full rounded-md border border-slate-300 bg-white px-2.5 py-2 text-xs font-semibold text-slate-700 outline-none transition hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:border-slate-600"
          title="Font"
        >
          {fonts.map((font) => (
            <option key={font.key} value={font.key}>{`Font: ${font.label}`}</option>
          ))}
        </select>
      </div>
      <div className="mt-2">{children}</div>
    </>
  )
}

export default EditorToolPanel
