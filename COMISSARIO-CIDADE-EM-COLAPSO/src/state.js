import { candidates, districts, eventTemplates, fixedRooms, people } from './content.js';
import { districtBase, routeBetween } from './routes.js';
import { topics, topicRestriction } from './phone.js';

export const SCHEMA_VERSION = 2;

export function createInitialState(seed = 25102026) {
  const contacts = Object.fromEntries(people.map((person, index) => [person.id, {
    trust: person.id === 'P07' ? 45 : Math.max(38, 64 - index * 2),
    respect: person.id === 'P01' ? 70 : 50,
    goodwill: 52,
    lastContactDay: null,
    calls: 0
  }]));
  return {
    schemaVersion: SCHEMA_VERSION,
    version: '0.2.0',
    sequence: 0,
    campaignDecisions: [],
    caseQueue: [],
    lastFinanceMonth: 0,
    seed: seed >>> 0,
    rngState: seed >>> 0,
    screen: 'title',
    previousScreen: 'office',
    storyStage: 'new',
    day: 0,
    minutes: 137,
    speed: 0,
    objective: 'Atenda à ligação do prefeito Allan Thompson.',
    tutorialStep: 0,
    flags: {},
    finance: {
      annualBudget: 36000000,
      monthlyRelease: 3000000,
      cash: 2200000,
      emergencyReserve: 800000,
      payroll: 1450000,
      operations: 620000,
      maintenance: 210000,
      buildings: 180000,
      forensics: 120000,
      transactions: []
    },
    city: {
      security: 48,
      trust: 47,
      integrity: 55,
      health: 61,
      resilience: 49,
      morale: 58,
      stability: 50,
      politicalPressure: 62,
      districts: districts.map(item => ({ ...item }))
    },
    operationsReadiness: 45,
    contacts,
    phoneLog: [],
    promises: [],
    fleet: [
      { id: 'V-001', type: 'sedan', name: 'Sedan 01', status: 'available', districtId: 'manhattan', condition: 81, eta: 8, upkeep: 900 },
      { id: 'V-002', type: 'suv', name: 'SUV 01', status: 'available', districtId: 'brooklyn', condition: 74, eta: 6, upkeep: 1450 }
    ],
    staff: [
      { id: 'S-001', name: 'Aisha Turner', role: 'Patrulheira', salary: 6200, competence: 74, ethics: 91, fatigue: 22, shift: 'A', status: 'available' },
      { id: 'S-002', name: 'Miguel Santos', role: 'Investigador', salary: 8400, competence: 79, ethics: 85, fatigue: 31, shift: 'B', status: 'case' },
      { id: 'S-003', name: 'Hannah Lee', role: 'Operadora de despacho', salary: 5900, competence: 83, ethics: 88, fatigue: 18, shift: 'C', status: 'available' }
    ],
    candidatePool: candidates.map(item => ({ ...item })),
    buildings: fixedRooms.map((room, index) => ({ ...room, id: `B-FIX-${index + 1}`, status: 'active', level: 1 })),
    constructionQueue: [],
    garageCapacity: 4,
    activeIncidents: [],
    completedIncidents: [],
    caseFile: {
      id: 'CASE-PONTE-01',
      title: 'Arquivo Ponte',
      state: 'open',
      progress: 12,
      evidence: [
        { id: 'E1', title: 'Câmera incompleta', confidence: 38, found: true },
        { id: 'E2', title: 'Placas inconsistentes', confidence: 0, found: false },
        { id: 'E3', title: 'Controle de acesso', confidence: 0, found: false }
      ],
      hypothesis: 'Roubo coordenado de remessas',
      assignedDetectives: ['S-002'],
      actions: []
    },
    journal: [{ id: 'J-000', day: 0, time: 137, text: '02:17 — uma cidade em crise aguarda sua decisão.', tone: 'info' }],
    notifications: [],
    history: [],
    settings: { sound: true, highContrast: false, reducedMotion: false, fontScale: 1 },
    stats: { choices: 0, calls: 0, purchases: 0, hires: 0, rooms: 0, incidentsResolved: 0 },
    lastSavedAt: null
  };
}

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const copy = state => structuredClone(state);

