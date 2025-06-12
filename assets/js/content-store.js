import { ref } from 'vue';

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
}

// 在 setup 函數中添加
const showSettings = ref(false);
const statusOptions = ref([
    { name: '構思中' },
    { name: '撰寫中' },
    { name: '已完成' }
]);
const categoryOptions = ref([
    { name: '求職指南' },
    { name: '面試準備' },
    { name: '工作經驗' },
    { name: '生活資訊' }
]);
const platformOptions = ref([
    { name: 'Blog' },
    { name: 'LinkedIn' },
    { name: 'Facebook' },
    { name: 'Instagram' }
]);

// 新增選項方法
const addStatus = () => statusOptions.value.push({ name: '' });
const addCategory = () => categoryOptions.value.push({ name: '' });
const addPlatform = () => platformOptions.value.push({ name: '' });

// 移除選項方法
const removeStatus = (index) => statusOptions.value.splice(index, 1);
const removeCategory = (index) => categoryOptions.value.splice(index, 1);
const removePlatform = (index) => platformOptions.value.splice(index, 1);

// 儲存設定
const saveSettings = () => {
    // 過濾空值
    statusOptions.value = statusOptions.value.filter(item => item.name.trim());
    categoryOptions.value = categoryOptions.value.filter(item => item.name.trim());
    platformOptions.value = platformOptions.value.filter(item => item.name.trim());
    
    // 儲存到 localStorage
    localStorage.setItem('statusOptions', JSON.stringify(statusOptions.value));
    localStorage.setItem('categoryOptions', JSON.stringify(categoryOptions.value));
    localStorage.setItem('platformOptions', JSON.stringify(platformOptions.value));
    
    showSettings.value = false;
    notifications.show('設定已儲存', 'success');
};

// 在 return 中添加
return {
    // ...existing returns...
    showSettings,
    statusOptions,
    categoryOptions,
    platformOptions,
    addStatus,
    addCategory,
    addPlatform,
    removeStatus,
    removeCategory,
    removePlatform,
    saveSettings
};