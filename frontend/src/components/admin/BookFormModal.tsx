import { useEffect, useState } from 'react'
import { useForm, Controller, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { createBookSchema, type CreateBookData, type Book } from '@/lib/schemas'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import CategoryInput from '@/components/ui/CategoryInput'
import { BOOK_CATEGORIES, BOOK_GENRES } from '@/constants/bookTaxonomy'
import AdminSlideOverPanel from '@/components/admin/AdminSlideOverPanel'
import { useEstimateEbookPages } from '@/services/books'
import { getErrorMessage } from '@/lib/api'

interface BookFormModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBookData) => void
  book?: Book | null
  isLoading?: boolean
}

type BookCategory = (typeof BOOK_CATEGORIES)[number]

const isBookCategory = (value: string): value is BookCategory =>
  (BOOK_CATEGORIES as readonly string[]).includes(value)

const EMPTY_BOOK_VALUES: CreateBookData = {
  title: '',
  author: '',
  isbn: '',
  price: 0,
  stock: 0,
  description: '',
  coverImage: '',
  categories: [],
  genres: [],
  isDigital: false,
  ebookFormat: undefined,
  ebookFilePath: '',
  totalPages: undefined,
  ebookPrice: undefined,
}

const toBookFormValues = (book?: Book | null): CreateBookData => {
  if (!book) return EMPTY_BOOK_VALUES
  return {
    title: book.title,
    author: book.author,
    isbn: book.isbn,
    price: Number(book.price),
    stock: book.stock,
    description: book.description || '',
    coverImage: book.coverImage || '',
    categories: (book.categories || []).filter(isBookCategory),
    genres: Array.from(new Set((book.genres || []).map((genre) => genre.trim()).filter(Boolean))),
    isDigital: book.isDigital ?? false,
    ebookFormat: book.ebookFormat ?? undefined,
    ebookFilePath: book.ebookFilePath || '',
    totalPages: book.totalPages ?? undefined,
    ebookPrice: book.ebookPrice ?? undefined,
  }
}

