import test, { afterEach, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, SCHEMA_VERSION } from '../src/state.js';
import { saveGame, loadGame, loadLatestGame, listSaves, listAutoSave, listCareerSafety, CAREER_SAFETY_SLOT, serializeSave, importSave } from '../src/persistence.js';

const originalStorage = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
const originalDatabase = Object.getOwnPropertyDescriptor(globalThis, 'indexedDB');
const RealDate = Date;
let storage;
let clock;

beforeEach(() => {
  storage = new Map();
  clock = RealDate.parse('2026-10-25T10:00:00Z');
  globalThis.Date = class extends RealDate { constructor(...args) { super(...(args.length ? args : [clock])); } };
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    getItem: key => storage.get(key) ?? null,
    setItem: (key, value) => storage.set(key, String(value)),
    removeItem: key => storage.delete(key)
  } });
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: undefined });
});

afterEach(() => {
  globalThis.Date = RealDate;
  if (originalStorage) Object.defineProperty(globalThis, 'localStorage', originalStorage);
  else delete globalThis.localStorage;
  if (originalDatabase) Object.defineProperty(globalThis, 'indexedDB', originalDatabase);
  else delete globalThis.indexedDB;
});

function fakeDatabase(records = new Map(), failWrite = false) {
  let closes = 0;
  const api = { open() {
    const request = {};
    queueMicrotask(() => {
      request.result = {
        close: () => { closes += 1; },
        transaction() {
          const tx = { objectStore: () => ({
            get: slot => operation(() => records.get(slot)),
            put: record => operation(() => {
              if (failWrite) throw new Error('Write failed');
              records.set(record.slot, structuredClone(record));
              return record.slot;
            })
          }) };
          function operation(run) {
            const req = {};
            queueMicrotask(() => {
              try { req.result = run(); req.onsuccess?.(); tx.oncomplete?.(); }
              catch (error) { req.error = error; req.onerror?.(); tx.onabort?.(); }
            });
            return req;
          }
          return tx;
        }
      };
      request.onsuccess?.();
    });
    return request;
  } };
  Object.defineProperty(globalThis, 'indexedDB', { configurable: true, value: api });
  return { records, get closes() { return closes; } };
}

function fileFrom(text) { return { size: new TextEncoder().encode(text).length, text: async () => text }; }

test('autosave é separado dos três slots e continuar recupera o mais recente', async () => {
  const manual = createInitialState(91);
  await saveGame(manual, 1);
  clock += 1000;
  const automatic = { ...manual, day: 7, minutes: 450 };
  await saveGame(automatic, 0, 'auto');
  assert.equal((await loadGame(1)).day, 0);
  assert.equal((await loadGame(0)).day, 7);
  assert.equal((await loadLatestGame()).day, 7);
  assert.equal((await listSaves()).length, 3);
  assert.equal((await listAutoSave()).kind, 'auto');
});

test('backup JSON com checksum preserva RNG e recusa alteração no conteúdo', async () => {
  const initial = createInitialState(762);
  const text = serializeSave(initial);
  const result = await importSave(fileFrom(text));
  assert.equal(result.rngState, 762);
  assert.deepEqual(result.fleet, initial.fleet);
  const envelope = JSON.parse(text);
  envelope.payload = envelope.payload.replace('2200000', '9999999');
  await assert.rejects(importSave(fileFrom(JSON.stringify(envelope))), /integridade/);
});

test('recuperação da carreira usa arquivo independente e nunca substitui Continuar', async () => {
  const live = createInitialState(830);
  await saveGame(live, 0, 'auto');
  await saveGame(live, 2, 'manual');
  const automaticRecord = storage.get('comissario-save-0');
  const manualRecord = storage.get('comissario-save-2');
  clock += 1000;
  const recovery = { ...live, day: 11, minutes: 570 };
  await saveGame(recovery, CAREER_SAFETY_SLOT);
  const recovered = await loadGame(CAREER_SAFETY_SLOT);
  assert.equal(recovered.day, 11);
  assert.equal(recovered.minutes, 570);
  assert.equal(recovered.rngState, live.rngState);
  assert.equal(recovered.schemaVersion, SCHEMA_VERSION);
  assert.equal((await listCareerSafety()).kind, 'career-safety');
  assert.equal(JSON.parse(storage.get('comissario-save-4')).kind, 'career-safety');
  assert.equal(storage.get('comissario-save-0'), automaticRecord);
  assert.equal(storage.get('comissario-save-2'), manualRecord);
  assert.deepEqual((await listSaves()).map(slot => slot.slot), [1, 2, 3]);
  assert.equal((await loadLatestGame()).day, 0, 'Recovery must not override a newer live-save choice');
  storage.delete('comissario-save-0');
  storage.delete('comissario-save-2');
  assert.equal(await loadLatestGame(), null, 'A recovery-only archive is not a Continue save');
});

