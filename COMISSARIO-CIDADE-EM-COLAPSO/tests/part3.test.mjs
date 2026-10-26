import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState, migrateState, reducer } from '../src/state.js';
import { advanceWorld, spawnIncident, worldTime } from '../src/sim.js';
import { chapters, caseTasks, additionalRooms } from '../src/campaign.js';
import { roomCatalog } from '../src/content.js';
import { campaignOutcome, weatherForDay } from '../src/world-detail.js';

test('clima diário é determinístico e chuva afeta ETA sem consumir RNG', () => {
  assert.deepEqual(weatherForDay(123, 25), weatherForDay(123, 25));
  const state = createInitialState(123);
  spawnIncident(state, 'traffic');
  state.weather.etaMultiplier = 1;
  const clear = reducer(state, { type: 'DISPATCH', incidentId: state.activeIncidents[0].id, vehicleId: 'V-001' });
  state.weather.etaMultiplier = 1.3;
  const rain = reducer(state, { type: 'DISPATCH', incidentId: state.activeIncidents[0].id, vehicleId: 'V-001' });
  assert.ok(rain.activeIncidents[0].eta > clear.activeIncidents[0].eta);
  assert.equal(rain.rngState, clear.rngState);
});

test('obra só libera vagas após prazo e nunca aplica capacidade duas vezes', () => {
  const state = createInitialState(9);
  const room = roomCatalog.find(item=>item.type==='garage');
  let next = reducer(state,{type:'PLACE_ROOM',payload:{room,x:8,y:4}});
  assert.equal(next.garageCapacity,4);
  next = advanceWorld(next,119);
  assert.equal(next.buildings.at(-1).status,'building');
  assert.equal(next.garageCapacity,4);
  next = advanceWorld(next,1);
  assert.equal(next.buildings.at(-1).status,'active');
  assert.equal(next.garageCapacity,8);
  assert.equal(advanceWorld(next,1440).garageCapacity,8);
});

test('manutenção bloqueia despacho e retorna veículo reparado no prazo', () => {
  let state=createInitialState(15);
  spawnIncident(state,'traffic');
  state=reducer(state,{type:'MAINTAIN_VEHICLE',id:'V-001'});
  assert.equal(state.fleet[0].status,'maintenance');
  assert.equal(reducer(state,{type:'DISPATCH',incidentId:state.activeIncidents[0].id,vehicleId:'V-001'}),state);
  state=advanceWorld(state,179);
  assert.equal(state.fleet[0].status,'maintenance');
  state=advanceWorld(state,1);
  assert.equal(state.fleet[0].status,'available');
  assert.equal(state.fleet[0].condition,100);
});

test('investigação pausa sem investigador e respeita custo interno da perícia', () => {
  let state=createInitialState(20);
  state.buildings.push({...additionalRooms.find(item=>item.type==='forensics'),id:'B-LAB',x:8,y:4,status:'active'});
  state.finance.cash=6000;
  const task=caseTasks.find(item=>item.id==='access');
  state=reducer(state,{type:'START_CASE_TASK',payload:task});
  assert.equal(state.finance.cash,600);
  assert.equal(state.caseQueue.length,1);
  const finish=state.caseQueue[0].finishesAt;
  state=reducer(state,{type:'STAFF_ORDER',id:'S-002',order:'rest'});
  state=advanceWorld(state,180);
  assert.equal(state.caseFile.progress,12);
  assert.equal(state.caseQueue[0].finishesAt,finish+180);
  state=reducer(state,{type:'STAFF_ORDER',id:'S-002',order:'case'});
  state=advanceWorld(state,240);
  assert.equal(state.caseFile.progress,40);
  assert.equal(state.caseQueue[0].done,true);
});

test('final usa consequências da última escolha e preserva resultado na gestão contínua', () => {
  let state=createInitialState(41);
  state.day=0;
  state.stats.incidentsResolved=3;
  const choices=['community','dialogue','independent','joint','protection','grant','transparency'];
  for (const [index,chapter] of chapters.entries()) {
    state.day=Math.max(chapter.fromDay,state.campaignDecisions.length?state.campaignDecisions.at(-1).day+2:0);
    assert.equal(state.campaignEnding,null);
    state=reducer(state,{type:'CAMPAIGN_DECISION',payload:{chapter,choice:chapter.choices.find(choice=>choice.id===choices[index])}});
  }
  assert.equal(state.campaignEnding.id,'renewal');
  assert.equal(state.campaignEnding.metrics.trust,state.city.trust);
  assert.equal(state.city.trust,64);
  assert.equal(state.speed,0);
  const ending=structuredClone(state.campaignEnding);
  assert.equal(reducer(state,{type:'CAMPAIGN_DECISION',payload:{chapter:chapters[6],choice:chapters[6].choices[0]}}),state);
  state=reducer(state,{type:'CONTINUE_CAMPAIGN'});
  state=advanceWorld(state,1440);
  assert.equal(state.campaignEnding.dismissed,true);
  assert.deepEqual(state.campaignEnding.metrics,ending.metrics);
  assert.equal(campaignOutcome(createInitialState()),null);
});

