class StorageService {
    static saveHighScore(scoreObj) {
        const scores = StorageService.getHighScores();
        scores.push(scoreObj);
        scores.sort((a, b) => b.score - a.score);
        localStorage.setItem('highScores', JSON.stringify(scores.slice(0, 10)));
    }
    static getHighScores() {
        return JSON.parse(localStorage.getItem('highScores')) || [];
    }
    static clearHighScores() {
        localStorage.removeItem('highScores');
    }
}
window.StorageService = StorageService;