function readStorage(key, fallback, storage = localStorage, parseJson = true) {
    try {
        const rawValue = storage.getItem(key);
        if (rawValue === null) return fallback;
        return parseJson ? JSON.parse(rawValue) : rawValue;
    } catch (e) {
        console.warn(`Unable to read storage key "${key}"`);
        return fallback;
    }
}

function writeStorage(key, value, storage = localStorage, stringify = true) {
    try {
        storage.setItem(key, stringify ? JSON.stringify(value) : value);
        return true;
    } catch (e) {
        console.warn(`Unable to write storage key "${key}"`);
        return false;
    }
}

function removeStorage(key, storage = localStorage) {
    try {
        storage.removeItem(key);
    } catch (e) {
        console.warn(`Unable to remove storage key "${key}"`);
    }
}

export { readStorage, writeStorage, removeStorage };
