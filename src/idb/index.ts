import { openDB, deleteDB, wrap, unwrap } from 'idb';

export const initializeDB = async (
  dbName: string = 'loggify',
  version: number = 1,
) => {
  try {
    const db = await openDB(dbName, version, {
      upgrade(db) {
        // Create store if it doesn't exist
        if (!db.objectStoreNames.contains('logs')) {
          db.createObjectStore('logs', {
            autoIncrement: false,
            keyPath: 'id',
          });
        }
      },
    });
    return db;
  } catch (error) {
    throw error;
  }
};

export { openDB, deleteDB, wrap, unwrap };
