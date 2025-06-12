import { ref } from 'vue';

export class ContentStore {
    constructor() {
        this.storageKey = 'contentPlans';
        this.defaultTemplates = [
            {
                title: '如何在日本IT業界找到理想工作',
                category: '求職指南',
                keywords: ['日本就業', 'IT業界', '面試技巧'],
                status: '已完成',
                platform: 'Blog',
                publishDate: '2024-01-15',
                summary: '詳細介紹在日本IT業界求職的完整流程，從準備履歷到面試技巧，幫助求職者順利找到理想工作。'
            },
            {
                title: '日本工程師面試常見問題集',
                category: '面試準備',
                keywords: ['技術面試', '日文面試', 'FAQ'],
                status: '撰寫中',
                platform: 'LinkedIn',
                publishDate: '2024-02-01',
                summary: '整理日本IT公司面試最常見的問題，包含技術考核重點和日文交談要點，協助面試者充分準備。'
            },
            {
                title: '在日工作必備：工程師簽證申請指南',
                category: '法律指南',
                keywords: ['工作簽證', '在留資格', '申請程序'],
                status: '構思中',
                platform: 'Website',
                publishDate: '2024-03-01',
                summary: '完整解說工程師赴日工作簽證申請流程，包含所需文件、申請時程及注意事項。'
            }
        ];
    }

    async save(data) {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('Error saving data:', error);
            return false;
        }
    }

    async load() {
        try {
            const data = localStorage.getItem(this.storageKey);
            return data ? JSON.parse(data) : this.defaultTemplates;
        } catch (error) {
            console.error('Error loading data:', error);
            return this.defaultTemplates;
        }
    }

    getTemplates() {
        return this.defaultTemplates;
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

<!-- 修改狀態選擇器 -->
<select id="status" v-model="newPlan.status"
        class="w-full p-2 border border-gray-300 rounded-md">
    <option v-for="option in statusOptions" 
            :key="option.name" 
            :value="option.name">
        {{ option.name }}
    </option>
</select>

<!-- 修改分類為下拉選單 -->
<select id="category" v-model="newPlan.category"
        class="w-full p-2 border border-gray-300 rounded-md">
    <option value="">請選擇分類</option>
    <option v-for="option in categoryOptions" 
            :key="option.name" 
            :value="option.name">
        {{ option.name }}
    </option>
</select>

<!-- 修改平台為下拉選單 -->
<select id="platform" v-model="newPlan.platform"
        class="w-full p-2 border border-gray-300 rounded-md">
    <option value="">請選擇平台</option>
    <option v-for="option in platformOptions" 
            :key="option.name" 
            :value="option.name">
        {{ option.name }}
    </option>
</select>