import translations from './translations.js';
import { request } from './api.js';
import * as locations from './locations.js';
import * as auth from './auth.js';
import * as maps from './map.js';
import * as ui from './ui.js';

// One context owns data, selections and Leaflet instances. Modules receive it explicitly.
export class BhandaaraApp {
    constructor() {
        this.map = null;
        this.mapPicker = null;
        this.markers = [];
        this.selectedLocation = null;
        this.currentUser = null;
        this.selectedCoordinates = null;
        this.selectedRating = 0;
        this.selectedMarker = null;
        this.currentLanguage = 'hi'; // Default to Hindi
        this.currentView = 'map'; // Track current view
        
        // Language translations
        this.translations = translations;
        this.bhandaaras = [];
        this.recentActivity = [];
        this.stats = { totalLocations: 0, activeToday: 0, totalCheckins: 0, checkinsToday: 0 };
        this.init();
    }

    async init() {
        if (this.initialized) return;
        this.initialized = true;
        this.loadLanguagePreference();
        this.initializeMap();
        this.bindEvents();
        maps.bindViewportEvents(this);
        this.renderLocations();
        this.renderActivityFeed();
        this.updateStats();
        this.applyTranslations();
        this.setInitialView();
        await this.reload();
    }

    async reload() {
        this.setDataStatus('loading');
        try {
            await Promise.all([this.checkAuthState(), this.refreshData()]);
            this.setDataStatus('ready');
        } catch (error) {
            this.setDataStatus('error');
        }
    }

    async refreshData() {
        const [locations, activity, stats] = await Promise.all([
            request('/locations'), request('/activity'), request('/stats')
        ]);
        this.bhandaaras = locations;
        this.recentActivity = activity;
        this.stats = stats;
        this.renderLocations();
        this.renderActivityFeed();
        this.updateStats();
        this.addMarkers();
    }

    setDataStatus(status) {
        this.dataStatus = status;
        const label = document.getElementById('dataStatus');
        label.textContent = this.translate(status === 'loading' ? 'api-loading' : status === 'error' ? 'api-unavailable' : 'api-ready');
        label.setAttribute('role', status === 'error' ? 'alert' : 'status');
        document.getElementById('retryLoad').classList.toggle('hidden', status !== 'error');
    }

    setInitialView() {
        // Ensure we start with the map view properly set
        this.switchView('map');
    }
    openAddLocation(...args) { return locations.openAddLocation(this, ...args); }
    handleAddLocation(...args) { return locations.handleAddLocation(this, ...args); }
    openCheckinModal(...args) { return locations.openCheckinModal(this, ...args); }
    handleCheckin(...args) { return locations.handleCheckin(this, ...args); }
    filterLocations(...args) { return locations.filterLocations(this, ...args); }
    getFilteredLocations(...args) { return locations.getFilteredLocations(this, ...args); }
    checkAuthState(...args) { return auth.checkAuthState(this, ...args); }
    handleSignin(...args) { return auth.handleSignin(this, ...args); }
    handleSignup(...args) { return auth.handleSignup(this, ...args); }
    signOut(...args) { return auth.signOut(this, ...args); }
    initializeMap(...args) { return maps.initializeMap(this, ...args); }
    initializeMapPicker(...args) { return maps.initializeMapPicker(this, ...args); }
    addMarkers(...args) { return maps.addMarkers(this, ...args); }
    selectLocation(...args) { return maps.selectLocation(this, ...args); }
    updateCoordinatesDisplay(...args) { return maps.updateCoordinatesDisplay(this, ...args); }
    reverseGeocode(...args) { return maps.reverseGeocode(this, ...args); }
    showLocationDetails(...args) { return maps.showLocationDetails(this, ...args); }
    destroyMapPicker() { return maps.destroyMapPicker(this); }
    loadLanguagePreference(...args) { return ui.loadLanguagePreference(this, ...args); }
    updateLanguageToggle(...args) { return ui.updateLanguageToggle(this, ...args); }
    toggleLanguage(...args) { return ui.toggleLanguage(this, ...args); }
    translate(...args) { return ui.translate(this, ...args); }
    applyTranslations(...args) { return ui.applyTranslations(this, ...args); }
    showAuthenticatedState(...args) { return ui.showAuthenticatedState(this, ...args); }
    showGuestState(...args) { return ui.showGuestState(this, ...args); }
    escapeHTML(...args) { return ui.escapeHTML(this, ...args); }
    createPopupContent(...args) { return ui.createPopupContent(this, ...args); }
    bindEvents(...args) { return ui.bindEvents(this, ...args); }
    bindModalEvents(...args) { return ui.bindModalEvents(this, ...args); }
    openModal(...args) { return ui.openModal(this, ...args); }
    closeModal(...args) { return ui.closeModal(this, ...args); }
    switchModal(...args) { return ui.switchModal(this, ...args); }
    toggleUserDropdown(...args) { return ui.toggleUserDropdown(this, ...args); }
    setRating(...args) { return ui.setRating(this, ...args); }
    highlightRating(...args) { return ui.highlightRating(this, ...args); }
    resetRatingHighlight(...args) { return ui.resetRatingHighlight(this, ...args); }
    updateRatingDisplay(...args) { return ui.updateRatingDisplay(this, ...args); }
    switchView(...args) { return ui.switchView(this, ...args); }
    renderLocations(...args) { return ui.renderLocations(this, ...args); }
    createLocationCard(...args) { return ui.createLocationCard(this, ...args); }
    renderActivityFeed(...args) { return ui.renderActivityFeed(this, ...args); }
    updateStats(...args) { return ui.updateStats(this, ...args); }
    showError(...args) { return ui.showError(this, ...args); }
    clearErrors(...args) { return ui.clearErrors(this, ...args); }
    showToast(...args) { return ui.showToast(this, ...args); }
}

function start() {
    new BhandaaraApp();
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start, { once: true });
} else {
    start();
}
