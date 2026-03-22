import type {
  BookLead,
  BookLeadSource,
  BookLeadStatus,
  BookLeadWorkflowStage,
} from '@/features/admin/services/book-leads'

export const ITEMS_PER_PAGE = 10

export const STAGE_OPTIONS: BookLeadWorkflowStage[] = ['NEW', 'IN_REVIEW', 'APPROVED', 'CLOSED', 'REJECTED']

export const SOURCE_OPTIONS: BookLeadSource[] = [
  'USER_REQUEST',
  'STAFF_IDEA',
  'PARTNER_PITCH',
]

export type BookLeadSortKey =
  | 'title'
  | 'author'
  | 'source'
  | 'demand'
  | 'confidence'
  | 'priority'
  | 'status'
  | 'createdAt'

export type VisibleBookLeadColumns = {
  title: boolean
  author: boolean
  source: boolean
  demand: boolean
  confidence: boolean
  priority: boolean
  status: boolean
  actions: boolean
}

export const BOOK_LEAD_COLUMN_OPTIONS: Array<{ key: keyof VisibleBookLeadColumns; label: string }> = [
  { key: 'title', label: 'Title' },
  { key: 'author', label: 'Author' },
  { key: 'source', label: 'Source' },
  { key: 'demand', label: 'Demand' },
  { key: 'confidence', label: 'Confidence' },
  { key: 'priority', label: 'Priority' },
  { key: 'status', label: 'Status' },
  { key: 'actions', label: 'Actions' },
]

export const STAGE_BADGE: Record<BookLeadWorkflowStage, string> = {
  NEW: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200',
  IN_REVIEW: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  APPROVED: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  CLOSED: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  REJECTED: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

export const CONFIDENCE_BADGE: Record<'HIGH' | 'MEDIUM' | 'LOW', string> = {
  HIGH: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  MEDIUM: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
  LOW: 'bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300',
}

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-[18px] px-4 py-2 text-xs font-semibold transition disabled:opacity-50'

export const BUTTON_SECONDARY =
  `${BUTTON_BASE} border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-200 dark:hover:bg-slate-800`

export const BUTTON_DANGER =
  `${BUTTON_BASE} border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100 dark:border-rose-900/40 dark:bg-rose-950/20 dark:text-rose-300`

export const splitCsv = (value: string) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

export const leadHasCatalogPrep = (
  lead: Pick<BookLead, 'procurementIsbn' | 'procurementPrice' | 'procurementCategories'>,
) =>
  Boolean(lead.procurementIsbn?.trim())
  && Number(lead.procurementPrice || 0) > 0
  && (lead.procurementCategories?.length || 0) > 0

export const statusToStage = (status: BookLeadStatus): BookLeadWorkflowStage => {
  switch (status) {
    case 'NEW':
      return 'NEW'
    case 'REVIEWED':
    case 'SOURCING':
      return 'IN_REVIEW'
    case 'APPROVED_TO_BUY':
      return 'APPROVED'
    case 'ORDERED':
    case 'CONVERTED_TO_BOOK':
      return 'CLOSED'
    case 'REJECTED':
      return 'REJECTED'
  }
}

export const stageLabel = (stage: BookLeadWorkflowStage) => {
  switch (stage) {
    case 'IN_REVIEW':
      return 'In Review'
    default:
      return stage.charAt(0) + stage.slice(1).toLowerCase()
  }
}

export const stageToEditableStatus = (stage: BookLeadWorkflowStage): BookLeadStatus => {
  switch (stage) {
    case 'NEW':
      return 'NEW'
    case 'IN_REVIEW':
      return 'REVIEWED'
    case 'APPROVED':
      return 'APPROVED_TO_BUY'
    case 'REJECTED':
      return 'REJECTED'
    case 'CLOSED':
      return 'ORDERED'
  }
}
