import { motion } from 'framer-motion'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Blog } from '@/features/blog/services/blogs'

type HomeBlogSpotlightSectionProps = {
  featuredBlog?: Blog
  isLoading: boolean
  sidebarBlogs: Blog[]
}

const HomeBlogSpotlightSection = ({
  featuredBlog,
  isLoading,
  sidebarBlogs,
}: HomeBlogSpotlightSectionProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="relative mt-10 w-screen overflow-hidden border-y border-slate-200/70 bg-[linear-gradient(115deg,rgba(12,22,41,0.95)_0%,rgba(17,33,61,0.92)_46%,rgba(24,49,79,0.9)_100%)] text-white [margin-left:calc(50%-50vw)] dark:border-white/10"
    >
      <div className="mx-auto w-[min(96%,80rem)]">
        <div className="grid min-h-[340px] lg:grid-cols-[1.2fr_0.8fr]">
          <Link
            to={featuredBlog ? `/blogs/${featuredBlog.id}` : '/blogs'}
            className="group relative overflow-hidden px-6 py-8 sm:px-8"
            style={{
              backgroundImage: featuredBlog?.coverImage
                ? `linear-gradient(98deg,rgba(2,6,23,0.84) 0%,rgba(2,6,23,0.68) 44%,rgba(2,6,23,0.2) 100%),url(${featuredBlog.coverImage})`
                : 'linear-gradient(98deg,rgba(2,6,23,0.9) 0%,rgba(15,23,42,0.82) 52%,rgba(30,58,95,0.72) 100%)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          >
            <motion.div
              aria-hidden
              className="pointer-events-none absolute -right-20 top-0 h-full w-44 bg-white/10"
              animate={{ rotate: [10, 14, 10], x: [0, 16, 0] }}
              transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut' }}
              style={{ transformOrigin: 'top right', clipPath: 'polygon(20% 0%, 100% 0%, 60% 100%, 0% 100%)' }}
            />
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-100/85">Blog Spotlight</p>
            <h3 className="mt-3 max-w-2xl font-display text-3xl leading-tight text-white sm:text-5xl">
              {featuredBlog?.title || 'Voices, ideas, and reading culture'}
            </h3>
            <p className="mt-4 max-w-2xl text-base text-slate-100/85">
              {featuredBlog?.subtitle || 'Long-form stories, practical guides, and commentary from our reading ecosystem.'}
            </p>
            {featuredBlog && (
              <p className="mt-4 text-xs font-semibold uppercase tracking-[0.16em] text-cyan-100/75">
                {featuredBlog.author.name} · {featuredBlog.readingTime} min
              </p>
            )}
          </Link>

          <div className="relative border-t border-white/15 px-6 py-7 sm:px-7 lg:border-l lg:border-t-0">
            <div className="mb-4 flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-200/75">Live Headlines</p>
              <Link to="/blogs" className="inline-flex items-center gap-1 text-sm font-semibold text-cyan-100 transition hover:text-white">
                Explore blogs <ArrowUpRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="space-y-3">
              {sidebarBlogs.length > 0 ? (
                sidebarBlogs.map((post, idx) => (
                  <motion.div
                    key={post.id}
                    initial={{ opacity: 0, y: 14 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.5 }}
                    transition={{ duration: 0.28, delay: idx * 0.06 }}
                    className="border-b border-white/10 pb-3 last:border-b-0 last:pb-0"
                  >
                    <Link to={`/blogs/${post.id}`} className="block transition hover:translate-x-1">
                      <p className="line-clamp-2 text-lg font-semibold leading-tight text-white">{post.title}</p>
                      <p className="mt-1 text-sm text-slate-200/70">
                        {post.author.name} · {post.readingTime} min
                      </p>
                    </Link>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-slate-200/70">
                  {isLoading ? 'Loading latest blog highlights...' : 'No blog highlights yet.'}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.section>
  )
}

export default HomeBlogSpotlightSection
