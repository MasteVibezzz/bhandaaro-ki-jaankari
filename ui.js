// Functions receive the application context explicitly; app.js owns shared state.
import { readStorage, writeStorage } from './storage.js';
import { eventStatus, scheduleText, updateScheduleFields } from './locations.js';

export function loadLanguagePreference(app) {
    const savedLanguage = readStorage('preferredLanguage', null, localStorage, false);
    if (savedLanguage && app.translations[savedLanguage]) {
        app.currentLanguage = savedLanguage;
    }
    app.updateLanguageToggle();
}

export function updateLanguageToggle(app) {
    const langToggle = document.getElementById('currentLang');
    if (langToggle) {
        langToggle.textContent = app.currentLanguage === 'hi' ? 'EN' : 'हिं';
    }
}

export function toggleLanguage(app) {
    app.currentLanguage = app.currentLanguage === 'hi' ? 'en' : 'hi';
    writeStorage('preferredLanguage', app.currentLanguage, localStorage, false);
    app.updateLanguageToggle();
    app.applyTranslations();
    app.renderLocations(); // Re-render to apply translations
    app.renderActivityFeed(); // Re-render activity feed
    app.addMarkers(); // Re-render map markers
    if (app.dataStatus) app.setDataStatus(app.dataStatus);
}

export function translate(app, key) {
    return app.translations[app.currentLanguage][key] || app.translations['hi'][key] || key;
}

export function applyTranslations(app) {
    document.documentElement?.setAttribute('lang', app.currentLanguage);
    // Translate all elements with data-key attributes
    document.querySelectorAll('[data-key]').forEach(element => {
        const key = element.getAttribute('data-key');
        const translation = app.translate(key);
        
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
        searchInput.placeholder = app.translate('search-placeholder');
    }

    const timingsInput = document.getElementById('locationTimings');
    if (timingsInput) {
        timingsInput.placeholder = app.translate('timings-placeholder');
    }

    const feedbackTextarea = document.getElementById('checkinFeedback');
    if (feedbackTextarea) {
        feedbackTextarea.placeholder = app.translate('feedback-placeholder');
    }
    document.querySelectorAll('.modal-close').forEach(button => button.setAttribute('aria-label', app.translate('close-dialog')));
    document.getElementById('langToggle')?.setAttribute('aria-label', app.currentLanguage === 'hi' ? 'Switch to English' : 'हिंदी में देखें');
}

export function showAuthenticatedState(app) {
    const guestButtons = document.getElementById('guestButtons');
    const userMenu = document.getElementById('userMenu');
    const userName = document.getElementById('userName');

    if (guestButtons) guestButtons.classList.add('hidden');
    if (userMenu) userMenu.classList.remove('hidden');
    if (userName && app.currentUser) userName.textContent = app.currentUser.name;
}

export function showGuestState(app) {
    const guestButtons = document.getElementById('guestButtons');
    const userMenu = document.getElementById('userMenu');

    if (guestButtons) guestButtons.classList.remove('hidden');
    if (userMenu) userMenu.classList.add('hidden');
}

export function escapeHTML(app, value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    }[char]));
}

export function createPopupContent(app, location) {
    const statusClass = eventStatus(location) === 'upcoming' ? 'upcoming' : (eventStatus(location) ? eventStatus(location) === 'serving' : location.todayOpen) ? 'open' : 'closed';
    const statusText = eventStatus(location) ? app.translate('event-' + eventStatus(location)) : location.todayOpen ? app.translate('open-status') : app.translate('closed-status');
    
    return `
        <div class="custom-popup">
            <div class="popup-header">
                <h4 class="popup-title">${app.escapeHTML(location.name)}</h4>
                <span class="popup-status ${statusClass}">
                    <i class="fas fa-circle"></i>
                    ${statusText}
                </span>
            </div>
            <div class="popup-details">
                <div class="popup-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${app.escapeHTML(location.address)}</span>
                </div>
                <div class="popup-detail">
                    <i class="fas fa-clock"></i>
                    <span>${app.escapeHTML(scheduleText(app, location))}</span>
                </div>
                <div class="popup-detail">
                    <i class="fas fa-star"></i>
                    <span>${app.escapeHTML(location.rating)}/5 (${app.escapeHTML(location.totalCheckins)} ${app.translate('checkin-btn').toLowerCase()})</span>
                </div>
            </div>
            <div class="popup-actions">
                <button class="popup-btn popup-btn--primary" data-action="checkin" data-location-id="${Number(location.id)}">
                    ${app.translate('checkin-btn')}
                </button>
                <button class="popup-btn popup-btn--secondary" data-action="details" data-location-id="${Number(location.id)}">
                    ${app.translate('view-details-btn')}
                </button>
            </div>
        </div>
    `;
}

