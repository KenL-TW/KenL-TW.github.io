# 專案：AWS 架構視覺化：Serverless

## 一句話摘要
透過 AWS 無伺服器架構，實現事件驅動與雲端原生的一體化設計，提升後端服務效能與擴展性。

## 來源資訊
- 發佈日期：2025-08-25
- 文章 Slug：aws-serverless
- 原文連結：https://kenl-tw.github.io/blog/post.html?slug=aws-serverless
- 封面圖：assets/img/blog/aws-serverless.png
- 內容檔：blog/content/awsServerless.html

## 核心重點（可持續補充）
- 問題背景：隨著雲端應用需求增加，無伺服器架構成為設計主流，透過多種 AWS 服務整合，提供低延遲、易管理且可擴展的解決方案。
- 方法框架：利用 AWS Lambda 觸發事件，搭配 API Gateway 管理 API 請求，及 CloudFront、S3 等服務實現內容分發與儲存，並透過 Cognito 管理使用者身份認證。
- 實務應用：可用於建立靜態網站託管、使用者登入與認證、後端資料操作（讀取、寫入、刪除）、檔案上傳、即時資料更新及全文檢索等多樣化實務場景。
- 風險與限制：無伺服器架構依賴雲端服務供應商，存在服務中斷風險，且對複雜邏輯處理及產品規模擴展時，可能面臨性能及成本挑戰。

## 關鍵字
#blog #tutorials #aws #architecture
