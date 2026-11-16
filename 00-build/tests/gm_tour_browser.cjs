// Run with Playwright on NODE_PATH. Starts its own local static server.
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const root = path.resolve(__dirname, '../..');
const KEY = 'esl-gm-tour:v1';
const home = '/00-assets/html/gm-tour.htm';
const server = http.createServer((req, res) => {
  let filename;
  try { filename = path.resolve(root, '.' + decodeURIComponent(new URL(req.url, 'http://localhost').pathname)); }
  catch { res.writeHead(400).end(); return; }
  if (!filename.startsWith(root + path.sep)) { res.writeHead(403).end(); return; }
  const types = { '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.htm': 'text/html', '.html': 'text/html', '.png': 'image/png' };
  fs.readFile(filename, (err, data) => {
    if (err) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', (types[path.extname(filename)] || 'application/octet-stream') + (/\.(js|css|json|html?)$/.test(filename) ? '; charset=utf-8' : ''));
    res.end(data);
  });
});

(async () => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  const browser = await chromium.launch({ headless: true, channel: process.env.PLAYWRIGHT_CHANNEL || 'msedge' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => { errors.push(error.stack || error.message); console.error('PAGE ERROR:', error.message); });
  const title = () => page.locator('#gm-tour-panel h2');
  const next = async () => {
    await page.locator('[data-tour="next"]:not([disabled])').waitFor();
    await page.locator('[data-tour="next"]').click();
  };
  const start = async chapter => {
    await page.goto(base + home);
    await page.locator(`[data-chapter="${chapter}"]`).click();
    await page.waitForFunction(expected => document.querySelector('#gm-tour-panel h2')?.textContent === expected,
      ['You manage. The game simulates.', 'Choose your team', "Find your team's games", 'Select your club', 'Camps are player-development requests', 'Learn bids at any time'][chapter]);
    await page.locator('[data-tour="next"]:not([disabled])').waitFor();
  };
  try {
    await page.goto(base + home);
    await page.locator('[data-chapter="0"]').waitFor();
    assert.equal(await page.locator('[data-chapter]').count(), 6);
    assert.equal(await page.evaluate(() => document.querySelector('#gm-tour-panel') !== null), false);
    assert.equal(await page.evaluate(() => LeagueGmTour.phaseFromTitle('ESL - FA3 / TC')), 'FA3/TC');
    assert.equal(await page.evaluate(() => LeagueGmTour.phaseFromTitle('ESL - Sim 4')), 'Sim 4');
    assert.equal(await page.evaluate(() => LeagueGmTour.phaseFromTitle('ESL')), '');
    assert.equal(await page.evaluate(() => LeagueGmTour.phaseFromTitle('ESL - Offseason Preview')), 'Sim 6');
    await start(0);
    for (let i = 0; i < 4; i++) await next();
    assert.match(await title().textContent(), /League Format/);
    assert.deepEqual(await page.evaluate(key => JSON.parse(localStorage.getItem(key)).completed, KEY), [0]);
    console.log('PASS league format, phase labels, chapter completion');

    await start(1);
    await page.locator('#teamPicker option:nth-child(2)').waitFor({ state: 'attached' });
    await page.selectOption('#teamPicker', { index: 1 });
    await page.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'Your team at a glance');
    const remembered = await page.evaluate(key => JSON.parse(localStorage.getItem(key)).team, KEY);
    assert.match(remembered, /^roster\d+\.htm$/);
    await next();
    await next();
    await page.locator('#playerTable a[href*="player"]').first().click();
    await page.waitForURL(/unified-player|\/players\//);
    await page.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'The player profile');
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'The player profile');
    await page.locator('[data-tour="back"]').click();
    await page.waitForURL(/unified-roster/);
    await page.locator('[data-tour="exit"]').click();
    await page.locator('#gm-tour-reopen').click();
    await title().waitFor();
    console.log('PASS team selection, player navigation, refresh, Back, exit/resume');

    await start(2);
    await next();
    await page.locator('#recentResults a[href*="game="]').first().click();
    await page.waitForURL(/game=/);
    await page.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'The final score');
    await next(); await next();
    console.log('PASS result navigation and real box score');

    await start(3);
    await next();
    const draftBefore = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => /depth|camp|war-room/i.test(key))));
    await next(); await next();
    await page.evaluate(() => {
      Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText: () => Promise.reject(new Error('Blocked for test')) } });
    });
    await page.locator('#copy-button').click();
    await page.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'Post it to Discord');
    assert.match(await page.locator('#gm-tour-panel').textContent(), /cannot verify/);
    await next();
    const draftAfter = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => /depth|camp|war-room/i.test(key))));
    assert.deepEqual(draftAfter, draftBefore);
    console.log('PASS depth chart copy fallback and draft preservation');

    await start(4);
    for (let i = 0; i < 6; i++) await next();
    assert.match(await title().textContent(), /Camps/);
    console.log('PASS camp controls and optional preparation');

    await start(5);
    await next(); await next(); await next();
    await page.locator('#fa-player-body tr[data-player-file]').first().dblclick();
    await page.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'Enter contract terms');
    await next(); await next(); await next(); await next();
    assert.match(await title().textContent(), /Bids/);
    console.log('PASS FA drawer, optional bid preparation, destinations');

    // Missing targets must recover, rather than prevent the rest of the tour.
    await start(3);
    await page.evaluate(() => document.querySelector('#team-select').remove());
    await page.locator('[data-tour="retry"]').waitFor({ state: 'visible', timeout: 16000 });
    await page.locator('[data-tour="skip-step"]').click();
    assert.match(await title().textContent(), /rotation/);
    console.log('PASS unavailable-target recovery');

    await page.setViewportSize({ width: 390, height: 844 });
    await page.locator('[data-tour="next"]:not([disabled])').waitFor();
    const bounds = await page.locator('#gm-tour-panel').boundingBox();
    assert.ok(bounds.x >= 0 && bounds.x + bounds.width <= 391 && bounds.y >= 0 && bounds.y + bounds.height <= 845);
    await page.screenshot({ path: path.join(os.tmpdir(), 'esl-gm-tour-mobile.png') });
    await page.keyboard.press('Escape');
    assert.equal(await page.locator('#gm-tour-panel').count(), 0);
    console.log('PASS mobile bounds and keyboard exit');

    const blocked = await browser.newContext();
    await blocked.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('blocked', 'SecurityError'); } });
    });
    const blockedPage = await blocked.newPage();
    await blockedPage.goto(base + home);
    await blockedPage.locator('[data-chapter="3"]').click();
    await blockedPage.locator('#gm-tour-panel h2').waitFor();
    assert.match(await blockedPage.locator('#gm-tour-panel').textContent(), /storage is unavailable/i);
    await blockedPage.locator('[data-tour="next"]:not([disabled])').click();
    await blockedPage.reload();
    // In-memory progress is not promised after reload when storage is blocked.
    await blockedPage.goto(base + home);
    await blockedPage.locator('[data-chapter="1"]').click();
    await blockedPage.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'Choose your team');
    await blockedPage.locator('[data-tour="next"]:not([disabled])').waitFor();
    await blockedPage.selectOption('#teamPicker', { index: 1 });
    await blockedPage.waitForFunction(() => document.querySelector('#gm-tour-panel h2')?.textContent === 'Your team at a glance');
    await blockedPage.close(); await blocked.close();
    console.log('PASS storage-unavailable navigation');

    const framed = await browser.newContext();
    const shell = await framed.newPage();
    await shell.goto(base + '/index.htm');
    const menu = shell.frameLocator('iframe[name="Options"]');
    await menu.getByText('New GM Tour', { exact: true }).click();
    const data = shell.frameLocator('iframe[name="data"]');
    await data.locator('[data-chapter="3"]').click();
    await data.locator('#gm-tour-panel h2').waitFor();
    await data.locator('[data-tour="next"]:not([disabled])').click();
    assert.match(await data.locator('#gm-tour-panel h2').textContent(), /rotation/);
    assert.equal(await shell.locator('#gm-tour-panel').count(), 0);
    await framed.close();
    console.log('PASS menu entry and framed navigation');

    // Build nonempty drafts through the tools, then verify the tour and reset preserve them.
    await page.goto(base + '/00-assets/html/camps.htm');
    await page.locator('#playerSelect option:nth-child(2)').waitFor({ state: 'attached' });
    await page.locator('#addCampButton').click();
    await page.locator('#entryList .camp-entry').waitFor();
    await page.goto(base + '/00-assets/html/fa-war-room.htm');
    await page.locator('#fa-player-body tr[data-player-file]').first().dblclick();
    await page.locator('#fa-save-bid').click();
    await page.locator('#fa-bid-list .fa-bid-row').waitFor();
    const nonemptyDrafts = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => /depth|camp|war-room/i.test(key))));
    await start(4);
    for (let i = 0; i < 6; i++) await next();
    await start(5);
    for (let i = 0; i < 8; i++) await page.locator('[data-tour="skip-step"]').click();
    await page.goto(base + home);
    page.once('dialog', dialog => dialog.accept());
    await page.locator('#gm-tour-reset').click();
    await page.locator('[data-chapter="0"]').waitFor();
    const preservedDrafts = await page.evaluate(() => Object.fromEntries(Object.entries(localStorage).filter(([key]) => /depth|camp|war-room/i.test(key))));
    assert.deepEqual(preservedDrafts, nonemptyDrafts);
    console.log('PASS nonempty camp/bid draft preservation and tour-only reset');

    // Unknown phase must not retain a stale open-window implication.
    await page.route('**/index.htm', route => route.fulfill({ contentType: 'text/html', body: '<title>ESL</title>' }));
    await page.reload();
    await page.waitForFunction(() => document.querySelector('#gm-tour-phase')?.textContent.includes('Current phase unconfirmed'));
    await page.unroute('**/index.htm');
    console.log('PASS unknown-phase fallback');

    // Existing player-page media embeds request a missing media standings feed.
    // Exclude only that known unrelated error; tour and tool errors must fail.
    const unexpected = errors.filter(error => !(error.includes('Could not load standings: 404') && error.includes('/00-eslmedia/content/media-articles.js:')));
    assert.deepEqual(unexpected, [], 'No new uncaught errors on toured pages');
    if (errors.length) console.log('Existing media-embed standings 404 observed on player profiles (outside tour).');
    console.log('All GM tour browser checks passed.');
  } catch (error) {
    console.error('Failed at', page.url(), await page.locator('#gm-tour-panel').textContent().catch(() => '(no tour panel)'));
    await page.screenshot({ path: path.join(os.tmpdir(), 'esl-gm-tour-failure.png') });
    throw error;
  } finally { await browser.close(); server.close(); }
})().catch(error => { console.error(error); server.close(); process.exitCode = 1; });
