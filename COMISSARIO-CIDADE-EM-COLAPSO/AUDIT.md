# Auditoria — Parte 4 / v1.1.0

## Validação

42 testes de lógica e integração aprovados, incluindo 100 seeds econômicas por 365 dias, dez carreiras geridas por um ano e uma por cinco anos. Checagem de sintaxe de 20 módulos, hashes das 15 imagens, ícones PWA e cobertura estática do cache offline aprovada.

Chromium real no GitHub Actions: PASS em 1440×1000, 390×844 e 360×640, com zero erros de página. Exercitados prólogo e rolagem móvel, posse tranquila, primeira ligação agendada, 12 contatos, foco e Escape, aquisição, contratação, mapa/despacho/resolução, obras/diligências, preferências, galeria, exportação/importação e migração v3. Demissão acionada pela interface, arquivo de recuperação pré-avaliação restaurado e arquivos manuais preservados.

HTML portátil aberto via file:// com rede desativada: PASS, zero solicitações de rede. SHA-256 do arquivo efetivamente testado: 86332ae042ced3dc28302f7209782b4eae1e1a7feb6480c52c88097b87d1bcab. Código verificado: d203056f1f74c3a120ac15ed121d5451386245af. Execução: https://github.com/jonatanoficial-bit/JONATAN-VALE-OFICIAL/actions/runs/40321492035. Relatórios completos em TEST_RESULTS.json e qa/browser-report.json.

O teste inicial revelou que a restauração ainda dependia do próximo autosave; isso foi corrigido antes da execução aprovada. A versão testada também concluiu a implantação pelo GitHub Pages. Service worker foi bloqueado deliberadamente nas rotas de teste: instalação PWA não é declarada validada.

Capturas do painel de carreira em desktop/mobile e do gabinete em 360 px foram inspecionadas. Personagens aparecem com as composições originais; a página longa permanece rolável. Avisos temporários vistos nas capturas pertencem ao teste com service worker bloqueado.

## Alterações

Diretor de eventos com RNG e agenda persistidos, intervalos entre avisos, limites de simultaneidade, ligações recebidas e crises em etapas. Carreira sem final obrigatório, avaliações mensais, três falhas consecutivas até a demissão e oportunidade de recuperação. Planos temporizados, quitação de dívidas, proteção de benefícios telefônicos e arquivo de recuperação pré-demissão. Migração de saves anteriores preserva progresso, relógio e ativos; somente a nova agenda recebe horários futuros.

O tempo só avança enquanto o jogo está ativo ou por comando do jogador. Fechar o jogo não acumula crises. Eventos e personagens são fictícios; a simulação institucional é abstrata, não uma reprodução jurídica ou operacional da administração real.

## Limitações

- Retratos canônicos P01–P12 individuais não anexados: usamos detalhes das composições C01–C10, alguns pequenos. Não foram gerados rostos novos.
- Animações 2D e operações são abstratas; não há produção AAA, dublagem, trilha final ou elenco animado quadro a quadro.
- Conteúdo narrativo finito com variações e intervalos; carreira longa não significa situações inéditas infinitas.
- Instalação PWA, desempenho e gestos em Android físico exigem validação no aparelho. Emulação não equivale a teste físico.
- Sem sincronização online: não há projeto/configuração de backend fornecidos. Somente português implementado.
- O arquivo de segurança preserva o estado imediatamente anterior ao avanço que causou demissão, podendo restar pouco tempo até a revisão. Os três arquivos manuais são independentes.

Não se declara aceite integral da Bíblia nem qualidade AAA. A publicação é uma edição jogável com essas limitações explícitas.

## Preservação

Saves antigos são migrados sem alterar o arquivo importado. Dados inválidos são recusados. Os arquivos das partes 1, 2 e 3 e os demais projetos do repositório são preservados. Nenhuma credencial, segredo ou dependência de backend é incluída.
