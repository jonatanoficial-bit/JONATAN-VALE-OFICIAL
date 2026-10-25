import { BUILD, VERSION, candidates, eventTemplates, newsByDay, openingChoices, people, phoneTopics, vehiclesCatalog } from './content.js';
import { formatMoney } from './state.js';
import { formatGameTime } from './sim.js';
import { cityMapHTML } from './map.js';
import { precinctHTML } from './precinct.js';

const escapeHtml = value => String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));

function portrait(person, size = 'large') {
  return `<div class="portrait portrait-${size} tone-${person.tone}" role="img" aria-label="Retrato provisório identificado de ${person.name}">
    <span>${person.initials}</span><small>${person.id}</small>
  </div>`;
}

function kpi(label, value, trend = '') {
  return `<div class="kpi"><span>${label}</span><b>${value}</b>${trend ? `<small>${trend}</small>` : ''}</div>`;
}

function titleScreen(state, hasSave) {
  return `<main class="title-screen screen-enter">
    <div class="city-silhouette" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i></div>
    <section class="title-copy">
      <div class="brand-lockup"><span class="seal">VG</span><span>VALE GAMES APRESENTA</span></div>
      <p class="eyebrow red">UMA CIDADE. MILHÕES DE VIDAS. UMA DECISÃO.</p>
      <h1>COMISSÁRIO</h1><h2>CIDADE EM COLAPSO</h2>
      <p class="title-lead">Assuma o comando. Proteja civis. Reconstrua uma instituição — e arque com cada consequência.</p>
      <nav class="title-menu" aria-label="Menu principal">
        <button class="primary-button cinematic" data-action="new-game"><span>NOVO JOGO</span><small>Capítulo Zero · A Ligação</small></button>
        <button class="secondary-button" data-action="continue" ${hasSave ? '' : 'disabled'}>CONTINUAR</button>
        <button class="secondary-button" data-action="open-saves">CARREGAR / GERENCIAR SAVES</button>
        <button class="text-button" data-action="navigate" data-screen="settings">Configurações e acessibilidade</button>
      </nav>
      <p class="fiction-note">Obra de ficção. Autoridades e acontecimentos narrativos são fictícios.</p>
    </section>
    <aside class="commissioner-hero" aria-label="Raymond Jackson, comissário">
      <div class="hero-aura"></div><div class="hero-uniform"><span>RAYMOND<br>JACKSON</span><i></i></div>
    </aside>
    <footer>PARTE 1 · LOTE 1 JOGÁVEL <span>v${VERSION} · ${BUILD}</span></footer>
  </main>`;
}

function introScreen(state) {
  if (state.storyStage === 'second-call') return `<main class="cinematic-screen screen-enter">
    <div class="cinema-bars top"></div><div class="cinema-bars bottom"></div>
    <section class="call-stage"><div class="call-portrait mayor">${portrait(people[6])}<span class="signal-ring"></span></div>
      <div class="dialogue-card"><span class="speaker">ALLAN THOMPSON · 02:26</span><p>“Raymond, a cidade não tem tempo para um impasse. Aceite com autonomia documentada e apresente seu plano em 72 horas.”</p>
        <div class="choice-list"><button class="choice-button" data-action="accept-second-call"><b>Aceitar sob condição</b><span>Autonomia registrada · confiança do prefeito −4</span></button>
        <button class="choice-button danger" data-action="restart"><b>Encerrar a ligação</b><span>Final rápido: Convite recusado</span></button></div>
      </div>
    </section></main>`;
  if (state.storyStage === 'ringing') return `<main class="cinematic-screen screen-enter">
    <div class="cinema-bars top"></div><div class="cinema-bars bottom"></div>
    <div class="rain-window" aria-hidden="true"></div>
    <section class="call-stage">
      <div class="call-portrait mayor">${portrait(people[6])}<span class="signal-ring"></span></div>
      <div class="dialogue-card"><span class="speaker">ALLAN THOMPSON · PREFEITO</span>
        <p>“Raymond? Aqui é Allan Thompson. Sei que é tarde. O departamento perdeu o controle de vários distritos. A cidade precisa de alguém que não negocie princípios por manchetes.”</p>
        <blockquote>RAYMOND — “Não vou aceitar um cargo para servir de rosto de uma crise. Preciso de autonomia operacional e números reais.”</blockquote>
        <h3>Qual é a sua condição?</h3>
        <div class="choice-list">${openingChoices.map((choice, index) => `<button class="choice-button" data-action="opening-choice" data-choice="${choice.id}"><span class="choice-key">${String.fromCharCode(65 + index)}</span><b>${choice.title}</b><small>${choice.detail}</small></button>`).join('')}</div>
      </div>
    </section>
    <button class="skip-cinema" data-action="skip-intro">Pular cena</button>
  </main>`;
  return `<main class="cinematic-screen opening screen-enter">
    <div class="cinema-bars top"></div><div class="cinema-bars bottom"></div>
    <div class="opening-montage"><div class="scanlines"></div><span class="news-tag">TRANSMISSÃO DE EMERGÊNCIA · 02:17</span>
      <h1>UMA CIDADE.</h1><h1>MILHÕES DE VIDAS.</h1><h1 class="red">UMA DECISÃO.</h1>
      <div class="opening-status"><span>METRÔ PARALISADO</span><span>HOSPITAIS 87%</span><span>5 DISTRITOS EM ALERTA</span></div>
    </div>
    <button class="answer-call" data-action="begin-call"><span class="phone-glyph">☎</span><span><small>CHAMADA SEGURA</small>ATENDER ALLAN THOMPSON</span></button>
    <button class="skip-cinema" data-action="skip-intro">Pular para a decisão</button>
  </main>`;
}

