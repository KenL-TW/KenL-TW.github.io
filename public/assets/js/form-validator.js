export class FormValidator {
    static validate(data) {
        const errors = [];
        
        if (!data.title?.trim()) {
            errors.push('標題不能為空');
        }
        if (!data.category?.trim()) {
            errors.push('分類不能為空');
        }
        if (!data.status?.trim()) {
            errors.push('狀態不能為空');
        }
        if (!data.summary?.trim()) {
            errors.push('摘要不能為空');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
}