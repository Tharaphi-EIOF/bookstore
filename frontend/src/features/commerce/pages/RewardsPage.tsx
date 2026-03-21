import { Link } from 'react-router-dom'
import { Gift, Sparkles, Ticket, BookOpen } from 'lucide-react'
import Button from '@/components/ui/Button'
import BookCover from '@/components/ui/BookCover'
import { useMyLoyaltyDashboard, useRedeemReward } from '@/services/loyalty'

const RewardsPage = () => {
  const { data, isLoading } = useMyLoyaltyDashboard(true)
  const redeemReward = useRedeemReward()

  if (isLoading || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-10 text-sm text-slate-500 dark:text-slate-400">
        Loading rewards...
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900/80">
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Points Club</p>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold text-slate-900 dark:text-slate-100">Your Rewards</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{data.program.earnRate}</p>
          </div>
          <div className="rounded-3xl bg-amber-50 px-5 py-4 text-center dark:bg-amber-900/20">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-amber-700 dark:text-amber-300">Points Balance</p>
            <p className="mt-2 text-4xl font-black text-slate-900 dark:text-slate-100">{data.user.stickerBalance}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/80">
          <div className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-amber-500" />
            <h2 className="text-xl font-semibold">Redeem Rewards</h2>
          </div>
          <div className="mt-5 grid gap-4 md:grid-cols-2">
            {data.rewards.map((reward) => (
              <div key={reward.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{reward.name}</p>
                    {reward.description && (
                      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{reward.description}</p>
                    )}
                  </div>
                  <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {reward.stickerCost} points
                  </span>
                </div>
                {reward.rewardBook && (
                  <div className="mt-4 flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                    <BookCover src={reward.rewardBook.coverImage} alt={reward.rewardBook.title} className="h-16 w-12 rounded" />
                    <div>
                      <p className="font-medium text-slate-900 dark:text-slate-100">{reward.rewardBook.title}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{reward.rewardBook.author}</p>
                    </div>
                  </div>
                )}
                <div className="mt-4 flex items-center justify-between">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
                    {reward.rewardType === 'FREE_EBOOK'
                      ? 'Instant eBook unlock'
                      : reward.rewardType === 'PERCENT_COUPON'
                        ? `${Number(reward.discountValue)}% off coupon`
                        : `$${Number(reward.discountValue)} off coupon`}
                  </p>
                  <Button
                    size="sm"
                    onClick={() => redeemReward.mutate(reward.id)}
                    disabled={data.user.stickerBalance < reward.stickerCost || redeemReward.isPending}
                  >
                    Redeem
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <Ticket className="h-5 w-5 text-sky-500" />
              <h2 className="text-xl font-semibold">My Coupon Gifts</h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.activePromotions.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400">No personal coupons yet.</p>
              )}
              {data.activePromotions.map((promo) => (
                <div key={promo.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold">{promo.code}</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400">{promo.name}</p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] dark:bg-slate-900">
                      {promo.discountType === 'PERCENT'
                        ? `${Number(promo.discountValue)}% OFF`
                        : `$${Number(promo.discountValue)} OFF`}
                    </span>
                  </div>
                  {promo.endsAt && (
                    <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      Expires {new Date(promo.endsAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white/90 p-6 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-violet-500" />
              <h2 className="text-xl font-semibold">Points History</h2>
            </div>
            <div className="mt-4 space-y-3">
              {data.history.map((entry) => (
                <div key={entry.id} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50/80 p-4 dark:border-slate-800 dark:bg-slate-950/40">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-slate-100">{entry.note || entry.type}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{new Date(entry.createdAt).toLocaleString()}</p>
                  </div>
                  <span className={`text-sm font-semibold ${entry.delta >= 0 ? 'text-emerald-600 dark:text-emerald-300' : 'text-rose-600 dark:text-rose-300'}`}>
                    {entry.delta >= 0 ? '+' : ''}{entry.delta}
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <Link to="/orders" className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 dark:text-amber-300">
                <BookOpen className="h-4 w-4" />
                Keep shopping to earn more
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}

export default RewardsPage
