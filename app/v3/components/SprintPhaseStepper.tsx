/**
 * Reusable sprint phase stepper — used in project card, phase board, and detail page.
 * Shows the 7-phase pipeline for a Scrum sprint.
 */
import { ChevronRight } from 'lucide-react';
import { SPRINT_PHASES, SprintPhase, PhaseStatus } from '@/data/mockData';

const SHORT_LABELS: Record<string, string> = {
  'Planning':               'Plan',
  'PBI Approval':           'PBI',
  'Implementation + UT':    'Dev+UT',
  'Verification + Fix Bug': 'QA+Fix',
  'Review':                 'Review',
  'Release':                'Rel.',
  'Retrospective':          'Retro',
};

const BAR_COLOR: Record<PhaseStatus, string> = {
  'Completed': 'bg-emerald-500',
  'On Track':  'bg-primary',
  'At Risk':   'bg-yellow-500',
  'Delayed':   'bg-destructive',
  'To Do':     'bg-muted/40',
};

const LABEL_COLOR: Record<PhaseStatus, string> = {
  'Completed': 'text-emerald-400',
  'On Track':  'text-primary',
  'At Risk':   'text-yellow-400',
  'Delayed':   'text-destructive',
  'To Do':     'text-muted-foreground/50',
};

interface Props {
  /** phases array from the sprint — if undefined, derives from sprint.status */
  phases?: SprintPhase[];
  /** if true and no phases, all bars show Completed */
  allCompleted?: boolean;
  /** show short text labels below bars */
  showLabels?: boolean;
}

export default function SprintPhaseStepper({ phases, allCompleted, showLabels = true }: Props) {
  // Resolve effective phases
  const effective: { name: string; status: PhaseStatus }[] = SPRINT_PHASES.map(name => {
    if (phases) {
      const found = phases.find(p => p.name === name);
      return { name, status: found?.status ?? 'To Do' };
    }
    return { name, status: allCompleted ? 'Completed' : 'To Do' };
  });

  return (
    <div className="flex items-center gap-0.5">
      {effective.map((ph, idx) => (
        <div key={ph.name} className="flex items-center flex-1 min-w-0">
          <div
            className="flex-1 flex flex-col items-center gap-0.5"
            title={`${ph.name}: ${ph.status}`}
          >
            <div className={`w-full h-1.5 rounded-full transition-colors ${BAR_COLOR[ph.status]}`} />
            {showLabels && (
              <span className={`text-[9px] font-medium leading-none truncate w-full text-center ${LABEL_COLOR[ph.status]}`}>
                {SHORT_LABELS[ph.name]}
              </span>
            )}
          </div>
          {idx < effective.length - 1 && (
            <ChevronRight className="w-2 h-2 text-muted-foreground/30 flex-shrink-0 -mx-0.5" />
          )}
        </div>
      ))}
    </div>
  );
}
