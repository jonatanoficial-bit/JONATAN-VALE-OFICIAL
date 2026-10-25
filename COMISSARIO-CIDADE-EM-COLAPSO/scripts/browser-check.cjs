const { chromium } = require('playwright');
const fs = require('node:fs/promises');
const path = require('node:path');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');

const ROOT = path.resolve(__dirname, '..');
const OUT = path.resolve(process.env.QA_ARTIFACT_DIR || path.join(ROOT, 'qa-artifacts'));
const BASE = 'https://comissario.test/COMISSARIO-CIDADE-EM-COLAPSO/';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml' };
const VIEWPORTS = [{ width: 1440, height: 1000 }, { width: 390, height: 844 }, { width: 360, height: 640 }];
const report = { startedAt: new Date().toISOString(), environment: 'Chromium / desktop and mobile emulation; local files served through Playwright routes under GitHub Pages base path', serviceWorkerTested: false, devices: [], portable: { result: 'NOT_REQUESTED' } };

async function serve(context) {
  await context.route('**/*', async route => {
    const url = new URL(route.request().url());
    if (!url.href.startsWith(BASE)) return route.abort();
    let relative = decodeURIComponent(url.pathname.slice(new URL(BASE).pathname.length));
    if (!relative || relative.endsWith('/')) relative += 'index.html';
    const local = path.resolve(ROOT, relative);
    if (!local.startsWith(ROOT + path.sep)) return route.abort();
    try {
      await route.fulfill({ status: 200, contentType: TYPES[path.extname(local)] || 'application/octet-stream', body: await fs.readFile(local) });
    } catch {
      await route.fulfill({ status: 404, body: 'Not found: ' + relative });
    }
  });
}

async function saved(page, slot = 0) {
  return page.evaluate(async slotNumber => {
    const persistence = await import('./src/persistence.js');
    return persistence.loadGame(slotNumber);
  }, slot);
}

async function awaitSave(page, predicate, slot = 0) {
  let latest;
  for (let attempt = 0; attempt < 100; attempt++) {
    latest = await saved(page, slot);
    if (latest && predicate(latest)) return latest;
    await page.waitForTimeout(100);
  }
  assert.fail('O save não atingiu o estado esperado no arquivo ' + slot + ': ' + JSON.stringify(latest?.stats));
}

async function noOverflow(page, label, device) {
  const dimensions = await page.evaluate(() => ({
    width: innerWidth, documentWidth: document.documentElement.scrollWidth, height: innerHeight,
    bodyHeight: document.body.scrollHeight
  }));
  device.layout.push({ label, ...dimensions });
  assert.ok(dimensions.documentWidth <= dimensions.width + 1, label + ': overflow horizontal global');
}

