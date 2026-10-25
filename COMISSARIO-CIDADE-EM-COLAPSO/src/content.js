export const VERSION = '1.0.0';
export const BUILD = 'parte3-2026.10.25';

export const people = [
  { id: 'P01', name: 'Raymond Jackson', short: 'Raymond', role: 'Comissário da NYPD', institution: 'NYPD', access: 'Você', initials: 'RJ', tone: 'gold' },
  { id: 'P02', name: 'Capitão James', short: 'Cap. James', role: 'Chefe de patrulhamento', institution: 'NYPD', access: 'Direto', initials: 'CJ', tone: 'blue' },
  { id: 'P03', name: 'Kevin', short: 'Kevin', role: 'Operador da ESU', institution: 'NYPD', access: 'Direto', initials: 'KE', tone: 'slate' },
  { id: 'P04', name: 'Brithney', short: 'Brithney', role: 'Sargenta e secretária executiva', institution: 'NYPD', access: 'Direto', initials: 'BR', tone: 'teal' },
  { id: 'P05', name: 'Detetive James', short: 'Det. James', role: 'Chefe de investigações', institution: 'NYPD', access: 'Direto', initials: 'DJ', tone: 'amber' },
  { id: 'P06', name: 'Vice-prefeito Jackson', short: 'V.-pref. Jackson', role: 'Segurança comunitária', institution: 'Prefeitura', access: 'Institucional', initials: 'VJ', tone: 'copper' },
  { id: 'P07', name: 'Allan Thompson', short: 'Allan', role: 'Prefeito fictício de Nova York', institution: 'Prefeitura', access: 'Institucional', initials: 'AT', tone: 'red' },
  { id: 'P08', name: 'Elliot Hadja', short: 'Elliot', role: 'Governador fictício de Nova York', institution: 'Estado de NY', access: 'Mediante pauta', initials: 'EH', tone: 'navy' },
  { id: 'P09', name: 'Kevin Johnson', short: 'K. Johnson', role: 'Capitão da New York State Police', institution: 'NYSP', access: 'Mediante acordo', initials: 'KJ', tone: 'blue' },
  { id: 'P10', name: 'General James Brown', short: 'Gen. Brown', role: 'Comandante da Guarda Nacional', institution: 'Estado de NY', access: 'Após autorização', initials: 'JB', tone: 'olive' },
  { id: 'P11', name: 'Fabiana Dias', short: 'Pres. Dias', role: 'Presidente fictícia dos EUA', institution: 'Governo federal', access: 'Canal excepcional', initials: 'FD', tone: 'navy' },
  { id: 'P12', name: 'Nathaniel Cross', short: 'N. Cross', role: 'Diretor fictício do FBI', institution: 'FBI', access: 'Com nexo federal', initials: 'NC', tone: 'slate' }
];

export const districts = [
  { id: 'manhattan', name: 'Manhattan', x: 52, y: 18, w: 18, h: 58, color: '#2e7ca8', crime: 63, trust: 47, traffic: 78, poi: ['Prefeitura', 'Hospital Bellevue', 'Terminal Central'] },
  { id: 'bronx', name: 'Bronx', x: 48, y: 4, w: 30, h: 17, color: '#755aa8', crime: 58, trust: 52, traffic: 55, poi: ['Subestação Norte', 'Hospital Municipal'] },
  { id: 'queens', name: 'Queens', x: 67, y: 24, w: 30, h: 35, color: '#278d86', crime: 49, trust: 56, traffic: 61, poi: ['Aeroporto Logístico', 'Centro Médico Queens', 'Depósito Leste'] },
  { id: 'brooklyn', name: 'Brooklyn', x: 48, y: 59, w: 38, h: 36, color: '#a46a32', crime: 66, trust: 44, traffic: 67, poi: ['Armazém 14', 'Ponte East', 'Agência Federal Bank'] },
  { id: 'staten', name: 'Staten Island', x: 7, y: 68, w: 32, h: 25, color: '#477f54', crime: 41, trust: 61, traffic: 38, poi: ['Terminal de Balsas', 'Clínica Richmond'] }
];

