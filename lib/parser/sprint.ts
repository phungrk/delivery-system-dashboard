import fs from "fs";
import path from "path";
import { findProjectDir } from "../projectDir";

const INPUT_DIR = path.join(process.cwd(), "..", "input");

export type TaskStatus = "Done" | "In Progress" | "Not Started" | "Blocked";

export type Task = {
  id: string;
  title: string;
  owner: string;
  status: TaskStatus;
  estHrs: number | null;
  due: string | null;
  started: string | null;
  lastUpdated: string | null;
  blockedBy: string | null;
  notes: string | null;
  overduedays: number | null;
  cycleTimeDays: number | null;
  staleDays: number | null;
};

export type SprintFile = {
  projectCode: string;
  projectName: string;
  type: string;
  currentPhase: string; // e.g. "verification" or "design | implementation"
  periodStart: string;
  periodEnd: string;
  milestones: Record<string, string>; // phase name (lowercase) → yyyy-mm-dd
  tasks: Task[];
  timeLogByTask: Record<string, number>; // taskId → total hours logged
  warnings: string[];
};

function parseMarkdownTable(block: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = block.trim().split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return { headers: [], rows: [] };
  const headers = lines[0].split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const rows = lines.slice(2).map((line) => {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    return Object.fromEntries(headers.map((h, i) => [h, cells[i] ?? ""]));
  });
  return { headers, rows };
}

function daysBetween(a: string, b: string): number {
  return Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000);
}

function parseTasks(content: string, projectCode: string, today: string): Task[] {
  const taskBlock = content.match(/## Tasks(?:\s*\(FE\))?\s*\n[\s\S]*?(?=\n##|$)/)?.[0] ?? "";
  const { headers, rows } = parseMarkdownTable(taskBlock);

  const col = (row: Record<string, string>, ...names: string[]) => {
    for (const n of names) {
      const key = headers.find((h) => h.includes(n));
      if (key && row[key] !== undefined) return row[key];
    }
    return "";
  };

  return rows
    .filter((r) => col(r, "id").trim())
    .map((r) => {
      const id = col(r, "id");
      const status = (col(r, "status") as TaskStatus) || "Not Started";
      const due = col(r, "due") || null;
      const started = col(r, "started") || null;
      const lastUpdated = col(r, "last updated", "last") || null;
      const estHrsRaw = col(r, "est");
      const estHrs = estHrsRaw ? parseFloat(estHrsRaw) || null : null;

      // Overdue: due date passed and not Done
      let overduedays: number | null = null;
      if (due && status !== "Done") {
        const diff = daysBetween(due, today);
        if (diff > 0) overduedays = diff;
      }

      // Cycle time: started → lastUpdated when Done
      let cycleTimeDays: number | null = null;
      if (started && lastUpdated && status === "Done") {
        cycleTimeDays = Math.max(0, daysBetween(started, lastUpdated));
      }

      // Stale: last updated more than 7 days ago and not Done
      let staleDays: number | null = null;
      if (lastUpdated && status !== "Done") {
        const diff = daysBetween(lastUpdated, today);
        if (diff > 7) staleDays = diff;
      }

      // blocked by or notes — last column heuristic
      const notesCol = col(r, "blocked by", "notes");
      const isBlockedBy = headers.some((h) => h.includes("blocked"));
      const blockedBy = isBlockedBy ? notesCol || null : null;
      const notes = !isBlockedBy ? notesCol || null : null;

      return {
        id: id || `${projectCode}-?`,
        title: col(r, "title"),
        owner: col(r, "owner"),
        status,
        estHrs,
        due,
        started,
        lastUpdated,
        blockedBy,
        notes,
        overduedays,
        cycleTimeDays,
        staleDays,
      };
    });
}

function parseMilestones(content: string): Record<string, string> {
  const block = content.match(/## Milestones\s*\n([\s\S]*?)(?=\n##|$)/)?.[1] ?? "";
  const result: Record<string, string> = {};
  for (const line of block.split("\n")) {
    const m = line.match(/^-\s*([^:]+):\s*(\d{4}-\d{2}-\d{2})/);
    if (m) result[m[1].trim().toLowerCase()] = m[2];
  }
  return result;
}

function parseTimeLog(projectDir: string): Record<string, number> {
  const filePath = path.join(projectDir, "timelog.md");
  if (!fs.existsSync(filePath)) return {};

  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n").filter((l) => l.trimStart().startsWith("|"));
  if (lines.length < 3) return {};

  const headers = lines[0].split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
  const taskCol  = headers.findIndex((h) => h.includes("task"));
  const hoursCol = headers.findIndex((h) => h.includes("hour"));
  if (taskCol === -1 || hoursCol === -1) return {};

  const result: Record<string, number> = {};
  for (const line of lines.slice(2)) {
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    const taskId = cells[taskCol];
    const hours  = parseFloat(cells[hoursCol]) || 0;
    if (taskId && hours > 0) {
      result[taskId] = (result[taskId] ?? 0) + hours;
    }
  }
  return result;
}

export function loadSprintFile(projectCode: string): SprintFile {
  const dir = findProjectDir(INPUT_DIR, projectCode);
  const warnings: string[] = [];

  if (!dir) {
    return { projectCode, projectName: projectCode, type: "", currentPhase: "", periodStart: "", periodEnd: "", milestones: {}, tasks: [], timeLogByTask: {}, warnings: [`Folder not found for: ${projectCode}`] };
  }

  // Pick latest sprint-*.md or project.md or board.md
  const files = fs.readdirSync(dir).filter((f) =>
    f.match(/^(project-tracking|sprint-\d+|project|board)\.(md|txt)$/)
  ).sort().reverse();

  if (files.length === 0) {
    return { projectCode, projectName: projectCode, type: "", currentPhase: "", periodStart: "", periodEnd: "", milestones: {}, tasks: [], timeLogByTask: {}, warnings: ["No sprint file found"] };
  }

  const content = fs.readFileSync(path.join(dir, files[0]), "utf-8");
  const today = new Date().toISOString().split("T")[0];

  // Header fields
  const projectName = content.match(/^#\s+(?:Sprint \d+[^—\n]*—\s*|Sprint \d+:\s*|Board:\s*|Project:\s*)?(.+)/m)?.[1]?.trim() ?? projectCode;
  const type = content.match(/^Type:\s*(.+)/m)?.[1]?.trim() ?? "";
  const currentPhase = content.match(/^Current Phase:\s*(.+)/m)?.[1]?.trim() ?? "";
  const periodMatch = content.match(/Period:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})/);
  const sprintMatch = content.match(/Sprint:\s*(\d{4}-\d{2}-\d{2})\s*→\s*(\d{4}-\d{2}-\d{2})/);
  const m = periodMatch ?? sprintMatch;
  const periodStart = m?.[1] ?? "";
  const periodEnd = m?.[2] ?? "";

  if (!periodStart) warnings.push("Missing period dates");

  const milestones = parseMilestones(content);
  const tasks = parseTasks(content, projectCode, today);
  const timeLogByTask = parseTimeLog(dir);

  return { projectCode, projectName, type, currentPhase, periodStart, periodEnd, milestones, tasks, timeLogByTask, warnings };
}
