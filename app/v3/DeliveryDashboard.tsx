import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { projects, Project, ProjectStatus, Priority, PhaseStatus } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, TrendingUp, AlertTriangle, CheckCircle, Clock, DollarSign, GitBranch, Layers, ChevronRight, ShieldAlert, LayoutGrid, Kanban, GanttChart as GanttIcon } from 'lucide-react';
import { WATERFALL_PHASES } from '@/data/mockData';
import SprintPhaseStepper from '@/components/SprintPhaseStepper';
import PhaseBoard from '@/components/PhaseBoard';
import GanttChart from '@/components/GanttChart';

const statusColor: Record<ProjectStatus, string> = {
  'On Track': 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  'At Risk': 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Delayed': 'bg-red-500/15 text-red-400 border-red-500/30',
  'Completed': 'bg-blue-500/15 text-blue-400 border-blue-500/30',
};

const priorityColor: Record<Priority, string> = {
  'High': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Medium': 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  'Low': 'bg-muted text-muted-foreground',
};

const statusIcon: Record<ProjectStatus, React.ReactNode> = {
  'On Track': <TrendingUp className="w-3.5 h-3.5" />,
  'At Risk': <AlertTriangle className="w-3.5 h-3.5" />,
  'Delayed': <Clock className="w-3.5 h-3.5" />,
  'Completed': <CheckCircle className="w-3.5 h-3.5" />,
};

const PHASE_BAR_COLOR: Record<PhaseStatus, string> = {
  'Completed': 'bg-emerald-500',
  'On Track':  'bg-primary',
  'At Risk':   'bg-yellow-500',
  'Delayed':   'bg-destructive',
  'To Do':     'bg-muted/50',
};

const PHASE_LABEL_COLOR: Record<PhaseStatus, string> = {
  'Completed': 'text-emerald-400',
  'On Track':  'text-primary',
  'At Risk':   'text-yellow-400',
  'Delayed':   'text-destructive',
  'To Do':     'text-muted-foreground/60',
};

