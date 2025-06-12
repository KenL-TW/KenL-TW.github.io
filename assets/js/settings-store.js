export class SettingsStore {
    constructor() {
        this.prefix = 'settings_';
    }

    async save(key, value) {
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(value));
            return true;
        } catch (error) {
            console.error('儲存設定失敗:', error);
            return false;
        }
    }

    get(key) {
        try {
            const value = localStorage.getItem(this.prefix + key);
            return value ? JSON.parse(value) : null;
        } catch (error) {
            console.error('讀取設定失敗:', error);
            return null;
        }
    }
}