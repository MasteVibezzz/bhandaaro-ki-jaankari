// Functions receive the application context explicitly; app.js owns shared state.
export function calculateStats(locations) {
    return {
        totalLocations: locations.length,
        activeToday: locations.filter(location => location.todayOpen).length,
        checkinsToday: locations.reduce((sum, location) => sum + (Number(location.checkinsToday) || 0), 0),
        totalCheckins: locations.reduce((sum, location) => sum + (Number(location.totalCheckins) || 0), 0)
    };
}
import { readStorage, writeStorage } from './storage.js';

export function loadStoredData(app) {
    app.bhandaaras = app.deduplicateLocations(
        app.bhandaaras.map(location => app.normalizeLocation(location))
    );

    // Load stored locations
    const storedLocations = readStorage('bhandaaras', []);
    if (Array.isArray(storedLocations)) {
        const normalizedStored = storedLocations
            .filter(location => location && typeof location === 'object')
            .map(location => app.normalizeLocation(location));
        app.bhandaaras = app.deduplicateLocations([
            ...app.bhandaaras,
            ...normalizedStored
        ]);
    }

    // Load stored activity
    const storedActivity = readStorage('recentActivity', []);
    if (Array.isArray(storedActivity)) {
        app.recentActivity = app.deduplicateActivity([
            ...storedActivity.filter(activity => activity && typeof activity === 'object'),
            ...app.recentActivity
        ]);
    }
}

export function normalizeLocation(app, location) {
    const currentRating = Number(location.rating) || 0;
    const reviews = Array.isArray(location.reviews) ? location.reviews : [];

    return {
        ...location,
        reviews: reviews.map(review => {
            if (typeof review === 'string') {
                return { rating: currentRating, comment: review };
            }

            return {
                ...review,
                rating: Number(review.rating) || currentRating,
                comment: String(review.comment ?? review.feedback ?? '')
            };
        })
    };
}

export function deduplicateLocations(app, locations) {
    const uniqueLocations = new Map();
    locations.forEach(location => {
        if (location && location.id !== undefined && location.id !== null) {
            uniqueLocations.set(String(location.id), location);
        }
    });
    return Array.from(uniqueLocations.values());
}

