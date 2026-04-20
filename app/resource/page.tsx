import Link from "next/link";
import { loadResourceData } from "@/lib/parser/resource";
import { ResourceTable } from "@/components/ResourceTable";

export const dynamic = "force-dynamic";

export default function ResourcePage() {
  const data = loadResourceData();

  const today = new Date().toLocaleDateString("vi-VN", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });

  // Compute summary stats
  const overloadedThisWeek = data.weeks[0]
    ? data.members.filter((m) => data.memberData[m].weeks[data.weeks[0]]?.badge === "OVER")
    : [];

  const totalFreeSlots = data.weeks[0]
    ? data.members.reduce((sum, m) => {
        const cell = data.memberData[m].weeks[data.weeks[0]];
        return sum + Math.max(0, cell?.available ?? 0);
      }, 0)
    : 0;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Top bar */}
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-400 hover:text-gray-700 transition-colors">
            ← Portfolio
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-lg font-bold text-gray-900">Resource Capacity</h1>
        </div>
        <span className="text-xs text-gray-400">{today} · {data.members.length} members · {data.weeks.length} weeks</span>
      </div>

      <div className="p-6 space-y-4">
        {/* Summary chips */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-white border rounded-lg px-4 py-2.5 flex items-center gap-3">
            <span className="text-xs text-gray-500 uppercase tracking-wide">Capacity</span>
            <span className="text-sm font-semibold text-gray-800">{data.capacity}h / member / wk</span>
          </div>

          {overloadedThisWeek.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-2.5 flex items-center gap-2">
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wide">Overloaded</span>
              <span className="text-sm font-bold text-red-700">{overloadedThisWeek.join(", ")}</span>
              <span className="text-xs text-red-400">this week</span>
            </div>
          )}

          <div className={`border rounded-lg px-4 py-2.5 flex items-center gap-2 ${totalFreeSlots > 0 ? "bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"}`}>
            <span className="text-xs text-gray-500 uppercase tracking-wide">Free slots</span>
            <span className={`text-sm font-bold ${totalFreeSlots > 0 ? "text-blue-700" : "text-gray-400"}`}>
              +{totalFreeSlots}h
            </span>
            <span className="text-xs text-gray-400">this week</span>
          </div>

          {data.weeks.length === 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2.5 text-xs text-yellow-700">
              No forecast data — create <code className="font-mono">input/_capacity-forecast.md</code>
            </div>
          )}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-gray-400 font-medium">Legend:</span>
          {(["FREE", "PARTIAL", "FULL", "OVER"] as const).map((b) => {
            const colors: Record<string, string> = {
              FREE: "bg-blue-100 text-blue-600",
              PARTIAL: "bg-green-100 text-green-600",
              FULL: "bg-orange-100 text-orange-600",
              OVER: "bg-red-100 text-red-600",
            };
            const labels: Record<string, string> = {
              FREE: "FREE <50%",
              PARTIAL: "OK 50–90%",
              FULL: "FULL 91–100%",
              OVER: "OVER >100%",
            };
            return (
              <span key={b} className={`px-2 py-0.5 rounded font-semibold ${colors[b]}`}>
                {labels[b]}
              </span>
            );
          })}
        </div>

        {/* Main table */}
        {data.members.length > 0 ? (
          <ResourceTable data={data} />
        ) : (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No resource data found.</p>
            <p className="text-sm mt-1">
              Add entries to <code className="font-mono text-xs">input/_capacity-forecast.md</code>
            </p>
          </div>
        )}
      </div>
    </main>
  );
}
