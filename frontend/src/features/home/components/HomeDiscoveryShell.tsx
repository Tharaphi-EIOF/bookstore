import { motion, type MotionValue } from 'framer-motion'
import type React from 'react'
import { Link } from 'react-router-dom'
import type { Book } from '@/lib/schemas'
import BookCover from '@/components/ui/BookCover'

type HomeDiscoveryShellProps = {
  handleHeroCardMouseMove: (event: React.MouseEvent<HTMLDivElement>) => void
  handleHeroSearch: (event: React.FormEvent<HTMLFormElement>) => void
  heroSearch: string
  heroShellScale: MotionValue<number>
  onHeroSearchChange: (value: string) => void
  resetHeroCardTilt: () => void
  tiltXSpring: MotionValue<number>
  tiltYSpring: MotionValue<number>
  trendingBooks: Book[]
}

const HomeDiscoveryShell = ({
  handleHeroCardMouseMove,
  handleHeroSearch,
  heroSearch,
  heroShellScale,
  onHeroSearchChange,
  resetHeroCardTilt,
  tiltXSpring,
  tiltYSpring,
  trendingBooks,
}: HomeDiscoveryShellProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ scale: heroShellScale }}
      className="luxe-panel section-reveal w-full rounded-[36px] p-7 sm:p-8"
    >
      <div className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr]">
        <div>
          <p className="section-kicker text-blue-700 dark:text-blue-300">Smart Discovery</p>
          <h1 className="mt-4 font-display text-4xl font-semibold leading-tight text-slate-900 dark:text-slate-100 sm:text-5xl">
            Precision-picked reads, ranked by what you love.
          </h1>
          <p className="mt-4 max-w-xl text-sm text-slate-600 dark:text-slate-300">
            Signal-driven curation blends editorial taste with real-time trends to surface the right
            book at the right moment.
          </p>
          <form onSubmit={handleHeroSearch} className="mt-6 flex flex-wrap gap-3">
            <input
              value={heroSearch}
              onChange={(event) => onHeroSearchChange(event.target.value)}
              placeholder="Search by title, author, or collection"
              className="tech-input min-w-[220px] flex-1 rounded-full border border-slate-300 bg-white/95 px-4 py-2.5 text-sm text-slate-900 outline-none ring-0 transition"
            />
            <button
              type="submit"
              className="tech-primary rounded-full px-6 py-2.5 text-sm font-semibold"
            >
              <motion.span
                className="inline-flex"
                animate={{ y: [0, -2.5, 0] }}
                transition={{ duration: 1.9, repeat: Infinity, ease: 'easeInOut' }}
              >
                Search the library
              </motion.span>
            </button>
            <Link
              to="/books"
              className="tech-secondary inline-flex items-center justify-center rounded-full px-5 py-2.5 text-sm font-semibold"
            >
              Browse catalog
            </Link>
          </form>
          <div className="mt-6 flex flex-wrap gap-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            <span>Trend-weighted picks</span>
            <span>Instant availability</span>
            <span>Precision filters</span>
          </div>
        </div>

        <motion.div
          onMouseMove={handleHeroCardMouseMove}
          onMouseLeave={resetHeroCardTilt}
          onBlur={resetHeroCardTilt}
          style={{
            rotateX: tiltXSpring,
            rotateY: tiltYSpring,
            transformPerspective: 1200,
          }}
          transition={{ type: 'spring', stiffness: 180, damping: 24 }}
          className="luxe-card tone-hover-gold lift-3d rounded-3xl p-5"
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-500 dark:text-slate-400">Discovery Stack</p>
            <Link to="/books" className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-700 hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200">
              View all
            </Link>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3">
            {trendingBooks.slice(0, 3).map((book, idx) => (
              <motion.div
                key={book.id}
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + (idx * 0.08), duration: 0.36 }}
              >
                <Link
                  to={`/books/${book.id}`}
                  className="luxe-card tone-hover-gold block rounded-2xl p-2"
                >
                  <BookCover src={book.coverImage} alt={book.title} className="aspect-[2/3] w-full rounded-xl object-cover" />
                  <p className="mt-2 truncate text-xs font-semibold text-slate-800 dark:text-slate-100">{book.title}</p>
                  <p className="truncate text-[0.7rem] text-slate-500 dark:text-slate-400">{book.author}</p>
                </Link>
              </motion.div>
            ))}
          </div>
          <div className="mt-5 rounded-2xl border border-slate-200 bg-white/70 p-4 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            Smart discovery adapts to your reading velocity, genre affinity, and live demand.
          </div>
        </motion.div>
      </div>
    </motion.section>
  )
}

export default HomeDiscoveryShell
