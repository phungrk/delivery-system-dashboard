"use server";

import fs from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { findProjectDir } from "./projectDir";
import { AllocationsFileSchema } from "./data-schemas";
import { INPUT_DIR, RESOURCES_DIR } from "./paths";

const DATA_DIR = RESOURCES_DIR;

// ── File finder ──────────────────────────────────────────────────────────────

function findSprintFile(projectCode: string): string | null {
  const dir = findProjectDir(INPUT_DIR, projectCode);
  if (!dir) return null;
  const files = fs.readdirSync(dir)
    .filter((f) => f.match(/^(project-tracking|sprint-\d+|project|board)\.(md|txt)$/))
    .sort()
    .reverse();
  return files.length > 0 ? path.join(dir, files[0]) : null;
}

// ── Table helpers ────────────────────────────────────────────────────────────

function parseHeaderCols(headerLine: string): string[] {
  return headerLine.split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
}

function cellIdx(cols: string[], ...names: string[]): number {
  for (const name of names) {
    const i = cols.findIndex((c) => c.includes(name));
    if (i !== -1) return i;
  }
  return -1;
}

// Split a markdown table row into cells, preserving leading/trailing pipe structure
function splitRow(line: string): string[] {
  return line.split("|");
}

function joinRow(cells: string[]): string {
  return cells.join("|");
}

// Find the last line index (within `lines`) that starts with | in a given section
function lastTableRowIdx(lines: string[], sectionStart: number): number {
  const nextSection = lines.findIndex((l, i) => i > sectionStart && l.startsWith("## "));
  const end = nextSection === -1 ? lines.length : nextSection;
  for (let i = end - 1; i > sectionStart; i--) {
    if (lines[i].trimStart().startsWith("|")) return i;
  }
  return -1;
}

