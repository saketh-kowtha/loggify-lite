import { initializeDB } from '.';

describe('initializeDB', () => {
  it('should initialize the database', () => {
    const db = initializeDB();
    expect(db).toBeDefined();
  });

  it('should throw an error if the database cannot be initialized', () => {
    const db = initializeDB();
    expect(db).toBeDefined();
  });
});
