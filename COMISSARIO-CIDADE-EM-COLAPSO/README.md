# COMISSÁRIO — CIDADE EM COLAPSO

Parte 2 / v0.2.0 do simulador estratégico da Vale Games. Assuma Raymond Jackson e conduza uma Nova York ficcionalizada por sete arcos de crise. Inclui as 15 imagens recuperadas da Bíblia Mestre, cinco fundos limpos e dez referências C01–C10. Os 12 personagens aparecem por detalhes fotográficos das composições disponíveis; os retratos individuais originais ainda não estavam anexados.

## Jogar

GitHub Pages: https://jonatanoficial-bit.github.io/JONATAN-VALE-OFICIAL/COMISSARIO-CIDADE-EM-COLAPSO/

No computador, extraia o ZIP, abra um terminal na pasta e execute:

```bash
python -m http.server 8080
```

Abra http://localhost:8080. Use um servidor local: navegadores restringem módulos quando o HTML é aberto diretamente por file://.

## Conteúdo

- Prólogo e ligação com quatro respostas persistentes.
- Gabinete, telefone com 12 contatos, fotos e chamadas contextuais.
- Caixa mensal, veículos únicos, entregas, manutenção e folha.
- Oito candidatos, contratação, descanso e treinamento.
- Cidade top-down, cinco distritos, pan/zoom/pinça, ocorrências, despacho e ETA.
- Delegacia em grade, colisão e sete módulos com prazo de obra.
- Arquivo Ponte com tarefas temporizadas, evidências e hipóteses.
- Sete arcos com escolhas e cooperação estadual/federal condicionada.
- Três slots, autosave, migração de saves v1 e exportação/importação JSON.
- Contraste, texto escalável, movimento reduzido e som sintetizado.

## Verificação

Use Node.js 24. Não há dependências para executar o jogo.

```bash
npm test
npm run check
```

Consulte AUDIT.md para resultados e limitações. O manifest assets/manifest.json registra origem e hashes das 15 imagens; src/art.js mapeia personagens às composições. Sem backend ou sincronização online.

## Publicação e download

Arquivos estáticos com caminhos relativos, servidos na pasta COMISSARIO-CIDADE-EM-COLAPSO do repositório existente. GitHub Pages deve usar a branch main. Não é necessário build. As URLs do GitHub não têm prazo programado de expiração; dependem da permanência do repositório e dos arquivos.

## Créditos

Conceito, direção e imagens: Vale Games / titular do projeto. Personagens e autoridades ficcionais. Código reservado ao titular; consulte-o antes de redistribuição comercial.
