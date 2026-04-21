import fs from "fs";
import path from "path";
import { ProjectMetrics } from "../schema";
import { listAllProjects } from "../projectDir";
import { loadSprintFile, SprintFile } from "./sprint";

const PROCESSED_DIR = path.join(process.cwd(), "..", "processed");
const INPUT_DIR = path.join(process.cwd(), "..", "input");

function parseFloat2(s: string): number {
  return parseFloat(s.replace("%", "").trim()) || 0;
}

function parseInt2(s: string): number {
  return parseInt(s.trim()) || 0;
}

function parseMarkdownTable(block: string): Record<string, string>[] {
  const lines = block.trim().split("\n").filter((l) => l.startsWith("|"));
  if (lines.length < 3) return [];
  const headers = lines[0].split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
  return lines.slice(2).map((line) => {
    const cells = line.split("|").map((c) => c.trim()).filter((_, i, arr) => i > 0 && i < arr.length - 1);
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
}

function parseMetricsFile(filePath: string, projectCode: string): ProjectMetrics {
  const content = fs.readFileSync(filePath, "utf-8");
  const warnings: string[] = [];

  const metricsDate = path.basename(filePath).replace("metrics-", "").replace(".md", "");

  // Project name + period from Source line
  let projectName = projectCode;
  let start = "";
  let end = "";
  let daysElapsed = 0;
  let totalDays = 0;
  let daysRemaining = 0;
  let type: ProjectMetrics["type"] = "Waterfall";

  const sourceMatch = content.match(/Sprint.*?(?:\||:)\s*(.*?)\s*\|\s*Period:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})\s*\|\s*Days elapsed:\s*(\d+)\s*\/\s*(\d+)\s*\|\s*Days remaining:\s*(\d+)/);
  if (sourceMatch) {
    projectName = sourceMatch[1].trim();
    start = sourceMatch[2];
    end = sourceMatch[3];
    daysElapsed = parseInt(sourceMatch[4]);
    totalDays = parseInt(sourceMatch[5]);
    daysRemaining = parseInt(sourceMatch[6]);
  } else {
    // HAYK format
    const projectMatch = content.match(/Project:\s*(.+)/);
    if (projectMatch) projectName = projectMatch[1].trim();

    const sprintMatch = content.match(/Sprint:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})\s*\(day\s*(\d+)\/(\d+)\s*elapsed/);
    if (sprintMatch) {
      start = sprintMatch[1];
      end = sprintMatch[2];
      daysElapsed = parseInt(sprintMatch[3]);
      totalDays = parseInt(sprintMatch[4]);
      daysRemaining = totalDays - daysElapsed;
    } else {
      warnings.push("Could not parse sprint period");
    }
  }

  // Type from file content
  if (/Scrum-P/i.test(content)) type = "Scrum-P";
  else if (/Scrum/i.test(content)) type = "Scrum";
  else if (/Kanban/i.test(content)) type = "Kanban";

  // Completion metrics
  const completionBlock = content.match(/## Completion\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const completionRows = parseMarkdownTable(completionBlock);
  const getMetric = (name: string) => {
    const row = completionRows.find((r) => r["metric"]?.toLowerCase().includes(name));
    return parseFloat2(row?.["value"] ?? "0");
  };

  const completion = {
    completionRate: getMetric("completion"),
    onTrackRate: getMetric("on-track"),
    overdueRate: getMetric("overdue"),
    blockRate: getMetric("block"),
  };

  // Workload
  const workloadBlock = content.match(/## Workload by owner\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const workloadRows = parseMarkdownTable(workloadBlock);
  const workload = workloadRows.map((r) => ({
    owner: r["owner"] ?? "",
    total: parseInt2(r["total"]),
    inProgress: parseInt2(r["in progress"]),
    done: parseInt2(r["done"]),
    blocked: parseInt2(r["blocked"]),
    flag: r["flag"] === "—" ? undefined : r["flag"],
  })).filter((w) => w.owner);

  // Blockers
  const blockersMatch = content.match(/Total active:\s*(\d+)/);
  const activeBlockers = blockersMatch ? parseInt(blockersMatch[1]) : 0;

  // Risk score
  const riskMatch = content.match(/Risk score:\s*(\d+)\/10\s*—\s*(\w+)/);
  const riskScore = riskMatch ? parseInt(riskMatch[1]) : 0;
  const riskLevelRaw = riskMatch?.[2] ?? "Low";
  const riskLevel = (["Low", "Medium", "High", "Critical"].includes(riskLevelRaw)
    ? riskLevelRaw
    : "Low") as ProjectMetrics["riskLevel"];

  // Flags (FLAG: lines)
  const flags = Array.from(content.matchAll(/^> FLAG: (.+)$/gm)).map((m) => m[1]);

  return {
    projectCode,
    projectName,
    type,
    period: { start, end },
    daysElapsed,
    totalDays,
    daysRemaining,
    completion,
    workload,
    activeBlockers,
    riskScore,
    riskLevel,
    flags,
    metricsDate,
    warnings,
  };
}

export function loadAllMetrics(): ProjectMetrics[] {
  const results: ProjectMetrics[] = [];

  for (const { code, dir } of listAllProjects(PROCESSED_DIR)) {
    const metricFiles = fs
      .readdirSync(dir)
      .filter((f) => f.startsWith("metrics-") && f.endsWith(".md"))
      .sort()
      .reverse(); // newest first

    if (metricFiles.length === 0) continue;

    try {
      const metrics = parseMetricsFile(path.join(dir, metricFiles[0]), code);
      results.push(metrics);
    } catch (e) {
      results.push({
        projectCode: code,
        projectName: code,
        type: "Waterfall",
        period: { start: "", end: "" },
        daysElapsed: 0,
        totalDays: 0,
        daysRemaining: 0,
        completion: { completionRate: 0, onTrackRate: 0, overdueRate: 0, blockRate: 0 },
        workload: [],
        activeBlockers: 0,
        riskScore: 0,
        riskLevel: "Low",
        flags: [],
        metricsDate: "",
        warnings: [`Parse error: ${e}`],
      });
    }
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}

// ── Compute basic metrics directly from sprint/input data (no processed needed) ──

function computeMetricsFromSprint(sprint: SprintFile): ProjectMetrics {
  const today = new Date().toISOString().split("T")[0];
  const tasks = sprint.tasks;
  const total = tasks.length;
  const done  = tasks.filter(t => t.status === "Done").length;
  const blocked    = tasks.filter(t => t.status === "Blocked").length;
  const overdue    = tasks.filter(t => t.overduedays && t.overduedays > 0).length;

  const completionRate = total > 0 ? (done / total) * 100 : 0;
  const overdueRate    = total > 0 ? (overdue / total) * 100 : 0;
  const blockRate      = total > 0 ? (blocked / total) * 100 : 0;

  // Sprint time progress
  let daysElapsed = 0, totalDays = 0, daysRemaining = 0;
  if (sprint.periodStart && sprint.periodEnd) {
    totalDays    = Math.max(1, Math.round((new Date(sprint.periodEnd).getTime() - new Date(sprint.periodStart).getTime()) / 86400000));
    daysElapsed  = Math.min(totalDays, Math.max(0, Math.round((new Date(today).getTime() - new Date(sprint.periodStart).getTime()) / 86400000)));
    daysRemaining = Math.max(0, totalDays - daysElapsed);
  }
  const timePct = totalDays > 0 ? (daysElapsed / totalDays) * 100 : 0;

  // Risk score heuristic
  let riskScore = 0;
  if (completionRate < 50 && timePct > 50) riskScore += 2;
  riskScore += Math.min(3, overdue);
  if (blocked > 0) riskScore += 2;
  const ownerLoad: Record<string, number> = {};
  tasks.filter(t => t.status === "In Progress").forEach(t => { ownerLoad[t.owner] = (ownerLoad[t.owner] ?? 0) + 1; });
  if (Object.values(ownerLoad).some(n => n > 3)) riskScore += 1;
  if (blockRate > 30) riskScore += 1;
  riskScore = Math.min(10, riskScore);

  const riskLevel: ProjectMetrics["riskLevel"] =
    riskScore >= 8 ? "Critical" : riskScore >= 5 ? "High" : riskScore >= 3 ? "Medium" : "Low";

  // Workload
  const owners = [...new Set(tasks.map(t => t.owner).filter(Boolean))];
  const workload = owners.map(owner => ({
    owner,
    total:      tasks.filter(t => t.owner === owner).length,
    inProgress: tasks.filter(t => t.owner === owner && t.status === "In Progress").length,
    done:       tasks.filter(t => t.owner === owner && t.status === "Done").length,
    blocked:    tasks.filter(t => t.owner === owner && t.status === "Blocked").length,
    flag:       (ownerLoad[owner] ?? 0) > 3 ? "OVERLOADED" : undefined,
  }));

  // Flags
  const flags: string[] = [];
  if (overdue > 0) flags.push(`${overdue} task overdue`);
  if (blocked > 0) flags.push(`${blocked} task blocked`);
  if (completionRate < 50 && timePct > 50) flags.push(`Completion ${completionRate.toFixed(0)}% sau ${timePct.toFixed(0)}% thời gian`);

  return {
    projectCode: sprint.projectCode,
    projectName: sprint.projectName,
    type: (sprint.type as ProjectMetrics["type"]) || "Waterfall",
    period: { start: sprint.periodStart, end: sprint.periodEnd },
    daysElapsed,
    totalDays,
    daysRemaining,
    completion: { completionRate, onTrackRate: 100 - overdueRate, overdueRate, blockRate },
    workload,
    activeBlockers: blocked,
    riskScore,
    riskLevel,
    flags,
    metricsDate: today,
    warnings: sprint.warnings,
  };
}

// Merges processed metrics (rich) + computed fallback for input-only projects
export function loadAllMetricsMerged(): ProjectMetrics[] {
  const inputCodes = new Set(listAllProjects(INPUT_DIR).map(p => p.code));

  // Only keep processed entries whose project still exists in input/
  const processed = loadAllMetrics().filter(m => inputCodes.has(m.projectCode));
  const processedCodes = new Set(processed.map(m => m.projectCode));

  const results = [...processed];

  for (const { code } of listAllProjects(INPUT_DIR)) {
    if (processedCodes.has(code)) continue;
    const sprint = loadSprintFile(code);
    if (sprint.tasks.length === 0 && sprint.warnings.length > 0) continue;
    results.push(computeMetricsFromSprint(sprint));
  }

  return results.sort((a, b) => b.riskScore - a.riskScore);
}
