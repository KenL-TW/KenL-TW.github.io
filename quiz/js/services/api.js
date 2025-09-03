class QuizAPI {
    static lastFetch = 0;
    static RATE_LIMIT_MS = 5000;

    static async fetchCategories() {
        const res = await fetch('https://opentdb.com/api_category.php');
        const data = await res.json();
        return data.trivia_categories;
    }

    static async fetchQuestions(amount = 10, category = '', difficulty = '', type = '', retry = 2) {
        // 節流：每5秒最多一次
        const now = Date.now();
        if (now - QuizAPI.lastFetch < QuizAPI.RATE_LIMIT_MS) {
            throw new Error('You are requesting too fast. Please wait a few seconds.');
        }
        QuizAPI.lastFetch = now;

        let url = `https://opentdb.com/api.php?amount=${amount}`;
        if (category) url += `&category=${category}`;
        if (difficulty) url += `&difficulty=${difficulty}`;
        if (type) url += `&type=${type}`;

        try {
            const res = await fetch(url);
            if (!res.ok) throw new Error('Network error');
            const data = await res.json();
            if (!data.results || data.results.length === 0) throw new Error('No questions found');
            return data.results.map(q => ({
                question: QuizAPI.decodeHtml(q.question),
                choices: type === 'boolean' || q.type === 'boolean'
                    ? ['True', 'False']
                    : QuizAPI.shuffle([...q.incorrect_answers, q.correct_answer].map(QuizAPI.decodeHtml)),
                answer: QuizAPI.decodeHtml(q.correct_answer)
            }));
        } catch (err) {
            if (retry > 0) {
                await new Promise(r => setTimeout(r, 1500));
                return QuizAPI.fetchQuestions(amount, category, difficulty, type, retry - 1);
            } else {
                throw new Error('Failed to fetch questions after multiple attempts.');
            }
        }
    }
    static shuffle(arr) {
        return arr.sort(() => Math.random() - 0.5);
    }
    static decodeHtml(html) {
        const txt = document.createElement('textarea');
        txt.innerHTML = html;
        return txt.value;
    }
}
window.QuizAPI = QuizAPI;