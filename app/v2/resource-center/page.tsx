import {
  buildResourceWeekHours,
  buildViewportWeeks,
  getEnrichedMembers,
  getEnrichedProjects,
  isTeamOffWeek,
  RAW_PROJECTS,
} from "@/lib/resource-db";
import { ResourceCenter, type ResourceCenterMember, type ResourceCenterProject, type ResourceCenterWeek } from "../components/ResourceCenter";

export const metadata = {
  title: "Resource Center",
  description: "Team capacity planning and project resource allocation",
};

const MONTH_ABBR = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

function shiftDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function isoLocalDate(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export default function ResourceCenterPage() {
  const viewportDates = buildViewportWeeks(12, -2);

  const weeks: ResourceCenterWeek[] = viewportDates.map((monday, i) => {
    const friday = shiftDays(monday, 4);
    const botSuffix =
      friday.getMonth() !== monday.getMonth()
        ? ` ${MONTH_ABBR[friday.getMonth()]}`
        : "";
    return {
      id: `w${i}`,
      iso: isoLocalDate(monday),
      top: `${MONTH_ABBR[monday.getMonth()]} ${monday.getDate()}`,
      bot: `- ${friday.getDate()}${botSuffix}`,
      unavail: isTeamOffWeek(monday),
    };
  });

  const members: ResourceCenterMember[] = getEnrichedMembers(viewportDates).map((em) => ({
    id: em.code,
    name: em.name,
    role: em.role,
    initials: em.initials,
    avatarColor: em.avatarColor,
    util: em.weeks.map((w) => (w.offDay ? 0 : w.util)),
    projects: em.allocations.flatMap((allocation) => {
      const project = RAW_PROJECTS.find((item) => item.code === allocation.projectCode);
      if (!project) return [];
      return [{
        id: project.code,
        name: project.name,
        color: project.color as ResourceCenterMember["projects"][number]["color"],
        estH: allocation.estHours,
        actualH: allocation.actualHours ?? undefined,
        weeklyHours: buildResourceWeekHours(em.code, project.code, viewportDates),
      }];
    }),
  }));

  const projects: ResourceCenterProject[] = getEnrichedProjects(viewportDates).map((ep) => ({
    id: ep.code,
    name: ep.name,
    count: ep.members.length,
    status: ep.status === "Paused" ? "On Hold" : ep.status,
    budget: `$${ep.budget.toLocaleString()}`,
    eac: `$${ep.eac.toLocaleString()}`,
    actualFees: `$${ep.actualFees.toLocaleString()}`,
    barStart: ep.startW,
    barEnd: Math.min(ep.endW, weeks.length - 1),
    resources: ep.members.map(({ member, alloc }) => ({
      id: member.code,
      name: member.name,
      initials: member.initials,
      avatarColor: member.avatarColor,
      estH: alloc.estHours,
      allocH: alloc.actualHours ?? 0,
      util: buildResourceWeekHours(member.code, ep.code, viewportDates),
    })),
  }));

  return <ResourceCenter weeks={weeks} members={members} projects={projects} />;
}
