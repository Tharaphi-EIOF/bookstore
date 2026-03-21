import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { SignUp } from '@clerk/react'
import Logo from '@/components/ui/Logo'

const hasClerkConfigured = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY)

const ClerkRegisterPage = () => {
  if (!hasClerkConfigured) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50 px-4 text-center dark:bg-slate-950">
        <div className="max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-xl dark:border-slate-800 dark:bg-slate-900">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Clerk is not configured</h1>
          <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Add `VITE_CLERK_PUBLISHABLE_KEY` if you want to test Clerk sign-up in this environment.
          </p>
          <Link to="/register" className="mt-5 inline-block text-sm font-semibold text-primary-600 hover:text-primary-700">
            Back to normal registration
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="relative isolate overflow-hidden">
        <div className="absolute -top-28 left-0 h-72 w-72 rounded-full bg-primary-200/50 blur-3xl dark:bg-primary-900/40" />
        <div className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-emerald-200/50 blur-3xl dark:bg-emerald-900/30" />

        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid items-center gap-12 lg:grid-cols-[0.95fr_1.05fr]"
          >
            <div className="rounded-3xl border border-slate-200/70 bg-white/80 p-8 shadow-xl shadow-slate-200/40 backdrop-blur dark:border-slate-800/80 dark:bg-slate-900/80 dark:shadow-slate-900/40">
              <div className="flex items-center justify-between">
                <Logo />
                <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  Clerk Sign Up
                </span>
              </div>

              <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200/70 bg-white dark:border-slate-800 dark:bg-slate-950/80">
                <SignUp
                  path="/auth-testing/clerk/register"
                  routing="path"
                  signInUrl="/auth-testing/clerk/login"
                  forceRedirectUrl="/"
                  fallbackRedirectUrl="/"
                  fallback={<div className="p-6 text-sm text-slate-600 dark:text-slate-300">Loading sign-up...</div>}
                />
              </div>

              <p className="mt-5 text-xs text-slate-500 dark:text-slate-400">
                This screen is for testing Clerk flows only.
              </p>
              <Link to="/register" className="mt-2 inline-block text-sm font-semibold text-slate-600 hover:text-primary-700 dark:text-slate-300">
                Back to normal registration
              </Link>
            </div>

            <div className="hidden lg:block">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300">
                Clerk Testing
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              </div>
              <h1 className="mt-6 text-5xl font-black tracking-tight text-slate-900 dark:text-slate-100">
                Test the hosted Clerk sign-up flow.
              </h1>
              <p className="mt-4 text-lg text-slate-600 dark:text-slate-300">
                Use this screen to verify Clerk invitations, verification, social sign-up, and other hosted identity flows without replacing your old auth.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default ClerkRegisterPage