test('recuperação corrompida preserva o arquivo e não impede retomar autosave', async () => {
  const live = createInitialState(831);
  await saveGame(live, 0, 'auto');
  await saveGame(live, CAREER_SAFETY_SLOT, 'career-safety');
  const recoveryRecord = JSON.parse(storage.get('comissario-save-4'));
  recoveryRecord.checksum = '00000000';
  const damaged = JSON.stringify(recoveryRecord);
  storage.set('comissario-save-4', damaged);
  await assert.rejects(loadGame(CAREER_SAFETY_SLOT), /integridade/);
  assert.equal((await listCareerSafety()).corrupt, true);
  assert.equal(storage.get('comissario-save-4'), damaged);
  assert.equal((await loadLatestGame()).seed, live.seed);
});

test('importação migra JSON antigo sem modificar o objeto original', async () => {
  const original = createInitialState(13);
  original.schemaVersion = 1;
  original.day = 4;
  const text = JSON.stringify(original);
  const migrated = await importSave(fileFrom(text));
  assert.equal(migrated.schemaVersion, SCHEMA_VERSION);
  assert.equal(migrated.day, 4);
  assert.equal(migrated.rngState, 13);
  assert.equal(original.schemaVersion, 1);
});

test('fallback mais recente é recuperado mesmo quando IndexedDB volta a funcionar', async () => {
  const initial = createInitialState(20);
  await saveGame(initial, 1);
  const staleRecord = JSON.parse(storage.get('comissario-save-1'));
  clock += 5000;
  await saveGame({ ...initial, day: 8 }, 1);
  const database = fakeDatabase(new Map([[1, staleRecord]]));
  assert.equal((await loadGame(1)).day, 8);
  assert.equal(database.closes, 1);
});

test('falha de transação fecha IndexedDB e salva em armazenamento alternativo', async () => {
  const database = fakeDatabase(new Map(), true);
  await saveGame(createInitialState(17), 2);
  assert.equal(database.closes, 1);
  assert.equal((await loadGame(2)).seed, 17);
  assert.equal(database.closes, 2);
});

test('corrupção do backup não apaga original e permite recuperar outra cópia válida', async () => {
  const initial = createInitialState(19);
  await saveGame(initial, 1);
  const goodRecord = JSON.parse(storage.get('comissario-save-1'));
  const corrupted = { ...goodRecord, savedAt: '2026-10-26T00:00:00Z', checksum: '00000000' };
  storage.set('comissario-save-1', JSON.stringify(corrupted));
  const database = fakeDatabase(new Map([[1, goodRecord]]));
  assert.equal((await loadGame(1)).seed, 19);
  assert.deepEqual(JSON.parse(storage.get('comissario-save-1')), corrupted);
  database.records.clear();
  await assert.rejects(loadGame(1), /integridade/);
});

test('armazenamento indisponível orienta exportar e rejeita slots inválidos', async () => {
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: {
    setItem() { throw new Error('Quota'); }, getItem() { throw new Error('Blocked'); }
  } });
  await assert.rejects(saveGame(createInitialState(5), 1), /Exporte seu progresso/);
  await assert.rejects(loadGame(1), /Exporte seu progresso/);
  await assert.rejects(saveGame(createInitialState(5), 5), /Slot inválido/);
});

test('importação recusa arquivos grandes, esquema futuro e estruturas inválidas', async () => {
  await assert.rejects(importSave({ size: 6 * 1024 * 1024, text: async () => '{}' }), /5 MB/);
  await assert.rejects(importSave(fileFrom('{')), /JSON válido/);
  const future = { ...createInitialState(5), schemaVersion: 100 };
  await assert.rejects(importSave(fileFrom(JSON.stringify(future))), /incompatível/);
  const corrupt = { ...createInitialState(5), city: null };
  await assert.rejects(importSave(fileFrom(JSON.stringify(corrupt))), /city/);
  const badClock = { ...createInitialState(5), minutes: null };
  await assert.rejects(importSave(fileFrom(JSON.stringify(badClock))), /minutes/);
});
