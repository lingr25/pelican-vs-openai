const { test, before, after } = require('node:test');
const assert = require('node:assert/strict');
const { chromium } = require('playwright');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
let browser, server, url;
before(async () => {
  server = http.createServer((req, res) => {
    const file = path.join(__dirname, '..', req.url === '/' ? 'index.html' : req.url);
    const types = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.png': 'image/png', '.mp3': 'audio/mpeg', '.jpg': 'image/jpeg' };
    if (!fs.existsSync(file) || !fs.statSync(file).isFile()) { res.writeHead(404).end(); return; }
    res.setHeader('Content-Type', types[path.extname(file)] || 'application/octet-stream');
    fs.createReadStream(file).pipe(res);
  }).listen(0, '127.0.0.1');
  await new Promise(resolve => server.once('listening', resolve));
  url = `http://127.0.0.1:${server.address().port}`;
  browser = await chromium.launch({ headless: true });
});
after(async () => { await browser?.close(); server?.close(); });

test('combat controls are hidden in the menu and on the result screen', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    assert.equal(await page.locator('#touchDash').isVisible(), false);
    await page.locator('#btnStart').click();
    assert.equal(await page.locator('#touchDash').isVisible(), true);
    assert.equal(await page.locator('#hud').isVisible(), true);
    await page.evaluate(() => window.__game.kill());
    await page.locator('#over:not(.hide)').waitFor();
    assert.equal(await page.locator('#touchBomb').isVisible(), false);
    await page.locator('#btnRetry').focus();
    await page.keyboard.press('r');
    assert.equal(await page.evaluate(() => window.__game.state), 'playing');
  } finally { await page.close(); }
});

test('character selection works with keyboard without starting combat', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    const option = page.locator('[data-char="jensen"]');
    await option.focus();
    await page.keyboard.press('Space');
    assert.equal(await page.evaluate(() => window.__game.state), 'menu');
    assert.equal(await page.evaluate(() => window.__game.char.id), 'jensen');
    assert.equal(await option.getAttribute('aria-pressed'), 'true');
  } finally { await page.close(); }
});

test('dash cooldown and pause prevent repeated ability activation', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    await page.locator('#btnStart').click();
    const zones = await page.evaluate(() => {
      const g = window.__game;
      g.selectChar('anthropic'); g.start(); g.dash(); g.dash();
      return g.thinkingZones.length;
    });
    assert.equal(zones, 1, 'one dash should create one thinking zone');
    await page.evaluate(() => window.__game.start());
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => { window.__game.dash(); return window.__game.thinkingZones.length; }), 0);
  } finally { await page.close(); }
});

test('short phone screens can reach the start button without horizontal overflow', async () => {
  const page = await browser.newPage({ viewport: { width: 375, height: 500 } });
  try {
    await page.goto(url);
    await page.locator('#btnStart').scrollIntoViewIfNeeded();
    const box = await page.locator('#btnStart').boundingBox();
    assert.ok(box.y >= 0 && box.y + box.height <= 500, 'start button must be reachable');
    const top = page.locator('#menu .bossline');
    await top.scrollIntoViewIfNeeded();
    const first = await top.boundingBox();
    assert.ok(first.y >= 0, 'top of the menu must remain reachable');
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
  } finally { await page.close(); }
});

test('portable build reaches victory and restarts with no browser errors', async () => {
  const page = await browser.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  try {
    await page.goto(url + '/portable.html');
    await page.locator('#btnStart').click();
    await page.evaluate(() => { window.__game.addEnergy(100); window.__game.bomb(); window.__game.setProgress(1); window.__game.win(); });
    await page.locator('#win:not(.hide)').waitFor();
    await page.locator('#btnAgain').click();
    assert.equal(await page.evaluate(() => window.__game.state), 'playing');
    assert.deepEqual(errors, []);
  } finally { await page.close(); }
});

test('the HUD keeps refreshing time and quota during combat', async () => {
  const page = await browser.newPage();
  try {
    await page.goto(url);
    await page.locator('#btnStart').click();
    await page.evaluate(() => { window.__game.freezeBoss(60); window.__game.setProgress(0.25); });
    await page.waitForFunction(() => document.querySelector('#tAlive').textContent !== '0:00', null, { timeout: 4000 });
    assert.notEqual(await page.locator('#tAlive').textContent(), '0:00');
    assert.ok(parseFloat(await page.locator('#pct').textContent()) >= 25);
  } finally { await page.close(); }
});