export function addJournal(state, text, tone = 'info') {
  state.sequence = (state.sequence || 0) + 1;
  state.journal.unshift({ id: `J-${state.sequence}`, day: state.day, time: state.minutes, text, tone });
  state.journal = state.journal.slice(0, 120);
}

export function applyEffects(state, effects = {}) {
  if (effects.cash) state.finance.cash += effects.cash;
  if (effects.trust) state.city.trust = clamp(state.city.trust + effects.trust);
  if (effects.security) state.city.security = clamp(state.city.security + effects.security);
  if (effects.integrity) state.city.integrity = clamp(state.city.integrity + effects.integrity);
  if (effects.morale) state.city.morale = clamp(state.city.morale + effects.morale);
  if (effects.politicalPressure) state.city.politicalPressure = clamp(state.city.politicalPressure + effects.politicalPressure);
  if (effects.operationsReadiness) state.operationsReadiness = clamp(state.operationsReadiness + effects.operationsReadiness);
  if (effects.mayorTrust) state.contacts.P07.trust = clamp(state.contacts.P07.trust + effects.mayorTrust);
  if (effects.caseProgress) state.caseFile.progress = clamp(state.caseFile.progress + effects.caseProgress);
  if (effects.health) state.city.health = clamp(state.city.health + effects.health);
  if (effects.respect) state.contacts.P07.respect = clamp(state.contacts.P07.respect + effects.respect);
  if (effects.fulfillPromises) state.promises.forEach(p => { p.done = true; });
  if (effects.promise && !state.promises.some(p => p.text === effects.promise && !p.done)) {
    state.promises.push({ id: `PR-${state.promises.length + 1}`, text: effects.promise, dueDay: state.day + 2, done: false });
  }
  for (const key of ['stateRequest', 'stateAuthorized', 'federalNexus', 'guardBriefed', 'federalBriefed', 'fbiBriefed']) {
    if (effects[key]) state.flags[key] = true;
  }
}

