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
        const notification = document.createElement('div');
        const bgColor = this.getTypeClass(type);
        
        notification.className = `${bgColor} px-4 py-2 rounded-lg shadow-lg text-white transform transition-all duration-300`;
        notification.textContent = message;
        
        this.container.appendChild(notification);
        
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    getTypeClass(type) {
        const classes = {
            success: 'bg-green-500',
            error: 'bg-red-500',
            info: 'bg-blue-500',
            warning: 'bg-yellow-500'
        };
        return classes[type] || classes.info;
    }
}