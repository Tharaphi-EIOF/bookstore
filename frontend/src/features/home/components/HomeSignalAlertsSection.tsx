import type React from 'react'
import { motion } from 'framer-motion'

type HomeSignalAlertsSectionProps = {
  newsletterEmail: string
  onNewsletterEmailChange: (value: string) => void
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void
}

const HomeSignalAlertsSection = ({
  newsletterEmail,
  onNewsletterEmailChange,
  onSubmit,
}: HomeSignalAlertsSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="mt-8 rounded-2xl border border-slate-200/80 bg-slate-900/90 px-6 py-4 text-white shadow-[0_16px_36px_-30px_rgba(15,23,42,0.65)] dark:border-slate-700/80"
    >
      <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-300">Signal Alerts</p>
          <p className="mt-1 text-sm text-slate-400">Get releases, restocks, and picks tailored to your reading list.</p>
        </div>
        <form onSubmit={onSubmit} className="flex w-full flex-wrap gap-3 lg:w-auto">
          <input
            value={newsletterEmail}
            onChange={(event) => onNewsletterEmailChange(event.target.value)}
            type="email"
            placeholder="Enter your email"
            className="tech-input min-w-[220px] flex-1 rounded-xl border border-slate-500 bg-white/95 px-4 py-2 text-sm text-slate-900 outline-none ring-0 transition lg:w-80"
          />
          <button type="submit" className="tech-primary rounded-xl px-5 py-2 text-sm font-semibold">
            Get alerts
          </button>
        </form>
      </div>
    </motion.section>
  )
}

export default HomeSignalAlertsSection