export function bindEvents(app) {
    if (app.eventsBound) return;
    document.getElementById('scheduleKind').addEventListener('change', updateScheduleFields);
    document.getElementById('showEnded').addEventListener('change', () => app.filterLocations());
    app.eventsBound = true;
    document.getElementById('retryLoad')?.addEventListener('click', () => app.reload());

    document.addEventListener('click', event => {
        const action = event.target.closest('[data-action]');
        if (action) {
            const id = Number(action.dataset.locationId);
            if (action.dataset.action === 'checkin') app.openCheckinModal(id);
            if (action.dataset.action === 'details') app.showLocationDetails(id);
            if (action.dataset.action === 'clear-filters') {
                for (const field of ['searchInput', 'typeFilter', 'statusFilter']) document.getElementById(field).value = '';
                app.filterLocations();
                document.getElementById('searchInput').focus();
            }
        }
        if (!event.target.closest('.user-menu')) {
            document.getElementById('userDropdown')?.classList.add('hidden');
            document.getElementById('userProfile')?.setAttribute('aria-expanded', 'false');
        }
    });

    for (const field of ['locationLat', 'locationLng']) {
        document.getElementById(field).addEventListener('change', () => {
            const lat = document.getElementById('locationLat');
            const lng = document.getElementById('locationLng');
            if (lat.value !== '' && lng.value !== '' && lat.checkValidity() && lng.checkValidity()) {
                app.selectLocation({ lat: Number(lat.value), lng: Number(lng.value) });
            } else {
                app.selectedCoordinates = null;
            }
        });
    }

    // Authentication
    const signinBtn = document.getElementById('signinBtn');
    const signupBtn = document.getElementById('signupBtn');
    const signoutBtn = document.getElementById('signoutBtn');
    
    if (signinBtn) signinBtn.addEventListener('click', () => app.openModal('signinModal'));
    if (signupBtn) signupBtn.addEventListener('click', () => app.openModal('signupModal'));
    if (signoutBtn) signoutBtn.addEventListener('click', () => app.signOut());

    // Language toggle
    const langToggle = document.getElementById('langToggle');
    if (langToggle) langToggle.addEventListener('click', () => app.toggleLanguage());

    // Modal controls
    app.bindModalEvents();

    // Forms
    const signinForm = document.getElementById('signinForm');
    const signupForm = document.getElementById('signupForm');
    const addLocationForm = document.getElementById('addLocationForm');
    const checkinForm = document.getElementById('checkinForm');
    
    if (signinForm) signinForm.addEventListener('submit', (e) => app.handleSignin(e));
    if (signupForm) signupForm.addEventListener('submit', (e) => app.handleSignup(e));
    if (addLocationForm) addLocationForm.addEventListener('submit', (e) => app.handleAddLocation(e));
    if (checkinForm) checkinForm.addEventListener('submit', (e) => app.handleCheckin(e));

    // Filters and search
    const searchInput = document.getElementById('searchInput');
    const typeFilter = document.getElementById('typeFilter');
    const statusFilter = document.getElementById('statusFilter');
    
    if (searchInput) searchInput.addEventListener('input', () => app.filterLocations());
    if (typeFilter) typeFilter.addEventListener('change', () => app.filterLocations());
    if (statusFilter) statusFilter.addEventListener('change', () => app.filterLocations());

    // View toggle
    const mapViewBtn = document.getElementById('mapViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (mapViewBtn) mapViewBtn.addEventListener('click', () => app.switchView('map'));
    if (listViewBtn) listViewBtn.addEventListener('click', () => app.switchView('list'));

    // Add location
    const addLocationBtn = document.getElementById('addLocationBtn');
    if (addLocationBtn) addLocationBtn.addEventListener('click', () => app.openAddLocation());

    // User profile dropdown
    const userProfile = document.getElementById('userProfile');
    if (userProfile) userProfile.addEventListener('click', () => app.toggleUserDropdown());

    // Rating stars
    document.querySelectorAll('.rating-stars i').forEach(star => {
        star.addEventListener('click', (e) => app.setRating(parseInt(e.target.dataset.rating)));
        star.addEventListener('keydown', event => {
            if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                app.setRating(Number(star.dataset.rating));
            }
        });
        star.addEventListener('mouseenter', (e) => app.highlightRating(parseInt(e.target.dataset.rating)));
    });

    const ratingStars = document.querySelector('.rating-stars');
    if (ratingStars) {
        ratingStars.addEventListener('mouseleave', () => app.resetRatingHighlight());
    }

    // Modal switch links
    const switchToSignup = document.getElementById('switchToSignup');
    const switchToSignin = document.getElementById('switchToSignin');
    
    if (switchToSignup) {
        switchToSignup.addEventListener('click', (e) => {
            e.preventDefault();
            app.switchModal('signupModal');
        });
    }
    
    if (switchToSignin) {
        switchToSignin.addEventListener('click', (e) => {
            e.preventDefault();
            app.switchModal('signinModal');
        });
    }
}

