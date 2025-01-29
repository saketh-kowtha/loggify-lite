import { openDB } from '../../idb';
import { ReadDBParams } from '../../types';

const readFromDB = async ({
  dbName,
  storeName,
}: ReadDBParams): Promise<any[]> => {
  try {
    const db = await openDB(dbName);
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const result = await store.getAll();
    await tx.done;
    return result;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to read from database: ${error.message}`);
    }
    throw new Error('Failed to read from database: Unknown error');
  }
};

export default readFromDB;
