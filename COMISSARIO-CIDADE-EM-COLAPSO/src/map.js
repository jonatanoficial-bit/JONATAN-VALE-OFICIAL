import { districts } from './content.js';
import { icon } from './icons.js';
import { districtBase, roadNodes, routePosition } from './routes.js';
import { e } from './view-helpers.js';
let camera={x:0,y:0,zoom:1},touchNavigation=false;
const point=value=>Number.isFinite(Number(value))?Math.max(0,Math.min(100,Number(value))):50;
const labels=[{name:'MANHATTAN',x:41,y:45},{name:'BRONX',x:60,y:8},{name:'QUEENS',x:74,y:35},{name:'BROOKLYN',x:65,y:79},{name:'STATEN ISLAND',x:22,y:89}];
export function cityMapHTML(state){
 const incidents=state.activeIncidents.map(i=>`<button class="incident-marker severity-${e(i.severity)} ${e(i.stage)}" style="left:${point(i.x)}%;top:${point(i.y)}%" data-action="open-incident" data-id="${e(i.id)}" aria-label="Abrir ${e(i.title)}"><span>${icon(i.type==='health'?'staff':i.type==='missing'?'case':'crisis')}</span><b>${e(i.severity)}</b></button>`).join('');
 const routes=state.activeIncidents.filter(i=>Array.isArray(i.route)&&i.stage!=='pending').map(i=>`<polyline points="${i.route.map(p=>point(p.x)+','+point(p.y)).join(' ')}" />`).join('');
 const vehicles=state.fleet.filter(v=>['available','assigned'].includes(v.status)).map(v=>{
  const i=state.activeIncidents.find(i=>i.id===v.incidentId);
  const p=i?.route?.length?routePosition(i.route,(i.progress||0)/100):(roadNodes.find(n=>n.id===(v.nodeId||districtBase[v.districtId]))||roadNodes[0]);
  return `<span class="vehicle-marker ${e(v.status)} ${e(v.type)}" style="left:${point(p.x)}%;top:${point(p.y)}%" title="${e(v.name)}"><i></i><b></b></span>`;
 }).join('');
 const pois=roadNodes.map(n=>`<span class="poi-dot" style="left:${n.x}%;top:${n.y}%" title="${districts.find(d=>d.id===n.districtId)?.poi[roadNodes.indexOf(n)%2]||'Corredor de serviço'}"></span>`).join('');
 return `<section class="map-layout"><div class="map-toolbar"><span class="eyebrow">MAPA ORTOGONAL · 5 DISTRITOS</span><div class="map-controls"><button data-map-action="zoom-out" aria-label="Diminuir zoom">−</button><output id="zoom-level">${Math.round(camera.zoom*100)}%</output><button data-map-action="zoom-in" aria-label="Aumentar zoom">+</button><button data-map-action="reset">Centralizar</button><button data-map-action="pan" aria-pressed="${touchNavigation}">${touchNavigation?'Rolar página':'Mover mapa'}</button></div></div><div class="city-map-viewport ${touchNavigation?'map-interactive':''}" id="city-map-viewport" aria-label="Mapa 2D da cidade, arraste para mover e use pinça para ampliar"><div class="city-map-world" id="city-map-world" style="transform:translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})"><img class="city-texture" src="./assets/backgrounds/c04.webp" alt="Mapa noturno ortogonal aprovado da cidade" draggable="false"><svg class="route-layer" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">${routes}</svg>${labels.map(d=>`<span class="district-label" style="left:${d.x}%;top:${d.y}%">${d.name}</span>`).join('')}${pois}${vehicles}${incidents}</div><div class="map-legend"><span><i class="legend-incident"></i>Ocorrência</span><span><i class="legend-vehicle"></i>Viatura</span><span>Celular: ative Mover mapa para arrastar/pinçar</span></div><div class="north-arrow">N<span>↑</span></div></div></section>`;
}
function applyCamera(world,output){camera.zoom=Math.max(1,Math.min(3,camera.zoom));world.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})`;if(output)output.textContent=Math.round(camera.zoom*100)+'%';}
export function bindMapControls(root){
 const viewport=root.querySelector('#city-map-viewport'),world=root.querySelector('#city-map-world'),output=root.querySelector('#zoom-level');if(!viewport||!world)return;
 root.querySelectorAll('[data-map-action]').forEach(b=>b.addEventListener('click',()=>{if(b.dataset.mapAction==='pan'){touchNavigation=!touchNavigation;viewport.classList.toggle('map-interactive',touchNavigation);b.setAttribute('aria-pressed',String(touchNavigation));b.textContent=touchNavigation?'Rolar página':'Mover mapa';}if(b.dataset.mapAction==='zoom-in')camera.zoom+=.2;if(b.dataset.mapAction==='zoom-out')camera.zoom-=.2;if(b.dataset.mapAction==='reset')camera={x:0,y:0,zoom:1};applyCamera(world,output);}));
 viewport.addEventListener('wheel',e=>{e.preventDefault();camera.zoom+=e.deltaY<0?.12:-.12;applyCamera(world,output);},{passive:false});
 const points=new Map();let last=null,pinch=null;
 viewport.addEventListener('pointerdown',e=>{if(e.target.closest('button')||(e.pointerType==='touch'&&!touchNavigation))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});last={x:e.clientX,y:e.clientY};viewport.setPointerCapture(e.pointerId);});
 viewport.addEventListener('pointermove',e=>{if(!points.has(e.pointerId))return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});if(points.size===1&&last){camera.x+=e.clientX-last.x;camera.y+=e.clientY-last.y;last={x:e.clientX,y:e.clientY};}else if(points.size===2){const[a,b]=[...points.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch)camera.zoom*=d/pinch;pinch=d;}applyCamera(world,output);});
 const release=e=>{points.delete(e.pointerId);last=null;pinch=null;};viewport.addEventListener('pointerup',release);viewport.addEventListener('pointercancel',release);
}
