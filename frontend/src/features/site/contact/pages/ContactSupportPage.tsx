import { Link } from 'react-router-dom'

const GUIDELINES = [
  'Use a clear topic so the right team can triage quickly.',
  'For order/refund, include your order ID.',
  'For book requests, include title, author, and ISBN if available.',
  'For legal/technical issues, include reference links or IDs.',
  'Keep one issue per inquiry for faster resolution.',
]

const ADS = [
  {
    title: 'Publisher Partnerships',
    description: 'Publishers and distributors can now submit catalog collaboration proposals directly to CS routing.',
  },
  {
    title: 'Faster Book Requests',
    description: 'Structured request intake now helps us convert missing-book requests into procurement leads quicker.',
  },
  {
    title: 'Live Inquiry Updates',
    description: 'Track replies and continue the conversation from your notification inbox.',
  },
]

const ContactSupportPage = () => {
  return (
    <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
      <section className="rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Customer Service</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900 dark:text-slate-100">Support Guidelines</h1>
        <p className="mt-3 max-w-3xl text-slate-600 dark:text-slate-400">
          Start a new inquiry from the right-side support drawer in Notifications. This page is now a quick reference
          for what to include so CS can resolve your case faster.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            to="/notifications?compose=support"
            className="rounded-xl border border-cyan-300 bg-cyan-50 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-cyan-800 dark:border-cyan-400/30 dark:bg-cyan-500/10 dark:text-cyan-200"
          >
            Open Support Drawer
          </Link>
          <Link
            to="/notifications"
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold uppercase tracking-[0.12em] text-slate-700 dark:border-slate-700 dark:text-slate-300"
          >
            View My Notifications
          </Link>
        </div>
      </section>

      <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Before You Submit</h2>
        <ul className="mt-4 space-y-2 text-sm text-slate-600 dark:text-slate-400">
          {GUIDELINES.map((item) => (
            <li key={item} className="rounded-xl border border-slate-200 px-4 py-3 dark:border-slate-800">
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="mt-6 grid gap-4 md:grid-cols-3">
        {ADS.map((item) => (
          <article key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <p className="text-sm font-semibold uppercase tracking-[0.14em] text-slate-500">Update</p>
            <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-slate-100">{item.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">{item.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}

export default ContactSupportPage
