"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  ArrowLeft, Sun, Moon,
  Layers, GitBranch, TrendingUp, AlertTriangle, Clock, CheckCircle2,
  Calendar, ShieldAlert, Link2, DollarSign, ClipboardList, Users,
  Circle, ArrowRight, ArrowUp, ArrowDown, Minus, Target, Zap,
  Pencil, X, ChevronRight, ChevronDown, Lightbulb, CheckCheck, Square,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Project, PhaseStatus, Task } from "../mockData";
import { PROJECT_STATUS_BADGE, PROJECT_STATUS_ICON } from "../statusConfig";
import { Tabs, TabsList, TabsTrigger, TabsContent, Badge, Progress } from "../components/ui";
import { logTime, updateStatus, updateTaskField, updateMilestone, updateProjectDates } from "@/lib/actions";
import type { InsightsData, RiskSignal } from "@/lib/parser/insights";
import { SprintTimeline } from "../components/SprintTimeline";

// ── Lookup tables ─────────────────────────────────────────────────────────────


const PRIORITY_BADGE: Record<Project["priority"], string> = {
  High:   "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Low:    "bg-muted text-muted-foreground border-border",
};

const PHASE_NODE: Record<PhaseStatus, { bg: string; border: string; text: string }> = {
  "Completed": { bg: "bg-emerald-500/20", border: "border-emerald-500",  text: "text-emerald-400" },
  "On Track":  { bg: "bg-blue-500/20",    border: "border-blue-500",     text: "text-blue-400" },
  "At Risk":   { bg: "bg-yellow-500/20",  border: "border-yellow-500",   text: "text-yellow-400" },
  "Delayed":   { bg: "bg-destructive/20", border: "border-destructive",  text: "text-destructive" },
  "To Do":     { bg: "bg-card",           border: "border-border",       text: "text-muted-foreground/40" },
};

const PHASE_ROW: Record<PhaseStatus, { border: string; bg: string }> = {
  "Completed": { border: "border-emerald-500/25", bg: "bg-emerald-500/5" },
  "On Track":  { border: "border-blue-500/30",    bg: "bg-blue-500/5" },
  "At Risk":   { border: "border-yellow-500/30",  bg: "bg-yellow-500/5" },
  "Delayed":   { border: "border-destructive/30", bg: "bg-destructive/5" },
  "To Do":     { border: "border-border",         bg: "bg-muted/20" },
};

const PHASE_STATUS_BADGE: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "On Track":  "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "At Risk":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Delayed":   "bg-destructive/15 text-destructive border-destructive/30",
  "To Do":     "bg-muted text-muted-foreground border-border",
};

const PHASE_PROGRESS_BAR: Record<PhaseStatus, string> = {
  "Completed": "[&>div]:bg-emerald-500",
  "On Track":  "[&>div]:bg-blue-500",
  "At Risk":   "[&>div]:bg-yellow-500",
  "Delayed":   "[&>div]:bg-destructive",
  "To Do":     "[&>div]:bg-muted/50",
};

const PHASE_STATUS_ICON: Record<PhaseStatus, React.ElementType> = {
  "Completed": CheckCheck, "On Track": TrendingUp, "At Risk": AlertTriangle,
  "Delayed": Clock, "To Do": Square,
};

const TASK_STATUS_BADGE: Record<string, string> = {
  "Done":        "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "In Progress": "bg-blue-500/15 text-blue-400 border-blue-500/30",
  "To Do":       "bg-muted text-muted-foreground border-border",
  "Blocked":     "bg-destructive/15 text-destructive border-destructive/30",
};

const RISK_LEVEL_BADGE: Record<string, string> = {
  High:   "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Low:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const RISK_STATUS_BADGE: Record<string, string> = {
  Active:    "bg-destructive/10 text-destructive border-destructive/20",
  Mitigated: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Closed:    "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
};

const RISK_ROW: Record<string, { border: string; bg: string }> = {
  Active:    { border: "border-destructive/25", bg: "bg-destructive/5" },
  Mitigated: { border: "border-yellow-500/20",  bg: "bg-yellow-500/5" },
  Closed:    { border: "border-border",          bg: "bg-muted/20" },
};

