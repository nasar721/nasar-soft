import {
  CompanySettings, Employee, InventoryItem, Invoice, JournalHeader, JournalLine, Party
} from '../types.ts';

export interface AppData {
  headers: JournalHeader[];
  lines: JournalLine[];
  inventory: InventoryItem[];
  employees: Employee[];
  parties: Party[];
  invoices: Invoice[];
  companySettings: CompanySettings;
}

const DATABASE_NAME = 'nasser-soft-local';
const DATABASE_VERSION = 1;
const STORE_NAME = 'app-data';
const STATE_KEY = 'primary';
const LEGACY_KEYS: Record<keyof AppData, string> = {
  headers: 'acc_headers',
  lines: 'acc_lines',
  inventory: 'acc_inventory',
  employees: 'acc_employees',
  parties: 'acc_parties',
  invoices: 'acc_invoices',
  companySettings: 'acc_settings'
};

const openDatabase = (): Promise<IDBDatabase> => new Promise((resolve, reject) => {
  if (!('indexedDB' in window)) {
    reject(new Error('IndexedDB is not supported in this browser.'));
    return;
  }
  const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error ?? new Error('Unable to open local database.'));
  request.onblocked = () => reject(new Error('Local database upgrade is blocked by another tab.'));
});

const readLegacyData = (defaults: AppData): AppData => {
  const result = { ...defaults };
  for (const key of Object.keys(LEGACY_KEYS) as (keyof AppData)[]) {
    const raw = localStorage.getItem(LEGACY_KEYS[key]);
    if (!raw) continue;
    try {
      (result as Record<keyof AppData, unknown>)[key] =
        key === 'companySettings'
          ? { ...defaults.companySettings, ...JSON.parse(raw) }
          : JSON.parse(raw);
    } catch {
      console.warn(`Skipping invalid legacy localStorage value: ${LEGACY_KEYS[key]}`);
    }
  }
  return result;
};

export async function loadAppData(defaults: AppData): Promise<{ data: AppData; backend: 'indexeddb' | 'localstorage' }> {
  try {
    const db = await openDatabase();
    try {
      const stored = await new Promise<AppData | undefined>((resolve, reject) => {
        const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(STATE_KEY);
        request.onsuccess = () => resolve(request.result as AppData | undefined);
        request.onerror = () => reject(request.error ?? new Error('Unable to read local data.'));
      });
      if (stored && typeof stored === 'object') return { data: { ...defaults, ...stored }, backend: 'indexeddb' };
      const migrated = readLegacyData(defaults);
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(migrated, STATE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Migration failed.'));
        tx.onabort = () => reject(tx.error ?? new Error('Migration was aborted.'));
      });
      return { data: migrated, backend: 'indexeddb' };
    } finally {
      db.close();
    }
  } catch (error) {
    console.warn('IndexedDB unavailable; using legacy localStorage storage.', error);
    return { data: readLegacyData(defaults), backend: 'localstorage' };
  }
}

export async function saveAppData(data: AppData): Promise<'indexeddb' | 'localstorage'> {
  try {
    const db = await openDatabase();
    try {
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        tx.objectStore(STORE_NAME).put(data, STATE_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error ?? new Error('Unable to save local data.'));
        tx.onabort = () => reject(tx.error ?? new Error('Local save was aborted.'));
      });
      return 'indexeddb';
    } finally {
      db.close();
    }
  } catch (error) {
    console.error('IndexedDB save failed; falling back to localStorage.', error);
    try {
      for (const key of Object.keys(LEGACY_KEYS) as (keyof AppData)[]) {
        localStorage.setItem(LEGACY_KEYS[key], JSON.stringify(data[key]));
      }
      return 'localstorage';
    } catch (fallbackError) {
      console.error('Both local storage backends failed.', fallbackError);
      throw fallbackError;
    }
  }
}
