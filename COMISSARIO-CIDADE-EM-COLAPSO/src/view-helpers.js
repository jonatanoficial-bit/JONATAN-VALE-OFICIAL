import { icon } from './icons.js';
export const e=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const button=(label,action,attrs='',style='primary')=>`<button class="button ${style}" data-action="${action}" ${attrs}>${label}</button>`;
export const badge=(label,tone='neutral')=>`<span class="badge ${tone}">${e(label)}</span>`;
export function header(kicker,title,description='',actions=''){return `<header class="page-header"><div><span class="eyebrow">${e(kicker)}</span><h1>${e(title)}</h1>${description?`<p>${e(description)}</p>`:''}</div><div class="header-actions">${actions}</div></header>`;}
export const meter=(label,value,tone='blue')=>`<div class="meter"><div><span>${e(label)}</span><b>${Math.round(value)}<small>/100</small></b></div><span class="meter-track"><i class="${tone}" style="width:${Math.max(0,Math.min(100,value))}%"></i></span></div>`;
export const stageName={pending:'Aguardando despacho',enroute:'Em deslocamento',onscene:'Decisão no local',finished:'Concluída',available:'Disponível',ordered:'Entrega em 1h',assigned:'Em missão',maintenance:'Em manutenção',building:'Em construção',active:'Operacional',rest:'Descanso',case:'Investigação',training:'Treinamento'};
export function sceneDetail(scene,viewBox,label,cls=''){return `<svg class="scene-detail ${cls}" viewBox="${viewBox}" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${e(label)}"><image href="./assets/references/${scene}.webp" width="1672" height="941" /></svg>`;}
export const empty=(title,text)=>`<div class="empty-state">${icon('shield')}<h3>${e(title)}</h3><p>${e(text)}</p></div>`;
