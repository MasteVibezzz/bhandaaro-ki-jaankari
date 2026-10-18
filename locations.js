import { submitForm, writeAndRefresh } from './api.js';

export function openAddLocation(app) {
    if (!app.currentUser) {
        app.showError('signinError', app.translate('signin-required'));
        app.openModal('signinModal');
        return;
    }
    app.openModal('addLocationModal');
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
        (!search || location.name.toLowerCase().includes(search) || location.address.toLowerCase().includes(search)) &&
        (!type || location.type === type) &&
        (!status || (status === 'active' ? location.todayOpen : !location.todayOpen)));
}