export function bindModalEvents(app) {
    const modals = ['signinModal', 'signupModal', 'addLocationModal', 'checkinModal'];
    
    modals.forEach(modalId => {
        const modal = document.getElementById(modalId);
        if (!modal) return;

        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('tabindex', '-1');
        const title = modal.querySelector('h2');
        title.id = modalId + 'Title';
        modal.setAttribute('aria-labelledby', title.id);
        modal.querySelector('.error-message')?.setAttribute('role', 'alert');

        const overlay = modal.querySelector('.modal-overlay');
        const closeBtn = modal.querySelector('.modal-close');
        
        if (overlay) {
            // Remove existing listeners by cloning
            const newOverlay = overlay.cloneNode(true);
            overlay.parentNode.replaceChild(newOverlay, overlay);
            newOverlay.addEventListener('click', () => app.closeModal(modalId));
        }

        if (closeBtn) {
            // Remove existing listeners by cloning
            const newCloseBtn = closeBtn.cloneNode(true);
            closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
            newCloseBtn.addEventListener('click', () => app.closeModal(modalId));
        }
    });

    // Add escape key listener
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !document.getElementById('userDropdown').classList.contains('hidden')) {
            document.getElementById('userDropdown').classList.add('hidden');
            document.getElementById('userProfile').setAttribute('aria-expanded', 'false');
            document.getElementById('userProfile').focus();
        }
        const activeModal = document.querySelector('.modal:not(.hidden)');
        if (activeModal && e.key === 'Tab') {
            const controls = [...activeModal.querySelectorAll('button, a[href], input, select, textarea, [tabindex="0"]')]
                .filter(element => !element.disabled && element.getClientRects().length);
            const first = controls[0], last = controls[controls.length - 1];
            if (!first) { e.preventDefault(); activeModal.focus(); }
            else if (e.shiftKey && (document.activeElement === first || document.activeElement === activeModal)) { e.preventDefault(); last.focus(); }
            else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        }
        if (e.key === 'Escape') {
            modals.forEach(modalId => {
                const modal = document.getElementById(modalId);
                if (modal && !modal.classList.contains('hidden')) {
                    app.closeModal(modalId);
                }
            });
        }
    });
}

export function openModal(app, modalId) {
    if (!document.querySelector('.modal:not(.hidden)')) app.modalReturnFocus = document.activeElement;
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
        for (const element of document.body.children) {
            if (!element.classList.contains('modal') && element.tagName !== 'SCRIPT' && element.id !== 'successToast') element.inert = true;
        }
        modal.querySelector('input:not(:disabled), button')?.focus({ preventScroll: true });

        // Initialize map picker if opening add location modal
        if (modalId === 'addLocationModal') {
            setTimeout(() => {
                app.initializeMapPicker();
                if (app.mapPicker) {
                    app.mapPicker.invalidateSize();
                }
            }, 100);
        }
    }
}

export function closeModal(app, modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        document.body.style.overflow = 'auto';
        for (const element of document.body.children) element.inert = false;
        app.clearErrors();
        
        // Reset forms when closing
        const form = modal.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Reset add location specific data
        if (modalId === 'addLocationModal') {
            app.destroyMapPicker();
            const coordDisplay = document.getElementById('selectedCoordinates');
            if (coordDisplay) {
                coordDisplay.textContent = app.translate('click-map-instruction');
            }
            
        }
        
        // Reset rating
        if (modalId === 'checkinModal') {
            app.selectedRating = 0;
            app.resetRatingHighlight();
        }
        if (app.modalReturnFocus?.isConnected) app.modalReturnFocus.focus({ preventScroll: true });
        app.modalReturnFocus = null;
    }
}

