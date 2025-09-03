let currentQuestion = {};
let acceptingAnswers = false;
let score = 0;
let questionCounter = 0;
let availableQuestions = [];
const CORRECT_BONUS = 10;
let MAX_QUESTIONS = 10;

const questionElem = document.getElementById('question');
const choices = Array.from(document.getElementsByClassName('choice-text'));
const progressText = document.getElementById('progressText');
const scoreText = document.getElementById('score');
const progressBarFull = document.getElementById('progressBarFull');
const timerText = document.getElementById('timer');
let timer = 10;
let timerInterval;

// 新增：答題時間統計
let answerTimes = [];
let questionStartTime = 0;

async function startGame() {
    questionCounter = 0;
    score = 0;
    answerTimes = [];
    // 讀取選項
    const category = localStorage.getItem('quiz_category') || '';
    const difficulty = localStorage.getItem('quiz_difficulty') || '';
    const amount = localStorage.getItem('quiz_amount') || 10;
    const type = localStorage.getItem('quiz_type') || '';
    MAX_QUESTIONS = amount;
    try {
        availableQuestions = await QuizAPI.fetchQuestions(amount, category, difficulty, type);
        getNewQuestion();
    } catch (err) {
        document.getElementById('game').innerHTML = `<div class="error-message">${err.message}</div>`;
    }
}

function startTimer() {
    timer = 10;
    timerText.innerText = timer;
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        timer--;
        timerText.innerText = timer;
        if (timer <= 0) {
            clearInterval(timerInterval);
            acceptingAnswers = false;
            recordAnswerTime();
            getNewQuestion();
        }
    }, 1000);
}

function recordAnswerTime() {
    if (questionStartTime) {
        answerTimes.push((Date.now() - questionStartTime) / 1000);
    }
}

function getNewQuestion() {
    if (availableQuestions.length === 0 || questionCounter >= MAX_QUESTIONS) {
        // 統計 summary
        const correct = score / CORRECT_BONUS;
        const incorrect = MAX_QUESTIONS - correct;
        const avgTime = answerTimes.length ? answerTimes.reduce((a, b) => a + b, 0) / answerTimes.length : 0;
        const fastest = answerTimes.length ? Math.min(...answerTimes) : 0;
        const slowest = answerTimes.length ? Math.max(...answerTimes) : 0;
        localStorage.setItem('quiz_summary', JSON.stringify({
            score, total: MAX_QUESTIONS, correct, incorrect, avgTime, fastest, slowest, times: answerTimes
        }));
        localStorage.setItem('mostRecentScore', score);
        return window.location.assign('end.html');
    }
    questionCounter++;
    progressText.innerText = `Question ${questionCounter}/${MAX_QUESTIONS}`;
    progressBarFull.style.width = `${(questionCounter / MAX_QUESTIONS) * 100}%`;

    const questionIndex = Math.floor(Math.random() * availableQuestions.length);
    currentQuestion = availableQuestions[questionIndex];
    questionElem.innerText = currentQuestion.question;

    // 題型判斷
    if (currentQuestion.choices.length === 2) {
        // Boolean 題型
        choices.forEach((choice, i) => {
            choice.innerText = currentQuestion.choices[i];
            choice.parentElement.style.display = i < 2 ? '' : 'none';
        });
    } else {
        // Multiple Choice
        choices.forEach((choice, i) => {
            choice.innerText = currentQuestion.choices[i];
            choice.parentElement.style.display = '';
        });
    }

    availableQuestions.splice(questionIndex, 1);
    acceptingAnswers = true;
    questionStartTime = Date.now();
    startTimer();
}

choices.forEach(choice => {
    choice.addEventListener('click', e => {
        if (!acceptingAnswers) return;
        clearInterval(timerInterval);
        acceptingAnswers = false;
        const selectedAnswer = e.target.innerText;
        const classToApply = selectedAnswer === currentQuestion.answer ? 'correct' : 'incorrect';
        if (classToApply === 'correct') incrementScore(CORRECT_BONUS);
        e.target.parentElement.classList.add(classToApply);
        recordAnswerTime();
        setTimeout(() => {
            e.target.parentElement.classList.remove(classToApply);
            getNewQuestion();
        }, 900);
    });
});

function incrementScore(num) {
    score += num;
    scoreText.innerText = score;
}

startGame();