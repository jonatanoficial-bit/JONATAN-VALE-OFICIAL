// Generate a portable, single-file edition from the same game source.
// Modern Chromium/Firefox/Safari support ESM import maps and data-URL modules.
// No eval, server, network, copied credentials or third-party runtime required.
import { readdirSync, readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, dirname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const out = resolve(process.argv[2] || '/workspace/releases/COMISSARIO-PARTE-3-v1.0.0-JOGAR.html');
const assets = Object.create(null);
for (const folder of ['backgrounds', 'references', 'icons']) {
  for (const name of readdirSync(resolve(root, 'assets', folder))) {
    const path = `./assets/${folder}/${name}`;
    const mime = name.endsWith('.webp') ? 'image/webp' : name.endsWith('.png') ? 'image/png' : 'image/svg+xml';
    assets[path] = `data:${mime};base64,${readFileSync(resolve(root,path)).toString('base64')}`;
  }
}
const imports = Object.create(null);
for (const name of readdirSync(resolve(root, 'src')).filter(name => name.endsWith('.js'))) {
  let source = readFileSync(resolve(root, 'src', name), 'utf8');
  source = source.replace(/\bfrom\s*(['"])(\.[^'"]+)\1/g, (_, quote, relative) => `from ${quote}comissario/${basename(relative, '.js')}${quote}`);
  if (name === 'app.js') {
    const assignment = /root\.innerHTML\s*=\s*renderApp\(state,\s*ui\)/;
    if (!assignment.test(source)) throw new Error('Ponto de integração de assets mudou em app.js. Atualize o empacotador.');
    source = source.replace(assignment, 'root.innerHTML=globalThis.__comissarioEmbedAssets(renderApp(state,ui))');
  }
  imports[`comissario/${basename(name, '.js')}`] = `data:text/javascript;base64,${Buffer.from(source).toString('base64')}`;
}
let styles = readFileSync(resolve(root, 'styles.css'), 'utf8');
styles = styles.replace(/\.\/assets\/[A-Za-z0-9/_-]+\.(?:webp|png|svg)/g, path => assets[path] || path);
let html = readFileSync(resolve(root, 'index.html'), 'utf8');
html = html.replace(/<link\b[^>]*rel="manifest"[^>]*>/g, '');
html = html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/, `<style>${styles}</style>`);
html = html.replace(/\.\/assets\/[A-Za-z0-9/_-]+\.(?:webp|png|svg)/g, path => assets[path] || path);
const embedded = `<script>globalThis.__comissarioEmbeddedAssets=${JSON.stringify(assets)};globalThis.__comissarioEmbedAssets=html=>html.replace(/\\.\\/assets\\/[A-Za-z0-9/_-]+\\.(?:webp|png|svg)/g,path=>globalThis.__comissarioEmbeddedAssets[path]||path);</script>`;
const map = `<script type="importmap">${JSON.stringify({imports})}</script>`;
const entry = '<script type="module">import "comissario/app";</script>';
html = html.replace(/<script\s+type="module"\s+src="\.\/src\/app\.js"\s*>\s*<\/script>/, embedded + map + entry);
if (html.includes('src="./src/app.js"') || html.includes('href="./styles.css"')) throw new Error('Referência externa no pacote portátil.');
mkdirSync(dirname(out), { recursive: true });
writeFileSync(out, html);
const sha256 = createHash('sha256').update(html).digest('hex');
console.log(JSON.stringify({ file: out, bytes: Buffer.byteLength(html), sha256, embeddedImages: Object.keys(assets).length, modules: Object.keys(imports).length, browserVerified: false }));
