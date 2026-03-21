import { AnimatePresence, motion } from 'framer-motion'
import { MessageCircleMore, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/auth.store'

const SupportChatLauncher = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { isAuthenticated } = useAuthStore()
  const user = useAuthStore((state) => state.user)
  const [open, setOpen] = useState(false)

  const hidden = useMemo(() => {
    if (location.pathname.startsWith('/admin') || location.pathname.startsWith('/cs')) {
      return true
    }
    if (location.pathname === '/notifications') {
      return true
    }
    if (user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN') {
      return true
    }
    return false
  }, [location.pathname, location.search, user?.role])

  if (hidden) return null

  const canUseNotifications = isAuthenticated

  const goToSupportCompose = () => {
    setOpen(false)
    if (canUseNotifications) {
      navigate('/notifications?compose=support')
      return
    }
    navigate('/contact/support')
  }

  const goToTracking = () => {
    setOpen(false)
    if (canUseNotifications) {
      navigate('/notifications')
      return
    }
    navigate('/login')
  }

  const goToGuidelines = () => {
    setOpen(false)
    navigate('/contact/support')
  }

  return (
    <div className="fixed bottom-5 right-5 z-[65] flex flex-col items-end">
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28, mass: 0.8 }}
            className="mb-3 w-[min(88vw,320px)] overflow-hidden rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur dark:border-slate-700 dark:bg-slate-900/95"
          >
            <p className="px-1 text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Need Help?</p>
            <p className="px-1 pt-1 text-sm text-slate-600 dark:text-slate-300">Choose what you want to do.</p>
            <div className="mt-3 space-y-2">
              <button
                type="button"
                onClick={goToSupportCompose}
                className="w-full rounded-xl border border-cyan-300 bg-cyan-50 px-3 py-2 text-left text-sm font-semibold text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200"
              >
                Complaint / New Inquiry
              </button>
              <button
                type="button"
                onClick={goToTracking}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Track My Inquiry
              </button>
              <button
                type="button"
                onClick={goToGuidelines}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-left text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200"
              >
                Guidelines / FAQ
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-white bg-cyan-600 text-white shadow-2xl dark:border-slate-900"
        aria-label={open ? 'Close support options' : 'Open support options'}
      >
        {open ? <X className="h-5 w-5" /> : <MessageCircleMore className="h-6 w-6" />}
      </button>
    </div>
  )
}

export default SupportChatLauncher
