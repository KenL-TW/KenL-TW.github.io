import { ref, onMounted } from 'vue';

export class ContentStore {
    constructor() {
        this.storageKey = 'contentPlans';
        this.templates = [
            {
                title: '示範文章 1',
                category: '教學',
                keywords: ['範例', '教學'],
                status: '已完成',
                platform: 'Blog',
                publishDate: '2024-01-01',
                summary: '這是一個示範文章。'
            }
        ];
    }

    async save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('儲存失敗:', error);
            return false;
        }
    }

    async load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            console.error('載入失敗:', error);
            return [];
        }
    }

    getTemplates() {
        return this.templates;
    }

    // 新增載入選項的方法
    loadOptions() {
        const defaultOptions = {
            status: [
                { id: 1, name: '構思中' },
                { id: 2, name: '撰寫中' },
                { id: 3, name: '已完成' }
            ],
            category: [
                { id: 1, name: '求職指南' },
                { id: 2, name: '面試準備' },
                { id: 3, name: '工作經驗' },
                { id: 4, name: '生活資訊' }
            ],
            platform: [
                { id: 1, name: 'Blog' },
                { id: 2, name: 'LinkedIn' },
                { id: 3, name: 'Facebook' },
                { id: 4, name: 'Instagram' }
            ]
        };

        try {
            return {
                status: JSON.parse(localStorage.getItem('statusOptions')) || defaultOptions.status,
                category: JSON.parse(localStorage.getItem('categoryOptions')) || defaultOptions.category,
                platform: JSON.parse(localStorage.getItem('platformOptions')) || defaultOptions.platform
            };
        } catch (error) {
            console.error('載入選項失敗:', error);
            return defaultOptions;
        }
    }

    // 新增儲存選項的方法
    saveOptions(options) {
        try {
            Object.entries(options).forEach(([key, value]) => {
                localStorage.setItem(`${key}Options`, JSON.stringify(value));
            });
            return true;
        } catch (error) {
            console.error('儲存選項失敗:', error);
            return false;
        }
    }
}

// 更新設定相關的代碼
const showSettings = ref(false);
const statusOptions = ref([]);
const categoryOptions = ref([]);
const platformOptions = ref([]);

// 初始化選項
const initializeOptions = () => {
    const store = new ContentStore();
    const options = store.loadOptions();
    statusOptions.value = options.status;
    categoryOptions.value = options.category;
    platformOptions.value = options.platform;
};

// 新增選項方法 (加入 id 生成)
const addOption = (type) => {
    const newId = Math.max(...(type.value.map(opt => opt.id)), 0) + 1;
    type.value.push({ id: newId, name: '' });
};

const addStatus = () => addOption(statusOptions);
const addCategory = () => addOption(categoryOptions);
const addPlatform = () => addOption(platformOptions);

// 儲存設定
const saveSettings = async () => {
    try {
        // 過濾空值並確保所有選項都有 id
        const cleanOptions = {
            status: statusOptions.value.filter(item => item.name.trim()),
            category: categoryOptions.value.filter(item => item.name.trim()),
            platform: platformOptions.value.filter(item => item.name.trim())
        };

        const store = new ContentStore();
        await store.saveOptions(cleanOptions);
        
        // 更新本地數據
        statusOptions.value = cleanOptions.status;
        categoryOptions.value = cleanOptions.category;
        platformOptions.value = cleanOptions.platform;

        showSettings.value = false;
        notifications.show('所有設定已儲存', 'success');
    } catch (error) {
        console.error('儲存設定失敗:', error);
        notifications.show('儲存設定失敗', 'error');
    }
};

// 在 setup 函數初始化時調用
onMounted(() => {
    initializeOptions();
});