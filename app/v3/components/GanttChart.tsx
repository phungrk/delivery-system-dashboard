import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Project, WATERFALL_PHASES, SPRINT_PHASES, PhaseStatus, ProjectStatus } from '@/data/mockData';
import { ChevronDown, ChevronRight, GitBranch } from 'lucide-react';

// ── Constants ─────────────────────────────────────────────────────────────────
const MONTH_WIDTH  = 96;  // px per month
const ROW_H        = 38;  // project row height
const PHASE_ROW_H  = 28;  // phase/sprint row height
const LEFT_W       = 224; // left name column width

// ── Date helpers ──────────────────────────────────────────────────────────────
const toDate = (s: string) => new Date(s + 'T00:00:00');
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1);
const addMonths = (d: Date, n: number) => { const r = new Date(d); r.setMonth(r.getMonth() + n); return r; };
const diffMonths = (a: Date, b: Date) => (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth();

function barLeft(dateStr: string, minMs: number, totalMs: number, tw: number) {
  return Math.max(0, ((toDate(dateStr).getTime() - minMs) / totalMs) * tw);
}
function barWidth(s: string, e: string, minMs: number, totalMs: number, tw: number) {
  const l = Math.max(0, toDate(s).getTime() - minMs);
  const r = Math.min(totalMs, toDate(e).getTime() - minMs);
  return Math.max(4, ((r - l) / totalMs) * tw);
}

// ── Color maps ────────────────────────────────────────────────────────────────
const projectBarCls: Record<ProjectStatus, string> = {
  'On Track':  'bg-primary',
  'At Risk':   'bg-yellow-500',
  'Delayed':   'bg-destructive',
  'Completed': 'bg-emerald-500',
};

const phaseOuterCls: Record<PhaseStatus, string> = {
  'Completed': 'bg-emerald-500/20 border border-emerald-500/40',
  'On Track':  'bg-primary/20 border border-primary/40',
  'At Risk':   'bg-yellow-500/20 border border-yellow-500/40',
  'Delayed':   'bg-destructive/20 border border-destructive/40',
  'To Do':     'bg-muted/30 border border-dashed border-border/50',
};
const phaseFillCls: Record<PhaseStatus, string> = {
  'Completed': 'bg-emerald-500',
  'On Track':  'bg-primary',
  'At Risk':   'bg-yellow-500',
  'Delayed':   'bg-destructive',
  'To Do':     '',
};
const phaseDotCls: Record<PhaseStatus, string> = {
  'Completed': 'bg-emerald-500',
  'On Track':  'bg-primary',
  'At Risk':   'bg-yellow-500',
  'Delayed':   'bg-destructive',
  'To Do':     'bg-muted-foreground/30',
};
const phaseTextCls: Record<PhaseStatus, string> = {
  'Completed': 'text-emerald-400',
  'On Track':  'text-primary',
  'At Risk':   'text-yellow-400',
  'Delayed':   'text-destructive',
  'To Do':     'text-muted-foreground/50',
};

// ── GridLines & Today ─────────────────────────────────────────────────────────
function GridLines({ months, todayX, tw }: { months: Date[]; todayX: number; tw: number }) {
  return (
    <>
      {months.map((_, i) => (
        <div key={i} style={{ left: i * MONTH_WIDTH }} className="absolute inset-y-0 w-px bg-border/20" />
      ))}
      {todayX > 0 && todayX < tw && (
        <div style={{ left: todayX }} className="absolute inset-y-0 w-px bg-primary/50 z-10" />
      )}
    </>
  );
}

// ── Phase sub-row ─────────────────────────────────────────────────────────────
function PhaseRow({ phaseName, phase, months, todayX, minMs, totalMs, tw }: {
  phaseName: string;
  phase: { startDate: string; endDate: string; progress: number; status: PhaseStatus } | undefined;
  months: Date[];
  todayX: number;
  minMs: number;
  totalMs: number;
  tw: number;
}) {
  const status = phase?.status ?? 'To Do';
  return (
    <div style={{ height: PHASE_ROW_H }} className="flex items-center border-t border-border/30 hover:bg-muted/20 transition-colors">
      {/* Name */}
      <div style={{ width: LEFT_W, minWidth: LEFT_W }} className="flex-shrink-0 flex items-center gap-2 px-3 h-full border-r border-border/30">
        <span className="w-5 flex-shrink-0" />
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${phaseDotCls[status]}`} />
        <span className={`text-[10px] font-medium truncate ${phaseTextCls[status]}`}>{phaseName}</span>
      </div>
      {/* Bar */}
      <div style={{ width: tw }} className="relative flex-shrink-0 h-full">
        <GridLines months={months} todayX={todayX} tw={tw} />
        {phase && (
          <div
            style={{
              left:   barLeft(phase.startDate, minMs, totalMs, tw),
              width:  barWidth(phase.startDate, phase.endDate, minMs, totalMs, tw),
              top: '50%', transform: 'translateY(-50%)', height: 14,
            }}
            className={`absolute rounded overflow-hidden ${phaseOuterCls[status]}`}
            title={`${phaseName}: ${phase.startDate} → ${phase.endDate}  ${phase.progress}%`}
          >
            {phase.progress > 0 && status !== 'To Do' && (
              <div style={{ width: `${phase.progress}%` }} className={`h-full ${phaseFillCls[status]}`} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sprint sub-row (with phase segments) ─────────────────────────────────────
const PHASE_SEG_COLOR: Record<string, string> = {
  'Completed': 'bg-emerald-500',
  'On Track':  'bg-primary',
  'At Risk':   'bg-yellow-500',
  'Delayed':   'bg-destructive',
  'To Do':     'bg-muted/40',
};

function SprintRow({ sprint, months, todayX, minMs, totalMs, tw }: {
  sprint: { number: number; startDate: string; endDate: string; goal: string; status: string; storyPointsDone: number; storyPointsTotal: number; phases?: { name: string; status: string }[] };
  months: Date[];
  todayX: number;
  minMs: number;
  totalMs: number;
  tw: number;
}) {
  const dotCls = sprint.status === 'Completed' ? 'bg-emerald-500' : sprint.status === 'Active' ? 'bg-primary animate-pulse' : 'bg-muted-foreground/30';
  const sprintLeft  = barLeft(sprint.startDate, minMs, totalMs, tw);
  const sprintWidth = barWidth(sprint.startDate, sprint.endDate, minMs, totalMs, tw);
  const segW = sprintWidth / SPRINT_PHASES.length;

  // resolve effective phases
  const effectivePhases = SPRINT_PHASES.map(name => {
    if (sprint.phases) return sprint.phases.find(p => p.name === name)?.status ?? 'To Do';
    return sprint.status === 'Completed' ? 'Completed' : 'To Do';
  });

  return (
    <div style={{ height: PHASE_ROW_H }} className="flex items-center border-t border-border/30 hover:bg-muted/20 transition-colors">
      <div style={{ width: LEFT_W, minWidth: LEFT_W }} className="flex-shrink-0 flex items-center gap-2 px-3 h-full border-r border-border/30">
        <span className="w-5 flex-shrink-0" />
        <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${dotCls}`} />
        <span className="text-[10px] font-medium text-muted-foreground truncate">Sprint {sprint.number}</span>
      </div>
      <div style={{ width: tw }} className="relative flex-shrink-0 h-full">
        <GridLines months={months} todayX={todayX} tw={tw} />
        {/* Phase segments within sprint bar */}
        {effectivePhases.map((phStatus, idx) => (
          <div
            key={idx}
            style={{
              left: sprintLeft + idx * segW,
              width: Math.max(segW - 1, 1),
              top: '50%', transform: 'translateY(-50%)', height: 14,
            }}
            className={`absolute rounded-sm ${PHASE_SEG_COLOR[phStatus] ?? 'bg-muted/40'} opacity-80`}
            title={`${SPRINT_PHASES[idx]}: ${phStatus}`}
          />
        ))}
        {/* Outer border overlay */}
        <div
          style={{ left: sprintLeft, width: sprintWidth, top: '50%', transform: 'translateY(-50%)', height: 14 }}
          className="absolute rounded border border-border/30 pointer-events-none"
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function GanttChart({ projects }: { projects: Project[] }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(projects.map(p => p.id))
  );

  // Compute date range
  const { minMs, totalMs, months, tw, todayX } = useMemo(() => {
    const allDates: string[] = [];
    for (const p of projects) {
      allDates.push(p.startDate, p.endDate);
      p.phases?.forEach(ph => allDates.push(ph.startDate, ph.endDate));
      p.sprintHistory?.forEach(s => allDates.push(s.startDate, s.endDate));
      if (p.currentSprint) allDates.push(p.currentSprint.startDate, p.currentSprint.endDate);
    }
    const times = allDates.map(d => toDate(d).getTime());
    const rawMin = new Date(Math.min(...times));
    const rawMax = new Date(Math.max(...times));
    const minDate = addMonths(startOfMonth(rawMin), -1);
    const maxDate = addMonths(startOfMonth(rawMax), 2);
    const minMs   = minDate.getTime();
    const totalMs = maxDate.getTime() - minMs;
    const numMonths = diffMonths(minDate, maxDate);
    const tw = Math.max(numMonths * MONTH_WIDTH, 600);

    const months: Date[] = [];
    let cur = new Date(minDate);
    while (cur < maxDate) { months.push(new Date(cur)); cur = addMonths(cur, 1); }

    const todayMs = Date.now() - minMs;
    const todayX  = (todayMs / totalMs) * tw;

    return { minMs, totalMs, months, tw, todayX };
  }, [projects]);

  const toggle = (id: string) =>
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });

  return (
    <div className="border border-border rounded-xl overflow-hidden bg-card">
      <div className="overflow-x-auto">
        <div style={{ minWidth: LEFT_W + tw }}>

          {/* ── Header: month labels ── */}
          <div className="flex border-b border-border bg-muted/40 sticky top-0 z-20">
            <div style={{ width: LEFT_W, minWidth: LEFT_W }} className="flex-shrink-0 px-4 py-2 text-xs font-semibold text-muted-foreground border-r border-border">
              Project / Phase
            </div>
            <div style={{ width: tw }} className="relative flex-shrink-0 h-9">
              {months.map((month, i) => (
                <div
                  key={i}
                  style={{ left: i * MONTH_WIDTH, width: MONTH_WIDTH }}
                  className="absolute inset-y-0 flex items-center px-2 text-[10px] text-muted-foreground font-medium border-r border-border/30"
                >
                  {month.toLocaleDateString('en', { month: 'short', year: '2-digit' })}
                </div>
              ))}
              {/* today label */}
              {todayX > 0 && todayX < tw && (
                <div style={{ left: todayX - 1 }} className="absolute inset-y-0 w-px bg-primary/50 z-10">
                  <span className="absolute -top-0 left-1 text-[9px] font-bold text-primary whitespace-nowrap">Today</span>
                </div>
              )}
            </div>
          </div>

          {/* ── Project rows ── */}
          {projects.map((project, pIdx) => {
            const isExp = expanded.has(project.id);
            const sprints = [
              ...(project.sprintHistory ?? []),
              ...(project.currentSprint ? [project.currentSprint] : []),
            ];

            return (
              <div key={project.id} className={pIdx > 0 ? 'border-t border-border' : ''}>

                {/* Project header row */}
                <div style={{ height: ROW_H }} className="flex items-center hover:bg-muted/20 transition-colors">
                  {/* Left name */}
                  <div
                    style={{ width: LEFT_W, minWidth: LEFT_W }}
                    className="flex-shrink-0 flex items-center gap-2 px-3 h-full border-r border-border cursor-pointer"
                    onClick={() => toggle(project.id)}
                  >
                    <button className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
                      {isExp
                        ? <ChevronDown className="w-3.5 h-3.5" />
                        : <ChevronRight className="w-3.5 h-3.5" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p
                        className="text-xs font-semibold truncate hover:text-primary transition-colors cursor-pointer"
                        onClick={e => { e.stopPropagation(); navigate(`/projects/${project.id}`); }}
                      >
                        {project.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        {project.type === 'scrum'
                          ? <GitBranch className="w-2.5 h-2.5 text-sky-400" />
                          : null}
                        {project.client}
                      </p>
                    </div>
                  </div>

                  {/* Right: project bar */}
                  <div style={{ width: tw }} className="relative flex-shrink-0 h-full">
                    <GridLines months={months} todayX={todayX} tw={tw} />
                    {/* progress fill behind full bar */}
                    <div
                      style={{
                        left: barLeft(project.startDate, minMs, totalMs, tw),
                        width: barWidth(project.startDate, project.endDate, minMs, totalMs, tw),
                        top: '50%', transform: 'translateY(-50%)', height: 20,
                      }}
                      className="absolute rounded-md bg-muted/40 border border-border/50 overflow-hidden"
                    >
                      <div
                        style={{ width: `${project.progress}%` }}
                        className={`h-full opacity-80 ${projectBarCls[project.status]}`}
                      />
                    </div>
                    {/* label on top */}
                    <div
                      style={{
                        left: barLeft(project.startDate, minMs, totalMs, tw) + 6,
                        top: '50%', transform: 'translateY(-50%)',
                      }}
                      className="absolute z-10 text-[10px] font-semibold text-foreground/80 pointer-events-none"
                    >
                      {project.progress}%
                    </div>
                  </div>
                </div>

                {/* ── Waterfall phase rows ── */}
                {isExp && project.type === 'waterfall' && (
                  <div className="bg-muted/5">
                    {WATERFALL_PHASES.map(phaseName => {
                      const phase = project.phases?.find(ph => ph.name === phaseName);
                      return (
                        <PhaseRow
                          key={phaseName}
                          phaseName={phaseName}
                          phase={phase}
                          months={months}
                          todayX={todayX}
                          minMs={minMs}
                          totalMs={totalMs}
                          tw={tw}
                        />
                      );
                    })}
                  </div>
                )}

                {/* ── Scrum sprint rows ── */}
                {isExp && project.type === 'scrum' && sprints.length > 0 && (
                  <div className="bg-muted/5">
                    {sprints.map(sprint => (
                      <SprintRow
                        key={sprint.number}
                        sprint={sprint}
                        months={months}
                        todayX={todayX}
                        minMs={minMs}
                        totalMs={totalMs}
                        tw={tw}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 px-4 py-2 border-t border-border bg-muted/20 flex-wrap">
        <span className="text-[10px] font-semibold text-muted-foreground">Legend:</span>
        {([
          ['bg-primary', 'On Track'],
          ['bg-yellow-500', 'At Risk'],
          ['bg-destructive', 'Delayed'],
          ['bg-emerald-500', 'Completed'],
          ['bg-muted border border-dashed border-border', 'To Do'],
        ] as const).map(([cls, label]) => (
          <span key={label} className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <span className={`inline-block w-3 h-2.5 rounded-sm ${cls}`} />{label}
          </span>
        ))}
        <span className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="inline-block w-px h-3 bg-primary/50" />Today
        </span>
      </div>
    </div>
  );
}
