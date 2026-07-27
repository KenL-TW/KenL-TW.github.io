# Blog 內容方案選擇指南

> 在 `posts.json` 中添加文章內容時，可選擇兩種方案

---

## 🔵 方案 A：`contentHtml`（直接寫在 JSON）

### 使用場景
- 快速更新（不想新建檔案）
- 文章內容簡短（<2000 字元）
- 日常筆記或快速分享

### 優點
✅ 所有資料集中在 `posts.json`  
✅ 無需建立額外檔案  
✅ 便於版本管理（單一 JSON）  
✅ 適合小型部落格  

### 缺點
❌ JSON 中混有 HTML 標籤，容易出錯  
❌ 長內容會讓 JSON 檔案很龐大  
❌ HTML 編輯時容易忘記轉義引號  
❌ 難以在編輯器中格式化  

### 示例
```json
{
  "slug": "quick-tip",
  "title": "JavaScript 快速技巧",
  "date": "2026-02-10",
  "tags": ["javascript", "tips"],
  "excerpt": "三個實用小技巧。",
  "cover": "assets/img/blog/quick.png",
  "contentHtml": "<h2>技巧 1</h2><p>簡短說明…</p><h2>技巧 2</h2><p>另一個技巧…</p>"
}
```

### ⚠️ 注意事項
- 不要在 HTML 中混用 `"` 和 `'`，容易破壞 JSON
- 解決方案：用 `&quot;` 替代 `"`，或改用雙引號包裹整個 HTML

**❌ 錯誤示例**：
```json
"contentHtml": "<p>He said "hello"</p>"  // 錯！會破損
```

**✅ 正確示例**：
```json
"contentHtml": "<p>He said &quot;hello&quot;</p>"  // 對
```

或者用三引號（某些編輯器支持）：
```json
"contentHtml": "<p>He said \"hello\"</p>"  // 也對
```

---

## 🔴 方案 B：`content`（指向外部檔案）

### 使用場景
- 長篇文章（>2000 字元）
- 專業部落格
- 需要頻繁更新內容
- 團隊協作

### 優點
✅ 內容與元數據分離  
✅ 檔案獨立，易於版本控制  
✅ HTML 編輯器支持完整功能  
✅ posts.json 保持簡潔  
✅ 便於重用或批量編輯內容  

### 缺點
❌ 需建立額外檔案  
❌ 檔案多了，可能難以追蹤  
❌ 必須確保檔案存在（否則顯示空白）  
❌ 需注意檔案路徑相對位置  

### 示例

**posts.json 中**：
```json
{
  "slug": "deep-dive-architecture",
  "title": "系統架構深潛",
  "date": "2026-02-09",
  "tags": ["architecture", "advanced"],
  "excerpt": "完整的架構設計指南。",
  "cover": "assets/img/blog/arch.png",
  "content": "blog/content/deep-dive-architecture.html"
}
```

**blog/content/deep-dive-architecture.html 中**：
```html
<!DOCTYPE html>
<html lang="zh-Hant">
<head>
  <meta charset="utf-8">
  <title>系統架構深潛</title>
  <link rel="stylesheet" href="https://unpkg.com/bootstrap@5.3.3/dist/css/bootstrap.min.css">
  <style> body { padding: 24px; } </style>
</head>
<body>
  <article>
    <h1>系統架構深潛</h1>
    <h2>第一章</h2>
    <p>內容…</p>
    <!-- 更多內容 -->
  </article>
</body>
</html>
```

### ⚠️ 注意事項
- `content` 欄位應指向 `blog/content/` 下的檔案
- 檔名應與 `slug` 相似或對應
- 檔案必須包含 `<article>` 標籤（system 會提取其內容）
- 檔案不能太大（雖然沒硬限制，但 >100KB 時瀏覽器加載會變慢）

---

## 🎯 決策樹

```
我要寫一篇文章…

├─ 內容 < 500 字元？
│  └─ 用方案 A (contentHtml)
│
├─ 內容 500-2000 字元？
│  ├─ 需要編輯器支持？ → 方案 B (content)
│  └─ 快速更新？ → 方案 A (contentHtml)
│
└─ 內容 > 2000 字元？
   └─ 用方案 B (content)
```

---

## 📊 對比表

| 特性 | 方案 A：contentHtml | 方案 B：content |
|------|------------------|-----------------|
| **檔案數量** | 1（JSON） | 2（JSON + HTML） |
| **編輯難度** | 中等（需注意 JSON 轉義） | 簡單（純 HTML） |
| **適合文章長度** | < 2000 字元 | > 2000 字元 |
| **版本管理** | 單一檔案 | 分離的檔案 |
| **加載速度** | 快（全在內存） | 正常（額外 HTTP 請求） |
| **重用性** | 低 | 高 |
| **適合大型部落格** | ❌ 不建議 | ✅ 建議 |

---

## 💡 推薦做法

### 用 JSON + contentHtml 的情況
- ✅ 快速發佈日記 / 筆記
- ✅ 文章 < 500 字
- ✅ 個人部落格（10-20 篇）

### 用 content + HTML 檔案的情況
- ✅ 正式技術文章
- ✅ 文章 > 2000 字
- ✅ 專業部落格（50+ 篇）
- ✅ 團隊維護

### 混合使用
✅ 推薦方案！簡短文章用 A，長文章用 B。

```json
[
  {
    "slug": "tip-of-the-day",
    "contentHtml": "<p>今日分享：…</p>"
  },
  {
    "slug": "comprehensive-guide",
    "content": "blog/content/comprehensive-guide.html"
  }
]
```

---

## 🔧 轉換指南

### A → B（JSON 代碼改檔案）

**準備**：
1. 建立 `blog/content/my-article.html`
2. 複製 `content/template-example.html` 作為模板
3. 把 `contentHtml` 中的 HTML 粘入 `<article>` 中
4. 在 `posts.json` 中：
   - 刪除 `contentHtml` 欄位
   - 新增 `"content": "blog/content/my-article.html"`

### B → A（檔案改 JSON 代碼）

**準備**：
1. 打開 `blog/content/my-article.html`
2. 複製 `<article>` 內的所有 HTML
3. 把所有 `"` 替換為 `&quot;`（避免 JSON 破損）
4. 在 `posts.json` 中：
   - 新增 `"contentHtml": "複製的HTML"`
   - 刪除 `"content"` 欄位

---

## ❓ 常見問題

**Q: 能同時用 contentHtml 和 content 嗎？**  
A: 可以，但系統會優先用 `contentHtml`（如果存在）。建議只用其中一個。

**Q: 能在 posts.json 中直接寫換行和縮進嗎？**  
A: 不建議。JSON 會把換行和空格當作字符。解決：用 `<br>` 或 CSS 控制排版。

**Q: contentHtml 中能用 Markdown 嗎？**  
A: 不能，這個系統是純 HTML。如需 Markdown，可用線上工具先轉為 HTML 再貼入。

**Q: 如果 content 檔案很大會怎樣？**  
A: 會額外增加一個 HTTP 請求，但瀏覽器會快取。一般不是問題。

**Q: content 的路徑支持絕對路徑嗎？**  
A: 支持相對路徑（`blog/content/...`）。絕對路徑需以 `/` 開頭，但不太推薦。

---

**結論**：選擇最適合你的方案，保持一致即可！ 🚀
