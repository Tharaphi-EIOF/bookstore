import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import type { Book } from '@/lib/schemas'
import BookCover from '@/components/ui/BookCover'
import BookCornerRibbon from '@/components/ui/BookCornerRibbon'

type HomeHighlightsPanelsProps = {
  isAuthenticated: boolean
  isPopularLoading: boolean
  isRecommendedLoading: boolean
  popularBooks?: Book[]
  recommendedBooks?: Book[]
}

const HomeHighlightsPanels = ({
  isAuthenticated,
  isPopularLoading,
  isRecommendedLoading,
  popularBooks,
  recommendedBooks,
}: HomeHighlightsPanelsProps) => {
  return (
    <div className="mt-10 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        whileHover={{ y: -4, rotateX: 1.2, rotateY: -1.2 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        style={{ transformPerspective: 1200 }}
        className="surface-panel relative overflow-hidden p-6"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -right-14 top-0 h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(96,165,250,0.2),rgba(96,165,250,0))] blur-2xl dark:bg-[radial-gradient(circle,rgba(223,190,130,0.18),rgba(223,190,130,0))]"
          animate={{ x: [0, 10, 0], y: [0, 8, 0], opacity: [0.65, 1, 0.65] }}
          transition={{ duration: 7.5, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Best Seller</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">
              {popularBooks?.[0]?.title || 'Top Seller This Week'}
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {popularBooks?.[0]?.author ? `by ${popularBooks[0].author}` : 'Reader favorite'}
            </p>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {popularBooks?.[0]?.price ? `$${Number(popularBooks[0].price).toFixed(2)}` : ''}
          </div>
        </div>

        <div className="mt-6 grid gap-6 md:grid-cols-[0.55fr_1fr]">
          <motion.div
            whileHover={{ y: -6, rotateY: -5, rotateX: 3 }}
            transition={{ type: 'spring', stiffness: 220, damping: 18 }}
            style={{ transformPerspective: 1300 }}
            className="tech-card p-4"
          >
            <div className="group relative overflow-hidden rounded-xl">
              <BookCornerRibbon className="h-20 w-20" />
              <BookCover
                src={popularBooks?.[0]?.coverImage}
                alt={popularBooks?.[0]?.title || 'Best seller'}
                className="aspect-[2/3] w-full rounded-xl object-cover transition-transform duration-500 group-hover:scale-[1.035]"
              />
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-y-0 -left-1/2 w-1/2 bg-[linear-gradient(100deg,transparent,rgba(255,255,255,0.32),transparent)]"
                animate={{ x: ['-120%', '230%'] }}
                transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut', repeatDelay: 1.2 }}
              />
            </div>
          </motion.div>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300">
            <p className="leading-relaxed">
              {popularBooks?.[0]?.description ||
                'A standout bestseller this week. Readers love its pacing, characters, and unforgettable payoff.'}
            </p>
            <div className="flex items-center gap-4 text-xs text-slate-500 dark:text-slate-400">
              <span>Top Rated</span>
              <span>Bestseller</span>
              <span>In Stock</span>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                to={popularBooks?.[0]?.id ? `/books/${popularBooks[0].id}` : '/books'}
                className="tech-primary inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                View details
              </Link>
              <Link
                to="/books"
                className="tech-secondary inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]"
              >
                All best sellers
              </Link>
            </div>
          </div>
        </div>

        {isPopularLoading && (
          <div className="mt-4 rounded-2xl border border-dashed border-slate-200 p-4 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
            Loading best seller...
          </div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        whileHover={{ y: -4, rotateX: 1.1, rotateY: 1 }}
        transition={{ type: 'spring', stiffness: 180, damping: 20 }}
        style={{ transformPerspective: 1200 }}
        className="surface-panel relative overflow-hidden p-6"
      >
        <motion.div
          aria-hidden
          className="pointer-events-none absolute -left-12 bottom-0 h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(20,184,166,0.18),rgba(20,184,166,0))] blur-2xl dark:bg-[radial-gradient(circle,rgba(56,189,248,0.16),rgba(56,189,248,0))]"
          animate={{ x: [0, -8, 0], y: [0, 10, 0], opacity: [0.6, 0.95, 0.6] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        />
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">Recommended</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100">By Your Taste</h2>
          </div>
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
            {isAuthenticated ? 'Personalized' : 'Sign in for more'}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-4">
          {(recommendedBooks || []).slice(0, 4).map((book, idx) => (
            <motion.div
              key={book.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.28, delay: idx * 0.05 }}
              whileHover={{ y: -4, scale: 1.01 }}
              className="tech-card group flex gap-3 p-3"
            >
              <BookCover
                src={book.coverImage}
                alt={book.title}
                className="h-20 w-14 rounded-lg object-cover transition-transform duration-300 group-hover:scale-[1.04]"
              />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {book.title}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">by {book.author}</p>
                <p className="mt-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  ${Number(book.price).toFixed(2)}
                </p>
              </div>
            </motion.div>
          ))}

          {isRecommendedLoading && (
            <div className="col-span-2 rounded-2xl border border-dashed border-slate-200 p-6 text-center text-xs text-slate-400 dark:border-slate-700 dark:text-slate-500">
              Loading recommendations...
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

export default HomeHighlightsPanels
