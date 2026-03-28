(() => {
  const DEFAULT_CONFIG = {
    CHAT_API_URL: "",
    BRAND_NAME: "Archi",
    SUBTITLE: "簡潔引導助理",
    WELCOME_MESSAGE:
      "你好！我是 Archi 👋\n\n我會用簡單方式引導你快速了解 Ken 的履歷與專案。\n\n你可以直接問：\n- 先推薦我看哪 3 個專案\n- 幫我整理 Ken 的履歷重點\n- 這個專案適合什麼情境",
    THEME: "auto",
    POSITION: "right",
    MAX_CITATIONS: 6,
    SHOW_CITATIONS: false,
    AUTO_MODE_ROUTING: true,
    SHOW_RECOMMENDATION_BLOCK: false,
    SHOW_CARDS: false,
    SHOW_FEEDBACK: false,

    // Repo link building
    GITHUB_REPO_URL: "",
    SOURCE_LINK_MODE: "github", // github | raw | pages
    GITHUB_BRANCH: "main",
    GITHUB_PAGES_BASE: "", // e.g. "https://kenl-tw.github.io" (optional)

    // KB manifest (for agent context)
    KB_INDEX_URL: "kb/index.json", // Path or URL to KB manifest

    // Request
    REQUEST_TIMEOUT_MS: 30000,
    DEMO_MODE: false,

    // Session / agent
    SESSION_STORAGE_KEY: "dtz_session_id",
    DEFAULT_MODE: "GUIDE", // GUIDE | CHAT | STRICT
    ENABLE_MODE_TOGGLE: false,

    // Security optional
    CLIENT_TOKEN: "",

    TOP_ACTIONS: [],
    QUICK_CHIPS: [],
  };

  const userConfig =
    window.ChatbotConfig && typeof window.ChatbotConfig === "object"
      ? window.ChatbotConfig
      : {};
  const CFG = deepMerge(structuredClone(DEFAULT_CONFIG), userConfig);

  function deepMerge(target, source) {
    for (const k of Object.keys(source || {})) {
      const sv = source[k];
      if (sv && typeof sv === "object" && !Array.isArray(sv)) {
        target[k] = deepMerge(target[k] || {}, sv);
      } else {
        target[k] = sv;
      }
    }
    return target;
  }

  function clamp(n, a, b) {
    return Math.max(a, Math.min(b, n));
  }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function isDarkPreferred() {
    return (
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    );
  }
  function resolveTheme() {
    if (CFG.THEME === "light") return "light";
    if (CFG.THEME === "dark") return "dark";
    return isDarkPreferred() ? "dark" : "light";
  }
  const THEME = resolveTheme();

  // -------------------------
  // Session ID (Agent memory)
  // -------------------------
  function genSessionId() {
    // simple stable id (no PII)
    const rand = crypto?.getRandomValues
      ? Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, "0"))
          .join("")
      : Math.random().toString(16).slice(2) + Date.now().toString(16);
    return `s_${rand}`;
  }

  function getSessionId() {
    try {
      const k = CFG.SESSION_STORAGE_KEY || "dtz_session_id";
      let sid = localStorage.getItem(k);
      if (!sid) {
        sid = genSessionId();
        localStorage.setItem(k, sid);
      }
      return sid;
    } catch {
      // fallback in-memory
      if (!window.__DTZ_SID) window.__DTZ_SID = genSessionId();
      return window.__DTZ_SID;
    }
  }

  // -------------------------
  // KB Manifest (for agent context)
  // -------------------------
  let kbIndexCache = null;
  let kbLoadingPromise = null;

  async function loadKBIndex() {
    if (kbIndexCache) return kbIndexCache;
    if (kbLoadingPromise) return kbLoadingPromise;
    if (!CFG.KB_INDEX_URL) return null;

    kbLoadingPromise = (async () => {
      try {
        const resp = await fetch(CFG.KB_INDEX_URL);
        const data = await resp.json();
        if (data && data.chunks && Array.isArray(data.chunks)) {
          kbIndexCache = data;
          return data;
        }
      } catch {
        console.warn("Failed to load KB index:", CFG.KB_INDEX_URL);
      }
      return null;
    })();
    
    return kbLoadingPromise;
  }
  
  // Extract tags from query for smart KB filtering
  function extractRelevantTags(query) {
    const q = String(query || "").toLowerCase();
    const tags = [];
    
    // Project related
    if (q.match(/專案|project|作品|案例|portfolio/)) tags.push('projects');
    
    // Tech/Skills related
    if (q.match(/技能|skill|能力|技術|tech/)) tags.push('skills');
    
    // About/Resume related  
    if (q.match(/關於|about|ken|個人|簡介|intro/)) tags.push('about');
    if (q.match(/履歷|resume|經驗|experience|work/)) tags.push('resume');
    
    // Specific tech
    if (q.match(/ai|人工智慧|gpt|machine learning/)) tags.push('ai');
    if (q.match(/aws|serverless|lambda|cloud/)) tags.push('aws');
    if (q.match(/架構|architecture|系統設計|system design/)) tags.push('architecture');
    if (q.match(/sns|sqs|fan-?out|dlq|dead letter|事件驅動|event-driven/)) tags.push('event-driven', 'aws');
    if (q.match(/vpc|子網|subnet|route.?table|路由表|nat.?gateway|bastion|internet.?gateway|igw|security.?group|安全群組|網路隔離|private.?subnet|public.?subnet|s3.?endpoint|waf|alb|load.?balance|負載均衡/)) tags.push('vpc', 'networking', 'aws');
    if (q.match(/networking|網路|防火牆|firewall|ddos|sqli|xss|攻擊|安全|security/)) tags.push('security', 'networking');
    if (q.match(/專案管理|pm|gantt|scrum|agile/)) tags.push('pm');
    
    // Default to overview if no specific tags
    if (tags.length === 0) tags.push('guide', 'overview');
    
    return tags;
  }
  
  // Lazy load relevant KB chunks based on query
  async function loadRelevantKBChunks(query) {
    const kb = await loadKBIndex();
    if (!kb || !kb.chunks) return [];
    
    const relevantTags = extractRelevantTags(query);
    const q = String(query || "").toLowerCase();
    const queryTerms = q
      .split(/[^\p{L}\p{N}]+/u)
      .map(t => t.trim())
      .filter(t => t.length >= 2);
    
    // Score and filter chunks
    const scoredChunks = kb.chunks.map(chunk => {
      let score = 0;
      
      // Tag matching (high priority)
      if (chunk.tags && Array.isArray(chunk.tags)) {
        chunk.tags.forEach(tag => {
          if (relevantTags.includes(tag)) score += 3;
        });
      }
      
      // Text matching in title (medium priority)
      if (chunk.title && chunk.title.toLowerCase().includes(q)) {
        score += 2;
      }

      // Term-level matching in title/text (for multi-word and mixed language queries)
      if (queryTerms.length > 0) {
        const titleLower = String(chunk.title || '').toLowerCase();
        const textLower = String(chunk.text || '').toLowerCase();
        queryTerms.forEach(term => {
          if (titleLower.includes(term)) score += 2;
          if (textLower.includes(term)) score += 1;
        });
      }
      
      // Text matching in content (low priority)
      if (chunk.text && chunk.text.toLowerCase().includes(q)) {
        score += 1;
      }
      
      return { ...chunk, relevance_score: score };
    })
    .filter(chunk => chunk.relevance_score > 0)
    .sort((a, b) => b.relevance_score - a.relevance_score)
    .slice(0, 15); // Limit to top 15 most relevant chunks
    
    return scoredChunks;
  }

  function getKBSummary() {
    if (!kbIndexCache) return null;
    // Return paths and titles for agent context
    const paths = kbIndexCache.chunks
      .slice(0, 20)
      .map(c => ({ path: c.path, title: c.title }));
    return { version: kbIndexCache.version, chunks_count: kbIndexCache.chunks.length, sample: paths };
  }

  // -------------------------
  // Styles
  // -------------------------
  const css = `
  :root{ --dtz:2147483000; }
  .dt-chatbot, .dt-chatbot * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
  .dt-chatbot { position: fixed; right: 18px; top: auto; bottom: 18px; transform: none; z-index: var(--dtz); }

  .dt-chatbot[data-theme="light"]{
    --bg: #0b1220; --bg2:#111c33;
    --card:#ffffff; --soft:#f8fafc;
    --line: rgba(15,23,42,.12);
    --text: #0f172a; --muted: rgba(15,23,42,.65);
    --shadow: 0 10px 30px rgba(2,6,23,.16);
    --shadow2: 0 8px 20px rgba(0,0,0,.18);
    --chip: rgba(248,250,252,.92);
    --chipHover: rgba(241,245,249,.96);
    --btn: #0b1220;
    --btnText: #ffffff;
    --srcBg: rgba(255,255,255,.92);
    --card2: rgba(255,255,255,.96);
  }
  .dt-chatbot[data-theme="dark"]{
    --bg: #070b14; --bg2:#0b1630;
    --card:#0b1220; --soft:#070b14;
    --line: rgba(255,255,255,.10);
    --text: rgba(255,255,255,.92); --muted: rgba(255,255,255,.62);
    --shadow: 0 10px 30px rgba(0,0,0,.45);
    --shadow2: 0 8px 20px rgba(0,0,0,.45);
    --chip: rgba(255,255,255,.06);
    --chipHover: rgba(255,255,255,.10);
    --btn: #ffffff;
    --btnText: #0b1220;
    --srcBg: rgba(255,255,255,.06);
    --card2: rgba(255,255,255,.04);
  }

  .dt-fab{
    width: 50px; height: 50px; border-radius: 999px;
    border: 1px solid rgba(255,255,255,.12);
    background: var(--bg);
    color: #fff;
    cursor: pointer;
    display: grid;
    place-items: center;
    box-shadow: var(--shadow2);
    transition: transform .15s ease, filter .15s ease;
  }
  .dt-fab:hover{ filter: brightness(1.08); }
  .dt-fab:active{ transform: scale(.98); }

  .dt-panel{
    position: fixed;
    right: 18px;
    top: auto;
    bottom: 78px;
    width: min(420px, calc(100vw - 36px));
    height: min(860px, calc(100vh - 80px));
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: var(--card);
    box-shadow: var(--shadow);
    display: none;
    flex-direction: column;
    transform: translate(8px, 0);
    opacity: 0;
    transition: transform .18s ease, opacity .18s ease;
  }
  .dt-panel.open{
    display:flex;
    transform: translate(0, 0);
    opacity: 1;
  }

  .dt-header{
    padding: 12px;
    background: var(--bg);
    color: #fff;
    display:flex; align-items:center; justify-content: space-between; gap:12px;
  }
  .dt-title{ display:flex; flex-direction:column; gap:2px; min-width:0; }
  .dt-title strong{ font-size:14px; font-weight:900; letter-spacing:.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dt-title span{ font-size:12px; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }

  .dt-actions{ display:flex; gap:8px; align-items:center; }
  .dt-iconbtn{
    width:32px; height:32px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,.16);
    background: rgba(255,255,255,.06);
    color:#fff;
    cursor:pointer;
    display:grid; place-items:center;
  }

  .dt-mode{
    display:flex; align-items:center; gap:6px;
    padding: 3px 8px;
    border-radius: 999px;
    background: rgba(255,255,255,.10);
    border: 1px solid rgba(255,255,255,.14);
    font-size: 11px;
    font-weight: 900;
    user-select:none;
  }
  .dt-mode select{
    background: transparent;
    border: 0;
    color: #fff;
    outline: 0;
    font-weight: 900;
    cursor: pointer;
  }
  .dt-mode select option{
    color: var(--text);
    background: var(--card);
  }

  .dt-topActions{
    padding: 6px 12px;
    border-bottom: 1px solid var(--line);
    background: var(--card);
    display:flex; gap: 8px;
  }
  .dt-chips{
    padding: 8px 12px 10px;
    display:flex;
    flex-wrap: wrap;
    gap: 8px;
    border-bottom: 1px solid var(--line);
    background: var(--card);
  }
  .dt-actBtn{
    flex: 1 1 0;
    min-width: 0;
    border: 1px solid var(--line);
    background: var(--chip);
    border-radius: 12px;
    padding: 8px;
    cursor:pointer;
    display:flex; gap:8px; align-items:center;
    transition: transform .12s ease, background .12s ease;
    user-select:none;
  }
  .dt-actBtn:hover{ background: var(--chipHover); transform: translateY(-1px); }
  .dt-chip{
    border: 1px solid var(--line);
    background: var(--chip);
    color: var(--text);
    border-radius: 999px;
    padding: 6px 12px;
    font-size: 12px;
    cursor:pointer;
    transition: transform .12s ease, background .12s ease;
    user-select:none;
  }
  .dt-chip:hover{ background: var(--chipHover); transform: translateY(-1px); }
  .dt-actIcon{
    width: 26px; height: 26px;
    border-radius: 10px;
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "rgba(255,255,255,.06)" : "#fff"};
    display:grid; place-items:center;
    font-size: 13px;
    flex: 0 0 auto;
  }
  .dt-actText{ min-width:0; display:flex; flex-direction:column; gap:2px; }
  .dt-actText strong{ font-size:11px; font-weight: 900; color: var(--text); }
  .dt-actText span{ font-size:10px; color: var(--muted); white-space: nowrap; overflow:hidden; text-overflow:ellipsis; }

  .dt-body{
    flex: 1 1 auto;
    padding: 12px;
    overflow:auto;
    background: var(--soft);
    position: relative;
  }

  .dt-msg{ display:flex; gap:14px; margin: 18px 0; align-items:flex-end; }
  .dt-avatar{
    width: 36px; height: 36px; border-radius: 10px;
    display:grid; place-items:center;
    font-size: 13px; font-weight: 900;
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "rgba(255,255,255,.06)" : "#fff"};
    color: ${THEME === "dark" ? "rgba(255,255,255,.92)" : "#0b1220"};
    flex: 0 0 auto;
    margin-top: 2px;
  }
  .dt-bubble{
    max-width: 78%;
    padding: 12px 14px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "rgba(255,255,255,.04)" : "#fff"};
    color: var(--text);
    line-height: 1.6;
    font-size: 13.5px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  .dt-user{ flex-direction: row-reverse; }
  .dt-user .dt-bubble{
    background: linear-gradient(135deg, #0072CE 0%, #0056b3 100%);
    color: #fff;
    border-color: rgba(255,255,255,.12);
    box-shadow: 0 6px 20px rgba(2,6,23,0.12);
  }

  .dt-assistant .dt-bubble{
    background: var(--card2);
    border: 1px solid var(--line);
    box-shadow: 0 2px 6px rgba(0,0,0,0.04);
  }

  .dt-typing{ display:inline-flex; align-items:center; gap: 6px; }
  .dt-dots{ display:inline-flex; gap: 4px; margin-left: 2px; }
  .dt-dot{
    width: 6px; height: 6px; border-radius: 999px;
    background: ${THEME === "dark" ? "rgba(255,255,255,.75)" : "rgba(15,23,42,.55)"};
    animation: dtb 1.1s infinite ease-in-out;
  }
  .dt-dot:nth-child(2){ animation-delay: .15s; }
  .dt-dot:nth-child(3){ animation-delay: .30s; }
  @keyframes dtb { 0%, 80%, 100% { transform: translateY(0); opacity:.55; } 40% { transform: translateY(-3px); opacity:1; } }

  .dt-meta{ margin-top: 6px; margin-bottom: 4px; font-size: 11px; color: var(--muted); font-weight: 600; }
  .dt-sources{
    margin-top: 6px;
    padding-top: 6px;
    border-top: 1px dashed ${THEME === "dark" ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.16)"};
    display:grid;
    gap: 4px;
  }
  .dt-src{
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
    font-size: 11px;
    padding: 5px 7px;
    border: 1px solid var(--line);
    border-radius: 8px;
    background: var(--srcBg);
    color: ${THEME === "dark" ? "rgba(255,255,255,.86)" : "rgba(15,23,42,.85)"};
    white-space: nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    text-decoration: none;
    display:block;
  }

  /* Agent cards */
  .dt-cardWrap{
    margin-top: 6px;
    display: grid;
    gap: 4px;
  }
  .dt-card{
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "rgba(255,255,255,.04)" : "#fff"};
    border-radius: 8px;
    padding: 6px 8px;
    cursor: pointer;
    transition: transform .12s ease, background .12s ease;
  }
  .dt-card:hover{
    transform: translateY(-1px);
    background: ${THEME === "dark" ? "rgba(255,255,255,.06)" : "rgba(248,250,252,.9)"};
  }
  .dt-cardTitle{
    font-weight: 900;
    font-size: 10.5px;
    color: var(--text);
    margin-bottom: 2px;
    line-height: 1.3;
  }
  .dt-cardSub{
    font-size: 10px;
    color: var(--muted);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .dt-cardMeta{
    margin-top: 4px;
    display:flex;
    gap:4px;
    align-items:center;
    justify-content: space-between;
    font-size: 9px;
    color: var(--muted);
  }
  .dt-pill{
    font-size: 9px;
    padding: 1px 5px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--chip);
    color: var(--muted);
    white-space: nowrap;
  }

  /* Feedback buttons */
  .dt-feedback{
    margin-top: 5px;
    padding-top: 4px;
    border-top: 1px dashed var(--line);
    display: flex;
    gap: 3px;
    align-items: center;
    justify-content: flex-end;
  }
  .dt-fb-btn{
    border: 1px solid var(--line);
    background: var(--chip);
    color: var(--text);
    border-radius: 6px;
    padding: 3px 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all .12s ease;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 32px;
  }
  .dt-fb-btn:hover{
    background: var(--chipHover);
    transform: scale(1.05);
  }
  .dt-fb-btn.active{
    background: var(--btn);
    color: var(--btnText);
    border-color: var(--btn);
    font-weight: 600;
  }
  .dt-fb-btn:disabled{
    opacity: 0.5;
    cursor: not-allowed;
  }

  /* Loading skeleton */
  .dt-skeleton{
    background: linear-gradient(90deg, var(--chip) 25%, var(--chipHover) 50%, var(--chip) 75%);
    background-size: 200% 100%;
    animation: dt-shimmer 1.5s infinite;
    border-radius: 8px;
    height: 12px;
    margin: 4px 0;
  }
  @keyframes dt-shimmer{
    0%{ background-position: 200% 0; }
    100%{ background-position: -200% 0; }
  }


  .dt-footer{
    padding: 10px;
    background: var(--card);
    border-top: 1px solid var(--line);
  }
  .dt-inputWrap{
    display:flex; gap: 8px; align-items:flex-end;
    border: 1px solid var(--line);
    border-radius: 14px;
    padding: 8px;
    background: ${THEME === "dark" ? "rgba(255,255,255,.06)" : "#fff"};
  }
  .dt-textarea{
    width: 100%;
    min-height: 40px;
    max-height: 180px;
    resize: none;
    border: 0;
    outline: 0;
    padding: 6px 6px;
    font-size: 13.5px;
    color: var(--text);
    background: transparent;
    line-height: 1.35;
  }
  .dt-send{
    height: 38px;
    padding: 0 12px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "#fff" : "#0b1220"};
    color: ${THEME === "dark" ? "#0b1220" : "#fff"};
    cursor:pointer;
    font-weight: 900;
    font-size: 13px;
    flex: 0 0 auto;
  }
  .dt-send:disabled{ opacity:.65; cursor:not-allowed; }

  .dt-jump{
    position: sticky;
    bottom: 10px;
    margin-left: auto;
    width: fit-content;
    display:none;
    background: var(--bg);
    color:#fff;
    border: 1px solid rgba(255,255,255,.14);
    border-radius: 999px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 900;
    cursor:pointer;
    box-shadow: var(--shadow2);
  }
  .dt-jump.show{ display:inline-flex; align-items:center; gap:8px; }

  @media (max-width: 520px){
    .dt-panel{
      right: 10px; top: auto; bottom: 58px;
      transform: translateX(8px);
      width: calc(100vw - 40px);
      height: calc(100vh - 200px);
    }
    .dt-panel.open{
      transform: translateX(0);
    }
    .dt-chatbot{ right: 10px; top: auto; bottom: 10px; transform: none; }
  }

  @media (max-width: 900px){
    .dt-fab{ width: 40px; height: 40px; font-size: 14px; }
    .dt-panel{
      width: min(340px, calc(100vw - 32px));
      height: min(680px, calc(100vh - 150px));
      border-radius: 12px;
    }
    .dt-header{ padding: 10px; }
    .dt-title strong{ font-size: 13px; }
    .dt-title span{ font-size: 11px; }
    .dt-body{ padding: 10px; }
    .dt-msg{ margin: 14px 0; gap: 10px; }
    .dt-avatar{ width: 30px; height: 30px; font-size: 11px; }
    .dt-bubble{ font-size: 12.5px; padding: 10px 12px; }
    .dt-footer{ padding: 8px; }
    .dt-textarea{ font-size: 12px; }
    .dt-send{ min-width: 56px; height: 34px; font-size: 12px; }
  }
  `;

  const styleId = "dt-chatbot-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  // -------------------------
  // DOM
  // -------------------------
  const root = document.createElement("div");
  root.className = "dt-chatbot";
  root.setAttribute("data-theme", THEME);

  const modeToggleHtml = CFG.ENABLE_MODE_TOGGLE
    ? `
      <div class="dt-mode" title="對話模式">
        <span>Mode</span>
        <select data-slot="mode">
          <option value="GUIDE">GUIDE</option>
          <option value="CHAT">CHAT</option>
          <option value="STRICT">STRICT</option>
        </select>
      </div>
    `
    : "";

  const recommendationBlockHtml = CFG.SHOW_RECOMMENDATION_BLOCK
    ? `
      <div class="dt-topActions" data-slot="top-actions"></div>
      <div class="dt-chips" data-slot="chips"></div>
    `
    : "";

  root.innerHTML = `
    <button class="dt-fab" type="button" aria-label="Open Chat">💬</button>

    <div class="dt-panel" role="dialog" aria-label="Chatbot Panel">
      <div class="dt-header">
        <div class="dt-title">
          <strong>${escapeHtml(CFG.BRAND_NAME)}</strong>
          <span>${escapeHtml(CFG.SUBTITLE)}</span>
        </div>
        <div class="dt-actions">
          ${modeToggleHtml}
          <button class="dt-iconbtn" type="button" data-action="clear" title="Clear">🧹</button>
          <button class="dt-iconbtn" type="button" data-action="close" title="Close">✕</button>
        </div>
      </div>

      ${recommendationBlockHtml}

      <div class="dt-body" data-slot="body">
        <button class="dt-jump" type="button" data-action="jump">⤓ 回到最新</button>
      </div>

      <div class="dt-footer">
        <div class="dt-inputWrap">
          <textarea class="dt-textarea" data-slot="input" rows="1" placeholder="輸入問題…（Enter 送出 / Shift+Enter 換行）"></textarea>
          <button class="dt-send" type="button" data-action="send">Send</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const fab = root.querySelector(".dt-fab");
  const panel = root.querySelector(".dt-panel");
  const body = root.querySelector('[data-slot="body"]');
  const topActionsSlot = root.querySelector('[data-slot="top-actions"]');
  const chipsSlot = root.querySelector('[data-slot="chips"]');
  const input = root.querySelector('[data-slot="input"]');
  const sendBtn = root.querySelector('[data-action="send"]');
  const jumpBtn = root.querySelector('[data-action="jump"]');
  const modeSelect = root.querySelector('[data-slot="mode"]');

  let isOpen = false;
  let isBusy = false;
  let lastScrollTop = 0;
  let typingEl = null;

  // state
  const SID = getSessionId();
  let currentMode = (CFG.DEFAULT_MODE || "GUIDE").toUpperCase();
  if (modeSelect) modeSelect.value = currentMode;

  // -------------------------
  // Render helpers
  // -------------------------
  function renderTopActions() {
    if (!topActionsSlot) return;
    topActionsSlot.innerHTML = "";
    const list = Array.isArray(CFG.TOP_ACTIONS)
      ? CFG.TOP_ACTIONS.slice(0, 3)
      : [];
    list.forEach((item, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dt-actBtn";
      btn.innerHTML = `
        <div class="dt-actIcon">${escapeHtml(item.icon ?? "✨")}</div>
        <div class="dt-actText">
          <strong>${escapeHtml(item.title ?? `Action ${idx + 1}`)}</strong>
          <span>${escapeHtml(item.desc ?? "")}</span>
        </div>
      `;
      btn.addEventListener("click", () => {
        const payload = item.payload || { type: "text", message: item.message || item.title };
        trackChatbotEvent('top_action_clicked', {
          action_index: idx,
          action_title: item.title || `Action ${idx + 1}`,
          payload_type: payload.type || 'text'
        });
        handleActionPayload(payload);
      });
      topActionsSlot.appendChild(btn);
    });
  }

  function renderChips() {
    if (!chipsSlot) return;
    chipsSlot.innerHTML = "";
    const list = Array.isArray(CFG.QUICK_CHIPS)
      ? CFG.QUICK_CHIPS.slice(0, 6)
      : [];
    list.forEach((text, idx) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "dt-chip";
      chip.textContent = String(text || "");
      chip.addEventListener("click", () => {
        trackChatbotEvent('quick_chip_clicked', {
          chip_index: idx,
          chip_text: String(text || "").substring(0, 100)
        });
        sendText(text);
      });
      chipsSlot.appendChild(chip);
    });
  }

  renderTopActions();
  function openPanel() {
    isOpen = true;
    panel.classList.add("open");
    setTimeout(() => input.focus(), 0);
    updateJumpVisibility();
  }
  function closePanel() {
    isOpen = false;
    panel.classList.remove("open");
  }
  function togglePanel() {
    isOpen ? closePanel() : openPanel();
  }
  fab.addEventListener("click", () => {
    trackChatbotEvent('fab_button_clicked', {});
    togglePanel();
  });

  function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px";
  }
  
  // Input debounce for instant suggestions
  let inputDebounceTimer = null;
  let suggestionCache = new Map();
  
  async function showInstantSuggestions(query) {
    if (!query || query.length < 3) {
      return; // Don't show suggestions for short queries
    }
    
    // Check cache first
    if (suggestionCache.has(query)) {
      const cached = suggestionCache.get(query);
      if (cached && cached.length > 0) {
        renderDynamicChips(cached);
      }
      return;
    }
    
    try {
      // Load relevant KB chunks for suggestions
      const relevantChunks = await loadRelevantKBChunks(query);
      
      if (relevantChunks && relevantChunks.length > 0) {
        const suggestions = relevantChunks
          .slice(0, 4)
          .map(chunk => chunk.title || chunk.path)
          .filter(Boolean);
        
        // Cache suggestions
        suggestionCache.set(query, suggestions);
        
        if (suggestions.length > 0) {
          renderDynamicChips(suggestions);
          trackChatbotEvent('instant_suggestions_shown', {
            query_length: query.length,
            suggestion_count: suggestions.length
          });
        }
      }
    } catch (e) {
      console.warn('Failed to load instant suggestions:', e);
    }
  }
  
  input.addEventListener("input", (e) => {
    autoResize();
    
    // Debounced instant suggestions
    clearTimeout(inputDebounceTimer);
    const query = input.value.trim();
    
    if (query.length >= 3) {
      inputDebounceTimer = setTimeout(() => {
        showInstantSuggestions(query);
      }, 400); // 400ms debounce
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = input.value.trim();
      if (q) {
        trackChatbotEvent('message_sent_by_enter', {
          message_length: q.length
        });
      }
      input.value = "";
      autoResize();
      sendText(q);
    }
  });

  if (modeSelect) {
    modeSelect.addEventListener("change", () => {
      const newMode = (modeSelect.value || "GUIDE").toUpperCase();
      currentMode = newMode;
      trackChatbotEvent('mode_changed', {
        new_mode: newMode,
        previous_mode: currentMode
      });
      addMessage("assistant", `已切換模式：${currentMode}`, [], null);
    });
  }

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.getAttribute("data-action");
    if (!act) return;

    if (act === "close") {
      trackChatbotEvent('close_button_clicked', {});
      closePanel();
    }
    if (act === "clear") {
      trackChatbotEvent('clear_button_clicked', {});
      seed();
    }
    if (act === "send") {
      const q = input.value.trim();
      if (q) {
        trackChatbotEvent('message_sent_by_button', {
          message_length: q.length
        });
      }
      input.value = "";
      autoResize();
      sendText(q);
    }
    if (act === "jump") {
      trackChatbotEvent('jump_to_latest_clicked', {});
      jumpToLatest();
    }
  });

  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  // -------------------------
  // Source link building (V2)
  // -------------------------
  function normalizeRepoUrl(u) {
    return String(u || "").replace(/\/+$/, "");
  }

  function toRawUrl(repoUrl, path) {
    // https://raw.githubusercontent.com/<owner>/<repo>/<branch>/<path>
    try {
      const u = normalizeRepoUrl(repoUrl);
      // repoUrl: https://github.com/Owner/Repo
      const m = u.match(/github\.com\/([^\/]+)\/([^\/]+)/i);
      if (!m) return null;
      const owner = m[1];
      const repo = m[2];
      const branch = CFG.GITHUB_BRANCH || "main";
      const safePath = String(path || "").replace(/^\/+/, "");
      return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${safePath}`;
    } catch {
      return null;
    }
  }

  function toGithubBlobUrl(repoUrl, path) {
    try {
      const u = normalizeRepoUrl(repoUrl);
      const branch = CFG.GITHUB_BRANCH || "main";
      const safePath = String(path || "").replace(/^\/+/, "");
      return `${u}/blob/${branch}/${safePath}`;
    } catch {
      return null;
    }
  }

  function toPagesUrl(path) {
    const base = (CFG.GITHUB_PAGES_BASE || "").replace(/\/+$/, "");
    if (!base) return null;
    const safePath = String(path || "").replace(/^\/+/, "");
    return `${base}/${safePath}`;
  }

  function buildCitationLink(c) {
    if (!c || !c.path) return null;
    if (!CFG.GITHUB_REPO_URL) return null;

    const mode = String(CFG.SOURCE_LINK_MODE || "github").toLowerCase();
    if (mode === "raw") return toRawUrl(CFG.GITHUB_REPO_URL, c.path);
    if (mode === "pages") return toPagesUrl(c.path);
    return toGithubBlobUrl(CFG.GITHUB_REPO_URL, c.path);
  }

  // -------------------------
  // Conversation tracking
  // -------------------------
  let conversationHistory = [];
  let messageIdCounter = 0;
  
  // Initialize conversation logger if available
  let conversationLogger = null;
  if (typeof window.ConversationLogger === 'function') {
    conversationLogger = new window.ConversationLogger();
  }

  // -------------------------
  // GA Event Tracking (Chatbot Analytics)
  // -------------------------
  function trackChatbotEvent(eventName, parameters = {}) {
    if (typeof window.trackEvent === 'function') {
      window.trackEvent(`chatbot_${eventName}`, {
        ...parameters,
        session_id: SID,
        current_mode: currentMode,
        timestamp: new Date().toISOString()
      });
    }
  }

  // -------------------------
  // Messages (with cards)
  // -------------------------
  function isProjectRelatedText(text) {
    const t = String(text || "").toLowerCase();
    return (
      t.includes("專案") ||
      t.includes("project") ||
      t.includes("作品") ||
      t.includes("案例") ||
      t.includes("case study") ||
      t.includes("portfolio")
    );
  }

  function inferModeFromUserText(text) {
    const t = String(text || "").toLowerCase();

    const strictHints = [
      "履歷", "resume", "經歷", "工作經驗", "學歷", "證照", "pmp", "aws", "toeic",
      "專案", "project", "作品", "案例", "portfolio",
      "只根據", "不要猜", "查核", "驗證", "百分百", "100%"
    ];
    if (strictHints.some((k) => t.includes(k))) return "STRICT";

    const guideHints = ["導覽", "推薦", "先看", "從哪開始", "新手", "快速了解"];
    if (guideHints.some((k) => t.includes(k))) return "GUIDE";

    return "CHAT";
  }

  function cleanAssistantAnswer(text) {
    const raw = String(text || "");
    return raw
      .replace(/\n{0,2}(citations?|sources?)\s*:[\s\S]*$/i, "")
      .replace(/[（(]\s*kb\/[\s\S]*?[）)]/gi, "")
      .replace(/\bkb\/[\w\-./]+#[\w\-#]+/gi, "")
      .replace(/[（(]\s*#?[\w\-]+#\d+\s*[）)]/gi, "")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }

  function selectProjectCards(text, cards) {
    if (!cards || !Array.isArray(cards.project_cards)) return null;
    if (!cards.project_cards.length) return null;
    if (!isProjectRelatedText(text)) return null;
    return { project_cards: cards.project_cards };
  }

  function addMessage(role, text, citations, cards) {
    const row = document.createElement("div");
    row.className = "dt-msg " + (role === "user" ? "dt-user" : "dt-assistant");

    const avatar = document.createElement("div");
    avatar.className = "dt-avatar";
    avatar.textContent = role === "user" ? "U" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "dt-bubble";
    bubble.textContent = text || "";
    
    // Generate unique message ID
    const messageId = `msg-${Date.now()}-${messageIdCounter++}`;
    row.setAttribute('data-message-id', messageId);

    // Track message view
    trackChatbotEvent('message_added', {
      role: role,
      message_id: messageId,
      text_length: (text || "").length,
      has_citations: Array.isArray(citations) && citations.length > 0,
      citation_count: Array.isArray(citations) ? citations.length : 0,
      has_cards: cards !== null && cards !== undefined
    });
    
    // Add to conversation history
    conversationHistory.push({
      id: messageId,
      role: role,
      content: text,
      citations: citations,
      timestamp: new Date().toISOString()
    });

    // Agent cards (V2)
    if (role !== "user" && cards && CFG.SHOW_CARDS) {
      const cardsToRender = selectProjectCards(text, cards);
      const cardWrap = renderCards(cardsToRender);
      if (cardWrap) bubble.appendChild(cardWrap);
    }

    // citations intentionally hidden for simpler UX
    
    // Feedback buttons (only for assistant messages)
    if (role !== "user" && CFG.SHOW_FEEDBACK) {
      const feedbackDiv = document.createElement("div");
      feedbackDiv.className = "dt-feedback";
      
      const helpfulBtn = document.createElement("button");
      helpfulBtn.type = "button";
      helpfulBtn.className = "dt-fb-btn";
      helpfulBtn.innerHTML = '👍';
      helpfulBtn.title = '有幫助';
      helpfulBtn.setAttribute('data-feedback', 'helpful');
      helpfulBtn.setAttribute('data-message-id', messageId);
      
      const notHelpfulBtn = document.createElement("button");
      notHelpfulBtn.type = "button";
      notHelpfulBtn.className = "dt-fb-btn";
      notHelpfulBtn.innerHTML = '👎';
      notHelpfulBtn.title = '需改進';
      notHelpfulBtn.setAttribute('data-feedback', 'not-helpful');
      notHelpfulBtn.setAttribute('data-message-id', messageId);
      
      // Feedback click handler
      const handleFeedback = (e) => {
        const btn = e.currentTarget;
        const feedback = btn.getAttribute('data-feedback');
        const msgId = btn.getAttribute('data-message-id');
        
        // Disable both buttons
        helpfulBtn.disabled = true;
        notHelpfulBtn.disabled = true;
        
        // Highlight selected
        btn.classList.add('active');
        
        // Track feedback
        trackChatbotEvent('response_feedback', {
          message_id: msgId,
          feedback: feedback,
          helpful: feedback === 'helpful'
        });
        
        // Log to conversation logger if available
        if (conversationLogger) {
          const msgIdx = conversationHistory.findIndex(m => m.id === msgId);
          if (msgIdx >= 0) {
            conversationLogger.addFeedback(msgIdx, {
              helpful: feedback === 'helpful',
              rating: feedback === 'helpful' ? 5 : 2,
              text: '',
              timestamp: new Date().toISOString()
            });
          }
        }
        
        // Show checkmark briefly
        btn.innerHTML = '✓';
      };
      
      helpfulBtn.addEventListener('click', handleFeedback);
      notHelpfulBtn.addEventListener('click', handleFeedback);
      
      feedbackDiv.appendChild(helpfulBtn);
      feedbackDiv.appendChild(notHelpfulBtn);
      bubble.appendChild(feedbackDiv);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    body.appendChild(row);
    body.appendChild(jumpBtn);

    const nearBottom =
      body.scrollHeight - body.scrollTop - body.clientHeight < 140;
    if (nearBottom) scrollBottom();
    updateJumpVisibility();
    
    return messageId;
  }

  function renderCards(cards) {
    const groups = [];

    const identity = Array.isArray(cards.identity_cards)
      ? cards.identity_cards
      : [];
    const projects = Array.isArray(cards.project_cards)
      ? cards.project_cards
      : [];
    const hits = Array.isArray(cards.search_hit_cards)
      ? cards.search_hit_cards
      : [];

    if (projects.length)
      groups.push({ title: "精選專案", items: projects, kind: "project" });
    if (hits.length)
      groups.push({ title: "相關內容", items: hits, kind: "hit" });
    if (identity.length)
      groups.push({ title: "關於 Ken", items: identity, kind: "identity" });

    if (!groups.length) return null;

    const wrap = document.createElement("div");
    wrap.className = "dt-cardWrap";

    groups.forEach((g) => {
      const head = document.createElement("div");
      head.className = "dt-meta";
      head.textContent = g.title;
      wrap.appendChild(head);

      // 項目卡片最多顯示3張，其他類型最多6張
      const maxCards = g.kind === "project" ? 3 : 6;
      g.items.slice(0, maxCards).forEach((it) => {
        const card = document.createElement("div");
        card.className = "dt-card";

        const title = it.title || it.path || "Untitled";
        const sub =
          it.one_liner || it.excerpt || it.desc || it.summary || "";
        const path = it.path || "";
        const chunkId = it.chunk_id || "";

        card.innerHTML = `
          <div class="dt-cardTitle">${escapeHtml(title)}</div>
          <div class="dt-cardSub">${escapeHtml(sub)}</div>
          <div class="dt-cardMeta">
            <span class="dt-pill">${escapeHtml(g.kind.toUpperCase())}</span>
            <span title="${escapeHtml(path)}">${escapeHtml(
          path ? path.split("/").slice(-2).join("/") : ""
        )}</span>
          </div>
        `;

        // click behavior: ask agent to summarize / open this doc
        card.addEventListener("click", () => {
          if (!path) return;
          trackChatbotEvent('card_clicked', {
            card_title: title,
            card_kind: g.kind,
            card_path: path,
            card_chunk_id: chunkId
          });
          // We send a directive that the backend can interpret via search/get_doc (tool pipeline)
          sendText(`請摘要並導覽：${path}${chunkId ? " #" + chunkId : ""}`);
        });

        wrap.appendChild(card);
      });
    });

    return wrap;
  }

  function showTyping() {
    if (typingEl) return;
    typingEl = document.createElement("div");
    typingEl.className = "dt-msg dt-assistant";
    typingEl.innerHTML = `
      <div class="dt-avatar">AI</div>
      <div class="dt-bubble">
        <span class="dt-typing">思考中<span class="dt-dots">
          <span class="dt-dot"></span><span class="dt-dot"></span><span class="dt-dot"></span>
        </span></span>
      </div>
    `;
    body.appendChild(typingEl);
    body.appendChild(jumpBtn);
    scrollBottom();
    updateJumpVisibility();
  }
  function hideTyping() {
    if (!typingEl) return;
    typingEl.remove();
    typingEl = null;
    updateJumpVisibility();
  }

  function setBusy(v) {
    isBusy = v;
    sendBtn.disabled = v;
    input.disabled = v;
    sendBtn.textContent = v ? "…" : "Send";
  }

  function updateJumpVisibility() {
    const distance = body.scrollHeight - body.scrollTop - body.clientHeight;
    jumpBtn.classList.toggle("show", distance > 220);
  }
  function jumpToLatest() {
    body.scrollTop = body.scrollHeight;
    updateJumpVisibility();
  }
  body.addEventListener(
    "scroll",
    () => {
      const st = body.scrollTop;
      if (Math.abs(st - lastScrollTop) > 20) {
        lastScrollTop = st;
        updateJumpVisibility();
      }
    },
    { passive: true }
  );

  // -------------------------
  // API
  // -------------------------
  function sleep(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  async function sendToApi(bodyJson) {
    const controller = new AbortController();
    const tid = setTimeout(
      () => controller.abort(),
      clamp(CFG.REQUEST_TIMEOUT_MS || 30000, 5000, 120000)
    );

    try {
      const headers = { "Content-Type": "application/json" };
      if (CFG.CLIENT_TOKEN) headers["x-client-token"] = CFG.CLIENT_TOKEN;

      // Debug (safe)
      try {
        console.debug("DTZ-AGENT: request", {
          url: CFG.CHAT_API_URL,
          body: bodyJson,
        });
      } catch {}

      const res = await fetch(CFG.CHAT_API_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(bodyJson),
        signal: controller.signal,
      });

      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const t = ct.includes("application/json")
          ? JSON.stringify(await res.json())
          : await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }
      return ct.includes("application/json")
        ? await res.json()
        : { answer: await res.text() };
    } finally {
      clearTimeout(tid);
    }
  }
  


  // Optional local demo if API missing
  async function demoAnswer(message) {
    await sleep(280);
    return {
      answer:
        "（Demo mode）我現在在模擬導覽。\n\n你可以問：推薦 3 個專案 / 介紹 Ken / 從哪裡開始看。",
      citations: [],
      mode: "GUIDE",
      suggestions: ["介紹 Ken", "推薦 3 個專案", "我該從哪裡開始看？"],
      cards: {
        project_cards: [
          {
            title: "AI Agent / RAG 專案",
            path: "kb/docs/projects-detail.md",
            chunk_id: "projects-detail#agent",
            one_liner: "KB 驅動的導覽型 Agent，支援 citations 與 minimal memory。",
          },
        ],
        search_hit_cards: [],
        identity_cards: [],
      },
    };
  }
  


  async function sendPayload(payload) {
    if (!payload || isBusy) return;

    const userText =
      payload.type === "action"
        ? `/${payload.action_id}`
        : String(payload.message || "");
    
    // Track user message
    trackChatbotEvent('user_message_sent', {
      message_type: payload.type,
      message_length: userText.length,
      action_id: payload.action_id || null
    });
    
    addMessage("user", userText, [], null);

    setBusy(true);
    showTyping();
    
    const requestStartTime = Date.now();
    const useDemo = CFG.DEMO_MODE || !CFG.CHAT_API_URL;

    try {
      // Load relevant KB chunks for this specific query (lazy loading)
      const relevantChunks = !useDemo ? await loadRelevantKBChunks(userText) : null;
      
      const resolvedMode = CFG.AUTO_MODE_ROUTING
        ? inferModeFromUserText(userText)
        : currentMode;
      currentMode = resolvedMode;

      let data;
      if (useDemo) {
        data = await demoAnswer(userText);
      } else {
        const bodyJson = {
          session_id: SID,
          message: userText,
          mode: resolvedMode,
          response_preferences: {
            simple: true,
            hide_citations: true,
            concise: true,
            guided: true,
            tone: "friendly-guide"
          }
        };
        
        if (relevantChunks && relevantChunks.length > 0) {
          bodyJson.relevant_kb_chunks = relevantChunks.map(chunk => ({
            path: chunk.path,
            chunk_id: chunk.chunk_id,
            title: chunk.title,
            relevance_score: chunk.relevance_score,
            tags: chunk.tags
          }));
        }
        
        const kbSummary = getKBSummary();
        if (kbSummary) {
          bodyJson.kb_context = kbSummary;
        }
        
        if (conversationHistory.length > 0) {
          bodyJson.conversation_history = conversationHistory
            .slice(-10)
            .map(h => ({
              role: h.role,
              content: h.content,
              timestamp: h.timestamp
            }));
        }
        
        data = await sendToApi(bodyJson);
      }

      const responseTime = Date.now() - requestStartTime;
      const answer = cleanAssistantAnswer(data.answer || "") || "Repo/KB 中沒有提供足夠資訊。";
      const citations = Array.isArray(data.citations) ? data.citations : [];
      const cards = data.cards || null;
      const suggestions = Array.isArray(data.suggestions) ? data.suggestions : [];

      trackChatbotEvent('api_response_received', {
        response_time_ms: responseTime,
        answer_length: answer.length,
        citation_count: citations.length,
        has_cards: cards !== null,
        suggestion_count: suggestions.length,
        is_demo: useDemo
      });
      
      if (conversationLogger) {
        const turn = Math.floor(conversationHistory.length / 2);
        conversationLogger.logMessage(turn, userText, answer, citations, 'lazy_load_kb_match');
      }

      if (data.mode && modeSelect) {
        const m = String(data.mode).toUpperCase();
        if (["GUIDE", "CHAT", "STRICT"].includes(m)) {
          currentMode = m;
          modeSelect.value = m;
        }
      }

      hideTyping();
      addMessage("assistant", answer, citations, cards);

      if (suggestions.length) {
        renderDynamicChips(suggestions);
      }
    } catch (e) {
      const responseTime = Date.now() - requestStartTime;
      
      trackChatbotEvent('api_error', {
        error_message: String(e?.message || e),
        response_time_ms: responseTime
      });
      
      hideTyping();
      addMessage(
        "assistant",
        "系統暫時無法取得回應，請稍後再試。\n\n" + String(e?.message || e),
        [],
        null
      );
    } finally {
      setBusy(false);
      const nearBottom =
        body.scrollHeight - body.scrollTop - body.clientHeight < 160;
      if (nearBottom) scrollBottom();
      updateJumpVisibility();
    }
  }

  function renderDynamicChips(suggestions) {
    if (!chipsSlot) return;
    // Replace QUICK_CHIPS area with live suggestions (agent-like)
    chipsSlot.innerHTML = "";
    suggestions.slice(0, 6).forEach((text) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "dt-chip";
      chip.textContent = text;
      chip.addEventListener("click", () => {
        trackChatbotEvent('suggestion_chip_clicked', {
          suggestion_text: text.substring(0, 100),
          suggestion_length: text.length
        });
        sendText(text);
      });
      chipsSlot.appendChild(chip);
    });
  }

  function handleActionPayload(payload) {
    if (!payload) return;
    if (payload.type === "action") {
      trackChatbotEvent('action_payload_triggered', {
        action_id: payload.action_id,
        payload_type: 'action',
        args_count: Object.keys(payload.args || {}).length
      });
      sendPayload({
        type: "action",
        action_id: payload.action_id,
        args: payload.args || {},
      });
      return;
    }
    trackChatbotEvent('quick_action_message_sent', {
      message_source: 'top_action',
      message_preview: (payload.message || "").substring(0, 50)
    });
    sendText(payload.message || "");
  }

  function sendText(message) {
    const q = (message || "").trim();
    if (!q) return;
    sendPayload({ type: "text", message: q });
  }

  function seed() {
    trackChatbotEvent('session_reset', {
      timestamp: new Date().toISOString(),
      previous_message_count: conversationHistory.length
    });
    
    // Clear conversation history
    conversationHistory = [];
    messageIdCounter = 0;
    
    // Clear suggestion cache
    suggestionCache.clear();
    
    // Reset conversation logger if available
    if (conversationLogger && typeof conversationLogger.reset === 'function') {
      conversationLogger.reset();
    }
    
    body.innerHTML = "";
    body.appendChild(jumpBtn);
    addMessage("assistant", CFG.WELCOME_MESSAGE, [], null);

    updateJumpVisibility();

    // initial chips
    renderChips();
  }
  
  seed();
  
  // Load KB index asynchronously
  loadKBIndex();
  
  // Track initial session open
  trackChatbotEvent('widget_initialized', {
    config_theme: CFG.THEME,
    config_position: CFG.POSITION,
    demo_mode: CFG.DEMO_MODE,
    mode_toggle_enabled: CFG.ENABLE_MODE_TOGGLE,
    kb_index_enabled: !!CFG.KB_INDEX_URL
  });

  // expose API
  window.DTZ_CHATBOT = {
    open: () => {
      trackChatbotEvent('panel_opened', {});
      return openPanel();
    },
    close: () => {
      trackChatbotEvent('panel_closed', {});
      return closePanel();
    },
    send: sendText,
    sendText,
    seed: () => {
      trackChatbotEvent('seed_called', {});
      return seed();
    },
    clear: () => {
      trackChatbotEvent('clear_called', {});
      return seed();
    },
    config: CFG,
    session_id: SID,
    setMode: (m) => {
      const mm = String(m || "").toUpperCase();
      if (["GUIDE", "CHAT", "STRICT"].includes(mm)) {
        currentMode = mm;
        if (modeSelect) modeSelect.value = mm;
        trackChatbotEvent('mode_set', {
          new_mode: mm
        });
      }
    },
    getMode: () => currentMode,
  };
})();
