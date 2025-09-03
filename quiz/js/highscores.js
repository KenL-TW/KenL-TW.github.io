const highScoresList = document.getElementById('highScoresList');
const highScores = StorageService.getHighScores();

highScoresList.innerHTML = highScores
    .map(score => `<li class="high-score">${score.name} - ${score.score}</li>`)
    .join('');

document.getElementById('clearScoresBtn')?.addEventListener('click', () => {
    StorageService.clearHighScores();
    highScoresList.innerHTML = '';
});