# 專案：從零打造個人部落格（純前端架構）

## 一句話摘要
以純前端技術和 GitHub Pages 從零打造輕巧且易維護的個人部落格系統。

## 來源資訊
- 發佈日期：2025-10-08
- 文章 Slug：hello-world
- 原文連結：https://kenl-tw.github.io/blog/post.html?slug=hello-world
- 封面圖：assets/img/blog/hello-world.png
- 內容檔：blog/content/hello-world.html

## 核心重點（可持續補充）
- 問題背景：許多使用者希望架設個人部落格，但不想依賴後端服務，故需利用純前端技術於 GitHub Pages 上建置部落格。
- 方法框架：採用純 HTML 與 JavaScript，所有文章存於 content/*.html 片段檔，利用 <iframe> 載入文章，並且索引頁和文章頁不使用 fetch，支援在本地 file:// 直接開啟。
- 實務應用：適合在 GitHub Pages 上架設部落格，方便共用外觀樣式，並且輕量不需後端維護，適合展示個人作品或文章。
- 風險與限制：不使用後端服務與 fetch 導致功能較簡單，無法支援動態內容，且使用 <iframe> 可能影響 SEO 表現。

## 關鍵字
#blog #web #portfolio
