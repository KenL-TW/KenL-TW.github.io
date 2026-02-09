# 專案：AI Business Analyzer 市場分析工具

## 一句話摘要
一個結合 AWS Serverless 與 AI 的市場分析/競品分析平台，可針對任意產業進行自動分析。 :contentReference[oaicite:20]{index=20}

## 背景與問題
提供快速市場分析管道，減少人力與時間成本。

## 方案
- 前端頁面：可輸入產業、地區與年份  
- 後端架構：API Gateway → Lambda → OpenAI → JSON 結果  
- 可視化：Chart.js 動態圖表  
- 產出格式：Summary / SWOT / 競品列表 :contentReference[oaicite:21]{index=21}

## 技術
API Gateway, AWS Lambda, Secrets Manager, OpenAI GPT, Chart.js :contentReference[oaicite:22]{index=22}

## 成果
提供交互式市場成長趨勢與競品分析能力。 :contentReference[oaicite:23]{index=23}