export function deduplicateActivity(app, activities) {
    const seen = new Set();
    return activities.filter(activity => {
        const key = [
            activity.type,
            activity.user,
            activity.location,
            activity.time,
            activity.feedback,
            activity.comment,
            activity.rating
        ].join('|');
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

export function openAddLocation(app) {
    if (!app.currentUser) {
        app.showError('signinError', app.translate('signin-required'));
        app.openModal('signinModal');
        return;
    }
    
    app.openModal('addLocationModal');
}

export function handleAddLocation(app, e) {
    e.preventDefault();
    
    if (!app.selectedCoordinates) {
        app.showError('addLocationError', app.translate('validation-select-location'));
        return;
    }
    
    const nameEl = document.getElementById('locationName');
    const addressEl = document.getElementById('locationAddress');
    const descriptionEl = document.getElementById('locationDescription');
    const typeEl = document.getElementById('locationType');
    const timingsEl = document.getElementById('locationTimings');
    
    const name = nameEl ? nameEl.value : '';
    const address = addressEl ? addressEl.value : '';
    const description = descriptionEl ? descriptionEl.value : '';
    const type = typeEl ? typeEl.value : '';
    const timings = timingsEl ? timingsEl.value : '';
    
    const selectedDays = Array.from(document.querySelectorAll('.day-checkbox input:checked'))
        .map(cb => cb.value);
    
    if (!name.trim() || !type || !timings.trim() || selectedDays.length === 0) {
        app.showError('addLocationError', app.translate('validation-required-fields'));
        return;
    }
    
    const newLocation = {
        id: Date.now(),
        name,
        address,
        description,
        type,
        timings,
        days: selectedDays,
        lat: app.selectedCoordinates.lat,
        lng: app.selectedCoordinates.lng,
        active: true,
        todayOpen: true,
        rating: 0,
        checkinsToday: 0,
        totalCheckins: 0,
        reviews: []
    };
    
    app.bhandaaras.push(newLocation);

    // Add to activity
    app.recentActivity.unshift({
        type: "addition",
        user: app.currentUser.name,
        location: name,
        time: app.translate('just-now')
    });

    app.saveToStorage();
    
    app.renderLocations();
    app.renderActivityFeed();
    app.addMarkers();
    app.updateStats();
    
    app.closeModal('addLocationModal');
    app.showToast(app.translate('location-added-success'));
}

export function openCheckinModal(app, locationId) {
    if (!app.currentUser) {
        app.showError('signinError', app.translate('signin-required'));
        app.openModal('signinModal');
        return;
    }
    
    const location = app.bhandaaras.find(b => b.id === locationId);
    if (!location) return;
    
    app.selectedLocation = location;
    const nameEl = document.getElementById('checkinLocationName');
    const addressEl = document.getElementById('checkinLocationAddress');
    
    if (nameEl) nameEl.textContent = location.name;
    if (addressEl) addressEl.textContent = location.address;
    
    app.openModal('checkinModal');
}

export function handleCheckin(app, e) {
    e.preventDefault();
    
    if (!app.selectedLocation) return;
    
    const feedbackEl = document.getElementById('checkinFeedback');
    const feedback = feedbackEl ? feedbackEl.value || 'Great experience!' : 'Great experience!';

    if (!app.selectedRating) {
        app.showError('checkinError', app.translate('validation-rating') || 'Please select a rating');
        return;
    }
    
    // Update location stats
    app.selectedLocation.checkinsToday++;
    app.selectedLocation.totalCheckins++;

    // Save the selected rating and review with the check-in.
    if (app.selectedRating > 0) {
        if (!Array.isArray(app.selectedLocation.reviews)) app.selectedLocation.reviews = [];
        app.selectedLocation.reviews.push({
            user: app.currentUser.name,
            rating: app.selectedRating,
            comment: feedback,
            time: app.translate('just-now')
        });
        const totalRating = app.selectedLocation.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
        app.selectedLocation.rating = Number((totalRating / app.selectedLocation.reviews.length).toFixed(1));
    }
    
    // Add to activity
    app.recentActivity.unshift({
        type: "checkin",
        user: app.currentUser.name,
        location: app.selectedLocation.name,
        time: app.translate('just-now'),
        feedback: feedback
    });
    
    // Update global stats
    app.stats.checkinsToday++;
    
    app.saveToStorage();
    app.renderLocations();
    app.renderActivityFeed();
    app.updateStats();
    app.addMarkers(); // Refresh markers with updated stats
    
    app.closeModal('checkinModal');
    app.showToast(app.translate('checkin-success'));
}

export function filterLocations(app) {
    app.renderLocations();
    app.addMarkers();
}

export function getFilteredLocations(app) {
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');

    const search = searchInput ? searchInput.value.toLowerCase() : '';
    const typeValue = typeFilter ? typeFilter.value : '';
    const statusValue = statusFilter ? statusFilter.value : '';
    
    return app.bhandaaras.filter(location => {
        const matchesSearch = !search || 
            location.name.toLowerCase().includes(search) ||
            location.address.toLowerCase().includes(search);
        
        const matchesType = !typeValue || location.type === typeValue;
        
        const matchesStatus = !statusValue || 
            (statusValue === 'active' && location.todayOpen) ||
            (statusValue === 'closed' && !location.todayOpen);
        
        return matchesSearch && matchesType && matchesStatus;
    });
}

export function saveToStorage(app) {
    writeStorage('bhandaaras', app.bhandaaras);
    writeStorage('recentActivity', app.recentActivity.slice(0, 20));
}

