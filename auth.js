import { request, submitForm } from './api.js';

export async function checkAuthState(app) {
    try {
        app.currentUser = await request('/auth/me');
        app.showAuthenticatedState();
    } catch (error) {
        if (error.status !== 401) throw error;
        app.currentUser = null;
        app.showGuestState();
    }
}

export async function handleSignin(app, event) {
    event.preventDefault();
    return submitForm(app, 'signinForm', async () => {
        const body = {
            email: document.getElementById('signinEmail').value,
            password: document.getElementById('signinPassword').value,
            remember: document.getElementById('rememberMe').checked
        };
        app.currentUser = await request('/auth/login', { method: 'POST', body });
        app.showAuthenticatedState();
        app.closeModal('signinModal');
        app.showToast(app.translate('signin-success'));
    });
}

export async function handleSignup(app, event) {
    event.preventDefault();
    return submitForm(app, 'signupForm', async () => {
        const password = document.getElementById('signupPassword').value;
        if (password !== document.getElementById('signupConfirmPassword').value) {
            app.showError('signupError', app.translate('validation-password-mismatch'));
            return;
        }
        if (!document.getElementById('agreeTerms').checked) {
            app.showError('signupError', app.translate('validation-terms'));
            return;
        }
        app.currentUser = await request('/auth/register', {
            method: 'POST', body: { name: document.getElementById('signupName').value,
                email: document.getElementById('signupEmail').value, password }
        });
        app.showAuthenticatedState();
        app.closeModal('signupModal');
        app.showToast(app.translate('signup-success'));
    });
}

export async function signOut(app) {
    try {
        await request('/auth/logout', { method: 'POST', body: {} });
        app.currentUser = null;
        app.showGuestState();
        document.getElementById('userDropdown')?.classList.add('hidden');
        app.showToast(app.translate('signout-success'));
    } catch (error) {
        app.setDataStatus('error');
    }
}