test('migração v2 preserva RNG, chamadas, IDs, obras e rejeita objetos malformados sem mutação', () => {
  const source=createInitialState(52);
  source.schemaVersion=2;
  delete source.weather; delete source.news; delete source.campaignEnding;
  const original=JSON.stringify(source);
  const migrated=migrateState(source);
  assert.equal(migrated.schemaVersion,4);
  assert.equal(migrated.rngState,source.rngState);
  assert.deepEqual(migrated.fleet,source.fleet);
  assert.equal(JSON.stringify(source),original);
  for (const change of [
    value=>value.contacts.P07.trust='alto',
    value=>value.caseFile.evidence=[],
    value=>value.caseFile.evidence.push({...value.caseFile.evidence[0],id:'E4'}),
    value=>value.screen='unknown',
    value=>value.storyStage='unknown',
    value=>value.fleet[0].id='x\" onclick=alert(1)',
    value=>value.staff[0].salary=-100,
    value=>value.minutes=Infinity,
    value=>value.finance.transactions=[{label:'Inválida',amount:'x'}]
  ]) { const bad=structuredClone(source);change(bad);assert.throws(()=>migrateState(bad),/Save inválido/); }
  const poisoned=JSON.parse(original);
  poisoned.flags=JSON.parse('{"__proto__":{"polluted":true}}');
  assert.throws(()=>migrateState(poisoned),/campo não permitido/);
});

test('preferências aceitam 150% e limitam escala ou tipos inválidos', () => {
  const state=createInitialState(23);
  const large=reducer(state,{type:'UPDATE_SETTINGS',settings:{fontScale:4,sound:'false',reducedMotion:true}});
  assert.equal(large.settings.fontScale,1.5);
  assert.equal(large.settings.sound,true);
  assert.equal(large.settings.reducedMotion,true);
  assert.equal(reducer(large,{type:'UPDATE_SETTINGS',settings:{fontScale:NaN}}).settings.fontScale,1.5);
});

test('rotação normal recupera fadiga e notícias são limitadas a 30 dias', () => {
  const start=createInitialState(87);
  start.staff[0].fatigue=90;
  const end=advanceWorld(start,40*1440);
  assert.ok(end.staff[0].fatigue<start.staff[0].fatigue);
  assert.equal(end.news.length,30);
  assert.equal(end.news[0].day,40);
  assert.deepEqual(end.weather,weatherForDay(87,40));
});

test('economia e migração: 100 seeds por 365 dias e compromissos sequenciais', () => {
  for(let seed=1;seed<=100;seed++) {
    const initial=createInitialState(seed);
    initial.promises.push({id:'PR-STRESS',text:'Compromisso de teste',dueDay:2,done:false});
    let state=advanceWorld(initial,365*1440);
    assert.equal(state.day,365);
    assert.equal(worldTime(state),365*1440+initial.minutes);
    assert.equal(state.lastFinanceMonth,12);
    assert.equal(state.finance.transactions.filter(item=>item.id.startsWith('MONTH-')).length,12);
    assert.equal(state.promises[0].missed,true);
    assert.equal(state.city.politicalPressure,65);
    assert.ok(state.activeIncidents.length<=5);
    assert.ok(state.completedIncidents.length<=80);
    assert.ok(state.journal.length<=120);
    assert.ok(state.finance.cash>=0);
    assert.equal(state.phoneLog.length,0);
    assert.equal(state.campaignEnding,null);
    assert.doesNotThrow(()=>migrateState(state));
    for(const chapter of chapters){state.day=Math.max(state.day,chapter.fromDay,state.campaignDecisions.length?state.campaignDecisions.at(-1).day+2:0);state=reducer(state,{type:'CAMPAIGN_DECISION',payload:{chapter,choice:chapter.choices.find(choice=>!(choice.effects.cash<0))||chapter.choices[0]}});}
    assert.ok(state.campaignEnding,`seed ${seed}: final acessível após sete decisões`);
  }
});
