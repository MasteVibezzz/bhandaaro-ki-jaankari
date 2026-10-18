// Functions receive the application context explicitly; app.js owns shared state.
export function destroyMapPicker(app) {
    if (app.mapPicker) app.mapPicker.remove();
    app.mapPicker = null;
    app.selectedMarker = null;
    app.selectedCoordinates = null;
}

export function initializeMap(app) {
    // Main map - with responsive handling
    const mapElement = document.getElementById('map');
    if (!mapElement) return;

    app.map = L.map('map', {
        zoomControl: true,
        attributionControl: true,
        scrollWheelZoom: 'center'
    }).setView([18.5204, 73.8567], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
        maxZoom: 18
    }).addTo(app.map);

    app.addMarkers();
}

export function initializeMapPicker(app) {
    // Only initialize map picker when modal opens
    const mapPickerElement = document.getElementById('mapPicker');
    if (!mapPickerElement || app.mapPicker) return;

    try {
        app.mapPicker = L.map('mapPicker', {
            zoomControl: true,
            attributionControl: false
        }).setView([18.5204, 73.8567], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(app.mapPicker);

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
            const color = location.todayOpen ? '#22c55e' : '#ef4444';
            const marker = L.circleMarker([location.lat, location.lng], {
                radius: 8,
                fillColor: color,
                color: '#fff',
                weight: 2,
                opacity: 1,
                fillOpacity: 0.8
            }).addTo(app.map);

            const popupContent = app.createPopupContent(location);
            marker.bindPopup(popupContent, { maxWidth: 280, closeButton: true });
            
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
    
    try {
        app.selectedMarker = L.marker([latlng.lat, latlng.lng], { draggable: true })
            .addTo(app.mapPicker);

        app.selectedMarker.on('dragend', (e) => {
            app.selectedCoordinates = e.target.getLatLng();
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
    if (addressField) {
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

