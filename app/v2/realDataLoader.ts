import { loadAllMetricsMerged } from "@/lib/parser/metrics";
import { loadSprintFile } from "@/lib/parser/sprint";
import { loadInsights } from "@/lib/parser/insights";
import { deriveProjectStatus } from "@/lib/projectStatus";
import type { Project, Resource, Task, Risk, KPI, Phase, PhaseStatus, Sprint, SprintPhase } from "./mockData";
import { SPRINT_PHASES } from "./scrum";

// ── Waterfall phase generation ────────────────────────────────────────────────

const WATERFALL_PHASES = [
  "Design", "Implementation", "Verification", "Approval", "Release", "Post-Release",
] as const;

function rawToPhaseIndex(raw: string): number {
  const s = raw.toLowerCase().trim();
  if (s.includes("design") || s.includes("intake") || s.includes("plan") || s.includes("reqs")) return 0;
  if (s.includes("impl") || s.includes("develop") || s.includes("build") || s.includes("coding")) return 1;
  if (s.includes("verif") || s.includes("test") || s.includes("qa") || s.includes("it ") || s === "it") return 2;
  if (s.includes("approv") || s.includes("review") || s.includes("sign") || s.includes("uat")) return 3;
  if (s.includes("release") || s.includes("deploy") || s.includes("launch") || s.includes("go-live")) return 4;
  if (s.includes("post") || s.includes("operate") || s.includes("monitor") || s.includes("support")) return 5;
  return -1; // unrecognised
}

// Normalise a phase name to a short prefix for milestone map lookup
function normPhase(s: string): string {
  return s.toLowerCase().replace(/[\s-]/g, "").slice(0, 5);
}

function getMilestoneDate(milestones: Record<string, string>, phaseName: string): string {
  const np = normPhase(phaseName);
  for (const [k, v] of Object.entries(milestones)) {
    if (normPhase(k).startsWith(np) || np.startsWith(normPhase(k))) return v;
  }
  return "";
}

function generateWaterfallPhases(
  currentPhaseRaw: string,
  riskLevel: "Low" | "Medium" | "High" | "Critical",
  allTasksDone: boolean,
  completionRate: number,
  milestones: Record<string, string>,
  today: string,
): Phase[] {
  const parts = currentPhaseRaw.split(/[|,;\/]/).map((s) => s.trim()).filter(Boolean);
  let currentIdx = -1;
  for (const part of parts) {
    const idx = rawToPhaseIndex(part);
    if (idx > currentIdx) currentIdx = idx;
  }
  if (currentIdx === -1) currentIdx = 0;

  return WATERFALL_PHASES.map((name, i) => {
    const endDate = getMilestoneDate(milestones, name);

    let status: PhaseStatus;
    let progress: number;

    if (i < currentIdx) {
      // Phases already passed
      status   = "Completed";
      progress = 100;
    } else if (i === currentIdx) {
      // Active phase
      const isOverdue = endDate !== "" && today > endDate;
      if (allTasksDone) {
        status   = "Completed";
        progress = 100;
      } else if (isOverdue) {
        status   = "Delayed";
        progress = Math.min(99, Math.round(completionRate));
      } else if (riskLevel !== "Low") {
        status   = "At Risk";
        progress = Math.min(99, Math.round(completionRate));
      } else {
        status   = "On Track";
        progress = Math.min(99, Math.round(completionRate));
      }
    } else {
      status   = "To Do";
      progress = 0;
    }

    return { name, status, progress, endDate } satisfies Phase;
  });
}

// ── Status normalisation ──────────────────────────────────────────────────────

function mapTaskStatus(raw: string): Task["status"] {
  const s = raw.toLowerCase().trim();
  if (s === "done" || s === "complete" || s === "completed" || s === "完了") return "Done";
  if (s === "in progress" || s.includes("đang") || s.includes("inprogress") || s.includes("進行")) return "In Progress";
  if (s === "blocked") return "Blocked";
  return "To Do";
}

function normaliseType(raw: string): "Waterfall" | "Scrum" {
  const s = raw.toLowerCase();
  if (s.includes("scrum") || s.includes("agile") || s.includes("kanban") || s.includes("sprint")) return "Scrum";
  return "Waterfall";
}

