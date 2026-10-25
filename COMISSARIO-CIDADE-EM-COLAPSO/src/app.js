import { people } from './content.js';
import { bindMapControls } from './map.js';
import { exportSave, importSave, listSaves, loadGame, saveGame } from './persistence.js';
import { renderApp, lookupCandidate, lookupOpeningChoice, lookupPhoneTopic, lookupVehicle } from './render.js';
import { advanceWorld, spawnIncident } from './sim.js';
import { createInitialState, reducer } from './state.js';

const root = document.querySelector('#app');
const toastRegion = document.querySelector('#toast-region');
let state = createInitialState();
let ui = { hasSave: false, saveSlots: null, selectedIncident: null, selectedRoom: null };
let clockTimer = null;

function toast(message, tone = 'info') {
  const element = document.createElement('div');
  element.className = `toast toast-${tone}`;
  element.textContent = message;
  toastRegion.append(element);
  setTimeout(() => element.remove(), 3400);
}

function applyPreferences() {
  document.documentElement.classList.toggle('high-contrast', state.settings.highContrast);
  document.documentElement.classList.toggle('reduced-motion', state.settings.reducedMotion);
  document.documentElement.style.setProperty('--font-scale', state.settings.fontScale);
}

function render() {
  root.innerHTML = renderApp(state, ui);
  applyPreferences();
  if (state.screen === 'map') bindMapControls(root);
  const importInput = root.querySelector('#import-save');
  if (importInput) importInput.addEventListener('change', onImport);
}

function commit(action, { autosave = false, message = '', tone = 'info' } = {}) {
  const previous = state;
  state = reducer(state, action);
  render();
  if (state === previous) {
    toast('A ação não pôde ser concluída. Verifique saldo, capacidade ou estado atual.', 'warning');
    return false;
  }
  if (message) toast(message, tone);
  if (autosave) saveGame(state, 1, 'autosave').then(saved => { state.lastSavedAt = saved.lastSavedAt; ui.hasSave = true; }).catch(() => toast('Autosave indisponível; use Exportar JSON.', 'warning'));
  return true;
}

async function refreshSaves() {
  ui.saveSlots = await listSaves();
  ui.hasSave = ui.saveSlots.some(slot => !slot.empty && !slot.corrupt);
}

async function quickSave(slot = 1) {
  try {
    state = await saveGame(state, slot, 'manual');
    await refreshSaves(); render();
    toast(`Jogo salvo no slot ${slot}.`, 'success');
  } catch (error) {
    toast(error.message || 'Não foi possível salvar.', 'warning');
  }
}

async function loadSlot(slot = 1) {
  try {
    const loaded = await loadGame(slot);
    if (!loaded) return toast('Este slot está vazio.', 'warning');
    state = loaded; ui.selectedIncident = null; ui.selectedRoom = null;
    if (state.screen === 'title') state.screen = 'office';
    render(); toast(`Slot ${slot} carregado com integridade verificada.`, 'success');
  } catch (error) {
    toast(error.message || 'Falha ao carregar.', 'warning');
  }
}

function ensureOpeningIncident() {
  if (!state.activeIncidents.length && !state.completedIncidents.length) {
    spawnIncident(state, 'protest');
    spawnIncident(state, 'traffic');
  }
}

async function onImport(event) {
  try {
    const imported = await importSave(event.target.files?.[0]);
    state = imported; state.screen = 'office';
    await quickSave(1); render();
    toast('Backup importado e validado.', 'success');
  } catch (error) {
    toast(error.message || 'Backup inválido.', 'warning');
  }
}

