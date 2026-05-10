import { useState, useMemo } from 'react';
import {
  resources, projects, scheduleData, SCHEDULE_WEEKS,
  Resource, Project,
} from '@/data/mockData';
import { ChevronDown, ChevronRight, Users, FolderKanban } from 'lucide-react';
import { cn } from '@/lib/utils';

type Mode = 'people' | 'project';

const CELL_W = 64;
const LEFT_W = 220;
const MAX_H = 40; // standard weekly hours cap

function hoursColor(h: number, isTotal: boolean) {
  if (!isTotal || h === 0) return '';
  if (h > MAX_H) return 'bg-destructive/15 text-destructive font-semibold';
  if (h >= 35) return 'bg-yellow-500/10 text-yellow-400 font-semibold';
  if (h >= 20) return 'text-foreground';
  if (h > 0) return 'text-primary font-medium';
  return 'text-muted-foreground/40';
}

const PROJECT_COLORS: Record<string, string> = {
  p1: 'bg-violet-500/20 text-violet-300',
  p2: 'bg-sky-500/20 text-sky-300',
  p3: 'bg-blue-500/20 text-blue-300',
  p4: 'bg-orange-500/20 text-orange-300',
  p5: 'bg-emerald-500/20 text-emerald-300',
  p6: 'bg-pink-500/20 text-pink-300',
};

const PROJECT_DOT: Record<string, string> = {
  p1: 'bg-violet-400',
  p2: 'bg-sky-400',
  p3: 'bg-blue-400',
  p4: 'bg-orange-400',
  p5: 'bg-emerald-400',
  p6: 'bg-pink-400',
};

// ── Week Header ───────────────────────────────────────────────────────────────

function WeekHeader() {
  return (
    <div className="flex" style={{ minWidth: LEFT_W + CELL_W * SCHEDULE_WEEKS.length }}>
      <div
        className="flex-shrink-0 flex items-end px-4 pb-2 border-b border-r border-border bg-card z-10"
        style={{ width: LEFT_W, position: 'sticky', left: 0 }}
      >
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Resource / Project</span>
      </div>
      {SCHEDULE_WEEKS.map((w) => (
        <div
          key={w.key}
          style={{ width: CELL_W, minWidth: CELL_W }}
          className="flex-shrink-0 flex flex-col items-center justify-end pb-1.5 border-b border-r border-border/50 last:border-r-0"
        >
          <span className="text-[10px] font-bold text-foreground">{w.label}</span>
          <span className="text-[9px] text-muted-foreground">{w.date}</span>
          <span
            className={cn(
              'text-[8px] px-1 rounded mt-0.5 font-medium',
              w.isForecast
                ? 'bg-primary/10 text-primary/70'
                : 'bg-muted text-muted-foreground',
            )}
          >
            {w.isForecast ? 'FORE' : 'ACT'}
          </span>
        </div>
      ))}
    </div>
  );
}

// ── Cell ──────────────────────────────────────────────────────────────────────

function Cell({
  value, isForecast, isTotal, isEmpty,
}: {
  value: number; isForecast: boolean; isTotal: boolean; isEmpty?: boolean;
}) {
  if (isEmpty || value === 0) {
    return (
      <div
        style={{ width: CELL_W, minWidth: CELL_W }}
        className="flex-shrink-0 flex items-center justify-center border-r border-border/30 last:border-r-0 h-9"
      >
        <span className="text-[10px] text-muted-foreground/25">–</span>
      </div>
    );
  }
  return (
    <div
      style={{ width: CELL_W, minWidth: CELL_W }}
      className={cn(
        'flex-shrink-0 flex items-center justify-center border-r border-border/30 last:border-r-0 h-9',
        isForecast ? 'opacity-80' : '',
      )}
    >
      <span
        className={cn(
          'text-xs tabular-nums rounded px-1',
          isTotal ? hoursColor(value, true) : 'text-muted-foreground',
          isForecast && isTotal ? 'opacity-90' : '',
        )}
      >
        {value}
        {isForecast && isTotal && (
          <span className="text-[8px] opacity-60 ml-0.5">f</span>
        )}
      </span>
    </div>
  );
}

