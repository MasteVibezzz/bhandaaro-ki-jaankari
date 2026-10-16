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
        this.translations = {
            hi: {
                'app-title': 'भंडारों की जानकारी',
                'app-subtitle': 'Pune में मुफ्त भोजन स्थान',
                'signin-btn': 'साइन इन',
                'signup-btn': 'साइन अप',
                'signout-btn': 'साइन आउट',
                'search-placeholder': 'स्थान खोजें...',
                'filter-all-types': 'सभी प्रकार',
                'filter-daily': 'दैनिक',
                'filter-regular': 'नियमित',
                'filter-festival': 'त्योहार',
                'filter-all-status': 'सभी स्थिति',
                'filter-open': 'खुला',
                'filter-closed': 'बंद',
                'add-location-btn': 'नया स्थान जोड़ें',
                'total-locations': 'कुल स्थान',
                'open-today': 'आज खुले',
                'community-activity': 'समुदायिक गतिविधि',
                'checkins-today': 'आज चेक-इन:',
                'total-checkins': 'कुल चेक-इन:',
                'signin-title': 'साइन इन करें',
                'signup-title': 'नया खाता बनाएं',
                'email-label': 'ईमेल',
                'password-label': 'पासवर्ड',
                'name-label': 'पूरा नाम',
                'confirm-password-label': 'पासवर्ड की पुष्टि करें',
                'remember-me': 'मुझे याद रखें',
                'agree-terms': 'मैं नियम और शर्तों से सहमत हूं',
                'signin-submit': 'साइन इन करें',
                'signup-submit': 'खाता बनाएं',
                'no-account': 'खाता नहीं है?',
                'have-account': 'पहले से खाता है?',
                'signin-link': 'साइन इन करें',
                'signup-link': 'साइन अप करें',
                'add-location-title': 'नया भंडारा स्थान जोड़ें',
                'location-name-label': 'भंडारा का नाम',
                'address-label': 'पता',
                'description-label': 'विवरण',
                'type-label': 'प्रकार',
                'select-type': 'प्रकार चुनें',
                'type-daily': 'दैनिक',
                'type-regular': 'नियमित',
                'type-festival': 'त्योहार',
                'timings-label': 'समय',
                'timings-placeholder': 'जैसे: 7:00 AM - 12:00 PM',
                'days-label': 'दिन',
                'monday': 'सोमवार',
                'tuesday': 'मंगलवार',
                'wednesday': 'बुधवार',
                'thursday': 'गुरुवार',
                'friday': 'शुक्रवार',
                'saturday': 'शनिवार',
                'sunday': 'रविवार',
                'select-location': 'मानचित्र पर स्थान चुनें',
                'click-map-instruction': 'स्थान चुनने के लिए नक्शे पर क्लिक करें',
                'map-help': 'नक्शे पर क्लिक करके स्थान चुनें',
                'add-location-submit': 'स्थान जोड़ें',
                'checkin-title': 'चेक-इन करें',
                'share-experience': 'आपका अनुभव साझा करें',
                'feedback-placeholder': 'भोजन और सेवा के बारे में बताएं...',
                'rating-label': 'रेटिंग',
                'checkin-submit': 'चेक-इन करें',
                'open-status': 'खुला',
                'closed-status': 'बंद',
                'checkin-btn': 'चेक-इन करें',
                'view-details-btn': 'विवरण देखें',
                'today': 'आज',
                'activity-checkin': 'चेक-इन',
                'activity-addition': 'नया स्थान',
                'activity-review': 'समीक्षा',
                'just-now': 'अभी',
                'signin-required': 'कृपया साइन इन करें',
                'signin-success': 'सफलतापूर्वक साइन इन हो गए!',
                'signup-success': 'खाता सफलतापूर्वक बनाया गया!',
                'signout-success': 'सफलतापूर्वक साइन आउट हो गए!',
                'location-added-success': 'नया स्थान सफलतापूर्वक जोड़ा गया!',
                'checkin-success': 'चेक-इन सफल हो गया!',
                'validation-email': 'कृपया वैध ईमेल पता दर्ज करें',
                'validation-password': 'कृपया पासवर्ड दर्ज करें',
                'validation-name': 'कृपया अपना नाम दर्ज करें',
                'validation-password-length': 'पासवर्ड कम से कम 6 अक्षर का होना चाहिए',
                'validation-password-mismatch': 'पासवर्ड मेल नहीं खा रहे',
                'validation-terms': 'कृपया नियम और शर्तों से सहमत हों',
                'validation-select-location': 'कृपया नक्शे पर स्थान चुनें',
                'validation-required-fields': 'कृपया सभी आवश्यक फील्ड भरें'
            },
            en: {
                'app-title': 'Bhandaaro ki Jaankari',
                'app-subtitle': 'Free Food Locations in Pune',
                'signin-btn': 'Sign In',
                'signup-btn': 'Sign Up',
                'signout-btn': 'Sign Out',
                'search-placeholder': 'Search locations...',
                'filter-all-types': 'All Types',
                'filter-daily': 'Daily',
                'filter-regular': 'Regular',
                'filter-festival': 'Festival',
                'filter-all-status': 'All Status',
                'filter-open': 'Open',
                'filter-closed': 'Closed',
                'add-location-btn': 'Add New Location',
                'total-locations': 'Total Locations',
                'open-today': 'Open Today',
                'community-activity': 'Community Activity',
                'checkins-today': 'Today\'s Check-ins:',
                'total-checkins': 'Total Check-ins:',
                'signin-title': 'Sign In',
                'signup-title': 'Create New Account',
                'email-label': 'Email',
                'password-label': 'Password',
                'name-label': 'Full Name',
                'confirm-password-label': 'Confirm Password',
                'remember-me': 'Remember me',
                'agree-terms': 'I agree to terms and conditions',
                'signin-submit': 'Sign In',
                'signup-submit': 'Create Account',
                'no-account': 'Don\'t have an account?',
                'have-account': 'Already have an account?',
                'signin-link': 'Sign In',
                'signup-link': 'Sign Up',
                'add-location-title': 'Add New Bhandaara Location',
                'location-name-label': 'Bhandaara Name',
                'address-label': 'Address',
                'description-label': 'Description',
                'type-label': 'Type',
                'select-type': 'Select Type',
                'type-daily': 'Daily',
                'type-regular': 'Regular',
                'type-festival': 'Festival',
                'timings-label': 'Timings',
                'timings-placeholder': 'e.g., 7:00 AM - 12:00 PM',
                'days-label': 'Days',
                'monday': 'Monday',
                'tuesday': 'Tuesday',
                'wednesday': 'Wednesday',
                'thursday': 'Thursday',
                'friday': 'Friday',
                'saturday': 'Saturday',
                'sunday': 'Sunday',
                'select-location': 'Select Location on Map',
                'click-map-instruction': 'Click on map to select location',
                'map-help': 'Click on map to select location',
                'add-location-submit': 'Add Location',
                'checkin-title': 'Check In',
                'share-experience': 'Share Your Experience',
                'feedback-placeholder': 'Tell us about the food and service...',
                'rating-label': 'Rating',
                'checkin-submit': 'Check In',
                'open-status': 'Open',
                'closed-status': 'Closed',
                'checkin-btn': 'Check In',
                'view-details-btn': 'View Details',
                'today': 'Today',
                'activity-checkin': 'Check-in',
                'activity-addition': 'New Location',
                'activity-review': 'Review',
                'just-now': 'Just now',
                'signin-required': 'Please sign in',
                'signin-success': 'Successfully signed in!',
                'signup-success': 'Account created successfully!',
                'signout-success': 'Successfully signed out!',
                'location-added-success': 'New location added successfully!',
                'checkin-success': 'Check-in successful!',
                'validation-email': 'Please enter a valid email address',
                'validation-password': 'Please enter password',
                'validation-name': 'Please enter your name',
                'validation-password-length': 'Password must be at least 6 characters',
                'validation-password-mismatch': 'Passwords do not match',
                'validation-terms': 'Please agree to terms and conditions',
                'validation-select-location': 'Please select location on map',
                'validation-required-fields': 'Please fill all required fields'
            }
        };
        
        // Sample data
        this.bhandaaras = [
            {
                id: 1,
                name: "Dagdusheth Halwai Ganpati Mandir Prasadam",
                address: "Budhwar Peth, Pune",
                lat: 18.5158,
                lng: 73.8567,
                type: "daily",
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                timings: "7:00 AM - 12:00 PM, 4:00 PM - 9:00 PM",
                description: "Famous Ganpati temple serving prasadam daily to devotees",
                active: true,
                todayOpen: true,
                rating: 4.7,
                checkinsToday: 89,
                totalCheckins: 3421,
                reviews: ["Delicious modak prasadam", "Very organized distribution", "Peaceful atmosphere", "Traditional taste"]
            },
            {
                id: 2,
                name: "Gurudwara Guru Nanak Darbar Langar",
                address: "Koregaon Park, Pune",
                lat: 18.5362,
                lng: 73.8933,
                type: "daily",
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                timings: "6:00 AM - 10:00 PM",
                description: "24/7 langar seva serving fresh meals to all visitors",
                active: true,
                todayOpen: true,
                rating: 4.9,
                checkinsToday: 156,
                totalCheckins: 8934,
                reviews: ["Excellent seva", "Always fresh food", "Welcoming volunteers", "Great dal chawal"]
            },
            {
                id: 3,
                name: "Iskcon Pune Prasadam",
                address: "Kondhwa Road, Pune",
                lat: 18.4610,
                lng: 73.9044,
                type: "regular",
                days: ["Tuesday", "Thursday", "Saturday", "Sunday"],
                timings: "6:30 PM - 8:30 PM",
                description: "Krishna prasadam distribution after evening aarti",
                active: true,
                todayOpen: true,
                rating: 4.5,
                checkinsToday: 67,
                totalCheckins: 1245,
                reviews: ["Pure vegetarian prasadam", "Spiritual atmosphere", "Good for families", "Quality food"]
            },
            {
                id: 4,
                name: "Shaniwar Wada Area Bhandaara",
                address: "Shaniwar Peth, Pune",
                lat: 18.5196,
                lng: 73.8553,
                type: "festival",
                days: ["Saturday"],
                timings: "12:00 PM - 4:00 PM",
                description: "Traditional Maharashtrian bhandaara every Saturday",
                active: false,
                todayOpen: false,
                rating: 4.2,
                checkinsToday: 0,
                totalCheckins: 567,
                reviews: ["Authentic Maharashtrian food", "Good bhaji poli", "Cultural experience", "Friendly locals"]
            },
            {
                id: 5,
                name: "Parvati Hill Temple Prasadam",
                address: "Parvati Paytha, Pune",
                lat: 18.4967,
                lng: 73.8591,
                type: "regular",
                days: ["Monday", "Wednesday", "Friday"],
                timings: "8:00 AM - 11:00 AM, 5:00 PM - 8:00 PM",
                description: "Hilltop temple serving prasadam thrice weekly",
                active: true,
                todayOpen: true,
                rating: 4.3,
                checkinsToday: 34,
                totalCheckins: 892,
                reviews: ["Beautiful temple location", "Simple but tasty prasadam", "Peaceful environment", "Good climb exercise"]
            },
            {
                id: 6,
                name: "FC Road Jain Mandir Anna Seva",
                address: "Fergusson College Road, Pune",
                lat: 18.5296,
                lng: 73.8358,
                type: "regular",
                days: ["Tuesday", "Friday", "Sunday"],
                timings: "1:00 PM - 4:00 PM",
                description: "Pure Jain food distribution center",
                active: false,
                todayOpen: false,
                rating: 4.4,
                checkinsToday: 0,
                totalCheckins: 678,
                reviews: ["Very pure food preparation", "Jain dietary compliant", "Clean environment", "Good dal rice"]
            },
            {
                id: 7,
                name: "Viman Nagar Community Kitchen",
                address: "Viman Nagar, Pune",
                lat: 18.5679,
                lng: 73.9143,
                type: "regular",
                days: ["Saturday", "Sunday"],
                timings: "11:00 AM - 3:00 PM",
                description: "Modern community kitchen serving weekend meals",
                active: false,
                todayOpen: false,
                rating: 4.1,
                checkinsToday: 0,
                totalCheckins: 445,
                reviews: ["Modern facility", "Good for IT crowd", "Nutritious meals", "Easy parking"]
            },
            {
                id: 8,
                name: "Kothrud Marathi Seva Mandal",
                address: "Kothrud, Pune",
                lat: 18.5074,
                lng: 73.8077,
                type: "regular",
                days: ["Thursday", "Sunday"],
                timings: "12:30 PM - 3:30 PM",
                description: "Local community service organization meal program",
                active: false,
                todayOpen: false,
                rating: 4.0,
                checkinsToday: 0,
                totalCheckins: 356,
                reviews: ["Local community favorite", "Home-style cooking", "Marathi culture", "Affordable area"]
            },
            {
                id: 9,
                name: "Vishrambaug Wada Bhandaara",
                address: "Bajirao Road, Pune",
                lat: 18.5180,
                lng: 73.8450,
                type: "festival",
                days: ["Tuesday", "Friday"],
                timings: "2:00 PM - 5:00 PM",
                description: "Historic wada hosting traditional bhandaara",
                active: true,
                todayOpen: true,
                rating: 4.6,
                checkinsToday: 23,
                totalCheckins: 1123,
                reviews: ["Historic location", "Traditional recipes", "Cultural significance", "Good organization"]
            },
            {
                id: 10,
                name: "Hadapsar Gurudwara Langar",
                address: "Hadapsar, Pune",
                lat: 18.5089,
                lng: 73.9259,
                type: "daily",
                days: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                timings: "7:00 AM - 9:00 PM",
                description: "Community gurudwara serving fresh langar daily",
                active: true,
                todayOpen: true,
                rating: 4.8,
                checkinsToday: 78,
                totalCheckins: 2345,
                reviews: ["Fresh daily meals", "Helpful seva", "Clean kitchen", "All welcome"]
            }
        ];

        this.recentActivity = [
            {
                type: "checkin",
                user: "Priya M.",
                location: "Gurudwara Guru Nanak Darbar Langar",
                time: "1 hour ago",
                feedback: "Excellent fresh rotis today"
            },
            {
                type: "checkin",
                user: "Rahul K.",
                location: "Dagdusheth Halwai Ganpati Mandir Prasadam",
                time: "3 hours ago",
                feedback: "Morning prasadam was delicious"
            },
            {
                type: "addition",
                user: "Sneha P.",
                location: "New Bhandaara in Baner",
                time: "6 hours ago"
            },
            {
                type: "checkin",
                user: "Amit S.",
                location: "Vishrambaug Wada Bhandaara",
                time: "8 hours ago",
                feedback: "Traditional taste, well organized"
            },
            {
                type: "review",
                user: "Kavita D.",
                location: "Iskcon Pune Prasadam",
                time: "1 day ago",
                rating: 5,
                comment: "Beautiful prasadam and peaceful darshan"
            }
        ];

        this.stats = {
            totalLocations: 89,
            activeToday: 17,
            totalCheckins: 23567,
            checkinsToday: 447
        };

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
        // Load stored locations
        const storedLocations = this.readStorage('bhandaaras', []);
        if (Array.isArray(storedLocations)) {
            try {
                const storedById = new Map(storedLocations.map(location => [location.id, location]));
                this.bhandaaras = this.bhandaaras
                    .map(location => storedById.get(location.id) || location)
                    .concat(storedLocations.filter(location => !this.bhandaaras.some(existing => existing.id === location.id)));
            } catch (e) {
                console.warn('Failed to parse stored locations');
            }
        }

        // Load stored activity
        const storedActivity = this.readStorage('recentActivity', []);
        if (Array.isArray(storedActivity)) {
            try {
                this.recentActivity = [...storedActivity, ...this.recentActivity];
            } catch (e) {
                console.warn('Failed to parse stored activity');
            }
        }
    }

    readStorage(key, fallback) {
        try {
            const rawValue = localStorage.getItem(key);
            return rawValue ? JSON.parse(rawValue) : fallback;
        } catch (e) {
            console.warn(`Unable to read localStorage key "${key}"`);
            return fallback;
        }
    }

    loadLanguagePreference() {
        const savedLanguage = localStorage.getItem('preferredLanguage');
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
        localStorage.setItem('preferredLanguage', this.currentLanguage);
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
        const user = localStorage.getItem('currentUser');
        if (user) {
            try {
                this.currentUser = JSON.parse(user);
                this.showAuthenticatedState();
            } catch (e) {
                localStorage.removeItem('currentUser');
                this.showGuestState();
            }
        } else {
            this.showGuestState();
        }
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
                        <span>${location.rating}/5 (${location.totalCheckins} ${this.translate('checkin-btn').toLowerCase()})</span>
                    </div>
                </div>
                <div class="popup-actions">
                    <button class="popup-btn popup-btn--primary" onclick="window.app.openCheckinModal(${location.id})">
                        ${this.translate('checkin-btn')}
                    </button>
                    <button class="popup-btn popup-btn--secondary" onclick="window.app.showLocationDetails(${location.id})">
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
        // Simulate reverse geocoding
        const areas = [
            "Budhwar Peth", "Koregaon Park", "Kondhwa Road", "Shaniwar Peth", 
            "Parvati Paytha", "FC Road", "Viman Nagar", "Kothrud", 
            "Bajirao Road", "Hadapsar", "Baner", "Aundh", "Deccan"
        ];
        
        const randomArea = areas[Math.floor(Math.random() * areas.length)];
        const address = `${randomArea}, Pune, Maharashtra 411001`;
        
        const addressField = document.getElementById('locationAddress');
        if (addressField) {
            addressField.value = address;
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
        
        const email = emailEl ? emailEl.value : '';
        const password = passwordEl ? passwordEl.value : '';
        
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
        localStorage.setItem('currentUser', JSON.stringify(user));
        
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
        localStorage.setItem('currentUser', JSON.stringify(user));
        
        this.showAuthenticatedState();
        this.closeModal('signupModal');
        this.showToast(this.translate('signup-success'));
    }

    signOut() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
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
        this.saveToStorage();
        
        // Add to activity
        this.recentActivity.unshift({
            type: "addition",
            user: this.currentUser.name,
            location: name,
            time: this.translate('just-now')
        });
        
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
        this.stats.totalCheckins++;
        
        this.saveToStorage();
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
                    <h3 class="location-title">${location.name}</h3>
                    <span class="location-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${statusText}
                    </span>
                </div>
                <div class="location-details">
                    <div class="location-detail">
                        <i class="fas fa-map-marker-alt"></i>
                        <span>${location.address}</span>
                    </div>
                    <div class="location-detail">
                        <i class="fas fa-clock"></i>
                        <span>${location.timings}</span>
                    </div>
                    <div class="location-detail">
                        <i class="fas fa-utensils"></i>
                        <span>${this.escapeHTML(location.description)}</span>
                    </div>
                </div>
                <div class="location-actions">
                    <button class="btn btn--primary btn--sm checkin-btn" onclick="window.app.openCheckinModal(${location.id})">
                        ${this.translate('checkin-btn')}
                    </button>
                    <div class="location-stats">
                        <span><i class="fas fa-star"></i> ${location.rating}</span>
                        <span><i class="fas fa-users"></i> ${location.checkinsToday} ${this.translate('today').toLowerCase()}</span>
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
                        <span class="activity-type ${typeClass}">${typeText}</span>
                        <span class="activity-time">${activity.time}</span>
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
        const totalCheckins = this.bhandaaras.reduce((sum, b) => sum + b.checkinsToday, 0);
        
        const totalLocationsEl = document.getElementById('totalLocations');
        const activeTodayEl = document.getElementById('activeToday');
        const checkinsTodayEl = document.getElementById('checkinsToday');
        const totalCheckinsEl = document.getElementById('totalCheckins');

        if (totalLocationsEl) totalLocationsEl.textContent = this.bhandaaras.length;
        if (activeTodayEl) activeTodayEl.textContent = activeCount;
        if (checkinsTodayEl) checkinsTodayEl.textContent = totalCheckins.toLocaleString();
        if (totalCheckinsEl) totalCheckinsEl.textContent = this.stats.totalCheckins.toLocaleString();
    }

    saveToStorage() {
        try {
            localStorage.setItem('bhandaaras', JSON.stringify(this.bhandaaras));
            localStorage.setItem('recentActivity', JSON.stringify(this.recentActivity.slice(0, 20)));
        } catch (e) {
            console.warn('Failed to save to storage');
        }
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