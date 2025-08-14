/**
 * The `IDBRequest<T>.onsuccess` handler carries the IDBRequest object as it's
 * event target and is the only place where the `IDBRequest<T>.result: T` data
 * from your operation can be extracted.
 *
 * The `IDBTransaction.onsuccess` and `IDBTransaction.onerror` handlers each receive
 * the `IDBTransaction` as their event targets but the transaction does not carry
 * information from the request and only has a `IDBTransaction.error` key. The
 * `IDBTransaction.onsuccess` handler is essentially just a callback that triggers
 * after the database interaction completes successfully.
 */

const DATABASE_NAME = "projectNameDB";

// Stores enum
export const Stores = {
  Users: "users",
  Skills: "skills",
  UserSkills: "userSkills",
} as const;

export type StoresTypes = (typeof Stores)[keyof typeof Stores];

// Keys enum
export const Keys = {
  Users: "userId",
  Skills: "skillId",
  UserSkills: "userSkillId",
} as const;

export type KeysTypes = (typeof Keys)[keyof typeof Keys];

/**
 * Database singleton.
 */
let _db: IDBDatabase;

/**
 * Global error handler.
 *
 * Error events are targeted at the request that generated the error,
 * then the event bubbles to the transaction, and then finally to the
 *database object.
 *
 * If you want to avoid adding error handlers to every request,
 * you can instead add a single error handler on the database object.
 *
 * NOTE: the event will either be the transaction throwing an asynchronous
 * error or the request throwing an asynchronous error at this level of the
 * database. You must explicitly cast the event's target as either type
 * to extract the error.
 *
 * The errors are `DOMException | null`.
 *
 */
function globalDatabaseErrorHandler(e: Event) {
  const target = e.target as IDBRequest | IDBTransaction;
  const error = target.error;
  console.error(`\`database._db.onerror\` ERROR: ${error}`);
}

/**
 * Helper to format IDB errors consistently
 */
function formatDBError(
  error: DOMException | null,
  operation: string,
  storeName?: string,
): string {
  const baseMessage = `IndexedDB ${operation} failed${storeName ? ` on store '${storeName}'` : ""}`;
  if (!error) return baseMessage;

  return `${baseMessage}: ${error.name} - ${error.message}`;
}

export async function initDB(): Promise<boolean> {
  return new Promise((resolve) => {
    // Project name for project's database
    const dbOpenRequest: IDBOpenDBRequest = indexedDB.open(
      DATABASE_NAME,
      import.meta.env.VITE_PROJECT_DATABASE_VERSION || 3, // Version 3 for UserSkills store
    );

    // The database will already have the object stores from the previous version of
    // the database, so you do not have to create these object stores again. You only
    // need to create any new object stores, or delete object stores from the previous
    // version that are no longer needed. If you need to change an existing object store
    // (e.g. to change a keyPath), then you must delete the old one and create it again
    // with the new options.
    dbOpenRequest.onupgradeneeded = (e: IDBVersionChangeEvent) => {
      _db = (e.target as IDBOpenDBRequest).result;

      // Initialize `Users` object store.
      if (!_db.objectStoreNames.contains(Stores.Users)) {
        // This specifies `Keys.Users` as a monotonically increasing and automatically
        // managed primary key.
        _db.createObjectStore(Stores.Users, {
          keyPath: Keys.Users,
          autoIncrement: true,
        });

        // You may also operate on this returned `IDBObjectStore`
        // to create create indices with `IDBObjectStore.createIndex`.
      }
      // Initialize `Skills` object store.
      if (!_db.objectStoreNames.contains(Stores.Skills)) {
        // This specifies `Keys.Skills` as a monotonically increasing and automatically
        // managed primary key.
        _db.createObjectStore(Stores.Skills, {
          keyPath: Keys.Skills,
          autoIncrement: true,
        });

        // You may also operate on this returned `IDBObjectStore`
        // to create create indices with `IDBObjectStore.createIndex`.
      }

      // Initialize `UserSkills` object store (junction table).
      if (!_db.objectStoreNames.contains(Stores.UserSkills)) {
        // This specifies `Keys.UserSkills` as a monotonically increasing and automatically
        // managed primary key for the junction table.
        const userSkillsStore = _db.createObjectStore(Stores.UserSkills, {
          keyPath: Keys.UserSkills,
          autoIncrement: true,
        });

        // Create indices for efficient queries on foreign keys
        userSkillsStore.createIndex("userId", "userId", { unique: false });
        userSkillsStore.createIndex("skillId", "skillId", { unique: false });
        // Composite index to ensure unique user-skill combinations
        userSkillsStore.createIndex("userSkill", ["userId", "skillId"], {
          unique: true,
        });
      }
    };

    // Database connection was successfully opened.
    dbOpenRequest.onsuccess = (e: Event) => {
      _db = (e.target as IDBOpenDBRequest).result;

      // Global error handler.
      _db.onerror = globalDatabaseErrorHandler;
      resolve(true);
    };

    // Database connection failed to open.
    dbOpenRequest.onerror = () => {
      resolve(false);
    };
  });
}

