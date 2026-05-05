"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { updateWeeklyAllocation } from "@/lib/actions";
import {
  Info, Search, HelpCircle, Bell, User,
  ChevronLeft, ChevronRight, ChevronDown, Settings, Share2,
  BookOpen, Folder, Plus, MoreHorizontal,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

type PColor = "violet" | "sky" | "pink" | "orange" | "teal" | "blue" | "emerald" | "amber";
type Scale  = "D" | "W" | "M";

export interface ResourceCenterWeek { id: string; iso: string; top: string; bot: string; unavail: boolean }

export interface ResourceCenterMemberProj {
  id: string; name: string; color: PColor;
  estH: number; actualH?: number; weeklyHours: number[];
}

export interface ResourceCenterMember {
  id: string; name: string; role: string; initials: string; avatarColor: string;
  util: number[]; // % per week (0–120+)
  projects: ResourceCenterMemberProj[];
}

export interface ResourceCenterResourceRow {
  id: string; name: string; initials: string; avatarColor: string;
  estH: number; allocH: number; util: number[];
}

export interface ResourceCenterProject {
  id: string; name: string; count: number;
  status: "Active" | "Pipeline" | "On Hold" | "Complete";
  budget: string; eac: string; actualFees: string;
  barStart: number; barEnd: number;
  resources: ResourceCenterResourceRow[];
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
  teal:    { bg: "hsl(172 68% 42% / 0.72)", bd: "hsl(172 68% 42% / 0.45)", txt: "text-teal-400",    dot: "bg-teal-500"    },
  blue:    { bg: "hsl(217 91% 60% / 0.72)", bd: "hsl(217 91% 60% / 0.45)", txt: "text-blue-400",    dot: "bg-blue-500"    },
  emerald: { bg: "hsl(152 69% 44% / 0.72)", bd: "hsl(152 69% 44% / 0.45)", txt: "text-emerald-400", dot: "bg-emerald-500" },
  amber:   { bg: "hsl(38 92% 50% / 0.72)",  bd: "hsl(38 92% 50% / 0.45)",  txt: "text-amber-400",   dot: "bg-amber-500"   },
};

function stripeStyle(color: PColor) {
  const c = PC[color];
  return {
    background: `repeating-linear-gradient(-45deg, transparent, transparent 4px, rgba(255,255,255,0.09) 4px, rgba(255,255,255,0.09) 8px), ${c.bg}`,
    border: `1px solid ${c.bd}`,
  };
}

const AVATAR_CLS: Record<string, string> = {
  violet:  "bg-violet-500/20 text-violet-400",
  sky:     "bg-sky-500/20 text-sky-400",
  orange:  "bg-orange-500/20 text-orange-400",
  teal:    "bg-teal-500/20 text-teal-400",
  emerald: "bg-emerald-500/20 text-emerald-400",
  rose:    "bg-rose-500/20 text-rose-400",
  amber:   "bg-amber-500/20 text-amber-400",
  pink:    "bg-pink-500/20 text-pink-400",
  blue:    "bg-blue-500/20 text-blue-400",
};

// ── Status badge styles (Projects tab) ────────────────────────────────────────

const STATUS_CLS: Record<ResourceCenterProject["status"], string> = {
  "Active":   "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  "Pipeline": "bg-primary/15 text-primary border-primary/30",
  "On Hold":  "bg-yellow-500/15 text-yellow-400 border-yellow-500/30",
  "Complete": "bg-muted text-muted-foreground border-border",
};

// ── Timeline bar styles per status ────────────────────────────────────────────

const STATUS_BAR: Record<ResourceCenterProject["status"], {
  bg: string; bd: string; accent: string; txt: string;
}> = {
  "Active":   { bg: "hsl(152 69% 44% / 0.10)", bd: "hsl(152 69% 44% / 0.28)", accent: "hsl(152 69% 44%)", txt: "hsl(152 60% 58%)" },
  "Pipeline": { bg: "hsl(217 91% 60% / 0.10)", bd: "hsl(217 91% 60% / 0.28)", accent: "hsl(217 91% 60%)", txt: "hsl(217 80% 68%)" },
  "On Hold":  { bg: "hsl(38  92% 50% / 0.10)", bd: "hsl(38  92% 50% / 0.28)", accent: "hsl(38  92% 50%)", txt: "hsl(38  82% 62%)" },
  "Complete": { bg: "hsl(0   0%  55% / 0.07)", bd: "hsl(0   0%  55% / 0.18)", accent: "hsl(0   0%  50%)", txt: "hsl(0   0%  62%)" },
};

// ── VRow types ────────────────────────────────────────────────────────────────

type TMVRow =
  | { kind: "member";     m: ResourceCenterMember }
  | { kind: "nested-hdr"; mId: string }
  | { kind: "proj-row";   mId: string; proj: ResourceCenterMemberProj };

type PRVRow =
  | { kind: "project";  p: ResourceCenterProject }
  | { kind: "resource"; pId: string; r: ResourceCenterResourceRow };

function buildTMRows(members: ResourceCenterMember[], expanded: Set<string>): TMVRow[] {
  const rows: TMVRow[] = [];
  for (const m of members) {
    rows.push({ kind: "member", m });
    if (expanded.has(m.id)) {
      rows.push({ kind: "nested-hdr", mId: m.id });
      for (const proj of m.projects) rows.push({ kind: "proj-row", mId: m.id, proj });
    }
  }
  return rows;
}

function buildPRRows(projects: ResourceCenterProject[], expanded: Set<string>): PRVRow[] {
  const rows: PRVRow[] = [];
  for (const p of projects) {
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
            {hours}
          </span>
      }
    </div>
  );
}

