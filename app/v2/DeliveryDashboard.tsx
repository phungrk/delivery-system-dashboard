"use client";

import { useState, useMemo } from "react";
import {
  Package, Users, TrendingUp, AlertTriangle, Activity,
  TrendingDown, Search, Layers, GitBranch, Sun, Moon,
} from "lucide-react";
import type { Project, Resource } from "./mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Select } from "./components/ui";
import { StatCard } from "./components/StatCard";
import { ProjectCard } from "./components/ProjectCard";
import { ResourceCard } from "./components/ResourceCard";
import { ResourceDetailDialog } from "./components/ResourceDetailDialog";

// ── Projects Tab ──────────────────────────────────────────────────────────────

function ProjectsTab({ projects }: { projects: Project[] }) {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<"All" | "Waterfall" | "Scrum">("All");
  const [statusFilter, setStatusFilter] = useState("all");

  const filtered = useMemo(() => projects.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name.toLowerCase().includes(q) || p.client.toLowerCase().includes(q);
    const matchType = typeFilter === "All" || p.type === typeFilter;
    const matchStatus = statusFilter === "all" || p.status.toLowerCase().replace(/ /g, "-") === statusFilter;
    return matchSearch && matchType && matchStatus;
  }), [projects, search, typeFilter, statusFilter]);

  const total      = projects.length;
  const waterfall  = projects.filter((p) => p.type === "Waterfall").length;
  const scrum      = projects.filter((p) => p.type === "Scrum").length;
  const onTrack    = projects.filter((p) => p.status === "On Track" || p.status === "Completed").length;
  const delayed    = projects.filter((p) => p.status === "Delayed").length;
  const atRisk     = projects.filter((p) => p.status === "At Risk").length;
  const totalBudget = projects.reduce((s, p) => s + p.budget.total, 0);
  const totalSpent  = projects.reduce((s, p) => s + p.budget.spent, 0);

  const toggleBtn = (label: string, active: boolean, onClick: () => void, icon?: React.ReactNode) => (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        active ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{label}
    </button>
  );

  return (
    <div className="space-y-6">
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

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex bg-muted/40 rounded-lg p-1 gap-0.5">
          {toggleBtn("All", typeFilter === "All", () => setTypeFilter("All"))}
          {toggleBtn("Waterfall", typeFilter === "Waterfall", () => setTypeFilter("Waterfall"), <Layers className="w-3.5 h-3.5" />)}
          {toggleBtn("Scrum", typeFilter === "Scrum", () => setTypeFilter("Scrum"), <GitBranch className="w-3.5 h-3.5" />)}
        </div>
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="w-40">
          <option value="all">All Statuses</option>
          <option value="on-track">On Track</option>
          <option value="at-risk">At Risk</option>
          <option value="delayed">Delayed</option>
          <option value="completed">Completed</option>
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No projects match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map((p) => (
            <ProjectCard key={p.id} project={p} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Resources Tab ─────────────────────────────────────────────────────────────

function ResourcesTab({ resources }: { resources: Resource[] }) {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selected, setSelected] = useState<Resource | null>(null);

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(resources.map((r) => r.department)))],
    [resources],
  );

  const filtered = useMemo(() => resources.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.skills.some((s) => s.toLowerCase().includes(q));
    const matchDept = deptFilter === "all" || r.department === deptFilter;
    return matchSearch && matchDept;
  }), [resources, search, deptFilter]);

  const avgUtil    = resources.length > 0 ? Math.round(resources.reduce((s, r) => s + r.utilization, 0) / resources.length) : 0;
  const overloaded = resources.filter((r) => r.utilization >= 95).length;
  const available  = resources.filter((r) => r.utilization <= 70).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Resources" value={String(resources.length)} sub="Team members" icon={Users} iconClass="text-primary" />
        <StatCard label="Avg Utilization" value={`${avgUtil}%`} sub="Across all members" icon={Activity} iconClass="text-blue-400" />
        <StatCard label="Overloaded" value={String(overloaded)} sub="≥95% allocated" icon={AlertTriangle} iconClass="text-red-400" />
        <StatCard label="Available" value={String(available)} sub="≤70% allocated" icon={TrendingDown} iconClass="text-emerald-400" />
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search name, role, or skill..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onChange={(e) => setDeptFilter(e.target.value)} className="w-44">
          {departments.map((d) => (
            <option key={d} value={d}>{d === "all" ? "All Departments" : d}</option>
          ))}
        </Select>
      </div>

      {filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-12">No resources match your filters.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((r) => (
            <ResourceCard key={r.id} resource={r} onClick={() => setSelected(r)} />
          ))}
        </div>
      )}

      <ResourceDetailDialog resource={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

interface Props {
  initialProjects: Project[];
  initialResources: Resource[];
}

export function DeliveryDashboard({ initialProjects, initialResources }: Props) {
  const [dark, setDark] = useState(true);

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen bg-background text-foreground`}>
      <header className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Delivery Management</h1>
            <p className="text-sm text-muted-foreground">Track projects and allocate resources</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">Dashboard</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <Tabs defaultValue="projects">
          <TabsList className="border-b border-border mb-8 gap-1">
            <TabsTrigger value="projects" className="h-11 gap-2">
              <Package className="w-4 h-4" /> Projects
            </TabsTrigger>
            <TabsTrigger value="resources" className="h-11 gap-2">
              <Users className="w-4 h-4" /> Resources
            </TabsTrigger>
          </TabsList>
          <TabsContent value="projects"><ProjectsTab projects={initialProjects} /></TabsContent>
          <TabsContent value="resources"><ResourcesTab resources={initialResources} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
