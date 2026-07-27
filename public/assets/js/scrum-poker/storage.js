const STORAGE_KEY = "scrum-poker-state-v1";

function isLocalStorageAvailable() {
  try {
    const testKey = "__sp_test__";
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn("Scrum Poker: localStorage unavailable", error);
    return false;
  }
}

export class LocalStorageAdapter {
  constructor(customKey = STORAGE_KEY) {
    this.key = customKey;
    this.available = typeof window !== "undefined" && isLocalStorageAvailable();
  }

  load() {
    if (!this.available) {
      return null;
    }

    try {
      const serialized = window.localStorage.getItem(this.key);
      return serialized ? JSON.parse(serialized) : null;
    } catch (error) {
      console.warn("Scrum Poker: failed to parse stored state", error);
      return null;
    }
  }

  save(state) {
    if (!this.available) {
      return;
    }

    try {
      const serialized = JSON.stringify(state);
      window.localStorage.setItem(this.key, serialized);
    } catch (error) {
      console.warn("Scrum Poker: failed to persist state", error);
    }
  }

  clear() {
    if (!this.available) {
      return;
    }

    window.localStorage.removeItem(this.key);
  }
}
