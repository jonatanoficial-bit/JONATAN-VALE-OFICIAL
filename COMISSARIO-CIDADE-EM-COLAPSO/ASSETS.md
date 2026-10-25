# Origem das imagens

Fonte: [Bíblia Mestre Codex v1.0](https://docs.google.com/document/d/1vHqY-zxuBrsa7c4oIvPXOWHZHfa1t4HatMFWVLSwUfE/edit). Foram recuperadas as 15 imagens incorporadas às abas C01–C10: cinco fundos limpos e dez composições completas. Nenhum rosto foi gerado novamente.

Os WebP locais são conversões dos originais. Origem por identificador, dimensões, tamanho e SHA-256 estão em `assets/manifest.json`. As composições completas podem ser vistas na galeria dentro do jogo.

As fichas P01–P12 não continham os arquivos individuais canônicos. Para mostrar os personagens solicitados, a interface exibe janelas fotográficas das composições já fornecidas; os limites estão em `src/art.js`.

| Personagem | Composição usada |
| --- | --- |
| P01 Raymond Jackson | C02 |
| P02 Capitão James | C03 |
| P03 Kevin | C06 |
| P04 Brithney | C03 |
| P05 Detetive James | C03 |
| P06 | C09 |
| P07 Allan Thompson | C02 |
| P08 | C09 |
| P09 Kevin Johnson | C08 |
| P10 | C09 |
| P11 | C10 |
| P12 | C10 |

Alguns detalhes, especialmente P03 e P09, têm resolução pequena. Os retratos originais individuais ainda são necessários para fidelidade facial e enquadramentos de alta qualidade. O mapeamento é substituível sem alterar saves.

Botões, textos, rotas, ocorrências, obras e decisões são componentes de código. As imagens de referência com interface impressa são mostradas integralmente apenas na galeria; áreas fotográficas também ilustram os painéis.

Ícones PWA e controles são vetores procedurais próprios; áudio é sintetizado com WebAudio. Não há biblioteca comercial, arquivo remoto obrigatório ou serviço de geração em tempo de execução.
