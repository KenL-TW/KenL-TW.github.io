export class SettingsStore {
    constructor() {
        this.keys = {
            status: 'statusOptions',
            category: 'categoryOptions',
            platform: 'platformOptions'
        };
        // 初始化時立即載入或設置預設值
        this.initializeSettings();
    }

    initializeSettings() {
        const defaultSettings = this.getDefaultSettings();
        for (const [key, storageKey] of Object.entries(this.keys)) {
            if (!localStorage.getItem(storageKey)) {
                localStorage.setItem(storageKey, JSON.stringify(defaultSettings[storageKey]));
            }
        }
    }

    getDefaultSettings() {
        return {
            statusOptions: [
                { name: '構思中', id: '1' },
                { name: '撰寫中', id: '2' },
                { name: '已完成', id: '3' }
            ],
            categoryOptions: [
                { name: '求職指南', id: '1' },
                { name: '面試準備', id: '2' },
                { name: '工作經驗', id: '3' },
                { name: '生活資訊', id: '4' }
            ],
            platformOptions: [
                { name: 'Blog', id: '1' },
                { name: 'LinkedIn', id: '2' },
                { name: 'Facebook', id: '3' },
                { name: 'Instagram', id: '4' }
            ]
        };
    }

    loadSettings() {
        try {
            const settings = {};
            for (const [key, storageKey] of Object.entries(this.keys)) {
                const stored = localStorage.getItem(storageKey);
                settings[key] = stored ? JSON.parse(stored) : this.getDefaultSettings()[storageKey];
            }
            return settings;
        } catch (error) {
            console.error('載入設定失敗:', error);
            return this.getDefaultSettings();
        }
    }

    saveSettings(settings) {
        try {
            for (const [key, storageKey] of Object.entries(this.keys)) {
                if (settings[key]) {
                    localStorage.setItem(storageKey, JSON.stringify(settings[key]));
                }
            }
            return true;
        } catch (error) {
            console.error('儲存設定失敗:', error);
            return false;
        }
    }
}