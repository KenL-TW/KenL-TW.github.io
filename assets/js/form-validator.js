export class FormValidator {
    static validate(data) {
        const errors = [];

        if (!data.title?.trim()) {
            errors.push('標題不能為空');
        }

        if (!data.category?.trim()) {
            errors.push('分類不能為空');
        }

        if (!data.summary?.trim()) {
            errors.push('摘要不能為空');
        }

        if (data.publishDate && !this.isValidDate(data.publishDate)) {
            errors.push('請輸入有效的發布日期');
        }

        return {
            isValid: errors.length === 0,
            errors
        };
    }

    static isValidDate(dateString) {
        const date = new Date(dateString);
        return date instanceof Date && !isNaN(date);
    }
}