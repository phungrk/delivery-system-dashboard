import fs from "node:fs";
import path from "node:path";
import { z } from "zod";

const dashboardRoot = process.cwd();
const repoRoot = path.join(dashboardRoot, "..");
const dataRoot = path.join(dashboardRoot, "data");

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);
const memberSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string().min(1)).min(1),
  initials: z.string().min(2),
  role: z.string().min(1),
  department: z.string().min(1),
  email: z.string().email(),
  startDate: dateString,
  status: z.enum(["active", "inactive", "on_leave"]),
  avatarColor: z.string().min(1),
  weeklyCapacityHours: z.number().positive().max(80),
  skills: z.array(z.string()),
});
const projectSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  domain: z.string().min(1),
  folder: z.string().min(1),
  color: z.string().min(1),
  status: z.enum(["Active", "Pipeline", "Paused", "Complete"]),
  phase: z.string().min(1),
  type: z.enum(["Waterfall", "Scrum", "Scrum-P", "Kanban"]),
  budget: z.number().nonnegative(),
  eac: z.number().nonnegative(),
  actualFees: z.number().nonnegative(),
  startDate: dateString,
  endDate: dateString,
}).refine((project) => project.folder === `${project.domain}/${project.code}`, {
  message: "folder must equal domain/code",
});
const allocationSchema = z.object({
  id: z.string().min(1),
  memberCode: z.string().min(1),
  projectCode: z.string().min(1),
  weeklyHours: z.array(z.object({
    weekStart: dateString,
    hours: z.number().min(0),
  })).min(1),
}).refine((allocation) => {
  const keys = allocation.weeklyHours.map((entry) => entry.weekStart);
  return new Set(keys).size === keys.length;
}, {
  message: "weeklyHours contains duplicate weekStart entries",
});
const holidaySchema = z.object({
  date: dateString,
  name: z.string().min(1),
  impactPct: z.number().min(1).max(100),
  scope: z.enum(["all", "VN", "JP", "US", "opt"]),
});
const leaveSchema = z.object({
  memberCode: z.string().min(1),
  from: dateString,
  to: dateString,
  type: z.enum(["annual", "sick", "compensatory", "unpaid", "wfh"]),
  days: z.number().nonnegative(),
  status: z.enum(["approved", "pending", "rejected"]),
  notes: z.string().optional(),
}).refine((leave) => leave.from <= leave.to, {
  message: "from must be before or equal to to",
});

function readJson(name) {
  return JSON.parse(fs.readFileSync(path.join(dataRoot, name), "utf8"));
}

function fail(message) {
  console.error(`ERROR: ${message}`);
  process.exitCode = 1;
}

function warn(message) {
  console.warn(`WARN: ${message}`);
}

const members = z.object({ data: z.array(memberSchema) }).parse(readJson("members.json")).data;
const projects = z.object({ data: z.array(projectSchema) }).parse(readJson("projects.json")).data;
const allocations = z.object({ data: z.array(allocationSchema) }).parse(readJson("allocations.json")).data;
const capacity = z.object({
  holidays: z.array(holidaySchema),
  leaves: z.array(leaveSchema),
}).parse(readJson("capacity.json"));

const memberCodes = new Set(members.map((member) => member.code));
const projectCodes = new Set(projects.map((project) => project.code));
const aliasIndex = new Map();

for (const member of members) {
  for (const alias of [member.code, member.name, member.initials, ...member.aliases]) {
    const key = alias.trim().toLowerCase();
    const existing = aliasIndex.get(key);
    if (existing && existing !== member.code) {
      fail(`duplicate member alias "${alias}" for ${existing} and ${member.code}`);
    }
    aliasIndex.set(key, member.code);
  }
}

for (const allocation of allocations) {
  if (!memberCodes.has(allocation.memberCode)) {
    fail(`allocation ${allocation.id} references missing member ${allocation.memberCode}`);
  }
  if (!projectCodes.has(allocation.projectCode)) {
    fail(`allocation ${allocation.id} references missing project ${allocation.projectCode}`);
  }
  for (const entry of allocation.weeklyHours) {
    const monday = mondayOf(new Date(`${entry.weekStart}T00:00:00`));
    if (entry.weekStart !== isoLocalDate(monday)) {
      fail(`allocation ${allocation.id} weekStart ${entry.weekStart} must be Monday`);
    }
  }
}

for (const leave of capacity.leaves) {
  if (!memberCodes.has(leave.memberCode)) {
    fail(`leave ${leave.memberCode} ${leave.from} references missing member`);
  }
}

for (const project of projects) {
  const inputDir = path.join(repoRoot, "input", project.folder);
  const processedDir = path.join(repoRoot, "processed", project.folder);
  if (!fs.existsSync(inputDir)) warn(`missing canonical input folder: input/${project.folder}`);
  if (!fs.existsSync(processedDir)) warn(`missing canonical processed folder: processed/${project.folder}`);
}

const byMemberWeek = new Map();
for (const allocation of allocations) {
  for (const entry of allocation.weeklyHours) {
    const key = `${allocation.memberCode}:${entry.weekStart}`;
    byMemberWeek.set(key, (byMemberWeek.get(key) ?? 0) + entry.hours);
  }
}

const capacityByMember = new Map(members.map((member) => [member.code, member.weeklyCapacityHours]));
for (const [key, hours] of byMemberWeek.entries()) {
  const [memberCode, week] = key.split(":");
  const capacityHours = capacityByMember.get(memberCode) ?? 40;
  if (hours > capacityHours) {
    warn(`${memberCode} overloaded week ${week}: ${hours}h/${capacityHours}h`);
  }
}

if (!process.exitCode) {
  console.log(`Data validation passed: ${members.length} members, ${projects.length} projects, ${allocations.length} allocations.`);
}

function mondayOf(date) {
  const d = new Date(date);
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  d.setHours(0, 0, 0, 0);
  return d;
}

function isoLocalDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
