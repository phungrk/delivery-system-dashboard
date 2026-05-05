"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Info, Search, HelpCircle, Bell, User,
  ChevronLeft, ChevronRight, ChevronDown, Settings, Share2,
  BookOpen, Folder, Plus, MoreHorizontal,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type PColor = "violet" | "sky" | "pink" | "orange" | "teal" | "blue";
type Scale  = "D" | "W" | "M";

interface Week { id: string; top: string; bot: string; unavail: boolean }

interface AllocBar { startW: number; endW: number; pct: number; label: string }

interface MemberProj {
  id: string; name: string; color: PColor;
  estH: number; actualH?: number; bars: AllocBar[];
}

interface Member {
  id: string; name: string; role: string; initials: string; ac: string;
  util: number[]; // % per week (0–120+)
  projects: MemberProj[];
}

interface ResourceRow {
  id: string; name: string; initials: string; ac: string;
  estH: number; allocH: number; util: number[];
}

interface ProjectRC {
  id: string; name: string; count: number;
  status: "Active" | "Pipeline" | "On Hold" | "Complete";
  budget: string; eac: string; actualFees: string;
  barStart: number; barEnd: number;
  resources: ResourceRow[];
}

// ── Layout Constants ──────────────────────────────────────────────────────────

const WEEK_W   = 116;
const ROW_H    = 44;
const HDR_H    = 52;
const NEST_H   = 28;
const NEST_ROW = 40;
const TM_LEFT  = 424; // 200 + 148 + 76
const PR_LEFT  = 446; // 196 + 96 + 82 + 72

// ── Project Color Palette ─────────────────────────────────────────────────────

const PC: Record<PColor, { bg: string; bd: string; txt: string; dot: string }> = {
  violet: { bg: "hsl(262 83% 58% / 0.72)", bd: "hsl(262 83% 58% / 0.45)", txt: "text-violet-400", dot: "bg-violet-500"  },
  sky:    { bg: "hsl(199 89% 50% / 0.72)", bd: "hsl(199 89% 50% / 0.45)", txt: "text-sky-400",    dot: "bg-sky-400"     },
  pink:   { bg: "hsl(330 65% 58% / 0.72)", bd: "hsl(330 65% 58% / 0.45)", txt: "text-pink-400",   dot: "bg-pink-500"    },
  orange: { bg: "hsl(25 95% 53% / 0.72)",  bd: "hsl(25 95% 53% / 0.45)",  txt: "text-orange-400", dot: "bg-orange-500"  },
  teal:   { bg: "hsl(172 68% 42% / 0.72)", bd: "hsl(172 68% 42% / 0.45)", txt: "text-teal-400",   dot: "bg-teal-500"    },
  blue:   { bg: "hsl(217 91% 60% / 0.72)", bd: "hsl(217 91% 60% / 0.45)", txt: "text-blue-400",   dot: "bg-blue-500"    },
};