/**
 * Returns the id of the created record or null on failure.
 */
export async function create<T>(
  storeName: StoresTypes,
  data: T,
): Promise<number | null> {
  return new Promise((resolve) => {
    const transaction: IDBTransaction = _db.transaction(
      [storeName],
      "readwrite",
    );

    // This runs if an error occurs during the transaction.
    transaction.onerror = () => {
      console.error(formatDBError(transaction.error, "create", storeName));
      resolve(null);
    };

    const store: IDBObjectStore = transaction.objectStore(storeName);
    const addRequest: IDBRequest<IDBValidKey> = store.add(data);

    addRequest.onerror = () => {
      console.error(formatDBError(addRequest.error, "create", storeName));
      resolve(null);
    };

    // The `onsuccess` handler is the only place where the `IDBRequest<T>.result: T`
    // data can be extracted.
    addRequest.onsuccess = (e: Event) => {
      const addedId: number = (e.target as IDBRequest).result;
      resolve(addedId);
    };
  });
}

/**
 * Returns the the object record or null on failure.
 */
export async function get<T>(
  storeName: StoresTypes,
  id: number,
): Promise<T | null> {
  return new Promise((resolve) => {
    const transaction = _db.transaction([storeName], "readonly");

    // This runs if an error occurs during the transaction.
    transaction.onerror = () => {
      console.error(formatDBError(transaction.error, "get", storeName));
      resolve(null);
    };

    const store: IDBObjectStore = transaction.objectStore(storeName);

    const getRequest: IDBRequest<T | undefined> = store.get(id);

    getRequest.onerror = () => {
      console.error(formatDBError(getRequest.error, "get", storeName));
      resolve(null);
    };

    let retrievedData: T | undefined = undefined;
    getRequest.onsuccess = (e: Event) => {
      const target = e.target as IDBRequest<T | undefined>;
      retrievedData = target.result;
      resolve(retrievedData !== undefined ? retrievedData : null);
    };
  });
}

/**
 * Returns the the object records as an array or null on failure.
 */
