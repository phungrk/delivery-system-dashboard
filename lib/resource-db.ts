import fs from "fs";
import path from "path";
import { RESOURCES_DIR } from "./paths";

function loadJson(file: string) {
  return JSON.parse(fs.readFileSync(path.join(RESOURCES_DIR, file), "utf-8"));
}

const membersRaw  = loadJson("members.json");
const allocsRaw   = loadJson("allocations.json");
const capacityRaw = loadJson("capacity.json");
const projectsRaw = loadJson("projects.json");
import {
  AllocationsFileSchema,
  CapacityFileSchema,
  MembersFileSchema,
  ProjectsFileSchema,
  type RawAllocation,
  type RawHoliday,
  type RawLeave,
  type RawMember,
  type RawProject,
} from "./data-schemas";

export interface AllocationBar {
  startW: number;
  endW: number;
  pct: number;
  label: string;
  color: string;
  hoursPerWeek: number;
}

export interface EnrichedAllocation extends RawAllocation {
  from: string;
  to: string;
  hoursPerWeek: number;
  estHours: number;
  actualHours: number | null;
  pct: number;
  bars: AllocationBar[];
}

export interface MemberWeek {
  util: number;
  offDay: boolean;
}

export interface EnrichedMember extends RawMember {
  allocations: EnrichedAllocation[];
  weeks: MemberWeek[];
  allocBars: AllocationBar[];
}

export interface EnrichedProject extends RawProject {
  members: Array<{ member: RawMember; alloc: EnrichedAllocation }>;
  startW: number;
  endW: number;
}

const MEMBERS_FILE = MembersFileSchema.parse(membersRaw);
const PROJECTS_FILE = ProjectsFileSchema.parse(projectsRaw);
const ALLOCS_FILE = AllocationsFileSchema.parse(allocsRaw);
const CAPACITY_FILE = CapacityFileSchema.parse(capacityRaw);

const RAW_MEMBERS: RawMember[] = MEMBERS_FILE.data;
const RAW_PROJECTS: RawProject[] = PROJECTS_FILE.data;
const RAW_HOLIDAYS: RawHoliday[] = CAPACITY_FILE.holidays;
const RAW_LEAVES: RawLeave[] = CAPACITY_FILE.leaves;

const MEMBER_BY_CODE = new Map(RAW_MEMBERS.map((member) => [member.code, member]));

