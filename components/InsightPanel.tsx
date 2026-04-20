import { InsightsData, RiskLevel } from "@/lib/parser/insights";

const signalConfig: Record<RiskLevel, { icon: string; className: string; label: string }> = {
  critical: { icon: "🔴", label: "CRITICAL", className: "border-red-200 bg-red-50 text-red-900" },
  warning:  { icon: "🟡", label: "WARNING",  className: "border-yellow-200 bg-yellow-50 text-yellow-900" },
  info:     { icon: "🔵", label: "INFO",     className: "border-blue-200 bg-blue-50 text-blue-900" },
};

const priorityColors: Record<string, string> = {
  High:   "text-red-600 bg-red-50 border-red-200",
  Medium: "text-yellow-600 bg-yellow-50 border-yellow-200",
  Low:    "text-gray-500 bg-gray-50 border-gray-200",
};

export function InsightPanel({ data }: { data: InsightsData }) {
  if (!data.summary && data.signals.length === 0) {
    return <p className="text-sm text-gray-400 italic">No insights available. Run the pipeline to generate insights.</p>;
  }

  return (
    <div className="space-y-6">
      {/* Summary */}
      {data.summary && (
        <p className="text-sm text-gray-700 leading-relaxed">{data.summary}</p>
      )}

      {/* Risk signals */}
      {data.signals.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Risk Signals</h3>
          {data.signals.map((s, i) => {
            const cfg = signalConfig[s.level];
            return (
              <div key={i} className={`rounded-lg border px-3 py-2.5 text-sm ${cfg.className}`}>
                <span className="font-semibold mr-2">{cfg.icon} {cfg.label}</span>
                {s.text}
              </div>
            );
          })}
        </div>
      )}

      {/* Action items */}
      {data.actions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Action Items</h3>
          <div className="rounded-lg border bg-white divide-y">
            {data.actions.map((a, i) => (
              <div key={i} className="px-3 py-2.5 flex items-start gap-3">
                <span className={`text-xs px-1.5 py-0.5 rounded border font-medium shrink-0 mt-0.5 ${priorityColors[a.priority]}`}>
                  {a.priority}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800">{a.action}</p>
                  {a.owner && <p className="text-xs text-gray-400 mt-0.5">→ {a.owner}</p>}
                  {a.relatedTasks.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {a.relatedTasks.map((t) => (
                        <span key={t} className="text-xs font-mono bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Standup questions */}
      {data.standupQuestions.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Standup Questions</h3>
          <div className="space-y-1.5">
            {data.standupQuestions.map((q, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span className="text-gray-400 shrink-0">{i + 1}.</span>
                {q.person && <span className="font-medium text-gray-700 shrink-0">{q.person}:</span>}
                <span className="text-gray-600">{q.question}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Positives */}
      {data.positives.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-xs font-semibold uppercase text-gray-500 tracking-wide">Positives</h3>
          <ul className="space-y-1">
            {data.positives.map((p, i) => (
              <li key={i} className="text-sm text-gray-600 flex gap-2">
                <span className="text-green-500 shrink-0">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