export function reducer(input, action) {
  const state = copy(input);
  state.history.push({ at: Date.now(), day: state.day, type: action.type, payload: action.payload || null });
  state.history = state.history.slice(-250);
  switch (action.type) {
    case 'SET_STORY_STAGE':
      state.storyStage = action.stage;
      if (action.screen) state.screen = action.screen;
      return state;
    case 'NAVIGATE':
      state.previousScreen = state.screen;
      state.screen = action.screen;
      return state;
    case 'OPENING_CHOICE': {
      applyEffects(state, action.choice.effects);
      state.flags[action.choice.effects.flag] = true;
      state.storyStage = action.choice.id === 'refuse' ? 'second-call' : 'office';
      state.screen = action.choice.id === 'refuse' ? 'intro' : 'office';
      state.objective = action.choice.id === 'refuse' ? 'Responda à segunda ligação antes do amanhecer.' : 'Estabilize as próximas 72 horas.';
      state.tutorialStep = action.choice.id === 'refuse' ? 1 : 2;
      state.stats.choices += 1;
      addJournal(state, `Pacto inicial: ${action.choice.title}.`, 'decision');
      return state;
    }
    case 'ACCEPT_SECOND_CALL':
      state.storyStage = 'office'; state.screen = 'office'; state.flags.conditionalAcceptance = true;
      state.objective = 'Estabilize as próximas 72 horas.'; state.tutorialStep = 2;
      addJournal(state, 'Convite aceito sob compromisso de autonomia e transparência.', 'decision');
      return state;
    case 'PHONE_CALL': {
      const { personId, topic, result, effects } = action.payload;
      const knownTopic=topics[personId]?.find(t=>t.id===topic);
      if(knownTopic&&topicRestriction(state,knownTopic))return input;
      const firstTime = !state.phoneLog.some(call => call.personId === personId && call.topic === topic);
      if (effects.cash < 0 && state.finance.cash < -effects.cash) return input;
      if (firstTime) applyEffects(state, effects);
      state.contacts[personId].calls += 1;
      state.contacts[personId].lastContactDay = state.day;
      state.phoneLog.unshift({ id: `CALL-${state.phoneLog.length + 1}`, personId, topic, result, day: state.day, time: state.minutes });
      if (firstTime) state.contacts[personId].trust = clamp(state.contacts[personId].trust + 1);
      state.stats.calls += 1;
      addJournal(state, `Ligação — ${topic}: ${firstTime ? result : 'A pauta já foi registrada; nenhum efeito foi aplicado novamente.'}`, 'phone');
      return state;
    }
    case 'PURCHASE': {
      const item = action.item;
      if (!item || state.finance.cash < item.price || state.fleet.length >= state.garageCapacity) return input;
      const number = state.fleet.length + 1;
      state.finance.cash -= item.price;
      state.finance.maintenance += item.upkeep;
      state.fleet.push({ id: `V-${String(number).padStart(3, '0')}`, type: item.type, name: `${item.name} ${number}`, status: 'ordered', deliveryAt: state.day*1440+state.minutes+60, districtId: 'manhattan', condition: 100, eta: item.eta, upkeep: item.upkeep });
      state.finance.transactions.unshift({ id: `TX-${Date.now()}`, label: item.name, amount: -item.price, day: state.day });
      state.stats.purchases += 1;
      addJournal(state, `${item.name} adquirido por ${formatMoney(item.price)}. Ativo V-${String(number).padStart(3, '0')} criado.`, 'finance');
      return state;
    }
    case 'HIRE': {
      const person = action.person;
      if (!person || !state.candidatePool.some(c => c.id === person.id) || state.finance.cash < person.salary*.25) return input;
      const id = `S-${String(state.staff.length + 1).padStart(3, '0')}`;
      state.staff.push({ ...person, id, fatigue: 0, status: 'available' });
      state.candidatePool = state.candidatePool.filter(c => c.id !== person.id);
      state.finance.payroll += person.salary;
      state.finance.cash -= Math.round(person.salary*.25);
      state.stats.hires += 1;
      addJournal(state, `${person.name} contratado(a) como ${person.role}; folha mensal +${formatMoney(person.salary)}.`, 'staff');
      return state;
    }
    case 'PLACE_ROOM': {
      const { room, x, y } = action.payload;
      if (state.finance.cash < room.cost || collides(state.buildings, x, y, room.w, room.h)) return input;
      state.finance.cash -= room.cost;
      state.finance.buildings += Math.round(room.cost * 0.014);
      const placed = { ...room, id: `B-${state.buildings.length + 1}`, x, y, status: 'building', completesAt: state.day*1440+state.minutes+(room.buildMinutes||120), level: 1 };
      state.buildings.push(placed);
      state.stats.rooms += 1;
      addJournal(state, `${room.name}: obra autorizada no setor ${x + 1}.${y + 1}; benefício após conclusão.`, 'building');
      return state;
    }
    case 'DISPATCH': {
      const incident = state.activeIncidents.find(i => i.id === action.incidentId);
      const vehicle = state.fleet.find(v => v.id === action.vehicleId);
      if (!incident || !vehicle || vehicle.status !== 'available' || incident.stage !== 'pending') return input;
      if(vehicle.condition < 25)return input;
      const district = state.city.districts.find(d=>d.id===incident.districtId);
      const route=routeBetween(vehicle.nodeId||districtBase[vehicle.districtId],incident.nodeId||districtBase[incident.districtId],district.traffic);
      incident.assignedVehicleId = vehicle.id;
      incident.stage = 'enroute';
      incident.progress = 0;
      incident.eta = route.eta;
      incident.route=route.points;
      incident.dispatchedAt=state.day*1440+state.minutes;
      incident.arrivesAt=incident.dispatchedAt+incident.eta;
      vehicle.status = 'assigned';
      vehicle.incidentId = incident.id;
      addJournal(state, `${vehicle.name} despachado para ${incident.title}; ETA ${incident.eta} min.`, 'operation');
      return state;
    }
    case 'INCIDENT_PROGRESS': {
      const incident = state.activeIncidents.find(i => i.id === action.incidentId);
      if (!incident || !['enroute', 'onscene'].includes(incident.stage)) return input;
      incident.progress = clamp((incident.progress || 0) + action.amount);
      if (incident.progress >= 100) incident.stage = 'onscene';
      return state;
    }
    case 'RESOLVE_INCIDENT': {
      const index = state.activeIncidents.findIndex(i => i.id === action.incidentId);
      if (index < 0) return input;
      const incident = state.activeIncidents[index];
      if (incident.stage !== 'onscene') return input;
      incident.stage = 'finished'; incident.resolution = action.choice; incident.resolvedDay = state.day;
      const vehicle = state.fleet.find(v => v.id === incident.assignedVehicleId);
      if (vehicle) { vehicle.status = 'available'; vehicle.districtId=incident.districtId; vehicle.nodeId=incident.nodeId||districtBase[incident.districtId]; delete vehicle.incidentId; vehicle.condition = clamp(vehicle.condition - incident.severity * 2); }
      const template = eventTemplates.find(e => e.type === incident.type);
      state.city.trust = clamp(state.city.trust + (action.choice === 'A' ? template.trust : Math.max(0, template.trust - 1)));
      state.city.security = clamp(state.city.security + (action.choice === 'B' ? template.security + 1 : template.security));
      state.activeIncidents.splice(index, 1);
      state.completedIncidents.unshift(incident);
      state.completedIncidents=state.completedIncidents.slice(0,80);
      state.stats.incidentsResolved += 1;
      addJournal(state, `${incident.title} resolvido: ${action.choice === 'A' ? template.choiceA : template.choiceB}.`, 'success');
      return state;
    }
    case 'CAMPAIGN_DECISION': {
      const {chapter,choice}=action.payload;
      if (state.day<chapter.fromDay || state.campaignDecisions.some(d=>d.chapterId===chapter.id) || (choice.effects.cash<0 && state.finance.cash < -choice.effects.cash))return input;
      applyEffects(state,choice.effects); if(choice.flag)state.flags[choice.flag]=true;
      state.campaignDecisions.push({chapterId:chapter.id,choiceId:choice.id,title:choice.title,day:state.day});
      state.stats.choices+=1;addJournal(state,`${chapter.title}: ${choice.title}. ${choice.text}`,'decision');return state;
    }
    case 'START_CASE_TASK': {
      const task=action.payload;
      if(!state.caseFile.assignedDetectives.length || state.caseQueue.some(t=>t.id===task.id)||state.caseFile.actions.includes(task.id)||state.finance.cash<task.cost)return input;
      const internal=state.buildings.some(b=>b.type==='forensics'&&b.status==='active');
      state.finance.cash-=internal?Math.round(task.cost*.3):task.cost;
      state.caseQueue.push({...task,finishesAt:state.day*1440+state.minutes+task.duration});
      addJournal(state,`Arquivo Ponte: ${task.title} em andamento.`,'case');return state;
    }
    case 'CASE_HYPOTHESIS': {
      if(state.caseFile.progress<90 || state.caseFile.state==='reviewed')return input;
      if(action.hypothesis==='internal'){state.caseFile.state='reviewed';state.caseFile.hypothesis='Fraude interna conectada às remessas';state.city.integrity=clamp(state.city.integrity+6);state.flags.federalNexus=true;addJournal(state,'Arquivo Ponte encaminhado com cadeia de custódia e hipótese fundamentada.','success');}
      else{state.city.trust=clamp(state.city.trust-3);addJournal(state,'Revisão recusou a conclusão: ela não explica o controle de acesso.','warning');}return state;
    }
    case 'MAINTAIN_VEHICLE': {
      const v=state.fleet.find(v=>v.id===action.id);const internal=state.buildings.some(b=>b.type==='maintenance'&&b.status==='active');const cost=internal?4500:9000;
      if(!v||v.status!=='available'||state.finance.cash<cost)return input;
      state.finance.cash-=cost;v.status='maintenance';v.readyAt=state.day*1440+state.minutes+(internal?90:180);addJournal(state,`${v.name} em manutenção preventiva; custo ${formatMoney(cost)}.`,'finance');return state;
    }
    case 'STAFF_ORDER': {
      const person=state.staff.find(s=>s.id===action.id);if(!person)return input;
      if(action.order==='case'){if(!/investigador|analista|perícia/i.test(person.role))return input;person.status='case';if(!state.caseFile.assignedDetectives.includes(person.id))state.caseFile.assignedDetectives.push(person.id);}
      if(action.order==='rest'){person.status='rest';person.readyAt=state.day*1440+state.minutes+240;state.caseFile.assignedDetectives=state.caseFile.assignedDetectives.filter(id=>id!==person.id);}
      if(action.order==='train'){if(!state.buildings.some(b=>b.type==='training'&&b.status==='active'))return input;person.status='training';person.readyAt=state.day*1440+state.minutes+240;state.caseFile.assignedDetectives=state.caseFile.assignedDetectives.filter(id=>id!==person.id);}
      addJournal(state,`${person.name}: ordem de ${action.order==='rest'?'descanso':action.order==='train'?'treinamento':'investigação'} registrada.`,'staff');return state;
    }
    case 'CASE_ACTION': {
      const cost = action.payload.cost || 0;
      if (state.finance.cash < cost) return input;
      state.finance.cash -= cost;
      state.caseFile.progress = clamp(state.caseFile.progress + action.payload.progress);
      state.caseFile.actions.push(action.payload.label);
      if (state.caseFile.progress >= 38) state.caseFile.evidence[1].found = true, state.caseFile.evidence[1].confidence = 62;
      if (state.caseFile.progress >= 68) state.caseFile.evidence[2].found = true, state.caseFile.evidence[2].confidence = 78;
      if (state.caseFile.progress >= 100) state.caseFile.state = 'ready-for-review';
      addJournal(state, `Arquivo Ponte: ${action.payload.label} (+${action.payload.progress}% de progresso).`, 'case');
      return state;
    }
    case 'UPDATE_SETTINGS':
      state.settings = { ...state.settings, ...action.settings };
      return state;
    case 'SET_SPEED':
      state.speed = action.speed;
      return state;
    case 'REPLACE_STATE':
      return copy(action.state);
    default:
      return input;
  }
}

