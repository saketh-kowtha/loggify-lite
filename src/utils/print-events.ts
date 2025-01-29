import readFromDB from './db-operations/read-from-db';
import configStore from '../store';

export default async function printEvents() {
  const events = await readFromDB({
    dbName: configStore.getConfig().dbName,
    storeName: configStore.getConfig().storeName,
  });
  console.log(events);
}
