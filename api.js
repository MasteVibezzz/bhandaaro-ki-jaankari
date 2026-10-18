export class ApiError extends Error {
    constructor(message, status = 0) {
        super(message);
        this.status = status;
    }
}

export async function request(path, { method = 'GET', body, key } = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 15000);
    try {
        const response = await fetch('/api' + path, {
            method, credentials: 'same-origin', signal: controller.signal,
            headers: { ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
                ...(key ? { 'Idempotency-Key': key } : {}) },
            ...(body !== undefined ? { body: JSON.stringify(body) } : {})
        });
        const data = await response.json();
        if (!response.ok) throw new ApiError(data.error?.message || 'Request failed', response.status);
        return data;
    } catch (error) {
        if (error instanceof ApiError) throw error;
        throw new ApiError('Cannot reach the server. Please check the connection and try again.');
    } finally {
        clearTimeout(timer);
    }
}

export async function submitForm(app, id, action) {
    app.pendingForms ??= new Set();
    if (app.pendingForms.has(id)) return;
    app.pendingForms.add(id);
    const button = document.querySelector('#' + id + ' button[type="submit"]');
    if (button) button.disabled = true;
    try {
        app.clearErrors();
        await action();
    } catch (error) {
        if (error.status === 401) {
            app.currentUser = null;
            app.showGuestState();
        }
        const prefix = id.replace('Form', '');
        app.showError(prefix + 'Error', error.status === 0 ? app.translate('api-unavailable') : error.message);
    } finally {
        app.pendingForms.delete(id);
        if (button) button.disabled = false;
    }
}

export async function writeAndRefresh(app, path, body) {
    app.pendingWrites ??= new Map();
    const signature = JSON.stringify([path, body]);
    const key = app.pendingWrites.get(signature) || crypto.randomUUID();
    app.pendingWrites.set(signature, key);
    const result = await request(path, { method: 'POST', body, key });
    await app.refreshData();
    app.pendingWrites.delete(signature);
    return result;
}
