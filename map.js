// Functions receive the application context explicitly; app.js owns shared state.
import { eventStatus } from './locations.js';
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';

function addBaseLayer(map) {
    return L.tileLayer(TILE_URL, {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
        referrerPolicy: 'strict-origin-when-cross-origin',
        updateWhenIdle: true,
        updateWhenZooming: false,
        keepBuffer: 1
    }).addTo(map);
}

export function destroyMapPicker(app) {
    if (app.mapPicker) app.mapPicker.remove();
    app.mapPicker = null;
    app.selectedMarker = null;
    app.selectedCoordinates = null;
}

export function initializeMap(app) {
    // Main map - with responsive handling
    const mapElement = document.getElementById('map');
    if (!mapElement || app.map) return;

    app.map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: 'center'
    }).setView([18.5204, 73.8567], 12);
    
    addBaseLayer(app.map);

    app.addMarkers();
}

export function initializeMapPicker(app) {
    // Only initialize map picker when modal opens
    const mapPickerElement = document.getElementById('mapPicker');
    if (!mapPickerElement || app.mapPicker) return;

    try {
        app.mapPicker = L.map('mapPicker', {
            zoomControl: true,
            attributionControl: true
        }).setView([18.5204, 73.8567], 12);
        
        addBaseLayer(app.mapPicker);

        app.mapPicker.on('click', (e) => {
            app.selectLocation(e.latlng);
        });
    } catch (error) {
        console.warn('Failed to initialize map picker:', error);
    }
}

export function addMarkers(app) {
    if (!app.map) return;

    // Clear existing markers
    app.markers.forEach(marker => {
        try {
            app.map.removeLayer(marker);
        } catch (e) {
            // Ignore errors when removing markers
        }
    });
    app.markers = [];

    app.getFilteredLocations().forEach(location => {
        try {
            const status = eventStatus(location);
            const open = status ? status === 'serving' : location.todayOpen;
            const state = status === 'upcoming' ? 'upcoming' : open ? 'open' : 'closed';
            const color = status === 'upcoming' ? '#fbf2c0' : open ? '#75b9be' : '#8c8a93';
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 8,
                className: `map-marker map-marker--${state}`,
                fillColor: color,
                color: '#43281c',
                weight: 2,
                dashArray: open ? undefined : '3 3',
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(app.map);

            const popupContent = app.createPopupContent(location);
            marker.bindPopup(popupContent, { maxWidth: 280, closeButton: true });
            const element = marker.getElement?.();
            if (element) {
                const label = status ? app.translate('event-' + status) : app.translate(open ? 'open-status' : 'closed-status');
                element.setAttribute('aria-label', `${location.name}: ${label}`);
                element.setAttribute('role', 'button');
                element.setAttribute('tabindex', '0');
                element.addEventListener('keydown', event => {
                    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); marker.openPopup(); }
                });
            }
            
            app.markers.push(marker);
        } catch (error) {
            console.warn('Failed to add marker for location:', location.name, error);
        }
    });
}

export function selectLocation(app, latlng) {
    if (!app.mapPicker) return;

    if (app.selectedMarker) {
        try {
            app.mapPicker.removeLayer(app.selectedMarker);
        } catch (e) {
            // Ignore removal errors
        }
    }

    app.selectedCoordinates = latlng;
    const latInput = document.getElementById('locationLat');
    const lngInput = document.getElementById('locationLng');
    if (latInput) latInput.value = latlng.lat.toFixed(6);
    if (lngInput) lngInput.value = latlng.lng.toFixed(6);
    
    try {
        app.selectedMarker = L.marker([latlng.lat, latlng.lng], { draggable: true })
            .addTo(app.mapPicker);

        app.selectedMarker.on('dragend', (e) => {
            app.selectedCoordinates = e.target.getLatLng();
            if (latInput) latInput.value = app.selectedCoordinates.lat.toFixed(6);
            if (lngInput) lngInput.value = app.selectedCoordinates.lng.toFixed(6);
            app.updateCoordinatesDisplay();
            app.reverseGeocode(app.selectedCoordinates);
        });
    } catch (error) {
        console.warn('Failed to add marker:', error);
    }

    app.updateCoordinatesDisplay();
    app.reverseGeocode(latlng);
}

export function updateCoordinatesDisplay(app) {
    const coordDisplay = document.getElementById('selectedCoordinates');
    if (coordDisplay && app.selectedCoordinates) {
        coordDisplay.textContent = 
            `${app.selectedCoordinates.lat.toFixed(6)}, ${app.selectedCoordinates.lng.toFixed(6)}`;
    }
}

export function reverseGeocode(app, latlng) {
    const addressField = document.getElementById('locationAddress');
    if (addressField && (!addressField.value || /^-?\d+(\.\d+)?,\s*-?\d+(\.\d+)?$/.test(addressField.value))) {
        addressField.value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
    }
}

export function showLocationDetails(app, locationId) {
    const location = app.bhandaaras.find(b => b.id === locationId);
    if (!location || !app.map) return;
    
    // Center map on location
    app.map.setView([location.lat, location.lng], 15);
    
    // Switch to map view if in list view
    if (app.currentView !== 'map') {
        app.switchView('map');
    }
}

export function bindViewportEvents(app) {
    let resizeTimeout;
    const refresh = () => {
        if (app.currentView === 'map') app.map?.invalidateSize();
        app.mapPicker?.invalidateSize();
    };
    window.addEventListener('orientationchange', refresh);
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(refresh, 250);
    });
}

