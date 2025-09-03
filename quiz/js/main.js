function setTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.remove('dark');
        localStorage.setItem('theme', 'light');
    }
}

// 初始化主題
(function () {
    const savedTheme = localStorage.getItem('theme') || 'light';
    setTheme(savedTheme);

    // 動態插入主題切換按鈕
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.style.position = 'fixed';
    btn.style.top = '1rem';
    btn.style.right = '1rem';
    btn.innerText = savedTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    btn.onclick = () => {
        const newTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
        setTheme(newTheme);
        btn.innerText = newTheme === 'dark' ? '☀️ Light' : '🌙 Dark';
    };
    document.body.appendChild(btn);
})();

// PWA Service Worker 註冊
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js');
    });
}

// 載入分類列表
async function loadCategories() {
    const res = await fetch('https://opentdb.com/api_category.php');
    const data = await res.json();
    const select = document.getElementById('categorySelect');
    data.trivia_categories.forEach(cat => {
        const opt = document.createElement('option');
        opt.value = cat.id;
        opt.textContent = cat.name;
        select.appendChild(opt);
    });
}
if (document.getElementById('categorySelect')) loadCategories();

// 儲存選項到 localStorage 並跳轉
const quizOptions = document.getElementById('quizOptions');
if (quizOptions) {
    quizOptions.addEventListener('submit', e => {
        e.preventDefault();
        localStorage.setItem('quiz_category', document.getElementById('categorySelect').value);
        localStorage.setItem('quiz_difficulty', document.getElementById('difficultySelect').value);
        localStorage.setItem('quiz_type', document.getElementById('typeSelect').value);
        localStorage.setItem('quiz_amount', document.getElementById('amountInput').value);
        window.location.href = 'game.html';
    });
}

// 顯示 summary
function renderSummary() {
    const summarySection = document.getElementById('summarySection');
    const summaryContent = document.getElementById('summaryContent');
    const chart = document.getElementById('summaryChart');
    const userSelect = document.getElementById('userSelect');
    let allSummaries = JSON.parse(localStorage.getItem('all_quiz_summaries') || '{}');
    let users = Object.keys(allSummaries);

    if (!summarySection || users.length === 0) {
        summarySection.style.display = 'none';
        return;
    }
    summarySection.style.display = 'block';

    // 填充 user 下拉選單
    userSelect.innerHTML = users.map(u => `<option value="${u}">${u}</option>`).join('');
    let selectedUser = userSelect.value || users[0];

    function updateSummary(user) {
        let summaries = allSummaries[user] || [];
        if (summaries.length === 0) {
            summaryContent.innerHTML = '<i>No records.</i>';
            chart.getContext('2d').clearRect(0,0,chart.width,chart.height);
            return;
        }
        // 統計
        let totalGames = summaries.length;
        let totalQuestions = summaries.reduce((a, s) => a + (s.total || 0), 0);
        let totalCorrect = summaries.reduce((a, s) => a + (s.correct || 0), 0);
        let totalIncorrect = summaries.reduce((a, s) => a + (s.incorrect || 0), 0);
        let avgScore = totalGames ? (summaries.reduce((a, s) => a + (s.score || 0), 0) / totalGames) : 0;

        summaryContent.innerHTML = `
            <div><b>Games Played:</b> ${totalGames}</div>
            <div><b>Total Questions:</b> ${totalQuestions}</div>
            <div><b>Total Correct:</b> ${totalCorrect}</div>
            <div><b>Total Incorrect:</b> ${totalIncorrect}</div>
            <div><b>Average Score:</b> ${avgScore.toFixed(2)}</div>
        `;

        // 畫圖表（長條圖）
        const ctx = chart.getContext('2d');
        ctx.clearRect(0,0,chart.width,chart.height);
        const labels = ['Questions', 'Correct', 'Incorrect'];
        const values = [totalQuestions, totalCorrect, totalIncorrect];
        const colors = ['#007bff', '#28a745', '#dc3545'];
        const max = Math.max(...values, 1);
        const barWidth = 60;
        const gap = 40;
        labels.forEach((label, i) => {
            let x = 40 + i * (barWidth + gap);
            let y = chart.height - 30;
            let h = (values[i] / max) * 80;
            ctx.fillStyle = colors[i];
            ctx.fillRect(x, y - h, barWidth, h);
            ctx.fillStyle = '#222';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(values[i], x + barWidth/2, y - h - 8);
            ctx.fillText(label, x + barWidth/2, y + 18);
        });
    }

    userSelect.onchange = () => updateSummary(userSelect.value);
    updateSummary(userSelect.value || users[0]);
}
renderSummary();