// Part 4 narrative catalogue. All situations and authorities are fictional.
// Delays are game minutes, not wall-clock timers. The scheduler, not this file,
// chooses when an eligible situation begins and prevents simultaneous crises.
const choice = (id, title, detail, effects, result) => ({ id, title, detail, effects, result });
const stage = (id, title, body, delayMinutes, personId, choices) => ({ id, title, body, delayMinutes, personId, choices });

export const crisisTemplates = [
  {
    id: 'water-and-hospitals', title: 'Água interrompida no distrito', scope: 'local',
    minDay: 7, weight: 5, cooldownDays: 35, requirements: [],
    stages: [
      stage('notice', 'Um aviso da rede de abastecimento', 'Uma ruptura na rede deixou quarteirões sem água. A concessionária ainda estima a duração do reparo; uma clínica pede apoio para manter o atendimento. O problema começou localizado e a central acompanha sua evolução.', 360, 'P04', [
        choice('coordinate', 'Reunir serviços e proteger o atendimento', 'US$ 12 mil para coordenação temporária e transporte de apoio.', { cash: -12000, health: 3, operationsReadiness: -1 }, 'Saúde, transportes e concessionária receberam uma pauta comum. Uma atualização técnica chegará após o primeiro turno de reparos.'),
        choice('local-plan', 'Manter atendimento com a estrutura existente', 'Organizar o apoio local sem contratação emergencial; cobertura fica mais apertada.', { health: 1, morale: -2, politicalPressure: 1 }, 'As equipes existentes reorganizaram o atendimento. A capacidade disponível será reavaliada no próximo boletim.'),
        choice('wait', 'Aguardar confirmação antes de mobilizar apoio', 'Preserva recursos agora, mas a clínica fica sem coordenação adicional.', { health: -3, trust: -2, politicalPressure: 2 }, 'A secretaria registrou a decisão de aguardar. A clínica reiterou o pedido e a prefeitura acompanhará o prazo de resposta.')
      ]),
      stage('supply', 'O reparo vai atravessar a noite', 'O relatório técnico ampliou o prazo. Moradores precisam de informação confiável e a clínica reorganizou a agenda. O comando deve apoiar os serviços civis sem assumir atribuições técnicas da concessionária.', 720, 'P06', [
        choice('assistance', 'Financiar apoio temporário aos serviços', 'US$ 18 mil para transporte e atendimento às pessoas mais afetadas.', { cash: -18000, health: 4, trust: 3 }, 'O apoio temporário foi pactuado com os serviços responsáveis. A prefeitura publicará horários e canais de atendimento.'),
        choice('verified-updates', 'Publicar boletins e acompanhar os pedidos', 'Mantém informação verificável e cobertura local, com menor margem de resposta.', { trust: 2, integrity: 1, morale: -1 }, 'Os boletins passaram a distinguir fatos confirmados de previsões. As solicitações foram registradas para acompanhamento.'),
        choice('promise-deadline', 'Anunciar uma normalização sem confirmação', 'Alivia a cobrança imediata, mas cria um compromisso sem base técnica.', { mayorTrust: 1, integrity: -5, trust: -3, politicalPressure: 3 }, 'A concessionária não confirmou o horário anunciado. A divergência foi registrada pela imprensa e pelo conselho comunitário.')
      ]),
      stage('review', 'O serviço retorna; as cobranças permanecem', 'O abastecimento foi restabelecido. As famílias atingidas e a clínica querem saber o que será feito com os pedidos pendentes. A avaliação considera o apoio prestado durante a interrupção.', 0, 'P04', [
        choice('public-review', 'Publicar o balanço e encaminhar pendências', 'Conferir despesas, registrar falhas e devolver os pedidos aos órgãos responsáveis.', { integrity: 3, trust: 2, politicalPressure: -2 }, 'O balanço separou a responsabilidade de cada órgão e fixou acompanhamento para os pedidos que ficaram abertos.'),
        choice('repair-readiness', 'Repor recursos antes do próximo turno', 'US$ 7 mil para recompor equipamentos e aliviar as equipes.', { cash: -7000, morale: 3, operationsReadiness: 2 }, 'Os materiais foram repostos e a escala normal voltou a funcionar. A memória do atendimento permanece no registro.'),
        choice('close-without-review', 'Encerrar sem revisar as reclamações', 'Poupa trabalho administrativo, mas deixa as falhas sem resposta.', { integrity: -3, trust: -4, politicalPressure: 2 }, 'A ocorrência técnica terminou, mas os pedidos sem resposta foram incluídos na avaliação da gestão.')
      ])
    ]
  },
  {
    id: 'regional-storm', title: 'Temporal sobre a região', scope: 'state',
    minDay: 14, weight: 3, cooldownDays: 65, requirements: [],
    stages: [
      stage('forecast', 'Previsão de tempo severo', 'A defesa civil estadual compartilhou um alerta para as próximas horas. Ainda não há um desastre instalado. Hospitais e transportes revisam sua continuidade e pedem um interlocutor no comando municipal.', 720, 'P08', [
        choice('prepare', 'Preparar apoio com os órgãos responsáveis', 'US$ 22 mil para prontidão, descanso planejado e coordenação de serviços.', { cash: -22000, operationsReadiness: 4, health: 2, stateRequest: true }, 'A preparação foi formalizada. A governadoria recebeu a estimativa de capacidade municipal e acompanhará a evolução do tempo.'),
        choice('limited', 'Preparar apenas os serviços mais vulneráveis', 'US$ 9 mil e uma reserva menor para o restante da cidade.', { cash: -9000, health: 2, operationsReadiness: 1 }, 'Hospitais e terminais prioritários receberam atenção. As demais áreas seguem na rotina, com capacidade adicional limitada.'),
        choice('dismiss-alert', 'Manter a rotina sem rever o plano', 'Preserva caixa, mas ignora a oportunidade de preparação.', { operationsReadiness: -4, politicalPressure: 2 }, 'A decisão de manter o plano foi registrada. A defesa civil reiterou que a previsão exige acompanhamento.')
      ]),
      stage('outage', 'Interrupções em mais de um município', 'O temporal interrompeu energia e transporte em áreas da região. A governadoria oferece um acordo de assistência civil; reforço estadual depende de missão, prazo e responsabilidades documentados.', 1440, 'P08', [
        choice('formal-support', 'Aceitar assistência estadual documentada', 'US$ 15 mil de contrapartida logística e prestação de contas.', { cash: -15000, stateAuthorized: true, operationsReadiness: 4, health: 3, politicalPressure: 1 }, 'A governadoria autorizou apoio delimitado a serviços essenciais. As chefias municipais mantêm suas atribuições e registrarão a utilização dos recursos.'),
        choice('municipal-capacity', 'Sustentar o apoio com recursos municipais', 'US$ 28 mil para preservar autonomia e atendimento, com maior esforço do efetivo.', { cash: -28000, health: 3, morale: -3, operationsReadiness: -1 }, 'O plano municipal foi ampliado. A capacidade ficará pressionada até o encerramento do atendimento emergencial.'),
        choice('minimize-disruption', 'Divulgar que a situação já está normalizada', 'A informação contraria os relatos confirmados de hospitais e transportes.', { trust: -6, integrity: -5, health: -2, politicalPressure: 4 }, 'Os órgãos de serviço contestaram a nota. A divergência entre o informe público e os registros entrou no processo de avaliação.')
      ]),
      stage('recovery', 'Da emergência à recuperação', 'O tempo melhorou e a maioria dos serviços voltou. Permanecem famílias deslocadas, equipamentos desgastados e pedidos de explicação sobre a distribuição do apoio.', 0, 'P09', [
        choice('accountability', 'Concluir uma avaliação conjunta', 'Publicar recursos usados, prioridades e pendências de cada esfera.', { integrity: 4, trust: 3, politicalPressure: -3 }, 'Município e estado concluíram o balanço sem transferir responsabilidades indevidamente. As pendências terão acompanhamento periódico.'),
        choice('restore-teams', 'Priorizar descanso e recomposição', 'US$ 12 mil para recuperar a prontidão sem prolongar a escala extraordinária.', { cash: -12000, morale: 4, operationsReadiness: 3 }, 'A escala foi normalizada e os recursos de apoio retornaram à disponibilidade.'),
        choice('skip-records', 'Liberar o apoio sem fechar os registros', 'A recuperação imediata avança, mas despesas e responsabilidades ficam sem conferência.', { operationsReadiness: 1, integrity: -5, politicalPressure: 4 }, 'A fiscalização solicitou os registros que não foram encerrados. A pendência permanecerá na avaliação do comissário.')
      ])
    ]
  },
  {
    id: 'regional-transit', title: 'Transporte regional interrompido', scope: 'state',
    minDay: 21, weight: 3, cooldownDays: 75, requirements: [],
    stages: [
      stage('interruption', 'Interdição técnica no corredor ferroviário', 'Uma falha de infraestrutura suspendeu uma ligação regional. A operadora dirige a inspeção técnica; o município deve proteger passageiros e apoiar a continuidade dos serviços, sem pressionar por uma reabertura prematura.', 360, 'P02', [
        choice('passenger-care', 'Apoiar passageiros e acessos hospitalares', 'US$ 14 mil para orientação, acessibilidade e coordenação de transporte.', { cash: -14000, trust: 3, health: 2, operationsReadiness: -1 }, 'O atendimento aos passageiros foi organizado com a operadora e os serviços municipais. A inspeção técnica continua independente.'),
        choice('shift-coverage', 'Redistribuir a cobertura disponível', 'Concentrar orientação nos terminais, reduzindo temporariamente a cobertura de rotina.', { trust: 1, security: -1, morale: -2 }, 'As chefias ajustaram a escala. Outras áreas foram informadas sobre a redução temporária de disponibilidade.'),
        choice('ignore-passengers', 'Tratar o caso como responsabilidade exclusiva da operadora', 'Evita custo direto, mas deixa sem resposta os pedidos de apoio municipal.', { trust: -4, health: -2, politicalPressure: 3 }, 'A operadora continuou a inspeção, enquanto reclamações sobre o atendimento municipal chegaram à prefeitura.')
      ]),
      stage('coordination', 'O impacto cruza a divisa municipal', 'Os desvios afetam municípios vizinhos. A polícia estadual propõe uma mesa de coordenação com transportes e saúde; qualquer mobilização adicional será encaminhada à autoridade competente.', 720, 'P09', [
        choice('joint-table', 'Formalizar coordenação regional', 'Compartilhar dados de atendimento e respeitar as atribuições de cada órgão.', { operationsReadiness: 3, integrity: 2, stateRequest: true }, 'A mesa regional consolidou pedidos e prioridades. Nenhuma unidade foi mobilizada fora de sua autorização.'),
        choice('municipal-liaison', 'Designar um interlocutor municipal', 'US$ 6 mil para manter acompanhamento local e troca de informações.', { cash: -6000, trust: 2, politicalPressure: -1 }, 'O interlocutor passou a atualizar o comando e a prefeitura com informações verificadas.'),
        choice('announce-reopening', 'Prometer reabertura antes do laudo', 'Cria uma expectativa pública que o comando não tem competência técnica para garantir.', { integrity: -5, trust: -4, politicalPressure: 3 }, 'A operadora manteve a interdição e esclareceu que a promessa não correspondia ao laudo. O episódio foi registrado para revisão.')
      ]),
      stage('normalization', 'Retomada gradual do transporte', 'A operadora liberou o serviço por etapas após a inspeção. Ainda há reclamações e atrasos acumulados; o retorno exige uma transição de escala e informação clara.', 0, 'P06', [
        choice('phased-return', 'Acompanhar a retomada e publicar o balanço', 'Concluir o apoio com informação verificada e encaminhamento das reclamações.', { trust: 3, integrity: 2, morale: 1 }, 'A transição foi comunicada e as queixas receberam destino definido. A rotina volta sem apagar os registros do atendimento.'),
        choice('team-recovery', 'Repor a cobertura nos bairros', 'Priorizar a volta das equipes à rotina, mantendo um canal de acompanhamento.', { security: 3, operationsReadiness: 2, trust: -1 }, 'A cobertura dos bairros foi recomposta. O atendimento administrativo às reclamações seguirá com uma equipe menor.'),
        choice('close-complaints', 'Arquivar os pedidos ainda não respondidos', 'Encerra a carga administrativa sem tratar as falhas relatadas.', { trust: -4, integrity: -3, politicalPressure: 2 }, 'Moradores e serviços contestaram o arquivamento. Os pedidos pendentes foram associados à avaliação da gestão.')
      ])
    ]
  },
  {
    id: 'procurement-review', title: 'Contratos sob suspeita', scope: 'local',
    minDay: 28, weight: 3, cooldownDays: 90, requirements: [],
    stages: [
      stage('discrepancy', 'Uma conferência encontra divergências', 'A conferência periódica identificou pagamentos sem documentação suficiente em um contrato de manutenção. Há indícios para apurar, não uma conclusão sobre culpa. A corregedoria pede preservação dos registros.', 1440, 'P05', [
        choice('independent-review', 'Dar acesso à revisão independente', 'US$ 16 mil para conferência externa e continuidade dos serviços essenciais.', { cash: -16000, integrity: 4, politicalPressure: 2 }, 'Os registros foram preservados e a revisão recebeu autonomia. Os responsáveis serão ouvidos antes de qualquer conclusão.'),
        choice('internal-check', 'Abrir conferência interna com prazo público', 'US$ 7 mil para apuração inicial documentada, com possibilidade de encaminhamento externo.', { cash: -7000, integrity: 2, mayorTrust: -1 }, 'A conferência interna começou com escopo e prazo registrados. A corregedoria acompanhará os resultados.'),
        choice('delay-records', 'Adiar o acesso aos documentos', 'Poupa desgaste político imediato, mas compromete a transparência da gestão.', { integrity: -6, trust: -2, politicalPressure: 4 }, 'A demora foi formalmente registrada. A apuração passou a incluir as razões pelas quais o acesso não foi concedido.')
      ]),
      stage('findings', 'O relatório preliminar chega à mesa', 'A revisão confirmou falhas de controle e recomendou ouvir fornecedores e servidores. O relatório não autoriza punições sumárias nem permite ignorar as irregularidades documentadas.', 2880, 'P05', [
        choice('due-process', 'Encaminhar os indícios e garantir defesa', 'Separar apuração disciplinar, eventual investigação e continuidade dos serviços.', { integrity: 5, trust: 2, politicalPressure: 1 }, 'As competências foram delimitadas. Os indícios seguiram aos órgãos responsáveis, com acesso à defesa e preservação da documentação.'),
        choice('control-reform', 'Corrigir controles e ampliar a auditoria', 'US$ 20 mil para revisão dos processos sem antecipar o resultado da apuração.', { cash: -20000, integrity: 3, operationsReadiness: 2 }, 'Novos controles entraram em implantação. A auditoria continuará até esclarecer os pagamentos questionados.'),
        choice('close-inquiry', 'Encerrar a apuração para evitar desgaste', 'A decisão contradiz o relatório já recebido.', { integrity: -8, trust: -4, mayorTrust: -3, politicalPressure: 5 }, 'O encerramento foi contestado pelos órgãos de controle. A responsabilidade do comando será examinada na avaliação institucional.')
      ]),
      stage('accountability', 'A instituição cobra uma resposta', 'A fase inicial da revisão terminou. O comissário deve explicar as providências e demonstrar como impedirá a repetição das falhas, respeitando os dados protegidos e os processos em andamento.', 0, 'P07', [
        choice('publish-measures', 'Publicar medidas e assumir as falhas da gestão', 'Informar o que foi verificado, o que permanece sob apuração e os prazos de correção.', { integrity: 4, trust: 3, mayorTrust: 2, politicalPressure: -2 }, 'A prestação de contas reconheceu limites e responsabilidades. O acompanhamento das medidas permanece aberto.'),
        choice('independent-monitor', 'Aceitar acompanhamento independente', 'US$ 10 mil para uma conferência de execução no próximo ciclo.', { cash: -10000, integrity: 4, mayorTrust: 1 }, 'O acompanhamento foi pactuado e as chefias receberam os indicadores que serão cobrados.'),
        choice('blame-without-proof', 'Atribuir toda a culpa a servidores sem conclusão', 'Tenta afastar responsabilidade do comando, mas antecipa culpa e fragiliza a confiança.', { integrity: -6, morale: -5, trust: -3, politicalPressure: 3 }, 'As declarações foram contestadas. A avaliação da gestão incluirá a comunicação e o respeito ao devido processo.')
      ])
    ]
  },
  {
    id: 'public-health-pressure', title: 'Serviços de saúde sob pressão', scope: 'state',
    minDay: 35, weight: 3, cooldownDays: 80, requirements: [],
    stages: [
      stage('advisory', 'A saúde pública emite um aviso', 'A rede de saúde registra aumento de internações e ausências nas equipes. As autoridades sanitárias dirigem a resposta clínica. O comando precisa planejar proteção dos trabalhadores e apoio à continuidade dos serviços.', 1440, 'P04', [
        choice('protect-staff', 'Reforçar proteção e escala sustentável', 'US$ 18 mil para materiais aprovados e substituições planejadas.', { cash: -18000, health: 4, morale: 3 }, 'A escala e os materiais foram revistos com orientação da saúde. As próximas necessidades serão avaliadas no boletim do dia seguinte.'),
        choice('prioritize-support', 'Concentrar o apoio nos serviços essenciais', 'Reduz disponibilidade geral para preservar hospitais e transporte assistencial.', { health: 3, operationsReadiness: -2, trust: 1 }, 'Hospitais receberam interlocução direta. Os demais setores foram informados sobre a capacidade temporariamente reduzida.'),
        choice('keep-all-shifts', 'Manter as escalas sem adaptações', 'Preserva a cobertura imediata, aumentando a pressão sobre trabalhadores já afetados.', { operationsReadiness: 1, health: -4, morale: -4 }, 'As chefias registraram a manutenção da escala e alertaram para o risco de novas ausências.')
      ]),
      stage('capacity', 'As ausências alcançam outros serviços', 'A rede estadual propõe compartilhar informações de capacidade e apoio logístico. Não cabe ao comissário definir tratamento ou restrições sanitárias; sua responsabilidade é coordenar os recursos do departamento.', 1440, 'P08', [
        choice('state-coordination', 'Pactuar apoio com saúde e estado', 'US$ 12 mil de apoio administrativo e logístico, com atribuições claras.', { cash: -12000, health: 4, stateRequest: true, integrity: 2 }, 'O pacto delimitou responsabilidades. As decisões sanitárias permanecem com as autoridades de saúde.'),
        choice('local-continuity', 'Reforçar o plano municipal de continuidade', 'US$ 20 mil para cobrir afastamentos e preservar o atendimento essencial.', { cash: -20000, health: 3, morale: 2 }, 'O plano municipal protegeu a continuidade dos serviços. Os custos entrarão no próximo balanço financeiro.'),
        choice('unverified-message', 'Desconsiderar o boletim sanitário na comunicação', 'A mensagem contradiz a orientação técnica já recebida.', { trust: -5, integrity: -4, health: -3, politicalPressure: 4 }, 'A autoridade sanitária corrigiu a informação. A falha de comunicação foi registrada para avaliação.')
      ]),
      stage('review', 'A demanda começa a estabilizar', 'As internações pararam de crescer e as escalas podem ser revistas. Ainda há trabalhadores em recuperação e serviços com tarefas acumuladas. O fim do alerta não apaga as decisões tomadas durante a pressão.', 0, 'P04', [
        choice('gradual-return', 'Organizar retorno gradual e descanso', 'US$ 8 mil para recomposição de equipes e materiais.', { cash: -8000, health: 3, morale: 4 }, 'O retorno foi planejado com as chefias e a saúde ocupacional. A recuperação será acompanhada nos turnos seguintes.'),
        choice('review-plan', 'Revisar o plano de continuidade', 'Conferir falhas de coordenação e incorporar as lições ao próximo ciclo.', { integrity: 3, operationsReadiness: 3, trust: 1 }, 'O plano atualizado registrou o que funcionou e os limites encontrados pela gestão.'),
        choice('immediate-normality', 'Declarar retorno integral sem rever as ausências', 'A cobrança por normalidade ignora trabalhadores ainda afastados.', { morale: -5, health: -2, politicalPressure: 2 }, 'A declaração não coincidiu com a capacidade real das equipes. As chefias registraram a divergência.')
      ])
    ]
  },
  {
    id: 'credible-security-alert', title: 'Alerta de ameaça com nexo federal', scope: 'federal',
    minDay: 45, weight: 1, cooldownDays: 120, requirements: ['federalNexus'],
    stages: [
      stage('verified-alert', 'Um alerta chega por canal verificado', 'A equipe federal de ligação compartilhou informações sobre uma ameaça sob investigação. Há fundamento para coordenação, mas não para atribuir culpa publicamente. O comando municipal deve proteger serviços e preservar informações verificadas.', 480, 'P12', [
        choice('documented-coordination', 'Formalizar coordenação e proteção civil', 'US$ 16 mil para apoio institucional, atendimento e continuidade de serviços.', { cash: -16000, security: 3, integrity: 3, fbiBriefed: true }, 'As atribuições municipais e federais foram registradas. As atualizações serão compartilhadas por canais oficiais, sem divulgar dados que prejudiquem pessoas ou a apuração.'),
        choice('verify-first', 'Conferir o informe com a equipe responsável', 'Priorizar a validação documental e manter os serviços informados sobre a incerteza.', { integrity: 3, operationsReadiness: 1, politicalPressure: 1 }, 'O comando solicitou esclarecimentos e registrou o que está confirmado. A equipe de ligação apresentará um novo boletim.'),
        choice('public-accusation', 'Anunciar suspeitos antes de confirmação', 'A antecipação pública prejudica direitos e a confiabilidade da apuração.', { integrity: -7, trust: -5, politicalPressure: 5 }, 'As autoridades responsáveis corrigiram a declaração. Pessoas citadas sem base suficiente foram expostas e a conduta do comando será examinada.')
      ]),
      stage('assessment', 'Uma atualização reduz parte da incerteza', 'A investigação descartou rumores, manteve uma linha de apuração e pediu continuidade da cooperação. A população precisa de informação útil, sem especulações sobre autores, métodos ou alvos.', 1440, 'P12', [
        choice('verified-briefing', 'Divulgar somente informações confirmadas', 'Explicar limites, serviços disponíveis e o canal de orientação à população.', { trust: 3, integrity: 3, politicalPressure: -2 }, 'O informe público evitou especulação e manteve os canais de apoio acessíveis. A apuração continua sob as autoridades competentes.'),
        choice('support-services', 'Reforçar acolhimento e continuidade de serviços', 'US$ 14 mil para atendimento às pessoas afetadas pelo alerta.', { cash: -14000, health: 3, trust: 3, morale: -1 }, 'O apoio civil foi ampliado. As chefias acompanharão o desgaste das equipes e o uso dos recursos.'),
        choice('ignore-correction', 'Manter versões já descartadas no informe público', 'Sustenta uma narrativa que a equipe responsável já corrigiu.', { integrity: -6, trust: -5, politicalPressure: 4 }, 'A manutenção de versões descartadas foi registrada como falha de comunicação e de prestação de contas.')
      ]),
      stage('follow-up', 'O alerta imediato é encerrado', 'A autoridade responsável encerrou o nível imediato de alerta. A investigação pode continuar sem manter toda a cidade em emergência. É hora de recompor os serviços e avaliar os efeitos das decisões.', 0, 'P06', [
        choice('public-balance', 'Prestar contas e normalizar a rotina', 'Publicar os efeitos sobre serviços, recursos e direitos, preservando dados protegidos.', { trust: 3, integrity: 4, politicalPressure: -3 }, 'O balanço distinguiu o alerta encerrado da investigação que permanece. A rotina foi recomposta com responsabilidades claras.'),
        choice('care-and-rest', 'Priorizar apoio às pessoas e descanso das equipes', 'US$ 9 mil para recompor a capacidade de atendimento.', { cash: -9000, health: 3, morale: 4 }, 'O apoio continuado recebeu um plano de transição. As equipes retornam aos turnos normais sem abandonar as pessoas afetadas.'),
        choice('claim-victory', 'Atribuir ao comando resultados não comprovados', 'Ganha visibilidade imediata, mas distorce as conclusões oficiais.', { mayorTrust: 1, integrity: -5, trust: -3, politicalPressure: 3 }, 'A autoridade responsável não confirmou os resultados anunciados. A divergência foi anexada à avaliação da gestão.')
      ])
    ]
  },
  {
    id: 'public-attack-aftermath', title: 'Resposta a um ataque contra civis', scope: 'federal',
    minDay: 90, weight: 1, cooldownDays: 180, requirements: ['federalNexus'],
    stages: [
      stage('civilian-response', 'Socorro e informação confirmada', 'Um ataque criminoso deixou pessoas feridas em um espaço público fictício. Socorristas e autoridades responsáveis já atuam; a conexão federal foi documentada. O comissário deve coordenar apoio às vítimas, serviços e comunicação, sem antecipar autoria ou motivação.', 360, 'P02', [
        choice('victim-support', 'Priorizar vítimas e continuidade do atendimento', 'US$ 28 mil para apoio às famílias, acessibilidade e coordenação com saúde.', { cash: -28000, health: 5, trust: 3, operationsReadiness: -2 }, 'O atendimento às vítimas e famílias foi organizado com os serviços responsáveis. As informações recebidas serão verificadas antes da próxima atualização.'),
        choice('document-and-support', 'Concentrar apoio institucional e preservação de registros', 'US$ 16 mil para ligação entre serviços e documentação, com menor margem de atendimento extra.', { cash: -16000, integrity: 3, security: 2, health: 1 }, 'As equipes receberam responsabilidades claras para o apoio civil e a preservação documental. A prefeitura acompanhará a demanda de atendimento.'),
        choice('speculate', 'Atribuir motivação antes da apuração', 'A especulação pública expõe pessoas e amplia o risco de desinformação.', { integrity: -8, trust: -5, politicalPressure: 5 }, 'As autoridades competentes corrigiram a declaração. A comunicação do comando foi incorporada à revisão institucional.')
      ]),
      stage('cooperation', 'O apoio precisa durar além das primeiras horas', 'A governadoria oferece assistência civil documentada. Famílias ainda procuram informação, hospitais acompanham os feridos e a investigação segue com os órgãos competentes. Recursos não podem ser prometidos sem autorização.', 1440, 'P08', [
        choice('authorized-aid', 'Pactuar assistência estadual às vítimas', 'US$ 18 mil de contrapartida e acompanhamento público da aplicação.', { cash: -18000, stateAuthorized: true, health: 4, trust: 3, integrity: 2 }, 'A governadoria autorizou assistência civil com missão e prazo definidos. O município mantém a responsabilidade pelo atendimento local.'),
        choice('local-aid', 'Sustentar a assistência com capacidade municipal', 'US$ 30 mil para manter apoio direto, pressionando a margem financeira.', { cash: -30000, health: 4, morale: -2, trust: 2 }, 'O apoio municipal foi prorrogado. A próxima avaliação financeira deverá considerar o compromisso assumido.'),
        choice('redirect-care', 'Encerrar o apoio para recuperar a rotina imediatamente', 'Libera equipes, mas interrompe o acompanhamento de necessidades ainda registradas.', { operationsReadiness: 2, health: -5, trust: -6, politicalPressure: 4 }, 'As famílias e os serviços contestaram o encerramento. As necessidades sem acompanhamento permanecerão na avaliação da resposta.')
      ]),
      stage('recovery', 'Recuperação, investigação e prestação de contas', 'O atendimento emergencial deu lugar à recuperação. A investigação permanece independente e não tem desfecho imposto pelo comissário. O legado da resposta dependerá do apoio às pessoas, da informação correta e da prestação de contas.', 0, 'P12', [
        choice('continued-care', 'Manter apoio e publicar um balanço responsável', 'US$ 12 mil para transição do atendimento e conferência de despesas.', { cash: -12000, trust: 4, integrity: 4, health: 2 }, 'O balanço respeitou o andamento da investigação e manteve um canal de apoio. A memória institucional registra decisões e pendências.'),
        choice('independent-review', 'Solicitar revisão independente da resposta', 'Conferir falhas e encaminhar recomendações sem interferir na apuração criminal.', { integrity: 5, operationsReadiness: 2, politicalPressure: 1 }, 'A revisão recebeu acesso aos registros da resposta. Recomendações serão acompanhadas na gestão, sem antecipar conclusões criminais.'),
        choice('suppress-failures', 'Omitir falhas conhecidas no balanço', 'Protege a imagem imediata, mas rompe a confiança quando os registros são confrontados.', { integrity: -8, trust: -6, mayorTrust: -3, politicalPressure: 5 }, 'A comparação com os registros revelou omissões. A responsabilidade do comando será considerada nas próximas avaliações.')
      ])
    ]
  }
];

