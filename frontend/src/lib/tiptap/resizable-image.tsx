import { mergeAttributes } from '@tiptap/core'
import TiptapImage from '@tiptap/extension-image'
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from '@tiptap/react'
import { useRef, type MouseEvent as ReactMouseEvent } from 'react'

const MIN_IMAGE_WIDTH_PERCENT = 15
const MAX_IMAGE_WIDTH_PERCENT = 100

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const normalizeWidth = (rawWidth?: string | null) => {
  if (!rawWidth) return '100%'
  const trimmed = rawWidth.trim()
  if (trimmed.endsWith('%')) {
    const numeric = Number(trimmed.slice(0, -1))
    if (Number.isNaN(numeric)) return '100%'
    return `${clamp(numeric, MIN_IMAGE_WIDTH_PERCENT, MAX_IMAGE_WIDTH_PERCENT).toFixed(1)}%`
  }
  const numeric = Number(trimmed)
  if (Number.isNaN(numeric)) return '100%'
  return `${clamp(numeric, MIN_IMAGE_WIDTH_PERCENT, MAX_IMAGE_WIDTH_PERCENT).toFixed(1)}%`
}

const mergeWidthStyle = (style: string | null | undefined, width: string) => {
  const base = (style ?? '').trim()
  const suffix = base ? `${base}; ` : ''
  return `${suffix}width: ${width}; max-width: 100%; height: auto;`
}

export const ResizableImage = TiptapImage.extend({
  draggable: true,
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        parseHTML: (element) => {
          const fromData = element.getAttribute('data-width')
          if (fromData) return normalizeWidth(fromData)
          const fromStyle = (element as HTMLElement).style.width
          if (fromStyle) return normalizeWidth(fromStyle)
          return '100%'
        },
        renderHTML: (attributes) => {
          const width = normalizeWidth(typeof attributes.width === 'string' ? attributes.width : undefined)
          return {
            'data-width': width,
            style: mergeWidthStyle(typeof attributes.style === 'string' ? attributes.style : '', width),
          }
        },
      },
    }
  },
  renderHTML({ HTMLAttributes }) {
    const width = normalizeWidth(typeof HTMLAttributes.width === 'string' ? HTMLAttributes.width : undefined)
    const attrs = {
      ...HTMLAttributes,
      width: undefined,
      style: mergeWidthStyle(typeof HTMLAttributes.style === 'string' ? HTMLAttributes.style : '', width),
      'data-width': width,
      draggable: 'true',
    }
    return ['img', mergeAttributes(this.options.HTMLAttributes, attrs)]
  },
})

const ResizableImageNodeView = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const wrapperRef = useRef<HTMLSpanElement | null>(null)
  const width = normalizeWidth(typeof node.attrs.width === 'string' ? node.attrs.width : '100%')

  const startResize = (event: ReactMouseEvent<HTMLButtonElement>) => {
    event.preventDefault()
    event.stopPropagation()

    const wrapper = wrapperRef.current
    const editorSurface = wrapper?.closest('.ProseMirror') as HTMLElement | null
    if (!wrapper || !editorSurface) return

    const startX = event.clientX
    const editorWidth = Math.max(editorSurface.clientWidth, 1)
    const startWidthPx = wrapper.getBoundingClientRect().width

    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaX = moveEvent.clientX - startX
      const nextWidthPx = Math.max(80, startWidthPx + deltaX)
      const widthPercent = clamp((nextWidthPx / editorWidth) * 100, MIN_IMAGE_WIDTH_PERCENT, MAX_IMAGE_WIDTH_PERCENT)
      updateAttributes({ width: `${widthPercent.toFixed(1)}%` })
    }

    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      document.body.style.userSelect = ''
      document.body.style.cursor = ''
    }

    document.body.style.userSelect = 'none'
    document.body.style.cursor = 'ew-resize'
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  return (
    <NodeViewWrapper
      as="span"
      ref={wrapperRef}
      className={`group relative my-4 inline-block max-w-full ${selected ? 'ring-2 ring-primary-400/55' : ''}`}
      style={{ width }}
      data-drag-handle
      draggable="true"
    >
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || 'Image'}
        title={node.attrs.title || ''}
        className="block h-auto w-full rounded-xl border border-slate-200 object-contain dark:border-slate-700"
        draggable
      />
      <button
        type="button"
        onMouseDown={startResize}
        className="absolute bottom-1 right-1 h-4 w-4 rounded-sm border border-white/75 bg-slate-900/75 opacity-0 shadow transition group-hover:opacity-100 group-focus-within:opacity-100"
        aria-label="Resize image"
        title="Drag to resize"
      />
    </NodeViewWrapper>
  )
}

export const ResizableImageWithNodeView = ResizableImage.extend({
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageNodeView)
  },
})