function stripeStyle(color: PColor) {
  const c = PC[color];
  return {
    background: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.09) 4px, rgba(255,255,255,0.09) 8px), ${c.bg}`,
    border: `1px solid ${c.bd}`,
  };
}

// ── Mock Data ─────────────────────────────────────────────────────────────────

const WEEKS: Week[] = [
  { id: "w0", top: "May 4",  bot: "– 10",    unavail: false },
  { id: "w1", top: "May 11", bot: "– 17",    unavail: false },
  { id: "w2", top: "May 18", bot: "– 24",    unavail: false },
  { id: "w3", top: "May 25", bot: "– 31",    unavail: true  },
  { id: "w4", top: "Jun 1",  bot: "– 7",     unavail: false },
  { id: "w5", top: "Jun 8",  bot: "– 14",    unavail: false },
  { id: "w6", top: "Jun 15", bot: "– 21",    unavail: false },
  { id: "w7", top: "Jun 22", bot: "– 28",    unavail: false },
  { id: "w8", top: "Jun 29", bot: "– Jul 5", unavail: false },
  { id: "w9", top: "Jul 6",  bot: "– 12",    unavail: false },
];

const MEMBERS: Member[] = [
  {
    id: "alice", name: "Alice Nguyen", role: "Senior Project Manager", initials: "AN",
    ac: "bg-violet-500/20 text-violet-400",
    util: [85, 85, 85, 0, 85, 85, 85, 85, 85, 85],
    projects: [
      { id: "P001", name: "E-Commerce Redesign", color: "violet", estH: 240, actualH: 182,
        bars: [{ startW: 0, endW: 9, pct: 70, label: "28h" }] },
      { id: "P004", name: "Customer Portal",     color: "sky",    estH: 80,  actualH: 55,
        bars: [{ startW: 0, endW: 7, pct: 15, label: "6h"  }] },
    ],
  },
  {
    id: "emily", name: "Emily Ho", role: "Frontend Developer", initials: "EH",
    ac: "bg-sky-500/20 text-sky-400",
    util: [95, 95, 95, 0, 95, 95, 75, 75, 75, 75],
    projects: [
      { id: "P001", name: "E-Commerce Redesign", color: "violet", estH: 160, actualH: 120,
        bars: [{ startW: 0, endW: 4, pct: 40, label: "16h" }] },
      { id: "P005", name: "Analytics Dashboard", color: "blue",   estH: 200, actualH: 140,
        bars: [{ startW: 0, endW: 9, pct: 35, label: "14h" }] },
      { id: "P003", name: "Mobile Banking App",  color: "pink",   estH: 120,
        bars: [{ startW: 5, endW: 9, pct: 20, label: "8h"  }] },
    ],
  },
  {
    id: "henry", name: "Henry Dao", role: "Tech Lead", initials: "HD",
    ac: "bg-orange-500/20 text-orange-400",
    util: [100, 100, 100, 0, 100, 110, 100, 100, 100, 100],
    projects: [
      { id: "P002", name: "ERP System Integration", color: "orange", estH: 300, actualH: 280,
        bars: [{ startW: 0, endW: 9, pct: 60, label: "24h" }] },
      { id: "P005", name: "Analytics Dashboard",    color: "blue",   estH: 240, actualH: 180,
        bars: [{ startW: 0, endW: 9, pct: 40, label: "16h" }] },
    ],
  },
  {
    id: "carol", name: "Carol Le", role: "Backend Developer", initials: "CL",
    ac: "bg-teal-500/20 text-teal-400",
    util: [98, 98, 98, 0, 98, 98, 98, 98, 95, 95],
    projects: [
      { id: "P002", name: "ERP System Integration", color: "orange", estH: 200, actualH: 195,
        bars: [{ startW: 0, endW: 9, pct: 50, label: "20h" }] },
      { id: "P005", name: "Analytics Dashboard",    color: "blue",   estH: 160,
        bars: [{ startW: 0, endW: 9, pct: 30, label: "12h" }] },
    ],
  },
  {
    id: "iris", name: "Iris Wong", role: "Scrum Master", initials: "IW",
    ac: "bg-emerald-500/20 text-emerald-400",
    util: [65, 65, 65, 0, 65, 65, 65, 50, 50, 50],
    projects: [
      { id: "P004", name: "Customer Portal",      color: "sky",  estH: 160, actualH: 100,
        bars: [{ startW: 0, endW: 9, pct: 50, label: "20h" }] },
      { id: "P005", name: "Analytics Dashboard",  color: "blue", estH: 60,
        bars: [{ startW: 0, endW: 7, pct: 15, label: "6h"  }] },
    ],
  },
  {
    id: "frank", name: "Frank Vo", role: "DevOps Engineer", initials: "FV",
    ac: "bg-rose-500/20 text-rose-400",
    util: [60, 60, 60, 0, 60, 60, 60, 60, 60, 60],
    projects: [
      { id: "P006", name: "API Gateway (Complete)", color: "teal", estH: 200, actualH: 200,
        bars: [{ startW: 0, endW: 3, pct: 50, label: "20h" }] },
      { id: "P003", name: "Mobile Banking App",     color: "pink", estH: 40,
        bars: [{ startW: 4, endW: 9, pct: 10, label: "4h"  }] },
    ],
  },
  {
    id: "jack", name: "Jack Chen", role: "Backend Developer", initials: "JC",
    ac: "bg-amber-500/20 text-amber-400",
    util: [88, 88, 88, 0, 88, 88, 70, 70, 88, 88],
    projects: [
      { id: "P001", name: "E-Commerce Redesign",   color: "violet", estH: 180, actualH: 140,
        bars: [{ startW: 0, endW: 5, pct: 40, label: "16h" }] },
      { id: "P002", name: "ERP System Integration", color: "orange", estH: 160,
        bars: [{ startW: 3, endW: 9, pct: 30, label: "12h" }] },
    ],
  },
];

const PROJECTS_RC: ProjectRC[] = [
  {
    id: "P001", name: "E-Commerce Platform Redesign", count: 4, status: "Active",
    budget: "$280,000", eac: "$295,000", actualFees: "$148,000",
    barStart: 0, barEnd: 7,
    resources: [
      { id: "alice", name: "Alice Nguyen", initials: "AN", ac: "bg-violet-500/20 text-violet-400",
        estH: 240, allocH: 182, util: [28, 28, 28, 0, 28, 28, 28, 28, 0, 0] },
      { id: "emily", name: "Emily Ho",     initials: "EH", ac: "bg-sky-500/20 text-sky-400",
        estH: 160, allocH: 120, util: [16, 16, 16, 0, 16, 0, 0, 0, 0, 0] },
      { id: "jack",  name: "Jack Chen",    initials: "JC", ac: "bg-amber-500/20 text-amber-400",
        estH: 180, allocH: 140, util: [16, 16, 16, 0, 16, 16, 0, 0, 0, 0] },
    ],
  },
  {
    id: "P002", name: "ERP System Integration", count: 3, status: "Active",
    budget: "$420,000", eac: "$440,000", actualFees: "$398,000",
    barStart: 0, barEnd: 9,
    resources: [
      { id: "henry", name: "Henry Dao", initials: "HD", ac: "bg-orange-500/20 text-orange-400",
        estH: 300, allocH: 280, util: [24, 24, 24, 0, 24, 24, 24, 24, 24, 24] },
      { id: "carol", name: "Carol Le",  initials: "CL", ac: "bg-teal-500/20 text-teal-400",
        estH: 200, allocH: 195, util: [20, 20, 20, 0, 20, 20, 20, 20, 20, 20] },
    ],
  },
  {
    id: "P003", name: "Mobile Banking App", count: 2, status: "Active",
    budget: "$350,000", eac: "$362,000", actualFees: "$68,000",
    barStart: 5, barEnd: 9,
    resources: [
      { id: "emily", name: "Emily Ho", initials: "EH", ac: "bg-sky-500/20 text-sky-400",
        estH: 120, allocH: 80, util: [0, 0, 0, 0, 0, 8, 8, 8, 8, 8] },
      { id: "frank", name: "Frank Vo", initials: "FV", ac: "bg-rose-500/20 text-rose-400",
        estH: 40,  allocH: 0,  util: [0, 0, 0, 0, 4, 4, 4, 4, 4, 4] },
    ],
  },
  {
    id: "P004", name: "Customer Portal", count: 3, status: "Active",
    budget: "$180,000", eac: "$185,000", actualFees: "$118,000",
    barStart: 0, barEnd: 7,
    resources: [
      { id: "alice", name: "Alice Nguyen", initials: "AN", ac: "bg-violet-500/20 text-violet-400",
        estH: 80,  allocH: 55,  util: [6, 6, 6, 0, 6, 6, 6, 6, 0, 0] },
      { id: "iris",  name: "Iris Wong",    initials: "IW", ac: "bg-emerald-500/20 text-emerald-400",
        estH: 160, allocH: 100, util: [20, 20, 20, 0, 20, 20, 20, 20, 0, 0] },
    ],
  },
  {
    id: "P005", name: "Analytics Dashboard", count: 3, status: "Active",
    budget: "$210,000", eac: "$225,000", actualFees: "$105,000",
    barStart: 0, barEnd: 9,
    resources: [
      { id: "henry", name: "Henry Dao", initials: "HD", ac: "bg-orange-500/20 text-orange-400",
        estH: 240, allocH: 180, util: [16, 16, 16, 0, 16, 16, 16, 16, 16, 16] },
      { id: "carol", name: "Carol Le",  initials: "CL", ac: "bg-teal-500/20 text-teal-400",
        estH: 160, allocH: 0,   util: [12, 12, 12, 0, 12, 12, 12, 12, 12, 12] },
      { id: "iris",  name: "Iris Wong", initials: "IW", ac: "bg-emerald-500/20 text-emerald-400",
        estH: 60,  allocH: 0,   util: [6,  6,  6,  0,  6,  6,  6,  6,  0,  0] },
    ],
  },
  {
    id: "P006", name: "API Gateway Modernization", count: 2, status: "Complete",
    budget: "$120,000", eac: "$120,000", actualFees: "$114,000",
    barStart: 0, barEnd: 3,
    resources: [
      { id: "frank", name: "Frank Vo",  initials: "FV", ac: "bg-rose-500/20 text-rose-400",
        estH: 200, allocH: 200, util: [20, 20, 20, 0, 0, 0, 0, 0, 0, 0] },
    ],
  },
];

// ── Status badge styles (Projects tab) ────────────────────────────────────────

const STATUS_CLS: Record<ProjectRC["status"], string> = {
  "Active":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Pipeline": "bg-primary/15 text-primary border-primary/30",
  "On Hold":  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Complete": "bg-muted text-muted-foreground border-border",
};

// ── VRow types ────────────────────────────────────────────────────────────────

type TMVRow =
  | { kind: "member";     m: Member }
  | { kind: "nested-hdr"; mId: string }
  | { kind: "proj-row";   mId: string; proj: MemberProj };

type PRVRow =
  | { kind: "project";  p: ProjectRC }
  | { kind: "resource"; pId: string; r: ResourceRow };

function buildTMRows(expanded: Set<string>): TMVRow[] {
  const rows: TMVRow[] = [];
  for (const m of MEMBERS) {
    rows.push({ kind: "member", m });
    if (expanded.has(m.id)) {
      rows.push({ kind: "nested-hdr", mId: m.id });
      for (const proj of m.projects) rows.push({ kind: "proj-row", mId: m.id, proj });
    }
  }
  return rows;
}

function buildPRRows(expanded: Set<string>): PRVRow[] {
  const rows: PRVRow[] = [];
  for (const p of PROJECTS_RC) {
    rows.push({ kind: "project", p });
    if (expanded.has(p.id)) {
      for (const r of p.resources) rows.push({ kind: "resource", pId: p.id, r });
    }
  }
  return rows;
}

// ── UtilCell ──────────────────────────────────────────────────────────────────

function UtilCell({ pct, unavail, gray }: { pct: number; unavail: boolean; gray?: boolean }) {
  const hours = pct > 0 ? Math.round(pct / 100 * 40) : 0;
  return (
    <div
      className={`flex items-center justify-center border-r border-border/20 flex-shrink-0 ${unavail ? "bg-muted/15" : ""}`}
      style={{ width: WEEK_W, height: "100%" }}
    >
      {hours === 0
        ? <span className="text-[11px] text-muted-foreground/30">–</span>
        : <span className={`text-[11px] font-semibold tabular-nums ${gray ? "text-muted-foreground" : pct > 100 ? "text-destructive" : "text-primary"}`}>
            {hours}h
          </span>
      }
    </div>
  );
}

// ── Week header cells (shared) ────────────────────────────────────────────────

function WeekHeaders() {
  return (
    <>
      {WEEKS.map((w) => (
        <div
          key={w.id}
          className={`flex flex-col items-center justify-end pb-1.5 border-r border-border/30 flex-shrink-0 ${w.unavail ? "bg-muted/40" : ""}`}
          style={{ width: WEEK_W, height: HDR_H }}
        >
          <span className="text-[10.5px] font-semibold leading-tight">{w.top}</span>
          <span className="text-[9px] text-muted-foreground leading-tight">{w.bot}</span>
          {w.unavail && <span className="text-[8px] text-muted-foreground/50 leading-tight">holiday</span>}
        </div>
      ))}
    </>
  );
}

// ── Grid lines overlay (reusable for relative containers) ─────────────────────

function WeekGridLines({ height }: { height: number }) {
  return (
    <>
      {WEEKS.map((w, wi) => (
        <div
          key={w.id}
          className={`absolute inset-y-0 border-r border-border/20 ${w.unavail ? "bg-muted/10" : ""}`}
          style={{ left: wi * WEEK_W, width: WEEK_W, height }}
        />
      ))}
    </>
  );
}

// ── Chrome components ─────────────────────────────────────────────────────────

function BetaBanner() {
  return (
    <div className="bg-primary/10 px-4 py-1.5 flex items-center gap-2 text-xs text-primary/80 border-b border-primary/20">
      <Info className="w-3.5 h-3.5 flex-shrink-0" />
      <span>Resource planning is in <strong>beta</strong> — your feedback helps us improve.</span>
    </div>
  );
}

function AppHeader() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit", hour12: false });
  return (
    <header className="bg-card border-b border-border px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Link href="/v2" className="text-xs text-muted-foreground hover:text-foreground transition-colors">← Dashboard</Link>
        <span className="text-muted-foreground/40 text-xs">/</span>
        <h1 className="text-base font-bold">Resource Center</h1>
      </div>
      <div className="flex items-center gap-1.5">
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <Search className="w-4 h-4" />
        </button>
        <div className="bg-muted rounded px-2 py-1 text-[11px] font-mono text-muted-foreground select-none">
          {timeStr}
        </div>
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <HelpCircle className="w-4 h-4" />
        </button>
        <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-destructive rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center ml-0.5">
          <User className="w-3.5 h-3.5 text-primary" />
        </div>
      </div>
    </header>
  );
}

function TabBar({ active, onChange }: { active: string; onChange: (v: "members" | "projects") => void }) {
  return (
    <div className="bg-card border-b border-border px-4 flex">
      {(["members", "projects"] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => onChange(tab)}
          className={`px-5 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            active === tab
              ? "text-foreground border-primary"
              : "text-muted-foreground border-transparent hover:text-foreground"
          }`}
        >
          {tab === "members" ? "Team Members" : "Projects"}
        </button>
      ))}
    </div>
  );
}

function Toolbar({ scale, onScale }: { scale: Scale; onScale: (s: Scale) => void }) {
  return (
    <div className="bg-card border-b border-border px-4 py-2 flex items-center gap-2.5">
      <div className="flex items-center gap-1">
        <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="w-3.5 h-3.5" />
        </button>
        <span className="text-sm font-semibold px-1">2026</span>
        <button className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
      <button className="text-xs px-2.5 py-1 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">
        Today
      </button>
      <div className="flex bg-muted/40 rounded-md p-0.5 text-xs font-medium">
        {(["D", "W", "M"] as Scale[]).map((s) => (
          <button
            key={s}
            onClick={() => onScale(s)}
            className={`px-2.5 py-0.5 rounded transition-colors ${
              scale === s ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s}
          </button>
        ))}
      </div>
      <div className="flex-1" />
      <button className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded border border-primary text-primary hover:bg-primary/10 transition-colors">
        <Share2 className="w-3 h-3" />
        Share Feedback
      </button>
      <button className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
        <Settings className="w-4 h-4" />
      </button>
      <button className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">
        <BookOpen className="w-3 h-3" />
        Legend
      </button>
    </div>
  );
}

