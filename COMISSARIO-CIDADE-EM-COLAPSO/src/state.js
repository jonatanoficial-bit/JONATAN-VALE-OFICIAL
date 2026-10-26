import { candidates, districts, eventTemplates, fixedRooms, people } from './content.js';
import { districtBase, routeBetween } from './routes.js';
import { topics, topicRestriction } from './phone.js';
import { chapters, pendingChapter } from './campaign.js';
import { campaignOutcome, weatherForDay } from './world-detail.js';
import { createCareerState, createDirectorState, startCareer, respondIncomingCall, deferIncomingCall, decideCrisis, authorizeCareerPlan, recordCareerResult } from './career.js';
import { incomingCallTemplates, crisisTemplates } from './crisis-data.js';

export const SCHEMA_VERSION = 4;

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
    version: '1.1.0',
    career: createCareerState(),
    director: createDirectorState(seed),
    incomingCalls: [],
    completedPhoneTopics: [],
    activeCrisis: null,
    sequence: 0,
    campaignDecisions: [],
    caseQueue: [],
    lastFinanceMonth: 0,
    campaignEnding: null,
    weather: weatherForDay(seed, 0),
    news: [],
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
  if(input.career?.status==='dismissed'&&!['NAVIGATE','UPDATE_SETTINGS','DISMISS_TUTORIAL','REPLACE_STATE'].includes(action.type))return input;
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
      if(state.storyStage==='office')startCareer(state);
      return state;
    }
    case 'ACCEPT_SECOND_CALL':
      state.storyStage = 'office'; state.screen = 'office'; state.flags.conditionalAcceptance = true;
      state.objective = 'Estabilize as próximas 72 horas.'; state.tutorialStep = 2;
      addJournal(state, 'Convite aceito sob compromisso de autonomia e transparência.', 'decision');
      startCareer(state);
      return state;
    case 'RESPOND_INCOMING_CALL':
      return respondIncomingCall(state,action.id,action.choiceId)?state:input;
    case 'DEFER_INCOMING_CALL':
      return deferIncomingCall(state,action.id)?state:input;
    case 'CRISIS_DECISION':
      return decideCrisis(state,action.id,action.choiceId)?state:input;
    case 'CAREER_PLAN':
      return authorizeCareerPlan(state,action.plan)?state:input;
    case 'PAY_ARREARS': {
      const amount=Math.min(state.finance.cash,state.finance.arrears||0);
      if(amount<=0)return input;
      state.finance.cash-=amount;state.finance.arrears-=amount;
      state.finance.transactions.unshift({id:'DEBT-'+state.sequence,label:'Regularização de obrigações vencidas',amount:-amount,day:state.day});
      state.finance.transactions=state.finance.transactions.slice(0,80);
      addJournal(state,'Obrigações vencidas regularizadas em '+formatMoney(amount)+'.','finance');return state;
    }
    case 'PHONE_CALL': {
      const { personId, topic, result, effects } = action.payload;
      const knownTopic=topics[personId]?.find(t=>t.id===topic);
      if(knownTopic&&topicRestriction(state,knownTopic))return input;
      const topicKey=personId+':'+topic;
      const firstTime = !state.completedPhoneTopics.includes(topicKey) && !state.phoneLog.some(call => call.personId === personId && call.topic === topic);
      if (effects.cash < 0 && state.finance.cash < -effects.cash) return input;
      if (firstTime) { applyEffects(state, effects); state.completedPhoneTopics.push(topicKey); }
      state.contacts[personId].calls += 1;
      state.contacts[personId].lastContactDay = state.day;
      state.phoneLog.unshift({ id: `CALL-${state.phoneLog.length + 1}`, personId, topic, result, day: state.day, time: state.minutes });
      state.phoneLog=state.phoneLog.slice(0,100);
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
      route.eta = Math.ceil(route.eta * (state.weather?.etaMultiplier || 1));
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
      if (incident.type === 'health') state.city.health = clamp(state.city.health + 3);
      state.activeIncidents.splice(index, 1);
      state.completedIncidents.unshift(incident);
      state.completedIncidents=state.completedIncidents.slice(0,80);
      state.stats.incidentsResolved += 1;
      recordCareerResult(state,'resolved');
      addJournal(state, `${incident.title} resolvido: ${action.choice === 'A' ? template.choiceA : template.choiceB}.`, 'success');
      return state;
    }
    case 'CAMPAIGN_DECISION': {
      const chapter = chapters.find(item => item.id === action.payload?.chapter?.id);
      const choice = chapter?.choices.find(item => item.id === action.payload?.choice?.id);
      if (!chapter || !choice) return input;
      if (pendingChapter(state)?.id!==chapter.id || state.campaignDecisions.some(d=>d.chapterId===chapter.id) || (choice.effects.cash<0 && state.finance.cash < -choice.effects.cash))return input;
      applyEffects(state,choice.effects); if(choice.flag)state.flags[choice.flag]=true;
      state.campaignDecisions.push({chapterId:chapter.id,choiceId:choice.id,title:choice.title,day:state.day});
      state.stats.choices+=1;addJournal(state,`${chapter.title}: ${choice.title}. ${choice.text}`,'decision');
      if (!state.campaignEnding) {
        state.campaignEnding = campaignOutcome(state);
        if (state.campaignEnding) {
          state.campaignEnding.dismissed = true;
          state.objective = 'Primeiro ciclo concluído. O mandato e as avaliações continuam.';
          addJournal(state,`Balanço do primeiro ciclo: ${state.campaignEnding.title}. A carreira continua sem prazo final.`,'career');
        }
      }
      return state;
    }
    case 'CONTINUE_CAMPAIGN':
      if (!state.campaignEnding) return input;
      state.campaignEnding.dismissed = true;
      state.objective = 'Gestão contínua: acompanhe ocorrências, orçamento e compromissos.';
      return state;
    case 'DISMISS_TUTORIAL':
      state.flags.tutorialDismissed = true;
      return state;
    case 'START_CASE_TASK': {
      const task=action.payload;
      const internal=state.buildings.some(b=>b.type==='forensics'&&b.status==='active');
      const cost=internal?Math.round(task.cost*.3):task.cost;
      if(!state.caseFile.assignedDetectives.length || state.caseQueue.some(t=>t.id===task.id)||state.caseFile.actions.includes(task.id)||state.finance.cash<cost)return input;
      state.finance.cash-=cost;
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
      if(action.order==='case'){if(!/investigador|analista|perícia/i.test(person.role))return input;person.status='case';delete person.readyAt;if(!state.caseFile.assignedDetectives.includes(person.id))state.caseFile.assignedDetectives.push(person.id);}
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
      for (const key of ['sound','highContrast','reducedMotion']) {
        if (typeof action.settings?.[key] === 'boolean') state.settings[key] = action.settings[key];
      }
      if (Number.isFinite(action.settings?.fontScale)) state.settings.fontScale = clamp(action.settings.fontScale,1,1.5);
      return state;
    case 'SET_SPEED':
      if(![0,1,3,6].includes(action.speed))return input;
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
  const fail = field => { throw new Error('Save inválido: ' + field + '. O arquivo original não foi alterado.'); };
  const object = (item, field) => {
    if (!item || typeof item !== 'object' || Array.isArray(item)) fail(field);
  };
  let visited = 0;
  function inspect(item, depth = 0) {
    if (++visited > 100000 || depth > 30) fail('estrutura excessiva');
    if (typeof item === 'number' && !Number.isFinite(item)) fail('número não finito');
    if (typeof item === 'string' && item.length > 100000) fail('texto excessivo');
    if (item && typeof item === 'object') {
      for (const key of Object.keys(item)) {
        if (['__proto__', 'prototype', 'constructor'].includes(key)) fail('campo não permitido');
        inspect(item[key], depth + 1);
      }
    }
  }
  object(value, 'documento'); inspect(value);
  if (!Number.isInteger(value.schemaVersion) || value.schemaVersion < 1 || value.schemaVersion > SCHEMA_VERSION) throw new Error('Versão de save incompatível');
  for (const key of ['finance', 'city', 'contacts', 'caseFile']) object(value[key], key);
  const source = structuredClone(value);
  const base = createInitialState(source.seed ?? 25102026);
  const merged = { ...base, ...source };
  for (const key of ['finance', 'city', 'caseFile', 'settings', 'stats', 'flags']) {
    if (source[key] !== undefined) object(source[key], key);
    merged[key] = { ...base[key], ...(source[key] || {}) };
  }
  merged.contacts = { ...base.contacts };
  for (const person of people) {
    if (source.contacts[person.id] !== undefined) object(source.contacts[person.id], 'contato ' + person.id);
    merged.contacts[person.id] = { ...base.contacts[person.id], ...(source.contacts[person.id] || {}) };
  }
  const numeric = (item, key, min = 0, max = Number.MAX_SAFE_INTEGER, integer = false) => {
    if (!Number.isFinite(item[key]) || item[key] < min || item[key] > max || (integer && !Number.isInteger(item[key]))) fail(key);
  };
  const array = (item, key, max = 2000) => {
    if (!Array.isArray(item[key]) || item[key].length > max) fail(key);
  };
  const text = (item, key) => { if (typeof item[key] !== 'string') fail(key); };
  const identifier = (item, key = 'id') => { if (typeof item[key] !== 'string' || !/^[A-Za-z0-9_-]{1,100}$/.test(item[key])) fail('identificador '+key); };
  for (const key of ['staff','fleet','buildings','activeIncidents','completedIncidents','phoneLog','journal','candidatePool','campaignDecisions','caseQueue','promises','history','notifications','news','constructionQueue']) array(merged,key);
  numeric(merged, 'day', 0, 365000, true); numeric(merged, 'minutes', 0, 1439, true);
  numeric(merged, 'seed', 0, 4294967295, true); numeric(merged, 'rngState', 0, 4294967295, true);
  numeric(merged, 'sequence', 0, Number.MAX_SAFE_INTEGER, true);
  numeric(merged, 'garageCapacity', 0, 500, true); numeric(merged, 'lastFinanceMonth', 0, 12167, true);
  numeric(merged, 'operationsReadiness', 0, 100);
  if (![0, 1, 3, 6].includes(merged.speed)) fail('velocidade');
  text(merged, 'screen'); text(merged, 'storyStage'); text(merged, 'objective');
  const screens=['title','intro','office','phone','map','precinct','fleet','staff','case','campaign','report','saves','settings','gallery'];
  if (!screens.includes(merged.screen) || !screens.includes(merged.previousScreen)) fail('tela desconhecida');
  if (!['new','first-call','second-call','intro','office'].includes(merged.storyStage)) fail('etapa narrativa');
  for (const key of ['annualBudget','monthlyRelease','cash','emergencyReserve','payroll','operations','maintenance','buildings','forensics']) numeric(merged.finance,key);
  if (merged.finance.arrears !== undefined) numeric(merged.finance, 'arrears');
  array(merged.finance,'transactions');
  for (const transaction of merged.finance.transactions) { object(transaction,'transação'); text(transaction,'label'); numeric(transaction,'amount',-Number.MAX_SAFE_INTEGER); }
  for (const key of ['security','trust','integrity','health','resilience','morale','stability','politicalPressure']) numeric(merged.city,key,0,100);
  array(merged.city,'districts',5);
  if (merged.city.districts.length !== districts.length || new Set(merged.city.districts.map(item=>item?.id)).size !== districts.length) fail('distritos');
  for (const district of merged.city.districts) {
    object(district,'distrito');
    if (!districts.some(item=>item.id===district.id)) fail('distrito desconhecido');
    for (const key of ['traffic','crime','trust']) numeric(district,key,0,100);
    text(district,'name'); array(district,'poi',100);
  }
  for (const contact of Object.values(merged.contacts)) {
    for (const key of ['trust','respect','goodwill']) numeric(contact,key,0,100);
    numeric(contact,'calls',0,Number.MAX_SAFE_INTEGER,true);
  }
  for (const key of Object.keys(base.stats)) numeric(merged.stats,key,0,Number.MAX_SAFE_INTEGER,true);
  for (const key of ['sound','highContrast','reducedMotion']) if (typeof merged.settings[key] !== 'boolean') fail('preferência '+key);
  numeric(merged.settings,'fontScale',0.9,1.5);
  for (const collection of ['fleet','staff','buildings','candidatePool','activeIncidents','completedIncidents','caseQueue']) {
    const ids = new Set();
    for (const item of merged[collection]) {
      object(item,collection); identifier(item);
      if (ids.has(item.id)) fail('ID repetido em '+collection);
      ids.add(item.id);
    }
  }
  for (const vehicle of merged.fleet) {
    text(vehicle,'name'); text(vehicle,'type'); text(vehicle,'status'); numeric(vehicle,'condition',0,100);
    if (!['available','assigned','ordered','maintenance'].includes(vehicle.status)) fail('situação da viatura');
    if (!['sedan','suv','transport'].includes(vehicle.type)) fail('classe da viatura');
    if (!districtBase[vehicle.districtId]) fail('distrito da viatura');
    if (vehicle.status === 'ordered') numeric(vehicle,'deliveryAt');
    if (vehicle.status === 'maintenance') numeric(vehicle,'readyAt');
  }
  for (const person of [...merged.staff,...merged.candidatePool]) {
    text(person,'name'); text(person,'role'); numeric(person,'salary'); numeric(person,'competence',0,100); numeric(person,'ethics',0,100);
    if (person.fatigue !== undefined) numeric(person,'fatigue',0,100);
  }
  for (const room of merged.buildings) {
    text(room,'name'); text(room,'type'); text(room,'status');
    if (!['active','building'].includes(room.status)) fail('situação da sala');
    numeric(room,'x',0,11,true); numeric(room,'y',0,7,true); numeric(room,'w',1,12,true); numeric(room,'h',1,8,true);
    if (room.x+room.w>12 || room.y+room.h>8) fail('planta');
    if (room.status==='building') numeric(room,'completesAt');
  }
  for (const incident of [...merged.activeIncidents,...merged.completedIncidents]) {
    text(incident,'title'); text(incident,'stage');
    if (!['pending','enroute','onscene','finished'].includes(incident.stage)) fail('etapa da ocorrência');
    if (!eventTemplates.some(item=>item.type===incident.type) || !districtBase[incident.districtId]) fail('ocorrência desconhecida');
    numeric(incident,'severity',1,10); numeric(incident,'progress',0,100);
    numeric(incident,'x',0,100); numeric(incident,'y',0,100);
    if (incident.stage==='enroute') numeric(incident,'eta',1,100000);
    if (incident.route !== undefined) {
      array(incident,'route',100);
      for (const point of incident.route) { object(point,'rota'); numeric(point,'x',0,100); numeric(point,'y',0,100); }
    }
  }
  array(merged.caseFile,'evidence',100); array(merged.caseFile,'actions'); array(merged.caseFile,'assignedDetectives',500);
  numeric(merged.caseFile,'progress',0,100); text(merged.caseFile,'state'); text(merged.caseFile,'title'); text(merged.caseFile,'hypothesis');
  if (merged.caseFile.evidence.length !== 3) fail('evidências');
  for (const evidence of merged.caseFile.evidence) { object(evidence,'evidência'); identifier(evidence); text(evidence,'title'); numeric(evidence,'confidence',0,100); }
  if (merged.caseFile.actions.some(action=>typeof action!=='string')) fail('ações de investigação');
  for (const id of merged.caseFile.assignedDetectives) if (!merged.staff.some(person=>person.id===id)) fail('investigador ausente');
  for (const task of merged.caseQueue) { text(task,'title'); numeric(task,'progress',0,100); numeric(task,'finishesAt'); }
  for (const call of merged.phoneLog) { object(call,'chamada'); if (!merged.contacts[call.personId]) fail('contato desconhecido'); text(call,'topic'); text(call,'result'); }
  for (const entry of merged.journal) { object(entry,'registro'); text(entry,'text'); }
  for (const promise of merged.promises) { object(promise,'compromisso'); text(promise,'text'); numeric(promise,'dueDay'); }
  const decisions = new Set();
  for (const decision of merged.campaignDecisions) {
    object(decision,'decisão');
    const chapter = chapters.find(item=>item.id===decision.chapterId);
    if (!chapter?.choices.some(choice=>choice.id===decision.choiceId) || decisions.has(decision.chapterId)) fail('decisão de campanha');
    decisions.add(decision.chapterId);
  }
  if(source.schemaVersion===1){
    merged.activeIncidents=merged.activeIncidents.map(i=>({...i,spawnAt:merged.day*1440+merged.minutes,deadline:merged.day*1440+i.deadline}));
    merged.sequence=(merged.history?.length||0)+merged.day*100;
    merged.lastFinanceMonth=Math.floor(merged.day/30);
  }
  // Recompute derived weather, but preserve the exact incident random generator.
  merged.weather = weatherForDay(merged.seed,merged.day);
  for (const news of merged.news) { object(news,'notícia'); text(news,'headline'); }
  if (merged.campaignEnding !== null) {
    object(merged.campaignEnding,'final');
    if (!campaignOutcome(merged)) fail('final sem decisões');
    text(merged.campaignEnding,'title'); text(merged.campaignEnding,'summary');
    numeric(merged.campaignEnding,'score',0,100); object(merged.campaignEnding.metrics,'indicadores do final');
    for (const key of ['trust','integrity','health','security']) numeric(merged.campaignEnding.metrics,key,0,100);
    numeric(merged.campaignEnding.metrics,'cash'); numeric(merged.campaignEnding.metrics,'incidentsResolved');
    array(merged.campaignEnding,'decisions',7);
    if (typeof merged.campaignEnding.dismissed !== 'boolean') fail('estado do final');
  } else if (source.schemaVersion < 3) merged.campaignEnding = campaignOutcome(merged);
  if(source.schemaVersion<4){
    merged.career=createCareerState();merged.director=createDirectorState(merged.seed);merged.incomingCalls=[];merged.activeCrisis=null;
    if(merged.storyStage==='office')startCareer(merged,{legacy:true});
    merged.completedPhoneTopics=[...new Set(merged.phoneLog.map(call=>call.personId+':'+call.topic))];
    if(merged.campaignEnding)merged.campaignEnding.dismissed=true;
  }
  object(merged.career,'carreira');object(merged.director,'agenda');
  const career=merged.career,director=merged.director;
  if(!['active','probation','dismissed'].includes(career.status))fail('situação do mandato');
  if(career.startedAt!==null){numeric(career,'startedAt');numeric(career,'nextReviewAt');}
  else if(career.nextReviewAt!==null)fail('agenda antes da posse');
  numeric(career,'score',0,100);numeric(career,'consecutivePoorReviews',0,1000,true);
  for(const key of ['period','totals']){object(career[key],'indicadores de carreira');for(const metric of ['resolved','missed','answeredCalls','missedCalls'])numeric(career[key],metric,0,Number.MAX_SAFE_INTEGER,true);}
  for(const [key,max]of [['reviews',60],['warnings',20],['plans',30],['milestones',100]])array(career,key,max);
  numeric(career,'crisesResolved',0,Number.MAX_SAFE_INTEGER,true);
  if(career.lastPlanAt!==null)numeric(career,'lastPlanAt');
  for(const review of career.reviews){object(review,'avaliação');numeric(review,'at');numeric(review,'score',0,100);text(review,'title');array(review,'reasons',20);if(review.reasons.some(v=>typeof v!=='string'))fail('motivos da avaliação');}
  for(const warning of career.warnings){object(warning,'advertência');text(warning,'title');array(warning,'reasons',20);numeric(warning,'deadline');}
  for(const plan of career.plans){if(!['community','integrity','services'].includes(plan.id)||!['pending','completed'].includes(plan.status))fail('plano de carreira');numeric(plan,'startedAt');numeric(plan,'finishesAt');text(plan,'title');}
  if(career.status==='dismissed'){object(career.dismissal,'demissão');numeric(career.dismissal,'at');text(career.dismissal,'reason');array(career.dismissal,'reasons',20);merged.speed=0;}
  else if(career.dismissal!==null)fail('demissão incompatível com mandato ativo');
  numeric(director,'rngState',0,4294967295,true);numeric(director,'eventCount',0,Number.MAX_SAFE_INTEGER,true);
  for(const key of ['nextIncidentAt','nextCallAt','nextCrisisAt']){if(career.startedAt!==null)numeric(director,key);else if(director[key]!==null)fail('agenda antes da posse');}
  if(director.lastEventAt!==null)numeric(director,'lastEventAt');
  if(director.lastStop!==null){object(director.lastStop,'último aviso');text(director.lastStop,'type');text(director.lastStop,'title');numeric(director.lastStop,'at');}
  object(director.lastTemplates,'pautas já usadas');for(const key of Object.keys(director.lastTemplates))numeric(director.lastTemplates,key);
  array(director,'callHistory',80);array(director,'crisisHistory',24);
  array(merged,'completedPhoneTopics',200);if(merged.completedPhoneTopics.some(v=>typeof v!=='string'))fail('pauta concluída');
  array(merged,'incomingCalls',40);
  let pendingCalls=0;const callIds=new Set();
  for(const call of merged.incomingCalls){
    object(call,'chamada recebida');identifier(call);if(callIds.has(call.id))fail('chamada repetida');callIds.add(call.id);
    const template=incomingCallTemplates.find(t=>t.id===call.templateId);if(!template||call.personId!==template.personId||!['ringing','deferred','answered','missed'].includes(call.status))fail('pauta recebida');
    numeric(call,'arrivedAt');numeric(call,'expiresAt');if(call.status==='deferred')numeric(call,'resumeAt');
    if(['ringing','deferred'].includes(call.status))pendingCalls++;
    call.choices=structuredClone(template.choices);call.title=template.title;call.body=template.body;
    if(call.status==='answered'&&!template.choices.some(c=>c.id===call.choiceId))fail('resposta de chamada');
  }
  if(pendingCalls>1)fail('chamadas simultâneas');
  if(merged.activeCrisis!==null){
    const crisis=merged.activeCrisis;object(crisis,'crise');identifier(crisis);
    const template=crisisTemplates.find(t=>t.id===crisis.templateId);if(!template)fail('crise desconhecida');
    numeric(crisis,'stageIndex',0,template.stages.length-1,true);numeric(crisis,'startedAt');numeric(crisis,'stageArrivedAt');numeric(crisis,'decisionDueAt');
    if(!['decision','waiting'].includes(crisis.status))fail('etapa da crise');if(crisis.status==='waiting'){numeric(crisis,'nextStageAt');if(crisis.stageIndex>=template.stages.length-1)fail('etapa final em espera');}
    const stage=template.stages[crisis.stageIndex];crisis.title=template.title;crisis.scope=template.scope;crisis.stageTitle=stage.title;crisis.description=stage.body;crisis.personId=stage.personId;
    crisis.choices=crisis.status==='decision'?structuredClone(stage.choices):[];array(crisis,'history',template.stages.length);
  }
  merged.version='1.1.0';
  merged.schemaVersion = SCHEMA_VERSION;
  return merged;
}
