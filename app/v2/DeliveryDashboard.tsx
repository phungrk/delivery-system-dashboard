"use client";

import { useMemo, useState } from "react";
import {
  Users, TrendingDown, Sun, Moon, FolderKanban, Search, Activity, AlertTriangle,
} from "lucide-react";
import type { Project, Resource } from "./mockData";
import { Tabs, TabsList, TabsTrigger, TabsContent, Input, Select } from "./components/ui";
import { ResourceCard } from "./components/ResourceCard";
import { ResourceDetailDialog } from "./components/ResourceDetailDialog";
import { ProjectWorkspace } from "./components/ProjectWorkspace";
import { StatCard } from "./components/StatCard";

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
        <Tabs defaultValue="project">
          <TabsList className="border-b border-border mb-8 gap-1">
            <TabsTrigger value="project" className="h-11 gap-2">
              <FolderKanban className="w-4 h-4" /> Project
            </TabsTrigger>
            <TabsTrigger value="resource" className="h-11 gap-2">
              <Users className="w-4 h-4" /> Resource
            </TabsTrigger>
          </TabsList>
          <TabsContent value="project"><ProjectWorkspace projects={initialProjects} /></TabsContent>
          <TabsContent value="resource"><ResourcesTab resources={initialResources} /></TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
