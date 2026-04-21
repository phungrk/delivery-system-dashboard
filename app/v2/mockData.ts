// ── Types ────────────────────────────────────────────────────────────────────

export type PhaseStatus = "Completed" | "On Track" | "At Risk" | "Delayed" | "To Do";
export type ProjectType = "Waterfall" | "Scrum";
export type ProjectStatus = "On Track" | "At Risk" | "Delayed" | "Completed";
export type Priority = "High" | "Medium" | "Low";
export type TaskStatus = "To Do" | "In Progress" | "Blocked" | "Done";
export type RiskLevel = "High" | "Medium" | "Low";
export type RiskStatus = "Active" | "Mitigated" | "Closed";
export type DepStatus = "Met" | "At Risk" | "Pending";
export type DepType = "Blocks" | "Blocked By" | "Related To";
export type TrendDir = "up" | "down" | "flat";

export interface Phase {
  name: string;
  status: PhaseStatus;
  endDate: string;
  progress: number;
}

export interface Sprint {
  number: number;
  total: number;
  goal: string;
  pointsDone: number;
  pointsTotal: number;
  velocity: number;
  backlog: number;
  endDate: string;
}

export interface Task {
  id: string;
  name: string;
  assignee: string;
  deliverable: string;
  status: TaskStatus;
  dueDate: string;
}

export interface Risk {
  id: string;
  title: string;
  status: RiskStatus;
  impact: RiskLevel;
  probability: RiskLevel;
  owner: string;
  mitigation: string;
}

export interface Dependency {
  id: string;
  project: string;
  type: DepType;
  status: DepStatus;
  description: string;
}

export interface TeamMember {
  name: string;
  role: string;
  isLead: boolean;
}

export interface BudgetMonth {
  month: string;
  planned: number;
  actual: number;
}

export interface Milestone {
  name: string;
  date: string;
  completed: boolean;
}

export interface KPI {
  label: string;
  value: number;
  unit: string;
  target: number;
  trend: TrendDir;
  goodDir: "up" | "down";
}

export interface Project {
  id: string;
  name: string;
  client: string;
  type: ProjectType;
  status: ProjectStatus;
  priority: Priority;
  startDate: string;
  endDate: string;
  lead: string;
  overdueTasks: number;
  activeRisks: number;
  atRiskDeps: number;
  budget: {
    total: number;
    spent: number;
    monthly: BudgetMonth[];
  };
  progress: number;
  // Waterfall
  phases?: Phase[];
  // Scrum
  sprintsDone?: number;
  sprintsTotal?: number;
  currentSprint?: Sprint;
  // Common
  tasks: Task[];
  risks: Risk[];
  dependencies: Dependency[];
  team: TeamMember[];
  milestones: Milestone[];
  kpis: KPI[];
}

