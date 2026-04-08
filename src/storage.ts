import type { GameRecord } from "./types";

const DATABASE_NAME = "minesweeper-trainer";
const DATABASE_VERSION = 1;
const GAME_RECORDS_STORE = "game-records";

let databasePromise: Promise<IDBDatabase> | null = null;

function openDatabase(): Promise<IDBDatabase> {
  if (databasePromise) {
    return databasePromise;
  }

  databasePromise = new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(GAME_RECORDS_STORE)) {
        const store = database.createObjectStore(GAME_RECORDS_STORE, {
          keyPath: "id",
        });
        store.createIndex("finishedAtIso", "finishedAtIso", { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Failed to open IndexedDB"));
  });

  return databasePromise;
}

export async function saveGameRecord(record: GameRecord): Promise<void> {
  const database = await openDatabase();

  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(GAME_RECORDS_STORE, "readwrite");
    const store = transaction.objectStore(GAME_RECORDS_STORE);
    store.put(record);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error ?? new Error("Failed to save game record"));
    transaction.onabort = () => reject(transaction.error ?? new Error("Game record transaction aborted"));
  });
}
