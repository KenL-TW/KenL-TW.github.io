export class SettingsStore {
    constructor() {
        this.keys = {
            status: 'statusOptions',
            category: 'categoryOptions',
            platform: 'platformOptions'
        };
    }

    getDefaultSettings() {
        return {
            statusOptions: [
                { name: '構思中' },
                { name: '撰寫中' },
                { name: '已完成' }
            ],
            categoryOptions: [
                { name: '求職指南' },
                { name: '面試準備' },
                { name: '工作經驗' },
                { name: '生活資訊' }
            ],
            platformOptions: [
                { name: 'Blog' },
                { name: 'LinkedIn' },
                { name: 'Facebook' },
                { name: 'Instagram' }
            ]
        };
    }

    loadSettings() {
        const settings = {};
        for (const [key, storageKey] of Object.entries(this.keys)) {
            const stored = localStorage.getItem(storageKey);
            settings[key] = stored ? JSON.parse(stored) : this.getDefaultSettings()[storageKey];
        }
        return settings;
    }

    saveSettings(settings) {
        for (const [key, storageKey] of Object.entries(this.keys)) {
            if (settings[key]) {
                localStorage.setItem(storageKey, JSON.stringify(settings[key]));
            }
        }
    }
}