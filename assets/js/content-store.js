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