function mapDerivedStatus(status: ReturnType<typeof deriveProjectStatus>): Exclude<Project["status"], "Completed"> {
  if (status === "delayed") return "Delayed";
  if (status === "at-risk" || status === "unknown") return "At Risk";
  return "On Track";
}

function isoDate(ms: number): string {
  return new Date(ms).toISOString().split("T")[0];
}

function splitSprintDates(startDate: string, endDate: string, totalSprints: number, index: number) {
  const startMs = new Date(startDate).getTime();
  const endMs = new Date(endDate).getTime();
  if (!startDate || !endDate || Number.isNaN(startMs) || Number.isNaN(endMs) || totalSprints <= 0 || endMs <= startMs) {
    return { startDate: startDate || "-", endDate: endDate || "-" };
  }
  const sprintMs = Math.max(86400000, (endMs - startMs) / totalSprints);
  const sprintStart = startMs + sprintMs * index;
  const sprintEnd = index === totalSprints - 1 ? endMs : Math.min(endMs, sprintStart + sprintMs - 86400000);
  return { startDate: isoDate(sprintStart), endDate: isoDate(sprintEnd) };
}

function buildCompletedSprintPhases(): SprintPhase[] {
  return SPRINT_PHASES.map((name) => ({ name, status: "Completed", progress: 100 }));
}

function buildActiveSprintPhases(completionRate: number, riskLevel: "Low" | "Medium" | "High" | "Critical", status: Project["status"]): SprintPhase[] {
  const activeStatus: PhaseStatus =
    status === "Delayed" ? "Delayed"
    : riskLevel === "High" || riskLevel === "Critical" ? "At Risk"
    : "On Track";

  const devProgress = Math.max(10, Math.min(95, Math.round(completionRate)));

  return SPRINT_PHASES.map((name, index) => {
    if (index < 2) return { name, status: "Completed", progress: 100 };
    if (index === 2) return { name, status: activeStatus, progress: devProgress };
    return { name, status: "To Do", progress: 0 };
  });
}

