"use client";

import { useState, useRef, useEffect } from "react";
import {
  Layers, GitBranch, TrendingUp, AlertTriangle, Clock, CheckCircle,
  Calendar, ShieldAlert, Link2, DollarSign, ClipboardList, Users,
  CheckCircle2, Circle, ArrowRight, ArrowUp, ArrowDown, Minus,
  Pencil, X,
} from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import { Project, Phase, PhaseStatus, Task } from "../mockData";
import { Dialog, Tabs, TabsList, TabsTrigger, TabsContent, Badge, Progress } from "./ui";
import { logTime, updateStatus, updateTaskField } from "@/lib/actions";

// ── Helpers ───────────────────────────────────────────────────────────────────

const STATUS_BADGE: Record<Project["status"], string> = {
  "On Track": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "At Risk":  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Delayed":  "bg-red-500/15 text-red-400 border-red-500/30",
  "Completed":"bg-blue-500/15 text-blue-400 border-blue-500/30",
};

const STATUS_ICON: Record<Project["status"], React.ElementType> = {
  "On Track": TrendingUp, "At Risk": AlertTriangle, "Delayed": Clock, "Completed": CheckCircle,
};

const PRIORITY_BADGE: Record<Project["priority"], string> = {
  High:   "bg-destructive/10 text-destructive border-destructive/20",
  Medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  Low:    "bg-muted text-muted-foreground border-border",
};

const PHASE_NODE: Record<PhaseStatus, { bg: string; border: string; text: string }> = {
  "Completed": { bg: "bg-emerald-500/20", border: "border-emerald-500", text: "text-emerald-400" },
  "On Track":  { bg: "bg-primary/20",     border: "border-primary",     text: "text-primary" },
  "At Risk":   { bg: "bg-yellow-500/20",  border: "border-yellow-500",  text: "text-yellow-400" },
  "Delayed":   { bg: "bg-destructive/20", border: "border-destructive", text: "text-destructive" },
  "To Do":     { bg: "bg-card",           border: "border-border",      text: "text-muted-foreground/40" },
};

const PHASE_ROW: Record<PhaseStatus, { border: string; bg: string }> = {
  "Completed": { border: "border-emerald-500/25", bg: "bg-emerald-500/5" },
  "On Track":  { border: "border-primary/30",     bg: "bg-primary/5" },
  "At Risk":   { border: "border-yellow-500/30",  bg: "bg-yellow-500/5" },
  "Delayed":   { border: "border-destructive/30", bg: "bg-destructive/5" },
  "To Do":     { border: "border-border",         bg: "bg-muted/20" },
};

const PHASE_STATUS_BADGE: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "On Track":  "bg-primary/15 text-primary border-primary/30",
  "At Risk":   "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Delayed":   "bg-destructive/15 text-destructive border-destructive/30",
  "To Do":     "bg-muted text-muted-foreground border-border",
};

const TASK_STATUS_BADGE: Record<string, string> = {
  "Completed":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "In Progress": "bg-primary/15 text-primary border-primary/30",
  "Pending":     "bg-muted text-muted-foreground border-border",
  "Overdue":     "bg-destructive/15 text-destructive border-destructive/30",
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
  Met:      { border: "border-emerald-500/20", bg: "bg-emerald-500/5" },
  "At Risk":{ border: "border-yellow-500/20",  bg: "bg-yellow-500/5" },
  Pending:  { border: "border-border",          bg: "bg-muted/20" },
};

const DEP_TYPE_BADGE: Record<string, string> = {
  "Blocks":     "border-primary/30 bg-primary/10 text-primary",
  "Blocked By": "border-destructive/30 bg-destructive/10 text-destructive",
  "Related To": "border-border bg-muted/30 text-muted-foreground",
};

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

function budgetBarClass(pct: number) {
  if (pct > 90) return "[&>div]:bg-destructive";
  if (pct > 75) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-emerald-500";
}

// ── Overview Tab ──────────────────────────────────────────────────────────────

