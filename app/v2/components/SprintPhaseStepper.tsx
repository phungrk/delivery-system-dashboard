import { ChevronRight } from "lucide-react";
import type { PhaseStatus, SprintPhase } from "../mockData";
import { resolveSprintPhases, SPRINT_PHASE_SHORT_LABEL } from "../scrum";

interface SprintPhaseStepperProps {
  phases?: SprintPhase[];
  allCompleted?: boolean;
  showLabels?: boolean;
}

const BAR_CLASS: Record<PhaseStatus, string> = {
  "Completed": "bg-emerald-500",
  "On Track":  "bg-primary",
  "At Risk":   "bg-yellow-500",
  "Delayed":   "bg-destructive",
  "To Do":     "bg-muted/40",
};

const LABEL_CLASS: Record<PhaseStatus, string> = {
  "Completed": "text-emerald-400",
  "On Track":  "text-primary",
  "At Risk":   "text-yellow-400",
  "Delayed":   "text-destructive",
  "To Do":     "text-muted-foreground/50",
};

export function SprintPhaseStepper({ phases, allCompleted, showLabels = true }: SprintPhaseStepperProps) {
  const resolved = resolveSprintPhases(allCompleted ? { status: "Completed", phases } : { status: "Planning", phases });

  return (
    <div className="flex items-center gap-0.5 w-full">
      {resolved.map((phase, i) => {
        return (
          <div key={phase.name} className="flex items-center flex-1 min-w-0 gap-0.5">
            <div className="flex-1 flex flex-col items-center gap-0.5 min-w-0">
              <div
                className={`w-full h-1.5 rounded-full ${BAR_CLASS[phase.status]}`}
                title={`${phase.name}: ${phase.status}`}
              />
              {showLabels && (
                <span className={`text-[9px] font-medium truncate ${LABEL_CLASS[phase.status]}`}>
                  {SPRINT_PHASE_SHORT_LABEL[phase.name]}
                </span>
              )}
            </div>
            {i < resolved.length - 1 && (
              <ChevronRight className="w-2 h-2 text-muted-foreground/30 -mx-0.5 flex-shrink-0" />
            )}
          </div>
        );
      })}
    </div>
  );
}
