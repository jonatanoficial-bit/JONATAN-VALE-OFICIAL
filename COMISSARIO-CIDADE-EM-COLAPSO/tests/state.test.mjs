import test from 'node:test';
import assert from 'node:assert/strict';
import { candidates, roomCatalog, vehiclesCatalog } from '../src/content.js';
import { createInitialState, reducer } from '../src/state.js';

test('compra reduz caixa e cria veículo único', () => {
  const initial = createInitialState(7);
  const item = vehiclesCatalog[0];
  const next = reducer(initial, { type: 'PURCHASE', item });
  assert.equal(next.finance.cash, initial.finance.cash - item.price);
  assert.equal(next.fleet.length, initial.fleet.length + 1);
  assert.equal(next.fleet.at(-1).id, 'V-003');
});

test('contratação aumenta folha e remove candidato', () => {
  const initial = createInitialState(7);
  const person = candidates[0];
  const next = reducer(initial, { type: 'HIRE', person });
  assert.equal(next.finance.payroll, initial.finance.payroll + person.salary);
  assert.equal(next.candidatePool.some(item => item.id === person.id), false);
});

test('construção valida colisão e custo', () => {
  const initial = createInitialState(7);
  const room = roomCatalog[0];
  const placed = reducer(initial, { type: 'PLACE_ROOM', payload: { room, x: 8, y: 4 } });
  assert.equal(placed.stats.rooms, 1);
  const collision = reducer(placed, { type: 'PLACE_ROOM', payload: { room, x: 8, y: 4 } });
  assert.equal(collision, placed);
});

test('efeito de chamada não duplica', () => {
  const initial = createInitialState(7);
  const payload = { personId: 'P07', topic: 'Verba', result: 'Aprovada', effects: { cash: 100000 } };
  const once = reducer(initial, { type: 'PHONE_CALL', payload });
  const twice = reducer(once, { type: 'PHONE_CALL', payload });
  assert.equal(once.finance.cash, twice.finance.cash);
  assert.equal(twice.phoneLog.length, 2);
});
