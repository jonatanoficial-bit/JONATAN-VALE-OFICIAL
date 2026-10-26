import { crisisTemplates, incomingCallTemplates } from './crisis-data.js';
import { addJournal, applyEffects } from './state.js';

const DAY = 1440;
const clamp = (n, min=0, max=100) => Math.max(min, Math.min(max,n));
export const absoluteTime = s => s.day * DAY + s.minutes;
export const careerPlans = [
  { id:'community', title:'Escuta e prestação de contas', description:'Reuniões de bairro, resposta documentada e acompanhamento dos compromissos.', cost:12000, duration:2*DAY, effects:{trust:7,politicalPressure:-3,mayorTrust:2} },
  { id:'integrity', title:'Revisão independente da gestão', description:'Correção de contratos e práticas, com resultados publicados.', cost:18000, duration:3*DAY, effects:{integrity:8,trust:2,mayorTrust:2} },
  { id:'services', title:'Plano de continuidade dos serviços', description:'Coordenação de turnos e suporte à saúde, sem ampliar a jornada.', cost:20000, duration:2*DAY, effects:{security:5,health:5,morale:4,operationsReadiness:4} }
];

export function createCareerState(){
  return {status:'active',startedAt:null,nextReviewAt:null,score:50,consecutivePoorReviews:0,reviews:[],warnings:[],dismissal:null,plans:[],lastPlanAt:null,crisesResolved:0,period:{resolved:0,missed:0,answeredCalls:0,missedCalls:0},totals:{resolved:0,missed:0,answeredCalls:0,missedCalls:0},milestones:[]};
}
export function createDirectorState(seed){
  return {rngState:((seed>>>0)^0x4a11c06f)>>>0,nextIncidentAt:null,nextCallAt:null,nextCrisisAt:null,lastEventAt:null,lastStop:null,eventCount:0,callHistory:[],crisisHistory:[],lastTemplates:{}};
}
function randomInt(s,min,max){
  let x=s.director.rngState>>>0||0x6d2b79f5;x^=x<<13;x^=x>>>17;x^=x<<5;s.director.rngState=x>>>0;
  return min+Math.floor((s.director.rngState/4294967296)*(max-min+1));
}
function nextWindow(at,start=8,end=21){
  const day=Math.floor(at/DAY),minute=at%DAY;
  return minute<start*60?day*DAY+start*60:minute>=end*60?(day+1)*DAY+start*60:at;
}
export function signalWorldEvent(s,type,title){
  const at=absoluteTime(s);s.director.eventCount+=1;s.director.lastEventAt=at;
  s.director.lastStop={type,title,at,sequence:s.director.eventCount};
}
export function startCareer(s,{legacy=false}={}){
  if(s.career?.startedAt!==null&&s.career?.startedAt!==undefined)return;
  s.career??=createCareerState();s.director??=createDirectorState(s.seed);
  if(!legacy)s.minutes=480;
  const now=absoluteTime(s);
  s.career.startedAt=legacy?0:now;s.career.nextReviewAt=now+30*DAY;
  s.director.nextCallAt=nextWindow(now+20,8,20);
  s.director.nextIncidentAt=nextWindow(now+randomInt(s,60,100),7,23);
  s.director.nextCrisisAt=nextWindow(now+randomInt(s,7,12)*DAY,9,18);
  s.objective='Conheça sua equipe. O primeiro boletim chegará com o passar do tempo.';
  if(!legacy)addJournal(s,'08:00 — início do mandato. A cidade funciona; as demandas chegarão ao longo do turno.','career');
}
export function careerScore(s){
  const city=(s.city.trust+s.city.security+s.city.health)/3;
  const fiscal=s.finance.arrears>0?Math.max(0,70-100*s.finance.arrears/Math.max(1,s.finance.monthlyRelease)):70;
  const p=s.career.period,total=p.resolved+p.missed;
  const response=total?100*p.resolved/total:55;
  return Math.round(clamp(city*.4+s.city.integrity*.25+s.city.morale*.1+fiscal*.1+response*.15));
}
export function evaluateCareer(s){
  const c=s.career,now=absoluteTime(s);if(c.startedAt===null||c.status==='dismissed')return null;
  c.score=careerScore(s);
  const reasons=[];
  if(c.score<38)reasons.push('desempenho geral abaixo do patamar mínimo');
  if(s.city.integrity<25)reasons.push('integridade institucional comprometida');
  if(s.city.trust<22)reasons.push('perda persistente de confiança pública');
  if(s.finance.arrears>s.finance.monthlyRelease)reasons.push('obrigações superiores a uma liberação mensal');
  if(c.period.missed>c.period.resolved+8)reasons.push('ocorrências acumuladas sem resposta de comando');
  const poor=reasons.length>0;
  let outcome='regular',title='Mandato mantido';
  if(poor){
    c.consecutivePoorReviews+=1;
    if(c.consecutivePoorReviews===1){outcome='warning';title='Advertência formal: plano de recuperação exigido';}
    else if(c.consecutivePoorReviews===2){c.status='probation';outcome='probation';title='Mandato sob acompanhamento';}
    else {c.status='dismissed';outcome='dismissal';title='Exoneração do cargo de comissário';s.speed=0;}
  }else{
    c.consecutivePoorReviews=0;
    if(c.status==='probation'){outcome='recovered';title='Plano reconhecido: acompanhamento encerrado';}
    c.status='active';
  }
  const review={id:'REVIEW-'+(Math.floor(now/DAY)),day:s.day,at:now,score:c.score,outcome,title,reasons:reasons.length?reasons:['serviços e indicadores dentro dos requisitos da avaliação'],period:{...c.period}};
  c.reviews.unshift(review);c.reviews=c.reviews.slice(0,60);
  if(poor){c.warnings.unshift({id:review.id,day:s.day,title,reasons:[...reasons],deadline:now+30*DAY});c.warnings=c.warnings.slice(0,20);}
  if(c.status==='dismissed'){
    c.dismissal={at:now,day:s.day,title,reason:'Três avaliações consecutivas com falhas documentadas, após advertência e prazo de recuperação.',reasons:[...reasons],score:c.score,reviewId:review.id};
    s.objective='Mandato encerrado. Revise o relatório, exporte o legado ou inicie outra carreira.';
  }
  c.period={resolved:0,missed:0,answeredCalls:0,missedCalls:0};c.nextReviewAt=now+30*DAY;
  addJournal(s,title+'. '+review.reasons.join('; ')+'.',poor?'warning':'career');signalWorldEvent(s,'review',title);return review;
}
export function recordCareerResult(s,key){
  if(!s.career||s.career.startedAt===null)return;
  s.career.period[key]=(s.career.period[key]||0)+1;s.career.totals[key]=(s.career.totals[key]||0)+1;
}
function eligible(s,template){
  if(s.day<(template.minDay||0))return false;
  if((template.requirements||[]).some(flag=>!s.flags[flag]))return false;
  const last=s.director.lastTemplates[template.id];
  if(template.once&&last!==undefined)return false;
  return last===undefined||absoluteTime(s)-last>=(template.cooldownDays||3)*DAY;
}
function chooseTemplate(s,list){
  const weighted=list.flatMap(item=>Array(Math.max(1,item.weight||1)).fill(item));
  return weighted.length?weighted[randomInt(s,0,weighted.length-1)]:null;
}
function createIncomingCall(s){
  const first=incomingCallTemplates.find(t=>t.id==='first-briefing');
  const initial=first&&s.director.lastTemplates[first.id]===undefined;
  const template=initial?first:chooseTemplate(s,incomingCallTemplates.filter(t=>eligible(s,t)));
  if(!template)return false;
  const now=absoluteTime(s);s.sequence+=1;
  const call={id:'INCOMING-'+s.sequence,templateId:template.id,personId:template.personId,title:template.title,body:template.body,scope:template.scope||'local',choices:template.choices.map(c=>({...c})),status:'ringing',arrivedAt:now,expiresAt:now+(template.expiresMinutes||360),deferred:false};
  s.incomingCalls.unshift(call);s.incomingCalls=s.incomingCalls.slice(0,40);
  s.director.lastTemplates[template.id]=now;
  s.director.callHistory.unshift({id:call.id,templateId:template.id,at:now});s.director.callHistory=s.director.callHistory.slice(0,80);
  s.director.nextCallAt=nextWindow(now+randomInt(s,960,2160),8,20);
  addJournal(s,'Ligação recebida: '+template.title+'.','phone');signalWorldEvent(s,'call',template.title);return true;
}
function applyStage(s,index){
  const crisis=s.activeCrisis,template=crisisTemplates.find(c=>c.id===crisis.templateId),stage=template.stages[index];
  Object.assign(crisis,{stageIndex:index,stageId:stage.id||'stage-'+index,stageTitle:stage.title,description:stage.body||stage.description,personId:stage.personId||'P04',status:'decision',nextStageAt:null,stageArrivedAt:absoluteTime(s),decisionDueAt:absoluteTime(s)+2*DAY,choices:stage.choices.map(c=>({...c}))});
}
function createCrisis(s){
  const pool=crisisTemplates.filter(t=>eligible(s,t));
  const template=chooseTemplate(s,pool);if(!template){s.director.nextCrisisAt=absoluteTime(s)+3*DAY;return false;}
  const now=absoluteTime(s);s.sequence+=1;
  s.activeCrisis={id:'CRISIS-'+s.sequence,templateId:template.id,title:template.title,scope:template.scope,startedAt:now,history:[],stageIndex:0,status:'decision'};
  s.director.lastTemplates[template.id]=now;applyStage(s,0);
  addJournal(s,'Novo acompanhamento '+template.scope+': '+template.title+'.','crisis');signalWorldEvent(s,'crisis',template.title);return true;
}
function closeCrisis(s,missed=false){
  const crisis=s.activeCrisis,now=absoluteTime(s),template=crisisTemplates.find(t=>t.id===crisis.templateId);
  s.director.crisisHistory.unshift({id:crisis.id,templateId:crisis.templateId,title:crisis.title,scope:crisis.scope,startedAt:crisis.startedAt,closedAt:now,missed,history:crisis.history});
  s.director.crisisHistory=s.director.crisisHistory.slice(0,24);
  if(!missed)s.career.crisesResolved+=1;
  s.activeCrisis=null;s.director.nextCrisisAt=nextWindow(now+randomInt(s,Math.max(10,template.cooldownDays||14),Math.max(21,(template.cooldownDays||14)+7))*DAY,9,18);
  addJournal(s,crisis.title+': acompanhamento encerrado; prestação de contas registrada.',missed?'warning':'success');
}
function safeEffects(s,effects){
  if(effects?.cash<0&&s.finance.cash < -effects.cash)return false;
  applyEffects(s,effects);return true;
}
export function respondIncomingCall(s,id,choiceId){
  const call=s.incomingCalls.find(c=>c.id===id);
  if(!call||!['ringing','deferred'].includes(call.status))return false;
  const choice=incomingCallTemplates.find(t=>t.id===call.templateId)?.choices.find(c=>c.id===choiceId);
  if(!choice||!safeEffects(s,choice.effects))return false;
  const now=absoluteTime(s);call.status='answered';call.choiceId=choice.id;call.result=choice.result||choice.title;call.answeredAt=now;
  const contact=s.contacts[call.personId];contact.calls+=1;contact.lastContactDay=s.day;contact.trust=clamp(contact.trust+1);
  s.stats.calls+=1;s.phoneLog.unshift({id:call.id,personId:call.personId,topic:call.templateId,result:call.result,day:s.day,time:s.minutes});s.phoneLog=s.phoneLog.slice(0,100);
  recordCareerResult(s,'answeredCalls');addJournal(s,'Ligação — '+call.title+': '+call.result,'phone');
  s.director.nextCallAt=nextWindow(now+randomInt(s,960,2160),8,20);return true;
}
export function deferIncomingCall(s,id){
  const call=s.incomingCalls.find(c=>c.id===id);
  if(!call||call.status!=='ringing'||call.deferred)return false;
  call.status='deferred';call.deferred=true;call.resumeAt=absoluteTime(s)+120;call.expiresAt+=120;
  addJournal(s,call.title+': retorno combinado para daqui a duas horas de jogo.','phone');return true;
}
export function decideCrisis(s,id,choiceId){
  const crisis=s.activeCrisis;if(!crisis||crisis.id!==id||crisis.status!=='decision')return false;
  const template=crisisTemplates.find(t=>t.id===crisis.templateId),stage=template?.stages[crisis.stageIndex],choice=stage?.choices.find(c=>c.id===choiceId);
  if(!choice||!safeEffects(s,choice.effects))return false;
  crisis.history.push({stageId:crisis.stageId,stageTitle:crisis.stageTitle,choiceId:choice.id,title:choice.title,result:choice.result||choice.title,at:absoluteTime(s)});
  s.stats.choices+=1;addJournal(s,crisis.title+' — '+crisis.stageTitle+': '+(choice.result||choice.title),'decision');
  if(crisis.stageIndex===template.stages.length-1)closeCrisis(s);
  else{crisis.status='waiting';crisis.choices=[];crisis.nextStageAt=absoluteTime(s)+Math.max(180,stage.delayMinutes||DAY);}
  return true;
}
export function authorizeCareerPlan(s,planId){
  const plan=careerPlans.find(p=>p.id===planId),now=absoluteTime(s);
  if(!plan||s.career.startedAt===null||s.career.status==='dismissed'||s.finance.cash<plan.cost||(s.career.lastPlanAt!==null&&now-s.career.lastPlanAt<7*DAY))return false;
  s.finance.cash-=plan.cost;s.career.lastPlanAt=now;
  s.career.plans.unshift({id:plan.id,title:plan.title,startedAt:now,finishesAt:now+plan.duration,status:'pending'});s.career.plans=s.career.plans.slice(0,30);
  addJournal(s,plan.title+': plano autorizado, com resultado após '+(plan.duration/DAY)+' dias.','career');return true;
}
export function processCareer(s){
  if(s.career.startedAt===null||s.career.status==='dismissed')return false;
  const now=absoluteTime(s);
  for(const plan of s.career.plans){if(plan.status==='pending'&&now>=plan.finishesAt){const template=careerPlans.find(p=>p.id===plan.id);applyEffects(s,template.effects);plan.status='completed';addJournal(s,plan.title+': execução concluída e indicadores atualizados.','career');}}
  if(now>=s.career.nextReviewAt){evaluateCareer(s);return true;}
  for(const call of s.incomingCalls){
    if(['ringing','deferred'].includes(call.status)&&now>=call.expiresAt){call.status='missed';s.contacts[call.personId].trust=clamp(s.contacts[call.personId].trust-1);recordCareerResult(s,'missedCalls');addJournal(s,call.title+': contato não retornado no prazo.','warning');}
    else if(call.status==='deferred'&&now>=call.resumeAt){call.status='ringing';signalWorldEvent(s,'call',call.title);return true;}
  }
  const crisis=s.activeCrisis;
  if(crisis){
    if(crisis.status==='waiting'&&now>=crisis.nextStageAt){applyStage(s,crisis.stageIndex+1);addJournal(s,crisis.title+': novo relatório — '+crisis.stageTitle+'.','crisis');signalWorldEvent(s,'crisis-stage',crisis.stageTitle);return true;}
    if(crisis.status==='decision'&&now>=crisis.decisionDueAt){s.city.trust=clamp(s.city.trust-3);s.city.security=clamp(s.city.security-2);addJournal(s,crisis.title+': prazo de decisão vencido; a coordenação registrou omissão de comando.','warning');closeCrisis(s,true);signalWorldEvent(s,'crisis-expired','Prazo de crise encerrado');return true;}
  }
  return false;
}
export function runDirector(s,spawn){
  if(s.career.startedAt===null||s.career.status==='dismissed')return false;
  const d=s.director,now=absoluteTime(s);
  if(d.lastEventAt!==null&&now-d.lastEventAt<20)return false;
  if(now>=d.nextCallAt){
    if(s.incomingCalls.some(c=>['ringing','deferred'].includes(c.status))||s.activeCrisis?.status==='decision')d.nextCallAt=now+180;
    else if(nextWindow(now,8,20)!==now)d.nextCallAt=nextWindow(now,8,20)+randomInt(s,0,45);
    else if(createIncomingCall(s))return true;
    else d.nextCallAt=now+DAY;
  }
  if(now>=d.nextCrisisAt){
    if(s.activeCrisis||s.incomingCalls.some(c=>c.status==='ringing'))d.nextCrisisAt=now+6*60;
    else if(nextWindow(now,9,18)!==now)d.nextCrisisAt=nextWindow(now,9,18);
    else if(createCrisis(s))return true;
  }
  if(now>=d.nextIncidentAt){
    if(s.activeIncidents.length>=2||s.activeCrisis?.status==='decision')d.nextIncidentAt=now+120;
    else if(nextWindow(now,7,23)!==now)d.nextIncidentAt=nextWindow(now,7,23)+randomInt(s,0,45);
    else {
      const id=spawn(s);d.nextIncidentAt=nextWindow(now+randomInt(s,240,720),7,23);
      if(id){signalWorldEvent(s,'incident',s.activeIncidents.find(i=>i.id===id).title);return true;}
    }
  }
  return false;
}
export function careerBoundaries(s){
  if(s.career.startedAt===null)return [];
  const now=absoluteTime(s),quiet=s.director.lastEventAt===null?now:s.director.lastEventAt+20;
  return [s.career.nextReviewAt,...s.career.plans.filter(p=>p.status==='pending').map(p=>p.finishesAt),...['nextCallAt','nextIncidentAt','nextCrisisAt'].map(key=>Math.max(s.director[key]??Infinity,quiet)),...s.incomingCalls.flatMap(c=>c.status==='deferred'?[c.resumeAt,c.expiresAt]:c.status==='ringing'?[c.expiresAt]:[]),s.activeCrisis?.status==='waiting'?s.activeCrisis.nextStageAt:s.activeCrisis?.decisionDueAt].filter(t=>Number.isFinite(t)&&t>now);
}
