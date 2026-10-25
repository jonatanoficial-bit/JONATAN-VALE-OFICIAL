import { readdirSync,readFileSync,existsSync } from 'node:fs';
import { SourceTextModule } from 'node:vm';
for(const file of readdirSync('src').filter(f=>f.endsWith('.js')))new SourceTextModule(readFileSync('src/'+file,'utf8'),{identifier:file});
const manifest=JSON.parse(readFileSync('assets/manifest.json','utf8'));
for(const image of manifest.images)if(!existsSync(image.path))throw new Error('Asset ausente: '+image.path);
console.log('Módulos válidos; '+manifest.images.length+' imagens locais verificadas.');