export async function getAll<T>(storeName: StoresTypes): Promise<T[] | null> {
  return new Promise((resolve) => {
    const transaction = _db.transaction([storeName], "readonly");

    // This runs if an error occurs during the transaction.
    transaction.onerror = () => {
      console.error(formatDBError(transaction.error, "getAll", storeName));
      resolve(null);
    };

    const store: IDBObjectStore = transaction.objectStore(storeName);

    const cursorRequest: IDBRequest<IDBCursorWithValue | null> =
      store.openCursor();

    cursorRequest.onerror = () => {
      console.error(formatDBError(cursorRequest.error, "getAll", storeName));
      resolve(null);
    };

    // This function runs once for each item that the cursor reads.
    // A new cursor object is extracted from the event each iteration.
    //
    // If there are no items remaining, the cursor is instantiated as
    // `null` and if no errors are hanging on the error handler the transaction
    // will fire oncomplete.
    const allRetrievedData: T[] = [];
    cursorRequest.onsuccess = (e: Event) => {
      const cursor: IDBCursorWithValue | null = (
        e.target as IDBRequest<IDBCursorWithValue | null>
      ).result;

      if (cursor) {
        allRetrievedData.push(cursor.value as T);
        cursor.continue();
      }
    };

    // This runs after the transaction successfully adds all data to the database.
    // Critically the data should be resolved here to actually receive it out of this
    // Promise.
    transaction.oncomplete = () => {
      resolve(allRetrievedData);
    };
  });
}

/**
 * Returns the the updated object record or null on failure.
 */
export async function update<T extends object>(
  storeName: StoresTypes,
  id: number,
  newData: T,
  createDefault: () => T,
): Promise<T | null> {
  return new Promise((resolve) => {
    const transaction = _db.transaction([storeName], "readwrite");

    // This runs if an error occurs during the transaction.
    transaction.onerror = () => {
      console.error(formatDBError(transaction.error, "update", storeName));
      resolve(null);
    };

    const store: IDBObjectStore = transaction.objectStore(storeName);
    const getRequest: IDBRequest<T | undefined> = store.get(id);

    getRequest.onerror = () => {
      console.error(formatDBError(getRequest.error, "update", storeName));
      resolve(null);
    };

    getRequest.onsuccess = (e: Event) => {
      const target = e.target as IDBRequest<T | undefined>;
      let retrievedData = target.result;

      // The get request was successful but the id was not found in the database.
      // Potentially this is okay because we can just create the record with `put`.
      //
      // Also, at this time any additional fields for an update record can be added.
      if (!retrievedData) {
        retrievedData = createDefault();
      }

      // Updates to this record from passed in `newData`.
      for (const key in newData) {
        if (Object.hasOwn(retrievedData, key)) {
          retrievedData[key] = newData[key];
        }
      }

      const updateRequest: IDBRequest<IDBValidKey> = store.put(retrievedData);

      updateRequest.onerror = () => {
        console.error(formatDBError(updateRequest.error, "update", storeName));
        resolve(null);
      };

      updateRequest.onsuccess = () => {
        resolve(retrievedData);
      };
    };
  });
}

/**
 * Returns the the deleted object's id or null on failure.
 */
export async function remove(
  storeName: StoresTypes,
  id: number,
): Promise<boolean> {
  return new Promise((resolve) => {
    const transaction = _db.transaction([storeName], "readwrite");

    // This runs if an error occurs during the transaction.
    transaction.onerror = () => {
      console.error(formatDBError(transaction.error, "remove", storeName));
      resolve(false);
    };

    const store: IDBObjectStore = transaction.objectStore(storeName);

    const deleteRequest: IDBRequest<undefined> = store.delete(id);

    deleteRequest.onerror = () => {
      console.error(formatDBError(deleteRequest.error, "remove", storeName));
      resolve(false);
    };

    deleteRequest.onsuccess = () => {
      resolve(true);
    };
  });
}

/**
 * Clears all records from a specific store.
 */
export async function clearStore(storeName: StoresTypes): Promise<boolean> {
  return new Promise((resolve) => {
    const transaction = _db.transaction([storeName], "readwrite");

    transaction.onerror = () => {
      console.error(formatDBError(transaction.error, "clearStore", storeName));
      resolve(false);
    };

    const store: IDBObjectStore = transaction.objectStore(storeName);
    const clearRequest: IDBRequest<undefined> = store.clear();

    clearRequest.onerror = () => {
      console.error(formatDBError(clearRequest.error, "clearStore", storeName));
      resolve(false);
    };

    clearRequest.onsuccess = () => {
      resolve(true);
    };
  });
}
