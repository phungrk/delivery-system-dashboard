"use client";

import { useState, Fragment, useRef, useEffect } from "react";
import { Clock, X, Pencil } from "lucide-react";
import { Task, TaskStatus } from "@/lib/parser/sprint";
import { StatusDropdown } from "./StatusDropdown";
import { logTime, updateTaskField } from "@/lib/actions";

// ── Time helpers ────────────────────────────────────────────────────────────

function toHHMM(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function fromHHMM(value: string): number {
  const [h, m] = value.split(":").map((v) => parseInt(v) || 0);
  return h * 60 + m;
}

const CHIPS = [
  { label: "+15m", min: 15 },
  { label: "+30m", min: 30 },
  { label: "+1h",  min: 60 },
  { label: "+2h",  min: 120 },
  { label: "+4h",  min: 240 },
];

// ── Types ────────────────────────────────────────────────────────────────────

type SortKey = "overdue" | "owner" | "status" | "due";

type LogState = {
  taskId: string;
  owner: string;
  date: string;
  totalMinutes: number;
  timeInput: string;
  note: string;
  saving: boolean;
};

type Toast = { taskId: string; minutes: number };

type EditState = {
  taskId: string;
  field: "title" | "owner" | "due";
  value: string;
  saving: boolean;
};

// ── Component ────────────────────────────────────────────────────────────────

export function TaskTable({ tasks, projectCode, timeLogByTask }: { tasks: Task[]; projectCode: string; timeLogByTask: Record<string, number> }) {
  const [sort, setSort]               = useState<SortKey>("overdue");
  const [expandedId, setExpandedId]   = useState<string | null>(null);
  const [log, setLog]                 = useState<LogState | null>(null);
  const [sessionLogged, setSessionLogged] = useState<Record<string, number>>({});
  const [toast, setToast]             = useState<Toast | null>(null);
  const [edit, setEdit]               = useState<EditState | null>(null);
  const editInputRef                  = useRef<HTMLInputElement>(null);

  // ── Sorting ────────────────────────────────────────────────────────────

  const sorted = [...tasks].sort((a, b) => {
    if (sort === "overdue") return (b.overduedays ?? -1) - (a.overduedays ?? -1);
    if (sort === "owner")   return a.owner.localeCompare(b.owner);
    if (sort === "due")     return (a.due ?? "").localeCompare(b.due ?? "");
    if (sort === "status") {
      const ord: Record<TaskStatus, number> = { Blocked: 0, "In Progress": 1, "Not Started": 2, Done: 3 };
      return ord[a.status] - ord[b.status];
    }
    return 0;
  });

  // ── Expand / collapse ──────────────────────────────────────────────────

  const openExpand = (t: Task) => {
    if (expandedId === t.id) {
      setExpandedId(null);
      setLog(null);
      return;
    }
    setExpandedId(t.id);
    setLog({
      taskId: t.id,
      owner: t.owner ?? "",
      date: new Date().toISOString().split("T")[0],
      totalMinutes: 0,
      timeInput: "00:00",
      note: "",
      saving: false,
    });
  };

  // ── Chip click: accumulate ─────────────────────────────────────────────

  const addChip = (minutes: number) => {
    if (!log) return;
    const next = log.totalMinutes + minutes;
    setLog({ ...log, totalMinutes: next, timeInput: toHHMM(next) });
  };

  const handleTimeInput = (raw: string) => {
    if (!log) return;
    setLog({ ...log, timeInput: raw, totalMinutes: fromHHMM(raw) });
  };

  const clearTime = () => {
    if (!log) return;
    setLog({ ...log, totalMinutes: 0, timeInput: "00:00" });
  };

  // ── Save ───────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!log || log.totalMinutes === 0) return;
    setLog({ ...log, saving: true });
    const result = await logTime(projectCode, log.taskId, log.owner, log.date, log.totalMinutes / 60, log.note);
    if (!result.ok) { setLog({ ...log, saving: false }); return; }

    const logged = log.totalMinutes;
    const taskId = log.taskId;

    setSessionLogged((prev) => ({ ...prev, [taskId]: (prev[taskId] ?? 0) + logged }));
    setToast({ taskId, minutes: logged });
    setExpandedId(null);
    setLog(null);

    setTimeout(() => setToast(null), 2500);
  };

  // ── Inline edit ───────────────────────────────────────────────────────

  const startEdit = (t: Task, field: "title" | "owner" | "due") => {
    const value = field === "title" ? t.title : field === "owner" ? t.owner : (t.due ?? "");
    setEdit({ taskId: t.id, field, value, saving: false });
    setTimeout(() => editInputRef.current?.focus(), 30);
  };

  const commitEdit = async () => {
    if (!edit || edit.saving) return;
    setEdit({ ...edit, saving: true });
    const result = await updateTaskField(projectCode, edit.taskId, edit.field, edit.value);
    if (result.ok) setEdit(null);
    else setEdit({ ...edit, saving: false });
  };

  const cancelEdit = () => setEdit(null);

  useEffect(() => {
    if (edit) editInputRef.current?.focus();
  }, [edit?.taskId, edit?.field]);

  // ── Render ─────────────────────────────────────────────────────────────

  const SortBtn = ({ k, label }: { k: SortKey; label: string }) => (
    <button
      onClick={() => setSort(k)}
      className={`text-xs px-2 py-0.5 rounded transition-colors ${
        sort === k ? "bg-gray-800 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
      }`}
    >
      {label}
    </button>
  );

  const COLS = 9;

  return (
    <>
      {/* Sort controls */}
      <div className="flex gap-1.5 mb-3">
        <span className="text-xs text-gray-400 mr-1 self-center">Sort:</span>
        <SortBtn k="overdue" label="Overdue" />
        <SortBtn k="status"  label="Status" />
        <SortBtn k="owner"   label="Owner" />
        <SortBtn k="due"     label="Due" />
      </div>

      {/* Toast */}
      {toast && (
        <div className="mb-3 flex items-center gap-2 text-sm text-green-800 bg-green-50 border border-green-200 rounded-lg px-3 py-2 animate-in fade-in duration-200">
          <span className="text-green-500">✓</span>
          <span>Logged <strong>{toHHMM(toast.minutes)}</strong> for <code className="text-xs">{toast.taskId}</code></span>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b text-xs text-gray-500 uppercase tracking-wide">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Title</th>
              <th className="px-3 py-2 text-left">Owner</th>
              <th className="px-3 py-2 text-left">Status</th>
              <th className="px-3 py-2 text-right">Est.</th>
              <th className="px-3 py-2 text-right">Logged</th>
              <th className="px-3 py-2 text-left">Due</th>
              <th className="px-3 py-2 text-left">Flag</th>
              <th className="px-3 py-2"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((t) => {
              const isOverdue  = (t.overduedays ?? 0) > 0;
              const isStale    = (t.staleDays ?? 0) > 0;
              const isExpanded = expandedId === t.id;
              const fileHrs    = timeLogByTask[t.id] ?? 0;
              const sessionMin = sessionLogged[t.id] ?? 0;
              const logged     = fileHrs * 60 + sessionMin; // total minutes

              return (
                <Fragment key={t.id}>
                  {/* ── Task row ─────────────────────────────────────── */}
                  <tr
                    key={t.id}
                    className={[
                      isOverdue  ? "bg-red-50"  : "bg-white",
                      "hover:bg-gray-50/70 transition-colors",
                    ].join(" ")}
                  >
                    <td className={`px-3 py-2 font-mono text-xs ${isExpanded ? "text-gray-700 font-bold" : "text-gray-400"}`}>{t.id}</td>

                    {/* Title — inline editable */}
                    <td className="px-3 py-2 max-w-[220px]">
                      {edit?.taskId === t.id && edit.field === "title" ? (
                        <input
                          ref={editInputRef}
                          value={edit.value}
                          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className="w-full text-sm border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          disabled={edit.saving}
                        />
                      ) : (
                        <div className="group/cell flex items-start gap-1">
                          <div className="min-w-0">
                            <p className={`truncate ${isExpanded ? "font-bold text-gray-900" : "text-gray-800"}`}>
                              {t.title || <span className="text-gray-300 italic">untitled</span>}
                            </p>
                            {t.blockedBy && <p className="text-xs text-red-500 mt-0.5 truncate">⛔ {t.blockedBy}</p>}
                            {t.notes     && <p className="text-xs text-gray-400 mt-0.5 truncate">{t.notes}</p>}
                          </div>
                          <button onClick={() => startEdit(t, "title")} className="mt-0.5 shrink-0 opacity-0 group-hover/cell:opacity-100 text-gray-300 hover:text-gray-600 transition-opacity">
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    {/* Owner — inline editable */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {edit?.taskId === t.id && edit.field === "owner" ? (
                        <input
                          ref={editInputRef}
                          value={edit.value}
                          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className="w-24 text-sm border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          disabled={edit.saving}
                        />
                      ) : (
                        <div className="group/cell flex items-center gap-1">
                          <span className={isExpanded ? "font-bold text-gray-900" : "text-gray-700"}>{t.owner || <span className="text-gray-300">—</span>}</span>
                          <button onClick={() => startEdit(t, "owner")} className="opacity-0 group-hover/cell:opacity-100 text-gray-300 hover:text-gray-600 transition-opacity">
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2">
                      <StatusDropdown taskId={t.id} current={t.status} projectCode={projectCode} />
                    </td>

                    <td className="px-3 py-2 text-right text-gray-400 whitespace-nowrap text-xs">
                      {t.estHrs != null ? `${t.estHrs}h` : "—"}
                    </td>

                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      {logged ? (
                        <span className="text-xs font-medium text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {toHHMM(logged)}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>

                    {/* Due — inline editable */}
                    <td className="px-3 py-2 whitespace-nowrap">
                      {edit?.taskId === t.id && edit.field === "due" ? (
                        <input
                          ref={editInputRef}
                          type="date"
                          value={edit.value}
                          onChange={(e) => setEdit({ ...edit, value: e.target.value })}
                          onBlur={commitEdit}
                          onKeyDown={(e) => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") cancelEdit(); }}
                          className="text-xs border border-blue-300 rounded px-2 py-0.5 focus:outline-none focus:ring-2 focus:ring-blue-400"
                          disabled={edit.saving}
                        />
                      ) : (
                        <div className="group/cell flex items-center gap-1">
                          {t.due
                            ? <span className={isOverdue ? "text-red-600 font-medium text-xs" : "text-gray-600 text-xs"}>{t.due}</span>
                            : <span className="text-gray-300 text-xs">—</span>}
                          <button onClick={() => startEdit(t, "due")} className="opacity-0 group-hover/cell:opacity-100 text-gray-300 hover:text-gray-600 transition-opacity">
                            <Pencil size={12} />
                          </button>
                        </div>
                      )}
                    </td>

                    <td className="px-3 py-2 whitespace-nowrap text-xs">
                      {isOverdue && <span className="text-red-500 font-medium">-{t.overduedays}d</span>}
                      {isStale && !isOverdue && <span className="text-yellow-500">stale {t.staleDays}d</span>}
                      {t.cycleTimeDays != null && <span className="text-green-600">{t.cycleTimeDays}d</span>}
                    </td>

                    {/* Clock trigger */}
                    <td className="px-2 py-2">
                      <button
                        onClick={() => openExpand(t)}
                        title="Log time"
                        className={[
                          "p-1.5 rounded-md transition-colors",
                          isExpanded
                            ? "bg-gray-200 text-gray-700"
                            : "text-gray-300 hover:text-gray-600 hover:bg-gray-100",
                        ].join(" ")}
                      >
                        <Clock size={14} />
                      </button>
                    </td>
                  </tr>

                  {/* ── Expanded log area ─────────────────────────────── */}
                  {isExpanded && log && (
                    <tr key={`${t.id}-log`}>
                      <td
                        colSpan={COLS}
                        className="p-0 border-t border-b border-gray-100"
                      >
                        {/* Slide wrapper */}
                        <div className="bg-slate-50 px-4 py-4 space-y-3 animate-in slide-in-from-top-1 duration-200 ease-[cubic-bezier(0.4,0,0.2,1)]">

                          {/* Row 1: Label + Date */}
                          <div className="flex items-center gap-3">
                            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide">
                              Log time for today
                            </p>
                            <input
                              type="date"
                              value={log.date}
                              onChange={(e) => setLog({ ...log, date: e.target.value })}
                              className="text-xs border border-slate-200 rounded-md px-2 py-1 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400"
                            />
                          </div>

                          {/* Row 2: Chips + Time input */}
                          <div className="flex items-center gap-2 flex-wrap">
                            {CHIPS.map((c) => (
                              <button
                                key={c.label}
                                onClick={() => addChip(c.min)}
                                className="text-xs px-3 py-1 rounded-full border border-slate-300 bg-white text-slate-600 hover:bg-slate-100 hover:border-slate-400 transition-colors font-medium"
                              >
                                {c.label}
                              </button>
                            ))}

                            {/* Time field */}
                            <div className="relative ml-2">
                              <input
                                type="text"
                                value={log.timeInput}
                                onChange={(e) => handleTimeInput(e.target.value)}
                                placeholder="00:00"
                                className="text-sm font-mono border border-slate-300 rounded-md pl-3 pr-8 py-1 w-28 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 text-center"
                              />
                              {log.totalMinutes > 0 && (
                                <button
                                  onClick={clearTime}
                                  className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                  <X size={12} />
                                </button>
                              )}
                            </div>
                          </div>

                          {/* Row 3: Note */}
                          <input
                            type="text"
                            value={log.note}
                            onChange={(e) => setLog({ ...log, note: e.target.value })}
                            placeholder="Note (optional)..."
                            className="w-full text-sm border border-slate-200 rounded-md px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-slate-400 placeholder:text-slate-300"
                            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                          />

                          {/* Row 4: Actions */}
                          <div className="flex justify-end gap-2 pt-1">
                            <button
                              onClick={() => { setExpandedId(null); setLog(null); }}
                              className="text-sm px-3 py-1.5 text-slate-500 hover:text-slate-800 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSave}
                              disabled={log.totalMinutes === 0 || log.saving}
                              className="text-sm px-4 py-1.5 rounded-md bg-slate-800 text-white font-medium hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                              {log.saving ? "Saving…" : "Save Log"}
                            </button>
                          </div>

                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}
