const username = document.getElementById('username');
const saveScoreBtn = document.getElementById('saveScoreBtn');
const finalScore = document.getElementById('finalScore');
const mostRecentScore = localStorage.getItem('mostRecentScore');
finalScore.innerText = mostRecentScore;

username.addEventListener('keyup', () => {
    saveScoreBtn.disabled = !username.value;
});

window.saveHighScore = function(e) {
    e.preventDefault();
    const score = Number(mostRecentScore);
    const summary = JSON.parse(localStorage.getItem('quiz_summary') || '{}');
    const name = username.value.trim() || 'Anonymous';

    // 儲存高分榜
    StorageService.saveHighScore({ score, name });

    // 儲存 summary
    let allSummaries = JSON.parse(localStorage.getItem('all_quiz_summaries') || '{}');
    if (!allSummaries[name]) allSummaries[name] = [];
    allSummaries[name].push(summary);
    localStorage.setItem('all_quiz_summaries', JSON.stringify(allSummaries));

    window.location.assign('highscores.html');
};