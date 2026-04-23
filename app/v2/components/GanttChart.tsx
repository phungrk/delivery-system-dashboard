"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, GitBranch } from "lucide-react";
import type { Project, PhaseStatus, Sprint } from "../mockData";
import { resolveSprintPhases, SPRINT_PHASES } from "../scrum";

// ── Constants ─────────────────────────────────────────────────────────────────

const MONTH_WIDTH  = 96;
const ROW_H        = 38;
const PHASE_ROW_H  = 28;
const LEFT_W       = 224;

// ── Date utils ────────────────────────────────────────────────────────────────

function toDate(s: string): Date {
  if (!s || s === "-") return new Date(0);
  const [y, m, d] = s.split("-").map(Number);
  if (!y || !m || !d) return new Date(0);
  return new Date(y, m - 1, d);
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}

function diffMonths(a: Date, b: Date): number {
  return (b.getFullYear() - a.getFullYear()) * 12 + (b.getMonth() - a.getMonth());
}

function msToDateStr(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ── Bar position helpers ──────────────────────────────────────────────────────

function barLeft(dateStr: string, minMs: number, totalMs: number, tw: number): number {
  const ms = toDate(dateStr).getTime();
  if (ms === 0) return 0;
  return Math.max(0, ((ms - minMs) / totalMs) * tw);
}

function barWidth(s: string, e: string, minMs: number, totalMs: number, tw: number): number {
  const sMs = Math.max(toDate(s).getTime(), minMs);
  const eMs = Math.min(toDate(e).getTime(), minMs + totalMs);
  return Math.max(4, ((eMs - sMs) / totalMs) * tw);
}

// ── Style maps ────────────────────────────────────────────────────────────────

const projectBarCls: Record<Project["status"], string> = {
  "On Track":  "bg-primary",
  "At Risk":   "bg-yellow-500",
  "Delayed":   "bg-destructive",
  "Completed": "bg-emerald-500",
};

const phaseOuterCls: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500/20 border border-emerald-500/40",
  "On Track":  "bg-primary/20 border border-primary/40",
  "At Risk":   "bg-yellow-500/20 border border-yellow-500/40",
  "Delayed":   "bg-destructive/20 border border-destructive/40",
  "To Do":     "bg-muted/30 border border-dashed border-border/50",
};

const phaseFillCls: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500",
  "On Track":  "bg-primary",
  "At Risk":   "bg-yellow-500",
  "Delayed":   "bg-destructive",
  "To Do":     "",
};

const phaseDotCls: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500",
  "On Track":  "bg-primary",
  "At Risk":   "bg-yellow-500",
  "Delayed":   "bg-destructive",
  "To Do":     "bg-muted-foreground/30",
};

const phaseTextCls: Record<PhaseStatus, string> = {
  "Completed": "text-emerald-400",
  "On Track":  "text-primary",
  "At Risk":   "text-yellow-400",
  "Delayed":   "text-destructive",
  "To Do":     "text-muted-foreground/50",
};

const PHASE_SEG_COLOR: Record<string, string> = {
  "Completed": "bg-emerald-500",
  "On Track":  "bg-primary",
  "At Risk":   "bg-yellow-500",
  "Delayed":   "bg-destructive",
  "To Do":     "bg-muted/40",
};

// ── Sprint row data ───────────────────────────────────────────────────────────

interface SprintDisplay {
  number: Sprint["number"];
  startDate: Sprint["startDate"];
  endDate: Sprint["endDate"];
  status: Sprint["status"];
  phases?: Sprint["phases"];
}

function buildSprintRows(project: Project): SprintDisplay[] {
  return [...(project.sprintHistory ?? []), ...(project.currentSprint ? [project.currentSprint] : [])]
    .sort((a, b) => a.number - b.number)
    .map((sprint) => ({
      number: sprint.number,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      status: sprint.status,
      phases: sprint.phases,
    }));
}

// ── Grid lines ────────────────────────────────────────────────────────────────

function GridLines({ count, todayX, tw }: { count: number; todayX: number; tw: number }) {
  return (
    <>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="absolute inset-y-0 w-px bg-border/20" style={{ left: i * MONTH_WIDTH }} />
      ))}
      {todayX > 0 && todayX < tw && (
        <div className="absolute inset-y-0 w-px bg-primary/50 z-10" style={{ left: todayX }} />
      )}
    </>
  );
}

// ── Phase sub-row (Waterfall) ─────────────────────────────────────────────────

interface PhaseRowProps {
  name: string;
  status: PhaseStatus;
  progress: number;
  phaseStart: string;
  phaseEnd: string;
  minMs: number; totalMs: number; tw: number;
  monthCount: number; todayX: number;
}

