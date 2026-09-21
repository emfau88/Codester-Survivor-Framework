const sessionValues = new Map();

function browserStorage() {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

export class SafeStorage {
  constructor(storage = browserStorage()) {
    this.storage = storage;
    this.persistent = Boolean(storage);
  }

  getItem(key) {
    if (this.storage) {
      try {
        return this.storage.getItem(key);
      } catch {
        this.storage = null;
        this.persistent = false;
      }
    }
    return sessionValues.get(String(key)) ?? null;
  }

  setItem(key, value) {
    const normalizedKey = String(key);
    const normalizedValue = String(value);
    sessionValues.set(normalizedKey, normalizedValue);
    if (!this.storage) return;
    try {
      this.storage.setItem(normalizedKey, normalizedValue);
    } catch {
      this.storage = null;
      this.persistent = false;
    }
  }

  removeItem(key) {
    const normalizedKey = String(key);
    sessionValues.delete(normalizedKey);
    if (!this.storage) return;
    try {
      this.storage.removeItem(normalizedKey);
    } catch {
      this.storage = null;
      this.persistent = false;
    }
  }
}

export const safeStorage = new SafeStorage();
