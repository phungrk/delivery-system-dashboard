import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Project, ProjectStatus, Priority, PhaseStatus, WATERFALL_PHASES, TaskStatus, RiskLevel, RiskStatus, Sprint, SPRINT_PHASES } from '@/data/mockData';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid,
} from 'recharts';
import {
  Calendar, DollarSign, Users, TrendingUp, Layers, GitBranch,
  CheckCircle2, Circle, Zap, BarChart2, CheckCheck,
  Clock, AlertTriangle, Square, TrendingUp as OnTrackIcon,
  ShieldAlert, Link2, Target, ArrowUp, ArrowDown, Minus,
  ClipboardList, ArrowRight, ChevronDown, ChevronRight, History,
} from 'lucide-react';
import { useState } from 'react';

// ── Status config ────────────────────────────────────────────────────────────

const projectStatusStyle: Record<ProjectStatus, string> = {
  'On Track': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'At Risk': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Delayed': 'bg-destructive/15 text-destructive border-destructive/30',
  'Completed': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const priorityStyle: Record<Priority, string> = {
  'High': 'bg-destructive/10 text-destructive border-destructive/20',
  'Medium': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Low': 'bg-muted text-muted-foreground border-border',
};

const phaseConfig: Record<PhaseStatus, { label: string; textColor: string; barClass: string; borderClass: string; bgClass: string; nodeBorder: string; nodeBg: string; nodeText: string; badgeClass: string; icon: React.ReactNode }> = {
  'Completed': { label: 'Completed', textColor: 'text-emerald-400', barClass: '[&>div]:bg-emerald-500', borderClass: 'border-emerald-500/25', bgClass: 'bg-emerald-500/5', nodeBorder: 'border-emerald-500', nodeBg: 'bg-emerald-500/20', nodeText: 'text-emerald-400', badgeClass: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <CheckCheck className="w-3 h-3" /> },
  'On Track': { label: 'On Track', textColor: 'text-primary', barClass: '', borderClass: 'border-primary/30', bgClass: 'bg-primary/5', nodeBorder: 'border-primary', nodeBg: 'bg-primary/20', nodeText: 'text-primary', badgeClass: 'bg-primary/15 text-primary border-primary/30', icon: <OnTrackIcon className="w-3 h-3" /> },
  'At Risk': { label: 'At Risk', textColor: 'text-yellow-400', barClass: '[&>div]:bg-yellow-500', borderClass: 'border-yellow-500/30', bgClass: 'bg-yellow-500/5', nodeBorder: 'border-yellow-500', nodeBg: 'bg-yellow-500/20', nodeText: 'text-yellow-400', badgeClass: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30', icon: <AlertTriangle className="w-3 h-3" /> },
  'Delayed': { label: 'Delayed', textColor: 'text-destructive', barClass: '[&>div]:bg-destructive', borderClass: 'border-destructive/30', bgClass: 'bg-destructive/5', nodeBorder: 'border-destructive', nodeBg: 'bg-destructive/20', nodeText: 'text-destructive', badgeClass: 'bg-destructive/15 text-destructive border-destructive/30', icon: <Clock className="w-3 h-3" /> },
  'To Do': { label: 'To Do', textColor: 'text-muted-foreground', barClass: '', borderClass: 'border-border', bgClass: 'bg-muted/20', nodeBorder: 'border-border', nodeBg: 'bg-card', nodeText: 'text-muted-foreground/40', badgeClass: 'bg-muted text-muted-foreground border-border', icon: <Square className="w-3 h-3" /> },
};

const taskStatusStyle: Record<TaskStatus, string> = {
  'Completed': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'In Progress': 'bg-primary/15 text-primary border-primary/30',
  'Pending': 'bg-muted text-muted-foreground border-border',
  'Overdue': 'bg-destructive/15 text-destructive border-destructive/30',
};

const riskImpactStyle: Record<RiskLevel, string> = {
  'High': 'bg-destructive/10 text-destructive border-destructive/20',
  'Medium': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Low': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const riskStatusStyle: Record<RiskStatus, string> = {
  'Active': 'bg-destructive/10 text-destructive border-destructive/20',
  'Mitigated': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Closed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

const depStatusStyle: Record<string, string> = {
  'Met': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'At Risk': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Pending': 'bg-muted text-muted-foreground border-border',
};

// ── Sprint helpers ────────────────────────────────────────────────────────────

const sprintPhaseConfig: Record<PhaseStatus, { dot: string; bar: string; text: string; badge: string }> = {
  'Completed': { dot: 'bg-emerald-500', bar: 'bg-emerald-500', text: 'text-emerald-400', badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  'On Track':  { dot: 'bg-primary',     bar: 'bg-primary',     text: 'text-primary',     badge: 'bg-primary/15 text-primary border-primary/30' },
  'At Risk':   { dot: 'bg-yellow-500',  bar: 'bg-yellow-500',  text: 'text-yellow-400',  badge: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30' },
  'Delayed':   { dot: 'bg-destructive', bar: 'bg-destructive', text: 'text-destructive', badge: 'bg-destructive/15 text-destructive border-destructive/30' },
  'To Do':     { dot: 'bg-muted-foreground/30', bar: 'bg-muted-foreground/20', text: 'text-muted-foreground/50', badge: 'bg-muted text-muted-foreground border-border' },
};

function SprintPhaseBar({ sprint }: { sprint: Sprint }) {
  const phases = sprint.phases ?? SPRINT_PHASES.map(name => ({ name, status: sprint.status === 'Completed' ? 'Completed' as const : 'To Do' as const, progress: sprint.status === 'Completed' ? 100 : 0 }));
  return (
    <div className="flex gap-0.5 h-2 rounded-full overflow-hidden w-full">
      {phases.map((p, i) => {
        const cfg = sprintPhaseConfig[p.status];
        return (
          <div key={i} className={`flex-1 rounded-sm ${cfg.bar} opacity-80`} style={{ opacity: p.status === 'To Do' ? 0.25 : 0.9 }} title={`${p.name}: ${p.status}`} />
        );
      })}
    </div>
  );
}

function SprintPhaseStepper({ sprint }: { sprint: Sprint }) {
  const phases = sprint.phases ?? SPRINT_PHASES.map(name => ({ name, status: sprint.status === 'Completed' ? 'Completed' as const : 'To Do' as const, progress: sprint.status === 'Completed' ? 100 : 0 }));
  return (
    <div className="space-y-1.5 mt-3">
      {phases.map((phase, idx) => {
        const cfg = sprintPhaseConfig[phase.status];
        const isActive = phase.status !== 'Completed' && phase.status !== 'To Do';
        return (
          <div key={idx} className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full flex-shrink-0 ${cfg.dot} ${phase.status === 'To Do' ? 'opacity-30' : ''}`} />
            <span className={`text-xs flex-1 ${cfg.text} ${phase.status === 'To Do' ? 'opacity-50' : ''}`}>{phase.name}</span>
            {isActive && (
              <div className="flex-1 max-w-16 bg-muted rounded-full h-1">
                <div className={`h-1 rounded-full ${cfg.bar}`} style={{ width: `${phase.progress}%` }} />
              </div>
            )}
            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
              {phase.status === 'To Do' ? '–' : phase.status === 'Completed' ? '✓' : `${phase.progress}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function SprintCard({ sprint, isActive, isExpanded, onToggle }: { sprint: Sprint; isActive?: boolean; isExpanded: boolean; onToggle: () => void }) {
  const ptsPct = Math.round((sprint.storyPointsDone / sprint.storyPointsTotal) * 100);
  const statusColor = sprint.status === 'Completed' ? 'text-emerald-400' : sprint.status === 'Active' ? 'text-primary' : 'text-muted-foreground';
  const borderClass = isActive ? 'border-primary/40 bg-primary/5' : sprint.status === 'Completed' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-muted/20';

  return (
    <div className={`rounded-lg border ${borderClass} overflow-hidden`}>
      <button className="w-full text-left p-3 flex items-center gap-3" onClick={onToggle}>
        {/* Sprint number badge */}
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${isActive ? 'bg-primary/20 text-primary border border-primary/40' : sprint.status === 'Completed' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground border border-border'}`}>
          {sprint.number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold truncate">Sprint {sprint.number}</span>
            <span className={`text-xs font-medium ${statusColor} flex-shrink-0`}>{sprint.status}</span>
          </div>
          <p className="text-xs text-muted-foreground truncate mt-0.5">"{sprint.goal}"</p>
          <div className="flex items-center gap-2 mt-1.5">
            <SprintPhaseBar sprint={sprint} />
            <span className="text-xs text-muted-foreground flex-shrink-0">{sprint.storyPointsDone}/{sprint.storyPointsTotal} pts</span>
          </div>
        </div>
        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0" />}
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 border-t border-border/50">
          <div className="flex justify-between text-xs text-muted-foreground mt-2.5 mb-2">
            <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{sprint.startDate} → {sprint.endDate}</span>
            <span className="font-semibold">{ptsPct}% complete</span>
          </div>
          <Progress value={ptsPct} className={`h-1.5 mb-1 ${sprint.status === 'Completed' ? '[&>div]:bg-emerald-500' : ''}`} />
          <SprintPhaseStepper sprint={sprint} />
        </div>
      )}
    </div>
  );
}

function SprintTimeline({ project }: { project: Project }) {
  const allSprints: Sprint[] = [
    ...(project.sprintHistory ?? []),
    ...(project.currentSprint ? [project.currentSprint] : []),
  ];
  const [expandedIds, setExpandedIds] = useState<Set<number>>(() => new Set(project.currentSprint ? [project.currentSprint.number] : []));

  const toggle = (num: number) => setExpandedIds(prev => {
    const next = new Set(prev);
    next.has(num) ? next.delete(num) : next.add(num);
    return next;
  });

  const remaining = (project.totalSprints ?? 0) - allSprints.length;

  return (
    <div>
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 mb-4">
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Sprints Done</p>
          <p className="text-sm font-bold">{project.completedSprints}/{project.totalSprints}</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Velocity</p>
          <p className="text-sm font-bold">{project.velocity} pts</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3 text-center">
          <p className="text-xs text-muted-foreground mb-1">Backlog</p>
          <p className="text-sm font-bold">{project.backlogItems} items</p>
        </div>
      </div>

      {/* Sprint list */}
      <p className="text-sm font-semibold mb-3 flex items-center gap-1.5">
        <History className="w-4 h-4 text-muted-foreground" />Sprint Timeline
        <span className="text-xs font-normal text-muted-foreground ml-1">{allSprints.length} of {project.totalSprints ?? '?'} sprints</span>
      </p>
      <div className="space-y-2">
        {allSprints.map(sprint => (
          <SprintCard
            key={sprint.number}
            sprint={sprint}
            isActive={sprint.status === 'Active'}
            isExpanded={expandedIds.has(sprint.number)}
            onToggle={() => toggle(sprint.number)}
          />
        ))}

        {/* Upcoming sprints placeholder */}
        {remaining > 0 && (
          <div className="rounded-lg border border-dashed border-border p-3 text-center">
            <p className="text-xs text-muted-foreground">{remaining} upcoming sprint{remaining > 1 ? 's' : ''} planned</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function OverviewTab({ project }: { project: Project }) {
  const completedCount = project.phases?.filter(p => p.status === 'Completed').length ?? 0;
  const isScrumProject = project.type === 'scrum';

  return (
    <div className="space-y-6">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm">
          <span className="flex items-center gap-1.5 text-muted-foreground"><TrendingUp className="w-4 h-4" />Overall Progress</span>
          <span className="font-semibold">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-2.5" />
        {project.type === 'waterfall' && (
          <p className="text-xs text-muted-foreground">{completedCount} of {WATERFALL_PHASES.length} phases completed</p>
        )}
      </div>

      {/* Waterfall: Phase Pipeline */}
      {project.type === 'waterfall' && project.phases && (
        <div>
          <p className="text-sm font-semibold mb-4 flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-muted-foreground" />Phase Pipeline
          </p>
          <div className="relative mb-5">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-border z-0" />
            <div className="flex justify-between relative z-10">
              {WATERFALL_PHASES.map((phaseName, idx) => {
                const phase = project.phases?.find(p => p.name === phaseName);
                const cfg = phaseConfig[phase?.status ?? 'To Do'];
                return (
                  <div key={phaseName} className="flex flex-col items-center gap-1.5 w-14">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${cfg.nodeBg} ${cfg.nodeBorder}`}>
                      <span className={`text-xs font-bold ${cfg.nodeText}`}>{idx + 1}</span>
                    </div>
                    <span className={`text-[10px] font-medium text-center leading-tight ${cfg.textColor}`}>
                      {phaseName === 'Post-Release' ? 'Post\nRelease' : phaseName}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="space-y-2">
            {WATERFALL_PHASES.map((phaseName) => {
              const phase = project.phases?.find(p => p.name === phaseName);
              const status = phase?.status ?? 'To Do';
              const cfg = phaseConfig[status];
              return (
                <div key={phaseName} className={`rounded-lg border p-2.5 ${cfg.borderClass} ${cfg.bgClass}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{phaseName}</span>
                      <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 font-medium ${cfg.badgeClass}`}>{cfg.icon}{cfg.label}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{phase?.endDate}</span>
                      {status !== 'To Do' && <span className={`font-semibold ${cfg.textColor}`}>{phase?.progress}%</span>}
                    </div>
                  </div>
                  {status !== 'To Do' && <Progress value={phase?.progress ?? 0} className={`h-1 mt-2 ${cfg.barClass}`} />}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Scrum: Sprint Overview */}
      {isScrumProject && <SprintTimeline project={project} />}

      {/* Milestones */}
      {project.milestones && project.milestones.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-muted-foreground" />Milestones & Timeline</p>
          <div className="relative pl-5">
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-border" />
            {project.milestones.map((m, idx) => (
              <div key={idx} className="relative mb-3 last:mb-0">
                <div className={`absolute -left-3 top-1 w-2.5 h-2.5 rounded-full border-2 ${m.completed ? 'bg-emerald-500 border-emerald-500' : 'bg-card border-border'}`} />
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${m.completed ? 'text-muted-foreground line-through' : 'font-medium'}`}>{m.name}</span>
                  <span className={`text-xs ${m.completed ? 'text-emerald-400' : 'text-muted-foreground'}`}>{m.date}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* KPIs */}
      {project.kpis.length > 0 && (
        <div>
          <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><Target className="w-4 h-4 text-muted-foreground" />Custom KPIs</p>
          <div className="grid grid-cols-2 gap-2">
            {project.kpis.map((kpi, idx) => {
              const isGood = kpi.trend === kpi.positiveDirection || kpi.trend === 'neutral';
              const trendColor = kpi.trend === 'neutral' ? 'text-muted-foreground' : isGood ? 'text-emerald-400' : 'text-destructive';
              const TrendIcon = kpi.trend === 'up' ? ArrowUp : kpi.trend === 'down' ? ArrowDown : Minus;
              return (
                <div key={idx} className="bg-muted/30 rounded-lg p-3">
                  <p className="text-xs text-muted-foreground mb-1">{kpi.label}</p>
                  <div className="flex items-end gap-1.5">
                    <span className="text-lg font-bold leading-none">{kpi.value}</span>
                    <span className="text-xs text-muted-foreground mb-0.5">{kpi.unit}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">Target: {kpi.target}{kpi.unit}</span>
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${trendColor}`}>
                      <TrendIcon className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function BudgetTab({ project }: { project: Project }) {
  const budgetPct = Math.round((project.spent / project.budget) * 100);
  const remaining = project.budget - project.spent;
  const variance = project.spent - project.budgetMonthly.filter(m => m.actual > 0).reduce((s, m) => s + m.planned, 0);

  return (
    <div className="space-y-5">
      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Total Budget</p>
          <p className="text-base font-bold">${(project.budget / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Spent ({budgetPct}%)</p>
          <p className={`text-base font-bold ${budgetPct > 90 ? 'text-destructive' : ''}`}>${(project.spent / 1000).toFixed(0)}k</p>
        </div>
        <div className="bg-muted/30 rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Remaining</p>
          <p className={`text-base font-bold ${remaining < 0 ? 'text-destructive' : 'text-emerald-400'}`}>${(Math.abs(remaining) / 1000).toFixed(0)}k</p>
        </div>
      </div>

      {/* Budget burn bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Budget consumption</span>
          <span className={budgetPct > 90 ? 'text-destructive font-semibold' : ''}>{budgetPct}%</span>
        </div>
        <Progress value={budgetPct} className={`h-3 ${budgetPct > 90 ? '[&>div]:bg-destructive' : budgetPct > 75 ? '[&>div]:bg-yellow-500' : '[&>div]:bg-emerald-500'}`} />
      </div>

      {/* Planned vs Actual chart */}
      <div>
        <p className="text-sm font-semibold mb-3 flex items-center gap-1.5"><BarChart2 className="w-4 h-4 text-muted-foreground" />Planned vs Actual Spend</p>
        <div className="h-44">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={project.budgetMonthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `$${v / 1000}k`} />
              <Tooltip
                contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }}
                formatter={(v: number) => [`$${v.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="planned" name="Planned" fill="hsl(var(--muted-foreground))" opacity={0.5} radius={[2, 2, 0, 0]} />
              <Bar dataKey="actual" name="Actual" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Variance note */}
      <div className={`rounded-lg p-3 border text-sm ${variance > 0 ? 'border-destructive/30 bg-destructive/5 text-destructive' : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-400'}`}>
        <span className="font-medium">Cost Variance (to date): </span>
        {variance > 0 ? `+$${variance.toLocaleString()} over plan` : variance < 0 ? `-$${Math.abs(variance).toLocaleString()} under plan` : 'On budget'}
      </div>
    </div>
  );
}

function TasksTab({ project }: { project: Project }) {
  const counts = {
    Completed: project.tasks.filter(t => t.status === 'Completed').length,
    'In Progress': project.tasks.filter(t => t.status === 'In Progress').length,
    Pending: project.tasks.filter(t => t.status === 'Pending').length,
    Overdue: project.tasks.filter(t => t.status === 'Overdue').length,
  };
  return (
    <div className="space-y-4">
      {/* Summary pills */}
      <div className="flex gap-2 flex-wrap">
        {(Object.entries(counts) as [TaskStatus, number][]).map(([status, count]) => (
          <span key={status} className={`inline-flex items-center gap-1.5 text-xs border rounded-full px-3 py-1 font-medium ${taskStatusStyle[status]}`}>
            {count} {status}
          </span>
        ))}
      </div>

      {/* Task list */}
      <div className="space-y-2">
        {project.tasks.map(task => (
          <div key={task.id} className="flex items-start justify-between gap-3 p-3 rounded-lg border border-border bg-muted/20 hover:bg-muted/40 transition-colors">
            <div className="flex items-start gap-2.5 min-w-0">
              {task.status === 'Completed'
                ? <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                : task.status === 'Overdue'
                ? <AlertTriangle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                : <Circle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
              }
              <div className="min-w-0">
                <p className={`text-sm font-medium leading-tight ${task.status === 'Completed' ? 'line-through text-muted-foreground' : ''}`}>{task.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{task.assignee} · {task.deliverable}</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
              <span className={`text-xs border rounded-full px-2 py-0.5 font-medium ${taskStatusStyle[task.status]}`}>{task.status}</span>
              <span className="text-xs text-muted-foreground">{task.dueDate}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RisksTab({ project }: { project: Project }) {
  const activeCount = project.risks.filter(r => r.status === 'Active').length;
  return (
    <div className="space-y-4">
      {activeCount > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
          <ShieldAlert className="w-4 h-4 text-destructive flex-shrink-0" />
          <span className="text-sm text-destructive font-medium">{activeCount} active risk{activeCount > 1 ? 's' : ''} require attention</span>
        </div>
      )}

      <div className="space-y-3">
        {project.risks.map(risk => (
          <div key={risk.id} className={`rounded-lg border p-3.5 space-y-2.5 ${risk.status === 'Active' ? 'border-destructive/25 bg-destructive/5' : risk.status === 'Mitigated' ? 'border-yellow-500/20 bg-yellow-500/5' : 'border-border bg-muted/20'}`}>
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-semibold leading-snug">{risk.title}</p>
              <span className={`text-xs border rounded-full px-2 py-0.5 font-medium shrink-0 ${riskStatusStyle[risk.status]}`}>{risk.status}</span>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 font-medium ${riskImpactStyle[risk.impact]}`}>
                Impact: {risk.impact}
              </span>
              <span className={`inline-flex items-center gap-1 text-xs border rounded-full px-2 py-0.5 font-medium ${riskImpactStyle[risk.probability]}`}>
                Probability: {risk.probability}
              </span>
              <span className="text-xs text-muted-foreground border rounded-full px-2 py-0.5 border-border bg-muted/30">
                Owner: {risk.owner}
              </span>
            </div>
            <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-3 py-2">
              <span className="font-medium text-foreground">Mitigation: </span>{risk.mitigation}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function DependenciesTab({ project }: { project: Project }) {
  return (
    <div className="space-y-3">
      {project.dependencies.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-8">No dependencies tracked</p>
      )}
      {project.dependencies.map((dep, idx) => (
        <div key={idx} className={`rounded-lg border p-3.5 ${dep.status === 'At Risk' ? 'border-yellow-500/20 bg-yellow-500/5' : dep.status === 'Met' ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-border bg-muted/20'}`}>
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="flex items-center gap-2 min-w-0">
              <Link2 className="w-4 h-4 text-muted-foreground flex-shrink-0" />
              <span className="text-sm font-medium leading-snug">{dep.name}</span>
            </div>
            <span className={`text-xs border rounded-full px-2 py-0.5 font-medium shrink-0 ${depStatusStyle[dep.status]}`}>{dep.status}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className={`flex items-center gap-1 border rounded-full px-2 py-0.5 font-medium ${dep.type === 'Blocks' ? 'border-primary/30 bg-primary/10 text-primary' : dep.type === 'Blocked By' ? 'border-destructive/30 bg-destructive/10 text-destructive' : 'border-border bg-muted/30 text-muted-foreground'}`}>
              {dep.type === 'Blocks' && <ArrowRight className="w-3 h-3" />}
              {dep.type === 'Blocked By' && <ArrowRight className="w-3 h-3 rotate-180" />}
              {dep.type}
            </span>
            <span>{dep.relatedProject}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function TeamTab({ project }: { project: Project }) {
  return (
    <div className="space-y-3">
      {project.team.map((member, idx) => {
        const isLead = member === project.lead;
        return (
          <div key={idx} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold ${isLead ? 'bg-primary/20 text-primary border border-primary/40' : 'bg-muted text-muted-foreground'}`}>
                {member.split(' ').map(n => n[0]).join('')}
              </div>
              <div>
                <p className="text-sm font-medium">{member}</p>
                {isLead && <p className="text-xs text-primary">Project Lead</p>}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Main Dialog ───────────────────────────────────────────────────────────────

export default function ProjectDetailDialog({ project, onClose }: { project: Project; onClose: () => void }) {
  const activeRisks = project.risks.filter(r => r.status === 'Active').length;
  const overdueTasks = project.tasks.filter(t => t.status === 'Overdue').length;
  const atRiskDeps = project.dependencies.filter(d => d.status === 'At Risk').length;

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col p-0 gap-0">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap mb-2">
            <Badge variant="outline" className={`text-xs flex items-center gap-1 ${project.type === 'waterfall' ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-sky-500/40 bg-sky-500/10 text-sky-400'}`}>
              {project.type === 'waterfall' ? <Layers className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
              {project.type === 'waterfall' ? 'Waterfall' : 'Scrum / Sprint'}
            </Badge>
            <Badge variant="outline" className={`text-xs ${projectStatusStyle[project.status]}`}>{project.status}</Badge>
            <Badge variant="outline" className={`text-xs ${priorityStyle[project.priority]}`}>{project.priority} Priority</Badge>
          </div>
          <DialogTitle className="text-xl leading-snug">{project.name}</DialogTitle>
          <div className="flex items-center justify-between text-sm text-muted-foreground mt-1">
            <span className="font-medium">{project.client}</span>
            <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{project.startDate} → {project.endDate}</span>
          </div>
          {/* Alert strip */}
          {(activeRisks > 0 || overdueTasks > 0 || atRiskDeps > 0) && (
            <div className="flex gap-3 mt-3 flex-wrap">
              {activeRisks > 0 && <span className="text-xs flex items-center gap-1 text-destructive"><ShieldAlert className="w-3.5 h-3.5" />{activeRisks} active risk{activeRisks > 1 ? 's' : ''}</span>}
              {overdueTasks > 0 && <span className="text-xs flex items-center gap-1 text-destructive"><Clock className="w-3.5 h-3.5" />{overdueTasks} overdue task{overdueTasks > 1 ? 's' : ''}</span>}
              {atRiskDeps > 0 && <span className="text-xs flex items-center gap-1 text-yellow-400"><Link2 className="w-3.5 h-3.5" />{atRiskDeps} dependency at risk</span>}
            </div>
          )}
        </DialogHeader>

        {/* Tabs */}
        <div className="flex-1 overflow-y-auto">
          <Tabs defaultValue="overview" className="flex flex-col h-full">
            <TabsList className="w-full rounded-none border-b border-border bg-transparent h-10 flex-shrink-0 justify-start px-6 gap-1">
              <TabsTrigger value="overview" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                <TrendingUp className="w-3.5 h-3.5 mr-1" />Overview
              </TabsTrigger>
              <TabsTrigger value="budget" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                <DollarSign className="w-3.5 h-3.5 mr-1" />Budget
              </TabsTrigger>
              <TabsTrigger value="tasks" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                <ClipboardList className="w-3.5 h-3.5 mr-1" />Tasks
                {overdueTasks > 0 && <span className="ml-1 bg-destructive/20 text-destructive rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{overdueTasks}</span>}
              </TabsTrigger>
              <TabsTrigger value="risks" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                <ShieldAlert className="w-3.5 h-3.5 mr-1" />Risks
                {activeRisks > 0 && <span className="ml-1 bg-destructive/20 text-destructive rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-bold">{activeRisks}</span>}
              </TabsTrigger>
              <TabsTrigger value="deps" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                <Link2 className="w-3.5 h-3.5 mr-1" />Dependencies
              </TabsTrigger>
              <TabsTrigger value="team" className="text-xs data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none pb-2">
                <Users className="w-3.5 h-3.5 mr-1" />Team
              </TabsTrigger>
            </TabsList>

            <div className="p-6">
              <TabsContent value="overview" className="mt-0"><OverviewTab project={project} /></TabsContent>
              <TabsContent value="budget" className="mt-0"><BudgetTab project={project} /></TabsContent>
              <TabsContent value="tasks" className="mt-0"><TasksTab project={project} /></TabsContent>
              <TabsContent value="risks" className="mt-0"><RisksTab project={project} /></TabsContent>
              <TabsContent value="deps" className="mt-0"><DependenciesTab project={project} /></TabsContent>
              <TabsContent value="team" className="mt-0"><TeamTab project={project} /></TabsContent>
            </div>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  );
}
