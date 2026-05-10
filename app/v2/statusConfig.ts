import { CheckCircle2, CheckCircle, Clock } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Project } from "./mockData";

// ── Project status — single source of truth ───────────────────────────────────
//
//  On Track  →  emerald  (✓ circle)
//  Delayed   →  red      (clock)
//  Completed →  blue     (✓ solid)

export const PROJECT_STATUS_BADGE: Record<Project["status"], string> = {
  "On Track":  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Delayed":   "bg-red-500/15 text-red-400 border-red-500/30",
  "Completed": "bg-blue-500/15 text-blue-400 border-blue-500/30",
};

export const PROJECT_STATUS_ICON: Record<Project["status"], LucideIcon> = {
  "On Track":  CheckCircle2,
  "Delayed":   Clock,
  "Completed": CheckCircle,
};

// Tailwind class for the icon color — use in StatCard `iconClass` prop
export const PROJECT_STATUS_ICON_CLASS: Record<Project["status"], string> = {
  "On Track":  "text-emerald-400",
  "Delayed":   "text-red-400",
  "Completed": "text-blue-400",
};
