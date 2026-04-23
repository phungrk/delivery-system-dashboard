"use client";

import Link from "next/link";
import { Layers, GitBranch, TrendingUp, AlertTriangle, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { Project, Phase, PhaseStatus } from "../mockData";
import { Badge, Progress } from "./ui";
import { SprintPhaseStepper } from "./SprintPhaseStepper";
import { getActiveSprintPhaseName } from "../scrum";

// ── Status / type helpers ────────────────────────────────────────────────────

const STATUS_BADGE: Record<Project["status"], string> = {
  "On Track": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "At Risk":  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Delayed":  "bg-red-500/15 text-red-400 border-red-500/30",
  "Completed":"bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const STATUS_ICON: Record<Project["status"], React.ElementType> = {
  "On Track": TrendingUp,
  "At Risk":  AlertTriangle,
  "Delayed":  Clock,
  "Completed": CheckCircle,
};

const PRIORITY_BADGE: Record<Project["priority"], string> = {
  High:   "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Low:    "bg-muted text-muted-foreground border-border",
};

const PHASE_BAR: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500",
  "On Track":  "bg-primary",
  "At Risk":   "bg-yellow-500",
  "Delayed":   "bg-destructive",
  "To Do":     "bg-muted/50",
};

const PHASE_LABEL: Record<PhaseStatus, string> = {
  "Completed": "text-emerald-400",
  "On Track":  "text-primary",
  "At Risk":   "text-yellow-400",
  "Delayed":   "text-destructive",
  "To Do":     "text-muted-foreground/60",
};

const SHORT_PHASE: Record<string, string> = {
  "Design":         "Design",
  "Implementation": "Impl.",
  "Verification":   "Verif.",
  "Approval":       "Approv.",
  "Release":        "Release",
  "Post-Release":   "Post",
};

// ── Waterfall card body ──────────────────────────────────────────────────────

function WaterfallCardBody({ phases, endDate }: { phases: Phase[]; endDate: string }) {
  const activePhase = phases.find((p) => p.status === "On Track" || p.status === "At Risk" || p.status === "Delayed");
  const nextTodo = phases.find((p) => p.status === "To Do");
  const allDone = phases.every((p) => p.status === "Completed");

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-0.5">
        {phases.map((phase, i) => (
          <div key={phase.name} className="flex items-center gap-0.5 flex-1 min-w-0">
            <div className="flex-1 min-w-0">
              <div className={`h-1.5 rounded-full ${PHASE_BAR[phase.status]}`} />
              <p className={`text-[9px] font-medium text-center mt-0.5 truncate ${PHASE_LABEL[phase.status]}`}>
                {SHORT_PHASE[phase.name] ?? phase.name}
              </p>
            </div>
            {i < phases.length - 1 && (
              <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 flex-shrink-0" />
            )}
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>
          {allDone
            ? <span className="text-emerald-400 font-medium">All phases complete</span>
            : activePhase
              ? <span>Active: <span className="text-foreground font-medium">{activePhase.name}</span></span>
              : nextTodo
                ? <span>Next: <span className="text-foreground font-medium">{nextTodo.name}</span></span>
                : null
          }
        </span>
        <span>{endDate ? `Due ${endDate}` : "--/--/--"}</span>
      </div>
    </div>
  );
}

// ── Scrum / generic task progress body ───────────────────────────────────────

function ScrumCardBody({ project }: { project: Project }) {
  const sprint = project.currentSprint;
  if (!sprint) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-semibold text-foreground">No active sprint</span>
          <span className="text-muted-foreground">Sprint data unavailable</span>
        </div>
        <SprintPhaseStepper />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Sprint data pending</span>
          <span>Ends {project.endDate}</span>
        </div>
      </div>
    );
  }

  const activePhaseName = getActiveSprintPhaseName(sprint);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">Sprint {sprint.number}</span>
        <span className="text-muted-foreground truncate text-right max-w-[160px]">{sprint.goal}</span>
      </div>
      <SprintPhaseStepper phases={sprint.phases} allCompleted={sprint.status === "Completed"} />
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {activePhaseName
            ? <>Active: <span className="text-foreground font-medium">{activePhaseName}</span></>
            : sprint.status === "Completed"
              ? <span className="text-emerald-400 font-medium">Sprint complete</span>
              : `Sprint ${project.completedSprints ?? 0}/${project.totalSprints ?? "?"} done`}
        </span>
        <span>Ends {sprint.endDate}</span>
      </div>
    </div>
  );
}

// ── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project: p }: ProjectCardProps) {
  const StatusIcon = STATUS_ICON[p.status];

  return (
    <Link
      href={`/v2/${p.id}`}
      className="bg-card border border-border rounded-xl p-4 cursor-pointer flex flex-col gap-3 hover:border-primary/50 hover:shadow-lg hover:shadow-black/20 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
            <Badge className={p.type === "Waterfall" ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-sky-500/40 bg-sky-500/10 text-sky-400"}>
              {p.type === "Waterfall" ? <Layers className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
              {p.type}
            </Badge>
            <Badge className={PRIORITY_BADGE[p.priority]}>{p.priority}</Badge>
          </div>
          <p className="text-base font-semibold leading-tight truncate">{p.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{p.client}</p>
        </div>
        <Badge className={STATUS_BADGE[p.status]}>
          <StatusIcon className="w-3 h-3" />
          {p.status}
        </Badge>
      </div>

      {/* Body */}
      {p.type === "Waterfall" && p.phases && p.phases.length > 0
        ? <WaterfallCardBody phases={p.phases} endDate={p.endDate} />
        : <ScrumCardBody project={p} />
      }

      {/* Footer */}
      <div className="pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Lead: <span className="text-foreground font-medium">{p.lead}</span></span>
          {(p.criticalInsights ?? 0) > 0 && (
            <span className="flex items-center gap-1 text-destructive font-medium">
              🔴 {p.criticalInsights} critical
            </span>
          )}
          {p.overdueTasks > 0 && (
            <span className="flex items-center gap-1 text-destructive">
              <Clock className="w-3 h-3" />{p.overdueTasks} overdue
            </span>
          )}
          {p.activeRisks > 0 && (
            <span className="flex items-center gap-1 text-yellow-400">
              <AlertTriangle className="w-3 h-3" />{p.activeRisks} risk{p.activeRisks > 1 ? "s" : ""}
            </span>
          )}
        </div>
        {p.budget.total > 0 && (
          <span className={p.budget.spent / p.budget.total > 0.9 ? "text-destructive" : ""}>
            ${Math.round(p.budget.spent / 1000)}k / ${Math.round(p.budget.total / 1000)}k
          </span>
        )}
      </div>
    </Link>
  );
}
