import { motion, useMotionValue, useScroll, useSpring, useTransform } from 'framer-motion'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useBooks, usePopularBooks, useRecommendedBooks } from '@/services/books'
import { useBlogs } from '@/features/blog/services/blogs'
import { useReadingItems, useReadingSessions } from '@/services/reading'
import { useAuthStore } from '@/store/auth.store'
import BookCarousel from '@/features/books/components/BookCarousel'
import HomeBlogSpotlightSection from '@/features/home/components/HomeBlogSpotlightSection'
import HomeDiscoveryShell from '@/features/home/components/HomeDiscoveryShell'
import HomeHeroBanner from '@/features/home/components/HomeHeroBanner'
import HomeHighlightsPanels from '@/features/home/components/HomeHighlightsPanels'
import HomeReadingDashboard from '@/features/home/components/HomeReadingDashboard'
import HomeSignalAlertsSection from '@/features/home/components/HomeSignalAlertsSection'
import HomeSupportFlowSection from '@/features/home/components/HomeSupportFlowSection'
import type { HeroSlide } from '@/features/home/components/types'
import PromoTicker from '@/components/ui/PromoTicker'

const toDateKey = (date: Date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const CURATED_HERO_SLIDES: HeroSlide[] = [
  {
    id: 'promo-new-arrivals',
    label: 'Promotion',
    title: 'New Arrival Week: Fresh titles just landed.',
    subtitle: 'Explore newly published books across fiction, productivity, and technology.',
    to: '/books?sort=newest',
  },
  {
    id: 'promo-author-blogs',
    label: 'Author Blogs',
    title: 'Go behind the pages with author stories and reading notes.',
    subtitle: 'Read blog posts from writers, discover insights, and follow your favorite voices.',
    to: '/blogs',
  },
  {
    id: 'promo-staff-picks',
    label: 'Staff Picks',
    title: 'Editor-curated picks for your next weekend read.',
    subtitle: 'collections chosen by our editorial team.',
    to: '/books?sort=popular',
  },
  {
    id: 'promo-blog-new',
    label: 'Author Blog',
    title: 'How to Build a Weekly Reading Workflow',
    subtitle: 'A practical post on planning reading sessions and keeping momentum.',
    to: '/blogs/8139dfd7-2fc9-4239-bfac-e0ccd1ee9b30',
    image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?q=80&w=1600&auto=format&fit=crop',
  },
]

const SUPPORT_FLOW_STEPS = [
  { id: 'step-ask', title: 'Ask', detail: 'Share your issue in one form' },
  { id: 'step-route', title: 'Route', detail: 'We triage by topic and urgency' },
  { id: 'step-reply', title: 'Reply', detail: 'Support responds in under 24h' },
  { id: 'step-resolve', title: 'Resolve', detail: 'Track updates until closed' },
]

const HomePage = () => {
  const navigate = useNavigate()
  const { data: booksData, isLoading } = useBooks({ limit: 12, status: 'active' })
  const { isAuthenticated } = useAuthStore()
  const { data: popularBooks, isLoading: isPopularLoading } = usePopularBooks(8)
  const { data: recommendedBooks, isLoading: isRecommendedLoading } = useRecommendedBooks(8, isAuthenticated)
  const { data: blogSpotlightFeed, isLoading: isBlogSpotlightLoading } = useBlogs({ tab: 'trending', page: 1, limit: 4 })
  const { data: readingItems = [], isLoading: isReadingLoading } = useReadingItems({ enabled: isAuthenticated })
  const { data: readingSessions = [] } = useReadingSessions({ enabled: isAuthenticated })
  const [heroSearch, setHeroSearch] = useState('')
  const [newsletterEmail, setNewsletterEmail] = useState('')
  const [queueShuffleSeed, setQueueShuffleSeed] = useState(0)
  const [queueShuffleFxTick, setQueueShuffleFxTick] = useState(0)
  const [queueDeckHovered, setQueueDeckHovered] = useState(false)
  const [activeHeroIndex, setActiveHeroIndex] = useState(0)
  const [isHeroPaused, setIsHeroPaused] = useState(false)
  const [activeBlogIndex, setActiveBlogIndex] = useState(0)
  const [supportAnimMs, setSupportAnimMs] = useState(0)
  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })
  const heroParallaxY = useTransform(scrollYProgress, [0, 1], [0, 90])
  const heroParallaxYSoft = useTransform(scrollYProgress, [0, 1], [0, 52])
  const heroShellScale = useTransform(scrollYProgress, [0, 1], [1, 0.985])
  const tiltX = useMotionValue(0)
  const tiltY = useMotionValue(0)
  const tiltXSpring = useSpring(tiltX, { stiffness: 170, damping: 24, mass: 0.65 })
  const tiltYSpring = useSpring(tiltY, { stiffness: 170, damping: 24, mass: 0.65 })

  const readingNow = readingItems.filter((item) => item.status === 'READING')
  const toRead = readingItems.filter((item) => item.status === 'TO_READ')
  const finished = readingItems.filter((item) => item.status === 'FINISHED')
  const currentBook = readingNow[0]

  const sessionDateKeys = useMemo(() => {
    const keys = new Set<string>()
    for (const session of readingSessions) {
      const sessionDate = new Date(session.sessionDate)
      if (Number.isNaN(sessionDate.getTime())) continue
      keys.add(toDateKey(sessionDate))
    }
    return keys
  }, [readingSessions])

  const statCells = useMemo(() => {
    return Array.from({ length: 28 }).map((_, idx) => {
      const day = new Date()
      day.setHours(0, 0, 0, 0)
      day.setDate(day.getDate() - (27 - idx))
      return sessionDateKeys.has(toDateKey(day))
    })
  }, [sessionDateKeys])

  const shelfTotal = readingItems.length
  const completionRate = shelfTotal > 0
    ? Math.round((finished.length / shelfTotal) * 100)
    : 0

  const readingStreakDays = useMemo(() => {
    if (sessionDateKeys.size === 0) return 0
    const cursor = new Date()
    cursor.setHours(0, 0, 0, 0)
    let count = 0
    while (sessionDateKeys.has(toDateKey(cursor))) {
      count += 1
      cursor.setDate(cursor.getDate() - 1)
    }
    return count
  }, [sessionDateKeys])

  type QueueBook = NonNullable<(typeof toRead)[number]['book']>
  const queuedBooks = toRead
    .map((item) => item.book)
    .filter((book): book is QueueBook => Boolean(book))
  const queuedPreviewBooks = queuedBooks.slice(0, 5)
  const queuedOverflowCount = Math.max(0, queuedBooks.length - queuedPreviewBooks.length)
  const queuedDeckBooks = useMemo(() => {
    if (queuedPreviewBooks.length === 0) return []
    const rotateBy = queueShuffleSeed % queuedPreviewBooks.length
    return [...queuedPreviewBooks.slice(rotateBy), ...queuedPreviewBooks.slice(0, rotateBy)]
  }, [queuedPreviewBooks, queueShuffleSeed])

  const trendingBooks = useMemo(() => {
    const merged = [...(popularBooks || []), ...(recommendedBooks || []), ...(booksData?.books || [])]
    return merged.filter((book, idx, arr) => arr.findIndex((entry) => entry.id === book.id) === idx).slice(0, 5)
  }, [popularBooks, recommendedBooks, booksData?.books])

  const blogSpotlights = blogSpotlightFeed?.items ?? []
  const blogCarousel = useMemo(() => blogSpotlights.slice(0, 6), [blogSpotlights])
  const safeBlogIndex = blogCarousel.length > 0 ? activeBlogIndex % blogCarousel.length : 0
  const featuredBlog = blogCarousel[safeBlogIndex]
  const sidebarBlogs = useMemo(() => {
    if (blogCarousel.length <= 1) return []
    const count = Math.min(4, blogCarousel.length - 1)
    return Array.from({ length: count }, (_, offset) => blogCarousel[(safeBlogIndex + 1 + offset) % blogCarousel.length])
  }, [blogCarousel, safeBlogIndex])

  const heroSlides = useMemo(() => {
    const fallbackCovers = trendingBooks.map((book) => book.coverImage).filter((cover): cover is string => Boolean(cover))

    if (CURATED_HERO_SLIDES.length === 0) {
      return [
        {
          id: 'fallback-discovery',
          label: 'Weekly Spotlight',
          title: 'Fresh arrivals and editor-led picks worth opening tonight.',
          subtitle: 'Discover limited-time offers, standout releases, and staff-curated reads in one stream.',
          to: '/books',
          image: fallbackCovers[0] ?? null,
        },
      ]
    }

    return CURATED_HERO_SLIDES.map((slide, idx) => ({
      ...slide,
      image: slide.image ?? fallbackCovers[idx % Math.max(1, fallbackCovers.length)] ?? null,
    }))
  }, [trendingBooks])

  const safeHeroIndex = heroSlides.length > 0 ? activeHeroIndex % heroSlides.length : 0
  const activeHeroSlide = heroSlides[safeHeroIndex]

  const supportNodeDuration = 1500
  const supportLineDuration = 1100
  const supportPauseDuration = 550
  const supportStepBlock = supportNodeDuration + supportLineDuration + supportPauseDuration
  const supportCycleDuration = SUPPORT_FLOW_STEPS.length * supportStepBlock
  const supportTime = supportAnimMs % supportCycleDuration
  const supportStepIndex = Math.floor(supportTime / supportStepBlock)
  const supportStepElapsed = supportTime % supportStepBlock
  const supportIsNodePhase = supportStepElapsed < supportNodeDuration
  const supportNodeProgress = Math.min(1, supportStepElapsed / supportNodeDuration)
  const supportLineProgress =
    supportStepElapsed >= supportNodeDuration && supportStepElapsed < supportNodeDuration + supportLineDuration
      ? Math.min(1, (supportStepElapsed - supportNodeDuration) / supportLineDuration)
      : supportStepElapsed >= supportNodeDuration + supportLineDuration
        ? 1
        : 0
  const supportCompletedCount = Math.min(
    supportStepIndex + (supportStepElapsed >= supportNodeDuration ? 1 : 0),
    SUPPORT_FLOW_STEPS.length,
  )

  useEffect(() => {
    setActiveHeroIndex(0)
  }, [heroSlides.length])

  useEffect(() => {
    if (isHeroPaused || heroSlides.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveHeroIndex((prev) => (prev + 1) % heroSlides.length)
    }, 5600)
    return () => window.clearInterval(timer)
  }, [isHeroPaused, heroSlides.length])

  useEffect(() => {
    setActiveBlogIndex(0)
  }, [blogCarousel.length])

  useEffect(() => {
    if (blogCarousel.length <= 1) return
    const timer = window.setInterval(() => {
      setActiveBlogIndex((prev) => (prev + 1) % blogCarousel.length)
    }, 6400)
    return () => window.clearInterval(timer)
  }, [blogCarousel.length])

  useEffect(() => {
    const timer = window.setInterval(() => {
      setSupportAnimMs((prev) => (prev + 50) % supportCycleDuration)
    }, 50)
    return () => window.clearInterval(timer)
  }, [supportCycleDuration])

  const handleHeroSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const query = heroSearch.trim()
    navigate(query ? `/books?search=${encodeURIComponent(query)}` : '/books')
  }

  const handleNewsletterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!newsletterEmail.trim()) return
    setNewsletterEmail('')
  }

  const handleHeroCardMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const relativeX = (event.clientX - rect.left) / rect.width
    const relativeY = (event.clientY - rect.top) / rect.height
    tiltX.set((0.5 - relativeY) * 12)
    tiltY.set((relativeX - 0.5) * 14)
  }

  const resetHeroCardTilt = () => {
    tiltX.set(0)
    tiltY.set(0)
  }

  const handleQueueShuffle = () => {
    if (queuedPreviewBooks.length < 2) return
    setQueueShuffleSeed((prev) => prev + 1)
    setQueueShuffleFxTick((prev) => prev + 1)
  }

  const sectionReveal = {
    initial: { opacity: 0, y: 28 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, amount: 0.2 },
    transition: { duration: 0.45, ease: 'easeOut' as const },
  }

  return (
    <div className="luxe-shell min-h-screen text-slate-900 dark:text-slate-100">
      <HomeHeroBanner
        activeHeroSlide={activeHeroSlide}
        heroParallaxY={heroParallaxY}
        heroParallaxYSoft={heroParallaxYSoft}
        heroRef={heroRef}
        heroSlides={heroSlides}
        onHeroClick={() => {
          if (activeHeroSlide?.to) navigate(activeHeroSlide.to)
        }}
        onPauseChange={setIsHeroPaused}
        safeHeroIndex={safeHeroIndex}
        setActiveHeroIndex={setActiveHeroIndex}
      />

      <div className="mx-auto w-[min(96%,80rem)] px-2 pb-10 pt-8 sm:px-4 lg:px-6">
        <PromoTicker className="mb-6" />
        <HomeDiscoveryShell
          handleHeroCardMouseMove={handleHeroCardMouseMove}
          handleHeroSearch={handleHeroSearch}
          heroSearch={heroSearch}
          heroShellScale={heroShellScale}
          onHeroSearchChange={setHeroSearch}
          resetHeroCardTilt={resetHeroCardTilt}
          tiltXSpring={tiltXSpring}
          tiltYSpring={tiltYSpring}
          trendingBooks={trendingBooks}
        />
      </div>

      <div className="mx-auto w-[min(96%,80rem)] px-2 pb-14 pt-8 sm:px-4 lg:px-6">
        <motion.section
          {...sectionReveal}
          className="mt-8"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="section-kicker">Featured Books</p>
              <h2 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-100 sm:text-3xl">
                Precision-ranked highlights
              </h2>
            </div>
            <Link to="/books" className="text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white">
              View collection
            </Link>
          </div>
          <div className="mt-5">
            <BookCarousel
              books={booksData?.books || []}
              isLoading={isLoading}
              showArrows
            />
          </div>
        </motion.section>

        <HomeBlogSpotlightSection
          featuredBlog={featuredBlog}
          isLoading={isBlogSpotlightLoading}
          sidebarBlogs={sidebarBlogs}
        />

        <HomeSupportFlowSection
          steps={SUPPORT_FLOW_STEPS}
          supportCompletedCount={supportCompletedCount}
          supportIsNodePhase={supportIsNodePhase}
          supportLineProgress={supportLineProgress}
          supportNodeProgress={supportNodeProgress}
          supportStepIndex={supportStepIndex}
        />

        <HomeHighlightsPanels
          isAuthenticated={isAuthenticated}
          isPopularLoading={isPopularLoading}
          isRecommendedLoading={isRecommendedLoading}
          popularBooks={popularBooks}
          recommendedBooks={recommendedBooks}
        />

        <HomeReadingDashboard
          completionRate={completionRate}
          currentBook={currentBook}
          finishedCount={finished.length}
          handleQueueShuffle={handleQueueShuffle}
          isReadingLoading={isReadingLoading}
          onQueueDeckHoverChange={setQueueDeckHovered}
          queueDeckHovered={queueDeckHovered}
          queueShuffleFxTick={queueShuffleFxTick}
          queueShuffleSeed={queueShuffleSeed}
          queuedDeckBooks={queuedDeckBooks}
          queuedOverflowCount={queuedOverflowCount}
          readingStreakDays={readingStreakDays}
          shelfTotal={shelfTotal}
          statCells={statCells}
          toReadCount={toRead.length}
        />

        <HomeSignalAlertsSection
          newsletterEmail={newsletterEmail}
          onNewsletterEmailChange={setNewsletterEmail}
          onSubmit={handleNewsletterSubmit}
        />
      </div>
    </div>
  )
}

export default HomePage
