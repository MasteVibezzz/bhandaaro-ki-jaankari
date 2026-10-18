// Functions receive the application context explicitly; app.js owns shared state.
import { readStorage, writeStorage, removeStorage } from './storage.js';

export function checkAuthState(app) {
    const rememberedUser = readStorage('currentUser', null, localStorage);
    const sessionUser = readStorage('currentUser', null, sessionStorage);
    const user = rememberedUser || sessionUser;

    if (user && typeof user.name === 'string' && typeof user.email === 'string') {
        app.currentUser = user;
        app.showAuthenticatedState();
        return;
    }

    removeStorage('currentUser', localStorage);
    removeStorage('currentUser', sessionStorage);
    app.showGuestState();
}

export function handleSignin(app, e) {
    e.preventDefault();
    
    const emailEl = document.getElementById('signinEmail');
    const passwordEl = document.getElementById('signinPassword');
    const rememberMeEl = document.getElementById('rememberMe');
    
    const email = emailEl ? emailEl.value : '';
    const password = passwordEl ? passwordEl.value : '';
    const rememberMe = rememberMeEl ? rememberMeEl.checked : false;
    
    // Basic validation
    if (!app.validateEmail(email)) {
        app.showError('signinError', app.translate('validation-email'));
        return;
    }

    if (!password.trim()) {
        app.showError('signinError', app.translate('validation-password'));
        return;
    }

    // Simulate authentication
    const user = {
        name: email.split('@')[0],
        email: email
    };

    app.currentUser = user;
    const selectedStorage = rememberMe ? localStorage : sessionStorage;
    const otherStorage = rememberMe ? sessionStorage : localStorage;
    writeStorage('currentUser', user, selectedStorage);
    removeStorage('currentUser', otherStorage);
    
    app.showAuthenticatedState();
    app.closeModal('signinModal');
    app.showToast(app.translate('signin-success'));
}

export function handleSignup(app, e) {
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
        app.showError('signupError', app.translate('validation-name'));
        return;
    }
    
    if (!app.validateEmail(email)) {
        app.showError('signupError', app.translate('validation-email'));
        return;
    }
    
    if (password.length < 6) {
        app.showError('signupError', app.translate('validation-password-length'));
        return;
    }
    
    if (password !== confirmPassword) {
        app.showError('signupError', app.translate('validation-password-mismatch'));
        return;
    }
    
    if (!agreeTerms) {
        app.showError('signupError', app.translate('validation-terms'));
        return;
    }

    // Create user
    const user = { name, email };
    app.currentUser = user;
    writeStorage('currentUser', user, sessionStorage);
    removeStorage('currentUser', localStorage);
    
    app.showAuthenticatedState();
    app.closeModal('signupModal');
    app.showToast(app.translate('signup-success'));
}

export function signOut(app) {
    app.currentUser = null;
    removeStorage('currentUser', localStorage);
    removeStorage('currentUser', sessionStorage);
    app.showGuestState();
    const dropdown = document.getElementById('userDropdown');
    if (dropdown) {
        dropdown.classList.add('hidden');
    }
    app.showToast(app.translate('signout-success'));
}

export function validateEmail(app, email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