function PhaseRow({ name, status, progress, phaseStart, phaseEnd, minMs, totalMs, tw, monthCount, todayX }: PhaseRowProps) {
  const hasBar = !!(phaseStart && phaseStart !== "-" && phaseEnd && phaseEnd !== "-");
  const left   = hasBar ? barLeft(phaseStart, minMs, totalMs, tw) : 0;
  const width  = hasBar ? barWidth(phaseStart, phaseEnd, minMs, totalMs, tw) : 0;

  return (
    <div className="flex items-center border-t border-border/30 hover:bg-muted/20 transition-colors" style={{ height: PHASE_ROW_H }}>
      <div className="flex-shrink-0 sticky left-0 z-10 bg-card flex items-center gap-2 px-3 h-full border-r border-border/30" style={{ width: LEFT_W }}>
        <div className="w-5 flex-shrink-0" />
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${phaseDotCls[status]}`} />
        <span className={`text-[10px] font-medium truncate ${phaseTextCls[status]}`}>{name}</span>
      </div>
      <div className="relative flex-shrink-0 h-full" style={{ width: tw }}>
        <GridLines count={monthCount} todayX={todayX} tw={tw} />
        {hasBar && (
          <div
            className={`absolute rounded overflow-hidden ${phaseOuterCls[status]}`}
            style={{ left, width, top: "50%", transform: "translateY(-50%)", height: 14 }}
            title={`${name}: ${phaseStart} → ${phaseEnd}  ${progress}%`}
          >
            {progress > 0 && status !== "To Do" && (
              <div className={`h-full ${phaseFillCls[status]}`} style={{ width: `${progress}%` }} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sprint sub-row ────────────────────────────────────────────────────────────

interface SprintRowProps {
  sprint: SprintDisplay;
  minMs: number; totalMs: number; tw: number;
  monthCount: number; todayX: number;
}

function SprintRow({ sprint, minMs, totalMs, tw, monthCount, todayX }: SprintRowProps) {
  const sprintLeft  = barLeft(sprint.startDate, minMs, totalMs, tw);
  const sprintWidth = barWidth(sprint.startDate, sprint.endDate, minMs, totalMs, tw);
  const segW = sprintWidth / 7;
  const phases = resolveSprintPhases(sprint);

  const dotCls =
    sprint.status === "Completed" ? "bg-emerald-500" :
    sprint.status === "Active"    ? "bg-primary animate-pulse" :
    "bg-muted-foreground/30";

  return (
    <div className="flex items-center border-t border-border/30 hover:bg-muted/20 transition-colors" style={{ height: PHASE_ROW_H }}>
      <div className="flex-shrink-0 sticky left-0 z-10 bg-card flex items-center gap-2 px-3 h-full border-r border-border/30" style={{ width: LEFT_W }}>
        <div className="w-5 flex-shrink-0" />
        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
        <span className="text-[10px] font-medium text-muted-foreground truncate">Sprint {sprint.number}</span>
      </div>
      <div className="relative flex-shrink-0 h-full" style={{ width: tw }}>
        <GridLines count={monthCount} todayX={todayX} tw={tw} />
        {phases.map((phase, idx) => (
          <div
            key={phase.name}
            className={`absolute rounded-sm opacity-80 ${PHASE_SEG_COLOR[phase.status]}`}
            style={{
              left:   sprintLeft + idx * segW,
              width:  Math.max(segW - 1, 1),
              top:    "50%",
              transform: "translateY(-50%)",
              height: 14,
            }}
            title={`${SPRINT_PHASES[idx]}: ${phase.status}`}
          />
        ))}
        <div
          className="absolute rounded border border-border/30 pointer-events-none"
          style={{ left: sprintLeft, width: sprintWidth, top: "50%", transform: "translateY(-50%)", height: 14 }}
        />
      </div>
    </div>
  );
}

// ── GanttChart ────────────────────────────────────────────────────────────────

export function GanttChart({ projects }: { projects: Project[] }) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(projects.map((p) => p.id)),
  );

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  // ── Date range ────────────────────────────────────────────────────────────
  const { minMs, totalMs, tw, months, todayX } = useMemo(() => {
    const msList: number[] = [];
    for (const p of projects) {
      const sd = toDate(p.startDate).getTime();
      const ed = toDate(p.endDate).getTime();
      if (sd > 0) msList.push(sd);
      if (ed > 0) msList.push(ed);
      for (const ph of p.phases ?? []) {
        const d = toDate(ph.endDate).getTime();
        if (d > 0) msList.push(d);
      }
    }
    if (msList.length === 0) {
      const now = new Date();
      msList.push(new Date(now.getFullYear(), 0, 1).getTime());
      msList.push(new Date(now.getFullYear(), 11, 31).getTime());
    }

    const minDate = addMonths(startOfMonth(new Date(Math.min(...msList))), -1);
    const maxDate = addMonths(startOfMonth(new Date(Math.max(...msList))), 2);
    const numMonths = Math.max(diffMonths(minDate, maxDate), 1);
    const tw = Math.max(numMonths * MONTH_WIDTH, 600);
    const minMs = minDate.getTime();
    const totalMs = maxDate.getTime() - minMs;

    const months: Date[] = Array.from({ length: numMonths }, (_, i) => addMonths(minDate, i));
    const todayX = (Date.now() - minMs) / totalMs * tw;

    return { minMs, totalMs, tw, months, todayX };
  }, [projects]);

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_W + tw }}>

          {/* ── Header ───────────────────────────────────────────────────── */}
          <div className="flex border-b border-border bg-muted/40 sticky top-0 z-20">
            <div
              className="flex-shrink-0 sticky left-0 z-30 bg-muted/40 px-4 py-2 text-xs font-semibold text-muted-foreground border-r border-border flex items-center"
              style={{ width: LEFT_W }}
            >
              Project / Phase
            </div>
            <div className="relative flex-shrink-0" style={{ width: tw, height: 36 }}>
              {months.map((month, i) => (
                <div
                  key={i}
                  className="absolute inset-y-0 flex items-center px-2 text-[10px] text-muted-foreground font-medium border-r border-border/30"
                  style={{ left: i * MONTH_WIDTH, width: MONTH_WIDTH }}
                >
                  {month.toLocaleString("en", { month: "short" })} &apos;{String(month.getFullYear()).slice(-2)}
                </div>
              ))}
              {todayX > 0 && todayX < tw && (
                <div className="absolute inset-y-0 w-px bg-primary/50 z-10" style={{ left: todayX - 1 }}>
                  <span className="absolute top-0 left-1 text-[9px] font-bold text-primary whitespace-nowrap leading-tight">
                    Today
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* ── Project rows ─────────────────────────────────────────────── */}
          {projects.map((project, pi) => {
            const isExpanded = expanded.has(project.id);
            const isScrum    = project.type === "Scrum";
            const pLeft  = barLeft(project.startDate, minMs, totalMs, tw);
            const pWidth = barWidth(project.startDate, project.endDate, minMs, totalMs, tw);
            const sprints = isScrum ? buildSprintRows(project) : [];

            return (
              <div key={project.id}>
                {/* Project header row */}
                <div
                  className={`flex items-center hover:bg-muted/20 transition-colors ${pi > 0 ? "border-t border-border" : ""}`}
                  style={{ height: ROW_H }}
                >
                  {/* Left name cell */}
                  <div
                    className="flex-shrink-0 sticky left-0 z-10 bg-card flex items-center gap-2 px-3 h-full border-r border-border cursor-pointer"
                    style={{ width: LEFT_W }}
                    onClick={() => toggleExpand(project.id)}
                  >
                    {isExpanded
                      ? <ChevronDown  className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    }
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/v2/${project.id}`}
                        onClick={(e) => e.stopPropagation()}
                        className="text-xs font-semibold truncate block hover:text-primary transition-colors"
                      >
                        {project.name}
                      </Link>
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        {isScrum && <GitBranch className="w-2.5 h-2.5 text-sky-400 flex-shrink-0" />}
                        {project.client}
                      </p>
                    </div>
                  </div>

                  {/* Timeline bar */}
                  <div className="relative flex-shrink-0 h-full" style={{ width: tw }}>
                    <GridLines count={months.length} todayX={todayX} tw={tw} />
                    <div
                      className="absolute rounded-md overflow-hidden bg-muted/40 border border-border/50"
                      style={{ left: pLeft, width: pWidth, top: "50%", transform: "translateY(-50%)", height: 20 }}
                    >
                      <div
                        className={`h-full opacity-80 ${projectBarCls[project.status]}`}
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                    {pWidth >= 30 && (
                      <div
                        className="absolute z-10 text-[10px] font-semibold text-foreground/80 pointer-events-none"
                        style={{ left: pLeft + 6, top: "50%", transform: "translateY(-50%)" }}
                      >
                        {project.progress}%
                      </div>
                    )}
                  </div>
                </div>

                {/* Sub-rows */}
                {isExpanded && (
                  <div className="bg-muted/5">
                    {!isScrum && project.phases?.map((phase, i) => {
                      const phaseStart = i === 0
                        ? (project.startDate || "-")
                        : (project.phases![i - 1].endDate || project.startDate || "-");
                      return (
                        <PhaseRow
                          key={phase.name}
                          name={phase.name}
                          status={phase.status}
                          progress={phase.progress}
                          phaseStart={phaseStart}
                          phaseEnd={phase.endDate}
                          minMs={minMs} totalMs={totalMs} tw={tw}
                          monthCount={months.length} todayX={todayX}
                        />
                      );
                    })}
                    {isScrum && sprints.map((sprint) => (
                      <SprintRow
                        key={sprint.number}
                        sprint={sprint}
                        minMs={minMs} totalMs={totalMs} tw={tw}
                        monthCount={months.length} todayX={todayX}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Legend ───────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20 flex-wrap">
        <span className="text-[10px] font-semibold text-muted-foreground">Legend:</span>
        {[
          { cls: "bg-primary",                                         label: "On Track" },
          { cls: "bg-yellow-500",                                      label: "At Risk" },
          { cls: "bg-destructive",                                     label: "Delayed" },
          { cls: "bg-emerald-500",                                     label: "Completed" },
          { cls: "bg-muted border border-dashed border-border",        label: "To Do" },
        ].map(({ cls, label }) => (
          <div key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={`inline-block w-3 h-2.5 rounded-sm ${cls}`} />
            {label}
          </div>
        ))}
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-px h-3 bg-primary/50" />
          Today
        </div>
      </div>
    </div>
  );
}