const BookFormModal = ({ isOpen, onClose, onSubmit, book, isLoading }: BookFormModalProps) => {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CreateBookData>({
    resolver: zodResolver(createBookSchema),
    defaultValues: toBookFormValues(book),
  })

  const estimatePages = useEstimateEbookPages()
  const [pageHint, setPageHint] = useState<string>('')

  const isDigital = watch('isDigital')
  const ebookFilePath = watch('ebookFilePath')

  useEffect(() => {
    if (!isOpen) return
    reset(toBookFormValues(book))
    setPageHint('')
  }, [book, isOpen, reset])

  const handleFormSubmit: SubmitHandler<CreateBookData> = (data) => {
    onSubmit(data)
  }

  const handleAutoDetectPages = async () => {
    setPageHint('')
    const path = getValues('ebookFilePath')?.trim()
    const format = getValues('ebookFormat')

    if (!path) {
      setPageHint('Add eBook file path first.')
      return
    }

    try {
      const result = await estimatePages.mutateAsync({
        ebookFilePath: path,
        ...(format ? { ebookFormat: format } : {}),
      })
      setValue('totalPages', result.totalPages, { shouldValidate: true, shouldDirty: true })
      setPageHint(
        result.method === 'exact'
          ? `Detected ${result.totalPages} pages from file.`
          : `Estimated ${result.totalPages} pages from content. You can still edit this.`,
      )
    } catch (error) {
      setPageHint(getErrorMessage(error))
    }
  }

  return (
    <AdminSlideOverPanel
      open={isOpen}
      onClose={onClose}
      title={book ? 'Edit Book' : 'Add New Book'}
      description="Create or update title, stock, and digital metadata."
      widthClassName="sm:max-w-[56rem]"
      footer={
        <div className="flex items-center justify-end gap-3">
          <Button type="button" variant="outline" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" form="book-form-panel" isLoading={isLoading}>
            {book ? 'Update Book' : 'Add Book'}
          </Button>
        </div>
      }
    >
      <form id="book-form-panel" onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
                <Input
                  {...register('title')}
                  label="Title"
                  placeholder="Enter book title"
                  error={errors.title?.message}
                />

                <Input
                  {...register('author')}
                  label="Author"
                  placeholder="Enter author name"
                  error={errors.author?.message}
                />

                <Input
                  {...register('isbn')}
                  label="ISBN"
                  placeholder="Enter ISBN (10-17 characters)"
                  error={errors.isbn?.message}
                />

                <Input
                  {...register('coverImage')}
                  label="Cover Image URL (Optional)"
                  placeholder="https://example.com/book-cover.jpg"
                  error={errors.coverImage?.message}
                />

                <Controller
                  name="categories"
                  control={control}
                  render={({ field }) => (
                    <CategoryInput
                      value={field.value || []}
                      onChange={field.onChange}
                      label="Categories"
                      placeholder="Add categories (required)"
                      suggestions={BOOK_CATEGORIES}
                      datalistId="book-category-suggestions"
                      restrictToSuggestions
                      error={errors.categories?.message}
                    />
                  )}
                />
                <Controller
                  name="genres"
                  control={control}
                  render={({ field }) => (
                    <CategoryInput
                      value={field.value || []}
                      onChange={field.onChange}
                      label="Genres (Optional)"
                      placeholder="Add genres"
                      suggestions={BOOK_GENRES}
                      datalistId="book-genre-suggestions"
                      error={errors.genres?.message}
                    />
                  )}
                />

                <label className="flex items-center gap-3 rounded-lg border border-gray-200 p-3 text-sm font-medium text-gray-700 dark:border-slate-700 dark:text-slate-200">
                  <input
                    type="checkbox"
                    {...register('isDigital')}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                  This is a digital eBook
                </label>

                {isDigital ? (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                    <div>
                      <label className="mb-1 block text-sm font-medium text-gray-700 dark:text-slate-300">
                        Format
                      </label>
                      <select
                        {...register('ebookFormat')}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100"
                      >
                        <option value="">Select format</option>
                        <option value="EPUB">EPUB</option>
                        <option value="PDF">PDF</option>
                      </select>
                      {errors.ebookFormat && (
                        <p className="mt-1 text-sm text-red-600">{errors.ebookFormat.message}</p>
                      )}
                    </div>

                    <Input
                      {...register('ebookFilePath')}
                      label="eBook File Path"
                      placeholder="my-book.epub"
                      error={errors.ebookFilePath?.message}
                    />

                    <Input
                      {...register('ebookPrice', { valueAsNumber: true })}
                      type="number"
                      step="0.01"
                      label="eBook Price"
                      placeholder="9.99"
                      error={errors.ebookPrice?.message}
                    />

                    <div className="space-y-2">
                      <label className="block text-xs font-semibold uppercase tracking-widest text-slate-500">
                        Total Pages
                      </label>
                      <div className="flex gap-2">
                        <input
                          {...register('totalPages', { valueAsNumber: true })}
                          type="number"
                          placeholder="220"
                          className={`
                            w-full px-4 py-3 rounded-xl border
                            border-slate-200 bg-white/90 text-slate-900
                            shadow-sm transition-all
                            focus:outline-none
                            focus:ring-2 focus:ring-primary-500/30
                            focus:border-primary-500/60
                            disabled:bg-slate-100 disabled:cursor-not-allowed
                            dark:border-slate-800 dark:bg-slate-900/80 dark:text-slate-100
                            ${errors.totalPages ? 'border-rose-400 focus:ring-rose-400/30 focus:border-rose-400' : ''}
                          `}
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={handleAutoDetectPages}
                          isLoading={estimatePages.isPending}
                          disabled={!isDigital || !ebookFilePath?.trim()}
                        >
                          Auto
                        </Button>
                      </div>
                      {errors.totalPages?.message && (
                        <p className="text-xs font-medium text-rose-600">{errors.totalPages.message}</p>
                      )}
                      {pageHint && (
                        <p
                          className={`text-xs ${estimatePages.isError ? 'text-rose-600' : 'text-slate-500 dark:text-slate-400'}`}
                        >
                          {pageHint}
                        </p>
                      )}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4">
                  <Input
                    {...register('price', { valueAsNumber: true })}
                    type="number"
                    step="0.01"
                    label="Price"
                    placeholder="0.00"
                    error={errors.price?.message}
                  />

                  <Input
                    {...register('stock', { valueAsNumber: true })}
                    type="number"
                    label="Stock"
                    placeholder="0"
                    error={errors.stock?.message}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-300">
                    Description (Optional)
                  </label>
                  <textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Enter book description"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:placeholder-slate-500"
                  />
                  {errors.description && (
                    <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
                  )}
                </div>
      </form>
    </AdminSlideOverPanel>
  )
}

export default BookFormModal
