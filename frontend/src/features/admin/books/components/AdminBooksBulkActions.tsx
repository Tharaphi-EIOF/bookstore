import Button from '@/components/ui/Button'

interface AdminBooksBulkActionsProps {
  selectedCount: number
  selectedActiveCount: number
  selectedTrashedCount: number
  isBulkDeleting: boolean
  onOpenBulkStockModal: () => void
  onBulkDelete: () => void
  onBulkRestore: () => void
  onBulkPermanentDelete: () => void
  onClearSelection: () => void
}

const AdminBooksBulkActions = ({
  selectedCount,
  selectedActiveCount,
  selectedTrashedCount,
  isBulkDeleting,
  onOpenBulkStockModal,
  onBulkDelete,
  onBulkRestore,
  onBulkPermanentDelete,
  onClearSelection,
}: AdminBooksBulkActionsProps) => {
  if (selectedCount === 0) return null

  return (
    <div className="mb-4 flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-4 dark:border-amber-800/60 dark:bg-amber-900/20">
      <p className="text-sm font-medium text-primary-900 dark:text-amber-200">
        {selectedCount} book{selectedCount !== 1 ? 's' : ''} selected
      </p>
      <div className="flex gap-2">
        {selectedActiveCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenBulkStockModal}
            className="dark:hover:border-amber-300 dark:hover:text-amber-300"
          >
            📦 Update Stock
          </Button>
        )}
        {selectedActiveCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkDelete}
            disabled={isBulkDeleting}
            className="dark:hover:border-amber-300 dark:hover:text-amber-300"
          >
            {isBulkDeleting ? 'Removing...' : '🗑️ Remove (To Bin)'}
          </Button>
        )}
        {selectedTrashedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkRestore}
            disabled={isBulkDeleting}
            className="dark:hover:border-amber-300 dark:hover:text-amber-300"
          >
            {isBulkDeleting ? 'Restoring...' : '↩️ Restore Selected'}
          </Button>
        )}
        {selectedTrashedCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={onBulkPermanentDelete}
            disabled={isBulkDeleting}
            className="dark:hover:border-rose-300 dark:hover:text-rose-300"
          >
            {isBulkDeleting ? 'Deleting...' : '🗑️ Delete Forever'}
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={onClearSelection}
          className="dark:hover:border-amber-300 dark:hover:text-amber-300"
        >
          ✕ Clear Selection
        </Button>
      </div>
    </div>
  )
}

export default AdminBooksBulkActions
