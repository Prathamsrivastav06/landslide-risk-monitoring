import { openDB } from 'idb';

const DB_NAME = 'landslide_offline';
const STORE_NAME = 'field_reports_queue';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'offline_id' });
      }
    }
  });
}

export const offlineQueue = {
  async add(report) {
    const db = await getDB();
    const offline_id = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry = { ...report, offline_id, created_at: new Date().toISOString(), synced: false };
    await db.put(STORE_NAME, entry);
    return offline_id;
  },
  
  async getAll() {
    const db = await getDB();
    return db.getAll(STORE_NAME);
  },
  
  async getPending() {
    const all = await offlineQueue.getAll();
    return all.filter(r => !r.synced);
  },
  
  async markSynced(offline_id) {
    const db = await getDB();
    const item = await db.get(STORE_NAME, offline_id);
    if (item) {
      item.synced = true;
      item.synced_at = new Date().toISOString();
      await db.put(STORE_NAME, item);
    }
  },
  
  async count() {
    const pending = await offlineQueue.getPending();
    return pending.length;
  }
};

// Sync manager
export async function syncPendingReports(apiCreateFn) {
  const pending = await offlineQueue.getPending();
  if (pending.length === 0) return { synced: 0, failed: 0 };
  
  let synced = 0;
  let failed = 0;
  
  for (const report of pending) {
    try {
      const formData = new FormData();
      Object.entries(report).forEach(([k, v]) => {
        if (k !== 'offline_id' && k !== 'synced' && v !== null && v !== undefined) {
          formData.append(k, v);
        }
      });
      formData.append('offline_id', report.offline_id);
      
      await apiCreateFn(formData);
      await offlineQueue.markSynced(report.offline_id);
      synced++;
    } catch (e) {
      failed++;
    }
  }
  
  return { synced, failed };
}
