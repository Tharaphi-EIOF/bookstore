import { motion } from 'framer-motion'
import { Pencil, RotateCcw, Trash2 } from 'lucide-react'
import type { Book } from '@/lib/schemas'
import AdminIconActionButton from '@/components/admin/AdminIconActionButton'
import AdminTableCard from '@/components/admin/AdminTableCard'

type VisibleColumns = {
  title: boolean
  author: boolean
  categories: boolean
  isbn: boolean
  price: boolean
  stock: boolean
  actions: boolean
}

type SortKey = 'title' | 'author' | 'categories' | 'isbn' | 'price' | 'stock' | 'createdAt'

interface AdminBooksTableProps {
  paginatedBooks: Book[]
  selectedBooks: Set<string>
  recentBookId: string | null
  isActiveView: boolean
  visibleColumns: VisibleColumns
  rowPad: string
  start: number
  sortKey: SortKey
  sortDir: 'asc' | 'desc'
  page: number
  totalPages: number
  filteredCount: number
  onSelectAll: (checked: boolean) => void
  onSelectBook: (bookId: string, checked: boolean) => void
  onToggleSort: (key: SortKey) => void
  onEditBook: (book: Book) => void
  onRestoreBook: (book: Book) => void
  onDeleteBook: (book: Book) => void
  onPermanentDeleteBook: (book: Book) => void
  onPreviousPage: () => void
  onNextPage: () => void
}