root.addEventListener('click', async event => {
  const target = event.target.closest('[data-action]');
  if (!target) return;
  if (target.closest('[data-modal-stop]') && target.dataset.action === 'close-modal' && !target.matches('[data-action="close-modal"]')) return;
  const action = target.dataset.action;
  if (action === 'new-game') {
    state = createInitialState((Date.now() >>> 0) || 25102026); state.screen = 'intro';
    ui = { ...ui, selectedIncident: null, selectedRoom: null }; render(); return;
  }
  if (action === 'restart') {
    state = createInitialState(25102026); state.screen = 'title'; render(); return;
  }
  if (action === 'continue') return loadSlot(1);
  if (action === 'open-saves') {
    await refreshSaves(); state = reducer(state, { type: 'NAVIGATE', screen: 'saves' }); render(); return;
  }
  if (action === 'navigate') {
    ui.selectedIncident = null;
    commit({ type: 'NAVIGATE', screen: target.dataset.screen }); return;
  }
  if (action === 'begin-call' || action === 'skip-intro') {
    commit({ type: 'SET_STORY_STAGE', stage: 'ringing', screen: 'intro' }); return;
  }
  if (action === 'opening-choice') {
    const choice = lookupOpeningChoice(target.dataset.choice);
    commit({ type: 'OPENING_CHOICE', choice }, { autosave: true, message: choice.id === 'refuse' ? 'O prefeito ligará novamente.' : 'Posse registrada. Bem-vindo ao gabinete.', tone: 'success' });
    if (choice.id !== 'refuse') { ensureOpeningIncident(); render(); }
    return;
  }
  if (action === 'accept-second-call') {
    state.contacts.P07.trust = Math.max(0, state.contacts.P07.trust - 4);
    commit({ type: 'ACCEPT_SECOND_CALL' }, { autosave: true, message: 'Aceitação condicional registrada.', tone: 'success' }); ensureOpeningIncident(); render(); return;
  }
  if (action === 'phone-call') {
    const personId = target.dataset.person; const topic = lookupPhoneTopic(personId); const person = people.find(item => item.id === personId);
    commit({ type: 'PHONE_CALL', payload: { personId, topic: topic.label, result: topic.result, effects: topic.effects } }, { autosave: true, message: `${person.name}: ${topic.result}`, tone: 'phone' }); return;
  }
  if (action === 'purchase') {
    const item = lookupVehicle(target.dataset.type);
    commit({ type: 'PURCHASE', item }, { autosave: true, message: `${item.name} incorporado à frota.`, tone: 'success' }); return;
  }
  if (action === 'hire') {
    const person = lookupCandidate(target.dataset.id);
    commit({ type: 'HIRE', person }, { autosave: true, message: `${person.name} entrou no efetivo.`, tone: 'success' }); return;
  }
  if (action === 'select-room') {
    ui.selectedRoom = ui.selectedRoom === target.dataset.room ? null : target.dataset.room; render(); return;
  }
  if (action === 'place-room') {
    if (!ui.selectedRoom) return;
    const room = (await import('./content.js')).roomCatalog.find(item => item.type === ui.selectedRoom);
    if (commit({ type: 'PLACE_ROOM', payload: { room, x: Number(target.dataset.x), y: Number(target.dataset.y) } }, { autosave: true, message: `${room.name} construída e operacional.`, tone: 'success' })) ui.selectedRoom = null;
    render(); return;
  }
  if (action === 'open-incident') { ui.selectedIncident = target.dataset.id; render(); return; }
  if (action === 'close-modal') { ui.selectedIncident = null; render(); return; }
  if (action === 'spawn-incident') { spawnIncident(state); render(); toast('Nova chamada inserida pela central.', 'alert'); return; }
  if (action === 'dispatch') {
    commit({ type: 'DISPATCH', incidentId: target.dataset.incident, vehicleId: target.dataset.vehicle }, { autosave: true, message: 'Unidade despachada. O deslocamento continua no relógio.', tone: 'success' }); return;
  }
  if (action === 'resolve-incident') {
    const title = state.activeIncidents.find(item => item.id === target.dataset.id)?.title || 'Ocorrência';
    commit({ type: 'RESOLVE_INCIDENT', incidentId: target.dataset.id, choice: target.dataset.choice }, { autosave: true, message: `${title} concluído; efeitos aplicados.`, tone: 'success' }); ui.selectedIncident = null; render(); return;
  }
  if (action === 'case-action') {
    const actions = {
      review: { label: 'Revisão técnica das câmeras', progress: 14, cost: 0 },
      forensics: { label: 'Perícia externa com cadeia de custódia', progress: 22, cost: 18000 },
      interview: { label: 'Entrevistas documentadas no depósito', progress: 17, cost: 0 }
    };
    const item = actions[target.dataset.kind];
    commit({ type: 'CASE_ACTION', payload: item }, { autosave: true, message: `${item.label} concluída.`, tone: 'success' }); return;
  }
  if (action === 'advance-day') {
    state = advanceWorld(state, 1440); render(); await saveGame(state, 1, 'autosave'); ui.hasSave = true;
    toast(`Dia ${state.day + 1} iniciado; eventos e prazos foram atualizados.`, 'success'); return;
  }
  if (action === 'set-speed') { commit({ type: 'SET_SPEED', speed: Number(target.dataset.speed) }); return; }
  if (action === 'quick-save') return quickSave(1);
  if (action === 'save-slot') return quickSave(Number(target.dataset.slot));
  if (action === 'load-slot') return loadSlot(Number(target.dataset.slot));
  if (action === 'export-save') { exportSave(state); toast('Backup JSON preparado para download.', 'success'); }
});

root.addEventListener('change', event => {
  const target = event.target.closest('[data-setting]');
  if (!target) return;
  const key = target.dataset.setting;
  const value = target.type === 'checkbox' ? target.checked : Number(target.value);
  commit({ type: 'UPDATE_SETTINGS', settings: { [key]: value } });
});

document.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    if (ui.selectedIncident) { ui.selectedIncident = null; render(); return; }
    if (state.screen === 'title') return;
    const screen = state.storyStage === 'office' ? 'office' : 'title';
    commit({ type: 'NAVIGATE', screen });
  }
  if (event.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName)) {
    event.preventDefault(); commit({ type: 'SET_SPEED', speed: state.speed ? 0 : 1 });
  }
  if (['1', '2', '3'].includes(event.key)) commit({ type: 'SET_SPEED', speed: [1, 3, 6][Number(event.key) - 1] });
});

function startClock() {
  clearInterval(clockTimer);
  clockTimer = setInterval(() => {
    if (!state.speed || state.storyStage !== 'office' || ['title', 'intro', 'settings', 'saves'].includes(state.screen)) return;
    state = advanceWorld(state, 10 * state.speed);
    render();
  }, 1400);
}

async function boot() {
  await refreshSaves();
  render(); startClock();
  if ('serviceWorker' in navigator && location.protocol.startsWith('http')) navigator.serviceWorker.register('./sw.js').catch(() => {});
}

boot().catch(error => { root.innerHTML = `<main class="fatal-error"><h1>Falha ao iniciar</h1><p>${error.message}</p><button onclick="location.reload()">Tentar novamente</button></main>`; });