// ── Team Members View ─────────────────────────────────────────────────────────

function TeamMembersView({ expanded, toggle }: { expanded: Set<string>; toggle: (id: string) => void }) {
  const rows = buildTMRows(expanded);
  const totalW = WEEKS.length * WEEK_W;

  return (
    <div className="overflow-auto h-full">
      <div style={{ minWidth: TM_LEFT + totalW }}>

        {/* ── Column header ─────────────────────────────────────────── */}
        <div className="flex sticky top-0 z-20 border-b border-border bg-muted/40" style={{ height: HDR_H }}>
          <div
            className="sticky left-0 z-30 bg-muted/40 flex items-end pb-2 px-3 gap-0 border-r-2 border-border/60 flex-shrink-0"
            style={{ width: TM_LEFT }}
          >
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 200 }}>Team Member</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 148 }}>Role</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 76 }}>Actions</div>
          </div>
          <WeekHeaders />
        </div>

        {/* ── Rows ──────────────────────────────────────────────────── */}
        {rows.map((row, i) => {

          // ── Member row ──────────────────────────────────────────────
          if (row.kind === "member") {
            const m   = row.m;
            const exp = expanded.has(m.id);
            return (
              <div key={`m-${m.id}`} className="group flex border-b border-border/50" style={{ height: ROW_H }}>
                <div
                  className={`sticky left-0 z-10 flex items-center border-r-2 border-border/60 px-2 gap-0 flex-shrink-0 transition-colors bg-card group-hover:bg-muted/20 ${exp ? "!bg-muted/10 group-hover:!bg-muted/20" : ""}`}
                  style={{ width: TM_LEFT }}
                >
                  {/* Member col */}
                  <div className="flex items-center gap-1.5" style={{ width: 200 }}>
                    <button
                      onClick={() => toggle(m.id)}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5"
                    >
                      {exp
                        ? <ChevronDown  className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                      }
                    </button>
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${m.ac}`}>
                      {m.initials}
                    </div>
                    <span className="text-xs font-semibold truncate">{m.name}</span>
                  </div>
                  {/* Role col */}
                  <div className="text-xs text-muted-foreground truncate pr-3" style={{ width: 148 }}>{m.role}</div>
                  {/* Actions col */}
                  <div className="flex items-center gap-1" style={{ width: 76 }}>
                    <button className="w-5 h-5 rounded bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button className="w-5 h-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Right: util cells */}
                <div className={`flex items-stretch transition-colors group-hover:bg-muted/20 ${exp ? "!bg-muted/10 group-hover:!bg-muted/20" : ""}`} style={{ height: ROW_H }}>
                  {WEEKS.map((w, wi) => (
                    <UtilCell key={w.id} pct={m.util[wi] ?? 0} unavail={w.unavail} />
                  ))}
                </div>
              </div>
            );
          }

          // ── Nested sub-header ───────────────────────────────────────
          if (row.kind === "nested-hdr") {
            return (
              <div key={`nh-${row.mId}-${i}`} className="flex border-b border-border/50 bg-muted/30" style={{ height: NEST_H }}>
                <div
                  className="sticky left-0 z-10 bg-muted/30 flex items-center border-r-2 border-border/60 flex-shrink-0"
                  style={{ width: TM_LEFT }}
                >
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-3" style={{ width: 140 }}>Project</div>
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider"       style={{ width: 96  }}>Est. Hours</div>
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider"       style={{ width: 96  }}>Actual</div>
                  <div style={{ width: 92 }} />
                </div>
                {/* Right: empty week cells */}
                <div className="flex" style={{ height: NEST_H }}>
                  {WEEKS.map((w) => (
                    <div key={w.id} className={`border-r border-border/20 flex-shrink-0 ${w.unavail ? "bg-muted/15" : ""}`} style={{ width: WEEK_W }} />
                  ))}
                </div>
              </div>
            );
          }

          // ── Project row (nested under member) ──────────────────────
          if (row.kind === "proj-row") {
            const proj  = row.proj;
            const color = PC[proj.color];
            return (
              <div key={`pr-${row.mId}-${proj.id}-${i}`} className="group flex border-b border-border/30 hover:bg-muted/15 transition-colors" style={{ height: NEST_ROW }}>
                <div
                  className="sticky left-0 z-10 bg-card group-hover:bg-muted/15 flex items-center border-r-2 border-border/60 flex-shrink-0 transition-colors relative"
                  style={{ width: TM_LEFT }}
                >
                  {/* Accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${color.dot}`} />
                  {/* Project col */}
                  <div className="flex items-center gap-1.5 pl-4" style={{ width: 140 }}>
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 ${color.txt}`} />
                    <Folder className={`w-3 h-3 flex-shrink-0 ${color.txt}`} />
                    <Link
                      href={`/v2/${proj.id}`}
                      className={`text-[11px] font-medium truncate underline underline-offset-2 decoration-dotted ${color.txt} hover:opacity-80 transition-opacity`}
                    >
                      {proj.name}
                    </Link>
                  </div>
                  {/* Est. Hours */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 96 }}>
                    {proj.estH}h
                  </div>
                  {/* Actual */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 96 }}>
                    {proj.actualH != null ? `${proj.actualH}h` : "—"}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1" style={{ width: 92 }}>
                    <button className="w-5 h-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                    <button className="w-5 h-5 rounded bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Right: allocation bars */}
                <div className="relative flex-shrink-0" style={{ width: totalW, height: NEST_ROW }}>
                  <WeekGridLines height={NEST_ROW} />
                  {proj.bars.map((bar, bi) => {
                    const left  = bar.startW * WEEK_W + 3;
                    const width = (bar.endW - bar.startW + 1) * WEEK_W - 6;
                    return (
                      <div
                        key={bi}
                        className="absolute rounded flex items-center justify-center overflow-hidden cursor-default"
                        style={{
                          left, width, height: 22,
                          top: "50%", transform: "translateY(-50%)",
                          ...stripeStyle(proj.color),
                        }}
                        title={`${proj.name}: ${bar.pct}% allocation (${bar.label}/week)`}
                      >
                        <span className="text-[9px] font-semibold text-white/90 px-1.5 truncate pointer-events-none">
                          {bar.pct}% ({bar.label})
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

// ── Projects View ─────────────────────────────────────────────────────────────

function ProjectsView({ expanded, toggle }: { expanded: Set<string>; toggle: (id: string) => void }) {
  const rows   = buildPRRows(expanded);
  const totalW = WEEKS.length * WEEK_W;

  return (
    <div className="overflow-auto h-full">
      <div style={{ minWidth: PR_LEFT + totalW }}>

        {/* ── Column header ─────────────────────────────────────────── */}
        <div className="flex sticky top-0 z-20 border-b border-border bg-muted/40" style={{ height: HDR_H }}>
          <div
            className="sticky left-0 z-30 bg-muted/40 flex items-end pb-2 px-3 gap-0 border-r-2 border-border/60 flex-shrink-0"
            style={{ width: PR_LEFT }}
          >
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 196 }}>Project</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 96  }}>Status</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 82  }}>Budget</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 72  }}>Actions</div>
          </div>
          <WeekHeaders />
        </div>

        {/* ── Rows ──────────────────────────────────────────────────── */}
        {rows.map((row, i) => {

          // ── Project row ─────────────────────────────────────────────
          if (row.kind === "project") {
            const p   = row.p;
            const exp = expanded.has(p.id);
            return (
              <div key={`p-${p.id}`} className="group flex border-b border-border/50" style={{ height: ROW_H }}>
                <div
                  className={`sticky left-0 z-10 flex items-center border-r-2 border-border/60 px-2 flex-shrink-0 transition-colors bg-card group-hover:bg-muted/20 ${exp ? "!bg-muted/10 group-hover:!bg-muted/20" : ""}`}
                  style={{ width: PR_LEFT }}
                >
                  {/* Project col */}
                  <div className="flex items-center gap-1.5" style={{ width: 196 }}>
                    <button
                      onClick={() => toggle(p.id)}
                      className="text-muted-foreground hover:text-foreground flex-shrink-0 p-0.5"
                    >
                      {exp
                        ? <ChevronDown  className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />
                      }
                    </button>
                    <Folder className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="text-xs font-semibold truncate">{p.name}</span>
                    <span className="flex-shrink-0 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full leading-none">
                      {p.count}
                    </span>
                  </div>
                  {/* Status col */}
                  <div style={{ width: 96 }}>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_CLS[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  {/* Budget col */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 82 }}>
                    {p.budget}
                  </div>
                  {/* Actions col */}
                  <div className="flex items-center gap-1" style={{ width: 72 }}>
                    <button className="w-5 h-5 rounded bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button className="w-5 h-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Right: financial bar */}
                <div
                  className={`relative flex-shrink-0 transition-colors group-hover:bg-muted/20 ${exp ? "!bg-muted/10 group-hover:!bg-muted/20" : ""}`}
                  style={{ width: totalW, height: ROW_H }}
                >
                  <WeekGridLines height={ROW_H} />
                  <div
                    className="absolute flex items-center px-2 rounded overflow-hidden"
                    style={{
                      left:   p.barStart * WEEK_W + 4,
                      width:  (p.barEnd - p.barStart + 1) * WEEK_W - 8,
                      height: 20,
                      top: "50%", transform: "translateY(-50%)",
                      background: "hsl(var(--muted-foreground) / 0.12)",
                      border: "1px solid hsl(var(--border))",
                    }}
                  >
                    <span className="text-[10px] text-muted-foreground font-medium truncate">
                      Actual: {p.actualFees} · EAC: {p.eac}
                    </span>
                  </div>
                </div>
              </div>
            );
          }

          // ── Resource sub-row ────────────────────────────────────────
          if (row.kind === "resource") {
            const r = row.r;
            return (
              <div key={`r-${row.pId}-${r.id}-${i}`} className="group flex border-b border-border/30 bg-muted/10 hover:bg-muted/20 transition-colors" style={{ height: ROW_H }}>
                <div
                  className="sticky left-0 z-10 bg-inherit flex items-center border-r-2 border-border/60 px-2 flex-shrink-0"
                  style={{ width: PR_LEFT }}
                >
                  {/* Resource col (indented) */}
                  <div className="flex items-center gap-1.5 pl-8" style={{ width: 196 }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${r.ac}`}>
                      {r.initials}
                    </div>
                    <Link href="/v2" className="text-[11px] font-medium text-primary underline underline-offset-2 decoration-dotted hover:opacity-80 transition-opacity truncate">
                      {r.name}
                    </Link>
                  </div>
                  {/* Est. hours */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 96 }}>
                    Est: {r.estH}h
                  </div>
                  {/* Alloc hours */}
                  <div
                    className={`text-[11px] tabular-nums font-medium ${r.allocH > r.estH ? "text-destructive" : r.allocH > 0 ? "text-foreground" : "text-muted-foreground"}`}
                    style={{ width: 82 }}
                  >
                    {r.allocH > 0 ? `${r.allocH}h alloc` : "—"}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1" style={{ width: 72 }}>
                    <button className="w-5 h-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                    <button className="w-5 h-5 rounded bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Right: per-week util */}
                <div className="flex items-stretch" style={{ height: ROW_H }}>
                  {WEEKS.map((w, wi) => (
                    <UtilCell key={w.id} pct={r.util[wi] > 0 ? Math.round(r.util[wi] / 40 * 100) : 0} unavail={w.unavail} gray />
                  ))}
                </div>
              </div>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

// ── Legend Modal ──────────────────────────────────────────────────────────────

function LegendModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-end justify-end p-6" onClick={onClose}>
      <div
        className="bg-card border border-border rounded-xl p-5 shadow-2xl w-64 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-sm font-semibold">Legend</h3>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-primary font-semibold">32h</span> Normal allocation (≤100%)
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-destructive font-semibold">44h</span> Overloaded (&gt;100%)
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-muted-foreground/40 font-semibold">–</span> No allocation / holiday
          </div>
          <div className="space-y-1.5 pt-1 border-t border-border">
            <p className="text-muted-foreground font-medium mb-1">Project Colors</p>
            {(Object.entries(PC) as [PColor, typeof PC[PColor]][]).map(([key, c]) => (
              <div key={key} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-sm" style={{ background: c.bg, border: `1px solid ${c.bd}` }} />
                <span className={`capitalize ${c.txt}`}>{key}</span>
              </div>
            ))}
          </div>
        </div>
        <button onClick={onClose} className="w-full text-xs py-1.5 rounded border border-border hover:bg-muted transition-colors text-muted-foreground">
          Close
        </button>
      </div>
    </div>
  );
}

// ── ResourceCenter ────────────────────────────────────────────────────────────

export function ResourceCenter() {
  const [dark,       setDark]       = useState(true);
  const [activeTab,  setActiveTab]  = useState<"members" | "projects">("members");
  const [scale,      setScale]      = useState<Scale>("W");
  const [tmExpanded, setTmExpanded] = useState<Set<string>>(new Set());
  const [prExpanded, setPrExpanded] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(false);

  const toggleTm = (id: string) =>
    setTmExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const togglePr = (id: string) =>
    setPrExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className={`${dark ? "dark" : ""} flex flex-col h-screen bg-background text-foreground overflow-hidden`}>
      <BetaBanner />
      <AppHeader />
      <TabBar active={activeTab} onChange={setActiveTab} />
      <Toolbar
        scale={scale}
        onScale={setScale}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab === "members"
          ? <TeamMembersView expanded={tmExpanded} toggle={toggleTm} />
          : <ProjectsView    expanded={prExpanded} toggle={togglePr} />
        }
      </div>
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}
    </div>
  );
}
