import { openDB } from '../idb';
import { WriteDBParams } from '../types';

const writeToDB = async ({
  dbName,
  storeName,
  data,
}: WriteDBParams): Promise<void> => {
  try {
    const db = await openDB(dbName);
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    await store.add(data);
    await tx.done;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write to database: ${error.message}`);
    }
    throw new Error('Failed to write to database: Unknown error');
  }
};

export default writeToDB;
