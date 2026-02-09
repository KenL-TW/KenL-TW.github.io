# Blog 系統完成清單

✅ **系統已構建完成** - 純靜態、無依賴、零配置

---

## 📦 已準備的文件

| 文件 | 説明 | 狀態 |
|------|------|------|
| `blog/blog.html` | 文章列表頁 | ✅ 完成 |
| `blog/post.html` | 單篇文章頁 + 外部內容載入器 | ✅ 完成 |
| `blog/posts.json` | 文章元數據 | ✅ 完成（7篇示例文章） |
| `blog/content/*.html` | 文章內容片段 | ✅ 完成（7篇示例） |
| `blog/README.md` | 完整操作指南 | ✅ 完成 |
| `blog/QUICKSTART.md` | 5分鐘入門指南 | ✅ 完成 |
| `blog/posts-template.js` | JSON 編輯參考 | ✅ 完成 |
| `blog/content/template-example.html` | 新文章 HTML 模板 | ✅ 完成 |

---

## 🎯 如何使用

### 查看現有文章
```
打開 → blog/blog.html
功能：
  ✓ 完整文章列表
  ✓ 全文搜尋（標題、摘要、標籤）
  ✓ 標籤雲過濾
  ✓ 日期排序
```

### 檢視單篇文章
```
打開 → blog/post.html?slug=hello-world
功能：
  ✓ 完整文章內容
  ✓ 文章元數據（日期、標籤）
  ✓ 前後篇導航
  ✓ 自動 SEO + 社交分享卡
```

### 新增文章 - 三步驟

**步驟 1**：複製 `blog/content/template-example.html` 到新檔案
```
blog/content/my-new-article.html
```

**步驟 2**：編輯你的 HTML 內容

**步驟 3**：在 `blog/posts.json` 添加一行（復制粘貼以下内容）
```json
{
  "slug": "my-new-article",
  "title": "我的新文章",
  "date": "2026-02-10",
  "tags": ["tutorial"],
  "excerpt": "簡短摘要。",
  "cover": "assets/img/blog/my-new.png",
  "content": "blog/content/my-new-article.html"
}
```

---

## 💡 設計特點

✨ **零依賴**
- 無需 Node.js、Webpack、Build 工具
- 無需部署流程或 GitHub Actions
- 直接編輯 JSON + HTML，立即生效

✨ **完全靜態**
- 支持 `file://` 協議（本地打開）
- 支持 GitHub Pages（自動部署）
- 支持任何靜態主機

✨ **自動化**
- 自動生成文章列表
- 自動生成 SEO meta 標籤
- 自動生成搜尋索引
- 自動相鄰文章導航

✨ **易於維護**
- 單個 JSON 文件管理所有文章
- 文章內容即普通 HTML
- 無複雜配置

---

## 🔄 數據流程

```
用户編輯:       posts.json  →  填寫文章元數據
                ↓
                content/xxx.html  →  寫文章內容

系統読取:       blog.html 讀 posts.json  →  顯示列表
                ↓
                post.html 根據 slug 讀 posts.json  →  從 content 加载 HTML  →  顯示文章
```

---

## 📋 常見工作流

### 快速發佈一篇文章

1. 編輯 `blog/posts.json`，添加一個物件
2. （可選）在 `blog/content/` 創建對應的 HTML 檔案
3. 提交到 Git（如果用 GitHub Pages）
4. 完成！（無需任何構建步驟）

### 批量更新現有文章

1. 編輯 `blog/content/*.html` 的內容
2. 可選：在 `posts.json` 修改元數據（title、date 等）
3. 完成！

### 管理文章標籤

- 標籤完全由 `posts.json` 中的 `tags` 陣列控制
- `blog.html` 會自動生成標籤雲
- 無需任何配置

---

## 🚀 部署選項

### 選項 1：GitHub Pages（推薦）

```bash
# 1. 編輯 posts.json 和 content/*.html
# 2. Git commit
git add blog/
git commit -m "新增文章：xxx"
git push origin main

# 3. 自動部署完成！
```

### 選項 2：任何靜態主機

```bash
# 1. 確保 blog/ 目錄在 web root 下
# 2. 上傳所有文件（FTP、Netlify、Vercel 等）
# 3. 完成！
```

### 選項 3：本地測試

```bash
# 直接用瀏覽器打開（file:// 協議）
blog/blog.html
blog/post.html?slug=hello-world
```

---

## ✅ 檢查清單

新增文章時確保：

- [ ] JSON 語法正確（用線上工具驗證：https://jsonlint.com/）
- [ ] `slug` 唯一、英文小寫、用 `-` 分隔
- [ ] `date` 格式為 `YYYY-MM-DD`
- [ ] `tags` 非空陣列
- [ ] `cover` 圖片文件存在
- [ ] 如用 `contentHtml`，確保 HTML 正確
- [ ] 如用 `content`，確保檔案路徑正確且有 `<article>` 標籤
- [ ] 在 `blog.html` 能搜到新文章
- [ ] 用 `slug` 參數能打開文章頁

---

## 🐛 常見問題排除

**问题**：新文章未出現在列表
- ✓ 檢查 JSON 語法（用 jsonlint.com）
- ✓ 檢查 slug、title 非空
- ✓ 清除瀏覽器快取 (Ctrl+Shift+R)

**问题**：文章內容是空白
- ✓ 檢查 `contentHtml` 是否有正確 HTML
- ✓ 如用 `content`，檢查檔案是否存在
- ✓ 檢查 `content/*.html` 中是否有 `<article>` 標籤

**问题**：圖片損毀
- ✓ 檢查檔案是否存在
- ✓ 檢查路徑（相對於根目錄）
- ✓ 對於 GitHub Pages，確保分支是 `main` 或 `gh-pages`

**问题**：搜尋功能不工作
- ✓ 建議文件確實很小，可能是快取問題
- ✓ 嘗試 Ctrl+Shift+R 強制刷新

---

## 📚 文檔索引

- **[QUICKSTART.md](./QUICKSTART.md)** - 5分鐘快速開始
- **[README.md](./README.md)** - 完整操作指南
- **[posts-template.js](./posts-template.js)** - JSON 欄位參考
- **[content/template-example.html](./content/template-example.html)** - HTML 內容模板

---

**系統已完全準備就緒！開始編輯 `posts.json` 並發佈你的文章吧。** 🚀

還有問題？查看完整文檔：[README.md](./README.md)