function OverviewTab({ p }: { p: Project }) {
  const completedPhases = p.phases?.filter((ph) => ph.status === "Completed").length ?? 0;

  return (
    <div className="space-y-6">
      {/* Overall progress */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="font-medium">Overall Progress</span>
          <span className="font-bold">{p.progress}%</span>
        </div>
        <Progress value={p.progress} className="h-2.5" />
        {p.phases && (
          <p className="text-xs text-muted-foreground mt-1">{completedPhases} of 6 phases completed</p>
        )}
      </div>

      {/* Phase pipeline (Waterfall) */}
      {p.phases && (
        <div>
          <h4 className="text-sm font-semibold mb-4">Phase Pipeline</h4>
          {/* Timeline nodes */}
          <div className="relative mb-4">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0" />
            <div className="relative z-10 flex justify-between">
              {p.phases.map((phase, i) => {
                const cfg = PHASE_NODE[phase.status];
                return (
                  <div key={phase.name} className="flex flex-col items-center gap-1">
                    <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold ${cfg.bg} ${cfg.border} ${cfg.text}`}>
                      {i + 1}
                    </div>
                    <span className={`text-[10px] font-medium ${cfg.text}`}>{phase.name}</span>
                  </div>
                );
              })}
            </div>
          </div>
          {/* Phase details */}
          <div className="space-y-2">
            {p.phases.map((phase) => {
              const row = PHASE_ROW[phase.status];
              return (
                <div key={phase.name} className={`rounded-lg p-3 border ${row.border} ${row.bg}`}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{phase.name}</span>
                      <Badge className={PHASE_STATUS_BADGE[phase.status]}>{phase.status}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span>{phase.endDate}</span>
                      <span className="font-semibold text-foreground">{phase.progress}%</span>
                    </div>
                  </div>
                  <Progress value={phase.progress} className="h-1" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Current Sprint (Scrum only) */}
      {p.currentSprint && p.type === "Scrum" && (
        <div>
          <h4 className="text-sm font-semibold mb-3">Current Sprint</h4>
          <div className="border border-primary/30 bg-primary/5 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Sprint {p.currentSprint.number}</span>
              <Badge className="bg-primary/15 text-primary border-primary/30">Active</Badge>
            </div>
            <p className="text-sm text-muted-foreground italic">"{p.currentSprint.goal}"</p>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Story Points</span>
                <span className="font-semibold text-foreground">{p.currentSprint.pointsDone}/{p.currentSprint.pointsTotal}</span>
              </div>
              <Progress value={(p.currentSprint.pointsDone / p.currentSprint.pointsTotal) * 100} className="h-2" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Sprints Done", value: `${p.sprintsDone}/${p.sprintsTotal}` },
                { label: "Velocity", value: p.currentSprint.velocity },
                { label: "Backlog", value: p.currentSprint.backlog },
              ].map((s) => (
                <div key={s.label} className="bg-muted/30 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Milestones */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Milestones & Timeline</h4>
        <div className="relative space-y-3 pl-6">
          <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-border" />
          {p.milestones.map((m) => (
            <div key={m.name} className="relative flex items-center gap-3">
              <div className={`absolute -left-4 w-3 h-3 rounded-full border-2 ${m.completed ? "bg-emerald-500 border-emerald-500" : "bg-card border-border"}`} />
              <div className="flex-1 flex items-center justify-between">
                <span className={`text-sm ${m.completed ? "line-through text-muted-foreground" : ""}`}>{m.name}</span>
                <span className={`text-xs ${m.completed ? "text-emerald-400" : "text-muted-foreground"}`}>{m.date}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* KPIs */}
      {p.kpis.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-3">KPIs</h4>
          <div className="grid grid-cols-2 gap-3">
            {p.kpis.map((kpi) => {
              const good = (kpi.trend === "up" && kpi.goodDir === "up") || (kpi.trend === "down" && kpi.goodDir === "down");
              const bad  = (kpi.trend === "up" && kpi.goodDir === "down") || (kpi.trend === "down" && kpi.goodDir === "up");
              const trendColor = good ? "text-emerald-400" : bad ? "text-destructive" : "text-muted-foreground";
              const TrendIcon = kpi.trend === "up" ? ArrowUp : kpi.trend === "down" ? ArrowDown : Minus;
              return (
                <div key={kpi.label} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <div className="flex items-baseline gap-1 mt-1">
                    <p className="text-lg font-bold">{kpi.value}</p>
                    <p className="text-xs text-muted-foreground">{kpi.unit}</p>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Target: {kpi.target} {kpi.unit}</span>
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
  const spentPct = Math.round((p.budget.spent / p.budget.total) * 100);
  const remaining = p.budget.total - p.budget.spent;
  const overBudget = remaining < 0;

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Budget", value: `$${(p.budget.total / 1000).toFixed(0)}k`, cls: "" },
          { label: "Spent", value: `$${(p.budget.spent / 1000).toFixed(0)}k`, cls: spentPct > 90 ? "text-destructive" : "" },
          { label: "Remaining", value: `$${(Math.abs(remaining) / 1000).toFixed(0)}k${overBudget ? " over" : ""}`, cls: overBudget ? "text-destructive" : "text-emerald-400" },
        ].map((c) => (
          <div key={c.label} className="bg-muted/30 rounded-lg p-3 text-center">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className={`text-lg font-bold mt-1 ${c.cls}`}>{c.value}</p>
          </div>
        ))}
      </div>

      {/* Consumption bar */}
      <div>
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Budget Consumed</span>
          <span className="font-semibold">{spentPct}%</span>
        </div>
        <Progress value={spentPct} className={`h-3 ${budgetBarClass(spentPct)}`} />
      </div>

      {/* Chart */}
      <div>
        <h4 className="text-sm font-semibold mb-3">Planned vs Actual</h4>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={p.budget.monthly} margin={{ top: 4, right: 4, left: -16, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tickFormatter={(v) => `$${v / 1000}k`} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  fontSize: 12,
                  color: "hsl(var(--foreground))",
                }}
                formatter={(v) => [`$${((Number(v) || 0) / 1000).toFixed(1)}k`, ""]}
              />
              <Bar dataKey="planned" name="Planned" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual"  name="Actual"  fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variance alert */}
      <div className={`rounded-lg border p-3 text-sm ${overBudget ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-emerald-500/30 bg-emerald-500/5 text-emerald-400"}`}>
        {overBudget
          ? `⚠ Over budget by $${(Math.abs(remaining) / 1000).toFixed(1)}k (${Math.abs(spentPct - 100)}%)`
          : `✓ ${100 - spentPct}% of budget remaining ($${(remaining / 1000).toFixed(1)}k)`
        }
      </div>
    </div>
  );
}

// ── Tasks Tab ─────────────────────────────────────────────────────────────────

// Status mapping: v2 display ↔ v1 file value
const V2_TO_FILE_STATUS: Record<Task["status"], string> = {
  "Completed":   "Done",
  "In Progress": "In Progress",
  "Pending":     "Not Started",
  "Overdue":     "In Progress",
};

const FILE_TO_V2_STATUS: Record<string, Task["status"]> = {
  "Done":        "Completed",
  "In Progress": "In Progress",
  "Not Started": "Pending",
  "Blocked":     "Pending",
};

// Field mapping: v2 field → markdown column name
const FIELD_MAP: Record<"name" | "assignee" | "dueDate", "title" | "owner" | "due"> = {
  name:      "title",
  assignee:  "owner",
  dueDate:   "due",
};

const TIME_CHIPS = [
  { label: "+15m", min: 15 },
  { label: "+30m", min: 30 },
  { label: "+1h",  min: 60 },
  { label: "+2h",  min: 120 },
  { label: "+4h",  min: 240 },
];

function toHHMM(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}
function fromHHMM(value: string) {
  const [h, m] = value.split(":").map((v) => parseInt(v) || 0);
  return h * 60 + m;
}

type EditState  = { taskId: string; field: "name" | "assignee" | "dueDate"; value: string; saving: boolean };
type LogState   = { taskId: string; owner: string; date: string; totalMinutes: number; timeInput: string; note: string; saving: boolean };

function TasksTab({ p, projectCode }: { p: Project; projectCode: string }) {
  const [tasks, setTasks]   = useState<Task[]>(p.tasks);
  const [edit, setEdit]     = useState<EditState | null>(null);
  const [log, setLog]       = useState<LogState | null>(null);
  const [toast, setToast]   = useState<string | null>(null);
  const editRef             = useRef<HTMLInputElement>(null);

  useEffect(() => { if (edit) editRef.current?.focus(); }, [edit?.taskId, edit?.field]);

  const counts = tasks.reduce<Record<string, number>>((acc, t) => {
    acc[t.status] = (acc[t.status] ?? 0) + 1;
    return acc;
  }, {});

  // ── Status change ───────────────────────────────────────────────────────────
  const handleStatusChange = async (taskId: string, v2Status: Task["status"]) => {
    setTasks((prev) => prev.map((t) => t.id === taskId ? { ...t, status: v2Status } : t));
    await updateStatus(projectCode, taskId, V2_TO_FILE_STATUS[v2Status]);
  };

  // ── Inline edit ─────────────────────────────────────────────────────────────
  const startEdit = (taskId: string, field: "name" | "assignee" | "dueDate", value: string) => {
    setEdit({ taskId, field, value, saving: false });
    setTimeout(() => editRef.current?.focus(), 20);
  };

  const commitEdit = async () => {
    if (!edit || edit.saving) return;
    setEdit({ ...edit, saving: true });
    const result = await updateTaskField(projectCode, edit.taskId, FIELD_MAP[edit.field], edit.value);
    if (result.ok) {
      setTasks((prev) => prev.map((t) => {
        if (t.id !== edit.taskId) return t;
        return { ...t, [edit.field]: edit.value };
      }));
      setEdit(null);
    } else {
      setEdit({ ...edit, saving: false });
    }
  };

  const cancelEdit = () => setEdit(null);

  // ── Log time ─────────────────────────────────────────────────────────────────
  const openLog = (task: Task) => {
    if (log?.taskId === task.id) { setLog(null); return; }
    setLog({ taskId: task.id, owner: task.assignee, date: new Date().toISOString().split("T")[0], totalMinutes: 0, timeInput: "00:00", note: "", saving: false });
  };

  const addChip = (min: number) => {
    if (!log) return;
    const next = log.totalMinutes + min;
    setLog({ ...log, totalMinutes: next, timeInput: toHHMM(next) });
  };

  const saveLog = async () => {
    if (!log || log.totalMinutes === 0) return;
    setLog({ ...log, saving: true });
    const result = await logTime(projectCode, log.taskId, log.owner, log.date, log.totalMinutes / 60, log.note);
    if (result.ok) {
      setToast(`Logged ${toHHMM(log.totalMinutes)} for ${log.taskId}`);
      setLog(null);
      setTimeout(() => setToast(null), 2500);
    } else {
      setLog({ ...log, saving: false });
    }
  };

  // ── Editable cell helper ─────────────────────────────────────────────────────
  const EditCell = ({ task, field, display }: { task: Task; field: "name" | "assignee" | "dueDate"; display: string }) => {
    const isEditing = edit?.taskId === task.id && edit.field === field;
    if (isEditing) {
      return (
        <input
          ref={editRef}
          type={field === "dueDate" ? "date" : "text"}
          value={edit.value}
          onChange={(e) => setEdit({ ...edit!, value: e.target.value })}
          onBlur={commitEdit}
          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
          disabled={edit.saving}
          className="bg-muted/50 border border-primary/50 rounded px-2 py-0.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary w-full"
        />
      );
    }
    return (
      <div className="group/cell flex items-center gap-1 min-w-0">
        <span className="truncate">{display || <span className="text-muted-foreground/40 italic">—</span>}</span>
        <button
          onClick={() => startEdit(task.id, field, display)}
          className="opacity-0 group-hover/cell:opacity-100 flex-shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-opacity"
        >
          <Pencil className="w-3 h-3" />
        </button>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="flex items-center gap-2 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-400">
          ✓ {toast}
        </div>
      )}

      {/* Summary pills */}
      <div className="flex flex-wrap gap-2">
        {(["Completed", "In Progress", "Pending", "Overdue"] as const).map((s) =>
          counts[s] ? <Badge key={s} className={TASK_STATUS_BADGE[s]}>{counts[s]} {s}</Badge> : null
        )}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {tasks.map((task) => {
          const isComplete = task.status === "Completed";
          const isOverdue  = task.status === "Overdue";
          const TaskIcon   = isComplete ? CheckCircle2 : isOverdue ? AlertTriangle : Circle;
          const iconColor  = isComplete ? "text-emerald-400" : isOverdue ? "text-destructive" : "text-muted-foreground";
          const isLogging  = log?.taskId === task.id;

          return (
            <div key={task.id} className="rounded-lg border border-border bg-muted/20 overflow-hidden">
              {/* Main row */}
              <div className="flex items-start gap-3 p-3">
                <TaskIcon className={`w-4 h-4 mt-0.5 flex-shrink-0 ${iconColor}`} />

                {/* Name */}
                <div className="flex-1 min-w-0">
                  <div className={`text-sm font-medium ${isComplete ? "line-through text-muted-foreground" : ""}`}>
                    <EditCell task={task} field="name" display={task.name} />
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2">
                    <EditCell task={task} field="assignee" display={task.assignee} />
                    {task.deliverable && <span>· {task.deliverable}</span>}
                  </div>
                </div>

                {/* Status select */}
                <select
                  value={task.status === "Overdue" ? "In Progress" : task.status}
                  onChange={(e) => handleStatusChange(task.id, e.target.value as Task["status"])}
                  className={`text-xs px-2 py-1 rounded border bg-transparent cursor-pointer focus:outline-none ${TASK_STATUS_BADGE[task.status]}`}
                >
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>

                {/* Due date */}
                <div className="text-xs text-muted-foreground min-w-[72px] text-right">
                  <EditCell task={task} field="dueDate" display={task.dueDate} />
                </div>

                {/* Log time button */}
                <button
                  onClick={() => openLog(task)}
                  title="Log time"
                  className={`p-1.5 rounded-md transition-colors flex-shrink-0 ${isLogging ? "bg-primary/20 text-primary" : "text-muted-foreground/40 hover:text-muted-foreground hover:bg-muted"}`}
                >
                  <Clock className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Log time panel */}
              {isLogging && log && (
                <div className="border-t border-border bg-muted/30 px-4 py-3 space-y-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Log time</span>
                    <input
                      type="date"
                      value={log.date}
                      onChange={(e) => setLog({ ...log, date: e.target.value })}
                      className="text-xs border border-border rounded px-2 py-1 bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    {TIME_CHIPS.map((c) => (
                      <button
                        key={c.label}
                        onClick={() => addChip(c.min)}
                        className="text-xs px-3 py-1 rounded-full border border-border bg-muted hover:bg-muted/80 text-foreground transition-colors font-medium"
                      >
                        {c.label}
                      </button>
                    ))}
                    <div className="relative">
                      <input
                        type="text"
                        value={log.timeInput}
                        onChange={(e) => setLog({ ...log, timeInput: e.target.value, totalMinutes: fromHHMM(e.target.value) })}
                        placeholder="00:00"
                        className="text-sm font-mono border border-border rounded px-3 pr-8 py-1 w-24 bg-card text-foreground text-center focus:outline-none focus:ring-1 focus:ring-primary"
                      />
                      {log.totalMinutes > 0 && (
                        <button onClick={() => setLog({ ...log, totalMinutes: 0, timeInput: "00:00" })} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>

                  <input
                    type="text"
                    value={log.note}
                    onChange={(e) => setLog({ ...log, note: e.target.value })}
                    onKeyDown={(e) => { if (e.key === "Enter") saveLog(); }}
                    placeholder="Note (optional)…"
                    className="w-full text-sm border border-border rounded px-3 py-1.5 bg-card text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-primary"
                  />

                  <div className="flex justify-end gap-2">
                    <button onClick={() => setLog(null)} className="text-sm px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                      Cancel
                    </button>
                    <button
                      onClick={saveLog}
                      disabled={log.totalMinutes === 0 || log.saving}
                      className="text-sm px-4 py-1.5 rounded-md bg-primary text-primary-foreground font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
                    >
                      {log.saving ? "Saving…" : "Save Log"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
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
        <div className="flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{active} active risk{active > 1 ? "s" : ""} require attention</span>
        </div>
      )}
      <div className="space-y-3">
        {p.risks.map((risk) => {
          const row = RISK_ROW[risk.status];
          return (
            <div key={risk.id} className={`rounded-lg border p-3 space-y-2 ${row.border} ${row.bg}`}>
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-semibold">{risk.title}</p>
                <Badge className={RISK_STATUS_BADGE[risk.status]}>{risk.status}</Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <Badge className={RISK_LEVEL_BADGE[risk.impact]}>Impact: {risk.impact}</Badge>
                <Badge className={RISK_LEVEL_BADGE[risk.probability]}>Prob: {risk.probability}</Badge>
                <Badge className="bg-muted text-muted-foreground border-border">{risk.owner}</Badge>
              </div>
              <div className="bg-muted/30 rounded-md px-3 py-2 text-xs text-muted-foreground">
                {risk.mitigation}
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
    return <p className="text-sm text-muted-foreground text-center py-8">No dependencies for this project.</p>;
  }
  return (
    <div className="space-y-3">
      {p.dependencies.map((dep) => {
        const row = DEP_ROW[dep.status];
        return (
          <div key={dep.id} className={`rounded-lg border p-3 space-y-2 ${row.border} ${row.bg}`}>
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <Badge className={DEP_TYPE_BADGE[dep.type]}>
                  {dep.type === "Blocked By" ? <ArrowRight className="w-3 h-3 rotate-180" /> : <ArrowRight className="w-3 h-3" />}
                  {dep.type}
                </Badge>
                <span className="text-sm font-medium">{dep.project}</span>
              </div>
              <Badge className={
                dep.status === "Met" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" :
                dep.status === "At Risk" ? "bg-yellow-500/15 text-yellow-400 border-yellow-500/30" :
                "bg-muted text-muted-foreground border-border"
              }>{dep.status}</Badge>
            </div>
            <p className="text-xs text-muted-foreground">{dep.description}</p>
          </div>
        );
      })}
    </div>
  );
}

// ── Team Tab ──────────────────────────────────────────────────────────────────

function TeamTab({ p }: { p: Project }) {
  return (
    <div className="space-y-2">
      {p.team.map((member) => (
        <div key={member.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
          <div className="flex items-center gap-3">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm ${member.isLead ? "bg-primary/20 border border-primary/40 text-primary font-bold" : "bg-muted text-muted-foreground"}`}>
              {initials(member.name)}
            </div>
            <div>
              <p className="text-sm font-medium">{member.name}</p>
              {member.isLead && <p className="text-xs text-primary">Project Lead</p>}
            </div>
          </div>
          <span className="text-xs text-muted-foreground">{member.role}</span>
        </div>
      ))}
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

interface Props {
  project: Project | null;
  onClose: () => void;
}

export function ProjectDetailDialog({ project: p, onClose }: Props) {
  if (!p) return null;
  const StatusIcon = STATUS_ICON[p.status];
  const overdueCount = p.tasks.filter((t) => t.status === "Overdue").length;
  const activeRisks  = p.risks.filter((r) => r.status === "Active").length;

  return (
    <Dialog open={!!p} onClose={onClose}>
      {/* Dialog header */}
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0 space-y-2">
            {/* Badges row */}
            <div className="flex flex-wrap gap-1.5">
              <Badge className={p.type === "Waterfall" ? "border-violet-500/40 bg-violet-500/10 text-violet-400" : "border-sky-500/40 bg-sky-500/10 text-sky-400"}>
                {p.type === "Waterfall" ? <Layers className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
                {p.type}
              </Badge>
              <Badge className={`${STATUS_BADGE[p.status]}`}>
                <StatusIcon className="w-3 h-3" />
                {p.status}
              </Badge>
              <Badge className={PRIORITY_BADGE[p.priority]}>{p.priority} Priority</Badge>
            </div>
            {/* Title */}
            <h2 className="text-xl font-bold leading-snug">{p.name}</h2>
            {/* Client + dates */}
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="text-sm font-medium">{p.client}</span>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <Calendar className="w-3.5 h-3.5" />
                {p.startDate} → {p.endDate}
              </div>
            </div>
            {/* Alert strips */}
            {(activeRisks > 0 || overdueCount > 0 || p.atRiskDeps > 0) && (
              <div className="flex gap-3 flex-wrap pt-1">
                {activeRisks > 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <ShieldAlert className="w-3.5 h-3.5" />{activeRisks} active risk{activeRisks > 1 ? "s" : ""}
                  </span>
                )}
                {overdueCount > 0 && (
                  <span className="flex items-center gap-1 text-xs text-destructive">
                    <Clock className="w-3.5 h-3.5" />{overdueCount} overdue task{overdueCount > 1 ? "s" : ""}
                  </span>
                )}
                {p.atRiskDeps > 0 && (
                  <span className="flex items-center gap-1 text-xs text-yellow-400">
                    <Link2 className="w-3.5 h-3.5" />{p.atRiskDeps} dependency at risk
                  </span>
                )}
              </div>
            )}
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none flex-shrink-0">×</button>
        </div>
      </div>

      {/* Inner tabs */}
      <div className="flex-1 overflow-y-auto">
        <Tabs defaultValue="overview" className="flex flex-col h-full">
          <TabsList className="border-b border-border bg-transparent px-6 gap-0 flex-shrink-0 overflow-x-auto">
            {[
              { value: "overview",      label: "Overview",      icon: TrendingUp,    badge: 0 },
              { value: "budget",        label: "Budget",        icon: DollarSign,    badge: 0 },
              { value: "tasks",         label: "Tasks",         icon: ClipboardList, badge: overdueCount },
              { value: "risks",         label: "Risks",         icon: ShieldAlert,   badge: activeRisks },
              { value: "dependencies",  label: "Dependencies",  icon: Link2,         badge: 0 },
              { value: "team",          label: "Team",          icon: Users,         badge: 0 },
            ].map(({ value, label, icon: Icon, badge }) => (
              <TabsTrigger key={value} value={value} className="rounded-none border-b-0 px-3 text-xs relative">
                <Icon className="w-3.5 h-3.5" />
                {label}
                {badge > 0 && (
                  <span className="ml-1 bg-destructive/20 text-destructive rounded-full w-4 h-4 text-[10px] font-bold inline-flex items-center justify-center">
                    {badge}
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="flex-1 overflow-y-auto p-6">
            <TabsContent value="overview"><OverviewTab p={p} /></TabsContent>
            <TabsContent value="budget"><BudgetTab p={p} /></TabsContent>
            <TabsContent value="tasks"><TasksTab p={p} /></TabsContent>
            <TabsContent value="risks"><RisksTab p={p} /></TabsContent>
            <TabsContent value="dependencies"><DependenciesTab p={p} /></TabsContent>
            <TabsContent value="team"><TeamTab p={p} /></TabsContent>
          </div>
        </Tabs>
      </div>
    </Dialog>
  );
}
