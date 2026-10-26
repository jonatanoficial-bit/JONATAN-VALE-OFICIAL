import { people } from './content.js';
import { pendingChapter } from './campaign.js';
import { portrait } from './art.js';
import { icon } from './icons.js';
import { formatCurrency } from './i18n.js';
import { worldTime, formatGameTime } from './sim.js';
import { e, button, badge, header, meter, sceneDetail } from './view-helpers.js';
import { careerPlans } from './career.js';

const person=id=>people.find(p=>p.id===id)||people[3];
const scopeName={local:'Municipal',state:'Estadual',federal:'Cooperação federal',estadual:'Estadual'};
const statusName={active:'Em exercício',probation:'Sob supervisão',dismissed:'Mandato encerrado'};
const when=at=>Number.isFinite(at)?'Dia '+(Math.floor(at/1440)+1)+' · '+String(Math.floor(at%1440/60)).padStart(2,'0')+':'+String(Math.floor(at%60)).padStart(2,'0'):'A confirmar';
const cost=choice=>choice.effects?.cash<0?' · '+formatCurrency(-choice.effects.cash):'';
const ring=s=>s.incomingCalls?.find(c=>c.status==='ringing');

export function shiftToolsHTML(s){
 return `<section class="career-clock-tools"><div><span class="eyebrow">${s.speed?'TEMPO EM ANDAMENTO':'RELÓGIO PAUSADO'}</span><b>${formatGameTime(s)}</b><p>1×: um minuto do jogo a cada dois segundos. Alertas importantes pausam o relógio.</p></div><div>${button(icon('play')+' Retomar 1×','set-speed','data-speed="1"','secondary')}${button('+15 min','advance-time','data-minutes="15"','secondary')}${button('Aguardar próximo aviso','wait-next-event','','primary')}</div><small>A espera avança até oito horas e para na primeira novidade. Fechar o jogo não acumula crises.</small></section>`;
}

export function careerSignalHTML(s){
 if(s.career?.status==='dismissed')return `<section class="career-alert dismissal-alert" role="status"><div><b>Você foi dispensado do comando.</b><p>A decisão e o histórico da gestão estão no arquivo de carreira.</p></div>${button('Consultar decisão','navigate','data-screen="campaign"','secondary')}</section>`;
 const call=ring(s);
 if(call)return `<section class="career-alert incoming-alert" role="status">${portrait(person(call.personId),'small')}<div><span class="eyebrow">LIGAÇÃO RECEBIDA · ${when(call.arrivedAt)}</span><b>${e(person(call.personId).name)}</b><p>${e(call.title)}</p></div>${button(icon('phone')+' Atender','answer-incoming',`data-id="${e(call.id)}"`)}${button('Retornar depois','defer-incoming',`data-id="${e(call.id)}"`,'text')}</section>`;
 if(s.activeCrisis?.status==='decision')return `<section class="career-alert crisis-alert" role="status">${icon('crisis')}<div><span class="eyebrow">ATUALIZAÇÃO DA SITUAÇÃO · ${e(scopeName[s.activeCrisis.scope]||s.activeCrisis.scope)}</span><b>${e(s.activeCrisis.title)}</b><p>${e(s.activeCrisis.stageTitle)}</p></div>${button('Ler atualização','navigate','data-screen="campaign"','secondary')}</section>`;
 if(s.career?.status==='probation')return `<section class="career-alert warning-alert"><div><b>Sua permanência no cargo está sob revisão.</b><p>Consulte os motivos da avaliação e execute um plano de recuperação.</p></div>${button('Abrir carreira','navigate','data-screen="campaign"','secondary')}</section>`;
 return '';
}