export const eventTemplates = [
  { type: 'traffic', title: 'Colisão e bloqueio viário', icon: '◆', severity: 2, objective: 'Liberar rota de ambulâncias', choiceA: 'Priorizar socorro e trânsito', choiceB: 'Isolar área e investigar', trust: 2, security: 1 },
  { type: 'protest', title: 'Manifestação com foco de depredação', icon: '◈', severity: 3, objective: 'Proteger ato pacífico e isolar violência', choiceA: 'Abrir diálogo e rota segura', choiceB: 'Reforçar perímetro proporcional', trust: 4, security: 1 },
  { type: 'robbery', title: 'Roubo a remessa comercial', icon: '⬟', severity: 3, objective: 'Proteger civis e preservar provas', choiceA: 'Despachar patrulha e perícia', choiceB: 'Monitorar saídas e negociar', trust: 1, security: 4 },
  { type: 'missing', title: 'Pessoa desaparecida', icon: '◎', severity: 3, objective: 'Localizar com prioridade e cuidado', choiceA: 'Mobilizar busca interagências', choiceB: 'Priorizar análise de pistas', trust: 3, security: 2 },
  { type: 'health', title: 'Sobrecarga hospitalar', icon: '✚', severity: 4, objective: 'Apoiar logística de saúde com EPI', choiceA: 'Proteger rotas hospitalares', choiceB: 'Realocar equipe com kit EPI', trust: 3, security: 0 },
  { type: 'blackout', title: 'Apagão em infraestrutura crítica', icon: 'ϟ', severity: 4, objective: 'Proteger infraestrutura e serviços', choiceA: 'Priorizar hospitais e transporte', choiceB: 'Solicitar inspeção e reforço', trust: 2, security: 2 }
];

export const vehiclesCatalog = [
  { type: 'sedan', name: 'Sedan de patrulha', price: 45000, crew: 2, eta: 8, upkeep: 900 },
  { type: 'suv', name: 'SUV de resposta', price: 72000, crew: 4, eta: 6, upkeep: 1450 },
  { type: 'transport', name: 'Veículo de transporte', price: 95000, crew: 6, eta: 10, upkeep: 1800 }
];

export const candidates = [
  { id: 'C01', name: 'Maya Brooks', role: 'Patrulheira', salary: 6200, competence: 72, ethics: 88, shift: 'A' },
  { id: 'C02', name: 'Daniel Ortiz', role: 'Investigador', salary: 8400, competence: 81, ethics: 78, shift: 'B' },
  { id: 'C03', name: 'Priya Shah', role: 'Analista', salary: 7600, competence: 86, ethics: 91, shift: 'A' },
  { id: 'C04', name: 'Marcus Green', role: 'Operador de despacho', salary: 5900, competence: 74, ethics: 84, shift: 'C' },
  { id: 'C05', name: 'Elena Park', role: 'Técnica de perícia', salary: 7900, competence: 83, ethics: 92, shift: 'B' },
  { id: 'C06', name: 'Noah Williams', role: 'Patrulheiro', salary: 6100, competence: 69, ethics: 82, shift: 'C' },
  { id: 'C07', name: 'Sofia Mendes', role: 'Apoio de saúde', salary: 6800, competence: 77, ethics: 94, shift: 'A' },
  { id: 'C08', name: 'Ethan Cole', role: 'Técnico de manutenção', salary: 6400, competence: 75, ethics: 80, shift: 'B' }
];

export const roomCatalog = [
  { type: 'investigation', name: 'Sala de investigação', cost: 120000, capacity: 4, benefit: 'Acelera o caso Arquivo Ponte', icon: '⌕', w: 2, h: 2 },
  { type: 'dispatch', name: 'Central de despacho', cost: 160000, capacity: 2, benefit: '+1 ocorrência simultânea', icon: '⌁', w: 2, h: 2 },
  { type: 'garage', name: 'Garagem L1', cost: 85000, capacity: 4, benefit: '+4 vagas de frota', icon: '▣', w: 3, h: 2 }
];

