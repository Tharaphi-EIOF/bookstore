import { X } from 'lucide-react'
import BookCover from '@/components/ui/BookCover'

type BookOption = {
  id: string
  title: string
  author: string
  coverImage?: string | null
}

type Props = {
  selectedBooks: BookOption[]
  filteredBooks: BookOption[]
  selectedBookIds: string[]
  bookSearch: string
  booksCount: number
  onBookSearchChange: (value: string) => void
  onToggleBook: (bookId: string) => void
  onClose: () => void
  listClassName: string
}

const BooksDrawer = ({
  selectedBooks,
  filteredBooks,
  selectedBookIds,
  bookSearch,
  booksCount,
  onBookSearchChange,
  onToggleBook,
  onClose,
  listClassName,
}: Props) => {
  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">Link Books (Optional)</p>
        <button
          type="button"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-slate-300 text-slate-500 dark:border-slate-700 dark:text-slate-300"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      {selectedBooks.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {selectedBooks.map((book) => (
            <button
              key={`chip-${book.id}`}
              type="button"
              onClick={() => onToggleBook(book.id)}
              className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              {book.title}
              <X className="h-3.5 w-3.5" />
            </button>
          ))}
        </div>
      )}
      <input
        value={bookSearch}
        onChange={(event) => onBookSearchChange(event.target.value)}
        placeholder="Search books by title or author"
        className="mt-3 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 placeholder:text-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:placeholder:text-slate-500"
      />
      <div className={listClassName}>
        {filteredBooks.map((book) => {
          const checked = selectedBookIds.includes(book.id)
          return (
            <button
              key={book.id}
              type="button"
              onClick={() => onToggleBook(book.id)}
              className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                checked
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-200'
                  : 'border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300'
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <BookCover src={book.coverImage ?? null} alt={book.title} className="h-9 w-6 rounded object-cover" />
                <span className="truncate">{book.title} · {book.author}</span>
              </div>
              <span className="text-xs font-semibold uppercase tracking-wider">{checked ? 'Added' : 'Add'}</span>
            </button>
          )
        })}
        {booksCount === 0 && <p className="text-sm text-slate-500">No books available.</p>}
        {booksCount > 0 && filteredBooks.length === 0 && (
          <p className="text-sm text-slate-500">No matching books found.</p>
        )}
      </div>
    </>
  )
}

export default BooksDrawer
