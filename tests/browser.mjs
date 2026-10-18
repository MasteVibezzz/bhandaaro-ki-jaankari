import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8001';
const suffix = Date.now();
const email = 'browser' + suffix + '@example.com';
const password = 'browser-test-password';
const tileRequests = [];
async function fixtureMapTiles(context) {
    // Never repeatedly fetch community-hosted map tiles in automated regression runs.
    await context.route(/^https:\/\/(?:[a-z]\.)?tile\.openstreetmap\.org\//, async route => {
        const headers = await route.request().allHeaders();
        tileRequests.push({ url: route.request().url(), referer: headers.referer });
        await route.fulfill({
            status: 200, contentType: 'image/svg+xml',
            body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#edf1ed"/></svg>'
        });
    });
}
const browser = await chromium.launch({
    headless: true, timeout: 15000,
    ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})
});
try {
    const context = await browser.newContext();
    await fixtureMapTiles(context);
    const page = await context.newPage();
    page.setDefaultTimeout(15000);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    const initialResponse = await page.goto(base, { waitUntil: 'domcontentloaded' });
    assert.equal(initialResponse.headers()['referrer-policy'], 'strict-origin-when-cross-origin');
    await page.locator('#dataStatus').filter({ hasText: 'जानकारी अपडेट' }).waitFor();
    await page.locator('#map .leaflet-pane').first().waitFor({ state: 'attached' });
    await page.locator('#map .leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]').waitFor();
    await page.click('#listViewBtn');
    const baseline = await page.locator('.location-card').count();
    assert.ok(baseline >= 10);
    await page.click('#langToggle');
    await page.fill('#searchInput', 'Koregaon');
    assert.equal(await page.locator('.location-card').count(), 1);
    await page.selectOption('#statusFilter', 'closed');
    assert.equal(await page.locator('.location-card').count(), 0);
    await page.selectOption('#statusFilter', '');
    await page.fill('#searchInput', '');
    await page.locator('.location-card [data-action="checkin"]').first().click();
    await page.waitForSelector('#signinModal:not(.hidden)');
    await page.click('#switchToSignup');
    await page.fill('#signupName', 'Browser Tester');
    await page.fill('#signupEmail', email);
    await page.fill('#signupPassword', password);
    await page.fill('#signupConfirmPassword', password);
    await page.check('#agreeTerms');
    await page.click('#signupForm button[type=submit]');
    await page.locator('#signupModal').waitFor({ state: 'hidden' });
    let cookie = (await context.cookies()).find(item => item.name === 'bhandaaro_session');
    assert.ok(cookie.httpOnly && cookie.expires === -1);
    await page.click('#userProfile');
    let [logoutResponse] = await Promise.all([
        page.waitForResponse(response => response.url().endsWith('/api/auth/logout')),
        page.click('#signoutBtn')
    ]);
    assert.equal(logoutResponse.status(), 200);
    await page.locator('#guestButtons').waitFor({ state: 'visible' });
    await page.click('#signinBtn');
    await page.fill('#signinEmail', email);
    await page.fill('#signinPassword', 'wrong-password');
    await page.click('#signinForm button[type=submit]');
    await page.locator('#signinError').filter({ hasText: 'Invalid email or password' }).waitFor();
    await page.fill('#signinPassword', password);
    await page.check('#rememberMe');
    await page.click('#signinForm button[type=submit]');
    await page.locator('#signinModal').waitFor({ state: 'hidden' });
    cookie = (await context.cookies()).find(item => item.name === 'bhandaaro_session');
    assert.ok(cookie.httpOnly && cookie.expires > Date.now() / 1000);
    const before = Number((await page.locator('#totalCheckins').textContent()).replace(/,/g, ''));
    await page.locator('.location-card [data-action="checkin"]').first().click();
    await page.locator('[data-rating="5"]').focus();
    await page.keyboard.press('Enter');
    assert.equal(await page.locator('[data-rating="5"]').getAttribute('aria-pressed'), 'true');
    await page.fill('#checkinFeedback', 'Browser regression review');
    await page.click('#checkinForm button[type=submit]');
    await page.locator('#checkinModal').waitFor({ state: 'hidden' });
    assert.equal(Number((await page.locator('#totalCheckins').textContent()).replace(/,/g, '')), before + 1);
    await page.click('#addLocationBtn');
    await page.locator('#mapPicker .leaflet-pane').first().waitFor({ state: 'attached' });
    await page.locator('#mapPicker .leaflet-control-attribution a[href="https://www.openstreetmap.org/copyright"]').waitFor();
    await page.locator('#mapPicker').click({ position: { x: 150, y: 120 } });
    await page.fill('#locationName', 'Browser kitchen ' + suffix);
    await page.fill('#locationAddress', 'Confirmed test address');
    await page.selectOption('#locationType', 'daily');
    await page.fill('#locationTimings', '12 PM - 2 PM');
    await page.locator('.day-checkbox input').first().check();
    await page.click('#addLocationForm button[type=submit]');
    await page.locator('#addLocationModal').waitFor({ state: 'hidden' });
    assert.equal(await page.locator('.location-card').count(), baseline + 1);
    await page.reload();
    await page.locator('#dataStatus').filter({ hasText: 'Information is up to date.' }).waitFor();
    await page.click('#listViewBtn');
    assert.equal(await page.locator('.location-card').count(), baseline + 1);
    await page.locator('#userMenu').waitFor({ state: 'visible' });
    const other = await browser.newContext();
    await fixtureMapTiles(other);
    const second = await other.newPage();
    await second.goto(base);
    await second.locator('#dataStatus').filter({ hasText: 'जानकारी अपडेट' }).waitFor();
    await second.click('#listViewBtn');
    await second.fill('#searchInput', 'Browser kitchen ' + suffix);
    assert.equal(await second.locator('.location-card').count(), 1);
    assert.equal(await second.locator('#guestButtons').isVisible(), true);
    await other.close();
    await page.click('#addLocationBtn');
    await page.locator('#mapPicker .leaflet-pane').first().waitFor({ state: 'attached' });
    await page.keyboard.press('Escape');
    await page.click('#mapViewBtn');
    await page.locator('.leaflet-interactive').first().click();
    await page.locator('.leaflet-popup [data-action="details"]').click();
    await page.route('**/api/locations', route => route.abort());
    await page.reload();
    await page.locator('#dataStatus').filter({ hasText: 'Cannot reach the server' }).waitFor();
    await page.unroute('**/api/locations');
    await page.click('#retryLoad');
    await page.locator('#dataStatus').filter({ hasText: 'Information is up to date.' }).waitFor();
    await page.click('#userProfile');
    [logoutResponse] = await Promise.all([
        page.waitForResponse(response => response.url().endsWith('/api/auth/logout')),
        page.click('#signoutBtn')
    ]);
    assert.equal(logoutResponse.status(), 200);
    await page.locator('#guestButtons').waitFor({ state: 'visible' });
    assert.ok(!(await context.cookies()).some(item => item.name === 'bhandaaro_session'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.click('#listViewBtn');
    await page.fill('#searchInput', 'Koregaon');
    assert.equal(await page.locator('.location-card').count(), 1);
    assert.equal(await page.locator('#listViewBtn').getAttribute('aria-label'), 'List view');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth);
    assert.equal(overflow, false);
    assert.ok(tileRequests.length > 0);
    for (const tile of tileRequests) {
        assert.equal(new URL(tile.url).hostname, 'tile.openstreetmap.org');
        assert.equal(tile.referer, new URL(base).origin + '/');
    }
    assert.deepEqual(errors, []);
    console.log('Full-stack browser test passed: auth, cookies, filters, picker, writes, totals, reload, second session, logout, API failure and retry.');
} finally {
    await browser.close();
}