const call = (id, personId, title, body, minDay, cooldownDays, choices, extra = {}) => ({
  id, personId, title, body, minDay, cooldownDays, weight: 1,
  windowHours: [8, 20], expiresMinutes: 360, requirements: [], choices, ...extra
});

export const incomingCallTemplates = [
  call('first-briefing', 'P04', 'Seu primeiro turno no gabinete', 'Comissário, as chefias estão disponíveis e a central ainda está consolidando o turno. Podemos começar pelas pessoas, pelos recursos ou pelos compromissos. Novas situações chegarão conforme o dia avançar.', 0, 365000, [
    choice('listen', 'Ouvir as chefias antes de fixar prioridades', 'Reservar a primeira janela para informações verificadas.', { morale: 1, integrity: 1 }, 'Brithney reuniu as chefias e registrou os pontos que precisam de acompanhamento. A central avisará quando surgir uma demanda de comando.'),
    choice('resources', 'Conferir disponibilidade e orçamento', 'Começar pela capacidade real de atendimento.', { operationsReadiness: 2 }, 'A secretaria consolidou o inventário e a escala. Os pedidos futuros poderão ser comparados à capacidade disponível.'),
    choice('public-agenda', 'Organizar uma agenda de prestação de contas', 'Fixar canais e compromissos sem prometer resultados antecipados.', { trust: 1, politicalPressure: -1 }, 'A agenda institucional foi aberta. Os compromissos serão acompanhados conforme a carreira avançar.')
  ], { once: true, weight: 0 }),
  call('shift-coverage', 'P02', 'Uma ausência na troca do plantão', 'Uma equipe relatou uma ausência inesperada. Ainda há cobertura, mas a troca de turno precisa de uma decisão para não transformar uma dificuldade cotidiana em desgaste acumulado.', 1, 5, [
    choice('replacement', 'Autorizar uma substituição temporária', 'US$ 3 mil para preservar cobertura e descanso.', { cash: -3000, security: 1, morale: 2 }, 'A substituição cobriu o turno sem prolongar a jornada de quem precisava descansar.'),
    choice('redistribute', 'Redistribuir a escala disponível', 'Manter a cobertura essencial com menor presença em demandas de rotina.', { operationsReadiness: -1, morale: 1 }, 'A escala foi redistribuída e as limitações foram comunicadas à central.'),
    choice('extend', 'Prolongar o plantão atual', 'Preserva a resposta imediata, mas aumenta o desgaste do efetivo.', { security: 1, morale: -3 }, 'O plantão foi prolongado. O capitão registrou a necessidade de compensação e descanso.')
  ]),
  call('maintenance-window', 'P04', 'A oficina encontrou uma janela de serviço', 'A logística pode reservar uma revisão preventiva de equipamentos de apoio. Não é uma emergência: adiar preserva a disponibilidade agora, mas mantém o desgaste para depois.', 2, 7, [
    choice('reserve', 'Reservar a revisão preventiva', 'US$ 4 mil para materiais e conferência dos equipamentos de apoio.', { cash: -4000, operationsReadiness: 2, morale: 1 }, 'A revisão de equipamentos foi agendada. A condição mecânica das viaturas continua dependendo da manutenção de cada veículo.'),
    choice('check-first', 'Conferir prioridades antes da despesa', 'Dar prazo à logística e manter a rotina de acompanhamento.', { integrity: 1, operationsReadiness: -1 }, 'A logística recebeu uma solicitação de prioridades. O desgaste continua sendo acompanhado no inventário.'),
    choice('skip-controls', 'Dispensar a conferência preventiva', 'Economiza o serviço, mas reduz a qualidade do acompanhamento.', { operationsReadiness: -2, morale: -1 }, 'O serviço foi dispensado e a decisão ficou registrada no acompanhamento de recursos.')
  ]),
  call('community-hearing', 'P06', 'Moradores pedem uma conversa', 'Representantes de um distrito querem discutir atrasos de atendimento e informação. Eles não exigem promessas imediatas; pedem que alguém do comando escute os relatos e devolva uma resposta.', 3, 8, [
    choice('attend', 'Participar com dados e espaço para escuta', 'US$ 2 mil para organização, acessibilidade e registro da reunião.', { cash: -2000, trust: 3, politicalPressure: 1 }, 'A reunião abriu espaço aos relatos. A ata distinguiu compromissos assumidos de pedidos que ainda precisam de avaliação.'),
    choice('delegate', 'Enviar uma chefia com prazo de retorno', 'Preserva a agenda do comissário e mantém um canal responsável.', { trust: 1, integrity: 1 }, 'Uma chefia recebeu a pauta e apresentará o retorno pelos canais institucionais.'),
    choice('dismiss', 'Encerrar o pedido sem resposta', 'Libera a agenda, mas deixa a comunidade sem interlocução.', { trust: -3, politicalPressure: 2 }, 'O pedido sem resposta foi encaminhado à prefeitura e registrado pelos representantes do distrito.')
  ]),
  call('mayor-progress', 'P07', 'O prefeito quer um balanço', 'Raymond, preciso compreender o que está funcionando e onde o departamento encontrou limites. Traga números que possamos sustentar, inclusive quando o resultado ainda não for bom.', 4, 10, [
    choice('honest-balance', 'Apresentar resultados e falhas com as fontes', 'Dar ao prefeito um quadro verificável da gestão.', { integrity: 2, mayorTrust: 2, politicalPressure: -1 }, 'O prefeito recebeu o balanço e registrou os pontos que serão revistos na avaliação periódica.'),
    choice('narrow-goals', 'Pactuar poucas metas verificáveis', 'Ajustar a cobrança à capacidade real do departamento.', { mayorTrust: 1, politicalPressure: -2, operationsReadiness: 1 }, 'As metas foram ajustadas e o acompanhamento ficou definido para a próxima avaliação.'),
    choice('hide-delays', 'Omitir os atrasos do atendimento', 'Facilita a conversa, mas cria divergências com os registros da central.', { integrity: -5, mayorTrust: -2, politicalPressure: 3 }, 'Os registros de serviço contradisseram a apresentação. A divergência passará a integrar a avaliação da confiança no comando.')
  ]),
  call('case-continuity', 'P05', 'Uma conferência da investigação', 'A equipe precisa revisar a documentação de um atendimento e o encaminhamento das informações. Trata-se de uma rotina de qualidade: conferir agora evita que uma falha administrativa prejudique o trabalho mais adiante.', 5, 12, [
    choice('independent-check', 'Autorizar uma conferência independente', 'US$ 5 mil para revisão documental e garantia de qualidade.', { cash: -5000, integrity: 3 }, 'A documentação foi conferida e os pontos de correção receberam responsáveis. A revisão não substitui diligências específicas dos casos.'),
    choice('team-review', 'Reservar tempo da própria equipe', 'Revisão interna com pequeno impacto na disponibilidade imediata.', { integrity: 1, operationsReadiness: -1, morale: 1 }, 'A equipe reservou a janela e registrará os ajustes sem interromper os prazos essenciais.'),
    choice('skip-review', 'Dispensar a revisão por enquanto', 'Preserva disponibilidade, mas mantém as falhas sem conferência.', { integrity: -2, politicalPressure: 1 }, 'A revisão foi dispensada. A chefia manteve a anotação de que a documentação ainda precisa ser conferida.')
  ]),
  call('hospital-liaison', 'P04', 'Um hospital pede coordenação', 'A administração de um hospital pediu interlocução sobre acessibilidade e chegada de equipes. Não há crise generalizada; é uma dificuldade local que pode ser resolvida antes de crescer.', 6, 9, [
    choice('liaison', 'Designar ligação com saúde e transportes', 'US$ 3 mil para organizar o apoio administrativo.', { cash: -3000, health: 2, trust: 1 }, 'O hospital recebeu um interlocutor e os pedidos foram encaminhados aos serviços responsáveis.'),
    choice('existing-channel', 'Utilizar a coordenação já disponível', 'Atendimento dentro da capacidade existente, sem reforço imediato.', { health: 1, operationsReadiness: -1 }, 'A coordenação existente assumiu o acompanhamento e comunicou seus limites ao hospital.'),
    choice('no-response', 'Deixar o pedido sem acompanhamento', 'A dificuldade local permanece sem interlocução do comando.', { health: -2, trust: -2 }, 'A administração do hospital reiterou o pedido e registrou a ausência de acompanhamento.')
  ]),
  call('ethics-review', 'P02', 'Uma reclamação sobre o atendimento', 'Uma pessoa relatou tratamento inadequado por parte de uma equipe. O relato exige apuração imparcial e acolhimento, sem presumir culpa e sem proteger o departamento de qualquer conferência.', 10, 14, [
    choice('impartial-review', 'Encaminhar uma apuração imparcial', 'Garantir escuta, registro e direitos de todos os envolvidos.', { integrity: 3, trust: 1, politicalPressure: 1 }, 'A reclamação foi encaminhada com registro e garantias de apuração. A conclusão dependerá dos fatos verificados.'),
    choice('training', 'Apurar e reforçar orientação de atendimento', 'US$ 4 mil para orientação, sem substituir a análise do caso concreto.', { cash: -4000, integrity: 2, morale: 1, trust: 1 }, 'O relato segue em apuração e as chefias receberam orientação adicional para o atendimento.'),
    choice('shelve', 'Arquivar sem ouvir as pessoas envolvidas', 'Encerra a tarefa administrativa sem verificar os fatos.', { integrity: -5, trust: -3, politicalPressure: 2 }, 'A decisão de arquivar sem apuração foi contestada e fará parte da avaliação institucional.')
  ]),
  call('state-planning', 'P08', 'Reunião de continuidade regional', 'A governadoria está revisando a continuidade dos serviços entre municípios. Podemos receber um diagnóstico da capacidade local. Enviar o diagnóstico não autoriza nem obriga uma mobilização estadual.', 15, 18, [
    choice('document-needs', 'Apresentar necessidades e limites reais', 'Registrar capacidade, prioridades e critérios para um eventual pedido de auxílio.', { integrity: 2, operationsReadiness: 1, stateRequest: true }, 'O diagnóstico foi recebido. Qualquer apoio posterior terá autorização, missão e prazo próprios.'),
    choice('technical-liaison', 'Designar ligação técnica permanente', 'US$ 4 mil para troca de informações entre as equipes responsáveis.', { cash: -4000, operationsReadiness: 2 }, 'A ligação técnica foi definida sem alterar as competências de cada esfera.'),
    choice('inflate-capacity', 'Informar capacidade maior que a disponível', 'Evita expor limitações, mas compromete o planejamento regional.', { integrity: -4, politicalPressure: 3 }, 'A conferência dos dados encontrou divergências. A governadoria solicitou uma correção formal do diagnóstico.')
  ]),
  call('regional-followup', 'P09', 'Conferência do acordo estadual', 'O apoio estadual autorizado precisa de uma conferência de responsabilidades, despesas e prazo. Manter a documentação em dia evita que o acordo se torne uma fonte de dúvida entre os comandos.', 20, 21, [
    choice('reconcile', 'Conferir os registros com a equipe estadual', 'Revisar a aplicação do acordo sem ampliar sua missão.', { integrity: 2, operationsReadiness: 1 }, 'Os registros foram conciliados e os limites do apoio permanecem claros.'),
    choice('reduce-demand', 'Reduzir a demanda ao necessário', 'Recompor a rotina municipal e preservar a cooperação para futuras necessidades.', { operationsReadiness: -1, morale: 1, politicalPressure: -1 }, 'A demanda foi revista. A redução será comunicada pelos canais do acordo, sem mudanças informais de missão.'),
    choice('expand-informally', 'Solicitar ampliação sem formalizar o acordo', 'A chefia estadual não pode atender fora da autorização recebida.', { integrity: -3, politicalPressure: 2 }, 'A ampliação informal não foi autorizada. O pedido deverá retornar à autoridade competente com justificativa e escopo.')
  ], { requirements: ['stateAuthorized'] }),
  call('federal-records', 'P12', 'Atualização da cooperação federal', 'A equipe de ligação precisa conferir os registros compartilhados sob o nexo federal já documentado. A cooperação exige informação verificável, atribuições claras e respeito às garantias legais.', 45, 30, [
    choice('verify-records', 'Conferir os registros antes do encaminhamento', 'US$ 6 mil para revisão e acompanhamento documental.', { cash: -6000, integrity: 3, operationsReadiness: 1 }, 'O material foi conferido pelo canal autorizado. A cooperação mantém escopo e responsabilidades documentados.'),
    choice('clarify-scope', 'Revisar os limites da cooperação', 'Esclarecer pendências antes de compartilhar informação adicional.', { integrity: 2, politicalPressure: 1 }, 'Os limites foram revisados e as pendências receberam responsáveis de cada instituição.'),
    choice('unverified-material', 'Encaminhar material sem a conferência solicitada', 'Ganha tempo agora, mas enfraquece a confiabilidade da documentação.', { integrity: -4, politicalPressure: 2 }, 'O material precisou retornar para conferência. A falha administrativa foi registrada pela equipe de ligação.')
  ], { requirements: ['federalNexus'] }),
  call('civil-support-review', 'P10', 'Revisão de apoio civil autorizado', 'O apoio civil estadual já autorizado precisa ser revisto para preservar finalidade, prazo e prestação de contas. A Guarda permanece sob comando estadual e não assume a gestão policial municipal.', 75, 45, [
    choice('mission-review', 'Conferir missão e transição do apoio', 'Revisar apenas as tarefas autorizadas, com os órgãos responsáveis.', { integrity: 3, health: 1 }, 'A conferência manteve as atribuições delimitadas. A transição será coordenada com a autoridade estadual.'),
    choice('municipal-transition', 'Preparar a retomada pelos serviços municipais', 'US$ 8 mil para transferência documentada e continuidade civil.', { cash: -8000, operationsReadiness: 2, health: 1 }, 'A transição recebeu responsáveis e prazo, preservando a continuidade do atendimento.'),
    choice('assume-command', 'Tratar o apoio como subordinado ao gabinete municipal', 'A pretensão extrapola a autoridade do comissário e não será executada.', { integrity: -4, politicalPressure: 3 }, 'O comando estadual esclareceu a cadeia institucional e recusou a ampliação indevida de autoridade.')
  ], { requirements: ['stateAuthorized'] })
];
