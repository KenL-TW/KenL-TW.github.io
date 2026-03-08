# 專案：系統分析師的思維與方法論

## 一句話摘要
本文介紹AWS三層式架構，說明數據如何在各服務間流動，展現系統分析師的平衡思維與方法論。

## 來源資訊
- 發佈日期：2025-09-25
- 文章 Slug：system-analysis
- 原文連結：https://kenl-tw.github.io/blog/post.html?slug=system-analysis
- 封面圖：assets/img/blog/system-analysis.png
- 內容檔：blog/content/awsThreeTier.html

## 核心重點（可持續補充）
- 問題背景：在雲端架構中，需求、系統架構與交付之間需取得平衡，確保系統高效可靠地處理大量讀寫與擴展需求。
- 方法框架：透過三層式架構設計，結合CloudFront快取、S3靜態儲存、ALB負載平衡、多台EC2動態處理及RDS資料庫讀寫分離，並利用Lambda無伺服器計算與Auto Scaling自動擴展實現彈性運算。
- 實務應用：架構涵蓋用戶端請求、靜態與動態資料讀寫、高流量自動擴展以及事件驅動的無伺服器計算，適用於網站和應用程式的穩定運行與高效響應。
- 風險與限制：系統依賴多項服務協同，若配置不當或監控不足，可能導致延遲、資源浪費或擴展失控等問題。

## 關鍵字
#blog #analysis #career
