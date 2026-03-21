import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { currency } from '@/features/admin/analytics/lib/analytics-formatters'
import type { AnalyticsDetailContext, AnalyticsRow, GroupBy } from '@/features/admin/analytics/types'

type AnalyticsDetailPanelProps = {
  row: AnalyticsRow
  groupBy: GroupBy
  detailContext: AnalyticsDetailContext
  onClose: () => void
}

const AnalyticsDetailPanel = ({ row, groupBy, detailContext, onClose }: AnalyticsDetailPanelProps) => (
  <div>
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Analytics Detail</p>
        <h3 className="mt-1 text-xl font-bold">{getAnalyticsDetailTitle(row, groupBy)}</h3>
        <p className="mt-2 text-sm text-slate-500">{getAnalyticsDetailSubtitle(row)}</p>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="rounded-full border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        <X className="h-4 w-4" />
      </button>
    </div>

    <div className="mt-4 space-y-4">
      {row.detail.kind === 'authorSales' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailMetric label="Titles" value={String(row.detail.item.totalTitles)} />
            <DetailMetric label="Units Sold" value={String(row.detail.item.soldQty)} />
            <DetailMetric label="Revenue" value={currency(row.detail.item.revenue)} />
          </div>
          <DetailCard title="Top Books">
            <div className="space-y-2">
              {row.detail.item.topBooks.map((book) => (
                <DetailListItem key={book.bookId} title={book.title} subtitle={`Qty sold ${book.quantity}`} />
              ))}
            </div>
          </DetailCard>
          <DetailCard title="Related Catalog Titles">
            <div className="space-y-2">
              {(detailContext?.matchedBooks ?? []).map((book) => (
                <DetailListItem
                  key={book.id}
                  title={book.title}
                  subtitle={`${book.categories.join(', ') || 'No category'} • stock ${book.stock ?? 0}`}
                />
              ))}
              {(detailContext?.matchedBooks?.length ?? 0) === 0 && (
                <EmptyDetail text="No active catalog titles found for this author." />
              )}
            </div>
          </DetailCard>
          <DetailCard title="Sales Ranking Snapshot">
            <div className="space-y-2">
              {(detailContext?.topSalesBooks ?? []).map((book) => (
                <DetailListItem
                  key={book.bookId}
                  title={book.title}
                  subtitle={`${book.author} • ${book.soldQty} sold • ${currency(book.grossSales)}`}
                />
              ))}
              {(detailContext?.topSalesBooks?.length ?? 0) === 0 && (
                <EmptyDetail text="No purchase summary sales rows matched this author." />
              )}
            </div>
          </DetailCard>
        </>
      )}

      {row.detail.kind === 'catalogBreakdown' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailMetric label="Group" value={row.detail.item.key} />
            <DetailMetric label="Books" value={String(row.detail.item.totalBooks)} />
            <DetailMetric label="Stock" value={String(row.detail.item.totalStock)} />
          </div>
          <DetailMetric label="Out Of Stock" value={String(row.detail.item.outOfStockBooks)} />
          <DetailCard title={`Books in this ${groupBy}`}>
            <div className="space-y-2">
              {row.detail.item.books.map((book) => (
                <DetailListItem
                  key={book.id}
                  title={book.title}
                  subtitle={`Stock ${book.stock} • ${book.vendorName || 'No vendor'}${book.categories?.length ? ` • ${book.categories.join(', ')}` : ''}`}
                />
              ))}
            </div>
          </DetailCard>
        </>
      )}

      {row.detail.kind === 'genreStats' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailMetric label="Genre" value={row.detail.item.key} />
            <DetailMetric label="Titles" value={String(row.detail.item.totalBooks)} />
          </div>
          <DetailCard title="Matched Titles">
            <div className="space-y-2">
              {row.detail.item.books.map((book) => (
                <DetailListItem
                  key={book.id}
                  title={book.title}
                  subtitle={`${book.author || 'Unknown author'} • ${book.categories?.join(', ') || 'No category'} • stock ${book.stock ?? 0}`}
                />
              ))}
            </div>
          </DetailCard>
        </>
      )}

      {row.detail.kind === 'categoryStats' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailMetric label="Category" value={row.detail.item.key} />
            <DetailMetric label="Titles" value={String(row.detail.item.totalBooks)} />
          </div>
          <DetailCard title="Matched Titles">
            <div className="space-y-2">
              {row.detail.item.books.map((book) => (
                <DetailListItem
                  key={book.id}
                  title={book.title}
                  subtitle={`${book.author || 'Unknown author'} • ${book.genres?.join(', ') || 'No genre'} • stock ${book.stock ?? 0}`}
                />
              ))}
            </div>
          </DetailCard>
        </>
      )}

      {row.detail.kind === 'restock' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailMetric label="Stock" value={String(row.detail.item.stock)} />
            <DetailMetric label="Shortage" value={String(row.detail.item.shortageSignal)} />
            <DetailMetric label="Pending PO Qty" value={String(row.detail.item.pendingPurchaseQty)} />
          </div>
          <DetailCard title="Demand Signals">
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>Wishlist count: {row.detail.item.wishlistCount}</p>
              <p>Cart demand: {row.detail.item.cartDemand}</p>
              <p>Sold last 30 days: {row.detail.item.soldLast30Days}</p>
              <p>Status: {row.detail.item.stockStatus}</p>
              <p>Categories: {row.detail.item.categories.join(', ') || 'None'}</p>
            </div>
          </DetailCard>
          <DetailCard title="Related Book Leads">
            <div className="space-y-2">
              {(detailContext?.relatedLeads ?? []).map((lead) => (
                <DetailListItem
                  key={lead.id}
                  title={lead.title}
                  subtitle={`${lead.author} • ${lead.status} • priority ${lead.priority}`}
                />
              ))}
              {(detailContext?.relatedLeads?.length ?? 0) === 0 && (
                <EmptyDetail text="No matching book leads found for this restock item." />
              )}
            </div>
          </DetailCard>
        </>
      )}

      {row.detail.kind === 'missingDemand' && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailMetric label="Priority" value={row.detail.item.priority} />
            <DetailMetric label="Status" value={row.detail.item.status} />
          </div>
          <DetailCard title="Inquiry">
            <div className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
              <p>Reference: {row.detail.item.inquiryId}</p>
              <p>
                Requested by: {row.detail.item.requestedBy.name} ({row.detail.item.requestedBy.email})
              </p>
              <p>Created: {new Date(row.detail.item.createdAt).toLocaleString()}</p>
              <p>Likely missing from catalog: {row.detail.item.isLikelyMissingFromCatalog ? 'Yes' : 'No'}</p>
              <p>{row.detail.item.latestMessage || 'No latest message.'}</p>
            </div>
          </DetailCard>
          <DetailCard title="Possible Catalog Matches">
            <div className="space-y-2">
              {row.detail.item.possibleMatches.map((match) => (
                <DetailListItem key={match.id} title={match.title} subtitle={`${match.author} • stock ${match.stock}`} />
              ))}
              {row.detail.item.possibleMatches.length === 0 && (
                <EmptyDetail text="No catalog matches suggested for this inquiry." />
              )}
            </div>
          </DetailCard>
          <DetailCard title="Related Book Leads">
            <div className="space-y-2">
              {(detailContext?.relatedLeads ?? []).map((lead) => (
                <DetailListItem
                  key={lead.id}
                  title={lead.title}
                  subtitle={`${lead.author} • ${lead.status} • priority ${lead.priority}`}
                />
              ))}
              {(detailContext?.relatedLeads?.length ?? 0) === 0 && (
                <EmptyDetail text="No existing book leads matched this inquiry subject." />
              )}
            </div>
          </DetailCard>
        </>
      )}

      {row.detail.kind === 'partnerStats' && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <DetailMetric label="Deals" value={String(row.detail.summary.deals)} />
            <DetailMetric label="Gross" value={currency(row.detail.summary.gross)} />
            <DetailMetric label="Share" value={currency(row.detail.summary.share)} />
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <DetailMetric label="Pending Settlements" value={String(row.detail.summary.pendingSettlements)} />
            <DetailMetric label="Paid Settlements" value={String(row.detail.summary.paidSettlements)} />
          </div>
          <DetailCard title="Partner Deals">
            <div className="space-y-2">
              {(detailContext?.deals ?? []).map((deal) => (
                <DetailListItem
                  key={deal.id}
                  title={deal.book?.title || deal.lead?.title || 'Unlinked deal'}
                  subtitle={`${deal.status} • share ${deal.revenueSharePct}% • ${deal.partnerCompany || deal.partnerEmail || 'No company/contact'}`}
                />
              ))}
              {(detailContext?.deals?.length ?? 0) === 0 && <EmptyDetail text="No deal records found for this partner." />}
            </div>
          </DetailCard>
          <DetailCard title="Settlements">
            <div className="space-y-2">
              {(detailContext?.deals ?? [])
                .flatMap((deal) => deal.settlements ?? [])
                .map((settlement) => (
                  <DetailListItem
                    key={settlement.id}
                    title={`${new Date(settlement.periodStart).toLocaleDateString()} - ${new Date(settlement.periodEnd).toLocaleDateString()}`}
                    subtitle={`${settlement.status} • gross ${currency(Number(settlement.grossSalesAmount))} • share ${currency(Number(settlement.partnerShareAmount))}`}
                  />
                ))}
              {(detailContext?.deals ?? []).flatMap((deal) => deal.settlements ?? []).length === 0 && (
                <EmptyDetail text="No settlements recorded for this partner yet." />
              )}
            </div>
          </DetailCard>
        </>
      )}
    </div>
  </div>
)

