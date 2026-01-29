# 核心技術棧

## 前端技術

### JavaScript 框架
- **React 18**：大型應用首選，豐富生態 (Redux, React Query, Next.js)
- **Vue 3**：快速原型開發，易學易用
- **Next.js**：全棧 React 框架，支援 SSR / SSG / API Routes

### CSS & 樣式
- **Tailwind CSS**：Utility-first CSS，快速開發高效組件
- **SCSS/SASS**：預處理器，支援變數、混入、嵌套
- **CSS-in-JS**：Styled Components / Emotion

### 狀態管理
- **Redux Toolkit**：大型應用狀態集中管理
- **Zustand**：輕量級替代方案
- **Pinia**：Vue 3 專用狀態管理
- **TanStack Query**：異步資料同步與緩存

### UI 組件庫
- **Ant Design**：企業級 UI 組件集
- **Material-UI**：Google Material Design
- **Shadcn/ui**：高度可自訂的無頭 UI 組件

---

## 後端技術

### Runtime & 框架
- **Node.js + Express**：輕量級高效後端，適合 I/O 密集應用
- **Python + FastAPI**：現代非同步框架，自動 API 文檔
- **Fastify**：Node.js 高性能替代品

### 資料庫
- **PostgreSQL**：ACID 關聯式資料庫，企業級穩定性
- **MongoDB**：靈活 NoSQL，文檔導向儲存
- **Redis**：記憶體快取，用於會話 / 速率限制
- **Elasticsearch**：全文搜尋引擎，支援複雜查詢

### API & 認證
- **REST API**：標準 HTTP 接口設計
- **GraphQL**：靈活資料查詢語言
- **JWT (JSON Web Token)**：無狀態認證機制
- **OAuth 2.0**：第三方整合認證

---

## DevOps & 部署

### 容器化
- **Docker**：應用容器化，保障環境一致性
- **Docker Compose**：多容器編排本地開發
- **Kubernetes**：生產級容器編排平台

### CI/CD 流程
- **GitHub Actions**：內建 CI/CD，與 GitHub 無縫整合
- **GitLab CI**：企業級 CI/CD 解決方案
- **Jenkins**：自託管持續整合服務

### 雲端平台
- **AWS**：全球領先雲端服務商
  - EC2 / ECS：計算服務
  - RDS / DynamoDB：資料庫
  - Lambda：無服務器函數
  - S3：物件儲存
  - CloudFront：CDN 加速
- **Vercel**：Next.js 最佳部署平台
- **Azure**：微軟雲端生態

---

## 資料 & AI

### 資料處理
- **Apache Spark**：大規模分佈式資料處理
- **Apache Airflow**：工作流編排與排程
- **Pandas / NumPy**：Python 資料分析工具

### 機器學習
- **PyTorch / TensorFlow**：深度學習框架
- **Scikit-learn**：傳統機器學習算法
- **LightGBM / XGBoost**：梯度提升決策樹

### 向量資料庫 & 搜尋
- **Faiss**：高效相似度搜尋
- **Milvus**：開源向量資料庫
- **Pinecone**：向量搜尋服務

---

## 開發工具

### 版本控制
- **Git**：分佈式版本管理
- **GitHub / GitLab**：代碼託管與協作平台

### 編譯 & 打包
- **Webpack**：現代 JavaScript 模組打包工具
- **Vite**：下一代前端建置工具，閃電般快速
- **Turbopack**：Rust 實現的超快打包器

### 測試框架
- **Jest**：JavaScript 測試框架
- **Pytest**：Python 測試框架
- **React Testing Library**：React 組件測試

### 監控 & 日誌
- **Sentry**：錯誤追蹤與監控
- **DataDog**：全棧監控平台
- **ELK Stack**：Elasticsearch + Logstash + Kibana

---

## 學習建議

### 初級開發者
1. 掌握 HTML / CSS / JavaScript 基礎
2. 學習 React / Vue 其一
3. 理解 REST API 與資料庫設計
4. 嘗試簡單全棧項目

### 中級開發者
1. 深入框架特性 (SSR / SSG / Data Fetching)
2. 學習狀態管理與性能優化
3. 掌握 Docker 與基本部署
4. 參與開源貢獻

### 高級開發者
1. 微服務架構與分佈式系統
2. Kubernetes 與高級 DevOps
3. 機器學習集成與模型部署
4. 系統設計與架構規劃

---

## 技術選型指南

| 需求 | 推薦技術 | 理由 |
|------|---------|------|
| 快速原型 | Next.js + Tailwind | 開箱即用，快速迭代 |
| 企業應用 | React + TypeScript + Node.js | 類型安全，大型團隊協作 |
| 資料分析 | Python + FastAPI + PostgreSQL | 科學計算生態成熟 |
| 實時應用 | Vue + Socket.io + Redis | 輕量高效 |
| AI / ML | Python + PyTorch + FastAPI | 業界標準框架 |
| 行動應用 | React Native / Flutter | 跨平台複用代碼 |

---

更多技術細節與最佳實踐，請在聊天框提問。
