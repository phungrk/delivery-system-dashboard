"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Users, Sun, Moon, FolderKanban,
  Search, Activity, AlertTriangle, TrendingDown, ExternalLink, TrendingUp,
} from "lucide-react";
import type { Project, Resource } from "./mockData";
import { Input, Select } from "./components/ui";
import { ResourceCard } from "./components/ResourceCard";
import { ResourceDetailDialog } from "./components/ResourceDetailDialog";
import { StatCard } from "./components/StatCard";
import { ProjectWorkspace } from "./components/ProjectWorkspace";

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
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard label="Total Resources" value={String(resources.length)} sub="Team members"         icon={Users}          iconClass="text-primary" />
          <StatCard label="Avg Utilization"  value={`${avgUtil}%`}           sub="Across all members"  icon={Activity}       iconClass="text-blue-400" />
          <StatCard label="Overloaded"        value={String(overloaded)}      sub="≥95% allocated"      icon={AlertTriangle}  iconClass="text-red-400" />
          <StatCard label="Available"         value={String(available)}       sub="≤70% allocated"      icon={TrendingDown}   iconClass="text-emerald-400" />
        </div>
        <div className="flex-shrink-0">
          <Link
            href="/v2/resource-center"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Resource Center
          </Link>
        </div>
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

// ── Main dashboard ────────────────────────────────────────────────────────────

interface Props {
  initialProjects: Project[];
  initialResources: Resource[];
}

export function DeliveryDashboard({ initialProjects, initialResources }: Props) {
  const [dark, setDark]         = useState(true);
  const [activeTab, setActiveTab] = useState<"projects" | "resources">("projects");

  return (
    <div className={`${dark ? "dark" : ""} min-h-screen bg-background text-foreground`}>

      {/* ── App header ─────────────────────────────────────────────────────── */}
      <header className="bg-card border-b border-border">
        {/* Title row */}
        <div className="max-w-7xl mx-auto px-6 pt-5 pb-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold leading-tight">Delivery Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track projects and allocate resources</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setDark((d) => !d)}
              className="p-2 rounded-lg border border-border bg-muted/40 hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <Link href="/v2" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
              Dashboard
            </Link>
          </div>
        </div>

        {/* Tab nav row */}
        <div className="max-w-7xl mx-auto px-6 flex gap-1">
          {(["projects", "resources"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 mb-[-1px] text-sm font-medium rounded-t-lg border transition-colors ${
                activeTab === tab
                  ? "bg-background border-border border-b-background text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:bg-muted/30"
              }`}
            >
              {tab === "projects"
                ? <FolderKanban className="w-4 h-4" />
                : <Users className="w-4 h-4" />
              }
              {tab === "projects" ? "Projects" : "Resources"}
            </button>
          ))}
        </div>
      </header>

      {/* ── Page content ───────────────────────────────────────────────────── */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {activeTab === "projects"
          ? <ProjectWorkspace projects={initialProjects} />
          : <ResourcesTab resources={initialResources} />
        }
      </main>
    </div>
  );
}