function officeScreen(state) {
  const pending = state.activeIncidents.length;
  return `<section class="office-screen screen-enter">
    <div class="office-backdrop"><div class="office-window"><span></span></div><div class="desk"><i></i></div></div>
    <div class="mission-banner"><span class="eyebrow">OBJETIVO ATUAL</span><b>${escapeHtml(state.objective)}</b><small>${state.day < 3 ? `${Math.max(0, 72 - state.day * 24)}h restantes no plano inicial` : 'Balanço da primeira semana em andamento'}</small></div>
    <div class="office-hotspots" aria-label="Gabinete interativo">
      <button class="hotspot phone" data-action="navigate" data-screen="phone"><span>☎</span><b>Telefone</b><small>${state.phoneLog.length} chamadas</small></button>
      <button class="hotspot map" data-action="navigate" data-screen="map"><span>⌖</span><b>Mapa</b><small>${pending} ocorrências</small></button>
      <button class="hotspot finance" data-action="navigate" data-screen="fleet"><span>$</span><b>Frota & Finanças</b><small>${formatMoney(state.finance.cash)}</small></button>
      <button class="hotspot case" data-action="navigate" data-screen="case"><span>⌕</span><b>Arquivo Ponte</b><small>${state.caseFile.progress}% analisado</small></button>
      <button class="hotspot precinct" data-action="navigate" data-screen="precinct"><span>▦</span><b>Delegacia</b><small>${state.stats.rooms}/3 novas salas</small></button>
    </div>
    <aside class="briefing-stack">
      <div class="npc-card urgent">${portrait(people[3], 'small')}<div><span class="eyebrow">BRITHNEY</span><b>“Comissário, três decisões não podem esperar.”</b><button data-action="navigate" data-screen="report">Abrir briefing</button></div></div>
      <div class="news-ticker"><span>NYC // AGORA</span><p>${newsByDay[Math.min(state.day, newsByDay.length - 1)]}</p></div>
    </aside>
  </section>`;
}

function phoneScreen(state) {
  return `<section class="phone-screen screen-enter">
    <header class="section-heading"><div><span class="eyebrow">LINHA INSTITUCIONAL SEGURA</span><h1>Telefone e contatos</h1><p>Assuntos estruturados. Jurisdição, confiança e consequências são persistentes.</p></div><div class="phone-summary"><b>${state.stats.calls}</b><span>chamadas feitas</span></div></header>
    <div class="contact-grid">${people.map(person => {
      const relation = state.contacts[person.id]; const topic = phoneTopics[person.id];
      const gated = person.id === 'P11' && !state.flags.federalBriefed;
      return `<article class="contact-card ${gated ? 'restricted' : ''}">${portrait(person, 'small')}<div class="contact-copy"><span class="institution">${person.institution}</span><h3>${person.name}</h3><p>${person.role}</p>
        <div class="relation-bar"><i style="width:${relation.trust}%"></i></div><small>Confiança ${relation.trust} · ${person.access}</small></div>
        <button class="call-button" data-action="phone-call" data-person="${person.id}" ${person.id === 'P01' ? '' : ''}>${gated ? 'Enviar informe' : 'Ligar'}<small>${topic.label}</small></button></article>`;
    }).join('')}</div>
    ${state.phoneLog.length ? `<div class="history-panel glass-panel"><h2>Histórico recente</h2>${state.phoneLog.slice(0, 5).map(call => `<p><b>${people.find(p => p.id === call.personId)?.name}</b><span>D${call.day + 1}</span>${call.result}</p>`).join('')}</div>` : ''}
  </section>`;
}

