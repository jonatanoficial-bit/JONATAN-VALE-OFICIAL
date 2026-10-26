import { eventTemplates } from './content.js';
import { addJournal } from './state.js';
import { currentChapter } from './campaign.js';
import { roadNodes } from './routes.js';
import { updateDailyWorld } from './world-detail.js';
import { processCareer, runDirector, careerBoundaries, signalWorldEvent, recordCareerResult } from './career.js';
const clamp=(v,min=0,max=100)=>Math.max(min,Math.min(max,v));
export const worldTime=s=>s.day*1440+s.minutes;
export function rngStep(rngState){let x=rngState>>>0||0x6d2b79f5;x^=x<<13;x^=x>>>17;x^=x<<5;return{state:x>>>0,value:(x>>>0)/4294967296};}
export function pickDeterministic(list,rngState){const next=rngStep(rngState);return{item:list[Math.floor(next.value*list.length)%list.length],rngState:next.state};}
export function spawnIncident(state,forcedType){
  if(state.activeIncidents.length>=2)return null;
  const recent=state.completedIncidents.slice(0,2).map(i=>i.type);
  const eligible=eventTemplates.filter(e=>!state.activeIncidents.some(i=>i.type===e.type)&&!recent.includes(e.type));
  const picked=pickDeterministic(eligible.length?eligible:eventTemplates,state.rngState);state.rngState=picked.rngState;
  const template=eventTemplates.find(e=>e.type===forcedType)||picked.item;
  const districtPick=pickDeterministic(state.city.districts,state.rngState);state.rngState=districtPick.rngState;
  const district=districtPick.item;
  const nodePick=pickDeterministic(roadNodes.filter(n=>n.districtId===district.id),state.rngState);state.rngState=nodePick.rngState;
  const node=nodePick.item;state.sequence=(state.sequence||0)+1;
  const incident={id:'INC-'+state.sequence,type:template.type,title:template.title,icon:template.icon,severity:template.severity,objective:template.objective,districtId:district.id,nodeId:node.id,x:node.x,y:node.y,stage:'pending',progress:0,spawnDay:state.day,spawnAt:worldTime(state),deadline:worldTime(state)+180};
  state.activeIncidents.push(incident);addJournal(state,district.name+': '+template.title+'.','alert');return incident.id;
}
function processStep(state,step){
  const oldDay=state.day,oldTime=worldTime(state),eventCount=state.director.eventCount;state.minutes+=step;
  while(state.minutes>=1440){state.minutes-=1440;state.day+=1;}
  const now=worldTime(state);
  for(const incident of state.activeIncidents){
    if(incident.stage==='enroute'){
      incident.dispatchedAt??=oldTime;incident.arrivesAt??=oldTime+incident.eta;
      incident.progress=clamp((now-incident.dispatchedAt)/Math.max(1,incident.arrivesAt-incident.dispatchedAt)*100);
      if(incident.progress>=100){incident.stage='onscene';incident.onsceneAt=now;addJournal(state,incident.id+': unidade no local. Decisão de comando disponível.','operation');if(state.director.eventCount===eventCount)signalWorldEvent(state,'arrival',incident.title+': unidade no local');}
    }
    if(incident.stage==='pending'&&now>incident.deadline&&!incident.escalated){incident.escalated=true;state.city.trust=clamp(state.city.trust-2);state.city.security=clamp(state.city.security-2);addJournal(state,incident.id+': atraso de resposta; segurança e confiança −2.','warning');}
    if((incident.stage==='pending'&&now>(incident.spawnAt??oldTime)+720)||(incident.stage==='onscene'&&now>(incident.onsceneAt??now)+720)){
      incident.stage='finished';incident.resolution='missed';state.city.security=clamp(state.city.security-2);
      const v=state.fleet.find(v=>v.id===incident.assignedVehicleId);if(v){v.status='available';delete v.incidentId;}
      state.completedIncidents.unshift(incident);addJournal(state,incident.id+': encerrado com resposta insuficiente; incluído na revisão de serviço.','warning');
      recordCareerResult(state,'missed');
    }
  }
  state.activeIncidents=state.activeIncidents.filter(i=>i.stage!=='finished');state.completedIncidents=state.completedIncidents.slice(0,80);
  for(const v of state.fleet){
    if(v.status==='ordered'&&now>=v.deliveryAt){v.status='available';addJournal(state,v.name+': entrega conferida e ativo liberado.','finance');}
    if(v.status==='maintenance'&&now>=v.readyAt){v.status='available';v.condition=100;addJournal(state,v.name+': manutenção concluída.','success');}
  }
  for(const b of state.buildings){if(b.status==='building'&&now>=b.completesAt){b.status='active';if(b.type==='garage')state.garageCapacity+=b.capacity;addJournal(state,b.name+': obra concluída e setor operacional.','building');}}
  for(const s of state.staff){if(s.readyAt&&now>=s.readyAt){if(s.status==='rest')s.fatigue=clamp(s.fatigue-45);if(s.status==='training')s.competence=clamp(s.competence+5);s.status='available';delete s.readyAt;addJournal(state,s.name+': retorno à disponibilidade.','staff');}}
  if(state.caseFile.assignedDetectives.length){for(const task of state.caseQueue.filter(t=>!t.done&&now>=t.finishesAt)){task.done=true;state.caseFile.progress=clamp(state.caseFile.progress+task.progress);state.caseFile.actions.push(task.id);addJournal(state,'Arquivo Ponte: '+task.title+' concluída; laudo anexado.','case');}}
  else{for(const task of state.caseQueue.filter(t=>!t.done))task.finishesAt+=step;}
  if(state.caseFile.progress>=35){state.caseFile.evidence[1].found=true;state.caseFile.evidence[1].confidence=62;}
  if(state.caseFile.progress>=65){state.caseFile.evidence[2].found=true;state.caseFile.evidence[2].confidence=82;}
  if(state.day!==oldDay){
    updateDailyWorld(state);
    for(const p of state.promises)if(!p.done&&!p.missed&&p.dueDay<state.day){p.missed=true;state.city.politicalPressure=clamp(state.city.politicalPressure+3);addJournal(state,'Compromisso vencido: '+p.text+'; pressão política +3.','warning');}
    const month=Math.floor(state.day/30);
    if(month>state.lastFinanceMonth){
      const release=state.finance.monthlyRelease;
      const expenses=state.finance.payroll+state.finance.operations+state.finance.maintenance+state.finance.buildings+state.finance.forensics;
      state.finance.cash+=release;const paid=Math.min(state.finance.cash,expenses);state.finance.cash-=paid;state.finance.arrears=(state.finance.arrears||0)+expenses-paid;
      state.finance.transactions.unshift({id:'MONTH-'+month,label:'Mês '+(month+1)+': liberação e compromissos',amount:release-paid,day:state.day});
      state.finance.transactions=state.finance.transactions.slice(0,80);
      state.lastFinanceMonth=month;addJournal(state,'Fechamento mensal: liberação US$ '+release.toLocaleString('pt-BR')+'; compromissos US$ '+expenses.toLocaleString('pt-BR')+(expenses>paid?'; saldo insuficiente registrado em obrigações':'')+'.','finance');
    }
    state.objective=currentChapter(state).title+' · acompanhe o turno, a equipe e as próximas avaliações do mandato.';
    state.city.stability=Math.round((state.city.security+state.city.trust+state.city.health+state.city.integrity)/4);
  }
  if(state.director.eventCount===eventCount&&!processCareer(state))runDirector(state,spawnIncident);
}
function operationalBoundaries(s){
  const now=worldTime(s);
  return [...s.activeIncidents.flatMap(i=>[i.arrivesAt,i.deadline+1,(i.spawnAt??now)+721,i.onsceneAt?i.onsceneAt+721:null]),...s.fleet.flatMap(v=>[v.deliveryAt,v.readyAt]),...s.buildings.map(b=>b.completesAt),...s.staff.map(p=>p.readyAt),...s.caseQueue.filter(t=>!t.done&&s.caseFile.assignedDetectives.length).map(t=>t.finishesAt)].filter(t=>Number.isFinite(t)&&t>now);
}
export function advanceWorld(input,tickMinutes=1,{interrupt=false}={}){
  if(!Number.isInteger(tickMinutes)||tickMinutes<0||tickMinutes>1440*365||input.career?.status==='dismissed')return input;
  const state=structuredClone(input);
  const count=state.director.eventCount;
  for(let left=tickMinutes;left>0;){
    const now=worldTime(state),boundary=Math.min(Infinity,...careerBoundaries(state),...operationalBoundaries(state));
    const step=Math.max(1,Math.min(60,left,boundary-now,1440-state.minutes));
    processStep(state,step);left-=step;
    if(state.career.status==='dismissed'||(interrupt&&state.director.eventCount!==count)){if(interrupt)state.speed=0;break;}
  }
  return state;
}
export function simulateDays(input,days=1){let state=structuredClone(input);for(let d=0;d<days;d++)state=advanceWorld(state,1440);return state;}
export function formatGameTime(s){return 'DIA '+(s.day+1)+' · '+String(Math.floor(s.minutes/60)).padStart(2,'0')+':'+String(s.minutes%60).padStart(2,'0');}
