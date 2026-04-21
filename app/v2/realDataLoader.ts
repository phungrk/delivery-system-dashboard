import { loadAllMetricsMerged } from "@/lib/parser/metrics";
import { loadSprintFile } from "@/lib/parser/sprint";
import type { Project, Resource, Task, Risk, KPI } from "./mockData";

// ── Status normalisation ──────────────────────────────────────────────────────

function mapTaskStatus(raw: string, overduedays: number | null): Task["status"] {
  if (overduedays && overduedays > 0) return "Overdue";
  const s = raw.toLowerCase().trim();
  if (s === "done" || s === "complete" || s === "completed" || s === "完了") return "Completed";
  if (s === "in progress" || s.includes("đang") || s.includes("inprogress") || s.includes("進行")) return "In Progress";
  if (s === "blocked") return "Pending";
  return "Pending";
}

function normaliseType(raw: string): "Waterfall" | "Scrum" {
  const s = raw.toLowerCase();
  if (s.includes("scrum") || s.includes("agile") || s.includes("kanban") || s.includes("sprint")) return "Scrum";
  return "Waterfall";
}

// ── Main loader ───────────────────────────────────────────────────────────────

export function loadRealData(): { projects: Project[]; resources: Resource[] } {
  const metrics = loadAllMetricsMerged();
  if (metrics.length === 0) return { projects: [], resources: [] };

  // owner → project contributions (used to build Resources)
  const ownerMap: Record<string, {
    name: string;
    projects: { name: string; code: string; total: number; inProgress: number }[];
  }> = {};

  const projects: Project[] = metrics.map((m) => {
    const sprint = loadSprintFile(m.projectCode);

    // ── Status ──────────────────────────────────────────────────────────────
    let status: Project["status"] = "On Track";
    if (m.completion.completionRate >= 98) status = "Completed";
    else if (m.riskLevel === "Critical")   status = "Delayed";
    else if (m.riskLevel === "High")       status = "At Risk";
    else if (m.riskLevel === "Medium")     status = "At Risk";

    // ── Priority ─────────────────────────────────────────────────────────────
    const priority: Project["priority"] =
      m.riskLevel === "Critical" || m.riskLevel === "High" ? "High" :
      m.riskLevel === "Medium" ? "Medium" : "Low";

    // ── Lead ─────────────────────────────────────────────────────────────────
    const sortedOwners = [...m.workload].sort((a, b) => b.total - a.total);
    const lead = sortedOwners[0]?.owner || "-";

    // ── Tasks ─────────────────────────────────────────────────────────────────
    const tasks: Task[] = sprint.tasks.map((t) => ({
      id: t.id,
      name: t.title || t.id,
      assignee: t.owner || "-",
      deliverable: "",
      status: mapTaskStatus(t.status, t.overduedays),
      dueDate: t.due || "-",
    }));

    const totalTasks   = tasks.length;
    const doneTasks    = tasks.filter((t) => t.status === "Completed").length;
    const inProgTasks  = tasks.filter((t) => t.status === "In Progress").length;
    const pendingTasks = tasks.filter((t) => t.status === "Pending").length;
    const overdueTasks = tasks.filter((t) => t.status === "Overdue").length;

    // ── Risks from flags + active blockers ────────────────────────────────────
    const risks: Risk[] = [];
    if (m.activeBlockers > 0) {
      risks.push({
        id: "blocker",
        title: `${m.activeBlockers} active blocker${m.activeBlockers > 1 ? "s" : ""}`,
        status: "Active",
        impact: "High",
        probability: "High",
        owner: lead,
        mitigation: "Blockers require immediate attention and follow-up",
      });
    }
    m.flags.forEach((f, i) => {
      risks.push({
        id: `flag-${i}`,
        title: f,
        status: "Active",
        impact: "Medium",
        probability: "Medium",
        owner: lead,
        mitigation: "Under review",
      });
    });

    // ── Team from workload ────────────────────────────────────────────────────
    const team = m.workload.map((w, i) => ({
      name: w.owner,
      role: w.flag === "OVERLOADED" ? "Team Member (overloaded)" : "Team Member",
      isLead: i === 0,
    }));

    // ── Accumulate owner data for resources ──────────────────────────────────
    for (const w of m.workload) {
      if (!w.owner) continue;
      if (!ownerMap[w.owner]) ownerMap[w.owner] = { name: w.owner, projects: [] };
      ownerMap[w.owner].projects.push({
        name: m.projectName,
        code: m.projectCode,
        total: w.total,
        inProgress: w.inProgress,
      });
    }

    // ── Sprint/time progress info ─────────────────────────────────────────────
    const timePct = m.totalDays > 0 ? m.daysElapsed / m.totalDays : 0;
    const sprintLenDays = 14;
    const sprintsDone = m.totalDays > 0 ? Math.max(0, Math.round(m.daysElapsed / sprintLenDays)) : 0;
    const sprintsTotal = m.totalDays > 0 ? Math.max(1, Math.round(m.totalDays / sprintLenDays)) : 1;

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const kpis: KPI[] = [
      { label: "Completion", value: Math.round(m.completion.completionRate), unit: "%", target: 100, trend: "up", goodDir: "up" },
      { label: "Overdue Rate", value: Math.round(m.completion.overdueRate), unit: "%", target: 0, trend: m.completion.overdueRate > 10 ? "up" : "down", goodDir: "down" },
      { label: "Days Remaining", value: m.daysRemaining, unit: "days", target: 0, trend: "down", goodDir: "up" },
    ];
    if (m.completion.blockRate > 0) {
      kpis.push({ label: "Block Rate", value: Math.round(m.completion.blockRate), unit: "%", target: 0, trend: "up", goodDir: "down" });
    }

    const projectType = normaliseType(m.type || "Waterfall");

    return {
      id: m.projectCode,
      name: m.projectName,
      client: m.projectCode,
      type: projectType,
      status,
      priority,
      startDate: m.period.start || "-",
      endDate: m.period.end || "-",
      lead,
      overdueTasks,
      activeRisks: risks.filter((r) => r.status === "Active").length,
      atRiskDeps: 0,
      progress: Math.round(m.completion.completionRate),
      budget: { total: 0, spent: 0, monthly: [] },
      // Scrum sprint info (used for card body + dialog overview)
      sprintsDone,
      sprintsTotal,
      currentSprint: {
        number: sprintsDone + 1,
        total: sprintsTotal,
        goal: `${m.flags.length > 0 ? m.flags[0] : `${m.daysRemaining} days remaining`}`,
        pointsDone: doneTasks,
        pointsTotal: totalTasks,
        velocity: doneTasks,
        backlog: pendingTasks,
        endDate: m.period.end || "-",
      },
      tasks,
      risks,
      dependencies: [],
      team,
      milestones: [],
      kpis,
    } satisfies Project;
  });

  // ── Build Resources ──────────────────────────────────────────────────────────
  const resources: Resource[] = Object.values(ownerMap).map((owner, i) => {
    const totalTasks   = owner.projects.reduce((s, p) => s + p.total, 0);
    const totalInProg  = owner.projects.reduce((s, p) => s + p.inProgress, 0);
    // Heuristic: each in-progress task = 30%; each assigned task = 10%; cap 98
    const utilization  = Math.min(98, Math.max(20, totalInProg * 30 + Math.max(0, totalTasks - totalInProg) * 10));
    const totalForAlloc = owner.projects.reduce((s, p) => s + p.total, 0) || 1;

    return {
      id: `res-${i}`,
      name: owner.name,
      role: "Team Member",
      department: owner.projects[0]?.code.split("-")[0] || "Engineering",
      utilization,
      projectCount: owner.projects.length,
      skills: [],
      projects: owner.projects.map((p) => ({
        name: p.name,
        allocation: Math.round((p.total / totalForAlloc) * 100),
        role: "Team Member",
      })),
    };
  });

  return { projects, resources };
}
