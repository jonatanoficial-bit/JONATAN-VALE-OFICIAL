import { chapters } from './campaign.js';

const clamp = (value, min = 0, max = 100) => Math.max(min, Math.min(max, value));
const weatherTypes = [
  { id: 'clear', label: 'Céu aberto', etaMultiplier: 1, temperature: 16 },
  { id: 'clouds', label: 'Nublado', etaMultiplier: 1, temperature: 12 },
  { id: 'rain', label: 'Chuva', etaMultiplier: 1.15, temperature: 9 },
  { id: 'storm', label: 'Chuva intensa', etaMultiplier: 1.3, temperature: 7 },
  { id: 'cold', label: 'Frio intenso', etaMultiplier: 1.1, temperature: 1 }
];

// Pure daily weather: loading a save cannot reroll weather or consume incident RNG.
export function weatherForDay(seed, day) {
  let sample = Math.imul((seed >>> 0) ^ (day + 1), 2654435761) >>> 0;
  sample ^= sample >>> 16;
  const winter = day % 365 >= 90 && day % 365 < 180;
  const index = (sample >>> 0) % (winter ? 5 : 4);
  return { ...weatherTypes[index], day };
}

export function currentBulletin(state) {
  if (state.finance.arrears > 0) return 'Conselho cobra plano para obrigações financeiras em atraso.';
  if (state.caseFile.state === 'reviewed') return 'Arquivo Ponte segue para revisão independente com provas preservadas.';
  if (state.weather?.id === 'storm') return 'Chuva intensa desacelera deslocamentos; hospitais pedem rotas livres.';
  if (state.weather?.id === 'cold') return 'Saúde pública reforça orientação para equipes expostas ao frio.';
  if (state.city.health < 45) return 'Rede de saúde pede coordenação de transporte e proteção de equipes.';
  if (state.city.trust < 30) return 'Lideranças comunitárias pedem respostas e prestação de contas.';
  if (state.city.trust >= 65) return 'Conselho comunitário reconhece melhora no diálogo com os serviços públicos.';
  const headlines = [
    'Turnos de descanso são revisados para manter a continuidade do atendimento.',
    'Oficina publica o calendário de manutenção preventiva da frota.',
    'Moradores acompanham o balanço de ocorrências e os compromissos da gestão.',
    'Equipes de saúde e transporte revisam rotas prioritárias para ambulâncias.'
  ];
  return headlines[state.day % headlines.length];
}

export function updateDailyWorld(state) {
  state.weather = weatherForDay(state.seed, state.day);
  const medical = state.buildings.some(room => room.type === 'medical' && room.status === 'active');
  for (const member of state.staff) {
    // Available staff are on a normal shift rotation, not permanently on duty.
    if (member.status === 'available') member.fatigue = clamp(member.fatigue - (medical ? 8 : 5));
    if (member.status === 'case') member.fatigue = clamp(member.fatigue + 2);
  }
  if (medical) state.city.health = clamp(state.city.health + 1);
  if (state.day % 7 === 0 && state.weather.id === 'cold') {
    const protectedTeams = state.campaignDecisions.some(choice => choice.chapterId === 'A4' && choice.choiceId === 'protection');
    if (!medical && !protectedTeams) state.city.health = clamp(state.city.health - 2, 20, 100);
  }
  const news = { id: 'NEWS-' + state.day, day: state.day, headline: currentBulletin(state), weather: state.weather.label };
  state.news = [news, ...(state.news || []).filter(item => item.id !== news.id)].slice(0, 30);
}

export function campaignOutcome(state) {
  if (!chapters.every(chapter => state.campaignDecisions.some(choice => choice.chapterId === chapter.id))) return null;
  const score = Math.round((state.city.trust + state.city.integrity + state.city.health + state.city.security) / 4);
  let id = 'recovery', title = 'Reconstrução em andamento';
  let summary = 'A cidade encerra a audiência com avanços e compromissos pendentes. A próxima gestão recebe um plano público de recuperação.';
  if (state.city.trust < 25 || state.city.integrity < 30) {
    id = 'oversight'; title = 'Gestão sob revisão';
    summary = 'A audiência determina supervisão independente. A baixa confiança exige transparência e reconstrução das relações com a população.';
  } else if (state.finance.arrears > 0 || state.finance.cash < 30000) {
    id = 'fiscal'; title = 'Recuperação sob pressão fiscal';
    summary = 'Os serviços continuam, mas compromissos financeiros exigem um plano de saneamento acompanhado pelo conselho.';
  } else if (state.city.trust >= 60 && state.city.integrity >= 65 && state.stats.incidentsResolved >= 3) {
    id = 'renewal'; title = 'Um pacto de reconstrução';
    summary = 'Resultados, prestação de contas e proteção da população sustentam a continuidade. O conselho aprova metas públicas para o próximo ciclo.';
  }
  return {
    id, title, summary, score, day: state.day, dismissed: false,
    metrics: { trust: state.city.trust, integrity: state.city.integrity, health: state.city.health, security: state.city.security, cash: state.finance.cash, incidentsResolved: state.stats.incidentsResolved },
    decisions: state.campaignDecisions.map(({ chapterId, choiceId, title }) => ({ chapterId, choiceId, title }))
  };
}
