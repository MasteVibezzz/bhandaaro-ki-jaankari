import test from 'node:test';
import assert from 'node:assert/strict';
import { createDemoData } from '../demo-data.js';
import translations from '../translations.js';
import * as locations from '../locations.js';
import * as auth from '../auth.js';
import * as ui from '../ui.js';
import * as maps from '../map.js';
import { readStorage, writeStorage } from '../storage.js';

function storage() {
    const values = new Map();
    return { getItem: key => values.get(key) ?? null,
        setItem: (key, value) => values.set(key, String(value)),
        removeItem: key => values.delete(key) };
}

function context() {
    globalThis.localStorage = storage();
    globalThis.sessionStorage = storage();
    const elements = new Map();
    const element = id => {
        if (!elements.has(id)) elements.set(id, {
            value: '', checked: false, textContent: '', innerHTML: '',
            classList: { add() {}, remove() {}, contains() { return false; } }
        });
        return elements.get(id);
    };
    globalThis.document = { getElementById: element, querySelectorAll: () => [] };
    const app = { ...createDemoData(), translations, currentLanguage: 'hi' };
    for (const module of [locations, auth, ui]) {
        for (const [name, fn] of Object.entries(module)) app[name] = (...args) => fn(app, ...args);
    }
    for (const name of ['addMarkers', 'closeModal', 'showToast', 'openModal']) app[name] = () => {};
    return { app, element };
}

test('restoration preserves seeded updates, custom locations, legacy reviews and unique activity', () => {
    const { app } = context();
    const updated = { ...app.bhandaaras[0], totalCheckins: 9999 };
    writeStorage('bhandaaras', [updated, updated, { ...updated, id: 42 }]);
    writeStorage('recentActivity', [app.recentActivity[0], app.recentActivity[0]]);
    app.loadStoredData();
    app.loadStoredData();
    assert.equal(app.bhandaaras.length, 11);
    assert.equal(app.bhandaaras[0].totalCheckins, 9999);
    assert.equal(typeof app.bhandaaras[0].reviews[0].rating, 'number');
    assert.equal(app.recentActivity.length, 5);
    const second = createDemoData();
    second.bhandaaras[0].reviews.push('changed');
    assert.equal(createDemoData().bhandaaras[0].reviews.length, 4);
});

