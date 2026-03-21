import { useMemo, useState } from 'react'
import { Trash2 } from 'lucide-react'
import {
  useBooks,
  usePermanentDeleteBook,
  useRestoreBook,
} from '@/services/books'
import {
  useBookLeads,
  useRestoreBookLead,
} from '@/features/admin/services/book-leads'
import {
  usePermanentDeleteStore,
  useRestoreStore,
  useStores,
} from '@/features/admin/services/stores'
import {
  usePermanentDeleteVendor,
  useRestoreVendor,
  useVendors,
} from '@/features/admin/services/warehouses'
import { getErrorMessage } from '@/lib/api'
import { useTimedMessage } from '@/hooks/useTimedMessage'

type BinTab = 'books' | 'bookLeads' | 'stores' | 'vendors'

const AdminBooksBinPage = () => {
  const [tab, setTab] = useState<BinTab>('books')
  const { message, showMessage } = useTimedMessage(2600)

  const { data: booksData } = useBooks({ page: 1, limit: 100, status: 'trashed' })
  const { data: bookLeadsData } = useBookLeads({ page: 1, limit: 100, view: 'trashed' })
  const { data: stores = [] } = useStores('trashed')
  const { data: vendors = [] } = useVendors(undefined, 'trashed')

  const restoreBook = useRestoreBook()
  const restoreBookLead = useRestoreBookLead()
  const permanentDeleteBook = usePermanentDeleteBook()
  const restoreStore = useRestoreStore()
  const permanentDeleteStore = usePermanentDeleteStore()
  const restoreVendor = useRestoreVendor()
  const permanentDeleteVendor = usePermanentDeleteVendor()

  const books = booksData?.books ?? []
  const bookLeads = bookLeadsData?.items ?? []
  const counts = useMemo(
    () => ({
      books: books.length,
      bookLeads: bookLeads.length,
      stores: stores.length,
      vendors: vendors.length,
    }),
    [books.length, bookLeads.length, stores.length, vendors.length],
  )

  return (
    <div className="surface-canvas min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex items-end justify-between gap-4">
        <div>
          <p className="section-kicker">Admin Bin</p>
          <h1 className="mt-2 text-2xl font-black tracking-tight">Recycle Bin</h1>
        </div>
          <div className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
            <Trash2 className="h-4 w-4" />
            {counts.books + counts.bookLeads + counts.stores + counts.vendors} total
          </div>
        </div>

        {message ? (
          <div className="surface-subtle px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {message}
          </div>
        ) : null}

        <div className="surface-panel p-5">
          <div className="inline-flex rounded-lg border border-slate-200 p-0.5 dark:border-slate-700">
            {([
              ['books', `Books (${counts.books})`],
              ['bookLeads', `Book Leads (${counts.bookLeads})`],
              ['stores', `Stores (${counts.stores})`],
              ['vendors', `Vendors (${counts.vendors})`],
            ] as Array<[BinTab, string]>).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setTab(key)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold uppercase tracking-widest transition-all ${
                  tab === key
                    ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                    : 'text-slate-500'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="admin-table-wrapper mt-4 overflow-auto">
            {tab === 'books' ? (
              <table className="admin-table min-w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Author</th>
                    <th className="px-3 py-2 text-left">ISBN</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="px-3 py-2">{book.title}</td>
                      <td className="px-3 py-2">{book.author}</td>
                      <td className="px-3 py-2">{book.isbn}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await restoreBook.mutateAsync(book.id)
                                showMessage('Book restored.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = window.confirm(`Permanently delete "${book.title}"?`)
                              if (!confirmed) return
                              try {
                                await permanentDeleteBook.mutateAsync(book.id)
                                showMessage('Book permanently deleted.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {books.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">No books in bin.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : null}

            {tab === 'stores' ? (
              <table className="admin-table min-w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Store</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Location</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="px-3 py-2">{store.name}</td>
                      <td className="px-3 py-2">{store.code}</td>
                      <td className="px-3 py-2">{store.city}, {store.state}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await restoreStore.mutateAsync(store.id)
                                showMessage('Store restored.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = window.confirm(`Permanently delete "${store.name}"?`)
                              if (!confirmed) return
                              try {
                                await permanentDeleteStore.mutateAsync(store.id)
                                showMessage('Store permanently deleted.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {stores.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">No stores in bin.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : null}

            {tab === 'bookLeads' ? (
              <table className="admin-table min-w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Title</th>
                    <th className="px-3 py-2 text-left">Author</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">Status</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {bookLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{lead.title}</div>
                        {lead.note ? (
                          <div className="mt-1 max-w-md truncate text-xs text-slate-500">{lead.note}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{lead.author}</td>
                      <td className="px-3 py-2">{lead.source}</td>
                      <td className="px-3 py-2">{lead.status}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await restoreBookLead.mutateAsync(lead.id)
                                showMessage('Book lead restored.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {bookLeads.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-3 py-6 text-center text-slate-500">No book leads in bin.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : null}

            {tab === 'vendors' ? (
              <table className="admin-table min-w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">Vendor</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Contact</th>
                    <th className="px-3 py-2 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="px-3 py-2">{vendor.name}</td>
                      <td className="px-3 py-2">{vendor.code}</td>
                      <td className="px-3 py-2">{vendor.contactName || vendor.email || '-'}</td>
                      <td className="px-3 py-2 text-right">
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            onClick={async () => {
                              try {
                                await restoreVendor.mutateAsync(vendor.id)
                                showMessage('Vendor restored.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-emerald-300 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 dark:border-emerald-800 dark:text-emerald-300"
                          >
                            Restore
                          </button>
                          <button
                            type="button"
                            onClick={async () => {
                              const confirmed = window.confirm(`Permanently delete "${vendor.name}"?`)
                              if (!confirmed) return
                              try {
                                await permanentDeleteVendor.mutateAsync(vendor.id)
                                showMessage('Vendor permanently deleted.')
                              } catch (error) {
                                showMessage(getErrorMessage(error))
                              }
                            }}
                            className="rounded-lg border border-rose-300 px-2.5 py-1.5 text-xs font-semibold text-rose-700 dark:border-rose-800 dark:text-rose-300"
                          >
                            Delete Permanently
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {vendors.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-500">No vendors in bin.</td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminBooksBinPage
