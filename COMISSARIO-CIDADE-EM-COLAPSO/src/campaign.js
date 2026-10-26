export const chapters = [
  { id: 'A0', title: 'A Ligação', fromDay: 0, summary: 'Autonomia, orçamento e uma cidade que precisa voltar a respirar.', speaker: 'P04', choices: [
    { id:'community', title:'Ouvir as comunidades', text:'Reuniões abertas e proteção das manifestações pacíficas.', effects:{trust:5,politicalPressure:2}, delay:1 },
    { id:'fleet', title:'Recuperar a capacidade de resposta', text:'Reparo emergencial e redistribuição da frota.', effects:{cash:-25000,operationsReadiness:8},delay:1 },
    { id:'audit', title:'Auditar os contratos herdados', text:'Acesso a documentos e preservação de provas.', effects:{integrity:5,mayorTrust:-2,caseProgress:8},delay:1 }
  ] },
  { id:'A1', title:'Cidade Ferida', fromDay:7, summary:'A mobilização pacífica cresce. Equipes exaustas enfrentam crimes oportunistas.', speaker:'P02', choices:[
    { id:'dialogue',title:'Criar mediação comunitária',text:'Rotas seguras, diálogo e apoio aos serviços de saúde.',effects:{trust:7,security:2,cash:-20000}},
    { id:'coverage',title:'Redistribuir cobertura',text:'Mais presença nos distritos sem ampliar a jornada.',effects:{security:5,morale:2,politicalPressure:2}},
    { id:'overtime',title:'Autorizar plantão extraordinário',text:'Resposta rápida tem custo e aumenta a fadiga.',effects:{security:7,morale:-4,cash:-60000}}
  ] },
  { id:'A2',title:'Sombras da Instituição',fromDay:28,summary:'A revisão da frota liga notas fiscais falsas a uma sabotagem no depósito.',speaker:'P05',choices:[
    {id:'independent',title:'Instaurar auditoria independente',text:'Preservar contratos e dar acesso à corregedoria.',effects:{integrity:9,mayorTrust:-3,caseProgress:12,cash:-30000}},
    {id:'procurement',title:'Suspender os contratos suspeitos',text:'Restringe compras desse fornecedor por uma semana.',effects:{integrity:6,operationsReadiness:-3}},
    {id:'evidence',title:'Priorizar perícia financeira',text:'Os investigadores confirmam a origem das remessas.',effects:{caseProgress:18,cash:-18000}}
  ] },
  {id:'A3',title:'As Linhas Invisíveis',fromDay:56,summary:'Remessas atravessam fronteiras estaduais. A competência federal precisa de documentação.',speaker:'P12',choices:[
    {id:'joint',title:'Formalizar força de investigação conjunta',text:'Compartilhar provas sob protocolo e preservar custódia.',effects:{integrity:4,caseProgress:15},flag:'federalNexus'},
    {id:'local',title:'Manter a liderança municipal',text:'Concluir diligências locais antes de transferir dados.',effects:{security:3,politicalPressure:3}},
    {id:'lab',title:'Solicitar laboratório federal',text:'Laudos independentes com prazo de entrega.',effects:{caseProgress:12,cash:-10000},flag:'federalNexus'}
  ]},
  {id:'A4',title:'Inverno Crítico',fromDay:90,summary:'Surto respiratório e falhas de energia pressionam hospitais e efetivo.',speaker:'P04',choices:[
    {id:'protection',title:'Adquirir EPI e reduzir exposição',text:'Equipamento para equipes de apoio e turnos sustentáveis.',effects:{health:9,morale:3,cash:-35000}},
    {id:'logistics',title:'Priorizar corredores hospitalares',text:'Coordenação com saúde pública e transporte.',effects:{health:6,trust:3,operationsReadiness:-2}},
    {id:'state',title:'Pedir auxílio estadual documentado',text:'A governadoria avalia recursos para infraestrutura.',effects:{politicalPressure:2,health:4},flag:'stateRequest'}
  ]},
  {id:'A5',title:'O Estado Intervém',fromDay:150,summary:'Recursos municipais escassos exigem prestação de contas e cooperação estadual.',speaker:'P08',choices:[
    {id:'grant',title:'Aceitar subvenção com auditoria',text:'US$ 300 mil vinculados ao plano de recuperação.',effects:{cash:300000,integrity:3,politicalPressure:3},flag:'stateAuthorized'},
    {id:'maintenance',title:'Reprogramar obras e preservar serviços',text:'Recuperar caixa sem retirar cobertura essencial.',effects:{cash:80000,operationsReadiness:-3}},
    {id:'hearing',title:'Apresentar prioridades em audiência',text:'Defender orçamento e abrir os indicadores ao público.',effects:{trust:6,mayorTrust:3}}
  ]},
  {id:'A6',title:'A Cidade Decide',fromDay:240,summary:'A audiência final mede resultados, legitimidade e sustentabilidade da gestão.',speaker:'P07',choices:[
    {id:'transparency',title:'Publicar o balanço integral',text:'Expor avanços e falhas, incluindo contratos e disciplina.',effects:{integrity:7,trust:5}},
    {id:'continuity',title:'Priorizar um pacto de continuidade',text:'Acordo público com metas e revisão independente.',effects:{trust:4,mayorTrust:5,politicalPressure:-6}},
    {id:'recovery',title:'Apresentar recuperação responsável',text:'Reserva financeira e cobertura dos serviços essenciais.',effects:{operationsReadiness:4,morale:5}}
  ]}
];

