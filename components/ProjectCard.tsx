import Link from "next/link";
import { ProjectMetrics } from "@/lib/schema";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RiskBadge } from "./RiskBadge";
import { DualProgressBar } from "./DualProgressBar";
import { deriveProjectStatus, STATUS_CONFIG } from "@/lib/projectStatus";

const cardBorder: Record<ProjectMetrics["riskLevel"], string> = {
  Low:      "border-green-300",
  Medium:   "border-yellow-300",
  High:     "border-orange-400",
  Critical: "border-red-500 shadow-red-100 shadow-md",
};

export function ProjectCard({ m }: { m: ProjectMetrics }) {
  const timePct = m.totalDays > 0 ? (m.daysElapsed / m.totalDays) * 100 : 0;
  const spof = m.workload.find((w) => w.total > 0 && (w.total / m.workload.reduce((s, x) => s + x.total, 0)) > 0.7);
  const status = deriveProjectStatus(m);
  const statusCfg = STATUS_CONFIG[status];

  return (
    <Link href={`/projects/${m.projectCode}`} className="h-full">
    <Card className={`h-full flex flex-col border-2 ${cardBorder[m.riskLevel]} hover:shadow-md transition-shadow cursor-pointer`}>
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="text-base font-semibold">{m.projectCode}</CardTitle>
            <p className="text-sm text-gray-500 mt-0.5">{m.projectName}</p>
          </div>
          <div className="flex flex-col items-end gap-1.5">
            <RiskBadge level={m.riskLevel} />
            <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusCfg.className}`}>
              {statusCfg.label}
            </span>
            <span className="text-xs text-gray-400">{m.type}</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col flex-1 space-y-3">
        <DualProgressBar completionPct={m.completion.completionRate} timePct={timePct} />

        <div className="grid grid-cols-3 gap-2 text-center">
          <Stat label="Overdue" value={`${m.completion.overdueRate.toFixed(0)}%`} danger={m.completion.overdueRate > 30} />
          <Stat label="Blocked" value={String(m.activeBlockers)} danger={m.activeBlockers > 0} />
          <Stat label="Days left" value={String(m.daysRemaining)} danger={m.daysRemaining < 7} />
        </div>

        <div className="flex-1 space-y-1">
          {m.flags.map((f, i) => (
            <p key={i} className="text-xs text-orange-700 bg-orange-50 rounded px-2 py-1 leading-snug">
              ⚠ {f}
            </p>
          ))}
          {spof && (
            <p className="text-xs text-red-600 bg-red-50 rounded px-2 py-1">
              ⚠ SPOF: {spof.owner} owns {spof.total}/{m.workload.reduce((s, x) => s + x.total, 0)} tasks
            </p>
          )}
          {m.warnings.length > 0 && (
            <p className="text-xs text-gray-400 italic">
              Parse warnings: {m.warnings.join("; ")}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}

function Stat({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return (
    <div className={`rounded p-1.5 ${danger ? "bg-red-50" : "bg-gray-50"}`}>
      <p className={`text-sm font-semibold ${danger ? "text-red-700" : "text-gray-700"}`}>{value}</p>
      <p className="text-xs text-gray-400">{label}</p>
    </div>
  );
}
