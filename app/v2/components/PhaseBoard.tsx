import Link from "next/link";
import {
  Layers, GitBranch,
  TrendingUp, AlertTriangle, Clock, CheckCircle, ShieldAlert,
} from "lucide-react";
import type { Project } from "../mockData";
import { Badge, Progress } from "./ui";
import { SprintPhaseStepper } from "./SprintPhaseStepper";

// ── Phase definitions ─────────────────────────────────────────────────────────

const WATERFALL_PHASES = [
  "Design", "Implementation", "Verification", "Approval", "Release", "Post-Release",
] as const;
type WaterfallPhaseName = (typeof WATERFALL_PHASES)[number];

const PHASE_ACCENT: Record<WaterfallPhaseName, { border: string; bg: string; text: string; dot: string }> = {
  "Design":         { border: "border-t-violet-500",  bg: "bg-violet-500/5",  text: "text-violet-400",  dot: "bg-violet-500" },
  "Implementation": { border: "border-t-primary",     bg: "bg-primary/5",     text: "text-primary",     dot: "bg-primary" },
  "Verification":   { border: "border-t-sky-500",     bg: "bg-sky-500/5",     text: "text-sky-400",     dot: "bg-sky-500" },
  "Approval":       { border: "border-t-amber-500",   bg: "bg-amber-500/5",   text: "text-amber-400",   dot: "bg-amber-500" },
  "Release":        { border: "border-t-emerald-500", bg: "bg-emerald-500/5", text: "text-emerald-400", dot: "bg-emerald-500" },
  "Post-Release":   { border: "border-t-teal-500",    bg: "bg-teal-500/5",    text: "text-teal-400",    dot: "bg-teal-500" },
};

// ── Status helpers ────────────────────────────────────────────────────────────

const STATUS_CLS: Record<Project["status"], string> = {
  "On Track":  "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "At Risk":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Delayed":   "bg-destructive/15 text-destructive border-destructive/30",
  "Completed": "bg-blue-500/15 text-blue-400 border-blue-500/30",
};
const STATUS_ICON: Record<Project["status"], React.ElementType> = {
  "On Track": TrendingUp, "At Risk": AlertTriangle, "Delayed": Clock, "Completed": CheckCircle,
};

// ── Bucketing ─────────────────────────────────────────────────────────────────

function getCurrentPhaseName(project: Project): WaterfallPhaseName {
  if (!project.phases) return "Design";

  // Active phase: explicitly in progress or at risk
  const active = project.phases.find(
    (ph) => ph.status === "On Track" || ph.status === "At Risk" || ph.status === "Delayed",
  );
  if (active) return active.name as WaterfallPhaseName;

  // All done → post-release
  if (project.phases.every((ph) => ph.status === "Completed")) return "Post-Release";

  // No active phase but not all done: all tasks in current phase just finished
  // (generateWaterfallPhases marks the phase Completed when allTasksDone=true).
  // Find the last Completed phase — it's the one whose tasks were just finished.
  for (let i = project.phases.length - 1; i >= 0; i--) {
    if (project.phases[i].status === "Completed") {
      return project.phases[i].name as WaterfallPhaseName;
    }
  }

  return "Design";
}

// ── ProjectMiniCard (Waterfall) ───────────────────────────────────────────────

