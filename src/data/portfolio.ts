export type ConnectorNode = {
  id: "business" | "product" | "technology" | "delivery" | "growth" | "ask";
  label: string;
  description: string;
  target: string;
  position: { x: number; y: number };
};

export const connectorNodes: ConnectorNode[] = [
  {
    id: "business",
    label: "Business",
    description: "釐清目標、限制與價值，找到真正值得解決的問題。",
    target: "#capabilities",
    position: { x: 50, y: 8 }
  },
  {
    id: "product",
    label: "Product",
    description: "把需求轉成可驗證的產品決策與優先順序。",
    target: "#work",
    position: { x: 16, y: 36 }
  },
  {
    id: "technology",
    label: "Technology",
    description: "在架構、安全、成本與可維運性之間做出平衡。",
    target: "#labs",
    position: { x: 84, y: 36 }
  },
  {
    id: "delivery",
    label: "Delivery",
    description: "將範疇、依賴、風險與跨部門協作帶進可交付節奏。",
    target: "#experience",
    position: { x: 24, y: 78 }
  },
  {
    id: "growth",
    label: "Growth",
    description: "讓系統持續產生採用、洞察與可複利的營運價值。",
    target: "#work",
    position: { x: 76, y: 78 }
  },
  {
    id: "ask",
    label: "Ask Ken",
    description: "用對話探索我的經歷、專案與工作方法。",
    target: "#ask-ken",
    position: { x: 50, y: 90 }
  }
];

export const projects = [
  {
    index: "01",
    title: "Archi — Verifiable Portfolio Guide",
    category: "AI Automation",
    role: "System Designer",
    image: "/assets/img/portfolio/archi.png",
    imageAlt: "Archi 可驗證履歷導覽 Agent 介面",
    problem: "履歷、案例與技術內容分散，訪客難以快速建立完整理解。",
    decision: "以網站知識庫作為唯一事實來源，回答必須可查核。",
    system: "導覽流程、KB Index、引用、Session 記憶與防幻覺規則。",
    outcome: "將履歷導覽、專案推薦與內容查核整合為單一對話入口。",
    href: "#ask-ken",
    linkLabel: "Ask Ken"
  },
  {
    index: "02",
    title: "CTSS Taiwan — Localized Recruitment Platform",
    category: "Systems Analysis",
    role: "Systems & Delivery Lead",
    image: "/assets/img/portfolio/zhongxin-log.png",
    imageAlt: "CTSS 日本直聘台灣官網識別",
    problem: "日本招募服務缺少台灣官方入口、在地信任資訊與清楚流程。",
    decision: "從需求訪談、資訊架構與 Prototype 開始，建立台灣在地化體驗。",
    system: "招募內容、流程、職缺、FAQ、合作夥伴資訊與部署維運。",
    outcome: "2025/06–2026/07 書審超過 100 人，面談接近 30 人。",
    href: "https://ctssjpit.com",
    linkLabel: "Visit website"
  },
  {
    index: "03",
    title: "STRATOS PM — Planning System",
    category: "Product Delivery",
    role: "Product Builder",
    image: "/assets/img/portfolio/gantt-pm.png",
    imageAlt: "STRATOS PM 甘特圖與任務矩陣",
    problem: "任務、依賴與優先順序分散，難以在同一視角對齊執行。",
    decision: "以 WBS、甘特圖與資料交換機制建立一致規劃模型。",
    system: "需求建模、依賴管理、互動甘特圖、任務矩陣與狀態同步。",
    outcome: "形成可操作、可調整並能持續延伸的專案規劃工具。",
    href: "/tools/gantt.html",
    linkLabel: "Open tool"
  }
] as const;

export const capabilities = [
  {
    code: "SA",
    title: "Systems Analysis",
    methods: ["Stakeholder analysis", "As-is / To-be modeling", "Requirements definition"],
    evidence: ["System specifications", "Process models", "Data and interface definitions"]
  },
  {
    code: "PM",
    title: "Product & Delivery",
    methods: ["Scope and roadmap planning", "Cross-functional alignment", "Risk and issue management"],
    evidence: ["Delivery plans", "Decision records", "UAT and launch coordination"]
  },
  {
    code: "AWS",
    title: "Cloud Architecture",
    methods: ["Solution architecture", "Well-Architected thinking", "Security and cost trade-offs"],
    evidence: ["Architecture diagrams", "Serverless implementations", "Deployment documentation"]
  },
  {
    code: "AI",
    title: "Automation",
    methods: ["Workflow decomposition", "AI service integration", "Human-in-the-loop design"],
    evidence: ["AI agents", "Repeatable workflows", "Operational improvements"]
  }
] as const;

export const labs = [
  {
    title: "AWS VPC Architecture",
    description: "以互動流量路徑理解子網路、安全層與服務整合。",
    href: "/blog/content/awsVPC.html"
  },
  {
    title: "SNS + SQS Fan-Out",
    description: "展示事件驅動、Filtering、局部異常與 DLQ。",
    href: "/blog/content/aws_fanout_archi.html"
  },
  {
    title: "A2A × MCP",
    description: "拆解工具接入與多 Agent 協作的系統角色。",
    href: "/blog/content/a2a_mcp.html"
  }
] as const;
