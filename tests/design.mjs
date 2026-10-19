import { createRequire } from 'node:module';
import assert from 'node:assert/strict';
const require = createRequire(import.meta.url);
const { chromium } = require(process.env.PLAYWRIGHT_PACKAGE || 'playwright');
const base = process.env.BASE_URL || 'http://127.0.0.1:8001';
const browser = await chromium.launch({headless: true, ...(process.env.CHROME_PATH ? { executablePath: process.env.CHROME_PATH } : {})});
function contrast(foreground, background) {
    const luminance = color => {
        const channels = color.match(/[\d.]+/g).slice(0, 3).map(value => Number(value) / 255)
            .map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
        return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
    };
    const a = luminance(foreground), b = luminance(background);
    return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
try {
    const context = await browser.newContext({colorScheme: 'light', reducedMotion: 'reduce'});
    await context.route(/^https:\/\/(?:[a-z]\.)?tile\.openstreetmap\.org\//, route => route.fulfill({
        status: 200, contentType: 'image/svg+xml',
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect width="256" height="256" fill="#dde5dc"/></svg>'
    }));
    const page = await context.newPage();
    await page.setViewportSize({width: 1440, height: 1000});
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(base);
    await page.locator('#dataStatus').filter({hasText: 'जानकारी अपडेट'}).waitFor();
    assert.ok(await page.locator('#listSection').isVisible());
    assert.ok(await page.locator('#mapSection').isVisible());
    // Sticky map belongs only to the directory: community content must not extend its travel.
    const directory = await page.evaluate(() => {
        const list = document.querySelector('#listSection').getBoundingClientRect();
        return {top: list.top + scrollY, bottom: list.bottom + scrollY, height: list.height};
    });
    await page.evaluate(top => scrollTo(0, top), directory.top + directory.height / 2);
    assert.ok(await page.locator('#mapSection').evaluate(element => Math.abs(element.getBoundingClientRect().top - 24) <= 1));
    await page.evaluate(bottom => scrollTo(0, bottom - 200), directory.bottom);
    const boundary = await page.evaluate(() => ({
        map: document.querySelector('#mapSection').getBoundingClientRect().bottom,
        list: document.querySelector('#listSection').getBoundingClientRect().bottom,
        community: document.querySelector('#community').getBoundingClientRect().top
    }));
    assert.ok(boundary.map <= boundary.list + 1, JSON.stringify(boundary));
    assert.ok(boundary.map < boundary.community, JSON.stringify(boundary));
    await page.evaluate(() => scrollTo(0, 0));
    // Persistent labels, independent of placeholders and visual icons.
    assert.equal(await page.getByLabel('नाम या इलाके से खोजें', {exact:true}).count(), 1);
    await page.click('#langToggle');
    for (const language of ['en', 'hi']) {
      if (await page.locator('html').getAttribute('lang') !== language) await page.click('#langToggle');
      for (const scheme of ['light', 'dark']) {
        await page.emulateMedia({colorScheme: scheme});
        await page.evaluate(() => document.documentElement.style.fontSize = '100%');
        await page.setViewportSize({width:1440, height:1000});
        await page.click('#mapViewBtn');
        await page.locator('#map .leaflet-interactive[role="button"]').first().press('Enter');
        await page.locator('.leaflet-popup').waitFor({state:'visible'});
        const popup = await page.evaluate(() => {
            const style = selector => getComputedStyle(document.querySelector(selector));
            return {
                background: style('.leaflet-popup-content-wrapper').backgroundColor,
                surface: style('.location-card').backgroundColor,
                title: style('.popup-title').color,
                details: style('.popup-detail').color,
                attribution: style('.leaflet-control-attribution').color,
                attributionBackground: style('.leaflet-control-attribution').backgroundColor,
                tileFilter: style('#map .leaflet-tile-pane').filter,
                popupFilter: style('.leaflet-popup-pane').filter,
                markerFilter: style('.leaflet-overlay-pane').filter,
                tracking: style('.location-title').letterSpacing,
                weight: style('.location-title').fontWeight,
                palettePairs: [
                    ['.location-title', '.location-card'],
                    ['.location-detail', '.location-card'],
                    ['#addLocationBtn', '#addLocationBtn'],
                    ['.location-status', '.location-status'],
                    ['.header-nav a', '.header'],
                    ['.app-subtitle', '.header'],
                    ['.form-help', '.modal-content']
                ].map(([foreground, background]) => ({
                    foreground: style(foreground).color,
                    background: style(background).backgroundColor,
                    name: foreground
                }))
            };
        });
        assert.equal(popup.background, popup.surface, `${scheme}: popup must use the theme surface`);
        assert.ok(contrast(popup.title, popup.background) >= 4.5, `${scheme}: popup title contrast`);
        assert.ok(contrast(popup.details, popup.background) >= 4.5, `${scheme}: popup details contrast`);
        assert.ok(contrast(popup.attribution, popup.attributionBackground) >= 4.5, `${scheme}: map attribution contrast`);
        assert.equal(popup.tileFilter === 'none', scheme === 'light');
        assert.equal(popup.popupFilter, 'none');
        assert.equal(popup.markerFilter, 'none');
        assert.equal(popup.tracking, 'normal');
        assert.equal(popup.weight, '600');
        for (const pair of popup.palettePairs) {
            assert.ok(contrast(pair.foreground, pair.background) >= 4.5, `${scheme}: ${pair.name} contrast`);
        }
        if (language === 'en') await page.screenshot({path:`test-results/map-popup-${scheme}.png`, fullPage:false});
        await page.locator('.leaflet-popup-close-button').click();
        for (const width of [1440, 768, 390, 320]) {
            await page.setViewportSize({width, height: 1000});
            for (const fontSize of ['100%', '200%']) {
                await page.evaluate(size => document.documentElement.style.fontSize = size, fontSize);
                const overflow = await page.evaluate(() => ({
                    page: document.documentElement.scrollWidth > innerWidth,
                    elements: [...document.querySelectorAll('header *, .intro *, #directory *, .results-toolbar *, .location-card *')]
                        .filter(el => el.getClientRects().length && getComputedStyle(el).position !== 'absolute')
                        .filter(el => el.getBoundingClientRect().right > innerWidth + 1).map(el => el.id || el.className)
                }));
                assert.equal(overflow.page, false, `${scheme} ${width}px ${fontSize}: ${JSON.stringify(overflow)}`);
                assert.deepEqual(overflow.elements, [], `${scheme} ${width}px ${fontSize}`);
                if (language === 'en' && fontSize === '100%' && (width === 1440 || width === 390)) {
                    await page.screenshot({path: `test-results/design-${scheme}-${width}.png`, fullPage: false});
                }
            }
        }
      }
    }
    if (await page.locator('html').getAttribute('lang') !== 'en') await page.click('#langToggle');
    await page.evaluate(() => document.documentElement.style.fontSize = '100%');
    await page.setViewportSize({width: 390, height: 844});
    await page.click('#listViewBtn');
    assert.ok(await page.locator('#listSection').isVisible());
    assert.equal(await page.locator('#mapSection').isVisible(), false);
    await page.click('#mapViewBtn');
    assert.ok(await page.locator('#mapSection').isVisible());
    assert.equal(await page.locator('#listSection').isVisible(), false);
    await page.click('#listViewBtn');
    await page.getByLabel('Search by name or neighbourhood', {exact:true}).fill('no-such-venue-12345');
    await page.getByRole('button', {name: 'Clear filters', exact:true}).click();
    assert.ok(await page.locator('.location-card').count() >= 10);
    assert.ok(await page.locator('.location-card .demo-tag').count() >= 10);
    const directions = await page.locator('.location-card a').first().getAttribute('href');
    assert.ok(directions.startsWith('https://www.google.com/maps/dir/?api=1&destination='));
    // Modal focus must stay inside, return to the trigger, and leave the page operable.
    await page.click('#signinBtn');
    const dialog = page.getByRole('dialog', {name: 'Sign In', exact:true});
    await dialog.waitFor();
    assert.ok(await page.locator('.header').evaluate(element => element.inert));
    await page.keyboard.press('Shift+Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'switchToSignup');
    await page.keyboard.press('Tab');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'signinClose');
    for (let i = 0; i < 12; i++) {
        await page.keyboard.press('Tab');
        assert.ok(await dialog.evaluate(element => element.contains(document.activeElement)));
    }
    await page.keyboard.press('Escape');
    assert.equal(await page.evaluate(() => document.activeElement.id), 'signinBtn');
    assert.equal(await page.locator('.header').evaluate(element => element.inert), false);
    const focus = await page.locator('#signinBtn').evaluate(element => ({style:getComputedStyle(element).outlineStyle, width:getComputedStyle(element).outlineWidth}));
    assert.equal(focus.style, 'solid');
    assert.equal(focus.width, '3px');
    const unlabelled = await page.evaluate(() => [...document.querySelectorAll('input, select, textarea')]
        .filter(element => !element.labels?.length && !element.getAttribute('aria-label') && !element.getAttribute('aria-labelledby'))
        .map(element => element.id));
    assert.deepEqual(unlabelled, []);
    await page.click('#langToggle');
    await page.setViewportSize({width: 320, height: 844});
    assert.equal(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth), false);
    assert.deepEqual(errors, []);
    console.log('Design checks passed: popup contrast, scoped dark maps, normal text spacing, light/dark, 320/390/768/1440px, 200% text, bilingual labels, views and keyboard dialogs.');
} finally {
    await browser.close();
}
