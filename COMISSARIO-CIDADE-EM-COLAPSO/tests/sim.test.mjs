import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, reducer } from '../src/state.js';
import { advanceWorld, rngStep, spawnIncident } from '../src/sim.js';

test('RNG é determinístico para o mesmo estado', () => {
  assert.deepEqual(rngStep(12345), rngStep(12345));
});

test('spawn com mesma seed reproduz tipo e distrito', () => {
  const a = createInitialState(1234); const b = createInitialState(1234);
  spawnIncident(a); spawnIncident(b);
  assert.equal(a.activeIncidents[0].type, b.activeIncidents[0].type);
  assert.equal(a.activeIncidents[0].districtId, b.activeIncidents[0].districtId);
});

test('despacho avança e resolve liberando viatura', () => {
  let state = createInitialState(9);
  spawnIncident(state, 'traffic');
  const id = state.activeIncidents[0].id;
  state = reducer(state, { type: 'DISPATCH', incidentId: id, vehicleId: 'V-001' });
  for (let i = 0; i < 12; i += 1) state = advanceWorld(state, 10);
  assert.equal(state.activeIncidents[0].stage, 'onscene');
  state = reducer(state, { type: 'RESOLVE_INCIDENT', incidentId: id, choice: 'A' });
  assert.equal(state.activeIncidents.length, 0);
  assert.equal(state.fleet[0].status, 'available');
});

test('avanço de sete dias gera eventos e preserva números válidos', () => {
  let state = createInitialState(99);
  for (let i = 0; i < 7; i += 1) state = advanceWorld(state, 1440);
  assert.equal(state.day, 7);
  assert.ok(state.activeIncidents.length > 0);
  assert.ok(Number.isFinite(state.finance.cash));
});
