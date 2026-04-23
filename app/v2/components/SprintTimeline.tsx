"use client";

import { useMemo, useState } from "react";
import { Calendar, ChevronDown, ChevronRight, Circle, History, Zap } from "lucide-react";
import type { Project, PhaseStatus, Sprint } from "../mockData";
import { Badge, Progress } from "./ui";
import { avgSprintVelocity, resolveSprintPhases, storyPointPct } from "../scrum";

const PHASE_SEG_COLOR: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500",
  "On Track": "bg-primary",
  "At Risk": "bg-yellow-500",
  "Delayed": "bg-destructive",
  "To Do": "bg-muted/40",
};

const SPRINT_PHASE_DOT: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500",
  "On Track": "bg-primary",
  "At Risk": "bg-yellow-500",
  "Delayed": "bg-destructive",
  "To Do": "bg-border",
};

const SPRINT_PHASE_BADGE: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "On Track": "bg-primary/15 text-primary border-primary/30",
  "At Risk": "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Delayed": "bg-destructive/15 text-destructive border-destructive/30",
  "To Do": "bg-muted text-muted-foreground border-border",
};

function SprintPhaseBar({ sprint }: { sprint: Sprint }) {
  const phases = resolveSprintPhases(sprint);

  return (
    <div className="flex gap-0.5 h-1.5 rounded-full overflow-hidden w-full">
      {phases.map((phase) => (
        <div
          key={phase.name}
          className={`flex-1 ${PHASE_SEG_COLOR[phase.status]} ${phase.status === "To Do" ? "opacity-20" : "opacity-85"}`}
          title={`${phase.name}: ${phase.status}`}
        />
      ))}
    </div>
  );
}

function SprintPhaseDetail({ sprint }: { sprint: Sprint }) {
  const phases = resolveSprintPhases(sprint);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 mt-3">
      {phases.map((phase) => {
        const isTodo = phase.status === "To Do";
        const showProgress = phase.status !== "Completed" && !isTodo;
        return (
          <div key={phase.name} className="flex items-center gap-2 py-1">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SPRINT_PHASE_DOT[phase.status]} ${isTodo ? "opacity-25" : ""}`} />
            <span className={`text-sm flex-1 ${isTodo ? "text-muted-foreground/40" : "text-foreground"}`}>{phase.name}</span>
            {showProgress && (
              <div className="w-16 bg-muted rounded-full h-1 flex-shrink-0">
                <div className={`h-1 rounded-full ${PHASE_SEG_COLOR[phase.status]}`} style={{ width: `${phase.progress}%` }} />
              </div>
            )}
            <Badge className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full flex-shrink-0 ${SPRINT_PHASE_BADGE[phase.status]}`}>
              {phase.status === "Completed" ? "✓" : phase.status === "To Do" ? "–" : `${phase.progress}%`}
            </Badge>
          </div>
        );
      })}
    </div>
  );
}

function SprintCard({
  sprint,
  active,
  compact,
}: {
  sprint: Sprint;
  active: boolean;
  compact: boolean;
}) {
  const [expanded, setExpanded] = useState(active);
  const pct = storyPointPct(sprint);

  const cardClass = active
    ? "border-primary/40 bg-primary/5 shadow-sm"
    : sprint.status === "Completed"
      ? "border-emerald-500/20 bg-emerald-500/5"
      : "border-border bg-muted/10";

  const numberClass = active
    ? "bg-primary/20 text-primary border-primary/40"
    : sprint.status === "Completed"
      ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30"
      : "bg-muted text-muted-foreground border-border";

  const statusColor = sprint.status === "Active"
    ? "text-primary"
    : sprint.status === "Completed"
      ? "text-emerald-400"
      : "text-muted-foreground";

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${cardClass}`}>
      <button onClick={() => setExpanded((v) => !v)} className="w-full text-left p-4 flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 ${numberClass}`}>
          {sprint.number}
        </div>
        <div className="flex-1 min-w-0 space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">Sprint {sprint.number}</span>
            <span className={`text-xs font-semibold ${statusColor}`}>{sprint.status}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate">&quot;{sprint.goal}&quot;</p>
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <SprintPhaseBar sprint={sprint} />
            </div>
            <span className="text-xs text-muted-foreground flex-shrink-0 tabular-nums">
              {sprint.storyPointsDone}/{sprint.storyPointsTotal} pts
            </span>
          </div>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className={`border-t border-border/50 pt-3 space-y-3 ${compact ? "px-4 pb-4" : "px-4 pb-4"}`}>
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {sprint.startDate} → {sprint.endDate}
            </span>
            <span className="font-semibold">{pct}% story points done</span>
          </div>
          <Progress
            value={pct}
            className={`h-2 ${sprint.status === "Completed" ? "[&>div]:bg-emerald-500" : ""}`}
          />
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Sprint Phases</p>
            <SprintPhaseDetail sprint={sprint} />
          </div>
        </div>
      )}
    </div>
  );
}

export function SprintTimeline({
  project,
  compact = false,
}: {
  project: Project;
  compact?: boolean;
}) {
  const sprints = useMemo(
    () => [...(project.sprintHistory ?? []), ...(project.currentSprint ? [project.currentSprint] : [])]
      .sort((a, b) => a.number - b.number),
    [project.currentSprint, project.sprintHistory],
  );
  const totalSprints = project.totalSprints;
  const remaining = totalSprints ? Math.max(0, totalSprints - sprints.length) : 0;
  const avgVelocity = avgSprintVelocity(project.sprintHistory ?? []);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-sm font-semibold flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-muted-foreground" />
            Sprint Timeline
          </h4>
          <span className="text-xs text-muted-foreground">
            {sprints.length} of {totalSprints ?? "?"} sprints
          </span>
        </div>
        <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
          {[
            { label: "Total Sprints", value: totalSprints ?? "?" },
            { label: "Completed", value: project.completedSprints ?? 0 },
            { label: "Avg Velocity", value: avgVelocity !== null ? `${avgVelocity} pts` : "–" },
            { label: "Backlog Items", value: project.backlogItems ?? 0 },
          ].map((item) => (
            <div key={item.label} className={`bg-muted/30 rounded-lg text-center ${compact ? "p-3" : "p-4"}`}>
              <p className="text-xs text-muted-foreground mb-1">{item.label}</p>
              <p className="text-lg font-bold">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="flex items-center gap-1.5 mb-4">
          <History className="w-4 h-4 text-muted-foreground" />
          <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">History</span>
        </div>
        <div className={compact ? "space-y-2" : "relative"}>
          {!compact && <div className="absolute left-5 top-5 bottom-5 w-0.5 bg-border z-0" />}
          <div className={`${compact ? "space-y-2" : "space-y-3 relative z-10"}`}>
            {sprints.map((sprint, index) => (
              <SprintCard
                key={`${sprint.number}-${sprint.startDate}`}
                sprint={sprint}
                active={index === sprints.length - 1 && sprint.status !== "Completed"}
                compact={compact}
              />
            ))}

            {remaining > 0 && (
              compact ? (
                <div className="rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground">
                  {remaining} upcoming sprint(s) planned
                </div>
              ) : (
                <div className="rounded-xl border border-dashed border-border p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-border flex items-center justify-center text-xs text-muted-foreground font-medium">
                    +{remaining}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">{remaining} upcoming sprint(s) planned</p>
                    <p className="text-xs text-muted-foreground/60">Not yet started</p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