function buildScrumSeries(params: {
  projectStatus: Project["status"];
  startDate: string;
  endDate: string;
  totalSprints: number;
  completedSprints: number;
  sprintNumber: number | null;
  completionRate: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
  doneTasks: number;
  totalTasks: number;
  goal: string;
}) {
  const targetCurrentNumber = params.sprintNumber ?? Math.max(1, params.completedSprints + 1);
  const totalSprints = Math.max(targetCurrentNumber, Math.max(1, params.totalSprints));
  const completedSprints = Math.min(
    params.projectStatus === "Completed" ? Math.max(params.completedSprints, targetCurrentNumber - 1) : params.completedSprints,
    Math.max(0, targetCurrentNumber - 1),
  );

  const sprintHistory: Sprint[] = Array.from({ length: completedSprints }, (_, index) => {
    const dates = splitSprintDates(params.startDate, params.endDate, totalSprints, index);
    const committed = Math.max(8, Math.round(params.totalTasks / totalSprints) || 13);
    const done = index === completedSprints - 1 && params.projectStatus === "Completed"
      ? committed
      : Math.max(1, committed - (index % 2));

    return {
      number: index + 1,
      goal: `Sprint ${index + 1} delivery`,
      startDate: dates.startDate,
      endDate: dates.endDate,
      storyPointsTotal: committed,
      storyPointsDone: Math.min(committed, done),
      status: "Completed",
      phases: buildCompletedSprintPhases(),
    };
  });

  const activeNumber = params.projectStatus === "Completed"
    ? Math.max(targetCurrentNumber, completedSprints + 1)
    : targetCurrentNumber;
  const activeDates = splitSprintDates(params.startDate, params.endDate, totalSprints, activeNumber - 1);
  const currentSprint: Sprint = {
    number: activeNumber,
    goal: params.goal,
    startDate: activeDates.startDate,
    endDate: activeDates.endDate,
    storyPointsTotal: Math.max(8, params.totalTasks || 13),
    storyPointsDone: params.projectStatus === "Completed"
      ? Math.max(8, params.totalTasks || 13)
      : Math.min(Math.max(0, params.doneTasks), Math.max(8, params.totalTasks || 13)),
    status: params.projectStatus === "Completed" ? "Completed" : completedSprints === 0 ? "Planning" : "Active",
    phases: params.projectStatus === "Completed"
      ? buildCompletedSprintPhases()
      : buildActiveSprintPhases(params.completionRate, params.riskLevel, params.projectStatus),
  };

  return { currentSprint, sprintHistory };
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
    const insights = loadInsights(m.projectCode);
    const criticalInsights = insights.keyRisks.filter((s) => s.level === "critical").length;

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
      status: mapTaskStatus(t.status),
      dueDate: t.due || "-",
    }));

    const totalTasks   = tasks.length;
    const doneTasks    = tasks.filter((t) => t.status === "Done").length;
    const pendingTasks = tasks.filter((t) => t.status === "To Do").length;
    const overdueTasks = sprint.tasks.filter((t) => t.overduedays && t.overduedays > 0).length;

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
    const sprintLenDays = 14;
    const completedSprints = m.totalDays > 0 ? Math.max(0, Math.round(m.daysElapsed / sprintLenDays)) : 0;
    const totalSprints = m.totalDays > 0 ? Math.max(1, Math.round(m.totalDays / sprintLenDays)) : 1;

    // ── KPIs ──────────────────────────────────────────────────────────────────
    const kpis: KPI[] = [
      { label: "Completion", value: Math.round(m.completion.completionRate), unit: "%", target: 100, trend: "up", goodDir: "up" },
      { label: "Overdue Rate", value: Math.round(m.completion.overdueRate), unit: "%", target: 0, trend: m.completion.overdueRate > 10 ? "up" : "down", goodDir: "down" },
      { label: "Days Remaining", value: m.daysRemaining, unit: "days", target: 0, trend: "down", goodDir: "up" },
    ];
    if (m.completion.blockRate > 0) {
      kpis.push({ label: "Block Rate", value: Math.round(m.completion.blockRate), unit: "%", target: 0, trend: "up", goodDir: "down" });
    }

    const projectType = normaliseType(sprint.type || m.type || "Waterfall");

    // Waterfall: generate phase array from currentPhase field
    const today = new Date().toISOString().split("T")[0];
    const allTasksDone = totalTasks > 0 && doneTasks === totalTasks;

    const phases = projectType === "Waterfall"
      ? generateWaterfallPhases(
          sprint.currentPhase,
          m.riskLevel,
          allTasksDone,
          m.completion.completionRate,
          sprint.milestones,
          today,
        )
      : undefined;

    // ── Status ──────────────────────────────────────────────────────────────
    const derivedStatus = deriveProjectStatus(m);
    let status: Project["status"] = mapDerivedStatus(derivedStatus);
    if (phases?.every((ph) => ph.status === "Completed")) {
      status = "Completed";
    } else if (!phases && m.completion.completionRate >= 98) {
      status = "Completed";
    }

    const scrumGoal = `${m.flags.length > 0 ? m.flags[0] : `${m.daysRemaining} days remaining`}`;
    const scrumSeries = projectType === "Scrum"
      ? buildScrumSeries({
          projectStatus: status,
          startDate: m.period.start || sprint.periodStart || "-",
          endDate: m.period.end || sprint.periodEnd || "-",
          totalSprints,
          completedSprints,
          sprintNumber: sprint.sprintNumber,
          completionRate: m.completion.completionRate,
          riskLevel: m.riskLevel,
          doneTasks,
          totalTasks,
          goal: scrumGoal,
        })
      : null;

    return {
      id: m.projectCode,
      name: sprint.projectName || m.projectName,
      client: m.projectCode,
      type: projectType,
      status,
      priority,
      startDate: m.period.start || sprint.periodStart || "-",
      endDate: m.period.end || sprint.periodEnd || "-",
      lead,
      overdueTasks,
      criticalInsights,
      activeRisks: risks.filter((r) => r.status === "Active").length,
      atRiskDeps: 0,
      progress: Math.round(m.completion.completionRate),
      budget: { total: 0, spent: 0, monthly: [] },
      phases,
      currentSprint: scrumSeries?.currentSprint,
      totalSprints: projectType === "Scrum" ? totalSprints : undefined,
      completedSprints: projectType === "Scrum" ? Math.min(completedSprints, totalSprints) : undefined,
      velocity: projectType === "Scrum" ? doneTasks : undefined,
      backlogItems: projectType === "Scrum" ? pendingTasks : undefined,
      sprintHistory: scrumSeries?.sprintHistory,
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
