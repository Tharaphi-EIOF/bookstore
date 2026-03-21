import type { ReactNode, Ref } from 'react'

type ReaderOverlayPanelProps = {
  children: ReactNode
  panelRef: Ref<HTMLDivElement>
  panelShellClass: string
}

const ReaderOverlayPanel = ({
  children,
  panelRef,
  panelShellClass,
}: ReaderOverlayPanelProps) => {
  return (
    <div
      ref={panelRef}
      className={`absolute left-4 top-16 z-30 max-h-[55vh] w-full max-w-[22rem] overflow-hidden rounded-3xl border p-3 shadow-2xl backdrop-blur ${panelShellClass}`}
    >
      {children}
    </div>
  )
}

export default ReaderOverlayPanel
