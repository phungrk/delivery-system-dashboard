"use client";

import { Resource } from "../mockData";
import { Badge, Progress } from "./ui";

function utilizationClass(pct: number) {
  if (pct >= 95) return "text-red-400";
  if (pct >= 80) return "text-yellow-400";
  return "text-emerald-400";
}

function utilizationBarClass(pct: number) {
  if (pct >= 95) return "[&>div]:bg-red-500";
  if (pct >= 80) return "[&>div]:bg-yellow-500";
  return "[&>div]:bg-emerald-500";
}

interface Props {
  resource: Resource;
  onClick: () => void;
}

export function ResourceCard({ resource: r, onClick }: Props) {
  const available = 100 - r.utilization;

  return (
    <div
      onClick={onClick}
      className="bg-card border border-border rounded-xl p-4 cursor-pointer flex flex-col gap-3 hover:border-primary/50 hover:shadow-lg hover:shadow-black/20 transition-all"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-base font-semibold">{r.name}</p>
          <p className="text-sm text-muted-foreground mt-0.5">{r.role}</p>
        </div>
        <Badge className="border-border bg-muted text-muted-foreground">{r.department}</Badge>
      </div>

      {/* Utilization */}
      <div>
        <div className="flex justify-between text-xs mb-1">
          <span className="text-muted-foreground">Utilization</span>
          <span className={`font-semibold ${utilizationClass(r.utilization)}`}>{r.utilization}%</span>
        </div>
        <Progress value={r.utilization} className={`h-2 ${utilizationBarClass(r.utilization)}`} />
      </div>

      {/* Stats */}
      <div className="flex justify-between text-xs">
        <div>
          <span className={`font-semibold ${utilizationClass(r.utilization)}`}>{available}% available</span>
        </div>
        <span className="text-muted-foreground">{r.projectCount} project{r.projectCount !== 1 ? "s" : ""}</span>
      </div>

      {/* Skills */}
      <div className="pt-1 border-t border-border flex flex-wrap gap-1">
        {r.skills.slice(0, 4).map((s) => (
          <span key={s} className="bg-primary/10 text-primary px-2 py-0.5 rounded-md text-xs">{s}</span>
        ))}
        {r.skills.length > 4 && (
          <span className="text-xs text-muted-foreground px-1 py-0.5">+{r.skills.length - 4}</span>
        )}
      </div>
    </div>
  );
}
