import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { ArrowLeft, Check, Copy, CreditCard, ExternalLink, QrCode } from 'lucide-react'
import BlogBreadcrumbs from '@/features/blog/components/BlogBreadcrumbs'
import { getGeneratedCoverBackground } from '@/features/blog/lib/blogCover'
import { resolveMediaUrl } from '@/lib/media'
import { useBlogDetails } from '@/features/blog/services/blogs'

const PRESET_AMOUNTS = [3, 5, 10, 20]

type PaymentMode = 'card' | 'qr'

const BlogSupportPage = () => {
  const { id = '' } = useParams()
  const { data: blog, isLoading, error } = useBlogDetails(id, !!id)
  const [mode, setMode] = useState<PaymentMode>('card')
  const [selectedAmount, setSelectedAmount] = useState<number>(5)
  const [customAmount, setCustomAmount] = useState('')
  const [copied, setCopied] = useState(false)

  const supportUrl = blog?.author.supportUrl ?? ''
  const supportQrImage = blog?.author.supportQrImage ?? ''
  const qrSource = useMemo(() => {
    if (supportQrImage) return resolveMediaUrl(supportQrImage)
    if (!supportUrl) return ''
    return `https://api.qrserver.com/v1/create-qr-code/?size=320x320&data=${encodeURIComponent(supportUrl)}`
  }, [supportQrImage, supportUrl])

  const effectiveAmount = useMemo(() => {
    const parsed = Number(customAmount)
    if (Number.isFinite(parsed) && parsed > 0) return parsed
    return selectedAmount
  }, [customAmount, selectedAmount])

  const coverBackground = getGeneratedCoverBackground(
    `${blog?.id ?? id}:${blog?.title ?? 'post'}:${blog?.authorId ?? 'author'}`,
  )

  const openCheckout = () => {
    if (!supportUrl) return
    window.open(supportUrl, '_blank', 'noopener,noreferrer')
  }

  const copyLink = async () => {
    if (!supportUrl) return
    await navigator.clipboard.writeText(supportUrl)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1400)
  }

  if (error) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-rose-600">Failed to load support page.</div>
  }

  if (isLoading || !blog) {
    return <div className="mx-auto max-w-4xl px-4 py-10 text-sm text-slate-500">Loading support page...</div>
  }

  if (!blog.author.supportEnabled || !blog.author.supportUrl) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-10">
        <p className="text-sm text-slate-600 dark:text-slate-300">This author has not enabled support yet.</p>
        <Link to={`/blogs/${blog.id}`} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-primary-600 dark:text-amber-300">
          <ArrowLeft className="h-4 w-4" /> Back to post
        </Link>
      </div>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <BlogBreadcrumbs
        className="mb-4"
        items={[
          { label: 'Home', to: '/' },
          { label: 'Blogs', to: '/blogs' },
          { label: blog.title, to: `/blogs/${blog.id}` },
          { label: 'Support' },
        ]}
      />

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div
          className="h-44 w-full bg-cover bg-center"
          style={{
            backgroundImage: blog.coverImage
              ? `linear-gradient(180deg,rgba(2,6,23,0.22),rgba(2,6,23,0.7)),url(${blog.coverImage})`
              : coverBackground,
          }}
        />
        <div className="border-t border-slate-200 px-5 py-5 dark:border-slate-800 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Author Support</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
            Support {blog.author.name}
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Your support helps this author continue writing quality posts and curated reading guides.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Link
              to={`/blogs/${blog.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
            >
              <ArrowLeft className="h-4 w-4" /> Back to post
            </Link>
            <Link
              to={`/user/${blog.author.id}`}
              className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
            >
              View author profile
            </Link>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr),300px]">
        <div className="rounded-3xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900 sm:p-6">
          <div className="grid grid-cols-2 gap-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-800/70">
            <button
              type="button"
              onClick={() => setMode('card')}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === 'card'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              <CreditCard className="h-4 w-4" /> Card / Link
            </button>
            <button
              type="button"
              onClick={() => setMode('qr')}
              className={`inline-flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                mode === 'qr'
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-300'
              }`}
            >
              <QrCode className="h-4 w-4" /> QR
            </button>
          </div>

          {mode === 'card' && (
            <div className="mt-5 space-y-4">
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {PRESET_AMOUNTS.map((amount) => {
                  const active = customAmount.length === 0 && selectedAmount === amount
                  return (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => {
                        setCustomAmount('')
                        setSelectedAmount(amount)
                      }}
                      className={`rounded-lg border px-3 py-2 text-sm font-semibold transition ${
                        active
                          ? 'border-slate-900 bg-slate-900 text-white dark:border-slate-100 dark:bg-slate-100 dark:text-slate-900'
                          : 'border-slate-300 text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200'
                      }`}
                    >
                      ${amount}
                    </button>
                  )
                })}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Custom amount</label>
                <div className="mt-2 flex items-center rounded-lg border border-slate-300 px-3 dark:border-slate-700">
                  <span className="text-sm text-slate-500">$</span>
                  <input
                    value={customAmount}
                    onChange={(event) => setCustomAmount(event.target.value)}
                    inputMode="decimal"
                    placeholder="0.00"
                    className="w-full border-0 bg-transparent px-2 py-2.5 text-sm text-slate-900 outline-none dark:text-slate-100"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={openCheckout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200"
              >
                Support ${effectiveAmount} <ExternalLink className="h-4 w-4" />
              </button>
            </div>
          )}

          {mode === 'qr' && (
            <div className="mt-5 space-y-4">
              <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
                {qrSource ? (
                  <img
                    src={qrSource}
                    alt={`QR code to support ${blog.author.name}`}
                    className="h-64 w-64 rounded-lg border border-slate-200 bg-white p-2 dark:border-slate-700"
                  />
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">QR code unavailable.</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => void copyLink()}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
                >
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? 'Copied' : 'Copy Link'}
                </button>
                <button
                  type="button"
                  onClick={openCheckout}
                  className="inline-flex items-center gap-1 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:border-slate-400 dark:border-slate-700 dark:text-slate-200"
                >
                  Open checkout <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Payment Note</p>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Payments are processed on the author’s external page. We do not store your payment details here.
            </p>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">Before You Support</p>
            <ul className="mt-2 space-y-1 text-sm text-slate-600 dark:text-slate-300">
              <li>Verify author name and link before payment.</li>
              <li>Use trusted payment methods only.</li>
              <li>Contact support if link seems suspicious.</li>
            </ul>
          </div>
        </aside>
      </section>
    </main>
  )
}

export default BlogSupportPage