function mapScreen(state) {
  return `<section class="operations-screen screen-enter">${cityMapHTML(state)}
    <aside class="incident-rail"><div class="rail-title"><span class="pulse-dot"></span><b>OCORRÊNCIAS ATIVAS</b><em>${state.activeIncidents.length}</em></div>
      ${state.activeIncidents.length ? state.activeIncidents.map(incident => {
        const district = state.city.districts.find(d => d.id === incident.districtId);
        return `<button class="incident-list-item" data-action="open-incident" data-id="${incident.id}"><span class="severity-block">${incident.severity}</span><span><b>${incident.title}</b><small>${district?.name} · ${incident.stage === 'pending' ? 'aguardando' : incident.stage === 'enroute' ? `a caminho ${Math.round(incident.progress)}%` : 'no local'}</small></span></button>`;
      }).join('') : '<div class="empty-state">Nenhuma ocorrência ativa.<button data-action="spawn-incident">Gerar chamada de teste</button></div>'}
      <div class="unit-summary"><b>${state.fleet.filter(v => v.status === 'available').length}</b><span>viaturas disponíveis</span></div>
    </aside>
  </section>`;
}

function fleetScreen(state) {
  const committed = state.finance.payroll + state.finance.operations + state.finance.maintenance + state.finance.buildings + state.finance.forensics;
  return `<section class="management-screen screen-enter">
    <header class="section-heading"><div><span class="eyebrow">DOTação ANUAL + CAIXA MENSAL</span><h1>Frota e orçamento</h1><p>Todo pedido cria um ativo único, reduz o caixa e aumenta custos recorrentes.</p></div></header>
    <div class="finance-strip">${kpi('Caixa livre', formatMoney(state.finance.cash), 'uso imediato')}${kpi('Dotação anual', formatMoney(state.finance.annualBudget), 'teto aprovado')}${kpi('Compromissos/mês', formatMoney(committed), `${Math.round(committed / state.finance.monthlyRelease * 100)}% da liberação`)}</div>
    <div class="catalog-layout"><div><h2>Catálogo institucional</h2><div class="vehicle-catalog">${vehiclesCatalog.map(item => `<article class="product-card"><div class="vehicle-art ${item.type}"><span></span><i></i></div><span class="eyebrow">CONTRATO LOCAL</span><h3>${item.name}</h3><p>Tripulação ${item.crew} · ETA-base ${item.eta} min · manutenção ${formatMoney(item.upkeep)}/mês</p><strong>${formatMoney(item.price)}</strong><button class="primary-button" data-action="purchase" data-type="${item.type}" ${state.finance.cash < item.price ? 'disabled' : ''}>Comprar e registrar</button></article>`).join('')}</div></div>
      <aside class="fleet-inventory glass-panel"><h2>Ativos da frota <span>${state.fleet.length}/${state.garageCapacity}</span></h2>${state.fleet.map(vehicle => `<div class="asset-row"><span class="asset-icon">▰</span><span><b>${vehicle.name}</b><small>${vehicle.id} · ${vehicle.status}</small></span><em>${vehicle.condition}%</em></div>`).join('')}<button class="secondary-button wide" data-action="navigate" data-screen="precinct">Gerenciar garagem</button></aside></div>
  </section>`;
}

