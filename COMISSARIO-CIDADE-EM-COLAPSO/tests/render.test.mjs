import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { renderApp } from '../src/render.js';
import { portrait, artGallery } from '../src/art.js';
import { people } from '../src/content.js';
import { createInitialState } from '../src/state.js';
import { spawnIncident } from '../src/sim.js';

const local = path => fileURLToPath(new URL('../' + path.replace(/^\.\//, ''), import.meta.url));
const screens = ['title', 'intro', 'office', 'phone', 'map', 'precinct', 'fleet', 'staff', 'case', 'campaign', 'report', 'saves', 'settings', 'gallery'];

test('todas as telas e painéis de incidente renderizam sem valores indefinidos', () => {
  const state = createInitialState(1234);
  state.storyStage = 'office';
  spawnIncident(state, 'protest');
  for (const screen of screens) {
    state.screen = screen;
    const html = renderApp(state, { selectedContact: 'P04', selectedIncident: state.activeIncidents[0].id });
    assert.match(html, /<main/);
    assert.doesNotMatch(html, /\bundefined\b|\bNaN\b/, screen);
  }
  state.screen = 'map';
  for (const stage of ['pending', 'enroute', 'onscene']) {
    Object.assign(state.activeIncidents[0], { stage, progress: 25, eta: 8 });
    assert.doesNotMatch(renderApp(state, { selectedIncident: state.activeIncidents[0].id }), /\bundefined\b|\bNaN\b/);
  }
});

test('os 12 personagens têm fotografia local e janela dentro da composição original', () => {
  assert.equal(people.length, 12);
  for (const person of people) {
    const html = portrait(person, 'dossier');
    assert.match(html, new RegExp('data-person="' + person.id + '"'));
    const path = html.match(/<image href="([^"]+)"/)[1];
    assert.ok(existsSync(local(path)), path);
    const [x, y, w, h] = html.match(/viewBox="([^"]+)"/)[1].split(' ').map(Number);
    assert.ok(x >= 0 && y >= 0 && w > 0 && h > 0 && x + w <= 1672 && y + h <= 941, person.id);
  }
  const state = createInitialState();
  state.screen = 'phone';
  for (const person of people) {
    const html = renderApp(state, { selectedContact: person.id });
    assert.match(html, new RegExp('data-person="' + person.id + '"'));
    assert.doesNotMatch(html, /\bundefined\b|\bNaN\b/, person.id);
  }
});

test('todas as imagens usadas pelas telas, CSS e galeria existem no pacote', () => {
  const state = createInitialState();
  state.storyStage = 'office';
  const paths = new Set(artGallery.map(item => item.url));
  for (const screen of screens) {
    state.screen = screen;
    for (const match of renderApp(state, {}).matchAll(/(?:src|href)="(\.\/assets\/[^"#]+)"/g)) paths.add(match[1]);
  }
  const css = readFileSync(local('styles.css'), 'utf8');
  for (const match of css.matchAll(/url\(['"]?(\.\/assets\/[^'"\)]+)['"]?\)/g)) paths.add(match[1]);
  assert.equal(artGallery.length, 10);
  for (const path of paths) assert.ok(existsSync(local(path)), path);
});

test('texto de saves é escapado em relatórios, pessoal e respostas de chamadas', () => {
  const state = createInitialState();
  state.storyStage = 'office';
  const payload = '<img src=x onerror="alert(1)">';
  state.journal[0].text = payload;
  state.staff[0].name = payload;
  state.promises.push({ text: payload, dueDay: 1, done: false });
  for (const screen of ['report', 'staff', 'phone']) {
    state.screen = screen;
    const html = renderApp(state, { callResult: { personId: 'P04', title: payload, result: payload } });
    assert.ok(!html.includes(payload), screen);
    assert.match(html, /&lt;img/);
  }
});

test('mapa e delegacia não interpolam HTML fornecido por um save', () => {
  const state = createInitialState();
  state.storyStage = 'office';
  spawnIncident(state, 'protest');
  const payload = '"><img src=x onerror="alert(1)">';
  state.activeIncidents[0].title = payload;
  state.fleet[0].name = payload;
  state.buildings[0].name = payload;
  for (const screen of ['map', 'precinct']) {
    state.screen = screen;
    const html = renderApp(state, {});
    assert.ok(!html.includes(payload), screen);
  }
});
