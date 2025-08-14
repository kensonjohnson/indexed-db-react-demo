import { useState, useCallback } from 'react';
import { useDatabase } from '../context/DatabaseContext';
import type { StoresTypes } from '../db';

type OptimisticAction = 'create' | 'update' | 'delete';

type PendingOperation<T> = {
  id: string;
  action: OptimisticAction;
  item: T;
  originalItem?: T; // For rollback on update/delete
  confirmed: boolean;
  error?: string;
};

export function useOptimisticUpdate<T extends { [key: string]: any }>(
  store: StoresTypes,
  keyField: keyof T
) {
  const database = useDatabase();
  const [pendingOperations, setPendingOperations] = useState<Map<string, PendingOperation<T>>>(new Map());

  // Generate unique operation ID
  const generateOperationId = () => `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;

  // Optimistic create operation
  const optimisticCreate = useCallback(async (newItem: Omit<T, keyof T>) => {
    const operationId = generateOperationId();
    const optimisticItem = { 
      ...newItem, 
      [keyField]: `temp_${operationId}` // Temporary ID for optimistic display
    } as T;

    // 1. IMMEDIATELY update UI (optimistic)
    setPendingOperations(prev => {
      const newMap = new Map(prev);
      newMap.set(operationId, {
        id: operationId,
        action: 'create',
        item: optimisticItem,
        confirmed: false,
      });
      return newMap;
    });

    try {
      // 2. Perform actual database operation
      const actualId = await database.create(store, newItem);
      
      if (actualId) {
        // 3. SUCCESS: Mark as confirmed, update with real ID
        const confirmedItem = { ...optimisticItem, [keyField]: actualId };
        setPendingOperations(prev => {
          const newMap = new Map(prev);
          const operation = newMap.get(operationId);
          if (operation) {
            newMap.set(operationId, {
              ...operation,
              item: confirmedItem,
              confirmed: true,
            });
          }
          return newMap;
        });
        return { success: true, item: confirmedItem, operationId };
      } else {
        throw new Error('Database operation failed');
      }
    } catch (error) {
      // 4. FAILURE: Mark as error for rollback
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(operationId);
        if (operation) {
          newMap.set(operationId, {
            ...operation,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return newMap;
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', operationId };
    }
  }, [store, keyField, database]);

  // Optimistic update operation
  const optimisticUpdate = useCallback(async (
    id: number, 
    updates: Partial<T>, 
    originalItem: T,
    createDefault: () => T
  ) => {
    const operationId = generateOperationId();
    const optimisticItem = { ...originalItem, ...updates };

    // 1. IMMEDIATELY update UI (optimistic)
    setPendingOperations(prev => {
      const newMap = new Map(prev);
      newMap.set(operationId, {
        id: operationId,
        action: 'update',
        item: optimisticItem,
        originalItem,
        confirmed: false,
      });
      return newMap;
    });

    try {
      // 2. Perform actual database operation
      const result = await database.update(store, id, updates, createDefault);
      
      if (result) {
        // 3. SUCCESS: Mark as confirmed
        setPendingOperations(prev => {
          const newMap = new Map(prev);
          const operation = newMap.get(operationId);
          if (operation) {
            newMap.set(operationId, {
              ...operation,
              item: result as T,
              confirmed: true,
            });
          }
          return newMap;
        });
        return { success: true, item: result as T, operationId };
      } else {
        throw new Error('Database operation failed');
      }
    } catch (error) {
      // 4. FAILURE: Mark as error for rollback
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(operationId);
        if (operation) {
          newMap.set(operationId, {
            ...operation,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return newMap;
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', operationId };
    }
  }, [store, database]);

  // Optimistic delete operation  
  const optimisticDelete = useCallback(async (id: number, originalItem: T) => {
    const operationId = generateOperationId();

    // 1. IMMEDIATELY update UI (optimistic) - item disappears
    setPendingOperations(prev => {
      const newMap = new Map(prev);
      newMap.set(operationId, {
        id: operationId,
        action: 'delete',
        item: originalItem,
        originalItem,
        confirmed: false,
      });
      return newMap;
    });

    try {
      // 2. Perform actual database operation
      const result = await database.remove(store, id);
      
      if (result) {
        // 3. SUCCESS: Mark as confirmed
        setPendingOperations(prev => {
          const newMap = new Map(prev);
          const operation = newMap.get(operationId);
          if (operation) {
            newMap.set(operationId, {
              ...operation,
              confirmed: true,
            });
          }
          return newMap;
        });
        return { success: true, operationId };
      } else {
        throw new Error('Database operation failed');
      }
    } catch (error) {
      // 4. FAILURE: Mark as error for rollback
      setPendingOperations(prev => {
        const newMap = new Map(prev);
        const operation = newMap.get(operationId);
        if (operation) {
          newMap.set(operationId, {
            ...operation,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
        return newMap;
      });
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error', operationId };
    }
  }, [store, database]);

  // Clear completed operations (cleanup)
  const clearOperation = useCallback((operationId: string) => {
    setPendingOperations(prev => {
      const newMap = new Map(prev);
      newMap.delete(operationId);
      return newMap;
    });
  }, []);

  // Get all pending operations as array
  const getPendingOperations = useCallback(() => {
    return Array.from(pendingOperations.values());
  }, [pendingOperations]);

  // Check if item has pending operations
  const hasPendingOperation = useCallback((itemId: any) => {
    return Array.from(pendingOperations.values()).some(op => {
      const opItemId = op.item[keyField];
      return opItemId === itemId || opItemId === `temp_${op.id}`;
    });
  }, [pendingOperations, keyField]);

  // Get optimistic state for an item
  const getOptimisticState = useCallback((itemId: any) => {
    const operation = Array.from(pendingOperations.values()).find(op => {
      const opItemId = op.item[keyField];
      return opItemId === itemId || opItemId === `temp_${op.id}`;
    });
    
    if (!operation) return null;
    
    return {
      isPending: !operation.confirmed && !operation.error,
      isError: !!operation.error,
      isConfirmed: operation.confirmed,
      error: operation.error,
      action: operation.action,
    };
  }, [pendingOperations, keyField]);

  return {
    // Core operations
    optimisticCreate,
    optimisticUpdate,
    optimisticDelete,
    
    // State management
    pendingOperations: getPendingOperations(),
    clearOperation,
    hasPendingOperation,
    getOptimisticState,
    
    // Database context pass-through for non-optimistic operations
    database,
  };
}