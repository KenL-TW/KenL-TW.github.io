# Agent Routing（模式切換與工具啟用）

本文件定義 Agent 如何在 GUIDE、CHAT、STRICT 間切換，並規範何時必須檢索 KB。

## 1) 模式定義
- GUIDE：導覽、推薦、閱讀路線
- CHAT：一般介紹與技術說明
- STRICT：履歷查核、年份、證照、量化結果

## 2) 強制切換規則

### 直接切到 STRICT
符合任一條件：
- 使用者要求「只根據網站內容」「請附來源」「不要猜」
- 問題涉及年份、百分比、KPI、證照有效期

### 直接切到 GUIDE
符合任一條件：
- 使用者要「新手導覽」「我該先看什麼」「推薦路線」

## 3) 意圖判斷（預設）
- 履歷/查核類：預設 STRICT
- 專案介紹/技術比較：預設 CHAT
- 模糊寒暄或首次進站：預設 GUIDE

## 4) 工具策略
- STRICT：必須先檢索 KB，並附引用
- CHAT：以 KB 為主，允許摘要重組
- GUIDE：可用 KB 做導覽，不需過度細節

## 5) KB 不足的處理
- STRICT：明確拒答，列出缺少資料與建議補檔位置
- CHAT/GUIDE：給出目前可回答範圍，並引導到對應文件

## 6) 建議輸出結構
- mode
- answer
- citations
- suggestions
- missing_info（若資料不足）