export function incomingDialogHTML(s,ui){
 const call=s.incomingCalls?.find(c=>c.id===ui.selectedIncoming&&c.status==='ringing');if(!call)return '';
 return `<div class="modal-backdrop"><section class="modal incoming-call-dialog" role="dialog" aria-modal="true" aria-labelledby="incoming-title"><button class="modal-close icon-button" data-action="close-modal" aria-label="Fechar ligação">${icon('close')}</button><div class="incoming-dialog-person">${portrait(person(call.personId),'medium')}<div><span class="eyebrow">LINHA INSTITUCIONAL · ${when(call.arrivedAt)}</span><h2 id="incoming-title">${e(person(call.personId).name)}</h2><p>${e(call.title)}</p></div></div><blockquote>${e(call.body||call.description)}</blockquote><div class="incoming-choices">${(call.choices||[]).map(c=>button(`<span><b>${e(c.title)}</b><small>${e(c.detail||c.description)}${e(cost(c))}</small></span>${icon('arrow')}`,'respond-incoming',`data-id="${e(call.id)}" data-choice="${e(c.id)}" ${s.finance.cash+(c.effects?.cash||0)<0?'disabled':''}`,'choice')).join('')}</div><p class="muted">Prazo de retorno: ${when(call.expiresAt)}. Sua resposta fica no histórico.</p>${button('Pedir retorno mais tarde','defer-incoming',`data-id="${e(call.id)}"`,'text')}</section></div>`;
}

export function inboxHTML(s){
 const calls=(s.incomingCalls||[]).slice(0,5);
 return `<section class="phone-inbox"><div><span class="eyebrow">SECRETARIA DO COMANDO</span><h2>Ligações que chegaram até você.</h2><p>As chefias entram em contato durante o turno. Novas pautas dependem do tempo e da situação da cidade.</p></div>${calls.length?calls.map(c=>`<article>${portrait(person(c.personId),'small')}<div><b>${e(person(c.personId).name)} · ${e(c.title)}</b><small>${when(c.arrivedAt)} · ${c.status==='ringing'?'Aguardando resposta':c.status==='deferred'?'Retorno agendado':c.status==='answered'?'Respondida':'Prazo encerrado'}</small>${c.result?`<p>${e(c.result)}</p>`:''}</div>${c.status==='ringing'?button('Atender','answer-incoming',`data-id="${e(c.id)}"`,'secondary'):''}</article>`).join(''):'<p class="quiet-note">Nenhuma chamada recebida neste turno. Você pode consultar contatos ou deixar o relógio avançar.</p>'}</section>`;
}

function crisisHTML(s){
 const crisis=s.activeCrisis;
 if(!crisis)return `<section class="quiet-shift"><span class="eyebrow">SALA DE SITUAÇÃO</span><h2>Sem crise extraordinária em curso.</h2><p>Ocorrências locais continuam pelo centro de despacho. Situações maiores são comunicadas quando surgem sinais e confirmação. Use os intervalos para manutenção, investigação e preparação.</p>${button('Abrir centro de despacho','navigate','data-screen="map"','secondary')}</section>`;
 const history=crisis.history||crisis.decisions||[];
 return `<section class="live-crisis"><div class="live-crisis-photo">${sceneDetail(crisis.scope==='federal'?'c10':'c09',crisis.scope==='federal'?'386 136 874 348':'15 190 1650 330','Reunião de coordenação institucional')}</div><div class="live-crisis-body"><span class="eyebrow">${e(scopeName[crisis.scope]||crisis.scope)} · SITUAÇÃO EM EVOLUÇÃO</span><h2>${e(crisis.title)}</h2><div class="crisis-phase">${badge(crisis.status==='decision'?'Decisão aguardada':'Equipes em execução',crisis.status==='decision'?'gold':'blue')}<span>Etapa ${crisis.stageIndex+1}</span></div><h3>${e(crisis.stageTitle)}</h3><p>${e(crisis.description)}</p>${crisis.status==='decision'?`<div class="campaign-options">${(crisis.choices||[]).map(c=>button(`<span><b>${e(c.title)}</b><small>${e(c.detail||c.description)}${e(cost(c))}</small></span>${icon('arrow')}`,'crisis-decision',`data-id="${e(crisis.id)}" data-choice="${e(c.id)}" ${s.finance.cash+(c.effects?.cash||0)<0?'disabled':''}`,'choice')).join('')}</div>`:`<div class="crisis-wait"><b>Aguardando retorno das equipes</b><p>Próxima atualização prevista: ${when(crisis.nextStageAt)}. O resultado não é imediato.</p>${button('Aguardar próximo aviso','wait-next-event','','secondary')}</div>`}${history.length?`<details class="crisis-history"><summary>Decisões anteriores desta situação</summary>${history.map(d=>`<p><b>${e(d.title||d.choiceTitle||d.choiceId)}</b><br>${e(d.result||'Decisão registrada')}</p>`).join('')}</details>`:''}</div></section>`;
}

