import { collides } from './state.js';
import { roomCatalog } from './content.js';

export function precinctHTML(state, selectedRoomType = null) {
  const selected = roomCatalog.find(room => room.type === selectedRoomType);
  const cells = Array.from({ length: 96 }, (_, index) => {
    const x = index % 12; const y = Math.floor(index / 12);
    const blocked = selected ? collides(state.buildings, x, y, selected.w, selected.h) : false;
    return `<button class="grid-cell ${selected ? (blocked ? 'blocked' : 'available') : ''}" style="--x:${x + 1};--y:${y + 1}" data-action="place-room" data-x="${x}" data-y="${y}" aria-label="Célula ${x + 1}, ${y + 1}${blocked ? ', ocupada' : ''}"></button>`;
  }).join('');
  const buildings = state.buildings.map(room => `
    <div class="room room-${room.type}" style="--x:${room.x + 1};--y:${room.y + 1};--w:${room.w};--h:${room.h}" title="${room.name}">
      <span>${room.icon || '▦'}</span><b>${room.name}</b><small>${room.status === 'active' ? 'OPERACIONAL' : room.status}</small>
    </div>`).join('');
  return `
    <section class="precinct-layout">
      <div class="precinct-sidebar glass-panel">
        <span class="eyebrow">PLANTA ORTOGONAL 2D</span><h2>Comando Central</h2>
        <p class="muted">Selecione um módulo e toque numa área livre. Custos e capacidades alteram a simulação.</p>
        <div class="room-catalog">
          ${roomCatalog.map(room => `<button class="room-card ${selectedRoomType === room.type ? 'selected' : ''}" data-action="select-room" data-room="${room.type}">
            <span class="room-icon">${room.icon}</span><span><b>${room.name}</b><small>US$ ${room.cost.toLocaleString('pt-BR')} · ${room.w}×${room.h}</small><em>${room.benefit}</em></span>
          </button>`).join('')}
        </div>
        ${selected ? `<div class="placement-tip">Posicionando <b>${selected.name}</b>. Toque numa célula verde.</div>` : '<div class="placement-tip neutral">Escolha um dos 3 módulos construíveis.</div>'}
      </div>
      <div class="precinct-stage">
        <div class="precinct-meta"><span>${state.buildings.length} setores</span><span>${state.garageCapacity} vagas</span><span>${state.stats.rooms}/3 módulos novos</span></div>
        <div class="precinct-grid" aria-label="Grade 12 por 8 da delegacia">
          ${cells}${buildings}
          <div class="corridor corridor-a"></div><div class="corridor corridor-b"></div>
        </div>
      </div>
    </section>`;
}
