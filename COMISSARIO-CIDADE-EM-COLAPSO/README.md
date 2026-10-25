# COMISSÁRIO — CIDADE EM COLAPSO

Parte 1 / Lote 1 jogável do simulador estratégico da Vale Games. Assuma Raymond Jackson, receba o convite do prefeito fictício Allan Thompson e estabilize uma Nova York ficcionalizada durante a primeira semana de crise.

## Jogar

Abra o link do GitHub Pages informado na entrega. A aplicação funciona em Android e desktop, salva localmente e não requer conta ou backend.

Para executar o pacote baixado no computador:

```bash
python -m http.server 8080
```

Depois abra `http://localhost:8080`. Um servidor local é recomendado porque o navegador restringe módulos JavaScript abertos diretamente por `file://`.

## O que funciona

- Prólogo cinematográfico e ligação com quatro respostas persistentes.
- Gabinete com hotspots reais, telefone com os 12 personagens e chamadas contextuais.
- Caixa mensal, dotação anual, catálogo de veículos, ativos únicos, manutenção e folha.
- Contratação de oito candidatos; estado e custos persistentes.
- Mapa top-down dos cinco distritos, 12+ POIs, seis tipos de ocorrência, pan/zoom/pinça, despacho e ETA.
- Delegacia top-down em grade, colisão e três módulos funcionais.
- Investigação Arquivo Ponte, decisões operacionais, KPIs e journal explicativo.
- Relógio 1×/3×/6×, primeira semana, RNG determinístico, três slots e autosave IndexedDB.
- Exportação/importação de save, alto contraste, texto escalável e movimento reduzido.

## Estrutura

- `src/content.js`: personagens, distritos, economia e conteúdo.
- `src/state.js`: estado, reducer e validações.
- `src/sim.js`: relógio, RNG e eventos.
- `src/map.js`: mapa 2D interativo.
- `src/precinct.js`: planta construível.
- `src/persistence.js`: IndexedDB, checksum e migração.
- `src/render.js`: telas e componentes.
- `src/app.js`: orquestração e eventos.
- `public/assets/asset-manifest.json`: IDs canônicos P01–P12 e C01–C10.

## Testes

```bash
npm test
npm run check
```

## Créditos e licença

Conceito e direção: Vale Games. Todos os políticos e comandantes da trama são fictícios. Código da entrega reservado ao titular do projeto; consulte o proprietário antes de redistribuir comercialmente.