export interface Resource {
  id: string;
  name: string;
  role: string;
  department: string;
  utilization: number;
  projectCount: number;
  skills: string[];
  projects: { name: string; allocation: number; role: string }[];
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

export const PROJECTS: Project[] = [
  {
    id: "P001",
    name: "E-Commerce Platform Redesign",
    client: "RetailCo Vietnam",
    type: "Waterfall",
    status: "On Track",
    priority: "High",
    startDate: "2026-01-15",
    endDate: "2026-07-31",
    lead: "Alice Nguyen",
    overdueTasks: 2,
    activeRisks: 1,
    atRiskDeps: 0,
    progress: 58,
    budget: {
      total: 280000,
      spent: 148000,
      monthly: [
        { month: "Jan", planned: 40000, actual: 38000 },
        { month: "Feb", planned: 45000, actual: 42000 },
        { month: "Mar", planned: 50000, actual: 48000 },
        { month: "Apr", planned: 55000, actual: 20000 },
        { month: "May", planned: 50000, actual: 0 },
        { month: "Jun", planned: 40000, actual: 0 },
      ],
    },
    phases: [
      { name: "Design", status: "Completed", endDate: "2026-02-28", progress: 100 },
      { name: "Impl.", status: "On Track", endDate: "2026-04-30", progress: 65 },
      { name: "Verif.", status: "To Do", endDate: "2026-05-31", progress: 0 },
      { name: "Approv.", status: "To Do", endDate: "2026-06-30", progress: 0 },
      { name: "Release", status: "To Do", endDate: "2026-07-15", progress: 0 },
      { name: "Post", status: "To Do", endDate: "2026-07-31", progress: 0 },
    ],
    tasks: [
      { id: "T001", name: "UI Component Library", assignee: "Emily Ho", deliverable: "Design System", status: "Done", dueDate: "2026-02-15" },
      { id: "T002", name: "Product Catalog API", assignee: "Carol Le", deliverable: "Backend Service", status: "In Progress", dueDate: "2026-04-20" },
      { id: "T003", name: "Payment Integration", assignee: "Jack Chen", deliverable: "Payment Module", status: "In Progress", dueDate: "2026-04-25" },
      { id: "T004", name: "Mobile Responsive Design", assignee: "Emily Ho", deliverable: "UI Templates", status: "Blocked", dueDate: "2026-04-10" },
      { id: "T005", name: "Load Testing", assignee: "David Pham", deliverable: "Test Report", status: "To Do", dueDate: "2026-05-10" },
    ],
    risks: [
      { id: "R001", title: "Third-party payment gateway API changes", status: "Active", impact: "High", probability: "Medium", owner: "Jack Chen", mitigation: "Monitor API changelog weekly; maintain fallback provider" },
      { id: "R002", title: "UI performance on mobile devices", status: "Mitigated", impact: "Medium", probability: "Low", owner: "Emily Ho", mitigation: "Implemented lazy loading and code splitting" },
    ],
    dependencies: [
      { id: "D001", project: "ERP System Integration", type: "Blocked By", status: "At Risk", description: "Customer data sync API must be ready before product catalog" },
      { id: "D002", project: "Mobile Banking App", type: "Related To", status: "Met", description: "Shared authentication service" },
    ],
    team: [
      { name: "Alice Nguyen", role: "Project Manager", isLead: true },
      { name: "Emily Ho", role: "Frontend Developer", isLead: false },
      { name: "Carol Le", role: "Backend Developer", isLead: false },
      { name: "Jack Chen", role: "Backend Developer", isLead: false },
      { name: "David Pham", role: "QA Engineer", isLead: false },
    ],
    milestones: [
      { name: "Design Sign-off", date: "2026-02-28", completed: true },
      { name: "Alpha Release", date: "2026-04-30", completed: false },
      { name: "UAT Complete", date: "2026-06-15", completed: false },
      { name: "Go-Live", date: "2026-07-31", completed: false },
    ],
    kpis: [
      { label: "Sprint Velocity", value: 42, unit: "pts", target: 45, trend: "up", goodDir: "up" },
      { label: "Bug Rate", value: 3.2, unit: "%", target: 2.0, trend: "down", goodDir: "down" },
      { label: "Test Coverage", value: 78, unit: "%", target: 85, trend: "up", goodDir: "up" },
      { label: "Deploy Frequency", value: 8, unit: "/wk", target: 10, trend: "flat", goodDir: "up" },
    ],
  },
  {
    id: "P002",
    name: "ERP System Integration",
    client: "ManufacturePro Ltd",
    type: "Waterfall",
    status: "Delayed",
    priority: "High",
    startDate: "2025-10-01",
    endDate: "2026-05-31",
    lead: "Henry Dao",
    overdueTasks: 5,
    activeRisks: 3,
    atRiskDeps: 2,
    progress: 42,
    budget: {
      total: 420000,
      spent: 398000,
      monthly: [
        { month: "Oct", planned: 60000, actual: 72000 },
        { month: "Nov", planned: 65000, actual: 78000 },
        { month: "Dec", planned: 70000, actual: 82000 },
        { month: "Jan", planned: 75000, actual: 88000 },
        { month: "Feb", planned: 80000, actual: 78000 },
        { month: "Mar", planned: 70000, actual: 0 },
      ],
    },
    phases: [
      { name: "Design", status: "Completed", endDate: "2025-11-30", progress: 100 },
      { name: "Impl.", status: "Delayed", endDate: "2026-02-28", progress: 55 },
      { name: "Verif.", status: "At Risk", endDate: "2026-03-31", progress: 10 },
      { name: "Approv.", status: "To Do", endDate: "2026-04-30", progress: 0 },
      { name: "Release", status: "To Do", endDate: "2026-05-15", progress: 0 },
      { name: "Post", status: "To Do", endDate: "2026-05-31", progress: 0 },
    ],
    tasks: [
      { id: "T010", name: "SAP Connector Module", assignee: "Henry Dao", deliverable: "Integration Layer", status: "Blocked", dueDate: "2026-03-01" },
      { id: "T011", name: "Data Migration Scripts", assignee: "Carol Le", deliverable: "Migration Package", status: "Blocked", dueDate: "2026-03-10" },
      { id: "T012", name: "Inventory Sync Service", assignee: "Jack Chen", deliverable: "Sync Service", status: "In Progress", dueDate: "2026-04-05" },
      { id: "T013", name: "UAT Test Plan", assignee: "David Pham", deliverable: "Test Documentation", status: "To Do", dueDate: "2026-04-15" },
      { id: "T014", name: "Staff Training Material", assignee: "Grace Liu", deliverable: "Training Docs", status: "To Do", dueDate: "2026-05-01" },
    ],
    risks: [
      { id: "R010", title: "SAP API deprecation in Q2 2026", status: "Active", impact: "High", probability: "High", owner: "Henry Dao", mitigation: "Escalate to SAP vendor for migration path; assess alternative connectors" },
      { id: "R011", title: "Data quality issues in legacy system", status: "Active", impact: "High", probability: "Medium", owner: "Carol Le", mitigation: "Data cleansing sprint planned for April" },
      { id: "R012", title: "Resource availability during migration", status: "Active", impact: "Medium", probability: "High", owner: "Grace Liu", mitigation: "Extended timeline negotiated with client; backup resources identified" },
      { id: "R013", title: "Network latency between systems", status: "Mitigated", impact: "Medium", probability: "Low", owner: "Frank Vo", mitigation: "VPN tunnel configured; latency within acceptable range" },
    ],
    dependencies: [
      { id: "D010", project: "E-Commerce Platform Redesign", type: "Blocks", status: "At Risk", description: "Customer data sync API for product catalog sync" },
      { id: "D011", project: "Customer Portal", type: "Blocks", status: "At Risk", description: "User account management API" },
    ],
    team: [
      { name: "Henry Dao", role: "Tech Lead", isLead: true },
      { name: "Carol Le", role: "Backend Developer", isLead: false },
      { name: "Jack Chen", role: "Backend Developer", isLead: false },
      { name: "Frank Vo", role: "DevOps Engineer", isLead: false },
      { name: "Grace Liu", role: "Business Analyst", isLead: false },
      { name: "David Pham", role: "QA Engineer", isLead: false },
    ],
    milestones: [
      { name: "Architecture Sign-off", date: "2025-11-15", completed: true },
      { name: "Integration Complete", date: "2026-02-28", completed: false },
      { name: "Data Migration Done", date: "2026-03-31", completed: false },
      { name: "Go-Live", date: "2026-05-31", completed: false },
    ],
    kpis: [
      { label: "Integration Tests", value: 145, unit: "passed", target: 200, trend: "up", goodDir: "up" },
      { label: "Data Quality", value: 87, unit: "%", target: 99, trend: "up", goodDir: "up" },
      { label: "Budget Variance", value: 18, unit: "%", target: 10, trend: "down", goodDir: "down" },
    ],
  },
  {
    id: "P003",
    name: "Mobile Banking App",
    client: "FinanceFirst Bank",
    type: "Waterfall",
    status: "At Risk",
    priority: "Medium",
    startDate: "2026-02-01",
    endDate: "2026-09-30",
    lead: "Bob Tran",
    overdueTasks: 1,
    activeRisks: 2,
    atRiskDeps: 1,
    progress: 22,
    budget: {
      total: 350000,
      spent: 68000,
      monthly: [
        { month: "Feb", planned: 30000, actual: 28000 },
        { month: "Mar", planned: 40000, actual: 40000 },
        { month: "Apr", planned: 50000, actual: 0 },
        { month: "May", planned: 60000, actual: 0 },
        { month: "Jun", planned: 70000, actual: 0 },
        { month: "Jul", planned: 60000, actual: 0 },
      ],
    },
    phases: [
      { name: "Design", status: "On Track", endDate: "2026-03-31", progress: 80 },
      { name: "Impl.", status: "To Do", endDate: "2026-06-30", progress: 0 },
      { name: "Verif.", status: "To Do", endDate: "2026-07-31", progress: 0 },
      { name: "Approv.", status: "To Do", endDate: "2026-08-31", progress: 0 },
      { name: "Release", status: "To Do", endDate: "2026-09-15", progress: 0 },
      { name: "Post", status: "To Do", endDate: "2026-09-30", progress: 0 },
    ],
    tasks: [
      { id: "T020", name: "UX Wireframes", assignee: "Bob Tran", deliverable: "Design Files", status: "In Progress", dueDate: "2026-04-25" },
      { id: "T021", name: "Security Architecture", assignee: "Frank Vo", deliverable: "Arch Document", status: "Blocked", dueDate: "2026-04-15" },
      { id: "T022", name: "Prototype — Login Flow", assignee: "Emily Ho", deliverable: "Interactive Prototype", status: "In Progress", dueDate: "2026-04-30" },
      { id: "T023", name: "Biometric Auth Design", assignee: "Bob Tran", deliverable: "Technical Spec", status: "To Do", dueDate: "2026-05-10" },
    ],
    risks: [
      { id: "R020", title: "Regulatory compliance approval delay", status: "Active", impact: "High", probability: "Medium", owner: "Bob Tran", mitigation: "Pre-submission review with legal team; early engagement with regulator" },
      { id: "R021", title: "Biometric SDK compatibility", status: "Active", impact: "Medium", probability: "Medium", owner: "Frank Vo", mitigation: "POC on target devices; fallback PIN authentication ready" },
      { id: "R022", title: "Client scope creep", status: "Mitigated", impact: "Medium", probability: "Low", owner: "Bob Tran", mitigation: "Change request process enforced; signed scope document" },
    ],
    dependencies: [
      { id: "D020", project: "E-Commerce Platform Redesign", type: "Related To", status: "Met", description: "Shared authentication service" },
      { id: "D021", project: "API Gateway Modernization", type: "Blocked By", status: "At Risk", description: "Unified API gateway required for banking APIs" },
    ],
    team: [
      { name: "Bob Tran", role: "Project Manager", isLead: true },
      { name: "Emily Ho", role: "Frontend Developer", isLead: false },
      { name: "Frank Vo", role: "DevOps / Security", isLead: false },
    ],
    milestones: [
      { name: "UX Sign-off", date: "2026-04-30", completed: false },
      { name: "Beta Build", date: "2026-07-15", completed: false },
      { name: "Regulatory Approval", date: "2026-08-31", completed: false },
      { name: "Go-Live", date: "2026-09-30", completed: false },
    ],
    kpis: [
      { label: "Design Approval", value: 3, unit: "of 8", target: 8, trend: "up", goodDir: "up" },
      { label: "Security Findings", value: 0, unit: "critical", target: 0, trend: "flat", goodDir: "down" },
    ],
  },
  {
    id: "P004",
    name: "Customer Portal",
    client: "ServiceCo Group",
    type: "Scrum",
    status: "On Track",
    priority: "Medium",
    startDate: "2026-01-05",
    endDate: "2026-06-30",
    lead: "Iris Wong",
    overdueTasks: 0,
    activeRisks: 1,
    atRiskDeps: 1,
    progress: 72,
    budget: {
      total: 180000,
      spent: 118000,
      monthly: [
        { month: "Jan", planned: 25000, actual: 22000 },
        { month: "Feb", planned: 28000, actual: 27000 },
        { month: "Mar", planned: 32000, actual: 35000 },
        { month: "Apr", planned: 35000, actual: 34000 },
        { month: "May", planned: 30000, actual: 0 },
        { month: "Jun", planned: 30000, actual: 0 },
      ],
    },
    sprintsDone: 6,
    sprintsTotal: 8,
    currentSprint: {
      number: 7,
      total: 8,
      goal: "Complete self-service ticket system and notifications module",
      pointsDone: 28,
      pointsTotal: 38,
      velocity: 36,
      backlog: 12,
      endDate: "2026-05-02",
    },
    tasks: [
      { id: "T030", name: "Ticket Submission Form", assignee: "Emily Ho", deliverable: "UI Component", status: "Done", dueDate: "2026-04-18" },
      { id: "T031", name: "Notification Service", assignee: "Jack Chen", deliverable: "Backend Service", status: "In Progress", dueDate: "2026-04-28" },
      { id: "T032", name: "Email Templates", assignee: "Grace Liu", deliverable: "HTML Templates", status: "In Progress", dueDate: "2026-04-25" },
      { id: "T033", name: "Accessibility Audit", assignee: "David Pham", deliverable: "Audit Report", status: "To Do", dueDate: "2026-05-02" },
    ],
    risks: [
      { id: "R030", title: "ERP integration dependency delay", status: "Active", impact: "High", probability: "Medium", owner: "Iris Wong", mitigation: "Mock API layer in place; escalated to ERP team" },
    ],
    dependencies: [
      { id: "D030", project: "ERP System Integration", type: "Blocked By", status: "At Risk", description: "User account management API" },
    ],
    team: [
      { name: "Iris Wong", role: "Scrum Master", isLead: true },
      { name: "Emily Ho", role: "Frontend Developer", isLead: false },
      { name: "Jack Chen", role: "Backend Developer", isLead: false },
      { name: "Grace Liu", role: "Business Analyst", isLead: false },
      { name: "David Pham", role: "QA Engineer", isLead: false },
    ],
    milestones: [
      { name: "Sprint 3 Demo", date: "2026-02-28", completed: true },
      { name: "Sprint 5 Demo", date: "2026-03-28", completed: true },
      { name: "Beta Launch", date: "2026-05-15", completed: false },
      { name: "Production Release", date: "2026-06-30", completed: false },
    ],
    kpis: [
      { label: "Velocity", value: 36, unit: "pts", target: 38, trend: "up", goodDir: "up" },
      { label: "Sprint Goal Hit", value: 5, unit: "of 6", target: 6, trend: "up", goodDir: "up" },
      { label: "Bug Backlog", value: 8, unit: "items", target: 5, trend: "down", goodDir: "down" },
    ],
  },
  {
    id: "P005",
    name: "Analytics Dashboard",
    client: "DataInsights Corp",
    type: "Scrum",
    status: "At Risk",
    priority: "High",
    startDate: "2026-02-15",
    endDate: "2026-07-15",
    lead: "Henry Dao",
    overdueTasks: 3,
    activeRisks: 2,
    atRiskDeps: 0,
    progress: 35,
    budget: {
      total: 210000,
      spent: 105000,
      monthly: [
        { month: "Feb", planned: 30000, actual: 35000 },
        { month: "Mar", planned: 40000, actual: 48000 },
        { month: "Apr", planned: 45000, actual: 22000 },
        { month: "May", planned: 45000, actual: 0 },
        { month: "Jun", planned: 30000, actual: 0 },
        { month: "Jul", planned: 20000, actual: 0 },
      ],
    },
    sprintsDone: 2,
    sprintsTotal: 5,
    currentSprint: {
      number: 3,
      total: 5,
      goal: "Real-time data pipeline and chart rendering engine",
      pointsDone: 15,
      pointsTotal: 40,
      velocity: 28,
      backlog: 38,
      endDate: "2026-05-09",
    },
    tasks: [
      { id: "T040", name: "Data Pipeline Architecture", assignee: "Henry Dao", deliverable: "Architecture Doc", status: "Done", dueDate: "2026-03-15" },
      { id: "T041", name: "Chart Rendering Engine", assignee: "Emily Ho", deliverable: "Chart Library", status: "In Progress", dueDate: "2026-04-30" },
      { id: "T042", name: "Real-time WebSocket Feed", assignee: "Carol Le", deliverable: "WebSocket Service", status: "Blocked", dueDate: "2026-04-15" },
      { id: "T043", name: "Dashboard Filters", assignee: "Emily Ho", deliverable: "Filter Components", status: "Blocked", dueDate: "2026-04-20" },
      { id: "T044", name: "Export to PDF/CSV", assignee: "Jack Chen", deliverable: "Export Module", status: "To Do", dueDate: "2026-05-20" },
    ],
    risks: [
      { id: "R040", title: "Real-time processing performance", status: "Active", impact: "High", probability: "High", owner: "Henry Dao", mitigation: "Performance profiling sprint; evaluate streaming alternatives" },
      { id: "R041", title: "Client data volume larger than estimated", status: "Active", impact: "Medium", probability: "Medium", owner: "Carol Le", mitigation: "Pagination and sampling strategies implemented" },
    ],
    dependencies: [],
    team: [
      { name: "Henry Dao", role: "Tech Lead", isLead: true },
      { name: "Emily Ho", role: "Frontend Developer", isLead: false },
      { name: "Carol Le", role: "Backend Developer", isLead: false },
      { name: "Jack Chen", role: "Backend Developer", isLead: false },
    ],
    milestones: [
      { name: "Architecture Complete", date: "2026-03-15", completed: true },
      { name: "Sprint 3 Review", date: "2026-05-09", completed: false },
      { name: "Beta Launch", date: "2026-06-15", completed: false },
      { name: "Production Release", date: "2026-07-15", completed: false },
    ],
    kpis: [
      { label: "Velocity", value: 28, unit: "pts", target: 40, trend: "down", goodDir: "up" },
      { label: "Overdue Tasks", value: 3, unit: "items", target: 0, trend: "up", goodDir: "down" },
      { label: "Test Coverage", value: 62, unit: "%", target: 80, trend: "up", goodDir: "up" },
    ],
  },
  {
    id: "P006",
    name: "API Gateway Modernization",
    client: "Internal",
    type: "Scrum",
    status: "Completed",
    priority: "Low",
    startDate: "2025-09-01",
    endDate: "2026-03-31",
    lead: "Frank Vo",
    overdueTasks: 0,
    activeRisks: 0,
    atRiskDeps: 0,
    progress: 100,
    budget: {
      total: 120000,
      spent: 114000,
      monthly: [
        { month: "Sep", planned: 20000, actual: 19000 },
        { month: "Oct", planned: 22000, actual: 21000 },
        { month: "Nov", planned: 22000, actual: 23000 },
        { month: "Dec", planned: 20000, actual: 21000 },
        { month: "Jan", planned: 18000, actual: 17000 },
        { month: "Feb", planned: 18000, actual: 13000 },
      ],
    },
    sprintsDone: 6,
    sprintsTotal: 6,
    currentSprint: {
      number: 6,
      total: 6,
      goal: "Final performance tuning and documentation",
      pointsDone: 35,
      pointsTotal: 35,
      velocity: 34,
      backlog: 0,
      endDate: "2026-03-31",
    },
    tasks: [
      { id: "T050", name: "Service Mesh Setup", assignee: "Frank Vo", deliverable: "Infrastructure", status: "Done", dueDate: "2026-01-31" },
      { id: "T051", name: "Rate Limiting Module", assignee: "Carol Le", deliverable: "API Module", status: "Done", dueDate: "2026-02-15" },
      { id: "T052", name: "Monitoring Dashboard", assignee: "Frank Vo", deliverable: "Grafana Dashboards", status: "Done", dueDate: "2026-03-15" },
      { id: "T053", name: "Load Test Report", assignee: "David Pham", deliverable: "Performance Report", status: "Done", dueDate: "2026-03-25" },
    ],
    risks: [
      { id: "R050", title: "Legacy service compatibility", status: "Closed", impact: "Medium", probability: "Low", owner: "Frank Vo", mitigation: "Adapter pattern implemented for all legacy services" },
    ],
    dependencies: [
      { id: "D050", project: "Mobile Banking App", type: "Blocks", status: "Pending", description: "Unified API gateway for banking APIs" },
    ],
    team: [
      { name: "Frank Vo", role: "DevOps Lead", isLead: true },
      { name: "Carol Le", role: "Backend Developer", isLead: false },
      { name: "David Pham", role: "QA Engineer", isLead: false },
    ],
    milestones: [
      { name: "Service Mesh Live", date: "2026-01-31", completed: true },
      { name: "Rate Limiting Live", date: "2026-02-28", completed: true },
      { name: "Full Migration", date: "2026-03-31", completed: true },
    ],
    kpis: [
      { label: "Latency P99", value: 45, unit: "ms", target: 50, trend: "down", goodDir: "down" },
      { label: "Uptime", value: 99.98, unit: "%", target: 99.9, trend: "up", goodDir: "up" },
      { label: "Services Migrated", value: 18, unit: "of 18", target: 18, trend: "up", goodDir: "up" },
    ],
  },
];

export const RESOURCES: Resource[] = [
  {
    id: "R001", name: "Alice Nguyen", role: "Senior Project Manager", department: "Delivery",
    utilization: 85, projectCount: 2, skills: ["PMP", "Agile", "Stakeholder Mgmt", "Risk Analysis"],
    projects: [{ name: "E-Commerce Platform Redesign", allocation: 70, role: "Project Manager" }, { name: "Customer Portal", allocation: 15, role: "Advisor" }],
  },
  {
    id: "R002", name: "Bob Tran", role: "UI/UX Designer", department: "Design",
    utilization: 90, projectCount: 2, skills: ["Figma", "UX Research", "Prototyping", "Design Systems", "Accessibility"],
    projects: [{ name: "Mobile Banking App", allocation: 80, role: "Lead Designer" }, { name: "E-Commerce Platform Redesign", allocation: 10, role: "UX Consultant" }],
  },
  {
    id: "R003", name: "Carol Le", role: "Backend Developer", department: "Engineering",
    utilization: 98, projectCount: 3, skills: ["Java", "Spring Boot", "Kafka", "PostgreSQL", "Redis"],
    projects: [{ name: "ERP System Integration", allocation: 50, role: "Senior Developer" }, { name: "Analytics Dashboard", allocation: 30, role: "Backend Dev" }, { name: "API Gateway Modernization", allocation: 18, role: "Contributor" }],
  },
  {
    id: "R004", name: "David Pham", role: "QA Engineer", department: "Quality",
    utilization: 75, projectCount: 3, skills: ["Selenium", "JMeter", "Test Automation", "API Testing"],
    projects: [{ name: "E-Commerce Platform Redesign", allocation: 35, role: "QA Lead" }, { name: "Customer Portal", allocation: 25, role: "QA Engineer" }, { name: "API Gateway Modernization", allocation: 15, role: "Performance QA" }],
  },
  {
    id: "R005", name: "Emily Ho", role: "Frontend Developer", department: "Engineering",
    utilization: 95, projectCount: 3, skills: ["React", "TypeScript", "TailwindCSS", "Next.js", "Recharts"],
    projects: [{ name: "E-Commerce Platform Redesign", allocation: 40, role: "Frontend Lead" }, { name: "Analytics Dashboard", allocation: 35, role: "Frontend Dev" }, { name: "Mobile Banking App", allocation: 20, role: "UI Developer" }],
  },
  {
    id: "R006", name: "Frank Vo", role: "DevOps Engineer", department: "Infrastructure",
    utilization: 60, projectCount: 2, skills: ["Kubernetes", "Terraform", "CI/CD", "AWS", "Monitoring"],
    projects: [{ name: "API Gateway Modernization", allocation: 50, role: "DevOps Lead" }, { name: "Mobile Banking App", allocation: 10, role: "Security Advisor" }],
  },
  {
    id: "R007", name: "Grace Liu", role: "Business Analyst", department: "Delivery",
    utilization: 70, projectCount: 2, skills: ["Requirements Analysis", "Process Modeling", "BPMN", "SQL"],
    projects: [{ name: "ERP System Integration", allocation: 50, role: "Lead BA" }, { name: "Customer Portal", allocation: 20, role: "BA" }],
  },
  {
    id: "R008", name: "Henry Dao", role: "Tech Lead", department: "Engineering",
    utilization: 100, projectCount: 2, skills: ["System Design", "Java", "Node.js", "Microservices", "DDD"],
    projects: [{ name: "ERP System Integration", allocation: 60, role: "Tech Lead" }, { name: "Analytics Dashboard", allocation: 40, role: "Tech Lead" }],
  },
  {
    id: "R009", name: "Iris Wong", role: "Scrum Master", department: "Delivery",
    utilization: 65, projectCount: 2, skills: ["Scrum", "SAFe", "Team Coaching", "Facilitation", "Jira"],
    projects: [{ name: "Customer Portal", allocation: 50, role: "Scrum Master" }, { name: "Analytics Dashboard", allocation: 15, role: "Agile Coach" }],
  },
  {
    id: "R010", name: "Jack Chen", role: "Backend Developer", department: "Engineering",
    utilization: 88, projectCount: 3, skills: ["Node.js", "Python", "MongoDB", "REST APIs", "GraphQL"],
    projects: [{ name: "E-Commerce Platform Redesign", allocation: 40, role: "Backend Dev" }, { name: "ERP System Integration", allocation: 30, role: "Integration Dev" }, { name: "Customer Portal", allocation: 18, role: "Backend Dev" }],
  },
];
