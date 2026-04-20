import { loadAllMetricsMerged } from "@/lib/parser/metrics";
import { ProjectCard } from "@/components/ProjectCard";
import { ProjectMetrics } from "@/lib/schema";

export const dynamic = "force-dynamic";

const riskOrder: Record<ProjectMetrics["riskLevel"], number> = {
  Critical: 0, High: 1, Medium: 2, Low: 3,
};

export default function PortfolioPage() {
  const projects = loadAllMetricsMerged();

  const alerts = projects.flatMap((p) =>
    p.flags.map((f) => ({ code: p.projectCode, flag: f, level: p.riskLevel }))
  ).sort((a, b) => riskOrder[a.level] - riskOrder[b.level]);

  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Portfolio</h1>
          <p className="text-sm text-gray-500 mt-0.5">{projects.length} projects · {today}</p>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <a href="/resource" className="text-xs px-3 py-1.5 rounded border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
            Resource →
          </a>
          {(["Critical", "High", "Medium", "Low"] as ProjectMetrics["riskLevel"][]).map((level) => {
            const count = projects.filter((p) => p.riskLevel === level).length;
            if (count === 0) return null;
            const colors: Record<string, string> = {
              Critical: "text-red-700 bg-red-50 border-red-200",
              High: "text-orange-700 bg-orange-50 border-orange-200",
              Medium: "text-yellow-700 bg-yellow-50 border-yellow-200",
              Low: "text-green-700 bg-green-50 border-green-200",
            };
            return (
              <span key={level} className={`px-2 py-1 rounded border text-xs font-medium ${colors[level]}`}>
                {count} {level}
              </span>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {projects.map((m) => (
          <ProjectCard key={m.projectCode} m={m} />
        ))}
      </div>

      {alerts.length > 0 && (
        <section>
          <h2 className="text-sm font-semibold text-gray-700 mb-2 uppercase tracking-wide">
            Active Alerts
          </h2>
          <div className="rounded-lg border bg-white divide-y">
            {alerts.map((a, i) => {
              const colors: Record<string, string> = {
                Critical: "text-red-700", High: "text-orange-600",
                Medium: "text-yellow-600", Low: "text-gray-500",
              };
              return (
                <div key={i} className="flex items-start gap-3 px-4 py-3">
                  <span className={`text-xs font-semibold mt-0.5 w-16 shrink-0 ${colors[a.level]}`}>
                    [{a.level}]
                  </span>
                  <span className="text-xs font-mono text-gray-400 mt-0.5 shrink-0">{a.code}</span>
                  <span className="text-sm text-gray-700">{a.flag}</span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {projects.length === 0 && (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">No processed metrics found.</p>
          <p className="text-sm mt-1">Run the pipeline first to generate <code>processed/*/metrics-*.md</code></p>
        </div>
      )}
    </main>
  );
}
