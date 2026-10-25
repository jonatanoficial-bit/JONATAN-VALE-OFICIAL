import { districts } from './content.js';

const POI_OFFSETS = [[18, 23], [50, 52], [74, 30]];
let camera = { x: 0, y: 0, zoom: 1 };

export function cityMapHTML(state) {
  const districtHtml = districts.map((district, dIndex) => `
    <div class="district" data-district="${district.id}" style="left:${district.x}%;top:${district.y}%;width:${district.w}%;height:${district.h}%;--district:${district.color}">
      <span class="district-name">${district.name}</span>
      <span class="district-risk">risco ${state.city.districts[dIndex].crime}</span>
      ${district.poi.map((poi, index) => `<span class="poi" style="left:${POI_OFFSETS[index][0]}%;top:${POI_OFFSETS[index][1]}%" title="${poi}"><i></i>${poi}</span>`).join('')}
    </div>`).join('');
  const incidents = state.activeIncidents.map(incident => `
    <button class="incident-marker severity-${incident.severity}" style="left:${incident.x}%;top:${incident.y}%" data-action="open-incident" data-id="${incident.id}" aria-label="Abrir ${incident.title}">
      <span>${incident.icon}</span><b>${incident.severity}</b>
    </button>`).join('');
  const vehicles = state.fleet.map((vehicle, index) => {
    const district = districts.find(d => d.id === vehicle.districtId) || districts[0];
    const incident = state.activeIncidents.find(i => i.id === vehicle.incidentId);
    const progress = incident ? (incident.progress || 0) / 100 : 0;
    const targetX = incident?.x ?? district.x + 25;
    const targetY = incident?.y ?? district.y + 35;
    const startX = district.x + 15 + index * 2;
    const startY = district.y + 60;
    const x = startX + (targetX - startX) * progress;
    const y = startY + (targetY - startY) * progress;
    return `<button class="vehicle-marker ${vehicle.status}" style="left:${x}%;top:${y}%" title="${vehicle.name} · ${vehicle.status}" aria-label="${vehicle.name}, ${vehicle.status}">▰</button>`;
  }).join('');
  return `
    <section class="map-layout">
      <div class="map-toolbar glass-panel">
        <div><span class="eyebrow">CENTRO DE DESPACHO</span><h2>Mapa operacional</h2></div>
        <div class="map-controls" aria-label="Controles do mapa">
          <button class="icon-button" data-map-action="zoom-out" aria-label="Diminuir zoom">−</button>
          <output id="zoom-level">${Math.round(camera.zoom * 100)}%</output>
          <button class="icon-button" data-map-action="zoom-in" aria-label="Aumentar zoom">+</button>
          <button class="secondary-button" data-map-action="reset">Centralizar</button>
        </div>
      </div>
      <div class="city-map-viewport" id="city-map-viewport" aria-label="Mapa top-down de cinco distritos. Arraste para mover; use pinça ou roda para zoom.">
        <div class="city-map-world" id="city-map-world" style="transform:translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})">
          <div class="water water-a"></div><div class="water water-b"></div>
          <div class="road-grid"></div>
          <svg class="bridges" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <path d="M39 74 L51 66 M61 57 L70 47 M60 25 L63 31" />
          </svg>
          ${districtHtml}${incidents}${vehicles}
        </div>
        <div class="map-legend"><span><i class="legend-dot incident"></i> Ocorrência</span><span><i class="legend-dot unit"></i> Viatura</span><span>Arraste · pinça · roda</span></div>
      </div>
    </section>`;
}

function applyCamera(world, output) {
  camera.zoom = Math.max(0.75, Math.min(2.4, camera.zoom));
  world.style.transform = `translate(${camera.x}px,${camera.y}px) scale(${camera.zoom})`;
  if (output) output.textContent = `${Math.round(camera.zoom * 100)}%`;
}

export function bindMapControls(root) {
  const viewport = root.querySelector('#city-map-viewport');
  const world = root.querySelector('#city-map-world');
  if (!viewport || !world) return;
  const output = root.querySelector('#zoom-level');
  root.querySelectorAll('[data-map-action]').forEach(button => button.addEventListener('click', () => {
    const action = button.dataset.mapAction;
    if (action === 'zoom-in') camera.zoom += 0.2;
    if (action === 'zoom-out') camera.zoom -= 0.2;
    if (action === 'reset') camera = { x: 0, y: 0, zoom: 1 };
    applyCamera(world, output);
  }));
  viewport.addEventListener('wheel', event => {
    event.preventDefault();
    camera.zoom += event.deltaY < 0 ? 0.12 : -0.12;
    applyCamera(world, output);
  }, { passive: false });
  const pointers = new Map();
  let last = null;
  let pinchDistance = null;
  viewport.addEventListener('pointerdown', event => {
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    last = { x: event.clientX, y: event.clientY };
    viewport.setPointerCapture(event.pointerId);
  });
  viewport.addEventListener('pointermove', event => {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 1 && last) {
      camera.x += event.clientX - last.x; camera.y += event.clientY - last.y;
      last = { x: event.clientX, y: event.clientY };
    } else if (pointers.size === 2) {
      const [a, b] = [...pointers.values()];
      const distance = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchDistance) camera.zoom *= distance / pinchDistance;
      pinchDistance = distance;
    }
    applyCamera(world, output);
  });
  const release = event => { pointers.delete(event.pointerId); last = null; pinchDistance = null; };
  viewport.addEventListener('pointerup', release);
  viewport.addEventListener('pointercancel', release);
}
