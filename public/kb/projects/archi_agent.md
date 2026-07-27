# Archi Agent 專案介紹

## 1. 專案定位

Archi 不是聊天機器人，而是導覽型 Agent。

核心目標：
- 帶路（Guide）
- 可驗證（Verifiable）
- 可持續維護（Repo-based KB）

---

## 2. 為什麼不是一般 Chatbot？

傳統 Chatbot：
- 模型自由發揮
- 容易幻覺
- 無法追溯資料來源

Archi：
- Tool-first
- Deterministic Retrieval
- Citations Whitelist
- Guard 機制

---

## 3. Mode 策略

GUIDE
- 給路線
- 提供 plan
- 導覽式回答

CHAT
- 較自然
- 仍維持 KB-first

STRICT
- 僅列可驗證內容
- 列出缺口
- 禁止推測

---

## 4. Tool-first 思維

流程：
1. 檢索 KB
2. 產出可引用清單
3. LLM 僅在範圍內組織文字

LLM 角色：
- 語言組織者
- 非事實創造者

---

## 5. 長期擴展性

未來可擴充：
- KB auto index generator
- RAG 升級向量 DB
- Multi-repo aggregation
- Internal enterprise KB
- Observability dashboard

---

## 6. Agent 核心原則

- 可驗證優於華麗回答
- 結構化優於閒聊
- 可維護優於一次性 demo
- KB 是真實世界映射

---

## 7. 一句話總結

Archi = Repo-based KB + Deterministic Retrieval + LLM as Writer + Guard as Auditor
