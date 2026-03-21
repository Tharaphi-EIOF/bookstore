import { useMemo, useState } from 'react'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import Button from '@/components/ui/Button'
import { useBooks } from '@/services/books'
import { usePromotions } from '@/features/admin/services/promotions'
import {
  type LoyaltyRewardType,
  useAdminLoyaltyRewards,
  useCreateLoyaltyReward,
  useGrantPersonalPromotions,
  useGrantStickers,
} from '@/services/loyalty'
import { useUsers } from '@/features/admin/services/users'

const SURFACE_CLASS_NAME =
  'rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900'
const FIELD_CLASS_NAME =
  'h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-950'
const SECTION_TITLE_CLASS_NAME = 'text-lg font-semibold text-slate-900 dark:text-slate-100'
const TABBED_BUTTON_CLASS_NAME =
  'rounded-[18px] px-4 py-2 text-xs font-semibold transition'
type LoyaltyActionView = 'reward' | 'points' | 'coupons'

const AdminLoyaltyPage = () => {
  const { data: rewards = [] } = useAdminLoyaltyRewards()
  const { data: users = [] } = useUsers()
  const { data: booksResponse } = useBooks({ limit: 50 }, { enabled: true })
  const { data: promotions = [] } = usePromotions(true)
  const createReward = useCreateLoyaltyReward()
  const grantPoints = useGrantStickers()
  const grantPromotions = useGrantPersonalPromotions()

  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([])
  const [rewardName, setRewardName] = useState('')
  const [rewardDescription, setRewardDescription] = useState('')
  const [rewardType, setRewardType] = useState<LoyaltyRewardType>('PERCENT_COUPON')
  const [pointCost, setPointCost] = useState('10')
  const [discountValue, setDiscountValue] = useState('5')
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('')
  const [rewardBookId, setRewardBookId] = useState('')
  const [grantAmount, setGrantAmount] = useState('5')
  const [grantNote, setGrantNote] = useState('')
  const [selectedPromotionId, setSelectedPromotionId] = useState('')
  const [userSearch, setUserSearch] = useState('')
  const [actionView, setActionView] = useState<LoyaltyActionView>('reward')
  const [audienceOpen, setAudienceOpen] = useState(false)

  const books = booksResponse?.books ?? []
  const digitalBooks = useMemo(() => books.filter((book) => book.isDigital), [books])
  const selectedUsers = useMemo(
    () => users.filter((user) => selectedUserIds.includes(user.id)),
    [selectedUserIds, users],
  )
  const filteredUsers = useMemo(() => {
    const normalized = userSearch.trim().toLowerCase()
    if (!normalized) return users
    return users.filter((user) =>
      `${user.name} ${user.email}`.toLowerCase().includes(normalized),
    )
  }, [userSearch, users])
  const totalPointBalance = useMemo(
    () => users.reduce((sum, user) => sum + (user.stickerBalance ?? 0), 0),
    [users],
  )
  const activeRewardCount = rewards.filter((reward) => reward.isActive).length
  const usersSortedByPoints = useMemo(
    () => [...users].sort((a, b) => (b.stickerBalance ?? 0) - (a.stickerBalance ?? 0)),
    [users],
  )
  const newestUsers = useMemo(
    () => [...users].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt)),
    [users],
  )

  const toggleUser = (userId: string) => {
    setSelectedUserIds((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    )
  }

  const resetRewardForm = () => {
    setRewardName('')
    setRewardDescription('')
    setRewardType('PERCENT_COUPON')
    setPointCost('10')
    setDiscountValue('5')
    setMaxDiscountAmount('')
    setRewardBookId('')
  }

  const selectTopPointUsers = () => {
    setSelectedUserIds(usersSortedByPoints.slice(0, 5).map((user) => user.id))
  }

  const selectZeroPointUsers = () => {
    setSelectedUserIds(users.filter((user) => (user.stickerBalance ?? 0) === 0).map((user) => user.id))
  }

  const selectNewestUsers = () => {
    setSelectedUserIds(newestUsers.slice(0, 5).map((user) => user.id))
  }

  const createRewardCatalogItem = () => {
    createReward.mutate({
      name: rewardName,
      description: rewardDescription || undefined,
      stickerCost: Number(pointCost),
      rewardType,
      discountValue: rewardType === 'FREE_EBOOK' ? undefined : Number(discountValue),
      maxDiscountAmount: maxDiscountAmount ? Number(maxDiscountAmount) : undefined,
      rewardBookId: rewardType === 'FREE_EBOOK' ? rewardBookId : undefined,
    }, {
      onSuccess: () => resetRewardForm(),
    })
  }

  return (
    <div className="min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="space-y-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
              Loyalty
            </h1>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <KpiCard label="Selected Users" value={selectedUserIds.length} />
            <KpiCard label="Total Rewards" value={rewards.length} />
            <KpiCard label="Active Rewards" value={activeRewardCount} />
            <KpiCard label="Points Balance" value={totalPointBalance} />
          </div>
        </header>

        <section>
          <div className={SURFACE_CLASS_NAME}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className={SECTION_TITLE_CLASS_NAME}>Actions</h2>
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAudienceOpen(true)}
                  className="inline-flex items-center gap-2 rounded-[18px] bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                >
                  <span>Audience</span>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold dark:bg-slate-900/10">
                    {selectedUsers.length}
                  </span>
                </button>
                <div className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-slate-50 p-1 dark:border-slate-800 dark:bg-slate-950">
                  {[
                    { key: 'reward', label: 'Create Reward' },
                    { key: 'points', label: 'Grant Points' },
                    { key: 'coupons', label: 'Gift Promotion' },
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActionView(tab.key as LoyaltyActionView)}
                      className={`${TABBED_BUTTON_CLASS_NAME} ${
                        actionView === tab.key
                          ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                          : 'text-slate-600 hover:bg-white dark:text-slate-300 dark:hover:bg-slate-900'
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {actionView === 'reward' && (
              <div className="mt-5">
              <h2 className={SECTION_TITLE_CLASS_NAME}>Create Reward</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <LabeledField label="Reward Name">
                  <input
                    value={rewardName}
                    onChange={(event) => setRewardName(event.target.value)}
                    placeholder="Reward name"
                    className={FIELD_CLASS_NAME}
                  />
                </LabeledField>
                <LabeledField label="Reward Type">
                  <select
                    value={rewardType}
                    onChange={(event) => setRewardType(event.target.value as LoyaltyRewardType)}
                    className={FIELD_CLASS_NAME}
                  >
                    <option value="PERCENT_COUPON">Percent Coupon</option>
                    <option value="FIXED_COUPON">Fixed Coupon</option>
                    <option value="FREE_EBOOK">Free eBook</option>
                  </select>
                </LabeledField>
                <LabeledField label="Description" className="md:col-span-2">
                  <input
                    value={rewardDescription}
                    onChange={(event) => setRewardDescription(event.target.value)}
                    placeholder="Description"
                    className={FIELD_CLASS_NAME}
                  />
                </LabeledField>
                <LabeledField label="Point Cost">
                  <input
                    value={pointCost}
                    onChange={(event) => setPointCost(event.target.value)}
                    placeholder="Point cost"
                    className={FIELD_CLASS_NAME}
                  />
                </LabeledField>

                {rewardType === 'FREE_EBOOK' ? (
                  <LabeledField label="Free eBook" className="md:col-span-2">
                    <select
                      value={rewardBookId}
                      onChange={(event) => setRewardBookId(event.target.value)}
                      className={FIELD_CLASS_NAME}
                    >
                      <option value="">Choose free eBook</option>
                      {digitalBooks.map((book) => (
                        <option key={book.id} value={book.id}>
                          {book.title} - {book.author}
                        </option>
                      ))}
                    </select>
                  </LabeledField>
                ) : (
                  <>
                    <LabeledField label="Discount Value">
                      <input
                        value={discountValue}
                        onChange={(event) => setDiscountValue(event.target.value)}
                        placeholder="Discount value"
                        className={FIELD_CLASS_NAME}
                      />
                    </LabeledField>
                    <LabeledField label="Max Discount" className="md:col-span-2">
                      <input
                        value={maxDiscountAmount}
                        onChange={(event) => setMaxDiscountAmount(event.target.value)}
                        placeholder="Max discount (optional)"
                        className={FIELD_CLASS_NAME}
                      />
                    </LabeledField>
                  </>
                )}
              </div>

              <div className="mt-5">
                <Button onClick={createRewardCatalogItem} isLoading={createReward.isPending}>
                  Create Reward
                </Button>
              </div>
              </div>
            )}

            {actionView === 'points' && (
              <div className="mt-5">
              <h2 className={SECTION_TITLE_CLASS_NAME}>Grant Points</h2>
              <div className="mt-5 grid gap-3 md:grid-cols-[0.7fr_1.3fr]">
                <LabeledField label="Point Amount">
                  <input
                    value={grantAmount}
                    onChange={(event) => setGrantAmount(event.target.value)}
                    placeholder="Point amount"
                    className={FIELD_CLASS_NAME}
                  />
                </LabeledField>
                <LabeledField label="Note">
                  <input
                    value={grantNote}
                    onChange={(event) => setGrantNote(event.target.value)}
                    placeholder="Why are you granting these points?"
                    className={FIELD_CLASS_NAME}
                  />
                </LabeledField>
              </div>
              <div className="mt-5">
                <Button
                  onClick={() =>
                    grantPoints.mutate({
                      userIds: selectedUserIds,
                      amount: Number(grantAmount),
                      note: grantNote || undefined,
                    })
                  }
                  disabled={selectedUserIds.length === 0}
                  isLoading={grantPoints.isPending}
                >
                  Grant Points
                </Button>
              </div>
              </div>
            )}

            {actionView === 'coupons' && (
              <div className="mt-5">
              <h2 className={SECTION_TITLE_CLASS_NAME}>Gift Promotion</h2>
              <div className="mt-5 grid gap-3">
                <LabeledField label="Promotion Template">
                  <select
                    value={selectedPromotionId}
                    onChange={(event) => setSelectedPromotionId(event.target.value)}
                    className={FIELD_CLASS_NAME}
                  >
                    <option value="">Choose an existing promotion</option>
                    {promotions.map((promotion) => (
                      <option key={promotion.id} value={promotion.id}>
                        {promotion.name} ({promotion.code})
                      </option>
                    ))}
                  </select>
                </LabeledField>
                {selectedPromotionId ? (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-950">
                    {(() => {
                      const promotion = promotions.find((item) => item.id === selectedPromotionId)
                      if (!promotion) return null
                      return (
                        <div className="space-y-1.5">
                          <p className="font-medium text-slate-900 dark:text-slate-100">{promotion.name}</p>
                          <p className="text-sm text-slate-500 dark:text-slate-400">
                            {promotion.discountType === 'PERCENT'
                              ? `${Number(promotion.discountValue)}% off`
                              : `$${Number(promotion.discountValue)} off`}
                            {Number(promotion.minSubtotal) > 0
                              ? ` • Min subtotal $${Number(promotion.minSubtotal)}`
                              : ''}
                          </p>
                          {promotion.description ? (
                            <p className="text-sm text-slate-500 dark:text-slate-400">{promotion.description}</p>
                          ) : null}
                        </div>
                      )
                    })()}
                  </div>
                ) : null}
              </div>
              <div className="mt-5">
                <Button
                  onClick={() =>
                    grantPromotions.mutate({
                      userIds: selectedUserIds,
                      promotionId: selectedPromotionId,
                    })
                  }
                  disabled={selectedUserIds.length === 0 || !selectedPromotionId}
                  isLoading={grantPromotions.isPending}
                >
                  Gift Promotion
                </Button>
              </div>
              </div>
            )}
          </div>
        </section>

        <AdminSlideOverPanel
          open={audienceOpen}
          onClose={() => setAudienceOpen(false)}
          kicker="Audience"
          title="Select Users"
          description={`${filteredUsers.length} available users`}
          widthClassName="max-w-[30rem]"
          footer={(
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
                  Selected
                </p>
                {selectedUsers.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {selectedUsers.slice(0, 4).map((user) => (
                      <span
                        key={user.id}
                        className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
                      >
                        {user.name}
                      </span>
                    ))}
                    {selectedUsers.length > 4 ? (
                      <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
                        +{selectedUsers.length - 4} more
                      </span>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">No users selected yet.</p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserIds([])}
                  disabled={selectedUserIds.length === 0}
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Clear All
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedUserIds(filteredUsers.map((user) => user.id))}
                  className="rounded-[18px] border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
                >
                  Select All
                </button>
              </div>
            </div>
          )}
        >
          <div>
            <input
              value={userSearch}
              onChange={(event) => setUserSearch(event.target.value)}
              placeholder="Search user by name or email"
              className={FIELD_CLASS_NAME}
            />
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={selectTopPointUsers}
              className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Top Points
            </button>
            <button
              type="button"
              onClick={selectZeroPointUsers}
              className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Zero Points
            </button>
            <button
              type="button"
              onClick={selectNewestUsers}
              className="rounded-[18px] border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              Newest
            </button>
          </div>

          <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
            <div className="max-h-[24rem] space-y-2 overflow-y-auto pr-1">
              {filteredUsers.map((user) => {
                const isSelected = selectedUserIds.includes(user.id)
                return (
                  <label
                    key={user.id}
                    className={`flex cursor-pointer items-center justify-between rounded-xl border px-3 py-2.5 transition ${
                      isSelected
                        ? 'border-slate-900 bg-white dark:border-slate-200 dark:bg-slate-900'
                        : 'border-transparent bg-white hover:border-slate-200 dark:bg-slate-900 dark:hover:border-slate-700'
                    }`}
                  >
                    <span className="min-w-0 pr-3">
                      <span className="block truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                        {user.name}
                      </span>
                      <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">
                        {user.email}
                      </span>
                    </span>
                    <div className="flex items-center gap-3">
                      <span className="hidden text-[11px] font-medium text-slate-500 dark:text-slate-400 sm:inline">
                        {user.stickerBalance ?? 0} pts
                      </span>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleUser(user.id)}
                        className="h-4 w-4 rounded border-slate-300 text-slate-900"
                      />
                    </div>
                  </label>
                )
              })}
            </div>
          </div>
        </AdminSlideOverPanel>

        <section className={SURFACE_CLASS_NAME}>
          <div className="flex items-center justify-between gap-3">
            <h2 className={SECTION_TITLE_CLASS_NAME}>Reward Catalog</h2>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-600 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300">
              {rewards.length} rewards
            </span>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {rewards.map((reward) => (
              <div
                key={reward.id}
                className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-slate-900 dark:text-slate-100">{reward.name}</p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                      {reward.description || reward.rewardType}
                    </p>
                  </div>
                  <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
                    {reward.stickerCost} points
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}

const LabeledField = ({
  label,
  children,
  className = '',
}: {
  label: string
  children: React.ReactNode
  className?: string
}) => (
  <label className={`space-y-1.5 ${className}`.trim()}>
    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500 dark:text-slate-400">
      {label}
    </span>
    {children}
  </label>
)

const KpiCard = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">
      {label}
    </p>
    <p className="mt-4 text-3xl font-black tracking-tight text-slate-900 dark:text-slate-100">
      {value}
    </p>
  </div>
)

export default AdminLoyaltyPage