async function testViewport(browser, viewport) {
  const device = { viewport, result: 'RUNNING', steps: [], layout: [], errors: [] };
  report.devices.push(device);
  const context = await browser.newContext({
    viewport, deviceScaleFactor: 1, isMobile: viewport.width < 600,
    hasTouch: viewport.width < 600, locale: 'pt-BR', timezoneId: 'UTC',
    serviceWorkers: 'block', acceptDownloads: true
  });
  await serve(context);
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => device.errors.push(error.message));
  page.on('response', response => {
    if (response.status() >= 400 && response.url().startsWith(BASE)) device.errors.push('HTTP ' + response.status() + ' ' + response.url());
  });
  const nav = async screen => {
    await page.locator('.nav-item[data-screen="' + screen + '"]').click();
    await page.locator('.nav-item[data-screen="' + screen + '"][aria-current="page"]').waitFor();
  };
  const screenshot = async name => page.screenshot({ path: path.join(OUT, viewport.width + '-' + name + '.png'), fullPage: true });
  try {
    await page.goto(BASE);
    await page.locator('[data-action="new-game"]').waitFor();
    assert.equal(await page.locator('[data-action="continue"]').isDisabled(), true);
    await noOverflow(page, 'title', device);
    await screenshot('title');
    // Click scrolls naturally; no forced click may conceal clipped or obscured controls.
    await page.locator('[data-action="new-game"]').click();
    await page.locator('.opening-choices').waitFor();
    await page.locator('.opening-choices button').last().scrollIntoViewIfNeeded();
    const lastChoice = await page.locator('.opening-choices button').last().boundingBox();
    assert.ok(lastChoice && lastChoice.y >= 0 && lastChoice.y + lastChoice.height <= viewport.height + 1, 'Última escolha deve ser alcançável por rolagem');
    await noOverflow(page, 'intro', device);
    await screenshot('intro');
    await page.locator('[data-choice="audit"]').click();
    await page.locator('.office-scene').waitFor();
    await awaitSave(page, state => state.storyStage === 'office');
    await page.locator('[data-action="set-speed"][data-speed="0"]').click();
    await noOverflow(page, 'office', device);
    await screenshot('office');
    device.steps.push('Título, rolagem da introdução, prólogo e autosave');

    await nav('phone');
    for (let index = 1; index <= 12; index++) {
      const id = 'P' + String(index).padStart(2, '0');
      await page.locator('.contact-row[data-id="' + id + '"]').click();
      await page.locator('.contact-hero [data-person="' + id + '"] svg image').waitFor();
      assert.ok(await page.locator('.topic-card').count() > 0, 'Contato sem pauta: ' + id);
    }
    await page.locator('.contact-row[data-id="P04"]').click();
    await page.locator('[data-person="P04"][data-topic="agenda"]').click();
    await page.locator('.call-dialog').waitFor();
    assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true, 'Foco inicial no diálogo');
    for (let index = 0; index < 5; index++) {
      await page.keyboard.press('Tab');
      assert.equal(await page.evaluate(() => !!document.activeElement.closest('[role="dialog"]')), true, 'Foco deve permanecer no diálogo');
    }
    await screenshot('phone');
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('[role="dialog"]').count(), 0);
    await page.locator('.contact-hero [data-person="P04"]').waitFor();
    await noOverflow(page, 'phone', device);
    device.steps.push('Doze personagens, pauta real, foco do modal e Escape');

    await nav('fleet');
    const fleetBefore = await page.locator('.fleet-table > article').count();
    await page.locator('[data-action="purchase"][data-type="sedan"]').click();
    assert.equal(await page.locator('.fleet-table > article').count(), fleetBefore + 1);
    await awaitSave(page, state => state.stats.purchases === 1);
    await nav('staff');
    const staffBefore = await page.locator('.staff-roster > article').count();
    await page.locator('[data-action="hire"]').first().click();
    assert.equal(await page.locator('.staff-roster > article').count(), staffBefore + 1);
    await awaitSave(page, state => state.stats.hires === 1);
    device.steps.push('Compra e contratação alteram inventários e saves');

    await nav('map');
    const panButton = page.locator('[data-map-action="pan"]');
    if (await panButton.count()) {
      await panButton.click();
      assert.equal(await panButton.getAttribute('aria-pressed'), 'true');
      await panButton.click();
      assert.equal(await panButton.getAttribute('aria-pressed'), 'false');
    }
    await page.locator('[data-map-action="zoom-in"]').click();
    assert.equal(await page.locator('#zoom-level').textContent(), '120%');
    await page.locator('[data-map-action="reset"]').click();
    await page.locator('.incident-row').first().click();
    await page.locator('[data-action="dispatch"]').first().click();
    for (let step = 0; step < 30 && await page.locator('.incident-dialog [data-action="advance-time"]').count(); step++) {
      await page.locator('.incident-dialog [data-action="advance-time"]').click();
    }
    assert.ok(await page.locator('[data-action="resolve-incident"]').count() > 0, 'Unidade deve chegar ao local');
    await page.locator('[data-action="resolve-incident"]').first().click();
    await awaitSave(page, state => state.stats.incidentsResolved === 1);
    assert.equal(await page.locator('.incident-dialog').count(), 0);
    await screenshot('map');
    await noOverflow(page, 'map', device);
    device.steps.push('Mapa, zoom, alternância de toque, despacho, ETA e resolução');

    await nav('precinct');
    await page.locator('[data-action="select-room"][data-room="garage"]').click();
    await page.locator('[data-action="place-room"][data-x="8"][data-y="4"]').click();
    await awaitSave(page, state => state.stats.rooms === 1);
    await nav('case');
    await page.locator('[data-action="case-task"][data-id="cameras"]').click();
    await nav('map');
    for (let step = 0; step < 4; step++) await page.locator('.header-actions [data-action="advance-time"]').click();
    await awaitSave(page, state => state.caseFile.actions.includes('cameras') && state.garageCapacity > 4);
    device.steps.push('Construção e diligência concluem após tempo de jogo');

    await nav('settings');
    await page.locator('[data-setting="highContrast"]').check();
    await page.locator('[data-setting="reducedMotion"]').check();
    await page.locator('[data-setting="sound"]').uncheck();
    assert.equal(await page.locator('html').getAttribute('class').then(value => value.includes('high-contrast') && value.includes('reduced-motion')), true);
    await noOverflow(page, 'settings', device);
    await nav('gallery');
    assert.equal(await page.locator('.art-card').count(), 10);
    await page.locator('[data-action="view-art"][data-id="C10"]').click();
    await page.locator('.art-lightbox').waitFor();
    await page.locator('.art-lightbox img').evaluate(image => image.decode());
    await screenshot('gallery');
    await page.keyboard.press('Escape');
    await page.locator('.gallery-grid').waitFor();
    device.steps.push('Preferências acessíveis no celular e dez artes da Bíblia');

    await nav('saves');
    assert.equal(await page.locator('[data-action="load-slot"][data-slot="0"]').isDisabled(), false);
    await page.locator('[data-action="save-slot"][data-slot="2"]').click();
    const manual = await awaitSave(page, state => state.stats.purchases === 1 && state.stats.hires === 1, 2);
    const downloadPromise = page.waitForEvent('download');
    await page.locator('[data-action="export-save"]').click();
    const download = await downloadPromise;
    const backupPath = path.join(OUT, viewport.width + '-save.json');
    await download.saveAs(backupPath);
    const exported = JSON.parse(await fs.readFile(backupPath, 'utf8'));
    assert.ok(exported.checksum && exported.payload, 'Backup precisa de envelope com checksum');
    await page.locator('#import-save').setInputFiles(backupPath);
    await page.getByRole('dialog', { name: 'Importar campanha' }).waitFor();
    await page.locator('[data-action="confirm-import"][data-slot="3"]').click();
    await awaitSave(page, state => state.stats.purchases === manual.stats.purchases, 3);
    await nav('saves');
    await page.locator('[data-action="load-slot"][data-slot="2"]').click();
    await page.locator('.office-scene').waitFor();
    await page.reload();
    await page.locator('[data-action="continue"]:not(:disabled)').waitFor();
    await page.locator('[data-action="new-game"]').click();
    await page.getByRole('dialog', { name: 'Iniciar outra gestão?' }).waitFor();
    await page.locator('[data-action="close-modal"]').click();
    await page.locator('.title-screen').waitFor();
    await page.locator('[data-action="continue"]').click();
    await page.locator('.office-scene').waitFor();
    await page.locator('[data-action="quick-save"]').click();
    const restored = await awaitSave(page, state => state.stats.purchases === 1 && state.stats.hires === 1 && state.stats.incidentsResolved === 1, 1);
    assert.equal(restored.fleet.length, manual.fleet.length);
    assert.equal(restored.staff.length, manual.staff.length);
    assert.equal(restored.buildings.length, manual.buildings.length);
    assert.deepEqual(restored.caseFile.actions, manual.caseFile.actions);
    assert.equal(restored.settings.highContrast, true);
    assert.equal((await saved(page, 2)).lastSavedAt, manual.lastSavedAt, 'Autosave não pode substituir arquivo manual 2');
    await noOverflow(page, 'restored', device);
    device.steps.push('Arquivo manual, autosave separado, export/import, confirmação e retomada');

    assert.deepEqual(device.errors, [], 'Erros no navegador');
    device.result = 'PASS';
  } catch (error) {
    device.result = 'FAIL';
    device.failure = { message: error.message, stack: error.stack };
    await screenshot('FAIL').catch(() => {});
    console.error(viewport.width + 'px FAIL: ' + error.message);
  } finally {
    await context.close();
    await fs.writeFile(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 2));
  }
}

