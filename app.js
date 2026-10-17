import translations from './translations.js';
import { createDemoData } from './demo-data.js';
import { readStorage, writeStorage, removeStorage } from './storage.js';

class BhandaaraApp {
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
        const { bhandaaras, recentActivity, stats } = createDemoData();
        this.bhandaaras = bhandaaras;
        this.recentActivity = recentActivity;
        this.stats = stats;
        this.init();
    }

    init() {
        this.loadStoredData();
        this.loadLanguagePreference();
        this.checkAuthState();
        this.initializeMap();
        this.bindEvents();
        this.renderLocations();
        this.renderActivityFeed();
        this.updateStats();
        this.applyTranslations();
        this.setInitialView();
    }

    setInitialView() {
        // Ensure we start with the map view properly set
        this.switchView('map');
    }

    loadStoredData() {
        this.bhandaaras = this.deduplicateLocations(
            this.bhandaaras.map(location => this.normalizeLocation(location))
        );

        // Load stored locations
        const storedLocations = this.readStorage('bhandaaras', []);
        if (Array.isArray(storedLocations)) {
            const normalizedStored = storedLocations
                .filter(location => location && typeof location === 'object')
                .map(location => this.normalizeLocation(location));
            this.bhandaaras = this.deduplicateLocations([
                ...this.bhandaaras,
                ...normalizedStored
            ]);
        }

        // Load stored activity
        const storedActivity = this.readStorage('recentActivity', []);
        if (Array.isArray(storedActivity)) {
            this.recentActivity = this.deduplicateActivity([
                ...storedActivity.filter(activity => activity && typeof activity === 'object'),
                ...this.recentActivity
            ]);
        }
    }

    normalizeLocation(location) {
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

    deduplicateLocations(locations) {
        const uniqueLocations = new Map();
        locations.forEach(location => {
            if (location && location.id !== undefined && location.id !== null) {
                uniqueLocations.set(String(location.id), location);
            }
        });
        return Array.from(uniqueLocations.values());
    }

    deduplicateActivity(activities) {
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

    readStorage(...args) {
        return readStorage(...args);
    }

    writeStorage(...args) {
        return writeStorage(...args);
    }

    removeStorage(...args) {
        return removeStorage(...args);
    }
    loadLanguagePreference() {
        const savedLanguage = this.readStorage('preferredLanguage', null, localStorage, false);
        if (savedLanguage && this.translations[savedLanguage]) {
            this.currentLanguage = savedLanguage;
        }
        this.updateLanguageToggle();
    }

    updateLanguageToggle() {
        const langToggle = document.getElementById('currentLang');
        if (langToggle) {
            langToggle.textContent = this.currentLanguage === 'hi' ? 'EN' : 'हिं';
        }
    }

    toggleLanguage() {
        this.currentLanguage = this.currentLanguage === 'hi' ? 'en' : 'hi';
        this.writeStorage('preferredLanguage', this.currentLanguage, localStorage, false);
        this.updateLanguageToggle();
        this.applyTranslations();
        this.renderLocations(); // Re-render to apply translations
        this.renderActivityFeed(); // Re-render activity feed
        this.addMarkers(); // Re-render map markers
    }

    translate(key) {
        return this.translations[this.currentLanguage][key] || this.translations['hi'][key] || key;
    }

    applyTranslations() {
        // Translate all elements with data-key attributes
        document.querySelectorAll('[data-key]').forEach(element => {
            const key = element.getAttribute('data-key');
            const translation = this.translate(key);
            
            if (element.tagName === 'INPUT' && element.type === 'text') {
                element.placeholder = translation;
            } else if (element.hasAttribute('data-placeholder')) {
                element.placeholder = translation;
            } else {
                element.textContent = translation;
            }
        });

        // Update placeholders specifically
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.placeholder = this.translate('search-placeholder');
        }

        const timingsInput = document.getElementById('locationTimings');
        if (timingsInput) {
            timingsInput.placeholder = this.translate('timings-placeholder');
        }

        const feedbackTextarea = document.getElementById('checkinFeedback');
        if (feedbackTextarea) {
            feedbackTextarea.placeholder = this.translate('feedback-placeholder');
        }
    }

    checkAuthState() {
        const rememberedUser = this.readStorage('currentUser', null, localStorage);
        const sessionUser = this.readStorage('currentUser', null, sessionStorage);
        const user = rememberedUser || sessionUser;

        if (user && typeof user.name === 'string' && typeof user.email === 'string') {
            this.currentUser = user;
            this.showAuthenticatedState();
            return;
        }

        this.removeStorage('currentUser', localStorage);
        this.removeStorage('currentUser', sessionStorage);
        this.showGuestState();
    }

    showAuthenticatedState() {
        const guestButtons = document.getElementById('guestButtons');
        const userMenu = document.getElementById('userMenu');
        const userName = document.getElementById('userName');

        if (guestButtons) guestButtons.classList.add('hidden');
        if (userMenu) userMenu.classList.remove('hidden');
        if (userName && this.currentUser) userName.textContent = this.currentUser.name;
    }

    showGuestState() {
        const guestButtons = document.getElementById('guestButtons');
        const userMenu = document.getElementById('userMenu');

        if (guestButtons) guestButtons.classList.remove('hidden');
        if (userMenu) userMenu.classList.add('hidden');
    }

    initializeMap() {
        // Main map - with responsive handling
        const mapElement = document.getElementById('map');
        if (!mapElement) return;

        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true,
            scrollWheelZoom: 'center'
        }).setView([18.5204, 73.8567], 12);
        
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 18
        }).addTo(this.map);

        // Handle window resize
        const handleResize = () => {
            if (this.map) {
                setTimeout(() => this.map.invalidateSize(), 100);
            }
            if (this.mapPicker) {
                setTimeout(() => this.mapPicker.invalidateSize(), 100);
            }
        };

        window.addEventListener('resize', handleResize);
        window.addEventListener('orientationchange', handleResize);

        this.addMarkers();
    }

    initializeMapPicker() {
        // Only initialize map picker when modal opens
        const mapPickerElement = document.getElementById('mapPicker');
        if (!mapPickerElement || this.mapPicker) return;

        try {
            this.mapPicker = L.map('mapPicker', {
                zoomControl: true,
                attributionControl: false
            }).setView([18.5204, 73.8567], 12);
            
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.mapPicker);

            this.mapPicker.on('click', (e) => {
                this.selectLocation(e.latlng);
            });
        } catch (error) {
            console.warn('Failed to initialize map picker:', error);
        }
    }

    addMarkers() {
        if (!this.map) return;

        // Clear existing markers
        this.markers.forEach(marker => {
            try {
                this.map.removeLayer(marker);
            } catch (e) {
                // Ignore errors when removing markers
            }
        });
        this.markers = [];

        this.getFilteredLocations().forEach(location => {
            try {
                const color = location.todayOpen ? '#22c55e' : '#ef4444';
                const marker = L.circleMarker([location.lat, location.lng], {
                    radius: 8,
                    fillColor: color,
                    color: '#fff',
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }).addTo(this.map);

                const popupContent = this.createPopupContent(location);
                marker.bindPopup(popupContent, { maxWidth: 280, closeButton: true });
                
                this.markers.push(marker);
            } catch (error) {
                console.warn('Failed to add marker for location:', location.name, error);
            }
        });
    }

    escapeHTML(value) {
        return String(value ?? '').replace(/[&<>"']/g, char => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        }[char]));
    }

    createPopupContent(location) {
        const statusClass = location.todayOpen ? 'open' : 'closed';
        const statusText = location.todayOpen ? this.translate('open-status') : this.translate('closed-status');
        
        return `
            <div class="custom-popup">
                <div class="popup-header">
                    <h4 class="popup-title">${this.escapeHTML(location.name)}</h4>
                    <span class="popup-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${statusText}
                    </span>
                </div>
                <div class="popup-details">
                    <div class="popup-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${this.escapeHTML(location.address)}</span>
                    </div>
                    <div class="popup-detail">
                        <i class="fas fa-clock"></i>
                        <span>${this.escapeHTML(location.timings)}</span>
                    </div>
                    <div class="popup-detail">
                        <i class="fas fa-star"></i>
                        <span>${this.escapeHTML(location.rating)}/5 (${this.escapeHTML(location.totalCheckins)} ${this.translate('checkin-btn').toLowerCase()})</span>
                    </div>
                </div>
                <div class="popup-actions">
                    <button class="popup-btn popup-btn--primary" onclick="window.app.openCheckinModal(${Number(location.id)})">
                        ${this.translate('checkin-btn')}
                    </button>
                    <button class="popup-btn popup-btn--secondary" onclick="window.app.showLocationDetails(${Number(location.id)})">
                        ${this.translate('view-details-btn')}
                    </button>
                </div>
            </div>
        `;
    }

    selectLocation(latlng) {
        if (!this.mapPicker) return;

        if (this.selectedMarker) {
            try {
                this.mapPicker.removeLayer(this.selectedMarker);
            } catch (e) {
                // Ignore removal errors
            }
        }

        this.selectedCoordinates = latlng;
        
        try {
            this.selectedMarker = L.marker([latlng.lat, latlng.lng], { draggable: true })
                .addTo(this.mapPicker);

            this.selectedMarker.on('dragend', (e) => {
                this.selectedCoordinates = e.target.getLatLng();
                this.updateCoordinatesDisplay();
                this.reverseGeocode(this.selectedCoordinates);
            });
        } catch (error) {
            console.warn('Failed to add marker:', error);
        }

        this.updateCoordinatesDisplay();
        this.reverseGeocode(latlng);
    }

    updateCoordinatesDisplay() {
        const coordDisplay = document.getElementById('selectedCoordinates');
        if (coordDisplay && this.selectedCoordinates) {
            coordDisplay.textContent = 
                `${this.selectedCoordinates.lat.toFixed(6)}, ${this.selectedCoordinates.lng.toFixed(6)}`;
        }
    }

    reverseGeocode(latlng) {
        const addressField = document.getElementById('locationAddress');
        if (addressField) {
            addressField.value = `${latlng.lat.toFixed(6)}, ${latlng.lng.toFixed(6)}`;
        }
    }

    bindEvents() {
        // Authentication
        const signinBtn = document.getElementById('signinBtn');
        const signupBtn = document.getElementById('signupBtn');
        const signoutBtn = document.getElementById('signoutBtn');
        
        if (signinBtn) signinBtn.addEventListener('click', () => this.openModal('signinModal'));
        if (signupBtn) signupBtn.addEventListener('click', () => this.openModal('signupModal'));
        if (signoutBtn) signoutBtn.addEventListener('click', () => this.signOut());

        // Language toggle
        const langToggle = document.getElementById('langToggle');
        if (langToggle) langToggle.addEventListener('click', () => this.toggleLanguage());

        // Modal controls
        this.bindModalEvents();

        // Forms
        const signinForm = document.getElementById('signinForm');
        const signupForm = document.getElementById('signupForm');
        const addLocationForm = document.getElementById('addLocationForm');
        const checkinForm = document.getElementById('checkinForm');
        
        if (signinForm) signinForm.addEventListener('submit', (e) => this.handleSignin(e));
        if (signupForm) signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        if (addLocationForm) addLocationForm.addEventListener('submit', (e) => this.handleAddLocation(e));
        if (checkinForm) checkinForm.addEventListener('submit', (e) => this.handleCheckin(e));

        // Filters and search
        const searchInput = document.getElementById('searchInput');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (searchInput) searchInput.addEventListener('input', () => this.filterLocations());
        if (typeFilter) typeFilter.addEventListener('change', () => this.filterLocations());
        if (statusFilter) statusFilter.addEventListener('change', () => this.filterLocations());

        // View toggle
        const mapViewBtn = document.getElementById('mapViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (mapViewBtn) mapViewBtn.addEventListener('click', () => this.switchView('map'));
        if (listViewBtn) listViewBtn.addEventListener('click', () => this.switchView('list'));

        // Add location
        const addLocationBtn = document.getElementById('addLocationBtn');
        if (addLocationBtn) addLocationBtn.addEventListener('click', () => this.openAddLocation());

        // User profile dropdown
        const userProfile = document.getElementById('userProfile');
        if (userProfile) userProfile.addEventListener('click', () => this.toggleUserDropdown());

        // Rating stars
        document.querySelectorAll('.rating-stars i').forEach(star => {
            star.addEventListener('click', (e) => this.setRating(parseInt(e.target.dataset.rating)));
            star.addEventListener('mouseenter', (e) => this.highlightRating(parseInt(e.target.dataset.rating)));
        });

        const ratingStars = document.querySelector('.rating-stars');
        if (ratingStars) {
            ratingStars.addEventListener('mouseleave', () => this.resetRatingHighlight());
        }

        // Modal switch links
        const switchToSignup = document.getElementById('switchToSignup');
        const switchToSignin = document.getElementById('switchToSignin');
        
        if (switchToSignup) {
            switchToSignup.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('signupModal');
            });
        }
        
        if (switchToSignin) {
            switchToSignin.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchModal('signinModal');
            });
        }
    }

    bindModalEvents() {
        const modals = ['signinModal', 'signupModal', 'addLocationModal', 'checkinModal'];
        
        modals.forEach(modalId => {
            const modal = document.getElementById(modalId);
            if (!modal) return;

            const overlay = modal.querySelector('.modal-overlay');
            const closeBtn = modal.querySelector('.modal-close');
            
            if (overlay) {
                // Remove existing listeners by cloning
                const newOverlay = overlay.cloneNode(true);
                overlay.parentNode.replaceChild(newOverlay, overlay);
                newOverlay.addEventListener('click', () => this.closeModal(modalId));
            }

            if (closeBtn) {
                // Remove existing listeners by cloning
                const newCloseBtn = closeBtn.cloneNode(true);
                closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
                newCloseBtn.addEventListener('click', () => this.closeModal(modalId));
            }
        });

        // Add escape key listener
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                modals.forEach(modalId => {
                    const modal = document.getElementById(modalId);
                    if (modal && !modal.classList.contains('hidden')) {
                        this.closeModal(modalId);
                    }
                });
            }
        });
    }

    openModal(modalId) {
        // Close any other open modals first
        document.querySelectorAll('.modal').forEach(modal => {
            if (modal.id !== modalId) {
                modal.classList.add('hidden');
            }
        });

        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';

            // Initialize map picker if opening add location modal
            if (modalId === 'addLocationModal') {
                setTimeout(() => {
                    this.initializeMapPicker();
                    if (this.mapPicker) {
                        this.mapPicker.invalidateSize();
                    }
                }, 100);
            }
        }
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.add('hidden');
            document.body.style.overflow = 'auto';
            this.clearErrors();
            
            // Reset forms when closing
            const form = modal.querySelector('form');
            if (form) {
                form.reset();
            }
            
            // Reset add location specific data
            if (modalId === 'addLocationModal') {
                this.selectedCoordinates = null;
                if (this.selectedMarker && this.mapPicker) {
                    try {
                        this.mapPicker.removeLayer(this.selectedMarker);
                    } catch (e) {
                        // Ignore removal errors
                    }
                    this.selectedMarker = null;
                }
                const coordDisplay = document.getElementById('selectedCoordinates');
                if (coordDisplay) {
                    coordDisplay.textContent = this.translate('click-map-instruction');
                }
                
                // Clean up map picker
                if (this.mapPicker) {
                    try {
                        this.mapPicker.remove();
                        this.mapPicker = null;
                    } catch (e) {
                        // Ignore cleanup errors
                    }
                }
            }
            
            // Reset rating
            if (modalId === 'checkinModal') {
                this.selectedRating = 0;
                this.resetRatingHighlight();
            }
        }
    }

    switchModal(targetModalId) {
        document.querySelectorAll('.modal').forEach(modal => modal.classList.add('hidden'));
        this.openModal(targetModalId);
    }

    toggleUserDropdown() {
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.toggle('hidden');
        }
    }

    handleSignin(e) {
        e.preventDefault();
        
        const emailEl = document.getElementById('signinEmail');
        const passwordEl = document.getElementById('signinPassword');
        const rememberMeEl = document.getElementById('rememberMe');
        
        const email = emailEl ? emailEl.value : '';
        const password = passwordEl ? passwordEl.value : '';
        const rememberMe = rememberMeEl ? rememberMeEl.checked : false;
        
        // Basic validation
        if (!this.validateEmail(email)) {
            this.showError('signinError', this.translate('validation-email'));
            return;
        }

        if (!password.trim()) {
            this.showError('signinError', this.translate('validation-password'));
            return;
        }

        // Simulate authentication
        const user = {
            name: email.split('@')[0],
            email: email
        };

        this.currentUser = user;
        const selectedStorage = rememberMe ? localStorage : sessionStorage;
        const otherStorage = rememberMe ? sessionStorage : localStorage;
        this.writeStorage('currentUser', user, selectedStorage);
        this.removeStorage('currentUser', otherStorage);
        
        this.showAuthenticatedState();
        this.closeModal('signinModal');
        this.showToast(this.translate('signin-success'));
    }

    handleSignup(e) {
        e.preventDefault();
        
        const nameEl = document.getElementById('signupName');
        const emailEl = document.getElementById('signupEmail');
        const passwordEl = document.getElementById('signupPassword');
        const confirmPasswordEl = document.getElementById('signupConfirmPassword');
        const agreeTermsEl = document.getElementById('agreeTerms');
        
        const name = nameEl ? nameEl.value : '';
        const email = emailEl ? emailEl.value : '';
        const password = passwordEl ? passwordEl.value : '';
        const confirmPassword = confirmPasswordEl ? confirmPasswordEl.value : '';
        const agreeTerms = agreeTermsEl ? agreeTermsEl.checked : false;
        
        // Validation
        if (!name.trim()) {
            this.showError('signupError', this.translate('validation-name'));
            return;
        }
        
        if (!this.validateEmail(email)) {
            this.showError('signupError', this.translate('validation-email'));
            return;
        }
        
        if (password.length < 6) {
            this.showError('signupError', this.translate('validation-password-length'));
            return;
        }
        
        if (password !== confirmPassword) {
            this.showError('signupError', this.translate('validation-password-mismatch'));
            return;
        }
        
        if (!agreeTerms) {
            this.showError('signupError', this.translate('validation-terms'));
            return;
        }

        // Create user
        const user = { name, email };
        this.currentUser = user;
        this.writeStorage('currentUser', user, sessionStorage);
        this.removeStorage('currentUser', localStorage);
        
        this.showAuthenticatedState();
        this.closeModal('signupModal');
        this.showToast(this.translate('signup-success'));
    }

    signOut() {
        this.currentUser = null;
        this.removeStorage('currentUser', localStorage);
        this.removeStorage('currentUser', sessionStorage);
        this.showGuestState();
        const dropdown = document.getElementById('userDropdown');
        if (dropdown) {
            dropdown.classList.add('hidden');
        }
        this.showToast(this.translate('signout-success'));
    }

    openAddLocation() {
        if (!this.currentUser) {
            this.showError('signinError', this.translate('signin-required'));
            this.openModal('signinModal');
            return;
        }
        
        this.openModal('addLocationModal');
    }

    handleAddLocation(e) {
        e.preventDefault();
        
        if (!this.selectedCoordinates) {
            this.showError('addLocationError', this.translate('validation-select-location'));
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
            this.showError('addLocationError', this.translate('validation-required-fields'));
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
            lat: this.selectedCoordinates.lat,
            lng: this.selectedCoordinates.lng,
            active: true,
            todayOpen: true,
            rating: 0,
            checkinsToday: 0,
            totalCheckins: 0,
            reviews: []
        };
        
        this.bhandaaras.push(newLocation);

        // Add to activity
        this.recentActivity.unshift({
            type: "addition",
            user: this.currentUser.name,
            location: name,
            time: this.translate('just-now')
        });

        this.saveToStorage();
        
        this.renderLocations();
        this.renderActivityFeed();
        this.addMarkers();
        this.updateStats();
        
        this.closeModal('addLocationModal');
        this.showToast(this.translate('location-added-success'));
    }

    openCheckinModal(locationId) {
        if (!this.currentUser) {
            this.showError('signinError', this.translate('signin-required'));
            this.openModal('signinModal');
            return;
        }
        
        const location = this.bhandaaras.find(b => b.id === locationId);
        if (!location) return;
        
        this.selectedLocation = location;
        const nameEl = document.getElementById('checkinLocationName');
        const addressEl = document.getElementById('checkinLocationAddress');
        
        if (nameEl) nameEl.textContent = location.name;
        if (addressEl) addressEl.textContent = location.address;
        
        this.openModal('checkinModal');
    }

    handleCheckin(e) {
        e.preventDefault();
        
        if (!this.selectedLocation) return;
        
        const feedbackEl = document.getElementById('checkinFeedback');
        const feedback = feedbackEl ? feedbackEl.value || 'Great experience!' : 'Great experience!';

        if (!this.selectedRating) {
            this.showError('checkinError', this.translate('validation-rating') || 'Please select a rating');
            return;
        }
        
        // Update location stats
        this.selectedLocation.checkinsToday++;
        this.selectedLocation.totalCheckins++;

        // Save the selected rating and review with the check-in.
        if (this.selectedRating > 0) {
            if (!Array.isArray(this.selectedLocation.reviews)) this.selectedLocation.reviews = [];
            this.selectedLocation.reviews.push({
                user: this.currentUser.name,
                rating: this.selectedRating,
                comment: feedback,
                time: this.translate('just-now')
            });
            const totalRating = this.selectedLocation.reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
            this.selectedLocation.rating = Number((totalRating / this.selectedLocation.reviews.length).toFixed(1));
        }
        
        // Add to activity
        this.recentActivity.unshift({
            type: "checkin",
            user: this.currentUser.name,
            location: this.selectedLocation.name,
            time: this.translate('just-now'),
            feedback: feedback
        });
        
        // Update global stats
        this.stats.checkinsToday++;
        
        this.saveToStorage();
        this.renderLocations();
        this.renderActivityFeed();
        this.updateStats();
        this.addMarkers(); // Refresh markers with updated stats
        
        this.closeModal('checkinModal');
        this.showToast(this.translate('checkin-success'));
    }

    setRating(rating) {
        this.selectedRating = rating;
        this.updateRatingDisplay(rating);
    }

    highlightRating(rating) {
        this.updateRatingDisplay(rating);
    }

    resetRatingHighlight() {
        this.updateRatingDisplay(this.selectedRating);
    }

    updateRatingDisplay(rating) {
        document.querySelectorAll('.rating-stars i').forEach((star, index) => {
            if (index < rating) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    }

    filterLocations() {
        this.renderLocations();
        this.addMarkers();
    }

    getFilteredLocations() {
        const searchInput = document.getElementById('searchInput');
        const typeFilter = document.getElementById('typeFilter');
        const statusFilter = document.getElementById('statusFilter');

        const search = searchInput ? searchInput.value.toLowerCase() : '';
        const typeValue = typeFilter ? typeFilter.value : '';
        const statusValue = statusFilter ? statusFilter.value : '';
        
        return this.bhandaaras.filter(location => {
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

    switchView(viewType) {
        const mapSection = document.getElementById('mapSection');
        const listSection = document.getElementById('listSection');
        const mapViewBtn = document.getElementById('mapViewBtn');
        const listViewBtn = document.getElementById('listViewBtn');
        
        if (!mapSection || !listSection || !mapViewBtn || !listViewBtn) {
            console.warn('View elements not found');
            return;
        }

        this.currentView = viewType;
        
        if (viewType === 'map') {
            // Show map, hide list
            mapSection.classList.remove('hidden');
            listSection.classList.add('hidden');
            mapViewBtn.classList.add('active');
            listViewBtn.classList.remove('active');
            
            // Refresh map after showing
            setTimeout(() => {
                if (this.map) {
                    this.map.invalidateSize();
                }
            }, 100);
        } else if (viewType === 'list') {
            // Show list, hide map
            mapSection.classList.add('hidden');
            listSection.classList.remove('hidden');
            mapViewBtn.classList.remove('active');
            listViewBtn.classList.add('active');
            
            // Ensure locations are rendered
            this.renderLocations();
        }
    }

    renderLocations() {
        const container = document.getElementById('locationsList');
        if (!container) return;

        const locations = this.getFilteredLocations();
        container.innerHTML = locations.length
            ? locations.map(location => this.createLocationCard(location)).join('')
            : `<p class="empty-state">${this.escapeHTML(this.translate('no-results') || 'No locations found.')}</p>`;
    }

    createLocationCard(location) {
        const statusClass = location.todayOpen ? 'open' : 'closed';
        const statusText = location.todayOpen ? this.translate('open-status') : this.translate('closed-status');
        
        return `
                <div class="location-card">
                <div class="location-header">
                    <h3 class="location-title">${this.escapeHTML(location.name)}</h3>
                    <span class="location-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${statusText}
                    </span>
                </div>
                <div class="location-details">
                    <div class="location-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${this.escapeHTML(location.address)}</span>
                    </div>
                    <div class="location-detail">
                        <i class="fas fa-clock"></i>
                        <span>${this.escapeHTML(location.timings)}</span>
                    </div>
                    <div class="location-detail">
                        <i class="fas fa-utensils"></i>
                        <span>${this.escapeHTML(location.description)}</span>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="btn btn--primary btn--sm checkin-btn" onclick="window.app.openCheckinModal(${Number(location.id)})">
                        ${this.translate('checkin-btn')}
                    </button>
                    <div class="location-stats">
                        <span><i class="fas fa-star"></i> ${this.escapeHTML(location.rating)}</span>
                        <span><i class="fas fa-users"></i> ${this.escapeHTML(location.checkinsToday)} ${this.translate('today').toLowerCase()}</span>
                    </div>
                </div>
            </div>
        `;
    }

    renderActivityFeed() {
        const container = document.getElementById('activityFeed');
        if (!container) return;
        
        container.innerHTML = this.recentActivity.slice(0, 10).map(activity => {
            let typeClass = activity.type;
            let typeText = '';
            
            switch (activity.type) {
                case 'checkin':
                    typeText = this.translate('activity-checkin');
                    break;
                case 'addition':
                    typeText = this.translate('activity-addition');
                    break;
                case 'review':
                    typeText = this.translate('activity-review');
                    break;
            }
            
            return `
                <div class="activity-item">
                    <div class="activity-header">
                        <span class="activity-type ${this.escapeHTML(typeClass)}">${typeText}</span>
                        <span class="activity-time">${this.escapeHTML(activity.time)}</span>
                    </div>
                    <div class="activity-meta">
                        <strong>${this.escapeHTML(activity.user)}</strong> - ${this.escapeHTML(activity.location)}
                    </div>
                    ${activity.feedback ? `<div class="activity-content">"${this.escapeHTML(activity.feedback)}"</div>` : ''}
                    ${activity.comment ? `<div class="activity-content">"${this.escapeHTML(activity.comment)}"</div>` : ''}
                </div>
            `;
        }).join('');
    }

    updateStats() {
        const activeCount = this.bhandaaras.filter(b => b.todayOpen).length;
        const checkinsToday = this.bhandaaras.reduce((sum, b) => sum + (Number(b.checkinsToday) || 0), 0);
        const totalCheckins = this.bhandaaras.reduce((sum, b) => sum + (Number(b.totalCheckins) || 0), 0);
        
        const totalLocationsEl = document.getElementById('totalLocations');
        const activeTodayEl = document.getElementById('activeToday');
        const checkinsTodayEl = document.getElementById('checkinsToday');
        const totalCheckinsEl = document.getElementById('totalCheckins');

        if (totalLocationsEl) totalLocationsEl.textContent = this.bhandaaras.length;
        if (activeTodayEl) activeTodayEl.textContent = activeCount;
        if (checkinsTodayEl) checkinsTodayEl.textContent = checkinsToday.toLocaleString();
        if (totalCheckinsEl) totalCheckinsEl.textContent = totalCheckins.toLocaleString();
    }

    saveToStorage() {
        this.writeStorage('bhandaaras', this.bhandaaras);
        this.writeStorage('recentActivity', this.recentActivity.slice(0, 20));
    }

    showLocationDetails(locationId) {
        const location = this.bhandaaras.find(b => b.id === locationId);
        if (!location || !this.map) return;
        
        // Center map on location
        this.map.setView([location.lat, location.lng], 15);
        
        // Switch to map view if in list view
        if (this.currentView !== 'map') {
            this.switchView('map');
        }
    }

    validateEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    showError(elementId, message) {
        const errorElement = document.getElementById(elementId);
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.classList.remove('hidden');
        }
    }

    clearErrors() {
        document.querySelectorAll('.error-message').forEach(el => {
            el.classList.add('hidden');
            el.textContent = '';
        });
    }

    showToast(message) {
        const toast = document.getElementById('successToast');
        const successMessage = document.getElementById('successMessage');
        
        if (toast && successMessage) {
            successMessage.textContent = message;
            // Ensure any previous timeouts are cleared so toast doesn't get stuck
            if (this._toastTimeout) {
                clearTimeout(this._toastTimeout);
                this._toastTimeout = null;
            }

            // Make toast visible
            toast.classList.remove('hidden');
            // Force reflow so the transition runs when re-adding .show
            // eslint-disable-next-line no-unused-expressions
            toast.offsetHeight;
            toast.classList.add('show');

            // Hide after delay
            this._toastTimeout = setTimeout(() => {
                toast.classList.remove('show');
                // Allow transition to finish then hide the element (300ms matches CSS)
                this._toastTimeout = setTimeout(() => {
                    toast.classList.add('hidden');
                    this._toastTimeout = null;
                }, 300);
            }, 3000);
        }
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new BhandaaraApp();
    
    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.user-menu')) {
            const dropdown = document.getElementById('userDropdown');
            if (dropdown) {
                dropdown.classList.add('hidden');
            }
        }
    });

    // Handle viewport changes for responsive design
    const handleViewportChange = () => {
        if (window.app && window.app.map && window.app.currentView === 'map') {
            setTimeout(() => window.app.map.invalidateSize(), 100);
        }
        if (window.app && window.app.mapPicker) {
            setTimeout(() => window.app.mapPicker.invalidateSize(), 100);
        }
    };

    // Listen for orientation changes
    window.addEventListener('orientationchange', handleViewportChange);
    
    // Listen for resize with debounce
    let resizeTimeout;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(handleViewportChange, 250);
    });
});
