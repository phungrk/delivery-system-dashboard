import fs from "fs";
import path from "path";

const INPUT_DIR = path.join(process.cwd(), "..", "input");
const CAPACITY_DEFAULT = 40;

export type Badge = "FREE" | "PARTIAL" | "FULL" | "OVER" | "LEAVE";

export type WeekCell = {
  committed: number;
  available: number;
  badge: Badge;
};

export type MemberData = {
  weeks: Record<string, WeekCell>;
  projects: Record<string, Record<string, number>>; // project → week → hrs
};

export type ResourceData = {
  weeks: string[];
  weekLabels: Record<string, string>; // "2026-W17" → "W17\nApr 20–26"
  members: string[];
  projects: string[];
  capacity: number;
  memberData: Record<string, MemberData>;
};

function badge(committed: number, capacity: number): Badge {
  if (capacity === 0) return "LEAVE";
  const u = committed / capacity;
  if (u > 1.0) return "OVER";
  if (u > 0.9) return "FULL";
  if (u >= 0.5) return "PARTIAL";
  return "FREE";
}

// ISO week string → Monday Date
function isoWeekMonday(year: number, week: number): Date {
  const jan4 = new Date(year, 0, 4);
  const dow = jan4.getDay() || 7;
  const w1mon = new Date(jan4);
  w1mon.setDate(jan4.getDate() - (dow - 1));
  const result = new Date(w1mon);
  result.setDate(w1mon.getDate() + (week - 1) * 7);
  return result;
}

// Date → ISO week string "YYYY-Www"
function dateToIsoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow); // Thursday of this week
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const week = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

// Generate all ISO week strings from start to end (inclusive)
function weekRange(startWeek: string, endWeek: string): string[] {
  const weeks: string[] = [];
  const [sy, sw] = startWeek.split("-W").map(Number);
  let monday = isoWeekMonday(sy, sw);
  while (true) {
    const iso = dateToIsoWeek(monday);
    weeks.push(iso);
    if (iso >= endWeek) break;
    monday = new Date(monday);
    monday.setDate(monday.getDate() + 7);
    // Safety: cap at 200 weeks
    if (weeks.length > 200) break;
  }
  return weeks;
}

function weekLabel(isoWeek: string): string {
  const [yearStr, wStr] = isoWeek.split("-W");
  const year = parseInt(yearStr);
  const week = parseInt(wStr);
  const mon = isoWeekMonday(year, week);
  const sun = new Date(mon);
  sun.setDate(mon.getDate() + 6);
  const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const start = `${months[mon.getMonth()]} ${mon.getDate()}`;
  const end = mon.getMonth() === sun.getMonth()
    ? `${sun.getDate()}`
    : `${months[sun.getMonth()]} ${sun.getDate()}`;
  return `W${week}\n${start}–${end}`;
}

export function loadResourceData(): ResourceData {
  const forecastPath = path.join(INPUT_DIR, "_capacity-forecast.md");

  let capacity = CAPACITY_DEFAULT;
  let endWeekOverride: string | null = null;
  const raw: { week: string; member: string; project: string; hrs: number }[] = [];

  if (fs.existsSync(forecastPath)) {
    const content = fs.readFileSync(forecastPath, "utf-8");

    const capMatch = content.match(/Capacity per member:\s*(\d+)h/);
    if (capMatch) capacity = parseInt(capMatch[1]);

    const endMatch = content.match(/End week:\s*([\d]+-W[\d]+)/);
    if (endMatch) endWeekOverride = endMatch[1];

    const lines = content.split("\n").filter((l) => l.trimStart().startsWith("|"));
    if (lines.length >= 3) {
      const headers = lines[0].split("|").map((h) => h.trim().toLowerCase()).filter(Boolean);
      const wi = headers.findIndex((h) => h.includes("week"));
      const mi = headers.findIndex((h) => h.includes("member"));
      const pi = headers.findIndex((h) => h.includes("project"));
      const ci = headers.findIndex((h) => h.includes("committed"));

      for (const line of lines.slice(2)) {
        const cells = line.split("|").slice(1, -1).map((c) => c.trim());
        const week = cells[wi];
        const member = cells[mi];
        const project = cells[pi];
        const hrs = parseFloat(cells[ci]) || 0;
        if (week && member && project) raw.push({ week, member, project, hrs });
      }
    }
  }

  const allMembers = [...new Set(raw.map((r) => r.member))].sort();
  const allProjects = [...new Set(raw.map((r) => r.project))].sort();

  // Determine week range: from earliest data week to endWeekOverride (or latest data week)
  const dataWeeks = [...new Set(raw.map((r) => r.week))].sort();
  const startWeek = dataWeeks[0] ?? dateToIsoWeek(new Date());
  const endWeek = endWeekOverride ?? dataWeeks[dataWeeks.length - 1] ?? startWeek;
  const allWeeks = weekRange(startWeek, endWeek);

  const memberData: Record<string, MemberData> = {};

  for (const member of allMembers) {
    const projects: Record<string, Record<string, number>> = {};
    for (const row of raw.filter((r) => r.member === member)) {
      if (!projects[row.project]) projects[row.project] = {};
      projects[row.project][row.week] = (projects[row.project][row.week] ?? 0) + row.hrs;
    }

    const weeks: Record<string, WeekCell> = {};
    for (const week of allWeeks) {
      const committed = Object.values(projects).reduce((sum, pwk) => sum + (pwk[week] ?? 0), 0);
      weeks[week] = { committed, available: capacity - committed, badge: badge(committed, capacity) };
    }

    memberData[member] = { weeks, projects };
  }

  const weekLabels: Record<string, string> = {};
  for (const w of allWeeks) weekLabels[w] = weekLabel(w);

  return { weeks: allWeeks, weekLabels, members: allMembers, projects: allProjects, capacity, memberData };
}
