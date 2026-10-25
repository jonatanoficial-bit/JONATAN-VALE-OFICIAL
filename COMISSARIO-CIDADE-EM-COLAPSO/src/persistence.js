import { migrateState } from './state.js';

const DB_NAME = 'comissario-cidade-em-colapso';
const DB_VERSION = 1;
const STORE = 'saves';
const FALLBACK_KEY = 'comissario-save-';

function openDb() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in globalThis)) return reject(new Error('IndexedDB indisponível'));
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slot' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error || new Error('Falha ao abrir armazenamento'));
  });
}

function checksum(text) {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i += 1) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export async function saveGame(state, slot = 1, kind = 'manual') {
  const savedState = structuredClone(state);
  savedState.lastSavedAt = new Date().toISOString();
  const payload = JSON.stringify(savedState);
  const record = {
    slot,
    kind,
    savedAt: savedState.lastSavedAt,
    day: savedState.day,
    gameMinutes: savedState.minutes,
    schemaVersion: savedState.schemaVersion,
    checksum: checksum(payload),
    payload
  };
  try {
    const db = await openDb();
    await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.objectStore(STORE).put(record);
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
    db.close();
  } catch {
    localStorage.setItem(`${FALLBACK_KEY}${slot}`, JSON.stringify(record));
  }
  return savedState;
}

export async function loadGame(slot = 1) {
  let record = null;
  try {
    const db = await openDb();
    record = await new Promise((resolve, reject) => {
      const request = db.transaction(STORE, 'readonly').objectStore(STORE).get(slot);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => reject(request.error);
    });
    db.close();
  } catch {
    const raw = localStorage.getItem(`${FALLBACK_KEY}${slot}`);
    record = raw ? JSON.parse(raw) : null;
  }
  if (!record) return null;
  if (checksum(record.payload) !== record.checksum) throw new Error('O arquivo de save falhou na verificação de integridade.');
  return migrateState(JSON.parse(record.payload));
}

export async function listSaves() {
  const slots = await Promise.all([1, 2, 3].map(async slot => {
    try {
      const state = await loadGame(slot);
      return state ? { slot, savedAt: state.lastSavedAt, day: state.day, minutes: state.minutes } : { slot, empty: true };
    } catch {
      return { slot, corrupt: true };
    }
  }));
  return slots;
}

export function exportSave(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `comissario-save-dia-${state.day + 1}.json`;
  anchor.click();
  URL.revokeObjectURL(url);
}

export async function importSave(file) {
  if (!file || file.size > 5 * 1024 * 1024) throw new Error('Arquivo ausente ou maior que 5 MB.');
  const text = await file.text();
  const value = JSON.parse(text);
  return migrateState(value);
}
