import { submitForm, writeAndRefresh } from './api.js';

export function updateScheduleFields() {
    const oneTime = document.getElementById('scheduleKind').value === 'one_time';
    document.getElementById('eventFields').classList.toggle('hidden', !oneTime);
    for (const id of ['eventStart', 'eventEnd']) {
        const input = document.getElementById(id);
        input.disabled = !oneTime;
        input.required = oneTime;
    }
    for (const id of ['recurringTimings', 'recurringDays']) document.getElementById(id).classList.toggle('hidden', oneTime);
    document.getElementById('locationTimings').required = !oneTime;
    document.getElementById('locationTimings').disabled = oneTime;
}

export function eventStatus(location, at = Date.now()) {
    if (location.scheduleKind !== 'one_time') return null;
    return at < Date.parse(location.startsAt) ? 'upcoming' : at < Date.parse(location.endsAt) ? 'serving' : 'ended';
}

export function scheduleText(app, location) {
    if (location.scheduleKind !== 'one_time') return location.timings;
    const format = value => new Intl.DateTimeFormat(app.currentLanguage === 'hi' ? 'hi-IN' : 'en-IN', {
        timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit'
    }).format(new Date(value));
    return `${format(location.startsAt)} – ${format(location.endsAt)} (IST)`;
}

export function openAddLocation(app) {
    if (!app.currentUser) {
        app.showError('signinError', app.translate('signin-required'));
        app.openModal('signinModal');
        return;
    }
    app.openModal('addLocationModal');
    updateScheduleFields();
}

export async function handleAddLocation(app, event) {
    event.preventDefault();
    return submitForm(app, 'addLocationForm', async () => {
        if (!app.selectedCoordinates) {
            app.showError('addLocationError', app.translate('validation-select-location'));
            return;
        }
        const value = id => document.getElementById(id).value;
        const body = {
            name: value('locationName'), address: value('locationAddress'),
            description: value('locationDescription'), type: value('locationType'),
            timings: value('locationTimings'),
            days: Array.from(document.querySelectorAll('.day-checkbox input:checked')).map(box => box.value),
            lat: app.selectedCoordinates.lat, lng: app.selectedCoordinates.lng
        };
        body.schedule_kind = value('scheduleKind');
        if (body.schedule_kind === 'one_time') {
            body.starts_at = value('eventStart') + ':00+05:30';
            body.ends_at = value('eventEnd') + ':00+05:30';
            if (!Number.isFinite(Date.parse(body.starts_at)) || !Number.isFinite(Date.parse(body.ends_at)) ||
                Date.parse(body.ends_at) <= Math.max(Date.now(), Date.parse(body.starts_at))) {
                app.showError('addLocationError', app.translate('event-invalid'));
                return;
            }
            body.days = [];
            body.timings = '';
        }
        await writeAndRefresh(app, '/locations', body);
        app.closeModal('addLocationModal');
        app.showToast(app.translate('location-added-success'));
    });
}

export function openCheckinModal(app, locationId) {
    if (!app.currentUser) {
        app.showError('signinError', app.translate('signin-required'));
        app.openModal('signinModal');
        return;
    }
    const location = app.bhandaaras.find(item => item.id === locationId);
    if (!location) return;
    if (eventStatus(location) && eventStatus(location) !== 'serving') {
        app.showToast(app.translate('event-checkin-unavailable'));
        return;
    }
    app.selectedLocation = location;
    document.getElementById('checkinLocationName').textContent = location.name;
    document.getElementById('checkinLocationAddress').textContent = location.address;
    app.openModal('checkinModal');
}

export async function handleCheckin(app, event) {
    event.preventDefault();
    return submitForm(app, 'checkinForm', async () => {
        if (!app.selectedLocation) return;
        if (!app.selectedRating) {
            app.showError('checkinError', app.translate('validation-rating'));
            return;
        }
        await writeAndRefresh(app, '/locations/' + app.selectedLocation.id + '/checkins', {
            rating: app.selectedRating,
            comment: document.getElementById('checkinFeedback').value || 'Great experience!'
        });
        app.closeModal('checkinModal');
        app.showToast(app.translate('checkin-success'));
    });
}

export function filterLocations(app) {
    app.renderLocations();
    app.addMarkers();
}

export function getFilteredLocations(app) {
    const search = (document.getElementById('searchInput')?.value || '').toLowerCase();
    const type = document.getElementById('typeFilter')?.value || '';
    const status = document.getElementById('statusFilter')?.value || '';
    return app.bhandaaras.filter(location =>
        (document.getElementById('showEnded')?.checked || eventStatus(location) !== 'ended') &&
        (!search || location.name.toLowerCase().includes(search) || location.address.toLowerCase().includes(search)) &&
        (!type || location.type === type) &&
        (!status || (status === 'active' ? (eventStatus(location) ? eventStatus(location) === 'serving' : location.todayOpen) :
            (eventStatus(location) ? eventStatus(location) !== 'serving' : !location.todayOpen))));
}

