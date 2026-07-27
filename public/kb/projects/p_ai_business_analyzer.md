# 專案：AI Business Analyzer 市場分析工具

## 一句話摘要
以 AWS Serverless 與 OpenAI 為核心的市場研究工具，協助快速產出可視化分析與競品洞察。

## 問題背景
傳統市場研究流程常仰賴人工蒐集與整理，耗時且不易標準化，不利於快速驗證商業假設。

## 解決方案
- 前端提供產業主題輸入與分析結果展示
- 後端採 API Gateway + Lambda 串接 AI 分析流程
- 結果以結構化 JSON 回傳，便於渲染與再利用
- 圖表層採 Chart.js 呈現市場成長與細分資訊

## 主要輸出
- 市場摘要（Summary）
- 市場規模與成長趨勢
- SWOT 分析
- 競品比較與差異化觀察
- AI 應用場景建議

## 技術堆疊
- AWS API Gateway
- AWS Lambda（Python）
- AWS Secrets Manager
- OpenAI API
- Chart.js

## 成效與價值
- 將分析流程從「人工彙整」轉為「半自動生成」
- 降低前期研究時間成本
- 讓創業提案、內部簡報與商業評估有更快的起始版本
