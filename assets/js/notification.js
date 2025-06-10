export class NotificationSystem {
    constructor() {
        this.createContainer();
    }

    createContainer() {
        this.container = document.createElement('div');
        this.container.className = 'fixed top-4 right-4 z-50 space-y-2';
        document.body.appendChild(this.container);
    }

    show(message, type = 'info') {
        alert(message); // 簡單實現，可以後續優化
    }

    getTypeClass(type) {
        const classes = {
            success: 'bg-green-500 text-white',
            error: 'bg-red-500 text-white',
            info: 'bg-blue-500 text-white',
            warning: 'bg-yellow-500 text-white'
        };
        return classes[type] || classes.info;
    }

    getIcon(type) {
        // Add your icon SVGs here
        return '';
    }
}