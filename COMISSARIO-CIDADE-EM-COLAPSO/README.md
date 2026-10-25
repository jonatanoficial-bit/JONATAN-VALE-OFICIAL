# COMISSÁRIO — CIDADE EM COLAPSO

Parte 3 · v1.0.0 · Vale Games. Simulador narrativo de comando e gestão em uma Nova York ficcionalizada.

## Jogar

https://jonatanoficial-bit.github.io/JONATAN-VALE-OFICIAL/COMISSARIO-CIDADE-EM-COLAPSO/

No celular, role a página normalmente. No centro de despacho, o botão **Mover mapa** ativa arraste e pinça; **Rolar página** devolve o gesto à página. Os menus inferiores deslizam horizontalmente e incluem salvamentos e preferências.

No ZIP, abra **JOGAR.html** em uma versão recente de Chrome, Edge, Firefox ou Safari. Essa edição contém código e imagens no próprio arquivo. Para a edição modular, execute `python -m http.server 8080` na pasta e abra http://localhost:8080. Se o navegador bloquear armazenamento em arquivos locais, use o servidor local e exporte backups.

## Primeiro turno

1. Inicie a campanha e responda à ligação do prefeito.
2. Fale com Brithney pelo telefone; confira as consequências da pauta.
3. Contrate um profissional em Efetivo e turnos.
4. No mapa, abra uma ocorrência, despache uma viatura e avance o tempo até a chegada.
5. Escolha a resposta à ocorrência, autorize diligências e revise os briefings da campanha.

## Conteúdo jogável

- Quinze imagens originais recuperadas do documento: cinco fundos e dez composições C01–C10.
- Doze personagens visíveis com fotografias das composições, telefone e relações.
- Sete arcos, escolhas persistentes e quatro resultados possíveis na audiência final; modo livre após a campanha.
- Cidade top-down de cinco distritos, rotas, ETA, clima diário e boletins.
- Compras, entregas, manutenção, caixa mensal, folha e obrigações em atraso.
- Contratação, descanso, treinamento e sete módulos de expansão com obras temporizadas.
- Arquivo Ponte: diligências, equipe, provas, hipóteses e cooperação estadual/federal condicionada.
- Guia do primeiro turno, áudio sintetizado, contraste, movimento reduzido e escala de texto.
- Três arquivos manuais mais autosave independente; recuperação do progresso mais recente, exportação com checksum, confirmação de substituição e migração de versões anteriores.
- PWA com ícones e cache local; preferências e campanha permanecem no dispositivo.

## Verificação e desenvolvimento

Node.js 24, sem dependências de execução:

```bash
npm run check
npm test
npm run package
```

Os testes incluem economia, construção, investigação, migração, integridade de backups, renderização de 14 telas e 100 seeds por 365 dias. O workflow de navegador está em scripts/github-e2e.yml e é publicado em .github/workflows/comissario-e2e.yml. Consulte AUDIT.md e TEST_RESULTS.json para o resultado real e limitações.

## Arquitetura

src/state.js e src/sim.js mantêm estado e tempo; campaign/phone/world-detail contêm narrativa e regras; render/app implementam telas e interação; map/precinct fornecem mapas 2D; persistence cuida dos saves; audio/i18n isolam som e preparação para traduções. A única língua disponível é português.

assets/manifest.json registra origem, dimensões e hashes; src/art.js identifica as janelas de personagem. Os 12 retratos individuais canônicos não estavam anexados ao documento: foram usados detalhes das imagens fornecidas, com limitações de resolução.

## Publicação e privacidade

Aplicação estática na pasta COMISSARIO-CIDADE-EM-COLAPSO do repositório autorizado. GitHub Pages usa main. Nenhuma chave ou serviço pago está embutido. Sincronização Firebase não foi ativada: não há projeto/configuração fornecidos. Não existe conta online nem envio de saves a servidor.

Links de download do GitHub não têm expiração programada; dependem da permanência do arquivo e do repositório. As partes anteriores permanecem em release/.

## Créditos

Conceito, direção e imagens: Vale Games / titular do projeto. Personagens, autoridades e contratos ficcionais. Código reservado ao titular; consulte-o antes de redistribuição comercial. Som original sintetizado em WebAudio; não há dublagem ou trilha orquestral.