function parseDate(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

function weekStart(d: Date): Date {
  const day = (d.getDay() + 6) % 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function addDays(d: Date, n: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + n);
  return result;
}

function isoDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function weeklyHoursMap(allocation: RawAllocation): Map<string, number> {
  return new Map(allocation.weeklyHours.map((entry) => [entry.weekStart, entry.hours]));
}

function deriveAllocationBounds(allocation: RawAllocation): { from: string; to: string } {
  const sorted = [...allocation.weeklyHours].sort((a, b) => a.weekStart.localeCompare(b.weekStart));
  const from = sorted[0]?.weekStart ?? "";
  const last = sorted.at(-1)?.weekStart ?? from;
  return { from, to: isoDate(addDays(parseDate(last), 4)) };
}

function averageHoursPerWeek(allocation: RawAllocation): number {
  const total = allocation.weeklyHours.reduce((sum, entry) => sum + entry.hours, 0);
  return allocation.weeklyHours.length === 0 ? 0 : Math.round((total / allocation.weeklyHours.length) * 10) / 10;
}

function totalEstimatedHours(allocation: RawAllocation): number {
  return allocation.weeklyHours.reduce((sum, entry) => sum + entry.hours, 0);
}

function pctFromHours(memberCode: string, hours: number): number {
  const capacity = MEMBER_BY_CODE.get(memberCode)?.weeklyCapacityHours ?? 40;
  return Math.round((hours / capacity) * 1000) / 10;
}

const RAW_ALLOCS: EnrichedAllocation[] = ALLOCS_FILE.data.map((allocation) => {
  const { from, to } = deriveAllocationBounds(allocation);
  const hoursPerWeek = averageHoursPerWeek(allocation);
  return {
    ...allocation,
    from,
    to,
    hoursPerWeek,
    estHours: totalEstimatedHours(allocation),
    actualHours: null,
    pct: pctFromHours(allocation.memberCode, hoursPerWeek),
    bars: [],
  };
});

const TEAM_OFF_DAYS: Set<string> = (() => {
  const days = new Set<string>();
  for (const holiday of RAW_HOLIDAYS) {
    if (holiday.impactPct === 100) days.add(holiday.date);
  }
  return days;
})();

function memberOffDays(code: string): Set<string> {
  const offDays = new Set<string>(TEAM_OFF_DAYS);
  for (const leave of RAW_LEAVES) {
    if (leave.memberCode !== code || leave.status === "rejected" || leave.type === "wfh") continue;
    let current = parseDate(leave.from);
    const end = parseDate(leave.to);
    while (current <= end) {
      offDays.add(isoDate(current));
      current = addDays(current, 1);
    }
  }
  return offDays;
}

function isWeekOff(monday: Date, offDays: Set<string>): boolean {
  for (let i = 0; i < 5; i++) {
    if (!offDays.has(isoDate(addDays(monday, i)))) return false;
  }
  return true;
}

function hoursForWeek(allocation: EnrichedAllocation, monday: Date): number {
  return weeklyHoursMap(allocation).get(isoDate(monday)) ?? 0;
}

function buildBarsForAllocation(allocation: EnrichedAllocation, weeks: Date[]): AllocationBar[] {
  const project = RAW_PROJECTS.find((item) => item.code === allocation.projectCode);
  if (!project) return [];

  const bars: AllocationBar[] = [];
  let openBar: AllocationBar | null = null;

  for (let index = 0; index < weeks.length; index++) {
    const monday = weeks[index];
    const hours = hoursForWeek(allocation, monday);
    if (hours <= 0) {
      if (openBar) {
        bars.push(openBar);
        openBar = null;
      }
      continue;
    }

    const pct = pctFromHours(allocation.memberCode, hours);
    if (openBar && openBar.hoursPerWeek === hours) {
      openBar.endW = index;
      continue;
    }

    if (openBar) bars.push(openBar);

    openBar = {
      startW: index,
      endW: index,
      pct,
      label: `${hours}`,
      color: project.color,
      hoursPerWeek: hours,
    };
  }

  if (openBar) bars.push(openBar);
  return bars;
}

export function buildWeekGrid(overrideFrom?: string, overrideTo?: string): Date[] {
  let earliest = new Date(9999, 0, 1);
  let latest = new Date(0);

  for (const allocation of RAW_ALLOCS) {
    for (const entry of allocation.weeklyHours) {
      const current = parseDate(entry.weekStart);
      if (current < earliest) earliest = current;
      if (current > latest) latest = current;
    }
  }

  if (overrideFrom) {
    const date = parseDate(overrideFrom);
    if (date < earliest) earliest = date;
  }
  if (overrideTo) {
    const date = weekStart(parseDate(overrideTo));
    if (date > latest) latest = date;
  }

  const start = weekStart(earliest);
  const weeks: Date[] = [];
  let current = new Date(start);
  while (current <= latest) {
    weeks.push(new Date(current));
    current = addDays(current, 7);
  }
  return weeks;
}

export function buildMemberWeeks(memberCode: string, weeks: Date[]): MemberWeek[] {
  const allocations = RAW_ALLOCS.filter((allocation) => allocation.memberCode === memberCode);
  const offDays = memberOffDays(memberCode);

  return weeks.map((monday) => {
    let util = 0;
    for (const allocation of allocations) {
      util += pctFromHours(memberCode, hoursForWeek(allocation, monday));
    }
    return { util, offDay: isWeekOff(monday, offDays) };
  });
}

export function buildAllocBars(memberCode: string, weeks: Date[]): AllocationBar[] {
  const allocations = RAW_ALLOCS.filter((allocation) => allocation.memberCode === memberCode);
  return allocations.flatMap((allocation) => buildBarsForAllocation(allocation, weeks));
}

export function projectWeekSpan(projectCode: string, weeks: Date[]): { startW: number; endW: number } {
  const project = RAW_PROJECTS.find((item) => item.code === projectCode);
  if (!project) return { startW: 0, endW: 0 };

  const from = parseDate(project.startDate);
  const to = parseDate(project.endDate);
  let startW = -1;
  let endW = -1;

  for (let i = 0; i < weeks.length; i++) {
    const monday = weeks[i];
    const friday = addDays(monday, 4);
    if (from <= friday && to >= monday) {
      if (startW === -1) startW = i;
      endW = i;
    }
  }

  return { startW: Math.max(0, startW), endW: Math.max(0, endW) };
}

export function getEnrichedMembers(weeks: Date[]): EnrichedMember[] {
  return RAW_MEMBERS.filter((member) => member.status === "active").map((member) => {
    const allocations = RAW_ALLOCS
      .filter((allocation) => allocation.memberCode === member.code)
      .map((allocation) => ({
        ...allocation,
        bars: buildBarsForAllocation(allocation, weeks),
      }));

    return {
      ...member,
      allocations,
      weeks: buildMemberWeeks(member.code, weeks),
      allocBars: allocations.flatMap((allocation) => allocation.bars),
    };
  });
}

export function getEnrichedProjects(weeks: Date[]): EnrichedProject[] {
  return RAW_PROJECTS.map((project) => {
    const members = RAW_ALLOCS
      .filter((allocation) => allocation.projectCode === project.code)
      .map((allocation) => ({
        member: MEMBER_BY_CODE.get(allocation.memberCode)!,
        alloc: {
          ...allocation,
          bars: buildBarsForAllocation(allocation, weeks),
        },
      }))
      .filter((entry) => entry.member);

    const { startW, endW } = projectWeekSpan(project.code, weeks);
    return { ...project, members, startW, endW };
  });
}

export function isTeamOffWeek(monday: Date): boolean {
  for (let i = 0; i < 5; i++) {
    if (!TEAM_OFF_DAYS.has(isoDate(addDays(monday, i)))) return false;
  }
  return true;
}

export function buildViewportWeeks(count = 12, offsetWeeks = -2): Date[] {
  const start = addDays(weekStart(new Date()), offsetWeeks * 7);
  return Array.from({ length: count }, (_, index) => addDays(start, index * 7));
}

export function buildResourceWeekHours(memberCode: string, projectCode: string, weeks: Date[]): number[] {
  const allocation = RAW_ALLOCS.find(
    (item) => item.memberCode === memberCode && item.projectCode === projectCode,
  );
  if (!allocation) return weeks.map(() => 0);
  return weeks.map((monday) => hoursForWeek(allocation, monday));
}

function normaliseAlias(s: string): string {
  return s.trim().toLowerCase();
}

const MEMBER_ALIAS_INDEX = new Map<string, string>();
for (const member of RAW_MEMBERS) {
  for (const alias of [member.code, member.name, member.initials, ...member.aliases]) {
    MEMBER_ALIAS_INDEX.set(normaliseAlias(alias), member.code);
  }
}

export function getMembers(): RawMember[] {
  return RAW_MEMBERS;
}

export function getProjects(): RawProject[] {
  return RAW_PROJECTS;
}

export function getAllocations(): EnrichedAllocation[] {
  return RAW_ALLOCS;
}

export function getCapacity(): { holidays: RawHoliday[]; leaves: RawLeave[] } {
  return { holidays: RAW_HOLIDAYS, leaves: RAW_LEAVES };
}

export function resolveMemberCode(nameOrAlias: string): string | null {
  return MEMBER_ALIAS_INDEX.get(normaliseAlias(nameOrAlias)) ?? null;
}

export function getMemberUtilization(memberCode: string, weeks: Date[] = buildViewportWeeks()): MemberWeek[] {
  return buildMemberWeeks(memberCode, weeks);
}

export function getResourceOverview(weeks: Date[] = buildViewportWeeks()) {
  return {
    members: getEnrichedMembers(weeks),
    projects: getEnrichedProjects(weeks),
    weeks,
  };
}

export { RAW_MEMBERS, RAW_PROJECTS, RAW_ALLOCS, RAW_HOLIDAYS, RAW_LEAVES };
