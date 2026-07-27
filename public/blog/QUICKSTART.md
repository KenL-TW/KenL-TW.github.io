# Blog 快速開始

> 完全靜態、無需任何工具的部落格系統

## 📂 文件結構一覽

```
blog/
├── blog.html              ← 文章列表頁（自動讀取 posts.json）
├── post.html              ← 單篇文章頁（?slug=文章ID）
├── posts.json             ← 文章元數據（**手動編寫**）
├── content/               ← 文章內容目錄（可選）
│   ├── hello-world.html
│   ├── api.html
│   └── ...
├── README.md              ← 完整操作指南
└── QUICKSTART.md          ← 本文件

posts.json 的每篇文章可以用兩種方式存儲內容：
  方案 A：contentHtml    → 直接在 JSON 中寫 HTML
  方案 B：content        → 指向 blog/content/*.html
```

---

## 🚀 5 分鐘快速上手

### 1. 查看現有文章

```
打開：blog/blog.html
→ 顯示所有已發佈的文章列表
→ 可搜尋、過濾標籤、按日期排序
```

### 2. 新增一篇簡短文章（推薦入門）

**編輯 `blog/posts.json`**，在陣列中新增：

```json
{
  "slug": "my-first-post",
  "title": "我的第一篇文章",
  "date": "2026-02-10",
  "tags": ["tutorial", "first"],
  "excerpt": "這是我的第一篇部落格文章。",
  "cover": "assets/img/blog/first-post.png",
  "contentHtml": "<h2>歡迎</h2><p>文章內容就寫在這裡。</p><p>可以用任何 HTML 標籤。</p>"
}
```

**查看效果**：
```
打開：blog/post.html?slug=my-first-post
```

### 3. 新增一篇長文章（進階）

**步驟 1**：新增檔案 `blog/content/my-long-post.html`

```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>我的長文章</title>
  <link rel="stylesheet" href="https://unpkg.com/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <style> body { padding: 24px; } </style>
</head>
<body>
  <article>
    <h1>我的深度文章</h1>
    <h2>第一章</h2>
    <p>內容…</p>
    <h2>第二章</h2>
    <p>更多內容…</p>
  </article>
</body>
</html>
```

**步驟 2**：編輯 `blog/posts.json`

```json
{
  "slug": "my-long-post",
  "title": "我的深度文章",
  "date": "2026-02-09",
  "tags": ["advanced", "deep-dive"],
  "excerpt": "深入探討某個複雜概念。",
  "cover": "assets/img/blog/long-post.png",
  "content": "blog/content/my-long-post.html"
}
```

**查看效果**：
```
打開：blog/post.html?slug=my-long-post
```

---

## 📋 常用操作

| 操作 | 步驟 |
|------|------|
| **新增文章** | 編輯 `posts.json` + 新增內容 (contentHtml 或 content) |
| **編輯文章** | 編輯 `posts.json` 或對應的 `content/*.html` |
| **刪除文章** | 在 `posts.json` 中刪除該物件 |
| **修改標籤** | 編輯 `posts.json` 中的 `tags` 陣列 |
| **變更發佈日期** | 編輯 `posts.json` 中的 `date` 欄位 |
| **新增封面** | 把圖片放在 `assets/img/blog/`，填寫 `cover` 路徑 |

---

## ✅ 必填欄位檢查清單

新增文章前，確保有這些欄位：

- [ ] `slug` - 英文小寫、用 - 分隔（如：my-first-post）
- [ ] `title` - 文章標題
- [ ] `date` - YYYY-MM-DD 格式
- [ ] `tags` - 至少一個標籤
- [ ] `excerpt` - 摘要（50-120 字元佳）
- [ ] `cover` - 封面圖片路徑
- [ ] `contentHtml` 或 `content` - 至少有一個

**❌ 容易犯的錯誤**：
- slug 包含大寫字母 → 應改為小寫
- date 格式錯誤 → 應是 YYYY-MM-DD
- cover 圖片不存在 → 會顯示損毀圖示
- 用了 contentHtml 和 content 都填 → 只會用 contentHtml

---

## 🔍 如何測試你的文章

1. **編輯 posts.json** → 新增你的文章
2. **刷新瀏覽器** (Ctrl+Shift+R 清除快取)
3. **檢查列表頁**：`blog/blog.html` 能看到新文章嗎？
4. **檢查內容頁**：`blog/post.html?slug=你的slug` 能正確顯示嗎？
5. **檢查搜尋**：能在搜尋欄搜到嗎？
6. **檢查標籤**：標籤雲能點擊過濾嗎？

---

## 🎨 自訂內容格式

在 `contentHtml` 中可使用任何 HTML：

```html
<!-- 標題 -->
<h1>大標題</h1>
<h2>小標題</h2>

<!-- 文字 -->
<p>段落文字</p>
<strong>加粗</strong>
<em>斜體</em>

<!-- 列表 -->
<ul>
  <li>項目 1</li>
  <li>項目 2</li>
</ul>

<!-- 代碼 -->
<pre><code>console.log('Hello');</code></pre>

<!-- 圖片 -->
<img src="assets/img/blog/example.png" alt="描述">

<!-- 引用區塊 -->
<blockquote>重點引言</blockquote>
```

---

## 🔐 隐私 & SEO

✅ **自動生成**：
- 文章列表 SEO meta 標籤
- Open Graph（Facebook/Twitter 分享卡）
- 結構化資料（JSON-LD）
- 文章內部前後篇導航

❌ **手動管理**：
- 無需任何後端或部署步驟
- 完全基於靜態文件
- 無追蹤碼或分析（除非你自己加）

---

## 🐛 故障排除

**問題**：新文章在列表中看不到  
**解方**：
- 檢查 `posts.json` 語法（JSON 格式必須正確）
- 檢查 `slug` 和 `title` 是否為空
- 重新整理瀏覽器並清除快取

**問題**：文章內容是空白的  
**解方**：
- 如果用 `contentHtml`，檢查 HTML 是否正確
- 如果用 `content`，檢查檔案路徑是否正確
- 檢查 `blog/content/*.html` 檔案中是否有 `<article>` 標籤

**問題**：圖片無法顯示  
**解方**：
- 檢查檔案是否存在
- 檢查路徑是否相對於根目錄正確

---

## ⚡ 進階技巧

**Q: 可以支持 Draft（草稿）嗎？**  
A: 在 `posts.json` 中新增 `"draft": true`，然後在 `blog.html` 中篩選掉它們

**Q: 可以支持多個作者嗎？**  
A: 在 posts.json 中加 `"author": "名字"`，然後在 `post.html` 中自行渲染

**Q: 可以按分類顯示文章嗎？**  
A: 可以自行編輯 `blog.html`，基於 tags 分類顯示

**Q: 支持評論功能嗎？**  
A: 這個系統是純靜態的。可整合第三方服務如 Disqus、Utterances 等

---

## 📖 更多說明

詳細的完整指南請見：[README.md](./README.md)

新增文章的 JSON 模板：[posts-template.js](./posts-template.js)

---

**準備好開始了嗎？編輯 `posts.json` 新增你的第一篇文章吧！** 🚀
