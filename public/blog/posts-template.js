/**
 * Blog 快速參考 - posts.json 編輯指南
 * 
 * 這個文件定義所有文章的元數據
 * 新增文章時，複製下方模板並填入內容
 */

// ==========================================
// 模板 1️⃣：簡短文章（內容直接寫在 JSON）
// ==========================================
/*
{
  "slug": "my-quick-tip",
  "title": "我的快速指南",
  "date": "2026-02-10",
  "tags": ["tutorial", "javascript"],
  "excerpt": "一句話總結這篇文章。",
  "cover": "assets/img/blog/quick-tip.png",
  "contentHtml": "<h2>重點 1</h2><p>內容…</p><h2>重點 2</h2><p>更多內容…</p>"
}
*/

// ==========================================
// 模板 2️⃣：長文章（內容存在 blog/content/*.html）
// ==========================================
/*
{
  "slug": "my-long-article",
  "title": "我的深度文章",
  "date": "2026-02-09",
  "tags": ["advanced", "architecture"],
  "excerpt": "深入探討某個複雜概念。",
  "cover": "assets/img/blog/architecture.png",
  "content": "blog/content/my-long-article.html"
}
*/

// ==========================================
// 欄位說明
// ==========================================
/*
  slug          - 文章 URL ID（必填）
                  只能英文小寫、數字、-
                  例：my-first-post
                  存取 URL 會是：blog/post.html?slug=my-first-post
  
  title         - 文章標題（必填）
                  例：我的第一篇文章
  
  date          - 發佈日期（必填）
                  格式：YYYY-MM-DD
                  例：2026-02-10
  
  tags          - 標籤陣列（必填）
                  用於分類和搜尋
                  例：["tutorial", "javascript", "tips"]
  
  excerpt       - 摘要（必填）
                  列表頁面顯示的預覽文本
                  建議 50-120 字元
  
  cover         - 封面圖片路徑（必填）
                  相對於根目錄
                  例：assets/img/blog/my-post.png
  
  contentHtml   - 內容 HTML（選填方案 A）
                  小文章直接寫在 JSON 中
                  例："<h2>標題</h2><p>內容…</p>"
  
  content       - 內容文件路徑（選填方案 B）
                  指向 blog/content/*.html
                  例：blog/content/my-post.html
*/

// ==========================================
// 實際資料 - 編輯下方開始新增文章
// ==========================================