async function testPortable(browser) {
  if (!process.env.BROWSER_PORTABLE_FILE) return;
  report.portable = { result: 'RUNNING', errors: [], networkRequests: [] };
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, offline: true });
  const page = await context.newPage();
  page.setDefaultTimeout(12000);
  page.on('pageerror', error => report.portable.errors.push(error.message));
  page.on('request', request => { if (/^https?:/.test(request.url())) report.portable.networkRequests.push(request.url()); });
  try {
    await page.goto(pathToFileURL(path.resolve(process.env.BROWSER_PORTABLE_FILE)).href);
    await page.locator('[data-action="new-game"]').waitFor();
    await page.screenshot({ path: path.join(OUT, 'portable-title.png'), fullPage: true });
    await page.locator('[data-action="new-game"]').click();
    await page.locator('[data-choice="audit"]').click();
    await page.locator('.office-scene').waitFor();
    await page.locator('.nav-item[data-screen="phone"]').click();
    assert.equal(await page.locator('.contact-row').count(), 12);
    await page.locator('.contact-row[data-id="P04"]').click();
    await page.locator('[data-person="P04"][data-topic="agenda"]').click();
    await page.locator('.call-dialog').waitFor();
    await page.screenshot({ path: path.join(OUT, 'portable-phone.png'), fullPage: true });
    assert.deepEqual(report.portable.errors, []);
    assert.deepEqual(report.portable.networkRequests, [], 'HTML portátil não pode depender de rede');
    report.portable.result = 'PASS';
  } catch (error) {
    report.portable.result = 'FAIL';
    report.portable.failure = { message: error.message, stack: error.stack };
    await page.screenshot({ path: path.join(OUT, 'portable-FAIL.png'), fullPage: true }).catch(() => {});
    console.error('Portable FAIL: ' + error.message);
  } finally { await context.close(); }
}

(async () => {
  await fs.mkdir(OUT, { recursive: true });
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
    for (const viewport of VIEWPORTS) await testViewport(browser, viewport);
    await testPortable(browser);
  } catch (error) {
    report.infrastructureFailure = { message: error.message, stack: error.stack };
    console.error(error);
  } finally {
    if (browser) await browser.close();
    report.finishedAt = new Date().toISOString();
    report.result = !report.infrastructureFailure && report.devices.length === VIEWPORTS.length && report.devices.every(device => device.result === 'PASS') && (!process.env.BROWSER_PORTABLE_FILE || report.portable.result === 'PASS') ? 'PASS' : 'FAIL';
    await fs.writeFile(path.join(OUT, 'browser-report.json'), JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (report.result !== 'PASS') process.exitCode = 1;
  }
})();