const AdminBooksTable = ({
  paginatedBooks,
  selectedBooks,
  recentBookId,
  isActiveView,
  visibleColumns,
  rowPad,
  start,
  sortKey,
  sortDir,
  page,
  totalPages,
  filteredCount,
  onSelectAll,
  onSelectBook,
  onToggleSort,
  onEditBook,
  onRestoreBook,
  onDeleteBook,
  onPermanentDeleteBook,
  onPreviousPage,
  onNextPage,
}: AdminBooksTableProps) => {
  return (
    <AdminTableCard className="relative z-0">
      <div className="overflow-x-auto">
        <table className="admin-table min-w-[1100px]">
          <thead className="admin-table-head sticky top-0 z-0">
            <tr>
              <th className={`w-12 px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                <input
                  type="checkbox"
                  checked={paginatedBooks.length > 0 && paginatedBooks.every((book) => selectedBooks.has(book.id))}
                  onChange={(e) => onSelectAll(e.target.checked)}
                  className="rounded border-gray-300 dark:border-slate-700"
                />
              </th>
              <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>#</th>
              {visibleColumns.title && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                  <button type="button" onClick={() => onToggleSort('title')} className="inline-flex items-center gap-2">
                    Title
                    {sortKey === 'title' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.author && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                  <button type="button" onClick={() => onToggleSort('author')} className="inline-flex items-center gap-2">
                    Author
                    {sortKey === 'author' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.categories && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                  <button type="button" onClick={() => onToggleSort('categories')} className="inline-flex items-center gap-2">
                    Categories
                    {sortKey === 'categories' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.isbn && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                  <button type="button" onClick={() => onToggleSort('isbn')} className="inline-flex items-center gap-2">
                    ISBN
                    {sortKey === 'isbn' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.price && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                  <button type="button" onClick={() => onToggleSort('price')} className="inline-flex items-center gap-2">
                    Price
                    {sortKey === 'price' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.stock && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>
                  <button type="button" onClick={() => onToggleSort('stock')} className="inline-flex items-center gap-2">
                    Stock
                    {sortKey === 'stock' && <span>{sortDir === 'asc' ? '↑' : '↓'}</span>}
                  </button>
                </th>
              )}
              {visibleColumns.actions && (
                <th className={`px-4 ${rowPad} text-left text-xs font-semibold uppercase tracking-[0.22em] text-slate-400`}>Actions</th>
              )}
            </tr>
          </thead>

          <tbody>
            {paginatedBooks.map((book, index) => (
              <motion.tr
                key={book.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className={`border-t border-slate-200/70 hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-900/80 odd:bg-white/95 even:bg-slate-50/40 dark:odd:bg-slate-950/80 dark:even:bg-slate-900/60 ${
                  recentBookId === book.id ? 'ring-2 ring-amber-300/60' : ''
                } ${book.deletedAt ? 'grayscale-[10%] opacity-70' : ''}`}
              >
                <td className={`px-4 ${rowPad}`}>
                  <input
                    type="checkbox"
                    checked={selectedBooks.has(book.id)}
                    onChange={(e) => onSelectBook(book.id, e.target.checked)}
                    className="rounded border-gray-300 dark:border-slate-700"
                  />
                </td>
                <td className={`px-4 ${rowPad} text-sm text-slate-500 dark:text-slate-400`}>#{start + index + 1}</td>
                {visibleColumns.title && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-[1.05rem] font-semibold tracking-tight text-slate-900 dark:text-slate-100">{book.title}</span>
                      {book.deletedAt ? (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-200">
                          Removed
                        </span>
                      ) : isActiveView ? (
                        <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-200">
                          Active
                        </span>
                      ) : null}
                    </div>
                  </td>
                )}
                {visibleColumns.author && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="text-[15px] text-slate-700 dark:text-slate-200">{book.author}</div>
                  </td>
                )}
                {visibleColumns.categories && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="text-[15px] leading-7 text-slate-500 dark:text-slate-300">
                      {book.categories?.length ? book.categories.join(', ') : '—'}
                    </div>
                  </td>
                )}
                {visibleColumns.isbn && (
                  <td className={`px-4 ${rowPad} font-mono text-[15px] tracking-tight text-slate-800 dark:text-slate-200`}>{book.isbn}</td>
                )}
                {visibleColumns.price && (
                  <td className={`px-4 ${rowPad} text-[15px] font-medium text-slate-900 dark:text-slate-100`}>${book.price.toFixed(2)}</td>
                )}
                {visibleColumns.stock && (
                  <td className={`px-4 ${rowPad}`}>
                    <span
                      className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                        book.stock === 0
                          ? 'bg-red-100 text-red-700 dark:bg-rose-900/40 dark:text-rose-200'
                          : book.stock <= 10
                            ? 'bg-orange-100 text-orange-700 dark:bg-amber-900/40 dark:text-amber-200'
                            : 'bg-green-100 text-green-700 dark:bg-emerald-900/40 dark:text-emerald-200'
                      }`}
                    >
                      {book.stock === 0
                        ? 'OUT OF STOCK'
                        : book.stock <= 10
                          ? 'LOW STOCK'
                          : 'IN STOCK'}
                    </span>
                    <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                      {book.stock} units left
                    </div>
                  </td>
                )}
                {visibleColumns.actions && (
                  <td className={`px-4 ${rowPad}`}>
                    <div className="flex items-center gap-2">
                      {!book.deletedAt && (
                        <AdminIconActionButton
                          label="Edit book"
                          icon={<Pencil className="h-4 w-4" />}
                          onClick={() => onEditBook(book)}
                        />
                      )}
                      {book.deletedAt ? (
                        <>
                          <AdminIconActionButton
                            label="Restore book"
                            icon={<RotateCcw className="h-4 w-4" />}
                            variant="success"
                            onClick={() => onRestoreBook(book)}
                          />
                          <AdminIconActionButton
                            label="Delete book permanently"
                            icon={<Trash2 className="h-4 w-4" />}
                            variant="danger"
                            onClick={() => onPermanentDeleteBook(book)}
                          />
                        </>
                      ) : (
                        <AdminIconActionButton
                          label="Move book to bin"
                          icon={<Trash2 className="h-4 w-4" />}
                          variant="danger"
                          onClick={() => onDeleteBook(book)}
                        />
                      )}
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-slate-200/70 bg-slate-50/70 px-5 py-4 dark:border-slate-800 dark:bg-slate-950/70 md:flex-row md:items-center md:justify-between">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Showing {paginatedBooks.length} of {filteredCount} books
        </p>

        <div className="flex gap-2">
          <button
            disabled={page === 1}
            onClick={onPreviousPage}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            Previous
          </button>

          <span className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white dark:bg-slate-100 dark:text-slate-900">
            {page}
          </span>

          <button
            disabled={page === totalPages}
            onClick={onNextPage}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 disabled:opacity-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
          >
            Next
          </button>
        </div>
      </div>
    </AdminTableCard>
  )
}

export default AdminBooksTable
