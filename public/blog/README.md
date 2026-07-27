# Blog 結構説明

> 一個完全靜態的部落格系統，無需任何外部模塊、Server 或自動化工具

## 文件結構

```
blog/
├── blog.html          # 文章列表頁（自動讀取 posts.json）
├── post.html          # 單篇文章頁（根據 ?slug= 參數顯示）
├── posts.json         # 文章元數據清單（手動編寫）
├── content/           # 文章內容片段目錄（可選）
│   ├── hello-world.html
│   ├── api.html
│   └── ...
└── README.md          # 本文件
```

---

## 操作步驟

### 1️⃣ 新增文章 - 編輯 `posts.json`

在 `posts.json` 中添加一個新物件，欄位説明：

| 欄位 | 必填 | 説明 | 範例 |
|------|-----|------|------|
| `slug` | ✅ | 文章 URL 識別符（英文、小寫、-分隔） | `"my-first-post"` |
| `title` | ✅ | 文章標題 | `"我的第一篇文章"` |
| `date` | ✅ | 發佈日期（YYYY-MM-DD） | `"2026-02-10"` |
| `tags` | ✅ | 標籤陣列 | `["tutorial", "javascript"]` |
| `excerpt` | ✅ | 摘要（列表頁顯示） | `"簡短的簡介…"` |
| `cover` | ✅ | 封面圖片路徑 | `"assets/img/blog/my-post.png"` |
| `contentHtml` | ⚠️ | 內容 HTML（方案A：直接寫在JSON中） | 見下方 |
| `content` | ⚠️ | 內容檔案路徑（方案B：指向 content/*.html） | `"blog/content/my-post.html"` |

---

### 2️⃣ 寫入文章內容 - 選擇一種方案

#### 🔵 方案 A：小文章直接寫在 `posts.json` 中（推薦簡短文章）

```json
{
  "slug": "quick-tip",
  "title": "JavaScript 小技巧",
  "date": "2026-02-10",
  "tags": ["javascript", "tips"],
  "excerpt": "三個實用的 JS 技巧。",
  "cover": "assets/img/blog/quick-tip.png",
  "contentHtml": "<h2>技巧 1</h2><p>…</p><h2>技巧 2</h2><p>…</p>"
}
```

**優點**：無需建立額外檔案，所有資料集中在一個 JSON  
**缺點**：JSON 中混有 HTML 標籤，編輯時容易出錯

---

#### 🔴 方案 B：大文章寫在 `blog/content/` 中（推薦詳細文章）

**步驟 1**：在 `blog/content/` 新增 HTML 檔案
```
blog/content/my-detailed-post.html
```

**步驟 2**：內容模板
```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>我的詳細文章</title>
  <link rel="stylesheet" href="https://unpkg.com/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <style> body { padding: 24px; } </style>
</head>
<body>
  <article>
    <h1>文章標題</h1>
    <p class="text-muted">2026-02-10 · #tag1 #tag2</p>
    <hr>
    
    <p>第一段內容…</p>
    
    <h2>第一小節</h2>
    <p>詳細內容…</p>
    
    <h2>第二小節</h2>
    <p>更多內容…</p>
    
  </article>
</body>
</html>
```

**步驟 3**：在 `posts.json` 中指向這個檔案
```json
{
  "slug": "my-detailed-post",
  "title": "我的詳細文章",
  "date": "2026-02-10",
  "tags": ["tutorial", "advanced"],
  "excerpt": "深入探討 XXX 的原理。",
  "cover": "assets/img/blog/my-post.png",
  "content": "blog/content/my-detailed-post.html"
}
```

**優點**：HTML 內容獨立，易於編輯和版本管理  
**缺點**：需建立額外檔案

---

### 3️⃣ 查看效果

| 頁面 | 訪問方式 |
|-----|---------|
| 📰 文章列表 | `blog/blog.html` |
| 📄 單篇文章 | `blog/post.html?slug=my-first-post` |

---

## 常見任務

### ✏️ 修改現有文章
直接編輯 `posts.json` 或對應的 `blog/content/*.html`

### ❌ 刪除文章
在 `posts.json` 中移除該物件即可（會自動從列表消失）

### 🏷️ 修改標籤
編輯 `posts.json` 中的 `tags` 陣列
- blog.html 會自動生成標籤雲
- 點擊標籤可過濾

### 🔍 全文搜尋
blog.html 內建 Fuse.js 全文搜尋
- 搜尋欄位：標題、摘要、標籤
- 無需任何後端

### 📸 新增封面圖片
1. 將圖片放在 `assets/img/blog/` 目錄
2. 在 `posts.json` 中填寫相對路徑：`"assets/img/blog/my-image.png"`

---

## 數據格式例子

完整的 `posts.json` 樣板（方案 A + B 混合）：

```json
[
  {
    "slug": "quick-intro",
    "title": "快速入門",
    "date": "2026-02-10",
    "tags": ["tutorial", "intro"],
    "excerpt": "三分鐘了解這個專案。",
    "cover": "assets/img/blog/intro.png",
    "contentHtml": "<h2>什麼是本專案？</h2><p>…</p><p>更多內容…</p>"
  },
  {
    "slug": "deep-dive",
    "title": "技術深潛",
    "date": "2026-02-09",
    "tags": ["advanced", "architecture"],
    "excerpt": "深入了解系統設計。",
    "cover": "assets/img/blog/architecture.png",
    "content": "blog/content/deep-dive.html"
  }
]
```

---

## 常見問題

**Q: 文章可以有多個作者嗎？**  
A: 可以在 posts.json 中加入 `"author": "名字"` 欄位，然後在 post.html 中自行渲染

**Q: 可以支持 Markdown 嗎？**  
A: 這個系統是純前端靜態，不支持 Markdown 轉換。但可以手寫 HTML（如上列模板）

**Q: 文章排序規則？**  
A: 默認按日期從新到舊排序（post.html 中的 `sort` 函數）

**Q: 草稿功能？**  
A: 在 posts.json 中臨時加入 `"draft": true` 欄位，然後在 blog.html 中過濾掉它們

**Q: SEO 會自動生成嗎？**  
A: 會的！post.html 會根據文章資料自動生成 OG meta 標籤 + JSON-LD

---

## 技術細節

- ✅ 純 HTML + JavaScript（無框架依賴）
- ✅ 支持 `file://` 協議（本地直接打開）
- ✅ 支持 HTTPS fetch（部署到 GitHub Pages 時）
- ✅ 內建 Fuse.js 全文搜尋
- ✅ 自動 SEO 與社交媒體優化

---

**由此開始編輯 `posts.json` 來新增你的第一篇文章吧！** 🚀
