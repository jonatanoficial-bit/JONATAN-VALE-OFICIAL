import { migrateState, SCHEMA_VERSION } from './state.js';

const DB_NAME = 'comissario-cidade-em-colapso';
const DB_VERSION = 1;
const STORE = 'saves';
const FALLBACK_KEY = 'comissario-save-';
const MAX_BYTES = 5 * 1024 * 1024;
const SAVE_FORMAT = 'comissario-save';
const STORAGE_MESSAGE = 'Não foi possível acessar o armazenamento. Exporte seu progresso em JSON antes de fechar o jogo.';
export const CAREER_SAFETY_SLOT = 4;

function validateSlot(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot > CAREER_SAFETY_SLOT) throw new Error('Slot inválido: use 0 para autosave, 1–3 para salvamento manual ou 4 para recuperação da carreira.');
}

function openDb() {
  return new Promise((resolve, reject) => {
    if (!globalThis.indexedDB) return reject(new Error('IndexedDB indisponível'));
    let finished = false;
    const timer = setTimeout(() => finish(new Error('Armazenamento ocupado.')), 3000);
    const finish = (error, db) => {
      if (finished) { db?.close(); return; }
      finished = true;
      clearTimeout(timer);
      if (error) reject(error);
      else resolve(db);
    };
    let request;
    try { request = globalThis.indexedDB.open(DB_NAME, DB_VERSION); }
    catch (error) { finish(error); return; }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'slot' });
    };
    request.onsuccess = () => {
      request.result.onversionchange = () => request.result.close();
      finish(null, request.result);
    };
    request.onerror = () => finish(request.error || new Error('Falha ao abrir armazenamento'));
    request.onblocked = () => finish(new Error('Armazenamento ocupado por outra aba.'));
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

function plainObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function validateState(value) {
  if (!plainObject(value) || !Number.isInteger(value.schemaVersion) || value.schemaVersion < 1 || value.schemaVersion > SCHEMA_VERSION) {
    throw new Error('Versão de save incompatível ou arquivo inválido.');
  }
  const state = migrateState(structuredClone(value));
  for (const key of ['finance', 'city', 'contacts', 'caseFile', 'flags', 'stats', 'settings']) {
    if (!plainObject(state[key])) throw new Error(`Save inválido: ${key}.`);
  }
  for (const key of ['transactions']) {
    if (!Array.isArray(state.finance[key])) throw new Error(`Save inválido: ${key}.`);
  }
  for (const key of ['evidence', 'actions', 'assignedDetectives']) {
    if (!Array.isArray(state.caseFile[key])) throw new Error(`Save inválido: ${key}.`);
  }
  for (const key of ['promises', 'history', 'notifications', 'constructionQueue']) {
    if (!Array.isArray(state[key])) throw new Error(`Save inválido: ${key}.`);
  }
  if (!Array.isArray(state.city.districts) || state.city.districts.length !== 5) throw new Error('Save inválido: distritos.');
  for (const key of ['day', 'minutes', 'seed', 'rngState', 'sequence', 'lastFinanceMonth']) {
    if (!Number.isInteger(state[key]) || state[key] < 0) throw new Error(`Save inválido: ${key}.`);
  }
  if (state.minutes >= 1440 || state.day > 100000 || ![0, 1, 3, 6].includes(state.speed)) throw new Error('Save inválido: relógio.');
  for (const [key, amount] of Object.entries(state.finance)) {
    if (key !== 'transactions' && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0)) {
      throw new Error(`Save inválido: orçamento (${key}).`);
    }
  }
  for (const [key, amount] of Object.entries(state.city)) {
    if (key !== 'districts' && (typeof amount !== 'number' || !Number.isFinite(amount) || amount < 0 || amount > 100)) {
      throw new Error(`Save inválido: indicador (${key}).`);
    }
  }
  for (const key of ['staff', 'fleet', 'buildings', 'activeIncidents', 'completedIncidents', 'candidatePool', 'caseQueue']) {
    if (state[key].length > 10000 || state[key].some(item => !plainObject(item) || typeof item.id !== 'string')) {
      throw new Error(`Save inválido: ${key}.`);
    }
  }
  if (!Number.isFinite(state.caseFile.progress) || state.caseFile.progress < 0 || state.caseFile.progress > 100) throw new Error('Save inválido: investigação.');
  for (let id = 1; id <= 12; id += 1) {
    const contact = state.contacts[`P${String(id).padStart(2, '0')}`];
    if (!plainObject(contact) || !['trust', 'respect', 'goodwill', 'calls'].every(key => Number.isFinite(contact[key]))) throw new Error('Save inválido: contatos.');
  }
  return state;
}

async function databaseOperation(mode, operation) {
  let db;
  try {
    db = await openDb();
    return await new Promise((resolve, reject) => {
      let result = null;
      let settled = false;
      const finish = (error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timer);
        if (error) reject(error); else resolve(result);
      };
      const timer = setTimeout(() => finish(new Error('Tempo limite do armazenamento.')), 3000);
      try {
        const tx = db.transaction(STORE, mode);
        const request = operation(tx.objectStore(STORE));
        request.onsuccess = () => { result = request.result ?? null; };
        request.onerror = () => finish(request.error || new Error('Falha na gravação/leitura.'));
        tx.oncomplete = () => finish();
        tx.onerror = () => finish(tx.error || new Error('Falha na transação.'));
        tx.onabort = () => finish(tx.error || new Error('Transação interrompida.'));
      } catch (error) { finish(error); }
    });
  } finally { db?.close(); }
}