function WaterfallCardBody({ project }: { project: Project }) {
  const activePhase = project.phases?.find(p => p.status === 'On Track' || p.status === 'At Risk' || p.status === 'Delayed');
  const LABELS = ['Design', 'Impl.', 'Verif.', 'Approv.', 'Release', 'Post'];

  return (
    <div className="space-y-3">
      {/* 6-phase stepper */}
      <div className="flex items-center gap-0.5">
        {WATERFALL_PHASES.map((phaseName, idx) => {
          const phase = project.phases?.find(p => p.name === phaseName);
          const status = phase?.status ?? 'To Do';
          return (
            <div key={phaseName} className="flex items-center flex-1 min-w-0">
              <div className="flex-1 flex flex-col items-center gap-1" title={`${phaseName}: ${status}`}>
                <div className={`w-full h-1.5 rounded-full transition-colors ${PHASE_BAR_COLOR[status] ?? 'bg-muted/50'}`} />
                <span className={`text-[9px] font-medium leading-none truncate w-full text-center ${PHASE_LABEL_COLOR[status] ?? 'text-muted-foreground/60'}`}>
                  {LABELS[idx]}
                </span>
              </div>
              {idx < WATERFALL_PHASES.length - 1 && (
                <ChevronRight className="w-2.5 h-2.5 text-muted-foreground/40 flex-shrink-0 -mx-0.5" />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {activePhase
            ? <>Active: <span className="text-foreground font-medium">{activePhase.name}</span></>
            : project.status === 'Completed'
              ? <span className="text-emerald-400 font-medium">All phases complete</span>
              : <>Next: <span className="text-foreground font-medium">{project.phases?.find(p => p.status === 'To Do')?.name}</span></>
          }
        </span>
        <span>Due {project.endDate}</span>
      </div>
    </div>
  );
}

function ScrumCardBody({ project }: { project: Project }) {
  const sprint = project.currentSprint;
  const activePhaseName = sprint?.phases?.find(
    p => p.status === 'On Track' || p.status === 'At Risk' || p.status === 'Delayed'
  )?.name;

  return (
    <div className="space-y-3">
      {/* Sprint header */}
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-foreground">Sprint {sprint?.number}</span>
        <span className="text-muted-foreground truncate max-w-[160px] text-right">{sprint?.goal}</span>
      </div>

      {/* Sprint phase pipeline */}
      <SprintPhaseStepper
        phases={sprint?.phases}
        allCompleted={sprint?.status === 'Completed'}
      />

      {/* Active phase + footer */}
      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {activePhaseName
            ? <>Active: <span className="text-foreground font-medium">{activePhaseName}</span></>
            : sprint?.status === 'Completed'
              ? <span className="text-emerald-400 font-medium">Sprint complete</span>
              : <span className="text-muted-foreground">Sprint {project.completedSprints}/{project.totalSprints} done</span>
          }
        </span>
        <span>Ends {sprint?.endDate}</span>
      </div>
    </div>
  );
}

export default function ProjectsTab() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [view, setView] = useState<'grid' | 'board' | 'gantt'>('grid');

  const stats = useMemo(() => ({
    total: projects.length,
    waterfall: projects.filter(p => p.type === 'waterfall').length,
    scrum: projects.filter(p => p.type === 'scrum').length,
    onTrack: projects.filter(p => p.status === 'On Track').length,
    atRisk: projects.filter(p => p.status === 'At Risk').length,
    delayed: projects.filter(p => p.status === 'Delayed').length,
    totalBudget: projects.reduce((s, p) => s + p.budget, 0),
    totalSpent: projects.reduce((s, p) => s + p.spent, 0),
  }), []);

  const filtered = useMemo(() => projects.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.client.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || p.status === statusFilter;
    const matchType = typeFilter === 'all' || p.type === typeFilter;
    return matchSearch && matchStatus && matchType;
  }), [search, statusFilter, typeFilter]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Projects" value={stats.total} sub={`${stats.waterfall} Waterfall · ${stats.scrum} Scrum`} icon={<TrendingUp className="w-5 h-5 text-primary" />} />
        <StatCard label="On Track" value={stats.onTrack} sub={`${stats.delayed} delayed`} icon={<CheckCircle className="w-5 h-5 text-emerald-400" />} />
        <StatCard label="At Risk" value={stats.atRisk} sub="Need attention" icon={<AlertTriangle className="w-5 h-5 text-yellow-400" />} />
        <StatCard
          label="Budget Spent"
          value={`$${(stats.totalSpent / 1000).toFixed(0)}k`}
          sub={`of $${(stats.totalBudget / 1000).toFixed(0)}k total`}
          icon={<DollarSign className="w-5 h-5 text-blue-400" />}
        />
      </div>

      {/* Filters + View toggle */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search projects or clients..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        {/* Type filter */}
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          {(['all', 'waterfall', 'scrum'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTypeFilter(t)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${typeFilter === t ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              {t === 'waterfall' && <Layers className="w-3.5 h-3.5" />}
              {t === 'scrum' && <GitBranch className="w-3.5 h-3.5" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="On Track">On Track</SelectItem>
            <SelectItem value="At Risk">At Risk</SelectItem>
            <SelectItem value="Delayed">Delayed</SelectItem>
            <SelectItem value="Completed">Completed</SelectItem>
          </SelectContent>
        </Select>
        {/* View toggle */}
        <div className="flex gap-1 bg-muted/40 rounded-lg p-1">
          <button
            onClick={() => setView('grid')}
            title="Grid view"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'grid' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            Grid
          </button>
          <button
            onClick={() => setView('board')}
            title="Phase board"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'board' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <Kanban className="w-3.5 h-3.5" />
            Phase Board
          </button>
          <button
            onClick={() => setView('gantt')}
            title="Gantt chart"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${view === 'gantt' ? 'bg-card text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            <GanttIcon className="w-3.5 h-3.5" />
            Gantt
          </button>
        </div>
      </div>

      {/* Grid view */}
      {view === 'grid' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filtered.map(project => (
            <Card
              key={project.id}
              className="cursor-pointer hover:border-primary/50 transition-all duration-200 hover:shadow-lg hover:shadow-black/20"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 flex items-center gap-1 ${project.type === 'waterfall' ? 'border-violet-500/40 bg-violet-500/10 text-violet-400' : 'border-sky-500/40 bg-sky-500/10 text-sky-400'}`}
                      >
                        {project.type === 'waterfall' ? <Layers className="w-3 h-3" /> : <GitBranch className="w-3 h-3" />}
                        {project.type === 'waterfall' ? 'Waterfall' : 'Scrum'}
                      </Badge>
                      <Badge variant="outline" className={`text-xs shrink-0 ${priorityColor[project.priority]}`}>{project.priority}</Badge>
                    </div>
                    <CardTitle className="text-base font-semibold leading-tight truncate">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-0.5">{project.client}</p>
                  </div>
                  <Badge variant="outline" className={`text-xs flex items-center gap-1 shrink-0 ${statusColor[project.status]}`}>
                    {statusIcon[project.status]} {project.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {project.type === 'waterfall'
                  ? <WaterfallCardBody project={project} />
                  : <ScrumCardBody project={project} />
                }
                <div className="pt-2 border-t border-border flex justify-between text-xs text-muted-foreground">
                  <div className="flex items-center gap-3">
                    <span>Lead: <span className="text-foreground font-medium">{project.lead}</span></span>
                    {project.tasks.filter(t => t.status === 'Overdue').length > 0 && (
                      <span className="flex items-center gap-1 text-destructive"><Clock className="w-3 h-3" />{project.tasks.filter(t => t.status === 'Overdue').length} overdue</span>
                    )}
                    {project.risks.filter(r => r.status === 'Active').length > 0 && (
                      <span className="flex items-center gap-1 text-yellow-400"><AlertTriangle className="w-3 h-3" />{project.risks.filter(r => r.status === 'Active').length} risk{project.risks.filter(r => r.status === 'Active').length > 1 ? 's' : ''}</span>
                    )}
                  </div>
                  <span className={project.spent / project.budget > 0.9 ? 'text-destructive' : ''}>
                    ${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Phase board view */}
      {view === 'board' && <PhaseBoard projects={filtered} />}

      {/* Gantt view */}
      {view === 'gantt' && <GanttChart projects={filtered} />}
    </div>
  );
}

function StatCard({ label, value, sub, icon }: { label: string; value: string | number; sub: string; icon: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold mt-1">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
          </div>
          <div className="mt-1">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
}
