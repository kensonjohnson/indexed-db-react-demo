import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { initDB, create, get, getAll, update, remove, clearStore } from "../db";
import type { StoresTypes } from "../db";

type DatabaseContextProvider = {
  isReady: boolean;
  initError: string | null;
  operationLoading: boolean;
  operationError: string | null;
  create: <T>(store: StoresTypes, data: T) => Promise<number | null>;
  get: <T>(store: StoresTypes, id: number) => Promise<T | null>;
  getAll: <T>(store: StoresTypes) => Promise<T[] | null>;
  update: <T extends object>(
    store: StoresTypes,
    id: number,
    data: T,
    createDefault: () => T,
  ) => Promise<T | null>;
  remove: (store: StoresTypes, id: number) => Promise<boolean | null>;
  clearStore: (store: StoresTypes) => Promise<boolean | null>;
};

const DatabaseContext = createContext<DatabaseContextProvider | undefined>(
  undefined,
);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isReady, setIsReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    const initializeDatabase = async () => {
      setInitError(null);
      
      try {
        const success = await initDB();
        if (success) {
          setIsReady(true);
        } else {
          setInitError('Failed to initialize database');
        }
      } catch (error) {
        setInitError(error instanceof Error ? error.message : 'Unknown database error');
      }
    };

    initializeDatabase();
  }, []);

  const executeOperation = useCallback(
    async <T,>(operation: () => Promise<T>): Promise<T | null> => {
      setOperationLoading(true);
      setOperationError(null);

      try {
        const result = await operation();
        return result;
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : "Database operation failed";
        setOperationError(errorMessage);
        console.error("Database operation error:", err);
        return null;
      } finally {
        setOperationLoading(false);
      }
    },
    [],
  );

  const createRecord = useCallback(
    <T,>(store: StoresTypes, data: T) =>
      executeOperation(() => create(store, data)),
    [executeOperation],
  );

  const getRecord = useCallback(
    <T,>(store: StoresTypes, id: number) =>
      executeOperation(() => get<T>(store, id)),
    [executeOperation],
  );

  const getAllRecords = useCallback(
    <T,>(store: StoresTypes) => executeOperation(() => getAll<T>(store)),
    [executeOperation],
  );

  const updateRecord = useCallback(
    <T extends object>(
      store: StoresTypes,
      id: number,
      data: T,
      createDefault: () => T,
    ) => executeOperation(() => update(store, id, data, createDefault)),
    [executeOperation],
  );

  const removeRecord = useCallback(
    (store: StoresTypes, id: number) =>
      executeOperation(() => remove(store, id)),
    [executeOperation],
  );
  
  const clearStoreRecords = useCallback(
    (store: StoresTypes) => executeOperation(() => clearStore(store)),
    [executeOperation],
  );

  const contextValue: DatabaseContextProvider = {
    isReady,
    initError,
    operationLoading,
    operationError,
    create: createRecord,
    get: getRecord,
    getAll: getAllRecords,
    update: updateRecord,
    remove: removeRecord,
    clearStore: clearStoreRecords,
  };

  return (
    <DatabaseContext.Provider value={contextValue}>
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error("useDatabase must be used within DatabaseProvider");
  }
  return context;
}

