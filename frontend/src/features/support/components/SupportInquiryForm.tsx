import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAuthStore } from '@/store/auth.store'
import { useCreateContact } from '@/services/contact'
import { cn } from '@/lib/utils'
import { getErrorMessage } from '@/lib/api'
import { isValidEmail } from '@/lib/contactValidation'

const TOPICS = [
  'Order issue',
  'Account problem',
  'Book availability',
  'Refund / return',
  'Author inquiry',
  'Publisher / distribution inquiry',
  'Business / marketing proposal',
  'Legal / technical issue',
  'Other',
] as const

type Topic = (typeof TOPICS)[number]
const FIELD_TRANSITION = { type: 'spring', stiffness: 320, damping: 28, mass: 0.76 } as const

type SupportInquiryFormProps = {
  compact?: boolean
  onSubmitted?: () => void
}

const SupportInquiryForm = ({ compact = false, onSubmitted }: SupportInquiryFormProps) => {
  const { user } = useAuthStore()
  const createContact = useCreateContact()

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    topic: '',
    orderId: '',
    bookTitle: '',
    author: '',
    isbn: '',
    language: '',
    requestReason: '',
    format: '',
    penName: '',
    company: '',
    website: '',
    referenceId: '',
    message: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [success, setSuccess] = useState('')

  const topicOptions = useMemo(() => TOPICS.map((t) => ({ label: t, value: t })), [])
  const topic = form.topic as Topic | ''

  const validate = () => {
    const next: Record<string, string> = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.email.trim()) next.email = 'Email is required'
    else if (!isValidEmail(form.email)) next.email = 'Enter a valid email address'
    if (!form.topic.trim()) next.topic = 'Topic is required'

    if ((topic === 'Order issue' || topic === 'Refund / return') && !form.orderId.trim()) {
      next.orderId = 'Order ID is required for this topic'
    }
    if (topic === 'Book availability' && !form.bookTitle.trim()) {
      next.bookTitle = 'Book title is required for this topic'
    }
    if (topic === 'Book availability' && !form.author.trim()) {
      next.author = 'Author is required for book availability checks'
    }
    if (topic === 'Author inquiry') {
      if (!form.penName.trim()) next.penName = 'Pen name is required for author inquiries'
      if (!form.bookTitle.trim()) next.bookTitle = 'Book title is required for author inquiries'
    }
    if (topic === 'Publisher / distribution inquiry') {
      if (!form.company.trim()) next.company = 'Company is required for publisher inquiries'
      if (!form.website.trim()) next.website = 'Website is required for publisher inquiries'
    }
    if (topic === 'Business / marketing proposal' && !form.company.trim()) {
      next.company = 'Company is required for business/marketing proposals'
    }
    if (topic === 'Legal / technical issue' && !form.referenceId.trim()) {
      next.referenceId = 'Reference ID or URL is required for legal/technical issues'
    }

    const messageRequired = topic !== 'Book availability'
    if (messageRequired && !form.message.trim()) next.message = 'Message is required'
    if (topic === 'Book availability' && !form.requestReason.trim() && !form.message.trim()) {
      next.requestReason = 'Add a short reason or message so CS can review.'
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setSuccess('')
    if (!validate()) return

    try {
      const finalMessage =
        form.message.trim()
        || (topic === 'Book availability' && form.requestReason.trim()
          ? `Book availability request.\nReason: ${form.requestReason.trim()}`
          : 'Customer submitted a support request.')

      const result = await createContact.mutateAsync({
        type: 'support',
        name: form.name,
        email: form.email,
        subject: form.topic,
        message: finalMessage,
        metadata: {
          orderId:
            topic === 'Order issue' || topic === 'Refund / return'
              ? form.orderId || undefined
              : undefined,
          bookTitle:
            topic === 'Book availability' || topic === 'Author inquiry'
              ? form.bookTitle || undefined
              : undefined,
          author:
            topic === 'Book availability' || topic === 'Author inquiry'
              ? form.author || undefined
              : undefined,
          isbn:
            topic === 'Book availability' || topic === 'Author inquiry'
              ? form.isbn || undefined
              : undefined,
          language: topic === 'Book availability' ? form.language || undefined : undefined,
          requestReason: topic === 'Book availability' ? form.requestReason || undefined : undefined,
          format: topic === 'Book availability' ? form.format || undefined : undefined,
          penName: topic === 'Author inquiry' ? form.penName || undefined : undefined,
          company:
            topic === 'Publisher / distribution inquiry' || topic === 'Business / marketing proposal'
              ? form.company || undefined
              : undefined,
          website: topic === 'Publisher / distribution inquiry' ? form.website || undefined : undefined,
          referenceId: topic === 'Legal / technical issue' ? form.referenceId || undefined : undefined,
          requestedTeam:
            topic === 'Business / marketing proposal'
              ? 'MKT'
              : topic === 'Legal / technical issue'
                ? 'LEGAL'
                : topic === 'Author inquiry'
                  ? 'AUTHOR'
                  : topic === 'Publisher / distribution inquiry'
                    ? 'PUBLISHER'
                    : undefined,
        },
      })

      setSuccess(
        result.routingSucceeded
          ? 'Inquiry submitted. Customer Service will follow up soon.'
          : 'Message received, but queue routing is unavailable right now. Please contact admin.',
      )
      setForm((prev) => ({
        ...prev,
        topic: '',
        orderId: '',
        bookTitle: '',
        author: '',
        isbn: '',
        language: '',
        requestReason: '',
        format: '',
        penName: '',
        company: '',
        website: '',
        referenceId: '',
        message: '',
      }))
      setErrors({})
      onSubmitted?.()
    } catch (error) {
      setSuccess('')
      setErrors({ form: getErrorMessage(error) })
    }
  }

  const gridClassName = compact ? 'grid gap-3 sm:grid-cols-1' : 'grid gap-4 sm:grid-cols-2'

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.form && <p className="text-sm text-rose-600">{errors.form}</p>}
      {success && <p className="text-sm text-emerald-700 dark:text-emerald-300">{success}</p>}

      <div className={gridClassName}>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Name</label>
          <input
            value={form.name}
            onChange={(event) => setForm({ ...form, name: event.target.value })}
            className={cn(
              'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
              errors.name ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
            )}
          />
          {errors.name && <p className="mt-1 text-xs text-rose-600">{errors.name}</p>}
        </div>
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Email</label>
          <input
            type="email"
            value={form.email}
            onChange={(event) => setForm({ ...form, email: event.target.value })}
            className={cn(
              'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
              errors.email ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
            )}
          />
          {errors.email && <p className="mt-1 text-xs text-rose-600">{errors.email}</p>}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Topic</label>
        <select
          value={form.topic}
          onChange={(event) => setForm({ ...form, topic: event.target.value })}
          className={cn(
            'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
            errors.topic ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
          )}
        >
          <option value="">Select a topic</option>
          {topicOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {errors.topic && <p className="mt-1 text-xs text-rose-600">{errors.topic}</p>}
      </div>

      <AnimatePresence initial={false}>
        {(topic === 'Order issue' || topic === 'Refund / return') && (
          <motion.div
            key="order-fields"
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={FIELD_TRANSITION}
          >
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Order ID</label>
            <input
              value={form.orderId}
              onChange={(event) => setForm({ ...form, orderId: event.target.value })}
              className={cn(
                'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                errors.orderId ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
            />
            {errors.orderId && <p className="mt-1 text-xs text-rose-600">{errors.orderId}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {(topic === 'Book availability' || topic === 'Author inquiry') && (
          <motion.div
            key="book-fields"
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={FIELD_TRANSITION}
            className={gridClassName}
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Book title</label>
              <input
                value={form.bookTitle}
                onChange={(event) => setForm({ ...form, bookTitle: event.target.value })}
                className={cn(
                  'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                  errors.bookTitle ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
                )}
              />
              {errors.bookTitle && <p className="mt-1 text-xs text-rose-600">{errors.bookTitle}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Author</label>
              <input
                value={form.author}
                onChange={(event) => setForm({ ...form, author: event.target.value })}
                className={cn(
                  'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                  errors.author ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
                )}
              />
              {errors.author && <p className="mt-1 text-xs text-rose-600">{errors.author}</p>}
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">ISBN (optional)</label>
              <input
                value={form.isbn}
                onChange={(event) => setForm({ ...form, isbn: event.target.value })}
                className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
              />
            </div>
            {topic === 'Book availability' && (
              <>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Language</label>
                  <input
                    value={form.language}
                    onChange={(event) => setForm({ ...form, language: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Preferred format</label>
                  <select
                    value={form.format}
                    onChange={(event) => setForm({ ...form, format: event.target.value })}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  >
                    <option value="">Not specified</option>
                    <option value="Physical">Physical</option>
                    <option value="Ebook">Ebook</option>
                    <option value="Either">Either</option>
                  </select>
                </div>
                <div className={compact ? '' : 'sm:col-span-2'}>
                  <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Reason / note</label>
                  <input
                    value={form.requestReason}
                    onChange={(event) => setForm({ ...form, requestReason: event.target.value })}
                    placeholder="Short reason (used for quick triage/analytics)"
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-950"
                  />
                  <p className="mt-1 text-[11px] text-slate-500">Short summary of why you need this title.</p>
                  {errors.requestReason && <p className="mt-1 text-xs text-rose-600">{errors.requestReason}</p>}
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {topic === 'Author inquiry' && (
          <motion.div
            key="author-fields"
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={FIELD_TRANSITION}
          >
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Pen name</label>
            <input
              value={form.penName}
              onChange={(event) => setForm({ ...form, penName: event.target.value })}
              className={cn(
                'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                errors.penName ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
            />
            {errors.penName && <p className="mt-1 text-xs text-rose-600">{errors.penName}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {(topic === 'Publisher / distribution inquiry' || topic === 'Business / marketing proposal') && (
          <motion.div
            key="business-fields"
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={FIELD_TRANSITION}
            className={gridClassName}
          >
            <div>
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Company</label>
              <input
                value={form.company}
                onChange={(event) => setForm({ ...form, company: event.target.value })}
                className={cn(
                  'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                  errors.company ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
                )}
              />
              {errors.company && <p className="mt-1 text-xs text-rose-600">{errors.company}</p>}
            </div>
            {topic === 'Publisher / distribution inquiry' && (
              <div>
                <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Website</label>
                <input
                  value={form.website}
                  onChange={(event) => setForm({ ...form, website: event.target.value })}
                  className={cn(
                    'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                    errors.website ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
                  )}
                />
                {errors.website && <p className="mt-1 text-xs text-rose-600">{errors.website}</p>}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence initial={false}>
        {topic === 'Legal / technical issue' && (
          <motion.div
            key="legal-fields"
            layout
            initial={{ opacity: 0, y: 10, scale: 0.99 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.99 }}
            transition={FIELD_TRANSITION}
          >
            <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Reference ID or URL</label>
            <input
              value={form.referenceId}
              onChange={(event) => setForm({ ...form, referenceId: event.target.value })}
              className={cn(
                'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
                errors.referenceId ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
              )}
            />
            {errors.referenceId && <p className="mt-1 text-xs text-rose-600">{errors.referenceId}</p>}
          </motion.div>
        )}
      </AnimatePresence>

      {topic !== 'Book availability' && (
        <div>
          <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">Message</label>
          <p className="mt-1 text-[11px] text-slate-500">
            Detailed context for CS.
          </p>
          <textarea
            value={form.message}
            onChange={(event) => setForm({ ...form, message: event.target.value })}
            rows={compact ? 4 : 5}
            className={cn(
              'mt-2 w-full rounded-xl border px-3 py-2 text-sm dark:bg-slate-950',
              errors.message ? 'border-rose-300' : 'border-slate-200 dark:border-slate-700',
            )}
            placeholder="Detailed message (extra context, links, special request details)."
          />
          {errors.message && <p className="mt-1 text-xs text-rose-600">{errors.message}</p>}
        </div>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={createContact.isPending}
          className="rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.14em] text-cyan-800 disabled:opacity-50 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200"
        >
          {createContact.isPending ? 'Submitting...' : 'Submit To CS'}
        </button>
      </div>
    </form>
  )
}

export default SupportInquiryForm
