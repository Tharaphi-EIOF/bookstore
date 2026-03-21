import type { ReactNode } from 'react'
import type { MyEbook, ReadingStatus } from '@/services/reading'

export type LibraryStatusFilter = 'ALL' | 'TO_READ' | 'READING' | 'FINISHED'
export type LibraryCollectionFilter = 'FAVORITES' | 'OWNED'

export type ActiveLibraryFilter =
  | { type: 'status'; value: LibraryStatusFilter }
  | { type: 'collection'; value: LibraryCollectionFilter }
  | { type: 'list'; value: string }

export type LibraryItem = {
  id: string
  bookId: string
  book?: {
    title?: string
    author?: string
    coverImage?: string | null
    isDigital?: boolean
  }
}

export type LibraryFilterMeta = {
  label: string
  icon: ReactNode
}

export type ShelfRow = {
  key: string
  title: string
  books: LibraryItem[]
}

export type StockAlertItemPreview = {
  id: string
  bookId: string
  isActive: boolean
  book?: {
    title?: string
  }
}

export type LibraryDeskState = {
  currentPageInput: string
  goalInput: string
  totalPagesInput: string
}

export type LibraryDeskActions = {
  onReadEbook: () => void
  onRemove: () => void
  onSaveDetails: () => void
  onStatusUpdate: (status: ReadingStatus) => void
  onStockAlertToggle: () => void
}

export type LibraryDeskMutations = {
  isOpeningEbook: boolean
  isPendingAction: boolean
  isStockAlertPending: boolean
}

export type LibraryAlertsProps = {
  entitledEbooks: MyEbook[]
  feedback: string
  onOpenDetailPanel: (bookId: string) => void
  stockAlerts: StockAlertItemPreview[]
}