const getAnalyticsDetailTitle = (row: AnalyticsRow, groupBy: GroupBy) => {
  if (row.detail.kind === 'authorSales') return row.detail.item.author
  if (row.detail.kind === 'catalogBreakdown') return `${row.detail.item.key} (${groupBy})`
  if (row.detail.kind === 'genreStats') return row.detail.item.key
  if (row.detail.kind === 'categoryStats') return row.detail.item.key
  if (row.detail.kind === 'restock') return row.detail.item.title
  if (row.detail.kind === 'missingDemand') return row.detail.item.subject
  return row.detail.summary.partnerName
}

const getAnalyticsDetailSubtitle = (row: AnalyticsRow) => {
  if (row.detail.kind === 'authorSales') return 'Author performance for the current filters'
  if (row.detail.kind === 'catalogBreakdown') return 'Catalog group details and related book list'
  if (row.detail.kind === 'genreStats') return 'Genre coverage from active catalog titles'
  if (row.detail.kind === 'categoryStats') return 'Category coverage from active catalog titles'
  if (row.detail.kind === 'restock') return `${row.detail.item.author} • ${row.detail.item.stockStatus}`
  if (row.detail.kind === 'missingDemand') return 'Open inquiry and matching catalog context'
  return 'Partner revenue, deal, and settlement breakdown'
}

const DetailMetric = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-xl border p-3 dark:border-slate-700">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{label}</p>
    <p className="mt-1 text-base font-semibold">{value}</p>
  </div>
)

const DetailCard = ({ title, children }: { title: string; children: ReactNode }) => (
  <div className="rounded-xl border p-3 dark:border-slate-700">
    <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">{title}</p>
    <div className="mt-2">{children}</div>
  </div>
)

const DetailListItem = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
    <p className="font-medium">{title}</p>
    <p className="text-xs text-slate-500">{subtitle}</p>
  </div>
)

const EmptyDetail = ({ text }: { text: string }) => <p className="text-sm text-slate-500">{text}</p>

export default AnalyticsDetailPanel
