import { useState, useCallback, useMemo } from 'react';

export function useBulkSelection<T>(
  data: T[],
  keyField: keyof T
) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  // Toggle individual item selection
  const toggleSelection = useCallback((id: number) => {
    setSelectedIds(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(id)) {
        newSelection.delete(id);
      } else {
        newSelection.add(id);
      }
      return newSelection;
    });
  }, []);

  // Toggle all items selection
  const toggleSelectAll = useCallback(() => {
    const allIds = data
      .map(item => item[keyField] as number)
      .filter(id => id !== undefined);
      
    if (selectedIds.size === allIds.length && allIds.every(id => selectedIds.has(id))) {
      // All are selected, deselect all
      setSelectedIds(new Set());
    } else {
      // Not all are selected, select all
      setSelectedIds(new Set(allIds));
    }
  }, [data, keyField, selectedIds]);

  // Clear all selections
  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  // Get selected items
  const selectedItems = useMemo(() => {
    return data.filter(item => {
      const id = item[keyField] as number;
      return id !== undefined && selectedIds.has(id);
    });
  }, [data, keyField, selectedIds]);

  // Check if item is selected
  const isSelected = useCallback((id: number) => {
    return selectedIds.has(id);
  }, [selectedIds]);

  // Check if all items are selected
  const isAllSelected = useMemo(() => {
    const allIds = data
      .map(item => item[keyField] as number)
      .filter(id => id !== undefined);
    return allIds.length > 0 && allIds.every(id => selectedIds.has(id));
  }, [data, keyField, selectedIds]);

  // Check if some (but not all) items are selected
  const isSomeSelected = useMemo(() => {
    return selectedIds.size > 0 && !isAllSelected;
  }, [selectedIds.size, isAllSelected]);

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    toggleSelection,
    toggleSelectAll,
    clearSelection,
    isSelected,
    isAllSelected,
    isSomeSelected,
    hasSelection: selectedIds.size > 0,
  };
}