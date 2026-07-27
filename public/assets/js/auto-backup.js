export class AutoBackup {
    static async backup(data) {
        const backup = {
            timestamp: new Date().toISOString(),
            data: data
        };

        try {
            const backups = JSON.parse(localStorage.getItem('contentBackups') || '[]');
            backups.push(backup);
            
            // Keep only last 5 backups
            if (backups.length > 5) {
                backups.shift();
            }
            
            localStorage.setItem('contentBackups', JSON.stringify(backups));
            return true;
        } catch (error) {
            console.error('Backup failed:', error);
            return false;
        }
    }

    static async restore(timestamp) {
        try {
            const backups = JSON.parse(localStorage.getItem('contentBackups') || '[]');
            const backup = backups.find(b => b.timestamp === timestamp);
            return backup?.data || null;
        } catch (error) {
            console.error('Restore failed:', error);
            return null;
        }
    }
}