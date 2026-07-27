# Archi 技術架構總覽（KB-first Serverless Agent）

## 1. 架構定位

Archi 為 KB-first（Repo-based）導覽型 Agent，採用 GitHub Pages + AWS Serverless + OpenAI Responses API 組成。

核心理念：
- 知識來源可驗證（GitHub Repo）
- LLM 僅負責語言組織，不負責創造事實
- Deterministic Retrieval 優先於模型推理

---

## 2. 前端層（Public UI）

- GitHub Pages 靜態網站
- Chatbot widget（HTML + JS）
- 透過 HTTPS POST 呼叫 Lambda Function URL
- 渲染回傳欄位：
  - answer
  - citations
  - cards
  - suggestions
  - plan
  - actions
  - missing_info

特性：
- KB 公開透明
- citations 可追溯到 repo markdown

---

## 3. 後端層（Lambda Agent Runtime）

### 單一入口

AWS Lambda + Function URL

責任：
- CORS 控制
- Session 管理
- KB 下載與快取
- Deterministic Retrieval
- 呼叫 OpenAI Responses API
- Guard 防幻覺
- 寫入 DynamoDB
- 組裝 UI payload

---

## 4. 知識來源（GitHub Repo）

檔案結構：

kb/
  index.json
  about/
  projects/
  resume/
  certs/

index.json 為 chunk 索引：

{
  "chunks": [
    {
      "path": "...",
      "chunk_id": "...",
      "title": "...",
      "text": "..."
    }
  ]
}

設計重點：
- 不使用向量 DB
- 採 deterministic scoring
- index.json 必須與 markdown 同步更新

---

## 5. 記憶層（DynamoDB）

兩張表：

dtz_sessions
- session_id (PK)
- summary
- state
- last_seen
- updated_at

dtz_messages
- session_id (PK)
- ts_turn (SK)
- role
- content
- expires_at (TTL)

策略：
- 記憶只提供「上下文連續性」
- 不作為事實來源

---

## 6. OpenAI Reasoning 層

使用 OpenAI Responses API。

輸入組成：
- system prompt（policy + persona + mode）
- memory pack
- tool_context
- citations whitelist

限制：
- 不可引用 whitelist 外內容
- 不可虛構 KPI/數字
- STRICT 模式抑制推測

---

## 7. Guard 機制

防止常見幻覺：
- 百分比
- 成長率
- ROI
- 秒數
- 技術棧未出現名詞

STRICT 模式會：
- 列出缺口
- 抑制未寫入 KB 內容

---

## 8. End-to-End Flow

Browser → Lambda  
Lambda → DynamoDB  
Lambda → GitHub raw index.json  
Lambda → OpenAI  
Guard → Writeback → JSON response  

資料流摘要：
UI 問問題 → Lambda 取 KB → 檢索 chunk → LLM 組織 → Guard 過濾 → 回傳可驗證回答
