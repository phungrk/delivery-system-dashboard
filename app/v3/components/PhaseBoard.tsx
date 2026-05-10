import { useNavigate } from 'react-router-dom';
import { Project, ProjectStatus, WATERFALL_PHASES, WaterfallPhaseName } from '@/data/mockData';
import SprintPhaseStepper from '@/components/SprintPhaseStepper';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  TrendingUp, AlertTriangle, Clock, CheckCircle, GitBranch,
  Layers, ShieldAlert,
} from 'lucide-react';

// ── helpers ──────────────────────────────────────────────────────────────────

function getCurrentPhaseName(project: Project): WaterfallPhaseName | 'Completed' | 'Not Started' {
  if (!project.phases) return 'Not Started';
  const active = project.phases.find(
    p => p.status === 'On Track' || p.status === 'At Risk' || p.status === 'Delayed'
  );
  if (active) return active.name;
  const allDone = project.phases.every(p => p.status === 'Completed');
  if (allDone) return 'Completed';
  return 'Not Started';
}

const statusBadge: Record<ProjectStatus, { cls: string; icon: React.ReactNode }> = {
  'On Track':  { cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: <TrendingUp className="w-3 h-3" /> },
  'At Risk':   { cls: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',   icon: <AlertTriangle className="w-3 h-3" /> },
  'Delayed':   { cls: 'bg-destructive/15 text-destructive border-destructive/30', icon: <Clock className="w-3 h-3" /> },
  'Completed': { cls: 'bg-blue-500/15 text-blue-400 border-blue-500/30',         icon: <CheckCircle className="w-3 h-3" /> },
};

// Column accent colors (top border + header tint)
const phaseAccent: Record<string, { border: string; bg: string; text: string; dot: string }> = {
  'Design':         { border: 'border-t-violet-500',  bg: 'bg-violet-500/5',  text: 'text-violet-400',  dot: 'bg-violet-500' },
  'Implementation': { border: 'border-t-primary',     bg: 'bg-primary/5',     text: 'text-primary',     dot: 'bg-primary' },
  'Verification':   { border: 'border-t-sky-500',     bg: 'bg-sky-500/5',     text: 'text-sky-400',     dot: 'bg-sky-500' },
  'Approval':       { border: 'border-t-amber-500',   bg: 'bg-amber-500/5',   text: 'text-amber-400',   dot: 'bg-amber-500' },
  'Release':        { border: 'border-t-emerald-500', bg: 'bg-emerald-500/5', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  'Post-Release':   { border: 'border-t-teal-500',    bg: 'bg-teal-500/5',    text: 'text-teal-400',    dot: 'bg-teal-500' },
};

// ── Mini project card ─────────────────────────────────────────────────────────

function ProjectMiniCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { cls, icon } = statusBadge[project.status];
  const currentPhase = project.phases?.find(
    p => p.status === 'On Track' || p.status === 'At Risk' || p.status === 'Delayed'
  ) ?? project.phases?.find(p => p.status === 'Completed');
  const phaseProgress = currentPhase?.progress ?? project.progress;
  const overdue = project.tasks.filter(t => t.status === 'Overdue').length;
  const activeRisks = project.risks.filter(r => r.status === 'Active').length;
  const budgetPct = Math.round((project.spent / project.budget) * 100);

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:shadow-md hover:shadow-black/20 transition-all duration-150 space-y-2.5 group"
    >
      {/* Name + status */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-semibold leading-snug group-hover:text-primary transition-colors line-clamp-2 flex-1">
          {project.name}
        </p>
        <Badge variant="outline" className={`text-[10px] flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 ${cls}`}>
          {icon}
        </Badge>
      </div>

      {/* Client */}
      <p className="text-xs text-muted-foreground truncate">{project.client}</p>

      {/* Phase progress */}
      <div className="space-y-1">
        <div className="flex justify-between text-[10px] text-muted-foreground">
          <span>Progress</span>
          <span className="font-medium">{project.progress}%</span>
        </div>
        <Progress value={project.progress} className="h-1.5" />
      </div>

      {/* Footer alerts + budget */}
      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-2">
          {overdue > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-destructive">
              <Clock className="w-2.5 h-2.5" />{overdue}
            </span>
          )}
          {activeRisks > 0 && (
            <span className="flex items-center gap-0.5 text-[10px] text-yellow-400">
              <ShieldAlert className="w-2.5 h-2.5" />{activeRisks}
            </span>
          )}
          {overdue === 0 && activeRisks === 0 && (
            <span className="text-[10px] text-muted-foreground">{project.lead}</span>
          )}
        </div>
        <span className={`text-[10px] font-medium ${budgetPct > 90 ? 'text-destructive' : 'text-muted-foreground'}`}>
          ${(project.spent / 1000).toFixed(0)}k / ${(project.budget / 1000).toFixed(0)}k
        </span>
      </div>
    </div>
  );
}

// ── Phase column ──────────────────────────────────────────────────────────────