// ── People Schedule ───────────────────────────────────────────────────────────

function PeopleSchedule() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['r1', 'r2']));

  const rows = useMemo(() => {
    return resources.map((person) => {
      const personEntries = scheduleData.filter((s) => s.personId === person.id);
      const projectRows = personEntries.map((entry) => {
        const proj = projects.find((p) => p.id === entry.projectId);
        return { proj, hours: entry.hours };
      }).filter((r) => r.proj);

      const totalHours = SCHEDULE_WEEKS.map((_, wi) =>
        personEntries.reduce((sum, e) => sum + (e.hours[wi] ?? 0), 0),
      );
      return { person, projectRows, totalHours };
    });
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      {rows.map(({ person, projectRows, totalHours }) => {
        const isOpen = expanded.has(person.id);
        return (
          <div key={person.id}>
            {/* Person row */}
            <button
              className="flex w-full hover:bg-muted/30 transition-colors border-b border-border/40 group"
              style={{ minWidth: LEFT_W + CELL_W * SCHEDULE_WEEKS.length }}
              onClick={() => toggle(person.id)}
            >
              <div
                className="flex-shrink-0 flex items-center gap-2 px-3 h-9 border-r border-border/50 bg-card"
                style={{ width: LEFT_W, position: 'sticky', left: 0 }}
              >
                <span className="text-muted-foreground/50 w-3 flex-shrink-0">
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                  <span className="text-[9px] font-bold text-muted-foreground">
                    {person.name.split(' ').map((n) => n[0]).join('')}
                  </span>
                </div>
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {person.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate">{person.role}</div>
                </div>
              </div>
              {SCHEDULE_WEEKS.map((w, wi) => (
                <Cell key={w.key} value={totalHours[wi]} isForecast={w.isForecast} isTotal />
              ))}
            </button>

            {/* Project sub-rows */}
            {isOpen && projectRows.map(({ proj, hours }) => (
              <div
                key={proj!.id}
                className="flex border-b border-border/20 hover:bg-muted/10 transition-colors"
                style={{ minWidth: LEFT_W + CELL_W * SCHEDULE_WEEKS.length }}
              >
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-3 pl-10 h-9 border-r border-border/30 bg-card/80"
                  style={{ width: LEFT_W, position: 'sticky', left: 0 }}
                >
                  <div className={cn('w-2 h-2 rounded-full flex-shrink-0', PROJECT_DOT[proj!.id] ?? 'bg-muted')} />
                  <span className="text-[10px] text-muted-foreground truncate">{proj!.name}</span>
                </div>
                {SCHEDULE_WEEKS.map((w, wi) => (
                  <Cell key={w.key} value={hours[wi] ?? 0} isForecast={w.isForecast} isTotal={false} isEmpty={!hours[wi]} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Project Schedule ──────────────────────────────────────────────────────────

function ProjectSchedule() {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['p1', 'p2']));

  const rows = useMemo(() => {
    const activeProjects = projects.filter((p) =>
      scheduleData.some((s) => s.projectId === p.id),
    );
    return activeProjects.map((proj) => {
      const projEntries = scheduleData.filter((s) => s.projectId === proj.id);
      const personRows = projEntries.map((entry) => {
        const person = resources.find((r) => r.id === entry.personId);
        return { person, hours: entry.hours };
      }).filter((r) => r.person);

      const totalHours = SCHEDULE_WEEKS.map((_, wi) =>
        projEntries.reduce((sum, e) => sum + (e.hours[wi] ?? 0), 0),
      );
      return { proj, personRows, totalHours };
    });
  }, []);

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <div>
      {rows.map(({ proj, personRows, totalHours }) => {
        const isOpen = expanded.has(proj.id);
        const dotCls = PROJECT_DOT[proj.id] ?? 'bg-muted';
        const tagCls = PROJECT_COLORS[proj.id] ?? 'bg-muted text-muted-foreground';
        return (
          <div key={proj.id}>
            {/* Project row */}
            <button
              className="flex w-full hover:bg-muted/30 transition-colors border-b border-border/40 group"
              style={{ minWidth: LEFT_W + CELL_W * SCHEDULE_WEEKS.length }}
              onClick={() => toggle(proj.id)}
            >
              <div
                className="flex-shrink-0 flex items-center gap-2 px-3 h-9 border-r border-border/50 bg-card"
                style={{ width: LEFT_W, position: 'sticky', left: 0 }}
              >
                <span className="text-muted-foreground/50 w-3 flex-shrink-0">
                  {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                </span>
                <div className={cn('w-2 h-2 rounded-full flex-shrink-0', dotCls)} />
                <div className="min-w-0 flex-1 text-left">
                  <div className="text-xs font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {proj.name}
                  </div>
                  <div className="text-[9px] text-muted-foreground truncate">{proj.client}</div>
                </div>
                <span className={cn('text-[8px] px-1.5 py-0.5 rounded-full flex-shrink-0 font-medium', tagCls)}>
                  {personRows.length}p
                </span>
              </div>
              {SCHEDULE_WEEKS.map((w, wi) => (
                <Cell key={w.key} value={totalHours[wi]} isForecast={w.isForecast} isTotal />
              ))}
            </button>

            {/* Person sub-rows */}
            {isOpen && personRows.map(({ person, hours }) => (
              <div
                key={person!.id}
                className="flex border-b border-border/20 hover:bg-muted/10 transition-colors"
                style={{ minWidth: LEFT_W + CELL_W * SCHEDULE_WEEKS.length }}
              >
                <div
                  className="flex-shrink-0 flex items-center gap-2 px-3 pl-10 h-9 border-r border-border/30 bg-card/80"
                  style={{ width: LEFT_W, position: 'sticky', left: 0 }}
                >
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                    <span className="text-[8px] font-bold text-muted-foreground">
                      {person!.name.split(' ').map((n) => n[0]).join('')}
                    </span>
                  </div>
                  <span className="text-[10px] text-muted-foreground truncate">{person!.name}</span>
                </div>
                {SCHEDULE_WEEKS.map((w, wi) => (
                  <Cell key={w.key} value={hours[wi] ?? 0} isForecast={w.isForecast} isTotal={false} isEmpty={!hours[wi]} />
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className="flex items-center gap-4 text-[10px] text-muted-foreground flex-wrap">
      <span className="font-medium text-foreground text-xs">Legend:</span>
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-destructive/20 inline-block" /> &gt;40h overloaded</span>
      <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-yellow-500/15 inline-block" /> 35–40h near capacity</span>
      <span className="flex items-center gap-1"><span className="text-primary font-semibold">N</span> &lt;25h available</span>
      <span className="flex items-center gap-1"><span className="bg-primary/10 text-primary/70 px-1 rounded text-[8px]">FORE</span> Forecast week</span>
      <span className="flex items-center gap-1"><span className="bg-muted text-muted-foreground px-1 rounded text-[8px]">ACT</span> Actual week</span>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function ScheduleView() {
  const [mode, setMode] = useState<Mode>('people');

  return (
    <div className="space-y-4">
      {/* Mode toggle + legend */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-1 bg-muted/40 rounded-lg p-1">
          <button
            onClick={() => setMode('people')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'people'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <Users className="w-3.5 h-3.5" />
            People Schedule
          </button>
          <button
            onClick={() => setMode('project')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all',
              mode === 'project'
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            Project Schedule
          </button>
        </div>
        <Legend />
      </div>

      {/* Table */}
      <div className="rounded-lg border border-border overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <WeekHeader />
          {mode === 'people' ? <PeopleSchedule /> : <ProjectSchedule />}
        </div>
      </div>
    </div>
  );
}
