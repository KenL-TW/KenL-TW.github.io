# Agent Routing — Mode Switch & Tool Policy (V2)

本文件定義 KenL Site Assistant 的「意圖判斷（routing）」規則：  
- 何時使用 GUIDE / CHAT / STRICT  
- 何時需要查 KB、何時可用 general LLM 表達  
- 何時啟用 Session Memory（DynamoDB）  
- 何時必須要求使用者提供更精確的目標（文件/專案/段落）

> 目的：用最小成本確保「介紹時很像人、查核時像審計」。

---

## 0. Routing 輸入（Agent 需要辨識的欄位）

- user_message: 使用者輸入
- session_id: 前端提供（若無則自動生成）
- context_flags:
  - force_strict: 使用者是否要求「只根據網站/Repo」
  - force_guide: 使用者是否要求「帶我逛/推薦路線」
  - debug: 是否需要回傳 routing details（僅開發用）

---

## 1. 模式定義（回傳值）

- MODE = GUIDE：導覽/推薦/上手路線
- MODE = CHAT：一般介紹/比較/解釋（仍需 KB 支撐主要 facts）
- MODE = STRICT：履歷/專案/數字/年份/證照等「必須 100% 引用」的查核模式

---

## 2. 最高優先級：硬切換（Explicit Override）

若命中以下條件，直接切換，不再做其他判斷：

### 2.1 強制 STRICT
符合任一：
- user_message 含：`嚴格` / `只根據` / `只看` / `不要猜` / `引用` / `來源` / `根據repo` / `KB-only` / `strict`
- user_message 包含查核語氣：`請證明` / `請列出依據` / `請逐條對應` / `請給文件路徑`
- context_flags.force_strict = true

=> MODE = STRICT

### 2.2 強制 GUIDE
符合任一：
- user_message 含：`帶我逛` / `導覽` / `我該從哪裡開始` / `推薦路線` / `第一次來` / `新手`
- context_flags.force_guide = true

=> MODE = GUIDE

---

## 3. 次優先級：問題類型（Intent Routing）

### 3.1 履歷/查核類（默認 STRICT）
命中任一關鍵字（中文/英文）：
- `履歷` `resume` `經歷` `工作經驗` `年資` `任職` `公司` `職稱` `教育` `學歷`
- `證照` `cert` `AWS` `PMP` `TOEIC`
- `成就` `指標` `KPI` `提升` `%` `秒` `轉換率` `效能` `節省`
- `哪一年` `時間線` `timeline` `from~to`

=> MODE = STRICT  
=> 工具：必須 KB 检索 + 引用；若 KB 不足，要求補資料路徑

### 3.2 專案/作品集（默認 CHAT，含數字則 STRICT）
命中任一：
- `作品集` `portfolio` `project` `專案` `案例` `demo`
- `架構` `architecture` `AWS` `Lambda` `DynamoDB` `RAG` `Agent`

=> MODE = CHAT  
但若同一句含「數字/年份/百分比/具體量化」=> MODE = STRICT

### 3.3 站內導覽/推薦（GUIDE）
命中任一：
- `我該看什麼` `推薦` `top3` `最值得看` `導覽` `怎麼逛` `開始` `新手`
=> MODE = GUIDE

### 3.4 技術解釋/概念科普（CHAT）
命中任一：
- `什麼是` `差別` `怎麼做` `best practice` `為什麼`
=> MODE = CHAT
但：若問題包含「Ken 做了什麼」或「Ken 的專案細節」仍需 KB 支撐

### 3.5 其他模糊問題（GUIDE → CHAT）
若問題很短或模糊，例如：
- `你好` `哈囉` `hi` `hello`
- `介紹一下`（未指定主題）
=> MODE = GUIDE（先問 1 次偏好：專案/履歷/技能/合作）

---

## 4. 工具啟用策略（Tool Policy）

### 4.1 KB Retrieval Tool（必用時機）
- MODE=STRICT：必用
- MODE=CHAT：必用（至少 top_k=3），回答主體需基於 KB
- MODE=GUIDE：可用（top_k=3）以取得 site-map / projects-overview / about 等

### 4.2 Session Memory（DynamoDB）啟用規則
- MODE=GUIDE：啟用（記錄使用者偏好：想看專案/履歷/技能）
- MODE=CHAT：啟用（記錄最近看的專案與關鍵字）
- MODE=STRICT：限制啟用（僅可記錄 routing 偏好與歷程，不可引入不在 KB 的 facts）

**Memory 欄位建議：**
- last_intent: guide/chat/strict
- interested_topics: ["OMS","AI Agent","AWS"]
- visited_docs: ["kb/projects/p_agent_rag.md"]
- last_project_focus: "p_agent_rag"

---

## 5. KB 不足時的處理（Fallback Policy）

### 5.1 STRICT 模式：必須拒答 + 指示補哪裡
格式：
- 先說明 KB 不足
- 列出需要的資料類型（文件/章節/路徑/指標）
- 提供最短補法（例如：新增到 kb/projects/p_xxx.md 的 Impact 段）

### 5.2 CHAT / GUIDE：可降級為導覽
- 引導使用者到「site-map / projects-overview / resume-summary」
- 提供 2-3 個 suggestions

---

## 6. 建議回傳的 Debug 欄位（僅開發/可關閉）

若 context_flags.debug=true，可額外回傳：
- routing_reason: 命中規則文字（例如：`resume keyword -> STRICT`）
- matched_keywords: ["履歷","年資"]
- mode: "STRICT"
- tools: ["kb_retrieve","memory_read","memory_write"]

---

## 7. 標準化輸出（供後端/前端使用）

建議回傳 JSON（概念範例）：
{
  "mode": "GUIDE|CHAT|STRICT",
  "answer": "...",
  "citations": [{ "path": "...", "chunk_id": "..." }],
  "suggestions": ["...", "...", "..."],
  "routing": {
    "reason": "...",
    "matched_keywords": ["..."],
    "tools": ["kb_retrieve","memory_write"]
  }
}

