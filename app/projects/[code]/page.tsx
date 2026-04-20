import { notFound } from "next/navigation";
import Link from "next/link";
import { loadAllMetricsMerged } from "@/lib/parser/metrics";
import { loadSprintFile } from "@/lib/parser/sprint";
import { loadInsights } from "@/lib/parser/insights";
import { TaskTable } from "@/components/TaskTable";
import { InsightPanel } from "@/components/InsightPanel";
import { RiskBadge } from "@/components/RiskBadge";
import { DualProgressBar } from "@/components/DualProgressBar";
import { DailyFocusPanel } from "@/components/DailyFocusPanel";
import { deriveProjectStatus, STATUS_CONFIG } from "@/lib/projectStatus";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({ params }: { params: Promise<{ code: string }> }) {
  const { code: rawCode } = await params;
  const code = rawCode.toUpperCase();
  const allMetrics = loadAllMetricsMerged();
  const metrics = allMetrics.find((m) => m.projectCode === code);

  if (!metrics) notFound();

  const sprint = loadSprintFile(code);
  const insights = loadInsights(code);

  const timePct = metrics.totalDays > 0 ? (metrics.daysElapsed / metrics.totalDays) * 100 : 0;
  const today = new Date().toISOString().split("T")[0];

  const taskCounts = {
    total: sprint.tasks.length,
    done: sprint.tasks.filter((t) => t.status === "Done").length,
    inProgress: sprint.tasks.filter((t) => t.status === "In Progress").length,
    blocked: sprint.tasks.filter((t) => t.status === "Blocked").length,
    overdue: sprint.tasks.filter((t) => t.overduedays !== null && t.overduedays > 0).length,
  };

  const status    = deriveProjectStatus(metrics);
  const statusCfg = STATUS_CONFIG[status];

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center gap-4">
        <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
          ← Portfolio
        </Link>
        <span className="text-gray-300">/</span>
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold text-gray-900">{code}</h1>
          <span className="text-gray-400">—</span>
          <span className="text-gray-600">{metrics.projectName}</span>
          <RiskBadge level={metrics.riskLevel} />
          <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusCfg.className}`}>
            {statusCfg.label}
          </span>
          <span className="text-xs text-gray-400 border rounded px-1.5 py-0.5">{metrics.type}</span>
        </div>
      </div>

      <div className="p-6 space-y-6">
        {/* Daily Focus */}
        <DailyFocusPanel
          tasks={sprint.tasks}
          sprintProgressPct={timePct}
          today={today}
        />

        {/* Summary bar */}
        <div className="bg-white rounded-lg border p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">
                {metrics.period.start} → {metrics.period.end}
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                Day {metrics.daysElapsed} of {metrics.totalDays} · {metrics.daysRemaining} days remaining
              </p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-gray-900">{metrics.riskScore}<span className="text-sm font-normal text-gray-400">/10</span></p>
              <p className="text-xs text-gray-400">risk score</p>
            </div>
          </div>

          <DualProgressBar completionPct={metrics.completion.completionRate} timePct={timePct} />

          <div className="grid grid-cols-5 gap-3 text-center pt-1">
            {[
              { label: "Total", value: taskCounts.total, warn: false },
              { label: "Done", value: taskCounts.done, warn: false },
              { label: "In Progress", value: taskCounts.inProgress, warn: false },
              { label: "Blocked", value: taskCounts.blocked, warn: taskCounts.blocked > 0 },
              { label: "Overdue", value: taskCounts.overdue, warn: taskCounts.overdue > 0 },
            ].map(({ label, value, warn }) => (
              <div key={label} className={`rounded p-2 ${warn ? "bg-red-50" : "bg-gray-50"}`}>
                <p className={`text-lg font-bold ${warn ? "text-red-700" : "text-gray-800"}`}>{value}</p>
                <p className="text-xs text-gray-400">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tasks + Insights two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Tasks — wider */}
          <div className="lg:col-span-3 bg-white rounded-lg border p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
              Tasks ({sprint.tasks.length})
            </h2>
            {sprint.tasks.length > 0
              ? <TaskTable tasks={sprint.tasks} projectCode={code} timeLogByTask={sprint.timeLogByTask} />
              : <p className="text-sm text-gray-400 italic">No tasks found in sprint file.</p>
            }
            {sprint.warnings.length > 0 && (
              <p className="text-xs text-gray-300 mt-3 italic">{sprint.warnings.join("; ")}</p>
            )}
          </div>

          {/* Insights — narrower */}
          <div className="lg:col-span-2 bg-white rounded-lg border p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Insights</h2>
              {insights.insightsDate && (
                <span className="text-xs text-gray-400">{insights.insightsDate}</span>
              )}
            </div>
            <InsightPanel data={insights} />
          </div>
        </div>
      </div>
    </main>
  );
}
