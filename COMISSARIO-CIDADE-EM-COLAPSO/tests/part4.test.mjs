import test from 'node:test';
import assert from 'node:assert/strict';
import { createInitialState,reducer,migrateState } from '../src/state.js';
import { openingChoices } from '../src/content.js';
import { advanceWorld,worldTime } from '../src/sim.js';
import { evaluateCareer } from '../src/career.js';
import { pendingChapter } from '../src/campaign.js';
import { renderApp } from '../src/render.js';
import { crisisTemplates,incomingCallTemplates } from '../src/crisis-data.js';

const start=seed=>reducer(createInitialState(seed),{type:'OPENING_CHOICE',choice:openingChoices[0]});
function answer(s){const c=s.incomingCalls.find(c=>c.status==='ringing');return c?reducer(s,{type:'RESPOND_INCOMING_CALL',id:c.id,choiceId:c.choices.find(x=>s.finance.cash+(x.effects.cash||0)>=0).id}):s;}

test('posse sem eventos; primeira chamada e ocorrência têm horários separados',()=>{
 let s=start(13);assert.equal(s.minutes,480);assert.equal(s.activeIncidents.length,0);assert.equal(s.incomingCalls.length,0);assert.equal(s.activeCrisis,null);
 s=advanceWorld(s,480,{interrupt:true});assert.equal(s.minutes,500);assert.equal(s.speed,0);assert.equal(s.incomingCalls[0].status,'ringing');assert.equal(s.activeIncidents.length,0);
 const callAt=worldTime(s);s=answer(s);s=advanceWorld(s,480,{interrupt:true});
 assert.equal(s.activeIncidents.length,1);assert.ok(s.activeIncidents[0].spawnAt>callAt);assert.ok(s.activeIncidents[0].spawnAt-callAt>=20);
});

test('retomar um save mantém RNG e próximos horários; legado recebe intervalo seguro',()=>{
 let s=answer(advanceWorld(start(88),100,{interrupt:true}));const restored=migrateState(JSON.parse(JSON.stringify(s)));
 assert.deepEqual(restored.director,s.director);assert.deepEqual(advanceWorld(restored,480,{interrupt:true}),advanceWorld(s,480,{interrupt:true}));
 const old=structuredClone(s);old.schemaVersion=3;delete old.career;delete old.director;delete old.incomingCalls;delete old.activeCrisis;
 const migrated=migrateState(old);assert.equal(migrated.rngState,old.rngState);assert.equal(migrated.minutes,old.minutes);assert.deepEqual(migrated.fleet,old.fleet);assert.ok(migrated.director.nextCallAt>worldTime(migrated));assert.ok(migrated.director.nextIncidentAt>worldTime(migrated));
 const bad=structuredClone(restored);bad.director.nextIncidentAt='amanhã';assert.throws(()=>migrateState(bad),/Save inválido/);
});

test('adiar ligação agenda retorno; responder não repete o benefício',()=>{
 let s=advanceWorld(start(6),20,{interrupt:true});const id=s.incomingCalls[0].id,choice=s.incomingCalls[0].choices[0].id;
 s=reducer(s,{type:'DEFER_INCOMING_CALL',id});const resume=s.incomingCalls[0].resumeAt;
 s=advanceWorld(s,120);assert.equal(worldTime(s),resume);assert.equal(s.incomingCalls[0].status,'ringing');
 s=reducer(s,{type:'RESPOND_INCOMING_CALL',id,choiceId:choice});assert.equal(s.incomingCalls[0].status,'answered');assert.equal(reducer(s,{type:'RESPOND_INCOMING_CALL',id,choiceId:choice}),s);
});

test('crises têm etapas temporizadas e apenas uma situação maior em curso',()=>{
 let s=start(43);s.day=15;s.minutes=600;s.director.nextCallAt=worldTime(s)+99999;s.director.nextIncidentAt=worldTime(s)+99999;s.director.nextCrisisAt=worldTime(s)+1;
 s=advanceWorld(s,50,{interrupt:true});assert.ok(s.activeCrisis);assert.equal(s.activeCrisis.stageIndex,0);
 const id=s.activeCrisis.id,choice=s.activeCrisis.choices[0];s=reducer(s,{type:'CRISIS_DECISION',id,choiceId:choice.id});
 assert.equal(s.activeCrisis.status,'waiting');const due=s.activeCrisis.nextStageAt;assert.ok(due-worldTime(s)>=180);
 s=advanceWorld(s,due-worldTime(s)-1);assert.equal(s.activeCrisis.stageIndex,0);s=advanceWorld(s,1,{interrupt:true});assert.equal(s.activeCrisis.stageIndex,1);assert.equal(s.activeCrisis.id,id);assert.equal(s.speed,0);
 assert.doesNotThrow(()=>migrateState(s));
 const html=renderApp({...s,screen:'campaign'},{});assert.match(html,/live-crisis/);assert.match(html,/crisis-decision/);assert.doesNotMatch(html,/next-chapter/);
});

