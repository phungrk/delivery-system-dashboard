"use client";

import { useMemo, useState } from "react";
import {
  Search, Users, AlertTriangle, TrendingDown, Activity, ExternalLink,
} from "lucide-react";
import Link from "next/link";
import type { Resource } from "../mockData";
import { Input, Select } from "./ui";
import { StatCard } from "./StatCard";
import { ResourceCard } from "./ResourceCard";
import { ResourceDetailDialog } from "./ResourceDetailDialog";

export function ResourcesTab({ resources }: { resources: Resource[] }) {
  const [search,     setSearch]     = useState("");
  const [deptFilter, setDeptFilter] = useState("all");
  const [selected,   setSelected]   = useState<Resource | null>(null);

  const departments = useMemo(
    () => ["all", ...Array.from(new Set(resources.map((r) => r.department)))],
    [resources],
  );

  const filtered = useMemo(() => resources.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = !q || r.name.toLowerCase().includes(q) || r.role.toLowerCase().includes(q) || r.skills.some((s) => s.toLowerCase().includes(q));
    const matchDept   = deptFilter === "all" || r.department === deptFilter;
    return matchSearch && matchDept;
  }), [resources, search, deptFilter]);

  // ── Stats ──────────────────────────────────────────────────────────────────
  const avgUtil    = resources.length > 0 ? Math.round(resources.reduce((s, r) => s + r.utilization, 0) / resources.length) : 0;
  const overloaded = resources.filter((r) => r.utilization >= 95).length;
  const available  = resources.filter((r) => r.utilization <= 70).length;

  return (
    <div className="space-y-6">

      {/* ── Stats row + Resource Center link ─────────────────────────────── */}
      <div className="flex items-center justify-between gap-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
          <StatCard label="Total Resources" value={String(resources.length)} sub="Team members"        icon={Users}          iconClass="text-primary" />
          <StatCard label="Avg Utilization"  value={`${avgUtil}%`}           sub="Across all members" icon={Activity}       iconClass="text-blue-400" />
          <StatCard label="Overloaded"        value={String(overloaded)}      sub="≥95% allocated"     icon={AlertTriangle}  iconClass="text-red-400" />
          <StatCard label="Available"         value={String(available)}       sub="≤70% allocated"     icon={TrendingDown}   iconClass="text-emerald-400" />
        </div>
        <div className="flex-shrink-0">
          <Link
            href="/v4/resource-center"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-primary text-primary text-sm font-medium hover:bg-primary/10 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Resource Center
          </Link>
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────────────────────── */}
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

      {/* ── Grid ─────────────────────────────────────────────────────────── */}
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
