import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname } from 'node:path';
import { createRequire } from 'node:module';
import assert from 'node:assert/strict';

// Set PLAYWRIGHT_PACKAGE to use an existing installation, or install Playwright locally.
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const root = resolve(import.meta.dirname, '..');
const server = createServer(async (req, res) => {
    const path = resolve(root, '.' + (req.url === '/' ? '/index.html' : req.url));
    if (!path.startsWith(root + '/')) { res.writeHead(403).end(); return; }
    try {
        const data = await readFile(path);
        res.setHeader('Content-Type', ({ '.js': 'text/javascript', '.html': 'text/html', '.css': 'text/css' })[extname(path)] || 'application/octet-stream');
        res.end(data);
    } catch { res.writeHead(404).end(); }
});
await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
let browser;
try {
    browser = await chromium.launch({
        headless: true,
        timeout: 15000,
        ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
    });
    const page = await browser.newPage();
    page.setDefaultTimeout(10000);
    console.log('Browser launched');
    const errors = [];
    page.on('pageerror', error => { errors.push(error.message); console.error('Page error:', error.message); });
    await page.goto('http://127.0.0.1:' + server.address().port, { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log('Page loaded');
    await page.waitForSelector('#map .leaflet-pane', { state: 'attached' });
    await page.click('#listViewBtn');
    assert.equal(await page.locator('.location-card').count(), 10);
    await page.click('#langToggle');
    await page.fill('#searchInput', 'Koregaon');
    assert.equal(await page.locator('.location-card').count(), 1);
    await page.fill('#searchInput', '');
    await page.click('.location-card [data-action="checkin"] >> nth=0');
    await page.waitForSelector('#signinModal:not(.hidden)');
    await page.fill('#signinEmail', 'test@example.com');
    await page.fill('#signinPassword', 'secret');
    await page.check('#rememberMe');
    await page.click('#signinForm button[type=submit]');
    await page.click('.location-card [data-action="checkin"] >> nth=0');
    await page.click('[data-rating="5"]');
    await page.fill('#checkinFeedback', 'Browser regression review');
    await page.click('#checkinForm button[type=submit]');
    assert.equal(await page.evaluate(() => JSON.parse(localStorage.bhandaaras)[0].reviews.at(-1).comment), 'Browser regression review');
    await page.click('#addLocationBtn');
    await page.waitForSelector('#mapPicker .leaflet-pane', { state: 'attached' });
    await page.locator('#mapPicker').click({ position: { x: 150, y: 120 } });
    await page.fill('#locationName', 'Browser test location');
    await page.fill('#locationAddress', 'Confirmed test address');
    await page.selectOption('#locationType', 'daily');
    await page.fill('#locationTimings', '12 PM - 2 PM');
    await page.locator('.day-checkbox input').first().check();
    await page.click('#addLocationForm button[type=submit]');
    assert.equal(await page.locator('.location-card').count(), 11);
    await page.reload();
    await page.click('#listViewBtn');
    assert.equal(await page.locator('.location-card').count(), 11);
    await page.click('#addLocationBtn');
    await page.waitForSelector('#mapPicker .leaflet-pane', { state: 'attached' });
    await page.keyboard.press('Escape');
    await page.click('#mapViewBtn');
    await page.locator('.leaflet-interactive').first().click();
    await page.locator('.leaflet-popup [data-action="details"]').click();
    assert.equal(await page.evaluate(() => typeof window.app), 'undefined');
    assert.deepEqual(errors, []);
    console.log('Browser regression passed: language, filters, delegated actions, authentication, check-in, location creation, reload, picker lifecycle, map popup; no page errors.');
} catch (error) {
    console.error(error);
    process.exitCode = 1;
} finally {
    await browser?.close();
    server.closeAllConnections();
    await new Promise(resolve => server.close(resolve));
}
