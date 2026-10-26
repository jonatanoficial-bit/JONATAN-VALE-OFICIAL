# COMISSÁRIO — CIDADE EM COLAPSO

Parte 4 · v1.1.0 · Vale Games. Simulador narrativo de comando e gestão em uma Nova York ficcionalizada.

## Jogar

https://jonatanoficial-bit.github.io/JONATAN-VALE-OFICIAL/COMISSARIO-CIDADE-EM-COLAPSO/

No celular, role a página normalmente. No centro de despacho, **Mover mapa** ativa arraste e pinça; **Rolar página** devolve o gesto à página. Os menus inferiores deslizam horizontalmente.

No ZIP, abra **JOGAR.html** em Chrome, Edge, Firefox ou Safari recentes. Essa edição contém código e imagens no próprio arquivo. Para a edição modular, execute `python -m http.server 8080` na pasta e abra http://localhost:8080. Se o navegador bloquear armazenamento em arquivos locais, use o servidor local e exporte backups.

## Primeiro turno

1. Inicie a campanha e responda à ligação do prefeito.
2. Conheça o gabinete: a posse começa às 08:00, sem ocorrências instantâneas. Use **Aguardar próximo aviso** para receber a primeira ligação às 08:20.
3. Consulte os doze contatos e contrate um profissional em Efetivo e turnos.
4. Quando chegar uma ocorrência, abra o mapa, despache uma viatura e avance até a chegada.
5. Escolha a resposta e acompanhe **Carreira e agenda**. Crises têm desdobramentos posteriores, não todas as decisões de uma vez.

O modo 1× avança um minuto do jogo a cada dois segundos. Alertas importantes pausam o relógio; retome quando estiver pronto. A espera avança até oito horas, mas para na primeira novidade. Fechar ou ocultar o jogo não acumula crises nem faz o mandato avançar em segundo plano.

## Carreira contínua

Ocorrências locais, ligações recebidas e crises maiores têm agendas independentes e persistentes. Há no máximo duas ocorrências locais, uma ligação pendente e uma crise extraordinária por vez. A primeira crise chega depois de 7–12 dias; crises seguintes têm intervalos e três etapas com retorno das equipes.

As avaliações acontecem a cada 30 dias. Três avaliações ruins consecutivas podem encerrar o mandato: primeiro há advertência, depois acompanhamento e só então demissão. Uma avaliação satisfatória interrompe essa sequência. Planos de escuta, integridade e continuidade dos serviços levam dias para produzir resultados; dívidas podem ser regularizadas no painel da frota e finanças.

Não existe final obrigatório ao completar os sete marcos institucionais. A carreira pode seguir por anos. Antes de uma demissão ocorrida durante o jogo, o estado anterior é guardado em **Recuperação de carreira**, separado do autosave e dos três arquivos manuais. Esse arquivo pode estar próximo da avaliação: os arquivos manuais continuam importantes para retomar com mais antecedência.

## Conteúdo jogável

- Quinze imagens originais do documento: cinco fundos e dez composições C01–C10; doze personagens visíveis com fotografias das composições.
- Sete marcos institucionais graduais; carreira, revisões, recuperação e demissão.
- Ligações recebidas, crises locais/estaduais/federais em etapas e consequências persistentes. Eventos graves são fictícios e focados na proteção de vidas.
- Cidade top-down de cinco distritos, rotas, ETA, clima diário e boletins.
- Compras, entregas, manutenção, caixa mensal, folha e obrigações em atraso.
- Contratação, descanso, treinamento e sete módulos de expansão com obras temporizadas.
- Arquivo Ponte: diligências, equipe, provas, hipóteses e cooperação estadual/federal condicionada.
- Guia inicial, áudio sintetizado, contraste, movimento reduzido e escala de texto.
- Três arquivos manuais, autosave e recuperação pré-demissão; backup com checksum, confirmação de substituição e migração de versões anteriores.
- PWA com ícones e cache local; preferências e campanha permanecem no dispositivo.

## Verificação e desenvolvimento

Node.js 24, sem dependências de execução:

```bash
npm run check
npm test
npm run package
```

Os testes incluem economia, investigação, migração, integridade de backups, renderização, agenda determinística e consequências de carreira. O teste econômico legado cobre 100 seeds por 365 dias; o teste de carreira gerida cobre 10 seeds por um ano e uma carreira por cinco anos. O workflow de navegador está em scripts/github-e2e.yml e é publicado em .github/workflows/comissario-e2e.yml. Consulte AUDIT.md e TEST_RESULTS.json para os resultados efetivamente obtidos e limitações.

## Arquitetura

state/sim mantêm estado e tempo; career/crisis-data/career-view implementam agenda, eventos e mandato; campaign/phone/world-detail contêm narrativa e regras; render/app implementam telas e interação; map/precinct fornecem mapas 2D; persistence cuida dos saves; audio/i18n isolam som e preparação para traduções. Somente português disponível.

assets/manifest.json registra origem, dimensões e hashes; src/art.js identifica as janelas de personagem. Os 12 retratos individuais canônicos não estavam anexados ao documento: usamos detalhes das imagens fornecidas, com limitações de resolução.

## Publicação e privacidade

Aplicação estática na pasta COMISSARIO-CIDADE-EM-COLAPSO do repositório autorizado. GitHub Pages usa main. Nenhuma chave ou serviço pago está embutido. Não existe conta online nem envio de saves a servidor; sincronização depende de projeto/configuração ainda não fornecidos.

Links do GitHub não têm expiração programada; dependem da permanência do arquivo e do repositório. As partes anteriores permanecem em release/.

## Créditos

Conceito, direção e imagens: Vale Games / titular do projeto. Personagens, autoridades e contratos ficcionais. Código reservado ao titular; consulte-o antes de redistribuição comercial. Som original sintetizado em WebAudio; não há dublagem ou trilha orquestral.