function ProjectMiniCard({ project: p }: { project: Project }) {
  const StatusIcon = STATUS_ICON[p.status];
  const overdue = p.overdueTasks ?? 0;
  const risks   = p.activeRisks ?? 0;
  const spent   = p.budget.spent;
  const total   = p.budget.total;

  return (
    <Link
      href={`/v2/${p.id}`}
      className="block bg-card border border-border rounded-lg p-3 hover:border-primary/50 hover:shadow-md hover:shadow-black/20 transition-all duration-150 space-y-2.5 group"
    >
      {/* Row 1: name + status */}
      <div className="flex items-start gap-1.5">
        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {p.name}
        </p>
        <Badge className={`${STATUS_CLS[p.status]} shrink-0 text-[10px] flex items-center gap-0.5 px-1.5 py-0.5`}>
          <StatusIcon className="w-3 h-3" />
        </Badge>
      </div>

      {/* Row 2: client */}
      <p className="text-xs text-muted-foreground truncate">{p.client}</p>

      {/* Row 3: progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Progress</span>
          <span>{p.progress}%</span>
        </div>
        <Progress value={p.progress} className="h-1.5" />
      </div>

      {/* Row 4: footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="text-[10px]">
          {overdue > 0 ? (
            <span className="flex items-center gap-1 text-destructive"><Clock className="w-2.5 h-2.5" />{overdue}</span>
          ) : risks > 0 ? (
            <span className="flex items-center gap-1 text-yellow-400"><ShieldAlert className="w-2.5 h-2.5" />{risks}</span>
          ) : (
            <span className="text-muted-foreground">{p.lead}</span>
          )}
        </div>
        {total > 0 && (
          <span className={`text-[10px] font-medium ${spent / total > 0.9 ? "text-destructive" : "text-muted-foreground"}`}>
            ${Math.round(spent / 1000)}k / ${Math.round(total / 1000)}k
          </span>
        )}
      </div>
    </Link>
  );
}

// ── PhaseColumn ───────────────────────────────────────────────────────────────

function PhaseColumn({ name, projects }: { name: WaterfallPhaseName; projects: Project[] }) {
  const a = PHASE_ACCENT[name];
  return (
    <div className="min-w-[210px] max-w-[210px] flex flex-col">
      <div className={`rounded-t-lg border border-b-0 border-border px-3 py-2.5 border-t-2 ${a.border} ${a.bg} flex items-center justify-between`}>
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${a.dot}`} />
          <span className={`text-xs font-semibold ${a.text}`}>{name}</span>
        </div>
        <span className="text-[10px] font-bold bg-card border border-border rounded-full px-1.5 py-0.5 text-muted-foreground min-w-[18px] text-center">
          {projects.length}
        </span>
      </div>
      <div className={`flex-1 border border-border rounded-b-lg p-2 space-y-2 min-h-[120px] ${a.bg}`}>
        {projects.length === 0 ? (
          <div className="flex items-center justify-center h-20">
            <span className="text-[10px] text-muted-foreground/50">No projects</span>
          </div>
        ) : (
          projects.map((p) => <ProjectMiniCard key={p.id} project={p} />)
        )}
      </div>
    </div>
  );
}

// ── ScrumMiniCard ─────────────────────────────────────────────────────────────

function ScrumMiniCard({ project: p }: { project: Project }) {
  const StatusIcon = STATUS_ICON[p.status];
  const overdue = p.overdueTasks ?? 0;
  const risks   = p.activeRisks ?? 0;
  const sprint  = p.currentSprint;

  return (
    <Link
      href={`/v2/${p.id}`}
      className="block bg-card border border-border rounded-lg p-3 hover:border-primary/50 hover:shadow-md hover:shadow-black/20 transition-all duration-150 space-y-2 group"
    >
      {/* Row 1: name + status */}
      <div className="flex items-start gap-1.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <GitBranch className="w-3 h-3 text-sky-400 flex-shrink-0" />
            <p className="text-xs font-semibold group-hover:text-primary transition-colors truncate">{p.name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{p.client}</p>
        </div>
        <Badge className={`${STATUS_CLS[p.status]} shrink-0 text-[10px] flex items-center gap-0.5 px-1.5 py-0.5`}>
          <StatusIcon className="w-3 h-3" />
        </Badge>
      </div>

      {/* Row 2: sprint phase stepper */}
      <SprintPhaseStepper phases={sprint?.phases} allCompleted={sprint?.status === "Completed"} />

      {/* Row 3: footer */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="text-[10px]">
          {overdue > 0 ? (
            <span className="flex items-center gap-1 text-destructive"><Clock className="w-2.5 h-2.5" />{overdue}</span>
          ) : risks > 0 ? (
            <span className="flex items-center gap-1 text-yellow-400"><ShieldAlert className="w-2.5 h-2.5" />{risks}</span>
          ) : sprint ? (
            <span className="text-muted-foreground">Sp.{sprint.number} · {p.completedSprints ?? 0}/{p.totalSprints ?? 0}</span>
          ) : null}
        </div>
        {(p.velocity ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">{p.velocity} pts/sp</span>
        )}
      </div>
    </Link>
  );
}

// ── PhaseBoard ────────────────────────────────────────────────────────────────

export function PhaseBoard({ projects }: { projects: Project[] }) {
  const waterfall = projects.filter((p) => p.type === "Waterfall");
  const scrum     = projects.filter((p) => p.type === "Scrum");

  const buckets = Object.fromEntries(
    WATERFALL_PHASES.map((ph) => [ph, [] as Project[]]),
  ) as Record<WaterfallPhaseName, Project[]>;

  for (const p of waterfall) {
    buckets[getCurrentPhaseName(p)].push(p);
  }

  return (
    <div className="space-y-6">
      {/* Waterfall section */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Waterfall Phase Board</span>
          <span className="text-xs text-muted-foreground">({waterfall.length} projects)</span>
        </div>
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3" style={{ minWidth: "max-content" }}>
            {WATERFALL_PHASES.map((phase) => (
              <PhaseColumn key={phase} name={phase} projects={buckets[phase]} />
            ))}
          </div>
        </div>
      </div>

      {/* Scrum section */}
      {scrum.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-semibold">Scrum Projects</span>
            <span className="text-xs text-muted-foreground">({scrum.length} projects — sprint-based)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scrum.map((p) => (
              <ScrumMiniCard key={p.id} project={p} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
