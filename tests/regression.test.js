import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData } from '../demo-data.js';
import translations from '../translations.js';
import * as locations from '../locations.js';
import * as ui from '../ui.js';
import * as maps from '../map.js';
import { request, writeAndRefresh, submitForm } from '../api.js';

function context() {
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, {
            value: '', checked: false, textContent: '', innerHTML: '', disabled: false,
            classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
            setAttribute() {}
        });
        return elements.get(id);
    };
    globalThis.document = { getElementById: element, querySelectorAll: () => [], querySelector: () => element('submit') };
    const app = { ...createDemoData(), translations, currentLanguage: 'hi' };
    for (const module of [locations, ui, maps]) {
        for (const [name, fn] of Object.entries(module)) app[name] = (...args) => fn(app, ...args);
    }
    for (const name of ['addMarkers', 'closeModal', 'showToast', 'openModal']) app[name] = () => {};
    return { app, element };
}

test('filters and rendered cards/popups retain translations and escaping', () => {
    const { app, element } = context();
    element('searchInput').value = 'KOREGAON';
    assert.equal(app.getFilteredLocations().length, 1);
    element('statusFilter').value = 'closed';
    assert.equal(app.getFilteredLocations().length, 0);
    for (const language of ['hi', 'en']) {
        app.currentLanguage = language;
        const html = app.createLocationCard({ ...app.bhandaaras[0], name: '<img src=x>' });
        assert.ok(html.includes('&lt;img src=x&gt;'));
        assert.ok(html.includes('data-action="checkin"'));
        assert.ok(!html.includes('onclick='));
        assert.ok(app.createPopupContent(app.bhandaaras[0]).includes('data-action="details"'));
    }
});

test('API sends credentialed JSON with idempotency and reports structured failures', async () => {
    const original = globalThis.fetch;
    try {
        globalThis.fetch = async (url, options) => {
            assert.equal(url, '/api/locations');
            assert.equal(options.credentials, 'same-origin');
            assert.equal(options.headers['Idempotency-Key'], 'retry-key');
            return new Response(JSON.stringify({ error: { message: 'Duplicate' } }), { status: 409 });
        };
        await assert.rejects(request('/locations', { method: 'POST', body: {}, key: 'retry-key' }),
            error => error.status === 409 && error.message === 'Duplicate');
        globalThis.fetch = async () => { throw new Error('offline'); };
        await assert.rejects(request('/locations'), error => error.status === 0);
    } finally { globalThis.fetch = original; }
});

test('retry retains request identity when post succeeds but refresh fails', async () => {
    const original = globalThis.fetch;
    const keys = [];
    let refreshes = 0;
    const app = { refreshData: async () => { if (++refreshes === 1) throw new Error('offline'); } };
    try {
        globalThis.fetch = async (url, options) => {
            keys.push(options.headers['Idempotency-Key']);
            return new Response(JSON.stringify({ id: 11 }));
        };
        await assert.rejects(writeAndRefresh(app, '/locations', { name: 'Test' }));
        assert.equal((await writeAndRefresh(app, '/locations', { name: 'Test' })).id, 11);
        assert.equal(keys[0], keys[1]);
        assert.equal(app.pendingWrites.size, 0);
    } finally { globalThis.fetch = original; }
});

test('form submission blocks double-clicks and restores the button on failure', async () => {
    const { app, element } = context();
    let release;
    const gate = new Promise(resolve => { release = resolve; });
    let calls = 0;
    const action = async () => { calls++; await gate; throw Object.assign(new Error('Invalid'), { status: 422 }); };
    const first = submitForm(app, 'checkinForm', action);
    await submitForm(app, 'checkinForm', action);
    assert.equal(calls, 1);
    assert.equal(element('submit').disabled, true);
    release();
    await first;
    assert.equal(element('submit').disabled, false);
    assert.equal(element('checkinError').textContent, 'Invalid');
});

test('picker initializes once, updates coordinates and releases state on close', () => {
    const { app, element } = context();
    const events = {};
    let created = 0;
    let removed = 0;
    const map = { setView() { return this; }, on(name, callback) { events[name] = callback; },
        removeLayer() {}, remove() { removed++; } };
    globalThis.L = {
        map() { created++; return map; },
        tileLayer() { return { addTo() {} }; },
        marker() { return { addTo() { return this; }, on(name, callback) { events[name] = callback; } }; }
    };
    app.initializeMapPicker();
    app.initializeMapPicker();
    assert.equal(created, 1);
    events.click({ latlng: { lat: 18.5, lng: 73.8 } });
    assert.equal(element('locationAddress').value, '18.500000, 73.800000');
    events.dragend({ target: { getLatLng: () => ({ lat: 19, lng: 74 }) } });
    assert.equal(element('locationAddress').value, '19.000000, 74.000000');
    app.destroyMapPicker();
    assert.equal(removed, 1);
    assert.equal(app.selectedCoordinates, null);
    app.initializeMapPicker();
    assert.equal(created, 2);
});

test('statistics render server totals rather than a filtered client subset', () => {
    const { app, element } = context();
    app.bhandaaras = [];
    app.stats = { totalLocations: 11, activeToday: 7, totalCheckins: 20007, checkinsToday: 448 };
    app.updateStats();
    assert.equal(element('totalLocations').textContent, 11);
    assert.equal(element('activeToday').textContent, 7);
});
