(() => {
  const DEFAULT_CONFIG = {
    CHAT_API_URL: "",
    BRAND_NAME: "Digitools Assistant",
    SUBTITLE: "Repo-based Answers Only",
    WELCOME_MESSAGE:
      "你好！我是一個 KB-only 助手。\n\n你可以直接輸入問題，或使用上方三個快捷按鈕快速開始。",
    THEME: "auto",
    POSITION: "right",
    MAX_CITATIONS: 4,
    GITHUB_REPO_URL: "",
    TOP_ACTIONS: [
      { icon: "🧭", title: "快速開始", desc: "3步驟上手", payload: { type: "text", message: "快速開始：請用最短步驟介紹這個系統如何使用。" } },
      { icon: "📚", title: "FAQ", desc: "常見問題", payload: { type: "text", message: "請列出最常見的 FAQ，並用條列簡短回答。" } },
      { icon: "🧾", title: "技術分享", desc: "專案/技術", payload: { type: "text", message: "請針對有興趣的專案或技術進行發問。" } }
    ],
    QUICK_CHIPS: [
      "請用一句話說明產品定位",
      "有哪些限制？",
      "請提供使用流程",
      "Repo 的資料會多久更新？",
      "給我一個常見使用案例"
    ],
    REQUEST_TIMEOUT_MS: 30000,
    DEMO_MODE: false
  };

  const userConfig = (window.ChatbotConfig && typeof window.ChatbotConfig === "object")
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

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function escapeHtml(s) {
    return String(s)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function isDarkPreferred() {
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function resolveTheme() {
    if (CFG.THEME === "light") return "light";
    if (CFG.THEME === "dark") return "dark";
    return isDarkPreferred() ? "dark" : "light";
  }
  const THEME = resolveTheme();

  const css = `
  :root{ --dtz:2147483000; }
  .dt-chatbot, .dt-chatbot * { box-sizing: border-box; font-family: ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial; }
  .dt-chatbot { position: fixed; right: 18px; bottom: 18px; z-index: var(--dtz); }

  .dt-chatbot[data-theme="light"]{
    --bg: #0b1220; --bg2:#111c33;
    --card:#ffffff; --soft:#f8fafc;
    --line: rgba(15,23,42,.12);
    --text: #0f172a; --muted: rgba(15,23,42,.65);
    --shadow: 0 18px 60px rgba(2,6,23,.22);
    --shadow2: 0 10px 30px rgba(0,0,0,.25);
    --chip: rgba(248,250,252,.92);
    --chipHover: rgba(241,245,249,.96);
    --btn: #0b1220;
    --btnText: #ffffff;
    --srcBg: rgba(255,255,255,.92);
  }
  .dt-chatbot[data-theme="dark"]{
    --bg: #070b14; --bg2:#0b1630;
    --card:#0b1220; --soft:#070b14;
    --line: rgba(255,255,255,.10);
    --text: rgba(255,255,255,.92); --muted: rgba(255,255,255,.62);
    --shadow: 0 18px 60px rgba(0,0,0,.55);
    --shadow2: 0 10px 30px rgba(0,0,0,.55);
    --chip: rgba(255,255,255,.06);
    --chipHover: rgba(255,255,255,.10);
    --btn: #ffffff;
    --btnText: #0b1220;
    --srcBg: rgba(255,255,255,.06);
  }

  .dt-fab{
    width: 54px; height: 54px; border-radius: 999px;
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
    bottom: 84px;
    /* 減少寬度一點、增加高度一點以提升閱讀空間 */
    width: min(400px, calc(100vw - 36px));
    height: min(760px, calc(100vh - 120px));
    border-radius: 18px;
    overflow: hidden;
    border: 1px solid var(--line);
    background: var(--card);
    box-shadow: var(--shadow);
    display: none;
    flex-direction: column;
    transform: translateX(8px);
    opacity: 0;
    transition: transform .18s ease, opacity .18s ease;
  }
  .dt-panel.open{
    display:flex;
    transform: translateX(0);
    opacity: 1;
  }

  .dt-header{
    padding: 14px;
    background: linear-gradient(135deg, var(--bg), var(--bg2));
    color: #fff;
    display:flex; align-items:center; justify-content: space-between; gap:12px;
  }
  .dt-title{ display:flex; flex-direction:column; gap:2px; min-width:0; }
  .dt-title strong{ font-size:14px; font-weight:900; letter-spacing:.2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dt-title span{ font-size:12px; opacity:.85; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
  .dt-actions{ display:flex; gap:8px; flex: 0 0 auto; }
  .dt-iconbtn{
    width:32px; height:32px; border-radius: 12px;
    border: 1px solid rgba(255,255,255,.16);
    background: rgba(255,255,255,.06);
    color:#fff;
    cursor:pointer;
    display:grid; place-items:center;
  }

  .dt-topActions{
    padding: 10px 14px 10px;
    border-bottom: 1px solid var(--line);
    background: var(--card);
    display:flex; gap: 10px;
  }
  .dt-actBtn{
    flex: 1 1 0;
    min-width: 0;
    border: 1px solid var(--line);
    background: var(--chip);
    border-radius: 14px;
    padding: 10px;
    cursor:pointer;
    display:flex; gap:10px; align-items:center;
    transition: transform .12s ease, background .12s ease;
    user-select:none;
  }
  .dt-actBtn:hover{ background: var(--chipHover); transform: translateY(-1px); }
  .dt-actIcon{
    width: 32px; height: 32px;
    border-radius: 12px;
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "rgba(255,255,255,.06)" : "#fff"};
    display:grid; place-items:center;
    font-size: 16px;
    flex: 0 0 auto;
  }
  .dt-actText{ min-width:0; display:flex; flex-direction:column; gap:2px; }
  .dt-actText strong{ font-size:12px; font-weight: 900; color: var(--text); }
  .dt-actText span{ font-size:11px; color: var(--muted); white-space: nowrap; overflow:hidden; text-overflow:ellipsis; }

  .dt-body{
    flex: 1 1 auto;
    padding: 14px;
    overflow:auto;
    background: var(--soft);
    position: relative;
  }

  /* Message row: increase spacing and support left/right alignment */
  .dt-msg{ display:flex; gap:14px; margin: 18px 0; align-items:flex-end; }

  /* Avatar */
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

  /* Bubble: more padding and slightly narrower max-width for readability */
  .dt-bubble{
    max-width: 75%;
    padding: 14px 16px;
    border-radius: 16px;
    border: 1px solid var(--line);
    background: ${THEME === "dark" ? "rgba(255,255,255,.06)" : "#fff"};
    color: var(--text);
    line-height: 1.7;
    font-size: 14px;
    white-space: pre-wrap;
    word-break: break-word;
  }

  /* User messages: show on right side (reverse row) */
  .dt-user{ flex-direction: row-reverse; }
  .dt-user .dt-avatar{ margin-top: 4px; }
  .dt-user .dt-bubble{
    background: linear-gradient(135deg, #0072CE 0%, #0056b3 100%);
    color: #fff;
    border-color: rgba(255,255,255,.12);
    box-shadow: 0 6px 20px rgba(2,6,23,0.12);
  }

  /* Assistant (AI) messages: left side with subtle card style */
  .dt-assistant .dt-bubble{
    background: ${THEME === "dark" ? "rgba(255,255,255,.03)" : "#fff"};
    color: var(--text);
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

  .dt-meta{ margin-top: 10px; font-size: 12px; color: var(--muted); }
  .dt-sources{
    margin-top: 8px;
    padding-top: 8px;
    border-top: 1px dashed ${THEME === "dark" ? "rgba(255,255,255,.14)" : "rgba(15,23,42,.16)"};
    display:grid;
    gap: 6px;
  }
  .dt-src{
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono","Courier New", monospace;
    font-size: 12px;
    padding: 7px 9px;
    border: 1px solid var(--line);
    border-radius: 10px;
    background: var(--srcBg);
    color: ${THEME === "dark" ? "rgba(255,255,255,.86)" : "rgba(15,23,42,.85)"};
    white-space: nowrap;
    overflow:hidden;
    text-overflow:ellipsis;
    text-decoration: none;
    display:block;
  }

  .dt-quickWrap{ background: var(--card); border-top: 1px solid var(--line); }
  .dt-quickHeader{
    padding: 8px 14px;
    display:flex; align-items:center; justify-content:space-between;
    gap: 10px;
    color: var(--muted);
    font-size: 12px;
  }
  .dt-quickToggle{
    border: 1px solid var(--line);
    background: var(--chip);
    border-radius: 999px;
    padding: 5px 10px;
    cursor:pointer;
    font-size: 12px;
    font-weight: 900;
    color: var(--muted);
    user-select:none;
  }
  .dt-quick{ padding: 0 14px 10px; display:none; }
  .dt-quick.open{ display:block; }
  .dt-chips{ display:flex; gap:8px; overflow:auto; padding-bottom: 2px; scrollbar-width: thin; }
  .dt-chip{
    flex: 0 0 auto;
    border: 1px solid var(--line);
    background: var(--chip);
    color: var(--muted);
    padding: 7px 10px;
    border-radius: 999px;
    font-size: 12px;
    font-weight: 900;
    cursor:pointer;
    user-select:none;
    white-space: nowrap;
  }
  .dt-chip:hover{ background: var(--chipHover); }

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

  .dt-smallHint{
    margin-top: 8px;
    display:flex; justify-content: space-between; gap:10px;
    font-size: 12px;
    color: var(--muted);
  }
  .dt-pill{
    font-size: 11px;
    padding: 3px 8px;
    border-radius: 999px;
    border: 1px solid var(--line);
    background: var(--chip);
    color: var(--muted);
    white-space: nowrap;
  }

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
      right: 12px; bottom: 78px;
      width: calc(100vw - 24px);
      height: calc(100vh - 130px);
    }
    .dt-chatbot{ right: 12px; bottom: 12px; }
  }
  `;

  const styleId = "dt-chatbot-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = css;
    document.head.appendChild(style);
  }

  const root = document.createElement("div");
  root.className = "dt-chatbot";
  root.setAttribute("data-theme", THEME);

  root.innerHTML = `
    <button class="dt-fab" type="button" aria-label="Open Chat">💬</button>

    <div class="dt-panel" role="dialog" aria-label="Chatbot Panel">
      <div class="dt-header">
        <div class="dt-title">
          <strong>${escapeHtml(CFG.BRAND_NAME)}</strong>
          <span>${escapeHtml(CFG.SUBTITLE)}</span>
        </div>
        <div class="dt-actions">
          <button class="dt-iconbtn" type="button" data-action="clear" title="Clear">🧹</button>
          <button class="dt-iconbtn" type="button" data-action="close" title="Close">✕</button>
        </div>
      </div>

      <div class="dt-topActions" data-slot="top-actions"></div>

      <div class="dt-body" data-slot="body">
        <button class="dt-jump" type="button" data-action="jump">⤓ 回到最新</button>
      </div>

      <div class="dt-quickWrap">
        <div class="dt-quickHeader">
          <span>建議提問（可選）</span>
          <button class="dt-quickToggle" type="button" data-action="toggle-quick">展開</button>
        </div>
        <div class="dt-quick" data-slot="quick">
          <div class="dt-chips" data-slot="chips"></div>
        </div>
      </div>

      <div class="dt-footer">
        <div class="dt-inputWrap">
          <textarea class="dt-textarea" data-slot="input" rows="1" placeholder="輸入問題…（Enter 送出 / Shift+Enter 換行）"></textarea>
          <button class="dt-send" type="button" data-action="send">Send</button>
        </div>
        <div class="dt-smallHint">
          <span class="dt-pill">UI A · Side Panel</span>
          <span class="dt-pill">Buttons ≤ 3 · No memory</span>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(root);

  const fab = root.querySelector(".dt-fab");
  const panel = root.querySelector(".dt-panel");
  const body = root.querySelector('[data-slot="body"]');
  const topActionsSlot = root.querySelector('[data-slot="top-actions"]');
  const quick = root.querySelector('[data-slot="quick"]');
  const chipsSlot = root.querySelector('[data-slot="chips"]');
  const input = root.querySelector('[data-slot="input"]');
  const sendBtn = root.querySelector('[data-action="send"]');
  const jumpBtn = root.querySelector('[data-action="jump"]');
  const toggleQuickBtn = root.querySelector('[data-action="toggle-quick"]');

  let isOpen = false;
  let isBusy = false;
  let quickOpen = false;
  let lastScrollTop = 0;
  let typingEl = null;

  function renderTopActions() {
    topActionsSlot.innerHTML = "";
    const list = Array.isArray(CFG.TOP_ACTIONS) ? CFG.TOP_ACTIONS.slice(0, 3) : [];
    list.forEach((item, idx) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "dt-actBtn";
      btn.innerHTML = `
        <div class="dt-actIcon">${escapeHtml(item.icon ?? "✨")}</div>
        <div class="dt-actText">
          <strong>${escapeHtml(item.title ?? `Action ${idx+1}`)}</strong>
          <span>${escapeHtml(item.desc ?? "")}</span>
        </div>
      `;
      btn.addEventListener("click", () => handleActionPayload(item.payload || { type: "text", message: item.message || item.title }));
      topActionsSlot.appendChild(btn);
    });
  }

  function renderChips() {
    chipsSlot.innerHTML = "";
    const list = Array.isArray(CFG.QUICK_CHIPS) ? CFG.QUICK_CHIPS : [];
    list.forEach((text) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "dt-chip";
      chip.textContent = text;
      chip.addEventListener("click", () => sendText(text));
      chipsSlot.appendChild(chip);
    });
  }

  renderTopActions();
  renderChips();

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
  function togglePanel() { isOpen ? closePanel() : openPanel(); }
  fab.addEventListener("click", togglePanel);

  function toggleQuick() {
    quickOpen = !quickOpen;
    quick.classList.toggle("open", quickOpen);
    toggleQuickBtn.textContent = quickOpen ? "收合" : "展開";
  }

  function autoResize() {
    input.style.height = "auto";
    input.style.height = Math.min(input.scrollHeight, 180) + "px";
  }
  input.addEventListener("input", autoResize);

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      const q = input.value.trim();
      input.value = "";
      autoResize();
      sendText(q);
    }
  });

  root.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof HTMLElement)) return;
    const act = t.getAttribute("data-action");
    if (!act) return;

    if (act === "close") closePanel();
    if (act === "clear") seed();
    if (act === "send") {
      const q = input.value.trim();
      input.value = "";
      autoResize();
      sendText(q);
    }
    if (act === "toggle-quick") toggleQuick();
    if (act === "jump") jumpToLatest();
  });

  function scrollBottom() { body.scrollTop = body.scrollHeight; }

  function buildCitationLink(c) {
    if (!CFG.GITHUB_REPO_URL) return null;
    if (!c || !c.path) return null;
    const safePath = String(c.path).replace(/^\/+/, "");
    return `${CFG.GITHUB_REPO_URL.replace(/\/+$/, "")}/blob/main/${safePath}`;
  }

  function addMessage(role, text, citations) {
    const row = document.createElement("div");
    row.className = "dt-msg " + (role === "user" ? "dt-user" : "dt-assistant");

    const avatar = document.createElement("div");
    avatar.className = "dt-avatar";
    avatar.textContent = role === "user" ? "U" : "AI";

    const bubble = document.createElement("div");
    bubble.className = "dt-bubble";
    bubble.textContent = text || "";

    if (role !== "user" && Array.isArray(citations) && citations.length > 0) {
      const meta = document.createElement("div");
      meta.className = "dt-meta";
      meta.textContent = "Sources (repo):";

      const sources = document.createElement("div");
      sources.className = "dt-sources";

      citations.slice(0, clamp(CFG.MAX_CITATIONS || 4, 1, 8)).forEach((c) => {
        const a = document.createElement("a");
        a.className = "dt-src";
        const label = `${c.path || ""} · ${c.chunk_id || ""}`.trim();
        a.textContent = label || "source";
        const url = buildCitationLink(c);
        if (url) {
          a.href = url; a.target = "_blank"; a.rel = "noreferrer"; a.title = url;
        } else {
          a.href = "javascript:void(0)";
          a.title = label;
        }
        sources.appendChild(a);
      });

      bubble.appendChild(meta);
      bubble.appendChild(sources);
    }

    row.appendChild(avatar);
    row.appendChild(bubble);
    body.appendChild(row);
    body.appendChild(jumpBtn);

    const nearBottom = (body.scrollHeight - body.scrollTop - body.clientHeight) < 140;
    if (nearBottom) scrollBottom();
    updateJumpVisibility();
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
  body.addEventListener("scroll", () => {
    const st = body.scrollTop;
    if (Math.abs(st - lastScrollTop) > 20) {
      lastScrollTop = st;
      updateJumpVisibility();
    }
  }, { passive: true });

  function handleActionPayload(payload) {
    if (!payload) return;
    if (payload.type === "action") {
      sendPayload({ type: "action", action_id: payload.action_id, args: payload.args || {} });
      return;
    }
    sendText(payload.message || "");
  }

  async function sendToApi(bodyJson) {
    const controller = new AbortController();
    const tid = setTimeout(() => controller.abort(), clamp(CFG.REQUEST_TIMEOUT_MS || 30000, 5000, 120000));
    try {
      // Build headers: include content-type and optional auth (API key / bearer token / extra headers)
      const headers = { "Content-Type": "application/json" };
      if (CFG.API_KEY) headers[CFG.API_KEY_HEADER || "x-api-key"] = CFG.API_KEY;
      if (CFG.BEARER_TOKEN) headers["Authorization"] = `Bearer ${CFG.BEARER_TOKEN}`;
      if (CFG.ADDITIONAL_HEADERS && typeof CFG.ADDITIONAL_HEADERS === "object") {
        for (const [k, v] of Object.entries(CFG.ADDITIONAL_HEADERS)) {
          headers[k] = v;
        }
      }

      // Debug: log request details to help diagnose network / CORS errors
      try {
        console.debug("DT-CHAT: sending request", { url: CFG.CHAT_API_URL, headers, body: bodyJson });
      } catch (e) {
        // ignore logging errors
      }

      let res;
      try {
        res = await fetch(CFG.CHAT_API_URL, {
          method: "POST",
          headers,
          body: JSON.stringify(bodyJson),
          signal: controller.signal
        });
      } catch (fetchError) {
        console.error("DT-CHAT: fetch failed", fetchError);
        throw fetchError;
      }
      const ct = res.headers.get("content-type") || "";
      if (!res.ok) {
        const t = ct.includes("application/json") ? JSON.stringify(await res.json()) : await res.text();
        throw new Error(`HTTP ${res.status}: ${t}`);
      }
      return ct.includes("application/json") ? await res.json() : { answer: await res.text() };
    } finally {
      clearTimeout(tid);
    }
  }

  async function demoAnswer(message) {
    // Attempt to read local kb index to pick two random entries for a realistic RAG demo
    try {
      const res = await fetch("kb/index.json", { cache: "no-store" });
      if (res && res.ok) {
        const jd = await res.json();
        const chunks = Array.isArray(jd.chunks) ? jd.chunks.slice() : [];

        // Prefer chunks that look like product entries (path/title/text contains 商品/product/電商)
        const productCandidates = chunks.filter(c => /product|商品|電商|item/i.test((c.path || "") + " " + (c.title || "") + " " + (c.text || "")));
        const pool = productCandidates.length ? productCandidates.slice() : chunks;

        const picks = [];
        while (picks.length < 2 && pool.length) {
          const idx = Math.floor(Math.random() * pool.length);
          picks.push(pool.splice(idx, 1)[0]);
        }

        if (picks.length) {
          const answerParts = picks.map((p, i) => {
            const title = p.title || p.path || `Product ${i + 1}`;
            const body = (p.text || "(no description available)").trim();
            return `商品 ${i + 1}：${title}\n\n${body}`;
          });

          return {
            answer: answerParts.join("\n\n---\n\n"),
            citations: picks.map(p => ({ path: p.path || "", chunk_id: p.chunk_id || p.path || "" }))
          };
        }
      }
    } catch (e) {
      // ignore and fallback to generic demo
    }

    const long =
      "（Demo mode）我已依照 KB-only 的規則整理：\n\n" +
      "1) 回答會以『文件式』方式呈現，避免碎片化。\n" +
      "2) 若 KB 沒有內容，會明確回覆不足，不會猜。\n\n" +
      "建議下一步：\n" +
      "• 直接提供你要查的功能/頁面/錯誤訊息\n" +
      "• 或點上方三個按鈕（快速開始 / FAQ / API）\n\n" +
      "你的輸入： " + message;

    return {
      answer: long,
      citations: [
        { path: "kb/docs/overview.md", chunk_id: "overview#0001" },
        { path: "kb/docs/faq.md", chunk_id: "faq#0001" }
      ]
    };
  }

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  async function sendPayload(payload) {
    if (!payload || isBusy) return;

    if (payload.type === "action") {
      addMessage("user", `/${payload.action_id}`, []);
    } else {
      addMessage("user", String(payload.message || ""), []);
    }

    setBusy(true);
    showTyping();

    try {
      let data;
      const useDemo = CFG.DEMO_MODE || !CFG.CHAT_API_URL;
      if (useDemo) {
        await sleep(420);
        data = await demoAnswer(payload.type === "action" ? payload.action_id : payload.message);
      } else {
        data = await sendToApi(payload);
      }

      const answer = (data.answer || "").trim() || "Repo 中沒有提供足夠資訊。";
      const citations = Array.isArray(data.citations) ? data.citations : [];

      hideTyping();
      addMessage("assistant", answer, citations);

    } catch (e) {
      hideTyping();
      addMessage("assistant", "系統暫時無法取得回應，請稍後再試。\n\n" + String(e?.message || e), []);
    } finally {
      setBusy(false);
      const nearBottom = (body.scrollHeight - body.scrollTop - body.clientHeight) < 160;
      if (nearBottom) scrollBottom();
      updateJumpVisibility();
    }
  }

  function sendText(message) {
    const q = (message || "").trim();
    if (!q) return;
    sendPayload({ type: "text", message: q });
  }

  function seed() {
    body.innerHTML = "";
    body.appendChild(jumpBtn);
    addMessage("assistant", CFG.WELCOME_MESSAGE, [
    ]);
    quickOpen = false;
    quick.classList.remove("open");
    toggleQuickBtn.textContent = "展開";
    updateJumpVisibility();
  }
  seed();

  window.DTZ_CHATBOT = { open: openPanel, close: closePanel, sendText, seed, config: CFG };
})();
