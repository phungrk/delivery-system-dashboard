"use client";

import { Resource } from "../mockData";
import { Dialog, Badge, Progress } from "./ui";

function utilizationColor(pct: number) {
  if (pct >= 95) return "text-red-400";
  if (pct >= 80) return "text-yellow-400";
  return "text-emerald-400";
}

function utilizationBarClass(pct: number) {
  if (pct >= 95) return "[&>div]:bg-red-500";
  if (pct >= 80) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-emerald-500";
}

function initials(name: string) {
  return name.split(" ").map((n) => n[0]).slice(0, 2).join("");
}

interface Props {
  resource: Resource | null;
  onClose: () => void;
}

export function ResourceDetailDialog({ resource: r, onClose }: Props) {
  if (!r) return null;
  const available = 100 - r.utilization;

  return (
    <Dialog open={!!r} onClose={onClose} maxWidth="max-w-md">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-lg font-bold text-primary">
              {initials(r.name)}
            </div>
            <div>
              <h2 className="text-lg font-bold">{r.name}</h2>
              <p className="text-sm text-muted-foreground">{r.role}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-lg leading-none">×</button>
        </div>
      </div>

      {/* Body */}
      <div className="p-6 overflow-y-auto space-y-5">
        {/* Department */}
        <Badge className="border-border bg-muted text-muted-foreground">{r.department}</Badge>

        {/* Utilization */}
        <div>
          <div className="flex justify-between text-sm mb-2">
            <span className="text-muted-foreground">Utilization</span>
            <span className={`font-semibold ${utilizationColor(r.utilization)}`}>{r.utilization}%</span>
          </div>
          <Progress value={r.utilization} className={`h-3 ${utilizationBarClass(r.utilization)}`} />
        </div>

        {/* Allocation / Available */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className={`text-lg font-bold ${utilizationColor(r.utilization)}`}>{r.utilization}%</p>
            <p className="text-xs text-muted-foreground mt-1">Allocated</p>
          </div>
          <div className="bg-muted/30 rounded-lg p-3 text-center">
            <p className={`text-lg font-bold ${available < 10 ? "text-red-400" : "text-emerald-400"}`}>{available}%</p>
            <p className="text-xs text-muted-foreground mt-1">Available</p>
          </div>
        </div>

        {/* Skills */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Skills</h4>
          <div className="flex flex-wrap gap-1.5">
            {r.skills.map((s) => (
              <span key={s} className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs">{s}</span>
            ))}
          </div>
        </div>

        {/* Projects */}
        <div>
          <h4 className="text-sm font-semibold mb-2">Project Allocations</h4>
          <div className="space-y-2">
            {r.projects.map((proj) => (
              <div key={proj.name} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                <div>
                  <p className="text-sm font-medium">{proj.name}</p>
                  <p className="text-xs text-muted-foreground">{proj.role}</p>
                </div>
                <span className={`text-sm font-semibold ${utilizationColor(proj.allocation)}`}>{proj.allocation}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Dialog>
  );
}
