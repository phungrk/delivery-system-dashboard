"use client";

import { useMemo, useState } from "react";
import {
  Search, Layers, GitBranch, LayoutGrid, LayoutDashboard, CalendarRange,
  CheckCircle2, AlertTriangle, Activity, Package,
} from "lucide-react";
import type { Project } from "../mockData";
import { Input, Select } from "./ui";
import { StatCard } from "./StatCard";
import { ProjectCard } from "./ProjectCard";
import { PhaseBoard } from "./PhaseBoard";
import { GanttChart } from "./GanttChart";

type ViewMode = "grid" | "phases" | "gantt";

const VIEW_TABS: { value: ViewMode; label: string; Icon: React.ElementType }[] = [
  { value: "grid",   label: "Grid",        Icon: LayoutGrid },
  { value: "phases", label: "Phase Board", Icon: LayoutDashboard },
  { value: "gantt",  label: "Gantt",       Icon: CalendarRange },
];

export function ProjectsTab({ projects }: { projects: Project[] }) {
  const [search,       setSearch]       = useState("");
  const [typeFilter,   setTypeFilter]   = useState<"all" | "Waterfall" | "Scrum">("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [view,         setView]         = useState<ViewMode>("grid");

  const filtered = useMemo(() => projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch  = !q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q) || p.id.toLowerCase().includes(q);
    const matchType    = typeFilter === "all" || p.type === typeFilter;
    const matchStatus  = statusFilter === "all" || p.status.toLowerCase().replace(/ /g, "-") === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [projects, search, typeFilter, statusFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const total       = filtered.length;
  const waterfall   = filtered.filter((p) => p.type === "Waterfall").length;
  const scrum       = filtered.filter((p) => p.type === "Scrum").length;
  const onTrack     = filtered.filter((p) => p.status === "On Track" || p.status === "Completed").length;
  const delayed     = filtered.filter((p) => p.status === "Delayed").length;
  const atRisk      = filtered.filter((p) => p.risk === "High" || p.risk === "Medium").length;
  const totalBudget = filtered.reduce((sum, p) => sum + p.budget.total, 0);
  const totalSpent  = filtered.reduce((sum, p) => sum + p.budget.spent, 0);

  return (
    <div className="space-y-5">

      {/* ── Stats row ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Total Projects"
          value={String(total)}
          sub={`${waterfall} Waterfall · ${scrum} Scrum`}
          icon={Package}
          iconClass="text-primary"
        />
        <StatCard
          label="On Track"
          value={String(onTrack)}
          sub={`${delayed} delayed`}
          icon={CheckCircle2}
          iconClass="text-blue-400"
        />
        <StatCard
          label="At Risk"
          value={String(atRisk)}
          sub="Need attention"
          icon={AlertTriangle}
          iconClass="text-yellow-400"
        />
        <StatCard
          label="Budget Spent"
          value={totalBudget > 0 ? `$${Math.round(totalSpent / 1000)}k` : "—"}
          sub={totalBudget > 0 ? `of $${Math.round(totalBudget / 1000)}k total` : "No budget data"}
          icon={Activity}
          iconClass="text-blue-400"
        />
      </div>

      {/* ── Filter + view toggle bar ──────────────────────────────────────── */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Search */}
        <div className="relative flex-1 min-w-56">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        {/* Type pills */}
        <div className="flex bg-muted/40 rounded-lg p-1 gap-0.5 flex-shrink-0">
          {(["all", "Waterfall", "Scrum"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                typeFilter === t ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t === "Waterfall" && <Layers className="w-3.5 h-3.5" />}
              {t === "Scrum"     && <GitBranch className="w-3.5 h-3.5" />}
              {t === "all" ? "All" : t}
            </button>
          ))}
        </div>

        {/* Status select */}
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-40 flex-shrink-0"
        >
          <option value="all">All Statuses</option>
          <option value="on-track">On Track</option>
          <option value="at-risk">At Risk</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </Select>

        {/* View toggle */}
        <div className="flex items-center bg-muted/40 rounded-lg p-1 gap-0.5 flex-shrink-0">
          {VIEW_TABS.map(({ value, label, Icon }) => (
            <button
              key={value}
              onClick={() => setView(value)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                view === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ──────────────────────────────────────────────────────── */}
      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No projects match your filters.</p>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      ) : view === "phases" ? (
        <PhaseBoard projects={filtered} />
      ) : (
        <GanttChart projects={filtered} />
      )}
    </div>
  );
}
