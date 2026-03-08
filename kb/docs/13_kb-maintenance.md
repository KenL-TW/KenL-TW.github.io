# KB Maintenance（知識庫維運規範）

本文件定義內容更新流程，確保網站、知識庫與索引一致。

## 一、更新觸發條件
- 新增或修改專案頁
- 新增工具頁或教學文章
- 履歷、證照或聯絡資訊異動

## 二、標準更新流程
1. 更新對應 Markdown（docs / projects / resume）
2. 更新 kb/index.json chunks 與 generated_at
3. 更新 sitemap.xml（若有新可公開頁面）
4. 驗證 JSON 與檔案格式
5. 發佈後抽查主要路徑可讀性

## 三、命名與內容規則
- 檔名：英文小寫、使用連字號
- 內容：繁體中文為主，避免空白檔
- 文風：先結論、後依據，避免模糊敘述
- 查核項：年份、證照、量化內容需可追溯

## 四、建議檢查清單
- 是否還有模板占位文字（如 ...）
- 是否殘留不必要引用符號
- path 與實際檔案是否一致
- FAQ 與 Site Map 是否同步新內容

## 五、維護頻率
- 每次重大更新即時維護
- 每月固定盤點一次，清理過時內容

## 六、半自動同步（Blog -> KB）
- 指令（單篇）：`node scripts/sync-blog-to-kb.js --slug <post-slug>`
- 指令（全部）：`node scripts/sync-blog-to-kb.js`
- 指令（啟用 OpenAI 摘要）：`node scripts/sync-blog-to-kb.js --ai`
- 腳本行為：
	- 建立或更新 `kb/projects/p_<slug>.md`
	- 自動補 `kb/index.json` 的 `chunks`
	- 更新 `kb/index.json` 的 `generated_at`

### 本機金鑰設定（不進 Git）
- 建立本機檔案：`.env.local`（可參考 `.env.local.example`）
- 建議設定：
	- `OPENAI_API_KEY=...`
	- `OPENAI_MODEL=gpt-4.1-mini`
- `.gitignore` 已排除 `.env.local`，不會被推送到 GitHub。