function staffScreen(state) {
  return `<section class="management-screen screen-enter"><header class="section-heading"><div><span class="eyebrow">RECURSOS HUMANOS</span><h1>Efetivo, turnos e folha</h1><p>Contratações ocupam slots, criam custo mensal e permanecem no save.</p></div>${kpi('Folha mensal', formatMoney(state.finance.payroll), `${state.staff.length} profissionais`)}</header>
    <div class="staff-layout"><div class="staff-roster glass-panel"><h2>Equipe ativa</h2>${state.staff.map(person => `<div class="staff-row"><span class="avatar-mini">${person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span><span><b>${person.name}</b><small>${person.role} · turno ${person.shift}</small></span><span class="fatigue">Fadiga <b>${person.fatigue}%</b></span><em>${person.status}</em></div>`).join('')}</div>
      <div><h2>Mercado de trabalho</h2><div class="candidate-grid">${state.candidatePool.map(person => `<article class="candidate-card"><span class="avatar-mini">${person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</span><h3>${person.name}</h3><p>${person.role} · turno ${person.shift}</p><div><span>Competência ${person.competence}</span><span>Ética ${person.ethics}</span></div><b>${formatMoney(person.salary)}/mês</b><button data-action="hire" data-id="${person.id}">Contratar</button></article>`).join('') || '<div class="empty-state">Todos os candidatos desta rodada foram contratados.</div>'}</div></div></div>
  </section>`;
}

function caseScreen(state) {
  const caseFile = state.caseFile;
  return `<section class="case-screen screen-enter"><header class="section-heading"><div><span class="eyebrow">INVESTIGAÇÃO · ${caseFile.id}</span><h1>${caseFile.title}</h1><p>Roubo de remessas seguido do desaparecimento de uma testemunha. Não conclua sem evidência.</p></div><div class="case-progress"><b>${caseFile.progress}%</b><span>${caseFile.state === 'open' ? 'EM ANÁLISE' : 'PRONTO PARA REVISÃO'}</span></div></header>
    <div class="evidence-board"><svg aria-hidden="true"><line x1="20%" y1="35%" x2="50%" y2="55%"/><line x1="50%" y1="55%" x2="79%" y2="30%"/></svg>${caseFile.evidence.map((evidence, index) => `<article class="evidence-card pos-${index} ${evidence.found ? '' : 'locked'}"><span>E${index + 1}</span><h3>${evidence.found ? evidence.title : 'PISTA NÃO VERIFICADA'}</h3><p>${evidence.found ? `Confiança ${evidence.confidence}% · cadeia registrada` : 'Exige equipe e diligência legal.'}</p></article>`).join('')}<div class="hypothesis-card"><span>HIPÓTESE ATUAL</span><b>${caseFile.hypothesis}</b><small>Alternativa: fraude interna ainda não descartada</small></div></div>
    <div class="case-actions"><button data-action="case-action" data-kind="review"><b>Revisar câmeras</b><span>+14% · US$ 0 · 4h</span></button><button data-action="case-action" data-kind="forensics"><b>Contratar perícia externa</b><span>+22% · US$ 18.000</span></button><button data-action="case-action" data-kind="interview"><b>Entrevistar equipe do depósito</b><span>+17% · procedimento documentado</span></button></div>
  </section>`;
}

function reportScreen(state) {
  const goal = Math.min(7, state.day + 1);
  return `<section class="report-screen screen-enter"><header class="section-heading"><div><span class="eyebrow">SALA DE SITUAÇÃO</span><h1>Relatório de comando</h1><p>Cada variação abaixo vem do estado persistente da campanha.</p></div><button class="primary-button" data-action="advance-day" ${state.day >= 6 ? 'disabled' : ''}>Avançar para o próximo dia</button></header>
    <div class="week-track">${Array.from({ length: 7 }, (_, i) => `<div class="day-node ${i < goal ? 'done' : i === goal ? 'current' : ''}"><span>${i + 1}</span><small>DIA ${i + 1}</small></div>`).join('')}</div>
    <div class="report-grid"><div class="kpi-grid">${kpi('Segurança', state.city.security, 'respostas e prevenção')}${kpi('Confiança', state.city.trust, 'legitimidade pública')}${kpi('Integridade', state.city.integrity, 'decisões e auditoria')}${kpi('Moral', state.city.morale, 'fadiga e liderança')}${kpi('Prontidão', state.operationsReadiness, 'recursos operacionais')}${kpi('Pressão política', state.city.politicalPressure, 'quanto menor, melhor')}</div>
      <div class="journal-panel glass-panel"><h2>Journal de causa e efeito</h2>${state.journal.slice(0, 10).map(item => `<div class="journal-row tone-${item.tone}"><span>D${item.day + 1}</span><p>${escapeHtml(item.text)}</p></div>`).join('')}</div></div>
    <div class="gate-panel"><h2>Progresso do vertical slice</h2><div class="gate-grid">${[
      ['Prólogo concluído', state.storyStage === 'office'], ['6 ligações com efeitos', state.stats.calls >= 6], ['Compra registrada', state.stats.purchases >= 1], ['Contratação registrada', state.stats.hires >= 1], ['3 salas construídas', state.stats.rooms >= 3], ['Incidente resolvido', state.stats.incidentsResolved >= 1], ['Caso investigado', state.caseFile.progress >= 50], ['Primeira semana', state.day >= 6]
    ].map(([label, done]) => `<span class="gate ${done ? 'done' : ''}"><i>${done ? '✓' : '·'}</i>${label}</span>`).join('')}</div></div>
  </section>`;
}

function savesScreen(state, saveSlots) {
  return `<section class="saves-screen screen-enter"><header class="section-heading"><div><span class="eyebrow">PERSISTÊNCIA LOCAL</span><h1>Central de salvamento</h1><p>IndexedDB com checksum e fallback local. O RNG, edifícios, relações e ocorrências são retomados.</p></div></header>
    <div class="save-grid">${(saveSlots || [1, 2, 3].map(slot => ({ slot, empty: true }))).map(slot => `<article class="save-card ${slot.empty ? 'empty' : ''}"><span>SLOT ${slot.slot}</span>${slot.empty ? '<h2>Vazio</h2><p>Disponível para um save manual.</p>' : slot.corrupt ? '<h2>Arquivo inválido</h2><p>A cópia original não foi alterada.</p>' : `<h2>Dia ${slot.day + 1}</h2><p>${new Date(slot.savedAt).toLocaleString('pt-BR')}</p>`}<div><button data-action="save-slot" data-slot="${slot.slot}">Salvar aqui</button><button data-action="load-slot" data-slot="${slot.slot}" ${slot.empty || slot.corrupt ? 'disabled' : ''}>Carregar</button></div></article>`).join('')}</div>
    <div class="save-tools glass-panel"><div><h2>Backup portável</h2><p>Exporte o estado atual ou importe um JSON validado (até 5 MB).</p></div><button class="secondary-button" data-action="export-save">Exportar JSON</button><label class="secondary-button file-button">Importar JSON<input type="file" id="import-save" accept="application/json,.json" /></label></div>
  </section>`;
}

function settingsScreen(state) {
  const s = state.settings;
  return `<section class="settings-screen screen-enter"><header class="section-heading"><div><span class="eyebrow">ACESSIBILIDADE</span><h1>Configurações</h1><p>Preferências persistem no save e não alteram o desafio.</p></div></header><div class="settings-panel glass-panel">
    <label><span><b>Alto contraste</b><small>Reforça contornos e contraste da interface.</small></span><input type="checkbox" data-setting="highContrast" ${s.highContrast ? 'checked' : ''}></label>
    <label><span><b>Reduzir animações</b><small>Remove chuva, pulsos e transições intensas.</small></span><input type="checkbox" data-setting="reducedMotion" ${s.reducedMotion ? 'checked' : ''}></label>
    <label><span><b>Som</b><small>Prepara efeitos; esta build usa feedback visual por padrão.</small></span><input type="checkbox" data-setting="sound" ${s.sound ? 'checked' : ''}></label>
    <label class="range-setting"><span><b>Escala de texto</b><small>${Math.round(s.fontScale * 100)}%</small></span><input type="range" min="0.9" max="1.25" step="0.05" value="${s.fontScale}" data-setting="fontScale"></label>
    <div class="controls-help"><h2>Controles</h2><p><kbd>Esc</kbd> voltar · <kbd>Espaço</kbd> pausar · <kbd>1</kbd>/<kbd>2</kbd>/<kbd>3</kbd> velocidades · roda/pinça no mapa.</p></div></div>
  </section>`;
}

function incidentModal(state, incidentId) {
  const incident = state.activeIncidents.find(item => item.id === incidentId);
  if (!incident) return '';
  const template = eventTemplates.find(item => item.type === incident.type);
  const district = state.city.districts.find(item => item.id === incident.districtId);
  const available = state.fleet.filter(vehicle => vehicle.status === 'available');
  return `<div class="modal-backdrop" data-action="close-modal"><section class="incident-modal" role="dialog" aria-modal="true" aria-labelledby="incident-title" data-modal-stop>
    <header><span class="severity-badge">NÍVEL ${incident.severity}</span><button class="icon-button" data-action="close-modal" aria-label="Fechar">×</button></header><span class="eyebrow">${incident.id} · ${district?.name}</span><h2 id="incident-title">${incident.title}</h2><p class="incident-objective">Objetivo: ${incident.objective}</p>
    ${incident.stage === 'pending' ? `<h3>Escolha uma unidade disponível</h3><div class="dispatch-list">${available.map(vehicle => `<button data-action="dispatch" data-incident="${incident.id}" data-vehicle="${vehicle.id}"><span>▰</span><span><b>${vehicle.name}</b><small>${vehicle.id} · condição ${vehicle.condition}%</small></span><em>ETA ${vehicle.eta + incident.severity * 2}m</em></button>`).join('') || '<div class="empty-state">Nenhuma viatura disponível. Conclua outra ocorrência ou adquira um veículo.</div>'}</div>` : incident.stage === 'enroute' ? `<div class="arrival-progress"><span style="width:${incident.progress}%"></span></div><p>Unidade a caminho — ${Math.round(incident.progress)}%. O tempo continua no mundo.</p>` : `<h3>Unidade no local — decisão de comando</h3><div class="resolution-grid"><button data-action="resolve-incident" data-id="${incident.id}" data-choice="A"><b>${template.choiceA}</b><span>prioriza proteção e legitimidade</span></button><button data-action="resolve-incident" data-id="${incident.id}" data-choice="B"><b>${template.choiceB}</b><span>prioriza contenção e segurança</span></button></div>`}
  </section></div>`;
}

function topHud(state) {
  return `<header class="top-hud"><button class="brand-button" data-action="navigate" data-screen="office" aria-label="Voltar ao gabinete"><span class="seal small">VG</span><span><b>COMISSÁRIO</b><small>CIDADE EM COLAPSO</small></span></button>
    <div class="hud-objective"><span class="pulse-dot"></span><span><small>OBJETIVO</small><b>${escapeHtml(state.objective)}</b></span></div>
    <div class="hud-stats"><span><small>CAIXA</small><b>${formatMoney(state.finance.cash)}</b></span><span><small>CONFIANÇA</small><b>${state.city.trust}</b></span><span><small>SEGURANÇA</small><b>${state.city.security}</b></span></div>
    <div class="time-controls"><output>${formatGameTime(state)}</output><button data-action="set-speed" data-speed="0" class="${state.speed === 0 ? 'active' : ''}" aria-label="Pausar">Ⅱ</button><button data-action="set-speed" data-speed="1" class="${state.speed === 1 ? 'active' : ''}">1×</button><button data-action="set-speed" data-speed="3" class="${state.speed === 3 ? 'active' : ''}">3×</button><button data-action="set-speed" data-speed="6" class="${state.speed === 6 ? 'active' : ''}">6×</button></div>
    <button class="icon-button save-quick" data-action="quick-save" aria-label="Salvar">▣</button>
  </header>`;
}

function bottomNav(state) {
  const items = [['office', '▤', 'Gabinete'], ['map', '⌖', 'Mapa'], ['phone', '☎', 'Telefone'], ['fleet', '$', 'Frota'], ['staff', '♟', 'RH'], ['precinct', '▦', 'Delegacia'], ['case', '⌕', 'Caso'], ['report', '▥', 'Relatório']];
  return `<nav class="bottom-nav" aria-label="Navegação principal">${items.map(([screen, icon, label]) => `<button class="${state.screen === screen ? 'active' : ''}" data-action="navigate" data-screen="${screen}"><span>${icon}</span><small>${label}</small></button>`).join('')}</nav>`;
}

export function renderApp(state, ui = {}) {
  const inGame = !['title', 'intro'].includes(state.screen) && state.storyStage === 'office';
  let body;
  switch (state.screen) {
    case 'title': body = titleScreen(state, ui.hasSave); break;
    case 'intro': body = introScreen(state); break;
    case 'office': body = officeScreen(state); break;
    case 'phone': body = phoneScreen(state); break;
    case 'map': body = mapScreen(state); break;
    case 'precinct': body = precinctHTML(state, ui.selectedRoom); break;
    case 'fleet': body = fleetScreen(state); break;
    case 'staff': body = staffScreen(state); break;
    case 'case': body = caseScreen(state); break;
    case 'report': body = reportScreen(state); break;
    case 'saves': body = savesScreen(state, ui.saveSlots); break;
    case 'settings': body = settingsScreen(state); break;
    default: body = officeScreen(state);
  }
  return `${inGame ? topHud(state) : ''}<div class="screen-frame ${inGame ? 'with-hud' : ''}">${body}</div>${inGame ? bottomNav(state) : ''}${incidentModal(state, ui.selectedIncident)}`;
}

export const lookupOpeningChoice = id => openingChoices.find(choice => choice.id === id);
export const lookupVehicle = type => vehiclesCatalog.find(item => item.type === type);
export const lookupCandidate = id => candidates.find(item => item.id === id);
export const lookupPhoneTopic = personId => phoneTopics[personId];
