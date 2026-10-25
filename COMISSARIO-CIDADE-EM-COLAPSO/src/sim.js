import { eventTemplates } from './content.js';
import { addJournal } from './state.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));

export function rngStep(rngState) {
  let x = rngState >>> 0 || 0x6d2b79f5;
  x ^= x << 13; x ^= x >>> 17; x ^= x << 5;
  return { state: x >>> 0, value: (x >>> 0) / 4294967296 };
}

export function pickDeterministic(list, rngState) {
  const next = rngStep(rngState);
  return { item: list[Math.floor(next.value * list.length) % list.length], rngState: next.state };
}

export function spawnIncident(state, forcedType) {
  const usedToday = new Set(state.activeIncidents.filter(i => i.spawnDay === state.day).map(i => i.type));
  let eligible = eventTemplates.filter(event => !usedToday.has(event.type));
  if (!eligible.length) eligible = eventTemplates;
  let template;
  if (forcedType) template = eventTemplates.find(item => item.type === forcedType);
  if (!template) {
    const picked = pickDeterministic(eligible, state.rngState);
    template = picked.item; state.rngState = picked.rngState;
  }
  const districtPick = pickDeterministic(state.city.districts, state.rngState);
  state.rngState = districtPick.rngState;
  const district = districtPick.item;
  const number = state.activeIncidents.length + state.completedIncidents.length + 1;
  const id = `INC-${state.day}-${String(number).padStart(3, '0')}`;
  state.activeIncidents.push({
    id, type: template.type, title: template.title, icon: template.icon,
    severity: template.severity, objective: template.objective, districtId: district.id,
    x: district.x + district.w * 0.45, y: district.y + district.h * 0.45,
    stage: 'pending', progress: 0, spawnDay: state.day, deadline: state.minutes + 180
  });
  addJournal(state, `Nova ocorrência em ${district.name}: ${template.title}.`, 'alert');
  return id;
}

export function advanceWorld(input, tickMinutes = 10) {
  const state = structuredClone(input);
  const oldDay = state.day;
  state.minutes += tickMinutes;
  while (state.minutes >= 1440) { state.minutes -= 1440; state.day += 1; }

  for (const incident of state.activeIncidents) {
    if (incident.stage === 'enroute') {
      incident.progress = clamp(incident.progress + Math.max(8, 120 / Math.max(4, incident.eta)));
      if (incident.progress >= 100) {
        incident.progress = 100;
        incident.stage = 'onscene';
        addJournal(state, `${incident.id}: unidade chegou ao local. Escolha a resposta operacional.`, 'operation');
      }
    } else if (incident.stage === 'pending' && state.minutes > incident.deadline) {
      state.city.trust = clamp(state.city.trust - 1);
      state.city.security = clamp(state.city.security - 1);
      incident.deadline += 120;
      addJournal(state, `${incident.id}: resposta atrasada; confiança e segurança −1.`, 'warning');
    }
  }

  if (state.day !== oldDay) {
    state.city.morale = clamp(state.city.morale - 1);
    state.city.politicalPressure = clamp(state.city.politicalPressure + (state.activeIncidents.length > 2 ? 2 : 0));
    for (const employee of state.staff) employee.fatigue = clamp(employee.fatigue + 4);
    for (const promise of state.promises) {
      if (!promise.done && promise.dueDay < state.day) state.city.politicalPressure = clamp(state.city.politicalPressure + 3);
    }
    if (state.day <= 7) spawnIncident(state);
    state.objective = state.day >= 7 ? 'Abra o relatório da primeira semana.' : `Dia ${state.day + 1}: responda às prioridades sem perder legitimidade.`;
    addJournal(state, `Início do Dia ${state.day + 1}. O estado da cidade foi recalculado.`, 'day');
  }
  return state;
}

export function simulateDays(input, days = 1) {
  let state = structuredClone(input);
  for (let day = 0; day < days; day += 1) {
    state = advanceWorld(state, 1440);
    if (!state.activeIncidents.length) spawnIncident(state);
  }
  return state;
}

export function formatGameTime(state) {
  const hours = Math.floor(state.minutes / 60);
  const minutes = state.minutes % 60;
  return `D${state.day + 1} · ${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}
