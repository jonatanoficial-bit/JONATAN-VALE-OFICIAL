import { readdirSync,readFileSync,existsSync,statSync } from 'node:fs';
import { SourceTextModule } from 'node:vm';
import { createHash } from 'node:crypto';
import { resolve,dirname } from 'node:path';
const modules = readdirSync('src').filter(f=>f.endsWith('.js'));
for(const file of modules){
  const module = new SourceTextModule(readFileSync('src/'+file,'utf8'),{identifier:file});
  for(const dep of module.dependencySpecifiers){
    if(!dep.startsWith('./')&&!dep.startsWith('../'))throw new Error('Dépendance externe non disponible hors ligne: '+dep);
    if(!existsSync(resolve('src',dirname(file),dep)))throw new Error('Import ausente: '+file+' → '+dep);
  }
}
new SourceTextModule(readFileSync('sw.js','utf8'),{identifier:'sw.js'});
const manifest=JSON.parse(readFileSync('assets/manifest.json','utf8'));
for(const image of manifest.images){
  if(!existsSync(image.path))throw new Error('Asset ausente: '+image.path);
  const content=readFileSync(image.path);
  if(createHash('sha256').update(content).digest('hex')!==image.sha256)throw new Error('Hash de imagem divergente: '+image.path);
  if(content.byteLength!==image.bytes)throw new Error('Tamanho de imagem divergente: '+image.path);
}
const pwa=JSON.parse(readFileSync('manifest.webmanifest','utf8'));
for(const icon of pwa.icons||[])if(!existsSync(icon.src)||statSync(icon.src).size===0)throw new Error('Ícone ausente: '+icon.src);
for(const size of ['192x192','512x512'])if(!pwa.icons?.some(icon=>icon.sizes===size))throw new Error('Ícone PWA ausente: '+size);
for(const match of readFileSync('styles.css','utf8').matchAll(/url\(['"]?(\.\/[^)'"\s]+)['"]?\)/g))if(!existsSync(match[1]))throw new Error('Imagem CSS ausente: '+match[1]);
const sw=readFileSync('sw.js','utf8');
for(const module of modules)if(!sw.includes('./src/'+module))throw new Error('Módulo não incluído no cache offline: '+module);
console.log(modules.length+' módulos válidos; '+manifest.images.length+' imagens locais com hashes verificados; ícones PWA e cobertura offline presentes.');
