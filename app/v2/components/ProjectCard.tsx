"use client";

import { Layers, GitBranch, TrendingUp, AlertTriangle, Clock, CheckCircle, ChevronRight } from "lucide-react";
import { Project, Phase, PhaseStatus } from "../mockData";
import { Badge, Progress } from "./ui";

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

function TaskProgressBody({ project }: { project: Project }) {
  const sprint = project.currentSprint;
  const isScrum = project.type === "Scrum";

  if (!sprint) {
    // Minimal fallback: just show overall progress
    return (
      <div className="space-y-2">
        <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
          <span>Progress</span>
          <span className="font-medium text-foreground">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2" />
        <div className="flex justify-end text-xs text-muted-foreground">
          <span>Due {project.endDate}</span>
        </div>
      </div>
    );
  }

  const pct = sprint.pointsTotal > 0 ? (sprint.pointsDone / sprint.pointsTotal) * 100 : project.progress;
  const stats = isScrum
    ? [
        { label: "Points Done", value: `${sprint.pointsDone}/${sprint.pointsTotal}` },
        { label: "Velocity", value: sprint.velocity },
        { label: "Backlog", value: sprint.backlog },
      ]
    : [
        { label: "Done", value: `${sprint.pointsDone}/${sprint.pointsTotal}` },
        { label: "In Progress", value: project.tasks.filter((t) => t.status === "In Progress").length },
        { label: "Overdue", value: project.overdueTasks },
      ];

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-muted-foreground mb-0.5">
        {isScrum
          ? <span>Sprint {sprint.number}/{sprint.total}</span>
          : <span>Tasks</span>
        }
        <span className="font-medium text-foreground">{Math.round(pct)}%</span>
      </div>
      <Progress value={pct} className="h-2" />
      <div className="grid grid-cols-3 gap-2 mt-1">
        {stats.map((s) => (
          <div key={s.label} className="bg-muted/40 rounded-md py-1.5 text-center">
            <p className="text-xs font-semibold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-muted-foreground">
        {isScrum
          ? <span>Sprint {project.sprintsDone}/{project.sprintsTotal} done</span>
          : <span>{sprint.pointsDone} of {sprint.pointsTotal} tasks done</span>
        }
        <span>Ends {sprint.endDate}</span>
      </div>
    </div>
  );
}

// ── Project Card ─────────────────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  onClick: () => void;
}

export function ProjectCard({ project: p, onClick }: ProjectCardProps) {
  const StatusIcon = STATUS_ICON[p.status];

  return (
    <div
      onClick={onClick}
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
        : <TaskProgressBody project={p} />
      }

      {/* Footer */}
      <div className="pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-3">
          <span>Lead: <span className="text-foreground font-medium">{p.lead}</span></span>
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
    </div>
  );
}
