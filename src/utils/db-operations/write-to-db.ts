import { openDB } from '../../idb';
import configStore from '../../store';
import { WriteDBParams } from '../../types';
import generateUUID from '../gen-uuid';

const writeToDB = async ({
  dbName,
  storeName,
  event,
  threshold = configStore.getConfig().maxDBSize, // Default 50MB threshold
}: WriteDBParams & { threshold?: number }): Promise<void> => {
  try {
    const db = await openDB(dbName);
    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    const idx = generateUUID();
    // Get current size
    const entries = await store.getAll();
    const currentSize = new Blob([JSON.stringify(entries)]).size;

    if (currentSize > threshold) {
      // Calculate how many old entries to remove
      const entrySize = currentSize / entries.length;
      const entriesToRemove = Math.ceil((currentSize - threshold) / entrySize);

      // Get oldest entries by timestamp
      const oldestEntries = entries
        .sort((a, b) => a.data.timestamp - b.data.timestamp)
        .slice(0, entriesToRemove);

      // Remove oldest entries
      for (const entry of oldestEntries) {
        await store.delete(IDBKeyRange.only(entry));
      }
    }

    // Add new event
    await store.add({ ...event, id: idx });
    await tx.done;
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to write to database: ${error.message}`);
    }
    throw new Error('Failed to write to database: Unknown error');
  }
};

export default writeToDB;