test('filters and both language dictionaries retain rendered escaping and action routing', () => {
    const { app, element } = context();
    app.loadStoredData();
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

test('Remember Me selects the correct store and sign-out clears both', () => {
    const { app, element } = context();
    element('signinEmail').value = 'tester@example.com';
    element('signinPassword').value = 'secret';
    for (const remember of [true, false]) {
        element('rememberMe').checked = remember;
        app.handleSignin({ preventDefault() {} });
        assert.equal(Boolean(readStorage('currentUser', null, localStorage)), remember);
        assert.equal(Boolean(readStorage('currentUser', null, sessionStorage)), !remember);
    }
    app.signOut();
    assert.equal(app.currentUser, null);
    assert.equal(readStorage('currentUser', null, sessionStorage), null);
    assert.equal(readStorage('currentUser', null, localStorage), null);
});

test('check-ins persist ratings, activity and totals and immediately render list cards', () => {
    const { app, element } = context();
    app.loadStoredData();
    app.currentUser = { name: 'Tester', email: 'tester@example.com' };
    app.selectedLocation = app.bhandaaras[0];
    const before = app.selectedLocation.totalCheckins;
    app.selectedRating = 5;
    element('checkinFeedback').value = 'Good food';
    app.handleCheckin({ preventDefault() {} });
    assert.equal(app.selectedLocation.totalCheckins, before + 1);
    assert.equal(app.selectedLocation.reviews.at(-1).rating, 5);
    assert.ok(element('locationsList').innerHTML.includes('location-card'));
    assert.equal(readStorage('recentActivity', [])[0].feedback, 'Good food');
    app.loadStoredData();
    assert.equal(app.bhandaaras[0].totalCheckins, before + 1);
});

test('signup and new location persist together with activity and derived statistics', () => {
    const { app, element } = context();
    app.loadStoredData();
    element('signupName').value = 'Tester';
    element('signupEmail').value = 'tester@example.com';
    element('signupPassword').value = 'secret';
    element('signupConfirmPassword').value = 'secret';
    element('agreeTerms').checked = true;
    app.handleSignup({ preventDefault() {} });
    assert.equal(readStorage('currentUser', null, sessionStorage).name, 'Tester');
    assert.equal(readStorage('currentUser', null, localStorage), null);
    app.selectedCoordinates = { lat: 18.5, lng: 73.8 };
    element('locationName').value = 'Test kitchen';
    element('locationAddress').value = 'Confirmed address';
    element('locationType').value = 'daily';
    element('locationTimings').value = '12 - 2';
    document.querySelectorAll = selector => selector === '.day-checkbox input:checked' ? [{ value: 'Monday' }] : [];
    app.handleAddLocation({ preventDefault() {} });
    assert.equal(app.bhandaaras.length, 11);
    assert.equal(readStorage('recentActivity', [])[0].location, 'Test kitchen');
    assert.equal(readStorage('bhandaaras', []).at(-1).address, 'Confirmed address');
    assert.equal(locations.calculateStats(app.bhandaaras).totalLocations, 11);
    app.loadStoredData();
    assert.equal(app.bhandaaras.length, 11);
});

test('picker creates once, updates coordinate fallback, and releases state on close', () => {
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
    for (const [name, fn] of Object.entries(maps)) app[name] = (...args) => fn(app, ...args);
    app.initializeMapPicker();
    app.initializeMapPicker();
    assert.equal(created, 1);
    events.click({ latlng: { lat: 18.5, lng: 73.8 } });
    assert.equal(element('locationAddress').value, '18.500000, 73.800000');
    events.dragend({ target: { getLatLng: () => ({ lat: 19, lng: 74 }) } });
    assert.equal(element('locationAddress').value, '19.000000, 74.000000');
    app.destroyMapPicker();
    assert.equal(removed, 1);
    assert.equal(app.mapPicker, null);
    assert.equal(app.selectedCoordinates, null);
    app.initializeMapPicker();
    assert.equal(created, 2);
});

test('malformed and unavailable storage falls back without losing plain language strings', () => {
    context();
    localStorage.setItem('bhandaaras', '{');
    const warn = console.warn;
    console.warn = () => {};
    try {
        assert.deepEqual(readStorage('bhandaaras', []), []);
        const denied = { getItem() { throw new Error('blocked'); }, setItem() { throw new Error('blocked'); } };
        assert.equal(readStorage('x', 'fallback', denied), 'fallback');
        assert.equal(writeStorage('x', {}, denied), false);
        writeStorage('preferredLanguage', 'en', localStorage, false);
        assert.equal(localStorage.getItem('preferredLanguage'), 'en');
    } finally { console.warn = warn; }
});

test('initialization installs exactly one resize and orientation handler', async () => {
    globalThis.document = { readyState: 'loading', addEventListener() {} };
    const listeners = [];
    globalThis.window = { addEventListener: name => listeners.push(name) };
    const { BhandaaraApp } = await import('../app.js');
    const app = Object.create(BhandaaraApp.prototype);
    const calls = [];
    for (const name of ['loadStoredData', 'loadLanguagePreference', 'checkAuthState',
        'initializeMap', 'bindEvents', 'renderLocations', 'renderActivityFeed',
        'updateStats', 'applyTranslations', 'setInitialView']) {
        app[name] = () => calls.push(name);
    }
    app.init();
    app.init();
    assert.equal(calls.length, 10);
    assert.deepEqual(listeners, ['orientationchange', 'resize']);
});