function isoLocalToday(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// ── logTime ──────────────────────────────────────────────────────────────────

export async function logTime(
  projectCode: string,
  taskId: string,
  owner: string,
  date: string,
  hours: number,
  note: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const dir = findProjectDir(INPUT_DIR, projectCode);
    if (!dir) return { ok: false, error: "Project folder not found" };

    const filePath = path.join(dir, "timelog.md");
    const newRow = `| ${date} | ${owner} | ${taskId} | ${hours} | ${note} |`;

    if (!fs.existsSync(filePath)) {
      // Create new timelog.md
      const content = [
        `# Time Log — ${projectCode}`,
        "",
        "| Date | Owner | Task ID | Hours | Note |",
        "|------|-------|---------|-------|------|",
        newRow,
        "",
      ].join("\n");
      fs.writeFileSync(filePath, content, "utf-8");
    } else {
      const lines = fs.readFileSync(filePath, "utf-8").split("\n");
      const lastRow = lastTableRowIdx(lines, 0);
      if (lastRow === -1) {
        lines.push(newRow);
      } else {
        lines.splice(lastRow + 1, 0, newRow);
      }
      fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    }

    revalidatePath(`/projects/${projectCode}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── updateStatus ─────────────────────────────────────────────────────────────

export async function updateStatus(
  projectCode: string,
  taskId: string,
  newStatus: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const filePath = findSprintFile(projectCode);
    if (!filePath) return { ok: false, error: "Sprint file not found" };

    const today = new Date().toISOString().split("T")[0];
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    // Find Tasks section
    const tasksSectionIdx = lines.findIndex((l) => l.match(/^## Tasks/));
    if (tasksSectionIdx === -1) return { ok: false, error: "Tasks section not found" };

    // Find header row
    const headerIdx = lines.findIndex((l, i) => i > tasksSectionIdx && l.trimStart().startsWith("|") && l.toLowerCase().includes("status"));
    if (headerIdx === -1) return { ok: false, error: "Tasks header not found" };

    const cols = parseHeaderCols(lines[headerIdx]);
    const statusCol  = cellIdx(cols, "status");
    const startedCol = cellIdx(cols, "started");
    const lastUpdCol = cellIdx(cols, "last updated", "last");

    // Find task row — match by task ID in any cell
    const taskRowIdx = lines.findIndex((l, i) => {
      if (i <= headerIdx) return false;
      if (!l.trimStart().startsWith("|")) return false;
      const cells = l.split("|").map((c) => c.trim());
      return cells.some((c) => c === taskId || c === taskId.split("-").pop());
    });

    if (taskRowIdx === -1) return { ok: false, error: `Task ${taskId} not found` };

    const cells = splitRow(lines[taskRowIdx]);
    // cells[0]="" cells[1]=ID cells[2]=Title ... (1-indexed offset by leading pipe)

    const set = (colIdx: number, value: string) => {
      if (colIdx >= 0 && colIdx + 1 < cells.length) {
        cells[colIdx + 1] = ` ${value} `;
      }
    };

    set(statusCol, newStatus);

    if (newStatus === "In Progress" && startedCol >= 0) {
      const current = cells[startedCol + 1]?.trim() ?? "";
      if (!current) set(startedCol, today);
    }

    if (newStatus === "Done" && lastUpdCol >= 0) {
      set(lastUpdCol, today);
    }

    if (newStatus !== "Done" && lastUpdCol >= 0) {
      set(lastUpdCol, today);
    }

    lines[taskRowIdx] = joinRow(cells);
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    revalidatePath(`/projects/${projectCode}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── updateMilestone ───────────────────────────────────────────────────────────

const MILESTONE_PHASES = ["Design", "Implementation", "Verification", "Approval", "Release", "Post-Release"] as const;

export async function updateMilestone(
  projectCode: string,
  phaseName: string,
  date: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const filePath = findSprintFile(projectCode);
    if (!filePath) return { ok: false, error: "Sprint file not found" };

    let content = fs.readFileSync(filePath, "utf-8");
    const milestoneHeader = "## Milestones";
    const lineKey = phaseName; // e.g. "Design"

    if (content.includes(milestoneHeader)) {
      // Update existing section: find the phase line and replace its date
      const lines = content.split("\n");
      const sectionIdx = lines.findIndex((l) => l.trim() === milestoneHeader);
      const nextSection = lines.findIndex((l, i) => i > sectionIdx && l.startsWith("## "));
      const end = nextSection === -1 ? lines.length : nextSection;

      // Try to find existing line for this phase (prefix-match, case-insensitive)
      const norm = (s: string) => s.toLowerCase().replace(/[\s-]/g, "").slice(0, 5);
      const np = norm(phaseName);
      const phaseLineIdx = lines.findIndex((l, i) => {
        if (i <= sectionIdx || i >= end) return false;
        const m = l.match(/^-\s*([^:]+):/);
        return m ? norm(m[1]).startsWith(np) || np.startsWith(norm(m[1])) : false;
      });

      if (phaseLineIdx !== -1) {
        // Replace date on existing line
        lines[phaseLineIdx] = lines[phaseLineIdx].replace(
          /^(-\s*[^:]+:\s*).*$/,
          `$1${date}`,
        );
      } else {
        // Append new line inside the section (before next section or EOF)
        lines.splice(end, 0, `- ${lineKey}: ${date}`);
      }
      content = lines.join("\n");
    } else {
      // Create the full Milestones section at the end of the file
      const block = [
        "",
        milestoneHeader,
        "",
        ...MILESTONE_PHASES.map((p) => `- ${p}: ${p === phaseName ? date : ""}`),
        "",
      ].join("\n");
      // Insert before ## Tasks if it exists, otherwise append at end
      const tasksIdx = content.search(/^## Tasks/m);
      if (tasksIdx !== -1) {
        content = content.slice(0, tasksIdx).trimEnd() + "\n" + block + "\n\n" + content.slice(tasksIdx);
      } else {
        content = content.trimEnd() + block;
      }
    }

    fs.writeFileSync(filePath, content, "utf-8");
    revalidatePath(`/v2`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── updateTaskField ───────────────────────────────────────────────────────────

export async function updateTaskField(
  projectCode: string,
  taskId: string,
  field: "title" | "owner" | "due",
  value: string,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const filePath = findSprintFile(projectCode);
    if (!filePath) return { ok: false, error: "Sprint file not found" };

    const today = new Date().toISOString().split("T")[0];
    const content = fs.readFileSync(filePath, "utf-8");
    const lines = content.split("\n");

    const tasksSectionIdx = lines.findIndex((l) => l.match(/^## Tasks/));
    if (tasksSectionIdx === -1) return { ok: false, error: "Tasks section not found" };

    const headerIdx = lines.findIndex((l, i) => i > tasksSectionIdx && l.trimStart().startsWith("|") && l.toLowerCase().includes("status"));
    if (headerIdx === -1) return { ok: false, error: "Tasks header not found" };

    const cols = parseHeaderCols(lines[headerIdx]);
    const fieldCol   = cellIdx(cols, field);
    const lastUpdCol = cellIdx(cols, "last updated", "last");

    if (fieldCol === -1) return { ok: false, error: `Column "${field}" not found` };

    const taskRowIdx = lines.findIndex((l, i) => {
      if (i <= headerIdx) return false;
      if (!l.trimStart().startsWith("|")) return false;
      const cells = l.split("|").map((c) => c.trim());
      return cells.some((c) => c === taskId || c === taskId.split("-").pop());
    });

    if (taskRowIdx === -1) return { ok: false, error: `Task ${taskId} not found` };

    const cells = splitRow(lines[taskRowIdx]);
    const set = (colIdx: number, v: string) => {
      if (colIdx >= 0 && colIdx + 1 < cells.length) cells[colIdx + 1] = ` ${v} `;
    };

    set(fieldCol, value);
    if (lastUpdCol >= 0) set(lastUpdCol, today);

    lines[taskRowIdx] = joinRow(cells);
    fs.writeFileSync(filePath, lines.join("\n"), "utf-8");
    revalidatePath(`/projects/${projectCode}`);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

// ── updateWeeklyAllocation ───────────────────────────────────────────────────

export async function updateWeeklyAllocation(
  memberCode: string,
  projectCode: string,
  weekStart: string,
  hours: number,
): Promise<{ ok: boolean; error?: string }> {
  try {
    const filePath = path.join(DATA_DIR, "allocations.json");
    const parsed = AllocationsFileSchema.parse(
      JSON.parse(fs.readFileSync(filePath, "utf-8"))
    );

    const record = parsed.data.find(
      (item) => item.memberCode === memberCode && item.projectCode === projectCode,
    );
    if (!record) return { ok: false, error: "Allocation record not found" };

    const normalizedHours = Number.isFinite(hours) ? Math.max(0, hours) : 0;
    const existing = record.weeklyHours.find((entry) => entry.weekStart === weekStart);

    if (existing) {
      existing.hours = normalizedHours;
    } else {
      record.weeklyHours.push({ weekStart, hours: normalizedHours });
      record.weeklyHours.sort((a, b) => a.weekStart.localeCompare(b.weekStart));
    }

    const nextData = {
      ...parsed,
      updatedAt: isoLocalToday(),
      data: parsed.data.map((item) =>
        item.id === record.id
          ? {
              ...item,
              weeklyHours: item.weeklyHours.sort((a, b) => a.weekStart.localeCompare(b.weekStart)),
            }
          : item,
      ),
    };

    fs.writeFileSync(filePath, `${JSON.stringify(nextData, null, 2)}\n`, "utf-8");
    revalidatePath("/v2/resource-center");
    revalidatePath("/v2");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}