export function switchModal(app, targetModalId) {
    app.openModal(targetModalId);
}

export function toggleUserDropdown(app) {
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.toggle('hidden');
        document.getElementById('userProfile').setAttribute('aria-expanded', String(!dropdown.classList.contains('hidden')));
    }
}

export function setRating(app, rating) {
    app.selectedRating = rating;
    app.updateRatingDisplay(rating);
}

export function highlightRating(app, rating) {
    app.updateRatingDisplay(rating);
}

export function resetRatingHighlight(app) {
    app.updateRatingDisplay(app.selectedRating);
}

export function updateRatingDisplay(app, rating) {
    document.querySelectorAll('.rating-stars i').forEach((star, index) => {
        star.setAttribute('aria-pressed', index < rating ? 'true' : 'false');
        if (index < rating) {
            star.classList.add('active');
        } else {
            star.classList.remove('active');
        }
    });
}

export function switchView(app, viewType) {
    const mapSection = document.getElementById('mapSection');
    const listSection = document.getElementById('listSection');
    const mapViewBtn = document.getElementById('mapViewBtn');
    const listViewBtn = document.getElementById('listViewBtn');
    
    if (!mapSection || !listSection || !mapViewBtn || !listViewBtn) {
        console.warn('View elements not found');
        return;
    }

    app.currentView = viewType;
    const wide = window.matchMedia('(min-width: 48rem)').matches;
    document.querySelector('.content-grid')?.classList.toggle('list-only', viewType === 'list');
    mapViewBtn.setAttribute('aria-pressed', String(viewType === 'map'));
    listViewBtn.setAttribute('aria-pressed', String(viewType === 'list'));
    
    if (viewType === 'map') {
        // Show map, hide list
        mapSection.classList.remove('hidden');
        listSection.classList.toggle('hidden', !wide);
        mapViewBtn.classList.add('active');
        listViewBtn.classList.remove('active');
        
        // Refresh map after showing
        setTimeout(() => {
            if (app.map) {
                app.map.invalidateSize();
            }
        }, 100);
    } else if (viewType === 'list') {
        // Show list, hide map
        mapSection.classList.add('hidden');
        listSection.classList.remove('hidden');
        mapViewBtn.classList.remove('active');
        listViewBtn.classList.add('active');
        
        // Ensure locations are rendered
        app.renderLocations();
    }
}

export function renderLocations(app) {
    const container = document.getElementById('locationsList');
    if (!container) return;

    const locations = app.getFilteredLocations();
    const count = document.getElementById('resultCount');
    if (count) count.textContent = `${locations.length} ${app.translate('results-label')}`;
    container.innerHTML = locations.length
        ? locations.map(location => app.createLocationCard(location)).join('')
        : `<div class="empty-state"><p>${app.escapeHTML(app.translate('no-results') || 'No locations found.')}</p><button class="btn btn--outline" data-action="clear-filters">${app.translate('clear-filters')}</button></div>`;
}