export function pendingChapter(state){
  if(state.career?.status==='dismissed')return null;
  const next=chapters.find(c=>!state.campaignDecisions?.some(d=>d.chapterId===c.id));
  if(!next)return null;
  const previous=state.campaignDecisions?.at(-1);
  const available=Math.max(next.fromDay,previous?previous.day+2:0);
  return state.day>=available?next:null;
}
export function currentChapter(state){
  return pendingChapter(state)||chapters.find(c=>c.id===state.campaignDecisions?.at(-1)?.chapterId)||chapters[0];
}

export const caseTasks = [
  {id:'cameras',title:'Revisar câmeras do armazém',description:'Conferir horários e integridade do arquivo.',duration:120,cost:0,progress:18},
  {id:'plates',title:'Confrontar placas e manifesto',description:'Verificar divergências sem presumir culpabilidade.',duration:180,cost:0,progress:22},
  {id:'access',title:'Periciar o controle de acesso',description:'Exige sala de perícia ou serviço externo.',duration:240,cost:18000,progress:28},
  {id:'witness',title:'Ouvir testemunha protegida',description:'Entrevista documentada, com protocolo de proteção.',duration:180,cost:0,progress:22}
];

export const additionalRooms = [
  {type:'forensics',name:'Laboratório de perícia',cost:120000,capacity:3,benefit:'Laudos internos e análise de provas',icon:'case',w:2,h:2,buildMinutes:240},
  {type:'maintenance',name:'Oficina de manutenção',cost:90000,capacity:2,benefit:'Reduz custo e prazo de reparo',icon:'wrench',w:2,h:2,buildMinutes:180},
  {type:'training',name:'Centro de treinamento',cost:75000,capacity:4,benefit:'Treino de competência e protocolos',icon:'shield',w:2,h:2,buildMinutes:180},
  {type:'medical',name:'Apoio e recuperação',cost:65000,capacity:3,benefit:'Recupera fadiga e disponibilidade',icon:'staff',w:2,h:2,buildMinutes:120}
];

export function resolutionLabel(state) {
  if (state.finance.cash < 30000) return 'Reconstrução sob pressão fiscal';
  if (state.city.integrity < 30 || state.city.trust < 25) return 'Crise de legitimidade';
  if (state.city.trust >= 60 && state.city.integrity >= 65) return 'Reconstrução responsável';
  return 'Legado em construção';
}
