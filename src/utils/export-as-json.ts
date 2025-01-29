import readFromDB from './db-operations/read-from-db';
import configStore from '../store';
import downloadFile from './download-file';

export default async function exportEvents() {
  const events = await readFromDB({
    dbName: configStore.getConfig().dbName,
    storeName: configStore.getConfig().storeName,
  });

  downloadFile(events, 'events');
}
