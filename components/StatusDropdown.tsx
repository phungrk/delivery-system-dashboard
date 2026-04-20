"use client";

import { useState, useRef, useEffect } from "react";
import { TaskStatus } from "@/lib/parser/sprint";
import { updateStatus } from "@/lib/actions";

const statusColors: Record<TaskStatus, string> = {
  "Done":        "bg-green-100 text-green-800 hover:bg-green-200",
  "In Progress": "bg-blue-100 text-blue-800 hover:bg-blue-200",
  "Not Started": "bg-gray-100 text-gray-600 hover:bg-gray-200",
  "Blocked":     "bg-red-100 text-red-800 hover:bg-red-200",
};

const ALL_STATUSES: TaskStatus[] = ["Not Started", "In Progress", "Done", "Blocked"];

type Props = {
  taskId: string;
  current: TaskStatus;
  projectCode: string;
  onUpdate?: (taskId: string, status: TaskStatus) => void;
};

export function StatusDropdown({ taskId, current, projectCode, onUpdate }: Props) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(current);
  const [saving, setSaving] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelect = async (status: TaskStatus) => {
    setOpen(false);
    if (status === value) return;
    setSaving(true);
    const result = await updateStatus(projectCode, taskId, status);
    if (!result.ok) { setSaving(false); return; }
    setValue(status);
    setSaving(false);
    onUpdate?.(taskId, status);
  };

  return (
    <div ref={ref} className="relative inline-block">
      <button
        onClick={() => setOpen((o) => !o)}
        disabled={saving}
        className={`text-xs px-1.5 py-0.5 rounded font-medium transition-colors flex items-center gap-1 ${statusColors[value]}`}
      >
        {saving ? "..." : value}
        <span className="opacity-50 text-[10px]">▾</span>
      </button>

      {open && (
        <div className="absolute z-50 top-full mt-1 left-0 bg-white border rounded-lg shadow-lg py-1 min-w-[130px]">
          {ALL_STATUSES.map((s) => (
            <button
              key={s}
              onClick={() => handleSelect(s)}
              className={`w-full text-left text-xs px-3 py-1.5 hover:bg-gray-50 flex items-center gap-2 ${s === value ? "font-semibold" : ""}`}
            >
              <span className={`inline-block w-1.5 h-1.5 rounded-full ${s === value ? "bg-gray-700" : "bg-gray-300"}`} />
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