export function createLocationCard(app, location) {
    const statusClass = eventStatus(location) === 'upcoming' ? 'upcoming' : (eventStatus(location) ? eventStatus(location) === 'serving' : location.todayOpen) ? 'open' : 'closed';
    const statusText = eventStatus(location) ? app.translate('event-' + eventStatus(location)) : location.todayOpen ? app.translate('open-status') : app.translate('closed-status');
    
    return `
            <article class="location-card">
            <div class="location-header">
                <h3 class="location-title">${app.escapeHTML(location.name)}</h3>
                <div class="location-tags"><span class="location-status ${statusClass}">
                    <i class="fas fa-circle" aria-hidden="true"></i>
                    ${statusText}
                </span>${location.isDemo ? `<span class="demo-tag">${app.translate('demo-label')}</span>` : ''}</div>
            </div>
            <div class="location-details">
                <div class="location-detail">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>${app.escapeHTML(location.address)}</span>
                </div>
                <div class="location-detail schedule-detail">
                    <i class="fas fa-clock" aria-hidden="true"></i>
                    <span>${app.escapeHTML(scheduleText(app, location))}</span>
                </div>
                <div class="location-detail">
                    <i class="fas fa-utensils"></i>
                    <span>${app.escapeHTML(location.description)}</span>
                </div>
            </div>
            <div class="location-stats">
                    <span><i class="fas fa-star" aria-hidden="true"></i> ${app.escapeHTML(location.rating)} / 5</span>
                    <span><i class="fas fa-users"></i> ${app.escapeHTML(location.checkinsToday)} ${app.translate('today').toLowerCase()}</span>
            </div>
            <div class="location-actions">
                <a class="btn btn--outline" href="https://www.google.com/maps/dir/?api=1&destination=${Number(location.lat)},${Number(location.lng)}" target="_blank" rel="noopener noreferrer"><i class="fas fa-location-arrow" aria-hidden="true"></i>${app.translate('directions')}</a>
                <button class="btn btn--secondary btn--sm checkin-btn" data-action="checkin" data-location-id="${Number(location.id)}">${app.translate('checkin-btn')}</button>
            </div>
        </article>
    `;
}

export function renderActivityFeed(app) {
    const container = document.getElementById('activityFeed');
    if (!container) return;
    
    container.innerHTML = app.recentActivity.slice(0, 10).map(activity => {
        let typeClass = activity.type;
        let typeText = '';
        
        switch (activity.type) {
            case 'checkin':
                typeText = app.translate('activity-checkin');
                break;
            case 'addition':
                typeText = app.translate('activity-addition');
                break;
            case 'review':
                typeText = app.translate('activity-review');
                break;
        }
        
        return `
            <div class="activity-item">
                <div class="activity-header">
                    <span class="activity-type ${app.escapeHTML(typeClass)}">${typeText}</span>
                    <span class="activity-time">${app.escapeHTML(activity.time)}</span>
                </div>
                <div class="activity-meta">
                    <strong>${app.escapeHTML(activity.user)}</strong> - ${app.escapeHTML(activity.location)}
                </div>
                ${activity.feedback ? `<div class="activity-content">"${app.escapeHTML(activity.feedback)}"</div>` : ''}
                ${activity.comment ? `<div class="activity-content">"${app.escapeHTML(activity.comment)}"</div>` : ''}
            </div>
        `;
    }).join('');
}

export function updateStats(app) {
    const { activeToday: activeCount, checkinsToday, totalCheckins } = app.stats;
    
    const totalLocationsEl = document.getElementById('totalLocations');
    const activeTodayEl = document.getElementById('activeToday');
    const checkinsTodayEl = document.getElementById('checkinsToday');
    const totalCheckinsEl = document.getElementById('totalCheckins');

    if (totalLocationsEl) totalLocationsEl.textContent = app.stats.totalLocations;
    if (activeTodayEl) activeTodayEl.textContent = activeCount;
    if (checkinsTodayEl) checkinsTodayEl.textContent = checkinsToday.toLocaleString();
    if (totalCheckinsEl) totalCheckinsEl.textContent = totalCheckins.toLocaleString();
}

export function showError(app, elementId, message) {
    const errorElement = document.getElementById(elementId);
    if (errorElement) {
        errorElement.textContent = message;
        errorElement.classList.remove('hidden');
    }
}

export function clearErrors(app) {
    document.querySelectorAll('.error-message').forEach(el => {
        el.classList.add('hidden');
        el.textContent = '';
    });
}

export function showToast(app, message) {
    const toast = document.getElementById('successToast');
    const successMessage = document.getElementById('successMessage');
    
    if (toast && successMessage) {
        successMessage.textContent = message;
        // Ensure any previous timeouts are cleared so toast doesn't get stuck
        if (app._toastTimeout) {
            clearTimeout(app._toastTimeout);
            app._toastTimeout = null;
        }

        // Make toast visible
        toast.classList.remove('hidden');
        // Force reflow so the transition runs when re-adding .show
        // eslint-disable-next-line no-unused-expressions
        toast.offsetHeight;
        toast.classList.add('show');

        // Hide after delay
        app._toastTimeout = setTimeout(() => {
            toast.classList.remove('show');
            // Allow transition to finish then hide the element (300ms matches CSS)
            app._toastTimeout = setTimeout(() => {
                toast.classList.add('hidden');
                app._toastTimeout = null;
            }, 300);
        }, 3000);
    }
}

