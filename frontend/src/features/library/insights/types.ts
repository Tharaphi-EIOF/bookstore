export type ReadingSession = {
  id: string
  bookId: string
  title: string
  coverImage: string | null
  date: Date
  dateKey: string
  pages: number
}