export const phoneTopics = {
  P01: { label: 'Revisar compromissos', result: 'Você revisou as prioridades e reduziu a pressão imediata.', effects: { politicalPressure: -1 } },
  P02: { label: 'Redistribuir patrulhas', result: 'O Capitão James moveu uma equipe para o distrito mais pressionado.', effects: { morale: -1, security: 2 } },
  P03: { label: 'Avaliar prontidão da ESU', result: 'Kevin entregou avaliação de risco e manteve a equipe de sobreaviso.', effects: { operationsReadiness: 4 } },
  P04: { label: 'Organizar agenda crítica', result: 'Brithney reorganizou prazos e lembrou promessas pendentes.', effects: { politicalPressure: -2 } },
  P05: { label: 'Priorizar Arquivo Ponte', result: 'O Detetive James dedicou uma janela de análise ao caso.', effects: { caseProgress: 12 } },
  P06: { label: 'Buscar apoio comunitário', result: 'O vice-prefeito abriu reunião com lideranças e pediu transparência.', effects: { trust: 3, politicalPressure: 1 } },
  P07: { label: 'Solicitar margem orçamentária', result: 'Allan autorizou US$ 100 mil, condicionado a relatório em 48h.', effects: { cash: 100000, mayorTrust: -2, promise: 'Relatório financeiro ao prefeito' } },
  P08: { label: 'Solicitar apoio estadual', result: 'Elliot recebeu o pedido formal e exigiu evidências de capacidade esgotada.', effects: { stateRequest: true, politicalPressure: 1 } },
  P09: { label: 'Coordenar trânsito regional', result: 'Kevin Johnson reservou uma equipe estadual para rotas hospitalares.', effects: { trust: 1, operationsReadiness: 3 } },
  P10: { label: 'Consultar disponibilidade', result: 'O General Brown explicou que mobilização depende de autorização do governador.', effects: { guardBriefed: true } },
  P11: { label: 'Enviar informe institucional', result: 'O gabinete presidencial registrou o informe; contato direto permanece bloqueado.', effects: { federalBriefed: true } },
  P12: { label: 'Apresentar indício federal', result: 'Cross pediu cadeia de custódia antes de avaliar cooperação federal.', effects: { fbiBriefed: true, caseProgress: 4 } }
};

export const openingChoices = [
  { id: 'autonomy', title: 'Aceitar com autonomia administrativa', detail: '+ respeito · pacto de autonomia', effects: { mayorTrust: 2, respect: 8, cash: 0, flag: 'autonomyPact' } },
  { id: 'audit', title: 'Aceitar exigindo auditoria do orçamento', detail: '+ integridade · caixa inicial revisado', effects: { mayorTrust: -2, integrity: 7, cash: 150000, flag: 'budgetAudit' } },
  { id: 'reinforcement', title: 'Aceitar solicitando reforço emergencial', detail: '+ prontidão · pressão política', effects: { mayorTrust: 1, operationsReadiness: 8, politicalPressure: 4, flag: 'emergencyAid' } },
  { id: 'refuse', title: 'Recusar por ora', detail: 'abre segunda ligação e aceitação condicional', effects: { mayorTrust: -8, respect: 3, flag: 'hesitated' } }
];

export const newsByDay = [
  'Metrô opera parcialmente; hospitais pedem rotas livres.',
  'Conselho municipal cobra plano para a frota envelhecida.',
  'Dois chamados graves simultâneos testam nova gestão.',
  'Saúde pública alerta para doença respiratória sazonal.',
  'Corregedoria abre revisão de contratos de manutenção.',
  'FBI avalia possível conexão interestadual no Arquivo Ponte.',
  'Prefeitura convoca reunião para balanço das primeiras 72 horas.'
];

export const fixedRooms = [
  { type: 'office', name: 'Gabinete', x: 1, y: 1, w: 2, h: 2, icon: '★' },
  { type: 'reception', name: 'Recepção', x: 1, y: 5, w: 3, h: 2, icon: '↳' },
  { type: 'briefing', name: 'Plantão', x: 5, y: 1, w: 3, h: 2, icon: '▤' }
];
