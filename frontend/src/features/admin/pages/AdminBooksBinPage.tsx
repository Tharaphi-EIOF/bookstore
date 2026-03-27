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
type SelectionState = Record<BinTab, string[]>

const AdminBooksBinPage = () => {
  const [tab, setTab] = useState<BinTab>('books')
  const [selectedIds, setSelectedIds] = useState<SelectionState>({
    books: [],
    bookLeads: [],
    stores: [],
    vendors: [],
  })
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

  const currentRows = useMemo(
    () =>
      ({
        books,
        bookLeads,
        stores,
        vendors,
      })[tab],
    [tab, books, bookLeads, stores, vendors],
  )

  const currentIds = currentRows.map((row) => row.id)
  const selectedForTab = selectedIds[tab]
  const selectedCount = selectedForTab.length
  const allSelected =
    currentIds.length > 0 && currentIds.every((id) => selectedForTab.includes(id))
  const supportsPermanentDelete = tab !== 'bookLeads'

  const setSelectedForTab = (updater: (current: string[]) => string[]) => {
    setSelectedIds((current) => ({
      ...current,
      [tab]: updater(current[tab]),
    }))
  }

  const toggleRowSelection = (id: string) => {
    setSelectedForTab((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    )
  }

  const toggleSelectAll = () => {
    setSelectedForTab(() => (allSelected ? [] : currentIds))
  }

  const clearSelection = () => {
    setSelectedForTab(() => [])
  }

  const handleRestoreSelected = async () => {
    if (selectedCount === 0) return

    try {
      if (tab === 'books') {
        await Promise.all(selectedForTab.map((id) => restoreBook.mutateAsync(id)))
        showMessage(`${selectedCount} book${selectedCount === 1 ? '' : 's'} restored.`)
      } else if (tab === 'bookLeads') {
        await Promise.all(selectedForTab.map((id) => restoreBookLead.mutateAsync(id)))
        showMessage(`${selectedCount} book lead${selectedCount === 1 ? '' : 's'} restored.`)
      } else if (tab === 'stores') {
        await Promise.all(selectedForTab.map((id) => restoreStore.mutateAsync(id)))
        showMessage(`${selectedCount} store${selectedCount === 1 ? '' : 's'} restored.`)
      } else {
        await Promise.all(selectedForTab.map((id) => restoreVendor.mutateAsync(id)))
        showMessage(`${selectedCount} vendor${selectedCount === 1 ? '' : 's'} restored.`)
      }
      clearSelection()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  const handlePermanentDeleteSelected = async () => {
    if (selectedCount === 0 || !supportsPermanentDelete) return

    const label =
      tab === 'books' ? 'book' : tab === 'stores' ? 'store' : 'vendor'
    const confirmed = window.confirm(
      `Permanently delete ${selectedCount} ${label}${selectedCount === 1 ? '' : 's'}?`,
    )
    if (!confirmed) return

    try {
      if (tab === 'books') {
        await Promise.all(selectedForTab.map((id) => permanentDeleteBook.mutateAsync(id)))
      } else if (tab === 'stores') {
        await Promise.all(selectedForTab.map((id) => permanentDeleteStore.mutateAsync(id)))
      } else {
        await Promise.all(selectedForTab.map((id) => permanentDeleteVendor.mutateAsync(id)))
      }
      showMessage(
        `${selectedCount} ${label}${selectedCount === 1 ? '' : 's'} permanently deleted.`,
      )
      clearSelection()
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="surface-canvas min-h-screen p-8 dark:text-slate-100">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="section-kicker">Admin Bin</p>
            <h1 className="mt-2 text-2xl font-black tracking-tight">Recycle Bin</h1>
          </div>

          <div className="flex flex-wrap items-center justify-end gap-3">
            <div className="inline-flex h-11 items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 text-xs font-semibold uppercase tracking-widest text-slate-700 shadow-sm dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200">
              <Trash2 className="h-4 w-4" />
              {counts.books + counts.bookLeads + counts.stores + counts.vendors} total
            </div>
            <button
              type="button"
              onClick={handleRestoreSelected}
              disabled={selectedCount === 0}
              className="rounded-lg border border-emerald-300 bg-white px-3 py-3 text-xs font-semibold uppercase tracking-widest text-emerald-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-emerald-800 dark:bg-slate-900 dark:text-emerald-300"
            >
              Restore Selected
            </button>
            {supportsPermanentDelete ? (
              <button
                type="button"
                onClick={handlePermanentDeleteSelected}
                disabled={selectedCount === 0}
                className="rounded-lg border border-rose-300 bg-white px-3 py-3 text-xs font-semibold uppercase tracking-widest text-rose-700 shadow-sm transition disabled:cursor-not-allowed disabled:opacity-40 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
              >
                Delete Permanently
              </button>
            ) : null}
          </div>
        </div>

        {message ? (
          <div className="surface-subtle px-4 py-3 text-sm font-medium text-slate-700 dark:text-slate-200">
            {message}
          </div>
        ) : null}

        <div className="inline-flex rounded-[28px] border border-slate-200 bg-white p-1 shadow-[0_16px_36px_-28px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950">
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
              className={`rounded-[22px] px-6 py-3 text-xs font-semibold uppercase tracking-widest transition-all ${
                tab === key
                  ? 'bg-slate-900 text-white dark:bg-amber-400 dark:text-slate-900'
                  : 'text-slate-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_45px_-32px_rgba(15,23,42,0.18)] dark:border-slate-800 dark:bg-slate-950">
          <div className="admin-table-wrapper overflow-auto">
            {tab === 'books' ? (
              <table className="admin-table min-w-full text-sm">
                <thead className="admin-table-head">
                  <tr>
                    <th className="px-3 py-2 text-left">
                      <label className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                        <span>Title</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedCount} selected
                        </span>
                      </label>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <span className="sr-only">Book title</span>
                    </th>
                    <th className="px-3 py-2 text-left">Author</th>
                    <th className="px-3 py-2 text-left">ISBN</th>
                  </tr>
                </thead>
                <tbody>
                  {books.map((book) => (
                    <tr key={book.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="w-12 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedForTab.includes(book.id)}
                          onChange={() => toggleRowSelection(book.id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                      <td className="px-3 py-2">{book.title}</td>
                      <td className="px-3 py-2">{book.author}</td>
                      <td className="px-3 py-2">{book.isbn}</td>
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
                    <th className="px-3 py-2 text-left">
                      <label className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                        <span>Store</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedCount} selected
                        </span>
                      </label>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <span className="sr-only">Store name</span>
                    </th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Location</th>
                  </tr>
                </thead>
                <tbody>
                  {stores.map((store) => (
                    <tr key={store.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="w-12 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedForTab.includes(store.id)}
                          onChange={() => toggleRowSelection(store.id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                      <td className="px-3 py-2">{store.name}</td>
                      <td className="px-3 py-2">{store.code}</td>
                      <td className="px-3 py-2">{store.city}, {store.state}</td>
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
                    <th className="px-3 py-2 text-left">
                      <label className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                        <span>Title</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedCount} selected
                        </span>
                      </label>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <span className="sr-only">Lead title</span>
                    </th>
                    <th className="px-3 py-2 text-left">Author</th>
                    <th className="px-3 py-2 text-left">Source</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {bookLeads.map((lead) => (
                    <tr key={lead.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="w-12 px-3 py-2 align-top">
                        <input
                          type="checkbox"
                          checked={selectedForTab.includes(lead.id)}
                          onChange={() => toggleRowSelection(lead.id)}
                          className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <div className="font-medium text-slate-900 dark:text-slate-100">{lead.title}</div>
                        {lead.note ? (
                          <div className="mt-1 max-w-md truncate text-xs text-slate-500">{lead.note}</div>
                        ) : null}
                      </td>
                      <td className="px-3 py-2">{lead.author}</td>
                      <td className="px-3 py-2">{lead.source}</td>
                      <td className="px-3 py-2">{lead.status}</td>
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
                    <th className="px-3 py-2 text-left">
                      <label className="inline-flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-300">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={toggleSelectAll}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                        <span>Vendor</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500">
                          {selectedCount} selected
                        </span>
                      </label>
                    </th>
                    <th className="px-3 py-2 text-left">
                      <span className="sr-only">Vendor name</span>
                    </th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Contact</th>
                  </tr>
                </thead>
                <tbody>
                  {vendors.map((vendor) => (
                    <tr key={vendor.id} className="border-t border-slate-200/70 dark:border-slate-800/70">
                      <td className="w-12 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={selectedForTab.includes(vendor.id)}
                          onChange={() => toggleRowSelection(vendor.id)}
                          className="h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-slate-500"
                        />
                      </td>
                      <td className="px-3 py-2">{vendor.name}</td>
                      <td className="px-3 py-2">{vendor.code}</td>
                      <td className="px-3 py-2">{vendor.contactName || vendor.email || '-'}</td>
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
