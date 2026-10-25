import { createRequire } from 'node:module';
const sharp = createRequire(import.meta.url)('sharp');
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { dirname } from 'node:path';
import { createHash } from 'node:crypto';
const files = [
  {
    "id": "c01",
    "fileId": "file_000000009e04820e8b3937e0b21a1ac4",
    "input": "/workspace/attachments/0929eb82-0f2d-40da-9433-e38850ab43e8/comissário_sob_a_chuva_na_cidade_noturna.png",
    "path": "backgrounds/c01.webp",
    "title": "Fundo da tela inicial",
    "reference": false
  },
  {
    "id": "ref-c01",
    "fileId": "file_000000002d50820eb7791f82b04241cf",
    "input": "/workspace/attachments/74333c17-7d1b-4faf-a078-f3841967b0d2/C01_Tela_Inicial.png",
    "path": "references/c01.webp",
    "title": "Tela inicial",
    "reference": true
  },
  {
    "id": "c02",
    "fileId": "file_000000009178820ea03da44e562536d2",
    "input": "/workspace/attachments/e0f9b312-915d-4648-a05c-ed71ed0f6c1b/prefeitura_sob_a_chuva_em_nova_york.png",
    "path": "backgrounds/c02.webp",
    "title": "Ligação do prefeito",
    "reference": false
  },
  {
    "id": "ref-c02",
    "fileId": "file_000000005ca4820ea56a3876f1aa7065",
    "input": "/workspace/attachments/6f16b720-e280-4f16-9dfb-2eeda73a9656/C02_Ligacao_Prefeito.png",
    "path": "references/c02.webp",
    "title": "Ligação do prefeito",
    "reference": true
  },
  {
    "id": "c03",
    "fileId": "file_00000000d608820e83b2969272c665bf",
    "input": "/workspace/attachments/b654ba28-8324-429e-b154-8d33d3852ce0/a_dramatic_cinematic_ultra_detailed_interior_scen.png",
    "path": "backgrounds/c03.webp",
    "title": "Gabinete do comissário",
    "reference": false
  },
  {
    "id": "ref-c03",
    "fileId": "file_000000004eac820ea3fc101764587398",
    "input": "/workspace/attachments/05cd05bf-e926-4ca8-b111-79ab77e0cfd0/C03_Gabinete_Comissario.png",
    "path": "references/c03.webp",
    "title": "Gabinete com equipe",
    "reference": true
  },
  {
    "id": "c04",
    "fileId": "file_000000006a80820e8059578a5a2633cf",
    "input": "/workspace/attachments/2ca30d0f-9bb9-4115-91a9-119da615735d/7322c2c5-7f31-47a6-94ca-c9568c3148c5.png",
    "path": "backgrounds/c04.webp",
    "title": "Mapa ortogonal",
    "reference": false
  },
  {
    "id": "ref-c04",
    "fileId": "file_00000000fea4820ea0ec38520c721c36",
    "input": "/workspace/attachments/f6749fb0-b91e-44b9-8838-c895716fc6d9/C04_Mapa_Cidade_2D.png",
    "path": "references/c04.webp",
    "title": "Centro de despacho",
    "reference": true
  },
  {
    "id": "c05",
    "fileId": "file_000000002554820e9c8cb672713131bd",
    "input": "/workspace/attachments/3191c7b5-e457-470f-887f-b615f7ac2b34/C05_FUNDO_DELEGACIA_PLANTA_2D_REFERENCIA.png",
    "path": "backgrounds/c05.webp",
    "title": "Delegacia ortogonal",
    "reference": false
  },
  {
    "id": "ref-c05",
    "fileId": "file_00000000d88c820e96aa85ecda53392e",
    "input": "/workspace/attachments/5157bfea-4fcb-4e7e-89a6-80b8eabba389/C05_Delegacia_2D.png",
    "path": "references/c05.webp",
    "title": "Delegacia construída",
    "reference": true
  },
  {
    "id": "ref-c06",
    "fileId": "file_00000000a4f8820e922b63247a7a60e3",
    "input": "/workspace/attachments/35b93e40-f4c7-4235-93db-49f78dbcaebd/C06_Operacao_2D.png",
    "path": "references/c06.webp",
    "title": "Operação 2D",
    "reference": true
  },
  {
    "id": "ref-c07",
    "fileId": "file_000000003010820eb6819676f257e251",
    "input": "/workspace/attachments/0703a7d6-22d5-4bae-93b9-69511488d347/C07_Investigacao.png",
    "path": "references/c07.webp",
    "title": "Investigação",
    "reference": true
  },
  {
    "id": "ref-c08",
    "fileId": "file_0000000077e4820e9ce7d9dd9ceefff8",
    "input": "/workspace/attachments/b109d9aa-b4fa-44ad-b811-37de56c6a718/C08_Frota_Compras.png",
    "path": "references/c08.webp",
    "title": "Garagem e frota",
    "reference": true
  },
  {
    "id": "ref-c09",
    "fileId": "file_00000000ca60820e8a57597288e72a46",
    "input": "/workspace/attachments/92b0c4dc-53a0-4fba-be2e-d3c7b7f4193d/C09_Cupula_Crise.png",
    "path": "references/c09.webp",
    "title": "Cúpula estadual",
    "reference": true
  },
  {
    "id": "ref-c10",
    "fileId": "file_0000000037bc820e9c885c97db869744",
    "input": "/workspace/attachments/0d745d6f-c8f1-4f5b-a829-018aabc9a5c9/C10_Cooperacao_Federal.png",
    "path": "references/c10.webp",
    "title": "Cooperação federal",
    "reference": true
  }
];
const manifest = { version: 2, source: 'Google Docs Bíblia Mestre 1vHqY-zxuBrsa7c4oIvPXOWHZHfa1t4HatMFWVLSwUfE', images: [] };
for (const f of files) {
  const target = new URL('../assets/' + f.path, import.meta.url);
  await mkdir(dirname(target.pathname), { recursive: true });
  const result = await sharp(f.input).webp({ quality: 89, effort: 5 }).toFile(target.pathname);
  manifest.images.push({ id: f.id, path: 'assets/' + f.path, title: f.title, reference: f.reference, sourceFileId: f.fileId, width: result.width, height: result.height, bytes: result.size, sha256: createHash('sha256').update(await readFile(target)).digest('hex') });
}
await writeFile(new URL('../assets/manifest.json', import.meta.url), JSON.stringify(manifest, null, 2));
console.log(JSON.stringify(manifest.images.map(i => ({ id:i.id, dimensions: [i.width,i.height], bytes:i.bytes })), null, 2));