function makeRecord(state, slot, kind) {
  const savedState = validateState(state);
  savedState.lastSavedAt = new Date().toISOString();
  const payload = JSON.stringify(savedState);
  if (new TextEncoder().encode(payload).length > MAX_BYTES) throw new Error('O save excedeu 5 MB.');
  return { savedState, record: {
    slot, kind, savedAt: savedState.lastSavedAt, day: savedState.day, gameMinutes: savedState.minutes,
    schemaVersion: savedState.schemaVersion, checksum: checksum(payload), payload
  } };
}

export async function saveGame(state, slot = 1, kind = 'manual') {
  validateSlot(slot);
  const { savedState, record } = makeRecord(state, slot, slot === CAREER_SAFETY_SLOT ? 'career-safety' : kind);
  const outcomes = await Promise.allSettled([
    databaseOperation('readwrite', store => store.put(record)),
    Promise.resolve().then(() => globalThis.localStorage.setItem(`${FALLBACK_KEY}${slot}`, JSON.stringify(record)))
  ]);
  if (outcomes.every(outcome => outcome.status === 'rejected')) throw new Error(STORAGE_MESSAGE);
  return savedState;
}

function decodeRecord(record) {
  if (!plainObject(record) || typeof record.payload !== 'string' || record.payload.length > MAX_BYTES || checksum(record.payload) !== record.checksum) {
    throw new Error('O arquivo de save falhou na verificação de integridade. O original foi preservado.');
  }
  return validateState(JSON.parse(record.payload));
}

export async function loadGame(slot = 1) {
  validateSlot(slot);
  const outcomes = await Promise.allSettled([
    databaseOperation('readonly', store => store.get(slot)),
    Promise.resolve().then(() => {
      const raw = globalThis.localStorage.getItem(`${FALLBACK_KEY}${slot}`);
      return raw ? JSON.parse(raw) : null;
    })
  ]);
  const candidates = outcomes.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value);
  candidates.sort((a, b) => (Date.parse(b.savedAt) || 0) - (Date.parse(a.savedAt) || 0));
  let invalid;
  for (const record of candidates) {
    try { return decodeRecord(record); }
    catch (error) { invalid = error; }
  }
  if (invalid) throw invalid;
  if (outcomes.every(result => result.status === 'rejected')) throw new Error(STORAGE_MESSAGE);
  // A malformed local backup must not silently look like an empty slot.
  if (outcomes[1].status === 'rejected' && outcomes[1].reason instanceof SyntaxError) throw new Error('O backup local contém JSON inválido. O original foi preservado.');
  return null;
}

async function slotMetadata(slot) {
  try {
    const state = await loadGame(slot);
    return state ? { slot, savedAt: state.lastSavedAt, day: state.day, minutes: state.minutes, kind: slot === 0 ? 'auto' : slot === CAREER_SAFETY_SLOT ? 'career-safety' : 'manual' } : { slot, empty: true };
  } catch (error) { return { slot, corrupt: true, error: error.message }; }
}

export async function listSaves() { return Promise.all([1, 2, 3].map(slotMetadata)); }
export async function listAutoSave() { return slotMetadata(0); }
export async function listCareerSafety() { return slotMetadata(CAREER_SAFETY_SLOT); }

export async function loadLatestGame() {
  // The pre-dismissal snapshot is an explicit recovery choice, never Continue.
  const results = await Promise.allSettled([0, 1, 2, 3].map(slot => loadGame(slot)));
  const states = results.filter(result => result.status === 'fulfilled' && result.value).map(result => result.value);
  if (states.length) return states.sort((a, b) => (Date.parse(b.lastSavedAt) || 0) - (Date.parse(a.lastSavedAt) || 0))[0];
  const failure = results.find(result => result.status === 'rejected');
  if (failure) throw failure.reason;
  return null;
}

export function serializeSave(state) {
  const { record } = makeRecord(state, 0, 'export');
  const text = JSON.stringify({ format: SAVE_FORMAT, formatVersion: 1, ...record }, null, 2);
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('O backup excedeu o limite de importação de 5 MB.');
  return text;
}

export function exportSave(state) {
  const blob = new Blob([serializeSave(state)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `comissario-save-dia-${state.day + 1}.json`;
  anchor.click();
  // Give mobile browsers a turn to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function importSave(file) {
  if (!file || !Number.isFinite(file.size) || file.size > MAX_BYTES) throw new Error('Arquivo ausente ou maior que 5 MB.');
  const text = await file.text();
  if (new TextEncoder().encode(text).length > MAX_BYTES) throw new Error('Arquivo maior que 5 MB.');
  let value;
  try { value = JSON.parse(text); }
  catch { throw new Error('O arquivo não contém JSON válido. Seu progresso atual foi preservado.'); }
  if (value?.format === SAVE_FORMAT) {
    if (value.formatVersion !== 1) throw new Error('Formato de backup incompatível.');
    return decodeRecord(value);
  }
  return validateState(value); // Compatibility with raw JSON exported by Parts 1 and 2.
}