export function collides(buildings, x, y, w, h) {
  if (x < 0 || y < 0 || x + w > 12 || y + h > 8) return true;
  return buildings.some(b => x < b.x + b.w && x + w > b.x && y < b.y + b.h && y + h > b.y);
}

export function formatMoney(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'USD', currencyDisplay: 'narrowSymbol', maximumFractionDigits: 0 }).format(value).replace('$', 'US$ ');
}

export function migrateState(value) {
  if (!value || typeof value !== 'object') throw new Error('Save inválido');
  if (!Number.isFinite(value.schemaVersion) || value.schemaVersion > SCHEMA_VERSION) throw new Error('Versão de save incompatível');
  const base = createInitialState(value.seed || 25102026);
  const merged = { ...base, ...value, settings: { ...base.settings, ...(value.settings || {}) } };
  for(const key of ['staff','fleet','buildings','activeIncidents','completedIncidents','phoneLog','journal','candidatePool','campaignDecisions','caseQueue'])if(!Array.isArray(merged[key]))throw new Error('Save inválido: '+key);
  if(!Number.isFinite(merged.finance?.cash)||!Number.isFinite(merged.day)||!Number.isFinite(merged.rngState))throw new Error('Save inválido: números inconsistentes');
  if(merged.day<0||merged.minutes<0||merged.minutes>=1440||merged.finance.cash<0)throw new Error('Save inválido: relógio ou orçamento');
  if(value.schemaVersion===1){
    merged.activeIncidents=merged.activeIncidents.map(i=>({...i,spawnAt:merged.day*1440+merged.minutes,deadline:merged.day*1440+i.deadline}));
    merged.sequence=(merged.history?.length||0)+merged.day*100;
    merged.lastFinanceMonth=Math.floor(merged.day/30);
  }
  merged.version='0.2.0';
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}