function milestoneHTML(s){
 const chapter=pendingChapter(s);
 if(!chapter)return `<section class="career-milestone"><span class="eyebrow">AGENDA INSTITUCIONAL</span><h2>Acompanhe o turno.</h2><p>Não há novo briefing disponível. As próximas pautas chegam com o tempo e após os compromissos anteriores.</p></section>`;
 return `<section class="career-milestone"><span class="eyebrow">UM COMPROMISSO NA AGENDA</span><div class="speaker-line">${portrait(person(chapter.speaker),'medium')}<div><h2>${e(chapter.title)}</h2><p>${e(chapter.summary)}</p></div></div><div class="campaign-options">${chapter.choices.map(c=>button(`<span><b>${e(c.title)}</b><small>${e(c.text)}${e(cost(c))}</small></span>${icon('arrow')}`,'campaign-decision',`data-chapter="${chapter.id}" data-choice="${c.id}" ${s.finance.cash+(c.effects?.cash||0)<0?'disabled':''}`,'choice')).join('')}</div></section>`;
}

function dismissalHTML(s,ui){
 const dismissal=s.career.dismissal||{};
 const reasons=Array.isArray(dismissal.reasons)?dismissal.reasons:[dismissal.reason||'Resultados insuficientes após revisões e oportunidade de recuperação.'];
 return `<section class="dismissal-panel">${portrait(people[0],'dossier')}<div><span class="eyebrow">DECISÃO ADMINISTRATIVA · ${when(dismissal.at||worldTime(s))}</span><h1>O comando foi transferido.</h1><p>${e(dismissal.summary||'O prefeito decidiu encerrar seu mandato após avaliações desfavoráveis. O arquivo registra o desempenho e as oportunidades anteriores de correção.')}</p><ul>${reasons.map(r=>`<li>${e(r)}</li>`).join('')}</ul><p>A cidade não avança enquanto você consulta este encerramento. Seus arquivos manuais continuam disponíveis.</p><div class="career-actions">${button('Começar outra carreira','new-game')}${button('Abrir arquivos salvos','open-saves','','secondary')}${button('Exportar histórico','export-save','','secondary')}${ui.careerSafety&&!ui.careerSafety.empty&&!ui.careerSafety.corrupt?button('Retomar antes da avaliação','load-slot','data-slot="4"','secondary'):''}</div></div></section>`;
}