test('revisões dão advertência e recuperação; demissão exige falhas persistentes',()=>{
 const s=start(12);for(const key of ['trust','security','health','integrity','morale'])s.city[key]=10;
 evaluateCareer(s);assert.equal(s.career.status,'active');assert.equal(s.career.consecutivePoorReviews,1);
 s.day+=30;evaluateCareer(s);assert.equal(s.career.status,'probation');
 for(const key of ['trust','security','health','integrity','morale'])s.city[key]=80;s.day+=30;evaluateCareer(s);assert.equal(s.career.status,'active');assert.equal(s.career.consecutivePoorReviews,0);
 for(const key of ['trust','security','health','integrity','morale'])s.city[key]=10;
 for(let n=0;n<3;n++){s.day+=30;evaluateCareer(s);}assert.equal(s.career.status,'dismissed');assert.ok(s.career.dismissal.reasons.length);assert.equal(advanceWorld(s,1440),s);assert.equal(reducer(s,{type:'CAREER_PLAN',plan:'community'}),s);
 assert.match(renderApp({...s,screen:'campaign'},{}),/dismissal-panel/);assert.doesNotThrow(()=>migrateState(s));
});

test('preparação leva dias e limita novas autorizações a uma por semana',()=>{
 let s=start(7),trust=s.city.trust;s=reducer(s,{type:'CAREER_PLAN',plan:'community'});assert.equal(s.city.trust,trust);
 assert.equal(reducer(s,{type:'CAREER_PLAN',plan:'integrity'}),s);s=advanceWorld(s,2*1440);assert.equal(s.career.plans[0].status,'completed');assert.ok(s.city.trust>trust-10);
});

test('pautas únicas não voltam a pagar após rotação do histórico de chamadas',()=>{
 let s=start(30);const payload={personId:'P07',topic:'grant',result:'Concedido',effects:{cash:100000}};
 s=reducer(s,{type:'PHONE_CALL',payload});s.phoneLog=[];const cash=s.finance.cash;s=reducer(s,{type:'PHONE_CALL',payload});assert.equal(s.finance.cash,cash);
});

function managedRun(seed,days){
 let s=start(seed),target=worldTime(s)+days*1440,iterations=0;
 while(worldTime(s)<target&&s.career.status!=='dismissed'){
  if(++iterations>days*40)assert.fail('Loop de agenda');
  s=answer(s);
  if(s.activeCrisis?.status==='decision'){const c=s.activeCrisis,choice=c.choices.find(x=>s.finance.cash+(x.effects.cash||0)>=0);s=reducer(s,{type:'CRISIS_DECISION',id:c.id,choiceId:choice.id});}
  const chapter=pendingChapter(s);if(chapter)s=reducer(s,{type:'CAMPAIGN_DECISION',payload:{chapter,choice:chapter.choices[0]}});
  for(const inc of [...s.activeIncidents]){
   if(inc.stage==='onscene')s=reducer(s,{type:'RESOLVE_INCIDENT',incidentId:inc.id,choice:'A'});
   else if(inc.stage==='pending'){const v=s.fleet.find(v=>v.status==='available'&&v.condition>=25);if(v)s=reducer(s,{type:'DISPATCH',incidentId:inc.id,vehicleId:v.id});}
  }
  for(const v of [...s.fleet])if(v.status==='available'&&v.condition<45)s=reducer(s,{type:'MAINTAIN_VEHICLE',id:v.id});
  const before=worldTime(s);s=advanceWorld(s,Math.min(480,target-before),{interrupt:true});assert.ok(worldTime(s)>before,'Relógio precisa avançar após decisões');
 }
 assert.equal(s.career.status,'active',`seed ${seed}: uma gestão consistente deve sobreviver`);assert.equal(worldTime(s),target);
 assert.ok(s.activeIncidents.length<=2);assert.ok(s.incomingCalls.length<=40);assert.ok(s.director.crisisHistory.length<=24);assert.ok(s.career.reviews.length<=60);assert.ok(s.journal.length<=120);assert.ok(s.finance.cash>=0);assert.doesNotThrow(()=>migrateState(s));return s;
}

test('carreira gerida atravessa 10 seeds por um ano e cinco anos sem final forçado',()=>{
 for(let seed=1;seed<=10;seed++)managedRun(seed,365);
 const long=managedRun(901,365*5);assert.ok(long.campaignEnding);assert.equal(long.career.status,'active');assert.equal(long.career.reviews.length,60);
});

test('regularizar obrigações reduz a dívida sem criar dinheiro nem repetir pagamentos',()=>{
 let s=start(9);s.finance.cash=10000;s.finance.arrears=15000;
 s=reducer(s,{type:'PAY_ARREARS'});assert.equal(s.finance.cash,0);assert.equal(s.finance.arrears,5000);
 assert.equal(reducer(s,{type:'PAY_ARREARS'}),s);
 s.finance.cash=8000;s=reducer(s,{type:'PAY_ARREARS'});assert.equal(s.finance.cash,3000);assert.equal(s.finance.arrears,0);
});

test('catálogo preserva jurisdição e oferece situações locais, estaduais e federais',()=>{
 assert.ok(crisisTemplates.length>=7);assert.ok(incomingCallTemplates.length>=10);
 for(const scope of ['local','state','federal'])assert.ok(crisisTemplates.some(t=>t.scope===scope));
 for(const c of crisisTemplates){assert.ok(c.stages.length>=3);assert.ok(c.minDay>=7);for(const stage of c.stages){assert.ok(stage.choices.length>=2);assert.ok(stage.body);}}
 const s=start(3),html=renderApp({...s,screen:'campaign'},{});assert.match(html,/career-panel/);assert.doesNotMatch(html,/Próximo marco da campanha/);assert.doesNotMatch(html,/AUDIÊNCIA FINAL/);
});