function PhaseColumn({ phase, projects }: { phase: string; projects: Project[] }) {
  const accent = phaseAccent[phase] ?? phaseAccent['Design'];
  return (
    <div className="flex flex-col min-w-[210px] max-w-[210px]">
      {/* Column header */}
      <div className={`rounded-t-lg border border-b-0 border-border px-3 py-2.5 ${accent.bg} border-t-2 ${accent.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${accent.dot}`} />
            <span className={`text-xs font-semibold ${accent.text}`}>{phase}</span>
          </div>
          <span className="text-[10px] font-bold bg-card border border-border rounded-full px-1.5 py-0.5 text-muted-foreground min-w-[18px] text-center">
            {projects.length}
          </span>
        </div>
      </div>

      {/* Cards */}
      <div className={`flex-1 border border-border rounded-b-lg p-2 space-y-2 min-h-[120px] ${accent.bg}`}>
        {projects.length === 0 && (
          <div className="flex items-center justify-center h-20">
            <p className="text-[10px] text-muted-foreground/50">No projects</p>
          </div>
        )}
        {projects.map(p => <ProjectMiniCard key={p.id} project={p} />)}
      </div>
    </div>
  );
}

// ── Scrum mini card (simplified) ─────────────────────────────────────────────

function ScrumMiniCard({ project }: { project: Project }) {
  const navigate = useNavigate();
  const { cls, icon } = statusBadge[project.status];
  const sprint = project.currentSprint;
  const overdue = project.tasks.filter(t => t.status === 'Overdue').length;
  const activeRisks = project.risks.filter(r => r.status === 'Active').length;

  return (
    <div
      onClick={() => navigate(`/projects/${project.id}`)}
      className="bg-card border border-border rounded-lg p-3 cursor-pointer hover:border-primary/50 hover:shadow-md hover:shadow-black/20 transition-all duration-150 space-y-2 group"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <GitBranch className="w-3 h-3 text-sky-400 flex-shrink-0" />
            <p className="text-xs font-semibold leading-snug group-hover:text-primary transition-colors truncate">{project.name}</p>
          </div>
          <p className="text-[10px] text-muted-foreground truncate">{project.client}</p>
        </div>
        <Badge variant="outline" className={`text-[10px] flex items-center gap-0.5 shrink-0 px-1.5 py-0.5 ${cls}`}>{icon}</Badge>
      </div>

      {/* Sprint phase stepper */}
      <SprintPhaseStepper
        phases={sprint?.phases}
        allCompleted={sprint?.status === 'Completed'}
      />

      <div className="flex items-center justify-between pt-1 border-t border-border">
        <div className="flex items-center gap-2">
          {overdue > 0 && <span className="flex items-center gap-0.5 text-[10px] text-destructive"><Clock className="w-2.5 h-2.5" />{overdue}</span>}
          {activeRisks > 0 && <span className="flex items-center gap-0.5 text-[10px] text-yellow-400"><ShieldAlert className="w-2.5 h-2.5" />{activeRisks}</span>}
          {overdue === 0 && activeRisks === 0 && <span className="text-[10px] text-muted-foreground">Sp.{sprint?.number} · {project.completedSprints}/{project.totalSprints}</span>}
        </div>
        <span className="text-[10px] text-muted-foreground">{project.velocity} pts/sp</span>
      </div>
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────

export default function PhaseBoard({ projects }: { projects: Project[] }) {
  const waterfallProjects = projects.filter(p => p.type === 'waterfall');
  const scrumProjects = projects.filter(p => p.type === 'scrum');

  // Bucket waterfall projects into phase columns
  const buckets: Record<string, Project[]> = Object.fromEntries(
    WATERFALL_PHASES.map(ph => [ph, []])
  );
  for (const project of waterfallProjects) {
    const col = getCurrentPhaseName(project);
    if (col === 'Completed' || col === 'Not Started') {
      // Completed → Post-Release, Not Started → Design
      const target = col === 'Completed' ? 'Post-Release' : 'Design';
      buckets[target].push(project);
    } else {
      buckets[col].push(project);
    }
  }

  return (
    <div className="space-y-6">
      {/* Phase Board */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Layers className="w-4 h-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold">Waterfall Phase Board</h3>
          <span className="text-xs text-muted-foreground">({waterfallProjects.length} projects)</span>
        </div>

        {/* Horizontal scroll wrapper */}
        <div className="overflow-x-auto pb-3">
          <div className="flex gap-3" style={{ minWidth: 'max-content' }}>
            {WATERFALL_PHASES.map(phase => (
              <PhaseColumn
                key={phase}
                phase={phase}
                projects={buckets[phase] ?? []}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Scrum projects section */}
      {scrumProjects.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <GitBranch className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold">Scrum Projects</h3>
            <span className="text-xs text-muted-foreground">({scrumProjects.length} projects — sprint-based)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {scrumProjects.map(p => <ScrumMiniCard key={p.id} project={p} />)}
          </div>
        </div>
      )}
    </div>
  );
}
