import type { PhaseStatus, Sprint } from "./mockData";

export const SPRINT_PHASES = [
  "Planning",
  "PBI Approval",
  "Implementation + UT",
  "Verification + Fix Bug",
  "Review",
  "Release",
  "Retrospective",
] as const;

export type SprintPhaseName = (typeof SPRINT_PHASES)[number];

export const SPRINT_PHASE_SHORT_LABEL: Record<SprintPhaseName, string> = {
  "Planning": "Plan",
  "PBI Approval": "PBI",
  "Implementation + UT": "Dev+UT",
  "Verification + Fix Bug": "QA+Fix",
  "Review": "Review",
  "Release": "Rel.",
  "Retrospective": "Retro",
};

export function rawToSprintPhaseIndex(raw: string): number {
  const s = raw.toLowerCase().trim();
  if (s.includes("plan")) return 0;
  if (s.includes("pbi") || s.includes("approv")) return 1;
  if (s.includes("impl") || s.includes("dev") || s.includes("build") || s.includes("ut")) return 2;
  if (s.includes("verif") || s.includes("qa") || s.includes("fix") || s.includes("bug") || s.includes("test")) return 3;
  if (s.includes("review")) return 4;
  if (s.includes("release") || s.includes("deploy")) return 5;
  if (s.includes("retro")) return 6;
  return 2; // fallback: implementation
}

export function resolveSprintPhases(sprint?: Pick<Sprint, "status" | "phases"> | null) {
  return SPRINT_PHASES.map((name) => {
    const status = sprint?.phases?.find((phase) => phase.name === name)?.status
      ?? (sprint?.status === "Completed" ? "Completed" : "To Do");
    const progress = sprint?.phases?.find((phase) => phase.name === name)?.progress
      ?? (status === "Completed" ? 100 : 0);
    return { name, status, progress };
  });
}

export function getActiveSprintPhaseName(sprint?: Pick<Sprint, "status" | "phases"> | null) {
  const phases = resolveSprintPhases(sprint);
  const active = phases.find((phase) =>
    phase.status === "On Track" || phase.status === "At Risk" || phase.status === "Delayed",
  );
  if (active) return active.name;
  if (sprint?.status === "Completed") return null;
  return phases.find((phase) => phase.status === "To Do")?.name ?? null;
}

export function avgSprintVelocity(sprints: Sprint[]) {
  if (sprints.length === 0) return null;
  const total = sprints.reduce((sum, sprint) => sum + sprint.storyPointsDone, 0);
  return Math.round(total / sprints.length);
}

export function storyPointPct(sprint: Pick<Sprint, "storyPointsDone" | "storyPointsTotal">) {
  if (sprint.storyPointsTotal <= 0) return 0;
  return Math.round((sprint.storyPointsDone / sprint.storyPointsTotal) * 100);
}
