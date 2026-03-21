import { AnimatePresence, motion, type MotionValue } from 'framer-motion'
import type { Ref } from 'react'
import type { HeroSlide } from '@/features/home/components/types'

type HomeHeroBannerProps = {
  activeHeroSlide?: HeroSlide
  heroParallaxY: MotionValue<number>
  heroParallaxYSoft: MotionValue<number>
  heroRef: Ref<HTMLDivElement>
  heroSlides: HeroSlide[]
  onHeroClick: () => void
  onPauseChange: (paused: boolean) => void
  safeHeroIndex: number
  setActiveHeroIndex: (index: number) => void
}

const HomeHeroBanner = ({
  activeHeroSlide,
  heroParallaxY,
  heroParallaxYSoft,
  heroRef,
  heroSlides,
  onHeroClick,
  onPauseChange,
  safeHeroIndex,
  setActiveHeroIndex,
}: HomeHeroBannerProps) => {
  return (
    <div ref={heroRef} className="relative isolate">
      <motion.div
        aria-hidden
        className="absolute -top-40 left-1/4 h-80 w-80 rounded-full bg-blue-300/40 blur-3xl dark:bg-blue-700/30"
        style={{ y: heroParallaxY }}
      />
      <motion.div
        aria-hidden
        className="absolute -bottom-40 right-0 h-80 w-80 rounded-full bg-teal-300/35 blur-3xl dark:bg-teal-500/25"
        style={{ y: heroParallaxYSoft }}
      />

      <div className="relative border-y border-slate-200/55 bg-transparent dark:border-white/10">
        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.46, ease: 'easeOut' }}
          className="relative min-h-[52vh] overflow-hidden border-b border-slate-200/35 text-white sm:min-h-[60vh] dark:border-white/10"
          onMouseEnter={() => onPauseChange(true)}
          onMouseLeave={() => onPauseChange(false)}
          onClick={onHeroClick}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={`hero-slide-${activeHeroSlide?.id ?? 'fallback'}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.55, ease: 'easeOut' }}
              className="absolute inset-0 bg-cover bg-center"
              style={{
                backgroundImage: activeHeroSlide?.image
                  ? `url(${activeHeroSlide.image})`
                  : 'linear-gradient(112deg,#10213f 0%,#16355f 44%,#1e4a74 100%)',
              }}
            />
          </AnimatePresence>
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(5,10,20,0.28),rgba(5,10,20,0.7))]" />
          <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(105deg,rgba(5,10,20,0.82)_0%,rgba(8,17,34,0.74)_34%,rgba(7,14,27,0.3)_68%,rgba(7,14,27,0.06)_100%)]" />
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_18%_22%,rgba(255,255,255,0.14),rgba(255,255,255,0)_45%)]" />
          <div className="relative mx-auto flex h-full w-[min(96%,80rem)] items-end px-2 py-10 sm:px-4 sm:py-12 lg:px-6">
            <div className="grid w-full gap-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-100/90">
                  {activeHeroSlide?.label || 'Weekly Spotlight'}
                </p>
                <h2 className="mt-3 max-w-3xl font-display text-3xl font-semibold leading-tight text-white sm:text-5xl">
                  {activeHeroSlide?.title || 'Fresh arrivals and editor-led picks worth opening tonight.'}
                </h2>
                <p className="mt-3 max-w-2xl text-sm text-slate-100/85 sm:text-base">
                  {activeHeroSlide?.subtitle || 'Discover limited-time offers, standout releases, and staff-curated reads in one stream.'}
                </p>
              </div>
            </div>
          </div>
          {heroSlides.length > 1 && (
            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full border border-white/30 bg-black/25 px-3 py-1.5 backdrop-blur">
              <div className="flex items-center gap-1.5">
                {heroSlides.map((slide, idx) => (
                  <button
                    key={`hero-dot-${slide.id}-${idx}`}
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation()
                      setActiveHeroIndex(idx)
                    }}
                    className={`h-2.5 rounded-full transition-all ${idx === safeHeroIndex ? 'w-5 bg-cyan-300' : 'w-2.5 bg-white/45 hover:bg-white/70'}`}
                    aria-label={`Go to slide ${idx + 1}`}
                  />
                ))}
              </div>
            </div>
          )}
        </motion.section>
      </div>
    </div>
  )
}

export default HomeHeroBanner
