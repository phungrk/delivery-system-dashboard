"use client";

import { useMemo, useState } from "react";
import {
  Package, Search, Layers, GitBranch, LayoutDashboard, CalendarRange,
  TrendingUp, AlertTriangle, Activity,
} from "lucide-react";
import type { Project } from "../mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Select } from "./ui";
import { StatCard } from "./StatCard";
import { ProjectCard } from "./ProjectCard";
import { PhaseBoard } from "./PhaseBoard";
import { GanttChart } from "./GanttChart";

function ProjectsSummary({ projects }: { projects: Project[] }) {
  const total = projects.length;
  const waterfall = projects.filter((p) => p.type === "Waterfall").length;
  const scrum = projects.filter((p) => p.type === "Scrum").length;
  const onTrack = projects.filter((p) => p.status === "On Track" || p.status === "Completed").length;
  const delayed = projects.filter((p) => p.status === "Delayed").length;
  const atRisk = projects.filter((p) => p.status === "At Risk").length;
  const totalBudget = projects.reduce((sum, p) => sum + p.budget.total, 0);
  const totalSpent = projects.reduce((sum, p) => sum + p.budget.spent, 0);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      <StatCard label="Total Projects" value={String(total)} sub={`${waterfall} Waterfall · ${scrum} Scrum`} icon={Package} iconClass="text-primary" />
      <StatCard label="On Track" value={String(onTrack)} sub={`${delayed} delayed`} icon={TrendingUp} iconClass="text-emerald-400" />
      <StatCard label="At Risk" value={String(atRisk)} sub="Need attention" icon={AlertTriangle} iconClass="text-yellow-400" />
      <StatCard
        label="Budget Spent"
        value={totalBudget > 0 ? `$${Math.round(totalSpent / 1000)}k` : "—"}
        sub={totalBudget > 0 ? `of $${Math.round(totalBudget / 1000)}k total` : "No budget data"}
        icon={Activity}
        iconClass="text-blue-400"
      />
    </div>
  );
}

export function ProjectWorkspace({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"all" | "Waterfall" | "Scrum">("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q
      || p.name.toLowerCase().includes(q)
      || p.client.toLowerCase().includes(q)
      || p.id.toLowerCase().includes(q);
    const matchType = typeFilter === "all" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status.toLowerCase().replace(/ /g, "-") === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [projects, search, typeFilter, statusFilter]);

  const typeChip = (label: string, value: "all" | "Waterfall" | "Scrum", icon?: React.ReactNode) => (
    <button
      onClick={() => setTypeFilter(value)}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        typeFilter === value ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Project</p>
            <h2 className="text-lg font-semibold mt-1">Project Workspace</h2>
            <p className="text-sm text-muted-foreground mt-1">
              Browse by display mode, filter by type and status, and search projects by name, client, or code.
            </p>
          </div>
          <div className="text-sm text-muted-foreground">
            {filtered.length} / {projects.length} projects
          </div>
        </div>

        <div className="flex gap-3 flex-wrap items-center">
          <div className="relative flex-1 min-w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search project, client, or code..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex bg-muted/40 rounded-lg p-1 gap-0.5">
            {typeChip("All", "all")}
            {typeChip("Waterfall", "Waterfall", <Layers className="w-3.5 h-3.5" />)}
            {typeChip("Scrum", "Scrum", <GitBranch className="w-3.5 h-3.5" />)}
          </div>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-44">
            <option value="all">All Statuses</option>
            <option value="on-track">On Track</option>
            <option value="at-risk">At Risk</option>
            <option value="delayed">Delayed</option>
            <option value="completed">Completed</option>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="grid">
        <TabsList className="border-b border-border gap-1 mb-6">
          <TabsTrigger value="grid" className="h-11 gap-2">
            <Package className="w-4 h-4" /> Grid
          </TabsTrigger>
          <TabsTrigger value="phases" className="h-11 gap-2">
            <LayoutDashboard className="w-4 h-4" /> Phases
          </TabsTrigger>
          <TabsTrigger value="gantt" className="h-11 gap-2">
            <CalendarRange className="w-4 h-4" /> Gantt
          </TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="space-y-6">
          <ProjectsSummary projects={filtered} />
          {filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">No projects match your filters.</p>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {filtered.map((p) => (
                <ProjectCard key={p.id} project={p} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="phases">
          {filtered.length === 0
            ? <p className="text-center text-muted-foreground py-12">No projects match your filters.</p>
            : <PhaseBoard projects={filtered} />
          }
        </TabsContent>

        <TabsContent value="gantt">
          {filtered.length === 0
            ? <p className="text-center text-muted-foreground py-12">No projects match your filters.</p>
            : <GanttChart projects={filtered} />
          }
        </TabsContent>
      </Tabs>
    </div>
  );
}
