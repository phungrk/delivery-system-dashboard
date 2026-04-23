"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, ChevronDown, ChevronRight, Eye, Focus, Clock3 } from "lucide-react";
import type { Task } from "../mockData";

type FocusItem = { task: Task; reason: string };

function todayIso() {
  return new Date().toISOString().split("T")[0];
}

function taskDueInDays(task: Task, today: string) {
  if (!task.dueDate || task.dueDate === "-") return null;
  const diff = Math.ceil((new Date(task.dueDate).getTime() - new Date(today).getTime()) / 86400000);
  return Number.isNaN(diff) ? null : diff;
}

function classifyTasks(tasks: Task[], sprintProgressPct: number, today: string) {
  const urgent: FocusItem[] = [];
  const watch: FocusItem[] = [];

  for (const task of tasks) {
    if (task.status === "Done") continue;

    const dueInDays = taskDueInDays(task, today);
    const overdueDays = dueInDays !== null && dueInDays < 0 ? Math.abs(dueInDays) : null;

    if (task.status === "Blocked") {
      urgent.push({ task, reason: "Blocked" });
      continue;
    }

    if (overdueDays !== null) {
      urgent.push({ task, reason: `Overdue ${overdueDays} day${overdueDays > 1 ? "s" : ""}` });
      continue;
    }

    if (task.status === "To Do" && sprintProgressPct > 50) {
      urgent.push({ task, reason: `Not started (${Math.round(sprintProgressPct)}% of sprint elapsed)` });
      continue;
    }

    if (task.status === "In Progress") {
      watch.push({ task, reason: "In progress" });
      continue;
    }

    if (dueInDays !== null && dueInDays >= 0 && dueInDays <= 2) {
      const label = dueInDays === 0 ? "Due today" : dueInDays === 1 ? "Due tomorrow" : "Due in 2 days";
      watch.push({ task, reason: label });
    }
  }

  return { urgent, watch };
}

function buildFocus(urgent: FocusItem[], watch: FocusItem[]) {
  const items: string[] = [];

  for (const { task, reason } of urgent.slice(0, 3)) {
    if (task.status === "Blocked") items.push(`Unblock ${task.id} with ${task.assignee}`);
    else if (reason.startsWith("Overdue")) items.push(`Recover ${task.id} immediately with ${task.assignee}`);
    else items.push(`Start ${task.id} now with ${task.assignee}`);
  }

  for (const { task, reason } of watch.slice(0, 3 - items.length)) {
    items.push(`Check ${task.id} with ${task.assignee} — ${reason.toLowerCase()}`);
  }

  if (items.length === 0) items.push("Everything is on track today.");
  return items.slice(0, 3);
}

export function DailyFocusPanel({
  tasks,
  sprintProgressPct,
}: {
  tasks: Task[];
  sprintProgressPct: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const today = todayIso();

  const { urgent, watch, focus } = useMemo(() => {
    const { urgent, watch } = classifyTasks(tasks, sprintProgressPct, today);
    return { urgent, watch, focus: buildFocus(urgent, watch) };
  }, [sprintProgressPct, tasks, today]);

  const summary = urgent.length > 0
    ? `${urgent.length} urgent`
    : watch.length > 0
      ? `${watch.length} to watch`
      : "All clear";

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-muted/20 transition-colors"
      >
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold">Daily Focus</span>
            {urgent.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 px-2 py-0.5 text-[10px] font-bold">
                <AlertTriangle className="w-3 h-3" />
                {urgent.length}
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{summary} · {today}</p>
        </div>
        {expanded
          ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        }
      </button>

      {expanded && (
        <div className="border-t border-border px-4 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div>
              <p className="text-xs font-medium text-destructive mb-2 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Urgent
              </p>
              {urgent.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nothing urgent.</p>
              ) : (
                <ul className="space-y-1.5">
                  {urgent.map(({ task, reason }) => (
                    <li key={task.id} className="text-xs">
                      <span className="font-mono text-muted-foreground">{task.id}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span>{task.assignee}</span>
                      <span className="block text-destructive mt-0.5">{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-yellow-400 mb-2 flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" />
                Watch Today
              </p>
              {watch.length === 0 ? (
                <p className="text-xs text-muted-foreground italic">Nothing to watch.</p>
              ) : (
                <ul className="space-y-1.5">
                  {watch.map(({ task, reason }) => (
                    <li key={task.id} className="text-xs">
                      <span className="font-mono text-muted-foreground">{task.id}</span>
                      <span className="text-muted-foreground mx-1">·</span>
                      <span>{task.assignee}</span>
                      <span className="block text-yellow-400 mt-0.5">{reason}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1">
                <Focus className="w-3.5 h-3.5" />
                Suggested Focus
              </p>
              <ol className="space-y-1.5 list-decimal list-inside">
                {focus.map((item, index) => (
                  <li key={index} className="text-xs text-foreground/85">{item}</li>
                ))}
              </ol>
              <div className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground">
                <Clock3 className="w-3 h-3" />
                Sprint elapsed: {Math.round(sprintProgressPct)}%
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