export function careerHTML(s,ui={}){
 const c=s.career||{status:'active',score:50,reviews:[],warnings:[],plans:[]};
 const tenure=Math.max(0,s.day-Math.floor((c.startedAt||0)/1440));
 const reviews=(c.reviews||[]).slice(0,6);
 const warnings=(c.warnings||[]).slice(0,3);
 const plans=c.plans||[];
 const dismissed=c.status==='dismissed';
 return `${header('CARREIRA CONTÍNUA','O cargo se conquista todos os dias.','Turnos, compromissos e consequências. Sua gestão pode atravessar anos — ou terminar por seus resultados.')}<section class="career-panel">${dismissed?dismissalHTML(s,ui):shiftToolsHTML(s)}<div class="career-overview"><article><span class="eyebrow">MANDATO</span><b>${e(statusName[c.status]||c.status)}</b><p>Ano ${Math.floor(tenure/365)+1} · ${tenure+1} dias no comando</p></article><article>${meter('Avaliação da gestão',c.score??50,c.status==='probation'?'red':'gold')}<p>Desempenho, integridade e capacidade de resposta.</p></article><article><span class="eyebrow">PRÓXIMA REVISÃO</span><b>${dismissed?'Mandato encerrado':when(c.nextReviewAt)}</b><p>Advertências e revisões ficam documentadas.</p></article></div>${warnings.length?`<section class="career-warnings"><h2>Atenção à sua permanência no cargo</h2>${warnings.map(w=>`<p>${e(typeof w==='string'?w:w.message||w.reason||w.text||w.title||'Revisão desfavorável registrada.')}</p>`).join('')}</section>`:''}${!dismissed?`<div class="career-columns"><div>${crisisHTML(s)}${milestoneHTML(s)}</div><aside class="career-preparation"><span class="eyebrow">TRABALHO ENTRE AS CRISES</span><h2>Invista na próxima semana.</h2><p>Planos custam recursos, levam tempo e não substituem o atendimento às ocorrências.</p>${[['community','Escuta comunitária','Reuniões de bairro e prestação de contas.'],['integrity','Revisão de integridade','Acompanhamento independente de contratos e conduta.'],['services','Continuidade dos serviços','Revisão de cobertura, apoio e prontidão.']].map(([id,title,text])=>button(`<span><b>${title}</b><small>${text} · ${formatCurrency(careerPlans.find(p=>p.id===id)?.cost||0)} · ${(careerPlans.find(p=>p.id===id)?.duration||0)/1440} dias</small></span>`,'career-plan',`data-plan="${id}" ${c.lastPlanAt!==null&&worldTime(s)-c.lastPlanAt<10080||s.finance.cash<(careerPlans.find(p=>p.id===id)?.cost||0)?'disabled':''}`,'choice')).join('')}${plans.slice(0,3).map(p=>`<article class="career-plan-status"><b>${e(p.title||p.plan||p.id)}</b><p>${p.status==='completed'?'Execução concluída':'Conclusão prevista: '+when(p.completesAt||p.finishesAt)}</p></article>`).join('')}<p class="career-note">A cidade é fictícia. Eventos graves são tratados por proteção de vidas, verificação das informações e cooperação institucional.</p></aside></div>`:''}<section class="career-record"><h2>Revisões do mandato</h2>${reviews.length?reviews.map(r=>`<article><div><span class="eyebrow">${when(r.at||r.reviewAt)}</span><h3>${e(r.title||statusName[r.status]||'Revisão periódica')}</h3></div><b>${Math.round(r.score||0)}/100</b><p>${e(r.summary||r.reason||'Indicadores e resultados registrados na avaliação.')}</p>${Array.isArray(r.reasons)?`<ul>${r.reasons.map(reason=>`<li>${e(reason)}</li>`).join('')}</ul>`:''}</article>`).join(''):'<p class="quiet-note">A primeira avaliação acontece depois de um período de trabalho. Um erro isolado não determina uma demissão automática.</p>'}<h2>Compromissos já decididos</h2>${s.campaignDecisions.slice(-7).map(d=>`<p><span class="eyebrow">DIA ${d.day+1}</span> · ${e(d.title)}</p>`).join('')||'<p class="quiet-note">Suas escolhas passarão a compor o histórico da carreira.</p>'}</section></section>`;
}

export function careerSafetyHTML(ui){
 const slot=ui.careerSafety;if(!slot||slot.empty)return '';
 return `<section class="autosave-card career-safety"><div><span class="eyebrow">RECUPERAÇÃO DE CARREIRA</span><p>${slot.corrupt?'O arquivo de recuperação requer um backup externo.':'Estado preservado antes da última avaliação que encerrou o mandato. Os três arquivos manuais permanecem separados.'}</p></div>${button('Retomar antes da avaliação','load-slot','data-slot="4" '+(slot.corrupt?'disabled':''),'secondary')}</section>`;
}
