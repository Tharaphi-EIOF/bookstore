import { motion } from 'framer-motion'
import { Check } from 'lucide-react'

type SupportFlowStep = {
  id: string
  title: string
  detail: string
}

type HomeSupportFlowSectionProps = {
  steps: SupportFlowStep[]
  supportCompletedCount: number
  supportIsNodePhase: boolean
  supportLineProgress: number
  supportNodeProgress: number
  supportStepIndex: number
}

const HomeSupportFlowSection = ({
  steps,
  supportCompletedCount,
  supportIsNodePhase,
  supportLineProgress,
  supportNodeProgress,
  supportStepIndex,
}: HomeSupportFlowSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative mt-10 w-screen overflow-hidden bg-transparent py-8 [margin-left:calc(50%-50vw)]"
    >
      <div className="mx-auto w-[min(96%,80rem)] px-5 sm:px-7">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-700 dark:text-cyan-300">Support Path</p>
        <h3 className="mt-2 font-display text-3xl text-slate-900 dark:text-slate-100">Get help fast with a clear response flow</h3>
        <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
          From inquiry to resolution, every step is trackable and structured.
        </p>

        <div className="relative mt-7">
          <div className="grid gap-5 md:grid-cols-4">
            {steps.map((step, idx) => {
              const isDone = idx < supportCompletedCount
              const isActive = idx === supportStepIndex && supportIsNodePhase
              const ringLength = 126

              return (
                <motion.div
                  key={step.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.5 }}
                  transition={{ duration: 0.3, delay: idx * 0.06 }}
                  className="relative"
                >
                  {idx < steps.length - 1 && (
                    <div className="pointer-events-none absolute -right-10 left-5 top-5 hidden h-px bg-slate-300/70 dark:bg-white/15 md:block">
                      <motion.div
                        className="h-full origin-left bg-cyan-400 dark:bg-amber-300"
                        animate={{
                          scaleX:
                            supportStepIndex < idx
                              ? 0
                              : supportStepIndex > idx
                                ? 1
                                : supportLineProgress,
                        }}
                        transition={{ duration: 0.16, ease: 'linear' }}
                      />
                    </div>
                  )}

                  <motion.div
                    className={`relative inline-flex h-10 w-10 items-center justify-center rounded-full border text-xs font-semibold shadow-[0_8px_20px_-14px_rgba(8,145,178,0.6)] ${
                      isDone
                        ? 'border-cyan-500 bg-cyan-500 text-white dark:border-amber-300 dark:bg-amber-300 dark:text-slate-900'
                        : 'border-cyan-300/70 bg-white/85 text-cyan-700 dark:border-cyan-400/40 dark:bg-white/10 dark:text-cyan-300'
                    }`}
                    animate={isActive ? { scale: [1, 1.03, 1] } : { scale: 1 }}
                    transition={{ duration: 0.8, repeat: isActive ? Infinity : 0, ease: 'easeInOut' }}
                  >
                    {isDone ? (
                      <motion.span
                        initial={{ scale: 0.45, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', stiffness: 320, damping: 18 }}
                      >
                        <Check className="h-4 w-4" />
                      </motion.span>
                    ) : (
                      <span>{idx + 1}</span>
                    )}

                    {isActive && (
                      <svg className="pointer-events-none absolute inset-0 -rotate-90" viewBox="0 0 44 44" aria-hidden>
                        <circle cx="22" cy="22" r="20" fill="none" stroke="currentColor" strokeWidth="2.8" className="text-cyan-400/25 dark:text-amber-300/30" />
                        <circle
                          cx="22"
                          cy="22"
                          r="20"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2.8"
                          strokeLinecap="round"
                          className="text-cyan-500 dark:text-amber-300"
                          strokeDasharray={ringLength}
                          strokeDashoffset={ringLength * (1 - supportNodeProgress)}
                        />
                      </svg>
                    )}
                  </motion.div>
                  <p className="mt-3 text-sm font-semibold uppercase tracking-[0.14em] text-slate-900 dark:text-slate-100">{step.title}</p>
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{step.detail}</p>
                </motion.div>
              )
            })}
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default HomeSupportFlowSection
