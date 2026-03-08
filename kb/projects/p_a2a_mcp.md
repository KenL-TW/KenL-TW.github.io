# 專案：從影片到實戰：我怎麼理解 A2A 與 MCP 在 AI Agent 架構中的角色（第二版）

## 一句話摘要
本文從技術與產品設計層面分析A2A與MCP在AI Agent架構中的角色，強調系統分層與流程治理的重要性，並提出落地方案。

## 來源資訊
- 發佈日期：2026-03-08
- 文章 Slug：a2a-mcp
- 原文連結：https://kenl-tw.github.io/blog/post.html?slug=a2a-mcp
- 封面圖：assets/img/blog/a2a_mcp.png
- 內容檔：blog/content/a2a_mcp.html

## 核心重點（可持續補充）
- 問題背景：現有AI Agent多停留於單點功能展示，缺乏系統化設計，導致在真實業務環境中難以穩定運行。問題聚焦於如何接入多工具及多角色協作，保障流程一致性。
- 方法框架：透過拆解AI Agent功能為工具接入層（MCP）與多Agent協作層（A2A），分別解決垂直工具整合與橫向多角色協作問題，並將兩者納入分層架構進行流程設計與治理。
- 實務應用：實務上，應用於LINE商家自動化、顧問型Agent及Lead管理等場景，透過Orchestrator與多專責Agent協作，結合統一工具接入口，提升系統維護性與可擴充性。
- 風險與限制：若未明確分層規劃角色與工具，易造成架構混亂、功能耦合過緊、治理不足與流程不可觀測，最終導致系統不穩定並難以商業化推廣。

## 關鍵字
#blog #ai #agent #mcp #a2a #architecture