// ── Week header cells (shared) ────────────────────────────────────────────────

function WeekHeaders({ weeks }: { weeks: ResourceCenterWeek[] }) {
  return (
    <>
      {weeks.map((w) => (
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

function WeekGridLines({ weeks, height }: { weeks: ResourceCenterWeek[]; height: number }) {
  return (
    <>
      {weeks.map((w, wi) => (
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

function Toolbar({
  scale,
  onScale,
  onShowLegend,
}: {
  scale: Scale;
  onScale: (s: Scale) => void;
  onShowLegend: () => void;
}) {
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
      <button onClick={onShowLegend} className="flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded border border-border text-muted-foreground hover:bg-muted transition-colors">
        <BookOpen className="w-3 h-3" />
        Legend
      </button>
    </div>
  );
}

// ── EditableHourCell ──────────────────────────────────────────────────────────

function EditableHourCell({
  hours,
  unavail,
  color,
  memberCode,
  projectCode,
  weekIso,
  rowHeight,
  onOptimistic,
}: {
  hours: number;
  unavail: boolean;
  color: PColor;
  memberCode: string;
  projectCode: string;
  weekIso: string;
  rowHeight: number;
  onOptimistic: (key: string, hours: number) => void;
}) {
  const [editing, setEditing]   = useState(false);
  const [draft,   setDraft]     = useState("");
  const [saving,  setSaving]    = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) { inputRef.current?.focus(); inputRef.current?.select(); }
  }, [editing]);

  const startEdit = () => {
    setDraft(hours > 0 ? String(hours) : "");
    setEditing(true);
  };

  const commit = useCallback(async () => {
    const next = draft === "" ? 0 : Number(draft);
    setEditing(false);
    if (Number.isNaN(next) || next < 0 || next === hours) return;
    const key = `${memberCode}:${projectCode}:${weekIso}`;
    onOptimistic(key, next);
    setSaving(true);
    const result = await updateWeeklyAllocation(memberCode, projectCode, weekIso, next);
    setSaving(false);
    if (!result.ok) onOptimistic(key, hours);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft, hours, memberCode, projectCode, weekIso, onOptimistic]);

  if (editing) {
    return (
      <div
        className={`relative flex items-center justify-center border-r border-primary/60 flex-shrink-0 bg-primary/5 ring-1 ring-inset ring-primary/30 ${unavail ? "bg-primary/10" : ""}`}
        style={{ width: WEEK_W, height: rowHeight }}
      >
        <input
          ref={inputRef}
          type="number"
          min="0"
          step="1"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); void commit(); }
            if (e.key === "Escape") setEditing(false);
          }}
          onBlur={() => void commit()}
          className="w-14 rounded border border-primary/60 bg-background px-1.5 py-0.5 text-center text-xs font-semibold outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={startEdit}
      className={`group/cell flex items-center justify-center border-r border-border/20 flex-shrink-0 transition-colors hover:bg-primary/5 hover:border-r-primary/20 cursor-text ${unavail ? "bg-muted/15" : ""} ${saving ? "opacity-50 pointer-events-none" : ""}`}
      style={{ width: WEEK_W, height: rowHeight }}
      title={hours > 0 ? `${hours}h — click to edit` : "Click to set hours"}
    >
      {hours > 0 ? (
        <div
          className="min-w-8 px-2 py-1 rounded text-[10px] font-semibold text-white/90 text-center group-hover/cell:opacity-75 transition-opacity"
          style={stripeStyle(color)}
        >
          {hours}
        </div>
      ) : (
        <span className="text-[11px] text-muted-foreground/30 group-hover/cell:text-muted-foreground/50 transition-colors">–</span>
      )}
    </button>
  );
}

// ── Team Members View ─────────────────────────────────────────────────────────

function TeamMembersView({
  weeks,
  members,
  expanded,
  toggle,
  onOptimistic,
}: {
  weeks: ResourceCenterWeek[];
  members: ResourceCenterMember[];
  expanded: Set<string>;
  toggle: (id: string) => void;
  onOptimistic: (key: string, hours: number) => void;
}) {
  const rows = buildTMRows(members, expanded);
  const totalW = weeks.length * WEEK_W;

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
          <WeekHeaders weeks={weeks} />
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
                    <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0 ${AVATAR_CLS[m.avatarColor] ?? "bg-muted text-muted-foreground"}`}>
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
                  {weeks.map((w, wi) => (
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
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider px-3" style={{ width: 228 }}>Project</div>
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider"       style={{ width: 64  }}>Est.h</div>
                  <div className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wider"       style={{ width: 60  }}>Actual</div>
                  <div style={{ width: 72 }} />
                </div>
                {/* Right: empty week cells */}
                <div className="flex" style={{ height: NEST_H }}>
                  {weeks.map((w) => (
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
                  <div className="flex items-center gap-1.5 pl-4" style={{ width: 228 }}>
                    <ChevronRight className={`w-3 h-3 flex-shrink-0 ${color.txt}`} />
                    <Folder className={`w-3 h-3 flex-shrink-0 ${color.txt}`} />
                    <Link
                      href={`/v2/${proj.id}`}
                      className={`text-xs font-medium underline underline-offset-2 decoration-dotted ${color.txt} hover:opacity-80 transition-opacity`}
                    >
                      {proj.name}
                    </Link>
                  </div>
                  {/* Est. Hours */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 64 }}>
                    {proj.estH}h
                  </div>
                  {/* Actual */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 60 }}>
                    {proj.actualH != null ? `${proj.actualH}h` : "—"}
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
                {/* Right: allocation hours by week — inline-editable */}
                <div className="flex items-stretch flex-shrink-0" style={{ width: totalW, height: NEST_ROW }}>
                  {weeks.map((w, wi) => (
                    <EditableHourCell
                      key={w.id}
                      hours={proj.weeklyHours[wi] ?? 0}
                      unavail={w.unavail}
                      color={proj.color}
                      memberCode={row.mId}
                      projectCode={proj.id}
                      weekIso={w.iso}
                      rowHeight={NEST_ROW}
                      onOptimistic={onOptimistic}
                    />
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

// ── Projects View ─────────────────────────────────────────────────────────────

function ProjectsView({
  weeks,
  projects,
  expanded,
  toggle,
}: {
  weeks: ResourceCenterWeek[];
  projects: ResourceCenterProject[];
  expanded: Set<string>;
  toggle: (id: string) => void;
}) {
  const rows   = buildPRRows(projects, expanded);
  const totalW = weeks.length * WEEK_W;

  return (
    <div className="overflow-auto h-full">
      <div style={{ minWidth: PR_LEFT + totalW }}>

        {/* ── Column header ─────────────────────────────────────────── */}
        <div className="flex sticky top-0 z-20 border-b border-border bg-muted/40" style={{ height: HDR_H }}>
          <div
            className="sticky left-0 z-30 bg-muted/40 flex items-end pb-2 px-3 gap-0 border-r-2 border-border/60 flex-shrink-0"
            style={{ width: PR_LEFT }}
          >
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 260 }}>Project</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 84  }}>Status</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 56  }}>Budget</div>
            <div className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide" style={{ width: 46  }}>Actions</div>
          </div>
          <WeekHeaders weeks={weeks} />
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
                  <div className="flex items-center gap-1.5" style={{ width: 260 }}>
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
                    <span className="text-xs font-semibold">{p.name}</span>
                    <span className="flex-shrink-0 text-[9px] font-bold bg-primary text-primary-foreground px-1.5 py-0.5 rounded-full leading-none">
                      {p.count}
                    </span>
                  </div>
                  {/* Status col */}
                  <div style={{ width: 84 }}>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${STATUS_CLS[p.status]}`}>
                      {p.status}
                    </span>
                  </div>
                  {/* Budget col */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 56 }}>
                    {p.budget}
                  </div>
                  {/* Actions col */}
                  <div className="flex items-center gap-1" style={{ width: 46 }}>
                    <button className="w-5 h-5 rounded bg-primary/15 text-primary hover:bg-primary/25 flex items-center justify-center transition-colors">
                      <Plus className="w-3 h-3" />
                    </button>
                    <button className="w-5 h-5 rounded text-muted-foreground hover:bg-muted flex items-center justify-center transition-colors">
                      <MoreHorizontal className="w-3 h-3" />
                    </button>
                  </div>
                </div>
                {/* Right: project timeline bar */}
                <div
                  className={`relative flex-shrink-0 transition-colors ${exp ? "bg-muted/10 group-hover:bg-muted/15" : "group-hover:bg-muted/10"}`}
                  style={{ width: totalW, height: ROW_H }}
                >
                  <WeekGridLines weeks={weeks} height={ROW_H} />
                  {p.barEnd >= p.barStart && (
                    <div
                      className="absolute flex items-center overflow-hidden rounded-md pointer-events-none"
                      style={{
                        left:   p.barStart * WEEK_W + 3,
                        width:  (p.barEnd - p.barStart + 1) * WEEK_W - 6,
                        top: 5, bottom: 5,
                        background: STATUS_BAR[p.status].bg,
                        border:     `1px solid ${STATUS_BAR[p.status].bd}`,
                      }}
                    >
                      {/* Left accent stripe */}
                      <div
                        className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-sm flex-shrink-0"
                        style={{ background: STATUS_BAR[p.status].accent }}
                      />
                      {/* Actual fees label */}
                      <div className="pl-3.5 pr-2 flex flex-col justify-center gap-px flex-shrink-0 min-w-0">
                        <span className="text-[8.5px] leading-none text-muted-foreground/60 uppercase tracking-wide">Actual</span>
                        <span className="text-[10px] font-semibold leading-none tabular-nums" style={{ color: STATUS_BAR[p.status].txt }}>
                          {p.actualFees}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0" />
                      {/* EAC label */}
                      <div className="px-2.5 flex flex-col justify-center gap-px items-end flex-shrink-0 min-w-0">
                        <span className="text-[8.5px] leading-none text-muted-foreground/60 uppercase tracking-wide">EAC</span>
                        <span className="text-[10px] font-medium leading-none tabular-nums text-muted-foreground">
                          {p.eac}
                        </span>
                      </div>
                    </div>
                  )}
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
                  <div className="flex items-center gap-1.5 pl-8" style={{ width: 260 }}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold flex-shrink-0 ${AVATAR_CLS[r.avatarColor] ?? "bg-muted text-muted-foreground"}`}>
                      {r.initials}
                    </div>
                    <Link href="/v2" className="text-xs font-medium text-primary underline underline-offset-2 decoration-dotted hover:opacity-80 transition-opacity">
                      {r.name}
                    </Link>
                  </div>
                  {/* Est. hours */}
                  <div className="text-[11px] text-muted-foreground tabular-nums" style={{ width: 84 }}>
                    Est: {r.estH}h
                  </div>
                  {/* Alloc hours */}
                  <div
                    className={`text-[11px] tabular-nums font-medium ${r.allocH > r.estH ? "text-destructive" : r.allocH > 0 ? "text-foreground" : "text-muted-foreground"}`}
                    style={{ width: 56 }}
                  >
                    {r.allocH > 0 ? `${r.allocH}h` : "—"}
                  </div>
                  {/* Actions */}
                  <div className="flex items-center gap-1" style={{ width: 46 }}>
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
                  {weeks.map((w, wi) => (
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
            <span className="text-primary font-semibold">32</span> Normal allocation (≤100%)
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <span className="text-destructive font-semibold">44</span> Overloaded (&gt;100%)
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

export function ResourceCenter({
  weeks,
  members,
  projects,
}: {
  weeks: ResourceCenterWeek[];
  members: ResourceCenterMember[];
  projects: ResourceCenterProject[];
}) {
  const dark = true;
  const [activeTab,  setActiveTab]  = useState<"members" | "projects">("members");
  const [scale,      setScale]      = useState<Scale>("W");
  const [tmExpanded, setTmExpanded] = useState<Set<string>>(new Set());
  const [prExpanded, setPrExpanded] = useState<Set<string>>(new Set());
  const [showLegend, setShowLegend] = useState(false);
  const [overrides, setOverrides] = useState<Record<string, number>>({});

  const membersView = useMemo(() => members.map((member) => {
    const projectsForMember = member.projects.map((project) => ({
      ...project,
      weeklyHours: project.weeklyHours.map((hours, index) => overrides[`${member.id}:${project.id}:${weeks[index]?.iso}`] ?? hours),
    }));
    const util = weeks.map((_, index) => {
      const totalHours = projectsForMember.reduce((sum, project) => sum + (project.weeklyHours[index] ?? 0), 0);
      return Math.round((totalHours / 40) * 1000) / 10;
    });
    return {
      ...member,
      projects: projectsForMember,
      util,
    };
  }), [members, overrides, weeks]);

  const projectsView = useMemo(() => projects.map((project) => ({
    ...project,
    resources: project.resources.map((resource) => ({
      ...resource,
      util: resource.util.map((hours, index) => {
        const override = overrides[`${resource.id}:${project.id}:${weeks[index]?.iso}`];
        return override ?? hours;
      }),
    })),
  })), [projects, overrides, weeks]);

  const toggleTm = (id: string) =>
    setTmExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const togglePr = (id: string) =>
    setPrExpanded((prev) => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  const handleOptimistic = useCallback((key: string, hours: number) => {
    setOverrides((prev) => ({ ...prev, [key]: hours }));
  }, []);

  return (
    <div className={`${dark ? "dark" : ""} flex flex-col h-screen bg-background text-foreground overflow-hidden`}>
      <BetaBanner />
      <AppHeader />
      <TabBar active={activeTab} onChange={setActiveTab} />
      <Toolbar
        scale={scale}
        onScale={setScale}
        onShowLegend={() => setShowLegend(true)}
      />
      <div className="flex-1 overflow-hidden">
        {activeTab === "members"
          ? <TeamMembersView weeks={weeks} members={membersView} expanded={tmExpanded} toggle={toggleTm} onOptimistic={handleOptimistic} />
          : <ProjectsView weeks={weeks} projects={projectsView} expanded={prExpanded} toggle={togglePr} />
        }
      </div>
      {showLegend && <LegendModal onClose={() => setShowLegend(false)} />}
    </div>
  );
}