const DEP_ROW: Record<string, { border: string; bg: string }> = {
  Met:       { border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
  "At Risk": { border: "border-yellow-500/20",  bg: "bg-yellow-500/5" },
  Pending:   { border: "border-border",          bg: "bg-muted/20" },
};

const DEP_TYPE_BADGE: Record<string, string> = {
  "Blocks":     "border-primary/30 bg-primary/10 text-primary",
  "Blocked By": "border-destructive/30 bg-destructive/10 text-destructive",
  "Related To": "border-border bg-muted/30 text-muted-foreground",
};

// ── Module-level task helpers ─────────────────────────────────────────────────

const V2_TO_FILE_STATUS: Record<Task["status"], string> = {
  "Done": "Done", "In Progress": "In Progress", "To Do": "Not Started", "Blocked": "Blocked",
};
const FIELD_MAP: Record<"name" | "assignee" | "dueDate", "title" | "owner" | "due"> = {
  name: "title", assignee: "owner", dueDate: "due",
};
const TIME_CHIPS = [
  { label: "+15m", min: 15 }, { label: "+30m", min: 30 },
  { label: "+1h",  min: 60 }, { label: "+2h",  min: 120 }, { label: "+4h", min: 240 },
];
function toHHMM(m: number) { return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`; }
function fromHHMM(v: string) { const [h, m] = v.split(":").map((x) => parseInt(x) || 0); return h * 60 + m; }
type EditState = { taskId: string; field: "name" | "assignee" | "dueDate"; value: string; saving: boolean };
type LogState  = { taskId: string; owner: string; date: string; totalMinutes: number; timeInput: string; note: string; saving: boolean };

// ── Helpers ───────────────────────────────────────────────────────────────────

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function budgetBarClass(pct: number) {
  if (pct > 90) return "[&>div]:bg-destructive";
  if (pct > 75) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-emerald-500";
}

// ── Overview Tab (includes tasks) ─────────────────────────────────────────────

function OverviewTab({ p, projectCode }: { p: Project; projectCode: string }) {
  const today = new Date().toISOString().split("T")[0];

  // ── Task editing state ──────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<Task[]>(p.tasks);
  const [edit, setEdit]   = useState<EditState | null>(null);
  const [log, setLog]     = useState<LogState | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const editRef           = useRef<HTMLInputElement>(null);

  // ── Phase state ─────────────────────────────────────────────────────────────
  const [phaseDates, setPhaseDates] = useState<Record<string, string>>(
    () => Object.fromEntries((p.phases ?? []).map((ph) => [ph.name, ph.endDate])),
  );
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(() => {
    if (p.type !== "Waterfall" || !p.phases) return new Set<string>();
    return new Set(p.phases.filter((ph) => ph.status !== "Completed").map((ph) => ph.name));
  });

  useEffect(() => { if (edit) editRef.current?.focus(); }, [edit?.taskId, edit?.field]);

  const overdueTasks = tasks.filter((t) => t.status !== "Done" && t.dueDate && t.dueDate !== "-" && t.dueDate < today);
  const counts = tasks.reduce<Record<string, number>>((acc, t) => { acc[t.status] = (acc[t.status] ?? 0) + 1; return acc; }, {});
  const completedPhases = p.phases?.filter((ph) => ph.status === "Completed").length ?? 0;

  // ── Handlers ────────────────────────────────────────────────────────────────
  const togglePhase = (name: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  const handleStatusChange = async (taskId: string, v2Status: Task["status"]) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: v2Status } : t));
    await updateStatus(projectCode, taskId, V2_TO_FILE_STATUS[v2Status]);
  };

  const startEdit = (taskId: string, field: "name" | "assignee" | "dueDate", value: string) => {
    setEdit({ taskId, field, value, saving: false });
    setTimeout(() => editRef.current?.focus(), 20);
  };

  const commitEdit = async () => {
    if (!edit || edit.saving) return;
    setEdit({ ...edit, saving: true });
    const result = await updateTaskField(projectCode, edit.taskId, FIELD_MAP[edit.field], edit.value);
    if (result.ok) {
      setTasks((prev) => prev.map((t) => t.id !== edit.taskId ? t : { ...t, [edit.field]: edit.value }));
      setEdit(null);
    } else { setEdit({ ...edit, saving: false }); }
  };

  const openLog = (task: Task) => {
    if (log?.taskId === task.id) { setLog(null); return; }
    setLog({ taskId: task.id, owner: task.assignee, date: today, totalMinutes: 0, timeInput: "00:00", note: "", saving: false });
  };

  const saveLog = async () => {
    if (!log || log.totalMinutes === 0) return;
    setLog({ ...log, saving: true });
    const result = await logTime(projectCode, log.taskId, log.owner, log.date, log.totalMinutes / 60, log.note);
    if (result.ok) {
      setToast(`Logged ${toHHMM(log.totalMinutes)} for ${log.taskId}`);
      setLog(null);
      setTimeout(() => setToast(null), 2500);
    } else { setLog({ ...log, saving: false }); }
  };

  // ── Sub-components ───────────────────────────────────────────────────────────
  const PhaseDateCell = ({ phaseName, status }: { phaseName: string; status: PhaseStatus }) => {
    const ref = useRef<HTMLInputElement>(null);
    const val = phaseDates[phaseName] ?? "";
    const isOverdue = !!val && val < today && status !== "Completed";
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const newDate = e.target.value;
      setPhaseDates((prev) => ({ ...prev, [phaseName]: newDate }));
      await updateMilestone(projectCode, phaseName, newDate);
    };
    return (
      <div className="relative group/date cursor-pointer flex-shrink-0"
        onClick={() => ref.current?.showPicker?.()}>
        <div className={`flex items-center gap-1.5 text-xs px-2 py-1 rounded-md border transition-colors
          group-hover/date:bg-muted/70
          ${isOverdue
            ? "border-destructive/40 text-destructive"
            : val
              ? "border-border text-muted-foreground group-hover/date:border-primary/50 group-hover/date:text-foreground"
              : "border-dashed border-border/50 text-muted-foreground/40 group-hover/date:border-primary/50 group-hover/date:text-muted-foreground"
          }`}>
          <Calendar className="w-3 h-3 flex-shrink-0" />
          <span className="font-mono tabular-nums">{val || "Set due date"}</span>
          <Pencil className="w-2.5 h-2.5 opacity-0 group-hover/date:opacity-60 transition-opacity flex-shrink-0" />
        </div>
        <input ref={ref} type="date" value={val} onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full" />
      </div>
    );
  };

  const DateCell = ({ task }: { task: Task }) => {
    const ref = useRef<HTMLInputElement>(null);
    const hasDate = task.dueDate && task.dueDate !== "-";
    const isOverdue = task.status !== "Done" && hasDate && task.dueDate < today;
    const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      setTasks((prev) => prev.map((t) => t.id === task.id ? { ...t, dueDate: val || "-" } : t));
      await updateTaskField(projectCode, task.id, "due", val);
    };
    return (
      <div className="relative cursor-pointer" onClick={() => ref.current?.showPicker?.()}>
        <span className={`text-xs ${isOverdue ? "text-destructive font-medium" : "text-muted-foreground"}`}>
          {hasDate ? task.dueDate : "—"}
        </span>
        <input ref={ref} type="date" value={hasDate ? task.dueDate : ""} onChange={handleChange}
          className="absolute inset-0 opacity-0 cursor-pointer w-full" />
      </div>
    );
  };

  const EditCell = ({ task, field, display }: { task: Task; field: "name" | "assignee" | "dueDate"; display: string }) => {
    const isEditing = edit?.taskId === task.id && edit.field === field;
    if (isEditing) return (
      <input ref={editRef} type="text" value={edit.value}
        onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
        onBlur={commitEdit}
        onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEdit(null); }}
        disabled={edit.saving}
        className="bg-muted/50 border border-primary/50 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
      />
    );
    return (
      <div className="group/cell flex items-center gap-1 min-w-0">
        <span className="truncate">{display || <span className="text-muted-foreground/40 italic">—</span>}</span>
        <button onClick={() => startEdit(task.id, field, display)}
          className="opacity-0 group-hover/cell:opacity-100 flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-opacity">
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  };

  const TaskCard = ({ task }: { task: Task }) => {
    const isComplete = task.status === "Done";
    const isBlocked  = task.status === "Blocked";
    const isOverdue  = !isComplete && task.dueDate !== "-" && task.dueDate < today;
    const TaskIcon   = isComplete ? CheckCircle2 : (isOverdue || isBlocked) ? AlertTriangle : Circle;
    const iconColor  = isComplete ? "text-emerald-400" : (isOverdue || isBlocked) ? "text-destructive" : "text-muted-foreground";
    const isLogging  = log?.taskId === task.id;

    return (
      <div className="rounded-lg border border-border bg-card hover:bg-muted/40 transition-colors overflow-hidden">
        <div className="flex items-start gap-2.5 p-3">
          <TaskIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />
          <div className="flex-1 min-w-0">
            <div className={`text-sm font-medium leading-tight ${isComplete ? "line-through text-muted-foreground" : ""}`}>
              <EditCell task={task} field="name" display={task.name} />
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              <EditCell task={task} field="assignee" display={task.assignee} />
            </div>
            {task.notes && (
              <p className="text-xs text-muted-foreground/70 mt-1.5 leading-snug italic">{task.notes}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <select value={task.status} onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
              className={`text-xs px-2 py-0.5 rounded-full border cursor-pointer focus:outline-none bg-transparent ${TASK_STATUS_BADGE[task.status]}`}>
              <option value="To Do">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Blocked">Blocked</option>
              <option value="Done">Done</option>
            </select>
            <div className="flex items-center gap-1.5">
              <DateCell task={task} />
              <button onClick={() => openLog(task)} title="Log time"
                className={`p-1 rounded transition-colors flex-shrink-0 ${isLogging ? "bg-primary/20 text-primary" : "text-muted-foreground/30 hover:text-muted-foreground hover:bg-muted"}`}>
                <Clock className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
        {isLogging && log && (
          <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Log time</span>
              <input type="date" value={log.date} onChange={(e) => setLog({ ...log, date: e.target.value })}
                className="text-xs border border-border rounded px-2 py-1 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary" />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {TIME_CHIPS.map((c) => (
                <button key={c.label} onClick={() => setLog({ ...log, totalMinutes: log.totalMinutes + c.min, timeInput: toHHMM(log.totalMinutes + c.min) })}
                  className="text-xs px-3 py-1 rounded-full border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium">
                  {c.label}
                </button>
              ))}
              <div className="relative">
                <input type="text" value={log.timeInput}
                  onChange={(e) => setLog({ ...log, timeInput: e.target.value, totalMinutes: fromHHMM(e.target.value) })}
                  placeholder="00:00"
                  className="text-sm font-mono border border-border rounded px-3 pr-8 py-1 w-24 bg-card text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                />
                {log.totalMinutes > 0 && (
                  <button onClick={() => setLog({ ...log, totalMinutes: 0, timeInput: "00:00" })}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
            <input type="text" value={log.note} onChange={(e) => setLog({ ...log, note: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") saveLog(); }}
              placeholder="Note (optional)…"
              className="w-full text-sm border border-border rounded px-3 py-1.5 bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
            />
            <div className="flex justify-end gap-2">
              <button onClick={() => setLog(null)} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">Cancel</button>
              <button onClick={saveLog} disabled={log.totalMinutes === 0 || log.saving}
                className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity">
                {log.saving ? "Saving…" : "Save Log"}
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const TaskSummaryPills = () => (
    <div className="flex flex-wrap gap-2 mb-3">
      {(["Done", "In Progress", "To Do", "Blocked"] as const).map((s) =>
        counts[s] ? (
          <span key={s} className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-3 py-1 font-medium ${TASK_STATUS_BADGE[s]}`}>
            {counts[s]} {s === "Done" ? "Completed" : s === "To Do" ? "Pending" : s}
          </span>
        ) : null
      )}
      {overdueTasks.length > 0 && (
        <span className="inline-flex items-center gap-1.5 text-xs border rounded-full px-3 py-1 font-medium bg-destructive/15 text-destructive border-destructive/30">
          <AlertTriangle className="w-3 h-3" />{overdueTasks.length} Overdue
        </span>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✓ {toast}
        </div>
      )}

      {/* Overall Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />Overall Progress
          </span>
          <span className="font-semibold">{p.progress}%</span>
        </div>
        <Progress value={p.progress} className="h-2.5" />
        {p.type === "Waterfall" && p.phases && (
          <p className="text-xs text-muted-foreground">{completedPhases} of {p.phases.length} phases completed</p>
        )}
      </div>

      {/* Waterfall: Phase Pipeline + Tasks */}
      {p.type === "Waterfall" && p.phases && (
        <div>
          <h4 className="text-sm font-semibold mb-5 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-muted-foreground" />Phase Pipeline
          </h4>

          {/* Node timeline */}
          <div className="relative mb-5">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0" />
            <div className="relative z-10 flex justify-between">
              {p.phases.map((phase, i) => {
                const cfg = PHASE_NODE[phase.status];
                return (
                  <div key={phase.name} className="flex flex-col items-center gap-1.5 w-20">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      {phase.status === "Completed" ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${cfg.text}`}>{phase.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Phase accordion with tasks */}
          <TaskSummaryPills />
          <div className="space-y-2">
            {(() => {
              const grouped = p.phases!.map((phase) => ({
                phase,
                tasks: tasks.filter((t) => t.phase?.toLowerCase() === phase.name.toLowerCase()),
              }));
              const phasedIds = new Set(grouped.flatMap((g) => g.tasks.map((t) => t.id)));
              const ungrouped = tasks.filter((t) => !phasedIds.has(t.id));

              return (
                <>
                  {grouped.map(({ phase, tasks: phaseTasks }) => {
                    const row  = PHASE_ROW[phase.status];
                    const cfg  = PHASE_NODE[phase.status];
                    const Icon = PHASE_STATUS_ICON[phase.status];
                    const isExpanded = expandedPhases.has(phase.name);
                    const doneCount  = phaseTasks.filter((t) => t.status === "Done").length;
                    return (
                      <div key={phase.name} className={`rounded-xl border overflow-hidden ${row.border}`}>
                        <div className={`flex items-center transition-colors ${row.bg}`}>
                          <button onClick={() => togglePhase(phase.name)}
                            className="flex items-center gap-2.5 flex-1 px-4 py-3 text-left min-w-0">
                            <Icon className={`w-4 h-4 flex-shrink-0 ${cfg.text}`} />
                            <span className={`text-sm font-semibold flex-1 truncate ${cfg.text}`}>{phase.name}</span>
                            <span className={`text-[10px] border rounded-full px-2 py-0.5 font-medium ${PHASE_STATUS_BADGE[phase.status]}`}>{phase.status}</span>
                            {phase.status !== "To Do" && (
                              <span className={`text-xs font-semibold tabular-nums ${cfg.text}`}>{phase.progress}%</span>
                            )}
                            <span className="text-[10px] text-muted-foreground">{doneCount}/{phaseTasks.length} done</span>
                            {isExpanded
                              ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                              : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                          </button>
                          <div className="px-3 border-l border-border/40">
                            <PhaseDateCell phaseName={phase.name} status={phase.status} />
                          </div>
                        </div>
                        {isExpanded && (
                          <div className={`border-t ${row.border}`}>
                            {phase.status !== "To Do" && (
                              <Progress value={phase.progress} className={`h-1 rounded-none ${PHASE_PROGRESS_BAR[phase.status]}`} />
                            )}
                            {phaseTasks.length > 0 ? (
                              <div className="px-3 pb-3 pt-2.5 space-y-1.5">
                                {phaseTasks.map((task) => <TaskCard key={task.id} task={task} />)}
                              </div>
                            ) : (
                              <p className="px-4 py-3 text-xs text-muted-foreground">No tasks for this phase.</p>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                  {ungrouped.length > 0 && (
                    <div className="rounded-xl border border-border overflow-hidden">
                      <button onClick={() => togglePhase("__ungrouped__")}
                        className="w-full flex items-center gap-2.5 px-4 py-3 text-left bg-muted/20 hover:bg-muted/40 transition-colors">
                        <Circle className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm font-semibold flex-1 text-muted-foreground">General</span>
                        <span className="text-[10px] text-muted-foreground">
                          {ungrouped.filter((t) => t.status === "Done").length}/{ungrouped.length} done
                        </span>
                        {expandedPhases.has("__ungrouped__")
                          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
                      </button>
                      {expandedPhases.has("__ungrouped__") && (
                        <div className="border-t border-border px-3 pb-3 pt-2.5 space-y-1.5">
                          {ungrouped.map((task) => <TaskCard key={task.id} task={task} />)}
                        </div>
                      )}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}

      {/* Scrum: Sprint Timeline + flat task list */}
      {p.type === "Scrum" && (
        <div className="space-y-6">
          <div>
            <h4 className="text-sm font-semibold mb-4 flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-muted-foreground" />Sprints
            </h4>
            <SprintTimeline project={p} />
          </div>
          <div>
            <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
              <ClipboardList className="w-4 h-4 text-muted-foreground" />Tasks
            </h4>
            <TaskSummaryPills />
            <div className="space-y-2">
              {tasks.map((task) => <TaskCard key={task.id} task={task} />)}
            </div>
          </div>
        </div>
      )}

      {/* Milestones — Waterfall */}
      {p.type === "Waterfall" && p.milestones.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-muted-foreground" />Milestones & Timeline
          </h4>
          <div className="relative pl-5">
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-border" />
            {p.milestones.map((m) => (
              <div key={m.name} className="relative mb-3 last:mb-0">
                <div className={`absolute -left-3 top-1 w-2.5 h-2.5 rounded-full border-2 ${m.completed ? "bg-emerald-500 border-emerald-500" : "bg-card border-border"}`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${m.completed ? "line-through text-muted-foreground" : "font-medium text-foreground"}`}>{m.name}</span>
                  <span className={`text-xs ${m.completed ? "text-emerald-400" : "text-muted-foreground"}`}>{m.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      {p.kpis.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
            <Target className="w-4 h-4 text-muted-foreground" />Custom KPIs
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {p.kpis.map((kpi) => {
              const good = (kpi.trend === "up" && kpi.goodDir === "up") || (kpi.trend === "down" && kpi.goodDir === "down");
              const bad  = (kpi.trend === "up" && kpi.goodDir === "down") || (kpi.trend === "down" && kpi.goodDir === "up");
              const trendColor = good ? "text-emerald-400" : bad ? "text-destructive" : "text-muted-foreground";
              const TrendIcon  = kpi.trend === "up" ? ArrowUp : kpi.trend === "down" ? ArrowDown : Minus;
              return (
                <div key={kpi.label} className="bg-muted/30 rounded-lg p-4">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <div className="flex items-end gap-1.5">
                    <p className="text-xl font-bold leading-none">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground mb-0.5">{kpi.unit}</p>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">Target: {kpi.target}{kpi.unit}</span>
                    <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Budget Tab ────────────────────────────────────────────────────────────────

function BudgetTab({ p }: { p: Project }) {
  const spentPct   = p.budget.total > 0 ? Math.round((p.budget.spent / p.budget.total) * 100) : 0;
  const remaining  = p.budget.total - p.budget.spent;
  const overBudget = remaining < 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total Budget",         value: `$${(p.budget.total / 1000).toFixed(0)}k`,   cls: "" },
          { label: `Spent (${spentPct}%)`, value: `$${(p.budget.spent / 1000).toFixed(0)}k`,   cls: spentPct > 90 ? "text-destructive" : "" },
          { label: "Remaining",            value: `$${(Math.abs(remaining) / 1000).toFixed(0)}k${overBudget ? " over" : ""}`, cls: overBudget ? "text-destructive" : "text-emerald-400" },
        ].map((c) => (
          <div key={c.label} className="bg-muted/30 rounded-lg p-4">
            <p className="text-xs text-muted-foreground mb-1">{c.label}</p>
            <p className={`text-xl font-bold ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Budget consumption</span>
          <span className={spentPct > 90 ? "text-destructive font-semibold" : ""}>{spentPct}%</span>
        </div>
        <Progress value={spentPct} className={`h-3 ${budgetBarClass(spentPct)}`} />
      </div>
      <div>
        <h4 className="text-sm font-semibold mb-4 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-muted-foreground" />Planned vs Actual Spend
        </h4>
        <div className="h-56">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={p.budget.monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12, color: "hsl(var(--foreground))" }}
                formatter={(v) => [`$${((Number(v) || 0)).toLocaleString()}`, ""]} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="planned" name="Planned" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual"  name="Actual"  fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      <div className={`rounded-lg border p-3 text-sm ${overBudget ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"}`}>
        <span className="font-medium">Cost Variance (to date): </span>
        {overBudget ? `+$${Math.abs(remaining).toLocaleString()} over plan`
          : remaining === 0 ? "On budget"
          : `-$${remaining.toLocaleString()} under plan`}
      </div>
    </div>
  );
}

// ── Risks Tab ─────────────────────────────────────────────────────────────────

function RisksTab({ p }: { p: Project }) {
  const active = p.risks.filter((r) => r.status === "Active").length;
  return (
    <div className="space-y-4">
      {active > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive font-medium">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          {active} active risk{active > 1 ? "s" : ""} require attention
        </div>
      )}
      <div className="space-y-3">
        {p.risks.map((risk) => {
          const row = RISK_ROW[risk.status];
          return (
            <div key={risk.id} className={`rounded-lg border p-4 space-y-2.5 ${row.border} ${row.bg}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold leading-snug">{risk.title}</p>
                <Badge className={`${RISK_STATUS_BADGE[risk.status]} shrink-0`}>{risk.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-2">
                <Badge className={RISK_LEVEL_BADGE[risk.impact]}>Impact: {risk.impact}</Badge>
                <Badge className={RISK_LEVEL_BADGE[risk.probability]}>Probability: {risk.probability}</Badge>
                <Badge className="border-border bg-muted/30 text-muted-foreground">Owner: {risk.owner}</Badge>
              </div>
              <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
                <span className="font-medium text-foreground">Mitigation: </span>{risk.mitigation}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Dependencies Tab ──────────────────────────────────────────────────────────

function DependenciesTab({ p }: { p: Project }) {
  if (p.dependencies.length === 0) {
    return <p className="text-sm text-muted-foreground text-center py-8">No dependencies tracked</p>;
  }
  return (
    <div className="space-y-3">
      {p.dependencies.map((dep) => {
        const row = DEP_ROW[dep.status];
        return (
          <div key={dep.id} className={`rounded-lg border p-4 ${row.border} ${row.bg}`}>
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 min-w-0">
                <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm font-medium leading-snug">{dep.project}</span>
              </div>
              <Badge className={`${dep.status === "Met" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : dep.status === "At Risk" ? "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" : "bg-muted text-muted-foreground border-border"} shrink-0`}>
                {dep.status}
              </Badge>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Badge className={DEP_TYPE_BADGE[dep.type]}>
                {dep.type === "Blocked By" ? <ArrowRight className="w-3 h-3 rotate-180" /> : <ArrowRight className="w-3 h-3" />}
                {dep.type}
              </Badge>
              {dep.description && <span>{dep.description}</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

function TeamTab({ p }: { p: Project }) {
  const hasContext  = p.contextTeam && p.contextTeam.length > 0;
  const hasWorkload = p.team.length > 0;

  return (
    <div className="space-y-8">

      {/* Part 1 — Team from project context */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <Users className="w-4 h-4 text-muted-foreground" />Project Team
        </h4>
        {hasContext ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {p.contextTeam!.map((member) => (
              <div key={member.name} className="flex items-start gap-3 p-4 rounded-lg border border-border bg-muted/20">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 bg-muted text-muted-foreground">
                  {initials(member.name)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{member.name}</p>
                  <p className="text-xs text-muted-foreground">{member.role}</p>
                  {member.team && (
                    <p className="text-xs text-muted-foreground/60 mt-0.5">{member.team}</p>
                  )}
                  {member.alsoOn && member.alsoOn !== "—" && (
                    <p className="text-xs text-muted-foreground/50 mt-0.5 italic">Also on: {member.alsoOn}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No team defined in project-context.md</p>
        )}
      </div>

      {/* Part 2 — Workload from metrics */}
      <div>
        <h4 className="text-sm font-semibold mb-3 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-muted-foreground" />Workload (current sprint)
        </h4>
        {hasWorkload ? (
          <div className="rounded-lg border border-border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th className="text-left px-3 py-2 text-xs font-semibold text-muted-foreground">Owner</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Total</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">In Progress</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Done</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Blocked</th>
                  <th className="text-center px-3 py-2 text-xs font-semibold text-muted-foreground">Flag</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {p.team.map((member) => {
                  const isOverloaded = member.flag === "OVERLOADED";
                  return (
                    <tr key={member.name} className="bg-card hover:bg-muted/20 transition-colors">
                      <td className="px-3 py-2 font-medium">{member.name}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-muted-foreground">{member.totalTasks ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-blue-400">{member.inProgress ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-emerald-400">{member.done ?? 0}</td>
                      <td className="px-3 py-2 text-center tabular-nums text-destructive">{member.blocked ?? 0}</td>
                      <td className="px-3 py-2 text-center">
                        {isOverloaded ? (
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded border bg-destructive/10 text-destructive border-destructive/30">
                            OVERLOADED
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No workload data in metrics.</p>
        )}
      </div>

    </div>
  );
}

// ── Insights Tab ─────────────────────────────────────────────────────────────

const SIGNAL_LEFT: Record<string, string> = {
  critical: "border-l-destructive bg-destructive/5 border-destructive/20",
  warning:  "border-l-yellow-500 bg-yellow-500/5 border-yellow-500/20",
  info:     "border-l-blue-500 bg-blue-500/5 border-blue-500/20",
};
const SIGNAL_LABEL_CLASS: Record<string, string> = {
  critical: "text-destructive", warning: "text-yellow-400", info: "text-blue-400",
};
const SIGNAL_EMOJI: Record<string, string> = { critical: "🔴", warning: "🟡", info: "🔵" };
const SIGNAL_LABEL_TEXT: Record<string, string> = { critical: "CRITICAL", warning: "WARNING", info: "INFO" };
const PRIORITY_CHIP: Record<string, string> = {
  High:   "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  Low:    "bg-muted text-muted-foreground border-border",
};

function RiskSignalCard({ signal }: { signal: RiskSignal }) {
  return (
    <div className={`rounded-lg border border-l-4 p-3 space-y-2 ${SIGNAL_LEFT[signal.level]}`}>
      <div className="flex items-center gap-2">
        <span>{SIGNAL_EMOJI[signal.level]}</span>
        <span className={`text-xs font-bold uppercase tracking-wide ${SIGNAL_LABEL_CLASS[signal.level]}`}>
          {SIGNAL_LABEL_TEXT[signal.level]}
        </span>
      </div>
      <p className="text-sm text-foreground/90 leading-relaxed">{signal.description}</p>
      {signal.action && (
        <div className="rounded bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          <span className="font-semibold">Action: </span>{signal.action}
        </div>
      )}
    </div>
  );
}

function InsightsTab({ insights }: { insights: InsightsData }) {
  const [hiddenOpen, setHiddenOpen] = useState(false);
  const hasContent = insights.summary || insights.keyRisks.length > 0 || insights.actions.length > 0;

  if (!hasContent) {
    return <p className="text-sm text-muted-foreground text-center py-8">No insights available for this project.</p>;
  }

  return (
    <div className="space-y-6">
      {insights.summary && (
        <div className="rounded-lg border border-border bg-muted/20 px-4 py-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Tình hình tổng thể</p>
          <p className="text-sm text-foreground/90 leading-relaxed">{insights.summary}</p>
          {insights.insightsDate && <p className="text-xs text-muted-foreground mt-2">As of {insights.insightsDate}</p>}
        </div>
      )}
      {insights.keyRisks.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Key Risks</h4>
          {insights.keyRisks.map((s, i) => <RiskSignalCard key={i} signal={s} />)}
        </div>
      )}
      {insights.hiddenRisks.length > 0 && (
        <div className="space-y-3">
          <button onClick={() => setHiddenOpen((o) => !o)}
            className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors">
            <ChevronRight className={`w-4 h-4 transition-transform ${hiddenOpen ? "rotate-90" : ""}`} />
            Hidden Risks ({insights.hiddenRisks.length})
          </button>
          {hiddenOpen && insights.hiddenRisks.map((s, i) => <RiskSignalCard key={i} signal={s} />)}
        </div>
      )}
      {insights.actions.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Hành động đề xuất</h4>
          {insights.actions.map((a, i) => (
            <div key={i} className="rounded-lg border border-border bg-card p-3 space-y-2">
              <div className="flex items-start gap-2">
                <ArrowRight className="w-3.5 h-3.5 text-primary mt-0.5 flex-shrink-0" />
                <p className="text-sm font-medium">{a.action}</p>
              </div>
              <div className="flex flex-wrap gap-1.5 pl-5">
                {a.owner && <Badge className="bg-muted text-muted-foreground border-border">{a.owner}</Badge>}
                <Badge className={PRIORITY_CHIP[a.priority]}>{a.priority}</Badge>
                {a.relatedTasks.map((t) => <Badge key={t} className="border-primary/30 bg-primary/10 text-primary">{t}</Badge>)}
              </div>
            </div>
          ))}
        </div>
      )}
      {insights.positives.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold text-emerald-400">Điểm tích cực</h4>
          <div className="space-y-1.5">
            {insights.positives.map((pos, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-foreground/80">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <span>{pos}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      {insights.standupQuestions.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Câu hỏi cho standup</h4>
          <div className="space-y-2">
            {insights.standupQuestions.map((q, i) => (
              <div key={i} className="rounded-md border border-border bg-muted/20 px-3 py-2 text-sm">
                <span className="font-semibold text-primary">{i + 1}. </span>
                {q.person && <span className="font-medium">{q.person}: </span>}
                {q.question}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function ProjectDetailPage({ project: p, insights }: { project: Project; insights: InsightsData }) {
  const [dark, setDark] = useState(true);
  const [editingDates, setEditingDates] = useState(false);
  const [startDate, setStartDate] = useState(p.startDate);
  const [endDate, setEndDate] = useState(p.endDate);
  const [savingDates, setSavingDates] = useState(false);
  const today       = new Date().toISOString().split("T")[0];
  const StatusIcon  = PROJECT_STATUS_ICON[p.status];
  const activeRisks = p.risks.filter((r) => r.status === "Active").length;
  const overdueCount = p.tasks.filter((t) => t.status !== "Done" && t.dueDate && t.dueDate !== "-" && t.dueDate < today).length;

  const saveDates = async () => {
    if (startDate === p.startDate && endDate === p.endDate) {
      setEditingDates(false);
      return;
    }
    setSavingDates(true);
    const result = await updateProjectDates(p.id, startDate, endDate);
    setSavingDates(false);
    if (result.ok) {
      setEditingDates(false);
    }
  };

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen bg-background text-foreground`}>
      {/* App Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Delivery Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track projects and allocate resources</p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/v4" className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium hover:bg-primary/20 transition-colors">
              Dashboard
            </Link>
            <button onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground">
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/v4" className="flex items-center gap-1.5 hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />All Projects
          </Link>
          <span>/</span>
          <span className="text-foreground font-medium truncate">{p.name}</span>
        </div>

        {/* Project Header Card */}
        <div className="bg-card border border-border rounded-xl p-6">
          <div className="flex items-center gap-2 flex-wrap mb-3">
            <Badge className={p.type === "Waterfall" ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-sky-500/40 bg-sky-500/10 text-sky-400"}>
              {p.type === "Waterfall" ? <Layers className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
              {p.type}
            </Badge>
            <Badge className={PROJECT_STATUS_BADGE[p.status]}>
              <StatusIcon className="w-3 h-3" />{p.status}
            </Badge>
            <Badge className={PRIORITY_BADGE[p.priority]}>{p.priority} Priority</Badge>
          </div>

          <h2 className="text-2xl font-bold leading-snug mb-1">{p.name}</h2>
          <div className="flex items-center justify-between flex-wrap gap-3 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">{p.client}</span>
            {editingDates ? (
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="px-2 py-1 rounded border border-border bg-muted/40 text-foreground text-sm"
                />
                <span>→</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="px-2 py-1 rounded border border-border bg-muted/40 text-foreground text-sm"
                />
                <button
                  onClick={saveDates}
                  disabled={savingDates}
                  className="px-2 py-1 rounded bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/80 transition-colors disabled:opacity-50"
                >
                  {savingDates ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditingDates(false);
                    setStartDate(p.startDate);
                    setEndDate(p.endDate);
                  }}
                  className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setEditingDates(true)}
                className="flex items-center gap-1 hover:bg-muted/40 px-2 py-1 rounded transition-colors group"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>{p.startDate} → {p.endDate}</span>
                <Pencil className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-border">
            {[
              { label: "Progress",  value: `${p.progress}%` },
              { label: "Budget",    value: p.budget.total > 0 ? `$${Math.round(p.budget.spent / 1000)}k / $${Math.round(p.budget.total / 1000)}k` : "—" },
              { label: "Lead",      value: p.lead },
              { label: "Team size", value: `${p.team.length}`, sub: "members" },
            ].map((item) => (
              <div key={item.label}>
                <p className="text-xs text-muted-foreground mb-0.5">{item.label}</p>
                <p className="text-lg font-bold">
                  {item.value}
                  {"sub" in item && <span className="text-sm text-muted-foreground font-normal ml-1">{item.sub}</span>}
                </p>
              </div>
            ))}
          </div>

          {(activeRisks > 0 || overdueCount > 0 || p.atRiskDeps > 0) && (
            <div className="flex gap-4 flex-wrap border-t border-border mt-4 pt-4">
              {activeRisks > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <ShieldAlert className="w-3.5 h-3.5" />{activeRisks} active risk{activeRisks > 1 ? "s" : ""}
                </span>
              )}
              {overdueCount > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-destructive">
                  <Clock className="w-3.5 h-3.5" />{overdueCount} overdue task{overdueCount > 1 ? "s" : ""}
                </span>
              )}
              {p.atRiskDeps > 0 && (
                <span className="flex items-center gap-1 text-xs font-medium text-yellow-400">
                  <Link2 className="w-3.5 h-3.5" />{p.atRiskDeps} dependenc{p.atRiskDeps > 1 ? "ies" : "y"} at risk
                </span>
              )}
            </div>
          )}
        </div>

        {/* Tabs — no Tasks tab */}
        <Tabs defaultValue="overview">
          <TabsList className="border-b border-border bg-transparent gap-0 mb-0 overflow-x-auto">
            {[
              { value: "overview",     label: "Overview",     icon: TrendingUp,  badge: overdueCount },
              { value: "budget",       label: "Budget",       icon: DollarSign,  badge: 0 },
              { value: "risks",        label: "Risks",        icon: ShieldAlert, badge: activeRisks },
              { value: "dependencies", label: "Dependencies", icon: Link2,       badge: 0 },
              { value: "team",         label: "Team",         icon: Users,       badge: 0 },
              { value: "insights",     label: "Insights",     icon: Lightbulb,   badge: insights.keyRisks.filter((s) => s.level === "critical").length },
            ].map(({ value, label, icon: Icon, badge }) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-0 px-4 text-sm relative">
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge > 0 && (
                  <span className="ml-0.5 bg-destructive/20 text-destructive rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">
                    {badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            <TabsContent value="overview"><OverviewTab p={p} projectCode={p.id} /></TabsContent>
            <TabsContent value="budget"><BudgetTab p={p} /></TabsContent>
            <TabsContent value="risks"><RisksTab p={p} /></TabsContent>
            <TabsContent value="dependencies"><DependenciesTab p={p} /></TabsContent>
            <TabsContent value="team"><TeamTab p={p} /></TabsContent>
            <TabsContent value="insights"><InsightsTab insights={insights} /></TabsContent>
          </div>
        </Tabs>
      </main>
    </div>
  );
}
