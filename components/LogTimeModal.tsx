"use client";

import { useState } from "react";

type Props = {
  taskId: string;
  taskTitle: string;
  defaultOwner?: string;
  onClose: () => void;
  onSubmit?: (entry: { taskId: string; owner: string; date: string; hours: number; note: string }) => void;
};

export function LogTimeModal({ taskId, taskTitle, defaultOwner = "", onClose, onSubmit }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const [owner, setOwner] = useState(defaultOwner);
  const [date, setDate] = useState(today);
  const [hours, setHours] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const valid = owner.trim() && parseFloat(hours) > 0;

  const handleSubmit = async () => {
    if (!valid) return;
    setSaving(true);
    // Wire server action here later
    await new Promise((r) => setTimeout(r, 400)); // placeholder
    setSaving(false);
    setDone(true);
    onSubmit?.({ taskId, owner, date, hours: parseFloat(hours), note });
    setTimeout(onClose, 800);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-sm mx-4 p-5">
        {done ? (
          <div className="flex flex-col items-center gap-2 py-4">
            <span className="text-3xl">✓</span>
            <p className="text-sm text-gray-600 font-medium">Logged!</p>
          </div>
        ) : (
          <>
            <div className="mb-4">
              <h2 className="text-sm font-semibold text-gray-900">Log Time</h2>
              <p className="text-xs text-gray-400 mt-0.5 font-mono">{taskId}</p>
              {taskTitle && <p className="text-xs text-gray-500 mt-0.5 truncate">{taskTitle}</p>}
            </div>

            <div className="space-y-3">
              <Field label="Owner">
                <input
                  autoFocus
                  value={owner}
                  onChange={(e) => setOwner(e.target.value)}
                  placeholder="tên người làm"
                  className={input}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date">
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className={input}
                  />
                </Field>

                <Field label="Hours">
                  <input
                    type="number"
                    min="0.5"
                    max="24"
                    step="0.5"
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                    placeholder="0"
                    className={input}
                  />
                </Field>
              </div>

              <Field label="Note (optional)">
                <input
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="mô tả ngắn"
                  className={input}
                  onKeyDown={(e) => { if (e.key === "Enter" && valid) handleSubmit(); }}
                />
              </Field>
            </div>

            <div className="flex gap-2 mt-5">
              <button
                onClick={onClose}
                className="flex-1 text-sm py-2 rounded-lg border text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={!valid || saving}
                className="flex-1 text-sm py-2 rounded-lg bg-gray-900 text-white font-medium hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                {saving ? "Saving…" : "Log Time"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const input = "w-full text-sm border rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-1";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs text-gray-500 block mb-1">{label}</label>
      {children}
    </div>
  );
}
