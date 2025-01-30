import readFromDB from './read-from-db';

describe('readFromDB', () => {
  beforeEach(() => {
    // Clear all databases before each test
    indexedDB.deleteDatabase('loggify');
  });

  it('should read all records from the database', async () => {
    // First create a database and add some test data
    const db = await indexedDB.open('loggify', 1);
    db.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('logs');
    };

    const testData = [
      {
        id: 1,
        type: 'ERROR',
        data: {
          message: 'test1',
          timestamp: Date.now(),
          stack: 'Error: test1',
        },
      },
      {
        id: 2,
        type: 'CONSOLE_ERROR',
        data: {
          message: 'test2',
          timestamp: Date.now(),
          stack: 'Error: test2',
        },
      },
    ];

    // Add test data
    const dbRequest = indexedDB.open('loggify', 1);
    dbRequest.onsuccess = async () => {
      const db = dbRequest.result;
      const tx = db.transaction('logs', 'readwrite');
      const store = tx.objectStore('logs');
      for (const item of testData) {
        await store.add(item, item.id);
      }
    };

    // Read the data using our function
    const result = await readFromDB({
      dbName: 'loggify',
      storeName: 'logs',
    });

    expect(result).toHaveLength(2);
    expect(result).toEqual(expect.arrayContaining(testData));
  });

  it('should throw error when database name is invalid', async () => {
    await expect(
      readFromDB({
        dbName: 'nonexistent-db',
        storeName: 'logs',
      }),
    ).rejects.toThrow('Failed to read from database');
  });

  it('should throw error when store name is invalid', async () => {
    // Create database first
    const db = await indexedDB.open('loggify', 1);
    db.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      db.createObjectStore('logs');
    };

    await expect(
      readFromDB({
        dbName: 'loggify',
        storeName: 'nonexistent-store',
      }),
    ).rejects.toThrow('Failed to read from database');
  });
});
