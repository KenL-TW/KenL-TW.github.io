# 專案：AWS VPC 進階架構視覺化：真實流量模擬與安全設計

## 一句話摘要
整合 WAF、ALB、ASG、Bastion、NAT Gateway 與 S3 Endpoint，以互動式情境模擬真實 VPC 流量路徑，深入理解子網路規劃與常見配置陷阱。

## 來源資訊
- 發佈日期：2026-03-29
- 文章 Slug：aws-vpc
- 原文連結：https://kenl-tw.github.io/blog/post.html?slug=aws-vpc
- 封面圖：assets/img/blog/auto_agent_flow.png
- 內容檔：blog/content/awsVPC.html

## 核心重點（可持續補充）
- 問題背景：VPC 子網路配置錯誤（路由表漏配、過度開放 Security Group）、流量走錯路徑（EC2 經 NAT 打 S3 產生高費用）是生產環境常見痛點，缺乏視覺化工具難以直覺理解。
- 方法框架：以互動架構圖展示 7 個真實情境（正常 HTTPS 流量、DB 存取、SSH Bastion、NAT 出口、WAF 攔截、路由表錯誤、S3 高費用路徑），每個情境有動畫資料流 strip 標示節點順序。
- 實務應用：分為 Public/Private App/Private DB 三層子網，跨雙 AZ (1a/1c) 部署，包含 ASG + ALB + WAF 入口、NAT Gateway 出口、S3 Gateway Endpoint 省費設計與 Bastion 跳板機 SSH 管理。
- 風險與限制：Private Subnet 若 Route Table 漏配 0.0.0.0/0 → NAT Gateway，EC2 無法連外（nat_error 情境）；EC2 不走 S3 Gateway Endpoint 改走 NAT 會產生 NAT 資料處理費（s3_money 情境）；WAF 需配置 Web ACL 規則才能有效阻擋 SQLi/XSS。

## 架構元件清單
| 元件 | 層級 | 功能 |
|------|------|------|
| Internet Gateway (IGW) | VPC 邊界 | 網際網路雙向流量入口 |
| AWS WAF | 應用層安全 | Web ACL 過濾惡意請求（SQLi、XSS） |
| ALB (Application Load Balancer) | 負載均衡 | HTTP/HTTPS 流量分發至 AZ |
| NAT Gateway | Public Subnet | Private Subnet EC2 出站存取網際網路 |
| Bastion Host | Public Subnet | SSH 跳板機，管理員安全進入私有子網 |
| App EC2 (ASG) | Private App Subnet | 應用層，受 Auto Scaling Group 管理 |
| RDS Primary/Standby | Private DB Subnet | 資料庫層，跨 AZ 高可用 |
| S3 Gateway Endpoint | VPC 路由 | EC2 → S3 走 AWS 內部網路，不經 NAT |

## 情境對照表
| 情境 ID | 說明 | 是否為錯誤情境 |
|---------|------|----------------|
| normal_web | User HTTPS 正常存取 → IGW → WAF → ALB → EC2 | 否 |
| app_to_db | EC2 → RDS 內部資料庫查詢 | 否 |
| admin_ssh | 管理員 → IGW → Bastion → EC2 SSH 連線 | 否 |
| app_update | EC2 → NAT → IGW 更新套件 | 否 |
| waf_block | Hacker SQLi → IGW → WAF 攔截（回傳 403） | 是 |
| nat_error | EC2 嘗試出站但路由表漏配 NAT，流量卡住 | 是 |
| s3_money | EC2 → NAT → IGW → S3（應改走 Gateway Endpoint） | 是 |

## 關鍵字
#blog #aws #architecture #vpc #networking #security #waf #alb #nat #bastion #subnet #route-table #s3-endpoint #asg #rds
