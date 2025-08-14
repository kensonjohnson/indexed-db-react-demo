type BulkActionBarProps = {
  selectedCount: number;
  onBulkDelete: () => void;
  onBulkExport: () => void;
  onClearSelection: () => void;
  isLoading?: boolean;
};

export function BulkActionBar({
  selectedCount,
  onBulkDelete,
  onBulkExport,
  onClearSelection,
  isLoading = false,
}: BulkActionBarProps) {
  if (selectedCount === 0) return null;

  const handleBulkDelete = () => {
    if (window.confirm(`Are you sure you want to delete ${selectedCount} item${selectedCount > 1 ? 's' : ''}?`)) {
      onBulkDelete();
    }
  };

  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-blue-900 font-medium">
            {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBulkDelete}
              disabled={isLoading}
              className="px-3 py-1 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete Selected'}
            </button>
            <button
              onClick={onBulkExport}
              disabled={isLoading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Exporting...' : 'Export Selected'}
            </button>
          </div>
        </div>
        <button
          onClick={onClearSelection}
          disabled={isLoading}
          className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
        >
          Clear Selection
        </button>
      </div>
    </div>
  );
}