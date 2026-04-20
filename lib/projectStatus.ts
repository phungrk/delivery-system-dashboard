import { ProjectMetrics } from "./schema";

export type ProjectStatus = "on-track" | "at-risk" | "delayed" | "unknown";

export function deriveProjectStatus(m: ProjectMetrics): ProjectStatus {
  const timePct        = m.totalDays > 0 ? (m.daysElapsed / m.totalDays) * 100 : 0;
  const completionPct  = m.completion.completionRate;
  const hasBlocker     = m.activeBlockers > 0;
  const sprintEnded    = m.daysRemaining <= 0 && m.totalDays > 0;
  const hasPeriod      = !!m.period.start && !!m.period.end;

  if (!hasPeriod) return "unknown";

  if (m.type === "Scrum" || m.type === "Scrum-P") {
    if (sprintEnded && completionPct < 100) return "delayed";
    if (hasBlocker)                          return "at-risk";
    if (completionPct < timePct - 15)        return "at-risk";
    if (completionPct < timePct - 30)        return "delayed";
    return "on-track";
  }

  if (m.type === "Waterfall") {
    if (sprintEnded && completionPct < 100)       return "delayed";
    if (m.completion.overdueRate > 30)             return "delayed";
    if (hasBlocker || m.completion.overdueRate > 0) return "at-risk";
    if (completionPct < 50 && timePct > 50)        return "at-risk";
    return "on-track";
  }

  // Kanban — no timebox
  if (m.completion.overdueRate > 30) return "delayed";
  if (hasBlocker || m.completion.overdueRate > 0) return "at-risk";
  return "on-track";
}

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; className: string }> = {
  "on-track": { label: "On Track",  className: "text-green-700 bg-green-50 border-green-200" },
  "at-risk":  { label: "At Risk",   className: "text-yellow-700 bg-yellow-50 border-yellow-300" },
  "delayed":  { label: "Delayed",   className: "text-red-700 bg-red-50 border-red-200" },
  "unknown":  { label: "No Data",   className: "text-gray-400 bg-gray-50 border-gray-200" },
};
