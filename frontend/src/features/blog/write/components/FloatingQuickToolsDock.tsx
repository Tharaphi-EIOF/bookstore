import { motion } from 'framer-motion'
import { PanelRightClose, PanelRightOpen } from 'lucide-react'
import type { ReactNode, Ref } from 'react'

type FloatingQuickToolsDockProps = {
  children: ReactNode
  dockRef: Ref<HTMLDivElement>
  isOpen: boolean
  onToggle: () => void
}

const FloatingQuickToolsDock = ({
  children,
  dockRef,
  isOpen,
  onToggle,
}: FloatingQuickToolsDockProps) => {
  return (
    <div ref={dockRef} className="fixed bottom-6 left-4 z-50 hidden lg:block">
      <motion.div
        initial={false}
        animate={{ y: isOpen ? 0 : 14, opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none' }}
        transition={{ duration: 0.18, ease: [0.4, 0, 0.2, 1] }}
        className="mb-2 w-[18rem] rounded-2xl border border-white/70 bg-white/86 p-3 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.62)] backdrop-blur-2xl dark:border-slate-700/75 dark:bg-slate-900/86"
      >
        {children}
      </motion.div>
      <button
        type="button"
        onMouseDown={(event) => event.preventDefault()}
        onClick={onToggle}
        className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white/90 px-4 py-2 text-sm font-semibold text-slate-700 shadow-[0_18px_35px_-24px_rgba(15,23,42,0.6)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:border-slate-400 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-900/90 dark:text-slate-200 dark:hover:border-slate-600 dark:hover:text-white"
      >
        {isOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
        Tools
      </button>
    </div>
  )
}

export default FloatingQuickToolsDock
